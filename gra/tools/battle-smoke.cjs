'use strict';
/**
 * battle-smoke.cjs — headless smoke test for The Game battle path.
 * Run: node tools/battle-smoke.cjs   (from gra/ directory)
 *
 * Exercises the full battle path:
 *   1. Boot the game (same as smoke.cjs)
 *   2. Dispatch keydown 'T' -> launchTestBattle -> showPreBattle overlay
 *   3. Click 'Bitwa ręczna' button -> new BattleScene(...) constructor runs
 *   4. Assert no errors (catches "styleButton is not defined" and similar)
 *   5. Click 'Auto' button -> onAuto path (bonus check)
 *
 * SUCCESS: prints "BATTLE SMOKE OK" and exits 0
 * FAILURE: prints "BATTLE SMOKE FAIL" + error and exits 1
 */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const os   = require('os');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) { console.error('[battle-smoke] jsdom not installed — run: npm i -D jsdom'); process.exit(1); }

// ---------------------------------------------------------------------------
// 1. Read and parse dist/index.html
// ---------------------------------------------------------------------------
const htmlPath = path.resolve(__dirname, '..', 'dist', 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('[battle-smoke] dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}
const html = fs.readFileSync(htmlPath, 'utf-8');

const scriptRe = /<script([^>]*)>([\s\S]*?)<\/script>/g;
let m, scripts = [];
while ((m = scriptRe.exec(html)) !== null) {
  scripts.push({ attrs: m[1], body: m[2].trim() });
}

const mainScript = scripts.slice().sort((a, b) => b.body.length - a.body.length)[0];
if (!mainScript || mainScript.body.length < 10000) {
  console.error('[battle-smoke] Could not locate the main IIFE bundle inside dist/index.html.');
  process.exit(1);
}
console.log('[battle-smoke] main bundle length:', mainScript.body.length, 'chars');

const tmpJs = path.join(os.tmpdir(), 'battle_smoke_bundle_eval.js');
fs.writeFileSync(tmpJs, mainScript.body, 'utf-8');

// ---------------------------------------------------------------------------
// 2. Build a thorough fake WebGL2 context (identical to smoke.cjs)
// ---------------------------------------------------------------------------
function makeFakeWebGL() {
  const noop   = () => {};
  let   handle = 0;
  const obj    = () => ({ __h: ++handle });

  const CONSTS = {
    VERSION: 7938, VENDOR: 7936, RENDERER: 7937,
    SHADING_LANGUAGE_VERSION: 35724,
    HIGH_FLOAT: 36338, MEDIUM_FLOAT: 36337, LOW_FLOAT: 36336,
    HIGH_INT: 36341, MEDIUM_INT: 36340, LOW_INT: 36339,
    VERTEX_SHADER: 35633, FRAGMENT_SHADER: 35632,
    MAX_TEXTURE_SIZE: 3379, MAX_CUBE_MAP_TEXTURE_SIZE: 34076,
    MAX_RENDERBUFFER_SIZE: 34024,
    MAX_TEXTURE_IMAGE_UNITS: 34930, MAX_VERTEX_TEXTURE_IMAGE_UNITS: 35660,
    MAX_COMBINED_TEXTURE_IMAGE_UNITS: 35661,
    MAX_VERTEX_ATTRIBS: 34921, MAX_VARYING_VECTORS: 36221,
    MAX_VERTEX_UNIFORM_VECTORS: 36347, MAX_FRAGMENT_UNIFORM_VECTORS: 36349,
    MAX_UNIFORM_BUFFER_BINDINGS: 35375, MAX_SAMPLES: 36183,
    SCISSOR_BOX: 3088, VIEWPORT: 2978,
    IMPLEMENTATION_COLOR_READ_FORMAT: 35739, IMPLEMENTATION_COLOR_READ_TYPE: 35738,
    COMPILE_STATUS: 35713, LINK_STATUS: 35714, VALIDATE_STATUS: 35715,
    ACTIVE_ATTRIBUTES: 35721, ACTIVE_UNIFORMS: 35718, ACTIVE_UNIFORM_BLOCKS: 35382,
    DELETE_STATUS: 35712,
    ARRAY_BUFFER: 34962, ELEMENT_ARRAY_BUFFER: 34963,
    UNIFORM_BUFFER: 35345, PIXEL_PACK_BUFFER: 35051,
    COPY_READ_BUFFER: 36662, COPY_WRITE_BUFFER: 36663,
    STATIC_DRAW: 35044, DYNAMIC_DRAW: 35048, STREAM_DRAW: 35040,
    STATIC_READ: 35045, DYNAMIC_READ: 35049, STREAM_READ: 35041,
    TEXTURE_2D: 3553, TEXTURE_CUBE_MAP: 34067,
    TEXTURE_3D: 32879, TEXTURE_2D_ARRAY: 35866,
    TEXTURE_CUBE_MAP_POSITIVE_X: 34069, TEXTURE_CUBE_MAP_NEGATIVE_Z: 34074,
    TEXTURE_MIN_FILTER: 10241, TEXTURE_MAG_FILTER: 10240,
    TEXTURE_WRAP_S: 10242, TEXTURE_WRAP_T: 10243, TEXTURE_WRAP_R: 32882,
    TEXTURE_COMPARE_MODE: 34892, TEXTURE_COMPARE_FUNC: 34893,
    NEAREST: 9728, LINEAR: 9729,
    NEAREST_MIPMAP_NEAREST: 9984, LINEAR_MIPMAP_NEAREST: 9985,
    NEAREST_MIPMAP_LINEAR: 9986, LINEAR_MIPMAP_LINEAR: 9987,
    CLAMP_TO_EDGE: 33071, REPEAT: 10497, MIRRORED_REPEAT: 33648,
    COMPARE_REF_TO_TEXTURE: 34894,
    FRAMEBUFFER: 36160, READ_FRAMEBUFFER: 36008, DRAW_FRAMEBUFFER: 36009,
    RENDERBUFFER: 36161, FRAMEBUFFER_COMPLETE: 36053,
    COLOR_ATTACHMENT0: 36064, DEPTH_ATTACHMENT: 36096,
    DEPTH_STENCIL_ATTACHMENT: 33306,
    RGBA: 6408, RGB: 6407, ALPHA: 6406, LUMINANCE: 6409, LUMINANCE_ALPHA: 6410,
    RED: 6403, RG: 33319, RED_INTEGER: 36244, RG_INTEGER: 33320,
    RGB_INTEGER: 36248, RGBA_INTEGER: 36249,
    R8: 33321, R8I: 33329, R8UI: 33330,
    R16F: 33325, R16I: 33331, R16UI: 33332,
    R32F: 33326, R32I: 33333, R32UI: 33334,
    RG8: 33323, RG8I: 33335, RG8UI: 33336,
    RG16F: 33327, RG16I: 33337, RG16UI: 33338,
    RG32F: 33328, RG32I: 33339, RG32UI: 33340,
    RGBA4: 32854, RGB5_A1: 32855, RGBA8: 32856,
    RGBA8I: 36238, RGBA8UI: 36220,
    RGBA16F: 34842, RGBA16I: 36232, RGBA16UI: 36214,
    RGBA32F: 34836, RGBA32I: 36226, RGBA32UI: 36208,
    RGB8I: 36239, RGB8UI: 36221,
    RGB16I: 36233, RGB16UI: 36215,
    RGB32I: 36227, RGB32UI: 36209,
    RGB9_E5: 35901, SRGB8_ALPHA8: 35907,
    DEPTH_COMPONENT: 6402, DEPTH_COMPONENT16: 33189, DEPTH_COMPONENT24: 33190,
    DEPTH_COMPONENT32F: 36012, DEPTH24_STENCIL8: 35056, DEPTH32F_STENCIL8: 36013,
    DEPTH_STENCIL: 34041,
    UNSIGNED_BYTE: 5121, BYTE: 5120, UNSIGNED_SHORT: 5123, SHORT: 5122,
    UNSIGNED_INT: 5125, INT: 5124, FLOAT: 5126, HALF_FLOAT: 5131,
    UNSIGNED_SHORT_4_4_4_4: 32819, UNSIGNED_SHORT_5_5_5_1: 32820,
    UNSIGNED_INT_24_8: 34042, UNSIGNED_INT_5_9_9_9_REV: 35902,
    ZERO: 0, ONE: 1,
    SRC_COLOR: 768, ONE_MINUS_SRC_COLOR: 769,
    SRC_ALPHA: 770, ONE_MINUS_SRC_ALPHA: 771,
    DST_ALPHA: 772, ONE_MINUS_DST_ALPHA: 773,
    DST_COLOR: 774, ONE_MINUS_DST_COLOR: 775,
    SRC_ALPHA_SATURATE: 776,
    CONSTANT_COLOR: 32769, ONE_MINUS_CONSTANT_COLOR: 32770,
    CONSTANT_ALPHA: 32771, ONE_MINUS_CONSTANT_ALPHA: 32772,
    FUNC_ADD: 32774, FUNC_SUBTRACT: 32778, FUNC_REVERSE_SUBTRACT: 32779,
    MIN: 32775, MAX: 32776,
    DEPTH_TEST: 2929, LESS: 513, LEQUAL: 515, EQUAL: 514, GEQUAL: 518,
    GREATER: 516, NOTEQUAL: 517, NEVER: 512, ALWAYS: 519,
    STENCIL_TEST: 2960, KEEP: 7680,
    CULL_FACE: 2884, FRONT: 1028, BACK: 1029, FRONT_AND_BACK: 1032,
    CW: 2304, CCW: 2305,
    BLEND: 3042, SCISSOR_TEST: 3089, POLYGON_OFFSET_FILL: 32823,
    SAMPLE_ALPHA_TO_COVERAGE: 32926, STENCIL_BUFFER_BIT: 1024,
    COLOR_BUFFER_BIT: 16384, DEPTH_BUFFER_BIT: 256,
    POINTS: 0, LINES: 1, LINE_LOOP: 2, LINE_STRIP: 3,
    TRIANGLES: 4, TRIANGLE_STRIP: 5,
    TEXTURE0: 33984,
    FLOAT_MAT2: 35674, FLOAT_MAT3: 35675, FLOAT_MAT4: 35676,
    FLOAT_MAT2x3: 35685, FLOAT_MAT2x4: 35686,
    FLOAT_MAT3x2: 35687, FLOAT_MAT3x4: 35688,
    FLOAT_MAT4x2: 35689, FLOAT_MAT4x3: 35690,
    FLOAT_VEC2: 35664, FLOAT_VEC3: 35665, FLOAT_VEC4: 35666,
    INT_VEC2: 35667, INT_VEC3: 35668, INT_VEC4: 35669,
    BOOL: 35670, BOOL_VEC2: 35671, BOOL_VEC3: 35672, BOOL_VEC4: 35673,
    UNSIGNED_INT_VEC2: 36294, UNSIGNED_INT_VEC3: 36295, UNSIGNED_INT_VEC4: 36296,
    SAMPLER_2D: 35678, SAMPLER_CUBE: 35680, SAMPLER_3D: 35679,
    SAMPLER_2D_SHADOW: 35682, SAMPLER_2D_ARRAY: 36289,
    SAMPLER_2D_ARRAY_SHADOW: 36292, SAMPLER_CUBE_SHADOW: 36293,
    UNPACK_ALIGNMENT: 3317, UNPACK_FLIP_Y_WEBGL: 37440,
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: 37441,
    UNPACK_COLORSPACE_CONVERSION_WEBGL: 37443,
    BROWSER_DEFAULT_WEBGL: 37444,
    SYNC_GPU_COMMANDS_COMPLETE: 37143, SYNC_FLUSH_COMMANDS_BIT: 1,
    TIMEOUT_EXPIRED: 37147, WAIT_FAILED: 37149,
    NONE: 0,
  };

  const GET_PARAM = {
    [CONSTS.VERSION]:  'WebGL 2.0 (OpenGL ES 3.0)',
    [CONSTS.VENDOR]:   'Google Inc.',
    [CONSTS.RENDERER]: 'ANGLE (Intel, Mesa Intel(R) Graphics, OpenGL 4.6)',
    [CONSTS.SHADING_LANGUAGE_VERSION]: 'WebGL GLSL ES 3.00',
    [CONSTS.MAX_TEXTURE_SIZE]:                  4096,
    [CONSTS.MAX_CUBE_MAP_TEXTURE_SIZE]:         4096,
    [CONSTS.MAX_RENDERBUFFER_SIZE]:             4096,
    [CONSTS.MAX_TEXTURE_IMAGE_UNITS]:           16,
    [CONSTS.MAX_VERTEX_TEXTURE_IMAGE_UNITS]:    16,
    [CONSTS.MAX_COMBINED_TEXTURE_IMAGE_UNITS]:  32,
    [CONSTS.MAX_VERTEX_ATTRIBS]:                16,
    [CONSTS.MAX_VARYING_VECTORS]:               30,
    [CONSTS.MAX_VERTEX_UNIFORM_VECTORS]:        256,
    [CONSTS.MAX_FRAGMENT_UNIFORM_VECTORS]:      224,
    [CONSTS.MAX_UNIFORM_BUFFER_BINDINGS]:       24,
    [CONSTS.MAX_SAMPLES]:                       4,
    [CONSTS.SCISSOR_BOX]:                       [0, 0, 800, 600],
    [CONSTS.VIEWPORT]:                          [0, 0, 800, 600],
    [CONSTS.IMPLEMENTATION_COLOR_READ_FORMAT]:  CONSTS.RGBA,
    [CONSTS.IMPLEMENTATION_COLOR_READ_TYPE]:    CONSTS.UNSIGNED_BYTE,
  };

  const base = {
    ...CONSTS,
    canvas: null,
    drawingBufferWidth:  800,
    drawingBufferHeight: 600,
    isContextLost: () => false,

    getParameter: (p) => (p in GET_PARAM ? GET_PARAM[p] : (typeof p === 'number' ? 0 : null)),
    getShaderPrecisionFormat: (_s, _p) => ({ rangeMin: 127, rangeMax: 127, precision: 23 }),

    getSupportedExtensions: () => [
      'OES_texture_float', 'OES_texture_float_linear',
      'OES_texture_half_float', 'OES_texture_half_float_linear',
      'OES_element_index_uint', 'OES_vertex_array_object',
      'WEBGL_lose_context', 'WEBGL_depth_texture',
      'EXT_texture_filter_anisotropic', 'ANGLE_instanced_arrays',
      'EXT_color_buffer_half_float', 'EXT_color_buffer_float',
    ],
    getExtension: (name) => {
      if (name === 'OES_element_index_uint')         return {};
      if (name === 'OES_texture_float')              return {};
      if (name === 'OES_texture_half_float')         return { HALF_FLOAT_OES: 0x8D61 };
      if (name === 'OES_texture_float_linear')       return {};
      if (name === 'OES_texture_half_float_linear')  return {};
      if (name === 'WEBGL_lose_context')             return { loseContext: noop, restoreContext: noop };
      if (name === 'WEBGL_depth_texture')            return {};
      if (name === 'EXT_texture_filter_anisotropic') return { MAX_TEXTURE_MAX_ANISOTROPY_EXT: 34046, TEXTURE_MAX_ANISOTROPY_EXT: 34046 };
      if (name === 'ANGLE_instanced_arrays')         return { drawArraysInstancedANGLE: noop, drawElementsInstancedANGLE: noop, vertexAttribDivisorANGLE: noop, VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE: 35070 };
      if (name === 'OES_vertex_array_object')        return { createVertexArrayOES: obj, bindVertexArrayOES: noop, deleteVertexArrayOES: noop, VERTEX_ARRAY_BINDING_OES: 34229 };
      if (name === 'EXT_color_buffer_float')         return {};
      if (name === 'EXT_color_buffer_half_float')    return {};
      if (name === 'EXT_clip_control')               return { LOWER_LEFT_EXT: 0x8CA1, NEGATIVE_ONE_TO_ONE_EXT: 0x935E, clipControlEXT: noop };
      return null;
    },

    enable: noop, disable: noop,
    blendEquation: noop, blendEquationSeparate: noop,
    blendFunc: noop, blendFuncSeparate: noop, blendColor: noop,
    depthFunc: noop, depthMask: noop, depthRange: noop,
    colorMask: noop,
    clearColor: noop, clearDepth: noop, clearStencil: noop,
    clear: noop, flush: noop, finish: noop,
    scissor: noop, viewport: noop,
    polygonOffset: noop, lineWidth: noop,
    pixelStorei: noop,
    stencilFunc: noop, stencilFuncSeparate: noop,
    stencilMask: noop, stencilMaskSeparate: noop,
    stencilOp: noop, stencilOpSeparate: noop,
    cullFace: noop, frontFace: noop, sampleCoverage: noop,
    activeTexture: noop, hint: noop,

    createBuffer: obj, bindBuffer: noop, bufferData: noop,
    bufferSubData: noop, deleteBuffer: noop, getBufferSubData: noop,
    bindBufferBase: noop, bindBufferRange: noop,

    createTexture: obj, bindTexture: noop,
    texImage2D: noop, texSubImage2D: noop,
    texImage3D: noop, texSubImage3D: noop,
    texStorage2D: noop, texStorage3D: noop,
    texParameteri: noop, texParameterf: noop,
    generateMipmap: noop, deleteTexture: noop,
    compressedTexImage2D: noop, compressedTexSubImage2D: noop,
    copyTexSubImage2D: noop,

    createFramebuffer: obj, bindFramebuffer: noop,
    framebufferTexture2D: noop, framebufferRenderbuffer: noop,
    checkFramebufferStatus: () => 36053,
    deleteFramebuffer: noop, blitFramebuffer: noop,
    readPixels: noop,
    getFramebufferAttachmentParameter: () => 0,

    createRenderbuffer: obj, bindRenderbuffer: noop,
    renderbufferStorage: noop, renderbufferStorageMultisample: noop,
    deleteRenderbuffer: noop,

    createShader: obj, shaderSource: noop, compileShader: noop, deleteShader: noop,
    getShaderParameter: (_s, p) => (p === 35713 ? true : p === 35712 ? false : true),
    getShaderInfoLog: () => '', getShaderSource: () => '',

    createProgram: obj, attachShader: noop, linkProgram: noop,
    useProgram: noop, deleteProgram: noop,
    validateProgram: noop, detachShader: noop,
    getProgramParameter: (_p, par) => {
      if (par === 35714) return true;   // LINK_STATUS
      if (par === 35715) return true;   // VALIDATE_STATUS
      if (par === 35712) return false;  // DELETE_STATUS
      if (par === 35721) return 0;      // ACTIVE_ATTRIBUTES
      if (par === 35718) return 0;      // ACTIVE_UNIFORMS
      if (par === 35382) return 0;      // ACTIVE_UNIFORM_BLOCKS
      if (par === 37297) return 0;      // TRANSFORM_FEEDBACK_VARYINGS
      return 0;
    },
    getProgramInfoLog: () => '',
    getActiveAttrib:  (_p, _i) => ({ name: 'a_pos', size: 1, type: 35665 }),
    getActiveUniform: (_p, _i) => ({ name: 'u_mat', size: 1, type: 35676 }),
    getUniformLocation: (_p, _n) => ({}),
    getAttribLocation:  (_p, _n) => 0,
    bindAttribLocation: noop,
    getActiveUniformBlockName: () => '',
    getUniformBlockIndex: () => 0,
    uniformBlockBinding: noop,

    uniform1i: noop, uniform2i: noop, uniform3i: noop, uniform4i: noop,
    uniform1f: noop, uniform2f: noop, uniform3f: noop, uniform4f: noop,
    uniform1ui: noop, uniform2ui: noop, uniform3ui: noop, uniform4ui: noop,
    uniform1fv: noop, uniform2fv: noop, uniform3fv: noop, uniform4fv: noop,
    uniform1iv: noop, uniform2iv: noop, uniform3iv: noop, uniform4iv: noop,
    uniform1uiv: noop, uniform2uiv: noop, uniform3uiv: noop, uniform4uiv: noop,
    uniformMatrix2fv: noop, uniformMatrix3fv: noop, uniformMatrix4fv: noop,
    uniformMatrix2x3fv: noop, uniformMatrix3x2fv: noop,
    uniformMatrix2x4fv: noop, uniformMatrix4x2fv: noop,
    uniformMatrix3x4fv: noop, uniformMatrix4x3fv: noop,

    vertexAttrib1f: noop, vertexAttrib2f: noop,
    vertexAttrib3f: noop, vertexAttrib4f: noop,
    vertexAttrib1fv: noop, vertexAttrib2fv: noop,
    vertexAttrib3fv: noop, vertexAttrib4fv: noop,
    vertexAttribPointer: noop, vertexAttribIPointer: noop,
    vertexAttribDivisor: noop,
    enableVertexAttribArray: noop, disableVertexAttribArray: noop,
    getVertexAttrib: () => null,

    createVertexArray: obj, bindVertexArray: noop,
    deleteVertexArray: noop, isVertexArray: () => false,

    drawArrays: noop, drawElements: noop,
    drawArraysInstanced: noop, drawElementsInstanced: noop,
    drawBuffers: noop,

    createTransformFeedback: obj, bindTransformFeedback: noop,
    beginTransformFeedback: noop, endTransformFeedback: noop,
    deleteTransformFeedback: noop, transformFeedbackVaryings: noop,

    createQuery: obj, beginQuery: noop, endQuery: noop,
    deleteQuery: noop, getQueryParameter: () => 0,

    fenceSync:      () => ({}),
    clientWaitSync: () => 37147,
    deleteSync:     noop,
    getSyncParameter: () => 37145,

    getError: () => 0,
    isBuffer: () => false, isTexture: () => false,
    isRenderbuffer: () => false, isFramebuffer: () => false,
    isShader: () => false, isProgram: () => false, isEnabled: () => false,
  };

  // Proxy: unknown method calls return a no-op returning null
  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string' && !prop.startsWith('__')) {
        return (..._args) => null;
      }
      return undefined;
    },
  });
}

