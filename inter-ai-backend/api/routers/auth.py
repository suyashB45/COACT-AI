from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
import datetime as dt
import jwt
import logging

from database import (
    get_user_by_email, 
    create_user,
    set_2fa_code,
    verify_2fa_code,
    update_user_password,
    RateLimitExceeded
)
from email_service import send_security_alert_email, send_otp_email
from core.config import JWT_SECRET
from core.dependencies import get_authenticated_user
from core.utils import generate_otp
from core.security import validate_password, validate_email
# login_limiter is in core.rate_limit ideally, we will mock or import it properly
# For now we'll import it from app.py or core.rate_limit if we created it. 
# Let's assume we'll move it to core.rate_limit

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
logger = logging.getLogger("coact")

# For the time being, we mock the dependency if not fully extracted
async def dummy_limiter():
    pass

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

@router.post("/login")
async def login(request: Request, user: UserLogin):
    from database import verify_password
    db_user = get_user_by_email(user.email)
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    access_token_expires = dt.timedelta(days=7)
    now = dt.datetime.now(dt.timezone.utc)
    expire = now + access_token_expires
    to_encode = {"sub": db_user["id"], "exp": expire, "iat": now}
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")
    
    return {"access_token": encoded_jwt, "token_type": "bearer", "user": {"id": db_user["id"], "email": db_user["email"]}}

@router.post("/register")
async def register(request: Request, user: UserRegister):
    if not validate_email(user.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    is_valid, error_msg = validate_password(user.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    db_user = get_user_by_email(user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = create_user(user.email, user.password)
    if not new_user:
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    access_token_expires = dt.timedelta(days=7)
    now = dt.datetime.now(dt.timezone.utc)
    expire = now + access_token_expires
    to_encode = {"sub": new_user["id"], "exp": expire, "iat": now}
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")
    
    return {"access_token": encoded_jwt, "token_type": "bearer", "user": {"id": new_user["id"], "email": new_user["email"], "name": new_user.get("name", "")}}

@router.post("/forgot-password")
async def forgot_password(request: Request, payload: ForgotPasswordRequest):
    """Send OTP to email for password reset. Always returns success to prevent email enumeration."""
    db_user = get_user_by_email(payload.email)
    if db_user:
        otp_code = generate_otp()
        try:
            set_2fa_code(db_user["id"], otp_code, "forgot_password")
            send_otp_email(db_user["email"], otp_code, "forgot_password", db_user.get("name", "User"))
            logger.info(f"Forgot-password OTP sent to {payload.email}")
        except RateLimitExceeded as e:
            raise HTTPException(status_code=429, detail=str(e))
        except Exception as e:
            logger.error(f"Failed to send forgot-password OTP: {e}")
    else:
        logger.info(f"Forgot-password requested for non-existent email: {payload.email}")
    return {"status": "otp_sent", "message": "If an account exists with this email, a verification code has been sent."}

@router.post("/reset-password")
async def reset_password(request: Request, payload: ResetPasswordRequest):
    """Verify OTP and reset password."""
    is_valid, error_msg = validate_password(payload.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    db_user = get_user_by_email(payload.email)
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or verification code")
    
    if not verify_2fa_code(db_user["id"], payload.otp, "forgot_password"):
        raise HTTPException(status_code=400, detail="Invalid, expired, or locked verification code")
    
    success = update_user_password(db_user["id"], payload.new_password)
    if success:
        send_security_alert_email(db_user["email"], "forgot_password", db_user.get("name", "User"))
        logger.info(f"Password reset successfully for {payload.email}")
        return {"status": "success", "message": "Password has been reset successfully"}
    raise HTTPException(status_code=500, detail="Failed to reset password")

@router.post("/sync")
async def sync_user(request: Request):
    """Local auth sync"""
    user = get_authenticated_user(request)
    return {"success": True, "user": {"id": user.id, "email": user.email}}
