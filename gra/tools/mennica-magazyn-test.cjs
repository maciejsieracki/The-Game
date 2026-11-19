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
// Oczekiwane plony z DANYCH (terrain-yields.json): baza Równiny po P-SUROWCE-BAZA Q1 (2026-08-17).
const TYD = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'terrain-yields.json'), 'utf8'));
const RWD = TYD.terrain_types.find((t) => t.Teren === 'Równina');
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
// Globalne wartości fallback (mennica_mnoznik_po_walucie); właściwy mnożnik per cywilizacja z macierzy,
// z dolnym limitem mennica_mnoznik_po_walucie_minimum = 1,38 (econ-params.json, zmiana 2026-11 -- było 2/1,5/1).
eq(pEasy.mennicaMnoznikPoWalucie,   1.62, 'econ-params.json: easy mennicaMnoznikPoWalucie = 1.62 (fallback globalny)');
eq(pNormal.mennicaMnoznikPoWalucie, 1.5,  'econ-params.json: normal mennicaMnoznikPoWalucie = 1.5 (fallback globalny)');
eq(pHard.mennicaMnoznikPoWalucie,   1.38, 'econ-params.json: hard mennicaMnoznikPoWalucie = 1.38 (NIE 1: dolny limit minimum, NIE zero)');

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

function runTick(builtIds, walutaOdkryta, stock = {}) {
  const cities = [];
  const c = M.foundCityAt(spot.q, spot.r, 0, cities, map, 'TestCity');
  c.surowce = { ...stock };
  cities.push(c);
  const builtByCity = new Map([[c.id, builtIds]]);
  const playerZbadane = new Set(walutaOdkryta ? ['Waluta'] : []);
  // R-WEB-ECONOMY-CONVERTERS-MENNICA-CLAY-ORDER-Q1 (runda 2, zarzut 2): bramka Mennicy działa TYLKO,
  // gdy podano resolveOwnerActiveLabels (turn-economy.ts:1782 -- bez niego filtr runtime jest pominięty).
  // Dostęp do złota = stan magazynu państwa (jak w main.ts): zloto > 0.
  const zlotoAccess = () => (stock.zloto ?? 0) > 0;
  const econ = M.advanceCityEconomy(
    cities, map, gameData, 'normal', [], new Map(), builtByCity, 1, playerZbadane, new Map(), new Map(),
    undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    zlotoAccess, () => [], () => ({ ...stock }),
  );
  return { tick: econ.perCity[0], city: c };
}

// Złoto w stocku dla WSZYSTKICH czterech scenariuszy (tylko Mennica/Waluta się różnią).
const ZLOTO_STOCK = { zloto: 10 };
const base       = runTick([], false, ZLOTO_STOCK).tick;                     // brak Mennicy, brak Waluty
const walutaOnly = runTick([], true, ZLOTO_STOCK).tick;                       // Waluta bez Mennicy
// Mennica WYMAGA złota w magazynie (building-resource-gate.ts:76, decyzja 2026-11-19 pkt 2).
// Złoto podajemy w stocku, żeby budynek REALNIE produkował i asercja o multiplikatorze Efektu 1
// miała moc (bez złota delta = 0 niczego nie dowodzi: 0 x mnożnik = 0).
const mennicaOnly = runTick(['mennica'], false, ZLOTO_STOCK).tick;  // Mennica bez Waluty (ze złotem)
const both       = runTick(['mennica'], true, ZLOTO_STOCK).tick;    // Mennica + Waluta -> gate ON

eq(walutaOnly.pieniadzBrutto, base.pieniadzBrutto,
  'Waluta BEZ Mennicy: BRAK zmiany wzgledem baseline (sedno decyzji 2026-07-25 -- sam tech juz nie wystarcza)');
