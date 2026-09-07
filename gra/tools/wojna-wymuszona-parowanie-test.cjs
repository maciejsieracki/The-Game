'use strict';
/**
 * wojna-wymuszona-parowanie-test.cjs — R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1.
 *
 * Bramka property-based/wielo-scenariuszowa dowodząca BINARNEGO kryterium ECHO właściciela,
 * dosłownie: "po przydziale nie może istnieć podmiot z zerem aktywnych wojen wymuszonych,
 * jeśli jednocześnie istnieje inny podmiot z dwiema lub więcej" -- dla WIELU układów
 * wejściowych (parzyste/nieparzyste liczby podmiotów, gracz wliczony, sojusze blokujące różne
 * pary, w tym scenariusz odtwarzający pierwotny incydent Rzymu z historii: sojusznik gracza
 * kończy BEZ ŻADNEJ wojny mimo istniejących par). Testuje bezpośrednio, przez esbuild,
 * `assignForcedWarPairings` z `forced-war-common.ts` -- ZERO reimplementacji formuły.
 *
 * Uruchamianie z gra/: node tools/wojna-wymuszona-parowanie-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const entry = path.resolve(__dirname, '.wojna-wymuszona-parowanie-entry.ts');
const bundle = path.resolve(__dirname, '.wojna-wymuszona-parowanie-bundle.cjs');
fs.writeFileSync(entry, `
export { assignForcedWarPairings, countActiveForcedWarsForOwner } from ${JSON.stringify(GRA_ROOT + '/src/game/forced-war-common')};
`, 'utf8');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) passed++;
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// Odległość taxicab na osiach osiowych (axial) heksów -- ta sama formuła co main.ts hexDistance.
const hexDistance = (aq, ar, bq, br) => {
  const dq = aq - bq, dr = ar - br;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
};

/** Buduje opts.isPairBlocked z listy jawnie zablokowanych par (nieuporządkowanych). */
function blockedPairsOpt(blockedPairs) {
  const key = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
  const blocked = new Set((blockedPairs || []).map(([a, b]) => key(a, b)));
  return (a, b) => blocked.has(key(a, b));
}

/**
 * SEDNO -- INWARIANT BINARNY (dosłownie z ECHO): po `assignForcedWarPairings`, licząc razem
 * assignments (nowe deklaracje TEJ tury) + istniejące aktywne wojny sprzed tury (activePairs
 * wejściowe, uwzględniające WSZYSTKICH podmiotów w scenariuszu, nie tylko triggeredSubjects),
 * NIE MOŻE istnieć podmiot z 0 aktywnych wojen wymuszonych, jeśli jednocześnie istnieje inny
 * podmiot z >=2 -- WŚRÓD podmiotów, którzy w tym scenariuszu w ogóle MIELI SZANSĘ dostać wojnę
 * (byli w triggeredSubjects LUB byli stroną existingActivePairs) i NIE zostali odłożeni do
 * unresolvedOwnerIds (ECHO: brzegowy przypadek "wszystkie pary zablokowane" jest jawnym
 * wyjątkiem, nie cichym naruszeniem -- test to sprawdza OSOBNO, patrz scenariusz 6).
 */
function assertNoZeroWhileOthersHaveTwoPlus(scenarioLabel, allOwnerIds, preExistingCountByOwner, result) {
  const finalCount = new Map(allOwnerIds.map(id => [id, preExistingCountByOwner(id)]));
  for (const a of result.assignments) {
    finalCount.set(a.ownerId, (finalCount.get(a.ownerId) || 0) + 1);
    finalCount.set(a.targetId, (finalCount.get(a.targetId) || 0) + 1);
  }
  const resolvedOwnerIds = allOwnerIds.filter(id => !result.unresolvedOwnerIds.includes(id));
  const zeroOwners = resolvedOwnerIds.filter(id => (finalCount.get(id) || 0) === 0);
  const twoPlusOwners = resolvedOwnerIds.filter(id => (finalCount.get(id) || 0) >= 2);
  assert(
    zeroOwners.length === 0 || twoPlusOwners.length === 0,
    `${scenarioLabel}: SEDNO -- podmiot(y) z zerem wojen [${zeroOwners.join(',')}] współistnieją `
    + `z podmiotem(ami) z >=2 wojnami [${twoPlusOwners.join(',')}] -- niedopuszczalne (rozwiązani, `
    + `nieodłożeni do unresolvedOwnerIds). Stan końcowy: ${JSON.stringify([...finalCount.entries()])}`,
  );
}

