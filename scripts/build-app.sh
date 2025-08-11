#!/bin/bash

# Prompt Studio Production Build Script (Unix/macOS/Linux)
# This script creates distributable packages for the current platform

set -e  # Exit on any error

echo "📦 Prompt Studio Production Builder"
echo "================================="

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

# Detect platform
detect_platform() {
    print_status "Detecting platform..."
    
    PLATFORM=$(uname -s)
    ARCH=$(uname -m)
    
    case $PLATFORM in
        Darwin)
            OS="macOS"
            BUILD_TARGET="mac"
            ;;
        Linux)
            OS="Linux"
            BUILD_TARGET="linux"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            OS="Windows"
            BUILD_TARGET="win"
            print_warning "Consider using build-app.ps1 for better Windows support"
            ;;
        *)
            print_error "Unsupported platform: $PLATFORM"
            exit 1
            ;;
    esac
    
    print_success "Platform: $OS ($ARCH)"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed!"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js: $NODE_VERSION"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed!"
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_success "npm: v$NPM_VERSION"
    
    # Check project structure
    if [ ! -f "package.json" ]; then
        print_error "package.json not found! Run from project root."
        exit 1
    fi
    
    if [ ! -f "main.js" ]; then
        print_error "main.js not found! Incomplete project structure."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Clean previous builds
clean_build() {
    print_status "Cleaning previous builds..."
    
    if [ -d "dist" ]; then
        rm -rf dist
        print_status "Removed old dist directory"
    fi
    
    if [ -d "build" ]; then
        rm -rf build
        print_status "Removed old build directory"
    fi
    
    print_success "Build directories cleaned"
}

# Install/update dependencies
install_dependencies() {
    print_status "Installing/updating dependencies..."
    
    # Clean install for production
    if [ "$1" = "--clean" ]; then
        print_status "Performing clean install..."
        rm -rf node_modules package-lock.json
    fi
    
    # Install production dependencies
    npm ci --only=production 2>/dev/null || npm install --only=production
    
    # Install dev dependencies needed for building
    npm install --only=dev
    
    print_success "Dependencies installed"
}

# Rebuild native modules for current platform
rebuild_native() {
    print_status "Rebuilding native modules..."
    
    # Rebuild sqlite3 for current platform
    if [ -d "node_modules/sqlite3" ]; then
        npm rebuild sqlite3
        print_success "sqlite3 rebuilt for current platform"
    fi
    
    print_success "Native modules rebuilt"
}

# Create app icon if it doesn't exist
create_icon() {
    print_status "Checking app icon..."
    
    if [ ! -f "assets/icon.png" ]; then
        print_warning "Icon not found, creating default icon..."
        
        # Create a simple default icon (requires ImageMagick)
        if command -v convert &> /dev/null; then
            mkdir -p assets
            convert -size 256x256 xc:transparent -fill "#007acc" -draw "circle 128,128 128,64" assets/icon.png
            print_success "Default icon created"
        else
            print_warning "ImageMagick not found, skipping icon creation"
            print_status "Please add a 256x256 PNG icon to assets/icon.png"
        fi
    else
        print_success "App icon found"
    fi
    
    # Create platform-specific icons if needed
    case $OS in
        macOS)
            if [ ! -f "assets/icon.icns" ]; then
                if command -v iconutil &> /dev/null && [ -f "assets/icon.png" ]; then
                    print_status "Creating macOS icon..."
                    mkdir -p assets/icon.iconset
                    
                    # Create different sizes for iconset
                    sips -z 16 16 assets/icon.png --out assets/icon.iconset/icon_16x16.png
                    sips -z 32 32 assets/icon.png --out assets/icon.iconset/icon_16x16@2x.png
                    sips -z 32 32 assets/icon.png --out assets/icon.iconset/icon_32x32.png
                    sips -z 64 64 assets/icon.png --out assets/icon.iconset/icon_32x32@2x.png
                    sips -z 128 128 assets/icon.png --out assets/icon.iconset/icon_128x128.png
                    sips -z 256 256 assets/icon.png --out assets/icon.iconset/icon_128x128@2x.png
                    sips -z 256 256 assets/icon.png --out assets/icon.iconset/icon_256x256.png
                    sips -z 512 512 assets/icon.png --out assets/icon.iconset/icon_256x256@2x.png
                    sips -z 512 512 assets/icon.png --out assets/icon.iconset/icon_512x512.png
                    sips -z 1024 1024 assets/icon.png --out assets/icon.iconset/icon_512x512@2x.png
                    
                    iconutil -c icns assets/icon.iconset
                    rm -rf assets/icon.iconset
                    print_success "macOS icon created"
                fi
            fi
            ;;
        *)
            # For other platforms, the PNG is sufficient
            ;;
    esac
}

