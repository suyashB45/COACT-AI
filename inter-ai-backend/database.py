import os
import json
import gzip
import base64
import uuid
from datetime import datetime
from pymongo import MongoClient
import bcrypt
# Fetch MONGODB_URI, fallback to local mongodb if not set
MONGODB_URI = os.environ.get(
    "MONGODB_URI",
    "mongodb://localhost:27017/coact"
)

if "localhost" in MONGODB_URI and os.environ.get("FLASK_ENV") == "production":
    print("[WARNING] Running in production but MONGODB_URI is not set or using localhost!")

from typing import Any

db_conn_raw = None
try:
    client = MongoClient(MONGODB_URI)
    try:
        db_conn_raw = client.get_default_database()
    except Exception:
        db_conn_raw = client.get_database("coact")
    print(f"[SUCCESS] Connected to MongoDB database: {db_conn_raw.name}")
except Exception as e:
    print(f"[ERROR] Failed to connect to MongoDB: {e}")

db_conn: Any = db_conn_raw

# Mock SQLAlchemy objects for compatibility with app.py imports
class MockMetadata:
    def create_all(self, bind=None):
        pass

class MockBase:
    metadata = MockMetadata()

class MockDB:
    session = None

db = MockDB()
engine = None
Base = MockBase()

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

        doc = {
            "_id": session_id,
            "session_id": session_id,
            "user_id": str(user_id),
            "scenario_type": session_data.get("scenario_type", "custom"),
            "session_mode": session_data.get("session_mode"),
            "title": session_data.get("title"),
            "ai_character": session_data.get("ai_character", "alex"),
            "mode": session_data.get("mode"),
            "role": session_data.get("role"),
            "ai_role": session_data.get("ai_role"),
            "scenario": session_data.get("scenario"),
            "framework": session_data.get("framework"),
            "transcript": transcript_jsonb,
            "report_data": report_data_val,
            "completed": session_data.get("completed", False),
            "score": score,
            "created_at": session_data.get("created_at"),
            "updated_at": datetime.now().isoformat()
        }
        
        db_conn.practice_history.replace_one({"_id": session_id}, doc, upsert=True)
        print(f"[SUCCESS] Saved session {session_id} to MongoDB.")
        return True
    except Exception as e:
        print(f"[ERROR] DB Save failed for {session_id}: {e}")
        import traceback
        traceback.print_exc()
        return False

def get_session_from_db(session_id):
    try:
        record = db_conn.practice_history.find_one({"_id": session_id})
        if record:
            return {
                "id": record.get("session_id"),
                "user_id": record.get("user_id"),
                "scenario_type": record.get("scenario_type"),
                "session_mode": record.get("session_mode"),
                "title": record.get("title"),
                "ai_character": record.get("ai_character"),
                "mode": record.get("mode"),
                "role": record.get("role"),
                "ai_role": record.get("ai_role"),
                "scenario": record.get("scenario"),
                "framework": record.get("framework"),
                "transcript": decompress_transcript(record.get("transcript")),
                "report_data": record.get("report_data") or {},
                "completed": record.get("completed", False),
                "created_at": record.get("created_at"),
                "score": record.get("score")
            }
        return None
    except Exception as e:
        print(f"[ERROR] DB Fetch failed for {session_id}: {e}")
        return None

