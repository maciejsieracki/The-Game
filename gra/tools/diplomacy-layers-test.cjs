'use strict';
/**
 * diplomacy-layers-test.cjs — kontakt dyplomatyczny vs widoczność / formalny kontakt.
 * Run from gra/: node tools/diplomacy-layers-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.DIP_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.dip-layers-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-layers-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  computeDiplomaticContacts,
  filterDiplomacyCommandsForEstablishedContact,
  diplomacyLayerForOwner,
} from ${JSON.stringify(SRC + '/game/diplomacy-layers')};
export type { AIDiplomacyCommand } from ${JSON.stringify(SRC + '/game/ai')};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const {
  computeDiplomaticContacts,
  filterDiplomacyCommandsForEstablishedContact,
  diplomacyLayerForOwner,
} = require(BUNDLE);

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; return; }
  failed++;
  console.error('  FAIL:', msg);
}

const cities = [
  { ownerId: 1, q: 5, r: 5 },
  { ownerId: 2, q: 20, r: 20 },
];
const units = [
  { ownerId: 3, q: 8, r: 8 },
];

const visibleNear = new Set(['5,5', '8,8']);
const exploredFar = new Set(['5,5', '8,8', '20,20']);

const visContacts = computeDiplomaticContacts(visibleNear, cities, units);
ok(visContacts.has(1), 'widoczne miasto → kontakt');
ok(visContacts.has(3), 'widoczna jednostka → kontakt');
ok(!visContacts.has(2), 'niewidoczne miasto → brak kontaktu');

const exploredContacts = computeDiplomaticContacts(exploredFar, cities, units);
ok(exploredContacts.has(2), 'explored hex dalekiego miasta → kontakt (API)');

const simplified = new Set([1]);
const foreign = new Set([2]);
const contacted = new Set([1]);
ok(
  diplomacyLayerForOwner(2, simplified, foreign, contacted) === 'pre_contact',
  'obcy typ bez odkrycia → pre_contact',
);
ok(
  diplomacyLayerForOwner(1, simplified, foreign, contacted) === 'simplified',
  'odkryte miasto-panstwo → simplified',
);

const cmds = [
  { type: 'zaproponuj_handel', targetId: 0, powod: 'test' },
  { type: 'wypowiedz_wojne', targetId: 0, powod: 'test' },
];
const filtered = filterDiplomacyCommandsForEstablishedContact(cmds, false);
ok(filtered.length === 1 && filtered[0].type === 'wypowiedz_wojne', 'brak daru bez formalnego kontaktu');
ok(
  filterDiplomacyCommandsForEstablishedContact(cmds, true).length === 2,
  'po formalnym kontakcie — pełna lista',
);

console.log(`\ndiplomacy-layers-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
