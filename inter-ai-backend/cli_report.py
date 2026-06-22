import json
import os
import math
import re
import unicodedata
import datetime as dt
from fpdf import FPDF
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from dotenv import load_dotenv
from litellm import token_counter
import httpx
import concurrent.futures
import time


load_dotenv()

# ---------------------------------------------------------
# LangSmith Tracing Configuration
# ---------------------------------------------------------
def configure_langsmith():
    """Configure LangSmith tracing for all LangChain LLM calls.
    
    Supports both naming conventions:
        LANGSMITH_API_KEY  / LANGCHAIN_API_KEY
        LANGSMITH_PROJECT  / LANGCHAIN_PROJECT
        LANGSMITH_ENDPOINT / LANGCHAIN_ENDPOINT
        LANGSMITH_TRACING  / LANGCHAIN_TRACING_V2
    """
    # Check both naming conventions (LANGSMITH_* is newer, LANGCHAIN_* is legacy)
    api_key = os.getenv("LANGSMITH_API_KEY") or os.getenv("LANGCHAIN_API_KEY")
    if api_key:
        # Set both naming conventions for full SDK compatibility
        os.environ["LANGCHAIN_API_KEY"] = api_key
        os.environ["LANGSMITH_API_KEY"] = api_key
        
        tracing = os.getenv("LANGSMITH_TRACING") or os.getenv("LANGCHAIN_TRACING_V2", "true")
        os.environ["LANGCHAIN_TRACING_V2"] = tracing
        os.environ["LANGSMITH_TRACING"] = tracing
        
        project = os.getenv("LANGSMITH_PROJECT") or os.getenv("LANGCHAIN_PROJECT", "CoAct-AI")
        os.environ["LANGCHAIN_PROJECT"] = project
        os.environ["LANGSMITH_PROJECT"] = project
        
        endpoint = os.getenv("LANGSMITH_ENDPOINT") or os.getenv("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com")
        os.environ["LANGCHAIN_ENDPOINT"] = endpoint
        os.environ["LANGSMITH_ENDPOINT"] = endpoint
        
        print(f"[SUCCESS] LangSmith tracing enabled for project: {project}")
    else:
        os.environ["LANGCHAIN_TRACING_V2"] = "false"
        os.environ["LANGSMITH_TRACING"] = "false"
        print("[INFO] LangSmith tracing disabled (no LANGSMITH_API_KEY found)")

configure_langsmith()

import matplotlib
matplotlib.use('Agg') # Non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
import tempfile

def setup_langchain_model(model_name, is_chat=False):
    # Force httpx to ignore system proxies
    http_client = httpx.Client(trust_env=False, timeout=120.0)
    
    if is_chat:
        base_url = os.getenv("CHAT_OPENAI_BASE_URL", os.getenv("GROQ_OPENAI_BASE_URL", "http://vllm:8000/v1"))
        api_key = os.getenv("CHAT_API_KEY", os.getenv("GROQ_API_KEY", "not-needed"))
    else:
        base_url = os.getenv("GROQ_OPENAI_BASE_URL", "http://vllm:8000/v1")
        api_key = os.getenv("GROQ_API_KEY", "not-needed")
        
    if not api_key:
        print("[WARNING] API_KEY is not set! LLM calls will fail.")
    return ChatOpenAI(
        api_key=api_key or "not-needed",
        base_url=base_url,
        model=model_name,
        http_client=http_client,
        temperature=0.1
    )

REPORT_MODEL_NAME = os.getenv("MODEL_NAME", "Qwen/Qwen2.5-7B-Instruct")
CHAT_MODEL_NAME = os.getenv("CHAT_MODEL_NAME", "Qwen/Qwen2.5-1.5B-Instruct")

report_llm = setup_langchain_model(REPORT_MODEL_NAME, is_chat=False)
chat_llm = setup_langchain_model(CHAT_MODEL_NAME, is_chat=True)

prompt_template = PromptTemplate(template="{prompt}", input_variables=["prompt"])

# Kept for backwards compatibility if needed, but prefer specific ones
MODEL_NAME = REPORT_MODEL_NAME

def count_request_tokens(messages, model=None):
    if model is None: model = REPORT_MODEL_NAME
    try:
        return token_counter(model=model, messages=messages)
    except Exception as e:
        print(f"[TOKEN] request token count failed: {e}", flush=True)
        return 0


def count_response_tokens(text, model=None):
    if model is None: model = REPORT_MODEL_NAME
    try:
        return token_counter(model=model, text=text, count_response_tokens=True)
    except Exception as e:
        print(f"[TOKEN] response token count failed: {e}", flush=True)
        return 0


# --- Premium Modern Palette ---
COLORS = {
    'text_main': (30, 41, 59),       # Slate 800
    'text_light': (100, 116, 139),   # Slate 500
    'white': (255, 255, 255),
    
    # Premium Glassmorphism Palette
    'primary': (15, 23, 42),         # Deep Slate 900
    'secondary': (51, 65, 85),       # Slate 700
    'accent': (59, 130, 246),        # Blue 500 (Primary Brand)
    'accent_light': (96, 165, 250), # Blue 400
    
    # Gradients & UI
    'header_grad_1': (15, 23, 42),   # Slate 900
    'header_grad_2': (30, 58, 138),  # Blue 900
    'score_grad_1': (236, 253, 245), # Emerald 50
    'score_grad_2': (209, 250, 229), # Emerald 100
    'score_text': (4, 120, 87),      # Emerald 700
    
    # Chart Colors
    'chart_fill': (59, 130, 246),    # Blue 500
    'chart_stroke': (37, 99, 235),   # Blue 600
    'sentiment_pos': (16, 185, 129), # Emerald 500
    'sentiment_neg': (239, 68, 68),  # Red 500
    
    # Section colors
    'section_skills': (99, 102, 241),    # Indigo 500
    'section_eq': (236, 72, 153),        # Pink 500
    'section_comm': (14, 165, 233),      # Sky 500
    'section_coach': (245, 158, 11),     # Amber 500
    
    'divider': (226, 232, 240),
    'bg_light': (248, 250, 252),
    'sidebar_bg': (248, 250, 252),
    
    # Status
    'success': (16, 185, 129),       # Emerald 500
    'warning': (245, 158, 11),       # Amber 500
    'danger': (239, 68, 68),         # Red 500
    'rewrite_good': (236, 253, 245), # Emerald 50
    'bad_bg': (254, 226, 226),       # Red 100
    'grey_text': (100, 116, 139),    # Slate 500
    'grey_bg': (241, 245, 249),      # Slate 100
    'purple': (139, 92, 246),        # Violet 500
    'nuance_bg': (236, 72, 153)      # Pink 500 (for EQ nuance badges)
}

# UNIVERSAL REPORT STRUCTURE DEFINITIONS
SCENARIO_TITLES = {
    "universal": {
        "pulse": "THE PULSE",
        "narrative": "THE NARRATIVE",
        "blueprint": "THE BLUEPRINT"
    }
}


def sanitize_text(text):
    if text is None: return ""
    text = str(text)
    # Extended replacements for common Unicode characters
    replacements = {
        '\u2018': "'", '\u2019': "'", '\u201c': '"', '\u201d': '"',
        '\u2013': '-', '\u2014': '-', '\u2022': '*', '\u2026': '...',
        '\u2010': '-', '\u2011': '-', '\u2012': '-', '\u2015': '-',
        '\u2032': "'", '\u2033': '"', '\u2039': '<', '\u203a': '>',
        '\u00a0': ' ', '\u00b7': '*', '\u2027': '*', '\u25cf': '*',
        '\u25cb': 'o', '\u25a0': '*', '\u25a1': 'o', '\u2713': 'v',
        '\u2714': 'v', '\u2717': 'x', '\u2718': 'x', '\u2192': '->',
        '\u2190': '<-', '\u2194': '<->', '\u21d2': '=>', '\u2212': '-',
        '\u00d7': 'x', '\u00f7': '/', '\u2264': '<=', '\u2265': '>=',
        '\u2260': '!=', '\u00b0': ' deg', '\u00ae': '(R)', '\u00a9': '(C)',
        '\u2122': '(TM)', '\u00ab': '<<', '\u00bb': '>>', '\u201a': ',',
        '\u201e': '"', '\u2020': '+', '\u2021': '++', '\u00b6': 'P',
    }
    for char, rep in replacements.items():
        text = text.replace(char, rep)
    # First try to normalize and encode to ASCII
    try:
        normalized = unicodedata.normalize('NFKD', text)
        # Encode to latin-1, replacing any characters that can't be encoded
        return normalized.encode('latin-1', 'replace').decode('latin-1')
    except Exception:
        # Ultimate fallback: strip all non-ASCII
        return ''.join(c if ord(c) < 128 else '?' for c in text)

def build_summary_prompt(role, ai_role, scenario, framework=None, mode="coaching", ai_character="alex"):
    """
    Constructs the system prompt for the initial summary/greeting generation.
    """
    return [
        {"role": "system", "content": f"You are acting as {ai_character.capitalize()}, a professional coach."},
        {"role": "user", "content": f"Generate a brief welcoming sentence for a {scenario} session where the user plays {role} and you play {ai_role}."}
    ]

