import os
from dotenv import load_dotenv
load_dotenv()
from database import db_conn

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
    check_indexes()
