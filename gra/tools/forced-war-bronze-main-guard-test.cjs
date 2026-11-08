'use strict';
/**
 * forced-war-bronze-main-guard-test.cjs — R-EPOKA-BRAZU-WYMUSZONA-WOJNA (B6, Evaluator FAIL
 * runda 1: "27/27 ALL GREEN mimo usunięcia sprawdzenia eligibility LUB usunięcia wywołania
 * haka licznika przy przejęciu miasta" — pure-function test w forced-war-bronze-test.cjs nie
 * chroni main.ts, bo main.ts w ogóle nie jest tam bundlowany).
 *
 * Wzorzec jak `hud-moc-warstwa-test.cjs`: asercje źródłowe (regex/substring) na main.ts (i tu
 * dodatkowo ai.ts), żeby ciche cofnięcie/usunięcie wiązania było łapane przez bramkę, nie
 * tylko przez przegląd ręczny. Pokrywa WSZYSTKIE 5 poprawek tej rundy poza pure-function
 * pokryciem z forced-war-bronze-test.cjs:
 *   B1 — hak licznika wołany z OBU miejsc zmiany city.ownerId w wyniku wojny.
 *   B3 — sojusz blokuje wybór celu (main.ts bronzeBlockedOwnerIds + AI↔AI relacjeDip + ai.ts guard).
 *   B4 — pending NIE jest kasowany bezwarunkowo przy samej próbie; kasowany TYLKO przy sukcesie.
 *   B5 — 4 pola stanu obecne w buildSaveGameSnapshot ORAZ restoreGameFromSave.
 *   B6 (ta bramka sama w sobie) — dowód mutacyjny na końcu pliku.
 *
 * Usage (z gra/): node tools/forced-war-bronze-main-guard-test.cjs
 */

const fs = require('fs');
const path = require('path');

const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const AI_TS = path.join(__dirname, '..', 'src', 'game', 'ai.ts');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
const aiSrc = fs.readFileSync(AI_TS, 'utf8');

let passCount = 0;
let failCount = 0;
function check(label, cond, detail) {
  if (cond) {
    passCount++;
    console.log('  PASS: ' + label);
  } else {
    failCount++;
    console.log('  FAIL: ' + label + (detail ? ' -- ' + detail : ''));
  }
}

console.log('========================================================================');
console.log('R-EPOKA-BRAZU-WYMUSZONA-WOJNA runda 2 -- bramka tekstowa main.ts + ai.ts');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// B1: hak licznika wołany z OBU miejsc, gdzie city.ownerId zmienia się w wyniku wojny.
// ---------------------------------------------------------------------------
console.log('1. B1 -- maybeResolveBronzeForcedWarOnCityCapture wołany z OBU funnel-i przejęcia miasta');

