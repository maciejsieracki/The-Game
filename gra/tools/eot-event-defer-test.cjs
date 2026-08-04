'use strict';
/** R-EOT-EVENT-DEFER-Q1=A — helper kolejki wydarzeń EOT */
const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.eot-defer-entry.ts');
const BUNDLE = path.resolve(__dirname, '.eot-defer-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  shouldDeferEotEvents,
  deferredHintsToSidePanelEvents,
  mergeDeferredEotSideEvents,
} from '../src/game/eot-event-defer.ts';
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

const B = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('eot-event-defer-test');

ok(B.shouldDeferEotEvents(true), 'defer when EOT in progress');
ok(!B.shouldDeferEotEvents(false), 'no defer when player turn');

const evs = B.deferredHintsToSidePanelEvents([{ msg: '<b>Test</b> hint', durationMs: 3000 }], 42);
ok(evs.length === 1 && evs[0].id.startsWith('eot-hint-42'), 'hints → SidePanelEvent');
ok(!evs[0].subtitle.includes('<'), 'subtitle bez HTML');

const log = [];
B.mergeDeferredEotSideEvents(log, [{ id: 'x', icon: 'i', title: 'T', subtitle: 'S', kind: 'info' }], 4);
ok(log.length === 1 && log[0].id === 'x', 'mergeDeferredEotSideEvents');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
