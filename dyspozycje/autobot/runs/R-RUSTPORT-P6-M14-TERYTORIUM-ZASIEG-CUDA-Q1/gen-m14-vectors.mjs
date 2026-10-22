// P6.M14 - wektory z URUCHOMIONEGO weba (pin edb8fb56) dla:
//   gra/src/map/territory.ts, territory-work.ts, range-hexes.ts, wonder-placement.ts
// Kod weba ladowany w calosci (bez stubow); zadne funkcje nie sa przepisywane.
// Liczby specjalne: NaN / +-Infinity / -0 zapisywane jako stringi "NaN" / "Infinity" / "-Infinity" / "-0".
// Wejscia losowe: Mulberry32 z ziarnem stalym (deterministyczne, wyniki w JSON, nie w kodzie Rust).
//
// Uzycie:
//   node --experimental-transform-types --no-warnings --import ./m14-loader-register.mjs \
//     ./gen-m14-vectors.mjs <WEB_ROOT> <OUT_DIR>
import { mkdirSync, writeFileSync } from 'node:fs';
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

const T = await import(src('map/territory.ts'));
const W = await import(src('map/territory-work.ts'));
const R = await import(src('map/range-hexes.ts'));
const P = await import(src('map/wonder-placement.ts'));
const CR = await import(src('game/culture-religion.ts'));

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x14c0ffee);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const clone = (x) => structuredClone(x);

const replacer = (_k, v) => {
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'NaN';
    if (v === Infinity) return 'Infinity';
    if (v === -Infinity) return '-Infinity';
    if (Object.is(v, -0)) return '-0';
  }
  return v;
};
const write = (name, obj) => writeFileSync(join(outDir, name), JSON.stringify(obj, replacer, 0) + '\n');

// ---------- generatory wejsc ----------
const POPS = [0, -3, 1, 2, 4, 5, 6, 9, 10, 14, 15, 16, 20, 99, 2.7, 4.999, 5.0, 15.5, -0.5, NaN, Infinity, -Infinity, 1e9];
function genNode(withOwner, owners) {
  const n = { q: ri(-12, 12), r: ri(-12, 12), pop: pick(POPS), level: ri(0, 3) };
  const k = rnd();
  if (k < 0.15) n.isFort = true;
  else if (k < 0.3) n.isOutpost = true;
  else if (k < 0.35) { n.isFort = false; n.isOutpost = false; }
  else if (k < 0.4) { n.isFort = true; n.isOutpost = true; }
  if (rnd() < 0.2) n.civ = pick(['grecja', 'rzym']);
  if (withOwner) n.ownerId = pick(owners);
  return n;
}
const genNodes = (cnt, withOwner, owners = [0, 1, 2, 3]) => Array.from({ length: cnt }, () => genNode(withOwner, owners));
const QS = [-14, -7, -3, -2, -1, 0, 0.5, 1, 1.5, 2, 3, 5, 8, 14];

