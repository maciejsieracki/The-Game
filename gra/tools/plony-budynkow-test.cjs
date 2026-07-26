'use strict';
/**
 * plony-budynkow-test.cjs -- naprawa 2026-07-25: budynki miasta musza dodawac Prace,
 * Pieniadz, Zywnosc, Nauke i Kulture w silniku (nie tylko w interfejsie).
 *
 * Przed naprawa: advanceCityEconomy / previewCityEconomy / cityPanel "Bilans plonow"
 * przekazywaly do cityYieldPerTurn() pusta tablice cityBuildings ([]) -- krok 4
 * (suma bazowych plonow budynkow) nigdy nie mial nic do zsumowania. Naprawa dodaje
 * economy.ts::cityBuildingEntriesFromBuiltIds() -- jedno zrodlo listy { record, level }
 * z builtIds + katalogu + epoki miasta, uzywane we WSZYSTKICH trzech miejscach.
 *
 * Run z gra/:  node tools/plony-budynkow-test.cjs
 * Self-contained: bundluje economy.ts / production.ts / turn-economy.ts / cities.ts /
 * map/generator.ts z esbuild (bez runtime importow poza node).
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[plony-budynkow-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.plony-budynkow-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.plony-budynkow-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  cityYieldPerTurn,
  cityBuildingEntriesFromBuiltIds,
  buildingValue,
  buildingHappinessAtLevel,
  sumBuildingHappiness,
  sumBuildingHappinessFromBuiltIds,
} from '../src/game/economy';
export { buildingLevelForEpoch } from '../src/game/production';
export { buildEconParams, advanceCityEconomy } from '../src/game/turn-economy';
export { generateMap } from '../src/map/generator';
export { foundCityAt, canFoundCity } from '../src/game/cities';
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
  console.error('[plony-budynkow-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const econParamsRaw  = require('../data/econ-params.json');
const civs           = require('../data/civs.json');
const societyParams  = require('../data/society-params.json');
const buildings      = require('../data/buildings.json');
const units          = require('../data/units.json');
const tech           = require('../data/tech.json');

const gameData = { civs, econParams: econParamsRaw, societyParams, buildings, units, tech };
const params = M.buildEconParams(gameData, 'normal');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; console.log('PASS:', msg); } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function rec(id) {
  const r = buildings.find(b => b.id === id);
  if (!r) throw new Error(`buildings.json: brak budynku "${id}"`);
  return r;
}

function makeCity(overrides) {
  return Object.assign({
    id: 'c1', ludnosc: 5, zdrowie: 0, czyStolica: true,
    maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0,
    specjalisci: [], kolejkaProdukcji: [],
    podziałHandlu: { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 },
    podziałPracy:  { procentBudynki: 70 },
  }, overrides);
}

/** ctx z WSZYSTKIMI mnoznikami procentowymi wylaczonymi -- izoluje krok 4 (suma
 *  bazowych plonow budynkow) od nazwanych wpiec % (Targowisko/Mlyn/Cegielnia/
 *  Biblioteka), zeby delta praca/pieniadz/nauka/kultura z dodania JEDNEGO budynku
 *  byla dokladnie rowna jego wartosci bazowej z buildings.json -- nie zmieszanej
 *  z osobnym mnoznikiem procentowym (audytowanym oddzielnie, patrz raport). */
function makeCtx(overrides) {
  return Object.assign({
    wojskoZuzycieZywnosci: 0, strataFraction: 0,
    maMlyn: false, maCegielnia: false, maTargowisko: false, maBiblioteka: false,
    maMennica: false, mennicaMnoznik: 1, walutaOdkryta: false, liczbaGarncarni: 0,
  }, overrides);
}

const ROWNINA = { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false };
const worked4 = Array(4).fill(ROWNINA);
const city    = makeCity();
const ctxFlat = makeCtx();

