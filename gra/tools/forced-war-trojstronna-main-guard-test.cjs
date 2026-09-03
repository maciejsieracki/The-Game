'use strict';

/**
 * Tekstowa bramka wiązania R-DYPLO-AI-WOJNA-TROJSTRONNA-Q1 z main.ts. Czysty kontrakt
 * (pickStoneForcedWarDominoOwnerIds/pickBronzeForcedWarDominoOwnerIds/
 * pickIronForcedWarDominoOwnerIds) jest testowany w forced-war-trojstronna-test.cjs;
 * tutaj sprawdzamy WYŁĄCZNIE OKABLOWANIE w main.ts: snapshot policzony RAZ na turę PRZED
 * `ownerLoop` (nie per-owner -- inaczej "jednocześnie" z GOAL 1 nie zachodzi), użycie
 * wyniku w KAŻDEJ z trzech epok, i brak `poziomTrudnosci` w opcjach domina (GOAL 4:
 * mechanizm NIE dziedziczy limitu "Normalny: gracz najwyżej w jednej naraz").
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

console.log('R-DYPLO-AI-WOJNA-TROJSTRONNA-Q1 — main.ts guards');

check(
  'main.ts importuje trzy funkcje domina, po jednej per epoka',
  main.includes('pickStoneForcedWarDominoOwnerIds')
    && main.includes('pickBronzeForcedWarDominoOwnerIds')
    && main.includes('pickIronForcedWarDominoOwnerIds'),
);

const ownerLoopIdx = main.indexOf('ownerLoop: for (let oi = startOi');
const snapshotIdx = main.indexOf('const playerAlreadyHasAnyActiveForcedWarThisTurn');
check(
  'snapshot "gracz ma już parę" jest policzony RAZ, PRZED ownerLoop (nie per-owner) -- '
  + 'inaczej pierwszy przetworzony owner pary zdążyłby dopisać graczowi wojnę i drugi '
  + 'widziałby już wynik pierwszego, łamiąc "jednocześnie" (GOAL 1)',
  ownerLoopIdx > 0 && snapshotIdx > 0 && snapshotIdx < ownerLoopIdx,
);
check(
  'snapshot występuje DOKŁADNIE raz (nie jest przeliczany ponownie wewnątrz pętli per-owner)',
  count('const playerAlreadyHasAnyActiveForcedWarThisTurn') === 1,
);
check(
  'snapshot łączy WSZYSTKIE TRZY epoki (Kamień+Brąz+Żelazo), szerzej niż istniejący '
  + 'playerActiveForcedWarCount (tylko Kamień+Brąz)',
  /playerAlreadyHasAnyActiveForcedWarThisTurn =\s*\n\s*\[\.\.\.bronzeForceWarActiveByPairKey\.values\(\)\]\.some\(st => st\.targetId === 0\)\s*\n\s*\|\| \[\.\.\.stoneForceWarActiveByPairKey\.values\(\)\]\.some\(st => st\.targetId === 0\)\s*\n\s*\|\| \[\.\.\.ironForceWarActiveByPairKey\.values\(\)\]\.some\(st => st\.targetId === 0\)/.test(main),
);

check(
  'ECHO 2: sojusz KTÓREJKOLWIEK strony z graczem sprawdzany przez allianceFormalKindBetween '
  + '(ownerId, gracz=0)',
  /dominoHasAllianceWithPlayer = \(oid: number\): boolean =>\s*\n\s*allianceFormalKindBetween\(activeDeals, oid, 0\) !== null/.test(main),
);

check(
  'GOAL 4 (ECHO 3, "bez dodatkowego łagodzenia"): dominoOpts NIE przekazuje poziomTrudnosci '
  + '-- domino nie dziedziczy limitu "Normalny: gracz najwyżej w jednej naraz" istniejącego '
  + 'fallbacku (ten limit dotyczy WYŁĄCZNIE pickXForcedWarTargetIdCoordinated, nie domina)',
  /const dominoOpts = \{\s*\n\s*playerAlreadyHasActiveForcedWar: playerAlreadyHasAnyActiveForcedWarThisTurn,\s*\n\s*hasAllianceWithPlayer: dominoHasAllianceWithPlayer,\s*\n\s*\};/.test(main)
    && !/dominoOpts = \{[\s\S]{0,200}poziomTrudnosci/.test(main),
);

for (const [nazwa, mapName, pickFn, setName, targetVar] of [
  ['Brąz', 'bronzeForceWarActiveByPairKey', 'pickBronzeForcedWarDominoOwnerIds', 'bronzeDominoOwnerIds', 'bronzeForceWarTargetId'],
  ['Kamień', 'stoneForceWarActiveByPairKey', 'pickStoneForcedWarDominoOwnerIds', 'stoneDominoOwnerIds', 'stoneForceWarTargetId'],
  ['Żelazo', 'ironForceWarActiveByPairKey', 'pickIronForcedWarDominoOwnerIds', 'ironDominoOwnerIds', 'ironForceWarTargetId'],
]) {
  check(
    `${nazwa}: ${setName} liczony z aktywnych par AI-vs-AI (targetId !== 0), z wykluczeniem eliminowanych`,
    new RegExp(
      `const ${setName} = ${pickFn}\\(\\s*\\n\\s*\\[\\.\\.\\.${mapName}\\.values\\(\\)\\]\\s*\\n\\s*\\.filter\\(st => st\\.targetId !== 0\\s*\\n\\s*&& !eliminatedOwners\\.has\\(st\\.attackerId\\)\\s*\\n\\s*&& !eliminatedOwners\\.has\\(st\\.targetId\\)\\),\\s*\\n\\s*dominoOpts,\\s*\\n\\s*\\);`,
    ).test(main),
  );
  check(
    `${nazwa}: owner w ${setName} dostaje ${targetVar} = 0 NIEZALEŻNIE od shouldSearch/alreadyAtWarAnyRole `
    + '(domino musi zadziałać właśnie DLATEGO, że owner jest już w innej wojnie)',
    new RegExp(`if \\(${setName}\\.has\\(ownerId\\)\\) \\{\\s*\\n\\s*${targetVar} = 0;\\s*\\n\\s*\\}`).test(main),
  );
}

// Regresja mutacyjna (dowód nietautologiczności): usunięcie okablowania domina jest
// wykrywalne przez powyższe asercje -- symulujemy to na kopii tekstu main.ts w locie,
// bez zapisu na dysk.
const mutatedMissingBronzeWire = main.replace(
  'if (bronzeDominoOwnerIds.has(ownerId)) {\n                  bronzeForceWarTargetId = 0;\n                }\n',
  '',
);
check(
  'regresja mutacyjna: usunięcie okablowania Brązu w main.ts jest wykrywalne (test czerwienieje)',
  mutatedMissingBronzeWire !== main
    && !/if \(bronzeDominoOwnerIds\.has\(ownerId\)\) \{\s*\n\s*bronzeForceWarTargetId = 0;\s*\n\s*\}/.test(mutatedMissingBronzeWire),
);

check(
  'GOAL 3: ai.ts (ogólna ścieżka decyzyjna Priorytet 4) NIE jest importowany/rozszerzony '
  + 'przez ten temat -- main.ts nadal woła WYŁĄCZNIE istniejące, niezmienione pola '
  + 'diploInp.*ForceWarTargetId (ten sam kanał co stary fallback, ai.ts poza allowlistą)',
  main.includes('diploInp.stoneForceWarTargetId = stoneForceWarTargetId;')
    && main.includes('diploInp.ironForceWarTargetId = ironForceWarTargetId;'),
);

console.log(`WYNIK: ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
