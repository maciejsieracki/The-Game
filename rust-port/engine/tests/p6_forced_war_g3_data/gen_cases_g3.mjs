// P6-FORCED-WAR-MODULES-Q1 (G3a): generator wektorow cases.json z URUCHOMIONEGO weba
// (game/forced-war-waves.ts: planForcedWarWave, pruneForcedWarWaves, approachSectorForHex,
// serialize/restore, emptyForcedWarWaveState, hexDistanceForForcedWar).
//
// Uzycie (Node 22; pliki webowe z `git archive origin/main gra/src gra/data` rozpakowane poza repo):
//   node --experimental-strip-types gen_cases_g3.mjs <DIR>/gra/src <sciezka>/cases.json            # weryfikacja (exit 1 przy roznicy)
//   node --experimental-strip-types gen_cases_g3.mjs <DIR>/gra/src <sciezka>/cases.json --write    # zapis wektorow
//
// Patche (tylko w kopiach w katalogu tymczasowym; logika waves bez zmian):
//  - `units/setup` -> stub: `hexDistance` wyciagniete doslownie z setup.ts; `isCivilianUnit` zwraca pole
//    `__civ` (prawdziwy isCivilianUnit to zbiory w setup.ts; Rust dostaje wynik jako `is_civilian`),
//  - `army-concentration` -> stub: stale ARMY_CONCENTRATION_MIN_UNITS / RADIUS wyciagniete z webu.
// Wejscia deterministyczne (PRNG, ziarno 20261109). `out` liczony WYLACZNIE przez web.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , srcDir, casesPath, mode] = process.argv;
if (!srcDir || !casesPath) {
  console.error('uzycie: node gen_cases_g3.mjs <gra/src> <cases.json> [--write]');
  process.exit(2);
}
const write = mode === '--write';

// --- 1. Kopie modulow webowych w katalogu tymczasowym ---
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p6fw-g3-'));
const gameTmp = path.join(tmp, 'game');
fs.mkdirSync(gameTmp, { recursive: true });
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}\n');

const setupSrc = fs.readFileSync(path.join(srcDir, 'units', 'setup.ts'), 'utf8');
const hdMatch = setupSrc.match(/export function hexDistance\([\s\S]*?\n\}\n/);
if (!hdMatch) throw new Error('nie znaleziono hexDistance w units/setup.ts');
fs.writeFileSync(
  path.join(tmp, 'setup-stub.ts'),
  hdMatch[0] + '\nexport function isCivilianUnit(u: { __civ?: boolean }): boolean { return u.__civ === true; }\n'
    + 'export interface RuntimeUnit { id: string }\n',
);

const acSrc = fs.readFileSync(path.join(srcDir, 'game', 'army-concentration.ts'), 'utf8');
const minM = acSrc.match(/export const ARMY_CONCENTRATION_MIN_UNITS = (\d+);/);
const radM = acSrc.match(/export const ARMY_CONCENTRATION_RADIUS = (\d+);/);
if (!minM || !radM) throw new Error('nie znaleziono stalych ARMY_CONCENTRATION w army-concentration.ts');
fs.writeFileSync(
  path.join(gameTmp, 'army-concentration-stub.ts'),
  `export const ARMY_CONCENTRATION_MIN_UNITS = ${minM[1]};\n`
    + `export const ARMY_CONCENTRATION_RADIUS = ${radM[1]};\n`
    + 'export function clusterUnitsByProximity(): never { throw new Error("nieuzywane"); }\n',
);

let wavesSrc = fs.readFileSync(path.join(srcDir, 'game', 'forced-war-waves.ts'), 'utf8');
if (!wavesSrc.includes("from '../units/setup';") || !wavesSrc.includes("from './army-concentration';")) {
  throw new Error('zmienione importy forced-war-waves.ts (zrodlo weba niezgodne z generatorem)');
}
wavesSrc = wavesSrc
  .split("from '../units/setup';").join("from '../setup-stub.ts';")
  .split("from './army-concentration';").join("from './army-concentration-stub.ts';");
fs.writeFileSync(path.join(gameTmp, 'forced-war-waves.ts'), wavesSrc);

const W = await import(pathToFileURL(path.join(gameTmp, 'forced-war-waves.ts')).href);
const hex = await import(pathToFileURL(path.join(tmp, 'setup-stub.ts')).href);
const MIN_UNITS = Number(minM[1]);
const RADIUS = Number(radM[1]);

// --- 2. PRNG (deterministyczny) ---
let seed = 20261109;
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const rndInt = n => Math.floor(rnd() * n);
const pick = arr => arr[rndInt(arr.length)];
const chance = p => rnd() < p;

