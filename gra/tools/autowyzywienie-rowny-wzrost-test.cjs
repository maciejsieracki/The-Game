'use strict';
/**
 * autowyzywienie-rowny-wzrost-test.cjs — R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A
 *
 * ZGŁOSZENIE (właściciel, zrzut Spichlerza, 12 miast): „jedne miasta głodują, a drugie mają
 * super nadwyżkę […] system autowyżywienia powinien dążyć do tego, aby w każdym mieście był
 * podobny wzrost, jednocześnie unikając głodu". Na zrzucie: Ateny bilans +24 → wzrost −1%,
 * Sparta +13 (koszt racji 0) → −4%, Korynt +15 → −2%, a jednocześnie Milet −21 → +7%,
 * Zhao −12 → +7%. MIASTA Z NADWYŻKĄ SIĘ KURCZĄ, MIASTA Z DEFICYTEM ROSNĄ.
 *
 * PRZYCZYNA (zmierzona tym testem, nie założona) — asymetria dwóch mechanizmów:
 *  • obniżanie było PER MIASTO: `maxSafePoziomRacjiForCity` pytało „jak nisko musi zejść TO JEDNO
 *    miasto, żeby CAŁE imperium się zbilansowało", więc pierwsze odpytane miasto pochłaniało całą
 *    korektę imperium i lądowało na 0 (koszt racji 0 → DODATNI bilans lokalny, −10% wzrostu);
 *  • podnoszenie było LOCKSTEP: `autoRaiseRationsForGrowth` podnosiła krok we WSZYSTKICH miastach
 *    naraz i cofała go globalnie, więc przyklepane miasto wracało dopiero, gdy na krok stać było
 *    całe imperium — zapadka, z której nie ma powrotu.
 *
 * NAPRAWA: wspólny poziom Wyżywienia (`resolveEqualGrowthRationPlan`) — najwyższy, przy którym
 * ŻADNE miasto nie głoduje i kryterium bilansu jest spełnione; kontrfaktyk `maxSafePoziomRacjiForCity`
 * jest teraz sprawiedliwy (pozostałe miasta schodzą do min(ich poziom, level)).
 *
 * ⚠️ REGUŁA PRZECIW SAMOOSZUKIWANIU (z dispatchu, §REGUŁA):
 *  1. Sam spadek rozrzutu NIE jest dowodem — rozrzut spada trywialnie, gdy wszystkie miasta
 *     przestaną rosnąć. Każda asercja jakości układu (`assertEqualGrowth`) sprawdza JEDNOCZEŚNIE:
 *     mały rozrzut ORAZ brak głodu ORAZ DODATNI łączny przyrost ludności imperium. Sekcja E
 *     przepuszcza przez TĘ SAMĄ funkcję wariant „zatrzymaj wszystkich" i dowodzi, że NIE PRZECHODZI.
 *  2. Bez reimplementacji: test nie liczy własnego wzoru na przyrost. Woła PRAWDZIWE funkcje
 *     ekonomii — `autoBalanceRationsToSolvency`, `autoRaiseRationsForGrowth`,
 *     `maxSafePoziomRacjiForCity`, `advanceEmpireFood` i `applyPostCentralPopulationGrowth`
 *     (ta ostatnia to pętla, która w grze faktycznie zmienia `city.population`), w tej samej
 *     kolejności co `main.ts::triggerPlayerEndTurn` (~28128-28200, 29404-29412, 16324).
 *
 * Run from gra/: node tools/autowyzywienie-rowny-wzrost-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY_CORE = path.resolve(__dirname, '.autowyzywienie-rowny-wzrost-entry.ts');
const BUNDLE_CORE = path.resolve(__dirname, '.autowyzywienie-rowny-wzrost-bundle.cjs');
const ENTRY_NEW = path.resolve(__dirname, '.autowyzywienie-rowny-wzrost-entry-new.ts');
const BUNDLE_NEW = path.resolve(__dirname, '.autowyzywienie-rowny-wzrost-bundle-new.cjs');
const TMP = [];

function build(entry, outfile, src) {
  fs.writeFileSync(entry, src, 'utf8');
  TMP.push(entry);
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  TMP.push(outfile);
  return require(outfile);
}
function cleanup() {
  for (const f of TMP) { try { fs.unlinkSync(f); } catch { /* best effort */ } }
}