// ---------------------------------------------------------------------------
// A. Miasto BEZ budynkow -> plony wylacznie z terenu (wartosc odniesienia)
// ---------------------------------------------------------------------------
console.log('\n-- A. Miasto bez budynkow: plony wylacznie z terenu (referencja) --');
const yldNone = M.cityYieldPerTurn(city, worked4, [], params, ctxFlat);
eq(yldNone.pracaBudynkow, 0, 'brak budynkow: pracaBudynkow = 0');
eq(yldNone.praca, yldNone.pracaTerenu, 'brak budynkow: praca == pracaTerenu (brak wkladu budynkow)');
eq(yldNone.kultura, 0, 'brak budynkow: kultura = 0 (kultura pochodzi WYLACZNIE z budynkow)');
console.log(`   referencja: praca=${yldNone.praca} pieniadz=${yldNone.pieniadz} zywnosc=${yldNone.zywnosc} nauka=${yldNone.nauka} kultura=${yldNone.kultura}`);

// ---------------------------------------------------------------------------
// Helper: dodaj JEDEN budynek (poziom 1, w jego wlasnej epoce wejscia) i zmierz
// dokladna delte na wybranym polu plonu wzgledem referencji (sekcja A).
// ---------------------------------------------------------------------------
function testSingleBuildingDelta(buildingId, key, label) {
  const r = rec(buildingId);
  const era = r.epokaWejscia;
  const level = M.buildingLevelForEpoch(r.epokaWejscia, era, r.maksPoziom, r.poziomTechGate ?? null, []);
  eq(level, 1, `${buildingId}: poziom w wlasnej epoce wejscia = 1`);
  const cbs = M.cityBuildingEntriesFromBuiltIds([buildingId], buildings, era, []);
  eq(cbs.length, 1, `cityBuildingEntriesFromBuiltIds: znaleziono ${buildingId} w katalogu`);
  eq(cbs[0].level, 1, `cityBuildingEntriesFromBuiltIds: poziom ${buildingId} = 1`);
  const yld = M.cityYieldPerTurn(city, worked4, cbs, params, ctxFlat);
  const expectedDelta = M.buildingValue(r, level, key);
  const actualDelta = yld[key] - yldNone[key];
  eq(actualDelta, expectedDelta, `${label}: ${key} wieksze DOKLADNIE o wartosc budynku poziom 1 (${expectedDelta})`);
  return { yld, expectedDelta, level, record: r };
}

// ---------------------------------------------------------------------------
// B. Stolarnia -> Praca
// ---------------------------------------------------------------------------
console.log('\n-- B. Stolarnia -> Praca --');
testSingleBuildingDelta('stolarnia', 'praca', 'Stolarnia');

