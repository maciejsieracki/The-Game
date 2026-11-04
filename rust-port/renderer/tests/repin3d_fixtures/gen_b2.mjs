// R-RUSTPORT-REPIN-3D-B2-Q1 — reference generator (node half) for batch B2.
//
// The harness is tests/fixtures/overlay/gen.mjs (R-RUSTPORT-P4-32) with three changes:
// entry gen_b2.ts instead of gen.ts; the outputs are b2.json + b2_ref/<id>.rgba; the asset
// strings / portraits computed from ../websrc (= git archive origin/main gra/src gra/data)
// must be byte-identical to tests/fixtures/overlay/input/* (third argument), which the Rust
// test reads — otherwise the generator aborts. The node run of the same bundle (stub canvas)
// must give the identical keys / constants / plate numbers as Chromium (else abort).
//
// Layout (scratch, outside the repository):
//   $S/websrc   = git archive origin/main gra/src gra/data
//   $S/ref      = npm install three@0.169.0 esbuild@0.24.0
//   $S/refscript/{gen_b2.ts,gen_b2.mjs} (+ node_modules -> ../ref/node_modules)
// Run (from $S/refscript):
//   NODE_PATH=$S/ref/node_modules:/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
//     node gen_b2.mjs <out-dir> <rust-port/renderer/assets> <rust-port/renderer/tests/fixtures/overlay/input>

