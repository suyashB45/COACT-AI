import os
import logging

# ---------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("coact-api")

# ---------------------------------------------------------
# Global Constants & Environment
# ---------------------------------------------------------
JWT_SECRET = os.getenv("JWT_SECRET")
IS_PRODUCTION = os.environ.get("FLASK_ENV") == "production"

if IS_PRODUCTION and (not JWT_SECRET or JWT_SECRET == "super-secret-key-change-in-production"):
    raise RuntimeError("SECURITY ERROR: JWT_SECRET must be securely configured in production!")

if not JWT_SECRET:
    JWT_SECRET = "super-secret-key-change-in-production"

DAILY_TOKEN_LIMIT = 50000

# CORS settings
CORS_ORIGINS_RAW = os.getenv("CORS_ORIGINS", "https://coact-ai.com,https://www.coact-ai.com")

if IS_PRODUCTION:
    # Never allow wildcard CORS in production
    if CORS_ORIGINS_RAW.strip() == "*":
        logger.error("CORS_ORIGINS cannot be set to '*' in production! Defaulting to coact-ai.com only.")
        CORS_ORIGINS_RAW = "https://coact-ai.com,https://www.coact-ai.com"

CORS_ORIGINS = [o.strip() for o in CORS_ORIGINS_RAW.split(",") if o.strip()]
