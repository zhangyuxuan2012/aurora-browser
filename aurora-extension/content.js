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
      }
      sendResponse({ ok: true });
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