// ---------------------------------------------------------------------------
// C. Targowisko -> Pieniadz
//
// POPRAWKA decyzja 67B (Maciej 2026-07-25, cytat: "Budynki, jeżeli miały wcześniej
// handel... powinny go dawać nie bezpośrednio do skarbca, tylko do puli, do
// podziału"): Pieniadz z budynkow NIE trafia juz 1:1 do pola finalnego `pieniadz`
// -- wchodzi do handelBazowy RAZEM z Danina terenowa i przechodzi przez podzial
// suwakiem (miasto testowe: procentPieniadz=70%, procentNauka=20%, procentLuksus=10%,
// patrz makeCity() powyzej). testSingleBuildingDelta() (helper generyczny) zakladal
// "delta == buildingValue" -- ZALOZENIE JUZ NIEPRAWDZIWE dla klucza 'pieniadz' (nadal
// prawdziwe dla praca/nauka/kultura, ktore NIE przechodza przez ten podzial), wiec
// Targowisko ma teraz WLASNY, jawnie wyliczony test zamiast helpera.
// ---------------------------------------------------------------------------
console.log('\n-- C. Targowisko -> Pieniadz (decyzja 67B: dzieli sie suwakiem, nie leci 1:1 do skarbca) --');
{
  const r = rec('targowisko');
  const era = r.epokaWejscia;
  const level = M.buildingLevelForEpoch(r.epokaWejscia, era, r.maksPoziom, r.poziomTechGate ?? null, []);
  eq(level, 1, 'targowisko: poziom w wlasnej epoce wejscia = 1');
  const cbs = M.cityBuildingEntriesFromBuiltIds(['targowisko'], buildings, era, []);
  const yld = M.cityYieldPerTurn(city, worked4, cbs, params, ctxFlat);

  // PYTANIE 20=A (Maciej 2026-07-26): baza.pieniadz 3 -> 5 (dawny przyrost.mnoznik=3
  // byl martwy, przeniesiony tu). Liczby nizej przeliczone na nowa wartosc.
  const rawPieniadzBudynku = M.buildingValue(r, level, 'pieniadz');
  eq(rawPieniadzBudynku, 5, 'sanity: Targowisko poziom 1 daje baza.pieniadz = 5 Pieniadza/ture (buildings.json, PYTANIE 20=A)');

  // Pole SUROWE (przed podzialem/mnoznikami, do UI/debug) -- to nadal 1:1 z
  // buildingValue, niezalezne od suwaka -- patrz komentarz CityYieldResult.pieniadzBudynkow.
  eq(yld.pieniadzBudynkow, rawPieniadzBudynku,
    'Targowisko: pole SUROWE pieniadzBudynkow = buildingValue = 5 (raportowane niezaleznie od podzialu suwakiem)');

  // Pole FINALNE `pieniadz` juz NIE rosnie o cala wartosc budynku (5) -- rachunek
  // reczny (ctxFlat: brak premii Targowiska/Waluty/Mennicy/korupcji, WYLACZNIE
  // podzial suwakiem 70/20/10 Pieniadz/Nauka/Luksus):
  //   handelBazowy (bez budynku) = handelTerenu(4) + pieniadzZPracy(0) + 0            = 4
  //   handelBazowy (z budynkiem) = handelTerenu(4) + pieniadzZPracy(0) + budynek(5)   = 9
  //   pieniadzZHandlu (bez) = floor(4 * 0.70) = floor(2.8) = 2  (yldNone.pieniadz)
  //   pieniadzZHandlu (z)   = floor(9 * 0.70) = floor(6.3) = 6
  //   delta = 6 - 2 = 4   (NIE 5 -- 30% Pieniadza budynku "idzie" do Nauki/Luksusu
  //   przez suwak, dokladnie jak reszta Daniny; NIE jest to prosta proporcja 0.7*5=3.5
  //   bo floor() dziala na SUMIE polaczonej z Danina terenowa, nie osobno na budynku)
  const actualDelta = yld.pieniadz - yldNone.pieniadz;
  eq(actualDelta, 4,
    'Targowisko: delta finalnego Pieniadza = 4 (NIE surowe 5) -- decyzja 67B: Pieniadz budynku dzieli sie suwakiem 70/20/10 z reszta Daniny, nie trafia 1:1 do skarbca');

  // Dowod, ze reszta NIE zniknela -- wzrosla tez Nauka (20% suwaka), bo budynek
  // wszedl do WSPOLNEJ puli Daniny: naukaZHandlu(bez)=floor(4*0.20)=0,
  // naukaZHandlu(z)=floor(9*0.20)=1 -- delta=+1 Nauki z tego samego budynku.
  const deltaNauka = yld.nauka - yldNone.nauka;
  eq(deltaNauka, 1,
    'Targowisko: delta Nauki = +1 (floor(9*0.20)-floor(4*0.20)=1-0) -- czesc Pieniadza budynku trafia teraz tez do Nauki przez suwak, dowod ze idzie do wspolnej puli');
}

// ---------------------------------------------------------------------------
// D. Biblioteka -> Nauka
// ---------------------------------------------------------------------------
console.log('\n-- D. Biblioteka -> Nauka --');
testSingleBuildingDelta('biblioteka', 'nauka', 'Biblioteka');

// ---------------------------------------------------------------------------
// E. Palac -> Kultura
// ---------------------------------------------------------------------------
console.log('\n-- E. Palac -> Kultura --');
testSingleBuildingDelta('palac', 'kultura', 'Palac');

