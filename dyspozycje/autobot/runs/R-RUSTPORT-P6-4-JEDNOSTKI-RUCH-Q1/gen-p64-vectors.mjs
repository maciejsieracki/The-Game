// P6.4 (jednostki - ruch) - wektory z URUCHOMIONEGO weba (pin edb8fb56) dla:
//   gra/src/game/embarkation.ts, planned-march.ts, rally-point.ts, scout-auto-explore.ts
//   zaleznosci uruchamiane BEZ stubow: units/setup.ts (terrainMoveCost, computePath, computeReachable,
//   pathCost, hexDistance), game/visibility.ts (computeVisibleAt, addExplored), game/armyMerge.ts
//   (stackGroupIdOf), game/civ-bonuses.ts (civMovementMultiplier), map/road-movement.ts.
// Konfiguracja ruchu terenu = ta sama co w grze (main.ts:1675): configureTerrainMovement(terrain-movement.json).
// Wejscia deterministyczne (LCG), wyniki = to, co zwrocil prawdziwy kod weba.
// Kodowanie liczb: NaN/+-Infinity/-0 -> {"$n": ...}; niecalkowite -> {"$f": "<String(x)>"}.
//
// Uzycie:
//   node --experimental-transform-types --no-warnings --import ./p64-loader-register.mjs \
//     ./gen-p64-vectors.mjs <WEB_ROOT> <OUT_DIR>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , webRootArg, outDirArg] = process.argv;
if (!webRootArg || !outDirArg) {
  console.error('usage: <WEB_ROOT> <OUT_DIR>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const outDir = presolve(outDirArg);
mkdirSync(outDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;

const origLog = console.log;
const origWarn = console.warn;
console.log = () => {};
console.warn = () => {};

const setup = await import(src('units/setup.ts'));
const emb = await import(src('game/embarkation.ts'));
const pm = await import(src('game/planned-march.ts'));
const rally = await import(src('game/rally-point.ts'));
const scout = await import(src('game/scout-auto-explore.ts'));
const vis = await import(src('game/visibility.ts'));
const army = await import(src('game/armyMerge.ts'));
const hexTypes = await import(src('types/hex.ts'));
const roadMovement = await import(src('map/road-movement.ts'));
const terrainMovement = JSON.parse(readFileSync(join(webRoot, 'gra/data/terrain-movement.json'), 'utf8'));
setup.configureTerrainMovement(terrainMovement.costs, terrainMovement.forestExtra);

const { TerenBazowy, Nakladka } = hexTypes;

// ---------------------------------------------------------------------------
// kodowanie JSON: NaN / +-Infinity / -0 -> {"$n": "..."}; undefined -> pominiete
// ---------------------------------------------------------------------------
function enc(v) {
  if (v === undefined) return undefined;
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return { $n: 'NaN' };
    if (v === Infinity) return { $n: 'Infinity' };
    if (v === -Infinity) return { $n: '-Infinity' };
    if (Object.is(v, -0)) return { $n: '-0' };
    return v;
  }
  if (v instanceof Set) return [...v].map(enc);
  if (v instanceof Map) return [...v.entries()].map(([k, x]) => [enc(k), enc(x)]);
  if (Array.isArray(v)) return v.map((x) => (x === undefined ? null : enc(x)));
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) {
      const e = enc(x);
      if (e !== undefined) o[k] = e;
    }
    return o;
  }
  return v;
}

// deterministyczny LCG (wejscia testowe, NIE logika gry)
let seedState = 0x64a1b2c3;
function rnd() {
  seedState = (Math.imul(seedState, 1664525) + 1013904223) >>> 0;
  return seedState / 4294967296;
}
const rint = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;

const keyToPair = (k) => k.split(',').map(Number);
const pts = (path) => path.map((h) => [h.q, h.r]);
const keysToPts = (set) => [...set].map(keyToPair);

// ---------------------------------------------------------------------------
// mapy (kodowanie: [q, r, teren, las, rzeka, ulepszenie|null, ulepszenia|null, wioska, wlasciciel])
// ---------------------------------------------------------------------------
const TERRAINS = Object.values(TerenBazowy);
const WEIGHTS = {
  flat: [['laka', 0.7], ['rownina', 0.3]],
  mixed: [['laka', 0.3], ['rownina', 0.2], ['wzgorza', 0.14], ['gory', 0.07], ['pustynia', 0.08], ['polarny', 0.03], ['plytkie_morze', 0.09], ['morze', 0.09]],
  water: [['plytkie_morze', 0.3], ['morze', 0.25], ['laka', 0.2], ['rownina', 0.1], ['wzgorza', 0.1], ['pustynia', 0.05]],
  roads: [['laka', 0.4], ['rownina', 0.3], ['wzgorza', 0.15], ['pustynia', 0.1], ['gory', 0.05]],
};
function weighted(list) {
  let x = rnd();
  for (const [v, w] of list) {
    if (x < w) return v;
    x -= w;
  }
  return list[list.length - 1][0];
}
const SINGLE_UPG = [null, 'brak', 'droga', 'droga_brukowana', 'farma', 'kopalnia', 'pastwisko', 'irygacja'];
const LAYER_SETS = [['farma', 'droga'], ['droga_brukowana'], ['droga', 'pastwisko'], [], ['brak'], ['kopalnia', 'droga_brukowana', 'droga']];

function genMap(kind, radius, opts = {}) {
  const hexes = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      if (Math.abs(q + r) > radius) continue;
      if ((q !== 0 || r !== 0) && chance(opts.holes ?? 0.06)) continue;
      const t = weighted(WEIGHTS[kind]);
      const las = chance(kind === 'flat' ? 0 : 0.22);
      const rzeka = chance(kind === 'flat' ? 0 : 0.09);
      let ul = null;
      let uls = null;
      if (kind === 'roads') {
        ul = pick(['droga', 'droga', 'droga_brukowana', 'brak', null]);
        if (chance(0.1)) uls = pick(LAYER_SETS);
      } else if (kind !== 'flat') {
        if (chance(0.25)) ul = pick(SINGLE_UPG);
        if (chance(0.07)) uls = pick(LAYER_SETS);
      }
      const wioska = kind !== 'flat' && chance(0.08);
      const wlasc = wioska && chance(0.25);
      hexes.push([q, r, t, las, rzeka, ul, uls, wioska, wlasc]);
    }
  }
  return hexes;
}

