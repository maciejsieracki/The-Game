// R-RUSTPORT-P6-SIEGE-TRANSFER-Q5-Q1: generator wektorow dla 4 skutkow przejecia (BRAK -> Ported).
//
// Zrodla (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, tylko odczyt, poza repo):
//   * gra/src/main.ts: garnizonCountForCity (:17478), syncCityGarnizon (:17630), applyLiveSafeRationForCity (:21803);
//   * gra/src/ui/eliminationSpectacle.ts: newChronicle (:61), chronicleFor (:71), noteCityCapture (:138);
//   * gra/src/game/empire-food.ts: isCityAutoWyzywienieEnabled (:390) - WYCINANA i wykonywana realnie.
//
// Wykonywane REALNIE (wycinane po nazwie, typy zdejmowane przez stripTypeScriptTypes, uruchamiane w `with` na Proxy):
// garnizonCountForCity, syncCityGarnizon, newChronicle, chronicleFor, noteCityCapture, isCityAutoWyzywienieEnabled,
// applyLiveSafeRationForCity.
// Jawne wejscia scenariusza (NIE logika weba; wartosci zwracane przez stuby zapisane w `calls`):
//   * getCityRationLevel(city) -> scenariusz `level` (funkcja w game/population-growth-v85.ts, poza zakresem klocka);
//   * ensureCityRationDefaults(city) -> stub: zapisuje wolanie, opcjonalnie ustawia poziomRacji (scenariusz);
//   * getMaxSafePoziomRacjiForPlayerCity(cityId) -> scenariusz `maxSafe` (main.ts:21612, poza zakresem);
//   * markCityStateDirty() -> stub zapisujacy wolanie.
// Wektor `set` (playerEverOwnedCityByOwner.add) NIE ma funkcji do wyciecia (pojedyncze Set.add w main.ts:17816):
// jego wektor sprawdza semantyke JS Set i jest oznaczony jako `semantic` w wyniku.
//
// Uzycie: node tests/p6_siege_transfer_q5_gen.mjs <main.ts@pin> <eliminationSpectacle.ts@pin> <empire-food.ts@pin> \
//   > tests/p6_siege_transfer_q5_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const [mainPath, elimPath, foodPath] = process.argv.slice(2);
if (!mainPath || !elimPath || !foodPath) {
  throw new Error('uzycie: gen.mjs <main.ts> <eliminationSpectacle.ts> <empire-food.ts>');
}
const readLines = p => readFileSync(p, 'utf8').split('\n');
const mainLines = readLines(mainPath);
const elimLines = readLines(elimPath);
const foodLines = readLines(foodPath);

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
  garnizonCountForCity: extractFn(mainLines, 'garnizonCountForCity'),
  syncCityGarnizon: extractFn(mainLines, 'syncCityGarnizon'),
  applyLiveSafeRationForCity: extractFn(mainLines, 'applyLiveSafeRationForCity'),
  newChronicle: extractFn(elimLines, 'newChronicle'),
  chronicleFor: extractFn(elimLines, 'chronicleFor'),
  noteCityCapture: extractFn(elimLines, 'noteCityCapture'),
  isCityAutoWyzywienieEnabled: extractFn(foodLines, 'isCityAutoWyzywienieEnabled'),
};

class Stop extends Error {}
const GLOBALS = new Set(['Math', 'Number', 'Object', 'Array', 'JSON', 'Map', 'Set', 'String', 'Boolean',
  'console', 'undefined', 'NaN', 'Infinity', 'Error', 'Symbol']);

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

// Pelny zrzut CivChronicle w tej samej postaci co Rust-owy odczyt (klucze opcjonalne tylko gdy obecne).
function chronicleOut(c) {
  const out = {};
  if (c.sinceTurn !== undefined) out.sinceTurn = c.sinceTurn;
  if (c.legacy !== undefined) out.legacy = c.legacy;
  for (const k of ['produced', 'lost', 'destroyed', 'battles', 'citiesTaken', 'citiesLost', 'maxCities', 'peakPop', 'wonders']) {
    out[k] = c[k];
  }
  out.vs = {};
  for (const [k, v] of Object.entries(c.vs)) out.vs[k] = { k: v.k, l: v.l, b: v.b };
  return out;
}