// ---------------------------------------------------------------------------
// F. Poziom budynku rosnie z epoka miasta i plon rosnie razem z nim (Stolarnia,
//    epokaWejscia=1, maksPoziom=3, przyrost.praca=3) -- epoki 1,2,3 -> poziomy 1,2,3.
// ---------------------------------------------------------------------------
console.log('\n-- F. Poziom budynku rosnie z epoka miasta --');
{
  const r = rec('stolarnia');
  let prevPraca = -Infinity;
  let prevLevel = 0;
  for (const cityEpoch of [1, 2, 3, 4]) {
    const cbs = M.cityBuildingEntriesFromBuiltIds(['stolarnia'], buildings, cityEpoch, []);
    const level = cbs[0].level;
    const yld = M.cityYieldPerTurn(city, worked4, cbs, params, ctxFlat);
    const expectedLevel = Math.min(r.maksPoziom, cityEpoch - r.epokaWejscia + 1);
    eq(level, expectedLevel, `Stolarnia epoka ${cityEpoch}: poziom = ${expectedLevel} (maksPoziom=${r.maksPoziom})`);
    assert(level >= prevLevel, `Stolarnia epoka ${cityEpoch}: poziom nie maleje (${level} >= ${prevLevel})`);
    const delta = yld.praca - yldNone.praca;
    assert(delta >= prevPraca, `Stolarnia epoka ${cityEpoch}: Praca z budynku nie maleje z epoka (${delta} >= ${prevPraca === -Infinity ? '-inf' : prevPraca})`);
    if (level > prevLevel) {
      assert(delta > prevPraca, `Stolarnia epoka ${cityEpoch}: poziom wzrosl (${prevLevel}->${level}) -> Praca budynku faktycznie rosnie (${delta} > ${prevPraca === -Infinity ? '-inf' : prevPraca})`);
    }
    prevLevel = level;
    prevPraca = delta;
  }
}

// ---------------------------------------------------------------------------
// G. Zadowolenie z budynkow liczone DOKLADNIE RAZ.
//    Dwie niezalezne sciezki obliczeniowe (cityYieldPerTurn krok 4 -- pole
//    CityYieldResult.zadowolenie -- ORAZ main.ts "SZCZESCIE" -- sumBuildingHappinessFromBuiltIds)
//    licza ta sama wartosc formuly (dowod: identyczny wynik nizej). Gdyby OBIE
//    byly wpiete rownolegle do tego samego licznika zadowolenia miasta, budynki
//    dawalyby podwojne szczescie. Naprawa NIE dotyka main.ts/CityEconomyTick --
//    yld.zadowolenie pozostaje polem "martwym" (nieuzywanym poza tym testem),
//    jedynym zywym kanalem jest sumBuildingHappinessFromBuiltIds (main.ts).
//    Asercja ponizej pilnuje TEGO kontraktu: CityEconomyTick nie ma wlasnego
//    pola "zadowolenie" (tylko "wealthZadowolenie", inny strumien) -- gdyby ktos
//    kiedys dopisal `zadowolenie: yld.zadowolenie` do obiektu tick, test to wylapie.
// ---------------------------------------------------------------------------
console.log('\n-- G. Zadowolenie z budynkow liczone dokladnie raz --');
{
  const happyIds = ['mury', 'swiatynia', 'studnia'];
  const era = 3;
  const cbs = M.cityBuildingEntriesFromBuiltIds(happyIds, buildings, era, []);
  eq(cbs.length, 3, 'znaleziono wszystkie 3 budynki testowe w katalogu');

  const yldHappy = M.cityYieldPerTurn(city, worked4, cbs, params, ctxFlat);
  const sumFromEntries = M.sumBuildingHappiness(cbs);
  const sumFromBuiltIds = M.sumBuildingHappinessFromBuiltIds(
    happyIds, buildings,
    bdef => M.buildingLevelForEpoch(bdef.epokaWejscia, era, bdef.maksPoziom, bdef.poziomTechGate ?? null, []),
  );
  assert(sumFromEntries > 0, `sumBuildingHappiness > 0 dla 3 budynkow (got ${sumFromEntries})`);
  eq(yldHappy.zadowolenie, sumFromEntries, 'cityYieldPerTurn krok 4 (yld.zadowolenie) == sumBuildingHappiness(cityBuildings) -- ta sama formula');
  eq(sumFromBuiltIds, sumFromEntries, 'main.ts kanal (sumBuildingHappinessFromBuiltIds) == kanal economy.ts -- POTWIERDZA ze wpiecie obu naraz podwoiloby zadowolenie');

  // Kontrakt: CityEconomyTick (turn-economy.ts) NIE wystawia wlasnego pola "zadowolenie"
  // (tylko "wealthZadowolenie" -- inny, niezalezny strumien z Wealth). Jesli kiedys
  // ktos dopisze `zadowolenie: yld.zadowolenie` do obiektu tick OBOK zywego kanalu w
  // main.ts (sumBuildingHappinessFromBuiltIds), zadowolenie z budynkow zacznie sie
  // liczyc podwojnie -- ten test to wylapie.
  const turnEconomySrc = fs.readFileSync(path.resolve(GRA, 'src/game/turn-economy.ts'), 'utf8');
  const ifaceMatch = turnEconomySrc.match(/export interface CityEconomyTick \{[\s\S]*?\n\}/);
  assert(!!ifaceMatch, 'znaleziono definicje interface CityEconomyTick w turn-economy.ts');
  const ifaceBody = ifaceMatch ? ifaceMatch[0] : '';
  const hasBareZadowolenie = ifaceBody.split('\n').some(line => line.trim().startsWith('zadowolenie:'));
  assert(!hasBareZadowolenie,
    'CityEconomyTick NIE ma wlasnego pola "zadowolenie" (tylko "wealthZadowolenie") -- budynki licza sie przez main.ts sumBuildingHappinessFromBuiltIds RAZ, nie dwa');
}

