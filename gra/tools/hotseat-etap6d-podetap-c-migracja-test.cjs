'use strict';
/**
 * hotseat-etap6d-podetap-c-migracja-test.cjs — bramka R-HOTSEAT-ETAP6D-PODETAP-C-Q1.
 *
 * Dowodzi migracji 5 funkcji main.ts z literału `0` na `isMe()`/`ME()` (klaster
 * "perspektywa aktywnego fotela") albo `HUMAN_OWNER_PRIMARY` (klaster "stan pary",
 * wzorem `endActiveHumanTurn(HUMAN_OWNER_PRIMARY)` już w main.ts) — wg tabeli aliasów
 * `00-dispatch.md`:
 *   isHuman/HUMAN_OWNER_PRIMARY: applyClusterStartPlan, spawnPendingSameTypeRivals
 *   isMe/ME():                   finalizeAllianceObligationRefusals,
 *                                 resolvePendingDiplomacy, restoreGameFromSave
 *
 * METODA (dwie części, wzorem `hotseat-etap6f-start-migracja-test.cjs` /
 * `hotseat-etap6d-diplomacy-engine-test.cjs`):
 *
 * Część 1 — klaster isHuman/HUMAN_OWNER_PRIMARY (applyClusterStartPlan,
 * spawnPendingSameTypeRivals): HUMAN_OWNER_PRIMARY jest DZIŚ stałą kompilacyjną (=0,
 * human-owners.ts), więc migracja nie ma runtime'owej gałęzi do rozjechania na [0] vs
 * [0,1] — dowód "nie tautologia" jest tu na poziomie TEKSTU ŹRÓDŁOWEGO: ekstrakcja ciała
 * obu funkcji z BIEŻĄCEGO main.ts i asercja, że (a) żaden z hardkodowanych `setDiploRelation(0,`/
 * `getWiarygodnosc(0)` już nie istnieje w tych dwóch ciałach, (b) `HUMAN_OWNER_PRIMARY`
 * jest użyty na każdym z 4 miejsc z tabeli dispatchu. Reguła czerwienieje na regresji
 * (powrót literału `0` albo usunięcie stałej) — nie jest zieloną niezależnie od treści pliku.
 *
 * Część 2 — klaster isMe/ME() (finalizeAllianceObligationRefusals,
 * resolvePendingDiplomacy, restoreGameFromSave): odtwarza WERSJĘ SPRZED (`ownerId===0`/
 * `!==0`/argument `0`, main.ts przed tą rundą) i WERSJĘ PO (`isMe(ownerId)`/`ME()`, main.ts
 * po tej rundzie) jako niezależne funkcje nad tym samym stanem wejściowym:
 * (1) `humanOwnerIds=[0]` (dzisiejszy jedyny stan produkcyjny) → PRE i POST dają WYNIK
 *     IDENTYCZNY (no-op behawioralny, bo isMe(0)===true, ME()===0 zawsze);
 * (2) `humanOwnerIds=[0,1]`, `activeHumanOwnerId=1` (symulowany drugi fotel, aktywny) →
 *     PRE i POST się ROZJEŻDŻAJĄ — dowód nietautologiczności, nie tylko potwierdzenie
 *     identyczności.
 *
 * Run: node tools/hotseat-etap6d-podetap-c-migracja-test.cjs (z katalogu gra/)
 */

const fs = require('fs');
const path = require('path');

const MAIN_TS = path.resolve(__dirname, '..', 'src', 'main.ts');
const src = fs.readFileSync(MAIN_TS, 'utf8');

let failures = 0;
function check(name, cond, detail) {
  if (cond) {
    console.log(`OK: ${name}`);
  } else {
    console.error(`FAIL: ${name}` + (detail !== undefined ? ` -- ${detail}` : ''));
    failures++;
  }
}

