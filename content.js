const browserAPI = typeof browser !== "undefined" ? browser : chrome;

const observer = new MutationObserver((mutations) => {
  handlePageChange();
});

observer.observe(document.body, { childList: true, subtree: true });

let lastKnownTicketId = null;
let lastKnownTimeEntries = null;
let lastKnownOrganization = "Unknown";

function getTicketId() {
  const breadcrumbActive = document.querySelector('.breadcrumb-active');
  if (breadcrumbActive) {
    const text = breadcrumbActive.innerText.trim();
    const match = text.match(/#(\d+)/);
    return match ? match[1] : null;
  }
  return null;
}

function getOrganization() {
  // First, try to find the operator in the specific HTML structure provided (Priority 1)
  let operatorFromField = null;
  const operatorLabels = document.querySelectorAll('.ticket-field-label');
  for (const label of operatorLabels) {
    if (label.innerText.trim().includes('Operator')) {
      // The label is inside a div, and the mat-form-field is a sibling of that div's parent or inside the same parent.
      // Based on the HTML: <div class="ticket-field-label"> Operator </div> is followed by <mat-form-field>
      const parentContainer = label.parentElement;
      if (parentContainer) {
        // Try to find the select value in the same parent container
        const selectValue = parentContainer.querySelector('.mat-mdc-select-value-text');
        if (selectValue) {
          operatorFromField = selectValue.innerText.trim();
          if (operatorFromField) break;
        }
        
        // If not found, try the next sibling of the label (if label is in its own div)
        const nextSibling = label.nextElementSibling;
        if (nextSibling) {
          const siblingSelectValue = nextSibling.querySelector('.mat-mdc-select-value-text');
          if (siblingSelectValue) {
            operatorFromField = siblingSelectValue.innerText.trim();
            if (operatorFromField) break;
          }
        }

        // If still not found, try the parent's next sibling (if label is in a nested div)
        const parentNextSibling = parentContainer.nextElementSibling;
        if (parentNextSibling) {
          const siblingSelectValue = parentNextSibling.querySelector('.mat-mdc-select-value-text');
          if (siblingSelectValue) {
            operatorFromField = siblingSelectValue.innerText.trim();
            if (operatorFromField) break;
          }
        }
      }
    }
  }

  // If still not found, try a more direct approach based on the provided HTML structure
  if (!operatorFromField) {
    const matSelects = document.querySelectorAll('mat-select[aria-labelledby*="mat-select-value"]');
    for (const select of matSelects) {
      const label = select.closest('.ng-star-inserted')?.querySelector('.ticket-field-label');
      if (label && label.innerText.trim().includes('Operator')) {
        const selectValue = select.querySelector('.mat-mdc-select-value-text');
        if (selectValue) {
          operatorFromField = selectValue.innerText.trim();
          if (operatorFromField) break;
        }
      }
    }
  }

  // Fallback to the original organization detection logic (Priority 2)
  let companyFromContactInfo = null;
  const infoContainers = document.querySelectorAll('.contact-info-container-old');
  for (const container of infoContainers) {
    const contentWrapper = container.querySelector('.content-wrapper');
    if (contentWrapper && contentWrapper.innerText.includes('Company:')) {
      companyFromContactInfo = contentWrapper.innerText.replace('Company:', '').trim();
      break;
    }
  }

  // Logic:
  // 1. If operatorFromField exists, use it (even if it mismatches companyFromContactInfo).
  // 2. If operatorFromField is empty/null, use companyFromContactInfo.
  // 3. If both are empty, return "Unknown".

  if (operatorFromField && operatorFromField !== "--") {
    if (companyFromContactInfo && operatorFromField !== companyFromContactInfo) {
      // console.log(`[TimeKeeper] Operator mismatch! Field: "${operatorFromField}", Contact Info: "${companyFromContactInfo}". Using Field.`);
    } else {
      // console.log(`[TimeKeeper] Operator detected from field: ${operatorFromField}`);
    }
    return operatorFromField;
  }

  if (companyFromContactInfo) {
    // console.log(`[TimeKeeper] Company detected from contact info: ${companyFromContactInfo}`);
    return companyFromContactInfo;
  }

  return "Unknown";
}

function handlePageChange() {
  const ticketId = getTicketId();
  if (!ticketId) return;

  const currentOrganization = getOrganization();

  if (ticketId !== lastKnownTicketId) {
    // console.log(`[TimeKeeper] Switched to ticket #${ticketId}`);
    lastKnownTicketId = ticketId;
    lastKnownTimeEntries = null;
    lastKnownOrganization = currentOrganization;
  }

  // Detect if organization changed (even if not from Unknown)
  const organizationUpdated = currentOrganization !== lastKnownOrganization;
  if (organizationUpdated) {
    // console.log(`[TimeKeeper] Organization updated: ${lastKnownOrganization} -> ${currentOrganization}. Updating entries.`);
    lastKnownOrganization = currentOrganization;
    // Reset lastKnownTimeEntries to force a re-sync with the new organization name
    lastKnownTimeEntries = null;
  }

  // Look for the time entries section.
  const timeEntriesSection = findTimeEntriesSection();
  if (timeEntriesSection) {
    checkForNewTimeEntries(ticketId, timeEntriesSection);
  }
}

function findTimeEntriesSection() {
  // The user provided HTML shows <app-gp-timer> inside a div with _ngcontent-ng-c3660741032
  // Let's look for app-gp-timer as a strong indicator of the time entries list.
  const timers = document.querySelectorAll('app-gp-timer');
  if (timers.length > 0) {
    // Return the parent container that holds all timers
    return timers[0].closest('.gp-cn-flex-start-flex-start') || timers[0].parentElement;
  }

  // Fallback to the "Enter Time:" label if timers aren't loaded yet
  const labels = document.querySelectorAll('mat-label');
  for (const label of labels) {
    if (label.innerText.includes('Enter Time:')) {
      return label.closest('.mat-mdc-card') || label.closest('mat-tab-body') || document.body;
    }
  }
  return null;
}

async function checkForNewTimeEntries(ticketId, section) {
  // Get the user name from storage to filter entries
  const { user_name = '' } = await browserAPI.storage.local.get('user_name');
  
  // Based on the provided HTML, each entry is an <app-gp-timer>
  const entryElements = document.querySelectorAll('app-gp-timer');
  
  // Create a unique string representing the current state of all entries to avoid redundant syncs
  const currentEntriesData = Array.from(entryElements)
    .map((el) => {
      const timeText = el.querySelector('div[style*="font-size: 14px;"]')?.innerText.trim() || "";
      const dateText = el.querySelector('span[style*="color: var(--gp-neutral-white-700);"]')?.innerText.trim() || "";
      const userName = el.querySelector('a')?.innerText.trim() || "";
      return `${timeText}|${dateText}|${userName}`;
    })
    .join('||');

  if (currentEntriesData === lastKnownTimeEntries) return;
  lastKnownTimeEntries = currentEntriesData;

  // console.log(`[TimeKeeper] Syncing ${entryElements.length} entries for ticket #${ticketId}`);
  
  const organization = getOrganization();
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const entriesToSync = Array.from(entryElements).map(el => {
    const timeText = el.querySelector('div[style*="font-size: 14px;"]')?.innerText.trim() || "";
    const dateText = el.querySelector('span[style*="color: var(--gp-neutral-white-700);"]')?.innerText.trim() || "";
    const userName = el.querySelector('a')?.innerText.trim() || "";

    // If a user name is set in the extension, only sync entries that match that name
    if (user_name && userName && userName.toLowerCase() !== user_name.toLowerCase()) {
      // console.log(`[TimeKeeper] Skipping entry for user: ${userName} (Expected: ${user_name})`);
      return null;
    }
    
    let entryDate = todayISO;
    if (dateText) {
      // dateText is likely " on MM/DD/YY" or " on MM/DD/YYYY"
      const dateMatch = dateText.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if (dateMatch) {
        let [_, month, day, year] = dateMatch;
        if (year.length === 2) year = "20" + year;
        entryDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    const timeMatch = timeText.match(/(\d+)h\s*:\s*(\d+)m/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      // console.log(`[TimeKeeper] Detected time entry: ${hours}h ${minutes}m for date: ${dateText || 'Today'} (Syncing as: ${entryDate})`);
      
      return {
        ticketId: ticketId,
        hours: hours,
        minutes: minutes,
        date: entryDate,
        billable: true,
        organization: organization,
        userName: userName,
        source: 'list_sync'
      };
    }
    return null;
  }).filter(e => e !== null);

  if (browserAPI.runtime?.id) {
    browserAPI.runtime.sendMessage({
      type: 'SYNC_TIME_ENTRIES',
      data: {
        ticketId: ticketId,
        entries: entriesToSync
      }
    });
  } else {
    console.warn('[TimeKeeper] Extension context invalidated. Please refresh the page.');
  }
}

// Keep dialog listener as a secondary method
function setupDialogListener(dialog) {
  const saveButton = dialog.querySelector('button[color="primary"]');
  if (!saveButton || saveButton.dataset.timekeeperTracked) return;

  saveButton.dataset.timekeeperTracked = "true";
  // console.log('[TimeKeeper] Save button listener attached');

  saveButton.addEventListener('click', () => {
    // When the user clicks save, we wait for the page to update and then sync the whole list.
    // This is more reliable than trying to capture the dialog values.
    setTimeout(() => {
      handlePageChange();
    }, 2000); // Wait for the save to complete and the list to refresh
  });
}

const dialogObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const dialog = node.querySelector('app-te-dialog') || (node.tagName === 'APP-TE-DIALOG' ? node : null);
        if (dialog) {
          setupDialogListener(dialog);
        }
      }
    }
  }
});
dialogObserver.observe(document.body, { childList: true, subtree: true });
