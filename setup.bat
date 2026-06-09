@echo off
REM ============================================================
REM  FoodGuard - one-time setup (installs all three services)
REM  Double-click this once. Needs Python 3.11-3.13 + Node.js.
REM ============================================================
cd /d "%~dp0"
echo === FoodGuard setup ===
echo.

echo [1/3] AI service - creating Python 3.11 virtual env + installing deps...
cd FoodGuard-AI
py -3.11 -m venv venv
venv\Scripts\python -m pip install --upgrade pip
venv\Scripts\python -m pip install -r requirements.txt
cd ..
echo.

echo [2/3] Backend - npm install...
cd FoodGuard-Backend
call npm install
cd ..
echo.

echo [3/3] Frontend - npm install...
cd FoodGuard-Frontend
call npm install
cd ..
echo.

echo ============================================================
echo  Setup complete. Now double-click  dev.bat  to start.
echo  (If AI step failed: install Python 3.11 from python.org
echo   and tick "Add python.exe to PATH".)
echo ============================================================
pause
