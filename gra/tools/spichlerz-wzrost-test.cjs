'use strict';
/**
 * spichlerz-wzrost-test.cjs — B5-SPICH: bufor wzrostu + zapasy państwa.
 *
 * AKTUALIZACJA (R-TEST-DEBT-MISC-Q5, 2026-11-05): asercje były przestarzałe względem
 * obowiązującego kodu:
 *  - próg wzrostu = 20 + ludnosc × progWzrostuWspolczynnik (economy.ts, baza 20 — wartość
 *    finalna), a nie 10 + ludnosc × wsp.; dla pop=1 i wsp=8 próg = 28 (nie 18);
 *  - zapasy państwa = poprzednie + netto − wojsko (empire-food.ts), ograniczone capem;
 *    NIE ma reguły „50% netto”. Spichlerz podwaja cap centralny (+SPICHLERZ_EMPIRE_CAP_I
 *    × mnożnik epoki), nie zmienia przyrostu.
 * Zachowana intencja: bufor po wzroście (50% ze Spichlerzem, 0 bez), brak wzrostu poniżej
 * progu, kumulacja zapasów między turami, cap ze Spichlerzem.
 *
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

// Próg wzrostu z economy.ts: baza 20 + ludnosc × wspolczynnik (pop=1 → 28).
const PROG_POP1 = 20 + 1 * params.progWzrostuWspolczynnik;

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

// Poniżej progu: brak wzrostu, bufor rośnie.
const rBelow = M.populationGrowth(baseCity(), PROG_POP1 - 10, params);
ok(!rBelow.wzrost, `bez Spichlerza: ${PROG_POP1 - 10} food przy pop=1 (< próg ${PROG_POP1}) → brak wzrostu`);
eq(rBelow.nowyMagazynZywnosci, PROG_POP1 - 10, 'bez Spichlerza: bufor kumuluje poniżej progu');

// Bez Spichlerza: próg osiągnięty → wzrost 1→2, bufor zerowany.
const rNoSp1 = M.populationGrowth(baseCity(), PROG_POP1, params);
ok(rNoSp1.wzrost, `bez Spichlerza: ${PROG_POP1} food przy pop=1 → wzrost`);
eq(rNoSp1.nowaLudnosc, 2, 'bez Spichlerza: pop 2');
eq(rNoSp1.nowyMagazynZywnosci, 0, 'bez Spichlerza: bufor zerowany po wzroście');

// Ze Spichlerzem: wzrost, bufor 50%.
const rSp1 = M.populationGrowth(baseCity({ maSpichlerz: true }), PROG_POP1, params);
ok(rSp1.wzrost, `ze Spichlerzem: wzrost przy progu ${PROG_POP1}`);
eq(rSp1.nowyMagazynZywnosci, Math.floor(PROG_POP1 * 0.5), `ze Spichlerzem: 50% bufora po wzroście (${PROG_POP1}→${Math.floor(PROG_POP1 * 0.5)})`);

// Kumulacja bez wzrostu (pop=2).
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
ok(tickNo.kosztArmii > 0, `bez Spichlerza: wojsko zjada żywność (koszt ${tickNo.kosztArmii} > 0)`);
eq(tickNo.zapasyPo, 100 - tickNo.kosztArmii, 'bez Spichlerza: zapasy = netto 100 − wojsko (cap nie wiąże)');
ok(!tickNo.glodWojska, 'bez Spichlerza: wystarczy na armie 1 jednostkę');
const capNo = tickNo.maxCap;

states.set(0, M.freshEmpireFoodState(70));
const econSpich = {
  perCity: [{
    ownerId: 0, oblegany: false, zywnoscNetto: 100, maSpichlerz: true,
  }],
};
const resSp = M.advanceEmpireFood(econSpich, [{ ownerId: 0 }], states, upkeep, efParams);
const tickSp = resSp.byOwner.get(0);
eq(tickSp.zapasyPo, 100 - tickSp.kosztArmii, 'ze Spichlerzem: zapasy = netto 100 − wojsko (ta sama reguła)');
eq(tickSp.maxCap - capNo, 1000, 'ze Spichlerzem: cap centralny rośnie o SPICHLERZ_EMPIRE_CAP_I (1000 × mnożnik epoki 1)');

// Kumulacja między turami ze Spichlerzem: druga tura dokłada kolejny przyrost.
const resSp2 = M.advanceEmpireFood(econSpich, [{ ownerId: 0 }], states, upkeep, efParams);
const tickSp2 = resSp2.byOwner.get(0);
eq(tickSp2.zapasyPo, tickSp.zapasyPo + (100 - tickSp2.kosztArmii), 'ze Spichlerzem: zapasy kumulują się między turami');

console.log('\nspichlerz-wzrost-test: ' + passed + ' passed, ' + failed + ' failed');
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