// --- 3. Generatory wejsc (JSON-owe; null = brak pola) ---
const idU = n => `u${n}`;
const idC = n => `c${n}`;
const hexOf = (range) => ({ q: rndInt(2 * range + 1) - range, r: rndInt(2 * range + 1) - range });

function randUnit(n, range) {
  const h = hexOf(range);
  return {
    id: idU(n),
    ownerId: pick([1, 2, 3, 4]),
    category: chance(0.08) ? 'galera' : pick(['piechota', 'lucznik', 'konnica']),
    q: h.q,
    r: h.r,
    ruchLeft: chance(0.12) ? 0 : pick([1, 2, 3]),
    isCivilian: chance(0.08),
    inGarnizon: chance(0.08),
    oblegaCityId: chance(0.08) ? idC(rndInt(5) + 1) : null,
    embarked: chance(0.06),
    seaRaider: chance(0.05),
  };
}

function randCity(n, range) {
  const h = hexOf(range);
  return { id: idC(n), ownerId: pick([1, 2, 3, 4]), q: h.q, r: h.r };
}

function randWave(n, unitIds, cities, range) {
  const k = 1 + rndInt(Math.min(4, Math.max(1, unitIds.length)));
  const ids = [];
  for (let i = 0; i < k && unitIds.length > 0; i++) ids.push(pick(unitIds));
  const tgt = cities.length > 0 && chance(0.85) ? pick(cities).id : idC(rndInt(6) + 1);
  return {
    id: `bronze-${n}`,
    targetCityId: tgt,
    unitIds: ids,
    originHex: hexOf(range),
    rallyPoint: hexOf(range),
    approachSector: rndInt(6),
    createdTurn: rndInt(300),
  };
}

function randHistory(cities, range) {
  return {
    targetCityId: cities.length > 0 && chance(0.7) ? pick(cities).id : idC(rndInt(6) + 1),
    originHex: hexOf(range),
    rallyPoint: hexOf(range),
    approachSector: rndInt(6),
    createdTurn: rndInt(300),
  };
}

function randPlanInput() {
  const nUnits = rndInt(16);
  const units = Array.from({ length: nUnits }, (_, i) => randUnit(i + 1, 5));
  const nCities = rndInt(5);
  const cities = Array.from({ length: nCities }, (_, i) => randCity(i + 1, 6));
  const unitIds = units.map(u => u.id);
  const cityIds = cities.map(c => c.id);
  const activeWaves = Array.from({ length: rndInt(3) }, (_, i) => randWave(i + 1, unitIds, cityIds.length ? cities : [], 5));
  const waveHistory = Array.from({ length: rndInt(3) }, () => randHistory(cities, 5));
  const excluded = unitIds.filter(() => chance(0.1));
  return { units, targetCities: cities, activeWaves, waveHistory, excluded, createdTurn: rndInt(300) };
}

function toWebUnit(u) {
  return {
    id: u.id,
    ownerId: u.ownerId,
    category: u.category,
    q: u.q,
    r: u.r,
    ruchLeft: u.ruchLeft,
    inGarnizon: u.inGarnizon,
    oblegaCityId: u.oblegaCityId ?? undefined,
    embarked: u.embarked,
    seaRaider: u.seaRaider,
    __civ: u.isCivilian,
  };
}

function callPlan(i) {
  const res = W.planForcedWarWave(
    i.units.map(toWebUnit),
    i.targetCities,
    i.activeWaves,
    new Set(i.excluded),
    (a, b) => hex.hexDistance(a.q, a.r, b.q, b.r), // hexDistanceFn web przyjmuje obiekty {q,r}
    i.createdTurn,
    i.waveHistory,
  );
  return res ?? null;
}

function callPrune(i) {
  const state = i.state === null ? undefined : i.state;
  const res = W.pruneForcedWarWaves(state, i.attackerId, i.targetOwnerId, i.units.map(toWebUnit), i.cities);
  return res === undefined ? null : res;
}

function callWeb(c) {
  const i = c.in;
  switch (c.fn) {
    case 'planForcedWarWave':
      return callPlan(i);
    case 'pruneForcedWarWaves':
      return callPrune(i);
    case 'approachSectorForHex':
      return W.approachSectorForHex(i.target, i.origin);
    case 'hexDistanceForForcedWar':
      return W.hexDistanceForForcedWar(i.a, i.b);
    case 'serializeForcedWarWaves':
      return W.serializeForcedWarWaves(new Map(i.entries));
    case 'restoreForcedWarWaves':
      return Array.from(W.restoreForcedWarWaves(i.saved).entries());
    case 'emptyForcedWarWaveState':
      return W.emptyForcedWarWaveState();
    case 'constant': {
      const all = { ARMY_CONCENTRATION_MIN_UNITS: MIN_UNITS, ARMY_CONCENTRATION_RADIUS: RADIUS };
      return all[i.name];
    }
    default:
      throw new Error(`nieznana funkcja ${c.fn}`);
  }
}

