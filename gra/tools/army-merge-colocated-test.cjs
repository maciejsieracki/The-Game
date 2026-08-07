/** node gra/tools/army-merge-colocated-test.cjs — coLocatedForMergePrompt (garnizon + widoczne) */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(__dirname, '.army-merge-colocated-entry.ts');
const BUNDLE = path.join(__dirname, '.army-merge-colocated-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  coLocatedForMergePrompt,
  visibleStackOnHex,
  stackHudMergeSplitActions,
} from '../src/game/armyMerge';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: ROOT,
  logLevel: 'silent',
});

const { coLocatedForMergePrompt, visibleStackOnHex, stackHudMergeSplitActions } = require(BUNDLE);

let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

const units = [
  { id: 'a', ownerId: 0, q: 3, r: 4, inGarnizon: true },
  { id: 'b', ownerId: 0, q: 3, r: 4, inGarnizon: false },
  { id: 'c', ownerId: 0, q: 3, r: 4, inGarnizon: false, oblegaCityId: 'x' },
];

const vis = visibleStackOnHex(units, 3, 4, 0);
ok(vis.length === 2 && vis.some(u => u.id === 'b') && vis.some(u => u.id === 'c'), 'visibleStackOnHex pomija garnizon');

const all = coLocatedForMergePrompt(units, 3, 4, 0);
ok(all.length === 2 && all.some(u => u.id === 'a') && all.some(u => u.id === 'b'), 'coLocatedForMergePrompt: garnizon + widoczna, bez oblegajacej');

const hudActs = stackHudMergeSplitActions(2, true, 1);
ok(hudActs.length === 2 && hudActs[0].id === 'split' && hudActs[1].id === 'merge',
  'stackHudMergeSplitActions: 2+ units → Rozdziel + Połącz');
ok(hudActs[1].disabled === false, 'merge enabled when canMerge=true on multi stack');

console.log('\narmy-merge-colocated-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
