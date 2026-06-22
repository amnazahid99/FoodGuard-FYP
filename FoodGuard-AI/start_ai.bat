@echo off
echo Starting FoodGuard AI Service...
cd /d "%~dp0FoodGuard-AI"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000