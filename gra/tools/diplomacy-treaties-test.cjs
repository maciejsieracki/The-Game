'use strict';
/** diplomacy-treaties-test.cjs — v1.1 traktaty + sojusze def/pełny */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const SRC = path.resolve(__dirname, '..', 'src');
const BUNDLE = path.resolve(__dirname, '.dip-treaties-bundle.cjs');

const entry = `
export {
  addTreaty, expireTreaties, hasTreaty, allianceObligations,
  treatiesBrokenByRefusal, normalizeTreatyKind, treatiesBrokenByWar,
  tributeDeals, removeTreatiesById,
  hydrateActiveDeals, allianceObligationsForWarDeclaration,
} from '../src/game/diplomacy-treaties.ts';
`;
const entryFile = path.resolve(__dirname, '.dip-treaties-entry.ts');
fs.writeFileSync(entryFile, entry);

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
  addTreaty, expireTreaties, hasTreaty, allianceObligations,
  treatiesBrokenByRefusal, normalizeTreatyKind, treatiesBrokenByWar,
  hydrateActiveDeals, allianceObligationsForWarDeclaration,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('diplomacy-treaties-test');
ok(normalizeTreatyKind('sojusz_wojskowy') === 'sojusz_pelny', 'legacy → pełny');

let deals = addTreaty([], {
  id: 'd1', rodzaj: 'sojusz_defensywny', strony: [0, 2], wygasaTura: null,
});
ok(hasTreaty(deals, 0, 2, 'sojusz_defensywny'), 'has defensywny');

const obs = allianceObligations(deals, { type: 'attacked', victimOwnerId: 0, aggressorOwnerId: 5 });
ok(obs.length === 1 && obs[0].obligatedAllies[0] === 2, 'def: sojusznik 2 vs 5');

deals = addTreaty(deals, { id: 'p1', rodzaj: 'sojusz_pelny', strony: [0, 3], wygasaTura: null });
const obs2 = allianceObligations(deals, { type: 'declared_war', declarerOwnerId: 0, targetOwnerId: 7 });
ok(obs2[0]?.obligatedAllies[0] === 3, 'pełny: 3 za 0 vs 7');
ok(treatiesBrokenByRefusal(obs2, []).includes('p1'), 'brak wojny → zryw');

deals = addTreaty(deals, { id: 'nap', rodzaj: 'pakt_nieagresji', strony: [0, 4], wygasaTura: 10 });
ok(expireTreaties(deals, 11).length === 2, 'expire NAP');

ok(treatiesBrokenByWar(deals, 0, 4).includes('nap'), 'wojna zerwie NAP');

const legacy = hydrateActiveDeals([{
  id: 'leg', rodzaj: 'sojusz_wojskowy', strony: [1, 2], wygasaTura: null,
}]);
ok(legacy[0].rodzaj === 'sojusz_pelny', 'hydrate legacy → pełny');

deals = addTreaty([], { id: 'd2', rodzaj: 'sojusz_defensywny', strony: [2, 5], wygasaTura: null });
const warObs = allianceObligationsForWarDeclaration(deals, 0, 5);
ok(
  warObs.some(o => o.obligatedAllies[0] === 2 && o.mustDeclareWarOn === 0),
  'war decl: def sojusznik 2 vs agresor 0',
);

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
