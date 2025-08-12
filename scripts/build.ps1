# Prompt Studio Production Build Script (Windows PowerShell)
# This script creates distributable packages for Windows

param(
    [switch]$Clean,
    [switch]$SkipTests,
    [switch]$Force,
    [switch]$Help
)

# Function to write colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Show-Help {
    Write-Host "Prompt Studio Production Builder (PowerShell)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\build-app.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -Help         Show this help message" -ForegroundColor Gray
    Write-Host "  -Clean        Perform clean install of dependencies" -ForegroundColor Gray
    Write-Host "  -SkipTests    Skip running tests" -ForegroundColor Gray
    Write-Host "  -Force        Force build even if tests fail" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Environment variables:" -ForegroundColor White
    Write-Host "  `$env:SKIP_TESTS     Skip tests (set to 'true')" -ForegroundColor Gray
    Write-Host "  `$env:FORCE_BUILD    Force build despite test failures" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    # Check Node.js
    try {
        $nodeVersion = & node --version 2>$null
        Write-Success "Node.js: $nodeVersion"
    } catch {
        Write-Error "Node.js is not installed or not in PATH!"
        Write-Status "Please install Node.js from https://nodejs.org/"
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = & npm --version 2>$null
        Write-Success "npm: v$npmVersion"
    } catch {
        Write-Error "npm is not installed or not in PATH!"
        exit 1
    }
    
    # Check project structure
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found! Run from project root."
        exit 1
    }
    
    if (-not (Test-Path "main.js")) {
        Write-Error "main.js not found! Incomplete project structure."
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

function Clear-BuildDirs {
    Write-Status "Cleaning previous builds..."
    
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Status "Removed old dist directory"
    }
    
    if (Test-Path "build") {
        Remove-Item -Recurse -Force "build"
        Write-Status "Removed old build directory"
    }
    
    Write-Success "Build directories cleaned"
}

function Install-Dependencies {
    param([bool]$CleanInstall)
    
    Write-Status "Installing/updating dependencies..."
    
    # Clean install for production
    if ($CleanInstall) {
        Write-Status "Performing clean install..."
        if (Test-Path "node_modules") {
            Remove-Item -Recurse -Force "node_modules"
        }
        if (Test-Path "package-lock.json") {
            Remove-Item -Force "package-lock.json"
        }
    }
    
    # Install production dependencies
    Write-Status "Installing production dependencies..."
    try {
        & npm ci --only=production 2>$null
    } catch {
        & npm install --only=production
    }
    
    # Install dev dependencies needed for building
    Write-Status "Installing development dependencies..."
    & npm install --only=dev
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
    
    Write-Success "Dependencies installed"
}

function Rebuild-Native {
    Write-Status "Rebuilding native modules..."
    
    # Rebuild sqlite3 for current platform
    if (Test-Path "node_modules\sqlite3") {
        Write-Status "Rebuilding sqlite3..."
        & npm rebuild sqlite3
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "sqlite3 rebuilt for Windows"
        } else {
            Write-Warning "Failed to rebuild sqlite3"
        }
    }
    
    Write-Success "Native modules rebuild completed"
}

function New-AppIcon {
    Write-Status "Checking app icon..."
    
    if (-not (Test-Path "assets\icon.png")) {
        Write-Warning "Icon not found"
        Write-Status "Please add a 256x256 PNG icon to assets\icon.png"
        
        # Create assets directory if it doesn't exist
        if (-not (Test-Path "assets")) {
            New-Item -ItemType Directory -Path "assets" | Out-Null
        }
    } else {
        Write-Success "App icon found"
    }
    
    # Create .ico file for Windows if it doesn't exist
    if ((Test-Path "assets\icon.png") -and (-not (Test-Path "assets\icon.ico"))) {
        Write-Status "Converting PNG to ICO for Windows..."
        
        # Try to use ImageMagick if available
        try {
            & convert "assets\icon.png" -resize 256x256 "assets\icon.ico" 2>$null
            Write-Success "Windows icon created"
        } catch {
            Write-Warning "ImageMagick not found, using PNG as fallback"
            Write-Status "For better Windows integration, install ImageMagick or create an .ico file manually"
        }
    }
}

