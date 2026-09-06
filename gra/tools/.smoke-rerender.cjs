'use strict';
/**
 * smoke.cjs — headless smoke test for The Game build.
 * Run: node tools/smoke.cjs   (from gra/ directory)
 *
 * SUCCESS: prints "SMOKE OK" and exits 0 when:
 *   (a) no text was written to the boot error overlay
 *   (b) a <canvas> was appended to document.body
 *   (c) requestAnimationFrame was called at least once
 *
 * FAILURE: prints "SMOKE FAIL" + error details and exits 1.
 */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const os   = require('os');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) { console.error('[smoke] jsdom not installed — run: npm i -D jsdom'); process.exit(1); }

// ---------------------------------------------------------------------------
// 1. Read and parse dist/index.html
// ---------------------------------------------------------------------------
const htmlPath = path.resolve(__dirname, '..', 'dist-rerender', 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('[smoke] dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}
const html = fs.readFileSync(htmlPath, 'utf-8');

// Extract scripts.  There are exactly 2:
//   0: tiny boot-error catcher (< ~2000 chars)
//   1: the real IIFE bundle (> 100 000 chars)
const scriptRe = /<script([^>]*)>([\s\S]*?)<\/script>/g;
let m, scripts = [];
while ((m = scriptRe.exec(html)) !== null) {
  scripts.push({ attrs: m[1], body: m[2].trim() });
}

// The IIFE bundle is the largest script and starts with "(function"
const mainScript = scripts.slice().sort((a, b) => b.body.length - a.body.length)[0];
if (!mainScript || mainScript.body.length < 10000) {
  console.error('[smoke] Could not locate the main IIFE bundle inside dist/index.html.');
  process.exit(1);
}
console.log('[smoke] main bundle length:', mainScript.body.length, 'chars');

// Write to a temp file so stack traces include a file path
// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalogi/pliki tymczasowe unikalne per przebieg ---
// Stala nazwa pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly przebieg (takze
// uruchomiony z innego worktree). Skutek dziala w obie strony: raz falszywy CZERWONY
// (jeden bieg czysci drugiemu katalog w locie), raz falszywy ZIELONY (dwa biegi mierza
// ten sam artefakt, wiec "parytet" jest artefaktem kolizji, nie dowodem). Sufiks
// per-proces to rozlacza; asercje i progi bramki pozostaja nietkniete.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
// Unikalnosc BEZ sprzatania zamienilaby kolizje w staly wyciek dysku (brak miejsca to
// ta sama klasa problemu z drugiej strony), wiec kasujemy WLASNE artefakty tego biegu.
// Dopasowanie po TMPDIR_RUN_ID nie moze trafic w cudzy katalog. Zrzuty/podglady
// zostaja na dysku celowo — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6).
process.on('exit', () => {
  // `require` lokalnie: hak musi dzialac takze w plikach, ktore nie maja `fs`/`path`
  // w zasiegu modulu — inaczej ReferenceError wpada w catch i sprzatanie milczy.
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      if (!ent.includes(TMPDIR_RUN_ID)) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
});
// SPRZATANIE PO PRZERWANYM PRZEBIEGU — BEZ dotykania dyspozycji sygnalow.
// Wczesniejsza wersja rejestrowala tu handlery SIGINT/SIGTERM/SIGHUP. To bylo GORSZE niz
// wyciek katalogu. Rejestracja handlera zdejmuje domyslna akcje sygnalu, a sygnal
// dostarczony w trakcie synchronicznego `execSync` (`vite build` — czyli wiekszosc czasu
// zycia tej bramki) NIE odpala handlera JS w ogole i zostaje POLKNIETY. Zmierzone na
// minimalnej reprodukcji i na tej bramce: bez handlera SIGTERM daje `exit=143` natychmiast,
// z handlerem proces zyje dalej i konczy sie `exit=0`. Bramka tracila zabijalnosc, a
// przerwany przebieg raportowal SUKCES — dokladnie ten falszywy ZIELONY, ktory ten temat
// ma likwidowac. Dlatego handlerow sygnalow tu nie ma i byc nie moze.
// Zamiast tego przy STARCIE kasujemy wlasne osierocone katalogi z poprzednich przebiegow,
// ktorych proces juz nie zyje. Dziala takze po SIGKILL, nieprzechwytywalnym z definicji.
(() => {
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  // Sygnatura nazw nadawana przez ten temat: `<baza>-<pid>-<6 znakow>` (+ ewent. rozszerzenie).
  const STALE = /-(\d+)-[a-z0-9]{6}(?:\.[A-Za-z0-9]+)?$/;
  const alive = (pid) => {
    try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
  };
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      const m = STALE.exec(ent);
      if (!m) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;   // zrzuty sa DOWODEM (§9 pkt 6)
      const pid = Number(m[1]);
      // Cudzy (albo wlasny) ZYWY przebieg zostaje nietkniety — kasujemy wylacznie sieroty.
      if (!Number.isInteger(pid) || pid === process.pid || alive(pid)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
})();
const tmpJs = path.join(os.tmpdir(), `smoke_bundle_eval-${TMPDIR_RUN_ID}.js`);
fs.writeFileSync(tmpJs, mainScript.body, 'utf-8');

// ---------------------------------------------------------------------------
// 2. Build a thorough fake WebGL2 context
// ---------------------------------------------------------------------------
function makeFakeWebGL() {
  const noop   = () => {};
  let   handle = 0;
  const obj    = () => ({ __h: ++handle });

  // WebGL enumeration constants.
  // THREE.WebGLRenderer accesses these as properties of the context object
  // (e.g. gl.VERSION, gl.SCISSOR_BOX) before passing them to getParameter().
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
    clientWaitSync: () => 37147,   // TIMEOUT_EXPIRED
    deleteSync:     noop,
    getSyncParameter: () => 37145, // SIGNALED

    getError: () => 0,
    isBuffer: () => false, isTexture: () => false,
    isRenderbuffer: () => false, isFramebuffer: () => false,
    isShader: () => false, isProgram: () => false, isEnabled: () => false,
  };

  // Proxy: any unknown method call returns a no-op that returns null
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
// window.performance is a getter-only on jsdom — it already works correctly

if (!window.ResizeObserver)
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
if (!window.IntersectionObserver)
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
if (!window.PointerEvent) window.PointerEvent = window.MouseEvent;

// Patch Node globals so THREE's module-level code that touches `window` still finds them
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
// Override rAF with our tracked version
installGlobal('requestAnimationFrame', window.requestAnimationFrame);
// Use Node's native performance (not jsdom's) to avoid infinite recursion.
// jsdom's Performance.now() internally calls the Node global performance.now(),
// so setting global.performance = window.performance creates a cycle.
const _nodePerf = globalThis.performance || { now: () => Date.now() };
installGlobal('performance', { now: () => _nodePerf.now(), timeOrigin: _nodePerf.timeOrigin || Date.now() });
installGlobal('cancelAnimationFrame', window.cancelAnimationFrame);

// ---------------------------------------------------------------------------
// 4. Evaluate the IIFE bundle
// ---------------------------------------------------------------------------
console.log('[smoke] Evaluating bundle...');
let evalError = null;
try {
  const bundleCode = fs.readFileSync(tmpJs, 'utf-8');
  // Wrap in a function that explicitly injects the globals the bundle expects,
  // so even if the Node global is shadowed by something the function still gets them.
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
  console.error('[smoke] Bundle eval threw:', err.message);
  console.error(err.stack);
}

// Fire DOMContentLoaded if the bundle registered a listener
// (bundle checks document.readyState==='loading' and adds listener if so)
if (rafCount === 0 && !evalError) {
  console.log('[smoke] rAF not called — dispatching DOMContentLoaded...');
  const evt = new window.Event('DOMContentLoaded', { bubbles: true, cancelable: false });
  window.document.dispatchEvent(evt);
}

// Run a few rAF frames synchronously
const FRAMES = 3;
for (let i = 0; i < FRAMES && rafCallbacks.length > 0; i++) {
  const cb = rafCallbacks.shift();
  try { cb(16.67 * (i + 1)); }
  catch (err) { console.error('[smoke] Error in rAF frame', i + 1, ':', err.message); }
}
console.log('[smoke] rAF calls so far:', rafCount);

// ---------------------------------------------------------------------------
// 5. Check success criteria
// ---------------------------------------------------------------------------
const errors = [];

// (a) Boot error overlays must be absent or empty
for (const id of ['__boot_err__', '__err_overlay__']) {
  const el = document.getElementById(id);
  if (el) {
    const txt = (el.textContent || el.innerHTML || '').trim();
    if (txt) errors.push(`Error overlay #${id} has content:\n  ${txt.slice(0, 500)}`);
  }
}

// (b) A <canvas> must have been appended to body
const canvases = document.body ? document.body.querySelectorAll('canvas') : [];
if (!canvases || canvases.length === 0) {
  errors.push('No <canvas> element found in document.body after boot');
}

// (c) rAF must have been called at least once
if (rafCount === 0) {
  errors.push('requestAnimationFrame was never called — render loop did not start');
}

// (d) Bundle must not have thrown
if (evalError) {
  errors.push(`Bundle eval threw: ${evalError.message}`);
}

// ---------------------------------------------------------------------------
// 6. Report
// ---------------------------------------------------------------------------
if (errors.length === 0) {
  console.log('');
  console.log('SMOKE OK');
  console.log('  canvas count :', canvases.length);
  console.log('  rAF calls    :', rafCount);
  process.exit(0);
} else {
  console.error('');
  console.error('SMOKE FAIL');
  for (const e of errors) console.error('  x', e);
  process.exit(1);
}
