// 极光工具箱 - content script
// 功能：商品价格识别、划词翻译浮窗、网页正文提取（供总结/翻译使用）

// ========== 商品价格识别 ==========
function extractProductInfo() {
  try {
    var title = "";
    var titleSelectors = ["h1", ".sku-name", ".tb-main-title", "#J_Title", ".tm-title",
      ".goods-name", ".product-title", ".item-title", ".title", "[class*=title]", "[class*=Title]"];
    for (var i = 0; i < titleSelectors.length; i++) {
      var el = document.querySelector(titleSelectors[i]);
      if (el && el.innerText && el.innerText.trim().length >= 4 && el.innerText.trim().length <= 200) {
        title = el.innerText.trim();
        break;
      }
    }
    if (!title) title = document.title || "未命名商品";
    title = title.replace(/[-_|].*?(淘宝|天猫|京东|拼多多|苏宁|国美|亚马逊|当当).*$/i, "").trim();
    if (title.length > 80) title = title.slice(0, 80) + "...";

    var price = extractPrice();
    var image = "";
    var imgSelectors = ["#J_ImgBooth", ".tb-booth img", "#spec-img", ".goods-img img", ".product-image img", "img[itemprop=image]"];
    for (var j = 0; j < imgSelectors.length; j++) {
      var img = document.querySelector(imgSelectors[j]);
      if (img && img.src) { image = img.src; break; }
    }

    return {
      title: title,
      price: price,
      priceText: price > 0 ? "¥" + price.toFixed(2) : "未识别",
      image: image,
      url: window.location.href,
      host: window.location.hostname,
      extractedAt: Date.now()
    };
  } catch (e) {
    return { title: document.title, price: 0, priceText: "识别失败", url: window.location.href, host: window.location.hostname };
  }
}

function extractPrice() {
  try {
    var prices = [];
    var priceSelectors = [".tm-price", ".tb-rmb-num", ".p-price .price", ".p-price",
      ".price", ".goods-price", ".product-price", ".item-price", "[class*=price]", "[class*=Price]", "[class*=rmb]", "[class*=Rmb]"];
    for (var i = 0; i < priceSelectors.length; i++) {
      var els = document.querySelectorAll(priceSelectors[i]);
      for (var j = 0; j < els.length; j++) {
        var text = els[j].innerText || els[j].textContent || "";
        var p = parsePriceText(text);
        if (p > 0 && p < 1000000) {
          var rect = els[j].getBoundingClientRect();
          var fontSize = parseFloat(window.getComputedStyle(els[j]).fontSize) || 14;
          var weight = fontSize * 10 + (rect.top < window.innerHeight * 0.5 ? 50 : 0);
          prices.push({ price: p, weight: weight });
        }
      }
    }
    var bodyText = document.body ? document.body.innerText : "";
    var priceRegex = /[¥￥$]\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*元/g;
    var match;
    while ((match = priceRegex.exec(bodyText)) !== null) {
      var p = parseFloat(match[1] || match[2]);
      if (p > 0 && p < 1000000) {
        prices.push({ price: p, weight: 5 });
      }
    }
    if (prices.length === 0) return 0;
    prices.sort(function (a, b) { return b.weight - a.weight; });
    var top3 = prices.slice(0, 3).map(function (x) { return x.price; }).sort(function (a, b) { return a - b; });
    return top3[Math.floor(top3.length / 2)];
  } catch (e) {
    return 0;
  }
}

function parsePriceText(text) {
  if (!text) return 0;
  var m = text.match(/[¥￥$]\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*元/);
  return m ? parseFloat(m[1] || m[2]) : 0;
}

