#!/bin/bash
echo "Building Time Keeper extensions..."

# Create build directory
mkdir -p build

# Create Firefox build folder
echo "Creating Firefox build folder..."
mkdir -p build/firefox
cp manifest.firefox.json build/firefox/manifest.json
cp background.js content.js popup.html popup.js README.md build/firefox/
cp -r icons build/firefox/

# Create Chrome build folder
echo "Creating Chrome build folder..."
mkdir -p build/chrome
cp manifest.chrome.json build/chrome/manifest.json
cp background.js content.js popup.html popup.js README.md build/chrome/
cp -r icons build/chrome/

# Restore Chrome manifest as default for local development/folder loading
echo "Restoring Chrome manifest for local development..."
cp manifest.chrome.json manifest.json

echo ""
echo "Done!"
echo "Build folders created in build/firefox and build/chrome"
echo "NOTE: Please zip the contents of these folders manually if you need to upload them."
echo "Automated zipping is disabled to prevent issues with icon transparency and metadata."
