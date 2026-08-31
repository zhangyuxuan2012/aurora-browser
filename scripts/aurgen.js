const fs=require('fs');
// 从最新轻量版（含弹窗精简+内存守卫）重新生成开源 index.html，品牌化为极光
let c=fs.readFileSync("C:/Users/Administrator/Doubao/chats/2026-08-26/new-chat-1/轻量版_最新.html",'utf8');
// 品牌替换 张雨轩→极光
const rules=[
  ["张雨轩浏览器导航","极光浏览器 Aurora Browser"],
  ["张雨轩浏览器","极光浏览器"],
  ["张雨轩","极光"],
  ["zyx_","neb_"],
  ["TraeBrowser","AuroraBrowser"],
  ["trae-browser","aurora-browser"],
];
for(const [a,b] of rules){ c=c.split(a).join(b); }
// URL 通用化
c=c.split("return 'https://nebula2026.netlify.app';").join("return 'data:text/html;charset=utf-8,%3C!DOCTYPE%20html%3E%3Chtml%3E%3Cbody%20style%3D%22margin%3A0%3Bbackground%3A%23111a2c%3Bcolor%3A%23fff%3Bfont-family%3Asans-serif%3Bdisplay%3Aflex%3Balign-items%3Acenter%3Bjustify-content%3Acenter%3Bheight%3A100vh%22%3E%3Cdiv%20style%3D%22text-align%3Acenter%22%3E%3Ch1%3E%F0%9F%8C%8C%20%E6%9E%81%E5%85%89%E6%B5%8F%E8%A7%88%E5%99%A8%3C%2Fh1%3E%3Cp%3EAurora%20Browser%20-%20%E5%8F%AF%E5%9C%A8%E5%BA%94%E7%94%A8%E5%86%85%E2%80%9C%E5%B0%81%E9%9D%A2%E7%AE%A1%E7%90%86%E2%80%9D%E4%B8%8A%E4%BC%A0%E8%87%AA%E5%AE%9A%E4%B9%89%E5%B0%81%E9%9D%A2%3C%2Fp%3E%3C%2Fdiv%3E%3C%2Fbody%3E%3C%2Fhtml%3E'; // 内置欢迎封面");
c=c.split("当前使用在线导航主页（nebula2026.netlify.app）").join("当前使用内置欢迎封面（可在封面管理上传自定义封面）");
c=c.split("window.location.href = 'https://nebula2012.github.io/nebula111/';").join("window.location.href = 'https://aurora-browser.example.com/mobile';");
c=c.split('href="https://nebula2012.github.io/nebula111/"').join('href="https://aurora-browser.example.com/mobile"');
fs.writeFileSync("F:/nebula-browser/index.html",c,'utf8');
console.log("✅ 开源 index.html 已重新生成（极光+弹窗精简+内存守卫）");
// 验证
const c2=fs.readFileSync("F:/nebula-browser/index.html",'utf8');
const vm=require('vm');
const re=/<script[^>]*>([\s\S]*?)<\/script>/g; let m,ok=true;
while((m=re.exec(c2))){ if(m[1].trim()){ try{ new vm.Script(m[1]); }catch(e){ ok=false; console.log('❌ 语法:', e.message.split('\n')[0]); } } }
console.log(ok?'✅ 语法正确':'❌ 语法错误');
console.log("含极光:", c2.includes('极光'));
console.log("含弹窗精简:", c2.includes('不自动弹公告'));
console.log("含免密钥:", c2.includes('无需密钥'));
console.log("含内存守卫:", c2.includes('IS_EXE_GUARD'));
console.log("含永久代理:", c2.includes('【永久代理】'));
console.log("残留张雨轩:", (c2.match(/张雨轩/g)||[]).length);
console.log("残留星云:", (c2.match(/星云/g)||[]).length);
console.log("残留Nebula:", (c2.match(/Nebula/g)||[]).length);
