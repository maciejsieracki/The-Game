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
// B. EFEKT 1 SCALONY (decyzja Maciej 2026-07-25): mnoznik Handlu netto dziala
//    tylko gdy ctx.maMennica ORAZ ctx.walutaOdkryta sa oba prawdziwe -- dawne
//    osobne pole ctx.mennicaMnoznik (mnoznik TYLKO na strumien Pieniadza)
//    zostalo usuniete, gate jest teraz w cityYieldPerTurn (economy.ts) sam,
//    bez potrzeby przekazywania wartosci mnoznika z zewnatrz (samą formułę
//    kryje tez currency-test.cjs; tu weryfikujemy real econ-params.json).
// ---------------------------------------------------------------------------
console.log('\n-- B. cityYieldPerTurn: Efekt 1 scalony (Waluta+Mennica) realnie podnosi Skarb --');
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
    maMennica: true, walutaOdkryta: true,
  }, overrides);
}
const rTile = { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false };
const tiles6 = Array(6).fill(rTile);
const city = makeCity();

const yldNoMennica  = M.cityYieldPerTurn(city, tiles6, [], pNormal, makeCtx({ maMennica: false }));
const yldConMennica = M.cityYieldPerTurn(city, tiles6, [], pNormal, makeCtx({ maMennica: true }));
assert(yldConMennica.pieniadz > yldNoMennica.pieniadz,
  `Mennica ×${pNormal.mennicaMnoznikPoWalucie}: pieniadz wzrasta wzgledem braku Mennicy (${yldConMennica.pieniadz} > ${yldNoMennica.pieniadz})`);

// Przyklad liczbowy (normal, real econ-params.json, 6 pol Rownina: handel=6, brak
// Targowiska -> handelBrutto=6; bez Mennicy mnoznik=1 (mimo walutaOdkryta=true, to
// jest sedno decyzji 2026-07-25) -> handelNetto=6, %Skarb=70 -> floor(6*0.70)=4;
// z Mennica+Waluta: handelNetto=6*1.5=9 -> floor(9*0.70)=6 -- dokladnie +50%.
eq(yldNoMennica.pieniadz, 4, 'przyklad: Waluta bez Mennicy -> pieniadz=4 (mnoznik=1, brak efektu -- sedno decyzji)');
eq(yldConMennica.pieniadz, 6, 'przyklad: Mennica x1.5 + Waluta -> pieniadz=6 (+50% wzgledem 4)');

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

eq(walutaOnly.pieniadzBrutto, base.pieniadzBrutto,
  'Waluta BEZ Mennicy: BRAK zmiany wzgledem baseline (sedno decyzji 2026-07-25 -- sam tech juz nie wystarcza)');
// Mennica BEZ Waluty: bramka AND Efektu 1 (multiplikator Handlu netto) jest NIEaktywna,
// ale Mennica jako budynek nadal daje wlasny bazowy plon Pieniadza (baza.pieniadz=3 w
// buildings.json, wpiety do silnika naprawa "plony budynkow" FALA 11 2026-07-25 --
// niezalezna od tego zadania). Delta wzgledem baseline = WYLACZNIE ten plon budynku,
// zero z multiplikatora -- to jest precyzyjny dowod ze bramka nie przecieka.
eq(mennicaOnly.pieniadzBrutto - base.pieniadzBrutto, 3,
  'Mennica BEZ Waluty: delta = tylko wlasny plon budynku (+3 Pieniadz bazowy), multiplikator Efektu 1 NIEaktywny (bramka AND)');
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

// Zadanie 1 (2026-07-23): PALIWO USUNIETE calkowicie, Mielerz skasowany -- konwertery
// biora DREWNO 1:1 zamiast paliwa. Test zaktualizowany: Cegielnia bierze teraz
// { glina: 2, drewno: 1 } zamiast { glina: 2, paliwo: 1 }.
//
// Bez Cegielni: glina+drewno NIE zamieniaja sie w cegle mimo obecnosci surowcow.
const withoutCegielnia = simulateConverterTick([], { glina: 4, drewno: 5 });
eq(withoutCegielnia.stores.glina, 4, 'brak Cegielni: glina niezmieniona (converter nieaktywny)');
eq(withoutCegielnia.stores.drewno, 5, 'brak Cegielni: drewno niezmienione (converter nieaktywny)');
eq(withoutCegielnia.stores.cegla, undefined, 'brak Cegielni: brak cegly (converter nieaktywny)');

// Z Cegielnia: glina+drewno zamieniaja sie w cegle (do przepustowosci).
const withCegielnia = simulateConverterTick(['cegielnia'], { glina: 4, drewno: 5 });
assert(withCegielnia.stores.cegla > 0, `z Cegielnia: cegla > 0 (got ${withCegielnia.stores.cegla})`);
assert(withCegielnia.stores.glina < 4, 'z Cegielnia: glina zmalala (skonsumowana)');
assert(withCegielnia.stores.drewno < 5, 'z Cegielnia: drewno zmalalo (skonsumowane, bylo paliwo:1 -> teraz drewno:1)');

