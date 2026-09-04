// 极光工具箱 - 中英翻译引擎
// 优先使用 Google 免费翻译端点（无需密钥），失败时本地词典兜底
// 所有翻译请求仅为单次文本翻译，不缓存、不上传任何用户数据

// 本地基础词典（兜底，覆盖常用词）
const LOCAL_DICT = {
  // 英文 -> 中文 常用词
  "hello": "你好", "world": "世界", "good": "好的", "bad": "坏的", "big": "大的",
  "small": "小的", "new": "新的", "old": "旧的", "open": "打开", "close": "关闭",
  "yes": "是", "no": "不", "ok": "好的", "okay": "好的", "thank": "谢谢",
  "thanks": "谢谢", "welcome": "欢迎", "please": "请", "sorry": "抱歉",
  "love": "爱", "like": "喜欢", "hate": "讨厌", "want": "想要", "need": "需要",
  "have": "有", "has": "有", "can": "可以", "will": "将要", "this": "这个",
  "that": "那个", "these": "这些", "those": "那些", "what": "什么", "when": "何时",
  "where": "哪里", "who": "谁", "why": "为什么", "how": "如何", "which": "哪个",
  "today": "今天", "tomorrow": "明天", "yesterday": "昨天", "now": "现在",
  "time": "时间", "day": "天", "week": "周", "month": "月", "year": "年",
  "buy": "购买", "sell": "出售", "price": "价格", "money": "钱", "cheap": "便宜的",
  "expensive": "昂贵的", "free": "免费的", "fast": "快的", "slow": "慢的",
  "great": "很棒", "best": "最好的", "worst": "最差的", "goodbye": "再见",
  "morning": "早上", "evening": "晚上", "night": "夜晚", "food": "食物",
  "water": "水", "book": "书", "computer": "电脑", "phone": "手机",
  "internet": "互联网", "website": "网站", "page": "页面", "search": "搜索",
  "find": "找到", "help": "帮助", "learn": "学习", "work": "工作",
  "happy": "开心的", "sad": "难过的", "beautiful": "美丽的", "handsome": "帅气的",
  "friendship": "友谊", "family": "家庭", "home": "家", "school": "学校",
  "company": "公司", "product": "产品", "service": "服务", "quality": "质量",
  "shopping": "购物", "store": "商店", "shop": "商店", "online": "在线的",
  "delivery": "配送", "order": "订单", "customer": "客户", "return": "退货",
  "discount": "折扣", "sale": "促销", "color": "颜色", "size": "尺寸",
  "black": "黑色", "white": "白色", "red": "红色", "blue": "蓝色", "green": "绿色",
  "yellow": "黄色", "orange": "橙色", "purple": "紫色", "pink": "粉色",
  "man": "男人", "woman": "女人", "boy": "男孩", "girl": "女孩", "people": "人们",
  "browser": "浏览器", "extension": "扩展", "tool": "工具", "toolkit": "工具箱",
  "translate": "翻译", "summary": "总结", "compare": "比较", "price": "价格",
  "sun": "太阳", "moon": "月亮", "star": "星星", "sky": "天空", "earth": "地球",
  "life": "生活", "dream": "梦想", "idea": "想法", "question": "问题", "answer": "答案",
  "read": "阅读", "write": "写作", "speak": "说", "listen": "听", "see": "看",
  "make": "制作", "take": "拿", "give": "给", "get": "得到", "use": "使用"
};

// 检测文本是否主要为中文
function isChinese(text) {
  var chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  return chineseChars > text.length * 0.3;
}

// 本地词典兜底翻译（简单逐词）
function localFallbackTranslate(text, target) {
  var words = text.split(/\s+/);
  var translated = [];
  for (var i = 0; i < words.length; i++) {
    var word = words[i].toLowerCase().replace(/[^a-z]/g, "");
    if (target === "zh" && LOCAL_DICT[word]) {
      translated.push(LOCAL_DICT[word]);
    } else {
      translated.push(words[i]);
    }
  }
  return translated.join(" ");
}

// 调用 Google 免费翻译端点
async function googleTranslate(text, targetLang) {
  var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" +
    encodeURIComponent(targetLang) + "&dt=t&q=" + encodeURIComponent(text);
  var resp = await fetch(url);
  if (!resp.ok) throw new Error("translate http " + resp.status);
  var data = await resp.json();
  // data[0] 是分段翻译结果数组
  var result = "";
  for (var i = 0; i < data[0].length; i++) {
    if (data[0][i] && data[0][i][0]) result += data[0][i][0];
  }
  return result;
}

// 翻译入口：优先 Google，失败则本地词典
async function translateText(text, targetLang) {
  if (!text || !text.trim()) return "";
  var trimmed = text.trim();
  try {
    var result = await googleTranslate(trimmed, targetLang);
    if (result && result.trim()) return result;
    throw new Error("empty result");
  } catch (e) {
    // 本地词典兜底
    return localFallbackTranslate(trimmed, targetLang);
  }
}

// 自动翻译：检测语言方向
async function autoTranslate(text) {
  var isZh = isChinese(text);
  return await translateText(text, isZh ? "en" : "zh-CN");
}

if (typeof window !== "undefined") {
  window.AuroraTranslator = {
    translateText: translateText,
    autoTranslate: autoTranslate,
    isChinese: isChinese
  };
}
if (typeof module !== "undefined") {
  module.exports = { translateText: translateText, autoTranslate: autoTranslate, isChinese: isChinese };
}
