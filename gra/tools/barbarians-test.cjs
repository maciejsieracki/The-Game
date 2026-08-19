'use strict';
/**
 * barbarians-test.cjs -- standalone Node test for src/game/barbarians.ts.
 * Run from gra/:  node tools/barbarians-test.cjs
 *
 * Self-contained: bundles barbarians.ts (+ its setup.ts deps) with esbuild to a
 * temp CJS file, then requires it and runs assertions. Does NOT touch the shared
 * logic-test harness or .logic-entry.ts. Pure logic only -- no DOM, no THREE.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[barbarians-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.barb-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.barb-bundle.cjs');

const ENTRY_TS = `
export {
  BARBARIAN_OWNER_ID, isBarbarian, planBarbarianRally,
  FALLBACK_BARB_PARAMS, loadBarbParams, barbariansActive,
  EPOKA_SREDNIOWIECZE_BARBARZY,
  spawnCamps, tickCamps, decideBarbarianMoves, isCampRaidReady,
  LUDY_MORZA_BARB_UNIT_IDS, pickBronzeBarbUnit,
  FALLBACK_SEA_BARB_PARAMS, loadSeaBarbParams, spawnSeaCamps,
  spawnSeaPeoplesRaiders, purgeNavalCamps, SEA_WAVE_CAMP_ID,
  decideSeaPeoplesRaids, collectSeaRaidTargets, isCoastalCity,
  scaleBarbParamsForLevel, barbarianUnitsPerCampForDifficulty, barbariansEnabledForLevel, migrateBarbariansLevel,
} from '../src/game/barbarians';
export {
  hexDistance, computePath, computeReachable, keyOf,
  isWaterTerrain, embarkMoveCost, terrainMoveCost, EMBARKED_WATER_MOVE_COST,
} from '../src/units/setup';
export {
  EMBARK_TECH, EMBARK_DEFENSE_MULT,
  canUnitEmbark, moveCostFnFor, applyEmbarkStateAfterMove, nearestFreeWaterHex,
} from '../src/game/embarkation';
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
  console.error('[barbarians-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const B = require(BUNDLE_FILE);
const {
  BARBARIAN_OWNER_ID, isBarbarian, planBarbarianRally,
  FALLBACK_BARB_PARAMS, loadBarbParams, barbariansActive,
  EPOKA_SREDNIOWIECZE_BARBARZY,
  spawnCamps, tickCamps, decideBarbarianMoves, isCampRaidReady,
  LUDY_MORZA_BARB_UNIT_IDS, pickBronzeBarbUnit,
  scaleBarbParamsForLevel, barbarianUnitsPerCampForDifficulty, barbariansEnabledForLevel, migrateBarbariansLevel,
  FALLBACK_SEA_BARB_PARAMS, loadSeaBarbParams, spawnSeaCamps,
  spawnSeaPeoplesRaiders, purgeNavalCamps, SEA_WAVE_CAMP_ID,
  decideSeaPeoplesRaids, collectSeaRaidTargets, isCoastalCity,
  hexDistance, computePath, computeReachable,
  isWaterTerrain, embarkMoveCost, EMBARKED_WATER_MOVE_COST,
  EMBARK_TECH, EMBARK_DEFENSE_MULT,
  canUnitEmbark, moveCostFnFor, applyEmbarkStateAfterMove,
} = B;

// --- tiny assertion framework ----------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// --- helpers ---------------------------------------------------------------
// Rectangular map of Laka (passable), neutral. opts.gory / opts.owned are
// arrays of "q,r" keys overriding terrain / ownership.
function makeMap(w, h, opts = {}) {
  const gory  = new Set(opts.gory  || []);
  const morze = new Set(opts.morze || []);       // TEMAT #15: heksy morza
  const wybrz = new Set(opts.wybrzeze || []);    // TEMAT #15: heksy wybrzeza
  const ulepszenia = opts.ulepszenia || {};      // { "q,r": 'farma' }
  const owned = opts.owned || {}; // { "q,r": "playerId" }
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      const teren = gory.has(k) ? 'gory' : morze.has(k) ? 'morze' : wybrz.has(k) ? 'wybrzeze' : 'laka';
      hexes[k] = {
        coords: { q, r },
        terenBazowy: teren,
        nakladka: 'brak',
        ulepszenie: (k in ulepszenia) ? ulepszenia[k] : 'brak',
        wlasciciel: (k in owned) ? owned[k] : null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}

function barb(id, q, r, extra = {}) {
  return Object.assign({
    id, ownerId: BARBARIAN_OWNER_ID, typeId: 'Wojownik', category: 'miecznik',
    q, r, ruch: 2, ruchLeft: 2,
  }, extra);
}
function player(id, q, r, ownerId = 0) {
  return { id, ownerId, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2 };
}

const P = FALLBACK_BARB_PARAMS;

// ===========================================================================
// 1. Faction identity
// ===========================================================================
eq(BARBARIAN_OWNER_ID, -1, 'BARBARIAN_OWNER_ID is -1');
assert(isBarbarian(-1) === true,  'isBarbarian(-1) true');
assert(isBarbarian(0)  === false, 'isBarbarian(0) false (human)');
assert(isBarbarian(3)  === false, 'isBarbarian(3) false (AI rival)');

// ===========================================================================
// 2. Param loading (tolerant of wartosc / wartość)
// ===========================================================================
{
  const def = loadBarbParams({ aiParams: {} });
  eq(def.maxCamps, P.maxCamps, 'empty params -> fallback maxCamps');
  eq(def.aggroRadius, P.aggroRadius, 'empty params -> fallback aggroRadius');

  const ascii = loadBarbParams({ aiParams: { barbarzyncy_max_obozy: { wartosc: 9 } } });
  eq(ascii.maxCamps, 9, 'reads ASCII "wartosc" override');

  const dia = loadBarbParams({ aiParams: { barbarzyncy_zasieg_agresji: { 'wartość': 10 } } });
  eq(dia.aggroRadius, 10, 'reads diacritic "wartość" override');

  const mix = loadBarbParams({ aiParams: { barbarzyncy_start_tura: { wartosc: 1 } } });
  eq(mix.startTurn, 1, 'override one key, others fall back');
  eq(mix.maxCamps, P.maxCamps, 'unspecified key keeps fallback');

  const bad = loadBarbParams({ aiParams: { barbarzyncy_max_obozy: { wartosc: null } } });
  eq(bad.maxCamps, P.maxCamps, 'null value -> fallback');
}

// ===========================================================================
// 3. barbariansActive gate
// ===========================================================================
assert(barbariansActive(P.startTurn, P) === true,  'active at startTurn');
assert(barbariansActive(P.startTurn - 1, P) === false, 'inactive before startTurn');
assert(barbariansActive(P.startTurn, P, 3) === true, 'active era3 (v0.1 max)');
assert(barbariansActive(P.startTurn, P, EPOKA_SREDNIOWIECZE_BARBARZY) === false, 'inactive from Sredniowiecze');

// ===========================================================================
// 4. spawnCamps
// ===========================================================================
{
  const map = makeMap(16, 16);
  const cities = [{ q: 0, r: 0 }];
  const params = Object.assign({}, P, { maxCamps: 5, minDistFromCity: 5, campSpacing: 4 });

  const camps = spawnCamps(map, [], cities, params, 12345);
  assert(camps.length > 0, 'spawnCamps produces at least one camp');
  assert(camps.length <= params.maxCamps, 'respects maxCamps cap');

  // All camps are on land, neutral, far enough from the city.
  let allLand = true, allFar = true;
  for (const c of camps) {
    const hex = map.hexes[`${c.q},${c.r}`];
    if (!hex || hex.terenBazowy === 'gory' || hex.wlasciciel !== null) allLand = false;
    if (hexDistance(c.q, c.r, 0, 0) < params.minDistFromCity) allFar = false;
  }
  assert(allLand, 'every camp on neutral passable land');
  assert(allFar,  'every camp >= minDistFromCity from the city');

  // Camp spacing respected pairwise.
  let spaced = true;
  for (let i = 0; i < camps.length; i++) {
    for (let j = i + 1; j < camps.length; j++) {
      if (hexDistance(camps[i].q, camps[i].r, camps[j].q, camps[j].r) < params.campSpacing) spaced = false;
    }
  }
  assert(spaced, 'camps respect campSpacing pairwise');

  // Determinism: same seed -> identical result.
  const again = spawnCamps(map, [], cities, params, 12345);
  eq(JSON.stringify(again), JSON.stringify(camps), 'spawnCamps deterministic for a fixed seed');

  // Existing camps consume slots.
  const existing = [{ id: 'x', q: 8, r: 8, spawnCooldown: 0 }];
  const more = spawnCamps(map, existing, cities, params, 999);
  assert(existing.length + more.length <= params.maxCamps, 'existing camps reduce remaining slots');

  // Full -> no new camps.
  const full = [0,1,2,3,4].map(i => ({ id: 'f'+i, q: i, r: 15, spawnCooldown: 0 }));
  eq(spawnCamps(map, full, cities, params, 7).length, 0, 'no camps when already at maxCamps');

  // No camp lands on a mountain tile.
  const gk = '10,10';
  const mapG = makeMap(16, 16, { gory: [gk] });
  const campsG = spawnCamps(mapG, [], [], Object.assign({}, P, { minDistFromCity: 0, campSpacing: 1, maxCamps: 50 }), 42);
  assert(campsG.every(c => `${c.q},${c.r}` !== gk), 'never places a camp on a mountain');
}

// ===========================================================================
// 5. tickCamps
// ===========================================================================
{
  const map = makeMap(10, 10);

  // 5a. Cooldown counts down without spawning.
  const r1 = tickCamps([{ id: 'c', q: 5, r: 5, spawnCooldown: 3 }], [], [], map, P);
  eq(r1.spawns.length, 0, 'no spawn while cooldown > 0');
  eq(r1.camps[0].spawnCooldown, 2, 'cooldown decremented 3 -> 2');

  // 5b. Spawn when ready and under cap; cooldown resets to spawnInterval.
  const camp = { id: 'c', q: 5, r: 5, spawnCooldown: 0 };
  const r2 = tickCamps([camp], [], [], map, P);
  eq(r2.spawns.length, 1, 'spawns one unit when ready and under cap');
  eq(r2.camps[0].spawnCooldown, P.spawnInterval, 'cooldown reset to spawnInterval after spawn');
  const sp = r2.spawns[0];
  eq(sp.campId, 'c', 'spawn carries the camp id');
  eq(sp.typeId, P.unitTypeId, 'spawn uses configured unit type');
  assert(hexDistance(sp.q, sp.r, 5, 5) <= 2, 'spawn placed near the camp');
  assert(map.hexes[`${sp.q},${sp.r}`] !== undefined, 'spawn lands on a real hex');

  // 5c. Input not mutated (purity).
  eq(camp.spawnCooldown, 0, 'tickCamps does not mutate input camp');

  // 5d. At cap -> no spawn, cooldown held at 0.
  const near = [barb('b1', 5, 6), barb('b2', 6, 5)]; // 2 within control radius
  const r3 = tickCamps([{ id: 'c', q: 5, r: 5, spawnCooldown: 0 }], near, near, map, P);
  eq(r3.spawns.length, 0, 'no spawn when per-camp cap reached');
  eq(r3.camps[0].spawnCooldown, 0, 'cooldown stays 0 while capped');

  // R-BARB-CHATKA-LIMIT-POZIOMY-Q1: difficulty controls the exact living
  // contingent, and campId keeps a slot occupied after the unit marches away.
  eq(barbarianUnitsPerCampForDifficulty('easy'), 1, 'Łatwy -> 1 żywa jednostka/chatkę');
  eq(barbarianUnitsPerCampForDifficulty('normal'), 2, 'Standard -> 2 żywe jednostki/chatkę');
  eq(barbarianUnitsPerCampForDifficulty('hard'), 3, 'Trudny -> 3 żywe jednostki/chatkę');
  eq(scaleBarbParamsForLevel(P, 'latwy', 'easy').unitsPerCamp, 1,
    'Łatwy: limit chatki wynosi 1');
  eq(scaleBarbParamsForLevel(P, 'normalny', 'normal').unitsPerCamp, 2,
    'Standard: limit chatki wynosi 2');
  eq(scaleBarbParamsForLevel(P, 'trudny', 'hard').unitsPerCamp, 3,
    'Trudny: limit chatki wynosi 3');

  const hard = scaleBarbParamsForLevel(P, 'normalny', 'hard');
  const farAlive = [
    barb('far1', 0, 0, { campId: 'away' }),
    barb('far2', 1, 0, { campId: 'away' }),
    barb('far3', 2, 0, { campId: 'away' }),
  ];
  const cappedAway = tickCamps(
    [{ id: 'away', q: 5, r: 5, spawnCooldown: 0 }],
    farAlive,
    farAlive,
    map,
    hard,
  );
  eq(cappedAway.spawns.length, 0,
    'Trudny: 3 żywe jednostki blokują spawn po odejściu od chatki');
  const afterDeath = tickCamps(
    cappedAway.camps,
    farAlive.slice(0, 2),
    farAlive.slice(0, 2),
    map,
    hard,
  );
  eq(afterDeath.spawns.length, 1,
    'po śmierci jednej jednostki chatka uzupełnia brakujący slot');

  // 5e. Spawn never lands on an occupied hex (ring-1 fully blocked -> ring-2).
  const occupants = [
    player('o1', 6, 5), player('o2', 4, 5), player('o3', 5, 6),
    player('o4', 5, 4), player('o5', 6, 4), player('o6', 4, 6),
  ];
  const r4 = tickCamps([{ id: 'c', q: 5, r: 5, spawnCooldown: 0 }], [], occupants, map, P);
  if (r4.spawns.length === 1) {
    const s = r4.spawns[0];
    const blocked = occupants.some(o => o.q === s.q && o.r === s.r);
    assert(!blocked, 'spawn avoids occupied hexes');
    assert(!(s.q === 5 && s.r === 5), 'spawn not on the camp hex itself');
  } else {
    assert(false, 'expected a ring-2 spawn when ring-1 is blocked');
  }
}

// ===========================================================================
// 6. decideBarbarianMoves
// ===========================================================================
{
  const map = makeMap(12, 12);
  const camps = [{ id: 'c', q: 6, r: 6, spawnCooldown: 0 }];

  // 6a. Attack an adjacent enemy.
  {
    const b = barb('b', 5, 5);
    const e = player('e', 6, 5);
    const cmds = decideBarbarianMoves([b], [e], [], camps, map, P);
    eq(cmds.length, 1, 'one command for one unit (attack)');
    eq(cmds[0].type, 'attack', 'adjacent enemy -> attack');
    eq(cmds[0].targetUnitId, 'e', 'attacks the adjacent enemy');
  }

  // 6a-canEngage. C-BARB-Q1/Q2 (Maciej 2026-07-26): the attack decision now
  // goes through the same war-state gate as the rest of the engine
  // (canEngageOwner), not a hard-coded "!isBarbarian". Unit sits ON its camp
  // and aggroRadius=0 so, with the attack blocked, there is no chase/idle
  // fallback command either -- isolates the attack-gate effect precisely.
  {
    const bOnCamp = barb('b', 6, 6); // same hex as the camp
    const e = player('e', 6, 5, 3); // AI rival owner 3, adjacent to the camp
    const noAggro = Object.assign({}, P, { aggroRadius: 0 });
    const cmdsBlocked = decideBarbarianMoves([bOnCamp], [e], [], camps, map, noAggro, () => false);
    eq(cmdsBlocked.length, 0, 'canEngageOwner=false -> no attack on adjacent enemy (and no chase/idle fallback)');
    const cmdsAllowed = decideBarbarianMoves([bOnCamp], [e], [], camps, map, noAggro, () => true);
    eq(cmdsAllowed.length, 1, 'canEngageOwner=true -> attack proceeds');
    eq(cmdsAllowed[0].type, 'attack', 'canEngageOwner=true -> attack command');
    eq(cmdsAllowed[0].targetUnitId, 'e', 'canEngageOwner=true -> targets the adjacent enemy');
    const cmdsOmitted = decideBarbarianMoves([bOnCamp], [e], [], camps, map, noAggro);
    eq(cmdsOmitted.length, 1, 'canEngageOwner omitted -> defaults to always-engageable (no regression for existing callers)');
    eq(cmdsOmitted[0].type, 'attack', 'omitted canEngageOwner -> attack command (unchanged default)');
  }

  // 6b. Chase a target inside aggro radius (step gets closer).
  {
    const b = barb('b', 0, 0);
    const e = player('e', 4, 0);
    const cmds = decideBarbarianMoves([b], [e], [], camps, map, Object.assign({}, P, { aggroRadius: 6 }));
    eq(cmds.length, 1, 'chase produces a move');
    eq(cmds[0].type, 'move', 'distant enemy in aggro -> move');
    const dNew = hexDistance(cmds[0].toQ, cmds[0].toR, 4, 0);
    assert(dNew < 4, 'chase step reduces distance to the target');
  }

  // 6c. Target beyond aggro, unit sitting on its camp -> idle (no command).
  {
    const b = barb('b', 6, 6); // on the camp
    const e = player('e', 11, 11);
    const cmds = decideBarbarianMoves([b], [e], [], camps, map, Object.assign({}, P, { aggroRadius: 2 }));
    eq(cmds.length, 0, 'no command when target out of aggro and already home');
  }

  // 6d. Idle drift back toward camp when away and no target in range.
  {
    const b = barb('b', 0, 0);
    const cmds = decideBarbarianMoves([b], [], [], camps, map, Object.assign({}, P, { aggroRadius: 1 }));
    eq(cmds.length, 1, 'drifts toward camp when idle and away');
    eq(cmds[0].type, 'move', 'idle drift is a move');
    const dNew = hexDistance(cmds[0].toQ, cmds[0].toR, 6, 6);
    assert(dNew < hexDistance(0, 0, 6, 6), 'idle step gets closer to camp');
  }

  // 6e. Low HP retreats to camp instead of attacking an adjacent enemy.
  {
    const b = barb('b', 5, 6, { healthFrac: 0.1 }); // adjacent to camp at (6,6)? dist 1 -> already home
    const bFar = barb('bf', 0, 0, { healthFrac: 0.1 });
    const e = player('e', 1, 0); // adjacent to bFar
    const cmds = decideBarbarianMoves([bFar], [e], [], camps, map, P);
    eq(cmds.length, 1, 'wounded unit issues one command');
    eq(cmds[0].type, 'move', 'wounded unit retreats (move), not attack');
    const dNew = hexDistance(cmds[0].toQ, cmds[0].toR, 6, 6);
    assert(dNew < hexDistance(0, 0, 6, 6), 'retreat step gets closer to camp');
    void b;
  }

  // 6f. Units with no movement left are skipped.
  {
    const b = barb('b', 0, 0, { ruchLeft: 0 });
    const e = player('e', 1, 0);
    const cmds = decideBarbarianMoves([b], [e], [], camps, map, P);
    eq(cmds.length, 0, 'ruchLeft <= 0 -> skipped');
  }

  // 6g. Barbarians never target each other.
  {
    const b1 = barb('b1', 6, 6);
    const b2 = barb('b2', 6, 5); // adjacent barbarian, not a target
    const cmds = decideBarbarianMoves([b1, b2], [], [], camps, map, P);
    const attacks = cmds.filter(c => c.type === 'attack');
    eq(attacks.length, 0, 'no attacks between barbarians');
  }

  // 6h. A city is a valid target when no enemy units exist.
  {
    const b = barb('b', 0, 0);
    const city = { q: 3, r: 0 };
    const cmds = decideBarbarianMoves([b], [], [city], camps, map, Object.assign({}, P, { aggroRadius: 6 }));
    eq(cmds.length, 1, 'moves toward a city target');
    eq(cmds[0].type, 'move', 'city raid approach is a move');
    const dNew = hexDistance(cmds[0].toQ, cmds[0].toR, 3, 0);
    assert(dNew < 3, 'step gets closer to the city');
  }

  // 6i. BUG-BARB-GLOD (Maciej 2026-08-02) + R-ARMIA-KONCENTRACJA-AI-BARB-Q1=A:
  // pełny obóz najpierw zbiera rozproszony kontyngent przy obozie; dopiero
  // następna decyzja po faktycznym zgrupowaniu idzie ku cywilizacji.
  {
    const raidCamp = [{ id: 'rc', q: 0, r: 0, spawnCooldown: 0 }];
    const b1 = barb('b1', 3, 0, { campId: 'rc' });
    const b2 = barb('b2', 0, 1, { campId: 'rc' });
    const farCity = { q: 11, r: 0, ownerId: 0 };
    const noAggro = Object.assign({}, P, { aggroRadius: 2, unitsPerCamp: 2, campControlRadius: 3 });
    assert(isCampRaidReady(raidCamp[0], [b2], noAggro) === false, 'isCampRaidReady false below cap');
    assert(isCampRaidReady(raidCamp[0], [b1, b2], noAggro) === true, 'isCampRaidReady true at cap');
    const cmdsIdle = decideBarbarianMoves([b1], [], [farCity], raidCamp, map, noAggro);
    eq(cmdsIdle.length, 1, 'under cap: drifts toward camp, not far city');
    eq(cmdsIdle[0].type, 'move', 'under cap drift is a move');
    const cmdsRaid = decideBarbarianMoves([b1, b2], [], [farCity], raidCamp, map, noAggro);
    eq(cmdsRaid.length, 1, 'full camp rallies the unit outside camp radius');
    for (const cmd of cmdsRaid) {
      eq(cmd.type, 'move', 'raid-ready units march (not idle)');
      const fromQ = cmd.unitId === 'b1' ? 3 : 0;
      const fromR = cmd.unitId === 'b1' ? 0 : 1;
      assert(hexDistance(cmd.toQ, cmd.toR, 0, 0) < hexDistance(fromQ, fromR, 0, 0),
        'rally step reduces distance to active camp');
    }
  }
}

// ===========================================================================
// 7. Ludy Morza jako barbarzyncy epoki Braz (BACKLOG, decyzja 2026-07-19)
// ===========================================================================
{
  eq(LUDY_MORZA_BARB_UNIT_IDS.length, 2, 'exactly two Ludy Morza unit ids');
  assert(LUDY_MORZA_BARB_UNIT_IDS.includes('Wojownik Sherden'), 'pool has Sherden');
  assert(LUDY_MORZA_BARB_UNIT_IDS.includes('Wojownik szekelesz'), 'pool has szekelesz');

  // 7a. pickBronzeBarbUnit is deterministic and alternates by seed parity.
  eq(pickBronzeBarbUnit(0), LUDY_MORZA_BARB_UNIT_IDS[0], 'seed 0 -> first unit');
  eq(pickBronzeBarbUnit(1), LUDY_MORZA_BARB_UNIT_IDS[1], 'seed 1 -> second unit');
  eq(pickBronzeBarbUnit(2), LUDY_MORZA_BARB_UNIT_IDS[0], 'seed 2 -> first unit again (alternation)');
  eq(pickBronzeBarbUnit(10), pickBronzeBarbUnit(0), 'same parity -> same unit (deterministic)');
  eq(pickBronzeBarbUnit(11), pickBronzeBarbUnit(1), 'same parity -> same unit (deterministic)');

  // 7b. Simulates main.ts's era override: for Braz (era 2), tickCamps spawns
  // only Ludy Morza unit ids across consecutive turns (naprzemiennie).
  const map = makeMap(10, 10);
  const seenTypes = new Set();
  for (let turn = 1; turn <= 4; turn++) {
    const bronzeParams = Object.assign({}, P, { unitTypeId: pickBronzeBarbUnit(turn) });
    const camp = { id: 'cbraz', q: 5, r: 5, spawnCooldown: 0 };
    const res = tickCamps([camp], [], [], map, bronzeParams);
    eq(res.spawns.length, 1, `Braz turn ${turn}: spawns one unit`);
    const typeId = res.spawns[0].typeId;
    assert(LUDY_MORZA_BARB_UNIT_IDS.includes(typeId), `Braz turn ${turn}: spawned typeId (${typeId}) is a Ludy Morza unit`);
    seenTypes.add(typeId);
  }
  eq(seenTypes.size, 2, 'across turns both Ludy Morza unit ids are used (naprzemiennie)');

  // 7c. Default era (e.g. Kamien) is untouched: spawn still uses the plain
  // fallback unit type ('Wojownik'), never a Ludy Morza id.
  {
    const camp = { id: 'ckam', q: 5, r: 5, spawnCooldown: 0 };
    const res = tickCamps([camp], [], [], map, P);
    eq(res.spawns[0].typeId, P.unitTypeId, 'default era: spawn uses FALLBACK unitTypeId (Wojownik)');
    assert(!LUDY_MORZA_BARB_UNIT_IDS.includes(res.spawns[0].typeId), 'default era: never a Ludy Morza unit');
  }
}

// ===========================================================================
// 8. TEMAT #15 -- Embarkacja (setup.ts + embarkation.ts)
// ===========================================================================
{
  eq(EMBARK_TECH, 'Żegluga', 'EMBARK_TECH is Zegluga');
  eq(EMBARK_DEFENSE_MULT, 0.5, 'embarked defense multiplier is 0.5 (-50%)');

  assert(isWaterTerrain('morze') === true, 'isWaterTerrain(morze) true');
  assert(isWaterTerrain('wybrzeze') === true, 'isWaterTerrain(wybrzeze) true');
  assert(isWaterTerrain('laka') === false, 'isWaterTerrain(laka) false');

  // Mapa: pas morza q=3..4 rozdziela dwa lady (r=0..2).
  const morze = [];
  for (let q = 3; q <= 4; q++) for (let r = 0; r < 3; r++) morze.push(`${q},${r}`);
  const map = makeMap(8, 3, { morze });

  const waterHex = map.hexes['3,1'];
  const landHex  = map.hexes['1,1'];
  eq(embarkMoveCost(waterHex), EMBARKED_WATER_MOVE_COST, 'water hex costs EMBARKED_WATER_MOVE_COST');
  assert(Number.isFinite(embarkMoveCost(landHex)), 'land hex keeps finite terrain cost');

  const u = player('u', 2, 1);
  // Bez costFn: morze nieprzejezdne -- brak trasy na drugi lad.
  const noPath = computePath(u, map, 6, 1, new Set());
  eq(noPath.length, 0, 'default costFn: sea strip is impassable');
  // Z embarkMoveCost: trasa przez morze istnieje.
  const seaPath = computePath(u, map, 6, 1, new Set(), embarkMoveCost);
  assert(seaPath.length > 0, 'embark costFn: path crosses the sea strip');
  assert(seaPath.some(hx => isWaterTerrain(map.hexes[`${hx.q},${hx.r}`].terenBazowy)),
    'embark path actually enters water hexes');

  // computeReachable: woda osiagalna tylko z costFn.
  const reachNo = computeReachable(player('r1', 2, 1), map, new Set());
  assert(!reachNo.has('3,1'), 'default reachable excludes water');
  const reachEmb = computeReachable(player('r2', 2, 1), map, new Set(), embarkMoveCost);
  assert(reachEmb.has('3,1'), 'embark reachable includes adjacent water hex');

  // canUnitEmbark / moveCostFnFor.
  const landUnit = { category: 'miecznik' };
  assert(canUnitEmbark(landUnit, true) === true,  'land unit + Zegluga -> can embark');
  assert(canUnitEmbark(landUnit, false) === false, 'land unit bez techa -> cannot embark');
  assert(canUnitEmbark({ category: 'galera' }, true) === false, 'galera never embarks');
  assert(canUnitEmbark({ category: 'miecznik', embarked: true }, false) === true,
    'already embarked unit can always sail (never stuck at sea)');
  assert(typeof moveCostFnFor(landUnit, true) === 'function', 'moveCostFnFor returns fn with tech');
  assert(moveCostFnFor(landUnit, false) === undefined, 'moveCostFnFor undefined without tech');

  // applyEmbarkStateAfterMove: woda -> embarked, lad -> zejscie na lad.
  const mu = player('m1', 3, 1); // na wodzie
  const changed1 = applyEmbarkStateAfterMove([mu], map);
  assert(changed1 === true, 'apply on water reports change');
  assert(mu.embarked === true, 'unit on water becomes embarked');
  mu.q = 5; mu.r = 1; // lad
  const changed2 = applyEmbarkStateAfterMove([mu], map);
  assert(changed2 === true, 'apply on land reports change');
  assert(mu.embarked === undefined, 'unit on land auto-disembarks (field removed)');
  // Stary save: jednostka ladowa bez pola -- brak zmiany.
  const legacy = player('m2', 1, 1);
  assert(applyEmbarkStateAfterMove([legacy], map) === false, 'legacy land unit unchanged (save compat)');
}

// ===========================================================================
// 9. TEMAT #15 -- Obozy nadmorskie Ludow Morza (spawnSeaCamps + tickCamps)
// ===========================================================================
{
  // loadSeaBarbParams: fallbacki wg trudnosci + odczyt override.
  const dNorm = loadSeaBarbParams({ aiParams: {} }, 'normal');
  eq(dNorm.maxSeaCamps, FALLBACK_SEA_BARB_PARAMS.maxSeaCamps, 'sea params fallback maxSeaCamps');
  eq(dNorm.raidRadius, FALLBACK_SEA_BARB_PARAMS.raidRadius, 'sea params fallback raidRadius');
  eq(dNorm.raidPeriod, 3, 'normal raid period fallback = 3');
  eq(loadSeaBarbParams({ aiParams: {} }, 'easy').raidPeriod, 6, 'easy raid period fallback = 6 (rzadko)');
  eq(loadSeaBarbParams({ aiParams: {} }, 'hard').raidPeriod, 1, 'hard raid period fallback = 1 (czesto)');
  const ovr = loadSeaBarbParams({ aiParams: {
    ludy_morza_max_obozy: { wartosc: 5 },
    ludy_morza_rajd_okres_trudny: { wartosc: 2 },
  } }, 'hard');
  eq(ovr.maxSeaCamps, 5, 'reads ludy_morza_max_obozy override');
  eq(ovr.raidPeriod, 2, 'reads per-difficulty raid period override');

  // Mapa: q=0..2 morze, q=3 wybrzeze, reszta lad; wysepka (1,8) na morzu.
  const morze = [];
  const wybrzeze = [];
  for (let r = 0; r < 12; r++) {
    for (let q = 0; q <= 2; q++) morze.push(`${q},${r}`);
    wybrzeze.push(`3,${r}`);
  }
  const iIdx = morze.indexOf('1,8');
  morze.splice(iIdx, 1); // (1,8) zostaje ladem-wysepka (sasiedzi = morze)
  const map = makeMap(12, 12, { morze, wybrzeze });

  const params = Object.assign({}, P, { minDistFromCity: 0, campSpacing: 3 });
  const seaParams = { maxSeaCamps: 3, raidRadius: 8, raidPeriod: 1 };

  const camps = spawnSeaCamps(map, [], [], params, seaParams, 4242);
  assert(camps.length > 0, 'spawnSeaCamps produces at least one camp');
  assert(camps.length <= seaParams.maxSeaCamps, 'respects maxSeaCamps cap');
  assert(camps.every(c => c.naval === true), 'sea camps are flagged naval');
  let okSites = true;
  for (const c of camps) {
    const t = map.hexes[`${c.q},${c.r}`].terenBazowy;
    const island = t === 'laka' && c.q === 1 && c.r === 8;
    if (!(t === 'wybrzeze' || island)) okSites = false;
  }
  assert(okSites, 'every sea camp sits on wybrzeze or an island hex');

  const again = spawnSeaCamps(map, [], [], params, seaParams, 4242);
  eq(JSON.stringify(again), JSON.stringify(camps), 'spawnSeaCamps deterministic for a fixed seed');

  // Limit liczony tylko po obozach naval (ladowe nie zabieraja slotow).
  const landCamp = [{ id: 'L', q: 8, r: 8, spawnCooldown: 0 }];
  const withLand = spawnSeaCamps(map, landCamp, [], params, Object.assign({}, seaParams, { maxSeaCamps: 1 }), 7);
  eq(withLand.length, 1, 'land camps do not consume sea slots');
  const seaFull = [{ id: 'S', q: 3, r: 5, spawnCooldown: 0, naval: true }];
  eq(spawnSeaCamps(map, seaFull, [], params, Object.assign({}, seaParams, { maxSeaCamps: 1 }), 7).length, 0,
    'no new sea camps at maxSeaCamps');

  // tickCamps: oboz naval spawnuje NA WODZIE ze znacznikiem embarked.
  const navalCamp = { id: 'nc', q: 3, r: 5, spawnCooldown: 0, naval: true };
  const res = tickCamps([navalCamp], [], [], map, P);
  eq(res.spawns.length, 1, 'naval camp spawns one unit');
  const sp = res.spawns[0];
  assert(sp.embarked === true, 'naval spawn is embarked');
  assert(isWaterTerrain(map.hexes[`${sp.q},${sp.r}`].terenBazowy), 'naval spawn lands on water');

  // Oboz naval bez wody w poblizu -> fallback ladowy, bez embarked.
  const inlandNaval = { id: 'in', q: 9, r: 2, spawnCooldown: 0, naval: true };
  const resIn = tickCamps([inlandNaval], [], [], map, P);
  eq(resIn.spawns.length, 1, 'inland naval camp still spawns (land fallback)');
  assert(resIn.spawns[0].embarked === undefined, 'land fallback spawn not embarked');

  // Oboz ladowy: zachowanie bez zmian (spawn na ladzie, bez embarked).
  const landRes = tickCamps([{ id: 'lc', q: 8, r: 8, spawnCooldown: 0 }], [], [], map, P);
  assert(landRes.spawns[0].embarked === undefined, 'land camp spawn not embarked (no regression)');
}

// ===========================================================================
// 9b. R-LUDY-MORZA-Q1=A -- Rajderzy na wodzie bez obozow naval
// ===========================================================================
{
  const morze = [];
  const wybrzeze = [];
  for (let r = 0; r < 12; r++) {
    for (let q = 0; q <= 2; q++) morze.push(`${q},${r}`);
    wybrzeze.push(`3,${r}`);
  }
  const map = makeMap(12, 12, { morze, wybrzeze });
  const params = Object.assign({}, P, { minDistFromCity: 0, spawnInterval: 1, startTurn: 1 });
  const seaParams = { maxSeaCamps: 2, raidRadius: 8, raidPeriod: 1 };
  const coastalCity = [{ q: 4, r: 5, ownerId: 0 }];

  // purgeNavalCamps usuwa tylko naval.
  const mixed = [
    { id: 'L', q: 8, r: 8, spawnCooldown: 0 },
    { id: 'S', q: 3, r: 5, spawnCooldown: 0, naval: true },
  ];
  const purged = purgeNavalCamps(mixed);
  eq(purged.length, 1, 'purgeNavalCamps keeps land camps');
  assert(purged[0].naval !== true, 'purged camp is land');

  // spawnSeaPeoplesRaiders: embarked na wodzie, deterministyczny.
  const sp1 = spawnSeaPeoplesRaiders(map, coastalCity, [], [], params, seaParams, 10, 9999);
  eq(sp1.length, 1, 'spawnSeaPeoplesRaiders produces one spawn when under cap');
  assert(sp1[0].embarked === true, 'sea peoples spawn is embarked');
  eq(sp1[0].campId, SEA_WAVE_CAMP_ID, 'sea wave camp id');
  assert(isWaterTerrain(map.hexes[`${sp1[0].q},${sp1[0].r}`].terenBazowy), 'spawn on water');

  const spAgain = spawnSeaPeoplesRaiders(map, coastalCity, [], [], params, seaParams, 10, 9999);
  eq(JSON.stringify(spAgain), JSON.stringify(sp1), 'spawnSeaPeoplesRaiders deterministic for fixed seed');

  // Limit zywych rajderow.
  const maxAlive = seaParams.maxSeaCamps * params.unitsPerCamp;
  const fullBarbs = [];
  for (let i = 0; i < maxAlive; i++) {
    fullBarbs.push(barb(`sr${i}`, 0, i, { seaRaider: true, embarked: true }));
  }
  eq(spawnSeaPeoplesRaiders(map, coastalCity, fullBarbs, fullBarbs, params, seaParams, 10, 123).length, 0,
    'no spawn when alive raiders at cap');

  // Czestotliwosc: co spawnInterval tur od startTurn.
  const slow = Object.assign({}, params, { spawnInterval: 6, startTurn: 5 });
  eq(spawnSeaPeoplesRaiders(map, coastalCity, [], [], slow, seaParams, 5, 1).length, 0,
    'no spawn on startTurn before interval elapses');
  eq(spawnSeaPeoplesRaiders(map, coastalCity, [], [], slow, seaParams, 11, 1).length, 1,
    'spawn when (turn - startTurn) % spawnInterval === 0');
}

// ===========================================================================
// 10. TEMAT #15 -- Rajdy Ludow Morza (decideSeaPeoplesRaids)
// ===========================================================================
{
  // Mapa: q=0..2 morze, reszta lad.
  const morze = [];
  for (let r = 0; r < 12; r++) for (let q = 0; q <= 2; q++) morze.push(`${q},${r}`);
  const mapa = (ulepszenia) => makeMap(12, 12, { morze, ulepszenia });
  const seaParams = { maxSeaCamps: 3, raidRadius: 8, raidPeriod: 3 };
  const raider = (id, q, r, extra = {}) => barb(id, q, r, Object.assign({ seaRaider: true }, extra));

  // collectSeaRaidTargets + isCoastalCity.
  {
    const m = mapa({ '4,5': 'farma' });
    const targets = collectSeaRaidTargets(m);
    eq(targets.length, 1, 'collectSeaRaidTargets finds the built improvement');
    eq(`${targets[0].q},${targets[0].r}`, '4,5', 'target is the farm hex');
    assert(isCoastalCity(m, { q: 3, r: 5 }) === true, 'city next to sea is coastal');
    assert(isCoastalCity(m, { q: 8, r: 5 }) === false, 'inland city is not coastal');
  }

  // 10a. Na wodzie, fala rajdow: krok ku ulepszeniu w zasiegu.
  {
    const m = mapa({ '5,5': 'farma' });
    const b = raider('sr', 1, 5, { embarked: true });
    const cmds = decideSeaPeoplesRaids([b], [], [], collectSeaRaidTargets(m), m, seaParams, 3);
    eq(cmds.length, 1, 'raid wave: one command');
    eq(cmds[0].type, 'move', 'approach is a move');
    const dNew = hexDistance(cmds[0].toQ, cmds[0].toR, 5, 5);
    assert(dNew < hexDistance(1, 5, 5, 5), 'step gets closer to the improvement');
  }

  // 10b. Poza fala rajdow (turn % period != 0): jednostka na wodzie czeka.
  {
    const m = mapa({ '5,5': 'farma' });
    const b = raider('sr', 1, 5, { embarked: true });
    const cmds = decideSeaPeoplesRaids([b], [], [], collectSeaRaidTargets(m), m, seaParams, 4);
    eq(cmds.length, 0, 'outside the raid wave embarked unit holds');
    const cmdsHard = decideSeaPeoplesRaids([b], [], [], collectSeaRaidTargets(m), m,
      Object.assign({}, seaParams, { raidPeriod: 1 }), 4);
    eq(cmdsHard.length, 1, 'raidPeriod=1 (hard): raids every turn');
  }

  // 10c. Sasiednie ulepszenie -> komenda raid (desant + zniszczenie).
  {
    const m = mapa({ '3,5': 'farma' });
    const b = raider('sr', 2, 5, { embarked: true });
    const cmds = decideSeaPeoplesRaids([b], [], [], collectSeaRaidTargets(m), m, seaParams, 3);
    eq(cmds.length, 1, 'adjacent improvement: one command');
    eq(cmds[0].type, 'raid', 'adjacent improvement -> raid');
    eq(`${cmds[0].toQ},${cmds[0].toR}`, '3,5', 'raid targets the improvement hex');
  }

  // 10d. Na ladzie: wrog obok -> atak (jak barbarzyncy).
  {
    const m = mapa({});
    const b = raider('sr', 5, 5); // desant (bez embarked)
    const e = player('e', 6, 5);
    const cmds = decideSeaPeoplesRaids([b], [e], [], [], m, seaParams, 4);
    eq(cmds.length, 1, 'ashore: one command');
    eq(cmds[0].type, 'attack', 'ashore + adjacent enemy -> attack');
    eq(cmds[0].targetUnitId, 'e', 'attacks the adjacent enemy');
  }

  // 10d-canEngage. C-BARB-Q1/Q2 (Maciej 2026-07-26): ashore attack also gated
  // by canEngageOwner (mirrors decideBarbarianMoves 6a-canEngage). Nothing to
  // raid nearby, so a blocked attack falls through to "return to sea" (still
  // one command, but never 'attack').
  {
    const m = mapa({});
    const b = raider('sr', 5, 5);
    const e = player('e', 6, 5, 3);
    const cmdsBlocked = decideSeaPeoplesRaids([b], [e], [], [], m, seaParams, 4, () => false);
    eq(cmdsBlocked.length, 1, 'canEngageOwner=false: one command (fallback to return-to-sea)');
    assert(cmdsBlocked[0].type !== 'attack', 'canEngageOwner=false -> never attacks the adjacent enemy');
    const cmdsAllowed = decideSeaPeoplesRaids([b], [e], [], [], m, seaParams, 4, () => true);
    eq(cmdsAllowed.length, 1, 'canEngageOwner=true: one command');
    eq(cmdsAllowed[0].type, 'attack', 'canEngageOwner=true -> attack command');
    eq(cmdsAllowed[0].targetUnitId, 'e', 'canEngageOwner=true -> targets the adjacent enemy');
  }

  // 10e. Na ladzie bez celow -> wraca w morze (krok ku wodzie).
  {
    const m = mapa({});
    const b = raider('sr', 5, 5);
    const cmds = decideSeaPeoplesRaids([b], [], [], [], m, seaParams, 4);
    eq(cmds.length, 1, 'ashore with nothing to raid: one command');
    eq(cmds[0].type, 'move', 'returns to sea (move)');
    assert(cmds[0].toQ < 5, 'step heads west toward the sea');
  }

  // 10f. Determinizm: identyczne wejscie -> identyczne komendy.
  {
    const m = mapa({ '5,5': 'farma', '7,2': 'kopalnia' });
    const us = [raider('a', 1, 5, { embarked: true }), raider('b', 2, 8, { embarked: true })];
    const c1 = decideSeaPeoplesRaids(us, [], [], collectSeaRaidTargets(m), m, seaParams, 3);
    const c2 = decideSeaPeoplesRaids(us, [], [], collectSeaRaidTargets(m), m, seaParams, 3);
    eq(JSON.stringify(c1), JSON.stringify(c2), 'decideSeaPeoplesRaids deterministic');
  }

  // 10g. decideBarbarianMoves pomija rajderow (obsluguje ich logika morska).
  {
    const m = mapa({});
    const b1 = raider('sea', 1, 5, { embarked: true });
    const e = player('e', 6, 5);
    const cmds = decideBarbarianMoves([b1], [e], [], [], m, P);
    eq(cmds.length, 0, 'land logic skips embarked/seaRaider units');
  }
}

// ===========================================================================
// 11. R-BARBARZYNCY-USTAWIENIA-NIEZALEZNE-OD-TRUDNOSCI (Maciej 2026-08-13):
//     skala 4-poziomowa Łatwy/Normalny/Trudny/Brak, niezależna od trudności
//     gry, + migracja starej skali 'wielu'/'nieliczni'/'wylaczeni'.
// ===========================================================================
{
  // 11a. Sygnatura skali przyjmuje opcjonalną trudność gry wyłącznie po to,
  // aby wyznaczyć limit żywego kontyngentu chatki; pozostałe funkcje pozostają
  // niezależne od _menuDifficulty/cityStateDifficultyOverride.
  eq(scaleBarbParamsForLevel.length, 3, 'scaleBarbParamsForLevel(params, level, difficulty)');
  eq(barbariansEnabledForLevel.length, 1, 'barbariansEnabledForLevel(level) -- brak parametru trudności');
  eq(migrateBarbariansLevel.length, 1, 'migrateBarbariansLevel(level) -- brak parametru trudności');

  // 11b. Ten sam poziom + baseline -> ten sam wynik niezależnie od tego, "jaka"
  // byłaby trudność gry w tle (funkcja jej nawet nie widzi) -- dwa wywołania
  // identyczne, potwierdzają brak ukrytej zależności/losowości.
  const s1 = scaleBarbParamsForLevel(P, 'trudny');
  const s2 = scaleBarbParamsForLevel(P, 'trudny');
  eq(JSON.stringify(s1), JSON.stringify(s2), 'scaleBarbParamsForLevel deterministyczne, tylko (params, level)');

  // 11c. Brak -> pełne wyłączenie (maxCamps=0, enabled=false) -- jak dawne "wylaczeni".
  eq(scaleBarbParamsForLevel(P, 'brak').maxCamps, 0, 'brak: maxCamps=0');
  assert(barbariansEnabledForLevel('brak') === false, 'brak: enabled=false');
  assert(barbariansEnabledForLevel('latwy') === true, 'latwy: enabled=true');
  assert(barbariansEnabledForLevel('normalny') === true, 'normalny: enabled=true');
  assert(barbariansEnabledForLevel('trudny') === true, 'trudny: enabled=true');

  // 11d. Łatwy: zawsze przynajmniej 1 obóz, NIGDY zero -- wymóg właściciela --
  // sprawdzone też na skrajnie niskim baseline (maxCamps=1), gdzie 20% baseline
  // zaokrągla się do 0 bez klamry min(1, ...).
  const easy = scaleBarbParamsForLevel(P, 'latwy');
  assert(easy.maxCamps >= 1, 'latwy: maxCamps >= 1 (nigdy zero)');
  assert(easy.maxCamps < P.maxCamps, 'latwy: mniej obozow niz dawne baseline "Wielu"');
  const easyTinyBaseline = scaleBarbParamsForLevel({ ...P, maxCamps: 1 }, 'latwy');
  eq(easyTinyBaseline.maxCamps, 1, 'latwy: min(1) trzyma sie nawet gdy baseline juz = 1 (20% -> 0 bez klamry)');

  // 11e. Normalny ~= 1/4 dawnego baseline "Wielu" (maxCamps), min 1.
  const normal = scaleBarbParamsForLevel(P, 'normalny');
  eq(normal.maxCamps, Math.max(1, Math.round(P.maxCamps / 4)), 'normalny: maxCamps ~= baseline/4');
  assert(normal.maxCamps < P.maxCamps, 'normalny: mniej obozow niz dawne baseline "Wielu"');

  // 11f. Trudny ~= 2x dawny baseline "Wielu" (maxCamps) -- "ma byc trudno to ma
  // byc trudno", realnie odczuwalne, nie kosmetyczne.
  const hard = scaleBarbParamsForLevel(P, 'trudny');
  eq(hard.maxCamps, Math.max(1, Math.round(P.maxCamps * 2)), 'trudny: maxCamps ~= 2x baseline');
  assert(hard.maxCamps > P.maxCamps, 'trudny: wiecej obozow niz dawne baseline "Wielu"');
}

// 11g. Kolejnosc gestosci (maxCamps) na baseline FALLBACK_BARB_PARAMS (=6):
// Brak(0) < Latwy(1) <= Normalny(2) < Trudny(12).
{
  const none = scaleBarbParamsForLevel(P, 'brak').maxCamps;
  const easy = scaleBarbParamsForLevel(P, 'latwy').maxCamps;
  const normal = scaleBarbParamsForLevel(P, 'normalny').maxCamps;
  const hard = scaleBarbParamsForLevel(P, 'trudny').maxCamps;
  assert(none === 0, 'kolejnosc: Brak=0');
  assert(easy >= 1, 'kolejnosc: Latwy >= 1');
  assert(easy <= normal, 'kolejnosc: Latwy <= Normalny (Latwy nigdy najgestszy)');
  assert(normal < hard, 'kolejnosc: Normalny < Trudny');
  assert(none < easy, 'kolejnosc: Brak < Latwy (Brak zawsze najmniej)');
}

// 11i. Migracja starej skali (przed 2026-08-13) na nowa, bez crasha na
// nieznanym/brakujacym stringu z save'a/localStorage.
eq(migrateBarbariansLevel('wielu'), 'trudny', 'migracja: wielu -> trudny');
eq(migrateBarbariansLevel('nieliczni'), 'normalny', 'migracja: nieliczni -> normalny');
eq(migrateBarbariansLevel('wylaczeni'), 'brak', 'migracja: wylaczeni -> brak');
eq(migrateBarbariansLevel('latwy'), 'latwy', 'migracja: nowa wartosc przechodzi bez zmian (latwy)');
eq(migrateBarbariansLevel('normalny'), 'normalny', 'migracja: nowa wartosc przechodzi bez zmian (normalny)');
eq(migrateBarbariansLevel('trudny'), 'trudny', 'migracja: nowa wartosc przechodzi bez zmian (trudny)');
eq(migrateBarbariansLevel('brak'), 'brak', 'migracja: nowa wartosc przechodzi bez zmian (brak)');
eq(migrateBarbariansLevel(undefined), 'normalny', 'migracja: brak wartosci -> normalny (bezpieczny domyslny)');
eq(migrateBarbariansLevel(null), 'normalny', 'migracja: null -> normalny');
eq(migrateBarbariansLevel('nieznany-string-ze-starego-save'), 'normalny', 'migracja: nieznany string -> normalny, bez crasha');
eq(migrateBarbariansLevel(42), 'normalny', 'migracja: zly typ (number) -> normalny, bez crasha');

// 11k. R-ARMIA-KONCENTRACJA-AI-BARB-Q1=A — lokalny rally jest rzeczywisty:
// tylko lądowy kontyngent tego samego obozu dostaje ruch do obozu; morze,
// cywil i garnizon pozostają poza planerem, a po zebraniu nie ma dodatkowego
// rozkazu rally.
{
  const rallyMap = makeMap(8, 8);
  const rallyCamp = { id: 'camp-rally', q: 4, r: 4, spawnCooldown: 0 };
  const landA = { id: 'barb-rally-a', ownerId: -1, typeId: 'Wojownik', category: 'wojownik', q: 1, r: 1, ruch: 2, ruchLeft: 2, campId: 'camp-rally' };
  const landB = { id: 'barb-rally-b', ownerId: -1, typeId: 'Wojownik', category: 'wojownik', q: 1, r: 2, ruch: 2, ruchLeft: 2, campId: 'camp-rally' };
  const sea = { id: 'barb-rally-sea', ownerId: -1, typeId: 'Rajder', category: 'wojownik', q: 2, r: 1, ruch: 2, ruchLeft: 2, campId: 'camp-rally', embarked: true, seaRaider: true };
  const scout = { id: 'barb-rally-scout', ownerId: -1, typeId: 'Zwiadowca', category: 'zwiadowca', q: 1, r: 3, ruch: 2, ruchLeft: 2, campId: 'camp-rally' };
  const garrison = { id: 'barb-rally-garrison', ownerId: -1, typeId: 'Wojownik', category: 'wojownik', q: 2, r: 3, ruch: 2, ruchLeft: 2, campId: 'camp-rally', inGarnizon: true };
  const rallyUnits = [landA, landB, sea, scout, garrison];
  const rally = planBarbarianRally(rallyUnits, [rallyCamp], rallyMap, rallyUnits, []);
  assert(rally.some(c => c.unitId === landA.id), 'rally: lądowy A dostaje ruch do obozu');
  assert(rally.some(c => c.unitId === landB.id), 'rally: lądowy B dostaje ruch do obozu');
  assert(!rally.some(c => c.unitId === sea.id), 'rally: Ludy Morza wyłączone');
  assert(!rally.some(c => c.unitId === scout.id), 'rally: zwiadowca/cywil wyłączony');
  assert(!rally.some(c => c.unitId === garrison.id), 'rally: garnizon wyłączony');
  const gatheredA = { ...landA, q: 4, r: 4 };
  const gatheredB = { ...landB, q: 4, r: 5 };
  eq(planBarbarianRally([gatheredA, gatheredB], [rallyCamp], rallyMap, [gatheredA, gatheredB], []).length, 0,
    'rally: po fizycznym zgrupowaniu brak dodatkowego rozkazu');
}

// 11j. Zmigrowana wartosc dziala od razu w scaleBarbParamsForLevel/
// barbariansEnabledForLevel -- pelny lancuch save-legacy -> gra bez crasha.
{
  const migrated = migrateBarbariansLevel('wylaczeni');
  eq(scaleBarbParamsForLevel(P, migrated).maxCamps, 0, 'legacy wylaczeni po migracji nadal daje maxCamps=0');
  assert(barbariansEnabledForLevel(migrated) === false, 'legacy wylaczeni po migracji nadal wylacza barbarzyncow');
}

// --- summary ---------------------------------------------------------------
console.log(`\nbarbarians-test: ${passed} passed, ${failed} failed`);
// Clean up temp artifacts.
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed === 0 ? 0 : 1);
