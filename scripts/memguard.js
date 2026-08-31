const fs=require('fs');
const p="C:/Users/Administrator/Doubao/chats/2026-08-26/new-chat-1/轻量版_最新.html";
let c=fs.readFileSync(p,'utf8');
const log=[];
// 替换内存守卫常量定义（分环境）
const oldHead=`    const MAX_TABS = 8;        // 非封面标签页上限
    const KEEP_TABS = 5;       // 超限后保留数量（含激活页）
    const HEAP_LIMIT = 50 * 1024 * 1024;   // 50MB
    const HEAP_SOFT = 42 * 1024 * 1024;    // 软阈值，提前清理
    const mem = (typeof performance !== 'undefined' && performance.memory) ? performance.memory : null;`;
const newHead=`    // ===== 内存限制（按环境区分：网页版严格，EXE 宽松） =====
    // 网页版：主程序 JS 堆 ≤ 50MB；打开网页后总内存 ≤ 1GB、显存 ≤ 0.5GB（通过标签页上限间接控制）
    // EXE 版（Electron）：限制放宽，标签页更多、内存容忍更高
    const IS_EXE_GUARD = (typeof IS_ELECTRON !== 'undefined' && IS_ELECTRON) ? true : false;
    const MAX_TABS = IS_EXE_GUARD ? 20 : 8;            // 非封面标签页上限（EXE 更宽松）
    const KEEP_TABS = IS_EXE_GUARD ? 12 : 5;           // 超限后保留数量（含激活页）
    const HEAP_LIMIT = IS_EXE_GUARD ? 200 * 1024 * 1024 : 50 * 1024 * 1024;  // 主程序 JS 堆上限
    const HEAP_SOFT = IS_EXE_GUARD ? 160 * 1024 * 1024 : 42 * 1024 * 1024;   // 软阈值，提前清理
    // 总内存（JS 堆 + iframe 渲染估算）上限：网页版 1GB，EXE 2GB
    const TOTAL_LIMIT = IS_EXE_GUARD ? 2048 * 1024 * 1024 : 1024 * 1024 * 1024;
    const TOTAL_SOFT = IS_EXE_GUARD ? 1536 * 1024 * 1024 : 768 * 1024 * 1024;
    // 单 iframe 渲染内存估算（用于总内存与显存估算）
    const IFRAME_MEM_EST = 70 * 1024 * 1024; // 约 70MB/个
    const mem = (typeof performance !== 'undefined' && performance.memory) ? performance.memory : null;`;
if(c.includes(oldHead)){ c=c.split(oldHead).join(newHead); log.push('✅ 常量已分环境'); }
else log.push('❌ 未找到常量定义');

// 添加总内存估算函数 + 总内存/显存监控（在 deepClean 函数后插入）
const oldDeep="      if (n > 0) flashShortMsg('🧹 已优化内存（当前 ' + heapMB() + 'MB）');\n    }";
const newDeep=`      if (n > 0) flashShortMsg('🧹 已优化内存（当前 ' + heapMB() + 'MB）');\n    }
    // 估算总内存（JS 堆 + 活跃 iframe 渲染内存），间接估算显存
    function memEstimate() {
      const heap = mem ? mem.usedJSHeapSize : 0;
      let active = 0;
      try {
        state.tabs.forEach(function(t){
          if (t && t.iframe && t.iframe.getAttribute && t.iframe.getAttribute('src')) {
            const s = t.iframe.getAttribute('src');
            if (s && s !== 'about:blank' && s.indexOf('about:') !== 0) active++;
          }
        });
      } catch(e){}
      return heap + active * IFRAME_MEM_EST;
    }
    function totalMB() { return (memEstimate() / 1048576).toFixed(0); }
    function gpuMB() { // 显存估算：主要来自活跃 WebGL/Canvas 页面
      let gl = 0;
      try {
        state.tabs.forEach(function(t){
          if (t && t.iframe && t.iframe.contentWindow) {
            try {
              const c = t.iframe.contentDocument;
              const canvases = c ? c.querySelectorAll('canvas') : [];
              if (canvases.length) gl++;
            } catch(e){}
          }
        });
      } catch(e){}
      return gl * 120; // 每个含 canvas 页面约 120MB 显存
    }`;
if(c.includes(oldDeep)){ c=c.split(oldDeep).join(newDeep); log.push('✅ 已添加总内存/显存估算'); }
else log.push('❌ 未找到 deepClean 锚点');

// 添加总内存监控 interval（在堆内存监控 setInterval 后，模块结束前）
const oldEnd=`      }, 15000);
    }
  })();`;
const newEnd=`      }, 15000);
    }
    // 总内存监控：网页版 >1GB / EXE >2GB 时强力回收后台标签页（控制内存与显存）
    setInterval(function(){
      try {
        const est = memEstimate();
        const gpu = gpuMB();
        if (est > TOTAL_LIMIT || gpu > (IS_EXE_GUARD ? 1000 : 500)) {
          console.warn('[mem-guard] 总内存=' + totalMB() + 'MB 显存~' + gpu + 'MB 超限，强力清理');
          deepClean();
        } else if (est > TOTAL_SOFT) {
          // 软清理：仅清缓存
          try {
            if (state.closedTabs.length) state.closedTabs = [];
            if (faviconMemoryCache && faviconMemoryCache.size > 100) faviconMemoryCache.clear();
          } catch(e){}
        }
      } catch(e){}
    }, 15000);
  })();`;
if(c.includes(oldEnd)){ c=c.split(oldEnd).join(newEnd); log.push('✅ 已添加总内存/显存监控'); }
else log.push('❌ 未找到模块结尾');

fs.writeFileSync(p,c,'utf8');
console.log(log.join('\n'));
// 语法验证
const vm=require('vm');
const re=/<script[^>]*>([\s\S]*?)<\/script>/g; let m, ok=true;
while((m=re.exec(c))){ if(m[1].trim()){ try{ new vm.Script(m[1]); }catch(e){ ok=false; console.log('❌ 语法:', e.message.split('\n')[0]); } } }
if(ok) console.log('✅ JS 语法正确');
