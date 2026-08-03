'use strict';
/** diplomacy-war-gates-test.cjs — NAP + blokada złota w wojnie (Maciej 2026-08-01) */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.dip-war-gates-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dip-war-gates-entry.ts');
fs.writeFileSync(entryFile, `
export {
  isNapBlockingWarDeclaration,
  isCurrencyProposalForbiddenDuringWar,
  payloadHasCurrencyPayment,
  isPeaceCurrencyAction,
} from '../src/game/diplomacy-war-gates.ts';
export {
  shouldCityStateRollWarOnPlayer,
  pickClusterCityStateWarTargetId,
} from '../src/game/city-state-difficulty.ts';
export { decideAIDiplomacy } from '../src/game/ai.ts';
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
  isNapBlockingWarDeclaration,
  isCurrencyProposalForbiddenDuringWar,
  payloadHasCurrencyPayment,
  isPeaceCurrencyAction,
  shouldCityStateRollWarOnPlayer,
  pickClusterCityStateWarTargetId,
  decideAIDiplomacy,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('diplomacy-war-gates-test');

ok(isNapBlockingWarDeclaration(true), 'NAP blokuje DOW');
ok(!isNapBlockingWarDeclaration(false), 'brak NAP — brak blokady');

ok(isPeaceCurrencyAction('pokoj'), 'pokoj = peace currency');
ok(isPeaceCurrencyAction('trybut_oferta'), 'trybut_oferta = peace currency');
ok(!isPeaceCurrencyAction('handel'), 'handel ≠ peace currency');

ok(payloadHasCurrencyPayment({ goldOnce: 50 }), 'goldOnce wykryte');
ok(payloadHasCurrencyPayment({ giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 10 }] }), 'zloto w koszyku');
ok(!payloadHasCurrencyPayment({}), 'pusty payload');

ok(
  isCurrencyProposalForbiddenDuringWar('handel', { goldOnce: 50 }, true),
  'handel+złoto zabronione w wojnie',
);
ok(
  !isCurrencyProposalForbiddenDuringWar('pokoj', { goldOnce: 50 }, true),
  'pokoj+złoto dozwolone w wojnie',
);
ok(
  !isCurrencyProposalForbiddenDuringWar('handel', { goldOnce: 50 }, false),
  'handel+złoto OK poza wojną',
);

// BUG 2026-08-02: modal daru hardkodował atWar=true — regresja gift + pokój ze złotem w wojnie
const giftGoldPayload = { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }] };
ok(
  !isCurrencyProposalForbiddenDuringWar('handel', giftGoldPayload, false),
  'dar złota w pokoju OK (actionId handel jak mode=gift)',
);
ok(
  isCurrencyProposalForbiddenDuringWar('handel', giftGoldPayload, true),
  'dar złota w wojnie zablokowany',
);
ok(
  !isCurrencyProposalForbiddenDuringWar('pokoj', { goldOnce: 100 }, true),
  'ugoda pokojowa ze złotem w wojnie OK',
);

ok(
  !shouldCityStateRollWarOnPlayer('hard', 25, false, false, () => 0, false, true),
  'PM roll: NAP blokuje DOW',
);

const targets = [{ ownerId: 2, q: 5, r: 5 }, { ownerId: 3, q: 10, r: 10 }];
ok(
  pickClusterCityStateWarTargetId(25, targets, new Set(), { q: 0, r: 0 }, new Set([3])) === 2,
  'cluster force: pomija CS z NAP (owner 3)',
);

const relStub = {
  partnerId: '3',
  relation: { status: 'neutralny', zaufanie: 0, respekt: 50 },
  respektWzgledny: 0.6,
  stanWojny: false,
  hasNapTreaty: true,
};
const napBlocked = decideAIDiplomacy({
  myPlayerId: '1',
  relacje: [relStub],
  agresja: 0.9,
  currentTurn: 25,
  clusterForceWarTargetId: 3,
});
ok(!napBlocked.some(c => c.type === 'wypowiedz_wojne'), 'decideAIDiplomacy: NAP blokuje cluster force');

const relNoNap = { ...relStub, hasNapTreaty: false };
const warCmd = decideAIDiplomacy({
  myPlayerId: '1',
  relacje: [relNoNap],
  agresja: 0.3,
  currentTurn: 25,
  clusterForceWarTargetId: 3,
});
ok(warCmd.length === 1 && warCmd[0].type === 'wypowiedz_wojne', 'bez NAP — cluster force działa');

const relNapNormal = {
  partnerId: '2',
  relation: { status: 'neutralny', zaufanie: -50, respekt: 30 },
  respektWzgledny: 0.8,
  stanWojny: false,
  hasNapTreaty: true,
};
const noWar = decideAIDiplomacy({
  myPlayerId: '1',
  relacje: [relNapNormal],
  agresja: 0.95,
  currentTurn: 50,
});
ok(!noWar.some(c => c.type === 'wypowiedz_wojne'), 'decideAIDiplomacy: NAP blokuje normalny DOW');

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
