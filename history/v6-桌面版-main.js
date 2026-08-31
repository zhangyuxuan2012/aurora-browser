/**
 * 极光浏览器 V7.0 —— 桌面版主进程（自动下载器模式）
 *
 * 设计目标：
 *   1. 网站部署在线上（静态托管，如 netlify / GitHub Pages / OSS 等）
 *   2. 用户拿到 EXE，双击即可 —— 程序自动从线上地址下载最新版网站到本地缓存，
 *      然后作为桌面应用运行（无需安装，无需解压，首次自动拉取）
 *   3. 下载过一次后本地缓存，断网也能启动（离线可用）
 *   4. 菜单「检查更新」可随时重新拉取线上最新版
 *
 * 部署时：把 index.html 发布到 APP_SOURCE_URL 指向的地址，
 * 并把 APP_SOURCE_URL 改成你自己的线上地址后重新打包即可。
 */
const { app, BrowserWindow, shell, Menu, ipcMain, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

/* ============================================================
 * 网站源地址：改为你线上部署 index.html 的完整地址
 * 可用环境变量 APP_SOURCE_URL 覆盖（便于部署前本地测试）
 * ============================================================ */
const APP_SOURCE_URL = process.env.APP_SOURCE_URL || '';  // 默认空：直接运行内嵌完整版（离线可用）；设置后启用线上更新

const DOWNLOAD_TIMEOUT = 30000; // 30 秒
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

let mainWindow = null;
let booting = false;

const WEB_PREFS = {
  webviewTag: true,
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  spellcheck: false,
  preload: path.join(__dirname, 'preload.js')
};

/* ---------- 缓存与下载 ---------- */
function cacheFile() {
  return path.join(app.getPath('userData'), 'cached-index.html');
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = /^https:/i.test(url) ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        httpGet(new URL(res.headers.location, url).toString()).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error('服务器返回 ' + res.statusCode));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (!buf.length) return reject(new Error('下载内容为空'));
        resolve(buf);
      });
    });
    req.on('error', reject);
    req.setTimeout(DOWNLOAD_TIMEOUT, () => req.destroy(new Error('连接超时')));
  });
}

async function downloadLatest() {
  const buf = await httpGet(APP_SOURCE_URL);
  fs.mkdirSync(path.dirname(cacheFile()), { recursive: true });
  fs.writeFileSync(cacheFile(), buf);
  return cacheFile();
}

/* ---------- 启动状态页 ---------- */
function bootPageHtml() {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  html,body{height:100%;margin:0;background:#dee1e6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;
    display:flex;align-items:center;justify-content:center;color:#202124;-webkit-user-select:none;user-select:none}
  .box{text-align:center;padding:32px}
  .logo{width:72px;height:72px;border-radius:20px;background:linear-gradient(135deg,#1a73e8,#4285f4);
    display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:36px;box-shadow:0 6px 20px rgba(26,115,232,.35)}
  h1{font-size:20px;margin:0 0 8px}
  #status{font-size:14px;color:#5f6368;min-height:20px}
  .spinner{width:26px;height:26px;border:3px solid rgba(26,115,232,.2);border-top-color:#1a73e8;border-radius:50%;
    margin:0 auto 16px;animation:sp 1s linear infinite}
  @keyframes sp{to{transform:rotate(360deg)}}
  .btn{margin-top:16px;padding:10px 22px;border:none;border-radius:10px;background:#1a73e8;color:#fff;font-size:14px;cursor:pointer}
  .err{color:#ea4335;font-size:13px;margin-top:8px;line-height:1.6}
</style></head><body><div class="box">
  <div class="logo">🌐</div>
  <h1>极光浏览器</h1>
  <div class="spinner" id="spin"></div>
  <div id="status">正在启动…</div>
  <div class="err" id="err" style="display:none"></div>
  <button class="btn" id="retry" style="display:none">重试</button>
</div></body></html>`;
}

function errorPageHtml(msg) {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{height:100%;margin:0;background:#dee1e6;font-family:-apple-system,'Segoe UI','Microsoft YaHei',sans-serif;
display:flex;align-items:center;justify-content:center;color:#202124}
.box{text-align:center;max-width:480px;padding:24px}
h1{font-size:20px}.err{color:#ea4335;font-size:13px;line-height:1.7}
.btn{margin-top:16px;padding:10px 22px;border:none;border-radius:10px;background:#1a73e8;color:#fff;font-size:14px;cursor:pointer}
</style></head><body><div class="box">
  <h1>⚠️ 无法加载网站</h1>
  <p class="err">首次使用需要联网下载网站内容。<br>${msg}</p>
  <button class="btn" id="retry">重试</button>
</div><script>
  document.getElementById('retry').addEventListener('click', function(){ location.reload(); });
</script></body></html>`;
}

function setStatus(text) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript(
      `(function(){var el=document.getElementById('status');if(el){el.textContent=${JSON.stringify(text)};}})();`
    ).catch(() => {});
  }
}

/* ---------- 启动流程 ---------- */
async function boot() {
  if (booting) return;
  booting = true;
  try {
    const localApp = path.join(__dirname, 'index.html');
    // 未配置线上源（默认）→ 直接运行内嵌完整版（内置浏览器+导航+游戏，离线可用）
    if (!APP_SOURCE_URL) {
      setStatus('正在启动…');
      loadApp(localApp);
      return;
    }
    // 已配置线上源 → 在线更新模式：有缓存用缓存，否则从线上拉取
    if (fs.existsSync(cacheFile()) && fs.statSync(cacheFile()).size > 0) {
      setStatus('正在启动…');
      loadApp(cacheFile());
      return;
    }
    setStatus('首次使用：正在下载网站到本地…');
    const f = await downloadLatest();
    setStatus('下载完成，正在启动…');
    loadApp(f);
  } catch (e) {
    booting = false;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorPageHtml((e && e.message) || '网络异常')));
    }
  } finally {
    booting = false;
  }
}

