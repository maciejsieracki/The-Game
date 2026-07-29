'use strict';
/**
 * diplomacy-rejection-cooldown-test.cjs — D-DYPLO-AI-NO-NAG (2026-07-29).
 * Cooldown po odrzuceniu oferty AI: partner + actionId, domyślnie 3 tury.
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.dip-reject-cooldown-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dip-reject-cooldown-entry.ts');
fs.writeFileSync(entryFile, `
export {
  AI_REJECTED_OFFER_COOLDOWN_TURNS,
  makeRejectedOfferCooldown,
  recordRejectedOffer,
  isOfferRejectedOnCooldown,
  pruneExpiredRejectedOffers,
  negotiationPartnerOwnerId,
} from '../src/game/diplomacy-rejection-cooldown.ts';
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
  AI_REJECTED_OFFER_COOLDOWN_TURNS,
  makeRejectedOfferCooldown,
  recordRejectedOffer,
  isOfferRejectedOnCooldown,
  pruneExpiredRejectedOffers,
  negotiationPartnerOwnerId,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('diplomacy-rejection-cooldown-test');

ok(AI_REJECTED_OFFER_COOLDOWN_TURNS === 3, 'AI_REJECTED_OFFER_COOLDOWN_TURNS = 3');

{
  const e = makeRejectedOfferCooldown(2, 'nap', 10);
  ok(e.partnerOwnerId === 2 && e.actionId === 'nap', 'makeRejectedOfferCooldown: pola');
  ok(e.rejectedAtTurn === 10 && e.expiresAtTurn === 13, 'makeRejectedOfferCooldown: expires = rejected + 3');
}

{
  let cd = [];
  cd = recordRejectedOffer(cd, 2, 'nap', 10);
  ok(cd.length === 1, 'recordRejectedOffer: pierwszy wpis');
  ok(isOfferRejectedOnCooldown(cd, 2, 'nap', 10), 'cooldown aktywny w turze odrzucenia');
  ok(isOfferRejectedOnCooldown(cd, 2, 'nap', 12), 'cooldown aktywny tura 12 (< 13)');
  ok(!isOfferRejectedOnCooldown(cd, 2, 'nap', 13), 'cooldown wygasa w turze 13');
  ok(!isOfferRejectedOnCooldown(cd, 2, 'handel', 11), 'inny actionId — brak blokady');
  ok(!isOfferRejectedOnCooldown(cd, 3, 'nap', 11), 'inny partner — brak blokady');
}

{
  let cd = recordRejectedOffer([], 2, 'nap', 5);
  cd = recordRejectedOffer(cd, 2, 'nap', 20);
  ok(cd.length === 1, 'recordRejectedOffer: nadpisuje ten sam klucz');
  ok(cd[0].rejectedAtTurn === 20 && cd[0].expiresAtTurn === 23, 'recordRejectedOffer: nowy expires');
}

{
  const cd = [
    makeRejectedOfferCooldown(1, 'nap', 1),
    makeRejectedOfferCooldown(2, 'handel', 10),
  ];
  const pruned = pruneExpiredRejectedOffers(cd, 5);
  ok(pruned.length === 1 && pruned[0].partnerOwnerId === 2, 'pruneExpiredRejectedOffers: usuwa wygasłe');
}

{
  ok(negotiationPartnerOwnerId(2, 0) === 2, 'negotiationPartnerOwnerId: AI proposer');
  ok(negotiationPartnerOwnerId(0, 3) === 3, 'negotiationPartnerOwnerId: AI responder');
}

console.log(`\nWynik: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
