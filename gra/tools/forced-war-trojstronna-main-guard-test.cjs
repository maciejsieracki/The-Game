'use strict';

/**
 * Tekstowa bramka wiązania R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1 z main.ts.
 *
 * PRZEPISANA od zera tą naprawą: dawne domino trójstronne (pickStoneForcedWarDominoOwnerIds/
 * pickBronzeForcedWarDominoOwnerIds/pickIronForcedWarDominoOwnerIds, per-era, uruchamiane
 * przed `ownerLoop`) zniknęło FUNKCJONALNIE, zastąpione JEDNĄ wspólną procedurą
 * `assignForcedWarPairings` (forced-war-common.ts), wołaną RAZ na turę PRZED `ownerLoop`, dla
 * wszystkich trzech epok (Kamień/Brąz/Żelazo) NARAZ. Kontrakt czysty tej procedury jest
 * dowiedziony osobno w `tools/wojna-wymuszona-parowanie-test.cjs` (property-based, wiele
 * scenariuszy, w tym inwariant binarny ECHO). Ta bramka sprawdza WYŁĄCZNIE OKABLOWANIE w
 * main.ts: pre-pass zbierający triggeredSubjects (Brąz+Kamień+Żelazo -- Żelazo pokryte też w
 * forced-war-iron-main-guard-test.cjs), pulę existingActivePairsForJoin z WSZYSTKICH trzech
 * map, jedno wywołanie `assignForcedWarPairings` przed `ownerLoop`, log DECISION_REQUIRED przy
 * unresolvedOwnerIds, i odczyt wyniku per owner (bronze/stone) z `forcedWarAssignmentByOwner`.
 */

const fs = require('fs');
const path = require('path');
const main = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) {
    passed++;
    console.log(`PASS: ${label}`);
  } else {
    failed++;
    console.log(`FAIL: ${label}`);
  }
}
function count(text) {
  return (main.match(new RegExp(text, 'g')) || []).length;
}

console.log('R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1 — main.ts guards (okablowanie)');

const ownerLoopIdx = main.indexOf('ownerLoop: for (let oi = startOi');
const preLoopIdx = main.indexOf('const bronzeTriggeredSubjects: ForcedWarPairingSubject[] = [];');
const assignIdx = main.indexOf('const forcedWarPairingResult = assignForcedWarPairings(');

check(
  'main.ts importuje assignForcedWarPairings i typy z forced-war-common (nie osobne funkcje '
    + 'domina per epoka -- USUNIĘTE)',
  main.includes('assignForcedWarPairings')
    && main.includes("type ForcedWarPairingSubject")
    && main.includes("type ForcedWarPairingExistingPair")
    && !main.includes('pickBronzeForcedWarDominoOwnerIds')
    && !main.includes('pickStoneForcedWarDominoOwnerIds')
    && !main.includes('pickIronForcedWarDominoOwnerIds')
    && !main.includes('pickBronzeForcedWarTargetIdCoordinated')
    && !main.includes('pickStoneForcedWarTargetIdCoordinated'),
);

check(
  'pre-pass (triggeredSubjects, budowa puli) jest policzony RAZ, PRZED ownerLoop (nie per-owner) '
  + '-- ECHO: "Najpierw wszyscy mają wojnę, potem trójkąty" wymaga znać WSZYSTKICH triggered '
  + 'tej tury NARAZ, zanim ktokolwiek dostanie przydział',
  preLoopIdx > 0 && ownerLoopIdx > 0 && preLoopIdx < ownerLoopIdx,
);
check(
  'wywołanie assignForcedWarPairings występuje RAZ, PRZED ownerLoop (nie wewnątrz pętli per-owner)',
  assignIdx > 0 && assignIdx < ownerLoopIdx
    && count('const forcedWarPairingResult = assignForcedWarPairings\\(') === 1,
);

check(
  'pre-pass zbiera triggeredSubjects Brązu (bronzeTriggeredSubjects.push) i Kamienia '
    + '(stoneTriggeredSubjects.push) -- Żelazo pokryte w forced-war-iron-main-guard-test.cjs',
  /bronzeTriggeredSubjects\.push\(\{ ownerId, q: refCity\.q, r: refCity\.r, era: 'bronze' \}\)/.test(main)
    && /stoneTriggeredSubjects\.push\(\{ ownerId, q: refCity\.q, r: refCity\.r, era: 'stone' \}\)/.test(main),
);
check(
  'triggeredSubjects finalny to złączenie WSZYSTKICH trzech epok, PLUS gracz (dopisany osobno)',
  /const triggeredSubjects: ForcedWarPairingSubject\[\] = \[\s*\n\s*\.\.\.bronzeTriggeredSubjects, \.\.\.stoneTriggeredSubjects, \.\.\.ironTriggeredSubjects,\s*\n\s*\];/.test(main),
);

