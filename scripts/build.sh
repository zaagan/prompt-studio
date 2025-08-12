#!/bin/bash

# Prompt Studio Production Build Script (Unix/macOS/Linux)
# This script creates optimized, architecture-specific distributable packages

set -e  # Exit on any error

echo "📦 Prompt Studio Production Builder"
echo "================================="

# Global variables
PACKAGE_MANAGER=""
PLATFORM=""
ARCH=""
OS=""
BUILD_TARGET=""
ELECTRON_ARCH=""

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

# Detect platform and architecture with enhanced support
detect_platform() {
    print_status "Detecting platform and architecture..."
    
    PLATFORM=$(uname -s)
    ARCH=$(uname -m)
    
    # Normalize architecture names
    case "$ARCH" in
        x86_64|amd64) 
            ARCH="x64"
            ELECTRON_ARCH="x64"
            ;;
        aarch64|arm64) 
            ARCH="arm64"
            ELECTRON_ARCH="arm64"
            ;;
        i386|i686) 
            ARCH="ia32"
            ELECTRON_ARCH="ia32"
            ;;
        armv7l) 
            ARCH="armv7l"
            ELECTRON_ARCH="armv7l"
            ;;
        *)
            print_warning "Unknown architecture: $ARCH, defaulting to x64"
            ARCH="x64"
            ELECTRON_ARCH="x64"
            ;;
    esac
    
    case $PLATFORM in
        Darwin)
            OS="macOS"
            BUILD_TARGET="mac"
            print_success "Platform: macOS ($ARCH)"
            ;;
        Linux)
            OS="Linux"
            BUILD_TARGET="linux"
            print_success "Platform: Linux ($ARCH)"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            OS="Windows"
            BUILD_TARGET="win"
            print_success "Platform: Windows ($ARCH)"
            print_warning "Consider using build.ps1 for better Windows support"
            ;;
        *)
            print_error "Unsupported platform: $PLATFORM"
            exit 1
            ;;
    esac
}

# Check prerequisites with enhanced package manager detection
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed!"
        print_status "Please install Node.js from https://nodejs.org/"
        print_status "Recommended version: 18.x or higher"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js: $NODE_VERSION"
    
    # Check Node version (require v16+)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 16 ]; then
        print_warning "Node.js version is older than recommended (v16+)"
        print_status "Your version: $NODE_VERSION"
        print_status "Please consider upgrading for best compatibility"
    fi
    
    # Check package manager (prefer pnpm, fallback to npm)
    print_status "Detecting package manager..."
    if command -v pnpm &> /dev/null; then
        PACKAGE_MANAGER="pnpm"
        PKG_VERSION=$(pnpm --version)
        print_success "pnpm found: v$PKG_VERSION"
    elif command -v npm &> /dev/null; then
        PACKAGE_MANAGER="npm"
        PKG_VERSION=$(npm --version)
        print_success "npm found: v$PKG_VERSION"
    else
        print_error "No package manager found!"
        print_status "Please install pnpm (recommended) or npm"
        print_status "pnpm: npm install -g pnpm"
        print_status "npm: usually comes with Node.js installation"
        exit 1
    fi
    
    # Check project structure
    if [ ! -f "package.json" ]; then
        print_error "package.json not found! Run from project root."
        exit 1
    fi
    
    # Check for TypeScript Electron project structure
    if [ ! -f "electron/main.ts" ]; then
        print_error "electron/main.ts not found! Incomplete TypeScript Electron project structure."
        exit 1
    fi
    
    if [ ! -f "vite.config.ts" ]; then
        print_error "vite.config.ts not found! This doesn't appear to be a Vite-based project."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Clean previous builds and electron cache
