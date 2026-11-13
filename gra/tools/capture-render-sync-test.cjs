'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const source = fs.readFileSync(path.resolve(__dirname, '..', 'src/main.ts'), 'utf8');
const start = source.indexOf('    let cityCaptureRenderSyncFramePending = false;');
const end = source.indexOf('\n    function tryAutoCaptureEmptyCityAt(', start);
assert(start >= 0 && end > start, 'capture refresh state/function markers must exist');
const fnSource = source.slice(start, end);
const js = esbuild.transformSync(fnSource, { loader: 'ts', target: 'es2020' }).code;
const fogStart = source.indexOf('    function refreshFog(');
const fogEnd = source.indexOf('\n    /**', fogStart);
const syncCallsInsideFog = (source.slice(fogStart, fogEnd).match(/syncUnitsRender\(/g) || []).length;
assert.equal(syncCallsInsideFog, 2, 'refreshFog must continue syncing units in both fog rendering branches');

function run({ galleryOn, lead, captureCount = 1 }) {
  const calls = [];
  const callbacks = [];
  const context = {
    galleryOn,
    reachable: new Set(['stale']),
    unitRenderer: {
      clearHighlight: () => calls.push('clearHighlight'),
      clearPathRoute: () => calls.push('clearPathRoute'),
      setSelectionHex: () => calls.push('selectionHex'),
    },
    hoverKey: 'stale', selectedId: null, forceVisibleUnitId: null,
    syncUnitsRender: () => calls.push('unitSync'),
    cityRenderer: { sync: () => calls.push('citySync') },
    _cityRenderOpts: () => ({}),
    // The current production refreshFog syncs tokens after its state/discovery work.
    refreshFog: () => { calls.push('refreshFog'); if (!galleryOn) calls.push('unitSync'); },
    updateHud: () => calls.push('hud'), refreshD1bHud: () => calls.push('d1b'),
    refreshSiegeMarkers: () => calls.push('siegeMarkers'),
    cities: [], finishUnitEnterCityHex: () => calls.push('cityEntry'),
    requestAnimationFrame: cb => { calls.push('rafScheduled'); callbacks.push(cb); },
  };
  const names = Object.keys(context);
  const api = new Function(...names,
    `${js}\nreturn { fn: refreshMapAfterCityCapture, state: () => ({ selectedId, forceVisibleUnitId }) };`
  )(...names.map(k => context[k]));
  for (let i = 0; i < captureCount; i++) {
    api.fn({ ...lead, id: `${lead.id}-${i}` });
  }
  return { context, calls, callbacks, state: api.state, fn: api.fn };
}

const lead = { id: 'captor', q: 4, r: 5, ownerId: 2 };
const normal = run({ galleryOn: false, lead });
assert.equal(normal.calls.filter(c => c === 'unitSync').length, 1,
  'normal capture projects unit tokens through refreshFog');
assert.deepEqual(normal.calls.slice(0, 7), [
  'clearHighlight', 'clearPathRoute', 'selectionHex', 'citySync', 'refreshFog', 'unitSync', 'hud',
]);
assert.equal(normal.state().selectedId, 'captor-0');
assert.equal(normal.state().forceVisibleUnitId, 'captor-0');
assert.equal(normal.callbacks.length, 1, 'single capture schedules one deferred cleanup');
normal.callbacks[0]();
assert.equal(normal.state().forceVisibleUnitId, null, 'deferred callback clears its matching force-visible lead');
assert.equal(normal.calls.filter(c => c === 'unitSync').length, 2, 'single capture still performs its deferred projection');

const gallery = run({ galleryOn: true, lead });
assert.equal(gallery.calls.filter(c => c === 'unitSync').length, 1,
  'gallery capture retains explicit unit projection because refreshFog returns early');
assert.deepEqual(gallery.calls.slice(0, 6), [
  'clearHighlight', 'clearPathRoute', 'selectionHex', 'unitSync', 'citySync', 'refreshFog',
]);
gallery.callbacks[0]();
assert.equal(gallery.state().forceVisibleUnitId, null);

const batch = run({ galleryOn: false, lead, captureCount: 8 });
assert.equal(batch.callbacks.length, 1, 'eight synchronous captures coalesce to one pending RAF');
assert.equal(batch.calls.filter(c => c === 'refreshFog').length, 8,
  'capture refresh retains per-capture fog/discovery work');
assert.equal(batch.calls.filter(c => c === 'unitSync').length, 8,
  'per-capture token projection still occurs through refreshFog');
assert.equal(batch.state().selectedId, 'captor-0', 'selection retains the first applicable lead');
assert.equal(batch.state().forceVisibleUnitId, 'captor-7', 'force-visible state tracks the latest lead before RAF');
batch.callbacks[0]();
assert.equal(batch.state().forceVisibleUnitId, null, 'one callback clears only the latest matching force-visible lead');
assert.equal(batch.calls.filter(c => c === 'unitSync').length, 9,
  'eight-capture batch performs exactly one deferred final projection');

const acrossFrames = run({ galleryOn: false, lead });
acrossFrames.callbacks[0]();
acrossFrames.fn({ ...lead, id: 'later-captor' });
assert.equal(acrossFrames.callbacks.length, 2, 'capture after a completed frame schedules a fresh RAF');
assert.equal(acrossFrames.state().forceVisibleUnitId, 'later-captor');
acrossFrames.callbacks[1]();
assert.equal(acrossFrames.state().forceVisibleUnitId, null);
assert.equal(acrossFrames.calls.filter(c => c === 'unitSync').length, 4,
  'separate-frame captures each keep their own deferred projection');

console.log('capture-render-sync-test: 23 passed, 0 failed');
