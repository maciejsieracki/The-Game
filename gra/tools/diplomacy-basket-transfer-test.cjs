'use strict';
/** diplomacy-basket-transfer-test.cjs — P6 tech + surowiec boolean */
const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-basket-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-basket-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  grantTechToOwner,
  grantSurowiecBooleanAccess,
  hasSurowiecBooleanAccess,
  createEmptyBasketTransferContext,
  resetBasketTransferGrantSeq,
} from '../src/game/diplomacy-basket-transfer.ts';
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
function ok(c, m) {
  if (c) { pass++; console.log('  OK:', m); }
  else { fail++; console.error('  FAIL:', m); }
}

console.log('diplomacy-basket-transfer-test');

B.resetBasketTransferGrantSeq(0);

const techCatalog = [{ Technologia: 'Garncarstwo', Epoka: 'Kamien' }];
let ctx = B.createEmptyBasketTransferContext(techCatalog);

const t1 = B.grantTechToOwner('Garncarstwo', 2, ctx);
ok(t1.granted, 'tech grant OK');
ok(t1.context.researchedByOwner.get(2)?.has('Garncarstwo'), 'tech w zbadanych owner 2');
ctx = t1.context;

const t2 = B.grantTechToOwner('Garncarstwo', 2, ctx);
ok(!t2.granted, 'duplikat tech → no-op');

const t3 = B.grantTechToOwner('NieistniejacaTech', 2, ctx);
ok(!t3.granted, 'nieznana tech odrzucona');

const s1 = B.grantSurowiecBooleanAccess('drewno', 1, 3, ctx);
ok(s1.granted, 'surowiec grant OK');
ctx = s1.context;
ok(
  B.hasSurowiecBooleanAccess('drewno', 1, 3, ctx),
  'hasSurowiecBooleanAccess true',
);
ok(
  !B.hasSurowiecBooleanAccess('drewno', 1, 2, ctx),
  'brak grantu dla innej pary',
);

const s2 = B.grantSurowiecBooleanAccess('drewno', 1, 3, ctx);
ok(!s2.granted, 'duplikat surowiec → no-op');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
