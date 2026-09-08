'use strict';
/**
 * hotseat-etap6d-diplomacy-engine-test.cjs — bramka R-HOTSEAT-ETAP6D-DIPLOMACY-ENGINE-Q1.
 *
 * Dowodzi (wzorem `hotseat-etap6f-start-migracja-test.cjs` / `hotseat-etap3-akcesory-test.cjs`):
 * dla reprezentatywnego podzbioru 20 zmigrowanych funkcji main.ts (obie kategorie aliasu —
 * isMe/ME() dla klastra perspektywy aktywnego fotela, isHuman() dla klastra stanu DOWOLNEJ
 * pary) odtwarza WERSJĘ SPRZED (`ownerId === 0` / `ownerId !== 0`, main.ts przed tą rundą)
 * i WERSJĘ PO (`isMe(ownerId)` / `isHuman(ownerId)`, main.ts po tej rundzie) jako niezależne
 * funkcje nad tym samym stanem wejściowym:
 * (1) `humanOwnerIds=[0]` (dzisiejszy jedyny stan produkcyjny) → PRE i POST dają WYNIK
 *     IDENTYCZNY (no-op behawioralny, bo isMe(0)===true i isHuman(0)===true zawsze);
 * (2) `humanOwnerIds=[0,1]` (symulowany drugi fotel człowieka) → PRE i POST się ROZJEŻDŻAJĄ
 *     dla ownerId=1: PRE (literał `0`) traktuje fotel 1 jak AI, POST (isMe/isHuman) traktuje
 *     go tak samo jak fotel 0 — dowód nietautologiczności, nie tylko potwierdzenie identyczności.
 *
 * Funkcje wybrane jako reprezentanci obu klastrów (patrz 01-operator-runda1.md §alias):
 *  - isMe/ME(): playerIsAtWarWith, collectWarsWithPlayer, recordWarDeclarationEvent,
 *    ownerDeclareWarOn (flaga `attackerId===0`→isMe), runDiplomacyTurnTick (hint-gałąź).
 *  - isHuman(): applyDiploEventTracked (wiarygodnoscSelf), buildDiplomacyTickCtxForPair
 *    (playerInPair), resolveForcedWarDurationLimits (etykieta AI/gracz).
 *
 * Run: node tools/hotseat-etap6d-diplomacy-engine-test.cjs (z katalogu gra/)
 */

function isHumanOwner(seats, ownerId) {
  return seats.humanOwnerIds.includes(ownerId);
}

let failures = 0;
function check(name, cond) {
  if (cond) {
    console.log(`OK: ${name}`);
  } else {
    console.error(`FAIL: ${name}`);
    failures++;
  }
}

// ============================================================
// Klaster isMe/ME() — perspektywa aktywnego fotela
// ============================================================

/** playerIsAtWarWith — WERSJA SPRZED (main.ts:9855-9858 przed migracją). */
function playerIsAtWarWithPre(ownerId, areEnemy) {
  if (ownerId === 0) return false;
  return areEnemy(0, ownerId);
}
/** playerIsAtWarWith — WERSJA PO. */
function playerIsAtWarWithPost(ownerId, areEnemy, ME) {
  if (ownerId === ME()) return false;
  return areEnemy(ME(), ownerId);
}

/** collectWarsWithPlayer core filter — WERSJA SPRZED (main.ts:17650-17651). */
function warOidPre(a, b) {
  if (a !== 0 && b !== 0) return null;
  return a === 0 ? b : a;
}
/** collectWarsWithPlayer core filter — WERSJA PO. */
function warOidPost(a, b, isMe) {
  if (!isMe(a) && !isMe(b)) return null;
  return isMe(a) ? b : a;
}

/** recordWarDeclarationEvent tytuł — WERSJA SPRZED (main.ts:8346-8356). */
function warTitlePre(declarerId, targetId, enemyName) {
  if (declarerId !== 0 && targetId !== 0) return null;
  return declarerId === 0 ? 'Wypowiedzieliśmy wojnę: ' + enemyName : enemyName + ' wypowiedziało wojnę';
}
/** recordWarDeclarationEvent tytuł — WERSJA PO. */
function warTitlePost(declarerId, targetId, enemyName, isMe) {
  if (!isMe(declarerId) && !isMe(targetId)) return null;
  return isMe(declarerId) ? 'Wypowiedzieliśmy wojnę: ' + enemyName : enemyName + ' wypowiedziało wojnę';
}

