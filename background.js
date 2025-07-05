// Default inactivity threshold in minutes
const DEFAULT_THRESHOLD_MINUTES = 30;
const CHECK_INTERVAL_MINUTES = 5;

console.log('Tabs Killer extension loaded');

// Store last active time for each tab
let tabActivity = {};

// Listen for tab activity
chrome.tabs.onActivated.addListener(activeInfo => {
  console.log('Tab activated:', activeInfo.tabId);
  tabActivity[activeInfo.tabId] = Date.now();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active) {
    console.log('Tab updated and active:', tabId);
    tabActivity[tabId] = Date.now();
  }
});

chrome.tabs.onRemoved.addListener(tabId => {
  console.log('Tab removed:', tabId);
  delete tabActivity[tabId];
});

function checkTabs() {
  console.log('Checking tabs for inactivity...');
  const now = Date.now();
  chrome.storage.sync.get(['threshold'], (result) => {
    const threshold = result.threshold || DEFAULT_THRESHOLD_MINUTES;
    console.log('Using threshold:', threshold, 'minutes');
    chrome.tabs.query({}, tabs => {
      console.log('Found', tabs.length, 'tabs');
      tabs.forEach(tab => {
        const lastActive = tabActivity[tab.id] || now;
        const inactiveMinutes = (now - lastActive) / 60000;
        console.log(`Tab ${tab.id} (${tab.title}): inactive for ${inactiveMinutes.toFixed(1)} minutes`);
        if (!tab.active && inactiveMinutes > threshold) {
          console.log(`Closing inactive tab: ${tab.title} (${tab.id})`);
          chrome.tabs.remove(tab.id);
        }
      });
    });
  });
}

// Run periodically
console.log('Setting up periodic check every', CHECK_INTERVAL_MINUTES, 'minutes');
setInterval(checkTabs, CHECK_INTERVAL_MINUTES * 60 * 1000);

// Initialize activity for all tabs on startup
chrome.tabs.query({}, tabs => {
  const now = Date.now();
  console.log('Initializing', tabs.length, 'tabs on startup');
  tabs.forEach(tab => {
    tabActivity[tab.id] = now;
  });
});

// Run initial check after a short delay
setTimeout(checkTabs, 10000); // Check after 10 seconds 