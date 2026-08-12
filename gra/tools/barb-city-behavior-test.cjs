'use strict';
/**
 * barb-city-behavior-test.cjs -- standalone Node test for difficulty-dependent
 * barbarian-vs-city behaviour (P-BARBARZYNCY-MIASTA-ZACHOWANIE-Q1=A, ECHO Maciej
 * 2026-08-12).
 * Run from gra/:  node tools/barb-city-behavior-test.cjs
 *
 * Właściciel (cytat): "zazwyczaj po zabiciu jednostek stoją obok, a powinni łupić.
 * Mamy trzy poziomy trudności dla barbarzyńców. Przy najwyższym powinni zajmować
 * miasta. Przy najniższym robić dokładnie to, co robią teraz. Na średnim poziomie
 * jeżeli jedno miasto udaje mi się zniszczyć jednostki idą do kolejnego miasta."
 *
 * Trzy poziomy = ISTNIEJĄCY suwak trudności gry (_menuDifficulty), nie nowe
 * ustawienie (opcja A, zaakceptowana).
 *
 * RUNDA 2 (Evaluator, jednomyślny FAIL 3/3 na rundzie 1 -- P-BARBARZYNCY-MIASTA-
 * ZACHOWANIE-Q1): sekcje 2/3 przepisane -- pierwsza wersja filtra wykluczała
 * WSZYSTKIE niebronione miasta GLOBALNIE (dla każdej jednostki), co: (a) mroziło
 * jednostki raid-ready na stałe, gdy WSZYSTKIE miasta w zasięgu były niebronione
 * (pusta lista celów, krok 4 "drift do domu" pominięty dla raid-ready); (b) kazało
 * jednostce po oczyszczeniu miasta A iść do OBOZU zamiast do miasta B, bo B (i każde
 * inne niebronione miasto) też było globalnie wykluczone. Naprawa: wykluczenie
 * PER JEDNOSTKA (`unit.recentlyClearedCityId`) + jawny fallback na pełną listę, gdy
 * przefiltrowana lista wyszłaby pusta. Sekcja 5 przepisana z source-text .includes()
 * na REALNE WYKONANIE wyciągniętych funkcji (shouldAllowBarbCityCapture,
 * isCityCaptureBlockedByDefenders) + asercja parytetu gracz(0)/AI(1).
 *
 * Sekcje:
 *   1. decideBarbarianMoves -- easy (bez param. `difficulty` ORAZ z difficulty='easy')
 *      = zachowanie LEGACY, bit-identyczne: miasto bez obrońców dalej jest celem
 *      "chase" (punkt zadania (a): "żadna nowa gałąź kodu się nie uruchamia").
 *   2. decideBarbarianMoves -- normal: wykluczenie PER JEDNOSTKA (nie globalne) +
 *      "idzie do kolejnego miasta" po jednej turze pamięci + izolacja między jednostkami.
 *   3. decideBarbarianMoves -- hard: własne (już przejęte) miasto barbarzyńców nigdy
 *      nie jest celem (niezależnie od pamięci) + fallback na pustą listę (punkt 2) +
 *      regres freeze dla jednostki raid-ready (punkt 2, dosłowny scenariusz błędu).
 *   4. applyPostBattleMap + applyCityCaptureAfterBattle z atkOwner=BARBARIAN_OWNER_ID
 *      -- DOWÓD WYKONYWALNY (nie tylko analiza Fazy 1) że silnikowy prymityw
 *      przejęcia miasta akceptuje ownerId=-1 bez wywrotki i poprawnie zmienia
 *      city.ownerId (punkt zadania (c), część "miasto zmienia ownerId TYLKO gdy
 *      oczyszczone z obrońców" zweryfikowana jako precondition przed capture).
 *   5. REALNE WYKONANIE (nie source-text): shouldAllowBarbCityCapture (bramka trudności)
 *      + isCityCaptureBlockedByDefenders (bramka "oczyszczone do zera") wywołane
 *      bezpośrednio, włącznie z asercją parytetu ownerId=0 (gracz) vs ownerId=1 (AI) --
 *      identyczny scenariusz musi dać identyczny wynik. Plus lekka weryfikacja
 *      okablowania main.ts (main.ts faktycznie WOŁA te funkcje, nie zawiera logiki
 *      inline) -- jedyne miejsce w tym pliku, gdzie source-text jest uzasadniony
 *      (main.ts nie jest bundlowany, patrz niżej), i tylko dla "czy woła", nie "czy
 *      logika jest poprawna" (to sprawdza realne wykonanie wyżej).
 *
 * main.ts NIE jest bundlowany (monolityczny plik z zależnościami DOM/THREE -- ten
 * sam ograniczenie co w barb-camp-destruction-test.cjs) -- sekcja 5 nadal zawiera
 * DROBNĄ weryfikację okablowania przez source-text (main.ts woła wyciągnięte
 * funkcje), ale CAŁA logika decyzyjna jest teraz wykonywana naprawdę przez bundel
 * barbarians.ts, identycznie jak main.ts by ją wywołał.
 *
 * RUNDA 3 (Evaluator A/B/C jednomyślny FAIL na rundzie 2, finalny zakres A+B+C):
 *   6. Punkt 2 (livelock): `unit.recentlyClearedCityId` zapisywane DOPIERO po
 *      faktycznym dotarciu (hexDistance<=1) do celu, nie na podstawie samego
 *      wyboru celu w danej turze. >=6 kolejnych decyzji z REALNIE stosowanym
 *      ruchem (`unit.q/r` aktualizowane z komendy `move`, bramkowane przez
 *      `canUnitOccupyCityHex` -- dokładnie tak jak main.ts:26258 aplikuje komendy
 *      barbarzyńców), dwa warianty (drugie miasto BRONIONE/NIEBRONIONE). Asercja:
 *      dystans do aktualnego celu monotonicznie maleje w każdej z dwóch faz
 *      (dojście do miasta A, potem do miasta B), bez cofnięcia w trakcie fazy.
 *   7. Punkt 4: `applyCityCaptureAfterBattle` z atkOwner barbarzyńskim NIE kasuje
 *      `city.rebelPreviousOwnerId` (guard `!isBarbarian(atkOwner)` w
 *      post-battle-map.ts pomija `applyPostCaptureLawOnCapture` dla barbarzyńców)
 *      + z atkOwner gracz/AI (nie-barbarzyńca) bonus Prawa po podboju nadal się
 *      poprawnie ustawia (postCaptureLawTurnsRemaining, revoltRisk=0 przez
 *      applyPostCaptureLawOverride) -- REALNE WYKONANIE, nie source-text.
 *
 * RUNDA 4 (3x jednomyślny Evaluator FAIL na rundach 1-3, powód: pojedynczy slot
 * `unit.recentlyClearedCityId` strukturalnie nie mógł wyrazić "odwiedziłem już A i B" --
 * zapis B kasował A, wahadło A<->B w nieskończoność, trzecie miasto NIGDY nie było
 * odwiedzane w 30 turach; RUNDA 3 tylko WYDŁUŻYŁA okres wahadła, nie usunęła go).
 * NAPRAWA: pojedynczy slot zastąpiony ZBIOREM `unit.clearedCityIds: string[]` (tablica,
 * NIE `Set` -- patrz doc-comment BarbUnit w barbarians.ts, `deserializeGame` nie ma
 * revivera odwrotnego do `setAwareReplacer`). Fallback z rundy 2 NIEZMIENIONY; gdy zbiór
 * wyklucza WSZYSTKIE dostępne miasta (jednostka odwiedziła każde), zbiór jest RESETOWANY
 * -- patrol zaczyna kolejne okrążenie zamiast zamarznąć na trwale pełnym zbiorze. WYNIK:
 * "ograniczony patrol" (odwiedza wszystkie niebronione miasta po kolei, cyklicznie), NIE
 * pełne zakończenie -- main.ts:26273 pokazuje, że przejęcie miasta idzie WYŁĄCZNIE przez
 * `attack` na przyległego wroga; niebronione miasto nie ma czego atakować, więc nie ma
 * dla tej jednostki stanu terminalnego (otwarte ABC "puste miasto trwale odporne na
 * przejęcie", poza zakresem tej rundy).
 *   6. PRZEPISANA W CAŁOŚCI. 6a: regresja "arrival przy mieście BRONIONYM -> atak,
 *      zbiór nietknięty" (przeniesiona z dawnej wersji sekcji 6). 6b: WŁAŚCIWY dowód --
 *      symulacja >=30 kolejnych decyzji na 3 miastach NIEBRONIONYCH, asercje objmujące
 *      KAŻDY wpis PEŁNEGO logu (partycja na "legi" pokrywa 100% długości, nie prefiks/
 *      faza/okno -- DOKŁADNIE wzorzec, który złapał 3 poprzednie rundy): (a) każde z 3
 *      miast odwiedzone; (b) po odwiedzeniu WSZYSTKICH 3 zbiór resetuje się i PRZYNAJMNIEJ
 *      jedno miasto zostaje odwiedzone PONOWNIE (dowód behawioralny cyklu, nie tylko stanu
 *      wewnętrznego); (c) dystans do bieżącego celu nie rośnie w żadnym legu (z tolerancją
 *      na jeden hex-gridowy "plateau" z routingu Dijkstry), net-postęp na każdym legu.
 *   8. NOWA. Save/load: `clearedCityIds` przechodzi round-trip serializeGame-
 *      >deserializeGame identycznie jak `campId`/`healthFrac` (REALNE WYKONANIE, nie
 *      source-text) -- w tym dowód, dlaczego pole jest `string[]`, nie `Set` (Set wyszedłby
 *      jako zwykła tablica po wczytaniu, `setAwareReplacer` nie ma odwrotnego revivera).
 *   9. NOWA. Dowód mutacyjny (self-check, wzorzec `--self-check-skip-mutation` identyczny
 *      do barb-camp-destruction-test.cjs sekcja 9): cofnięcie CAŁEJ naprawy tej rundy do
 *      stanu RUNDY 3 (pojedynczy slot zamiast zbioru) MUSI dać czerwono na sekcji 6b --
 *      potwierdzone: 26/120 asercji czerwonych, `cityC` nigdy nie odwiedzone, `revisited=[]`.
 */

const fs   = require('fs');
const path = require('path');

function hexDist(aq, ar, bq, br) {
  const dq = Math.abs(aq - bq);
  const dr = Math.abs(ar - br);
  const ds = Math.abs((-aq - ar) - (-bq - br));
  return Math.max(dq, dr, ds);
}

// --- esbuild -----------------------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[barb-city-behavior-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT    = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.barb-city-behavior-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.barb-city-behavior-bundle.cjs');

