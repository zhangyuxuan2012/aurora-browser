// 极光快导 - 分屏导航逻辑

// ========== 网站数据（与 popup.js 同步） ==========
const SITES = {
  "常用": [
    { name: "百度", url: "https://www.baidu.com", icon: "🔍" },
    { name: "谷歌", url: "https://www.google.com", icon: "🌐" },
    { name: "B站", url: "https://www.bilibili.com", icon: "📺" },
    { name: "知乎", url: "https://www.zhihu.com", icon: "💡" },
    { name: "微博", url: "https://weibo.com", icon: "📱" },
    { name: "淘宝", url: "https://www.taobao.com", icon: "🛒" },
    { name: "京东", url: "https://www.jd.com", icon: "📦" },
    { name: "抖音", url: "https://www.douyin.com", icon: "🎵" },  ],
  "视频": [
    { name: "优酷", url: "https://www.youku.com", icon: "🎬" },
    { name: "爱奇艺", url: "https://www.iqiyi.com", icon: "🎞️" },
    { name: "腾讯视频", url: "https://v.qq.com", icon: "🎥" },
    { name: "芒果TV", url: "https://www.mgtv.com", icon: "🥭" },
    { name: "Netflix", url: "https://www.netflix.com", icon: "🎬" },
    { name: "YouTube", url: "https://www.youtube.com", icon: "▶️" },
  ],
  "社交": [
    { name: "小红书", url: "https://www.xiaohongshu.com", icon: "📕" },
    { name: "豆瓣", url: "https://www.douban.com", icon: "🎭" },
    { name: "贴吧", url: "https://tieba.baidu.com", icon: "💬" },
    { name: "QQ空间", url: "https://qzone.qq.com", icon: "⭐" },
    { name: "Twitter", url: "https://twitter.com", icon: "🐦" },
    { name: "Instagram", url: "https://www.instagram.com", icon: "📷" },
  ],
  "购物": [
    { name: "天猫", url: "https://www.tmall.com", icon: "🐱" },
    { name: "拼多多", url: "https://www.pinduoduo.com", icon: "🍎" },
    { name: "苏宁", url: "https://www.suning.com", icon: "🏪" },
    { name: "唯品会", url: "https://www.vip.com", icon: "👗" },
    { name: "当当", url: "https://www.dangdang.com", icon: "📚" },
    { name: "Amazon", url: "https://www.amazon.com", icon: "📦" },
  ],
  "开发": [
    { name: "GitHub", url: "https://github.com", icon: "🐙" },
    { name: "Stack Overflow", url: "https://stackoverflow.com", icon: "📋" },
    { name: "MDN", url: "https://developer.mozilla.org", icon: "📖" },
    { name: "掘金", url: "https://juejin.cn", icon: "⛏️" },
    { name: "CSDN", url: "https://www.csdn.net", icon: "💻" },
    { name: "Gitee", url: "https://gitee.com", icon: "🐎" },
  ],
  "设计": [
    { name: "站酷", url: "https://www.zcool.com.cn", icon: "🎨" },
    { name: "花瓣", url: "https://huaban.com", icon: "🌸" },
    { name: "UI中国", url: "https://www.ui.cn", icon: "🎯" },
    { name: "Behance", url: "https://www.behance.net", icon: "🖼️" },
    { name: "Dribbble", url: "https://dribbble.com", icon: "🏀" },
    { name: "Figma", url: "https://www.figma.com", icon: "🎨" },
  ],
  "办公": [
    { name: "飞书", url: "https://www.feishu.cn", icon: "🐦" },
    { name: "钉钉", url: "https://www.dingtalk.com", icon: "📌" },
    { name: "腾讯文档", url: "https://docs.qq.com", icon: "📄" },
    { name: "石墨文档", url: "https://shimo.im", icon: "✏️" },
    { name: "Notion", url: "https://www.notion.so", icon: "📝" },
    { name: "语雀", url: "https://www.yuque.com", icon: "🐦" },
  ],
  "新闻": [
    { name: "新浪", url: "https://www.sina.com.cn", icon: "📰" },
    { name: "网易", url: "https://www.163.com", icon: "📰" },
    { name: "腾讯新闻", url: "https://news.qq.com", icon: "📰" },
    { name: "今日头条", url: "https://www.toutiao.com", icon: "📰" },
    { name: "凤凰网", url: "https://www.ifeng.com", icon: "🦅" },
    { name: "澎湃", url: "https://www.thepaper.cn", icon: "🌊" },
  ],
  "学习": [
    { name: "慕课网", url: "https://www.imooc.com", icon: "🎓" },
    { name: "网易云课堂", url: "https://study.163.com", icon: "📚" },
    { name: "中国大学MOOC", url: "https://www.icourse163.org", icon: "🏛️" },
    { name: "Coursera", url: "https://www.coursera.org", icon: "🎓" },
    { name: "可汗学院", url: "https://www.khanacademy.org", icon: "📐" },
    { name: "TED", url: "https://www.ted.com", icon: "🎤" },
  ],
  "生活": [
    { name: "美团", url: "https://www.meituan.com", icon: "🍔" },
    { name: "饿了么", url: "https://www.ele.me", icon: "🍜" },
    { name: "携程", url: "https://www.ctrip.com", icon: "✈️" },
    { name: "12306", url: "https://www.12306.cn", icon: "🚄" },
    { name: "大众点评", url: "https://www.dianping.com", icon: "⭐" },
    { name: "高德地图", url: "https://www.amap.com", icon: "🗺️" },
  ],
  "工具": [
    { name: "极光浏览器", url: "https://zhangyuxuan2012.github.io/zhangyuxuan/", icon: "🌌" },
    { name: "文本转HTML", url: "https://zhangyuxuan2012.github.io/text-to-html-tool/", icon: "🔄" },
    { name: "翻译", url: "https://translate.google.com", icon: "🌍" },
    { name: "PDF处理", url: "https://smallpdf.com", icon: "📑" },
    { name: "图片压缩", url: "https://tinypng.com", icon: "🖼️" },
    { name: "二维码生成", url: "https://cli.im", icon: "📱" },
    { name: "QQ邮箱", url: "https://wx.mail.qq.com/list/readtemplate?name=login_jump.html", icon: "📧" },
    { name: "ZoomEarth", url: "https://zoom.earth/maps/satellite/", icon: "🌍" },
    { name: "HTMLaunch", url: "https://htmlaunch.com/app/", icon: "🚀" },
    { name: "音频剪辑", url: "https://audiotrimmer.com/cn/", icon: "🎵" },
    { name: "音频处理", url: "https://audioalter.com/", icon: "🎛️" },
  ],
  "AIGC": [
    { name: "DeepSeek", url: "https://chat.deepseek.com/sign_in", icon: "🤖" },
    { name: "混元3D", url: "https://3d.hunyuan.tencent.com/sceneTo3D", icon: "🧊" },
    { name: "AI工具集", url: "https://ai-bot.cn/", icon: "🧰" },
    { name: "CanRunAI", url: "https://www.canirun.ai/", icon: "💻" },
    { name: "AgnesAI", url: "https://platform.agnes-ai.com/settings/apiKeys", icon: "🤝" },
    { name: "DeepSeekAPI", url: "https://platform.deepseek.com/sign_up", icon: "🔑" },
    { name: "AIHub", url: "https://console.bce.baidu.com/qianfan/modelcenter/model/buildIn/list", icon: "☁️" },
    { name: "DuckAI", url: "https://duck.ai/", icon: "🦆" },    { name: "小智AI", url: "https://www.xiaozhi.me/", icon: "🤖" },
    { name: "小智源码", url: "https://github.com/78/xiaozhi-esp32", icon: "🔧" },
    { name: "小智Unihiker", url: "https://www.unihiker.com.cn/wiki/k10/xiaozhi_ai", icon: "🎓" },
    { name: "小智ESP32", url: "https://www.nologo.tech/ai/aiproduct/esp32s3ai/esp32s3ai.html", icon: "🛰️" },
  ],
  "游戏": [
    { name: "GeoFS", url: "https://www.geo-fs.com/", icon: "✈️" },
    { name: "Bloxd", url: "https://bloxd.io/", icon: "🧱" },
    { name: "Krunker", url: "https://krunker.io/", icon: "🔫" },
    { name: "PixelWar", url: "https://pixelwarfare.io/", icon: "🎯" },
    { name: "Kirka", url: "https://kirka.io/", icon: "⚔️" },
    { name: "CrazyGames", url: "https://www.crazygames.com/", icon: "🕹️" },
    { name: "DeadShot", url: "https://deadshotio.games/", icon: "💀" },
    { name: "WarBrokers", url: "https://warbrokers.io/", icon: "🚁" },
    { name: "NarrowOne", url: "https://narrow.one/", icon: "🏹" },
  ],
};

