from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import datetime as dt
import re
import logging

router = APIRouter(prefix="/api", tags=["System"])
logger = logging.getLogger("coact")

@router.get("/health")
async def health_check(request: Request):
    """Health check endpoint for VM monitoring"""
    return ({
        "status": "healthy",
        "timestamp": dt.datetime.now().isoformat(),
        "version": "enhanced-reports-v1.0"
    })

@router.post("/contact-sales")
async def contact_sales(request: Request):
    """Store contact form submissions."""
    try:
        data = await request.json()
        if not data:
            return JSONResponse(content={"error": "Invalid JSON"}, status_code=400)

        name = data.get("name", "").strip()[:200]
        email = data.get("email", "").strip()[:254]
        
        if not name or not email:
            return JSONResponse(content={"error": "Name and email are required"}, status_code=400)

        if not re.match(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$', email):
            return JSONResponse(content={"error": "Invalid email format"}, status_code=400)

        logger.info(f"Contact form captured: {name} ({email})")
        return JSONResponse(content={"success": True}, status_code=200)

    except Exception as e:
        logger.error(f"[ERROR] Contact form error: {e}")
        return JSONResponse(content={"error": "Failed to save contact request"}, status_code=500)