function Invoke-Tests {
    if ($SkipTests -or $env:SKIP_TESTS -eq "true") {
        Write-Status "Skipping tests"
        return
    }
    
    Write-Status "Running tests..."
    
    try {
        & npm run test 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "All tests passed"
        } else {
            Write-Warning "Tests failed or not available"
            if (-not $Force -and $env:FORCE_BUILD -ne "true") {
                $response = Read-Host "Continue with build? (y/N)"
                if ($response -notmatch "^[Yy]$") {
                    Write-Error "Build cancelled due to test failures"
                    exit 1
                }
            }
        }
    } catch {
        Write-Warning "No test script found"
    }
}

function Build-Application {
    Write-Status "Building Windows application..."
    
    # Set build environment
    $env:NODE_ENV = "production"
    
    Write-Status "Running electron-builder for Windows..."
    & npm run build:win
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Build completed successfully!"
    } else {
        Write-Error "Build failed!"
        exit 1
    }
}

function Show-BuildResults {
    Write-Status "Build Results:"
    Write-Host ""
    
    if (Test-Path "dist") {
        Write-Success "Built packages:"
        Get-ChildItem "dist" | Format-Table Name, Length, LastWriteTime -AutoSize
        
        Write-Host ""
        Write-Status "Package sizes:"
        Get-ChildItem "dist" | ForEach-Object {
            $size = if ($_.Length -gt 1MB) { "{0:N1} MB" -f ($_.Length / 1MB) } else { "{0:N1} KB" -f ($_.Length / 1KB) }
            Write-Host "  $($_.Name): $size" -ForegroundColor Cyan
        }
        
        Write-Host ""
        $distPath = Resolve-Path "dist"
        Write-Success "Build artifacts saved to: $distPath"
    } else {
        Write-Warning "No dist directory found - build may have failed"
    }
}

function Sign-Application {
    if ($env:SIGNTOOL_PATH -and $env:CERT_THUMBPRINT) {
        Write-Status "Code signing application..."
        
        $exeFiles = Get-ChildItem "dist" -Filter "*.exe" -Recurse
        foreach ($exe in $exeFiles) {
            Write-Status "Signing $($exe.Name)..."
            & "$env:SIGNTOOL_PATH" sign /sha1 "$env:CERT_THUMBPRINT" /t "http://timestamp.digicert.com" "$($exe.FullName)"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Signed $($exe.Name)"
            } else {
                Write-Warning "Failed to sign $($exe.Name)"
            }
        }
    } else {
        Write-Status "Code signing skipped (no signing certificate configured)"
        Write-Status "To enable signing, set SIGNTOOL_PATH and CERT_THUMBPRINT environment variables"
    }
}

function Main {
    Write-Host ""
    Write-Host "📦 Prompt Studio Production Builder (PowerShell)" -ForegroundColor Cyan
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host ""
    
    if ($Help) {
        Show-Help
    }
    
    Write-Status "Starting build process for Windows..."
    
    try {
        Test-Prerequisites
        Clear-BuildDirs
        Install-Dependencies -CleanInstall $Clean
        Rebuild-Native
        New-AppIcon
        Invoke-Tests
        Build-Application
        Sign-Application
        Show-BuildResults
        
        Write-Host ""
        Write-Success "🎉 Build process completed!"
        Write-Status "To install: Run the .exe installer from the dist/ folder"
        Write-Status "Portable version: Run Prompt Studio.exe directly"
        Write-Host ""
        
    } catch {
        Write-Error "Build process failed: $($_.Exception.Message)"
        Write-Host $_.ScriptStackTrace -ForegroundColor Red
        exit 1
    }
}

# Handle Ctrl+C
try {
    Main
} catch [System.Management.Automation.PipelineStoppedException] {
    Write-Status "Build cancelled by user"
    exit 1
}