function extractFunctionBody(fnSignatureNeedle, label) {
  const startIdx = src.indexOf(fnSignatureNeedle);
  if (startIdx < 0) {
    throw new Error(`extractFunctionBody(${label}): sygnatura nie znaleziona -- main.ts ` +
      `zmienił się od czasu napisania tej bramki, zaktualizuj needle.`);
  }
  // Krok 1: zbalansuj NAWIASY listy parametrów (mogą zawierać własne `{...}` w typach
  // obiektowych, np. `opts?: { skipRenderRefresh?: boolean }`) -- zaczynamy od '(' zaraz
  // po sygnaturze, nie od pierwszego '{' (to złapałoby '{' z wnętrza typu parametru).
  const parenStart = src.indexOf('(', startIdx);
  let pdepth = 0;
  let j = parenStart;
  for (; j < src.length; j++) {
    if (src[j] === '(') pdepth++;
    else if (src[j] === ')') {
      pdepth--;
      if (pdepth === 0) break;
    }
  }
  if (pdepth !== 0) throw new Error(`extractFunctionBody(${label}): nawiasy parametrów się nie zbilansowały`);
  // Krok 2: dopiero PO domknięciu listy parametrów szukaj '{' ciała funkcji.
  const braceStart = src.indexOf('{', j);
  let depth = 0;
  let i = braceStart;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  if (depth !== 0) throw new Error(`extractFunctionBody(${label}): klamry ciała się nie zbilansowały`);
  return src.slice(startIdx, i + 1);
}

// ============================================================
// CZĘŚĆ 1 — klaster isHuman/HUMAN_OWNER_PRIMARY (wartościowy, nie predykat)
// ============================================================

