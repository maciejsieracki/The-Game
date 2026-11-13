'use strict';
/**
 * era-war-delays-test.cjs -- R-WEB-ERA-DELAY-Q1 (decyzja właściciela 2026-11-08).
 * Uruchamianie z gra/:  node tools/era-war-delays-test.cjs
 *
 * Reguły:
 *  - Kamień, Brąz i Żelazo: wojna wymaga 40 tur od wejścia TEGO ownera w epokę.
 *  - Kamień zachowuje R1 (tura globalna 40); Brąz i Żelazo omijają R1.
 *  - Brąz i Żelazo: wojna wybucha 40 tur po wejściu TEGO ownera w epokę, NIEZALEŻNIE od
 *    tury gry (bramka R1 nie obowiązuje dla tagów bronze/iron).
 *  - Zwykłe wypowiedzenie (bez tagu epoki) przed turą 40 nadal zablokowane (R1).
 *  - Odpoczynek (20) i cooldown (20) po wojnie wymuszonej NIE są zmieniane.
 *
 * Testuje PRAWDZIWE moduły: game/war-rules-multiwar.ts, game/forced-war-bronze.ts,
 * game/forced-war-iron.ts, game/forced-war-common.ts (assignForcedWarPairings) oraz
 * statycznie okablowanie w src/main.ts (pula podmiotów przed turą 40, bramka komendy).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA_ROOT, 'src');
const entry = path.resolve(__dirname, '.era-war-delays-entry.ts');
const bundle = path.resolve(__dirname, '.era-war-delays-bundle.cjs');
const J = (p) => JSON.stringify(path.join(SRC, p));

fs.writeFileSync(entry, `
export {
  WAR_RULES_PARAMS, evaluateInterCivWarGate, evaluateEraForcedWarGate,
  isInterCivWarOpenAtTurn, isEraForcedWarIgnoringR1, eraWarCounterEpoch, backfillMissingEraEntryTurns,
} from ${J('game/war-rules-multiwar')};
export { assignForcedWarPairings } from ${J('game/forced-war-common')};
export { isEligibleForBronzeForcedWar, WOJNA_WYMUSZONA_START_TURY_OD_EPOKI, WOJNA_WYMUSZONA_ODPOCZYNEK_TUR, WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR } from ${J('game/forced-war-bronze')};
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

function gateInput(over) {
  return {
    turn: 30, attackerEra: 2, attackerWarCount: 0, targetIsPlayer: false,
    targetEra: 2, targetWarCount: 0, ...over,
  };
}

function main() {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  const M = require(bundle);

  console.log('--- P: parametry w data/war-rules-params.json ---');
  eq(M.WAR_RULES_PARAMS.delayInterCivWarsUntilTurn, 40, 'R1 zostaje: delayInterCivWarsUntilTurn = 40');
  eq(M.WAR_RULES_PARAMS.eraForcedWarStartTurnsFromEra.stone, 40, 'próg Kamienia = 40 (z JSON)');
  eq(M.WAR_RULES_PARAMS.eraForcedWarStartTurnsFromEra.bronze, 40, 'próg Brązu = 40 (z JSON)');
  eq(M.WAR_RULES_PARAMS.eraForcedWarStartTurnsFromEra.iron, 40, 'próg Żelaza = 40 (z JSON)');
  eq(JSON.stringify(M.WAR_RULES_PARAMS.eraForcedWarIgnoreR1), '["bronze","iron"]', 'eraForcedWarIgnoreR1 = [bronze, iron]');
  eq(M.isEraForcedWarIgnoringR1('stone'), false, 'Kamień NIE omija R1');
  eq(M.isEraForcedWarIgnoringR1('bronze'), true, 'Brąz omija R1');
  eq(M.isEraForcedWarIgnoringR1('iron'), true, 'Żelazo omija R1');
  eq(M.isEraForcedWarIgnoringR1(null), false, 'zwykłe wypowiedzenie (null) NIE omija R1');
  eq(M.WOJNA_WYMUSZONA_ODPOCZYNEK_TUR, 20, 'odpoczynek po wojnie nietknięty = 20');
  eq(M.WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR, 20, 'cooldown tej samej cywilizacji nietknięty = 20');
  eq(M.WOJNA_WYMUSZONA_START_TURY_OD_EPOKI, 40, 'stała Brązu czyta JSON = 40');
  eq(M.WOJNA_ZELAZO_WYMUSZONA_START_TURY_OD_EPOKI, 40, 'stała Żelaza czyta JSON = 40');

  console.log('--- G1: bramka R1 (tura 30, przed 40) ---');
  eq(M.evaluateInterCivWarGate(gateInput({ eraTag: 'stone' })), 'delay_r1', 'Kamień przed turą 40 = zablokowany (R1)');
  eq(M.evaluateInterCivWarGate(gateInput({ eraTag: null })), 'delay_r1', 'zwykłe wypowiedzenie przed turą 40 = zablokowane (R1)');
  eq(M.evaluateInterCivWarGate(gateInput({})), 'delay_r1', 'brak pola eraTag (stary wołający) przed turą 40 = zablokowane (R1)');
  eq(M.evaluateInterCivWarGate(gateInput({ eraTag: 'bronze' })), 'ok', 'Brąz przed turą 40 = dozwolony (bez R1)');
  eq(M.evaluateInterCivWarGate(gateInput({ eraTag: 'iron', attackerEra: 3, targetEra: 3 })), 'ok', 'Żelazo przed turą 40 = dozwolone (bez R1)');
  eq(M.evaluateInterCivWarGate(gateInput({ turn: 0, eraTag: 'bronze' })), 'ok', 'Brąz w turze 0 = dozwolony (niezależnie od tury gry)');
  eq(M.evaluateInterCivWarGate(gateInput({ turn: 40, eraTag: 'stone' })), 'ok', 'Kamień w turze 40 = dozwolony');
  eq(M.evaluateInterCivWarGate(gateInput({ turn: 39, eraTag: null })), 'delay_r1', 'zwykłe wypowiedzenie w turze 39 nadal zablokowane');
  eq(M.evaluateInterCivWarGate(gateInput({ turn: 40, eraTag: null })), 'ok', 'zwykłe wypowiedzenie w turze 40 dozwolone');
  eq(M.isInterCivWarOpenAtTurn(30), false, 'R1 ogólnie nadal zamknięta w turze 30');
  eq(M.evaluateInterCivWarGate(gateInput({ eraTag: 'bronze', attackerWarCount: 5, attackerEra: 2 })), 'ok', 'R2 nie dotyczy Brązu (limit null)');

  console.log('--- G2: pełna bramka epoki (evaluateEraForcedWarGate) nie zmieniona ---');
  const gateEra = (tag) => M.evaluateEraForcedWarGate({
    multiwarEnabled: true, tag, declaredByTag: new Map(), counts: new Map(),
    attackerId: 1, attackerEpoch: 2, targetId: 2, targetEpoch: 2,
  });
  eq(gateEra('bronze'), 'ok', 'evaluateEraForcedWarGate(bronze) = ok');
  eq(gateEra('iron'), 'ok', 'evaluateEraForcedWarGate(iron) = ok');

  console.log('--- E1: próg 40 tur od wejścia w epokę, niezależnie od tury gry ---');
  const bronzeIn = (turn, enter) => M.isEligibleForBronzeForcedWar({
    isMainAiCiv: true, isAlreadyAtWarAnyRole: false, currentTurn: turn, eraEnterTurn: enter,
  });
  const ironIn = (turn, enter) => M.isEligibleForIronForcedWar({
    isMainAiCiv: true, isAlreadyAtWarAnyRole: false, currentTurn: turn, eraEnterTurn: enter,
  });
  eq(bronzeIn(49, 10), false, 'Brąz: tura 49, wejście 10 (39 tur) = NIE eligible');
  eq(bronzeIn(50, 10), true, 'Brąz: tura 50, wejście 10 (40 tur) = eligible');
  eq(ironIn(49, 10), false, 'Żelazo: tura 49, wejście 10 (39 tur) = NIE eligible');
  eq(ironIn(50, 10), true, 'Żelazo: tura 50, wejście 10 (40 tur) = eligible');
  eq(bronzeIn(219, 180), false, 'przykład ownera: global 219, wejście 180 (39 tur) = NIE eligible');
  eq(bronzeIn(220, 180), true, 'przykład ownera: global 220, wejście 180 (40 tur) = eligible');

  console.log('--- E2: legacy save timestamps begin conservatively at load ---');
  const legacyBronzeEntries = new Map();
  const legacyIronEntries = new Map();
  const loadedOwnerEras = new Map([[0, 2], [7, 2], [8, 3], [9, 1]]);
  M.backfillMissingEraEntryTurns(legacyBronzeEntries, loadedOwnerEras, 219);
  M.backfillMissingEraEntryTurns(legacyIronEntries, loadedOwnerEras, 219);
  eq(JSON.stringify([...legacyBronzeEntries]), JSON.stringify([[0, 219], [7, 219], [8, 219]]), 'missing legacy timestamps are initialized at load only for Bronze/Iron owners');
  eq(JSON.stringify([...legacyIronEntries]), JSON.stringify([[0, 219], [7, 219], [8, 219]]), 'legacy Iron map receives same conservative load turn');
  eq(bronzeIn(258, legacyBronzeEntries.get(7)), false, 'legacy Bronze owner remains blocked after 39 turns');
  eq(bronzeIn(259, legacyBronzeEntries.get(7)), true, 'legacy Bronze owner opens after 40 turns');
  const knownEntries = new Map([[7, 180], [8, 190]]);
  M.backfillMissingEraEntryTurns(knownEntries, loadedOwnerEras, 219);
  eq(JSON.stringify([...knownEntries]), JSON.stringify([[7, 180], [8, 190], [0, 219]]), 'known saved entry turns survive backfill unchanged');

  console.log('--- F1: flow headless (pula -> parowanie -> bramki komendy), tura 30 ---');
  // Odwzorowanie filtra puli z main.ts (blok "R-WEB-ERA-DELAY-Q1"): przed turą 40 wypadają
  // podmioty bez tagu bronze/iron (Kamień, gracz), zostają Brąz/Żelazo.
  const filterPoolBeforeR1 = (subjects, turn) => turn >= M.WAR_RULES_PARAMS.delayInterCivWarsUntilTurn
    ? subjects.slice()
    : subjects.filter(s => M.isEraForcedWarIgnoringR1(s.era, M.WAR_RULES_PARAMS));
  const pool = [
    { ownerId: 0, q: 0, r: 0 },
    { ownerId: 1, q: 1, r: 0, era: 'stone' },
    { ownerId: 2, q: 3, r: 0, era: 'bronze' },
    { ownerId: 3, q: 4, r: 0, era: 'iron' },
    { ownerId: 4, q: 9, r: 0, era: 'bronze' },
  ];
  const poolT30 = filterPoolBeforeR1(pool, 30);
  eq(poolT30.map(s => s.ownerId).join(','), '2,3,4', 'tura 30: pula = Brąz i Żelazo (Kamień i gracz wypadają)');
  eq(filterPoolBeforeR1(pool, 40).length, 5, 'tura 40: pula bez zmian');

  const opts = {
    isPairBlocked: () => false,
    hexDistanceFn: hexDist,
    totalActiveForcedWarsByOwner: () => 0,
  };
  const res = M.assignForcedWarPairings(poolT30, [], opts);
  assert(res.assignments.length >= 1, 'tura 30: parowanie tworzy co najmniej jedno wypowiedzenie Brązu/Żelaza');
  let allGatesOk = res.assignments.length > 0;
  for (const a of res.assignments) {
    const verdict = M.evaluateInterCivWarGate(gateInput({ eraTag: a.era, attackerEra: 2, targetEra: 2 }));
    if (verdict !== 'ok') allGatesOk = false;
  }
  assert(allGatesOk, 'tura 30: bramka komendy (R1 + tag epoki) przepuszcza wypowiedzenia Brązu/Żelaza');

  console.log('--- F2: flow headless, Kamień przed turą 40 nadal zablokowany ---');
  const stonePool = [
    { ownerId: 1, q: 1, r: 0, era: 'stone' },
    { ownerId: 2, q: 3, r: 0, era: 'stone' },
  ];
  eq(filterPoolBeforeR1(stonePool, 30).length, 0, 'tura 30: pula Kamienia pusta (R1)');
  eq(M.evaluateInterCivWarGate(gateInput({ eraTag: 'stone', attackerEra: 1, targetEra: 1 })), 'delay_r1', 'tura 30: wypowiedzenie Kamienia zablokowane');

  console.log('--- Q: starsza zaległa epoka wygrywa i czeka na koniec poprzedniej wojny ---');
  const queued = [
    { ownerId: 1, q: 1, r: 0, era: 'bronze' },
    { ownerId: 1, q: 1, r: 0, era: 'iron' },
    { ownerId: 2, q: 3, r: 0, era: 'bronze' },
  ];
  const active = new Map([[1, 1], [2, 1]]);
  const queueOpts = {
    isPairBlocked: () => false, hexDistanceFn: hexDist,
    totalActiveForcedWarsByOwner: id => active.get(id) || 0,
  };
  eq(M.assignForcedWarPairings(queued, [], queueOpts).assignments.length, 0,
    'aktywny forced era-war blokuje następny trigger i nie zużywa kolejki');
  active.clear();
  const afterPeace = M.assignForcedWarPairings(queued, [], queueOpts).assignments;
  eq(afterPeace.length, 2, 'po pokoju zaległa epoka może od razu dostać parę');
  eq(afterPeace.every(a => a.era === 'bronze'), true,
    'Brąz zaległy po Kamieniu/po awansie ma pierwszeństwo przed Żelazem');
  eq(M.eraWarCounterEpoch(3, 3), 3, 'bieżąca epoka liczy się pod własnym tagiem');
  eq(M.eraWarCounterEpoch(2, 3), 2, 'zaległy Brąz w ownerze Żelaza liczy się pod epoką Brązu');

  console.log('--- S: okablowanie w main.ts (statyczne) ---');
  const mainSrc = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  assert(/isEraForcedWarIgnoringR1\(triggeredSubjects\[ti\]!\.era, WAR_RULES_PARAMS\)/.test(mainSrc),
    'S1 pula przed turą 40 filtruje przez isEraForcedWarIgnoringR1 (nie czyści bronze/iron)');
  assert(!/isWarRulesMultiwarEnabled\(\) && !isInterCivWarOpenAtTurn\(turn\)\) triggeredSubjects\.length = 0;/.test(mainSrc),
    'S2 stare czyszczenie całej puli przed turą 40 usunięte');
  assert(/evaluateInterCivWarGate\(\{\s*turn,\s*attackerEra: empireEpochForOwner\(ownerId\),[\s\S]*?eraTag: gateForcedTagAny,/.test(mainSrc),
    'S3 bramka komendy wypowiedz_wojne przekazuje eraTag: gateForcedTagAny');
  assert(/isPlayerPairGateOpen: \(aiOwnerId: number\): boolean =>[\s\S]*?evaluateInterCivWarGate\(\{[\s\S]*?eraTag:/.test(mainSrc),
    'S4 bramka gracza-pierwszego przekazuje eraTag');
  assert(/const isOwnerInActiveEraWar = \(ownerId: number\): boolean =>\s*allActiveForcedWarPairsFlat\.some/.test(mainSrc),
    'S5 nie-nakładanie sprawdza aktywne forced-war pary wszystkich epok');
  assert(/const isEraWarExhausted = \(oid: number, era\?: ForcedEraTag\)[\s\S]*?isOwnerInActiveEraWar\(oid\)/.test(mainSrc),
    'S6 aktywna wojna epoki blokuje obie strony w rzeczywistym parowaniu');
  assert(/bronzeEraEnterTurnByOwner\.get\(ownerId\)/.test(mainSrc) && /ironEraEnterTurnByOwner\.get\(ownerId\)/.test(mainSrc),
    'S7 owner-entry turn maps remain the Bronze/Iron trigger clocks');

  console.log(`\nWYNIK: ${passed} OK / ${failed} FAIL`);
  if (failed > 0) process.exit(1);
}

try {
  main();
} finally {
  for (const f of [entry, bundle]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }
}
