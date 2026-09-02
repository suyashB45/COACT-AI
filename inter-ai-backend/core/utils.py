import secrets


def generate_otp(length: int = 6) -> str:
    """Generate a cryptographically secure OTP code."""
    return "".join(str(secrets.randbelow(10)) for _ in range(length))
