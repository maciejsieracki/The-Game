'use strict';
/**
 * mapgen-rivers-fill-centroid-cache-test.cjs — R-WEB-MAPGEN-RIVERS-FILL-CENTROID-PERF-Q1.
 *
 * Test regresji pamięci podręcznej estimateLandCentroidFromSeed (gen-helpers.ts):
 *   1) suma kontrolna generacji ziarna 22 / Mały = wartość bazowa (cache nie zmienia wyniku),
 *   2) licznik BFS (estimateLandCentroidFromSeedUncached) spada ≥3× względem bazy (4745),
 *   3) dwa przebiegi tego samego ziarna dają tę samą sumę kontrolną (determinizm).
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

// Dwa przebiegi tego samego ziarna (determinizm): oba muszą dać bazową sumę kontrolną i licznik BFS.
const runs = [0, 1].map(() => spawnSync(process.execPath, [wrap, '22', 'maly', 'Maly', '15', '2'], {
  cwd: GRA, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 280000,
}));
const parsed = runs.map((run) => {
  const out = (run.stdout || '') + (run.stderr || '');
  const checksum = (out.match(/CHECKSUM ([0-9a-f]+)/) || [])[1];
  const countersLine = (out.match(/^COUNTERS (.+)$/m) || [])[1];
  let counters = null;
  try { counters = countersLine ? JSON.parse(countersLine) : null; } catch (_) { counters = null; }
  return { status: run.status, checksum, bfs: counters ? counters.estimateLandCentroidFromSeedUncached : undefined };
});
const [a, b] = parsed;
const failures = [];
parsed.forEach((p, i) => {
  if (p.status !== 0) failures.push(`przebieg ${i + 1}: generacja zakończona kodem ${p.status}`);
  if (!p.checksum) failures.push(`przebieg ${i + 1}: brak linii CHECKSUM`);
  else if (p.checksum !== BASE_CHECKSUM) failures.push(`przebieg ${i + 1}: suma kontrolna ${p.checksum} != bazowa ${BASE_CHECKSUM}`);
  if (typeof p.bfs !== 'number') failures.push(`przebieg ${i + 1}: brak licznika estimateLandCentroidFromSeedUncached`);
  else if (p.bfs * MIN_RATIO > BASE_BFS) failures.push(`przebieg ${i + 1}: BFS ${p.bfs} — spadek ${(BASE_BFS / p.bfs).toFixed(2)}× < ${MIN_RATIO}×`);
});
if (a.checksum !== b.checksum) failures.push(`niedeterminizm: ${a.checksum} != ${b.checksum}`);

const bfs = a.bfs;
const checksum = a.checksum;
console.log(`checksum=${checksum} run2=${b.checksum} bfs=${a.bfs}/${b.bfs} bazowe_bfs=${BASE_BFS} spadek=${typeof bfs === 'number' ? (BASE_BFS / bfs).toFixed(2) : 'n/a'}x`);
if (failures.length) {
  console.log('FAIL');
  for (const f of failures) console.log(' - ' + f);
  process.exit(1);
}
console.log('PASS');
