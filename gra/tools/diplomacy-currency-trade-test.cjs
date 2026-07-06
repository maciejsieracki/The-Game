'use strict';
/** Kurs ¤↔Praca — diplomacy-currency-trade.ts */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-currency-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-currency-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  diplomacyTradeReceiveAmount,
  diplomacyTradePayAmount,
} from '../src/game/diplomacy-currency-trade';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const D = require(BUNDLE);
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }
function eq(a, b, m) { ok(a === b, `${m} (got ${a}, want ${b})`); }

eq(D.diplomacyTradeReceiveAmount(100, 100), 100, 'Rel 100 pay 100 -> 100');
eq(D.diplomacyTradeReceiveAmount(100, 140), 140, 'Rel 140 pay 100 -> 140');
eq(D.diplomacyTradeReceiveAmount(100, 70), 70, 'Rel 70 pay 100 -> 70');
eq(D.diplomacyTradePayAmount(100, 100), 100, 'Rel 100 want 100 -> pay 100');
eq(D.diplomacyTradePayAmount(100, 140), 72, 'Rel 140 want 100 -> pay 72');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`diplomacy-currency-trade-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
