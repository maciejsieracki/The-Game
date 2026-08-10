'use strict';
/**
 * node tools/era-cud-warunek-awansu-test.cjs
 * R-EPOKA-CUD-WARUNEK-AWANSU — pure logic gate (owner-epoch.ts) dla cywilizacji GŁÓWNYCH:
 * awans epoki N->N+1 wymaga (1) kompletu technologii epoki N i (2) zbudowania własnego
 * cudu wyłącznego (E) epoki N, jeśli jest przypisany tej cywilizacji.
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.era-cud-warunek-awansu-entry.ts');
const bundle = path.join(__dirname, '.era-cud-warunek-awansu-bundle.cjs');

fs.writeFileSync(entry, `
export {
  computeOwnerEraFromResearch,
  computeMainCivEraFromResearch,
  allEraTechsResearched,
  eraOwnWonderIds,
  eraOwnWonderSatisfied,
  maxDefinedEra,
} from '../src/game/owner-epoch';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const {
  computeOwnerEraFromResearch,
  computeMainCivEraFromResearch,
  allEraTechsResearched,
  eraOwnWonderIds,
  eraOwnWonderSatisfied,
  maxDefinedEra,
} = require(bundle);

const tech = require('../data/tech.json').technologie;

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('era-cud-warunek-awansu-test\n');

// ---------------------------------------------------------------------------
// 1. allEraTechsResearched
// ---------------------------------------------------------------------------

const era1Techs = tech.filter(t => t.Epoka === 'Kamień').map(t => t.Technologia).filter(Boolean);
const era2Techs = tech.filter(t => t.Epoka === 'Brąz').map(t => t.Technologia).filter(Boolean);
const era3Techs = tech.filter(t => t.Epoka === 'Żelazo').map(t => t.Technologia).filter(Boolean);

assert(era1Techs.length === 12, 'kanon: 12 technologii epoki Kamień (1)');
assert(era2Techs.length === 12, 'kanon: 12 technologii epoki Brąz (2)');
assert(era3Techs.length === 8, 'kanon: 8 technologii epoki Żelazo (3)');

assert(allEraTechsResearched(1, tech, new Set(era1Techs)) === true,
  'allEraTechsResearched: komplet epoki 1 → true');
assert(allEraTechsResearched(1, tech, new Set(era1Techs.slice(1))) === false,
  'allEraTechsResearched: brak 1 tech epoki 1 → false');
assert(allEraTechsResearched(1, tech, new Set()) === false,
  'allEraTechsResearched: zero badań → false');
assert(allEraTechsResearched(2, tech, new Set(era2Techs)) === true,
  'allEraTechsResearched: komplet epoki 2 → true (niezależnie od epoki 1)');

// ---------------------------------------------------------------------------
// 2. eraOwnWonderIds / eraOwnWonderSatisfied
// ---------------------------------------------------------------------------

assert(JSON.stringify(eraOwnWonderIds('egipt', 1)) === JSON.stringify(['piramidy']),
  'eraOwnWonderIds: Egipt epoka 1 → Piramidy');
assert(eraOwnWonderIds('grecy', 1).length === 0,
  'eraOwnWonderIds: Grecja epoka 1 → brak cudu wyłącznego (Kolos jest w epoce 3)');
assert(JSON.stringify(eraOwnWonderIds('grecy', 3)) === JSON.stringify(['kolos']),
  'eraOwnWonderIds: Grecja epoka 3 → Kolos');
assert(eraOwnWonderIds('chinczycy', 3).length === 2,
  'eraOwnWonderIds: Chińczycy epoka 3 → 2 cuda wyłączne (terakotowa_armia, palac_weiyang)');

assert(eraOwnWonderSatisfied('grecy', 1, []) === true,
  'eraOwnWonderSatisfied: brak przypisanego cudu → warunek nieaktywny (true)');
assert(eraOwnWonderSatisfied('egipt', 1, []) === false,
  'eraOwnWonderSatisfied: Piramidy przypisane, nic zbudowane → false');
assert(eraOwnWonderSatisfied('egipt', 1, ['piramidy']) === true,
  'eraOwnWonderSatisfied: Piramidy zbudowane → true');
assert(eraOwnWonderSatisfied('egipt', 1, new Set(['piramidy'])) === true,
  'eraOwnWonderSatisfied: akceptuje też Set jako completedWonderIds');
assert(eraOwnWonderSatisfied('egipt', 1, ['kolos']) === false,
  'eraOwnWonderSatisfied: zbudowany CUDZY cud nie liczy się');
assert(eraOwnWonderSatisfied('chinczycy', 3, ['terakotowa_armia']) === true,
  'eraOwnWonderSatisfied: 2 przypisane cuda, wystarczy JEDEN zbudowany');

// ---------------------------------------------------------------------------
// 3. maxDefinedEra
// ---------------------------------------------------------------------------

assert(maxDefinedEra(tech) === 3, 'maxDefinedEra: dziś 3 (Kamień/Brąz/Żelazo)');

// ---------------------------------------------------------------------------
// 4. computeMainCivEraFromResearch — bramka pełna
// ---------------------------------------------------------------------------

assert(computeMainCivEraFromResearch(1, new Set(), tech, 'grecy', []) === 1,
  'main-civ: start Kamień, zero badań → era 1');

assert(computeMainCivEraFromResearch(1, new Set(era1Techs), tech, 'grecy', []) === 2,
  'main-civ: Grecja, komplet epoki 1, brak cudu wymaganego → awans do 2');

assert(computeMainCivEraFromResearch(1, new Set(era1Techs), tech, 'egipt', []) === 1,
  'main-civ: Egipt, komplet epoki 1, Piramidy NIE zbudowane → BLOKADA na 1');

assert(computeMainCivEraFromResearch(1, new Set(era1Techs), tech, 'egipt', ['piramidy']) === 2,
  'main-civ: Egipt, komplet epoki 1 + Piramidy zbudowane → awans do 2');

assert(computeMainCivEraFromResearch(1, new Set(era1Techs.slice(1)), tech, 'grecy', []) === 1,
  'main-civ: Grecja, brak 1 tech epoki 1 → nadal era 1 (tech ważniejszy niż cud)');

const doneUpTo2NoWonder = new Set([...era1Techs, ...era2Techs]);
assert(computeMainCivEraFromResearch(1, doneUpTo2NoWonder, tech, 'fenicjanie', []) === 2,
  'main-civ: Fenicjanie, komplet epok 1+2, Petra (epoka 2) NIE zbudowana → BLOKADA na epoce 2');
assert(computeMainCivEraFromResearch(1, doneUpTo2NoWonder, tech, 'fenicjanie', ['petra']) === 3,
  'main-civ: Fenicjanie, komplet epok 1+2 + Petra zbudowana → epoka 3');

const doneAll = new Set([...era1Techs, ...era2Techs, ...era3Techs]);
assert(computeMainCivEraFromResearch(1, doneAll, tech, 'grecy', []) === 3,
  'main-civ: Grecja, komplet 1+2, Kolos (epoka 3) NIE zbudowany → CAP na maxDefinedEra=3, nie wyżej');
assert(computeMainCivEraFromResearch(1, doneAll, tech, 'grecy', ['kolos']) === 3,
  'main-civ: Grecja, komplet wszystkich epok + Kolos zbudowany → wciąż CAP=3 (brak epoki 4 w danych)');

assert(computeMainCivEraFromResearch(2, doneAll, tech, 'sumer', []) === 2,
  'main-civ: start Brąz(2), komplet 1+2, Ziggurat (epoka 2) NIE zbudowany → BLOKADA na starcie (2)');
assert(computeMainCivEraFromResearch(2, doneAll, tech, 'sumer', ['ziggurat']) === 3,
  'main-civ: start Brąz(2) + Ziggurat zbudowany → epoka 3');

assert(computeMainCivEraFromResearch(10, doneAll, tech, 'grecy', []) === 10,
  'main-civ: startEra powyżej cap (10) → clamp, brak crashu');
assert(computeMainCivEraFromResearch(0, new Set(), tech, 'grecy', []) === 1,
  'main-civ: startEra poniżej 1 → clamp do 1');

// ---------------------------------------------------------------------------
// 5. Async per-civ (round 1: progresja niezależna, NIE globalna) + Kamień↔Żelazo parytet z computeOwnerEraFromResearch
// ---------------------------------------------------------------------------

assert(computeMainCivEraFromResearch(1, new Set(era1Techs), tech, 'grecy', []) !==
       computeMainCivEraFromResearch(1, new Set(), tech, 'egipt', []),
  'async: dwie cywilizacje z różnym stanem badań mają różną epokę (brak globalnej synchronizacji)');

assert(computeOwnerEraFromResearch(1, new Set(era1Techs), tech) === 2,
  'city-state (computeOwnerEraFromResearch, NIEZMIENIONE): komplet epoki 1 → nadal awans na starej ścieżce (1 tech kamień milowy wystarcza, cud nieistotny)');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
