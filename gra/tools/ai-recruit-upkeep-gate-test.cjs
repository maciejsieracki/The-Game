'use strict';
/**
 * ai-recruit-upkeep-gate-test.cjs — R-AI-RECRUIT-UPKEEP-GATE
 * Bramka rekrutacji: pula państwa musi pokryć wyłącznie jednorazowy koszt
 * rekrutacji (unitStockCost); upkeep rozlicza się w następnej turze.
 *
 * Run from gra/:  node tools/ai-recruit-upkeep-gate-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-recruit-upkeep-gate-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.ai-recruit-upkeep-gate-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-recruit-upkeep-gate-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  unitResourceUpkeep,
  unitRecruitUpkeepReserve,
  canAffordUnitRecruitUpkeepReserve,
  unitRecruitFullStockCost,
  canAffordUnitRecruitFull,
  isUnitRecruitStockChipMissing,
  pickUnitRecruitHint,
  UNIT_RECRUIT_UPKEEP_RESERVE_TURNS,
  UNIT_RECRUIT_FULL_HINT,
  UNIT_RECRUIT_STOCK_ONLY_HINT,
} from '../src/game/economy-upkeep';
export {
  unitStockCost,
  canAffordBuildingStock,
  ownerResourceStockAll,
} from '../src/game/building-stock-cost';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-recruit-upkeep-gate-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const units = require('../data/units.json');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function deepEq(a, b, msg) {
  const sa = JSON.stringify(a, Object.keys(a || {}).sort());
  const sb = JSON.stringify(b, Object.keys(b || {}).sort());
  assert(sa === sb, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

function findUnit(name) {
  const u = units.find(x => x.Jednostka === name);
  if (!u) throw new Error(`units.json: brak jednostki "${name}"`);
  return u;
}

function makeCities(spec) {
  return spec.map(s => ({ id: s.id, ownerId: s.ownerId, surowce: { ...(s.surowce ?? {}) } }));
}

console.log('\n-- unitRecruitUpkeepReserve: próg 1× utrzymanie/turę (FALA 300 ×5) --');
const wlocznik = findUnit('Włócznik');
deepEq(M.unitRecruitUpkeepReserve(wlocznik), { braz: 10 }, 'Włócznik reserve -> {braz:10}');
assert(M.UNIT_RECRUIT_UPKEEP_RESERVE_TURNS === 1, 'UNIT_RECRUIT_UPKEEP_RESERVE_TURNS === 1');
assert(
  M.UNIT_RECRUIT_FULL_HINT === 'Za mało surowca w magazynie państwa',
  'UNIT_RECRUIT_FULL_HINT — brak blokady przez upkeep',
);
assert(
  M.UNIT_RECRUIT_STOCK_ONLY_HINT === 'Za mało surowca w magazynie państwa',
  'UNIT_RECRUIT_STOCK_ONLY_HINT — tylko koszt rekrutacji',
);

console.log('\n-- canAffordUnitRecruitUpkeepReserve: blokada gdy brak rezerwy --');
const poolLow = { braz: 9 };
const poolOk = { braz: 10 };
assert(
  !M.canAffordUnitRecruitUpkeepReserve(poolLow, wlocznik),
  '9 braz < 10/t upkeep -> odmowa rekrutacji',
);
assert(
  M.canAffordUnitRecruitUpkeepReserve(poolOk, wlocznik),
  '10 braz >= 10/t upkeep -> OK (upkeep-only gate)',
);

console.log('\n-- canAffordUnitRecruitFull: tylko koszt rekrutacji (Włócznik 50) --');
deepEq(M.unitRecruitFullStockCost(wlocznik), { braz: 60 }, 'legacy full cost pozostaje diagnostyczny');
assert(
  M.canAffordUnitRecruitFull({ braz: 50 }, wlocznik),
  'pool braz=50 pokrywa koszt rekrutacji -> OK mimo braku rezerwy',
);
assert(
  M.canAffordUnitRecruitFull({ braz: 51 }, wlocznik),
  'pool braz=51 pokrywa koszt rekrutacji',
);
assert(
  M.canAffordUnitRecruitFull({ braz: 60 }, wlocznik),
  'pool braz=60 >= 60 -> OK',
);

console.log('\n-- pickUnitRecruitHint: STOCK_ONLY / FULL / null (Włócznik) --');
assert(
  M.pickUnitRecruitHint({ braz: 49 }, wlocznik) === M.UNIT_RECRUIT_STOCK_ONLY_HINT,
  'pool braz=49 < 50 stock -> STOCK_ONLY',
);
assert(M.pickUnitRecruitHint({ braz: 50 }, wlocznik) === null,
  'pool braz=50 stock OK, upkeep nie tworzy hintu');
assert(
  M.pickUnitRecruitHint({ braz: 60 }, wlocznik) === null,
  'pool braz=60 full OK -> null',
);

console.log('\n-- parytet ownerId: gracz (0) vs AI (7) — ta sama bramka --');
const citiesPlayer = makeCities([
  { id: 'c1', ownerId: 0, surowce: { braz: 50 } },
  { id: 'c2', ownerId: 0, surowce: { braz: 0 } },
]);
const citiesAi = makeCities([
  { id: 'a1', ownerId: 7, surowce: { braz: 50 } },
  { id: 'a2', ownerId: 7, surowce: { braz: 0 } },
]);
const poolPlayer = M.ownerResourceStockAll(citiesPlayer, 0);
const poolAi = M.ownerResourceStockAll(citiesAi, 7);
const stockCost = M.unitStockCost(wlocznik);
assert(
  M.canAffordBuildingStock(poolPlayer, stockCost),
  'gracz: stock rekrutacji (50 braz) OK',
);
assert(
  M.canAffordBuildingStock(poolAi, stockCost),
  'AI: stock rekrutacji (50 braz) OK',
);
assert(
  M.canAffordUnitRecruitUpkeepReserve(poolPlayer, wlocznik),
  'gracz: 50 braz pokrywa reserve 10/t (upkeep-only)',
);
assert(
  M.canAffordUnitRecruitUpkeepReserve(poolAi, wlocznik),
  'AI ownerId=7: identyczna pula 50 braz -> OK reserve (upkeep-only)',
);
assert(
  M.canAffordUnitRecruitFull(poolPlayer, wlocznik),
  'gracz: 50 braz pokrywa zakup mimo upkeep 10',
);
assert(
  M.canAffordUnitRecruitFull(poolAi, wlocznik),
  'AI: 50 braz pokrywa zakup mimo upkeep 10',
);

const citiesBare = makeCities([
  { id: 'c1', ownerId: 0, surowce: { braz: 50 } },
  { id: 'a1', ownerId: 7, surowce: { braz: 50 } },
]);
const barePlayer = M.ownerResourceStockAll(citiesBare.filter(c => c.ownerId === 0), 0);
const bareAi = M.ownerResourceStockAll(citiesBare.filter(c => c.ownerId === 7), 7);
assert(
  M.canAffordUnitRecruitUpkeepReserve(barePlayer, wlocznik)
  === M.canAffordUnitRecruitUpkeepReserve(bareAi, wlocznik),
  'parytet gracz=AI przy tej samej puli (upkeep-only, 50 braz)',
);
assert(
  M.canAffordUnitRecruitFull(barePlayer, wlocznik)
  === M.canAffordUnitRecruitFull(bareAi, wlocznik),
  'parytet gracz=AI przy tej samej puli (full gate, 50 braz -> true)',
);

console.log('\n-- isUnitRecruitStockChipMissing: chip vs full cost (Eval F253) --');
assert(
  !M.isUnitRecruitStockChipMissing({ braz: 50 }, wlocznik, 'braz'),
  'pool braz=50: chip OK (tylko stock 50)',
);
assert(
  !M.isUnitRecruitStockChipMissing({ braz: 51 }, wlocznik, 'braz'),
  'pool braz=51: chip OK',
);
assert(
  !M.isUnitRecruitStockChipMissing({ braz: 60 }, wlocznik, 'braz'),
  'pool braz=60: chip OK',
);
assert(
  M.isUnitRecruitStockChipMissing({ braz: 9 }, wlocznik, 'braz')
  === !M.canAffordUnitRecruitFull({ braz: 9 }, wlocznik),
  'chip missing === negacja canAffordUnitRecruitFull (pula 9)',
);

console.log('\n-- jednostka bez utrzymania surowcowego: bramka przepuszcza --');
deepEq(
  M.unitResourceUpkeep({ 'Utrzymanie surowiec': '-', 'Utrzymanie surowiec (ilość)': 2 }),
  {},
  'Utrzymanie surowiec=- -> {}',
);
assert(
  M.canAffordUnitRecruitUpkeepReserve({}, { 'Utrzymanie surowiec': '-', 'Utrzymanie surowiec (ilość)': 2 }),
  'brak upkeep -> zawsze OK (zero regresji)',
);

console.log(`\nai-recruit-upkeep-gate-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
