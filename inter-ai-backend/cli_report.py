import datetime as dt
import json
import math
import os
import re
import time
import unicodedata

from dotenv import load_dotenv
from fpdf import FPDF
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate

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
import tempfile

import matplotlib.pyplot as plt
import numpy as np
from langchain_openai import ChatOpenAI


def setup_litellm_model(model_name, is_chat=False):
    """Create a LangChain-compatible LLM specifically for Groq API."""
    temp = 0.7 if is_chat else 0.1
    print(f"[INFO] Setting up Groq model: {model_name} (chat={is_chat}, temp={temp})")

    return ChatOpenAI(
        model=model_name,
        temperature=temp,
        api_key=os.getenv("GROQ_API_KEY", "not-needed"),
        base_url="https://api.groq.com/openai/v1",
        request_timeout=120,
        max_retries=3
    )

# Model names for Groq exclusively
# NOTE: Groq deprecated the Llama chat models (llama-3.1-8b-instant /
# llama-3.3-70b-versatile) on 2026-08-16. The current replacements hosted by
# Groq are openai/gpt-oss-20b (chat) and openai/gpt-oss-120b (report).
REPORT_MODEL_NAME = os.getenv("REPORT_MODEL") or os.getenv("MODEL_NAME", "openai/gpt-oss-120b")
CHAT_MODEL_NAME = os.getenv("CHAT_MODEL") or os.getenv("CHAT_MODEL_NAME", "openai/gpt-oss-20b")

report_llm = setup_litellm_model(REPORT_MODEL_NAME, is_chat=False)
chat_llm = setup_litellm_model(CHAT_MODEL_NAME, is_chat=True)

prompt_template = PromptTemplate(template="{prompt}", input_variables=["prompt"])

# Kept for backwards compatibility if needed, but prefer specific ones
MODEL_NAME = REPORT_MODEL_NAME

def count_request_tokens(messages, model=None):
    if model is None: model = REPORT_MODEL_NAME
    try:
        return len(str(messages)) // 4
    except Exception as e:
        print(f"[TOKEN] request token count failed: {e}", flush=True)
        return 0


