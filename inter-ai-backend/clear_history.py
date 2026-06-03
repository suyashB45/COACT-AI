from app import app
from database import db, PracticeHistory

def clear_all_history():
    try:
        num_deleted = db.session.query(PracticeHistory).delete()
        db.session.commit()
        print(f"Successfully deleted {num_deleted} conversation sessions.")
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting history: {e}")

if __name__ == "__main__":
    clear_all_history()
