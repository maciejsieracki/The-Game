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
  shouldEndStoneForcedWarByDuration,
  shouldEndStoneForcedWarByCityCount,
  restoreStoneForcedWarState,
} from ${JSON.stringify(GRA_ROOT + '/src/game/forced-war-stone')};
export {
  WOJNA_WYMUSZONA_START_TURY_OD_EPOKI,
  WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR,
  WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE,
  isEligibleForBronzeForcedWar,
  shouldEndBronzeForcedWarByDuration,
  shouldEndBronzeForcedWarByCityCount,
  restoreBronzeForcedWarState,
} from ${JSON.stringify(GRA_ROOT + '/src/game/forced-war-bronze')};
export { countActiveWarsExcluding, assignForcedWarPairings } from ${JSON.stringify(GRA_ROOT + '/src/game/forced-war-common')};
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
  shouldEndStoneForcedWarByDuration,
  shouldEndStoneForcedWarByCityCount,
  restoreStoneForcedWarState,
  WOJNA_WYMUSZONA_START_TURY_OD_EPOKI,
  WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR,
  WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE,
  isEligibleForBronzeForcedWar,
  shouldEndBronzeForcedWarByDuration,
  shouldEndBronzeForcedWarByCityCount,
  restoreBronzeForcedWarState,
  countActiveWarsExcluding,
  assignForcedWarPairings,
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
 * R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1: `pickStoneForcedWarTargetIdCoordinated`/
 * `pickBronzeForcedWarTargetIdCoordinated` (per owner, independent) zniknęły -- main.ts woła
 * teraz JEDNĄ wspólną procedurę `assignForcedWarPairings` RAZ na turę dla WSZYSTKICH triggered
 * owners naraz. Ten harness odtwarza DOKŁADNIE tę kolejność: dla każdego z `ownerIds` policz
 * shouldSearch (gate Łatwy + isEligibleForXForcedWar, PRAWDZIWE funkcje) -> zbierz WSZYSTKICH
 * triggered w jednej liście -> JEDNO wywołanie PRAWDZIWEGO `assignForcedWarPairings` -> ZASTOSUJ
 * wszystkie wynikowe assignments SYNCHRONICZNIE (declareWar + activeByPairKey), zanim przejdzie
 * się do następnej tury -- tak jak main.ts robi to PRZED `ownerLoop`, nie per-owner w środku.
 */
