'use strict';
/**
 * building-happiness-test.cjs — +1 szczęścia per budynek (decyzja Macieja 2026-07-22)
 * Run: cd gra && node tools/building-happiness-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.building-happiness-entry.ts');
const BUNDLE = path.resolve(__dirname, '.building-happiness-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  buildingHappinessAtLevel,
  sumBuildingHappinessFromBuiltIds,
  BUILDING_HAPPINESS_BASE_PER_BUILDING,
} from '../src/game/economy';
export { computeHappinessBreakdown } from '../src/game/society-breakdown';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[building-happiness-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);
const buildings = require('../data/buildings.json');

let passed = 0;
let failed = 0;

function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b)); }
}
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg); }
}

console.log('\n[building-happiness-test]\n');

eq(M.BUILDING_HAPPINESS_BASE_PER_BUILDING, 1, 'base per building = 1');

const mury = buildings.find(b => b.id === 'mury');
const swiatynia = buildings.find(b => b.id === 'swiatynia');
const studnia = buildings.find(b => b.id === 'studnia');

eq(M.buildingHappinessAtLevel(mury, 1), 1, 'Mury (zadowolenie 0) -> +1');
// GRUPY-BUDYNKOW (Maciej 2026-07-25): Świątynia.baza.zadowolenie rozdzielone z 3 do 2
// (Kamienne kręgi 1 + Świątynia 2 = 3 łącznie, bo oba budynki stoją teraz obok siebie
// zamiast Świątyni zastępującej Kamienne kręgi) -- patrz buildings.json + handoff §7.
eq(M.buildingHappinessAtLevel(swiatynia, 1), 3, 'Świątynia (zadowolenie 2 po rozdzieleniu) -> 2+1=3');

// Hipotetyczny budynek z zadowolenie 2 w JSON -> efekt 3
const hypo = { ...swiatynia, baza: { ...swiatynia.baza, zadowolenie: 2 } };
eq(M.buildingHappinessAtLevel(hypo, 1), 3, 'Budynek z zadowolenie 2 -> 2+1=3');

const threeIds = ['mury', 'swiatynia', 'studnia'];
const sum = M.sumBuildingHappinessFromBuiltIds(threeIds, buildings, () => 1);
// mury:1 + swiatynia:3 + studnia:1+1=2 => 6 (3 base + bonusy z JSON)
const studniaExpected = M.buildingHappinessAtLevel(studnia, 1);
const expected = 1 + 3 + studniaExpected;
eq(sum, expected, '3 budynki: suma base (+1 each) + ich zadowolenie');
eq(sum, 6, '3 budynki (mury+swiatynia+studnia lvl1) -> 6');

const breakdown = M.computeHappinessBreakdown({
  population: 5,
  buildingZadowolenie: sum,
}, null);
const budLine = breakdown.lines.find(l => l.id === 'budynki');
eq(budLine?.value, 6, 'breakdown budynki line = 6');
ok(budLine?.label.includes('+1'), 'breakdown label mentions +1 per building');

console.log('\n' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed > 0 ? 1 : 0);
