'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const entry = path.resolve(__dirname, '..', 'src', 'game', 'civ-ai-allocation.ts');
const out = path.join(os.tmpdir(), `the-game-civ-ai-allocation-${process.pid}.cjs`);
esbuild.buildSync({
  entryPoints: [entry],
  outfile: out,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  logLevel: 'silent',
});

let pass = 0;
let fail = 0;
function check(label, fn) {
  try {
    fn();
    pass += 1;
    console.log(`PASS: ${label}`);
  } catch (err) {
    fail += 1;
    console.error(`FAIL: ${label}: ${err.message}`);
  }
}

const api = require(out);
for (const difficulty of ['easy', 'normal', 'hard']) {
  check(`Grecy profile ${difficulty}`, () => {
    const profile = api.civAiAllocationFor('grecy', difficulty);
    assert.ok(profile);
    assert.equal(profile.workBuildingsPercent, 50);
    assert.equal(profile.workEmpirePoolPercent, 50);
    assert.equal(profile.sciencePercent, 60);
    assert.equal(profile.moneyPercent, 20);
    assert.equal(profile.wealthPercent, 20);
    assert.equal(profile.improvementAutomationPercent, 100);
    assert.equal(api.isValidCivAiAllocationProfile(profile), true);
  });
}

check('profile resolves the display-name alias', () => {
  assert.deepEqual(api.civAiAllocationFor('Grecy', 'normal'), api.civAiAllocationFor('grecy', 'normal'));
});
check('non-pilot civilization keeps its existing policy', () => {
  assert.equal(api.civAiAllocationFor('rzymianie', 'normal'), undefined);
  assert.equal(api.civAiAllocationFor(undefined, 'normal'), undefined);
});
check('profile is wired into the runtime owner path', () => {
  const main = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
  assert.match(main, /civAiAllocationFor/);
  assert.match(main, /applyAiAllocationProfile\(c\.ownerId\)/);
  assert.match(main, /applyAiAllocationProfiles\(\)/);
});

check('legacy/stale save reapplies profile after all saved allocation maps', () => {
  const main = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
  const loadStart = main.indexOf('restoreAiRosterFromSave(saved);');
  const savedHandel = main.indexOf('const savedHandel =', loadStart);
  const savedPraca = main.indexOf('const savedPodzialPracy =', loadStart);
  const savedUlepszenia = main.indexOf('const savedUlepszenia =', loadStart);
  const savedMapsEnd = main.indexOf('      restoreMennicaZlotoGrace(', savedUlepszenia);
  const reapplied = main.indexOf('      applyAiAllocationProfiles();', savedUlepszenia);

  assert.ok(loadStart >= 0, 'load path marker');
  assert.ok(savedHandel > loadStart, 'saved trade map is restored in load path');
  assert.ok(savedPraca > savedHandel, 'saved work map is restored after trade map');
  assert.ok(savedUlepszenia > savedPraca, 'saved improvement map is restored after work map');
  assert.ok(reapplied > savedUlepszenia, 'profile reapplication follows saved maps');
  assert.ok(reapplied < savedMapsEnd, 'profile reapplication follows the legacy fallback branch');

  const withoutReapply = main.slice(0, reapplied)
    + main.slice(reapplied + '      applyAiAllocationProfiles();'.length);
  const loadTail = withoutReapply.slice(savedUlepszenia, savedMapsEnd);
  assert.equal(loadTail.includes('      applyAiAllocationProfiles();'), false,
    'ordering regression turns red when the load-time call is removed');
});

try { fs.unlinkSync(out); } catch (_) { /* best effort */ }
if (fail > 0) {
  console.error(`FAILED: ${pass} passed, ${fail} failed`);
  process.exit(1);
}
console.log(`\n${pass}/${pass + fail} PASS`);
