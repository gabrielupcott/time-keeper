const browserAPI = typeof browser !== "undefined" ? browser : chrome;

let currentViewDate = new Date();

document.addEventListener('DOMContentLoaded', async () => {
  const { user_name = '' } = await browserAPI.storage.local.get('user_name');
  const nameInput = document.getElementById('user-name');
  nameInput.value = user_name;

  nameInput.addEventListener('change', async () => {
    await browserAPI.storage.local.set({ user_name: nameInput.value.trim() });
    loadDashboard();
  });

  await loadDashboard();
  document.getElementById('export-csv').addEventListener('click', exportCSV);
  document.getElementById('clear-all').addEventListener('click', clearAllData);
  
  document.getElementById('prev-day').addEventListener('click', () => {
    currentViewDate.setDate(currentViewDate.getDate() - 1);
    loadDashboard();
  });
  
  document.getElementById('next-day').addEventListener('click', () => {
    currentViewDate.setDate(currentViewDate.getDate() + 1);
    loadDashboard();
  });

  document.getElementById('jump-today').addEventListener('click', () => {
    currentViewDate = new Date();
    loadDashboard();
  });

  // View switching logic
  const dashboardView = document.getElementById('dashboard-view');
  const settingsView = document.getElementById('settings-view');
  const openSettingsBtn = document.getElementById('open-settings');
  const closeSettingsBtn = document.getElementById('close-settings');

  openSettingsBtn.addEventListener('click', () => {
    dashboardView.classList.remove('active');
    settingsView.classList.add('active');
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsView.classList.remove('active');
    dashboardView.classList.add('active');
  });

  // Listen for storage changes to update the UI in real-time
  browserAPI.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.time_entries) {
      console.log('[TimeKeeper] Storage changed, reloading dashboard');
      loadDashboard();
    }
  });
});

