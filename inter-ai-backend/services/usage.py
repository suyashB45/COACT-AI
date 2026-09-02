"""Token-based AI usage accounting, rate limiting, and quota enforcement.

Design notes
------------
- Single source of truth is the server: token counts are never trusted from the client.
- Counters are windowed and atomic:
  * requests  -> per UTC minute window
  * input tokens / output tokens -> per UTC hour window
  * total tokens -> per UTC day window
- Counters live in Redis when REDIS_URL is set (fastest, with TTLs), otherwise in
  MongoDB / SQLite via database.py. Redis failures automatically fall back to the DB,
  so a Redis outage never breaks the API.
- `usage_context()` + `record_llm_result()` let LLM call-sites (llm_reply, chain.invoke,
  async streams) report tokens without threading parameters through every layer.
- Organizations are not modeled yet; `organization_id` is threaded through the durable
  log and counter plumbing only, so org-level limits can be layered on later.
"""

import logging
import os
import uuid
from contextlib import contextmanager
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Optional

from core.config import AI_RATE_LIMITS

logger = logging.getLogger("coact.usage")

try:
    import redis
except ImportError:  # pragma: no cover - redis is in requirements.txt
    redis = None

_redis_client: Optional[object] = None

_SCOPES = {
    "requests_per_minute": "requests_per_minute",
    "input_tokens_per_hour": "input_tokens_per_hour",
    "output_tokens_per_hour": "output_tokens_per_hour",
    "daily_tokens_per_user": "daily_tokens_per_user",
}

# seconds to keep a counter key alive after its window starts
_WINDOW_TTL_SECONDS = {
    "requests_per_minute": 6 * 60,
    "input_tokens_per_hour": 60 * 60 * 2,
    "output_tokens_per_hour": 60 * 60 * 2,
    "daily_tokens_per_user": 60 * 60 * 25,
}


# ---------------------------------------------------------
# Window helpers (UTC)
# ---------------------------------------------------------
def _window_keys(now: datetime) -> dict:
    minute_key = now.strftime("%Y-%m-%dT%H:%M")
    hour_key = now.strftime("%Y-%m-%dT%H")
    day_key = now.strftime("%Y-%m-%d")
    return {"minute": minute_key, "hour": hour_key, "day": day_key}


def _reset_at(scope: str, now: datetime) -> datetime:
    if scope == "requests_per_minute":
        return now.replace(second=0, microsecond=0) + _minutes(1)
    if scope in ("input_tokens_per_hour", "output_tokens_per_hour"):
        return now.replace(minute=0, second=0, microsecond=0) + _hours(1)
    return now.replace(hour=0, minute=0, second=0, microsecond=0) + _days(1)


def _minutes(n):  # pragma: no cover - trivial
    from datetime import timedelta
    return timedelta(minutes=n)


def _hours(n):  # pragma: no cover - trivial
    from datetime import timedelta
    return timedelta(hours=n)


def _days(n):  # pragma: no cover - trivial
    from datetime import timedelta
    return timedelta(days=n)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------
# Store abstraction: Redis with DB fallback
# ---------------------------------------------------------
def _redis() -> Optional[object]:
    """Lazily create (and health-check) the shared Redis client."""
    global _redis_client
    if _redis_client is not None or redis is None:
        return _redis_client
    url = os.getenv("REDIS_URL")
    if not url:
        return None
    try:
        client = redis.Redis.from_url(
            url,
            decode_responses=True,
            socket_connect_timeout=1,
            socket_timeout=1,
            retry_on_timeout=True,
        )
        client.ping()
        _redis_client = client
        logger.info("AI usage counters backed by Redis")
    except Exception as e:
        logger.warning(f"Redis unavailable for AI usage counters ({e}); using database.")
        _redis_client = None
    return _redis_client


def increment_usage_counter(user_id: str, scope: str, window_start: str, amount: int = 1) -> int:
    """Atomically increment a counter; returns the updated value (0 on store failure)."""
    r = _redis()
    if r is not None:
        try:
            key = f"ai:rl:{scope}:{user_id}:{window_start}"
            count = int(r.incrby(key, amount))
            if count == amount or amount == 1:  # newly created key -> set TTL
                r.expire(key, _WINDOW_TTL_SECONDS[scope])
            return count
        except Exception as e:
            logger.warning(f"Redis counter increment failed, falling back to DB: {e}")

    from database import increment_ai_usage_counter
    return increment_ai_usage_counter(user_id, scope, window_start, amount)


def get_usage_counter(user_id: str, scope: str, window_start: str) -> int:
    r = _redis()
    if r is not None:
        try:
            key = f"ai:rl:{scope}:{user_id}:{window_start}"
            val = r.get(key)
            if val is not None:
                return int(val)
        except Exception as e:
            logger.warning(f"Redis counter read failed, falling back to DB: {e}")

    from database import get_ai_usage_counter
    return get_ai_usage_counter(user_id, scope, window_start)


