@echo off
REM ============================================================
REM  FoodGuard - start all three services with one double-click.
REM  Opens 3 windows: AI (:8000), Backend (:5001), Frontend (:3000).
REM  Close those windows (or Ctrl+C in each) to stop.
REM  Run setup.bat first if you haven't installed deps yet.
REM ============================================================
echo Starting FoodGuard (AI :8000  Backend :5001  Frontend :3000)...

start "FoodGuard AI"       /d "%~dp0FoodGuard-AI"       cmd /k "venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
start "FoodGuard Backend"  /d "%~dp0FoodGuard-Backend"  cmd /k "npm run dev"
start "FoodGuard Frontend" /d "%~dp0FoodGuard-Frontend" cmd /k "npm run dev"

echo.
echo Launched in 3 separate windows. Open http://localhost:3000
