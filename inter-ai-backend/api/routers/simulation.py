import asyncio
import base64
import datetime as dt
import json
import logging
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, Response

router = APIRouter(prefix="/api", tags=["Simulation"])
logger = logging.getLogger("coact")

# Mocks and dependencies
import io
from contextlib import nullcontext
from typing import Any, List, Optional

import httpx
from app import MONTHLY_TOKEN_LIMIT, SESSIONS, USE_DATABASE, get_session, standard_limiter
from cli_report import CHAT_MODEL_NAME, analyze_full_report_data, detect_scenario_type, generate_report, llm_reply
from core.config import MONTHLY_SESSION_LIMIT
from core.dependencies import enforce_ai_rate_limits, get_authenticated_user
from core.security import sanitize_input
from database import (
    check_monthly_session_limit,
    check_token_limit,
    clear_user_sessions_from_db,
    get_previous_session_scores,
    get_session_from_db,
    get_user_analytics_from_db,
    get_user_sessions_from_db,
    save_session_to_db,
)
from fastapi import BackgroundTasks
from fastapi.responses import StreamingResponse
from langsmith import traceable
from services.simulation_service import (
    build_followup_prompt,
    build_simulation_followup,
    build_summary_prompt,
    detect_framework_fallback,
)
from services.usage import (
    check_and_consume,
    estimate_tokens,
    record_usage,
    usage_context,
)

_local_httpx_client = None

def get_httpx_client():
    global _local_httpx_client
    if _local_httpx_client is None:
        import httpx
        _local_httpx_client = httpx.AsyncClient(http2=False, timeout=60.0, limits=httpx.Limits(max_keepalive_connections=20))
    return _local_httpx_client


def normalize_text(text: str) -> str:
    return text.strip()

def get_relevant_questions(user_msg: str, active_fw: list) -> list:
    return []

def sanitize_llm_output(output: Any) -> str:
    import re as _re
    text = str(output[0]).strip() if isinstance(output, tuple) else str(output).strip()
    text = _re.sub(r"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", "", text, flags=_re.IGNORECASE)
    text = _re.sub(r"<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>", "", text, flags=_re.IGNORECASE)
    text = _re.sub(r"javascript:", "", text, flags=_re.IGNORECASE)
    text = _re.sub(r"on\w+\s*=", "", text, flags=_re.IGNORECASE)
    return text


