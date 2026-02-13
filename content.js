// Content script - runs on AI chat pages and extracts conversations

// Platform-specific selectors and extraction logic
const PLATFORMS = {
  chatgpt: {
    name: 'ChatGPT',
    domain: 'chatgpt.com',
    detect: () => window.location.hostname.includes('chatgpt.com'),
    selectors: {
      messageContainer: 'article',
      userMessage: '[data-message-author-role="user"]',
      assistantMessage: '[data-message-author-role="assistant"]',
      messageText: '.markdown',
      timestamp: 'time' // May not always be present
    },
    extract: function() {
      const messages = [];
      const articles = document.querySelectorAll('article');
      
      articles.forEach((article, index) => {
        const isUser = article.querySelector('[data-message-author-role="user"]') !== null;
        const isAssistant = article.querySelector('[data-message-author-role="assistant"]') !== null;
        
        if (!isUser && !isAssistant) return;
        
        // Extract text content
        const contentDiv = article.querySelector('.markdown, .whitespace-pre-wrap, [class*="prose"]');
        let text = '';
        
        if (contentDiv) {
          // Clone the node to manipulate it
          const clone = contentDiv.cloneNode(true);
          
          // Remove code copy buttons and other UI elements
          clone.querySelectorAll('button, .copy-button').forEach(btn => btn.remove());
          
          text = clone.innerText.trim();
        }
        
        if (!text) return;
        
        messages.push({
          role: isUser ? 'user' : 'assistant',
          content: text,
          index: index
        });
      });
      
      return messages;
    }
  },
  
  claude: {
    name: 'Claude',
    domain: 'claude.ai',
    detect: () => window.location.hostname.includes('claude.ai'),
    selectors: {
      messageContainer: '[class*="font-claude-message"]',
      userMessage: '[data-is-user-message="true"]',
      assistantMessage: '[data-is-user-message="false"]'
    },
    extract: function() {
      const messages = [];
      
      // Claude uses different DOM structure - look for message containers
      const allMessages = document.querySelectorAll('[class*="font-claude-message"], [class*="message"], div[class*="group"]');
      
      allMessages.forEach((msg, index) => {
        // Try to determine if it's user or assistant message
        const isUserMessage = msg.textContent.includes('You') || 
                             msg.querySelector('[class*="user"]') !== null ||
                             msg.getAttribute('data-is-user-message') === 'true' ||
                             msg.closest('[data-is-user-message="true"]') !== null;
        
        // Get the actual message content
        let text = '';
        const contentDiv = msg.querySelector('[class*="prose"], [class*="markdown"], p, div[class*="content"]');
        
        if (contentDiv) {
          const clone = contentDiv.cloneNode(true);
          clone.querySelectorAll('button').forEach(btn => btn.remove());
          text = clone.innerText.trim();
        } else {
          text = msg.innerText.trim();
        }
        
        // Filter out empty messages and UI elements
        if (!text || text.length < 5) return;
        if (text.includes('Copy') || text.includes('Regenerate')) return;
        
        // Alternate between user and assistant if we can't detect
        const role = isUserMessage ? 'user' : 'assistant';
        
        messages.push({
          role: role,
          content: text,
          index: index
        });
      });
      
      return messages;
    }
  },
  
  gemini: {
    name: 'Gemini',
    domain: 'gemini.google.com',
    detect: () => window.location.hostname.includes('gemini.google.com'),
    selectors: {
      messageContainer: '[class*="message"]',
      userMessage: '[class*="user-query"]',
      assistantMessage: '[class*="model-response"]'
    },
    extract: function() {
      const messages = [];
      
      // Gemini's structure
      const messageContainers = document.querySelectorAll('message-content, [data-test-id*="message"], [class*="conversation-message"]');
      
      messageContainers.forEach((container, index) => {
        const isUser = container.getAttribute('data-author') === 'user' ||
                      container.querySelector('[class*="user"]') !== null ||
                      container.closest('[class*="user-query"]') !== null;
        
        let text = '';
        const contentDiv = container.querySelector('[class*="markdown"], [class*="message-content"], p');
        
        if (contentDiv) {
          const clone = contentDiv.cloneNode(true);
          clone.querySelectorAll('button').forEach(btn => btn.remove());
          text = clone.innerText.trim();
        } else {
          text = container.innerText.trim();
        }
        
        if (!text || text.length < 5) return;
        
        messages.push({
          role: isUser ? 'user' : 'assistant',
          content: text,
          index: index
        });
      });
      
      return messages;
    }
  }
};

// Detect which platform we're on
function detectPlatform() {
  for (const [key, platform] of Object.entries(PLATFORMS)) {
    if (platform.detect()) {
      return { platform: key, platformName: platform.name };
    }
  }
  return null;
}

// Extract conversation from current platform
function extractConversation(options = {}) {
  const platformInfo = detectPlatform();
  if (!platformInfo) {
    return { success: false, error: 'Platform not detected' };
  }
  
  const platform = PLATFORMS[platformInfo.platform];
  const messages = platform.extract();
  
  if (messages.length === 0) {
    return { success: false, error: 'No messages found on page' };
  }
  
  // Build the output object
  const output = {
    metadata: {
      platform: platform.name,
      extractedAt: new Date().toISOString(),
      url: window.location.href,
      messageCount: messages.length,
      version: '1.0'
    },
    conversation: messages.map(msg => {
      if (options.compactMode) {
        // Compact mode - minimal JSON
        return {
          r: msg.role === 'user' ? 'u' : 'a',
          c: msg.content
        };
      } else {
        // Full mode
        return {
          role: msg.role,
          content: msg.content,
          ...(options.includeTimestamps && { timestamp: new Date().toISOString() })
        };
      }
    })
  };
  
  // Calculate file size
  const jsonStr = JSON.stringify(output, null, 2);
  const fileSize = (new Blob([jsonStr]).size / 1024).toFixed(2) + ' KB';
  
  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `${platform.name.toLowerCase()}-chat-${timestamp}.json`;
  
  return {
    success: true,
    data: output,
    messageCount: messages.length,
    fileSize: fileSize,
    filename: filename
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'detectPlatform') {
    const result = detectPlatform();
    sendResponse(result);
  } else if (request.action === 'extractConversation') {
    const result = extractConversation(request.options);
    sendResponse(result);
  }
  
  return true; // Keep channel open for async response
});