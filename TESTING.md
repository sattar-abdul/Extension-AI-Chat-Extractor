# Testing Guide 🧪

Complete guide to test your AI Chat Extractor extension.

## Pre-Testing Checklist

- [✅] Extension installed in Chrome (`chrome://extensions/`)
- [✅] Developer mode enabled
- [✅] Extension appears in toolbar
- [✅] No errors in extension console

---

## Test 1: Installation Verification

### Steps:
1. Open `chrome://extensions/`
2. Find "AI Chat Extractor"
3. Verify:
   - ✅ Enabled toggle is ON
   - ✅ Version shows 1.0
   - ✅ No errors in card

### Expected Result:
Extension shows as active with no warnings.

---

## Test 2: ChatGPT Extraction

### Setup:
1. Go to https://chat.openai.com
2. Start a new chat OR open existing conversation
3. Add at least 4-6 message exchanges

### Test Steps:
1. Click extension icon (🤖)
2. Verify popup shows:
   - "✓ ChatGPT detected"
   - "Ready to extract conversation"
   - Extract button is enabled
3. Check both options:
   - ✅ Include timestamps
   - ✅ Compact mode
4. Click "Extract Conversation"
5. Save the file

### Verification:
1. Open downloaded JSON file
2. Check structure:
   ```json
   {
     "metadata": {
       "platform": "ChatGPT",
       "extractedAt": "...",
       "url": "https://chat.openai.com/...",
       "messageCount": [number]
     },
     "conversation": [...]
   }
   ```
3. Verify all messages are present
4. Check message roles (user/assistant)
5. Confirm content matches actual conversation

### Common Issues:
- **No messages**: Scroll through conversation first
- **Missing messages**: Page might not be fully loaded
- **Wrong content**: Clear cache and reload

---

## Test 3: Claude Extraction

### Setup:
1. Go to https://claude.ai
2. Open or create a conversation
3. Have at least 4-6 exchanges

### Test Steps:
1. Click extension icon
2. Verify "✓ Claude detected"
3. Try extraction with:
   - Compact mode ON
   - Timestamps OFF
4. Save file

### Verification:
1. Check JSON structure
2. Verify `"platform": "Claude"`
3. Confirm all messages extracted
4. Check file size (should be smaller without timestamps)

### Known Limitations:
- Claude's DOM changes frequently
- Some formatting might be lost
- Code blocks should be preserved

---

## Test 4: Gemini Extraction

### Setup:
1. Go to https://gemini.google.com
2. Create conversation
3. At least 4-6 message pairs

### Test Steps:
1. Click extension icon
2. Verify platform detection
3. Extract with both modes
4. Compare file sizes

### Verification:
Same as above tests, verify platform is "Gemini"

---

## Test 5: Compact vs Full Mode Comparison

### Test Setup:
Use same conversation, extract twice:

1. **First extraction:**
   - Compact mode: OFF
   - Timestamps: ON

2. **Second extraction:**
   - Compact mode: ON  
   - Timestamps: OFF

### Verification:
Compare file sizes:
```bash
# On Mac/Linux
ls -lh chatgpt-chat-*.json

# Expected results:
# Full + timestamps:  ~15 KB (20 messages)
# Compact, no timestamps: ~8 KB (20 messages)
```

Calculate savings:
- Should be ~40-50% size reduction

---

## Test 6: Long Conversation Handling

### Setup:
Find or create a conversation with 50+ messages

### Test Steps:
1. Scroll through entire conversation (load all messages)
2. Wait 2-3 seconds
3. Extract conversation
4. Verify completeness

### Verification:
- All messages present
- No truncation
- File downloads successfully
- No browser freezing

### Performance Metrics:
- Extraction time: <5 seconds
- File size: ~40 KB (50 messages, compact)
- Browser responsive throughout

---

## Test 7: Edge Cases

### Test 7.1: Empty Conversation
1. Go to AI platform homepage (no conversation)
2. Click extension
3. Should show: "Platform detected" but extraction might fail
4. Navigate to actual conversation

### Test 7.2: Mid-Generation
1. Ask AI a long question
2. While it's typing response, try to extract
3. Should either:
   - Wait for completion, OR
   - Extract partial message with warning

### Test 7.3: Code Blocks
1. Ask AI to write code
2. Extract conversation
3. Verify code is preserved correctly

### Test 7.4: Special Characters
1. Include emojis, accented characters
2. Extract and verify
3. Should preserve all Unicode

### Test 7.5: Images/Attachments
1. Conversations with uploaded images
2. Extract conversation
3. Note: Current version extracts text only

---

## Test 8: Error Handling

### Test 8.1: Unsupported Platform
1. Go to https://google.com
2. Click extension
3. Should show: "⚠️ Not on a supported AI chat platform"
4. Button should be disabled