// ---------------------------------------------------------------------------
// H0. ZADANIE 2 (2026-07-25, decyzja 4): premia procentowa Nauki -- Akademia
//    +10%, Biblioteka nadal +50%, obie razem stackuja ADDYTYWNIE (1+0.5+0.10=1.60).
//    Uzywa PRAWDZIWYCH budynkow (nauka wylacznie z terenu ROWNINA jest tu 0 --
//    yldNone.nauka=0 -- wiec caly efekt idzie przez naukaBudynkow, po
//    zsumowaniu plonow, DOKLADNIE jak opisuje formula w economy.ts).
//
// POPRAWKA 2026-07-25 (PYTANIE 75 = C, wieczor -- pozniejsza niz ZADANIE 2 powyzej):
// Biblioteka +50% -> +30% (normal), Akademia +10% -> +20% (normal); nadal stackuja
// ADDYTYWNIE: 1 + 0.30 + 0.20 = 1.50. Wspolczynniki w data/econ-params.json:
// budynek_biblioteka_bonus_nauki.normal=0.30, budynek_akademia_bonus_nauki.normal=0.20.
// ---------------------------------------------------------------------------
console.log('\n-- H0. Akademia +20% / Biblioteka +30% do Nauki (PYTANIE 75=C) --');
{
  const bibRec = rec('biblioteka');
  const akaRec = rec('akademia');
  const bibNauka = M.buildingValue(bibRec, 1, 'nauka');
  const akaNauka = M.buildingValue(akaRec, 1, 'nauka');
  eq(bibNauka, 3, 'sanity: Biblioteka poziom 1 daje 3 Nauki (baza, plaski plon)');
  eq(akaNauka, 6, 'sanity: Akademia poziom 1 daje 6 Nauki (baza, plaski plon)');

  const cbsBib = M.cityBuildingEntriesFromBuiltIds(['biblioteka'], buildings, bibRec.epokaWejscia, []);
  const yldBib = M.cityYieldPerTurn(city, worked4, cbsBib, params, makeCtx({ maBiblioteka: true }));
  eq(yldBib.nauka, Math.floor(bibNauka * 1.3), `Biblioteka: +30% do Nauki -- floor(${bibNauka}*1.3)=${Math.floor(bibNauka * 1.3)} (PYTANIE 75=C, bylo +50%/floor(3*1.5)=4)`);

  const cbsAka = M.cityBuildingEntriesFromBuiltIds(['akademia'], buildings, akaRec.epokaWejscia, []);
  const yldAka = M.cityYieldPerTurn(city, worked4, cbsAka, params, makeCtx({ maAkademia: true }));
  const expectedAka = Math.floor(akaNauka * 1.20);
  eq(yldAka.nauka, expectedAka,
    `Akademia: +20% do Nauki -- floor(${akaNauka}*1.20)=${expectedAka} (PYTANIE 75=C, bylo +10%/floor(6*1.10)=6; mnozy TAKZE wlasne 6 pkt Nauki)`);
  console.log(`   Akademia realnie daje ${yldAka.nauka} Nauki/ture (6 wlasnej produkcji + ${yldAka.nauka - akaNauka} z premii +20% na cala pule -- w tym mieście, bez innych zrodel Nauki).`);

  const cbsOba = M.cityBuildingEntriesFromBuiltIds(['biblioteka', 'akademia'], buildings, 1, []);
  const yldOba = M.cityYieldPerTurn(city, worked4, cbsOba, params, makeCtx({ maBiblioteka: true, maAkademia: true }));
  const expectedOba = Math.floor((bibNauka + akaNauka) * 1.50);
  eq(yldOba.nauka, expectedOba,
    `Biblioteka + Akademia razem: +50% do Nauki (addytywnie 30%+20%) -- floor((${bibNauka}+${akaNauka})*1.50)=${expectedOba} (PYTANIE 75=C, bylo +60%/floor(9*1.60)=14)`);
}

