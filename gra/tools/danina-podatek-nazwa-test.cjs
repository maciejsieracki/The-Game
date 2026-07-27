'use strict';
/**
 * danina-podatek-nazwa-test.cjs — regresja nazwy strumienia podatkowego (decyzja
 * Macieja 2026-07-27: zawsze "Podatek", bez bramki Danina/Mennica/Waluta).
 * node tools/danina-podatek-nazwa-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.danina-podatek-nazwa-entry.ts');
const BUNDLE = path.resolve(__dirname, '.danina-podatek-nazwa-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  isPodatekActive, daninaLabel, mennicaWStolicy, daninaLabelForOwnerByCityList,
  daninaLabelGenitive, daninaLabelAccusative,
} from '../src/game/danina-nazwa';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(BUNDLE);

let pass = 0, fail = 0;
function ok(c, m) {
  if (c) { pass++; console.log('  PASS:', m); }
  else { fail++; console.error('  FAIL:', m); }
}

function makeCities(ownerId) {
  return [
    { id: `${ownerId}-stolica`, ownerId },
    { id: `${ownerId}-region`, ownerId },
    { id: `${ownerId}-oddalone`, ownerId },
  ];
}

// 1) Bez Waluty / bez Mennicy — nadal "Podatek".
{
  const capitalId = '0-stolica';
  const built = new Map([[capitalId, []]]);
  const label = M.daninaLabelForOwnerByCityList(0, false, makeCities(0), built, capitalId);
  ok(label === 'Podatek', '1) brak Waluty -> Podatek');
  ok(M.isPodatekActive(false, false) === true, '1b) isPodatekActive zawsze true');
  ok(M.daninaLabel(false, false, false) === 'Podatek', '1c) daninaLabel zawsze Podatek');
}

// 2) Waluta bez Mennicy — "Podatek".
{
  const capitalId = '1-stolica';
  const built = new Map([[capitalId, []]]);
  const label = M.daninaLabelForOwnerByCityList(1, true, makeCities(1), built, capitalId);
  ok(label === 'Podatek', '2) Waluta bez Mennicy w stolicy -> Podatek');
  ok(M.mennicaWStolicy(capitalId, []) === false, '2b) mennicaWStolicy nadal dziala');
}

// 3) Mennica w miescie regionalnym — "Podatek".
{
  const capitalId = '2-stolica';
  const regionId = '2-region';
  const built = new Map([
    [capitalId, []],
    [regionId, ['mennica']],
  ]);
  const label = M.daninaLabelForOwnerByCityList(2, true, makeCities(2), built, capitalId);
  ok(label === 'Podatek', '3) Mennica regionalna -> nadal Podatek (nazwa bez bramki)');
}

// 4) Waluta + Mennica w stolicy — "Podatek" wszedzie.
{
  const ownerId = 3;
  const capitalId = `${ownerId}-stolica`;
  const built = new Map([[capitalId, ['mennica']]]);
  const cities = makeCities(ownerId);
  ok(M.mennicaWStolicy(capitalId, built.get(capitalId)) === true, '4a) Mennica w stolicy wykryta');
  const labelStolica = M.daninaLabelForOwnerByCityList(ownerId, true, cities, built, capitalId);
  ok(labelStolica === 'Podatek', '4b) stolica -> Podatek');
  const labelOddalone = M.daninaLabelForOwnerByCityList(ownerId, true, cities, built, capitalId);
  ok(labelOddalone === 'Podatek', '4d) miasto oddalone -> Podatek');
}

// 5) PARYTET AI — gracz i AI identycznie "Podatek".
{
  const aiOwnerId = 7;
  const capitalId = `${aiOwnerId}-stolica`;
  const built = new Map([[capitalId, ['mennica']]]);
  const label = M.daninaLabelForOwnerByCityList(aiOwnerId, true, makeCities(aiOwnerId), built, capitalId);
  ok(label === 'Podatek', '5) AI -> Podatek');
  const playerLabel = M.daninaLabelForOwnerByCityList(0, true, makeCities(0), new Map([['0-stolica', ['mennica']]]), '0-stolica');
  ok(playerLabel === label, '5b) gracz i AI identyczna etykieta Podatek');
}

// 6) Strumien z tras handlowych = "Handel" (osobny mechanizm).
{
  const TRADE_ROUTE_LABEL = 'Handel';
  const label = M.daninaLabelForOwnerByCityList(9, true, makeCities(9), new Map([['9-stolica', ['mennica']]]), '9-stolica');
  ok(label !== TRADE_ROUTE_LABEL, '6a) etykieta strumienia miasta nigdy nie jest "Handel"');
  ok(label === 'Podatek', '6b) strumien podatkowy = Podatek');
  ok(M.daninaLabelGenitive('Podatek') === 'podatku', '6c) odmiana dopelniacza: podatku');
  ok(M.daninaLabelAccusative('Podatek') === 'podatek', '6d) odmiana biernika: podatek');
}

console.log(`\ndanina-podatek-nazwa-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
