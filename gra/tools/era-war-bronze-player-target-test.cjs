'use strict';
/**
 * era-war-bronze-player-target-test.cjs — R-WEB-ERA-WAR-BRONZE-NOT-DECLARED-DIAG-Q1 (diagnoza) +
 * R-WEB-ERA-WAR-PLAYER-POOL-DESPITE-STONE-WAR-Q1 (poprawka: gracz w puli Brązu/Żelaza mimo wojny Kamienia).
 * Run from gra/:  node tools/era-war-bronze-player-target-test.cjs
 *
 * Pytanie właściciela: gracz jest w Brązie >= 20 tur, a żadna AI nie wypowiada mu wojny epoki.
 * Scenariusze wołają REALNE moduły (assignForcedWarPairings, isEligibleForBronzeForcedWar,
 * evaluateEraForcedWarGate, evaluateInterCivWarGate, canCivJoinEraForcedWar, restoreEraWarCounts,
 * isWarTreatyBlocked, parametry z data/war-rules-params.json). Zbieranie podmiotów (kroki A-E)
 * odtwarza warunki z main.ts (blok „Krok A..E”, ok. linii 38850-39080) 1:1 co do predykatów.
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src');
const ENTRY = path.resolve(__dirname, '.era-war-bronze-player-target-entry.ts');
const BUNDLE = path.resolve(__dirname, '.era-war-bronze-player-target-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { assignForcedWarPairings, countActiveForcedWarsForOwner } from ${JSON.stringify(SRC + '/game/forced-war-common')};
export { isEligibleForBronzeForcedWar, WOJNA_WYMUSZONA_START_TURY_OD_EPOKI } from ${JSON.stringify(SRC + '/game/forced-war-bronze')};
export {
  WAR_RULES_PARAMS, evaluateEraForcedWarGate, evaluateInterCivWarGate, canCivJoinEraForcedWar,
  recordEraForcedWarParticipation, restoreEraWarCounts, isWarTreatyBlocked, isEraForcedWarIgnoringR1,
  isInterCivWarOpenAtTurn, eraWarCivKey, isPlayerEligibleForEraWarPool, isPlayerEraWarSlotFree, eraWarCounterEpoch, forcedEraTagEpoch, forcedEraTagForEpoch,
} from ${JSON.stringify(SRC + '/game/war-rules-multiwar')};
`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent' });
} catch (e) { console.error('bundling failed', e.message || e); process.exit(1); }
const M = require(BUNDLE);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) pass++; else { fail++; console.error('  FAIL:', msg); } }

const hexDistance = (aq, ar, bq, br) => {
  const dq = aq - bq, dr = ar - br;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
};

/**
 * Świat testowy. ai: {id, q, r, epoch, eraEnterTurn?, pending?, atOrdinaryWar?, difficulty?, alliedWithPlayer?}
 * forcedPairs: [{attackerId,targetId,era}] — aktywne wojny wymuszone (dowolna epoka, także z graczem).
 */
