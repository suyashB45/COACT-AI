import logging
import os

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

MONTHLY_TOKEN_LIMIT = 50000
MONTHLY_SESSION_LIMIT = 3

# CORS settings
CORS_ORIGINS_RAW = os.getenv("CORS_ORIGINS", "")
CORS_ORIGINS = [o.strip() for o in CORS_ORIGINS_RAW.split(",") if o.strip()]

# ---------------------------------------------------------
# Token-based AI Usage Limits (rate limiting & quotas)
# ---------------------------------------------------------
from dataclasses import dataclass


@dataclass(frozen=True)
class AiRateLimits:
    """Token-based AI usage limits, configurable via environment variables.

    - requests_per_minute: max AI calls (chat/session/transcribe) per user per minute
    - input_tokens_per_hour: max LLM input tokens per user per hour
    - output_tokens_per_hour: max LLM output tokens per user per hour
    - daily_tokens_per_user: max total (input + output) tokens per user per day

    Each limit field maps to a stable "limit_type" string used in both the 429
    payload and the usage API, so plans (Free/Pro/Enterprise) can be supported
    later by swapping the limit set without touching the counting logic.
    """

    requests_per_minute: int = 30
    input_tokens_per_hour: int = 50000
    output_tokens_per_hour: int = 20000
    daily_tokens_per_user: int = 200000

    ENV_MAP = {
        "requests_per_minute": "RATE_LIMIT_REQUESTS_PER_MINUTE",
        "input_tokens_per_hour": "RATE_LIMIT_INPUT_TOKENS_PER_HOUR",
        "output_tokens_per_hour": "RATE_LIMIT_OUTPUT_TOKENS_PER_HOUR",
        "daily_tokens_per_user": "RATE_LIMIT_DAILY_TOKENS",
    }

    LIMIT_TYPES = {
        "requests_per_minute": "requests_per_minute",
        "input_tokens_per_hour": "hourly_input_tokens",
        "output_tokens_per_hour": "hourly_output_tokens",
        "daily_tokens_per_user": "daily_tokens",
    }

    @classmethod
    def from_env(cls) -> "AiRateLimits":
        kwargs = {}
        for field_name, env_name in cls.ENV_MAP.items():
            raw = os.getenv(env_name)
            if raw is not None and raw.strip().isdigit():
                kwargs[field_name] = int(raw.strip())
        return cls(**kwargs)

    def limit_attr(self, field_name: str) -> int:
        return getattr(self, field_name)

    def limit_type_name(self, field_name: str) -> str:
        return self.LIMIT_TYPES.get(field_name, field_name)


AI_RATE_LIMITS = AiRateLimits.from_env()
