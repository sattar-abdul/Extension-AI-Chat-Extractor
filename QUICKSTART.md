# Quick Start Guide 🚀

## Install in 2 Minutes

### 1. Get the Extension Ready
```bash
# If you have the files, skip to step 2
# If downloading from source, extract the zip
```

### 2. Load into Chrome
1. Open Chrome
2. Go to: `chrome://extensions/`
3. Toggle **"Developer mode"** (top-right)
4. Click **"Load unpacked"**
5. Select the `ai-chat-extractor` folder
6. Done! You should see the extension in your toolbar

### 3. Use It
1. Go to ChatGPT, Claude, or Gemini
2. Open any conversation
3. Click the extension icon (🤖)
4. Click "Extract Conversation"
5. Save the JSON file

## What You Get

**Compact Mode** (default):
- Smallest file size
- Keys: `r` (role), `c` (content)
- Values: `u` (user), `a` (assistant)
- Perfect for feeding to other AIs

**Full Mode**:
- Human-readable
- Full field names
- Optional timestamps
- Better for documentation

## File Size Comparison

For a 20-message conversation:

| Mode | Size | Savings |
|------|------|---------|
| Full + Timestamps | 15 KB | - |
| Full (no timestamps) | 12 KB | 20% |
| Compact + Timestamps | 10 KB | 33% |
| **Compact (recommended)** | **8 KB** | **47%** |

## Feeding to Another AI

### Method 1: Direct Paste (Small Conversations)
```
I have a conversation context from another AI. Here's the JSON:
[paste the extracted JSON]

Please understand the context and continue helping me with [your goal].
```

### Method 2: Summarized Context (Large Conversations)
First, ask an AI to summarize:
```
Please analyze this conversation JSON and create a brief summary including:
- Main goal/objective
- Key decisions made
- Current progress
- Open questions

[paste JSON]
```

Then share the summary with the new AI.

### Method 3: File Upload (If Supported)
Some AI platforms allow file uploads - just upload the JSON directly.

## Tips for Better Extraction

### ✅ Do This:
- Scroll through the entire conversation first (loads all messages)
- Use compact mode for smaller files
- Extract regularly to backup important conversations
- Include timestamps if you need temporal context

### ❌ Avoid This:
- Extracting from homepage (no conversation loaded)
- Very long conversations (might timeout) - extract in chunks
- Extracting while AI is still generating (wait for completion)

## Troubleshooting

**"Platform not detected"**
- Make sure you're on a conversation page
- Refresh the page
- Check if URL matches: chat.openai.com, claude.ai, or gemini.google.com

**"No messages found"**
- Scroll through conversation to load all messages
- Wait for page to fully load
- Try refreshing and extracting again

**Extension icon not visible**
- Click puzzle piece (🧩) in Chrome toolbar
- Pin the "AI Chat Extractor" extension

## Next Steps

Now that you have basic extraction working, you can:

1. **Enhance Platform Support**
   - Add more AI platforms (Perplexity, Poe, etc.)
   - Update selectors if platforms change

2. **Add Context Compression**
   - Summarize instead of full text
   - Extract only decision points
   - Track progress markers

3. **Build AI-Friendly Format**
   - Add semantic tags (goal, decision, milestone)
   - Create conversation flow metadata
   - Add continuation prompts

4. **Automate Feeding**
   - Build import helpers for different AIs
   - Create prompt templates
   - Add conversation merging

---

**Need Help?** Check the full README.md for detailed documentation.

**Want to Contribute?** The codebase is designed to be extensible - add your own platforms!