def count_response_tokens(text, model=None):
    if model is None: model = REPORT_MODEL_NAME
    try:
        return len(str(text)) // 4
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

            # Prefer provider-exact usage; fall back to length-based estimates.
            from services.usage import extract_usage_metadata, record_llm_result
            exact_usage = extract_usage_metadata(response)
            exact_req_tokens = exact_usage[0] if exact_usage else None
            exact_res_tokens = exact_usage[1] if exact_usage else None
            record_llm_result(
                model_name,
                input_tokens=exact_req_tokens,
                output_tokens=exact_res_tokens,
                messages=messages,
                output_text=text,
            )

            if return_usage:
                response_tokens = exact_res_tokens if exact_res_tokens is not None else count_response_tokens(text, model=model_name)
                req_t = exact_req_tokens if exact_req_tokens is not None else (request_tokens or 0)
                res_t = response_tokens or 0
                total_tokens = req_t + res_t
                print(f"[TOKEN] request={req_t} response={res_t} total={total_tokens}", flush=True)
                return text, {
                    "request_tokens": req_t,
                    "response_tokens": res_t,
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
        from services.usage import record_chain_usage
        record_chain_usage(response, REPORT_MODEL_NAME, messages=prompt, output_text=str(json_text))
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
        from services.usage import record_chain_usage
        record_chain_usage(response, REPORT_MODEL_NAME, messages=prompt, output_text=str(json_text))
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


def normalize_assessment_report(data, fallback_meta):
    """Make LLM assessment JSON safe for every report client.

    The assessment prompt calls its scored rows ``participant_performance``;
    older web and mobile clients render ``scorecard``. Keep both names in the
    API response and normalize score types so a valid model response is never
    silently omitted by the UI.
    """
    if not isinstance(data, dict):
        return {"meta": fallback_meta, "type": "assessment_report"}

    meta = data.get("meta")
    if not isinstance(meta, dict):
        meta = {}
        data["meta"] = meta
    for key, value in fallback_meta.items():
        meta.setdefault(key, value)

    performance = data.get("participant_performance")
    legacy_scorecard = data.get("scorecard")
    source_items = performance if isinstance(performance, list) else legacy_scorecard
    if not isinstance(source_items, list):
        source_items = []

    scorecard = []
    for item in source_items:
        if not isinstance(item, dict):
            continue
        normalized = item.copy()
        score = normalized.get("score", "0/10")
        if isinstance(score, (int, float)):
            score = f"{score}/10"
        elif isinstance(score, str) and "/" not in score:
            score = f"{score}/10"
        normalized["score"] = str(score)
        normalized.setdefault("dimension", "Assessment dimension")
        normalized.setdefault("reasoning", normalized.get("description", "No reasoning was returned."))
        scorecard.append(normalized)

    data["participant_performance"] = scorecard
    data["scorecard"] = scorecard
    if not isinstance(data.get("radar_chart_data"), list):
        data["radar_chart_data"] = [
            {"dimension": item["dimension"], "score": round(float(item["score"].split("/")[0]))}
            for item in scorecard
            if item["score"].split("/")[0].replace(".", "", 1).isdigit()
        ]

    # Ensure overall_grade follows X/10 convention (from performance_scorecard if present)
    ps = data.get("performance_scorecard")
    if isinstance(ps, dict) and isinstance(ps.get("dimensions"), list) and ps["dimensions"]:
        scores = []
        for dim in ps["dimensions"]:
            if not isinstance(dim, dict):
                continue
            sc = dim.get("score")
            try:
                scores.append(float(str(sc).split("/")[0].strip()))
            except (ValueError, IndexError, TypeError):
                continue
        if scores:
            overall = int(round(sum(scores) / len(scores)))
            meta["overall_grade"] = f"{overall}/10"

    # -----------------------------------------------------------------
    # GUARANTEE EVERY SECTION EXISTS SO THE PDF ALWAYS RENDERS ALL 14.
    # The LLM frequently truncates its single large JSON response and
    # drops the middle sections (5-13). Fall back to explicit "Insufficient
    # evidence" placeholders for any missing section rather than silently
    # omitting the section from the report.
    # -----------------------------------------------------------------
    NO_EVIDENCE = "Insufficient evidence from the conversation."

    def _dimension_map():
        board = data.get("performance_scorecard")
        names = []
        if isinstance(board, dict) and isinstance(board.get("dimensions"), list):
            names = [d.get("dimension") for d in board["dimensions"] if isinstance(d, dict) and d.get("dimension")]
        return names or (meta.get("scorecard_dimensions", []).split(", ") if meta.get("scorecard_dimensions") else [])

    # 1. Timing
    if not isinstance(data.get("timing"), dict):
        data["timing"] = {
            "duration": data.get("timing") or "0 min 0 sec",
            "start_time": "",
            "end_time": "",
            "conversation_turns": 0,
            "speaker_distribution": "Participant: -- / Coach: --",
        }

    # 2. Conversation snapshot
    if not isinstance(data.get("conversation_snapshot"), dict):
        data["conversation_snapshot"] = {
            "primary_topic": NO_EVIDENCE,
            "key_objectives": [],
            "main_challenges": [],
            "summary": NO_EVIDENCE,
            "key_themes": [],
        }

    # 3. Executive dashboard (numbers required by the renderer)
    if not isinstance(data.get("executive_dashboard"), dict):
        data["executive_dashboard"] = {}
    ed = data["executive_dashboard"]
    for k in ("session_duration", "key_themes", "strength_areas", "missed_opportunities",
              "coaching_opportunities", "recommended_actions"):
        ed.setdefault(k, 0)

    # 4. Coaching efficacy
    if not isinstance(data.get("coaching_efficacy"), dict):
        data["coaching_efficacy"] = {}
    ce = data["coaching_efficacy"]
    if not isinstance(ce.get("dimensions"), dict):
        ce["dimensions"] = {}
    standard_dims = [
        "goal_alignment", "question_quality", "active_listening", "feedback_quality",
        "depth_of_exploration", "actionability", "participant_engagement",
    ]
    for dim in standard_dims:
        if not isinstance(ce["dimensions"].get(dim), dict):
            ce["dimensions"][dim] = {"score": 0, "evidence": NO_EVIDENCE,
                                     "reasoning": NO_EVIDENCE, "improvement": NO_EVIDENCE}

    # 5. Conversation heat map
    if not isinstance(data.get("heat_map"), dict):
        data["heat_map"] = {}
    hm = data["heat_map"]
    if not isinstance(hm.get("dimensions"), list) or not hm["dimensions"]:
        hm["dimensions"] = ["Communication", "Behaviour", "Emotional Intelligence",
                            "Goal Focus", "Engagement", "Leadership", "Conflict Handling"]
    n_dims = len(hm["dimensions"])
    if not isinstance(hm.get("segments"), list) or not hm["segments"]:
        hm["segments"] = [
            {"label": "Opening", "intensity": [0] * n_dims},
            {"label": "Mid-session", "intensity": [0] * n_dims},
            {"label": "Closing", "intensity": [0] * n_dims},
        ]
    for seg in hm["segments"]:
        if not isinstance(seg, dict):
            continue
        if not isinstance(seg.get("intensity"), list) or len(seg["intensity"]) < n_dims:
            seg["intensity"] = ([int(v) for v in (seg.get("intensity") or [])] + [0] * n_dims)[:n_dims]

    # 6. Skill visualization
    if not isinstance(data.get("skill_visualization"), dict):
        data["skill_visualization"] = {}
    sv = data["skill_visualization"]
    for group in ("communication", "leadership", "interpersonal"):
        if not isinstance(sv.get(group), dict) or not sv[group]:
            sv[group] = {}

    # 7. Goal attainment
    if not isinstance(data.get("goal_attainment"), list) or not data["goal_attainment"]:
        data["goal_attainment"] = [{
            "goal": NO_EVIDENCE, "evidence": NO_EVIDENCE,
            "status": "Needs Attention", "remaining_development": NO_EVIDENCE,
        }]

    # 8. Performance scorecard
    if not isinstance(data.get("performance_scorecard"), dict):
        data["performance_scorecard"] = {}
    psc = data["performance_scorecard"]
    if not isinstance(psc.get("dimensions"), list):
        psc["dimensions"] = []
    if not psc["dimensions"]:
        dim_names = _dimension_map()
        psc["dimensions"] = [
            {"dimension": n or "Assessment dimension", "score": 0,
             "evidence": NO_EVIDENCE, "reasoning": NO_EVIDENCE, "improvement": NO_EVIDENCE}
            for n in (dim_names[:6] or ["Communication", "Active Listening",
                                        "Emotional Intelligence", "Leadership",
                                        "Goal Orientation", "Coaching Engagement"])
        ]
    psc.setdefault("overall_performance", meta.get("overall_grade", "0/10"))
    psc.setdefault("scoring_methodology", NO_EVIDENCE)

    # 9. Deep-dive analysis
    if not isinstance(data.get("deep_dive_analysis"), dict):
        data["deep_dive_analysis"] = {}
    dda = data["deep_dive_analysis"]
    if not isinstance(dda.get("communication_style"), dict):
        dda["communication_style"] = {"observed_style": NO_EVIDENCE}
    for f in ("behaviour_analysis", "emotional_intelligence"):
        if not isinstance(dda.get(f), dict):
            dda[f] = {}

    # 10. Strengths & missed opportunities
    if not isinstance(data.get("strengths_and_opportunities"), dict):
        data["strengths_and_opportunities"] = {}
    soc = data["strengths_and_opportunities"]
    if not isinstance(soc.get("strengths"), list) or not soc["strengths"]:
        soc["strengths"] = [NO_EVIDENCE]
    if not isinstance(soc.get("missed_opportunities"), list) or not soc["missed_opportunities"]:
        soc["missed_opportunities"] = [NO_EVIDENCE]

    # 11. Ideal coaching questions
    if not isinstance(data.get("ideal_coaching_questions"), list) or not data["ideal_coaching_questions"]:
        data["ideal_coaching_questions"] = [{
            "question": NO_EVIDENCE, "definition": NO_EVIDENCE,
            "impact": NO_EVIDENCE, "impact_score": 0,
        }]

    # 12. Action plan
    if not isinstance(data.get("action_plan"), list) or not data["action_plan"]:
        data["action_plan"] = [{
            "action": NO_EVIDENCE, "why_it_matters": NO_EVIDENCE,
            "success_indicator": NO_EVIDENCE, "priority": "Medium",
        }]

    # 13. Recommended next steps
    if not isinstance(data.get("recommended_next_steps"), list) or not data["recommended_next_steps"]:
        data["recommended_next_steps"] = [NO_EVIDENCE]

    # 14. Conversation analysis
    if not isinstance(data.get("conversation_analysis"), dict):
        data["conversation_analysis"] = {
            "phase_breakdown": [
                {"phase": "Opening", "time_range": "0-1 min",
                 "summary": NO_EVIDENCE, "participant_technique": NO_EVIDENCE,
                 "impact": NO_EVIDENCE}
            ],
            "key_turning_points": [],
            "dialogue_dynamics": [
                {"dimension": "Balance of Talk Time", "observation": NO_EVIDENCE, "assessment": "0/10"}
            ],
            "notable_moments": [],
        }
    ca = data["conversation_analysis"]
    for k in ("phase_breakdown", "key_turning_points", "dialogue_dynamics", "notable_moments"):
        if not isinstance(ca.get(k), list):
            ca[k] = []

    data.setdefault("type", "assessment_report")
    return data


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
    # MENTORSHIP MODE: Using standard assessment format as requested
    # =====================================================================

    # Shared preamble injected at the top of every scorecard sub-prompt.
    # The report JSON is generated by SEVERAL SMALLER LLM CALLS (each covering
    # a handful of sections) instead of one huge call. This avoids the LLM
    # truncating its output and dropping the mid-report sections (5-13).
    shared_preamble = f"""
=== CRITICAL EVALUATION TARGET ===
You MUST evaluate ONLY the [HUMAN LEARNER]'s performance (the person playing "{role}").
Do NOT evaluate the [AI CHARACTER]'s performance (the AI playing "{ai_role}").
The [AI CHARACTER]'s responses are ONLY context for understanding how the [HUMAN LEARNER] reacted.
Every score, quote, and insight MUST be about the [HUMAN LEARNER]'s words and actions ONLY.
===

=== PROFESSIONAL REPORT VOICE (ENTERPRISE - MANDATORY) ===
Write like an experienced organization-development consultant preparing an internal control document — precise, measured, and evidence-based. Never sound like an AI summary, a cheerleader, or a school report card.
- Use neutral, professional phrasing: "The conversation indicates...", "The discussion demonstrates...", "A recurring theme was...", "An opportunity for development is...", "The transcript provided evidence of...", "Further exploration may be beneficial...".
- Never write: "The AI thinks...", "The model believes...", "You did a great job!", "This was amazing!", "Great improvement!", "According to AI...".
- Do NOT address the [HUMAN LEARNER] in the second person ("You scored...", "You improved..."). Refer to "the participant" or "the learner".
- Every claim must trace to a specific line or exchange in the transcript. If evidence is insufficient, use exactly: "Insufficient evidence from the conversation."
- Avoid clichés and filler. Be specific, concrete, and concise. Prefer short, plain sentences.
- Do NOT repeat the same observation verbatim across sections; each section adds a distinct analytical layer.
===

=== STRICT SCORING CALIBRATION (MANDATORY) ===
You are a TOUGH but FAIR evaluator. Do NOT give inflated scores. Apply these criteria rigorously:

SCORE 1-3 (Poor): The [HUMAN LEARNER]'s response is off-topic, irrelevant to their role as "{role}", vague, dismissive, or shows no understanding of the scenario. Generic/filler responses ("okay", "sure", "let's go") with no substance score here.
SCORE 4-5 (Below Average): The [HUMAN LEARNER] stays somewhat in role but responses are shallow, lack specificity, miss key aspects of the scenario, or fail to demonstrate the skill being assessed. Surface-level engagement without depth.
SCORE 6-7 (Average/Good): The [HUMAN LEARNER] is clearly in role, addresses the scenario appropriately, shows reasonable skill application, but may miss nuances, lack depth in certain areas, or have room for improvement in technique.
SCORE 8-9 (Very Good): The [HUMAN LEARNER] demonstrates strong role alignment, uses specific and convincing language, shows clear mastery of the skill dimension, and produces a meaningful impact on the conversation. Must have STRONG transcript evidence.
SCORE 10 (Exceptional): Reserved for truly outstanding performance with flawless execution, deep emotional intelligence, and transformative impact. Extremely rare — requires exceptional transcript evidence.

KEY PRINCIPLES:
- A high score MUST be EARNED through demonstrated skill, not given by default.
- If the [HUMAN LEARNER] says very little, gives generic responses, or doesn't engage meaningfully with the scenario, scores MUST reflect that (1-4 range).
- Role alignment is CRITICAL: the [HUMAN LEARNER] must speak and act convincingly as "{role}". If they break character, give off-topic responses, or don't fulfill their role's responsibilities, penalize accordingly.
- Convincingness matters: vague platitudes score lower than specific, actionable, and contextually appropriate responses.
- The overall_grade should be the WEIGHTED AVERAGE of scorecard dimensions, not an arbitrary number.
- Do NOT be generous to "encourage" the learner. Honest, evidence-based feedback helps them grow.
===

**Scorecard**: Evaluate the [HUMAN LEARNER]'s performance on these 6 dimensions (1-10): {scorecard_dimensions}

The full report is assembled from THREE smaller responses. Return ONLY the JSON for the sections listed in YOUR schema below — do not invent other top-level keys.

=== PART 1 OF 3 — REPORT OVERVIEW ===
**JSON Schema** — return exactly these fields:
{{
  "meta": {{
    "scenario_id": "{scenario_type}",
    "outcome_status": "Completed/Incomplete",
    "overall_grade": "X/10",
    "summary": "One-sentence summary of [HUMAN LEARNER]'s performance."
  }},
  "type": "assessment_report",
  "timing": {{
    "duration": "X min X sec",
    "start_time": "X:XX AM/PM",
    "end_time": "X:XX AM/PM",
    "conversation_turns": 0,
    "speaker_distribution": "Participant: XX% / Coach: XX%"
  }},
  "conversation_snapshot": {{
    "primary_topic": "Main discussion topic",
    "key_objectives": ["Objective discussed"],
    "main_challenges": ["Challenge identified"],
    "summary": "2-3 sentence overall conversation summary",
    "key_themes": ["Theme 1", "Theme 2", "Theme 3", "Theme 4"]
  }},
  "executive_dashboard": {{
    "session_duration": "Xm Xs",
    "key_themes": 0,
    "strength_areas": 0,
    "missed_opportunities": 0,
    "coaching_opportunities": 0,
    "recommended_actions": 0
  }},
  "conversation_analysis": {{
    "phase_breakdown": [
      {{
        "phase": "Opening",
        "time_range": "0-3 min",
        "summary": "What happened in this phase of the conversation",
        "participant_technique": "Specific coaching/communication technique the participant used",
        "impact": "How the participant's approach affected the direction of the dialogue"
      }}
    ],
    "key_turning_points": [
      {{
        "moment": "A single pivotal exchange in the conversation",
        "what_happened": "What the participant said or did at this moment",
        "why_significant": "Why this shifted the conversation's trajectory"
      }}
    ],
    "dialogue_dynamics": [
      {{
        "dimension": "Balance of Talk Time / Questioning / Active Listening / Tone",
        "observation": "Observation of the participant's behaviour in this dimension",
        "assessment": "For scoring mode: X/10. For mentorship mode: a qualitative statement ONLY (High / Moderate / Developing)."
      }}
    ],
    "notable_moments": [
      "A concrete, high-impact moment or exchange worth flagging",
      "Another notable moment"
    ]
  }}
}}

conversation_analysis MUST provide a granular, phase-by-phase walkthrough of the actual dialogue (opening, middle, closing). phase_breakdown MUST have 2-4 phases; each must name the technique the participant used and its impact. key_turning_points MUST identify the 1-3 pivotal exchanges and why they mattered. dialogue_dynamics MUST evaluate 2-4 dimensions such as talk-time balance, questioning quality, active listening, and tone, using an integer X/10 for the assessment in this scoring mode. notable_moments MUST list 1-3 concrete exchanges. This section traces the ARC of the conversation and must NOT merely restate scores from other parts.
"""

    schemas = [f"""
    {shared_preamble}
    
    Every score needs transcript evidence from [HUMAN LEARNER] lines ONLY. Concise reasoning (1-2 sentences) explaining WHY that specific score was given.
    
    **Scorecard**: Evaluate the [HUMAN LEARNER]'s performance on these 6 dimensions (1-10): {scorecard_dimensions}
    
    The full report is assembled from THREE smaller responses. Return ONLY the JSON for the sections listed in YOUR schema below — do not invent other top-level keys.
    
    === PART 2 OF 3 — QUANTITATIVE SCORING ===
    **JSON Schema** — return exactly these fields:
    {{
      "coaching_efficacy": {{
        "dimensions": {{
          "goal_alignment": {{ "score": 0, "evidence": "Exact verbatim [HUMAN LEARNER] quote", "reasoning": "1-2 sentences explaining the score", "improvement": "Specific improvement advice" }},
          "question_quality": {{ "score": 0, "evidence": "Exact verbatim [HUMAN LEARNER] quote", "reasoning": "1-2 sentences", "improvement": "Specific improvement advice" }},
          "active_listening": {{ "score": 0, "evidence": "Exact verbatim [HUMAN LEARNER] quote", "reasoning": "1-2 sentences", "improvement": "Specific improvement advice" }},
          "feedback_quality": {{ "score": 0, "evidence": "Exact verbatim [HUMAN LEARNER] quote", "reasoning": "1-2 sentences", "improvement": "Specific improvement advice" }},
          "depth_of_exploration": {{ "score": 0, "evidence": "Exact verbatim [HUMAN LEARNER] quote", "reasoning": "1-2 sentences", "improvement": "Specific improvement advice" }},
          "actionability": {{ "score": 0, "evidence": "Exact verbatim [HUMAN LEARNER] quote", "reasoning": "1-2 sentences", "improvement": "Specific improvement advice" }},
          "participant_engagement": {{ "score": 0, "evidence": "Exact verbatim [HUMAN LEARNER] quote", "reasoning": "1-2 sentences", "improvement": "Specific improvement advice" }}
        }}
      }},
      "heat_map": {{
        "dimensions": ["Communication", "Behaviour", "Emotional Intelligence", "Goal Focus", "Engagement", "Leadership", "Conflict Handling"],
        "segments": [
          {{ "label": "Opening", "intensity": [0, 0, 0, 0, 0, 0, 0] }},
          {{ "label": "Mid-session", "intensity": [0, 0, 0, 0, 0, 0, 0] }},
          {{ "label": "Closing", "intensity": [0, 0, 0, 0, 0, 0, 0] }}
        ]
      }},
      "skill_visualization": {{
        "communication": {{ "clarity": 0, "active_listening": 0, "articulation": 0, "questioning": 0 }},
        "leadership": {{ "decision_making": 0, "accountability": 0, "delegation": 0, "conflict_management": 0 }},
        "interpersonal": {{ "empathy": 0, "collaboration": 0, "emotional_awareness": 0 }}
      }},
      "performance_scorecard": {{
        "dimensions": [
          {{ "dimension": "Communication", "score": 0, "evidence": "Exact verbatim [HUMAN LEARNER] quote showing this behaviour", "reasoning": "1-2 sentences explaining how the score was derived from that evidence", "improvement": "Specific, actionable recommendation to raise this score — include an example phrase" }},
          {{ "dimension": "Active Listening", "score": 0, "evidence": "Exact verbatim [HUMAN LEARNER] quote", "reasoning": "1-2 sentences", "improvement": "Specific improvement advice" }},
          {{ "dimension": "Emotional Intelligence", "score": 0, "evidence": "Exact verbatim [HUMAN LEARNER] quote", "reasoning": "1-2 sentences", "improvement": "Specific improvement advice" }},
          {{ "dimension": "Leadership", "score": 0, "evidence": "Exact verbatim [HUMAN LEARNER] quote", "reasoning": "1-2 sentences", "improvement": "Specific improvement advice" }},
          {{ "dimension": "Goal Orientation", "score": 0, "evidence": "Exact verbatim [HUMAN LEARNER] quote", "reasoning": "1-2 sentences", "improvement": "Specific improvement advice" }},
          {{ "dimension": "Coaching Engagement", "score": 0, "evidence": "Exact verbatim [HUMAN LEARNER] quote", "reasoning": "1-2 sentences", "improvement": "Specific improvement advice" }}
        ],
        "overall_performance": "X/10 - Strong Performance",
        "scoring_methodology": "2-3 sentences explaining how the scores were derived from transcript evidence."
      }},
      "participant_performance": [
        {{
          "dimension": "Dimension name from scorecard",
          "score": "X/10",
          "reasoning": "1-2 sentences explaining exactly why this score was given, tied to specific behavior.",
          "quote": "EXACT verbatim quote from [HUMAN LEARNER] only — the most relevant line",
          "suggestion": "Specific, actionable recommendation for how to improve — include an example phrase if possible."
        }}
      ],
      "radar_chart_data": [
        {{ "dimension": "Dimension name", "score": 0 }}
      ],
      "recommended_next_steps": [
        "Priority 1 — the single most important development focus, stated as a concise action",
        "Priority 2 — next most important development focus",
        "Priority 3 — last, still valuable development focus"
      ]
    }}
    
    Use the full 1-10 scale and never inflate. Every dimension in performance_scorecard and coaching_efficacy MUST include (a) "evidence" = an exact verbatim [HUMAN LEARNER] quote, (b) "reasoning", and (c) "improvement". radar_chart_data scores MUST be integers 1-10 and MUST have exactly 6 dimensions matching performance_scorecard.dimensions. meta.overall_grade MUST be an integer X/10 and MUST equal the average of performance_scorecard.dimensions scores (set it in Part 1). heat_map.segments MUST have exactly 3 segments; each intensity array MUST have exactly 7 integers matching heat_map.dimensions order. recommended_next_steps MUST list 2-4 concise, actionable development priorities drawn from evidence, each NEW content (do not repeat action_plan wording).
    """]
    
    schemas.append(f"""
    {shared_preamble}
    
    Every score needs transcript evidence from [HUMAN LEARNER] lines ONLY. Concise reasoning (1-2 sentences) explaining WHY that specific score was given.
    
    The full report is assembled from THREE smaller responses. Return ONLY the JSON for the sections listed in YOUR schema below — do not invent other top-level keys.
    
    === PART 3 OF 3 — DEVELOPMENT INSIGHTS ===
    **JSON Schema** — return exactly these fields:
    {{
      "goal_attainment": [
        {{
          "goal": "Improve communication",
          "evidence": "Discussed communication gaps with specific examples",
          "status": "Partially Achieved",
          "remaining_development": "What still needs to happen to fully achieve this goal"
        }},
        {{
          "goal": "Handle conflict better",
          "evidence": "Explored conflict scenario in depth",
          "status": "Achieved",
          "remaining_development": "What still needs to happen (or 'None — goal met')"
        }}
      ],
      "deep_dive_analysis": {{
        "communication_style": {{
          "observed_style": "Collaborative and explanatory",
          "clarity": "Observation about clarity",
          "directness": "Observation about directness",
          "conciseness": "Observation about conciseness",
          "assertiveness": "Observation about assertiveness",
          "listening": "Observation about listening",
          "questioning": "Observation about questioning",
          "adaptability": "Observation about adaptability",
          "strength": "Key strength observed",
          "development_area": "Key development area observed"
        }},
        "behaviour_analysis": {{
          "initiative": {{ "score": 0, "evidence": "Observed behaviour" }},
          "accountability": {{ "score": 0, "evidence": "Observed behaviour" }},
          "collaboration": {{ "score": 0, "evidence": "Observed behaviour" }},
          "decision_making": {{ "score": 0, "evidence": "Observed behaviour" }},
          "adaptability": {{ "score": 0, "evidence": "Observed behaviour" }},
          "conflict_response": {{ "score": 0, "evidence": "Observed behaviour" }},
          "problem_solving": {{ "score": 0, "evidence": "Observed behaviour" }},
          "ownership": {{ "score": 0, "evidence": "Observed behaviour" }}
        }},
        "emotional_intelligence": {{
          "self_awareness": {{ "score": 0, "evidence": "Evidence", "improvement": "Recommendation" }},
          "self_regulation": {{ "score": 0, "evidence": "Evidence", "improvement": "Recommendation" }},
          "empathy": {{ "score": 0, "evidence": "Evidence", "improvement": "Recommendation" }},
          "social_awareness": {{ "score": 0, "evidence": "Evidence", "improvement": "Recommendation" }},
          "relationship_management": {{ "score": 0, "evidence": "Evidence", "improvement": "Recommendation" }}
        }}
      }},
      "strengths_and_opportunities": {{
        "strengths": [
          "Strength 1 — specific and evidence-based",
          "Strength 2",
          "Strength 3"
        ],
        "missed_opportunities": [
          "Missed opportunity 1 — specific behavior that was not addressed",
          "Missed opportunity 2",
          "Missed opportunity 3"
        ]
      }},
      "ideal_coaching_questions": [
        {{
          "question": "What do you think is the underlying reason this keeps happening?",
          "definition": "A root-cause exploration question designed to move the conversation beyond the immediate problem.",
          "impact": "Encourages deeper reflection and identifies underlying behavioural or process issues.",
          "impact_score": 0
        }}
      ],
      "action_plan": [
        {{
          "action": "Practice concise communication",
          "why_it_matters": "Improve clarity in high-pressure discussions",
          "success_indicator": "Responses become more structured and focused",
          "priority": "High"
        }},
        {{
          "action": "Use root-cause questioning",
          "why_it_matters": "Improve problem exploration",
          "success_indicator": "Deeper discussions",
          "priority": "High"
        }}
      ]
    }}
    
    goal_attainment statuses MUST be one of exactly: "Achieved", "Partially Achieved", "Needs Attention", "Not Addressed". action_plan priority MUST be one of exactly: "High", "Medium", "Low". behaviour_analysis and emotional_intelligence scores are 1-10. ideal_coaching_questions impact_score is 1-10. Contribute 2-3 ideal coaching questions even if the participant never asked questions.
    """)

    # ANALYST PERSONA (compressed)
    analyst_persona = ""
    if scenario_type == "mentorship" or simulation_id == "SIM-11-MENTOR-001":
        analyst_persona = "STYLE: Wise, outcome-oriented. Focus on empathy vs high standards balance. Quote exact words."
    elif ai_character == "sarah":
        analyst_persona = "STYLE: Warm, encouraging, high-EQ. Focus on psychological safety and growth mindset. Quote exact words."
    else:
        analyst_persona = "STYLE: Professional, direct, analytical. Back every score with verbatim quote. High-impact tactical advice."

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
        # PARALLEL EXECUTION: Run 3 smaller LLM calls simultaneously
        # Uses concurrent.futures to drastically reduce generation time
        # =====================================================================
        print(" [INFO] Starting PARALLEL report generation (3 concurrent LLM calls)...", flush=True)
        
        import concurrent.futures
        t1 = dt.datetime.now()
        
        def run_report_part(schema):
            """Run one of the three smaller report sub-calls (overview / scoring / insights)."""
            part_system = (
                f"You are a professional performance analyst assessing a roleplay session.\n"
                f"\n"
                f"=== WHO TO EVALUATE ===\n"
                f"[HUMAN LEARNER] = The real human user, playing the role of \"{role}\". EVALUATE THIS PERSON ONLY.\n"
                f"[AI CHARACTER] = The AI system, playing the role of \"{ai_role}\". Do NOT evaluate this. Use only as context.\n"
                f"===\n"
                f"\n"
                f"{analyst_persona}\n"
                f"{schema}\n"
                f"\n"
                f"Use the transcript below as your SOLE source of truth. ALL verbatim quotes MUST come from [HUMAN LEARNER] lines.\n"
                f"Return a single JSON object. Do NOT include any text before or after the JSON.\n"
            )
            try:
                raw_response = chain_raw.invoke(
                    {
                        "system_prompt": part_system,
                        "conversation": full_conversation
                    },
                    config={
                        "run_name": "report_generation",
                        "tags": ["report", scenario_type or "unknown"]
                    }
                )

                from services.usage import record_chain_usage
                record_chain_usage(
                    raw_response,
                    REPORT_MODEL_NAME,
                    messages=part_system + "\n" + full_conversation,
                    output_text=str(getattr(raw_response, "content", "")),
                )

                content = raw_response.content if hasattr(raw_response, 'content') else str(raw_response)
                json_text = "".join(str(x) for x in content).strip() if isinstance(content, list) else content.strip()
                part_data = parse_json_robustly(json_text)

                if part_data is None:
                    part_data = parser.parse(json_text)
                return part_data if isinstance(part_data, dict) else {}
            except Exception as e:
                print(f" [ERROR] Report part LLM call failed: {e}", flush=True)
                return {}

        def merge_parts(parts):
            merged = {}
            for part in parts:
                if not isinstance(part, dict):
                    continue
                for k, v in part.items():
                    merged[k] = v
            return merged

        # Execute all 5 in parallel (3 report parts + character + questions)
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            future_p1 = executor.submit(run_report_part, shared_preamble)
            future_p2 = executor.submit(run_report_part, schemas[0])
            future_p3 = executor.submit(run_report_part, schemas[1])
            future_character = executor.submit(analyze_character_traits, transcript, role, ai_role, scenario, scenario_type)
            future_questions = executor.submit(analyze_questions_missed, transcript, role, ai_role, scenario, scenario_type)

            parts = [future_p1.result(), future_p2.result(), future_p3.result()]
            data = merge_parts(parts)
            character_data = future_character.result()
            questions_data = future_questions.result()

        t2 = dt.datetime.now()
        print(f" [SUCCESS] Parallel report completed in {(t2-t1).total_seconds():.2f}s", flush=True)
        
        # Handle total failure (all three parts returned nothing)
        if not data or not isinstance(data, dict):
            print(" [ERROR] Main report generation failed", flush=True)
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
        
        data = normalize_assessment_report(data, meta)
        # Ensure session context is authoritative, even when the model omitted it.
        data['meta']['scenario_type'] = scenario_type
        data['meta']['session_mode'] = session_mode or data['meta'].get('session_mode', 'skill_assessment')

        # Inject the parallel results into the main data payload
        data['character_assessment'] = character_data
        data['question_analysis'] = questions_data

        # Calculate talk time
        user_words = sum(len(t['content'].split()) for t in transcript if t['role'] == 'user')
        total_words = sum(len(t['content'].split()) for t in transcript)
        user_talk_time_percentage = round((user_words / max(total_words, 1)) * 100)
        
        if 'quantitative_analytics' not in data:
            data['quantitative_analytics'] = {}
        data['quantitative_analytics']['user_talk_time_percentage'] = user_talk_time_percentage

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
        # Subtle separator line
        self.set_draw_color(200, 200, 200)
        self.line(10, self.get_y(), 200, self.get_y())
        self.set_y(-12)
        # Page number on left
        self.set_font('helvetica', '', 8)
        self.set_text_color(128, 128, 128)
        super().cell(30, 10, f'Page {self.page_no()}', 0, 0, 'L')
        # Branding in center
        self.set_font('helvetica', 'I', 8)
        super().cell(140, 10, 'CoAct.AI | Enterprise Coaching Intelligence', 0, 0, 'C')
        # Confidential + date on right
        self.set_font('helvetica', '', 7)
        super().cell(0, 10, f'Confidential | {dt.datetime.now().strftime("%Y-%m-%d")}', 0, 0, 'R')

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

            # ── Premium Cover Page (shared design, distinct report type) ──
            # Deep brand band across the full width
            self.linear_gradient(0, 0, 210, 52, COLORS['header_grad_1'], COLORS['header_grad_2'], 'H')
            # Accent underline rule
            self.set_fill_color(*COLORS['accent'])
            self.rect(0, 52, 210, 2, 'F')

            # COACT.AI wordmark
            self.set_xy(14, 12)
            self.set_font('helvetica', 'B', 20)
            self.set_text_color(255, 255, 255)
            super().cell(0, 10, 'COACT.AI', 0, 0, 'L')

            # Report type badge (top right)
            badge_label = 'MENTORSHIP REPORT' if is_mentorship else 'ASSESSMENT REPORT'
            self.set_font('helvetica', 'B', 8)
            self.set_text_color(*COLORS['accent_light'])
            self.set_xy(128, 13)
            super().cell(68, 8, badge_label, 0, 0, 'R')

            # Coach tagline under wordmark
            coach_name = getattr(self, 'ai_character', 'Alex')
            self.set_xy(14, 26)
            self.set_font('helvetica', '', 10)
            self.set_text_color(147, 197, 253)
            if is_mentorship:
                super().cell(0, 5, 'Mentorship Guidance by Coach %s' % coach_name, 0, 0, 'L')
            else:
                super().cell(0, 5, 'Performance Analysis by Coach %s' % coach_name, 0, 0, 'L')

            # Report title block below the brand band
            self.set_y(64)
            self.set_font('helvetica', 'B', 22)
            self.set_text_color(*COLORS['primary'])
            self.set_x(14)
            super().cell(0, 10, 'Coaching Session Report', 0, 1)

            self.set_x(14)
            self.set_font('helvetica', '', 11)
            self.set_text_color(*COLORS['text_light'])
            if is_mentorship:
                super().cell(0, 6, 'A qualitative development and guidance summary of the mentorship conversation.', 0, 1)
            else:
                super().cell(0, 6, 'An evidence-based evaluation of participant performance during the coaching conversation.', 0, 1)

            self.ln(4)
            # Thin rule separating the title block
            self.set_draw_color(*COLORS['divider'])
            self.set_x(14)
            self.line(14, self.get_y(), 196, self.get_y())
            self.ln(7)

            # Metadata rows
            def meta_row(label, value):
                self.set_x(14)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*COLORS['secondary'])
                self.cell(42, 6, label, 0, 0)
                self.set_font('helvetica', '', 9)
                self.set_text_color(*COLORS['text_main'])
                self.cell(0, 6, value if value else '-', 0, 1)
                self.ln(1)

            meta_row('Report Type', 'Assessment Report' if not is_mentorship else 'Mentorship Report')
            if hasattr(self, 'user_name') and self.user_name:
                meta_row('Participant', self.user_name)
            if getattr(self, 'user_role', ''):
                meta_row('Role', self.user_role)
            if getattr(self, 'ai_role', ''):
                meta_row('Coach / Partner', self.ai_role)
            meta_row('Generated', dt.datetime.now().strftime('%B %d, %Y'))
            self.ln(10)
        else:
            # Slim header for subsequent pages
            self.set_fill_color(*COLORS['header_grad_1'])
            self.rect(0, 0, 210, 14, 'F')
            self.set_fill_color(*COLORS['accent'])
            self.rect(0, 14, 210, 1, 'F')
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
            self.check_space(24)
            badges_y = self.get_y() + 2

            cell_w = 61
            space = 3.5

            def _themes_text(themes):
                if isinstance(themes, list):
                    return ", ".join(sanitize_text(str(t)) for t in themes)
                return sanitize_text(str(themes))

            vals = [
                ("EMOTIONAL ARC", sanitize_text(str(emotional)), (238, 242, 255), (99, 102, 241)),
                ("SESSION QUALITY", sanitize_text(str(quality)), (236, 253, 245), (16, 185, 129)),
                ("KEY THEMES", _themes_text(themes), (253, 242, 248), (236, 72, 153)),
            ]
            # Compute lines per tile so all three boxes align with equal height
            label_h = 4
            vfont = 8.5
            self.set_font('helvetica', '', vfont)
            per_lines = []
            for name, val, bg, colr in vals:
                if not val:
                    per_lines.append(0)
                    continue
                inner_w = cell_w - 4
                width = self.get_string_width(val)
                lines = max(1, int(width / inner_w) + (1 if width % inner_w > 0 else 0))
                per_lines.append(lines)
            max_lines = max(per_lines) if any(per_lines) else 1
            box_h = label_h + 2 + max_lines * 4.5 + 3

            for idx, (name, val, bg, colr) in enumerate(vals):
                if not val:
                    continue
                bx = 10 + idx * (cell_w + space)
                self.set_fill_color(*bg)
                self.rect(bx, badges_y, cell_w, box_h, 'F')
                self.set_xy(bx + 2, badges_y + 2)
                self.set_font('helvetica', 'B', 8)
                self.set_text_color(*colr)
                self.cell(cell_w - 4, 4, name, 0, 1)
                self.set_xy(bx + 2, badges_y + label_h + 2)
                self.set_font('helvetica', '', vfont)
                self.set_text_color(*COLORS['text_main'])
                self.multi_cell(cell_w - 4, 4.5, val)

            self.set_y(badges_y + box_h + 3)
            
        actual_tmp = self.get_y()
        if actual_tmp < start_y: self.set_y(actual_tmp + 4)
        else: self.set_y(max(actual_tmp + 4, start_y + 15)) # Ensure we don't jump backwards
    
    
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

    def draw_executive_summary(self, data):
        """Render a one-page executive summary after the cover, before the detail sections."""
        meta = data.get('meta', {}) if isinstance(data, dict) else {}
        ed = data.get('executive_dashboard', {}) if isinstance(data.get('executive_dashboard'), dict) else {}
        next_steps = data.get('recommended_next_steps', []) if isinstance(data.get('recommended_next_steps'), list) else []
        timing = data.get('timing', {}) if isinstance(data.get('timing'), dict) else {}

        INDIGO = (99, 102, 241)
        EMERALD = (16, 185, 129)
        AMBER = (245, 158, 11)
        LIGHT_BG = (248, 250, 252)
        TEXT_MAIN = COLORS['text_main']
        TEXT_LIGHT = COLORS['text_light']

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

        # ---- New page for the executive summary ----
        self.add_page()

        overall = str(meta.get('overall_grade') or meta.get('overall_performance') or '')
        if '/' in overall:
            score_txt, grade_txt = overall.split('/', 1)
            score_txt = score_txt.strip() + '/10'
            grade_txt = ' / '.join(x.strip() for x in grade_txt.split('-') if x.strip())
        else:
            score_txt, grade_txt = '—', overall

        # ---- Header band ----
        summary_txt = sanitize_text(str(meta.get('summary') or ''))
        band_h = max(40, 30 + (int(len(summary_txt) / 95) + 1) * 7)
        self.set_fill_color(*(0, 24, 56))
        band_y = self.get_y()
        self.rect(0, band_y, 210, band_h, 'F')
        self.set_xy(12, band_y + 8)
        self.set_text_color(255, 255, 255)
        self.set_font('helvetica', 'B', 16)
        self.cell(0, 8, "EXECUTIVE SUMMARY", 0, 1)
        self.set_xy(12, band_y + 21)
        self.set_font('helvetica', '', 9)
        self.set_text_color(190, 210, 235)
        self.multi_cell(186, 6, summary_txt)
        self.set_y(band_y + band_h + 5)

        # ---- Score + key facts row ----
        self.check_space(50)
        self.set_fill_color(*LIGHT_BG)
        box_y = self.get_y()
        self.rect(10, box_y, 190, 46, 'F')
        # Overall score panel (left)
        self.set_fill_color(*EMERALD)
        self.rect(12, box_y + 4, 52, 38, 'F')
        self.set_xy(12, box_y + 7)
        self.set_text_color(255, 255, 255)
        self.set_font('helvetica', 'B', 16)
        self.cell(52, 10, score_txt, 0, 0, 'C')
        self.set_xy(12, box_y + 21)
        self.set_font('helvetica', 'B', 6)
        self.cell(52, 5, "OVERALL", 0, 0, 'C')
        self.set_xy(12, box_y + 27)
        self.cell(52, 5, "RATING", 0, 0, 'C')
        # Fact grid (2x2) to the right of the score panel
        facts = [
            ("Session", timing.get('duration', '')),
            ("Turns", timing.get('conversation_turns', '')),
            ("Quality", meta.get('session_quality', '')),
            ("Momentum", meta.get('emotional_trajectory', '')),
        ]
        fact_x = [72, 130]
        fact_y = [box_y + 7, box_y + 26]
        for i, (label, val) in enumerate(facts):
            xx = fact_x[i % 2]
            yy = fact_y[i // 2] if i < 4 else box_y + 7
            self.set_xy(xx, yy)
            self.set_font('helvetica', 'B', 6.5)
            self.set_text_color(*TEXT_LIGHT)
            self.cell(56, 6, label.upper(), 0, 1)
            self.set_xy(xx, self.get_y())
            self.set_font('helvetica', '', 7)
            self.set_text_color(*TEXT_MAIN)
            self.multi_cell(56, 4.5, sanitize_text(str(val)))
        self.set_y(box_y + 50)

        # ---- What was done well / opportunities ----
        strengths = ed.get('strength_areas', '')
        missed = ed.get('missed_opportunities', '')
        self.check_space(56)
        y0 = self.get_y()
        today_h = max(
            (len(str(strengths)) / 40) * 4.5,
            (len(str(missed)) / 40) * 4.5,
            34,
        ) + 14
        self.set_fill_color(*LIGHT_BG)
        self.rect(10, y0, 190, today_h, 'F')
        # divider between the two panels
        self.set_draw_color(*LIGHT_BG)
        midx = 102
        self.set_draw_color(226, 232, 240)
        self.line(midx, y0 + 4, midx, y0 + today_h - 4)
        # left panel: strengths
        self.set_xy(14, y0 + 6)
        self.set_font('helvetica', 'B', 9)
        self.set_text_color(*EMERALD)
        self.cell(84, 6, "KEY STRENGTHS", 0, 1)
        self.set_xy(14, self.get_y() + 1)
        self.set_font('helvetica', '', 8)
        self.set_text_color(*TEXT_MAIN)
        self.multi_cell(84, 4.5, sanitize_text(str(strengths)))
        # right panel: focus areas
        self.set_xy(106, y0 + 6)
        self.set_font('helvetica', 'B', 9)
        self.set_text_color(*AMBER)
        self.cell(84, 6, "PRIORITY FOCUS", 0, 1)
        self.set_xy(106, self.get_y() + 1)
        self.set_font('helvetica', '', 8)
        self.set_text_color(*TEXT_MAIN)
        self.multi_cell(84, 4.5, sanitize_text(str(missed)))
        self.set_y(y0 + today_h + 4)

        # ---- Recommended next steps ----
        if next_steps:
            self.check_space(len(next_steps) * 14 + 22)
            small_label("Recommended Next Steps", INDIGO)
            for i, step in enumerate(next_steps, 1):
                step_txt = sanitize_text(str(step))
                lines = max(1, int((len(step_txt) + 172) / 173))
                box_h = lines * 4.5 + 8
                self.check_space(box_h + 2)
                self.set_fill_color(*LIGHT_BG)
                step_y = self.get_y()
                self.rect(10, step_y, 190, box_h, 'F')
                self.set_fill_color(*INDIGO)
                self.rect(12, step_y + 2, 8, 8, 'F')
                self.set_xy(13, step_y + 3.5)
                self.set_text_color(255, 255, 255)
                self.set_font('helvetica', 'B', 7)
                self.cell(6, 5, str(i), 0, 0, 'C')
                self.set_xy(24, step_y + 3)
                self.set_text_color(*TEXT_MAIN)
                self.set_font('helvetica', '', 8.5)
                self.multi_cell(173, 4.5, step_txt)
                self.set_y(step_y + box_h + 1)
            self.ln(3)

        # Executive summary is a self-contained page: end it and start the body cleanly.
        self.add_page()

    def draw_assessment_report(self, data):
        """
        Renders the 12-section executive-style Assessment Report:
        1. Timing
        2. Conversation Snapshot
        3. Executive Dashboard
        4. Coaching Efficacy
        5. Heat Map
        6. Skill Visualization
        7. Goal Attainment
        8. Performance Scorecard
        9. Deep-Dive Analysis
        10. Strengths & Missed Opportunities
        11. Ideal Coaching Questions
        12. Action Plan
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

        def block_title(title, color):
            self.check_space(70)
            self.ln(6)
            # Numbered pill + light band for premium hierarchy
            band_y = self.get_y()
            desc_col = LIGHT_BG
            self.set_fill_color(*desc_col)
            self.rect(10, band_y, 190, 12, 'F')
            # Extract number and text
            num = title.split('.')[0].strip() if '.' in title else ''
            label = title.split('.', 1)[1].strip() if '.' in title else title
            if num:
                self.set_fill_color(*color)
                self.rect(12, band_y + 2, 8, 8, 'F')
                self.set_xy(13, band_y + 3.5)
                self.set_font('helvetica', 'B', 8)
                self.set_text_color(255, 255, 255)
                self.cell(6, 5, num, 0, 0, 'C')
                self.set_xy(24, band_y + 3)
            else:
                self.set_xy(14, band_y + 3)
            self.set_font('helvetica', 'B', 11)
            self.set_text_color(*color)
            self.cell(0, 6, label.upper(), 0, 1)
            self.set_y(band_y + 14)
            self.ln(2)
            # One-line purpose statement beneath the section header
            if title in _SEC_INTRO:
                self.set_x(12)
                self.set_font('helvetica', 'I', 8)
                self.set_text_color(*TEXT_LIGHT)
                self.multi_cell(186, 4, _SEC_INTRO[title])
                self.ln(1)

        _SEC_INTRO = {
            "1. Timing": "Session logistics and engagement scale.",
            "2. Conversation Snapshot": "The narrative arc and core intent of the coaching dialogue.",
            "3. Executive Dashboard": "A consolidated read on session quality at a glance.",
            "4. Coaching Efficacy": "Dimension-by-dimension effectiveness against the coaching rubric.",
            "5. Conversation Heat Map": "Visual intensity of key skills across the session's phases.",
            "6. Skill Visualization": "Profiled core competencies with calibrated scores.",
            "7. Goal Attainment": "Progress toward the stated objectives and evidence trail.",
            "8. Performance Scorecard": "Dimension-level proficiency with rationale and refinement paths.",
            "9. Deep-Dive Analysis": "Behavioural and emotional granularity beyond the headline scores.",
            "10. Strengths & Missed Opportunities": "What the participant did well, and where impact was left on the table.",
            "11. Ideal Coaching Questions": "High-yield questions to unlock further progress.",
            "12. Action Plan": "Prioritised, measureable next steps to convert insight into growth.",
            "13. Recommended Next Steps": "The near-term priorities drawn directly from the evidence.",
            "14. Conversation Analysis": "A granular walkthrough of the dialogue and the moments that shaped it.",
        }

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

        def bullet(text, color):
            self.set_x(15)
            self.set_font('helvetica', '', 9)
            self.set_text_color(*(color or TEXT_MAIN))
            self.multi_cell(180, 5, "• " + sanitize_text(str(text)))
            self.ln(1)

        def status_color(status):
            s = str(status or "").lower()
            if "achieved" in s and "partially" not in s:
                return EMERALD
            if "partial" in s or "needs attention" in s or "attention" in s:
                return AMBER
            return ROSE

        # Roles + scenario context (consistent with the mentorship report)
        self.draw_context_summary()

        # Executive summary (one page, runs before the 13 detail sections)
        self.draw_executive_summary(data)

        # ============================================================
        # 1. TIMING
        # ============================================================
        timing = data.get('timing', {}) if isinstance(data.get('timing'), dict) else {}
        if timing:
            block_title("1. Timing", BLUE)
            stats = [
                ("Session Duration", timing.get('duration', '')),
                ("Start Time", timing.get('start_time', '')),
                ("End Time", timing.get('end_time', '')),
                ("Conversation Turns", timing.get('conversation_turns', '')),
                ("Speaker Distribution", timing.get('speaker_distribution', '')),
            ]
            self.check_space(len(stats) * 8 + 10)
            self.set_fill_color(*LIGHT_BG)
            self.rect(10, self.get_y(), 190, len(stats) * 8 + 4, 'F')
            y = self.get_y() + 3
            for label, val in stats:
                self.set_xy(15, y)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*INDIGO)
                self.cell(65, 6, sanitize_text(str(label)))
                self.set_font('helvetica', '', 9)
                self.set_text_color(*TEXT_MAIN)
                self.cell(0, 6, sanitize_text(str(val)), 0, 1)
                y += 8
            self.set_y(self.get_y() + 8)
            divider()

        # ============================================================
        # 2. CONVERSATION SNAPSHOT
        # ============================================================
        cs = data.get('conversation_snapshot', {}) if isinstance(data.get('conversation_snapshot'), dict) else {}
        if cs:
            block_title("2. Conversation Snapshot", PURPLE)
            if cs.get('primary_topic'):
                small_label("Primary Topic", INDIGO)
                body_text(cs['primary_topic'])
                self.ln(3)
            if cs.get('key_objectives'):
                small_label("Key Objectives")
                for o in cs['key_objectives']:
                    bullet(o, TEXT_MAIN)
                self.ln(2)
            if cs.get('main_challenges'):
                small_label("Main Challenges")
                for c in cs['main_challenges']:
                    bullet(c, TEXT_MAIN)
                self.ln(2)
            if cs.get('summary'):
                small_label("Summary")
                body_text(cs['summary'])
                self.ln(3)
            divider()

        # ============================================================
        # 3. EXECUTIVE DASHBOARD (No scoring)
        # ============================================================
        ed = data.get('executive_dashboard', {}) if isinstance(data.get('executive_dashboard'), dict) else {}
        if ed:
            block_title("3. Executive Dashboard", EMERALD)
            cards = [
                ("Session Duration", ed.get('session_duration', '')),
                ("Key Themes", ed.get('key_themes', '')),
                ("Strength Areas", ed.get('strength_areas', '')),
                ("Missed Opportunities", ed.get('missed_opportunities', '')),
                ("Coaching Opportunities", ed.get('coaching_opportunities', '')),
                ("Recommended Actions", ed.get('recommended_actions', '')),
            ]
            self.check_space(40)
            col_x = [12, 82, 152]
            col_w = 66
            y = self.get_y() + 2
            for i, (label, val) in enumerate(cards):
                cx = col_x[i % 3]
                cy = y + (16 * (i // 3))
                self.set_fill_color(*LIGHT_BG)
                self.rect(cx, cy, col_w, 14, 'F')
                self.set_xy(cx + 4, cy + 1.5)
                self.set_font('helvetica', 'B', 7)
                self.set_text_color(*TEXT_LIGHT)
                self.cell(col_w - 8, 4, sanitize_text(str(label)).upper(), 0, 1)
                self.set_xy(cx + 4, cy + 6)
                self.set_font('helvetica', 'B', 13)
                self.set_text_color(*EMERALD)
                self.cell(col_w - 8, 6, sanitize_text(str(val)), 0, 1)
            self.set_y(y + 16 * 2 + 4)
            divider()

        # ============================================================
        # 4. COACHING EFFICACY
        # ============================================================
        ce = data.get('coaching_efficacy', {}) if isinstance(data.get('coaching_efficacy'), dict) else {}
        ce_dims = ce.get('dimensions', {}) if isinstance(ce.get('dimensions'), dict) else {}
        if ce_dims:
            block_title("4. Coaching Efficacy", BLUE)
            label_map = {
                'goal_alignment': 'Goal Alignment',
                'question_quality': 'Question Quality',
                'active_listening': 'Active Listening',
                'feedback_quality': 'Feedback Quality',
                'depth_of_exploration': 'Depth of Exploration',
                'actionability': 'Actionability',
                'participant_engagement': 'Participant Engagement',
            }
            for key, disp in label_map.items():
                dim = ce_dims.get(key)
                if not isinstance(dim, dict):
                    continue
                try:
                    val = float(str(dim.get('score', '0')).split('/')[0].strip())
                except (ValueError, IndexError, TypeError):
                    val = 0.0
                val = min(max(val / 10.0, 0.0), 1.0)
                evidence = str(dim.get('evidence', ''))
                reasoning = str(dim.get('reasoning', ''))
                improvement = str(dim.get('improvement', ''))
                # Compute wrapped line count for the three paragraphs (width ~182)
                widths = [
                    len("Evidence: \"" + evidence + "\""),
                    len("Why this score: " + reasoning) if reasoning else 0,
                    len("How to improve: " + improvement) if improvement else 0,
                ]
                lines = sum(max(1, int((w + 181) / 182)) for w in widths)
                body_h = lines * 4.2
                box_h = 12 + body_h
                self.check_space(box_h + 2)
                box_y = self.get_y()
                self.set_fill_color(*LIGHT_BG)
                self.rect(10, box_y, 190, box_h, 'F')
                self.set_xy(12, box_y + 2)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*TEXT_MAIN)
                self.cell(70, 6, sanitize_text(disp))
                bx = 82
                self.set_fill_color(226, 232, 240)
                self.rect(bx, self.get_y() + 1, 100, 4, 'F')
                self.set_fill_color(*BLUE)
                self.rect(bx, self.get_y() + 1, 100 * val, 4, 'F')
                self.set_xy(bx + 104, self.get_y())
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*get_bar_color(val * 10))
                self.cell(20, 6, f"{int(val * 10)}/10", 0, 1)
                if evidence:
                    self.set_x(14)
                    self.set_font('helvetica', 'I', 8)
                    self.set_text_color(*TEXT_LIGHT)
                    self.multi_cell(182, 4.2, "Evidence: \"" + sanitize_text(evidence) + "\"")
                if reasoning:
                    self.set_x(14)
                    self.set_font('helvetica', '', 8)
                    self.set_text_color(*TEXT_MAIN)
                    self.multi_cell(182, 4.2, "Why this score: " + sanitize_text(reasoning))
                if improvement:
                    self.set_x(14)
                    self.set_font('helvetica', '', 8)
                    self.set_text_color(*EMERALD)
                    self.multi_cell(182, 4.2, "How to improve: " + sanitize_text(improvement))
                self.set_y(box_y + box_h + 1)
            divider()

        # ============================================================
        # 5. HEAT MAP
        # ============================================================
        hm = data.get('heat_map', {}) if isinstance(data.get('heat_map'), dict) else {}
        hm_dims = hm.get('dimensions', []) if isinstance(hm.get('dimensions'), list) else []
        hm_segs = hm.get('segments', []) if isinstance(hm.get('segments'), list) else []
        if hm_dims and hm_segs:
            block_title("5. Conversation Heat Map", ROSE)
            self.check_space(len(hm_dims) * 7 + 20)
            # Column for segment labels
            seg_width = 30
            cell_w = 48
            total_width = seg_width + cell_w * len(hm_segs)
            x_start = 10 + (200 - total_width) / 2
            # Header row with segment labels
            self.set_xy(x_start + seg_width, self.get_y())
            self.set_font('helvetica', 'B', 8)
            self.set_text_color(*TEXT_MAIN)
            for seg in hm_segs:
                lbl = seg.get('label', '') if isinstance(seg, dict) else ''
                self.cell(cell_w, 6, sanitize_text(str(lbl))[:14], 0, 0, 'C')
            self.ln(6)
            for i, dim_label in enumerate(hm_dims):
                self.check_space(7)
                y_dim = self.get_y()
                self.set_xy(x_start, y_dim)
                self.set_font('helvetica', 'B', 7)
                self.set_text_color(*TEXT_MAIN)
                self.cell(seg_width, 4, sanitize_text(str(dim_label)))
                self.set_xy(x_start + seg_width, y_dim)
                for j, seg in enumerate(hm_segs):
                    if not isinstance(seg, dict):
                        continue
                    inten = seg.get('intensity', [])
                    val = 0
                    if isinstance(inten, list) and i < len(inten):
                        try:
                            val = int(inten[i])
                        except (TypeError, ValueError):
                            val = 0
                    val = min(max(val, 0), 10)
                    # Opacity via RGB blend toward white
                    base = (236, 72, 153)
                    col = tuple(int(base[k] * (val / 10.0) + 255 * (1 - val / 10.0)) for k in range(3))
                    self.set_fill_color(*col)
                    self.rect(self.get_x(), y_dim, cell_w, 4, 'F')
                    self.set_font('helvetica', '', 6)
                    self.set_text_color(100, 116, 139 if val < 6 else 255)
                    self.cell(cell_w, 4, str(val), 0, 0, 'C')
                self.ln(4)
            self.ln(4)
            divider()

        # ============================================================
        # 6. SKILL VISUALIZATION
        # ============================================================
        sv = data.get('skill_visualization', {}) if isinstance(data.get('skill_visualization'), dict) else {}
        if sv:
            block_title("6. Skill Visualization", INDIGO)
            group_map = [
                ("Communication", sv.get('communication', {}), BLUE),
                ("Leadership", sv.get('leadership', {}), INDIGO),
                ("Interpersonal", sv.get('interpersonal', {}), EMERALD),
            ]
            for group_name, group, gcolor in group_map:
                if not isinstance(group, dict) or not group:
                    continue
                self.check_space(len(group) * 12 + 15)
                small_label(group_name, gcolor)
                for skill_key, score in group.items():
                    try:
                        val = float(str(score).split('/')[0].strip()) / 10.0
                    except (ValueError, IndexError, TypeError):
                        val = 0.0
                    val = min(max(val, 0.0), 1.0)
                    self.set_x(15)
                    self.set_font('helvetica', '', 9)
                    self.set_text_color(*TEXT_MAIN)
                    self.cell(65, 6, sanitize_text(skill_key.replace('_', ' ').title()))
                    bx = 80
                    self.set_fill_color(226, 232, 240)
                    self.rect(bx, self.get_y() + 1.5, 90, 3.5, 'F')
                    self.set_fill_color(*gcolor)
                    self.rect(bx, self.get_y() + 1.5, 90 * val, 3.5, 'F')
                    self.set_xy(bx + 94, self.get_y())
                    self.set_font('helvetica', 'B', 9)
                    self.set_text_color(*gcolor)
                    self.cell(20, 6, f"{int(val * 10)}/10", 0, 1)
                    self.ln(2)
                self.ln(2)
            divider()

        # ============================================================
        # 7. GOAL ATTAINMENT
        # ============================================================
        ga = data.get('goal_attainment', []) if isinstance(data.get('goal_attainment'), list) else []
        if ga:
            block_title("7. Goal Attainment", EMERALD)
            for item in ga:
                if not isinstance(item, dict):
                    continue
                goal_txt = str(item.get('goal', ''))
                evidence = str(item.get('evidence', ''))
                status = str(item.get('status', ''))
                remaining = str(item.get('remaining_development', ''))
                # Estimate wrapped height for all full-width lines
                lines = 1 + max(
                    len(goal_txt) / 160,
                    len(evidence) / 160,
                    len(remaining) / 160,
                )
                self.check_space(int(lines * 5) + 30)
                box_y = self.get_y()
                self.set_fill_color(*LIGHT_BG)
                self.rect(10, box_y, 190, 26, 'F')
                self.set_xy(14, box_y + 2)
                self.set_font('helvetica', 'B', 10)
                self.set_text_color(*EMERALD)
                self.cell(150, 7, sanitize_text(goal_txt), 0, 0)
                # Status badge
                self.set_font('helvetica', 'B', 8)
                self.set_text_color(*status_color(status))
                self.cell(0, 7, status, 0, 1, 'R')
                self.set_x(14)
                self.set_font('helvetica', 'I', 8)
                self.set_text_color(*TEXT_MAIN)
                self.multi_cell(184, 4, "Evidence: " + sanitize_text(evidence))
                if remaining:
                    self.set_x(14)
                    self.set_font('helvetica', '', 8)
                    self.set_text_color(*TEXT_LIGHT)
                    self.multi_cell(184, 4, "Remaining: " + sanitize_text(remaining))
                self.set_y(box_y + 30)
                self.ln(1)
            divider()

        # ============================================================
        # 8. PERFORMANCE SCORECARD
        # ============================================================
        ps = data.get('performance_scorecard', {}) if isinstance(data.get('performance_scorecard'), dict) else {}
        ps_dims = ps.get('dimensions', []) if isinstance(ps.get('dimensions'), list) else []
        if ps_dims:
            block_title("8. Performance Scorecard", SLATE)
            for item in ps_dims:
                if not isinstance(item, dict):
                    continue
                try:
                    val = float(str(item.get('score', '0')).split('/')[0].strip())
                except (ValueError, IndexError, TypeError):
                    val = 0.0
                interp = str(item.get('interpretation', ''))
                evidence = str(item.get('evidence', ''))
                reasoning = str(item.get('reasoning', ''))
                improvement = str(item.get('improvement', ''))
                # Compute wrapped line count for all paragraphs
                widths = [
                    len(interp),
                    len("Evidence: \"" + evidence + "\""),
                    len("Why this score: " + reasoning) if reasoning else 0,
                    len("How to improve: " + improvement) if improvement else 0,
                ]
                widths = [w for w in widths if w > 0]
                lines = sum(max(1, int((w + 181) / 182)) for w in widths)
                body_h = lines * 4.2
                box_h = 12 + body_h
                self.check_space(box_h + 2)
                box_y = self.get_y()
                self.set_fill_color(*LIGHT_BG)
                self.rect(10, box_y, 190, box_h, 'F')
                self.set_xy(14, box_y + 2)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*SLATE)
                self.cell(70, 6, sanitize_text(str(item.get('dimension', ''))))
                self.set_font('helvetica', 'B', 10)
                self.set_text_color(*get_bar_color(val))
                self.cell(0, 6, f"{int(val)}/10", 0, 1, 'R')
                if interp:
                    self.set_x(14)
                    self.set_font('helvetica', 'I', 8)
                    self.set_text_color(*TEXT_LIGHT)
                    self.multi_cell(182, 4.2, sanitize_text(interp))
                if evidence:
                    self.set_x(14)
                    self.set_font('helvetica', 'I', 8)
                    self.set_text_color(*TEXT_LIGHT)
                    self.multi_cell(182, 4.2, "Evidence: \"" + sanitize_text(evidence) + "\"")
                if reasoning:
                    self.set_x(14)
                    self.set_font('helvetica', '', 8)
                    self.set_text_color(*TEXT_MAIN)
                    self.multi_cell(182, 4.2, "Why this score: " + sanitize_text(reasoning))
                if improvement:
                    self.set_x(14)
                    self.set_font('helvetica', '', 8)
                    self.set_text_color(*EMERALD)
                    self.multi_cell(182, 4.2, "How to improve: " + sanitize_text(improvement))
                self.set_y(box_y + box_h + 1)
            # Overall Performance
            overall_perf = ps.get('overall_performance', '' or data.get('meta', {}).get('overall_grade', ''))
            if overall_perf:
                self.ln(3)
                self.check_space(15)
                self.set_fill_color(*LIGHT_BG)
                self.rect(10, self.get_y(), 190, 11, 'F')
                self.set_xy(15, self.get_y() + 2)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*SLATE)
                self.cell(55, 6, "OVERALL PERFORMANCE", 0, 0)
                self.set_font('helvetica', 'B', 12)
                self.set_text_color(*EMERALD)
                self.cell(0, 6, sanitize_text(str(overall_perf)), 0, 1)
                self.set_y(self.get_y() + 11)
            scoring_meth = ps.get('scoring_methodology', '')
            if scoring_meth:
                self.ln(2)
                small_label("Scoring Methodology")
                body_text(scoring_meth)
            divider()

        # ============================================================
        # 9. DEEP-DIVE ANALYSIS
        # ============================================================
        dda = data.get('deep_dive_analysis', {}) if isinstance(data.get('deep_dive_analysis'), dict) else {}
        if dda:
            block_title("9. Deep-Dive Analysis", PURPLE)

            # 9.1 Communication Style
            comm = dda.get('communication_style', {}) if isinstance(dda.get('communication_style'), dict) else {}
            if comm:
                self.check_space(20)
                small_label("9.1 Communication Style", BLUE)
                if comm.get('observed_style'):
                    self.set_x(15)
                    self.set_font('helvetica', '', 9)
                    self.set_text_color(*TEXT_MAIN)
                    self.multi_cell(180, 5, "Observed Style: " + sanitize_text(str(comm['observed_style'])))
                comm_fields = [
                    ('Clarity', 'clarity'), ('Directness', 'directness'),
                    ('Conciseness', 'conciseness'), ('Assertiveness', 'assertiveness'),
                    ('Listening', 'listening'), ('Questioning', 'questioning'),
                    ('Adaptability', 'adaptability'),
                ]
                for disp, key in comm_fields:
                    v = comm.get(key)
                    if v:
                        self.set_x(15)
                        self.set_font('helvetica', '', 9)
                        self.set_text_color(*TEXT_MAIN)
                        self.multi_cell(180, 5, f"{disp}: " + sanitize_text(str(v)))
                if comm.get('strength'):
                    self.ln(2)
                    small_label("Strength", EMERALD)
                    body_text(comm['strength'])
                if comm.get('development_area'):
                    self.ln(1)
                    small_label("Development Area", AMBER)
                    body_text(comm['development_area'])
                self.ln(3)

            # 9.2 Behaviour Analysis
            beh = dda.get('behaviour_analysis', {}) if isinstance(dda.get('behaviour_analysis'), dict) else {}
            if beh:
                self.check_space(20)
                small_label("9.2 Behaviour Analysis", INDIGO)
                disp_map = {
                    'initiative': 'Initiative', 'accountability': 'Accountability',
                    'collaboration': 'Collaboration', 'decision_making': 'Decision-making',
                    'adaptability': 'Adaptability', 'conflict_response': 'Conflict Response',
                    'problem_solving': 'Problem-solving', 'ownership': 'Ownership',
                }
                for key, disp in disp_map.items():
                    it = beh.get(key)
                    if not isinstance(it, dict):
                        continue
                    try:
                        val = float(str(it.get('score', '0')).split('/')[0].strip())
                    except (ValueError, IndexError, TypeError):
                        val = 0.0
                    self.check_space(12)
                    self.set_x(15)
                    self.set_font('helvetica', 'B', 9)
                    self.set_text_color(*INDIGO)
                    self.cell(55, 6, sanitize_text(disp))
                    self.set_font('helvetica', '', 8)
                    self.set_text_color(*TEXT_LIGHT)
                    row_y = self.get_y()
                    evidence = str(it.get('evidence', ''))
                    self.set_xy(75, row_y)
                    self.set_font('helvetica', 'B', 8)
                    self.set_text_color(*get_bar_color(val))
                    self.cell(15, 6, f"{int(val)}/10", 0, 0)
                    self.set_xy(92, row_y)
                    self.set_font('helvetica', 'I', 8)
                    self.set_text_color(*TEXT_MAIN)
                    self.multi_cell(105, 5, sanitize_text(evidence))
                    if self.get_y() < row_y + 6:
                        self.set_y(row_y + 6)
                self.ln(2)

            # 9.3 Emotional Intelligence
            eq = dda.get('emotional_intelligence', {}) if isinstance(dda.get('emotional_intelligence'), dict) else {}
            if eq:
                self.check_space(20)
                small_label("9.3 Emotional Intelligence", PURPLE)
                disp_map = {
                    'self_awareness': 'Self-Awareness', 'self_regulation': 'Self-Regulation',
                    'empathy': 'Empathy', 'social_awareness': 'Social Awareness',
                    'relationship_management': 'Relationship Management',
                }
                for key, disp in disp_map.items():
                    it = eq.get(key)
                    if not isinstance(it, dict):
                        continue
                    try:
                        val = float(str(it.get('score', '0')).split('/')[0].strip())
                    except (ValueError, IndexError, TypeError):
                        val = 0.0
                    self.check_space(18)
                    self.ln(1)
                    self.set_x(15)
                    self.set_font('helvetica', 'B', 9)
                    self.set_text_color(*PURPLE)
                    self.cell(0, 6, f"{disp}  —  {int(val)}/10")
                    self.ln(5)
                    if it.get('evidence'):
                        self.set_x(17)
                        self.set_font('helvetica', 'I', 8)
                        self.set_text_color(*TEXT_MAIN)
                        self.multi_cell(178, 5, "Evidence: " + sanitize_text(str(it['evidence'])))
                    if it.get('improvement'):
                        self.set_x(17)
                        self.set_font('helvetica', '', 8)
                        self.set_text_color(*TEXT_LIGHT)
                        self.multi_cell(178, 5, "Improvement: " + sanitize_text(str(it['improvement'])))
                self.ln(2)
            divider()

        # ============================================================
        # 10. STRENGTHS & MISSED OPPORTUNITIES
        # ============================================================
        so = data.get('strengths_and_opportunities', {}) if isinstance(data.get('strengths_and_opportunities'), dict) else {}
        strengths = so.get('strengths', []) if isinstance(so.get('strengths'), list) else []
        missed = so.get('missed_opportunities', []) if isinstance(so.get('missed_opportunities'), list) else []
        if strengths or missed:
            block_title("10. Strengths & Missed Opportunities", AMBER)
            # Two-column layout
            self.check_space(max(len(strengths), len(missed)) * 10 + 15)
            col_left = 12
            col_right = 102
            col_w = 86
            y = self.get_y() + 2
            if strengths:
                self.set_xy(col_left, y)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*EMERALD)
                self.cell(col_w, 6, "STRENGTHS", 0, 1)
                sy = self.get_y() + 1
                for s in strengths:
                    self.set_xy(col_left, sy)
                    self.set_font('helvetica', '', 8)
                    self.set_text_color(*TEXT_MAIN)
                    sy = self.draw_wrapped_text(col_left, sy, col_w, 4, "+ " + sanitize_text(str(s)))
                    sy += 3
            if missed:
                self.set_xy(col_right, y)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*ROSE)
                self.cell(col_w, 6, "MISSED OPPORTUNITIES", 0, 1)
                my = self.get_y() + 1
                for m in missed:
                    self.set_xy(col_right, my)
                    self.set_font('helvetica', '', 8)
                    self.set_text_color(*TEXT_MAIN)
                    my = self.draw_wrapped_text(col_right, my, col_w, 4, "- " + sanitize_text(str(m)))
                    my += 3
            max_y = max(sy if strengths else y, my if missed else y)
            self.set_y(max_y + 4)
            divider()

        # ============================================================
        # 11. IDEAL COACHING QUESTIONS
        # ============================================================
        icq = data.get('ideal_coaching_questions', []) if isinstance(data.get('ideal_coaching_questions'), list) else []
        if icq:
            block_title("11. Ideal Coaching Questions", INDIGO)
            for i, q in enumerate(icq, 1):
                if not isinstance(q, dict):
                    continue
                self.check_space(25)
                self.ln(2)
                try:
                    impact_val = int(q.get('impact_score', 0) or 0)
                except (TypeError, ValueError):
                    impact_val = 0
                self.set_fill_color(*LIGHT_BG)
                self.rect(10, self.get_y(), 190, 8, 'F')
                self.set_xy(14, self.get_y() + 1)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*INDIGO)
                self.cell(160, 6, f"Question {i}")
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*get_bar_color(impact_val))
                self.cell(0, 6, f"Impact: {impact_val}/10", 0, 1, 'R')
                self.ln(1)
                self.set_x(15)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*TEXT_MAIN)
                self.multi_cell(180, 5, '"' + sanitize_text(str(q.get('question', ''))) + '"')
                if q.get('definition'):
                    self.ln(1)
                    small_label("Definition")
                    body_text(q['definition'])
                if q.get('impact'):
                    self.ln(1)
                    small_label("Impact")
                    body_text(q['impact'])
                self.ln(3)
            divider()

        # ============================================================
        # 12. ACTION PLAN
        # ============================================================
        ap = data.get('action_plan', []) if isinstance(data.get('action_plan'), list) else []
        if ap:
            block_title("12. Action Plan", EMERALD)
            for i, item in enumerate(ap, 1):
                if not isinstance(item, dict):
                    continue
                action = str(item.get('action', ''))
                why = str(item.get('why_it_matters', ''))
                success = str(item.get('success_indicator', ''))
                prio = str(item.get('priority', ''))
                lines = 1 + max(
                    len(action) / 184,
                    len(why) / 184,
                    len(success) / 184,
                )
                self.check_space(int(lines * 4) + 22)
                box_y = self.get_y()
                self.set_fill_color(*LIGHT_BG)
                self.rect(10, box_y, 190, 20, 'F')
                self.set_xy(14, box_y + 2)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*EMERALD)
                self.cell(150, 6, f"{i}. {sanitize_text(action)}", 0, 0)
                self.set_font('helvetica', 'B', 8)
                self.set_text_color(*(EMERALD if prio.lower() == 'high' else (AMBER if prio.lower() == 'medium' else TEXT_LIGHT)))
                self.cell(0, 6, prio, 0, 1, 'R')
                self.set_x(14)
                self.set_font('helvetica', '', 8)
                self.set_text_color(*TEXT_MAIN)
                if why:
                    self.multi_cell(184, 4, "Why it matters: " + sanitize_text(why))
                if success:
                    self.set_x(14)
                    self.multi_cell(184, 4, "Success indicator: " + sanitize_text(success))
                self.set_y(box_y + 20)
                self.ln(1)
            divider()

        # ============================================================
        # 13. RECOMMENDED NEXT STEPS
        # ============================================================
        nxt = data.get('recommended_next_steps', [])
        if isinstance(nxt, str):
            nxt = [nxt]
        if isinstance(nxt, list) and nxt:
            block_title("13. Recommended Next Steps", INDIGO)
            for i, step in enumerate(nxt, 1):
                self.check_space(10)
                self.set_x(15)
                self.set_font('helvetica', 'B', 9)
                self.set_text_color(*INDIGO)
                self.cell(8, 6, f"{i}.")
                self.set_font('helvetica', '', 9)
                self.set_text_color(*TEXT_MAIN)
                self.multi_cell(178, 5, sanitize_text(str(step)))
                self.ln(1)
            divider()

        # ============================================================
        # 14. CONVERSATION ANALYSIS
        # ============================================================
        ca = data.get('conversation_analysis', {}) if isinstance(data.get('conversation_analysis'), dict) else {}
        phases = ca.get('phase_breakdown', []) if isinstance(ca.get('phase_breakdown'), list) else []
        turning = ca.get('key_turning_points', []) if isinstance(ca.get('key_turning_points'), list) else []
        dynamics = ca.get('dialogue_dynamics', []) if isinstance(ca.get('dialogue_dynamics'), list) else []
        notable = ca.get('notable_moments', []) if isinstance(ca.get('notable_moments'), list) else []
        if phases or turning or dynamics or notable:
            block_title("14. Conversation Analysis", ROSE)

            if phases:
                self.ln(1)
                small_label("Phase-by-Phase Walkthrough", ROSE)
                for ph in phases:
                    if not isinstance(ph, dict):
                        continue
                    ph_name = str(ph.get('phase', ''))
                    ph_time = str(ph.get('time_range', ''))
                    ph_sum = str(ph.get('summary', ''))
                    ph_tech = str(ph.get('participant_technique', ''))
                    ph_impact = str(ph.get('impact', ''))
                    lines = sum(max(1, int((len(x) + 179) / 180)) for x in [ph_sum, ph_tech, ph_impact] if x)
                    label_rows = sum(1 for x in [ph_tech, ph_impact] if x)
                    box_h = 12 + lines * 4.6 + label_rows * 4.6
                    self.check_space(box_h + 2)
                    box_y = self.get_y()
                    self.set_fill_color(*LIGHT_BG)
                    self.rect(10, box_y, 190, box_h, 'F')
                    # phase pill header
                    self.set_fill_color(*ROSE)
                    self.rect(12, box_y + 2, 30, 7, 'F')
                    self.set_xy(12, box_y + 3)
                    self.set_font('helvetica', 'B', 7)
                    self.set_text_color(255, 255, 255)
                    self.cell(30, 5, sanitize_text(ph_name[:16]), 0, 0, 'C')
                    self.set_xy(46, box_y + 3)
                    self.set_font('helvetica', 'I', 7)
                    self.set_text_color(*TEXT_LIGHT)
                    self.cell(70, 5, sanitize_text(ph_time), 0, 1)
                    yy = box_y + 11
                    if ph_sum:
                        self.set_xy(14, yy)
                        self.set_font('helvetica', '', 8.5)
                        self.set_text_color(*TEXT_MAIN)
                        yy = self.draw_wrapped_text(14, yy, 182, 4.4, sanitize_text(ph_sum))
                        yy += 2
                    if ph_tech:
                        self.set_font('helvetica', 'B', 8)
                        self.set_text_color(*INDIGO)
                        self.set_xy(14, yy)
                        self.cell(0, 4.4, "Technique:")
                        yy += 4.4
                        self.set_font('helvetica', '', 8.5)
                        self.set_text_color(*TEXT_MAIN)
                        self.set_xy(14, yy)
                        yy = self.draw_wrapped_text(14, yy, 182, 4.4, sanitize_text(ph_tech))
                        yy += 2
                    if ph_impact:
                        self.set_font('helvetica', 'B', 8)
                        self.set_text_color(*EMERALD)
                        self.set_xy(14, yy)
                        self.cell(0, 4.4, "Impact:")
                        yy += 4.4
                        self.set_font('helvetica', '', 8.5)
                        self.set_text_color(*TEXT_MAIN)
                        self.set_xy(14, yy)
                        yy = self.draw_wrapped_text(14, yy, 182, 4.4, sanitize_text(ph_impact))
                    self.set_y(box_y + box_h + 1)
                self.ln(1)

            if turning:
                self.ln(2)
                self.check_space(30)
                small_label("Key Turning Points", INDIGO)
                for i, tp in enumerate(turning, 1):
                    if not isinstance(tp, dict):
                        continue
                    moment = str(tp.get('moment', ''))
                    happened = str(tp.get('what_happened', ''))
                    significance = str(tp.get('why_significant', ''))
                    lines = sum(max(1, int((len(x) + 175) / 176)) for x in [moment, happened, significance] if x)
                    box_h = 8 + lines * 3.8
                    self.check_space(box_h + 2)
                    box_y = self.get_y()
                    self.set_fill_color(*LIGHT_BG)
                    self.rect(10, box_y, 190, box_h, 'F')
                    self.set_fill_color(*INDIGO)
                    self.rect(12, box_y + 2, 8, 8, 'F')
                    self.set_xy(13, box_y + 3)
                    self.set_text_color(255, 255, 255)
                    self.set_font('helvetica', 'B', 7)
                    self.cell(6, 5, str(i), 0, 0, 'C')
                    self.set_xy(24, box_y + 2)
                    self.set_text_color(*INDIGO)
                    self.set_font('helvetica', 'B', 9)
                    self.draw_wrapped_text(24, box_y + 2, 173, 4.2, sanitize_text(moment))
                    yy = box_y + 7
                    if happened:
                        self.set_xy(14, yy)
                        self.set_text_color(*TEXT_MAIN)
                        self.set_font('helvetica', '', 8.5)
                        yy = self.draw_wrapped_text(14, yy, 182, 4.0, "What happened: " + sanitize_text(happened))
                        yy += 1
                    if significance:
                        self.set_xy(14, yy)
                        self.set_text_color(*EMERALD)
                        self.set_font('helvetica', '', 8.5)
                        self.draw_wrapped_text(14, yy, 182, 4.0, "Why it mattered: " + sanitize_text(significance))
                    self.set_y(box_y + box_h + 1)
                self.ln(1)

            if dynamics:
                self.ln(2)
                small_label("Dialogue Dynamics", SLATE)
                for dyn in dynamics:
                    if not isinstance(dyn, dict):
                        continue
                    dim_name = str(dyn.get('dimension', ''))
                    obs = str(dyn.get('observation', ''))
                    assess = str(dyn.get('assessment', ''))
                    lines = max(1, int((len(obs) + 150) / 151))
                    self.check_space(lines * 5 + 16)
                    y0 = self.get_y()
                    self.set_fill_color(*LIGHT_BG)
                    self.rect(10, y0, 190, lines * 5 + 14, 'F')
                    self.set_xy(14, y0 + 3)
                    self.set_font('helvetica', 'B', 9)
                    self.set_text_color(*SLATE)
                    self.draw_wrapped_text(14, y0 + 3, 120, 5, sanitize_text(dim_name))
                    # assessment badge on the right
                    self.set_font('helvetica', 'B', 8)
                    acc = str(assess).lower()
                    acol = EMERALD if acc.startswith('high') or ('/1' in assess) else (AMBER if acc.startswith('mod') else (ROSE if acc.startswith('dev') else TEXT_LIGHT))
                    self.set_text_color(*acol)
                    self.draw_wrapped_text(140, y0 + 3, 56, 5, sanitize_text(assess)[:40])
                    if obs:
                        self.set_xy(14, y0 + 9)
                        self.set_font('helvetica', '', 8.5)
                        self.set_text_color(*TEXT_MAIN)
                        self.draw_wrapped_text(14, y0 + 9, 182, 4.4, sanitize_text(obs))
                    self.set_y(y0 + lines * 5 + 16)
                self.ln(1)

            if notable:
                self.ln(2)
                small_label("Notable Moments", EMERALD)
                for nm in notable:
                    self.check_space(8)
                    self.set_x(15)
                    self.set_font('helvetica', '', 9)
                    self.set_text_color(*TEXT_MAIN)
                    bullet(sanitize_text(str(nm)), TEXT_MAIN)
                self.ln(1)
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

    # Guarantee every section exists so the PDF always renders all 14 sections,
    # even when the LLM truncated its single JSON response. This is idempotent:
    # sections the model did return are left untouched.
    session_mode = session_mode or (data if isinstance(data, dict) else {}).get('meta', {}).get('session_mode', mode)
    data = normalize_assessment_report(data, {
        "scenario_id": scenario_type,
        "outcome_status": "Completed",
        "overall_grade": "N/A",
        "summary": "Session analysis.",
        "scenario_type": scenario_type,
        "session_mode": session_mode or "skill_assessment",
    }) if session_mode != "mentorship" else data

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
    
    # 1. Banner
    meta = data.get('meta', {}) if isinstance(data, dict) else {}
    pdf.draw_banner(meta, scenario_type=scenario_type)
    
    # 2. Route to correct renderer based on session mode
    
    try:
        if session_mode == "mentorship":
            from mentorship_report import draw_mentorship_body
            draw_mentorship_body(pdf, data)
        else:
            # ALL scenarios use the Assessment renderer
            pdf.draw_assessment_report(data)

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
