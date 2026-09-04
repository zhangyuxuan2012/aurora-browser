// 极光工具箱 - 侧栏逻辑
// 三大功能：网页总结 / 中英翻译 / 商品比价

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ========== Tab 切换 ==========
document.querySelectorAll(".tk-tab").forEach(function (tab) {
  tab.addEventListener("click", function () {
    document.querySelectorAll(".tk-tab").forEach(function (t) { t.classList.remove("active"); });
    document.querySelectorAll(".tk-panel").forEach(function (p) { p.classList.remove("active"); });
    tab.classList.add("active");
    document.getElementById("panel-" + tab.getAttribute("data-panel")).classList.add("active");
  });
});

// ========== 网页总结 ==========
var summarizeBtn = document.getElementById("btn-summarize");
var summaryList = document.getElementById("summaryList");
if (summarizeBtn) {
  summarizeBtn.addEventListener("click", function () {
    summaryList.innerHTML = '<div class="tk-loading">⏳ 正在提取网页内容...</div>';
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: "tkGetPageText" }, function (resp) {
        if (resp && resp.ok && resp.text) {
          var texts = resp.text.split("\n").filter(function (s) { return s.trim().length >= 20; });
          var result = window.AuroraSummarizer.generateSummary(texts, 5);
          if (result.error) {
            summaryList.innerHTML = '<div class="tk-summary-empty">' + escapeHtml(result.error) + '</div>';
            return;
          }
          var html = '<div style="font-size:12px;color:#888;margin-bottom:8px;">📄 ' + escapeHtml(resp.title) + '</div>';
          result.summary.forEach(function (s) {
            html += '<div class="tk-summary-item">' + escapeHtml(s) + '</div>';
          });
          summaryList.innerHTML = html;
        } else {
          summaryList.innerHTML = '<div class="tk-summary-empty">未能读取当前页内容，请刷新后重试</div>';
        }
      });
    });
  });
}

// ========== 中英翻译 ==========
var translateInput = document.getElementById("translateInput");
var translateResult = document.getElementById("translateResult");
var translateResultText = document.getElementById("translateResultText");

function doTranslate(mode) {
  var text = translateInput.value.trim();
  if (!text) return;
  translateResult.style.display = "block";
  translateResultText.innerHTML = '<div class="tk-loading">⏳ 翻译中...</div>';
  var promise;
  if (mode === "zh2en") {
    promise = window.AuroraTranslator.translateText(text, "en");
  } else if (mode === "en2zh") {
    promise = window.AuroraTranslator.translateText(text, "zh-CN");
  } else {
    promise = window.AuroraTranslator.autoTranslate(text);
  }
  promise.then(function (result) {
    translateResultText.textContent = result;
  }).catch(function (e) {
    translateResultText.textContent = "翻译失败：" + e.message;
  });
}

var btnAuto = document.getElementById("btn-translate-auto");
var btnZh = document.getElementById("btn-translate-zh");
var btnEn = document.getElementById("btn-translate-en");
if (btnAuto) btnAuto.addEventListener("click", function () { doTranslate("auto"); });
if (btnZh) btnZh.addEventListener("click", function () { doTranslate("zh2en"); });
if (btnEn) btnEn.addEventListener("click", function () { doTranslate("en2zh"); });