import { createRequire, stripTypeScriptTypes } from 'node:module';
import { writeFileSync, mkdirSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const esbuild = require('esbuild');

const OUT = process.argv[2].replace(/\/?$/, '/');
const ASSETS = process.argv[3].replace(/\/?$/, '/');
const INPUT_DIR = process.argv[4].replace(/\/?$/, '/');
const HERE = new URL('./', import.meta.url).pathname;
const WEB = HERE + '../websrc/';

// ---------------------------------------------------------------- bundle
const bundle = await esbuild.build({
  entryPoints: [HERE + 'gen_b2.ts'], bundle: true, platform: 'browser', format: 'iife', write: false,
  logLevel: 'warning', nodePaths: [HERE + 'node_modules'],
});
const bundleJs = bundle.outputFiles[0].text;

// ---------------------------------------------------------------- fonts (= tests/fixtures/image/gen.mjs)
const FACE_FILES = [
  ['CivLiberationSans', '400', 'fonts/LiberationSans-Regular.ttf'],
  ['CivLiberationSans', '700', 'fonts/LiberationSans-Bold.ttf'],
  ['CivLiberationSerif', '400', 'fonts/LiberationSerif-Regular.ttf'],
  ['CivLiberationSerif', '700', 'fonts/LiberationSerif-Bold.ttf'],
  ['CivDejaVuSans', '400', 'fonts/DejaVuSans.ttf'],
  ['CivDejaVuSans', '700', 'fonts/DejaVuSans-Bold.ttf'],
  ['CivNotoEmoji', '400', 'emoji/NotoColorEmoji-civ-subset.ttf'],
];
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

// ---------------------------------------------------------------- assets (as main.ts:8526-8541)
const rd = (p) => readFileSync(WEB + p, 'utf8');
const NORMALIZE = (() => {
  const src = rd('gra/src/ui/icons/brandAssets.ts');
  const start = src.indexOf('function normalizeSvg(');
  const end = src.indexOf('\n}\n', start);
  // eslint-disable-next-line no-new-func
  return new Function(stripTypeScriptTypes(src.slice(start, end + 2)) + '\nreturn normalizeSvg;')();
})();
const BRAND_DIR = 'gra/src/ui/icons/brand/';
const brandFiles = execSync(`find ${WEB + BRAND_DIR} -name '*.svg'`).toString().trim().split('\n')
  .map((p) => p.slice(WEB.length)).sort();
function findSvgRaw(suffix) {
  const hits = brandFiles.filter((p) => p.endsWith(suffix));
  if (hits.length > 1) throw new Error(`ambiguous ${suffix}: ${hits}`);
  return hits.length ? rd(hits[0]) : '';
}
const manifest = JSON.parse(rd(BRAND_DIR + 'icons-manifest.json'));
const civMap = JSON.parse(rd(BRAND_DIR + 'civ-icon-map.json'));
function brandIconSvg(id, size) {
  const e = manifest.icons[id];
  const rel = e ? (size === 40 ? e['40'] : e['24']) : '';
  if (rel) { const s = NORMALIZE(findSvgRaw(rel.replace(/^eksport\/icons\//, '')), size); if (s) return s; }
  const flat = NORMALIZE(findSvgRaw(`${id}.svg`), size);
  if (flat) return flat;
  throw new Error('brandIconSvg: no ' + id);
}
function civIconSvg(id, size) {
  const raw = civMap.map[id] ?? civMap.map._default;
  const rel = raw.replace(/^eksport\/icons\//, '').replace(/^icons\//, '');
  return NORMALIZE(findSvgRaw(rel), size) || NORMALIZE(findSvgRaw('civilizations/civ-default.svg'), size);
}
const SVGS = {
  'chip-death': brandIconSvg('chip-death', 40),
  'bld-koszary': brandIconSvg('bld-koszary', 40),
  'bld-kuznia': brandIconSvg('bld-kuznia', 40),
  'civ:grecy': civIconSvg('grecy', 40),
  'civ:zulusi': civIconSvg('zulusi', 40),
  'civ:nieznana': civIconSvg('nieznana', 40),
  'civ:brak': '', // a civ whose sigil the asset source returns as '' (UnitOwnerEmblemAssets: "może być ''")
};
const PORTRAITS = { 'grecy|2': 'portrait-grecy-braz', 'zulusi|3': 'portrait-zulusi-zelazo', 'egipt|1': 'portrait-egipt-kamien' };

// The asset bytes must equal the inputs the Rust test reads (tests/fixtures/overlay/input).
const fileOfSvg = (k) => k.replace(':', '-') + '-40.svg';
const sameBytes = (a, f) => { if (!Buffer.from(a).equals(readFileSync(INPUT_DIR + f))) throw new Error('asset differs from overlay/input: ' + f); };
for (const [k, s] of Object.entries(SVGS)) if (s) sameBytes(s, fileOfSvg(k));
const portraitUris = {};
for (const [k, name] of Object.entries(PORTRAITS)) {
  const bytes = readFileSync(WEB + `gra/src/assets/portrety/${name}.jpg`);
  sameBytes(bytes, `${name}.jpg`);
  portraitUris[k] = 'data:image/jpeg;base64,' + bytes.toString('base64');
}
rmSync(OUT + 'b2_ref', { recursive: true, force: true });
mkdirSync(OUT + 'b2_ref', { recursive: true });

// ---------------------------------------------------------------- Chromium
const faces = FACE_FILES.map(([fam, w, file]) => [fam, w, readFileSync(ASSETS + file).toString('base64')]);
const browser = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb', '--font-render-hinting=none'] });
const version = browser.version();
const page = await browser.newPage();
page.on('console', (m) => console.log('[page]', m.text()));
page.on('pageerror', (e) => { console.error('[pageerror]', e); process.exitCode = 3; });
await page.evaluate(async ({ faces, mapFontSrc, mapFamilySrc }) => {
  for (const [fam, w, b64] of faces) {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const f = new FontFace(fam, bin, { weight: w });
    await f.load();
    document.fonts.add(f);
  }
  // eslint-disable-next-line no-new-func
  const mapFamily = new Function('return ' + mapFamilySrc)();
  const mapFont = new Function('mapFamily', 'return ' + mapFontSrc)(mapFamily);
  const d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font');
  Object.defineProperty(CanvasRenderingContext2D.prototype, 'font', {
    configurable: true, get() { return d.get.call(this); }, set(v) { d.set.call(this, mapFont(v)); },
  });
  window.OVERLAY_PENDING = [];
  const NativeImage = window.Image;
  window.Image = function Image(...a) {
    const img = new NativeImage(...a);
    window.OVERLAY_PENDING.push(new Promise((res) => {
      img.addEventListener('load', () => res('load'));
      img.addEventListener('error', () => res('error'));
    }));
    return img;
  };
}, { faces, mapFontSrc: mapFont.toString(), mapFamilySrc: mapFamily.toString() });
await page.evaluate(({ svgs, portraits }) => { window.OVERLAY_INPUT = { svgs, portraits }; }, { svgs: SVGS, portraits: portraitUris });
await page.addScriptTag({ content: bundleJs });
const result = await page.evaluate(async () => {
  const r = await window.OVERLAY_RUN();
  r.imageResults = await Promise.all(window.OVERLAY_PENDING);
  r.ua = navigator.userAgent;
  return r;
});
await browser.close();

// ---------------------------------------------------------------- the same bundle in node (stub canvas)
const nodeResult = await (async () => {
  const g = globalThis;
  const ctx2d = new Proxy({}, {
    get: (_t, k) => (k === 'getImageData' ? (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : () => {}),
    set: () => true,
  });
  g.window = g;
  g.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
  g.OVERLAY_PENDING = [];
  g.Image = class { set src(_v) { setTimeout(() => this.onerror?.(), 0); } };
  g.OVERLAY_INPUT = { svgs: SVGS, portraits: portraitUris };
  // eslint-disable-next-line no-new-func
  new Function(bundleJs)();
  return g.OVERLAY_RUN();
})();
for (const k of ['keys', 'consts', 'plates', 'bases', 'rings']) {
  if (JSON.stringify(nodeResult[k]) !== JSON.stringify(result[k])) throw new Error('Chromium vs node differ: ' + k);
}
for (const k of ['textures']) {
  const strip = (a) => a.map(({ tex, ...r }) => r);
  if (JSON.stringify(strip(nodeResult[k])) !== JSON.stringify(strip(result[k]))) throw new Error('Chromium vs node differ: ' + k);
}

// ---------------------------------------------------------------- outputs
for (const [id, data] of Object.entries(result.snapshots)) writeFileSync(OUT + `b2_ref/${id}.rgba`, Buffer.from(data, 'base64'));
delete result.snapshots;
const json = { ...result, chromium: version, ua: undefined };
delete json.ua;
writeFileSync(OUT + 'b2.json', JSON.stringify(json, null, 0) + '\n');
console.log(`b2 keys=${result.keys.length} textures=${result.textures.length} unique=${result.textureList.length} plates=${result.plates.length} images=${result.imageResults.join(',')} chromium=${version}`);