# ---------------------------------------------------------
# Token estimation fallback (provider/tokenizer reports preferred)
# ---------------------------------------------------------
def estimate_tokens(text) -> int:
    """Cheap fallback token estimate when the provider doesn't return usage.

    Mirrors the existing cli_report counting heuristic (len // 4) so numbers stay
    consistent with the pre-existing [TOKEN] logs.
    """
    if text is None:
        return 0
    if isinstance(text, (list, tuple)):
        total = 0
        for item in text:
            if isinstance(item, dict):
                total += len(str(item.get("text", item.get("content", ""))))
            else:
                total += len(str(item))
        return total // 4
    return len(str(text)) // 4


# ---------------------------------------------------------
# Usage context for LLM call-sites
# ---------------------------------------------------------
_usage_ctx: ContextVar[Optional[dict]] = ContextVar("ai_usage_ctx", default=None)


@contextmanager
def usage_context(user_id: str, *, endpoint: str, model: Optional[str] = None,
                  request_id: Optional[str] = None, organization_id: Optional[str] = None):
    """Set the current request's accounting context so LLM helpers can auto-record.

    The contextvar naturally propagates into threads spawned with asyncio.to_thread,
    which is how report generation / framework selection run.
    """
    token = _usage_ctx.set({
        "user_id": str(user_id),
        "endpoint": endpoint,
        "model": model,
        "request_id": request_id or str(uuid.uuid4()),
        "organization_id": organization_id,
    })
    try:
        yield
    finally:
        _usage_ctx.reset(token)


def current_usage_context() -> Optional[dict]:
    return _usage_ctx.get()


def record_llm_result(
    model: Optional[str] = None,
    *,
    input_tokens: Optional[int] = None,
    output_tokens: Optional[int] = None,
    messages: Optional[list] = None,
    output_text: Optional[str] = None,
) -> bool:
    """Record an LLM call into the active usage context (no-op when none set)."""
    ctx = _usage_ctx.get()
    if not ctx:
        return False
    inp = input_tokens
    if inp is None:
        inp = estimate_tokens(messages)
    out = output_tokens
    if out is None:
        out = estimate_tokens(output_text)
    return record_usage(
        ctx["user_id"],
        endpoint=ctx["endpoint"],
        model=model or ctx.get("model"),
        input_tokens=inp or 0,
        output_tokens=out or 0,
        request_id=ctx.get("request_id"),
        organization_id=ctx.get("organization_id"),
    )


def extract_usage_metadata(response) -> Optional[tuple]:
    """Extract (input_tokens, output_tokens) from a LangChain response when the
    provider returned exact usage (AIMessage.usage_metadata). Returns None when
    the provider gave nothing usable, letting callers fall back to estimates."""
    if response is None:
        return None
    md = getattr(response, "usage_metadata", None)
    if not isinstance(md, dict) or not md:
        md = (getattr(response, "response_metadata", None) or {}).get("usage")
    if not isinstance(md, dict) or not md:
        return None
    inp = md.get("input_tokens")
    out = md.get("output_tokens")
    if inp is not None and out is not None:
        return int(inp), int(out)
    total = md.get("total_tokens")
    if total is not None:
        inp = md.get("prompt_tokens") if inp is None else inp
        out = md.get("completion_tokens") if out is None else out
        if inp is None and out is None:
            return None
        if inp is None:
            inp = int(total) - int(out)
        if out is None:
            out = int(total) - int(inp)
        return int(inp), int(out)
    return None


def record_chain_usage(response, model: Optional[str] = None, *,
                       messages: Optional[list] = None,
                       output_text: Optional[str] = None) -> bool:
    """Record usage for a chain.invoke(...) result via the active usage context.

    Uses provider-exact tokens when available, otherwise estimates. No-op when no
    usage_context is set (e.g. guest session or background task without a user).
    """
    parsed = extract_usage_metadata(response)
    if parsed:
        inp, out = parsed
    else:
        inp = estimate_tokens(messages)
        out = estimate_tokens(output_text)
    return record_llm_result(model, input_tokens=inp, output_tokens=out, messages=None, output_text=None)


# ---------------------------------------------------------
# Accounting
# ---------------------------------------------------------
def record_usage(
    user_id: str,
    *,
    endpoint: str,
    model: Optional[str] = None,
    input_tokens: int = 0,
    output_tokens: int = 0,
    request_id: Optional[str] = None,
    organization_id: Optional[str] = None,
) -> bool:
    """Record consumed tokens for a user after an AI call completes.

    Updates the hourly input/output counters and the daily total counter, appends a
    durable usage-log entry, and keeps the legacy daily counter (add_token_usage) in
    sync so /api/user/usage and the existing monthly checks keep working.
    """
    user_id = str(user_id)
    inp = max(0, int(input_tokens or 0))
    out = max(0, int(output_tokens or 0))
    now = _utcnow()
    keys = _window_keys(now)

    increment_usage_counter(user_id, "input_tokens_per_hour", keys["hour"], inp)
    increment_usage_counter(user_id, "output_tokens_per_hour", keys["hour"], out)
    increment_usage_counter(user_id, "daily_tokens_per_user", keys["day"], inp + out)

    from database import add_token_usage, log_ai_usage
    add_token_usage(user_id, inp + out)
    return log_ai_usage(
        user_id=user_id,
        endpoint=endpoint,
        model=model or "unknown",
        input_tokens=inp,
        output_tokens=out,
        request_id=request_id,
        organization_id=organization_id,
    )


