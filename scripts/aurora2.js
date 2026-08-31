const fs=require('fs');
const p="C:/Users/Administrator/Doubao/chats/2026-08-26/new-chat-1/轻量版_最新.html";
let c=fs.readFileSync(p,'utf8');
const log=[];
// ===== 1. 界面品牌统一：张雨轩浏览器导航 → 极光浏览器 =====
// 通用替换（覆盖标题/闪屏/欢迎/新标签页/菜单/注释/就绪/版本日志等 13 处）
const rep1=[
  ["张雨轩浏览器导航新手引导","极光浏览器新手引导"],
  ["张雨轩浏览器导航 V7.0","极光浏览器 V7.0"],
  ["张雨轩浏览器导航","极光浏览器"],
  ["张雨轩网站导航","极光网站导航"],
];
let n1=0;
for(const [a,b] of rep1){ const cnt=(c.match(new RegExp(a,'g'))||[]).length; if(cnt){ c=c.split(a).join(b); n1+=cnt; } }
log.push(`✅ 界面品牌替换 ${n1} 处`);

// ===== 2. 内嵌 EXE 文件名 → 极光 =====
let oldE="const EMBEDDED_EXE_NAME = '张雨轩浏览器导航-绿色免安装版.exe';";
let newE="const EMBEDDED_EXE_NAME = '极光浏览器-绿色免安装版.exe';";
if(c.includes(oldE)){ c=c.split(oldE).join(newE); log.push('✅ 内嵌EXE名→极光'); } else log.push('⚠️ 未找到EMBEDDED_EXE_NAME(可能在最终版)');
let oldR="const EMBEDDED_EXE_REL = './张雨轩浏览器导航-绿色免安装版.exe';";
let newR="const EMBEDDED_EXE_REL = './极光浏览器-绿色免安装版.exe';";
if(c.includes(oldR)){ c=c.split(oldR).join(newR); log.push('✅ 相对路径EXE名→极光'); }

// ===== 3. 剩余张雨轩（应只剩 about alert 里的开发者信息） =====
// about alert：保留产品名但加开发者信息
let oldA="alert('🚀 张雨轩浏览器导航 V7.0\\n\\n' + (IS_ELECTRON ? '桌面版 (Electron)' :";
// 上面已被通用替换改为 极光浏览器 V7.0
let oldAbout="alert('🚀 极光浏览器 V7.0\\n\\n' + (IS_ELECTRON ? '桌面版 (Electron)' :";
let newAbout="alert('🚀 极光浏览器 V7.0\\n开发者：张雨轩\\n\\n' + (IS_ELECTRON ? '桌面版 (Electron)' :";
if(c.includes(oldAbout)){ c=c.split(oldAbout).join(newAbout); log.push('✅ 关于面板保留开发者：张雨轩'); } else log.push('⚠️ 未找到 about alert');

// ===== 4. 全公开：checkCoverDevAuth 始终返回 true =====
let oldAuth="function checkCoverDevAuth() {\n    // 检查是否已通过开发者认证（不自动弹出面板，仅双击标签页时弹出）\n    try {";
let newAuth="function checkCoverDevAuth() {\n    // 【已公开】无需密钥/邀请码，所有功能直接可用\n    return true;\n    try {";
if(c.includes(oldAuth)){ c=c.split(oldAuth).join(newAuth); log.push('✅ 封面管理/开发者功能全公开'); } else log.push('⚠️ 未找到 checkCoverDevAuth 定义');

fs.writeFileSync(p,c,'utf8');
console.log(log.join('\n'));
// 验证剩余人名
const c2=fs.readFileSync(p,'utf8');
let i=0,n=0;
while((i=c2.indexOf('张雨轩',i))>=0){ n++; console.log(`  残留张雨轩 @${i}:`, JSON.stringify(c2.substring(Math.max(0,i-40), i+50))); i+=3; }
console.log("剩余张雨轩:", n, "处");
// 语法
const vm=require('vm');
const re=/<script[^>]*>([\s\S]*?)<\/script>/g; let m,ok=true;
while((m=re.exec(c2))){ if(m[1].trim()){ try{ new vm.Script(m[1]); }catch(e){ ok=false; console.log('❌ 语法:', e.message.split('\n')[0]); } } }
console.log(ok?'✅ JS 语法正确':'❌ 语法错误');
