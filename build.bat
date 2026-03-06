@echo off
echo Building Time Keeper extensions...

:: Create Firefox build
echo Creating Firefox build...
copy manifest.firefox.json manifest.json /Y
powershell -Command "Compress-Archive -Path background.js, content.js, manifest.json, popup.html, popup.js, icons, README.md -DestinationPath time-keeper-firefox.zip -Force"

:: Create Chrome build
echo Creating Chrome build...
copy manifest.chrome.json manifest.json /Y
powershell -Command "Compress-Archive -Path background.js, content.js, manifest.json, popup.html, popup.js, icons, README.md -DestinationPath time-keeper-chrome.zip -Force"

:: Restore Chrome manifest as default for local development/folder loading
echo Restoring Chrome manifest for local development...
copy manifest.chrome.json manifest.json /Y

echo.
echo Done! 
echo - Firefox ZIP: time-keeper-firefox.zip
echo - Chrome ZIP: time-keeper-chrome.zip
echo - Local Folder: Ready for Chrome (manifest.json is now Chrome-compatible)