// ========== 划词翻译浮窗 ==========
var translateFloat = null;
function showTranslateFloat(x, y, selectedText) {
  try {
    if (translateFloat) { translateFloat.remove(); translateFloat = null; }
    translateFloat = document.createElement("div");
    translateFloat.id = "aurora-tk-float";
    translateFloat.style.cssText = "position:fixed;left:" + Math.min(x, window.innerWidth - 180) + "px;top:" + (y + 8) + "px;z-index:2147483647;background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.15);font-size:12px;font-family:sans-serif;overflow:hidden;";
    translateFloat.innerHTML = '<button data-act="translate" style="background:#4285f4;color:#fff;border:none;padding:6px 12px;cursor:pointer;font-size:12px;">🌐 翻译</button>' +
      '<button data-act="search" style="background:#fff;color:#333;border:none;padding:6px 12px;cursor:pointer;font-size:12px;">🔍 搜索</button>';
    translateFloat.addEventListener("click", function (e) {
      var act = e.target.getAttribute("data-act");
      if (act === "translate") {
        chrome.runtime.sendMessage({ type: "tkTranslate", text: selectedText });
      } else if (act === "search") {
        chrome.runtime.sendMessage({ type: "tkOpenSidebar" });
        chrome.runtime.sendMessage({ type: "tkSearch", text: selectedText });
      }
      translateFloat.remove();
      translateFloat = null;
    });
    document.documentElement.appendChild(translateFloat);
  } catch (e) {}
}

document.addEventListener("mouseup", function (e) {
  try {
    var selected = window.getSelection();
    var text = selected ? selected.toString().trim() : "";
    if (text && text.length >= 2 && text.length <= 300) {
      // 忽略在扩展自己的浮窗内选择
      if (e.target && e.target.closest && e.target.closest("#aurora-tk-float, #aurora-tk-compare")) return;
      showTranslateFloat(e.clientX, e.clientY, text);
    } else if (translateFloat) {
      translateFloat.remove();
      translateFloat = null;
    }
  } catch (err) {}
});

document.addEventListener("mousedown", function (e) {
  try {
    if (e.target && e.target.closest && e.target.closest("#aurora-tk-float")) return;
    if (translateFloat && !e.target.closest("#aurora-tk-float")) {
      translateFloat.remove();
      translateFloat = null;
    }
  } catch (err) {}
});

// ========== 加入比价按钮 ==========
var compareBtn = null;
function maybeShowCompareButton() {
  try {
    var product = extractProductInfo();
    if (product.price <= 0) { if (compareBtn) { compareBtn.style.display = "none"; } return; }
    if (!compareBtn) {
      compareBtn = document.createElement("div");
      compareBtn.id = "aurora-tk-compare";
      compareBtn.style.cssText = "position:fixed;right:16px;bottom:80px;z-index:2147483646;background:linear-gradient(135deg,#ff6b35,#f7931e);color:#fff;padding:10px 16px;border-radius:24px;font-size:13px;font-family:sans-serif;cursor:pointer;box-shadow:0 4px 16px rgba(255,107,53,0.4);transition:transform 0.2s;user-select:none;";
      compareBtn.innerHTML = "⚖️ 加入比价";
      compareBtn.addEventListener("click", function () {
        try {
          chrome.runtime.sendMessage({ type: "tkAddCompare", product: extractProductInfo() });
          compareBtn.innerHTML = "✅ 已加入比价";
          setTimeout(function () { compareBtn.innerHTML = "⚖️ 加入比价"; }, 2000);
        } catch (e) {}
      });
      document.documentElement.appendChild(compareBtn);
    }
    compareBtn.style.display = "block";
  } catch (e) {}
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () { setTimeout(maybeShowCompareButton, 1500); });
} else {
  setTimeout(maybeShowCompareButton, 1500);
}

// ========== 消息监听 ==========
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === "tkGetProduct") {
    sendResponse({ ok: true, product: extractProductInfo() });
  } else if (message.type === "tkGetPageText") {
    // 提取页面正文（供总结/翻译）
    try {
      var paras = document.querySelectorAll("p");
      var texts = [];
      for (var i = 0; i < paras.length; i++) {
        var t = (paras[i].innerText || "").trim();
        if (t.length >= 10) texts.push(t);
      }
      if (texts.length === 0) {
        texts = [(document.body.innerText || "").trim().slice(0, 20000)];
      }
      var full = texts.join("\n").slice(0, 20000);
      sendResponse({ ok: true, text: full, title: document.title });
    } catch (e) {
      sendResponse({ ok: false, error: e.message });
    }
  }
  return false;
});
