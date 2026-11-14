'use strict';
/**
 * mapgen-rivers-fill-centroid-cache-test.cjs — R-WEB-MAPGEN-RIVERS-FILL-CENTROID-PERF-Q1.
 *
 * Test regresji pamięci podręcznej estimateLandCentroidFromSeed (gen-helpers.ts):
 *   1) suma kontrolna generacji ziarna 22 / Mały = wartość bazowa (cache nie zmienia wyniku),
 *   2) licznik BFS (estimateLandCentroidFromSeedUncached) spada ≥3× względem bazy (4745).
 * Buduje wrapper esbuild z instrumentacją (diag-build) do katalogu tymczasowego i uruchamia go w Node.
 * Użycie (z gra/): node tools/mapgen-rivers-fill-centroid-cache-test.cjs
 * Czas: ~1 min na hoście referencyjnym. Wynik: exit 0 = PASS, 1 = FAIL.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const ESBUILD = path.join(GRA, 'node_modules', 'esbuild', 'lib', 'main.js');
const BASE_CHECKSUM = '9f0c2884';
const BASE_BFS = 4745; // zmierzone na fab9a9b75 (bez pamięci podręcznej), ziarno 22 / maly
const MIN_RATIO = 3;

const outDir = fs.mkdtempSync(path.join(process.env.MAPGEN_CACHE_TEST_DIR || os.tmpdir(), 'centroid-cache-'));
const wrap = path.join(outDir, 'wrap-instr.cjs');
const build = spawnSync(process.execPath, [
  path.join(__dirname, 'mapgen-rivers-seed22-diag-build.cjs'), ESBUILD, wrap, '--instr',
], { cwd: GRA, encoding: 'utf8' });
if (build.status !== 0 || !fs.existsSync(wrap)) {
  console.error('FAIL build wrappera', build.stderr);
  process.exit(1);
}

const run = spawnSync(process.execPath, [wrap, '22', 'maly', 'Maly', '15', '2'], {
  cwd: GRA, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 580000,
});
const out = (run.stdout || '') + (run.stderr || '');
const checksum = (out.match(/CHECKSUM ([0-9a-f]+)/) || [])[1];
const countersLine = (out.match(/^COUNTERS (.+)$/m) || [])[1];
let counters = null;
try { counters = countersLine ? JSON.parse(countersLine) : null; } catch (_) { counters = null; }

const bfs = counters ? counters.estimateLandCentroidFromSeedUncached : undefined;
const failures = [];
if (run.status !== 0) failures.push(`generacja zakończona kodem ${run.status}`);
if (!checksum) failures.push('brak linii CHECKSUM');
else if (checksum !== BASE_CHECKSUM) failures.push(`suma kontrolna ${checksum} != bazowa ${BASE_CHECKSUM}`);
if (typeof bfs !== 'number') failures.push('brak licznika estimateLandCentroidFromSeedUncached');
else if (bfs * MIN_RATIO > BASE_BFS) failures.push(`BFS ${bfs} — spadek ${(BASE_BFS / bfs).toFixed(2)}× < ${MIN_RATIO}×`);

console.log(`checksum=${checksum} bfs=${bfs} bazowe_bfs=${BASE_BFS} spadek=${typeof bfs === 'number' ? (BASE_BFS / bfs).toFixed(2) : 'n/a'}x`);
if (failures.length) {
  console.log('FAIL');
  for (const f of failures) console.log(' - ' + f);
  process.exit(1);
}
console.log('PASS');
