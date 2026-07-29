'use strict';
/**
 * battle-loot-test.cjs — łup po bitwie = koszt rekrutacji zniszczonych jednostek.
 * Run from gra/: node tools/battle-loot-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[battle-loot-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.battle-loot-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.battle-loot-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  battleLootRecruitCostPct,
  collectRemovedEnemyTypeIds,
  computeBattleLoot,
  formatBattleLootNote,
  battleLootIsEmpty,
} from '../src/game/battle-loot';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[battle-loot-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const {
  battleLootRecruitCostPct,
  collectRemovedEnemyTypeIds,
  computeBattleLoot,
  formatBattleLootNote,
  battleLootIsEmpty,
} = require(BUNDLE_FILE);

let pass = 0;
let fail = 0;

function eq(a, b, msg) {
  if (a === b) { pass++; return; }
  fail++;
  console.error('FAIL:', msg, '— expected', b, 'got', a);
}

function assert(cond, msg) {
  if (cond) { pass++; return; }
  fail++;
  console.error('FAIL:', msg);
}

// Param z combat-params.json
assert(battleLootRecruitCostPct() === 100, 'recruit_cost_pct domyślnie 100');

// Włócznik: 16 Pieniądz + 2 Brąz (units.json)
const wlocznik = computeBattleLoot(['Włócznik']);
eq(wlocznik.gold, 16, 'Włócznik gold');
eq(wlocznik.resources.braz, 2, 'Włócznik braz');
eq(wlocznik.killedCount, 1, 'Włócznik count');
eq(formatBattleLootNote(wlocznik), '+16 Pieniądz, +2 Brąz', 'format Włócznik');

// Dwa włóczniki
const dwa = computeBattleLoot(['Włócznik', 'Włócznik']);
eq(dwa.gold, 32, '2x Włócznik gold');
eq(dwa.resources.braz, 4, '2x Włócznik braz');

// 50% balans
const half = computeBattleLoot(['Włócznik'], 50);
eq(half.gold, 8, '50% gold');
eq(half.resources.braz, 1, '50% braz');

// Nieznana jednostka / milicja syntetyczna → 0
const zero = computeBattleLoot(['Milicja']);
assert(battleLootIsEmpty(zero), 'Milicja bez wpisu → brak łupu');

// collectRemovedEnemyTypeIds
const removed = collectRemovedEnemyTypeIds(
  [{ id: 'a1', typeId: 'Włócznik' }, { id: 'a2', typeId: 'Wojownik' }],
  [{ id: 'a2' }],
);
assert(removed.length === 1 && removed[0] === 'Włócznik', 'collectRemovedEnemyTypeIds');

// Przegrana / brak zabitych
const empty = computeBattleLoot([]);
assert(battleLootIsEmpty(empty), 'pusta lista → brak łupu');

console.log(`battle-loot-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
