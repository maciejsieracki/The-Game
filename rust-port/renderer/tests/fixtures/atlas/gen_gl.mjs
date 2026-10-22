// R-RUSTPORT-P4-31-ATLAS-CACHE-Q1 — WebGL2 reference for the texture-upload path of Three r169
// (`CanvasTexture`: straight alpha upload, `generateMipmap`), measured in headless Chromium 141
// (Playwright 1.56.1). The GL implementation in the container is ANGLE → Vulkan → SwiftShader;
// the owner's machine (ANGLE → D3D11, Windows) is NOT measured (NIE_ZMIERZONO).
//
// Usage (outside the repo is not required: no repo files are read):
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node gen_gl.mjs <outdir>
// Output: atlas_gl.json — every byte array base64 (RGBA8, rows top→bottom as uploaded).
//
// What it records:
//  1. `gl.generateMipmap` on RGBA8 and SRGB8_ALPHA8 textures allocated like Three r169
//     (`texStorage2D(levels = log2(max(w,h)) + 1)`, three.module.js:24401, then level 0 upload,
//     `generateMipmap`, three.module.js:24247-24249, :25284) — every level read back through a
//     framebuffer (`readPixels` returns the stored bytes, sRGB-encoded for SRGB8_ALPHA8).
//  2. The canvas → texture upload with `UNPACK_PREMULTIPLY_ALPHA_WEBGL = false` (Three default
//     `Texture.premultiplyAlpha = false`, src/textures/Texture.js:61; set at
//     three.module.js:24887) next to the same canvas uploaded with `= true` (= the premultiplied
//     canvas bytes) and `getImageData`.
//  3. One T7-sized case (512×168, SRGB8_ALPHA8, random), generated AFTER `up`, so the xorshift
//     stream — and therefore every byte of cases 1–56 and of `up` — is unchanged.
import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as path from 'node:path';

const { chromium } = createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright');
const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node gen_gl.mjs <outdir>');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
const res = await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  let seed = 12345;
  const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed; };
  const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); };
  function readLevel(tex, level, w, h) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, level);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('fb');
    const out = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, out);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);
    return out;
  }
  const cases = [];
  const sizes = [[2, 2], [4, 4], [8, 2], [5, 5], [3, 1], [7, 3], [6, 5], [72, 126], [64, 21], [128, 128]];
  for (const srgb of [false, true]) {
    for (const [w, h] of sizes) {
      for (const kind of ['random', 'opaque', 'edge']) {
        if (w === 128 && kind !== 'random') continue;
        const data = new Uint8Array(w * h * 4);
        for (let i = 0; i < w * h; i++) {
          const r = rnd();
          if (kind === 'random') {
            data[4 * i] = r & 255; data[4 * i + 1] = (r >>> 8) & 255; data[4 * i + 2] = (r >>> 16) & 255; data[4 * i + 3] = (r >>> 24) & 255;
          } else if (kind === 'opaque') {
            data[4 * i] = r & 255; data[4 * i + 1] = (r >>> 8) & 255; data[4 * i + 2] = (r >>> 16) & 255; data[4 * i + 3] = 255;
          } else {
            const on = ((i % w) + Math.floor(i / w)) % 3 === 0;
            data[4 * i] = on ? 255 : 0; data[4 * i + 1] = on ? 200 : 10; data[4 * i + 2] = 0; data[4 * i + 3] = on ? 255 : 0;
          }
        }
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        const L = Math.log2(Math.max(w, h)) + 1; // three.module.js:24401 (WebGL truncates to GLsizei)
        gl.texStorage2D(gl.TEXTURE_2D, L, srgb ? gl.SRGB8_ALPHA8 : gl.RGBA8, w, h);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.generateMipmap(gl.TEXTURE_2D);
        const levels = [];
        for (let l = 0; l < Math.trunc(L); l++) {
          const lw = Math.max(1, w >> l), lh = Math.max(1, h >> l);
          levels.push({ w: lw, h: lh, rgba: b64(readLevel(tex, l, lw, lh)) });
        }
        gl.deleteTexture(tex);
        cases.push({ srgb, w, h, kind, levels });
      }
    }
  }
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 64;
  const ctx = cv.getContext('2d');
  for (let x = 0; x < 256; x++) {
    for (let y = 0; y < 64; y++) {
      const r = rnd();
      ctx.fillStyle = `rgba(${r & 255},${(r >>> 8) & 255},${(r >>> 16) & 255},${(x + 0.5) / 256})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const up = { w: 256, h: 64 };
  for (const pm of [true, false]) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, pm);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 256, 64);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    up[pm ? 'premul' : 'straight'] = b64(readLevel(tex, 0, 256, 64));
  }
  up.getImageData = b64(new Uint8Array(ctx.getImageData(0, 0, 256, 64).data.buffer));
  // 3. T7 stat-plate size (512×168, SRGB8_ALPHA8 like `unitStatPlate.ts:437-443`), appended
  //    AFTER `up` so the xorshift stream of every earlier case is unchanged (round 2, zarzut 4).
  {
    const [w, h] = [512, 168];
    const data = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      const r = rnd();
      data[4 * i] = r & 255; data[4 * i + 1] = (r >>> 8) & 255; data[4 * i + 2] = (r >>> 16) & 255; data[4 * i + 3] = (r >>> 24) & 255;
    }
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    const L = Math.log2(Math.max(w, h)) + 1; // three.module.js:24401
    gl.texStorage2D(gl.TEXTURE_2D, L, gl.SRGB8_ALPHA8, w, h);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.generateMipmap(gl.TEXTURE_2D);
    const levels = [];
    for (let l = 0; l < Math.trunc(L); l++) {
      const lw = Math.max(1, w >> l), lh = Math.max(1, h >> l);
      levels.push({ w: lw, h: lh, rgba: b64(readLevel(tex, l, lw, lh)) });
    }
    gl.deleteTexture(tex);
    cases.push({ srgb: true, w, h, kind: 't7', levels });
  }
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  return {
    renderer: gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL),
    version: gl.getParameter(gl.VERSION),
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    userAgent: navigator.userAgent,
    cases,
    up,
  };
});
res.browser = browser.version();
fs.writeFileSync(path.join(OUT, 'atlas_gl.json'), JSON.stringify(res) + '\n');
console.log(res.renderer, res.browser, 'cases', res.cases.length);
await browser.close();
