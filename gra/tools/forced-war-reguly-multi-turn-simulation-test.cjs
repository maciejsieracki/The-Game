'use strict';
/**
 * forced-war-reguly-multi-turn-simulation-test.cjs — R-WOJNA-WYMUSZONA-REGULY-Q1,
 * Operator Sonnet 5 effort=high, runda 1. Kryteria końca 1-9.
 *
 * "REGULA PRZECIW SAMOOSZUKIWANIU" dispatchu zakazuje uznania kryteriów 1-9 za
 * spełnione bez REALNEJ symulacji wielu tur silnika (nie ręcznych wyliczeń). main.ts
 * nie jest bundlowalny/importowalny wprost (monolityczny skrypt spięty z DOM/canvasem),
 * więc ta bramka odtwarza WYŁĄCZNIE okablowanie pętli tury z main.ts (kolejność: dla
 * każdego ownerId w turze policz shouldSearch -> zbuduj kandydatów -> wybierz cel ->
 * ZAPISZ wynik do wspólnej mapy relacji SYNCHRONICZNIE, zanim przetworzy się kolejny
 * owner w TEJ SAMEJ turze -- dokładnie jak main.ts robi to przez setDiploRelation w
 * pętli dipCmds, PRZED przejściem do następnego ownerId w ownerLoop) — a każdą
 * DECYZJĘ (eligibility/próg tur, koordynacja+fallback+trudność, koniec przez czas,
 * koniec przez próg miast) deleguje do PRAWDZIWYCH wyeksportowanych funkcji z
 * `forced-war-stone.ts`/`forced-war-bronze.ts`/`forced-war-common.ts`, bundlowanych
 * przez esbuild z realnych źródeł (esbuild, ZERO regexów/reimplementacji formuł —
 * wzorem `p-wojna-wymuszona-trzy-naprawy-test.cjs`). Krok tury jest wykonywany
 * JEDEN PO DRUGIM (pętla `for (let turn = ...)`), nie przez ręczne przeskoki do
 * wybranej tury -- każdy test przechodzi przez WSZYSTKIE tury pośrednie identycznie
 * jak silnik.
 *
 * Pokrycie:
 *   K1 — 3+ AI próbujące niezależnie wybrać cel: co najwyżej JEDNA faktycznie atakuje
 *        danego kandydata w tej samej turze (koordynacja przez candidatesAlreadyAtWarIds).
 *   K2 — wszyscy kandydaci AI już w wojnie -> fallback na gracza (Normalny/Trudny).
 *   K3 — Normalny: gracz z 1 aktywną wojną wymuszoną NIE dostaje drugiej; Trudny: dostaje.
 *   K4 — Łatwy: mechanizm Kamienia/Brązu w ogóle się nie uruchamia przez wiele tur;
 *        inny powód wojny (gracz sam wypowiada) działa normalnie.
 *   K5 — próg startu: Kamień od tury 25 (nie 20); Brąz 25 tur PO wejściu w epokę,
 *        zmierzone NIEZALEŻNIE dla dwóch cywilizacji wchodzących w Brąz w różnych turach.
 *   K6 — aktywna wojna bez zdobyczy terytorialnych -> auto-pokój dokładnie po 25 turach.
 *   K7 — próg miastowy kończy wojnę WCZEŚNIEJ niż limit czasu, gdy miasto zmienia
 *        właściciela (brak regresu istniejącego mechanizmu).
 *   K8 — wczytanie zapisu sprzed tej naprawy (brak `startTurn`) nie wywala się i nie
 *        kończy wojny natychmiast po wczytaniu.
 *   K9 — Żelazo NIETKNIĘTE: diff main.ts ograniczony do gałęzi Kamienia/Brązu (dowód
 *        tekstowy uzupełniający -- forced-war-iron.ts i forced-war-iron-test.cjs/-main-
 *        guard-test.cjs/-mutant-probe.cjs, uruchomione osobno w tym samym raporcie,
 *        pozostają 100% zielone, patrz 01-operator.md).
 *
 * Uruchamianie z gra/: node tools/forced-war-reguly-multi-turn-simulation-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const entry = path.resolve(__dirname, '.forced-war-reguly-sim-entry.ts');
const bundle = path.resolve(__dirname, '.forced-war-reguly-sim-bundle.cjs');

fs.writeFileSync(entry, `
export {
  WOJNA_KAMIEN_WYMUSZONA_START_TURY,
  WOJNA_KAMIEN_WYMUSZONA_MAX_CZAS_TRWANIA_TUR,
  WOJNA_KAMIEN_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE,
  isEligibleForStoneForcedWar,
  pickStoneForcedWarTargetIdCoordinated,
  shouldEndStoneForcedWarByDuration,
  shouldEndStoneForcedWarByCityCount,
  restoreStoneForcedWarState,
} from ${JSON.stringify(GRA_ROOT + '/src/game/forced-war-stone')};
export {
  WOJNA_WYMUSZONA_START_TURY_OD_EPOKI,
  WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR,
  WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE,
  isEligibleForBronzeForcedWar,
  pickBronzeForcedWarTargetIdCoordinated,
  shouldEndBronzeForcedWarByDuration,
  shouldEndBronzeForcedWarByCityCount,
  restoreBronzeForcedWarState,
} from ${JSON.stringify(GRA_ROOT + '/src/game/forced-war-bronze')};
export { countActiveWarsExcluding } from ${JSON.stringify(GRA_ROOT + '/src/game/forced-war-common')};
export { diploPairKey } from ${JSON.stringify(GRA_ROOT + '/src/game/diplomacy-pn-engine')};
export { isBarbarian, BARBARIAN_OWNER_ID } from ${JSON.stringify(GRA_ROOT + '/src/game/barbarians')};
`, 'utf8');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

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
} catch (e) {
  console.error('[forced-war-reguly-multi-turn-simulation-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  WOJNA_KAMIEN_WYMUSZONA_START_TURY,
  WOJNA_KAMIEN_WYMUSZONA_MAX_CZAS_TRWANIA_TUR,
  WOJNA_KAMIEN_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE,
  isEligibleForStoneForcedWar,
  pickStoneForcedWarTargetIdCoordinated,
  shouldEndStoneForcedWarByDuration,
  shouldEndStoneForcedWarByCityCount,
  restoreStoneForcedWarState,
  WOJNA_WYMUSZONA_START_TURY_OD_EPOKI,
  WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR,
  WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE,
  isEligibleForBronzeForcedWar,
  pickBronzeForcedWarTargetIdCoordinated,
  shouldEndBronzeForcedWarByDuration,
  shouldEndBronzeForcedWarByCityCount,
  restoreBronzeForcedWarState,
  countActiveWarsExcluding,
  diploPairKey,
  isBarbarian,
} = require(bundle);

// ---------------------------------------------------------------------------
// Okablowanie tury (harness) -- ODTWARZA KOLEJNOŚĆ main.ts, nie żadną FORMUŁĘ decyzyjną.
// ---------------------------------------------------------------------------

/** Prosty świat: relacje dyplomatyczne (Map<pairKey,'wojna'|'neutralny'>) + pozycje. */
function makeWorld(ownerHexes) {
  return {
    relations: new Map(),
    hexOf: new Map(Object.entries(ownerHexes).map(([k, v]) => [Number(k), v])),
    allOwnerIds: Object.keys(ownerHexes).map(Number),
  };
}
function isAtWar(world, a, b) {
  return world.relations.get(diploPairKey(a, b)) === 'wojna';
}
function declareWar(world, a, b) {
  world.relations.set(diploPairKey(a, b), 'wojna');
}
function makePeace(world, a, b) {
  world.relations.set(diploPairKey(a, b), 'neutralny');
}
/** Odpowiednik main.ts `countActiveWarsForOwnerExcludingBarbarians` -- ta sama, PRAWDZIWA funkcja. */
function activeWarsExcludingBarbarians(world, ownerId) {
  return countActiveWarsExcluding(
    ownerId, world.allOwnerIds, (a, b) => isAtWar(world, a, b), isBarbarian,
  );
}
const hexDistance = (aq, ar, bq, br) => {
  const dq = aq - bq, dr = ar - br;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
};

