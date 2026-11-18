'use strict';
// Reprodukcja (R-WEB-AI-SIEGE-RELIEF-ATTACK-BESIEGERS-Q1): komendy AI przy obleganym miescie.
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const S = require('./ai-war-defend-home-sim.cjs');
const entry = path.resolve(__dirname, '.sr-repro-entry.ts');
const bundle = path.resolve(__dirname, '.sr-repro-bundle.cjs');
const J = (p) => JSON.stringify(path.join(GRA_ROOT, 'src', p));
fs.writeFileSync(entry, `
export { decideAITurn } from ${J('game/ai')};
export { setArmyConsolidationOverride } from ${J('game/army-consolidation')};
export { setWarAllInCapitalOverride } from ${J('game/warAllInCapital')};
export { setHomeWarDefenseOverride, resetHomeWarMemory } from ${J('game/ai-war-home-defense')};
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, absWorkingDir: GRA_ROOT, logLevel: 'silent' });
const E = require(bundle);
E._files = [entry, bundle];
const six = (q, r) => [[q, r], [q, r + 1], [q + 1, r], [q + 1, r + 1], [q, r - 1], [q + 1, r - 1]];
function build(siege, aq) {
  const cities = [S.mkCity('a1', 1, 4, 10), S.mkCity('a2', 1, 5, 15), S.mkCity('b1', 2, 36, 10), S.mkCity('b2', 2, 35, 15)];
  if (siege) { cities[0].oblegane = true; cities[0].oblegajacyOwnerId = 2; }
  const ai = [...six(aq, 10), [aq, 12], [aq + 1, 12], [aq - 1, 12], [aq, 8]].map((p, i) => S.mkUnit('a' + i, 1, p[0], p[1]));
  const en = [[5, 10], [5, 11]].map((p, i) => S.mkUnit('b' + i, 2, p[0], p[1]));
  return { units: [...ai, ...en], cities, map: S.makeMap(40, 20) };
}
function cmds(s) {
  E.setArmyConsolidationOverride(true); E.setWarAllInCapitalOverride(true); E.setHomeWarDefenseOverride(true);
  E.resetHomeWarMemory();
  for (const u of s.units) u.ruchLeft = u.ruch;
  const opts = { canEngageOwner: t => t === 2, hasContactWith: () => true, currentTurn: 1,
    warAllIn: { targets: [{ ownerId: 2, cityId: 'b1', q: 36, r: 10 }] }, capitalCityId: 'a1', atWarWithCiv: true };
  return E.decideAITurn(1, s.units, s.cities, s.map, S.DATA, opts).filter(c => c.type === 'move' || c.type === 'attack');
}
for (const aq of [6, 3, 2, 8]) {
  for (const siege of [false, true]) {
    console.log('== armia q=' + aq + ' oblegane=' + siege);
    for (const c of cmds(build(siege, aq))) console.log(JSON.stringify(c));
  }
}
S.cleanup(E);
