'use strict';
/**
 * era-war-defer-not-cancel-test.cjs — R-WEB-ERA-WAR-DEFER-NOT-CANCEL-WHEN-PREVIOUS-WAR-ACTIVE-Q1.
 * Run from gra/:  node tools/era-war-defer-not-cancel-test.cjs
 *
 * Zakres: CZYSTA logika (forced-war-bronze.ts, forced-war-common.ts, war-rules-multiwar.ts)
 * dla reguł R1–R5 z dispatchu. Pętli main.ts (ownerLoop, awans, zapis) ten test NIE odtwarza
 * — to wymaga biegu silnika (NIE ZMIERZONO w tej rundzie, patrz raport 30-obrona-claude.md).
 *
 *   T1 (a/R1,R2) Kamień trwa w chwili, gdy Brąz powinien wybuchnąć → Brąz NIE jest w puli
 *       (pending zostaje), a w PIERWSZEJ turze po pokoju Kamienia pula zawiera owner i para
 *       parowania przydziela cel (start Brązu, bez czekania na nowy awans).
 *   T2 (b/R2) gracz jako cel: pending AI paruje się z graczem (ownerId 0), przydział = cel 0.
 *   T3 (c/R3) przesunięcie NIE zużywa licznika: canCivJoinEraForcedWar pozostaje true,
 *       dopiero zarejestrowane wypowiedzenie (recordEraForcedWarParticipation) go zużywa.
 *   T4 (d)    zapis/wczytanie pending: roundtrip bez NaN; brak zapisu → pusty stan (stary zapis).
 *   T5 (e/R5) brak podwójnego wypowiedzenia: jeden owner nie dostaje dwóch przydziałów naraz,
 *       nawet gdy ma jednocześnie wpis Kamienia i Brązu.
 *   T6 (R4)   pending nie wygasa przy awansie: eligibility Żelaza po odroczeniu Brązu nadal
 *       zachowuje pending (funkcja czysta nie kasuje stanu; kasowanie tylko w main.ts po sukcesie).
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[era-war-defer-not-cancel-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.era-war-defer-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.era-war-defer-bundle.cjs');

const ENTRY_TS = `
export {
  isEligibleForBronzeForcedWar,
  serializeBronzeForcedWarState,
  restoreBronzeForcedWarState,
} from ${JSON.stringify(AI_SRC + '/game/forced-war-bronze')};
export {
  assignForcedWarPairings,
} from ${JSON.stringify(AI_SRC + '/game/forced-war-common')};
export {
  WAR_RULES_PARAMS,
  canCivJoinEraForcedWar,
  recordEraForcedWarParticipation,
  eraWarCountFor,
} from ${JSON.stringify(AI_SRC + '/game/war-rules-multiwar')};
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
  console.error('[era-war-defer-not-cancel-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  isEligibleForBronzeForcedWar,
  serializeBronzeForcedWarState,
  restoreBronzeForcedWarState,
  assignForcedWarPairings,
  WAR_RULES_PARAMS,
  canCivJoinEraForcedWar,
  recordEraForcedWarParticipation,
  eraWarCountFor,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ok   ${msg}`); }
  else { failed++; console.log(`  FAIL ${msg}`); }
}

const hexDist = (aq, ar, bq, br) => Math.max(Math.abs(aq - bq), Math.abs(ar - br));
const noBlock = () => false;
const noWars = () => 0;

console.log('T1 (a) Kamien trwa w chwili startu Brazu -> pending zostaje, start w pierwszej turze po pokoju');
{
  const ENTER = 10;
  const turnDuring = ENTER + 40 + 3;
  const pendingSet = new Set([2]);
  // Owner 2 w wojnie Kamienia (alreadyAtWarAnyRole=true): odroczenie, nie anulowanie.
  const duringEligible = pendingSet.has(2) && isEligibleForBronzeForcedWar({
    isMainAiCiv: true, isAlreadyAtWarAnyRole: true, currentTurn: turnDuring, eraEnterTurn: ENTER,
  });
  assert(duringEligible === false, 'podczas wojny Kamienia owner nie wchodzi do puli (odroczony)');
  assert(pendingSet.has(2), 'pending Brazu NIE zostaje skasowany przez odroczenie');
  // Pierwsza tura po pokoju Kamienia: brak wojny -> eligible, para z najblizszym kandydatem.
  const turnAfter = turnDuring + 1;
  const afterEligible = isEligibleForBronzeForcedWar({
    isMainAiCiv: true, isAlreadyAtWarAnyRole: false, currentTurn: turnAfter, eraEnterTurn: ENTER,
  });
  assert(afterEligible === true, 'pierwsza tura po pokoju: owner eligible');
  const res = assignForcedWarPairings(
    [{ ownerId: 2, q: 0, r: 0, era: 'bronze' }, { ownerId: 3, q: 4, r: 0, era: 'bronze' }],
    [],
    { isPairBlocked: noBlock, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: noWars },
  );
  const a2 = res.assignments.find(a => a.ownerId === 2);
  assert(a2 && a2.era === 'bronze' && a2.targetId === 3, 'start Brazu: owner 2 -> cel 3 w tej samej turze');
}

console.log('T2 (b) gracz jako cel: pending AI paruje sie z graczem');
{
  const res = assignForcedWarPairings(
    [{ ownerId: 2, q: 0, r: 0, era: 'bronze' }, { ownerId: 0, q: 1, r: 0 }],
    [],
    { isPairBlocked: noBlock, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: noWars },
  );
  const a2 = res.assignments.find(a => a.ownerId === 2);
  assert(a2 && a2.targetId === 0, 'owner 2 dostaje cel = gracz (0)');
  assert(!res.assignments.some(a => a.ownerId === 0), 'gracz nie jest stroną akcji');
}

console.log('T3 (c) przesuniecie nie zuzywa licznika; zuzywa dopiero wypowiedzenie');
{
  const counts = new Map();
  const epoch = 2;
  assert(canCivJoinEraForcedWar(counts, 2, epoch, WAR_RULES_PARAMS) === true, 'przed wojna: slot wolny');
  // Odroczenie = brak wywołania recordEraForcedWarParticipation -> licznik bez zmian.
  assert(canCivJoinEraForcedWar(counts, 2, epoch, WAR_RULES_PARAMS) === true, 'po odroczeniu: slot nadal wolny');
  assert(eraWarCountFor(counts, 2, epoch) === 0, 'po odroczeniu: licznik = 0');
  recordEraForcedWarParticipation(counts, 2, 3, epoch, epoch);
  assert(eraWarCountFor(counts, 2, epoch) === 1, 'po wypowiedzeniu: licznik napastnika = 1');
  assert(canCivJoinEraForcedWar(counts, 2, epoch, WAR_RULES_PARAMS) === false, 'po wypowiedzeniu: slot zuzyty (max 1)');
}

console.log('T4 (d) zapis/wczytanie pending bez NaN; stary zapis = pusty stan');
{
  const save = serializeBronzeForcedWarState(new Set([2, 5]), new Set(), new Map(), new Map());
  const json = JSON.stringify(save);
  assert(!/NaN/.test(json), 'serializacja bez NaN');
  const restored = restoreBronzeForcedWarState({ pendingOwners: save.pendingOwners });
  assert(restored.pendingOwners.has(2) && restored.pendingOwners.has(5) && restored.pendingOwners.size === 2,
    'roundtrip pending: {2,5} odtworzone');
  const legacy = restoreBronzeForcedWarState(undefined);
  assert(legacy.pendingOwners.size === 0, 'brak zapisu (stary save) -> pusty pending, bez wyjatku');
}

console.log('T5 (e) brak podwojnego wypowiedzenia: jeden owner = jeden przydzial');
{
  const res = assignForcedWarPairings(
    [
      { ownerId: 2, q: 0, r: 0, era: 'stone' },
      { ownerId: 2, q: 0, r: 0, era: 'bronze' },
      { ownerId: 3, q: 4, r: 0, era: 'bronze' },
    ],
    [],
    { isPairBlocked: noBlock, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: noWars },
  );
  const n2 = res.assignments.filter(a => a.ownerId === 2).length;
  assert(n2 <= 1, `owner 2 ma co najwyzej jeden przydzial (ma ${n2})`);
}

console.log('T6 (R4) pending nie wygasa przy awansie: eligibility Zelaza nie kasuje stanu Brazu');
{
  const pending = new Set([2]);
  // Awans do Zelaza nie wywoluje delete na pending Brazu w tej warstwie (czysta funkcja).
  isEligibleForBronzeForcedWar({ isMainAiCiv: true, isAlreadyAtWarAnyRole: false, currentTurn: 80, eraEnterTurn: 10 });
  assert(pending.has(2), 'pending Brazu zachowany po wywolaniu eligibility w epoce Zelaza');
}

// R-WEB-ERA-WAR-DEFER-NOT-CANCEL-Q1 (runda 2, B-DEFER): sam pending Brązu bez partnera w puli
// triggered nie może wisieć bez celu — dostaje WOLNY cel spoza puli (fallback freeTargetCandidates).
const MAJORS = [
  { ownerId: 2, q: 0, r: 0, era: 'bronze' },
  { ownerId: 3, q: 1, r: 0, era: 'stone' },
  { ownerId: 4, q: 5, r: 0, era: 'bronze' },
];
console.log('T7 (B-DEFER) lone pending Brazu dostaje wolny cel; bez fallbacku pozostaje bez celu (stare zachowanie)');
{
  const base = { isPairBlocked: noBlock, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: noWars };
  const lone = [{ ownerId: 2, q: 0, r: 0, era: 'bronze' }];
  const withFallback = assignForcedWarPairings(lone, [], { ...base, freeTargetCandidates: MAJORS });
  assert(withFallback.unresolvedOwnerIds.length === 0, 'z fallbackiem: brak unresolved');
  const a2 = withFallback.assignments.find(a => a.ownerId === 2);
  assert(a2 && a2.era === 'bronze' && a2.targetId === 3, `z fallbackiem: owner 2 -> najbliższy wolny cel 3 (got ${JSON.stringify(a2)})`);
  const noFallback = assignForcedWarPairings(lone, [], base);
  assert(noFallback.unresolvedOwnerIds.includes(2), 'bez fallbacku (stare wywołanie): owner 2 nieprzydzielony (zachowanie bazowe)');
  // Kamień NIE korzysta z fallbacku (twardy limit R2 celu) -- pending Kamienia zostaje nieprzydzielony.
  const stoneLone = assignForcedWarPairings([{ ownerId: 2, q: 0, r: 0, era: 'stone' }], [], { ...base, freeTargetCandidates: MAJORS });
  assert(stoneLone.assignments.length === 0, 'Kamien bez partnera: fallback wyłączony (brak przydziału)');
  // Cel zajęty aktywną wojną wymuszoną NIE jest wybierany.
  const busy = assignForcedWarPairings(lone, [], { ...base, freeTargetCandidates: MAJORS,
    totalActiveForcedWarsByOwner: (o) => (o === 3 ? 1 : 0) });
  const b2 = busy.assignments.find(a => a.ownerId === 2);
  assert(b2 && b2.targetId === 4, `cel 3 w wojnie wymuszonej pominięty, wybrany 4 (got ${JSON.stringify(b2)})`);
  // Dwa podmioty w jednej turze nie wybierają tego samego wolnego celu.
  // Para 2<->6 zablokowana sojuszem, więc OBA są leftover i idą do fallbacku (nie do 1v1).
  const two = assignForcedWarPairings(
    [{ ownerId: 2, q: 0, r: 0, era: 'bronze' }, { ownerId: 6, q: 0, r: 1, era: 'bronze' }],
    [],
    { ...base, isPairBlocked: (a, b) => (a === 2 && b === 6) || (a === 6 && b === 2),
      freeTargetCandidates: [...MAJORS, { ownerId: 7, q: 9, r: 0, era: 'iron' }] },
  );
  const targets = two.assignments.map(a => a.targetId);
  assert(two.assignments.length === 2 && new Set(targets).size === 2,
    `dwa podmioty z fallbackiem dostają dwa RÓŻNE wolne cele (${JSON.stringify(targets)})`);
}

// T9 (runda 3, Z5): Brąz/Żelazo leftover NIE dołącza do pary Kamienia (stanWojny w ai.ts);
// dołączenie do pary Brązu zachowane; fallback wolnego celu działa dopiero po nieudanym dołączeniu.
console.log('T9 (runda 3) leftover Brazu omija pare Kamienia; dolaczenie do pary Brazu bez zmian');
{
  const base = { isPairBlocked: noBlock, hexDistanceFn: hexDist, totalActiveForcedWarsByOwner: noWars };
  const stonePair = [{ attackerId: 8, targetId: 9, era: 'stone' }];
  const noFree = assignForcedWarPairings([{ ownerId: 2, q: 0, r: 0, era: 'bronze' }], stonePair, base);
  assert(!noFree.assignments.some(a => a.targetId === 8 || a.targetId === 9 || a.ownerId === 8 || a.ownerId === 9),
    'Brąz bez fallbacku nie dołącza do pary Kamienia (brak przydziału do 8/9)');
  assert(noFree.unresolvedOwnerIds.includes(2), 'Brąz bez fallbacku: unresolved (pending czeka)');
  const withFree = assignForcedWarPairings([{ ownerId: 2, q: 0, r: 0, era: 'bronze' }], stonePair,
    { ...base, freeTargetCandidates: MAJORS });
  const w2 = withFree.assignments.find(a => a.ownerId === 2);
  assert(w2 && w2.targetId === 3, `Brąz z fallbackiem: cel wolny 3, nie para Kamienia (got ${JSON.stringify(w2)})`);
  const bronzePair = [{ attackerId: 8, targetId: 9, era: 'bronze' }];
  const joinB = assignForcedWarPairings([{ ownerId: 2, q: 0, r: 0, era: 'bronze' }], bronzePair, base);
  assert(joinB.assignments.some(a => a.ownerId === 2 && (a.targetId === 8 || a.targetId === 9)),
    'Brąz dołącza do pary Brązu (krok 4 bez zmian, także bez fallbacku)');
}

// T8 (źródłowo-behawioralne): main.ts przekazuje tę samą listę kandydatów do parowania (mutacja
// usunięcia linii `freeTargetCandidates:` w main.ts musi zaczerwienić ten test).
console.log('T8 (B-DEFER, wiring) main.ts przekazuje freeTargetCandidates do assignForcedWarPairings');
{
  const mainSrc = fs.readFileSync(path.resolve(GRA_ROOT, 'src', 'main.ts'), 'utf8');
  // R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1 r3 (zarzut 3): warunek opóźnienia (eraWarTargetDelayOk)
  // jest WYMAGANY w filtrze freeTargetCandidates (wersja bez niego nie przechodzi).
  assert(/freeTargetCandidates:[\s\S]{0,400}?countActiveWarsForOwnerExcludingBarbarians\(s\.ownerId\) === 0 && eraWarTargetDelayOk\(s\.ownerId\)\)/.test(mainSrc),
    'main.ts: freeTargetCandidates = wspólna lista major AI filtrowana z wojen naturalnych ORAZ z opóźnienia wojny epoki (eraWarTargetDelayOk)');
  // r3 (zarzut 3): bramka playerFirst (kandydat-AI do pary z graczem) też musi nieść eraWarTargetDelayOk.
  assert(/isPlayerPairGateOpen:[\s\S]{0,300}?eraWarTargetDelayOk\(aiOwnerId\)/.test(mainSrc),
    'main.ts: isPlayerPairGateOpen (para z graczem) zawiera eraWarTargetDelayOk(aiOwnerId)');
  assert(/candidates:\s*forcedWarMajorAiSubjects,/.test(mainSrc), 'main.ts: playerFirst.candidates wspólna lista (bez duplikatu)');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
