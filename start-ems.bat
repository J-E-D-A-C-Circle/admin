@echo off
echo Starting DVLA Expenditure Management System (EMS)...
docker compose -f ems/docker-compose.yml up -d --build
echo.
echo EMS launched at http://localhost:3002
pause
