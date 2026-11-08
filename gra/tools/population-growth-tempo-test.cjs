'use strict';
/**
 * population-growth-tempo-test.cjs — tempo wzrostu + asymetria trudnosci + populationGrowth.
 * Run: node tools/population-growth-tempo-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[population-growth-tempo-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.population-growth-tempo-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.population-growth-tempo-bundle.cjs');
const SRC = process.env.PGT_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY_TS = `
export { WZROST_LUDNOSCI_PACE, applyGrowthThresholdPace } from ${JSON.stringify(SRC + '/game/population-growth-tempo')};
export { populationGrowth } from ${JSON.stringify(SRC + '/game/economy')};
export {
  getPopulationGrowthThresholdMultiplier,
  applyPopulationGrowthThreshold,
} from ${JSON.stringify(SRC + '/game/difficulty-cost')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[population-growth-tempo-test] esbuild failed:\n', e.message || e);
  process.exit(1);
}

const {
  WZROST_LUDNOSCI_PACE,
  applyGrowthThresholdPace,
  populationGrowth,
  getPopulationGrowthThresholdMultiplier,
  applyPopulationGrowthThreshold,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  OK:', msg); }
  else { failed++; console.error('  FAIL:', msg, `(got ${a}, want ${b})`); }
}
function assert(cond, msg) {
  if (cond) { passed++; console.log('  OK:', msg); }
  else { failed++; console.error('  FAIL:', msg); }
}

console.log('\n[population-growth-tempo-test] Uruchamiam testy...\n');

// Tempo kreatora (pop 3 -> 4, bazowy prog 34)
eq(applyGrowthThresholdPace(34, 'wysoki'), 34, 'wysoki x1: prog 34 -> 34');
eq(applyGrowthThresholdPace(34, 'normalny'), 68, 'normalny x2: prog 34 -> 68');
eq(applyGrowthThresholdPace(34, 'wolny'), 136, 'wolny x4: prog 34 -> 136');
eq(applyGrowthThresholdPace(1, 'wolny'), 4, 'minimum po zaokragleniu: 1*4 -> 4');
eq(WZROST_LUDNOSCI_PACE.wysoki, 1.0, 'WZROST_LUDNOSCI_PACE.wysoki === 1.0');

const params = {
  progWzrostuWspolczynnik: 8,
  zdrowieModyfikatorWspolczynnik: 0,
  spichlerzZachowaniePoPrzroscie: 0.5,
  akweduktProgLudnosci: 5,
  akweduktMaxLudnosci: 15,
};

// Cap 5/15 — bez zmian przy mnozniku progu
const atCap = { ludnosc: 5, zdrowie: 0, maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0 };
const hardPlayerMult = getPopulationGrowthThresholdMultiplier(0, 'normalny', 'hard');
const rCap = populationGrowth(atCap, 200, params, hardPlayerMult);
assert(!rCap.wzrost && rCap.nowaLudnosc === 5, 'cap 5 bez akweduktu — brak wzrostu');

const withAq = { ...atCap, maAkwedukt: true, ludnosc: 15 };
const rCapAq = populationGrowth(withAq, 200, params, 1);
assert(!rCapAq.wzrost && rCapAq.nowaLudnosc === 15, 'cap 15 z akweduktem — brak wzrostu do 16');

// Normalny + trudna: gracz x4, AI x1 (przyklad Macieja)
eq(getPopulationGrowthThresholdMultiplier(0, 'normalny', 'hard'), 4, 'hard gracz: normalny tempo x4');
eq(getPopulationGrowthThresholdMultiplier(5, 'normalny', 'hard'), 1, 'hard AI: normalny tempo x1');

const cityPop1 = { ludnosc: 1, zdrowie: 0, maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 70 };
const rGrowPlayer = populationGrowth(cityPop1, 5, params, 4);
assert(rGrowPlayer.wzrost && rGrowPlayer.nowaLudnosc === 2, 'gracz hard: 70+5 >= 72 → wzrost');

const cityAi = { ludnosc: 1, zdrowie: 0, maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 12 };
const rGrowAi = populationGrowth(cityAi, 8, params, 1);
assert(rGrowAi.wzrost && rGrowAi.nowaLudnosc === 2, 'AI hard: 12+8 >= 18 → wzrost');

const multAiEasy = getPopulationGrowthThresholdMultiplier(3, 'normalny', 'easy');
eq(multAiEasy, 4, 'easy AI: normalny x4');
const cityAiEasy = { ludnosc: 1, zdrowie: 0, maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 50 };
const rNoGrowAi = populationGrowth(cityAiEasy, 5, params, multAiEasy);
assert(!rNoGrowAi.wzrost, 'easy AI: 50+5 < 72 — brak wzrostu');

eq(applyPopulationGrowthThreshold(18, 0, 'wysoki', 'normal'), 18, 'normalna trudnosc symetria');

console.log(`\n[population-growth-tempo-test] Wyniki: ${passed} zaliczone, ${failed} niezaliczone`);
if (failed > 0) {
  console.error('[population-growth-tempo-test] FAIL');
  process.exit(1);
}
console.log('[population-growth-tempo-test] ZIELONY');
process.exit(0);
