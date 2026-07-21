'use strict';
/**
 * production-overflow-test.cjs — nadmiar Pracy przy pustej kolejce budynków
 * Uruchom z gra/:  node tools/production-overflow-test.cjs
 *
 * Scenariusz Macieja: 13 Pracy, brak budynku w kolejce, suwak ~70/30
 * → doPuli (4) + overflow doBudynkow (9) = 13 na pulę ulepszeń cywilizacji.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); } catch (e) { console.error('esbuild not found'); process.exit(1); }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.production-overflow-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.production-overflow-bundle.cjs');

const ENTRY_TS = `
export { advanceProduction, splitPraca } from '../src/game/production';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[production-overflow-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  [OK] ' + label); passed++; }
  else { console.error('  [FAIL] ' + label); failed++; }
}
function eq(a, b, label) { ok(a === b, label + ' (' + a + ' === ' + b + ')'); }

const emptyProd = { kolejka: [], postep: 0 };

console.log('\n1. Pusta kolejka: doBudynkow trafia do overflowToPool');
{
  const r = M.advanceProduction(emptyProd, 9);
  eq(r.completed, null, 'nic nie ukończone');
  eq(r.overflowToPool, 9, 'overflowToPool = 9');
  eq(r.prod.postep, 0, 'postep = 0');
}

console.log('\n2. Scenariusz Macieja: 13 Pracy, 70% budynki, brak budynku');
{
  const { doBudynkow, doPuli } = M.splitPraca(13, 0.7);
  eq(doBudynkow, 9, 'doBudynkow = 9');
  eq(doPuli, 4, 'doPuli = 4 (suwak ulepszenia)');

  const r = M.advanceProduction(emptyProd, doBudynkow);
  eq(r.overflowToPool, 9, 'niewykorzystane doBudynkow → overflow 9');

  const totalToPool = doPuli + (r.overflowToPool ?? 0);
  eq(totalToPool, 13, 'łącznie na pulę cywilizacji = 13 (cała Praca miasta)');
  ok(totalToPool > 4, 'więcej niż sam suwak (4) — fix buga Macieja');
}

console.log('\n3. Kolejka z budynkiem: brak overflow gdy postęp < koszt');
{
  const prod = { kolejka: [{ kind: 'budynek', id: 'koszary', koszt: 50 }], postep: 0 };
  const r = M.advanceProduction(prod, 9);
  eq(r.overflowToPool, undefined, 'brak overflow przy normalnym budowaniu');
  eq(r.prod.postep, 9, 'postep = 9');
}

console.log('\n4. Ukończenie budynku: reszta nadal overflow (regresja B10)');
{
  const prod = { kolejka: [{ kind: 'budynek', id: 'koszary', koszt: 5 }], postep: 0 };
  const r = M.advanceProduction(prod, 9);
  eq(r.completed?.id, 'koszary', 'budynek ukończony');
  eq(r.overflowToPool, 4, 'reszta 4 → overflow');
}

console.log('\n--- production-overflow-test: ' + passed + ' OK, ' + failed + ' FAIL ---');
process.exit(failed > 0 ? 1 : 0);
