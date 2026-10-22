// R-RUSTPORT-P4-32-MOD08-UNIT-OVERLAY-Q1 — reference generator (node half).
//
// 1. bundles gen.ts (the web modules of pin edb8fb56, unchanged, + three@0.169.0)
//    with esbuild 0.24.0 into an IIFE;
// 2. prepares the asset strings exactly as main.ts:8526-8541 injects them:
//    brandIconSvg('chip-death'|'bld-koszary'|'bld-kuznia', 40) and
//    civIconSvg(civ, 40) (ui/icons/brandAssets.ts: normalizeSvg :50-61 taken
//    VERBATIM from the pin and type-stripped; resolution :71-84 / :196-203
//    re-implemented over the pin tree — same code as tests/fixtures/image/gen.mjs),
//    JPG portraits as data: URIs (bytes of gra/src/assets/portrety/*.jpg);
// 3. runs the bundle in headless Chromium 141 (playwright 1.56.1,
//    --disable-gpu --force-color-profile=srgb --font-render-hinting=none) with the
//    bundled fonts loaded as FontFace objects and the canvas `font` setter mapped
//    onto them (mapFont, as tests/fixtures/image/gen.mjs);
// 4. writes overlay.json, ref/<texture>.rgba (straight RGBA8 = getImageData),
//    input/*, versions.txt, MANIFEST.sha256 into <out-dir>.
//
// Layout (scratch, outside the repository):
//   $S/websrc   = git archive edb8fb56 gra/src gra/data
//   $S/ref      = npm install three@0.169.0 esbuild@0.24.0
//   $S/refscript/{gen.ts,gen.mjs} (+ node_modules -> ../ref/node_modules)
// Run (from $S/refscript):
//   NODE_PATH=$S/ref/node_modules:/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
//     node gen.mjs <out-dir> <rust-port/renderer/assets>

import { createRequire, stripTypeScriptTypes } from 'node:module';
import { writeFileSync, mkdirSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const esbuild = require('esbuild');

const OUT = process.argv[2].replace(/\/?$/, '/');
const ASSETS = process.argv[3].replace(/\/?$/, '/');
const HERE = new URL('./', import.meta.url).pathname;
const WEB = HERE + '../websrc/';

// ---------------------------------------------------------------- bundle
const bundle = await esbuild.build({
  entryPoints: [HERE + 'gen.ts'], bundle: true, platform: 'browser', format: 'iife', write: false,
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

// Only the generated parts are replaced (README.md and the Rust golden.tsv stay).
rmSync(OUT + 'input', { recursive: true, force: true });
rmSync(OUT + 'ref', { recursive: true, force: true });
mkdirSync(OUT + 'input', { recursive: true });
mkdirSync(OUT + 'ref', { recursive: true });
const fileOfSvg = (k) => k.replace(':', '-') + '-40.svg';
for (const [k, s] of Object.entries(SVGS)) if (s) writeFileSync(OUT + 'input/' + fileOfSvg(k), s);
const portraitUris = {};
for (const [k, name] of Object.entries(PORTRAITS)) {
  const bytes = readFileSync(WEB + `gra/src/assets/portrety/${name}.jpg`);
  writeFileSync(OUT + `input/${name}.jpg`, bytes);
  portraitUris[k] = 'data:image/jpeg;base64,' + bytes.toString('base64');
}

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

// ---------------------------------------------------------------- the same bundle in node (V8 of node 22)
// Every other MOD fixture of the port (P4.11 pattern) takes its NUMBERS from node; Chromium 141 ships a
// newer V8 whose Math.pow differs in the last bit for some inputs (measured: 30 of the 256 sRGB→linear
// conversions of THREE.Color.setHex). So the trees (numbers) are taken from node, the canvases from
// Chromium, and every Chromium-vs-node difference of the trees is listed in the fixture (and must be a
// colour channel off by at most 1 ulp — anything else aborts the generator).
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
const diffs = [];
function deepDiff(a, b, path) {
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b) || (a === null) !== (b === null)) { diffs.push([path, a, b]); return; }
  if (a && typeof a === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) deepDiff(a[k], b[k], `${path}.${k}`);
  } else if (a !== b) diffs.push([path, a, b]);
}
for (const k of ['keys', 'consts', 'labels', 'trees', 'geos', 'inputs']) deepDiff(nodeResult[k], result[k], k);
for (const [path, n, c] of diffs) {
  const colourUlp = /\.mat\.(color|emissive)\.\d$/.test(path) && /^[0-9a-f]{16}$/.test(n) && /^[0-9a-f]{16}$/.test(c)
    && Math.abs(Number(BigInt('0x' + n) - BigInt('0x' + c))) <= 1;
  // The star outline points (Math.cos / Math.sin) also differ in the last bit; they only appear in the
  // informational `params` JSON of the ExtrudeGeometry — its f32 position/normal/uv arrays are compared
  // above and must be identical (otherwise this check aborts).
  const shapeParam = /^geos\.\d+\.params\.shapes\./.test(path) && typeof n === 'number' && typeof c === 'number'
    && Math.abs(n - c) <= 4 * Number.EPSILON * Math.max(Math.abs(n), Math.abs(c));
  const ok = colourUlp || shapeParam;
  if (!ok) throw new Error(`Chromium vs node differ beyond a 1-ulp colour channel: ${path} ${n} ${c}`);
}
console.log(`chromium-vs-node tree differences: ${diffs.length} (colour channels 1 ulp: ${diffs.filter((d) => /\.mat\./.test(d[0])).length}, star shape params: ${diffs.filter((d) => /^geos\./.test(d[0])).length})`);

// ---------------------------------------------------------------- outputs
for (const [id, data] of Object.entries(result.snapshots)) writeFileSync(OUT + `ref/${id}.rgba`, Buffer.from(data, 'base64'));
delete result.snapshots;
const json = { ...result };
delete json.ua;
for (const k of ['keys', 'consts', 'labels', 'trees', 'geos', 'inputs']) json[k] = nodeResult[k];
json.chromiumTreeDiffs = diffs;
writeFileSync(OUT + 'overlay.json', JSON.stringify(json, null, 0) + '\n');
writeFileSync(OUT + 'versions.txt', `node ${process.version}\nplaywright ${require('playwright/package.json').version}\nchromium ${version}\nthree ${JSON.parse(readFileSync(HERE + 'node_modules/three/package.json', 'utf8')).version}\nesbuild ${JSON.parse(readFileSync(HERE + 'node_modules/esbuild/package.json', 'utf8')).version}\nfont-render-hinting none\nuserAgent ${result.ua}\n`);
const files = ['gen.ts', 'gen.mjs', 'overlay.json', 'versions.txt',
  ...readdirSync(OUT + 'input').sort().map((f) => 'input/' + f),
  ...readdirSync(OUT + 'ref').sort().map((f) => 'ref/' + f)];
for (const f of ['gen.ts', 'gen.mjs']) writeFileSync(OUT + f, readFileSync(HERE + f));
let man = '';
for (const f of files) man += createHash('sha256').update(readFileSync(OUT + f)).digest('hex') + '  ' + f + '\n';
for (const [, , file] of FACE_FILES) man += createHash('sha256').update(readFileSync(ASSETS + file)).digest('hex') + '  ../../../assets/' + file + '\n';
writeFileSync(OUT + 'MANIFEST.sha256', man);
console.log(`textures=${result.textureList.length} trees=${result.trees.length} keys=${result.keys.length} geos=${result.geos.length} images=${result.imageResults.join(',')} chromium=${version}`);
if (!existsSync(OUT + 'overlay.json')) process.exit(2);
