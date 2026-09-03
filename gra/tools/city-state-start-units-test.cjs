'use strict';
/**
 * city-state-start-units-test.cjs — R-MIASTA-PANSTWA-STARTOWE-JEDNOSTKI-Q1
 *
 * "Na najtrudniejszym poziomie państw-miast, każde państwo-miasto powinno zaczynać
 * od razu z dwiema jednostkami wojskowymi. Na najłatwiejszym zero, na normalnym
 * jedna jednostka." (Maciej)
 *
 * Sekcja A — realna egzekucja `grantCityStateStartUnits` (nie regex-nad-tekstem, wzorem
 * `forced-war-bronze-new-game-reset-test.cjs`): wyodrębnia dokładny tekst funkcji z
 * main.ts (regex/indexOf po niepowtarzalnych kotwicach) i wykonuje go przez `new Function`
 * z prawdziwym, zaimportowanym `cityStateStartUnitCount` (ai-difficulty-bonus.ts) oraz
 * atrapą `spawnDifficultyBonusUnit` nagrywającą wywołania. Dowodzi, że FUNKCJA W MAIN.TS
 * faktycznie spawnuje 0/1/2 jednostek dla easy/normal/hard — nie tylko że sama formuła
 * liczenia (cityStateStartUnitCount) zwraca poprawne liczby (to osobno w
 * ai-difficulty-bonus-test.cjs T-DB-i).
 *
 * Sekcja B — straznik wpiecia w main.ts (wzorem Sekcji B `ai-founding-territory-test.cjs`):
 * main.ts to jedna wielka funkcja z domknieciami, ktorej pętli foundowania miast-panstw NIE
 * da sie zaimportowac/uruchomic w izolacji bez pelnego bootu silnika (Chromium) — kontrola
 * tekstowa potwierdza, ze `grantCityStateStartUnits(...)` jest wywolane w OBU miejscach
 * foundowania miasta-panstwa (petla rywali tego samego typu ORAZ spawnPendingForeignClusters
 * dla klastrow obcego typu — potwierdzone reconem, dwa niezalezne punkty `c.startCityState =
 * true`), zaraz po ustawieniu `c.startCityState = true`, i wylacznie tam — NIE w foundowaniu
 * gracza/major AI (zero regresji kryterium 3).
 *
 * Kryterium mutacyjne (obie sekcje): usuniecie wywolania z jednego z dwoch miejsc, oraz
 * podmiana `return 2` na `return 1` w wyekstrahowanej funkcji, MUSZA zaczerwienic test.
 *
 * Run from gra/: node tools/city-state-start-units-test.cjs
 */

const fs = require('fs');
const path = require('path');

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  OK  ${label}`);
  } else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

const GRA_ROOT = path.resolve(__dirname, '..');
const mainSrc = fs.readFileSync(path.join(GRA_ROOT, 'src', 'main.ts'), 'utf8');

// ============================================================================
// Sekcja A — realna egzekucja grantCityStateStartUnits (extract + new Function)
// ============================================================================

const esbuild = (() => {
  try { return require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[city-state-start-units-test] esbuild not found');
    process.exit(1);
  }
})();

const ENTRY = path.resolve(__dirname, '.city-state-start-units-entry.ts');
const BUNDLE = path.resolve(__dirname, '.city-state-start-units-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { cityStateStartUnitCount, AI_DIFFICULTY_BONUS_UNIT_TYPE } from ${JSON.stringify(
  path.join(GRA_ROOT, 'src', 'game', 'ai-difficulty-bonus'),
)};
`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[city-state-start-units-test] bundle failed:', e.message || e);
  process.exit(1);
}
const { cityStateStartUnitCount, AI_DIFFICULTY_BONUS_UNIT_TYPE } = require(BUNDLE);

const FN_START_ANCHOR = 'function grantCityStateStartUnits(ownerId: number, q: number, r: number): void {\n';
const FN_END_ANCHOR = '\n    }\n\n    function grantDifficultyStartBonusesForMajorCapital(';

function extractFnBody(source) {
  const startIdx = source.indexOf(FN_START_ANCHOR);
  if (startIdx === -1) throw new Error('kotwica startowa grantCityStateStartUnits nie znaleziona w main.ts');
  const contentStart = startIdx + FN_START_ANCHOR.length;
  const endIdx = source.indexOf(FN_END_ANCHOR, contentStart);
  if (endIdx === -1) throw new Error('kotwica koncowa (grantDifficultyStartBonusesForMajorCapital) nie znaleziona w main.ts');
  return source.slice(contentStart, endIdx);
}

const originalFnBody = extractFnBody(mainSrc);

console.log('R-MIASTA-PANSTWA-STARTOWE-JEDNOSTKI-Q1 — Sekcja A: realna egzekucja grantCityStateStartUnits\n');

function runGrant(fnBody, difficulty, ownerId, q, r) {
  const spawned = [];
  const spawnDifficultyBonusUnit = (oid, typeId, qq, rr) => {
    spawned.push({ ownerId: oid, typeId, q: qq, r: rr });
  };
  const fn = new Function(
    'ownerId', 'q', 'r',
    '_menuCityStateDifficulty', 'cityStateStartUnitCount', 'AI_DIFFICULTY_BONUS_UNIT_TYPE', 'spawnDifficultyBonusUnit',
    fnBody,
  );
  fn(ownerId, q, r, difficulty, cityStateStartUnitCount, AI_DIFFICULTY_BONUS_UNIT_TYPE, spawnDifficultyBonusUnit);
  return spawned;
}

