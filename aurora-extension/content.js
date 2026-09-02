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
      } else if (message.type === "saveForLater") {
        // 保存当前页到稍后阅读
        var item = {
          title: document.title || "未命名",
          url: window.location.href,
          text: extractPageText().slice(0, 500),
          savedAt: Date.now()
        };
        sendResponse({ ok: true, item: item });
      } else if (message.type === "searchSelection") {
        // 划词查询：在侧栏打开搜索
        try {
          chrome.runtime.sendMessage({ type: "openSidebarSearch", text: message.text });
        } catch (e) {}
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: true });
      }
      return false;
    });
  } catch (e) {}

  // 智能正文提取：优先正文容器，提取段落过滤噪音
  function extractPageText() {
    try {
      var container = findMainContainer();
      var paragraphs = container ? container.querySelectorAll("p") : document.querySelectorAll("p");
      var texts = [];
      for (var i = 0; i < paragraphs.length; i++) {
        var p = paragraphs[i];
        var t = (p.innerText || p.textContent || "").trim();
        // 过滤过短段落（导航/页脚/广告通常短）和含广告关键词的段落
        if (t.length >= 20 && !isAdText(t)) {
          texts.push(t);
        }
      }
      var text = texts.join("\n\n");
      if (text.length < 80) {
        // 兜底：用正文容器 innerText
        text = container ? (container.innerText || "") : (document.body ? document.body.innerText : "");
      }
      if (text.length > 30000) text = text.slice(0, 30000);
      return text;
    } catch (e) {
      return "";
    }
  }

  // 查找主内容容器（评分制：文本密度高、段落多）
  function findMainContainer() {
    try {
      var candidates = document.querySelectorAll("article, main, [role=main], #content, .content, .article, .post-content, .entry-content, #article, #main-content");
      var best = null, bestScore = 0;
      for (var i = 0; i < candidates.length; i++) {
        var el = candidates[i];
        var ps = el.querySelectorAll("p");
        var textLen = (el.innerText || "").length;
        var score = ps.length * 10 + textLen / 100;
        if (score > bestScore) { bestScore = score; best = el; }
      }
      return best;
    } catch (e) { return null; }
  }

  function isAdText(t) {
    var adKw = ["广告", "推广", "赞助", "点击下载", "扫码关注", "免责声明", "版权所有", "推荐阅读", "相关推荐"];
    for (var i = 0; i < adKw.length; i++) {
      if (t.indexOf(adKw[i]) >= 0 && t.length < 100) return true;
    }
    return false;
  }

  // 提取文章标题列表（用于目录）
  function extractHeadings() {
    try {
      var container = findMainContainer() || document;
      var hs = container.querySelectorAll("h1, h2, h3");
      var list = [];
      for (var i = 0; i < hs.length; i++) {
        var h = hs[i];
        var text = (h.innerText || h.textContent || "").trim();
        if (text && text.length < 100) {
          list.push({ level: parseInt(h.tagName[1]), text: text, id: "aurora-h-" + i });
        }
      }
      return list;
    } catch (e) { return []; }
  }

  // ========== 阅读模式 2.0（沉浸式阅读） ==========
  var readerOverlay = null;
  var readerSettings = { fontSize: 18, lineHeight: 1.8, width: 720, theme: "sepia" };
  var readerThemes = {
    sepia:  { bg: "#fdf6e3", text: "#333",     accent: "#b58900" },
    light:  { bg: "#ffffff", text: "#222",     accent: "#1a73e8" },
    dark:   { bg: "#1a1a2e", text: "#c8c8d0",  accent: "#7c6ff0" },
    gray:   { bg: "#2d2d2d", text: "#d0d0d0",  accent: "#888" }
  };

  function toggleReaderMode() {
    if (readerOverlay && readerOverlay.parentNode) {
      closeReaderMode();
      return;
    }
    openReaderMode();
  }

  function openReaderMode() {
    var text = extractPageText();
    if (!text || text.length < 50) {
      showReaderTip("当前页面内容过短，无法进入阅读模式。");
      return;
    }
    var title = document.title || "阅读模式";
    var h1 = document.querySelector("h1");
    if (h1 && h1.innerText) title = h1.innerText.trim();
    var headings = extractHeadings();
    var th = readerThemes[readerSettings.theme];

    readerOverlay = document.createElement("div");
    readerOverlay.id = "aurora-reader-overlay";
    readerOverlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483646;overflow-y:auto;background:" + th.bg + ";color:" + th.text + ";font-family:'Georgia','Songti SC',serif;transition:background 0.3s,color 0.3s;";

    // 阅读进度条
    var progressBar = '<div id="aurora-reader-progress" style="position:fixed;top:0;left:0;height:3px;background:' + th.accent + ';width:0%;z-index:2147483647;transition:width 0.1s;"></div>';

    // 顶部工具栏
    var toolbar = '<div style="position:sticky;top:0;z-index:10;background:' + th.bg + ';padding:12px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(128,128,128,0.2);">' +
      '<span style="font-size:13px;opacity:0.7;">📖 极光阅读模式</span>' +
      '<div style="display:flex;gap:6px;align-items:center;">' +
      '<button class="aurora-r-btn" data-action="font-minus" title="减小字体">A-</button>' +
      '<button class="aurora-r-btn" data-action="font-plus" title="增大字体">A+</button>' +
      '<button class="aurora-r-btn" data-action="theme" title="切换主题">🎨</button>' +
      '<button class="aurora-r-btn" data-action="toc" title="文章目录">📑</button>' +
      '<button class="aurora-r-btn" data-action="close" title="关闭 (ESC)">✕</button>' +
      '</div></div>';

    // 目录面板
    var tocHtml = '<div id="aurora-reader-toc" style="position:fixed;top:50px;right:20px;width:240px;max-height:70vh;overflow-y:auto;background:' + th.bg + ';border:1px solid rgba(128,128,128,0.3);border-radius:10px;padding:14px;z-index:2147483646;display:none;box-shadow:0 4px 20px rgba(0,0,0,0.2);">' +
      '<div style="font-size:13px;font-weight:600;margin-bottom:10px;opacity:0.8;">📑 文章目录</div>';
    if (headings.length > 0) {
      for (var i = 0; i < headings.length; i++) {
        var h = headings[i];
        tocHtml += '<div class="aurora-toc-item" data-idx="' + i + '" style="padding:5px 0;padding-left:' + ((h.level - 1) * 12) + 'px;font-size:' + (13 - (h.level - 1)) + 'px;cursor:pointer;opacity:0.75;border-bottom:1px solid rgba(128,128,128,0.1);">' + escapeHtml(h.text) + '</div>';
      }
    } else {
      tocHtml += '<div style="font-size:12px;opacity:0.5;">本文无标题目录</div>';
    }
    tocHtml += '</div>';

    // 正文区
    var bodyHtml = '<div id="aurora-reader-body" style="max-width:' + readerSettings.width + 'px;margin:0 auto;padding:32px 24px 80px;">' +
      '<h1 id="aurora-reader-title" style="font-size:' + (readerSettings.fontSize + 8) + 'px;font-weight:700;margin-bottom:8px;line-height:1.4;">' + escapeHtml(title) + '</h1>' +
      '<div style="font-size:13px;opacity:0.5;margin-bottom:28px;">' + window.location.hostname + ' · ' + text.length + ' 字</div>' +
      '<div id="aurora-reader-content" style="font-size:' + readerSettings.fontSize + 'px;line-height:' + readerSettings.lineHeight + ';white-space:pre-wrap;word-break:break-word;"></div>' +
      '</div>';

    readerOverlay.innerHTML = progressBar + toolbar + tocHtml + bodyHtml;
    document.documentElement.appendChild(readerOverlay);
    document.getElementById("aurora-reader-content").textContent = text;
    document.body.style.overflow = "hidden";
    readerOverlay.scrollTop = 0;

    // 绑定工具栏事件
    var btns = readerOverlay.querySelectorAll(".aurora-r-btn");
    for (var j = 0; j < btns.length; j++) {
      btns[j].addEventListener("click", function (e) {
        var action = this.getAttribute("data-action");
        handleReaderAction(action);
      });
    }
    // 目录点击
    var tocItems = readerOverlay.querySelectorAll(".aurora-toc-item");
    for (var k = 0; k < tocItems.length; k++) {
      tocItems[k].addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-idx"));
        scrollToHeading(idx);
      });
    }
    // 滚动进度
    readerOverlay.addEventListener("scroll", updateReaderProgress);
    // ESC 关闭
    document.addEventListener("keydown", readerKeyHandler);
  }

  function handleReaderAction(action) {
    if (action === "close") { closeReaderMode(); return; }
    if (action === "font-minus") { readerSettings.fontSize = Math.max(14, readerSettings.fontSize - 2); }
    if (action === "font-plus") { readerSettings.fontSize = Math.min(28, readerSettings.fontSize + 2); }
    if (action === "theme") {
      var keys = Object.keys(readerThemes);
      var cur = keys.indexOf(readerSettings.theme);
      readerSettings.theme = keys[(cur + 1) % keys.length];
    }
    if (action === "toc") {
      var toc = document.getElementById("aurora-reader-toc");
      if (toc) toc.style.display = toc.style.display === "none" ? "block" : "none";
      return;
    }
    applyReaderSettings();
  }

  function applyReaderSettings() {
    if (!readerOverlay) return;
    var th = readerThemes[readerSettings.theme];
    readerOverlay.style.background = th.bg;
    readerOverlay.style.color = th.text;
    var content = document.getElementById("aurora-reader-content");
    if (content) { content.style.fontSize = readerSettings.fontSize + "px"; content.style.lineHeight = readerSettings.lineHeight; }
    var title = document.getElementById("aurora-reader-title");
    if (title) title.style.fontSize = (readerSettings.fontSize + 8) + "px";
    var body = document.getElementById("aurora-reader-body");
    if (body) body.style.maxWidth = readerSettings.width + "px";
    var progress = document.getElementById("aurora-reader-progress");
    if (progress) progress.style.background = th.accent;
  }

  function scrollToHeading(idx) {
    if (!readerOverlay) return;
    var content = document.getElementById("aurora-reader-content");
    if (!content) return;
    // 简单估算：按标题在正文中的位置滚动
    var headings = extractHeadings();
    if (idx >= headings.length) return;
    var text = content.textContent || "";
    var pos = text.indexOf(headings[idx].text);
    if (pos >= 0) {
      var ratio = pos / text.length;
      readerOverlay.scrollTop = ratio * (readerOverlay.scrollHeight - readerOverlay.clientHeight);
    }
    var toc = document.getElementById("aurora-reader-toc");
    if (toc) toc.style.display = "none";
  }

  function updateReaderProgress() {
    if (!readerOverlay) return;
    var progress = document.getElementById("aurora-reader-progress");
    if (!progress) return;
    var scrollTop = readerOverlay.scrollTop;
    var scrollHeight = readerOverlay.scrollHeight - readerOverlay.clientHeight;
    var pct = scrollHeight > 0 ? (scrollTop / scrollHeight * 100) : 0;
    progress.style.width = pct + "%";
  }

  function readerKeyHandler(e) {
    if (e.key === "Escape") closeReaderMode();
    if (e.key === "+" || e.key === "=") { readerSettings.fontSize = Math.min(28, readerSettings.fontSize + 2); applyReaderSettings(); }
    if (e.key === "-") { readerSettings.fontSize = Math.max(14, readerSettings.fontSize - 2); applyReaderSettings(); }
  }

  function closeReaderMode() {
    if (readerOverlay && readerOverlay.parentNode) {
      readerOverlay.parentNode.removeChild(readerOverlay);
    }
    readerOverlay = null;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", readerKeyHandler);
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
          "html.aurora-dark-mode img, html.aurora-dark-mode video, html.aurora-dark-mode iframe, html.aurora-dark-mode canvas, html.aurora-dark-mode svg { filter: invert(1) hue-rotate(180deg); }" +
          "html.aurora-dark-mode * { background-image: none !important; }";
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

  // ========== 划词查询（高效导航核心） ==========
  var selectionPopup = null;
  document.addEventListener("mouseup", function (e) {
    try {
      var sel = window.getSelection();
      var text = sel ? sel.toString().trim() : "";
      if (text && text.length >= 2 && text.length <= 100) {
        showSelectionPopup(e.clientX, e.clientY, text);
      } else {
        hideSelectionPopup();
      }
    } catch (err) {}
  });

  document.addEventListener("mousedown", function (e) {
    if (selectionPopup && !selectionPopup.contains(e.target)) {
      hideSelectionPopup();
    }
  });

  function showSelectionPopup(x, y, text) {
    hideSelectionPopup();
    selectionPopup = document.createElement("div");
    selectionPopup.style.cssText = "position:fixed;z-index:2147483647;background:#202124;color:#fff;padding:6px 10px;border-radius:8px;font-size:12px;font-family:sans-serif;box-shadow:0 2px 10px rgba(0,0,0,0.3);display:flex;gap:8px;align-items:center;";
    selectionPopup.innerHTML =
      '<span style="opacity:0.7;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(text.slice(0, 20)) + '</span>' +
      '<button id="aurora-sel-search" style="background:#1a73e8;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:12px;">🔍 查询</button>' +
      '<button id="aurora-sel-copy" style="background:#3c4043;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:12px;">复制</button>';
    document.documentElement.appendChild(selectionPopup);
    // 定位（避免超出视口）
    var pw = selectionPopup.offsetWidth, ph = selectionPopup.offsetHeight;
    var left = Math.min(x, window.innerWidth - pw - 10);
    var top = y + 10;
    if (top + ph > window.innerHeight) top = y - ph - 10;
    selectionPopup.style.left = left + "px";
    selectionPopup.style.top = top + "px";
    document.getElementById("aurora-sel-search").addEventListener("click", function () {
      try {
        chrome.runtime.sendMessage({ type: "searchSelection", text: text });
      } catch (e) {}
      hideSelectionPopup();
    });
    document.getElementById("aurora-sel-copy").addEventListener("click", function () {
      navigator.clipboard.writeText(text);
      hideSelectionPopup();
    });
  }

  function hideSelectionPopup() {
    if (selectionPopup && selectionPopup.parentNode) {
      selectionPopup.parentNode.removeChild(selectionPopup);
    }
    selectionPopup = null;
  }

  // ========== 稍后阅读：提供保存接口 ==========
  // 在消息监听里加 saveForLater
})();
