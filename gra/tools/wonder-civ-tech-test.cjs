'use strict';
/** node tools/wonder-civ-tech-test.cjs — techUnlock cudów E >= epokaWejscia państwa */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.wonder-civ-tech-entry.ts');
const bundle = path.join(__dirname, '.wonder-civ-tech-bundle.cjs');

fs.writeFileSync(entry, `
export {
  buildTechEpochMap,
  findExclusiveWonderTechViolations,
  wonderTechValidForCivEntry,
} from '../src/game/wonder-civ-tech';
export { getCivEpokaWejscia } from '../src/game/civ-entry-epoch';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
const tech = require('../data/tech.json');
const civs = require('../data/civs.json');
const wonders = require('../data/wonders.json');

const techMap = M.buildTechEpochMap(tech.technologie ?? []);
const violations = M.findExclusiveWonderTechViolations(
  wonders.cuda ?? [],
  civs.cywilizacje,
  techMap,
);

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('wonder-civ-tech-test (E: tech >= epokaWejscia)\n');

assert(violations.length === 0, 'brak naruszeń reguły tech cudów E');
if (violations.length > 0) {
  for (const v of violations) {
    console.error('  VIOLATION:', v.wonderId, v.civId, v.invalidTech, '<', v.civEntryEpoch);
  }
}

const ink = civs.cywilizacje.find(c => c.ikonaId === 'inkowie');
assert(
  M.wonderTechValidForCivEntry(ink, ['Matematyka', 'Murarstwo'], techMap),
  'Inkowie (kamien): Matematyka+Murarstwo OK',
);
assert(
  !M.wonderTechValidForCivEntry(
    civs.cywilizacje.find(c => c.ikonaId === 'fenicjanie'),
    ['Murarstwo'],
    techMap,
  ),
  'Fenicjanie (braz): Murarstwo (kamien) NIE',
);
assert(
  M.wonderTechValidForCivEntry(
    civs.cywilizacje.find(c => c.ikonaId === 'fenicjanie'),
    ['Inżynieria'],
    techMap,
  ),
  'Fenicjanie: Inżynieria OK',
);
assert(
  M.wonderTechValidForCivEntry(
    civs.cywilizacje.find(c => c.ikonaId === 'grecy'),
    ['Inżynieria'],
    techMap,
  ),
  'Grecy (kamien): tech żelaza OK (późniejsza epoka)',
);

console.log('\nwonder-civ-tech-test:', passed, 'passed,', failed, 'failed');
if (failed) process.exit(1);