// ---------------------------------------------------------------------------
// H. Parytet AI -- advanceCityEconomy musi dawac IDENTYCZNY wynik dla miasta
//    gracza (ownerId=0) i miasta AI (dowolny inny ownerId), przy tych samych
//    budynkach/epoce/technologiach -- zero specjalnej sciezki dla ownerId=0.
//    ZADANIE 2: builtIds obejmuje TERAZ tez 'akademia' -- parytet musi trzymac
//    sie takze z nowa premia +10% aktywna.
// ---------------------------------------------------------------------------
console.log('\n-- H. Parytet AI: advanceCityEconomy identyczny dla gracza i AI --');
{
  const map = M.generateMap(30, 30, 4242, 'kontynenty');
  function firstLandHex() {
    for (const h of Object.values(map.hexes)) {
      const c = { q: h.coords.q, r: h.coords.r };
      if (M.canFoundCity(c.q, c.r, [], map).ok) return c;
    }
    return null;
  }
  const spot = firstLandHex();
  assert(!!spot, 'brak ladu do zalozenia miasta testowego (mapa 30x30 seed 4242)');

  function runTickForOwner(ownerId, builtIds) {
    const cities = [];
    const c = M.foundCityAt(spot.q, spot.r, ownerId, cities, map, 'TestCity');
    cities.push(c);
    const builtByCity = new Map([[c.id, builtIds]]);
    // resolveOwnerEra/resolveOwnerTech STALE (niezalezne od ownerId) -- izoluje
    // dokladnie to, co zmienia sie miedzy graczem i AI (samo ownerId), zeby
    // rozne wartosci playerEra/AI-era nie zamazaly testu parytetu.
    const resolveOwnerEra = () => 2;
    const resolveOwnerTech = () => new Set();
    const econ = M.advanceCityEconomy(
      cities, map, gameData, 'normal', [], new Map(), builtByCity,
      1, new Set(), new Map(), new Map(), resolveOwnerEra, resolveOwnerTech,
    );
    return econ.perCity[0];
  }

  const builtIds = ['stolarnia', 'targowisko', 'biblioteka', 'palac', 'akademia'];
  const tickPlayer = runTickForOwner(0, builtIds);
  const tickAI     = runTickForOwner(7, builtIds);

  eq(tickAI.praca, tickPlayer.praca, 'parytet AI: Praca identyczna (ownerId=0 vs ownerId=7)');
  eq(tickAI.pieniadzBrutto, tickPlayer.pieniadzBrutto, 'parytet AI: Pieniadz brutto identyczny');
  eq(tickAI.nauka, tickPlayer.nauka, 'parytet AI: Nauka identyczna');
  eq(tickAI.kultura, tickPlayer.kultura, 'parytet AI: Kultura identyczna');
  assert(tickPlayer.kultura > 0, `sanity: miasto z Palacem ma Kultura > 0 (got ${tickPlayer.kultura})`);
  assert(tickPlayer.praca > 0, `sanity: miasto ze Stolarnia ma Praca > 0 (got ${tickPlayer.praca})`);
}

