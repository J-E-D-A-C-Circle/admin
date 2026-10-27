@echo off
echo ========================================================
echo Starting DVLA Central Enterprise Suite (Portal, AMS, EMS, Fleet)...
echo ========================================================
docker compose up -d --build
echo.
echo ========================================================
echo All DVLA Administration Services Launched Successfully!
echo.
echo [Central Gateway]:   http://localhost:3000
echo [AMS Portal]:        http://localhost:3001
echo [EMS Portal]:        http://localhost:3002
echo [Fleet Portal]:      http://localhost:3003
echo [AMS phpMyAdmin]:    http://localhost:8080
echo [EMS phpMyAdmin]:    http://localhost:8082
echo [Fleet phpMyAdmin]:  http://localhost:8083
echo ========================================================
pause