function runWave(world) {
  const { turn, playerCapital, ai, forcedPairs, counts, alliances = [], playerEra = 2, playerEpochWarEnabled = true, playerEraEnterTurn = 40 } = world;
  const forcedFlat = forcedPairs.map(p => ({ attackerId: p.attackerId, targetId: p.targetId }));
  const totalActive = (oid) => M.countActiveForcedWarsForOwner(oid, forcedFlat);
  // main.ts (Krok C): wojny gracza TEJ SAMEJ epoki co jego bieżąca (tag z pary).
  const playerTag = M.forcedEraTagForEpoch(playerEra);
  const playerInEra = forcedPairs.filter(p => (p.attackerId === 0 || p.targetId === 0) && p.era === playerTag).length;
  const totalActiveForPairing = (oid) => (oid === 0 && (playerTag === 'bronze' || playerTag === 'iron') ? playerInEra : totalActive(oid));
  const epochOf = (oid) => (oid === 0 ? playerEra : (ai.find(a => a.id === oid) || {}).epoch);
  const allied = (a, b) => alliances.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const rows = [];
  const subjects = [];
  for (const a of ai) {
    const row = { id: a.id, epoch: a.epoch, candidate: false, reason: [] };
    rows.push(row);
    if (a.epoch === 1 && a.stonePending) { // uproszczenie testu: pending Kamienia bez progu Brązu (tylko miks epok)
      row.candidate = true; subjects.push({ ownerId: a.id, q: a.q, r: a.r, era: 'stone' });
      row.reason.push('wojna Kamienia (pending)'); continue;
    }
    if (a.epoch !== 2) { row.reason.push('nie w Brązie (epoka ' + a.epoch + ') -> brak pending Brązu'); continue; }
    if (a.difficulty === 1) { row.reason.push('poziom Łatwy: forcedWarDifficultyLevel===1 wyłącza szukanie'); continue; }
    const el = M.isEligibleForBronzeForcedWar({ isMainAiCiv: true, isAlreadyAtWarAnyRole: !!a.atOrdinaryWar || totalActive(a.id) > 0, currentTurn: turn, eraEnterTurn: a.eraEnterTurn });
    if (!a.pending) { row.reason.push('brak pending (już skonsumowany/cykl)'); continue; }
    if (!el) {
      row.reason.push(a.atOrdinaryWar || totalActive(a.id) > 0 ? 'już w wojnie (dowolna rola)' : 'próg ' + M.WOJNA_WYMUSZONA_START_TURY_OD_EPOKI + ' tur od wejścia w Brąz niespełniony (' + (turn - a.eraEnterTurn) + ')');
      continue;
    }
    row.candidate = true;
    subjects.push({ ownerId: a.id, q: a.q, r: a.r, era: 'bronze' });
  }
  // Krok C (main.ts): gracz do puli tylko gdy turn>=25 i brak aktywnej wojny wymuszonej.
  let playerInPool = false;
  const poolOk = M.isPlayerEligibleForEraWarPool({
    currentTurn: turn, playerEpoch: playerEra, activeForcedWarsTotal: totalActive(0),
    activeForcedWarsInPlayerEra: playerInEra, eraEnterTurn: playerEraEnterTurn, poolStartTurn: 25,
  }, M.WAR_RULES_PARAMS);
  if (poolOk && playerEpochWarEnabled) { subjects.push({ ownerId: 0, q: playerCapital.q, r: playerCapital.r }); playerInPool = true; }
  const isEraWarExhausted = (oid) => !M.canCivJoinEraForcedWar(counts, oid, epochOf(oid), M.WAR_RULES_PARAMS);
  const pairBlocked = (a, b) => M.isWarTreatyBlocked({ eraWar: true, hasNap: false, peaceLocked: false, hasAlliance: allied(a, b) });
  const res = M.assignForcedWarPairings(
    subjects,
    forcedPairs.filter(p => p.targetId !== 0).map(p => ({ attackerId: p.attackerId, targetId: p.targetId, era: p.era })),
    {
      isPairBlocked: pairBlocked,
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: totalActiveForPairing,
      isEraWarExhausted,
      playerFirst: {
        playerOwnerId: 0,
        isPlayerPairGateOpen: (aiId) => M.evaluateInterCivWarGate({
          turn, attackerEra: epochOf(aiId), attackerWarCount: (ai.find(a => a.id === aiId).atOrdinaryWar ? 1 : 0) + totalActive(aiId),
          eraTag: epochOf(aiId) === 1 ? 'stone' : epochOf(aiId) === 2 ? 'bronze' : 'iron', targetIsPlayer: true, targetEra: 0, targetWarCount: 0,
        }, M.WAR_RULES_PARAMS) === 'ok' && M.isPlayerEraWarSlotFree(counts, epochOf(aiId), playerEra),
        candidates: ai.map(a => ({ ownerId: a.id, q: a.q, r: a.r, era: a.epoch === 1 ? 'stone' : a.epoch === 2 ? 'bronze' : 'iron' })),
      },
    },
  );
  // Gate wypowiedzenia (main.ts blok wypowiedz_wojne) dla przydziałów na gracza.
  const toPlayer = res.assignments.filter(x => x.targetId === 0);
  const gateVerdicts = toPlayer.map(x => ({ attacker: x.ownerId, verdict: M.evaluateEraForcedWarGate({
    multiwarEnabled: true, tag: x.era, declaredByTag: new Map(), counts, attackerId: x.ownerId, attackerEpoch: epochOf(x.ownerId), targetId: 0, targetEpoch: M.eraWarCounterEpoch(M.forcedEraTagEpoch(x.era), playerEra),
  }, M.WAR_RULES_PARAMS) }));
  for (const row of rows) {
    const asn = res.assignments.filter(x => x.ownerId === row.id);
    row.assignment = asn.map(x => (x.targetId === 0 ? 'GRACZ' : 'AI' + x.targetId) + '(' + x.era + ')').join(',') || '-';
    if (row.candidate && asn.length === 0 && res.unresolvedOwnerIds.includes(row.id)) row.reason.push('leftover bez pary (unresolved)');
    if (row.candidate && asn.length > 0 && !asn.some(x => x.targetId === 0)) row.reason.push('najbliższy/dopasowany cel = inna AI, nie gracz');
    if (isEraWarExhausted(row.id)) row.reason.push('licznik epoki wyczerpany');
  }
  return { rows, playerInPool, res, toPlayer, gateVerdicts, playerExhausted: isEraWarExhausted(0) };
}