clean_build() {
    print_status "Cleaning previous builds and electron cache..."
    
    # Remove build directories
    if [ -d "dist" ]; then
        rm -rf dist
        print_status "Removed old dist directory"
    fi
    
    if [ -d "build" ]; then
        rm -rf build
        print_status "Removed old build directory"
    fi
    
    if [ -d "dist-electron" ]; then
        rm -rf dist-electron
        print_status "Removed old dist-electron directory"
    fi
    
    # Clean electron cache for architecture consistency
    print_status "Cleaning electron cache for architecture consistency..."
    
    # Clean npm/pnpm cache for electron
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm store prune || true
        print_status "Cleaned pnpm store"
    else
        npm cache clean --force || true
        print_status "Cleaned npm cache"
    fi
    
    # Clean electron cache directories
    ELECTRON_CACHE_DIRS=(
        "$HOME/.cache/electron"
        "$HOME/.electron"
        "$HOME/Library/Caches/electron" # macOS
        "$HOME/AppData/Local/electron/Cache" # Windows
    )
    
    for cache_dir in "${ELECTRON_CACHE_DIRS[@]}"; do
        if [ -d "$cache_dir" ]; then
            rm -rf "$cache_dir"
            print_status "Cleaned electron cache: $cache_dir"
        fi
    done
    
    print_success "Build directories and caches cleaned"
}

# Install/update dependencies with architecture awareness
install_dependencies() {
    print_status "Installing/updating dependencies..."
    
    # Clean install for production if requested
    if [ "$1" = "--clean" ]; then
        print_status "Performing clean install..."
        rm -rf node_modules
        if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
            rm -f pnpm-lock.yaml
        else
            rm -f package-lock.json
        fi
    fi
    
    # Install all dependencies (production and dev needed for building)
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm install --frozen-lockfile 2>/dev/null || pnpm install
    else
        npm ci 2>/dev/null || npm install
    fi
    
    print_success "Dependencies installed"
    
    # Check for outdated packages
    if [ "$PACKAGE_MANAGER" = "npm" ] && npm outdated --parseable 2>/dev/null | grep -q .; then
        print_warning "Some dependencies may be outdated"
        print_status "Run '$PACKAGE_MANAGER update' to update them"
    fi
}

# Rebuild native modules for specific architecture
rebuild_native() {
    print_status "Rebuilding native modules for $ARCH architecture..."
    
    # Force rebuild for current architecture
    export npm_config_target_arch=$ELECTRON_ARCH
    export npm_config_target_platform=$(echo $PLATFORM | tr '[:upper:]' '[:lower:]')
    export npm_config_cache=/tmp/.npm
    
    # Rebuild sqlite3 specifically for current architecture
    if [ -d "node_modules/sqlite3" ]; then
        print_status "Rebuilding sqlite3 for $ELECTRON_ARCH..."
        if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
            pnpm rebuild sqlite3
        else
            npm rebuild sqlite3 --target_arch=$ELECTRON_ARCH
        fi
        print_success "sqlite3 rebuilt for $ELECTRON_ARCH architecture"
    fi
    
    # Rebuild all native modules
    if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
        pnpm rebuild
    else
        npm rebuild
    fi
    
    print_success "Native modules rebuilt for $ELECTRON_ARCH architecture"
}

# Create platform-specific app icons
create_platform_icons() {
    print_status "Checking and creating platform-specific icons..."
    
    if [ ! -f "assets/icon.png" ]; then
        print_warning "Base icon not found, creating default icon..."
        
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
        print_success "Base app icon found"
    fi
    
    # Create platform-specific icons
    case $OS in
        macOS)
            if [ ! -f "assets/icon.icns" ]; then
                if command -v iconutil &> /dev/null && [ -f "assets/icon.png" ]; then
                    print_status "Creating macOS icon (.icns)..."
                    mkdir -p assets/icon.iconset
                    
                    # Create different sizes for iconset
                    sips -z 16 16 assets/icon.png --out assets/icon.iconset/icon_16x16.png >/dev/null 2>&1
                    sips -z 32 32 assets/icon.png --out assets/icon.iconset/icon_16x16@2x.png >/dev/null 2>&1
                    sips -z 32 32 assets/icon.png --out assets/icon.iconset/icon_32x32.png >/dev/null 2>&1
                    sips -z 64 64 assets/icon.png --out assets/icon.iconset/icon_32x32@2x.png >/dev/null 2>&1
                    sips -z 128 128 assets/icon.png --out assets/icon.iconset/icon_128x128.png >/dev/null 2>&1
                    sips -z 256 256 assets/icon.png --out assets/icon.iconset/icon_128x128@2x.png >/dev/null 2>&1
                    sips -z 256 256 assets/icon.png --out assets/icon.iconset/icon_256x256.png >/dev/null 2>&1
                    sips -z 512 512 assets/icon.png --out assets/icon.iconset/icon_256x256@2x.png >/dev/null 2>&1
                    sips -z 512 512 assets/icon.png --out assets/icon.iconset/icon_512x512.png >/dev/null 2>&1
                    sips -z 1024 1024 assets/icon.png --out assets/icon.iconset/icon_512x512@2x.png >/dev/null 2>&1
                    
                    iconutil -c icns assets/icon.iconset >/dev/null 2>&1
                    rm -rf assets/icon.iconset
                    print_success "macOS icon (.icns) created"
                fi
            else
                print_success "macOS icon (.icns) found"
            fi
            ;;
        Windows)
            if [ ! -f "assets/icon.ico" ] && [ -f "assets/icon.png" ]; then
                if command -v convert &> /dev/null; then
                    print_status "Creating Windows icon (.ico)..."
                    convert assets/icon.png -resize 256x256 assets/icon.ico
                    print_success "Windows icon (.ico) created"
                else
                    print_warning "ImageMagick not found, cannot create .ico file"
                fi
            else
                print_success "Windows icon (.ico) found or base PNG missing"
            fi
            ;;
        Linux)
            # Linux uses PNG, no conversion needed
            print_success "Linux uses PNG icon (no conversion needed)"
            ;;
    esac
}