function buildMap(hexes) {
  const out = { szerokoscQ: 0, wysokoscR: 0, hexes: {} };
  for (const [q, r, t, las, rzeka, ul, uls, wioska, wlasc] of hexes) {
    const hex = {
      coords: { q, r },
      terenBazowy: t,
      nakladka: las ? Nakladka.Las : Nakladka.Brak,
      widocznosc: {},
      rzeka: { obecna: rzeka, krawedzie: [] },
      wioska: { istnieje: wioska, ludnosc: wioska ? 1 : 0 },
      wlasciciel: wlasc ? 'p1' : null,
    };
    if (ul !== null) hex.ulepszenie = ul;
    if (uls !== null) hex.ulepszenia = uls;
    out.hexes[`${q},${r}`] = hex;
  }
  return out;
}

const MAP_SPECS = [
  ['flat', 5], ['flat', 7], ['mixed', 5], ['mixed', 6], ['mixed', 7], ['water', 5], ['water', 6], ['roads', 5], ['roads', 6], ['mixed', 4],
];
const mapsEnc = MAP_SPECS.map(([k, r]) => genMap(k, r));
const maps = mapsEnc.map(buildMap);
const mapHexKeys = maps.map((m) => Object.keys(m.hexes));
const randHex = (mi) => {
  const k = pick(mapHexKeys[mi]);
  return keyToPair(k);
};
const randNear = (mi, from, d) => {
  const [fq, fr] = from;
  for (let i = 0; i < 20; i++) {
    const q = fq + rint(-d, d);
    const r = fr + rint(-d, d);
    if (`${q},${r}` in maps[mi].hexes) return [q, r];
  }
  return randHex(mi);
};

// ---------------------------------------------------------------------------
// jednostki
// ---------------------------------------------------------------------------
const CATS = [
  ['piechota', 'Hoplita'], ['galera', 'Galera'], ['zwiadowca', 'Zwiadowca'], ['lucznik', 'Łucznik'],
  ['kawaleria', 'Jazda'], ['rydwany', 'Rydwan bojowy'], ['zwiadowca', 'Rozpoznanie'], ['piechota', undefined],
];
function mkUnit(id, ownerId, cat, q, r, extra = {}) {
  const [category, typeId] = cat;
  const u = { id, ownerId, typeId, category, q, r, ruch: 3, ruchLeft: 3 };
  Object.assign(u, extra);
  if (u.typeId === undefined) delete u.typeId;
  return u;
}
const cloneUnit = (u) => JSON.parse(JSON.stringify(u));
const BONUS_SETS = [
  [],
  [{ typ: 'bonus_walka', cel: 'piechota', wartosc: 0.5, opis: 'Matrix:x', realizuje: 'walka', matrixParamId: 'walka_ruch_piechota_teren_plytkie_morze' }],
  [{ typ: 'bonus_walka', cel: 'wszystko', wartosc: 2, opis: 'Matrix:y', realizuje: 'walka', matrixParamId: 'walka_ruch_piechota_teren_plytkie_morze' },
    { typ: 'bonus_walka', cel: 'piechota', wartosc: 0.25, opis: 'Matrix:z', realizuje: 'walka', matrixParamId: 'walka_ruch_bitwa_proc' }],
  [{ typ: 'bonus_walka', cel: 'rydwany', wartosc: 1, opis: 'Matrix:r', realizuje: 'walka', matrixParamId: 'walka_ruch_rydwany' },
    { typ: 'bonus_walka', cel: 'wszystko', wartosc: -0.5, opis: 'Matrix:n', realizuje: 'walka', matrixParamId: 'walka_ruch_piechota_teren_plytkie_morze' }],
  [{ typ: 'bonus_walka', cel: 'morska', wartosc: 0.75, opis: 'Matrix:m', realizuje: 'walka', matrixParamId: 'walka_ruch_piechota_teren_plytkie_morze' },
    { typ: 'bonus_walka', cel: 'wszystko', wartosc: 'tekst', opis: 'Matrix:t', realizuje: 'walka', matrixParamId: 'walka_ruch_piechota_teren_plytkie_morze' },
    { typ: 'bonus_walka', cel: 'wszystko', wartosc: 0.2, opis: 'bez matrixId', realizuje: 'walka' }],
];

// zbior kosztow z fabryki: 'terrain' | 'embark' | {kind:'unit', ...}
function costFnFrom(spec, unitForSpec) {
  if (spec === null || spec === undefined || spec === 'terrain') return undefined;
  if (spec === 'embark') return setup.embarkMoveCost;
  if (spec.kind === 'unit') return emb.moveCostFnFor(unitForSpec, spec.seafaring, spec.bonusy);
  throw new Error('costFn?');
}
function pickCostSpec() {
  const x = rnd();
  if (x < 0.4) return null;
  if (x < 0.65) return 'embark';
  return { kind: 'unit', seafaring: chance(0.7), bonusy: pick(BONUS_SETS) };
}

function mkOccupied(mi, n, avoid = []) {
  const set = [];
  for (let i = 0; i < n; i++) {
    const p = randHex(mi);
    if (avoid.some((a) => a[0] === p[0] && a[1] === p[1])) continue;
    set.push(p);
  }
  return set;
}
const toKeySet = (list) => new Set(list.map(([q, r]) => `${q},${r}`));

const core = {
  terrainMoveCost: [], terrainCombos: [], embarkMoveCost: [], hexDistance: [], computePath: [], computeReachable: [],
  pathCost: [], computeVisibleAt: [], addExplored: [], stackGroupIdOf: [], constants: {}, applyRoad: [],
};

// ===========================================================================
// core: setup.ts + visibility.ts + armyMerge.ts
// ===========================================================================
maps.forEach((m, mi) => {
  core.terrainMoveCost.push({ map: mi, out: mapHexKeys[mi].map((k) => enc(setup.terrainMoveCost(m.hexes[k]))) });
  core.embarkMoveCost.push({ map: mi, out: mapHexKeys[mi].map((k) => enc(setup.embarkMoveCost(m.hexes[k]))) });
});

