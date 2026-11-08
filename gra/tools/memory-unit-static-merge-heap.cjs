'use strict';
/**
 * memory-unit-static-merge-heap.cjs -- R-WEB-MEMORY-UNIT-STATIC-MERGE-Q1: sterta V8 i czas `UnitRenderer.sync` dla 475
 * zetonow (jak t.100 w grze), PRAWDZIWY `UnitRenderer` (pule geometrii i materialow, pierscienie, tabliczki), w Node.
 * Tryby: `off` (`UnitRenderer.staticMerge = false`, stan sprzed tematu) i `on` (produkcja). Kazdy tryb mierzony w
 * OSOBNYM swiezym procesie z `--single-threaded-gc` (metoda z R-WEB-MEMORY-SHARED-MATERIALS-UNIT-MERGE-Q1 r2:
 * bez niej pomiar bywa bimodalny), z przebiegiem rozgrzewkowym, REPS powtorzen z naprzemienna kolejnoscia; mediany.
 *   H1 -- sterta `on` mniejsza od `off` o >= MIN_MB (domyslnie 15 MB; wylaczenie scalenia => FAIL);
 *   H2 -- meshe na zeton `on` < 40% `off`;
 *   H3 -- czas `sync` (budowa 475 zetonow) `on` <= 2,5x `off` (koszt scalenia przy tworzeniu zetonu).
 * Usage (z gra/): node tools/memory-unit-static-merge-heap.cjs [REPS=3] [MIN_MB=15]
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const GRA = path.resolve(__dirname, '..');
const CHILD = process.argv[2] === '--child' ? process.argv[3] : null;
const BUNDLE = CHILD ? process.argv[4] : null;
const REPS = CHILD ? 1 : Math.max(1, parseInt(process.argv[2] || '3', 10));
const MIN_MB = CHILD ? 0 : Number(process.argv[3] || '15');
const N = 475;

const ENTRY = `
export * as THREE from 'three';
export { UnitRenderer } from '../src/render/units';
`;

function mocks() {
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k === 'measureText' ? () => ({ width: 10 }) : (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') ? () => ({ addColorStop() {} }) : (k === 'getImageData' ? (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : () => {}))), set: (t, k, v) => { t[k] = v; return true; } });
  const mkCanvas = () => ({ width: 64, height: 64, style: {}, getContext: () => ctx, addEventListener() {}, toDataURL: () => '' });
  global.document = { createElement: (tag) => (tag === 'canvas' ? mkCanvas() : { style: {}, appendChild() {}, setAttribute() {} }), createElementNS: () => mkCanvas(), body: { appendChild() {} } };
  global.window = { devicePixelRatio: 1, addEventListener() {}, location: { search: '' } }; global.self = global.window;
  global.OffscreenCanvas = function (w, h) { return Object.assign(mkCanvas(), { width: w, height: h }); };
}

if (CHILD) {
  mocks();
  const M = require(BUNDLE); const { THREE, UnitRenderer } = M;
  const names = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8')).map((u) => u.Jednostka).filter(Boolean);
  require('v8').setFlagsFromString('--expose-gc'); const gc = require('vm').runInNewContext('gc');
  const heap = () => { gc(); gc(); return process.memoryUsage().heapUsed + process.memoryUsage().arrayBuffers; };
  const hexes = {};
  for (let q = 0; q < 40; q++) for (let r = 0; r < 20; r++) hexes[q + ',' + r] = { coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null, wioska: { jest: false, ludnosc: 0 }, widocznosc: {}, rzeka: { krawedzie: [] } };
  const list = []; for (let i = 0; i < N; i++) list.push({ id: 'u' + i, ownerId: i % 2, typeId: names[i % names.length], category: 'melee', q: i % 40, r: Math.floor(i / 40), ruch: 2, ruchLeft: 2, hp: 100 });
  const run = () => {
    UnitRenderer.staticMerge = CHILD === 'on';
    const scene = new THREE.Scene();
    const h0 = heap();
    const ur = new UnitRenderer(scene, { hexes });
    const t0 = process.hrtime.bigint();
    ur.sync(list, { visibleIds: new Set(list.map((u) => u.id)), badgeByRepId: new Map() });
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    const h1 = heap();
    let mesh = 0; for (const t of ur.tokens.values()) t.traverse((o) => { if (o.isMesh) mesh++; });
    return { mode: CHILD, heapMB: +((h1 - h0) / 1048576).toFixed(2), syncMs: +ms.toFixed(1), meshesPerToken: +(mesh / N).toFixed(1), keep: [ur, scene] };
  };
  const warm = run(); warm.keep = null;
  const r = run(); r.warmMB = warm.heapMB; r.warmSyncMs = warm.syncMs; r.keep = undefined;
  console.log('CHILD ' + JSON.stringify(r));
  process.exit(0);
}

(async () => {
  const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'usm-heap-'));
  let fail = 0;
  try {
    const entry = path.join(__dirname, `.usm-heap-entry-${process.pid}.ts`);
    fs.writeFileSync(entry, ENTRY);
    const bundle = path.join(tmp, 'b.cjs');
    try {
      await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, absWorkingDir: GRA, logLevel: 'error',
        loader: { '.json': 'json', '.png': 'dataurl', '.jpg': 'dataurl', '.mp3': 'dataurl', '.svg': 'dataurl' } });
    } finally { fs.rmSync(entry, { force: true }); }
    const { execFileSync } = require('child_process');
    const s = { off: [], on: [] }; const t = { off: [], on: [] }; const mpt = {};
    for (let rep = 0; rep < REPS; rep++) for (const mode of rep % 2 ? ['on', 'off'] : ['off', 'on']) {
      const out = execFileSync(process.execPath, ['--single-threaded-gc', __filename, '--child', mode, bundle], { encoding: 'utf8', maxBuffer: 1 << 24 });
      const line = out.split('\n').find((l) => l.startsWith('CHILD ')); if (!line) throw new Error('brak wyniku ' + mode + ': ' + out.slice(-500));
      const r = JSON.parse(line.slice(6)); s[mode].push(r.heapMB); t[mode].push(r.syncMs); mpt[mode] = r.meshesPerToken;
    }
    const med = (a) => { const b = [...a].sort((x, y) => x - y); const n = b.length; return +((n % 2) ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2).toFixed(2); };
    const res = { tokens: N, reps: REPS, heapMB: { off: med(s.off), on: med(s.on), samplesOff: s.off, samplesOn: s.on }, deltaMB: +(med(s.off) - med(s.on)).toFixed(2),
      syncMs: { off: med(t.off), on: med(t.on), samplesOff: t.off, samplesOn: t.on }, meshesPerToken: mpt };
    console.log('WYNIK ' + JSON.stringify(res));
    const ok = (label, cond, d) => { if (cond) console.log('  OK  ' + label + ' -- ' + JSON.stringify(d)); else { fail++; console.error(' FAIL ' + label + ' -- ' + JSON.stringify(d)); } };
    ok('H1 sterta on mniejsza od off o >= ' + MIN_MB + ' MB', res.deltaMB >= MIN_MB, { off: res.heapMB.off, on: res.heapMB.on, delta: res.deltaMB });
    ok('H2 meshe na zeton on < 40% off', mpt.on < 0.4 * mpt.off, mpt);
    ok('H3 czas sync on <= 2,5x off', res.syncMs.on <= 2.5 * res.syncMs.off, { off: res.syncMs.off, on: res.syncMs.on });
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  console.log(`\nmemory-unit-static-merge-heap: ${3 - fail} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