// ---------------------------------------------------------------------------
// 3. Stand up jsdom
// ---------------------------------------------------------------------------
const dom = new JSDOM(
  '<!DOCTYPE html><html><head></head><body></body></html>',
  { url: 'http://localhost/', pretendToBeVisual: true, runScripts: 'outside-only' }
);
const { window } = dom;
const { document } = window;

// Captured errors list (reset between phases)
const capturedErrors = [];

let rafCount = 0;
const rafCallbacks = [];
window.requestAnimationFrame = (cb) => { rafCount++; rafCallbacks.push(cb); return rafCount; };
window.cancelAnimationFrame = (_id) => {};

window.HTMLCanvasElement.prototype.getContext = function (type, _opts) {
  if (/webgl/i.test(type) || type === 'experimental-webgl') {
    const ctx = makeFakeWebGL();
    ctx.canvas = this;
    return ctx;
  }
  if (type === '2d') {
    const me = this;
    return new Proxy({}, { get: (_t, p) => (p === 'canvas' ? me : (..._a) => undefined) });
  }
  return null;
};
window.HTMLCanvasElement.prototype.getBoundingClientRect = function () {
  return { left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 };
};
window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';

window.devicePixelRatio = 1;
window.innerWidth  = 800;
window.innerHeight = 600;
window.screen = window.screen || { width: 1920, height: 1080 };

