@echo off
echo Building extensions...

:: Create build directory
if exist build rd /s /q build
mkdir build

:: Build Chrome version (MV3)
echo Building Chrome (MV3)...
mkdir build\chrome
copy /y manifest.chrome.json build\chrome\manifest.json >nul
copy /y background.js build\chrome\ >nul
copy /y content.js build\chrome\ >nul
copy /y popup.js build\chrome\ >nul
copy /y popup.html build\chrome\ >nul
xcopy /s /e /i icons build\chrome\icons >nul

:: Build Firefox version (MV2)
echo Building Firefox (MV2)...
mkdir build\firefox
copy /y manifest.firefox.json build\firefox\manifest.json >nul
copy /y background.js build\firefox\ >nul
copy /y content.js build\firefox\ >nul
copy /y popup.js build\firefox\ >nul
copy /y popup.html build\firefox\ >nul
xcopy /s /e /i icons build\firefox\icons >nul

:: Restore unified manifest for development
copy /y manifest.chrome.json manifest.json >nul

echo Done!
echo Chrome build in: build\chrome
echo Firefox build in: build\firefox
echo.
echo NOTE: Please zip the contents of these folders manually if you need to upload them.
echo Automated zipping is disabled to prevent issues with icon transparency and metadata.
