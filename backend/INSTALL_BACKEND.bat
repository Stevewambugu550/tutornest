@echo off
echo =====================================================
echo  TutorNest Backend Installer
echo =====================================================
echo.
echo This will install all necessary dependencies for your REAL backend API.

:: Bypass execution policy for this session and run npm install
powershell -ExecutionPolicy Bypass -Command "npm install"

echo.
echo ✅ Backend installation complete!
echo.
echo To start your REAL API server, run:
echo node server.js
echo.
pause
