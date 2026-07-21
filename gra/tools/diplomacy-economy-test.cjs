'use strict';
/** diplomacy-economy-test.cjs — v1.1 trybut tick T1A */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.dip-economy-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dip-economy-entry.ts');
fs.writeFileSync(entryFile, `
export {
  activeDealsToPaymentDeals, tickDiplomacyPayments, applyOneShotGoldTransfer,
  applyDiplomaticGoldGrant, tributeBreakPairsFromDeals, capAiGoldOffer, AI_TRADE_GOLD_MAX,
} from '../src/game/diplomacy-economy.ts';
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
  activeDealsToPaymentDeals, tickDiplomacyPayments, applyOneShotGoldTransfer,
  applyDiplomaticGoldGrant, tributeBreakPairsFromDeals, capAiGoldOffer, AI_TRADE_GOLD_MAX,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

function treasury(balances) {
  const map = { ...balances };
  return {
    getPieniadze: (id) => map[id] ?? 0,
    add: (id, d) => { map[id] = (map[id] ?? 0) + d; },
    _map: map,
  };
}

console.log('diplomacy-economy-test');

const deals = activeDealsToPaymentDeals([{
  id: 't1', rodzaj: 'wasalizacja', strony: [0, 2], wygasaTura: null,
  ekonomia: { payerOwnerId: 0, receiverOwnerId: 2, pieniadzePerTura: 15 },
}], 5);
ok(deals.length === 1 && deals[0].pieniadzePerTura === 15, 'activeDeals → tribute');

const t = treasury({ 0: 100, 2: 0 });
const r1 = tickDiplomacyPayments(deals, t, 5);
ok(r1.paid.includes('t1') && t._map[0] === 85 && t._map[2] === 15, 'tick OK');

const t2 = treasury({ 0: 5, 2: 0 });
const r2 = tickDiplomacyPayments(deals, t2, 6);
ok(r2.broken.includes('t1') && t2._map[0] === 5, 'bankrupt → broken');

const expired = activeDealsToPaymentDeals([{
  id: 'e1', rodzaj: 'wasalizacja', strony: [0, 3], wygasaTura: 10,
  ekonomia: { payerOwnerId: 0, receiverOwnerId: 3, pieniadzePerTura: 10 },
}], 11);
ok(expired.length === 0, 'expired deal pominięty');

const t3 = treasury({ 1: 50, 4: 0 });
const once = applyOneShotGoldTransfer(1, 4, 30, t3);
ok(once.ok && t3._map[1] === 20 && t3._map[4] === 30, 'one-shot handel T3A');

const t4 = treasury({ 5: 0, 0: 100 });
const grantEmpty = applyDiplomaticGoldGrant(5, 0, 20, t4);
ok(!grantEmpty.ok && t4._map[0] === 100 && t4._map[5] === 0, 'strict grant — pusty skarbiec AI → brak transferu');

const t5 = treasury({ 5: 8, 0: 100 });
const grantPartial = applyDiplomaticGoldGrant(5, 0, 20, t5);
ok(!grantPartial.ok && t5._map[0] === 100 && t5._map[5] === 8, 'strict grant — 8¤ w skarbcu, oferta 20 → odrzucone');

const t6 = treasury({ 5: 20, 0: 100 });
const grantOk = applyDiplomaticGoldGrant(5, 0, 20, t6);
ok(grantOk.ok && grantOk.granted === 20 && t6._map[0] === 120 && t6._map[5] === 0, 'strict grant 20¤ pełny skarbiec');

ok(capAiGoldOffer(5, AI_TRADE_GOLD_MAX) === 5, 'capAiGoldOffer 5');
ok(capAiGoldOffer(0, AI_TRADE_GOLD_MAX) === 0, 'capAiGoldOffer 0');

const pairs = tributeBreakPairsFromDeals([{
  id: 'tb', rodzaj: 'wasalizacja', strony: [0, 2], wygasaTura: null,
  ekonomia: { payerOwnerId: 0, receiverOwnerId: 2, pieniadzePerTura: 10 },
}], ['tb']);
ok(pairs.length === 1 && pairs[0].payerOwnerId === 0, 'tributeBreakPairsFromDeals');

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