function print(title, r) {
  console.log('\n=== ' + title + ' ===');
  console.log('gracz w puli: ' + r.playerInPool + ' | licznik gracza wyczerpany: ' + r.playerExhausted + ' | przydziały na gracza: ' + JSON.stringify(r.toPlayer) + ' | bramka: ' + JSON.stringify(r.gateVerdicts));
  console.log('AI | epoka | kandydat | przydział        | powód');
  for (const x of r.rows) console.log('AI' + x.id + ' | ' + x.epoch + ' | ' + (x.candidate ? 'TAK' : 'nie') + ' | ' + x.assignment.padEnd(16) + ' | ' + (x.reason.join('; ') || '-'));
}

const TURN = 80;
const playerCapital = { q: 0, r: 0 };
const baseAi = () => [
  { id: 1, q: 4, r: 0, epoch: 2, eraEnterTurn: 40, pending: true },
  { id: 2, q: 9, r: 0, epoch: 2, eraEnterTurn: 40, pending: true },
  { id: 3, q: -10, r: 0, epoch: 2, eraEnterTurn: 40, pending: true },
  { id: 4, q: 30, r: 0, epoch: 2, eraEnterTurn: 40, pending: true },
  { id: 5, q: 33, r: 0, epoch: 2, eraEnterTurn: 40, pending: true },
  { id: 6, q: 60, r: 0, epoch: 1 },
];

// S0 kontrola: gracz w Brązie od 40, bez wojny wymuszonej -> AI1 (najbliższa) dostaje gracza.
{
  const r = runWave({ turn: TURN, playerCapital, ai: baseAi(), forcedPairs: [], counts: new Map() });
  print('S0 kontrola: gracz warless, nikt nie ma wojny', r);
  assert(r.playerInPool, 'S0: gracz w puli');
  assert(r.toPlayer.length === 1 && r.toPlayer[0].ownerId === 1 && r.toPlayer[0].era === 'bronze', 'S0: AI1 (najbliższa) wypowiada graczowi wojnę Brązu');
  assert(r.gateVerdicts[0].verdict === 'ok', 'S0: bramka licznika epoki ok');
}