const ENTRY_TS = `
export {
  BARBARIAN_OWNER_ID, isBarbarian, FALLBACK_BARB_PARAMS, decideBarbarianMoves,
  shouldAllowBarbCityCapture, isCityCaptureBlockedByDefenders,
} from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/barbarians'))};
export {
  applyPostBattleMap, applyCityCaptureAfterBattle,
} from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/post-battle-map'))};
export {
  canUnitOccupyCityHex,
} from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/city-hex-movement'))};
export {
  isPostCaptureLawActive, applyPostCaptureLawOverride,
  POST_CAPTURE_FRESH_TURNS, POST_CAPTURE_REBELLION_RECONQUEST_TURNS,
  REBEL_FACTION_OWNER_ID,
} from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/post-capture-law'))};
export { evaluateOrderFromBreakdown } from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/society-breakdown'))};
export {
  serializeGame, deserializeGame,
} from ${JSON.stringify(path.join(GRA_ROOT, 'src/game/save'))};
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
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[barb-city-behavior-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const B = require(BUNDLE_FILE);
const {
  BARBARIAN_OWNER_ID, FALLBACK_BARB_PARAMS, decideBarbarianMoves,
  applyPostBattleMap, applyCityCaptureAfterBattle,
  shouldAllowBarbCityCapture, isCityCaptureBlockedByDefenders,
  canUnitOccupyCityHex,
  isPostCaptureLawActive, applyPostCaptureLawOverride,
  POST_CAPTURE_FRESH_TURNS, POST_CAPTURE_REBELLION_RECONQUEST_TURNS,
  REBEL_FACTION_OWNER_ID,
  evaluateOrderFromBreakdown,
  serializeGame, deserializeGame,
} = B;

// --- tiny assertion framework --------------------------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// --- helpers --------------------------------------------------------------------------------
function barb(id, q, r, extra = {}) {
  return Object.assign({
    id, ownerId: BARBARIAN_OWNER_ID, typeId: 'Wojownik', category: 'miecznik',
    q, r, ruch: 2, ruchLeft: 2,
  }, extra);
}
function enemy(id, q, r, extra = {}) {
  return Object.assign({
    id, ownerId: 0, typeId: 'Hastati', category: 'miecznik',
    q, r, ruch: 2, ruchLeft: 2,
  }, extra);
}
function city(id, q, r, extra = {}) {
  return Object.assign({ id, q, r, ownerId: 0, name: id }, extra);
}
function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      hexes[k] = {
        coords: { q, r },
        terenBazowy: 'laka',
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}

const P = Object.assign({}, FALLBACK_BARB_PARAMS, { aggroRadius: 6 });

// ============================================================================================
// 1. easy (undefined AND explicit 'easy') -- LEGACY: defenseless city stays a valid chase
//    target -- barbarian at q=5 picks the CLOSER undefended city to the west (q=2),
//    ignoring the farther defended city to the east (q=9). Punkt zadania (a).
// ============================================================================================
{
  const map = makeMap(15, 3);
  // cityWest: NO garrison (undefended) -- distance 3, closer.
  // cityEast: garrison `g` on its hex -- distance 4, farther.
  const cityWest = city('cityWest', 2, 0);
  const cityEast = city('cityEast', 9, 0);
  const g = enemy('g', 9, 0);

  for (const diffArg of [[], ['easy']]) {
    const label = diffArg[0] ?? 'omitted';
    const b = barb('b1', 5, 0);
    const cmds = decideBarbarianMoves([b], [g], [cityWest, cityEast], [], map, P, undefined, ...diffArg);
    eq(cmds.length, 1, `1 (difficulty=${label}): exactly one move command`);
    const cmd = cmds[0];
    eq(cmd?.type, 'move', `1 (difficulty=${label}): command is a move`);
    const dWestBefore = hexDist(b.q, b.r, cityWest.q, cityWest.r);
    const dWestAfter = hexDist(cmd.toQ, cmd.toR, cityWest.q, cityWest.r);
    const dEastBefore = hexDist(b.q, b.r, cityEast.q, cityEast.r);
    const dEastAfter = hexDist(cmd.toQ, cmd.toR, cityEast.q, cityEast.r);
    assert(dWestAfter < dWestBefore,
      `1 (difficulty=${label}): step gets closer to the closer, defenseless cityWest ` +
      `(before=${dWestBefore}, after=${dWestAfter}) -- easy chases a defenseless city exactly like today`);
    assert(dEastAfter >= dEastBefore,
      `1 (difficulty=${label}): step does NOT get closer to the farther, defended cityEast ` +
      `(before=${dEastBefore}, after=${dEastAfter})`);
  }
}

// ============================================================================================
// 2. normal -- RUNDA 2: wykluczenie PER JEDNOSTKA, nie globalne. Trzy scenariusze na tej samej
//    geometrii (cityWest niebronione q=2, cityEast bronione przez `g` q=9,
//    jednostka startuje q=3 -- PRZYLEGŁA do cityWest, dist=1):
//    RUNDA 3 (livelock fix): jednostka startuje PRZYLEGLE do cityWest celowo -- od tej rundy
//    `recentlyClearedCityId` zapisuje się DOPIERO po realnym dotarciu (hexDistance<=1), nie na
//    podstawie samego wyboru celu (patrz sekcja 6 niżej dla testu z dystansu i realnym ruchem
//    między turami). Ten scenariusz (start przyległy) nadal weryfikuje sam mechanizm pamięci
//    per-jednostkowej jedną decyzją, bez potrzeby symulowania wielu tur marszu.
//    2a. Świeża jednostka (bez pamięci), już PRZYLEGŁA do niebronionego cityWest -- dotarcie
//        następuje od razu, memory zapisuje się TĄ SAMĄ decyzją (punkt 3: nie wszystkie
//        niebronione miasta globalnie, tylko to, co ta jednostka faktycznie napotkała).
//    2b. TA SAMA jednostka, druga decyzja (symulacja kolejnej tury, pozycja niezmieniona) --
//        decideBarbarianMoves zapamiętał cityWest jako "niebronione, napotkane" przy 2a
//        (unit.recentlyClearedCityId), więc TERAZ wyklucza je i celuje w cityEast zamiast
//        tkwić w miejscu -- "jeżeli jedno miasto udaje mi się zniszczyć jednostki idą do
//        kolejnego miasta" (cytat właściciela), zastosowane też do "miasto okazało się
//        nie do zdobycia" (blokada wejścia bez obrońcy do zabicia).
//    2c. INNA, świeża jednostka na identycznej geometrii -- NIE dziedziczy pamięci b1,
//        znowu celuje w bliższe cityWest -- dowód, że wykluczenie jest PER JEDNOSTKA, nie
//        globalne (naprawia oscylację przy przesuwaniu jednego garnizonu między miastami:
//        pamięć jednej jednostki nie wpływa na decyzje innej).
// ============================================================================================
{
  const map = makeMap(15, 3);
  const cityWest = city('cityWest', 2, 0);
  const cityEast = city('cityEast', 9, 0);
  const g = enemy('g', 9, 0);

  // 2a
  const b1 = barb('b1', 3, 0);
  eq(b1.clearedCityIds, undefined, '2a: fresh unit starts with no memory');
  const cmdsA = decideBarbarianMoves([b1], [g], [cityWest, cityEast], [], map, P, undefined, 'normal');
  eq(cmdsA.length, 1, '2a normal: exactly one move command');
  eq(cmdsA[0]?.type, 'move', '2a normal: command is a move');
  {
    const dWestBefore = hexDist(b1.q, b1.r, cityWest.q, cityWest.r);
    const dWestAfter = hexDist(cmdsA[0].toQ, cmdsA[0].toR, cityWest.q, cityWest.r);
    assert(dWestAfter < dWestBefore,
      `2a normal: a FRESH unit still chases the closer, never-before-seen defenceless cityWest ` +
      `(before=${dWestBefore}, after=${dWestAfter}) -- point 3: exclusion is per-unit memory, ` +
      `not "any currently undefended city"`);
  }
  eq(JSON.stringify(b1.clearedCityIds), JSON.stringify(['cityWest']),
    '2a normal: decideBarbarianMoves remembers cityWest in the SET ON b1 after this decision (RUNDA 4)');

  // 2b -- same unit, same position, second call: cityWest now excluded FOR b1.
  const cmdsB = decideBarbarianMoves([b1], [g], [cityWest, cityEast], [], map, P, undefined, 'normal');
  eq(cmdsB.length, 1, '2b normal: exactly one move command (unit does not freeze)');
  eq(cmdsB[0]?.type, 'move', '2b normal: command is a move');
  {
    const dEastBefore = hexDist(b1.q, b1.r, cityEast.q, cityEast.r);
    const dEastAfter = hexDist(cmdsB[0].toQ, cmdsB[0].toR, cityEast.q, cityEast.r);
    const dWestBefore = hexDist(b1.q, b1.r, cityWest.q, cityWest.r);
    const dWestAfter = hexDist(cmdsB[0].toQ, cmdsB[0].toR, cityWest.q, cityWest.r);
    assert(dEastAfter < dEastBefore,
      `2b normal: on the SECOND decision the SAME unit moves toward the defended cityEast instead ` +
      `(before=${dEastBefore}, after=${dEastAfter}) -- "goes to the next city" once cityWest turned ` +
      `out un-enterable`);
    assert(dWestAfter >= dWestBefore,
      `2b normal: does NOT step toward the now-excluded cityWest (before=${dWestBefore}, after=${dWestAfter})`);
  }

  // 2c -- a DIFFERENT, fresh unit on the identical geometry: unaffected by b1's memory.
  const b2 = barb('b2', 3, 0);
  const cmdsC = decideBarbarianMoves([b2], [g], [cityWest, cityEast], [], map, P, undefined, 'normal');
  eq(cmdsC.length, 1, '2c normal: exactly one move command for the second, independent unit');
  {
    const dWestBefore = hexDist(b2.q, b2.r, cityWest.q, cityWest.r);
    const dWestAfter = hexDist(cmdsC[0].toQ, cmdsC[0].toR, cityWest.q, cityWest.r);
    assert(dWestAfter < dWestBefore,
      `2c normal: a DIFFERENT fresh unit (b2) still targets the closer cityWest, unaffected by b1's ` +
      `memory -- exclusion is per-unit, not global (before=${dWestBefore}, after=${dWestAfter})`);
  }
  eq(JSON.stringify(b2.clearedCityIds), JSON.stringify(['cityWest']),
    "2c normal: b2 builds its OWN set, independent of b1's (RUNDA 4)");
}

// ============================================================================================
// 3. hard -- own (barbarian-owned) city always excluded regardless of memory/difficulty +
//    RUNDA 2 regressions for points 2/3: empty-filtered-list fallback, and the literal
//    raid-ready freeze bug (a raid-ready unit whose only candidate city is both barbarian-
//    owned-excluded-N/A and already-remembered-undefended must still get a command, never
//    silently emit nothing).
// ============================================================================================
{
  const map = makeMap(15, 3);

  // 3a. Own captured city excluded outright (isBarbarian filter) -- independent of the
  // per-unit memory mechanism, still a hard regression guard.
  const ownCapturedCity = city('ownCity', 2, 0, { ownerId: BARBARIAN_OWNER_ID }); // closer, but barb-owned
  const cityEast = city('cityEast', 9, 0); // farther, but real + defended
  const gEast = enemy('gEast', 9, 0);
  const b1 = barb('b1', 5, 0);
  const cmds1 = decideBarbarianMoves([b1], [gEast], [ownCapturedCity, cityEast], [], map, P, undefined, 'hard');
  eq(cmds1.length, 1, '3a hard: exactly one move command');
  {
    const dEastBefore = hexDist(b1.q, b1.r, cityEast.q, cityEast.r);
    const dEastAfter = hexDist(cmds1[0].toQ, cmds1[0].toR, cityEast.q, cityEast.r);
    assert(dEastAfter < dEastBefore,
      `3a hard: targets the real, defended cityEast, never the barbarian-owned ownCity ` +
      `(before=${dEastBefore}, after=${dEastAfter})`);
  }

  // 3b. RUNDA 2 point 2: filtered-list-would-be-empty fallback. Only ONE non-barbarian city
  // exists, it is undefended, AND this exact unit already remembers it (simulating "next
  // turn" after clearing it) -- the per-unit filter alone would exclude it, leaving the
  // candidate pool empty; the fallback must still target it rather than emit nothing.
  const onlyCity = city('onlyCity', 9, 0, { ownerId: 0 }); // no garrison
  const b2 = barb('b2', 5, 0, { clearedCityIds: ['onlyCity'] });
  const cmds2 = decideBarbarianMoves([b2], [], [ownCapturedCity, onlyCity], [], map, P, undefined, 'hard');
  eq(cmds2.length, 1,
    '3b hard (point 2 fallback): unit still gets a move command when the per-unit filter would ' +
    'leave zero candidates -- the filter is skipped for this decision instead of freezing the unit');
  eq(cmds2[0]?.type, 'move', '3b hard: command is a move');
  {
    const dBefore = hexDist(b2.q, b2.r, onlyCity.q, onlyCity.r);
    const dAfter = hexDist(cmds2[0].toQ, cmds2[0].toR, onlyCity.q, onlyCity.r);
    assert(dAfter < dBefore,
      `3b hard: the fallback-selected target is the only real city, onlyCity (before=${dBefore}, after=${dAfter})`);
  }

  // 3c. RUNDA 2 point 2, LITERAL regression: a raid-ready unit (chaseRadius=Infinity, skips
  // step 4 "drift home") whose only candidate is already-remembered-undefended must NOT
  // freeze with zero commands. `campId` pointing at a camp absent from `camps` -> orphaned ->
  // raidReady=true (see decideBarbarianMoves step-3 comment) -- no camps needed to set this up.
  const b3 = barb('b3', 5, 0, { campId: 'destroyed-camp', clearedCityIds: ['onlyCity'] });
  const cmds3 = decideBarbarianMoves([b3], [], [onlyCity], [], map, P, undefined, 'hard');
  eq(cmds3.length, 1,
    '3c hard (point 2, raid-ready freeze regression): a raid-ready unit with only an already-' +
    'remembered undefended city as a candidate still receives a move command instead of freezing');
  eq(cmds3[0]?.type, 'move', '3c hard: command is a move, not silently nothing');
}

