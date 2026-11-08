'use strict';
/**
 * era-war-bronze-player-target-test.cjs — R-WEB-ERA-WAR-BRONZE-NOT-DECLARED-DIAG-Q1 (diagnoza, bez zmian kodu gry).
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
  isInterCivWarOpenAtTurn, eraWarCivKey,
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
  const { turn, playerCapital, ai, forcedPairs, counts, alliances = [], playerEra = 2, playerEpochWarEnabled = true } = world;
  const forcedFlat = forcedPairs.map(p => ({ attackerId: p.attackerId, targetId: p.targetId }));
  const totalActive = (oid) => M.countActiveForcedWarsForOwner(oid, forcedFlat);
  const epochOf = (oid) => (oid === 0 ? playerEra : (ai.find(a => a.id === oid) || {}).epoch);
  const allied = (a, b) => alliances.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const rows = [];
  const subjects = [];
  for (const a of ai) {
    const row = { id: a.id, epoch: a.epoch, candidate: false, reason: [] };
    rows.push(row);
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
  if (turn >= 25 && totalActive(0) === 0 && playerEpochWarEnabled) { subjects.push({ ownerId: 0, q: playerCapital.q, r: playerCapital.r }); playerInPool = true; }
  const isEraWarExhausted = (oid) => !M.canCivJoinEraForcedWar(counts, oid, epochOf(oid), M.WAR_RULES_PARAMS);
  const pairBlocked = (a, b) => M.isWarTreatyBlocked({ eraWar: true, hasNap: false, peaceLocked: false, hasAlliance: allied(a, b) });
  const res = M.assignForcedWarPairings(
    subjects,
    forcedPairs.filter(p => p.targetId !== 0).map(p => ({ attackerId: p.attackerId, targetId: p.targetId, era: p.era })),
    {
      isPairBlocked: pairBlocked,
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: totalActive,
      isEraWarExhausted,
      playerFirst: {
        playerOwnerId: 0,
        isPlayerPairGateOpen: (aiId) => M.evaluateInterCivWarGate({
          turn, attackerEra: epochOf(aiId), attackerWarCount: (ai.find(a => a.id === aiId).atOrdinaryWar ? 1 : 0) + totalActive(aiId),
          eraTag: epochOf(aiId) === 1 ? 'stone' : epochOf(aiId) === 2 ? 'bronze' : 'iron', targetIsPlayer: true, targetEra: 0, targetWarCount: 0,
        }, M.WAR_RULES_PARAMS) === 'ok',
        candidates: ai.map(a => ({ ownerId: a.id, q: a.q, r: a.r, era: a.epoch === 1 ? 'stone' : a.epoch === 2 ? 'bronze' : 'iron' })),
      },
    },
  );
  // Gate wypowiedzenia (main.ts blok wypowiedz_wojne) dla przydziałów na gracza.
  const toPlayer = res.assignments.filter(x => x.targetId === 0);
  const gateVerdicts = toPlayer.map(x => ({ attacker: x.ownerId, verdict: M.evaluateEraForcedWarGate({
    multiwarEnabled: true, tag: x.era, declaredByTag: new Map(), counts, attackerId: x.ownerId, attackerEpoch: epochOf(x.ownerId), targetId: 0, targetEpoch: playerEra,
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

// S1 zgłoszenie właściciela: gracz ma trwającą wojnę epoki Kamienia (AI6 -> gracz).
{
  const forcedPairs = [{ attackerId: 6, targetId: 0, era: 'stone' }];
  const counts = new Map(); M.recordEraForcedWarParticipation(counts, 6, 0, 1, 1);
  const r = runWave({ turn: TURN, playerCapital, ai: baseAi(), forcedPairs, counts });
  print('S1: gracz ma aktywną wojnę Kamienia (AI6->gracz); AI1..5 w Brązie >=20 tur, bez wojen', r);
  assert(!r.playerInPool, 'S1: gracz NIE jest w puli (totalActiveForcedWarsByOwner(0)=1)');
  assert(r.toPlayer.length === 0, 'S1: żadna AI nie dostaje celu=gracz mimo spełnionego progu Brązu');
  assert(r.res.playerFirstPartnerId === null, 'S1: gałąź "gracz pierwszy" też nic nie daje (wymaga gracza w puli warless)');
  assert(r.rows.filter(x => x.candidate).length === 5, 'S1: 5 AI jest kandydatami-napastnikami');
  const aiToAi = r.res.assignments.filter(x => x.targetId !== 0).length;
  assert(aiToAi >= 4, 'S1: AI paruje się między sobą (AI<->AI), wojny wybuchają, tylko nie z graczem');
  assert(forcedPairs.every(p => p.targetId === 0), 'S1: para gracza nie trafia do puli "dołączania jako trzeci" (main.ts filtruje targetId!==0)');
}

// S1b: ta sama sytuacja, ale z 1 AI w Brązie -> leftover, a para gracza i tak nie jest dostępna do dołączenia.
{
  const forcedPairs = [{ attackerId: 6, targetId: 0, era: 'stone' }];
  const counts = new Map(); M.recordEraForcedWarParticipation(counts, 6, 0, 1, 1);
  const ai = baseAi().slice(0, 1).concat([{ id: 6, q: 60, r: 0, epoch: 1 }]);
  const r = runWave({ turn: TURN, playerCapital, ai, forcedPairs, counts });
  print('S1b: jedna AI w Brązie, gracz w wojnie Kamienia', r);
  assert(r.toPlayer.length === 0, 'S1b: AI1 nie wypowiada graczowi (gracz poza pulą), trafia do unresolved');
  assert(r.res.unresolvedOwnerIds.includes(1), 'S1b: AI1 = leftover/unresolved (brak pary do dołączenia)');
}

// S2: wojna Kamienia gracza zakończona pokojem, licznik z NOWEGO zapisu (klucz epoki wojny) -> gracz znów w puli.
{
  const counts = new Map(); M.recordEraForcedWarParticipation(counts, 6, 0, 1, 1);
  const r = runWave({ turn: TURN, playerCapital, ai: baseAi(), forcedPairs: [], counts });
  print('S2: wojna Kamienia gracza zakończona pokojem; licznik Brązu gracza = 0', r);
  assert(r.playerInPool && r.toPlayer.length === 1 && r.toPlayer[0].ownerId === 1, 'S2: po pokoju AI1 znów atakuje gracza');
}

// S3: STARY ZAPIS (bez warRulesEraWarCountByCiv) odtworzony z aktywnej wojny Kamienia gracza, gdy gracz jest w Brązie.
{
  const active = [{ attackerId: 6, targetId: 0 }];
  const epochOf = (oid) => (oid === 0 ? 2 : oid === 6 ? 1 : 2);
  const counts = M.restoreEraWarCounts(undefined, active, epochOf);
  const keys = Array.from(counts.keys()).sort();
  console.log('\n=== S3: stary zapis, rebuild licznika z aktywnej wojny Kamienia gracza (gracz w Brązie) ===\nklucze: ' + JSON.stringify(keys));
  assert(counts.get(M.eraWarCivKey(0, 2)) === 1, 'S3: rebuild przypisuje wojnę Kamienia graczowi do BIEŻĄCEJ epoki (0:2), nie epoki wojny (0:1)');
  assert(counts.get(M.eraWarCivKey(0, 1)) === undefined, 'S3: klucz epoki wojny (0:1) nie powstaje');
  // Wojna kończy się pokojem; licznik zostaje.
  const r = runWave({ turn: TURN, playerCapital, ai: baseAi(), forcedPairs: [], counts });
  print('S3b: po pokoju, licznik ze starego zapisu wciąż blokuje gracza w Brązie', r);
  assert(r.playerExhausted && r.toPlayer.length === 0, 'S3b: gracz wyczerpany w Brązie -> nikt nie wypowiada mu wojny Brązu (do wejścia w Żelazo)');
}

// S4: powody odrzucenia AI (tabela).
{
  const ai = [
    { id: 1, q: 4, r: 0, epoch: 2, eraEnterTurn: 70, pending: true },                    // 10 tur
    { id: 2, q: 9, r: 0, epoch: 2, eraEnterTurn: 40, pending: true, atOrdinaryWar: true }, // zwykła wojna
    { id: 3, q: -10, r: 0, epoch: 2, eraEnterTurn: 40, pending: true, difficulty: 1 },     // Łatwy
    { id: 4, q: 30, r: 0, epoch: 2, eraEnterTurn: 40, pending: false },                    // pending skonsumowany
    { id: 5, q: 33, r: 0, epoch: 2, eraEnterTurn: 40, pending: true },                     // kandydat
    { id: 6, q: 60, r: 0, epoch: 1 },                                                      // Kamień
  ];
  const forcedPairs = [{ attackerId: 6, targetId: 0, era: 'stone' }];
  const counts = new Map(); M.recordEraForcedWarParticipation(counts, 6, 0, 1, 1);
  const r = runWave({ turn: TURN, playerCapital, ai, forcedPairs, counts });
  print('S4: tabela powodów odrzucenia (gracz w wojnie Kamienia)', r);
  assert(r.rows.find(x => x.id === 1).reason.some(s => s.includes('próg')), 'S4: AI1 odrzucona progiem 20 tur');
  assert(r.rows.find(x => x.id === 2).reason.some(s => s.includes('już w wojnie')), 'S4: AI2 odrzucona (już w wojnie)');
  assert(r.rows.find(x => x.id === 3).reason.some(s => s.includes('Łatwy')), 'S4: AI3 odrzucona (poziom Łatwy)');
  assert(r.rows.find(x => x.id === 5).candidate, 'S4: AI5 jest kandydatem, ale gracz poza pulą -> unresolved/bez celu=gracz');
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