{
  const body = extractFunctionBody('function applyClusterStartPlan(', 'applyClusterStartPlan');
  check('applyClusterStartPlan: brak literału setDiploRelation(0,', !/setDiploRelation\(\s*0\s*,/.test(body));
  check('applyClusterStartPlan: brak literału getWiarygodnosc(0)', !/getWiarygodnosc\(\s*0\s*\)/.test(body));
  const hcCount = (body.match(/HUMAN_OWNER_PRIMARY/g) || []).length;
  check('applyClusterStartPlan: HUMAN_OWNER_PRIMARY użyty >=3x (setDiploRelation arg1 + 2x getWiarygodnosc)', hcCount >= 3, hcCount);
}

{
  const body = extractFunctionBody('function spawnPendingSameTypeRivals(', 'spawnPendingSameTypeRivals');
  check('spawnPendingSameTypeRivals: brak literału setDiploRelation(0,', !/setDiploRelation\(\s*0\s*,/.test(body));
  check('spawnPendingSameTypeRivals: brak literału getWiarygodnosc(0)', !/getWiarygodnosc\(\s*0\s*\)/.test(body));
  const hcCount = (body.match(/HUMAN_OWNER_PRIMARY/g) || []).length;
  check('spawnPendingSameTypeRivals: HUMAN_OWNER_PRIMARY użyty >=2x (setDiploRelation arg1 + getWiarygodnosc)', hcCount >= 2, hcCount);
}

// ============================================================
// CZĘŚĆ 2 — klaster isMe/ME() — źródło: brak regresji literału + logika PRE/POST
// ============================================================

{
  const body = extractFunctionBody('function finalizeAllianceObligationRefusals(', 'finalizeAllianceObligationRefusals');
  check('finalizeAllianceObligationRefusals: brak literału === 0 / syncRelationFromDeals(0,',
    !/deal\.strony\[\d\]\s*===\s*0/.test(body) && !/syncRelationFromDeals\(\s*0\s*,/.test(body));
  check('finalizeAllianceObligationRefusals: isMe()/ME() obecne', /isMe\(/.test(body) && /ME\(\)/.test(body));
}

{
  const body = extractFunctionBody('function resolvePendingDiplomacy(', 'resolvePendingDiplomacy');
  check('resolvePendingDiplomacy: brak literałowych argumentów getDiploRelation(0,/setDiploRelation(0,/finalizePeaceTreatyBetween(0,',
    !/getDiploRelation\(\s*0\s*,/.test(body)
    && !/setDiploRelation\(\s*0\s*,/.test(body)
    && !/finalizePeaceTreatyBetween\(\s*0\s*,/.test(body));
  const meCount = (body.match(/ME\(\)/g) || []).length;
  check('resolvePendingDiplomacy: ME() użyty >=5x (curRel, pokój, cmd, wynik, trybut)', meCount >= 5, meCount);
}

{
  const body = extractFunctionBody('function restoreGameFromSave(', 'restoreGameFromSave');
  check('restoreGameFromSave: brak literału proposerOwnerId === 0 (stół negocjacyjny)',
    !/entry\.proposerOwnerId\s*===\s*0/.test(body));
  check('restoreGameFromSave: brak literału oid !== 0 / syncRelationFromDeals(0, oid) (kontakty)',
    !/if\s*\(\s*oid\s*!==\s*0\s*\)\s*syncRelationFromDeals\(\s*0\s*,\s*oid\s*\)/.test(body));
  check('restoreGameFromSave: isMe()/ME() obecne (oba hardkody)', /isMe\(entry\.proposerOwnerId\)/.test(body)
    && /!isMe\(oid\)\s*\)\s*syncRelationFromDeals\(\s*ME\(\)/.test(body));
}

// --- Logika PRE/POST dla klastra isMe/ME(), analogicznie do hotseat-etap6f/6d-diplomacy ---

function isHumanOwner(seats, ownerId) { return seats.humanOwnerIds.includes(ownerId); }

/** finalizeAllianceObligationRefusals — filtr "czyj to sojusz zerwany" -- WERSJA SPRZED. */
function refusalOwnerPre(dealSideA, dealSideB) {
  if (dealSideA === 0) return dealSideB;
  if (dealSideB === 0) return dealSideA;
  return null;
}
/** WERSJA PO. */
function refusalOwnerPost(dealSideA, dealSideB, isMe) {
  if (isMe(dealSideA)) return dealSideB;
  if (isMe(dealSideB)) return dealSideA;
  return null;
}

/** resolvePendingDiplomacy — para (gracz, ownerId) dla getDiploRelation -- WERSJA SPRZED. */
function pairPre(ownerId) { return [0, ownerId]; }
/** WERSJA PO. */
function pairPost(ownerId, ME) { return [ME(), ownerId]; }

/** restoreGameFromSave — negotiationTable filtr otherOwnerId -- WERSJA SPRZED. */
function otherOwnerPre(entry) {
  return entry.proposerOwnerId === 0 ? entry.responderOwnerId : entry.proposerOwnerId;
}
/** WERSJA PO. */
function otherOwnerPost(entry, isMe) {
  return isMe(entry.proposerOwnerId) ? entry.responderOwnerId : entry.proposerOwnerId;
}

/** restoreGameFromSave — pętla diplomaticContactEstablished sync -- WERSJA SPRZED. */
function syncTargetsPre(contacts) { return contacts.filter((oid) => oid !== 0); }
/** WERSJA PO. */
function syncTargetsPost(contacts, isMe) { return contacts.filter((oid) => !isMe(oid)); }

// --- Scenariusz A: single-human [0] (dzisiejszy stan produkcyjny) — no-op ---
{
  const seats = { humanOwnerIds: [0], activeHumanOwnerId: 0 };
  const isMe = (oid) => oid === seats.activeHumanOwnerId;
  const ME = () => seats.activeHumanOwnerId;

  check('[0] refusalOwner: PRE==POST dla (0,7)', refusalOwnerPre(0, 7) === refusalOwnerPost(0, 7, isMe));
  check('[0] refusalOwner: PRE==POST dla (7,0)', refusalOwnerPre(7, 0) === refusalOwnerPost(7, 0, isMe));
  check('[0] refusalOwner: PRE==POST dla (3,4) (brak gracza w parze)', refusalOwnerPre(3, 4) === refusalOwnerPost(3, 4, isMe));
  check('[0] pair: PRE==POST dla ownerId=5', JSON.stringify(pairPre(5)) === JSON.stringify(pairPost(5, ME)));
  check('[0] otherOwner: PRE==POST', otherOwnerPre({ proposerOwnerId: 0, responderOwnerId: 9 })
    === otherOwnerPost({ proposerOwnerId: 0, responderOwnerId: 9 }, isMe));
  check('[0] otherOwner (odwrotnie): PRE==POST', otherOwnerPre({ proposerOwnerId: 9, responderOwnerId: 0 })
    === otherOwnerPost({ proposerOwnerId: 9, responderOwnerId: 0 }, isMe));
  check('[0] syncTargets: PRE==POST', JSON.stringify(syncTargetsPre([0, 5, 6]))
    === JSON.stringify(syncTargetsPost([0, 5, 6], isMe)));
}

// --- Scenariusz B (KLUCZOWY, PRZECIW SAMOOSZUKIWANIU): humanOwnerIds=[0,1], aktywny=1 ---
{
  const seats = { humanOwnerIds: [0, 1], activeHumanOwnerId: 1 };
  const isMe = (oid) => oid === seats.activeHumanOwnerId;
  const ME = () => seats.activeHumanOwnerId;

  // refusalOwner: SPRZED zawsze pyta o fotel 0 (nieaktywny w tym scenariuszu) -- fotel
  // AKTYWNY (1) traktowany jak zwykłe AI -> regresja: sojusz zerwany PRZEZ fotel 1
  // (aktywny gracz) NIE zostaje wykryty jako "playerRefusalAlly".
  check('SPRZED (regresja): refusalOwner(1,7) z aktywnym fotelem=1 fałszywie zwraca null (literał 0 = "to JA")',
    refusalOwnerPre(1, 7) === null);
  check('PO: refusalOwner(1,7) z ME()===1 zwraca 7 (rozpoznaje aktywny fotel jako "ja")',
    refusalOwnerPost(1, 7, isMe) === 7);
  check('PO != SPRZED dla refusalOwner(1,7) (migracja realnie coś zmienia)',
    refusalOwnerPre(1, 7) !== refusalOwnerPost(1, 7, isMe));

  check('SPRZED (regresja): pair(7) używa literału 0 zamiast aktywnego fotela 1', JSON.stringify(pairPre(7)) === '[0,7]');
  check('PO: pair(7) używa ME()===1', JSON.stringify(pairPost(7, ME)) === '[1,7]');
  check('PO != SPRZED dla pair(7)', JSON.stringify(pairPre(7)) !== JSON.stringify(pairPost(7, ME)));

  check('SPRZED (regresja): otherOwner({proposer:1,responder:9}) fałszywie zwraca 1 (proposer), bo literał 0 nie rozpoznaje fotelu 1 jako "ja"',
    otherOwnerPre({ proposerOwnerId: 1, responderOwnerId: 9 }) === 1);
  check('PO: otherOwner({proposer:1,responder:9}) poprawnie zwraca 9 (isMe(1)===true -- proposer to AKTYWNY fotel, druga strona to 9)',
    otherOwnerPost({ proposerOwnerId: 1, responderOwnerId: 9 }, isMe) === 9);
  check('PO != SPRZED dla otherOwner({proposer:1,responder:9}) (migracja realnie coś zmienia)',
    otherOwnerPre({ proposerOwnerId: 1, responderOwnerId: 9 }) !== otherOwnerPost({ proposerOwnerId: 1, responderOwnerId: 9 }, isMe));
  // Rozjazd widoczny gdy proposer to fotel NIEaktywny 0, responder to fotel aktywny 1:
  // SPRZED traktuje 0 jako "gracz" (poprawnie z nazwy, ale przez PRZYPADEK -- to fotel 0,
  // nie fotel aktywny), POST poprawnie identyfikuje fotel AKTYWNY (1) jako "ja" mimo że
  // proposerOwnerId=0 (nieaktywny fotel człowieka).
  check('SPRZED (regresja): otherOwner({proposer:0,responder:1}) fałszywie zwraca 1 (literał 0="ja", ignoruje że AKTYWNY to fotel 1)',
    otherOwnerPre({ proposerOwnerId: 0, responderOwnerId: 1 }) === 1);
  check('PO: otherOwner({proposer:0,responder:1}) zwraca 0 -- fotel 0 NIE jest "ja" (aktywny=1), więc drugą stroną jest 0',
    otherOwnerPost({ proposerOwnerId: 0, responderOwnerId: 1 }, isMe) === 0);
  check('PO != SPRZED dla otherOwner({proposer:0,responder:1}) (migracja realnie coś zmienia)',
    otherOwnerPre({ proposerOwnerId: 0, responderOwnerId: 1 }) !== otherOwnerPost({ proposerOwnerId: 0, responderOwnerId: 1 }, isMe));

  check('SPRZED (regresja): syncTargets([0,1,5]) fałszywie zostawia fotel aktywny 1 w liście "AI do zsynchronizowania"',
    JSON.stringify(syncTargetsPre([0, 1, 5])) === '[1,5]');
  check('PO: syncTargets([0,1,5]) poprawnie wyklucza fotel aktywny 1, zostawia 0 i 5',
    JSON.stringify(syncTargetsPost([0, 1, 5], isMe)) === '[0,5]');
  check('PO != SPRZED dla syncTargets([0,1,5])',
    JSON.stringify(syncTargetsPre([0, 1, 5])) !== JSON.stringify(syncTargetsPost([0, 1, 5], isMe)));
}

if (failures > 0) {
  console.error(`\n${failures} FAILURE(S)`);
  process.exit(1);
}
console.log('\nWSZYSTKIE TESTY PASS (hotseat-etap6d-podetap-c-migracja-test)');
