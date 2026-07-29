/** node gra/tools/army-merge-colocated-test.cjs — coLocatedForMergePrompt (garnizon + widoczne) */
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const BUNDLE = path.join(__dirname, '.army-merge-colocated-bundle.cjs');

esbuild.buildSync({
  entryPoints: [path.join(__dirname, '.army-merge-colocated-entry.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: ROOT,
  logLevel: 'silent',
});

const { coLocatedForMergePrompt, visibleStackOnHex } = require(BUNDLE);

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

console.log('\narmy-merge-colocated-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
