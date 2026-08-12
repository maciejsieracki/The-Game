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
 * Sekcje:
 *   1. decideBarbarianMoves -- easy (bez param. `difficulty` ORAZ z difficulty='easy')
 *      = zachowanie LEGACY, bit-identyczne: miasto bez obrońców dalej jest celem
 *      "chase" (punkt zadania (a): "żadna nowa gałąź kodu się nie uruchamia").
 *   2. decideBarbarianMoves -- normal: miasto bez obrońców NIE jest już celem --
 *      jednostka celuje w kolejne (obronione) miasto (punkt zadania (b)).
 *   3. decideBarbarianMoves -- hard: ta sama filtracja jak normal (capture jest
 *      efektem UBOCZNYM zwycięskiej walki w main.ts, nie osobną gałęzią targetowania
 *      tutaj) + własne (już przejęte) miasto barbarzyńców nigdy nie jest celem.
 *   4. applyPostBattleMap + applyCityCaptureAfterBattle z atkOwner=BARBARIAN_OWNER_ID
 *      -- DOWÓD WYKONYWALNY (nie tylko analiza Fazy 1) że silnikowy prymityw
 *      przejęcia miasta akceptuje ownerId=-1 bez wywrotki i poprawnie zmienia
 *      city.ownerId (punkt zadania (c), część "miasto zmienia ownerId TYLKO gdy
 *      oczyszczone z obrońców" zweryfikowana jako precondition przed capture).
 *   5. Static: main.ts -- bramka `_menuDifficulty === 'hard'` przy barbarzyńskim
 *      ataku, dodatkowy guard `barbCaptureBlockedByRemainingDefenders`, przekazanie
 *      `_menuDifficulty` do decideBarbarianMoves, oraz regres -- AI-vs-gracz (inny
 *      caller doAutoPowerMapBattle/launchIncomingMapFieldBattle) NIE dostaje
 *      barbAllowCityCapture (capture pozostaje wyłącznie barbarzyński/hard).
 *
 * main.ts NIE jest bundlowany (monolityczny plik z zależnościami DOM/THREE -- ten
 * sam ograniczenie co w barb-camp-destruction-test.cjs) -- sekcja 5 jest więc
 * weryfikacją STATYCZNĄ (przeszukanie tekstu źródła), jawnie oznaczoną "static:".
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
// 2. normal -- defenseless city excluded from targeting: same geometry as section 1, but the
//    unit now steps EAST toward the farther, DEFENDED cityEast instead. Punkt zadania (b).
// ============================================================================================
{
  const map = makeMap(15, 3);
  const cityWest = city('cityWest', 2, 0);
  const cityEast = city('cityEast', 9, 0);
  const g = enemy('g', 9, 0);
  const b = barb('b1', 5, 0);

  const cmds = decideBarbarianMoves([b], [g], [cityWest, cityEast], [], map, P, undefined, 'normal');
  eq(cmds.length, 1, '2 normal: exactly one move command');
  const cmd = cmds[0];
  eq(cmd?.type, 'move', '2 normal: command is a move');
  const dWestBefore = hexDist(b.q, b.r, cityWest.q, cityWest.r);
  const dWestAfter = hexDist(cmd.toQ, cmd.toR, cityWest.q, cityWest.r);
  const dEastBefore = hexDist(b.q, b.r, cityEast.q, cityEast.r);
  const dEastAfter = hexDist(cmd.toQ, cmd.toR, cityEast.q, cityEast.r);
  assert(dEastAfter < dEastBefore,
    `2 normal: step gets closer to the defended cityEast (before=${dEastBefore}, after=${dEastAfter})`);
  assert(dWestAfter >= dWestBefore,
    `2 normal: step does NOT get closer to the defenseless cityWest, even though it is closer ` +
    `(before=${dWestBefore}, after=${dWestAfter}) -- once cityWest has no garrison it is skipped`);
}

// ============================================================================================
// 3. hard -- same target-filtering as normal (capture itself is a main.ts-side post-battle
//    effect, not a separate targeting branch here) + an already barbarian-OWNED city is never
//    a chase target (pre-existing isBarbarian filter, pinned here as a regression guard).
// ============================================================================================
{
  const map = makeMap(15, 3);
  const cityWest = city('cityWest', 2, 0);
  const cityEast = city('cityEast', 9, 0);
  const g = enemy('g', 9, 0);
  const b = barb('b1', 5, 0);

  const cmds = decideBarbarianMoves([b], [g], [cityWest, cityEast], [], map, P, undefined, 'hard');
  eq(cmds.length, 1, '3 hard: exactly one move command');
  const cmd = cmds[0];
  eq(cmd?.type, 'move', '3 hard: command is a move');
  const dEastBefore = hexDist(b.q, b.r, cityEast.q, cityEast.r);
  const dEastAfter = hexDist(cmd.toQ, cmd.toR, cityEast.q, cityEast.r);
  assert(dEastAfter < dEastBefore,
    `3 hard: step gets closer to the defended cityEast, same filtering as normal ` +
    `(before=${dEastBefore}, after=${dEastAfter})`);

  // 3b. Already-captured (barbarian-owned) city is excluded from targeting even though it
  // has no garrison -- same as any other barbarian-owned map object (units, camps).
  const ownCapturedCity = city('ownCity', 9, 0, { ownerId: BARBARIAN_OWNER_ID });
  const farUndefendedCity = city('farCity', 12, 0, { ownerId: 0 }); // no garrison either
  const b2 = barb('b2', 5, 0);
  const cmds2 = decideBarbarianMoves([b2], [], [ownCapturedCity, farUndefendedCity], [], map, P, undefined, 'hard');
  // Both remaining cities are defenseless under 'hard' filtering (ownCity excluded outright by
  // isBarbarian, farCity excluded by the no-garrison filter) -- no valid chase target, and with
  // no camps to idle toward, decideBarbarianMoves must emit nothing.
  eq(cmds2.length, 0, '3b hard: no target at all when the only cities are (barb-owned) or (defenseless)');
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

  // Precondition for hard-mode capture (main.ts barbCaptureBlockedByRemainingDefenders):
  // zero non-barbarian units remain on the city hex after the barbarian's ATK win.
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
// 5. Static: main.ts wiring for the hard-only capture gate + normal/hard difficulty threading.
// ============================================================================================
{
  const mainTsPath = path.join(GRA_ROOT, 'src/main.ts');
  const mainTs = fs.readFileSync(mainTsPath, 'utf8');

  // 5a. _menuDifficulty threaded into decideBarbarianMoves (normal/hard target filtering).
  assert(mainTs.includes('landBarbs, playerUnitsForBarbs, cities, barbCamps, map, barbLive, barbCanEngageOwner,')
    && mainTs.includes('_menuDifficulty,\n            );'),
    'static 5a: decideBarbarianMoves() call passes _menuDifficulty as the difficulty argument');

  // 5b. hard-only gate for barbarian city capture.
  assert(mainTs.includes("const barbAllowCityCapture = _menuDifficulty === 'hard';"),
    "static 5b: barbAllowCityCapture is gated on _menuDifficulty === 'hard'");

  // 5c. barbAllowCityCapture is actually threaded into BOTH battle-resolution call sites at the
  // barbarian attack command handler (interactive vs-player, and auto vs-AI).
  const attackBlockIdx = mainTs.indexOf("bcmd.type === 'attack'");
  assert(attackBlockIdx !== -1, 'static 5c: found the barbarian attack command handler');
  const attackBlock = mainTs.slice(attackBlockIdx, attackBlockIdx + 2600);
  assert(attackBlock.includes('barbAllowCityCapture'), 'static 5c: barbAllowCityCapture computed in the handler');
  const launchCallIdx = attackBlock.indexOf('launchIncomingMapFieldBattle(');
  const autoCallIdx = attackBlock.indexOf('doAutoPowerMapBattle(');
  assert(launchCallIdx !== -1 && autoCallIdx !== -1, 'static 5c: both battle-resolution calls found in the handler');
  assert(attackBlock.slice(launchCallIdx, launchCallIdx + 550).includes('barbAllowCityCapture'),
    'static 5c: launchIncomingMapFieldBattle(...) receives barbAllowCityCapture (interactive vs-player path)');
  assert(attackBlock.slice(autoCallIdx, autoCallIdx + 350).includes('barbAllowCityCapture'),
    'static 5c: doAutoPowerMapBattle(...) receives barbAllowCityCapture (auto vs-AI path)');

  // 5d. applyMapBattleOutcome's capture branch has the extra "cleared to zero defenders" guard,
  // scoped to barbarian attackers only (does not touch the player/AI capture gate itself).
  assert(mainTs.includes('barbCaptureBlockedByRemainingDefenders'),
    'static 5d: applyMapBattleOutcome defines the barbarian-only "cleared to zero" guard');
  const guardDefIdx = mainTs.indexOf('const barbCaptureBlockedByRemainingDefenders =');
  assert(guardDefIdx !== -1, 'static 5d: guard definition found');
  const guardWindow = mainTs.slice(guardDefIdx, guardDefIdx + 400);
  assert(guardWindow.includes('isBarbarian(atkOwnerForCapture)'),
    'static 5d: guard only evaluates non-trivially for a barbarian attacker (isBarbarian check)');
  const captureIfIdx = mainTs.indexOf('opts?.allowCityCapture === true || opts?.siegeContext === true');
  assert(captureIfIdx !== -1, 'static 5d: found the existing player/AI capture condition');
  const captureIfWindow = mainTs.slice(captureIfIdx, captureIfIdx + 250);
  assert(captureIfWindow.includes('!barbCaptureBlockedByRemainingDefenders'),
    'static 5d: the capture condition additionally requires !barbCaptureBlockedByRemainingDefenders');

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
