# AI Chat Extractor - Chrome Extension

Extract conversations from ChatGPT, Claude, Gemini, and other AI chat platforms into JSON format for context preservation and portability.

## 🎯 Purpose

This extension helps you:
- **Export AI conversations** from multiple platforms
- **Preserve context** for sharing with other AI agents
- **Minimize file size** while maintaining all essential information
- **Enable conversation portability** between different AI platforms

## 📋 Features

- ✅ **Compact Mode**: Minimized JSON for smallest file size
- ✅ **Timestamp Support**: Optional timestamp inclusion
- ✅ **Clean Extraction**: Removes UI elements, keeps only conversation
- ✅ **Keeps Structure Intact**: Preserves markdown formatting, tables, code blocks, lists
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

### Step 1: Navigate to an AI Chat
Open a conversation on one of these platforms:
- ChatGPT: https://chat.openai.com
- Claude: https://claude.ai
- Gemini: https://gemini.google.com

### Step 2: Click the Extension Icon
The popup will show:
- ✓ Platform detected (green)
- ⚠️ Not on supported platform (orange)

### Step 3: Configure Options
- **Include timestamps**: Add timestamp to each message (increases file size)
- **Compact mode**: Use abbreviated keys for smaller files (recommended)

### Step 4: Extract
Click "Extract Conversation" button and save the JSON file.

## 📄 Output Format

### Compact Mode (Recommended)
Smallest file size with abbreviated keys:

```json
{
  "metadata": {
    "platform": "ChatGPT",
    "extractedAt": "2026-02-13T10:30:00.000Z",
    "url": "https://chat.openai.com/c/...",
    "messageCount": 12,
    "version": "1.0"
  },
  "conversation": [
    {
      "r": "u",
      "c": "Hello! Can you help me with Python?"
    },
    {
      "r": "a",
      "c": "Of course! I'd be happy to help you with Python..."
    }
  ]
}
```

**Key Mapping**:
- `r`: role (`u` = user, `a` = assistant)
- `c`: content (message text)

### Full Mode
More readable with complete field names:

```json
{
  "metadata": {
    "platform": "ChatGPT",
    "extractedAt": "2026-02-13T10:30:00.000Z",
    "url": "https://chat.openai.com/c/...",
    "messageCount": 12,
    "version": "1.0"
  },
  "conversation": [
    {
      "role": "user",
      "content": "Hello! Can you help me with Python?",
      "timestamp": "2026-02-13T10:30:00.000Z"
    },
    {
      "role": "assistant",
      "content": "Of course! I'd be happy to help you with Python...",
      "timestamp": "2026-02-13T10:30:15.000Z"
    }
  ]
}
```

## 🔧 Project Structure

```
ai-chat-extractor/
├── manifest.json       # Extension configuration
├── popup.html          # UI interface
├── popup.js           # UI logic
├── content.js         # Core extraction logic
├── icon.png         # Extension icon
├── styles.css         # UI styles
├── ROADMAP.md         # Roadmap
└── README.md          # This file
```

## 🛠️ Technical Details

### Platform Detection
The extension currently detects only Chat GPT From URL hostname matching.

### Extraction Logic

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
Edit `content.js`, line ~200:
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

## 🐛 Troubleshooting

### Extension Icon Not Showing
- Refresh the extension in `chrome://extensions/`
- Reload the page you're trying to extract from

### Platform Not Detected
- Make sure you're on a conversation page (not homepage)
- Check browser console for errors (F12)
- The platform might have updated their DOM structure

### No Messages Extracted
- Scroll through the conversation to load all messages
- Some platforms lazy-load messages
- Check if the selectors in `content.js` need updating

### File Size Too Large
- Enable "Compact mode"
- Disable "Include timestamps"
- Consider extracting specific parts of long conversations

## 📝 Project Phase

### Phase 1: Basic extraction (We are here)

### Phase 2: Context Compression
- Add summarization capabilities
- Extract key decision points
- Identify goals and milestones
- Track work progress markers

### Phase 3: AI-Friendly Format
- Create structured schema for goals, context, choices
- Add semantic markers for important moments
- Include conversation flow metadata
- Optimize for AI re-ingestion

### Phase 4: Cross-Platform Feeding
- Build converter for different AI input formats
- Create prompt templates with extracted context
- Add conversation continuation helpers

## 📜 License

MIT License - Feel free to modify and distribute

**Version**: 1.0 
**Last Updated**: February 2026
