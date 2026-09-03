'use strict';

/**
 * R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1 — test czystego kontraktu Kamienia.
 * Uruchamianie z gra/: node tools/forced-war-stone-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const entry = path.resolve(__dirname, '.forced-war-stone-entry.ts');
const bundle = path.resolve(__dirname, '.forced-war-stone-bundle.cjs');
fs.writeFileSync(entry, `
export {
  WOJNA_KAMIEN_WYMUSZONA_START_TURY,
  WOJNA_KAMIEN_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE,
  WOJNA_KAMIEN_WYMUSZONA_ODPOCZYNEK_TUR,
  WOJNA_KAMIEN_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR,
  WOJNA_KAMIEN_WYMUSZONA_MAX_CZAS_TRWANIA_TUR,
  isEligibleForStoneForcedWar,
  pickStoneForcedWarTargetId,
  pickStoneForcedWarTargetIdCoordinated,
  shouldEndStoneForcedWarByCityCount,
  shouldEndStoneForcedWarByDuration,
  isRestingFromStoneForcedWar,
  serializeStoneForcedWarState,
  restoreStoneForcedWarState,
} from ${JSON.stringify(GRA_ROOT + '/src/game/forced-war-stone')};
export { decideAIDiplomacy } from ${JSON.stringify(GRA_ROOT + '/src/game/ai')};
`, 'utf8');

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) passed++;
  else {
    failed++;
    console.error(`FAIL: ${message}`);
  }
}
function eq(actual, expected, message) {
  assert(actual === expected, `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}
function deepEq(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), message);
}

try {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: bundle,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
  const api = require(bundle);
  const {
    WOJNA_KAMIEN_WYMUSZONA_START_TURY: startTurn,
    WOJNA_KAMIEN_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE: cityLimit,
    WOJNA_KAMIEN_WYMUSZONA_ODPOCZYNEK_TUR: restTurns,
    WOJNA_KAMIEN_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR: cooldownTurns,
    WOJNA_KAMIEN_WYMUSZONA_MAX_CZAS_TRWANIA_TUR: maxDurationTurns,
    isEligibleForStoneForcedWar,
    pickStoneForcedWarTargetId,
    pickStoneForcedWarTargetIdCoordinated,
    shouldEndStoneForcedWarByCityCount,
    shouldEndStoneForcedWarByDuration,
    isRestingFromStoneForcedWar,
    serializeStoneForcedWarState,
    restoreStoneForcedWarState,
    decideAIDiplomacy,
  } = api;

  console.log('--- kontrakt Q1/Q3, R-WOJNA-WYMUSZONA-REGULY-Q1 Część A/C ---');
  eq(startTurn, 25, 'R-WOJNA-WYMUSZONA-REGULY-Q1 (Część A): start po 25 turach (podniesiony z 20)');
  eq(cityLimit, 2, 'pokój po 2 miastach');
  eq(restTurns, 20, 'odpoczynek 20 tur');
  eq(cooldownTurns, 20, 'cooldown tej samej cywilizacji 20 tur');
  eq(maxDurationTurns, 25, 'R-WOJNA-WYMUSZONA-REGULY-Q1 (Część C): limit czasu trwania pary = 25 tur');

  console.log('--- trigger po turn 25 i guardy ownera (R-WOJNA-WYMUSZONA-REGULY-Q1 Część A) ---');
  const eligibility = (currentTurn, overrides = {}) => isEligibleForStoneForcedWar({
    isMainAiCiv: true,
    isAlreadyAtWarAnyRole: false,
    currentTurn,
    isStoneEra: true,
    ...overrides,
  });
  assert(!eligibility(24), 'brak wojny przed turn 25');
  assert(eligibility(25), 'wojna dostępna od turn 25');
  assert(eligibility(26), 'wojna nadal dostępna po turn 25');
  assert(!eligibility(25, { isMainAiCiv: false }), 'brak dla player/miasta-państwa/barbarzyńcy');
  assert(!eligibility(25, { isAlreadyAtWarAnyRole: true }), 'brak dla ownera już w wojnie');
  assert(!eligibility(25, { isStoneEra: false }), 'brak dla ownera poza epoką Kamienia');

  console.log('--- R-WOJNA-WYMUSZONA-REGULY-Q1 (Część C): shouldEndStoneForcedWarByDuration ---');
  assert(!shouldEndStoneForcedWarByDuration(24, 0), 'tura 24, start 0 -> wojna trwa (< 25 tur)');
  assert(shouldEndStoneForcedWarByDuration(25, 0), 'tura 25, start 0 -> limit osiągnięty, koniec');
  assert(shouldEndStoneForcedWarByDuration(55, 30), 'tura 55, start 30 -> 25 tur, limit osiągnięty (>= wystarczy)');
  assert(!shouldEndStoneForcedWarByDuration(40, 30), 'tura 40, start 30 -> 10 tur, wojna trwa');
  assert(
    !shouldEndStoneForcedWarByDuration(500, undefined),
    'startTurn undefined (stary zapis) -> currentTurn - currentTurn === 0, NIGDY nie kończy samym tym wywołaniem',
  );

  console.log('--- target guard: najbliższy i wykluczenia ---');
  const distance = (aq, ar, bq, br) => (
    Math.abs(aq - bq) + Math.abs(aq - bq + ar - br) + Math.abs(ar - br)
  ) / 2;

  console.log('--- R-WOJNA-WYMUSZONA-REGULY-Q1 (Część B): pickStoneForcedWarTargetIdCoordinated ---');
  {
    const coordCandidates = [
      { ownerId: 0, q: 0, r: 0 },  // gracz — najbliżej
      { ownerId: 4, q: 5, r: 5 },  // AI wolny, dalej
      { ownerId: 6, q: 9, r: 9 },  // AI już w innej wojnie
    ];
    const refHex = { q: 0, r: 0 };
    eq(
      pickStoneForcedWarTargetIdCoordinated(coordCandidates, refHex, distance, {
        blockedOwnerIds: new Set(),
        candidatesAlreadyAtWarIds: new Set(),
        poziomTrudnosci: 2,
        playerActiveForcedWarCount: 0,
      }),
      0,
      'brak wykluczeń -> gracz najbliższy wygrywa normalnie (nie fallback)',
    );
    eq(
      pickStoneForcedWarTargetIdCoordinated(coordCandidates, refHex, distance, {
        blockedOwnerIds: new Set(),
        candidatesAlreadyAtWarIds: new Set([0, 4]),
        poziomTrudnosci: 2,
        playerActiveForcedWarCount: 0,
      }),
      6,
      'gracz i AI4 już w wojnie -> AI6 (jedyny wolny) wybrany normalnie',
    );
    eq(
      pickStoneForcedWarTargetIdCoordinated(coordCandidates, refHex, distance, {
        blockedOwnerIds: new Set(),
        candidatesAlreadyAtWarIds: new Set([0, 4, 6]),
        poziomTrudnosci: 2,
        playerActiveForcedWarCount: 0,
      }),
      0,
      'WSZYSCY kandydaci (w tym gracz) już w wojnie, Normalny, gracz BEZ aktywnej wojny wymuszonej -> fallback na gracza',
    );
    eq(
      pickStoneForcedWarTargetIdCoordinated(coordCandidates, refHex, distance, {
        blockedOwnerIds: new Set(),
        candidatesAlreadyAtWarIds: new Set([0, 4, 6]),
        poziomTrudnosci: 2,
        playerActiveForcedWarCount: 1,
      }),
      null,
      'Normalny, gracz JUŻ MA 1 aktywną wojnę wymuszoną -> fallback NIE aktywuje się, null',
    );
    eq(
      pickStoneForcedWarTargetIdCoordinated(coordCandidates, refHex, distance, {
        blockedOwnerIds: new Set(),
        candidatesAlreadyAtWarIds: new Set([0, 4, 6]),
        poziomTrudnosci: 3,
        playerActiveForcedWarCount: 3,
      }),
      0,
      'Trudny, gracz ma już 3 aktywne wojny wymuszone -> fallback NADAL działa (brak limitu)',
    );
    eq(
      pickStoneForcedWarTargetIdCoordinated(
        [{ ownerId: 4, q: 5, r: 5 }], refHex, distance,
        { blockedOwnerIds: new Set(), candidatesAlreadyAtWarIds: new Set([4]), poziomTrudnosci: 3, playerActiveForcedWarCount: 0 },
      ),
      null,
      'gracz w ogóle NIE JEST w oryginalnej puli kandydatów -> brak fallbacku mimo Trudnego',
    );
    eq(
      pickStoneForcedWarTargetIdCoordinated(coordCandidates, refHex, distance, {
        blockedOwnerIds: new Set([0]), // gracz zablokowany NAP/peaceLocked/sojuszem
        candidatesAlreadyAtWarIds: new Set([4, 6]),
        poziomTrudnosci: 3,
        playerActiveForcedWarCount: 0,
      }),
      null,
      'gracz zablokowany NAP/peaceLocked/sojuszem (nie tylko "już w wojnie") -> fallback go NIE ignoruje, null',
    );
  }

  const candidates = [
    { ownerId: 3, q: 8, r: 8 },
    { ownerId: 4, q: 1, r: 1 },
    { ownerId: 5, q: 2, r: 2 },
  ];
  eq(
    pickStoneForcedWarTargetId(candidates, { q: 0, r: 0 }, distance),
    4,
    'wybiera najbliższego sąsiada terytorialnego',
  );
  eq(
    pickStoneForcedWarTargetId(
      candidates,
      { q: 0, r: 0 },
      distance,
      { blockedOwnerIds: new Set([4]) },
    ),
    5,
    'NAP/blokada pokoju/sojusz z celem wyklucza najbliższego',
  );
  eq(
    pickStoneForcedWarTargetId(
      [{ ownerId: 8, q: 1, r: 1 }, { ownerId: 2, q: 1, r: 1 }],
      { q: 0, r: 0 },
      distance,
    ),
    2,
    'remis dystansu rozstrzyga niższy ownerId',
  );

  console.log('--- 2 miasta, odpoczynek i cooldown ---');
  assert(!shouldEndStoneForcedWarByCityCount(1, 1), '1 zdobyte i 1 utracone nie kończy wojny');
  assert(shouldEndStoneForcedWarByCityCount(2, 0), '2 zdobyte kończą wojnę pokojem');
  assert(shouldEndStoneForcedWarByCityCount(0, 2), '2 utracone kończą wojnę pokojem');
  assert(isRestingFromStoneForcedWar(100, 120), 'odpoczynek działa przed restUntil');
  assert(!isRestingFromStoneForcedWar(120, 120), 'odpoczynek kończy się na restUntil');
  eq(
    pickStoneForcedWarTargetId(
      [{ ownerId: 4, q: 1, r: 1 }, { ownerId: 5, q: 4, r: 4 }],
      { q: 0, r: 0 },
      distance,
      { blockedOwnerIds: new Set([4]) },
    ),
    5,
    'cooldown tej samej cywilizacji blokuje ponowny target',
  );

  console.log('--- decideAIDiplomacy: finalny target guard ---');
  const rel = {
    partnerId: '7',
    relation: { status: 'neutralny', zaufanie: 0, respekt: 50 },
    respektWzgledny: 0.5,
    stanWojny: false,
  };
  const stoneCommand = (extra = {}) => decideAIDiplomacy({
    myPlayerId: '1',
    relacje: [{ ...rel, ...extra }],
    agresja: 0.1,
    currentTurn: 20,
    stoneForceWarTargetId: 7,
  });
  assert(stoneCommand().some(c => c.type === 'wypowiedz_wojne'), 'Stone target generuje DOW');
  assert(!stoneCommand({ stanWojny: true }).some(c => c.type === 'wypowiedz_wojne'), 'target w wojnie blokuje DOW');
  assert(!stoneCommand({ peaceLocked: true }).some(c => c.type === 'wypowiedz_wojne'), 'peace lock blokuje DOW');
  assert(!stoneCommand({ hasNapTreaty: true }).some(c => c.type === 'wypowiedz_wojne'), 'NAP blokuje DOW');
  assert(!stoneCommand({ hasAllianceTreaty: true }).some(c => c.type === 'wypowiedz_wojne'), 'sojusz z celem blokuje DOW');

  console.log('--- save/load i mutacje stanu ---');
  const pending = new Set([2]);
  const cycle = new Set([2]);
  const restUntil = new Map([[2, 55]]);
  const active = new Map([
    ['2_7', { attackerId: 2, targetId: 7, capturedByAttacker: 1, capturedByDefender: 0 }],
  ]);
  const save = JSON.parse(JSON.stringify(
    serializeStoneForcedWarState(pending, cycle, restUntil, active),
  ));
  const loaded = restoreStoneForcedWarState(save);
  deepEq([...loaded.pendingOwners], [2], 'pending przetrwał save/load');
  deepEq([...loaded.cycleOwners], [2], 'cycle przetrwał save/load');
  deepEq([...loaded.restUntilByOwner.entries()], [[2, 55]], 'restUntil przetrwał save/load');
  deepEq(
    loaded.activeByPairKey.get('2_7'),
    { attackerId: 2, targetId: 7, capturedByAttacker: 1, capturedByDefender: 0 },
    'licznik aktywnej wojny przetrwał save/load',
  );
  loaded.activeByPairKey.get('2_7').capturedByAttacker++;
  loaded.pendingOwners.delete(2);
  loaded.restUntilByOwner.set(2, 75);
  assert(loaded.activeByPairKey.get('2_7').capturedByAttacker === 2, 'mutacja licznika działa');
  assert(!loaded.pendingOwners.has(2), 'mutacja pending działa');
  eq(loaded.restUntilByOwner.get(2), 75, 'mutacja odpoczynku działa');
  const oldSave = restoreStoneForcedWarState(undefined);
  eq(oldSave.pendingOwners.size, 0, 'stary save bez pól jest bezpieczny');

  console.log(`PASSED: ${passed} / FAILED: ${failed} / TOTAL: ${passed + failed}`);
  if (failed > 0) process.exitCode = 1;
} finally {
  for (const file of [entry, bundle]) {
    try { fs.unlinkSync(file); } catch {}
  }
}