// jawne kombinacje: teren x las x rzeka x ulepszenia
const upgrades = [
  [null, null], ['brak', null], ['droga', null], ['droga_brukowana', null], ['farma', null], [null, ['droga']],
  [null, ['droga_brukowana']], ['brak', ['droga_brukowana', 'droga']], ['droga', ['farma']], [null, []], ['droga_brukowana', ['droga']],
  ['droga', ['brak']],
];
for (const t of TERRAINS) {
  for (const las of [false, true]) {
    for (const rzeka of [false, true]) {
      for (const [ul, uls] of upgrades) {
        const hex = {
          coords: { q: 0, r: 0 }, terenBazowy: t, nakladka: las ? Nakladka.Las : Nakladka.Brak, widocznosc: {},
          rzeka: { obecna: rzeka, krawedzie: [] }, wioska: { istnieje: false, ludnosc: 0 }, wlasciciel: null,
        };
        if (ul !== null) hex.ulepszenie = ul;
        if (uls !== null) hex.ulepszenia = uls;
        core.terrainCombos.push({
          t, las, rzeka, ul, uls,
          out: enc(setup.terrainMoveCost(hex)),
          embark: enc(setup.embarkMoveCost(hex)),
        });
      }
    }
  }
}
// applyRoadMovementModifier na kosztach ulamkowych/specjalnych (podloga bruku)
for (const cost of [0, 0.1, 0.5, 1, 1.5, 2, 3, 7, Infinity, NaN]) {
  for (const [ul, uls] of upgrades) {
    const hex = { coords: { q: 0, r: 0 }, terenBazowy: 'laka', nakladka: 'brak', widocznosc: {}, rzeka: { obecna: false, krawedzie: [] }, wioska: { istnieje: false, ludnosc: 0 }, wlasciciel: null };
    if (ul !== null) hex.ulepszenie = ul;
    if (uls !== null) hex.ulepszenia = uls;
    core.applyRoad.push({ cost: enc(cost), ul, uls, out: enc(roadMovement.applyRoadMovementModifier(cost, hex)) });
  }
}

for (let i = 0; i < 60; i++) {
  const a = [rint(-9, 9), rint(-9, 9)];
  const b = [rint(-9, 9), rint(-9, 9)];
  core.hexDistance.push({ a, b, out: setup.hexDistance(a[0], a[1], b[0], b[1]) });
}

maps.forEach((m, mi) => {
  const nPath = MAP_SPECS[mi][0] === 'flat' ? 60 : 45;
  for (let i = 0; i < nPath; i++) {
    const start = randHex(mi);
    let dest = i % 11 === 0 ? [start[0] + rint(-10, 10), start[1] + rint(-10, 10)] : randHex(mi);
    if (i % 17 === 5) dest = [start[0], start[1]];
    if (i % 19 === 7) dest = [dest[0] + 0.5, dest[1]];
    const occupied = mkOccupied(mi, rint(0, 14), [start]);
    if (i % 5 === 0) occupied.push(dest.map((x) => Math.trunc(x)));
    const spec = pickCostSpec();
    const unit = mkUnit('u1', 0, pick(CATS), start[0], start[1], { embarked: chance(0.15) ? true : undefined });
    const fn = costFnFrom(spec, unit);
    const path = setup.computePath(unit, m, dest[0], dest[1], toKeySet(occupied), fn);
    core.computePath.push({ map: mi, unit: enc(unit), dest, occupied, costFn: spec, out: pts(path) });
  }
  for (let i = 0; i < 40; i++) {
    const start = randHex(mi);
    const ruchLeft = pick([0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5.3, 7, 9]);
    const occupied = mkOccupied(mi, rint(0, 10), [start]);
    const spec = pickCostSpec();
    const unit = mkUnit('u1', 0, pick(CATS), start[0], start[1], { ruchLeft });
    const fn = costFnFrom(spec, unit);
    const reach = setup.computeReachable(unit, m, toKeySet(occupied), fn);
    core.computeReachable.push({ map: mi, unit: enc(unit), occupied, costFn: spec, out: keysToPts(reach) });
  }
  for (let i = 0; i < 25; i++) {
    const start = randHex(mi);
    const dest = randNear(mi, start, 5);
    const full = setup.computePath(mkUnit('u1', 0, CATS[0], start[0], start[1]), m, dest[0], dest[1], new Set());
    let path = full.map((h) => [h.q, h.r]);
    if (i % 6 === 0) path = path.concat([[40, 40]]);
    if (i % 7 === 0) path = path.slice().reverse();
    const spec = pickCostSpec();
    const unit = mkUnit('u1', 0, pick(CATS), start[0], start[1]);
    const fn = costFnFrom(spec, unit);
    core.pathCost.push({ map: mi, unit: enc(unit), path, costFn: spec, out: enc(setup.pathCost(path.map(([q, r]) => ({ q, r })), m, fn)) });
  }
  for (let i = 0; i < 18; i++) {
    const c = i % 5 === 0 ? [rint(-12, 12), rint(-12, 12)] : randHex(mi);
    const sight = pick([0, 1, 2, 3, 4, 2.5, 1.5, -1, 0.5]);
    core.computeVisibleAt.push({ map: mi, q: c[0], r: c[1], sight, out: keysToPts(vis.computeVisibleAt(c[0], c[1], m, sight)) });
  }
});

for (let i = 0; i < 30; i++) {
  const mi = rint(0, maps.length - 1);
  const explored = new Set();
  const visible = new Set();
  const nEx = rint(0, 12);
  const nVis = rint(0, 12);
  for (let k = 0; k < nEx; k++) explored.add(pick(mapHexKeys[mi]));
  for (let k = 0; k < nVis; k++) visible.add(chance(0.5) ? pick(mapHexKeys[mi]) : pick([...explored, '99,99']));
  const before = [...explored];
  vis.addExplored(explored, visible);
  core.addExplored.push({ explored: before.map(keyToPair), visible: [...visible].map(keyToPair), out: [...explored].map(keyToPair) });
}

