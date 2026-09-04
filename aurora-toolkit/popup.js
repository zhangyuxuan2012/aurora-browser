// 极光工具箱 - 弹窗逻辑
function openSidePanel() {
  try {
    if (typeof browser !== "undefined" && browser.sidebarAction && browser.sidebarAction.open) {
      browser.sidebarAction.open();
    } else if (typeof chrome.sidePanel !== "undefined") {
      chrome.windows.getCurrent(function (win) {
        chrome.sidePanel.open({ windowId: win.id });
      });
    }
  } catch (e) {}
}

document.getElementById("open-panel").addEventListener("click", function () {
  openSidePanel();
  window.close();
});

document.getElementById("btn-summarize").addEventListener("click", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: "tkGetPageText" }, function (resp) {
      if (resp && resp.ok && resp.text) {
        chrome.storage.local.set({ tk_pending: { type: "summarize", text: resp.text, title: resp.title } });
        openSidePanel();
      }
    });
  });
  window.close();
});

document.getElementById("btn-translate").addEventListener("click", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: "tkGetPageText" }, function (resp) {
      if (resp && resp.ok && resp.text) {
        // 取前5000字符用于翻译
        chrome.storage.local.set({ tk_pending: { type: "translatePage", text: resp.text.slice(0, 5000), title: resp.title } });
        openSidePanel();
      }
    });
  });
  window.close();
});

document.getElementById("btn-compare").addEventListener("click", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: "tkGetProduct" }, function (resp) {
      if (resp && resp.ok && resp.product) {
        chrome.runtime.sendMessage({ type: "tkAddCompare", product: resp.product });
      }
    });
  });
  window.close();
});