// ========== 状态 ==========
let currentCategory = "常用";

// ========== 初始化 ==========
document.addEventListener("DOMContentLoaded", function () {
  renderCategories();
  renderSites();
  bindEvents();
  initBlockedCount();
});

// 拦截计数
function initBlockedCount() {
  chrome.storage.sync.get(["blockedCount"], function (result) {
    document.getElementById("blockedNum").textContent = result.blockedCount || 0;
  });
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === "sync" && changes.blockedCount) {
      document.getElementById("blockedNum").textContent = changes.blockedCount.newValue || 0;
    }
  });
}

// 渲染分类
function renderCategories() {
  var container = document.getElementById("categories");
  container.innerHTML = "";
  Object.keys(SITES).forEach(function (cat) {
    var tag = document.createElement("div");
    tag.className = "sn-cat" + (cat === currentCategory ? " active" : "");
    tag.textContent = cat;
    tag.addEventListener("click", function () {
      currentCategory = cat;
      renderCategories();
      renderSites();
    });
    container.appendChild(tag);
  });
}

// 渲染网站
function renderSites(filterText) {
  var container = document.getElementById("sitesList");
  container.innerHTML = "";
  var sites = SITES[currentCategory] || [];

  if (filterText) {
    sites = [];
    Object.keys(SITES).forEach(function (cat) {
      SITES[cat].forEach(function (s) {
        if (s.name.toLowerCase().indexOf(filterText.toLowerCase()) >= 0 ||
            s.url.toLowerCase().indexOf(filterText.toLowerCase()) >= 0) {
          sites.push(s);
        }
      });
    });
  }

  if (sites.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#667788;padding:20px;font-size:11px;">没有找到相关网站</div>';
    return;
  }

  sites.forEach(function (site) {
    var card = document.createElement("div");
    card.className = "sn-site";
    card.innerHTML =
      '<div class="sn-site-icon">' + site.icon + '</div>' +
      '<div class="sn-site-name">' + site.name + '</div>';
    card.addEventListener("click", function () {
      openInLeftPanel(site.url);
    });
    container.appendChild(card);
  });
}

