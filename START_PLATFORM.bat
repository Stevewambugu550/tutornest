@echo off
echo ====================================
echo Starting TutorNest Platform
echo ====================================
echo.

echo Opening TutorNest in your browser...
start http://localhost:3000

echo.
echo Starting Backend Server...
cd backend
call npm install --silent
echo.
echo Backend server running...
node server.js

pause