// ========== 商品比价 ==========
var COMPARE_KEY = "tk_compare_list";
function loadCompareList(cb) {
  try {
    chrome.storage.local.get([COMPARE_KEY], function (result) { cb(result[COMPARE_KEY] || []); });
  } catch (e) { cb([]); }
}
function saveCompareList(list) {
  var obj = {}; obj[COMPARE_KEY] = list;
  chrome.storage.local.set(obj);
}
function renderCompareList() {
  var listEl = document.getElementById("compareList");
  var summaryEl = document.getElementById("compareSummary");
  if (!listEl) return;
  loadCompareList(function (list) {
    if (!list || list.length === 0) {
      listEl.innerHTML = '<span class="tk-compare-empty">在商品页点"⚖️ 加入比价"，或点"➕ 当前页"添加</span>';
      if (summaryEl) summaryEl.style.display = "none";
      return;
    }
    var sorted = list.slice().sort(function (a, b) { return a.price - b.price; });
    var minPrice = sorted[0].price;
    var maxPrice = sorted[sorted.length - 1].price;
    var diff = maxPrice - minPrice;

    if (summaryEl && list.length >= 2) {
      var cheapest = sorted[0];
      var pct = diff / maxPrice * 100;
      summaryEl.style.display = "block";
      summaryEl.innerHTML =
        '<div class="tk-compare-best">🏆 最便宜：' + escapeHtml(cheapest.title.slice(0, 20)) + '（¥' + cheapest.price.toFixed(2) + '）</div>' +
        '<div class="tk-compare-diff">比最贵的便宜 ¥' + diff.toFixed(2) + '（' + pct.toFixed(1) + '%）</div>';
    } else if (summaryEl) {
      summaryEl.style.display = "none";
    }

    listEl.innerHTML = "";
    sorted.forEach(function (item, idx) {
      var div = document.createElement("div");
      div.className = "tk-compare-item" + (item.price === minPrice && list.length >= 2 ? " best" : "");
      var badge = idx === 0 && list.length >= 2 ? '<span class="tk-compare-badge">最便宜</span>' : "";
      div.innerHTML =
        '<div class="tk-compare-title">' + badge + escapeHtml(item.title) + '</div>' +
        '<div class="tk-compare-meta">' + escapeHtml(item.host) + '</div>' +
        '<div class="tk-compare-price">¥' + item.price.toFixed(2) + '</div>' +
        '<div class="tk-compare-btns">' +
        '<button class="tk-open-btn" data-url="' + escapeHtml(item.url) + '">打开</button>' +
        '<button class="tk-del-btn" data-url="' + escapeHtml(item.url) + '">删除</button>' +
        '</div>';
      listEl.appendChild(div);
    });

    listEl.querySelectorAll(".tk-open-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs[0]) chrome.tabs.update(tabs[0].id, { url: this.getAttribute("data-url") });
        }.bind(this));
      });
    });
    listEl.querySelectorAll(".tk-del-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var url = this.getAttribute("data-url");
        loadCompareList(function (list) {
          var filtered = list.filter(function (i) { return i.url !== url; });
          saveCompareList(filtered);
          renderCompareList();
        });
      });
    });
  });
}

var addBtn = document.getElementById("btn-compare-add");
if (addBtn) {
  addBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: "tkGetProduct" }, function (resp) {
        if (resp && resp.ok && resp.product && resp.product.price > 0) {
          loadCompareList(function (list) {
            if (!list.some(function (p) { return p.url === resp.product.url; })) {
              list.push(resp.product);
              if (list.length > 10) list = list.slice(0, 10);
              saveCompareList(list);
              renderCompareList();
            }
          });
        }
      });
    });
  });
}
var clearBtn = document.getElementById("btn-compare-clear");
if (clearBtn) {
  clearBtn.addEventListener("click", function () {
    saveCompareList([]);
    renderCompareList();
  });
}
renderCompareList();

// ========== 处理待处理任务（来自右键菜单/划词） ==========
function handlePending() {
  chrome.storage.local.get(["tk_pending"], function (result) {
    var pending = result.tk_pending;
    if (!pending) return;
    chrome.storage.local.remove("tk_pending");
    if (pending.type === "translate") {
      document.querySelector('[data-panel="translate"]').click();
      translateInput.value = pending.text;
      doTranslate("auto");
    } else if (pending.type === "summarize") {
      document.querySelector('[data-panel="summary"]').click();
      if (pending.text) {
        var texts = pending.text.split("\n").filter(function (s) { return s.trim().length >= 20; });
        var result = window.AuroraSummarizer.generateSummary(texts, 5);
        if (!result.error) {
          var html = '<div style="font-size:12px;color:#888;margin-bottom:8px;">📄 ' + escapeHtml(pending.title || "") + '</div>';
          result.summary.forEach(function (s) { html += '<div class="tk-summary-item">' + escapeHtml(s) + '</div>'; });
          summaryList.innerHTML = html;
        }
      } else {
        summarizeBtn.click();
      }
    } else if (pending.type === "translatePage") {
      document.querySelector('[data-panel="translate"]').click();
      // 整页翻译：取正文前后段各500字
      var pageText = pending.text || "";
      var preview = pageText.slice(0, 1000) + (pageText.length > 1000 ? "\n...(以下省略)..." : "");
      translateInput.value = preview;
      doTranslate("auto");
    } else if (pending.type === "search") {
      var q = encodeURIComponent(pending.text);
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) chrome.tabs.update(tabs[0].id, { url: "https://www.baidu.com/s?wd=" + q });
      });
    }
  });
}
setTimeout(handlePending, 300);