if (!window.ResizeObserver)
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
if (!window.IntersectionObserver)
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
if (!window.PointerEvent) window.PointerEvent = window.MouseEvent;

// Install globals
function installGlobal(key, val) {
  try { global[key] = val; }
  catch (_) { try { Object.defineProperty(global, key, { value: val, writable: true, configurable: true }); } catch (_2) {} }
}
const PASS_THROUGH = [
  'window','document','navigator','devicePixelRatio','innerWidth','innerHeight','screen',
  'HTMLCanvasElement','HTMLElement','HTMLImageElement','HTMLVideoElement','Element','Node','NodeList',
  'Event','CustomEvent','MouseEvent','KeyboardEvent','WheelEvent','PointerEvent',
  'EventTarget','setTimeout','clearTimeout','setInterval','clearInterval',
  'requestAnimationFrame','cancelAnimationFrame',
  'ResizeObserver','IntersectionObserver','MutationObserver',
  'XMLHttpRequest','Blob','URL','URLSearchParams','crypto',
];
for (const key of PASS_THROUGH) {
  const val = key === 'window' ? window : key === 'document' ? document : window[key];
  if (val !== undefined) installGlobal(key, val);
}
installGlobal('requestAnimationFrame', window.requestAnimationFrame);
const _nodePerf = globalThis.performance || { now: () => Date.now() };
installGlobal('performance', { now: () => _nodePerf.now(), timeOrigin: _nodePerf.timeOrigin || Date.now() });
installGlobal('cancelAnimationFrame', window.cancelAnimationFrame);