// API istniejące PRZED naprawą — musi się zbudować zawsze, także na czystej bazie, żeby
// bramka mogła być URUCHOMIONA na kodzie sprzed naprawy i pokazać defekt (dowód
// nietautologiczności: bez tego podziału `esbuild` wysypywałby się na brakującym eksporcie
// i „czerwień" nie mówiłaby nic o defekcie).
const CORE = build(ENTRY_CORE, BUNDLE_CORE, `
export {
  advanceEmpireFood, buildEmpireFoodParams, freshEmpireFoodState,
  autoBalanceRationsToSolvency, autoRaiseRationsForGrowth, maxSafePoziomRacjiForCity,
  computeEmpireCityFoodNadwyzka,
} from '../src/game/empire-food';
export {
  applyPostCentralPopulationGrowth, getCityRationLevel, buildRationParams,
  rationGrowthPercent, WYZYWIENIE_LEVELS, WYZYWIENIE_MIN, WYZYWIENIE_MAX,
} from '../src/game/population-growth-v85';
export {
  recomputeCityFoodBalancesInEcon, refreshEconomyFoodTotals,
  militaryFoodConsumptionWithSpichlerz,
} from '../src/game/turn-economy';
export { cityPopulationCap } from '../src/game/economy';
`);

// API wprowadzone przez R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A. Na kodzie sprzed naprawy ten
// bundle się NIE zbuduje — sekcje B/D zgłaszają wtedy jawny FAIL „brak nowego API".
let NOWE_API = true;
let NEW = {};
try {
  NEW = build(ENTRY_NEW, BUNDLE_NEW, `
export {
  simulateCityFoodAllFed, resolveEqualGrowthRationPlan, WYZYWIENIE_POZIOM_NA_LIMICIE,
} from '../src/game/empire-food';
`);
} catch {
  NEW = {};
}
// esbuild z `bundle:true` NIE przerywa na brakującym eksporcie (zostawia `undefined`), więc
// obecność nowego API sprawdzamy po WARTOŚCIACH, nie po tym, że build się udał.
NOWE_API = typeof NEW.resolveEqualGrowthRationPlan === 'function'
  && typeof NEW.simulateCityFoodAllFed === 'function'
  && NEW.WYZYWIENIE_POZIOM_NA_LIMICIE !== undefined;

const M = { ...CORE, ...NEW };
let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

const rationParams = M.buildRationParams({});
const efParams = M.buildEmpireFoodParams({
  ekonomia_miasta: {
    magazyn_centralny_baza_zywnosc: { normal: 1000 },
    magazyn_centralny_bonus_zywnosc_na_budynek: { normal: 100 },
  },
});
const econParams = { akweduktProgLudnosci: 5, spichlerzProgLudnosci: 8, akweduktMaxLudnosci: 12 };
const upkeep = { jednostkaUtrzymanieStd: 1, zywnoscJednostkaRuch: 1, zywnoscJednostkaOboz: 0.5 };

// ---------------------------------------------------------------------------
// Układ ze zrzutu właściciela: 12 miast, cztery deficytowe przy startowym Wyżywieniu 4
// (Korynt −6, Teby −4, Qin −2, Chu −4), pula centralna 279 przy capie 1000.
// ---------------------------------------------------------------------------
const SPEC = [
  ['ateny', 'Ateny', 2, 26], ['sparta', 'Sparta', 1, 13], ['korynt', 'Korynt', 3, 18],
  ['teby', 'Teby', 3, 20], ['milet', 'Milet', 6, 51], ['efez', 'Efez', 5, 40],
  ['jin', 'Jin', 6, 68], ['zhao', 'Zhao', 6, 60], ['yan', 'Yan', 5, 47],
  ['qin', 'Qin', 4, 30], ['chu', 'Chu', 4, 28], ['wei', 'Wei', 2, 16],
];
const ZAPASY_START = 279;