// ---------- territory.ts ----------
const territory = {
  radius: [],
  axial: [],
  range_for_pop: [],
  sight: [],
  owner_at: [],
  in_territory: [],
  player_hex: [],
  constants: { CITY_RANGE_CAP: T.CITY_RANGE_CAP, CITY_RANGE_MIN: T.CITY_RANGE_MIN },
};
for (let i = 0; i < 160; i++) {
  const node = genNode(false);
  territory.radius.push({ node, out: T.cityTerritoryRadius(node) });
}
for (let i = 0; i < 200; i++) {
  const a = [pick(QS), pick(QS)];
  const b = [pick(QS), pick(QS)];
  territory.axial.push({ a, b, out: T.axialDistance(a[0], a[1], b[0], b[1]) });
}
for (const pop of [...POPS, 3, 7, 8, 11, 12, 13, 17, 100]) {
  territory.range_for_pop.push({ pop, out: T.cityRangeForPopulation(pop) });
}
const borderSeen = new Map();
const KULTURY = [0, 50, 99, 100, 101, 249, 250, 251, 499, 500, 501, 1e6, -5, NaN, Infinity, -Infinity, 100.5];
for (const kultura of KULTURY) {
  borderSeen.set(String(kultura), { kultura, ring: CR.cityBorderRadius(kultura) });
}
territory.border = [...borderSeen.values()];
for (const pop of POPS) {
  for (const kultura of KULTURY) {
    territory.sight.push({ pop, kultura, out: T.citySightRadius(pop, kultura) });
  }
}
// citySightRadius(pop) z domyslnym kulturaSkumulowana = 0
for (const pop of POPS) territory.sight.push({ pop, kultura: null, out: T.citySightRadius(pop) });
for (let i = 0; i < 400; i++) {
  const nodes = genNodes(ri(0, 6), true);
  const q = pick(QS), r = pick(QS);
  territory.owner_at.push({ q, r, nodes, out: T.territoryOwnerAt(q, r, nodes) });
  territory.in_territory.push({ q, r, nodes, out: T.isInTerritory(q, r, nodes) });
}
// remisy odleglosci: dwa wezly rownoodlegle -> wygrywa pierwszy
for (let i = 0; i < 60; i++) {
  const q = ri(-3, 3), r = ri(-3, 3);
  const mk = (owner) => ({ q: q + 2, r, pop: 8, level: 1, ownerId: owner });
  const a = mk(1);
  const b = { q: q - 2, r: r + 2, pop: 8, level: 1, ownerId: 2 };
  const nodes = rnd() < 0.5 ? [a, b] : [b, a];
  territory.owner_at.push({ q, r, nodes, out: T.territoryOwnerAt(q, r, nodes) });
}
for (let i = 0; i < 400; i++) {
  const all = genNodes(ri(0, 5), true);
  const player = genNodes(ri(0, 4), false);
  const q = pick(QS), r = pick(QS);
  const c = { q, r, playerNodes: player, allNodes: all };
  if (rnd() < 0.5) {
    c.playerOwnerId = pick([0, 1, 2, 3]);
    c.out = T.isPlayerTerritoryHex(q, r, player, all, c.playerOwnerId);
  } else {
    c.out = T.isPlayerTerritoryHex(q, r, player, all);
  }
  territory.player_hex.push(c);
}
write('territory.json', territory);

