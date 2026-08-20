'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.barb-coop-entry.ts');
const bundle = path.resolve(__dirname, '.barb-coop-bundle.cjs');
fs.writeFileSync(entry, `
export { hasBarbarianCooperationTreaty, addTreaty, expireTreaties } from '../src/game/diplomacy-treaties.ts';
export { hasAuthorizedBorderCrossing } from '../src/game/diplomacy-border-march.ts';
export {
  BARBARIAN_COOPERATION_RADIUS,
  BARBARIAN_COOPERATION_TURNS,
  isEligibleBarbarianCooperationUnit,
  collectBarbarianCooperationUnits,
  mergeBattleRosterWithBarbarianCooperation,
} from '../src/game/diplomacy-barbarian-cooperation.ts';
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
const M = require(bundle);
let pass = 0; let fail = 0;
function ok(value, message) { if (value) { pass++; console.log('  OK:', message); } else { fail++; console.error('  FAIL:', message); } }
const u = (id, ownerId, q, r, extra = {}) => ({ id, ownerId, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2, ...extra });
const deal = M.addTreaty([], { id: 'coop', rodzaj: 'wspolna_walka_barbarzyncy', strony: [0, 2], wygasaTura: 3, zawartaTura: 0, wspolnaWalkaBarbarzyncy: true });
ok(M.BARBARIAN_COOPERATION_RADIUS === 2 && M.BARBARIAN_COOPERATION_TURNS === 3, 'kontrakt ma promień 2 i długość 3 tur');
ok(M.hasBarbarianCooperationTreaty(deal, 0, 2) && M.hasBarbarianCooperationTreaty(deal, 2, 0), 'umowa jest obustronna');
ok(M.expireTreaties(deal, 2).length === 1 && M.expireTreaties(deal, 3).length === 0, 'umowa działa przez 3 tury i wygasa na granicy tury 3');
ok(M.hasAuthorizedBorderCrossing(2, 0, { treaties: deal, isMilitary: true, relation: { status: 'neutralni', zaufanie: 20, respekt: 30 } }), 'umowa autoryzuje przemarsz w kierunku partnera');
const near = u('near', 2, 2, 0);
const edge = u('edge', 2, 2, -1);
const far = u('far', 2, 3, 0);
const scout = u('scout', 2, 1, 0, { typeId: 'Zwiadowca', category: 'zwiadowca' });
const garrison = u('garrison', 2, 1, 1, { inGarnizon: true });
const engaged = u('engaged', 2, 0, 2);
const helpers = M.collectBarbarianCooperationUnits(0, 0, 0, [near, edge, far, scout, garrison, engaged], deal, new Set(['engaged']));
ok(helpers.map(x => x.id).join(',') === 'near,edge', 'dołączają tylko aktywne jednostki partnera w promieniu 2');
const playerHelper = u('player-helper', 0, 2, 0);
const aiBattleHelpers = M.collectBarbarianCooperationUnits(2, 2, 0, [playerHelper], deal, new Set());
ok(aiBattleHelpers.map(x => x.id).join(',') === 'player-helper', 'gracz może symetrycznie dołączyć do walki AI z barbarzyńcami');
ok(!M.isEligibleBarbarianCooperationUnit(scout) && !M.isEligibleBarbarianCooperationUnit(garrison), 'zwiadowca i garnizon są wykluczone');
ok(!M.isEligibleBarbarianCooperationUnit(engaged, new Set(['engaged'])), 'jednostka w bieżącej walce nie dołącza do drugiej');
const merged = M.mergeBattleRosterWithBarbarianCooperation([u('lead', 0, 0, 0), near], [near, edge]);
ok(merged.length === 3 && merged[2].id === 'edge', 'merge nie duplikuje jednostek');
console.log(`\\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
