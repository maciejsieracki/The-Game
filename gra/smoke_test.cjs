'use strict';
const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('/sessions/epic-jolly-heisenberg/mnt/Civ/gra/dist/index.html', 'utf-8');

// Find ALL script tags and pick the main bundle (the IIFE one)
const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/g;
let match;
let mainScript = null;
let scriptCount = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  scriptCount++;
  const content = match[2].trim();
  if (content.startsWith('(function') || content.length > 10000) {
    mainScript = content;
    console.log('[Smoke] Found main bundle script #' + scriptCount + ', length:', content.length);
  } else {
    console.log('[Smoke] Skipping script #' + scriptCount + ' (len:', content.length, '- likely boot overlay)');
  }
}
if (!mainScript) { console.error('No main bundle script found'); process.exit(1); }
console.log('[Smoke] First 150 chars of main bundle:', mainScript.slice(0, 150));

function makeFakeWebGL() {
  const noop = () => null;
  const noopv = () => {};
  return {
    getParameter: (p) => {
      if ([3379,34076,34024,3386,32888].includes(p)) return 4096;
      if (p===7936) return 'WebKit'; if (p===7937) return 'WebGL';
      if (p===7938) return 'WebGL 1.0'; if (p===35724) return 'WebGL GLSL ES 1.0';
      if ([34930,35661,34921].includes(p)) return 16;
      if ([36347,36349].includes(p)) return 1024;
      return null;
    },
    getShaderPrecisionFormat: (shaderType, precisionType) => ({ rangeMin: 127, rangeMax: 127, precision: 23 }),
    getExtension: (name) => {
      if (name==='OES_element_index_uint') return {};
      if (name==='WEBGL_lose_context') return {loseContext:noopv,restoreContext:noopv};
      if (name==='OES_texture_float') return {};
      if (name==='OES_texture_half_float') return {HALF_FLOAT_OES:0x8D61};
      if (name==='WEBGL_depth_texture') return {};
      if (name==='EXT_texture_filter_anisotropic') return {MAX_TEXTURE_MAX_ANISOTROPY_EXT:34046};
      if (name==='ANGLE_instanced_arrays') return {drawArraysInstancedANGLE:noopv,drawElementsInstancedANGLE:noopv,vertexAttribDivisorANGLE:noopv};
      if (name==='OES_vertex_array_object') return {createVertexArrayOES:()=>({}),bindVertexArrayOES:noopv,deleteVertexArrayOES:noopv};
      return null;
    },
    getSupportedExtensions:()=>[], isContextLost:()=>false,
    canvas:null, drawingBufferWidth:800, drawingBufferHeight:600,
    enable:noopv,disable:noopv,blendEquation:noopv,blendEquationSeparate:noopv,
    blendFunc:noopv,blendFuncSeparate:noopv,depthFunc:noopv,depthMask:noopv,depthRange:noopv,
    colorMask:noopv,clearColor:noopv,clearDepth:noopv,clearStencil:noopv,
    stencilFunc:noopv,stencilFuncSeparate:noopv,stencilMask:noopv,stencilMaskSeparate:noopv,
    stencilOp:noopv,stencilOpSeparate:noopv,cullFace:noopv,frontFace:noopv,
    scissor:noopv,viewport:noopv,clear:noopv,flush:noopv,finish:noopv,
    createBuffer:()=>({}),bindBuffer:noopv,bufferData:noopv,bufferSubData:noopv,deleteBuffer:noopv,
    createTexture:()=>({}),bindTexture:noopv,texImage2D:noopv,texSubImage2D:noopv,
    texParameteri:noopv,texParameterf:noopv,generateMipmap:noopv,deleteTexture:noopv,activeTexture:noopv,
    createFramebuffer:()=>({}),bindFramebuffer:noopv,framebufferTexture2D:noopv,
    framebufferRenderbuffer:noopv,checkFramebufferStatus:()=>36053,deleteFramebuffer:noopv,
    createRenderbuffer:()=>({}),bindRenderbuffer:noopv,renderbufferStorage:noopv,deleteRenderbuffer:noopv,
    createShader:()=>({}),shaderSource:noopv,compileShader:noopv,deleteShader:noopv,
    getShaderParameter:(s,p)=>p===35713?true:null,getShaderInfoLog:()=>null,
    createProgram:()=>({}),attachShader:noopv,linkProgram:noopv,useProgram:noopv,deleteProgram:noopv,
    getProgramParameter:(p,par)=>par===35714?true:null,getProgramInfoLog:()=>null,
    getUniformLocation:()=>({}),getAttribLocation:()=>0,
    uniform1i:noopv,uniform1f:noopv,uniform2f:noopv,uniform3f:noopv,uniform4f:noopv,
    uniform1fv:noopv,uniform2fv:noopv,uniform3fv:noopv,uniform4fv:noopv,
    uniform1iv:noopv,uniform2iv:noopv,uniform3iv:noopv,uniform4iv:noopv,
    uniformMatrix2fv:noopv,uniformMatrix3fv:noopv,uniformMatrix4fv:noopv,
    vertexAttrib1f:noopv,vertexAttrib2f:noopv,vertexAttrib3f:noopv,vertexAttrib4f:noopv,
    vertexAttrib1fv:noopv,vertexAttrib2fv:noopv,vertexAttrib3fv:noopv,vertexAttrib4fv:noopv,
    vertexAttribPointer:noopv,enableVertexAttribArray:noopv,disableVertexAttribArray:noopv,
    drawArrays:noopv,drawElements:noopv,pixelStorei:noopv,readPixels:noopv,
    VERTEX_SHADER:35633,FRAGMENT_SHADER:35632,COMPILE_STATUS:35713,LINK_STATUS:35714,
    ARRAY_BUFFER:34962,ELEMENT_ARRAY_BUFFER:34963,STATIC_DRAW:35044,DYNAMIC_DRAW:35048,STREAM_DRAW:35040,
    TEXTURE_2D:3553,TEXTURE_CUBE_MAP:34067,TEXTURE_WRAP_S:10242,TEXTURE_WRAP_T:10243,
    CLAMP_TO_EDGE:33071,REPEAT:10497,NEAREST:9728,LINEAR:9729,
    TEXTURE_MIN_FILTER:10241,TEXTURE_MAG_FILTER:10240,
    RGBA:6408,RGB:6407,UNSIGNED_BYTE:5121,FLOAT:5126,
    DEPTH_TEST:2929,BLEND:3042,CULL_FACE:2884,SCISSOR_TEST:3089,
    FRAMEBUFFER:36160,RENDERBUFFER:36161,
    COLOR_ATTACHMENT0:36064,DEPTH_ATTACHMENT:36096,DEPTH_STENCIL_ATTACHMENT:33306,DEPTH_STENCIL:34041,
    COLOR_BUFFER_BIT:16384,DEPTH_BUFFER_BIT:256,STENCIL_BUFFER_BIT:1024,
    TRIANGLES:4,TRIANGLE_STRIP:5,LINES:1,POINTS:0,
    UNSIGNED_SHORT:5123,UNSIGNED_INT:5125,
    SRC_ALPHA:770,ONE_MINUS_SRC_ALPHA:771,ONE:1,ZERO:0,FUNC_ADD:32774,
    TEXTURE0:33984,MAX_TEXTURE_SIZE:3379,
  };
}

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="app"></div></body></html>', {
  url: 'http://localhost/', pretendToBeVisual: true,
});
const { window } = dom;
const { document } = window;