@router.get("/history")
async def get_history(request: Request):
    """Get practice history for the authenticated user."""
    user = get_authenticated_user(request)
    user_id_str = user.id
    
    try:
        logger.info(f"[HISTORY] Fetching all sessions for user {user_id_str}")
        db_result = get_user_sessions_from_db(user_id_str, completed_only=False)
        db_sessions: list = db_result.get("sessions", []) if isinstance(db_result, dict) else (db_result if isinstance(db_result, list) else []) # type: ignore
        
        user_sessions: list = db_sessions if db_sessions else []
        logger.info(f"[HISTORY] Found {len(user_sessions)} completed sessions in database")
        
        # Sort by created_at desc (newest first)
        user_sessions.sort(key=lambda x: x.get("created_at", "") if isinstance(x, dict) else "", reverse=True)
        
        # Format response with only the fields needed for history display
        history_items = []
        for s in user_sessions:
            score = s.get("score") or 0
            if not score and s.get("report_data"):
                grade_str = s["report_data"].get("meta", {}).get("overall_grade", "")
                if grade_str and "/" in str(grade_str):
                    try:
                        score = float(str(grade_str).split("/")[0].strip())
                    except (ValueError, IndexError):
                        score = 0
            history_items.append({
                "session_id": s.get("id"),
                "date": s.get("created_at"),
                "role": s.get("role"),
                "ai_role": s.get("ai_role"),
                "title": s.get("title"),
                "scenario": s.get("scenario"),
                "scenario_type": s.get("scenario_type", "custom"),
                "session_mode": s.get("session_mode", "skill_assessment"),
                "completed": s.get("completed", False),
                "score": score,
            })
        return history_items
        
    except Exception as e:
        logger.info(f"[ERROR] Failed to fetch history: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=400)


@router.websocket("/transcribe/stream")
async def websocket_transcribe_stream(websocket: WebSocket):
    await websocket.accept()
    logger.info(" [INFO] /api/transcribe/stream called. Streaming STT is deprecated.")
    await websocket.send_json({"error": "Streaming STT (Sarvam) has been replaced by Groq Whisper REST API (/api/transcribe)."})
    await websocket.close(code=1000, reason="Streaming STT deprecated")


@router.post("/transcribe")
async def transcribe_audio(request: Request, _ai_limits = Depends(enforce_ai_rate_limits)):
    """Speech-to-Text using OpenAI Whisper model."""
    import tempfile
    
    SUPPORTED_FORMATS = {'.webm', '.mp3', '.mp4', '.wav', '.m4a', '.ogg', '.flac', '.mpeg'}
    
    try:
        form_data = await request.form()
        
        if 'file' not in form_data:
            logger.info(" [DEBUG] returning 400: 'file' not in form_data")
            return JSONResponse(content={"error": "No audio file uploaded"}, status_code=400)
            
        audio_file = form_data['file']
        if isinstance(audio_file, str):
            logger.info(" [DEBUG] returning 400: audio_file is str")
            return JSONResponse(content={"error": "File upload required"}, status_code=400)
            
        # Removed strict duck typing as it might fail on some Starlette versions
        original_filename = getattr(audio_file, 'filename', None)
        if not original_filename:
            original_filename = "audio.webm"
        
        file_ext = os.path.splitext(original_filename)[1].lower()
        
        if file_ext not in SUPPORTED_FORMATS:
            file_ext = ".webm"
        
        tmp = tempfile.NamedTemporaryFile(suffix=file_ext, delete=False)
        audio_bytes = await audio_file.read()
        
        # Strict magic bytes validation to prevent malicious uploads (e.g. .exe masquerading as .mp3)
        magic_bytes = audio_bytes[:12]
        is_audio = False
        
        if magic_bytes.startswith(b'ID3') or magic_bytes.startswith(b'\xff\xfb') or magic_bytes.startswith(b'\xff\xf3'): # MP3
            is_audio = True
        elif magic_bytes.startswith(b'OggS'): # OGG
            is_audio = True
        elif magic_bytes.startswith(b'fLaC'): # FLAC
            is_audio = True
        elif magic_bytes.startswith(b'RIFF') and b'WAVE' in magic_bytes: # WAV
            is_audio = True
        elif magic_bytes.startswith(b'\x1aE\xdf\xa3'): # WEBM
            is_audio = True
        elif b'ftyp' in magic_bytes: # MP4 / M4A
            is_audio = True
            
        if not is_audio:
            logger.warning(f"Rejected invalid file upload at /api/transcribe. Magic bytes: {magic_bytes}")
            return JSONResponse(content={"error": "Invalid file format. Uploaded file is not a valid audio file."}, status_code=400)
            
        tmp.write(audio_bytes)
        tmp.close()
        read_path = tmp.name
        audio_url = None
        
        try:
            logger.info(" [INFO] Transcribing audio with Groq Whisper API...")
            
            # Use Groq's OpenAI-compatible Whisper API
            groq_whisper_model = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3-turbo")
            groq_api_key = os.getenv("GROQ_API_KEY", "")
            
            if not groq_api_key or groq_api_key == "your_groq_api_key_here":
                return JSONResponse(content={"error": "GROQ_API_KEY not configured"}, status_code=500)
            
            @traceable(run_type="llm", name="groq_whisper_stt")
            async def _call_groq_whisper(filepath: str):
                if False:
                    raise Exception("Shared HTTPX client not initialized")
                with open(filepath, "rb") as f:
                    try:
                        return await get_httpx_client().post(
                            "https://api.groq.com/openai/v1/audio/transcriptions",
                            headers={"Authorization": f"Bearer {groq_api_key}"},
                            files={"file": (os.path.basename(filepath), f, "audio/webm")},
                            data={
                                "model": groq_whisper_model,
                                "response_format": "json",
                                "language": "en",
                                "temperature": "0.0"
                            },
                            timeout=300.0
                        )
                    except httpx.ConnectError:
                        logger.error("Failed to connect to Groq Whisper API")
                        return None
                    except Exception as e:
                        logger.error(f"Groq Whisper API error: {e}")
                        return None
            
            resp = await _call_groq_whisper(read_path)
                    
            if resp is None:
                return JSONResponse(content={"error": "Groq Whisper API is currently unreachable. Please check your GROQ_API_KEY."}, status_code=500)
                
            if resp.status_code != 200:
                logger.info(f" [ERROR] Groq Whisper STT Error: {resp.status_code} {resp.text}")
                return JSONResponse(content={"error": "Groq Whisper STT failed"}, status_code=500)
                
            response_json = resp.json()
            # The API returns {"text": "transcribed text"}
            transcribed_text = response_json.get("text", "").strip()
            
            if not transcribed_text:
                raise Exception("No text transcribed")

            # Filter common Whisper silence hallucinations
            lower_text = transcribed_text.lower().strip()
            
            # YouTube/Subtitle artifacts that Whisper injects during silence
            hallucination_phrases = [
                "thank you", "thanks for watching", "amara.org", "subtitles by",
                "hello. yes, i understand", "um, let's start the conversation.",
                "welcome to my channel", "hope you enjoy this video",
                "first time doing this", "please subscribe"
            ]
            
            # 1. Check for exact short matches or common noise words
            if lower_text in ["you", "you.", "."]:
                logger.info(f" [STT] Filtered out short noise word: '{transcribed_text}'")
                transcribed_text = ""
            # 2. Check for YouTube artifacts (remove the < 50 length restriction because Whisper often loops them infinitely)
            elif any(hp in lower_text for hp in hallucination_phrases):
                logger.info(f" [STT] Filtered out hallucination phrase: '{transcribed_text}'")
                transcribed_text = ""
            # 3. Detect repetitive loop hallucinations (e.g. "I hope you enjoy this video." 5 times)
            else:
                # If a sentence is repeated more than 3 times, it's a hallucination loop
                sentences = [s.strip() for s in lower_text.split('.') if len(s.strip()) > 5]
                for s in set(sentences):
                    if sentences.count(s) >= 3:
                        logger.info(f" [STT] Filtered out repetitive loop hallucination: '{transcribed_text}'")
                        transcribed_text = ""
                        break
                
            logger.info(f" [SUCCESS] Transcribed: {transcribed_text[:100]}...")
            
            # --- SPEECH ANALYSIS: Filler Words & WPM ---
            speech_metrics = None
            if len(transcribed_text) > 0:
                words = transcribed_text.split()
                total_words = len(words)
                FILLER_WORDS = ["um", "uh", "like", "you know", "sort of", "kind of", "basically", "actually", "literally", "right"]
                text_lower = transcribed_text.lower()
                filler_count = 0
                filler_breakdown = {}
                for filler in FILLER_WORDS:
                    count = text_lower.count(filler)
                    if count > 0:
                        filler_count += count
                        filler_breakdown[filler] = count
                filler_ratio = round(filler_count / total_words, 3) if total_words > 0 else 0
                
                # WPM estimation (if duration provided by frontend)
                duration_seconds = form_data.get("duration_seconds")
                wpm = None
                wpm_label = None
                if duration_seconds and isinstance(duration_seconds, str):
                    duration_seconds_float = float(duration_seconds)
                    if duration_seconds_float > 0:
                        wpm = round(total_words / (duration_seconds_float / 60))
                        if wpm > 160:
                            wpm_label = "Anxious/Rushed"
                        elif wpm < 100:
                            wpm_label = "Uncertain/Hesitant"
                        else:
                            wpm_label = "Confident"
                
                speech_metrics = {
                    "total_words": total_words,
                    "filler_count": filler_count,
                    "filler_ratio": filler_ratio,
                    "filler_breakdown": filler_breakdown,
                    "wpm": wpm,
                    "wpm_label": wpm_label
                }
                if filler_count > 0:
                    logger.info(f" [SPEECH] Filler words detected: {filler_count} ({filler_ratio*100:.1f}% of words)")
                if wpm:
                    logger.info(f" [SPEECH] WPM: {wpm} ({wpm_label})")
            
            # Account Whisper usage under the user's quota when authenticated
            try:
                user = get_authenticated_user(request)
            except Exception:
                user = None
            if user is not None:
                record_usage(
                    user.id,
                    endpoint="transcribe",
                    model=groq_whisper_model,
                    input_tokens=estimate_tokens(transcribed_text),
                    output_tokens=0,
                )

            return ({
                "text": transcribed_text, 
                "audio_url": audio_url,
                "speech_metrics": speech_metrics
            })
            
            
        finally:
            # ALWAYS delete the temp file
            if os.path.exists(read_path):
                try:
                    os.unlink(read_path)
                except Exception as e:
                    logger.info(f"Warning: Failed to delete temp file {read_path}: {e}")
                
    except Exception as e:
        import traceback
        error_msg = str(e)
        logger.info(f" [ERROR] STT Transcription Error: {error_msg}")
        traceback.print_exc()
        return JSONResponse(content={"error": error_msg}, status_code=500)

@router.post("/speak")
async def speak_text(request: Request, _ = Depends(standard_limiter)):
    """Text-to-Speech using Sarvam AI."""
    text = ""
    voice = "alloy"
    try:
        data = await request.json() or {}
        text = data.get("text", "")
        voice = data.get("voice", "alloy")
        
        if not text:
            return JSONResponse(content={"error": "No text provided"}, status_code=400)

        # Map voice parameter to Sarvam speakers
        VOICE_MAP = {
            "nova": "ritu",         # Female voice
            "shimmer": "ritu",      # Female voice
            "fable": "aditya",      # Male voice
            "alloy": "aditya",      # Male voice
        }
        sarvam_speaker = VOICE_MAP.get(voice.lower(), "ritu")
        sarvam_key = os.getenv("SARVAM_API_KEY", "")

        if not sarvam_key or sarvam_key == "your_sarvam_api_key_here":
            logger.warning(" [WARNING] SARVAM_API_KEY is not configured.")
            return JSONResponse(content={"error": "TTS engine misconfigured"}, status_code=500)

        logger.info(f" [INFO] Generating TTS via Sarvam AI ({sarvam_speaker}) for: '{text[:80]}...'")

        payload = {
            "text": text[:2500],
            "language_code": "en-IN",
            "speaker": sarvam_speaker,
            "pace": 1.0,
            "speech_sample_rate": 22050,
            "model": "bulbul:v3"
        }
        headers = {
            "api-subscription-key": sarvam_key,
            "Content-Type": "application/json"
        }

        try:
            if False:
                raise RuntimeError("Shared HTTPX client is not initialized")
            resp = await get_httpx_client().post("https://api.sarvam.ai/text-to-speech", json=payload, headers=headers, timeout=30.0)
            if resp.status_code != 200:
                logger.error(f" [ERROR] Sarvam API returned {resp.status_code}: {resp.text}")
                return JSONResponse(content={"error": "TTS engine error"}, status_code=500)
                
            resp_data = resp.json()
            b64_audio = resp_data.get("audios", [""])[0]
            
            if not b64_audio:
                logger.warning(" [WARNING] Sarvam API returned no audio data")
                return JSONResponse(content={"error": "No audio generated"}, status_code=500)

            audio_data = base64.b64decode(b64_audio)
            logger.info(f" [SUCCESS] Sarvam AI generated {len(audio_data)} bytes")
            return Response(audio_data, media_type="audio/wav", headers={"Content-Length": str(len(audio_data))})
        except Exception as req_e:
            logger.error(f" [ERROR] Failed to contact Sarvam AI: {req_e}")
            return JSONResponse(content={"error": "TTS request failed"}, status_code=500)

    except Exception as e:
        logger.info(f" [ERROR] TTS Endpoint Error: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)



ALL_FRAMEWORKS = ["GROW", "STAR", "ADKAR", "SMART", "EQ", "BOUNDARY", "OSKAR", "CBT", "CLEAR", "RADICAL CANDOR", "SFBT", "CIRCLE OF INFLUENCE", "SCARF", "FUEL", "TGROW", "SBI/DESC", "LAER", "APPRECIATIVE INQUIRY", "BENEFIT-SELLING"]

# ---------------------------------------------------------
# Hardcoded Framework Mapping (Token Optimization - skips LLM call)
# ---------------------------------------------------------
SIMULATION_FRAMEWORKS = {
    "SIM-01-PERF-001": ["GROW", "EQ", "RADICAL CANDOR"],
    "SIM-02-BEH-001": ["SBI/DESC", "EQ", "BOUNDARY"],
    "SIM-03-MOT-001": ["GROW", "EQ", "APPRECIATIVE INQUIRY"],
    "SIM-04-COM-001": ["SCARF", "EQ", "FUEL"],
    "SIM-05-CON-001": ["EQ", "BOUNDARY", "CLEAR"],
    "SIM-06-CUST-001": ["LAER", "EQ", "BOUNDARY"],
    "SIM-07-LEAD-001": ["GROW", "RADICAL CANDOR", "TGROW"],
    "SIM-08-CHG-001": ["ADKAR", "SCARF", "EQ"],
    "SIM-09-CAR-001": ["GROW", "SMART", "APPRECIATIVE INQUIRY"],
    "SIM-10-WELL-001": ["EQ", "CIRCLE OF INFLUENCE", "SFBT"],
    "SIM-11-MENTOR-001": ["GROW", "RADICAL CANDOR", "EQ"],
    "MENT-01-PERF-001": ["GROW", "EQ", "RADICAL CANDOR"],
    "MENT-02-BEH-001": ["SBI/DESC", "EQ", "BOUNDARY"],
    "MENT-03-MOT-001": ["GROW", "EQ", "APPRECIATIVE INQUIRY"],
    "MENT-04-COM-001": ["SCARF", "EQ", "FUEL"],
    "MENT-05-CON-001": ["EQ", "BOUNDARY", "CLEAR"],
    "MENT-06-CUST-001": ["LAER", "EQ", "BOUNDARY"],
    "MENT-07-LEAD-001": ["GROW", "RADICAL CANDOR", "TGROW"],
    "MENT-08-CHG-001": ["ADKAR", "SCARF", "EQ"],
    "MENT-09-CAR-001": ["GROW", "SMART", "APPRECIATIVE INQUIRY"],
    "MENT-10-WELL-001": ["EQ", "CIRCLE OF INFLUENCE", "SFBT"],
}

def select_framework_for_scenario(scenario: str, ai_role: str, simulation_id: Optional[str] = None) -> List[str]:
    """Select frameworks for a scenario. Uses hardcoded mapping for known simulations (saves 1 LLM call)."""
    
    # OPTIMIZATION: Return immediately for known simulations (no LLM call needed)
    if simulation_id and simulation_id in SIMULATION_FRAMEWORKS:
        result = SIMULATION_FRAMEWORKS[simulation_id]
        logger.info(f" [TARGET] Hardcoded frameworks for {simulation_id}: {result} (saved 1 LLM call)")
        return result
    
    # Fallback: Use AI for custom/unknown scenarios
    prompt = f"""Analyze this roleplay scenario and select the 2-3 MOST APPROPRIATE coaching frameworks.

SCENARIO: {scenario}
AI ROLE: {ai_role}

AVAILABLE FRAMEWORKS:
- GROW: Goal setting, exploring reality, options, and will to act
- STAR: Situation-Task-Action-Result for behavioral examples
- ADKAR: Change management (Awareness, Desire, Knowledge, Ability, Reinforcement)
- SMART: Specific, Measurable, Achievable, Relevant, Time-bound goals
- EQ: Emotional intelligence, empathy, understanding feelings
- BOUNDARY: Setting and maintaining professional boundaries
- OSKAR: Outcome-focused coaching with scaling
- CBT: Cognitive behavioral - identifying and challenging thoughts
- CLEAR: Contracting, Listening, Exploring, Action, Review
- RADICAL CANDOR: Caring personally while challenging directly
- SFBT: Solution-focused, miracle questions, exceptions
- CIRCLE OF INFLUENCE: What you can control vs. cannot
- SCARF: Status, Certainty, Autonomy, Relatedness, Fairness
- FUEL: Frame, Understand, Explore, Lay out plan
- TGROW: Topic, Goal, Reality, Options, Will (Standard coaching flow)
- SBI/DESC: Situation-Behavior-Impact (Feedback) / Describe-Express-Specify-Consequences
- LAER: Listen, Acknowledge, Explore, Respond (Objection handling)
- APPRECIATIVE INQUIRY: Focus on strengths and positives (Discovery, Dream, Design, Destiny)
- BENEFIT-SELLING: Connecting features directly to user benefits (Feature -> Benefit link)

Based on the scenario, respond with ONLY the framework names separated by commas (e.g., "EQ, BOUNDARY, GROW"). No explanations."""

    try:
        response = llm_reply([{"role": "user", "content": prompt}], max_tokens=50, run_name="framework_selection", run_tags=["setup"])
        # Parse the response
        frameworks = [fw.strip().upper() for fw in response.split(",")]
        # Filter to only valid frameworks
        valid = [fw for fw in frameworks if fw in ALL_FRAMEWORKS]
        if valid:
            logger.info(f" [TARGET] AI selected frameworks for scenario: {valid}")
            return valid
    except Exception as e:
        logger.info(f"Framework selection error: {e}")
    
    # Default fallback
    return ["GROW", "EQ", "STAR", "ADKAR", "SMART", "BOUNDARY", "OSKAR", "CBT", "CLEAR", "RADICAL CANDOR", "SFBT", "CIRCLE OF INFLUENCE", "SCARF", "FUEL"]

def detect_session_mode(scenario: str, ai_role: str) -> str:
    """Auto-detect whether session should be 'assessment' or 'learning' mode based on scenario context."""
    scenario_lower = scenario.lower()
    ai_role_lower = ai_role.lower()
    
    # Assessment keywords - trigger numerical scoring
    assessment_keywords = [
        "evaluate", "assessment", "performance", "negotiate", "negotiation",
        "annual review", "benchmark", "test", "measure", "validation",
        "exam", "interview", "pitch", "presentation"
    ]
    
    # Learning keywords - trigger qualitative feedback only
    learning_keywords = [
        "coach", "practice", "rehearsal", "reflection", "development",
        "learning", "growth", "safe space", "feedback", "improve"
    ]
    
    # Check for assessment keywords
    for keyword in assessment_keywords:
        if keyword in scenario_lower or keyword in ai_role_lower:
            logger.info(f" [TARGET] Auto-detected ASSESSMENT mode (keyword: '{keyword}')")
            return "assessment"
    
    # Check for learning keywords
    for keyword in learning_keywords:
        if keyword in scenario_lower or keyword in ai_role_lower:
            logger.info(f" [INFO] Auto-detected LEARNING mode (keyword: '{keyword}')")
            return "learning"
    
    # Default to learning mode for safe practice
    logger.info(" [INFO] Defaulting to LEARNING mode (no clear indicators)")
    return "learning"

@router.post("/session/start")
async def start_session(request: Request, _ = Depends(standard_limiter), _ai_limits = Depends(enforce_ai_rate_limits)):
    logger.info("[DEBUG] Entered /session/start")
    # Audio cleanup logic removed


    data = await request.json() or {}

    try:
        user = get_authenticated_user(request)
    except Exception:
        user = None
    if user is not None:
        if not check_monthly_session_limit(user.id, MONTHLY_SESSION_LIMIT):
            return JSONResponse(content={"error": "Monthly limit reached. You have already created 3 sessions this month."}, status_code=429)
        if not check_token_limit(user.id, MONTHLY_TOKEN_LIMIT):
            return JSONResponse(content={"error": f"Monthly token limit ({MONTHLY_TOKEN_LIMIT}) exceeded. Please try again next month."}, status_code=429)

    role = sanitize_input(data.get("role", ""), max_length=200)
    ai_role = sanitize_input(data.get("ai_role", ""), max_length=200)
    scenario = sanitize_input(data.get("scenario", ""), max_length=3000)
    title = sanitize_input(data.get("title", ""), max_length=300) or None
    framework = data.get("framework", "auto")
    # Support optional flip_roles flag: when true, swap role and ai_role
    flip_roles = data.get("flip_roles", False)
    if flip_roles:
        logger.info("flip_roles flag detected - swapping role and ai_role")
        role, ai_role = ai_role, role
    
    # Support both old 'mode' and new 'scenario_type' parameters
    scenario_type = data.get("scenario_type")
    mode = data.get("mode")  # Legacy support (evaluation vs coaching)
    session_mode = data.get("session_mode")  # NEW: skill_assessment, practice, mentorship
    simulation_id = data.get("simulation_id")  # Structured simulation ID (e.g. SIM-01-PERF-001)
    
    if not role or not ai_role or not scenario: 
        return JSONResponse(content={"error": "Missing fields"}, status_code=400)

    # Auto-detect scenario_type if not explicitly provided
    if not scenario_type:
        scenario_type = detect_scenario_type(scenario, ai_role, role)
    logger.info(f"Session scenario_type set to: {scenario_type}")
    
    # Detect session_mode from scenario_type if not provided
    if not session_mode:
        mode_mapping = {
            "coaching": "skill_assessment",
            "negotiation": "skill_assessment",
            "reflection": "practice",
            "mentorship": "mentorship",
            "coaching_sim": "skill_assessment",
            "mentorship_sim": "mentorship",
            "custom": "practice"
        }
        session_mode = mode_mapping.get(scenario_type, "practice")
    logger.info(f"Session mode set to: {session_mode}")
    
    # Map scenario_type to mode for backward compatibility with roleplay prompts
    mode_map = {
        "coaching": "evaluation",      # Coaching scenarios get scores
        "negotiation": "evaluation",   # Negotiation scenarios get scores
        "mentorship": "mentorship",    # Mentorship scenarios are qualitative (no scores)
        "mentorship_sim": "mentorship",  # Mentorship simulations are qualitative (no scores)
        "reflection": "coaching",      # Reflection scenarios are qualitative
        "custom": "coaching"           # Custom scenarios default to coaching style
    }
    if not mode:
        mode = mode_map.get(scenario_type, "coaching")

    # Simulation-specific mode override (skip mentorship — they stay qualitative)
    if simulation_id and scenario_type not in ("mentorship", "mentorship_sim"):
        mode = "evaluation"
        logger.info(f"Simulation {simulation_id} detected, mode forced to evaluation")

    # Handle 'auto' framework selection
    needs_auto_framework = (framework == "auto" or framework == "AUTO")
    if not needs_auto_framework:
        if isinstance(framework, str): 
            framework = [framework.upper()]
        elif isinstance(framework, list): 
            framework = [f.upper() for f in framework]

    session_id = str(uuid.uuid4())
    
    # Get authenticated user from Authorization header
    try:
        user = get_authenticated_user(request)
    except Exception:
        user = None
    user_id = user.id if user is not None else None
    
    if not user_id:
        logger.info("[WARNING] Session created without user authentication")
    else:
        logger.info(f"Session created for user: {user_id}")
        user_email = getattr(user, 'email', None)
        
        # Global limit: restrict all users to 3 completed scenarios maximum
        max_sessions = 9999
        try:
            user_sessions_data = get_user_sessions_from_db(user_id, limit=1, completed_only=True)
            total_sessions = int(user_sessions_data.get("total", 0)) if isinstance(user_sessions_data, dict) else 0 # type: ignore
            
            if total_sessions >= max_sessions:
                logger.info(f"[BLOCKED] User '{user_email}' exceeded {max_sessions} completed session limit (current: {total_sessions}).")
                return JSONResponse(content={"error": f"Free Limit Reached ({max_sessions}/{max_sessions} sessions). Please contact sales to upgrade."}, status_code=403)
        except Exception as e:
            logger.info(f"[ERROR] Failed to verify session limit for {user_email}: {e}")
    
    ai_character = data.get("ai_character", "alex") # Default to Alex

    # Check if this simulation has a hardcoded opening (skip LLM call)
    HARDCODED_OPENINGS = {
        "SIM-01-PERF-001": "Thanks for taking time to meet me... I know my numbers haven't been great. I'm honestly trying, but this month also traffic was low. I'm not sure what else I can do.",
        "SIM-05-CON-001": "[Rohan]: Honestly, Meera, if you had just sent the reports on time last week, we wouldn't be in this mess. I'm tired of cleaning up your delays.\n[Meera]: Oh, come on, Rohan. You missed the deadline to review the data I sent. How can I be responsible when you don't do your part? This blame game isn't helping anyone.\n[Rohan]: It's not a game when it affects the whole team. You always find a way to shift responsibility.\n[Meera]: And you always jump to conclusions without checking facts. Maybe if you communicated better, we wouldn't have these issues.\n[Rohan]: Fine, but what do you suggest we do now? Because this back-and-forth isn't solving anything.",
        "MENT-05-CON-001": "[Manager]: Thank you both for coming. I've noticed the tension between you two has become visible to the team, and I think it's important we address it directly. I want to understand both perspectives. Let me start by asking \u2014 what's been the main challenge from your side?\n[Colleague]: Honestly, I think the delays are coming from their end. I've been sending my work on time, but I keep waiting for responses that never come. It's frustrating."
    }
    
    has_hardcoded = simulation_id in HARDCODED_OPENINGS
    
    # PARALLEL EXECUTION: Run framework selection + summary generation concurrently
    import time as _time
    _t_start = _time.time()
    
    if has_hardcoded and simulation_id:
        # Skip LLM summary call entirely for hardcoded simulations
        if needs_auto_framework:
            framework = select_framework_for_scenario(scenario or "", ai_role or "", simulation_id=simulation_id)
        summary = HARDCODED_OPENINGS.get(simulation_id, "")
        logger.info(f"[PERF] Used hardcoded opening for {simulation_id} - skipped LLM summary call")
    elif needs_auto_framework:
        # Run BOTH LLM calls in parallel (framework + summary)
        import asyncio
        ctx = usage_context(user.id, endpoint="start_session", model=CHAT_MODEL_NAME) if user is not None else nullcontext()
        with ctx:
            async def get_fw():
                return await asyncio.to_thread(select_framework_for_scenario, scenario or "", ai_role or "", simulation_id)

            async def get_summary():
                return await asyncio.to_thread(
                    llm_reply,
                    build_summary_prompt(role, ai_role, scenario, ["GROW", "EQ"], mode=mode, ai_character=ai_character, simulation_id=simulation_id),
                    max_tokens=150,
                    return_usage=True,
                    run_name="session_opening_parallel",
                    run_tags=["session_start", mode or "coaching"],
                    use_chat_model=True
                )

            framework, summary_tuple = await asyncio.gather(get_fw(), get_summary())

        if isinstance(summary_tuple, tuple):
            summary = sanitize_llm_output(summary_tuple[0])
        else:
            summary = sanitize_llm_output(summary_tuple)
        logger.info(f"[PERF] Parallel framework+summary completed in {_time.time()-_t_start:.2f}s")
    else:
        import asyncio
        ctx = usage_context(user.id, endpoint="start_session", model=CHAT_MODEL_NAME) if user is not None else nullcontext()
        with ctx:
            summary_tuple = await asyncio.to_thread(
                llm_reply,
                build_summary_prompt(role, ai_role, scenario, framework, mode=mode, ai_character=ai_character, simulation_id=simulation_id),
                max_tokens=150,
                return_usage=True,
                run_name="session_opening",
                run_tags=["session_start", mode or "coaching"],
                use_chat_model=True
            )
        if isinstance(summary_tuple, tuple):
            summary = summary_tuple[0]
            summary_usage = summary_tuple[1]
        else:
            summary = summary_tuple
            summary_usage = {}
        summary = sanitize_llm_output(summary)
        logger.info(f"[TOKEN] Summary call | request={summary_usage.get('request_tokens', 0)} response={summary_usage.get('response_tokens', 0)} total={summary_usage.get('total_tokens', 0)}")
        logger.info(f"[PERF] Sequential summary completed in {_time.time()-_t_start:.2f}s")
    
    # Determine if this is a multi-character scenario
    multi_characters = simulation_id in ("SIM-05-CON-001", "MENT-05-CON-001")
    characters_config = None
    if simulation_id == "SIM-05-CON-001":
        characters_config = [
            {"name": "Rohan", "label": "[Rohan]", "voice": "fable", "color": "blue"},
            {"name": "Meera", "label": "[Meera]", "voice": "nova", "color": "pink"}
        ]
    elif simulation_id == "MENT-05-CON-001":
        characters_config = [
            {"name": "Manager", "label": "[Manager]", "voice": "fable", "color": "blue"},
            {"name": "Colleague", "label": "[Colleague]", "voice": "nova", "color": "pink"}
        ]

    # Store session in memory with scenario_type, session_mode, and user_id
    session_data = {
        "id": session_id,
        "created_at": dt.datetime.now().isoformat(),

        "role": role,
        "ai_role": ai_role,
        "scenario": scenario,
        "title": title, # Store title
        "framework": json.dumps(framework) if isinstance(framework, list) else framework,
        "scenario_type": scenario_type,  # NEW: scenario-based report type
        "mode": mode,  # Legacy: kept for backward compatibility (evaluation vs coaching)
        "session_mode": session_mode,  # NEW: skill_assessment, practice, mentorship
        "transcript": [{"role": "assistant", "content": summary}],
        "report_data": None,
        "completed": False,
        "report_file": None,
        "user_id": user_id,  # Store user_id for ownership verification
        "ai_character": ai_character, # PERSIST CHARACTER CHOICE
        "simulation_id": simulation_id,  # Structured simulation identifier
        "multi_characters": multi_characters,  # Flag for dual-character scenarios
        "characters": characters_config,  # Character config for frontend
        "meta": {"framework_counts": {}, "relevance_issues": 0}
    }
    SESSIONS[session_id] = session_data
    # Save to Supabase immediately when session starts
    save_session_to_db(session_data)

    return ({
        "session_id": session_id, 
        "summary": summary, 
        "framework": framework, 
        "scenario_type": scenario_type,
        "session_mode": session_mode,
        "ai_character": ai_character,
        "multi_characters": multi_characters,
        "characters": characters_config
    })



@router.post("/session/{session_id}/chat")
async def chat(session_id: str, request: Request, _ = Depends(standard_limiter), _ai_limits = Depends(enforce_ai_rate_limits)):
    sess = get_session(session_id)
    if not sess: 
        return JSONResponse(content={"error": "Session not found"}, status_code=404)
    
    # 10-Minute Hard Limit Check
    import datetime as dt
    created_at_str = sess.get("created_at")
    if created_at_str:
        try:
            created_at = dt.datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
            # Make now timezone-aware if created_at is timezone-aware
            now = dt.datetime.now(dt.timezone.utc) if created_at.tzinfo else dt.datetime.now()
            if (now - created_at).total_seconds() > 600:
                return JSONResponse(content={"error": "Time limit exceeded. This session has exceeded the maximum duration of 10 minutes."}, status_code=403)
        except Exception as e:
            logger.error(f"Error parsing created_at timestamp: {e}")
            
    # Verify session ownership
    try:
        user = get_authenticated_user(request)
    except Exception:
        user = None
    session_user_id = sess.get("user_id")
    if session_user_id:
        if not user or session_user_id != user.id:
            return JSONResponse(content={"error": "Forbidden"}, status_code=403)
    elif not user:
        return JSONResponse(content={"error": "Unauthorized"}, status_code=401)
        
    if user is not None and not check_token_limit(user.id, MONTHLY_TOKEN_LIMIT):
        return JSONResponse(content={"error": f"Monthly token limit ({MONTHLY_TOKEN_LIMIT}) exceeded. Please try again next month."}, status_code=429)
    
    data = await request.json()
    if not data:
        return JSONResponse(content={"error": "Invalid JSON or Content-Type"}, status_code=400)

    user_msg = sanitize_input(normalize_text(data.get("message", "")), max_length=5000)
    audio_url = data.get("audio_url")
    
    # Update transcript
    sess["transcript"].append({
        "role": "user", 
        "content": user_msg,
        "audio_url": audio_url
    })

    # Parse framework
    framework_raw = sess.get("framework")
    try:
        if framework_raw and isinstance(framework_raw, str) and framework_raw.startswith("["):
            framework_data = json.loads(framework_raw)
        else:
            framework_data = framework_raw
    except (json.JSONDecodeError, TypeError, ValueError):
        framework_data = framework_raw
    
    if framework_data is None:
        framework_data = []

    active_fw = framework_data if isinstance(framework_data, list) else [framework_data]
    suggestions = get_relevant_questions(user_msg or "", active_fw)
    
    # Check for structured simulation follow-up first
    sim_id = sess.get("simulation_id")
    if sim_id:
        sim_messages = build_simulation_followup(sim_id, sess, user_msg, mode=sess.get("mode", "evaluation"))
        if sim_messages:
            messages = sim_messages
        else:
            messages = build_followup_prompt(sess, user_msg, suggestions)
    else:
        messages = build_followup_prompt(sess, user_msg, suggestions)
    
    turn_count = len([t for t in sess.get("transcript", []) if t.get("role") == "user"])
    stream = request.query_params.get("stream") == "true"
    
    if stream:
        async def event_generator():

            from cli_report import chat_llm
            full_raw_response = ""
            last_usage_metadata = None
            
            try:
                # Need to run astream in a separate thread or use the async client directly.
                # ChatOpenAI's astream works async native if setup correctly
                async for chunk in chat_llm.astream(messages, config={"run_name": f"chat_turn_{turn_count}"}):
                    last_usage_metadata = getattr(chunk, 'usage_metadata', None)
                    if chunk.content:
                        token = chunk.content
                        if isinstance(token, list):
                            token = "".join([t.get("text", "") if isinstance(t, dict) else t for t in token])
                        
                        # We assert or ensure it's a string to satisfy Pyright, though it already is.
                        full_raw_response += token
                        yield f"data: {json.dumps({'token': token})}\n\n"
            except Exception as e:
                logger.info(f"[STREAM ERROR] {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                return
                
            # Process complete response
            visible_response = re.sub(r"\[THOUGHT\].*?\[/THOUGHT\]", "", full_raw_response, flags=re.DOTALL).strip()
            clean_response = re.sub(r"<<.*?>>", "", visible_response, flags=re.DOTALL).strip()
            
            fw_match = re.search(r"<<FRAMEWORK:\s*(\w+)>>", full_raw_response)
            detected_fw = fw_match.group(1).upper() if fw_match else None
            if not detected_fw:
                detected_fw = detect_framework_fallback(clean_response)
            
            if detected_fw: 
                meta = sess.get("meta", {"framework_counts": {}, "relevance_issues": 0})
                counts = meta.get("framework_counts", {})
                counts[detected_fw] = counts.get(detected_fw, 0) + 1
                meta["framework_counts"] = counts
                sess["meta"] = meta
                
            # Record token usage for this streaming turn (exact when the provider reports it)
            if user is not None:
                last_usage = last_usage_metadata or {}
                inp = last_usage.get('input_tokens')
                out = last_usage.get('output_tokens')
                record_usage(
                    user.id,
                    endpoint="chat",
                    model=CHAT_MODEL_NAME,
                    input_tokens=inp if inp is not None else estimate_tokens(messages),
                    output_tokens=out if out is not None else estimate_tokens(full_raw_response),
                )

            sess["transcript"].append({"role": "assistant", "content": clean_response})
            save_session_to_db(sess)
            
            yield f"data: {json.dumps({'done': True, 'follow_up': clean_response, 'framework_detected': detected_fw})}\n\n"
            
        return StreamingResponse(event_generator(), media_type="text/event-stream")
    
    # -------------------------------------------------------------
    # Legacy blocking mode (Fallback)
    # -------------------------------------------------------------
    from graph import app_graph
    
    graph_state: Any = await asyncio.to_thread(
        app_graph.invoke,
        {
            "messages": messages,
            "turn_count": turn_count,
            "mode": sess.get('mode', 'coaching'),
            "session_id": session_id
        },
        config={
            "run_name": f"CoAct_Chat_Turn_{turn_count}",
            "tags": ["langgraph", f"session:{session_id}"]
        }
    )
    
    raw_response = graph_state["raw_response"]
    token_usage = graph_state["token_usage"]
    logger.info(f"[TOKEN] Chat turn {turn_count} | request={token_usage['request_tokens']} response={token_usage['response_tokens']} total={token_usage['total_tokens']} | {len(messages)} messages")
    
    if user is not None:
        record_usage(
            user.id,
            endpoint="chat",
            model=CHAT_MODEL_NAME,
            input_tokens=token_usage.get('request_tokens', 0),
            output_tokens=token_usage.get('response_tokens', 0),
        )
    
    # 1. Remove Thought
    visible_response = re.sub(r"\[THOUGHT\].*?\[/THOUGHT\]", "", raw_response, flags=re.DOTALL).strip()
    
    # 3. Clean tags
    clean_response = re.sub(r"<<.*?>>", "", visible_response, flags=re.DOTALL).strip()
    
    fw_match = re.search(r"<<FRAMEWORK:\s*(\w+)>>", raw_response)
    detected_fw = fw_match.group(1).upper() if fw_match else None
    
    if not detected_fw:
        detected_fw = detect_framework_fallback(clean_response)
    
    if detected_fw: 
        meta = sess.get("meta", {"framework_counts": {}, "relevance_issues": 0})
        counts = meta.get("framework_counts", {})
        counts[detected_fw] = counts.get(detected_fw, 0) + 1
        meta["framework_counts"] = counts
        sess["meta"] = meta
        
    # Persist in memory and save to database after each turn
    sess["transcript"].append({"role": "assistant", "content": clean_response})
    save_session_to_db(sess)
 
    return ({
        "follow_up": clean_response, 
        "framework_detected": detected_fw,
        "framework_counts": sess.get("meta", {}).get("framework_counts", {})
    })

def run_report_generation(session_id: str, sess: dict, fw_display: str, mode: str, scenario_type: str):
    logger.info(f"[COST] Generating report data for {session_id} (scenario_type: {scenario_type}) in background...")
    # Fail fast on missing API key instead of burning retries and returning an empty report
    groq_key = os.getenv("GROQ_API_KEY", "")
    if not groq_key or groq_key in ("not-needed", "your_groq_api_key_here"):
        logger.error(f" [ERROR] GROQ_API_KEY not configured; skipping report generation for {session_id}")
        sess["report_status"] = "error"
        save_session_to_db(sess)
        return
    try:
        if sess.get("report_data"):
            logger.info(f"Report data already present for {session_id}; skipping generation.")
            return
        session_mode = sess.get("session_mode")
        is_mentorship = (session_mode == "mentorship" or mode == "mentorship" or str(scenario_type).lower().strip() == "mentorship")
        
        if is_mentorship:
            from mentorship_report import analyze_mentorship_report_data
            data = analyze_mentorship_report_data(
                sess["transcript"],
                sess["role"],
                sess["ai_role"],
                sess["scenario"],
                scenario_type=scenario_type,
                ai_character=sess.get("ai_character", "alex"),
                session_mode=session_mode
            )
        else:
            data = analyze_full_report_data(
                sess["transcript"], 
                sess["role"], 
                sess["ai_role"], 
                sess["scenario"],
                fw_display,
                mode=mode,
                scenario_type=scenario_type,
                ai_character=sess.get("ai_character", "alex"),
                session_mode=session_mode
            )
        sess["report_data"] = data
        sess["report_status"] = "ready"
        sess["completed"] = True
        sess["report_file"] = "dynamic"
        save_session_to_db(sess) # Save completed status and report_data to Supabase
        logger.info(f"Report generated for {session_id}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.info(f" [ERROR] Data generation failed for {session_id}: {e}")
        sess["report_status"] = "error"
        save_session_to_db(sess)

_pending_report_generations: set[str] = set()
_report_generation_spawn_lock = asyncio.Lock()


async def _run_report_generation(session_id: str, fw_display: str, mode: str, scenario_type: str):
    """Schedule report generation off the event loop, deduped per session."""
    async with _report_generation_spawn_lock:
        if session_id in _pending_report_generations:
            logger.info(f"Report generation already in progress for {session_id}; skipping duplicate.")
            return
        _pending_report_generations.add(session_id)
    try:
        sess = get_session(session_id)
        if sess is None or sess.get("report_data"):
            return
        # LLM calls + JSON assembly are CPU/IO-heavy and blocking; run off the event loop.
        # When the session belongs to a user, account its report tokens under their quota.
        sess_user_id = sess.get("user_id")
        ctx = usage_context(sess_user_id, endpoint="report_generation") if sess_user_id else nullcontext()
        with ctx:
            await asyncio.to_thread(run_report_generation, session_id, sess, fw_display, mode, scenario_type)
    finally:
        async with _report_generation_spawn_lock:
            _pending_report_generations.discard(session_id)

@router.post("/session/{session_id}/complete")
async def complete_session(session_id: str, request: Request, background_tasks: BackgroundTasks, _ai_limits = Depends(enforce_ai_rate_limits)):
    sess = get_session(session_id)
    if not sess: 
        return JSONResponse(content={"error": "Not found"}, status_code=404)
    
    # Verify session ownership
    try:
        user = get_authenticated_user(request)
    except Exception:
        user = None
    session_user_id = sess.get("user_id")
    if session_user_id:
        if not user or session_user_id != user.id:
            return JSONResponse(content={"error": "Forbidden"}, status_code=403)
    elif not user:
        return JSONResponse(content={"error": "Unauthorized"}, status_code=401)
        
    if user is not None and not check_token_limit(user.id, MONTHLY_TOKEN_LIMIT):
        return JSONResponse(content={"error": f"Monthly token limit ({MONTHLY_TOKEN_LIMIT}) exceeded. Please try again next month."}, status_code=429)
    
    try:
        framework_data = json.loads(sess["framework"]) if sess["framework"] and sess["framework"].startswith("[") else sess["framework"]
    except (json.JSONDecodeError, TypeError, ValueError):
        framework_data = sess["framework"]

    if isinstance(framework_data, list):
        counts = sess.get("meta", {}).get("framework_counts", {})
        usage_str = ", ".join([f"{k}:{v}" for k,v in counts.items()])
        fw_display = f"Multi-Framework ({usage_str})"
    else:
        fw_display = sess["framework"]

    # Get scenario_type (new) or fallback to mode (legacy)
    scenario_type = sess.get("scenario_type") or "custom"
    mode = sess.get("mode", "coaching")
    
    # Fetch user name for report personalization (cache in session to avoid re-fetching)
    user_name = sess.get("user_name", "Valued User")
    if user_name == "Valued User":
        # Use authenticated user email as fallback for name
        try:
            user_obj = get_authenticated_user(request)
        except Exception:
            user_obj = None
        if user_obj and user_obj.email:
            user_name = user_obj.email
            logger.info(f" [SUCCESS] Resolved user name from auth: {user_name}")
        sess["user_name"] = user_name
    
    # Run in background if not already generated (deduped + threadpooled)
    if not sess.get("report_data"):
        sess["report_status"] = "generating"
        save_session_to_db(sess)
        background_tasks.add_task(_run_report_generation, session_id, fw_display, mode, scenario_type)
    else:
        sess["report_status"] = "ready"
        sess["completed"] = True
        save_session_to_db(sess)
    
    return {"message": "Report generation started", "status": "generating", "scenario_type": scenario_type}

@router.get("/session/{session_id}/report-status")
async def report_status(session_id: str, request: Request):
    try:
        user = get_authenticated_user(request)
    except Exception:
        user = None

    sess = get_session(session_id)
    if not sess:
        return JSONResponse(content={"error": "Not found"}, status_code=404)

    session_user_id = sess.get("user_id")
    if session_user_id:
        if not user:
            return JSONResponse(content={"error": "Unauthorized"}, status_code=401)
        if session_user_id != user.id:
            return JSONResponse(content={"error": "Forbidden"}, status_code=403)

    return {
        "status": sess.get("report_status", "unknown"),
        "ready": sess.get("report_data") is not None
    }

@router.get("/report/{session_id}")
async def view_report(session_id: str, request: Request):
    # --- AUTHENTICATE USER (matches get_report_data logic) ---
    try:
        user = get_authenticated_user(request)
    except Exception:
        user = None
    
    sess = get_session(session_id)
    if not sess: 
        return JSONResponse(content={"error": "No report"}, status_code=404)
    
    # Verify ownership if session has a user_id
    session_user_id = sess.get("user_id")
    if session_user_id:
        if not user:
            return JSONResponse(content={"error": "Unauthorized: This session requires authentication"}, status_code=401)
        if session_user_id != user.id:
            return JSONResponse(content={"error": "Forbidden: This session belongs to another user"}, status_code=403)
        
    # If report_data is missing, maybe another worker completed it. Force a refresh from DB.
    if not sess.get("report_data"):
        sess = get_session(session_id, force_db_refresh=True)
    
    if not sess or not sess.get("report_data"):
        return JSONResponse(content={"error": "Report data not available yet"}, status_code=400)
        
    import tempfile
    
    try:
        # Safely get framework (may be None when loaded from DB)
        raw_framework = sess.get("framework") or ""
        try:
            framework_data = json.loads(raw_framework) if raw_framework and raw_framework.startswith("[") else raw_framework
        except (json.JSONDecodeError, TypeError, ValueError):
            framework_data = raw_framework

        if isinstance(framework_data, list):
            counts = (sess.get("meta") or {}).get("framework_counts", {})
            usage_str = ", ".join([f"{k}:{v}" for k,v in counts.items()])
            fw_display = f"Multi-Framework ({usage_str})"
        else:
            fw_display = framework_data or "N/A"

        scenario_type = sess.get("scenario_type")
        mode = sess.get("mode") or "coaching"
        
        # Use cached user_name from session (set during complete_session)
        user_name = sess.get("user_name", "Valued User")
                
        # Generate to temporary file, read as bytes, and delete
        tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
        tmp.close()
        try:
            # PDF generation is CPU-bound; run off the event loop.
            await asyncio.to_thread(
                generate_report,
                sess.get("transcript", []),
                sess.get("role", "User"),
                sess.get("ai_role", "AI"),
                sess.get("scenario", ""),
                fw_display,
                filename=tmp.name,
                mode=mode,
                precomputed_data=sess["report_data"],
                scenario_type=scenario_type,
                user_name=user_name,
                ai_character=sess.get("ai_character", "alex"),
                session_mode=sess.get("session_mode"),
            )
            with open(tmp.name, "rb") as f:
                pdf_bytes = f.read()
        finally:
            os.unlink(tmp.name)
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type='application/pdf',
            headers={
                "Content-Disposition": f"attachment; filename={session_id}_report.pdf",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        logger.error(f"PDF generation failed for {session_id}: {e}", exc_info=True)
        return JSONResponse(
            content={"error": "Failed to generate PDF report"},
            status_code=500
        )

def _build_comparison(sess, response, session_id):
    """Build a comparison object against the user's previous attempt at the same simulation."""
    try:
        user_id = sess.get("user_id")
        title = sess.get("title")
        if not user_id or not title:
            return None

        prev = get_previous_session_scores(user_id, title, session_id)
        if not prev:
            return None

        prev_score = prev.get("score")
        prev_report = prev.get("report_data") or {}
        if isinstance(prev_report, str):
            try:
                prev_report = json.loads(prev_report)
            except (json.JSONDecodeError, TypeError, ValueError):
                prev_report = {}

        # Current score
        current_score = None
        if response.get("meta", {}).get("overall_grade"):
            grade_str = response["meta"]["overall_grade"]
            if "/" in str(grade_str):
                try:
                    current_score = float(str(grade_str).split("/")[0].strip())
                except (ValueError, IndexError):
                    pass
        if current_score is None:
            current_score = sess.get("score")

        if current_score is None and prev_score is None:
            return None

        score_change = None
        if current_score is not None and prev_score is not None:
            score_change = round(current_score - prev_score, 1)

        # Per-dimension comparison from scorecards
        dimension_deltas = []
        current_scorecard = response.get("scorecard", [])
        prev_scorecard = prev_report.get("scorecard", [])
        
        if current_scorecard and prev_scorecard:
            prev_map = {}
            for item in prev_scorecard:
                dim = item.get("dimension", "")
                sc = item.get("score", "0")
                try:
                    prev_map[dim] = float(str(sc).split("/")[0].strip())
                except (ValueError, IndexError):
                    pass

            for item in current_scorecard:
                dim = item.get("dimension", "")
                sc = item.get("score", "0")
                try:
                    curr_val = float(str(sc).split("/")[0].strip())
                except (ValueError, IndexError):
                    continue
                if dim in prev_map:
                    delta = round(curr_val - prev_map[dim], 1)
                    dimension_deltas.append({
                        "dimension": dim,
                        "previous": prev_map[dim],
                        "current": curr_val,
                        "change": delta
                    })

        result = {
            "has_previous": True,
            "previous_score": prev_score,
            "current_score": current_score,
            "score_change": score_change,
            "previous_date": prev.get("created_at"),
            "dimension_deltas": dimension_deltas
        }
        logger.info(f" [COMPARISON] Previous attempt found for '{title}': {prev_score} -> {current_score} (change: {score_change})")
        return result

    except Exception as e:
        logger.info(f" [ERROR] Comparison build failed: {e}")
        return None

@router.get("/session/{session_id}/report_data")
async def get_report_data(session_id: str, request: Request):
    # 1. AUTHENTICATE USER
    try:
        user = get_authenticated_user(request)
    except Exception:
        return JSONResponse(content={"error": "Unauthorized"}, status_code=401)
    
    # 2. VERIFY OWNERSHIP
    sess = SESSIONS.get(session_id)
    if sess:
        session_user_id = sess.get("user_id")
        if session_user_id and session_user_id != user.id:
            return JSONResponse(content={"error": "Forbidden"}, status_code=403)
        if not session_user_id:
            sess["user_id"] = user.id
    else:
        if USE_DATABASE:
            db_sess = get_session_from_db(session_id)
            if not db_sess:
                return JSONResponse(content={"error": "Session not found"}, status_code=404)
            if db_sess.get("user_id") and str(db_sess.get("user_id")) != user.id:
                return JSONResponse(content={"error": "Forbidden"}, status_code=403)
            sess = db_sess
            SESSIONS[session_id] = sess
        else:
             return JSONResponse(content={"error": "Session not found"}, status_code=404)


    # If report_data is missing but the session exists, force a DB refresh
    # in case a different worker generated the report and saved it to the DB.
    if not sess.get("report_data") and USE_DATABASE:
        refreshed = get_session_from_db(session_id)
        if refreshed:
            sess = refreshed
            SESSIONS[session_id] = sess
            
    # Return cached data if available
    if isinstance(sess, dict) and sess.get("report_data"):
        response: dict = sess["report_data"].copy() if isinstance(sess["report_data"], dict) else {}
        response["transcript"] = sess.get("transcript")
        response["scenario"] = sess.get("scenario") or "No context available."
        response["scenario_type"] = sess.get("scenario_type", response.get("scenario_type", "custom"))
        # Inject session_mode so frontend can distinguish assessment from mentorship
        if "meta" not in response:
            response["meta"] = {}
        if isinstance(response["meta"], dict):
            response["meta"]["session_mode"] = sess.get("session_mode", "skill_assessment")
        # Inject comparison with previous attempt
        response["comparison"] = _build_comparison(sess, response, session_id)
        return response
    # If we get here, report_data is not present yet (it's either generating or failed)
    status = sess.get("report_status", "unknown") if isinstance(sess, dict) else "unknown"
    if status == "error":
        return JSONResponse(content={"error": "Report generation failed. Please try again."}, status_code=500)
    return JSONResponse(content={"message": "Report data is still generating..."}, status_code=202)
@router.get("/sessions")
async def get_sessions(request: Request):
    """Return sessions for the authenticated user sorted by date (newest first)."""
    user = get_authenticated_user(request)
    if not user:
        return JSONResponse(content={"error": "Unauthorized"}, status_code=401)
    
    try:
        user_id_str = user.id
        session_list = []
        for sess in SESSIONS.values():
            if str(sess.get("user_id", "")) != user_id_str:
                continue
            session_list.append({
                "id": sess["id"],
                "created_at": sess["created_at"],
                "role": sess["role"],
                "ai_role": sess["ai_role"],
                "scenario": sess["scenario"],
                "title": sess.get("title"),
                "completed": sess["completed"],
                "report_file": sess["report_file"],
                "framework": sess["framework"],
                "score": (lambda rd: float(str(rd.get("meta", {}).get("overall_grade", "0")).split("/")[0].strip()) if rd and "/" in str(rd.get("meta", {}).get("overall_grade", "")) else 0)(sess.get("report_data", {}))
            })
        session_list.sort(key=lambda x: x["created_at"], reverse=True)
        return session_list
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.get("/user/sessions")
async def get_user_sessions_paginated(request: Request):
    """Get paginated sessions for authenticated user.
    
    OPTIMIZATION: Returns only requested page of sessions instead of all.
    Query params: limit (default 20, max 100), offset (default 0)
    """
    try:
        user = get_authenticated_user(request)
        if not user:
            return JSONResponse(content={"error": "Unauthorized"}, status_code=401)
        
        # Get pagination parameters
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        
        # Validate pagination params
        limit = min(limit, 100)  # Max 100 per page
        limit = max(limit, 1)    # Min 1 per page
        offset = max(offset, 0)  # No negative offsets
        
        # Get paginated sessions from database
        data = get_user_sessions_from_db(user.id, limit=limit, offset=offset)
        
        return JSONResponse(content=data, status_code=200)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.info(f"[ERROR] Failed to get user sessions: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@router.post("/sessions/clear")
async def clear_sessions(request: Request):
    """Clear session history for the authenticated user."""
    user = get_authenticated_user(request)
    if not user:
        return JSONResponse(content={"error": "Unauthorized"}, status_code=401)
    
    try:
        clear_user_sessions_from_db(user.id)
        
        # Remove from memory as well
        keys_to_delete = [k for k, v in SESSIONS.items() if str(v.get("user_id")) == user.id]
        for k in keys_to_delete:
            del SESSIONS[k]
        logger.info(f" [SUCCESS] Sessions cleared for user {user.id}")
        return {"message": "History cleared successfully"}
    except Exception as e:
        logger.info(f" [ERROR] Error clearing sessions: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)


# ---------------------------------------------------------
# Analytics Endpoint
# ---------------------------------------------------------
@router.get("/analytics")
async def get_analytics(request: Request):
    """Compute progress analytics for the authenticated user.
    
    Returns: performance_trend, all_time_average, consistency_index,
    strongest_skills, weakest_skills, session_counts, improvement_status.
    """
    user = get_authenticated_user(request)
    if not user:
        return JSONResponse(content={"error": "Unauthorized"}, status_code=401)
    
    try:
        import statistics
        
        rows = get_user_analytics_from_db(user.id)
        if not rows:
            return ({
                "performance_trend": [],
                "all_time_average": 0,
                "consistency_index": 0,
                "strongest_skills": [],
                "weakest_skills": [],
                "session_counts": {"total": 0},
                "improvement_status": "no_data",
                "activity_heatmap": {},
                "current_streak": 0,
                "best_streak": 0,
                "next_best_action": None
            })
        
        # --- Performance Trend (last 10 sessions, chronological) ---
        scored_sessions = [r for r in rows if r.get("score") and float(r["score"]) > 0]
        trend_sessions = scored_sessions[:10]  # Already desc from DB
        trend_sessions.reverse()  # Chronological order for chart
        performance_trend = [{
            "date": r.get("created_at", ""),
            "score": float(r["score"]),
            "scenario_type": r.get("scenario_type", "custom")
        } for r in trend_sessions]
        
        # --- All-Time Average ---
        all_scores = [float(r["score"]) for r in scored_sessions]
        all_time_average = round(statistics.mean(all_scores), 2) if all_scores else 0
        
        # --- Consistency Index: 100 - (std_dev * 20), clamped 0-100 ---
        if len(all_scores) >= 2:
            std_dev = statistics.stdev(all_scores)
            consistency_index = round(max(0, min(100, 100 - (std_dev * 20))), 1)
        else:
            consistency_index = 100.0 if all_scores else 0
        
        # --- Strongest / Weakest Skills (aggregate scorecard dimensions) ---
        dimension_scores = {}  # {"Empathy": [8, 7, 9], ...}
        for r in rows:
            rd = r.get("report_data")
            if not rd or not isinstance(rd, dict):
                continue
            scorecard = rd.get("scorecard", [])
            if not isinstance(scorecard, list):
                continue
            for item in scorecard:
                dim = item.get("dimension", "")
                score_str = str(item.get("score", "0"))
                try:
                    score_val = float(score_str.split("/")[0].strip())
                    if score_val > 0:
                        dimension_scores.setdefault(dim, []).append(score_val)
                except (ValueError, IndexError):
                    continue
        
        # Compute averages per dimension
        dim_averages = []
        for dim, scores in dimension_scores.items():
            avg = round(statistics.mean(scores), 2)
            dim_averages.append({"dimension": dim, "average": avg, "count": len(scores)})
        
        dim_averages.sort(key=lambda x: x["average"], reverse=True)
        strongest_skills = dim_averages[:3]
        weakest_skills = sorted(dim_averages, key=lambda x: x["average"])[:3]
        
        # --- Session Counts ---
        session_counts = {"total": len(rows)}
        for r in rows:
            st = r.get("scenario_type", "custom")
            session_counts[st] = session_counts.get(st, 0) + 1
        
        # --- Improvement Status ---
        if len(all_scores) >= 4:
            recent_avg = statistics.mean(all_scores[:3])  # Most recent 3
            older_avg = statistics.mean(all_scores[3:])
            if recent_avg > older_avg + 0.3:
                improvement_status = "improving"
            elif recent_avg < older_avg - 0.3:
                improvement_status = "declining"
            else:
                improvement_status = "stable"
        elif all_scores:
            improvement_status = "insufficient_data"
        else:
            improvement_status = "no_data"

        # --- Repeated Scenarios (Scenario Mastery) ---
        scenario_history = {}  # type: ignore
        # scored_sessions is currently desc. Reverse it to chronologial (oldest first)
        for r in reversed(scored_sessions): 
            title = r.get("title")
            if title:
                if title not in scenario_history:
                    scenario_history[title] = []
                scenario_history[title].append(float(r["score"]))

        repeated_scenarios = []
        for title, scores in scenario_history.items():
            if isinstance(scores, list) and len(scores) >= 2:
                first_score = scores[0]
                latest_score = scores[-1]
                change = round(latest_score - first_score, 1)
                repeated_scenarios.append({
                    "title": title,
                    "attempts": len(scores),
                    "first_score": round(first_score, 1),
                    "latest_score": round(latest_score, 1),
                    "change": change
                })
        
        # Sort by those with the most positive change first
        repeated_scenarios.sort(key=lambda x: x["change"], reverse=True)
        
        # --- Activity Heatmap & Streaks ---
        from datetime import datetime, timedelta
        
        activity_heatmap = {}
        practice_dates = set()
        
        for r in rows:
            created_at = r.get("created_at")
            if created_at:
                try:
                    # Parse ISO format, replacing Z if needed
                    date_obj = datetime.fromisoformat(created_at.replace("Z", "+00:00")).date()
                    date_str = date_obj.isoformat()
                    activity_heatmap[date_str] = activity_heatmap.get(date_str, 0) + 1
                    practice_dates.add(date_obj)
                except Exception:
                    pass
        
        current_streak = 0
        best_streak = 0
        
        if practice_dates:
            sorted_dates = sorted(list(practice_dates), reverse=True)
            today = datetime.now().date()
            
            # Current streak
            check_date = today
            if check_date not in sorted_dates:
                # If they haven't practiced today, check if they practiced yesterday
                check_date = today - timedelta(days=1)
                
            if check_date in sorted_dates:
                current_streak = 1
                curr_check = check_date - timedelta(days=1)
                while curr_check in practice_dates:
                    current_streak += 1
                    curr_check -= timedelta(days=1)
            
            # Best streak
            sorted_asc = sorted(list(practice_dates))
            best_streak = 1
            temp_streak = 1
            for i in range(1, len(sorted_asc)):
                if (sorted_asc[i] - sorted_asc[i-1]).days == 1:
                    temp_streak += 1
                    if temp_streak > best_streak:
                        best_streak = temp_streak
                else:
                    temp_streak = 1
        
        # --- Next Best Action ---
        next_best_action = None
        if weakest_skills:
            lowest_skill = weakest_skills[0]["dimension"]
            next_best_action = f"Your weakest skill is {lowest_skill}. Focus on improving this area in your next practice session."
        
        return ({
            "performance_trend": performance_trend,
            "all_time_average": all_time_average,
            "consistency_index": consistency_index,
            "strongest_skills": strongest_skills,
            "weakest_skills": weakest_skills,
            "session_counts": session_counts,
            "improvement_status": improvement_status,
            "repeated_scenarios": repeated_scenarios,
            "activity_heatmap": activity_heatmap,
            "current_streak": current_streak,
            "best_streak": best_streak,
            "next_best_action": next_best_action
        })
    except Exception as e:
        logger.info(f"[ERROR] Analytics computation failed: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)


import asyncio
import re
import tempfile


@router.websocket("/session/{session_id}/live")
async def live_session_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()

    # Authenticate WebSocket connection via token query parameter
    token = websocket.query_params.get("token")
    ws_user = None
    if token:
        try:
            import jwt as _jwt
            from core.config import JWT_SECRET
            payload = _jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("sub")
            if user_id:
                from database import get_user_by_id
                ws_user = get_user_by_id(user_id)
        except Exception:
            pass

    # Verify session ownership before processing
    sess_check = get_session_from_db(session_id)
    if not sess_check:
        await websocket.send_json({"type": "error", "error": "Session not found"})
        await websocket.close(code=4004)
        return
    sess_user_id = sess_check.get("user_id")
    if sess_user_id:
        if not ws_user or ws_user["id"] != sess_user_id:
            await websocket.send_json({"type": "error", "error": "Unauthorized"})
            await websocket.close(code=4003)
            return

    audio_buffer = bytearray()
    
    tts_queue = asyncio.Queue()
    
    async def tts_worker():
        while True:
            sentence = await tts_queue.get()
            if sentence is None:
                break
                
            try:
                sarvam_key = os.getenv("SARVAM_API_KEY", "")
                if not sarvam_key or sarvam_key == "your_sarvam_api_key_here":
                    logger.warning("TTS Worker skipped: SARVAM_API_KEY not configured")
                    continue
                    
                payload = {
                    "inputs": [sentence[:500]],
                    "target_language_code": "en-IN",
                    "speaker": "aditya",
                    "pace": 1.0,
                    "speech_sample_rate": 22050,
                    "enable_preprocessing": True,
                    "model": "bulbul:v3"
                }
                headers = {
                    "api-subscription-key": sarvam_key,
                    "Content-Type": "application/json"
                }
                
                if False:
                    raise RuntimeError("Shared HTTPX client is not initialized")
                resp = await get_httpx_client().post("https://api.sarvam.ai/text-to-speech", json=payload, headers=headers, timeout=30.0)
                if resp.status_code == 200:
                    resp_data = resp.json()
                    b64_audio = resp_data.get("audios", [""])[0]
                    if b64_audio:
                        await websocket.send_json({"type": "tts_audio", "audio": b64_audio})
                else:
                    logger.error(f"Sarvam API Error in TTS Worker: {resp.status_code} {resp.text}")
            except Exception as e:
                logger.error(f"TTS Worker Error: {e}")
            finally:
                tts_queue.task_done()

    tts_task = asyncio.create_task(tts_worker())

    try:
        from cli_report import chat_llm
        while True:
            message = await websocket.receive()
            
            if "bytes" in message and message["bytes"]:
                audio_buffer.extend(message["bytes"])
                
            elif "text" in message and message["text"]:
                data = json.loads(message["text"])
                if data.get("type") == "speech_end":
                    if len(audio_buffer) < 500:
                        continue
                        
                    # 1. Transcribe using Groq Whisper API
                    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp_audio:
                        tmp_audio.write(audio_buffer)
                        tmp_audio_path = tmp_audio.name
                        
                    audio_buffer = bytearray()
                    await websocket.send_json({"type": "status", "status": "transcribing"})
                    
                    groq_api_key = os.getenv("GROQ_API_KEY", "")
                    groq_whisper_model = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3-turbo")
                    with open(tmp_audio_path, "rb") as f:
                        if False:
                            raise Exception("Shared HTTPX client not initialized")
                        resp = await get_httpx_client().post(
                            "https://api.groq.com/openai/v1/audio/transcriptions",
                            headers={"Authorization": f"Bearer {groq_api_key}"},
                            files={"file": (os.path.basename(tmp_audio_path), f, "audio/webm")},
                            data={
                                "model": groq_whisper_model,
                                "response_format": "json",
                                "language": "en",
                                "temperature": "0.0"
                            },
                            timeout=60.0
                        )
                    os.unlink(tmp_audio_path)
                    
                    transcribed_text = resp.json().get("text", "").strip()
                    
                    # Filter out common Whisper hallucinations
                    lower_text = transcribed_text.lower()
                    hallucinations = ["thank you", "thanks for watching", "please subscribe", "professional roleplay", "between a coach", "next stage", "great time to do this", "amara.org", "subtitle"]
                    if any(h in lower_text for h in hallucinations) and len(transcribed_text) < 150:
                        transcribed_text = ""
                        
                    if not transcribed_text:
                        await websocket.send_json({"type": "status", "status": "listening"})
                        continue
                        
                    await websocket.send_json({"type": "stt", "text": transcribed_text})
                    await websocket.send_json({"type": "status", "status": "thinking"})
                    
                    # 2. Get DB Session and build prompt
                    sess = get_session_from_db(session_id)
                    if not sess:
                        await websocket.send_json({"type": "error", "error": "Session not found"})
                        continue

                    # Enforce per-user AI usage limits before spending LLM tokens
                    sess_user_id = sess.get("user_id")
                    if sess_user_id:
                        denied = check_and_consume(sess_user_id)
                        if denied is not None:
                            await websocket.send_json({
                                "type": "limit_reached",
                                "limit_type": denied.get("limit_type"),
                                "limit": denied.get("limit"),
                                "used": denied.get("used"),
                                "remaining": denied.get("remaining"),
                                "retry_after": denied.get("retry_after"),
                                "message": denied.get("message"),
                            })
                            continue

                    sess.setdefault("transcript", []).append({"role": "user", "content": transcribed_text})  # type: ignore
                    messages = build_followup_prompt(sess, transcribed_text, [])
                    
                    # 3. Stream LLM
                    sentence_buffer = ""
                    full_response = ""
                    last_usage_metadata = None
                    async for chunk in chat_llm.astream(messages):
                        last_usage_metadata = getattr(chunk, 'usage_metadata', None)
                        token = chunk.content
                        if isinstance(token, list):
                            token = "".join([t.get("text", "") if isinstance(t, dict) else t for t in token])
                            
                        await websocket.send_json({"type": "llm_token", "text": token})
                        sentence_buffer += token
                        full_response += token
                        
                        match = re.search(r'([.!??]+)', sentence_buffer)
                        if match:
                            split_idx = match.end()
                            complete_sentence = sentence_buffer[:split_idx].strip()
                            sentence_buffer = sentence_buffer[split_idx:].strip()
                            if len(complete_sentence) > 2:
                                await tts_queue.put(complete_sentence)
                                
                    if len(sentence_buffer.strip()) > 2:
                        await tts_queue.put(sentence_buffer.strip())

                    # Account tokens for this voice turn (exact when the provider reports them)
                    if sess_user_id:
                        last_usage = last_usage_metadata or {}
                        inp = last_usage.get('input_tokens')
                        out = last_usage.get('output_tokens')
                        record_usage(
                            sess_user_id,
                            endpoint="chat",
                            model=CHAT_MODEL_NAME,
                            input_tokens=inp if inp is not None else estimate_tokens(messages),
                            output_tokens=out if out is not None else estimate_tokens(full_response),
                        )

                    # Save AI response
                    sess["transcript"].append({"role": "ai", "content": full_response})  # type: ignore
                    save_session_to_db(sess)
                    
                    await websocket.send_json({"type": "status", "status": "listening"})

    except WebSocketDisconnect:
        pass
    finally:
        await tts_queue.put(None)
        await tts_task


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    is_dev = os.getenv("FLASK_ENV", "production") == "development"
    
    import uvicorn
    logger.info(f"Starting Uvicorn ASGI server on port {port}...")
    uvicorn.run("app:app", host="0.0.0.0", port=port, workers=1, log_level="info")