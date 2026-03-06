# Proposal: Firefox Support for Time Keeper

## Overview
This proposal outlines the necessary changes to support Mozilla Firefox while maintaining compatibility with Google Chrome. Firefox supports Manifest V3 (MV3) but has some implementation differences compared to Chromium-based browsers.

## Current State
- **Manifest Version**: 3
- **Background Script**: Uses `service_worker` in `manifest.json`.
- **API Namespace**: Uses `chrome.*` APIs.
- **Permissions**: Uses `host_permissions`.

## Required Changes

### 1. Manifest Adjustments
Firefox requires a specific `browser_specific_settings` key for MV3 extensions and handles background scripts differently.

- **Background Script**: Firefox supports `background.scripts` (as an array) or `background.service_worker`. However, for maximum compatibility and to avoid issues with service worker lifecycle in Firefox, using a non-persistent background page/script is often preferred, but MV3 in Firefox *does* support service workers.
- **ID Requirement**: Firefox requires an extension ID in `browser_specific_settings.gecko.id`.

**Proposed `manifest.json` changes:**
```json
{
  "browser_specific_settings": {
    "gecko": {
      "id": "time-keeper@yourdomain.com",
      "strict_min_version": "109.0"
    }
  }
}
```

### 2. API Compatibility
While Firefox supports the `chrome.*` namespace for compatibility, the standard is the `browser.*` namespace which returns Promises instead of using callbacks.

- **Recommendation**: Use a polyfill like `webextension-polyfill` to allow using `browser.*` everywhere, or continue using `chrome.*` if the current usage is simple enough (Firefox's `chrome.*` implementation supports most basic features).
- **Current Usage**: The codebase currently uses `chrome.storage.local`, `chrome.runtime.onMessage`, `chrome.action`, and `chrome.tabs`. These are all supported in Firefox's `chrome.*` compatibility layer.

### 3. Background Service Worker
In Firefox MV3, the background service worker is supported, but there are subtle differences in how they are registered. The current `service_worker` key in `manifest.json` should work in Firefox 109+.

### 4. Host Permissions
Firefox MV3 handles `host_permissions` similarly to Chrome, so no major changes are expected for `https://*.desk365.io/*`.

## Implementation Plan

1.  **Update `manifest.json`**: Add `browser_specific_settings`.
2.  **Cross-Browser Testing**:
    *   Test popup functionality in Firefox.
    *   Verify content script injection on `desk365.io`.
    *   Verify background script message handling and storage.
    *   Check badge updates (`chrome.action.setBadgeText`).
3.  **Refactor (Optional but Recommended)**:
    *   Switch to `browser.*` namespace using a polyfill if we encounter callback/promise mismatch issues.
    *   Ensure `crypto.randomUUID()` is available in the Firefox background context (it is in modern versions).

## Risks & Considerations
- **Service Worker Lifecycle**: Firefox's service worker implementation can sometimes be more aggressive in termination than Chrome's.
- **Review Process**: Firefox Add-ons (AMO) has a manual review process that may be stricter than the Chrome Web Store.
