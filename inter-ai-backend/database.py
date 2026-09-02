import base64
import gzip
import json
import logging
import os
import sqlite3
import time
import uuid
from datetime import datetime, timezone
from typing import Any

import bcrypt
import certifi
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

logger = logging.getLogger("coact.database")

# ---------------------------------------------------------
# SQLite Local Storage Fallback Setup
# ---------------------------------------------------------
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)
SQLITE_DB_PATH = os.path.join(DATA_DIR, "coact_local.db")

def get_sqlite_conn():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_sqlite_db():
    try:
        with get_sqlite_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT,
                    company TEXT,
                    hashed_password TEXT NOT NULL,
                    is_2fa_enabled INTEGER DEFAULT 0,
                    two_factor_code TEXT,
                    two_factor_expires TEXT,
                    two_factor_action TEXT,
                    two_factor_attempts INTEGER DEFAULT 0,
                    two_factor_last_requested_at TEXT,
                    password_changed_at TEXT,
                    created_at TEXT
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS practice_history (
                    id TEXT PRIMARY KEY,
                    session_id TEXT,
                    user_id TEXT,
                    scenario_type TEXT,
                    session_mode TEXT,
                    title TEXT,
                    ai_character TEXT,
                    mode TEXT,
                    role TEXT,
                    ai_role TEXT,
                    scenario TEXT,
                    framework TEXT,
                    transcript TEXT,
                    report_data TEXT,
                    completed INTEGER DEFAULT 0,
                    score REAL,
                    created_at TEXT,
                    updated_at TEXT
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS user_token_usage (
                    user_id TEXT,
                    date TEXT,
                    tokens_used INTEGER DEFAULT 0,
                    updated_at TEXT,
                    PRIMARY KEY (user_id, date)
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS ai_usage_counters (
                    user_id TEXT,
                    scope TEXT,
                    window_start TEXT,
                    count INTEGER DEFAULT 0,
                    PRIMARY KEY (user_id, scope, window_start)
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS ai_usage_log (
                    id TEXT PRIMARY KEY,
                    user_id TEXT,
                    organization_id TEXT,
                    request_id TEXT,
                    endpoint TEXT,
                    model TEXT,
                    input_tokens INTEGER DEFAULT 0,
                    output_tokens INTEGER DEFAULT 0,
                    total_tokens INTEGER DEFAULT 0,
                    created_at TEXT
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user ON ai_usage_log (user_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_ai_usage_log_org ON ai_usage_log (organization_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created ON ai_usage_log (created_at)")
            conn.commit()
        logger.info(f"SQLite local fallback database initialized at {SQLITE_DB_PATH}")
    except Exception as e:
        logger.error(f"Failed to initialize SQLite fallback: {e}")

init_sqlite_db()

# ---------------------------------------------------------
# MongoDB Connection with Retry Logic & Connection Pooling
# ---------------------------------------------------------
MONGODB_URI = os.environ.get(
    "MONGODB_URI",
    "mongodb://localhost:27017/coact"
)

if "localhost" in MONGODB_URI and os.environ.get("FLASK_ENV") == "production":
    logger.warning("Running in production but MONGODB_URI is not set or using localhost!")

MONGODB_MAX_POOL_SIZE = int(os.environ.get("MONGODB_MAX_POOL_SIZE", "100"))
MONGODB_MIN_POOL_SIZE = int(os.environ.get("MONGODB_MIN_POOL_SIZE", "10"))
MONGODB_MAX_IDLE_TIME_MS = int(os.environ.get("MONGODB_MAX_IDLE_TIME_MS", "30000"))

MAX_RETRIES = 2
RETRY_DELAY = 1  # seconds

db_conn_raw = None
if MONGODB_URI and not MONGODB_URI.startswith("sqlite"):
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            kwargs: dict[str, Any] = {
                "serverSelectionTimeoutMS": 2500,
                "connectTimeoutMS": 2500,
                "socketTimeoutMS": 5000,
                "maxPoolSize": MONGODB_MAX_POOL_SIZE,
                "minPoolSize": MONGODB_MIN_POOL_SIZE,
                "maxIdleTimeMS": MONGODB_MAX_IDLE_TIME_MS,
                "retryWrites": True
            }
            
            if "mongodb+srv" in MONGODB_URI or "tls=true" in MONGODB_URI.lower():
                kwargs["tlsCAFile"] = certifi.where()
                kwargs["tlsAllowInvalidCertificates"] = True

            client = MongoClient(MONGODB_URI, **kwargs)
            client.admin.command("ping")
            try:
                db_conn_raw = client.get_default_database()
            except Exception:
                db_conn_raw = client.get_database("coact")
            logger.info(f"Connected to MongoDB database: {db_conn_raw.name} (attempt {attempt})")
            break
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            if attempt < MAX_RETRIES:
                wait = RETRY_DELAY * attempt
                logger.warning(f"MongoDB connection attempt {attempt}/{MAX_RETRIES} failed: {e}. Retrying in {wait}s...")
                time.sleep(wait)
            else:
                logger.warning("MongoDB connection unavailable. Operating with SQLite local database fallback.")
        except Exception as e:
            logger.warning(f"MongoDB initialization warning: {e}. Operating with SQLite local database fallback.")
            break

db_conn: Any = db_conn_raw

# ---------------------------------------------------------
# Create MongoDB Indexes if connected
# ---------------------------------------------------------
if db_conn is not None:
    try:
        db_conn.practice_history.create_index(
            [("user_id", ASCENDING), ("created_at", DESCENDING)],
            name="idx_user_created",
            background=True
        )
        db_conn.practice_history.create_index(
            [("user_id", ASCENDING), ("completed", ASCENDING)],
            name="idx_user_completed",
            background=True
        )
        db_conn.practice_history.create_index(
            [("user_id", ASCENDING), ("title", ASCENDING), ("completed", ASCENDING)],
            name="idx_user_title_completed",
            background=True
        )
        db_conn.practice_history.create_index(
            [("user_id", ASCENDING), ("completed", ASCENDING), ("created_at", DESCENDING)],
            name="idx_user_completed_created",
            background=True
        )
        db_conn.practice_history.create_index(
            [("user_id", ASCENDING), ("title", ASCENDING), ("completed", ASCENDING), ("created_at", DESCENDING)],
            name="idx_user_title_completed_created",
            background=True
        )

        db_conn.users.create_index(
            "email",
            name="idx_email_unique",
            unique=True,
            background=True
        )
        db_conn.users.create_index(
            "id",
            name="idx_user_id_unique",
            unique=True,
            background=True
        )

        db_conn.user_token_usage.create_index(
            [("user_id", ASCENDING), ("date", ASCENDING)],
            name="idx_user_date",
            unique=True,
            background=True
        )

        db_conn.ai_usage_counters.create_index(
            [("scope", ASCENDING), ("window_start", ASCENDING)],
            name="idx_ai_usage_scope_window",
            background=True
        )
        db_conn.ai_usage_log.create_index(
            [("user_id", ASCENDING), ("created_at", DESCENDING)],
            name="idx_ai_usage_log_user_created",
            background=True
        )
        db_conn.ai_usage_log.create_index(
            [("organization_id", ASCENDING), ("created_at", DESCENDING)],
            name="idx_ai_usage_log_org_created",
            background=True
        )
        logger.info("MongoDB indexes verified/created successfully")
    except Exception as e:
        logger.warning(f"Failed to create MongoDB indexes (non-fatal): {e}")

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
# Database Operations (MongoDB with SQLite Fallback)
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
            "created_at": session_data.get("created_at") or datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        if db_conn is not None:
            db_conn.practice_history.replace_one({"_id": session_id}, doc, upsert=True)
            print(f"[SUCCESS] Saved session {session_id} to MongoDB.")
            return True
        else:
            with get_sqlite_conn() as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO practice_history (
                        id, session_id, user_id, scenario_type, session_mode, title, ai_character,
                        mode, role, ai_role, scenario, framework, transcript, report_data,
                        completed, score, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    session_id, session_id, str(user_id),
                    doc["scenario_type"], doc["session_mode"], doc["title"], doc["ai_character"],
                    doc["mode"], doc["role"], doc["ai_role"], doc["scenario"], doc["framework"],
                    json.dumps(transcript_jsonb), json.dumps(report_data_val),
                    1 if doc["completed"] else 0, score, doc["created_at"], doc["updated_at"]
                ))
                conn.commit()
            print(f"[SUCCESS] Saved session {session_id} to local SQLite.")
            return True
    except Exception as e:
        print(f"[ERROR] DB Save failed for {session_id}: {e}")
        return False

def get_session_from_db(session_id):
    try:
        if db_conn is not None:
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
        else:
            with get_sqlite_conn() as conn:
                cur = conn.execute("SELECT * FROM practice_history WHERE id = ? OR session_id = ?", (session_id, session_id))
                row = cur.fetchone()
                if row:
                    r = dict(row)
                    t_raw = json.loads(r["transcript"]) if r.get("transcript") else []
                    rep_raw = json.loads(r["report_data"]) if r.get("report_data") else {}
                    return {
                        "id": r.get("session_id"),
                        "user_id": r.get("user_id"),
                        "scenario_type": r.get("scenario_type"),
                        "session_mode": r.get("session_mode"),
                        "title": r.get("title"),
                        "ai_character": r.get("ai_character"),
                        "mode": r.get("mode"),
                        "role": r.get("role"),
                        "ai_role": r.get("ai_role"),
                        "scenario": r.get("scenario"),
                        "framework": r.get("framework"),
                        "transcript": decompress_transcript(t_raw),
                        "report_data": rep_raw,
                        "completed": bool(r.get("completed")),
                        "created_at": r.get("created_at"),
                        "score": r.get("score")
                    }
        return None
    except Exception as e:
        print(f"[ERROR] DB Fetch failed for {session_id}: {e}")
        return None

def get_user_sessions_from_db(user_id, limit=20, offset=0, completed_only=False):
    try:
        if db_conn is not None:
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
        else:
            with get_sqlite_conn() as conn:
                q_where = "WHERE user_id = ?"
                params: list[Any] = [str(user_id)]
                if completed_only:
                    q_where += " AND completed = 1"
                    
                cur_c = conn.execute(f"SELECT COUNT(*) as cnt FROM practice_history {q_where}", params)
                total = cur_c.fetchone()["cnt"]
                
                cur = conn.execute(f"SELECT * FROM practice_history {q_where} ORDER BY created_at DESC LIMIT ? OFFSET ?", params + [limit, offset])
                rows = cur.fetchall()
                sessions = []
                for row in rows:
                    r = dict(row)
                    sessions.append({
                        "id": r.get("session_id"),
                        "user_id": r.get("user_id"),
                        "scenario_type": r.get("scenario_type"),
                        "session_mode": r.get("session_mode"),
                        "title": r.get("title"),
                        "ai_character": r.get("ai_character"),
                        "mode": r.get("mode"),
                        "role": r.get("role"),
                        "ai_role": r.get("ai_role"),
                        "scenario": r.get("scenario"),
                        "framework": r.get("framework"),
                        "completed": bool(r.get("completed")),
                        "created_at": r.get("created_at"),
                        "score": r.get("score")
                    })
                return {"sessions": sessions, "total": total, "limit": limit, "offset": offset}
    except Exception as e:
        print(f"[ERROR] DB Fetch Sessions failed for user {user_id}: {e}")
        return {"sessions": [], "total": 0, "limit": limit, "offset": offset}

def clear_user_sessions_from_db(user_id):
    try:
        if db_conn is not None:
            db_conn.practice_history.delete_many({"user_id": str(user_id)})
        else:
            with get_sqlite_conn() as conn:
                conn.execute("DELETE FROM practice_history WHERE user_id = ?", (str(user_id),))
                conn.commit()
        return True
    except Exception as e:
        print(f"[ERROR] DB Delete Sessions failed for user {user_id}: {e}")
        return False

def get_user_analytics_from_db(user_id):
    try:
        if db_conn is not None:
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
        else:
            with get_sqlite_conn() as conn:
                cur = conn.execute("SELECT * FROM practice_history WHERE user_id = ? AND completed = 1 ORDER BY created_at DESC", (str(user_id),))
                rows = cur.fetchall()
                res = []
                for row in rows:
                    r = dict(row)
                    rep_raw = json.loads(r["report_data"]) if r.get("report_data") else {}
                    res.append({
                        "session_id": r.get("session_id"),
                        "score": r.get("score"),
                        "scenario_type": r.get("scenario_type"),
                        "session_mode": r.get("session_mode"),
                        "created_at": r.get("created_at"),
                        "report_data": rep_raw
                    })
                return res
    except Exception as e:
        print(f"[ERROR] DB Analytics fetch failed for user {user_id}: {e}")
        return []

def get_demo_account_limit(email):
    return None

def get_previous_session_scores(user_id, title, current_session_id):
    try:
        if db_conn is not None:
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
        else:
            with get_sqlite_conn() as conn:
                cur = conn.execute("""
                    SELECT * FROM practice_history 
                    WHERE user_id = ? AND title = ? AND completed = 1 AND (id != ? AND session_id != ?) 
                    ORDER BY created_at DESC LIMIT 1
                """, (str(user_id), title, str(current_session_id), str(current_session_id)))
                row = cur.fetchone()
                if row:
                    r = dict(row)
                    rep_raw = json.loads(r["report_data"]) if r.get("report_data") else {}
                    return {
                        "session_id": r.get("session_id"),
                        "score": r.get("score"),
                        "report_data": rep_raw,
                        "created_at": r.get("created_at")
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
        if db_conn is not None:
            count = db_conn.practice_history.count_documents({
                "user_id": str(user_id),
                "created_at": {"$regex": f"^{current_month}"}
            })
        else:
            with get_sqlite_conn() as conn:
                cur = conn.execute("SELECT COUNT(*) as cnt FROM practice_history WHERE user_id = ? AND created_at LIKE ?", (str(user_id), f"{current_month}%"))
                count = cur.fetchone()["cnt"]
        print(f"[SESSION_LIMIT] User {user_id} has created {count} sessions this month.")
        return count < limit
    except Exception as e:
        print(f"[ERROR] DB Check Monthly Limit failed for user {user_id}: {e}")
        return True

def check_token_limit(user_id, limit=50000):
    try:
        today = get_current_date_str()
        if db_conn is not None:
            record = db_conn.user_token_usage.find_one({"user_id": str(user_id), "date": today})
            if not record:
                return True
            return record.get("tokens_used", 0) < limit
        else:
            with get_sqlite_conn() as conn:
                cur = conn.execute("SELECT tokens_used FROM user_token_usage WHERE user_id = ? AND date = ?", (str(user_id), today))
                row = cur.fetchone()
                if not row:
                    return True
                return (row["tokens_used"] or 0) < limit
    except Exception as e:
        print(f"[ERROR] DB Check Token Limit failed for user {user_id}: {e}")
        return True

def get_user_usage(user_id):
    """Get the user's current-month token and session usage."""
    try:
        current_month = datetime.now().strftime('%Y-%m-')
        pipeline = [
            {"$match": {"user_id": str(user_id), "date": {"$regex": f"^{current_month}"}}},
            {"$group": {"_id": None, "total": {"$sum": "$tokens_used"}}}
        ]
        result = list(db_conn.user_token_usage.aggregate(pipeline))
        tokens_used = result[0]["total"] if result else 0

        session_count = db_conn.practice_history.count_documents({
            "user_id": str(user_id),
            "created_at": {"$regex": f"^{current_month}"}
        })
        print(f"[USAGE] User {user_id} | tokens={tokens_used} sessions={session_count}")
        return {"tokens_used": tokens_used, "sessions_this_month": session_count}
    except Exception as e:
        print(f"[ERROR] DB Get User Usage failed for user {user_id}: {e}")
        return {"tokens_used": 0, "sessions_this_month": 0}

def add_token_usage(user_id, tokens):
    try:
        today = get_current_date_str()
        now_iso = datetime.now().isoformat()
        if db_conn is not None:
            db_conn.user_token_usage.update_one(
                {"user_id": str(user_id), "date": today},
                {
                    "$inc": {"tokens_used": tokens},
                    "$set": {"updated_at": now_iso}
                },
                upsert=True
            )
        else:
            with get_sqlite_conn() as conn:
                conn.execute("""
                    INSERT INTO user_token_usage (user_id, date, tokens_used, updated_at)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(user_id, date) DO UPDATE SET
                        tokens_used = tokens_used + excluded.tokens_used,
                        updated_at = excluded.updated_at
                """, (str(user_id), today, tokens, now_iso))
                conn.commit()
        print(f"[TOKEN_USAGE] Added {tokens} tokens for user {user_id}.")
        return True
    except Exception as e:
        print(f"[ERROR] DB Add Token Usage failed for user {user_id}: {e}")
        return False

# ---------------------------------------------------------
# AI Usage Rate-Limit Counters & Durable Usage Log
# ---------------------------------------------------------
def increment_ai_usage_counter(user_id: str, scope: str, window_start: str, amount: int = 1) -> int:
    """Atomically increment a per-user counter for a given scope+window.

    scope is one of: 'requests_per_minute', 'input_tokens_per_hour',
    'output_tokens_per_hour', 'daily_tokens_per_user'.
    window_start is the UTC window key (e.g. '2026-09-02T14:30', '2026-09-02T14', '2026-09-02').
    Returns the updated count.
    """
    try:
        if db_conn is not None:
            result = db_conn.ai_usage_counters.find_one_and_update(
                {
                    "_id": {"user_id": str(user_id), "scope": scope, "window_start": window_start},
                },
                {
                    "$inc": {"count": amount},
                    "$setOnInsert": {"user_id": str(user_id), "scope": scope, "window_start": window_start},
                },
                upsert=True,
                return_document=True,
            )
            return int(result.get("count", 0)) if result else 0
        else:
            with get_sqlite_conn() as conn:
                conn.execute("""
                    INSERT INTO ai_usage_counters (user_id, scope, window_start, count)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(user_id, scope, window_start) DO UPDATE SET
                        count = count + excluded.count
                """, (str(user_id), scope, window_start, amount))
                conn.commit()
                cur = conn.execute(
                    "SELECT count FROM ai_usage_counters WHERE user_id = ? AND scope = ? AND window_start = ?",
                    (str(user_id), scope, window_start)
                )
                row = cur.fetchone()
                return int(row["count"]) if row else amount
    except Exception as e:
        print(f"[ERROR] DB Increment AI Usage Counter failed: {e}")
        return 0

def get_ai_usage_counter(user_id: str, scope: str, window_start: str) -> int:
    try:
        if db_conn is not None:
            record = db_conn.ai_usage_counters.find_one(
                {"_id": {"user_id": str(user_id), "scope": scope, "window_start": window_start}}
            )
            return int(record.get("count", 0)) if record else 0
        else:
            with get_sqlite_conn() as conn:
                cur = conn.execute(
                    "SELECT count FROM ai_usage_counters WHERE user_id = ? AND scope = ? AND window_start = ?",
                    (str(user_id), scope, window_start)
                )
                row = cur.fetchone()
                return int(row["count"]) if row else 0
    except Exception as e:
        print(f"[ERROR] DB Get AI Usage Counter failed: {e}")
        return 0

def log_ai_usage(
    user_id: str,
    endpoint: str,
    model: str,
    input_tokens: int,
    output_tokens: int,
    request_id: str | None = None,
    organization_id: str | None = None,
) -> bool:
    """Append a durable, per-request AI usage log entry."""
    try:
        record_id = request_id or str(uuid.uuid4())
        total = max(0, int(input_tokens)) + max(0, int(output_tokens))
        doc = {
            "_id": record_id,
            "user_id": str(user_id),
            "organization_id": organization_id,
            "request_id": record_id,
            "endpoint": endpoint,
            "model": model,
            "input_tokens": max(0, int(input_tokens)),
            "output_tokens": max(0, int(output_tokens)),
            "total_tokens": total,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        if db_conn is not None:
            db_conn.ai_usage_log.insert_one(doc)
            return True
        else:
            with get_sqlite_conn() as conn:
                conn.execute("""
                    INSERT INTO ai_usage_log (id, user_id, organization_id, request_id, endpoint, model,
                                              input_tokens, output_tokens, total_tokens, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    str(record_id), doc["user_id"], doc["organization_id"], doc["request_id"],
                    doc["endpoint"], doc["model"], doc["input_tokens"], doc["output_tokens"],
                    doc["total_tokens"], doc["created_at"],
                ))
                conn.commit()
                return True
    except Exception as e:
        print(f"[ERROR] DB Log AI Usage failed: {e}")
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

def create_user(email: str, password: str, name: str | None = None, company: str | None = None):
    try:
        hashed_pwd = get_password_hash(password)
        user_id = str(uuid.uuid4())
        
        final_name = name.strip() if name and name.strip() else email.split('@')[0]
        
        doc = {
            "_id": user_id,
            "id": user_id,
            "email": email.lower().strip(),
            "name": final_name,
            "company": company.strip() if company else None,
            "hashed_password": hashed_pwd,
            "is_2fa_enabled": False,
            "two_factor_code": None,
            "two_factor_expires": None,
            "password_changed_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now().isoformat()
        }
        
        if db_conn is not None:
            db_conn.users.insert_one(doc)
        else:
            with get_sqlite_conn() as conn:
                conn.execute("""
                    INSERT INTO users (id, email, name, company, hashed_password, is_2fa_enabled, two_factor_code, two_factor_expires, password_changed_at, created_at)
                    VALUES (?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?)
                """, (user_id, doc["email"], doc["name"], doc["company"], hashed_pwd, doc["password_changed_at"], doc["created_at"]))
                conn.commit()
                
        print(f"[SUCCESS] Created user account for {email}")
        return doc
    except Exception as e:
        print(f"[ERROR] DB Create User failed: {e}")
        return None

def get_user_by_email(email: str):
    try:
        if db_conn is not None:
            return db_conn.users.find_one({"email": email.lower().strip()})
        else:
            with get_sqlite_conn() as conn:
                cur = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),))
                row = cur.fetchone()
                if row:
                    d = dict(row)
                    d["_id"] = d["id"]
                    d["is_2fa_enabled"] = bool(d.get("is_2fa_enabled"))
                    return d
                return None
    except Exception as e:
        print(f"[ERROR] DB Get User by Email failed: {e}")
        return None

def get_user_by_id(user_id: str):
    try:
        if db_conn is not None:
            return db_conn.users.find_one({"id": user_id})
        else:
            with get_sqlite_conn() as conn:
                cur = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
                row = cur.fetchone()
                if row:
                    d = dict(row)
                    d["_id"] = d["id"]
                    d["is_2fa_enabled"] = bool(d.get("is_2fa_enabled"))
                    return d
                return None
    except Exception as e:
        print(f"[ERROR] DB Get User By ID failed: {e}")
        return None

def update_user_name(user_id: str, new_name: str):
    try:
        if db_conn is not None:
            result = db_conn.users.update_one(
                {"id": user_id},
                {"$set": {"name": new_name.strip()}}
            )
            return result.modified_count > 0
        else:
            with get_sqlite_conn() as conn:
                cur = conn.execute("UPDATE users SET name = ? WHERE id = ?", (new_name.strip(), user_id))
                conn.commit()
                return cur.rowcount > 0
    except Exception as e:
        print(f"[ERROR] DB Update User Name failed: {e}")
        return False

def update_user_password(user_id: str, new_password: str):
    try:
        hashed_pwd = get_password_hash(new_password)
        now_iso = datetime.now(timezone.utc).isoformat()
        if db_conn is not None:
            result = db_conn.users.update_one(
                {"id": user_id},
                {"$set": {
                    "hashed_password": hashed_pwd,
                    "password_changed_at": now_iso
                }}
            )
            return result.modified_count > 0
        else:
            with get_sqlite_conn() as conn:
                cur = conn.execute("UPDATE users SET hashed_password = ?, password_changed_at = ? WHERE id = ?", (hashed_pwd, now_iso, user_id))
                conn.commit()
                return cur.rowcount > 0
    except Exception as e:
        print(f"[ERROR] DB Update User Password failed: {e}")
        return False

def delete_user(user_id: str):
    return delete_user_account(user_id)

def delete_user_account(user_id: str):
    try:
        if db_conn is not None:
            db_conn.users.delete_one({"_id": user_id})
            db_conn.practice_history.delete_many({"user_id": user_id})
            db_conn.user_token_usage.delete_many({"user_id": user_id})
        else:
            with get_sqlite_conn() as conn:
                conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
                conn.execute("DELETE FROM practice_history WHERE user_id = ?", (user_id,))
                conn.execute("DELETE FROM user_token_usage WHERE user_id = ?", (user_id,))
                conn.commit()
        print(f"[SUCCESS] Purged all data for user: {user_id}")
        return True
    except Exception as e:
        print(f"[ERROR] DB Delete User Account failed: {e}")
        return False

# ---------------------------------------------------------
# 2FA Operations
# ---------------------------------------------------------
class RateLimitExceeded(Exception):
    pass

def set_2fa_code(user_id: str, code: str, action: str = "generic", expires_in_minutes: int = 15):
    try:
        from datetime import timedelta
        user = get_user_by_id(user_id)
        if user and code:
            last_req = user.get("two_factor_last_requested_at")
            if last_req:
                last_req_dt = datetime.fromisoformat(last_req)
                if (datetime.now() - last_req_dt).total_seconds() < 60:
                    raise RateLimitExceeded("Please wait 60 seconds before requesting a new code.")
                    
        expires_at = (datetime.now() + timedelta(minutes=expires_in_minutes)).isoformat() if code else None
        
        if db_conn is not None:
            update_data = {
                "two_factor_code": code,
                "two_factor_expires": expires_at,
                "two_factor_action": action,
                "two_factor_attempts": 0
            }
            if code:
                update_data["two_factor_last_requested_at"] = datetime.now().isoformat()
                
            result = db_conn.users.update_one(
                {"id": user_id},
                {"$set": update_data}
            )
            return result.modified_count > 0
        else:
            with get_sqlite_conn() as conn:
                last_req_val = datetime.now().isoformat() if code else user.get("two_factor_last_requested_at") if user else None
                cur = conn.execute("""
                    UPDATE users SET
                        two_factor_code = ?,
                        two_factor_expires = ?,
                        two_factor_action = ?,
                        two_factor_attempts = 0,
                        two_factor_last_requested_at = ?
                    WHERE id = ?
                """, (code if code else None, expires_at, action, last_req_val, user_id))
                conn.commit()
                return cur.rowcount > 0
    except RateLimitExceeded:
        raise
    except Exception as e:
        print(f"[ERROR] DB Set 2FA Code failed: {e}")
        return False

def verify_2fa_code(user_id: str, code: str, action: str = "generic"):
    try:
        user = get_user_by_id(user_id)
        if not user:
            return False
        
        stored_code = user.get("two_factor_code")
        expires_at = user.get("two_factor_expires")
        stored_action = user.get("two_factor_action", "generic")
        attempts = user.get("two_factor_attempts", 0)
        
        if not stored_code or not expires_at:
            return False
            
        if attempts >= 5:
            if db_conn is not None:
                db_conn.users.update_one(
                    {"id": user_id},
                    {"$set": {"two_factor_code": None, "two_factor_expires": None}}
                )
            else:
                with get_sqlite_conn() as conn:
                    conn.execute("UPDATE users SET two_factor_code = NULL, two_factor_expires = NULL WHERE id = ?", (user_id,))
                    conn.commit()
            return False
            
        if stored_action != action:
            return False
            
        if stored_code != code:
            if db_conn is not None:
                db_conn.users.update_one(
                    {"id": user_id},
                    {"$inc": {"two_factor_attempts": 1}}
                )
            else:
                with get_sqlite_conn() as conn:
                    conn.execute("UPDATE users SET two_factor_attempts = two_factor_attempts + 1 WHERE id = ?", (user_id,))
                    conn.commit()
            return False
            
        if datetime.fromisoformat(expires_at) < datetime.now():
            return False
            
        if db_conn is not None:
            db_conn.users.update_one(
                {"id": user_id},
                {"$set": {
                    "two_factor_code": None, 
                    "two_factor_expires": None,
                    "two_factor_attempts": 0
                }}
            )
        else:
            with get_sqlite_conn() as conn:
                conn.execute("UPDATE users SET two_factor_code = NULL, two_factor_expires = NULL, two_factor_attempts = 0 WHERE id = ?", (user_id,))
                conn.commit()
        return True
    except Exception as e:
        print(f"[ERROR] DB Verify 2FA Code failed: {e}")
        return False

def enable_2fa(user_id: str):
    try:
        if db_conn is not None:
            result = db_conn.users.update_one(
                {"id": user_id},
                {"$set": {"is_2fa_enabled": True}}
            )
            return result.modified_count > 0
        else:
            with get_sqlite_conn() as conn:
                cur = conn.execute("UPDATE users SET is_2fa_enabled = 1 WHERE id = ?", (user_id,))
                conn.commit()
                return cur.rowcount > 0
    except Exception as e:
        print(f"[ERROR] DB Enable 2FA failed: {e}")
        return False

def disable_2fa(user_id: str):
    try:
        if db_conn is not None:
            result = db_conn.users.update_one(
                {"id": user_id},
                {"$set": {
                    "is_2fa_enabled": False,
                    "two_factor_code": None,
                    "two_factor_expires": None
                }}
            )
            return result.modified_count > 0
        else:
            with get_sqlite_conn() as conn:
                cur = conn.execute("UPDATE users SET is_2fa_enabled = 0, two_factor_code = NULL, two_factor_expires = NULL WHERE id = ?", (user_id,))
                conn.commit()
                return cur.rowcount > 0
    except Exception as e:
        print(f"[ERROR] DB Disable 2FA failed: {e}")
        return False
