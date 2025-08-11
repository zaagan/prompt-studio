#!/bin/bash

# Prompt Studio Development Runner (Unix/macOS/Linux)
# This script checks dependencies, installs them if needed, and starts the app

set -e  # Exit on any error

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

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed!"
        print_status "npm usually comes with Node.js installation"
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_success "npm found: v$NPM_VERSION"
}

# Check if we're in the correct directory
check_directory() {
    print_status "Checking project directory..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found!"
        print_status "Please run this script from the project root directory"
        exit 1
    fi
    
    if [ ! -f "main.js" ]; then
        print_error "main.js not found!"
        print_status "Project structure appears incomplete"
        exit 1
    fi
    
    print_success "Project structure looks good"
}

# Install dependencies
install_dependencies() {
    print_status "Checking dependencies..."
    
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
        print_status "Installing dependencies... (this may take a few minutes)"
        
        # Try npm install with some optimizations
        if npm install --verbose; then
            print_success "Dependencies installed successfully"
        else
            print_error "Failed to install dependencies"
            print_status "Try running: npm install --verbose"
            print_status "Or delete node_modules and package-lock.json, then try again"
            exit 1
        fi
    else
        print_success "Dependencies already installed"
        
        # Check if we need to update
        if npm outdated --parseable 2>/dev/null | grep -q .; then
            print_warning "Some dependencies may be outdated"
            print_status "Run 'npm update' to update them"
        fi
    fi
}

# Check for native dependencies (sqlite3)
check_native_deps() {
    print_status "Checking native dependencies..."
    
    if [ ! -d "node_modules/sqlite3" ]; then
        print_warning "sqlite3 not found in node_modules"
        print_status "This might cause issues. Reinstalling dependencies..."
        rm -rf node_modules package-lock.json
        npm install
        return
    fi
    
    # Check if sqlite3 binary exists
    if [ ! -f "node_modules/sqlite3/lib/binding/napi-v6-darwin-x64/node_sqlite3.node" ] && \
       [ ! -f "node_modules/sqlite3/lib/binding/napi-v6-linux-x64/node_sqlite3.node" ] && \
       [ ! -f "node_modules/sqlite3/lib/binding/napi-v6-darwin-arm64/node_sqlite3.node" ] && \
       [ ! -f "node_modules/sqlite3/lib/binding/napi-v6-linux-arm64/node_sqlite3.node" ]; then
        print_warning "sqlite3 binary not found, rebuilding..."
        npm rebuild sqlite3
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
        print_status "Debug mode enabled"
    fi
    
    print_success "Environment configured"
}

# Start the application
start_app() {
    print_status "Starting Prompt Studio..."
    print_status "Press Ctrl+C to stop the application"
    echo ""
    
    # Add development flag to start with dev tools
    npm run dev
}

# Main execution
main() {
    echo ""
    print_status "Starting pre-flight checks..."
    
    check_node
    check_npm
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
    echo "  1. Check Node.js and npm installation"
    echo "  2. Verify project structure"
    echo "  3. Install dependencies if needed"
    echo "  4. Check native dependencies"
    echo "  5. Start the application in development mode"
    echo ""
    exit 0
fi

# Trap Ctrl+C and cleanup
trap 'print_status "Shutting down..."; exit 0' INT

# Run main function
main "$1"