import re
import unicodedata
from typing import Tuple

# Bounded email regex to prevent ReDoS (catastrophic backtracking)
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9][a-zA-Z0-9.\-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$"
)

def validate_password(password: str) -> Tuple[bool, str]:
    """Validate password meets minimum security requirements.
    Returns (is_valid, error_message)."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if len(password) > 128:  # Bounded length to prevent hash calculation exhaustion DoS
        return False, "Password cannot exceed 128 characters"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one digit"
    return True, ""

def validate_email(email: str) -> bool:
    """Validate email format with length restrictions and safe regex matching."""
    if not email or len(email) > 254:  # RFC 5321 length limit
        return False
    return bool(EMAIL_REGEX.match(email))

def sanitize_input(text: str, max_length: int = 2000) -> str:
    """Sanitize user input for LLM prompts.
    
    Strips ASCII control characters, Unicode line/paragraph separators,
    and normalizes character representations to prevent prompt injection obfuscation.
    """
    if not text:
        return ""
    
    # Limit length first to prevent processing overhead on huge payloads
    text = text[:max_length]
    
    # Normalize unicode to canonical representation (NFC)
    text = unicodedata.normalize("NFC", text)
    
    # Clean ASCII control characters
    text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
    
    # Clean unicode separators and formatting marks (zero-width characters, line/paragraph separators)
    text = re.sub(r'[\u2028\u2029\u200b-\u200d\ufeff]', ' ', text)
    
    # Strip markdown images to prevent data exfiltration
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)
    
    return text.strip()