// S1 (decyzja właściciela, opcja B): gracz ma trwającą wojnę Kamienia (AI6 -> gracz), jest w Brązie >= 20 tur,
// 5 AI w Brązie bez wojen -> gracz DOSTAJE parę Brązu; wojna Kamienia nie zajmuje „miejsca” Brązu.
{
  const forcedPairs = [{ attackerId: 6, targetId: 0, era: 'stone' }];
  const counts = new Map(); M.recordEraForcedWarParticipation(counts, 6, 0, 1, 1); // klucz 0:1
  const r = runWave({ turn: TURN, playerCapital, ai: baseAi(), forcedPairs, counts });
  print('S1: gracz ma wojnę Kamienia, 5 AI w Brązie >= 20 tur', r);
  assert(r.playerInPool, 'S1: gracz W puli mimo wojny Kamienia');
  assert(r.toPlayer.length === 1 && r.toPlayer[0].ownerId === 1 && r.toPlayer[0].era === 'bronze', 'S1: AI1 (najbliższa) wypowiada graczowi wojnę Brązu');
  assert(r.res.playerFirstPartnerId === 1, 'S1: tryb „gracz pierwszy” uruchomiony (partner AI1)');
  assert(r.gateVerdicts[0].verdict === 'ok', 'S1: bramka licznika epoki ok (Kamień 0:1 vs Brąz 0:2 — brak konfliktu)');
  assert(!r.playerExhausted, 'S1: licznik Brązu gracza (0:2) wolny po wojnie Kamienia (0:1)');
  assert(r.res.assignments.filter(x => x.targetId !== 0).length >= 2, 'S1: pozostałe AI parują się między sobą jak dotąd');
}

// S1b: jedna AI w Brązie + gracz w wojnie Kamienia -> gracz dostaje tę AI (wcześniej: unresolved).
{
  const forcedPairs = [{ attackerId: 6, targetId: 0, era: 'stone' }];
  const counts = new Map(); M.recordEraForcedWarParticipation(counts, 6, 0, 1, 1);
  const ai = baseAi().slice(0, 1).concat([{ id: 6, q: 60, r: 0, epoch: 1 }]);
  const r = runWave({ turn: TURN, playerCapital, ai, forcedPairs, counts });
  print('S1b: jedna AI w Brązie, gracz w wojnie Kamienia', r);
  assert(r.toPlayer.length === 1 && r.toPlayer[0].ownerId === 1, 'S1b: jedyna AI w Brązie dostaje parę z graczem');
  assert(!r.res.unresolvedOwnerIds.includes(1), 'S1b: AI1 nie jest już leftoverem');
}

// S1c: nieparzysta liczba AI (3) + gracz -> gracz-pierwszy bierze AI1, AI2<->AI3 para; nikt bez celu.
{
  const forcedPairs = [{ attackerId: 6, targetId: 0, era: 'stone' }];
  const counts = new Map(); M.recordEraForcedWarParticipation(counts, 6, 0, 1, 1);
  const ai = baseAi().slice(0, 3).concat([{ id: 6, q: 60, r: 0, epoch: 1 }]);
  const r = runWave({ turn: TURN, playerCapital, ai, forcedPairs, counts });
  print('S1c: 3 AI w Brązie + gracz w wojnie Kamienia', r);
  assert(r.toPlayer.length === 1 && r.toPlayer[0].ownerId === 1, 'S1c: AI1 -> gracz');
  assert(r.res.unresolvedOwnerIds.length === 0, 'S1c: brak unresolved');
}

