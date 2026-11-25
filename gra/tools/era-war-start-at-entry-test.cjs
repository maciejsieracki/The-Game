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
  backfillMissingEraEntryTurns, LEGACY_ERA_ENTRY_WAIT_TURNS,
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

  console.log('--- D3: GRACZ w wojnie Kamienia przy wejściu w Brąz -> Brąz czeka na pokój (nie równolegle, nie przepada) ---');
  // Gracz (0) jest w puli subjectów z era 'bronze' (próg 0 od wejścia; licznik tylko tej epoki = 0).
  // Aktywna wojna Kamienia wyklucza go przez isEraWarExhausted (ta sama bramka co dla AI).
  // Gracz idzie przez playerFirst (partner = AI-kandydat z erą; bramka isPlayerPairGateOpen).
  const pairP = (stoneWarActive) => M.assignForcedWarPairings([{ ownerId: 0, q: 0, r: 0, era: 'bronze' }], [], {
    isPairBlocked: noBlock,
    hexDistanceFn: hexDist,
    totalActiveForcedWarsByOwner: noWars,
    isEraWarExhausted: (oid) => (oid === 0 && stoneWarActive),
    playerFirst: {
      playerOwnerId: 0,
      candidates: [{ ownerId: 3, q: 9, r: 0, era: 'bronze' }],
      isPlayerPairGateOpen: () => true,
    },
  });
  const playerPair = (res) => res.assignments.find((a) => a.ownerId === 0 || a.targetId === 0);
  eq(playerPair(pairP(true)), undefined, 'D3a: gracz w wojnie Kamienia -> Brąz NIE startuje');
  const pAfter = playerPair(pairP(false));
  assert(pAfter && pAfter.era === 'bronze' && pAfter.targetId === 0 && pAfter.ownerId === 3,
    `D3b: gracz po pokoju Kamienia -> Brąz startuje (partner 3), got ${JSON.stringify(pAfter)}`);

  console.log('--- L: zapis legacy bez wejść w epokę -> brak nagłej serii przy wczytaniu ---');
  eq(M.LEGACY_ERA_ENTRY_WAIT_TURNS, 40, 'L0: legacy wait = 40 (jak przed zmianą)');
  const legacy = new Map();
  M.backfillMissingEraEntryTurns(legacy, new Map([[3, 2], [5, 3], [7, 1]]), 100, M.LEGACY_ERA_ENTRY_WAIT_TURNS);
  eq(legacy.get(3), 140, 'L1: legacy Brąz owner 3 = wczytanie + 40');
  eq(legacy.get(5), 140, 'L2: legacy Żelazo owner 5 = wczytanie + 40');
  eq(legacy.has(7), false, 'L3: Kamień nie backfilluje wejścia');
  eq(M.isEligibleForBronzeForcedWar({ isMainAiCiv: true, isAlreadyAtWarAnyRole: false, currentTurn: 100, eraEnterTurn: legacy.get(3) }), false,
    'L4: legacy owner NIE eligible w turze wczytania');
  eq(M.isEligibleForBronzeForcedWar({ isMainAiCiv: true, isAlreadyAtWarAnyRole: false, currentTurn: 140, eraEnterTurn: legacy.get(3) }), true,
    'L5: legacy owner eligible po 40 turach od wczytania');
  const runtimeMap = new Map();
  M.backfillMissingEraEntryTurns(runtimeMap, new Map([[0, 2]]), 100);
  eq(runtimeMap.get(0), 100, 'L6: ścieżka runtime (domyślne 0) bez zmian: wejście = tura bieżąca');

  console.log('--- G: strażnik źródłowy main.ts (zarzut: test D1 na stubie, mutacja 45992 bez czerwieni) ---');
  const mainSrc = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
  const exhaustedIdx = mainSrc.indexOf('const isEraWarExhausted = (oid: number, era?: ForcedEraTag): boolean =>');
  assert(exhaustedIdx >= 0, 'G1: definicja isEraWarExhausted w main.ts istnieje');
  const exhaustedBlock = exhaustedIdx >= 0 ? mainSrc.slice(exhaustedIdx, exhaustedIdx + 400) : '';
  assert(/isOwnerInActiveEraWar\(oid\)\s*\n?\s*\|\|/.test(exhaustedBlock),
    'G2: isEraWarExhausted zawiera isOwnerInActiveEraWar(oid) (podmiot w aktywnej wojnie epoki wyłączony)');
  assert(mainSrc.includes('isEraWarExhausted: isWarRulesMultiwarEnabled() ? isEraWarExhausted : undefined'),
    'G3: assignForcedWarPairings dostaje isEraWarExhausted (bramka dla gracza i AI)');
  assert(mainSrc.includes('backfillMissingEraEntryTurns(bronzeEraEnterTurnByOwner, restoredEraOwners, turn, LEGACY_ERA_ENTRY_WAIT_TURNS)'),
    'G4: load-time backfill Brązu używa LEGACY_ERA_ENTRY_WAIT_TURNS (bez serii przy wczytaniu)');
  assert(mainSrc.includes('isOwnerInActiveEraWar(0)') || mainSrc.includes('isOwnerInActiveEraWar(oid)'), 'G5: sprawdzenie aktywnej wojny epoki obecne');

  console.log(`\nWYNIK: ${passed} OK / ${failed} FAIL`);
  if (failed > 0) process.exitCode = 1;
}

try { main(); } finally {
  try { fs.unlinkSync(entry); } catch (e) { /* ignore */ }
  try { fs.unlinkSync(bundle); } catch (e) { /* ignore */ }
}
