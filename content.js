// Content script - runs on AI chat pages and extracts conversations

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert HTML table to Markdown format
 */
function tableToMarkdown(table) {
  let markdown = '\n\n';
  const rows = table.querySelectorAll('tr');
  
  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll('td, th');
    const cellTexts = Array.from(cells).map(cell => cell.textContent.trim());
    markdown += '| ' + cellTexts.join(' | ') + ' |\n';
    
    // Add separator after header row
    if (rowIndex === 0) {
      markdown += '|' + cellTexts.map(() => ' --- ').join('|') + '|\n';
    }
  });
  
  return markdown + '\n';
}

/**
 * Detect programming language from code block
 */
function detectLanguage(codeBlock) {
  // ChatGPT adds language classes like "language-python"
  const pre = codeBlock.closest('pre');
  const codeClasses = codeBlock.className || '';
  const preClasses = pre?.className || '';
  
  // Try code element classes first
  let match = codeClasses.match(/language-(\w+)/);
  if (match) return match[1];
  
  // Try pre element classes
  match = preClasses.match(/language-(\w+)/);
  if (match) return match[1];
  
  // Check for common language indicators in parent divs
  const parent = codeBlock.closest('[class*="language"]');
  if (parent) {
    match = parent.className.match(/language-(\w+)/);
    if (match) return match[1];
  }
  
  return ''; // No language detected
}

/**
 * Remove all emojis from text
 */
function removeEmojis(text) {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Symbols & Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & Map
    .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Alchemical
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Geometric Shapes
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Supplemental Arrows
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{E0020}-\u{E007F}]/gu, '') // Tags
    .replace(/[\u{200D}]/gu, '')            // Zero-width joiner
    .trim();
}

/**
 * Clean up whitespace and formatting
 */
function cleanText(text) {
  return text
    .replace(/Copy code\n?/g, '')           // Remove "Copy code" text
    .replace(/\n{3,}/g, '\n\n')             // Max 2 consecutive newlines
    .replace(/\t/g, '    ')                 // Convert tabs to 4 spaces
    .replace(/ {3,}/g, '  ')                // Max 2 consecutive spaces (except code indentation)
    .trim();
}

/**
 * Extract content from element while preserving markdown structure
 */
function extractMarkdownContent(element) {
  // Clone to avoid modifying the original DOM
  const clone = element.cloneNode(true);
  
  // Remove all UI elements (buttons, SVGs, icons)
  clone.querySelectorAll('button, svg, [role="button"], [class*="copy"], [class*="icon"]').forEach(el => {
    el.remove();
  });
  
  // Convert HTML tables to Markdown tables
  clone.querySelectorAll('table').forEach(table => {
    const markdownTable = tableToMarkdown(table);
    const textNode = document.createTextNode(markdownTable);
    table.replaceWith(textNode);
  });
  
  // Preserve code blocks with proper markdown syntax
  clone.querySelectorAll('pre').forEach(pre => {
    const codeBlock = pre.querySelector('code');
    if (codeBlock) {
      const language = detectLanguage(codeBlock);
      const code = codeBlock.textContent;
      const markdown = `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
      const textNode = document.createTextNode(markdown);
      pre.replaceWith(textNode);
    }
  });
  
  // Get text content (preserves markdown syntax for bold, italic, links, etc.)
  let text = clone.textContent;
  
  // Remove emojis
  text = removeEmojis(text);
  
  // Clean up whitespace and formatting
  text = cleanText(text);
  
  return text;
}

// ============================================================================
// PLATFORM CONFIGURATION
// ============================================================================

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
      timestamp: 'time'
    },
    extract: function () {
      const messages = [];
      const articles = document.querySelectorAll('article');

      articles.forEach((article, index) => {
        const isUser = article.querySelector('[data-message-author-role="user"]') !== null;
        const isAssistant = article.querySelector('[data-message-author-role="assistant"]') !== null;

        if (!isUser && !isAssistant) return;

        // Extract text content with markdown preservation
        const contentDiv = article.querySelector('.markdown, .whitespace-pre-wrap, [class*="prose"]');
        let text = '';

        if (contentDiv) {
          text = extractMarkdownContent(contentDiv);
        }

        // Skip empty messages
        if (!text || text.length < 1) return;

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

// ============================================================================
// MAIN EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Detect which platform we're on
 */
function detectPlatform() {
  for (const [key, platform] of Object.entries(PLATFORMS)) {
    if (platform.detect()) {
      return { platform: key, platformName: platform.name };
    }
  }
  return null;
}

/**
 * Extract conversation from current platform
 */
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

// ============================================================================
// MESSAGE LISTENER
// ============================================================================

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