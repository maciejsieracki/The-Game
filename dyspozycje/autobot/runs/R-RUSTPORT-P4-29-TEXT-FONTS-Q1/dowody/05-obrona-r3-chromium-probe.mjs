// R-RUSTPORT-P4-29-TEXT-FONTS-Q1 — obrona r3: sondy Chromium dla zarzutów 1–3 (Evaluator r3).
//
// UWAGA: w kontenerze obrony r3 dostępny jest WYŁĄCZNIE Chromium z playwright 1.63
// (chromium-1243 = 153.x). Chromium 141.0.7390.37 z referencji (`versions.txt`)
// NIE jest dostępny, więc wynik to pomiar Chromium 153, nie 141 — nie wchodzi do
// `tests/fixtures/text/` (tam tylko 141), jest dowodem obok testów.
//
// Fonty: te same pliki co `rust-port/renderer/assets/fonts/`, jako FontFace pod
// nazwami z `gen.mjs` (CivLiberationSans / CivLiberationSerif / CivDejaVuSans).
//
// Uruchomienie (z katalogu repo):
//   NODE_PATH=/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
//     node dyspozycje/autobot/runs/R-RUSTPORT-P4-29-TEXT-FONTS-Q1/dowody/05-obrona-r3-chromium-probe.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = new URL('../../../../../', import.meta.url).pathname;
const FONT_DIR = ROOT + 'rust-port/renderer/assets/fonts/';
const FACE_FILES = [
  ['CivLiberationSans', '400', 'LiberationSans-Regular.ttf'],
  ['CivLiberationSans', '700', 'LiberationSans-Bold.ttf'],
  ['CivLiberationSerif', '400', 'LiberationSerif-Regular.ttf'],
  ['CivLiberationSerif', '700', 'LiberationSerif-Bold.ttf'],
  ['CivDejaVuSans', '400', 'DejaVuSans.ttf'],
  ['CivDejaVuSans', '700', 'DejaVuSans-Bold.ttf'],
];
const faces = FACE_FILES.map(([f, w, file]) => [f, w, readFileSync(FONT_DIR + file).toString('base64')]);

// Rust font string (web stack) → the same stack over the bundled faces (as gen.mjs mapFont).
const FONTS = {
  name: ['700 22px Georgia, "Times New Roman", serif', '700 22px CivLiberationSerif, CivDejaVuSans'],
  hover: ['600 11px Arial, Helvetica, sans-serif', '600 11px CivLiberationSans, CivDejaVuSans'],
  sans16: ['16px sans-serif', '16px CivLiberationSans, CivDejaVuSans'],
  serif100: ['100px serif', '100px CivLiberationSerif, CivDejaVuSans'],
  serif100b: ['bold 100px serif', 'bold 100px CivLiberationSerif, CivDejaVuSans'],
};
const WS = ['a b', 'a\tb', 'a\nb', 'a\fb', 'a\rb', 'A V', 'A\nV', 'A\rV', 'A\fV', 'A\tV', 'AV', '\n', '\r\n'];
const SURR = ['A\uD835', 'A\uFFFD', 'A\uDC00', '\uD835', '\uFFFD', 'AB\uD835…', 'AB\uFFFD…', 'AB…',
  // U+1F031 DOMINO TILE HORIZONTAL-00-00 = 🀱: in DejaVu Sans (Bold), not an emoji, and wider
  // than both U+FFFD and '…' in these fonts, so a lone high surrogate can END the truncation loop.
  'AB🀱', 'AB🀱…', 'AB\uD83C…', 'AB🀱🀱', 'AB🀱\uD83C…',
  'Jednostka · 🀱🀱', 'Jednostka · 🀱\uD83C…', 'Jednostka · \uD83C…'];
// Truncation jobs (kind, font key, maxW, input): the web loops verbatim.
const TRUNC = [
  ['name', 'name', 58, 'AB🀱'],
  ['name', 'name', 80, 'AB🀱🀱'],
  ['name', 'name', 110, 'AB🀱🀱'],
  ['hover', 'hover', 70, 'Jednostka · 🀱🀱'],
  ['hover', 'hover', 76, 'Jednostka · 🀱🀱'],
  ['hover', 'hover', 88, 'Jednostka · 🀱🀱'],
];

