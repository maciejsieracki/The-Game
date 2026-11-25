'use strict';
/**
 * diplo-peace-price-table-a.cjs -- R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1, kryterium (c) / tabela (a).
 * Tabela z URUCHOMIENIA kodu gry (bundle esbuild z gra/src/game/war-weariness.ts):
 *   poziom zmeczenia L 0 / 0,25 / 0,5 / 0,75 / 1,0 x liczba miast przegrywajacego 1 / 2 / 3 / 5 / 8
 *   (miasta po 12 obywateli = 1840 PN, stolica zakazana, cityCap = liczba miast, bez progu min. 3 miast):
 *   cena PN (wearinessPeaceCashPn), liczba oddanych miast, nadplata PN, pokrycie.
 * Uzycie (z gra/):  node tools/diplo-peace-price-table-a.cjs
 */
const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src', 'game');
const TMP = process.env.PRICE_TABLE_TMP || `${require('os').tmpdir()}/peace-price-table-a-${TMPDIR_RUN_ID}`;
fs.mkdirSync(TMP, { recursive: true });
const ENTRY = path.join(TMP, `table-a-entry-${process.pid}.ts`);
const BUNDLE = path.join(TMP, `table-a-bundle-${process.pid}.cjs`);
fs.writeFileSync(ENTRY, `export * from ${JSON.stringify(path.join(SRC, 'war-weariness.ts'))};\n`);
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE, logLevel: 'error', loader: { '.json': 'json' } });
const M = require(BUNDLE);

const CITY_PN = 1840; // wycena miasta 12 obywateli (raport R-WEB-DIPLO-FORCED-PEACE-CITY-BALANCE-Q1)
const cityAssets = (n) => Array.from({ length: n }, (_, i) => ({ kind: 'miasto', id: `m${i}`, amount: 1, pn: CITY_PN, forbidden: i === 0 }));

console.log(`cenaStartPn=${M.WAR_WEARINESS_PARAMS.cenaPokoju.cenaStartPn} miasto=${CITY_PN} PN (12 obywateli)`);
console.log('L    | miasta | cena PN | oddane | nadplata PN | pokryte PN');
for (const L of [0, 0.25, 0.5, 0.75, 1.0]) {
  const cena = M.wearinessPeaceCashPn(L);
  for (const N of [1, 2, 3, 5, 8]) {
    // Cap wymuszenia = ownCities (bez progu min. 3); stolica zakazana przez forbidden.
    const plan = M.planEscalatedPeacePayment(cena, cityAssets(N), N);
    const oddane = plan.histogram.miasto ?? 0;
    const pokryte = plan.items.reduce((a, i) => a + (i.pn ?? CITY_PN) * (i.amount ?? 1), 0);
    const nadplata = Math.max(0, pokryte - cena);
    console.log(`${String(L).padEnd(4)} | ${String(N).padEnd(6)} | ${String(cena).padEnd(7)} | ${String(oddane).padEnd(6)} | ${String(nadplata).padEnd(11)} | ${pokryte}`);
  }
}
