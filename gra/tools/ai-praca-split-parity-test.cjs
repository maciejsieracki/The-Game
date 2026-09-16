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
export { splitPraca } from ${JSON.stringify(SRC + '/game/production')};
export {
  civAiImprovementAutomationPercentForOwner,
  improvementBudgetFromCumulativePool,
} from ${JSON.stringify(SRC + '/game/civ-ai-allocation')};
export { getImprovementMeta } from ${JSON.stringify(SRC + '/game/improvement-tech')};
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

const {
  decideAITurn,
  splitPraca,
  civAiImprovementAutomationPercentForOwner,
  improvementBudgetFromCumulativePool,
  getImprovementMeta,
} = require(BUNDLE_FILE);

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

function runProductionConsumer({ ownerKind, ownerId, defensiveCopy = false, automationPercentOverride }) {
  const automationPercent = automationPercentOverride === undefined
    ? civAiImprovementAutomationPercentForOwner(ownerKind, 'grecy', 'normal')
    : automationPercentOverride;
  const cumulativePool = 100;
  const improvementBudgetCap = improvementBudgetFromCumulativePool(cumulativePool, automationPercent);
  const picks = runPlanner({ ownerId, defensiveCopy, improvementBudgetCap });
  const spent = picks.reduce(
    (sum, pick) => sum + (getImprovementMeta(pick.key)?.kosztPraca ?? 0),
    0,
  );
  return { automationPercent, improvementBudgetCap, picks, spent };
}

// R-PRACA-JEDEN-PODZIAL-Q1 — AKTUALIZACJA (uzasadnienie w 01-operator.md):
//   CO PILNOWALY bloki 1 i 6: ze DRUGI podzial puli (`splitEmpirePracaBudget`) daje AI
//     ten sam absolutny budzet ulepszen co graczowi.
//   DLACZEGO STARY WARUNEK PRZESTAL BYC PRAWDA: drugi podzial usuniety — parytet ma byc
//     na JEDYNYM podziale, inaczej AI i gracz znow liczyliby Prace dwa razy.
//   CO PILNUJE TERAZ: ten sam parytet na `splitPraca` (jedyny podzial) — identyczna
//     jednostka miary i identyczny cap dla gracza i dla AI.
console.log('1. Jedyny podział: 100 Pracy przy 50% budynków → 50 budynki + 50 pula (ulepszenia)');
{
  const split = splitPraca(100, 0.5);
  eq(split.doBudynkow, 50, 'doBudynkow = 50');
  eq(split.doPuli, 50, 'doPuli = 50');
  eq(split.doBudynkow + split.doPuli, split.total, 'split zachowuje całą Pracę');
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

console.log('5. Koperta owner-aware z kumulowanej puli — produkcyjny planner');
{
  const scenarios = [
    { ownerKind: 'major-ai', ownerId: 7, defensiveCopy: false },
    { ownerKind: 'city-state', ownerId: 8, defensiveCopy: false },
    { ownerKind: 'defensive-copy', ownerId: 9, defensiveCopy: true },
    { ownerKind: 'player', ownerId: 0, defensiveCopy: false },
    { ownerKind: 'hotseat', ownerId: 10, defensiveCopy: false },
  ];
  const results = new Map(
    scenarios.map(s => [`${s.ownerKind}:${s.ownerId}`, {
      scenario: s,
      canonical: runProductionConsumer(s),
    }]),
  );
  for (const kind of ['major-ai', 'city-state', 'defensive-copy']) {
    const result = [...results.values()].find(({ scenario }) => scenario.ownerKind === kind);
    eq(result.canonical.automationPercent, 100, `${kind} dostaje 100% kumulowanej puli`);
    eq(result.canonical.improvementBudgetCap, 100, `${kind} dostaje absolutny cap 100`);
    assert(result.canonical.spent > 0, `${kind} production consumer wydaje dodatni budżet`);
    assert(result.canonical.spent <= result.canonical.improvementBudgetCap,
      `${kind} consumer mieści się w absolutnym capie (${result.canonical.spent} <= ${result.canonical.improvementBudgetCap})`);
  }
  for (const kind of ['player', 'hotseat']) {
    const result = [...results.values()].find(({ scenario }) => scenario.ownerKind === kind);
    eq(result.canonical.automationPercent, 33, `${kind} zostaje przy 33%`);
    eq(result.canonical.improvementBudgetCap, 33, `${kind} ma absolutny cap 33`);
    assert(result.canonical.spent <= result.canonical.improvementBudgetCap,
      `${kind} consumer respektuje negatywny cap (${result.canonical.spent} <= ${result.canonical.improvementBudgetCap})`);
  }

  // Mutacja 100% → 33% musi zmienić obserwowalny wydatek każdego AI consumer.
  for (const { scenario, canonical } of results.values()) {
    if (!['major-ai', 'city-state', 'defensive-copy'].includes(scenario.ownerKind)) continue;
    const mutated = runProductionConsumer({ ...scenario, automationPercentOverride: 33 });
    assert(canonical.spent > mutated.spent,
      `${scenario.ownerKind} mutacja 100%→33% zmienia wydatek (${canonical.spent} > ${mutated.spent})`);
    assert(mutated.spent <= mutated.improvementBudgetCap,
      `${scenario.ownerKind} mutant nadal jest ograniczony capem 33 (${mutated.spent} <= ${mutated.improvementBudgetCap})`);
  }

  // Odwrotna mutacja 33% → 100% musi ujawnić złamanie kontroli player/hotseat.
  for (const { scenario, canonical } of results.values()) {
    if (!['player', 'hotseat'].includes(scenario.ownerKind)) continue;
    const mutated = runProductionConsumer({ ...scenario, automationPercentOverride: 100 });
    assert(mutated.spent > canonical.spent,
      `${scenario.ownerKind} mutacja 33%→100% zmienia wydatek (${mutated.spent} > ${canonical.spent})`);
    assert(canonical.spent <= canonical.improvementBudgetCap,
      `${scenario.ownerKind} canonical pozostaje ograniczony do 33%`);
  }
}

console.log('6. Kontrakt 10% ulepszeń → 90% budynków działa identycznie dla ownera AI/MP');
{
  const split = splitPraca(100, 0.9);
  eq(split.doPuli, 10, 'AI/MP: 10% Pracy na ulepszenia (pula)');
  eq(split.doBudynkow, 90, 'AI/MP: 90% Pracy na budynki');
  eq(split.total, split.doPuli + split.doBudynkow, 'AI/MP: split zachowuje sumę');
}

console.log(`\nai-praca-split-parity-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