// Mennica BEZ Waluty: bramka AND Efektu 1 (multiplikator Daniny netto) jest NIEaktywna,
// ale Mennica jako budynek nadal daje wlasny bazowy plon Pieniadza (baza.pieniadz=3 w
// buildings.json, wpiety do silnika naprawa "plony budynkow" FALA 11 2026-07-25).
//
// AKTUALIZACJA 2026-07-25 (noc), decyzja wlasciciela 67B: 3 -> 2.
// Wczesniej ten test zakladal, ze Pieniadz z budynku trafia 1:1 do skarbca, wiec delta
// rownala sie pelnym 3 pkt Pieniadza/ture. Po decyzji 67B ("budynki powinny dawac handel
// nie bezposrednio do skarbca, tylko do puli, do podzialu") plon Pieniadza budynku wchodzi
// do Daniny BAZOWEJ i dzieli sie suwakiem miasta na Nauke/Skarbiec/Zamoznosc. Przy
// domyslnym podziale 20/60/20 (decyzja 74A) do strumienia Pieniadza trafia 60% tego plonu,
// a wynik jest zaokraglany w dol na ZSUMOWANEJ puli (nie na samym wkladzie budynku) --
// stad calkowita delta 2, a nie 1,8 czy 3.
//
// Test nadal dowodzi dokladnie tego, co mial dowodzic: multiplikator Efektu 1 NIE przecieka
// przy samej Mennicy bez Waluty. Gdyby przeciekal, delta bylaby wielokrotnie wyzsza.
// Scenariusz ma złoto w stocku (ZLOTO_STOCK = decyzja 2026-11-19 pkt 2: Mennica wymaga złota,
// building-resource-gate.ts:76). Intencja (multiplikator Efektu 1 NIE przecieka przy samej Mennicy bez
// Waluty) wymaga, by Mennica realnie produkowała; oczekiwana wartość = 2 (decyzja 67B).
// STAN NA 2026-11-19 (runda 2 obrony): zmierzone 0 ZARÓWNO ze złotem 10, JAK i bez złota, oraz w teście
// sprzed kandydata (HEAD~1 też got 0). Mennica nie dowozi własnego plonu Pieniądza do pieniadzBrutto w tym
// scenariuszu -- ZNALEZISKO GRY (nie błąd testu). Asercja zostaje CZERWONA z tym opisem. Oczekiwania NIE
// zmieniam na 0: 0 unieważniałoby test wycieku mnożnika.
// R-WEB-ECONOMY-CONVERTERS-MENNICA-CLAY-ORDER-Q1 (runda 1, Operator): ZMIERZONE 2026-11-19 -- delta
// Pieniadza = 0 ZARÓWNO ze złotem (ZLOTO_STOCK), JAK i bez złota (stock {}). Harness nie podaje
// resolveOwnerActiveLabels, więc bramka złota w tym teście nie działa; 0 wynika z domyślnego podziału
// Handlu (DEFAULT_PODZIAL_HANDLU 60 Nauka / 30 Pieniądz / 10 Luksus, cities.ts) na 2 pkt plonu Mennicy:
// floor(2 × 0,30) = 0 Pieniądza, a +1 idzie do Nauki (zmierzone: nauka 4 -> 5). Oczekiwanie „2" z
// komentarza 67B zakładało podział 20/60/20, którego dziś nie ma. ZNALEZISKO GRY (zaokrąglenie
// podziału małej puli, nie mnożnik): NIE naprawiane tu -- wymaga decyzji właściciela (ABC).
// Asercja pilnuje tylko tego, co dowodzi testu: multiplikator Efektu 1 (Waluta) NIE przecieka przy
// samej Mennicy bez Waluty -- delta mieści się w [0, plon budynku 2].
// R-WEB-ECONOMY-CONVERTERS-MENNICA-CLAY-ORDER-Q1 (runda 2, zarzuty 1-2): TRZY reguły rozdzielone,
// każda z bramką złota aktywną (resolveOwnerActiveLabels + zlotoAccess w runTick).
// (i) BEZ złota: bramka zamknięta -> Mennica nie produkuje -> delta DOKŁADNIE 0.
const bezZlotaMennica = runTick(['mennica'], false, {}).tick;
const bezZlotaBase = runTick([], false, {}).tick;
eq(bezZlotaMennica.pieniadzBrutto - bezZlotaBase.pieniadzBrutto, 0,
  'Mennica BEZ złota (stock {}): delta = 0 (bramka złota zamknięta)');
// (ii) ZE złotem: bramka otwarta -> delta MUSI być > 0 (zgodnie z mnożnikiem / plonem budynku).
// ZMIERZONE runda 2: 0 (floor(2 x 0,30) = 0 Pieniądza z podziału Handlu 60/30/10, cities.ts).
// To ZNALEZISKO GRY (zaokrąglenie podziału małej puli), NIE naprawiane w tym temacie: zmiana
// zaokrąglenia to decyzja właściciela (ABC). Asercja zostaje CZERWONA do tej decyzji.
const zeZlotemDelta = mennicaOnly.pieniadzBrutto - base.pieniadzBrutto;
assert(zeZlotemDelta > 0,
  `Mennica ZE złotem (zloto 10): delta > 0 (got ${zeZlotemDelta}; ZNALEZISKO GRY -- zaokrąglenie podziału Handlu, decyzja ABC)`);
