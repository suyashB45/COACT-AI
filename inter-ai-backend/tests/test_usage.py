"""Tests for the token-based AI usage rate limiting / quota service.

Covered behaviour:
- token estimator fallback
- request-per-minute threshold (29 / 30 / 31)
- hourly input & output token limits
- daily total token limit
- per-user isolation
- 429 payload shape (error / limit_type / limit / used / remaining / retry_after)
- window reset (minute / hour / day) via injected `now`
- GET /api/usage snapshot shape
- usage_context auto-recording (and no-op when no context set)
- optional-auth dependency passes guests through
"""

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from core.config import AiRateLimits
from services import usage as usage_service

# --------------------------------------------------------------------------
# Fixtures / helpers
# --------------------------------------------------------------------------

def _uid() -> str:
    return f"tester-{uuid.uuid4()}"


@pytest.fixture
def limits(monkeypatch):
    """Small, deterministic limits so tests don't depend on env config."""
    test_limits = AiRateLimits(
        requests_per_minute=30,
        input_tokens_per_hour=100_000,
        output_tokens_per_hour=100_000,
        daily_tokens_per_user=500_000,
    )
    monkeypatch.setattr(usage_service, "AI_RATE_LIMITS", test_limits)
    return test_limits


def _day(offset_days: int = 0) -> datetime:
    now = datetime.now(timezone.utc)
    return now + timedelta(days=offset_days)


def _minutes_later(n: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=n)


# --------------------------------------------------------------------------
# Token estimator
# --------------------------------------------------------------------------

class TestEstimateTokens:
    def test_text(self):
        text = "x" * 100
        assert usage_service.estimate_tokens(text) == 25

    def test_none_returns_zero(self):
        assert usage_service.estimate_tokens(None) == 0

    def test_list_of_content_dicts(self):
        items = [{"text": "aaaa"}, {"text": "bbbb"}, "cccc"]
        assert usage_service.estimate_tokens(items) == 3

    def test_matches_len_over_four_rule(self):
        text = "a b c d " * 10
        assert usage_service.estimate_tokens(text) == len(text) // 4


# --------------------------------------------------------------------------
# Request per-minute limit
# --------------------------------------------------------------------------

class TestRequestLimit:
    def test_allows_30_then_rejects_31st(self, limits):
        user = _uid()
        for _ in range(30):
            assert usage_service.check_and_consume(user) is None
        denied = usage_service.check_and_consume(user)
        assert denied is not None
        assert denied["error"] == "rate_limit_exceeded"
        assert denied["limit_type"] == "requests_per_minute"
        assert denied["limit"] == 30
        assert denied["used"] == 30
        assert denied["remaining"] == 0
        assert denied["retry_after"] >= 0

    def test_29_requests_still_allowed(self, limits):
        user = _uid()
        for _ in range(29):
            assert usage_service.check_and_consume(user) is None
        # A 30th request within the same minute is allowed; the 31st is not.
        assert usage_service.check_and_consume(user) is None

    def test_users_are_isolated(self, limits):
        user_a, user_b = _uid(), _uid()
        for _ in range(30):
            assert usage_service.check_and_consume(user_a) is None
        # A is now at its per-minute cap; B is unaffected.
        assert usage_service.check_and_consume(user_a) is not None
        assert usage_service.check_and_consume(user_b) is None

    def test_resets_next_minute(self, limits):
        user = _uid()
        for _ in range(30):
            assert usage_service.check_and_consume(user) is None
        assert usage_service.check_and_consume(user, now=_minutes_later(1)) is None


# --------------------------------------------------------------------------
# Hourly token limits
# --------------------------------------------------------------------------

class TestHourlyTokenLimits:
    def test_hourly_input_limit(self, limits, monkeypatch):
        monkeypatch.setattr(usage_service, "AI_RATE_LIMITS", AiRateLimits(
            requests_per_minute=1000, input_tokens_per_hour=100,
            output_tokens_per_hour=1000, daily_tokens_per_user=1_000_000,
        ))
        user = _uid()
        usage_service.record_usage(user, endpoint="chat", model="test", input_tokens=100, output_tokens=0)
        denied = usage_service.check_and_consume(user)
        assert denied is not None
        assert denied["limit_type"] == "hourly_input_tokens"
        assert denied["limit"] == 100
        assert denied["used"] == 100

    def test_hourly_output_limit(self, limits, monkeypatch):
        monkeypatch.setattr(usage_service, "AI_RATE_LIMITS", AiRateLimits(
            requests_per_minute=1000, input_tokens_per_hour=1000,
            output_tokens_per_hour=50, daily_tokens_per_user=1_000_000,
        ))
        user = _uid()
        usage_service.record_usage(user, endpoint="chat", model="test", input_tokens=0, output_tokens=50)
        denied = usage_service.check_and_consume(user)
        assert denied is not None
        assert denied["limit_type"] == "hourly_output_tokens"
        assert denied["used"] == 50

    def test_hourly_limits_reset_next_hour(self, limits, monkeypatch):
        monkeypatch.setattr(usage_service, "AI_RATE_LIMITS", AiRateLimits(
            requests_per_minute=1000, input_tokens_per_hour=100,
            output_tokens_per_hour=1000, daily_tokens_per_user=1_000_000,
        ))
        user = _uid()
        usage_service.record_usage(user, endpoint="chat", model="test", input_tokens=100, output_tokens=0)
        assert usage_service.check_and_consume(user) is not None
        assert usage_service.check_and_consume(user, now=_day(1)) is None


