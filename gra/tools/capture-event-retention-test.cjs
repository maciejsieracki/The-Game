'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.capture-event-retention-entry.ts');
const BUNDLE = path.join(__dirname, '.capture-event-retention-bundle.cjs');
const mainSrc = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');

function bundleHelper() {
  fs.writeFileSync(ENTRY, "export { trimSidePanelEventLog } from '../src/game/retained-side-panel-events';\n", 'utf8');
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE, logLevel: 'silent' });
  return require(BUNDLE).trimSidePanelEventLog;
}

const trimSidePanelEventLog = bundleHelper();
const cityDetails = new Map();
const eliminationDetails = new Map();
const event = (id) => ({ id, title: id });
const log = [];

// Start with ten capture cards and matching modal payloads, newest first.
for (let n = 9; n >= 0; n--) {
  const id = `capture-${n}`;
  log.push(event(id));
  cityDetails.set(id, { rows: [`row-${n}`] });
}
const evictedInitial = trimSidePanelEventLog(log, 8, [
  { idPrefix: 'capture-', details: cityDetails },
  { idPrefix: 'elim-cs-', details: eliminationDetails },
]);
assert.equal(log.length, 8, 'war event log stays at its eight-card cap');
assert.deepEqual(evictedInitial.map((e) => e.id), ['capture-1', 'capture-0']);
assert.equal(cityDetails.size, 8, 'payloads for evicted capture cards are removed');
assert.equal(cityDetails.has('capture-1'), false);
assert.equal(cityDetails.has('capture-0'), false);
assert.deepEqual(cityDetails.get(log[0].id), { rows: ['row-9'] }, 'visible card still resolves its modal payload');
assert.deepEqual(cityDetails.get(log[7].id), { rows: ['row-2'] }, 'oldest retained visible card still resolves');

// An unrelated new event can evict a capture card too; only its payload is pruned.
const unrelated = event('war-11-0-1');
log.unshift(unrelated);
const evictedAfterWar = trimSidePanelEventLog(log, 8, [
  { idPrefix: 'capture-', details: cityDetails },
  { idPrefix: 'elim-cs-', details: eliminationDetails },
]);
assert.deepEqual(evictedAfterWar.map((e) => e.id), ['capture-2']);
assert.equal(cityDetails.has('capture-2'), false, 'non-capture insertion prunes the evicted capture payload');
assert.deepEqual(cityDetails.get('capture-3'), { rows: ['row-3'] }, 'retained capture details remain usable');

// City-state elimination uses the same capped event log and must not retain invisible detail rows.
const eliminationId = 'elim-cs-4-2';
eliminationDetails.set(eliminationId, { details: 'elimination report' });
log.unshift(event(eliminationId));
const evictedAfterElimination = trimSidePanelEventLog(log, 8, [
  { idPrefix: 'capture-', details: cityDetails },
  { idPrefix: 'elim-cs-', details: eliminationDetails },
]);
assert.equal(evictedAfterElimination.length, 1);
assert.equal(eliminationDetails.has(eliminationId), true, 'visible elimination payload is preserved');
const evictElimination = event('capture-new');
log.unshift(evictElimination);
trimSidePanelEventLog(log, 8, [
  { idPrefix: 'capture-', details: cityDetails },
  { idPrefix: 'elim-cs-', details: eliminationDetails },
]);
for (let n = 0; n < 7; n++) {
  log.unshift(event(`war-later-${n}`));
  trimSidePanelEventLog(log, 8, [
    { idPrefix: 'capture-', details: cityDetails },
    { idPrefix: 'elim-cs-', details: eliminationDetails },
  ]);
}
assert.equal(eliminationDetails.has(eliminationId), false, 'evicted elimination detail is also pruned');
assert.equal(cityDetails.has('capture-new'), false, 'no detail record is fabricated for a capture without one');

// Verify every production path that caps the log uses the cleanup helper, and both resets clear detail maps.
assert.equal((mainSrc.match(/warEventLog\.length > 8/g) || []).length, 0, 'no direct cap truncation bypasses detail cleanup');
assert.ok((mainSrc.match(/trimWarEventLog\(\);/g) || []).length >= 6, 'all event insertion sites invoke the cleanup trim');
assert.ok(mainSrc.includes('cityCaptureEventDetails.clear();'), 'session reset clears capture payloads');
assert.ok(mainSrc.includes('civElimEventDetails.clear();'), 'session reset clears elimination payloads');
assert.ok(mainSrc.includes('cityCaptureEventDetails.delete(id);'), 'manual dismissal still removes capture payload');
assert.ok(mainSrc.includes('civElimEventDetails.delete(id);'), 'manual dismissal still removes elimination payload');

console.log('capture-event-retention-test: PASS (20 assertions)');
fs.unlinkSync(ENTRY);
fs.unlinkSync(BUNDLE);
