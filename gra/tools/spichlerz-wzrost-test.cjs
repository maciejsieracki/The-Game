'use strict';
/**
 * spichlerz-wzrost-test.cjs — B5-SPICH: bufor wzrostu + zapasy państwa.
 * Run: node tools/spichlerz-wzrost-test.cjs  (from gra/)
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); } catch (e) { console.error('esbuild not found'); process.exit(1); }
})();

const GRA_ROOT    = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.spichlerz-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.spichlerz-bundle.cjs');

const ENTRY_TS = `
export { populationGrowth } from '../src/game/economy';
export { advanceEmpireFood, freshEmpireFoodState, buildEmpireFoodParams } from '../src/game/empire-food';
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
  console.error('[spichlerz-wzrost-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);

let passed = 0; let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  [OK] ' + label); passed++; }
  else { console.error('  [FAIL] ' + label); failed++; }
}
function eq(a, b, label) {
  ok(a === b, label + ' (got ' + a + ', want ' + b + ')');
}

const params = {
  progWzrostuWspolczynnik: 8,
  spichlerzZachowaniePoPrzroscie: 0.5,
  akweduktProgLudnosci: 6,
  spichlerzProgLudnosci: 8,
  zdrowieModyfikatorWspolczynnik: 0.05,
};

function baseCity(overrides = {}) {
  return {
    id: 'c1', ludnosc: 1, zdrowie: 0,
    czyStolica: true, maSpichlerz: false, maAkwedukt: false,
    magazynZywnosci: 0, specjalisci: [], kolejkaProdukcji: [],
    podzialHandlu: { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 },
    podzialPracy: { procentBudynki: 70 },
    ...overrides,
  };
}

console.log('\n--- populationGrowth B5-SPICH ---');

// Bez Spichlerza: bufor kumuluje, wzrost 1→2, potem bufor=0
const rNoSp1 = M.populationGrowth(baseCity(), 18, params);
ok(rNoSp1.wzrost, 'bez Spichlerza: 18 food przy pop=1 → wzrost');
eq(rNoSp1.nowaLudnosc, 2, 'bez Spichlerza: pop 2');
eq(rNoSp1.nowyMagazynZywnosci, 0, 'bez Spichlerza: bufor zerowany po wzroście');

// Ze Spichlerzem: 18 → wzrost, bufor 50%
const rSp1 = M.populationGrowth(baseCity({ maSpichlerz: true }), 18, params);
ok(rSp1.wzrost, 'ze Spichlerzem: wzrost przy progu 18');
eq(rSp1.nowyMagazynZywnosci, 9, 'ze Spichlerzem: 50% bufora po wzroście (18→9)');

// Kumulacja bez wzrostu (pop=2, próg 26)
const rAcc = M.populationGrowth(baseCity({ ludnosc: 2, magazynZywnosci: 10 }), 5, params);
eq(rAcc.nowyMagazynZywnosci, 15, 'bez Spichlerza: bufor kumuluje między turami (10+5)');

console.log('\n--- advanceEmpireFood zapasy państwa ---');

const upkeep = { jednostkaUtrzymanieStd: 1, zywnoscJednostkaRuch: 1, zywnoscJednostkaOboz: 0.5 };
const efParams = M.buildEmpireFoodParams({
  suwak_zywnosc_rozwoj_domyslnie: { normal: 70 },
  glod_wojska_hp_frac: { normal: 0.08 },
});
const states = new Map([[0, M.freshEmpireFoodState(70)]]);

const econNoSpich = {
  perCity: [{
    ownerId: 0, oblegany: false, zywnoscNetto: 100, maSpichlerz: false,
  }],
};
const resNoSpich = M.advanceEmpireFood(econNoSpich, [{ ownerId: 0 }], states, upkeep, efParams);
const tickNo = resNoSpich.byOwner.get(0);
eq(tickNo.zapasyPo, 15, 'bez Spichlerza: 50% netto round((30−1)×50%)=15');
ok(!tickNo.glodWojska, 'bez Spichlerza: wystarczy na armie 1 jednostkę');

states.set(0, M.freshEmpireFoodState(70));
const econSpich = {
  perCity: [{
    ownerId: 0, oblegany: false, zywnoscNetto: 100, maSpichlerz: true,
  }],
};
const resSp = M.advanceEmpireFood(econSpich, [{ ownerId: 0 }], states, upkeep, efParams);
const tickSp = resSp.byOwner.get(0);
eq(tickSp.zapasyPo, 29, 'ze Spichlerzem: zapasy kumulują (30-1)');

console.log('\nspichlerz-wzrost-test: ' + passed + ' passed, ' + failed + ' failed');
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