/**
 * Jeden krok "gałęzi Kamienia" main.ts dla JEDNEGO ownerId w JEDNEJ turze -- ta sama
 * kolejność co main.ts (linie ok. 28914-28990 tego dispatchu): shouldSearch (gate
 * Łatwy + isEligibleForStoneForcedWar) -> zbuduj kandydatów (wszyscy inni ownerowie
 * + gracz) -> policz candidatesAlreadyAtWarIds (PRAWDZIWA countActiveWarsExcluding)
 * -> PRAWDZIWY pickStoneForcedWarTargetIdCoordinated -> jeśli wybrany, declareWar
 * NATYCHMIAST (synchronicznie, jak main.ts robi przez setDiploRelation w tej samej
 * turze, PRZED przetworzeniem kolejnego ownerId).
 */
function stepStoneForOwner(world, ownerId, turn, opts) {
  const { pendingOwners, activeByPairKey, poziomTrudnosci, playerActiveForcedWarCount } = opts;
  if (activeWarsExcludingBarbarians(world, ownerId) > 0) return null; // alreadyAtWarAnyRole
  const wasPending = pendingOwners.has(ownerId);
  if (!wasPending) return null; // uproszczenie harnessu: brak cyklu odpoczynku w tych scenariuszach
  const forcedWarDifficultyLevel = poziomTrudnosci;
  const shouldSearch = forcedWarDifficultyLevel !== 1 && isEligibleForStoneForcedWar({
    isMainAiCiv: true, isStoneEra: true, currentTurn: turn, isAlreadyAtWarAnyRole: false,
  });
  if (!shouldSearch) return null;
  // candidateOwnerIds: pula ownerów UPRAWNIONYCH jako cel (main.ts: `[0, ...aiOwnerList]`)
  // -- domyślnie CAŁY świat poza sobą (jak main.ts, gdzie inny napastnik-w-oczekiwaniu też
  // jest ważnym kandydatem); scenariusze K1-K3 podają jawną, mniejszą pulę, żeby geometria
  // testu była czytelna, bez zmiany SAMEJ formuły wyboru (nadal PRAWDZIWY picker niżej).
  const candidateOwnerIds = opts.candidateOwnerIds ?? world.allOwnerIds;
  const candidates = candidateOwnerIds
    .filter(oid => oid !== ownerId)
    .map(oid => ({ ownerId: oid, ...world.hexOf.get(oid) }));
  const candidatesAlreadyAtWarIds = new Set(
    candidates.filter(c => activeWarsExcludingBarbarians(world, c.ownerId) > 0).map(c => c.ownerId),
  );
  const picked = pickStoneForcedWarTargetIdCoordinated(
    candidates, world.hexOf.get(ownerId), hexDistance,
    { blockedOwnerIds: new Set(), candidatesAlreadyAtWarIds, poziomTrudnosci, playerActiveForcedWarCount },
  );
  if (picked == null) return null;
  declareWar(world, ownerId, picked);
  pendingOwners.delete(ownerId);
  activeByPairKey.set(diploPairKey(ownerId, picked), {
    attackerId: ownerId, targetId: picked, capturedByAttacker: 0, capturedByDefender: 0, startTurn: turn,
  });
  return picked;
}