// --- 4. Przypadki ---
const cases = [];
const add = (fn, input) => cases.push({ fn, in: input });

// 4a. planForcedWarWave: losowe + reczne.
for (let k = 0; k < 220; k++) add('planForcedWarWave', randPlanInput());
add('planForcedWarWave', { units: [], targetCities: [], activeWaves: [], waveHistory: [], excluded: [], createdTurn: 0 });
add('planForcedWarWave', { units: [randUnit(1, 0), randUnit(2, 0)], targetCities: [randCity(1, 3)], activeWaves: [], waveHistory: [], excluded: [], createdTurn: 7 });
const line = [
  { id: 'u1', ownerId: 1, category: 'piechota', q: 0, r: 0, ruchLeft: 2, isCivilian: false, inGarnizon: false, oblegaCityId: null, embarked: false, seaRaider: false },
  { id: 'u2', ownerId: 1, category: 'piechota', q: 1, r: 0, ruchLeft: 2, isCivilian: false, inGarnizon: false, oblegaCityId: null, embarked: false, seaRaider: false },
  { id: 'u3', ownerId: 1, category: 'piechota', q: 2, r: 0, ruchLeft: 2, isCivilian: false, inGarnizon: false, oblegaCityId: null, embarked: false, seaRaider: false },
];
add('planForcedWarWave', { units: line, targetCities: [{ id: 'c1', ownerId: 2, q: 6, r: -3 }, { id: 'c2', ownerId: 2, q: -4, r: 2 }], activeWaves: [], waveHistory: [], excluded: [], createdTurn: 5 });
add('planForcedWarWave', { units: line, targetCities: [{ id: 'c1', ownerId: 2, q: 6, r: -3 }], activeWaves: [], waveHistory: [{ targetCityId: 'c1', originHex: { q: 0, r: 0 }, rallyPoint: { q: 0, r: 0 }, approachSector: 0, createdTurn: 1 }], excluded: [], createdTurn: 5 });
add('planForcedWarWave', { units: line, targetCities: [{ id: 'c1', ownerId: 2, q: 6, r: -3 }], activeWaves: [], waveHistory: [], excluded: ['u1'], createdTurn: 5 });
add('planForcedWarWave', { units: line, targetCities: [{ id: 'c1', ownerId: 2, q: 6, r: -3 }], activeWaves: [], waveHistory: [], excluded: ['u1', 'u2'], createdTurn: 5 });

// 4b. approachSectorForHex: siatka 9x9 wokol celu (0,0) + losowe.
for (let dq = -4; dq <= 4; dq++) for (let dr = -4; dr <= 4; dr++) {
  add('approachSectorForHex', { target: { q: 0, r: 0 }, origin: { q: dq, r: dr } });
}
for (let k = 0; k < 40; k++) add('approachSectorForHex', { target: hexOf(30), origin: hexOf(30) });

// 4c. hexDistanceForForcedWar.
for (let k = 0; k < 30; k++) add('hexDistanceForForcedWar', { a: hexOf(8), b: hexOf(8) });

// 4d. pruneForcedWarWaves.
function randPruneInput() {
  const units = Array.from({ length: 2 + rndInt(10) }, (_, i) => randUnit(i + 1, 4));
  const cities = Array.from({ length: 1 + rndInt(3) }, (_, i) => randCity(i + 1, 5));
  const unitIds = units.map(u => u.id);
  const waves = Array.from({ length: rndInt(3) }, (_, i) => {
    const w = randWave(i + 1, unitIds, cities, 5);
    if (chance(0.5)) for (const u of units) if (chance(0.4) && u.ownerId === 1) { u.oblegaCityId = w.targetCityId; }
    return w;
  });
  const history = Array.from({ length: rndInt(2) }, () => randHistory(cities, 5));
  const state = chance(0.1) ? null : { nextWaveId: 1 + rndInt(4), waves, history };
  return { state, attackerId: 1, targetOwnerId: pick([2, 3]), units, cities };
}
for (let k = 0; k < 120; k++) add('pruneForcedWarWaves', randPruneInput());
add('pruneForcedWarWaves', { state: null, attackerId: 1, targetOwnerId: 2, units: [], cities: [] });
add('pruneForcedWarWaves', { state: { nextWaveId: 1, waves: [], history: [] }, attackerId: 1, targetOwnerId: 2, units: [], cities: [] });

