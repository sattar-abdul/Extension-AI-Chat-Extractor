// Content script - runs on AI chat pages and extracts conversations

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function tableToMarkdown(table) {
  let markdown = '\n\n';
  const rows = table.querySelectorAll('tr');
  
  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll('td, th');
    const cellTexts = Array.from(cells).map(cell => cell.textContent.trim());
    markdown += '| ' + cellTexts.join(' | ') + ' |\n';
    
    if (rowIndex === 0) {
      markdown += '|' + cellTexts.map(() => ' --- ').join('|') + '|\n';
    }
  });
  
  return markdown + '\n';
}

function detectLanguage(codeBlock) {
  const pre = codeBlock.closest('pre');
  const codeClasses = codeBlock.className || '';
  const preClasses = pre?.className || '';
  
  let match = codeClasses.match(/language-(\w+)/);
  if (match) return match[1];
  
  match = preClasses.match(/language-(\w+)/);
  if (match) return match[1];
  
  const parent = codeBlock.closest('[class*="language"]');
  if (parent) {
    match = parent.className.match(/language-(\w+)/);
    if (match) return match[1];
  }
  
  return '';
}

function removeEmojis(text) {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F700}-\u{1F77F}]/gu, '')
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '')
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
    .replace(/[\u{E0020}-\u{E007F}]/gu, '')
    .replace(/[\u{200D}]/gu, '')
    .trim();
}

function cleanText(text) {
  return text
    .replace(/Copy code\n?/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\t/g, '    ')
    .replace(/ {3,}/g, '  ')
    .trim();
}

function extractMarkdownContent(element) {
  const clone = element.cloneNode(true);
  
  clone.querySelectorAll('button, svg, [role="button"], [class*="copy"], [class*="icon"]').forEach(el => {
    el.remove();
  });
  
  clone.querySelectorAll('table').forEach(table => {
    const markdownTable = tableToMarkdown(table);
    const textNode = document.createTextNode(markdownTable);
    table.replaceWith(textNode);
  });
  
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
  
  let text = clone.textContent;
  text = removeEmojis(text);
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
    detect: () => window.location.hostname.includes('chatgpt.com') || window.location.hostname.includes('chat.openai.com'),
    extract: function () {
      const messages = [];
      const articles = document.querySelectorAll('section[data-testid^="conversation-turn"]');

      articles.forEach((article, index) => {
        const isUser = article.querySelector('[data-message-author-role="user"]') !== null;
        const isAssistant = article.querySelector('[data-message-author-role="assistant"]') !== null;

        if (!isUser && !isAssistant) return;

        const contentDiv = article.querySelector('.markdown, .whitespace-pre-wrap, [class*="prose"]');
        let text = '';

        if (contentDiv) {
          text = extractMarkdownContent(contentDiv);
        }

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
// MAIN FUNCTIONS
// ============================================================================

function detectPlatform() {
  for (const [key, platform] of Object.entries(PLATFORMS)) {
    if (platform.detect()) {
      return { platform: key, platformName: platform.name };
    }
  }
  return null;
}

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
        return {
          r: msg.role === 'user' ? 'u' : 'a',
          c: msg.content
        };
      } else {
        return {
          role: msg.role,
          content: msg.content,
          ...(options.includeTimestamps && { timestamp: new Date().toISOString() })
        };
      }
    })
  };

  const jsonStr = JSON.stringify(output, null, 2);
  const fileSize = (new Blob([jsonStr]).size / 1024).toFixed(2) + ' KB';
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'detectPlatform') {
    const result = detectPlatform();
    sendResponse(result);
  } else if (request.action === 'extractConversation') {
    const result = extractConversation(request.options);
    sendResponse(result);
  }
  
  return true;
});