// ---------------------------------------------------------------------------
// 4. Evaluate the IIFE bundle
// ---------------------------------------------------------------------------
console.log('[battle-smoke] Evaluating bundle...');
let evalError = null;
try {
  const bundleCode = fs.readFileSync(tmpJs, 'utf-8');
  const wrapper = `(function(window,document,navigator,
    requestAnimationFrame,cancelAnimationFrame,
    performance,devicePixelRatio,innerWidth,innerHeight,screen,
    HTMLCanvasElement,HTMLElement,HTMLImageElement,
    Element,Node,Event,CustomEvent,MouseEvent,KeyboardEvent,WheelEvent,PointerEvent,
    ResizeObserver,IntersectionObserver,MutationObserver,
    XMLHttpRequest,Blob,URL,URLSearchParams,crypto){\n${bundleCode}\n})`;
  const fn = vm.runInThisContext(wrapper, { filename: tmpJs, displayErrors: true });
  fn(
    window, document, window.navigator,
    window.requestAnimationFrame, window.cancelAnimationFrame,
    { now: () => _nodePerf.now(), timeOrigin: _nodePerf.timeOrigin || Date.now() }, 1, 800, 600, window.screen,
    window.HTMLCanvasElement, window.HTMLElement,
    window.HTMLImageElement || window.HTMLElement,
    window.Element, window.Node, window.Event, window.CustomEvent,
    window.MouseEvent, window.KeyboardEvent,
    window.WheelEvent || window.MouseEvent,
    window.PointerEvent || window.MouseEvent,
    window.ResizeObserver, window.IntersectionObserver, window.MutationObserver,
    window.XMLHttpRequest, window.Blob, window.URL, window.URLSearchParams,
    window.crypto || {}
  );
} catch (err) {
  evalError = err;
  console.error('[battle-smoke] Bundle eval threw:', err.message);
}

