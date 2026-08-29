'use strict';
/**
 * ai-recruit-upkeep-gate-test.cjs
 *
 * PLIK PRZEPISANY 2026-08-26 przez R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1.
 *
 * Historycznie pinował decyzję R-AI-RECRUIT-UPKEEP-GATE (2026-08-06): „pula państwa musi
 * pokryć 1× utrzymanie surowcowe/turę OPRÓCZ kosztu rekrutacji". Ta decyzja została
 * WYCOFANA przez właściciela (docs/decyzje/R-AI-RECRUIT-UPKEEP-GATE.md, sekcja WYCOFANIE).
 * Test pilnuje dziś ODWROTNEGO kontraktu na ścieżce AI/MP: bramka rekrutacji AI i MP
 * liczy WYŁĄCZNIE `unitStockCost`, a rezerwa utrzymania nie ma prawa wrócić jako blokada.
 *
 * Uwaga dla czytającego raporty: poprzednia wersja tego pliku była CZERWONA (18 passed,
 * 9 failed) z powodu driftu oczekiwań ×1 wobec danych FALI 300 ×5 — patrz
 * dyspozycje/autobot/runs/R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1/pre-existing-test-drift.md.
 * Zielony wynik tego pliku po przepisaniu NIE jest naprawą tamtego driftu: asercje ×1
 * zniknęły razem z wycofaną decyzją, którą pinowały. Drift ×1/×5 żyje dalej w
 * unit-stock-cost-test.cjs i unit-resource-upkeep-test.cjs i wymaga osobnego tematu.
 *
 * Run from gra/:  node tools/ai-recruit-upkeep-gate-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[ai-recruit-upkeep-gate-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA         = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.ai-recruit-upkeep-gate-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-recruit-upkeep-gate-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export * as EU from '../src/game/economy-upkeep';
export {
  unitStockCost,
  canAffordBuildingStock,
  ownerResourceStockAll,
} from '../src/game/building-stock-cost';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE, absWorkingDir: GRA, logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-recruit-upkeep-gate-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M     = require(BUNDLE_FILE);
const EU    = M.EU;
const units = require('../data/units.json');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
function deepEq(a, b, msg) {
  const norm = o => JSON.stringify(Object.fromEntries(Object.entries(o || {}).sort()));
  assert(norm(a) === norm(b), `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}
function findUnit(name) {
  const u = units.find(x => x.Jednostka === name);
  if (!u) throw new Error(`units.json: brak jednostki "${name}"`);
  return u;
}
function makeCities(spec) {
  return spec.map(s => ({ id: s.id, ownerId: s.ownerId, surowce: { ...(s.surowce ?? {}) } }));
}

const wlocznik = findUnit('Włócznik');
const STOCK  = M.unitStockCost(wlocznik);          // kanonicznie FALA 300: { braz: 50 }
const UPKEEP = EU.unitResourceUpkeep(wlocznik);    // kanonicznie FALA 300: { braz: 10 }
const stockBraz  = STOCK.braz;
const upkeepBraz = UPKEEP.braz;

console.log('\n-- dane kanoniczne z units.json (bez zaszytych progów ×1) --');
assert(stockBraz > 0,  'Włócznik ma dodatni koszt zakupu w Brązie');
assert(upkeepBraz > 0, 'Włócznik ma dodatnie utrzymanie w Brązie');

console.log('\n-- WYCOFANA rezerwa utrzymania: NIE jest już bramką rekrutacji --');
deepEq(EU.unitRecruitUpkeepReserve(wlocznik), UPKEEP, 'unitRecruitUpkeepReserve = 1× utrzymanie (heurystyka AI)');
eq(EU.UNIT_RECRUIT_UPKEEP_RESERVE_TURNS, 1, 'UNIT_RECRUIT_UPKEEP_RESERVE_TURNS === 1 (horyzont heurystyki)');
assert(EU.canAffordUnitRecruitUpkeepReserve === undefined, 'bramka rezerwy USUNIĘTA z modułu');
assert(EU.unitRecruitFullStockCost === undefined, 'koszt "zakup + rezerwa" USUNIĘTY z modułu');
assert(EU.UNIT_RECRUIT_FULL_HINT === undefined, 'komunikat "rekrutacja + utrzymanie 1 tura" USUNIĘTY');
eq(EU.UNIT_RECRUIT_STOCK_ONLY_HINT, 'Za mało surowca w magazynie państwa', 'jedyny hint odmowy = brak kosztu zakupu');

console.log('\n-- próg bramki = DOKŁADNIE koszt zakupu (nie zakup + utrzymanie) --');
assert(EU.canAffordUnitRecruitStock({ braz: stockBraz }, wlocznik), `pula = ${stockBraz} (sam koszt zakupu) -> PRZECHODZI`);
assert(!EU.canAffordUnitRecruitStock({ braz: stockBraz - 1 }, wlocznik), `pula = ${stockBraz - 1} (o 1 za mało) -> BLOKADA`);
assert(
  EU.canAffordUnitRecruitStock({ braz: stockBraz + upkeepBraz - 1 }, wlocznik),
  `pula = ${stockBraz + upkeepBraz - 1} (zakup OK, zapasu na utrzymanie brakuje) -> PRZECHODZI (dawniej blokada)`,
);

console.log('\n-- parytet ownerId: gracz (0) / AI (7) / MP (31) — ta sama bramka --');
{
  const verdicts = [];
  for (const oid of [0, 7, 31]) {
    const cities = makeCities([
      { id: `x${oid}`, ownerId: oid, surowce: { braz: stockBraz } },
      { id: 'obcy',    ownerId: 99,  surowce: { braz: 100000 } },
    ]);
    const pool = M.ownerResourceStockAll(cities, oid);
    eq(pool.braz, stockBraz, `owner ${oid}: pula państwa liczona tylko z własnych miast`);
    assert(M.canAffordBuildingStock(pool, STOCK), `owner ${oid}: koszt zakupu pokryty`);
    verdicts.push(`${EU.canAffordUnitRecruitStock(pool, wlocznik)}|${EU.pickUnitRecruitHint(pool, wlocznik)}`);
  }
  eq(new Set(verdicts).size, 1, 'gracz = AI = MP: identyczny werdykt bramki i hint');
}

console.log('\n-- chip UI: czerwony wyłącznie przy braku kosztu zakupu --');
assert(!EU.isUnitRecruitStockChipMissing({ braz: stockBraz }, wlocznik, 'braz'), 'pula = koszt zakupu -> chip NIE czerwony');
assert(EU.isUnitRecruitStockChipMissing({ braz: stockBraz - 1 }, wlocznik, 'braz'), 'pula < koszt zakupu -> chip czerwony');
assert(
  EU.isUnitRecruitStockChipMissing({ braz: stockBraz - 1 }, wlocznik, 'braz')
  === !EU.canAffordUnitRecruitStock({ braz: stockBraz - 1 }, wlocznik),
  'chip missing === negacja bramki (spójność UI z mechaniką)',
);

console.log('\n-- jednostka bez utrzymania surowcowego: zero regresji --');
deepEq(
  EU.unitResourceUpkeep({ 'Utrzymanie surowiec': '-', 'Utrzymanie surowiec (ilość)': 2 }),
  {},
  'Utrzymanie surowiec=- -> {}',
);
assert(
  EU.canAffordUnitRecruitStock({}, { Surowiec: '-', 'Surowiec (ilość)': 0, 'Utrzymanie surowiec': '-' }),
  'jednostka bez kosztu surowcowego -> bramka przepuszcza przy pustej puli',
);

console.log(`\nai-recruit-upkeep-gate-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* ignore */ }
process.exit(failed > 0 ? 1 : 0);