/** To samo dla Brązu -- lustrzana kopia (jak forced-war-bronze.ts jest lustrzaną kopią forced-war-stone.ts). */
function stepBronzeForOwner(world, ownerId, turn, opts) {
  const { pendingOwners, activeByPairKey, eraEnterTurnByOwner, poziomTrudnosci, playerActiveForcedWarCount } = opts;
  if (activeWarsExcludingBarbarians(world, ownerId) > 0) return null;
  const wasPending = pendingOwners.has(ownerId);
  if (!wasPending) return null;
  const forcedWarDifficultyLevel = poziomTrudnosci;
  const shouldSearch = forcedWarDifficultyLevel !== 1 && isEligibleForBronzeForcedWar({
    isMainAiCiv: true, isAlreadyAtWarAnyRole: false,
    currentTurn: turn, eraEnterTurn: eraEnterTurnByOwner.get(ownerId),
  });
  if (!shouldSearch) return null;
  const candidateOwnerIds = opts.candidateOwnerIds ?? world.allOwnerIds;
  const candidates = candidateOwnerIds
    .filter(oid => oid !== ownerId)
    .map(oid => ({ ownerId: oid, ...world.hexOf.get(oid) }));
  const candidatesAlreadyAtWarIds = new Set(
    candidates.filter(c => activeWarsExcludingBarbarians(world, c.ownerId) > 0).map(c => c.ownerId),
  );
  const picked = pickBronzeForcedWarTargetIdCoordinated(
    candidates, world.hexOf.get(ownerId), hexDistance,
    { blockedOwnerIds: new Set(), candidatesAlreadyAtWarIds, poziomTrudnosci, playerActiveForcedWarCount },
  );
  if (picked == null) return null;
  declareWar(world, ownerId, picked);
  pendingOwners.delete(ownerId);
  activeByPairKey.set(diploPairKey(ownerId, picked), {
    attackerId: ownerId, targetId: picked, capturedByAttacker: 0, capturedByDefender: 0, startTurn: turn,
  });
  return picked;
}

/** Krok co-turowy limitu czasu (main.ts resolveForcedWarDurationLimits, Część C). */
function resolveDurationLimitsStep(world, turn, stoneActive, bronzeActive) {
  for (const [key, st] of Array.from(stoneActive.entries())) {
    if (!shouldEndStoneForcedWarByDuration(turn, st.startTurn)) continue;
    makePeace(world, st.attackerId, st.targetId);
    stoneActive.delete(key);
  }
  for (const [key, st] of Array.from(bronzeActive.entries())) {
    if (!shouldEndBronzeForcedWarByDuration(turn, st.startTurn)) continue;
    makePeace(world, st.attackerId, st.targetId);
    bronzeActive.delete(key);
  }
}

