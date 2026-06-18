from database import db_conn

def clear_all_history():
    try:
        if db_conn is None:
            print("Database connection is not initialized.")
            return
            
        result = db_conn.practice_history.delete_many({})
        print(f"Successfully deleted {result.deleted_count} conversation sessions from MongoDB.")
    except Exception as e:
        print(f"Error deleting history: {e}")

if __name__ == "__main__":
    clear_all_history()
