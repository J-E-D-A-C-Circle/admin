@echo off
echo Starting DVLA Central Gateway Portal...
docker compose -f portal/docker-compose.yml up -d --build
echo.
echo Central Gateway Portal launched at http://localhost:3000
pause
