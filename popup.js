// Popup script - handles UI interactions
document.addEventListener('DOMContentLoaded', async () => {
  const extractBtn = document.getElementById('extractBtn');
  const statusDiv = document.getElementById('status');
  const statsDiv = document.getElementById('stats');
  const messageCountSpan = document.getElementById('messageCount');
  const fileSizeSpan = document.getElementById('fileSize');
  const includeTimestampsCheckbox = document.getElementById('includeTimestamps');
  const compactModeCheckbox = document.getElementById('compactMode');

  // Get the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Send message to content script to detect platform
  chrome.tabs.sendMessage(tab.id, { action: 'detectPlatform' }, (response) => {
    if (chrome.runtime.lastError) {
      statusDiv.className = 'status not-detected';
      statusDiv.innerHTML = '<div class="platform-name">⚠️ Not on a supported AI chat platform</div>' +
                           '<div>Please navigate to ChatGPT, Claude, or Gemini</div>';
      return;
    }
    
    if (response && response.platform) {
      statusDiv.className = 'status detected';
      statusDiv.innerHTML = `<div class="platform-name">✓ ${response.platformName} detected</div>` +
                           `<div>Ready to extract conversation</div>`;
      extractBtn.disabled = false;
    } else {
      statusDiv.className = 'status not-detected';
      statusDiv.innerHTML = '<div class="platform-name">⚠️ Platform not detected</div>' +
                           '<div>Make sure you\'re on a chat page</div>';
    }
  });

  // Handle extract button click
  extractBtn.addEventListener('click', async () => {
    extractBtn.disabled = true;
    extractBtn.textContent = 'Extracting...';
    
    const options = {
      includeTimestamps: includeTimestampsCheckbox.checked,
      compactMode: compactModeCheckbox.checked
    };

    chrome.tabs.sendMessage(tab.id, { 
      action: 'extractConversation',
      options: options 
    }, (response) => {
      if (chrome.runtime.lastError) {
        alert('Error: ' + chrome.runtime.lastError.message);
        extractBtn.disabled = false;
        extractBtn.textContent = 'Extract Conversation';
        return;
      }
      
      if (response && response.success) {
        // Show stats
        statsDiv.classList.add('visible');
        messageCountSpan.textContent = response.messageCount;
        fileSizeSpan.textContent = response.fileSize;
        
        // Download the file
        downloadJSON(response.data, response.filename);
        
        // Reset button
        setTimeout(() => {
          extractBtn.disabled = false;
          extractBtn.textContent = 'Extract Conversation';
        }, 1000);
      } else {
        alert('Failed to extract conversation: ' + (response?.error || 'Unknown error'));
        extractBtn.disabled = false;
        extractBtn.textContent = 'Extract Conversation';
      }
    });
  });
});

function downloadJSON(data, filename) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  }, () => {
    URL.revokeObjectURL(url);
  });
}