const STACK_UNITS = [
  { id: 'a', ownerId: 1, q: 2, r: 3 }, { id: 'b', ownerId: 1, q: 2, r: 3, inGarnizon: true }, { id: 'c', ownerId: 0, q: -2, r: 0, stackGroupId: 'sg0_x_1' },
  { id: 'd', ownerId: 3, q: 0, r: 0, stackGroupId: '' }, { id: 'e', ownerId: 3, q: 0, r: 0, inGarnizon: true, stackGroupId: '' },
  { id: 'f', ownerId: 3, q: 0, r: 0, inGarnizon: false }, { id: 'g', ownerId: 12, q: -7, r: 11, inGarnizon: true, stackGroupId: 'zz' },
];
for (const u of STACK_UNITS) core.stackGroupIdOf.push({ unit: enc({ category: 'piechota', ...u }), out: army.stackGroupIdOf({ category: 'piechota', ...u }) });

core.constants = enc({
  EMBARK_TECH: emb.EMBARK_TECH,
  EMBARK_DEFENSE_MULT: emb.EMBARK_DEFENSE_MULT,
  EMBARKED_WATER_MOVE_COST: setup.EMBARKED_WATER_MOVE_COST,
  ROAD_MOVE_SPEED_MULT: roadMovement.ROAD_MOVE_SPEED_MULT,
  ROAD_BRUK_MOVE_SPEED_MULT: roadMovement.ROAD_BRUK_MOVE_SPEED_MULT,
  ROAD_BRUK_MIN_MOVE_COST: roadMovement.ROAD_BRUK_MIN_MOVE_COST,
  terrainMovement,
});

// ===========================================================================
// embark.json
// ===========================================================================
const embark = { canUnitEmbark: [], moveCostFnFor: [], applyEmbarkStateAfterMove: [], isWaterHexAt: [], nearestFreeWaterHex: [] };
for (const category of ['piechota', 'galera', 'zwiadowca', 'lucznik', 'Galera', '']) {
  for (const embarked of [true, false, undefined]) {
    for (const seafaring of [true, false]) {
      embark.canUnitEmbark.push({ category, embarked, seafaring, out: emb.canUnitEmbark({ category, embarked }, seafaring) });
    }
  }
}
maps.forEach((m, mi) => {
  for (let i = 0; i < 12; i++) {
    const cat = pick(CATS);
    const start = randHex(mi);
    const unit = mkUnit('u1', 0, cat, start[0], start[1], { embarked: pick([true, false, undefined]) });
    const seafaring = chance(0.6);
    const bonusy = pick(BONUS_SETS);
    const fn = emb.moveCostFnFor(unit, seafaring, bonusy);
    embark.moveCostFnFor.push({
      map: mi, unit: enc(unit), seafaring, bonusy,
      out: fn === undefined ? null : mapHexKeys[mi].map((k) => enc(fn(m.hexes[k]))),
    });
  }
  // bez trzeciego argumentu (domyslne [])
  {
    const start = randHex(mi);
    const unit = mkUnit('u1', 0, CATS[0], start[0], start[1]);
    const fn = emb.moveCostFnFor(unit, true);
    embark.moveCostFnFor.push({ map: mi, unit: enc(unit), seafaring: true, bonusy: null, out: mapHexKeys[mi].map((k) => enc(fn(m.hexes[k]))) });
  }
  for (let i = 0; i < 20; i++) {
    const c = i % 4 === 0 ? [rint(-9, 9), rint(-9, 9)] : randHex(mi);
    embark.isWaterHexAt.push({ map: mi, q: c[0], r: c[1], out: emb.isWaterHexAt(m, c[0], c[1]) });
  }
  for (let i = 0; i < 30; i++) {
    const c = i % 6 === 0 ? [rint(-9, 9), rint(-9, 9)] : randHex(mi);
    const occupied = mkOccupied(mi, rint(0, 30));
    const out = emb.nearestFreeWaterHex(m, c[0], c[1], toKeySet(occupied));
    embark.nearestFreeWaterHex.push({ map: mi, q: c[0], r: c[1], occupied, out: out === null ? null : [out.q, out.r] });
  }
  for (let i = 0; i < 6; i++) {
    const units = [];
    const n = rint(1, 10);
    for (let k = 0; k < n; k++) {
      const p = randHex(mi);
      units.push(mkUnit(`e${k}`, rint(0, 2), pick(CATS), p[0], p[1], { embarked: pick([true, false, undefined]) }));
    }
    const before = units.map(cloneUnit);
    const changed = emb.applyEmbarkStateAfterMove(units, m);
    embark.applyEmbarkStateAfterMove.push({ map: mi, units: enc(before), changed, after: enc(units) });
  }
});

// ===========================================================================
// march.json
// ===========================================================================
const march = {
  truncatePathAtFogFrontier: [], applyFogToPathPlan: [], truncatePathToBudget: [], planPathTurns: [], shouldStopAtObstacle: [],
  executeMarchStep: [], validateAutoMarchFromSave: [], plannedMarchesFromSave: [], plannedMarchesToSave: [],
};
const stopCounts = {};
for (let i = 0; i < 60; i++) {
  const mi = rint(0, maps.length - 1);
  const path = [];
  const n = rint(0, 8);
  for (let k = 0; k < n; k++) path.push(randHex(mi));
  const visible = new Set();
  for (const p of path) if (chance(0.7)) visible.add(`${p[0]},${p[1]}`);
  const out = pm.truncatePathAtFogFrontier(path.map(([q, r]) => ({ q, r })), visible, setup.keyOf);
  march.truncatePathAtFogFrontier.push({ path, visible: [...visible].map(keyToPair), out: { path: pts(out.path), fogLimited: out.fogLimited } });
}

const fogCtx = (visible) => ({ fogActive: true, visible: new Set(visible.map(([q, r]) => `${q},${r}`)), attackOnVisibleEnemy: false, keyOf: setup.keyOf });

