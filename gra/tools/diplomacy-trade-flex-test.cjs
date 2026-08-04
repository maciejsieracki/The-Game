'use strict';
/** R-DYPLO-WYMIANA-FLEX — walidacja one-way trade + helper pakietu PW */
const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-trade-flex-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-trade-flex-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { validateTradeBasketSides } from '../src/game/diplomacy-trade-validation.ts';
export {
  balancePanelDataFromRows,
  filterActionableNegotiationRows,
} from '../src/ui/diplomacyAcceptanceBalance.ts';
export { shouldDeferEotEvents } from '../src/game/eot-event-defer.ts';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const B = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('diplomacy-trade-flex-test');

// ONEWAY=A — tylko give OK
{
  const v = B.validateTradeBasketSides('trade', [{ typ: 'zloto', id: 'zloto', ilosc: 10 }], []);
  ok(v.valid, 'one-way: tylko Co oddaję → valid');
}

// ONEWAY=A — tylko receive OK
{
  const v = B.validateTradeBasketSides('trade', [], [{ typ: 'zloto', id: 'zloto', ilosc: 5 }]);
  ok(v.valid, 'one-way: tylko Co dostaję → valid');
}

// obie puste → invalid
{
  const v = B.validateTradeBasketSides('trade', [], []);
  ok(!v.valid, 'trade: obie strony puste → invalid');
}

// gift nadal wymaga give
{
  const v = B.validateTradeBasketSides('gift', [], []);
  ok(!v.valid, 'gift: pusty give → invalid');
}

// package actionable filter
{
  const rows = [
    { id: 'a', direction: 'incoming', actionLabel: 'Handel', acceptanceTheir: { mode: 'basket', accepted: true, balancePn: 0, statusLabel: 'ok' } },
    { id: 'b', direction: 'own', actionLabel: 'NAP', awaitingAiResponse: true, acceptanceTheir: { mode: 'treaty', accepted: true, balancePn: 0, statusLabel: 'ok' } },
    { id: 'c', direction: 'own', actionLabel: 'Done', awaitingAiResponse: false, acceptanceTheir: { mode: 'treaty', accepted: true, balancePn: 0, statusLabel: 'ok' } },
  ];
  const act = B.filterActionableNegotiationRows(rows);
  ok(act.length === 2, 'filterActionable: incoming + own awaiting AI');
  const panel = B.balancePanelDataFromRows(rows);
  ok(panel != null && panel.actionLabel.includes('Pakiet'), 'balancePanelDataFromRows: etykieta pakietu');
}

// EOT defer flag
ok(B.shouldDeferEotEvents(true) === true, 'shouldDeferEotEvents(true)');
ok(B.shouldDeferEotEvents(false) === false, 'shouldDeferEotEvents(false)');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
