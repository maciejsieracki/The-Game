/**
 * R-WOJNA-EPOKA-SOJUSZ-NIE-BLOKUJE-Q1 (decyzja właściciela 2026-11-22): sojusz formalny NIE blokuje
 * parowania wojen epoki. Parowanie ma dobierać innych graczy AI do skutku; pary bez sojuszu
 * między stronami są preferowane; gdy pary brak -- fallback (dołączenie trzeciego / wolny cel).
 *
 * Część A -- PRAWDZIWY moduł (esbuild): game/forced-war-common.ts (assignForcedWarPairings).
 * Część B -- mutacja: przywrócenie dawnej blokady sojuszem musi dawać czerwony wynik.
 *
 * Uruchomienie (z katalogu gra/): node tools/era-war-pairing-alliance-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA_ROOT, 'src');
const bundle = path.resolve(__dirname, '.era-war-pairing-alliance-bundle.cjs');

let passed = 0;
let failed = 0;
const assert = (cond, label) => {
  if (cond) { passed++; console.log('  PASS: ' + label); }
  else { failed++; console.log('  FAIL: ' + label); }
};

let api;
try {
  esbuild.buildSync({
    entryPoints: [path.join(SRC, 'game', 'forced-war-common.ts')], bundle: true, platform: 'node',
    format: 'cjs', target: 'node18', outfile: bundle, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  api = require(bundle);
} catch (e) {
  console.error('  FAIL: nie udało się zbudować game/forced-war-common.ts:', e && e.message);
  failed++;
} finally {
  try { fs.unlinkSync(bundle); } catch (e) { /* nieistotne */ }
}

const dist = (aq, ar, bq, br) => Math.abs(aq - bq) + Math.abs(ar - br);
const subj = (ownerId, q, r, era = 'bronze') => ({ ownerId, q, r, era });
const keyPair = (a, b) => (a < b ? a + '-' + b : b + '-' + a);
const pairsOf = (assignments) => {
  const set = new Set();
  for (const a of assignments) if (a.targetId !== 0) set.add(keyPair(a.ownerId, a.targetId));
  return [...set].sort();
};

/** Zestaw sojuszy jako zbiór kluczy par. */
const alliancePredicate = (pairs) => {
  const s = new Set(pairs.map(([a, b]) => keyPair(a, b)));
  return (a, b) => s.has(keyPair(a, b));
};

const noBlock = () => false;

