import logging

from core.config import MONTHLY_SESSION_LIMIT, MONTHLY_TOKEN_LIMIT
from database import (
    RateLimitExceeded,
    delete_user_account,
    disable_2fa,
    enable_2fa,
    get_user_by_id,
    get_user_usage,
    set_2fa_code,
    update_user_name,
    update_user_password,
    verify_2fa_code,
    verify_password,
)
from email_service import send_otp_email, send_security_alert_email
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger("coact")
router = APIRouter(prefix="/api/user", tags=["Users"])

from core.dependencies import get_authenticated_user
from core.utils import generate_otp


class UpdateNameRequest(BaseModel):
    name: str

@router.get("/usage")
async def get_usage(request: Request):
    user = get_authenticated_user(request)
    usage = get_user_usage(user.id)
    return {
        **usage,
        "monthly_token_limit": MONTHLY_TOKEN_LIMIT,
        "monthly_session_limit": MONTHLY_SESSION_LIMIT,
    }

@router.put("/name")
async def update_name(request: Request, payload: UpdateNameRequest):
    user = get_authenticated_user(request)
    success = update_user_name(user.id, payload.name)
    if success:
        return {"status": "success", "name": payload.name}
    raise HTTPException(status_code=500, detail="Failed to update name")

class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.put("/password")
async def update_password(request: Request, payload: UpdatePasswordRequest):
    from core.security import validate_password
    
    user = get_authenticated_user(request)
    db_user = get_user_by_id(user.id)
    if not db_user or not verify_password(payload.current_password, db_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    is_valid, error_msg = validate_password(payload.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
        
    otp_code = generate_otp()
    try:
        set_2fa_code(user.id, otp_code, "password_update")
    except RateLimitExceeded as e:
        raise HTTPException(status_code=429, detail=str(e))
        
    send_otp_email(db_user["email"], otp_code, "password_update", db_user.get("name", "User"))
    return {"status": "otp_required"}

class VerifyUpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    otp: str

@router.post("/password/verify")
async def verify_update_password(request: Request, payload: VerifyUpdatePasswordRequest):
    from core.security import validate_password
    
    user = get_authenticated_user(request)
    db_user = get_user_by_id(user.id)
    if not db_user or not verify_password(payload.current_password, db_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    if not verify_2fa_code(user.id, payload.otp, "password_update"):
        raise HTTPException(status_code=400, detail="Invalid, expired, or locked verification code")
        
    is_valid, error_msg = validate_password(payload.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
        
    success = update_user_password(user.id, payload.new_password)
    if success:
        send_security_alert_email(db_user["email"], "password_update", db_user.get("name", "User"))
        set_2fa_code(user.id, "", "password_update", expires_in_minutes=0)
        return {"status": "success"}
    raise HTTPException(status_code=500, detail="Failed to update password")

class Toggle2FARequest(BaseModel):
    enabled: bool

@router.put("/2fa")
async def toggle_2fa(request: Request, payload: Toggle2FARequest):
    user = get_authenticated_user(request)
    user_id_str = user.id
    db_user = get_user_by_id(user_id_str)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    otp_code = generate_otp()
    action = "enable_2fa" if payload.enabled else "disable_2fa"
    try:
        set_2fa_code(user_id_str, otp_code, action)
    except RateLimitExceeded as e:
        raise HTTPException(status_code=429, detail=str(e))

    send_otp_email(db_user["email"], otp_code, action, db_user.get("name", "User"))
    return {"status": "otp_required", "action": action}

class Verify2FARequest(BaseModel):
    otp: str
    enabled: bool

@router.post("/2fa/verify")
async def verify_toggle_2fa(request: Request, payload: Verify2FARequest):
    user = get_authenticated_user(request)
    user_id_str = user.id
    action = "enable_2fa" if payload.enabled else "disable_2fa"

    if not verify_2fa_code(user_id_str, payload.otp, action):
        raise HTTPException(status_code=400, detail="Invalid, expired, or locked verification code")

    if payload.enabled:
        success = enable_2fa(user_id_str)
    else:
        success = disable_2fa(user_id_str)

    if success:
        return {"status": "success", "is_2fa_enabled": payload.enabled}
    raise HTTPException(status_code=500, detail="Failed to toggle 2FA")

@router.delete("/account")
async def delete_account(request: Request):
    user = get_authenticated_user(request)
    user_id_str = user.id
    db_user = get_user_by_id(user_id_str)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    otp_code = generate_otp()
    try:
        set_2fa_code(user_id_str, otp_code, "account_deletion")
    except RateLimitExceeded as e:
        raise HTTPException(status_code=429, detail=str(e))
        
    send_otp_email(db_user["email"], otp_code, "account_deletion", db_user.get("name", "User"))
    return {"status": "otp_required"}

class VerifyDeleteAccountRequest(BaseModel):
    otp: str

@router.post("/account/verify")
async def verify_delete_account(request: Request, payload: VerifyDeleteAccountRequest):
    user = get_authenticated_user(request)
    user_id_str = user.id
    db_user = get_user_by_id(user_id_str)
    
    if not verify_2fa_code(user_id_str, payload.otp, "account_deletion"):
        raise HTTPException(status_code=400, detail="Invalid, expired, or locked verification code")
        
    success = delete_user_account(user_id_str)
    if success:
        if db_user:
            send_security_alert_email(db_user["email"], "account_deletion", db_user.get("name", "User"))
        return {"status": "success", "message": "Account deleted successfully"}
    raise HTTPException(status_code=500, detail="Failed to delete account")