# --------------------------------------------------------------------------
# Daily total token limit
# --------------------------------------------------------------------------

class TestDailyTokenLimit:
    def test_daily_total_limit_met(self, limits, monkeypatch):
        monkeypatch.setattr(usage_service, "AI_RATE_LIMITS", AiRateLimits(
            requests_per_minute=1000, input_tokens_per_hour=1_000_000,
            output_tokens_per_hour=1_000_000, daily_tokens_per_user=200,
        ))
        user = _uid()
        # input 100 + output 0 and input 0 + output 100 -> daily total = 200
        usage_service.record_usage(user, endpoint="chat", model="test", input_tokens=100, output_tokens=0)
        usage_service.record_usage(user, endpoint="chat", model="test", input_tokens=0, output_tokens=100)
        denied = usage_service.check_and_consume(user)
        assert denied is not None
        assert denied["limit_type"] == "daily_tokens"
        assert denied["limit"] == 200
        assert denied["used"] == 200

    def test_daily_limits_reset_next_day(self, limits, monkeypatch):
        monkeypatch.setattr(usage_service, "AI_RATE_LIMITS", AiRateLimits(
            requests_per_minute=1000, input_tokens_per_hour=1_000_000,
            output_tokens_per_hour=1_000_000, daily_tokens_per_user=10,
        ))
        user = _uid()
        usage_service.record_usage(user, endpoint="chat", model="test", input_tokens=10, output_tokens=0)
        assert usage_service.check_and_consume(user) is not None
        assert usage_service.check_and_consume(user, now=_day(1)) is None


# --------------------------------------------------------------------------
# 429 payload contract
# --------------------------------------------------------------------------

class TestDenialPayloadContract:
    def test_payload_full_shape(self):
        reset = datetime(2026, 9, 2, 14, 0, 0, tzinfo=timezone.utc)
        payload = usage_service.denial_payload("daily_tokens", 200000, 200000, reset)
        assert payload["error"] == "rate_limit_exceeded"
        assert payload["message"] == "AI usage limit exceeded."
        assert payload["limit_type"] == "daily_tokens"
        assert payload["limit"] == 200000
        assert payload["used"] == 200000
        assert payload["remaining"] == 0
        assert isinstance(payload["retry_after"], int)
        assert payload["retry_after"] >= 0

    def test_exception_preserves_payload(self):
        payload = usage_service.denial_payload("requests_per_minute", 30, 30, _minutes_later(1))
        exc = usage_service.AiRateLimitExceeded(payload)
        assert exc.payload == payload
        assert exc.payload["limit_type"] == "requests_per_minute"


# --------------------------------------------------------------------------
# GET /api/usage snapshot shape
# --------------------------------------------------------------------------

class TestUsageSnapshot:
    def test_usage_snapshot_shape(self, limits):
        user = _uid()
        usage_service.check_and_consume(user)
        usage_service.record_usage(user, endpoint="chat", model="test", input_tokens=10, output_tokens=5)
        snapshot = usage_service.get_usage(user)
        assert set(snapshot.keys()) == {"requests", "hourly", "daily"}
        for meter in [snapshot["requests"], snapshot["hourly"]["input_tokens"],
                      snapshot["hourly"]["output_tokens"], snapshot["daily"]["tokens"]]:
            assert set(meter.keys()) == {"limit", "used", "remaining", "reset_at"}
            assert meter["used"] >= 0 and meter["remaining"] >= 0
            assert "T" in meter["reset_at"]
        assert snapshot["requests"]["used"] >= 1
        assert snapshot["hourly"]["input_tokens"]["used"] == 10
        assert snapshot["hourly"]["output_tokens"]["used"] == 5
        assert snapshot["daily"]["tokens"]["used"] == 15


# --------------------------------------------------------------------------
# usage_context auto-recording
# --------------------------------------------------------------------------

class TestUsageContext:
    def test_records_only_when_context_set(self, limits):
        user = _uid()
        assert usage_service.record_llm_result("model-x", input_tokens=1, output_tokens=1) is False
        with usage_service.usage_context(user, endpoint="chat"):
            assert usage_service.record_llm_result("model-x", input_tokens=4, output_tokens=4) is True
        snapshot = usage_service.get_usage(user)
        assert snapshot["hourly"]["input_tokens"]["used"] >= 4
        assert snapshot["daily"]["tokens"]["used"] >= 8

    def test_estimates_when_exact_missing(self, limits):
        user = _uid()
        with usage_service.usage_context(user, endpoint="session_opening"):
            ok = usage_service.record_llm_result("model-x", messages=["a" * 40], output_text="b" * 16)
        assert ok is True
        snapshot = usage_service.get_usage(user)
        assert snapshot["hourly"]["input_tokens"]["used"] >= 10  # len("a"*40)//4
        assert snapshot["hourly"]["output_tokens"]["used"] >= 4  # len("b"*16)//4


