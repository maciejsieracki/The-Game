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
export { advanceProduction, splitPraca, splitEmpirePracaBudget, allocateEmpirePracaToBuildings, cityPracaInteger, pracaImperialPoolGain, previewPracaPoolBrutto } from '../src/game/production';
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

console.log('\n5. Ateny: 10 Pracy, 70/30, pusta kolejka → całe +10 na pulę');
{
  const pracaInt = M.cityPracaInteger(9.6);
  eq(pracaInt, 10, 'cityPracaInteger(9.6) = 10 (Po Porządku)');
  const split = M.splitPraca(10, 0.7);
  eq(split.doBudynkow, 7, 'doBudynkow = 7');
  eq(split.doPuli, 3, 'doPuli = 3');
  const poolGain = M.pracaImperialPoolGain(split, true);
  eq(poolGain, 10, 'pula imperium = 10 (3+7, bez gubienia reszty)');
  eq(split.doBudynkow + split.doPuli, poolGain, 'split suma = poolGain');
}

console.log('\n6. Budynek w kolejce: tylko doPuli na pulę');
{
  const split = M.splitPraca(10, 0.7);
  eq(M.pracaImperialPoolGain(split, false), 3, 'tylko doPuli gdy budynek w kolejce');
  const r = M.advanceProduction(
    { kolejka: [{ kind: 'budynek', id: 'koszary', koszt: 50 }], postep: 0 },
    split.doBudynkow,
  );
  eq(r.overflowToPool, undefined, 'brak overflow — Praca idzie na postęp');
  eq(r.prod.postep, 7, 'postep = 7');
}

console.log('\n7. HUD preview: 100% budowa, pusta kolejka → brutto = cała Praca (nie tylko doPuli)');
{
  const split = M.splitPraca(13, 1.0);
  eq(split.doBudynkow, 13, 'doBudynkow = 13 (100% budowa)');
  eq(split.doPuli, 0, 'doPuli = 0');
  const hudBrutto = M.previewPracaPoolBrutto(
    [split],
    { queueEmpty: [true], paused: [false] },
  );
  eq(hudBrutto, 13, 'previewPracaPoolBrutto = 13 (regresja HUD 2026-07-26)');
  const hudWithBuild = M.previewPracaPoolBrutto(
    [split],
    { queueEmpty: [false], paused: [false] },
  );
  eq(hudWithBuild, 0, 'z budynkiem w kolejce → tylko doPuli (0)');
}

console.log('\n8. Nadrzędny split całej puli: ulepszenia ≤50%, budynki = remainder');
{
  const r = M.splitEmpirePracaBudget(1000, 100);
  eq(r.total, 1000, 'cała pula Pracy = 1000');
  eq(r.doUlepszen, 500, 'żądane 100% jest ograniczone do 50% całej puli');
  eq(r.doBudynkow, 500, 'minimum 50% pozostaje dla budynków');
  eq(r.doBudynkow + r.doUlepszen, r.total, 'budynki + ulepszenia = 100% puli');
}

console.log('\n9. Split z override per-miasto i edge case małej puli');
{
  const r = M.splitEmpirePracaBudget(3, 80);
  eq(r.doUlepszen, 1, 'mała pula: floor(50% z 3) = 1 na ulepszenia');
  eq(r.doBudynkow, 2, 'mała pula: remainder 2 dla budynków');
  eq(r.doBudynkow + r.doUlepszen, r.total, 'mała pula zachowuje sumę 100%');
}

console.log('\n10. Integracja: globalna pula → remainder budynków + cap ulepszeń');
{
  const split = M.splitEmpirePracaBudget(100, 80); // UI/legalnie zaciska do 50%.
  const allocation = M.allocateEmpirePracaToBuildings(split.doBudynkow, [
    { cityId: 'ai-city-2', prod: { kolejka: [{ kind: 'budynek', id: 'mur', koszt: 40 }], postep: 0 } },
    { cityId: 'ai-city-1', prod: { kolejka: [{ kind: 'budynek', id: 'spichlerz', koszt: 40 }], postep: 0 } },
  ]);
  eq(split.doUlepszen, 50, 'legalny cap: ulepszenia dostają maks. 50% puli');
  eq(split.doBudynkow, 50, 'remainder tej samej puli = 50 Pracy dla budynków');
  eq(allocation.used, 50, 'remainder jest faktycznie użyty przez kolejki budynków');
  eq(allocation.remainder, 0, 'po legalnych kolejkach nie zostaje niewydany remainder');
  eq(allocation.allocations[0].cityId, 'ai-city-1', 'multi-city: kolejność jest deterministyczna po cityId');
  eq(allocation.allocations[0].used, 40, 'pierwsze miasto dostaje koszt budynku');
  eq(allocation.allocations[1].used, 10, 'drugie miasto dostaje pozostały remainder');
  eq(allocation.used + split.doUlepszen, split.total, 'budynki + ulepszenia pokrywają całą pulę');
}

console.log('\n11. Integracja edge: mała pula, override i brak legalnej kolejki');
{
  const split = M.splitEmpirePracaBudget(3, 50);
  const allocation = M.allocateEmpirePracaToBuildings(split.doBudynkow, [
    { cityId: 'paused', prod: { kolejka: [{ kind: 'budynek', id: 'mur', koszt: 1 }], postep: 0, wstrzymana: true } },
    { cityId: 'empty', prod: { kolejka: [], postep: 0 } },
  ]);
  eq(split.doUlepszen, 1, 'mała pula: 1 Pracy na ulepszenia');
  eq(split.doBudynkow, 2, 'mała pula: 2 Pracy remainder dla budynków');
  eq(allocation.used, 0, 'brak legalnej kolejki nie zużywa remainder');
  eq(allocation.remainder, 2, 'niewykorzystany remainder wraca do puli');
}

console.log('\n12. Integracja wiring: main używa remainder dla gracza i AI');
{
  const mainSrc = fs.readFileSync(path.resolve(GRA_ROOT, 'src', 'main.ts'), 'utf8');
  ok(
    /applyEmpireBuildingBudget\(\s*0,[\s\S]{0,220}?playerPracaBudget\.doBudynkow\s*\)/.test(mainSrc),
    'gracz: playerPracaBudget.doBudynkow trafia do produkcji budynków',
  );
  ok(
    /applyEmpireBuildingBudget\(ownerId, aiBudget\.doBudynkow\)/.test(mainSrc),
    'AI: aiBudget.doBudynkow trafia do produkcji budynków',
  );
  ok(
    /improvementBudgetCap: playerPracaBudget\.doUlepszen/.test(mainSrc),
    'gracz: osobny strumień ulepszeń używa doUlepszen tej samej puli',
  );
}

console.log('\n--- production-overflow-test: ' + passed + ' OK, ' + failed + ' FAIL ---');
process.exit(failed > 0 ? 1 : 0);
