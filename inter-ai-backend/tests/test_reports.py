"""End-to-end tests for the CoAct AI report generators.

These tests exercise the unmodified sample data through the live PDF generators
and assert that the resulting documents match the production contract:

- The Assessment Report renders all 14 numbered sections plus an isolated
  executive summary, and keeps its scored Dialogue Dynamics.
- The Mentorship Report renders all 14 sections, stays 100% qualitative
  (no /10 marks, no SCORE/RATING/SCORECARD), and uses qualitative labels in
  its Dialogue Dynamics.
"""

import json
import re
from pathlib import Path

import pytest
from cli_report import generate_report
from mentorship_report import generate_mentorship_report
from pypdf import PdfReader

SAMPLE_ASSESSMENT = Path(__file__).resolve().parent / "fixtures" / "sample_assessment_data.json"
SAMPLE_MENTORSHIP = Path(__file__).resolve().parent / "fixtures" / "sample_mentorship_data.json"

# Every report must contain these numbered, one-line-intro sections (1-14).
ASSESSMENT_SECTIONS = [
    "1 TIMING",
    "2 CONVERSATION SNAPSHOT",
    "3 EXECUTIVE DASHBOARD",
    "4 COACHING EFFICACY",
    "5 CONVERSATION HEAT MAP",
    "6 SKILL VISUALIZATION",
    "7 GOAL ATTAINMENT",
    "8 PERFORMANCE SCORECARD",
    "9 DEEP-DIVE ANALYSIS",
    "10 STRENGTHS & MISSED OPPORTUNITIES",
    "11 IDEAL COACHING QUESTIONS",
    "12 ACTION PLAN",
    "13 RECOMMENDED NEXT STEPS",
    "14 CONVERSATION ANALYSIS",
]

MENTORSHIP_SECTIONS = [
    "1 TIMING",
    "2 CONVERSATION SNAPSHOT",
    "3 EXECUTIVE DASHBOARD",
    "4 MENTORSHIP FOCUS",
    "5 GOAL PROGRESS",
    "6 SKILL DEVELOPMENT",
    "7 MENTOR GUIDANCE",
    "8 MENTEE REFLECTION",
    "9 STRENGTHS & DEVELOPMENT",
    "10 KEY INSIGHTS",
    "11 RECOMMENDED MENTORSHIP QUESTIONS",
    "12 ACTION PLAN",
    "13 NEXT MENTORSHIP FOCUS",
    "14 CONVERSATION ANALYSIS",
]

MENTORSHIP_FORBIDDEN = [
    r"\d+/10",    # any /10 numerical score
    r"SCORE",
    r"RATING",
    r"SCORECARD",
]

MIN_ASSESSMENT_PAGES = 8
MIN_MENTORSHIP_PAGES = 8


def _load(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _extract(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    return " ".join((page.extract_text() or "") for page in reader.pages)


def _write_pdf(tmp_path: Path, name: str, bytes_: bytes) -> Path:
    out = tmp_path / name
    out.write_bytes(bytes_)
    return out


# --------------------------------------------------------------------------
# Fixtures
# --------------------------------------------------------------------------

@pytest.fixture(scope="module")
def assessment_pdf(tmp_path_factory) -> Path:
    data = _load(SAMPLE_ASSESSMENT)
    target = tmp_path_factory.mktemp("out") / "assessment.pdf"
    generate_report(
        transcript="",
        role="Manager",
        ai_role="Sales Associate",
        scenario="A manager must coach a sales associate missing targets.",
        framework=None,
        filename=str(target),
        mode="coaching",
        precomputed_data=data,
        scenario_type=data.get("scenario_type"),
        user_name="Test User",
        ai_character="alex",
        session_mode="coaching",
    )
    return target


@pytest.fixture(scope="module")
def mentorship_pdf(tmp_path_factory) -> Path:
    data = _load(SAMPLE_MENTORSHIP)
    target = tmp_path_factory.mktemp("out") / "mentorship.pdf"
    generate_mentorship_report(
        transcript="",
        role="Mentee",
        ai_role="Mentor",
        scenario="A new manager struggles to delegate tasks to their team.",
        filename=str(target),
        precomputed_data=data,
        scenario_type="mentorship",
        user_name="Test User",
        ai_character="alex",
    )
    return target


# --------------------------------------------------------------------------
# Assessment Report
# --------------------------------------------------------------------------

class TestAssessmentReport:
    def test_all_14_sections_present(self, assessment_pdf):
        text = re.sub(r"[ \t]+", " ", _extract(assessment_pdf))
        for section in ASSESSMENT_SECTIONS:
            assert section in text, f"missing section: {section}"

    def test_executive_summary_isolated(self, assessment_pdf):
        reader = PdfReader(str(assessment_pdf))
        assert len(reader.pages) >= MIN_ASSESSMENT_PAGES
        # Cover is page 0; the executive summary must occupy its own page (page 1)
        p2 = reader.pages[1].extract_text() or ""
        p3 = reader.pages[2].extract_text() or ""
        assert "EXECUTIVE SUMMARY" in p2
        assert re.search(r"\b1 TIMING", p3), "section 1 should start the body on the next page"

    def test_dialogue_dynamics_scored(self, assessment_pdf):
        text = _extract(assessment_pdf)
        assert "DIALOGUE DYNAMICS" in text
        assert re.search(r"\b\d/10\b", text), "assessment dynamics must carry an X/10 score"


# --------------------------------------------------------------------------
# Mentorship Report - qualitative contract
# --------------------------------------------------------------------------

class TestMentorshipReport:
    def test_all_14_sections_present(self, mentorship_pdf):
        text = re.sub(r"[ \t]+", " ", _extract(mentorship_pdf))
        for section in MENTORSHIP_SECTIONS:
            assert section in text, f"missing section: {section}"

    def test_stays_fully_qualitative(self, mentorship_pdf):
        text = _extract(mentorship_pdf).upper()
        for pattern in MENTORSHIP_FORBIDDEN:
            assert not re.search(pattern, text), f"mentorship report must not contain {pattern}"

    def test_dialogue_dynamics_qualitative_labels(self, mentorship_pdf):
        text = _extract(mentorship_pdf)
        assert "DIALOGUE DYNAMICS" in text
        assert "High" in text and "Moderate" in text
        assert not re.search(r"\b\d/10\b", text), "mentorship dynamics must use qualitative labels only"

    def test_min_page_count(self, mentorship_pdf):
        reader = PdfReader(str(mentorship_pdf))
        assert len(reader.pages) >= MIN_MENTORSHIP_PAGES