async function loadDashboard() {
  const { time_entries = [], user_name = '' } = await browserAPI.storage.local.get(['time_entries', 'user_name']);
  
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const viewDateStr = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}-${String(currentViewDate.getDate()).padStart(2, '0')}`;
  
  // Update date display and labels
  const dateDisplay = document.getElementById('current-date-display');
  const dayLabel = document.getElementById('day-label');
  const weekLabel = document.getElementById('week-label');
  const monthLabel = document.getElementById('month-label');

  if (viewDateStr === todayStr) {
    dateDisplay.innerText = 'Today';
    dayLabel.innerText = 'Today';
    weekLabel.innerText = 'This Week';
    monthLabel.innerText = 'This Month';
  } else {
    dateDisplay.innerText = currentViewDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    dayLabel.innerText = 'Day';
    weekLabel.innerText = 'Week';
    monthLabel.innerText = 'Month';
  }
  
  // Show warning if name is not set
  const nameWarning = document.getElementById('name-warning');
  if (!user_name) {
    console.log('[TimeKeeper] No user name set, showing warning');
    nameWarning.classList.add('show');
  } else {
    console.log(`[TimeKeeper] User name set to: ${user_name}`);
    nameWarning.classList.remove('show');
  }

  // Filter entries by user name if provided
  const userFilteredEntries = user_name
    ? time_entries.filter(e => e.userName === user_name)
    : time_entries;

  // Calculate totals based on the selected view date's context
  const dayMins = sumMinutes(userFilteredEntries.filter(e => e.date === viewDateStr));
  const weekMins = sumMinutes(userFilteredEntries.filter(e => isSameWeek(e.date, currentViewDate)));
  const monthMins = sumMinutes(userFilteredEntries.filter(e => isSameMonth(new Date(e.date), currentViewDate)));

  document.getElementById('today-total').innerText = formatTime(dayMins);
  document.getElementById('week-total').innerText = formatTime(weekMins);
  document.getElementById('month-total').innerText = formatTime(monthMins);

  // Filter entries for the selected view date
  const filteredEntries = userFilteredEntries.filter(e => e.date === viewDateStr);

  // Group data: Organization (Operator) -> Ticket -> Entries
  const groupedData = {};
  filteredEntries.forEach(entry => {
    const org = entry.organization || 'Unknown';
    const ticket = entry.ticketId || 'No Ticket';
    
    if (!groupedData[org]) {
      groupedData[org] = { tickets: {}, totalMinutes: 0 };
    }
    if (!groupedData[org].tickets[ticket]) {
      groupedData[org].tickets[ticket] = { entries: [], totalMinutes: 0 };
    }
    
    const entryMins = (parseInt(entry.hours || 0) * 60) + parseInt(entry.minutes || 0);
    groupedData[org].totalMinutes += entryMins;
    groupedData[org].tickets[ticket].totalMinutes += entryMins;
    groupedData[org].tickets[ticket].entries.push(entry);
  });

  renderGroupedList(groupedData);
}

function renderGroupedList(groupedData) {
  const listContainer = document.getElementById('entry-list');
  listContainer.innerHTML = '';

  // Sort organizations by name
  const orgs = Object.keys(groupedData).sort();

  orgs.forEach(orgName => {
    const orgData = groupedData[orgName];
    const orgTotalFormatted = formatTime(orgData.totalMinutes);
    
    // Create Operator Dropdown
    const orgGroup = document.createElement('div');
    orgGroup.className = 'dropdown-group';
    
    const orgHeader = document.createElement('div');
    orgHeader.className = 'dropdown-header operator-header';
    orgHeader.innerHTML = `
      <span>${orgName}</span>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="total-badge">${orgTotalFormatted}</span>
        <span class="chevron">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </span>
      </div>
    `;
    
    const orgContent = document.createElement('div');
    orgContent.className = 'dropdown-content';
    
    // Add Tickets to Operator
    const tickets = Object.keys(orgData.tickets).sort();
    tickets.forEach(ticketId => {
      const ticketData = orgData.tickets[ticketId];
      const ticketTotalFormatted = formatTime(ticketData.totalMinutes);
      
      const ticketGroup = document.createElement('div');
      ticketGroup.className = 'dropdown-group';
      
      const ticketHeader = document.createElement('div');
      ticketHeader.className = 'dropdown-header ticket-header';
      ticketHeader.innerHTML = `
        <span>Ticket #${ticketId}</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="total-badge">${ticketTotalFormatted}</span>
          <span class="chevron">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </span>
        </div>
      `;
      
      const ticketContent = document.createElement('div');
      ticketContent.className = 'dropdown-content';
      
      // Add Entries to Ticket
      ticketData.entries.reverse().forEach(entry => {
        const entryItem = document.createElement('div');
        entryItem.className = 'entry-item';
        entryItem.innerHTML = `
          <div class="entry-info">
            <div class="entry-meta">${entry.date} - ${entry.hours}h ${entry.minutes}m</div>
          </div>
          <div class="actions">
            <button class="btn btn-delete" data-id="${entry.id}">Del</button>
          </div>
        `;
        
        entryItem.querySelector('.btn-delete').addEventListener('click', (e) => {
          e.stopPropagation();
          deleteEntry(entry.id);
        });
        ticketContent.appendChild(entryItem);
      });
      
      ticketHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        ticketHeader.classList.toggle('active');
        ticketContent.classList.toggle('show');
      });
      
      ticketGroup.appendChild(ticketHeader);
      ticketGroup.appendChild(ticketContent);
      orgContent.appendChild(ticketGroup);
    });
    
    orgHeader.addEventListener('click', () => {
      orgHeader.classList.toggle('active');
      orgContent.classList.toggle('show');
    });
    
    orgGroup.appendChild(orgHeader);
    orgGroup.appendChild(orgContent);
    listContainer.appendChild(orgGroup);
  });
}

function sumMinutes(entries) {
  return entries.reduce((sum, e) => sum + (parseInt(e.hours || 0) * 60) + parseInt(e.minutes || 0), 0);
}

function formatTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}

function isSameWeek(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  // Get start of week for d2 (Sunday)
  const startOfWeek = new Date(d2);
  startOfWeek.setDate(d2.getDate() - d2.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Get end of week for d2 (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return d1 >= startOfWeek && d1 <= endOfWeek;
}

function isSameMonth(date1, date2) {
  return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
}

async function deleteEntry(id) {
  const { time_entries = [] } = await browserAPI.storage.local.get('time_entries');
  const filtered = time_entries.filter(e => e.id !== id);
  await browserAPI.storage.local.set({ time_entries: filtered });
  
  // Re-load dashboard with current view date preserved
  await loadDashboard();
}

async function clearAllData() {
  if (confirm('Are you sure you want to delete ALL time entries? This action cannot be undone.')) {
    await browserAPI.storage.local.set({ time_entries: [] });
    await loadDashboard();
  }
}

async function exportCSV() {
  const { time_entries = [] } = await browserAPI.storage.local.get('time_entries');
  if (time_entries.length === 0) return alert('No data to export');

  const headers = ['Date', 'Ticket ID', 'Organization', 'Hours', 'Minutes', 'Total Decimal', 'Billable'];
  const rows = time_entries.map(e => [
    e.date,
    e.ticketId || '',
    `"${e.organization}"`,
    e.hours,
    e.minutes,
    (parseInt(e.hours || 0) + parseInt(e.minutes || 0) / 60).toFixed(2),
    e.billable
  ]);

  const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `desk365-time-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}