maps.forEach((m, mi) => {
  const nCases = MAP_SPECS[mi][0] === 'flat' ? 70 : 55;
  for (let i = 0; i < nCases; i++) {
    const start = randHex(mi);
    let dest = i % 3 === 0 ? randNear(mi, start, 4) : randHex(mi);
    if (i % 13 === 4) dest = [start[0], start[1]];
    if (i % 23 === 9) dest = [dest[0] + 40, dest[1]];
    const spec = pickCostSpec();
    const unit = mkUnit('u1', 0, pick(CATS), start[0], start[1], { embarked: chance(0.1) ? true : undefined });
    const fn = costFnFrom(spec, unit);
    // przeszkody: losowe + (50%) heks na wolnej trasie
    const free = setup.computePath(unit, m, dest[0], dest[1], new Set(), fn);
    const occupied = mkOccupied(mi, rint(0, 8), [start]);
    if (free.length > 1 && chance(0.5)) {
      const hit = free[rint(0, free.length - 2)];
      occupied.push([hit.q, hit.r]);
    }
    if (free.length > 0 && chance(0.2)) {
      const last = free[free.length - 1];
      occupied.push([last.q, last.r]);
    }
    const occSet = toKeySet(occupied);
    const perTurn = pick([0, 1, 2, 3, 4, 5.5]);
    const budget = chance(0.3) ? undefined : pick([0, 0.4, 1, 1.5, 2, 3, 4, 8]);
    const destObj = { destQ: dest[0], destR: dest[1] };
    if (chance(0.25)) destObj.attackUnitId = pick(['e1', '', 'x9']);

    const plan = pm.planPathTurns(unit, dest[0], dest[1], m, occSet, perTurn, budget, fn);
    march.planPathTurns.push({ map: mi, unit: enc(unit), dest, occupied, perTurn, budget, costFn: spec, out: enc(plan) });
    if (i % 5 === 0) march.applyFogToPathPlan.push({ map: mi, plan: enc(plan), perTurn, budget, out: enc(pm.applyFogToPathPlan(plan, m, perTurn, budget, fogCtx(pts(plan.fullPath)))) });

    const segBudget = budget ?? perTurn;
    let seg = plan.segmentPath;
    if (chance(0.15)) seg = [];
    if (chance(0.1) && plan.fullPath.length > 0) seg = [plan.fullPath[plan.fullPath.length - 1]];
    const stop = pm.shouldStopAtObstacle(unit, destObj, m, occSet, seg, segBudget, fn);
    march.shouldStopAtObstacle.push({ map: mi, unit: enc(unit), dest: destObj, occupied, segment: pts(seg), budget: segBudget, costFn: spec, out: enc(stop) });

    const blocked = [];
    if (chance(0.3)) for (const h of plan.segmentPath.slice(-1)) blocked.push([h.q, h.r]);
    if (chance(0.1)) blocked.push(randHex(mi));
    const blockedSet = toKeySet(blocked);
    const fogSpec = chance(0.3) ? { visible: pts(plan.fullPath).slice(0, 2) } : null;
    const exec = pm.executeMarchStep(
      unit, destObj, m, occSet, segBudget, (q, r) => !blockedSet.has(`${q},${r}`), perTurn,
      fogSpec ? fogCtx(fogSpec.visible) : undefined, fn,
    );
    stopCounts[exec.stopReason ?? 'none'] = (stopCounts[exec.stopReason ?? 'none'] ?? 0) + 1;
    march.executeMarchStep.push({ map: mi, unit: enc(unit), dest: destObj, occupied, budget: segBudget, blocked, perTurn, fog: fogSpec, costFn: spec, out: enc(exec) });

    // truncatePathToBudget na pelnej trasie
    const tb = pick([0, 0.2, 1, 2, 3, 5, 12]);
    march.truncatePathToBudget.push({ map: mi, path: pts(plan.fullPath), budget: tb, costFn: spec, unit: enc(unit), out: pts(pm.truncatePathToBudget(plan.fullPath, tb, m, fn)) });
  }
});
// przypadki, w ktorych MIN-MOVE zastepuje pusty wynik (koszt wejscia > budzet): wzgorze + las
{
  const hexes = [[0, 0, 'laka', false, false, null, null, false, false], [1, 0, 'wzgorza', true, false, null, null, false, false], [2, 0, 'laka', false, false, null, null, false, false],
    [3, 0, 'laka', false, false, null, null, false, false]];
  mapsEnc.push(hexes);
  maps.push(buildMap(hexes));
  mapHexKeys.push(hexes.map((h) => `${h[0]},${h[1]}`));
  const mi = maps.length - 1;
  const unit = mkUnit('u1', 0, CATS[0], 0, 0);
  const path = [{ q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 }];
  for (const budget of [0, 0.5, 1, 2, 3, 4, 5]) {
    march.truncatePathToBudget.push({ map: mi, path: pts(path), budget, costFn: null, unit: enc(unit), out: pts(pm.truncatePathToBudget(path, budget, maps[mi])) });
    const plan = pm.planPathTurns(unit, 3, 0, maps[mi], new Set(), 2, budget);
    march.planPathTurns.push({ map: mi, unit: enc(unit), dest: [3, 0], occupied: [], perTurn: 2, budget, costFn: null, out: enc(plan) });
    const dest = { destQ: 3, destR: 0 };
    const stop = pm.shouldStopAtObstacle(unit, dest, maps[mi], new Set(), plan.segmentPath, budget);
    march.shouldStopAtObstacle.push({ map: mi, unit: enc(unit), dest, occupied: [], segment: pts(plan.segmentPath), budget, costFn: null, out: enc(stop) });
  }
}

