const fs = require('fs');
const vm = require('vm');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); } catch(e){ console.error('no jsdom'); process.exit(3); }
const html = fs.readFileSync('/sessions/blissful-practical-archimedes/mnt/Civ/Gra-podglad-RERENDER.html','utf-8');
// extract the big IIFE bundle (the text/javascript script)
const m = html.match(/<script type="text\/javascript">([\s\S]*?)<\/script>/);
if(!m){ console.error('FAIL: no IIFE bundle found in deliverable'); process.exit(1); }
console.log('[deliverable] bundle length:', m[1].length, 'chars');
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', { pretendToBeVisual:true });
const { window } = dom;
let rafCount=0;
window.requestAnimationFrame = (cb)=>{ rafCount++; if(rafCount<3) return setTimeout(()=>cb(performance.now()),0); return 0; };
// minimal WebGL stub so three.js renderer construction doesn't throw
const origGetCtx = window.HTMLCanvasElement.prototype.getContext;
window.HTMLCanvasElement.prototype.getContext = function(t){ if(t&&t.indexOf('webgl')>=0){ return null; } return origGetCtx ? origGetCtx.call(this,t):null; };
global.window=window; global.document=window.document; global.navigator=window.navigator;
const ctx = vm.createContext(window);
let err=null;
try {
  vm.runInContext(m[1], ctx, { filename:'deliverable-bundle.js' });
  // fire DOMContentLoaded to trigger bootstrap
  const ev = window.document.createEvent('Event'); ev.initEvent('DOMContentLoaded', true, true);
  window.document.dispatchEvent(ev);
} catch(e){ err=e; }
setTimeout(()=>{
  if(err){ console.error('[deliverable] RUNTIME ERROR:', err && err.message); console.error((err&&err.stack||'').split('\n').slice(0,5).join('\n')); process.exit(1); }
  const banner = window.document.getElementById('__boot_err__');
  if(banner){ console.error('[deliverable] BOOT ERROR BANNER SHOWN:', banner.textContent.slice(0,300)); process.exit(1); }
  console.log('[deliverable] no boot errors; rAF calls:', rafCount);
  console.log('DELIVERABLE OK');
  process.exit(0);
}, 400);
