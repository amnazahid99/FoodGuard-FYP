"""
FoodGuard AI Service — FastAPI entrypoint.

Run with:  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

Every AI router is mounted under its own /ai/* prefix (defined inside each
route module). The Express backend talks to this service via FASTAPI_URL.
"""
import logging
from datetime import datetime, timezone

# Load .env into os.environ BEFORE importing routes/services, since some
# services read their keys via os.getenv() at import time.
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.routes import (
    health,
    meal,
    wastage,
    dashboard,
    ocr,
    expiry,
    expiry_tips,
    nutrition,
    nutrition_analyze,
    meal_plan,
    chatbot,
)

settings = get_settings()

logging.basicConfig(
    level=getattr(logging, str(settings.log_level).upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("foodguard-ai")

app = FastAPI(
    title="FoodGuard AI Service",
    description="AI microservice for meal recommendations, OCR, nutrition and waste insights.",
    version="1.0.0",
)

# CORS — the Express backend calls server-to-server, but allowing the dev
# origins makes the interactive /docs and any direct browser calls work too.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount every feature router. Each one already declares its own /ai/* prefix.
for module in (
    health,
    meal,
    wastage,
    dashboard,
    ocr,
    expiry,
    expiry_tips,
    nutrition,
    nutrition_analyze,
    meal_plan,
    chatbot,
):
    app.include_router(module.router)


@app.get("/", tags=["Health"])
async def root():
    return {"service": "foodguard-ai", "status": "ok", "docs": "/docs"}


@app.get("/health", tags=["Health"])
async def health_check():
    """Liveness/readiness probe. Reports which AI providers are configured."""
    return JSONResponse(
        {
            "status": "ok",
            "service": "foodguard-ai",
            "groq_api": bool(settings.groq_api_key),
            "gemini_api": bool(settings.gemini_api_key),
            "fireworks_api": bool(settings.fireworks_api_key),
            "spoonacular_api": bool(settings.spoonacular_api_key),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


# Mirror the liveness probe under /ai/health so a single proxied prefix works too.
@app.get("/ai/health", tags=["Health"])
async def ai_health_check():
    return await health_check()


@app.on_event("startup")
async def _log_startup():
    if not settings.groq_api_key:
        logger.warning(
            "GROQ_API_KEY is not set — meal/nutrition/chatbot endpoints will return 503 "
            "until it is configured in FoodGuard-AI/.env"
        )
    logger.info("FoodGuard AI service started")
