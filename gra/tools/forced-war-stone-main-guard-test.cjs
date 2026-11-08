'use strict';

/**
 * Tekstowa bramka wiązania R-EPOKA-KAMIEN-WYMUSZONA-WOJNA z main.ts.
 * Czysty moduł jest testowany w forced-war-stone-test.cjs; tutaj sprawdzamy
 * mutacyjne punkty wejścia, zapis/odczyt i rozdzielenie od Brązu.
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

function functionSlice(source, signature, nextSignature) {
  const start = source.indexOf(signature);
  if (start < 0) return '';
  const end = source.indexOf(nextSignature, start + signature.length);
  return source.slice(start, end < 0 ? source.length : end);
}

const siegeSurrender = functionSlice(
  main,
  'function resolveSiegeSurrender(cityId: string): void {',
  '\n    function endMapSiege(cityId: string): void {',
);
const stoneSurrenderHook = 'maybeResolveStoneForcedWarOnCityCapture(oldOwner, newOwner);';

console.log('R-EPOKA-KAMIEN-WYMUSZONA-WOJNA — main.ts guards');

check(
  'main.ts importuje osobny moduł forced-war-stone',
  main.includes("from './game/forced-war-stone';"),
);
check(
  'trigger ma ochronę startową turn >= 20',
  /turn >= WOJNA_KAMIEN_WYMUSZONA_START_TURY[\s\S]{0,600}stoneForceWarPendingOwners\.add\(ownerId\)/.test(main),
);
check(
  'trigger dotyczy wyłącznie ownera w Kamieniu',
  /empireEpochForOwner\(ownerId\) === 1/.test(main)
    && /isEligibleForStoneForcedWar\(\{[\s\S]{0,250}isStoneEra: empireEpochForOwner\(ownerId\) === 1/.test(main),
);
check(
  'guard wyklucza player/CS/barbarzyńców/eliminowanych',
  /ownerId > 0[\s\S]{0,300}!typCityCopyOwners\.has\(ownerId\)[\s\S]{0,300}!isBarbarian\(ownerId\)[\s\S]{0,300}!eliminatedOwners\.has\(ownerId\)/.test(main),
);
// R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1: `stoneBlockedOwnerIds` (per-owner filtr)
// zniknęło -- zastąpione JEDNYM symetrycznym `isForcedWarPairBlocked`, wspólnym dla
// wszystkich trzech epok (patrz forced-war-trojstronna-main-guard-test.cjs dla pełnego
// dowodu, ta sama trójka warunków NAP/peaceLock/sojusz zachowana 1:1).
check(
  'Stone target filtruje NAP, peace lock i sojusz -- przez isForcedWarPairBlocked, wspólny '
    + 'predykat zastępujący dawne stoneBlockedOwnerIds',
  /const isForcedWarPairBlocked = \(a: number, b: number\): boolean =>\s*\n\s*hasTreaty\(activeDeals, a, b, RodzajTraktatu\.PaktNieagresji\)\s*\n\s*\|\| isPeaceLockedBetween\(a, b\)\s*\n\s*\|\| allianceFormalKindBetween\(activeDeals, a, b\) !== null;/.test(main)
    // Świadomie NIE zero-wystąpień "stoneBlockedOwnerIds" -- nazwa żyje dziś WYŁĄCZNIE w
    // komentarzu historycznym (main.ts, przy isForcedWarPairBlocked), nie w kodzie.
    && !/const stoneBlockedOwnerIds/.test(main),
);
check(
  'Stone target jest przekazywany do decideAIDiplomacy',
  /diploInp\.stoneForceWarTargetId = stoneForceWarTargetId;/.test(main),
);
check(
  'udany DOW mutuje active/cycle i konsumuje pending Stone',
  /if \(stoneForceWarTargetId != null && targetId === stoneForceWarTargetId\) \{[\s\S]{0,500}stoneForceWarActiveByPairKey\.set[\s\S]{0,500}stoneForceWarCycleOwners\.add\(ownerId\)[\s\S]{0,500}stoneForceWarPendingOwners\.delete\(ownerId\)/.test(main),
);
check(
  'automatyczny pokój po 2 miastach ma Stone cooldown',
  /maybeResolveStoneForcedWarOnCityCapture[\s\S]{0,1400}shouldEndStoneForcedWarByCityCount[\s\S]{0,1400}finalizePeaceTreatyBetween\([\s\S]{0,250}WOJNA_KAMIEN_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR/.test(main),
);
check(
  'capture battle funnel rozlicza Stone',
  /applyCityCaptureAfterBattle[\s\S]{0,1000}maybeResolveStoneForcedWarOnCityCapture\(oldOwner, atkOwner\);/.test(main),
);
check(
  'siege surrender funnel rozlicza Stone',
  siegeSurrender.includes('city.ownerId = newOwner;')
    && siegeSurrender.includes(stoneSurrenderHook)
    && siegeSurrender.indexOf(stoneSurrenderHook)
      > siegeSurrender.indexOf('city.ownerId = newOwner;'),
);
check(
  'resolveSiegeSurrender: Stone hook jest po zmianie city.ownerId',
  siegeSurrender.includes('city.ownerId = newOwner;')
    && siegeSurrender.includes(stoneSurrenderHook)
    && siegeSurrender.indexOf(stoneSurrenderHook)
      > siegeSurrender.indexOf('city.ownerId = newOwner;'),
);
check(
  'regresja mutacyjna: usunięcie Stone hooka z resolveSiegeSurrender jest wykrywalne',
  !functionSlice(
    siegeSurrender.replace(stoneSurrenderHook, ''),
    'function resolveSiegeSurrender(cityId: string): void {',
    '\n    function endMapSiege(cityId: string): void {',
  ).includes(stoneSurrenderHook),
);
check(
  'zwykła wojna pozostaje bez zmian: licznik Stone działa tylko dla aktywnej pary',
  /function maybeResolveStoneForcedWarOnCityCapture\(oldOwner: number, newOwner: number\): void \{[\s\S]{0,350}?const st = stoneForceWarActiveByPairKey\.get\(pairKey\);\s*\n\s*if \(!st\) return;/.test(main),
);
check(
  'finalizePeaceTreatyBetween ustawia Stone rest timer',
  /function cleanupStoneForcedWarOnPeace\(proposerId: number, responderId: number\): void \{[\s\S]{0,500}stoneForceWarRestUntilByOwner\.set/.test(main)
    && /finalizePeaceTreatyBetween\([\s\S]{0,1800}cleanupStoneForcedWarOnPeace\(proposerId, responderId\);/.test(main),
);
check(
  'save snapshot zawiera komplet 4 pól Stone',
  count('stoneForceWarPendingOwners: stoneForceWarSave\\.pendingOwners') === 1
    && count('stoneForceWarCycleOwners: stoneForceWarSave\\.cycleOwners') === 1
    && count('stoneForceWarRestUntilByOwner: stoneForceWarSave\\.restUntilByOwner') === 1
    && count('stoneForceWarActiveByPairKey: stoneForceWarSave\\.activeByPairKey') === 1,
);
check(
  'restoreGameFromSave odtwarza komplet 4 struktur Stone',
  /restoreStoneForcedWarState\(\{[\s\S]{0,600}saved\.meta\?\.stoneForceWarPendingOwners[\s\S]{0,1300}stoneForceWarActiveByPairKey\.clear\(\)[\s\S]{0,300}stoneForceWarRestored\.activeByPairKey/.test(main),
);
check(
  'eliminacja i nowa gra czyszczą Stone state',
  count('stoneForceWarPendingOwners\\.delete\\(ownerId\\)') >= 1
    && count('stoneForceWarActiveByPairKey\\.clear\\(\\)') >= 2,
);
check(
  'Brąz zachowuje własny moduł i rejestr',
  main.includes("from './game/forced-war-bronze';")
    && main.includes('bronzeForceWarActiveByPairKey')
    && main.includes('maybeResolveBronzeForcedWarOnCityCapture'),
);

// ---------------------------------------------------------------------------
// R-WOJNA-WYMUSZONA-REGULY-Q1, runda 1 -- Operator obrona po Evaluator FAIL:
// koordynacja/fallback/limit trudności (Część B) nie miała ŻADNEGO main-guard
// chroniącego jej OKABLOWANIE (opcje przekazane do pickStoneForcedWarTargetIdCoordinated
// w main.ts). Zweryfikowano mutacyjnie poza repo (na kopii tekstu main.ts w locie): usunięcie
// bloku opcji z wywołania oraz usunięcie samego pola playerActiveForcedWarCount osobno
// oba czerwienią tę asercję.
// ---------------------------------------------------------------------------
// R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1: `pickStoneForcedWarTargetIdCoordinated`
// zniknęła z main.ts (i z forced-war-stone.ts) -- zastąpiona JEDNĄ wspólną procedurą
// `assignForcedWarPairings` wołaną RAZ na turę PRZED `ownerLoop`. Patrz analogiczny komentarz
// w forced-war-bronze-main-guard-test.cjs.
check(
  'main.ts: stoneForceWarTargetId ustawiane z forcedWarAssignmentByOwner (nowy rdzeń '
    + 'parowania), nie z usuniętego pickStoneForcedWarTargetIdCoordinated',
  main.includes("forcedWarOwnAssignment?.era === 'stone' ? forcedWarOwnAssignment.targetId : undefined")
    && !main.includes('pickStoneForcedWarTargetIdCoordinated'),
);

console.log(`WYNIK: ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
