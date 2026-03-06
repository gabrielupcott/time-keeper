#!/bin/bash
echo "Building Time Keeper extensions..."

# Create build directory
mkdir -p build

# Create Firefox build
echo "Creating Firefox build..."
cp manifest.firefox.json manifest.json
zip -r build/time-keeper-firefox.zip background.js content.js manifest.json popup.html popup.js icons README.md

# Create Chrome build
echo "Creating Chrome build..."
cp manifest.chrome.json manifest.json
zip -r build/time-keeper-chrome.zip background.js content.js manifest.json popup.html popup.js icons README.md

# Restore Chrome manifest as default for local development/folder loading
echo "Restoring Chrome manifest for local development..."
cp manifest.chrome.json manifest.json

echo ""
echo "Done! "
echo "- Firefox ZIP: build/time-keeper-firefox.zip"
echo "- Chrome ZIP: build/time-keeper-chrome.zip"
echo "- Local Folder: Ready for Chrome (manifest.json is now Chrome-compatible)"
