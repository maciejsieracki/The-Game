'use strict';
/**
 * unit-upkeep-era-scale-test.cjs -- R-WEB-ECONOMY-UNIT-UPKEEP-ERA-SCALE-Q1 (test na PRAWDZIWYCH funkcjach, esbuild).
 *
 * Utrzymanie JEDNOSTEK wg epoki JEDNOSTKI. Decyzja wlasciciela 2026-11-19 (Dodatek 1, R-WEB-ECONOMY-UNIT-UPKEEP-EXTRA-MULT-AND-FOOD-TAX-RATE-Q1):
 *  - fala 875 (zywnosc x1/x2/x4) ANULOWANA; zywnosc jednostek = geometria x4 na epoke (jednostkiZywnoscMnoznikNaEpoke=4):
 *    Kamien x1 / Braz x4 / Zelazo x16 przed R_STAWKI (x4) -> 4/16/64 przy fladze ON;
 *  - pieniadz i surowce = legacy scaleCostByEpoch x1/x2/x4 (bez zmian).
 *
 * Sprawdza: Kamien/Braz/Zelazo x (pieniadz, surowiec, zywnosc) przy flagach ON i OFF; flaga OFF = wartosci legacy;
 * karta zywnosci == silnik przy ON i OFF; mutanty kopii zrodel musza czerwienic.
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
  check('dane: jednostkiZywnoscMnoznikNaEpoke = 4',
    params.jednostkiZywnoscMnoznikNaEpoke === 4, params.jednostkiZywnoscMnoznikNaEpoke);
  check('dane: brak starego pola jednostkiUtrzymanieMnoznikEpoki (fala 875 anulowana)',
    params.jednostkiUtrzymanieMnoznikEpoki === undefined);

  // Flaga OFF = wartosci legacy (scaleCostByEpoch x1/x2/x4; zywnosc x4 R_STAWKI).
  base.setEraRebalanceEnabledForTest(false);
  const off = measure(base);
  check('OFF pieniadz 4/8/16 (1 x epoka x R_STAWKI 4)', eq(off.pieniadz, [4, 8, 16]), off.pieniadz);
  check('OFF surowiec 3/6/12 (3 x epoka)', eq(off.surowiec, [3, 6, 12]), off.surowiec);
  check('OFF zywnosc 4/8/16 (legacy x1/x2/x4 x R_STAWKI 4)', eq(off.zywnosc, [4, 8, 16]), off.zywnosc);

  // Flaga ON: pieniadz i surowce bez zmian; zywnosc = geometria x4 na epoke (4/16/64).
  base.setEraRebalanceEnabledForTest(true);
  const on = measure(base);
  check('ON pieniadz = 4/8/16 (bez zmian)', eq(on.pieniadz, [4, 8, 16]), on.pieniadz);
  check('ON surowiec = 3/6/12 (bez zmian)', eq(on.surowiec, [3, 6, 12]), on.surowiec);
  check('ON zywnosc = 4/16/64 (x1/x4/x16 x R_STAWKI 4)', eq(on.zywnosc, [4, 16, 64]), on.zywnosc);
  check('ON karta zywnosci = wartosc silnika 4/16/64', eq(on.card, [4, 16, 64]), on.card);
  check('ON karta == silnik (zywnosc)', eq(on.card, on.zywnosc), { card: on.card, silnik: on.zywnosc });
  check('OFF karta zywnosci == silnik 4/8/16 (bez rozjazdu karta-silnik przy rollbacku)', eq(off.card, off.zywnosc), { card: off.card, silnik: off.zywnosc });
  check('ON == OFF dla pieniadza i surowcow utrzymania', eq(on.pieniadz, off.pieniadz) && eq(on.surowiec, off.surowiec));
  check('ON != OFF dla zywnosci jednostek (rebalans zywnosci aktywny)', !eq(on.zywnosc, off.zywnosc));

  // Brzegi: zero i zle dane (bazowa funkcja rebalansu zywnosci).
  check('food base: 0 -> 0, NaN -> 0, ujemne -> 0 (ON)',
    base.rebalancedUnitFoodBase(0, 'Żelazo') === 0 && base.rebalancedUnitFoodBase(NaN, 'Brąz') === 0 && base.rebalancedUnitFoodBase(-2, 'Brąz') === 0);
  check('food base: brak epoki = Kamien x1', base.rebalancedUnitFoodBase(5, undefined) === 5);
  check('food base: Zelazo 1 -> 16', base.rebalancedUnitFoodBase(1, 'Żelazo') === 16);
  base.setEraRebalanceEnabledForTest(null);

  // Mutanty kopii zrodel: kazdy musi zmienic wynik (czerwony).
  const MUTANTS = [
    { id: 'M1 zywnosc Braz x4 -> x2 (krok geometrii)', file: 'rebalance',
      from: '  const step = Number.isFinite(skala) && skala > 0 ? skala : 4;',
      to: '  const step = 2;' },
    { id: 'M2 zywnosc Zelazo x16 -> x4 (potega epoki ograniczona)', file: 'rebalance',
      from: '  return Math.max(1, Math.round(direct * Math.pow(step, eraOrdinal(epoch) - 1)));',
      to: '  return Math.max(1, Math.round(direct * Math.pow(step, Math.min(1, eraOrdinal(epoch) - 1))));' },
    { id: 'M3 karta zywnosci legacy zamiast faktycznej (ON)', file: 'upkeep',
      from: '  const base = unitFoodBaseByEpoch(direct, epoch);',
      to: '  const base = scaleCostByEpoch(direct, epoch);' },
    { id: 'M4 silnik zywnosci legacy przy ON (bramka rebalansu pominieta)', file: 'upkeep',
      from: '  return rebalanced !== null ? rebalanced : scaleCostByEpoch(direct, epoch);',
      to: '  return scaleCostByEpoch(direct, epoch);' },
    { id: 'M5 utrzymanie Pieniadz Braz x4 zamiast x2 (legacy skala)', file: 'upkeep',
      from: '    if (upkeep !== undefined) out[name] = scaleCostByEpoch(upkeep, epoch);',
      to: '    if (upkeep !== undefined) out[name] = scaleCostByEpoch(upkeep, epoch === "Brąz" ? "Żelazo" : epoch);' },
  ];
  console.log('\n== mutanty ==');
  for (const mt of MUTANTS) {
    const mm = await loadBundle([{ file: mt.file, from: mt.from, to: mt.to }]);
    mm.setEraRebalanceEnabledForTest(true);
    const mOn = measure(mm);
    mm.setEraRebalanceEnabledForTest(null);
    const detected = !eq(mOn.pieniadz, [4, 8, 16]) || !eq(mOn.surowiec, [3, 6, 12]) || !eq(mOn.zywnosc, [4, 16, 64]) || !eq(mOn.card, [4, 16, 64]);
    check(mt.id + ' wykryty (czerwony)', detected, mOn);
  }

  console.log('\nWYNIK: ' + pass + ' ok, ' + fail + ' FAIL');
  process.exit(fail === 0 ? 0 : 1);
})().catch(err => { console.error(err); process.exit(1); });