check(
  'maybeResolveBronzeForcedWarOnCityCapture() zdefiniowana jako funkcja w main.ts',
  /function maybeResolveBronzeForcedWarOnCityCapture\(oldOwner: number, newOwner: number\): void \{/.test(mainSrc),
);

check(
  'applyCityCaptureToMap: woła maybeResolveBronzeForcedWarOnCityCapture(oldOwner, atkOwner) '
    + 'PO applyCityCaptureAfterBattle',
  // Budżet {0,600} (zamiast {0,300}): applyCityCaptureAfterBattle w aktualnym main.ts przyjmuje
  // dodatkowo onOwnerChanged: seedCityOwnerDefaults + komentarz B2 (Evaluator RUNDA 1: FAIL,
  // pre-istniejący fix tego samego tematu, poza zakresem tej rundy) -- realna długość wywołania
  // to ok. 463 znaki treści; 600 daje margines bez utraty czułości na usunięcie wywołania.
  // Budżet {0,1500} (zamiast dawnego {0,800}) od nagłówka funkcji do wywołania: PRE-ISTNIEJĄCE
  // (spoza tego dispatchu) integracje R-MIASTA-REBELIA-OCHRONA-20-TUR-Q1 i
  // R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 rozrosły komentarz/sygnaturę zwrotną funkcji ponad
  // dawny budżet. Budżet {0,400} (zamiast dawnego {0,250}) między zamknięciem wywołania a
  // hakiem: ta sama integracja dołożyła `triggerRebelProtectionWarConsequence(...)` między
  // applyCityCaptureAfterBattle a tym hakiem -- czułość na usunięcie SAMEGO wywołania hooka
  // zostaje, budżet tylko wchłania nieistotny dla tej bramki sąsiedni kod.
  /function applyCityCaptureToMap\([\s\S]{0,1500}?applyCityCaptureAfterBattle\([\s\S]{0,2000}?\);\s*[\s\S]{0,400}?maybeResolveBronzeForcedWarOnCityCapture\(oldOwner, atkOwner\);/.test(mainSrc),
);

check(
  'resolveSiegeSurrender (kapitulacja głodowa): woła maybeResolveBronzeForcedWarOnCityCapture'
    + '(oldOwner, newOwner) PO city.ownerId = newOwner -- bez tego wojna wymuszona AI<->AI '
    + 'nigdy się nie kończy (negocjacje pokojowe obsługują wyłącznie targetId===0)',
  /function resolveSiegeSurrender\(cityId: string\): void \{[\s\S]{0,2000}?city\.ownerId = newOwner;[\s\S]{0,5000}?maybeResolveBronzeForcedWarOnCityCapture\(oldOwner, newOwner\);/.test(mainSrc),
);

console.log('');

// ---------------------------------------------------------------------------
// B3: sojusz z celem blokuje wybór -- main.ts (bronzeBlockedOwnerIds + relacjeDip AI<->AI) i ai.ts guard.
// ---------------------------------------------------------------------------
console.log('2. B3 -- aktywny sojusz z celem wyklucza go z puli wymuszonej wojny Brązu');

// R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1: `bronzeBlockedOwnerIds` (per-owner filtr,
// budowany wewnątrz ownerLoop) zniknęło -- zastąpione JEDNYM symetrycznym predykatem
// `isForcedWarPairBlocked`, wspólnym dla WSZYSTKICH trzech epok, wołanym przez
// `assignForcedWarPairings` PRZED `ownerLoop` (patrz forced-war-trojstronna-main-guard-test.cjs
// dla pełnego dowodu, ta sama trójka warunków NAP/peaceLock/sojusz zachowana 1:1).
check(
  'main.ts: sojusz (obok NAP i blokady pokoju) blokuje wybór pary WSZĘDZIE -- przez '
    + 'isForcedWarPairBlocked, wspólny predykat zastępujący dawne bronzeBlockedOwnerIds',
  /const isForcedWarPairBlocked = \(a: number, b: number\): boolean =>\s*\n\s*hasTreaty\(activeDeals, a, b, RodzajTraktatu\.PaktNieagresji\)\s*\n\s*\|\| isPeaceLockedBetween\(a, b\)\s*\n\s*\|\| allianceFormalKindBetween\(activeDeals, a, b\) !== null;/.test(mainSrc)
    && !mainSrc.includes('bronzeBlockedOwnerIds'),
);

check(
  'main.ts: relacjeDip AI<->AI (pętla "for (const otherId of aiOwnerList)") zasila '
    + 'hasAllianceTreaty: allianceFormalKindBetween(activeDeals, ownerId, otherId) !== null',
  /hasAllianceTreaty: allianceFormalKindBetween\(activeDeals, ownerId, otherId\) !== null,/.test(mainSrc),
);

check(
  'main.ts: diploInp przekazuje bronzeForceWarTargetId do DiplomacjaInputs',
  /clusterForceWarTargetId,\s*\n\s*bronzeForceWarTargetId,\s*\n\s*\};/.test(mainSrc),
);

check(
  'ai.ts: RelacjaWejscie deklaruje pole hasAllianceTreaty?: boolean',
  /hasAllianceTreaty\?: boolean;/.test(aiSrc),
);

check(
  'ai.ts: decideAIDiplomacy guard bronzeForceWarTargetId sprawdza !forcedRel.hasAllianceTreaty '
    + 'obok !forcedRel.stanWojny / !forcedRel.peaceLocked / !forcedRel.hasNapTreaty',
  /if \(inp\.bronzeForceWarTargetId != null\) \{[\s\S]{0,400}?&& !forcedRel\.stanWojny\s*&& !forcedRel\.peaceLocked\s*&& !forcedRel\.hasNapTreaty\s*&& !forcedRel\.hasAllianceTreaty\s*\)/.test(aiSrc),
);

console.log('');

// ---------------------------------------------------------------------------
// B4: pending NIE kasowany bezwarunkowo -- tylko przy faktycznym sukcesie.
// ---------------------------------------------------------------------------
console.log('3. B4 -- pending konsumowany WYŁĄCZNIE przy udanym wypowiedzeniu wojny');

// Regresja z rundy 1: `if (wasPending) bronzeForceWarPendingOwners.delete(ownerId);` zaraz PO
// obliczeniu wasPending -- ten literalny wzorzec dziś NIE MOŻE wystąpić nigdzie w pliku.
check(
  'REGRESJA B4: wzorzec "if (wasPending) bronzeForceWarPendingOwners.delete(ownerId);" '
    + '(kasowanie NIEZALEŻNIE od wyniku próby) ma ZERO wystąpień w main.ts',
  !mainSrc.includes('if (wasPending) bronzeForceWarPendingOwners.delete(ownerId);'),
  'ten literalny wzorzec istniał w rundzie 1 -- jego powrót = regresja B4',
);

// R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1: pre-pass (PRZED ownerLoop) liczy teraz
// `alreadyAtWarAnyRole` RAZ dla WSZYSTKICH trzech epok, PRZED czytaniem `wasPending` per era
// (kolejność odwrócona względem starego per-owner bloku, bez zmiany SEDNA B4: `wasPending`
// zostaje CZYSTYM ODCZYTEM, bez towarzyszącego .delete() w tej samej linii/bloku).
check(
  'main.ts: wasPending Brązu obliczany jako CZYSTY ODCZYT (bronzeForceWarPendingOwners.has(ownerId)) '
    + 'bez towarzyszącego .delete() w tej samej linii/bloku odczytu',
  /const wasPending = bronzeForceWarPendingOwners\.has\(ownerId\);\s*\n\s*const hasActiveForcedWarAsAttacker = \[\.\.\.bronzeForceWarActiveByPairKey\.values\(\)\]/.test(mainSrc),
);

check(
  'main.ts: bronzeForceWarPendingOwners.delete(ownerId) występuje DOKŁADNIE 2x w całym pliku '
    + '-- (1) blok sukcesu wypowiedz_wojne (konsumpcja B4), (2) eliminateOwner (sprzątanie po '
    + 'eliminacji cywilizacji). Jeśli >2, ktoś dołożył trzecie (podejrzane) miejsce kasujące; '
    + 'jeśli <2, jedno z tych dwóch zniknęło',
  (mainSrc.match(/bronzeForceWarPendingOwners\.delete\(ownerId\)/g) || []).length === 2,
  'liczba wystąpień: ' + ((mainSrc.match(/bronzeForceWarPendingOwners\.delete\(ownerId\)/g) || []).length),
);

check(
  'main.ts: bronzeForceWarPendingOwners.delete(ownerId) leży w BLOKU SUKCESU -- bezpośrednio obok '
    + 'bronzeForceWarActiveByPairKey.set(...) i bronzeForceWarCycleOwners.add(ownerId), wewnątrz '
    + '"if (bronzeForceWarTargetId != null && targetId === bronzeForceWarTargetId)". '
    + 'R-WOJNA-WYMUSZONA-REGULY-Q1 (Część C): budżet {0,200} (zamiast dawnego dokładnego dopasowania) '
    + 'wchłania nowe pole `startTurn: turn,` dołożone do literału stanu pary bez utraty czułości na '
    + 'usunięcie samego wywołania .set/.add/.delete w tym bloku.',
  /if \(bronzeForceWarTargetId != null && targetId === bronzeForceWarTargetId\) \{\s*\n\s*bronzeForceWarActiveByPairKey\.set\(diploPairKey\(ownerId, targetId\), \{\s*\n\s*attackerId: ownerId, targetId, capturedByAttacker: 0, capturedByDefender: 0,[\s\S]{0,400}?\}\);\s*\n\s*bronzeForceWarCycleOwners\.add\(ownerId\);\s*\n\s*bronzeForceWarPendingOwners\.delete\(ownerId\);/.test(mainSrc),
);

console.log('');

// ---------------------------------------------------------------------------
// B5: 4 pola stanu w buildSaveGameSnapshot ORAZ restoreGameFromSave.
// ---------------------------------------------------------------------------
console.log('4. B5 -- 4 struktury stanu w snapshot ORAZ restore (save/load roundtrip wiązanie)');

check(
  'buildSaveGameSnapshot: woła serializeBronzeForcedWarState(pendingOwners, cycleOwners, '
    + 'restUntilByOwner, activeByPairKey) PRZED return',
  /function buildSaveGameSnapshot\(label\?: string\): SaveGame \{[\s\S]{0,3000}?const bronzeForceWarSave = serializeBronzeForcedWarState\(\s*bronzeForceWarPendingOwners,\s*bronzeForceWarCycleOwners,\s*bronzeForceWarRestUntilByOwner,\s*bronzeForceWarActiveByPairKey,\s*\);/.test(mainSrc),
);

const bronzeSaveFields = [
  'bronzeForceWarPendingOwners: bronzeForceWarSave.pendingOwners,',
  'bronzeForceWarCycleOwners: bronzeForceWarSave.cycleOwners,',
  'bronzeForceWarRestUntilByOwner: bronzeForceWarSave.restUntilByOwner,',
  'bronzeForceWarActiveByPairKey: bronzeForceWarSave.activeByPairKey,',
];
for (const [i, snippet] of bronzeSaveFields.entries()) {
  check(
    'meta w buildSaveGameSnapshot zawiera pole #' + (i + 1) + ': ' + JSON.stringify(snippet.split(':')[0]),
    mainSrc.includes(snippet),
  );
}

check(
  'restoreGameFromSave: woła restoreBronzeForcedWarState({...}) czytając saved.meta?.bronzeForceWar*',
  /function restoreGameFromSave\(saved: SaveGame\): void \{[\s\S]{0,50000}?const bronzeForceWarRestored = restoreBronzeForcedWarState\(\{\s*pendingOwners: saved\.meta\?\.bronzeForceWarPendingOwners as number\[\] \| undefined,\s*cycleOwners: saved\.meta\?\.bronzeForceWarCycleOwners as number\[\] \| undefined,\s*restUntilByOwner: saved\.meta\?\.bronzeForceWarRestUntilByOwner as Array<\[number, number\]> \| undefined,\s*activeByPairKey: saved\.meta\?\.bronzeForceWarActiveByPairKey as\s*Array<\[string, BronzeForcedWarPairState\]> \| undefined,\s*\}\);/.test(mainSrc),
);

check(
  'restoreGameFromSave: repopuluje WSZYSTKIE 4 struktury (.clear() + pętla .add()/.set()) '
    + 'z bronzeForceWarRestored. R-WOJNA-WYMUSZONA-REGULY-Q1 (Część C): pętla activeByPairKey '
    + 'teraz backfilluje `startTurn` (`{ ...st, startTurn: st.startTurn ?? turn }` zamiast gołego '
    + '`st`) -- regex dopuszcza DOWOLNĄ treść ciała pętli activeByPairKey ({0,200}), o ile nadal '
    + 'realnie .set()-uje do mapy w pętli po bronzeForceWarRestored.activeByPairKey (czułość na '
    + 'usunięcie SAMEJ pętli/repopulacji zostaje, czułość na DOKŁADNY kształt wnętrza — nie)',
  /bronzeForceWarPendingOwners\.clear\(\);\s*\n\s*for \(const oid of bronzeForceWarRestored\.pendingOwners\) bronzeForceWarPendingOwners\.add\(oid\);\s*\n\s*bronzeForceWarCycleOwners\.clear\(\);\s*\n\s*for \(const oid of bronzeForceWarRestored\.cycleOwners\) bronzeForceWarCycleOwners\.add\(oid\);\s*\n\s*bronzeForceWarRestUntilByOwner\.clear\(\);\s*\n\s*for \(const \[oid, t\] of bronzeForceWarRestored\.restUntilByOwner\) bronzeForceWarRestUntilByOwner\.set\(oid, t\);\s*\n\s*bronzeForceWarActiveByPairKey\.clear\(\);[\s\S]{0,400}?for \(const \[key, st\] of bronzeForceWarRestored\.activeByPairKey\) \{[\s\S]{0,150}?bronzeForceWarActiveByPairKey\.set\(key, [\s\S]{0,150}?\);/.test(mainSrc),
);

console.log('');

// ---------------------------------------------------------------------------
// Eligibility gate + cleanup at elimination (baseline coverage carried from round 1, still checked).
// ---------------------------------------------------------------------------
console.log('5. Baseline -- eligibility check obecny przed próbą, sprzątanie stanu przy eliminacji');

check(
  'main.ts: isEligibleForBronzeForcedWar({ isMainAiCiv: true, isAlreadyAtWarAnyRole: ..., '
    + 'currentTurn: turn, eraEnterTurn: ... }) wołane w gałęzi wasPending PRZED wyborem celu '
    + '(shouldSearch). R-WOJNA-WYMUSZONA-REGULY-Q1 (Część A): shouldSearch teraz zaczyna się od '
    + '`forcedWarDifficultyLevel !== 1 && (...)` (Część B, Łatwy) i isEligibleForBronzeForcedWar '
    + 'dostaje 2 nowe pola (próg 25 tur od wejścia w Brąz) -- regex dopuszcza to bez utraty '
    + 'czułości na usunięcie SAMEGO wywołania eligibility PRZED shouldSearch',
  /const shouldSearch = [\s\S]{0,80}?\(wasPending\s*\? isEligibleForBronzeForcedWar\(\{\s*isMainAiCiv: true,\s*isAlreadyAtWarAnyRole: alreadyAtWarAnyRole,[\s\S]{0,500}?\}\)\s*: searchingAfterRest\);/.test(mainSrc),
);

check(
  'main.ts: eliminateOwner() sprząta bronzeForceWarPendingOwners/CycleOwners/RestUntilByOwner '
    + 'oraz usuwa ownera z bronzeForceWarActiveByPairKey (jako attacker LUB target)',
  /bronzeForceWarPendingOwners\.delete\(ownerId\);\s*\n\s*bronzeForceWarCycleOwners\.delete\(ownerId\);\s*\n\s*bronzeForceWarRestUntilByOwner\.delete\(ownerId\);\s*\n\s*for \(const \[key, st\] of Array\.from\(bronzeForceWarActiveByPairKey\.entries\(\)\)\) \{\s*\n\s*if \(st\.attackerId === ownerId \|\| st\.targetId === ownerId\) \{/.test(mainSrc),
);

console.log('');

// ---------------------------------------------------------------------------
// RUNDA 3 (Evaluator PASS-WITH-NOTES runda 2, B6a): 4 nowe asercje regex łapiące mutacje,
// które PRZEŻYŁY kampanię 16 mutacji Evaluatora mimo że pełna bramka B1-B6 wyżej dawała
// ALL GREEN -- M19 (usunięcie auto-pokoju), M7 (diploPairKey bez sortowania), M12 (brak
// sprzątania w finalizePeaceTreatyBetween), M16 (utrata argumentu cooldownu).
// ---------------------------------------------------------------------------
console.log('6. RUNDA 3 (B6a) -- 4 nowe asercje łapiące M19/M7/M12/M16, które przeżyły rundę 2');

check(
  'maybeResolveBronzeForcedWarOnCityCapture(): woła finalizePeaceTreatyBetween(st.attackerId, '
    + 'st.targetId, WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR) -- Z ARGUMENTEM COOLDOWNU. '
    + 'Łapie DWIE mutacje jedną asercją: M19 (usunięcie SAMEGO wywołania auto-pokoju z wnętrza '
    + 'haka -- licznik nadal liczy, wojna AI<->AI nigdy się nie kończy) ORAZ M16 (utrata TEGO '
    + 'argumentu -- finalizePeaceTreatyBetween spada na domyślny PEACE_TREATY_LOCK_TURNS=10 '
    + 'zamiast WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR=20, cooldown cicho spada z 20 na 10)',
  /finalizePeaceTreatyBetween\(\s*st\.attackerId, st\.targetId, WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR,\s*\);/.test(mainSrc),
);

check(
  'maybeResolveBronzeForcedWarOnCityCapture(): wyszukuje stan pary przez diploPairKey(oldOwner, '
    + 'newOwner) -- NIE przez prostą interpolację stringów bez sortowania (M7: zamiana na np. '
    + '`${oldOwner}-${newOwner}` sprawia, że licznik działa TYLKO gdy oldOwner<newOwner, po cichu '
    + 'gubiąc połowę zdobyczy -- para (5,3) szuka innego klucza niż zapisana przy wypowiedzeniu '
    + 'wojny jako (3,5))',
  /const pairKey = diploPairKey\(oldOwner, newOwner\);/.test(mainSrc),
);

check(
  'finalizePeaceTreatyBetween(): zawiera blok sprzątający stan wojny wymuszonej Brązu -- '
    + 'bronzeForceWarActiveByPairKey.delete(bronzePairKey) + uzbrojenie odpoczynku napastnika '
    + '(bronzeForceWarRestUntilByOwner.set) -- WEWNĄTRZ CIAŁA TEJ FUNKCJI, nie tylko wywoływane '
    + 'przez nią. Łapie M12: pokój wynegocjowany NORMALNIE (nie przez próg miast wymuszonej '
    + 'wojny, np. zwykła oferta pokoju gracza/AI) zostawiałby martwy wpis w '
    + 'bronzeForceWarActiveByPairKey -- napastnik trwale i cicho wypadałby z cyklu (ta sama klasa '
    + 'błędu co B4 z rundy 1)',
  /function finalizePeaceTreatyBetween\([\s\S]{0,1600}?const bronzePairKey = diploPairKey\(proposerId, responderId\);\s*\n\s*const bronzeSt = bronzeForceWarActiveByPairKey\.get\(bronzePairKey\);\s*\n\s*if \(bronzeSt\) \{\s*\n\s*bronzeForceWarActiveByPairKey\.delete\(bronzePairKey\);\s*\n\s*bronzeForceWarRestUntilByOwner\.set\(bronzeSt\.attackerId, turn \+ WOJNA_WYMUSZONA_ODPOCZYNEK_TUR\);\s*\n\s*\}\s*\n\s*\}/.test(mainSrc),
);

check(
  'maybeResolveBronzeForcedWarOnCityCapture(): woła shouldEndBronzeForcedWarByCityCount(...) '
    + 'i wraca wcześnie (return) gdy próg NIE jest osiągnięty -- PRZED jakimkolwiek wywołaniem '
    + 'finalizePeaceTreatyBetween niżej w tej samej funkcji. Usunięcie tego warunku kończyłoby '
    + 'wojnę wymuszoną automatycznym pokojem po KAŻDYM pojedynczym przejęciu miasta między parą, '
    + 'nie dopiero po osiągnięciu progu WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE',
  /if \(!shouldEndBronzeForcedWarByCityCount\(st\.capturedByAttacker, st\.capturedByDefender\)\) return;[\s\S]{0,1300}?finalizePeaceTreatyBetween\(/.test(mainSrc),
);

console.log('');

// ---------------------------------------------------------------------------
// RUNDA 4 (Operator obrona rundy 1, Evaluator FAIL: "nowa wiązka R-WOJNA-WYMUSZONA-
// REGULY-Q1 -- Część B koordynacja/fallback/limit trudności, Część C limit czasu
// trwania, częściowo Część A licznik wejścia w Brąz -- nie ma ŻADNEGO main-guard
// chroniącego jej OKABLOWANIE w main.ts"). 3 nowe asercje, każda zweryfikowana
// mutacyjnie poza repo (wycięcie/okrojenie literału na kopii tekstu main.ts w
// locie, bez modyfikacji repo) -- w każdym przypadku odpowiadająca asercja
// czerwienieje. Czwarty punkt zarzutu (Kamień/pickStoneForcedWarTargetIdCoordinated)
// pokryty analogiczną asercją w forced-war-stone-main-guard-test.cjs.
// ---------------------------------------------------------------------------
console.log('7. RUNDA 4 (Operator obrona) -- Część A/B/C: koordynacja Brązu, limit czasu, licznik wejścia w Brąz');

// R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1: `pickBronzeForcedWarTargetIdCoordinated`
// zniknęła z main.ts (i z forced-war-bronze.ts) -- zastąpiona JEDNĄ wspólną procedurą
// `assignForcedWarPairings` wołaną RAZ na turę PRZED `ownerLoop`. Okablowanie tej procedury
// jest chronione przez forced-war-trojstronna-main-guard-test.cjs (który przejął rolę tej
// bramki dla WSZYSTKICH trzech epok naraz) oraz tools/wojna-wymuszona-parowanie-test.cjs
// (kontrakt czysty). Poniższa asercja (test starego, teraz nieistniejącego wywołania)
// USUNIĘTA -- nie osłabienie, tylko usunięcie martwego sprawdzenia po realnej zmianie API.
check(
  'main.ts: bronzeForceWarTargetId ustawiane z forcedWarAssignmentByOwner (nowy rdzeń '
    + 'parowania), nie z usuniętego pickBronzeForcedWarTargetIdCoordinated',
  mainSrc.includes("forcedWarOwnAssignment?.era === 'bronze' ? forcedWarOwnAssignment.targetId : undefined")
    && !mainSrc.includes('pickBronzeForcedWarTargetIdCoordinated'),
);

check(
  'main.ts: resolveForcedWarDurationLimits() faktycznie WOŁANE w pętli tury AI -- wewnątrz '
    + '"if (!aiCmdResume) {" OBOK pruneInvalidNegotiations(), PRZED reconcileAllOwnerErasFromResearch() '
    + '-- nie tylko zdefiniowane. Część C (limit trwania 25 tur, Kamień+Brąz) bez tego wywołania '
    + 'funkcja nigdy się nie uruchamia i żadna wojna wymuszona nie kończy się z powodu czasu. '
    + 'Zweryfikowano mutacyjnie: usunięcie SAMEJ linii wywołania (definicja funkcji nietknięta) '
    + 'czerwieni tę asercję.',
  /if \(!aiCmdResume\) \{\s*\n\s*try \{ pruneInvalidNegotiations\(\); \} catch \(ePrune\)[\s\S]{0,400}?try \{ resolveForcedWarDurationLimits\(\); \} catch \(eForcedWarDuration\) \{ console\.error\('\[Dyplomacja\] Blad limitu czasu wojny wymuszonej:', eForcedWarDuration\); \}\s*\n\s*\}\s*\n\s*reconcileAllOwnerErasFromResearch\(\);/.test(mainSrc),
);

check(
  'main.ts: przy awansie Kamień(1)→Brąz(2) (obok bronzeForceWarPendingOwners.add(ownerId)) '
    + 'wołane JEST bronzeEraEnterTurnByOwner.set(ownerId, turn) -- Część A: bez tego zapisu próg '
    + '„25 tur od wejścia w Brąz" (isEligibleForBronzeForcedWar eraEnterTurn) nie ma od czego liczyć '
    + 'dla nowo awansowanych cywilizacji. Zweryfikowano mutacyjnie: usunięcie SAMEJ linii .set() '
    + '(pozostawiając .add(ownerId) i resztę bloku awansu) czerwieni tę asercję.',
  /if \(\s*\n\s*prev === 1 && next === 2\s*\n\s*&& !isOwnerClusterCityState\(ownerId, ownerCityStateOpts\(\)\)\s*\n\s*\) \{\s*\n\s*bronzeForceWarPendingOwners\.add\(ownerId\);[\s\S]{0,400}?bronzeEraEnterTurnByOwner\.set\(ownerId, turn\);\s*\n\s*\}/.test(mainSrc),
);

console.log('');

console.log('========================================================================');
console.log('WYNIK: ' + passCount + ' PASS, ' + failCount + ' FAIL');
console.log('========================================================================');
if (failCount > 0) process.exit(1);