def sanitize_data(obj):
    """Recursively sanitize all strings in a dictionary or list for PDF compatibility."""
    if isinstance(obj, str):
        return sanitize_text(obj)
    elif isinstance(obj, dict):
        return {k: sanitize_data(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_data(item) for item in obj]
    else:
        return obj

def get_score_theme(score):
    try: s = float(score)
    except: s = 0.0
    if s == 0.0: return COLORS['grey_bg'], COLORS['grey_text']
    if s >= 7.0: return COLORS['score_grad_1'], COLORS['score_text'] 
    if s >= 5.0: return (254, 249, 195), (161, 98, 7) 
    return (254, 226, 226), (185, 28, 28) 

def get_bar_color(score):
    try: s = float(score)
    except: s = 0.0
    if s >= 8.0: return COLORS['success']
    if s >= 5.0: return COLORS['warning']
    if s > 0.0: return COLORS['danger']
    return COLORS['grey_text']

def llm_reply(messages, max_tokens=4000, max_retries=3, delay=1, return_usage=False, run_name=None, run_tags=None, use_chat_model=False):
    """Call the LLM with retry logic and optional LangSmith tracing metadata.
    
    Args:
        run_name: Optional name for this run in LangSmith (e.g., 'chat_reply', 'report_generation')
        run_tags: Optional list of tags for filtering in LangSmith (e.g., ['session', 'turn-5'])
        use_chat_model: If True, uses the faster/cheaper chat model instead of the heavy report model
    """
    model_name = CHAT_MODEL_NAME if use_chat_model else REPORT_MODEL_NAME
    active_llm = chat_llm if use_chat_model else report_llm
    
    request_tokens = count_request_tokens(messages, model=model_name) if return_usage else None
    
    # Build LangChain config for LangSmith tracing
    langchain_config = {}
    if run_name:
        langchain_config["run_name"] = run_name
    if run_tags:
        langchain_config["tags"] = run_tags
    
    for attempt in range(max_retries):
        try:
            print(f" [DEBUG] llm_reply attempt {attempt + 1} using {model_name}", flush=True)
            response = active_llm.invoke(messages, config=langchain_config if langchain_config else None)  # type: ignore
            content = response.content
            if isinstance(content, list):
                text = "".join(str(x) for x in content).strip()
            else:
                text = content.strip()
            if return_usage:
                response_tokens = count_response_tokens(text, model=model_name)
                req_t = request_tokens or 0
                res_t = response_tokens or 0
                total_tokens = req_t + res_t
                print(f"[TOKEN] request={request_tokens} response={response_tokens} total={total_tokens}", flush=True)
                return text, {
                    "request_tokens": request_tokens,
                    "response_tokens": response_tokens,
                    "total_tokens": total_tokens,
                }
            return text
        except Exception as e:
            print(f"LLM Error (Attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                # Exponential backoff: 1s, 2s, 4s...
                time.sleep(delay * (2 ** attempt))
            else:
                return ("{}", {"request_tokens": request_tokens or 0, "response_tokens": 0, "total_tokens": request_tokens or 0}) if return_usage else "{}"

def parse_json_robustly(json_text):
    """
    Robustly parse JSON from LLM responses, handling markdown blocks and common errors.
    """
    if not json_text:
        return None
        
    # Clean up whitespace
    json_text = json_text.strip()
    
    try:
        # 1. Try direct parsing first
        return json.loads(json_text)
    except json.JSONDecodeError:
        pass
        
    # 2. Try to extract JSON from markdown code blocks (```json ... ```)
    markdown_match = re.search(r'```(?:json)?\s*(.*?)\s*```', json_text, re.DOTALL)
    if markdown_match:
        content = markdown_match.group(1).strip()
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Try to fix escaped quotes in this block
            try:
                fixed = re.sub(r':\s*\\+"([^"]*)\\+"', r': "\1"', content)
                return json.loads(fixed)
            except json.JSONDecodeError:
                pass
            
    # 3. Try to find anything between the first { and the last }
    json_match = re.search(r'(\{.*\})', json_text, re.DOTALL)
    if json_match:
        content = json_match.group(1).strip()
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Try to fix escaped quotes in this block
            try:
                fixed = re.sub(r':\s*\\+"([^"]*)\\+"', r': "\1"', content)
                return json.loads(fixed)
            except json.JSONDecodeError:
                pass
            
    # 4. Handle escaped quotes on the whole text if nothing else worked
    try:
        fixed = re.sub(r':\s*\\+"([^"]*)\\+"', r': "\1"', json_text)
        # Try finding JSON again in the fixed text
        retry_match = re.search(r'(\{.*\})', fixed, re.DOTALL)
        if retry_match:
            return json.loads(retry_match.group(1))
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass

    return None

def detect_scenario_type(scenario: str, ai_role: str, role: str) -> str:
    """Detect the scenario type based on keywords in scenario and roles."""
    text = f"{scenario} {ai_role} {role}".lower()
    
    if any(k in text for k in ["negotiation", "bargain", "price", "deal", "contract"]):
        return "negotiation"
    if any(k in text for k in ["sales", "sell", "prospect", "customer", "client"]):
        return "sales"
    if any(k in text for k in ["leadership", "strategy", "vision", "inspire", "executive"]):
        return "leadership"
    if any(k in text for k in ["conflict", "dispute", "resolution", "argument", "mediation"]):
        return "conflict_resolution"
    if any(k in text for k in ["customer service", "complaint", "support", "help desk"]):
        return "customer_service"
    if any(k in text for k in ["mentor", "mentorship", "pivot", "intervention", "ethics", "promotion"]):
        return "mentorship"
    if any(k in text for k in ["career", "growth", "aspiration"]):
        return "career_development"
    if any(k in text for k in ["well-being", "stress", "mental health", "balance", "wellness"]):
        return "wellness"
        
    return "coaching_sim"


def detect_user_role_context(role: str, ai_role: str) -> str:
    """Detect the specific sub-role of the user (e.g., Manager vs Staff, Seller vs Buyer)."""
    role_lower = role.lower()
    
    # Coaching Context
    if any(k in role_lower for k in ["manager", "supervisor", "lead", "coach"]):
        return "manager"
    if any(k in role_lower for k in ["staff", "associate", "employee", "report", "subordinate"]):
        return "staff"
        
    # Sales/Negotiation Context
    if any(k in role_lower for k in ["sales", "account executive", "rep", "seller"]):
        return "seller"
    if any(k in role_lower for k in ["customer", "buyer", "client", "prospect"]):
        return "buyer"
        
    return "unknown"

# =====================================================================
# NEW: Parallel Analysis Functions for Speed Optimization
# =====================================================================

def analyze_character_traits(transcript, role, ai_role, scenario, scenario_type):
    """
    Analyze user's character/personality traits and assess fit for the scenario.
    This runs in PARALLEL with main report generation for speed.
    """
    user_msgs = [t for t in transcript if t['role'] == 'user']
    if not user_msgs:
        return {}
    
    conversation = "\n".join([f"[HUMAN LEARNER ({role})]: {t['content']}" for t in user_msgs])
    
    # Universal required traits for all scenarios
    required_traits = ["Active Listening", "Empathy", "Accountability", "Growth Mindset", "Professional Communication"]
    
    prompt = f"""
You are providing a professional assessment of a human player's character and personality fit for a {scenario_type} simulation.

Note: In the transcript, the human player is labeled '[HUMAN LEARNER]' (Role: '{role}').
The AI assistant is labeled '[AI CHARACTER]' (Role: '{ai_role}').
Evaluate the [HUMAN LEARNER] ONLY based on their participation.

(Scenario details are in report metadata; do not rely on it in the prompt.)

REQUIRED TRAITS: {', '.join(required_traits)}

Analyze the [HUMAN LEARNER]'s character based exclusively on their responses.

CONVERSATION:
{conversation}

Return VALID JSON with this EXACT structure:
{{
  "observed_traits": [
    {{
      "trait": "Trait Name (e.g., Defensiveness, Accountability, Curiosity)",
      "evidence_quote": "EXACT quote from conversation",
      "impact": "Positive" or "Negative",
      "insight": "Why this trait helps or hinders success in this scenario"
    }}
  ],
  "scenario_fit": {{
    "required_traits": {json.dumps(required_traits)},
    "user_strengths": ["Traits they demonstrated well"],
    "user_gaps": ["Traits they're missing or weak in"],
    "fit_score": "X/10",
    "fit_assessment": "Overall assessment of character fit",
    "development_priority": "The #1 character trait they need to develop"
  }},
  "character_development_plan": [
    "Specific behavior change 1 (e.g., Practice phrase: 'That's on me...')",
    "Specific behavior change 2 (e.g., Pause 3 seconds before defending)"
  ]
}}

Be SPECIFIC. Quote EXACT words. No generic advice.
"""
    
    try:
        chain = prompt_template | report_llm
        response = chain.invoke({"prompt": prompt}, config={"run_name": "character_analysis", "tags": ["report", "analysis"]})
        
        # Robust parsing
        json_text = response.content if hasattr(response, 'content') else str(response)
        result = parse_json_robustly(json_text)
        
        if result is None:
            print(f" [ERROR] Character analysis JSON parse failed. Raw response: {json_text[:500]}...")
            raise ValueError("Invalid JSON format from LLM")
            
        print(" [SUCCESS] Character analysis completed")
        return result
        
    except Exception as e:
        print(f" [ERROR] Character analysis failed: {e}")
        return {
            "observed_traits": [],
            "scenario_fit": {
                "required_traits": required_traits,
                "user_strengths": [],
                "user_gaps": ["Analysis unavailable"],
                "fit_score": "N/A",
                "fit_assessment": "Unable to analyze",
                "development_priority": "N/A"
            },
            "character_development_plan": []
        }


def analyze_questions_missed(transcript, role, ai_role, scenario, scenario_type):
    """
    Identify questions the user SHOULD have asked but didn't.
    This runs in PARALLEL for speed.
    """
    user_msgs = [t for t in transcript if t['role'] == 'user']
    if not user_msgs:
        return {}
    
    conversation = "\n".join([
        f"[HUMAN LEARNER ({role})]: {t['content']}" if t['role'] == 'user' else f"[AI CHARACTER ({ai_role})]: {t['content']}"
        for t in transcript
    ])
    
    # Count questions user actually asked
    questions_asked = sum(1 for msg in user_msgs if '?' in msg['content'])
    
    prompt = f"""
You are providing a professional assessment of questioning quality in a {scenario_type} simulation.

Note: In the transcript, the human player is labeled '[HUMAN LEARNER]' (Role: '{role}').
The AI assistant is labeled '[AI CHARACTER]' (Role: '{ai_role}').
Evaluate the [HUMAN LEARNER] ONLY based on their questioning approach.

(Scenario details are in report metadata; do not rely on it in the prompt.)

CONVERSATION:
{conversation}

Analyze what QUESTIONS the [HUMAN LEARNER] SHOULD HAVE ASKED but DIDN'T.


For {scenario_type} scenarios, strong performers ask:
- Open-ended discovery questions (to understand needs)
- Probing questions (to uncover root causes)
- Clarifying questions (to remove ambiguity)
- Vision/Outcome questions (to align on goals)
- Closing/Action questions (to drive commitment)

Return VALID JSON with this EXACT structure:
{{
  "questions_asked_count": {questions_asked},
  "questions_missed": [
    {{
      "question": "The exact question they should have asked",
      "category": "Discovery | Probing | Clarifying | Vision | Closing",
      "timing": "Early | Mid | Late",
      "why_important": "Why this question matters for success",
      "when_to_ask": "At what point in the conversation (e.g., Turn 2, when X happened)",
      "impact_if_asked": "What outcome this question would have enabled"
    }}
  ],
  "question_quality_score": "X/10",
  "question_quality_feedback": "Overall assessment of their questioning approach",
  "questioning_improvement_tip": "Specific advice to ask better questions"
}}

Identify 3-5 HIGH-IMPACT questions they missed IF they genuinely missed them. Do NOT invent missed questions if performance was strong.
Categorize each question and specify optimal timing in the conversation.
"""
    
    try:
        chain = prompt_template | report_llm
        response = chain.invoke({"prompt": prompt}, config={"run_name": "question_analysis", "tags": ["report", "analysis"]})
        
        # Robust parsing
        json_text = response.content if hasattr(response, 'content') else str(response)
        result = parse_json_robustly(json_text)
        
        if result is None:
            print(f" [ERROR] Question analysis JSON parse failed. Raw response: {json_text[:500]}...")
            raise ValueError("Invalid JSON format from LLM")
            
        print(" [SUCCESS] Question analysis completed")
        return result
        
    except Exception as e:
        print(f" [ERROR] Question analysis failed: {e}")
        return {
            "questions_asked_count": questions_asked,
            "questions_missed": [],
            "question_quality_score": "N/A",
            "question_quality_feedback": "Analysis unavailable",
            "questioning_improvement_tip": "Ask more open-ended questions to discover deeper needs"
        }


def analyze_full_report_data(transcript, role, ai_role, scenario, framework=None, mode="coaching", scenario_type=None, ai_character="alex", simulation_id=None, session_mode=None):
    """
    Generate report data using SCENARIO-SPECIFIC structures.
    For mentorship sessions (session_mode='mentorship'), generates qualitative feedback only (no numerical scores).
    """
    # Auto-detect scenario type if not provided
    if not scenario_type:
        scenario_type = detect_scenario_type(scenario, ai_role, role)
    
    # Detect granular user role
    user_context = detect_user_role_context(role, ai_role)
    print(f"[INFO] User Context Detected: {user_context} (Scenario: {scenario_type})")

    # CHARACTER SCHEMA OVERRIDE REMOVED - Relying on scenario_type detection
    # if ai_character == 'sarah': ...
    
    # Extract only user messages for focused analysis
    user_msgs = [t for t in transcript if t['role'] == 'user']
    
    # Base metadata
    meta = {
        "scenario_id": scenario_type,
        "outcome_status": "Completed", 
        "overall_grade": "N/A",
        "summary": "Session analysis.",
        "scenario_type": scenario_type,
        "scenario": scenario,  # Pass full scenario text to frontend
        "session_mode": session_mode or "skill_assessment"  # Pass session_mode to frontend
    }

    if not user_msgs:
        meta["outcome_status"] = "Not Started"
        meta["summary"] = "Session started but no interaction recorded."
        return { "meta": meta, "type": scenario_type }

    # -------------------------------------------------------------
    # UNIFIED PROMPT: Every scenario uses the same 15-section Rich Structure
    # -------------------------------------------------------------
    
    # Universal scorecard dimensions mapping for structured simulations
    SIMULATION_DIMENSIONS = {
        "SIM-01-PERF-001": "Empathy & Respect, Clarity with Facts, Coaching Questions, Ownership Creation, Action Plan Quality, Follow-up Discipline",
        "SIM-02-BEH-001": "Behavioural Clarity, Separation of Identity vs Behaviour, Emotional Regulation, Ownership Creation, Team Culture Framing, Action Commitment & Follow-up",
        "SIM-03-MOT-001": "Observational Awareness, Non-judgmental Curiosity, Emotional Validation, Diagnostic Depth, Re-engagement Strategy, Follow-up Structure",
        "SIM-04-COM-001": "Emotional Regulation under Pressure, Data-Backed Argumentation, Structured Communication, Assertiveness without Defensiveness, Solution Orientation, Credibility Building",
        "SIM-05-CON-001": "Neutrality Maintenance, Emotional De-escalation, Balanced Participation, Root Cause Identification, Shared Solution Creation, Clear Agreement & Follow-up",
        "SIM-06-CUST-001": "Emotional Stability Under Pressure, Accountability Framing, Clarification Quality, Non-Defensive Communication, Solution Structuring, Confidence & Credibility",
        "SIM-07-LEAD-001": "Expectation Clarity, Non-Blaming Language, Ownership Transfer, Empowerment vs Micromanagement Balance, Accountability Structure, Confidence Reinforcement",
        "SIM-08-CHG-001": "Non-Defensive Listening, Curiosity & Exploration, Emotional Validation, Change Purpose Framing, Ownership Activation, Influence Management",
        "SIM-09-CAR-001": "Emotional Validation, Clarity of Developmental Feedback, Specific Behaviour Examples, Future-Focused Framing, Growth Roadmap Definition, Motivation Reinforcement",
        "SIM-10-WELL-001": "Observational Sensitivity, Psychological Safety Creation, Emotional Validation, Avoidance of Premature Solutions, Sustainable Adjustment Planning, Accountability Balance",
        "SIM-11-MENTOR-001": "Psychological Safety, Active Listening, Empowerment Level, Radical Candor, Accountability Mapping, Long-term Vision",
        # Mentorship Simulations (user as subordinate)
        "MENT-01-PERF-001": "Self-Awareness, Honest Communication, Help-Seeking Ability, Commitment to Growth, Specificity of Action Plan, Emotional Composure",
        "MENT-02-BEH-001": "Active Listening, Non-Defensiveness, Self-Reflection, Willingness to Change, Empathy Toward Others, Commitment to Behavior Shift",
        "MENT-03-MOT-001": "Honest Self-Expression, Vulnerability, Root Cause Identification, Initiative in Problem-Solving, Collaborative Engagement, Future Orientation",
        "MENT-04-COM-001": "Data-Driven Argumentation, Professional Composure, Assertiveness, Solution Orientation, Credibility Building, Stakeholder Empathy",
        "MENT-05-CON-001": "I-Statement Usage, Active Listening, Neutrality Under Pressure, Bottleneck Identification, Collaborative Problem-Solving, Commitment to New Protocols",
        "MENT-06-CUST-001": "Active Listening, Emotional De-escalation, Promise Management, Recovery Plan Clarity, Follow-up Commitment, Professional Credibility",
        "MENT-07-LEAD-001": "Self-Awareness of Patterns, Decision-Making Confidence, Upward Communication, Ownership Mindset, Solution-First Thinking, Accountability Commitment",
        "MENT-08-CHG-001": "Constructive Feedback, Open-Mindedness, Team Player Attitude, Pilot Willingness, Technical Concern Specificity, Adaptability",
        "MENT-09-CAR-001": "Emotional Regulation, Growth Mindset, Feedback Receptiveness, Proactive Planning, Mentorship Seeking, Timeline Commitment",
        "MENT-10-WELL-001": "Vulnerability & Honesty, Workload Articulation, Boundary Setting, Sustainable Habit Proposal, Long-term Commitment, Help-Seeking Ability"
    }

    # Scenario-type generic dimensions (fallback if no simulation_id)
    TYPE_DIMENSIONS = {
        "sales": "Rapport Building, Need Discovery, Objection Handling, Value Proposition, Closing Skills, Follow-up Planning",
        "negotiation": "Interest Identification, BATNA Management, Trade-off Strategy, De-escalation, Win-Win Framing, Agreement Clarity",
        "leadership": "Vision Setting, Empowerment Level, Strategic Alignment, Feedback Clarity, Accountability Framing, Inspiration",
        "conflict_resolution": "Neutrality, Active Listening, Root Cause Identification, Emotional Regulation, Shared Solutioning, Resolution Clarity",
        "customer_service": "Emotional Stability, Accountability Framing, Clarification Quality, Non-Defensive Communication, Solution Speed, Professionalism",
        "career_development": "Aspiration Alignment, Skill Gap Identification, Narrative Building, Growth Mindset, Roadmap Clarity, Motivation Reinforcement",
        "wellness": "Psychological Safety, Empathetic Listening, Validation Quality, Stress Source ID, Support Resource Alignment, Wellness Commitment",
        "mentorship": "Psychological Safety, Socratic Questioning, Accountability Transfer, Active Listening, Radical Candor, Long-term Vision",
        "mentorship_sim": "Self-Awareness, Honest Communication, Active Listening, Growth Mindset, Help-Seeking Ability, Commitment to Action"
    }
    
    # Select dimensions: 1. Specific Simulation, 2. Scenario Type, 3. Default Coaching
    if simulation_id and simulation_id in SIMULATION_DIMENSIONS:
        scorecard_dimensions = SIMULATION_DIMENSIONS[simulation_id]
    elif scenario_type in TYPE_DIMENSIONS:
        scorecard_dimensions = TYPE_DIMENSIONS[scenario_type]
    else:
        scorecard_dimensions = "Empathy & Respect, Clarity with Facts, Coaching Questions, Ownership Creation, Action Plan Quality, Follow-up Discipline"

    # =====================================================================
    # MENTORSHIP MODE: Delegate to mentorship_report module
    # =====================================================================
    is_mentorship = (session_mode == "mentorship" or mode == "mentorship")
    
    if False:
        from mentorship_report import analyze_mentorship_report_data
        return analyze_mentorship_report_data(
            transcript, role, ai_role, scenario,
            scenario_type=scenario_type,
            ai_character=ai_character,
            session_mode=session_mode,
        )
    else:
        unified_instruction = f"""
=== CRITICAL EVALUATION TARGET ===
You MUST evaluate ONLY the [HUMAN LEARNER]'s performance (the person playing "{role}").
Do NOT evaluate the [AI CHARACTER]'s performance (the AI playing "{ai_role}").
The [AI CHARACTER]'s responses are ONLY context for understanding how the [HUMAN LEARNER] reacted.
Every score, quote, and insight MUST be about the [HUMAN LEARNER]'s words and actions ONLY.
===

Use encouraging plain English. Every score needs transcript evidence from [HUMAN LEARNER] lines ONLY. Concise reasoning (1-2 sentences).

**Scorecard**: Evaluate the [HUMAN LEARNER]'s performance on these 6 dimensions (1-10): {scorecard_dimensions}

**JSON Schema**:
{{
  "meta": {{ "scenario_id": "{scenario_type}", "outcome_status": "Completed/Incomplete", "overall_grade": "X/10", "summary": "Brief summary of [HUMAN LEARNER]'s performance." }},
  "type": "unified_report",
  "conversation_snapshot": {{ "simulation_context": {{ "your_role": "{role}", "ai_role": "{ai_role}", "scenario_type": "{scenario_type}", "primary_skill_focus": "" }}, "conversation_flow_overview": "" }},
  "executive_summary": {{ "snapshot": "", "final_score": "X/10", "strengths_summary": "", "improvements_summary": "", "outcome_summary": "" }},
  "goal_attainment": {{ "score": "X/10", "expectation_vs_reality": "", "primary_gaps": [], "observation_focus": [] }},
  "coaching_style": {{ "primary_style": "Directive|Supportive|Avoidant|Balanced", "description": "" }},
  "deep_dive_analysis": [{{ "topic": "", "tone": "", "impact": "", "analysis": "" }}],
  "pattern_summary": "",
  "behaviour_analysis": [{{ "behavior": "", "quote": "EXACT verbatim quote from [HUMAN LEARNER] only", "insight": "", "impact": "Positive/Negative", "improved_approach": "rephrased version only" }}],
  "turning_points": [{{ "point": "", "timestamp": "" }}],
  "eq_analysis": [{{ "nuance": "", "observation": "", "suggestion": "" }}],
  "heat_map": [{{ "dimension": "", "score": 8 }}],
  "scorecard": [{{ "dimension": "", "score": "X/10", "reasoning": "", "quote": "EXACT verbatim quote from [HUMAN LEARNER] only", "suggestion": "", "alternative_questions": [{{ "question": "rephrased only", "rationale": "" }}] }}],
  "ideal_questions": [{{ "question": "new strategic question the [HUMAN LEARNER] could have asked", "definition": "", "scoring": "10/10", "impact": "" }}],
  "action_plan": {{ "specific_actions": [], "timeline": "Next 30 days", "success_indicators": [] }},
  "follow_up_strategy": {{ "review_cadence": "", "metrics_to_track": [], "accountability_method": "" }},
  "strengths_and_improvements": {{ "strengths": [], "missed_opportunities": [] }},
  "final_evaluation": {{ "readiness_level": "", "maturity_rating": "X/10", "immediate_focus": [], "long_term_suggestion": "" }},
  "character_assessment": {{ "observed_traits": [{{ "trait": "", "evidence_quote": "EXACT quote from [HUMAN LEARNER]", "impact": "", "insight": "" }}], "scenario_fit": {{ "required_traits": ["Active Listening","Empathy","Accountability","Growth Mindset","Professional Communication"], "user_strengths": [], "user_gaps": [], "fit_score": "X/10", "fit_assessment": "", "development_priority": "" }}, "character_development_plan": [] }},
  "question_analysis": {{ "questions_asked_count": 0, "questions_missed": [{{ "question": "", "category": "Discovery|Probing|Clarifying|Vision|Closing", "timing": "Early|Mid|Late", "why_important": "", "when_to_ask": "", "impact_if_asked": "" }}], "question_quality_score": "X/10", "question_quality_feedback": "", "questioning_improvement_tip": "" }}
}}

RULES:
- ideal_questions must have 3-5 NEW questions (not repeats) that the [HUMAN LEARNER] could have asked.
- character_assessment and question_analysis are REQUIRED.
- questions_missed: Include 3-5 questions IF the learner genuinely missed them. If they performed well, include fewer. Do NOT invent missed questions.
- ALL quotes MUST come from [HUMAN LEARNER] lines. NEVER quote [AI CHARACTER] lines as evidence.
- TONE: Use balanced, objective, and constructive language. Do NOT use overly harsh, dramatic, or exaggerated phrasing in summaries (e.g., avoid "completely failed").
"""

    # ANALYST PERSONA (compressed)
    analyst_persona = ""
    if scenario_type == "mentorship" or simulation_id == "SIM-11-MENTOR-001":
        analyst_persona = "STYLE: Wise, outcome-oriented. Focus on empathy vs high standards balance. Quote exact words."
    elif ai_character == "sarah":
        analyst_persona = "STYLE: Warm, encouraging, high-EQ. Focus on psychological safety and growth mindset. Quote exact words."
    else:
        analyst_persona = "STYLE: Professional, direct, analytical. Back every score with verbatim quote. High-impact tactical advice."

    # Unified System Prompt — explicitly identifies who to evaluate
    system_prompt = (
        f"You are a professional performance analyst assessing a roleplay session.\n"
        f"\n"
        f"=== WHO TO EVALUATE ===\n"
        f"[HUMAN LEARNER] = The real human user, playing the role of \"{role}\". EVALUATE THIS PERSON ONLY.\n"
        f"[AI CHARACTER] = The AI system, playing the role of \"{ai_role}\". Do NOT evaluate this. Use only as context.\n"
        f"===\n"
        f"\n"
        f"{analyst_persona}\n"
        f"{unified_instruction}\n"
        f"\n"
        f"Use the transcript below as your SOLE source of truth. ALL verbatim quotes MUST come from [HUMAN LEARNER] lines.\n"
        f"Return a single JSON object. Do NOT include any text before or after the JSON.\n"
    )

    try:
        # Create conversation text for analysis — explicit labels to prevent role confusion
        full_conversation = "\n".join([f"[HUMAN LEARNER ({role})]: {t['content']}" if t['role'] == 'user' else f"[AI CHARACTER ({ai_role})]: {t['content']}" for t in transcript])
        
        # Setup LangChain Parser
        parser = JsonOutputParser()
        
        # Create Prompt Template
        prompt = PromptTemplate(
            template="{system_prompt}\n\n{format_instructions}\n\n### FULL CONVERSATION\n{conversation}",
            input_variables=["system_prompt", "conversation"],
            partial_variables={"format_instructions": parser.get_format_instructions()}
        )
        
        # Create Chain
        chain_raw = prompt | report_llm
        
        # =====================================================================
        # CONSOLIDATED: Single LLM call instead of 3 parallel calls
        # Saves ~60% API cost by eliminating 2 redundant transcript sends
        # =====================================================================
        print(f" [INFO] Starting CONSOLIDATED report generation (1 LLM call instead of 3)...", flush=True)
        
        t1 = dt.datetime.now()
        
        try:
            raw_response = chain_raw.invoke(
                {
                    "system_prompt": system_prompt,
                    "conversation": full_conversation
                },
                config={
                    "run_name": "report_generation",
                    "tags": ["report", scenario_type or "unknown"]
                }
            )
        except Exception as invoke_error:
            print(f" [ERROR] Report LLM call failed: {invoke_error}", flush=True)
            raw_response = None
        
        t2 = dt.datetime.now()
        print(f" [SUCCESS] Consolidated report completed in {(t2-t1).total_seconds():.2f}s (saved 2 LLM calls)", flush=True)
        
        # Handle potential timeout/None response
        if raw_response is None:
            print(f" [ERROR] Main report generation failed", flush=True)
            return {
                "meta": {
                    "scenario_id": scenario_type,
                    "outcome_status": "Error",
                    "summary": "Report generation failed. Please try again.",
                    "scenario_type": scenario_type,
                    "session_mode": session_mode or "skill_assessment"
                },
                "type": scenario_type
            }
        
        # Robust JSON parsing
        content = raw_response.content if hasattr(raw_response, 'content') else str(raw_response)
        if isinstance(content, str):
            json_text = content.strip()
        elif isinstance(content, list):
            json_text = "".join(str(x) for x in content).strip()
        else:
            json_text = str(content).strip()
        data = parse_json_robustly(json_text)
        
        if data is None:
            print(f" [ERROR] Main report JSON parse failed. Raw response: {json_text[:1000]}...", flush=True)
            try:
                data = parser.parse(json_text)
                print(f" [SUCCESS] LangChain parser succeeded as fallback", flush=True)
            except Exception as parser_error:
                print(f" [ERROR] LangChain parser also failed: {parser_error}", flush=True)
                raise ValueError("Could not parse JSON from main report response")
        else:
            print(f" [SUCCESS] Main report JSON parsed successfully", flush=True)
        
        # Ensure meta exists and session_mode is always preserved
        if 'meta' not in data: data['meta'] = {}
        data['meta']['scenario_type'] = scenario_type
        data['meta']['session_mode'] = session_mode or data['meta'].get('session_mode', 'skill_assessment')
        if 'type' not in data: data['type'] = scenario_type

        # Ensure character_assessment and question_analysis exist (fallback if LLM omitted them)
        if 'character_assessment' not in data:
            data['character_assessment'] = {
                "observed_traits": [], "scenario_fit": {"required_traits": [], "user_strengths": [], "user_gaps": ["Analysis unavailable"], "fit_score": "N/A", "fit_assessment": "Unable to analyze", "development_priority": "N/A"},
                "character_development_plan": []
            }
        if 'question_analysis' not in data:
            data['question_analysis'] = {
                "questions_asked_count": 0, "questions_missed": [], "question_quality_score": "N/A",
                "question_quality_feedback": "Analysis unavailable", "questioning_improvement_tip": "Ask more open-ended questions"
            }

        return data
        
    except Exception as e:
        print(f"Error in data analysis: {e}")
        return {"meta": meta, "error": str(e)}


class DashboardPDF(FPDF):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._session_mode = None
    def cell(self, w=None, h=None, text='', border=0, ln='DEPRECATED', align='', fill=False, link='', **kwargs): # type: ignore
        # Auto-sanitize all text going into cells
        txt = sanitize_text(text) if text else ''
        # Forward compatible call to parent
        super().cell(w=w, h=h, txt=txt, border=border, ln=ln, align=align, fill=fill, link=link) # type: ignore
    
    def multi_cell(self, w, h=None, text='', border=0, align='J', fill=False, **kwargs): # type: ignore
        # Auto-sanitize all text going into multi_cells  
        txt = sanitize_text(text) if text else ''
        
        # Save original left margin
        original_l_margin = self.l_margin
        
        # If current X is different from left margin, temporarily set left margin
        # to current X so that subsequent lines in multi_cell align correctly
        if abs(self.get_x() - self.l_margin) > 0.1:
            self.set_left_margin(self.get_x())
            
        # Use provided align, default to Justified if not specified for long text
        super().multi_cell(w=w, h=h, txt=txt, border=border, align=align, fill=fill) # type: ignore
        
        # Restore original left margin
        self.set_left_margin(original_l_margin)

    def draw_wrapped_text(self, x, y, width, line_height, text):
        """Draw text with precise wrapping at fixed X position.
        Returns the Y position after the last line.
        Unlike multi_cell, this guarantees every wrapped line starts at exactly X."""
        text = sanitize_text(text) if text else ''
        if not text:
            return y
        
        # Use FPDF's internal string width calculation for accurate wrapping
        words = text.split(' ')
        lines = []
        current_line = ''
        
        for word in words:
            test_line = f"{current_line} {word}".strip() if current_line else word
            if self.get_string_width(test_line) <= width:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                # Handle single words wider than the available width
                if self.get_string_width(word) > width:
                    # Force-break the word
                    lines.append(word)
                    current_line = ''
                else:
                    current_line = word
        if current_line:
            lines.append(current_line)
        
        if not lines:
            return y
        
        for line in lines:
            self.set_xy(x, y)
            super().cell(width, line_height, line, 0, 0, 'L')
            y += line_height
        
        return y
    
    def footer(self):
        self.set_y(-15)
        # Add subtle line separator
        self.set_draw_color(200, 200, 200)
        self.line(10, self.get_y(), 200, self.get_y())
        self.set_y(-12)
        # Page number on left
        self.set_font('helvetica', '', 8)
        self.set_text_color(128, 128, 128)
        super().cell(30, 10, f'Page {self.page_no()}', 0, 0, 'L')
        # Branding in center
        self.set_font('helvetica', 'I', 8)
        super().cell(140, 10, 'Generated by CoAct.AI Coaching Engine', 0, 0, 'C')
        # Timestamp on right
        self.set_font('helvetica', '', 7)
        super().cell(0, 10, dt.datetime.now().strftime('%Y-%m-%d'), 0, 0, 'R')

    def set_scenario_type(self, scenario_type):
        self.scenario_type = scenario_type

    def get_title(self, section_key):
        stype = getattr(self, 'scenario_type', 'custom')
        return SCENARIO_TITLES.get(stype, SCENARIO_TITLES['universal']).get(section_key, section_key.upper())

    def linear_gradient(self, x, y, w, h, c1, c2, orientation='H'):
        self.set_line_width(0)
        if orientation == 'H':
            for i in range(int(w)):
                r = c1[0] + (c2[0] - c1[0]) * (i / w)
                g = c1[1] + (c2[1] - c1[1]) * (i / w)
                b = c1[2] + (c2[2] - c1[2]) * (i / w)
                self.set_fill_color(int(r), int(g), int(b))
                self.rect(x + i, y, 1, h, 'F')
        else:
            for i in range(int(h)):
                r = c1[0] + (c2[0] - c1[0]) * (i / h)
                g = c1[1] + (c2[1] - c1[1]) * (i / h)
                b = c1[2] + (c2[2] - c1[2]) * (i / h)
                self.set_fill_color(int(r), int(g), int(b))
                self.rect(x, y + i, w, 1, 'F')

    def set_user_name(self, name):
        self.user_name = sanitize_text(name)

    def set_character(self, character):
        self.ai_character = sanitize_text(character).capitalize()

    def header(self):
        if self.page_no() == 1:
            session_mode = getattr(self, '_session_mode', None)
            is_mentorship = session_mode == 'mentorship'

            if is_mentorship:
                # Delegate to mentorship_report module
                from mentorship_report import draw_mentorship_cover
                draw_mentorship_cover(self)
            else:
                # ── Standard Cover Page (unchanged) ──
                self.linear_gradient(0, 0, 210, 40, COLORS['header_grad_1'], COLORS['header_grad_2'], 'H')
                self.set_xy(10, 8)
                self.set_font('helvetica', 'B', 24)
                self.set_text_color(255, 255, 255)
                super().cell(0, 10, 'COACT.AI', 0, 0, 'L')
                self.set_xy(10, 22)
                self.set_font('helvetica', '', 11)
                self.set_text_color(147, 197, 253)
                coach_name = getattr(self, 'ai_character', 'Alex')
                super().cell(0, 5, f'Performance Analysis by Coach {coach_name}', 0, 0, 'L')
                self.set_xy(140, 10)
                self.set_font('helvetica', '', 9)
                self.set_text_color(200, 220, 255)
                super().cell(50, 5, dt.datetime.now().strftime('%B %d, %Y'), 0, 0, 'R')
                if hasattr(self, 'user_name') and self.user_name:
                    self.set_xy(140, 16)
                    self.set_font('helvetica', 'I', 9)
                    super().cell(50, 5, f"Prepared for: {self.user_name}", 0, 0, 'R')
                self.ln(35)
        else:
            # Slim header for subsequent pages
            self.set_fill_color(*COLORS['header_grad_1'])
            self.rect(0, 0, 210, 14, 'F')
            self.set_xy(10, 4)
            self.set_font('helvetica', 'B', 10)
            self.set_text_color(255, 255, 255)
            super().cell(100, 6, 'CoAct.AI Report', 0, 0, 'L')
            self.set_font('helvetica', '', 9)
            self.set_text_color(180, 200, 255)
            super().cell(0, 6, f'Page {self.page_no()}', 0, 0, 'R')
            self.ln(18)

    def set_context(self, role, ai_role, scenario):
        self.user_role = sanitize_text(role)
        self.ai_role = sanitize_text(ai_role)
        self.scenario_text = sanitize_text(scenario)

    def check_space(self, height):
        if self.get_y() + height > self.page_break_trigger:
            self.add_page()

    def draw_context_summary(self):
        """Draw a summary of the scenario context and roles."""
        if not hasattr(self, 'user_role'): return
        
        self.check_space(40)
        self.ln(5)
        
        # Section Header
        self.set_font('helvetica', 'B', 10)
        self.set_text_color(71, 85, 105) # Slate 600
        self.cell(0, 6, "SCENARIO CONTEXT", 0, 1)
        
        # Grid Background
        self.set_fill_color(248, 250, 252) # Slate 50
        start_y = self.get_y()
        self.rect(10, start_y, 190, 35, 'F')
        
        # Draw Roles
        self.set_xy(15, start_y + 4)
        self.set_font('helvetica', 'B', 9)
        self.set_text_color(*COLORS['primary'])
        self.cell(20, 5, "Your Role:", 0, 0)
        self.set_font('helvetica', '', 9)
        self.set_text_color(*COLORS['text_main'])
        self.cell(60, 5, self.user_role, 0, 0)
        
        self.set_font('helvetica', 'B', 9)
        self.set_text_color(*COLORS['primary'])
        self.cell(20, 5, "Partner:", 0, 0)
        self.set_font('helvetica', '', 9)
        self.set_text_color(*COLORS['text_main'])
        self.cell(60, 5, self.ai_role, 0, 1)
        
        # Draw Scenario Description
        self.set_xy(15, start_y + 12)
        self.set_font('helvetica', 'B', 9)
        self.set_text_color(*COLORS['primary'])
        self.cell(0, 5, "Situation:", 0, 1)
        
        self.set_x(15)
        self.set_font('helvetica', '', 9)
        self.set_text_color(*COLORS['text_light'])
        # Truncate if too long to fit in box
        # Truncate if too long to fit in box
        text = self.scenario_text
        
        # Clean up text: Remove CONTEXT: prefix and AI BEHAVIOR section
        # The user wants JUST the situation, not the "CONTEXT" label or "AI BEHAVIOR" section.
        text = text.replace("CONTEXT:", "").replace("Situation:", "").strip()
        
        # Split by typical behavioral markers to ensure we only get the situation description
        for marker in ["AI BEHAVIOR:", "AI ROLE:", "USER ROLE:", "SCENARIO:"]:
            if marker in text:
                text = text.split(marker)[0].strip()
        
        if len(text) > 300: text = text[:297] + "..."
        self.multi_cell(180, 5, text)
        
        # Move cursor past the box (never jump backwards)
        actual_tmp = self.get_y()
        if actual_tmp < start_y: self.set_y(actual_tmp + 2)
        else: self.set_y(max(actual_tmp + 2, start_y + 40))

    def draw_scoring_methodology(self):
        """Draw the scoring rubric/methodology section."""
        self.check_space(50)
        self.ln(5)
        
        self.draw_section_header("SCORING METHODOLOGY (COACHING EFFICACY)", COLORS['secondary'])
        
        start_y = self.get_y()
        
        # Scoring Levels
        levels = [
            ("9-10 (Expert)", "Exceptional application of skills. Creates deep psychological safety, handles conflict with mastery, and drives clear outcomes."),
            ("7-8 (Proficient)", "Strong performance. Meets all core objectives effectively. Good empathy and strategy, with minor opportunities for refinement."),
            ("4-6 (Competent)", "Functional performance. Achieves basic goals but may miss subtle cues, sound robotic, or struggle with difficult objections."),
            ("1-3 (Needs Ops)", "Struggles with core skills. May be defensive, dismissive, or completely miss the objective. Immediate practice required.")
        ]
        
        # First pass: calculate total height needed
        current_y = start_y + 4
        row_positions = []
        for grade, desc in levels:
            row_positions.append(current_y)
            # Estimate lines needed for description text
            self.set_font('helvetica', '', 8)
            desc_width = 152
            text_width = self.get_string_width(desc)
            num_lines = max(1, int(text_width / desc_width) + 1)
            row_height = max(8, num_lines * 6 + 2)
            current_y += row_height
        
        total_height = current_y - start_y + 2
        
        # Draw background rectangle with calculated height
        self.set_fill_color(248, 250, 252)
        self.rect(10, start_y, 190, total_height, 'F')
        
        # Second pass: draw content
        for i, (grade, desc) in enumerate(levels):
            row_y = row_positions[i]
            self.set_xy(15, row_y)
            self.set_font('helvetica', 'B', 8)
            
            # Color coding for levels
            if "9-10" in grade: self.set_text_color(*COLORS['success'])
            elif "7-8" in grade: self.set_text_color(*COLORS['success'])
            elif "4-6" in grade: self.set_text_color(*COLORS['warning'])
            else: self.set_text_color(*COLORS['danger'])
            
            self.cell(26, 6, grade, 0, 0)
            
            self.set_font('helvetica', '', 8)
            self.set_text_color(*COLORS['text_light'])
            self.cell(3, 6, "|", 0, 0)
            
            self.set_text_color(*COLORS['text_main'])
            self.draw_wrapped_text(44, row_y, 152, 6, desc)

        self.set_y(start_y + total_height + 2)

    def draw_style_rubric(self):
        """Draw the Coaching Style rubric section."""
        self.check_space(60)
        self.ln(5)
        
        self.draw_section_header("PRIMARY COACHING STYLES (RUBRIC)", COLORS['accent'])
        
        start_y = self.get_y()
        
        styles = [
            ("Directive", "The coach tells the user exactly what to do. High control, low empowerment. Suitable for emergencies, but limits long-term growth.", COLORS['danger']),
            ("Supportive", "The coach provides high emotional validation but lacks structure or accountability. Good for building trust, but may stall progress.", COLORS['warning']),
            ("Avoidant", "The coach avoids difficult conversations, defaults to vague hope, or minimizes the gap. Fails to address core issues effectively.", COLORS['grey_text']),
            ("Balanced", "The coach validates emotion while driving accountability. Uses open questions and co-creates plans. The ideal coaching state.", COLORS['success'])
        ]
        
        # First pass: calculate total height needed
        current_y = start_y + 4
        row_positions = []
        for style, desc, color in styles:
            row_positions.append(current_y)
            # Estimate lines needed for description text
            self.set_font('helvetica', '', 8)
            desc_width = 152
            text_width = self.get_string_width(desc)
            num_lines = max(1, int(text_width / desc_width) + 1)
            row_height = max(10, num_lines * 6 + 3)
            current_y += row_height
        
        total_height = current_y - start_y + 2
        
        # Draw background rectangle with calculated height
        self.set_fill_color(248, 250, 252)
        self.rect(10, start_y, 190, total_height, 'F')
        
        # Second pass: draw content
        for i, (style, desc, color) in enumerate(styles):
            row_y = row_positions[i]
            self.set_xy(15, row_y)
            self.set_font('helvetica', 'B', 8)
            self.set_text_color(*color)
            self.cell(26, 6, style, 0, 0)
            
            self.set_font('helvetica', '', 8)
            self.set_text_color(*COLORS['text_light'])
            self.cell(3, 6, "|", 0, 0)
            
            self.set_text_color(*COLORS['text_main'])
            self.draw_wrapped_text(44, row_y, 152, 6, desc)

        self.set_y(start_y + total_height + 2)

    def draw_detailed_analysis(self, analysis_data):
        """Draw the detailed analysis section (Supporting string or list of topics)."""
        if not analysis_data: return
        
        # 1. Handle Legacy String Format (Backward Compatibility)
        if isinstance(analysis_data, str):
            self.check_space(60)
            self.ln(5)
            self.draw_section_header("DEEP DIVE ANALYSIS", COLORS['accent'])
            
            # Background Box
            self.set_fill_color(255, 255, 255)
            self.set_draw_color(226, 232, 240)
            self.rect(10, self.get_y(), 190, 45, 'DF')
            
            # Icon
            self.set_xy(15, self.get_y() + 5)
            self.set_font('helvetica', 'B', 14)
            self.set_text_color(*COLORS['accent'])
            self.cell(10, 10, "i", 0, 0, 'C') 
            
            # Text
            self.set_xy(25, self.get_y() + 2)
            self.set_font('helvetica', '', 10)
            self.set_text_color(*COLORS['text_main'])
            
            text = sanitize_text(analysis_data)
            if len(text) > 800: text = text[:797] + "..."
            self.multi_cell(170, 6, text)
            self.set_y(self.get_y() + 10)
            return

        # 2. Handle New List Format (Topic-Wise)
        if isinstance(analysis_data, list):
            self.check_space(60)
            self.ln(5)
            self.draw_section_header("DEEP DIVE ANALYSIS", COLORS['accent'])
            
            for item in analysis_data:
                topic = sanitize_text(item.get('topic', 'Topic'))
                content = sanitize_text(item.get('analysis', ''))
                
                # Estimate height
                num_lines = math.ceil(len(content) / 85) 
                height = (num_lines * 5) + 15
                
                self.check_space(height)
                
                # Draw Topic Header
                self.set_font('helvetica', 'B', 10)
                self.set_text_color(*COLORS['primary'])
                self.cell(0, 6, topic.upper(), 0, 1)
                
                # Draw Content
                self.set_font('helvetica', '', 10)
                self.set_text_color(*COLORS['text_main'])
                self.multi_cell(190, 5, content)
                self.ln(4)

    def draw_question_analysis(self, analysis):
        """Draw the Questions You Should Have Asked section.
        Uses draw_wrapped_text for pixel-perfect alignment of labels and content."""
        if not analysis: return
        questions = analysis.get('questions_missed', [])
        if not questions: return
        
        self.check_space(70)
        self.ln(5)
        self.draw_section_header("QUESTIONS YOU SHOULD HAVE ASKED", COLORS['primary'])
        
        # Draw Quality Score Summary if present
        score = analysis.get('question_quality_score')
        feedback = analysis.get('question_quality_feedback')
        tip = analysis.get('questioning_improvement_tip')
        
        if score or feedback or tip:
            # Pre-calculate box height based on content
            box_h = 12
            if feedback:
                self.set_font('helvetica', '', 9)
                avg_cw = 9 * 0.215
                fb_lines = max(1, math.ceil(len(sanitize_text(feedback)) / max(1, int(180 / avg_cw))))
                box_h += fb_lines * 5 + 4
            if tip:
                tip_text = f"TIP: {sanitize_text(tip)}"
                avg_cw = 9 * 0.215
                tip_lines = max(1, math.ceil(len(tip_text) / max(1, int(180 / avg_cw))))
                box_h += tip_lines * 5 + 4
            box_h = max(35, box_h + 6)
            
            self.check_space(box_h + 10)
            box_start_y = self.get_y()
            
            self.set_fill_color(248, 250, 252)
            self.rect(10, box_start_y, 190, box_h, 'F')
            
            summary_y = box_start_y + 4
            self.set_xy(15, summary_y)
            self.set_font('helvetica', 'B', 9)
            self.set_text_color(*COLORS['text_light'])
            self.cell(100, 5, "QUESTION QUALITY SCORE", 0, 0)
            
            if score:
                self.set_font('helvetica', 'B', 14)
                self.set_text_color(*COLORS['primary'])
                self.cell(75, 5, str(score), 0, 1, 'R')
            else:
                self.ln(5)
                
            if feedback:
                self.set_xy(15, self.get_y() + 2)
                self.set_font('helvetica', '', 9)
                self.set_text_color(*COLORS['text_main'])
                self.multi_cell(180, 5, sanitize_text(feedback))
                
            if tip:
                self.set_xy(15, self.get_y() + 2)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*COLORS['accent'])
                self.multi_cell(180, 5, f"TIP: {sanitize_text(tip)}")
            
            actual_tmp = self.get_y()
            if actual_tmp < box_start_y: self.set_y(actual_tmp + 2)
            else: self.set_y(max(actual_tmp + 2, box_start_y + box_h + 2))
            
        # Group Questions by Timing
        timings = ['Early', 'Mid', 'Late', 'Uncategorized']
        grouped_questions = {t: [] for t in timings}
        
        for q in questions:
            timing = q.get('timing', 'Uncategorized')
            if timing not in grouped_questions: 
                timing = 'Uncategorized'
            grouped_questions[timing].append(q)

        # Layout constants for question cards
        CARD_LEFT = 10       # Card left edge
        CARD_WIDTH = 190     # Card total width
        ACCENT_WIDTH = 2.5   # Blue accent bar width
        CONTENT_LEFT = 15    # Content area left edge (after accent bar)
        LABEL_X = 15         # Label X position
        LABEL_WIDTH = 20     # Width reserved for label (WHY:, WHEN:, IMPACT:)
        TEXT_X = 36           # Content text X position (after label)
        TEXT_WIDTH = 160      # Content text available width (CARD_LEFT + CARD_WIDTH - TEXT_X - 4)
        QUESTION_WIDTH = 138  # Question text width
        LINE_H = 5           # Line height

        def _calc_card_height_precise(q_text, why, when, impact):
            """Calculate card height using actual font metrics via get_string_width."""
            # Question text height
            self.set_font('helvetica', 'BI', 10)
            q_full = f'"{sanitize_text(q_text)}"'
            q_words = q_full.split(' ')
            q_lines = 1
            cur_line = ''
            for w in q_words:
                test = f"{cur_line} {w}".strip() if cur_line else w
                if self.get_string_width(test) <= QUESTION_WIDTH:
                    cur_line = test
                else:
                    q_lines += 1
                    cur_line = w
            h = 8 + (q_lines * LINE_H) + 3  # top padding + question + gap
            
            # Detail fields height
            self.set_font('helvetica', '', 8)
            for detail in [why, when, impact]:
                if not detail:
                    continue
                detail = sanitize_text(detail)
                d_words = detail.split(' ')
                d_lines = 1
                cur_line = ''
                for w in d_words:
                    test = f"{cur_line} {w}".strip() if cur_line else w
                    if self.get_string_width(test) <= TEXT_WIDTH:
                        cur_line = test
                    else:
                        d_lines += 1
                        cur_line = w
                h += (d_lines * LINE_H) + 3  # content lines + spacing
            h += 3  # bottom padding
            return max(h, 26)

        timing_colors = {
            'Early': (59, 130, 246),
            'Mid': (139, 92, 246),
            'Late': (245, 158, 11)
        }

        for timing in timings:
            timing_qs = grouped_questions[timing]
            if not timing_qs: continue
            
            if timing != 'Uncategorized':
                self.check_space(20)
                self.ln(4)
                tc = timing_colors.get(timing, (100, 116, 139))
                header_y = self.get_y()
                self.set_fill_color(241, 245, 249)
                self.rect(CARD_LEFT, header_y, CARD_WIDTH, 9, 'F')
                self.set_fill_color(*tc)
                self.rect(CARD_LEFT, header_y, ACCENT_WIDTH, 9, 'F')
                self.set_xy(16, header_y + 1.5)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*tc)
                self.cell(0, 6, f"{timing.upper()} CONVERSATION", 0, 1)
                self.ln(3)
                
            for q in timing_qs:
                question_text = sanitize_text(q.get('question', ''))
                category = sanitize_text(q.get('category', ''))
                why = sanitize_text(q.get('why_important', ''))
                when = sanitize_text(q.get('when_to_ask', ''))
                impact = sanitize_text(q.get('impact_if_asked', ''))
                
                card_h = _calc_card_height_precise(question_text, why, when, impact)
                self.check_space(card_h + 8)
                start_q_y = self.get_y()
                
                # STEP 1: Draw card background, border, and accent bar
                self.set_fill_color(255, 255, 255)
                self.rect(CARD_LEFT, start_q_y, CARD_WIDTH, card_h, 'F')
                self.set_draw_color(226, 232, 240)
                self.rect(CARD_LEFT, start_q_y, CARD_WIDTH, card_h, 'D')
                self.set_fill_color(59, 130, 246)
                self.rect(CARD_LEFT, start_q_y, ACCENT_WIDTH, card_h, 'F')
                
                # STEP 2: Draw question text using draw_wrapped_text
                self.set_font('helvetica', 'BI', 10)
                self.set_text_color(*COLORS['text_main'])
                cur_y = self.draw_wrapped_text(CONTENT_LEFT, start_q_y + 4, QUESTION_WIDTH, LINE_H, f'"{question_text}"')
                
                # Category badge (top-right corner)
                if category:
                    self.set_xy(158, start_q_y + 4)
                    self.set_font('helvetica', 'B', 7)
                    self.set_text_color(*COLORS['accent'])
                    super(DashboardPDF, self).cell(37, 5, f"[{category.upper()}]", 0, 0, 'R')
                    
                cur_y += 3  # Gap between question and details
                
                # STEP 3: Draw WHY/WHEN/IMPACT with draw_wrapped_text for precise alignment
                for detail_text, label, label_color in [
                    (why, "WHY:", COLORS['primary']),
                    (when, "WHEN:", COLORS['success']),
                    (impact, "IMPACT:", COLORS['warning']),
                ]:
                    if not detail_text:
                        continue
                    
                    # Draw label at fixed position
                    self.set_font('helvetica', 'B', 8)
                    self.set_text_color(*label_color)
                    self.set_xy(LABEL_X, cur_y)
                    super(DashboardPDF, self).cell(LABEL_WIDTH, LINE_H, label, 0, 0, 'L')
                    
                    # Draw content text at fixed position using draw_wrapped_text
                    self.set_font('helvetica', '', 8)
                    self.set_text_color(*COLORS['text_main'])
                    cur_y = self.draw_wrapped_text(TEXT_X, cur_y, TEXT_WIDTH, LINE_H, detail_text)
                    cur_y += 2  # Gap between detail fields
                
                # STEP 4: If content exceeded pre-drawn box, redraw the box to fit
                content_end = cur_y + 2
                if content_end > start_q_y + card_h:
                    actual_h = content_end - start_q_y
                    # Redraw background and border at actual size
                    self.set_fill_color(255, 255, 255)
                    self.rect(CARD_LEFT, start_q_y, CARD_WIDTH, actual_h, 'F')
                    self.set_draw_color(226, 232, 240)
                    self.rect(CARD_LEFT, start_q_y, CARD_WIDTH, actual_h, 'D')
                    self.set_fill_color(59, 130, 246)
                    self.rect(CARD_LEFT, start_q_y, ACCENT_WIDTH, actual_h, 'F')
                    
                    # RE-DRAW all text content (since we overwrote with background)
                    redraw_y = start_q_y + 4
                    self.set_font('helvetica', 'BI', 10)
                    self.set_text_color(*COLORS['text_main'])
                    redraw_y = self.draw_wrapped_text(CONTENT_LEFT, redraw_y, QUESTION_WIDTH, LINE_H, f'"{question_text}"')
                    if category:
                        self.set_xy(158, start_q_y + 4)
                        self.set_font('helvetica', 'B', 7)
                        self.set_text_color(*COLORS['accent'])
                        super(DashboardPDF, self).cell(37, 5, f"[{category.upper()}]", 0, 0, 'R')
                    redraw_y += 3
                    for detail_text, label, label_color in [
                        (why, "WHY:", COLORS['primary']),
                        (when, "WHEN:", COLORS['success']),
                        (impact, "IMPACT:", COLORS['warning']),
                    ]:
                        if not detail_text:
                            continue
                        self.set_font('helvetica', 'B', 8)
                        self.set_text_color(*label_color)
                        self.set_xy(LABEL_X, redraw_y)
                        super(DashboardPDF, self).cell(LABEL_WIDTH, LINE_H, label, 0, 0, 'L')
                        self.set_font('helvetica', '', 8)
                        self.set_text_color(*COLORS['text_main'])
                        redraw_y = self.draw_wrapped_text(TEXT_X, redraw_y, TEXT_WIDTH, LINE_H, detail_text)
                        redraw_y += 2
                    
                    self.set_y(start_q_y + actual_h + 4)
                else:
                    self.set_y(start_q_y + card_h + 4)

    def draw_eq_analysis(self, eq_data):
        """Draw the Emotional Intelligence & Nuance section."""
        if not eq_data: return

        self.check_space(60)
        self.ln(5)
        self.draw_section_header("EMOTIONAL INTELLIGENCE (EQ) & NUANCE", COLORS['section_eq'])

        for item in eq_data:
            # Handle both dict and string items
            if isinstance(item, dict):
                nuance = sanitize_text(item.get('nuance', 'User Observation'))
                observation = sanitize_text(item.get('observation', ''))
                suggestion = sanitize_text(item.get('suggestion', ''))
            elif isinstance(item, str):
                nuance = 'User Observation'
                observation = sanitize_text(item)
                suggestion = ''
            else:
                continue
            
            # Estimate height conservatively
            height = 15
            if observation: height += int(len(observation) / 75 + 1) * 5 + 5 
            if suggestion: height += int(len(suggestion) / 75 + 1) * 5 + 10
            
            self.check_space(height + 10)
            start_y = self.get_y()
            
            # Background
            self.set_fill_color(253, 242, 248)
            self.rect(10, start_y, 190, height, 'F')
            
            # Left Bar
            self.set_fill_color(*COLORS['section_eq'])
            self.rect(10, start_y, 2, height, 'F')
            
            current_y = start_y + 3
            
            # Draw nuance badge
            self.set_xy(15, current_y)
            self.set_font('Helvetica', 'B', 9)
            self.set_text_color(*COLORS['nuance_bg'])
            super(DashboardPDF, self).cell(180, 6, nuance.upper(), 0, 1)
            current_y = self.get_y()
            
            # Draw observation using draw_wrapped_text for proper alignment
            if observation:
                self.set_font('Helvetica', '', 9)
                self.set_text_color(40, 40, 40)
                current_y = self.draw_wrapped_text(15, current_y, 180, 5, f"Observation: {observation}")
                current_y += 2
            
            # Draw suggestion
            if suggestion:
                self.set_font('helvetica', 'B', 8)
                self.set_text_color(100, 116, 139)
                self.set_xy(15, current_y)
                super(DashboardPDF, self).cell(180, 5, "SUGGESTION:", 0, 1)
                current_y = self.get_y()
                
                self.set_font('helvetica', '', 9)
                self.set_text_color(*COLORS['text_main'])
                current_y = self.draw_wrapped_text(15, current_y, 180, 5, suggestion)
                current_y += 4
            
            actual_tmp = self.get_y()
            if actual_tmp < start_y: self.set_y(actual_tmp + 4)
            else: self.set_y(max(actual_tmp, start_y + height) + 4)

    def draw_section_header(self, title, color):
        self.ln(3)
        self.set_font('helvetica', 'B', 11)
        self.set_text_color(*color)
        self.cell(0, 8, title, 0, 1)
        # Add colored underline
        self.set_draw_color(*color)
        self.set_line_width(0.8)
        self.line(10, self.get_y(), 50, self.get_y())
        self.set_line_width(0.2)
        self.ln(4)

    def draw_banner(self, meta, scenario_type="custom"):
        """Draw the premium Coaching Efficacy summary box (Matches UI)."""
        """Draw the premium Coaching Efficacy summary box (Matches UI)."""
        start_y = self.get_y()
        overall_grade = meta.get('overall_grade', 'N/A')
        summary = meta.get('summary', '')

        # UI Styling Colors
        SLATE_600 = (71, 85, 105)
        BLUE_600 = (37, 99, 235)
        
        self.check_space(45)
        
        # Icon/Label mapping
        scenario_labels = {
            "coaching": "COACHING EFFICACY",
            "coaching_sim": "COACHING EFFICACY",
            "mentorship_sim": "MENTORSHIP EFFICACY",
            "mentorship": "MENTORSHIP REFLECTION",
            "negotiation": "NEGOTIATION EFFICACY",
            "reflection": "LEARNING INSIGHTS",
            "custom": "GOAL ATTAINMENT"
        }
        icon_map = {"coaching": "[C]", "coaching_sim": "[C]", "mentorship_sim": "[M]", "mentorship": "[M]", "negotiation": "[N]", "reflection": "[R]", "custom": "[*]"}
        
        # For mentorship mode, override label if session_mode is set
        if meta.get('session_mode') == "mentorship":
            label = "MENTORSHIP REFLECTION"
            icon = "[M]"
            # Override overall_grade to remove scores
            overall_grade = "Practice Simulation"
        else:
            icon = icon_map.get(scenario_type, "[*]")
            label = scenario_labels.get(scenario_type, "COACHING EFFICACY")
        
        # 1. Heading Row
        self.set_xy(10, start_y)
        self.set_font('helvetica', 'B', 12)
        self.set_text_color(*BLUE_600)
        self.cell(100, 8, f"{icon} {label} {overall_grade}", 0, 1)
        
        # 2. Summary Text (Multi-line)
        self.set_x(10)
        self.set_font('helvetica', '', 10)
        self.set_text_color(51, 65, 85) # Slate 700
        self.multi_cell(185, 5, sanitize_text(summary))
        
        self.ln(2)
        
        # New Metrics Banner matching frontend
        emotional = meta.get('emotional_trajectory')
        quality = meta.get('session_quality')
        themes = meta.get('key_themes')
        
        if emotional or quality or themes:
            self.check_space(20)
            badges_y = self.get_y() + 2
            
            # Divide 190mm into 3 equal cells ~ 61mm each
            cell_w = 61
            space = 3.5
            
            # 1. Emotional Arc (Indigo)
            if emotional:
                self.set_fill_color(238, 242, 255)
                self.rect(10, badges_y, cell_w, 15, 'F')
                self.set_xy(12, badges_y + 2)
                self.set_font('helvetica', 'B', 8)
                self.set_text_color(99, 102, 241) # Indigo 500
                self.cell(cell_w-4, 4, "EMOTIONAL ARC", 0, 1)
                self.set_x(12)
                self.set_font('helvetica', '', 9)
                self.set_text_color(*COLORS['text_main'])
                self.cell(cell_w-4, 5, sanitize_text(str(emotional)), 0, 0)
                
            # 2. Session Quality (Emerald)
            if quality:
                qx = 10 + cell_w + space
                self.set_fill_color(236, 253, 245)
                self.rect(qx, badges_y, cell_w, 15, 'F')
                self.set_xy(qx + 2, badges_y + 2)
                self.set_font('helvetica', 'B', 8)
                self.set_text_color(16, 185, 129) # Emerald 500
                self.cell(cell_w-4, 4, "SESSION QUALITY", 0, 1)
                self.set_x(qx + 2)
                self.set_font('helvetica', '', 9)
                self.set_text_color(*COLORS['text_main'])
                self.cell(cell_w-4, 5, sanitize_text(str(quality)), 0, 0)
                
            # 3. Key Themes (Pink)
            if themes:
                tx = 10 + (2 * (cell_w + space))
                self.set_fill_color(253, 242, 248)
                self.rect(tx, badges_y, cell_w, 15, 'F')
                self.set_xy(tx + 2, badges_y + 2)
                self.set_font('helvetica', 'B', 8)
                self.set_text_color(236, 72, 153) # Pink 500
                self.cell(cell_w-4, 4, "KEY THEMES", 0, 1)
                self.set_x(tx + 2)
                self.set_font('helvetica', '', 9)
                self.set_text_color(*COLORS['text_main'])
                themes_str = ", ".join(themes[:3]) if isinstance(themes, list) else themes
                if len(themes_str) > 28: themes_str = themes_str[:25] + "..."
                self.cell(cell_w-4, 5, sanitize_text(str(themes_str)), 0, 0)
                
            self.set_y(badges_y + 18)
            
        actual_tmp = self.get_y()
        if actual_tmp < start_y: self.set_y(actual_tmp + 4)
        else: self.set_y(max(actual_tmp + 4, start_y + 15)) # Ensure we don't jump backwards
    
    def draw_executive_summary(self, exec_summary):
        """Draw the Executive Summary section - NEW unified section for all reports."""
        if not exec_summary:
            return
        
        self.check_space(80)
        self.ln(5)
        
        # Section header with gradient-like background
        self.set_fill_color(30, 41, 59)  # Slate 800
        self.rect(10, self.get_y(), 190, 12, 'F')
        self.set_xy(15, self.get_y() + 3)
        self.set_font('helvetica', 'B', 11)
        self.set_text_color(255, 255, 255)
        self.cell(0, 6, self.get_title("exec_summary"), 0, 1)
        self.ln(3)
        
        # Performance Overview
        overview = exec_summary.get('performance_overview', '')
        if overview:
            self.set_font('helvetica', '', 10)
            self.set_text_color(*COLORS['text_main'])
            self.multi_cell(0, 6, sanitize_text(overview))
            self.ln(6)
        
        # Two-column layout for strengths and growth areas
        start_y = self.get_y()
        
        # Key Strengths (left column)
        strengths = exec_summary.get('key_strengths', [])
        if strengths:
            self.set_fill_color(240, 253, 244)  # Green 50
            self.rect(10, start_y, 90, 45, 'F')
            self.set_xy(15, start_y + 5)
            self.set_font('helvetica', 'B', 9)
            self.set_text_color(*COLORS['success'])
            self.cell(80, 5, "KEY STRENGTHS", 0, 1)
            
            self.set_font('helvetica', '', 9)
            self.set_text_color(*COLORS['text_main'])
            for i, strength in enumerate(strengths[:3]):
                self.set_x(15)
                self.multi_cell(80, 5, f"+ {sanitize_text(strength)}")
        
        # Areas for Growth (right column)
        growth = exec_summary.get('areas_for_growth', [])
        if growth:
            self.set_fill_color(254, 249, 195)  # Yellow 100
            self.rect(105, start_y, 95, 45, 'F')
            self.set_xy(110, start_y + 5)
            self.set_font('helvetica', 'B', 9)
            self.set_text_color(*COLORS['warning'])
            self.cell(85, 5, "AREAS FOR GROWTH", 0, 1)
            
            self.set_font('helvetica', '', 9)
            self.set_text_color(*COLORS['text_main'])
            for i, area in enumerate(growth[:3]):
                self.set_x(110)
                self.multi_cell(85, 5, f"- {sanitize_text(area)}")
        
        actual_tmp = self.get_y()
        if actual_tmp < start_y: self.set_y(actual_tmp + 2)
        else: self.set_y(max(actual_tmp + 2, start_y + 50))
        
        # Recommended Next Steps
        next_steps = exec_summary.get('recommended_next_steps', '')
        if next_steps:
            self.set_fill_color(248, 250, 252)  # Slate 50
            self.rect(10, self.get_y(), 190, 20, 'F')
            self.set_xy(15, self.get_y() + 5)
            self.set_font('helvetica', 'B', 9)
            self.set_text_color(*COLORS['accent'])
            self.cell(40, 5, "NEXT STEPS:", 0, 0)
            self.set_font('helvetica', '', 9)
            self.set_text_color(*COLORS['text_main'])
            self.multi_cell(145, 5, sanitize_text(next_steps))
            self.ln(5)
        
        self.ln(5)
    
    def draw_personalized_recommendations(self, recs):
        """Draw the unified personalized recommendations section."""
        if not recs:
            return
        
        self.check_space(70)
        self.ln(5)
        
        # Dark header block
        self.set_fill_color(30, 41, 59)  # Slate 800
        self.rect(10, self.get_y(), 190, 60, 'F')
        
        start_y = self.get_y()
        self.set_xy(15, start_y + 5)
        self.set_font('helvetica', 'B', 11)
        self.set_text_color(255, 255, 255)
        self.cell(0, 8, self.get_title("recs"), 0, 1)
        
        # Immediate Actions
        actions = recs.get('immediate_actions', [])
        if actions:
            self.set_font('helvetica', 'B', 9)
            self.set_text_color(147, 197, 253)  # Blue 300
            self.cell(50, 6, "IMMEDIATE ACTIONS:", 0, 0)
            self.set_font('helvetica', '', 9)
            self.set_text_color(255, 255, 255)
            actions_text = ", ".join([sanitize_text(a) for a in actions[:3]])
            self.multi_cell(135, 6, actions_text)
        
        # Focus Areas
        focus = recs.get('focus_areas', [])
        if focus:
            self.set_font('helvetica', 'B', 9)
            self.set_text_color(147, 197, 253)
            self.cell(50, 6, "FOCUS AREAS:", 0, 0)
            self.set_font('helvetica', '', 9)
            self.set_text_color(255, 255, 255)
            focus_text = ", ".join([sanitize_text(f) for f in focus[:3]])
            self.multi_cell(135, 6, focus_text)
        
        # Reflection Prompts
        prompts = recs.get('reflection_prompts', [])
        if prompts:
            self.ln(2)
            self.set_font('helvetica', 'I', 8)
            self.set_text_color(203, 213, 225)  # Slate 300
            for prompt in prompts[:2]:
                self.set_x(15)
                self.cell(0, 4, f"? {sanitize_text(prompt)}", 0, 1)
        
        actual_tmp = self.get_y()
        if actual_tmp < start_y: self.set_y(actual_tmp + 2)
        else: self.set_y(max(actual_tmp + 2, start_y + 65))

    # --- ASSESSMENT MODE DRAWING METHODS ---



    def _extract_score_value(self, score_str):
        try:
            # Remove /10 or similar
            clean = str(score_str).split('/')[0].strip()
            return float(clean)
        except:
            return 0.0

    # --- SCENARIO SPECIFIC DRAWING METHODS ---

    def draw_scorecard(self, scorecard):
        """Draw a standard scorecard table with zebra striping."""
        if not scorecard: return
        self.check_space(60)
        self.ln(8) # Extra spacing
        
        # Draw Radar Chart First
        self.draw_section_header("SKILL VISUALIZATION", COLORS['secondary'])
        self.draw_radar_chart(scorecard)
        
        self.draw_section_header("PERFORMANCE SCORECARD", COLORS['primary'])
        
        # Table Header
        self.set_fill_color(30, 41, 59) # Dark header
        self.set_font('helvetica', 'B', 9)
        self.set_text_color(255, 255, 255) # White text
        self.cell(50, 9, "DIMENSION", 0, 0, 'L', True)
        self.cell(20, 9, "SCORE", 0, 0, 'C', True)
        self.cell(120, 9, "OBSERVATION", 0, 1, 'L', True)
        
        # Rows
        for i, item in enumerate(scorecard):
            dim = sanitize_text(item.get('dimension', ''))
            score = str(item.get('score', 'N/A'))
            desc = sanitize_text(item.get('description', ''))
            
            if not desc:
                r = sanitize_text(item.get('reasoning', ''))
                q = sanitize_text(item.get('quote', ''))
                s = sanitize_text(item.get('suggestion', ''))
                parts = []
                if r: parts.append(r)
                if q: parts.append(f"Quote: \"{q}\"")
                if s: parts.append(f"Tip: {s}")
                desc = "\n".join(parts)
            
            # Calculate height accurately by counting physical chars per line and explicit newlines
            lines_estimate = sum(max(1, len(line)/70) for line in desc.split('\n'))
            
            alt_qs = item.get('alternative_questions', [])
            if alt_qs:
                lines_estimate += 1.5 # "TRY ASKING INSTEAD:" + padding
                for aq in alt_qs:
                    q_text = aq.get('question', '')
                    if q_text:
                        lines_estimate += max(1, len(q_text) / 70)
            
            row_height = max(14, int(lines_estimate * 5 + 6))
            
            self.check_space(row_height + 5)
            
            x_start = self.get_x()
            y_start = self.get_y()
            
            # Zebra striping explicitly via Rect to wrap entire content block
            if i % 2 == 0:
                self.set_fill_color(248, 250, 252) # Very light gray
            else:
                self.set_fill_color(255, 255, 255) # White
                
            self.rect(x_start, y_start, 190, row_height, 'F')
            
            self.set_font('helvetica', 'B', 9)
            self.set_text_color(*COLORS['text_main'])
            
            self.set_xy(x_start, y_start)
            self.cell(50, row_height, dim, 0, 0, 'L')
            
            # Score Color
            try:
                s_val = float(score.split('/')[0])
                if s_val >= 8: self.set_text_color(*COLORS['success'])
                elif s_val <= 5: self.set_text_color(*COLORS['danger'])
                else: self.set_text_color(*COLORS['warning'])
            except:
                self.set_text_color(*COLORS['text_main'])
                
            self.cell(20, row_height, score, 0, 0, 'C')
            
            self.set_font('helvetica', '', 9)
            self.set_text_color(*COLORS['text_light'])
            
            # Use draw_wrapped_text for observation column to ensure proper alignment
            obs_x = x_start + 70
            obs_width = 118
            cur_y = y_start + 2
            
            # Handle multi-line desc (may contain newlines)
            for desc_line in desc.split('\n'):
                if desc_line.strip():
                    self.set_font('helvetica', '', 9)
                    self.set_text_color(*COLORS['text_light'])
                    cur_y = self.draw_wrapped_text(obs_x, cur_y, obs_width, 5, desc_line.strip())
            
            # Alternative Questions / Try Asking Instead
            if alt_qs:
                self.set_font('helvetica', 'B', 8)
                self.set_text_color(*COLORS['accent'])
                self.set_xy(obs_x, cur_y + 1)
                super(DashboardPDF, self).cell(40, 5, "TRY ASKING INSTEAD:", 0, 1)
                cur_y = self.get_y()
                
                self.set_font('helvetica', 'I', 8)
                self.set_text_color(*COLORS['text_main'])
                for aq in alt_qs:
                    q_text = aq.get('question', '')
                    if q_text:
                        cur_y = self.draw_wrapped_text(obs_x, cur_y, obs_width, 5, f"- \"{sanitize_text(q_text)}\"")
            
            # If content exceeded the pre-calculated row height, ensure we don't overlap
            actual_y = cur_y + 2
            if actual_y < y_start:
                next_y = actual_y
            else:
                next_y = max(y_start + row_height, actual_y)
            
            # Reset position for next row safely
            self.set_xy(x_start, next_y)
            self.set_draw_color(226, 232, 240)
            self.line(x_start, next_y, x_start + 190, next_y) # Bottom border
            self.set_text_color(*COLORS['text_main']) # Reset color

    def draw_radar_chart(self, scorecard):
        """Draw a radar chart for the scorecard dimensions."""
        if not scorecard:
            return
            
        try:
            # Filter out items with N/A or invalid scores
            valid_items = []
            for item in scorecard:
                score_str = str(item.get('score', '0'))
                val = self._extract_score_value(score_str)
                valid_items.append({'dim': item.get('dimension', 'Metric'), 'val': val})

            if not valid_items:
                return

            labels = [i['dim'] for i in valid_items]
            values = [i['val'] for i in valid_items]
            
            # Number of variables
            num_vars = len(labels)
            
            # Compute angle of each axis
            angles = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
            
            # The plot is circular, so we need to "complete the loop"
            values += values[:1]
            angles += angles[:1]
            
            fig, ax = plt.subplots(figsize=(6, 6), subplot_kw=dict(polar=True))
            
            # Draw one axe per variable + add labels
            plt.xticks(angles[:-1], labels, color='grey', size=8)
            
            # Draw ylabels
            ax.set_rlabel_position(0) # type: ignore
            plt.yticks([2, 4, 6, 8, 10], ["2", "4", "6", "8", "10"], color="grey", size=7)
            plt.ylim(0, 10)
            
            # Plot data
            ax.plot(angles, values, color='#6366f1', linewidth=2, linestyle='solid')
            
            # Fill area
            ax.fill(angles, values, color='#6366f1', alpha=0.1)
            
            # Save to temp file
            tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
            tmp.close()
            plt.savefig(tmp.name, bbox_inches='tight', dpi=100, transparent=True)
            plt.close(fig)
            
            # Embed in PDF
            # Check space (radar chart typically needs ~80mm)
            self.check_space(100)
            self.image(tmp.name, x=60, y=self.get_y(), w=90)
            self.ln(90)
            
            # Cleanup
            try:
                os.unlink(tmp.name)
            except:
                pass
        except Exception as e:
            print(f"Warning: Radar chart generation failed: {e}")
            self.set_text_color(150, 150, 150)
            self.set_font('helvetica', 'I', 8)
            self.cell(0, 10, "(Visual chart unavailable)", 0, 1, 'C')
            self.ln(5)


    def draw_key_value_grid(self, title, data_dict, color=COLORS['secondary']):
        """Draw a grid of key-value pairs with better spacing."""
        if not data_dict: return
        self.check_space(50)
        self.ln(8)
        self.draw_section_header(title, color)
        
        self.set_fill_color(248, 250, 252) 
        self.rect(self.get_x(), self.get_y(), 190, len(data_dict)*8 + 5, 'F')
        self.ln(2)

        for key, value in data_dict.items():
            key_label = key.replace('_', ' ').title()
            val_text = sanitize_text(str(value))
            
            self.set_font('helvetica', 'B', 9)
            self.set_text_color(*COLORS['text_main'])
            self.cell(60, 8, "  " + key_label + ":", 0, 0) # Indent
            
            self.set_font('helvetica', '', 9)
            self.set_text_color(*COLORS['text_light'])
            self.multi_cell(0, 8, val_text)
        self.ln(2)

    def draw_list_section(self, title, items, color=COLORS['section_comm'], bullet="•"):
        """Draw a bulleted list section with icons."""
        if not items: return
        self.check_space(len(items) * 10 + 20)
        self.ln(8)
        self.draw_section_header(title, color)
        
        self.set_font('helvetica', '', 9)
        self.set_text_color(*COLORS['text_main'])
        for item in items:
            self.set_text_color(*color)
            self.cell(8, 7, bullet, 0, 0, 'R')
            self.set_text_color(*COLORS['text_main'])
            self.multi_cell(0, 7, sanitize_text(str(item)))

    def draw_two_column_lists(self, title_left, items_left, color_left, title_right, items_right, color_right):
        """Draw two lists side-by-side with dynamic height calculation."""
        if not items_left and not items_right: return
        
        start_y = self.get_y() + 5
        mid_x = 105
        col_width = 90
        
        # Helper to calculate list height
        def calculate_list_height(items, width_mm, font_size=9):
            total_h = 0
            chars_per_line = (width_mm * 2.3) # approx const for Arial 9
            for item in items:
                txt = sanitize_text(str(item))
                # rough estimate
                lines = math.ceil(len(txt) / 50) # conservative 50 chars per line for 90mm
                total_h += (lines * 6) + 2 # 6mm line height, 2mm padding
            return total_h

        # Calculate heights
        h_left = calculate_list_height(items_left, col_width) + 10 # +10 header
        h_right = calculate_list_height(items_right, col_width) + 10
        max_h = max(h_left, h_right)
        
        self.check_space(max_h + 20)
        self.ln(5)
        
        # Recalculate start_y in case of page break
        start_y = self.get_y()
        
        # Draw Headers
        self.set_xy(10, start_y)
        self.draw_section_header(title_left, color_left)
        self.set_xy(mid_x + 5, start_y)
        self.draw_section_header(title_right, color_right)
        
        content_start_y = self.get_y()
        
        # Draw Backgrounds with dynamic height
        # Left Card
        self.set_fill_color(250, 250, 255) 
        self.rect(10, content_start_y, col_width, max_h, 'F')
        # Right Card
        self.rect(mid_x + 5, content_start_y, col_width, max_h, 'F')
        
        # Draw LEFT Items
        self.set_xy(10, content_start_y + 2)
        self.set_font('helvetica', '', 9)
        current_y_left = content_start_y + 2
        
        for item in items_left:
            self.set_xy(15, current_y_left) # Indent
            self.set_text_color(*color_left)
            self.cell(5, 6, "+", 0, 0)
            self.set_text_color(*COLORS['text_main'])
            
            # Save X,Y
            x = self.get_x()
            y = self.get_y()
            
            self.multi_cell(col_width - 10, 6, sanitize_text(str(item)))
            current_y_left = self.get_y() + 1 # small gap
            
        # Draw RIGHT Items
        current_y_right = content_start_y + 2
        for item in items_right:
            self.set_xy(mid_x + 10, current_y_right) # Indent
            self.set_text_color(*color_right)
            self.cell(5, 6, "!", 0, 0)
            self.set_text_color(*COLORS['text_main'])
            
            self.multi_cell(col_width - 10, 6, sanitize_text(str(item)))
            current_y_right = self.get_y() + 1 

        # Move cursor to bottom of tallest column
        actual_tmp = self.get_y()
        if actual_tmp < content_start_y: self.set_y(actual_tmp + 5)
        else: self.set_y(content_start_y + max_h + 5)

    def draw_transcript(self, transcript):
        """Draw the detailed chat transcript at the end."""
        if not transcript: return
        self.add_page()
        
        self.draw_section_header("SESSION TRANSCRIPT", COLORS['primary'])
        self.ln(5)
        
        for msg in transcript:
            role = msg.get('role', 'user')
            raw_content = msg.get('content', '')
            
            # 1. Eliminate prompt leaks by separating raw dialogue from backend hints
            is_hint_only = False
            try:
                if raw_content.strip().startswith('{') and raw_content.strip().endswith('}'):
                    parsed = json.loads(raw_content)
                    if isinstance(parsed, dict):
                        # Extract raw dialogue, dropping hints/instructions
                        content_str = parsed.get('text', parsed.get('content', parsed.get('dialogue', '')))
                        if not content_str and ('instruction' in parsed or 'hint' in parsed):
                            is_hint_only = True
                        else:
                            raw_content = str(content_str)
            except Exception:
                pass
                
            if is_hint_only or role == 'system':
                continue
                
            content = sanitize_text(raw_content)
            if not content.strip():
                continue
            
            # 2. Bind the label and bubble together to fix trailing layout gaps
            bubble_w = 140
            approx_lines = max(1, math.ceil(len(content) / 70))
            approx_height = 5 + (approx_lines * 6) + 5
            self.check_space(approx_height)
            
            self.set_font('helvetica', 'B', 8)
            
            if role == 'user':
                # User (Right side)
                self.set_text_color(*COLORS['accent'])
                self.cell(0, 5, "YOU", 0, 1, 'R')
                
                self.set_font('helvetica', '', 9)
                self.set_text_color(255, 255, 255)
                self.set_fill_color(*COLORS['accent']) # Blue bubble
                
                x_pos = 200 - bubble_w - 10 # Right align
                
                self.set_x(x_pos)
                self.multi_cell(bubble_w, 6, content, 0, 'J', True)
                
            else:
                # Assistant (Left side)
                self.set_text_color(*COLORS['text_light'])
                ai_label = "AI ROLE"
                self.cell(0, 5, ai_label, 0, 1, 'L')
                
                self.set_font('helvetica', '', 9)
                self.set_text_color(*COLORS['text_main'])
                self.set_fill_color(241, 245, 249) # Gray bubble
                
                bubble_w = 140
                self.set_x(10)
                self.multi_cell(bubble_w, 6, content, 0, 'J', True)
            
            self.ln(3)

    # --- MAIN SCENARIO DRAWING ---



    def draw_mentorship_reflection_report(self, data):
        """Delegate to mentorship_report module."""
        from mentorship_report import draw_mentorship_body
        draw_mentorship_body(self, data)

    def draw_coaching_sim_report(self, data):
        """
        Renders the full Coaching Simulation report matching the React SimulationView component
        section by section, in the same layout order.
        """
        SLATE = (30, 41, 59)
        EMERALD = (16, 185, 129)
        BLUE = (59, 130, 246)
        AMBER = (245, 158, 11)
        INDIGO = (99, 102, 241)
        PURPLE = (168, 85, 247)
        ROSE = (244, 63, 94)
        LIGHT_BG = (248, 250, 252)
        TEXT_MAIN = COLORS['text_main']
        TEXT_LIGHT = COLORS['text_light']
        WHITE = (255, 255, 255)

        def block_title(title, color):
            self.check_space(18)
            self.ln(6)
            self.set_fill_color(*color)
            self.rect(10, self.get_y(), 3, 9, 'F')
            self.set_xy(16, self.get_y() + 1)
            self.set_font('helvetica', 'B', 11)
            self.set_text_color(*color)
            self.cell(0, 7, title.upper(), 0, 1)
            self.ln(2)

        def small_label(text, color=None):
            self.set_x(12)
            self.set_font('helvetica', 'B', 8)
            self.set_text_color(*(color or TEXT_LIGHT))
            self.cell(0, 5, text.upper(), 0, 1)

        def body_text(text):
            self.set_x(12)
            self.set_font('helvetica', '', 9)
            self.set_text_color(*TEXT_MAIN)
            self.multi_cell(186, 5, sanitize_text(str(text)))

        def divider():
            self.ln(4)
            self.set_draw_color(*COLORS['divider'])
            self.line(10, self.get_y(), 200, self.get_y())
            self.ln(3)

        # ─────────────────────────────────────────────────────────────
        # 1. CONVERSATION SNAPSHOT
        # ─────────────────────────────────────────────────────────────
        snapshot = data.get('conversation_snapshot', {})
        if snapshot:
            block_title("Conversation Snapshot", PURPLE)
            
            sim = snapshot.get("simulation_context", {})
            if sim:
                small_label("Simulation Context", PURPLE)
                card_y = self.get_y()
                self.set_fill_color(*LIGHT_BG)
                self.rect(10, card_y, 190, 34, 'F')
                self.set_draw_color(226, 232, 240)
                self.rect(10, card_y, 190, 34, 'D')

                # Row 1
                self.set_xy(15, card_y + 3)
                self.set_font('helvetica', 'B', 8)
                self.set_text_color(*TEXT_LIGHT)
                self.cell(90, 4, "YOUR ROLE", 0, 0)
                self.cell(0, 4, "AI ROLE", 0, 1)

                self.set_xy(15, card_y + 8)
                self.set_font('helvetica', '', 10)
                self.set_text_color(*TEXT_MAIN)
                self.cell(90, 5, sanitize_text(str(sim.get("your_role", "-"))), 0, 0)
                self.cell(0, 5, sanitize_text(str(sim.get("ai_role", "-"))), 0, 1)

                # Row 2
                self.set_xy(15, card_y + 17)
                self.set_font('helvetica', 'B', 8)
                self.set_text_color(*TEXT_LIGHT)
                self.cell(90, 4, "SCENARIO TYPE", 0, 0)
                self.cell(0, 4, "PRIMARY SKILL FOCUS", 0, 1)

                self.set_xy(15, card_y + 22)
                self.set_font('helvetica', 'B', 10)
                self.set_text_color(*PURPLE)
                self.cell(90, 5, sanitize_text(str(sim.get("scenario_type", "-"))), 0, 0)
                self.cell(0, 5, sanitize_text(str(sim.get("primary_skill_focus", "-"))), 0, 1)

                self.set_y(card_y + 37)

            flow = snapshot.get("conversation_flow_overview", "")
            if flow:
                small_label("Conversation Flow Overview", PURPLE)
                self.ln(1)
                body_text(flow)
                self.ln(2)
                
            divider()
        elif data.get('meta', {}).get('scenario'):
            self.draw_context_summary()
            divider()

        # ─────────────────────────────────────────────────────────────
        # 2. EXECUTIVE DASHBOARD
        # ─────────────────────────────────────────────────────────────
        es = data.get('executive_summary', {})
        if es:
            block_title("Executive Dashboard", BLUE)
            small_label("Overall Snapshot")
            body_text(es.get('snapshot', ''))
            self.ln(2)

            score = es.get('final_score') or data.get('meta', {}).get('overall_grade', 'N/A')
            score_y = self.get_y()
            self.set_fill_color(*LIGHT_BG)
            self.rect(10, score_y, 190, 14, 'F')
            self.set_xy(15, score_y + 3)
            self.set_font('helvetica', 'B', 9)
            self.set_text_color(*SLATE)
            self.cell(60, 6, "FINAL SCORE", 0, 0)
            sv = self._extract_score_value(str(score))
            self.set_font('helvetica', 'B', 14)
            self.set_text_color(*get_bar_color(sv))
            self.cell(0, 6, sanitize_text(str(score)), 0, 1)
            actual_tmp = self.get_y()
            if actual_tmp < score_y: self.set_y(actual_tmp + 2)
            else: self.set_y(max(actual_tmp + 2, score_y + 16))
            self.ln(2)

            small_label("Outcome Summary")
            body_text(es.get('outcome_summary', ''))
            divider()

        # ─────────────────────────────────────────────────────────────
        # 3. COACHING EFFICACY
        # ─────────────────────────────────────────────────────────────
        cs = data.get('coaching_style', {})
        if cs:
            block_title("Coaching Efficacy", EMERALD)
            self.set_x(15)
            self.set_font('helvetica', 'B', 13)
            self.set_text_color(*EMERALD)
            self.cell(0, 8, sanitize_text(str(cs.get('primary_style', ''))).upper(), 0, 1)
            self.set_x(15)
            self.set_font('helvetica', 'I', 9)
            self.set_text_color(*TEXT_LIGHT)
            self.multi_cell(180, 5, '"' + sanitize_text(str(cs.get('description', ''))) + '"')
            
            self.draw_scoring_methodology()
            self.draw_style_rubric()
            
            divider()

        # ─────────────────────────────────────────────────────────────
        # 4. COMPETENCY HEAT MAP
        # ─────────────────────────────────────────────────────────────
        heat_map = data.get('heat_map', [])
        if heat_map:
            block_title("Competency Heat Map", PURPLE)
            for item in heat_map:
                self.check_space(10)
                dim = sanitize_text(str(item.get('dimension', '')))
                score_val = self._extract_score_value(str(item.get('score', 0)))

                self.set_x(15)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*TEXT_MAIN)
                self.cell(50, 6, dim, 0, 0)

                bar_x = 65
                bar_w = 110
                row_y = self.get_y()
                by = row_y + 1
                self.set_fill_color(226, 232, 240)
                self.rect(bar_x, by, bar_w, 4, 'F')
                fill_w = max(0, min((score_val / 10) * bar_w, bar_w))
                self.set_fill_color(*get_bar_color(score_val))
                self.rect(bar_x, by, fill_w, 4, 'F')

                self.set_xy(180, row_y)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*get_bar_color(score_val))
                self.cell(18, 6, f"{score_val:.0f}/10", 0, 1)
            divider()

        # ─────────────────────────────────────────────────────────────
        # 5. SKILL VISUALIZATION
        # ─────────────────────────────────────────────────────────────
        scorecard = data.get('scorecard', [])
        if heat_map:
            block_title("Skill Visualization", INDIGO)
            self.set_x(15)
            self.set_font('helvetica', 'I', 9)
            self.set_text_color(*TEXT_LIGHT)
            self.multi_cell(180, 5, "Please refer to the interactive web dashboard to view the dynamic radar visualization. A detailed breakdown of skills is provided in the Performance Scorecard below.")
            divider()

        # ─────────────────────────────────────────────────────────────
        # 6. GOAL ATTAINMENT
        # ─────────────────────────────────────────────────────────────
        ga = data.get('goal_attainment', {})
        if ga:
            block_title("Goal Attainment", BLUE)
            score = ga.get('score', 'N/A')
            self.set_x(15)
            self.set_font('helvetica', 'B', 9)
            self.set_text_color(*TEXT_LIGHT)
            self.cell(70, 6, "ATTAINMENT SCORE", 0, 0)
            sv = self._extract_score_value(str(score))
            self.set_font('helvetica', 'B', 14)
            self.set_text_color(*get_bar_color(sv))
            self.cell(0, 6, sanitize_text(str(score)), 0, 1)
            self.ln(2)

            small_label("Expectation vs Reality")
            body_text(ga.get('expectation_vs_reality', ''))
            self.ln(2)

            gaps = ga.get('primary_gaps', [])
            if gaps:
                self.check_space(10 + len(gaps) * 8)
                small_label("Primary Gaps", ROSE)
                for g in gaps:
                    self.check_space(10)
                    self.set_x(15)
                    self.set_font('helvetica', '', 9)
                    self.set_text_color(*ROSE)
                    self.cell(5, 5, "x", 0, 0)
                    self.set_text_color(*TEXT_MAIN)
                    self.multi_cell(175, 5, sanitize_text(str(g)))

            focuses = ga.get('observation_focus', [])
            if focuses:
                focus_height = 8 + len(focuses) * 8
                self.check_space(focus_height)
                self.ln(2)
                small_label("Observation Focus")
                for f in focuses:
                    self.check_space(8)
                    self.set_x(12)
                    self.set_font('helvetica', '', 9)
                    self.set_text_color(100, 116, 139)
                    self.multi_cell(186, 5, "- " + sanitize_text(str(f)))
                self.ln(1)
            divider()

        # ─────────────────────────────────────────────────────────────
        # 7. PERFORMANCE SCORECARD
        # ─────────────────────────────────────────────────────────────
        if scorecard:
            self.draw_scorecard(scorecard)
            divider()

        # ─────────────────────────────────────────────────────────────
        # 8. DEEP DIVE ANALYSIS
        # ─────────────────────────────────────────────────────────────
        dda = data.get('deep_dive_analysis', [])
        ba = data.get('behaviour_analysis', [])
        eq = data.get('eq_analysis', [])
        
        if dda or ba or eq:
            block_title("Deep Dive Analysis", INDIGO)
            
            # i) Communication Style
            if dda:
                self.check_space(15)
                self.ln(3)
                self.set_x(15)
                self.set_font('helvetica', 'B', 10)
                self.set_text_color(*INDIGO)
                self.cell(0, 6, "i) Communication Style", 0, 1)
                
                for item in dda:
                    self.check_space(35)
                    topic = sanitize_text(str(item.get('topic', '')))
                    self.set_fill_color(238, 242, 255)
                    self.rect(10, self.get_y(), 190, 8, 'F')
                    self.set_xy(14, self.get_y() + 1)
                    self.set_font('helvetica', 'B', 9)
                    self.set_text_color(*INDIGO)
                    self.cell(0, 6, topic, 0, 1)
                    self.ln(1)

                    for key, label in [('tone','Tone'),('language_impact','Language Impact'),('comfort_level','Comfort Level'),
                                        ('impact','Impact'),('questions_asked','Questions'),('exploration','Exploration'),
                                        ('understanding_depth','Understanding Depth'),('analysis','Analysis')]:
                        val = item.get(key, '')
                        if val:
                            self.set_font('helvetica', 'B', 8)
                            self.set_text_color(*TEXT_LIGHT)
                            self.set_xy(15, self.get_y())
                            super(DashboardPDF, self).cell(42, 5, f"{label}:", 0, 0)
                            self.set_font('helvetica', '', 8)
                            self.set_text_color(*TEXT_MAIN)
                            cur_y = self.draw_wrapped_text(57, self.get_y(), 140, 5, sanitize_text(str(val)))
                            self.set_y(cur_y)
                    self.ln(2)

            # ii) Behaviour Analysis
            if ba:
                self.check_space(15)
                self.ln(4)
                self.set_x(15)
                self.set_font('helvetica', 'B', 10)
                self.set_text_color(*PURPLE)
                self.cell(0, 6, "ii) Behaviour Analysis", 0, 1)
                
                for item in ba:
                    self.check_space(35)
                    behavior = sanitize_text(str(item.get('behavior', '')))
                    quote = sanitize_text(str(item.get('quote', '')))
                    insight = sanitize_text(str(item.get('insight', '')))
                    impact = sanitize_text(str(item.get('impact', '')))
                    improved = sanitize_text(str(item.get('improved_approach', '')))
                    impact_color = EMERALD if 'positive' in impact.lower() else ROSE

                    self.set_fill_color(*LIGHT_BG)
                    self.rect(10, self.get_y(), 190, 7, 'F')
                    self.set_xy(15, self.get_y() + 1)
                    self.set_font('helvetica', 'B', 9)
                    self.set_text_color(*SLATE)
                    self.cell(150, 5, behavior, 0, 0)
                    self.set_font('helvetica', 'B', 8)
                    self.set_text_color(*impact_color)
                    self.cell(0, 5, impact.upper(), 0, 1)
                    self.ln(1)

                    if quote:
                        self.set_x(18)
                        self.set_font('helvetica', 'I', 9)
                        self.set_text_color(*INDIGO)
                        self.multi_cell(180, 5, f'"{quote}"')
                    if insight:
                        self.set_x(18)
                        self.set_font('helvetica', '', 9)
                        self.set_text_color(*TEXT_LIGHT)
                        self.multi_cell(180, 5, insight)
                    if improved:
                        self.set_x(18)
                        self.set_font('helvetica', '', 9)
                        self.set_text_color(*EMERALD)
                        self.multi_cell(180, 5, "Better: " + improved)
                    self.ln(4)
            
            # iii) Emotional Intelligence
            if eq:
                self.check_space(15)
                self.ln(4)
                self.set_x(15)
                self.set_font('helvetica', 'B', 10)
                self.set_text_color(236, 72, 153) # Pink
                self.cell(0, 6, "iii) Emotional Intelligence", 0, 1)
                
                # Let's just inline EQ rendering here so it is indented properly
                for item in eq:
                    self.check_space(20)
                    nuance = sanitize_text(str(item.get('nuance', '')))
                    proof = sanitize_text(str(item.get('proof', item.get('observation', ''))))
                    suggestion = sanitize_text(str(item.get('suggestion', '')))
                    
                    self.set_fill_color(253, 242, 248) # Pink-50
                    self.rect(10, self.get_y(), 190, 7, 'F')
                    self.set_xy(15, self.get_y() + 1)
                    self.set_font('helvetica', 'B', 9)
                    self.set_text_color(219, 39, 119) # Pink-600
                    self.cell(0, 5, nuance, 0, 1)
                    self.ln(1)
                    
                    if proof:
                        self.set_x(18)
                        self.set_font('helvetica', 'B', 8)
                        self.set_text_color(*TEXT_LIGHT)
                        self.cell(15, 5, "Proof: ", 0, 0)
                        self.set_font('helvetica', 'I', 8)
                        self.set_text_color(*TEXT_MAIN)
                        self.multi_cell(165, 5, f'"{proof}"')
                    
                    if suggestion:
                        self.set_x(18)
                        self.set_font('helvetica', 'B', 8)
                        self.set_text_color(*TEXT_LIGHT)
                        self.cell(20, 5, "Suggestion: ", 0, 0)
                        self.set_font('helvetica', '', 8)
                        self.set_text_color(*TEXT_MAIN)
                        self.multi_cell(160, 5, suggestion)
                    self.ln(3)

            divider()

        # ─────────────────────────────────────────────────────────────
        # 9. STRENGTHS & MISSED OPPORTUNITIES
        # ─────────────────────────────────────────────────────────────
        si = data.get('strengths_and_improvements', {})
        strengths_list = si.get('strengths', []) if si else data.get('strengths', [])
        missed_list = si.get('missed_opportunities', []) if si else data.get('missed_opportunities', [])
        ideal_qs = data.get('ideal_questions') or data.get('deal_coaching_questions', [])

        if strengths_list or missed_list:
            block_title("Strengths & Missed Opportunities", EMERALD)
            
            # LEFT SECTION: KEY STRENGTHS
            if strengths_list:
                self.check_space(8 + len(strengths_list) * 8)
                self.set_fill_color(235, 255, 245)
                hdr_y = self.get_y()
                self.set_fill_color(*EMERALD)
                self.rect(10, hdr_y, 190, 7, 'F')
                self.set_xy(14, hdr_y + 1)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(255, 255, 255)
                self.cell(0, 5, "KEY STRENGTHS", 0, 1)
                for item in strengths_list:
                    self.check_space(7)
                    self.set_x(12)
                    self.set_font('helvetica', 'B', 9)
                    self.set_text_color(*EMERALD)
                    self.cell(6, 5, "+", 0, 0)
                    self.set_font('helvetica', '', 9)
                    self.set_text_color(*TEXT_MAIN)
                    self.multi_cell(182, 5, sanitize_text(str(item)))
                self.ln(2)

            # RIGHT SECTION: MISSED OPPORTUNITIES
            if missed_list:
                self.check_space(8 + len(missed_list) * 8)
                hdr_y = self.get_y()
                self.set_fill_color(*ROSE)
                self.rect(10, hdr_y, 190, 7, 'F')
                self.set_xy(14, hdr_y + 1)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(255, 255, 255)
                self.cell(0, 5, "MISSED OPPORTUNITIES", 0, 1)
                for item in missed_list:
                    self.check_space(7)
                    self.set_x(12)
                    self.set_font('helvetica', 'B', 9)
                    self.set_text_color(*ROSE)
                    self.cell(6, 5, "!", 0, 0)
                    self.set_font('helvetica', '', 9)
                    self.set_text_color(*TEXT_MAIN)
                    self.multi_cell(182, 5, sanitize_text(str(item)))
                self.ln(2)
            divider()

        # ─────────────────────────────────────────────────────────────
        # 10. IDEAL COACHING QUESTIONS
        # ─────────────────────────────────────────────────────────────
        if ideal_qs:
            block_title("Ideal Coaching Questions", INDIGO)
            for item in ideal_qs:
                if isinstance(item, dict):
                    q = item.get("question", "")
                    defn = item.get("definition", "")
                    score = item.get("scoring", "")
                    impact = item.get("impact", "")
                    
                    self.check_space(25)
                    self.set_x(15)
                    self.set_font('helvetica', 'B', 10)
                    self.set_text_color(*INDIGO)
                    self.multi_cell(180, 5, f'"{sanitize_text(q)}"')
                    
                    self.set_x(18)
                    self.set_font('helvetica', 'B', 8)
                    self.set_text_color(*TEXT_LIGHT)
                    self.cell(20, 4, "Definition: ", 0, 0)
                    self.set_font('helvetica', '', 8)
                    self.set_text_color(*TEXT_MAIN)
                    self.multi_cell(157, 4, sanitize_text(defn))
                    
                    self.set_x(18)
                    self.set_font('helvetica', 'B', 8)
                    self.set_text_color(*TEXT_LIGHT)
                    self.cell(20, 4, "Impact: ", 0, 0)
                    self.set_font('helvetica', '', 8)
                    self.set_text_color(*TEXT_MAIN)
                    self.multi_cell(157, 4, sanitize_text(impact))
                    
                    self.set_x(18)
                    self.set_font('helvetica', 'B', 8)
                    self.set_text_color(*TEXT_LIGHT)
                    self.cell(20, 4, "Score: ", 0, 0)
                    self.set_font('helvetica', 'B', 8)
                    self.set_text_color(*INDIGO)
                    self.multi_cell(157, 4, sanitize_text(score))
                    self.ln(3)
                else:
                    self.check_space(10)
                    self.set_x(15)
                    self.set_font('helvetica', 'I', 9)
                    self.set_text_color(*INDIGO)
                    self.multi_cell(180, 6, f'"{sanitize_text(str(item))}"')
                    self.ln(1)
            divider()

        # ─────────────────────────────────────────────────────────────
        # 11. ACTION PLAN
        # ─────────────────────────────────────────────────────────────
        ap = data.get('action_plan', {})
        if ap:
            block_title("Action Plan Improve", PURPLE)
            timeline = sanitize_text(str(ap.get('timeline', '')))

            # Single info box for timeline
            box_y = self.get_y()
            self.set_fill_color(245, 243, 255)
            self.rect(10, box_y, 190, 14, 'F')

            self.set_xy(14, box_y + 2)
            self.set_font('helvetica', 'B', 8)
            self.set_text_color(*PURPLE)
            self.cell(80, 5, "TIMELINE", 0, 1)
            self.set_xy(14, self.get_y())
            self.set_font('helvetica', '', 9)
            self.set_text_color(*TEXT_MAIN)
            self.cell(80, 5, timeline, 0, 0)

            # Move cursor past the box
            actual_tmp = self.get_y()
            if actual_tmp < box_y: self.set_y(actual_tmp + 5)
            else: self.set_y(box_y + 18)

            actions = ap.get('specific_actions', [])
            if actions:
                small_label("Specific Actions")
                for i, act in enumerate(actions, 1):
                    self.set_x(12)
                    self.set_font('helvetica', 'B', 9)
                    self.set_text_color(*PURPLE)
                    self.cell(8, 5, f"{i}.", 0, 0)
                    self.set_font('helvetica', '', 9)
                    self.set_text_color(*TEXT_MAIN)
                    self.multi_cell(178, 5, sanitize_text(str(act)))
                    self.ln(1)

            for ind in ap.get('success_indicators', []):
                self.set_x(15)
                self.set_font('helvetica', '', 9)
                self.set_text_color(*EMERALD)
                self.multi_cell(180, 5, "+ " + sanitize_text(str(ind)))
            divider()



