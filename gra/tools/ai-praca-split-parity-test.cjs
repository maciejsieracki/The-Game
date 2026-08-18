'use strict';
/**
 * P-PRACA-SPLIT-FALA292-NIEPEŁNY-Q1 — pełny kontrakt routingu AI/MP.
 *
 * Pula 100 pkt Pracy jest dzielona raz: 50 pkt na budynki i 50 pkt na
 * ulepszenia. Po wydaniu części budynkowej planner dostaje pozostałe 50 pkt
 * jako stan puli oraz pierwotny, absolutny cap ulepszeń = 50. Ponowne
 * splitowanie pozostałych 50 pkt dałoby cap 25 i test mutacyjny to wykrywa.
 *
 * Uruchom z gra/: node tools/ai-praca-split-parity-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-praca-split-parity-test] esbuild not found:', e.message || e);
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.ai-praca-split-parity-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-praca-split-parity-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { splitEmpirePracaBudget } from ${JSON.stringify(SRC + '/game/production')};
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-praca-split-parity-test] esbuild bundling failed:', e.message || e);
  process.exit(1);
}

const { decideAITurn, splitEmpirePracaBudget } = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) passed++;
  else {
    failed++;
    console.error('  FAIL:', msg);
  }
}
function eq(actual, expected, msg) {
  assert(actual === expected, `${msg} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}

function makeFlatMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      hexes[`${q},${r}`] = {
        coords: { q, r },
        terenBazowy: 'rownina',
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}

function makeCity(ownerId, defensiveCopy) {
  return {
    id: defensiveCopy ? 'mp-city' : 'major-city',
    ownerId,
    q: 15,
    r: 15,
    name: defensiveCopy ? 'MP' : 'Major',
    population: 2,
  };
}

function runPlanner({ ownerId, defensiveCopy, improvementBudgetCap }) {
  const city = makeCity(ownerId, defensiveCopy);
  const map = makeFlatMap(30, 30);
  const commands = decideAITurn(ownerId, [], [city], map, {
    units: [],
    buildings: [],
    terrainYields: {
      terrain_types: [{ Teren: 'rownina', Zywnosc: 2, Praca: 1, Handel: 1 }],
    },
    aiParams: {},
  }, {
    civType: 'grecy',
    poziomTrudnosci: 2,
    defensiveCopy,
    cityBuildings: {},
    territoryNodes: [{
      q: city.q,
      r: city.r,
      pop: city.population,
      level: 1,
      ownerId,
    }],
    placedImprovements: new Map(),
    improvementTechs: new Set(['Rolnictwo']),
    // To jest pula pozostała po wydaniu aiBudget.doBudynkow = 50.
    pracaAvailable: 50,
    // To jest cap zachowany z pierwotnej puli 100, nie cap z pozostałych 50.
    improvementBudgetCap,
    civEra: 1,
  });
  return commands.filter(c => c.type === 'buildImprovement');
}

console.log('1. Split pierwotnej puli: 100 Pracy → 50 budynki + 50 ulepszenia');
{
  const split = splitEmpirePracaBudget(100, 50);
  eq(split.doBudynkow, 50, 'doBudynkow = 50');
  eq(split.doUlepszen, 50, 'doUlepszen = 50');
  eq(split.doBudynkow + split.doUlepszen, split.total, 'split zachowuje całą pulę');
}

console.log('2. Major AI: po wydaniu 50 na budynki nadal ma cap ulepszeń 50');
{
  const picks = runPlanner({ ownerId: 7, defensiveCopy: false, improvementBudgetCap: 50 });
  eq(picks.length, 1, 'major AI wybiera farmę z absolutnego budżetu 50');
  if (picks[0]) eq(picks[0].key, 'farma', 'major AI wybiera farma');
}

console.log('3. Miasto-państwo defensiveCopy: identyczny routing i wynik');
{
  const picks = runPlanner({ ownerId: 8, defensiveCopy: true, improvementBudgetCap: 50 });
  eq(picks.length, 1, 'defensiveCopy wybiera farmę z absolutnego budżetu 50');
  if (picks[0]) eq(picks[0].key, 'farma', 'defensiveCopy wybiera farma');
}

console.log('4. Mutacja capu 50 → 25 musi zostać wykryta (negacja drugiego splitu)');
{
  const expected = runPlanner({ ownerId: 7, defensiveCopy: false, improvementBudgetCap: 50 });
  const mutated = runPlanner({ ownerId: 7, defensiveCopy: false, improvementBudgetCap: 25 });
  eq(expected.length, 1, 'wariant kanoniczny nadal planuje 1 ulepszenie');
  eq(mutated.length, 0, 'mutacja do capu 25 nie przechodzi jako pełny budżet 50');
  assert(
    JSON.stringify(expected) !== JSON.stringify(mutated),
    'mutacja zmienia wynik — test nie jest tautologią',
  );
}

console.log('5. Strażnik routingu main.ts i brak drugiego splitu w planie AI');
{
  const mainSource = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
  const aiSource = fs.readFileSync(path.resolve(SRC, 'game', 'ai.ts'), 'utf8');
  assert(
    mainSource.includes('aiImprovementBudgetByOwner.set(ownerId, aiBudget.doUlepszen)'),
    'main.ts zachowuje pierwotne doUlepszen per owner',
  );
  assert(
    mainSource.includes('improvementBudgetCap: aiImprovementBudgetByOwner.get(ownerId)'),
    'main.ts przekazuje absolutny cap do decideAITurn/defensiveCopy',
  );
  assert(
    aiSource.includes('Number.isFinite(opts.improvementBudgetCap)'),
    'ai.ts respektuje jawny absolutny cap',
  );
  assert(
    !aiSource.includes('const pracaBudget = splitEmpirePracaBudget(pracaAvailable, 50);'),
    'ai.ts nie wykonuje ponownego splitu na pozostałej puli',
  );
}

console.log(`\nai-praca-split-parity-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
