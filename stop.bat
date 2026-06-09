@echo off
REM ============================================================
REM  FoodGuard - stop all three services.
REM  Kills whatever is listening on :8000 :5001 :3000
REM  (AI, Backend, Frontend). Safe to run anytime.
REM ============================================================
echo Stopping FoodGuard services on :8000 :5001 :3000 ...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000,5001,3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"
echo Done.
pause
