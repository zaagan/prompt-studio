@echo off
REM Prompt Studio Development Runner (Windows)
REM This script checks dependencies, installs them if needed, and starts the app

setlocal enabledelayedexpansion

echo.
echo ^🚀 Prompt Studio Development Runner
echo ==================================

REM Function to print colored output (Windows doesn't support colors in batch easily)
set "INFO_PREFIX=[INFO]"
set "SUCCESS_PREFIX=[SUCCESS]"
set "WARNING_PREFIX=[WARNING]"
set "ERROR_PREFIX=[ERROR]"

REM Check if Node.js is installed
echo %INFO_PREFIX% Checking Node.js installation...

node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo %ERROR_PREFIX% Node.js is not installed!
    echo %INFO_PREFIX% Please install Node.js from https://nodejs.org/
    echo %INFO_PREFIX% Recommended version: 18.x or higher
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo %SUCCESS_PREFIX% Node.js found: !NODE_VERSION!

REM Extract major version number
for /f "tokens=1 delims=." %%a in ("!NODE_VERSION:~1!") do set NODE_MAJOR=%%a
if !NODE_MAJOR! lss 16 (
    echo %WARNING_PREFIX% Node.js version is older than recommended (v16+)
    echo %INFO_PREFIX% Your version: !NODE_VERSION!
    echo %INFO_PREFIX% Please consider upgrading for best compatibility
)

REM Check if npm is installed
echo %INFO_PREFIX% Checking npm installation...

npm --version >nul 2>&1
if !errorlevel! neq 0 (
    echo %ERROR_PREFIX% npm is not installed!
    echo %INFO_PREFIX% npm usually comes with Node.js installation
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo %SUCCESS_PREFIX% npm found: v!NPM_VERSION!

REM Check if we're in the correct directory
echo %INFO_PREFIX% Checking project directory...

if not exist "package.json" (
    echo %ERROR_PREFIX% package.json not found!
    echo %INFO_PREFIX% Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "main.js" (
    echo %ERROR_PREFIX% main.js not found!
    echo %INFO_PREFIX% Project structure appears incomplete
    pause
    exit /b 1
)

echo %SUCCESS_PREFIX% Project structure looks good

REM Create necessary directories
echo %INFO_PREFIX% Creating necessary directories...

if not exist "assets" mkdir "assets"
if not exist "src\database" mkdir "src\database"
if not exist "src\renderer" mkdir "src\renderer"
if not exist "scripts" mkdir "scripts"

echo %SUCCESS_PREFIX% Directories created

REM Install dependencies
echo %INFO_PREFIX% Checking dependencies...

if not exist "node_modules" (
    echo %INFO_PREFIX% Installing dependencies... (this may take a few minutes)
    
    npm install --verbose
    if !errorlevel! neq 0 (
        echo %ERROR_PREFIX% Failed to install dependencies
        echo %INFO_PREFIX% Try running: npm install --verbose
        echo %INFO_PREFIX% Or delete node_modules and package-lock.json, then try again
        pause
        exit /b 1
    )
    
    echo %SUCCESS_PREFIX% Dependencies installed successfully
) else (
    echo %SUCCESS_PREFIX% Dependencies already installed
    
    REM Check for outdated packages
    npm outdated >nul 2>&1
    if !errorlevel! equ 0 (
        echo %WARNING_PREFIX% Some dependencies may be outdated
        echo %INFO_PREFIX% Run 'npm update' to update them
    )
)

REM Check for native dependencies (sqlite3)
echo %INFO_PREFIX% Checking native dependencies...

if not exist "node_modules\sqlite3" (
    echo %WARNING_PREFIX% sqlite3 not found in node_modules
    echo %INFO_PREFIX% This might cause issues. Reinstalling dependencies...
    rmdir /s /q "node_modules" >nul 2>&1
    del "package-lock.json" >nul 2>&1
    npm install
    goto :continue_native_check
)

REM Check if sqlite3 binary exists (Windows specific paths)
set "SQLITE_FOUND=0"
if exist "node_modules\sqlite3\lib\binding\napi-v6-win32-x64\node_sqlite3.node" set "SQLITE_FOUND=1"
if exist "node_modules\sqlite3\lib\binding\napi-v6-win32-ia32\node_sqlite3.node" set "SQLITE_FOUND=1"

if !SQLITE_FOUND! equ 0 (
    echo %WARNING_PREFIX% sqlite3 binary not found, rebuilding...
    npm rebuild sqlite3
)

:continue_native_check
echo %SUCCESS_PREFIX% Native dependencies check complete

REM Set environment variables for development
echo %INFO_PREFIX% Setting development environment...

if "%NODE_ENV%"=="" set NODE_ENV=development

REM Enable Electron debugging if requested
if "%1"=="--debug" (
    set ELECTRON_ENABLE_LOGGING=1
    set ELECTRON_ENABLE_STACK_DUMPING=1
    echo %INFO_PREFIX% Debug mode enabled
)

echo %SUCCESS_PREFIX% Environment configured

echo.
echo %SUCCESS_PREFIX% All checks passed! 🎉
echo.

REM Start the application
echo %INFO_PREFIX% Starting Prompt Studio...
echo %INFO_PREFIX% Press Ctrl+C to stop the application
echo.

REM Add development flag to start with dev tools
npm run dev

if !errorlevel! neq 0 (
    echo.
    echo %ERROR_PREFIX% Application failed to start
    echo %INFO_PREFIX% Check the error messages above for details
    pause
    exit /b 1
)

REM Handle help argument
:help
if "%1"=="--help" goto :show_help
if "%1"=="-h" goto :show_help
goto :eof

:show_help
echo Prompt Studio Development Runner
echo.
echo Usage: %0 [options]
echo.
echo Options:
echo   --help, -h    Show this help message
echo   --debug       Enable debug mode with extra logging
echo.
echo This script will:
echo   1. Check Node.js and npm installation
echo   2. Verify project structure
echo   3. Install dependencies if needed
echo   4. Check native dependencies
echo   5. Start the application in development mode
echo.
pause
exit /b 0

endlocal