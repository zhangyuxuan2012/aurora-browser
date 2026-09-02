// 极光快导 - 本地智能摘要算法（AI 总结核心）
// 纯本地计算：基于词频加权 + 句子位置权重的中英文文本摘要，不联网、不上传、零成本
(function () {
  "use strict";

  // 常见中文停用词
  var STOPWORDS = {
    "的":1,"了":1,"在":1,"是":1,"我":1,"有":1,"和":1,"就":1,"不":1,"人":1,"都":1,"一":1,
    "一个":1,"上":1,"也":1,"很":1,"到":1,"说":1,"要":1,"去":1,"你":1,"会":1,"着":1,"没有":1,
    "看":1,"好":1,"自己":1,"这":1,"那":1,"他":1,"她":1,"它":1,"们":1,"与":1,"或":1,"而":1,
    "但":1,"及":1,"其":1,"我们":1,"你们":1,"他们":1,"这个":1,"那个":1,"这些":1,"那些":1,
    "为":1,"对":1,"从":1,"向":1,"被":1,"把":1,"让":1,"可以":1,"能够":1,"应该":1,"可能":1,
    "已经":1,"正在":1,"还是":1,"因为":1,"所以":1,"但是":1,"如果":1,"虽然":1,"对于":1,"关于":1,
    "以及":1,"通过":1,"为了":1,"根据":1,"按照":1,"目前":1,"现在":1,"今天":1,"时候":1,"一个":1,
    "the":1,"a":1,"an":1,"and":1,"or":1,"of":1,"to":1,"in":1,"on":1,"for":1,"with":1,"is":1,
    "are":1,"was":1,"were":1,"be":1,"been":1,"it":1,"this":1,"that":1,"these":1,"those":1,
    "i":1,"you":1,"he":1,"she":1,"they":1,"we":1,"not":1,"as":1,"at":1,"by":1,"from":1,"has":1,
    "have":1,"had":1,"will":1,"would":1,"can":1,"could":1,"should":1,"may":1,"than":1,"then":1,
    "there":1,"their":1,"them":1,"his":1,"her":1,"our":1,"your":1,"more":1,"most":1,"about":1,
    "into":1,"over":1,"after":1,"before":1,"between":1,"out":1,"up":1,"down":1,"do":1,"does":1,
    "did":1,"am":1,"are":1,"so":1,"if":1,"also":1,"just":1,"very":1,"some":1,"any":1,"all":1,
    "each":1,"other":1,"such":1,"only":1,"own":1,"same":1,"too":1,"again":1,"off":1,"under":1,
    "once":1,"here":1,"when":1,"where":1,"why":1,"how":1,"what":1,"which":1,"who":1,"whom":1
  };

  // 分词：中文 bigram + 英文单词
  function tokenize(text) {
    var words = [];
    // 中文连续串
    var cnMatches = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    for (var i = 0; i < cnMatches.length; i++) {
      var chunk = cnMatches[i];
      if (chunk.length <= 4) {
        words.push(chunk);
      }
      for (var j = 0; j < chunk.length - 1; j++) {
        words.push(chunk.substr(j, 2));
      }
    }
    // 英文单词（≥2字母）
    var enMatches = text.match(/[a-zA-Z]{2,}/g) || [];
    for (var k = 0; k < enMatches.length; k++) {
      words.push(enMatches[k].toLowerCase());
    }
    // 数字
    var numMatches = text.match(/\d{2,}/g) || [];
    for (var m = 0; m < numMatches.length; m++) {
      words.push(numMatches[m]);
    }
    // 去停用词和长度<2的词
    return words.filter(function (w) {
      return w.length >= 2 && !STOPWORDS[w];
    });
  }

  // 清洗文本
  function cleanText(text) {
    if (!text) return "";
    return text
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .trim();
  }

  // 分句
  function splitSentences(text) {
    var parts = text.split(/(?<=[。！？!?；;\.])/);
    var sentences = [];
    for (var i = 0; i < parts.length; i++) {
      var s = parts[i].trim();
      if (s.length >= 8) sentences.push(s);
    }
    return sentences;
  }

  // 拼接句子，避免重复标点
  function joinSentences(sentences) {
    return sentences.map(function (s) {
      return /[。！？!?；;]$/.test(s) ? s : s + "。";
    }).join("");
  }

  // 核心：提取摘要
  // text: 页面正文文本; maxSentences: 目标句数（默认5）
  // 返回 { summary: 摘要文本, sentences: 选中句子数组, total: 原始句数 }
  function extractSummary(text, maxSentences) {
    maxSentences = maxSentences || 5;
    var cleaned = cleanText(text);
    if (cleaned.length < 30) {
      return { summary: cleaned, sentences: cleaned ? [cleaned] : [], total: 0 };
    }

    var sentences = splitSentences(cleaned);
    if (sentences.length <= maxSentences) {
      return {
        summary: joinSentences(sentences),
        sentences: sentences,
        total: sentences.length,
      };
    }

    // 词频统计
    var wordCount = {};
    var sentenceWords = [];
    for (var i = 0; i < sentences.length; i++) {
      var words = tokenize(sentences[i]);
      sentenceWords.push(words);
      for (var j = 0; j < words.length; j++) {
        wordCount[words[j]] = (wordCount[words[j]] || 0) + 1;
      }
    }

    // 句子打分：词频和 × 位置权重（前20%加权）+ 长度适中奖励
    var scored = [];
    for (var k = 0; k < sentences.length; k++) {
      var score = 0;
      for (var m = 0; m < sentenceWords[k].length; m++) {
        score += wordCount[sentenceWords[k][m]] || 0;
      }
      var len = sentences[k].length;
      // 长度惩罚：过长或过短的句子降权
      var lenFactor = len >= 20 && len <= 200 ? 1.2 : 0.6;
      var posFactor = k < sentences.length * 0.2 ? 1.4 : 1.0;
      scored.push({ index: k, score: score * lenFactor * posFactor, text: sentences[k] });
    }

    // 选 top N 句
    var top = scored.slice().sort(function (a, b) { return b.score - a.score; }).slice(0, maxSentences);
    top.sort(function (a, b) { return a.index - b.index; });

    var result = [];
    for (var n = 0; n < top.length; n++) {
      result.push(top[n].text);
    }

    return {
      summary: joinSentences(result),
      sentences: result,
      total: sentences.length,
    };
  }

  // 暴露接口（支持 popup / sidepanel 使用）
  var api = { extractSummary: extractSummary, cleanText: cleanText, splitSentences: splitSentences };
  if (typeof window !== "undefined") {
    window.AuroraSummary = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
