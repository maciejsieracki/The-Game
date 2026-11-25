'use strict';
/**
 * era-war-start-at-entry-test.cjs -- R-WEB-ERA-WAR-START-AT-ERA-ENTRY-Q1 (polecenie właściciela 2026-11-25).
 * Uruchamianie z gra/:  node tools/era-war-start-at-entry-test.cjs
 *
 * Reguły:
 *  - Brąz i Żelazo: wojna epoki może wybuchnąć w PIERWSZEJ turze po wejściu właściciela w epokę
 *    (próg `eraForcedWarStartTurnsFromEra.bronze/iron` = 0, z JSON), nie po 40 turach.
 *  - Kamień bez zmian: próg 40 od wejścia w epokę.
 *  - Podmiot w aktywnej wojnie epoki (np. Kamienia) w chwili wejścia w Brąz: wojna Brązu NIE startuje
 *    równolegle; pending zostaje i startuje w PIERWSZEJ turze po pokoju tamtej wojny (nie przepada).
 *  - Mutacja: przywrócenie progu 40 dla Brązu czerwi asercje (A1/A2 oblewają).
 *
 * Testuje PRAWDZIWE moduły: game/war-rules-multiwar.ts, game/forced-war-bronze.ts,
 * game/forced-war-iron.ts, game/forced-war-common.ts (assignForcedWarPairings).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA_ROOT, 'src');
const entry = path.resolve(__dirname, '.era-war-start-at-entry-entry.ts');
const bundle = path.resolve(__dirname, '.era-war-start-at-entry-bundle.cjs');
const J = (p) => JSON.stringify(path.join(SRC, p));

fs.writeFileSync(entry, `
export {
  WAR_RULES_PARAMS, isEraWarTargetDelayOk, isPlayerEligibleForEraWarPool,
} from ${J('game/war-rules-multiwar')};
export { assignForcedWarPairings } from ${J('game/forced-war-common')};
export { isEligibleForBronzeForcedWar, WOJNA_WYMUSZONA_START_TURY_OD_EPOKI } from ${J('game/forced-war-bronze')};
export { isEligibleForIronForcedWar, WOJNA_ZELAZO_WYMUSZONA_START_TURY_OD_EPOKI } from ${J('game/forced-war-iron')};
`, 'utf8');

let passed = 0;
let failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }
function eq(a, b, m) { assert(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function hexDist(aq, ar, bq, br) {
  const dq = aq - bq;
  const dr = ar - br;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

function main() {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, logLevel: 'silent',
  });
  const M = require(bundle);
  const noBlock = () => false;
  const noWars = () => 0;

  console.log('--- P: progi w JSON (R-WEB-ERA-WAR-START-AT-ERA-ENTRY-Q1) ---');
  eq(M.WAR_RULES_PARAMS.eraForcedWarStartTurnsFromEra.bronze, 0, 'Brąz = 0 tur od wejścia (JSON)');
  eq(M.WAR_RULES_PARAMS.eraForcedWarStartTurnsFromEra.iron, 0, 'Żelazo = 0 tur od wejścia (JSON)');
  eq(M.WAR_RULES_PARAMS.eraForcedWarStartTurnsFromEra.stone, 40, 'Kamień bez zmian = 40 (JSON)');
  eq(M.WOJNA_WYMUSZONA_START_TURY_OD_EPOKI, 0, 'stała Brązu czyta JSON = 0');
  eq(M.WOJNA_ZELAZO_WYMUSZONA_START_TURY_OD_EPOKI, 0, 'stała Żelaza czyta JSON = 0');

  console.log('--- A1: Brąz startuje w pierwszej turze po wejściu w epokę ---');
  const bronzeOk = (turn, enter) => M.isEligibleForBronzeForcedWar({
    isMainAiCiv: true, isAlreadyAtWarAnyRole: false, currentTurn: turn, eraEnterTurn: enter,
  });
  eq(bronzeOk(100, 100), true, 'Brąz: wejście t100 -> eligible w t100 (0 tur)');
  eq(bronzeOk(101, 100), true, 'Brąz: wejście t100 -> eligible w t101');
  eq(bronzeOk(99, 100), false, 'Brąz: t99 przed wejściem w t100 -> NIE eligible');

  console.log('--- A2: Żelazo startuje w pierwszej turze po wejściu w epokę ---');
  const ironOk = (turn, enter) => M.isEligibleForIronForcedWar({
    isMainAiCiv: true, isAlreadyAtWarAnyRole: false, currentTurn: turn, eraEnterTurn: enter,
  });
  eq(ironOk(120, 120), true, 'Żelazo: wejście t120 -> eligible w t120 (0 tur)');
  eq(ironOk(119, 120), false, 'Żelazo: t119 przed wejściem w t120 -> NIE eligible');

  console.log('--- A3: cel wojny epoki (AI po własnym wejściu) -- próg 0 ---');
  eq(M.isEraWarTargetDelayOk({ turn: 60, ownerId: 3, epoch: 2, bronzeEnterTurn: 60, ironEnterTurn: undefined }, M.WAR_RULES_PARAMS), true,
    'cel w Brązie od tury wejścia = OK');
  eq(M.isEraWarTargetDelayOk({ turn: 59, ownerId: 3, epoch: 2, bronzeEnterTurn: 60, ironEnterTurn: undefined }, M.WAR_RULES_PARAMS), false,
    'cel: tura przed wejściem = NIE');
  eq(M.isEraWarTargetDelayOk({ turn: 79, ownerId: 3, epoch: 1, bronzeEnterTurn: undefined, ironEnterTurn: undefined }, M.WAR_RULES_PARAMS), true,
    'Kamień od startu gry: 79 >= 40 -> OK (bez zmian)');
  eq(M.isEraWarTargetDelayOk({ turn: 39, ownerId: 3, epoch: 1, bronzeEnterTurn: undefined, ironEnterTurn: undefined }, M.WAR_RULES_PARAMS), false,
    'Kamień: tura 39 < 40 -> NIE (bez zmian)');

  console.log('--- A4: gracz w Brązie od tury wejścia -> w puli ---');
  eq(M.isPlayerEligibleForEraWarPool({
    currentTurn: 50, playerEpoch: 2, activeForcedWarsTotal: 0, activeForcedWarsInPlayerEra: 0,
    eraEnterTurn: 50, poolStartTurn: 40,
  }, M.WAR_RULES_PARAMS), true, 'gracz: wejście t50 -> w puli t50');

  console.log('--- D1: wojna Kamienia w chwili wejścia w Brąz -> Brąz czeka na pokój, nie przepada ---');
  // Model main.ts: podmiot w aktywnej wojnie epoki (dowolnej) jest wyłączony z parowania
  // (isEraWarExhausted = isOwnerInActiveEraWar || limit). Pending Brązu zostaje nietknięty.
  const trig = [{ ownerId: 1, q: 0, r: 0, era: 'bronze' }];
  const free = [{ ownerId: 3, q: 9, r: 0 }];
  const pair = (stoneWarActive) => M.assignForcedWarPairings(trig, [], {
    isPairBlocked: noBlock,
    hexDistanceFn: hexDist,
    totalActiveForcedWarsByOwner: noWars,
    isEraWarExhausted: (oid) => (oid === 1 && stoneWarActive),
    freeTargetCandidates: free,
  });
  const during = pair(true).assignments.find((a) => a.ownerId === 1);
  eq(during, undefined, 'D1a: w trakcie wojny Kamienia Brąz NIE startuje równolegle');
  const afterPeace = pair(false).assignments.find((a) => a.ownerId === 1);
  assert(afterPeace && afterPeace.era === 'bronze' && afterPeace.targetId === 3,
    `D1b: pierwsza tura po pokoju Kamienia -> Brąz startuje (cel 3), got ${JSON.stringify(afterPeace)}`);

  console.log('--- D2: Kamień nadal 40 (wejście gracza w Kamień nie zmienia progu Kamienia) ---');
  eq(M.isEraWarTargetDelayOk({ turn: 40, ownerId: 3, epoch: 1, bronzeEnterTurn: undefined, ironEnterTurn: undefined }, M.WAR_RULES_PARAMS), true,
    'D2: Kamień t40 OK');

  console.log(`\nWYNIK: ${passed} OK / ${failed} FAIL`);
  if (failed > 0) process.exitCode = 1;
}

try { main(); } finally {
  try { fs.unlinkSync(entry); } catch (e) { /* ignore */ }
  try { fs.unlinkSync(bundle); } catch (e) { /* ignore */ }
}