// zapisy marszu
const SAVE_UNITS = [
  mkUnit('m1', 0, CATS[0], 1, 1), mkUnit('m2', 0, CATS[0], 2, 2), mkUnit('m3', 1, CATS[0], 3, 3), mkUnit('m4', 0, CATS[0], 0, 0),
  mkUnit('m5', 0, CATS[0], 5, -1),
];
function saveCase() {
  const dests = () => pick([
    { destQ: rint(-5, 5), destR: rint(-5, 5) }, { destQ: 1, destR: 1 }, { destQ: NaN, destR: 2 }, { destQ: Infinity, destR: 1 },
    { destQ: 2.5, destR: 1 }, { destQ: 'x', destR: 1 }, { destQ: null, destR: 1 }, { destQ: 2, destR: 2, attackUnitId: 'z' },
    { destQ: 4, destR: 4, attackUnitId: '' }, { destQ: 4, destR: 4, attackUnitId: 7 }, { destQ: 9, destR: 9 }, { destQ: 3, destR: 3 },
  ]);
  const ids = ['m1', 'm2', 'm3', 'm4', 'm5', 'nie_ma', 'm1'];
  const pmEntries = [];
  const k = rint(0, 4);
  const used = new Set();
  for (let i = 0; i < k; i++) {
    const id = pick(ids);
    if (used.has(id)) continue;
    used.add(id);
    pmEntries.push([id, chance(0.1) ? null : dests()]);
  }
  const legacy = chance(0.3) ? null : pick([
    { leaderId: 'm1', ...dests() }, { leaderId: 'm2', destQ: 2, destR: 2 }, { leaderId: 5, destQ: 1, destR: 1 }, { leaderId: 'm3', destQ: 7, destR: 7 },
    { leaderId: 'm4', destQ: 5, destR: 5 }, { leaderId: 'brak', destQ: 1, destR: 1 }, { leaderId: 'm5', destQ: NaN, destR: 1 },
  ]);
  return { legacy, pmEntries, planned: chance(0.15) ? null : Object.fromEntries(pmEntries) };
}
for (let i = 0; i < 160; i++) {
  const { legacy, pmEntries, planned } = saveCase();
  const owner = pick([0, 0, 0, 1]);
  const out = pm.plannedMarchesFromSave(legacy ?? undefined, planned, SAVE_UNITS, owner);
  const encEntry = (d) => (d === null ? null : enc(d));
  march.plannedMarchesFromSave.push({
    saved: enc(legacy), planned: planned === null ? null : pmEntries.map(([id, d]) => [id, encEntry(d)]), units: enc(SAVE_UNITS), owner,
    out: [...out.entries()].map(([id, d]) => [id, enc(d)]),
  });
  const single = pm.validateAutoMarchFromSave(legacy ?? undefined, SAVE_UNITS, owner);
  march.validateAutoMarchFromSave.push({ saved: enc(legacy), units: enc(SAVE_UNITS), owner, out: enc(single) });
}
march.validateAutoMarchFromSave.push({ saved: null, units: enc(SAVE_UNITS), owner: 0, out: null });
for (let i = 0; i < 60; i++) {
  const marches = new Map();
  const k = rint(0, 4);
  for (let j = 0; j < k; j++) {
    const d = { destQ: rint(-3, 3), destR: rint(-3, 3) };
    if (chance(0.5)) d.attackUnitId = pick(['t1', '', 'abc']);
    marches.set(`mu${j}`, d);
  }
  const out = pm.plannedMarchesToSave(marches);
  march.plannedMarchesToSave.push({ marches: [...marches.entries()].map(([id, d]) => [id, enc(d)]), out: enc(out) });
}
march.stopReasonCounts = stopCounts;

// ===========================================================================
// rally.json
// ===========================================================================
const rallyV = { sequences: [], leaders: [], fromSave: [], toSave: [], numberQuirks: [] };
const OWNERS = [0, 1, 2, 7, -1, 1.5, NaN, Infinity, 1e3];
for (let i = 0; i < 80; i++) {
  const points = new Map();
  const ops = [];
  const n = rint(1, 9);
  for (let k = 0; k < n; k++) {
    if (chance(0.25)) {
      const owner = pick(OWNERS);
      ops.push({ op: 'clear', owner: enc(owner) });
      rally.clearRallyPoint(points, owner);
    } else {
      const owner = pick(OWNERS);
      const q = pick([rint(-6, 6), 2.7, -3.9, -0.5, NaN, Infinity, 0, -0, 1e15 + 0.5]);
      const r = pick([rint(-6, 6), 0.2, -1.1, -0.3, -Infinity, 5]);
      ops.push({ op: 'set', owner: enc(owner), q: enc(q), r: enc(r) });
      rally.setRallyPoint(points, owner, { q, r });
    }
  }
  const saved = rally.rallyPointsToSave(points);
  rallyV.sequences.push({
    ops, state: [...points.entries()].map(([id, p]) => [id, enc(p)]),
    toSave: saved === undefined ? null : enc(saved),
  });
}
const LEADER_UNITS = [];
for (let i = 0; i < 30; i++) {
  const u = mkUnit(`r${i}`, rint(0, 2), pick(CATS), rint(-1, 1), rint(-1, 1), {});
  if (chance(0.25)) u.inGarnizon = true;
  if (chance(0.2)) u.stackGroupId = pick(['sgA', 'sgB', '']);
  LEADER_UNITS.push(u);
}
for (let i = 0; i < 12; i++) {
  const units = LEADER_UNITS.slice(0, rint(0, 30));
  const owner = rint(0, 3);
  rallyV.leaders.push({ units: enc(units), owner, out: rally.rallyLaunchLeaderIds(units, owner) });
}
const RAW_POINTS = [
  { q: 1, r: 2 }, { q: 1.9, r: -2.9 }, { q: '1', r: 2 }, { q: NaN, r: 1 }, { q: 1 }, null, 5, 'abc', true, [], { q: Infinity, r: 0 },
  { q: -0.5, r: 0 }, { q: 3, r: 4, extra: 1 },
];
const RAW_KEYS = ['0', '1', '2', '07', ' 3 ', '0x10', '1e2', '1.5', 'abc', '', '-1', '+4', 'Infinity', '  ', '१', '1_0', '0b11', '9', '5'];
for (let i = 0; i < 60; i++) {
  const entries = [];
  const used = new Set();
  const n = rint(0, 7);
  for (let k = 0; k < n; k++) {
    const key = pick(RAW_KEYS);
    if (used.has(key)) continue;
    used.add(key);
    entries.push([key, pick(RAW_POINTS)]);
  }
  // kolejnosc Object.entries (klucze calkowite rosnaco najpierw) - zapisujemy to, co zwrocil silnik JS
  const obj = Object.fromEntries(entries);
  const effective = Object.entries(obj);
  const isNull = chance(0.05);
  const out = rally.rallyPointsFromSave(isNull ? null : obj);
  rallyV.fromSave.push({ entries: effective.map(([key, p]) => [key, enc(p)]), out: [...out.entries()].map(([id, p]) => [id, enc(p)]), isNull });
}
rallyV.fromSave.push({ entries: [], isNull: true, out: [] });
rallyV.fromSave.push({ entries: [], isNull: false, out: [] });
{
  const out = rally.rallyPointsFromSave('tekst');
  rallyV.fromSave.push({ entries: [], isNull: false, notObject: true, out: [...out.entries()] });
}
for (const key of RAW_KEYS) {
  const obj = { [key]: { q: 4, r: 5 } };
  const out = rally.rallyPointsFromSave(obj);
  rallyV.numberQuirks.push({ key, number: enc(Number(key)), out: [...out.entries()].map(([id, p]) => [id, enc(p)]) });
}
for (let i = 0; i < 20; i++) {
  const points = new Map();
  const n = rint(0, 4);
  for (let k = 0; k < n; k++) {
    points.set(rint(-2, 6), { q: pick([rint(-3, 3), 2.5, NaN, -0.5, Infinity]), r: pick([rint(-3, 3), -4.5, NaN, 0.1]) });
  }
  const saved = rally.rallyPointsToSave(points);
  rallyV.toSave.push({ points: [...points.entries()].map(([id, p]) => [id, enc(p)]), out: saved === undefined ? null : enc(saved) });
}

