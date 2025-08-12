#!/bin/bash

# Prompt Studio Development Runner (Unix/macOS/Linux)
# This script checks dependencies, installs them if needed, and starts the app

set -e  # Exit on any error

# Global variables
PACKAGE_MANAGER=""

echo "🚀 Prompt Studio Development Runner"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed!"
        print_status "Please install Node.js from https://nodejs.org/"
        print_status "Recommended version: 18.x or higher"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    
    # Check Node version (require v16+)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 16 ]; then
        print_warning "Node.js version is older than recommended (v16+)"
        print_status "Your version: $NODE_VERSION"
        print_status "Please consider upgrading for best compatibility"
    fi
}

# Check package manager (prefer pnpm, fallback to npm)
check_package_manager() {
    print_status "Checking package manager..."
    
    # Check for pnpm first (project preference)
    if command -v pnpm &> /dev/null; then
        PACKAGE_MANAGER="pnpm"
        PNPM_VERSION=$(pnpm --version)
        print_success "pnpm found: v$PNPM_VERSION"
        return
    fi
    
    # Fallback to npm
    if command -v npm &> /dev/null; then
        PACKAGE_MANAGER="npm"
        NPM_VERSION=$(npm --version)
        print_success "npm found: v$NPM_VERSION"
        return
    fi
    
    print_error "No package manager found!"
    print_status "Please install pnpm (recommended) or npm"
    print_status "pnpm: npm install -g pnpm"
    print_status "npm: usually comes with Node.js installation"
    exit 1
}

# Check if we're in the correct directory
check_directory() {
    print_status "Checking project directory..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found!"
        print_status "Please run this script from the project root directory"
        exit 1
    fi
    
    # Check for TypeScript Electron project structure
    if [ ! -f "electron/main.ts" ] && [ ! -f "dist-electron/main.js" ]; then
        print_error "Electron main file not found!"
        print_status "Looking for electron/main.ts or dist-electron/main.js"
        print_status "Project structure appears incomplete"
        exit 1
    fi
    
    if [ ! -f "vite.config.ts" ]; then
        print_error "vite.config.ts not found!"
        print_status "This doesn't appear to be a Vite-based Electron project"
        exit 1
    fi
    
    print_success "Project structure looks good"
}

# Install dependencies
install_dependencies() {
    print_status "Checking dependencies..."
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies... (this may take a few minutes)"
        
        # Use the detected package manager
        if $PACKAGE_MANAGER install; then
            print_success "Dependencies installed successfully"
        else
            print_error "Failed to install dependencies"
            print_status "Try running: $PACKAGE_MANAGER install"
            print_status "Or delete node_modules and lock files, then try again"
            exit 1
        fi
    else
        print_success "Dependencies already installed"
        
        # Check if we need to update (only for npm, pnpm has different syntax)
        if [ "$PACKAGE_MANAGER" = "npm" ] && npm outdated --parseable 2>/dev/null | grep -q .; then
            print_warning "Some dependencies may be outdated"
            print_status "Run '$PACKAGE_MANAGER update' to update them"
        fi
    fi
}

# Check for native dependencies (sqlite3)
check_native_deps() {
    print_status "Checking native dependencies..."
    
    if [ ! -d "node_modules/sqlite3" ]; then
        print_warning "sqlite3 not found in node_modules"
        print_status "This might cause issues. Reinstalling dependencies..."
        rm -rf node_modules
        if [ -f "pnpm-lock.yaml" ]; then
            rm -f pnpm-lock.yaml
        fi
        if [ -f "package-lock.json" ]; then
            rm -f package-lock.json
        fi
        $PACKAGE_MANAGER install
        return
    fi
    
    # Check if sqlite3 binary exists for current platform
    PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    # Map architecture names
    case "$ARCH" in
        x86_64) ARCH="x64" ;;
        aarch64|arm64) ARCH="arm64" ;;
    esac
    
    SQLITE_BINDING="node_modules/sqlite3/lib/binding/napi-v6-${PLATFORM}-${ARCH}/node_sqlite3.node"
    
    if [ ! -f "$SQLITE_BINDING" ]; then
        print_warning "sqlite3 binary not found for $PLATFORM-$ARCH, rebuilding..."
        $PACKAGE_MANAGER rebuild sqlite3
    fi
    
    print_success "Native dependencies check complete"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p assets
    mkdir -p src/database
    mkdir -p src/renderer
    mkdir -p scripts
    
    print_success "Directories created"
}

# Set environment variables for development
set_dev_env() {
    print_status "Setting development environment..."
    
    # Set NODE_ENV if not already set
    if [ -z "$NODE_ENV" ]; then
        export NODE_ENV=development
    fi
    
    # Enable Electron debugging if requested
    if [ "$1" = "--debug" ]; then
        export ELECTRON_ENABLE_LOGGING=1
        export ELECTRON_ENABLE_STACK_DUMPING=1
        export ENABLE_DEV_TOOLS=true
        print_status "Debug mode enabled - DevTools will open automatically"
    else
        print_status "DevTools disabled by default - use Ctrl+Shift+I or F12 to toggle"
    fi
    
    print_success "Environment configured"
}

# Start the application
start_app() {
    print_status "Starting Prompt Studio..."
    print_status "This will start both the Vite dev server and Electron"
    print_status "Press Ctrl+C to stop the application"
    echo ""
    
    # Use the correct development command for Electron + Vite
    $PACKAGE_MANAGER run electron:dev
}

# Main execution
main() {
    echo ""
    print_status "Starting pre-flight checks..."
    
    check_node
    check_package_manager
    check_directory
    create_directories
    install_dependencies
    check_native_deps
    set_dev_env "$1"
    
    echo ""
    print_success "All checks passed! 🎉"
    echo ""
    
    start_app
}

# Handle script arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Prompt Studio Development Runner"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo "  --debug       Enable debug mode with extra logging"
    echo ""
    echo "This script will:"
    echo "  1. Check Node.js and package manager installation (pnpm preferred)"
    echo "  2. Verify TypeScript Electron + Vite project structure"
    echo "  3. Install dependencies if needed"
    echo "  4. Check native dependencies (sqlite3)"
    echo "  5. Start the application in development mode (Vite + Electron)"
    echo ""
    exit 0
fi

# Trap Ctrl+C and cleanup
trap 'print_status "Shutting down..."; exit 0' INT

# Run main function
main "$1"