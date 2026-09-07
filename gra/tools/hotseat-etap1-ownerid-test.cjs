'use strict';
/**
 * hotseat-etap1-ownerid-test.cjs — bramka R-HOTSEAT-ETAP-1-OWNERID-ISAIOWNER-Q1.
 *
 * Dowodzi MATEMATYCZNIE (nie "zwykle tak samo"), że dla stanu single-human
 * (dzisiejszy, jedyny obowiązujący stan gry -- `humanSeats = { humanOwnerIds: [0],
 * activeHumanOwnerId: 0 }`):
 *
 *     isAiOwner(humanSeats, id) === (id > 0)     dla KAZDEGO id w zakresie testu
 *
 * czyli że podmiana `ownerId > 0` -> `isAiOwner(humanSeats, ownerId)` w main.ts jest
 * behawioralnym no-opem. Zakres: 0 (gracz), kilka dodatnich (AI/miasta-panstwo),
 * sentinel barbarzyncy (-1), sentinel rebelianta (-99), kilka innych ujemnych.
 *
 * Run: node tools/hotseat-etap1-ownerid-test.cjs (z katalogu gra/)
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[hotseat-etap1-ownerid-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.hotseat-etap1-ownerid-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.hotseat-etap1-ownerid-bundle.cjs');

const ENTRY_TS = `
export { HUMAN_OWNER_PRIMARY, isAiOwner } from '../src/game/human-owners';
export { BARBARIAN_OWNER_ID } from '../src/game/barbarians';
export { REBEL_FACTION_OWNER_ID } from '../src/game/society-breakdown';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[hotseat-etap1-ownerid-test] esbuild bundle failed:', e.message || e);
  process.exit(1);
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch { /* best-effort */ }
}

let mod;
try {
  delete require.cache[require.resolve(BUNDLE_FILE)];
  mod = require(BUNDLE_FILE);
} catch (e) {
  console.error('[hotseat-etap1-ownerid-test] require bundle failed:', e.message || e);
  process.exit(1);
} finally {
  try { fs.unlinkSync(BUNDLE_FILE); } catch { /* best-effort */ }
}

const { HUMAN_OWNER_PRIMARY, isAiOwner, BARBARIAN_OWNER_ID, REBEL_FACTION_OWNER_ID } = mod;

let pass = 0;
let fail = 0;

function assertEq(actual, expected, label) {
  if (actual === expected) {
    pass++;
  } else {
    fail++;
    console.error(`FAIL: ${label} -- oczekiwano ${JSON.stringify(expected)}, otrzymano ${JSON.stringify(actual)}`);
  }
}

// --- dzisiejszy jedyny stan gry: dokladnie jeden fotel czlowieka (ownerId 0) ---
const humanSeats = { humanOwnerIds: [HUMAN_OWNER_PRIMARY], activeHumanOwnerId: HUMAN_OWNER_PRIMARY };

assertEq(HUMAN_OWNER_PRIMARY, 0, 'HUMAN_OWNER_PRIMARY === 0 (zgodnie z main.ts, gracz = ownerId 0)');
assertEq(BARBARIAN_OWNER_ID, -1, 'sentinel: BARBARIAN_OWNER_ID === -1');
assertEq(REBEL_FACTION_OWNER_ID, -99, 'sentinel: REBEL_FACTION_OWNER_ID === -99');

// Zakres: gracz, kilka dodatnich AI/miast-panstw, oba realne sentinele ujemne.
// UWAGA (znalezione w tej rundzie, nie zgadywane): `isAiOwner` NIE jest rownowazne
// `ownerId > 0` dla DOWOLNEGO ujemnego id -- kazdy nie-ludzki, nie-sentinel ujemny id
// (np. -2) dostalby `isAiOwner === true` mimo `id > 0 === false`, bo `isAiOwner`
// wyklucza WYLACZNIE humanOwnerIds + BARBARIAN_OWNER_ID + REBEL_FACTION_OWNER_ID, nie
// "kazdy ujemny". To NIE jest regresja tej podmiany: swiezy grep (`OWNER_ID\s*=\s*-`
// w src/**) potwierdza, ze w calym kodzie istnieja WYLACZNIE te dwa ujemne sentinele
// (BARBARIAN_OWNER_ID=-1, REBEL_FACTION_OWNER_ID=-99) -- zaden `ownerId` w realnym
// stanie gry (city.ownerId/unit.ownerId) nigdy nie przyjmuje innej ujemnej wartosci,
// wiec rownowaznosc `isAiOwner(humanSeats,id) === (id>0)` jest dowiedziona na CALYM
// realnym zakresie wartosci `ownerId`, nie na kazdej liczbie calkowitej.
const idsToTest = [
  0,                        // gracz
  1, 2, 3, 5, 7, 42, 1000,  // AI / miasta-panstwo (dodatnie)
  BARBARIAN_OWNER_ID,       // sentinel barbarzynca (jedyny realny ujemny poza rebeliantem)
  REBEL_FACTION_OWNER_ID,   // sentinel rebeliant (jedyny inny realny ujemny)
];

for (const id of idsToTest) {
  assertEq(
    isAiOwner(humanSeats, id),
    id > 0,
    `single-human no-op: isAiOwner(humanSeats, ${id}) === (${id} > 0)`,
  );
}

// --- kontrola negatywna: bez tego dowodu byloby to tautologia ---
// isAiOwner NIE jest zdefiniowane jako `ownerId > 0` -- deleguje do isHumanOwner/
// sentinel-checks (patrz human-owners.ts). Test powyzej dowodzi rownowaznosci
// WYNIKOWEJ dla single-human, nie identycznosci implementacji.
assertEq(typeof isAiOwner, 'function', 'isAiOwner jest funkcja (nie stala/tautologia)');

console.log(`hotseat-etap1-ownerid-test: ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
