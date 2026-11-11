// R-RUSTPORT-P6-SIEGE-TRANSFER-Q1 (SIEGE-SURRENDER Q2): generator wektorow galezi Transfer.
//
// Zrodla (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, pliki tylko do odczytu, poza repo):
//   * gra/src/main.ts: besiegerOwnerForCity, resolveSiegeSurrender (galaz newOwner, do enterCityAfterSurrender);
//   * gra/src/units/setup.ts: hexDistance;
//   * gra/src/game/display-names.ts: clearCityStateFlagOnCapture (wykonywane realnie, nie atrapa).
// Wycinki funkcji sa wykonywane w `with` na Proxy (jak w p6_siege_surrender_gen.mjs). Kazde wywolanie identyfikatora
// spoza zestawu `vars`/wycinkow jest zapisywane w `calls` i zwraca undefined - bez cichej atrapy logiki weba.
// UWAGA (zarzut Evaluatora): `applyCapturePopulationLoss` (i pozostale wolania z tabeli TRANSFER_EFFECTS o statusie
// Missing) NIE sa wykonywane - atrapa Proxy zwraca undefined i tylko zapisuje wolanie w `calls`. Oczekiwana populacja
// w wektorach = max(1,pop) BEZ utraty obywatela; zgodnosc z webem tej populacji zachodzi tylko przy zalozeniu, ze
// applyCapturePopulationLoss = no-op. Naglowek "stan = stan z pinu" dotyczy stanu po wykonanych wycinkach, nie
// po wszystkich wolaniach weba.
// Sentinel `Stop` przerywa resolveSiegeSurrender w miejscu enterCityAfterSurrender (po splice obroncow i population),
// czyli dokladnie na zakresie galezi Transfer zaimplementowanym w src/domain/siege_transfer.rs.
//
// Uzycie (trzy pliki wejsciowe spoza repo, wynik na stdout):
//   node tests/p6_siege_transfer_gen.mjs <main.ts@pin> <units/setup.ts@pin> <display-names.ts@pin> \
//     > tests/p6_siege_transfer_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const [mainPath, setupPath, displayPath] = process.argv.slice(2);
if (!mainPath || !setupPath || !displayPath) throw new Error('uzycie: gen.mjs <main.ts> <units/setup.ts> <display-names.ts>');
const mainLines = readFileSync(mainPath, 'utf8').split('\n');
const setupLines = readFileSync(setupPath, 'utf8').split('\n');
const displayLines = readFileSync(displayPath, 'utf8').split('\n');

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
  resolveSiegeSurrender: extractFn(mainLines, 'resolveSiegeSurrender'),
  clearCityStateFlagOnCapture: extractFn(displayLines, 'clearCityStateFlagOnCapture'),
};

class Stop extends Error {}
const GLOBALS = new Set(['Math', 'Number', 'Object', 'Array', 'JSON', 'Map', 'Set', 'String', 'Boolean',
  'console', 'undefined', 'NaN', 'Infinity', 'Error', 'Symbol']);

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
const POPS = [0, 0.4, 1, 2.7, 12, NaN];
const enc = v => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : v === undefined ? null : v);
const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
const flag = (rnd) => pick(rnd, [true, false, undefined]);

function makeEnemy(rnd, forced) {
  const table = {};
  for (const a of OWNERS_ALL) for (const b of OWNERS_ALL) table[`${a}-${b}`] = rnd() < 0.5;
  if (forced) table[`${forced[0]}-${forced[1]}`] = true;
  return { enemy: (a, b) => table[`${a}-${b}`] };
}

