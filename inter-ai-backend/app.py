import os
import json
import re
import asyncio
import uuid
import datetime as dt
import tempfile
import secrets
import logging
import numpy as np
import concurrent.futures
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, Request, Response, UploadFile, File, Form, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import io
from dotenv import load_dotenv
from cachetools import TTLCache
from functools import lru_cache
from fastapi import HTTPException
from langsmith import traceable

load_dotenv()
# ---------------------------------------------------------
# Structured Logging Configuration
# ---------------------------------------------------------
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S"
)
logger = logging.getLogger("coact")

# ---------------------------------------------------------
# Production Security Utilities
# ---------------------------------------------------------
def generate_otp(length: int = 6) -> str:
    """Generate a cryptographically secure OTP code."""
    return "".join(str(secrets.randbelow(10)) for _ in range(length))

def validate_password(password: str) -> tuple[bool, str]:
    """Validate password meets minimum security requirements.
    Returns (is_valid, error_message)."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one digit"
    return True, ""

def validate_email(email: str) -> bool:
    """Validate email format."""
    return bool(re.match(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$', email))

def sanitize_input(text: str, max_length: int = 2000) -> str:
    """Sanitize user input for LLM prompts — strip control chars and limit length."""
    if not text:
        return ""
    # Remove null bytes and other control characters (except newlines/tabs)
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    return cleaned[:max_length].strip()


# Proxy config moved to top

import jwt
from functools import wraps

# JWT configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "super-secret-key-change-in-production")
if os.environ.get("FLASK_ENV") == "production" and JWT_SECRET == "super-secret-key-change-in-production":
    raise RuntimeError("SECURITY ERROR: JWT_SECRET must be configured in production!")
# ---------------------------------------------------------
# Custom Modules & Setup
# ---------------------------------------------------------
from cli_report import generate_report, llm_reply, analyze_full_report_data, detect_scenario_type
from database import get_user_analytics_from_db, get_session_from_db, get_user_sessions_from_db, save_session_to_db, get_previous_session_scores, clear_user_sessions_from_db, check_token_limit, add_token_usage, check_monthly_session_limit, create_user, get_user_by_email, get_user_by_id, verify_password, delete_user_account, update_user_name, update_user_password, enable_2fa, disable_2fa, set_2fa_code, verify_2fa_code, RateLimitExceeded
from email_service import send_security_alert_email, send_otp_email
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
# Database Models
USE_DATABASE = True # Re-enabled database persistence

# Create Flask app
from database import db, engine, Base
from contextlib import asynccontextmanager
import httpx

Base.metadata.create_all(bind=engine)

# Global connection pool for Sarvam API (reduces latency by eliminating TCP handshake)
shared_httpx_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global shared_httpx_client
    shared_httpx_client = httpx.AsyncClient(http2=False, timeout=60.0, limits=httpx.Limits(max_keepalive_connections=20))
    yield
    await shared_httpx_client.aclose()

from fastapi import Depends
import time

class TokenBucketLimiter:
    """
    A custom Token Bucket Rate Limiter Dependency for FastAPI.
    Maintains a steady flow of allowed requests, with support for initial bursts.
    """
    def __init__(self, capacity: int, refill_rate_per_sec: float):
        self.capacity = capacity
        self.refill_rate = refill_rate_per_sec
        # Maps IP to (tokens, last_refill_timestamp)
        self.buckets: Dict[str, tuple[float, float]] = {}
        self._lock = asyncio.Lock()

    def _get_client_ip(self, request: Request) -> str:
        """Extract the client IP address, respecting proxy headers."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client:
            return request.client.host
        return "127.0.0.1"

    async def __call__(self, request: Request):
        ip = self._get_client_ip(request)
        now = time.time()

        async with self._lock:
            # Initialize bucket if new IP
            if ip not in self.buckets:
                self.buckets[ip] = (float(self.capacity), now)
            
            tokens, last_refill = self.buckets[ip]
            
            # Refill tokens based on elapsed time
            elapsed = now - last_refill
            new_tokens = tokens + (elapsed * self.refill_rate)
            
            # Cap at max capacity
            if new_tokens > self.capacity:
                new_tokens = float(self.capacity)
                
            # Check if request is allowed
            if new_tokens >= 1.0:
                # Consume 1 token
                self.buckets[ip] = (new_tokens - 1.0, now)
            else:
                # Calculate time to wait for 1 token
                wait_time = (1.0 - new_tokens) / self.refill_rate
                raise HTTPException(
                    status_code=429, 
                    detail=f"Too Many Requests. Please wait {wait_time:.1f} seconds."
                )

login_limiter = TokenBucketLimiter(capacity=5, refill_rate_per_sec=5.0 / 60.0)
standard_limiter = TokenBucketLimiter(capacity=30, refill_rate_per_sec=30.0 / 60.0)

is_prod = os.environ.get("FLASK_ENV") == "production"

app = FastAPI(
    lifespan=lifespan,
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json"
)
# Enable CORS
cors_origins_raw = os.getenv("CORS_ORIGINS", "https://coact-ai.com,https://www.coact-ai.com")
# SECURITY: Never allow wildcard CORS in production
if os.environ.get("FLASK_ENV") == "production" and cors_origins_raw.strip() == "*":
    logger.warning("CORS_ORIGINS is set to '*' in production! Defaulting to coact-ai.com only.")
    cors_origins_raw = "https://coact-ai.com,https://www.coact-ai.com"
