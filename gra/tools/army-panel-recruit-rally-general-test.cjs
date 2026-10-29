'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const built = esbuild.buildSync({
  entryPoints: [path.join(ROOT, 'src/game/generals.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  logLevel: 'silent',
});
const loadedModule = { exports: {} };
new Function('module', 'exports', built.outputFiles[0].text)(loadedModule, loadedModule.exports);
const { planDeferredGeneralMarchBatch } = loadedModule.exports;

let pass = 0;
function check(label, actual, expected) {
  assert.deepEqual(actual, expected, label);
  pass += 1;
  console.log(`PASS ${label}`);
}

const ids = ['recruit-city', 'recruit-army-panel', 'recruit-army-panel-2'];
const planned = [];
const enqueued = [];
const marching = planDeferredGeneralMarchBatch(
  ids,
  id => {
    planned.push(id);
    return id !== 'recruit-city';
  },
  batch => enqueued.push(batch),
);
check('tries to plan General-follow for every deferred recruit', planned, ids);
check('returns every recruit whose General-follow route was planned', marching, ['recruit-army-panel', 'recruit-army-panel-2']);
check('enqueues all planned recruits together exactly once', enqueued, [['recruit-army-panel', 'recruit-army-panel-2']]);

const mainSource = require('node:fs').readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
const start = mainSource.indexOf('function flushDeferredPlayerUnitReveals(): void {');
const end = mainSource.indexOf('\n    function openSplitPanelForSelected()', start);
const body = start >= 0 && end > start ? mainSource.slice(start, end) : '';
assert.match(body, /planDeferredGeneralMarchBatch\(\s*ids,\s*planSpawnedUnitFollowGeneral,\s*enqueueMarchSegments,\s*\)/);
assert.match(body, /afterPlayerUnitSpawned\(lastId, marchingIds\.includes\(lastId\)\)/);
pass += 2;
console.log('PASS live completion handler plans all deferred recruits and reveals only the last one');
console.log(`\n${pass} assertions passed`);
