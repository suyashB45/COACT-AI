import logging

from core.dependencies import get_authenticated_user
from fastapi import APIRouter, Request
from services.usage import get_usage

logger = logging.getLogger("coact")
router = APIRouter(prefix="/api", tags=["Usage"])


@router.get("/usage")
async def get_ai_usage(request: Request):
    """Return the authenticated user's current AI usage across all limits.

    Response shape:
      {"requests": {limit, used, remaining, reset_at},
       "hourly": {"input_tokens": {...}, "output_tokens": {...}},
       "daily": {"tokens": {...}}}
    """
    user = get_authenticated_user(request)
    return get_usage(user.id)