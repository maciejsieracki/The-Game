'use strict';
/** node tools/civ-roster-test.cjs — E1-D-Q1=A roster startowy */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.civ-roster-entry.ts');
const bundle = path.join(__dirname, '.civ-roster-bundle.cjs');

fs.writeFileSync(entry, `
export {
  assignAiCivTypes,
  pickActiveCivPool,
  civIdsFromRoster,
  civIdsAvailableAtGameEpoch,
  rotatePreferredForRepairSeed,
} from '../src/game/civ-roster';
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
const civs = require('../data/civs.json');
const ALL = M.civIdsFromRoster(civs.cywilizacje);

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('civ-roster-test (E1-D-Q1=A)\n');

assert(ALL.length === 15, 'roster ma 15 ikonaId');

const poolSmall = M.pickActiveCivPool(ALL, 'rzymianie', 3, 2, 42);
assert(poolSmall.length === 3, 'mala: 3 typy (gracz+2 AI cap)');
assert(poolSmall.includes('rzymianie'), 'mala: zawiera nacje gracza');
assert(new Set(poolSmall).size === poolSmall.length, 'mala: unikalne typy');

const poolStd = M.pickActiveCivPool(ALL, 'grecy', 7, 6, 99);
assert(poolStd.length === 7, 'standard: 7 typow przy 6 AI');
assert(new Set(poolStd).size === 7, 'standard: 7 unikalnych');

const map1 = M.assignAiCivTypes({
  allCivIds: ALL,
  playerCivId: 'rzymianie',
  aiOwnerIds: [1, 2, 3, 4, 5, 6],
  aktywneTypy: 7,
  seed: 12345,
});
const map2 = M.assignAiCivTypes({
  allCivIds: ALL,
  playerCivId: 'rzymianie',
  aiOwnerIds: [1, 2, 3, 4, 5, 6],
  aktywneTypy: 7,
  seed: 12345,
});
assert(JSON.stringify([...map1]) === JSON.stringify([...map2]), 'deterministyczny seed');

const assigned = [...map1.values()];
assert(!assigned.includes('rzymianie'), 'AI nie dostaje typu gracza');
assert(new Set(assigned).size === assigned.length, 'AI: unikalne typy');

const mapFew = M.assignAiCivTypes({
  allCivIds: ALL,
  playerCivId: 'inkowie',
  aiOwnerIds: [1, 2],
  aktywneTypy: 7,
  seed: 7,
});
assert(mapFew.size === 2, '2 AI -> 2 wpisy');
const poolFew = M.pickActiveCivPool(ALL, 'inkowie', 7, 2, 7);
assert(poolFew.length === 3, '4 AI slotow ale tylko 2 AI -> 3 typy na mapie');

const kamienPool = M.civIdsAvailableAtGameEpoch(civs.cywilizacje, 'kamien');
const mapKamien = M.assignAiCivTypes({
  allCivIds: kamienPool,
  playerCivId: 'egipt',
  aiOwnerIds: [1, 2, 3],
  aktywneTypy: 4,
  seed: 555,
});
for (const id of mapKamien.values()) {
  assert(kamienPool.includes(id), 'AI roster filtrowany po epoce Kamienia: ' + id);
}

// ---------------------------------------------------------------------------
// N1 (Evaluator R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA runda 2, 2026-08-13):
// rotatePreferredForRepairSeed — repairAiRosterFromMap() z 1 brakującym ownerem
// nie może zawsze kolapsować do preferredValid[0].
// ---------------------------------------------------------------------------
{
  const preferred = ['egipt', 'grecy', 'celtowie', 'hetyci'];
  assert(
    JSON.stringify(M.rotatePreferredForRepairSeed([], 1)) === '[]',
    'N1: pusta preferencja -> pusta (no-op)',
  );
  assert(
    JSON.stringify(M.rotatePreferredForRepairSeed(['egipt'], 999)) === JSON.stringify(['egipt']),
    'N1: 1 preferowany -> bez rotacji (nic do rotowania)',
  );

  // Różne seedy repairu (np. różni brakujący ownerowie) NIE zawsze dają index 0
  // jako pierwszy element rotowanej listy — bez tego repair z 1 slotem zawsze
  // brałby preferredValid[0] (kolaps różnorodności, N1).
  const firstElements = new Set();
  for (let seed = 0; seed < 40; seed++) {
    const rotated = M.rotatePreferredForRepairSeed(preferred, seed);
    assert(rotated.length === preferred.length, `N1: rotacja zachowuje długość (seed=${seed})`);
    assert(
      new Set(rotated).size === preferred.length
        && preferred.every(id => rotated.includes(id)),
      `N1: rotacja to permutacja tego samego zbioru (seed=${seed})`,
    );
    firstElements.add(rotated[0]);
  }
  assert(
    firstElements.size > 1,
    'N1: pierwszy element rotowanej listy różni się między seedami (got ' +
      JSON.stringify([...firstElements]) + ') — bez tego repair 1-ownera zawsze bierze preferredValid[0]',
  );

  // Deterministyczność: ten sam seed -> ta sama rotacja.
  assert(
    JSON.stringify(M.rotatePreferredForRepairSeed(preferred, 17))
      === JSON.stringify(M.rotatePreferredForRepairSeed(preferred, 17)),
    'N1: deterministyczna rotacja (ten sam seed -> ten sam wynik)',
  );

  // Integracja z assignAiCivTypes: 1 brakujący owner + preferencje > needOthers=1
  // -> różne seedy repairu dają różne przypisane typy (nie zawsze preferred[0]).
  const kamienPool = M.civIdsAvailableAtGameEpoch(civs.cywilizacje, 'braz');
  const assignedFirsts = new Set();
  for (let seed = 0; seed < 40; seed++) {
    const rotated = M.rotatePreferredForRepairSeed(preferred, seed);
    const map1owner = M.assignAiCivTypes({
      allCivIds: kamienPool,
      playerCivId: 'rzymianie',
      aiOwnerIds: [99],
      aktywneTypy: 5,
      seed,
      preferredCivIds: rotated,
    });
    assignedFirsts.add(map1owner.get(99));
  }
  assert(
    assignedFirsts.size > 1,
    'N1: assignAiCivTypes z 1 brakującym ownerem + rotatePreferredForRepairSeed -> ' +
      'różnorodność przypisań między seedami (got ' + JSON.stringify([...assignedFirsts]) +
      '), NIE zawsze preferred[0]="egipt"',
  );
}

console.log('\nciv-roster-test:', passed, 'passed,', failed, 'failed');
if (failed) process.exit(1);