// S-mixed (zarzut FC r1 nr 1+2): gracz w Brązie ma wojnę Kamienia (licznik 0:1); najbliższa AI to AI7 w Kamieniu
// (pending, q=1). Kandydat AI7 jest pomijany (slot 0:1 zajęty), partnerem gracza zostaje AI1 (Brąz) i wojna Brązu
// jest deklarowana (bramka ok). Bez filtru AI7 byłaby wybrana i odrzucana civ-cap-target w każdej turze.
{
  const forcedPairs = [{ attackerId: 6, targetId: 0, era: 'stone' }];
  const counts = new Map(); M.recordEraForcedWarParticipation(counts, 6, 0, 1, M.eraWarCounterEpoch(1, 2));
  const ai = baseAi().map(a => (a.id === 6 ? { ...a, q: 60 } : a)).concat([{ id: 7, q: 1, r: 0, epoch: 1, stonePending: true }]);
  const r = runWave({ turn: TURN, playerCapital, ai, forcedPairs, counts });
  print('S-mixed: gracz w Brązie z wojną Kamienia, najbliższa AI7 w Kamieniu', r);
  assert(r.playerInPool, 'S-mixed: gracz w puli');
  assert(!r.toPlayer.some(x => x.ownerId === 7), 'S-mixed: AI7 (Kamień, slot 0:1 zajęty) NIE jest partnerem gracza');
  assert(r.toPlayer.length === 1 && r.toPlayer[0].ownerId === 1 && r.toPlayer[0].era === 'bronze', 'S-mixed: partnerem gracza jest AI1 (Brąz), wojna Brązu');
  assert(r.gateVerdicts.every(g => g.verdict === 'ok'), 'S-mixed: bramka wypowiedzenia ok dla przydziałów na gracza (bez civ-cap-target)');
  assert(r.res.playerFirstPartnerId === 1, 'S-mixed: tryb „gracz pierwszy” wybiera AI1, nie AI7');
}

// S2: gracz BEZ wojny Kamienia (pokój) — jak dotąd.
{
  const r = runWave({ turn: TURN, playerCapital, ai: baseAi(), forcedPairs: [], counts: new Map() });
  print('S2: wojna Kamienia gracza zakończona; gracz warless', r);
  assert(r.playerInPool && r.toPlayer.length === 1 && r.toPlayer[0].ownerId === 1, 'S2: AI1 atakuje gracza');
}

// S2b: gracz ma już wojnę BRĄZU -> nie dostaje drugiej (licznik per (cywilizacja, epoka) = 1).
{
  const forcedPairs = [{ attackerId: 1, targetId: 0, era: 'bronze' }];
  const counts = new Map(); M.recordEraForcedWarParticipation(counts, 1, 0, 2, 2);
  const ai = baseAi().map(a => (a.id === 1 ? { ...a, pending: false } : a));
  const r = runWave({ turn: TURN, playerCapital, ai, forcedPairs, counts });
  print('S2b: gracz ma aktywną wojnę Brązu', r);
  assert(!r.playerInPool, 'S2b: gracz poza pulą (wojna Brązu zajmuje slot)');
  assert(r.toPlayer.length === 0, 'S2b: gracz nie dostaje drugiej wojny Brązu');
}

// S2c: gracz wszedł w Brąz < 20 tur temu -> nie w puli (jak AI).
{
  const forcedPairs = [{ attackerId: 6, targetId: 0, era: 'stone' }];
  const counts = new Map(); M.recordEraForcedWarParticipation(counts, 6, 0, 1, 1);
  const r = runWave({ turn: TURN, playerCapital, ai: baseAi(), forcedPairs, counts, playerEraEnterTurn: TURN - 19 });
  assert(!r.playerInPool && r.toPlayer.length === 0, 'S2c: 19 tur w Brązie -> brak puli');
  const r2 = runWave({ turn: TURN, playerCapital, ai: baseAi(), forcedPairs, counts, playerEraEnterTurn: TURN - 20 });
  assert(r2.playerInPool && r2.toPlayer.length === 1, 'S2c: dokładnie 20 tur -> w puli');
  const r3 = runWave({ turn: TURN, playerCapital, ai: baseAi(), forcedPairs, counts, playerEraEnterTurn: undefined });
  assert(r3.playerInPool, 'S2c: brak tury wejścia (stary zapis) -> próg pominięty jak dla AI');
}

// S2d: gracz w Kamieniu z wojną Kamienia — bez zmian (nie w puli).
{
  const forcedPairs = [{ attackerId: 6, targetId: 0, era: 'stone' }];
  const r = runWave({ turn: TURN, playerCapital, ai: baseAi(), forcedPairs, counts: new Map(), playerEra: 1 });
  assert(!r.playerInPool, 'S2d: gracz w Kamieniu z wojną Kamienia nadal poza pulą');
}

