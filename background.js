chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[TimeKeeper] Background received message:', message);
  if (message.type === 'SAVE_TIME_ENTRY') {
    saveTimeEntry(message.data);
  } else if (message.type === 'SYNC_TIME_ENTRIES') {
    syncTimeEntries(message.data);
  } else if (message.type === 'UPDATE_BADGE') {
    updateBadge();
  }
});

let storageQueue = Promise.resolve();

async function syncTimeEntries({ ticketId, entries }) {
  storageQueue = storageQueue.then(async () => {
    console.log(`[TimeKeeper] Syncing ${entries.length} entries for ticket #${ticketId}`);
    const { time_entries = [] } = await chrome.storage.local.get('time_entries');
    
    // Remove all existing entries for this ticket
    const otherEntries = time_entries.filter(e => e.ticketId !== ticketId);
    
    // Add the new entries from the page
    const newEntries = entries.map(entry => ({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...entry
    }));

    const updatedEntries = [...otherEntries, ...newEntries];
    await chrome.storage.local.set({ time_entries: updatedEntries });
    console.log(`[TimeKeeper] Sync complete. Total entries: ${updatedEntries.length}`);
    updateBadge();
  });
  await storageQueue;
}

async function saveTimeEntry(entry) {
  storageQueue = storageQueue.then(async () => {
    console.log('[TimeKeeper] Processing save for entry:', entry);
    const { time_entries = [] } = await chrome.storage.local.get('time_entries');
    
    const newEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...entry
    };

    time_entries.push(newEntry);
    await chrome.storage.local.set({ time_entries });
    console.log('[TimeKeeper] Entry saved. Total entries:', time_entries.length);
    updateBadge();
  });
  
  await storageQueue;
}


async function updateBadge() {
  const { time_entries = [] } = await chrome.storage.local.get('time_entries');
  
  // Use local date string to match the date format stored by content script
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in many locales, but let's be safer
  const todayISO = new Date().toISOString().split('T')[0];
  
  console.log('[TimeKeeper] Updating badge. Today is:', todayISO);

  const todayMinutes = time_entries
    .filter(e => e.date === todayISO)
    .reduce((sum, e) => sum + (parseInt(e.hours || 0) * 60) + parseInt(e.minutes || 0), 0);

  chrome.action.setBadgeText({ text: todayMinutes > 0 ? `${todayMinutes}m` : '' });

  let badgeColor = '#4CAF50'; // Green (default)
  if (todayMinutes >= 60) {
    badgeColor = '#F44336'; // Red (1 hour+)
  } else if (todayMinutes >= 45) {
    badgeColor = '#FFEB3B'; // Yellow (45m - 1 hour)
  }

  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
}

// Update badge on startup
chrome.runtime.onStartup.addListener(updateBadge);
chrome.runtime.onInstalled.addListener(updateBadge);
