"""Pytest configuration: make the backend root importable.

The report modules (cli_report, mentorship_report) live at the backend root
and are not part of an installed package, so we add that directory to the
module search path for the test run.

Tests must never write to the live MongoDB (or Redis); we force the SQLite
local fallback for the whole suite before any backend module is imported.
"""

import os
import sys
from pathlib import Path

os.environ["MONGODB_URI"] = "sqlite://test"
os.environ["REDIS_URL"] = ""

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))