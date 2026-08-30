"""
Mentorship Reflection Report Generator
=======================================
Separate module for generating observation-based mentorship reports (NO scores).
Handles both:
  - LLM prompt construction for mentorship data
  - PDF rendering of the mentorship reflection report
"""

import datetime as dt
from cli_report import (
    COLORS, DashboardPDF, sanitize_text, parse_json_robustly,
    detect_scenario_type, setup_litellm_model, report_llm,
)
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser


# ─────────────────────────────────────────────────────────────────────
# 1. LLM PROMPT & DATA GENERATION
# ─────────────────────────────────────────────────────────────────────

def build_mentorship_prompt(role, ai_role, scenario, scenario_type):
    """Return the mentorship-specific LLM instruction string."""
    return f"""
### MENTORSHIP REFLECTION REPORT (NO SCORES)
OBJECTIVE: Produce a qualitative coaching debrief that helps the participant understand what happened in this session, why the AI behaved as it did, and exactly what to do differently in the next assessed attempt. NO numerical scores anywhere.

Return JSON with this EXACT structure — every field is required:
{{
  "meta": {{
    "scenario_id": "{scenario_type}",
    "outcome_status": "Completed",
    "overall_grade": "Practice Simulation",
    "summary": "One sentence describing what this session was a first attempt at.",
    "session_mode": "mentorship",
    "scenario": "{scenario}"
  }},
  "type": "mentorship_reflection",
  "mentorship_focus": "One sentence naming the specific skill this session was designed to develop (e.g., 'Preparing for a behavioral-coaching conversation with a high-performing but disruptive team member').",
  "executive_summary": "3-4 sentences. Acknowledge this was a first attempt. Name what the participant did, what stayed at the surface, and why that matters. Tone: honest, constructive, not discouraging. Reference the AI pushback pattern if relevant.",
  "about_coactai": "CoAct.AI is an advanced simulation platform designed to provide hyper-realistic, AI-driven roleplay scenarios. It evaluates communication, behavioral patterns, and performance in critical situations. By leveraging cutting-edge AI, CoAct.AI offers objective analysis, helping professionals identify blind spots, hone their skills, and develop actionable strategies for growth.",
  "how_ai_approached": "2-3 paragraphs explaining the AI's strategy. What did the AI open with and why? What was the AI testing for? When the participant gave a vague or weak response, what did the AI do — and why was that deliberate? Use specific moments from the transcript.",
  "how_you_responded": {{
    "opening_approach": "1-2 sentences describing how the participant opened the conversation and what that signalled.",
    "handling_pushback": "1-2 sentences on what the participant did when the AI challenged or pushed back.",
    "depth_of_engagement": "1-2 sentences on whether the conversation went beyond surface-level.",
    "closing_the_conversation": "1-2 sentences on how (or whether) the participant closed with a plan or next step."
  }},
  "what_went_well": [
    "+ Specific strength observed — tied to what the participant actually said or did"
  ],
  "where_you_can_grow": [
    "- Specific gap — describe the behavior that was missing and why it matters",
    "- Specific gap 2",
    "- Specific gap 3"
  ],
  "suggested_approach_for_next_assessment": [
    {{
      "step": "Before you start",
      "instruction": "Specific preparation action the participant should take before their next attempt."
    }},
    {{
      "step": "During the conversation",
      "instruction": "Specific in-session behavior to try — include an example phrase or sentence if possible."
    }},
    {{
      "step": "To close strong",
      "instruction": "What the participant should always do before ending the conversation."
    }},
    {{
      "step": "Mindset shift",
      "instruction": "A reframe that changes how the participant approaches this type of conversation."
    }}
  ],
  "questions_to_reflect_on": [
    "Reflective question 1 — personal, scenario-specific, prompts genuine self-examination",
    "Reflective question 2",
    "Reflective question 3"
  ],
  "what_to_expect_in_next_assessment": "2-3 sentences. Tell the participant what the next graded session will focus on and what 2-3 specific behaviors will be scored. Be concrete — name the exact things to rehearse."
}}

KEY INSTRUCTIONS:
1. NO numerical scores anywhere in the output.
2. The language should feel like a mentor debrief after watching a first run-through — honest, warm, specific.
3. Use the actual transcript. Reference specific moments, phrases, and AI responses.
4. suggested_approach_for_next_assessment must include at least one example phrase or sentence the participant can actually say.
5. questions_to_reflect_on must be personal and scenario-specific — not generic coaching questions.
"""