function mkCities(level) {
  return SPEC.map(([id, name, pop]) => ({
    id, ownerId: 0, q: 0, r: 0, name, population: pop, poziomRacji: level,
    wzrostUlamkowy: 0, turyBezDoplaty: 0, rationMigratedV114: true, autoWyzywienie: true,
  }));
}
function mkProd(scale) {
  return new Map(SPEC.map(([id, , , prod]) => [id, prod * scale]));
}
function mkUnits(n) {
  return Array.from({ length: n }, () => ({ ownerId: 0, typeId: 'wojownik', camping: false }));
}
function buildEcon(cities, prod) {
  const econ = {
    perCity: cities.map(c => ({
      cityId: c.id, ownerId: c.ownerId, oblegany: false,
      zywnoscBrutto: prod.get(c.id), kosztRacji: 0, bilansLokalny: 0,
      zdrowie: 0, ludnoscPrzed: c.population, ludnoscPo: c.population,
    })),
    growth: 0, starved: 0, totalZywnosc: 0,
  };
  M.recomputeCityFoodBalancesInEcon(econ.perCity, cities, rationParams);
  M.refreshEconomyFoodTotals(econ);
  return econ;
}

/**
 * Jedna tura gracza w kolejności `main.ts::triggerPlayerEndTurn`:
 *   autoBalanceRationsToSolvency → autoRaiseRationsForGrowth → clamp Q3=A (pętla
 *   `maxSafePoziomRacjiForCity` po miastach) → advanceEmpireFood →
 *   applyPostCentralPopulationGrowth → applyLiveSafeRationForCity dla miast, którym
 *   zmieniła się ludność (main.ts:29404-29412 → 16324).
 * Wszystkie kroki to PRAWDZIWE funkcje z `src/game/*` — harness dostarcza tylko kolejność.
 */
function simulateTurn(cities, prod, states, units, popCapByCityId) {
  const zapasyPrzed = states.get(0).zapasyPanstwa;
  const econ = buildEcon(cities, prod);
  const kosztArmii = M.militaryFoodConsumptionWithSpichlerz(units, 0, upkeep, {});
  const common = {
    ownerId: 0, cities, econ, zapasyPrzed, rationParams,
    onlyAutoManaged: true, kosztArmii, popCapByCityId,
  };
  M.autoBalanceRationsToSolvency({ ...common, requireFlowBalance: true });
  M.autoRaiseRationsForGrowth({ ...common, requireProductionSurplus: true });

  let clamped = false;
  for (const c of cities) {
    const maxSafe = M.maxSafePoziomRacjiForCity({
      cityId: c.id, ownerId: 0, cities, econ, zapasyPrzed, rationParams, kosztArmii, popCapByCityId,
    });
    if (M.getCityRationLevel(c) > maxSafe) { c.poziomRacji = maxSafe; clamped = true; }
  }
  if (clamped) {
    M.recomputeCityFoodBalancesInEcon(econ.perCity, cities, rationParams);
    M.refreshEconomyFoodTotals(econ);
  }

  const ef = M.advanceEmpireFood(econ, units, states, upkeep, efParams);
  // Populacja, PRZY KTÓREJ policzono WZROST% (bonus „małe miasto" = max(0, 6−pop)) — po
  // przyroście byłaby już inna, a porównujemy miasta „tej samej wielkości".
  const popPrzyLiczeniu = new Map(cities.map(c => [c.id, c.population]));
  const changed = [];
  M.applyPostCentralPopulationGrowth({
    cities, econ, efResult: ef, map: { hexes: {} }, territoryNodes: [], econParams, rationParams,
    builtByCity: new Map(cities.map(c => [c.id, []])),
    onCityPopulationChanged: (id) => changed.push(id),
  });
  for (const id of changed) {
    const c = cities.find(x => x.id === id);
    const e2 = buildEcon(cities, prod);
    const maxSafe = M.maxSafePoziomRacjiForCity({
      cityId: id, ownerId: 0, cities, econ: e2, zapasyPrzed: states.get(0).zapasyPanstwa,
      rationParams, kosztArmii, popCapByCityId,
    });
    if (M.getCityRationLevel(c) > maxSafe) c.poziomRacji = maxSafe;
  }

  const owner = ef.byOwner.get(0);
  const rows = cities.map(c => {
    const row = owner.perCityRows.find(r => r.cityId === c.id);
    const tick = econ.perCity.find(t => t.cityId === c.id);
    return {
      id: c.id, name: c.name, pop: popPrzyLiczeniu.get(c.id), popPo: c.population,
      level: M.getCityRationLevel(c),
      bilans: tick.bilansLokalny, wzrost: row.wzrostProcent, fed: row.nakarmione === true,
    };
  });
  return { rows, starved: econ.starved, zapasy: states.get(0).zapasyPanstwa };
}