// ============================================================================================
// 4. applyPostBattleMap + applyCityCaptureAfterBattle with a BARBARIAN attacker -- executable
//    proof (Faza 1) that the reused player/AI capture primitive tolerates ownerId=-1, and that
//    the "cleared to zero defenders" precondition actually holds after an ATK win at a city
//    center (wipeDefenderOnCityCenter is unconditional on ATK win, independent of capture opts).
// ============================================================================================
{
  const barbCityUnits = [
    barb('bc0', 10, 22),
    { id: 'e0', ownerId: 1, typeId: 'Falanga', category: 'wlocznik', q: 11, r: 22, ruchLeft: 0 },
  ];
  const barbCity = { id: 'barbcap', ownerId: 1, q: 11, r: 22, name: 'Podbite' };
  const barbAnchor = barbCityUnits[0];

  applyPostBattleMap({
    units: barbCityUnits,
    map: { hexes: {} },
    cities: [barbCity],
    battleQ: 11,
    battleR: 22,
    atkAnchor: barbAnchor,
    atkRoster: [barbAnchor],
    defRoster: [barbCityUnits[1]],
    atkStart: new Map([['bc0', { q: 10, r: 22 }]]),
    winner: 'atakujacy',
    lossAtkPct: 0,
    lossDefPct: 1,
    getDef: () => ({ Health: 100 }),
    maxHpOf: () => 100,
    isPassableHex: () => true,
    isUnitAt: () => false,
    cityOnBattleHex: barbCity,
  });

  // Precondition for hard-mode capture (isCityCaptureBlockedByDefenders, section 5): zero
  // non-barbarian units remain on the city hex after the barbarian's ATK win.
  const remainingDefenders = barbCityUnits.filter(
    u => u.q === 11 && u.r === 22 && u.ownerId !== BARBARIAN_OWNER_ID,
  );
  eq(remainingDefenders.length, 0, '4: defender fully wiped from city hex after barbarian ATK win');

  const barbOnHex = barbCityUnits.find(u => u.id === 'bc0');
  assert(barbOnHex.q === 11 && barbOnHex.r === 22, '4: barbarian anchor moved onto the city hex after winning');
  eq(barbCity.ownerId, 1, '4: applyPostBattleMap alone never changes city ownership (capture is a separate step)');

  // Faza 1 core claim, executed: the SAME primitive player/AI capture already uses accepts
  // BARBARIAN_OWNER_ID as newOwner without throwing, and sets city.ownerId correctly.
  let threw = null;
  try {
    applyCityCaptureAfterBattle(barbCity, [barbAnchor], BARBARIAN_OWNER_ID, barbCityUnits, barbAnchor.id);
  } catch (e) {
    threw = e;
  }
  assert(threw === null, `4 Faza1: applyCityCaptureAfterBattle(ownerId=-1) does not throw (threw: ${threw})`);
  eq(barbCity.ownerId, BARBARIAN_OWNER_ID, '4 Faza1: city.ownerId becomes BARBARIAN_OWNER_ID (-1) after capture');
  const barbOnHexAfterCapture = barbCityUnits.find(u => u.id === 'bc0');
  assert(barbOnHexAfterCapture.q === 11 && barbOnHexAfterCapture.r === 22,
    '4: barbarian anchor remains on the captured city hex after ownership change');
}

// ============================================================================================
// 5. RUNDA 2 (Evaluator, punkt 5) -- REALNE WYKONANIE zamiast source-text .includes(). Trzy
//    niezależne mutacje Evaluatorów rundy 1 (miasta gracza trwale odporne na capture; usunięty
//    argument trudności; capture przerobiony na no-op) przechodziły 36/36 niezauważone, bo
//    dawna sekcja 5 sprawdzała WYŁĄCZNIE obecność fragmentów tekstu w main.ts. Teraz obie
//    wyciągnięte funkcje są wołane BEZPOŚREDNIO z realnymi argumentami.
// ============================================================================================
{
  // --- 5a. shouldAllowBarbCityCapture -- bramka trudności, realne wykonanie. ---
  eq(shouldAllowBarbCityCapture('easy'), false, '5a: easy -- capture not allowed');
  eq(shouldAllowBarbCityCapture('normal'), false, '5a: normal -- capture not allowed');
  eq(shouldAllowBarbCityCapture('hard'), true, '5a: hard -- capture allowed');

  // --- 5b. isCityCaptureBlockedByDefenders -- realne wykonanie, kilka scenariuszy. ---
  const unitsClearedHex = [
    { id: 'atk', ownerId: BARBARIAN_OWNER_ID, q: 5, r: 5 },
  ];
  eq(isCityCaptureBlockedByDefenders(BARBARIAN_OWNER_ID, unitsClearedHex, 5, 5), false,
    '5b: barbarian attacker, hex cleared of every non-barbarian unit -- NOT blocked');

  const unitsWithDefenderLeft = [
    { id: 'atk', ownerId: BARBARIAN_OWNER_ID, q: 5, r: 5 },
    { id: 'survivor', ownerId: 0, q: 5, r: 5 },
  ];
  eq(isCityCaptureBlockedByDefenders(BARBARIAN_OWNER_ID, unitsWithDefenderLeft, 5, 5), true,
    '5b: barbarian attacker, a non-barbarian unit STILL stands on the hex -- blocked');

  const unitsDefenderElsewhere = [
    { id: 'atk', ownerId: BARBARIAN_OWNER_ID, q: 5, r: 5 },
    { id: 'other', ownerId: 0, q: 9, r: 9 },
  ];
  eq(isCityCaptureBlockedByDefenders(BARBARIAN_OWNER_ID, unitsDefenderElsewhere, 5, 5), false,
    '5b: a non-barbarian unit exists but NOT on the battle hex -- not blocked');

  // --- 5c. Parity: player (ownerId=0) and AI (ownerId=1) attackers must give an IDENTICAL
  // result to the same scenario -- isCityCaptureBlockedByDefenders returns `false` immediately
  // for ANY non-barbarian attacker (see the early `!isBarbarian` guard), so it structurally
  // cannot distinguish the player from AI. No divergence found -- nothing to flag separately.
  const sharedUnits = [
    { id: 'atk', ownerId: 0, q: 5, r: 5 },
    { id: 'garrison', ownerId: 3, q: 5, r: 5 },
  ];
  const resultAsPlayer = isCityCaptureBlockedByDefenders(0, sharedUnits, 5, 5);
  const resultAsAi = isCityCaptureBlockedByDefenders(1, sharedUnits, 5, 5);
  eq(resultAsPlayer, false, '5c parity: non-barbarian attacker (player, ownerId=0) never blocked by this gate');
  eq(resultAsAi, false, '5c parity: non-barbarian attacker (AI, ownerId=1) never blocked by this gate');
  eq(resultAsPlayer, resultAsAi,
    '5c parity: identical scenario with ownerId=0 (player) vs ownerId=1 (AI) gives an IDENTICAL ' +
    'result -- the function does not know or care whether the attacker is the human player or AI');

  // --- 5d. main.ts wiring: main.ts calls the EXTRACTED functions rather than containing the
  // decision inline. main.ts is not bundled (DOM/THREE deps, see file header) -- this is
  // deliberately a THIN wiring check only; the actual decision logic is covered by real
  // execution in 5a-5c above, not by this text search.
  const mainTsPath = path.join(GRA_ROOT, 'src/main.ts');
  const mainTs = fs.readFileSync(mainTsPath, 'utf8');

  assert(mainTs.includes('shouldAllowBarbCityCapture, isCityCaptureBlockedByDefenders,')
    || mainTs.includes('shouldAllowBarbCityCapture,') && mainTs.includes('isCityCaptureBlockedByDefenders,'),
    '5d: main.ts imports both extracted functions from game/barbarians');
  assert(mainTs.includes('const barbAllowCityCapture = shouldAllowBarbCityCapture(_menuDifficulty);'),
    '5d: main.ts calls shouldAllowBarbCityCapture(_menuDifficulty) instead of an inline comparison');
  assert(mainTs.includes('isCityCaptureBlockedByDefenders(atkOwnerForCapture, units, battleQ, battleR)'),
    '5d: main.ts calls isCityCaptureBlockedByDefenders(...) instead of an inline isBarbarian+units.some check');
  assert(!mainTs.includes("_menuDifficulty === 'hard';"),
    '5d regression: the old inline hard-only comparison is gone from main.ts (logic now lives ' +
    'exclusively in shouldAllowBarbCityCapture)');

  // 5e. Regression: the OTHER (non-barbarian) caller of doAutoPowerMapBattle/
  // launchIncomingMapFieldBattle -- AI attacking the player in the general AI turn loop -- does
  // NOT pass barbAllowCityCapture (capture-on-win stays exclusive to hard-difficulty barbarians).
  const aiAttackIdx = mainTs.indexOf("'Atak AI — ' + ownerDiploLabel(ownerId)");
  assert(aiAttackIdx !== -1, 'static 5e: found the AI-vs-player attack call site');
  const aiAttackWindow = mainTs.slice(Math.max(0, aiAttackIdx - 700), aiAttackIdx + 700);
  assert(!aiAttackWindow.includes('barbAllowCityCapture'),
    'static 5e: AI-vs-player attack call site is untouched -- no barbAllowCityCapture leakage');
}

// ============================================================================================
// 6. RUNDA 4 -- naprawa livelocku A<->B (3x jednomyślny Evaluator FAIL na rundach 1-3):
//    pojedynczy slot `unit.recentlyClearedCityId` zastąpiony ZBIOREM `unit.clearedCityIds`
//    (patrz BarbUnit, barbarians.ts). 6a: regresja -- arrival przy mieście BRONIONYM nadal
//    atakuje i NIE dotyka zbioru (przeniesione z dawnej sekcji 6, zaadaptowane do zbioru).
//    6b: WŁAŚCIWY dowód rundy 4 -- symulacja >=30 kolejnych decyzji z RZECZYWIŚCIE
//    stosowanym ruchem (`unit.q/r` aktualizowane z komendy `move`, bramkowane przez
//    `canUnitOccupyCityHex` -- dokładnie ta sama bramka co main.ts ok. linii 26258:
//    `if (!canUnitOccupyCityHex(...)) continue;` przed `bu.q = bcmd.toQ`) na geometrii
//    z 3 miastami NIEBRONIONYMI. Asercja obejmuje KAŻDY wygenerowany wpis logu (partycja
//    na "legi" pokrywa 100% długości logu, nie prefiks/fazę/okno) -- to jest DOKŁADNIE
//    wzorzec, który złapał 3 poprzednie rundy: stara sekcja 6 asercjonowała tylko
//    fazę1+fazę2 (13 z 20 wpisów), 7 końcowych wpisów nigdy nie było sprawdzanych, i
//    właśnie tam chowało się zawrócenie. Patrz też sekcja 8 (mutacyjny dowód: to samo
//    źródło zwrócone do stanu rundy 3 MUSI dać czerwono na tym pliku).
// ============================================================================================

// 6a. Regresja przeniesiona z dawnej sekcji 6 (wariant "drugie miasto BRONIONE"): arrival
// przyległy do BRONIONEGO miasta atakuje obrońcę (krok 2 -- "atak sąsiedniej wrogiej
// jednostki" -- uruchamia się PRZED krokiem 3 "chase"/zapis do zbioru, bo obrońca stoi na
// TYM SAMYM heksie co miasto), i zbiór `clearedCityIds` pozostaje NIETKNIĘTY -- warunek
// zapisu w kroku 3 wymaga `!enemies.some(...)` (niebronione), więc bronione miasto NIGDY
// nie trafia do zbioru (a filtr go i tak nigdy nie wyklucza).
{
  const map = makeMap(20, 3);
  const cityFar = city('cityFar', 6, 0); // BRONIONE
  const guard = enemy('guard', 6, 0);
  // Jednostka ma już WCZEŚNIEJSZĄ pamięć (z hipotetycznego innego miasta) -- dowodzi, że
  // arrival przy bronionym mieście ani jej nie kasuje, ani nie rozszerza.
  const unit = barb('b1', 5, 0, { campId: 'destroyed-camp', clearedCityIds: ['someOtherCity'] });
  const cmds = decideBarbarianMoves([unit], [guard], [cityFar], [], map, P, undefined, 'normal');
  eq(cmds[0]?.type, 'attack',
    '6a: przyległość do BRONIONEGO miasta -- atak na obrońcę (krok 2 uruchamia się przed ' +
    'krokiem 3 "chase"/zapis do zbioru, bo obrońca stoi na heksie miasta)');
  eq(JSON.stringify(unit.clearedCityIds), JSON.stringify(['someOtherCity']),
    '6a: clearedCityIds NIETKNIĘTY po arrival przy bronionym mieście -- warunek zapisu w ' +
    'kroku 3 wymaga niebronionego miasta, krok 3 nie jest tu w ogóle osiągany (krok 2 ' +
    'kończy decyzję wcześniej przez continue)');
}

