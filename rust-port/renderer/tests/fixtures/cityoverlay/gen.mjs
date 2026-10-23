// R-RUSTPORT-P4-33-MOD10-CITY-CHIP-Q1 — reference generator (node half).
//
// 1. bundles gen.ts (the web modules of pin edb8fb56, unchanged, + three@0.169.0)
//    with esbuild 0.24.0 into an IIFE;
// 2. prepares the asset strings as main.ts:8531-8535 injects them:
//    civIconSvg(civ, 40), buildingIconSvg(undefined, 'spichlerz') and the unit icon
//    'unit-spear' @24 (ui/icons/brandAssets.ts: normalizeSvg :50-61 taken VERBATIM
//    from the pin and type-stripped; resolution re-implemented over the pin tree —
//    same code as tests/fixtures/overlay/gen.mjs), JPG portraits as data: URIs
//    (bytes of gra/src/assets/portrety/*.jpg);
// 3. runs the bundle in headless Chromium 141 (playwright 1.56.1,
//    --disable-gpu --force-color-profile=srgb --font-render-hinting=none) on three
//    pages (devicePixelRatio 1, 2, 1.5) with the bundled fonts loaded as FontFace
//    objects and the canvas `font` setter mapped onto them (mapFont, as
//    tests/fixtures/overlay/gen.mjs);
// 4. runs the same bundle in node 22 for the numbers of the okolica / worker trees
//    (stub canvas), lists every Chromium-vs-node difference of those trees;
// 5. writes city.json, ref/<id>.rgba (straight RGBA8 = getImageData, deduplicated by
//    content), input/*, versions.txt, MANIFEST.sha256 into <out-dir>.
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
  logLevel: 'warning', nodePaths: [HERE + 'node_modules'], loader: { '.json': 'json' },
});
const bundleJs = bundle.outputFiles[0].text;

// ---------------------------------------------------------------- fonts (= tests/fixtures/overlay/gen.mjs)
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

// ---------------------------------------------------------------- assets (as main.ts:8531-8535)
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
const civMap = JSON.parse(rd(BRAND_DIR + 'civ-icon-map.json'));
function civIconSvg(id, size) {
  const raw = civMap.map[id] ?? civMap.map._default;
  const rel = raw.replace(/^eksport\/icons\//, '').replace(/^icons\//, '');
  return NORMALIZE(findSvgRaw(rel), size) || NORMALIZE(findSvgRaw('civilizations/civ-default.svg'), size);
}
const SVGS = {
  'civ:grecy': civIconSvg('grecy', 40),
  'civ:zulusi': civIconSvg('zulusi', 40),
  'civ:egipt': civIconSvg('egipt', 40),
  'civ:nieznana': civIconSvg('nieznana', 40), // unknown civ → civ-default
  'bld-spichlerz': NORMALIZE(findSvgRaw('buildings/bld-spichlerz.svg'), 24), // buildingIconSvg(undefined, 'spichlerz')
  'unit-spear': NORMALIZE(findSvgRaw('units/unit-spear.svg'), 24), // unitIconSvg(undefined, 'Wlocznik') → 'wlocznik' → unit-spear
};
for (const [k, s] of Object.entries(SVGS)) if (!s) throw new Error('empty svg ' + k);
const PORTRAITS = { 'grecy|2': 'portrait-grecy-braz', 'zulusi|3': 'portrait-zulusi-zelazo', 'egipt|1': 'portrait-egipt-kamien' };

rmSync(OUT + 'input', { recursive: true, force: true });
rmSync(OUT + 'ref', { recursive: true, force: true });
mkdirSync(OUT + 'input', { recursive: true });
mkdirSync(OUT + 'ref', { recursive: true });
const fileOfSvg = (k) => k.replace(':', '-') + '.svg';
for (const [k, s] of Object.entries(SVGS)) writeFileSync(OUT + 'input/' + fileOfSvg(k), s);
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
async function runPage(pageName, dpr) {
  const ctx = await browser.newContext({ deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  page.on('console', (m) => console.log(`[${pageName}]`, m.text()));
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
    window.CITY_PENDING = [];
    const NativeImage = window.Image;
    window.Image = function Image(...a) {
      const img = new NativeImage(...a);
      window.CITY_PENDING.push(new Promise((res) => {
        img.addEventListener('load', () => res('load'));
        img.addEventListener('error', () => res('error'));
      }));
      return img;
    };
  }, { faces, mapFontSrc: mapFont.toString(), mapFamilySrc: mapFamily.toString() });
  await page.evaluate(({ svgs, portraits, pageName }) => { window.CITY_INPUT = { svgs, portraits, page: pageName }; }, { svgs: SVGS, portraits: portraitUris, pageName });
  await page.addScriptTag({ content: bundleJs });
  const r = await page.evaluate(async () => {
    const r = await window.CITY_RUN();
    r.ua = navigator.userAgent;
    return r;
  });
  await ctx.close();
  return r;
}
const main = await runPage('main', 1);
const dpr2 = await runPage('dpr2', 2);
const dpr15 = await runPage('dpr15', 1.5);
await browser.close();

// ---------------------------------------------------------------- the same bundle in node (numbers)
const nodeResult = await (async () => {
  const g = globalThis;
  const ctx2d = new Proxy({}, {
    get: (_t, k) => {
      if (k === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) });
      if (k === 'measureText') return () => ({ width: 0 });
      if (k === 'createLinearGradient') return () => ({ addColorStop() {} });
      return () => {};
    },
    set: () => true,
  });
  g.window = g;
  g.devicePixelRatio = 1;
  g.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
  g.CITY_PENDING = [];
  g.Image = class { set src(_v) { setTimeout(() => this.onerror?.(), 0); } };
  g.CITY_INPUT = { svgs: SVGS, portraits: portraitUris, page: 'node' };
  // eslint-disable-next-line no-new-func
  new Function(bundleJs)();
  return g.CITY_RUN();
})();

