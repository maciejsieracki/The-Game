'use strict';
/**
 * waluta-mennica-test.cjs -- standalone Node test for EFEKT 1 SCALONY (decyzja
 * Maciej 2026-07-25): "Podwojenie handlu i zamiana na pieniądz następuje w
 * momencie, gdy po pierwsze odkryjemy walutę, a po drugie postawimy mennicę."
 *
 * Kontrakt (przed 2026-07-25 byly DWA osobne mnozniki -- teraz JEDEN):
 *   - Bramka AND: ctx.walutaOdkryta === true ORAZ ctx.maMennica === true.
 *     Sam tech Waluty (bez Mennicy) juz NIE wystarcza -- to jest sedno zmiany.
 *   - Wartosc mnoznika = params.mennicaMnoznikPoWalucie (globalne.mennica_mnoznik_po_walucie
 *     w econ-params.json): easy x2,0 / normal x1,5 / hard x1,0 (brak efektu na hard).
 *   - Mnoznik dziala na CALY handelNetto PRZED podzialem suwakiem -- Pieniadz,
 *     Nauka i Zamoznosc (Luksus) rosna RAZEM (wariant A, decyzja wlasciciela).
 *   - Efekt Targowiska (Praca->Pieniadz, targowiskoPracaMnoznik) jest OSOBNYM
 *     strumieniem, nie wymaga Mennicy, NIE zostal ruszony przez ta decyzje.
 *   - PARYTET AI: formula nie ma zadnej galezi po ownerId.
 *
 * Run from gra/:  node tools/waluta-mennica-test.cjs
 * Self-contained: bundluje economy.ts + turn-economy.ts + generator mapy z esbuild.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[waluta-mennica-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.waluta-mennica-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.waluta-mennica-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { cityYieldPerTurn, loadEconParams, mnoznikHandelPieniadzForCiv, mnoznikHandelPieniadzForCivByDifficulty } from '../src/game/economy';
export { buildEconParams, advanceCityEconomy } from '../src/game/turn-economy';
export { generateMap } from '../src/map/generator';
export { foundCityAt, canFoundCity } from '../src/game/cities';
export { eraBuildingCatalog } from '../src/game/production';
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
  console.error('[waluta-mennica-test] esbuild bundling failed:\n', e.message || e);
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

const pEasy   = M.loadEconParams(econParamsRaw, 'easy');
const pNormal = M.loadEconParams(econParamsRaw, 'normal');
const pHard   = M.loadEconParams(econParamsRaw, 'hard');

// ---------------------------------------------------------------------------
// 0. Wartosci parametru w econ-params.json (sanity, dowod ze JSON niesie decyzje
//    wlasciciela: easy x2,0 / normal x1,5 / hard x1,0).
// ---------------------------------------------------------------------------
console.log('\n-- 0. mennica_mnoznik_po_walucie w econ-params.json --');
eq(pEasy.mennicaMnoznikPoWalucie,   2,   'easy: mennicaMnoznikPoWalucie = 2,0');
eq(pNormal.mennicaMnoznikPoWalucie, 1.5, 'normal: mennicaMnoznikPoWalucie = 1,5');
eq(pHard.mennicaMnoznikPoWalucie,   1,   'hard: mennicaMnoznikPoWalucie = 1,0 (brak efektu, NIE zero)');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
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
    maMennica: false, walutaOdkryta: false,
  }, overrides);
}
const RTILE = { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false };
const tiles20 = Array(20).fill(RTILE);
const city = makeCity();

// ---------------------------------------------------------------------------
// 1. Waluta odkryta, BRAK Mennicy -> mnoznik 1, Handel netto BEZ ZMIAN
//    (to jest sedno zmiany -- sam tech juz nie wystarcza).
// ---------------------------------------------------------------------------
console.log('\n-- 1. Waluta odkryta, brak Mennicy -> mnoznik 1 (BRAK zmiany) --');
const yldBase = M.cityYieldPerTurn(city, tiles20, [], pNormal, makeCtx());
const yldWalutaNoMennica = M.cityYieldPerTurn(city, tiles20, [], pNormal,
  makeCtx({ walutaOdkryta: true, maMennica: false }));
eq(yldWalutaNoMennica.pieniadz, yldBase.pieniadz,
  'Waluta bez Mennicy: Pieniadz identyczny jak bez Waluty (mnoznik=1)');
eq(yldWalutaNoMennica.nauka, yldBase.nauka,
  'Waluta bez Mennicy: Nauka identyczna jak bez Waluty (mnoznik=1)');
eq(yldWalutaNoMennica.luksus, yldBase.luksus,
  'Waluta bez Mennicy: Zamoznosc (Luksus) identyczna jak bez Waluty (mnoznik=1)');

// ---------------------------------------------------------------------------
// 2. Mennica zbudowana, BRAK odkrytej Waluty -> mnoznik 1 (bramka AND, druga strona).
// ---------------------------------------------------------------------------
console.log('\n-- 2. Mennica zbudowana, brak Waluty -> mnoznik 1 --');
const yldMennicaNoWaluta = M.cityYieldPerTurn(city, tiles20, [], pNormal,
  makeCtx({ walutaOdkryta: false, maMennica: true }));
eq(yldMennicaNoWaluta.pieniadz, yldBase.pieniadz,
  'Mennica bez Waluty: Pieniadz identyczny jak baseline (mnoznik=1)');
eq(yldMennicaNoWaluta.nauka, yldBase.nauka,
  'Mennica bez Waluty: Nauka identyczna jak baseline (mnoznik=1)');

// ---------------------------------------------------------------------------
// 3. Waluta + Mennica na NORMAL -> Handel netto x1,5; Pieniadz, Nauka I Zamoznosc
//    rosna RAZEM (wariant A -- mnoznik dziala PRZED podzialem suwakiem).
// ---------------------------------------------------------------------------
console.log('\n-- 3. Waluta + Mennica, normal -> x1,5 na Pieniadz+Nauka+Zamoznosc --');
const yldNormalBoth = M.cityYieldPerTurn(city, tiles20, [], pNormal,
  makeCtx({ walutaOdkryta: true, maMennica: true }));
// handelBrutto = 20 (20 pol Rownina, brak Targowiska); handelNetto = 20*1.5 = 30
// pieniadz = floor(30*0.70) = 21; nauka = floor(30*0.20) = 6; luksus = floor(30*0.10) = 3
eq(yldNormalBoth.pieniadz, 21, 'normal x1,5: Pieniadz = floor(30*0.70) = 21');
eq(yldNormalBoth.nauka,     6, 'normal x1,5: Nauka = floor(30*0.20) = 6');
eq(yldNormalBoth.luksus,    3, 'normal x1,5: Zamoznosc (Luksus) = floor(30*0.10) = 3');
assert(yldNormalBoth.pieniadz > yldBase.pieniadz, 'normal x1,5: Pieniadz > baseline');
assert(yldNormalBoth.nauka    > yldBase.nauka,    'normal x1,5: Nauka > baseline (wariant A)');
assert(yldNormalBoth.luksus   > yldBase.luksus,   'normal x1,5: Zamoznosc > baseline (wariant A)');

// ---------------------------------------------------------------------------
// 4. Waluta + Mennica na HARD -> BRAK efektu (x1,0) -- decyzja wlasciciela.
// ---------------------------------------------------------------------------
console.log('\n-- 4. Waluta + Mennica, hard -> BRAK efektu (x1,0) --');
const yldHardBase = M.cityYieldPerTurn(city, tiles20, [], pHard, makeCtx());
const yldHardBoth = M.cityYieldPerTurn(city, tiles20, [], pHard,
  makeCtx({ walutaOdkryta: true, maMennica: true }));
eq(yldHardBoth.pieniadz, yldHardBase.pieniadz, 'hard: Pieniadz z Waluta+Mennica = Pieniadz bez nich (brak efektu)');
eq(yldHardBoth.nauka,    yldHardBase.nauka,    'hard: Nauka niezmieniona (brak efektu)');
eq(yldHardBoth.luksus,   yldHardBase.luksus,   'hard: Zamoznosc niezmieniona (brak efektu)');

// ---------------------------------------------------------------------------
// 5. Waluta + Mennica na EASY -> x2,0.
// ---------------------------------------------------------------------------
console.log('\n-- 5. Waluta + Mennica, easy -> x2,0 --');
const yldEasyBoth = M.cityYieldPerTurn(city, tiles20, [], pEasy,
  makeCtx({ walutaOdkryta: true, maMennica: true }));
// handelNetto = 20*2 = 40; pieniadz=floor(40*0.70)=28; nauka=floor(40*0.20)=8; luksus=floor(40*0.10)=4
eq(yldEasyBoth.pieniadz, 28, 'easy x2,0: Pieniadz = floor(40*0.70) = 28');
eq(yldEasyBoth.nauka,     8, 'easy x2,0: Nauka = floor(40*0.20) = 8');
eq(yldEasyBoth.luksus,    4, 'easy x2,0: Zamoznosc (Luksus) = floor(40*0.10) = 4');

// ---------------------------------------------------------------------------
// 6. Tabela skutku (raport): dochod Pieniadz/Nauka/Zamoznosc z Handlu, dla trzech
//    poziomow trudnosci, z Mennica i bez -- wypisane na konsole do raportu.
// ---------------------------------------------------------------------------
console.log('\n-- 6. TABELA SKUTKU (dla raportu) --');
console.log('trudnosc | wariant          | Pieniadz | Nauka | Zamoznosc');
for (const [label, p] of [['easy', pEasy], ['normal', pNormal], ['hard', pHard]]) {
  const bez = M.cityYieldPerTurn(city, tiles20, [], p, makeCtx({ walutaOdkryta: true, maMennica: false }));
  const zM  = M.cityYieldPerTurn(city, tiles20, [], p, makeCtx({ walutaOdkryta: true, maMennica: true  }));
  console.log(`${label.padEnd(8)} | Waluta bez Mennicy | ${String(bez.pieniadz).padStart(8)} | ${String(bez.nauka).padStart(5)} | ${bez.luksus}`);
  console.log(`${label.padEnd(8)} | Waluta + Mennica   | ${String(zM.pieniadz).padStart(8)} | ${String(zM.nauka).padStart(5)} | ${zM.luksus}`);
}

// ---------------------------------------------------------------------------
// 7. PARYTET AI: identyczny wynik dla dwoch roznych ownerId, przez pelny silnik
//    advanceCityEconomy (nie tylko cityYieldPerTurn) -- dowod braku galezi po ownerId.
//    UWAGA: geografia (terrain wokol miasta) legalnie wplywa na dochod, wiec zeby
//    izolowac WYLACZNIE efekt ownerId, uzywamy TEGO SAMEGO miasta (identyczne q/r,
//    identyczne worked tiles) w DWOCH oddzielnych wywolaniach advanceCityEconomy --
//    raz oznaczonego ownerId=0 (gracz), raz ownerId=7 (AI). Roznica w wyniku moglaby
//    powstac WYLACZNIE gdyby kod mial galaz po ownerId -- nie ma.
// ---------------------------------------------------------------------------
console.log('\n-- 7. PARYTET AI: advanceCityEconomy, ownerId=0 (gracz) vs ownerId=7 (AI), to samo miasto --');
const gameData = { civs, econParams: econParamsRaw, societyParams, buildings, units, tech };
const map = M.generateMap(30, 30, 4242, 'kontynenty');
let baseCityForParity = null;
for (const h of Object.values(map.hexes)) {
  const c = { q: h.coords.q, r: h.coords.r };
  if (M.canFoundCity(c.q, c.r, [], map).ok) {
    const city = M.foundCityAt(c.q, c.r, 0, [], map, 'Test');
    if (city) { baseCityForParity = city; break; }
  }
}
if (!baseCityForParity) {
  console.error('FAIL: brak pola ladu do zalozenia miasta testowego parytetu AI');
  failed++;
} else {
  const builtByCity = new Map([[baseCityForParity.id, ['mennica']]]);
  const playerZbadane = new Set(['Waluta']);
  function tickFor(ownerId) {
    const city = { ...baseCityForParity, ownerId };
    const econ = M.advanceCityEconomy(
      [city], map, gameData, 'normal', [], new Map(), builtByCity, 1, playerZbadane, new Map(), new Map(),
    );
    return econ.perCity.find(t => t.cityId === city.id);
  }
  const tickPlayer = tickFor(0);
  const tickAI = tickFor(7);
  assert(!!tickPlayer && !!tickAI, 'parytet AI: oba przebiegi zwracaja wpis perCity');
  if (tickPlayer && tickAI) {
    eq(tickAI.pieniadzBrutto, tickPlayer.pieniadzBrutto,
      `parytet AI: pieniadzBrutto identyczny dla ownerId=0 i ownerId=7, to samo miasto (${tickPlayer.pieniadzBrutto})`);
    eq(tickAI.nauka, tickPlayer.nauka,
      `parytet AI: nauka identyczna dla ownerId=0 i ownerId=7 (${tickPlayer.nauka})`);
    eq(tickAI.luksus, tickPlayer.luksus,
      `parytet AI: luksus identyczny dla ownerId=0 i ownerId=7 (${tickPlayer.luksus})`);
    assert(tickPlayer.pieniadzBrutto > 0, `parytet AI: sanity -- pieniadzBrutto > 0 (Mennica+Waluta aktywne, got ${tickPlayer.pieniadzBrutto})`);
  }
}

// ---------------------------------------------------------------------------
// 8. Targowisko: efekt Praca->Pieniadz (targowiskoPracaMnoznik) dziala NIEZALEZNIE
//    od bramki Waluta+Mennica i sie NIE dubluje z nowym mnoznikiem scalonym.
// ---------------------------------------------------------------------------
console.log('\n-- 8. Targowisko: efekt Praca->Pieniadz niezalezny, bez podwojnego liczenia --');
const tiles6 = Array(6).fill(RTILE);
// (a) Targowisko + Waluta, BEZ Mennicy: Efekt2 (Praca->Pieniadz) MUSI dzialac
//     (nie wymaga Mennicy), Efekt1 scalony (Handel netto) MUSI byc nieaktywny.
const ctxTargNoMennica = makeCtx({ walutaOdkryta: true, maTargowisko: true, maMennica: false });
const yldTargNoMennica = M.cityYieldPerTurn(city, tiles6, [], pNormal, ctxTargNoMennica);
assert(yldTargNoMennica.pieniadzZPracy > 0,
  `Targowisko+Waluta bez Mennicy: pieniadzZPracy > 0 (Efekt2 niezalezny od Mennicy, got ${yldTargNoMennica.pieniadzZPracy})`);

// (b) Ten sam ctx ALE z Mennica: pieniadzZPracy (strumien Efekt2, z doPuli) MUSI
//     pozostac IDENTYCZNY -- gdyby scalony mnoznik "przeciekal" na Efekt2, dublowalby
//     sie z wlasnym mnoznikiem Targowiska (targowiskoPracaMnoznik), co jest zakazane.
const ctxTargZMennica = makeCtx({ walutaOdkryta: true, maTargowisko: true, maMennica: true });
const yldTargZMennica = M.cityYieldPerTurn(city, tiles6, [], pNormal, ctxTargZMennica);
eq(yldTargZMennica.pieniadzZPracy, yldTargNoMennica.pieniadzZPracy,
  'Targowisko: pieniadzZPracy IDENTYCZNY z i bez Mennicy -- brak podwojnego liczenia z Efektem 1 scalonym');
// Natomiast pieniadzZHandlu (strumien Efekt1) MUSI wzrosnac z Mennica -- dowod ze
// oba efekty dzialaja na ROZNYCH strumieniach jednoczesnie, bez interferencji.
assert(yldTargZMennica.pieniadz > yldTargNoMennica.pieniadz,
  'Targowisko+Mennica: pieniadz total wyzszy niz bez Mennicy (Efekt1 dziala na strumieniu Handlu, Efekt2 na strumieniu Pracy, oba naraz)');

// ---------------------------------------------------------------------------
// 9. PYTANIE 69 (Maciej 2026-07-25): mnoznik cywilizacyjny SKALOWANY TRUDNOSCIA.
//    civs.json niesie wartosc NORMAL; easy = wartosc+0.5; hard = wartosc-0.5.
//    Fenicjanie (najwyzszy, 2.6) i Germanie (najnizszy, 1.7) -- liczby z raportu.
// ---------------------------------------------------------------------------
console.log('\n-- 9. Mnoznik cywilizacyjny skalowany trudnoscia (pytanie 69) --');
function closeTo(a, b, msg, eps) {
  eps = eps === undefined ? 1e-9 : eps;
  assert(Math.abs(a - b) < eps, `${msg} (got ${a}, want ~${b})`);
}
closeTo(M.mnoznikHandelPieniadzForCivByDifficulty('fenicjanie', civs, 'easy',   pEasy.mennicaMnoznikPoWalucie),   3.1, 'Fenicjanie easy = 3,1 (2,6+0,5)');
closeTo(M.mnoznikHandelPieniadzForCivByDifficulty('fenicjanie', civs, 'normal', pNormal.mennicaMnoznikPoWalucie), 2.6, 'Fenicjanie normal = 2,6 (wartosc civs.json, bez zmian)');
closeTo(M.mnoznikHandelPieniadzForCivByDifficulty('fenicjanie', civs, 'hard',   pHard.mennicaMnoznikPoWalucie),   2.1, 'Fenicjanie hard = 2,1 (2,6-0,5)');
closeTo(M.mnoznikHandelPieniadzForCivByDifficulty('germanie',   civs, 'easy',   pEasy.mennicaMnoznikPoWalucie),   2.2, 'Germanie easy = 2,2 (1,7+0,5)');
closeTo(M.mnoznikHandelPieniadzForCivByDifficulty('germanie',   civs, 'normal', pNormal.mennicaMnoznikPoWalucie), 1.7, 'Germanie normal = 1,7 (wartosc civs.json, bez zmian)');
closeTo(M.mnoznikHandelPieniadzForCivByDifficulty('germanie',   civs, 'hard',   pHard.mennicaMnoznikPoWalucie),   1.2, 'Germanie hard = 1,2 (1,7-0,5)');
// civs.json NIE zmieniony przez tę deceyzję -- sanity, wartości normal muszą pochodzić z pliku.
eq(civs.cywilizacje.find(c => c.ikonaId === 'fenicjanie').mnoznikHandelPieniadz, 2.6, 'civs.json Fenicjanie mnoznikHandelPieniadz NIETKNIETY = 2,6');
eq(civs.cywilizacje.find(c => c.ikonaId === 'germanie').mnoznikHandelPieniadz,   1.7, 'civs.json Germanie mnoznikHandelPieniadz NIETKNIETY = 1,7');

// ---------------------------------------------------------------------------
// 10. Cywilizacja BEZ wpisu w civs.json -> wartosc zapasowa, TEZ skalowana
//     trudnoscia. Fallback = params.mennicaMnoznikPoWalucie (juz per-trudnosc
//     w econ-params.json: easy 2,0 / normal 1,5 / hard 1,0) -- NIE dostaje
//     DRUGIEJ warstwy delty (bez tego easy wyszloby 2,5 zamiast 2,0 -- podwojne
//     skalowanie, zakazane).
// ---------------------------------------------------------------------------
console.log('\n-- 10. Cywilizacja bez wpisu w civs.json -> fallback skalowany trudnoscia --');
eq(M.mnoznikHandelPieniadzForCivByDifficulty('nieznana-cywilizacja-xyz', civs, 'easy',   pEasy.mennicaMnoznikPoWalucie),   2,   'Brak wpisu, easy: fallback = 2,0 (bez podwojnej delty)');
eq(M.mnoznikHandelPieniadzForCivByDifficulty('nieznana-cywilizacja-xyz', civs, 'normal', pNormal.mennicaMnoznikPoWalucie), 1.5, 'Brak wpisu, normal: fallback = 1,5');
eq(M.mnoznikHandelPieniadzForCivByDifficulty('nieznana-cywilizacja-xyz', civs, 'hard',   pHard.mennicaMnoznikPoWalucie),   1,   'Brak wpisu, hard: fallback = 1,0');
eq(M.mnoznikHandelPieniadzForCivByDifficulty(undefined, civs, 'normal', pNormal.mennicaMnoznikPoWalucie), 1.5, 'civKey undefined: fallback = 1,5 (parytet z brakiem wpisu)');

// ---------------------------------------------------------------------------
// 11. PYTANIE 70/B: Mennica WYLACZNIE w stolicy -- bramka lokalizacji w
//     buildings.json ('lokalizacja':'stolica'), egzekwowana przez
//     eraBuildingCatalog/buildingLocationAllowed (production.ts) -- ten sam
//     mechanizm co Palac (jedyne zrodlo prawdy ADMIN-STOLICA, wspoldzielone
//     przez UI gracza / auto-kolejke / auto-zarzadce / walidacje AI 'build').
// ---------------------------------------------------------------------------
console.log('\n-- 11. Mennica tylko w stolicy (pytanie 70/B) --');
eq(buildings.find(b => b.id === 'mennica').lokalizacja, 'stolica', "buildings.json: Mennica ma lokalizacja='stolica'");
const dataForCatalog = { buildings, units };
const catalogRegional = M.eraBuildingCatalog(dataForCatalog, ['Waluta'], {
  epoch: 2, builtBuildingIds: [], isCapital: false,
});
const mennicaRegional = catalogRegional.find(e => e.id === 'mennica');
assert(!!mennicaRegional, 'eraBuildingCatalog: wpis Mennica istnieje w katalogu epoki 2 (miasto regionalne)');
eq(mennicaRegional.status, 'locked', 'Miasto REGIONALNE (isCapital=false): Mennica zablokowana');
eq(mennicaRegional.locationBlocked, 'stolica', "Miasto REGIONALNE: locationBlocked='stolica' (powod blokady = lokalizacja)");
const catalogCapital = M.eraBuildingCatalog(dataForCatalog, ['Waluta'], {
  epoch: 2, builtBuildingIds: [], isCapital: true,
});
const mennicaCapital = catalogCapital.find(e => e.id === 'mennica');
assert(!!mennicaCapital, 'eraBuildingCatalog: wpis Mennica istnieje w katalogu epoki 2 (stolica)');
assert(mennicaCapital.locationBlocked === undefined, 'STOLICA (isCapital=true): locationBlocked=undefined (lokalizacja NIE jest powodem blokady)');
assert(mennicaCapital.status !== 'locked' || mennicaCapital.locationBlocked === undefined,
  'STOLICA: jesli cokolwiek blokuje Mennice, to NIE lokalizacja (np. inny prereq niezaleznie sprawdzany gdzie indziej)');

// ---------------------------------------------------------------------------
// 12. PYTANIE 71/C (sedno zmiany): Mennica w STOLICY + Waluta odkryta ->
//     mnoznik dziala WE WSZYSTKICH miastach tego wlasciciela, takze
//     REGIONALNYCH bez wlasnej Mennicy. Bez Mennicy NIGDZIE w imperium ->
//     mnoznik 1 wszedzie. Test przez PELNY silnik advanceCityEconomy (2
//     miasta tego samego wlasciciela).
// ---------------------------------------------------------------------------
console.log('\n-- 12. Mennica w stolicy -> mnoznik obejmuje CALA cywilizacje (pytanie 71/C) --');
function findTwoCitySites(map) {
  const sites = [];
  const tmpCities = [];
  for (const h of Object.values(map.hexes)) {
    const c = { q: h.coords.q, r: h.coords.r };
    if (M.canFoundCity(c.q, c.r, tmpCities, map).ok) {
      const city = M.foundCityAt(c.q, c.r, 0, tmpCities, map, `Test${sites.length}`);
      if (city) { sites.push(city); tmpCities.push(city); }
    }
    if (sites.length >= 2) break;
  }
  return sites;
}
const mapC = M.generateMap(40, 40, 9191, 'kontynenty');
const twoCities = findTwoCitySites(mapC);
if (twoCities.length < 2) {
  console.error('FAIL: brak dwoch pol ladu odleglych od siebie do zalozenia miast testu C');
  failed++;
} else {
  const [capitalCity, regionalCity] = twoCities;
  const gameDataC = { civs, econParams: econParamsRaw, societyParams, buildings, units, tech };
  const zbadaneWaluta = new Set(['Waluta']);
  // (a) Mennica TYLKO w stolicy -- miasto regionalne bez wlasnej Mennicy.
  const builtWithCapitalMennica = new Map([
    [capitalCity.id, ['mennica']],
    [regionalCity.id, []],
  ]);
  function tick(builtByCity, ownerId) {
    const cities = [
      { ...capitalCity, ownerId },
      { ...regionalCity, ownerId },
    ];
    const econ = M.advanceCityEconomy(
      cities, mapC, gameDataC, 'normal', [], new Map(), builtByCity, 1, zbadaneWaluta, new Map(), new Map(),
    );
    return {
      capital:  econ.perCity.find(t => t.cityId === capitalCity.id),
      regional: econ.perCity.find(t => t.cityId === regionalCity.id),
    };
  }
  const withMennica = tick(builtWithCapitalMennica, 0);
  const noMennicaAnywhere = tick(new Map([[capitalCity.id, []], [regionalCity.id, []]]), 0);
  assert(!!withMennica.regional && !!noMennicaAnywhere.regional, 'sanity: oba przebiegi zwracaja wpis dla miasta regionalnego');
  if (withMennica.regional && noMennicaAnywhere.regional) {
    assert(withMennica.regional.pieniadzBrutto > noMennicaAnywhere.regional.pieniadzBrutto,
      `Miasto REGIONALNE (bez wlasnej Mennicy) dostaje mnoznik gdy STOLICA ma Mennice + Waluta odkryta ` +
      `(z Mennica ${withMennica.regional.pieniadzBrutto} > bez ${noMennicaAnywhere.regional.pieniadzBrutto})`);
  }
  // (b) Brak Mennicy W CALYM IMPERIUM -> mnoznik 1 wszedzie (regionalne i "stolica" identyczne
  //     z runem bez Waluty -- dowod ze bramka jest realnie zamknieta, nie tylko nizsza).
  const noMennicaNoWaluta = (() => {
    const cities = [{ ...capitalCity, ownerId: 0 }, { ...regionalCity, ownerId: 0 }];
    const econ = M.advanceCityEconomy(
      cities, mapC, gameDataC, 'normal', [], new Map(), new Map([[capitalCity.id, []], [regionalCity.id, []]]),
      1, new Set(), new Map(), new Map(),
    );
    return {
      capital:  econ.perCity.find(t => t.cityId === capitalCity.id),
      regional: econ.perCity.find(t => t.cityId === regionalCity.id),
    };
  })();
  if (noMennicaAnywhere.capital && noMennicaNoWaluta.capital) {
    eq(noMennicaAnywhere.capital.pieniadzBrutto, noMennicaNoWaluta.capital.pieniadzBrutto,
      'Brak Mennicy w calym imperium: pieniadzBrutto (stolica) identyczny z/bez Waluty odkrytej (mnoznik=1)');
  }
  if (noMennicaAnywhere.regional && noMennicaNoWaluta.regional) {
    eq(noMennicaAnywhere.regional.pieniadzBrutto, noMennicaNoWaluta.regional.pieniadzBrutto,
      'Brak Mennicy w calym imperium: pieniadzBrutto (regionalne) identyczny z/bez Waluty odkrytej (mnoznik=1)');
  }

  // -------------------------------------------------------------------------
  // 13. STARY ZAPIS: Mennica stojaca w miescie REGIONALNYM (sprzed zmiany 70/B)
  //     NIE wywala silnika -- budynek zostaje, nadal aktywuje mnoznik imperium.
  //     Bramka lokalizacji (sekcja 11) dotyczy WYLACZNIE budowania NOWYCH,
  //     silnik ekonomii (advanceCityEconomy) nigdy nie sprawdza `lokalizacja`.
  // -------------------------------------------------------------------------
  console.log('\n-- 13. Stary zapis: Mennica w miescie REGIONALNYM nie wywala silnika --');
  let legacyOk = true;
  let legacyResult = null;
  try {
    const builtLegacy = new Map([
      [capitalCity.id, []],           // stolica BEZ Mennicy
      [regionalCity.id, ['mennica']], // regionalne miasto ZE starym zapisem Mennicy
    ]);
    legacyResult = tick(builtLegacy, 0);
  } catch (e) {
    legacyOk = false;
    console.error('  wyjatek:', e && e.message);
  }
  assert(legacyOk, 'Stary zapis (Mennica w miescie regionalnym): advanceCityEconomy NIE rzuca wyjatku');
  if (legacyOk && legacyResult && legacyResult.capital && withMennica.capital) {
    assert(legacyResult.capital.pieniadzBrutto > noMennicaAnywhere.capital.pieniadzBrutto,
      'Stary zapis: Mennica w regionalnym miescie WCIAZ aktywuje mnoznik dla CALEGO imperium (w tym stolicy)');
  }

  // -------------------------------------------------------------------------
  // 14. PARYTET AI (rozszerzony, mnoznik cywilizacyjny): ownerId=0 vs ownerId=9,
  //     TA SAMA cywilizacja (fenicjanie) -> identyczny wynik. Dowod ze
  //     resolveWalutaMnoznikOverride/ownersWithMennica nie maja galezi po ownerId.
  // -------------------------------------------------------------------------
  console.log('\n-- 14. Parytet AI: mnoznik cywilizacyjny identyczny dla gracza i AI (ta sama cyw.) --');
  function tickWithCiv(ownerId) {
    const cities = [{ ...capitalCity, ownerId }, { ...regionalCity, ownerId }];
    const builtByCity = new Map([[capitalCity.id, ['mennica']], [regionalCity.id, []]]);
    const ownerCivMap = new Map([[ownerId, 'fenicjanie']]);
    const econ = M.advanceCityEconomy(
      cities, mapC, gameDataC, 'normal', [], new Map(), builtByCity, 1, zbadaneWaluta, ownerCivMap, new Map(),
    );
    return econ.perCity.find(t => t.cityId === regionalCity.id);
  }
  const parityPlayer = tickWithCiv(0);
  const parityAI = tickWithCiv(9);
  assert(!!parityPlayer && !!parityAI, 'parytet AI (cyw.): oba przebiegi zwracaja wpis dla miasta regionalnego');
  if (parityPlayer && parityAI) {
    eq(parityAI.pieniadzBrutto, parityPlayer.pieniadzBrutto,
      `parytet AI (Fenicjanie, mnoznik 2,6 normal): pieniadzBrutto identyczny dla ownerId=0 i ownerId=9 (${parityPlayer.pieniadzBrutto})`);
  }

  // -------------------------------------------------------------------------
  // 15. Override z religii NADAL dziala spojnie po zmianie bramki na
  //     imperium-wide (Maciej 2026-07-25): gdy stolica ma Mennice + Waluta
  //     odkryta ORAZ dominujaca religia miasta = religia wlasnej cywilizacji,
  //     mnoznik z religii (civBaseMultiplier z civs.json, NIEskalowany
  //     trudnoscia -- zachowanie SPRZED dzisiejszej decyzji 69, nietkniete)
  //     ma pierwszenstwo przed civ+trudnosc. Bez dominujacej religii ->
  //     spada z powrotem na civ+trudnosc (bez zmian vs sekcja 12/14).
  // -------------------------------------------------------------------------
  console.log('\n-- 15. Override z religii dziala spojnie (bramka Mennica -> imperium-wide) --');
  function tickWithReligion(cityReligionByCityId) {
    const cities = [{ ...capitalCity, ownerId: 0 }, { ...regionalCity, ownerId: 0 }];
    const builtByCity = new Map([[capitalCity.id, ['mennica']], [regionalCity.id, []]]);
    const ownerCivMap = new Map([[0, 'fenicjanie']]);
    const econ = M.advanceCityEconomy(
      cities, mapC, gameDataC, 'easy', [], new Map(), builtByCity, 1, zbadaneWaluta, ownerCivMap,
      new Map(), undefined, undefined, 'wysoki', new Map(), new Map(), cityReligionByCityId,
    );
    return econ.perCity.find(t => t.cityId === regionalCity.id);
  }
  // (a) BEZ religii dominujacej -> civ+trudnosc (Fenicjanie easy = 3,1), jak w sekcji 12/14.
  const noReligion = tickWithReligion(new Map());
  // (b) Religia miasta W CALOSCI "Religia fenicka (Ba'al)" (Fenicjanie) -> dominuje,
  //     override z religii uzywa civBaseMultiplier SUROWY z civs.json (2,6, BEZ +0,5 easy).
  const dominantReligionState = new Map([
    [regionalCity.id, { counts: { "Religia fenicka (Ba'al)": 100 } }],
  ]);
  const withReligion = tickWithReligion(dominantReligionState);
  assert(!!noReligion && !!withReligion, 'sanity: oba przebiegi (z/bez religii) zwracaja wpis');
  if (noReligion && withReligion) {
    assert(withReligion.pieniadzBrutto !== noReligion.pieniadzBrutto,
      `Override z religii ZMIENIA wynik vs plaski civ+trudnosc (dominujaca religia: ${withReligion.pieniadzBrutto} vs civ+trudnosc easy 3,1: ${noReligion.pieniadzBrutto}) -- ` +
      'dowod ze bramka imperium-wide (Mennica w stolicy + Waluta) nadal otwiera override religii dla miasta REGIONALNEGO bez wlasnej Mennicy');
  }
}

// --- summary ---------------------------------------------------------------
console.log(`\nwaluta-mennica-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