if (api) {
  const { assignForcedWarPairings } = api;

  console.log('--- A1: sojusz między wszystkimi dostępnymi parami NIE blokuje wojny epoki (dawniej pending) ---');
  {
    const subjects = [subj(1, 0, 0), subj(2, 1, 0)];
    const allied = alliancePredicate([[1, 2]]);
    const res = assignForcedWarPairings(subjects, [], {
      isPairBlocked: noBlock,
      isAllied: allied,
      hexDistanceFn: dist,
      totalActiveForcedWarsByOwner: () => 0,
    });
    assert(res.unresolvedOwnerIds.length === 0, 'A1: brak unresolved przy sojuszu 1-2');
    assert(
      res.assignments.length === 2
      && res.assignments.some(a => a.ownerId === 1 && a.targetId === 2)
      && res.assignments.some(a => a.ownerId === 2 && a.targetId === 1),
      'A1: sojusznicy 1-2 zawiązują wojnę epoki (obie strony wpisane)',
    );
  }

  console.log('--- A2: sojusze między WSZYSTKIMI parami -- parowanie do skutku (żaden podmiot bez pary) ---');
  {
    const subjects = [subj(1, 0, 0), subj(2, 1, 0), subj(3, 2, 0), subj(4, 3, 0)];
    const allied = alliancePredicate([[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]);
    const res = assignForcedWarPairings(subjects, [], {
      isPairBlocked: noBlock, isAllied: allied, hexDistanceFn: dist,
      totalActiveForcedWarsByOwner: () => 0,
    });
    assert(res.unresolvedOwnerIds.length === 0, 'A2: brak unresolved przy pełnym sojuszu (4 podmioty)');
    assert(res.assignments.length === 4, 'A2: 4 przydziały = 2 pary zawiązane');
  }

  console.log('--- A3: sojusz nie zostaje rozbity przez pusty zestaw par (fallback 1 wolny cel) ---');
  {
    const subjects = [subj(1, 0, 0)];
    const res = assignForcedWarPairings(subjects, [], {
      isPairBlocked: noBlock, isAllied: alliancePredicate([[1, 5]]), hexDistanceFn: dist,
      totalActiveForcedWarsByOwner: () => 0,
      freeTargetCandidates: [subj(5, 1, 0)],
    });
    assert(
      res.assignments.length === 1 && res.assignments[0].ownerId === 1 && res.assignments[0].targetId === 5,
      'A3: pojedynczy podmiot z sojuszniczym celem dostaje wolny cel (sojusz nie blokuje)',
    );
  }

  console.log('--- B1: preferencja par bez sojuszu, gdy istnieją (a parowanie wciąż maksymalne) ---');
  {
    // Sojusze 1-2 oraz 3-4. Dopasowania bez sojuszu: {1-3,2-4} albo {1-4,2-3}.
    const subjects = [subj(1, 0, 0), subj(2, 5, 0), subj(3, 1, 0), subj(4, 4, 0)];
    const allied = alliancePredicate([[1, 2], [3, 4]]);
    const run = () => assignForcedWarPairings(subjects, [], {
      isPairBlocked: noBlock, isAllied: allied, hexDistanceFn: dist,
      totalActiveForcedWarsByOwner: () => 0,
    });
    const res = run();
    const pairs = pairsOf(res.assignments);
    assert(res.unresolvedOwnerIds.length === 0, 'B1: wszyscy 4 sparowani');
    assert(
      pairs.length === 2 && pairs.every(p => !allied(...p.split('-').map(Number))),
      'B1: obie pary to pary bez sojuszu (' + pairs.join(', ') + ')',
    );
    const again = JSON.stringify(run());
    assert(again === JSON.stringify(res), 'B1: wynik deterministyczny (dwa wywołania identyczne)');
  }

  console.log('--- B2: gdy jedyny możliwy partner jest sojusznikiem -- para zawiązana (do skutku) ---');
  {
    const subjects = [subj(1, 0, 0), subj(2, 1, 0), subj(3, 9, 0)];
    // 1-2 sojusz, 3 bez sojuszu z nikim -- dopasowanie maks. = 1 para: wybór 1-3 albo 2-3 (bez sojuszu)
    const allied = alliancePredicate([[1, 2]]);
    const res = assignForcedWarPairings(subjects, [], {
      isPairBlocked: noBlock, isAllied: allied, hexDistanceFn: dist,
      totalActiveForcedWarsByOwner: () => 0,
    });
    const pairs = pairsOf(res.assignments);
    assert(pairs.length === 1 && !pairs.includes('1-2'), 'B2: para bez sojuszu wybrana zamiast sojuszniczej (' + pairs.join(',') + ')');
    assert(res.unresolvedOwnerIds.length === 1, 'B2: jeden podmiot (leftover) bez pary w puli 1v1 (fallback przy istniejących parach/celach)');
  }

  console.log('--- C1: fallback po trzech -- nieparzysta reszta dołącza do istniejącej pary (dowolnej epoki) ---');
  {
    const subjects = [subj(1, 0, 0), subj(2, 1, 0), subj(3, 8, 0)];
    const res = assignForcedWarPairings(subjects, [{ attackerId: 6, targetId: 7, era: 'bronze' }], {
      isPairBlocked: noBlock, isAllied: alliancePredicate([[3, 6]]), hexDistanceFn: dist,
      totalActiveForcedWarsByOwner: () => 0,
    });
    const joined = res.assignments.find(a => a.ownerId === 3);
    assert(res.unresolvedOwnerIds.length === 0, 'C1: brak unresolved (trzeci dołączony)');
    // Jedyna para (6-7) ma sojusznika 6 z leftover 3 -- dozwolone (sojusz nie blokuje); cel = niższy
    // ownerId pary (dawna konwencja tie-breaku "chosenSide = min"), czyli 6.
    assert(joined && joined.targetId === 6, 'C1: trzeci (3) dołącza do jedynej pary 6-7 mimo sojuszu 3-6 (sojusz nie blokuje); cel = min(6,7)=6');
  }

  console.log('--- C2: fallback po trzech przy braku par -- wolny cel, a gdy go też brak -- DECISION_REQUIRED ---');
  {
    const res1 = assignForcedWarPairings([subj(3, 0, 0)], [], {
      isPairBlocked: noBlock, hexDistanceFn: dist,
      totalActiveForcedWarsByOwner: () => 0,
      freeTargetCandidates: [subj(9, 2, 0)],
    });
    assert(
      res1.assignments.length === 1 && res1.assignments[0].targetId === 9 && res1.unresolvedOwnerIds.length === 0,
      'C2a: brak par -> wolny cel (9) z istniejącej reguły fallbacku',
    );
    const res2 = assignForcedWarPairings([subj(3, 0, 0)], [], {
      isPairBlocked: noBlock, hexDistanceFn: dist,
      totalActiveForcedWarsByOwner: () => 0,
    });
    assert(res2.assignments.length === 0 && res2.unresolvedOwnerIds.join() === '3', 'C2b: brak par i brak wolnego celu -> unresolved (nie zgadujemy)');
  }

  console.log('--- D1: mutacja -- przywrócenie dawnej blokady sojuszem MUSI dać czerwony wynik ---');
  {
    const subjects = [subj(1, 0, 0), subj(2, 1, 0)];
    const allied = alliancePredicate([[1, 2]]);
    // Mutant: dawna reguła (sojusz jako isPairBlocked). Oczekujemy, że asercja A1 zawiedzie.
    const mutant = assignForcedWarPairings(subjects, [], {
      isPairBlocked: allied, isAllied: allied, hexDistanceFn: dist,
      totalActiveForcedWarsByOwner: () => 0,
    });
    const mutantRed = mutant.assignments.length !== 2;
    assert(mutantRed, 'D1: MUTACJA (blokada sojuszem przywrócona) daje czerwony wynik: assignments=' + mutant.assignments.length + ', unresolved=' + mutant.unresolvedOwnerIds.join());
  }
} else {
  failed++;
}

console.log(`\nera-war-pairing-alliance-test: ${passed} pass, ${failed} fail`);
if (failed > 0) process.exitCode = 1;