try {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: bundle,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
  const { assignForcedWarPairings, countActiveForcedWarsForOwner } = require(bundle);

  // =========================================================================
  // Scenariusz 1: PARZYSTA liczba podmiotów bez żadnej wojny, brak sojuszy -- wszyscy
  // parowani 1v1, zero trójkątów.
  // =========================================================================
  console.log('--- Scenariusz 1: 4 podmioty bez wojny (parzysta), brak blokad -- czysta parowanie 1v1 ---');
  {
    const subjects = [
      { ownerId: 1, q: 0, r: 0, era: 'bronze' },
      { ownerId: 2, q: 1, r: 0, era: 'bronze' },
      { ownerId: 3, q: 10, r: 0, era: 'stone' },
      { ownerId: 4, q: 11, r: 0, era: 'stone' },
    ];
    const result = assignForcedWarPairings(subjects, [], {
      isPairBlocked: blockedPairsOpt([]),
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: () => 0,
    });
    eq(result.unresolvedOwnerIds.length, 0, 'S1: brak nierozwiązanych');
    eq(result.assignments.length, 4, 'S1: 4 wpisy (2 pary, każda strona wpisuje własny cel)');
    const targetOf = new Map(result.assignments.map(a => [a.ownerId, a.targetId]));
    eq(targetOf.get(1), 2, 'S1: 1 najbliżej 2');
    eq(targetOf.get(2), 1, 'S1: 2 najbliżej 1 (symetrycznie)');
    eq(targetOf.get(3), 4, 'S1: 3 najbliżej 4');
    eq(targetOf.get(4), 3, 'S1: 4 najbliżej 3');
    assertNoZeroWhileOthersHaveTwoPlus('S1', [1, 2, 3, 4], () => 0, result);
  }

  // =========================================================================
  // Scenariusz 2: NIEPARZYSTA liczba podmiotów bez wojny -- reszta (leftover) DOŁĄCZA jako
  // trzeci do istniejącej pary, zamiast zostać bez wojny (krok 2 ECHO).
  // =========================================================================
  console.log('\n--- Scenariusz 2: 3 podmioty bez wojny (nieparzysta) + 1 istniejąca para -- leftover dołącza jako trzeci ---');
  {
    const subjects = [
      { ownerId: 1, q: 0, r: 0, era: 'bronze' },
      { ownerId: 2, q: 1, r: 0, era: 'bronze' },
      { ownerId: 5, q: 50, r: 0, era: 'iron' }, // leftover -- nikt inny wolny w puli
    ];
    const existingPairs = [{ attackerId: 3, targetId: 4, era: 'stone' }];
    const result = assignForcedWarPairings(subjects, existingPairs, {
      isPairBlocked: blockedPairsOpt([]),
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: (id) => (id === 3 || id === 4 ? 1 : 0),
    });
    eq(result.unresolvedOwnerIds.length, 0, 'S2: brak nierozwiązanych -- leftover 5 znalazł parę do dołączenia');
    const targetOf = new Map(result.assignments.map(a => [a.ownerId, a.targetId]));
    eq(targetOf.get(1), 2, 'S2: 1<->2 sparowani normalnie');
    eq(targetOf.get(2), 1, 'S2: 2<->1 symetrycznie');
    assert(targetOf.get(5) === 3 || targetOf.get(5) === 4, 'S2: SEDNO -- leftover (5) dołącza jako TRZECI do istniejącej pary 3<->4 (własny cel = jedna ze stron)');
    // Podmiot 5 NIE może zostać bez wojny -- to dokładnie ten scenariusz, który miałby paść
    // pod starym mechanizmem, gdyby 5 nie miał pary i nie było domina.
    assertNoZeroWhileOthersHaveTwoPlus(
      'S2', [1, 2, 3, 4, 5],
      (id) => (id === 3 || id === 4 ? 1 : 0),
      result,
    );
  }

  // =========================================================================
  // Scenariusz 3: sojusz blokuje JEDNĄ konkretną parę -- pozostali nadal parowani normalnie
  // (blokada nie rozlewa się na całą pulę).
  // =========================================================================
  console.log('\n--- Scenariusz 3: sojusz blokuje najbliższą parę -- wybór spada na kolejnego kandydata ---');
  {
    const subjects = [
      { ownerId: 1, q: 0, r: 0, era: 'bronze' },
      { ownerId: 2, q: 1, r: 0, era: 'bronze' }, // najbliżej 1, ale zablokowany sojuszem
      { ownerId: 3, q: 5, r: 0, era: 'stone' },
    ];
    const result = assignForcedWarPairings(subjects, [], {
      isPairBlocked: blockedPairsOpt([[1, 2]]),
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: () => 0,
    });
    const targetOf = new Map(result.assignments.map(a => [a.ownerId, a.targetId]));
    eq(targetOf.get(1), 3, 'S3: 1 pomija zablokowanego 2, wybiera 3');
    eq(targetOf.get(3), 1, 'S3: 3 symetrycznie wybiera 1');
    eq(result.unresolvedOwnerIds.length, 1, 'S3: 2 zostaje leftover (jedyny kandydat zablokowany, brak istniejących par do dołączenia)');
    eq(result.unresolvedOwnerIds[0], 2, 'S3: konkretnie owner 2 jest nierozwiązany (DECISION_REQUIRED w main.ts)');
  }

  // =========================================================================
  // Scenariusz 4 -- GRACZ (ownerId 0) traktowany DOKŁADNIE jak każde AI: wchodzi do puli,
  // parowany normalnie, ale NIGDY nie jest stroną akcji w wyniku (brak własnego mechanizmu).
  // =========================================================================
  console.log('\n--- Scenariusz 4: gracz w puli warless -- parowany jak AI, ale AI wypowiada wojnę NA gracza ---');
  {
    const subjects = [
      { ownerId: 0, q: 0, r: 0 }, // gracz -- BEZ pola era
      { ownerId: 7, q: 1, r: 0, era: 'iron' },
    ];
    const result = assignForcedWarPairings(subjects, [], {
      isPairBlocked: blockedPairsOpt([]),
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: () => 0,
    });
    eq(result.assignments.length, 1, 'S4: DOKŁADNIE jeden wpis -- gracz nigdy nie jest stroną akcji');
    eq(result.assignments[0].ownerId, 7, 'S4: strona akcji to AI (7)');
    eq(result.assignments[0].targetId, 0, 'S4: cel AI = gracz');
    eq(result.assignments[0].era, 'iron', 'S4: era wpisu = własna era AI (iron), nie gracza');
  }

  // =========================================================================
  // Scenariusz 5 -- GRACZ jako LEFTOVER (nieparzysta reszta): skoro gracz nie ma własnego
  // pola, to WYBRANA STRONA istniejącej pary dostaje cel=gracz (odwrotny kierunek niż AI-leftover).
  // =========================================================================
  console.log('\n--- Scenariusz 5: gracz jako leftover -- wybrana strona istniejącej pary atakuje gracza ---');
  {
    const subjects = [
      { ownerId: 0, q: 100, r: 0 }, // gracz, jedyny w puli warless -> leftover z definicji
    ];
    const existingPairs = [{ attackerId: 3, targetId: 4, era: 'bronze' }];
    const result = assignForcedWarPairings(subjects, existingPairs, {
      isPairBlocked: blockedPairsOpt([]),
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: (id) => (id === 3 || id === 4 ? 1 : 0),
    });
    eq(result.unresolvedOwnerIds.length, 0, 'S5: gracz-leftover rozwiązany (dołączył do pary 3<->4)');
    eq(result.assignments.length, 1, 'S5: dokładnie jeden wpis -- WYBRANA strona pary, nie gracz sam');
    assert(result.assignments[0].ownerId === 3 || result.assignments[0].ownerId === 4, 'S5: strona akcji to członek istniejącej pary (3 lub 4)');
    eq(result.assignments[0].targetId, 0, 'S5: cel = gracz');
  }

  // =========================================================================
  // Scenariusz 6 -- BRZEGOWY PRZYPADEK ECHO: WSZYSTKIE istniejące pary zablokowane sojuszem
  // dla leftover -> unresolvedOwnerIds (DECISION_REQUIRED), NIE zgadywanie.
  // =========================================================================
  console.log('\n--- Scenariusz 6 (brzegowy, ECHO): wszystkie pary zablokowane -- DECISION_REQUIRED, nie zgadywanie ---');
  {
    const subjects = [{ ownerId: 9, q: 0, r: 0, era: 'bronze' }]; // jedyny warless -> leftover
    const existingPairs = [
      { attackerId: 3, targetId: 4, era: 'bronze' },
      { attackerId: 5, targetId: 6, era: 'stone' },
    ];
    // 9 ma sojusz z KAŻDĄ stroną KAŻDEJ istniejącej pary -- żadna para nie jest dostępna.
    const result = assignForcedWarPairings(subjects, existingPairs, {
      isPairBlocked: blockedPairsOpt([[9, 3], [9, 4], [9, 5], [9, 6]]),
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: (id) => ([3, 4, 5, 6].includes(id) ? 1 : 0),
    });
    eq(result.assignments.length, 0, 'S6: SEDNO -- zero wpisów, funkcja NIE zgaduje którą blokadę zignorować');
    eq(result.unresolvedOwnerIds.length, 1, 'S6: owner 9 trafia do unresolvedOwnerIds');
    eq(result.unresolvedOwnerIds[0], 9, 'S6: konkretnie 9 -- main.ts zgłasza DECISION_REQUIRED, nie przydziela nic');
  }
  console.log('\n--- Scenariusz 6b: BRAK jakiejkolwiek istniejącej pary do dołączenia -- też unresolved, nie zgaduje ---');
  {
    const subjects = [{ ownerId: 9, q: 0, r: 0, era: 'bronze' }];
    const result = assignForcedWarPairings(subjects, [], {
      isPairBlocked: blockedPairsOpt([]),
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: () => 0,
    });
    eq(result.assignments.length, 0, 'S6b: zero wpisów');
    eq(result.unresolvedOwnerIds.length, 1, 'S6b: 9 nierozwiązany -- brak jakiejkolwiek pary do dołączenia');
  }

  // =========================================================================
  // Scenariusz 7 -- ODTWORZENIE INCYDENTU "RZYM BEZ WOJNY": sojusznik gracza (Rzym) NIE
  // dostaje zera wojen mimo że istnieją inne pary i gracz szuka celu. Odtwarza OBA
  // podejrzewane w dyspozycji mechanizmy naraz: (a) sojusz blokuje CAŁĄ istniejącą parę dla
  // leftover, (b) coordinated-pick per-owner mógł zwrócić null gdy wszyscy kandydaci zajęci.
  // Nowy algorytm: Rzym (sojusznik gracza) jest WŚRÓD triggeredSubjects (warless, szuka celu
  // po zakończeniu poprzedniej wojny), reszta puli zajęta -- Rzym staje się leftover, ale
  // JEDNA z istniejących par (NIEpowiązana z graczem/Rzymem) jest dostępna -- Rzym dołącza
  // do niej, NIE zostaje bez wojny.
  // =========================================================================
  console.log('\n--- Scenariusz 7: odtworzenie incydentu Rzymu -- sojusznik gracza NIE kończy z zerem wojen ---');
  {
    const RZYM = 42;
    const GRACZ = 0;
    const subjects = [
      { ownerId: RZYM, q: 0, r: 0, era: 'bronze' }, // Rzym, sojusznik gracza, szuka nowego celu
    ];
    // Istniejąca para AI-AI (2,3) NIEpowiązana z Rzymem ani graczem -- jedyna dostępna do dołączenia.
    const existingPairs = [{ attackerId: 2, targetId: 3, era: 'stone' }];
    const isPairBlocked = (a, b) => {
      // Rzym i gracz są sojusznikami -- ta para jest zablokowana WZAJEMNIE (nieistotne tu,
      // bo gracz nie jest w tym scenariuszu w ogóle triggered/warless -- ma już wojnę).
      if ((a === RZYM && b === GRACZ) || (a === GRACZ && b === RZYM)) return true;
      return false;
    };
    const result = assignForcedWarPairings(subjects, existingPairs, {
      isPairBlocked,
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: (id) => {
        if (id === RZYM) return 0; // Rzym właśnie skończył swoją wojnę, szuka nowej
        if (id === GRACZ) return 1; // gracz ma już aktywną wojnę wymuszoną gdzie indziej
        if (id === 2 || id === 3) return 1;
        return 0;
      },
    });
    eq(result.unresolvedOwnerIds.length, 0, 'S7: SEDNO -- Rzym NIE trafia do unresolved (dostaje wojnę)');
    eq(result.assignments.length, 1, 'S7: dokładnie jeden wpis -- Rzym dołącza do pary 2<->3');
    eq(result.assignments[0].ownerId, RZYM, 'S7: strona akcji to Rzym (własny mechanizm, leftover-AI)');
    assert(result.assignments[0].targetId === 2 || result.assignments[0].targetId === 3, 'S7: cel = jedna ze stron istniejącej pary (2 lub 3)');
    assertNoZeroWhileOthersHaveTwoPlus(
      'S7', [RZYM, 2, 3],
      (id) => (id === 2 || id === 3 ? 1 : 0),
      result,
    );
  }

  // =========================================================================
  // Scenariusz 8 -- WIĘKSZA populacja (7 podmiotów, mieszanka parzysta+nieparzysta w
  // podgrupach, jedna blokada) -- property-style sanity nad realistyczną skalą.
  // =========================================================================
  console.log('\n--- Scenariusz 8: 7 podmiotów bez wojny, jedna blokada -- inwariant globalny ---');
  {
    const subjects = [
      { ownerId: 1, q: 0, r: 0, era: 'bronze' },
      { ownerId: 2, q: 1, r: 0, era: 'bronze' },
      { ownerId: 3, q: 2, r: 0, era: 'stone' },
      { ownerId: 4, q: 20, r: 0, era: 'stone' },
      { ownerId: 5, q: 21, r: 0, era: 'iron' },
      { ownerId: 6, q: 40, r: 0, era: 'iron' },
      { ownerId: 7, q: 41, r: 0, era: 'bronze' },
    ];
    const result = assignForcedWarPairings(subjects, [], {
      isPairBlocked: blockedPairsOpt([[1, 2]]),
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: () => 0,
    });
    assertNoZeroWhileOthersHaveTwoPlus('S8', [1, 2, 3, 4, 5, 6, 7], () => 0, result);
    // Sanity dodatkowe: albo wszyscy 7 rozwiązani, albo dokładnie jeden nierozwiązany
    // (nieparzysta liczba, brak dodatkowych par do dołączenia poza samą pulą).
    assert(
      result.unresolvedOwnerIds.length <= 1,
      `S8: co najwyżej jeden nierozwiązany oczekiwany w tym układzie (dostano ${result.unresolvedOwnerIds.length})`,
    );
  }

  // =========================================================================
  // Scenariusz 9 -- countActiveForcedWarsForOwner, licznik pomocniczy (jednostkowo).
  // =========================================================================
  console.log('\n--- Scenariusz 9: countActiveForcedWarsForOwner -- licznik pomocniczy ---');
  {
    const pairs = [
      { attackerId: 1, targetId: 2 },
      { attackerId: 1, targetId: 0 },
      { attackerId: 3, targetId: 4 },
    ];
    eq(countActiveForcedWarsForOwner(1, pairs), 2, 'S9a: owner 1 występuje w 2 parach (attacker w obu)');
    eq(countActiveForcedWarsForOwner(0, pairs), 1, 'S9b: gracz (0) jako cel liczy się jako 1 aktywna wojna wymuszona');
    eq(countActiveForcedWarsForOwner(2, pairs), 1, 'S9c: owner 2 -- 1 wojna');
    eq(countActiveForcedWarsForOwner(99, pairs), 0, 'S9d: owner spoza żadnej pary -- 0');
  }

  // =========================================================================
  // Scenariusz 10 -- Runda 1, zarzut Evaluatora #2 (przyjęty, naprawiony w tej rundzie):
  // konstrukcja adwersaryjna z zapętloną strukturą blokad, gdzie zachłanne parowanie
  // "najbliższy nieblokowany kandydat, kolejność ownerId" zostawiało rozwiązywalny przypadek
  // bez pary. 4 podmioty {1,2,3,4} bez wojny, zablokowane pary {1-4, 2-3, 3-4} (dowolna
  // kombinacja NAP/sojuszu/cooldownu tej samej pary -- realistyczne w długiej rozgrywce, gdzie
  // `isPeaceLockedBetween` naturalnie akumuluje takie blokady). Istnieje pełne dopasowanie
  // {1-3, 2-4} (obie pary odblokowane) -- dokładny max-matching (DP na bitmasce) MUSI je
  // znaleźć, mimo że zachłanny algorytm paruje 1-2 jako pierwsze (najniższe ownerId, remis
  // dystansu) i zostawiał 3 oraz 4 bez pary.
  // =========================================================================
  console.log('\n--- Scenariusz 10 (zarzut Evaluatora R1 #2): blokady zapętlone -- max-matching znajduje {1-3,2-4}, nie zostawia 3 i 4 bez pary ---');
  {
    const subjects = [
      { ownerId: 1, q: 0, r: 0, era: 'bronze' },
      { ownerId: 2, q: 1, r: 0, era: 'bronze' },
      { ownerId: 3, q: 2, r: 0, era: 'bronze' },
      { ownerId: 4, q: 3, r: 0, era: 'bronze' },
    ];
    const result = assignForcedWarPairings(subjects, [], {
      isPairBlocked: blockedPairsOpt([[1, 4], [2, 3], [3, 4]]),
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: () => 0,
    });
    eq(result.unresolvedOwnerIds.length, 0, 'S10: brak nierozwiązanych -- pełne dopasowanie {1-3,2-4} istniało i zostało znalezione');
    eq(result.assignments.length, 4, 'S10: 4 wpisy (2 pary, każda strona wpisuje własny cel)');
    const targetOf = new Map(result.assignments.map(a => [a.ownerId, a.targetId]));
    eq(targetOf.get(1), 3, 'S10: 1 sparowany z 3 (jedyna para bez blokady dla 1)');
    eq(targetOf.get(3), 1, 'S10: 3 sparowany z 1 (symetrycznie)');
    eq(targetOf.get(2), 4, 'S10: 2 sparowany z 4 (jedyna para bez blokady dla 2)');
    eq(targetOf.get(4), 2, 'S10: 4 sparowany z 2 (symetrycznie)');
    assertNoZeroWhileOthersHaveTwoPlus('S10', [1, 2, 3, 4], () => 0, result);
  }

  console.log(`\nPASSED: ${passed} / FAILED: ${failed} / TOTAL: ${passed + failed}`);
  if (failed > 0) {
    console.log('SOME TESTS FAILED');
    process.exitCode = 1;
  } else {
    console.log('ALL GREEN');
  }
} finally {
  for (const file of [entry, bundle]) {
    try { fs.unlinkSync(file); } catch (e) { /* nieistotne */ }
  }
}
