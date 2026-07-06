'use strict';
/** Cennik handlu złożem — diplomacy-deposit-trade.ts */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-deposit-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-deposit-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  diplomacyDepositEffectivePrice,
  diplomacyDepositBarterRequiredValue,
  diplomacyDepositBasePrice,
  HANDEL_ZLOZE_CENA_BAZA,
} from '../src/game/diplomacy-deposit-trade';
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

eq(D.diplomacyDepositBasePrice('zelazo'), 150, 'baza zelazo');
eq(D.diplomacyDepositEffectivePrice('glina', 100), 50, 'Rel 100 = baza');
eq(D.diplomacyDepositEffectivePrice('glina', 50), 100, 'Rel 50 = 2× baza');
eq(D.diplomacyDepositEffectivePrice('konie', 200), 50, 'Rel 200 = połowa bazy');
eq(D.diplomacyDepositBarterRequiredValue(150, 100), 150, 'barter @ Rel 100');
eq(D.diplomacyDepositBarterRequiredValue(150, 150), 100, 'barter @ Rel 150');
ok(D.diplomacyDepositEffectivePrice('luksus', 100) === null, 'brak luksusu w cenniku');
ok(D.diplomacyDepositEffectivePrice('bydlo', 100) === null, 'brak bydlo — ulepszenie terenu');
ok(D.diplomacyDepositEffectivePrice('owce', 100) === null, 'brak owce — ulepszenie terenu');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`diplomacy-deposit-trade-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
