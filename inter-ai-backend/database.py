import os
import json
import gzip
import base64
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Text, Float, Boolean, JSON, Integer
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")

engine = create_engine(DATABASE_URL)
db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

Base = declarative_base()

class SQLAlchemyWrapper:
    def __init__(self, session):
        self.session = session

db = SQLAlchemyWrapper(db_session)

class PracticeHistory(Base):
    __tablename__ = 'practice_history'
    session_id = Column(String(255), primary_key=True)
    user_id = Column(String(255), nullable=False)
    scenario_type = Column(String(50))
    session_mode = Column(String(50))
    title = Column(String(255))
    ai_character = Column(String(50))
    mode = Column(String(50))
    role = Column(String(100))
    ai_role = Column(String(100))
    scenario = Column(Text)
    framework = Column(JSON)
    transcript = Column(JSON)
    report_data = Column(JSON)
    completed = Column(Boolean, default=False)
    score = Column(Float)
    created_at = Column(String(255))
    updated_at = Column(String(255))

class UserTokenUsage(Base):
    __tablename__ = 'user_token_usage'
    user_id = Column(String(255), primary_key=True)
    date = Column(String(255), primary_key=True)  # YYYY-MM-DD
    tokens_used = Column(Integer, default=0)
    updated_at = Column(String(255))

# ---------------------------------------------------------
# Transcript Compression Utilities
# ---------------------------------------------------------
def compress_transcript(transcript: list) -> str:
    try:
        json_str = json.dumps(transcript)
        compressed = gzip.compress(json_str.encode('utf-8'))
        encoded = base64.b64encode(compressed).decode('utf-8')
        
        original_size = len(json_str.encode('utf-8'))
        compressed_size = len(compressed)
        ratio = (1 - compressed_size / original_size) * 100 if original_size > 0 else 0
        
        print(f"[COMPRESSION] Transcript: {original_size}B -> {compressed_size}B ({ratio:.1f}% reduction)")
        return encoded
    except Exception as e:
        print(f"[COMPRESSION] Error compressing transcript: {e}")
        return json.dumps(transcript)

def decompress_transcript(compressed) -> list:
    if not compressed:
        return []
    
    try:
        if isinstance(compressed, dict) and "_compressed" in compressed:
            compressed = compressed["_compressed"]
        
        if isinstance(compressed, list):
            return compressed

        if isinstance(compressed, str) and len(compressed) > 50:
            try:
                decoded = base64.b64decode(compressed.encode('utf-8'))
                decompressed = gzip.decompress(decoded)
                return json.loads(decompressed.decode('utf-8'))
            except:
                pass
        
        if isinstance(compressed, str):
            return json.loads(compressed)
        
        return compressed
    except Exception as e:
        print(f"[COMPRESSION] Error decompressing transcript: {e}")
        return []

# ---------------------------------------------------------
# Database Operations
# ---------------------------------------------------------
def save_session_to_db(session_data):
    session_id = session_data.get("id")
    user_id = session_data.get("user_id")
    
    if not session_id or not user_id:
        return False
        
    try:
        transcript_original = session_data.get("transcript", [])
        transcript_compressed = compress_transcript(transcript_original)
        transcript_jsonb = {"_compressed": transcript_compressed}
        
        report_data_val = session_data.get("report_data", {})
        if not report_data_val:
            report_data_val = {}
            
        score = None
        if report_data_val and "meta" in report_data_val:
            grade_str = report_data_val["meta"].get("overall_grade", "")
            if grade_str and "/" in str(grade_str):
                try:
                    score = float(str(grade_str).split("/")[0].strip())
                except (ValueError, IndexError):
                    pass

        record = db.session.get(PracticeHistory, session_id)
        if not record:
            record = PracticeHistory(session_id=session_id)  # type: ignore
            db.session.add(record)
            
        record.user_id = str(user_id)
        record.scenario_type = session_data.get("scenario_type", "custom")
        record.session_mode = session_data.get("session_mode")
        record.title = session_data.get("title")
        record.ai_character = session_data.get("ai_character", "alex")
        record.mode = session_data.get("mode")
        record.role = session_data.get("role")
        record.ai_role = session_data.get("ai_role")
        record.scenario = session_data.get("scenario")
        record.framework = session_data.get("framework")
        record.transcript = transcript_jsonb
        record.report_data = report_data_val
        record.completed = session_data.get("completed", False)
        record.score = score
        record.created_at = session_data.get("created_at")
        record.updated_at = datetime.now().isoformat()
        
        db.session.commit()
        print(f"[SUCCESS] Saved session {session_id} to database.")
        return True
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] DB Save failed for {session_id}: {e}")
        import traceback
        traceback.print_exc()
        return False

