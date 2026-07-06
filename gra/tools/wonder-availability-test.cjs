'use strict';
/** node tools/wonder-availability-test.cjs — bramka budowy cudów */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.wonder-availability-entry.ts');
const bundle = path.join(__dirname, '.wonder-availability-bundle.cjs');

fs.writeFileSync(entry, `
export {
  evaluateWonderBuildGate,
  listBuildableWondersForCiv,
  buildTechEpochMap,
} from '../src/game/wonder-availability';
export { getWondersForCiv } from '../src/game/wonders-data';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
const tech = require('../data/tech.json');
const civs = require('../data/civs.json');
const wonders = require('../data/wonders.json');

const techMap = M.buildTechEpochMap(tech.technologie ?? []);
const grecy = civs.cywilizacje.find(c => c.ikonaId === 'grecy');
const slowianie = civs.cywilizacje.find(c => c.ikonaId === 'slowianie');
const kolos = wonders.cuda.find(w => w.id === 'kolos');
const wyrocznia = wonders.cuda.find(w => w.id === 'wyrocznia');

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('wonder-availability-test\n');

const kolosEarly = M.evaluateWonderBuildGate({
  wonder: kolos,
  civType: 'grecy',
  civRow: grecy,
  playerEra: 2,
  unlockedTechs: new Set(['Inżynieria']),
  completedWonderIds: [],
  techMap,
});
assert(!kolosEarly.ok && kolosEarly.reasons.includes('era_too_early'), 'Kolos: epoka 2 za wcześnie (cud ep.3)');

const kolosOk = M.evaluateWonderBuildGate({
  wonder: kolos,
  civType: 'grecy',
  civRow: grecy,
  playerEra: 3,
  unlockedTechs: new Set(['Inżynieria']),
  completedWonderIds: [],
  techMap,
});
assert(kolosOk.ok, 'Kolos: epoka 3 + Inżynieria OK');

const perunWrongCiv = M.evaluateWonderBuildGate({
  wonder: wonders.cuda.find(w => w.id === 'posag_peruna'),
  civType: 'grecy',
  civRow: grecy,
  playerEra: 3,
  unlockedTechs: new Set(['Obróbka żelaza']),
  completedWonderIds: [],
  techMap,
});
assert(perunWrongCiv.reasons.includes('civ_not_exclusive'), 'Posąg Peruna: tylko Słowianie (E)');

const wyroczniaRace = M.evaluateWonderBuildGate({
  wonder: wyrocznia,
  civType: 'slowianie',
  civRow: slowianie,
  playerEra: 1,
  unlockedTechs: new Set(['Mistycyzm']),
  completedWonderIds: [],
  techMap,
});
assert(wyroczniaRace.ok, 'Wyrocznia R: Słowianie ep.1 + Mistycyzm OK');

const wyroczniaTaken = M.evaluateWonderBuildGate({
  wonder: wyrocznia,
  civType: 'egipt',
  civRow: civs.cywilizacje.find(c => c.ikonaId === 'egipt'),
  playerEra: 1,
  unlockedTechs: new Set(['Mistycyzm']),
  completedWonderIds: ['wyrocznia'],
  techMap,
});
assert(wyroczniaTaken.reasons.includes('already_built_world'), 'Wyrocznia: już zbudowana na świecie');

const grecyList = M.listBuildableWondersForCiv(
  M.getWondersForCiv('grecy'),
  'grecy',
  grecy,
  3,
  new Set(['Inżynieria', 'Mistycyzm', 'Żegluga']),
  [],
  techMap,
);
assert(grecyList.some(w => w.id === 'kolos'), 'Lista Grecy ep.3: zawiera Kolos');
assert(!grecyList.some(w => w.id === 'posag_peruna'), 'Lista Grecy: bez Posągu Peruna');

console.log('\nwonder-availability-test:', passed, 'passed,', failed, 'failed');
if (failed) process.exit(1);