const browser = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb', '--font-render-hinting=none'] });
const version = browser.version();
const page = await browser.newPage();
const out = await page.evaluate(async ({ faces, FONTS, WS, SURR, TRUNC }) => {
  for (const [fam, w, b64] of faces) {
    const f = new FontFace(fam, Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), { weight: w });
    await f.load();
    document.fonts.add(f);
  }
  const m = document.createElement('canvas').getContext('2d');
  const widths = [];
  for (const key of ['name', 'hover', 'sans16']) {
    m.font = FONTS[key][1];
    for (const t of [...WS, ...SURR]) widths.push([FONTS[key][0], t, m.measureText(t).width]);
  }
  // Pixels: lone high surrogate vs U+FFFD drawn (fillText), name font.
  const draw = (font, t) => {
    const c = document.createElement('canvas');
    c.width = 120; c.height = 40;
    const g = c.getContext('2d');
    g.font = font; g.fillStyle = '#000'; g.fillText(t, 4, 30);
    return Array.from(g.getImageData(0, 0, 120, 40).data);
  };
  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const surrPixels = [];
  for (const [a, b] of [['AB\uD835…', 'AB\uFFFD…'], ['A\uDC00', 'A\uFFFD'], ['\uD835', '\uFFFD']]) {
    const pa = draw(FONTS.name[1], a), pb = draw(FONTS.name[1], b);
    surrPixels.push([a, b, same(pa, pb), pa.some((v, i) => i % 4 === 3 && v > 0)]);
  }
  // truncateName verbatim (cityMapStatChip.ts:766-779) on a name ending with an astral char.
  function truncateName(ctx, name, maxW, font) {
    ctx.font = font;
    if (ctx.measureText(name).width <= maxW) return name;
    let s = name;
    while (ctx.measureText(s + '…').width > maxW && s.length > 1) s = s.slice(0, -1);
    return s + '…';
  }
  const units = (t) => [...Array(t.length)].map((_, i) => t.charCodeAt(i).toString(16)).join(' ');
  const trunc = TRUNC.map(([kind, key, maxW, input]) => {
    const font = FONTS[key][1];
    let r;
    if (kind === 'name') r = truncateName(m, input, maxW, font);
    else {
      // render/cityMapStatChip.ts:711-715 (hover row), verbatim.
      m.font = font;
      let line = input;
      if (m.measureText(line).width > maxW && line.length > 1) {
        let s = line;
        while (s.length > 1 && m.measureText(s + '…').width > maxW) s = s.slice(0, -1);
        line = s + '…';
      }
      r = line;
    }
    return [kind, FONTS[key][0], maxW, input, r, units(r)];
  });
  // Combining marks: ink boxes of the marks of "x̣́" (pixels of the combined string
  // above the top / below the bottom of the ink of "x" alone), pen at (20, 120), alpha > 0.
  const ink = (font, t) => {
    const c = document.createElement('canvas');
    c.width = 160; c.height = 200;
    const g = c.getContext('2d');
    g.font = font; g.fillStyle = '#000'; g.fillText(t, 20, 120);
    const d = g.getImageData(0, 0, 160, 200).data;
    return (x, y) => d[(y * 160 + x) * 4 + 3];
  };
  const box = (a, rowOk) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < 200; y++) if (rowOk(y)) for (let x = 0; x < 160; x++) if (a(x, y) > 0) {
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    return [x0, y0, x1, y1];
  };
  const marks = [];
  for (const key of ['serif100', 'serif100b']) {
    const base = box(ink(FONTS[key][1], 'x'), () => true);
    const comb = ink(FONTS[key][1], 'x̣́');
    marks.push({ font: FONTS[key][0], base, above: box(comb, (y) => y < base[1]), below: box(comb, (y) => y > base[3]) });
  }
  // Zarzut 9 (informacyjnie): U+1D400 MATHEMATICAL BOLD CAPITAL A is in none of the bundled faces;
  // a width off the size/2048 grid shows Chromium reaching a system font for it.
  m.font = FONTS.name[1];
  const sysFallback = [['AB', m.measureText('AB').width], ['AB\uD835\uDC00', m.measureText('AB\uD835\uDC00').width]];
  return { widths, surrPixels, trunc, marks, sysFallback };
}, { faces, FONTS, WS, SURR, TRUNC });
await browser.close();

const escUnits = (s) => { let r = ''; for (let i = 0; i < s.length; i++) { const u = s.charCodeAt(i); r += u < 0x20 || (u >= 0xd800 && u <= 0xdfff) || u === 0xfffd ? `\\u{${u.toString(16)}}` : s[i]; } return r; };
console.log(`chromium ${version} (playwright ${require('playwright/package.json').version}, node ${process.version})`);
console.log('# measureText widths: font | text | width');
for (const [f, t, w] of out.widths) console.log(`W\t${f}\t${escUnits(t)}\t${w}`);
console.log('# fillText pixels identical (lone surrogate vs U+FFFD): a | b | identical | any ink');
for (const [a, b, s, inked] of out.surrPixels) console.log(`P\t${escUnits(a)}\t${escUnits(b)}\t${s}\t${inked}`);
console.log('# truncation (web loops verbatim): kind | font | maxW | input | result | result UTF-16 units');
for (const [k, f, w, i, r, u] of out.trunc) console.log(`T\t${k}\t${f}\t${w}\t${escUnits(i)}\t${escUnits(r)}\t${u}`);
console.log('# marks of x\\u0301\\u0323 at pen (20,120): [x0,y0,x1,y1] inclusive pixel boxes, alpha > 0');
for (const mk of out.marks) console.log(`M\t${mk.font}\tbase ${mk.base}\tabove ${mk.above}\tbelow ${mk.below}`);
console.log('# system fallback (zarzut 9): font name | text | width | width * 2048 / 22 (integer = on the font grid)');
for (const [t, w] of out.sysFallback) console.log(`S\t${FONTS.name[0]}\t${escUnits(t)}\t${w}\t${(w * 2048) / 22}`);