// 在左屏（当前活动标签页）打开网址
function openInLeftPanel(url) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      chrome.tabs.update(tabs[0].id, { url: url });
    } else {
      chrome.tabs.create({ url: url });
    }
  });
}

// 绑定事件
function bindEvents() {
  // 搜索
  var searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", function () {
    var text = searchInput.value.trim();
    if (text) {
      renderSites(text);
    } else {
      renderSites();
    }
  });

  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      var text = searchInput.value.trim();
      if (text) {
        if (/^https?:\/\//.test(text) || /^[\w-]+\.[\w.-]+/.test(text)) {
          openInLeftPanel(/^https?:\/\//.test(text) ? text : "https://" + text);
        } else {
          openInLeftPanel("https://www.baidu.com/s?wd=" + encodeURIComponent(text));
        }
      }
    }
  });

  // 左屏控制按钮
  document.getElementById("btn-refresh").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) chrome.tabs.reload(tabs[0].id);
    });
  });

  document.getElementById("btn-back").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) chrome.tabs.goBack(tabs[0].id);
    });
  });

  document.getElementById("btn-forward").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) chrome.tabs.goForward(tabs[0].id);
    });
  });

  document.getElementById("btn-full").addEventListener("click", function () {
    openInLeftPanel("https://zhangyuxuan2012.github.io/zhangyuxuan/");
  });

  // AI 一键总结
  document.getElementById("btn-ai-summary").addEventListener("click", summarizePage);
  document.getElementById("btn-ai-copy").addEventListener("click", copySummary);
  document.getElementById("btn-ai-close").addEventListener("click", closeSummary);

  // v1.1.0 新功能
  document.getElementById("btn-reader").addEventListener("click", toggleReaderMode);
  document.getElementById("btn-dark").addEventListener("click", toggleDarkMode);
  document.getElementById("btn-screenshot").addEventListener("click", captureScreenshot);
  document.getElementById("btn-custom-add").addEventListener("click", openCustomModal);
  document.getElementById("btn-custom-add2").addEventListener("click", openCustomModal);
  document.getElementById("btn-custom-cancel").addEventListener("click", closeCustomModal);
  document.getElementById("btn-custom-save").addEventListener("click", saveCustomSite);
}

