'use strict';

/**
 * R-DYPLO-AI-WOJNA-TROJSTRONNA-Q1 — test czystego kontraktu domina trójstronnej wojny
 * wymuszonej (rozszerzenie R-DYPLO-AI-WOJNA-Z-GRACZEM-PARZYSTOSC-Q1).
 *
 * WYZWALACZ (dosłownie): "Jeżeli jakaś cywilizacja ma już parę i z kimś walczy, a gracz nie
 * ma swojej pary do walki — obie cywilizacje, które ze sobą walczą, wypowiadają jednocześnie
 * wojnę graczowi [...] chyba że jedną z nich łączy sojusz."
 *
 * Testuje bezpośrednio `pickStoneForcedWarDominoOwnerIds` / `pickBronzeForcedWarDominoOwnerIds`
 * / `pickIronForcedWarDominoOwnerIds` z realistycznym kształtem wejścia (para AI-A/AI-B już
 * aktywna, callback sojuszu z graczem, flaga "gracz ma już parę") — to jest "żywa symulacja"
 * dokładnie opisanego scenariusza wymagana przez regułę przeciw samooszukiwaniu dispatchu:
 * PARA WYMUSZONA + GRACZ BEZ PARY, osobno Z i BEZ sojuszu.
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
export { pickStoneForcedWarDominoOwnerIds } from ${JSON.stringify(GRA_ROOT + '/src/game/forced-war-stone')};
export { pickBronzeForcedWarDominoOwnerIds } from ${JSON.stringify(GRA_ROOT + '/src/game/forced-war-bronze')};
export { pickIronForcedWarDominoOwnerIds } from ${JSON.stringify(GRA_ROOT + '/src/game/forced-war-iron')};
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
function setEq(actual, expectedArr, message) {
  const a = [...actual].sort((x, y) => x - y);
  const e = [...expectedArr].sort((x, y) => x - y);
  deepEqArr(a, e, message);
}
function deepEqArr(a, e, message) {
  assert(JSON.stringify(a) === JSON.stringify(e), `${message} (got ${JSON.stringify(a)}, want ${JSON.stringify(e)})`);
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
  const {
    pickStoneForcedWarDominoOwnerIds,
    pickBronzeForcedWarDominoOwnerIds,
    pickIronForcedWarDominoOwnerIds,
  } = require(bundle);

  const noAlliance = () => false;

  // Uruchom identyczny zestaw scenariuszy na wszystkich trzech epokach — funkcja jest
  // celowo zduplikowana 1:1 per era (jak reszta pliku), więc kontrakt musi być identyczny.
  const eras = [
    ['Kamień', pickStoneForcedWarDominoOwnerIds],
    ['Brąz', pickBronzeForcedWarDominoOwnerIds],
    ['Żelazo', pickIronForcedWarDominoOwnerIds],
  ];

  for (const [nazwa, pickDomino] of eras) {
    console.log(`--- ${nazwa}: domino trójstronnej wojny wymuszonej (GOAL 1/2/4/5) ---`);

    // GOAL 1: para AI-A(2)/AI-B(3) już we wzajemnej wojnie wymuszonej, gracz BEZ pary
    // (playerAlreadyHasActiveForcedWar=false) — ŻYWA SYMULACJA dokładnie opisanego
    // scenariusza. Kryterium 1: OBIE strony w wyniku, w JEDNYM wywołaniu (jedna "tura").
    const pairAB = [{ attackerId: 2, targetId: 3 }];
    const resultNoAlliance = pickDomino(pairAB, {
      playerAlreadyHasActiveForcedWar: false,
      hasAllianceWithPlayer: noAlliance,
    });
    setEq(resultNoAlliance, [2, 3], `${nazwa}: para bez sojuszu + gracz bez pary -> OBIE strony jednocześnie (GOAL 1, kryterium 1)`);

    // GOAL 2 / ECHO 2: identyczna sytuacja, ale AI-A (2) ma aktywny sojusz z graczem ->
    // mechanizm się NIE uruchamia dla ŻADNEJ ze stron (kryterium 2).
    const resultAllianceAttacker = pickDomino(pairAB, {
      playerAlreadyHasActiveForcedWar: false,
      hasAllianceWithPlayer: (oid) => oid === 2,
    });
    setEq(resultAllianceAttacker, [], `${nazwa}: sojusz strony-napastnika (2) z graczem blokuje CAŁĄ parę, nie tylko tę stronę (GOAL 2, kryterium 2)`);

    // ECHO 2: sojusz akurat strony-obrońcy (3), nie napastnika -- też blokuje całość.
    const resultAllianceDefender = pickDomino(pairAB, {
      playerAlreadyHasActiveForcedWar: false,
      hasAllianceWithPlayer: (oid) => oid === 3,
    });
    setEq(resultAllianceDefender, [], `${nazwa}: sojusz strony-obrońcy (3) z graczem TEŻ blokuje całą parę (ECHO 2: "KTÓRAKOLWIEK ze stron")`);

    // GOAL 5 / kryterium 3 (regresja fallbacku pojedynczego): gracz ma JUŻ aktywną wojnę
    // wymuszoną (parę) -> mechanizm w ogóle się nie uruchamia, nawet gdy istnieje aktywna
    // para AI-vs-AI bez sojuszu.
    const resultPlayerAlreadyPaired = pickDomino(pairAB, {
      playerAlreadyHasActiveForcedWar: true,
      hasAllianceWithPlayer: noAlliance,
    });
    setEq(resultPlayerAlreadyPaired, [], `${nazwa}: gracz ma już parę -> domino się nie uruchamia (GOAL 5, brak podwójnego dociążenia)`);

    // Brak aktywnych par AI-vs-AI w ogóle -> wynik pusty, zero efektu ubocznego.
    setEq(pickDomino([], { playerAlreadyHasActiveForcedWar: false, hasAllianceWithPlayer: noAlliance }), [], `${nazwa}: brak aktywnych par AI-vs-AI -> wynik pusty`);

    // Wiele niezależnych par jednocześnie (parzysta liczba AI, kilka par na raz) -> WSZYSTKIE
    // kwalifikujące się strony trafiają do wyniku w jednym wywołaniu.
    const twoPairs = [{ attackerId: 2, targetId: 3 }, { attackerId: 4, targetId: 5 }];
    setEq(
      pickDomino(twoPairs, { playerAlreadyHasActiveForcedWar: false, hasAllianceWithPlayer: noAlliance }),
      [2, 3, 4, 5],
      `${nazwa}: dwie niezależne pary jednocześnie -> wszystkie 4 strony w jednym wyniku`,
    );

    // Bezpiecznik defensywny: para z targetId=gracz (0) lub attackerId===targetId (dane
    // wejściowe nie powinny tego zawierać po filtrze main.ts, ale funkcja czysta nie ufa
    // wołającemu) -- nie wchodzi do wyniku.
    const degenerate = [{ attackerId: 2, targetId: 0 }, { attackerId: 5, targetId: 5 }];
    setEq(
      pickDomino(degenerate, { playerAlreadyHasActiveForcedWar: false, hasAllianceWithPlayer: noAlliance }),
      [],
      `${nazwa}: para z graczem jako celem lub attacker===target jest odrzucana przez samą funkcję (obrona w głąb)`,
    );
  }

  console.log(`PASSED: ${passed} / FAILED: ${failed} / TOTAL: ${passed + failed}`);
  if (failed > 0) process.exitCode = 1;
} finally {
  for (const file of [entry, bundle]) {
    try { fs.unlinkSync(file); } catch {}
  }
}
