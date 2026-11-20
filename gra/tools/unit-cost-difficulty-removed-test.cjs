'use strict';
/**
 * unit-cost-difficulty-removed-test.cjs -- R-WEB-ECONOMY-UNIT-RECRUIT-COST-ERA-EXTRA-MULT-Q1, DODATEK 1
 * (decyzja wlasciciela 2026-11-19): poziom trudnosci (Latwa/Normalna/Trudna) NIE wplywa na koszt
 * JEDNOSTEK -- ani rekrutacji w Pieniadzu (production.ts unitMoneyCost), ani utrzymania jednostek
 * (econ-params.json: globalne.utrzymanie_jednostka_standard, ekonomia_miasta.zywnosc_jednostka_ruch /
 * zywnosc_jednostka_oboz -> loadUpkeepParams). Skale kosztu jednostek steruje 'Koszty jednostek'.
 *
 * Kontrola (nie usunieto za duzo): koszty BUDYNKOW i utrzymanie budynkow nadal zaleza od trudnosci.
 *
 * Sprawdza: rekrutacja (unitProductionItem/unitPurchaseCost) i utrzymanie jednostek identyczne dla
 * easy/normal/hard i dla gracza (owner 0) / AI (owner 1) przy tym samym pace; kontrola budynkow
 * rozni sie; mutanty (hard utrzymanie 2 w econ-params, ponowne naliczenie trudnosci) MUSZA czerwienic.
 *
 *   node tools/unit-cost-difficulty-removed-test.cjs   # exit 0 = zielono i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const GAME_DIR = path.resolve(GRA_ROOT, 'src', 'game');
const PROD = path.resolve(GAME_DIR, 'production.ts');
const PROD_ORIG = fs.readFileSync(PROD, 'utf8');
const UNITS = require(path.resolve(GRA_ROOT, 'data', 'units.json'));
const ECON_RAW = require(path.resolve(GRA_ROOT, 'data', 'econ-params.json'));

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail !== undefined ? '  -> ' + JSON.stringify(detail) : '')); }
}

async function loadBundle(prodOverride) {
  const prod = prodOverride || PROD_ORIG;
  const plugin = {
    name: 'difficulty-removed-mutants',
    setup(build) {
      build.onLoad({ filter: /production\.ts$/ }, args =>
        args.path === PROD ? { contents: prod, loader: 'ts', resolveDir: path.dirname(args.path) } : undefined);
    },
  };
  const entry = [
    "export { unitProductionItem, unitPurchaseCost, buildingWorkCost } from './production';",
    "export { loadUpkeepParams } from './economy-upkeep';",
    "export { getCostMultiplierForOwner } from './difficulty-cost';",
  ].join('\n');
  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: GAME_DIR, sourcefile: path.resolve(GAME_DIR, '.difficulty-removed-entry.ts'), loader: 'ts' },
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    plugins: [plugin],
    logLevel: 'silent',
  });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', result.outputFiles[0].text)(mod, mod.exports, require);
  return mod.exports;
}

const DIFFS = ['easy', 'normal', 'hard'];
const OWNERS = [0, 1];
const UNIT_KEYS = ['jednostkaUtrzymanieStd', 'zywnoscJednostkaRuch', 'zywnoscJednostkaOboz'];
const SAMPLE_UNITS = ['Wojownik', 'Włócznik', 'Procarz', 'Rydwan konny', 'Falanga', 'Hastati', 'Konnica'];
const PACES = ['niski', 'normalny', 'wysoki'];

/** Zwraca liczbe naruszen: roznice kosztu/utrzymania jednostek miedzy poziomami trudnosci. */
function unitDifferences(api, raw) {
  const data = { buildings: [], units: UNITS };
  let diffs = 0;
  for (const name of SAMPLE_UNITS) {
    const u = UNITS.find(x => x.Jednostka === name);
    for (const pace of PACES) {
      const ref = api.unitProductionItem(name, data, undefined, pace, 1, 'normal').koszt;
      for (const d of DIFFS) for (const o of OWNERS) {
        if (api.unitProductionItem(name, data, undefined, pace, o, d).koszt !== ref) diffs++;
        if (api.unitPurchaseCost(u, undefined, pace, o, d) !== ref) diffs++;
      }
    }
  }
  const up = {};
  for (const d of DIFFS) up[d] = api.loadUpkeepParams(raw, d);
  for (const k of UNIT_KEYS) {
    for (const d of DIFFS) if (up[d][k] !== up.normal[k]) diffs++;
  }
  return diffs;
}

(async () => {
  console.log('== unit-cost-difficulty-removed-test (DODATEK 1, R-WEB-ECONOMY-UNIT-RECRUIT-COST-ERA-EXTRA-MULT-Q1) ==');
  const api = await loadBundle(null);

  // Jednostki: rekrutacja i utrzymanie identyczne dla trudnosci i wlascicieli.
  const n = unitDifferences(api, ECON_RAW);
  check('rekrutacja + utrzymanie jednostek identyczne dla easy/normal/hard i gracz/AI', n === 0, { roznice: n });

  // Wartosci utrzymania jednostek = dzisiejsze wartosci NORMALNA.
  const up = {};
  for (const d of DIFFS) up[d] = api.loadUpkeepParams(ECON_RAW, d);
  check('utrzymanie standard = 1 (wszystkie poziomy)', DIFFS.every(d => up[d].jednostkaUtrzymanieStd === 1));
  check('zywnosc ruch = 1 (wszystkie poziomy)', DIFFS.every(d => up[d].zywnoscJednostkaRuch === 1));
  check('zywnosc oboz = 0.5 (wszystkie poziomy)', DIFFS.every(d => up[d].zywnoscJednostkaOboz === 0.5));

  // Kontrola: budynki i ich utrzymanie NADAL zaleza od trudnosci.
  check('kontrola: utrzymanie budynku hard != normal (nie usunieto za duzo)',
    api.loadUpkeepParams(ECON_RAW, 'hard').budynekUtrzymanieFlat !== api.loadUpkeepParams(ECON_RAW, 'normal').budynekUtrzymanieFlat);
  check('kontrola: mnoznik kosztow budynkow gracz hard = 2',
    api.getCostMultiplierForOwner(0, 'hard') === 2);
  const data = { buildings: [], units: UNITS };
  check('kontrola: buildingWorkCost hard (gracz) != normal',
    api.buildingWorkCost(100, undefined, undefined, 0, 'hard') !== api.buildingWorkCost(100, undefined, undefined, 0, 'normal'));
  void data;

  // Mutanty: musza byc wykryte.
  const mutRaw = JSON.parse(JSON.stringify(ECON_RAW));
  mutRaw.globalne.utrzymanie_jednostka_standard.hard = 2;
  const mU = unitDifferences(api, mutRaw);
  check('mutant: utrzymanie standard hard=2 wykryty', mU > 0, { mU });

  const mutProdSrc = PROD_ORIG.replace(
    'return Math.max(1, Math.round(afterPace));',
    'return applyDifficultyCostMultiplier(afterPace, ownerId, difficulty);',
  );
  if (mutProdSrc === PROD_ORIG) throw new Error('mutant anchor missing in production.ts');
  const apiMut = await loadBundle(mutProdSrc);
  const mR = unitDifferences(apiMut, ECON_RAW);
  check('mutant: ponowne naliczanie trudnosci w rekrutacji wykryte', mR > 0, { mR });

  console.log('WYNIK: ' + pass + ' ok, ' + fail + ' FAIL');
  process.exit(fail === 0 ? 0 : 1);
})().catch(err => { console.error(err); process.exit(1); });
