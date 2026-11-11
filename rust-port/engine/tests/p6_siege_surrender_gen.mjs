// R-RUSTPORT-P6-SIEGE-SURRENDER-Q1 (W8 3/3, obrona r2): generator wektorow WYKONUJE wycinki funkcji z pinu.
//
// Zrodla (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, pliki tylko do odczytu, poza repo):
//   * gra/src/main.ts: handleSiegeCapitulationPhase, besiegerOwnerForCity, resolveSiegeSurrender, endMapSiege;
//   * gra/src/units/setup.ts: hexDistance.
// Kazda funkcja jest wycinana po nazwie (od linii deklaracji do domykajacego nawiasu o tym samym wciecie),
// typy sa zdejmowane przez node:module.stripTypeScriptTypes i wykonywane w `with` na Proxy. Identyfikator spoza
// zestawu `vars` NIE jest cicho zastepowany atrapa z milczeniem: staje sie wywolaniem zwracajacym undefined,
// zapisanym w `calls` (klasyfikacja galezi opiera sie na tym logu). Sentinel `Stop` przerywa resolveSiegeSurrender
// w miejscu wywolania enterCityAfterSurrender - tuz po splice obroncow i ustawieniu population.
//
// Uzycie (dwa pliki wejsciowe spoza repo, wynik na stdout):
//   node tests/p6_siege_surrender_gen.mjs <main.ts@pin> <units/setup.ts@pin> > tests/p6_siege_surrender_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const [mainPath, setupPath] = process.argv.slice(2);
if (!mainPath || !setupPath) throw new Error('uzycie: gen.mjs <main.ts> <units/setup.ts>');
const mainLines = readFileSync(mainPath, 'utf8').split('\n');
const setupLines = readFileSync(setupPath, 'utf8').split('\n');

