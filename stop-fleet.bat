@echo off
echo Stopping DVLA Fleet Management System...
docker compose -f fleet-mgt/docker-compose.yml down
echo Fleet Management System stopped.
pause
