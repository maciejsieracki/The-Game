'use strict';
/** escape-overlay-stack-test.cjs — push/pop + Escape → onClose bez DOM */
const path = require('path');
const esbuild = require('esbuild');

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.escape-overlay-stack-test-entry.ts');
const BUNDLE = path.join(__dirname, '.escape-overlay-stack-bundle.cjs');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA_ROOT,
  logLevel: 'silent',
});

const {
  pushOverlay,
  popOverlay,
  top,
  _resetEscapeOverlayStackForTest,
  _getEscapeOverlayStackDepthForTest,
  _dispatchEscapeForTest,
} = require(BUNDLE);

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) { pass++; return; }
  fail++;
  console.error('FAIL:', msg);
}

_resetEscapeOverlayStackForTest();

assert(_getEscapeOverlayStackDepthForTest() === 0, 'pusty stos na starcie');

let closedA = false;
let closedB = false;
pushOverlay('panel-a', () => { closedA = true; popOverlay('panel-a'); });
assert(_getEscapeOverlayStackDepthForTest() === 1, 'push jeden');
assert(top()?.id === 'panel-a', 'top panel-a');

pushOverlay('panel-b', () => { closedB = true; popOverlay('panel-b'); });
assert(top()?.id === 'panel-b', 'top panel-b po drugim push');

_dispatchEscapeForTest();
assert(closedB && !closedA, 'Escape zamyka tylko wierzchni');
assert(_getEscapeOverlayStackDepthForTest() === 1, 'zostaje panel-a');

popOverlay('panel-a');
assert(_getEscapeOverlayStackDepthForTest() === 0, 'pop po id usuwa wpis');

closedA = false;
closedB = false;
pushOverlay('x', () => { popOverlay('x'); });
pushOverlay('y', () => { popOverlay('y'); });
popOverlay();
assert(_getEscapeOverlayStackDepthForTest() === 1 && top()?.id === 'x', 'pop bez id = wierzchni');

pushOverlay('x', () => { closedA = true; });
assert(top()?.id === 'x', 're-push tego samego id na wierzch');

_resetEscapeOverlayStackForTest();

console.log(`escape-overlay-stack-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
