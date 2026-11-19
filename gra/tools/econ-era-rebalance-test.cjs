'use strict';
/**
 * econ-era-rebalance-test.cjs -- R-WEB-ECONOMY-ERA-REBALANCE-FLAG-Q1 (test na PRAWDZIWYCH funkcjach, esbuild).
 *
 * Sprawdza rebalans epok ZA FLAGA (gra/src/game/econ-era-rebalance.ts + wpiecia w terrain-improvements.ts,
 * citizen-consumption-era.ts, economy-upkeep.ts):
 *  (E1) niezalezne od domyslnej flagi: hak ON/OFF jawny; hak setEraRebalanceEnabledForTest(null) wraca do wartosci z danych (odczytanej z pliku, nie zakodowanej);
 *  (E2) flaga OFF = wartosci jak dotad: Tartak 50/75/113, farma zywnosc 3/4/5, zywnosc jednostki 4/8/16
 *       (units Epoka 1/2/3, baza 1, x4 R_STAWKI), mnoznik racji m = 1/1,5/2;
 *  (E3) flaga ON = Tartak 50/50/50, farma 3/3/3, zywnosc jednostki 4/12/36, m = 1/2/4;
 *  (E4) ON w epokach 4-5: przychody ulepszen stale; zywnosc 4*3^(e-1) (108/324 dla epok 4/5);
 *       racje m(e) = 2^(e-1) (8/16);
 *  (E5) konwersja racji i zywnosci tylko przy ON: brak NaN, era < 1 / null -> 1;
 *  (E7) konwertery/utrzymanie surowcow poza rebalansem (ON == OFF); (E8) karta jednostki faktyczna przy ON;
 *  (E9) nazwy epok units.json -> 1/2/3;
 *  (E6) mutanty kopii zrodel (esbuild plugin, NIE git checkout) -- kazdy musi czerwienic test.
 *
 *   node tools/econ-era-rebalance-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const GAME_DIR = path.resolve(GRA_ROOT, 'src', 'game');
const FILES = {
  rebalance: path.resolve(GAME_DIR, 'econ-era-rebalance.ts'),
  terrain: path.resolve(GAME_DIR, 'terrain-improvements.ts'),
  citizen: path.resolve(GAME_DIR, 'citizen-consumption-era.ts'),
  upkeep: path.resolve(GAME_DIR, 'economy-upkeep.ts'),
  converters: path.resolve(GAME_DIR, 'converters.ts'),
  citizenUpkeep: path.resolve(GAME_DIR, 'citizen-resource-upkeep.ts'),
};
const ORIG = {};
for (const k of Object.keys(FILES)) ORIG[k] = fs.readFileSync(FILES[k], 'utf8');

/** Buduje moduly z opcjonalnymi mutantami: mutants = [{file:'rebalance'|..., from, to}]. */
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
    "export { improvementYieldForEra, resourceProductionAmountForEra } from './terrain-improvements';",
    "export { citizenConsumptionEraMultiplier } from './citizen-consumption-era';",
    "export { buildUnitFoodTable, unitFoodPerTurn, unitFoodCardValue } from './economy-upkeep';",
    "export { converterThroughputForEra } from './converters';",
    "export { citizenUpkeepRateForEra } from './citizen-resource-upkeep';",
  ].join('\n');
  const res = await esbuild.build({
    stdin: { contents: entry, resolveDir: GAME_DIR, sourcefile: 'entry.ts', loader: 'ts' },
    bundle: true, format: 'cjs', platform: 'node', write: false, logLevel: 'silent',
    plugins: [plugin],
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', res.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass += 1; console.log('  ok   ' + name); }
  else { fail += 1; console.log('  FAIL ' + name + (detail !== undefined ? '  -> ' + JSON.stringify(detail) : '')); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Stale wejscia: ta sama tabela jednostek dla obu wariantow.
const UNIT_ROWS = [
  { Jednostka: 'u_e1', 'żywność/turę': 1, Epoka: 1 },
  { Jednostka: 'u_e2', 'żywność/turę': 1, Epoka: 2 },
  { Jednostka: 'u_e3', 'żywność/turę': 1, Epoka: 3 },
  { Jednostka: 'u_e4', 'żywność/turę': 1, Epoka: 4 },
  { Jednostka: 'u_e5', 'żywność/turę': 1, Epoka: 5 },
];
const P = { zywnoscJednostkaRuch: 1, zywnoscJednostkaOboz: 0.5, zywnoscMnoznikTerytorium: 1, zywnoscMnoznikPozaTerytorium: 2 };

/** Zbiera wszystkie mierzone wartości dla danego zestawu modułów. */
function measure(mod) {
  const tbl = mod.buildUnitFoodTable(UNIT_ROWS);
  const food = (id) => mod.unitFoodPerTurn({ typeId: id, camping: false, onOwnTerritory: true }, P, tbl);
  return {
    tartak: [1, 2, 3, 4, 5].map(e => mod.resourceProductionAmountForEra('tartak', 50, e)),
    farma: [1, 2, 3, 4, 5].map(e => mod.improvementYieldForEra('farma', 'zywnosc', 3, e)),
    zywnosc: [food('u_e1'), food('u_e2'), food('u_e3'), food('u_e4'), food('u_e5')],
    m: [1, 2, 3, 4, 5].map(e => mod.citizenConsumptionEraMultiplier(e)),
    conv: [1, 2, 3, 4, 5].map(e => mod.converterThroughputForEra('odlewnia_zelaza__zelazo', 10, e)),
    upk: [1, 2, 3, 4, 5].map(e => mod.citizenUpkeepRateForEra(e)),
    card: ['Kamień', 'Brąz', 'Żelazo'].map(ep => mod.unitFoodCardValue({ 'żywność/turę': 1, Epoka: ep })),
  };
}

async function runAll(label, mutants) {
  console.log('\n== ' + label + ' ==');
  const mod = await loadBundle(mutants);
  return { mod, m: measure(mod) };
}

// ---- (E1) flaga i dane ----
(async () => {
const base = await runAll('bazowy (bez mutantow)');
const params = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'econ-era-rebalance-params.json'), 'utf8'));
check('E1 flaga w danych jest typu logicznego (wartosc domyslna czytana z danych, nie zakodowana)', typeof params.eraRebalansAktywny === 'boolean', params.eraRebalansAktywny);
check('E1 parametry: skala wojska 3, racje x2, przychody stale', params.zywnoscWojskaSkalaNaEpoke === 3 && params.racjeObywateliMnoznikNaEpoke === 2 && params.przychodyUlepszenStałeEpoka1 === true);
base.mod.setEraRebalanceEnabledForTest(true);
check('E1 hak ON -> isEraRebalanceEnabled true', base.mod.isEraRebalanceEnabled() === true);
base.mod.setEraRebalanceEnabledForTest(false);
check('E1 hak OFF -> isEraRebalanceEnabled false', base.mod.isEraRebalanceEnabled() === false);
base.mod.setEraRebalanceEnabledForTest(null);
check('E1 hak null -> wraca do danych (isEraRebalanceEnabled === eraRebalansAktywny z pliku)', base.mod.isEraRebalanceEnabled() === params.eraRebalansAktywny, base.mod.isEraRebalanceEnabled());

// ---- (E2) flaga OFF = wartosci jak dotad ----
// Testy wartosci legacy (OFF) jawnie ustawiaja flage OFF: test dotyczy regul legacy; rebalans testuje econ-era-rebalance-test.
base.mod.setEraRebalanceEnabledForTest(false);
const off = measure(base.mod); // flaga OFF (jawnie)
base.mod.setEraRebalanceEnabledForTest(null);
check('E2 OFF Tartak 50/75/113', eq(off.tartak.slice(0, 3), [50, 75, 113]), off.tartak);
check('E2 OFF farma zywnosc 3/4/5', eq(off.farma.slice(0, 3), [3, 4, 5]), off.farma);
check('E2 OFF zywnosc jednostki 4/8/16 (e1-e3)', eq(off.zywnosc.slice(0, 3), [4, 8, 16]), off.zywnosc);
check('E2 OFF m = 1/1,5/2', eq(off.m.slice(0, 3), [1, 1.5, 2]), off.m);

// ---- (E3) flaga ON ----
base.mod.setEraRebalanceEnabledForTest(true);
const on = measure(base.mod);
check('E3 ON Tartak 50/50/50', eq(on.tartak.slice(0, 3), [50, 50, 50]), on.tartak);
check('E3 ON farma zywnosc 3/3/3', eq(on.farma.slice(0, 3), [3, 3, 3]), on.farma);
check('E3 ON zywnosc jednostki 4/12/36', eq(on.zywnosc.slice(0, 3), [4, 12, 36]), on.zywnosc);
check('E3 ON m = 1/2/4', eq(on.m.slice(0, 3), [1, 2, 4]), on.m);
// ---- (E4) ON w epokach 4-5 ----
check('E4 ON przychody ulepszen stale w epokach 4-5 (Tartak 50, farma 3)', on.tartak[3] === 50 && on.tartak[4] === 50 && on.farma[3] === 3 && on.farma[4] === 3, { t: on.tartak, f: on.farma });
check('E4 ON zywnosc jednostek epok 4-5 = 108/324 (x3 wzorem)', on.zywnosc[3] === 108 && on.zywnosc[4] === 324, on.zywnosc);
check('E4 ON racje epok 4-5 = 8/16 (x2 wzorem)', on.m[3] === 8 && on.m[4] === 16, on.m);
// ---- (E5) brzegi ----
check('E5 era < 1 / null -> m=1 (ON)', base.mod.citizenConsumptionEraMultiplier(0) === 1 && base.mod.citizenConsumptionEraMultiplier(null) === 1 && base.mod.citizenConsumptionEraMultiplier(NaN) === 1);
check('E5 ON brak NaN we wszystkich miarach', [...on.tartak, ...on.farma, ...on.zywnosc, ...on.m].every(v => Number.isFinite(v)));
base.mod.setEraRebalanceEnabledForTest(false);
const offAgain = measure(base.mod);
check('E5 hak false -> wartosci jak OFF', eq(offAgain, off));
base.mod.setEraRebalanceEnabledForTest(null);

// ---- (E7) konwertery i utrzymanie surowcow obywateli: POZA rebalansem (ON == OFF) ----
check('E7 OFF konwertery odlewni 10/15/20 (e1-e3)', eq(off.conv.slice(0, 3), [10, 15, 20]), off.conv);
check('E7 OFF utrzymanie surowcow obywateli 1/1,5/2 (e1-e3)', eq(off.upk.slice(0, 3), [1, 1.5, 2]), off.upk);
check('E7 ON konwertery == OFF (nie x2^(e-1))', eq(on.conv, off.conv), { on: on.conv, off: off.conv });
check('E7 ON utrzymanie surowcow == OFF (tylko racje zywnosci skalowane)', eq(on.upk, off.upk), { on: on.upk, off: off.upk });
// ---- (E8) karty jednostek: wartosc faktyczna przy ON, surowa przy OFF ----
check('E8 OFF karta zywnosci = surowa 1 (wszystkie epoki)', eq(off.card, [1, 1, 1]), off.card);
check('E8 ON karta zywnosci = faktyczna 4/12/36 (x3/epoke x R_STAWKI 4)', eq(on.card, [4, 12, 36]), on.card);
check('E8 karta: brak wartosci -> bez zmian (undefined)', base.mod.unitFoodCardValue({}) === undefined);
// ---- (E9) epoki z units.json (nazwy) -> porzadkowy 1/2/3 ----
check('E9 eraOrdinal nazw Kamien/Braz/Zelazo = 1/2/3', base.mod.eraOrdinal('Kamień') === 1 && base.mod.eraOrdinal('Brąz') === 2 && base.mod.eraOrdinal('Żelazo') === 3);

// ---- (E6) mutanty kopii zrodel: kazdy musi czerwienic ----
const MUTANTS = [
  { id: 'M1 flaga domyslna odwrocona wzgledem danych (niezaleznie od wartosci w danych)', mutants: [{ file: 'rebalance', from: '  return (ERA_REBALANCE_PARAMS.eraRebalansAktywny ?? ERA_REBALANCE_ENABLED_DEFAULT) === true;', to: '  return !((ERA_REBALANCE_PARAMS.eraRebalansAktywny ?? ERA_REBALANCE_ENABLED_DEFAULT) === true);' }] },
  { id: 'M2 racje m(e) wzor liniowy zamiast 2^(e-1)', mutants: [{ file: 'rebalance', from: 'return Math.pow(mult, Math.floor(era) - 1);', to: 'return 1 + 0.5 * (Math.floor(era) - 1);' }] },
  { id: 'M3 bramka przychodow ulepszen usunieta', mutants: [{ file: 'terrain', from: '  if (isEraRebalanceImprovementFlat()) return base;', to: '' }] },
  { id: 'M4 produkcja surowca bramka usunieta', mutants: [{ file: 'terrain', from: '  if (isEraRebalanceImprovementFlat()) return baseAmount;', to: '' }] },
  { id: 'M5 skala zywnosci wojska x2 zamiast x3', mutants: [{ file: 'rebalance', from: 'Math.pow(step, eraOrdinal(epoch) - 1)', to: 'Math.pow(2, eraOrdinal(epoch) - 1)' }] },
  { id: 'M6 bramka zywnosci jednostek usunieta', mutants: [{ file: 'upkeep', from: '      if (rebalanced !== null) base = rebalanced;', to: '' }] },
  { id: 'M7 bramka racji usunieta w citizen-consumption', mutants: [{ file: 'citizen', from: '  if (rebalanced !== null) return rebalanced;', to: '' }] },
  { id: 'M8 konwertery odlewni na wzorze 2^(e-1)', mutants: [{ file: 'converters', from: 'return baseThroughput * legacyCitizenConsumptionEraMultiplier(era);', to: 'return baseThroughput * Math.pow(2, Math.floor(era) - 1);' }] },
  { id: 'M9 utrzymanie surowcow obywateli na wzorze 2^(e-1)', mutants: [{ file: 'citizenUpkeep', from: 'return CITIZEN_UPKEEP_RATE_PER_CITIZEN * legacyCitizenConsumptionEraMultiplier(era);', to: 'return CITIZEN_UPKEEP_RATE_PER_CITIZEN * Math.pow(2, Math.floor(era) - 1);' }] },
  { id: 'M10 karta jednostki bez wartosci faktycznej (surowa przy ON)', mutants: [{ file: 'upkeep', from: '  if (rebalanced === null) return direct;', to: '  if (rebalanced === null || true) return direct;' }] },
];
console.log('\n== mutanty (E6) ==');
for (const mt of MUTANTS) {
  const mm = await loadBundle(mt.mutants);
  const r = measure(mm);
  let detected = false;
  // Mutant jest wykryty, gdy wynik z flagą OFF lub ON rozni sie od oczekiwanego.
  mm.setEraRebalanceEnabledForTest(false);
  const mOff = measure(mm);
  mm.setEraRebalanceEnabledForTest(true);
  const mOn = measure(mm);
  mm.setEraRebalanceEnabledForTest(null);
  if (mm.isEraRebalanceEnabled() !== params.eraRebalansAktywny) detected = true; // domyslna flaga musi odpowiadac danym (niezaleznie od ich wartosci)
  if (!eq(mOff, off) || !eq(mOn.tartak.slice(0, 3), [50, 50, 50]) || !eq(mOn.farma.slice(0, 3), [3, 3, 3]) || !eq(mOn.zywnosc.slice(0, 3), [4, 12, 36]) || !eq(mOn.m.slice(0, 3), [1, 2, 4]) || !eq(mOn.conv, off.conv) || !eq(mOn.upk, off.upk) || !eq(mOn.card, [4, 12, 36])) detected = true;
  void r;
  check(mt.id + ' wykryty (czerwony)', detected);
}

console.log('\nWYNIK: ' + pass + ' ok, ' + fail + ' FAIL');
process.exit(fail === 0 ? 0 : 1);
})();
