import os
from dotenv import load_dotenv

load_dotenv()
from pymongo import MongoClient

MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/coact")
client = MongoClient(MONGODB_URI)

try:
    db = client.get_default_database()
except:
    db = client.get_database("coact")

print(f"Connected to database: {db.name}")

collections = db.list_collection_names()
print(f"Collections found: {collections}")

for coll in collections:
    db.drop_collection(coll)
    print(f"Dropped collection: {coll}")

print("All database data has been deleted successfully.")
