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
  eq(b1.recentlyClearedCityId, undefined, '2a: fresh unit starts with no memory');
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
  eq(b1.recentlyClearedCityId, 'cityWest',
    '2a normal: decideBarbarianMoves remembers cityWest as "seen undefended" ON b1 after this decision');

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
  eq(b2.recentlyClearedCityId, 'cityWest', "2c normal: b2 builds its OWN memory, independent of b1's");
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
  const b2 = barb('b2', 5, 0, { recentlyClearedCityId: 'onlyCity' });
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
  const b3 = barb('b3', 5, 0, { campId: 'destroyed-camp', recentlyClearedCityId: 'onlyCity' });
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
// 6. RUNDA 3, punkt 2 -- livelock fix. `unit.recentlyClearedCityId` musi zapisywać się
//    dopiero po REALNYM dotarciu (hexDistance<=1), nie na podstawie samego wyboru celu.
//    Symulacja >=6 kolejnych decyzji z RZECZYWIŚCIE stosowanym ruchem: `unit.q/r`
//    aktualizowane z komendy `move`, ale TYLKO gdy `canUnitOccupyCityHex` pozwala --
//    dokładnie ta sama bramka, którą main.ts stosuje przy aplikowaniu komend
//    barbarzyńców (main.ts ok. linii 26258: `if (!canUnitOccupyCityHex(...)) continue;`
//    przed `bu.q = bcmd.toQ`). Bez tej bramki symulacja fałszywie pozwoliłaby jednostce
//    "wejść" na heks miasta, którego pathfinder NIE blokuje jako celu ścieżki (blokuje
//    tylko przejście PRZEZ obcy heks miasta, nie sam ostatni krok -- patrz
//    computePath/setup.ts "Destination: always passable as final step").
// ============================================================================================
{
  /**
   * Symuluje `turns` kolejnych decyzji `decideBarbarianMoves` dla JEDNEJ jednostki,
   * aplikując ruch tak jak main.ts (bramkowane `canUnitOccupyCityHex`). Zwraca log
   * per-turowy: dystans do cityA/cityB PRZED decyzją tej tury, typ wydanej komendy,
   * oraz pamięć jednostki PO tej decyzji.
   */
  function simulateChase(unit, enemies, cities, map, params, difficulty, turns) {
    const [cityA, cityB] = cities;
    const log = [];
    for (let t = 0; t < turns; t++) {
      const dA = hexDist(unit.q, unit.r, cityA.q, cityA.r);
      const dB = hexDist(unit.q, unit.r, cityB.q, cityB.r);
      const cmds = decideBarbarianMoves([unit], enemies, cities, [], map, params, undefined, difficulty);
      const cmd = cmds[0];
      let moved = false;
      if (cmd?.type === 'move' && canUnitOccupyCityHex(unit.ownerId, cmd.toQ, cmd.toR, cities)) {
        unit.q = cmd.toQ;
        unit.r = cmd.toR;
        moved = true;
      }
      log.push({ t, dA, dB, cmdType: cmd?.type ?? 'idle', moved, memoryAfter: unit.recentlyClearedCityId });
      if (cmd?.type === 'attack') break;
    }
    return log;
  }

  /** Faza = seria kolejnych wpisów log-u, dopóki `memoryAfter` nie zmieni się na
   *  `targetCityId` (albo dopóki nie pojawi się `attack`) -- asercjonuje monotoniczny
   *  spadek `distKey` (dA lub dB) w KAŻDYM kroku fazy, i że dystans faktycznie
   *  osiąga <=1 (dotarcie) LUB faza kończy się atakiem (miasto bronione). */
  function assertMonotonicPhase(log, distKey, targetCityId, minSteps, label) {
    const phase = [];
    for (const entry of log) {
      phase.push(entry);
      if (entry.memoryAfter === targetCityId || entry.cmdType === 'attack') break;
    }
    assert(phase.length >= minSteps,
      `${label}: fazy trwa >= ${minSteps} decyzji (got ${phase.length})`);
    for (let i = 1; i < phase.length; i++) {
      assert(phase[i][distKey] < phase[i - 1][distKey],
        `${label}: krok ${i} -- dystans (${distKey}) maleje monotonicznie ` +
        `(${phase[i - 1][distKey]} -> ${phase[i][distKey]}), BEZ cofnięcia w trakcie fazy`);
    }
    const last = phase[phase.length - 1];
    assert(last.memoryAfter === targetCityId || last.cmdType === 'attack',
      `${label}: faza kończy się DOTARCIEM (memory=${targetCityId}) albo ATAKIEM na obrońcę ` +
      `(got memoryAfter=${last.memoryAfter}, cmdType=${last.cmdType})`);
    return phase;
  }

  function makeChaseScenario(secondCityDefended) {
    const map = makeMap(26, 8);
    const cityA = city('cityA', 4, 4);   // bliżej, niebronione
    const cityB = city('cityB', 14, 4);  // dalej, wariant broniony/niebroniony
    const enemies = secondCityDefended ? [enemy('g', 14, 4)] : [];
    // campId wskazujący na nieistniejący obóz -> orphaned -> raidReady=true
    // (chaseRadius=Infinity) -- ten sam wzorzec co sekcja 3c wyżej, bez potrzeby
    // konfigurowania realnych obozów.
    const unit = barb('b1', 8, 4, { campId: 'destroyed-camp' });
    return { map, cityA, cityB, enemies, unit };
  }

  for (const secondCityDefended of [false, true]) {
    const label = secondCityDefended ? 'drugie miasto BRONIONE' : 'drugie miasto NIEBRONIONE';
    const { map, cityA, cityB, enemies, unit } = makeChaseScenario(secondCityDefended);
    const log = simulateChase(unit, enemies, [cityA, cityB], map, P, 'normal', 20);

    // Faza 1: dojście do cityA (bliższe, zawsze niebronione w tym scenariuszu) --
    // dystans dA maleje monotonicznie, kończy się "dotarciem" (memory=cityA).
    const phase1 = assertMonotonicPhase(log, 'dA', cityA.id, 4, `6 (${label}) faza 1 (do cityA)`);

    // Faza 2: dojście do cityB -- reszta logu po fazie 1.
    const phase2Log = log.slice(phase1.length);
    assert(phase2Log.length > 0,
      `6 (${label}): faza 2 (do cityB) faktycznie się zaczyna po dotarciu do cityA`);
    const phase2 = assertMonotonicPhase(phase2Log, 'dB', cityB.id, 6, `6 (${label}) faza 2 (do cityB)`);

    if (secondCityDefended) {
      assert(phase2[phase2.length - 1].cmdType === 'attack',
        `6 (${label}): dotarcie do BRONIONEGO cityB kończy się atakiem na obrońcę, nie ` +
        `próbą wejścia na heks -- memory NIGDY nie zapisuje cityB (miasto broni się samo)`);
      assert(phase2[phase2.length - 1].memoryAfter === cityA.id,
        `6 (${label}): pamięć zostaje przy cityA -- broniony cel nigdy nie trafia do ` +
        `recentlyClearedCityId (filtr go i tak nigdy nie wyklucza)`);
    } else {
      assert(phase2[phase2.length - 1].memoryAfter === cityB.id,
        `6 (${label}): dotarcie do NIEBRONIONEGO cityB zapisuje memory=cityB dopiero PO ` +
        `faktycznym dotarciu (hexDistance<=1), nie wcześniej`);
    }

    // Regresja livelocku: żadna z dwóch faz nie trwa mniej niż 4 decyzje -- stary bug
    // dawał 2-turowy cykl (faza "1" miałaby długość ~1-2 z natychmiastowym zawróceniem).
    assert(phase1.length + phase2.length >= 10,
      `6 (${label}): łącznie >=10 decyzji analizowanych w obu fazach (got ` +
      `${phase1.length + phase2.length}) -- >= wymagane 6 z zapasem`);
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

// --- summary ----------------------------------------------------------------------------------
console.log(`\nbarb-city-behavior-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed > 0 ? 1 : 0);
