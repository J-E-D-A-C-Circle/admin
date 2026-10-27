@echo off
echo Stopping DVLA Asset Management System (AMS)...
docker compose -f ams/docker-compose.yml down
echo AMS stopped.
pause