// ---------- territory-work.ts ----------
const work = { build: [], owned_by: [], filter: [], center_keys: [], reczne_legal: [], reconcile_owner: [], reconcile_all: [] };
function genCities(n, owners) {
  return Array.from({ length: n }, (_, i) => ({
    id: `c${i}`,
    ownerId: pick(owners),
    q: ri(-6, 6),
    r: ri(-6, 6),
    name: `Miasto${i}`,
    population: pick([1, 2, 3, 5, 6, 8, 10, 15, 20, 0]),
  }));
}
for (let i = 0; i < 60; i++) {
  const cities = genCities(ri(0, 6), [0, 1, 2]);
  work.build.push({ cities, out: W.buildTerritoryNodesFromCities(cities) });
}
for (let i = 0; i < 400; i++) {
  const nodes = genNodes(ri(0, 5), true, [0, 1, 2]);
  const q = pick(QS), r = pick(QS), ownerId = pick([0, 1, 2]);
  work.owned_by.push({ q, r, ownerId, nodes, out: W.isTerritoryHexOwnedBy(q, r, ownerId, nodes) });
}
for (let i = 0; i < 120; i++) {
  const nodes = genNodes(ri(0, 4), true, [0, 1, 2]);
  const ownerId = pick([0, 1, 2]);
  const hasBase = rnd() < 0.6;
  const blocked = hasBase ? Array.from({ length: ri(0, 12) }, () => [ri(-8, 8), ri(-8, 8)]) : null;
  const base = hasBase ? (q, r) => !blocked.some((b) => b[0] === q && b[1] === r) : undefined;
  const f = W.makeTerritoryWorkableFilter(nodes, ownerId, base);
  const queries = Array.from({ length: 40 }, () => [ri(-8, 8), ri(-8, 8)]);
  work.filter.push({ nodes, ownerId, blocked, queries, out: queries.map(([q, r]) => f(q, r)) });
}
for (let i = 0; i < 40; i++) {
  const cities = genCities(ri(0, 7), [0, 1]);
  work.center_keys.push({ cities, out: [...W.cityCenterKeys(cities)].sort() });
}
const RAND_KEYS_BAD = ['x,y', '3', '', ',', 'abc,1', '1,abc', ' 4,5', '1.5,2', '0x10,3', '1e1,2', '+7,-2', 'Infinity,1', '1,2,3', '-0,0'];
function genReczne(cities, withBad) {
  const out = {};
  const n = ri(0, 14);
  for (let i = 0; i < n; i++) {
    const c = pick(cities);
    out[`${c.q + ri(-7, 7)},${c.r + ri(-7, 7)}`] = ri(1, 3);
  }
  if (rnd() < 0.5) {
    const c = pick(cities);
    out[`${c.q},${c.r}`] = 1; // klucz centrum
  }
  if (withBad) for (let i = 0; i < ri(0, 3); i++) out[pick(RAND_KEYS_BAD)] = 1;
  return out;
}
for (let i = 0; i < 120; i++) {
  const nodes = genNodes(ri(0, 4), true, [0, 1, 2]);
  const centers = new Set(Array.from({ length: ri(0, 4) }, () => `${ri(-6, 6)},${ri(-6, 6)}`));
  if (rnd() < 0.4) centers.add(pick(RAND_KEYS_BAD)); // centrum o niesparsowalnym kluczu: web sprawdza centers PRZED parsowaniem
  const lost = rnd() < 0.5 ? new Set(Array.from({ length: ri(0, 5) }, () => `${ri(-6, 6)},${ri(-6, 6)}`)) : undefined;
  const ownerId = pick([0, 1, 2]);
  for (let j = 0; j < 14; j++) {
    const key = rnd() < 0.2 ? pick([...RAND_KEYS_BAD, ...[...centers].filter((k) => !/^-?\d+,-?\d+$/.test(k))]) : (j < 4 && centers.size ? [...centers][j % centers.size] : `${ri(-6, 6)},${ri(-6, 6)}`);
    work.reczne_legal.push({
      key, ownerId, nodes,
      centers: [...centers].sort(),
      lost: lost ? [...lost].sort() : null,
      out: W.isReczneKeyLegal(key, ownerId, centers, nodes, lost),
    });
  }
}
function genReconcileCase() {
  const cities = genCities(ri(1, 6), [0, 1, 2]);
  for (const c of cities) {
    if (rnd() < 0.75) c.okolicaReczne = genReczne(cities, true);
  }
  const nodes = W.buildTerritoryNodesFromCities(cities);
  // czesc przypadkow: dodatkowy fort/posterunek (wezly bez miasta)
  if (rnd() < 0.3) nodes.push({ q: ri(-6, 6), r: ri(-6, 6), pop: 0, level: 1, isFort: true, ownerId: pick([0, 1, 2]) });
  let lost;
  if (rnd() < 0.5) {
    lost = new Map();
    for (const c of cities) {
      if (rnd() < 0.5) lost.set(c.id, new Set(Array.from({ length: ri(0, 6) }, () => `${c.q + ri(-7, 7)},${c.r + ri(-7, 7)}`)));
    }
  }
  return { cities, nodes, lost };
}
const lostToJson = (lost) => (lost ? Object.fromEntries([...lost].map(([k, v]) => [k, [...v].sort()])) : null);
for (let i = 0; i < 120; i++) {
  const { cities, nodes, lost } = genReconcileCase();
  const ownerId = pick([0, 1, 2]);
  const before = clone(cities);
  const changed = W.reconcileWorkedTilesForOwner(cities, nodes, ownerId, lost);
  work.reconcile_owner.push({ cities: before, nodes, ownerId, lost: lostToJson(lost), changed, after: cities });
}
for (let i = 0; i < 100; i++) {
  const { cities, nodes, lost } = genReconcileCase();
  const before = clone(cities);
  W.reconcileAllWorkedTiles(cities, nodes, lost);
  work.reconcile_all.push({ cities: before, nodes, lost: lostToJson(lost), after: cities });
}
write('work.json', work);

// ---------- mapy syntetyczne ----------
const TERRAINS = ['laka', 'rownina', 'wzgorza', 'gory', 'plytkie_morze', 'morze', 'pustynia', 'polarny'];
function genMap(rad, shuffle) {
  const hexes = [];
  for (let q = -rad; q <= rad; q++) {
    for (let r = -rad; r <= rad; r++) {
      if (rnd() < 0.06) continue; // dziury
      hexes.push({ q, r, terrain: pick(TERRAINS) });
    }
  }
  if (shuffle) hexes.sort(() => rnd() - 0.5);
  return hexes;
}
const mapObj = (hexes) => ({
  hexes: Object.fromEntries(hexes.map((h) => [`${h.q},${h.r}`, { coords: { q: h.q, r: h.r }, terenBazowy: h.terrain }])),
});