// Uruchomienie galezi Transfer: zwraca stan miasta/jednostek po przerwaniu oraz zalogowane wolania pinu.
function runTransfer(scn) {
  const calls = [];
  const city = {
    id: 'c', name: 'C', q: scn.cityQ, r: scn.cityR, ownerId: scn.cityOwner, population: scn.pop,
    startCityState: scn.startCityState, foundedByOwner: scn.foundedByOwner, rebelState: scn.rebelState,
  };
  const units = scn.units.map(u => ({ ...u }));
  const siegeBesiegerByCity = new Map([['c', scn.besieger]]);
  const vars = {
    cities: [city], units, siegeBesiegerByCity,
    siegeTurnByCity: new Map(), siegeAiStateByKey: new Map(), cityProd: new Map(),
    areEnemyOwners: (a, b) => { calls.push('areEnemyOwners'); return scn.enemy(a, b); },
    wasIndependentCityStateBeforeCapture: () => { calls.push('wasIndependentCityStateBeforeCapture'); return scn.wasIndependent; },
    enterCityAfterSurrender: () => { calls.push('enterCityAfterSurrender'); throw new Stop(); },
    showHintMessage: () => { calls.push('showHintMessage'); },
  };
  const fns = load(['hexDistance', 'besiegerOwnerForCity', 'clearCityStateFlagOnCapture', 'resolveSiegeSurrender'], vars, calls);
  let branch = 'none';
  try {
    fns.resolveSiegeSurrender('c');
  } catch (e) {
    if (!(e instanceof Stop)) throw e;
    branch = 'transfer';
  }
  return { branch, city, units, calls };
}

const rTr = makeRnd(0x51e6f001);
const transfer = [];
for (let i = 0; i < 160; i++) {
  const cityOwner = pick(rTr, OWNERS);
  let besieger = pick(rTr, OWNERS_ALL);
  if (besieger === cityOwner) besieger = (cityOwner + 1) % 4;
  const { enemy } = makeEnemy(rTr, [besieger, cityOwner]);
  const cityQ = Math.floor(rTr() * 3);
  const cityR = Math.floor(rTr() * 3);
  const n = Math.floor(rTr() * 7);
  const units = [];
  for (let k = 0; k < n; k++) {
    const onCity = rTr() < 0.45;
    units.push({
      id: `u${i}_${k}`,
      ownerId: pick(rTr, OWNERS),
      q: onCity ? cityQ : Math.floor(rTr() * 3),
      r: onCity ? cityR : Math.floor(rTr() * 3),
    });
  }
  const scn = {
    cityOwner, besieger, cityQ, cityR, units,
    pop: pick(rTr, POPS),
    startCityState: flag(rTr),
    foundedByOwner: flag(rTr),
    rebelState: flag(rTr),
    wasIndependent: rTr() < 0.5,
    enemy,
  };
  const r = runTransfer(scn);
  if (r.branch !== 'transfer') throw new Error(`transfer ${i}: oczekiwano galezi transfer, jest ${r.branch}`);
  transfer.push({
    input: {
      cityOwner, besieger, cityQ, cityR,
      pop: enc(scn.pop),
      startCityState: enc(scn.startCityState),
      foundedByOwner: enc(scn.foundedByOwner),
      rebelState: enc(scn.rebelState),
      wasIndependent: scn.wasIndependent,
      units: scn.units,
      enemyPairs: OWNERS_ALL.flatMap(a => OWNERS_ALL.map(b => [a, b, enemy(a, b)])),
    },
    expect: {
      branch: r.branch,
      ownerId: r.city.ownerId,
      population: enc(r.city.population),
      startCityState: enc(r.city.startCityState),
      foundedByOwner: enc(r.city.foundedByOwner),
      rebelState: enc(r.city.rebelState),
      unitIdsAfter: r.units.map(u => u.id),
      calls: r.calls,
    },
  });
}

const out = {
  source: 'gra/src/main.ts (resolveSiegeSurrender, besiegerOwnerForCity), gra/src/units/setup.ts (hexDistance), '
    + 'gra/src/game/display-names.ts (clearCityStateFlagOnCapture) @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75; '
    + 'wykonanie wycinkow, zakres do enterCityAfterSurrender (Stop)',
  transfer,
};
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