// ===========================================================================
// scout.json
// ===========================================================================
const scoutV = { isScoutUnit: [], clearScoutAutoExplore: [], scoreMarginalReveal: [], scoreHexForExplore: [], pickScoutExploreTarget: [], advanceScoutAutoExplore: [], runScoutsAutoExplore: [] };
function makeRng(seq) {
  let i = 0;
  const fn = () => seq[i++ % seq.length];
  fn.calls = () => i;
  return fn;
}
function mkSeq() {
  const seq = [];
  const n = rint(8, 40);
  for (let i = 0; i < n; i++) seq.push(chance(0.08) ? pick([0, 0.9999999, 0.5]) : rnd());
  return seq;
}
for (const category of ['zwiadowca', 'piechota', 'galera', '']) {
  for (const typeId of ['Zwiadowca', 'Hoplita', undefined, 'zwiadowca']) {
    const u = { id: 'x', ownerId: 0, category, typeId, q: 0, r: 0, ruch: 1, ruchLeft: 1 };
    scoutV.isScoutUnit.push({ category, typeId, out: scout.isScoutUnit(u) });
  }
}
for (const auto of [true, false, undefined]) {
  for (const cat of [['zwiadowca', 'Zwiadowca'], ['piechota', 'Hoplita'], ['piechota', 'Zwiadowca']]) {
    const u = mkUnit('s', 0, cat, 0, 0, { autoExplore: auto });
    const before = cloneUnit(u);
    const out = scout.clearScoutAutoExplore(u);
    scoutV.clearScoutAutoExplore.push({ unit: enc(before), out, after: enc(u) });
  }
}

function genExplored(mi, frac) {
  const keys = mapHexKeys[mi].filter(() => chance(frac));
  // losowa kolejnosc wstawiania
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  return keys;
}

maps.forEach((m, mi) => {
  if (mi >= MAP_SPECS.length) return;
  for (let i = 0; i < 12; i++) {
    const from = randHex(mi);
    const to = randNear(mi, from, 2);
    const explored = new Set(genExplored(mi, pick([0, 0.2, 0.5, 0.9])));
    const sight = pick([1, 2, 3, 2.5]);
    scoutV.scoreMarginalReveal.push({ map: mi, from, to, explored: [...explored].map(keyToPair), sight, out: scout.scoreMarginalReveal(from[0], from[1], to[0], to[1], explored, m, sight) });
    const c = randHex(mi);
    scoutV.scoreHexForExplore.push({ map: mi, q: c[0], r: c[1], explored: [...explored].map(keyToPair), sight, out: scout.scoreHexForExplore(c[0], c[1], explored, m, sight) });
  }

  // scenariusze pick / advance / run
  const scenarios = MAP_SPECS[mi][0] === 'water' ? 6 : 14;
  for (let i = 0; i < scenarios; i++) {
    const start = randHex(mi);
    const exploredKeys = genExplored(mi, pick([0.1, 0.3, 0.6, 0.95]));
    const explored = new Set(exploredKeys);
    const sight = pick([1, 2, 3]);
    const ruchLeft = pick([1, 2, 3, 4.5, 6, 10, 0.5, 100]);
    const scoutUnit = mkUnit('scout', 0, ['zwiadowca', 'Zwiadowca'], start[0], start[1], { ruchLeft, autoExplore: true });
    if (chance(0.1)) scoutUnit.inGarnizon = true;
    if (chance(0.08)) scoutUnit.oblegaCityId = 'c1';
    if (chance(0.05)) scoutUnit.oblegaCityId = '';
    const others = [];
    for (let k = 0; k < rint(0, 10); k++) {
      const p = randHex(mi);
      others.push(mkUnit(`o${k}`, rint(0, 2), pick(CATS), p[0], p[1]));
    }
    const allUnits = [scoutUnit, ...others];
    const occupied = new Set(others.map((u) => `${u.q},${u.r}`));
    const seq = mkSeq();

    // pickScoutExploreTarget
    {
      const u = cloneUnit(scoutUnit);
      const rng = makeRng(seq);
      const out = scout.pickScoutExploreTarget(u, m, explored, occupied, sight, rng);
      scoutV.pickScoutExploreTarget.push({
        map: mi, unit: enc(u), explored: exploredKeys.map(keyToPair), occupied: others.map((o) => [o.q, o.r]), sight, rng: seq,
        out: out ? [out.q, out.r] : null, rngCalls: rng.calls(),
      });
    }
    // advanceScoutAutoExplore
    {
      const u = cloneUnit(scoutUnit);
      const units = [u, ...others.map(cloneUnit)];
      const rng = makeRng(seq);
      const cb = [];
      const res = scout.advanceScoutAutoExplore(u, m, explored, units, sight, rng, (x) => cb.push([x.id, x.q, x.r, x.ruchLeft]));
      scoutV.advanceScoutAutoExplore.push({
        map: mi, unit: enc(scoutUnit), others: enc(others), explored: exploredKeys.map(keyToPair), sight, rng: seq,
        out: { moved: res.moved, steps: res.steps, unit: enc(u), callbacks: enc(cb), rngCalls: rng.calls() },
      });
    }
  }
  // run (kilku zwiadowcow, wszystkie warianty filtrow)
  for (let i = 0; i < (MAP_SPECS[mi][0] === 'water' ? 3 : 8); i++) {
    const units = [];
    const nScouts = rint(1, 4);
    for (let k = 0; k < nScouts + 3; k++) {
      const p = randHex(mi);
      const isScout = k < nScouts;
      const u = isScout
        ? mkUnit(`sc${k}`, pick([0, 0, 0, 1]), ['zwiadowca', pick(['Zwiadowca', 'Rozpoznanie', undefined])], p[0], p[1], { ruchLeft: pick([1, 2, 3, 5]), autoExplore: pick([true, true, false, undefined]), sentry: pick([undefined, undefined, true, false]) })
        : mkUnit(`ot${k}`, rint(0, 2), pick(CATS), p[0], p[1]);
      if (u.typeId === undefined) delete u.typeId;
      units.push(u);
    }
    const explored = new Set(genExplored(mi, pick([0.2, 0.5])));
    const sights = { default: pick([1, 2, 3]), perId: Object.fromEntries(units.filter((u) => chance(0.4)).map((u) => [u.id, rint(1, 3)])) };
    const resolver = (u) => sights.perId[u.id] ?? sights.default;
    const seq = mkSeq();
    const rng = makeRng(seq);
    const live = units.map(cloneUnit);
    const cb = [];
    const res = scout.runScoutsAutoExplore(live, m, explored, 0, resolver, rng, (x) => cb.push([x.id, x.q, x.r, x.ruchLeft]));
    scoutV.runScoutsAutoExplore.push({
      map: mi, units: enc(units), explored: [...explored].map(keyToPair), owner: 0, sights, rng: seq,
      out: { movedUnitIds: res.movedUnitIds, totalSteps: res.totalSteps, units: enc(live), callbacks: enc(cb), rngCalls: rng.calls() },
    });
  }
});

