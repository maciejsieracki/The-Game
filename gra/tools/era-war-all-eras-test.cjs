'use strict';
/**
 * era-war-all-eras-test.cjs -- R-WEB-ERA-WAR-BRONZE-IRON-REENABLE-Q1 (niezmiennik 3).
 *
 * Uruchamianie z gra/:  node tools/era-war-all-eras-test.cjs
 *
 * Sprawdza, że wojna epoki WYBUCHA w każdej z trzech epok (Kamień, Brąz, Żelazo) przy
 * domyślnej fladze `enabledForcedWarEras` z data/war-rules-params.json, oraz że ten sam
 * test PADA, gdy flaga wraca do `["stone"]` (test jest niezmiennikiem, nie zaślepką).
 *
 * Zakres (ważne): symulacja HEADLESS na PRAWDZIWYCH czystych modułach (esbuild, zero
 * reimplementacji formuł): dla każdej epoki w każdej z kolejnych tur 40..60 okablowanie
 * z main.ts: (1) bramka uruchomienia (eligibility: próg 25 tur od wejścia w epokę dla
 * Brązu/Żelaza, Kamień od tury 25/startu), (2) parowanie `assignForcedWarPairings`
 * (forced-war-common.ts), (3) bramka deklaracji `evaluateEraForcedWarGate`
 * (war-rules-multiwar.ts). Pełnego silnika main.ts (monolit DOM) ten test NIE uruchamia --
 * tę część pokrywają testy live w przeglądarce (forced-war-*-live-test.cjs).
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA_ROOT, 'src');
const entry = path.resolve(__dirname, '.era-war-all-eras-entry.ts');
const bundle = path.resolve(__dirname, '.era-war-all-eras-bundle.cjs');
const J = (p) => JSON.stringify(path.join(SRC, p));

fs.writeFileSync(entry, `
export { WAR_RULES_PARAMS, evaluateEraForcedWarGate, isForcedEraWarEnabled } from ${J('game/war-rules-multiwar')};
export { assignForcedWarPairings } from ${J('game/forced-war-common')};
export { isEligibleForStoneForcedWar } from ${J('game/forced-war-stone')};
export { isEligibleForBronzeForcedWar } from ${J('game/forced-war-bronze')};
export { isEligibleForIronForcedWar } from ${J('game/forced-war-iron')};
`, 'utf8');

let passed = 0;
let failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }

const ERAS = ['stone', 'bronze', 'iron'];
const ERA_NUM = { stone: 1, bronze: 2, iron: 3 };
const ERA_ENTER_TURN = 20; // wejście w epokę; próg 25 tur -> uruchomienie od tury 45

function hexDist(aq, ar, bq, br) {
  const dq = aq - bq;
  const dr = ar - br;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

function eligible(era, turn, M) {
  if (era === 'stone') return M.isEligibleForStoneForcedWar({ isMainAiCiv: true, isStoneEra: true, currentTurn: turn, isAlreadyAtWarAnyRole: false });
  if (era === 'bronze') return M.isEligibleForBronzeForcedWar({ isMainAiCiv: true, isAlreadyAtWarAnyRole: false, currentTurn: turn, eraEnterTurn: ERA_ENTER_TURN });
  return M.isEligibleForIronForcedWar({ isMainAiCiv: true, isAlreadyAtWarAnyRole: false, currentTurn: turn, eraEnterTurn: ERA_ENTER_TURN });
}

/**
 * Jedna tura jednej epoki: zwraca liczbę wypowiedzeń, które PRZEJDŁY bramkę deklaracji.
 * Świat: 4 AI (ownerId 1..4) w tej samej epoce, bez wojen; limit per cywilizacja w epoce = 1.
 */
function runTurn(M, era, turn, params, declaredByTag, counts, totalActive) {
  const subjects = [];
  for (let id = 1; id <= 4; id++) {
    if (eligible(era, turn, M)) subjects.push({ ownerId: id, q: id * 4, r: 0, era });
  }
  const res = M.assignForcedWarPairings(subjects, [], {
    isPairBlocked: () => false,
    hexDistanceFn: hexDist,
    totalActiveForcedWarsByOwner: (id) => totalActive.get(id) || 0,
  });
  let declared = 0;
  for (const a of res.assignments) {
    const verdict = M.evaluateEraForcedWarGate({
      multiwarEnabled: true,
      tag: era,
      declaredByTag,
      counts,
      attackerId: a.ownerId,
      attackerEpoch: ERA_NUM[era],
      targetId: a.targetId,
      targetEpoch: ERA_NUM[era],
    }, params);
    if (verdict !== 'ok') continue;
    declared++;
    declaredByTag.set(era, (declaredByTag.get(era) || 0) + 1);
    counts.set(`${a.ownerId}:${ERA_NUM[era]}`, 1);
    counts.set(`${a.targetId}:${ERA_NUM[era]}`, 1);
    totalActive.set(a.ownerId, (totalActive.get(a.ownerId) || 0) + 1);
    totalActive.set(a.targetId, (totalActive.get(a.targetId) || 0) + 1);
  }
  return declared;
}

/** Zwraca Map era -> liczba wypowiedzeń w turach 40..60 (osobny świat na epokę). */
function simulate(M, params) {
  const out = new Map();
  for (const era of ERAS) {
    const declaredByTag = new Map();
    const counts = new Map();
    const totalActive = new Map();
    let total = 0;
    for (let turn = 40; turn <= 60; turn++) {
      total += runTurn(M, era, turn, params, declaredByTag, counts, totalActive);
    }
    out.set(era, total);
  }
  return out;
}

function main() {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  const M = require(bundle);

  console.log('--- E1: flaga domyślna (data/war-rules-params.json) włącza wszystkie 3 epoki ---');
  assert(JSON.stringify(M.WAR_RULES_PARAMS.enabledForcedWarEras) === '["stone","bronze","iron"]', 'E1a enabledForcedWarEras = [stone,bronze,iron]');
  for (const era of ERAS) assert(M.isForcedEraWarEnabled(era) === true, `E1b ${era} włączona`);

  console.log('--- E2: wojna epoki wybucha w każdej z 3 epok (min. 1 raz, tury 40..60) ---');
  const defaults = simulate(M, M.WAR_RULES_PARAMS);
  for (const era of ERAS) {
    const n = defaults.get(era);
    assert(n >= 1, `E2 ${era}: wypowiedzeń wojny epoki = ${n} (oczekiwano >= 1)`);
    console.log(`  info: ${era} -> ${n} wypowiedzeń`);
  }

  console.log('--- E3: niezmiennik wykrywa regresję (flaga ["stone"] -> Brąz i Żelazo NIE wybuchają) ---');
  const stoneOnly = simulate(M, { ...M.WAR_RULES_PARAMS, enabledForcedWarEras: ['stone'] });
  assert(stoneOnly.get('stone') >= 1, `E3a Kamień nadal wybucha przy ["stone"] (got ${stoneOnly.get('stone')})`);
  assert(stoneOnly.get('bronze') === 0, `E3b Brąz przy ["stone"] = 0 (got ${stoneOnly.get('bronze')})`);
  assert(stoneOnly.get('iron') === 0, `E3c Żelazo przy ["stone"] = 0 (got ${stoneOnly.get('iron')})`);

  console.log(`\nera-war-all-eras-test: ${passed} pass / ${failed} fail`);
  if (failed > 0) process.exit(1);
}

main();
