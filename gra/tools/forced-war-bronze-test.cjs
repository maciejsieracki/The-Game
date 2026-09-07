'use strict';
/**
 * forced-war-bronze-test.cjs — R-EPOKA-BRAZU-WYMUSZONA-WOJNA (Maciej 2026-08-09, ECHO A
 * + doprecyzowanie, `dyspozycje/PYTANIA-OTWARTE.md`). RUNDA 2 (Evaluator FAIL runda 1,
 * 6 poprawek blokujących — B1/B3/B4/B5/B6 w tej rundzie, B2 CELOWO poza zakresem).
 * Run from gra/:  node tools/forced-war-bronze-test.cjs
 *
 * Pokrycie (a)-(g) ze zlecenia oryginalnego:
 *   T1 (a) awans do Brązu bez aktywnej wojny → wypowiedzenie wojny sąsiadowi
 *   T2 (b) awans do Brązu gdy już w wojnie (napastnik LUB obrońca) → brak nowej wymuszonej wojny
 *   T3 (c) po zdobyciu/utracie 2 miast → automatyczny pokój (próg)
 *   T4 (d) po pokoju, przed odpoczynkiem → brak nowego celu
 *   T5 (e) po odpoczynku, cooldown na tę samą cywilizację nadal działa (blockedOwnerIds)
 *   T6 (f) sojusz z trzecią, niepowiązaną cywilizacją PRZETRWA wypowiedzenie wojny wymuszonej
 *   T7 (g) miasto-państwo NIE podlega tej regule
 *   T8 nazwane stałe — wartości + łatwa lokalizacja cooldownu (robocze założenie)
 *   T9 pickBronzeForcedWarTargetId — wybór najbliższego + remis → niższy ownerId
 *
 * RUNDA 2 — poprawki blokujące z Evaluatora:
 *   T10 (B3) sojusz z SAMYM CELEM blokuje decideAIDiplomacy (hasAllianceTreaty=true)
 *   T11 (B5) roundtrip serializeBronzeForcedWarState → restoreBronzeForcedWarState,
 *       w tym wojna z NIEZEROWYM licznikiem miast (capturedByAttacker/capturedByDefender)
 *   T12 (B5) restore bez `saved` (stary zapis) → bezpieczny pusty stan, nie wyjątek
 *   T13 (B4, dowód na poziomie decyzji): eligibility NIE zależy od tego, czy poprzednia
 *       próba się powiodła — sama funkcja czysta jest bezstanowa i deterministyczna,
 *       więc "ponowna próba w kolejnej turze" jest kwestią main.ts (patrz
 *       forced-war-bronze-main-guard-test.cjs dla dowodu tekstowego na main.ts).
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[forced-war-bronze-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.forced-war-bronze-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.forced-war-bronze-bundle.cjs');

const ENTRY_TS = `
export {
  WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE,
  WOJNA_WYMUSZONA_ODPOCZYNEK_TUR,
  WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR,
  WOJNA_WYMUSZONA_START_TURY_OD_EPOKI,
  WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR,
  isEligibleForBronzeForcedWar,
  pickBronzeForcedWarTargetId,
  shouldEndBronzeForcedWarByCityCount,
  shouldEndBronzeForcedWarByDuration,
  isRestingFromBronzeForcedWar,
  serializeBronzeForcedWarState,
  restoreBronzeForcedWarState,
} from ${JSON.stringify(AI_SRC + '/game/forced-war-bronze')};
export { decideAIDiplomacy } from ${JSON.stringify(AI_SRC + '/game/ai')};
export { treatiesBrokenByWar, addTreaty } from ${JSON.stringify(AI_SRC + '/game/diplomacy-treaties')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[forced-war-bronze-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE,
  WOJNA_WYMUSZONA_ODPOCZYNEK_TUR,
  WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR,
  WOJNA_WYMUSZONA_START_TURY_OD_EPOKI,
  WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR,
  isEligibleForBronzeForcedWar,
  pickBronzeForcedWarTargetId,
  shouldEndBronzeForcedWarByCityCount,
  shouldEndBronzeForcedWarByDuration,
  isRestingFromBronzeForcedWar,
  serializeBronzeForcedWarState,
  restoreBronzeForcedWarState,
  decideAIDiplomacy,
  treatiesBrokenByWar,
  addTreaty,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
function deepEq(a, b, msg) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  assert(sa === sb, `${msg} (got ${sa}, want ${sb})`);
}

const hexDistance = (aq, ar, bq, br) => {
  const dq = aq - bq, dr = ar - br;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
};

console.log('--- T8: nazwane stałe (parametry) ---');
eq(WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE, 2, 'T8a: próg miast = 2');
eq(WOJNA_WYMUSZONA_ODPOCZYNEK_TUR, 20, 'T8b: odpoczynek = 20 tur');
eq(
  WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR, 20,
  'T8c: cooldown tej samej pary = 20 tur (ROBOCZE ZAŁOŻENIE, patrz PYTANIA-OTWARTE.md pkt 6 — '
  + 'zmień TĘ stałą w game/forced-war-bronze.ts, gdy Maciej poda właściwą liczbę)',
);

console.log('\n--- T1 (a): awans do Brązu bez aktywnej wojny → eligibility TRUE (bez pól tury -- pomija próg) ---');
assert(
  isEligibleForBronzeForcedWar({ isMainAiCiv: true, isAlreadyAtWarAnyRole: false }),
  'T1a: główna cywilizacja, brak wojny → eligible',
);

console.log('\n--- T2 (b): awans do Brązu gdy już w wojnie (obie role) → eligibility FALSE ---');
assert(
  !isEligibleForBronzeForcedWar({ isMainAiCiv: true, isAlreadyAtWarAnyRole: true }),
  'T2a: napastnik LUB obrońca (flaga zbiorcza any-role) → NIE eligible',
);

console.log('\n--- R-WOJNA-WYMUSZONA-REGULY-Q1 (Część A): próg 25 tur OD WEJŚCIA W BRĄZ ---');
eq(WOJNA_WYMUSZONA_START_TURY_OD_EPOKI, 25, 'stała progu = 25 tur');
assert(
  !isEligibleForBronzeForcedWar({
    isMainAiCiv: true, isAlreadyAtWarAnyRole: false, currentTurn: 124, eraEnterTurn: 100,
  }),
  'tura 124, wejście w Brąz w turze 100 → 24 tur < 25, NIE eligible',
);
assert(
  isEligibleForBronzeForcedWar({
    isMainAiCiv: true, isAlreadyAtWarAnyRole: false, currentTurn: 125, eraEnterTurn: 100,
  }),
  'tura 125, wejście w Brąz w turze 100 → dokładnie 25 tur, eligible',
);
assert(
  isEligibleForBronzeForcedWar({
    isMainAiCiv: true, isAlreadyAtWarAnyRole: false, currentTurn: 260, eraEnterTurn: 235,
  }),
  'cywilizacja, która weszła w Brąz PÓŹNIEJ (tura 235) → próg mierzony NIEZALEŻNIE od startu gry, 25 tur od TEJ tury wystarcza',
);
assert(
  !isEligibleForBronzeForcedWar({
    isMainAiCiv: true, isAlreadyAtWarAnyRole: false, currentTurn: 259, eraEnterTurn: 235,
  }),
  'ta sama cywilizacja tydzień wcześniej (259, 24 tur od 235) → jeszcze NIE eligible',
);
assert(
  isEligibleForBronzeForcedWar({
    isMainAiCiv: true, isAlreadyAtWarAnyRole: false, currentTurn: 50, eraEnterTurn: undefined,
  }),
  'eraEnterTurn undefined (stary zapis sprzed tej naprawy) → próg POMINIĘTY, eligible natychmiast (zero regresu na starych zapisach)',
);

console.log('\n--- R-WOJNA-WYMUSZONA-REGULY-Q1 (Część C): shouldEndBronzeForcedWarByDuration ---');
eq(WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR, 25, 'stała limitu czasu trwania pary = 25 tur');
assert(!shouldEndBronzeForcedWarByDuration(24, 0), 'tura 24, start 0 → wojna trwa (< 25 tur)');
assert(shouldEndBronzeForcedWarByDuration(25, 0), 'tura 25, start 0 → limit osiągnięty');
assert(shouldEndBronzeForcedWarByDuration(55, 30), 'tura 55, start 30 → 25 tur, limit osiągnięty');
assert(!shouldEndBronzeForcedWarByDuration(40, 30), 'tura 40, start 30 → 10 tur, wojna trwa');
assert(
  !shouldEndBronzeForcedWarByDuration(500, undefined),
  'startTurn undefined (stary zapis) → currentTurn - currentTurn === 0, NIGDY nie kończy samym tym wywołaniem',
);

// R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1: sekcja "pickBronzeForcedWarTargetIdCoordinated"
// USUNIĘTA -- funkcja zniknęła z forced-war-bronze.ts (main.ts woła teraz JEDNĄ wspólną
// procedurę, `assignForcedWarPairings` z forced-war-common.ts, dowiedzioną osobno w
// tools/wojna-wymuszona-parowanie-test.cjs). `pickBronzeForcedWarTargetId` (bez koordynacji,
// T9 niżej) zostaje NIETKNIĘTA -- to nadal prawdziwy rdzeń wyboru najbliższego kandydata,
// używany PRZEZ `assignForcedWarPairings`.

console.log('\n--- T9: pickBronzeForcedWarTargetId — najbliższy sąsiad terytorialny ---');
const candidates = [
  { ownerId: 2, q: 10, r: 10 },
  { ownerId: 3, q: 1, r: 1 },
  { ownerId: 4, q: 2, r: 2 },
];
eq(
  pickBronzeForcedWarTargetId(candidates, { q: 0, r: 0 }, hexDistance),
  3,
  'T9a: owner 3 najbliżej (0,0)',
);
eq(
  pickBronzeForcedWarTargetId([], { q: 0, r: 0 }, hexDistance),
  null,
  'T9b: brak kandydatów → null',
);
eq(
  pickBronzeForcedWarTargetId(
    candidates, { q: 0, r: 0 }, hexDistance, { blockedOwnerIds: new Set([3]) },
  ),
  4,
  'T9c: owner 3 zablokowany (np. NAP) → wybiera kolejnego najbliższego (4)',
);
const tied = [{ ownerId: 5, q: 1, r: 1 }, { ownerId: 2, q: 1, r: 1 }];
eq(
  pickBronzeForcedWarTargetId(tied, { q: 0, r: 0 }, hexDistance),
  2,
  'T9d: remis dystansu → niższy ownerId wygrywa (deterministyczne)',
);

console.log('\n--- T3 (c): próg 2 miast zdobytych/straconych → automatyczny pokój ---');
assert(!shouldEndBronzeForcedWarByCityCount(0, 0), 'T3a: 0/0 → wojna trwa');
assert(!shouldEndBronzeForcedWarByCityCount(1, 1), 'T3b: 1/1 → wojna trwa (próg nieosiągnięty)');
assert(shouldEndBronzeForcedWarByCityCount(2, 0), 'T3c: napastnik zdobył 2 → koniec (pokój)');
assert(shouldEndBronzeForcedWarByCityCount(0, 2), 'T3d: napastnik stracił 2 (obrońca zdobył 2) → koniec');
assert(shouldEndBronzeForcedWarByCityCount(2, 2), 'T3e: oba jednocześnie osiągają próg → koniec');

console.log('\n--- T4 (d): odpoczynek po pokoju blokuje szukanie nowego celu ---');
assert(isRestingFromBronzeForcedWar(105, 120), 'T4a: tura 105 < restUntil 120 → odpoczywa');
assert(!isRestingFromBronzeForcedWar(120, 120), 'T4b: tura 120 (włącznie) → koniec odpoczynku');
assert(!isRestingFromBronzeForcedWar(121, 120), 'T4c: tura 121 > 120 → koniec odpoczynku');
assert(!isRestingFromBronzeForcedWar(50, undefined), 'T4d: brak wpisu restUntil → nigdy nie odpoczywa');

console.log('\n--- T5 (e): po odpoczynku, cooldown NA TĘ SAMĄ cywilizację nadal blokuje wybór ---');
// Symulacja: main.ts przekazuje blockedOwnerIds = kandydaci z isPeaceLockedBetween(...)===true
// (peaceLock ustawiony finalizePeaceTreatyBetween z WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR
// po poprzedniej wojnie wymuszonej z tą samą parą) — poprzedni cel (ownerId 3) musi zostać pominięty
// mimo że jest teraz najbliższy, a wybrany zostaje kolejny kandydat.
const afterRestCandidates = [
  { ownerId: 3, q: 0, r: 1 },   // poprzedni cel wojny wymuszonej — nadal w cooldownie
  { ownerId: 6, q: 5, r: 5 },   // nowy, dalszy sąsiad — wolny
];
eq(
  pickBronzeForcedWarTargetId(
    afterRestCandidates, { q: 0, r: 0 }, hexDistance, { blockedOwnerIds: new Set([3]) },
  ),
  6,
  'T5a: owner 3 (poprzedni cel) w cooldownie mimo bliskości → wybór spada na 6',
);

console.log('\n--- T6 (f): sojusz z trzecią, niepowiązaną cywilizacją PRZETRWA wojnę wymuszoną ---');
// Ta sama funkcja (treatiesBrokenByWar), której main.ts używa dla KAŻDEJ wojny (breakTreatiesOnWar) —
// weryfikujemy, że zrywa TYLKO traktaty między stronami wojny, nigdy z trzecią cywilizacją.
let deals = addTreaty([], { id: 'nap_forced', rodzaj: 'pakt_nieagresji', strony: [1, 2], wygasaTura: null });
deals = addTreaty(deals, { id: 'sojusz_trzecia', rodzaj: 'sojusz_pelny', strony: [1, 9], wygasaTura: null });
const broken = treatiesBrokenByWar(deals, 1, 2);
assert(broken.includes('nap_forced'), 'T6a: NAP MIĘDZY stronami wojny (1,2) zerwany');
assert(!broken.includes('sojusz_trzecia'), 'T6b: sojusz z NIEPOWIĄZANĄ cywilizacją (1,9) NIE zerwany');

console.log('\n--- T7 (g): miasto-państwo NIE podlega regule wymuszonej wojny Brązu ---');
assert(
  !isEligibleForBronzeForcedWar({ isMainAiCiv: false, isAlreadyAtWarAnyRole: false }),
  'T7a: isMainAiCiv=false (miasto-państwo) → NIE eligible mimo braku wojny',
);

console.log('\n--- decideAIDiplomacy: bronzeForceWarTargetId (analogicznie clusterForceWarTargetId) ---');
const relStub = {
  partnerId: '7',
  relation: { status: 'neutralny', zaufanie: 0, respekt: 50 },
  respektWzgledny: 0.5,
  stanWojny: false,
};
const dipCmds = decideAIDiplomacy({
  myPlayerId: '1',
  relacje: [relStub],
  agresja: 0.1,
  currentTurn: 40,
  bronzeForceWarTargetId: 7,
});
assert(dipCmds.length === 1 && dipCmds[0].type === 'wypowiedz_wojne', 'DA1: wymuszona wojna wypowiedziana');
eq(dipCmds[0].targetId, '7', 'DA2: cel = owner 7');

const dipNoForceAtWar = decideAIDiplomacy({
  myPlayerId: '1',
  relacje: [{ ...relStub, stanWojny: true }],
  agresja: 0.1,
  currentTurn: 40,
  bronzeForceWarTargetId: 7,
});
assert(
  !dipNoForceAtWar.some(c => c.type === 'wypowiedz_wojne'),
  'DA3: relacja już stanWojny=true → brak (dodatkowej) komendy wojny',
);

const dipNoForcePeaceLocked = decideAIDiplomacy({
  myPlayerId: '1',
  relacje: [{ ...relStub, peaceLocked: true }],
  agresja: 0.1,
  currentTurn: 40,
  bronzeForceWarTargetId: 7,
});
assert(
  !dipNoForcePeaceLocked.some(c => c.type === 'wypowiedz_wojne'),
  'DA4: peaceLocked (cooldown) → brak wymuszonej wojny',
);

const dipNoForceNap = decideAIDiplomacy({
  myPlayerId: '1',
  relacje: [{ ...relStub, hasNapTreaty: true }],
  agresja: 0.1,
  currentTurn: 40,
  bronzeForceWarTargetId: 7,
});
assert(
  !dipNoForceNap.some(c => c.type === 'wypowiedz_wojne'),
  'DA5: pakt nieagresji z celem → brak wymuszonej wojny',
);

console.log('\n--- T10 (B3, runda 2): sojusz z SAMYM CELEM blokuje decideAIDiplomacy ---');
const dipNoForceAlliance = decideAIDiplomacy({
  myPlayerId: '1',
  relacje: [{ ...relStub, hasAllianceTreaty: true }],
  agresja: 0.1,
  currentTurn: 40,
  bronzeForceWarTargetId: 7,
});
assert(
  !dipNoForceAlliance.some(c => c.type === 'wypowiedz_wojne'),
  'T10a: hasAllianceTreaty=true z celem → brak wymuszonej wojny (nie zrywamy własnych sojuszy)',
);
const dipForceNoAlliance = decideAIDiplomacy({
  myPlayerId: '1',
  relacje: [{ ...relStub, hasAllianceTreaty: false }],
  agresja: 0.1,
  currentTurn: 40,
  bronzeForceWarTargetId: 7,
});
assert(
  dipForceNoAlliance.length === 1 && dipForceNoAlliance[0].type === 'wypowiedz_wojne',
  'T10b: hasAllianceTreaty=false (jawnie) → wymuszona wojna wypowiedziana normalnie',
);
const dipForceAllianceUndefined = decideAIDiplomacy({
  myPlayerId: '1',
  relacje: [relStub], // hasAllianceTreaty nieustawione (undefined) — jak w starym kodzie/testach
  agresja: 0.1,
  currentTurn: 40,
  bronzeForceWarTargetId: 7,
});
assert(
  dipForceAllianceUndefined.length === 1 && dipForceAllianceUndefined[0].type === 'wypowiedz_wojne',
  'T10c: hasAllianceTreaty nieustawione (undefined) → domyślnie brak sojuszu, wojna wypowiedziana',
);

console.log('\n--- T11 (B5, runda 2): roundtrip serialize→restore, w tym wojna z aktywnym licznikiem ---');
const pendingIn = new Set([2, 5]);
const cycleIn = new Set([2, 9]);
const restUntilIn = new Map([[2, 145], [9, 88]]);
// "trwająca wojna z aktywnym licznikiem miast" — capturedByAttacker/capturedByDefender != 0.
const activeIn = new Map([
  ['1_3', { attackerId: 1, targetId: 3, capturedByAttacker: 1, capturedByDefender: 0 }],
  ['2_9', { attackerId: 9, targetId: 2, capturedByAttacker: 0, capturedByDefender: 1 }],
]);
const serialized = serializeBronzeForcedWarState(pendingIn, cycleIn, restUntilIn, activeIn);
assert(Array.isArray(serialized.pendingOwners), 'T11a: pendingOwners jest tablicą (gotowe pod JSON)');
assert(Array.isArray(serialized.activeByPairKey), 'T11b: activeByPairKey jest tablicą par [klucz, stan]');
// JSON round-trip prawdziwy (jak przy save do localStorage/pliku) — nie tylko referencja w pamięci.
const throughJson = JSON.parse(JSON.stringify(serialized));
const restored = restoreBronzeForcedWarState(throughJson);
deepEq(Array.from(restored.pendingOwners).sort(), Array.from(pendingIn).sort(), 'T11c: pendingOwners przetrwał JSON roundtrip');
deepEq(Array.from(restored.cycleOwners).sort(), Array.from(cycleIn).sort(), 'T11d: cycleOwners przetrwał JSON roundtrip');
deepEq(
  Array.from(restored.restUntilByOwner.entries()).sort(),
  Array.from(restUntilIn.entries()).sort(),
  'T11e: restUntilByOwner przetrwał JSON roundtrip',
);
const restoredPair13 = restored.activeByPairKey.get('1_3');
deepEq(restoredPair13, activeIn.get('1_3'), 'T11f: wojna 1↔3 z licznikiem capturedByAttacker=1 przetrwała roundtrip nietknięta');
const restoredPair29 = restored.activeByPairKey.get('2_9');
deepEq(restoredPair29, activeIn.get('2_9'), 'T11g: wojna 2↔9 z licznikiem capturedByDefender=1 przetrwała roundtrip nietknięta');
eq(restored.activeByPairKey.size, 2, 'T11h: dokładnie 2 aktywne wojny po roundtripie (bez duplikatów/gubienia)');

console.log('\n--- T12 (B5, runda 2): restore bez `saved` (stary zapis sprzed tej naprawy) ---');
const restoredEmpty = restoreBronzeForcedWarState(undefined);
eq(restoredEmpty.pendingOwners.size, 0, 'T12a: brak saved → pendingOwners pusty, nie wyjątek');
eq(restoredEmpty.cycleOwners.size, 0, 'T12b: brak saved → cycleOwners pusty');
eq(restoredEmpty.restUntilByOwner.size, 0, 'T12c: brak saved → restUntilByOwner pusty');
eq(restoredEmpty.activeByPairKey.size, 0, 'T12d: brak saved → activeByPairKey pusty');
const restoredPartial = restoreBronzeForcedWarState({ pendingOwners: [4] });
eq(restoredPartial.pendingOwners.size, 1, 'T12e: częściowy saved (tylko pendingOwners) → to pole odtworzone');
eq(restoredPartial.cycleOwners.size, 0, 'T12f: częściowy saved → pola BEZ danych bezpiecznie puste, nie wyjątek');

console.log('\n' + '='.repeat(60));
console.log(`PASSED: ${passed} / FAILED: ${failed} / TOTAL: ${passed + failed}`);
if (failed > 0) {
  console.log('SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('ALL GREEN');
}
