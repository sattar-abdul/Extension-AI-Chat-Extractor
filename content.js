function extractChatGPT() {
  const messages = [];
  let id = 1;

  // Chat message containers
  const nodes = document.querySelectorAll("div[class*='items-']");

  nodes.forEach((node) => {
    const text = node.innerText?.trim();
    if (!text) return;

    let role = null;

    if (node.className.includes("items-end")) {
      role = "user";
    } else if (node.className.includes("items-start")) {
      role = "assistant";
    } else {
      return;
    }

    text.split("\n\n").forEach((chunk) => {
      const clean = chunk.trim();
      if (!clean) return;

      messages.push({
        id: id++,
        role,
        content: clean,
      });
    });
  });

  return {
    platform: "chatgpt",
    extractedAt: new Date().toISOString(),
    messages,
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "EXTRACT_CHAT") {
    sendResponse(extractChatGPT());
  }
});