# Run tests if available
run_tests() {
    if [ "$SKIP_TESTS" != "true" ]; then
        print_status "Running tests..."
        
        if npm run test --if-present; then
            print_success "All tests passed"
        else
            print_warning "Tests failed or not available"
            if [ "$FORCE_BUILD" != "true" ]; then
                read -p "Continue with build? (y/N): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    print_error "Build cancelled due to test failures"
                    exit 1
                fi
            fi
        fi
    else
        print_status "Skipping tests (SKIP_TESTS=true)"
    fi
}

# Build the application
build_app() {
    print_status "Building application for $OS..."
    
    # Set build environment
    export NODE_ENV=production
    
    case $BUILD_TARGET in
        mac)
            print_status "Building macOS application..."
            npm run build:mac
            ;;
        linux)
            print_status "Building Linux application..."
            npm run build:linux
            ;;
        win)
            print_status "Building Windows application..."
            npm run build:win
            ;;
        *)
            print_status "Building for current platform..."
            npm run build
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        print_success "Build completed successfully!"
    else
        print_error "Build failed!"
        exit 1
    fi
}

# Show build results
show_results() {
    print_status "Build Results:"
    echo ""
    
    if [ -d "dist" ]; then
        print_success "Built packages:"
        ls -la dist/
        
        echo ""
        print_status "Package sizes:"
        du -h dist/* 2>/dev/null | while read size file; do
            echo "  $file: $size"
        done
        
        echo ""
        print_success "Build artifacts saved to: $(pwd)/dist/"
    else
        print_warning "No dist directory found - build may have failed"
    fi
}

# Sign the application (macOS only)
sign_app() {
    if [ "$OS" = "macOS" ] && [ -n "$CODESIGN_IDENTITY" ]; then
        print_status "Code signing application..."
        
        APP_PATH=$(find dist -name "*.app" -type d | head -1)
        if [ -n "$APP_PATH" ]; then
            codesign --force --deep --sign "$CODESIGN_IDENTITY" "$APP_PATH"
            print_success "Application signed with identity: $CODESIGN_IDENTITY"
        else
            print_warning "No .app bundle found for signing"
        fi
    fi
}

# Notarize the application (macOS only)
notarize_app() {
    if [ "$OS" = "macOS" ] && [ -n "$APPLE_ID" ] && [ -n "$APPLE_ID_PASS" ]; then
        print_status "Notarizing application (this may take several minutes)..."
        
        DMG_PATH=$(find dist -name "*.dmg" | head -1)
        if [ -n "$DMG_PATH" ]; then
            xcrun altool --notarize-app \
                --primary-bundle-id "com.promptstudio.app" \
                --username "$APPLE_ID" \
                --password "$APPLE_ID_PASS" \
                --file "$DMG_PATH"
            print_success "Notarization request submitted"
            print_status "Check notarization status with: xcrun altool --notarization-history 0 -u $APPLE_ID -p $APPLE_ID_PASS"
        else
            print_warning "No DMG found for notarization"
        fi
    fi
}

# Main execution
main() {
    echo ""
    print_status "Starting build process..."
    
    detect_platform
    check_prerequisites
    clean_build
    install_dependencies "$1"
    rebuild_native
    create_icon
    run_tests
    build_app
    sign_app
    notarize_app
    show_results
    
    echo ""
    print_success "🎉 Build process completed!"
    
    if [ "$OS" = "macOS" ]; then
        print_status "To install: Open the DMG file in dist/ and drag the app to Applications"
    elif [ "$OS" = "Linux" ]; then
        print_status "To install: Use the .deb package or run the AppImage directly"
    fi
    
    echo ""
}

# Handle script arguments
case "$1" in
    --help|-h)
        echo "Prompt Studio Production Builder"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --clean        Perform clean install of dependencies"
        echo "  --skip-tests   Skip running tests"
        echo "  --force        Force build even if tests fail"
        echo ""
        echo "Environment variables:"
        echo "  CODESIGN_IDENTITY  Code signing identity for macOS"
        echo "  APPLE_ID          Apple ID for notarization"
        echo "  APPLE_ID_PASS     App-specific password for Apple ID"
        echo "  SKIP_TESTS        Skip tests (set to 'true')"
        echo "  FORCE_BUILD       Force build despite test failures"
        echo ""
        exit 0
        ;;
    --skip-tests)
        export SKIP_TESTS=true
        shift
        ;;
    --force)
        export FORCE_BUILD=true
        shift
        ;;
esac

# Trap Ctrl+C and cleanup
trap 'print_status "Build cancelled by user"; exit 1' INT

# Run main function
main "$@"