// 6b. WŁAŚCIWY dowód rundy 4 -- patrz nagłówek sekcji wyżej.
{
  /**
   * Symuluje `turns` kolejnych decyzji `decideBarbarianMoves` dla JEDNEJ jednostki na
   * DOWOLNEJ liczbie miast, aplikując ruch tak jak main.ts (bramkowane
   * `canUnitOccupyCityHex`). Zwraca PEŁNY log per-turowy: dystans do KAŻDEGO miasta
   * PRZED decyzją tej tury, typ wydanej komendy, oraz kopie (NIE referencje -- `.slice()`,
   * `unit.clearedCityIds` jest tą samą mutowaną tablicą przez cały bieg) zbioru
   * odwiedzonych PRZED i PO tej decyzji.
   */
  function simulateChase(unit, enemies, cities, map, params, difficulty, turns) {
    const log = [];
    for (let t = 0; t < turns; t++) {
      const dist = {};
      for (const c of cities) dist[c.id] = hexDist(unit.q, unit.r, c.q, c.r);
      const clearedBefore = (unit.clearedCityIds ?? []).slice();
      const cmds = decideBarbarianMoves([unit], enemies, cities, [], map, params, undefined, difficulty);
      const cmd = cmds[0];
      let moved = false;
      if (cmd?.type === 'move' && canUnitOccupyCityHex(unit.ownerId, cmd.toQ, cmd.toR, cities)) {
        unit.q = cmd.toQ;
        unit.r = cmd.toR;
        moved = true;
      }
      const clearedAfter = (unit.clearedCityIds ?? []).slice();
      log.push({ t, dist, cmdType: cmd?.type ?? 'idle', moved, clearedBefore, clearedAfter });
      if (cmd?.type === 'attack') break;
    }
    return log;
  }

  const CITY_IDS = ['cityA', 'cityB', 'cityC'];
  const map = makeMap(40, 8);
  const cityA = city('cityA', 6, 4);
  const cityB = city('cityB', 16, 4);  // 10 heksów od cityA
  const cityC = city('cityC', 26, 4);  // 10 heksów od cityB, 20 od cityA -- >= MIN_CITY_DISTANCE=4
  const cities3 = [cityA, cityB, cityC];
  // campId wskazujący na nieistniejący obóz -> orphaned -> raidReady=true
  // (chaseRadius=Infinity) -- ten sam wzorzec co sekcja 3c wyżej, bez potrzeby
  // konfigurowania realnych obozów. Wszystkie 3 miasta NIEBRONIONE (enemies=[]).
  const unit = barb('b1', 10, 4, { campId: 'destroyed-camp' });
  const TURNS = 40; // >= 30 wymagane przez zlecenie rundy 4, z zapasem
  const log = simulateChase(unit, [], cities3, map, P, 'normal', TURNS);

  assert(log.length >= 30,
    `6b: >=30 kolejnych decyzji symulowanych (got ${log.length}) -- wymóg zlecenia rundy 4`);

  // (a) KAŻDE z 3 miast zostaje odwiedzone (dystans<=1) PRZYNAJMNIEJ RAZ w PEŁNYM logu
  // (przeszukiwany jest KAŻDY wpis, nie okno/prefiks).
  for (const cid of CITY_IDS) {
    assert(log.some(e => e.dist[cid] <= 1),
      `6b (a): ${cid} zostaje odwiedzone (dystans<=1) gdzieś w PEŁNYM logu ${TURNS} decyzji`);
  }

  /** Indeksy, w których `cid` przechodzi z NIEOBECNEGO na OBECNY w `clearedAfter` --
   *  pierwsze wejście = pierwsza wizyta; DRUGIE wejście = ponowna wizyta PO tym, jak
   *  reset (patrz (b)) usunął miasto ze zbioru -- czyli dowód, że patrol faktycznie
   *  wraca do wcześniej oczyszczonego miasta, nie tylko że zbiór się zmienia. */
  function presenceEvents(log, cid) {
    const events = [];
    let wasPresent = false;
    for (let i = 0; i < log.length; i++) {
      const isPresent = log[i].clearedAfter.includes(cid);
      if (isPresent && !wasPresent) events.push(i);
      wasPresent = isPresent;
    }
    return events;
  }
  for (const cid of CITY_IDS) {
    assert(presenceEvents(log, cid).length >= 1,
      `6b (a): ${cid} ma >=1 zdarzenie "wejścia do zbioru" w pełnym logu`);
  }

  // (b) Po odwiedzeniu WSZYSTKICH 3 (zbiór = {A,B,C} naraz), zbiór RESETUJE SIĘ --
  // następny wpis logu ma < 3 elementy -- fallback (linia niezmieniona od rundy 2,
  // `civCities = filtered.length > 0 ? filtered : civCitiesBase`) wraca do PEŁNEJ listy,
  // patrol zaczyna kolejne okrążenie. To jest OCZEKIWANE (patrz komentarz "RUNDA 4" w
  // barbarians.ts), nie błąd -- szukane w PEŁNYM logu.
  const fullIdx = log.findIndex(e => e.clearedAfter.length === 3 && CITY_IDS.every(cid => e.clearedAfter.includes(cid)));
  assert(fullIdx !== -1,
    `6b (b): istnieje wpis w PEŁNYM logu, gdzie zbiór zawiera WSZYSTKIE 3 miasta naraz (got ${fullIdx})`);
  assert(fullIdx !== -1 && fullIdx + 1 < log.length,
    '6b (b): log ma jeszcze >=1 wpis PO pełnym zbiorze, żeby zaobserwować reset');
  if (fullIdx !== -1 && fullIdx + 1 < log.length) {
    assert(log[fullIdx + 1].clearedAfter.length < 3,
      `6b (b): NASTĘPNY wpis po pełnym zbiorze ma < 3 elementy (got ${log[fullIdx + 1].clearedAfter.length}) ` +
      `-- zbiór ZOSTAŁ ZRESETOWANY, to jest oczekiwane, nie błąd`);
  }

  // Dowód BEHAWIORALNY (nie tylko stanu wewnętrznego): przynajmniej jedno miasto ma
  // DRUGIE zdarzenie "wejścia" w pełnym logu -- odwiedzone, usunięte przez reset,
  // ODWIEDZONE PONOWNIE (realny ruch jednostki z powrotem), nie tylko czyszczenie
  // licznika. Bezpośredni dowód "cykl zaczyna się od nowa".
  const revisited = CITY_IDS.filter(cid => presenceEvents(log, cid).length >= 2);
  assert(revisited.length >= 1,
    `6b (b): PRZYNAJMNIEJ jedno miasto ma >=2 zdarzenia "wejścia" w pełnym logu ` +
    `(revisited=${JSON.stringify(revisited)}) -- dowód REALNEGO powrotu jednostki po resecie`);

  // (c) Regresja DOKŁADNIE tego wzorca, który złapał 3 poprzednie rundy: asercja NIE
  // ogranicza się do prefiksu/fazy/okna. Log jest partycjonowany na "legi" -- maksymalne
  // odcinki o STAŁYM `clearedBefore` (czyli stałym zbiorze wykluczeń użytym w danej
  // decyzji, zmienia się dokładnie wtedy, gdy poprzedni wpis dopisał/zresetował zbiór) --
  // partycja pokrywa 100% wpisów logu (KAŻDY wpis należy do dokładnie jednego legu),
  // żaden wpis nie zostaje poza sprawdzeniem.
  function targetDistFor(entry, clearedBeforeArr) {
    const candidates = CITY_IDS.filter(cid => !clearedBeforeArr.includes(cid));
    const pool = candidates.length > 0 ? candidates : CITY_IDS; // pusta lista -> fallback pełna (patrz fix)
    return Math.min(...pool.map(cid => entry.dist[cid]));
  }
  let legStart = 0;
  let legsChecked = 0;
  for (let i = 1; i <= log.length; i++) {
    const boundary = i === log.length
      || JSON.stringify(log[i].clearedBefore.slice().sort()) !== JSON.stringify(log[i - 1].clearedBefore.slice().sort());
    if (!boundary) continue;
    const leg = log.slice(legStart, i);
    legsChecked++;
    // Nie-rosnąco na KAŻDYM kroku (tolerancja na pojedynczy hex-gridowy "plateau" z
    // routingu Dijkstry -- patrz computePath/setup.ts; PRAWDZIWA regresja to WZROST
    // dystansu przez wiele kroków, nie płaskie plateau o 1 krok).
    for (let k = 1; k < leg.length; k++) {
      const dPrev = targetDistFor(leg[k - 1], leg[k - 1].clearedBefore);
      const dCur = targetDistFor(leg[k], leg[k].clearedBefore);
      assert(dCur <= dPrev,
        `6b (c) leg@${legStart}..${i - 1}, krok ${k}: dystans do bieżącego celu NIE ROŚNIE ` +
        `(${dPrev} -> ${dCur}) -- KAŻDY wpis logu sprawdzony, nie tylko prefiks/faza`);
    }
    // Net postęp na całym legu (pierwszy > ostatni). Ostatni leg logu może być
    // NIEDOKOŃCZONY (budżet TURNS wyczerpany w trakcie marszu) -- wtedy tylko "netto
    // maleje", bez wymogu dotarcia; każdy inny leg MUSI dotrzeć (dystans<=1).
    if (leg.length >= 2) {
      const dFirst = targetDistFor(leg[0], leg[0].clearedBefore);
      const dLast = targetDistFor(leg[leg.length - 1], leg[leg.length - 1].clearedBefore);
      const isFinalLeg = i === log.length;
      if (isFinalLeg && dLast > 1) {
        assert(dLast < dFirst,
          `6b (c) leg@${legStart}..${i - 1} (ostatni, niedokończony w budżecie ${TURNS} tur): ` +
          `dystans netto MALEJE (${dFirst} -> ${dLast})`);
      } else {
        assert(dLast <= 1,
          `6b (c) leg@${legStart}..${i - 1}: leg kończy się DOTARCIEM (dystans<=1) do bieżącego ` +
          `celu (got ${dLast})`);
        assert(dLast < dFirst,
          `6b (c) leg@${legStart}..${i - 1}: dystans netto MALEJE na całym legu (${dFirst} -> ${dLast})`);
      }
    }
    legStart = i;
  }
  assert(legsChecked >= 4,
    `6b (c): log podzielony na >=4 legi wg zmian zbioru wykluczeń (got ${legsChecked}) -- dowód, że ` +
    `partycja faktycznie obejmuje pełen cykl (>=3 wizyty + reset), nie tylko pierwsze 1-2 fazy`);
}

// ============================================================================================
// 6c. RUNDA 5, X3 (Evaluator C) -- guard "miasto BRONIONE nie trafia do clearedCityIds" w kroku
//    3 (`!enemies.some(...)` przy zapisie) jest REALNIE osiągnięty, nie tylko teoretycznie
//    poprawny. Sekcja 6a tego NIE dowodzi: tam krok 2 (atak) zawsze robi `continue` PRZED
//    krokiem 3, więc krok 3 nigdy się w 6a nie wykonuje -- asercja "zbiór nietknięty" w 6a jest
//    prawdziwa niezależnie od tego, czy guard w kroku 3 w ogóle działa (pusta asercja / martwe
//    pokrycie, mutant guarda przechodziłby tam niezauważony). Tu krok 2 jest CELOWO zablokowany
//    dwoma różnymi, niezależnymi drogami (i) `canEngageOwner` zwraca `false` (rozejm), (ii)
//    dystans dokładnie 0 (krok 2 wymaga `hexDistance===1`) -- w OBU krok 3 faktycznie się
//    wykonuje z bronionym miastem jako `nearestCity`.
// ============================================================================================
{
  const map = makeMap(15, 4);
  const cityDef = city('cityDef', 6, 0);
  const guard   = enemy('guard', 6, 0);
  // (i) rozejm: engageOk=false -> krok 2 nie odpala, krok 3 OSIĄGNIĘTY z bronionym celem
  const u1 = barb('bT1', 5, 0, { campId: 'destroyed-camp' });
  decideBarbarianMoves([u1], [guard], [cityDef], [], map, P, () => false, 'normal');
  eq(u1.clearedCityIds, undefined,
    '6c(i): bronione miasto NIE trafia do clearedCityIds, gdy krok 2 nie zwiera obwodu ' +
    '(canEngageOwner=false) -- guard !enemies.some(...) w kroku 3');
  // (ii) dystans 0: krok 2 wymaga hexDistance===1 dokładnie, więc też nie odpala
  const u2 = barb('bT2', 6, 0, { campId: 'destroyed-camp' });
  decideBarbarianMoves([u2], [enemy('g2', 6, 0)], [city('cityOn', 6, 0)], [], map, P, undefined, 'normal');
  eq(u2.clearedCityIds, undefined,
    '6c(ii): jednostka NA heksie bronionego miasta (dystans 0) też nie zapisuje go do zbioru');
}