// S3 (H2): STARY ZAPIS bez warRulesEraWarCountByCiv — wojna Kamienia gracza będącego w Brązie.
{
  const active = [{ attackerId: 6, targetId: 0, tagEpoch: 1 }];
  const epochOf = (oid) => (oid === 0 ? 2 : oid === 6 ? 1 : 2);
  const isHumanOwner = (oid) => oid === 0;
  const counts = M.restoreEraWarCounts(undefined, active, epochOf, isHumanOwner);
  console.log('\n=== S3 (H2): stary zapis, rebuild licznika ===\nklucze: ' + JSON.stringify(Array.from(counts.keys()).sort()));
  assert(counts.get(M.eraWarCivKey(0, 1)) === 1 && counts.get(M.eraWarCivKey(0, 2)) === undefined, 'S3: wojna Kamienia gracza -> klucz 0:1 (nie 0:2)');
  assert(counts.get(M.eraWarCivKey(6, 1)) === 1, 'S3: AI6 -> 6:1 jak dotąd');
  const r = runWave({ turn: TURN, playerCapital, ai: baseAi(), forcedPairs: [{ attackerId: 6, targetId: 0, era: 'stone' }], counts });
  assert(!r.playerExhausted && r.toPlayer.length === 1, 'S3: po migracji gracz nie jest wyczerpany w Brązie i dostaje parę');
  const legacy = M.restoreEraWarCounts(undefined, [{ attackerId: 6, targetId: 0 }], epochOf);
  assert(legacy.get(M.eraWarCivKey(0, 2)) === 1, 'S3: bez wskazówek (stare wywołanie) klucz = bieżąca epoka (zgodność API)');
  const aiPair = M.restoreEraWarCounts(undefined, [{ attackerId: 6, targetId: 3, tagEpoch: 1 }], epochOf, isHumanOwner);
  assert(aiPair.get(M.eraWarCivKey(3, 2)) === 1, 'S3: AI zachowuje klucz bieżącej epoki (zmiana tylko dla gracza)');
}

// S3c: licznik w runtime — wojna Kamienia wobec gracza w Brązie liczy się pod 0:1.
{
  assert(M.eraWarCounterEpoch(M.forcedEraTagEpoch('stone'), 2) === 1, 'S3c: tag Kamień + epoka gracza 2 -> 1');
  assert(M.eraWarCounterEpoch(M.forcedEraTagEpoch('bronze'), 2) === 2, 'S3c: tag Brąz + epoka 2 -> 2');
  assert(M.eraWarCounterEpoch(undefined, 2) === 2, 'S3c: bez tagu -> bieżąca epoka');
  const counts = new Map();
  M.recordEraForcedWarParticipation(counts, 6, 0, 1, M.eraWarCounterEpoch(1, 2));
  const gateBronze = M.evaluateEraForcedWarGate({ multiwarEnabled: true, tag: 'bronze', declaredByTag: new Map(), counts, attackerId: 1, attackerEpoch: 2, targetId: 0, targetEpoch: M.eraWarCounterEpoch(2, 2) }, M.WAR_RULES_PARAMS);
  assert(gateBronze === 'ok', 'S3c: bramka Brązu wobec gracza ok po wojnie Kamienia');
  M.recordEraForcedWarParticipation(counts, 1, 0, 2, M.eraWarCounterEpoch(2, 2));
  const gateBronze2 = M.evaluateEraForcedWarGate({ multiwarEnabled: true, tag: 'bronze', declaredByTag: new Map(), counts, attackerId: 2, attackerEpoch: 2, targetId: 0, targetEpoch: 2 }, M.WAR_RULES_PARAMS);
  assert(gateBronze2 === 'civ-cap-target', 'S3c: druga wojna Brązu wobec gracza zablokowana licznikiem (1 na epokę)');
  assert(counts.get('0:1') === 1 && counts.get('0:2') === 1, 'S3c: klucze 0:1 i 0:2 po jednym wpisie');
}

