'use strict';
/**
 * improvement-growth-toggle-test.cjs -- R-WEB-ECONOMY-IMPROVEMENT-GROWTH-WITH-ERA-NEWGAME-TOGGLE-Q1.
 *
 * Ustawienie nowej gry „Wzrost surowców z epoką" (WYŁ. domyślnie = stałe wartości z Kamienia;
 * WŁ. = dawny wzrost ulepszeń z epoką). Test na PRAWDZIWYCH funkcjach (esbuild bundle, bez mutacji
 * kopii poza mutantami):
 *  (G1) domyślnie (brak ustawienia) = WYŁ.: plon farmy i produkcja tartaku stałe w epokach 1/2/3;
 *  (G2) WYŁ. jawnie: ta sama stałość (farma zywnosc 3/3/3, tartak 50/50/50, drewno/glina bez zmian);
 *  (G3) WŁ.: farma zywnosc 3/4/5 (+1 Brąz, +2 Żelazo), tartak 50/75/113 (×1,5 na epokę), baza 0/ujemna
 *       i pola spoza skali bez zmian; wartości karty (improvementBonusForKey) zgodne z ustawieniem;
 *  (G4) flaga rebalansu OFF (legacy) = wzrost z epoką niezależnie od ustawienia (ustawienie nie
 *       rusza ścieżki legacy);
 *  (G5) normalizacja pola: brak / null / string / NaN / 0 = WYŁ. (false); true = WŁ.;
 *       stary zapis bez pola = false (bez NaN/undefined);
 *  (G6) pozostałe części rebalansu NIE zmieniane przełącznikiem -- PRÓBKA JEDNOSTEK (decyzja
 *       właściciela: tylko jednostki w rekrutacji, nie pełna macierz): po jednej jednostce z Epoki 1/2/3
 *       z żywnością > 0: utrzymanie żywności (unitFoodPerTurn), skala utrzymania (unitUpkeepScaleByEpoch)
 *       i racje obywateli m(e) identyczne przy WŁ. i WYŁ.;
 *  (G7) mutanty kopii źródeł (esbuild plugin, NIE git checkout) -- każdy musi czerwienić test.
 *
 *   node tools/improvement-growth-toggle-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const GAME_DIR = path.resolve(GRA_ROOT, 'src', 'game');
const FILES = {
  rebalance: path.resolve(GAME_DIR, 'econ-era-rebalance.ts'),
  terrain: path.resolve(GAME_DIR, 'terrain-improvements.ts'),
};
const ORIG = {};
for (const k of Object.keys(FILES)) ORIG[k] = fs.readFileSync(FILES[k], 'utf8');

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
    "export { improvementYieldForEra, resourceProductionAmountForEra, improvementBonusForKey } from './terrain-improvements';",
    "export { citizenConsumptionEraMultiplier } from './citizen-consumption-era';",
    "export { buildUnitFoodTable, unitFoodPerTurn } from './economy-upkeep';",
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

// Próbka jednostek w rekrutacji (decyzja właściciela: nie pełna macierz): pierwsza jednostka z żywnością > 0
// z każdej epoki 1/2/3 wg units.json. Dane czytane z pliku (nie zakodowane).
const unitsRaw = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'units.json'), 'utf8'));
const EPOKA_NAMES = ['Kamień', 'Brąz', 'Żelazo'];
const SAMPLE_ROWS = EPOKA_NAMES.map(ep => unitsRaw.find(r => r.Epoka === ep && Number(r['żywność/turę']) > 0))
  .filter(Boolean);
const P = { zywnoscJednostkaRuch: 1, zywnoscJednostkaOboz: 0.5, zywnoscMnoznikTerytorium: 1, zywnoscMnoznikPozaTerytorium: 2 };

function measure(mod) {
  const tbl = mod.buildUnitFoodTable(SAMPLE_ROWS);
  const unitIds = SAMPLE_ROWS.map(r => r.Jednostka);
  return {
    farma: [1, 2, 3].map(e => mod.improvementYieldForEra('farma', 'zywnosc', 3, e)),
    farmaPraca: [1, 2, 3].map(e => mod.improvementYieldForEra('farma', 'praca', 2, e)),
    farmaBaza0: [1, 2, 3].map(e => mod.improvementYieldForEra('farma', 'zywnosc', 0, e)),
    farmaUjemna: [1, 2, 3].map(e => mod.improvementYieldForEra('farma', 'zywnosc', -1, e)),
    tartak: [1, 2, 3].map(e => mod.resourceProductionAmountForEra('tartak', 50, e)),
    drewnoBez: [1, 2, 3].map(e => mod.improvementYieldForEra('tartak', 'drewno', 5, e)),
    glinaBez: [1, 2, 3].map(e => mod.improvementYieldForEra('glinianka', 'glina', 10, e)),
    nieSurowcowe: [1, 2, 3].map(e => mod.resourceProductionAmountForEra('farma', 7, e)),
    karta: [1, 2, 3].map(e => mod.improvementBonusForKey('farma', e).zywnosc),
    jednostkiZywnosc: unitIds.map(id => [1, 2, 3].map(() => mod.unitFoodPerTurn({ typeId: id, camping: false, onOwnTerritory: true }, P, tbl))),
    jednostkiSkala: [1, 2, 3].map(e => mod.unitUpkeepScaleByEpoch(4, e)),
    racje: [1, 2, 3].map(e => mod.citizenConsumptionEraMultiplier(e)),
  };
}

(async () => {
  console.log('== bazowy (bez mutantow) ==');
  const mod = await loadBundle([]);
  const params = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'econ-era-rebalance-params.json'), 'utf8'));
  check('G0 sample: 3 jednostki z epok Kamień/Brąz/Żelazo z żywnością > 0', SAMPLE_ROWS.length === 3 && SAMPLE_ROWS.every(Boolean), SAMPLE_ROWS.map(r => r && r.Jednostka));

  // G1 domyslnie
  mod.setEraRebalanceEnabledForTest(null);
  mod.setWzrostSurowcowZEpoka(undefined);
  check('G1 domyslnie ustawienie = WYŁ. (false)', mod.getWzrostSurowcowZEpoka() === false);
  const dflt = measure(mod);
  check('G1 domyslnie farma zywnosc 3/3/3 (stałe, jak dziś przy rebalansie ON)', eq(dflt.farma, [3, 3, 3]), dflt.farma);
  check('G1 domyslnie tartak 50/50/50', eq(dflt.tartak, [50, 50, 50]), dflt.tartak);
  check('G1 domyslnie flat aktywny (isEraRebalanceImprovementFlat)', mod.isEraRebalanceImprovementFlat() === true);

  // G2 WYL jawnie
  mod.setWzrostSurowcowZEpoka(false);
  const off = measure(mod);
  check('G2 WYŁ. farma 3/3/3', eq(off.farma, [3, 3, 3]), off.farma);
  check('G2 WYŁ. produkcja tartaku 50/50/50', eq(off.tartak, [50, 50, 50]), off.tartak);
  check('G2 WYŁ. praca farmy 2/2/2', eq(off.farmaPraca, [2, 2, 2]), off.farmaPraca);
  check('G2 WYŁ. karta farmy zywnosc 3/3/3', eq(off.karta, [3, 3, 3]), off.karta);
  check('G2 WYŁ. drewno/glina/nie-surowcowe bez zmian', eq(off.drewnoBez, [5, 5, 5]) && eq(off.glinaBez, [10, 10, 10]) && eq(off.nieSurowcowe, [7, 7, 7]));

  // G3 WL
  mod.setWzrostSurowcowZEpoka(true);
  check('G3 getter po WŁ. = true', mod.getWzrostSurowcowZEpoka() === true);
  const on = measure(mod);
  check('G3 WŁ. farma zywnosc 3/4/5 (+1 Brąz, +2 Żelazo)', eq(on.farma, [3, 4, 5]), on.farma);
  check('G3 WŁ. praca farmy 2/3/4', eq(on.farmaPraca, [2, 3, 4]), on.farmaPraca);
  check('G3 WŁ. produkcja tartaku 50/75/113', eq(on.tartak, [50, 75, 113]), on.tartak);
  check('G3 WŁ. baza 0 i ujemna nie rosną', eq(on.farmaBaza0, [0, 0, 0]) && eq(on.farmaUjemna, [-1, -1, -1]), [on.farmaBaza0, on.farmaUjemna]);
  check('G3 WŁ. drewno/glina/nie-surowcowe bez zmian', eq(on.drewnoBez, [5, 5, 5]) && eq(on.glinaBez, [10, 10, 10]) && eq(on.nieSurowcowe, [7, 7, 7]));
  check('G3 WŁ. karta farmy (improvementBonusForKey) zgodna: 3/4/5', eq(on.karta, [3, 4, 5]), on.karta);
  check('G3 WŁ. isEraRebalanceImprovementFlat = false', mod.isEraRebalanceImprovementFlat() === false);

  // G4 legacy flaga OFF
  mod.setEraRebalanceEnabledForTest(false);
  mod.setWzrostSurowcowZEpoka(false);
  const legacyOff = measure(mod);
  check('G4 flaga rebalansu OFF + WYŁ.: legacy wzrost farma 3/4/5', eq(legacyOff.farma, [3, 4, 5]), legacyOff.farma);
  check('G4 flaga rebalansu OFF + WYŁ.: legacy tartak 50/75/113', eq(legacyOff.tartak, [50, 75, 113]), legacyOff.tartak);
  mod.setWzrostSurowcowZEpoka(true);
  const legacyOn = measure(mod);
  check('G4 flaga rebalansu OFF + WŁ.: ta sama ścieżka legacy', eq(legacyOn.farma, [3, 4, 5]) && eq(legacyOn.tartak, [50, 75, 113]));
  mod.setEraRebalanceEnabledForTest(null);

  // G5 normalizacja
  check('G5 undefined -> false', mod.normalizeWzrostSurowcowZEpoka(undefined) === false);
  check('G5 null -> false', mod.normalizeWzrostSurowcowZEpoka(null) === false);
  check('G5 "true" (string) -> false', mod.normalizeWzrostSurowcowZEpoka('true') === false);
  check('G5 NaN -> false', mod.normalizeWzrostSurowcowZEpoka(NaN) === false);
  check('G5 0 -> false', mod.normalizeWzrostSurowcowZEpoka(0) === false);
  check('G5 true -> true', mod.normalizeWzrostSurowcowZEpoka(true) === true);
  const saveRoundTrip = JSON.parse(JSON.stringify({ advanced: { wzrostSurowcowZEpoka: true } }));
  check('G5 zapis/odczyt (JSON round-trip) zachowuje true', mod.normalizeWzrostSurowcowZEpoka(saveRoundTrip.advanced.wzrostSurowcowZEpoka) === true);
  const oldSave = JSON.parse(JSON.stringify({ advanced: { hitMode: 'pewne' } }));
  check('G5 stary zapis bez pola -> false (bez NaN/undefined)', mod.normalizeWzrostSurowcowZEpoka(oldSave.advanced.wzrostSurowcowZEpoka) === false);

  // G6 pozostale czesci rebalansu nie zmienione (proba jednostek w rekrutacji)
  mod.setWzrostSurowcowZEpoka(false);
  const uOff = measure(mod);
  mod.setWzrostSurowcowZEpoka(true);
  const uOn = measure(mod);
  check('G6 utrzymanie zywnosci jednostek (próbka) identyczne WŁ./WYŁ.', eq(uOff.jednostkiZywnosc, uOn.jednostkiZywnosc), uOn.jednostkiZywnosc);
  check('G6 skala utrzymania jednostek identyczna WŁ./WYŁ.', eq(uOff.jednostkiSkala, uOn.jednostkiSkala));
  check('G6 racje obywateli m(e) identyczne WŁ./WYŁ.', eq(uOff.racje, uOn.racje));
  check('G6 params: przychodyUlepszenStałeEpoka1 nietknięte (true)', params.przychodyUlepszenStałeEpoka1 === true);
  mod.setWzrostSurowcowZEpoka(undefined);

  // G7 mutanty
  const mutantSets = [
    { id: 'M1 bramka WŁ. usunieta z isFlat', mutants: [{ file: 'rebalance', from: '    && !wzrostSurowcowZEpokaActive;', to: ';' }] },
    { id: 'M2 normalizacja: brak pola -> true', mutants: [{ file: 'rebalance', from: '  return raw === true;', to: '  return raw !== false;' }] },
    { id: 'M3 bramka stałości w farmie usunieta', mutants: [{ file: 'terrain', from: '  if (isEraRebalanceImprovementFlat()) return base;', to: '' }] },
    { id: 'M4 bramka stałości w produkcji usunieta', mutants: [{ file: 'terrain', from: '  if (isEraRebalanceImprovementFlat()) return baseAmount;', to: '' }] },
  ];
  console.log('\n== mutanty ==');
  for (const ms of mutantSets) {
    let detected = false;
    try {
      const mm = await loadBundle(ms.mutants);
      mm.setEraRebalanceEnabledForTest(null);
      mm.setWzrostSurowcowZEpoka(false);
      const a = measure(mm);
      mm.setWzrostSurowcowZEpoka(true);
      const b = measure(mm);
      mm.setWzrostSurowcowZEpoka(undefined);
      const defaultOk = mm.normalizeWzrostSurowcowZEpoka(undefined) === false;
      detected = !eq(a.farma, [3, 3, 3]) || !eq(a.tartak, [50, 50, 50]) || !eq(b.farma, [3, 4, 5]) || !eq(b.tartak, [50, 75, 113]) || !defaultOk;
    } catch (e) { detected = true; }
    check(ms.id + ' -> czerwony', detected);
  }

  console.log('\nWYNIK: ' + pass + ' ok, ' + fail + ' FAIL');
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
