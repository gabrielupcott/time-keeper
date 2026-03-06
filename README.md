# Desk365 Time Keeper

Desk365 Time Keeper is a Chrome Extension designed to help users track their billable time entries on [Desk365](https://www.desk365.io/) tickets locally. It automatically syncs time entries from the Desk365 interface and provides a dashboard to view daily, weekly, and monthly totals.

## Features

- **Automatic Sync**: Automatically detects and syncs time entries when you view a ticket.
- **Dashboard**: View your time entry history with aggregated totals for the day, week, and month.
- **Filtering**: Filter entries by user name to see only your own contributions.
- **Export**: Export your tracked time data to CSV for reporting.
- **Privacy**: All data is stored locally in your browser's storage.

## Setup Tutorial

Follow these steps to get started with Desk365 Time Keeper:

1.  **Install the Extension**:

    ### Google Chrome
    - Open Chrome and go to `chrome://extensions/`.
    - Enable **Developer mode** (toggle in the top right).
    - Click **Load unpacked** and select the directory containing this extension's files.
    - *Note: The root `manifest.json` is configured for Chrome by default.*

    ### Mozilla Firefox
    #### For Regular Use (Recommended)
    - Download the latest signed extension (`.xpi`) from the [Releases](https://github.com/gabrielupcott/time-keeper/releases) page.
    - Drag and drop the `.xpi` file into Firefox to install it.

    #### For Local Development/Debugging
    - Run `build.bat` (Windows) or `sh build.sh` (Mac/Linux) to generate the Firefox build folder.
    - Open Firefox and go to `about:debugging`.
    - Click **This Firefox** in the left sidebar.
    - Click **Load Temporary Add-on...** and select `build/firefox/manifest.json`.

    ### Packaging for Store Submission
    If you need to create a `.zip` file for submission to the Chrome Web Store or Firefox Add-ons site:
    1. Run the build script (`build.bat` or `build.sh`).
    2. Navigate to the `build/chrome` or `build/firefox` directory.
    3. Select all files **inside** that folder and zip them manually.
    - *Note: Automated zipping is disabled to ensure icon transparency and metadata are preserved correctly.*

2.  **Configure Your Name**:
    - Click the Desk365 Time Keeper icon in your browser toolbar.
    - Click the **Settings** (gear) icon in the top right of the popup.
    - In the **User Name** field, enter your name.
    - **IMPORTANT**: Your name **must match exactly** how it appears in Desk365 for the filtering to work correctly.

3.  **Start Tracking**:
    - Navigate to any ticket on your Desk365 instance.
    - The extension will automatically detect and sync the time entries listed on the ticket.
    - Open the extension popup at any time to see your aggregated totals and entry history.

4.  **Exporting Data**:
    - Open the extension popup and click the **Settings** (gear) icon.
    - Click the **Export to CSV** button.
    - A CSV file containing all your tracked time entries will be downloaded to your computer.

5.  **Clearing Data**:
    - If you need to reset your local database, open the **Settings** view.
    - Click the **Clear All Data** button.
    - **Warning**: This action is permanent and will delete all locally stored time entries.

## Attribution

<a href="https://www.flaticon.com/free-icons/ui" title="ui icons">Ui icons created by kawalanicon - Flaticon</a>