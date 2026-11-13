'use strict';
/**
 * upkeep-difficulty-per-owner-test.cjs -- R-WEB-CITYSTATE-UPKEEP-DIFFICULTY-Q1.
 *
 * Utrzymanie (budynki + jednostki) w upkeepByOwner ma używać poziomu trudności
 * WŁAŚCICIELA: miasto-państwo -> cityStateDifficulty (osobny suwak), cywilizacja AI
 * i gracz -> trudność menu (_menuDifficulty). Test sprawdza:
 *   A. czystą funkcję wyboru poziomu per owner (effectiveGameDifficultyForOwnerPure):
 *      gracz -> menu, AI civ -> menu, miasto-państwo -> cityStateDifficulty, brak wpisu -> menu;
 *   B. dwa właściciele na różnych poziomach mają RÓŻNY upkeep przy tych samych jednostkach
 *      (previewOwnerUpkeep, prawdziwe dane z gra/data), N-1/N/N+1 poziomów;
 *   C. advanceCityEconomy z resolverem: upkeepByOwner miasta-państwa liczony wg jego
 *      poziomu, AI wg poziomu menu, gracz wg menu; brak resolvera = dawne zachowanie;
 *   D. liczby econ-params.json nietknięte (easy/normal/hard utrzymania jednostki 1/1/2).
 *
 * Run from gra/:  node tools/upkeep-difficulty-per-owner-test.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[upkeep-difficulty-per-owner-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.upkeep-difficulty-per-owner-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.upkeep-difficulty-per-owner-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { effectiveGameDifficultyForOwnerPure } from '../src/game/effective-difficulty-for-owner';
export { previewOwnerUpkeep, advanceCityEconomy } from '../src/game/turn-economy';
export { loadUpkeepParams } from '../src/game/economy-upkeep';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE_FILE, absWorkingDir: GRA, logLevel: 'silent',
  });
} catch (e) {
  console.error('[upkeep-difficulty-per-owner-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  effectiveGameDifficultyForOwnerPure, previewOwnerUpkeep, advanceCityEconomy, loadUpkeepParams,
} = require(BUNDLE_FILE);

const readJson = (rel) => JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', rel), 'utf8'));
const econParams = readJson('econ-params.json');
const units = readJson('units.json');
const buildings = readJson('buildings.json');
const data = { econParams, units, buildings, civs: [] };

let passed = 0, failed = 0;
function eq(a, b, msg) {
  if (a === b) passed++;
  else { failed++; console.error(`FAIL: ${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
}
function ok(c, msg) { eq(!!c, true, msg); }

// ---------------- A. wybór poziomu per owner ----------------
console.log('--- A: effectiveGameDifficultyForOwnerPure ---');
const PLAYER = 0, AI_CIV = 2, CS = 7, UNKNOWN = 99;
const csOwners = new Set([CS]);
eq(effectiveGameDifficultyForOwnerPure(PLAYER, 'hard', 'easy', csOwners), 'hard', 'A1 gracz -> menu (hard)');
eq(effectiveGameDifficultyForOwnerPure(AI_CIV, 'normal', 'easy', csOwners), 'normal', 'A2 AI cywilizacji -> menu (normal)');
eq(effectiveGameDifficultyForOwnerPure(CS, 'hard', 'easy', csOwners), 'easy', 'A3 miasto-panstwo -> cityStateDifficulty (easy)');
eq(effectiveGameDifficultyForOwnerPure(CS, 'easy', 'hard', csOwners), 'hard', 'A4 miasto-panstwo -> cityStateDifficulty (hard), menu easy');
eq(effectiveGameDifficultyForOwnerPure(UNKNOWN, 'hard', 'easy', csOwners), 'hard', 'A5 brak wpisu -> fallback menu');
eq(effectiveGameDifficultyForOwnerPure(UNKNOWN, 'normal', 'hard', new Set()), 'normal', 'A6 pusty zbior CS -> menu');

// ---------------- B. różny upkeep przy różnych poziomach ----------------
console.log('--- B: previewOwnerUpkeep na różnych poziomach (te same jednostki) ---');
// Realne jednostki z units.json maja WLASNE utrzymanie (per typ), wiec parametr
// poziomowy utrzymanie_jednostka_standard na nie NIE wplywa (zgodnosc: brak zmiany).
// Do testu wplywu poziomu uzywamy typeId spoza tabeli (fallback = standardUpkeep).
const realTypes = units.map(u => u.Jednostka).filter(Boolean).slice(0, 6);
const realUnits = (oid) => realTypes.map(t => ({ ownerId: oid, typeId: t, camping: false, onOwnTerritory: true }));
const FALLBACK_TYPE = 'TEST-JEDNOSTKA-SPOZA-TABELI';
const fallbackUnits = (oid) => [1, 2, 3].map(() => ({ ownerId: oid, typeId: FALLBACK_TYPE, camping: false, onOwnTerritory: true }));
const upkeepAt = (oid, level, unitsFn = fallbackUnits) => previewOwnerUpkeep(
  oid, [], data, level, new Map(), unitsFn(oid), 1, new Set(), () => 1, () => new Set(),
).utrzymanieJednostki;
const uEasy = upkeepAt(2, 'easy');
const uNormal = upkeepAt(2, 'normal');
const uHard = upkeepAt(2, 'hard');
ok(uEasy > 0, `B0 jednostki spoza tabeli maja utrzymanie > 0 (easy=${uEasy})`);
ok(uEasy <= uNormal && uNormal <= uHard, `B1 monotonicznosc easy<=normal<=hard (${uEasy}/${uNormal}/${uHard})`);
ok(uHard > uEasy, `B2 hard > easy dla tych samych jednostek spoza tabeli (${uHard} > ${uEasy})`);
eq(upkeepAt(2, 'easy', realUnits), upkeepAt(2, 'hard', realUnits),
  'B5 realne jednostki z wlasnym utrzymaniem: poziom bez wplywu (zgodnosc)');
// Dwa AI na różnych poziomach: ten sam zestaw jednostek, różny upkeep.
const aiA = upkeepAt(2, effectiveGameDifficultyForOwnerPure(2, 'easy', 'normal', csOwners));
const aiB = upkeepAt(3, effectiveGameDifficultyForOwnerPure(3, 'hard', 'normal', csOwners));
ok(aiA !== aiB, `B3 dwa AI na roznych poziomach -> rozny upkeep (${aiA} vs ${aiB})`);
// Miasto-państwo na poziomie CS vs na poziomie menu: różnica tylko przez poziom.
const csLow = upkeepAt(CS, effectiveGameDifficultyForOwnerPure(CS, 'hard', 'easy', csOwners));
const csHigh = upkeepAt(CS, effectiveGameDifficultyForOwnerPure(CS, 'easy', 'hard', csOwners));
ok(csHigh > csLow, `B4 miasto-panstwo na CS=hard ma wiekszy upkeep niz na CS=easy (${csHigh} > ${csLow})`);

// ---------------- C. advanceCityEconomy z resolverem ----------------
console.log('--- C: advanceCityEconomy upkeepByOwner z resolverem per owner ---');
const emptyMap = { width: 1, height: 1, hexes: {}, tiles: [], cols: 1, rows: 1 };
const econUnitsC = [2, CS].flatMap(oid => fallbackUnits(oid));
const resolver = (oid) => effectiveGameDifficultyForOwnerPure(oid, 'normal', 'hard', new Set([CS]));
let tickNoRes = null, tickRes = null, tickErr = null;
try {
  tickNoRes = advanceCityEconomy([], emptyMap, data, 'normal', econUnitsC);
  // Pozycje argumentow advanceCityEconomy: 1-5 bazowe, 6-13 mapy/era/tech, 14 pace,
  // 15-26 opcjonalne (domyslne), 27 = resolveOwnerUpkeepDifficulty.
  const argsC = [
    [], emptyMap, data, 'normal', econUnitsC,
    undefined, undefined, 1, undefined, undefined, undefined, undefined, undefined,
    'wysoki',
    ...Array(12).fill(undefined),
    resolver,
  ];
  tickRes = advanceCityEconomy(...argsC);
} catch (e) { tickErr = e; }
if (tickErr) {
  failed++;
  console.error('FAIL: C0 advanceCityEconomy rzuciło wyjątek:', tickErr.message || tickErr);
} else {
  const ubCs = tickRes.upkeepByOwner.get(CS);
  const ubAi = tickRes.upkeepByOwner.get(2);
  const ubCsNoRes = tickNoRes.upkeepByOwner.get(CS);
  const ubAiNoRes = tickNoRes.upkeepByOwner.get(2);
  ok(ubCs && ubAi, 'C1 upkeepByOwner zawiera miasto-panstwo i AI');
  ok(ubCs.utrzymanieJednostki > ubAi.utrzymanieJednostki,
    `C2 CS (hard) ma wiekszy upkeep jednostek niz AI (normal) (${ubCs.utrzymanieJednostki} > ${ubAi.utrzymanieJednostki})`);
  eq(ubAi.utrzymanieJednostki, ubAiNoRes.utrzymanieJednostki, 'C3 AI bez zmian wzgledem globalnego normal');
  ok(ubCs.utrzymanieJednostki > ubCsNoRes.utrzymanieJednostki,
    'C4 CS liczony wg cityStateDifficulty (hard), nie globalnego normal (bez resolvera)');
}

// ---------------- D. liczby nietknięte ----------------
console.log('--- D: liczby econ-params.json bez zmian ---');
eq(loadUpkeepParams(econParams, 'easy').jednostkaUtrzymanieStd, 1, 'D1 jednostka easy = 1');
eq(loadUpkeepParams(econParams, 'normal').jednostkaUtrzymanieStd, 1, 'D2 jednostka normal = 1');
eq(loadUpkeepParams(econParams, 'hard').jednostkaUtrzymanieStd, 2, 'D3 jednostka hard = 2');

console.log(`\nupkeep-difficulty-per-owner-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