// Chromium vs node: the numbers of the okolica / worker trees, helpers and inputs
const strip = (o) => JSON.parse(JSON.stringify(o, (k, v) => (k === 'tex' || k === 'snapshots' ? undefined : v)));
const diffs = [];
function deepDiff(a, b, path) {
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b) || (a === null) !== (b === null)) { diffs.push([path, a, b]); return; }
  if (a && typeof a === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) deepDiff(a[k], b[k], `${path}.${k}`);
  } else if (a !== b) diffs.push([path, a, b]);
}
for (const k of ['helpers', 'consts', 'okolica', 'worker', 'inputs']) deepDiff(strip(nodeResult[k]), strip(main[k]), k);
// workerTex: only the metadata (pixels are Chromium-only)
deepDiff(nodeResult.workerTex.map((t) => t.meta), main.workerTex.map((t) => t.meta), 'workerTex');
console.log(`chromium-vs-node differences: ${diffs.length}`);
for (const d of diffs.slice(0, 20)) console.log('  ', JSON.stringify(d).slice(0, 300));

// ---------------------------------------------------------------- outputs
const json = {
  chips: [...main.chips, ...dpr2.chips, ...dpr15.chips],
  drawCanvas: main.drawCanvas, drawCanvasLegacy: main.drawCanvasLegacy, purge: main.purge,
  // numbers: node (P4.11 convention); textures of the trees: Chromium
  helpers: nodeResult.helpers, consts: nodeResult.consts, inputs: nodeResult.inputs,
  okolica: nodeResult.okolica.map((c, i) => ({ ...c, children: c.children.map((ch, j) => (ch.labels
    ? { ...ch, labels: ch.labels.map((l, k) => ({ ...l, tex: main.okolica[i].children[j].labels[k].tex })) }
    : ch)) })),
  worker: nodeResult.worker,
  workerTex: nodeResult.workerTex.map((t, i) => ({ ...t, tex: main.workerTex[i].tex })),
  chromiumDiffs: diffs,
};
const files = new Map();
for (const [pageName, r] of [['main', main], ['dpr2', dpr2], ['dpr15', dpr15]]) {
  for (const [id, data] of Object.entries(r.snapshots)) files.set(`${pageName}-${id}`, data);
}
// ids are per page: prefix them
const pre = (p, id) => (id == null ? null : `${p}-${id}`);
for (const c of json.chips) { c.initial = pre(c.page, c.initial); c.final = pre(c.page, c.final); }
json.drawCanvas = pre('main', json.drawCanvas);
json.drawCanvasLegacy = pre('main', json.drawCanvasLegacy);
for (const c of json.okolica) for (const ch of c.children) if (ch.labels) for (const l of ch.labels) l.tex = pre('main', l.tex);
for (const t of json.workerTex) t.tex = pre('main', t.tex);
for (const [id, data] of files) writeFileSync(OUT + `ref/${id}.rgba`, Buffer.from(data, 'base64'));
writeFileSync(OUT + 'city.json', JSON.stringify(json, null, 0) + '\n');
writeFileSync(OUT + 'versions.txt', `node ${process.version}\nplaywright ${require('playwright/package.json').version}\nchromium ${version}\nthree ${JSON.parse(readFileSync(HERE + 'node_modules/three/package.json', 'utf8')).version}\nesbuild ${JSON.parse(readFileSync(HERE + 'node_modules/esbuild/package.json', 'utf8')).version}\nfont-render-hinting none\nuserAgent ${main.ua}\n`);
for (const f of ['gen.ts', 'gen.mjs']) writeFileSync(OUT + f, readFileSync(HERE + f));
const list = ['gen.ts', 'gen.mjs', 'city.json', 'versions.txt',
  ...readdirSync(OUT + 'input').sort().map((f) => 'input/' + f),
  ...readdirSync(OUT + 'ref').sort().map((f) => 'ref/' + f)];
let man = '';
for (const f of list) man += createHash('sha256').update(readFileSync(OUT + f)).digest('hex') + '  ' + f + '\n';
for (const [, , file] of FACE_FILES) man += createHash('sha256').update(readFileSync(ASSETS + file)).digest('hex') + '  ../../../assets/' + file + '\n';
writeFileSync(OUT + 'MANIFEST.sha256', man);
console.log(`chips=${json.chips.length} okolica=${json.okolica.length} worker=${json.worker.length} workerTex=${json.workerTex.length} refs=${files.size} chromium=${version}`);
if (!existsSync(OUT + 'city.json')) process.exit(2);
