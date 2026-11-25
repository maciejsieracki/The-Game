'use strict';
/**
 * diplo-weariness-city-table-measure.cjs -- R-WEB-DIPLO-FORCED-PEACE-CITY-BALANCE-Q1, FAZA 1 (POMIAR, bez zmiany gry).
 * Liczy na PRAWDZIWYCH funkcjach gry (bundle esbuild z gra/src):
 *   - cene pokoju C = price.requiredPn (aiAiPeaceRequiredPn + peaceOfferAiOwnBilans + treatyBasePnFromConfig('pokoj')),
 *     dla sweepu relacji i trudnosci;
 *   - wartosc PW miasta referencyjnego (12 obywateli, bez budynkow/zlozy) wg diplomacyPnMiasto;
 *   - plan planEscalatedPeacePayment (ten sam kod co w war-weariness.ts) dla 1,2,3,5,8 miast przegrywajacego
 *     (stolica zakazana), z limitem cityCap = miasta - minMiastPoOddaniu (wartosc z JSON);
 *   - sprawdzenie minimalnosci liczby miast planu (brute force na losowych pulach).
 * Uzycie (z gra/):  node tools/diplo-weariness-city-table-measure.cjs
 */
const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(process.env.WEAR_ESBUILD_PATH || path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src', 'game');
const TMP = process.env.WEAR_MEASURE_TMP || `${require('os').tmpdir()}/wear-q1-${TMPDIR_RUN_ID}`;
fs.mkdirSync(TMP, { recursive: true });
const ENTRY = path.join(TMP, `measure-entry-${process.pid}.ts`);
const BUNDLE = path.join(TMP, `measure-bundle-${process.pid}.cjs`);

fs.writeFileSync(ENTRY, [
  `export * from ${JSON.stringify(path.join(SRC, 'diplomacy-value-catalog.ts'))};`,
  `export * from ${JSON.stringify(path.join(SRC, 'diplomacy-ai-offer-balance.ts'))};`,
  `export * from ${JSON.stringify(path.join(SRC, 'diplomacy-ai-forced-peace.ts'))};`,
  `export * from ${JSON.stringify(path.join(SRC, 'diplomacy-proposals.ts'))};`,
  `export * from ${JSON.stringify(path.join(SRC, 'war-weariness.ts'))};`,
  '',
].join('\n'));
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE,
  logLevel: 'error', loader: { '.json': 'json' },
});
const M = require(BUNDLE);

const BASE_POKOJ = M.treatyBasePnFromConfig('pokoj');
const PARAMS = M.WAR_WEARINESS_PARAMS;
const CAP_MIN = PARAMS.przegrywajacy.minMiastPoOddaniu;
const CITY12 = M.diplomacyPnMiasto({ populacja: 12, budynki: [], cudy: 0, zlozaPn: 0 });

console.log(`BAZA_POKOJ=${BASE_POKOJ} MIASTO_BAZA=${M.MIASTO_PN_BAZA} NA_OBYWATELA=${M.MIASTO_PN_NA_OBYWATELA}`);
console.log(`WARTOSC_MIASTA_12_OBYWATELI=${CITY12} PN (bez budynkow i zlozy)`);
console.log(`minMiastPoOddaniu(JSON)=${CAP_MIN} progWymuszonyPokoj=${PARAMS.zmeczenie.progWymuszonyPokoj}`);

// 1) Cena pokoju C wg relacji i trudnosci (ta sama formula co main.ts price()).
const priceOf = (rel, diff) => M.aiAiPeaceRequiredPn(
  M.peaceOfferAiRequestPn(0, 0, rel, BASE_POKOJ, diff),
  M.peaceOfferAiOwnBilans(0, 0, rel, BASE_POKOJ),
);
console.log('\n[1] CENA POKOJU C (requiredPn) wg relacji (relTotal) i trudnosci:');
console.log('relTotal | easy | normal | hard');
const prices = new Set();
for (const rel of [-100, -50, 0, 25, 50, 90, 130, 200, 300]) {
  const row = ['easy', 'normal', 'hard'].map(d => priceOf(rel, d));
  row.forEach(v => prices.add(v));
  console.log(`${rel} | ${row.join(' | ')}`);
}
const priceSet = [...prices].sort((a, b) => a - b);
console.log(`ROZNE_CENY=${priceSet.join(',')}`);