def analyze_mentorship_report_data(transcript, role, ai_role, scenario,
                                    scenario_type=None, ai_character="alex",
                                    session_mode="mentorship"):
    """
    Generate the JSON data for a mentorship reflection report.
    Uses a single LLM call (no parallel character / question analysis).
    """
    if not scenario_type:
        scenario_type = detect_scenario_type(scenario, ai_role, role)

    meta = {
        "scenario_id": scenario_type,
        "outcome_status": "Completed",
        "overall_grade": "Practice Simulation",
        "summary": "This report summarizes key interaction patterns and learning insights from your practice simulation.",
        "scenario_type": scenario_type,
        "session_mode": "mentorship",
        "scenario": scenario,
    }

    user_msgs = [t for t in transcript if t["role"] == "user"]
    if not user_msgs:
        meta["outcome_status"] = "Not Started"
        meta["summary"] = "Session started but no interaction recorded."
        return {"meta": meta, "type": "mentorship_reflection"}

    unified_instruction = build_mentorship_prompt(role, ai_role, scenario, scenario_type)

    system_prompt = (
        f"You are {ai_character.title() if ai_character else 'a professional coach'} providing a session assessment.\n"
        f"In the conversation below, the human participant is 'USER' (Role: {role}) and the AI assistant is 'ASSISTANT' (Role: {ai_role}).\n"
        f"Your task is to analyze what the AI demonstrated so the user can learn through observation.\n"
        f"Context: {scenario}\n"
        f"\n### ANALYST STYLE: MENTORSHIP OBSERVER\n"
        f"- **Tone**: Objective, encouraging, and insight-driven.\n"
        f"- **Focus**: AI techniques, interaction patterns, and learning moments.\n"
        f"- **Evidence**: Reference specific moments and phrases from the transcript.\n"
        f"- **Language**: Observational — 'Notice how...', 'The AI demonstrated...'\n"
        f"\n{unified_instruction}\n"
        f"Assessment Criteria:\n"
        "1. GROUNDING: Use the transcript below as the sole source of truth.\n"
        "2. EVIDENCE: Include short, verbatim quotes to support your findings.\n"
        "3. DEPTH: Look for tone and subtext in the AI's choices.\n"
        "4. RESPONSE FORMAT: Provide your analysis as a single JSON object matching the requested schema.\n"
    )

    full_conversation = "\n".join(
        [f"{'USER' if t['role'] == 'user' else 'ASSISTANT'}: {t['content']}" for t in transcript]
    )

    parser = JsonOutputParser()
    prompt = PromptTemplate(
        template="{system_prompt}\n\n{format_instructions}\n\n### FULL CONVERSATION\n{conversation}",
        input_variables=["system_prompt", "conversation"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )

    try:
        chain_raw = prompt | report_llm
        raw_response = chain_raw.invoke(
            {
                "system_prompt": system_prompt,
                "conversation": full_conversation,
            },
            config={
                "run_name": "mentorship_report_generation",
                "tags": ["report", "mentorship"]
            }
        )

        content = raw_response.content if hasattr(raw_response, "content") else str(raw_response)
        if isinstance(content, str):
            json_text = content.strip()
        elif isinstance(content, list):
            json_text = "".join(str(x) for x in content).strip()
        else:
            json_text = str(content).strip()
        data = parse_json_robustly(json_text)

        if data is None:
            data = parser.parse(json_text)

        # Ensure meta is always present and correct
        if "meta" not in data:
            data["meta"] = {}
        data["meta"]["scenario_type"] = scenario_type
        data["meta"]["session_mode"] = "mentorship"
        if "type" not in data:
            data["type"] = "mentorship_reflection"

        return data

    except Exception as e:
        print(f"[ERROR] Mentorship report generation failed: {e}")
        return {"meta": meta, "type": "mentorship_reflection", "error": str(e)}


# ─────────────────────────────────────────────────────────────────────
# 2. PDF RENDERING  (operates on a DashboardPDF instance)
# ─────────────────────────────────────────────────────────────────────

# Color palette shared across sections
_SLATE  = (30, 41, 59)
_EMERALD = (16, 185, 129)
_BLUE   = (59, 130, 246)
_AMBER  = (245, 158, 11)
_INDIGO = (99, 102, 241)
_PURPLE = (168, 85, 247)
_TEAL   = (20, 184, 166)
_LIGHT_BG = (248, 250, 252)
_TEXT_MAIN  = COLORS["text_main"]
_TEXT_LIGHT = COLORS["text_light"]
_WHITE  = (255, 255, 255)

_CONTENT_LEFT  = 12
_CONTENT_WIDTH = 186
_BULLET_X      = 16
_BULLET_TEXT_X = 22
_BULLET_TEXT_W = 174


def _section_title(pdf, title, color):
    """Colored accent bar + section heading."""
    pdf.check_space(20)
    pdf.ln(8)
    pdf.set_fill_color(*color)
    pdf.rect(10, pdf.get_y(), 3, 10, "F")
    pdf.set_xy(16, pdf.get_y() + 1.5)
    pdf.set_font("helvetica", "B", 12)
    pdf.set_text_color(*color)
    FPDF_cell(pdf, 0, 7, title, 0, 1)
    pdf.ln(3)


def _sub_label(pdf, text, color=None):
    pdf.check_space(10)
    pdf.set_x(_CONTENT_LEFT)
    pdf.set_font("helvetica", "B", 8.5)
    pdf.set_text_color(*(color or _TEXT_LIGHT))
    FPDF_cell(pdf, 0, 5, text.upper(), 0, 1)
    pdf.ln(1)


def _bullet_item(pdf, text, icon=None, icon_color=None):
    pdf.check_space(8)
    if icon and icon_color:
        pdf.set_xy(_BULLET_X, pdf.get_y())
        pdf.set_font("helvetica", "B", 9)
        pdf.set_text_color(*icon_color)
        FPDF_cell(pdf, 6, 5, icon, 0, 0)
    else:
        pdf.set_xy(_BULLET_X, pdf.get_y())
        pdf.set_font("helvetica", "", 9)
        pdf.set_text_color(*_TEXT_LIGHT)
        FPDF_cell(pdf, 6, 5, "-", 0, 0)
    pdf.set_font("helvetica", "", 9)
    pdf.set_text_color(*_TEXT_MAIN)
    y = pdf.draw_wrapped_text(_BULLET_TEXT_X, pdf.get_y(), _BULLET_TEXT_W, 5, str(text))
    pdf.set_y(y + 1)


def _divider(pdf):
    pdf.ln(4)
    pdf.set_draw_color(*COLORS["divider"])
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(4)


def FPDF_cell(pdf, *args, **kwargs):
    """Call the base FPDF.cell to bypass DashboardPDF overrides."""
    super(DashboardPDF, pdf).cell(*args, **kwargs)


# ── Cover page (called from DashboardPDF.header) ─────────────────

def draw_mentorship_cover(pdf):
    """Draw the mentorship-specific cover page.
    Called inside DashboardPDF.header() when session_mode == 'mentorship'.
    """
    pdf.linear_gradient(0, 0, 210, 55, (15, 23, 42), (30, 58, 95), "H")

    # Title
    pdf.set_xy(10, 8)
    pdf.set_font("helvetica", "B", 22)
    pdf.set_text_color(255, 255, 255)
    FPDF_cell(pdf, 0, 10, "Mentorship Reflection Report", 0, 0, "L")

    # Platform
    pdf.set_xy(10, 20)
    pdf.set_font("helvetica", "", 10)
    pdf.set_text_color(147, 197, 253)
    FPDF_cell(pdf, 60, 5, "COACT.AI", 0, 0, "L")

    # Mode badge
    pdf.set_xy(10, 27)
    pdf.set_font("helvetica", "B", 9)
    pdf.set_text_color(16, 185, 129)
    FPDF_cell(pdf, 60, 5, "Mode: Practice Simulation", 0, 0, "L")

    # Scenario (right side)
    scenario_txt = getattr(pdf, "scenario_text", "")
    if scenario_txt:
        text = str(scenario_txt).replace("CONTEXT:", "").replace("Situation:", "").strip()
        for marker in ["AI BEHAVIOR:", "AI ROLE:", "USER ROLE:", "SCENARIO:"]:
            if marker in text:
                text = text.split(marker)[0].strip()
        
        pdf.set_xy(80, 20)
        pdf.set_font("helvetica", "", 9)
        pdf.set_text_color(200, 220, 255)
        label = text if len(text) <= 60 else text[:57] + "..."
        FPDF_cell(pdf, 120, 5, f"Scenario: {label}", 0, 0, "R")

    # Participant name
    if hasattr(pdf, "user_name") and pdf.user_name:
        pdf.set_xy(80, 27)
        pdf.set_font("helvetica", "I", 9)
        pdf.set_text_color(200, 220, 255)
        FPDF_cell(pdf, 120, 5, f"Participant: {pdf.user_name}", 0, 0, "R")

    # Date
    pdf.set_xy(80, 34)
    pdf.set_font("helvetica", "", 9)
    pdf.set_text_color(200, 220, 255)
    FPDF_cell(pdf, 120, 5, dt.datetime.now().strftime("%B %d, %Y"), 0, 0, "R")

    # Tagline
    pdf.set_xy(10, 42)
    pdf.set_font("helvetica", "I", 8)
    pdf.set_text_color(148, 163, 184)
    FPDF_cell(
        pdf, 0, 5,
        "This report summarizes key interaction patterns and learning insights from your practice simulation.",
        0, 0, "L",
    )
    pdf.ln(50)


# ── Body sections ────────────────────────────────────────────────

def draw_mentorship_body(pdf, data):
    """
    Renders the Mentorship Report focusing on development, mentoring, and role progression.
    NO numerical scores are included.
    """
    SLATE = (30, 41, 59)
    EMERALD = (16, 185, 129)
    BLUE = (59, 130, 246)
    AMBER = (245, 158, 11)
    INDIGO = (99, 102, 241)
    PURPLE = (168, 85, 247)
    ROSE = (244, 63, 94)
    TEAL = (20, 184, 166)
    LIGHT_BG = (248, 250, 252)
    TEXT_MAIN = _TEXT_MAIN
    TEXT_LIGHT = _TEXT_LIGHT
    CONTENT_LEFT = _CONTENT_LEFT
    CONTENT_WIDTH = _CONTENT_WIDTH

    def block_title(title, color):
        pdf.check_space(18)
        pdf.ln(6)
        pdf.set_fill_color(*color)
        pdf.rect(10, pdf.get_y(), 3, 9, 'F')
        pdf.set_xy(16, pdf.get_y() + 1)
        pdf.set_font('helvetica', 'B', 11)
        pdf.set_text_color(*color)
        pdf.cell(0, 7, title.upper(), 0, 1)
        pdf.ln(2)

    def small_label(text, color=None):
        pdf.set_x(12)
        pdf.set_font('helvetica', 'B', 8)
        pdf.set_text_color(*(color or TEXT_LIGHT))
        pdf.cell(0, 5, text.upper(), 0, 1)

    def body_text(text):
        pdf.set_x(12)
        pdf.set_font('helvetica', '', 9)
        pdf.set_text_color(*TEXT_MAIN)
        pdf.multi_cell(186, 5, sanitize_text(str(text)))

    def divider():
        pdf.ln(4)
        pdf.set_draw_color(226, 232, 240)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(3)

    # 1. Session Overview
    conv_snapshot = data.get('conversation_snapshot', {})
    if conv_snapshot.get('conversation_flow_overview'):
        block_title("1. Session Overview", BLUE)
        body_text(conv_snapshot['conversation_flow_overview'])
        divider()

    # 2. Response Strategies
    strategies = data.get('ai_response_strategy_observed', [])
    if strategies:
        block_title("2. Response Strategies", EMERALD)
        for s in strategies:
            pdf.set_x(15)
            pdf.set_font('helvetica', '', 9)
            pdf.set_text_color(*TEXT_MAIN)
            pdf.multi_cell(180, 5, "• " + sanitize_text(str(s)))
        divider()

    # 3. Questioning Techniques
    techniques = data.get('questioning_techniques_used_by_ai', [])
    if techniques:
        block_title("3. Questioning Techniques", PURPLE)
        for t in techniques:
            pdf.set_x(15)
            pdf.set_font('helvetica', '', 9)
            pdf.set_text_color(*TEXT_MAIN)
            pdf.multi_cell(180, 5, "• " + sanitize_text(str(t)))
        divider()

    # 4. Emotional Handling Patterns
    patterns = data.get('emotional_handling_patterns', [])
    if patterns:
        block_title("4. Emotional Handling Patterns", ROSE)
        for p in patterns:
            pdf.set_x(15)
            pdf.set_font('helvetica', '', 9)
            pdf.set_text_color(*TEXT_MAIN)
            pdf.multi_cell(180, 5, "• " + sanitize_text(str(p)))
        divider()

    # 5. Key Turning Points
    turning_points = data.get('turning_points', [])
    if turning_points:
        block_title("5. Key Turning Points", AMBER)
        for tp in turning_points:
            small_label(f"Point {tp.get('point_number', '')}: {tp.get('title', '')}", AMBER)
            body_text(tp.get('description', ''))
            pdf.ln(1)
            pdf.set_x(12)
            pdf.set_font('helvetica', 'I', 9)
            pdf.set_text_color(*TEXT_LIGHT)
            pdf.multi_cell(186, 5, "Technique & Impact:")
            pdf.set_x(12)
            pdf.set_font('helvetica', '', 9)
            pdf.set_text_color(*TEXT_MAIN)
            impact_text = f"{sanitize_text(str(tp.get('ai_technique_used', '')))} - {sanitize_text(str(tp.get('impact', '')))}"
            pdf.multi_cell(186, 5, impact_text)
            pdf.ln(3)
        divider()

    # 6. Phrases Demonstrated
    phrases = data.get('example_phrases_demonstrated', [])
    if phrases:
        block_title("6. Phrases Demonstrated", TEAL)
        for p in phrases:
            pdf.set_x(12)
            pdf.set_font('helvetica', 'B', 9)
            pdf.set_text_color(*TEXT_MAIN)
            pdf.multi_cell(186, 5, '"' + sanitize_text(str(p.get('phrase', ''))) + '"')
            pdf.ln(1)
            pdf.set_x(15)
            pdf.set_font('helvetica', 'I', 8)
            pdf.set_text_color(*TEXT_LIGHT)
            pdf.multi_cell(180, 5, f"Context: {sanitize_text(str(p.get('context', '')))} | Technique: {sanitize_text(str(p.get('technique', '')))}")
            pdf.ln(3)
        divider()

    # 7. Takeaways to Practice
    takeaways = data.get('learning_takeaways', {}).get('what_you_can_observe_and_practice', [])
    if takeaways:
        block_title("7. Takeaways to Practice", BLUE)
        for t in takeaways:
            pdf.set_x(15)
            pdf.set_font('helvetica', '', 9)
            pdf.set_text_color(*TEXT_MAIN)
            pdf.multi_cell(180, 5, "• " + sanitize_text(str(t)))
        divider()

    # 8. Alternative Pathways
    alt_pathways = data.get('alternative_pathways', {})
    alternatives = alt_pathways.get('alternatives', []) if isinstance(alt_pathways, dict) else (alt_pathways if isinstance(alt_pathways, list) else [])
    if alternatives:
        block_title("8. Alternative Pathways", INDIGO)
        if isinstance(alt_pathways, dict) and alt_pathways.get('note'):
            body_text(alt_pathways['note'])
            pdf.ln(1)
        for a in alternatives:
            pdf.set_x(15)
            pdf.set_font('helvetica', '', 9)
            pdf.set_text_color(*TEXT_MAIN)
            pdf.multi_cell(180, 5, "• " + sanitize_text(str(a)))
        divider()

    # 9. Reflection Prompts
    prompts = data.get('closing_reflection_prompts', [])
    if prompts:
        block_title("9. Reflection Prompts", SLATE)
        body_text("The participant may consider:")
        pdf.ln(1)
        for p in prompts:
            pdf.set_x(15)
            pdf.set_font('helvetica', '', 9)
            pdf.set_text_color(*TEXT_MAIN)
            pdf.multi_cell(180, 5, "? " + sanitize_text(str(p)))
        divider()

# 3. PUBLIC ENTRY POINT
# ─────────────────────────────────────────────────────────────────────

def generate_mentorship_report(transcript, role, ai_role, scenario,
                                filename="mentorship_report.pdf",
                                precomputed_data=None, scenario_type=None,
                                user_name="Valued User", ai_character="alex"):
    """
    Top-level function: analyse transcript → render mentorship PDF.
    Can also accept precomputed JSON data to skip the LLM call.
    """
    if not scenario_type:
        scenario_type = detect_scenario_type(scenario, ai_role, role)

    print(f"[MENTORSHIP] Generating report (scenario: {scenario_type}) for {user_name}...")

    # 1. Data
    if precomputed_data:
        data = precomputed_data
        if "scenario_type" not in data:
            data["scenario_type"] = scenario_type
    else:
        data = analyze_mentorship_report_data(
            transcript, role, ai_role, scenario,
            scenario_type=scenario_type, ai_character=ai_character,
        )

    # Sanitize
    def _sanitize(obj):
        if isinstance(obj, str):
            return sanitize_text(obj)
        if isinstance(obj, dict):
            return {k: _sanitize(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [_sanitize(i) for i in obj]
        return obj

    data = _sanitize(data)

    # 2. Build PDF
    pdf = DashboardPDF()
    pdf.set_scenario_type(scenario_type)
    pdf.set_user_name(user_name)
    pdf.set_character(ai_character)
    pdf.set_context(role, ai_role, scenario)
    pdf._session_mode = "mentorship"

    pdf.add_page()   # triggers header() → mentorship cover

    # Body
    draw_mentorship_body(pdf, data)

    # Transcript
    if transcript:
        pdf.draw_transcript(transcript)

    pdf.output(filename)
    print(f"[MENTORSHIP] Report saved: {filename}")
    return data