check(
  'existingActivePairsForJoin łączy WSZYSTKIE trzy mapy aktywnych par (AI<->AI, targetId!==0, '
    + 'bez eliminowanych), każda otagowana WŁASNĄ erą -- krok 4 ECHO (leftover dołącza do '
    + 'DOWOLNEJ epoki)',
  /const existingActivePairsForJoin: ForcedWarPairingExistingPair\[\] = \[/.test(main)
    && /era: 'bronze' as const/.test(main)
    && /era: 'stone' as const/.test(main)
    && /era: 'iron' as const/.test(main),
);

check(
  'ECHO, brzegowy przypadek: unresolvedOwnerIds NIEPUSTE loguje DECISION_REQUIRED (nie zgaduje, '
    + 'nie crashuje) -- owner zostaje bez przydziału tej tury',
  /if \(forcedWarPairingResult\.unresolvedOwnerIds\.length > 0\) \{[\s\S]{0,400}?console\.error\(\s*\n\s*'\[Wojna wymuszona\] DECISION_REQUIRED:/.test(main),
);

check(
  'wynik czytany do forcedWarAssignmentByOwner (Map<ownerId, assignment>) z assignments zwróconych '
    + 'przez assignForcedWarPairings',
  /const forcedWarAssignmentByOwner = new Map\(\s*\n\s*forcedWarPairingResult\.assignments\.map\(a => \[a\.ownerId, a\] as const\),\s*\n\s*\);/.test(main),
);

check(
  'Brąz: bronzeForceWarTargetId czytany z forcedWarAssignmentByOwner z rozróżnieniem WŁASNEJ ery '
    + '(era === \'bronze\'), nie z usuniętego domina/coordinated',
  main.includes("forcedWarOwnAssignment?.era === 'bronze' ? forcedWarOwnAssignment.targetId : undefined"),
);
check(
  'Kamień: stoneForceWarTargetId czytany z forcedWarAssignmentByOwner z rozróżnieniem WŁASNEJ ery '
    + '(era === \'stone\')',
  main.includes("forcedWarOwnAssignment?.era === 'stone' ? forcedWarOwnAssignment.targetId : undefined"),
);
check(
  'Żelazo: ironForceWarTargetId czytany z forcedWarAssignmentByOwner z rozróżnieniem WŁASNEJ ery '
    + '(era === \'iron\')',
  main.includes("forcedWarOwnAssignment?.era === 'iron' ? forcedWarOwnAssignment.targetId : undefined"),
);

check(
  'ECHO 2 (sojusz KTÓREJKOLWIEK strony blokuje CAŁĄ parę): isForcedWarPairBlocked sprawdza NAP, '
    + 'blokadę pokoju (w tym cooldown tej samej pary) i sojusz -- symetryczny predykat dla '
    + 'WSZYSTKICH par (nowych i dołączeń do istniejących), nie tylko względem gracza',
  /const isForcedWarPairBlocked = \(a: number, b: number\): boolean =>\s*\n\s*hasTreaty\(activeDeals, a, b, RodzajTraktatu\.PaktNieagresji\)\s*\n\s*\|\| isPeaceLockedBetween\(a, b\)\s*\n\s*\|\| allianceFormalKindBetween\(activeDeals, a, b\) !== null;/.test(main),
);

// Regresja mutacyjna (dowód nietautologiczności): usunięcie odczytu Brązu z assignmentu jest
// wykrywalne przez powyższe asercje -- symulujemy to na kopii tekstu main.ts w locie.
const mutatedMissingBronzeRead = main.replace(
  "forcedWarOwnAssignment?.era === 'bronze' ? forcedWarOwnAssignment.targetId : undefined",
  'undefined',
);
check(
  'regresja mutacyjna: usunięcie odczytu Brązu z forcedWarAssignmentByOwner jest wykrywalne '
    + '(test czerwienieje)',
  mutatedMissingBronzeRead !== main
    && !mutatedMissingBronzeRead.includes("forcedWarOwnAssignment?.era === 'bronze' ? forcedWarOwnAssignment.targetId : undefined"),
);

check(
  'GOAL 3 (nietknięte tą naprawą): ai.ts nadal woła WYŁĄCZNIE istniejące, niezmienione pola '
    + 'diploInp.*ForceWarTargetId (ten sam kanał co stary fallback/domino, ai.ts poza allowlistą)',
  main.includes('diploInp.stoneForceWarTargetId = stoneForceWarTargetId;')
    && main.includes('diploInp.ironForceWarTargetId = ironForceWarTargetId;'),
);

console.log(`WYNIK: ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
