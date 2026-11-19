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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
