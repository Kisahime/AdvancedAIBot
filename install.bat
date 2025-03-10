@echo off
echo ===================================================
echo Advanced AI Chatbot - Installation Script
echo ===================================================
echo.

:: Check if Node.js is installed
node --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    echo and try again.
    pause
    exit /b 1
)

echo [✓] Node.js is installed
echo.

:: Create necessary directories
echo Creating necessary directories...
if not exist data mkdir data
if not exist data\mongodb mkdir data\mongodb
echo [✓] Directories created
echo.

:: Install server dependencies
echo Installing server dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install server dependencies.
    pause
    exit /b 1
)
echo [✓] Server dependencies installed
echo.

:: Install client dependencies
echo Installing client dependencies...
cd client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install client dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..
echo [✓] Client dependencies installed
echo.

echo ===================================================
echo Installation completed successfully!
echo.
echo You can now start the application using:
echo   - start.bat
echo   - OR: node start-app.js
echo ===================================================
echo.

pause