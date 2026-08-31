// 生成「极光浏览器-最终版.html」：内嵌修复后的封面 + 新构建的 EXE
const fs = require('fs');

const lite      = "C:/Users/Administrator/Doubao/chats/2026-08-26/new-chat-1/轻量版_最新.html";
const cover     = "F:/360Downloads/KK 文件/网站111/kk 网站/game-portal2.0.html";
const exeFile   = "C:/Users/Administrator/Doubao/chats/2026-08-26/new-chat-1/trae-browser/dist/极光浏览器-桌面版EXE-绿色免安装-7.0.0.exe";
const outDesktop= "C:/Users/Administrator/Desktop/极光浏览器-最终版.html";
const outFolder = "F:/张雨轩浏览器导航V7.0/极光浏览器-完整版-内嵌EXE.html";

let c = fs.readFileSync(lite, 'utf8');

/* ---- 1) 更新内嵌封面 BUILTIN_COVER ---- */
const coverHtml = fs.readFileSync(cover, 'utf8');
const encodedCover = 'data:text/html;charset=utf-8,' + encodeURIComponent(coverHtml);
const coverRe = /const BUILTIN_COVER = '[^']*';/;
if (coverRe.test(c)) {
  c = c.replace(coverRe, "const BUILTIN_COVER = '" + encodedCover + "';");
  console.log('✅ BUILTIN_COVER 已更新（封面', (coverHtml.length/1024).toFixed(0), 'KB）');
} else {
  console.log('❌ 未找到 BUILTIN_COVER 常量'); process.exit(1);
}

/* ---- 2) 内嵌新 EXE ---- */
const exeBuf = fs.readFileSync(exeFile);
const exeSizeMB = (exeBuf.length / 1048576).toFixed(1);
const b64 = exeBuf.toString('base64');
console.log('EXE:', exeBuf.length, '字节 =', exeSizeMB, 'MB');

const start = c.indexOf('  /* ---------- Embedded EXE');
if (start < 0) { console.log('❌ 未找到 Embedded EXE 起点'); process.exit(1); }
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

fs.writeFileSync(outDesktop, c, 'utf8');
console.log('✅ 最终版已生成（桌面）:', outDesktop, '(' + (c.length / 1048576).toFixed(1) + ' MB)');
fs.writeFileSync(outFolder, c, 'utf8');
console.log('✅ 最终版已生成（文件夹）:', outFolder);

/* 验证：内嵌封面与 EXE 都在 */
console.log('  含内嵌封面:', c.includes('data:text/html;charset=utf-8,'), '| 含内嵌EXE:', c.includes("const EMBEDDED_EXE_B64 = '"));
