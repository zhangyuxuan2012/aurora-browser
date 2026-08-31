const fs = require('fs');
const lite = "C:/Users/Administrator/Doubao/chats/2026-08-26/new-chat-1/轻量版_最新.html";
const exeFile = "C:/Users/Administrator/Desktop/极光浏览器-桌面版EXE-绿色免安装.exe";
const out = "C:/Users/Administrator/Desktop/极光浏览器-最终版.html";

let c = fs.readFileSync(lite, 'utf8');
const exeBuf = fs.readFileSync(exeFile);
const exeSizeMB = (exeBuf.length / 1048576).toFixed(1);
const b64 = exeBuf.toString('base64');
console.log('EXE:', exeBuf.length, '字节 =', exeSizeMB, 'MB');

const start = c.indexOf('  /* ---------- Embedded EXE');
if (start < 0) { console.log('❌ 未找到起点'); process.exit(1); }
const d = c.indexOf('function downloadEmbeddedExe', start);
const end = c.indexOf('return true;\n  }', d) + 'return true;\n  }'.length;

const newBlock = `  /* ---------- Embedded EXE (已内嵌本网页，任何电脑可直接下载，不依赖任何外部路径/相对路径) ---------- */
  const EMBEDDED_EXE_NAME = '极光浏览器-桌面版EXE-绿色免安装.exe';
  const EMBEDDED_EXE_SIZE_MB = ${exeSizeMB};
  const EMBEDDED_EXE_B64 = '${b64}';
  let __embeddedExeUrl = null;
  function getEmbeddedExeUrl() {
    if (__embeddedExeUrl) return __embeddedExeUrl;
    try {
      var bin = atob(EMBEDDED_EXE_B64);
      var len = bin.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
      var blob = new Blob([bytes], { type: 'application/octet-stream' });
      __embeddedExeUrl = URL.createObjectURL(blob);
      return __embeddedExeUrl;
    } catch (e) { return null; }
  }
  function downloadEmbeddedExe() {
    var url = getEmbeddedExeUrl();
    if (!url) { try { flashShortMsg('⚠️ 桌面版加载失败，请刷新页面重试'); } catch(e){} return false; }
    var a = document.createElement('a');
    a.href = url;
    a.download = EMBEDDED_EXE_NAME;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    try { flashShortMsg('⬇️ 正在下载桌面版（' + EMBEDDED_EXE_SIZE_MB + ' MB），完成后双击即可使用'); } catch(e){}
    return true;
  }`;

c = c.substring(0, start) + newBlock + c.substring(end);
fs.writeFileSync(out, c, 'utf8');
console.log('✅ 最终版已生成:', out, '(' + (c.length / 1048576).toFixed(1) + ' MB)');
