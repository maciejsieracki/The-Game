'use strict';
/** diplomacy-peace-lock-test.cjs — karencja 10 tur po pokoju (Maciej 2026-08-01) */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.dip-peace-lock-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dip-peace-lock-entry.ts');
fs.writeFileSync(entryFile, `
export {
  PEACE_TREATY_LOCK_TURNS,
  isPeaceTreatyLocked,
  startPeaceTreatyLock,
  filterAllianceObligationsRespectingPeaceLock,
} from '../src/game/diplomacy-peace-lock.ts';
export { freshDiploPairMeta } from '../src/game/diplomacy-pn-engine.ts';
`);

esbuild.buildSync({
  entryPoints: [entryFile],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const {
  PEACE_TREATY_LOCK_TURNS,
  isPeaceTreatyLocked,
  startPeaceTreatyLock,
  filterAllianceObligationsRespectingPeaceLock,
  freshDiploPairMeta,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('diplomacy-peace-lock-test');

ok(PEACE_TREATY_LOCK_TURNS === 10, 'lock = 10 tur');

const meta0 = freshDiploPairMeta();
const locked = startPeaceTreatyLock(meta0, 5);
ok(locked.peaceUntilTurn === 15, 'peaceUntilTurn = turn + 10');
ok(locked.n3Window?.typ === 'pokoj', 'n3Window typ pokoj');

ok(isPeaceTreatyLocked(locked, 5), 'aktywna w turze zawarcia');
ok(isPeaceTreatyLocked(locked, 14), 'aktywna do peaceUntilTurn-1');
ok(!isPeaceTreatyLocked(locked, 15), 'wygasła w peaceUntilTurn');
ok(!isPeaceTreatyLocked(freshDiploPairMeta(), 99), 'brak pola = brak blokady');

const obs = [{
  mustDeclareWarOn: 0,
  obligatedAllies: [3, 4],
  treatyIdsToBreakOnRefusal: ['t1'],
}];
const filtered = filterAllianceObligationsRespectingPeaceLock(
  obs,
  (ally, target) => ally === 3 && target === 0,
);
ok(filtered.length === 1 && filtered[0].obligatedAllies.length === 1 && filtered[0].obligatedAllies[0] === 4,
  'sojusz: pomija sojusznika z karencją pokoju wobec celu');

const filteredAll = filterAllianceObligationsRespectingPeaceLock(
  obs,
  () => true,
);
ok(filteredAll.length === 0, 'wszyscy zablokowani → brak obowiązków');

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
