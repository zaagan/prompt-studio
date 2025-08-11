# Prompt Studio

A powerful desktop application for managing, organizing, and testing AI prompts efficiently. Built with Electron and SQLite, Prompt Studio provides both desktop and menu bar modes for seamless prompt management.

![Prompt Studio](assets/screenshot.png)

## ✨ Features

### 🎯 Core Functionality
- **Dual Mode Operation**: Switch between full desktop app and compact menu bar mode
- **Smart Organization**: Categories, tags, and favorites for efficient prompt organization
- **Version History**: Track changes to your prompts with automatic versioning
- **Template System**: Create reusable templates with variable substitution
- **Search & Filter**: Powerful search across all prompts with multiple filter options

### 🚀 Prompt Testing
- **Live Testing**: Test prompts against OpenAI API or custom endpoints
- **Multiple Models**: Support for GPT-3.5, GPT-4, and other compatible models
- **Response Analytics**: Token usage tracking and response time monitoring
- **Copy & Share**: Easy clipboard integration for quick sharing

### 🎨 User Experience
- **Dark & Light Themes**: Smooth theme switching with system preference detection
- **Responsive Design**: Optimized for different screen sizes and orientations
- **Keyboard Shortcuts**: Power-user shortcuts for all major actions
- **System Tray Integration**: Quick access from your system tray/menu bar

### 📁 Data Management
- **Import/Export**: Support for JSON and plain text formats
- **Data Persistence**: Secure SQLite storage in your user data directory
- **Backup Ready**: Easy database backup and migration
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 📋 Requirements

- **Node.js**: Version 16.x or higher
- **npm**: Version 8.x or higher
- **Operating System**: 
  - macOS 10.14 (Mojave) or later
  - Windows 10 or later
  - Linux (Ubuntu 18.04+ or equivalent)

## 🚀 Quick Start

### Option 1: Using the Run Script (Recommended)

**Unix/macOS/Linux:**
```bash
# Make the script executable (first time only)
chmod +x scripts/run.sh

# Run the application
./scripts/run.sh
```

**Windows:**
```cmd
# Run from Command Prompt
scripts\run.bat

# Or from PowerShell
.\scripts\run.bat
```

The run scripts will automatically:
- Check Node.js and npm installation
- Install dependencies if needed
- Rebuild native modules
- Start the application in development mode

### Option 2: Manual Setup

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd prompt-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

## 🏗️ Building for Production

### Using Build Scripts (Recommended)

**Unix/macOS/Linux:**
```bash
# Make the script executable (first time only)
chmod +x scripts/build-app.sh

# Build for current platform
./scripts/build-app.sh

# Additional options
./scripts/build-app.sh --clean    # Clean install dependencies
./scripts/build-app.sh --help     # Show all options
```

**Windows (PowerShell):**
```powershell
# Build for Windows
.\scripts\build-app.ps1

# Additional options
.\scripts\build-app.ps1 -Clean      # Clean install dependencies
.\scripts\build-app.ps1 -Help       # Show all options
```

### Manual Building

**For current platform:**
```bash
npm run build
```

**For specific platforms:**
```bash
npm run build:mac      # macOS (DMG and ZIP)
npm run build:win      # Windows (NSIS installer and portable)
npm run build:linux    # Linux (AppImage and DEB)
```

The built applications will be available in the `dist/` directory.

## 📖 Usage Guide

### Getting Started

1. **First Launch**: The app will start in desktop mode and create a local database
2. **Create Categories**: Organize your prompts with color-coded categories
3. **Add Templates**: Set up reusable templates with variable placeholders
4. **Create Prompts**: Start building your prompt library

### Desktop Mode Features

- **Full Interface**: Access all features in a spacious desktop window
- **Prompt Editor**: Rich editing experience with syntax highlighting
- **Test Panel**: Live testing with configurable API settings
- **Batch Operations**: Import/export multiple prompts at once

### Menu Bar Mode Features

- **Quick Access**: Compact interface accessible from your system tray
- **Recent Prompts**: Quick access to recently used prompts
- **Favorites**: One-click access to your starred prompts
- **Quick Create**: Fast prompt creation with essential fields

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| New Prompt | `Ctrl/Cmd + N` |
| Search | `Ctrl/Cmd + F` |
| Save Prompt | `Ctrl/Cmd + S` |
| Toggle Theme | `Ctrl/Cmd + T` |
| Switch to Desktop | `Ctrl/Cmd + O` (Menu Bar mode) |

## 🔧 Configuration

### API Configuration