function runScenario(nTurns, { startLevel = 4, prodScale = 1, units = 5, popCapByCityId, frozenLevel } = {}) {
  const cities = mkCities(startLevel);
  const prod = mkProd(prodScale);
  const states = new Map([[0, { zapasyPanstwa: ZAPASY_START, turyUjemnychZapasow: 0 }]]);
  const u = mkUnits(units);
  const popStart = cities.reduce((s, c) => s + c.population, 0);
  const turns = [];
  for (let t = 0; t < nTurns; t++) {
    if (frozenLevel !== undefined) {
      // wariant kontrolny „zatrzymaj wszystkich": poziom przybity na sztywno przed każdą turą,
      // z pominięciem auto-wyżywienia — sprawdzamy nim, czy bramka daje się oszukać zerowym
      // rozrzutem przy zerowym wzroście.
      for (const c of cities) c.poziomRacji = frozenLevel;
      const econ = buildEcon(cities, prod);
      const ef = M.advanceEmpireFood(econ, u, states, upkeep, efParams);
      const popPrzyLiczeniu = new Map(cities.map(c => [c.id, c.population]));
      M.applyPostCentralPopulationGrowth({
        cities, econ, efResult: ef, map: { hexes: {} }, territoryNodes: [], econParams, rationParams,
        builtByCity: new Map(cities.map(c => [c.id, []])),
      });
      const owner = ef.byOwner.get(0);
      turns.push({
        rows: cities.map(c => {
          const row = owner.perCityRows.find(r => r.cityId === c.id);
          const tick = econ.perCity.find(x => x.cityId === c.id);
          return {
            id: c.id, name: c.name, pop: popPrzyLiczeniu.get(c.id), popPo: c.population,
            level: M.getCityRationLevel(c),
            bilans: tick.bilansLokalny, wzrost: row.wzrostProcent, fed: row.nakarmione === true,
          };
        }),
        starved: econ.starved, zapasy: states.get(0).zapasyPanstwa,
      });
      continue;
    }
    turns.push(simulateTurn(cities, prod, states, u, popCapByCityId));
  }
  const popEnd = cities.reduce((s, c) => s + c.population, 0);
  return { turns, cities, popStart, popEnd, przyrostImperium: popEnd - popStart };
}

/** Pary miast o TEJ SAMEJ wielkości (⇒ ten sam bonus „małe miasto") i tych samych modyfikatorach. */
function inverseDependencyViolations(turns) {
  const out = [];
  turns.forEach((turn, ti) => {
    for (const a of turn.rows) {
      for (const b of turn.rows) {
        if (a.id === b.id || a.pop !== b.pop) continue;
        if (a.bilans > b.bilans + 1e-9 && a.wzrost < b.wzrost - 1e-9) {
          out.push(`T${ti + 1}: ${a.name}(pop ${a.pop}, bilans ${a.bilans}) wzrost ${a.wzrost}% < ${b.name}(bilans ${b.bilans}) wzrost ${b.wzrost}%`);
        }
      }
    }
  });
  return out;
}
function maxSameSizeSpread(turns) {
  let worst = 0;
  for (const turn of turns) {
    const bySize = new Map();
    for (const r of turn.rows) {
      if (!bySize.has(r.pop)) bySize.set(r.pop, []);
      bySize.get(r.pop).push(r.wzrost);
    }
    for (const arr of bySize.values()) worst = Math.max(worst, Math.max(...arr) - Math.min(...arr));
  }
  return worst;
}
function anyHunger(turns) {
  return turns.some(t => t.starved > 0 || t.rows.some(r => !r.fed));
}