// Fire DOMContentLoaded if needed
if (rafCount === 0 && !evalError) {
  console.log('[battle-smoke] rAF not called - dispatching DOMContentLoaded...');
  const evt = new window.Event('DOMContentLoaded', { bubbles: true, cancelable: false });
  window.document.dispatchEvent(evt);
}

// Helper: drain pending rAF callbacks (synchronously)
function drainRAF(maxFrames, errs) {
  for (let i = 0; i < maxFrames && rafCallbacks.length > 0; i++) {
    const cb = rafCallbacks.shift();
    try { cb(16.67 * (rafCount - rafCallbacks.length + 1)); }
    catch (err) {
      const msg = err && err.message ? err.message : String(err);
      console.error('[battle-smoke] Error in rAF frame:', msg);
      errs.push(err);
    }
  }
}

// Run initial boot frames
drainRAF(5, capturedErrors);
console.log('[battle-smoke] Boot rAF calls so far:', rafCount);

// ---------------------------------------------------------------------------
// 5. Check boot succeeded
// ---------------------------------------------------------------------------
const bootErrors = [];

for (const id of ['__boot_err__', '__err_overlay__']) {
  const el = document.getElementById(id);
  if (el) {
    const txt = (el.textContent || el.innerHTML || '').trim();
    if (txt) bootErrors.push('Boot error overlay #' + id + ': ' + txt.slice(0, 300));
  }
}
if (evalError) bootErrors.push('Bundle eval threw: ' + evalError.message);
const canvases = document.body ? document.body.querySelectorAll('canvas') : [];
if (!canvases || canvases.length === 0) bootErrors.push('No <canvas> found after boot');

