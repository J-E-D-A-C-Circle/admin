@echo off
echo ========================================================
echo Stopping all DVLA Administration Services...
echo ========================================================
docker compose down
echo.
echo All DVLA services and containers stopped.
pause