// ============================================================================================
// 6d. RUNDA 5, F1 (Evaluator A) -- dowód na planszy MIESZANEJ (bronione + niebronione RAZEM,
//    przez CAŁĄ symulację, `cityDist` nigdy nie znika z listy `cities`). Stary warunek resetu
//    (`filtered.length === 0`) był osiągalny WYŁĄCZNIE gdy na planszy NIE ISTNIEJE żadne
//    bronione miasto (bronione miasto przechodzi filtr bezwarunkowo) -- na realnej planszy z
//    choć jednym garnizonem reset nigdy by się nie odpalił. Ten test stawia miasto BRONIONE
//    (bardzo daleko, żeby nigdy nie stało się "najbliższym celem" dopóki jednostka krąży koło
//    dwóch niebronionych) i DWA NIEBRONIONE razem, symuluje aż oba niebronione zostaną
//    odwiedzone naraz, i asercjonuje że zbiór PO TYM się resetuje (przestaje zawierać oba) --
//    dokładnie scenariusz, w którym mutacja "cofnij F1" (dowód mutacyjny niżej) przechodziłaby
//    niezłapana, gdyby tego testu nie było (6b nie wystarcza -- tam NIE MA żadnego bronionego
//    miasta na planszy, więc stary i nowy warunek są tam matematycznie równoważne).
//
//    WZMOCNIENIE RUNDA 6 (Evaluator C, pkt 1) -- stara wersja asercjonowała TYLKO, że zbiór
//    *kiedyś w ciągu 60 tur* przestaje zawierać oba miasta naraz (`findIndex` po całym logu),
//    nie przypinając KONKRETNEGO momentu ani nie dowodząc, że jednostka REALNIE kontynuuje
//    patrol (nie zamiera po jednym okrążeniu). Dodane: (i) log śledzi teraz dystans do KAŻDEGO
//    miasta przed decyzją (jak 6b), (ii) każde z cityU1/cityU2 ma >=2 "przyjazdy" (zdarzenia
//    dystans>1 -> dystans<=1) w pełnym logu -- dowód, że patrol faktycznie kontynuuje, nie
//    zamiera po jednym okrążeniu; (iii) reset następuje w PRZEWIDYWALNYM, PRZYPIĘTYM momencie
//    -- DOKŁADNIE na wpisie bezpośrednio PO tym, w którym zbiór po raz pierwszy zawiera oba
//    miasta naraz (`resetIdx === bothVisitedIdx + 1`, nie tylko "gdzieś później").
// ============================================================================================
{
  const map = makeMap(140, 8);
  const cityU1 = city('cityU1', 6, 4);
  const cityU2 = city('cityU2', 16, 4);      // 10 heksów od cityU1, jak w sekcji 6b
  const cityDist = city('cityDist', 120, 4); // BRONIONE, bardzo daleko
  const guard = enemy('guardDist', 120, 4);
  const citiesMixed = [cityU1, cityU2, cityDist];
  const enemiesMixed = [guard];

  // campId wskazujący na nieistniejący obóz -> orphaned -> raidReady=true (chaseRadius=Infinity),
  // ten sam wzorzec co sekcja 3c/6b.
  const unit = barb('bMix', 10, 4, { campId: 'destroyed-camp' });
  const TURNS = 60;
  const log = [];
  for (let t = 0; t < TURNS; t++) {
    const dist = {};
    for (const c of citiesMixed) dist[c.id] = hexDist(unit.q, unit.r, c.q, c.r);
    const cmds = decideBarbarianMoves([unit], enemiesMixed, citiesMixed, [], map, P, undefined, 'normal');
    const cmd = cmds[0];
    if (cmd?.type === 'move' && canUnitOccupyCityHex(unit.ownerId, cmd.toQ, cmd.toR, citiesMixed)) {
      unit.q = cmd.toQ;
      unit.r = cmd.toR;
    }
    log.push({ t, dist, clearedAfter: (unit.clearedCityIds ?? []).slice(), cmdType: cmd?.type ?? 'idle' });
    if (cmd?.type === 'attack') break; // nie powinno się zdarzyć -- guard za daleko przez cały bieg.
  }

  const bothVisitedIdx = log.findIndex(e =>
    e.clearedAfter.includes('cityU1') && e.clearedAfter.includes('cityU2'));
  assert(bothVisitedIdx !== -1,
    '6d: oba niebronione miasta (cityU1, cityU2) zostają odwiedzone w ' + TURNS + '-turowym logu ' +
    'MIMO obecności bronionego cityDist na tej samej planszy przez cały bieg ' +
    '(got bothVisitedIdx=' + bothVisitedIdx + ')');

  const resetIdx = bothVisitedIdx === -1 ? -1
    : log.findIndex((e, i) => i > bothVisitedIdx
        && !(e.clearedAfter.includes('cityU1') && e.clearedAfter.includes('cityU2')));
  assert(resetIdx !== -1,
    '6d (F1): PO odwiedzeniu OBU niebronionych miast naraz zbiór clearedCityIds RESETUJE SIĘ ' +
    '(przestaje zawierać oba naraz) w pełnym logu ' + TURNS + ' tur -- mimo że cityDist ' +
    '(bronione) jest obecne przez CAŁĄ symulację. Stary warunek (filtered.length===0) nigdy by ' +
    'tego nie złapał, bo cityDist zawsze przechodzi filtr bezwarunkowo ' +
    '(got resetIdx=' + resetIdx + ')');
  if (bothVisitedIdx !== -1 && resetIdx !== -1) {
    assert(resetIdx > bothVisitedIdx,
      '6d: reset następuje PO turze, w której oba niebronione miasta zostały odwiedzone razem, nie przed');
    // RUNDA 6 (Evaluator C, pkt 1a): moment resetu jest PRZEWIDYWALNY -- reset (mutacja zbioru w
    // kroku 3) i zapis "arrival" (dopisanie ostatniego miasta) dzielą tę samą decyzję tylko gdy
    // WCHODZĄC w tę turę zbiór już jest pełny; skoro `bothVisitedIdx` to WŁAŚNIE pierwszy wpis z
    // pełnym zbiorem (zapisanym PO decyzji tej tury), warunek resetu (liczony na WEJŚCIU do
    // KOLEJNEJ decyzji) odpala się dokładnie na wpisie bothVisitedIdx+1 -- nie "gdzieś później".
    eq(resetIdx, bothVisitedIdx + 1,
      '6d (F1, pkt 1a): reset następuje w PRZEWIDYWALNYM, PRZYPIĘTYM momencie -- dokładnie na ' +
      'wpisie bezpośrednio PO tym, w którym zbiór po raz pierwszy zawiera oba miasta naraz ' +
      `(bothVisitedIdx=${bothVisitedIdx}), nie tylko "gdzieś w logu później"`);
  }

  // RUNDA 6 (Evaluator C, pkt 1b): dowód BEHAWIORALNY, nie tylko stanu wewnętrznego -- każde z
  // dwóch miast ma >=2 "przyjazdy" (przejście dystans>1 -> dystans<=1) w PEŁNYM logu, dowodzące
  // że patrol faktycznie KONTYNUUJE (wraca po resecie), nie zamiera po jednym okrążeniu.
  function arrivalCount(cid) {
    let count = 0;
    let wasThere = false;
    for (const e of log) {
      const isThere = e.dist[cid] <= 1;
      if (isThere && !wasThere) count++;
      wasThere = isThere;
    }
    return count;
  }
  for (const cid of ['cityU1', 'cityU2']) {
    const n = arrivalCount(cid);
    assert(n >= 2,
      `6d (F1, pkt 1b): ${cid} ma >=2 przyjazdy (przejście dystans>1->dystans<=1) w pełnym logu ` +
      `${TURNS} tur (got ${n}) -- dowód, że patrol faktycznie kontynuuje/wraca, nie zamiera po ` +
      'jednym okrążeniu');
  }
}

// ============================================================================================
// 6e. RUNDA 5, F2 (Evaluator A) -- strażnik osiągalności. Miasto BRONIONE, geometrycznie
//    NAJBLIŻSZE, jest NIEOSIĄGALNE -- odcięte kolumną wody na q=10 dla WSZYSTKICH wierszy mapy
//    (twarda bariera: axialne przesunięcia sąsiadów zmieniają q wyłącznie o -1/0/+1 na krok,
//    więc żadna ścieżka nie może "przeskoczyć" kolumny, patrz computePath/setup.ts). Miasto
//    NIEBRONIONE, dalsze geometrycznie, jest OSIĄGALNE (ta sama strona wody co jednostka).
//    Jednostka raid-ready (chaseRadius=Infinity, orphaned campId jak w 3c/6b/6d) MUSI spróbować
//    KOLEJNEGO kandydata z listy zamiast zamierać bez komendy, gdy firstStep dla najbliższego
//    (bronionego, za wodą) zwraca null.
// ============================================================================================
{
  const map = makeMap(30, 3);
  // Kolumna wody na q=10, wszystkie 3 wiersze -- twarda bariera.
  for (let r = 0; r < 3; r++) {
    map.hexes[`10,${r}`].terenBazowy = 'morze';
  }
  const cityBlocked = city('cityBlocked', 12, 0); // BRONIONE, bliżej geometrycznie, ale ZA WODĄ
  const guardBlocked = enemy('guardBlocked', 12, 0);
  const cityFar = city('cityFar', 2, 0); // NIEBRONIONE, dalej geometrycznie, ale OSIĄGALNE
  const unit = barb('bFreeze', 8, 0, { campId: 'destroyed-camp' }); // orphaned -> raidReady

  // Kontrola geometrii: cityBlocked BLIŻEJ niż cityFar (żeby stary kod, próbujący WYŁĄCZNIE
  // targets[0], faktycznie wybrał cityBlocked jako jedyny cel tej decyzji).
  assert(hexDist(unit.q, unit.r, cityBlocked.q, cityBlocked.r)
      < hexDist(unit.q, unit.r, cityFar.q, cityFar.r),
    '6e setup: cityBlocked jest geometrycznie BLIŻEJ niż cityFar (wymóg scenariusza)');

  const cmds = decideBarbarianMoves(
    [unit], [guardBlocked], [cityBlocked, cityFar], [], map, P, undefined, 'normal');
  eq(cmds.length, 1,
    '6e (F2): jednostka dostaje KOMENDĘ (nie zamiera) mimo że najbliższy kandydat (cityBlocked) ' +
    'jest nieosiągalny za wodą -- próbuje kolejnego kandydata (cityFar), który JEST osiągalny');
  eq(cmds[0]?.type, 'move', '6e: komenda to ruch');
  if (cmds[0]?.type === 'move') {
    const dFarBefore = hexDist(unit.q, unit.r, cityFar.q, cityFar.r);
    const dFarAfter = hexDist(cmds[0].toQ, cmds[0].toR, cityFar.q, cityFar.r);
    assert(dFarAfter < dFarBefore,
      '6e: ruch faktycznie zbliża do OSIĄGALNEGO cityFar (before=' + dFarBefore + ', after=' + dFarAfter +
      ') -- dowód, że pominięty nieosiągalny kandydat NIE zablokował całej decyzji');
  }
}

// ============================================================================================
// 6f. RUNDA 6, USTERKA 1 / F1-LIVELOCK (Evaluator A) -- dowód WŁAŚCIWY dla naprawy tej rundy:
//    plansza z DOKŁADNIE JEDNYM miastem niebronionym (cityNear, blisko) + JEDNYM bronionym
//    (cityFar, dalej), jednostka NIE raid-ready (brak campId -> chaseRadius=aggroRadius, NIE
//    Infinity) startuje MIĘDZY nimi -- dokładnie geometria ze zgłoszenia Evaluatora A (q=2 / q=9
//    / start q=3). Symulacja >=30 tur z REALNIE stosowanym ruchem (jak 6b/6d).
//
//    ODSTĘPSTWO ŚWIADOME od dosłownego brzmienia propozycji Evaluatora C (runda 5): oryginalna
//    propozycja (cytat ze zlecenia tej rundy) mówiła o asercji "jednostka WRACA do niebronionego
//    miasta WIELOKROTNIE (nie utyka po jednym dotarciu)". To sformułowanie powstało PRZED
//    diagnozą Evaluatora A z TEJ rundy -- "wraca wielokrotnie" jest DOKŁADNIE opisem
//    PATOLOGICZNEGO livelocku (nieskończone odbijanie jednostki między dwiema pozycjami wokół
//    cityNear, jednostka NIGDY nie dociera do cityFar), nie pożądanym zachowaniem. Test niżej
//    asercjonuje zamiast tego WŁAŚCIWY, naprawiony niezmiennik: jednostka NIE odbija się w
//    nieskończoność -- dystans do BRONIONEGO cityFar nie rośnie między kolejnymi turami i
//    jednostka OSTATECZNIE dociera do niego (komenda 'attack'), zamiast tkwić w wahadle wokół
//    cityNear. Dowód mutacyjny niżej (sekcja "USTERKA 1", w bloku self-check) potwierdza:
//    cofnięcie naprawy tej rundy do `unit.clearedCityIds = []` sprawia, że WŁAŚNIE TA asercja
//    (jednostka dociera do cityFar w budżecie tur) staje się czerwona -- jednostka faktycznie
//    wpada w opisywany 3-turowy cykl i NIGDY nie dociera do cityFar.
// ============================================================================================
{
  const map = makeMap(15, 3);
  const cityNear = city('cityNear', 2, 0);   // NIEBRONIONE, blisko
  const cityFar = city('cityFar', 9, 0);     // BRONIONE, dalej
  const guardF = enemy('guardF', 9, 0);
  const citiesF = [cityNear, cityFar];
  // Promień pościgu wystarczający, żeby cityFar było ZAWSZE w zasięgu chase niezależnie od
  // pozycji jednostki na tej planszy (bez obozu -> chaseRadius=aggroRadius, NIE Infinity --
  // dokładnie scenariusz zlecenia: "BEZ obozu, nie raid-ready").
  const P6f = Object.assign({}, FALLBACK_BARB_PARAMS, { aggroRadius: 20 });

  const unit = barb('bF1livelock', 3, 0); // BEZ campId -- nie raid-ready
  eq(Boolean(unit.campId), false,
    '6f setup: jednostka bez campId (zgodnie ze zleceniem -- BEZ obozu, chaseRadius=aggroRadius)');

  const TURNS = 40; // >= 30 wymagane przez zlecenie rundy 6, z zapasem
  const log = [];
  for (let t = 0; t < TURNS; t++) {
    const cmds = decideBarbarianMoves([unit], [guardF], citiesF, [], map, P6f, undefined, 'normal');
    const cmd = cmds[0];
    let moved = false;
    if (cmd?.type === 'move' && canUnitOccupyCityHex(unit.ownerId, cmd.toQ, cmd.toR, citiesF)) {
      unit.q = cmd.toQ;
      unit.r = cmd.toR;
      moved = true;
    }
    log.push({
      t, cmdType: cmd?.type ?? 'idle', moved,
      distFar: hexDist(unit.q, unit.r, cityFar.q, cityFar.r),
      clearedAfter: (unit.clearedCityIds ?? []).slice(),
    });
    if (cmd?.type === 'attack') break; // dotarcie do bronionego miasta -- cel testu osiągnięty.
  }

  assert(log.length >= 2, `6f: symulacja wygenerowała >=2 wpisy logu (got ${log.length})`);

  // Rdzeń dowodu: jednostka OSIĄGA bronione cityFar (komenda 'attack') w budżecie ${TURNS} tur.
  // PRZED naprawą tej rundy NIE osiąga go NIGDY (nieskończone odbijanie wokół cityNear -- patrz
  // dowód mutacyjny).
  const reachedGuarded = log.some(e => e.cmdType === 'attack');
  assert(reachedGuarded,
    `6f (USTERKA 1): jednostka dociera do BRONIONEGO cityFar (komenda 'attack') w budżecie ` +
    `${TURNS} tur (log ${log.length} wpisów, ostatni dystans do cityFar=` +
    `${log[log.length - 1]?.distFar}) -- przed naprawą tej rundy NIE dociera NIGDY, tkwi w ` +
    '3-turowym cyklu odbijania się od cityNear zamiast kontynuować do cityFar');

  // Dystans do cityFar NIGDY nie rośnie między kolejnymi wpisami logu -- realna regresja
  // (livelock sprzed naprawy) to WIELOKROTNY wzrost dystansu w kolejnych turach (jednostka
  // odbija się z powrotem do cityNear), nie pojedyncze plateau routingu.
  let regressions = 0;
  for (let i = 1; i < log.length; i++) {
    if (log[i].distFar > log[i - 1].distFar) regressions++;
  }
  assert(regressions === 0,
    `6f (USTERKA 1): dystans do cityFar NIGDY nie rośnie między kolejnymi wpisami logu ` +
    `(got ${regressions} wzrostów) -- zero odbić od cityNear po pierwszym wykluczeniu`);

  // Dowód WEWNĘTRZNY, uzupełniający: skoro cityNear raz trafia do clearedCityIds, zostaje tam
  // TRWALE (zbiór nie oscyluje [] <-> ['cityNear']) -- dokładny mechanizm livelocku sprzed
  // naprawy tej rundy (reset do [] "odblokowywał" cityNear co ~2 tury).
  const firstExcludedIdx = log.findIndex(e => e.clearedAfter.includes('cityNear'));
  assert(firstExcludedIdx !== -1,
    '6f (USTERKA 1): cityNear zostaje wpisany do clearedCityIds w pewnym momencie logu');
  if (firstExcludedIdx !== -1) {
    const reincludedLater = log.slice(firstExcludedIdx + 1).some(e => !e.clearedAfter.includes('cityNear'));
    assert(!reincludedLater,
      "6f (USTERKA 1): PO pierwszym wykluczeniu cityNear zbiór już NIGDY nie wraca do [] " +
      "(clearedCityIds nie oscyluje [] <-> ['cityNear'])");
  }
}

