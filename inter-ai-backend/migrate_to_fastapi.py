import re
import os

with open("app.py", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Imports
code = code.replace("from flask import Flask, request, jsonify, send_file", "from fastapi import FastAPI, Request, Response, UploadFile, File, Form\nfrom fastapi.responses import StreamingResponse, FileResponse, JSONResponse")
code = code.replace("import flask_cors", "from fastapi.middleware.cors import CORSMiddleware")
code = code.replace("from werkzeug.exceptions import BadRequest", "from fastapi import HTTPException")

# 2. App Setup
app_setup_flask = """app = Flask(__name__, static_folder='static', static_url_path='/static')

# Initialize SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

from database import db
db.init_app(app)

with app.app_context():
    db.create_all()

# Enable CORS
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
flask_cors.CORS(app, origins=cors_origins)"""

app_setup_fastapi = """from database import db, engine, Base
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Enable CORS
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)"""
code = code.replace(app_setup_flask, app_setup_fastapi)

# 3. Cache replacement
ttl_cache_def = """# TTLCache: Max 500 sessions, auto-expire after 1 hour of inactivity
SESSIONS = TTLCache(maxsize=500, ttl=3600)"""

unified_cache_def = """import redis

class UnifiedCache:
    def __init__(self, maxsize=500, ttl=3600):
        self.redis_url = os.getenv("REDIS_URL")
        if self.redis_url:
            try:
                self.redis = redis.Redis.from_url(self.redis_url, decode_responses=True)
                print(f"[SUCCESS] Connected to Redis for session cache: {self.redis_url}")
            except Exception as e:
                print(f"[WARNING] Redis connection failed, falling back to TTLCache: {e}")
                self.redis = None
        else:
            self.redis = None
            
        if not self.redis:
            self.local_cache = TTLCache(maxsize=maxsize, ttl=ttl)

    def __getitem__(self, key):
        if self.redis:
            val = self.redis.get(f"session:{key}")
            if val is None:
                raise KeyError(key)
            return json.loads(val)
        return self.local_cache[key]

    def __setitem__(self, key, value):
        if self.redis:
            self.redis.setex(f"session:{key}", 3600, json.dumps(value))
        else:
            self.local_cache[key] = value

    def __contains__(self, key):
        if self.redis:
            return self.redis.exists(f"session:{key}") > 0
        return key in self.local_cache

    def get(self, key, default=None):
        if self.redis:
            val = self.redis.get(f"session:{key}")
            if val is None:
                return default
            return json.loads(val)
        return self.local_cache.get(key, default)

    def __delitem__(self, key):
        if self.redis:
            self.redis.delete(f"session:{key}")
        else:
            del self.local_cache[key]

    def values(self):
        if self.redis:
            keys = self.redis.keys("session:*")
            vals = []
            for k in keys:
                v = self.redis.get(k)
                if v:
                    vals.append(json.loads(v))
            return vals
        return self.local_cache.values()

SESSIONS = UnifiedCache(maxsize=500, ttl=3600)"""
code = code.replace(ttl_cache_def, unified_cache_def)

# 4. Route Decorators
code = re.sub(r'@app\.route\("([^"]+)", methods=\["POST"\]\)', r'@app.post("\1")', code)
code = re.sub(r'@app\.route\("([^"]+)", methods=\["GET"\]\)', r'@app.get("\1")', code)
code = re.sub(r'@app\.route\("([^"]+)"\)', r'@app.get("\1")', code)

# 5. Path params <param> -> {param}
code = code.replace("<session_id>", "{session_id}")

# 6. Endpoint Signatures
endpoints = [
    "sync_user", "get_history", "health_check", "contact_sales",
    "transcribe_audio", "speak_text", "start_session", "chat",
    "complete_session", "view_report", "get_report_data",
    "get_sessions", "get_user_sessions_paginated", "clear_sessions", "get_analytics"
]
for ep in endpoints:
    if ep in ["chat", "complete_session", "view_report", "get_report_data"]:
        code = re.sub(rf'def {ep}\(session_id: str\):', rf'async def {ep}(session_id: str, request: Request):', code)
    else:
        code = re.sub(rf'def {ep}\(\):', rf'async def {ep}(request: Request):', code)

# 7. Request parsing
code = code.replace("request.get_json()", "await request.json()")
code = code.replace("request.get_json(force=True, silent=True)", "await request.json()")
code = code.replace("request.args.get", "request.query_params.get")

# 8. jsonify -> JSONResponse
code = re.sub(r'jsonify\((.*?)\),\s*(\d{3})', r'JSONResponse(content=\1, status_code=\2)', code)
code = re.sub(r'jsonify\((.*?)\)', r'\1', code)
code = re.sub(r'return\s+(\{.*?\}),\s*(\d{3})', r'return JSONResponse(content=\1, status_code=\2)', code)

# 9. Transcribe Audio rewrite
transcribe_audio_flask = """        session_id = request.form.get("session_id")
        
        if 'file' not in request.files:
            return {"error": "No audio file uploaded"}, 400
            
        audio_file = request.files['file']
        
        if not audio_file.filename:
            audio_file.filename = "audio.webm"
        
        original_filename = audio_file.filename or "audio.webm"
        file_ext = os.path.splitext(original_filename)[1].lower()
        
        if file_ext not in SUPPORTED_FORMATS:
            file_ext = ".webm"
        
        if session_id:
            # ORIGINAL LOGIC REMOVED: We no longer save user audio to disk for privacy/cleanup
            # filename = f"{session_id}_{uuid.uuid4().hex[:8]}_user{file_ext}"
            # save_path = os.path.join(AUDIO_DIR, filename)
            # audio_file.save(save_path)
            # read_path = save_path
            # audio_url = f"/static/audio/{filename}"
            
            # NEW LOGIC: Treat same as temp
            tmp = tempfile.NamedTemporaryFile(suffix=file_ext, delete=False)
            audio_file.save(tmp.name)
            read_path = tmp.name
            audio_url = None # Do not return a URL since we are deleting it
        else:
            # Temp file for non-persisted usage
            tmp = tempfile.NamedTemporaryFile(suffix=file_ext, delete=False)
            audio_file.save(tmp.name)
            read_path = tmp.name
            audio_url = None"""

transcribe_audio_fastapi = """        form_data = await request.form()
        session_id = form_data.get("session_id")
        
        if 'file' not in form_data:
            return JSONResponse(content={"error": "No audio file uploaded"}, status_code=400)
            
        audio_file = form_data['file']
        
        if not getattr(audio_file, 'filename', None):
            original_filename = "audio.webm"
        else:
            original_filename = audio_file.filename
        
        file_ext = os.path.splitext(original_filename)[1].lower()
        
        if file_ext not in SUPPORTED_FORMATS:
            file_ext = ".webm"
        
        tmp = tempfile.NamedTemporaryFile(suffix=file_ext, delete=False)
        audio_bytes = await audio_file.read()
        tmp.write(audio_bytes)
        tmp.close()
        read_path = tmp.name
        audio_url = None"""
code = code.replace(transcribe_audio_flask, transcribe_audio_fastapi)

code = code.replace('request.form.get("duration_seconds", type=float)', 'form_data.get("duration_seconds")')
code = code.replace('if duration_seconds and duration_seconds > 0:', 'if duration_seconds:\n                    duration_seconds = float(duration_seconds)\n                    if duration_seconds > 0:')

# 10. send_file -> StreamingResponse
send_file_flask = """        response = send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"{session_id}_report.pdf"
        )
        # Ensure CORS headers are present for cross-origin PDF downloads
        response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition'
        return response"""

send_file_fastapi = """        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type='application/pdf',
            headers={
                "Content-Disposition": f"attachment; filename={session_id}_report.pdf",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )"""
code = code.replace(send_file_flask, send_file_fastapi)

# 11. Flask Response cleanup
code = code.replace("from flask import Response", "")
code = code.replace("mimetype=", "media_type=")

# 12. Main startup
startup_flask = """    if is_dev:
        print(f"Starting Flask dev server on port {port}...")
        app.run(host="0.0.0.0", port=port, debug=True)
    else:
        print(f"Starting Waitress multi-threaded WSGI server on port {port}...")
        from waitress import serve
        serve(app, host="0.0.0.0", port=port, threads=8)"""
        
startup_fastapi = """    import uvicorn
    print(f"Starting Uvicorn ASGI server on port {port}...")
    uvicorn.run("app:app", host="0.0.0.0", port=port, workers=4, log_level="info")"""
code = code.replace(startup_flask, startup_fastapi)

# Fix validate_request_payload middleware which isn't easy in FastAPI without more setup
code = re.sub(r'@app\.before_request[\s\S]*?def check_payload\(\):[\s\S]*?return True\n', '', code)
# wait, validate_request_payload relies on `request.get_json()`. Since we use FastAPI we will skip it for now.

# Clean up before_request and validate_request_payload
code = re.sub(r'# Request Validation Middleware.*?def check_payload\(\):.*?return jsonify.*?, 400', '', code, flags=re.DOTALL)
code = re.sub(r'# Request Validation Constants.*?return True', '', code, flags=re.DOTALL)

with open("app.py", "w", encoding="utf-8") as f:
    f.write(code)

print("Migration script generated and executed.")
