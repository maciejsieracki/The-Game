'use strict';
/**
 * perf-hud-q2-test.cjs — R-WEB-PERF-LATE-GAME-LAG-HUD-Q2
 *
 * Regression for the late-game HUD cost (refreshFog -> updateHud -> collectTurnEvents / buildHudState).
 * Every optimisation here keeps results IDENTICAL; this test pins that equivalence against reference
 * (pre-change) implementations and adds wide, non-flaky budgets.
 *
 *   1. territoryOwnerAt: far-node early reject == reference O(nodes) implementation (random worlds, 137 nodes).
 *   2. okolicaTiles / assignWorkedTiles with the near-centre node subset == full-node filter (key-for-key, order).
 *   3. getResourceAccessForCity == getCityResourceAccessForCity(...).active (active-only path).
 *   4. buildRiverHexSet memo: same content as fresh, invalidated when riverPaths content changes.
 *   5. territoryBorderInputsEqual (border rebuild skip) and createOwnerScope (collectTurnEvents ownerScoped).
 *   6. budget: 600 territory-filtered worked-tile assignments on a 137-city world < generous ceiling.
 *
 * Run from gra/: node tools/perf-hud-q2-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA_DIR = path.resolve(__dirname, '..');
let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  PASS: ' + label); }
  else { fail++; console.log('  FAIL: ' + label + (detail ? ' -- ' + detail : '')); }
}

const esbuild = require(path.resolve(GRA_DIR, 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.perf-hud-q2-entry.ts');
const bundle = path.resolve(__dirname, '.perf-hud-q2-bundle.cjs');
fs.writeFileSync(entry, `
export { okolicaTiles, assignWorkedTiles, cityRangeForPopulation, CITY_RANGE_CAP } from '../src/game/okolica';
export { territoryOwnerAt, axialDistance, cityTerritoryRadius } from '../src/map/territory';
export { makeTerritoryWorkableFilter } from '../src/map/territory-work';
export { getResourceAccessForCity, getCityResourceAccessForCity } from '../src/game/resource-access';
export { buildRiverHexSet } from '../src/map/improvement-build';
export { territoryBorderInputsEqual } from '../src/map/territory-border-cache';
export { createOwnerScope } from '../src/game/owner-scope';
`);

// deterministic PRNG
let seed = 1412026;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

try {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, absWorkingDir: GRA_DIR, logLevel: 'silent',
  });
  const M = require(bundle);
  const { okolicaTiles, assignWorkedTiles, territoryOwnerAt, axialDistance, cityTerritoryRadius, makeTerritoryWorkableFilter } = M;

  const W = 70;
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < W; r++) hexes[q + ',' + r] = { coords: { q, r }, terenBazowy: 'Laka', nakladka: 'Brak' };
  const map = { szerokoscQ: W, wysokoscR: W, hexes, riverPaths: [] };

  // world: 137 nodes (cities + a few forts/outposts), random pops
  const nodes = [];
  for (let i = 0; i < 137; i++) {
    nodes.push({ q: Math.floor(rnd() * W), r: Math.floor(rnd() * W), pop: 1 + Math.floor(rnd() * 20), level: 1, ownerId: i % 7 });
  }
  for (let i = 0; i < 6; i++) {
    nodes.push({ q: Math.floor(rnd() * W), r: Math.floor(rnd() * W), pop: 0, level: 1, ownerId: i % 7, isFort: i % 2 === 0, isOutpost: i % 2 === 1, order: { turn: i, seq: i } });
  }

  // 1. territoryOwnerAt vs reference
  function refOwnerAt(q, r, ns) {
    let bestCityOwner = null, bestCityDist = Infinity, bestFortOwner = null, bestFortDist = Infinity, bestFortOrder;
    for (const node of ns) {
      const radius = cityTerritoryRadius(node);
      const dist = axialDistance(q, r, node.q, node.r);
      if (dist > radius) continue;
      if (node.isFort || node.isOutpost) {
        const o = node.order;
        let better;
        if (bestFortOwner !== null && o && bestFortOrder) better = o.turn !== bestFortOrder.turn ? o.turn < bestFortOrder.turn : o.seq < bestFortOrder.seq;
        else better = dist < bestFortDist;
        if (better) { bestFortDist = dist; bestFortOwner = node.ownerId; bestFortOrder = o; }
      } else if (dist < bestCityDist) { bestCityDist = dist; bestCityOwner = node.ownerId; }
    }
    return bestCityOwner !== null ? bestCityOwner : bestFortOwner;
  }
  let mism = 0, total = 0;
  for (let q = -3; q < W + 3; q += 1) for (let r = -3; r < W + 3; r += 2) { total++; if (territoryOwnerAt(q, r, nodes) !== refOwnerAt(q, r, nodes)) mism++; }
  check('territoryOwnerAt == reference on ' + total + ' hexes (137 cities + forts/outposts)', mism === 0, mism + ' mismatches');

  // 2. worked tiles: subset filter == full-node filter
  const yieldOf = (q, r) => ({ zywnosc: (q * 7 + r * 3) % 4, praca: (q + r) % 3, handel: (q * r) % 2 });
  let tileMism = 0, cityChecks = 0;
  const cityNodes = nodes.filter(n => !n.isFort && !n.isOutpost);
  for (let i = 0; i < cityNodes.length; i += 3) {
    const c = cityNodes[i];
    const pop = Math.min(c.pop, 15);
    const radius = M.cityRangeForPopulation(pop);
    const centers = new Set(nodes.filter(n => !n.isOutpost && !n.isFort).map(n => n.q + ',' + n.r));
    const base = (q, r) => { const h = map.hexes[q + ',' + r]; return !!h; };
    const refFilter = (q, r) => {
      if (centers.has(q + ',' + r)) return false;
      return makeTerritoryWorkableFilter(nodes, c.ownerId, base)(q, r);
    };
    const refTiles = okolicaTiles(c.q, c.r, radius, map, refFilter).map(t => t.key).sort();
    const got = assignWorkedTiles(c.q, c.r, 9999, map, yieldOf, { radius, territoryNodes: nodes, ownerId: c.ownerId, isWorkable: base })
      .map(t => t.key).sort();
    cityChecks++;
    if (JSON.stringify(refTiles) !== JSON.stringify(got)) tileMism++;
  }
  check('assignWorkedTiles(near-centre node subset) == full-node reference on ' + cityChecks + ' cities', tileMism === 0, tileMism + ' cities differ');

  // 3. active-only resource access == full access .active
  const rmap = { hexes: {}, riverPaths: [] };
  const rc = { id: 'x', q: 5, r: 5, population: 8, kulturaSkumulowana: 0 };
  for (let dq = -8; dq <= 8; dq++) for (let dr = -8; dr <= 8; dr++) rmap.hexes[(5 + dq) + ',' + (5 + dr)] = { coords: { q: 5 + dq, r: 5 + dr }, terenBazowy: 'Laka', nakladka: 'Brak' };
  const placed = new Map([['6,5', ['tartak']], ['5,6', ['kamieniolom']], ['4,5', ['farma']]]);
  const full = M.getCityResourceAccessForCity(rc, rmap, placed, 3, { ownerId: '0', builtIds: [] }).active;
  const only = M.getResourceAccessForCity(rc, rmap, placed, 3, { ownerId: '0', builtIds: [] });
  check('getResourceAccessForCity == getCityResourceAccessForCity().active', JSON.stringify(full) === JSON.stringify(only), JSON.stringify([full, only]));

  // 4. buildRiverHexSet memo
  const rm = { hexes: {}, riverPaths: [[{ q: 1, r: 1 }, { q: 1, r: 2 }]] };
  const s1 = M.buildRiverHexSet(rm);
  check('river set content', s1.size === 2 && s1.has('1,1') && s1.has('1,2'));
  check('river set memo returns same instance when unchanged', M.buildRiverHexSet(rm) === s1);
  rm.riverPaths[0].push({ q: 1, r: 3 });
  const s2 = M.buildRiverHexSet(rm);
  check('river set invalidated when a path point is added', s2.size === 3 && s2.has('1,3'));
  rm.riverPaths = [[{ q: 9, r: 9 }]];
  const s3 = M.buildRiverHexSet(rm);
  check('river set invalidated when riverPaths replaced', s3.size === 1 && s3.has('9,9') && !s3.has('1,1'));

  rm.riverPaths[0][0] = { q: 4, r: 4 }; // in-place point swap, same counts
  const s4 = M.buildRiverHexSet(rm);
  check('river set invalidated on in-place point swap (same counts)', s4.has('4,4') && !s4.has('1,1'));

  // 5a. territoryBorderInputsEqual
  const mk = (o) => new Map(Object.entries(o).map(([k, v]) => [Number(k), new Set(v)]));
  const col = (o) => new Map(Object.entries(o).map(([k, v]) => [Number(k), v]));
  const E = M.territoryBorderInputsEqual;
  const base1 = { byOwner: mk({ 0: ['1,1', '1,2'], 3: ['5,5'] }), colors: col({ 0: 'a/x', 3: 'b/y' }) };
  check('border: null prev => rebuild', E(null, base1.byOwner, base1.colors) === false);
  check('border: identical content (new objects) => skip', E(base1, mk({ 3: ['5,5'], 0: ['1,2', '1,1'] }), col({ 0: 'a/x', 3: 'b/y' })) === true);
  check('border: hex added => rebuild', E(base1, mk({ 0: ['1,1', '1,2', '1,3'], 3: ['5,5'] }), base1.colors) === false);
  check('border: hex swapped (same size) => rebuild', E(base1, mk({ 0: ['1,1', '9,9'], 3: ['5,5'] }), base1.colors) === false);
  check('border: colour/relation changed => rebuild', E(base1, base1.byOwner, col({ 0: 'a/x', 3: 'b/z' })) === false);
  check('border: owner removed => rebuild', E(base1, mk({ 0: ['1,1', '1,2'] }), col({ 0: 'a/x' })) === false);
  check('border: owner replaced (same count) => rebuild', E(base1, mk({ 0: ['1,1', '1,2'], 4: ['5,5'] }), col({ 0: 'a/x', 4: 'b/y' })) === false);

  // 5b. createOwnerScope (ownerScoped / withOwnerCtxScope)
  const sc = M.createOwnerScope();
  let calls = 0;
  const compute = (v) => () => { calls++; return v; };
  check('scope: outside scope always recomputes', sc.scoped('t', 1, compute(1)) === 1 && sc.scoped('t', 1, compute(1)) === 1 && calls === 2 && !sc.isOpen());
  calls = 0;
  sc.withScope(() => {
    sc.scoped('t', 1, compute('a')); sc.scoped('t', 1, compute('zzz'));
    sc.scoped('t', 2, compute('b')); sc.scoped('u', 1, compute('c'));
    check('scope: once per (tag, owner) inside scope', calls === 3 && sc.scoped('t', 1, compute('x')) === 'a' && sc.scoped('t', 2, compute('x')) === 'b' && sc.scoped('u', 1, compute('x')) === 'c');
    sc.withScope(() => { check('scope: nested reuses outer cache', sc.scoped('t', 1, compute('n')) === 'a'); });
    check('scope: still open after nested exit', sc.isOpen() && sc.scoped('t', 2, compute('n')) === 'b');
  });
  check('scope: closed after exit and cache dropped', !sc.isOpen() && sc.scoped('t', 1, compute('fresh')) === 'fresh');
  try { sc.withScope(() => { sc.scoped('t', 1, compute('e')); throw new Error('boom'); }); } catch {}
  check('scope: closed after exception, no stale value', !sc.isOpen() && sc.scoped('t', 1, compute('after')) === 'after');
  // consumer-copy contract (cityResourceAccessForCityId copies the shared Set before add('kon'))
  sc.withScope(() => {
    const shared = sc.scoped('livestock', 0, () => new Set(['kon_a']));
    const mine = new Set(shared); mine.add('kon');
    check('scope: copy-before-mutate leaves shared value intact', !sc.scoped('livestock', 0, () => new Set()).has('kon') && mine.has('kon'));
  });

  // 6. budget: 600 territory-filtered assignments (≈ HUD refresh x several) must stay well under a loose ceiling.
  const t0 = Date.now();
  let acc = 0;
  for (let rep = 0; rep < 600; rep++) {
    const c = cityNodes[rep % cityNodes.length];
    acc += assignWorkedTiles(c.q, c.r, Math.min(c.pop, 15), map, yieldOf, { radius: M.cityRangeForPopulation(Math.min(c.pop, 15)), territoryNodes: nodes, ownerId: c.ownerId, isWorkable: (q, r) => !!map.hexes[q + ',' + r] }).length;
  }
  const dt = Date.now() - t0;
  check('600 territory-filtered assignments < 6000 ms (measured ' + dt + ' ms, acc=' + acc + ')', dt < 6000);
} finally {
  try { fs.unlinkSync(entry); } catch {}
  try { fs.unlinkSync(bundle); } catch {}
}
console.log(`\nperf-hud-q2-test: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
