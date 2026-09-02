import asyncio
import datetime as dt
import os
import time
from typing import Optional

import jwt
from cachetools import TTLCache
from database import get_user_by_id
from fastapi import HTTPException, Request

from core.config import JWT_SECRET

# Enforce JWT Secret security at import/module load time
if os.environ.get("FLASK_ENV") == "production" and JWT_SECRET == "super-secret-key-change-in-production":
    raise RuntimeError("CRITICAL SECURITY VIOLATION: In production, JWT_SECRET must be configured!")

class DummyUser:
    def __init__(self, id: str, email: str):
        self.id = id
        self.email = email

class TokenBucketLimiter:
    """
    A secure, memory-bound Token Bucket Rate Limiter Dependency for FastAPI.
    Features IP spoofing defenses and automatic entry eviction to prevent memory-exhaustion.
    """
    def __init__(self, capacity: int, refill_rate_per_sec: float, max_ips: int = 10000):
        self.capacity = capacity
        self.refill_rate = refill_rate_per_sec
        # Use an LRU/TTL Cache to prevent memory growth attack (limits stored IPs to 10k max)
        self.buckets: TTLCache = TTLCache(maxsize=max_ips, ttl=3600)
        self._lock = asyncio.Lock()

    def _get_client_ip(self, request: Request) -> str:
        """Extract the client IP safely.
        
        ONLY trusts X-Forwarded-For if explicitly configured to do so behind a trusted proxy,
        otherwise falls back to the direct tcp client IP.
        """
        trust_proxy = os.getenv("TRUST_PROXY", "false").lower() == "true"
        if trust_proxy:
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
            # Initialize bucket if new IP (auto-evicts oldest if maxsize is exceeded)
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

def get_authenticated_user(request: Optional[Request] = None) -> DummyUser:
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


def enforce_ai_rate_limits(request: Request) -> None:
    """Optional-auth dependency that enforces token-based AI usage limits.

    Authenticated users are accounted per-user (request/min + hourly input/output
    tokens + daily total). Unauthenticated/guest requests pass through; the existing
    per-IP token-bucket limiter still covers them. Raises AiRateLimitExceeded (429)
    when a limit is hit; its handler in app.py returns the structured payload.
    """
    try:
        user = get_authenticated_user(request)
    except HTTPException:
        return None

    from services.usage import AiRateLimitExceeded, check_and_consume
    denied = check_and_consume(user.id)
    if denied is not None:
        raise AiRateLimitExceeded(denied)
    return None