def get_session_from_db(session_id):
    try:
        record = db.session.get(PracticeHistory, session_id)
        if record:
            return {
                "id": record.session_id,
                "user_id": record.user_id,
                "scenario_type": record.scenario_type,
                "session_mode": record.session_mode,
                "title": record.title,
                "ai_character": record.ai_character,
                "mode": record.mode,
                "role": record.role,
                "ai_role": record.ai_role,
                "scenario": record.scenario,
                "framework": record.framework,
                "transcript": decompress_transcript(record.transcript),
                "report_data": record.report_data or {},
                "completed": record.completed,
                "created_at": record.created_at,
                "score": record.score
            }
        return None
    except Exception as e:
        print(f"[ERROR] DB Fetch failed for {session_id}: {e}")
        return None

def get_user_sessions_from_db(user_id, limit=20, offset=0, completed_only=False):
    try:
        query = db.session.query(PracticeHistory).filter_by(user_id=str(user_id))
        if completed_only:
            query = query.filter_by(completed=True)
            
        total = query.count()
        records = query.order_by(PracticeHistory.created_at.desc()).offset(offset).limit(limit).all()
        
        sessions = []
        for record in records:
            sessions.append({
                "id": record.session_id,
                "user_id": record.user_id,
                "scenario_type": record.scenario_type,
                "session_mode": record.session_mode,
                "title": record.title,
                "ai_character": record.ai_character,
                "mode": record.mode,
                "role": record.role,
                "ai_role": record.ai_role,
                "scenario": record.scenario,
                "framework": record.framework,
                "completed": record.completed,
                "created_at": record.created_at,
                "score": record.score
            })
            
        return {
            "sessions": sessions,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        print(f"[ERROR] DB Fetch Sessions failed for user {user_id}: {e}")
        return {"sessions": [], "total": 0, "limit": limit, "offset": offset}

def clear_user_sessions_from_db(user_id):
    try:
        db.session.query(PracticeHistory).filter_by(user_id=str(user_id)).delete()
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] DB Delete Sessions failed for user {user_id}: {e}")
        return False

def get_user_analytics_from_db(user_id):
    try:
        records = db.session.query(
            PracticeHistory.session_id,
            PracticeHistory.score,
            PracticeHistory.scenario_type,
            PracticeHistory.session_mode,
            PracticeHistory.created_at,
            PracticeHistory.report_data
        ).filter_by(user_id=str(user_id), completed=True).order_by(PracticeHistory.created_at.desc()).all()
        
        return [
            {
                "session_id": r.session_id,
                "score": r.score,
                "scenario_type": r.scenario_type,
                "session_mode": r.session_mode,
                "created_at": r.created_at,
                "report_data": r.report_data
            } for r in records
        ]
    except Exception as e:
        print(f"[ERROR] DB Analytics fetch failed for user {user_id}: {e}")
        return []

def get_demo_account_limit(email):
    return None

def get_previous_session_scores(user_id, title, current_session_id):
    try:
        record = db.session.query(
            PracticeHistory.session_id,
            PracticeHistory.score,
            PracticeHistory.report_data,
            PracticeHistory.created_at
        ).filter(
            PracticeHistory.user_id == str(user_id),
            PracticeHistory.title == title,
            PracticeHistory.completed == True,
            PracticeHistory.session_id != current_session_id
        ).order_by(PracticeHistory.created_at.desc()).first()
        
        if record:
            return {
                "session_id": record.session_id,
                "score": record.score,
                "report_data": record.report_data,
                "created_at": record.created_at
            }
        return None
    except Exception as e:
        print(f"[ERROR] Failed to fetch previous session for comparison: {e}")
        return None

def get_current_date_str():
    return datetime.now().strftime('%Y-%m-%d')

def check_monthly_session_limit(user_id, limit=3):
    try:
        current_month = datetime.now().strftime('%Y-%m-')
        count = db.session.query(PracticeHistory).filter(
            PracticeHistory.user_id == str(user_id),
            PracticeHistory.created_at.like(f"{current_month}%")
        ).count()
        print(f"[SESSION_LIMIT] User {user_id} has created {count} sessions this month.")
        return count < limit
    except Exception as e:
        print(f"[ERROR] DB Check Monthly Limit failed for user {user_id}: {e}")
        return True # Default to True on DB error so we don't block the user

def check_token_limit(user_id, limit=50000):
    try:
        today = get_current_date_str()
        record = db.session.query(UserTokenUsage).filter_by(user_id=str(user_id), date=today).first()
        if not record:
            return True
        return record.tokens_used < limit
    except Exception as e:
        print(f"[ERROR] DB Check Token Limit failed for user {user_id}: {e}")
        return True # Default to True on DB error so we don't break the app

def add_token_usage(user_id, tokens):
    try:
        today = get_current_date_str()
        record = db.session.query(UserTokenUsage).filter_by(user_id=str(user_id), date=today).first()
        if not record:
            record = UserTokenUsage(user_id=str(user_id), date=today, tokens_used=0) # type: ignore
            db.session.add(record)
            
        record.tokens_used += tokens
        record.updated_at = datetime.now().isoformat()
        db.session.commit()
        print(f"[TOKEN_USAGE] Added {tokens} tokens for user {user_id}. Total today: {record.tokens_used}")
        return True
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] DB Add Token Usage failed for user {user_id}: {e}")
        return False
