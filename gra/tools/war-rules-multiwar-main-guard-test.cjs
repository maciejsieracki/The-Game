'use strict';

/**
 * war-rules-multiwar-main-guard-test.cjs — R-WEB-WAR-RULES-MULTIWAR-Q1 r5, zadanie (2).
 *
 * Tekstowa bramka okablowania `gra/src/main.ts` (wzorem `forced-war-stone-main-guard-test.cjs`).
 * Pilnuje, że bramki R1/R2/R3 i W1/W2 są podpięte w ścieżkach, dla których czyste moduły
 * (`war-rules-multiwar-test.cjs`) nie wystarczają:
 *  - wypowiedzenie wojny w pętli `wypowiedz_wojne` (R1 + R2 + R3) PRZED `chargeWarDeclarationCredibility`,
 *  - licznik wojen epoki (R3) inkrementowany PO wypowiedzeniu,
 *  - klaster państw-miast -> gracz (`interCivWarBlockedForAi`) PRZED wypowiedzeniem,
 *  - sojusznik dołączający do wojny (`applyAllianceObligationsOnWar`) PRZED `joinAllyToWar`,
 *  - definicja `interCivWarBlockedForAi` (flaga OFF = false, gracz nieograniczony),
 *  - wyłączenie garnizonów miejskich z puli armii wroga (W1),
 *  - reset opóźnienia R1 (`isInterCivWarOpenAtTurn`) w ścieżce wojen wymuszonych.
 *
 * Źródło: domyślnie `src/main.ts`; mutanty testowane przez zmienną środowiskową
 * `WAR_MAIN_TS=<ścieżka>` (kopia main.ts z usuniętą jedną bramką -- test MUSI wtedy paść).
 *
 * Uruchomienie (z katalogu gra/): node tools/war-rules-multiwar-main-guard-test.cjs
 */

const fs = require('fs');
const path = require('path');

const MAIN_PATH = process.env.WAR_MAIN_TS
  ? path.resolve(process.env.WAR_MAIN_TS)
  : path.join(__dirname, '..', 'src', 'main.ts');
const main = fs.readFileSync(MAIN_PATH, 'utf8');

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

/** Okno tekstu zaczynające się od `marker` (pierwsze wystąpienie), długości `len`. */
function windowAfter(source, marker, len) {
  const i = source.indexOf(marker);
  if (i < 0) return '';
  return source.slice(i, i + len);
}

console.log(`R-WEB-WAR-RULES-MULTIWAR-Q1 — okablowanie main.ts (${path.basename(MAIN_PATH)})`);

check(
  'main.ts importuje bramki z war-rules-multiwar',
  /from '\.\/game\/war-rules-multiwar';/.test(main)
    && /\bevaluateInterCivWarGate,/.test(main)
    && /\bcanDeclareEraForcedWar,/.test(main)
    && /\bforcedEraTagFromPowod,/.test(main)
    && /\bisInterCivWarOpenAtTurn,/.test(main)
    && /\bisWarRulesMultiwarEnabled,/.test(main),
);

