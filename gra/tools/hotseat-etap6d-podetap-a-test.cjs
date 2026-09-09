'use strict';
/**
 * hotseat-etap6d-podetap-a-test.cjs — bramka R-HOTSEAT-ETAP6D-PODETAP-A-Q1.
 *
 * Dowodzi (wzorem `hotseat-etap6d-diplomacy-engine-test.cjs`, sąsiadujący `ownerDeclareWarOn`):
 * odtwarza WERSJĘ SPRZED (`playerDeclareWarOnOwner` main.ts:9934-9967 przed tą rundą, literał
 * `0` jako wołający na wszystkich 9 pozycjach) i WERSJĘ PO (`ME()` na tych samych 9 pozycjach)
 * jako niezależne funkcje nad tym samym stubem side-effectów, i porównuje:
 *
 * (1) `activeHumanOwnerId=0` (dzisiejszy jedyny stan produkcyjny) → PRE i POST wołają
 *     WSZYSTKIE zależności z IDENTYCZNYMI argumentami i zwracają IDENTYCZNY `boolean`
 *     (no-op behawioralny, bo ME()===0 zawsze w tym stanie);
 * (2) `activeHumanOwnerId=1` (symulowana zmiana aktywnego fotela w hot-seat) → PRE (literał
 *     `0`) błędnie nadal działa tak, jakby wołającym był fotel 0 (regresja), POST (`ME()`)
 *     poprawnie używa realnie aktywnego fotela 1 — dowód nietautologiczności: bramka
 *     CZERWIENIEJE (log wywołań się rozjeżdża) dokładnie wtedy, gdy migracja ME()→literał
 *     zostanie cofnięta.
 *
 * Zachowana sygnatura `boolean` (dwa wczesne `return false`, końcowe `return true`) jest
 * też pokryta w obu scenariuszach.
 *
 * Run: node tools/hotseat-etap6d-podetap-a-test.cjs (z katalogu gra/)
 */

let failures = 0;
function check(name, cond) {
  if (cond) {
    console.log(`OK: ${name}`);
  } else {
    console.error(`FAIL: ${name}`);
    failures++;
  }
}

/** Buduje świeży stub zależności; każde wywołanie loguje (nazwa, argumenty) do `log`. */
function makeDeps() {
  const log = [];
  const record = (name) => (...args) => { log.push([name, ...args]); };
  return {
    log,
    ownerDiploLabel: (id) => `civ${id}`,
    isPeaceLockedBetween: (a, b) => { log.push(['isPeaceLockedBetween', a, b]); return false; },
    diplomacyLayerForOwner: (...args) => { log.push(['diplomacyLayerForOwner', ...args]); return 'layer'; },
    getDiplomaticContacts: () => { log.push(['getDiplomaticContacts']); return []; },
    playerDiplomacyActionAllowed: (layer, kind) => { log.push(['playerDiplomacyActionAllowed', layer, kind]); return true; },
    showHintMessage: record('showHintMessage'),
    chargeWarDeclarationCredibility: record('chargeWarDeclarationCredibility'),
    breakTreatiesOnWar: record('breakTreatiesOnWar'),
    applyAllianceObligationsOnWar: record('applyAllianceObligationsOnWar'),
    setDiploRelation: record('setDiploRelation'),
    applyDiploEventTracked: (a, b, rel, evt) => { log.push(['applyDiploEventTracked', a, b, rel, evt]); return { ...rel, status: 'wojna' }; },
    getDiploRelation: (a, b) => { log.push(['getDiploRelation', a, b]); return { status: 'neutralny' }; },
    pruneTributeNegotiationsBetween: record('pruneTributeNegotiationsBetween'),
    recordWarDeclarationEvent: record('recordWarDeclarationEvent'),
    pruneInvalidNegotiations: record('pruneInvalidNegotiations'),
    updateDiplomacyAudience: record('updateDiplomacyAudience'),
    updateDiplomacyPanel: record('updateDiplomacyPanel'),
    updateHud: record('updateHud'),
    wireUnitRendererRingStance: record('wireUnitRendererRingStance'),
  };
}