// ---------------------------------------------------------------------------
// I. DECYZJA 67B (Maciej 2026-07-25): Pieniadz z budynkow wchodzi do PULI DO
//    PODZIALU, nie bezposrednio do skarbca. Test wymagany przez zadanie:
//      1. podzial suwakiem (20/60/20) -- budynek NIE trafia w 100% do skarbca,
//      2. mnoznik Waluty i Mennicy dziala na ten strumien,
//      3. korupcja redukuje ten strumien,
//      4. brak podwojnego liczenia (suma 3 strumieni po podziale == pula).
//
//    Fixture: 5x Gory (Handel=0/pole -- patrz terrain-yields.json: Gory Handel=0)
//    -- izoluje Pieniadz budynku jako JEDYNE zrodlo Daniny (handelTerenu=0), zeby
//    liczby dzielily sie CZYSTO. Mock budynku z baza.pieniadz=60 (bez Praca/Nauka/
//    Kultura/Zadowolenie, zeby nie mieszac z innymi strumieniami) -- 60 dzieli sie
//    bez reszty przez suwak 20/60/20 (12/36/12) i przez mnoznik Waluty+Mennicy 1.5
//    (90 -> 18/54/18), wiec floor() nigdzie nie "je" wartosci -- latwo zweryfikowac
//    reczne wyliczenia ponizej.
// ---------------------------------------------------------------------------
console.log('\n-- I. Decyzja 67B: Pieniadz z budynkow dzieli sie suwakiem/Waluta+Mennica/korupcja --');
{
  eq(params.mennicaMnoznikPoWalucie, 1.5, 'zalozenie fixture: mennicaMnoznikPoWalucie (normal) = 1.5');
  eq(params.korupcjaCap, 0.50, 'zalozenie fixture: korupcjaCap (normal) = 50%');

  const workedGory = Array.from({ length: 5 }, () => ({
    terenBazowy: 'gory', nakladka: 'brak', maRzeke: false,
  }));

  const cityI = makeCity({
    podziałHandlu: { procentNauka: 20, procentPieniadz: 60, procentLuksus: 20 }, // decyzja 74=A
  });

  // Mock budynku: WYLACZNIE Pieniadz (60/ture), zeby izolowac strumien od Praca/
  // Nauka/Kultura/Zadowolenie -- poziom 1, bez przyrostu.
  const mockBudynekPieniadz = {
    record: {
      id: 'mock_pieniadz', nazwa: 'Mock Pieniadz', kategoria: 'Handel',
      epokaWejscia: 1, maksPoziom: 1,
      baza:     { praca: 0, pieniadz: 60, zywnosc: 0, nauka: 0, kultura: 0, zadowolenie: 0, obrona: 0, mnoznik: 0 },
      przyrost: { praca: 0, pieniadz: 0,  zywnosc: 0, nauka: 0, kultura: 0, zadowolenie: 0, obrona: 0, mnoznik: 0 },
      kosztBudowy: 1, przyrostKosztu: 0, utrzymanie: 0, przyrostUtrzymania: 0, techUnlock: '',
    },
    level: 1,
  };
  const cbsI = [mockBudynekPieniadz];

  function ctxI(overrides) {
    return Object.assign({
      wojskoZuzycieZywnosci: 0, strataFraction: 0,
      maMlyn: false, maCegielnia: false, maTargowisko: false, maBiblioteka: false, maAkademia: false,
      maMennica: false, walutaOdkryta: false, civHandelMult: 1, civNaukaMult: 1, liczbaGarncarni: 0,
    }, overrides);
  }

  // --- I1: podzial suwakiem 20/60/20 -- budynek NIE trafia w 100% do skarbca ---
  const yldSplit = M.cityYieldPerTurn(cityI, workedGory, cbsI, params, ctxI({}));
  eq(yldSplit.pieniadzBudynkow, 60, 'I1 sanity: pieniadzBudynkow (surowe) = 60 (baza mock budynku)');
  // handelBazowy = handelTerenu(0) + pieniadzZPracy(0) + pieniadzBudynkow(60) = 60
  // handelNetto = 60 (brak Targowiska/Waluty/Mennicy/korupcji)
  eq(yldSplit.pieniadz, 36, 'I1: Pieniadz = floor(60 x 0.60) = 36 (60% suwaka, NIE 60 -- budynek NIE trafia w 100% do skarbca)');
  eq(yldSplit.nauka,    12, 'I1: Nauka   = floor(60 x 0.20) = 12 (20% suwaka -- Pieniadz budynku dzieli sie TEZ na Nauke)');
  eq(yldSplit.luksus,   12, 'I1: Luksus  = floor(60 x 0.20) = 12 (20% suwaka -- reszta do puli zamoznosci)');

  // --- I2: mnoznik Waluty i Mennicy dziala na ten strumien (x1.5 na normal) ---
  const yldBezMennicy = M.cityYieldPerTurn(cityI, workedGory, cbsI, params, ctxI({ walutaOdkryta: false, maMennica: false }));
  const yldZMennica   = M.cityYieldPerTurn(cityI, workedGory, cbsI, params, ctxI({ walutaOdkryta: true,  maMennica: true  }));
  eq(yldBezMennicy.pieniadz, 36, 'I2 bez Mennicy: Pieniadz = floor(60 x 0.60) = 36 (referencja)');
  eq(yldZMennica.pieniadz,   54, 'I2 z Waluta+Mennica: Pieniadz = floor((60 x 1.5) x 0.60) = floor(90 x 0.60) = 54 = 36 x 1.5');
  assert(yldZMennica.pieniadz > yldBezMennicy.pieniadz,
    'I2: Waluta+Mennica zwieksza Pieniadz z budynkow (miasto z Mennica ma go WIECEJ niz bez)');
  eq(yldZMennica.pieniadz / yldBezMennicy.pieniadz, params.mennicaMnoznikPoWalucie,
    'I2: stosunek Pieniadz(z Mennica)/Pieniadz(bez) = mennicaMnoznikPoWalucie (1.5) dokladnie -- mnoznik obejmuje w calosci Pieniadz budynkow');

  // --- I3: korupcja redukuje ten strumien ---
  const yldBezKorupcji = M.cityYieldPerTurn(cityI, workedGory, cbsI, params, ctxI({ strataFraction: 0 }));
  const yldZKorupcja   = M.cityYieldPerTurn(cityI, workedGory, cbsI, params, ctxI({ strataFraction: 0.30 }));
  eq(yldBezKorupcji.pieniadz, 36, 'I3 bez korupcji: Pieniadz = 36 (referencja)');
  eq(yldZKorupcja.pieniadz,   25, 'I3 korupcja 30%: Pieniadz = floor((60 x 0.70) x 0.60) = floor(42 x 0.60) = floor(25.2) = 25');
  assert(yldZKorupcja.pieniadz < yldBezKorupcji.pieniadz,
    'I3: korupcja obniza Pieniadz z budynkow (byl bezposrednio do skarbca -- teraz jej podlega)');

  // --- I4: brak podwojnego liczenia -- suma 3 strumieni po podziale == pula ---
  const sumaI1 = yldSplit.pieniadz + yldSplit.nauka + yldSplit.luksus;
  eq(sumaI1, 60, 'I4: Pieniadz(36)+Nauka(12)+Luksus(12) = 60 = pieniadzBudynkow, dokladnie -- budynek liczy sie DOKLADNIE RAZ, nie ginie i nie dubluje sie');
  const sumaZMennica = yldZMennica.pieniadz + yldZMennica.nauka + yldZMennica.luksus;
  eq(sumaZMennica, 90, 'I4 z Waluta+Mennica: suma 3 strumieni = 90 = 60 x mennicaMnoznikPoWalucie(1.5), dokladnie -- nadal bez podwojnego liczenia');
}

// --- summary ---------------------------------------------------------------
console.log(`\nplony-budynkow-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
