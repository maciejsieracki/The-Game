'use strict';
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.athens-sparta-entry.ts');
const bundle = path.join(__dirname, '.athens-sparta-bundle.cjs');
fs.writeFileSync(entry, `export { evaluateOrderFromBreakdown } from '../src/game/society-breakdown';`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(bundle);
const society = require('../data/society-params.json');
const podzial = { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 };
const base = { era: 1, buildingZadowolenie: 0, podzialHandlu: podzial, difficulty: 'normal' };
const cases = [
  ['Sparta nowa pop1 (0 kult, 0 rel)', 1, 0, 0, 0, false, podzial],
  ['Ateny start pop1 (+2 kult, +2 rel)', 1, 2, 2, 0, false, podzial],
  ['Ateny po czasie pop5 (+budynki, kult, rel)', 5, 2, 2, 4, false, podzial],
  ['Sparta pop1 + wojna', 1, 0, 0, 0, true, podzial],
  ['Sparta pop1 luksus 0%', 1, 0, 0, 0, false, { procentNauka: 30, procentPieniadz: 70, procentLuksus: 0 }],
];
console.log('\nPorPct — Ateny vs Sparta (normal, bez garnizonu)\n');
for (const [label, pop, haKult, haRel, bld, war, ph] of cases) {
  const ord = M.evaluateOrderFromBreakdown(
    { ...base, population: pop, haKult, haRel, buildingZadowolenie: bld, atWar: war, podzialHandlu: ph },
    { garnizonCount: 0, population: pop, era: 1 },
    society,
    'normal',
  );
  console.log(
    `${label.padEnd(42)} PorPct=${ord.porPct.toFixed(1).padStart(5)}%  ${ord.bandLabel.padEnd(12)} migracja=${ord.effects.revoltRisk > 0 ? 'TAK' : 'nie'}`,
  );
}
