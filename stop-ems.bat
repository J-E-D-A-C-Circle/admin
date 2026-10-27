@echo off
echo Stopping DVLA Expenditure Management System (EMS)...
docker compose -f ems/docker-compose.yml down
echo EMS stopped.
pause