// ============================================================================================
// 7. RUNDA 3, punkt 4 -- pokrycie testowe dla guarda `!isBarbarian(atkOwner)` w
//    post-battle-map.ts (applyCityCaptureAfterBattle), REALNE WYKONANIE (nie source-text).
//    (a) `rebelPreviousOwnerId` PRZEŻYWA przejęcie miasta PRZEZ barbarzyńcę (guard
//        pomija applyPostCaptureLawOnCapture, które inaczej by je skasowało).
//    (b) Prawo po podboju nadal poprawnie działa (ustawia postCaptureLawTurnsRemaining
//        + revoltRisk=0 przez applyPostCaptureLawOverride) gdy zdobywcą jest gracz
//        (ownerId=0) LUB AI (ownerId>0, nie-barbarzyńca) -- guard nie psuje normalnej
//        ścieżki.
// ============================================================================================
{
  // --- 7a. rebelPreviousOwnerId przeżywa capture barbarzyński. ---
  const rebelCity = {
    id: 'rebelCity', q: 5, r: 5, ownerId: REBEL_FACTION_OWNER_ID, name: 'rebelCity',
    rebelPreviousOwnerId: 0, rebelState: true,
  };
  const barbAtkRoster = [{ id: 'batk', ownerId: BARBARIAN_OWNER_ID, q: 5, r: 5, ruchLeft: 1 }];
  const barbUnits = [...barbAtkRoster];
  applyCityCaptureAfterBattle(rebelCity, barbAtkRoster, BARBARIAN_OWNER_ID, barbUnits, 'batk');
  eq(rebelCity.ownerId, BARBARIAN_OWNER_ID, '7a: city.ownerId zmienione na barbarzyńcę');
  eq(rebelCity.rebelPreviousOwnerId, 0,
    '7a: rebelPreviousOwnerId PRZEŻYWA przejęcie przez barbarzyńcę (guard pomija ' +
    'applyPostCaptureLawOnCapture, które inaczej by je `delete`owało)');
  eq(rebelCity.postCaptureLawTurnsRemaining, undefined,
    '7a: bonus Prawa po podboju NIE jest ustawiany dla barbarzyńskiego zdobywcy (guard aktywny)');

  // --- 7b regresja mutacyjna (opisowa, weryfikowana w Krok "dowód mutacyjny" niżej):
  // usunięcie guarda `!isBarbarian(atkOwner)` sprawiłoby, że powyższe dwie asercje
  // (rebelPreviousOwnerId===0, postCaptureLawTurnsRemaining===undefined) staną się
  // czerwone jednocześnie -- applyPostCaptureLawOnCapture zostałoby wywołane, co (1)
  // ustawiłoby postCaptureLawTurnsRemaining, i (2) skasowałoby rebelPreviousOwnerId.

  // --- 7c. Prawo po podboju nadal działa dla zdobywcy GRACZA (ownerId=0), zwykły podbój. ---
  const freshCityPlayer = { id: 'freshP', q: 1, r: 1, ownerId: 3, name: 'freshP' };
  const playerAtkRoster = [{ id: 'patk', ownerId: 0, q: 1, r: 1, ruchLeft: 1 }];
  applyCityCaptureAfterBattle(freshCityPlayer, playerAtkRoster, 0, [...playerAtkRoster], 'patk');
  eq(freshCityPlayer.ownerId, 0, '7c: city.ownerId zmienione na gracza');
  eq(freshCityPlayer.postCaptureLawTurnsRemaining, POST_CAPTURE_FRESH_TURNS,
    '7c: świeży podbój przez GRACZA -- bonus Prawa ustawiony (guard nie blokuje nie-barbarzyńcy)');
  assert(isPostCaptureLawActive(freshCityPlayer), '7c: isPostCaptureLawActive === true dla gracza');

  // --- 7d. Prawo po podboju nadal działa dla zdobywcy AI (ownerId=2, nie-barbarzyńca). ---
  const freshCityAi = { id: 'freshAI', q: 2, r: 2, ownerId: 3, name: 'freshAI' };
  const aiAtkRoster = [{ id: 'aatk', ownerId: 2, q: 2, r: 2, ruchLeft: 1 }];
  applyCityCaptureAfterBattle(freshCityAi, aiAtkRoster, 2, [...aiAtkRoster], 'aatk');
  eq(freshCityAi.ownerId, 2, '7d: city.ownerId zmienione na AI');
  eq(freshCityAi.postCaptureLawTurnsRemaining, POST_CAPTURE_FRESH_TURNS,
    '7d: świeży podbój przez AI -- bonus Prawa ustawiony identycznie jak dla gracza (parytet)');
  assert(isPostCaptureLawActive(freshCityAi), '7d: isPostCaptureLawActive === true dla AI');

  // --- 7e. revoltRisk=0 -- applyPostCaptureLawOverride na realnym ordPct (gracz). ---
  const ordBase = evaluateOrderFromBreakdown(
    { population: 10, buildingZadowolenie: 0, era: 1 },
    { garnizonCount: 0, era: 1 },
    null,
    'normal',
  );
  const overridden = applyPostCaptureLawOverride(ordBase, freshCityPlayer, null, 'normal');
  eq(overridden.effects.revoltRisk, 0,
    '7e: applyPostCaptureLawOverride ustawia revoltRisk=0 dla świeżo podbitego miasta gracza ' +
    '(guard w post-battle-map.ts nie blokuje tej ścieżki dla nie-barbarzyńcy)');

  // --- 7f. Odbicie po buncie (rebelia, zdobywcą NIE-barbarzyńca) -- 10 tur, dla kontrastu
  // z 7a (gdzie zdobywcą jest barbarzyńca i bonus się NIE ustawia). ---
  const rebelCity2 = {
    id: 'rebelCity2', q: 6, r: 6, ownerId: REBEL_FACTION_OWNER_ID, name: 'rebelCity2',
    rebelPreviousOwnerId: 0, rebelState: true,
  };
  const playerReconquestRoster = [{ id: 'ratk', ownerId: 0, q: 6, r: 6, ruchLeft: 1 }];
  applyCityCaptureAfterBattle(rebelCity2, playerReconquestRoster, 0, [...playerReconquestRoster], 'ratk');
  eq(rebelCity2.postCaptureLawTurnsRemaining, POST_CAPTURE_REBELLION_RECONQUEST_TURNS,
    '7f: odbicie po buncie PRZEZ GRACZA (nie-barbarzyńcę) -- 10 tur bonusu, guard nie ingeruje');
  eq(rebelCity2.rebelPreviousOwnerId, undefined,
    '7f: rebelPreviousOwnerId poprawnie skasowany PO wykorzystaniu (normalna ścieżka nie-barb)');
}

// ============================================================================================
// 8. RUNDA 4 -- save/load: `unit.clearedCityIds` MUSI przetrwać round-trip
//    serializeGame()->deserializeGame(). `save.ts` serializuje `units: RuntimeUnit[]`
//    (obejmuje BarbUnit -- main.ts trzyma barbarzyńców w TEJ SAMEJ tablicy `units`,
//    rzutowanej `as BarbUnit[]` w miejscach użycia, patrz main.ts:26158) wprost przez
//    `JSON.stringify(stamped, setAwareReplacer)` -- zwykłe pole `string[]` (NIE `Set`,
//    patrz doc-comment BarbUnit.clearedCityIds dlaczego świadomie nie `Set`) przechodzi
//    round-trip identycznie jak istniejące `campId`/`healthFrac`, bez żadnej specjalnej
//    obsługi w save.ts. Weryfikacja WYKONANIEM realnych serializeGame/deserializeGame
//    (nie source-text) -- dowód, nie założenie.
// ============================================================================================
{
  const barbWithMemory = {
    id: 'raider-save', ownerId: BARBARIAN_OWNER_ID, typeId: 'Wojownik', category: 'miecznik',
    q: 7, r: 3, ruch: 2, ruchLeft: 1, campId: 'destroyed-camp',
    clearedCityIds: ['cityA', 'cityB', 'cityC'],
  };
  const barbNoMemory = {
    id: 'raider-fresh', ownerId: BARBARIAN_OWNER_ID, typeId: 'Wojownik', category: 'miecznik',
    q: 2, r: 2, ruch: 2, ruchLeft: 2,
    // clearedCityIds celowo pominięte -- legacy/świeża jednostka, brak pola w ogóle.
  };
  const saveGame = {
    wersja: 2, tura: 5, seed: 12345,
    units: [barbWithMemory, barbNoMemory],
    cities: [], explored: [],
  };
  const json = serializeGame(saveGame);
  const loaded = deserializeGame(json);

  assert(Array.isArray(loaded.units) && loaded.units.length === 2,
    '8: deserializeGame zwraca units[] tej samej długości (2)');
  const loadedWithMemory = loaded.units.find(u => u.id === 'raider-save');
  const loadedFresh = loaded.units.find(u => u.id === 'raider-fresh');
  assert(loadedWithMemory !== undefined, '8: jednostka z pamięcią odnaleziona po round-tripie');
  assert(loadedFresh !== undefined, '8: świeża jednostka (bez pola) odnaleziona po round-tripie');

  eq(JSON.stringify(loadedWithMemory && loadedWithMemory.clearedCityIds),
    JSON.stringify(['cityA', 'cityB', 'cityC']),
    '8: clearedCityIds PRZETRWAŁ round-trip serializeGame->deserializeGame identycznie, ' +
    'jako zwykła tablica string[] (nie Set -- setAwareReplacer nie ma odwrotnego revivera ' +
    'przy deserializeGame, więc Set wyszedłby jako [] po wczytaniu; zwykła tablica nie ma tego problemu)');
  assert(loadedFresh !== undefined && loadedFresh.clearedCityIds === undefined,
    '8: brak pola U ŹRÓDŁA (legacy/świeża jednostka) zostaje brakiem pola PO wczytaniu -- ' +
    'zgodne z `?? []`/`?? undefined` w barbarians.ts (optional, bezpieczny default)');

  // Regresja: gdyby pole BYŁO omyłkowo zadeklarowane jako prawdziwy `Set` (a nie
  // `string[]`) gdzieś w silniku i przekazane bezpośrednio do serializeGame, ten sam
  // mechanizm (setAwareReplacer) zamieniłby je na tablicę PRZY ZAPISIE -- ale
  // `unit.clearedCityIds instanceof Set` na LIVE (nie wczytanym) obiekcie w
  // barbarians.ts nigdy nie zachodzi, bo typ w BarbUnit to `string[]`. Ten test
  // dokumentuje WYKONANIEM, nie tylko w komentarzu typu, że wybór tablicy (a nie Set)
  // był konieczny -- patrz doc-comment przy polu.
  const setInsteadOfArray = { ...barbWithMemory, id: 'raider-hypothetical-set', clearedCityIds: new Set(['x', 'y']) };
  const saveGame2 = { wersja: 2, tura: 1, seed: 1, units: [setInsteadOfArray], cities: [], explored: [] };
  const loaded2 = deserializeGame(serializeGame(saveGame2));
  const loadedSetUnit = loaded2.units.find(u => u.id === 'raider-hypothetical-set');
  assert(loadedSetUnit !== undefined && Array.isArray(loadedSetUnit.clearedCityIds),
    '8 regresja (dokumentacyjna): GDYBY pole było live `Set`, po round-tripie stałoby się ' +
    'zwykłą tablicą (setAwareReplacer, bez odwrotnego revivera) -- dokładnie powód, dla ' +
    'którego BarbUnit.clearedCityIds jest zadeklarowane jako string[] od początku, nie Set');
}