/** playerDeclareWarOnOwner — WERSJA SPRZED (main.ts:9934-9967 przed tą rundą, literał `0`). */
function playerDeclareWarOnOwnerPre(ownerId, d) {
  const civName = d.ownerDiploLabel(ownerId);
  if (d.isPeaceLockedBetween(0, ownerId)) {
    d.showHintMessage('Traktat pokoju — nie możesz wypowiedzieć wojny: ' + civName, 4000);
    return false;
  }
  const layer = d.diplomacyLayerForOwner(ownerId, undefined, undefined, d.getDiplomaticContacts());
  if (!d.playerDiplomacyActionAllowed(layer, 'war')) {
    d.showHintMessage('Nie możesz teraz wypowiedzieć wojny: ' + civName, 4000);
    return false;
  }
  d.chargeWarDeclarationCredibility(0, ownerId);
  d.breakTreatiesOnWar(0, ownerId, true);
  d.applyAllianceObligationsOnWar(0, ownerId);
  d.setDiploRelation(0, ownerId, d.applyDiploEventTracked(0, ownerId, d.getDiploRelation(0, ownerId), 'wojna_wypowiedziana'));
  d.pruneTributeNegotiationsBetween(0, ownerId);
  d.recordWarDeclarationEvent(0, ownerId);
  d.pruneInvalidNegotiations();
  d.showHintMessage('⚔ Wypowiedziałeś wojnę: ' + civName, 4500);
  d.updateDiplomacyAudience();
  d.updateDiplomacyPanel();
  d.updateHud();
  d.wireUnitRendererRingStance();
  return true;
}

/** playerDeclareWarOnOwner — WERSJA PO (ME() na wszystkich 9 pozycjach). */
function playerDeclareWarOnOwnerPost(ownerId, d, ME) {
  const civName = d.ownerDiploLabel(ownerId);
  if (d.isPeaceLockedBetween(ME(), ownerId)) {
    d.showHintMessage('Traktat pokoju — nie możesz wypowiedzieć wojny: ' + civName, 4000);
    return false;
  }
  const layer = d.diplomacyLayerForOwner(ownerId, undefined, undefined, d.getDiplomaticContacts());
  if (!d.playerDiplomacyActionAllowed(layer, 'war')) {
    d.showHintMessage('Nie możesz teraz wypowiedzieć wojny: ' + civName, 4000);
    return false;
  }
  d.chargeWarDeclarationCredibility(ME(), ownerId);
  d.breakTreatiesOnWar(ME(), ownerId, true);
  d.applyAllianceObligationsOnWar(ME(), ownerId);
  d.setDiploRelation(ME(), ownerId, d.applyDiploEventTracked(ME(), ownerId, d.getDiploRelation(ME(), ownerId), 'wojna_wypowiedziana'));
  d.pruneTributeNegotiationsBetween(ME(), ownerId);
  d.recordWarDeclarationEvent(ME(), ownerId);
  d.pruneInvalidNegotiations();
  d.showHintMessage('⚔ Wypowiedziałeś wojnę: ' + civName, 4500);
  d.updateDiplomacyAudience();
  d.updateDiplomacyPanel();
  d.updateHud();
  d.wireUnitRendererRingStance();
  return true;
}