// ---------- range-hexes.ts ----------
const range = { by_owner: [], culture: [], religion: [], dominant: [], border: territory.border };
const RELIGIONS = ['chrzescijanstwo', 'islam', 'buddyzm', 'staroz'];
const canon = (counts) => JSON.stringify(Object.keys(counts).sort().map((k) => [k, counts[k]]));
const domSeen = new Map();
function dominant(rel, params) {
  const out = CR.dominantReligion(rel, params);
  domSeen.set(canon(rel.counts) + '|' + params.progDominacjiPct, { counts: rel.counts, progDominacjiPct: params.progDominacjiPct, result: out });
  return out;
}
function keysOf(hexes) {
  const keys = hexes.map((h) => `${h.q},${h.r}`);
  if (rnd() < 0.7) keys.push(...RAND_KEYS_BAD.filter(() => rnd() < 0.5));
  return keys;
}
const mapFromKeys = (keys) => ({ hexes: Object.fromEntries(keys.map((k) => [k, { coords: { q: 0, r: 0 } }])) });
for (let i = 0; i < 40; i++) {
  const hexes = genMap(ri(2, 9), false);
  const keys = keysOf(hexes);
  const nodes = genNodes(ri(0, 5), true, [0, 1, 2]).map((n) => ({ ...n, q: ri(-6, 6), r: ri(-6, 6) }));
  const denyOwners = rnd() < 0.5 ? [pick([0, 1, 2])] : [];
  const denyKeys = rnd() < 0.5 ? keys.filter(() => rnd() < 0.15) : [];
  const hasFilter = rnd() < 0.6;
  const filter = hasFilter ? (key, ownerId) => !denyOwners.includes(ownerId) && !denyKeys.includes(key) : undefined;
  const out = R.collectTerritoryHexKeysByOwner(mapFromKeys(keys), nodes, filter);
  range.by_owner.push({
    keys, nodes, filter: hasFilter ? { denyOwners, denyKeys } : null,
    out: Object.fromEntries([...out].map(([k, v]) => [String(k), [...v].sort()])),
  });
}
function genRangeCities(n, owners) {
  return Array.from({ length: n }, (_, i) => {
    const c = {
      id: `r${i}`, q: ri(-6, 6), r: ri(-6, 6), ownerId: pick(owners),
      population: pick([0, 1, 3, 5, 7, 10, 15, 20, NaN]), kultura: pick([0, 99, 100, 250, 499, 500, 900]),
    };
    const k = rnd();
    if (k < 0.15) c.isFort = true; else if (k < 0.3) c.isOutpost = true;
    return c;
  });
}
const borderTable = new Map(territory.border.map((b) => [String(b.kultura), b.ring]));
for (const k of [0, 99, 100, 250, 499, 500, 900]) if (!borderTable.has(String(k))) range.border.push({ kultura: k, ring: CR.cityBorderRadius(k) });
for (let i = 0; i < 60; i++) {
  const keys = keysOf(genMap(ri(2, 10), false));
  const cities = genRangeCities(ri(0, 5), [0, 1]);
  const c = { keys, cities };
  if (rnd() < 0.5) {
    c.ownerId = pick([0, 1]);
    c.out = [...R.collectCultureRangeHexKeys(mapFromKeys(keys), cities, c.ownerId)].sort();
  } else {
    c.out = [...R.collectCultureRangeHexKeys(mapFromKeys(keys), cities)].sort();
  }
  range.culture.push(c);
}
for (let i = 0; i < 120; i++) {
  const keys = keysOf(genMap(ri(2, 10), false));
  const cities = genRangeCities(ri(0, 5), [0, 1]);
  const relig = {};
  for (const c of cities) {
    if (rnd() < 0.8) {
      const counts = {};
      for (const rel of RELIGIONS) if (rnd() < 0.4) counts[rel] = pick([0, 1, 2, 5, 10, 30]);
      relig[c.id] = { counts };
    }
  }
  const stateReligion = pick([null, null, 'islam', 'chrzescijanstwo', '  islam  ', '   ', '', 'nieznana', ' buddyzm﻿', '\u0085islam']);
  const params = { ...CR.FALLBACK_RELIGION_PARAMS };
  const sp = pick(['absent', 0, 1, 3, 3.9, -2, 7]);
  if (sp === 'absent') delete params.szerzenieMaxDystans; else params.szerzenieMaxDystans = sp;
  params.progDominacjiPct = pick([50, 30, 75, 100, 0]);
  const cityRelig = new Map(Object.entries(relig));
  const c = {
    keys, cities, relig, stateReligion,
    szerzenieMaxDystans: sp === 'absent' ? null : sp,
    progDominacjiPct: params.progDominacjiPct,
  };
  // cityRelig: dla miast bez wpisu tabela dominant potrzebuje {counts:{}} - dominant() je zapisze
  if (rnd() < 0.5) {
    c.ownerId = pick([0, 1]);
    c.out = [...R.collectReligionRangeHexKeys(mapFromKeys(keys), cities, cityRelig, stateReligion, params, c.ownerId)].sort();
  } else {
    c.out = [...R.collectReligionRangeHexKeys(mapFromKeys(keys), cities, cityRelig, stateReligion, params)].sort();
  }
  range.religion.push(c);
}
// Dodatkowe przypadki: klucze ULAMKOWE ("q.5,r") - odleglosc polcalkowita, wiec floor(szerzenieMaxDystans) ma znaczenie.
for (let i = 0; i < 24; i++) {
  const cx = ri(-2, 2), cy = ri(-2, 2);
  const keys = [];
  for (let dq = -10; dq <= 10; dq++) for (let dr = -4; dr <= 4; dr++) keys.push(`${cx + dq + 0.5},${cy + dr}`, `${cx + dq},${cy + dr}`);
  const sp = pick([0.5, 1.5, 2.5, 3.5, 3.9, 0, 2]);
  const params = { ...CR.FALLBACK_RELIGION_PARAMS, szerzenieMaxDystans: sp };
  const cities = [{ id: 'f0', q: cx, r: cy, ownerId: 0, population: pick([1, 3, 5]), kultura: 0, ...(rnd() < 0.3 ? { isOutpost: true } : {}) }];
  const relig = { f0: { counts: {} } };
  const c = { keys, cities, relig, stateReligion: null, szerzenieMaxDystans: sp, progDominacjiPct: params.progDominacjiPct };
  c.out = [...R.collectReligionRangeHexKeys(mapFromKeys(keys), cities, new Map(Object.entries(relig)), null, params)].sort();
  range.religion.push(c);
}
// Tabela dominantReligion: WYNIKI prawdziwego CR.dominantReligion dla wszystkich par (counts, prog) uzytych powyzej
// (miasta z owner != filtr tez sa tu - zapis nadmiarowy jest nieszkodliwy: tabela jest tylko slownikiem).
for (const c of range.religion) {
  for (const city of c.cities) {
    const rel = c.relig[city.id] ?? { counts: {} };
    domSeen.set(canon(rel.counts) + '|' + c.progDominacjiPct, {
      counts: rel.counts, progDominacjiPct: c.progDominacjiPct,
      result: CR.dominantReligion(rel, { ...CR.FALLBACK_RELIGION_PARAMS, progDominacjiPct: c.progDominacjiPct }),
    });
  }
}
range.dominant = [...domSeen.values()];
write('range.json', range);

