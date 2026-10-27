@echo off
echo Starting DVLA Fleet Management System...
docker compose -f fleet-mgt/docker-compose.yml up -d --build
echo.
echo Fleet Management System launched at http://localhost:3003
pause
