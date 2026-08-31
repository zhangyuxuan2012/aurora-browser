const fs = require('fs');
const p = 'F:\\张雨轩浏览器导航V7.0\\张雨轩浏览器导航_单文件整合版.html';
const c = fs.readFileSync(p, 'utf8');
console.log('文件大小:', (c.length / 1024 / 1024).toFixed(1), 'MB');
console.log('以</html>结尾:', c.trimEnd().endsWith('</html>'));
const reExe = /EXE_B64="([^"]+)"/;
const reZip = /ZIP_B64="([^"]+)"/;
const mExe = c.match(reExe);
const mZip = c.match(reZip);
if (!mExe || !mZip) { console.error('❌ 未找到内嵌常量'); process.exit(1); }
const exeB64 = mExe[1], zipB64 = mZip[1];
const exe = Buffer.from(exeB64, 'base64');
const zip = Buffer.from(zipB64, 'base64');
console.log('EXE 解码:', exe.length, 'bytes, 头:', exe.slice(0, 2).toString('ascii'), '| 期望 81847103 / MZ');
console.log('ZIP 解码:', zip.length, 'bytes, 头:', zip.slice(0, 2).toString('ascii'), '| 期望 115103795 / PK');
console.log('EXE完整:', exe.length === 81847103, '| ZIP完整:', zip.length === 115103795);
const ok = exe.length === 81847103 && zip.length === 115103795 && exe.slice(0,2).toString('ascii') === 'MZ' && zip.slice(0,2).toString('ascii') === 'PK';
console.log(ok ? '✅ 内嵌数据完整无误' : '❌ 数据异常');
process.exit(ok ? 0 : 1);
