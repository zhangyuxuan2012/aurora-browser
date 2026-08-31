/**
 * 极光浏览器 V7.0 —— preload（上下文隔离桥接）
 * 只暴露最小、安全的 API 给页面（contextIsolation 下仅此通道）：
 *   1. setDefaultBrowser():  引导将极光设为 Windows 默认浏览器
 *   2. openExternal(url):     在系统默认浏览器中打开
 *   3. installExtension():    Chrome 插件安装（选择解压目录）
 *   4. removeExtension(id):   卸载已装插件
 *   5. listExtensions():      列出已加载插件
 *   6. clearBrowsingData():   一键清除缓存/记录/Cookie（隐私）
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('auroraAPI', {
  setDefaultBrowser: () => ipcRenderer.invoke('app:set-default-browser'),
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url),
  installExtension: () => ipcRenderer.invoke('app:install-extension'),
  removeExtension: (id) => ipcRenderer.invoke('app:remove-extension', id),
  listExtensions: () => ipcRenderer.invoke('app:list-extensions'),
  clearBrowsingData: () => ipcRenderer.invoke('app:clear-browsing-data'),
  importFromInstalledBrowsers: () => ipcRenderer.invoke('app:import-installed')
});