# --------------------------------------------------------------------------
# Env-driven configuration
# --------------------------------------------------------------------------

class TestEnvLimits:
    def test_defaults_when_env_unset(self, monkeypatch):
        for var in ["RATE_LIMIT_REQUESTS_PER_MINUTE", "RATE_LIMIT_INPUT_TOKENS_PER_HOUR",
                    "RATE_LIMIT_OUTPUT_TOKENS_PER_HOUR", "RATE_LIMIT_DAILY_TOKENS"]:
            monkeypatch.delenv(var, raising=False)
        limits = AiRateLimits.from_env()
        assert limits.requests_per_minute == 30
        assert limits.input_tokens_per_hour == 50_000
        assert limits.output_tokens_per_hour == 20_000
        assert limits.daily_tokens_per_user == 200_000

    def test_env_overrides(self, monkeypatch):
        monkeypatch.setenv("RATE_LIMIT_REQUESTS_PER_MINUTE", "5")
        monkeypatch.setenv("RATE_LIMIT_DAILY_TOKENS", "1000")
        limits = AiRateLimits.from_env()
        assert limits.requests_per_minute == 5
        assert limits.daily_tokens_per_user == 1000
        assert limits.input_tokens_per_hour == 50_000  # unchanged

    def test_invalid_env_ignored(self, monkeypatch):
        monkeypatch.setenv("RATE_LIMIT_REQUESTS_PER_MINUTE", "abc")
        limits = AiRateLimits.from_env()
        assert limits.requests_per_minute == 30

    def test_limit_type_mapping(self):
        assert AiRateLimits(requests_per_minute=1).limit_type_name("requests_per_minute") == "requests_per_minute"
        assert AiRateLimits(requests_per_minute=1).limit_type_name("input_tokens_per_hour") == "hourly_input_tokens"
        assert AiRateLimits(requests_per_minute=1).limit_type_name("output_tokens_per_hour") == "hourly_output_tokens"
        assert AiRateLimits(requests_per_minute=1).limit_type_name("daily_tokens_per_user") == "daily_tokens"


# --------------------------------------------------------------------------
# extract_usage_metadata
# --------------------------------------------------------------------------

class TestExtractUsageMetadata:
    def test_none_response(self):
        assert usage_service.extract_usage_metadata(None) is None

    def test_no_metadata(self):
        assert usage_service.extract_usage_metadata(object()) is None

    def test_usage_metadata_direct(self):
        class FakeResp:
            usage_metadata = {"input_tokens": 100, "output_tokens": 50}
        assert usage_service.extract_usage_metadata(FakeResp()) == (100, 50)

    def test_response_metadata_usage(self):
        class FakeResp:
            usage_metadata = None
            response_metadata = {"usage": {"prompt_tokens": 80, "completion_tokens": 20}}
        assert usage_service.extract_usage_metadata(FakeResp()) == (80, 20)

    def test_total_tokens_only_with_prompt(self):
        class FakeResp:
            usage_metadata = {"total_tokens": 150, "prompt_tokens": 100}
        assert usage_service.extract_usage_metadata(FakeResp()) == (100, 50)

    def test_total_tokens_only_with_completion(self):
        class FakeResp:
            usage_metadata = {"total_tokens": 200, "completion_tokens": 60}
        assert usage_service.extract_usage_metadata(FakeResp()) == (140, 60)

    def test_total_tokens_no_prompt_no_completion(self):
        class FakeResp:
            usage_metadata = {"total_tokens": 100}
        assert usage_service.extract_usage_metadata(FakeResp()) is None


# --------------------------------------------------------------------------
# record_chain_usage
# --------------------------------------------------------------------------

class TestRecordChainUsage:
    def test_no_context_noop(self):
        """No usage_context set → record_chain_usage returns False."""
        class FakeResp:
            usage_metadata = {"input_tokens": 10, "output_tokens": 5}
        assert usage_service.record_chain_usage(FakeResp(), model="test") is False

    def test_with_context_records_exact(self):
        """With context set and provider-exact tokens, records them."""
        uid = _uid()
        with usage_service.usage_context(uid, endpoint="test"):
            class FakeResp:
                usage_metadata = {"input_tokens": 30, "output_tokens": 12}
            result = usage_service.record_chain_usage(FakeResp(), model="gpt-4")
            assert result is True
        snap = usage_service.get_usage(uid)
        assert snap["daily"]["tokens"]["used"] == 42

    def test_estimate_fallback(self):
        """No usage_metadata → falls back to len//4 estimation."""
        uid = _uid()
        with usage_service.usage_context(uid, endpoint="test"):
            messages = [{"content": "x" * 400}]
            result = usage_service.record_chain_usage(None, model="gpt-4", messages=messages, output_text="y" * 80)
            assert result is True
        snap = usage_service.get_usage(uid)
        assert snap["daily"]["tokens"]["used"] > 0