// ============================================================================================
// 12. RUNDA 6, USTERKA 2 / F2-PERF (Evaluator B, wzmocnienie #4) -- bramka WYDAJNOŚCIOWA.
//    Plansza: JEDNA duża osiągalna wyspa domowa (~10 000 heksów lądu, zbliżone do zgłoszenia
//    Evaluatora B) + archipelag MAŁYCH wysp oddzielonych wodą, niosących WIĘKSZOŚĆ miast
//    (dowiedlnie nieosiągalne dla jednostek na wyspie domowej -- inny land component) + JEDNO
//    bronione miasto na dalekim krańcu wyspy domowej (osiągalne, ale GEOMETRYCZNIE dalej niż
//    większość wysp archipelagu -- więc próbowane JAKO OSTATNIE w liście posortowanej rosnąco
//    wg odległości, dokładny "worst case": najbliżsi kandydaci nieosiągalni, jednostka MUSI
//    przejrzeć wielu z nich zanim trafi na osiągalnego). Kilka jednostek raidReady
//    (chaseRadius=Infinity -- też najgorszy przypadek, żaden kandydat nie odpada przez zasięg
//    przed próbą pathfindingu). ~120 miast (blisko "60-120" ze zgłoszenia), 12 jednostek.
//
//    Bez filtra spójnych składowych (computeLandComponents/destComponentIds) KAŻDA próba dla
//    nieosiągalnego kandydata to pełne firstStep/computePath -- na TEJ SAMEJ geometrii
//    zmierzone (patrz raport rundy 6 dla metodologii i pełnych liczb): ~9.8s BEZ filtra vs
//    ~0.4s Z filtrem. Próg czasowy niżej jest CELOWO hojny (>>obserwowany czas na tej maszynie)
//    -- to jest łapacz REGRESJI RZĘDU WIELKOŚCI, nie ścisły benchmark (maszyny CI różnią się
//    szybkością). Dowód mutacyjny (usunięcie SAMEGO filtra składowych, bez cofania reszty F2 z
//    rundy 5) w bloku self-check niżej.
// ============================================================================================
{
  const HOME_WIDTH = 500;
  const HOME_ROWS = 20; // 10 000 heksów lądu na wyspie domowej
  const GAP = 3;
  const ISLANDS = 39;
  const ISLAND_WIDTH = 3;
  const ISLAND_GAP = 2;
  const CITIES_PER_ISLAND = 3; // 39 x 3 + 1 osiągalne = 118 miast

  const archipelagoStart = HOME_WIDTH + GAP;
  const totalWidth = archipelagoStart + ISLANDS * (ISLAND_WIDTH + ISLAND_GAP);
  const mapPerf = makeMap(totalWidth, HOME_ROWS);
  for (let w = 0; w < GAP; w++) {
    for (let r = 0; r < HOME_ROWS; r++) mapPerf.hexes[`${HOME_WIDTH + w},${r}`].terenBazowy = 'morze';
  }
  for (let isl = 0; isl < ISLANDS; isl++) {
    const waterStart = archipelagoStart + isl * (ISLAND_WIDTH + ISLAND_GAP) + ISLAND_WIDTH;
    for (let w = 0; w < ISLAND_GAP; w++) {
      for (let r = 0; r < HOME_ROWS; r++) {
        const k = `${waterStart + w},${r}`;
        if (mapPerf.hexes[k]) mapPerf.hexes[k].terenBazowy = 'morze';
      }
    }
  }
  const citiesPerf = [];
  for (let isl = 0; isl < ISLANDS; isl++) {
    const islandStartQ = archipelagoStart + isl * (ISLAND_WIDTH + ISLAND_GAP);
    for (let c = 0; c < CITIES_PER_ISLAND; c++) {
      citiesPerf.push(city(`perfArch_${isl}_${c}`, islandStartQ + (c % ISLAND_WIDTH), c % HOME_ROWS));
    }
  }
  const reachableCityPerf = city('perfReachable', 0, 0); // BRONIONE, daleki kraniec wyspy domowej
  citiesPerf.push(reachableCityPerf);
  const guardPerf = enemy('perfGuard', 0, 0);

  const UNITS = 12;
  const perfUnits = [];
  for (let i = 0; i < UNITS; i++) {
    // campId wskazujący na nieistniejący obóz -> orphaned -> raidReady=true (chaseRadius=Infinity),
    // startują blisko wschodniej krawędzi wyspy domowej -- archipelag jest NAJBLIŻSZYM
    // kandydatem geometrycznie (worst case dla starej wersji pętli).
    perfUnits.push(barb(`perfUnit${i}`, HOME_WIDTH - 1 - (i % 3), i % HOME_ROWS, { campId: 'destroyed-camp' }));
  }

  const tStart = Date.now();
  const perfCmds = decideBarbarianMoves(perfUnits, [guardPerf], citiesPerf, [], mapPerf, P, undefined, 'normal');
  const elapsedMs = Date.now() - tStart;

  const PERF_BUDGET_MS = 3000;
  console.log(`  [perf] F2-PERF: ${UNITS} jednostek x ${citiesPerf.length} miast / ${ISLANDS} wysp / ` +
    `${HOME_WIDTH * HOME_ROWS} heksów wyspy domowej -> ${elapsedMs}ms (budżet ${PERF_BUDGET_MS}ms)`);
  assert(elapsedMs < PERF_BUDGET_MS,
    `12 (F2-PERF): decideBarbarianMoves dla ${UNITS} jednostek x ${citiesPerf.length} miast / ` +
    `${ISLANDS} wysp kończy się w ${elapsedMs}ms (budżet ${PERF_BUDGET_MS}ms, hojny -- łapacz ` +
    'regresji rzędu wielkości, patrz raport rundy 6 dla liczb przed/po na tym samym benchmarku)');
  eq(perfCmds.length, UNITS,
    `12 (F2-PERF): każda z ${UNITS} jednostek dostaje dokładnie 1 komendę mimo archipelagu ` +
    'nieosiągalnych kandydatów -- poprawność zachowana, nie tylko szybkość');
}