// 2) Plan miast: N miast po 12 obywateli (stolica = pierwsza, zakazana), cap = N - minMiastPoOddaniu.
const cityAssets = (n) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ kind: 'miasto', id: `m${i}`, amount: 1, pn: CITY12, forbidden: i === 0 });
  }
  return out;
};
console.log('\n[2] PLAN WYMUSZONEGO POKOJU (planEscalatedPeacePayment, miasta N, stolica zakazana):');
console.log('  cap_obecny = N - minMiastPoOddaniu(JSON); cap_proponowany = N - 1 (wszystkie poza stolica)');
console.log('C(PN) | N miast | cap_obecny | oddane (obecny) | cap_prop | oddane (prop) | pokryte PW (prop) | niedobor (prop) | nadplata (prop) | wynik (prop)');
const table2 = [];
for (const C of [615, ...priceSet.filter(c => c !== 615)]) {
  for (const N of [1, 2, 3, 5, 8]) {
    const capCur = Math.max(0, N - CAP_MIN);
    const capProp = Math.max(0, N - 1);
    const planCur = M.planEscalatedPeacePayment(C, cityAssets(N), capCur);
    const plan = M.planEscalatedPeacePayment(C, cityAssets(N), capProp);
    const wynik = capProp === 0 ? (C > 0 ? 'WOJNA TRWA (tylko stolica)' : 'pokoj bez miast (cena 0)')
      : (plan.full ? 'pokoj' : 'pokoj z niedoborem (oddane wszystkie oddawalne)');
    const row = { C, N, capCur, oddaneCur: planCur.histogram.miasto, capProp, oddane: plan.histogram.miasto,
      pokryte: plan.coveredPn, niedobor: plan.shortfallPn, nadplata: plan.coveredPn - C, wynik };
    table2.push(row);
    console.log(`${C} | ${N} | ${capCur} | ${row.oddaneCur} | ${capProp} | ${row.oddane} | ${row.pokryte} | ${row.niedobor} | ${row.nadplata} | ${wynik}`);
  }
}

// 3) Etapy zmeczenia: PW zmeczenia (wearinessPeaceItemPw) i reszta R = C - Z do pokrycia miastami w ofercie.
console.log('\n[3] ETAPY ZMECZENIA (C=615): Z=round(C*x^2), R=C-Z; x=wearinessPeaceX(L):');
console.log('L | x | C | Z (PW zmeczenia) | R (do miast) | miasta referencyjne potrzebne (ceil(R/V))');
for (const L of [0.5, 0.65, 0.8, 0.9, 1.0]) {
  const C = 615;
  const x = M.wearinessPeaceX(L);
  const Z = M.wearinessPeaceItemPw(C, L);
  const R = C - Z;
  console.log(`${L} | ${x.toFixed(3)} | ${C} | ${Z} | ${R} | ${R > 0 ? Math.ceil(R / CITY12) : 0}`);
}

// 4) Minimalnosc planu (brute force na losowych pulach miast; cel: liczba miast = minimum pokrywajace C).
let rnd = 12345;
const rand = () => { rnd = (rnd * 1103515245 + 12345) & 0x7fffffff; return rnd / 0x7fffffff; };
let checked = 0; let bad = 0; let worst = null;
for (let t = 0; t < 4000; t++) {
  const n = 1 + Math.floor(rand() * 7);
  const pool = [];
  for (let i = 0; i < n; i++) pool.push({ kind: 'miasto', id: `p${i}`, amount: 1, pn: 1 + Math.floor(rand() * 2000), forbidden: false });
  const C = 1 + Math.floor(rand() * 4000);
  const cap = 1 + Math.floor(rand() * n);
  const plan = M.planEscalatedPeacePayment(C, pool, cap);
  let best = null;
  for (let mask = 1; mask < (1 << n); mask++) {
    let cnt = 0; let s = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) { cnt++; s += pool[i].pn; }
    if (cnt <= cap && s >= C && (best === null || cnt < best)) best = cnt;
  }
  if (best === null) continue;
  checked++;
  if (plan.histogram.miasto !== best) {
    bad++;
    if (!worst) worst = { C, cap, pool: pool.map(p => p.pn), plan: plan.histogram.miasto, minimum: best };
  }
}
console.log(`\n[4] MINIMALNOSC PLANU: sprawdzone=${checked} niezgodne_z_minimum=${bad}${worst ? ' PRZYKLAD=' + JSON.stringify(worst) : ''}`);

// 5) Absurdy: proponowany cap, N=2 (1 oddawalne miasto), pokryte > C (brak wydania reszty), C > 0.
const absurd = table2.filter(r => r.N === 2 && r.C > 0 && r.oddane === 1 && r.nadplata > 0);
console.log(`[5] proponowany cap, N=2, C>0: wiersze z jednym miastem i nadplata>0: ${absurd.length} z ${table2.filter(r => r.N === 2 && r.C > 0).length}`);
console.log(`[5b] obecny cap (N-3), N=2: oddane miasta = ${table2.filter(r => r.N === 2).map(r => r.oddaneCur).join(',')} (0 = pokoj bez miast)`);

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* tmp */ }