if (bootErrors.length > 0) {
  console.error('');
  console.error('BATTLE SMOKE FAIL - boot did not succeed:');
  for (const e of bootErrors) console.error('  x', e);
  process.exit(1);
}
console.log('[battle-smoke] Boot OK. canvas count:', canvases.length);

// ---------------------------------------------------------------------------
// 6. PHASE A: Dispatch 'T' keydown -> launchTestBattle -> showPreBattle
// ---------------------------------------------------------------------------
console.log('[battle-smoke] Phase A: dispatching keydown T to trigger launchTestBattle...');

capturedErrors.length = 0;

try {
  const kbEvt = new window.KeyboardEvent('keydown', {
    key: 'T',
    code: 'KeyT',
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(kbEvt);
} catch (err) {
  capturedErrors.push(err);
  console.error('[battle-smoke] keydown dispatch threw:', err.message);
}

// Run a few frames so preBattle overlay can be constructed
drainRAF(4, capturedErrors);

// ---------------------------------------------------------------------------
// 7. Find the pre-battle 'Bitwa ręczna' button
// ---------------------------------------------------------------------------
function findButtonByText(root, searchText) {
  const upper = searchText.toUpperCase();
  const allBtns = root.querySelectorAll('button');
  for (const btn of allBtns) {
    if (btn.textContent && btn.textContent.toUpperCase().includes(upper)) {
      return btn;
    }
  }
  // Fallback: any element with matching text
  const allEls = root.querySelectorAll('*');
  for (const el of allEls) {
    if (el.textContent && el.textContent.toUpperCase().includes(upper)) {
      return el;
    }
  }
  return null;
}

const poleBitwyBtn = findButtonByText(document.body, 'BITWA R')
  || findButtonByText(document.body, 'ROZEGRAJ');
if (!poleBitwyBtn) {
  const allBtns = document.body.querySelectorAll('button');
  const btnTexts = Array.from(allBtns).map(function(b) {
    return JSON.stringify((b.textContent || '').trim().slice(0, 60));
  });
  console.error('[battle-smoke] All buttons in DOM:', btnTexts.join(', ') || '(none)');
  console.error('');
  console.error('BATTLE SMOKE FAIL - pre-battle "Bitwa ręczna" button not found after keydown T.');
  console.error('  launchTestBattle / showPreBattle did not fire, or the overlay was not appended.');
  process.exit(1);
}
console.log('[battle-smoke] Found pre-battle button:', JSON.stringify((poleBitwyBtn.textContent || '').trim().slice(0, 80)));

// ---------------------------------------------------------------------------
// 8. PHASE B: Click 'Bitwa ręczna' -> BattleScene constructor
// ---------------------------------------------------------------------------
console.log('[battle-smoke] Phase B: clicking Bitwa ręczna -> constructing BattleScene...');

capturedErrors.length = 0;

try {
  poleBitwyBtn.click();
} catch (err) {
  const msg = err && err.message ? err.message : String(err);
  capturedErrors.push(err);
  console.error('[battle-smoke] Bitwa ręczna click threw:', msg);
}

// Run several rAF frames so BattleScene constructor + first render frames execute
drainRAF(10, capturedErrors);

// ---------------------------------------------------------------------------
// 9. Check: no errors, boot overlay still empty
// ---------------------------------------------------------------------------
const battleErrors = capturedErrors.slice();

for (const id of ['__boot_err__', '__err_overlay__']) {
  const el = document.getElementById(id);
  if (el) {
    const txt = (el.textContent || el.innerHTML || '').trim();
    if (txt) battleErrors.push(new Error('Error overlay #' + id + ' populated after battle: ' + txt.slice(0, 300)));
  }
}

if (battleErrors.length > 0) {
  console.error('');
  console.error('BATTLE SMOKE FAIL - BattleScene path threw errors:');
  for (const e of battleErrors) {
    const msg = e && e.message ? e.message : String(e);
    const stack = e && e.stack ? '\n' + e.stack.split('\n').slice(0, 6).join('\n') : '';
    console.error('  x', msg, stack);
  }
  process.exit(1);
}

console.log('[battle-smoke] Phase B OK - BattleScene constructed without errors.');

// ---------------------------------------------------------------------------
// 10. PHASE C: Auto (auto path)
//     The preBattle overlay was dismissed on click, so we re-open via T key.
//     If isPreBattleOpen() guard fires, this is a no-op and we skip the check.
// ---------------------------------------------------------------------------
console.log('[battle-smoke] Phase C: re-opening pre-battle (T key) for auto path...');
capturedErrors.length = 0;

try {
  const kbEvt2 = new window.KeyboardEvent('keydown', {
    key: 't',
    code: 'KeyT',
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(kbEvt2);
} catch (err) {
  capturedErrors.push(err);
}

drainRAF(4, capturedErrors);

const autoBtn = findButtonByText(document.body, 'AUTO');
if (!autoBtn) {
  const allBtns2 = document.body.querySelectorAll('button');
  const btnTexts2 = Array.from(allBtns2).map(function(b) {
    return JSON.stringify((b.textContent || '').trim().slice(0, 60));
  });
  console.warn('[battle-smoke] WARN: Auto button not found (buttons:', btnTexts2.join(', ') || 'none', ')');
  console.warn('[battle-smoke] Skipping auto path check (BattleScene may still be open, blocking re-open via isPreBattleOpen guard).');
} else {
  console.log('[battle-smoke] Found auto button:', JSON.stringify((autoBtn.textContent || '').trim().slice(0, 80)));
  capturedErrors.length = 0;

  try {
    autoBtn.click();
  } catch (err) {
    capturedErrors.push(err);
    console.error('[battle-smoke] Auto button click threw:', err && err.message ? err.message : String(err));
  }

  drainRAF(4, capturedErrors);

  if (capturedErrors.length > 0) {
    console.error('');
    console.error('BATTLE SMOKE FAIL - auto battle path threw errors:');
    for (const e of capturedErrors) {
      console.error('  x', e && e.message ? e.message : String(e));
    }
    process.exit(1);
  }
  console.log('[battle-smoke] Phase C OK - auto path clean.');
}

// ---------------------------------------------------------------------------
// 11. Final report
// ---------------------------------------------------------------------------
console.log('');
console.log('BATTLE SMOKE OK');
console.log('  rAF calls total :', rafCount);
process.exit(0);
