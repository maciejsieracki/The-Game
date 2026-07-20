'use strict';
/**
 * mennica-magazyn-test.cjs -- standalone Node test for E1:
 *   Zadanie 1: Mennica mnoznik Handel->Pieniadz aktywny TYLKO gdy zbudowana ORAZ
 *              Waluta odkryta (globalne.mennica_mnoznik_po_walucie: easy 2 / normal 1.5 / hard 1).
 *   Zadanie 2: per-city magazyn surowcow logistycznych (drewno/kamien) + ozywienie
 *              converters (tylko dla budynku faktycznie wybudowanego w miescie).
 *
 * Run from gra/:  node tools/mennica-magazyn-test.cjs
 * Self-contained: bundles economy.ts / cities.ts / converters.ts / economy-upkeep.ts /
 * turn-economy.ts with esbuild (no runtime imports).
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[mennica-magazyn-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.mennica-magazyn-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.mennica-magazyn-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { cityYieldPerTurn, loadEconParams, tileYield } from '../src/game/economy';
export { ensureCitySaveDefaults } from '../src/game/cities';
export { runConverters, DEFAULT_CONVERTER_RECIPES } from '../src/game/converters';
export { resourceStorageCapacityPerType, loadStorageParams } from '../src/game/economy-upkeep';
export { buildEconParams, advanceCityEconomy } from '../src/game/turn-economy';
export { generateMap } from '../src/map/generator';
export { foundCityAt, canFoundCity } from '../src/game/cities';
export { Nakladka, TerenBazowy } from '../src/types/hex';
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
  console.error('[mennica-magazyn-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const econParamsRaw = require('../data/econ-params.json');
const civs = require('../data/civs.json');
const societyParams = require('../data/society-params.json');
const buildings = require('../data/buildings.json');
const units = require('../data/units.json');
const tech = require('../data/tech.json');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; console.log('PASS:', msg); } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// A. Zadanie 1: wartosci wlasciciela w econ-params.json (real data, nie mock)
// ---------------------------------------------------------------------------
console.log('\n-- A. Mennica: wartosci w econ-params.json --');
const pEasy   = M.loadEconParams(econParamsRaw, 'easy');
const pNormal = M.loadEconParams(econParamsRaw, 'normal');
const pHard   = M.loadEconParams(econParamsRaw, 'hard');
eq(pEasy.mennicaMnoznikPoWalucie,   2,   'econ-params.json: easy mennicaMnoznikPoWalucie = 2');
eq(pNormal.mennicaMnoznikPoWalucie, 1.5, 'econ-params.json: normal mennicaMnoznikPoWalucie = 1.5');
eq(pHard.mennicaMnoznikPoWalucie,   1,   'econ-params.json: hard mennicaMnoznikPoWalucie = 1 (bez bonusu, NIE zero)');

// buildEconParams (turn-economy.ts) czyta ten sam klucz spojnie z loadEconParams (economy.ts)
const gameData = { civs, econParams: econParamsRaw, societyParams, buildings, units, tech };
const beNormal = M.buildEconParams(gameData, 'normal');
eq(beNormal.mennicaMnoznikPoWalucie, 1.5, 'buildEconParams (turn-economy.ts): normal = 1.5 (parity z loadEconParams)');

// ---------------------------------------------------------------------------
// B. Zadanie 1: formula gate -- mnoznik Mennicy dziala tylko gdy ctx.mennicaMnoznik>1 przekazany
//    (samą formułę handel->pieniadz w economy.ts juz kryje currency-test.cjs; tu weryfikujemy
//    ze wartosc 1.5 z JSON faktycznie podnosi dochod wzgledem mnoznika=1, na tych samych danych).
// ---------------------------------------------------------------------------
console.log('\n-- B. cityYieldPerTurn: mennicaMnoznik z parametru realnie podnosi Skarb --');
function makeCity(overrides) {
  return Object.assign({
    id: 'c1', ludnosc: 3, zdrowie: 0, czyStolica: true,
    maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0,
    specjalisci: [], kolejkaProdukcji: [],
    podziałHandlu: { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 },
    podziałPracy:  { procentBudynki: 70 },
  }, overrides);
}
function makeCtx(overrides) {
  return Object.assign({
    wojskoZuzycieZywnosci: 0, strataFraction: 0,
    maMlyn: false, maCegielnia: false, maTargowisko: false, maBiblioteka: false,
    maMennica: true, mennicaMnoznik: 1, walutaOdkryta: true,
  }, overrides);
}
const rTile = { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false };
const tiles6 = Array(6).fill(rTile);
const city = makeCity();

const yldNoMnoznik = M.cityYieldPerTurn(city, tiles6, [], pNormal, makeCtx({ mennicaMnoznik: 1 }));
const yldConMnoznik = M.cityYieldPerTurn(city, tiles6, [], pNormal, makeCtx({ mennicaMnoznik: pNormal.mennicaMnoznikPoWalucie }));
assert(yldConMnoznik.pieniadz > yldNoMnoznik.pieniadz,
  `Mennica ×${pNormal.mennicaMnoznikPoWalucie}: pieniadz wzrasta wzgledem mnoznika=1 (${yldConMnoznik.pieniadz} > ${yldNoMnoznik.pieniadz})`);

// Przyklad liczbowy (normal, 6 pol Rownina: handel=6, walutaOdkryta=true -> Efekt1
// x2 (walutaMnoznik) -> handelNetto=12; %Skarb=70): bez mnoznika Mennicy floor(12*0.70)=8;
// z Mennica x1.5 po Walucie: floor(12*0.70*1.5)=floor(12.6)=12 -- dokladnie +50%.
eq(yldNoMnoznik.pieniadz, 8, 'przyklad: bez Mennicy aktywnej -> pieniadz=8 (tylko Efekt1 Waluty)');
eq(yldConMnoznik.pieniadz, 12, 'przyklad: Mennica x1.5 PO Walucie -> pieniadz=12 (+50% wzgledem 8)');

// ---------------------------------------------------------------------------
// C. Zadanie 1: bramka AND (budynek + tech) -- pelna sciezka przez advanceCityEconomy
// ---------------------------------------------------------------------------
console.log('\n-- C. advanceCityEconomy: bramka Mennica AND Waluta (integracja pelna) --');
const map = M.generateMap(30, 30, 4242, 'kontynenty');
function firstLandHex() {
  for (const h of Object.values(map.hexes)) {
    const c = { q: h.coords.q, r: h.coords.r };
    if (M.canFoundCity(c.q, c.r, [], map).ok) return c;
  }
  return null;
}
const spot = firstLandHex();
if (!spot) {
  console.error('FAIL: brak lądu do założenia miasta testowego');
  process.exit(1);
}

function runTick(builtIds, walutaOdkryta) {
  const cities = [];
  const c = M.foundCityAt(spot.q, spot.r, 0, cities, map, 'TestCity');
  cities.push(c);
  const builtByCity = new Map([[c.id, builtIds]]);
  const playerZbadane = new Set(walutaOdkryta ? ['Waluta'] : []);
  const econ = M.advanceCityEconomy(
    cities, map, gameData, 'normal', [], new Map(), builtByCity, 1, playerZbadane, new Map(), new Map(),
  );
  return { tick: econ.perCity[0], city: c };
}

const base       = runTick([], false).tick;                     // brak Mennicy, brak Waluty
const walutaOnly = runTick([], true).tick;                       // Waluta bez Mennicy
const mennicaOnly = runTick(['mennica'], false).tick;             // Mennica bez Waluty
const both       = runTick(['mennica'], true).tick;               // Mennica + Waluta -> gate ON

eq(walutaOnly.pieniadzBrutto >= base.pieniadzBrutto, true,
  'Waluta bez Mennicy: nie mniej niz baseline (mnoznik Efekt1 dziala niezaleznie)');
eq(mennicaOnly.pieniadzBrutto, base.pieniadzBrutto,
  'Mennica BEZ Waluty: brak zmiany wzgledem baseline (bramka AND -- Mennica nieaktywna)');
assert(both.pieniadzBrutto > walutaOnly.pieniadzBrutto,
  `Mennica + Waluta: dochod wyzszy niz sama Waluta (${both.pieniadzBrutto} > ${walutaOnly.pieniadzBrutto})`);

// ---------------------------------------------------------------------------
// D. Zadanie 2: City.surowce -- migracja starego zapisu (ensureCitySaveDefaults)
// ---------------------------------------------------------------------------
console.log('\n-- D. City.surowce: migracja starego zapisu --');
const oldCity = { id: 'old1', ownerId: 0, q: 0, r: 0, name: 'Stare Miasto', population: 3 };
M.ensureCitySaveDefaults(oldCity);
assert(oldCity.surowce && typeof oldCity.surowce === 'object', 'stary zapis bez pola surowce -> dostaje {}');
eq(Object.keys(oldCity.surowce).length, 0, 'migracja: pusty magazyn surowcow (nie zgadujemy wartosci)');

const cityWithStock = { id: 'old2', ownerId: 0, q: 0, r: 0, name: 'Miasto z zapasem', population: 3, surowce: { drewno: 7 } };
M.ensureCitySaveDefaults(cityWithStock);
eq(cityWithStock.surowce.drewno, 7, 'migracja: istniejacy magazyn surowcow NIE jest nadpisywany');

// ---------------------------------------------------------------------------
// E. Zadanie 2: tileYield -- drewno/kamien z terenu wchodza teraz do cityYieldPerTurn
// ---------------------------------------------------------------------------
console.log('\n-- E. cityYieldPerTurn: drewnoTerenu / kamienTerenu (Zadanie 2) --');
const forestTile = { terenBazowy: 'rownina', nakladka: 'las', maRzeke: false };
const y1 = M.tileYield(forestTile);
assert(y1.drewno > 0, `tileYield: Las daje drewno > 0 (got ${y1.drewno})`);

const yldForest = M.cityYieldPerTurn(city, [forestTile, forestTile], [], pNormal, makeCtx({}));
eq(yldForest.drewnoTerenu, y1.drewno * 2, 'cityYieldPerTurn: drewnoTerenu = suma drewna z 2 pol lasu');

// Rownina bazowo JUZ ma drewno=2/kamien=1 na pole w terrain-yields.json (przed E1
// nigdzie nieodczytywane w cityYieldPerTurn) -- weryfikujemy sume z 6 pol.
const yldNoForest = M.cityYieldPerTurn(city, tiles6, [], pNormal, makeCtx({}));
eq(yldNoForest.drewnoTerenu, 12, 'cityYieldPerTurn: 6 pol Rownina (baza drewno=2) -> drewnoTerenu = 12');
eq(yldNoForest.kamienTerenu, 6, 'cityYieldPerTurn: 6 pol Rownina (baza kamien=1) -> kamienTerenu = 6');

const seaTile = { terenBazowy: 'morze', nakladka: 'brak', maRzeke: false };
const yldSea = M.cityYieldPerTurn(city, [seaTile, seaTile], [], pNormal, makeCtx({}));
eq(yldSea.drewnoTerenu, 0, 'cityYieldPerTurn: Morze -> drewnoTerenu = 0 (brak drewna/kamienia na morzu)');
eq(yldSea.kamienTerenu, 0, 'cityYieldPerTurn: Morze -> kamienTerenu = 0');

// ---------------------------------------------------------------------------
// F. Zadanie 2: converters -- receptura biezy TYLKO gdy budynek jest wybudowany
// ---------------------------------------------------------------------------
console.log('\n-- F. Converters: gating po builtIds (jak w turn-economy.ts) --');
const storageParams = M.loadStorageParams(econParamsRaw, 'normal');
const resCap = M.resourceStorageCapacityPerType(false, storageParams);

function simulateConverterTick(builtIds, stores) {
  const active = M.DEFAULT_CONVERTER_RECIPES.filter(r => builtIds.includes(r.id));
  const throughputs = {};
  for (const r of M.DEFAULT_CONVERTER_RECIPES) throughputs[r.id] = r.throughputFallback;
  return M.runConverters(active, stores, throughputs, () => resCap);
}

// Bez Mielerza: drewno NIE zamienia sie na paliwo mimo obecnosci surowca.
const withoutMielerz = simulateConverterTick([], { drewno: 5 });
eq(withoutMielerz.stores.drewno, 5, 'brak Mielerza: drewno niezmienione (converter nieaktywny)');
eq(withoutMielerz.stores.paliwo, undefined, 'brak Mielerza: brak paliwa (converter nieaktywny)');

// Z Mielerzem: drewno zamienia sie na paliwo (do przepustowosci).
const withMielerz = simulateConverterTick(['mielerz'], { drewno: 5 });
assert(withMielerz.stores.paliwo > 0, `z Mielerzem: paliwo > 0 (got ${withMielerz.stores.paliwo})`);
assert(withMielerz.stores.drewno < 5, 'z Mielerzem: drewno zmalalo (skonsumowane)');

// 'tartak' i 'huta' nie maja odpowiednika w buildings.json -- nigdy nie beda w builtIds,
// wiec te dwie receptury pozostaja nieaktywne (pre-istniejacy stan danych, patrz raport E1).
const buildingIds = new Set((Array.isArray(buildings) ? buildings : buildings.buildings || []).map(b => b.id));
assert(!buildingIds.has('tartak'), 'potwierdzenie: brak budynku "tartak" w buildings.json (recepta nieaktywna)');
assert(!buildingIds.has('huta'), 'potwierdzenie: brak budynku "huta" w buildings.json (recepta nieaktywna, duplikat odlewnia_brazu)');
assert(buildingIds.has('mielerz') && buildingIds.has('cegielnia') && buildingIds.has('garncarnia') && buildingIds.has('odlewnia_brazu'),
  'pozostale 4 receptury (mielerz/cegielnia/garncarnia/odlewnia_brazu) MAJA budynek -- moga byc aktywne');

// --- summary ---------------------------------------------------------------
console.log(`\nmennica-magazyn-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
