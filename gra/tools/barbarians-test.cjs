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
  BARBARIAN_OWNER_ID, isBarbarian,
  FALLBACK_BARB_PARAMS, loadBarbParams, barbariansActive,
  EPOKA_SREDNIOWIECZE_BARBARZY,
  spawnCamps, tickCamps, decideBarbarianMoves,
  LUDY_MORZA_BARB_UNIT_IDS, pickBronzeBarbUnit,
} from '../src/game/barbarians';
export { hexDistance } from '../src/units/setup';
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
  BARBARIAN_OWNER_ID, isBarbarian,
  FALLBACK_BARB_PARAMS, loadBarbParams, barbariansActive,
  EPOKA_SREDNIOWIECZE_BARBARZY,
  spawnCamps, tickCamps, decideBarbarianMoves,
  LUDY_MORZA_BARB_UNIT_IDS, pickBronzeBarbUnit,
  hexDistance,
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
  const owned = opts.owned || {}; // { "q,r": "playerId" }
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      hexes[k] = {
        coords: { q, r },
        terenBazowy: gory.has(k) ? 'gory' : 'laka',
        nakladka: 'brak',
        ulepszenie: 'brak',
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

// --- summary ---------------------------------------------------------------
console.log(`\nbarbarians-test: ${passed} passed, ${failed} failed`);
// Clean up temp artifacts.
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed === 0 ? 0 : 1);