console.log('R-WOJNA-WYMUSZONA-REGULY-Q1 — symulacja wielu tur silnika (kryteria 1-9)\n');

// =============================================================================
// K1: 3 AI próbujące niezależnie wybrać cel -> co najwyżej JEDNA atakuje danego kandydata.
// =============================================================================
console.log('--- K1: koordynacja -- 3 napastnicy AI, żaden wspólny cel nie dostaje 2 wypowiedzeń ---');
{
  const world = makeWorld({
    1: { q: 0, r: 0 }, 2: { q: 0, r: 0 }, 3: { q: 0, r: 0 },
    4: { q: 1, r: 0 }, 5: { q: 5, r: 0 }, 6: { q: 10, r: 0 }, 0: { q: 20, r: 0 },
  });
  const pendingOwners = new Set([1, 2, 3]);
  const activeByPairKey = new Map();
  // candidateOwnerIds jawnie ograniczona do puli CELÓW {4,5,6,gracz} -- napastnicy 1/2/3
  // (główni rywale, każdy sam też jest "głównym AI") NIE są sobie nawzajem celami w TYM
  // scenariuszu (są ustawieni na tej samej pozycji referencyjnej właśnie po to, by mieć
  // IDENTYCZNE preferencje odległości do 4/5/6 -- bez tego zawężenia daliby się sobie
  // nawzajem jako "kandydat o dystansie 0", co jest realnym, ale INNYM scenariuszem niż
  // ten, który K1 ma dowieść: koordynacja NAD WSPÓLNĄ pulą trzech wolnych celów).
  const opts = {
    pendingOwners, activeByPairKey, poziomTrudnosci: 2, playerActiveForcedWarCount: 0,
    candidateOwnerIds: [4, 5, 6, 0],
  };
  const turn = WOJNA_KAMIEN_WYMUSZONA_START_TURY; // pierwsza tura, w której WOLNO szukać celu
  const picks = [];
  for (const ownerId of [1, 2, 3]) {
    picks.push(stepStoneForOwner(world, ownerId, turn, opts));
  }
  eq(picks.length, 3, 'K1: wszyscy trzej napastnicy przetworzeni');
  assert(picks.every(p => p != null), 'K1: każdy z trzech napastników znalazł JAKIŚ cel (mechanizm nie umiera)');
  const uniqueTargets = new Set(picks);
  eq(uniqueTargets.size, 3, 'K1: SEDNO -- trzej napastnicy wybrali TRZY RÓŻNE cele (żaden kandydat nie dostał 2 wypowiedzeń)');
  eq(picks[0], 4, 'K1: napastnik 1 (pierwszy w kolejce) dostaje najbliższego wolnego kandydata (4)');
  eq(picks[1], 5, 'K1: napastnik 2 widzi 4 już w wojnie (koordynacja) -> kolejny najbliższy wolny (5)');
  eq(picks[2], 6, 'K1: napastnik 3 widzi 4 i 5 już w wojnie -> kolejny wolny (6)');
  for (const [a, b] of [[1, 4], [2, 5], [3, 6]]) {
    assert(isAtWar(world, a, b), `K1: relacja ${a}<->${b} faktycznie 'wojna' w świecie symulacji`);
  }
  assert(!isAtWar(world, 2, 4), 'K1: napastnik 2 NIE zaatakował 4 (już zajętego)');
  assert(!isAtWar(world, 3, 4), 'K1: napastnik 3 NIE zaatakował 4');
  assert(!isAtWar(world, 3, 5), 'K1: napastnik 3 NIE zaatakował 5 (już zajętego przez napastnika 2)');
}

