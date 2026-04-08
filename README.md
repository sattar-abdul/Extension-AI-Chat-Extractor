# AI Chat Extractor - Chrome Extension

Extract conversations from ChatGPT platform into JSON format for context preservation and portability.

## 🎯 Purpose

This extension helps you:
- **Export AI conversations** from ChatGPT
- **Preserve context** for sharing with other AI agents
- **Minimize file size** while maintaining all essential information
- **Enable conversation portability** between different AI platforms

## 📋 Features

- ✅ **Compact Mode**: Minimized JSON for smallest file size
- ✅ **Timestamp Support**: Optional timestamp inclusion
- ✅ **Clean Extraction**: Removes UI elements, keeps only conversation
- ✅ **Easy to Use**: One-click extraction from popup

## 🚀 Installation

### Method 1: Load Unpacked Extension (Development)

1. **Download/Clone this repository** to your local machine

2. **Open Chrome** and navigate to:
   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode**
   - Toggle the switch in the top-right corner

4. **Click "Load unpacked"**
   - Select the `ai-chat-extractor` folder

5. **Pin the extension** (optional)
   - Click the puzzle piece icon in Chrome toolbar
   - Pin the "AI Chat Extractor" extension

### Method 2: Pack as .crx (For Distribution)

1. In `chrome://extensions/`, click "Pack extension"
2. Select the `ai-chat-extractor` folder
3. Share the generated `.crx` file

## 📖 How to Use

### Step 1: Navigate to ChatGPT
Open a conversation on ChatGPT:
- ChatGPT: https://chat.openai.com

### Step 2: Click the Extension Icon
The popup will show:
- ✓ Platform detected (green)
- ⚠️ Not on supported platform

### Step 3: Configure Options
- **Include timestamps**: Add timestamp to each message (increases file size)
- **Compact mode**: Use abbreviated keys for smaller files (recommended)
- **Gimini API Key**: For the first time, provide you Gimini API Key

### Step 4: Options
1. Click "Extract Chat" button and save the JSON file.

2. Click "Generate Context" button to get the summarized version of chat.

3. Click "Create Prompt" button and save the txt file that contains prompt.


## 🔧 Project Structure

```
ai-chat-extractor/
├── manifest.json       # Extension configuration
├── popup.html          # UI interface
├── popup.js           # UI logic
├── content.js         # Core extraction logic
├── summarizer.js      # Core summarizer logic
├── icon16.png         # Extension icon (16x16)
├── icon48.png         # Extension icon (48x48)
├── icon128.png        # Extension icon (128x128)
└── README.md          # This file
```

## 🛠️ Technical Details

### Platform Detection
The extension detects platforms by:
1. URL hostname matching
2. DOM structure analysis
3. Platform-specific element detection

### Extraction Logic
Each platform has custom selectors and the DOM changes frequently, so for now we are only focusing on ChatGPT:

**ChatGPT**:
- Messages: `<article>` tags
- User: `[data-message-author-role="user"]`
- Assistant: `[data-message-author-role="assistant"]`
- Content: `.markdown` class


## 🔄 Adding New Platforms

To add support for a new AI chat platform:

1. Open `content.js`
2. Add a new platform object in the `PLATFORMS` constant:

```javascript
newplatform: {
  name: 'New Platform',
  domain: 'newplatform.com',
  detect: () => window.location.hostname.includes('newplatform.com'),
  selectors: {
    messageContainer: '.message-selector',
    userMessage: '.user-selector',
    assistantMessage: '.assistant-selector'
  },
  extract: function() {
    // Custom extraction logic
    const messages = [];
    // ... your extraction code
    return messages;
  }
}
```

3. Update `manifest.json` host_permissions and content_scripts

## 🎨 Customization

### Change File Naming
Edit `content.js`:
```javascript
const filename = `${platform.name.toLowerCase()}-chat-${timestamp}.json`;
```

### Modify Compact Keys
Edit `content.js`, compact mode section:
```javascript
return {
  r: msg.role === 'user' ? 'u' : 'a',  // Change these
  c: msg.content
};
```

### Add New Metadata
Edit `content.js`, metadata section:
```javascript
metadata: {
  platform: platform.name,
  extractedAt: new Date().toISOString(),
  url: window.location.href,
  messageCount: messages.length,
  version: '1.0',
  // Add your custom fields here
  customField: 'value'
}
```

---

**Version**: 2.0  
**Last Updated**: April 2026
