// R-RUSTPORT-P4-35-TEXT-EMOJI-UNIFY-Q1 — reference generator for tests/textmix_*.rs (RR-T8f).
//
// Reference = REAL Chromium 141 Canvas 2D (as RR-T8a/b/c, D-TXT-5 = A) with the SAME bundled
// fonts (assets/fonts/* of RR-T8b + assets/emoji/NotoColorEmoji-civ-subset.ttf of RR-T8c) loaded
// as FontFace objects under private names. Web font stacks are translated by mapFont() — the
// same mirror of raster::image::emoji::source_chain as tests/fixtures/image/gen.mjs:
// RR-T8b mapping + "Noto Color Emoji" → CivNotoEmoji, then CivDejaVuSans, then CivNotoEmoji.
//
// What is measured: MIXED strings (outline text + colour emoji + monochrome symbols) drawn by ONE
// fillText / strokeText / measureText call — the unified text path of RR-T8f. Fonts are the
// web's own font values (file:line in pin edb8fb56, paths relative to gra/src); the strings are
// synthetic "napisy typu" of the dispatch (Polish labels + ⚔ ☠ ◆ 👤 🔥 🍞 🔨 💰 + R4 icons).
//
// Outputs (all in this directory):
//   scenes.tsv + ref/<scene>.rgba  op lists replayed in Chromium → getImageData (straight RGBA8)
//   widths.tsv                font<TAB>text<TAB>measureText(text).width
//   baselines.tsv             font<TAB>textBaseline<TAB>text<TAB>measureText(text).alphabeticBaseline
//   probes.tsv                strokeText vs fillText of a colour glyph (alpha mass per channel)
//   versions.txt, MANIFEST.sha256 (sha256 of every file above, gen.mjs included, and of the fonts)
//
// Run (from rust-port/renderer/tests/fixtures/textmix):
//   NODE_PATH=/opt/node-tools/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node gen.mjs
// Chromium flags: --disable-gpu --force-color-profile=srgb --font-render-hinting=none (as RR-T8b/c).

import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';

const require = createRequire(process.env.NODE_PATH ? process.env.NODE_PATH + '/' : import.meta.url);
const { chromium } = require('playwright');

const OUT = new URL('./', import.meta.url).pathname;
const ASSETS = OUT + '../../../assets/';