/**
 * JEDNA funkcja oceny układu, używana ZARÓWNO dla wyniku naprawy, JAK I dla wariantu
 * kontrolnego „zatrzymaj wszystkich" — cztery warunki JEDNOCZEŚNIE (dispatch, §REGUŁA pkt 1).
 *
 * `progPrzyrostu` to przyrost imperium w wariancie „zamroź wszystkich na poziomie 0% z racji" —
 * NIE magiczna liczba, tylko zmierzony wynik wariantu kontrolnego. Warunek „przyrost imperium
 * MUSI być OSTRO większy" jest dokładnie tym, czego wariant „zatrzymaj wszystkich" nie potrafi
 * spełnić, choć trywialnie spełnia zerowy rozrzut i brak głodu.
 */
function assertEqualGrowth(res, progPrzyrostu) {
  const violations = inverseDependencyViolations(res.turns);
  const spread = maxSameSizeSpread(res.turns);
  const dodatniPrzyrost = res.przyrostImperium > progPrzyrostu;
  return {
    maleRozrzut: spread < 1e-9,
    brakGlodu: !anyHunger(res.turns),
    dodatniPrzyrost,
    spread, violations, przyrost: res.przyrostImperium, prog: progPrzyrostu,
    pass: spread < 1e-9 && !anyHunger(res.turns) && dodatniPrzyrost && violations.length === 0,
  };
}

const N = 12;

// ===========================================================================
// A. Układ ze zrzutu — odwrotna zależność wzrostu od bilansu NIE WYSTĘPUJE
// ===========================================================================
console.log('\n-- A. Układ ze zrzutu (12 miast, 4 deficytowe, pula 279/1000): brak odwrotnej zależności --');
const base = runScenario(N);
{
  const v = inverseDependencyViolations(base.turns);
  ok(v.length === 0,
    `A1: żadna para miast tej samej wielkości nie ma odwrotnej zależności wzrost↔bilans (${v.length} naruszeń${v.length ? ', np. ' + v[0] : ''})`);
  ok(!anyHunger(base.turns), 'A2: żadne miasto nie głoduje w żadnej z 12 tur (twardy warunek nadrzędny)');
  const spread = maxSameSizeSpread(base.turns);
  ok(spread < 1e-9, `A3: rozrzut WZROST% wśród miast tej samej wielkości = 0 (got ${spread})`);
  const last = base.turns[N - 1].rows;
  const levels = [...new Set(last.map(r => r.level))];
  ok(levels.length === 1, `A4: po 12 turach WSZYSTKIE miasta mają ten sam poziom Wyżywienia (got ${levels.join(',')})`);
  ok(base.przyrostImperium > 0,
    `A5: łączny przyrost ludności imperium DODATNI (${base.popStart} → ${base.popEnd})`);
  ok(last.every(r => r.wzrost >= 0),
    'A6: żadne miasto nie kurczy się na końcu (brak ujemnego WZROST% mimo dodatniego bilansu — objaw ze zrzutu)');
}