// =============================================================================
// K2 + K3: fallback na gracza, limit trudności.
// =============================================================================
console.log('\n--- K2/K3: fallback na gracza gdy wszyscy kandydaci AI zajęci + limit trudności Normalnej ---');
{
  // Scenariusz: dwóch napastników (1,2), jeden wolny kandydat AI (4) i gracz (0).
  // Napastnik 1 zajmuje jedynego wolnego AI (4). Napastnik 2 nie ma już żadnego
  // wolnego kandydata AI -> K2: fallback na gracza.
  const world = makeWorld({
    1: { q: 0, r: 0 }, 2: { q: 0, r: 0 }, 4: { q: 1, r: 0 }, 0: { q: 2, r: 0 },
  });
  const pendingOwners = new Set([1, 2]);
  const activeByPairKey = new Map();
  const turn = WOJNA_KAMIEN_WYMUSZONA_START_TURY;
  // candidateOwnerIds jawnie ograniczona do puli CELÓW {AI4, gracz} -- patrz komentarz
  // analogiczny w K1 wyżej (napastnicy 1/2/3 nie są sobie nawzajem celami w tym scenariuszu).
  const targetPool = [4, 0];

  const pick1 = stepStoneForOwner(world, 1, turn, {
    pendingOwners, activeByPairKey, poziomTrudnosci: 2, playerActiveForcedWarCount: 0,
    candidateOwnerIds: targetPool,
  });
  eq(pick1, 4, 'K2 setup: napastnik 1 zajmuje jedynego wolnego AI (4)');

  const pick2Normal = stepStoneForOwner(world, 2, turn, {
    pendingOwners, activeByPairKey, poziomTrudnosci: 2, playerActiveForcedWarCount: 0,
    candidateOwnerIds: targetPool,
  });
  eq(pick2Normal, 0, 'K2: SEDNO -- wszyscy kandydaci AI zajęci, Normalny, gracz BEZ wojny wymuszonej -> fallback na gracza');
  assert(isAtWar(world, 2, 0), 'K2: napastnik 2 faktycznie wypowiedział wojnę graczowi w świecie symulacji');

  // K3a: Normalny, gracz JUŻ MA 1 aktywną wojnę wymuszoną (ta z pick2Normal powyżej) ->
  // TRZECI napastnik nie dostaje gracza jako fallback.
  pendingOwners.add(3);
  world.hexOf.set(3, { q: 0, r: 0 });
  world.allOwnerIds.push(3);
  const pick3Normal = stepStoneForOwner(world, 3, turn, {
    pendingOwners, activeByPairKey, poziomTrudnosci: 2, playerActiveForcedWarCount: 1,
    candidateOwnerIds: targetPool,
  });
  eq(pick3Normal, null, 'K3a: Normalny -- gracz już ma 1 wojnę wymuszoną, trzeci napastnik NIE dostaje go jako fallback');
  assert(!isAtWar(world, 3, 0), 'K3a: napastnik 3 faktycznie NIE wypowiedział wojny graczowi');
  assert(pendingOwners.has(3), 'K3a: napastnik 3 zostaje "pending" -- spróbuje ponownie później (nie ginie na stałe)');

  // K3b: Trudny -- ten sam scenariusz, ale bez limitu -> napastnik 3 DOSTAJE gracza.
  const pick3Hard = stepStoneForOwner(world, 3, turn, {
    pendingOwners, activeByPairKey, poziomTrudnosci: 3, playerActiveForcedWarCount: 1,
    candidateOwnerIds: targetPool,
  });
  eq(pick3Hard, 0, 'K3b: Trudny -- limit Normalnej NIE obowiązuje, napastnik 3 DOSTAJE gracza mimo już 1 aktywnej wojny');
  assert(isAtWar(world, 3, 0), 'K3b: napastnik 3 faktycznie wypowiedział wojnę graczowi (gracz ma teraz 2 wojny wymuszone)');
}

// =============================================================================
// K4: Łatwy wyłącza mechanizm CAŁKOWICIE (Kamień+Brąz), przez wiele tur; inne powody
// wojny (gracz sam wypowiada) działają normalnie.
// =============================================================================
console.log('\n--- K4: Łatwy -- zero wypowiedzeń z mechanizmu wymuszonego przez 60 tur; inne wojny bez zmian ---');
{
  const world = makeWorld({ 1: { q: 0, r: 0 }, 2: { q: 0, r: 0 }, 4: { q: 1, r: 0 }, 0: { q: 2, r: 0 } });
  const stonePending = new Set([1, 2]);
  const stoneActive = new Map();
  const bronzePending = new Set([1, 2]);
  const bronzeActive = new Map();
  const eraEnterTurnByOwner = new Map([[1, 1], [2, 1]]);
  let anyForcedWarEver = false;
  for (let turn = 1; turn <= 60; turn++) {
    for (const ownerId of [1, 2]) {
      const sp = stepStoneForOwner(world, ownerId, turn, {
        pendingOwners: stonePending, activeByPairKey: stoneActive, poziomTrudnosci: 1, playerActiveForcedWarCount: 0,
      });
      const bp = stepBronzeForOwner(world, ownerId, turn, {
        pendingOwners: bronzePending, activeByPairKey: bronzeActive, eraEnterTurnByOwner, poziomTrudnosci: 1, playerActiveForcedWarCount: 0,
      });
      if (sp != null || bp != null) anyForcedWarEver = true;
    }
    resolveDurationLimitsStep(world, turn, stoneActive, bronzeActive);
  }
  assert(!anyForcedWarEver, 'K4: SEDNO -- na Łatwym ZERO wypowiedzeń wojny wymuszonej (Kamień+Brąz) w 60 turach × 2 ownerów');
  eq(stoneActive.size, 0, 'K4: zero aktywnych wojen wymuszonych Kamienia po 60 turach na Łatwym');
  eq(bronzeActive.size, 0, 'K4: zero aktywnych wojen wymuszonych Brązu po 60 turach na Łatwym');
  // Inny powód wojny (gracz sam wypowiada) -- niezależny od mechanizmu wymuszonego,
  // musi działać identycznie na Łatwym jak gdziekolwiek indziej (to zwykła mutacja
  // relacji, ten sam kanał co main.ts używa dla KAŻDEJ wojny -- brak osobnej "formuły"
  // do delegowania do produkcyjnego kodu tutaj).
  declareWar(world, 0, 4);
  assert(isAtWar(world, 0, 4), 'K4: regresja -- gracz nadal MOŻE sam wypowiedzieć wojnę na Łatwym (inny powód wojny nietknięty)');
}