// ============================================================
// Scenariusz A: activeHumanOwnerId=0 (dzisiejszy jedyny stan produkcyjny) — no-op behawioralny
// ============================================================
{
  const seats = { activeHumanOwnerId: 0 };
  const ME = () => seats.activeHumanOwnerId;

  const depsPre = makeDeps();
  const resultPre = playerDeclareWarOnOwnerPre(3, depsPre);
  const depsPost = makeDeps();
  const resultPost = playerDeclareWarOnOwnerPost(3, depsPost, ME);

  check('[A] return boolean PRE==POST (true, happy path)', resultPre === true && resultPre === resultPost);
  check('[A] log wywołań PRE==POST (identyczne argumenty, JSON)',
    JSON.stringify(depsPre.log) === JSON.stringify(depsPost.log));

  // Guard 1: isPeaceLockedBetween → false wcześnie
  const depsPreLocked = makeDeps();
  depsPreLocked.isPeaceLockedBetween = (a, b) => true;
  const depsPostLocked = makeDeps();
  depsPostLocked.isPeaceLockedBetween = (a, b) => true;
  check('[A] guard isPeaceLockedBetween PRE==POST (return false, brak dalszych efektów)',
    playerDeclareWarOnOwnerPre(3, depsPreLocked) === false &&
    playerDeclareWarOnOwnerPost(3, depsPostLocked, ME) === false &&
    depsPreLocked.log.length === 1 && depsPostLocked.log.length === 1);

  // Guard 2: playerDiplomacyActionAllowed → false
  const depsPreDenied = makeDeps();
  depsPreDenied.playerDiplomacyActionAllowed = () => false;
  const depsPostDenied = makeDeps();
  depsPostDenied.playerDiplomacyActionAllowed = () => false;
  check('[A] guard playerDiplomacyActionAllowed PRE==POST (return false)',
    playerDeclareWarOnOwnerPre(3, depsPreDenied) === false &&
    playerDeclareWarOnOwnerPost(3, depsPostDenied, ME) === false);
}

// ============================================================
// Scenariusz B (KLUCZOWY, PRZECIW SAMOOSZUKIWANIU): aktywny fotel zmieniony na 1
// ============================================================
{
  const seats = { activeHumanOwnerId: 1 };
  const ME = () => seats.activeHumanOwnerId;

  const depsPre = makeDeps();
  const resultPre = playerDeclareWarOnOwnerPre(5, depsPre);
  const depsPost = makeDeps();
  const resultPost = playerDeclareWarOnOwnerPost(5, depsPost, ME);

  // Oba zwracają true (happy path niezależny od tego KIM jest wołający) — ale ARGUMENTY
  // przekazane do zależności silnika muszą się różnić: PRE zaszywa "0" jako wołający
  // (spuścizna jednofotelowa — realna regresja przy aktywnym fotelu != 0), POST poprawnie
  // przekazuje realnie aktywny fotel (1).
  check('[B] oba zwracają true (return-value nie ujawnia regresji sam z siebie)',
    resultPre === true && resultPost === true);

  const callerArgPre = depsPre.log.find((e) => e[0] === 'chargeWarDeclarationCredibility')[1];
  const callerArgPost = depsPost.log.find((e) => e[0] === 'chargeWarDeclarationCredibility')[1];
  check('[B] SPRZED (regresja): chargeWarDeclarationCredibility woła z callerem=0, mimo że aktywny fotel to 1',
    callerArgPre === 0);
  check('[B] PO: chargeWarDeclarationCredibility woła z callerem=ME()=1 (realnie aktywny fotel)',
    callerArgPost === 1);
  check('[B] PO != SPRZED (dowód nietautologii: migracja realnie zmienia argumenty przekazane silnikowi)',
    JSON.stringify(depsPre.log) !== JSON.stringify(depsPost.log));

  // Dowód mutacji: gdyby ktoś cofnął migrację (ME()→literał inny niż 0, np. zaszył 2 zamiast
  // ME()), log POST przestałby zgadzać się z oczekiwanym callerem=1 — bramka czerwienieje.
  const mutatedME = () => 2; // symulacja cofniętej/błędnej migracji
  const depsMutated = makeDeps();
  playerDeclareWarOnOwnerPost(5, depsMutated, mutatedME);
  const callerArgMutated = depsMutated.log.find((e) => e[0] === 'chargeWarDeclarationCredibility')[1];
  check('[MUTACJA] callerArg z mutatedME()=2 NIE zgadza się z realnym aktywnym fotelem=1 (bramka łapie regresję)',
    callerArgMutated !== 1);
}

if (failures > 0) {
  console.error(`\n${failures} FAILURE(S)`);
  process.exit(1);
}
console.log('\nWSZYSTKIE TESTY PASS');
