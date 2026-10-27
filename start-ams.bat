@echo off
echo Starting DVLA Asset Management System (AMS)...
docker compose -f ams/docker-compose.yml up -d --build
echo.
echo AMS launched at http://localhost:3001
pause