// ========== AI 一键总结（本地算法，不联网不上传） ==========
function summarizePage() {
  var btn = document.getElementById("btn-ai-summary");
  var result = document.getElementById("aiResult");
  var body = document.getElementById("aiResultBody");
  var meta = document.getElementById("aiResultMeta");
  btn.textContent = "⏳ 总结中…";
  btn.disabled = true;

  function done() {
    btn.textContent = "✨ AI 总结本页";
    btn.disabled = false;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs[0]) {
      body.textContent = "未找到当前标签页，请重新打开侧边栏后重试。";
      result.style.display = "block";
      done();
      return;
    }
    chrome.tabs.sendMessage(tabs[0].id, { type: "getPageText" }, function (resp) {
      if (chrome.runtime.lastError || !resp || !resp.ok) {
        body.textContent = "无法读取当前页面内容。若页面在扩展安装前已打开，请刷新页面后重试。";
        result.style.display = "block";
        done();
        return;
      }
      var text = resp.text || "";
      if (text.length < 30) {
        body.textContent = "当前页面内容过短，无法生成摘要。";
        meta.textContent = "";
        result.style.display = "block";
        done();
        return;
      }
      var res = AuroraSummary.extractSummary(text, 6);
      body.textContent = res.summary || "未能提取到有效内容。";
      meta.textContent = "从 " + res.total + " 句中提取 " + res.sentences.length + " 个核心要点 · 本地计算不上传";
      result.style.display = "block";
      done();
    });
  });
}

function copySummary() {
  var body = document.getElementById("aiResultBody");
  var text = body.textContent || "";
  if (!text) return;
  var ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
  var btn = document.getElementById("btn-ai-copy");
  btn.textContent = "✅ 已复制";
  setTimeout(function () { btn.textContent = "📋 复制"; }, 1500);
}

function closeSummary() {
  document.getElementById("aiResult").style.display = "none";
}

// ========== v1.1.0 新功能 ==========

// 获取当前活动标签页
function getActiveTab(cb) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    cb(tabs && tabs[0] ? tabs[0] : null);
  });
}

// 阅读模式
function toggleReaderMode() {
  getActiveTab(function (tab) {
    if (!tab) { showToast("未找到当前标签页"); return; }
    chrome.tabs.sendMessage(tab.id, { type: "readerMode" }, function (resp) {
      if (chrome.runtime.lastError) {
        showToast("请刷新页面后再试");
      } else {
        showToast("📖 阅读模式已切换");
      }
    });
  });
}

// 暗黑模式
function toggleDarkMode() {
  var btn = document.getElementById("btn-dark");
  getActiveTab(function (tab) {
    if (!tab) { showToast("未找到当前标签页"); return; }
    chrome.tabs.sendMessage(tab.id, { type: "darkModeToggle" }, function (resp) {
      if (chrome.runtime.lastError) {
        showToast("请刷新页面后再试");
      } else if (resp && resp.ok) {
        btn.textContent = resp.enabled ? "☀️ 亮色" : "🌙 暗黑";
        showToast(resp.enabled ? "🌙 暗黑模式已开启" : "☀️ 已恢复亮色");
      }
    });
  });
}

// 网页截图
function captureScreenshot() {
  var btn = document.getElementById("btn-screenshot");
  btn.textContent = "⏳ 截图中…";
  btn.disabled = true;
  chrome.runtime.sendMessage({ type: "captureScreenshot" }, function (resp) {
    btn.textContent = "📷 截图";
    btn.disabled = false;
    if (resp && resp.ok) {
      showToast("📷 截图已下载：" + (resp.filename || ""));
    } else {
      showToast("截图失败：" + ((resp && resp.error) || "未知错误"));
    }
  });
}

// 轻提示
function showToast(msg) {
  var toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(20,20,40,0.95);color:#fff;padding:10px 20px;border-radius:10px;font-size:12px;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.3);max-width:280px;text-align:center;";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = "block";
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function () { toast.style.display = "none"; }, 2200);
}

// ========== 自定义快捷网址 ==========
var CUSTOM_KEY = "customSites";

function loadCustomSites(cb) {
  chrome.storage.sync.get([CUSTOM_KEY], function (result) {
    cb(result[CUSTOM_KEY] || []);
  });
}

function saveCustomSites(list, cb) {
  var obj = {};
  obj[CUSTOM_KEY] = list;
  chrome.storage.sync.set(obj, function () { cb && cb(); });
}