const FACE_FILES = [
  ['CivLiberationSans', '400', 'fonts/LiberationSans-Regular.ttf'],
  ['CivLiberationSans', '700', 'fonts/LiberationSans-Bold.ttf'],
  ['CivLiberationSerif', '400', 'fonts/LiberationSerif-Regular.ttf'],
  ['CivLiberationSerif', '700', 'fonts/LiberationSerif-Bold.ttf'],
  ['CivDejaVuSans', '400', 'fonts/DejaVuSans.ttf'],
  ['CivDejaVuSans', '700', 'fonts/DejaVuSans-Bold.ttf'],
  ['CivNotoEmoji', '400', 'emoji/NotoColorEmoji-civ-subset.ttf'],
];
// Verbatim copy of tests/fixtures/image/gen.mjs mapFamily / mapFont (RR-T8c).
function mapFamily(f) {
  const generic = !/^["']/.test(f);
  const name = f.replace(/^["']|["']$/g, '').trim();
  const l = name.toLowerCase();
  if (generic && l === 'sans-serif') return 'CivLiberationSans';
  if (generic && l === 'serif') return 'CivLiberationSerif';
  if (['arial', 'helvetica', 'liberation sans', 'arimo'].includes(l)) return 'CivLiberationSans';
  if (['times new roman', 'times', 'liberation serif', 'tinos'].includes(l)) return 'CivLiberationSerif';
  if (l === 'dejavu sans') return 'CivDejaVuSans';
  if (l === 'noto color emoji') return 'CivNotoEmoji';
  return null;
}
function mapFont(css) {
  const m = /^(.*?\d+(?:\.\d+)?px(?:\/\S+)?)\s+(.+)$/.exec(css);
  if (!m) throw new Error('mapFont: unsupported ' + css);
  const fams = [];
  for (const f of m[2].split(',').map((s) => s.trim())) {
    const g = mapFamily(f);
    if (g && !fams.includes(g)) fams.push(g);
  }
  for (const last of ['CivDejaVuSans', 'CivNotoEmoji']) if (!fams.includes(last)) fams.push(last);
  return m[1] + ' ' + fams.join(', ');
}

// Web font values (pin edb8fb56).
const F = {
  worker: 'bold 16px Segoe UI, Arial', // render/workerFieldOverlay.ts:98
  okolica: 'bold 13px Segoe UI, Arial', // render/cityOkolicaOverlay.ts:138 (WORKER_BADGE_GLYPH_PX = 13)
  t13e16: '16px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif', // cityOkolicaOverlay.ts:85-86
  t13e17: '17px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif', // worked: round(16·1.1)
  t13e13: '13px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
  t13d: 'bold 16px Arial, Helvetica, sans-serif', // cityOkolicaOverlay.ts:87-88 (YIELD_DIGIT_FONT)
  revolt: '48px serif', // render/cities.ts:714
  siege: 'bold 96px Arial', // render/siegeMarker.ts:42
  skull: 'bold 40px "Segoe UI Symbol", "Segoe UI Emoji", "Segoe UI", Arial, sans-serif', // render/units.ts:6294 (104 px there)
  r4: '12px Arial,sans-serif', // main.ts:12856 (R4 DOM chip style; font value reused on canvas as in RR-T8c)
  power: '900 28px "Segoe UI", Arial, sans-serif', // render/unitStatPlate.ts:609 (size scaled)
  arial20: 'bold 20px Arial, sans-serif',
  arial24: '24px Arial, sans-serif',
  arial18: 'bold 18px Arial, sans-serif',
};

// ---------------------------------------------------------------------------
// Scenes: recorded op lists
// ---------------------------------------------------------------------------
const scenes = [];
function scene(name, w, h, src, fn) {
  const ops = [];
  const ctx = new Proxy({}, {
    get: (_, k) => (...a) => ops.push([k, ...a]),
    set: (_, k, v) => { ops.push([k, v]); return true; },
  });
  fn(ctx);
  scenes.push({ name, w, h, src, ops });
}

scene('m01_stat_line_left_middle', 180, 24, 'okolica font (cityOkolicaOverlay.ts:138) + mixed ⚔ ☠ 👤 label', (ctx) => {
  ctx.font = F.okolica; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f0e6c8';
  ctx.fillText('Zbrojmistrz ⚔ 12 ☠ 3 👤', 4, 12);
});
scene('m02_worker_center', 150, 28, 'worker font (workerFieldOverlay.ts:98), center/middle', (ctx) => {
  ctx.font = F.worker; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff';
  ctx.fillText('👤 Robotnik 2', 75, 14);
});
scene('m03_yield_emoji_stack_top', 160, 24, 'T13 emoji stack (cityOkolicaOverlay.ts:85-86), top/left, alpha 0.95', (ctx) => {
  ctx.font = F.t13e16; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillText('🍞 3 🔨 2 💰 5', 3, 3);
});
scene('m04_text_only_emoji_primary', 200, 40, 'text-only strings, primary face = emoji face (T13 stack): baselines', (ctx) => {
  ctx.font = F.t13e17; ctx.textAlign = 'left'; ctx.fillStyle = '#203040';
  const bl = ['top', 'middle', 'alphabetic', 'bottom', 'hanging', 'ideographic'];
  bl.forEach((b, i) => { ctx.textBaseline = b; ctx.fillText('12', 4 + i * 32, 20); });
});
scene('m05_right_align', 200, 34, 'bold 20px Arial, right/alphabetic', (ctx) => {
  ctx.font = F.arial20; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#e0b24a';
  ctx.fillText('Złoto 💰 +15', 196, 26);
});
scene('m06_end_align_serif', 220, 64, 'revolt font (cities.ts:714) end/alphabetic', (ctx) => {
  ctx.font = F.revolt; ctx.textAlign = 'end'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#ffcc66';
  ctx.fillText('🔥 Bunt', 216, 52);
});
scene('m07_skull_symbol_stack', 160, 56, 'skull stack (units.ts:6294) center/middle, red', (ctx) => {
  ctx.font = F.skull; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#e01e1e';
  ctx.fillText('☠ 3 👤', 80, 28);
});
scene('m08_stroke_then_fill', 200, 44, 'unitStatPlate.ts:609-618 pattern (strokeText outline, then fillText)', (ctx) => {
  ctx.font = F.power; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = '#05070b';
  ctx.strokeText('Ateny 🔥 ⚔', 100, 23);
  ctx.fillStyle = '#fdf6e3'; ctx.fillText('Ateny 🔥 ⚔', 100, 23);
});
scene('m09_stroke_alpha_emoji', 120, 36, 'strokeText: colour glyph drawn filled, strokeStyle alpha multiplies it', (ctx) => {
  ctx.font = F.arial24; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(200,0,0,0.5)'; ctx.fillStyle = 'rgba(0,0,255,0.25)';
  ctx.strokeText('A🔥B👤', 4, 18);
});
scene('m10_fill_alpha', 120, 30, 'fillStyle alpha on text and colour glyph in one call', (ctx) => {
  ctx.font = F.t13d; ctx.textAlign = 'start'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(32,48,64,0.5)';
  ctx.fillText('Rzym 🍞 4', 4, 15);
});
scene('m11_shadow_mixed', 140, 36, 'shadow on a mixed string', (ctx) => {
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 2;
  ctx.font = F.arial18; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fffef8';
  ctx.fillText('Hp 💧 9 🛡', 4, 16);
});
scene('m12_scaled_ctm', 360, 40, 'setTransform(2) (cityMapStatChip.ts:846-851 pattern) + mixed label', (ctx) => {
  ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.font = F.okolica; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = '#f0e6c8'; ctx.fillText('Zbrojmistrz ⚔ 12 ☠ 3 👤', 2.3, 1.6);
});
scene('m13_r4_label', 200, 20, 'R4 font (main.ts:12856) with R4 icons inside a label', (ctx) => {
  ctx.font = F.r4; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#e8d88a';
  ctx.fillText('⛏ Kopalnia 🌾 Farma 🏛', 3, 10);
});
scene('m14_hanging_ideographic', 120, 44, 'hanging / ideographic baselines on a mixed string', (ctx) => {
  ctx.font = F.worker; ctx.textAlign = 'left'; ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'hanging'; ctx.fillText('A👤', 4, 6);
  ctx.textBaseline = 'ideographic'; ctx.fillText('A👤', 60, 38);
});
scene('m15_text_only_regression', 120, 24, 'no emoji: the RR-T8b path unchanged', (ctx) => {
  ctx.font = F.okolica; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f0e6c8';
  ctx.fillText('Zbrojmistrz 12', 60, 12);
});
scene('m16_subpixel_mixed', 200, 28, 'fractional x/y: glyph origins quantised (1/4 px x, whole px y)', (ctx) => {
  ctx.font = F.worker; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff';
  [0, 0.25, 0.5, 0.75].forEach((d, i) => ctx.fillText('7👤', 4 + i * 48 + d, 14 + d));
});
scene('m17_symbols_mono', 200, 40, 'monochrome ⚔ ☠ ◆ beside colour 👤 in the fill colour', (ctx) => {
  ctx.font = F.arial24; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2a7f2a';
  ctx.fillText('⚔☠◆👤◆', 4, 20);
});
scene('m18_siege_word', 420, 110, 'siege font (siegeMarker.ts:42) with ⚔ and 🔥', (ctx) => {
  ctx.font = F.siege; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#101010';
  ctx.fillText('⚔ 🔥 3', 210, 55);
});

// ---------------------------------------------------------------------------
// Widths / baselines
// ---------------------------------------------------------------------------
const WIDTH_FONTS = Object.values(F);
const WIDTH_TEXTS = [
  'Zbrojmistrz ⚔ 12 ☠ 3 👤', '👤 Robotnik 2', '🍞 3 🔨 2 💰 5', 'Złoto 💰 +15', '🔥 Bunt', '☠ 3 👤',
  'Ateny 🔥 ⚔', 'A🔥B👤', 'Rzym 🍞 4', '⛏ Kopalnia 🌾 Farma 🏛', '12', 'x🔥', '🔥x', ' 👤 ', 'a\t🔥',
  '👤👤👤 3', 'Łódź🏰Kraków', '◆ 7 ◆', 'ŻÓŁW 💰', 'AV🔥AV', 'Hp 💧 9 🛡', '7👤',
];
const widthRows = [];
for (const f of WIDTH_FONTS) for (const t of WIDTH_TEXTS) widthRows.push([f, t]);
const BASELINE_ROWS = [];
for (const f of [F.t13e13, F.t13e16, F.t13e17, F.worker, F.arial24, F.revolt]) {
  for (const t of ['12', 'A', 'A🔥', '🔥 3']) BASELINE_ROWS.push([f, t]);
}

// ---------------------------------------------------------------------------
// Chromium
// ---------------------------------------------------------------------------
const noTab = (s) => { if (/[\t\n]/.test(String(s))) throw new Error('tab/newline in field: ' + JSON.stringify(s)); return String(s); };
const esc = (s) => String(s).replace(/\t/g, '\\t');
const faces = FACE_FILES.map(([fam, w, file]) => [fam, w, readFileSync(ASSETS + file).toString('base64')]);
const browser = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb', '--font-render-hinting=none'] });
const version = browser.version();
const page = await browser.newPage();
const result = await page.evaluate(async ({ faces, scenes, widthRows, BASELINE_ROWS, mapFontSrc, mapFamilySrc }) => {
  for (const [fam, w, b64] of faces) {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const f = new FontFace(fam, bin, { weight: w });
    await f.load();
    document.fonts.add(f);
  }
  // eslint-disable-next-line no-new-func
  const mapFamily = new Function('return ' + mapFamilySrc)();
  const mapFont = new Function('mapFamily', 'return ' + mapFontSrc)(mapFamily);
  const b64 = (u8) => {
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const m = document.createElement('canvas').getContext('2d');
  const widths = widthRows.map(([font, text]) => { m.font = mapFont(font); return m.measureText(text).width; });
  const baselines = [];
  for (const [f, t] of BASELINE_ROWS) {
    for (const bl of ['alphabetic', 'top', 'hanging', 'middle', 'ideographic', 'bottom']) {
      m.font = mapFont(f); m.textBaseline = bl;
      baselines.push([f, bl, t, m.measureText(t).alphabeticBaseline]);
    }
  }
  m.textBaseline = 'alphabetic';
  // Probe: strokeText of a colour glyph (sum of straight channels over the canvas).
  const probes = [];
  const mass = (ctx) => { const d = ctx.getImageData(0, 0, 80, 60).data; const s = [0, 0, 0, 0]; for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 4; k++) s[k] += d[i + k]; return s; };
  const probe = (name, fn) => {
    const c = document.createElement('canvas'); c.width = 80; c.height = 60; const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.font = mapFont('40px Arial'); ctx.textBaseline = 'middle'; fn(ctx); probes.push([name, ...mass(ctx)]);
  };
  probe('fill_opaque', (c) => { c.fillStyle = '#0000ff'; c.fillText('🔥', 10, 30); });
  probe('stroke_opaque_lw3', (c) => { c.strokeStyle = '#ff0000'; c.lineWidth = 3; c.strokeText('🔥', 10, 30); });
  probe('stroke_opaque_lw12', (c) => { c.strokeStyle = '#00ff00'; c.lineWidth = 12; c.strokeText('🔥', 10, 30); });
  probe('stroke_alpha_0.5', (c) => { c.strokeStyle = 'rgba(255,0,0,0.5)'; c.lineWidth = 3; c.strokeText('🔥', 10, 30); });
  probe('stroke_fill_alpha_0.5', (c) => { c.fillStyle = 'rgba(0,0,255,0.5)'; c.strokeStyle = '#ff0000'; c.lineWidth = 3; c.strokeText('🔥', 10, 30); });
  const out = {};
  for (const sc of scenes) {
    const c = document.createElement('canvas');
    c.width = sc.w; c.height = sc.h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    for (const op of sc.ops) {
      const [name, ...a] = op;
      switch (name) {
        case 'font': ctx.font = mapFont(a[0]); break;
        case 'fillStyle': case 'strokeStyle': case 'lineWidth': case 'lineJoin': case 'shadowColor':
        case 'shadowBlur': case 'shadowOffsetY': case 'textAlign': case 'textBaseline': ctx[name] = a[0]; break;
        default: ctx[name](...a);
      }
    }
    out[sc.name] = b64(ctx.getImageData(0, 0, sc.w, sc.h).data);
  }
  return { widths, baselines, probes, out, ua: navigator.userAgent };
}, { faces, scenes, widthRows, BASELINE_ROWS, mapFontSrc: mapFont.toString(), mapFamilySrc: mapFamily.toString() });
await browser.close();

rmSync(OUT + 'ref', { recursive: true, force: true });
mkdirSync(OUT + 'ref', { recursive: true });
let tsv = '# R-RUSTPORT-P4-35 textmix scenes — generated by gen.mjs; do not edit by hand.\n';
tsv += '# scene<TAB>name<TAB>w<TAB>h<TAB>source ; op lines: op<TAB>args… ; end\n';
for (const s of scenes) {
  tsv += ['scene', s.name, s.w, s.h, s.src].map(noTab).join('\t') + '\n';
  for (const op of s.ops) tsv += op.map(noTab).join('\t') + '\n';
  tsv += 'end\n';
}
writeFileSync(OUT + 'scenes.tsv', tsv);
for (const [name, data] of Object.entries(result.out)) writeFileSync(OUT + `ref/${name}.rgba`, Buffer.from(data, 'base64'));
let w = '# font (web value)<TAB>text (\\t = U+0009)<TAB>Chromium measureText(text).width (font mapped to the bundled faces)\n';
widthRows.forEach(([f, t], i) => { w += [f, esc(t), String(result.widths[i])].map(noTab).join('\t') + '\n'; });
writeFileSync(OUT + 'widths.tsv', w);
let b = '# font<TAB>textBaseline<TAB>text<TAB>measureText(text).alphabeticBaseline\n';
for (const r of result.baselines) b += r.map((x) => noTab(String(x))).join('\t') + '\n';
writeFileSync(OUT + 'baselines.tsv', b);
let p = '# probe<TAB>sum R<TAB>sum G<TAB>sum B<TAB>sum A (straight RGBA8 over an 80x60 canvas, 40px, 🔥 at (10, 30) middle)\n';
for (const r of result.probes) p += r.map((x) => noTab(String(x))).join('\t') + '\n';
writeFileSync(OUT + 'probes.tsv', p);
writeFileSync(OUT + 'versions.txt', `node ${process.version}\nplaywright ${require('playwright/package.json').version}\nchromium ${version}\nfont-render-hinting none\nuserAgent ${result.ua}\n`);

const files = ['gen.mjs', 'scenes.tsv', 'widths.tsv', 'baselines.tsv', 'probes.tsv', 'versions.txt',
  ...readdirSync(OUT + 'ref').sort().map((f) => 'ref/' + f)];
let man = '';
for (const f of files) man += createHash('sha256').update(readFileSync(OUT + f)).digest('hex') + '  ' + f + '\n';
for (const [, , file] of FACE_FILES) man += createHash('sha256').update(readFileSync(ASSETS + file)).digest('hex') + '  ../../../assets/' + file + '\n';
writeFileSync(OUT + 'MANIFEST.sha256', man);
console.log(`scenes=${scenes.length} widths=${widthRows.length} baselines=${result.baselines.length} probes=${result.probes.length} chromium=${version}`);
