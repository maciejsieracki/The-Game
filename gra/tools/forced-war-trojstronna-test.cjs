'use strict';

/**
 * forced-war-trojstronna-test.cjs — R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1.
 *
 * PRZEPISANA od zera tą naprawą: dawne domino trójstronne (pickStoneForcedWarDominoOwnerIds/
 * pickBronzeForcedWarDominoOwnerIds/pickIronForcedWarDominoOwnerIds) zniknęło z trzech plików
 * epok, zastąpione JEDNĄ wspólną procedurą `assignForcedWarPairings` (forced-war-common.ts).
 * Kontrakt property-based/wielo-scenariuszowy (w tym inwariant binarny ECHO i odtworzenie
 * incydentu Rzymu) jest teraz w `tools/wojna-wymuszona-parowanie-test.cjs` — bramka
 * dedykowana temu tematowi. Ten plik zachowuje swoją TOŻSAMOŚĆ (allowlista: "istniejące
 * bramki do aktualizacji, NIE osłabiania") i weryfikuje DOKŁADNIE ten sam WYZWALACZ z
 * pierwotnego zgłoszenia właściciela ("Jeżeli jakaś cywilizacja ma już parę i z kimś walczy,
 * a gracz nie ma swojej pary do walki [...] chyba że jedną z nich łączy sojusz"), ale przez
 * REALNĄ ścieżkę silnika end-to-end: `assignForcedWarPairings` -> `decideAIDiplomacy` ->
 * komenda `wypowiedz_wojne` -- dokładnie tak, jak main.ts łączy te dwa kroki dziś.
 *
 * RÓŻNICA ZACHOWANIA vs stare domino (świadoma, z GOAL algorytmu ECHO): stare domino dawało
 * cel=gracz OBU stronom istniejącej pary naraz. Nowy algorytm (krok 4 ECHO: "wybierz parę,
 * gdzie żadna strona nie ma sojuszu z leftover") daje cel=gracz JEDNEJ, wybranej stronie —
 * gracz jako "leftover" dołącza do pary jako trzeci front, nie podwaja frontu obu członków.
 * Testy niżej dowodzą TEGO kształtu, nie starego.
 *
 * Uruchamianie z gra/: node tools/forced-war-trojstronna-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const entry = path.resolve(__dirname, '.forced-war-trojstronna-entry.ts');
const bundle = path.resolve(__dirname, '.forced-war-trojstronna-bundle.cjs');
fs.writeFileSync(entry, `
export { assignForcedWarPairings } from ${JSON.stringify(GRA_ROOT + '/src/game/forced-war-common')};
export { decideAIDiplomacy } from ${JSON.stringify(GRA_ROOT + '/src/game/ai')};
`, 'utf8');

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) passed++;
  else {
    failed++;
    console.error(`FAIL: ${message}`);
  }
}
function eq(actual, expected, message) {
  assert(actual === expected, `${message} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}

const hexDistance = (aq, ar, bq, br) => {
  const dq = aq - bq, dr = ar - br;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
};
const noBlock = () => false;

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
  const { assignForcedWarPairings, decideAIDiplomacy } = require(bundle);

  // GOAL 1 (WYZWALACZ dosłowny właściciela, świadomie ADAPTOWANY do nowego kształtu:
  // "wybrana strona pary", nie "obie strony naraz" -- patrz komentarz nagłówkowy):
  // para AI-A(2)/AI-B(3) już we wzajemnej wojnie, gracz BEZ pary (0 aktywnych wojen
  // wymuszonych) -> gracz staje się leftover jedynego triggered podmiotu w tym świecie
  // (nikt inny nie szuka celu) i dołącza jako trzeci do pary 2<->3.
  console.log('--- GOAL 1 (adaptacja): para AI-A/AI-B już aktywna, gracz bez pary -> gracz dołącza jako trzeci ---');
  {
    const pairAB = [{ attackerId: 2, targetId: 3, era: 'stone' }];
    const subjects = [{ ownerId: 0, q: 100, r: 100 }]; // gracz, JEDYNY triggered (warless) w tym świecie
    const result = assignForcedWarPairings(subjects, pairAB, {
      isPairBlocked: noBlock,
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: (id) => (id === 2 || id === 3 ? 1 : 0),
    });
    eq(result.unresolvedOwnerIds.length, 0, 'GOAL1: gracz rozwiązany (dołączył do pary)');
    eq(result.assignments.length, 1, 'GOAL1: DOKŁADNIE jeden wpis -- jedna, wybrana strona pary (nie obie naraz)');
    assert(
      result.assignments[0].ownerId === 2 || result.assignments[0].ownerId === 3,
      'GOAL1: strona akcji to członek istniejącej pary (2 lub 3)',
    );
    eq(result.assignments[0].targetId, 0, 'GOAL1: cel wpisu = gracz');
    eq(result.assignments[0].era, 'stone', 'GOAL1: era wpisu = era istniejącej pary (stone)');
  }

  // GOAL 2 / ECHO 2: sojusz JEDNEJ ze stron (napastnika) z graczem -> CAŁA para niedostępna
  // dla leftovera-gracza -> gracz zostaje unresolved (DECISION_REQUIRED w main.ts), skoro to
  // jedyna istniejąca para w tym świecie -- ŻADNA strona nie dostaje gracza jako celu.
  console.log('\n--- GOAL 2 / ECHO 2: sojusz strony-napastnika blokuje CAŁĄ parę dla leftovera-gracza ---');
  {
    const pairAB = [{ attackerId: 2, targetId: 3, era: 'stone' }];
    const subjects = [{ ownerId: 0, q: 100, r: 100 }];
    const result = assignForcedWarPairings(subjects, pairAB, {
      isPairBlocked: (a, b) => (a === 0 && b === 2) || (a === 2 && b === 0),
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: (id) => (id === 2 || id === 3 ? 1 : 0),
    });
    eq(result.assignments.length, 0, 'GOAL2: SEDNO -- zero wpisów, mechanizm się NIE uruchamia dla ŻADNEJ strony');
    eq(result.unresolvedOwnerIds.length, 1, 'GOAL2: gracz trafia do unresolvedOwnerIds (jedyna para zablokowana)');
  }

  // ECHO 2, wariant symetryczny: sojusz akurat strony-OBROŃCY (3), nie napastnika -- ECHO
  // dosłownie: "wybierz parę, gdzie ŻADNA strona nie ma sojuszu z leftover" -- blokada
  // KTÓREJKOLWIEK strony (nie tylko napastnika) wyklucza CAŁĄ parę, symetrycznie do GOAL 2
  // wyżej. Ta para jest JEDYNĄ w świecie, więc gracz zostaje nierozwiązany dokładnie jak przy
  // blokadzie napastnika.
  console.log('\n--- ECHO 2 (symetria): sojusz TYLKO obrońcy blokuje CAŁĄ parę identycznie jak sojusz napastnika ---');
  {
    const pairAB = [{ attackerId: 2, targetId: 3, era: 'stone' }];
    const subjects = [{ ownerId: 0, q: 100, r: 100 }];
    const result = assignForcedWarPairings(subjects, pairAB, {
      isPairBlocked: (a, b) => (a === 0 && b === 3) || (a === 3 && b === 0),
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: (id) => (id === 2 || id === 3 ? 1 : 0),
    });
    eq(result.assignments.length, 0, 'ECHO2-sym: SEDNO -- zero wpisów, sojusz obrońcy blokuje CAŁĄ parę tak samo jak napastnika');
    eq(result.unresolvedOwnerIds.length, 1, 'ECHO2-sym: gracz nierozwiązany (jedyna para zablokowana)');
  }

  // GOAL 5 / kryterium regresji fallbacku pojedynczego: gracz JUŻ ma aktywną wojnę wymuszoną
  // (nie jest warless) -> mechanizm w ogóle się nie uruchamia, nawet gdy istnieje aktywna
  // para AI-vs-AI bez sojuszu -- gracz nie trafia do triggeredSubjects w main.ts w ogóle
  // (main.ts sprawdza totalActiveForcedWarsByOwner(0)===0 PRZED dopisaniem do puli), co
  // odtwarzamy tu wprost NIE dodając gracza do subjects.
  console.log('\n--- GOAL 5: gracz ma już parę -> nie wchodzi do puli, mechanizm się nie uruchamia ---');
  {
    const pairAB = [{ attackerId: 2, targetId: 3, era: 'stone' }];
    const result = assignForcedWarPairings([], pairAB, {
      isPairBlocked: noBlock,
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: (id) => (id === 2 || id === 3 ? 1 : 0),
    });
    eq(result.assignments.length, 0, 'GOAL5: pusta pula triggered -> zero wpisów, brak dociążenia gracza');
    eq(result.unresolvedOwnerIds.length, 0, 'GOAL5: brak nierozwiązanych (nikt nie próbował)');
  }

  // Brak aktywnych par AI-vs-AI w ogóle, gracz warless, ale sam (bez partnera) -> unresolved,
  // zero efektu ubocznego, zero zgadywania.
  console.log('\n--- Brak jakiejkolwiek pary AI-vs-AI, gracz sam -> unresolved, zero efektu ubocznego ---');
  {
    const result = assignForcedWarPairings(
      [{ ownerId: 0, q: 0, r: 0 }], [],
      { isPairBlocked: noBlock, hexDistanceFn: hexDistance, totalActiveForcedWarsByOwner: () => 0 },
    );
    eq(result.assignments.length, 0, 'brak par: zero wpisów');
    eq(result.unresolvedOwnerIds.length, 1, 'brak par: gracz nierozwiązany (nic do dołączenia)');
  }

  // Wiele niezależnych par jednocześnie (dwie pary aktywne) + DWÓCH leftoverów (gracz + jedna
  // AI bez pary, jawnie zablokowani WZAJEMNIE tak, żeby nie sparowali się ze sobą w kroku 1-3
  // -- inaczej, jako jedyni dwaj warless, po prostu staliby się sobie nawzajem partnerem,
  // co jest POPRAWNYM zachowaniem [gracz traktowany DOKŁADNIE jak AI], ale nie testuje kroku
  // 4) -> obaj dostają przydział przez dołączenie do istniejących par.
  console.log('\n--- Dwie niezależne pary + dwóch (wzajemnie zablokowanych) leftoverów -> każdy dołącza do jakiejś pary ---');
  {
    const twoPairs = [
      { attackerId: 2, targetId: 3, era: 'bronze' },
      { attackerId: 4, targetId: 5, era: 'iron' },
    ];
    const subjects = [
      { ownerId: 0, q: 0, r: 0 },        // gracz, leftover
      { ownerId: 9, q: 200, r: 0, era: 'bronze' }, // AI bez pary, leftover
    ];
    const result = assignForcedWarPairings(subjects, twoPairs, {
      isPairBlocked: (a, b) => (a === 0 && b === 9) || (a === 9 && b === 0),
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: (id) => ([2, 3, 4, 5].includes(id) ? 1 : 0),
    });
    eq(result.unresolvedOwnerIds.length, 0, 'obaj leftoverzy rozwiązani (dołączyli do jednej z dwóch par)');
    eq(result.assignments.length, 2, 'dokładnie 2 wpisy -- jeden na leftover');
    const targetOf = new Map(result.assignments.map(a => [a.ownerId, a.targetId]));
    assert(targetOf.has(9), 'AI9 (leftover) dostaje własny wpis');
    const ai9Target = targetOf.get(9);
    assert([2, 3, 4, 5].includes(ai9Target), 'AI9 dołącza do jednej ze stron jednej z dwóch par');
    // Gracz-leftover: jego wpis to strona istniejącej pary (nie gracz sam), patrz GOAL1 wyżej.
    const playerJoinedActor = result.assignments.find(a => a.targetId === 0 && a.ownerId !== 9);
    assert(playerJoinedActor !== undefined, 'gracz-leftover dołączył -- jakaś strona pary dostała cel=gracz');
  }

  // Bezpiecznik defensywny: para z attackerId===targetId (dane wejściowe main.ts nie powinny
  // tego zawierać, ale funkcja czysta nie ufa wołającemu) -- odrzucona z existingActivePairs.
  console.log('\n--- Bezpiecznik: para z attackerId===targetId odrzucona (obrona w głąb) ---');
  {
    const degenerate = [{ attackerId: 5, targetId: 5, era: 'bronze' }];
    const result = assignForcedWarPairings(
      [{ ownerId: 0, q: 0, r: 0 }], degenerate,
      { isPairBlocked: noBlock, hexDistanceFn: hexDistance, totalActiveForcedWarsByOwner: () => 0 },
    );
    eq(result.assignments.length, 0, 'para zdegenerowana nie daje żadnego wpisu');
    eq(result.unresolvedOwnerIds.length, 1, 'gracz zostaje nierozwiązany (brak realnej pary do dołączenia)');
  }

  // ---------------------------------------------------------------------------
  // decideAIDiplomacy: finalny target guard, ŻYWA ścieżka silnika dla WPISU wygenerowanego
  // przez assignForcedWarPairings (nie ręcznie skonstruowanego) -- dowodzi, że wpis
  // {ownerId, era, targetId} faktycznie prowadzi do realnej komendy wypowiedz_wojne przez
  // dokładnie ten sam kanał co stary fallback pojedynczy/domino (main.ts wciąż ustawia
  // WYŁĄCZNIE bronze/stone/ironForceWarTargetId, ai.ts NIETKNIĘTY tą naprawą).
  // ---------------------------------------------------------------------------
  console.log('--- decideAIDiplomacy: finalny target guard, wpis wygenerowany przez assignForcedWarPairings ---');
  const relToPlayer = (extra = {}) => ({
    partnerId: '0',
    relation: { status: 'neutralny', zaufanie: 0, respekt: 50 },
    respektWzgledny: 0.5,
    stanWojny: false,
    ...extra,
  });
  const forcedFieldByEra = {
    stone: 'stoneForceWarTargetId',
    bronze: 'bronzeForceWarTargetId',
    iron: 'ironForceWarTargetId',
  };
  {
    const pairAB = [{ attackerId: 2, targetId: 3, era: 'stone' }];
    const subjects = [{ ownerId: 0, q: 100, r: 100 }];
    const result = assignForcedWarPairings(subjects, pairAB, {
      isPairBlocked: noBlock,
      hexDistanceFn: hexDistance,
      totalActiveForcedWarsByOwner: (id) => (id === 2 || id === 3 ? 1 : 0),
    });
    const winner = result.assignments[0]; // {ownerId, era: 'stone', targetId: 0}
    const forcedField = forcedFieldByEra[winner.era];
    const dominoCommand = (extraRel = {}) => decideAIDiplomacy({
      myPlayerId: String(winner.ownerId),
      relacje: [relToPlayer(extraRel)],
      agresja: 0.1,
      currentTurn: 30,
      [forcedField]: winner.targetId,
    });
    assert(
      dominoCommand().some(c => c.type === 'wypowiedz_wojne' && c.targetId === '0'),
      `wpis assignForcedWarPairings (ownerId=${winner.ownerId}, era=${winner.era}) generuje REALNĄ komendę wypowiedz_wojne na gracza przez decideAIDiplomacy`,
    );
    assert(
      !dominoCommand({ stanWojny: true }).some(c => c.type === 'wypowiedz_wojne'),
      'guard istniejący (gracz już w wojnie z tą stroną) nadal blokuje DOW mimo wpisu z nowego rdzenia',
    );
    assert(
      !dominoCommand({ relation: { status: 'sojusz', zaufanie: 0, respekt: 50 }, hasAllianceTreaty: true }).some(c => c.type === 'wypowiedz_wojne'),
      'sojusz gracz<->strona na poziomie ai.ts nadal blokuje DOW (obrona w głąb, niezależna od gate\'u main.ts)',
    );
  }

  console.log(`PASSED: ${passed} / FAILED: ${failed} / TOTAL: ${passed + failed}`);
  if (failed > 0) process.exitCode = 1;
} finally {
  for (const file of [entry, bundle]) {
    try { fs.unlinkSync(file); } catch {}
  }
}