// ===========================================================================
// B. Miasto na limicie ludności (własność B)
// ===========================================================================
console.log('\n-- B. Miasto na limicie ludności: przyrost 0, racje tylko do potrzeby, porcja wraca do puli --');
ok(NOWE_API, 'B/D: nowe API wyrównywania (resolveEqualGrowthRationPlan, WYZYWIENIE_POZIOM_NA_LIMICIE) jest obecne');
if (NOWE_API) {
  const capByCity = new Map(SPEC.map(([id]) => [id, M.cityPopulationCap(false, false, econParams)]));
  const res = runScenario(N, { popCapByCityId: capByCity });
  const cap = M.cityPopulationCap(false, false, econParams);
  const popStartById = new Map(SPEC.map(([id, , pop]) => [id, pop]));
  const capped = res.cities.filter(c => c.population >= cap);
  ok(capped.length > 0, `B0: scenariusz faktycznie ma miasta na limicie ludności (cap=${cap}, ${capped.length} miast)`);
  ok(capped.every(c => M.getCityRationLevel(c) === M.WYZYWIENIE_POZIOM_NA_LIMICIE),
    `B1: miasto na limicie stoi na poziomie „potrzeby" ${M.WYZYWIENIE_POZIOM_NA_LIMICIE} (got ${capped.map(c => M.getCityRationLevel(c)).join(',')}) — nie konsumuje racji ponad potrzebę`);
  ok(M.rationGrowthPercent(M.WYZYWIENIE_POZIOM_NA_LIMICIE) === 0,
    'B2: poziom „potrzeby" daje dokładnie 0% wzrostu z racji — miasto na limicie nie rośnie i się nie kurczy');
  const lastRows = res.turns[N - 1].rows;
  for (const c of res.cities.filter(x => popStartById.get(x.id) >= cap)) {
    ok(c.population === popStartById.get(c.id),
      `B3(${c.name}): miasto już na limicie ma przyrost 0 przez wszystkie ${N} tur (start ${popStartById.get(c.id)}, koniec ${c.population}, cap ${cap})`);
  }
  ok(res.cities.every(c => c.population <= Math.max(cap, popStartById.get(c.id))),
    'B3b: żadne miasto nie przekroczyło swojego limitu ludności');
  for (const c of capped) {
    const r = lastRows.find(x => x.id === c.id);
    ok(r.bilans > 0, `B4(${c.name}): porcja wraca do puli — bilans lokalny miasta na limicie dodatni (got ${r.bilans})`);
  }
  // Porcja odzyskana z miast na limicie MUSI podnieść wspólny poziom pozostałym.
  const citiesForPlan = mkCities(3);
  const naLimicie = citiesForPlan.filter(c => c.population >= cap);
  const econForPlan = buildEcon(citiesForPlan, mkProd(1));
  const planBez = M.resolveEqualGrowthRationPlan({
    ownerId: 0, cities: citiesForPlan, econ: econForPlan, zapasyPrzed: ZAPASY_START,
    rationParams, onlyAutoManaged: true, requireFlowBalance: true, kosztArmii: 20,
  });
  const planZ = M.resolveEqualGrowthRationPlan({
    ownerId: 0, cities: citiesForPlan, econ: econForPlan, zapasyPrzed: ZAPASY_START,
    rationParams, onlyAutoManaged: true, requireFlowBalance: true, kosztArmii: 20,
    popCapByCityId: capByCity,
  });
  ok(planZ.uniformLevel > planBez.uniformLevel,
    `B5: zwolniona porcja miast na limicie PODNOSI wspólny poziom pozostałym (${planBez.uniformLevel} → ${planZ.uniformLevel})`);
  ok(planZ.atPopCapCityIds.length === naLimicie.length
     && planZ.atPopCapCityIds.every(id => planZ.levelByCityId.get(id) === M.WYZYWIENIE_POZIOM_NA_LIMICIE),
    `B6: plan wyprowadza WSZYSTKIE ${naLimicie.length} miast na limicie z wyrównywania i daje im osobny poziom potrzeby (got ${planZ.atPopCapCityIds.length})`);
  ok(planBez.atPopCapCityIds.length === 0,
    'B6b: bez mapy limitów (dzisiejsze wywołania z main.ts) plan zachowuje się jak przed własnością (B) — wsteczna kompatybilność');

  // --- Kierunek NIEDOBORU (zarzut 3 rundy 1): B5 sprawdza tylko nadmiar, a defekt siedział
  // w drugą stronę — przy wspólnym poziomie PONIŻEJ poziomu potrzeby miasto na limicie
  // konsumowało DROŻSZE racje niż miasta rosnące i spychało je o cały poziom niżej.
  const citiesNd = mkCities(3);
  const econNd = buildEcon(citiesNd, mkProd(0.25));
  const commonNd = {
    ownerId: 0, cities: citiesNd, econ: econNd, zapasyPrzed: ZAPASY_START,
    rationParams, onlyAutoManaged: true, requireFlowBalance: true, kosztArmii: 20,
  };
  const ndBez = M.resolveEqualGrowthRationPlan({ ...commonNd });
  const ndZ = M.resolveEqualGrowthRationPlan({ ...commonNd, popCapByCityId: capByCity });
  ok(ndBez.uniformLevel < M.WYZYWIENIE_POZIOM_NA_LIMICIE,
    `B7a: scenariusz niedoboru faktycznie schodzi PONIŻEJ poziomu potrzeby (${ndBez.uniformLevel} < ${M.WYZYWIENIE_POZIOM_NA_LIMICIE}) — inaczej B7b nic nie sprawdza`);
  ok(ndZ.uniformLevel >= ndBez.uniformLevel,
    `B7b: w NIEDOBORZE włączenie własności (B) NIE pogarsza miast rosnących (bez limitów ${ndBez.uniformLevel} → z limitami ${ndZ.uniformLevel}) — porcja miasta na limicie ma wracać do puli, nie zabierać z niej`);
  const ndLvlNaLimicie = ndZ.atPopCapCityIds.map(id => ndZ.levelByCityId.get(id));
  ok(ndLvlNaLimicie.length > 0 && ndLvlNaLimicie.every(l => l <= ndZ.uniformLevel + 1e-9),
    `B7c: miasto na limicie NIGDY nie stoi wyżej niż miasta rosnące (poziomy na limicie ${ndLvlNaLimicie.join(',')} vs wspólny ${ndZ.uniformLevel}) — nie jest uprzywilejowane kosztem rosnących`);
}

