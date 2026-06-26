'use strict';
/**
 * growthmult-compound-test.cjs
 * Standalone test for growthMult (7.4) and compound upkeep (7.5).
 * Run from gra/:  node tools/growthmult-compound-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); } catch (e) { console.error('esbuild not found'); process.exit(1); }
})();

const GRA_ROOT    = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.growthmult-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.growthmult-bundle.cjs');

const ENTRY_TS = `
export { populationGrowth } from '../src/game/economy';
export { buildingEffectAtLevel, BUILDING_LEVEL_FACTOR } from '../src/game/production';
export { buildingUpkeep } from '../src/game/economy-upkeep';
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
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[growthmult-compound-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);

let passed = 0; let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  [OK] ' + label); passed++; }
  else { console.error('  [FAIL] ' + label); failed++; }
}
function eq(a, b, label) { ok(a === b, label + ' (got=' + a + ', want=' + b + ')'); }
function near(a, b, eps, label) { ok(Math.abs(a - b) < eps, label + ' (got=' + a + ', want~=' + b + ')'); }

// ===========================================================================
// 1. compound buildingEffectAtLevel (production.ts)
// ===========================================================================
console.log('\n--- 7.5 compound buildingEffectAtLevel ---');
// level 1: baza * 1.10^0 = baza
near(M.buildingEffectAtLevel(10, 1), 10, 0.001, 'baza=10 lvl1 -> 10.0');
// level 2: 10 * 1.10 = 11
near(M.buildingEffectAtLevel(10, 2), 11, 0.001, 'baza=10 lvl2 -> 11.0');
// level 3: 10 * 1.21 = 12.1
near(M.buildingEffectAtLevel(10, 3), 12.1, 0.001, 'baza=10 lvl3 -> 12.1');
// level 4: 10 * 1.331 = 13.31
near(M.buildingEffectAtLevel(10, 4), 13.31, 0.001, 'baza=10 lvl4 -> 13.31');
// BUILDING_LEVEL_FACTOR should be 1.10
near(M.BUILDING_LEVEL_FACTOR, 1.10, 0.001, 'BUILDING_LEVEL_FACTOR = 1.10');

// ===========================================================================
// 2. compound buildingUpkeep (economy-upkeep.ts)
// ===========================================================================
console.log('\n--- 7.5 compound buildingUpkeep ---');
// flat override always wins
eq(M.buildingUpkeep({ utrzymanie: 5, przyrostUtrzymania: 1 }, 3, 99), 99, 'flat override wins');
// compound: floor(baza * 1.10^(level-1))
// baza=5, lvl1: floor(5) = 5
eq(M.buildingUpkeep({ utrzymanie: 5, przyrostUtrzymania: 1 }, 1), 5, 'compound baza=5 lvl1 -> 5');
// baza=5, lvl2: floor(5 * 1.10) = floor(5.5) = 5
eq(M.buildingUpkeep({ utrzymanie: 5, przyrostUtrzymania: 1 }, 2), 5, 'compound baza=5 lvl2 -> 5');
// baza=5, lvl3: floor(5 * 1.21) = floor(6.05) = 6
eq(M.buildingUpkeep({ utrzymanie: 5, przyrostUtrzymania: 1 }, 3), 6, 'compound baza=5 lvl3 -> 6');
// baza=10, lvl3: floor(10 * 1.21) = 12
eq(M.buildingUpkeep({ utrzymanie: 10, przyrostUtrzymania: 2 }, 3), 12, 'compound baza=10 lvl3 -> 12');
// baza=0 -> always 0
eq(M.buildingUpkeep({ utrzymanie: 0, przyrostUtrzymania: 5 }, 5), 0, 'baza=0 -> 0 at any level');

// ===========================================================================
// 3. growthMult hook via populationGrowth (simulates turn-economy logic)
// ===========================================================================
console.log('\n--- 7.4 growthMult via food scaling ---');

// Base city (with spichlerz to enable accumulation)
const cityBase = {
  id: 'test', ludnosc: 3, zdrowie: 0,
  czyStolica: true, maSpichlerz: true, maAkwedukt: false,
  magazynZywnosci: 0, specjalisci: [], kolejkaProdukcji: [],
  podzialoHandlu: { procentNauka: 60, procentPieniadz: 30, procentLuksus: 10 },
  podzialooPracy: { procentBudynki: 70 },
};

const params = {
  progWzrostuWspolczynnik: 8,
  spichlerzZachowaniePoPrzroscie: 0.5,
  akweduktProgLudnosci: 6,
  zywnoscZuzytkaPopulacja: 1,
  zdrowieModyfikatorWspolczynnik: 0.05,
  korupcjaWspolczynnikDystansu: 2,
  korupcjaWspolczynnikMiast: 1,
  korupcjaCap: 0.5,
  budynekMlynMnoznikPracy: 2,
  budynekMlynBonusPracy: 2,
  budynekCegielniBonusPracy: 0.25,
  budynekTargowiskoBonusHandlu: 0.5,
  budynekBibliotekaBonusNauki: 0.5,
  budynekMennicaMnoznik: 1,
  suwaakHandelNaukaDefault: 60,
  suwaakHandelPieniadz: 30,
  suwaakHandelLuksus: 10,
  suwaakPracaBudynki: 70,
  suwaakPracaTeren: 30,
};

// With growthMult=1 (default): zywnoscNetto=5 -> magazyn = 5
const r1 = M.populationGrowth(cityBase, 5, params);
eq(r1.nowyMagazynZywnosci, 5, 'growthMult=1 zywnoscNetto=5 -> magazyn=5');
ok(!r1.wzrost, 'growthMult=1 no growth yet (threshold = 10+3*8=34)');

// With growthMult=0.5 (unrest): effectively zywnosc=5*0.5=2.5 -> magazyn=2
// Simulates: caller multiplies zywnoscNetto by growthMult before passing to populationGrowth
const r2 = M.populationGrowth(cityBase, 5 * 0.5, params);
eq(r2.nowyMagazynZywnosci, 2, 'growthMult=0.5 -> food inflow=2.5 -> floor=2 -> magazyn=2');
ok(!r2.wzrost, 'growthMult=0.5 still no growth');

// With growthMult=2 (bonus): zywnoscNetto=5*2=10 -> magazyn=10
const r3 = M.populationGrowth(cityBase, 5 * 2, params);
eq(r3.nowyMagazynZywnosci, 10, 'growthMult=2 -> food inflow=10 -> magazyn=10');

// Starvation test: growthMult < 1 makes deficit worse
const cityWithFood = Object.assign({}, cityBase, { magazynZywnosci: 3 });
// Normal starvation: zywnoscNetto=-5 -> magazyn=3-5=-2 -> 0, pop drops
const rs1 = M.populationGrowth(cityWithFood, -5, params);
ok(rs1.ubytek, 'negative zywnosc -> starvation');

// With growthMult=0.1 on positive food: slower accumulation
const r4 = M.populationGrowth(cityBase, 10 * 0.1, params);
eq(r4.nowyMagazynZywnosci, 1, 'growthMult=0.1 on food=10 -> floor(1) = 1');

// With growthMult=10 on food near threshold
// threshold for pop=3 = 10 + 3*8 = 34; need magazyn + zywnosc >= 34
// city already has 0 in store; need zywnoscNetto=34
const r5 = M.populationGrowth(cityBase, 34 * 1.0, params);
ok(r5.wzrost, 'growthMult=1 food=34 -> growth triggered');
// With growthMult=0.5: food=34*0.5=17 -> magazyn=17, no growth yet
const r6 = M.populationGrowth(cityBase, 34 * 0.5, params);
ok(!r6.wzrost, 'growthMult=0.5 on threshold food -> half effective -> no growth');

// --- summary ---------------------------------------------------------------
console.log('\ngrowthmult-compound-test: ' + passed + ' passed, ' + failed + ' failed');
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
