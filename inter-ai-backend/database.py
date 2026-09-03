import base64
import gzip
import json
import logging
import os
import sys
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
# MongoDB Connection with Retry Logic & Connection Pooling
# ---------------------------------------------------------
# Resolve the MongoDB connection URI. Railway exposes the managed Mongo
# database as MONGO_URL / MONGO_PUBLIC_URL, while a stand-alone instance
# typically uses MONGODB_URI. Accept any of them so the backend connects
# regardless of which variable is injected by the host.
MONGODB_URI = (
    os.environ.get("MONGODB_URI")
    or os.environ.get("MONGO_URL")
    or os.environ.get("MONGO_PUBLIC_URL")
    or ""
).strip()

if not MONGODB_URI:
    logger.critical("FATAL: MONGODB_URI environment variable is not set.")
    sys.exit("FATAL: MONGODB_URI environment variable is not set. MongoDB is required.")

MONGODB_MAX_POOL_SIZE = int(os.environ.get("MONGODB_MAX_POOL_SIZE", "100"))
MONGODB_MIN_POOL_SIZE = int(os.environ.get("MONGODB_MIN_POOL_SIZE", "10"))
MONGODB_MAX_IDLE_TIME_MS = int(os.environ.get("MONGODB_MAX_IDLE_TIME_MS", "30000"))

MAX_RETRIES = 2
RETRY_DELAY = 1  # seconds

db_conn_raw = None
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

        if "mongodb+srv" in MONGODB_URI or "tls=true" in MONGODB_URI.lower() or "ssl=true" in MONGODB_URI.lower():
            kwargs["tlsCAFile"] = certifi.where()
            # SECURITY NOTE: The current Atlas cluster requires disabling cert validation to
            # complete the TLS handshake. This weakens MITM resistance. Once the cluster's TLS
            # is reconfigured, set MONGO_TLS_ALLOW_INVALID=false (default) to enforce validation.
            if os.getenv("MONGO_TLS_ALLOW_INVALID", "true").lower() == "true":
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
            logger.critical(f"FATAL: MongoDB connection failed after {MAX_RETRIES} attempts: {e}")
            sys.exit(f"FATAL: MongoDB connection failed after {MAX_RETRIES} attempts: {e}")
    except Exception as e:
        logger.critical(f"FATAL: MongoDB initialization error: {e}")
        sys.exit(f"FATAL: MongoDB initialization error: {e}")

db_conn: Any = db_conn_raw

if db_conn is None:
    logger.critical("FATAL: MongoDB connection is None. MONGODB_URI must point to a reachable MongoDB instance.")
    sys.exit("FATAL: MongoDB connection is None. MONGODB_URI must point to a reachable MongoDB instance.")

# ---------------------------------------------------------
# Create MongoDB Indexes
# ---------------------------------------------------------
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
# Database Operations (MongoDB)
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

        db_conn.practice_history.replace_one({"_id": session_id}, doc, upsert=True)
        print(f"[SUCCESS] Saved session {session_id} to MongoDB.")
        return True
    except Exception as e:
        print(f"[ERROR] DB Save failed for {session_id}: {e}")
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
        return True

def check_token_limit(user_id, limit=50000):
    try:
        today = get_current_date_str()
        record = db_conn.user_token_usage.find_one({"user_id": str(user_id), "date": today})
        if not record:
            return True
        return record.get("tokens_used", 0) < limit
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
        db_conn.user_token_usage.update_one(
            {"user_id": str(user_id), "date": today},
            {
                "$inc": {"tokens_used": tokens},
                "$set": {"updated_at": now_iso}
            },
            upsert=True
        )
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
    except Exception as e:
        print(f"[ERROR] DB Increment AI Usage Counter failed: {e}")
        return 0

def get_ai_usage_counter(user_id: str, scope: str, window_start: str) -> int:
    try:
        record = db_conn.ai_usage_counters.find_one(
            {"_id": {"user_id": str(user_id), "scope": scope, "window_start": window_start}}
        )
        return int(record.get("count", 0)) if record else 0
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
        db_conn.ai_usage_log.insert_one(doc)
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

        db_conn.users.insert_one(doc)

        print(f"[SUCCESS] Created user account for {email}")
        return doc
    except Exception as e:
        print(f"[ERROR] DB Create User failed: {e}")
        return None

def get_user_by_email(email: str):
    try:
        return db_conn.users.find_one({"email": email.lower().strip()})
    except Exception as e:
        print(f"[ERROR] DB Get User by Email failed: {e}")
        return None

def get_user_by_id(user_id: str):
    try:
        return db_conn.users.find_one({"id": user_id})
    except Exception as e:
        print(f"[ERROR] DB Get User By ID failed: {e}")
        return None

def update_user_name(user_id: str, new_name: str):
    try:
        result = db_conn.users.update_one(
            {"id": user_id},
            {"$set": {"name": new_name.strip()}}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"[ERROR] DB Update User Name failed: {e}")
        return False

def update_user_password(user_id: str, new_password: str):
    try:
        hashed_pwd = get_password_hash(new_password)
        now_iso = datetime.now(timezone.utc).isoformat()
        result = db_conn.users.update_one(
            {"id": user_id},
            {"$set": {
                "hashed_password": hashed_pwd,
                "password_changed_at": now_iso
            }}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"[ERROR] DB Update User Password failed: {e}")
        return False

def delete_user(user_id: str):
    return delete_user_account(user_id)

def delete_user_account(user_id: str):
    try:
        db_conn.users.delete_one({"_id": user_id})
        db_conn.practice_history.delete_many({"user_id": user_id})
        db_conn.user_token_usage.delete_many({"user_id": user_id})
        db_conn.ai_usage_counters.delete_many({"user_id": user_id})
        db_conn.ai_usage_log.delete_many({"user_id": user_id})
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
            db_conn.users.update_one(
                {"id": user_id},
                {"$set": {"two_factor_code": None, "two_factor_expires": None}}
            )
            return False

        if stored_action != action:
            return False

        if stored_code != code:
            db_conn.users.update_one(
                {"id": user_id},
                {"$inc": {"two_factor_attempts": 1}}
            )
            return False

        if datetime.fromisoformat(expires_at) < datetime.now():
            return False

        db_conn.users.update_one(
            {"id": user_id},
            {"$set": {
                "two_factor_code": None,
                "two_factor_expires": None,
                "two_factor_attempts": 0
            }}
        )
        return True
    except Exception as e:
        print(f"[ERROR] DB Verify 2FA Code failed: {e}")
        return False

def enable_2fa(user_id: str):
    try:
        result = db_conn.users.update_one(
            {"id": user_id},
            {"$set": {"is_2fa_enabled": True}}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"[ERROR] DB Enable 2FA failed: {e}")
        return False

def disable_2fa(user_id: str):
    try:
        result = db_conn.users.update_one(
            {"id": user_id},
            {"$set": {
                "is_2fa_enabled": False,
                "two_factor_code": None,
                "two_factor_expires": None
            }}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"[ERROR] DB Disable 2FA failed: {e}")
        return False