// S4: powody odrzucenia AI (tabela) — gracz w wojnie Kamienia jest teraz w puli.
{
  const ai = [
    { id: 1, q: 4, r: 0, epoch: 2, eraEnterTurn: 70, pending: true },
    { id: 2, q: 9, r: 0, epoch: 2, eraEnterTurn: 40, pending: true, atOrdinaryWar: true },
    { id: 3, q: -10, r: 0, epoch: 2, eraEnterTurn: 40, pending: true, difficulty: 1 },
    { id: 4, q: 30, r: 0, epoch: 2, eraEnterTurn: 40, pending: false },
    { id: 5, q: 33, r: 0, epoch: 2, eraEnterTurn: 40, pending: true },
    { id: 6, q: 60, r: 0, epoch: 1 },
  ];
  const forcedPairs = [{ attackerId: 6, targetId: 0, era: 'stone' }];
  const counts = new Map(); M.recordEraForcedWarParticipation(counts, 6, 0, 1, 1);
  const r = runWave({ turn: TURN, playerCapital, ai, forcedPairs, counts });
  print('S4: tabela powodów odrzucenia (gracz w wojnie Kamienia)', r);
  assert(r.rows.find(x => x.id === 1).reason.some(s => s.includes('próg')), 'S4: AI1 odrzucona progiem 20 tur');
  assert(r.rows.find(x => x.id === 2).reason.some(s => s.includes('już w wojnie')), 'S4: AI2 odrzucona (już w wojnie)');
  assert(r.rows.find(x => x.id === 3).reason.some(s => s.includes('Łatwy')), 'S4: AI3 odrzucona (poziom Łatwy)');
  assert(r.rows.find(x => x.id === 5).candidate, 'S4: AI5 jest kandydatem');
}

// S2e: gdy gracz poza pulą (opcja OFF albo < 20 tur), pary AI<->AI niezależne od wojny Kamienia gracza.
{
  const withPlayerOff = runWave({ turn: TURN, playerCapital, ai: baseAi(), forcedPairs: [], counts: new Map(), playerEpochWarEnabled: false });
  const withBlockingStone = runWave({ turn: TURN, playerCapital, ai: baseAi(), forcedPairs: [{ attackerId: 6, targetId: 0, era: 'stone' }], counts: new Map(), playerEraEnterTurn: TURN - 5 });
  const norm = (r) => JSON.stringify(r.res.assignments.filter(x => x.targetId !== 0).map(x => [x.ownerId, x.targetId, x.era]));
  assert(norm(withPlayerOff) === norm(withBlockingStone), 'S2e: pary AI<->AI identyczne niezależnie od wojny Kamienia gracza');
}

// S5: gracz warless, ale WSZYSTKIE AI sojusznikami -> nikt nie ma jak wypowiedzieć (sojusz blokuje).
{
  const r = runWave({ turn: TURN, playerCapital, ai: baseAi(), forcedPairs: [], counts: new Map(), alliances: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]] });
  print('S5: gracz warless, sojusz formalny z każdą AI', r);
  assert(r.toPlayer.length === 0, 'S5: sojusz formalny blokuje wojnę epoki z graczem');
}

// S6: parametry z JSON (dowód wartości).
{
  const P = M.WAR_RULES_PARAMS;
  console.log('\nParametry: bronze start=' + P.eraForcedWarStartTurnsFromEra.bronze + ', maxEraForcedWarsPerCivPerEra=' + P.maxEraForcedWarsPerCivPerEra + ', maxConcurrentWarsFromBronze=' + P.maxConcurrentWarsFromBronze + ', maxEraForcedWarsPerEra=' + P.maxEraForcedWarsPerEra);
  assert(P.eraForcedWarStartTurnsFromEra.bronze === 20, 'S6: próg Brązu = 20');
  assert(P.maxEraForcedWarsPerCivPerEra === 1, 'S6: licznik per cywilizacja i epoka = 1');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