def generate_report(transcript, role, ai_role, scenario, framework=None, filename="coaching_report.pdf", mode="coaching", precomputed_data=None, scenario_type=None, user_name="{user_name}", ai_character="alex", session_mode=None):


    """
    Generate a UNIFIED PDF report for all scenario types.
    """
    # Auto-detect scenario type if not provided
    if not scenario_type:
        scenario_type = detect_scenario_type(scenario, ai_role, role)
    
    print(f"Generating Unified PDF Report (scenario_type: {scenario_type}) for user: {user_name}...")
    
    # Analyze data or use precomputed
    if precomputed_data:
        data = precomputed_data
        if 'scenario_type' not in data: 
            data['scenario_type'] = scenario_type
    else:
        print("Generating new report data...")
        data = analyze_full_report_data(transcript, role, ai_role, scenario, framework, mode, scenario_type)
    
    # Sanitize data for PDF
    def sanitize_data_recursive(obj):
        if isinstance(obj, str):
            return sanitize_text(obj)
        elif isinstance(obj, dict):
            return {k: sanitize_data_recursive(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [sanitize_data_recursive(item) for item in obj]
        return obj
    
    data = sanitize_data_recursive(data)
    
    pdf = DashboardPDF()
    pdf.set_scenario_type(scenario_type)
    pdf.set_user_name(user_name)
    pdf.set_character(ai_character)
    pdf.set_context(role, ai_role, scenario)
    
    # Determine session mode early so cover page can adapt
    meta_data = data.get('meta', {}) if isinstance(data, dict) else {}
    session_mode = session_mode or meta_data.get('session_mode', mode)
    pdf._session_mode = session_mode
    
    pdf.add_page()
    
    # Get scenario_type from data if available
    meta_data = data.get('meta', {}) if isinstance(data, dict) else {}
    scenario_type = meta_data.get('scenario_type', scenario_type)
    
    # 1. Banner (shown for non-mentorship)
    meta = data.get('meta', {}) if isinstance(data, dict) else {}
    if (data.get('type') if isinstance(data, dict) else None) != "mentorship_reflection":
        pdf.draw_banner(meta, scenario_type=scenario_type)
    
    # 2. Route to correct renderer based on session mode
    stype = str(scenario_type).lower()
    
    try:
        # Check if this is a MENTORSHIP REFLECTION report (new format)
        if (data.get('type') if isinstance(data, dict) else None) == "mentorship_reflection":
            print(f"[INFO] Rendering Mentorship Reflection Report (observation-based learning)...")
            pdf.draw_mentorship_reflection_report(data)
        else:
            # ALL other scenarios use the rich 14-section SimulationView-aligned renderer
            pdf.draw_coaching_sim_report(data)

        # Transcript always appended at the end
        if transcript:
            pdf.draw_transcript(transcript)

    except Exception as e:
        print(f"Error drawing report body: {e}")
        import traceback
        traceback.print_exc()
        raw_items = data.items() if isinstance(data, dict) else []
        pdf.draw_key_value_grid("RAW DATA DUMP (Drawing Failed)", {k:str(v)[:100] for k,v in raw_items if k != 'meta'})

    pdf.output(filename)
    print(f"[SUCCESS] Unified report saved: {filename} (scenario: {scenario_type})")
