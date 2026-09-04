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
    decideAIDiplomacy,
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

  // Antycypowany zarzut własny, runda 1 (główny, blokujący): dotychczasowe testy powyżej
  // ćwiczyły WYŁĄCZNIE izolowaną, czystą funkcję pickXForcedWarDominoOwnerIds z ręcznie
  // skonstruowanymi zbiorami wynikowymi -- nie dowodziły, że OBIE strony pary faktycznie
  // WYPOWIADAJĄ WOJNĘ przez prawdziwą ścieżkę silnika. Sekcja niżej jest analogiczna do
  // "decideAIDiplomacy: finalny target guard" w forced-war-stone-test.cjs (linie ok.
  // 241-259): woła REALNY decideAIDiplomacy() z ustawionym x[Era]ForceWarTargetId=0
  // (dokładnie tak, jak main.ts robi to w `ownerLoop` po `if (xDominoOwnerIds.has(ownerId))
  // { xForceWarTargetId = 0; }`) i sprawdza wygenerowaną komendę wypowiedz_wojne DLA
  // KAŻDEJ STRONY PARY Z OSOBNA -- attackerId(2) i targetId(3) -- bo main.ts przetwarza
  // każdego ownera w OSOBNYM wywołaniu decideAIDiplomacy wewnątrz tej samej `ownerLoop`
  // (patrz main.ts ok. L28814-29824); to domino zapewnia jedynie, że OBIE strony DOSTAJĄ
  // ten sam docelowy wpis w TEJ SAMEJ turze (main-guard test niżej), a niniejszy blok
  // dowodzi, że każda z nich, dostawszy go, faktycznie generuje DOW na gracza (partnerId
  // '0') tą samą, niezmienioną ścieżką ai.ts co istniejący fallback pojedynczy.
  console.log('--- decideAIDiplomacy: finalny target guard, OBIE strony pary domina (antycypowany zarzut własny, runda 1) ---');
  const relToPlayer = (extra = {}) => ({
    partnerId: '0',
    relation: { status: 'neutralny', zaufanie: 0, respekt: 50 },
    respektWzgledny: 0.5,
    stanWojny: false,
    ...extra,
  });
  const forcedFieldByEra = {
    Kamień: 'stoneForceWarTargetId',
    Brąz: 'bronzeForceWarTargetId',
    Żelazo: 'ironForceWarTargetId',
  };
  for (const [nazwa] of eras) {
    const forcedField = forcedFieldByEra[nazwa];
    const dominoCommand = (myPlayerId, extraRel = {}) => decideAIDiplomacy({
      myPlayerId,
      relacje: [relToPlayer(extraRel)],
      agresja: 0.1,
      currentTurn: 30,
      [forcedField]: 0,
    });
    // Strona-napastnik (attackerId=2 z pairAB wyżej) dostaje xForceWarTargetId=0 ->
    // generuje wypowiedz_wojne na gracza, tak samo jak strona-obrońca (targetId=3).
    assert(
      dominoCommand('2').some(c => c.type === 'wypowiedz_wojne' && c.targetId === '0'),
      `${nazwa}: attackerId(2) z ${forcedField}=0 (wpisane przez domino) generuje realną komendę wypowiedz_wojne na gracza`,
    );
    assert(
      dominoCommand('3').some(c => c.type === 'wypowiedz_wojne' && c.targetId === '0'),
      `${nazwa}: targetId(3) z ${forcedField}=0 (wpisane przez domino) TEŻ generuje realną komendę wypowiedz_wojne na gracza -- OBIE strony, nie tylko jedna`,
    );
    // Guardy istniejące na stronie gracza (cel) nadal obowiązują -- domino nie omija ich,
    // tylko zasila ten sam kanał co dotychczasowy fallback pojedynczy.
    assert(
      !dominoCommand('2', { stanWojny: true }).some(c => c.type === 'wypowiedz_wojne'),
      `${nazwa}: gracz już w wojnie z attackerId(2) -> guard istniejący nadal blokuje DOW mimo domina`,
    );
    assert(
      !dominoCommand('3', { relation: { status: 'sojusz', zaufanie: 0, respekt: 50 }, hasAllianceTreaty: true }).some(c => c.type === 'wypowiedz_wojne'),
      `${nazwa}: sojusz gracz<->targetId(3) na poziomie ai.ts nadal blokuje DOW (obrona w głąb, niezależna od gate'u domina w main.ts)`,
    );

    // Antycypowany zarzut własny (poboczny, runda 1 -- "zbadaj reconem/testem, NIE naprawiaj"):
    // main.ts (ok. L29171) buduje `relacje[].partnerId==='0'` DLA OWNERA WYŁĄCZNIE gdy
    // `diplomaticallyDiscoveredOwners.has(ownerId)` (gracz odkrył go na mapie/przez
    // audiencję) -- gdy owner NIE jest odkryty, `relacje` w ogóle nie niesie wpisu
    // partnerId='0' i finalny target guard w ai.ts (linie ok. 4324-4339, `forcedRel =
    // inp.relacje.find(...)` -> undefined -> `if` fałszywy) CICHO pomija całą gałąź -- BEZ
    // komendy, BEZ loga -- mimo że domino w main.ts już wpisało xForceWarTargetId=0. Test
    // niżej DOWODZI tej interakcji na realnej ścieżce silnika (relacje=[], brak wpisu
    // partnerId='0', dokładnie stan "owner nieodkryty"): to PRE-ISTNIEJĄCE, dziedziczne
    // ograniczenie CAŁEGO mechanizmu wojny wymuszonej (identyczne dla starego fallbacku
    // pojedynczego, patrz analogiczny brzeg aiCmdResume w raporcie rundy 1) -- NIE regresja
    // tego tematu, ŚWIADOMIE NIENAPRAWIANE w tej rundzie (poza allowlistą, dispatch pkt 3).
    assert(
      !decideAIDiplomacy({
        myPlayerId: '2', relacje: [], agresja: 0.1, currentTurn: 30, [forcedField]: 0,
      }).some(c => c.type === 'wypowiedz_wojne'),
      `${nazwa}: ZARZUT 2 (znane, dziedziczne ograniczenie, NIE naprawiane tu) -- owner `
      + `nieodkryty przez gracza (relacje bez wpisu partnerId='0') -> guard w ai.ts cicho `
      + `pomija DOW mimo ${forcedField}=0 wpisanego przez domino`,
    );
  }

  console.log(`PASSED: ${passed} / FAILED: ${failed} / TOTAL: ${passed + failed}`);
  if (failed > 0) process.exitCode = 1;
} finally {
  for (const file of [entry, bundle]) {
    try { fs.unlinkSync(file); } catch {}
  }
}