# Run tests if available
run_tests() {
    if [ "$SKIP_TESTS" != "true" ]; then
        print_status "Running tests..."
        
        if $PACKAGE_MANAGER run test --if-present; then
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

# Build optimized, architecture-specific packages
build_app() {
    print_status "Building application for $OS ($ELECTRON_ARCH)..."
    
    # Set build environment
    export NODE_ENV=production
    export ELECTRON_BUILDER_ARCH=$ELECTRON_ARCH
    
    print_status "Target packages for $OS:"
    case $BUILD_TARGET in
        mac)
            print_status "  • DMG installer (Universal: arm64 + x64)"
            print_status "  • ZIP archive (Universal: arm64 + x64)"
            $PACKAGE_MANAGER run build:mac
            ;;
        linux)
            print_status "  • AppImage (portable)"
            print_status "  • DEB package"
            $PACKAGE_MANAGER run build:linux
            ;;
        win)
            print_status "  • NSIS installer"
            print_status "  • Portable executable"
            $PACKAGE_MANAGER run build:win
            ;;
        *)
            print_status "  • Default platform build"
            $PACKAGE_MANAGER run build
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        print_success "Build completed successfully!"
    else
        print_error "Build failed!"
        exit 1
    fi
}

# Show detailed build results
show_results() {
    print_status "Build Results:"
    echo ""
    
    if [ -d "dist" ]; then
        print_success "Built packages:"
        
        case $OS in
            macOS)
                echo "  📦 macOS Packages:"
                ls -lh dist/*.dmg 2>/dev/null | while read -r line; do
                    echo "    DMG: $(echo $line | awk '{print $9 " (" $5 ")"}')"
                done
                ls -lh dist/*.zip 2>/dev/null | while read -r line; do
                    echo "    ZIP: $(echo $line | awk '{print $9 " (" $5 ")"}')"
                done
                ;;
            Linux)
                echo "  🐧 Linux Packages:"
                ls -lh dist/*.AppImage 2>/dev/null | while read -r line; do
                    echo "    AppImage: $(echo $line | awk '{print $9 " (" $5 ")"}')"
                done
                ls -lh dist/*.deb 2>/dev/null | while read -r line; do
                    echo "    DEB: $(echo $line | awk '{print $9 " (" $5 ")"}')"
                done
                ;;
            Windows)
                echo "  🪟 Windows Packages:"
                ls -lh dist/*.exe 2>/dev/null | while read -r line; do
                    echo "    EXE: $(echo $line | awk '{print $9 " (" $5 ")"}')"
                done
                ls -lh dist/*.msi 2>/dev/null | while read -r line; do
                    echo "    MSI: $(echo $line | awk '{print $9 " (" $5 ")"}')"
                done
                ;;
        esac
        
        echo ""
        print_status "Total build size:"
        du -sh dist/ 2>/dev/null | awk '{print "  " $1}'
        
        echo ""
        print_success "Build artifacts saved to: $(pwd)/dist/"
    else
        print_warning "No dist directory found - build may have failed"
    fi
}

# Platform-specific installation instructions
show_install_instructions() {
    echo ""
    print_status "Installation Instructions:"
    
    case $OS in
        macOS)
            echo "  📱 To install on macOS:"
            echo "    • Intel Macs: Use Prompt Studio-1.0.0.dmg"
            echo "    • Apple Silicon: Use Prompt Studio-1.0.0-arm64.dmg"
            echo "    • Open the DMG file and drag the app to Applications"
            ;;
        Linux)
            echo "  🐧 To install on Linux:"
            echo "    • AppImage: chmod +x *.AppImage && ./Prompt-Studio-1.0.0.AppImage"
            echo "    • DEB package: sudo dpkg -i *.deb"
            ;;
        Windows)
            echo "  🪟 To install on Windows:"
            echo "    • Run the .exe installer for guided installation"
            echo "    • Or use the portable version (no installation required)"
            ;;
    esac
}

# Code signing (macOS only)
sign_app() {
    if [ "$OS" = "macOS" ] && [ -n "$CODESIGN_IDENTITY" ]; then
        print_status "Code signing application..."
        
        find dist -name "*.app" -type d | while read -r app_path; do
            if [ -n "$app_path" ]; then
                codesign --force --deep --sign "$CODESIGN_IDENTITY" "$app_path"
                print_success "Signed: $app_path"
            fi
        done
    elif [ "$OS" = "macOS" ]; then
        print_warning "Code signing skipped (no CODESIGN_IDENTITY set)"
        print_status "Set CODESIGN_IDENTITY environment variable for code signing"
    fi
}

# Notarization (macOS only)
notarize_app() {
    if [ "$OS" = "macOS" ] && [ -n "$APPLE_ID" ] && [ -n "$APPLE_ID_PASS" ]; then
        print_status "Notarizing applications (this may take several minutes)..."
        
        find dist -name "*.dmg" | while read -r dmg_path; do
            if [ -n "$dmg_path" ]; then
                print_status "Notarizing: $dmg_path"
                xcrun notarytool submit "$dmg_path" \
                    --apple-id "$APPLE_ID" \
                    --password "$APPLE_ID_PASS" \
                    --team-id "$TEAM_ID" \
                    --wait
                print_success "Notarization submitted for: $dmg_path"
            fi
        done
    elif [ "$OS" = "macOS" ]; then
        print_warning "Notarization skipped (missing APPLE_ID or APPLE_ID_PASS)"
        print_status "Set APPLE_ID, APPLE_ID_PASS, and TEAM_ID for notarization"
    fi
}

# Main execution
main() {
    echo ""
    print_status "Starting optimized build process..."
    
    detect_platform
    check_prerequisites
    clean_build
    install_dependencies "$1"
    rebuild_native
    create_platform_icons
    run_tests
    build_app
    sign_app
    notarize_app
    show_results
    show_install_instructions
    
    echo ""
    print_success "🎉 Architecture-optimized build process completed!"
    print_status "Platform: $OS ($ELECTRON_ARCH)"
    print_status "Package Manager: $PACKAGE_MANAGER"
    echo ""
}

# Handle script arguments
while [[ $# -gt 0 ]]; do
    case $1 in
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
            echo "  TEAM_ID           Apple Developer Team ID"
            echo "  SKIP_TESTS        Skip tests (set to 'true')"
            echo "  FORCE_BUILD       Force build despite test failures"
            echo ""
            echo "Supported platforms:"
            echo "  macOS: DMG and ZIP (arm64 for Apple Silicon, x64 for Intel)"
            echo "  Linux: AppImage and DEB packages"
            echo "  Windows: NSIS installer and portable exe (via WSL/MinGW)"
            echo ""
            exit 0
            ;;
        --clean)
            CLEAN_INSTALL="true"
            shift
            ;;
        --skip-tests)
            export SKIP_TESTS="true"
            shift
            ;;
        --force)
            export FORCE_BUILD="true"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            print_status "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Trap Ctrl+C and cleanup
trap 'print_status "Build cancelled by user"; exit 1' INT

# Run main function
main "$CLEAN_INSTALL"