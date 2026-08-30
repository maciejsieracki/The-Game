'use strict';

/**
 * R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1 — tekstowa bramka wiązania z `main.ts` i `ai.ts`.
 *
 * DLACZEGO OSOBNO OD `forced-war-iron-test.cjs`: tamten test bunduje WYŁĄCZNIE czysty
 * moduł + `ai.ts`; `main.ts` (wyzwalacz przy awansie epoki, pula kandydatów, konsumpcja
 * pending, haki przejęcia miasta, save/load, eliminacja, reset nowej gry) nie jest tam
 * bundlowany w ogóle, więc ciche usunięcie wiązania przeszłoby ALL GREEN. Ta bramka
 * pinuje wiązanie asercjami źródłowymi — dokładnie ten sam wzorzec co
 * `forced-war-stone-main-guard-test.cjs` i `forced-war-bronze-main-guard-test.cjs`.
 *
 * Uruchamianie z gra/: node tools/forced-war-iron-main-guard-test.cjs
 */

const fs = require('fs');
const path = require('path');
const main = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
const ai = fs.readFileSync(path.join(__dirname, '..', 'src', 'game', 'ai.ts'), 'utf8');

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
const ironSurrenderHook = 'maybeResolveIronForcedWarOnCityCapture(oldOwner, newOwner);';

console.log('R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1 — main.ts + ai.ts guards\n');

