"""Pytest configuration: make the backend root importable.

The report modules (cli_report, mentorship_report) live at the backend root
and are not part of an installed package, so we add that directory to the
module search path for the test run.

Tests must never touch the live MongoDB (or Redis). We patch pymongo's
MongoClient to use an in-memory mongomock instance BEFORE any backend module
is imported, so database.py connects to an isolated mock instead of any real
database. Redis is disabled entirely.
"""

import os
import sys
from pathlib import Path

os.environ["MONGODB_URI"] = "mongodb://localhost:27017/coact_test"
os.environ["REDIS_URL"] = ""

import pymongo  # noqa: E402
import mongomock  # noqa: E402

# database.py does `from pymongo import MongoClient` at import time; by
# replacing the attribute before the backend modules are imported we make it
# use an in-memory mock instead of touching any real MongoDB instance.
pymongo.MongoClient = mongomock.MongoClient  # type: ignore[assignment]

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
