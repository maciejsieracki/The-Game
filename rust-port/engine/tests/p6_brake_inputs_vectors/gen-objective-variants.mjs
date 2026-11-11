// R-RUSTPORT-P6-BRAKE-VECTORS-Q1: wektory wariantow computeObjectivePower
// (tryb flat_count, niestandardowe wspolczynniki, militaryKeys z skladnikiem "zdobycze", polowki dla Math.round).
//
// Zrodlo: WYKONANIE gra/src/game/power-objective.ts z PINU (07d2fbd72f758705f8e1d59cc4968027ffbafe75).
// Modul importuje wylacznie ../../data/power-params.json, wiec do wykonania wystarcza dwa pliki z pinu
// (kopia poza repo). Wszystkie wejscia (tryb, wspolczynniki, militaryKeys, liczniki) sa jawnymi argumentami
// computeObjectivePower z pinu - nie sa wpisywane do wyniku recznie.
//
// Uzycie (WEB_ROOT = katalog poza repo z gra/src/game/power-objective.ts i gra/data/power-params.json; Node 22):
//   node rust-port/engine/tests/p6_brake_inputs_vectors/gen-objective-variants.mjs <WEB_ROOT> <PIN_SHA> \
//     > rust-port/engine/tests/p6_brake_inputs_vectors/objective-variants.json
// TS_JS (opcjonalnie) = sciezka do typescript.js (domyslnie /opt/node22/lib/node_modules/typescript/lib/typescript.js).

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [WEB_ROOT, PIN] = process.argv.slice(2);
if (!WEB_ROOT || !PIN) throw new Error('uzycie: gen-objective-variants.mjs <WEB_ROOT> <PIN_SHA>');
const req = createRequire(import.meta.url);
const ts = req(process.env.TS_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js');

const modCache = new Map();
function loadModule(file) {
  if (modCache.has(file)) return modCache.get(file).exports;
  const out = ts.transpileModule(readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  modCache.set(file, mod);
  const r = spec => {
    if (!spec.startsWith('.')) throw new Error(`nieobslugiwany import '${spec}' w ${file}`);
    const target = path.resolve(path.dirname(file), spec);
    if (spec.endsWith('.json')) return JSON.parse(readFileSync(target, 'utf8'));
    return loadModule(`${target}.ts`);
  };
  new Function('require', 'module', 'exports', out)(r, mod, mod.exports);
  return mod.exports;
}

const powerObj = loadModule(path.join(WEB_ROOT, 'gra', 'src', 'game', 'power-objective.ts'));

const COEFF_KEYS = ['jednostkaWojskowa', 'wygranaBitwa', 'ludek', 'rekrutEkwJednostki', 'miasto', 'heksTerytorium',
  'budynki', 'techZbadane', 'ulepszenieTerenu', 'kulturaImperium', 'religiaJednosc'];
const MIL_ALL = ['armia', 'bitwy', 'ludki', 'rekruci', 'miasta', 'terytorium', 'infra', 'tech', 'ulepszenia',
  'kultura', 'religia', 'zdobycze'];
const COEFF_VALUES = [0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 5, 7.5];
const HALF_VALUES = [0.5, 1, 1.5, 2.5];

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261112);
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = arr => arr[Math.floor(rnd() * arr.length)];

const out = { pin: PIN, generator: 'rust-port/engine/tests/p6_brake_inputs_vectors/gen-objective-variants.mjs', cases: [] };
const OPTIONAL = [['bitwyPktSum', 0, 900], ['kulturaImperium', 0, 5000], ['miastaJednoscReligii', 0, 25],
  ['zdobyczePower', 0, 3000]];

for (let i = 0; i < 160; i++) {
  const battleModel = rnd() < 0.5 ? 'flat_count' : 'enemy_m_sum';
  const customCoeff = rnd() < 0.6;
  const halfMode = rnd() < 0.3;
  const coeff = customCoeff
    ? Object.fromEntries(COEFF_KEYS.map(k => [k, pick(halfMode ? HALF_VALUES : COEFF_VALUES)]))
    : powerObj.loadPowerCoefficients();
  const military = rnd() < 0.25
    ? powerObj.loadMilitaryComponentKeys()
    : new Set(MIL_ALL.filter(() => rnd() < 0.3));

  const input = {
    ownerId: ri(0, 9),
    epoka: ri(1, 10),
    jednostki: rnd() < 0.3 ? ri(-8, 400) / 4 : ri(-8, 400),
    wygraneBitwy: ri(-3, 40),
    sumaLudkow: ri(0, 300),
    rekrutEkw: ri(0, 80),
    miasta: ri(0, 25),
    heksyTerytorium: ri(0, 600),
    budynki: ri(0, 200),
    techZbadane: ri(0, 80),
    ulepszeniaTerenu: ri(0, 150),
  };
  const recorded = { ...input };
  for (const [k, lo, hi] of OPTIONAL) {
    if (rnd() < 0.7) {
      input[k] = ri(lo, hi);
      recorded[k] = input[k];
    } else {
      recorded[k] = null; // pole nieobecne w wejsciu (web `?? 0`)
    }
  }

  const r = powerObj.computeObjectivePower(input, coeff, battleModel, military);
  out.cases.push({
    battleModel,
    coeff: Object.fromEntries(COEFF_KEYS.map(k => [k, coeff[k]])),
    militaryKeys: [...military].sort(),
    input: recorded,
    power: r.power,
    powerBase: r.powerBase,
    components: r.components.map(x => ({ key: x.key, rawCount: x.rawCount, coefficient: x.coefficient,
      points: x.points, military: x.military })),
  });
}

process.stdout.write(JSON.stringify(out, null, 1) + '\n');
