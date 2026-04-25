#!/usr/bin/env python3
"""
Test script to verify AI role enforcement fixes
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import build_summary_prompt, build_followup_prompt

def test_role_enforcement():
    """Test that prompts contain strong role enforcement"""

    # Test initial prompt
    print("=== TESTING INITIAL PROMPT ===")
    initial_prompt = build_summary_prompt(
        role="Manager",
        ai_role="Sales Associate",
        scenario="Performance review conversation",
        framework="GROW",
        mode="evaluation",
        ai_character="alex",
        simulation_id=None
    )

    print("Initial prompt messages:")
    for i, msg in enumerate(initial_prompt):
        print(f"Message {i}: {msg['role']}")
        content = msg['content']
        if "CRITICAL ROLE CONSTRAINTS" in content:
            print("OK Found CRITICAL ROLE CONSTRAINTS")
        if "You are ALWAYS" in content:
            print("OK Found 'You are ALWAYS' enforcement")
        if "Never become" in content:
            print("OK Found 'Never become' enforcement")
        print(f"Content preview: {content[:200]}...")
        print()

    # Test followup prompt
    print("=== TESTING FOLLOWUP PROMPT ===")
    mock_session = {
        "role": "Manager",
        "ai_role": "Sales Associate",
        "scenario": "Performance review conversation",
        "mode": "evaluation",
        "transcript": [
            {"role": "assistant", "content": "Hello, I'm the sales associate."},
            {"role": "user", "content": "How are your sales going?"}
        ]
    }

    followup_prompt = build_followup_prompt(mock_session, "Tell me about your performance", [])

    print("Followup prompt messages:")
    for i, msg in enumerate(followup_prompt):
        print(f"Message {i}: {msg['role']}")
        content = msg['content']
        if "CRITICAL ROLE CONSTRAINTS" in content:
            print("OK Found CRITICAL ROLE CONSTRAINTS")
        if "You are ALWAYS" in content:
            print("OK Found 'You are ALWAYS' enforcement")
        if "Never become" in content:
            print("OK Found 'Never become' enforcement")
        print(f"Content preview: {content[:200]}...")
        print()

if __name__ == "__main__":
    test_role_enforcement()