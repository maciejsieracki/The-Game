'use strict';
/**
 * hud-skarbiec-test.cjs -- standalone Node test guarding the HUD "Skarbiec"
 * chip fix (Maciej 2026-07-26, zgloszenie z playtestu, bundle 2f928932):
 * "Skarbiec chyba nie pokazuje teraz prawdziwej ilosci. Obok jest plus szesc,
 * a dochodzi tylko jedna jednostka."
 *
 * Root cause: the HUD chip's "+N" was wired to the GROSS money income from
 * city yields (playerEcon.pieniadz, sum of Danina/Podatek + budynki + Handel
 * ze szlakow), while the real end-of-turn bank ("Bank treasury" block in
 * main.ts) subtracts building + unit gold upkeep (upkeepBalance, Spec s.6.4)
 * AFTER banking that income. So the chip promised more than the treasury
 * actually gained whenever upkeep was nonzero.
 *
 * This test builds a tiny fixture (1 city, 2 buildings with nonzero
 * `utrzymanie`, 1 unit with nonzero gold upkeep) and asserts that the NET
 * number the HUD is meant to show (gross city income - building upkeep - unit
 * upkeep, computed via previewCityEconomy + previewOwnerUpkeep -- the exact
 * functions main.ts's refreshLiveEmpireRates() calls for the live chip) equals
 * the REAL delta the treasury undergoes after a full advanceCityEconomy tick
 * (the same functions main.ts's end-of-turn "Bank treasury" block uses).
 *
 * Run from gra/:  node tools/hud-skarbiec-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[hud-skarbiec-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.hud-skarbiec-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.hud-skarbiec-bundle.cjs');

const ENTRY_TS = `
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
import { computeStartPlacements } from '../src/units/setup';
import { foundCity, cityName } from '../src/game/cities';
import { loadGameData } from '../src/data/loader';
import {
  previewCityEconomy, previewOwnerUpkeep, sumEconomyForPlayerCities,
  advanceCityEconomy,
} from '../src/game/turn-economy';
import {
  computeTradeRouteIncomeByCity, computeTradeRouteBuildingBonusByCity,
  computeSeaTradeBonusIncomeByCity, computeSeaTradeRouteCountByCity,
  loadTradeRouteIncomeParams,
} from '../src/game/trade-routes';

export {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements,
  foundCity, cityName,
  loadGameData,
  previewCityEconomy, previewOwnerUpkeep, sumEconomyForPlayerCities,
  advanceCityEconomy,
  computeTradeRouteIncomeByCity, computeTradeRouteBuildingBonusByCity,
  computeSeaTradeBonusIncomeByCity, computeSeaTradeRouteCountByCity,
  loadTradeRouteIncomeParams,
};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf-8');

console.log('[hud-skarbiec-test] Bundling src/ with esbuild...');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle:      true,
    platform:    'node',
    format:      'cjs',
    outfile:     BUNDLE_FILE,
    loader:      { '.json': 'json', '.ts': 'ts' },
    target:      ['node16'],
    logLevel:    'warning',
  });
} catch (e) {
  console.error('[hud-skarbiec-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements,
  foundCity, cityName,
  loadGameData,
  previewCityEconomy, previewOwnerUpkeep, sumEconomyForPlayerCities,
  advanceCityEconomy,
  computeTradeRouteIncomeByCity, computeTradeRouteBuildingBonusByCity,
  computeSeaTradeBonusIncomeByCity, computeSeaTradeRouteCountByCity,
  loadTradeRouteIncomeParams,
} = require(BUNDLE_FILE);

// ---------------------------------------------------------------------------
// Assertion harness (same minimal style as the other tools/*-test.cjs files)
// ---------------------------------------------------------------------------
let passed = 0, failed = 0;
function assert(name, cond, detail) {
  if (cond) { passed++; console.log(`PASS: ${name}`); }
  else { failed++; console.log(`FAIL: ${name}${detail ? ' -- ' + detail : ''}`); }
}

// ---------------------------------------------------------------------------
// Fixture: 1 player city with 2 buildings carrying nonzero `utrzymanie`
// (era 1: "palac" utrzymanie=2, "spichlerz" utrzymanie=1 -- see data/buildings.json)
// + 1 unit with nonzero gold upkeep (category "miecznik" -> fallback 2/ture,
// DEFAULT_UNIT_UPKEEP_BY_CATEGORY in economy-upkeep.ts -- a typeId deliberately
// absent from units.json so the category fallback, not a per-type override, is
// what is exercised here).
// ---------------------------------------------------------------------------
const data  = loadGameData();
const map   = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, 4242);
const start = computeStartPlacements(map, data);

const settler = {
  id: 'skarbiec_test_settler',
  ownerId: 0,
  typeId: 'Osadnik',
  category: 'osadnik',
  q: start.playerStart.q,
  r: start.playerStart.r,
  ruch: 2,
  ruchLeft: 2,
};

const city = foundCity(settler, [], map, cityName(0));
assert('fixture: foundCity zwraca miasto gracza', city !== null);

if (city) {
  const cities = [city];
  const builtByCity = new Map([[city.id, ['palac', 'spichlerz']]]);
  const econUnits = [
    { ownerId: 0, typeId: 'skarbiec_test_miecznik', category: 'miecznik', camping: false, onOwnTerritory: true },
  ];

  // --- "Shown" side: the same two calls main.ts's refreshLiveEmpireRates()
  // makes for the live HUD chip BEFORE end of turn (read-only, no mutation). ---
  const preview     = previewCityEconomy(cities, map, data, 'normal', builtByCity);
  const playerEcon  = sumEconomyForPlayerCities(preview, cities);
  const upkeepPrev  = previewOwnerUpkeep(0, cities, data, 'normal', builtByCity, econUnits);

  assert(
    'fixture ma niezerowe utrzymanie (budynki + jednostki)',
    upkeepPrev.utrzymanieRazem > 0,
    `utrzymanieBudynki=${upkeepPrev.utrzymanieBudynki} utrzymanieJednostki=${upkeepPrev.utrzymanieJednostki}`,
  );
  assert('utrzymanie budynkow > 0 (palac + spichlerz)', upkeepPrev.utrzymanieBudynki > 0,
    `got ${upkeepPrev.utrzymanieBudynki}`);
  assert('utrzymanie jednostek > 0 (miecznik fallback)', upkeepPrev.utrzymanieJednostki > 0,
    `got ${upkeepPrev.utrzymanieJednostki}`);

  const shownRate = playerEcon.pieniadz - upkeepPrev.utrzymanieRazem;

  assert(
    'STARY BUG (regresja): "+N" pokazywany na chipie NIE moze byc rownym wplywom brutto, gdy utrzymanie niezerowe',
    shownRate !== playerEcon.pieniadz,
    `shownRate=${shownRate} pieniadzBrutto=${playerEcon.pieniadz} utrzymanieRazem=${upkeepPrev.utrzymanieRazem}`,
  );

  // --- "Real" side: an actual end-of-turn tick, exactly like main.ts's
  // "Bank treasury" block (player.skarbiec += pieniadzGracza; player.skarbiec
  // -= playerBalance.utrzymanieRazem;) -- simulated against a mock treasury. ---
  let mockSkarbiec = 1000;
  const before = mockSkarbiec;

  const econ          = advanceCityEconomy(cities, map, data, 'normal', econUnits, new Map(), builtByCity);
  const realPlayerEcon = sumEconomyForPlayerCities(econ, cities);
  const realBalance    = econ.upkeepByOwner.get(0);

  mockSkarbiec += realPlayerEcon.pieniadz;
  if (realBalance && realBalance.utrzymanieRazem > 0) {
    mockSkarbiec -= realBalance.utrzymanieRazem;
  }
  const realDelta = mockSkarbiec - before;

  assert(
    'kontrolne: real-tick utrzymanieRazem tez niezerowe (fixture spojny miedzy preview i real)',
    !!realBalance && realBalance.utrzymanieRazem > 0,
    `utrzymanieRazem=${realBalance ? realBalance.utrzymanieRazem : 'undefined'}`,
  );

  assert(
    'NAPRAWA HUD-SKARBIEC: liczba pokazywana przy Skarbcu ("+N") == realna zmiana stanu skarbca po turze',
    shownRate === realDelta,
    `shownRate=${shownRate} realDelta=${realDelta}`,
  );

  // -------------------------------------------------------------------------
  // R-SKARBIEC-HANDEL-PODGLAD-ZERO-Q1: scenariusz z AKTYWNA trasa handlowa o
  // NIEZEROWYM dochodzie (zgloszenie wlasciciela: panel "Handel" pokazuje
  // "+157 zlota/ture" z tras, ale panel "Skarbiec" liczy handel jako 0).
  // Trasa ladowa, dystans=6, status='polaczony' -- realny, niezerowy dochod
  // (REGULA PRZECIW SAMOOSZUKIWANIU: fixture BEZ tras trywialnie przeszedlby
  // niezaleznie od poprawki, wiec ta trasa MUSI istniec i dawac >0). toCityId
  // celowo NIE jest realnym miastem w `cities` -- druga strona trasy jest poza
  // podgladem gracza (AI/inne miasto), dokladnie jak w realnej rozgrywce z
  // wieloma miastami; liczy sie tylko, czy WLASNE miasto (fromCityId=city.id)
  // dostaje swoj wklad. budynekOdblokowany=false: izoluje test na dochodzie
  // DYSTANSOWYM (pozycja 11, sedno zgloszenia wlasciciela) bez domieszania
  // premii budynkowej 5% (pozycja 10) do arytmetyki netto sprawdzanej nizej --
  // to, ze pozycja 10 dostaje teraz REALNA mape (nie undefined), jest
  // weryfikowane osobno (tsc + brak crasha + niepusta mapa z tradeRouteBuildingBonusByCity).
  const tradeRoutesFixture = [{
    id: 'skarbiec_test_route',
    fromCityId: city.id,
    toCityId: 'skarbiec_test_other_city',
    ownerId: 0,
    toOwnerId: 0,
    medium: 'lad',
    dystans: 6,
    status: 'polaczony',
    budynekOdblokowany: false,
  }];
  const tradeIncomeParamsFixture = loadTradeRouteIncomeParams(data.econParams, 'normal');
  const tradeIncomeByCityFixture = computeTradeRouteIncomeByCity(
    tradeRoutesFixture, tradeIncomeParamsFixture, () => 0,
  );
  const seaBonusByCityFixture = computeSeaTradeBonusIncomeByCity(
    computeSeaTradeRouteCountByCity(tradeRoutesFixture),
  );
  for (const [cid, bonus] of seaBonusByCityFixture) {
    tradeIncomeByCityFixture.set(cid, (tradeIncomeByCityFixture.get(cid) ?? 0) + bonus);
  }
  const tradeBuildingBonusByCityFixture = computeTradeRouteBuildingBonusByCity(
    tradeRoutesFixture, tradeIncomeParamsFixture,
  );

  assert(
    'fixture trasy: trasa daje REALNY, NIEZEROWY dochod dystansowy (nie 0)',
    (tradeIncomeByCityFixture.get(city.id) ?? 0) > 0,
    `dochod=${tradeIncomeByCityFixture.get(city.id)}`,
  );

  // --- pozycja 10 (tradeRouteBuildingBonusByCity): dowod osobny, ze poprawka
  // faktycznie przekazuje TEZ TA mape (nie tylko dochod z pozycji 11) -- trasa
  // Z budynkiem daje niezerowa premie, previewCityEconomy ja przyjmuje bez
  // bledu i wynik pieniadzZTras nie zalezy od niej (premia budynkowa idzie do
  // Handlu/Podatku, nie wprost do pieniadzZTras -- inny kanal, patrz turn-economy.ts).
  const tradeRoutesZBudynkiem = [{ ...tradeRoutesFixture[0], id: 'skarbiec_test_route_bud', budynekOdblokowany: true }];
  const tradeBuildingBonusZBudynkiem = computeTradeRouteBuildingBonusByCity(
    tradeRoutesZBudynkiem, tradeIncomeParamsFixture,
  );
  assert(
    'pozycja 10: trasa Z budynkiem daje niezerowa premie budynkowa (fixture zdolny wykryc regres na tej pozycji)',
    (tradeBuildingBonusZBudynkiem.get(city.id) ?? 0) > 0,
    `premia=${tradeBuildingBonusZBudynkiem.get(city.id)}`,
  );
  const previewZBudynkiem = previewCityEconomy(
    cities, map, data, 'normal', builtByCity,
    1, new Set(), new Map(), new Map(),
    undefined, undefined,
    tradeBuildingBonusZBudynkiem, tradeIncomeByCityFixture,
  );
  assert(
    'pozycja 10: previewCityEconomy przyjmuje realna mape tradeRouteBuildingBonusByCity bez bledu',
    !!previewZBudynkiem && previewZBudynkiem.perCity.length > 0,
  );

  // --- "PODGLAD PO POPRAWCE": dokladnie wzorzec main.ts refreshLiveEmpireRatesUnsafe
  // po fix -- previewCityEconomy dostaje REALNIE POLICZONE mapy na pozycjach 12/13. ---
  const previewFixed = previewCityEconomy(
    cities, map, data, 'normal', builtByCity,
    1, new Set(), new Map(), new Map(),
    undefined, undefined,
    tradeBuildingBonusByCityFixture, tradeIncomeByCityFixture,
  );
  const playerEconFixed = sumEconomyForPlayerCities(previewFixed, cities);

  assert(
    'NAPRAWA PODGLADU: pieniadzZTras w podgladzie HUD == realny dochod trasy (nie 0)',
    playerEconFixed.pieniadzZTras === tradeIncomeByCityFixture.get(city.id),
    `pieniadzZTras=${playerEconFixed.pieniadzZTras} oczekiwano=${tradeIncomeByCityFixture.get(city.id)}`,
  );

  // --- MUTACJA (dowod nietautologicznosci -- kryterium 4 dispatchu): dokladnie
  // TA SAMA sciezka wywolania, ale z `undefined` na pozycjach 12/13, tak jak
  // przed poprawka w main.ts (BUG-SKARBIEC-HANDEL-PODGLAD-ZERO) -- musi wrocic
  // do 0 mimo REALNEJ, niezerowej trasy. Jesli ktos w main.ts znow poda
  // `undefined` w tym miejscu, ten SAM defekt (podglad=0 mimo aktywnych tras)
  // odtwarza sie tutaj identycznie. ---
  const previewBuggy = previewCityEconomy(
    cities, map, data, 'normal', builtByCity,
    1, new Set(), new Map(), new Map(),
    undefined, undefined,
    undefined, undefined,
  );
  const playerEconBuggy = sumEconomyForPlayerCities(previewBuggy, cities);

  assert(
    'REGRESJA (BUG-SKARBIEC-HANDEL-PODGLAD-ZERO odtworzony celowo): undefined na poz. 12/13 daje pieniadzZTras=0 mimo aktywnej trasy',
    playerEconBuggy.pieniadzZTras === 0,
    `pieniadzZTras=${playerEconBuggy.pieniadzZTras}`,
  );
  assert(
    'DOWOD NIETAUTOLOGICZNOSCI: podglad Z poprawka != podglad BEZ poprawki (ta sama trasa, ten sam dochod > 0)',
    playerEconFixed.pieniadzZTras !== playerEconBuggy.pieniadzZTras,
    `fixed=${playerEconFixed.pieniadzZTras} buggy=${playerEconBuggy.pieniadzZTras}`,
  );

  // --- KRYTERIUM 2: "Netto skarbiec" UWZGLEDNIA dochod z tras w calej sumie,
  // nie tylko w oderwanym wierszu "Handel ze szlakow". ---
  const upkeepPrevFixed = previewOwnerUpkeep(0, cities, data, 'normal', builtByCity, econUnits);
  const shownRateFixed = playerEconFixed.pieniadz - upkeepPrevFixed.utrzymanieRazem;
  assert(
    'KRYTERIUM 2: netto skarbiec Z trasa > netto skarbiec BEZ trasy (dochod z tras realnie wchodzi do sumy)',
    shownRateFixed > shownRate,
    `shownRateFixed=${shownRateFixed} shownRate(bez trasy)=${shownRate}`,
  );
  assert(
    'KRYTERIUM 2: cala roznica netto (Z trasa - BEZ trasy) == dochod z trasy (nie tylko wiersz Handlu zmienia sie w oderwaniu)',
    shownRateFixed - shownRate === tradeIncomeByCityFixture.get(city.id),
    `delta=${shownRateFixed - shownRate} oczekiwano=${tradeIncomeByCityFixture.get(city.id)}`,
  );

  // --- KRYTERIUM 3: realny stan skarbca po koncu tury rosnie DOKLADNIE o
  // wartosc pokazana w podgladzie PRZED koncem tury (advanceCityEconomy,
  // TA SAMA sciezka co blok konca tury main.ts:26244-26257, z tymi samymi
  // mapami tras na pozycjach 15/16). ---
  let mockSkarbiecTrasy = 1000;
  const beforeTrasy = mockSkarbiecTrasy;
  const econTrasy = advanceCityEconomy(
    cities, map, data, 'normal', econUnits, new Map(), builtByCity,
    1, new Set(), new Map(), new Map(),
    undefined, undefined, 'wysoki',
    tradeBuildingBonusByCityFixture, tradeIncomeByCityFixture,
  );
  const realPlayerEconTrasy = sumEconomyForPlayerCities(econTrasy, cities);
  const realBalanceTrasy = econTrasy.upkeepByOwner.get(0);
  mockSkarbiecTrasy += realPlayerEconTrasy.pieniadz;
  if (realBalanceTrasy && realBalanceTrasy.utrzymanieRazem > 0) {
    mockSkarbiecTrasy -= realBalanceTrasy.utrzymanieRazem;
  }
  const realDeltaTrasy = mockSkarbiecTrasy - beforeTrasy;

  assert(
    'kontrolne: real-tick z trasa tez ksieguje niezerowy dochod z tras (pieniadzZTras w realnym ticku)',
    (realPlayerEconTrasy.pieniadzZTras ?? 0) > 0,
    `pieniadzZTras=${realPlayerEconTrasy.pieniadzZTras}`,
  );
  assert(
    'KRYTERIUM 3: podglad PRZED koncem tury (Z trasa) == realna zmiana skarbca PO koncu tury (Z ta sama trasa)',
    shownRateFixed === realDeltaTrasy,
    `shownRateFixed=${shownRateFixed} realDeltaTrasy=${realDeltaTrasy}`,
  );
}

// ---------------------------------------------------------------------------
// OBRONA RUNDA 1 (zarzut Evaluatora, PRZYJETY): powyzsze asercje "mutacyjne"
// (playerEconBuggy/playerEconFixed) NIE wolaja main.ts -- to dwa niezalezne
// wywolania biblioteki `previewCityEconomy` wpisane recznie w TYM pliku
// testowym, wiec przywrocenie realnego buga w gra/src/main.ts (`39ca04ed`)
// nie czerwieni zadnej z nich (potwierdzone niezaleznie przez Evaluatora:
// 17/17 PASS na starym main.ts). Ponizsza sekcja naprawia dokladnie ta luke:
// czyta PRAWDZIWY tekst `gra/src/main.ts`, znajduje PRAWDZIWE miejsce
// poprawki (wywolanie previewCityEconomy WEWNATRZ refreshLiveEmpireRatesUnsafe)
// i sprawdza, ze pozycje 10/11 NIE sa literalnym `undefined`, tylko realnymi
// wyrazeniami uzywajacymi `tradeRouteBuildingBonusByCity` / obliczenia
// dochodu z tras. Jesli ktos w przyszlosci przywroci `undefined` w TYM
// KONKRETNYM miejscu main.ts, ten test faktycznie czerwienieje -- bo czyta
// zawartosc pliku na nowo przy kazdym uruchomieniu, nie duplikat logiki.
(function checkRealFixSiteInMainTs() {
  const MAIN_TS_PATH = path.resolve(__dirname, '..', 'src', 'main.ts');
  const src = fs.readFileSync(MAIN_TS_PATH, 'utf-8');

  /**
   * Minimalny tokenizer JS/TS: przechodzi po `text` od `from`, pomija komentarze
   * (`//`, `/* *​/`), stringi (`'`, `"`) i template literale (`` ` ``, bez
   * rekurencji w `${}` -- wystarczajace, bo interesuja nas tylko top-level
   * nawiasy/klamry poza literalami) i woła `onChar(ch, i)` dla kazdego "realnego"
   * znaku kodu. Uzywane zarowno do znalezienia konca funkcji (liczenie `{`/`}`),
   * jak i do rozbicia argumentow wywolania na przecinkach top-level.
   */
  function scanCode(text, from, onChar) {
    let i = from;
    while (i < text.length) {
      const ch = text[i];
      if (ch === '/' && text[i + 1] === '/') {
        const nl = text.indexOf('\n', i);
        i = nl === -1 ? text.length : nl + 1;
        continue;
      }
      if (ch === '/' && text[i + 1] === '*') {
        const end = text.indexOf('*/', i + 2);
        i = end === -1 ? text.length : end + 2;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') {
        const quote = ch;
        let j = i + 1;
        while (j < text.length && text[j] !== quote) {
          if (text[j] === '\\') j += 2; else j += 1;
        }
        i = j + 1;
        continue;
      }
      const stop = onChar(ch, i);
      if (stop === false) return i;
      i += 1;
    }
    return i;
  }

  function findFunctionBody(text, fnName) {
    const sig = `function ${fnName}(): void {`;
    const sigIdx = text.indexOf(sig);
    if (sigIdx === -1) {
      throw new Error(`checkRealFixSiteInMainTs: nie znaleziono sygnatury '${sig}' w main.ts`);
    }
    const bodyStart = sigIdx + sig.length; // tuz po otwierajacej '{'
    let depth = 1;
    let bodyEnd = -1;
    scanCode(text, bodyStart, (ch, i) => {
      if (ch === '{') depth += 1;
      else if (ch === '}') {
        depth -= 1;
        if (depth === 0) { bodyEnd = i; return false; }
      }
      return true;
    });
    if (bodyEnd === -1) {
      throw new Error(`checkRealFixSiteInMainTs: nie znaleziono konca funkcji ${fnName} (niezbalansowane klamry)`);
    }
    return text.slice(bodyStart, bodyEnd);
  }

  /** Rozbija argumenty wywolania `callName(` na top-level przecinkach. */
  function extractCallArgs(text, callName) {
    const callIdx = text.indexOf(`${callName}(`);
    if (callIdx === -1) {
      throw new Error(`checkRealFixSiteInMainTs: nie znaleziono wywolania ${callName}(...)`);
    }
    const argsStart = callIdx + callName.length + 1;
    let depth = 1;
    let argsEnd = -1;
    const commaIdxs = [];
    scanCode(text, argsStart, (ch, i) => {
      if (ch === '(' || ch === '[' || ch === '{') depth += 1;
      else if (ch === ')' || ch === ']' || ch === '}') {
        depth -= 1;
        if (depth === 0) { argsEnd = i; return false; }
      } else if (ch === ',' && depth === 1) {
        commaIdxs.push(i);
      }
      return true;
    });
    if (argsEnd === -1) {
      throw new Error(`checkRealFixSiteInMainTs: nie znaleziono konca wywolania ${callName}(...)`);
    }
    const argsText = text.slice(argsStart, argsEnd);
    const bounds = [argsStart, ...commaIdxs, argsEnd];
    const args = [];
    for (let k = 0; k < bounds.length - 1; k++) {
      const startAbs = k === 0 ? argsStart : bounds[k] + 1;
      args.push(text.slice(startAbs, bounds[k + 1]).trim());
    }
    return args;
  }

  /**
   * OBRONA RUNDA 2 (zarzut Final Control, PRZYJETY): poprzednia wersja uzywala
   * regex-contains (`/tradeRouteBuildingBonusByCity/.test(pos10)`) na SUROWYM
   * tekscie argumentu. Atak: `undefined /* tradeRouteBuildingBonusByCity *\/`
   * -- to LITERALNY `undefined` z komentarzem-atrapa doklejonym za nim, a
   * regex-contains i tak dopasowuje nazwe zmiennej WEWNATRZ tego komentarza,
   * wiec guard bledbie uznawal to za "prawdziwa zmienna". Naprawa: najpierw
   * usuwamy komentarze (`//`, `/* *\/`) z wycietego argumentu (uzywajac tego
   * samego tokenizera `scanCode` co reszta pliku), DOPIERO na oczyszczonym
   * tekscie robimy porownanie -- dla pozycji 10 SCISLE (`===` do dokladnej
   * nazwy zmiennej, zero tolerancji na cokolwiek doklejone dookola), dla
   * pozycji 11 (zlozone wyrazenie IIFE, gdzie `===` do calego tekstu nie ma
   * sensu) regex na oczyszczonym tekscie -- komentarz-atrapa juz nie istnieje,
   * wiec nie moze podszyc sie pod prawdziwe wywolanie.
   */
  function stripComments(text) {
    let out = '';
    scanCode(text, 0, (ch) => { out += ch; return true; });
    return out;
  }

  /** Ta sama asercja stosowana i do PRAWDZIWYCH, i do zmutowanych argumentow. */
  function assertFixApplied(args, label, expectFixed) {
    assert(
      `${label}: previewCityEconomy(...) ma >= 11 argumentow (pozycje 10/11 istnieja)`,
      args.length >= 11,
      `args.length=${args.length}`,
    );
    // previewCityEconomy (turn-economy.ts:1840): pozycje 12/13 w sygnaturze
    // (tradeRouteBuildingBonusByCity/tradeIncomeByCity) = indeksy 11/12
    // w tablicy argumentow 0-indeksowanej (main.ts:15929-15930, wskazane
    // wprost przez dispatch numerami linii).
    const pos10 = args[11];
    const pos11 = args[12];
    const pos10Clean = stripComments(pos10).trim();
    const pos11Clean = stripComments(pos11).trim();
    // SCISLE porownanie: pozycja 10 w realnym miejscu poprawki jest goma
    // nazwa zmiennej `tradeRouteBuildingBonusByCity`, wiec po oczyszczeniu
    // z komentarzy MUSI byc dokladnie rowna tej nazwie -- zaden regex-contains.
    const pos10IsRealVar = pos10Clean === 'tradeRouteBuildingBonusByCity';
    const pos11IsRealCalc = pos11Clean !== 'undefined'
      && /computeTradeRouteIncomeByCity/.test(pos11Clean)
      && /loadTradeRouteIncomeParams/.test(pos11Clean);
    if (expectFixed) {
      assert(`${label}: pozycja 10 (tradeRouteBuildingBonusByCity) NIE jest literalnym undefined`,
        pos10IsRealVar, `pos10=${JSON.stringify(pos10)}`);
      assert(`${label}: pozycja 11 (tradeIncomeByCity) NIE jest literalnym undefined, liczy sie na zadanie`,
        pos11IsRealCalc, `pos11=${JSON.stringify(pos11).slice(0, 120)}`);
    } else {
      checkRedLocal(`${label}: mutacja wraca do literalnego undefined na pozycji 10 (dowod nietautologicznosci)`,
        !pos10IsRealVar, `pos10=${JSON.stringify(pos10)}`);
      checkRedLocal(`${label}: mutacja wraca do literalnego undefined na pozycji 11 (dowod nietautologicznosci)`,
        !pos11IsRealCalc, `pos11=${JSON.stringify(pos11).slice(0, 120)}`);
    }
  }
  function checkRedLocal(name, cond, detail) { assert(name, cond, detail); }

  // --- (1) PRAWDZIWY plik, PRAWDZIWE miejsce poprawki: to jest kryterium 4
  // dispatchu. Jesli ktos przywroci `undefined, undefined,` w tym wywolaniu
  // w gra/src/main.ts, ponizsze asercje CZERWIENIEJA przy nastepnym uruchomieniu. ---
  const realFnBody = findFunctionBody(src, 'refreshLiveEmpireRatesUnsafe');
  const realArgs = extractCallArgs(realFnBody, 'previewCityEconomy');
  assertFixApplied(realArgs, 'MIEJSCE POPRAWKI (main.ts, refreshLiveEmpireRatesUnsafe)', true);

  // --- (2) DOWOD NIETAUTOLOGICZNOSCI kontroli samej: bierzemy TA SAMA liste
  // argumentow wydobyta z PRAWDZIWEGO main.ts i podmieniamy WYLACZNIE pozycje
  // 10/11 na literalny `undefined` (stan sprzed poprawki, `39ca04ed`)
  // WYLACZNIE w pamieci testu -- bez dotykania pliku w repo -- po czym
  // wymagamy, zeby TA SAMA funkcja sprawdzajaca wykryla regres. ---
  const mutatedArgs = realArgs.slice();
  mutatedArgs[11] = 'undefined';
  mutatedArgs[12] = 'undefined';
  assertFixApplied(mutatedArgs, 'ZMUTOWANA REKONSTRUKCJA (undefined na poz. 10/11, jak przed poprawka)', false);

  // --- (3) OBRONA RUNDA 2: dokladny atak z raportu Final Control -- literalny
  // `undefined` z doklejonym za nim komentarzem-atrapa udajacym nazwe realnej
  // zmiennej/wywolania. Regex-contains z rundy 1 dopasowywal to jako "prawdziwa
  // wartosc" (fałszywy PASS na buggy stanie); po utwardzeniu (usuwanie
  // komentarzy PRZED porownaniem + === dla pozycji 10) guard MUSI to odrzucic. ---
  const attackArgs = realArgs.slice();
  attackArgs[11] = 'undefined /* tradeRouteBuildingBonusByCity */';
  attackArgs[12] = 'undefined /* computeTradeRouteIncomeByCity loadTradeRouteIncomeParams */';
  assertFixApplied(
    attackArgs,
    'ATAK Z RAPORTU FINAL CONTROL (undefined + komentarz-atrapa udajacy realna wartosc)',
    false,
  );
})();

// ---------------------------------------------------------------------------
console.log('');
console.log(`hud-skarbiec-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