// (iii) Waluta + Mennica > sama Waluta (istniejąca asercja; gate ON).
assert(both.pieniadzBrutto > walutaOnly.pieniadzBrutto,
  `Mennica + Waluta: dochod wyzszy niz sama Waluta (${both.pieniadzBrutto} > ${walutaOnly.pieniadzBrutto})`);

// ---------------------------------------------------------------------------
// C2. Rozdział gliny NA REALNYM TORZE (runda 2, zarzut 5): advanceCityEconomy -> runConverters
//     (turn-economy.ts), nie tylko izolowane receptury. Glina 40, Cegielnia + Garncarnia.
// ---------------------------------------------------------------------------
console.log('\n-- C2. advanceCityEconomy: glina 40, Cegielnia+Garncarnia (tor realny) --');
{
  const glinaStock = { glina: 40, drewno: 40, zloto: 10 };
  const real = runTick(['cegielnia', 'garncarnia'], false, glinaStock);
  const s = real.city.surowce ?? {};
  assert((s.cegla ?? 0) > 0, `tor realny: cegla > 0 (got ${s.cegla})`);
  assert((s.ceramika ?? 0) > 0, `tor realny: ceramika > 0 (got ${s.ceramika})`);
  assert((s.glina ?? 0) >= 0 && (s.glina ?? 0) < 40,
    `tor realny: glina zmalala i nie jest ujemna (got ${s.glina})`);
}

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

// Rownina bazowo JUZ ma drewno=10/kamien=5 na pole w terrain-yields.json (x5,
// R-EKONOMIA-SUROWCE-SKALA-5X-Q1 Runda 2, Maciej 2026-08-13, B1 -- bylo drewno=2/kamien=1;
// przed E1 nigdzie nieodczytywane w cityYieldPerTurn) -- weryfikujemy sume z 6 pol.
const yldNoForest = M.cityYieldPerTurn(city, tiles6, [], pNormal, makeCtx({}));
// Baza z danych (decyzja 2026-11-19 pkt 1: obowiązują DANE, nie stare x5).
eq(yldNoForest.drewnoTerenu, 6 * RWD.Drewno, `cityYieldPerTurn: 6 pol Rownina (baza drewno=${RWD.Drewno} z danych) -> drewnoTerenu = ${6 * RWD.Drewno}`);
eq(yldNoForest.kamienTerenu, 6 * RWD.Kamień, `cityYieldPerTurn: 6 pol Rownina (baza kamien=${RWD.Kamień} z danych) -> kamienTerenu = ${6 * RWD.Kamień}`);

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
  'Cegielnia/Garncarnia/odlewnia_brazu MAJA budynek (Garncarnia = konwerter Ceramiki, PYTANIE-84)');

// ---------------------------------------------------------------------------
// G. GLINA-Q1=A (2026-07-20): glinianka daje glina/ture, dokladnie jak drewno/kamien
// (bonus.glina x5 -> 10, R-EKONOMIA-SUROWCE-SKALA-5X-Q1 Runda 2, Maciej 2026-08-13, B1; bylo 2)
// ---------------------------------------------------------------------------
console.log('\n-- G. cityYieldPerTurn: glinaTerenu z glinianki (GLINA-Q1=A) --');
const clayTile = { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false, ulepszenieKey: 'glinianka' };
const yClay = M.tileYield(clayTile);
eq(yClay.glina, 10, 'tileYield: glinianka daje glina=10 (bonus stala ilosc x5, bylo 2)');

const plainTile = { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false };
const yPlain = M.tileYield(plainTile);
eq(yPlain.glina, 0, 'tileYield: teren bez glinianki -> glina=0 (baza terenu nie daje gliny)');

const yldClay = M.cityYieldPerTurn(city, [clayTile, clayTile], [], pNormal, makeCtx({}));
eq(yldClay.glinaTerenu, 20, 'cityYieldPerTurn: 2 pola z glinianka -> glinaTerenu = 20 (2 x 10/ture, x5)');

