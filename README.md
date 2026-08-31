# 🌌 极光浏览器（Aurora Browser）

> **纯净 · 高度自定义 · 防弹窗** —— 网页版与桌面版通用的极简浏览器（浏览器 / 浏览器导航 / 单文件 HTML 浏览器）。
> 基于真实 Chromium（Electron）内核，支持安装 Chrome 插件、导入其他浏览器书签、设为默认浏览器，Windows / macOS 双平台。

**在线体验**：https://zhangyuxuan2012.github.io/zhangyuxuan/

---

## ⬇️ 下载中心

| 版本 | 文件 | 获取方式 |
| --- | --- | --- |
| **网页版（在线使用，含移动端适配）** | 单文件 HTML（1.3MB） | 直接打开在线体验链接，或从 `html/` 下载 |
| **完整版（单文件内嵌 EXE）** | `AuroraBrowser-Web-v7.0.0.html`（95.8MB） | [GitHub Release 下载](https://github.com/zhangyuxuan2012/aurora-browser/releases/latest/download/AuroraBrowser-Web-v7.0.0.html) |
| **桌面版 EXE（绿色免安装）** | `AuroraBrowser-Portable-v7.0.0.exe`（70.9MB） | [GitHub Release 下载](https://github.com/zhangyuxuan2012/aurora-browser/releases/latest/download/AuroraBrowser-Portable-v7.0.0.exe) |
| **历史版本** | v6 各版本 HTML / JS | `history/` 目录 |

> 💡 **网页版一键下载桌面版**：网页版的「下载桌面版」按钮会直接从 GitHub Release 稳定链接获取 EXE，
> 任何电脑（Windows / macOS）打开网页版都能下载到完整 EXE，无需依赖发布者本机。
>
> Release 页面：https://github.com/zhangyuxuan2012/aurora-browser/releases

---

## ✨ 项目简介

极光浏览器是一款**单文件 HTML + Electron 桌面版**双形态浏览器：

- **网页版（HTML）**：打开即用，无需安装任何环境；支持移动端触控适配；可一键下载桌面版 EXE。
- **桌面版（EXE）**：基于真实 Chromium（Electron）内核，无内嵌网页"拒绝访问"限制，功能完整，流畅稳定。

它主打三个方向：

| 方向 | 说明 |
| --- | --- |
| 🧼 **纯净** | 极简界面、无广告、无追踪、无多余弹窗，开箱即用 |
| 🎨 **高度自定义** | 主题、封面、快捷键、插件、书签、浏览数据均可按需配置 |
| 🛡️ **防弹窗** | 内置防弹窗引擎，拦截广告/空白/图片直链等弹窗，把合法新窗口接入标签页 |

---

## 🚀 快速使用

### 网页版 / 移动版
打开 https://zhangyuxuan2012.github.io/zhangyuxuan/ 即可直接使用，电脑手机通用，无需安装任何东西。

### 桌面版（Windows EXE）
- 下载 `AuroraBrowser-Portable-v7.0.0.exe`（绿色免安装，双击即用）
- 可选：设置 → 设为默认浏览器（Windows 默认应用列表中选择「极光浏览器」）
- 支持加载真实 Chrome 插件（解压后的扩展目录）

### macOS
- 桌面版源码支持 macOS（`npm run dist:mac` 在 Mac 上构建 dmg/zip）
- 在 Mac 上也可以直接使用网页版

---

## 🧩 特色功能

- **多标签页 + 固定标签**：标签自由拖拽、长按固定、右键菜单
- **书签 / 历史 / 下载管理**：本机持久化存储
- **内置网站导航（200+ 站点）**：游戏、AI 工具、设计、影音、生活等多分类一键直达
- **内置 AI 助手**：封面页智能问答、智能推荐
- **🛡️ 内置防弹窗插件「极光防弹窗」**：默认开启，可统计拦截数量、随时开关
- **🧩 网页版插件系统**：网页版也能安装插件（manifest 驱动：注入 CSS/JS、整站拦截规则、防弹窗增强）
- **📥 导入其他浏览器数据**：一键导入 Chrome / Edge / Firefox 的书签（网页版手动选文件，桌面版自动扫描本机浏览器）
- **🕶️ 隐私浏览（无痕）**：快捷键 `Ctrl+Shift+P` 或菜单一键开启，开启后历史 / 书签 / 设置均不落盘（Chrome 无痕同款体验），界面显示隐私徽标，关闭后一切恢复
- **🎨 标签页个性化**：右键任意标签页 →「自定义标签外观」，可为每个标签单独设置 10 种颜色 + 5 种动态效果（呼吸 / 流光 / 脉冲 / 光晕等），互不影响
- **🔒 隐私保护**：一键清除缓存 / Cookie / 本地记录
- **🌐 设为默认浏览器**：桌面版注册为 Windows 默认浏览器候选

---

## 📂 项目结构

```
├── index.html                  # 网页版（在线使用，GitHub Pages 部署）
├── game-portal2.0.html          # 🧭 内置封面导航网站（触控/跳转已修复）
├── html/                       # 单文件 HTML 版本
│   └── 极光浏览器-网页版（移动端适配）.html
├── desktop/                    # Electron 桌面版源码
│   ├── main.js                 # 主进程（默认浏览器/插件/导入/崩溃恢复）
│   ├── preload.js              # 上下文隔离桥接（安全 API）
│   ├── index.html              # 桌面版加载的页面（与网页版同源）
│   └── build/                  # 图标资源
├── history/                    # 📜 历史版本及介绍
│   ├── HISTORY.md              # 版本演进记录
│   ├── v6-张雨轩浏览器导航_最终版.html
│   ├── v6-轻量版.html
│   ├── v6-封面页-游戏门户.html
│   ├── v6-封面页-改造前.html
│   └── v6-桌面版-main.js
├── scripts/                    # 构建/生成脚本
├── README.md
└── LICENSE                     # MIT License
```

---

## 📝 更新日志

### v7.2（隐私浏览 · 标签个性化 · 封面修复 · 下载链路升级）
- 🕶️ **隐私浏览（无痕）**：`Ctrl+Shift+P` 或菜单/设置一键开启，历史、书签、设置均不落盘，顶部显示隐私徽标，关闭即恢复（Chrome 无痕同款）
- 🎨 **标签页自定义**：右键标签 →「自定义标签外观」，10 种标签颜色 + 5 种动态效果（呼吸/流光/脉冲/光晕/闪耀），每个标签独立设置、一键恢复默认
- 🛠️ **封面网站修复**（game-portal2.0.html）：补全 `showIsland` 灵动岛提示（此前只调用未定义，切换分类/收藏无反馈）；左右滑分类手势 `closest` 容错（触控快速滑动不再报错）；外链打开被嵌套 iframe 拦截时自动降级为 `postMessage` 在浏览器内部标签打开；`vibrate` 安全封装
- ⬇️ **下载链路升级**：网页版「下载桌面版」改为从 GitHub Release 稳定链接获取 EXE（`releases/latest/download`），任何电脑（Windows/macOS）打开网页即可下载，不再依赖同目录文件；EXE 作为 Release 资产入库、不进 git 仓库（仓库体积不膨胀）
- 🖥️ **EXE 重建**：基于 V7.2 全新构建，含上述全部修复与隐私功能

### v7.1.1（真实功能修复 · 触控/滚动/溢出）
- 🛠️ **横向溢出修复**：工具栏 flex 收缩修复（`min-width:0`），手机/平板窄屏不再横向溢出、不再出现文字被截断/撑破
- 📱 **移动端工具栏精简**：窄屏自动收起次要按钮（主页/查找/书签/历史/下载/封面切换），全部功能仍可在 `⋮` 菜单访问
- 🖱️ **弹窗滚轮修复**：下载弹窗增加 `max-height + overflow-y:auto`，内容多时可滚动；侧边/设置面板滚动兜底
- 👆 **触控屏优化**：所有面板/弹窗/菜单滚动区域支持触摸滚动（`touch-action: pan-y`），真实触控实测通过
- ✏️ **地址栏溢出修复**：修正 V7.1 中地址栏 CSS 选择器错误（`#address-bar`），长网址不再撑破布局
- 🔤 **全局文字换行兜底**：菜单/弹窗/面板文本 `overflow-wrap: anywhere`，任何长内容不再溢出

### v7.0
- 内置防弹窗引擎 + 网页版插件系统（可安装 Chrome 插件、导入浏览器数据）
- 桌面版基于 Chromium（Electron）内核，支持设为默认浏览器、加载真实 Chrome 插件
- 绿色免安装 EXE，Windows / macOS 双平台源码

---

## 🛠️ 从源码构建（桌面版）

```bash
cd desktop
npm install
npm start            # 本地运行
npm run dist:win     # 构建 Windows 便携版 EXE
npm run dist:mac     # 在 macOS 上构建 dmg/zip
```

---

## 📄 开源协议

本项目基于 **MIT License** 开源，欢迎学习、使用与二次开发。

## 📢 免责声明

- 网页版受宿主浏览器安全策略限制：部分拒绝 `iframe` 内嵌的网站会提示下载桌面版。
- 桌面版基于 Electron（Chromium 内核），无此限制，功能完整。
- 本项目仅供学习交流使用，请遵守当地法律法规。

---

© 2026 张雨轩（zhangyuxuan2012）