function extractFn(lines, name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\(`);
  const start = lines.findIndex(l => re.test(l));
  if (start < 0) throw new Error(`brak funkcji ${name}`);
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '}') end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}

const SRC = {
  hexDistance: extractFn(setupLines, 'hexDistance'),
  besiegerOwnerForCity: extractFn(mainLines, 'besiegerOwnerForCity'),
  handleSiegeCapitulationPhase: extractFn(mainLines, 'handleSiegeCapitulationPhase'),
  resolveSiegeSurrender: extractFn(mainLines, 'resolveSiegeSurrender'),
  endMapSiege: extractFn(mainLines, 'endMapSiege'),
};

class Stop extends Error {}
const GLOBALS = new Set(['Math', 'Number', 'Object', 'Array', 'JSON', 'Map', 'Set', 'String', 'Boolean',
  'console', 'undefined', 'NaN', 'Infinity', 'Error', 'Symbol']);

// Ladowanie wycinkow w jednym bloku `with`; `vars` = jawne zaleznosci (tablice, mapy, stuby z logiem).
function load(names, vars, calls) {
  const code = names.map(n => stripTypeScriptTypes(SRC[n])).join('\n');
  const body = `with (S) {\n${code}\nreturn { ${names.join(', ')} };\n}`;
  const scope = new Proxy({}, {
    has: (_t, k) => typeof k === 'string' && !GLOBALS.has(k),
    get: (_t, k) => {
      if (k === Symbol.unscopables) return undefined;
      if (k in vars) return vars[k];
      return deepStub(String(k), calls);
    },
  });
  return new Function('S', body)(scope);
}

// Atrapa nieznanego identyfikatora: kazde wywolanie (takze metody, np. `cityRenderer.sync`) jest zapisywane w logu
// i zwraca undefined; odczyt wlasciwosci daje kolejna atrape. Nie ma tu zadnej logiki weba.
function deepStub(name, calls) {
  return new Proxy(function () {}, {
    get: (_t, k) => {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'length') return 0;
      return deepStub(`${name}.${String(k)}`, calls);
    },
    apply: () => { calls.push(name); return undefined; },
  });
}

function makeRnd(seed) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OWNERS = [0, 1, 2, 3];
const OWNERS_ALL = [0, 1, 2, 3, 9];
const FOODS = [-2, -0.5, 0, 0.5, 3, NaN];
const POPS = [0, 0.4, 1, 2.7, 12, NaN];
const enc = v => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : v === undefined ? null : v);
const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];

// --- phase: handleSiegeCapitulationPhase (main.ts:17646) ---
function observePhase(pending, food) {
  const calls = [];
  const city = { id: 'c', name: 'C', siegeCapitulationPending: pending };
  const fns = load(['handleSiegeCapitulationPhase'], {
    getCityFood: () => food,
    resolveSiegeSurrender: () => { calls.push('resolveSiegeSurrender'); },
    siegeTurnByCity: new Map(),
    showHintMessage: () => { calls.push('showHintMessage'); },
  }, calls);
  fns.handleSiegeCapitulationPhase(city);
  if (calls.includes('resolveSiegeSurrender')) return 'resolve';
  if (city.siegeCapitulationPending === true && pending !== true) return 'setPending';
  return 'hold';
}

// --- besieger: besiegerOwnerForCity (main.ts:17634) + hexDistance (setup.ts:361) ---
function observeBesieger(city, units, stored) {
  const map = new Map();
  if (stored !== undefined) map.set(city.id, stored);
  const fns = load(['hexDistance', 'besiegerOwnerForCity'], { siegeBesiegerByCity: map, units }, []);
  const r = fns.besiegerOwnerForCity(city);
  return r === undefined ? null : r;
}

// --- uruchomienie resolveSiegeSurrender (main.ts:17662) z przerwaniem po splice + population ---
function runSurrender(scn) {
  const calls = [];
  const city = { id: 'c', q: scn.cityQ ?? 0, r: scn.cityR ?? 0, ownerId: scn.cityOwner, population: scn.pop ?? 5, name: 'C' };
  const units = (scn.units ?? []).map(u => ({ ...u }));
  const cities = scn.cityFound ? [city] : [];
  const siegeBesiegerByCity = new Map();
  if (scn.besieger !== null) siegeBesiegerByCity.set('c', scn.besieger);
  const vars = {
    cities, units, siegeBesiegerByCity,
    siegeTurnByCity: new Map(), siegeAiStateByKey: new Map(), cityProd: new Map(),
    areEnemyOwners: (a, b) => { calls.push('areEnemyOwners'); return scn.enemy(a, b); },
    enterCityAfterSurrender: () => { throw new Stop(); },
    showHintMessage: () => { calls.push('showHintMessage'); },
  };
  const fns = load(['hexDistance', 'besiegerOwnerForCity', 'resolveSiegeSurrender', 'endMapSiege'], vars, calls);
  let branch;
  try {
    fns.resolveSiegeSurrender('c');
    if (calls.includes('showHintMessage')) branch = 'noCaptor';
    else if (calls.includes('areEnemyOwners')) branch = 'notEnemy';
    else branch = 'noCity';
  } catch (e) {
    if (!(e instanceof Stop)) throw e;
    branch = 'transfer';
  }
  return { branch, city, units };
}

function makeEnemy(rnd, forced) {
  const table = {};
  for (const a of OWNERS_ALL) for (const b of OWNERS_ALL) table[`${a}-${b}`] = rnd() < 0.5;
  if (forced) table[`${forced[0]}-${forced[1]}`] = true;
  const pairs = [];
  for (const a of OWNERS_ALL) for (const b of OWNERS_ALL) pairs.push([a, b, table[`${a}-${b}`]]);
  return { enemy: (a, b) => table[`${a}-${b}`], pairs };
}

const rPhase = makeRnd(0x51e6e001);
const rPath = makeRnd(0x51e6e002);
const rRem = makeRnd(0x51e6e003);
const rEnd = makeRnd(0x51e6e004);
const rBes = makeRnd(0x51e6e005);

const phase = [];
for (let i = 0; i < 120; i++) {
  const pending = rPhase() < 0.4;
  const food = pick(rPhase, FOODS);
  phase.push({ pending, food: enc(food), expect: observePhase(pending, food) });
}

const path = [];
for (let i = 0; i < 200; i++) {
  const { enemy, pairs } = makeEnemy(rPath, null);
  const cityFound = rPath() < 0.9;
  const cityOwner = pick(rPath, OWNERS);
  const pk = rPath();
  const besieger = pk < 0.15 ? null : pk < 0.3 ? cityOwner : pk < 0.4 ? 9 : pick(rPath, OWNERS);
  const r = runSurrender({ cityFound, cityOwner, besieger, enemy });
  path.push({ cityFound, cityOwner, besieger, enemyPairs: pairs, expect: r.branch });
}

const removal = [];
for (let i = 0; i < 80; i++) {
  const oldOwner = pick(rRem, OWNERS);
  let besieger = pick(rRem, OWNERS);
  if (besieger === oldOwner) besieger = (oldOwner + 1) % 4;
  const { enemy, pairs } = makeEnemy(rRem, [besieger, oldOwner]);
  const n = 1 + Math.floor(rRem() * 6);
  const city = { q: Math.floor(rRem() * 3), r: Math.floor(rRem() * 3) };
  const units = [];
  for (let k = 0; k < n; k++) {
    // Polowa jednostek stoi na heksie miasta, zeby test splice mial co usuwac.
    const onCity = rRem() < 0.5;
    units.push({
      id: `u${i}_${k}`,
      ownerId: pick(rRem, OWNERS),
      q: onCity ? city.q : Math.floor(rRem() * 3),
      r: onCity ? city.r : Math.floor(rRem() * 3),
    });
  }
  const r = runSurrender({ cityFound: true, cityOwner: oldOwner, besieger, enemy, units, cityQ: city.q, cityR: city.r });
  if (r.branch !== 'transfer') throw new Error('removal: oczekiwano galezi transfer');
  const after = new Set(r.units.map(u => u.id));
  removal.push({
    city, oldOwner, besieger, enemyPairs: pairs,
    units: units.map(u => ({ ...u })),
    expect: units.map(u => u.id).filter(id => !after.has(id)),
  });
}

const ends = [];
for (let i = 0; i < 20; i++) {
  const city = {
    id: 'c', oblegane: true,
    siegeCapitulationPending: rEnd() < 0.5,
    siegeStarveStartMaxHp: 5 + Math.floor(rEnd() * 20),
    oblegajacyOwnerId: 2,
  };
  const before = { siegeCapitulationPending: city.siegeCapitulationPending, siegeStarveStartMaxHp: city.siegeStarveStartMaxHp };
  const fns = load(['endMapSiege'], {
    cities: [city], units: [], siegeBesiegerByCity: new Map([['c', 2]]),
    siegeAiStateByKey: new Map(), siegeTurnByCity: new Map(),
  }, []);
  fns.endMapSiege('c');
  ends.push({
    before,
    expect: {
      oblegane: enc(city.oblegane),
      siegeCapitulationPending: enc(city.siegeCapitulationPending),
      siegeStarveStartMaxHp: enc(city.siegeStarveStartMaxHp),
    },
  });
}

const pops = [];
for (const p of POPS) {
  const { enemy } = makeEnemy(rEnd, [2, 1]);
  const r = runSurrender({ cityFound: true, cityOwner: 1, besieger: 2, enemy, pop: p, units: [] });
  if (r.branch !== 'transfer') throw new Error('pop: oczekiwano galezi transfer');
  pops.push({ pop: enc(p), expect: enc(r.city.population) });
}

const besieger = [];
for (let i = 0; i < 40; i++) {
  const city = { id: 'c', ownerId: pick(rBes, OWNERS), q: 1, r: 1 };
  if (rBes() < 0.3) city.oblegajacyOwnerId = pick(rBes, OWNERS);
  const stored = rBes() < 0.4 ? pick(rBes, OWNERS) : undefined;
  const units = [];
  const nu = Math.floor(rBes() * 6);
  for (let k = 0; k < nu; k++) {
    units.push({ ownerId: pick(rBes, OWNERS), q: Math.floor(rBes() * 4), r: Math.floor(rBes() * 4) });
  }
  besieger.push({
    city: { ...city }, stored: enc(stored), units: units.map(u => ({ ...u })),
    expect: observeBesieger(city, units, stored),
  });
}

const vectors = {
  source: 'gra/src/main.ts + gra/src/units/setup.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (wykonanie wycinkow funkcji, patrz naglowek generatora)',
  phase, path, removal, besieger,
  end_and_pop: { ends, pops },
};

process.stdout.write(JSON.stringify(vectors, null, 1) + '\n');