function loadApp(file) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadFile(file);
  }
}

/* ---------- 检查更新（重新下载） ---------- */
async function forceUpdate() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (!APP_SOURCE_URL) {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    return;
  }
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(bootPageHtml()));
  setStatus('正在检查更新并下载…');
  try {
    const f = await downloadLatest();
    setStatus('更新完成，正在启动…');
    loadApp(f);
  } catch (e) {
    setStatus('更新失败：' + ((e && e.message) || '网络异常'));
  }
}

/* ---------- 默认浏览器与外部跳转 ---------- */
// 注册为 http/https 协议处理程序（可在 Windows 中设为默认浏览器）
function registerProtocolClient() {
  try {
    app.setAsDefaultProtocolClient('http');
    app.setAsDefaultProtocolClient('https');
  } catch (e) { console.error('[Nebula] 注册协议失败:', e); }
}

ipcMain.handle('app:set-default-browser', () => {
  registerProtocolClient();
  // 打开 Windows 默认应用设置，引导用户确认
  try { shell.openExternal('ms-settings:defaultapps'); } catch (e) {}
  return true;
});

ipcMain.handle('app:open-external', (_e, url) => {
  try { if (typeof url === 'string' && /^(https?:|mailto:)/i.test(url)) shell.openExternal(url); } catch (e) {}
  return true;
});

/* ---------- Chrome 扩展（插件）支持 · 基于真实 Chromium 内核 ---------- */
function extensionsDir() { return path.join(app.getPath('userData'), 'extensions'); }

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dst, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

async function loadInstalledExtensions() {
  try {
    const dir = extensionsDir();
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      try {
        if (fs.statSync(p).isDirectory()) await session.defaultSession.loadExtension(p);
      } catch (e) { console.error('[Nebula] 加载插件失败:', name, (e && e.message) || ''); }
    }
  } catch (e) { console.error('[Nebula] 插件目录读取失败:', e); }
}

function extensionMeta(ext) {
  return { id: ext.id, name: ext.name || '未命名插件', version: ext.version || '', path: ext.path || '' };
}

ipcMain.handle('app:install-extension', async () => {
  try {
    const res = await dialog.showOpenDialog(mainWindow, {
      title: '选择 Chrome 插件目录（解压后的文件夹，内含 manifest.json）',
      buttonLabel: '安装此插件',
      properties: ['openDirectory']
    });
    if (res.canceled || !res.filePaths.length) return { ok: false, msg: '已取消' };
    const src = res.filePaths[0];
    if (!fs.existsSync(path.join(src, 'manifest.json'))) return { ok: false, msg: '该文件夹不是有效的 Chrome 插件（缺少 manifest.json）' };
    const dstDir = extensionsDir();
    fs.mkdirSync(dstDir, { recursive: true });
    const dst = path.join(dstDir, path.basename(src) + '-' + Date.now());
    copyDir(src, dst);
    try {
      const ext = await session.defaultSession.loadExtension(dst);
      return { ok: true, ext: extensionMeta(ext) };
    } catch (e) {
      try { fs.rmSync(dst, { recursive: true, force: true }); } catch (e2) {}
      return { ok: false, msg: '无法加载该插件（Electron 暂不支持此插件的部分 API）：' + ((e && e.message) || '格式不支持') };
    }
  } catch (e) { return { ok: false, msg: '安装过程出错' }; }
});

ipcMain.handle('app:remove-extension', (_e, id) => {
  try {
    try { session.defaultSession.removeExtension(id); } catch (e) {}
    const dir = extensionsDir();
    if (fs.existsSync(dir)) {
      for (const name of fs.readdirSync(dir)) {
        if (name.includes(String(id).substring(0, 16))) {
          try { fs.rmSync(path.join(dir, name), { recursive: true, force: true }); } catch (e) {}
        }
      }
    }
    return { ok: true };
  } catch (e) { return { ok: false, msg: '卸载失败' }; }
});

ipcMain.handle('app:list-extensions', () => {
  try {
    const list = [];
    for (const ext of session.defaultSession.extensions.values()) list.push(extensionMeta(ext));
    return list;
  } catch (e) { return []; }
});

