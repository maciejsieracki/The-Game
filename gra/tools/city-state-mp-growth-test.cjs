'use strict';
/**
 * city-state-mp-growth-test.cjs — wzrost MP klastra (sameCiv)
 * Scenariusz: pop 1, Wyżywienie 6, produkcja 6 🍞, koszt racji 12 → bez auto-racji nie nakarmione.
 * Run: node tools/city-state-mp-growth-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.city-state-mp-growth-entry.ts');
const BUNDLE = path.resolve(__dirname, '.city-state-mp-growth-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  autoBalanceRationsToSolvency,
  advanceEmpireFood,
  freshEmpireFoodState,
  buildEmpireFoodParams,
} from '../src/game/empire-food';
export {
  applyPostCentralPopulationGrowth,
  buildRationParams,
  getCityRationLevel,
  migrateProcentRozwojToPoziomRacji,
} from '../src/game/population-growth-v85';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});

const M = require(BUNDLE);
let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

const upkeep = { jednostkaUtrzymanieStd: 1, zywnoscJednostkaRuch: 1, zywnoscJednostkaOboz: 0.5 };
const efParams = M.buildEmpireFoodParams({
  ekonomia_miasta: {
    magazyn_centralny_baza_zywnosc: { normal: 500 },
    magazyn_centralny_bonus_zywnosc_na_budynek: { normal: 100 },
  },
});
const rationParams = M.buildRationParams({});
const econParams = { akweduktProgLudnosci: 4, akweduktMaxLudnosci: 12 };

/** MP klastra: owner 3, Sparta — pop 1, startCityState, procentRozwoj 100 → Wyżywienie 6. */
function makeMpCity(name, ownerId = 3) {
  return {
    id: `cs_${name}`,
    ownerId,
    q: 0,
    r: 0,
    name,
    population: 1,
    startCityState: true,
    procentRozwoj: 100,
    poziomRacji: M.migrateProcentRozwojToPoziomRacji(100),
    wzrostUlamkowy: 0,
    turyBezDoplaty: 0,
    rationMigratedV114: true,
  };
}

function makeMpEcon(cityId, ownerId, zywnoscBrutto, kosztRacji) {
  const bilans = zywnoscBrutto - kosztRacji;
  return {
    cityId,
    ownerId,
    oblegany: false,
    zywnoscBrutto,
    kosztRacji,
    bilansLokalny: bilans,
    zywnoscNetto: bilans,
    zdrowie: 0,
    ludnoscPrzed: 1,
    ludnoscPo: 1,
  };
}

function runMpTurn(city, zywnoscBrutto, withAutoRation) {
  const kosztRacji = 1 * M.getCityRationLevel(city) * 2;
  const econ = {
    perCity: [makeMpEcon(city.id, city.ownerId, zywnoscBrutto, kosztRacji)],
    growth: 0,
    starved: 0,
  };
  const states = new Map([[city.ownerId, M.freshEmpireFoodState()]]);

  if (withAutoRation) {
    M.autoBalanceRationsToSolvency({
      ownerId: city.ownerId,
      cities: [city],
      econ,
      zapasyPrzed: 0,
      rationParams: efParams.rationParams,
    });
    const tick = econ.perCity[0];
    const newKoszt = 1 * M.getCityRationLevel(city) * 2;
    tick.kosztRacji = newKoszt;
    tick.bilansLokalny = zywnoscBrutto - newKoszt;
    tick.zywnoscNetto = tick.bilansLokalny;
  }

  const ef = M.advanceEmpireFood(econ, [], states, upkeep, efParams);
  M.applyPostCentralPopulationGrowth({
    cities: [city],
    econ,
    efResult: ef,
    map: { hexes: {} },
    territoryNodes: [],
    econParams,
    rationParams,
    builtByCity: new Map([[city.id, []]]),
  });
  return { ef, fed: ef.byOwner.get(city.ownerId)?.fedByCityId.get(city.id) === true };
}

console.log('--- T1: migrate procentRozwoj 100 → Wyżywienie 6 ---');
ok(M.migrateProcentRozwojToPoziomRacji(100) === 6, 'T1: start MP ma Wyżywienie 6');

console.log('\n--- T2: bez auto-racji — deficyt, nie nakarmione, brak wzrostu ---');
{
  const city = makeMpCity('Sparta');
  const before = city.wzrostUlamkowy;
  const { fed } = runMpTurn(city, 6, false);
  ok(!fed, 'T2a: produkcja 6 vs koszt 12 → nie nakarmione');
  ok(city.population === 1, 'T2b: pop nadal 1');
  ok(city.wzrostUlamkowy === before, 'T2c: brak ułamkowego wzrostu');
  ok(M.getCityRationLevel(city) === 6, 'T2d: racje bez zmian (brak auto-racji)');
}

console.log('\n--- T3: z auto-racją — obniżenie Wyżywienia, nakarmione, wzrost ---');
{
  const city = makeMpCity('Argos');
  const { fed } = runMpTurn(city, 6, true);
  ok(M.getCityRationLevel(city) < 6, 'T3a: auto-racja obniżyła Wyżywienie');
  ok(fed, 'T3b: po korekcie miasto nakarmione');
  ok(city.wzrostUlamkowy > 0, 'T3c: ułamkowy wzrost > 0 przy nakarmieniu');
}

console.log('\n--- T4: symulacja 15 tur MP (auto-racja) — pop rośnie z 1 ---');
{
  const city = makeMpCity('Korynt');
  let maxPop = 1;
  for (let t = 0; t < 15; t++) {
    const zywnoscBrutto = 6;
    runMpTurn(city, zywnoscBrutto, true);
    if (city.population > maxPop) maxPop = city.population;
  }
  ok(maxPop >= 2, `T4: po 15 turach pop >= 2 (got ${maxPop})`);
}

console.log(`\n=== city-state-mp-growth-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
