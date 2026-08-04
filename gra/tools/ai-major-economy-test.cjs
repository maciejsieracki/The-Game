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
export { autoRaiseRationsForGrowth } from '../src/game/empire-food';
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
} = M;

let passed = 0;
let failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('FAIL:', msg); } }
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

console.log(`\nai-major-economy-test: ${passed} passed, ${failed} failed`);

try { fs.unlinkSync(ENTRY_FILE); } catch (_e) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_e) { /* noop */ }

process.exit(failed > 0 ? 1 : 0);
