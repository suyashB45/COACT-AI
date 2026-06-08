"""
Tests for the session flow in app.py, specifically verifying the 
/api/session/start endpoint logic.
"""
import pytest
import sys
import os
import json
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import app, SESSIONS
from fastapi.testclient import TestClient

client = TestClient(app)

# Helper to clear in-memory sessions between tests
@pytest.fixture(autouse=True)
def clear_sessions():
    SESSIONS.local_cache.clear()
    yield

@patch("app.check_monthly_session_limit", return_value=True)
@patch("app.save_session_to_db")
@patch("app.llm_reply")
@patch("app.select_framework_for_scenario")
def test_start_session_hardcoded_bypass(mock_select_framework, mock_llm_reply, mock_save_db, mock_limit):
    """
    Test that hardcoded simulations (e.g., SIM-01-PERF-001) bypass the LLM summary generation
    and correctly load the pre-written fallback summary.
    """
    # Mocking the framework selector to return a dummy framework
    mock_select_framework.return_value = ["GROW"]
    
    payload = {
        "role": "Store Manager",
        "ai_role": "Sales Associate",
        "scenario": "Good Attitude, Poor Results",
        "simulation_id": "SIM-01-PERF-001"
    }

    response = client.post("/api/session/start", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    
    # Verify the hardcoded opening was returned
    assert "Thanks for taking time to meet me" in data["summary"]
    
    # LLM summary generation MUST NOT be called because it's hardcoded
    mock_llm_reply.assert_not_called()
    
    # Verify session was correctly registered in memory
    session_id = data["session_id"]
    assert session_id in SESSIONS
    assert SESSIONS[session_id]["simulation_id"] == "SIM-01-PERF-001"
    
    # Verify save_session_to_db was called
    mock_save_db.assert_called_once()

@patch("app.check_monthly_session_limit", return_value=True)
@patch("app.save_session_to_db")
@patch("app.llm_reply")
@patch("app.select_framework_for_scenario")
def test_start_session_custom_scenario(mock_select_framework, mock_llm_reply, mock_save_db, mock_limit):
    """
    Test that custom simulations correctly trigger the parallel LLM generation.
    """
    # Mock LLM calls
    mock_select_framework.return_value = ["EQ", "GROW"]
    # llm_reply returns a tuple (summary, usage)
    mock_llm_reply.return_value = ("This is an LLM generated opening.", {"total_tokens": 10, "request_tokens": 5, "response_tokens": 5})

    payload = {
        "role": "CEO",
        "ai_role": "Investor",
        "scenario": "A tough pitch to a skeptical investor.",
        "simulation_id": None # No hardcoded simulation
    }

    response = client.post("/api/session/start", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify the dynamically generated opening was returned
    assert data["summary"] == "This is an LLM generated opening."
    
    # Because it's a custom scenario, llm_reply MUST be called
    mock_llm_reply.assert_called_once()

@patch("app.check_monthly_session_limit", return_value=True)
@patch("app.save_session_to_db")
@patch("app.llm_reply")
@patch("app.select_framework_for_scenario")
def test_multi_character_flag(mock_select_framework, mock_llm_reply, mock_save_db, mock_limit):
    """
    Test that the conflict resolution simulation correctly flags multi_characters = True
    and assigns character configs.
    """
    payload = {
        "role": "Team Manager",
        "ai_role": "Conflicted Team Members",
        "scenario": "Two Team Members, One Growing Conflict",
        "simulation_id": "SIM-05-CON-001"
    }

    response = client.post("/api/session/start", json=payload)
    assert response.status_code == 200
    data = response.json()
    session_id = data["session_id"]
    
    # Check in-memory state
    session_data = SESSIONS[session_id]
    assert session_data["multi_characters"] is True
    assert len(session_data["characters"]) == 2
    assert session_data["characters"][0]["name"] == "Rohan"
    assert session_data["characters"][1]["name"] == "Meera"