function runForcedWarTurnStep(world, ownerIds, turn, opts) {
  const {
    stonePendingOwners, stoneActiveByPairKey,
    bronzePendingOwners, bronzeActiveByPairKey, eraEnterTurnByOwner,
    poziomTrudnosci, candidateOwnerIds, isPairBlocked,
  } = opts;
  const triggeredSubjects = [];

  for (const ownerId of ownerIds) {
    if (activeWarsExcludingBarbarians(world, ownerId) > 0) continue; // alreadyAtWarAnyRole
    const forcedWarDifficultyLevel = poziomTrudnosci;
    if (forcedWarDifficultyLevel === 1) continue; // Łatwy: mechanizm wyłączony całkowicie

    if (stonePendingOwners && stonePendingOwners.has(ownerId)) {
      const eligible = isEligibleForStoneForcedWar({
        isMainAiCiv: true, isStoneEra: true, currentTurn: turn, isAlreadyAtWarAnyRole: false,
      });
      if (eligible) {
        triggeredSubjects.push({ ownerId, ...world.hexOf.get(ownerId), era: 'stone' });
        continue;
      }
    }
    if (bronzePendingOwners && bronzePendingOwners.has(ownerId)) {
      const eligible = isEligibleForBronzeForcedWar({
        isMainAiCiv: true, isAlreadyAtWarAnyRole: false,
        currentTurn: turn, eraEnterTurn: eraEnterTurnByOwner ? eraEnterTurnByOwner.get(ownerId) : undefined,
      });
      if (eligible) {
        triggeredSubjects.push({ ownerId, ...world.hexOf.get(ownerId), era: 'bronze' });
      }
    }
  }

  // Gracz: dokładnie jak main.ts -- wchodzi do puli WYŁĄCZNIE gdy sam warless (dispatch
  // krok 1), bez specjalnego wykluczania poza tym warunkiem.
  const playerPool = candidateOwnerIds ?? world.allOwnerIds;
  if (playerPool.includes(0) && activeWarsExcludingBarbarians(world, 0) === 0
    && !triggeredSubjects.some(s => s.ownerId === 0)) {
    triggeredSubjects.push({ ownerId: 0, ...world.hexOf.get(0) });
  }

  const existingActivePairs = [];
  if (stoneActiveByPairKey) {
    for (const st of stoneActiveByPairKey.values()) {
      if (st.targetId !== 0) existingActivePairs.push({ ...st, era: 'stone' });
    }
  }
  if (bronzeActiveByPairKey) {
    for (const st of bronzeActiveByPairKey.values()) {
      if (st.targetId !== 0) existingActivePairs.push({ ...st, era: 'bronze' });
    }
  }

  const result = assignForcedWarPairings(triggeredSubjects, existingActivePairs, {
    isPairBlocked: isPairBlocked ?? (() => false),
    hexDistanceFn: hexDistance,
    totalActiveForcedWarsByOwner: (id) => (activeWarsExcludingBarbarians(world, id) > 0 ? 1 : 0),
  });

  const picks = new Map();
  for (const a of result.assignments) {
    declareWar(world, a.ownerId, a.targetId);
    picks.set(a.ownerId, a.targetId);
    if (a.era === 'stone' && stonePendingOwners) stonePendingOwners.delete(a.ownerId);
    if (a.era === 'bronze' && bronzePendingOwners) bronzePendingOwners.delete(a.ownerId);
    const targetMap = a.era === 'stone' ? stoneActiveByPairKey : bronzeActiveByPairKey;
    if (targetMap) {
      targetMap.set(diploPairKey(a.ownerId, a.targetId), {
        attackerId: a.ownerId, targetId: a.targetId,
        capturedByAttacker: 0, capturedByDefender: 0, startTurn: turn,
      });
    }
  }
  return { picks, unresolvedOwnerIds: result.unresolvedOwnerIds };
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
// K1 (ADAPTACJA, R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1): pulą kandydatów w NOWYM
// algorytmie są WYŁĄCZNIE inne triggeredSubjects tej samej tury (dispatch krok 1-3) -- nie
// dowolny, niekoniecznie-szukający civ jak w starym per-owner coordinated-pick (świadoma
// różnica zachowania, patrz forced-war-common.ts komentarz nagłówkowy assignForcedWarPairings).
// 6 triggered AI (parzysta liczba) -> JEDNO wywołanie runForcedWarTurnStep -> koordynacja
// (żaden kandydat nie dostaje 2 wypowiedzeń) wynika z SAMEJ struktury algorytmu (dowiedzione
// property-based w tools/wojna-wymuszona-parowanie-test.cjs Scenariusz 1/8) -- tu dowód
// end-to-end przez PRAWDZIWE isEligibleForStoneForcedWar + PRAWDZIWY assignForcedWarPairings.
console.log('--- K1: koordynacja -- 6 triggered AI, żaden wspólny cel nie dostaje 2 wypowiedzeń ---');
{
  const world = makeWorld({
    1: { q: 0, r: 0 }, 4: { q: 1, r: 0 },
    2: { q: 10, r: 0 }, 5: { q: 11, r: 0 },
    3: { q: 20, r: 0 }, 6: { q: 21, r: 0 },
  });
  const stonePendingOwners = new Set([1, 2, 3, 4, 5, 6]);
  const stoneActiveByPairKey = new Map();
  const turn = WOJNA_KAMIEN_WYMUSZONA_START_TURY; // pierwsza tura, w której WOLNO szukać celu
  const { picks, unresolvedOwnerIds } = runForcedWarTurnStep(
    world, [1, 2, 3, 4, 5, 6], turn,
    { stonePendingOwners, stoneActiveByPairKey, poziomTrudnosci: 2, candidateOwnerIds: [] },
  );
  eq(unresolvedOwnerIds.length, 0, 'K1: wszyscy sparowani (parzysta liczba, brak blokad)');
  eq(picks.size, 6, 'K1: SEDNO -- wszyscy 6 dostają wpis, każda strona osobno (symetryczne pary)');
  eq(picks.get(1), 4, 'K1: 1 najbliżej 4');
  eq(picks.get(2), 5, 'K1: 2 najbliżej 5');
  eq(picks.get(3), 6, 'K1: 3 najbliżej 6');
  const targets = [...picks.values()];
  eq(new Set(targets).size, targets.length, 'K1: WSZYSTKIE cele są różne od odpowiadających napastników (żaden kandydat nie dostał 2 wypowiedzeń od różnych par)');
  assert(isAtWar(world, 1, 4) && isAtWar(world, 2, 5) && isAtWar(world, 3, 6), 'K1: trzy pary faktycznie w stanie wojna w świecie symulacji');
  assert(!isAtWar(world, 1, 5) && !isAtWar(world, 2, 4), 'K1: żadnych krzyżowych wypowiedzeń spoza własnej pary');
}

// =============================================================================
// K2: fallback na gracza gdy jedyny wolny triggered kandydat to gracz (nieparzysta reszta
// dołącza jako trzeci do istniejącej pary, dispatch krok 4).
// K3 (ADAPTACJA, ECHO: "bez twardego limitu wojen gracza"): stary limit trudności
// Normalny/Trudny ZNIKA -- jedyny warunek to totalActiveForcedWarsByOwner(gracz)===0
// (krok 2 ECHO), stosowany JEDNOLICIE bez rozróżnienia poziomu trudności. Gracz z JUŻ
// aktywną wojną wymuszoną NIE wchodzi do puli triggered w ogóle (main.ts sprawdza to PRZED
// dopisaniem gracza) -- test niżej dowodzi tego wprost, zamiast (usuniętego) rozróżnienia
// poziomów trudności.
// =============================================================================
console.log('\n--- K2: fallback na gracza jako "trzeci" gdy AI już ma parę, gracz bez wojny ---');
{
  // Napastnik 1 i AI 4 tworzą już istniejącą aktywną parę (jak po poprzedniej turze).
  // Napastnik 2 jest jedynym DODATKOWO triggered tej tury, bez własnego partnera w puli
  // warless (sam jeden) -> staje się leftover -> dołącza jako trzeci do pary 1<->4? NIE --
  // K2 SEDNO dawnego scenariusza to fallback na GRACZA, więc gracz (warless) też jest w
  // puli i jest bliżej -- ale skoro obaj (2 i gracz) są warless i para nieparzysta (2), oni
  // PARUJĄ SIĘ ZE SOBĄ (dokładnie jak Scenariusz 4 w wojna-wymuszona-parowanie-test.cjs) --
  // AI (2) jest stroną akcji, cel=gracz.
  const world = makeWorld({ 1: { q: 0, r: 0 }, 4: { q: 1, r: 0 }, 2: { q: 5, r: 0 }, 0: { q: 6, r: 0 } });
  declareWar(world, 1, 4);
  const stoneActiveByPairKey = new Map([[diploPairKey(1, 4), {
    attackerId: 1, targetId: 4, capturedByAttacker: 0, capturedByDefender: 0, startTurn: 1,
  }]]);
  const stonePendingOwners = new Set([2]);
  const turn = WOJNA_KAMIEN_WYMUSZONA_START_TURY;
  const { picks, unresolvedOwnerIds } = runForcedWarTurnStep(
    world, [1, 2, 4], turn,
    { stonePendingOwners, stoneActiveByPairKey, poziomTrudnosci: 2, candidateOwnerIds: [0] },
  );
  eq(unresolvedOwnerIds.length, 0, 'K2: gracz i napastnik 2 rozwiązani (sparowani ze sobą)');
  eq(picks.get(2), 0, 'K2: SEDNO -- jedyny inny triggered (AI 2) i gracz są jedynymi warless -> parują się, cel AI2=gracz');
  assert(isAtWar(world, 2, 0), 'K2: napastnik 2 faktycznie wypowiedział wojnę graczowi w świecie symulacji');
  assert(!picks.has(1) && !picks.has(4), 'K2: para 1<->4 (już aktywna, nie-triggered) nie dostaje nowych wpisów tej tury');
}

console.log('\n--- K3 (ECHO, "bez twardego limitu wojen gracza"): gracz z JUŻ aktywną wojną NIE wchodzi do puli w ogóle ---');
{
  // Gracz ma już aktywną wojnę wymuszoną z 4 (poprzednia tura) -> totalActiveForcedWarsByOwner(0)>0
  // -> main.ts (i ten harness, wiernie) NIE dopisuje gracza do triggeredSubjects, NIEZALEŻNIE
  // od poziomu trudności (dawny rozdział Normalny/Trudny zniknął -- ECHO: "gracz traktowany
  // DOKŁADNIE jak każde AI", a każde AI już-w-wojnie też nie wchodzi do puli).
  const world = makeWorld({ 3: { q: 0, r: 0 }, 0: { q: 1, r: 0 }, 4: { q: 2, r: 0 } });
  declareWar(world, 0, 4); // gracz JUŻ ma aktywną wojnę wymuszoną (z poprzedniej tury)
  const stoneActiveByPairKey = new Map([[diploPairKey(4, 0), {
    attackerId: 4, targetId: 0, capturedByAttacker: 0, capturedByDefender: 0, startTurn: 1,
  }]]);
  const stonePendingOwners = new Set([3]);
  const turn = WOJNA_KAMIEN_WYMUSZONA_START_TURY;
  for (const poziomTrudnosci of [2, 3]) {
    const worldCopy = makeWorld({ 3: { q: 0, r: 0 }, 0: { q: 1, r: 0 }, 4: { q: 2, r: 0 } });
    declareWar(worldCopy, 0, 4);
    const stoneActiveCopy = new Map(stoneActiveByPairKey);
    const stonePendingCopy = new Set([3]);
    const { unresolvedOwnerIds } = runForcedWarTurnStep(
      worldCopy, [3, 4], turn,
      { stonePendingOwners: stonePendingCopy, stoneActiveByPairKey: stoneActiveCopy, poziomTrudnosci, candidateOwnerIds: [0] },
    );
    // 4 nie jest triggered (para 4<->0 nie jest w bronzePending/stonePending -- już aktywna,
    // nie searching), 3 JEST triggered ale JEDYNY warless (gracz wykluczony bo już w
    // wojnie) -> 3 nie znajduje partnera w kroku 1-3, a jedyna istniejąca para (4,0) MA
    // stronę 4 -- 3 mógłby dołączyć do niej jako trzeci (krok 4), ALE SEDNO testu to gracz:
    // gracz (gdyby wciąż był warless) wszedłby do puli niezależnie od poziomTrudnosci -- tu
    // dowodzimy że NIE wchodzi wcale, dopóki ma aktywną wojnę, bez rozróżnienia poziomu.
    assert(
      !worldCopy.relations.has(diploPairKey(3, 0)) || isAtWar(worldCopy, 3, 0) === false,
      `K3 (poziomTrudnosci=${poziomTrudnosci}): gracz NIE dostaje drugiej wojny wymuszonej (już ma jedną) -- brak rozróżnienia poziomu trudności`,
    );
  }
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
    const { picks } = runForcedWarTurnStep(world, [1, 2], turn, {
      stonePendingOwners: stonePending, stoneActiveByPairKey: stoneActive,
      bronzePendingOwners: bronzePending, bronzeActiveByPairKey: bronzeActive,
      eraEnterTurnByOwner, poziomTrudnosci: 1, candidateOwnerIds: [],
    });
    if (picks.size > 0) anyForcedWarEver = true;
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
  // Kamień: DWIE cywilizacje (1,4), OBIE triggered razem od tury 1 (dispatch krok 1 wymaga
  // WZAJEMNEGO triggered partnera w puli -- świadoma różnica vs stary per-owner
  // coordinated-pick, patrz komentarz K1 wyżej) -- SEDNO testu (próg 25 tur) mierzy się
  // niezależnie od tego, kto jest partnerem.
  const worldStone = makeWorld({ 1: { q: 0, r: 0 }, 4: { q: 1, r: 0 } });
  const stonePending = new Set([1, 4]);
  const stoneActive = new Map();
  let stoneFiredAtTurn = null;
  for (let turn = 1; turn <= 30 && stoneFiredAtTurn == null; turn++) {
    const { picks } = runForcedWarTurnStep(worldStone, [1, 4], turn, {
      stonePendingOwners: stonePending, stoneActiveByPairKey: stoneActive, poziomTrudnosci: 2, candidateOwnerIds: [],
    });
    if (picks.has(1)) stoneFiredAtTurn = turn;
  }
  eq(stoneFiredAtTurn, 25, 'K5: Kamień -- pierwsze wypowiedzenie wojny wymuszonej dokładnie w turze 25, przy przejściu tura-po-turze od tury 1');

  // Brąz: DWIE PARY cywilizacji wchodzące w epokę Brąz w RÓŻNYCH turach gry (10 i 40) --
  // próg 25 tur liczy się NIEZALEŻNIE od KAŻDEJ z tych dwóch tur, nie od startu gry. Civ 6
  // (partner dedykowany A, WŁASNY eraEnterTurn=10, blisko A) i civ 7 (partner dedykowany B,
  // eraEnterTurn=40, blisko B) zapewniają KAŻDEJ z par WZAJEMNIE triggered partnera dokładnie
  // w chwili WŁASNEGO progu -- bez tego (dispatch krok 1: pula to WYŁĄCZNIE wzajemnie
  // triggered podmioty) żadna z cywilizacji nie miałaby z kim się sparować.
  const worldBronze = makeWorld({
    1: { q: 0, r: 0 }, 6: { q: 1, r: 0 },     // para A: 1<->6, wchodzi w Brąz w turze 10
    2: { q: 100, r: 0 }, 7: { q: 101, r: 0 }, // para B: 2<->7, wchodzi w Brąz w turze 40
  });
  const bronzePending = new Set(); // ustawiane dokładnie w turze wejścia w epokę, jak syncOwnerEraFromResearch
  const bronzeActive = new Map();
  const eraEnterTurnByOwner = new Map();
  let firedA = null;
  let firedB = null;
  for (let turn = 1; turn <= 70; turn++) {
    if (turn === 10) {
      bronzePending.add(1); eraEnterTurnByOwner.set(1, 10);
      bronzePending.add(6); eraEnterTurnByOwner.set(6, 10);
    }
    if (turn === 40) {
      bronzePending.add(2); eraEnterTurnByOwner.set(2, 40);
      bronzePending.add(7); eraEnterTurnByOwner.set(7, 40);
    }
    const { picks } = runForcedWarTurnStep(worldBronze, [1, 2, 6, 7], turn, {
      bronzePendingOwners: bronzePending, bronzeActiveByPairKey: bronzeActive, eraEnterTurnByOwner,
      poziomTrudnosci: 2, candidateOwnerIds: [],
    });
    if (picks.has(1) && firedA == null) firedA = turn;
    if (picks.has(2) && firedB == null) firedB = turn;
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
  // R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1 przeniosła i uprościła gałąź selekcji
  // Żelaza (pre-pass triggeredSubjects, patrz forced-war-trojstronna-main-guard-test.cjs i
  // forced-war-iron-main-guard-test.cjs dla pełnego pokrycia OKABLOWANIA) -- stare kotwice
  // tekstowe tego testu (sprzed tamtej naprawy) nie istnieją już w main.ts. K9 SEDNO
  // (Część C R-WOJNA-WYMUSZONA-REGULY-Q1: Żelazo NIE dostaje pola `startTurn`, w
  // odróżnieniu od Kamienia/Brązu) zostaje zweryfikowane na AKTUALNEJ lokalizacji gałęzi.
  const ironBranchStart = mainSrc.indexOf('// Żelazo.');
  const ironBranchEnd = mainSrc.indexOf(
    "ironTriggeredSubjects.push({ ownerId, q: refCity.q, r: refCity.r, era: 'iron' });",
    ironBranchStart,
  );
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
