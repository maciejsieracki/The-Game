'use strict';
/**
 * ai-major-economy-test.cjs — Maciej 2026-08-04: major AI alokacja vs MP izolacja.
 * Run from gra/: node tools/ai-major-economy-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-major-economy-test] esbuild not found');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.ai-major-economy-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-major-economy-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  decideAIEconomySliders,
  chooseCityProduction,
  loadDifficultyParams,
  computeMajorAiEarlyGame,
  computeMajorArchetypeMilitaryFraction,
  AI_MAJOR_EARLY_PROCENT_BUDYNKI,
  isMajorAiOwner,
} from '../src/game/ai';
export {
  autoRaiseRationsForGrowth,
  autoBalanceRationsToSolvency,
  advanceEmpireFood,
  freshEmpireFoodState,
  buildEmpireFoodParams,
  maxSafePoziomRacjiForCity,
  isEmpireCityFoodSolvent,
  simulateCityFoodCentralPool,
  isCityAutoWyzywienieEnabled,
  computeEmpireCityFoodNadwyzka,
} from '../src/game/empire-food';
export { recomputeCityFoodBalancesInEcon } from '../src/game/turn-economy';
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
  console.error('[ai-major-economy-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const {
  decideAIEconomySliders,
  chooseCityProduction,
  loadDifficultyParams,
  computeMajorAiEarlyGame,
  computeMajorArchetypeMilitaryFraction,
  AI_MAJOR_EARLY_PROCENT_BUDYNKI,
  autoRaiseRationsForGrowth,
  autoBalanceRationsToSolvency,
  advanceEmpireFood,
  freshEmpireFoodState,
  buildEmpireFoodParams,
  maxSafePoziomRacjiForCity,
  isEmpireCityFoodSolvent,
  simulateCityFoodCentralPool,
  isCityAutoWyzywienieEnabled,
  computeEmpireCityFoodNadwyzka,
} = M;

let passed = 0;
let failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('FAIL:', msg); } }
function ok(cond, msg) { assert(cond, msg); }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const PARAMS = {
  deficytZapasowProg: 0,
  nadwyzkaZapasowProg: 50,
  krokProcentRozwoj: 10,
  krokProcentPracaNauka: 10,
  minOdstepTur: 3,
};

const CURRENT = { procentRozwoj: 70, procentBudynki: 70, procentNauka: 20 };

console.log('\n-- A. Major early slider: max wzrost + 40% budynki --');
{
  const r = decideAIEconomySliders({
    zapasyPanstwa: 25,
    atWar: false,
    turn: 10,
    lastSliderChangeTurn: null,
    current: { ...CURRENT },
    isMajorAi: true,
    isEarlyGame: true,
    treasuryGold: 100,
    upkeepGoldCost: 50,
  }, PARAMS);
  eq(r.procentRozwoj, 100, 'major early -> procentRozwoj 100');
  eq(r.procentBudynki, AI_MAJOR_EARLY_PROCENT_BUDYNKI, 'major early -> procentBudynki 40');
}

console.log('\n-- B. Major early peace: bez obniżania procentBudynki (legacy peace skip) --');
{
  const r = decideAIEconomySliders({
    zapasyPanstwa: 25,
    atWar: false,
    turn: 10,
    lastSliderChangeTurn: null,
    current: { procentRozwoj: 70, procentBudynki: 40, procentNauka: 20 },
    isMajorAi: true,
    isEarlyGame: true,
  }, PARAMS);
  eq(r.procentBudynki, 40, 'major early peace -> budynki bez spadku');
}

console.log('\n-- C. Archetype 60/40 fraction (ai-params) --');
{
  const warrior = computeMajorArchetypeMilitaryFraction({ wojsko: 2, ekonomia: -1, nauka: 0, obrona: 0 });
  const econ = computeMajorArchetypeMilitaryFraction({ wojsko: -1, ekonomia: 1, nauka: 0, obrona: 0 });
  assert(warrior >= 0.58 && warrior <= 0.62, `wojowniczy ~60% mil (got ${warrior})`);
  assert(econ >= 0.38 && econ <= 0.42, `gospodarczy ~40% mil (got ${econ})`);
}

function makeMap() {
  const hexes = {};
  for (let q = 0; q < 8; q++) {
    for (let r = 0; r < 8; r++) {
      hexes[`${q},${r}`] = {
        coords: { q, r },
        terenBazowy: 'laka',
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: 8, wysokoscR: 8, hexes, seed: 1, riverPaths: [] };
}

const map = makeMap();
const data = {
  units: [{ Jednostka: 'Wojownik' }, { Jednostka: 'Łucznik' }],
  buildings: [
    { id: 'spichlerz' }, { id: 'koszary' }, { id: 'mury' },
    { id: 'stolarnia' }, { id: 'cegielnia' }, { id: 'biblioteka' },
  ],
  terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4 }] },
  aiParams: { ekspansja_zagroz_zasieg: { wartosc: 5 }, trudnosc_poziom2_bonus_produkcja: { wartosc: 0 } },
};
const diff = loadDifficultyParams(data, 2);
const ZERO_MODS = { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };
const earlyCities = [{ id: 'c1', ownerId: 1, q: 2, r: 2, population: 2, name: 'A' }];
const units = [{ id: 'u1', ownerId: 1, typeId: 'Wojownik', q: 3, r: 2, ruch: 2, ruchLeft: 2 }];

console.log('\n-- D. Major early production: nie dominacja wojska --');
{
  const idMajor = chooseCityProduction(
    'c1', earlyCities, units, 1, data, ZERO_MODS,
    {
      cityBuildings: { c1: [] },
      currentTurn: 5,
      defensiveCopy: false,
      civAiProfile: { priorytetMilitarny: 8, priorytetEkonomia: 2, ekspansywnosc: 0, sklonnoscDoPodboju: 0, priorytetNauka: 5 },
    },
    map,
    diff,
  );
  assert(idMajor === 'spichlerz' || idMajor === 'Zwiadowca', `major early -> spichlerz/zwiadowca, got ${idMajor}`);
}

console.log('\n-- E. MP defensiveCopy: bootstrap infra bez major early penalty --');
{
  const idMp = chooseCityProduction(
    'c1', earlyCities, [], 1, data, ZERO_MODS,
    {
      cityBuildings: { c1: [] },
      currentTurn: 5,
      defensiveCopy: true,
    },
    map,
    diff,
  );
  eq(idMp, 'Wojownik', 'MP bez garnizonu -> Wojownik pierwszy');
}

console.log('\n-- F. autoRaiseRationsForGrowth przy nadwyżce --');
{
  const cities = [{
    id: 'c1', ownerId: 1, name: 'A', population: 2, poziomRacji: 2,
    q: 0, r: 0,
  }];
  const rationParams = {
    racjeZywnosc1: 2, racjeZywnosc2: 4, racjeZywnosc3: 6,
    racjeWzrostProc1: 3, racjeWzrostProc2: 5, racjeWzrostProc3: 7,
  };
  const econ = {
    perCity: [{
      cityId: 'c1',
      ownerId: 1,
      oblegany: false,
      zywnoscBrutto: 20,
      kosztRacji: 5,
      bilansLokalny: 15,
    }],
  };
  const r = autoRaiseRationsForGrowth({
    ownerId: 1,
    cities,
    econ,
    zapasyPrzed: 20,
    rationParams,
  });
  assert(r.adjusted, 'nadwyżka -> podniesione racje');
  assert(cities[0].poziomRacji > 2, 'poziomRacji wzrosł');
}

console.log('\n-- G. major AI: zapasy>0, nadwyżka<=0 — nadal może podnieść --');
{
  const cities = [{
    id: 'c1', ownerId: 1, name: 'A', population: 2, poziomRacji: 2,
    q: 0, r: 0,
  }];
  const rationParams = {
    racjeZywnosc1: 2, racjeZywnosc2: 4, racjeZywnosc3: 6,
    racjeWzrostProc1: 3, racjeWzrostProc2: 5, racjeWzrostProc3: 7,
  };
  const econ = {
    perCity: [{
      cityId: 'c1',
      ownerId: 1,
      oblegany: false,
      zywnoscBrutto: 8,
      kosztRacji: 10,
      bilansLokalny: -2,
    }],
  };
  const r = autoRaiseRationsForGrowth({
    ownerId: 1,
    cities,
    econ,
    zapasyPrzed: 50,
    rationParams,
  });
  assert(r.adjusted, 'AI major: zapasy pokrywają deficyt -> raise OK');
  assert(cities[0].poziomRacji > 2, 'AI poziomRacji wzrosł mimo braku nadwyżki produkcji');
}

console.log('\n-- H. gracz Q1=B: zapasy>0, nadwyżka<=0 — brak raise --');
{
  const cities = [{
    id: 'c1', ownerId: 0, name: 'P', population: 2, poziomRacji: 2,
    q: 0, r: 0,
  }];
  const rationParams = {
    racjeZywnosc1: 2, racjeZywnosc2: 4, racjeZywnosc3: 6,
    racjeWzrostProc1: 3, racjeWzrostProc2: 5, racjeWzrostProc3: 7,
  };
  const econ = {
    perCity: [{
      cityId: 'c1',
      ownerId: 0,
      oblegany: false,
      zywnoscBrutto: 8,
      kosztRacji: 10,
      bilansLokalny: -2,
    }],
  };
  const r = autoRaiseRationsForGrowth({
    ownerId: 0,
    cities,
    econ,
    zapasyPrzed: 50,
    rationParams,
    requireProductionSurplus: true,
  });
  eq(r.adjusted, false, 'gracz: tylko zapasy, brak nadwyżki -> no raise');
  eq(cities[0].poziomRacji, 2, 'gracz poziomRacji bez zmian');
}

console.log('\n-- I. gracz Q1=B: nadwyżka>0 — może podnieść --');
{
  const cities = [{
    id: 'c1', ownerId: 0, name: 'P', population: 2, poziomRacji: 2,
    q: 0, r: 0,
  }];
  const rationParams = {
    racjeZywnosc1: 2, racjeZywnosc2: 4, racjeZywnosc3: 6,
    racjeWzrostProc1: 3, racjeWzrostProc2: 5, racjeWzrostProc3: 7,
  };
  const econ = {
    perCity: [{
      cityId: 'c1',
      ownerId: 0,
      oblegany: false,
      zywnoscBrutto: 20,
      kosztRacji: 5,
      bilansLokalny: 15,
    }],
  };
  const r = autoRaiseRationsForGrowth({
    ownerId: 0,
    cities,
    econ,
    zapasyPrzed: 0,
    rationParams,
    requireProductionSurplus: true,
  });
  assert(r.adjusted, 'gracz: nadwyżka produkcji -> raise OK');
  assert(cities[0].poziomRacji > 2, 'gracz poziomRacji wzrosł');
}

const RATION_PARAMS = {
  racjeZywnosc1: 2, racjeZywnosc2: 4, racjeZywnosc3: 6,
  racjeWzrostProc1: 3, racjeWzrostProc2: 5, racjeWzrostProc3: 7,
};
const EF_PARAMS = buildEmpireFoodParams({
  ekonomia_miasta: {
    magazyn_centralny_baza_zywnosc: { normal: 500 },
    magazyn_centralny_bonus_zywnosc_na_budynek: { normal: 100 },
    glod_wojska_hp_frac: { normal: 0.08 },
    glod_wojska_karencja_tur: { normal: 3 },
  },
});
const UPKEEP = { jednostkaUtrzymanieStd: 1, zywnoscJednostkaRuch: 1, zywnoscJednostkaOboz: 0.5 };

console.log('\n-- J. Q2: raise cofa ostatni krok gdy pool < 0 --');
{
  const cities = [{
    id: 'c1', ownerId: 1, name: 'A', population: 2, poziomRacji: 2, q: 0, r: 0,
  }];
  const econ = {
    perCity: [{
      cityId: 'c1', ownerId: 1, oblegany: false,
      zywnoscBrutto: 20, kosztRacji: 5, bilansLokalny: 15,
    }],
  };
  M.recomputeCityFoodBalancesInEcon(econ.perCity, cities, RATION_PARAMS);
  const maxSafe = maxSafePoziomRacjiForCity({
    cityId: 'c1', ownerId: 1, cities, econ, zapasyPrzed: 0, rationParams: RATION_PARAMS,
  });
  cities[0].poziomRacji = maxSafe;
  M.recomputeCityFoodBalancesInEcon(econ.perCity, cities, RATION_PARAMS);
  const levelAtMax = cities[0].poziomRacji;
  const r = autoRaiseRationsForGrowth({
    ownerId: 1,
    cities,
    econ,
    zapasyPrzed: 0,
    rationParams: RATION_PARAMS,
  });
  eq(cities[0].poziomRacji, levelAtMax, 'na maxSafe raise nie podnosi wyżej (rollback)');
  const pool = simulateCityFoodCentralPool(0, econ.perCity, 1);
  assert(pool >= 0, 'po raise pool Spichlerza ≥ 0');
  assert(isEmpireCityFoodSolvent(0, econ.perCity, 1), 'solvent po raise');
  assert(!r.adjusted || cities[0].poziomRacji === levelAtMax, 'brak podniesienia ponad maxSafe');
}

console.log('\n-- K. Q4: advanceEmpireFood zapasy ≥ 0, glodWojska przy niedoborze --');
{
  const states = new Map([[0, freshEmpireFoodState()]]);
  states.get(0).zapasyPanstwa = 5;
  const econ = {
    perCity: [{
      cityId: 'c1', ownerId: 0, oblegany: false,
      zywnoscBrutto: 2, kosztRacji: 2, bilansLokalny: 0,
    }],
  };
  const units = Array.from({ length: 20 }, (_, i) => ({
    ownerId: 0, typeId: 'woj', category: 'wojskowa', id: `u${i}`,
  }));
  const ef = advanceEmpireFood(econ, units, states, UPKEEP, EF_PARAMS);
  const tick = ef.byOwner.get(0);
  ok(states.get(0).zapasyPanstwa >= 0, 'zapasyPanstwa clamped ≥ 0');
  ok(tick.zapasyPo >= 0, 'zapasyPo ≥ 0');
  ok(tick.glodWojska === true, 'glodWojska=true gdy koszt armii > dostępne');
}

console.log('\n-- L. Q5: onlyAutoManaged — tylko miasta z flagą --');
{
  const cities = [
    { id: 'c1', ownerId: 0, name: 'P1', population: 2, poziomRacji: 4, q: 0, r: 0 },
    { id: 'c2', ownerId: 0, name: 'P2', population: 2, poziomRacji: 4, q: 1, r: 0, autoWyzywienie: true },
  ];
  const econ = {
    perCity: [
      { cityId: 'c1', ownerId: 0, oblegany: false, zywnoscBrutto: 2, kosztRacji: 8, bilansLokalny: -6 },
      { cityId: 'c2', ownerId: 0, oblegany: false, zywnoscBrutto: 2, kosztRacji: 8, bilansLokalny: -6 },
    ],
  };
  const r = autoBalanceRationsToSolvency({
    ownerId: 0,
    cities,
    econ,
    zapasyPrzed: 0,
    rationParams: RATION_PARAMS,
    onlyAutoManaged: true,
  });
  eq(cities[0].poziomRacji, 4, 'miasto bez auto — bez zmian');
  assert(cities[1].poziomRacji < 4, 'miasto z auto — obniżone');
  assert(r.adjusted, 'auto balance adjusted dla flagowanego miasta');
  ok(!isCityAutoWyzywienieEnabled(cities[0]), 'gracz bez flagi -> auto WYŁ');
  ok(isCityAutoWyzywienieEnabled(cities[1]), 'gracz z flagą -> auto WŁ');
  ok(isCityAutoWyzywienieEnabled({ id: 'x', ownerId: 1, name: 'AI', population: 1, q: 0, r: 0 }), 'AI zawsze auto');
}

console.log('\n-- M. Q3: maxSafePoziomRacjiForCity ≤ max i solvent (gracz: FLOW-based, R-AUTO-WYZYWIENIE-CEL-BILANS-NIEUJEMNY) --');
{
  // AKTUALIZACJA (rozpoznanie #4, ECHO Macieja "zgoda"): backstop gracza (ownerId===0) jest
  // dziś FLOW-based (nadwyzka tej tury >=0), nie tylko stock-based isEmpireCityFoodSolvent
  // (rezerwa zapasyPrzed mogła pokryć deficyt). Ten test miał wcześniej TYLKO asercję
  // stock-based na "poziom powyżej maxSafe" (linia niżej: `poolOver<0 || !isEmpireCityFoodSolvent`)
  // -- to jest DOKŁADNIE stare, naprawiane kryterium: z zapasyPrzed=5 rezerwa pokrywała
  // dokładnie 0,5 kroku deficytu tuż powyżej NOWEGO (niższego) maxSafe, więc stary stock-based
  // check bywał "solvent=true" w miejscu, gdzie flow tej tury jest już ujemny -- to jest sam
  // mechanizm przestrzelenia z rozpoznania #4. Dodano asercje flow-based (computeEmpireCityFoodNadwyzka)
  // -- stock-based asercje NA maxSafe (nie POWYŻEJ) zostają, bo tam oba kryteria się zgadzają.
  const cities = [{
    id: 'c1', ownerId: 0, name: 'P', population: 5, poziomRacji: 2, q: 0, r: 0,
  }];
  const econ = {
    perCity: [{
      cityId: 'c1', ownerId: 0, oblegany: false,
      zywnoscBrutto: 10, kosztRacji: 10, bilansLokalny: 0,
    }],
  };
  const maxSafe = maxSafePoziomRacjiForCity({
    cityId: 'c1',
    ownerId: 0,
    cities,
    econ,
    zapasyPrzed: 5,
    rationParams: RATION_PARAMS,
  });
  assert(maxSafe <= 6, 'maxSafe ≤ 6');
  cities[0].poziomRacji = maxSafe;
  M.recomputeCityFoodBalancesInEcon(econ.perCity, cities, RATION_PARAMS);
  const pool = simulateCityFoodCentralPool(5, econ.perCity, 0);
  ok(pool >= 0, `maxSafe=${maxSafe}: pool ≥ 0`);
  ok(isEmpireCityFoodSolvent(5, econ.perCity, 0), `maxSafe=${maxSafe}: solvent`);
  ok(computeEmpireCityFoodNadwyzka(econ.perCity, 0) >= 0,
    `maxSafe=${maxSafe}: nadwyzka (flow TEJ tury) ≥ 0 bez pomocy rezerwy (gracz jest flow-based)`);
  cities[0].poziomRacji = maxSafe + 0.5;
  if (maxSafe < 6) {
    M.recomputeCityFoodBalancesInEcon(econ.perCity, cities, RATION_PARAMS);
    ok(computeEmpireCityFoodNadwyzka(econ.perCity, 0) < 0,
      'poziom powyżej maxSafe (gracz, FLOW-based): nadwyzka TEJ tury < 0 (rezerwa nie liczy się jako pokrycie)');
  }
}

console.log(`\nai-major-economy-test: ${passed} passed, ${failed} failed`);

try { fs.unlinkSync(ENTRY_FILE); } catch (_e) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_e) { /* noop */ }

process.exit(failed > 0 ? 1 : 0);
