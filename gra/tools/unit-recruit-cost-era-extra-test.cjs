'use strict';
/**
 * unit-recruit-cost-era-extra-test.cjs -- R-WEB-ECONOMY-UNIT-RECRUIT-COST-ERA-EXTRA-MULT-Q1
 * (test na PRAWDZIWYCH funkcjach production.ts, esbuild).
 *
 * Decyzja wlasciciela 2026-11-19: koszt REKRUTACJI jednostki w Pieniadzu x2 dla epoki Braz
 * i x4 dla epoki Zelazo (DODATKOWO do istniejacej skali epoki Kamien x1/Braz x2/Zelazo x4).
 * Efektywna skala rekrutacji wzgledem bazy units.json: Kamien x1 / Braz x4 / Zelazo x16.
 * Kolejnosc: baza x epoka x dodatkowy -> ulgi cywilizacji -> tempo 'Koszty jednostek' (niski x1 /
 * normalny x2 / wysoki x4) -> BEZ mnoznika trudnosci (usunietego dla jednostek, DODATEK 1).
 *
 * Sprawdza: tabela oczekiwana (Wojownik, Wloczni k, Procarz, Rydwan konny, Falanga, Hastati,
 * Konnica) x pace niski/normalny/wysoki x owner gracz/AI x trudnosc easy/normal/hard;
 * itemCost (loot bojowy) pozostaje na dawnej wartosci; unitPurchaseCost == unitProductionItem;
 * mutanty (Braz 2->1, Zelazo 4->2, ponowne naliczanie trudnosci) MUSZA czerwienic.
 *
 *   node tools/unit-recruit-cost-era-extra-test.cjs   # exit 0 = zielono i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const GAME_DIR = path.resolve(GRA_ROOT, 'src', 'game');
const PROD = path.resolve(GAME_DIR, 'production.ts');
const JSON_PARAMS = path.resolve(GRA_ROOT, 'data', 'unit-recruit-cost-era-params.json');
const PROD_ORIG = fs.readFileSync(PROD, 'utf8');
const JSON_ORIG = fs.readFileSync(JSON_PARAMS, 'utf8');
const UNITS = require(path.resolve(GRA_ROOT, 'data', 'units.json'));

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail !== undefined ? '  -> ' + JSON.stringify(detail) : '')); }
}

async function loadBundle(mutants) {
  let prod = PROD_ORIG;
  let json = JSON_ORIG;
  for (const m of mutants || []) {
    const src = m.file === 'json' ? json : prod;
    if (!src.includes(m.from)) throw new Error('mutant anchor missing: ' + m.from.slice(0, 80));
    if (m.file === 'json') json = json.replace(m.from, m.to);
    else prod = prod.replace(m.from, m.to);
  }
  const plugin = {
    name: 'recruit-era-mutants',
    setup(build) {
      build.onLoad({ filter: /production\.ts$/ }, args =>
        args.path === PROD ? { contents: prod, loader: 'ts', resolveDir: path.dirname(args.path) } : undefined);
      build.onLoad({ filter: /unit-recruit-cost-era-params\.json$/ }, () =>
        ({ contents: json, loader: 'json' }));
    },
  };
  const entry = [
    "export { unitProductionItem, itemCost, unitPurchaseCost, unitRecruitBaseMoneyCost, unitRecruitEraExtraMultiplier } from './production';",
  ].join('\n');
  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: GAME_DIR, sourcefile: path.resolve(GAME_DIR, '.recruit-era-extra-entry.ts'), loader: 'ts' },
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

// Oczekiwane (spec): raw Pieniadz (koszt) x epoka(Kamien1/Braz2/Zelazo4) x dodatkowy(1/2/4) x pace(1/2/4).
const EXPECTED = [
  // nazwa,           raw, epoka, niski, normalny, wysoki
  ['Wojownik',        5,  'Kamień', 5,   10,  20],
  ['Włócznik',        8,  'Brąz',   32,  64,  128],
  ['Procarz',         4,  'Brąz',   16,  32,  64],
  ['Rydwan konny',   14,  'Brąz',   56,  112, 224],
  ['Falanga',         9,  'Żelazo', 144, 288, 576],
  ['Hastati',         9,  'Żelazo', 144, 288, 576],
  ['Konnica',        11,  'Żelazo', 176, 352, 704],
];
const PACES = [['niski', 0], ['normalny', 1], ['wysoki', 2]];
const DIFFS = ['easy', 'normal', 'hard'];
const OWNERS = [0, 1];

function runMatrix(api, label, quiet) {
  const chk = (...a) => { if (!quiet) check(...a); };
  const data = { buildings: [], units: UNITS };
  let mism = 0;
  for (const [name, raw, epoka, ...vals] of EXPECTED) {
    const u = UNITS.find(x => x.Jednostka === name);
    if (!u) { check(label + ' jednostka ' + name + ' w units.json', false); continue; }
    if (u.Epoka !== epoka) check(label + ' epoka ' + name + ' zgodna z testem', false, { jest: u.Epoka });
    if (Number(u['Pieniądz (koszt)']) !== raw) check(label + ' koszt bazowy ' + name, false, { jest: u['Pieniądz (koszt)'] });
    for (let p = 0; p < PACES.length; p++) {
      for (const d of DIFFS) {
        for (const o of OWNERS) {
          const got = api.unitProductionItem(name, data, undefined, PACES[p][0], o, d);
          const koszt = got ? got.koszt : null;
          if (koszt !== vals[p]) {
            mism++;
            if (mism <= 6) chk(label + ' ' + name + ' pace=' + PACES[p][0] + ' owner=' + o + ' diff=' + d, false, { got: koszt, want: vals[p] });
          }
          const purchase = api.unitPurchaseCost(u, undefined, PACES[p][0], o, d);
          if (purchase !== vals[p]) {
            mism++;
            if (mism <= 6) chk(label + ' purchase ' + name + ' pace=' + PACES[p][0] + ' diff=' + d, false, { got: purchase, want: vals[p] });
          }
        }
      }
    }
  }
  chk(label + ' tabela oczekiwana (7 jednostek x 3 pace x 3 trudnosci x 2 wlasciciele x 2 sciezki)', mism === 0, { mism });
  return mism;
}

(async () => {
  console.log('== unit-recruit-cost-era-extra-test (R-WEB-ECONOMY-UNIT-RECRUIT-COST-ERA-EXTRA-MULT-Q1) ==');
  const api = await loadBundle([]);

  check('mnoznik dodatkowy: Kamien x1', api.unitRecruitEraExtraMultiplier('Kamień') === 1);
  check('mnoznik dodatkowy: Brąz x2', api.unitRecruitEraExtraMultiplier('Brąz') === 2);
  check('mnoznik dodatkowy: Żelazo x4', api.unitRecruitEraExtraMultiplier('Żelazo') === 4);

  runMatrix(api, 'OK');

  // Loot bojowy (itemCost) zachowuje dawna wartosc: Falanga Zelazo = raw 9 x 4 = 36 (nie 144).
  const falanga = UNITS.find(x => x.Jednostka === 'Falanga');
  check('itemCost(jednostka) bez zmian (loot): Falanga = 36',
    api.itemCost('jednostka', 'Falanga', { buildings: [], units: UNITS }, 1) === 36);
  check('unitRecruitBaseMoneyCost(Falanga) = 144', api.unitRecruitBaseMoneyCost(falanga, { buildings: [], units: UNITS }) === 144);

  // Mutanty: musza czerwienic (wykrycie).
  const mutA = await loadBundle([{ file: 'json', from: '"braz": 2', to: '"braz": 1' }]);
  const mutB = await loadBundle([{ file: 'json', from: '"zelazo": 4', to: '"zelazo": 2' }]);
  const mutC = await loadBundle([{
    file: 'prod',
    from: 'return Math.max(1, Math.round(afterPace));',
    to: 'return applyDifficultyCostMultiplier(afterPace, ownerId, difficulty);',
  }]);
  const mA = runMatrix(mutA, 'MUT-BRAZ1', true);
  const mB = runMatrix(mutB, 'MUT-ZELAZO2', true);
  const mC = runMatrix(mutC, 'MUT-TRUDNOSC', true);
  check('mutant Braz 2->1 wykryty', mA > 0, { mA });
  check('mutant Zelazo 4->2 wykryty', mB > 0, { mB });
  check('mutant ponowne naliczanie trudnosci wykryte', mC > 0, { mC });

  console.log('WYNIK: ' + pass + ' ok, ' + fail + ' FAIL');
  process.exit(fail === 0 ? 0 : 1);
})().catch(err => { console.error(err); process.exit(1); });