// ---------------------------------------------------------------------------
// 1. Moduł i wyzwalacz (awans epoki, NIE próg tury).
// ---------------------------------------------------------------------------
check(
  'main.ts importuje osobny moduł forced-war-iron',
  main.includes("from './game/forced-war-iron';"),
);
check(
  'wyzwalacz siedzi w syncOwnerEraFromResearch i używa isIronEraEntry(prev, next)',
  /function syncOwnerEraFromResearch\(ownerId: number\): boolean \{[\s\S]{0,4000}?isIronEraEntry\(prev, next\)[\s\S]{0,400}?ironForceWarPendingOwners\.add\(ownerId\)/.test(main),
);
check(
  'wyzwalacz Żelaza NIE jest progiem tury (żadnego turn >= … obok ironForceWarPendingOwners.add)',
  !/turn >= [A-Z_]+[\s\S]{0,600}ironForceWarPendingOwners\.add\(ownerId\)/.test(main),
);
check(
  'wyzwalacz wyklucza miasta-państwa/kopie (isOwnerClusterCityState przy awansie)',
  /isIronEraEntry\(prev, next\)[\s\S]{0,200}!isOwnerClusterCityState\(ownerId, ownerCityStateOpts\(\)\)[\s\S]{0,200}ironForceWarPendingOwners\.add\(ownerId\)/.test(main),
);

// ---------------------------------------------------------------------------
// 2. Napastnik: gracz / miasto-państwo / barbarzyńca / wyeliminowany nigdy nie atakuje.
// ---------------------------------------------------------------------------
check(
  'guard napastnika wyklucza gracza (ownerId > 0), kopie typu, barbarzyńców, wyeliminowanych i miasta-państwa',
  /ownerId > 0\s*\n\s*&& !typCityCopyOwners\.has\(ownerId\)\s*\n\s*&& !isBarbarian\(ownerId\)\s*\n\s*&& !eliminatedOwners\.has\(ownerId\)\s*\n\s*&& !isOwnerClusterCityState\(ownerId, ownerCityStateOpts\(\)\)\s*\n\s*\) \{\s*\n\s*const wasPending = ironForceWarPendingOwners\.has\(ownerId\);/.test(main),
);
check(
  'kwalifikacja napastnika przechodzi przez isEligibleForIronForcedWar (isMainAiCiv + brak wojny w dowolnej roli)',
  /isEligibleForIronForcedWar\(\{[\s\S]{0,200}isMainAiCiv: true,[\s\S]{0,200}isAlreadyAtWarAnyRole: alreadyAtWarAnyRole,/.test(main),
);
check(
  'cykl po odpoczynku: wymaga cycleOwners, braku wojny i wygaśnięcia isRestingFromIronForcedWar',
  /const searchingAfterRest = !wasPending\s*\n\s*&& ironForceWarCycleOwners\.has\(ownerId\)\s*\n\s*&& !hasActiveForcedWarAsAttacker\s*\n\s*&& !alreadyAtWarAnyRole\s*\n\s*&& !isRestingFromIronForcedWar\(/.test(main),
);

// ---------------------------------------------------------------------------
// 3. Cel: miasta-państwa/kopie/barbarzyńcy/wyeliminowani nigdy nie trafiają do puli
//    kandydatów; GRACZ (ownerId 0) natomiast, od P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1
//    (2026-08-30, zastępuje Q2 z R-EPOKA-KAMIEN-WYMUSZONA-WOJNA-Q1), TAK — na równi z AI.
// ---------------------------------------------------------------------------
check(
  'pula kandydatów Żelaza WŁĄCZA gracza (oid >= 0, źródło [0, ...aiOwnerList]) — '
    + 'wyklucza wyłącznie kopie, barbarzyńców, wyeliminowanych i miasta-państwa',
  /const ironCandidates = \[0, \.\.\.aiOwnerList\]\s*\n\s*\.filter\(oid =>\s*\n\s*oid !== ownerId\s*\n\s*&& oid >= 0\s*\n\s*&& !typCityCopyOwners\.has\(oid\)\s*\n\s*&& !isBarbarian\(oid\)\s*\n\s*&& !eliminatedOwners\.has\(oid\)\s*\n\s*&& !isOwnerClusterCityState\(oid, ownerCityStateOpts\(\)\),/.test(main),
);
check(
  'Iron target filtruje NAP, blokadę pokoju i sojusz z celem',
  /ironBlockedOwnerIds[\s\S]{0,700}hasTreaty\(activeDeals, ownerId, c\.ownerId, RodzajTraktatu\.PaktNieagresji\)[\s\S]{0,300}isPeaceLockedBetween\(ownerId, c\.ownerId\)[\s\S]{0,300}allianceFormalKindBetween\(activeDeals, ownerId, c\.ownerId\) !== null/.test(main),
);
check(
  'wybór celu przechodzi przez pickIronForcedWarTargetId z blockedOwnerIds',
  /pickIronForcedWarTargetId\(\s*\n\s*ironCandidates,[\s\S]{0,300}\{ blockedOwnerIds: ironBlockedOwnerIds \}/.test(main),
);
check(
  'Iron target jest przekazywany do decideAIDiplomacy',
  /diploInp\.ironForceWarTargetId = ironForceWarTargetId;/.test(main),
);

// ---------------------------------------------------------------------------
// 4. ai.ts — wczesny return POZA ogólnymi regułami wojny.
// ---------------------------------------------------------------------------
check(
  'ai.ts: DiplomacjaInputs ma pole ironForceWarTargetId',
  /ironForceWarTargetId\?: number;/.test(ai),
);
check(
  'ai.ts: guard Żelaza to wczesny return z wypowiedz_wojne i pełnym zestawem blokad',
  /if \(inp\.ironForceWarTargetId != null\) \{[\s\S]{0,400}?!forcedRel\.stanWojny[\s\S]{0,200}?!forcedRel\.peaceLocked[\s\S]{0,200}?!forcedRel\.hasNapTreaty[\s\S]{0,200}?!forcedRel\.hasAllianceTreaty[\s\S]{0,300}?type:\s*'wypowiedz_wojne'/.test(ai),
);
check(
  'ai.ts: guard Żelaza stoi PRZED ogólnymi regułami wojny (przed budową DiplomacjaParams `const p:`)',
  ai.indexOf('if (inp.ironForceWarTargetId != null) {') > 0
    && ai.indexOf('if (inp.ironForceWarTargetId != null) {')
      < ai.indexOf('  const p: DiplomacjaParams = {'),
);
check(
  'ai.ts: guardy Kamienia i Brązu nietknięte (zero regresji dwóch istniejących epok)',
  /if \(inp\.bronzeForceWarTargetId != null\) \{/.test(ai)
    && /if \(inp\.stoneForceWarTargetId != null\) \{/.test(ai),
);

// ---------------------------------------------------------------------------
// 5. Konsumpcja pending WYŁĄCZNIE przy faktycznym sukcesie + guard sojuszu w komendzie.
// ---------------------------------------------------------------------------
check(
  'udany DOW mutuje active/cycle i konsumuje pending Żelaza',
  /if \(ironForceWarTargetId != null && targetId === ironForceWarTargetId\) \{[\s\S]{0,500}ironForceWarActiveByPairKey\.set[\s\S]{0,500}ironForceWarCycleOwners\.add\(ownerId\)[\s\S]{0,500}ironForceWarPendingOwners\.delete\(ownerId\)/.test(main),
);
check(
  'pending Żelaza jest kasowany DOKŁADNIE w jednym miejscu (blok sukcesu), nie przy samej próbie',
  count('ironForceWarPendingOwners\\.delete\\(ownerId\\)') === 2, // 1x sukces DOW + 1x eliminacja ownera
);
check(
  'komenda DOW ma finalny guard sojuszu dla celu Żelaza',
  /ironForceWarTargetId != null\s*\n\s*&& targetId === ironForceWarTargetId\s*\n\s*&& allianceFormalKindBetween\(activeDeals, ownerId, targetId\) !== null\s*\n\s*\) \{\s*\n\s*continue;/.test(main),
);

// ---------------------------------------------------------------------------
// 6. Auto-pokój po 2 miastach — hak z OBU funnel-i zmiany city.ownerId.
// ---------------------------------------------------------------------------
check(
  'maybeResolveIronForcedWarOnCityCapture() zdefiniowana w main.ts',
  /function maybeResolveIronForcedWarOnCityCapture\(oldOwner: number, newOwner: number\): void \{/.test(main),
);
check(
  'automatyczny pokój po 2 miastach używa cooldownu Żelaza',
  /function maybeResolveIronForcedWarOnCityCapture[\s\S]{0,1400}shouldEndIronForcedWarByCityCount[\s\S]{0,1400}finalizePeaceTreatyBetween\([\s\S]{0,250}WOJNA_ZELAZO_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR/.test(main),
);
check(
  'capture battle funnel rozlicza Żelazo',
  /applyCityCaptureAfterBattle[\s\S]{0,1000}maybeResolveIronForcedWarOnCityCapture\(oldOwner, atkOwner\);/.test(main),
);
check(
  'siege surrender funnel rozlicza Żelazo PO zmianie city.ownerId',
  siegeSurrender.includes('city.ownerId = newOwner;')
    && siegeSurrender.includes(ironSurrenderHook)
    && siegeSurrender.indexOf(ironSurrenderHook)
      > siegeSurrender.indexOf('city.ownerId = newOwner;'),
);
// UWAGA: świadomie NIE ma tu meta-asercji „usunięcie haka jest wykrywalne" (taka, jaką
// niesie bramka Kamienia) — jest tautologiczna: `replace(hook,'').includes(hook)` jest
// fałszem z definicji, więc asercja nie może się zaczerwienić pod żadną mutacją źródła.
// Dowód nietautologiczności tej bramki robi ZEWNĘTRZNA sonda
// `tools/forced-war-iron-mutant-probe.cjs`, która czerwieni KAŻDĄ asercję obu bramek
// Żelaza celowaną mutacją źródła.
check(
  'zwykła wojna bez zmian: licznik Żelaza działa tylko dla aktywnej pary wymuszonej',
  /function maybeResolveIronForcedWarOnCityCapture\(oldOwner: number, newOwner: number\): void \{[\s\S]{0,350}?const st = ironForceWarActiveByPairKey\.get\(pairKey\);\s*\n\s*if \(!st\) return;/.test(main),
);
check(
  'finalizePeaceTreatyBetween uzbraja odpoczynek Żelaza (cleanupIronForcedWarOnPeace)',
  /function cleanupIronForcedWarOnPeace\(proposerId: number, responderId: number\): void \{[\s\S]{0,500}ironForceWarRestUntilByOwner\.set/.test(main)
    && /function finalizePeaceTreatyBetween\([\s\S]{0,2200}cleanupIronForcedWarOnPeace\(proposerId, responderId\);/.test(main),
);

// ---------------------------------------------------------------------------
// 7. Save/load, eliminacja, reset nowej gry.
// ---------------------------------------------------------------------------
check(
  'save snapshot zawiera komplet 4 pól Żelaza',
  count('ironForceWarPendingOwners: ironForceWarSave\\.pendingOwners') === 1
    && count('ironForceWarCycleOwners: ironForceWarSave\\.cycleOwners') === 1
    && count('ironForceWarRestUntilByOwner: ironForceWarSave\\.restUntilByOwner') === 1
    && count('ironForceWarActiveByPairKey: ironForceWarSave\\.activeByPairKey') === 1,
);
check(
  'restoreGameFromSave odtwarza komplet 4 struktur Żelaza',
  /restoreIronForcedWarState\(\{[\s\S]{0,600}saved\.meta\?\.ironForceWarPendingOwners[\s\S]{0,1300}ironForceWarActiveByPairKey\.clear\(\)[\s\S]{0,300}ironForceWarRestored\.activeByPairKey/.test(main),
);
check(
  'eliminacja i nowa gra czyszczą stan Żelaza',
  count('ironForceWarPendingOwners\\.delete\\(ownerId\\)') >= 1
    && count('ironForceWarActiveByPairKey\\.clear\\(\\)') >= 2,
);

// ---------------------------------------------------------------------------
// 8. Zero regresji Kamienia i Brązu — osobne moduły i osobne rejestry.
// ---------------------------------------------------------------------------
check(
  'Kamień i Brąz zachowują własne moduły, rejestry i haki',
  main.includes("from './game/forced-war-stone';")
    && main.includes("from './game/forced-war-bronze';")
    && main.includes('stoneForceWarActiveByPairKey')
    && main.includes('bronzeForceWarActiveByPairKey')
    && main.includes('maybeResolveStoneForcedWarOnCityCapture')
    && main.includes('maybeResolveBronzeForcedWarOnCityCapture'),
);
check(
  'rejestry Żelaza są ROZŁĄCZNE z Kamieniem i Brązem (żadne pole nie jest współdzielone)',
  /const ironForceWarPendingOwners = new Set<number>\(\);/.test(main)
    && /const ironForceWarCycleOwners = new Set<number>\(\);/.test(main)
    && /const ironForceWarRestUntilByOwner = new Map<number, number>\(\);/.test(main)
    && /const ironForceWarActiveByPairKey = new Map<string, IronForcedWarPairState>\(\);/.test(main),
);

console.log(`\nWYNIK: ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
