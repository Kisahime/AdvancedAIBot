@echo off
echo ===================================================
echo Advanced AI Chatbot - Installation Script
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

:: Display Node.js and npm versions
echo Node.js version:
node -v
echo npm version:
npm -v
echo.

:: Create necessary directories if they don't exist
echo Creating necessary directories...
if not exist "data\mongodb" mkdir "data\mongodb"
echo.

:: Install server dependencies
echo Installing server dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to install server dependencies.
    pause
    exit /b 1
)
echo Server dependencies installed successfully.
echo.

:: Install client dependencies
echo Installing client dependencies...
cd client
call npm install
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to install client dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..
echo Client dependencies installed successfully.
echo.

:: Setup complete
echo ===================================================
echo Installation completed successfully!
echo.
echo ===================================================
echo.

pause