let extractedData = null;

document.getElementById("extract").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_CHAT" }, (response) => {
    extractedData = response;
    document.getElementById("output").textContent = JSON.stringify(
      response,
      null,
      2
    );
  });
};

document.getElementById("download").onclick = () => {
  if (!extractedData) return;

  const blob = new Blob([JSON.stringify(extractedData, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "chat-context.json";
  a.click();
};
