"""
Mentorship Reflection Report Generator
=======================================
Separate module for generating observation-based mentorship reports (NO scores).
Handles both:
  - LLM prompt construction for mentorship data
  - PDF rendering of the mentorship reflection report
"""

from cli_report import (
    COLORS,
    REPORT_MODEL_NAME,
    DashboardPDF,
    detect_scenario_type,
    parse_json_robustly,
    report_llm,
    sanitize_text,
)
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate

# ─────────────────────────────────────────────────────────────────────
# 1. LLM PROMPT & DATA GENERATION
# ─────────────────────────────────────────────────────────────────────

def build_mentorship_prompt(role, ai_role, scenario, scenario_type):
    """Return the mentorship-specific LLM instruction string."""
    return f"""
### COACTAI — MENTORSHIP REPORT (COMPLETELY QUALITATIVE, NO SCORES)
OBJECTIVE: Produce a qualitative mentor's development summary of this mentorship session. It should feel like a mentor's written summary after a coaching conversation — guidance, development, and continuity — NOT an assessment. NO scores, NO marks, NO ratings, NO performance scorecard, NO heat-map scoring, NO impact scores, NO ranking, NO pass/fail anywhere.

Return JSON with this EXACT structure — every field is required:
{{
  "meta": {{
    "scenario_id": "{scenario_type}",
    "outcome_status": "Completed",
    "overall_grade": "Practice Simulation",
    "summary": "One sentence describing what this mentorship session was about.",
    "session_mode": "mentorship",
    "scenario": "{scenario}"
  }},
  "type": "mentorship_report",
  "timing": {{
    "duration": "X min X sec",
    "start_time": "X:XX AM/PM",
    "end_time": "X:XX AM/PM"
  }},
  "conversation_snapshot": {{
    "primary_topic": "The main topic discussed in this session",
    "main_objective": "The main objective the mentee brought into this session",
    "key_topics": ["Topic 1", "Topic 2", "Topic 3"],
    "summary": "2-3 sentence overall summary of the conversation"
  }},
  "conversation_analysis": {{
    "phase_breakdown": [
      {{
        "phase": "Opening",
        "time_range": "0-3 min",
        "summary": "What happened in this phase of the conversation",
        "participant_technique": "A technique the mentee used in this phase",
        "impact": "How this influenced the direction of the conversation"
      }}
    ],
    "key_turning_points": [
      {{
        "moment": "A single pivotal exchange in the conversation",
        "what_happened": "What the mentee said or did at this moment",
        "why_significant": "Why this mattered for the conversation"
      }}
    ],
    "dialogue_dynamics": [
      {{
        "dimension": "Balance of Talk Time / Questioning / Active Listening / Tone",
        "observation": "Observation of the mentee's behaviour in this dimension",
        "assessment": "QUALITATIVE label ONLY (High / Moderate / Developing) — never a number"
      }}
    ],
    "notable_moments": [
      "A concrete, high-impact moment or exchange worth flagging",
      "Another notable moment"
    ]
  }},
  "executive_dashboard": {{
    "main_goal": "The mentee's primary goal for this session",
    "topics_discussed": ["Topic 1", "Topic 2"],
    "key_insights": ["Key insight 1", "Key insight 2", "Key insight 3"],
    "development_areas": ["Development area 1", "Development area 2"],
    "key_actions": ["Action 1", "Action 2"]
  }},
  "mentorship_focus": "One sentence naming the primary focus of the mentorship session (e.g., Career Development, Leadership Development, Technical Growth, Communication, Personal Development, Decision Making — or a specific skill).",
  "goal_progress": [
    {{
      "goal": "The goal discussed",
      "progress_observed": "Describe the progress observed during the session",
      "current_situation": "Describe the mentee's current situation",
      "what_remains": "What still remains to be addressed",
      "evidence": "Exact verbatim [MENTEE] quote from the transcript that supports the observation",
      "improvement": "Qualitative, encouraging guidance on how the mentee can keep building on this goal"
    }}
  ],
  "skill_development": [
    {{
      "skill": "The skill discussed or developed",
      "current_observation": "Observation of the mentee's current level",
      "development_direction": "The direction to develop this skill",
      "evidence": "Exact verbatim [MENTEE] quote from the transcript that supports the observation",
      "improvement": "Qualitative, specific suggestion for building this skill — no scores"
    }}
  ],
  "mentor_guidance": {{
    "advice_given": ["Advice 1", "Advice 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "explanations": ["Explanation 1", "Explanation 2"],
    "examples_provided": ["Example 1", "Example 2"],
    "resources_suggested": ["Resource 1", "Resource 2"],
    "additional_guidance_needed": ["Area where more guidance would help"]
  }},
  "mentee_reflection": {{
    "concerns_expressed": ["Concern 1", "Concern 2"],
    "challenges_identified": ["Challenge 1", "Challenge 2"],
    "self_reflections": ["Reflection 1", "Reflection 2"],
    "questions_raised": ["Question 1", "Question 2"],
    "areas_of_uncertainty": ["Uncertainty 1", "Uncertainty 2"],
    "key_realizations": ["Realization 1", "Realization 2"]
  }},
  "strengths_and_development": {{
    "strengths": ["Strength 1 — positive capability observed", "Strength 2"],
    "development_opportunities": ["Opportunity 1 — skill/knowledge to develop", "Opportunity 2"]
  }},
  "key_insights": [
    "Concise, evidence-based insight from the conversation"
  ],
  "recommended_mentorship_questions": [
    "Question to ask in the next session (e.g., 'What progress have you made since our last discussion?')",
    "Second recommended question",
    "Third recommended question"
  ],
  "action_plan": [
    {{
      "action": "Action the mentee agreed to take",
      "purpose": "Why this action matters",
      "expected_outcome": "The expected result of taking this action",
      "priority": "High"
    }}
  ],
  "next_mentorship_focus": {{
    "progress_review": "What progress should be reviewed in the next session",
    "unresolved_challenges": "Unresolved challenges to revisit",
    "new_development_areas": "New development areas to explore",
    "follow_up_on_previous_actions": "Which previous actions need follow-up",
    "next_milestone": "The next milestone the mentee wants to achieve"
  }}
}}

KEY INSTRUCTIONS:
1. COMPLETELY QUALITATIVE. NO numerical scores, marks, ratings, percentages, rankings, or pass/fail anywhere in the output. Use descriptive, encouraging, mentor-style language.
2. The report must feel like a mentor's development summary — guidance, reflection, and continuity — not a graded assessment.
3. Use the actual transcript. Reference specific moments, phrases, and topics discussed.
4. mentor_guidance must reflect what the MENTOR (AI character, role "{ai_role}") actually advised — quote or paraphrase their advice.
5. mentee_reflection must reflect the MENTEE's (human, role "{role}") own words, concerns, and realizations — quote where possible.
6. recommended_mentorship_questions must be useful questions for the NEXT mentorship conversation.
7. action_plan must include NO owner and NO score — only action, purpose, expected outcome, and priority (priority MUST be one of exactly "High", "Medium", "Low"). No numerical rating of priority.
8. Keep every section concise, specific, and evidence-based.
9. PROOF FOR EVERY OBSERVATION: Every goal_progress and skill_development entry MUST include (a) "evidence" = an exact verbatim [MENTEE] quote that supports the observation, and (b) "improvement" = qualitative, encouraging, actionable guidance. Never leave these blank.
10. CONTENT INTELLIGENCE: Analyze the actual conversation. Do not invent behaviours, emotions, goals, skills, challenges, or outcomes. Quote the mentee's real words.
11. NO REPETITION: Never repeat the same observation verbatim across sections. Each section delivers a different layer: Context → Development → Guidance → Reflection → Insights → Action → Next Session.
12. PROFESSIONAL LANGUAGE: Use framing such as "The conversation indicates...", "A recurring theme was...", "An opportunity for development is...", "The discussion demonstrated evidence of...". Avoid "The AI thinks", "The mentor believes", "You did a great job", "This was amazing".
13. ENTERPRISE TONE: Write like a senior leadership/development consultant producing an internal progress note — measured, specific, encouraging but not effusive. Refer to the participant as "the mentee", not "you". Do NOT address the mentee in the second person. If evidence is insufficient, use exactly: "Insufficient evidence from the conversation."
14. conversation_analysis MUST be COMPLETELY QUALITATIVE and trace the actual dialogue: phase_breakdown (2-4 phases) shows what happened and the mentee's technique and its impact; key_turning_points (1-3) names pivotal exchanges and why they mattered; dialogue_dynamics (2-4 dimensions such as talk-time balance, questioning quality, active listening, tone) uses ONLY qualitative labels ("High", "Moderate", "Developing") for assessment — NEVER a number, "/10", or rating; notable_moments (1-3) flags concrete exchanges. This section must trace the ARC of the conversation, not repeat observations from other sections.
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
        return {"meta": meta, "type": "mentorship_report"}

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

        from services.usage import record_chain_usage
        record_chain_usage(raw_response, REPORT_MODEL_NAME, messages=system_prompt + "\n" + full_conversation, output_text=json_text)
        data = parse_json_robustly(json_text)

        if data is None:
            data = parser.parse(json_text)

        # Ensure meta is always present and correct
        if "meta" not in data:
            data["meta"] = {}
        data["meta"]["scenario_type"] = scenario_type
        data["meta"]["session_mode"] = "mentorship"
        if "type" not in data:
            data["type"] = "mentorship_report"

        return data

    except Exception as e:
        print(f"[ERROR] Mentorship report generation failed: {e}")
        return {"meta": meta, "type": "mentorship_report", "error": str(e)}


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

# ── Body sections ────────────────────────────────────────────────

def draw_mentorship_body(pdf, data):
    """
    Renders the Mentorship Report — a qualitative mentor's development summary.
    NO numerical scores, marks, ratings, or scorecards anywhere.
    """
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

    # Roles + scenario context (same design as the assessment report)
    pdf.draw_context_summary()

    def block_title(title, color):
        pdf.check_space(70)
        pdf.ln(6)
        band_y = pdf.get_y()
        pdf.set_fill_color(*LIGHT_BG)
        pdf.rect(10, band_y, 190, 12, 'F')
        num = title.split('.')[0].strip() if '.' in title else ''
        label = title.split('.', 1)[1].strip() if '.' in title else title
        if num:
            pdf.set_fill_color(*color)
            pdf.rect(12, band_y + 2, 8, 8, 'F')
            pdf.set_xy(13, band_y + 3.5)
            pdf.set_font('helvetica', 'B', 8)
            pdf.set_text_color(255, 255, 255)
            pdf.cell(6, 5, num, 0, 0, 'C')
            pdf.set_xy(24, band_y + 3)
        else:
            pdf.set_xy(14, band_y + 3)
        pdf.set_font('helvetica', 'B', 11)
        pdf.set_text_color(*color)
        pdf.cell(0, 6, label.upper(), 0, 1)
        pdf.set_y(band_y + 14)
        pdf.ln(2)
        # One-line purpose statement beneath the section header
        if title in _SEC_INTRO:
            pdf.set_x(12)
            pdf.set_font('helvetica', 'I', 8)
            pdf.set_text_color(*TEXT_LIGHT)
            pdf.multi_cell(186, 4, _SEC_INTRO[title])
            pdf.ln(1)

    _SEC_INTRO = {
        "1. Timing": "Session logistics and engagement scale.",
        "2. Conversation Snapshot": "The narrative arc and core intent of the mentorship dialogue.",
        "3. Executive Dashboard": "A consolidated read on the quality of the mentorship session.",
        "4. Mentorship Focus": "The development area the session was designed around.",
        "5. Goal Progress": "Traction on the mentee's goals, with observed evidence.",
        "6. Skill Development": "Competencies being built and how to accelerate them.",
        "7. Mentor Guidance": "The guidance provided and its developmental impact.",
        "8. Mentee Reflection": "The mentee's own perspective on the session and growth.",
        "9. Strengths & Development Opportunities": "Emerging strengths and focus areas, framed qualitatively.",
        "10. Key Insights": "The most material takeaways from the conversation.",
        "11. Recommended Mentorship Questions": "Questions to deepen reflection and ownership.",
        "12. Action Plan": "Prioritised next steps to convert insight into growth.",
"13. Next Mentorship Focus": "Where the relationship should direct its attention next.",
        "14. Conversation Analysis": "A granular walkthrough of the dialogue and the moments that shaped it.",
    }

    def small_label(text, color=None):
        pdf.set_x(12)
        pdf.set_font('helvetica', 'B', 8)
        pdf.set_text_color(*(color or TEXT_LIGHT))
        pdf.cell(0, 5, text.upper(), 0, 1)
        pdf.ln(1)

    def body_text(text):
        pdf.set_x(12)
        pdf.set_font('helvetica', '', 9)
        pdf.set_text_color(*TEXT_MAIN)
        pdf.multi_cell(186, 5, sanitize_text(str(text)))

    def bullet(text, color=None):
        pdf.set_x(15)
        pdf.set_font('helvetica', '', 9)
        pdf.set_text_color(*(color or TEXT_MAIN))
        pdf.multi_cell(180, 5, "• " + sanitize_text(str(text)))
        pdf.ln(1)

    def divider():
        pdf.ln(4)
        pdf.set_draw_color(226, 232, 240)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(3)

    # 1. Timing
    timing = data.get('timing', {}) if isinstance(data.get('timing'), dict) else {}
    if timing:
        block_title("1. Timing", BLUE)
        pdf.set_fill_color(*LIGHT_BG)
        pdf.rect(10, pdf.get_y(), 190, 34, 'F')
        y = pdf.get_y() + 4
        for label, key in [("Session Duration", "duration"), ("Start Time", "start_time"), ("End Time", "end_time")]:
            val = timing.get(key, '')
            if not val:
                continue
            pdf.set_xy(15, y)
            pdf.set_font('helvetica', 'B', 9)
            pdf.set_text_color(*INDIGO)
            pdf.cell(65, 6, sanitize_text(str(label)))
            pdf.set_font('helvetica', '', 9)
            pdf.set_text_color(*TEXT_MAIN)
            pdf.cell(0, 6, sanitize_text(str(val)), 0, 1)
            y += 8
        pdf.set_y(y + 4)
        divider()

    # 2. Conversation Snapshot
    cs = data.get('conversation_snapshot', {}) if isinstance(data.get('conversation_snapshot'), dict) else {}
    if cs:
        block_title("2. Conversation Snapshot", PURPLE)
        if cs.get('primary_topic'):
            small_label("What Was Discussed", INDIGO)
            body_text(cs['primary_topic'])
            pdf.ln(2)
        if cs.get('main_objective'):
            small_label("Main Objective", INDIGO)
            body_text(cs['main_objective'])
            pdf.ln(2)
        topics = cs.get('key_topics', [])
        if topics:
            small_label("Key Topics Covered", INDIGO)
            for t in topics:
                bullet(t)
            pdf.ln(2)
        if cs.get('summary'):
            small_label("Overall Summary")
            body_text(cs['summary'])
        divider()

    # 3. Executive Dashboard (no scores)
    ed = data.get('executive_dashboard', {}) if isinstance(data.get('executive_dashboard'), dict) else {}
    if ed:
        block_title("3. Executive Dashboard", EMERALD)
        if ed.get('main_goal'):
            small_label("Main Goal", EMERALD)
            body_text(ed['main_goal'])
            pdf.ln(2)
        defined_labels = [
            ("Topics Discussed", "topics_discussed", TEXT_MAIN),
            ("Key Insights", "key_insights", TEXT_MAIN),
            ("Development Areas", "development_areas", TEXT_MAIN),
            ("Key Actions", "key_actions", TEXT_MAIN),
        ]
        for label, key, color in defined_labels:
            items = ed.get(key, [])
            if items:
                small_label(label, color)
                for it in (items if isinstance(items, list) else [items]):
                    bullet(it)
                pdf.ln(2)
        divider()

    # 4. Mentorship Focus
    focus = data.get('mentorship_focus', '')
    if focus:
        block_title("4. Mentorship Focus", BLUE)
        body_text(focus)
        divider()

    # 5. Goal Progress
    goal_progress = data.get('goal_progress', [])
    if isinstance(goal_progress, dict):
        goal_progress = [goal_progress]
    if isinstance(goal_progress, list) and goal_progress:
        block_title("5. Goal Progress", EMERALD)
        for gp in goal_progress:
            if not isinstance(gp, dict):
                continue
            pdf.check_space(20)
            if gp.get('goal'):
                small_label("Goal Discussed", EMERALD)
                body_text(gp['goal'])
            if gp.get('progress_observed'):
                small_label("Progress Observed")
                body_text(gp['progress_observed'])
            if gp.get('current_situation'):
                small_label("Current Situation")
                body_text(gp['current_situation'])
            if gp.get('what_remains'):
                small_label("What Remains to Address")
                body_text(gp['what_remains'])
            if gp.get('evidence'):
                small_label("Evidence from the Mentee", INDIGO)
                pdf.set_x(15)
                pdf.set_font('helvetica', 'I', 8)
                pdf.set_text_color(*TEXT_LIGHT)
                pdf.multi_cell(184, 5, '"' + sanitize_text(str(gp['evidence'])) + '"')
                pdf.ln(1)
            if gp.get('improvement'):
                small_label("How to Build on This", EMERALD)
                pdf.set_x(15)
                pdf.set_font('helvetica', '', 8)
                pdf.set_text_color(*EMERALD)
                pdf.multi_cell(184, 5, sanitize_text(str(gp['improvement'])))
                pdf.ln(1)
            pdf.ln(3)
        divider()

    # 6. Skill Development
    skills = data.get('skill_development', [])
    if isinstance(skills, dict):
        skills = [skills]
    if isinstance(skills, list) and skills:
        block_title("6. Skill Development", PURPLE)
        for sk in skills:
            if not isinstance(sk, dict):
                continue
            pdf.check_space(20)
            if sk.get('skill'):
                small_label("Skill", PURPLE)
                body_text(sk['skill'])
            if sk.get('current_observation'):
                small_label("Current Observation")
                body_text(sk['current_observation'])
            if sk.get('development_direction'):
                small_label("Development Direction", EMERALD)
                body_text(sk['development_direction'])
            if sk.get('evidence'):
                small_label("Evidence from the Mentee", INDIGO)
                pdf.set_x(15)
                pdf.set_font('helvetica', 'I', 8)
                pdf.set_text_color(*TEXT_LIGHT)
                pdf.multi_cell(184, 5, '"' + sanitize_text(str(sk['evidence'])) + '"')
                pdf.ln(1)
            if sk.get('improvement'):
                small_label("How to Improve", EMERALD)
                pdf.set_x(15)
                pdf.set_font('helvetica', '', 8)
                pdf.set_text_color(*EMERALD)
                pdf.multi_cell(184, 5, sanitize_text(str(sk['improvement'])))
                pdf.ln(1)
            pdf.ln(3)
        divider()

    # 7. Mentor Guidance
    mg = data.get('mentor_guidance', {}) if isinstance(data.get('mentor_guidance'), dict) else {}
    if mg:
        block_title("7. Mentor Guidance", INDIGO)
        label_map = [
            ("Advice Given", "advice_given", TEXT_MAIN),
            ("Recommendations", "recommendations", TEXT_MAIN),
            ("Explanations", "explanations", TEXT_MAIN),
            ("Examples Provided", "examples_provided", TEXT_MAIN),
            ("Resources Suggested", "resources_suggested", TEXT_MAIN),
            ("Additional Guidance That May Be Useful", "additional_guidance_needed", TEXT_MAIN),
        ]
        for label, key, color in label_map:
            items = mg.get(key, [])
            if not items:
                continue
            small_label(label, color)
            for it in (items if isinstance(items, list) else [items]):
                bullet(it)
            pdf.ln(2)
        divider()

    # 8. Mentee Reflection
    mr = data.get('mentee_reflection', {}) if isinstance(data.get('mentee_reflection'), dict) else {}
    if mr:
        block_title("8. Mentee Reflection", AMBER)
        label_map = [
            ("Concerns Expressed", "concerns_expressed", TEXT_MAIN),
            ("Challenges Identified", "challenges_identified", TEXT_MAIN),
            ("Self-Reflections", "self_reflections", TEXT_MAIN),
            ("Questions Raised", "questions_raised", TEXT_MAIN),
            ("Areas of Uncertainty", "areas_of_uncertainty", TEXT_MAIN),
            ("Key Realizations", "key_realizations", TEXT_MAIN),
        ]
        for label, key, color in label_map:
            items = mr.get(key, [])
            if not items:
                continue
            small_label(label, color)
            for it in (items if isinstance(items, list) else [items]):
                bullet(it)
            pdf.ln(2)
        divider()

    # 9. Strengths & Development Opportunities
    sd = data.get('strengths_and_development', {}) if isinstance(data.get('strengths_and_development'), dict) else {}
    strengths = sd.get('strengths', [])
    opportunities = sd.get('development_opportunities', [])
    if isinstance(strengths, str):
        strengths = [strengths]
    if isinstance(opportunities, str):
        opportunities = [opportunities]
    if strengths or opportunities:
        block_title("9. Strengths & Development Opportunities", TEAL)
        col_left = 12
        col_right = 104
        col_w = 90
        max_rows = max(len(strengths), len(opportunities))
        pdf.check_space(max_rows * 10 + 15)
        y = pdf.get_y() + 2
        pdf.set_xy(col_left, y)
        pdf.set_font('helvetica', 'B', 9)
        pdf.set_text_color(*EMERALD)
        pdf.cell(col_w, 6, "STRENGTHS", 0, 1)
        sy = pdf.get_y() + 1
        for s in strengths:
            pdf.set_xy(col_left, sy)
            pdf.set_font('helvetica', '', 8)
            pdf.set_text_color(*TEXT_MAIN)
            sy = pdf.draw_wrapped_text(col_left, sy, col_w, 4, "+ " + sanitize_text(str(s)))
            sy += 3
        pdf.set_xy(col_right, y)
        pdf.set_font('helvetica', 'B', 9)
        pdf.set_text_color(*ROSE)
        pdf.cell(col_w, 6, "DEVELOPMENT OPPORTUNITIES", 0, 1)
        oy = pdf.get_y() + 1
        for o in opportunities:
            pdf.set_xy(col_right, oy)
            pdf.set_font('helvetica', '', 8)
            pdf.set_text_color(*TEXT_MAIN)
            oy = pdf.draw_wrapped_text(col_right, oy, col_w, 4, "→ " + sanitize_text(str(o)))
            oy += 3
        max_y = max(sy if strengths else y, oy if opportunities else y)
        pdf.set_y(max_y + 4)
        divider()

    # 10. Key Insights
    insights = data.get('key_insights', [])
    if isinstance(insights, str):
        insights = [insights]
    if isinstance(insights, list) and insights:
        block_title("10. Key Insights", BLUE)
        for ins in insights:
            bullet(ins)
        divider()

    # 11. Recommended Mentorship Questions
    questions = data.get('recommended_mentorship_questions', [])
    if isinstance(questions, str):
        questions = [questions]
    if isinstance(questions, list) and questions:
        block_title("11. Recommended Mentorship Questions", INDIGO)
        body_text("Useful questions for the next mentorship conversation:")
        pdf.ln(1)
        for q in questions:
            pdf.set_x(15)
            pdf.set_font('helvetica', '', 9)
            pdf.set_text_color(*TEXT_MAIN)
            pdf.multi_cell(180, 5, "? " + sanitize_text(str(q)))
            pdf.ln(1)
        divider()

    # 12. Action Plan
    actions = data.get('action_plan', [])
    if isinstance(actions, dict):
        actions = [actions]
    if isinstance(actions, list) and actions:
        block_title("12. Action Plan", EMERALD)
        for i, a in enumerate(actions, 1):
            if not isinstance(a, dict):
                continue
            action = str(a.get('action', ''))
            purpose = str(a.get('purpose', ''))
            outcome = str(a.get('expected_outcome', ''))
            prio = str(a.get('priority', ''))
            lines = 1 + max(
                len(action) / 184,
                len(purpose) / 184,
                len(outcome) / 184,
            )
            pdf.check_space(int(lines * 4) + 22)
            box_y = pdf.get_y()
            pdf.set_fill_color(*LIGHT_BG)
            pdf.rect(10, box_y, 190, 20, 'F')
            pdf.set_xy(14, box_y + 2)
            pdf.set_font('helvetica', 'B', 9)
            pdf.set_text_color(*EMERALD)
            pdf.cell(150, 6, f"{i}. {sanitize_text(action)}", 0, 0)
            pdf.set_font('helvetica', 'B', 8)
            pdf.set_text_color(*(EMERALD if prio.lower() == 'high' else (AMBER if prio.lower() == 'medium' else TEXT_LIGHT)))
            pdf.cell(0, 6, prio, 0, 1, 'R')
            pdf.set_x(14)
            pdf.set_font('helvetica', '', 8)
            pdf.set_text_color(*TEXT_MAIN)
            if purpose:
                pdf.multi_cell(184, 4, "Purpose: " + sanitize_text(purpose))
            if outcome:
                pdf.set_x(14)
                pdf.multi_cell(184, 4, "Expected outcome: " + sanitize_text(outcome))
            pdf.set_y(box_y + 20)
            pdf.ln(1)
        divider()

    # 13. Next Mentorship Focus
    nxt = data.get('next_mentorship_focus', {}) if isinstance(data.get('next_mentorship_focus'), dict) else {}
    if nxt:
        block_title("13. Next Mentorship Focus", PURPLE)
        label_map = [
            ("Progress Review", "progress_review", TEXT_MAIN),
            ("Unresolved Challenges", "unresolved_challenges", TEXT_MAIN),
            ("New Development Areas", "new_development_areas", TEXT_MAIN),
            ("Follow-Up on Previous Actions", "follow_up_on_previous_actions", TEXT_MAIN),
            ("Next Milestone", "next_milestone", TEXT_MAIN),
        ]
        for label, key, color in label_map:
            val = nxt.get(key, '')
            if not val:
                continue
            small_label(label, color)
            body_text(val)
            pdf.ln(2)

    # 14. Conversation Analysis
    ca = data.get('conversation_analysis', {}) if isinstance(data.get('conversation_analysis'), dict) else {}
    phases = ca.get('phase_breakdown', []) if isinstance(ca.get('phase_breakdown'), list) else []
    turning = ca.get('key_turning_points', []) if isinstance(ca.get('key_turning_points'), list) else []
    dynamics = ca.get('dialogue_dynamics', []) if isinstance(ca.get('dialogue_dynamics'), list) else []
    notable = ca.get('notable_moments', []) if isinstance(ca.get('notable_moments'), list) else []
    if phases or turning or dynamics or notable:
        block_title("14. Conversation Analysis", TEAL)

        if phases:
            pdf.ln(1)
            small_label("Phase-by-Phase Walkthrough", TEAL)
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
                pdf.check_space(box_h + 2)
                box_y = pdf.get_y()
                pdf.set_fill_color(*LIGHT_BG)
                pdf.rect(10, box_y, 190, box_h, 'F')
                pdf.set_fill_color(*TEAL)
                pdf.rect(12, box_y + 2, 30, 7, 'F')
                pdf.set_xy(12, box_y + 3)
                pdf.set_font('helvetica', 'B', 7)
                pdf.set_text_color(255, 255, 255)
                pdf.cell(30, 5, sanitize_text(ph_name[:16]), 0, 0, 'C')
                pdf.set_xy(46, box_y + 3)
                pdf.set_font('helvetica', 'I', 7)
                pdf.set_text_color(*TEXT_LIGHT)
                pdf.cell(70, 5, sanitize_text(ph_time), 0, 1)
                yy = box_y + 11
                if ph_sum:
                    pdf.set_xy(14, yy)
                    pdf.set_font('helvetica', '', 8.5)
                    pdf.set_text_color(*TEXT_MAIN)
                    yy = pdf.draw_wrapped_text(14, yy, 182, 4.4, sanitize_text(ph_sum))
                    yy += 2
                if ph_tech:
                    pdf.set_font('helvetica', 'B', 8)
                    pdf.set_text_color(*INDIGO)
                    pdf.set_xy(14, yy)
                    pdf.cell(0, 4.4, "Technique:")
                    yy += 4.4
                    pdf.set_font('helvetica', '', 8.5)
                    pdf.set_text_color(*TEXT_MAIN)
                    pdf.set_xy(14, yy)
                    yy = pdf.draw_wrapped_text(14, yy, 182, 4.4, sanitize_text(ph_tech))
                    yy += 2
                if ph_impact:
                    pdf.set_font('helvetica', 'B', 8)
                    pdf.set_text_color(*EMERALD)
                    pdf.set_xy(14, yy)
                    pdf.cell(0, 4.4, "Impact:")
                    yy += 4.4
                    pdf.set_font('helvetica', '', 8.5)
                    pdf.set_text_color(*TEXT_MAIN)
                    pdf.set_xy(14, yy)
                    yy = pdf.draw_wrapped_text(14, yy, 182, 4.4, sanitize_text(ph_impact))
                pdf.set_y(box_y + box_h + 1)
            pdf.ln(1)

        if turning:
            pdf.ln(2)
            pdf.check_space(30)
            small_label("Key Turning Points", INDIGO)
            for i, tp in enumerate(turning, 1):
                if not isinstance(tp, dict):
                    continue
                moment = str(tp.get('moment', ''))
                happened = str(tp.get('what_happened', ''))
                significance = str(tp.get('why_significant', ''))
                lines = sum(max(1, int((len(x) + 175) / 176)) for x in [moment, happened, significance] if x)
                box_h = 8 + lines * 3.8
                pdf.check_space(box_h + 2)
                box_y = pdf.get_y()
                pdf.set_fill_color(*LIGHT_BG)
                pdf.rect(10, box_y, 190, box_h, 'F')
                pdf.set_fill_color(*INDIGO)
                pdf.rect(12, box_y + 2, 8, 8, 'F')
                pdf.set_xy(13, box_y + 3)
                pdf.set_text_color(255, 255, 255)
                pdf.set_font('helvetica', 'B', 7)
                pdf.cell(6, 5, str(i), 0, 0, 'C')
                pdf.set_text_color(*INDIGO)
                pdf.set_font('helvetica', 'B', 9)
                pdf.draw_wrapped_text(24, box_y + 2, 173, 4.2, sanitize_text(moment))
                yy = box_y + 7
                if happened:
                    pdf.set_xy(14, yy)
                    pdf.set_text_color(*TEXT_MAIN)
                    pdf.set_font('helvetica', '', 8.5)
                    yy = pdf.draw_wrapped_text(14, yy, 182, 4.0, "What happened: " + sanitize_text(happened))
                    yy += 1
                if significance:
                    pdf.set_xy(14, yy)
                    pdf.set_text_color(*EMERALD)
                    pdf.set_font('helvetica', '', 8.5)
                    pdf.draw_wrapped_text(14, yy, 182, 4.0, "Why it mattered: " + sanitize_text(significance))
                pdf.set_y(box_y + box_h + 1)
            pdf.ln(1)

        if dynamics:
            pdf.ln(2)
            small_label("Dialogue Dynamics", INDIGO)
            for dyn in dynamics:
                if not isinstance(dyn, dict):
                    continue
                dim_name = str(dyn.get('dimension', ''))
                obs = str(dyn.get('observation', ''))
                assess = str(dyn.get('assessment', ''))
                lines = max(1, int((len(obs) + 150) / 151))
                pdf.check_space(lines * 5 + 16)
                y0 = pdf.get_y()
                pdf.set_fill_color(*LIGHT_BG)
                pdf.rect(10, y0, 190, lines * 5 + 14, 'F')
                pdf.set_font('helvetica', 'B', 9)
                pdf.set_text_color(*INDIGO)
                pdf.draw_wrapped_text(14, y0 + 3, 120, 5, sanitize_text(dim_name))
                pdf.set_font('helvetica', 'B', 8)
                acc = str(assess).lower()
                acol = EMERALD if acc.startswith('high') else (AMBER if acc.startswith('mod') else (ROSE if acc.startswith('dev') else TEXT_LIGHT))
                pdf.set_text_color(*acol)
                pdf.draw_wrapped_text(140, y0 + 3, 56, 5, sanitize_text(assess)[:40])
                if obs:
                    pdf.set_xy(14, y0 + 9)
                    pdf.set_font('helvetica', '', 8.5)
                    pdf.set_text_color(*TEXT_MAIN)
                    pdf.draw_wrapped_text(14, y0 + 9, 182, 4.4, sanitize_text(obs))
                pdf.set_y(y0 + lines * 5 + 16)
            pdf.ln(1)

        if notable:
            pdf.ln(2)
            small_label("Notable Moments", EMERALD)
            for nm in notable:
                pdf.check_space(8)
                pdf.set_x(15)
                pdf.set_font('helvetica', '', 9)
                pdf.set_text_color(*TEXT_MAIN)
                pdf.multi_cell(180, 5, "• " + sanitize_text(str(nm)))
                pdf.ln(1)
            pdf.ln(1)
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

    pdf.add_page()   # triggers header() → shared cover page

    # Summary banner (same design as assessment report)
    meta = data.get('meta', {}) if isinstance(data, dict) else {}
    pdf.draw_banner(meta, scenario_type=scenario_type)

    # Body
    draw_mentorship_body(pdf, data)

    # Transcript
    if transcript:
        pdf.draw_transcript(transcript)

    pdf.output(filename)
    print(f"[MENTORSHIP] Report saved: {filename}")
    return data