// ---------------------------------------------------------------------------
// H. Cegielnia + Garncarnia produkują z gliny+drewna (PYTANIE-84 U-14);
// odlewnia_brazu NIE bez rudy.
// ---------------------------------------------------------------------------
console.log('\n-- H. Cegielnia + Garncarnia produkują; odlewnia_brazu NIE bez rudy --');

// P-KONWERTERY-PRZEPUSTOWOSC-Q1 (Maciej 2026-08-12): stock podniesiony 20->40 --
// Cegielnia (throughput 10, 2 glina/cykl) sama potrafi wchłonąć 20 gliny w jednym
// ticku (recepty biegną po kolei, Cegielnia PRZED Garncarnią w DEFAULT_CONVERTER_RECIPES);
// przy starym stocku=20 Garncarnia zostawała bez gliny (0 cykli). 40 daje margines dla obu.
const withCegielniaGarncarnia = simulateConverterTick(
  ['cegielnia', 'garncarnia'],
  { glina: 40, drewno: 40 },
);
assert(withCegielniaGarncarnia.stores.cegla > 0,
  `Cegielnia: cegla > 0 przy glina+drewno obecnych (got ${withCegielniaGarncarnia.stores.cegla})`);
assert(withCegielniaGarncarnia.stores.ceramika > 0,
  `Garncarnia: ceramika > 0 przy glina+drewno (got ${withCegielniaGarncarnia.stores.ceramika})`);
assert(withCegielniaGarncarnia.stores.glina < 20,
  'Cegielnia+Garncarnia: glina zmalala (skonsumowana przez oba konwertery)');

// Bez budynkow: mimo obecnosci gliny+drewna w magazynie nic sie nie produkuje (gating builtIds).
const withoutBuildings = simulateConverterTick([], { glina: 8, drewno: 8 });
eq(withoutBuildings.stores.cegla, undefined, 'brak Cegielni: brak cegly (converter nieaktywny)');
eq(withoutBuildings.stores.ceramika, undefined, 'brak Garncarni jako konwertera: brak ceramiki');
eq(withoutBuildings.stores.glina, 8, 'brak budynkow: glina niezmieniona');

// odlewnia_brazu zbudowana + drewno obecne, ale BEZ rudy (GLINA-Q2=A: rudy nie zbieramy) ->
// braz NIE rosnie (limitWejscia=0 bo have('ruda')=0), niezaleznie od gliny/cegielni/garncarni.
// Stock 40 (patrz komentarz wyżej przy withCegielniaGarncarnia) -- odlewnia_brazu
// samo nie zużywa gliny (tylko ruda+drewno), więc nie wpływa na ten rachunek.
const withOdlewniaNoOre = simulateConverterTick(
  ['odlewnia_brazu', 'cegielnia', 'garncarnia'],
  { glina: 40, drewno: 40 },
);
eq(withOdlewniaNoOre.stores.braz, undefined,
  'odlewnia_brazu zbudowana ale brak rudy w magazynie -> braz NIE rosnie (undefined, brak-wejscia)');
assert(withOdlewniaNoOre.stores.cegla > 0,
  'odlewnia_brazu bez rudy NIE blokuje Cegielni (cegla > 0)');
// Garncarnia w tym scenariuszu dostaje 0 gliny: Cegielnia (wcześniej w DEFAULT_CONVERTER_RECIPES) zjada całą glinę
// z magazynu 40 w jednym ticku. To ZNALEZISKO gry (kolejność konwerterów), NIE błąd testu -- asercja
// "ceramika > 0" wyżej (Garncarnia) zostaje CZERWONA i opisana w raporcie.

// Sanity: gdyby ruda BYLA w magazynie (nie zbierana dzis, ale receptura istnieje), odlewnia
// zadzialalaby -- potwierdza, ze brak braz wyzej wynika z braku rudy, nie ze zlej receptury.
const withOdlewniaWithOre = simulateConverterTick(['odlewnia_brazu'], { ruda: 4, drewno: 4, ruda_cyny: 1 });
assert(withOdlewniaWithOre.stores.braz > 0,
  `kontrola: odlewnia_brazu Z ruda w magazynie -> braz > 0 (got ${withOdlewniaWithOre.stores.braz}) -- receptura sama w sobie sprawna`);

// --- summary ---------------------------------------------------------------
console.log(`\nmennica-magazyn-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
