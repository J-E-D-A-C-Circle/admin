@echo off
echo Stopping DVLA Central Gateway Portal...
docker compose -f portal/docker-compose.yml down
echo Central Gateway Portal stopped.
pause
