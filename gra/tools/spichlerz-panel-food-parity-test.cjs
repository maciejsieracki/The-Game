'use strict';
/**
 * spichlerz-panel-food-parity-test.cjs -- P-SPICHLERZ-PANEL-VS-SILNIK-ROZJAZD-BILANS
 * (2026-08-13, zgloszenie Macieja, reprodukcja Ateny).
 *
 * Przed naprawa: cityPanel.ts:1177 czytal `y.zywnosc` -- martwe, przedwerbjne pole
 * modelu konsumpcji zywnosci (flat `zywnosc_zuzytka_populacja` zywnosci/mieszkanca/
 * ture, NIEZALEZNE od systemu Wyzywienia V85/Racje) -- zamiast `y.zywnoscBrutto`
 * (produkcja PRZED odjeciem konsumpcji), ktorego poprawnie uzywa silnik tury
 * (`previewCityEconomy`/`advanceCityEconomy` w turn-economy.ts). Skutek: PODWOJNE
 * odjecie zuzycia zywnosci w panelu -- raz przez martwy model flat, drugi raz przez
 * prawdziwy koszt Racji (V85) liczony osobno w tej samej funkcji panelu.
 * / EN: before the fix, cityPanel.ts:1177 read `y.zywnosc` -- a dead, pre-V85 food
 * consumption model field (flat `zywnosc_zuzytka_populacja` food/citizen/turn,
 * INDEPENDENT of today's V85 Rations system) -- instead of `y.zywnoscBrutto`
 * (production BEFORE consumption), which the turn engine correctly reads. Effect:
 * DOUBLE subtraction of food consumption in the panel -- once via the dead flat
 * model, again via the real V85 ration cost computed separately in the same
 * panel function.
 *
 * Reprodukcja 1:1 zrzutow ekranu Macieja (Ateny, ta sama tura):
 *   - Panel miasta (PRZED naprawa, buggy): Produkcja 29, Bilans -3.
 *   - Panel "Spichlerz centralny", tabela MIASTA (silnik, zawsze poprawny):
 *     Produkcja 33, Koszt racji 32, Bilans +1.
 *   - Roznica Produkcja = 4 = populacja(4) x zywnosc_zuzytka_populacja(1, normal).
 *
 * Ten test uzywa PRAWDZIWYCH danych gry (data/econ-params.json, data/terrain-
 * yields.json) i PRAWDZIWYCH funkcji silnika (cityYieldPerTurn, computeCityRationCost)
 * -- NIE reimplementuje formul -- zeby liczby 33/32/+1 wynikaly z tego samego kodu,
 * ktorego uzywa gra, nie z zalozen testu.
 *
 * Run z gra/: node tools/spichlerz-panel-food-parity-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[spichlerz-panel-food-parity-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.spichlerz-panel-food-parity-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.spichlerz-panel-food-parity-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  cityYieldPerTurn,
  cityBuildingEntriesFromBuiltIds,
} from '../src/game/economy';
export { buildEconParams } from '../src/game/turn-economy';
export {
  buildRationParams,
  computeCityRationCost,
  getCityRationLevel,
} from '../src/game/population-growth-v85';
export {
  paySpichlerzDrainForCity,
  resolveSpichlerzCityBonusState,
} from '../src/game/building-resource-gate';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[spichlerz-panel-food-parity-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const econParamsRaw = require('../data/econ-params.json');
const civs          = require('../data/civs.json');
const societyParams = require('../data/society-params.json');
const buildings      = require('../data/buildings.json');
const units          = require('../data/units.json');
const tech           = require('../data/tech.json');

const gameData = { civs, econParams: econParamsRaw, societyParams, buildings, units, tech };
const params = M.buildEconParams(gameData, 'normal');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; console.log('PASS:', msg); } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// -----------------------------------------------------------------------------
// 0. Sanity: parametr realny z JSON gry musi byc 1 (normal) -- inaczej reprodukcja
//    "Ateny" (populacja 4, zywnosc_zuzytka_populacja=1) nie odpowiada zgloszeniu.
// -----------------------------------------------------------------------------
eq(params.zywnoscZuzytkaPopulacja, 1, 'data/econ-params.json: zywnosc_zuzytka_populacja.normal = 1 (jak w zgloszeniu Macieja)');

// -----------------------------------------------------------------------------
// 1. Scenariusz "Ateny": populacja 4, 11 pol Laka (3 zywnosc kazde wg realnych
//    data/terrain-yields.json = 33 razem), brak budynkow, brak Spichlerza w tym
//    miescie, poziom Wyzywienia 4 (koszt = poziom x R_STAWKI_KOSZT_MULT(2) x
//    populacja = 4x2x4 = 32 -- dokladnie jak w zrzucie ekranu).
// -----------------------------------------------------------------------------
const LAKA = { terenBazowy: 'laka', nakladka: 'brak', maRzeke: false };
const workedAteny = Array(11).fill(LAKA);

const city = {
  id: 'ateny', ludnosc: 4, zdrowie: 0, czyStolica: true,
  maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0,
  specjalisci: [], kolejkaProdukcji: [],
  podziałHandlu: { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 },
  podziałPracy:  { procentBudynki: 70 },
  poziomRacji: 4,
};

const ctx = {
  wojskoZuzycieZywnosci: 0, strataFraction: 0,
  maMlyn: false, maCegielnia: false, maTargowisko: false, maBiblioteka: false,
  maMennica: false, walutaOdkryta: false, liczbaGarncarni: 0,
};

// -- Krok 1: silnik czysty (cityYieldPerTurn), TA SAMA funkcja uzywana przez
//    cityPanel.ts (`computeView`) i przez turn-economy.ts (previewCityEconomy /
//    advanceCityEconomy) -- zrodlo obu "widokow" jest wspoldzielone. --
const y = M.cityYieldPerTurn(city, workedAteny, [], params, ctx);

eq(Math.round(y.zywnoscBrutto), 33, 'cityYieldPerTurn: zywnoscBrutto (produkcja brutto, przed konsumpcja) = 33 -- zgadza sie z tabela MIASTA w Spichlerzu centralnym ze zgloszenia');

// Martwe, przedwerbjne pole -- WCIAZ obliczane wewnatrz cityYieldPerTurn (Step 9
// economy.ts), ale panel PO NAPRAWIE juz go nie czyta. Test dokumentuje jego
// wartosc, zeby udowodnic ze roznica 33 vs 29 to DOKLADNIE ten flat model.
eq(Math.round(y.zywnosc), 29, 'cityYieldPerTurn: y.zywnosc (martwy flat model, NIE uzywany juz przez panel) = 29 -- to byla blednie czytana wartosc sprzed naprawy');
eq(Math.round(y.zywnoscBrutto) - Math.round(y.zywnosc), city.ludnosc * params.zywnoscZuzytkaPopulacja, 'roznica zywnoscBrutto - y.zywnosc = populacja x zywnosc_zuzytka_populacja (4x1=4) -- dokladnie ta sama roznica 33 vs 29, ktora zglosil Maciej');

// -- Krok 2: koszt Racji V85 (ta sama funkcja co panel i "tabela MIASTA"). --
const rationParams = M.buildRationParams(econParamsRaw, 'normal');
const poziomRacji = M.getCityRationLevel(city);
eq(poziomRacji, 4, 'getCityRationLevel: poziom Wyzywienia miasta = 4');
const spichlerzDrain = M.paySpichlerzDrainForCity([city], 0, [], true);
const spichlerzState = M.resolveSpichlerzCityBonusState([], spichlerzDrain);
const kosztRacji = M.computeCityRationCost(city.ludnosc, poziomRacji, rationParams, spichlerzState);
eq(Math.round(kosztRacji), 32, 'computeCityRationCost: koszt Racji = 32 -- zgadza sie z "Koszt racji" w tabeli MIASTA ze zgloszenia');

// -----------------------------------------------------------------------------
// 2. PARYTET: wartosc, ktora panel miasta wystawia jako "Produkcja" (zywnoscBrutto,
//    PO naprawie) musi byc IDENTYCZNA z "Produkcja" w tabeli MIASTA Spichlerza
//    centralnego (silnik) dla tego samego miasta/tury -- to jest istota bledu.
// -----------------------------------------------------------------------------
const produkcjaPanelPoNaprawie = Math.round(y.zywnoscBrutto); // == cityPanel.ts:1177 po naprawie
const produkcjaSilnikTabelaMiasta = 33;                        // ze zgloszenia (Spichlerz centralny)
eq(produkcjaPanelPoNaprawie, produkcjaSilnikTabelaMiasta, 'PARYTET: Produkcja panelu miasta (zywnoscBrutto) == Produkcja w tabeli MIASTA silnika (Spichlerz centralny) dla tego samego miasta/tury');

const bilansPanelPoNaprawie = produkcjaPanelPoNaprawie - Math.round(kosztRacji);
eq(bilansPanelPoNaprawie, 1, 'Bilans panelu miasta PO naprawie = +1 (zgodny znak z silnikiem, nie -3 jak przed naprawa)');

const bilansPanelPrzedNaprawa = Math.round(y.zywnosc) - Math.round(kosztRacji);
eq(bilansPanelPrzedNaprawa, -3, 'DOWOD BLEDU (przed naprawa): gdyby panel dalej czytal y.zywnosc, Bilans wyszedlby -3 -- dokladnie to, co pokazywal zrzut ekranu Macieja');

// -----------------------------------------------------------------------------
// 3. Mutation-guard: potwierdz w ZRODLE cityPanel.ts, ze naprawiona linia
//    faktycznie czyta `y.zywnoscBrutto`, NIE `y.zywnosc` -- lapie regresje jesli
//    ktos kiedys cofnie naprawe (§6 protokolu AutoBot -- weryfikacja mutacyjna).
// -----------------------------------------------------------------------------
const cityPanelSrc = fs.readFileSync(path.resolve(GRA, 'src/ui/cityPanel.ts'), 'utf8');
const fixedLineMatch = cityPanelSrc.match(/const zywnoscBrutto = y\.(zywnoscBrutto|zywnosc);/);
assert(!!fixedLineMatch, 'cityPanel.ts: znaleziono linie "const zywnoscBrutto = y.<pole>;" (wzorzec bugu P-SPICHLERZ-PANEL-VS-SILNIK-ROZJAZD-BILANS)');
if (fixedLineMatch) {
  eq(fixedLineMatch[1], 'zywnoscBrutto', 'cityPanel.ts: "const zywnoscBrutto = y.zywnoscBrutto;" (NAPRAWIONE -- nie y.zywnosc) -- jesli to FAIL, naprawa zostala cofnieta');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
