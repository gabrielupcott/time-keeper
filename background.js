const browserAPI = typeof browser !== "undefined" ? browser : chrome;

browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_TIME_ENTRY') {
    saveTimeEntry(message.data);
  } else if (message.type === 'SYNC_TIME_ENTRIES') {
    syncTimeEntries(message.data);
  }
});

let storageQueue = Promise.resolve();

async function syncTimeEntries({ ticketId, entries }) {
  storageQueue = storageQueue.then(async () => {
    console.log(`[TimeKeeper] Syncing ${entries.length} entries for ticket #${ticketId}`);
    const { time_entries = [] } = await browserAPI.storage.local.get('time_entries');
    
    // Remove all existing entries for this ticket
    const otherEntries = time_entries.filter(e => e.ticketId !== ticketId);
    
    // Add the new entries from the page
    const newEntries = entries.map(entry => ({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...entry
    }));

    const updatedEntries = [...otherEntries, ...newEntries];
    await browserAPI.storage.local.set({ time_entries: updatedEntries });
    console.log(`[TimeKeeper] Sync complete. Total entries: ${updatedEntries.length}`);
  });
  await storageQueue;
}

async function saveTimeEntry(entry) {
  storageQueue = storageQueue.then(async () => {
    console.log('[TimeKeeper] Processing save for entry:', entry);
    const { time_entries = [], user_name = '' } = await browserAPI.storage.local.get(['time_entries', 'user_name']);
    
    // If a user name is set, only save entries that match that name
    if (user_name && entry.userName && entry.userName.toLowerCase() !== user_name.toLowerCase()) {
      console.log(`[TimeKeeper] Ignoring save for user: ${entry.userName} (Expected: ${user_name})`);
      return;
    }

    const newEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...entry
    };

    time_entries.push(newEntry);
    await browserAPI.storage.local.set({ time_entries });
    console.log('[TimeKeeper] Entry saved. Total entries:', time_entries.length);
  });
  
  await storageQueue;
}


async function updateBadge() {
  const { time_entries = [] } = await browserAPI.storage.local.get('time_entries');
  
  // Use local date string to match the date format stored by content script
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Also check for single-digit month/day if they were stored that way (though content.js uses padStart)
  const todayISOAlt = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

  const todayEntries = time_entries.filter(e => e.date === todayISO || e.date === todayISOAlt);
  const todayMinutes = todayEntries.reduce((sum, e) => {
    const mins = (parseInt(e.hours || 0, 10) * 60) + parseInt(e.minutes || 0, 10);
    console.log(`[TimeKeeper] Entry: ${e.hours}h ${e.minutes}m -> ${mins} mins (Ticket: ${e.ticketId})`);
    return sum + mins;
  }, 0);

  console.log(`[TimeKeeper] Total minutes for ${todayISO}: ${todayMinutes}`);

  const badgeText = todayMinutes > 0 ? `${todayMinutes}m` : '';
  console.log('[TimeKeeper] Setting badge text to:', badgeText);
  
  const browserAction = browserAPI.action ?? browserAPI.browserAction;

  if (browserAction && browserAction.setBadgeText) {
    browserAction.setBadgeText({ text: badgeText });
  }

  let badgeColor = '#4CAF50'; // Green (default)
  if (todayMinutes > 60) {
    badgeColor = '#F44336'; // Red (1 hour+)
  } else if (todayMinutes >= 45) {
    badgeColor = '#FFEB3B'; // Yellow (45m - 1 hour)
  }

  if (browserAction && browserAction.setBadgeBackgroundColor) {
    browserAction.setBadgeBackgroundColor({ color: badgeColor });
  }
}

// Update badge on startup
browserAPI.runtime.onStartup.addListener(updateBadge);
browserAPI.runtime.onInstalled.addListener(updateBadge);

// Auto-update badge when storage changes
browserAPI.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.time_entries) {
    updateBadge();
  }
});