// ---------- garnizon ----------
const garnizonCases = [
  { name: 'pusty stan', city: { ownerId: 1, q: 3, r: 4 }, units: [] },
  { name: 'dwie w garnizonie wlasciciela', city: { ownerId: 1, q: 3, r: 4 },
    units: [{ ownerId: 1, q: 3, r: 4, inGarnizon: true }, { ownerId: 1, q: 3, r: 4, inGarnizon: true }] },
  { name: 'jednostka poza garnizonem nie liczy sie', city: { ownerId: 1, q: 3, r: 4 },
    units: [{ ownerId: 1, q: 3, r: 4, inGarnizon: true }, { ownerId: 1, q: 3, r: 4, inGarnizon: false }] },
  { name: 'obcy wlasciciel na heksie nie liczy sie', city: { ownerId: 1, q: 3, r: 4 },
    units: [{ ownerId: 2, q: 3, r: 4, inGarnizon: true }, { ownerId: 1, q: 3, r: 4, inGarnizon: true }] },
  { name: 'inny heks nie liczy sie', city: { ownerId: 1, q: 3, r: 4 },
    units: [{ ownerId: 1, q: 3, r: 5, inGarnizon: true }, { ownerId: 1, q: 4, r: 4, inGarnizon: true }] },
  { name: 'inGarnizon brak klucza = false', city: { ownerId: 0, q: 0, r: 0 },
    units: [{ ownerId: 0, q: 0, r: 0 }, { ownerId: 0, q: 0, r: 0, inGarnizon: true }] },
  { name: 'stan po zdobyciu: obroncy starego usunieci, wchodzacy w garnizonie', city: { ownerId: 2, q: 7, r: 2 },
    units: [{ ownerId: 2, q: 7, r: 2, inGarnizon: true }, { ownerId: 2, q: 7, r: 2, inGarnizon: true }, { ownerId: 2, q: 7, r: 2, inGarnizon: true }] },
];

function runGarnizon(c) {
  const calls = [];
  const units = c.units;
  const fns = load(['garnizonCountForCity', 'syncCityGarnizon'], { units }, calls);
  const city = { ownerId: c.city.ownerId, q: c.city.q, r: c.city.r, garnizon: undefined };
  fns.syncCityGarnizon(city);
  if (calls.length) throw new Error(`garnizon: nieoczekiwane wolania ${calls.join(',')}`);
  return { garnizon: city.garnizon };
}

// ---------- kronika (noteCityCapture) ----------
const captureCases = [
  { name: 'nowe miasto: zdobywca i ofiara z tura', initial: [], oldOwner: 1, newOwner: 2, turn: 14 },
  { name: 'bez tury: brak sinceTurn', initial: [], oldOwner: 1, newOwner: 2, turn: null },
  { name: 'tura NaN: brak sinceTurn', initial: [], oldOwner: 1, newOwner: 2, turn: NaN },
  { name: 'ten sam wlasciciel = no-op', initial: [{ owner: 3, turn: 5, legacy: false, citiesTaken: 2 }], oldOwner: 3, newOwner: 3, turn: 9 },
  { name: 'istniejacy wpis: liczniki rosna, sinceTurn zachowany', initial: [{ owner: 2, turn: 5, legacy: false, citiesTaken: 1, citiesLost: 4 }],
    oldOwner: 1, newOwner: 2, turn: 20 },
  { name: 'legacy wpis zachowuje flage legacy', initial: [{ owner: 0, turn: null, legacy: true, citiesLost: 1 }],
    oldOwner: 0, newOwner: 5, turn: 30 },
  { name: 'odbicie: role odwrocone w tej samej turze', initial: [{ owner: 0, turn: 1, legacy: false, citiesTaken: 1 }, { owner: 1, turn: 1, legacy: false, citiesLost: 1 }],
    oldOwner: 1, newOwner: 0, turn: 30 },
];

