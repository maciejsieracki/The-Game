'use strict';
/**
 * growthmult-compound-test.cjs
 * Standalone test for growthMult (7.4) and building/upkeep level scaling (7.5,
 * now linear -- see decyzja Naster 2026-07-25; filename kept for doc continuity).
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
export { buildingEffectAtLevel } from '../src/game/production';
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
// 1. linear buildingEffectAtLevel (production.ts)
// ===========================================================================
console.log('\n--- 7.5 linear buildingEffectAtLevel ---');
// level 1: baza + przyrost*0 = baza
near(M.buildingEffectAtLevel(10, 3, 1), 10, 0.001, 'baza=10 przyrost=3 lvl1 -> 10.0');
// level 2: 10 + 3*1 = 13
near(M.buildingEffectAtLevel(10, 3, 2), 13, 0.001, 'baza=10 przyrost=3 lvl2 -> 13.0');
// level 3: 10 + 3*2 = 16
near(M.buildingEffectAtLevel(10, 3, 3), 16, 0.001, 'baza=10 przyrost=3 lvl3 -> 16.0');
// level 4: 10 + 3*3 = 19
near(M.buildingEffectAtLevel(10, 3, 4), 19, 0.001, 'baza=10 przyrost=3 lvl4 -> 19.0');
// przyrost=0 -> flat regardless of level
near(M.buildingEffectAtLevel(10, 0, 5), 10, 0.001, 'przyrost=0 lvl5 -> 10.0 (flat)');

// ===========================================================================
// 2. linear buildingUpkeep (economy-upkeep.ts)
// ===========================================================================
console.log('\n--- 7.5 linear buildingUpkeep ---');
// R-UTRZYMANIE-ZROZNICOWANE (2026-07-25, decyzja wlasciciela 19=A): flatOverride
// jest DOMYSLNA wartoscia tylko gdy budynek NIE MA wlasnego utrzymania w danych --
// nie nadpisuje juz istniejacej wartosci per-budynek (stary test kodowal odwrotne,
// wlasnie naprawione zachowanie -- patrz economy-upkeep.ts buildingUpkeep()).
eq(M.buildingUpkeep({ utrzymanie: 5, przyrostUtrzymania: 1 }, 3, 99), 7, 'per-building utrzymanie wins over flat override');
// budynek bez pola utrzymanie (undefined -> not finite) -> flat jest DOMYSLNA wartoscia
eq(M.buildingUpkeep({ przyrostUtrzymania: 1 }, 3, 99), 99, 'no per-building value -> flat default applies');
// budynek bez pola utrzymanie i bez flat override -> 0 (bezpieczny fallback)
eq(M.buildingUpkeep({ przyrostUtrzymania: 1 }, 3), 0, 'no per-building value, no flat default -> 0');
// utrzymanie=0 (Stela/Pomnik) to WARTOSC, nie "brak wpisu" -- flat NIE nadpisuje zera
// (0 jest falsy w JS, ale Number.isFinite(0) === true -- to jest wlasnie pulapka
// ktorej ma unikac buildingUpkeep()).
eq(M.buildingUpkeep({ utrzymanie: 0, przyrostUtrzymania: 0 }, 1, 99), 0, 'Stela utrzymanie=0 nie jest nadpisywana flat override');
// linear: floor(baza + przyrost*(level-1))
// baza=5, lvl1: floor(5) = 5
eq(M.buildingUpkeep({ utrzymanie: 5, przyrostUtrzymania: 1 }, 1), 5, 'linear baza=5 lvl1 -> 5');
// baza=5, lvl2: floor(5 + 1) = 6
eq(M.buildingUpkeep({ utrzymanie: 5, przyrostUtrzymania: 1 }, 2), 6, 'linear baza=5 lvl2 -> 6');
// baza=5, lvl3: floor(5 + 2) = 7
eq(M.buildingUpkeep({ utrzymanie: 5, przyrostUtrzymania: 1 }, 3), 7, 'linear baza=5 lvl3 -> 7');
// baza=10, przyrost=2, lvl3: floor(10 + 2*2) = 14
eq(M.buildingUpkeep({ utrzymanie: 10, przyrostUtrzymania: 2 }, 3), 14, 'linear baza=10 lvl3 -> 14');
// baza=0, przyrost=0 -> always 0 (linear: unlike the old compound formula, a
// zero base does NOT force zero at every level once przyrost > 0)
eq(M.buildingUpkeep({ utrzymanie: 0, przyrostUtrzymania: 0 }, 5), 0, 'baza=0 przyrost=0 -> 0 at any level');
// baza=0, przyrost=5, lvl5: floor(0 + 5*4) = 20
eq(M.buildingUpkeep({ utrzymanie: 0, przyrostUtrzymania: 5 }, 5), 20, 'linear baza=0 przyrost=5 lvl5 -> 20');

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