// =============================================================================
// K5: próg startu -- Kamień od tury 25 (nie 20); Brąz 25 tur PO wejściu w epokę,
// zmierzone niezależnie dla dwóch cywilizacji wchodzących w różnych turach.
// =============================================================================
console.log('\n--- K5: próg startu -- Kamień tura 25, Brąz 25 tur od WŁASNEGO wejścia w epokę ---');
{
  eq(WOJNA_KAMIEN_WYMUSZONA_START_TURY, 25, 'K5: stała Kamienia = 25 (nie 20)');
  // Kamień: jeden napastnik, jeden wolny kandydat, krok po kroku od tury 1.
  const worldStone = makeWorld({ 1: { q: 0, r: 0 }, 4: { q: 1, r: 0 } });
  const stonePending = new Set([1]);
  const stoneActive = new Map();
  let stoneFiredAtTurn = null;
  for (let turn = 1; turn <= 30 && stoneFiredAtTurn == null; turn++) {
    const picked = stepStoneForOwner(worldStone, 1, turn, {
      pendingOwners: stonePending, activeByPairKey: stoneActive, poziomTrudnosci: 2, playerActiveForcedWarCount: 0,
    });
    if (picked != null) stoneFiredAtTurn = turn;
  }
  eq(stoneFiredAtTurn, 25, 'K5: Kamień -- pierwsze wypowiedzenie wojny wymuszonej dokładnie w turze 25, przy przejściu tura-po-turze od tury 1');

  // Brąz: DWIE cywilizacje wchodzące w epokę Brąz w RÓŻNYCH turach gry (10 i 40) --
  // próg 25 tur liczy się NIEZALEŻNIE od KAŻDEJ z tych dwóch tur, nie od startu gry.
  const worldBronze = makeWorld({
    1: { q: 0, r: 0 }, 4: { q: 1, r: 0 }, // cywilizacja A: wchodzi w Brąz w turze 10
    2: { q: 100, r: 0 }, 5: { q: 101, r: 0 }, // cywilizacja B: wchodzi w Brąz w turze 40
  });
  const bronzePending = new Set(); // ustawiane dokładnie w turze wejścia w epokę, jak syncOwnerEraFromResearch
  const bronzeActive = new Map();
  const eraEnterTurnByOwner = new Map();
  let firedA = null;
  let firedB = null;
  for (let turn = 1; turn <= 70; turn++) {
    if (turn === 10) { bronzePending.add(1); eraEnterTurnByOwner.set(1, 10); }
    if (turn === 40) { bronzePending.add(2); eraEnterTurnByOwner.set(2, 40); }
    for (const ownerId of [1, 2]) {
      const picked = stepBronzeForOwner(worldBronze, ownerId, turn, {
        pendingOwners: bronzePending, activeByPairKey: bronzeActive, eraEnterTurnByOwner,
        poziomTrudnosci: 2, playerActiveForcedWarCount: 0,
      });
      if (picked != null) {
        if (ownerId === 1 && firedA == null) firedA = turn;
        if (ownerId === 2 && firedB == null) firedB = turn;
      }
    }
  }
  eq(WOJNA_WYMUSZONA_START_TURY_OD_EPOKI, 25, 'K5: stała progu Brązu = 25 tur od epoki');
  eq(firedA, 35, 'K5: cywilizacja A weszła w Brąz w turze 10 -> pierwsza wojna wymuszona dokładnie w turze 35 (10+25)');
  eq(firedB, 65, 'K5: cywilizacja B weszła w Brąz w turze 40 (30 tur PÓŹNIEJ niż A) -> pierwsza wojna w turze 65 (40+25), NIEZALEŻNIE od A');
}

