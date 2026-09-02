from dotenv import load_dotenv

load_dotenv()
from database import db_conn


def create_indexes():
    if db_conn is None:
        print("Database connection is not initialized.")
        return

    print("Creating MongoDB indexes...")
    db_conn.practice_history.create_index([("userId", 1), ("createdAt", -1)])
    db_conn.users.create_index([("email", 1)], unique=True)
    db_conn.user_token_usage.create_index([("userId", 1)])

    db_conn.ai_usage_counters.create_index(
        [("scope", 1), ("window_start", 1)],
        name="idx_ai_usage_scope_window",
    )
    db_conn.ai_usage_log.create_index(
        [("user_id", 1), ("created_at", 1)],
        name="idx_ai_usage_log_user_created",
    )
    db_conn.ai_usage_log.create_index(
        [("organization_id", 1), ("created_at", 1)],
        name="idx_ai_usage_log_org_created",
    )
    print("Done.")


def check_indexes():
    if db_conn is None:
        print("Database connection is not initialized.")
        return

    print("Checking existing MongoDB indexes...")
    for coll_name in db_conn.list_collection_names():
        print(f"\nCollection: {coll_name}")
        indexes = db_conn[coll_name].index_information()
        for name, info in indexes.items():
            print(f" - {name}: {info['key']}")

if __name__ == "__main__":
    create_indexes()
    check_indexes()