// 4e. serialize / restore.
const sampleState = (n) => ({
  nextWaveId: n,
  waves: [{ id: `bronze-${n}`, targetCityId: 'c1', unitIds: ['u1', 'u2'], originHex: { q: 1, r: -2 }, rallyPoint: { q: 1, r: -2 }, approachSector: 3, createdTurn: 12 }],
  history: [{ targetCityId: 'c2', originHex: { q: 0, r: 0 }, rallyPoint: { q: 0, r: 0 }, approachSector: 5, createdTurn: 4 }],
});
add('serializeForcedWarWaves', { entries: [] });
add('serializeForcedWarWaves', { entries: [['1-2', sampleState(2)], ['3-4', { nextWaveId: 1, waves: [], history: [] }]] });
add('serializeForcedWarWaves', { entries: [['5-6', sampleState(3)]] });

const restoreCases = [
  null, 'x', {}, [], [null], [['k']], [['k', null]], [['k', []]], [['k', {}]], [['k', { waves: 'x' }]],
  [['k', { waves: [] }]],
  [['k', { waves: [], nextWaveId: 0 }]],
  [['k', { waves: [], nextWaveId: 5.5 }]],
  [['k', { waves: [], nextWaveId: '7' }]],
  [['k', { waves: [], history: 'bad', nextWaveId: 3 }]],
  [['a', sampleState(2)], ['a', sampleState(9)]],
  [['a', sampleState(2)], ['b', sampleState(4)], ['a', { waves: [], history: [] }]],
  [['k', { nextWaveId: 3, waves: [{ id: 'w1', targetCityId: 'c1', unitIds: ['u1'], originHex: { q: 1, r: 1 }, rallyPoint: { q: 1, r: 1 }, approachSector: 2, createdTurn: 3 }, { id: 5, targetCityId: 'c1', unitIds: [], originHex: { q: 1, r: 1 }, rallyPoint: { q: 1, r: 1 }, approachSector: 2, createdTurn: 3 }, { id: 'w3', targetCityId: 'c1', unitIds: [], originHex: { q: 1, r: 1 }, rallyPoint: { q: 1, r: 1 }, approachSector: 'x', createdTurn: 3 }, null, 'str'] }]],
  [['k', { nextWaveId: 2, waves: [], history: [{ targetCityId: 'c9', originHex: { q: 0, r: 0 }, rallyPoint: { q: 0, r: 0 }, approachSector: 1 }, { targetCityId: 9, originHex: { q: 0, r: 0 }, rallyPoint: { q: 0, r: 0 }, approachSector: 1, createdTurn: 2 }, { targetCityId: 'c8', originHex: { q: 0, r: 0 }, rallyPoint: { q: 0, r: 0 }, approachSector: 1, createdTurn: 'x' }, { targetCityId: 'c7', originHex: null, rallyPoint: { q: 0, r: 0 }, approachSector: 1, createdTurn: 1 }, null] } ]],
];
for (const saved of restoreCases) add('restoreForcedWarWaves', { saved });
for (let k = 0; k < 30; k++) {
  const entries = Array.from({ length: rndInt(4) }, (_, i) => [`${i + 1}-${rndInt(9)}`, sampleState(1 + rndInt(6))]);
  add('restoreForcedWarWaves', { saved: entries });
}
add('emptyForcedWarWaveState', {});
add('constant', { name: 'ARMY_CONCENTRATION_MIN_UNITS' });
add('constant', { name: 'ARMY_CONCENTRATION_RADIUS' });

// --- 5. Przeliczenie przez web; tryb weryfikacji porownuje z plikiem ---
const existing = fs.existsSync(casesPath) ? JSON.parse(fs.readFileSync(casesPath, 'utf8')) : null;
let diffs = 0;
for (let idx = 0; idx < cases.length; idx++) {
  const c = cases[idx];
  const got = callWeb(c);
  c.out = JSON.parse(JSON.stringify(got === undefined ? null : got));
  if (existing && !write) {
    const e = existing[idx];
    if (!e || JSON.stringify(e.out) !== JSON.stringify(c.out) || JSON.stringify(e.in) !== JSON.stringify(c.in)) {
      diffs++;
      if (diffs <= 20) console.error('ROZNICA', idx, c.fn);
    }
  }
}
if (write) fs.writeFileSync(casesPath, JSON.stringify(cases, null, 1) + '\n');
const nonNull = cases.filter(c => c.fn === 'planForcedWarWave' && c.out !== null).length;
console.log(`web-wektory G3a: ${cases.length} przypadkow (plan niepusty: ${nonNull}); roznic=${diffs}${write ? ' (zapisano)' : ' (tryb weryfikacji)'}`);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(diffs === 0 ? 0 : 1);