// ===========================================================================
// C. Tempo CAŁEJ cywilizacji skaluje się z żywnością
// ===========================================================================
console.log('\n-- C. Połowa żywności: WSZYSTKIE miasta zwalniają, żadne nie staje kosztem innych --');
{
  const half = runScenario(N, { prodScale: 0.5 });
  const pelne = base.turns[N - 1].rows;
  const polowa = half.turns[N - 1].rows;
  const lvlPelne = [...new Set(pelne.map(r => r.level))];
  const lvlPolowa = [...new Set(polowa.map(r => r.level))];
  ok(lvlPolowa.length === 1, `C1: przy połowie żywności wszystkie miasta nadal mają JEDEN wspólny poziom (got ${lvlPolowa.join(',')})`);
  ok(lvlPolowa[0] < lvlPelne[0], `C2: wspólny poziom SPADA przy mniejszej żywności (${lvlPelne[0]} → ${lvlPolowa[0]}) — cała cywilizacja zwalnia`);
  for (const r of polowa) {
    const full = pelne.find(x => x.id === r.id);
    ok(r.level < full.level + 1e-9,
      `C3(${r.name}): zwalnia razem z resztą (poziom ${full.level} → ${r.level}) — żadne miasto nie zachowuje pełnych racji kosztem innych`);
  }
  ok(maxSameSizeSpread(half.turns) < 1e-9,
    `C4: przy połowie żywności miasta tej samej wielkości nadal mają IDENTYCZNY WZROST% — żadne nie staje, gdy rówieśnik pędzi (rozrzut ${maxSameSizeSpread(half.turns)})`);
  ok(inverseDependencyViolations(half.turns).length === 0,
    'C4b: przy połowie żywności odwrotna zależność też nie wraca');
  ok(!anyHunger(half.turns), 'C5: przy połowie żywności nadal ŻADNE miasto nie głoduje');
}