### Test 8.2: Network Issues
1. Disconnect internet
2. Try extraction
3. Should fail gracefully

### Test 8.3: Permission Denied
1. Remove host permissions from manifest
2. Reload extension
3. Should show appropriate error

---

## Test 9: File Output Quality

### JSON Validation:
```bash
# Use online JSON validator or:
python3 -m json.tool chatgpt-chat-*.json
# OR
cat chatgpt-chat-*.json | jq .
```

### Structure Validation:
All files should have:
```json
{
  "metadata": {
    "platform": string,
    "extractedAt": ISO8601 datetime,
    "url": string,
    "messageCount": number,
    "version": "1.0"
  },
  "conversation": [
    {
      "r": "u" | "a",  // compact mode
      "c": string
    }
    // OR
    {
      "role": "user" | "assistant",  // full mode
      "content": string,
      "timestamp": ISO8601 datetime  // optional
    }
  ]
}
```

---

## Test 10: Cross-Browser Testing

While built for Chrome, test in:

### Chromium-based Browsers:
- [ ] Microsoft Edge
- [ ] Brave
- [ ] Opera
- [ ] Vivaldi

### Expected:
Should work identically (uses Chromium engine)

### Not Supported:
- Firefox (different extension API)
- Safari (different extension system)

---

## Performance Benchmarks

### Target Metrics:

| Conversation Size | Extract Time | File Size (Compact) |
|------------------|--------------|---------------------|
| 10 messages | <1 second | ~4 KB |
| 20 messages | <2 seconds | ~8 KB |
| 50 messages | <5 seconds | ~20 KB |
| 100 messages | <10 seconds | ~40 KB |

### Memory Usage:
- Extension: <10 MB
- During extraction: <50 MB
- After extraction: <5 MB

---

## Debugging Tips

### Enable Developer Tools:

**Extension Console:**
1. Go to `chrome://extensions/`
2. Find AI Chat Extractor
3. Click "Inspect views: service worker" or "background page"

**Page Console:**
1. Right-click page → Inspect
2. Go to Console tab
3. Look for errors from content script

### Common Error Messages:

**"Cannot read property of undefined"**
- DOM selector mismatch
- Platform updated their HTML
- Check content.js selectors

**"Extension context invalidated"**
- Extension was reloaded mid-operation
- Reload the page and try again

**"No messages found"**
- Conversation not loaded
- Scroll to load all messages
- Check if selectors still work

### Debug Mode:
Add to content.js:
```javascript
const DEBUG = true;
function log(...args) {
  if (DEBUG) console.log('[AI Extractor]', ...args);
}
```

---

## Automated Testing (Future)

### Unit Tests:
```javascript
// Test platform detection
test('detects ChatGPT', () => {
  window.location.hostname = 'chat.openai.com';
  expect(detectPlatform().platform).toBe('chatgpt');
});

// Test extraction
test('extracts messages correctly', () => {
  // Mock DOM
  // Run extraction
  // Verify output
});
```

### Integration Tests:
- Playwright/Puppeteer to automate browser
- Visit actual AI platforms
- Extract conversations
- Verify outputs

---

## Test Report Template

```markdown
## Test Report - [Date]

**Tester:** [Name]
**Extension Version:** 1.0
**Chrome Version:** [Version]
**OS:** [Operating System]

### Tests Passed: X/10
### Tests Failed: Y/10

### Detailed Results:

#### Test 1: Installation
- Status: ✅ PASS
- Notes: No issues

#### Test 2: ChatGPT
- Status: ✅ PASS
- Messages extracted: 23
- File size: 11 KB
- Notes: All messages present

[Continue for all tests...]

### Issues Found:
1. [Description]
   - Severity: High/Medium/Low
   - Steps to reproduce
   - Expected vs Actual

### Recommendations:
- [Suggestions for improvements]
```

---

## Success Criteria

Extension is ready for use when:

- ✅ All 10 tests pass
- ✅ Works on all 3 platforms
- ✅ File size within targets
- ✅ No critical bugs
- ✅ Performance meets benchmarks
- ✅ JSON validates correctly
- ✅ Error handling works
- ✅ UI is responsive

---

## Next Steps After Testing

1. **Document Issues** - Create GitHub issues for bugs
2. **Update Code** - Fix critical problems
3. **Retest** - Verify fixes work
4. **User Testing** - Have others try it
5. **Iterate** - Improve based on feedback

---

## Reporting Bugs

When you find a bug, include:
1. **Platform:** ChatGPT/Claude/Gemini
2. **Browser:** Chrome version
3. **Steps to reproduce**
4. **Expected behavior**
5. **Actual behavior**
6. **Console errors** (if any)
7. **Screenshot** (if relevant)

---

Happy Testing! 🎉