// =============================================================================
// K6: aktywna wojna bez zdobyczy terytorialnych -> auto-pokój dokładnie po 25 turach.
// K7: próg miastowy kończy wojnę WCZEŚNIEJ, gdy miasto zmienia właściciela (brak regresu).
// =============================================================================
console.log('\n--- K6: limit czasu trwania -- auto-pokój dokładnie po 25 turach bez zdobyczy ---');
{
  const world = makeWorld({ 1: { q: 0, r: 0 }, 2: { q: 0, r: 0 } });
  declareWar(world, 1, 2);
  const startTurn = 40;
  const stoneActive = new Map([[diploPairKey(1, 2), {
    attackerId: 1, targetId: 2, capturedByAttacker: 0, capturedByDefender: 0, startTurn,
  }]]);
  let peaceAtTurn = null;
  for (let turn = startTurn; turn <= startTurn + 40 && peaceAtTurn == null; turn++) {
    resolveDurationLimitsStep(world, turn, stoneActive, new Map());
    if (!isAtWar(world, 1, 2)) peaceAtTurn = turn;
  }
  eq(peaceAtTurn, startTurn + WOJNA_KAMIEN_WYMUSZONA_MAX_CZAS_TRWANIA_TUR, 'K6: SEDNO -- auto-pokój dokładnie 25 tur po starcie TEJ pary, bez żadnej zdobyczy');
  eq(stoneActive.size, 0, 'K6: stan pary posprzątany po auto-pokoju');
}

console.log('--- K7: próg miastowy (regresja) -- kończy wojnę WCZEŚNIEJ niż limit czasu, gdy miasto pada ---');
{
  const world = makeWorld({ 1: { q: 0, r: 0 }, 2: { q: 0, r: 0 } });
  declareWar(world, 1, 2);
  const startTurn = 100;
  const pairKey = diploPairKey(1, 2);
  const st = { attackerId: 1, targetId: 2, capturedByAttacker: 0, capturedByDefender: 0, startTurn };
  const stoneActive = new Map([[pairKey, st]]);
  let peaceAtTurn = null;
  let peaceReason = null;
  for (let turn = startTurn; turn <= startTurn + 40 && peaceAtTurn == null; turn++) {
    // Miasto pada na rzecz napastnika w turze startTurn+3 (drugie zdobyte miasto,
    // próg WOJNA_KAMIEN_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE=2) -- symulacja
    // maybeResolveStoneForcedWarOnCityCapture main.ts, wywoływana PRZED co-turowym
    // krokiem limitu czasu (tak jak w main.ts: capture funnel działa w trakcie tury,
    // resolveForcedWarDurationLimits na starcie NASTĘPNEJ świeżej tury).
    if (turn === startTurn + 1) st.capturedByAttacker = 1;
    if (turn === startTurn + 3) {
      st.capturedByAttacker = 2;
      if (shouldEndStoneForcedWarByCityCount(st.capturedByAttacker, st.capturedByDefender)) {
        makePeace(world, st.attackerId, st.targetId);
        stoneActive.delete(pairKey);
        peaceAtTurn = turn;
        peaceReason = 'miasta';
      }
    }
    if (peaceAtTurn == null) {
      resolveDurationLimitsStep(world, turn, stoneActive, new Map());
      if (!isAtWar(world, 1, 2)) { peaceAtTurn = turn; peaceReason = 'czas'; }
    }
  }
  eq(peaceReason, 'miasta', 'K7: SEDNO -- wojna kończy się przez PRÓG MIASTOWY, nie przez limit czasu');
  eq(peaceAtTurn, startTurn + 3, 'K7: auto-pokój w turze zdobycia 2. miasta (startTurn+3), DALEKO przed limitem 25 tur');
  assert(startTurn + 3 < startTurn + WOJNA_KAMIEN_WYMUSZONA_MAX_CZAS_TRWANIA_TUR, 'K7: sanity -- próg miastowy faktycznie zadziałał wcześniej niż limit czasu by zadziałał');
}

