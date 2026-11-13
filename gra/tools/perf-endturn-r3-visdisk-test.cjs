'use strict';
/**
 * perf-endturn-r3-visdisk-test.cjs — R-WEB-PERF-ENDTURN-AI-PHASE-Q1 (R3, zarzut Evaluatora nr 2).
 * (1) Równoważność na PRAWDZIWYM computeVisibleAt (esbuild z src/game/visibility.ts):
 *     memo dysku widoczności (kopia 1:1 bloku visibleDiskKeys z main.ts ~linia 12050) == computeVisibleAt
 *     (ta sama kolejność kluczy), na 400 losowych wywołaniach z powtórzeniami (trafienia memo).
 * (2) Mutacje: klucz bez promienia (sight) i klucz kolidujący -> test MUSI paść.
 * (3) Pomiar pamięci: 3000 wpisów memo (najgorszy przypadek limitu) dla promieni 3, 6, 10, 20 — przyrost heap.
 * Ograniczenie uczciwe: domknięcie w boot() main.ts NIE jest wykonywane headless; (1) sprawdza
 * algorytm memo na kopii bloku, nie sam plik main.ts.
 * Uruchom z gra/:  node --expose-gc tools/perf-endturn-r3-visdisk-test.cjs
 */
const fs = require('fs'); const os = require('os'); const path = require('path');
const root = path.resolve(__dirname, '..');
const esbuild = require(path.join(root, 'node_modules', 'esbuild'));
const SRC = path.join(root, 'src');

async function load() {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'r3-vd-')), 'b.cjs');
  await esbuild.build({
    stdin: { contents: `export { computeVisibleAt } from './game/visibility';`, resolveDir: SRC, loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', outfile: out, write: true, logLevel: 'silent',
  });
  const m = require(out);
  fs.rmSync(path.dirname(out), { recursive: true, force: true });
  return m.computeVisibleAt;
}

// Kopia 1:1 bloku z main.ts (visibleDiskKeys + visibleDiskMemo). `mutate` = 'nosight' | 'collide' do testu mutacyjnego.
function makeMemo(computeVisibleAt, map, mutate) {
  const visibleDiskMemo = new WeakMap();
  function visibleDiskKeys(q, r, sight) {
    if (!(Number.isInteger(q) && Number.isInteger(r) && Number.isInteger(sight) && sight >= 0 && sight < 24 && q > -8000 && q < 8000 && r > -8000 && r < 8000)) {
      return computeVisibleAt(q, r, map, sight);
    }
    const memoKey = map.hexes ?? map;
    let m = visibleDiskMemo.get(memoKey);
    if (!m) { m = new Map(); visibleDiskMemo.set(memoKey, m); }
    let key = ((q + 8192) * 16384 + (r + 8192)) * 64 + sight;
    if (mutate === 'nosight') key = ((q + 8192) * 16384 + (r + 8192));
    if (mutate === 'collide') key = ((q + 8192) * 16384 + (r + 8192)) * 64 + (sight & 1);
    let v = m.get(key);
    if (v === undefined) {
      v = [...computeVisibleAt(q, r, map, sight)];
      if (m.size >= 3000) m.clear();
      m.set(key, v);
    }
    return v;
  }
  return visibleDiskKeys;
}

function makeMap(radius) {
  const hexes = {};
  for (let q = -radius; q <= radius; q++) for (let r = -radius; r <= radius; r++) {
    if (Math.abs(q + r) <= radius) hexes[`${q},${r}`] = { coords: { q, r } };
  }
  return { szerokoscQ: 2 * radius + 1, wysokoscR: 2 * radius + 1, hexes };
}

(async () => {
  const computeVisibleAt = await load();
  const map = makeMap(24);
  let seed = 777;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const states = [];
  for (let i = 0; i < 400; i++) {
    states.push([Math.floor(rnd() * 30) - 15, Math.floor(rnd() * 30) - 15, Math.floor(rnd() * 6)]); // małe zbiory => powtórki
  }
  const runEq = (mutate) => {
    const memo = makeMemo(computeVisibleAt, map, mutate);
    let diffs = 0;
    for (const [q, r, s] of states) {
      const got = [...memo(q, r, s)];
      const want = [...computeVisibleAt(q, r, map, s)];
      if (got.length !== want.length || got.some((k, i) => k !== want[i])) diffs++;
    }
    return diffs;
  };
  const base = runEq(null);
  const mNoSight = runEq('nosight');
  const mCollide = runEq('collide');
  console.log(`EQ states=${states.length} diffs=${base} (oczekiwane 0)`);
  console.log(`MUT nosight diffs=${mNoSight} (musi > 0)`);
  console.log(`MUT collide diffs=${mCollide} (musi > 0)`);
  const ok = base === 0 && mNoSight > 0 && mCollide > 0;

  // Pomiar pamięci: najgorszy przypadek limitu 3000 wpisów.
  const gc = global.gc;
  for (const sight of [3, 6, 10, 20]) {
    const mapBig = makeMap(Math.max(40, sight * 2 + 4));
    const memo = makeMemo(computeVisibleAt, mapBig, null);
    if (gc) gc(); const h0 = process.memoryUsage().heapUsed;
    let keysTotal = 0;
    for (let i = 0; i < 3000; i++) {
      const v = memo(i % 25 - 12, Math.floor(i / 25) - 60, sight);
      keysTotal += v.length;
    }
    if (gc) gc(); const h1 = process.memoryUsage().heapUsed;
    console.log(`MEM sight=${sight} wpisow=3000 kluczy=${keysTotal} sredniaNaWpis=${(keysTotal / 3000).toFixed(1)} przyrostHeapMB=${((h1 - h0) / 1048576).toFixed(2)} gc=${!!gc}`);
  }
  console.log(ok ? 'RESULT PASS' : 'RESULT FAIL');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
