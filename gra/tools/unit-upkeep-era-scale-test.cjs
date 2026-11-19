'use strict';
/**
 * unit-upkeep-era-scale-test.cjs -- R-WEB-ECONOMY-UNIT-UPKEEP-ERA-SCALE-Q1 (test na PRAWDZIWYCH funkcjach, esbuild).
 *
 * Utrzymanie JEDNOSTEK (Pieniadz/ture, surowce/ture, zywnosc/ture) skalowane epoka JEDNOSTKI:
 * Kamien x1 / Braz x2 / Zelazo x4 (parametr jednostkiUtrzymanieMnoznikEpoki, decyzja wlasciciela 2026-11-19).
 *
 * Sprawdza: Kamien/Braz/Zelazo x (pieniadz, surowiec, zywnosc) przy flagach ON i OFF; flaga OFF = wartosci legacy;
 * karta zywnosci ON = wartosc silnika; mutanty kopii zrodel (Braz x2 -> x1, Zelazo x4 -> x2) musza czerwienic.
 *
 *   node tools/unit-upkeep-era-scale-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const GAME_DIR = path.resolve(GRA_ROOT, 'src', 'game');
const FILES = {
  rebalance: path.resolve(GAME_DIR, 'econ-era-rebalance.ts'),
  upkeep: path.resolve(GAME_DIR, 'economy-upkeep.ts'),
};
const ORIG = {};
for (const k of Object.keys(FILES)) ORIG[k] = fs.readFileSync(FILES[k], 'utf8');

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail !== undefined ? '  -> ' + JSON.stringify(detail) : '')); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function loadBundle(mutants) {
  const mutated = {};
  for (const k of Object.keys(FILES)) mutated[k] = ORIG[k];
  for (const m of mutants || []) {
    if (!mutated[m.file].includes(m.from)) throw new Error('mutant anchor missing in ' + m.file + ': ' + m.from.slice(0, 70));
    mutated[m.file] = mutated[m.file].replace(m.from, m.to);
  }
  const byPath = new Map(Object.keys(FILES).map(k => [FILES[k], mutated[k]]));
  const plugin = {
    name: 'mutant-overrides',
    setup(build) {
      build.onLoad({ filter: /\.ts$/ }, args => {
        const contents = byPath.get(args.path);
        if (contents === undefined) return undefined;
        return { contents, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  };
  const entry = [
    "export * from './econ-era-rebalance';",
    "export { unitResourceUpkeep, unitUpkeep, buildUnitUpkeepTable, buildUnitFoodTable, unitFoodPerTurn, unitFoodCardValue, DEFAULT_UPKEEP_PARAMS } from './economy-upkeep';",
  ].join('\n');
  const entryPath = path.resolve(GAME_DIR, '.unit-upkeep-era-scale-entry.ts');
  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: GAME_DIR, sourcefile: entryPath, loader: 'ts' },
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    plugins: [plugin],
    logLevel: 'silent',
  });
  const code = result.outputFiles[0].text;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', code)(mod, mod.exports, require);
  return mod.exports;
}

// Jednostki testowe: ten sam wzorzec co units.json (Epoka, utrzymanie, zywnosc).
const EPOCHS = [['Kamień', 'Kamien'], ['Brąz', 'Braz'], ['Żelazo', 'Zelazo']];
function rows() {
  return EPOCHS.map(([epoka, tag]) => ({
    Jednostka: 'test_' + tag,
    Epoka: epoka,
    Kategoria: 'procarz',
    'Utrzymanie (Pieniadz/ture)': 1,
    'Utrzymanie surowiec': 'Drewno',
    'Utrzymanie surowiec (ilość)': 3,
    'żywność/turę': 1,
  }));
}

function measure(M) {
  const data = rows();
  const goldTbl = M.buildUnitUpkeepTable(data);
  const foodTbl = M.buildUnitFoodTable(data);
  const pieniadz = data.map(r => M.unitUpkeep({ typeId: r.Jednostka, category: 'procarz' }, goldTbl, 0));
  const surowiec = data.map(r => M.unitResourceUpkeep(r).drewno ?? 0);
  const zywnosc = data.map(r => M.unitFoodPerTurn({ typeId: r.Jednostka, camping: false, onOwnTerritory: true }, M.DEFAULT_UPKEEP_PARAMS, foodTbl));
  const card = EPOCHS.map(([epoka]) => M.unitFoodCardValue({ 'żywność/turę': 1, Epoka: epoka }));
  return { pieniadz, surowiec, zywnosc, card };
}

(async () => {
  console.log('== unit-upkeep-era-scale-test (Kamien/Braz/Zelazo) ==');
  const base = await loadBundle([]);
  const params = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'econ-era-rebalance-params.json'), 'utf8'));
  check('dane: jednostkiUtrzymanieMnoznikEpoki = 1/2/4',
    eq(params.jednostkiUtrzymanieMnoznikEpoki, { kamien: 1, braz: 2, zelazo: 4 }), params.jednostkiUtrzymanieMnoznikEpoki);

  // Flaga OFF = wartosci legacy (ta sama skala x1/x2/x4 juz obowiazywala przed zmiana).
  base.setEraRebalanceEnabledForTest(false);
  const off = measure(base);
  check('OFF pieniadz 4/8/16 (1 x epoka x R_STAWKI 4)', eq(off.pieniadz, [4, 8, 16]), off.pieniadz);
  check('OFF surowiec 3/6/12 (3 x epoka)', eq(off.surowiec, [3, 6, 12]), off.surowiec);
  check('OFF zywnosc 4/8/16 (1 x epoka x R_STAWKI 4)', eq(off.zywnosc, [4, 8, 16]), off.zywnosc);

  // Flaga ON = to samo (jedno zrodlo: unitUpkeepScaleByEpoch).
  base.setEraRebalanceEnabledForTest(true);
  const on = measure(base);
  check('ON pieniadz = 4/8/16', eq(on.pieniadz, [4, 8, 16]), on.pieniadz);
  check('ON surowiec = 3/6/12', eq(on.surowiec, [3, 6, 12]), on.surowiec);
  check('ON zywnosc = 4/8/16 (nie x3/epoke: 4/12/36)', eq(on.zywnosc, [4, 8, 16]), on.zywnosc);
  check('ON karta zywnosci = wartosc silnika 4/8/16', eq(on.card, [4, 8, 16]), on.card);
  check('ON karta == silnik (zywnosc)', eq(on.card, on.zywnosc), { card: on.card, silnik: on.zywnosc });
  check('OFF karta zywnosci == silnik 4/8/16 (bez rozjazdu karta-silnik przy rollbacku)', eq(off.card, off.zywnosc), { card: off.card, silnik: off.zywnosc });
  check('ON == OFF dla utrzymania jednostek', eq(on.pieniadz, off.pieniadz) && eq(on.surowiec, off.surowiec) && eq(on.zywnosc, off.zywnosc));

  // Brzegi: zero i zle dane.
  check('scale: 0 -> 0, NaN -> 0, ujemne -> 0 (ON)',
    base.unitUpkeepScaleByEpoch(0, 'Żelazo') === 0 && base.unitUpkeepScaleByEpoch(NaN, 'Brąz') === 0 && base.unitUpkeepScaleByEpoch(-2, 'Brąz') === 0);
  check('scale: brak epoki = Kamien x1', base.unitUpkeepScaleByEpoch(5, undefined) === 5);
  base.setEraRebalanceEnabledForTest(null);

  // Mutanty kopii zrodel: kazdy musi zmienic wynik (czerwony).
  const MUTANTS = [
    { id: 'M1 Braz x2 -> x1 (mnoznik utrzymania)', file: 'rebalance',
      from: 'const fromData = ord >= 3 ? m?.zelazo : ord === 2 ? m?.braz : m?.kamien;',
      to: 'const fromData = ord >= 3 ? m?.zelazo : ord === 2 ? m?.kamien : m?.kamien;' },
    { id: 'M2 Zelazo x4 -> x2 (mnoznik utrzymania)', file: 'rebalance',
      from: 'const fromData = ord >= 3 ? m?.zelazo : ord === 2 ? m?.braz : m?.kamien;',
      to: 'const fromData = ord >= 3 ? m?.braz : ord === 2 ? m?.braz : m?.kamien;' },
    { id: 'M3 zywnosc jednostki znow x3/epoke (rebalancedUnitFoodBase)', file: 'rebalance',
      from: '  return unitUpkeepScaleByEpoch(direct, epoch);',
      to: '  return Math.max(1, Math.round(direct * Math.pow(3, eraOrdinal(epoch) - 1)));' },
  ];
  console.log('\n== mutanty ==');
  for (const mt of MUTANTS) {
    const mm = await loadBundle([{ file: mt.file, from: mt.from, to: mt.to }]);
    mm.setEraRebalanceEnabledForTest(true);
    const mOn = measure(mm);
    mm.setEraRebalanceEnabledForTest(null);
    const detected = !eq(mOn.pieniadz, [4, 8, 16]) || !eq(mOn.surowiec, [3, 6, 12]) || !eq(mOn.zywnosc, [4, 8, 16]);
    check(mt.id + ' wykryty (czerwony)', detected, mOn);
  }

  console.log('\nWYNIK: ' + pass + ' ok, ' + fail + ' FAIL');
  process.exit(fail === 0 ? 0 : 1);
})().catch(err => { console.error(err); process.exit(1); });
