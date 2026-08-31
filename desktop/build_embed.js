// 构建"单文件整合版"HTML：将 Setup EXE 与绿色版 ZIP 以 base64 内嵌
const fs = require('fs');
const path = require('path');

const projectDir = 'C:\\Users\\Administrator\\Doubao\\chats\\2026-08-26\\new-chat-1';
const htmlPath = path.join(projectDir, '张雨轩浏览器导航_最终版.html');
const exePath = path.join(projectDir, 'trae-browser', 'dist', '张雨轩浏览器导航-Setup-7.0.0.exe');
const zipPath = path.join(projectDir, 'trae-browser', 'dist', '张雨轩浏览器导航-绿色版.zip');

// 优先从桌面取（dist 已清理），若无则报错
const desktop = 'C:\\Users\\Administrator\\Desktop\\张雨轩浏览器导航V7.0';
function pick(p, fallback) { return fs.existsSync(p) ? p : fallback; }
const exe = pick(exePath, path.join(desktop, '张雨轩浏览器导航-Setup-7.0.0.exe'));
const zip = pick(zipPath, path.join(desktop, '张雨轩浏览器导航-绿色版.zip'));

if (!fs.existsSync(htmlPath)) throw new Error('找不到最终HTML: ' + htmlPath);
if (!fs.existsSync(exe)) throw new Error('找不到EXE: ' + exe);
if (!fs.existsSync(zip)) throw new Error('找不到ZIP: ' + zip);

console.log('HTML:', fs.statSync(htmlPath).size, 'bytes');
console.log('EXE :', fs.statSync(exe).size, 'bytes');
console.log('ZIP :', fs.statSync(zip).size, 'bytes');

let html = fs.readFileSync(htmlPath, 'utf8');

const exeB64 = fs.readFileSync(exe).toString('base64');
const zipB64 = fs.readFileSync(zip).toString('base64');
console.log('EXE base64:', (exeB64.length/1024/1024).toFixed(1), 'MB');
console.log('ZIP base64:', (zipB64.length/1024/1024).toFixed(1), 'MB');

const inject = `<script>
/* ===== 桌面版安装包内嵌（base64 单文件，部署仅需本 HTML） ===== */
(function(){
  var EXE_B64="${exeB64}";
  var ZIP_B64="${zipB64}";
  window.__EMBEDDED_DOWNLOADS = { exe: EXE_B64, zip: ZIP_B64 };
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('#dm-pick a.dm-opt') : null;
    if (!a) return;
    var map = {
      'dm-download-setup': ['exe', '张雨轩浏览器导航-Setup-7.0.0.exe', 'application/x-msdownload'],
      'dm-download-zip'  : ['zip', '张雨轩浏览器导航-绿色版.zip',     'application/zip']
    };
    var cfg = map[a.id];
    if (!cfg) return;
    e.preventDefault();
    var b64 = window.__EMBEDDED_DOWNLOADS[cfg[0]];
    var toast = document.getElementById('__toast');
    if (!b64) { alert('桌面版安装包缺失，请使用完整版 HTML'); return; }
    if (toast) toast.textContent = '⏳ 正在准备 ' + cfg[1] + '（约' + (cfg[0]==='exe'?'1':'2') + '秒）…';
    setTimeout(function(){
      try {
        var bin = atob(b64);
        var bytes = new Uint8Array(bin.length);
        for (var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
        var blob = new Blob([bytes],{type:cfg[2]});
        var url = URL.createObjectURL(blob);
        var dl = document.createElement('a');
        dl.href = url; dl.download = cfg[1];
        document.body.appendChild(dl); dl.click();
        setTimeout(function(){ URL.revokeObjectURL(url); dl.remove(); }, 5000);
        if (toast) toast.textContent = '⬇️ 已开始下载 ' + cfg[1];
      } catch(err){ alert('下载失败：' + err.message); }
    }, 30);
  });
})();
</script>
</body>`;

// 替换最后一个 </body>，并保留其后的内容（如 </html>）
const idx = html.lastIndexOf('</body>');
if (idx === -1) throw new Error('HTML 中未找到 </body>');
const tail = html.slice(idx + '</body>'.length);
html = html.slice(0, idx) + inject + tail;

const outDir = 'F:\\张雨轩浏览器导航V7.0';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, '张雨轩浏览器导航_单文件整合版.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('✅ 已生成:', outPath);
console.log('   单文件大小:', (fs.statSync(outPath).size/1024/1024).toFixed(1), 'MB');
