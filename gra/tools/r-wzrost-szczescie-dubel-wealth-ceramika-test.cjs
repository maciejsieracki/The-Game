'use strict';
/**
 * R-WZROST-SZCZESCIE-DUBEL-WEALTH-I-CERAMIKA-Q1
 * Niezależny test przekrojowy: kanały Happiness/Wealth/Ceramika nie dublują się.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const entry = path.resolve(__dirname, '.r-wzrost-szczescie-dubel-entry.ts');
const bundle = path.resolve(__dirname, '.r-wzrost-szczescie-dubel-bundle.cjs');
fs.writeFileSync(entry, `
export { computeGrowthPercentV85 } from '../src/game/population-growth-v85';
export { computeHappinessBreakdown } from '../src/game/society-breakdown';
export { ceramikaHappinessBonus } from '../src/game/converters';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: bundle,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[r-wzrost-szczescie-dubel] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(bundle);
let passed = 0;
let failed = 0;
function eq(actual, expected, message) {
  if (actual === expected) {
    passed += 1;
    console.log('  [OK] ' + message);
  } else {
    failed += 1;
    console.error(`  [FAIL] ${message} got=${actual} want=${expected}`);
  }
}

console.log('\n[r-wzrost-szczescie-dubel]\n');

const happiness = M.computeHappinessBreakdown({
  population: 4,
  era: 2,
  buildingZadowolenie: 0,
  ceramikaZadowolenie: 1,
  spichlerzZadowolenie: 1,
  haWealth: 10,
}, null);
eq(happiness.lines.find(line => line.id === 'wealth')?.value, 10,
  'Wealth jest jedną, jawną linią +10');
eq(happiness.lines.find(line => line.id === 'ceramika')?.value, 1,
  'Ceramika jest osobną linią +1 na miasto');
eq(happiness.lines.find(line => line.id === 'spichlerz')?.value, 1,
  'Spichlerz jest osobną linią +1 na miasto');
eq(
  happiness.lines
    .filter(line => ['wealth', 'ceramika', 'spichlerz'].includes(line.id))
    .reduce((sum, line) => sum + line.value, 0),
  12,
  'kontrolowane kanały = Wealth 10 + Ceramika 1 + Spichlerz 1',
);

const shared = {
  population: 4,
  poziomRacji: 4,
  zdrowie: 0,
  szczescieNetto: 12,
  wealthPoziom: 0,
  spichlerzState: {},
  civKey: null,
  rationParams: { wzrostProc: { 4: 4 }, foodCost: { 4: 1 } },
};
const lowWealth = M.computeGrowthPercentV85({ ...shared, wealthPoziom: 0 });
const highWealth = M.computeGrowthPercentV85({ ...shared, wealthPoziom: 100 });
eq(lowWealth.szczescie, 1, 'Szczęście netto 12 daje +1% wzrostu');
eq(highWealth.szczescie, 1, 'Wealth 100 nie podbija drugi raz wzrostu');
eq(highWealth.total, lowWealth.total, 'zmiana wealthPoziom nie zmienia total przy stałym netto');
eq(M.ceramikaHappinessBonus(1, true), 1, 'Ceramika +1 po uzyskaniu dostępu');
eq(M.ceramikaHappinessBonus(1000, true), 1, 'Ceramika pozostaje binarna, bez skalowania zapasem');

console.log(`\n[r-wzrost-szczescie-dubel] ${passed} pass, ${failed} fail\n`);
process.exit(failed > 0 ? 1 : 0);