def get_user_sessions_from_db(user_id, limit=20, offset=0, completed_only=False):
    try:
        query: dict[str, Any] = {"user_id": str(user_id)}
        if completed_only:
            query["completed"] = True
            
        total = db_conn.practice_history.count_documents(query)
        records = db_conn.practice_history.find(query).sort("created_at", -1).skip(offset).limit(limit)
        
        sessions = []
        for record in records:
            sessions.append({
                "id": record.get("session_id"),
                "user_id": record.get("user_id"),
                "scenario_type": record.get("scenario_type"),
                "session_mode": record.get("session_mode"),
                "title": record.get("title"),
                "ai_character": record.get("ai_character"),
                "mode": record.get("mode"),
                "role": record.get("role"),
                "ai_role": record.get("ai_role"),
                "scenario": record.get("scenario"),
                "framework": record.get("framework"),
                "completed": record.get("completed", False),
                "created_at": record.get("created_at"),
                "score": record.get("score")
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
        db_conn.practice_history.delete_many({"user_id": str(user_id)})
        return True
    except Exception as e:
        print(f"[ERROR] DB Delete Sessions failed for user {user_id}: {e}")
        return False

def get_user_analytics_from_db(user_id):
    try:
        records = db_conn.practice_history.find(
            {"user_id": str(user_id), "completed": True}
        ).sort("created_at", -1)
        
        return [
            {
                "session_id": r.get("session_id"),
                "score": r.get("score"),
                "scenario_type": r.get("scenario_type"),
                "session_mode": r.get("session_mode"),
                "created_at": r.get("created_at"),
                "report_data": r.get("report_data")
            } for r in records
        ]
    except Exception as e:
        print(f"[ERROR] DB Analytics fetch failed for user {user_id}: {e}")
        return []

def get_demo_account_limit(email):
    return None

def get_previous_session_scores(user_id, title, current_session_id):
    try:
        record = db_conn.practice_history.find_one(
            {
                "user_id": str(user_id),
                "title": title,
                "completed": True,
                "_id": {"$ne": current_session_id}
            },
            sort=[("created_at", -1)]
        )
        
        if record:
            return {
                "session_id": record.get("session_id"),
                "score": record.get("score"),
                "report_data": record.get("report_data"),
                "created_at": record.get("created_at")
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
        count = db_conn.practice_history.count_documents({
            "user_id": str(user_id),
            "created_at": {"$regex": f"^{current_month}"}
        })
        print(f"[SESSION_LIMIT] User {user_id} has created {count} sessions this month.")
        return count < limit
    except Exception as e:
        print(f"[ERROR] DB Check Monthly Limit failed for user {user_id}: {e}")
        return True # Default to True on DB error so we don't block the user

def check_token_limit(user_id, limit=50000):
    try:
        today = get_current_date_str()
        record = db_conn.user_token_usage.find_one({"user_id": str(user_id), "date": today})
        if not record:
            return True
        return record.get("tokens_used", 0) < limit
    except Exception as e:
        print(f"[ERROR] DB Check Token Limit failed for user {user_id}: {e}")
        return True # Default to True on DB error so we don't break the app

def add_token_usage(user_id, tokens):
    try:
        today = get_current_date_str()
        db_conn.user_token_usage.update_one(
            {"user_id": str(user_id), "date": today},
            {
                "$inc": {"tokens_used": tokens},
                "$set": {"updated_at": datetime.now().isoformat()}
            },
            upsert=True
        )
        print(f"[TOKEN_USAGE] Added {tokens} tokens for user {user_id}.")
        return True
    except Exception as e:
        print(f"[ERROR] DB Add Token Usage failed for user {user_id}: {e}")
        return False

# ---------------------------------------------------------
# User Authentication Operations
# ---------------------------------------------------------
def verify_password(plain_password, hashed_password):
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8')[:72], hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password):
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def create_user(email: str, password: str):
    try:
        hashed_pwd = get_password_hash(password)
        user_id = str(uuid.uuid4())
        doc = {
            "_id": user_id,
            "id": user_id,
            "email": email,
            "hashed_password": hashed_pwd,
            "created_at": datetime.now().isoformat()
        }
        db_conn.users.insert_one(doc)
        return doc
    except Exception as e:
        print(f"[ERROR] DB Create User failed: {e}")
        return None

def get_user_by_email(email: str):
    try:
        return db_conn.users.find_one({"email": email})
    except Exception as e:
        print(f"[ERROR] DB Get User by Email failed: {e}")
        return None

def get_user_by_id(user_id: str):
    try:
        return db_conn.users.find_one({"_id": user_id})
    except Exception as e:
        print(f"[ERROR] DB Get User by ID failed: {e}")
        return None