function renderCustomSites() {
  loadCustomSites(function (list) {
    var container = document.getElementById("customList");
    if (!container) return;
    if (!list.length) {
      container.innerHTML = '<span class="sn-custom-empty">暂无自定义网址，点击"添加"创建</span>';
      return;
    }
    container.innerHTML = "";
    list.forEach(function (site, idx) {
      var item = document.createElement("div");
      item.className = "sn-custom-item";
      item.innerHTML =
        '<a class="sn-custom-link" href="' + escapeAttr(site.url) + '" target="_blank" title="' + escapeAttr(site.name) + '">' + escapeHtml(site.name) + '</a>' +
        '<button class="sn-custom-del" data-idx="' + idx + '" title="删除">✕</button>';
      container.appendChild(item);
    });
    // 绑定删除
    container.querySelectorAll(".sn-custom-del").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute("data-idx"), 10);
        deleteCustomSite(idx);
      });
    });
  });
}

function openCustomModal() {
  document.getElementById("customName").value = "";
  document.getElementById("customUrl").value = "";
  document.getElementById("customModal").style.display = "flex";
  document.getElementById("customName").focus();
}

function closeCustomModal() {
  document.getElementById("customModal").style.display = "none";
}

function saveCustomSite() {
  var name = document.getElementById("customName").value.trim();
  var url = document.getElementById("customUrl").value.trim();
  if (!name || !url) { showToast("请填写名称和网址"); return; }
  if (!/^https?:\/\//i.test(url)) { url = "https://" + url; }
  loadCustomSites(function (list) {
    list.push({ name: name, url: url });
    saveCustomSites(list, function () {
      renderCustomSites();
      closeCustomModal();
      showToast("✅ 已添加：" + name);
    });
  });
}

function deleteCustomSite(idx) {
  loadCustomSites(function (list) {
    if (idx < 0 || idx >= list.length) return;
    var name = list[idx].name;
    list.splice(idx, 1);
    saveCustomSites(list, function () {
      renderCustomSites();
      showToast("已删除：" + name);
    });
  });
}

function escapeHtml(s) {
  var d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 页面加载时渲染自定义网址 + 稍后阅读
document.addEventListener("DOMContentLoaded", function () {
  renderCustomSites();
  renderLaterItems();
  var saveBtn = document.getElementById("btn-later-save");
  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs[0]) return;
        chrome.tabs.sendMessage(tabs[0].id, { type: "saveForLater" }, function (resp) {
          if (resp && resp.ok && resp.item) {
            saveLaterItem(resp.item);
            renderLaterItems();
            if (typeof flashShortMsg === "function") flashShortMsg("已保存到稍后阅读");
          }
        });
      });
    });
  }
});

// ========== 稍后阅读（v1.2.0） ==========
var LATER_KEY = "aurora_later_items";
function loadLaterItems(cb) {
  try {
    chrome.storage.local.get([LATER_KEY], function (result) { cb(result[LATER_KEY] || []); });
  } catch (e) { cb([]); }
}
function saveLaterItem(item) {
  loadLaterItems(function (list) {
    if (list.some(function (i) { return i.url === item.url; })) return;
    list.unshift(item);
    if (list.length > 50) list = list.slice(0, 50);
    var obj = {}; obj[LATER_KEY] = list;
    chrome.storage.local.set(obj);
  });
}
function deleteLaterItem(url) {
  loadLaterItems(function (list) {
    var filtered = list.filter(function (i) { return i.url !== url; });
    var obj = {}; obj[LATER_KEY] = filtered;
    chrome.storage.local.set(obj);
    renderLaterItems();
  });
}
function renderLaterItems() {
  var listEl = document.getElementById("laterList");
  if (!listEl) return;
  loadLaterItems(function (list) {
    if (!list || list.length === 0) {
      listEl.innerHTML = '<span class="sn-later-empty">暂无保存的文章</span>';
      return;
    }
    listEl.innerHTML = "";
    list.forEach(function (item) {
      var div = document.createElement("div");
      div.className = "sn-later-item";
      var timeStr = formatLaterTime(item.savedAt);
      div.innerHTML =
        '<div class="sn-later-title">' + escapeHtml(item.title) + '</div>' +
        '<div class="sn-later-meta">' + timeStr + '</div>' +
        '<div class="sn-later-actions">' +
        '<button class="sn-later-open" data-url="' + escapeAttr(item.url) + '">打开</button>' +
        '<button class="sn-later-del" data-url="' + escapeAttr(item.url) + '">删除</button>' +
        '</div>';
      listEl.appendChild(div);
    });
    listEl.querySelectorAll(".sn-later-open").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var url = this.getAttribute("data-url");
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs[0]) chrome.tabs.update(tabs[0].id, { url: url });
        });
      });
    });
    listEl.querySelectorAll(".sn-later-del").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteLaterItem(this.getAttribute("data-url"));
      });
    });
  });
}
function formatLaterTime(ts) {
  if (!ts) return "";
  var d = new Date(ts);
  var diff = (Date.now() - d) / 1000;
  if (diff < 60) return "刚刚";
  if (diff < 3600) return Math.floor(diff / 60) + "分钟前";
  if (diff < 86400) return Math.floor(diff / 3600) + "小时前";
  return (d.getMonth() + 1) + "/" + d.getDate();
}