// ===========================================================================
// D. Rozstrzygnięcie hipotezy „wszystko-albo-nic" (recon) — zapis pomiaru w bramce
// ===========================================================================
console.log('\n-- D. Kontrfaktyk maxSafePoziomRacjiForCity jest niezależny od kolejności pytań --');
{
  // Imperium na wyraźnym minusie: wszystkie miasta na Wyżywieniu 5 przy tej samej produkcji
  // (odpowiednik stanu „kilka miast właśnie urosło, koszt racji przeskoczył produkcję").
  const cities = mkCities(5);
  const econ = buildEcon(cities, mkProd(1));
  const kosztArmii = M.militaryFoodConsumptionWithSpichlerz(mkUnits(5), 0, upkeep, {});
  const nad = M.computeEmpireCityFoodNadwyzka(econ.perCity, 0);
  ok(nad - kosztArmii < 0, `D0: scenariusz faktycznie jest na minusie (flow ${nad} − armia ${kosztArmii} = ${nad - kosztArmii})`);
  const answers = cities.map(c => M.maxSafePoziomRacjiForCity({
    cityId: c.id, ownerId: 0, cities, econ, zapasyPrzed: ZAPASY_START, rationParams, kosztArmii,
  }));
  const uniq = [...new Set(answers)];
  ok(uniq.length === 1,
    `D1: ten sam deficyt imperium daje TĘ SAMĄ odpowiedź dla każdego miasta (got ${uniq.join(',')}) — żadne pojedyncze miasto nie pochłania całej korekty (dawniej: Sparta 0 vs Jin 2)`);
  ok(uniq[0] > M.WYZYWIENIE_MIN,
    `D2: żadne miasto nie jest spychane na ${M.WYZYWIENIE_MIN} (−10% wzrostu) przez cudzy deficyt (got ${uniq[0]})`);
}

// ===========================================================================
// E. ANTY-SAMOOSZUKIWANIE: wariant „zatrzymaj wszystkich" NIE przechodzi tej bramki
// ===========================================================================
console.log('\n-- E. Wariant kontrolny „zatrzymaj wszystkich" musi NIE przejść --');
{
  // Wariant 1: wszystkim racje 1,5 → 0% z racji, imperium zamrożone na dźwigni autowyżywienia.
  const stop = runScenario(N, { frozenLevel: 1.5 });
  const PROG = stop.przyrostImperium;
  const naprawa = assertEqualGrowth(base, PROG);
  ok(naprawa.pass,
    `E1: układ po naprawie przechodzi wszystkie warunki JEDNOCZEŚNIE (rozrzut ${naprawa.spread}, głód nie, przyrost ${naprawa.przyrost} > próg ${PROG})`);

  const ocenaStop = assertEqualGrowth(stop, PROG);
  ok(ocenaStop.maleRozrzut, 'E2: wariant „zatrzymaj wszystkich" MA zerowy rozrzut (dlatego sam rozrzut nie jest dowodem)');
  ok(ocenaStop.brakGlodu, 'E3: wariant „zatrzymaj wszystkich" NIE głodzi (drugi warunek też sam nie wystarcza)');
  ok(!ocenaStop.pass,
    `E4: a mimo to NIE PRZECHODZI bramki — imperium stoi (przyrost ${ocenaStop.przyrost})`);
  ok(!ocenaStop.dodatniPrzyrost,
    `E5: dokładnie ten warunek go zatrzymuje: przyrost imperium ${ocenaStop.przyrost} nie jest OSTRO większy od progu ${PROG}`);
  ok(naprawa.przyrost > ocenaStop.przyrost,
    `E5b: naprawa rośnie SZYBCIEJ niż wariant zamrożony (${naprawa.przyrost} vs ${ocenaStop.przyrost}) — wyrównanie nie jest zatrzymaniem`);

  // Wariant 2: wszystkim racje 0 → dźwignia wzrostu wyzerowana w drugą stronę.
  const glod = runScenario(N, { frozenLevel: 0 });
  const ocenaGlod = assertEqualGrowth(glod, PROG);
  ok(!ocenaGlod.pass && ocenaGlod.przyrost <= PROG,
    `E6: wariant „racje 0 wszystkim" też nie przechodzi (przyrost ${ocenaGlod.przyrost} ≤ próg ${PROG})`);
}

cleanup();
console.log(`\nautowyzywienie-rowny-wzrost: ${passed}/${passed + failed}`);
process.exit(failed === 0 ? 0 : 1);