// ---------- wonder-placement.ts ----------
const wonder = { city: [], pick: [], owner: [] };
function genWCity(hexes) {
  const c = { q: ri(-5, 5), r: ri(-5, 5), population: pick([0, 1, 3, 5, 8, 12, 15, 20, 2.5]) };
  const k = rnd();
  if (k < 0.15) c.isFort = true; else if (k < 0.3) c.isOutpost = true;
  return c;
}
const pts = (n, lim) => Array.from({ length: n }, () => ({ q: ri(-lim, lim), r: ri(-lim, lim) }));
for (let i = 0; i < 80; i++) {
  const hexes = genMap(ri(2, 10), rnd() < 0.5);
  const input = {
    city: genWCity(hexes),
    occupiedWonderHexes: pts(ri(0, 8), 6),
    cityHexes: pts(ri(0, 4), 6),
  };
  const out = P.listQualifyingWonderHexesForCity({ map: mapObj(hexes), ...input });
  const pk = P.pickWonderHexForCity({ map: mapObj(hexes), ...input });
  wonder.city.push({ hexes, ...input, out });
  wonder.pick.push({ hexes, ...input, out: pk });
}
for (let i = 0; i < 80; i++) {
  const hexes = genMap(ri(2, 10), rnd() < 0.5);
  const input = {
    playerCities: Array.from({ length: ri(0, 4) }, () => genWCity(hexes)),
    occupiedWonderHexes: pts(ri(0, 6), 6),
    buildingWonderHexes: pts(ri(0, 4), 6),
    cityHexes: pts(ri(0, 4), 6),
  };
  wonder.owner.push({ hexes, ...input, out: P.listQualifyingWonderHexesForOwner({ map: mapObj(hexes), ...input }) });
}
write('wonder.json', wonder);

console.log(JSON.stringify({
  territory: Object.fromEntries(Object.entries(territory).map(([k, v]) => [k, Array.isArray(v) ? v.length : 1])),
  work: Object.fromEntries(Object.entries(work).map(([k, v]) => [k, v.length])),
  range: Object.fromEntries(Object.entries(range).map(([k, v]) => [k, v.length])),
  wonder: Object.fromEntries(Object.entries(wonder).map(([k, v]) => [k, v.length])),
}));