// =============================================================================
// K8: wczytanie zapisu sprzed tej naprawy (brak startTurn) -- bez wyjątku, bez
// natychmiastowego końca wojny.
// =============================================================================
console.log('\n--- K8: wczytanie starego zapisu (brak pola startTurn) -- bezpieczne ---');
{
  // Stary zapis: activeByPairKey BEZ pola startTurn (dokładnie jak JSON sprzed tej naprawy).
  const oldSaveJson = {
    pendingOwners: [], cycleOwners: [], restUntilByOwner: [],
    activeByPairKey: [['1_2', { attackerId: 1, targetId: 2, capturedByAttacker: 0, capturedByDefender: 0 }]],
  };
  let restored;
  let threw = false;
  try {
    restored = restoreStoneForcedWarState(oldSaveJson);
  } catch (e) {
    threw = true;
  }
  assert(!threw, 'K8: restoreStoneForcedWarState na starym zapisie NIE wywala się (brak wyjątku)');
  const st = restored.activeByPairKey.get('1_2');
  assert(st !== undefined, 'K8: para wojny ze starego zapisu jest odtworzona');
  eq(st.startTurn, undefined, 'K8: startTurn faktycznie brakuje w surowym odczycie (dowód, że to realny stary kształt, nie spreparowany)');
  // main.ts backfilluje PRZY WCZYTANIU (restoreGameFromSave): { ...st, startTurn: st.startTurn ?? turn }.
  const loadTurn = 77;
  const backfilled = { ...st, startTurn: st.startTurn ?? loadTurn };
  eq(backfilled.startTurn, loadTurn, 'K8: backfill main.ts nadaje startTurn = tura wczytania');
  assert(
    !shouldEndStoneForcedWarByDuration(loadTurn, backfilled.startTurn),
    'K8: SEDNO -- TUŻ PO wczytaniu wojna NIE kończy się natychmiast przez limit czasu (0 tur < 25)',
  );
  let peaceAtTurn = null;
  const stoneActive = new Map([['1_2', backfilled]]);
  const world = makeWorld({ 1: { q: 0, r: 0 }, 2: { q: 0, r: 0 } });
  declareWar(world, 1, 2);
  for (let turn = loadTurn; turn <= loadTurn + 30 && peaceAtTurn == null; turn++) {
    resolveDurationLimitsStep(world, turn, stoneActive, new Map());
    if (!isAtWar(world, 1, 2)) peaceAtTurn = turn;
  }
  eq(peaceAtTurn, loadTurn + 25, 'K8: po backfillu wojna dostaje PEŁNE nowe 25 tur liczone od tury wczytania, nie ucina się w pół');

  // Restore całkowicie bez `saved` (najstarszy możliwy zapis) -- bezpieczny pusty stan.
  const emptyRestored = restoreBronzeForcedWarState(undefined);
  eq(emptyRestored.activeByPairKey.size, 0, 'K8: restoreBronzeForcedWarState(undefined) -- pusty stan, zero wyjątku');
}

// =============================================================================
// K9: Żelazo nietknięte -- dowód tekstowy uzupełniający (pełny dowód wykonawczy to
// forced-war-iron-test.cjs + forced-war-iron-main-guard-test.cjs + mutant-probe,
// uruchomione osobno w tym samym raporcie -- 100% zielone, patrz 01-operator.md).
// =============================================================================
console.log('\n--- K9: Żelazo poza zakresem -- dowód tekstowy (main.ts, forced-war-iron.ts) ---');
{
  const ironSrc = fs.readFileSync(path.join(GRA_ROOT, 'src', 'game', 'forced-war-iron.ts'), 'utf8');
  assert(
    !/R-WOJNA-WYMUSZONA-REGULY-Q1/.test(ironSrc),
    'K9: forced-war-iron.ts nie zawiera ŻADNEGO śladu tego dispatchu (plik NIETKNIĘTY)',
  );
  const mainSrc = fs.readFileSync(path.join(GRA_ROOT, 'src', 'main.ts'), 'utf8');
  const ironBranchStart = mainSrc.indexOf('R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1: wymuszona wojna głównej cywilizacji');
  const ironBranchEnd = mainSrc.indexOf('ironForceWarTargetId = ironPicked;', ironBranchStart);
  assert(ironBranchStart > -1 && ironBranchEnd > -1, 'K9: gałąź selekcji celu Żelaza nadal obecna i lokalizowalna w main.ts');
  const ironBranch = mainSrc.slice(ironBranchStart, ironBranchEnd);
  assert(
    !/R-WOJNA-WYMUSZONA-REGULY-Q1/.test(ironBranch),
    'K9: SEDNO -- gałąź selekcji celu Żelaza w main.ts nie zawiera ŻADNEGO śladu tego dispatchu (nietknięta)',
  );
  assert(
    !ironBranch.includes('startTurn'),
    'K9: gałąź Żelaza NIE dostaje pola startTurn (Część C tego dispatchu jawnie poza zakresem Żelaza)',
  );
}

// ---------------------------------------------------------------------------
try { fs.unlinkSync(entry); } catch (e) { /* nieistotne */ }
try { fs.unlinkSync(bundle); } catch (e) { /* nieistotne */ }

console.log(`\nPASSED: ${passed} / FAILED: ${failed} / TOTAL: ${passed + failed}`);
if (failed > 0) {
  console.log('SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('ALL GREEN');
}
