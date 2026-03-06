# Proposal: Firefox Support for Time Keeper

## Overview
The project supports both Google Chrome and Mozilla Firefox using a unified codebase and browser-specific manifests.

## Implementation Strategy

### 1. Unified Source Code
The extension uses a single set of source files (`background.js`, `content.js`, `popup.js`, etc.) located in the root directory. Cross-browser compatibility is achieved via a simple API abstraction:

```javascript
const browserAPI = typeof browser !== "undefined" ? browser : chrome;
```

This allows the extension to use the `browser.*` namespace in Firefox and the `chrome.*` namespace in Chrome without code duplication.

### 2. Browser-Specific Manifests
Since Chrome (MV3) and Firefox (MV2/MV3) have different manifest requirements, the project maintains two source manifests:
- `manifest.chrome.json`: Configured for Chrome (Manifest V3).
- `manifest.firefox.json`: Configured for Firefox (Manifest V2/V3 with `browser_specific_settings`).

### 3. Build Process
A build script (`build.bat` or `build.sh`) automates the creation of browser-specific packages:
1.  Creates a `build/` directory.
2.  Copies the appropriate manifest (Chrome or Firefox) to `manifest.json`.
3.  Packages the source files and icons into a ZIP file inside `build/`.
4.  Restores the default `manifest.json` for local development.

## Build Artifacts
- `build/chrome/`: Staging directory for Chrome. Contains only the files required for the extension, excluding development tools and documentation.
- `build/firefox/`: Staging directory for Firefox.
- `build/time-keeper-chrome.zip`: Production-ready package for the Chrome Web Store.
- `build/time-keeper-firefox.zip`: Production-ready package for Firefox Add-ons (AMO).

## Development Workflow
- **Chrome**: Load the root directory as an "Unpacked Extension".
- **Firefox**: Run the build script and load the ZIP from the `build/` folder as a "Temporary Add-on".

## Considerations
- **Manifest Versions**: Currently, Chrome uses MV3 while Firefox uses a compatible configuration (often MV2 for broader support or MV3 where applicable).
- **API Differences**: The `browserAPI` abstraction handles the majority of namespace differences.