for (const [difficulty, expectedCount] of [['easy', 0], ['normal', 1], ['hard', 2]]) {
  const spawned = runGrant(originalFnBody, difficulty, 7, 4, 5);
  assert(
    `${difficulty}: grantCityStateStartUnits spawnuje dokladnie ${expectedCount} jednostek`,
    spawned.length === expectedCount,
    spawned.length,
  );
  for (const u of spawned) {
    assert(`${difficulty}: jednostka na hexie miasta-panstwa (4,5), owner=7`, u.q === 4 && u.r === 5 && u.ownerId === 7, u);
    assert(`${difficulty}: typ jednostki = AI_DIFFICULTY_BONUS_UNIT_TYPE (${AI_DIFFICULTY_BONUS_UNIT_TYPE})`, u.typeId === AI_DIFFICULTY_BONUS_UNIT_TYPE, u.typeId);
  }
}

// Mutacja: return 2 -> return 1 w cityStateStartUnitCount wplynie tez na extracted fn,
// bo fn dostaje PRAWDZIWY (zaimportowany) cityStateStartUnitCount, nie atrape — wiec zamiast
// tego mutujemy samo cialo funkcji: usuwamy petle spawnu (regresja typu "policzono, nie spawniono").
const MUTATION_TARGET = 'for (let i = 0; i < count; i++) {';
if (!originalFnBody.includes(MUTATION_TARGET)) {
  throw new Error('cel mutacji (petla spawnu) nieobecny w wyodrebnionym ciele funkcji');
}
const mutatedFnBody = originalFnBody.replace(MUTATION_TARGET, 'for (let i = 0; i < 0; i++) {');
const mutatedSpawned = runGrant(mutatedFnBody, 'hard', 7, 4, 5);
assert(
  'MUTACJA: usuniecie petli spawnu (count->0 na sztywno) -- hard spawnuje 0 zamiast 2 (test wykrywa regres)',
  mutatedSpawned.length === 0,
  mutatedSpawned.length,
);

// ============================================================================
// Sekcja B — straznik wpiecia w OBU punktach foundowania miasta-panstwa
// ============================================================================

console.log('\nSekcja B — straznik wpiecia grantCityStateStartUnits w main.ts\n');

const CALL_RE = /grantCityStateStartUnits\(/g;
const callCount = (mainSrc.match(CALL_RE) || []).length;
assert(
  'grantCityStateStartUnits wystepuje dokladnie 3x w main.ts (1 definicja + 2 wywolania)',
  callCount === 3,
  callCount,
);

// Miejsce 1 — petla rywali tego samego typu (deferred, po pierwszym miescie gracza).
const SITE1_ANCHOR = 'aiStartHexes.push({ q: pos.q, r: pos.r, ownerId });\n          grantCityStateStartUnits(ownerId, pos.q, pos.r);';
assert(
  'Miejsce 1 (petla rywali tego samego typu): grantCityStateStartUnits(ownerId, pos.q, pos.r) tuz po aiStartHexes.push',
  mainSrc.includes(SITE1_ANCHOR),
);

// Miejsce 2 — spawnPendingForeignClusters, wylacznie w galezi isCS.
const SITE2_ANCHOR = 'c.startCityState = true;\n            grantCityStateStartUnits(sc.ownerId, sc.q, sc.r);\n          }';
assert(
  'Miejsce 2 (spawnPendingForeignClusters, galaz isCS): grantCityStateStartUnits(sc.ownerId, sc.q, sc.r) tuz po c.startCityState = true wewnatrz if (isCS)',
  mainSrc.includes(SITE2_ANCHOR),
);

// Kryterium 3 (zero regresji gracz/AI): wywolanie NIE pojawia sie w
// grantDifficultyStartBonusesForMajorCapital (bonus startowy major AI, funkcja osobna).
const majorCapFnStart = mainSrc.indexOf('function grantDifficultyStartBonusesForMajorCapital(');
const majorCapFnEnd = mainSrc.indexOf('\n    }\n\n    /** Po stolicy gracza i rywalach tego samego typu', majorCapFnStart);
assert('kotwica grantDifficultyStartBonusesForMajorCapital znaleziona (dla kontroli izolacji)', majorCapFnStart !== -1 && majorCapFnEnd !== -1);
if (majorCapFnStart !== -1 && majorCapFnEnd !== -1) {
  const majorCapBody = mainSrc.slice(majorCapFnStart, majorCapFnEnd);
  assert(
    'grantCityStateStartUnits NIE jest wywolywane wewnatrz grantDifficultyStartBonusesForMajorCapital (zero regresji major AI)',
    !majorCapBody.includes('grantCityStateStartUnits('),
  );
}

// Mutacja: usuniecie JEDNEGO z dwoch wywolan (Miejsce 1) z tekstu MUSI zaczerwienic straznik.
const mutatedMainSrc = mainSrc.replace(SITE1_ANCHOR, 'aiStartHexes.push({ q: pos.q, r: pos.r, ownerId });');
const mutatedCallCount = (mutatedMainSrc.match(CALL_RE) || []).length;
assert(
  'MUTACJA: usuniecie wywolania z Miejsca 1 obniza licznik do 2 (straznik wykrywa regres wpiecia)',
  mutatedCallCount === 2,
  mutatedCallCount,
);

console.log(`\nWYNIK: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