// remisy losowania w puli zerowych zyskow: sekwencje 0 / 0.5 daja roznice score dokladnie rowna
// tolerancji remisu (`<=` vs `<` ma znaczenie); wszystkie heksy "odkryte" => gain 0 wszedzie.
for (const mi of [0, 1, 2, 4, 7]) {
  const m = maps[mi];
  const allKeys = mapHexKeys[mi];
  for (const seq of [[0, 0.5, 0, 0.5, 0, 0.5], [0.5, 0, 0.5, 0, 0.5, 0], [0.25, 0.75, 0.5, 0.5, 0, 0, 0.999], [0, 0, 0, 0.5, 0.5, 0.5], [0.5, 0.5, 0, 0.9999999, 0, 0.5]]) {
    for (let k = 0; k < 2; k++) {
      const start = randHex(mi);
      const scoutUnit = mkUnit('scout', 0, ['zwiadowca', 'Zwiadowca'], start[0], start[1], { ruchLeft: pick([1, 2, 3]), autoExplore: true });
      const explored = new Set(allKeys);
      const sight = pick([1, 2]);
      {
        const u = cloneUnit(scoutUnit);
        const rng = makeRng(seq);
        const out = scout.pickScoutExploreTarget(u, m, explored, new Set(), sight, rng);
        scoutV.pickScoutExploreTarget.push({
          map: mi, unit: enc(u), explored: allKeys.map(keyToPair), occupied: [], sight, rng: seq,
          out: out ? [out.q, out.r] : null, rngCalls: rng.calls(),
        });
      }
      {
        const u = cloneUnit(scoutUnit);
        const rng = makeRng(seq);
        const cb = [];
        const res = scout.advanceScoutAutoExplore(u, m, explored, [u], sight, rng, (x) => cb.push([x.id, x.q, x.r, x.ruchLeft]));
        scoutV.advanceScoutAutoExplore.push({
          map: mi, unit: enc(scoutUnit), others: [], explored: allKeys.map(keyToPair), sight, rng: seq,
          out: { moved: res.moved, steps: res.steps, unit: enc(u), callbacks: enc(cb), rngCalls: rng.calls() },
        });
      }
    }
  }
}

// ===========================================================================
// zapis
// ===========================================================================
// serde_json (bez `float_roundtrip`) potrafi odczytac niecalkowite f64 z bledem 1 ulp; dlatego kazda
// niecalkowita liczba jest zapisana jako {"$f": "<String(x)>"} i czytana przez str::parse::<f64>().
function floatSafe(v) {
  if (typeof v === 'number') return Number.isFinite(v) && !Number.isInteger(v) ? { $f: String(v) } : v;
  if (Array.isArray(v)) return v.map(floatSafe);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) o[k] = floatSafe(x);
    return o;
  }
  return v;
}
const write = (name, obj) => writeFileSync(join(outDir, name), JSON.stringify(floatSafe(obj)));
const meta = { pin: 'edb8fb56', generator: 'gen-p64-vectors.mjs', note: 'wektory z URUCHOMIONEGO weba; liczby specjalne {"$n"}; undefined = brak klucza' };
write('maps.json', { meta, maps: mapsEnc });
write('core.json', { meta, cases: core });
write('embark.json', { meta, cases: embark });
write('march.json', { meta, cases: march });
write('rally.json', { meta, cases: rallyV });
write('scout.json', { meta, cases: scoutV });

console.log = origLog;
const count = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v]));
console.log(JSON.stringify({ core: count(core), embark: count(embark), march: count(march), rally: count(rallyV), scout: count(scoutV), stopCounts }, null, 1));
console.warn = origWarn;