// --- definicja bramki dla AI (klaster / sojusznicy) ---
const gateDef = windowAfter(main, 'function interCivWarBlockedForAi(attackerId: number, targetId: number): boolean {', 700);
check(
  'interCivWarBlockedForAi: flaga OFF -> false (zachowanie bazowe)',
  /if \(!isWarRulesMultiwarEnabled\(\)\) return false;/.test(gateDef),
);
check(
  'interCivWarBlockedForAi: gracz jako napastnik nieograniczony',
  /if \(isMe\(attackerId\)\) return false;/.test(gateDef),
);
check(
  'interCivWarBlockedForAi: deleguje do evaluateInterCivWarGate (R1+R2) z liczbami wojen bez barbarzyńców',
  /evaluateInterCivWarGate\(\{/.test(gateDef)
    && /countActiveWarsForOwnerExcludingBarbarians\(attackerId\)/.test(gateDef)
    && /countActiveWarsForOwnerExcludingBarbarians\(targetId\)/.test(gateDef)
    && /!== 'ok';/.test(gateDef),
);

// --- W3: główna pętla wypowiedzenia (R1 + R2 + R3) przed jakąkolwiek zmianą stanu ---
const declGateBlock = windowAfter(main, "if (cmd.type === 'wypowiedz_wojne' && isWarRulesMultiwarEnabled()) {", 1600);
const declRel = main.indexOf("chargeWarDeclarationCredibility(ownerId, targetId);");
const declGateIdx = main.indexOf("if (cmd.type === 'wypowiedz_wojne' && isWarRulesMultiwarEnabled()) {");
check(
  'wypowiedz_wojne: blok bramki R1/R2/R3 istnieje (flaga ON)',
  declGateIdx > 0,
);
check(
  'wypowiedz_wojne: R3 -- blokada wojny epoki przez canDeclareEraForcedWar(tag, forcedEraWarDeclaredByTag) -> continue',
  /if \(gateForcedTag !== null && !canDeclareEraForcedWar\(gateForcedTag, forcedEraWarDeclaredByTag\)\) continue;/.test(declGateBlock),
);
check(
  'wypowiedz_wojne: R1/R2 -- evaluateInterCivWarGate z turn/era/liczbą wojen napastnika i celu',
  /const gateVerdict = evaluateInterCivWarGate\(\{[\s\S]{0,400}turn,[\s\S]{0,400}attackerWarCount: countActiveWarsForOwnerExcludingBarbarians\(ownerId\)[\s\S]{0,400}targetWarCount: countActiveWarsForOwnerExcludingBarbarians\(targetId\)/.test(declGateBlock),
);
check(
  'wypowiedz_wojne: werdykt != ok -> continue (pominięcie komendy, pending nie konsumowany)',
  /if \(gateVerdict !== 'ok'\) continue;/.test(declGateBlock),
);
check(
  'wypowiedz_wojne: bramka wykonuje się PRZED chargeWarDeclarationCredibility(ownerId, targetId)',
  declRel > 0 && declGateIdx > 0 && declGateIdx < declRel,
);
const declTagSlice = windowAfter(main, 'const declaredEraTag = forcedEraTagFromPowod(cmd.powod);', 260);
check(
  'R3: inkrementacja licznika jest w bloku if (declaredEraTag !== null) (nie bezwarunkowo)',
  /if \(declaredEraTag !== null\) \{\s*forcedEraWarDeclaredByTag\.set\(/.test(declTagSlice),
);
const declCountIdx = main.indexOf('forcedEraWarDeclaredByTag.set(');
check(
  'R3: licznik wojen epoki inkrementowany PO wypowiedzeniu (po applyAllianceObligationsOnWar)',
  declCountIdx > 0 && declRel > 0 && main.indexOf('applyAllianceObligationsOnWar(ownerId, targetId);', declRel) < declCountIdx,
);

// --- klaster państw-miast -> gracz ---
const clusterLoopIdx = main.indexOf('for (const csOwnerId of clusterDowOwners) {');
const clusterSlice = windowAfter(main, 'for (const csOwnerId of clusterDowOwners) {', 500);
check(
  'klaster państw-miast: interCivWarBlockedForAi(csOwnerId, ME()) -> continue PRZED wypowiedzeniem',
  clusterLoopIdx > 0
    && /if \(interCivWarBlockedForAi\(csOwnerId, ME\(\)\)\) continue;/.test(clusterSlice)
    && clusterSlice.indexOf('interCivWarBlockedForAi') < clusterSlice.indexOf('chargeWarDeclarationCredibility(csOwnerId, ME());'),
);

// --- sojusznik dołączający do wojny (applyAllianceObligationsOnWar + joinAllyToWar) ---
const obligSlice = windowAfter(main, 'function applyAllianceObligationsOnWar(attackerId: number, victimId: number): void {', 2600);
const blockIdx = obligSlice.indexOf('if (!isMe(allyId) && interCivWarBlockedForAi(allyId, ob.mustDeclareWarOn)) continue;');
const joinIdx = obligSlice.indexOf('joinAllyToWar(allyId, ob.mustDeclareWarOn, attackerId);');
check(
  'applyAllianceObligationsOnWar: sojusznik blokowany przez bramkę (nie gracz) -> continue',
  blockIdx > 0,
);
check(
  'applyAllianceObligationsOnWar: bramka sojusznika PRZED joinAllyToWar',
  blockIdx > 0 && joinIdx > blockIdx,
);
check(
  'joinAllyToWar: istnieje i zapisuje wojnę przez setDiploRelation(... wojna_wypowiedziana)',
  /function joinAllyToWar\([\s\S]{0,400}setDiploRelation\(/.test(windowAfter(main, 'function joinAllyToWar(', 900))
    && windowAfter(main, 'function joinAllyToWar(', 900).includes("'wojna_wypowiedziana'"),
);

// --- R1 reset w ścieżce wojen wymuszonych ---
check(
  'R1: reset triggeredSubjects przed turą 40 (isInterCivWarOpenAtTurn) w ścieżce wymuszeń',
  /if \(isWarRulesMultiwarEnabled\(\) && !isInterCivWarOpenAtTurn\(turn\)\) triggeredSubjects\.length = 0;/.test(main),
);

// --- W1: garnizony wyłączone z puli armii wroga; flaga OFF -> brak kontekstu ---
const pool = windowAfter(main, 'const ownCityHexKeys = new Set(cities.map(c => `${c.ownerId}:${c.q},${c.r}`));', 900);
check(
  'W1: garnizon (jednostka na własnym mieście) NIE trafia do enemyArmies',
  /if \(ownCityHexKeys\.has\(`\$\{u\.ownerId\}:\$\{u\.q\},\$\{u\.r\}`\)\) continue;[\s\S]{0,120}enemyArmies\.push/.test(pool),
);
check(
  'W1: cywile i zwiadowcy wyłączeni z puli armii (przed push)',
  /if \(isCivilianUnit\(u\) \|\| isScoutUnit\(u\)\) continue;[\s\S]{0,400}enemyArmies\.push/.test(pool),
);
check(
  'W1/W2: flaga OFF zwraca kontekst bez pól (zachowanie bazowe)',
  /if \(!isWarRulesMultiwarEnabled\(\) \|\| isBarbarian\(selfOwnerId\)\) return \{ targets \};/.test(main),
);
check(
  'R1 (r6): warAllInContextFor bramka tury delayInterCivWarsUntilTurn dla cywilizacji AI',
  /isWarRulesMultiwarEnabled\(\) && !isBarbarian\(selfOwnerId\)\s*&& !isInterCivWarOpenAtTurn\(turn\)\) return undefined;/.test(main),
);
check(
  'R3/zapis (r6): warRulesForcedEraDeclared w meta save tylko przy fladze ON',
  /\.\.\.\(isWarRulesMultiwarEnabled\(\)\s*\?\s*\{ warRulesForcedEraDeclared:/.test(main),
);

console.log(`\n${passed} PASS / ${failed} FAIL`);
process.exit(failed > 0 ? 1 : 0);