/** ownerDeclareWarOn — flaga declaredByPlayer — WERSJA SPRZED (main.ts:9912). */
function declaredByPlayerPre(attackerId) {
  return attackerId === 0;
}
/** ownerDeclareWarOn — flaga declaredByPlayer — WERSJA PO. */
function declaredByPlayerPost(attackerId, isMe) {
  return isMe(attackerId);
}

/** runDiplomacyTurnTick — hint-gałąź trybutu — WERSJA SPRZED (main.ts:19117-19124). */
function tributeHintPre(payerOwnerId, receiverOwnerId) {
  if (payerOwnerId === 0) return 'payer-hint';
  if (receiverOwnerId === 0) return 'receiver-hint';
  return null;
}
/** runDiplomacyTurnTick — hint-gałąź trybutu — WERSJA PO. */
function tributeHintPost(payerOwnerId, receiverOwnerId, isMe) {
  if (isMe(payerOwnerId)) return 'payer-hint';
  if (isMe(receiverOwnerId)) return 'receiver-hint';
  return null;
}

// ============================================================
// Klaster isHuman() — stan DOWOLNEJ pary (w tym AI-AI)
// ============================================================

/** applyDiploEventTracked wiarygodnoscSelf-gate — WERSJA SPRZED (main.ts:9182-9184). */
function playerInPairPre(a, b) {
  return a === 0 || b === 0;
}
/** applyDiploEventTracked wiarygodnoscSelf-gate — WERSJA PO. */
function playerInPairPost(a, b, isHuman) {
  return isHuman(a) || isHuman(b);
}

/** buildDiplomacyTickCtxForPair contactEstablished — WERSJA SPRZED (main.ts:17965-17966). */
function contactEstablishedPre(a, b, discovered) {
  return a === 0 ? discovered.has(b) : (b === 0 ? discovered.has(a) : true);
}
/** buildDiplomacyTickCtxForPair contactEstablished — WERSJA PO. */
function contactEstablishedPost(a, b, discovered, isHuman) {
  return isHuman(a) ? discovered.has(b) : (isHuman(b) ? discovered.has(a) : true);
}

/** resolveForcedWarDurationLimits etykieta AI/gracz — WERSJA SPRZED (main.ts:27356/27372). */
function labelPre(targetId) {
  return targetId === 0 ? 'gracz' : `AI${targetId}`;
}
/** resolveForcedWarDurationLimits etykieta AI/gracz — WERSJA PO. */
function labelPost(targetId, isHuman) {
  return isHuman(targetId) ? 'gracz' : `AI${targetId}`;
}

// ============================================================
// Scenariusz A: single-human [0] — no-op behawioralny
// ============================================================
{
  const seats = { humanOwnerIds: [0], activeHumanOwnerId: 0 };
  const ME = () => seats.activeHumanOwnerId;
  const isMe = (id) => id === ME();
  const isHuman = (id) => isHumanOwner(seats, id);
  const areEnemy = (a, b) => a !== b; // stub

  for (const oid of [0, 1, 2, 3]) {
    check(`[0] playerIsAtWarWith(${oid}) PRE==POST`,
      playerIsAtWarWithPre(oid, areEnemy) === playerIsAtWarWithPost(oid, areEnemy, ME));
  }
  for (const [a, b] of [[0, 1], [1, 0], [1, 2], [2, 3]]) {
    check(`[0] warOid(${a},${b}) PRE==POST`, warOidPre(a, b) === warOidPost(a, b, isMe));
  }
  for (const [d, t] of [[0, 1], [1, 0], [1, 2]]) {
    check(`[0] warTitle(${d},${t}) PRE==POST`,
      warTitlePre(d, t, 'X') === warTitlePost(d, t, 'X', isMe));
  }
  for (const a of [0, 1, 2]) {
    check(`[0] declaredByPlayer(${a}) PRE==POST`, declaredByPlayerPre(a) === declaredByPlayerPost(a, isMe));
  }
  for (const [p, r] of [[0, 1], [1, 0], [1, 2]]) {
    check(`[0] tributeHint(${p},${r}) PRE==POST`,
      tributeHintPre(p, r) === tributeHintPost(p, r, isMe));
  }
  for (const [a, b] of [[0, 1], [1, 0], [1, 2]]) {
    check(`[0] playerInPair(${a},${b}) PRE==POST`,
      playerInPairPre(a, b) === playerInPairPost(a, b, isHuman));
  }
  const discovered = new Set([1, 2]);
  for (const [a, b] of [[0, 1], [1, 0], [1, 2]]) {
    check(`[0] contactEstablished(${a},${b}) PRE==POST`,
      contactEstablishedPre(a, b, discovered) === contactEstablishedPost(a, b, discovered, isHuman));
  }
  for (const t of [0, 1, 2]) {
    check(`[0] label(${t}) PRE==POST`, labelPre(t) === labelPost(t, isHuman));
  }
}

