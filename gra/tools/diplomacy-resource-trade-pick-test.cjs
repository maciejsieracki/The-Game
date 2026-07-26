'use strict';
/**
 * diplomacy-resource-trade-pick-test.cjs — P-AI-011 deficyt przed nadwyżką.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const BUNDLE = path.resolve(__dirname, '.dip-res-trade-pick-bundle.cjs');
const entry = path.resolve(__dirname, '.dip-res-trade-pick-entry.ts');
fs.writeFileSync(entry, `
export {
  pickResourceTradeBetweenOwners,
  pickResourceDeficitForOwnerPair,
  pickResourceSurplusForOwnerPair,
  detectPricedResourceDeficits,
  resourceTradeKierunekForProposer,
  applyTradeArchetypePriceMargin,
} from '../src/game/diplomacy-resource-trade-pick.ts';
`);
esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});
const {
  pickResourceTradeBetweenOwners,
  pickResourceDeficitForOwnerPair,
  detectPricedResourceDeficits,
  resourceTradeKierunekForProposer,
  applyTradeArchetypePriceMargin,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

const priced = ['drewno', 'glina', 'kamien'];
const pakiet = 10;
const price = (key, p) => p * 5;

console.log('diplomacy-resource-trade-pick-test');

ok(
  detectPricedResourceDeficits(
    [{ key: 'drewno', label: 'Drewno', ilosc: 2 }, { key: 'glina', label: 'Glina', ilosc: 50 }],
    priced,
    pakiet,
  ).includes('drewno'),
  'deficyt: drewno 2 < pakiet 10',
);

const deficitPick = pickResourceTradeBetweenOwners({
  ownerA: 1,
  ownerB: 0,
  goodsA: [{ key: 'drewno', label: 'Drewno', ilosc: 0 }],
  goodsB: [{ key: 'drewno', label: 'Drewno', ilosc: 100 }],
  sellerOptionsA: [],
  sellerOptionsB: [{ id: 'drewno', label: 'Drewno ×10', maxPakiety: 10 }],
  pricedKeys: priced,
  pakietWielkosc: pakiet,
  maxPakietyPerTura: 3,
  pricePerPakiet: price,
});
ok(deficitPick?.powod === 'deficyt', 'priorytet deficyt');
ok(deficitPick?.sellerOwnerId === 0 && deficitPick?.buyerOwnerId === 1, 'AI(1) kupuje od gracza(0)');
ok(
  resourceTradeKierunekForProposer(1, deficitPick) === 'zakup',
  'kierunek zakup dla AI-proponenta',
);

const deficitDirect = pickResourceDeficitForOwnerPair({
  buyerOwnerId: 1,
  sellerOwnerId: 0,
  goodsBuyer: [{ key: 'glina', label: 'Glina', ilosc: 0 }],
  goodsSeller: [{ key: 'glina', label: 'Glina', ilosc: 100 }],
  sellerOptions: [{ id: 'glina', label: 'Glina ×10', maxPakiety: 10 }],
  pricedKeys: priced,
  pakietWielkosc: pakiet,
  maxPakietyPerTura: 3,
  pricePerPakiet: price,
});
ok(deficitDirect?.powod === 'deficyt' && deficitDirect.surowiecKey === 'glina', 'pickResourceDeficitForOwnerPair: glina 0 -> kupno');
ok(
  resourceTradeKierunekForProposer(1, deficitDirect) === 'zakup',
  'pickResourceDeficitForOwnerPair: kierunek zakup',
);

const surplusPick = pickResourceTradeBetweenOwners({
  ownerA: 2,
  ownerB: 3,
  goodsA: [{ key: 'glina', label: 'Glina', ilosc: 80 }],
  goodsB: [{ key: 'glina', label: 'Glina', ilosc: 80 }],
  sellerOptionsA: [{ id: 'glina', label: 'Glina ×10', maxPakiety: 8 }],
  sellerOptionsB: [{ id: 'glina', label: 'Glina ×10', maxPakiety: 8 }],
  pricedKeys: priced,
  pakietWielkosc: pakiet,
  maxPakietyPerTura: 3,
  pricePerPakiet: price,
});
ok(surplusPick?.powod === 'nadwyzka', 'bez deficytu -> nadwyzka');

ok(
  applyTradeArchetypePriceMargin(100, 0.8, 'zakup') > 100,
  'handlowy archetyp: wiecej placi przy zakupie',
);
ok(
  applyTradeArchetypePriceMargin(100, 0.2, 'zakup') < 100,
  'niehandlowy archetyp: mniej placi przy zakupie',
);

console.log(`\ndiplomacy-resource-trade-pick-test: ${pass} passed, ${fail} failed`);
try { fs.unlinkSync(entry); } catch (_) {}
try { fs.unlinkSync(BUNDLE); } catch (_) {}
process.exit(fail === 0 ? 0 : 1);