// 'tartak' i 'huta' nie maja odpowiednika w buildings.json -- nigdy nie beda w builtIds,
// wiec te dwie receptury pozostaja nieaktywne (pre-istniejacy stan danych, patrz raport E1).
// Mielerz USUNIETY calkowicie z buildings.json (Zadanie 1, 2026-07-23) -- pozostaje
// 5 receptur z odpowiednikiem budynku (cegielnia/garncarnia/odlewnia_brazu/odlewnia_zelaza/
// wielka_kuznia); test sprawdza jak dawniej tylko podzbior uzywany dalej w tym pliku.
const buildingIds = new Set((Array.isArray(buildings) ? buildings : buildings.buildings || []).map(b => b.id));
assert(!buildingIds.has('tartak'), 'potwierdzenie: brak budynku "tartak" w buildings.json (recepta nieaktywna)');
assert(!buildingIds.has('huta'), 'potwierdzenie: brak budynku "huta" w buildings.json (recepta nieaktywna, duplikat odlewnia_brazu)');
assert(!buildingIds.has('mielerz'), 'Mielerz NIE istnieje juz w buildings.json (usuniety 2026-07-23)');
assert(buildingIds.has('cegielnia') && buildingIds.has('garncarnia') && buildingIds.has('odlewnia_brazu'),
  'Cegielnia/Garncarnia/odlewnia_brazu MAJA budynek (Garncarnia = dostep Ceramiki, BEZ receptury konwertera)');

// ---------------------------------------------------------------------------
// G. GLINA-Q1=A (2026-07-20): glinianka daje 2 glina/ture, dokladnie jak drewno/kamien
// ---------------------------------------------------------------------------
console.log('\n-- G. cityYieldPerTurn: glinaTerenu z glinianki (GLINA-Q1=A) --');
const clayTile = { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false, ulepszenieKey: 'glinianka' };
const yClay = M.tileYield(clayTile);
eq(yClay.glina, 2, 'tileYield: glinianka daje glina=2 (bonus stala ilosc, GLINA-Q1=A)');

const plainTile = { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false };
const yPlain = M.tileYield(plainTile);
eq(yPlain.glina, 0, 'tileYield: teren bez glinianki -> glina=0 (baza terenu nie daje gliny)');

const yldClay = M.cityYieldPerTurn(city, [clayTile, clayTile], [], pNormal, makeCtx({}));
eq(yldClay.glinaTerenu, 4, 'cityYieldPerTurn: 2 pola z glinianka -> glinaTerenu = 4 (2 x 2/ture)');

// ---------------------------------------------------------------------------
// H. Cegielnia oziywa: glina+drewno -> cegla; Garncarnia NIE konwertuje (Maciej 2026-07-23:
// Ceramika = tylko dostep, receptura 'garncarnia' USUNIETA z DEFAULT_CONVERTER_RECIPES,
// patrz converters.ts). Paliwo usuniete (Zadanie 1) -- Cegielnia bierze drewno 1:1;
// odlewnia_brazu NIE bez rudy.
// ---------------------------------------------------------------------------
console.log('\n-- H. Cegielnia produkuje z gliny+drewna; Garncarnia = dostep (bez konwersji); odlewnia_brazu NIE bez rudy --');

// Cegielnia + Garncarnia zbudowane, magazyn glina+drewno -- TYLKO Cegielnia ma recepture
// aktywna (Garncarnia usunieta z katalogu konwerterow); glina=8 z zapasem.
const withCegielniaGarncarnia = simulateConverterTick(
  ['cegielnia', 'garncarnia'],
  { glina: 8, drewno: 8 },
);
assert(withCegielniaGarncarnia.stores.cegla > 0,
  `Cegielnia: cegla > 0 przy glina+drewno obecnych (got ${withCegielniaGarncarnia.stores.cegla})`);
eq(withCegielniaGarncarnia.stores.ceramika, undefined,
  'Garncarnia: BRAK ceramiki w magazynie (Maciej 2026-07-23: dostep, nie stock -- receptura usunieta)');
assert(withCegielniaGarncarnia.stores.glina < 8,
  'Cegielnia+Garncarnia: glina zmalala (skonsumowana przez Cegielnie -- Garncarnia nie konwertuje)');

// Bez budynkow: mimo obecnosci gliny+drewna w magazynie nic sie nie produkuje (gating builtIds).
const withoutBuildings = simulateConverterTick([], { glina: 8, drewno: 8 });
eq(withoutBuildings.stores.cegla, undefined, 'brak Cegielni: brak cegly (converter nieaktywny)');
eq(withoutBuildings.stores.ceramika, undefined, 'brak Garncarni jako konwertera: brak ceramiki');
eq(withoutBuildings.stores.glina, 8, 'brak budynkow: glina niezmieniona');

// odlewnia_brazu zbudowana + drewno obecne, ale BEZ rudy (GLINA-Q2=A: rudy nie zbieramy) ->
// braz NIE rosnie (limitWejscia=0 bo have('ruda')=0), niezaleznie od gliny/cegielni/garncarni.
const withOdlewniaNoOre = simulateConverterTick(
  ['odlewnia_brazu', 'cegielnia', 'garncarnia'],
  { glina: 8, drewno: 8 },
);
eq(withOdlewniaNoOre.stores.braz, undefined,
  'odlewnia_brazu zbudowana ale brak rudy w magazynie -> braz NIE rosnie (undefined, brak-wejscia)');
assert(withOdlewniaNoOre.stores.cegla > 0 && withOdlewniaNoOre.stores.ceramika === undefined,
  'odlewnia_brazu bez rudy NIE blokuje Cegielni (nadal produkuje z gliny+drewna); ceramika brak (dostep, nie stock)');

// Sanity: gdyby ruda BYLA w magazynie (nie zbierana dzis, ale receptura istnieje), odlewnia
// zadzialalaby -- potwierdza, ze brak braz wyzej wynika z braku rudy, nie ze zlej receptury.
const withOdlewniaWithOre = simulateConverterTick(['odlewnia_brazu'], { ruda: 4, drewno: 4 });
assert(withOdlewniaWithOre.stores.braz > 0,
  `kontrola: odlewnia_brazu Z ruda w magazynie -> braz > 0 (got ${withOdlewniaWithOre.stores.braz}) -- receptura sama w sobie sprawna`);

// --- summary ---------------------------------------------------------------
console.log(`\nmennica-magazyn-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