cors_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# ---------------------------------------------------------
# Security Headers Middleware
# ---------------------------------------------------------
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if os.environ.get("FLASK_ENV") == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ---------------------------------------------------------
# Global Exception Handler (prevents stack trace leakage)
# ---------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions and return a generic error to clients."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "An internal server error occurred. Please try again later."}
    )

# Default max tokens per user per day
DAILY_TOKEN_LIMIT = 50000

# ---------------------------------------------------------
# In-Memory Storage with TTL Cache (Auto-cleanup, prevents memory leaks)
# ---------------------------------------------------------
import redis

class UnifiedCache:
    def __init__(self, maxsize=500, ttl=3600):
        self.redis_url = os.getenv("REDIS_URL")
        if self.redis_url:
            try:
                self.redis = redis.Redis.from_url(self.redis_url, decode_responses=True)
                logger.info(f"Connected to Redis for session cache: {self.redis_url}")
            except Exception as e:
                logger.info(f"[WARNING] Redis connection failed, falling back to TTLCache: {e}")
                self.redis = None # type: ignore
        else:
            self.redis = None # type: ignore
            
        if not self.redis:
            self.local_cache = TTLCache(maxsize=maxsize, ttl=ttl)

    def __getitem__(self, key):
        if self.redis is not None:
            val = self.redis.get(f"session:{key}")
            if val is None:
                raise KeyError(key)
            return json.loads(val)
        return self.local_cache[key]

    def __setitem__(self, key, value):
        if self.redis is not None:
            self.redis.setex(f"session:{key}", 3600, json.dumps(value))
        else:
            self.local_cache[key] = value

    def __contains__(self, key):
        if self.redis is not None:
            return self.redis.exists(f"session:{key}") > 0
        return key in self.local_cache

    def get(self, key, default=None):
        if self.redis is not None:
            val = self.redis.get(f"session:{key}")
            if val is None:
                return default
            return json.loads(val)
        return self.local_cache.get(key, default)

    def __delitem__(self, key):
        if self.redis is not None:
            self.redis.delete(f"session:{key}")
        else:
            del self.local_cache[key]


    def items(self):
        if self.redis is not None:
            keys = self.redis.keys("session:*")
            items = []
            for k in keys:
                v = self.redis.get(k)
                if v:
                    k_str = k if isinstance(k, str) else k.decode('utf-8')
                    items.append((k_str.replace("session:", ""), json.loads(v)))
            return items
        return self.local_cache.items()

    def values(self):
        if self.redis is not None:
            keys = self.redis.keys("session:*")
            vals = []
            for k in keys:
                v = self.redis.get(k)
                if v:
                    vals.append(json.loads(v))
            return vals
        return self.local_cache.values()

SESSIONS = UnifiedCache(maxsize=500, ttl=3600)

# ---------------------------------------------------------
# Hybrid Storage Helper Functions
# ---------------------------------------------------------
def get_session(session_id: str, force_db_refresh: bool = False) -> Optional[Dict[str, Any]]:
    """Get session from in-memory storage or database."""
    if not force_db_refresh and session_id in SESSIONS:
        return SESSIONS[session_id]
    
    # Try database
    db_session = get_session_from_db(session_id)
    if db_session:
        SESSIONS[session_id] = db_session
        return db_session
    
    # Fallback to returning the stale session if DB fetch fails but memory exists
    if session_id in SESSIONS:
        return SESSIONS[session_id]
        
    return None

class DummyUser:
    def __init__(self, id, email):
        self.id = id
        self.email = email

def get_authenticated_user(request: Optional[Request] = None):
    if not request:
        raise HTTPException(status_code=401, detail="Unauthorized - No request provided")
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized - Invalid token format")
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        iat = payload.get("iat")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    user = get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
        
    # Check if token was issued before the password was last changed
    pwd_changed = user.get("password_changed_at")
    if pwd_changed and iat:
        try:
            pwd_changed_dt = dt.datetime.fromisoformat(pwd_changed.replace('Z', '+00:00'))
            if pwd_changed_dt.tzinfo is None:
                pwd_changed_dt = pwd_changed_dt.replace(tzinfo=dt.timezone.utc)
            if iat < pwd_changed_dt.timestamp():
                raise HTTPException(status_code=401, detail="Token expired due to password change")
        except ValueError:
            pass # ignore invalid date format

    return DummyUser(id=user["id"], email=user["email"])


def verify_session_ownership(session_id: str, user_id: Optional[str] = None) -> bool:
    """Verify that the session belongs to the specified user."""
    sess = get_session(session_id)
    if not sess:
        return False
    
    # If no user_id provided, always allow (backward compatibility for unauthenticated sessions)
    if not user_id:
        return True
    
    # Check if session has user_id field
    session_user_id = sess.get("user_id")
    if not session_user_id:
        # Legacy session without user_id - allow access
        return True
    
    # Compare user IDs
    return session_user_id == user_id

# ---------------------------------------------------------
# Configuration & Paths
# ---------------------------------------------------------

# --- ROUTER IMPORTS ---
from api.routers import auth, users, simulation, system
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(simulation.router)
app.include_router(system.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
