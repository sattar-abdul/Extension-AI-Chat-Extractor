// Popup script - handles UI interactions

let extractedData = null;
let summaryData = null;
let filename = null;

document.addEventListener('DOMContentLoaded', async () => {
  const extractBtn = document.getElementById('extractBtn');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const generatePromptBtn = document.getElementById('generatePromptBtn');
  const statusDiv = document.getElementById('status');
  const statsDiv = document.getElementById('stats');
  const messageCountSpan = document.getElementById('messageCount');
  const fileSizeSpan = document.getElementById('fileSize');
  const summaryStatsDiv = document.getElementById('summaryStats');
  const summarySizeSpan = document.getElementById('summarySize');
  const compressionRatioSpan = document.getElementById('compressionRatio');
  const includeTimestampsCheckbox = document.getElementById('includeTimestamps');
  const compactModeCheckbox = document.getElementById('compactMode');
  const apiSetupDiv = document.getElementById('apiSetup');
  const apiSavedDiv = document.getElementById('apiSaved');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const changeApiKeyBtn = document.getElementById('changeApiKeyBtn');
  const apiSetupStatus = document.getElementById('apiSetupStatus');

  // Check API key
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiSavedDiv.style.display = 'flex';
      apiSetupDiv.style.display = 'none';
    } else {
      apiSetupDiv.style.display = 'block';
      apiSavedDiv.style.display = 'none';
    }
  });

  // Save API key
  saveApiKeyBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
        apiSetupStatus.textContent = '✓ Saved!';
        apiSetupStatus.className = 'api-status success';
        setTimeout(() => {
          apiSetupDiv.style.display = 'none';
          apiSavedDiv.style.display = 'flex';
        }, 1000);
      });
    } else {
      apiSetupStatus.textContent = '⚠ Enter a valid key';
      apiSetupStatus.className = 'api-status error';
    }
  });

  // Change API key
  changeApiKeyBtn.addEventListener('click', () => {
    apiKeyInput.value = '';
    apiSetupDiv.style.display = 'block';
    apiSavedDiv.style.display = 'none';
  });

  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Function to inject content script if needed
  async function ensureContentScript() {
    try {
      // Try to ping the content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'detectPlatform' });
      return response;
    } catch (error) {
      // Content script not loaded, inject it
      console.log('Injecting content script...');
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      
      // Wait a bit for script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try again
      return await chrome.tabs.sendMessage(tab.id, { action: 'detectPlatform' });
    }
  }

  // Detect platform with auto-injection
  try {
    const response = await ensureContentScript();
    
    if (response && response.platform) {
      statusDiv.className = 'status success';
      statusDiv.innerHTML = `<div class="platform-name">✓ ${response.platformName} Detected</div><div class="status-sub">Ready to extract</div>`;
      extractBtn.disabled = false;
    } else {
      statusDiv.className = 'status error';
      statusDiv.innerHTML = '<div class="platform-name">⚠ Platform not detected</div><div class="status-sub">Make sure you\'re on a ChatGPT conversation</div>';
    }
  } catch (error) {
    statusDiv.className = 'status error';
    statusDiv.innerHTML = '<div class="platform-name">⚠ Not on ChatGPT</div><div class="status-sub">Navigate to chatgpt.com</div>';
    console.error('Platform detection error:', error);
  }

  // BUTTON 1: Extract Chat
  extractBtn.addEventListener('click', async () => {
    extractBtn.disabled = true;
    const label = extractBtn.querySelector('.btn-label');
    const originalText = label.textContent;
    label.textContent = 'Extracting...';

    const options = {
      includeTimestamps: includeTimestampsCheckbox.checked,
      compactMode: compactModeCheckbox.checked
    };

    try {
      // Ensure content script is loaded
      await ensureContentScript();
      
      // Extract conversation
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'extractConversation', 
        options 
      });

      if (response && response.success) {
        extractedData = response.data;
        filename = response.filename;

        statsDiv.classList.add('visible');
        messageCountSpan.textContent = response.messageCount;
        fileSizeSpan.textContent = response.fileSize;

        downloadJSON(extractedData, filename);
        summarizeBtn.disabled = false;
        
        label.textContent = '✓ Downloaded!';
        setTimeout(() => {
          extractBtn.disabled = false;
          label.textContent = originalText;
        }, 2000);
      } else {
        throw new Error(response?.error || 'Extraction failed');
      }
    } catch (error) {
      alert('❌ Extraction failed:\n\n' + error.message + '\n\nMake sure:\n- You\'re on chatgpt.com\n- A conversation is open\n- Messages are visible on screen');
      extractBtn.disabled = false;
      label.textContent = originalText;
      console.error('Extraction error:', error);
    }
  });

  // BUTTON 2: Generate Summary
  summarizeBtn.addEventListener('click', async () => {
    if (!extractedData) {
      alert('⚠ Extract conversation first!');
      return;
    }

    chrome.storage.local.get(['geminiApiKey'], async (result) => {
      if (!result.geminiApiKey) {
        alert('⚠ API key required!\n\nGet free key at:\nhttps://aistudio.google.com/app/apikey');
        return;
      }

      summarizeBtn.disabled = true;
      const label = summarizeBtn.querySelector('.btn-label');
      const originalText = label.textContent;
      label.textContent = 'Summarizing...';

      try {
        summaryData = await summarizeWithGemini(extractedData, result.geminiApiKey);
        
        const summaryStr = JSON.stringify(summaryData, null, 2);
        const summarySize = (new Blob([summaryStr]).size / 1024).toFixed(2);
        summarySizeSpan.textContent = summarySize + ' KB';
        compressionRatioSpan.textContent = summaryData.summary_metadata.compression_ratio;
        summaryStatsDiv.style.display = 'block';

        const summaryFilename = filename.replace('.json', '-summary.json');
        downloadJSON(summaryData, summaryFilename);

        generatePromptBtn.disabled = false;
        label.textContent = '✓ Downloaded!';
        
        setTimeout(() => {
          summarizeBtn.disabled = false;
          label.textContent = originalText;
        }, 2000);
      } catch (error) {
        alert('❌ Summarization failed:\n\n' + error.message);
        summarizeBtn.disabled = false;
        label.textContent = originalText;
        console.error('Summarization error:', error);
      }
    });
  });

  // BUTTON 3: Generate Prompt
  generatePromptBtn.addEventListener('click', () => {
    if (!summaryData) {
      alert('⚠ Generate summary first!');
      return;
    }

    generatePromptBtn.disabled = true;
    const label = generatePromptBtn.querySelector('.btn-label');
    const originalText = label.textContent;
    label.textContent = 'Creating...';

    const promptData = generateContinuationPrompt(summaryData);
    const promptFilename = filename.replace('.json', '-prompt.txt');
    downloadText(promptData, promptFilename);
    
    label.textContent = '✓ Downloaded!';
    setTimeout(() => {
      generatePromptBtn.disabled = false;
      label.textContent = originalText;
    }, 2000);
  });
});

function downloadJSON(data, filename) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({ url, filename, saveAs: true }, () => URL.revokeObjectURL(url));
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({ url, filename, saveAs: true }, () => URL.revokeObjectURL(url));
}