"""
Tests for cli_report.parse_json_robustly — ensures the LLM JSON parser
handles all common formatting edge cases from the Groq/LLaMA models.
"""
import pytest
import sys
import os

# Add backend root to path so we can import cli_report
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from cli_report import parse_json_robustly


class TestParseJsonRobustly:
    """Test suite for the robust JSON parser that handles LLM quirks."""

    def test_plain_json(self):
        """Direct JSON should parse without issues."""
        raw = '{"meta": {"score": 8}, "type": "coaching"}'
        result = parse_json_robustly(raw)
        assert result is not None
        assert result["meta"]["score"] == 8

    def test_json_in_markdown_block(self):
        """LLMs often wrap JSON in ```json ... ``` blocks."""
        raw = '```json\n{"meta": {"score": 7}}\n```'
        result = parse_json_robustly(raw)
        assert result is not None
        assert result["meta"]["score"] == 7

    def test_json_in_plain_markdown_block(self):
        """Sometimes the block is just ``` without the json label."""
        raw = '```\n{"type": "unified_report"}\n```'
        result = parse_json_robustly(raw)
        assert result is not None
        assert result["type"] == "unified_report"

    def test_json_with_leading_text(self):
        """LLMs sometimes include preamble text before the JSON."""
        raw = 'Here is the analysis:\n\n{"meta": {"summary": "Good performance"}}'
        result = parse_json_robustly(raw)
        assert result is not None
        assert result["meta"]["summary"] == "Good performance"

    def test_json_with_trailing_text(self):
        """LLMs sometimes include trailing explanation after the JSON."""
        raw = '{"score": 9}\n\nI hope this analysis was helpful!'
        result = parse_json_robustly(raw)
        assert result is not None
        assert result["score"] == 9

    def test_empty_string(self):
        """Empty input should return None, not crash."""
        assert parse_json_robustly("") is None

    def test_none_input(self):
        """None input should return None, not crash."""
        assert parse_json_robustly(None) is None

    def test_completely_invalid_text(self):
        """Totally non-JSON text should return None."""
        assert parse_json_robustly("This is just a regular sentence.") is None

    def test_nested_json_structure(self):
        """Complex nested JSON structures should parse correctly."""
        raw = '''```json
{
    "meta": {"scenario_id": "coaching_sim", "overall_grade": "7.5/10"},
    "scorecard": [
        {"dimension": "Empathy", "score": "8/10", "reasoning": "Good active listening"},
        {"dimension": "Clarity", "score": "6/10", "reasoning": "Could be more specific"}
    ],
    "action_plan": {"specific_actions": ["Practice open-ended questions"]}
}
```'''
        result = parse_json_robustly(raw)
        assert result is not None
        assert len(result["scorecard"]) == 2
        assert result["scorecard"][0]["dimension"] == "Empathy"
        assert result["action_plan"]["specific_actions"][0] == "Practice open-ended questions"

    def test_whitespace_padded_json(self):
        """JSON with lots of whitespace should be handled."""
        raw = '   \n\n  {"key": "value"}  \n\n  '
        result = parse_json_robustly(raw)
        assert result is not None
        assert result["key"] == "value"

    def test_json_with_unicode_characters(self):
        """JSON containing unicode characters should still parse."""
        raw = '{"greeting": "Hello \\u2014 welcome!"}'
        result = parse_json_robustly(raw)
        assert result is not None
        assert "welcome" in result["greeting"]