let rafCallCount = 0;
window.requestAnimationFrame = (cb) => {
  rafCallCount++;
  console.log('[Smoke] rAF called #' + rafCallCount + ' — render loop reached!');
  return rafCallCount; // don't actually recurse
};
window.cancelAnimationFrame = () => {};
window.devicePixelRatio = 1;
window.innerWidth = 800;
window.innerHeight = 600;

window.HTMLCanvasElement.prototype.getContext = function(ctx) {
  console.log('[Smoke] getContext:', ctx);
  if (/webgl/i.test(ctx)) { const c = makeFakeWebGL(); c.canvas = this; return c; }
  return null;
};
window.HTMLCanvasElement.prototype.getBoundingClientRect = function() {
  return { left:0, top:0, width:800, height:600, right:800, bottom:600 };
};

if (!window.ResizeObserver) {
  window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
}

function setGlobal(key, val) {
  try { global[key] = val; } catch(e) {
    try { Object.defineProperty(global, key, { value: val, writable: true, configurable: true }); } catch(e2) {}
  }
}

setGlobal('window', window);
setGlobal('document', document);
setGlobal('devicePixelRatio', 1);
setGlobal('innerWidth', 800);
setGlobal('innerHeight', 600);
setGlobal('screen', window.screen || {width:1920,height:1080});
setGlobal('performance', window.performance || {now:()=>Date.now()});
setGlobal('HTMLCanvasElement', window.HTMLCanvasElement);
setGlobal('HTMLElement', window.HTMLElement);
setGlobal('Element', window.Element);
setGlobal('Node', window.Node);
setGlobal('Event', window.Event);
setGlobal('CustomEvent', window.CustomEvent);
setGlobal('MouseEvent', window.MouseEvent);
setGlobal('KeyboardEvent', window.KeyboardEvent);
setGlobal('WheelEvent', window.WheelEvent);
setGlobal('PointerEvent', window.PointerEvent || window.MouseEvent);
setGlobal('requestAnimationFrame', window.requestAnimationFrame);
setGlobal('cancelAnimationFrame', window.cancelAnimationFrame);
setGlobal('ResizeObserver', window.ResizeObserver);
setGlobal('addEventListener', (e,f,o)=>window.addEventListener(e,f,o));
setGlobal('removeEventListener', (e,f,o)=>window.removeEventListener(e,f,o));

console.log('[Smoke] Evaluating main bundle...');
let threw = false;
try {
  const fn = new Function(mainScript);
  fn();
  // The bundle registers a DOMContentLoaded listener when readyState === 'loading'.
  // jsdom starts with readyState 'complete' so boot() fires synchronously above.
  // But if for any reason the listener path is taken, dispatch the event now:
  if (rafCallCount === 0) {
    console.log('[Smoke] rAF not yet called — dispatching DOMContentLoaded to trigger boot()');
    const evt = new window.Event('DOMContentLoaded', { bubbles: true, cancelable: false });
    window.document.dispatchEvent(evt);
  }
  console.log('[Smoke] OK: Main bundle evaluated without throwing!');
  console.log('[Smoke] rAF call count:', rafCallCount);
  if (rafCallCount > 0) {
    console.log('[Smoke] PASS: RENDER LOOP REACHED (rAF called)');
  } else {
    console.log('[Smoke] WARN: render loop NOT reached (rAF never called) - check for caught errors above');
  }
} catch(err) {
  threw = true;
  console.error('[Smoke] BUNDLE ERROR:');
  console.error('  Message:', err.message);
  console.error('  Stack:', err.stack);
}
process.exit(threw ? 1 : 0);
