// 极光快导 - 防弹窗内容脚本
// 在每个页面加载时注入，拦截广告弹窗、空白弹窗、图片直链弹窗

(function () {
  "use strict";

  // ========== 状态 ==========
  let blockerEnabled = true;
  let blockedCount = 0;

  // 从存储读取状态
  try {
    chrome.storage.sync.get(["blockerEnabled", "blockedCount"], function (result) {
      blockerEnabled = result.blockerEnabled !== false;
      blockedCount = result.blockedCount || 0;
    });
  } catch (e) {}

  // 监听状态变化
  try {
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area === "sync") {
        if (changes.blockerEnabled) {
          blockerEnabled = changes.blockerEnabled.newValue !== false;
        }
      }
    });

    // 监听来自 popup 的消息
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (message.type === "blockerToggle") {
        blockerEnabled = message.enabled;
        sendResponse({ ok: true });
      } else if (message.type === "getPageText") {
        // 提取页面正文文本（供"一键 AI 总结"使用）
        sendResponse({ ok: true, text: extractPageText() });
      } else if (message.type === "readerMode") {
        // 阅读模式：去广告纯净阅读
        toggleReaderMode();
        sendResponse({ ok: true });
      } else if (message.type === "darkModeToggle") {
        // 暗黑模式切换
        var dm = toggleDarkMode();
        sendResponse({ ok: true, enabled: dm });
      } else {
        sendResponse({ ok: true });
      }
      return false;
    });
  } catch (e) {}

  // 提取页面正文文本（优先取正文区域，其次全文）
  function extractPageText() {
    try {
      var text = "";
      var selectors = [
        "article", "main", '[role="main"]', "#content", ".content",
        ".article", ".post-content", ".entry-content", "#article", "#main-content",
      ];
      for (var i = 0; i < selectors.length; i++) {
        var el = document.querySelector(selectors[i]);
        if (el && el.innerText && el.innerText.length > text.length) {
          text = el.innerText;
        }
      }
      if (!text || text.length < 80) {
        text = document.body ? document.body.innerText : "";
      }
      // 限制最大长度，避免超长文本拖慢摘要
      if (text.length > 30000) text = text.slice(0, 30000);
      return text;
    } catch (e) {
      return "";
    }
  }

  // ========== 阅读模式（去广告纯净阅读） ==========
  var readerOverlay = null;
  function toggleReaderMode() {
    if (readerOverlay && readerOverlay.parentNode) {
      readerOverlay.parentNode.removeChild(readerOverlay);
      readerOverlay = null;
      document.body.style.overflow = "";
      return;
    }
    var text = extractPageText();
    if (!text || text.length < 50) {
      showReaderTip("当前页面内容过短，无法进入阅读模式。");
      return;
    }
    // 提取标题
    var title = document.title || "阅读模式";
    var h1 = document.querySelector("h1");
    if (h1 && h1.innerText) title = h1.innerText.trim();

    readerOverlay = document.createElement("div");
    readerOverlay.id = "aurora-reader-overlay";
    readerOverlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483646;overflow-y:auto;background:#fdf6e3;color:#333;font-family:'Georgia','Songti SC',serif;line-height:1.8;";
    readerOverlay.innerHTML =
      '<div style="max-width:720px;margin:0 auto;padding:40px 24px 80px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">' +
      '<span style="font-size:13px;color:#888;">📖 极光阅读模式</span>' +
      '<button id="aurora-reader-close" style="background:#eee;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;font-size:13px;">✕ 关闭</button>' +
      '</div>' +
      '<h1 style="font-size:26px;font-weight:700;margin-bottom:8px;line-height:1.4;">' + escapeHtml(title) + '</h1>' +
      '<div style="font-size:13px;color:#999;margin-bottom:32px;">' + window.location.hostname + '</div>' +
      '<div id="aurora-reader-content" style="font-size:17px;white-space:pre-wrap;word-break:break-word;"></div>' +
      '</div>';
    document.documentElement.appendChild(readerOverlay);
    document.getElementById("aurora-reader-content").textContent = text;
    document.getElementById("aurora-reader-close").addEventListener("click", function () {
      if (readerOverlay && readerOverlay.parentNode) {
        readerOverlay.parentNode.removeChild(readerOverlay);
        readerOverlay = null;
        document.body.style.overflow = "";
      }
    });
    document.body.style.overflow = "hidden";
    readerOverlay.scrollTop = 0;
  }

  function showReaderTip(msg) {
    var tip = document.createElement("div");
    tip.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:2147483647;background:rgba(20,20,40,0.95);color:#fff;padding:12px 24px;border-radius:10px;font-size:14px;font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.3);";
    tip.textContent = msg;
    document.documentElement.appendChild(tip);
    setTimeout(function () { if (tip.parentNode) tip.parentNode.removeChild(tip); }, 2500);
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  // ========== 暗黑模式 ==========
  var darkStyle = null;
  var darkEnabled = false;
  function toggleDarkMode() {
    darkEnabled = !darkEnabled;
    if (darkEnabled) {
      if (!darkStyle) {
        darkStyle = document.createElement("style");
        darkStyle.id = "aurora-dark-style";
        darkStyle.textContent =
          "html.aurora-dark-mode { filter: invert(1) hue-rotate(180deg); }" +
          "html.aurora-dark-mode img, html.aurora-dark-mode video, html.aurora-dark-mode iframe, html.aurora-dark-mode canvas, html.aurora-dark-mode svg, html.aurora-dark-mode [style*=background-image] { filter: invert(1) hue-rotate(180deg); }";
        document.head.appendChild(darkStyle);
      }
      document.documentElement.classList.add("aurora-dark-mode");
    } else {
      document.documentElement.classList.remove("aurora-dark-mode");
    }
    try { chrome.storage.sync.set({ darkModeEnabled: darkEnabled }); } catch (e) {}
    return darkEnabled;
  }

  // 页面加载时恢复暗黑模式状态
  try {
    chrome.storage.sync.get(["darkModeEnabled"], function (result) {
      if (result.darkModeEnabled) {
        darkEnabled = true;
        if (!darkStyle) {
          darkStyle = document.createElement("style");
          darkStyle.id = "aurora-dark-style";
          darkStyle.textContent =
            "html.aurora-dark-mode { filter: invert(1) hue-rotate(180deg); }" +
            "html.aurora-dark-mode img, html.aurora-dark-mode video, html.aurora-dark-mode iframe, html.aurora-dark-mode canvas, html.aurora-dark-mode svg { filter: invert(1) hue-rotate(180deg); }";
          document.head.appendChild(darkStyle);
        }
        document.documentElement.classList.add("aurora-dark-mode");
      }
    });
  } catch (e) {}

  // ========== 拦截计数 ==========
  function incrementBlocked(reason) {
    if (!blockerEnabled) return;
    blockedCount++;
    try {
      chrome.storage.sync.set({ blockedCount: blockedCount });
    } catch (e) {}
    // 在页面右上角显示拦截提示
    showBlockedTip(reason);
  }

  // 显示拦截提示
  function showBlockedTip(reason) {
    try {
      if (document.getElementById("aurora-blocked-tip")) return;
      var tip = document.createElement("div");
      tip.id = "aurora-blocked-tip";
      tip.style.cssText =
        "position:fixed;top:16px;right:16px;z-index:2147483647;" +
        "background:rgba(20,20,40,0.95);color:#4caf50;padding:10px 16px;" +
        "border-radius:10px;font-size:13px;font-family:sans-serif;" +
        "border:1px solid rgba(76,175,80,0.4);box-shadow:0 4px 20px rgba(0,0,0,0.3);" +
        "max-width:280px;line-height:1.5;backdrop-filter:blur(10px);";
      tip.innerHTML =
        '🛡️ <b>极光防弹窗</b><br>' +
        '<span style="color:#aabbcc;font-size:11px;">已拦截：' + (reason || "可疑弹窗") + "</span>";
      document.documentElement.appendChild(tip);
      setTimeout(function () {
        tip.style.transition = "opacity 0.5s, transform 0.5s";
        tip.style.opacity = "0";
        tip.style.transform = "translateY(-10px)";
        setTimeout(function () {
          if (tip.parentNode) tip.parentNode.removeChild(tip);
        }, 500);
      }, 2500);
    } catch (e) {}
  }

  // ========== 1. 重写 window.open ==========
  const originalOpen = window.open;
  window.open = function (url, name, specs, replace) {
    if (!blockerEnabled) {
      return originalOpen.apply(this, arguments);
    }

    // 白名单：用户主动点击的链接不拦截
    // 检查是否由用户手势触发
    var isUserGesture = false;
    try {
      if (window.event && window.event.isTrusted) {
        isUserGesture = true;
      }
    } catch (e) {}

    // 拦截空白弹窗（about:blank）
    if (!url || url === "about:blank" || url === "") {
      incrementBlocked("空白弹窗");
      return null;
    }

    // 拦截常见广告弹窗域名
    var adDomains = [
      "popads", "popcash", "propellerads", "adf.ly", "linkbucks",
      "shorte.st", "bc.vc", "ouo.io", "clkme", "shrinkme",
      "advertising", "doubleclick", "googlesyndication", "googleadservices",
    ];
    var urlLower = String(url).toLowerCase();
    for (var i = 0; i < adDomains.length; i++) {
      if (urlLower.indexOf(adDomains[i]) >= 0) {
        incrementBlocked("广告弹窗 (" + adDomains[i] + ")");
        return null;
      }
    }

    // 拦截图片直链弹窗（.jpg/.png/.gif 直接打开）
    if (/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(urlLower)) {
      // 检查是否是用户主动点击的图片链接
      if (!isUserGesture) {
        incrementBlocked("图片直链弹窗");
        return null;
      }
    }

    // 其他情况允许打开
    return originalOpen.apply(this, arguments);
  };

  // ========== 2. 拦截自动创建的 iframe 弹窗 ==========
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = function (tagName) {
    var element = originalCreateElement(tagName);

    if (blockerEnabled && tagName && tagName.toLowerCase() === "iframe") {
      // 监控 iframe 的 src 设置
      var srcSetter = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "src");
      if (srcSetter && srcSetter.set) {
        var originalSrcSet = srcSetter.set;
        Object.defineProperty(element, "src", {
          set: function (value) {
            if (blockerEnabled && value) {
              var valLower = String(value).toLowerCase();
              // 拦截广告 iframe
              var adIframePatterns = [
                "popads", "popcash", "propellerads", "doubleclick",
                "googlesyndication", "googleadservices", "advertising",
              ];
              for (var i = 0; i < adIframePatterns.length; i++) {
                if (valLower.indexOf(adIframePatterns[i]) >= 0) {
                  incrementBlocked("广告 iframe (" + adIframePatterns[i] + ")");
                  return;
                }
              }
            }
            originalSrcSet.call(this, value);
          },
          get: srcSetter.get,
          configurable: true,
        });
      }
    }

    return element;
  };

  // ========== 3. 拦截可疑的页面跳转 ==========
  let lastNavigationTime = 0;
  const originalLocationAssign = location.assign.bind(location);
  const originalLocationReplace = location.replace.bind(location);

  location.assign = function (url) {
    if (blockerEnabled) {
      var now = Date.now();
      // 页面加载后3秒内的自动跳转可能是可疑跳转
      if (now - lastNavigationTime < 3000 && !isUserNavigation()) {
        var urlLower = String(url).toLowerCase();
        var suspiciousPatterns = ["popads", "popcash", "propellerads", "adf.ly", "linkbucks"];
        for (var i = 0; i < suspiciousPatterns.length; i++) {
          if (urlLower.indexOf(suspiciousPatterns[i]) >= 0) {
            incrementBlocked("可疑跳转 (" + suspiciousPatterns[i] + ")");
            return;
          }
        }
      }
    }
    lastNavigationTime = Date.now();
    return originalLocationAssign(url);
  };

  location.replace = function (url) {
    if (blockerEnabled) {
      var now = Date.now();
      if (now - lastNavigationTime < 3000 && !isUserNavigation()) {
        var urlLower = String(url).toLowerCase();
        var suspiciousPatterns = ["popads", "popcash", "propellerads", "adf.ly", "linkbucks"];
        for (var i = 0; i < suspiciousPatterns.length; i++) {
          if (urlLower.indexOf(suspiciousPatterns[i]) >= 0) {
            incrementBlocked("可疑跳转 (" + suspiciousPatterns[i] + ")");
            return;
          }
        }
      }
    }
    lastNavigationTime = Date.now();
    return originalLocationReplace(url);
  };

  // 检查是否是用户主动导航
  function isUserNavigation() {
    try {
      if (window.event && window.event.isTrusted) return true;
      // 检查是否有用户交互
      var activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "A" || activeEl.tagName === "BUTTON")) {
        return true;
      }
    } catch (e) {}
    return false;
  }

  // ========== 4. 拦截 alert/confirm/prompt 弹窗（可选，默认不拦截） ==========
  // 保留原生弹窗，不拦截，因为很多网站正常使用

  // ========== 5. 页面加载完成后清理遗留的弹窗元素 ==========
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cleanupPopups);
  } else {
    cleanupPopups();
  }

  function cleanupPopups() {
    if (!blockerEnabled) return;
    try {
      // 查找并移除常见的弹窗遮罩层
      var popupSelectors = [
        ".ad-popup", ".advert-popup", ".pop-ad", ".ad-pop",
        "[class*='popup-ad']", "[id*='popup-ad']",
        "[class*='ad-popup']", "[id*='ad-popup']",
      ];
      popupSelectors.forEach(function (selector) {
        var elements = document.querySelectorAll(selector);
        elements.forEach(function (el) {
          // 只移除明显是广告的弹窗（包含广告关键词或尺寸异常）
          var text = el.textContent.toLowerCase();
          var adKeywords = ["广告", "推广", "ad", "advertisement", "promo", "sponsor"];
          var hasAdKeyword = adKeywords.some(function (kw) {
            return text.indexOf(kw) >= 0;
          });
          var isFullScreen = el.offsetWidth >= window.innerWidth * 0.8 && el.offsetHeight >= window.innerHeight * 0.8;
          if (hasAdKeyword && isFullScreen) {
            el.style.display = "none";
            incrementBlocked("广告遮罩层");
          }
        });
      });
    } catch (e) {}
  }

  // 初始化导航时间
  lastNavigationTime = Date.now();
})();