/* ---------- 隐私保护 ---------- */
ipcMain.handle('app:clear-browsing-data', async () => {
  try {
    const ses = session.defaultSession;
    await ses.clearCache();
    await ses.clearStorageData({ storages: ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'cachestorage'] });
    return { ok: true };
  } catch (e) { return { ok: false, msg: '清理失败' }; }
});

/* ---------- 窗口 ---------- */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: '极光浏览器 V7.0',
    backgroundColor: '#dee1e6',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: WEB_PREFS
  });

  // window.open（target=_blank / 无痕窗口）
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (typeof url === 'string' && url.startsWith('file://')) {
      const w = new BrowserWindow({ width: 1100, height: 760, autoHideMenuBar: true, webPreferences: WEB_PREFS });
      w.loadURL(url);
      return { action: 'deny' };
    }
    if (/^https?:/i.test(url) || /^mailto:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // 禁止主窗口被导航离开本地应用
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (typeof url === 'string' && !url.startsWith('file://')) {
      e.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (mainWindow && mainWindow.getURL().startsWith('file://')) booting = false;
  });

  mainWindow.on('closed', () => { mainWindow = null; });
  // 渲染进程崩溃 / 页面无响应：自动恢复，不静默退出
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    try {
      console.error('[Nebula] render-process-gone:', details && details.reason);
      if (details && details.reason === 'clean-exit') return;
      if (crashRecoveryTimer) return;
      crashRecoveryTimer = setTimeout(() => {
        crashRecoveryTimer = null;
        try {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.loadFile(path.join(__dirname, 'index.html'));
          }
        } catch (e) {}
      }, 600);
    } catch (e) {}
  });
  mainWindow.on('unresponsive', () => {
    try { console.error('[Nebula] 页面无响应，等待恢复…'); } catch (e) {}
  });
  mainWindow.webContents.on('did-fail-load', (_event, code, desc, validatedURL) => {
    // 加载失败不关闭窗口，保留页面便于重试
    try { console.error('[Nebula] did-fail-load:', code, desc); } catch (e) {}
    // 无法访问（连接被拒/DNS解析失败/断网/超时等连接类错误）→ 自动用系统默认浏览器打开，保证网页始终可用
    const CONN_ERR = [-102, -105, -106, -118, -137, -20, -7, -15, -21, -3];
    try {
      if (validatedURL && /^https?:/i.test(validatedURL) && CONN_ERR.indexOf(code) >= 0) {
        console.error('[Nebula] 页面无法访问，自动跳转系统浏览器打开:', validatedURL);
        shell.openExternal(validatedURL);
      }
    } catch (e) {}
  });

  // 启动：先显示状态页，再下载/启动
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(bootPageHtml()));
  boot();
}

function buildMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: '应用',
      submenu: [
        { label: '重新加载网站', accelerator: 'CmdOrCtrl+Shift+U', click: () => forceUpdate() },
        { type: 'separator' },
        { label: '退出', role: 'quit' }
      ]
    },
    { label: '编辑', submenu: [
      { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
      { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectall' }
    ]},
    { label: '视图', submenu: [
      { role: 'reload' }, { role: 'togglefullscreen' }
    ]}
  ]);
  Menu.setApplicationMenu(menu);
}

/* ============================================================
 * 崩溃保护 / 异常恢复（防止应用突然退出）
 * ============================================================ */
let crashRecoveryTimer = null;
// 未捕获异常 / Promise 拒绝：记录日志，不直接退出
process.on('uncaughtException', (err) => {
  try { console.error('[Nebula] uncaughtException:', err && err.message); } catch (e) {}
});
process.on('unhandledRejection', (reason) => {
  try { console.error('[Nebula] unhandledRejection:', reason); } catch (e) {}
});
// 子进程（渲染进程/GPU进程）异常退出
app.on('child-process-gone', (_event, details) => {
  try {
    console.error('[Nebula] child-process-gone:', details && details.type, details && details.reason);
    // 渲染进程崩溃：尝试恢复主窗口
    if (details && details.type === 'renderer' && mainWindow && !mainWindow.isDestroyed()) {
      if (crashRecoveryTimer) return; // 防止崩溃风暴
      crashRecoveryTimer = setTimeout(() => {
        crashRecoveryTimer = null;
        try {
          if (mainWindow && !mainWindow.isDestroyed()) {
            const cur = mainWindow.webContents.getURL();
            mainWindow.loadFile(path.join(__dirname, 'index.html'));
            console.error('[Nebula] 渲染进程已恢复');
          }
        } catch (e) {}
      }, 800);
    }
  } catch (e) {}
});
// 主进程全局兜底：渲染进程崩溃后即使窗口关闭也不退出，允许恢复
app.on('before-quit', (e) => {
  // 若存在恢复中的主窗口，阻止立即退出
  if (crashRecoveryTimer && mainWindow && !mainWindow.isDestroyed()) {
    e.preventDefault();
  }
});

app.whenReady().then(() => {
  registerProtocolClient();
  loadInstalledExtensions();
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // 若有崩溃恢复中的主窗口，不立即退出
  if (crashRecoveryTimer && mainWindow && !mainWindow.isDestroyed()) {
    return;
  }
  if (process.platform !== 'darwin') app.quit();
});