# ---------------------------------------------------------
# Limit evaluation
# ---------------------------------------------------------
def denial_payload(limit_type: str, limit: int, used: int, reset_at: datetime) -> dict:
    if limit_type == "requests_per_minute":
        message = "AI request rate limit exceeded. Try again shortly."
    else:
        message = "AI usage limit exceeded."
    remaining = max(0, int(limit) - int(used))
    retry_after = max(0, int((reset_at - _utcnow()).total_seconds()))
    return {
        "error": "rate_limit_exceeded",
        "message": message,
        "limit_type": limit_type,
        "limit": int(limit),
        "used": int(used),
        "remaining": remaining,
        "retry_after": retry_after,
    }


def check_and_consume(user_id: str, *, now: Optional[datetime] = None) -> Optional[dict]:
    """Reserve one request slot and verify current token usage.

    Returns None when allowed; returns the 429 payload dict when a limit is hit.
    The request slot is consumed atomically first so concurrent requests cannot
    bypass the per-minute request limit.
    """
    user_id = str(user_id)
    now = now or _utcnow()
    keys = _window_keys(now)

    # 1) consume the request slot (authoritative, atomic)
    request_count = increment_usage_counter(user_id, "requests_per_minute", keys["minute"], 1)
    request_limit = AI_RATE_LIMITS.requests_per_minute
    if request_count > request_limit:
        reset = _reset_at("requests_per_minute", now)
        used = min(request_count, request_limit)
        return denial_payload("requests_per_minute", request_limit, used, reset)

    # 2) pre-check token usage against current counters
    input_used = get_usage_counter(user_id, "input_tokens_per_hour", keys["hour"])
    output_used = get_usage_counter(user_id, "output_tokens_per_hour", keys["hour"])
    daily_used = get_usage_counter(user_id, "daily_tokens_per_user", keys["day"])

    checks = [
        ("input_tokens_per_hour", AI_RATE_LIMITS.input_tokens_per_hour, input_used, _reset_at("input_tokens_per_hour", now)),
        ("output_tokens_per_hour", AI_RATE_LIMITS.output_tokens_per_hour, output_used, _reset_at("output_tokens_per_hour", now)),
        ("daily_tokens_per_user", AI_RATE_LIMITS.daily_tokens_per_user, daily_used, _reset_at("daily_tokens_per_user", now)),
    ]
    for field_name, limit, used, reset in checks:
        if int(used) >= int(limit):
            return denial_payload(AI_RATE_LIMITS.limit_type_name(field_name), limit, min(used, limit), reset)

    return None


# ---------------------------------------------------------
# Usage snapshot for GET /api/usage
# ---------------------------------------------------------
def get_usage(user_id: str) -> dict:
    """Build the authenticated usage snapshot returned by GET /api/usage.

    Shape:
      {"requests": {limit, used, remaining, reset_at},
       "hourly": {"input_tokens": {...}, "output_tokens": {...}},
       "daily": {"tokens": {...}}}
    """
    user_id = str(user_id)
    now = _utcnow()
    keys = _window_keys(now)

    req_limit = AI_RATE_LIMITS.requests_per_minute
    req_used = get_usage_counter(user_id, "requests_per_minute", keys["minute"])
    input_used = get_usage_counter(user_id, "input_tokens_per_hour", keys["hour"])
    output_used = get_usage_counter(user_id, "output_tokens_per_hour", keys["hour"])
    daily_used = get_usage_counter(user_id, "daily_tokens_per_user", keys["day"])

    def meter(limit: int, used: int, reset_at: datetime) -> dict:
        return {
            "limit": int(limit),
            "used": int(used),
            "remaining": max(0, int(limit) - int(used)),
            "reset_at": reset_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }

    return {
        "requests": meter(req_limit, req_used, _reset_at("requests_per_minute", now)),
        "hourly": {
            "input_tokens": meter(AI_RATE_LIMITS.input_tokens_per_hour, input_used, _reset_at("input_tokens_per_hour", now)),
            "output_tokens": meter(AI_RATE_LIMITS.output_tokens_per_hour, output_used, _reset_at("output_tokens_per_hour", now)),
        },
        "daily": {
            "tokens": meter(AI_RATE_LIMITS.daily_tokens_per_user, daily_used, _reset_at("daily_tokens_per_user", now)),
        },
    }


# ---------------------------------------------------------
# Exception used by the FastAPI dependency / handlers
# ---------------------------------------------------------
class AiRateLimitExceeded(Exception):
    """Raised when a user has hit an AI usage limit; carries the 429 payload."""

    def __init__(self, payload: dict):
        self.payload = payload
        super().__init__(payload.get("message", "AI usage limit exceeded."))