1. Open the **Test Panel** in prompt editor
2. Enter your **API Key** (stored locally, never transmitted)
3. Select your preferred **Model**
4. Optionally configure a custom **API Endpoint**

### Theme Settings

- **Auto**: The app will use your system theme preference
- **Manual**: Toggle between light and dark modes using the theme button
- **Persistence**: Your theme choice is saved and restored on restart

### Data Location

Your prompt data is stored securely in:
- **macOS**: `~/Library/Application Support/prompt-studio/`
- **Windows**: `%APPDATA%/prompt-studio/`
- **Linux**: `~/.config/prompt-studio/`

## 🛠️ Development

### Project Structure

```
prompt-studio/
├── main.js                 # Main Electron process
├── preload.js             # Preload script for security
├── package.json           # Dependencies and scripts
├── assets/                # App icons and resources
├── scripts/               # Build and run scripts
│   ├── run.sh            # Unix development runner
│   ├── run.bat           # Windows development runner
│   ├── build-app.sh      # Unix production builder
│   └── build-app.ps1     # Windows production builder
└── src/
    ├── database/          # Database layer
    │   ├── init.js       # Database initialization
    │   └── queries.js    # Database operations
    └── renderer/          # Frontend code
        ├── index.html    # Main window UI
        ├── menubar.html  # Menu bar window UI
        ├── renderer.js   # Main window logic
        ├── menubar-renderer.js # Menu bar logic
        ├── styles.css    # Main window styles
        └── menubar-styles.css # Menu bar styles
```

### Adding Features

1. **Database Changes**: Update `src/database/init.js` for schema changes
2. **UI Changes**: Modify HTML templates and CSS files
3. **Logic Changes**: Update renderer scripts and main process handlers
4. **IPC Communication**: Add new IPC handlers in `main.js` and `preload.js`

### Testing

```bash
# Run in development mode
npm run dev

# Run with debug logging
NODE_ENV=development npm run dev

# Build and test production version
npm run build
```

## 🚨 Troubleshooting

### Common Issues

**Dependencies not installing:**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**SQLite compilation errors:**
```bash
# Rebuild native modules
npm rebuild sqlite3

# Or reinstall
npm uninstall sqlite3
npm install sqlite3
```

**App won't start:**
- Check that Node.js version is 16+ with `node --version`
- Verify all dependencies installed with `npm list`
- Check console output for specific error messages

**Menu bar mode not showing:**
- Look for the app icon in your system tray
- Try right-clicking the tray icon for context menu
- Switch to desktop mode if menu bar isn't visible

### Getting Help

1. **Check the Console**: Look for error messages in the terminal
2. **Check Logs**: Application logs are saved in your data directory
3. **Reset Database**: Delete the database file to start fresh (loses data!)
4. **Reinstall**: Remove `node_modules` and run setup again

### Performance Tips

- **Database Size**: Large prompt libraries (1000+ prompts) may slow search
- **Memory Usage**: Close the app completely to free memory (don't just minimize)
- **API Limits**: Be mindful of API rate limits when testing prompts frequently

## 🔒 Security & Privacy

- **Local Storage**: All data stored locally on your machine
- **API Keys**: Never transmitted or stored in logs
- **No Analytics**: No usage data collected or transmitted
- **Open Source**: Full source code available for security auditing

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the Repository**: Create your own copy of the project
2. **Create a Branch**: `git checkout -b feature/your-feature-name`
3. **Make Changes**: Implement your feature or fix
4. **Test Thoroughly**: Ensure everything works as expected
5. **Submit a Pull Request**: Describe your changes and why they're needed

### Development Guidelines

- Follow existing code style and conventions
- Test on multiple platforms if possible
- Update documentation for new features
- Keep commits focused and descriptive

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Upcoming Features
- [ ] Cloud sync capabilities
- [ ] Collaborative prompt sharing
- [ ] Advanced analytics and insights
- [ ] Plugin system for custom integrations
- [ ] Mobile companion app
- [ ] Advanced template variables and functions

### Known Limitations
- No real-time collaboration yet
- Limited to single-user scenarios
- No cloud backup (local storage only)
- API testing limited to OpenAI-compatible endpoints

## 📞 Support

- **Issues**: Report bugs and feature requests on our issue tracker
- **Discussions**: Join community discussions for tips and tricks
- **Documentation**: Check this README and inline code comments
- **Updates**: Follow releases for new features and bug fixes

---

**Made with ❤️ for the AI community**

*Prompt Studio - Your AI prompt management solution*