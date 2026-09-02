// 极光快导 - 弹出页面逻辑

// ========== 网站数据（精选常用网站） ==========
const SITES = {
  "常用": [
    { name: "百度", url: "https://www.baidu.com", icon: "🔍" },
    { name: "谷歌", url: "https://www.google.com", icon: "🌐" },
    { name: "B站", url: "https://www.bilibili.com", icon: "📺" },
    { name: "知乎", url: "https://www.zhihu.com", icon: "💡" },
    { name: "微博", url: "https://weibo.com", icon: "📱" },
    { name: "淘宝", url: "https://www.taobao.com", icon: "🛒" },
    { name: "京东", url: "https://www.jd.com", icon: "📦" },
    { name: "抖音", url: "https://www.douyin.com", icon: "🎵" },
  ],
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
  ],
};

// ========== 状态管理 ==========
let currentCategory = "常用";
let blockerEnabled = true;
let blockedCount = 0;

// ========== 初始化 ==========
document.addEventListener("DOMContentLoaded", function () {
  initBlockerStatus();
  initBlockedCount();
  renderCategories();
  renderSites();
  bindEvents();
});

// 读取防弹窗状态
function initBlockerStatus() {
  chrome.storage.sync.get(["blockerEnabled"], function (result) {
    blockerEnabled = result.blockerEnabled !== false;
    updateBlockerUI();
  });
}

// 读取拦截计数
function initBlockedCount() {
  chrome.storage.sync.get(["blockedCount"], function (result) {
    blockedCount = result.blockedCount || 0;
    document.getElementById("blockedCount").textContent = "已拦截 " + blockedCount + " 个弹窗";
  });
}

// 更新防弹窗UI
function updateBlockerUI() {
  var btn = document.getElementById("btn-blocker");
  var status = document.getElementById("blockerStatus");
  if (blockerEnabled) {
    btn.classList.add("active");
    status.textContent = "已开启";
    status.classList.remove("off");
  } else {
    btn.classList.remove("active");
    status.textContent = "已关闭";
    status.classList.add("off");
  }
}

// ========== 渲染分类标签 ==========
function renderCategories() {
  var container = document.getElementById("categories");
  container.innerHTML = "";
  Object.keys(SITES).forEach(function (cat) {
    var tag = document.createElement("div");
    tag.className = "cat-tag" + (cat === currentCategory ? " active" : "");
    tag.textContent = cat;
    tag.addEventListener("click", function () {
      currentCategory = cat;
      renderCategories();
      renderSites();
    });
    container.appendChild(tag);
  });
}

// ========== 渲染网站卡片 ==========
function renderSites(filterText) {
  var container = document.getElementById("sitesList");
  container.innerHTML = "";
  var sites = SITES[currentCategory] || [];

  if (filterText) {
    // 搜索模式：从所有分类中匹配
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
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#667788;padding:20px;font-size:12px;">没有找到相关网站</div>';
    return;
  }

  sites.forEach(function (site) {
    var card = document.createElement("div");
    card.className = "site-card";
    card.innerHTML =
      '<div class="site-icon">' + site.icon + '</div>' +
      '<div class="site-name">' + site.name + '</div>';
    card.addEventListener("click", function () {
      openUrl(site.url);
    });
    container.appendChild(card);
  });
}

// ========== 打开网址 ==========
function openUrl(url) {
  chrome.tabs.create({ url: url });
  window.close();
}

// ========== 绑定事件 ==========
function bindEvents() {
  // 搜索
  var searchInput = document.getElementById("searchInput");
  var searchBtn = document.getElementById("searchBtn");

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
        // 如果是网址，直接打开；否则用百度搜索
        if (/^https?:\/\//.test(text) || /^[\w-]+\.[\w.-]+/.test(text)) {
          openUrl(/^https?:\/\//.test(text) ? text : "https://" + text);
        } else {
          openUrl("https://www.baidu.com/s?wd=" + encodeURIComponent(text));
        }
      }
    }
  });

  searchBtn.addEventListener("click", function () {
    searchInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
  });

  // 防弹窗开关
  document.getElementById("btn-blocker").addEventListener("click", function () {
    blockerEnabled = !blockerEnabled;
    chrome.storage.sync.set({ blockerEnabled: blockerEnabled });
    // 通知所有标签页更新状态
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(function (tab) {
        chrome.tabs.sendMessage(tab.id, { type: "blockerToggle", enabled: blockerEnabled });
      });
    });
    updateBlockerUI();
    showToast(blockerEnabled ? "🛡️ 防弹窗已开启" : "防弹窗已关闭");
  });

  // 清除浏览数据
  document.getElementById("btn-privacy").addEventListener("click", function () {
    if (confirm("确定清除全部浏览数据（缓存、Cookie、历史）？此操作不可恢复。")) {
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
          showToast("🧹 浏览数据已清除");
        }
      );
    }
  });

  // 打开无痕窗口
  document.getElementById("btn-incognito").addEventListener("click", function () {
    chrome.windows.create({ incognito: true });
    window.close();
  });

  // 打开完整导航
  document.getElementById("btn-nav").addEventListener("click", function () {
    openUrl("https://zhangyuxuan2012.github.io/zhangyuxuan/");
  });

  // 监听拦截计数变化
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === "sync" && changes.blockedCount) {
      blockedCount = changes.blockedCount.newValue || 0;
      document.getElementById("blockedCount").textContent = "已拦截 " + blockedCount + " 个弹窗";
    }
  });
}

// ========== 提示消息 ==========
function showToast(text) {
  var toast = document.getElementById("toast");
  toast.textContent = text;
  toast.classList.add("show");
  setTimeout(function () {
    toast.classList.remove("show");
  }, 2000);
}