function runCapture(c) {
  const calls = [];
  const fns = load(['newChronicle', 'chronicleFor', 'noteCityCapture'], {}, calls);
  const map = new Map();
  for (const e of c.initial) {
    const ch = fns.newChronicle(e.turn === null ? undefined : e.turn, e.legacy === true);
    if (e.citiesTaken !== undefined) ch.citiesTaken = e.citiesTaken;
    if (e.citiesLost !== undefined) ch.citiesLost = e.citiesLost;
    map.set(e.owner, ch);
  }
  fns.noteCityCapture(map, c.oldOwner, c.newOwner, c.turn === null ? undefined : c.turn);
  if (calls.length) throw new Error(`capture: nieoczekiwane wolania ${calls.join(',')}`);
  const entries = Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([k, v]) => [k, chronicleOut(v)]);
  return { map: entries };
}

// ---------- racje (applyLiveSafeRationForCity) ----------
const rationCases = [
  { name: 'gracz, auto wlaczone, poziom ponad maxSafe -> obciecie', owner: 0, autoWyzywienie: true, level: 4, maxSafe: 2 },
  { name: 'gracz, auto wlaczone, poziom rowny maxSafe -> bez zmian', owner: 0, autoWyzywienie: true, level: 3, maxSafe: 3 },
  { name: 'gracz, auto wlaczone, poziom ponizej maxSafe -> bez zmian', owner: 0, autoWyzywienie: true, level: 1, maxSafe: 3 },
  { name: 'gracz, auto wylaczone -> wczesny return', owner: 0, autoWyzywienie: false, level: 5, maxSafe: 1 },
  { name: 'gracz, auto brak pola -> traktowane jak wylaczone', owner: 0, autoWyzywienie: undefined, level: 5, maxSafe: 1 },
  { name: 'AI (owner 1) -> wczesny return mimo auto', owner: 1, autoWyzywienie: true, level: 5, maxSafe: 1 },
  { name: 'ulamkowy maxSafe obcina do wartosci maxSafe', owner: 0, autoWyzywienie: true, level: 4, maxSafe: 2.5 },
];

function runRation(c) {
  const calls = [];
  const city = { id: 'c1', ownerId: c.owner, autoWyzywienie: c.autoWyzywienie, poziomRacji: c.level };
  const cities = [city];
  const vars = {
    cities,
    ensureCityRationDefaults: (x) => { calls.push('ensureCityRationDefaults'); x.poziomRacji = x.poziomRacji ?? 4; },
    getCityRationLevel: (x) => { calls.push('getCityRationLevel'); return c.level; },
    getMaxSafePoziomRacjiForPlayerCity: (id) => { calls.push('getMaxSafePoziomRacjiForPlayerCity'); return c.maxSafe; },
    markCityStateDirty: () => { calls.push('markCityStateDirty'); },
  };
  const fns = load(['isCityAutoWyzywienieEnabled', 'applyLiveSafeRationForCity'], vars, calls);
  const autoEnabled = fns.isCityAutoWyzywienieEnabled(city);
  fns.applyLiveSafeRationForCity('c1');
  return {
    autoEnabled,
    poziomRacjiAfter: city.poziomRacji,
    dirty: calls.includes('markCityStateDirty'),
    level: c.level,
    maxSafe: c.maxSafe,
  };
}

// ---------- zbior graczy (playerEverOwnedCityByOwner.add) ----------
const everCases = [
  { name: 'dodanie nowego wlasciciela', initial: [0], owner: 2 },
  { name: 'ponowne dodanie tego samego = bez zmian', initial: [0, 2], owner: 2 },
  { name: 'zbior pusty', initial: [], owner: 1 },
];

function runEver(c) {
  const set = new Set(c.initial);
  set.add(c.owner);
  return { semantic: true, has: set.has(c.owner), sorted: Array.from(set).sort((a, b) => a - b) };
}

const out = {
  garnizon: garnizonCases.map(c => ({ name: c.name, input: { city: c.city, units: c.units }, expected: runGarnizon(c) })),
  capture: captureCases.map(c => ({ name: c.name, input: { initial: c.initial, oldOwner: c.oldOwner, newOwner: c.newOwner, turn: c.turn }, expected: runCapture(c) })),
  ration: rationCases.map(c => ({ name: c.name, input: { owner: c.owner, autoWyzywienie: c.autoWyzywienie ?? null, level: c.level, maxSafe: c.maxSafe }, expected: runRation(c) })),
  ever: everCases.map(c => ({ name: c.name, input: { initial: c.initial, owner: c.owner }, expected: runEver(c) })),
};
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
