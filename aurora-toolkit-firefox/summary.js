// 极光工具箱 - 本地网页摘要引擎
// 纯本地算法：提取正文 → 句子打分 → 抽取关键句作为摘要
// 不联网、不上传任何数据

// 提取网页正文（复用智能正文提取思路）
function extractMainText() {
  try {
    // 找到最可能的主内容容器
    var candidates = document.querySelectorAll("article, main, [role=main], .article, .post, .content, .entry-content");
    var best = null;
    var bestScore = 0;
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      var textLen = (el.innerText || "").length;
      var pCount = el.querySelectorAll("p").length;
      var score = textLen + pCount * 100;
      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }
    var container = best || document.body;
    // 收集所有段落
    var paras = container.querySelectorAll("p");
    var texts = [];
    for (var j = 0; j < paras.length; j++) {
      var t = (paras[j].innerText || "").trim();
      // 过滤短段落、导航、广告
      if (t.length >= 20 && !/^(首页|导航|菜单|登录|注册|广告|相关推荐|版权|Copyright|©)/.test(t)) {
        texts.push(t);
      }
    }
    if (texts.length === 0) {
      // 兜底：取 body 文本
      var bodyText = (document.body.innerText || "").trim();
      texts = bodyText.split(/\n+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length >= 20; });
    }
    return texts;
  } catch (e) {
    return [];
  }
}

// 句子打分：按关键词出现频率（TF 思想）
function scoreSentences(texts) {
  var wordFreq = {};
  var allWords = texts.join(" ").split(/\s+/);
  for (var i = 0; i < allWords.length; i++) {
    var w = allWords[i].toLowerCase();
    if (w.length > 1) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
  }
  // 去掉停用词
  var stopwords = ["的", "了", "是", "在", "和", "有", "我", "你", "他", "她", "它", "们",
    "the", "a", "an", "and", "or", "of", "to", "in", "for", "is", "are", "was",
    "were", "be", "been", "this", "that", "with", "on", "at", "by", "from", "as"];
  var scores = [];
  for (var j = 0; j < texts.length; j++) {
    var words = texts[j].toLowerCase().split(/\s+/);
    var score = 0;
    var unique = {};
    for (var k = 0; k < words.length; k++) {
      var w = words[k].replace(/[^\u4e00-\u9fa5a-z]/g, "");
      if (w.length > 1 && stopwords.indexOf(w) < 0 && !unique[w]) {
        unique[w] = true;
        score += wordFreq[w] || 0;
      }
    }
    // 位置加权：开头段落更重要
    var positionBonus = j < 3 ? 3 : (j < 8 ? 1.5 : 0.5);
    scores.push({ text: texts[j], score: score * positionBonus, index: j });
  }
  return scores;
}

// 生成摘要（抽取 Top N 句）
function generateSummary(texts, maxSentences) {
  maxSentences = maxSentences || 5;
  if (!texts || texts.length === 0) return { summary: [], error: "未能提取到正文内容" };
  var scored = scoreSentences(texts);
  // 按分数排序取 Top N，再按原顺序排列
  var top = scored.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, maxSentences);
  top.sort(function (a, b) { return a.index - b.index; });
  var summary = top.map(function (s) { return s.text; });
  return { summary: summary, error: null };
}

if (typeof window !== "undefined") {
  window.AuroraSummarizer = {
    extractMainText: extractMainText,
    generateSummary: generateSummary
  };
}
if (typeof module !== "undefined") {
  module.exports = { extractMainText: extractMainText, generateSummary: generateSummary };
}
