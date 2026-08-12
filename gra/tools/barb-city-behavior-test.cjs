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
//    geometrii (cityWest niebronione q=2 dist=3, cityEast bronione przez `g` q=9 dist=4,
//    jednostka startuje q=5):
//    2a. Świeża jednostka (bez pamięci) celuje w BLIŻSZE niebronione cityWest -- nigdy go
//        wcześniej nie "oczyściła", więc filtr go NIE wyklucza (punkt 3: nie wszystkie
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
  const b1 = barb('b1', 5, 0);
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
  const b2 = barb('b2', 5, 0);
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

// --- summary ----------------------------------------------------------------------------------
console.log(`\nbarb-city-behavior-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed > 0 ? 1 : 0);
