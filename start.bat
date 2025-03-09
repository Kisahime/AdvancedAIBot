@echo off
echo ===================================================
echo Advanced AI Chatbot - Startup Script
echo ===================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    echo Then run this script again.
    pause
    exit /b 1
)

:: Display Node.js version
echo Node.js version:
node -v
echo.

:: Start the application
echo Starting the Advanced AI Chatbot application...
echo This will start both the server and client components.
echo.
echo Press Ctrl+C to stop the application when done.
echo.

node start-app.js

:: This part will only execute if the application exits normally
echo.
echo Application has been stopped.
echo.
pause