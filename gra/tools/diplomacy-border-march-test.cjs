'use strict';
/** diplomacy-border-march-test.cjs — P5 kara przemarszu (D3-BORD) */
const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-border-march-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-border-march-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  hasAuthorizedBorderCrossing,
  applyUnauthorizedBorderPenalties,
  loadBorderMarchParams,
  dedupeBorderMarchPairs,
} from '../src/game/diplomacy-border-march.ts';
export { addTreaty } from '../src/game/diplomacy-treaties.ts';
export { diploPairKey } from '../src/game/diplomacy-pn-engine.ts';
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

const M = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) {
  if (c) { pass++; console.log('  OK:', m); }
  else { fail++; console.error('  FAIL:', m); }
}

const params = M.loadBorderMarchParams();
ok(params.karaPrzemarszNieautoryzowany_zaufanie_perTura === 5, 'param JSON = 5');

const neutralRel = { zaufanie: 50, respekt: 30, status: 'neutralni' };
const relKey = M.diploPairKey(1, 2);
const baseRels = new Map([[relKey, { ...neutralRel }]]);

const emptyTreaties = [];
const resolveCivil = () => ({
  treaties: emptyTreaties,
  isMilitary: false,
  relation: neutralRel,
});

console.log('diplomacy-border-march-test');

// 1) jedna para bez traktatu → −5
const r1 = M.applyUnauthorizedBorderPenalties(
  [{ intruderOwnerId: 1, territoryOwnerId: 2 }],
  baseRels,
  params,
  resolveCivil,
);
ok(r1.penalizedPairs === 1, 'jedna para → kara');
ok(r1.relations.get(relKey).zaufanie === 45, '−5 Zaufanie jedna para');

// 2) trzy jednostki tej samej pary → nadal −5 (dedupe)
const rels2 = new Map([[relKey, { zaufanie: 50, respekt: 30, status: 'neutralni' }]]);
const r2 = M.applyUnauthorizedBorderPenalties(
  [
    { intruderOwnerId: 1, territoryOwnerId: 2 },
    { intruderOwnerId: 1, territoryOwnerId: 2 },
    { intruderOwnerId: 1, territoryOwnerId: 2, isMilitary: true },
  ],
  rels2,
  params,
  (pair) => ({
    treaties: emptyTreaties,
    isMilitary: pair.isMilitary === true,
    relation: neutralRel,
  }),
);
ok(r2.penalizedPairs === 1, '3 jednostki = 1 kara');
ok(r2.relations.get(relKey).zaufanie === 45, '3 jednostki = −5 (nie −15)');

// 3) sojusz → 0 kary
let deals = M.addTreaty([], {
  id: 's1', rodzaj: 'sojusz_pelny', strony: [1, 2], wygasaTura: null,
});
const rels3 = new Map([[relKey, { zaufanie: 50, respekt: 30, status: 'sojusz' }]]);
const r3 = M.applyUnauthorizedBorderPenalties(
  [{ intruderOwnerId: 1, territoryOwnerId: 2, isMilitary: true }],
  rels3,
  params,
  () => ({ treaties: deals, isMilitary: true, relation: { ...neutralRel, status: 'sojusz' } }),
);
ok(r3.penalizedPairs === 0, 'sojusz = 0 kary');
ok(r3.relations.get(relKey).zaufanie === 50, 'sojusz: Zaufanie bez zmian');

// 4) otwarte granice (cywil) → 0 kary
deals = M.addTreaty([], {
  id: 'og1', rodzaj: 'otwarte_granice', strony: [1, 2], wygasaTura: null,
});
const r4 = M.applyUnauthorizedBorderPenalties(
  [{ intruderOwnerId: 1, territoryOwnerId: 2 }],
  baseRels,
  params,
  () => ({ treaties: deals, isMilitary: false, relation: neutralRel }),
);
ok(r4.penalizedPairs === 0, 'otwarte granice = 0 kary');
ok(
  M.hasAuthorizedBorderCrossing(1, 2, { treaties: deals, isMilitary: false }),
  'hasAuthorized: otwarte granice cywil',
);

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
