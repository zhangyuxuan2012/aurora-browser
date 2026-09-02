// 极光快导 - 后台服务脚本

// ========== 安装时初始化 ==========
chrome.runtime.onInstalled.addListener(function (details) {
  // 初始化存储
  chrome.storage.sync.get(["blockerEnabled", "blockedCount"], function (result) {
    if (typeof result.blockerEnabled === "undefined") {
      chrome.storage.sync.set({ blockerEnabled: true });
    }
    if (typeof result.blockedCount === "undefined") {
      chrome.storage.sync.set({ blockedCount: 0 });
    }
  });

  // 创建右键菜单
  chrome.contextMenus.create({
    id: "aurora-open-sidepanel",
    title: "🌌 打开极光快导（分屏）",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "aurora-open-full-nav",
    title: "🔗 打开完整极光导航",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "aurora-separator",
    type: "separator",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "aurora-toggle-blocker",
    title: "🛡️ 防弹窗：已开启（点击切换）",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "aurora-clear-data",
    title: "🧹 清除浏览数据",
    contexts: ["all"],
  });

  // 安装通知
  if (details.reason === "install") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "极光快导已安装",
      message: "点击扩展图标打开菜单，或右键选择「打开极光快导（分屏）」体验左屏浏览右屏导航。",
      priority: 2,
    });
  }
});

// ========== 右键菜单点击 ==========
chrome.contextMenus.onClicked.addListener(function (info, tab) {
  switch (info.menuItemId) {
    case "aurora-open-sidepanel":
      openSidePanel(tab.windowId);
      break;

    case "aurora-open-full-nav":
      chrome.tabs.create({ url: "https://zhangyuxuan2012.github.io/zhangyuxuan/" });
      break;

    case "aurora-toggle-blocker":
      toggleBlocker();
      break;

    case "aurora-clear-data":
      clearBrowsingData();
      break;
  }
});

// ========== 打开分屏侧边栏 ==========
function openSidePanel(windowId) {
  try {
    chrome.sidePanel.open({ windowId: windowId });
  } catch (e) {
    // 如果 sidePanel API 不可用，用新窗口代替
    chrome.windows.create({
      url: "sidepanel.html",
      type: "popup",
      width: 360,
      height: 600,
    });
  }
}

// ========== 切换防弹窗 ==========
function toggleBlocker() {
  chrome.storage.sync.get(["blockerEnabled"], function (result) {
    var newState = result.blockerEnabled === false;
    chrome.storage.sync.set({ blockerEnabled: newState });

    // 更新右键菜单文字
    chrome.contextMenus.update("aurora-toggle-blocker", {
      title: newState ? "🛡️ 防弹窗：已开启（点击关闭）" : "🛡️ 防弹窗：已关闭（点击开启）",
    });

    // 通知所有标签页
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(function (tab) {
        chrome.tabs.sendMessage(tab.id, { type: "blockerToggle", enabled: newState }).catch(function () {});
      });
    });

    // 显示通知
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "极光防弹窗",
      message: newState ? "防弹窗已开启" : "防弹窗已关闭",
      priority: 1,
    });
  });
}

// ========== 清除浏览数据 ==========
function clearBrowsingData() {
  chrome.browsingData.remove(
    { since: 0 },
    {
      appcache: true,
      cache: true,
      cookies: true,
      downloads: true,
      formData: true,
      history: true,
      indexedDB: true,
      localStorage: true,
      passwords: true,
      serviceWorkers: true,
    },
    function () {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "极光快导",
        message: "🧹 浏览数据已清除",
        priority: 1,
      });
    }
  );
}

// ========== 监听扩展图标点击（如果没有popup，打开分屏） ==========
// 注意：因为 manifest 里设置了 default_popup，点击图标会打开 popup
// popup 里有"分屏导航"按钮，可以打开 sidePanel

// ========== 拦截计数变化时更新右键菜单 ==========
chrome.storage.onChanged.addListener(function (changes, area) {
  if (area === "sync" && changes.blockedCount) {
    var count = changes.blockedCount.newValue || 0;
    // 可以在这里更新扩展图标徽章
    try {
      chrome.action.setBadgeText({ text: count > 999 ? "999+" : String(count) });
      chrome.action.setBadgeBackgroundColor({ color: "#4caf50" });
    } catch (e) {}
  }
});

// ========== 命令快捷键 ==========
chrome.commands && chrome.commands.onCommand.addListener(function (command) {
  if (command === "open-sidepanel") {
    chrome.windows.getCurrent(function (win) {
      openSidePanel(win.id);
    });
  }
});

// ========== 网页截图（v1.1.0） ==========
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === "captureScreenshot") {
    try {
      chrome.tabs.captureVisibleTab(null, { format: "png" }, function (dataUrl) {
        if (chrome.runtime.lastError || !dataUrl) {
          sendResponse({ ok: false, error: (chrome.runtime.lastError && chrome.runtime.lastError.message) || "截图失败" });
          return;
        }
        var ts = new Date();
        var pad = function(n){return n<10?"0"+n:n;};
        var filename = "极光快导截图_" + ts.getFullYear() + pad(ts.getMonth()+1) + pad(ts.getDate()) + "_" + pad(ts.getHours()) + pad(ts.getMinutes()) + pad(ts.getSeconds()) + ".png";
        chrome.downloads.download({ url: dataUrl, filename: filename, saveAs: false }, function (downloadId) {
          if (chrome.runtime.lastError) {
            sendResponse({ ok: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ ok: true, downloadId: downloadId, filename: filename });
          }
        });
      });
    } catch (e) {
      sendResponse({ ok: false, error: e.message });
    }
    return true;
  }
});