// ============================================================================================
// 9. RUNDA 4 -- dowód mutacyjny (self-check): cofnięcie CAŁEJ naprawy tej rundy do stanu
//    RUNDY 3 (pojedynczy slot `recentlyClearedCityId` zamiast zbioru `clearedCityIds`) MUSI
//    dać czerwono na TYM SAMYM pliku testowym -- w szczególności na sekcji 6b (3 poprzednie
//    rundy paliły się DOKŁADNIE na tym: trzecie miasto nigdy nie odwiedzone / zawrócenie poza
//    oknem asercji). Wzorzec `--self-check-skip-mutation` identyczny do
//    barb-camp-destruction-test.cjs sekcja 9: mutuje barbarians.ts NA DYSKU, odpala TEN SAM
//    plik w podprocesie z flagą (unika nieskończonej rekurencji -- ta flaga pomija całą tę
//    sekcję), oczekuje niezerowego kodu wyjścia, PRZYWRACA oryginał w `finally` (nawet przy
//    wyjątku w środku).
// ============================================================================================
if (!process.argv.includes('--self-check-skip-mutation')) {
  const { execSync } = require('child_process');
  const barbariansSrcPath = path.join(GRA_ROOT, 'src/game/barbarians.ts');
  const barbariansOriginal = fs.readFileSync(barbariansSrcPath, 'utf8');

  // RUNDA 6 (Evaluator C, wzmocnienie #3): kryterium "mutant złapany" było WYŁĄCZNIE
  // niezerowym kodem wyjścia podprocesu -- to liczy JAKIKOLWIEK błąd (awaria kompilacji
  // esbuild, timeout, wyjątek niezwiązany z mutowaną sekcją) jako "sukces", nawet gdy
  // mutacja nie ma NIC wspólnego z zamierzonym testem (fałszywie pozytywny dowód
  // mutacyjny). Teraz: gdy podano `expectedFailPattern`, dodatkowo wymagamy, żeby
  // stdout/stderr podprocesu zawierał linię `FAIL:` pasującą do wzorca (np. regex numeru
  // sekcji) -- odróżnia REALNE czerwone trafienie zamierzonej asercji od przypadkowej
  // awarii gdzie indziej. Parametr opcjonalny (backward-compatible) -- wywołania bez
  // wzorca zachowują stare, słabsze kryterium (nie dotyczy nowych wywołań w tej rundzie,
  // wszystkie dostają wzorzec).
  // / EN: ROUND 6 (Evaluator C, reinforcement #3): the "mutant caught" criterion used to
  // be EXCLUSIVELY a nonzero subprocess exit code -- that counts ANY failure (esbuild
  // compile crash, timeout, an exception unrelated to the mutated section) as "success",
  // even when the mutation has NOTHING to do with the intended test (a false-positive
  // mutational proof). Now: when `expectedFailPattern` is given, we additionally require
  // the subprocess stdout/stderr to contain a `FAIL:` line matching the pattern (e.g. a
  // regex for the section number) -- distinguishes a REAL red hit on the intended
  // assertion from an incidental failure elsewhere. Optional param (backward-compatible)
  // -- calls without a pattern keep the old, weaker criterion (does not apply to any new
  // call site added this round, all of them pass a pattern).
  function expectSelfCheckFails(mutations, label, expectedFailPattern) {
    const backups = new Map();
    for (const [p] of mutations) backups.set(p, fs.readFileSync(p, 'utf8'));
    let mutantFailed = false;
    let subprocessOutput = '';
    try {
      for (const [p, content] of mutations) fs.writeFileSync(p, content, 'utf8');
      execSync(`node ${JSON.stringify(__filename)} --self-check-skip-mutation`, {
        cwd: __dirname, stdio: 'pipe', timeout: 60000,
      });
    } catch (e) {
      mutantFailed = true;
      subprocessOutput = String(e.stdout ?? '') + '\n' + String(e.stderr ?? '');
    } finally {
      for (const [p, orig] of backups) fs.writeFileSync(p, orig, 'utf8');
    }
    assert(mutantFailed, `mutacja [${label}] złapana czerwono przez self-check podproces (niezerowy exit code)`);
    if (mutantFailed && expectedFailPattern !== undefined) {
      assert(expectedFailPattern.test(subprocessOutput),
        `mutacja [${label}]: stdout/stderr podprocesu zawiera linię FAIL: pasującą do wzorca ` +
        `${expectedFailPattern} (nie tylko niezerowy exit code -- wyklucza fałszywie pozytywny ` +
        `dowód mutacyjny z awarii niezwiązanej z zamierzoną asercją)`);
    }
    return mutantFailed;
  }

  console.log('\n-- Sekcja 9 / dowód mutacyjny: cofnięcie CAŁEJ naprawy RUNDY 4 do stanu RUNDY 3 --');
  {
    const filterStartMarker = 'if (skipDefenselessCities) {';
    const filterEndMarker = 'const nearestCity = nearest(unit.q, unit.r, civCities);';
    const writeStartMarker = 'if (skipDefenselessCities && nearestCity !== undefined';
    const writeEndMarker = 'const targets: { q: number; r: number; d: number }[] = [];';

    const filterStartIdx = barbariansOriginal.indexOf(filterStartMarker);
    const filterEndIdx = filterStartIdx === -1 ? -1 : barbariansOriginal.indexOf(filterEndMarker, filterStartIdx);
    const writeStartIdx = barbariansOriginal.indexOf(writeStartMarker);
    const writeEndIdx = writeStartIdx === -1 ? -1 : barbariansOriginal.indexOf(writeEndMarker, writeStartIdx);
    assert(filterStartIdx !== -1 && filterEndIdx !== -1,
      'mutacja-setup: blok filtra (RUNDA 4) odnaleziony w barbarians.ts');
    assert(writeStartIdx !== -1 && writeEndIdx !== -1,
      'mutacja-setup: blok zapisu pamięci (RUNDA 4) odnaleziony w barbarians.ts');

    if (filterStartIdx !== -1 && filterEndIdx !== -1 && writeStartIdx !== -1 && writeEndIdx !== -1) {
      // Dokładny stan RUNDY 3 (funkcjonalnie -- komentarze pominięte, esbuild i tak je
      // usuwa): pojedynczy slot `unit.recentlyClearedCityId`, ZERO zbioru, ZERO resetu.
      const OLD_FILTER_BLOCK =
        'if (skipDefenselessCities) {\n'
        + '      const filtered = civCitiesBase.filter(c => {\n'
        + '        const undefended = !enemies.some(e => e.q === c.q && e.r === c.r);\n'
        + '        if (!undefended) return true;\n'
        + '        return c.id !== unit.recentlyClearedCityId;\n'
        + '      });\n'
        + '      civCities = filtered.length > 0 ? filtered : civCitiesBase;\n'
        + '    }\n    ';
      const OLD_WRITE_BLOCK =
        'if (skipDefenselessCities && nearestCity !== undefined\n'
        + '        && hexDistance(unit.q, unit.r, nearestCity.q, nearestCity.r) <= 1\n'
        + '        && !enemies.some(e => e.q === nearestCity.q && e.r === nearestCity.r)) {\n'
        + '      unit.recentlyClearedCityId = nearestCity.id;\n'
        + '    }\n    ';

      // Splice od końca pliku ku początkowi (write block ma wyższy offset niż filter
      // block), żeby wcześniejsze indeksy zostały ważne.
      let mutated = barbariansOriginal.slice(0, writeStartIdx) + OLD_WRITE_BLOCK + barbariansOriginal.slice(writeEndIdx);
      const mFilterStartIdx = mutated.indexOf(filterStartMarker);
      const mFilterEndIdx = mutated.indexOf(filterEndMarker, mFilterStartIdx);
      mutated = mutated.slice(0, mFilterStartIdx) + OLD_FILTER_BLOCK + mutated.slice(mFilterEndIdx);

      assert(mutated !== barbariansOriginal, 'mutacja-setup: cofnięcie faktycznie zmieniło źródło barbarians.ts');
      expectSelfCheckFails(new Map([[barbariansSrcPath, mutated]]),
        'cofnięcie CAŁEJ naprawy RUNDY 4 do stanu RUNDY 3 (pojedynczy slot recentlyClearedCityId ' +
        'zamiast zbioru clearedCityIds) -- trzecie miasto NIE powinno być odwiedzane w >=30 turach, ' +
        'sekcja 6b MUSI to złapać',
        /FAIL:\s+6b/);
    }
  }

  // ----------------------------------------------------------------------------------------
  // 10. RUNDA 5, F1 -- dowód mutacyjny: cofnięcie warunku resetu do starego
  //    `filtered.length === 0` (stan sprzed tej rundy) MUSI dać czerwono na sekcji 6d (plansza
  //    MIESZANA) -- stary warunek nigdy się nie odpala, gdy istnieje choćby jedno bronione
  //    miasto (przechodzi filtr bezwarunkowo), więc zbiór `clearedCityIds` rośnie bez końca i
  //    reset nigdy nie następuje.
  // ----------------------------------------------------------------------------------------
  console.log('-- F1 (runda 5) / dowód mutacyjny: cofnięcie warunku resetu --');
  {
    const F1_NEW_LINE = 'if (undefendedCities.length > 0 && undefendedCities.every(c => clearedSet.includes(c.id))) {';
    const F1_OLD_LINE = 'if (filtered.length === 0 && civCitiesBase.length > 0) {';
    const f1Occurrences = barbariansOriginal.split(F1_NEW_LINE).length - 1;
    assert(f1Occurrences === 1,
      `mutacja-setup F1: warunek resetu (nowa wersja) odnaleziony DOKŁADNIE RAZ w barbarians.ts (got ${f1Occurrences})`);
    if (f1Occurrences === 1) {
      const mutatedF1 = barbariansOriginal.replace(F1_NEW_LINE, F1_OLD_LINE);
      assert(mutatedF1 !== barbariansOriginal, 'mutacja-setup F1: cofnięcie faktycznie zmieniło źródło barbarians.ts');
      expectSelfCheckFails(new Map([[barbariansSrcPath, mutatedF1]]),
        'F1: cofnięcie warunku resetu do starego "filtered.length === 0 && civCitiesBase.length > 0" ' +
        '-- na planszy MIESZANEJ (sekcja 6d, bronione miasto obecne przez cały bieg) reset nigdy ' +
        'się nie odpala, bo bronione miasto zawsze przechodzi filtr bezwarunkowo',
        /FAIL:\s+6d/);
    }
  }

  // ----------------------------------------------------------------------------------------
  // 11. RUNDA 5, F2 -- dowód mutacyjny: cofnięcie strażnika osiągalności (próba KOLEJNEGO
  //    kandydata z listy) do starej wersji "tylko targets[0]" MUSI dać czerwono na sekcji 6e
  //    (najbliższy kandydat nieosiągalny za wodą, dalszy osiągalny) -- bez strażnika jednostka
  //    raid-ready (chaseRadius=Infinity) zamiera bez ŻADNEJ komendy, bo krok 4 (dryf do obozu)
  //    jest świadomie pomijany dla raidReady.
  // ----------------------------------------------------------------------------------------
  console.log('-- F2 (runda 5) / dowód mutacyjny: cofnięcie strażnika osiągalności --');
  {
    const f2StartMarker = 'let movedToTarget = false;';
    const f2EndMarker = 'if (movedToTarget) continue;';
    const f2StartIdx = barbariansOriginal.indexOf(f2StartMarker);
    const f2EndIdx = f2StartIdx === -1 ? -1 : barbariansOriginal.indexOf(f2EndMarker, f2StartIdx);
    assert(f2StartIdx !== -1 && f2EndIdx !== -1,
      'mutacja-setup F2: pętla reachability (RUNDA 5) odnaleziona w barbarians.ts');
    if (f2StartIdx !== -1 && f2EndIdx !== -1) {
      // Stan sprzed F2 -- wyłącznie targets[0], zero próby kolejnego kandydata.
      const OLD_MOVE_BLOCK =
        'const target = targets[0];\n'
        + '    if (target !== undefined && target.d <= chaseRadius) {\n'
        + '      const step = firstStep(unit, map, target.q, target.r, occ);\n'
        + '      if (step !== null) {\n'
        + '        commands.push({ type: \'move\', unitId: unit.id, toQ: step.q, toR: step.r });\n'
        + '        continue;\n'
        + '      }\n'
        + '    }';
      const mutatedF2 = barbariansOriginal.slice(0, f2StartIdx) + OLD_MOVE_BLOCK
        + barbariansOriginal.slice(f2EndIdx + f2EndMarker.length);
      assert(mutatedF2 !== barbariansOriginal, 'mutacja-setup F2: cofnięcie faktycznie zmieniło źródło barbarians.ts');
      expectSelfCheckFails(new Map([[barbariansSrcPath, mutatedF2]]),
        'F2: cofnięcie strażnika osiągalności do "wyłącznie targets[0]" -- w scenariuszu zamrożenia ' +
        '(sekcja 6e: najbliższy kandydat nieosiągalny za wodą, dalszy osiągalny) jednostka raid-' +
        'ready ponownie zamiera bez żadnej komendy zamiast spróbować kolejnego kandydata',
        /FAIL:\s+6e/);
    }
  }

  // ----------------------------------------------------------------------------------------
  // 13. RUNDA 6, USTERKA 1 -- dowód mutacyjny: cofnięcie naprawy F1-LIVELOCK (Evaluator A) do
  //    `unit.clearedCityIds = [];` (pełne czyszczenie, stan sprzed tej rundy) MUSI dać czerwono
  //    na sekcji 6f (dokładnie 1 miasto niebronione + 1 bronione, jednostka NIE raid-ready) --
  //    jednostka wraca do stanu opisanego przez Evaluatora A: nieskończone odbijanie się między
  //    dwiema pozycjami wokół cityNear, NIGDY nie dociera do cityFar w budżecie 40 tur.
  // ----------------------------------------------------------------------------------------
  console.log('-- USTERKA 1 (runda 6) / dowód mutacyjny: cofnięcie naprawy F1-LIVELOCK --');
  {
    const USTERKA1_NEW =
      'const lastVisited = clearedSet[clearedSet.length - 1];\n'
      + '        unit.clearedCityIds = lastVisited !== undefined ? [lastVisited] : [];';
    const USTERKA1_OLD = '        unit.clearedCityIds = [];';
    const u1Occurrences = barbariansOriginal.split(USTERKA1_NEW).length - 1;
    assert(u1Occurrences === 1,
      `mutacja-setup USTERKA 1: naprawa F1-LIVELOCK (nowa wersja) odnaleziona DOKŁADNIE RAZ w barbarians.ts (got ${u1Occurrences})`);
    if (u1Occurrences === 1) {
      const mutatedU1 = barbariansOriginal.replace(USTERKA1_NEW, USTERKA1_OLD);
      assert(mutatedU1 !== barbariansOriginal, 'mutacja-setup USTERKA 1: cofnięcie faktycznie zmieniło źródło barbarians.ts');
      expectSelfCheckFails(new Map([[barbariansSrcPath, mutatedU1]]),
        'USTERKA 1: cofnięcie naprawy F1-LIVELOCK do pełnego czyszczenia "unit.clearedCityIds = []" ' +
        '-- na planszy z DOKŁADNIE 1 miastem niebronionym + 1 bronionym (sekcja 6f) jednostka wraca ' +
        'do 3-turowego cyklu odbijania i NIGDY nie dociera do bronionego miasta w 40 turach',
        /FAIL:\s+6f/);
    }
  }

  // ----------------------------------------------------------------------------------------
  // 14. RUNDA 6, USTERKA 2 -- dowód mutacyjny: usunięcie SAMEGO filtra spójnych składowych
  //    F2-PERF (bez cofania reszty logiki F2 z rundy 5 -- próba KOLEJNEGO kandydata zostaje)
  //    MUSI dać czerwono na bramce wydajnościowej sekcji 12 (archipelag nieosiągalnych miast +
  //    duża osiągalna wyspa domowa) -- bez filtra każda próba nieosiągalnego kandydata znów
  //    kosztuje pełną Dijkstrę po całej wyspie domowej, budżet czasowy zostaje przekroczony.
  // ----------------------------------------------------------------------------------------
  console.log('-- USTERKA 2 (runda 6) / dowód mutacyjny: usunięcie filtra spójnych składowych F2-PERF --');
  {
    const F2PERF_FILTER_BLOCK =
      '      if (unitComp !== undefined) {\n'
      + '        const candComps = destComponentIds(map, getLandComponents(), cand.q, cand.r);\n'
      + '        if (!candComps.has(unitComp)) continue; // dowiedlnie inna wyspa/kontynent -- pomiń bez Dijkstry / provably a different island/continent -- skip without paying for Dijkstra\n'
      + '      }\n';
    const f2PerfOccurrences = barbariansOriginal.split(F2PERF_FILTER_BLOCK).length - 1;
    assert(f2PerfOccurrences === 1,
      `mutacja-setup USTERKA 2: filtr spójnych składowych (F2-PERF) odnaleziony DOKŁADNIE RAZ w barbarians.ts (got ${f2PerfOccurrences})`);
    if (f2PerfOccurrences === 1) {
      const mutatedF2Perf = barbariansOriginal.replace(F2PERF_FILTER_BLOCK, '');
      assert(mutatedF2Perf !== barbariansOriginal, 'mutacja-setup USTERKA 2: cofnięcie faktycznie zmieniło źródło barbarians.ts');
      // Budżet 60s domyślny execSync timeout w expectSelfCheckFails MUSI starczyć na ~10s
      // niezoptymalizowanego scenariusza sekcji 12 + resztę pliku -- zmierzone bezpiecznie
      // poniżej limitu (patrz raport rundy 6).
      expectSelfCheckFails(new Map([[barbariansSrcPath, mutatedF2Perf]]),
        'USTERKA 2: usunięcie filtra spójnych składowych F2-PERF (reszta pętli F2 z rundy 5 ' +
        'niezmieniona) -- bramka wydajnościowa sekcji 12 (archipelag nieosiągalnych miast) MUSI ' +
        'przekroczyć budżet czasowy bez filtra',
        /FAIL:\s+12/);
    }
  }
}

// --- summary ----------------------------------------------------------------------------------
console.log(`\nbarb-city-behavior-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed > 0 ? 1 : 0);
