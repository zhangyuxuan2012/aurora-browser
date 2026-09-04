// 极光工具箱 - background service worker
// 消息路由、右键菜单、侧栏控制

// 打开侧栏（Chrome: sidePanel；Firefox: sidebarAction）
function openSidePanel(windowId) {
  try {
    if (typeof browser !== "undefined" && browser.sidebarAction && browser.sidebarAction.open) {
      // Firefox
      browser.sidebarAction.open();
    } else if (typeof chrome.sidePanel !== "undefined") {
      // Chrome/Edge
      chrome.sidePanel.setOptions({ enabled: true });
      if (windowId) {
        chrome.sidePanel.open({ windowId: windowId });
      }
    }
  } catch (e) {}
}

// 创建右键菜单
chrome.runtime.onInstalled.addListener(function () {
  try {
    chrome.contextMenus.removeAll(function () {
      chrome.contextMenus.create({
        id: "tk-translate",
        title: "🌐 翻译选中文字",
        contexts: ["selection"]
      });
      chrome.contextMenus.create({
        id: "tk-summarize",
        title: "📋 总结当前网页",
        contexts: ["page"]
      });
      chrome.contextMenus.create({
        id: "tk-compare",
        title: "⚖️ 加入比价",
        contexts: ["page"]
      });
    });
  } catch (e) {}
});

// 右键菜单点击
chrome.contextMenus.onClicked.addListener(function (info, tab) {
  try {
    if (info.menuItemId === "tk-translate" && info.selectionText) {
      chrome.windows.getCurrent(function (win) {
        openSidePanel(win.id);
        chrome.storage.local.set({ tk_pending: { type: "translate", text: info.selectionText } });
      });
    } else if (info.menuItemId === "tk-summarize") {
      chrome.windows.getCurrent(function (win) {
        openSidePanel(win.id);
        chrome.storage.local.set({ tk_pending: { type: "summarize" } });
        if (tab && tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: "tkGetPageText" }, function (resp) {
            if (resp && resp.ok) {
              chrome.storage.local.set({ tk_pending: { type: "summarize", text: resp.text, title: resp.title } });
            }
          });
        }
      });
    } else if (info.menuItemId === "tk-compare") {
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: "tkGetProduct" }, function (resp) {
          if (resp && resp.ok && resp.product) {
            addToCompare(resp.product);
          }
        });
      }
    }
  } catch (e) {}
});

// 比价列表管理
function addToCompare(product) {
  try {
    chrome.storage.local.get(["tk_compare_list"], function (result) {
      var list = result.tk_compare_list || [];
      if (product && product.price > 0) {
        if (!list.some(function (p) { return p.url === product.url; })) {
          list.push(product);
          if (list.length > 10) list = list.slice(0, 10);
          chrome.storage.local.set({ tk_compare_list: list });
        }
      }
    });
  } catch (e) {}
}

// 消息监听
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // 划词翻译
  if (message.type === "tkTranslate") {
    chrome.windows.getCurrent(function (win) {
      openSidePanel(win.id);
      chrome.storage.local.set({ tk_pending: { type: "translate", text: message.text } });
    });
    sendResponse({ ok: true });
    return true;
  }
  // 打开侧栏
  if (message.type === "tkOpenSidebar") {
    chrome.windows.getCurrent(function (win) {
      openSidePanel(win.id);
    });
    sendResponse({ ok: true });
    return true;
  }
  // 划词搜索
  if (message.type === "tkSearch") {
    chrome.storage.local.set({ tk_pending: { type: "search", text: message.text } });
    sendResponse({ ok: true });
    return true;
  }
  // 加入比价（来自 content 按钮）
  if (message.type === "tkAddCompare") {
    addToCompare(message.product);
    sendResponse({ ok: true });
    return true;
  }
  return false;
});
