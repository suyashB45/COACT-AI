from pydantic import BaseModel, ConfigDict
from typing import Optional

# ---------------------------------------------------------
# Auth & User Schemas
# ---------------------------------------------------------

# Base configuration to forbid extra fields to prevent injection attacks
class StrictBaseModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

class UserLogin(StrictBaseModel):
    email: str
    password: str

class UserRegister(StrictBaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: str
    password: str

class ForgotPasswordRequest(StrictBaseModel):
    email: str

class ResetPasswordRequest(StrictBaseModel):
    email: str
    otp: str
    new_password: str

class UpdateNameRequest(StrictBaseModel):
    new_name: str

class UpdatePasswordRequest(StrictBaseModel):
    current_password: str
    new_password: str

class VerifyUpdatePasswordRequest(StrictBaseModel):
    otp: str
    new_password: str

class Toggle2FARequest(StrictBaseModel):
    action: str  # "enable" or "disable"
    password: str

class VerifyDeleteAccountRequest(StrictBaseModel):
    otp: str

# ---------------------------------------------------------
# Session & Coaching Schemas (Newly introduced for type safety)
# ---------------------------------------------------------

class SessionStartRequest(StrictBaseModel):
    role: str = ""
    ai_role: str = ""
    scenario: str = ""
    title: Optional[str] = None
    framework: str = "auto"
    flip_roles: bool = False
    language: str = "en"

class ChatRequest(StrictBaseModel):
    message: str
    mode: str = "text"
    language: str = "en"
    flip_roles: bool = False
