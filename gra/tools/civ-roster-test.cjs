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
// RUNDA 3 (Evaluator R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA runda 2,
// warunek zamkniecia N-A, 2026-08-13): przy przepisaniu
// civ-configurator-opponent-test.cjs w rundzie 2 (40 -> 37 asercji, przejscie
// na testowanie computeClusters()/buildClusterStartPlan() zamiast martwej
// scieżki) zniknelo PRZY OKAZJI jedyne pokrycie preferredCivIds bezposrednio
// na pickActiveCivPool()/assignAiCivTypes() z civ-roster.ts -- ale ta funkcja
// NIE jest martwa: uzywa jej repairAiRosterFromMap() (naprawa sejwu z
// brakujacym ownerem) i restoreAiRosterFromSave() (galaz legacy wczytywania
// starych zapisow) w main.ts. Przywracamy 3 scenariusze z oryginalnego testu
// (git show f0baeacd -- gra/tools/civ-configurator-opponent-test.cjs),
// przeniesione tutaj bo to tutaj pickActiveCivPool jest juz bezposrednio
// bundlowana i testowana.
// / EN: rewriting civ-configurator-opponent-test.cjs in round 2 accidentally
// dropped the only coverage of preferredCivIds directly on
// pickActiveCivPool()/assignAiCivTypes() -- but that function is NOT dead:
// repairAiRosterFromMap() (save repair for a missing owner) and
// restoreAiRosterFromSave() (legacy load path) in main.ts still call it.
// Restoring the 3 scenarios from the original test, here because this file
// already bundles and tests pickActiveCivPool directly.
// ---------------------------------------------------------------------------
{
  // (b) fill-in: preferowanych mniej niz potrzeba -> reszta dobrana z puli
  // (deterministyczny fill-in z shuffle).
  const partial = M.pickActiveCivPool(ALL, 'rzymianie', 5, 6, 2, ['egipt']);
  assert(partial.length === 5, 'R3(b) fill-in: 5 typow mimo tylko 1 preferowanego (got ' + partial.length + ')');
  assert(partial.includes('egipt'), 'R3(b) fill-in: preferowany typ nadal obecny');
  assert(partial.includes('rzymianie'), 'R3(b) fill-in: gracz nadal obecny');
  assert(new Set(partial).size === partial.length, 'R3(b) fill-in: unikalne typy');
  const partial2 = M.pickActiveCivPool(ALL, 'rzymianie', 5, 6, 2, ['egipt']);
  assert(
    JSON.stringify(partial) === JSON.stringify(partial2),
    'R3(b) fill-in: deterministyczny (ten sam seed -> te same dobrane typy)',
  );

  // (c) silnik: pula obcieta do civTypesCount=3 mimo 5 preferowanych --
  // pierwsze (typesNeeded-1) w kolejnosci zaznaczenia, reszta odrzucona bez bledu.
  const tooMany = ['egipt', 'grecy', 'celtowie', 'hetyci', 'babilonia'];
  const poolCapped = M.pickActiveCivPool(ALL, 'rzymianie', 3, 6, 5, tooMany);
  assert(poolCapped.length === 3, 'R3(c) silnik: pula obcieta do civTypesCount=3 mimo 5 preferowanych (got ' + poolCapped.length + ')');
  assert(
    poolCapped.includes('egipt') && poolCapped.includes('grecy'),
    'R3(c) silnik: pierwsze preferowane zachowane w kolejnosci zaznaczenia (got ' + JSON.stringify(poolCapped) + ')',
  );
  assert(!poolCapped.includes('babilonia'), 'R3(c) silnik: nadmiarowe preferowane (5.) odrzucone bez bledu');
  assert(poolCapped.includes('rzymianie'), 'R3(c) silnik: gracz nadal w puli mimo obciecia');

  // (e) assignAiCivTypes: przypisany typ zawsze w puli epoki Kamienia, nawet
  // gdy preferredCivIds zawiera przestarzala preferencje spoza tej puli
  // (np. stare wybory z gry w epoce Zelaza po cofnieciu do Kamienia).
  const zelazoPool = M.civIdsAvailableAtGameEpoch(civs.cywilizacje, 'zelazo');
  const zelazoOnly = zelazoPool.find((id) => !kamienPool.includes(id));
  assert(!!zelazoOnly, 'R3(e) test setup: istnieje typ dostepny w Zelazie a nie w Kamieniu');

  const poolKamienWithStalePreferred = M.pickActiveCivPool(
    kamienPool, 'egipt', 5, 3, 42, ['egipt', zelazoOnly, 'grecy'],
  );
  assert(
    !poolKamienWithStalePreferred.includes(zelazoOnly),
    'R3(e) silnik: przestarzala preferencja spoza puli epoki odfiltrowana, brak wywalenia',
  );
  assert(poolKamienWithStalePreferred.includes('grecy'), 'R3(e) silnik: pozostala poprawna preferencja nadal dziala');

  const mapKamienPreferred = M.assignAiCivTypes({
    allCivIds: kamienPool,
    playerCivId: 'egipt',
    aiOwnerIds: [1, 2, 3],
    aktywneTypy: 4,
    seed: 555,
    preferredCivIds: ['grecy', zelazoOnly],
  });
  for (const id of mapKamienPreferred.values()) {
    assert(kamienPool.includes(id), 'R3(e) assignAiCivTypes: przypisany typ ' + id + ' zawsze w puli epoki Kamienia mimo preferredCivIds spoza puli');
  }
  assert([...mapKamienPreferred.values()].includes('grecy'), 'R3(e) assignAiCivTypes: poprawna preferencja (grecy) faktycznie przypisana');
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