// ========== 商品比价（v1.3.0） ==========
var COMPARE_KEY = "aurora_compare_list";
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
      listEl.innerHTML = '<span class="sn-compare-empty">在商品页点"加入比价"，或点"➕ 当前页"添加</span>';
      if (summaryEl) summaryEl.style.display = "none";
      return;
    }
    // 按价格排序
    var sorted = list.slice().sort(function (a, b) { return a.price - b.price; });
    var minPrice = sorted[0].price;
    var maxPrice = sorted[sorted.length - 1].price;
    var diff = maxPrice - minPrice;

    // 总结
    if (summaryEl && list.length >= 2) {
      var cheapest = sorted[0];
      var dearest = sorted[sorted.length - 1];
      var pct = diff / dearest.price * 100;
      summaryEl.style.display = "block";
      summaryEl.innerHTML =
        '<div class="sn-compare-best">🏆 最便宜：' + escapeHtml(cheapest.title.slice(0, 20)) + '（¥' + cheapest.price.toFixed(2) + '）</div>' +
        '<div class="sn-compare-diff">比最贵的便宜 ¥' + diff.toFixed(2) + '（' + pct.toFixed(1) + '%）</div>';
    } else if (summaryEl) {
      summaryEl.style.display = "none";
    }

    // 列表
    listEl.innerHTML = "";
    sorted.forEach(function (item, idx) {
      var div = document.createElement("div");
      div.className = "sn-compare-item" + (item.price === minPrice && list.length >= 2 ? " best" : "");
      var badge = idx === 0 && list.length >= 2 ? '<span class="sn-compare-badge">最便宜</span>' : "";
      div.innerHTML =
        '<div class="sn-compare-title">' + badge + escapeHtml(item.title) + '</div>' +
        '<div class="sn-compare-meta">' + escapeHtml(item.host) + '</div>' +
        '<div class="sn-compare-price">¥' + item.price.toFixed(2) + '</div>' +
        '<div class="sn-compare-actions">' +
        '<button class="sn-compare-open" data-url="' + escapeAttr(item.url) + '">打开</button>' +
        '<button class="sn-compare-del" data-url="' + escapeAttr(item.url) + '">删除</button>' +
        '</div>';
      listEl.appendChild(div);
    });

    // 绑定事件
    listEl.querySelectorAll(".sn-compare-open").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var url = this.getAttribute("data-url");
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs[0]) chrome.tabs.update(tabs[0].id, { url: url });
        });
      });
    });
    listEl.querySelectorAll(".sn-compare-del").forEach(function (btn) {
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

// 绑定比价按钮
document.addEventListener("DOMContentLoaded", function () {
  var addBtn = document.getElementById("btn-compare-add");
  if (addBtn) {
    addBtn.addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs[0]) return;
        chrome.tabs.sendMessage(tabs[0].id, { type: "getProductInfo" }, function (resp) {
          if (resp && resp.ok && resp.product && resp.product.price > 0) {
            loadCompareList(function (list) {
              if (!list.some(function (p) { return p.url === resp.product.url; })) {
                list.push(resp.product);
                if (list.length > 10) list = list.slice(0, 10);
                saveCompareList(list);
                renderCompareList();
                if (typeof flashShortMsg === "function") flashShortMsg("已加入比价：" + resp.product.title.slice(0, 15));
              }
            });
          } else {
            if (typeof flashShortMsg === "function") flashShortMsg("当前页未识别到商品价格");
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
});