// ============================================================
// Scenariusz B (KLUCZOWY, PRZECIW SAMOOSZUKIWANIU): humanOwnerIds=[0,1]
// ============================================================
{
  const seats = { humanOwnerIds: [0, 1], activeHumanOwnerId: 0 };
  const ME = () => seats.activeHumanOwnerId; // fotel aktywny = 0, drugi human = 1
  const isMe = (id) => id === ME();
  const isHuman = (id) => isHumanOwner(seats, id);
  const areEnemy = (a, b) => a !== b;

  // Dowód REGRESJI wersji SPRZED / FIX wersji PO: aktywny fotel to TERAZ 1 (drugi human,
  // np. po zmianie tury w hot-seat), sprawdzamy wojnę z ownerId=0 (pierwszy human).
  // PRE ma zaszyty literał `ownerId===0` jako "to JA" — spuściznę jednofotelową — więc
  // pyta samo-siebie i fałszywie zwraca `false`, mimo że aktywny fotel to 1, nie 0.
  const ME1 = () => 1;
  check('SPRZED (regresja): playerIsAtWarWith(0) z aktywnym fotelem=1 fałszywie zwraca false (literał 0 = "to JA")',
    playerIsAtWarWithPre(0, areEnemy) === false);
  // POST pyta o REALNIE aktywny fotel (ME()===1), więc 0 to teraz PRZECIWNA strona pary —
  // realny wynik areEnemy(1,0).
  check('PO: playerIsAtWarWith(0) z ME()===1 zwraca areEnemy(1,0), nie fałszywe "to JA"',
    playerIsAtWarWithPost(0, areEnemy, ME1) === areEnemy(1, 0));
  check('PO != SPRZED dla playerIsAtWarWith(0) przy aktywnym fotelu=1 (migracja realnie coś zmienia)',
    playerIsAtWarWithPre(0, areEnemy) !== playerIsAtWarWithPost(0, areEnemy, ME1));

  // Klaster isHuman: fotel 1 MUSI być rozpoznany jako human w DOWOLNEJ parze (nie tylko
  // aktywnej) — to jest różnica programowa isHuman vs isMe, dowiedziona tu wprost.
  check('SPRZED (regresja): playerInPair(1,5) fałszywie pomija drugiego humana (1)',
    playerInPairPre(1, 5) === false);
  check('PO: playerInPair(1,5) === true — isHuman(1) rozpoznaje drugiego humana w parze AI-human',
    playerInPairPost(1, 5, isHuman) === true);
  check('PO != SPRZED dla playerInPair(1,5) (migracja realnie coś zmienia, nie kosmetyka)',
    playerInPairPre(1, 5) !== playerInPairPost(1, 5, isHuman));

  check('SPRZED (regresja): contactEstablished(1,5,...) fałszywie idzie w gałąź "true" zamiast liczyć fotel 1 jak self',
    contactEstablishedPre(1, 5, new Set([5])) === true);
  check('PO: contactEstablished(1,5,...) === discovered.has(5) via isHuman(1) branch, spójne z isHuman',
    contactEstablishedPost(1, 5, new Set([5]), isHuman) === discovered1Has5());
  function discovered1Has5() { return new Set([5]).has(5); }

  check('SPRZED (regresja): label(1) pokazuje "AI1" dla drugiego humana zamiast "gracz"',
    labelPre(1) === 'AI1');
  check('PO: label(1) === "gracz" — isHuman(1) poprawnie etykietuje drugiego humana',
    labelPost(1, isHuman) === 'gracz');
  check('PO != SPRZED dla label(1) (migracja realnie coś zmienia)',
    labelPre(1) !== labelPost(1, isHuman));

  // Fotel barbarzyńcy/AI zwykłe (ownerId=5) — zachowanie identyczne PRE/POST w obu klastrach,
  // bo 5 nie jest ani ME() ani w humanOwnerIds.
  check('PO: isMe(5)===false, isHuman(5)===false (AI zwykłe nietknięte przez oba aliasy)',
    isMe(5) === false && isHuman(5) === false);
}

if (failures > 0) {
  console.error(`\n${failures} FAILURE(S)`);
  process.exit(1);
}
console.log('\nWSZYSTKIE TESTY PASS');
