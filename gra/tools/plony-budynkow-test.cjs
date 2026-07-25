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
// ---------------------------------------------------------------------------
console.log('\n-- C. Targowisko -> Pieniadz --');
testSingleBuildingDelta('targowisko', 'pieniadz', 'Targowisko');

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
// H. Parytet AI -- advanceCityEconomy musi dawac IDENTYCZNY wynik dla miasta
//    gracza (ownerId=0) i miasta AI (dowolny inny ownerId), przy tych samych
//    budynkach/epoce/technologiach -- zero specjalnej sciezki dla ownerId=0.
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

  const builtIds = ['stolarnia', 'targowisko', 'biblioteka', 'palac'];
  const tickPlayer = runTickForOwner(0, builtIds);
  const tickAI     = runTickForOwner(7, builtIds);

  eq(tickAI.praca, tickPlayer.praca, 'parytet AI: Praca identyczna (ownerId=0 vs ownerId=7)');
  eq(tickAI.pieniadzBrutto, tickPlayer.pieniadzBrutto, 'parytet AI: Pieniadz brutto identyczny');
  eq(tickAI.nauka, tickPlayer.nauka, 'parytet AI: Nauka identyczna');
  eq(tickAI.kultura, tickPlayer.kultura, 'parytet AI: Kultura identyczna');
  assert(tickPlayer.kultura > 0, `sanity: miasto z Palacem ma Kultura > 0 (got ${tickPlayer.kultura})`);
  assert(tickPlayer.praca > 0, `sanity: miasto ze Stolarnia ma Praca > 0 (got ${tickPlayer.praca})`);
}

// --- summary ---------------------------------------------------------------
console.log(`\nplony-budynkow-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
