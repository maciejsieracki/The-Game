'use strict';
/**
 * diplo-peace-balance-accept-test.cjs -- R-WEB-DIPLO-PEACE-BALANCE-ACCEPT-DIAG-Q1 (runda 1).
 *  (A) DODATEK 1 (wlasciciel 2026-11-09): chec pokoju AI wg przewagi militarnej, prog 20% z JSON
 *      (diplomacy-war-peace-params.json: przewagaMilitarna.prog) -- decideAIDiplomacy (AI proponuje),
 *      evaluatePeaceAiGate / evaluateProposal (AI przyjmuje pokoj gracza), granica 19/20/21.
 *  (B) Test CHARAKTERYZUJACY scenariusz ze zrzutu (Chinczycy, wojna): pokoj/rozejm zlozony przez AI ma
 *      ujemny bilans PW, a mimo to evaluateProposal zwraca accepted=true (decyzja wlasciciela 2026-09-07,
 *      R-DYPLO-POKOJ-KIERUNEK-I-ZADANIE-AI-Q1) -- NIE jest to blad, tylko zasada wyceny (DECISION_REQUIRED).
 * Run: node tools/diplo-peace-balance-accept-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', `.dip-peace-bal-entry-${process.pid}.ts`);
const BUNDLE = path.resolve(__dirname, `.dip-peace-bal-${process.pid}.cjs`);

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

fs.writeFileSync(ENTRY, [
  "export { decideAIDiplomacy } from './game/ai';",
  "export { evaluateProposal, createNegotiation, negotiationAsProposal } from './game/diplomacy-proposals';",
  "export { militaryAdvantageClass, militaryPowerRatio, peaceBlockedByMilitaryAdvantage, evaluatePeaceAiGate, resolveWarPeaceProfile, WAR_PEACE_PARAMS } from './game/diplomacy-war-peace-profile';",
  "export { isWarWeary, warWearinessLevel, WAR_WEARINESS_PARAMS } from './game/war-weariness';",
  '',
].join('\n'), 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE,
    absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent',
  });
} finally { try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ } }
const M = require(BUNDLE);
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ok */ }

/** Udzial rw mocy AI wzgledem mocy gracza (aiPower/(aiPower+plrPower)). */
const rwOf = (aiPower, plrPower) => aiPower / (aiPower + plrPower);

/** AI (partnerId '0' = gracz) w wojnie; zwraca komendy decideAIDiplomacy. */
function aiTurn({ rw, turnsAtWar, lost = 0, health }) {
  const rel = {
    partnerId: '0', relation: { zaufanie: 10, respekt: 20, status: 'wojna' }, respektWzgledny: rw, stanWojny: true,
    peaceLocked: false, hasNapTreaty: false, partnerTypCywilizacji: 'rzymianie', turnsAtWar, lostCitiesInWar: lost,
    zdobyteMiastaPartnera: 0, turnsSinceCityChange: turnsAtWar, miastaPartnera: [], armyHealthShare: health,
  };
  return M.decideAIDiplomacy({
    myPlayerId: '1', relacje: [rel], agresja: 0.5, agresywnoscRaw: 5, ekspansywnosc: 3, miastaAI: [],
    myTypCywilizacji: 'grecy', currentTurn: 80, skarbiecGold: 0, sklonnoscDoPodboju: 2,
  });
}
const proposes = (cmds) => cmds.some(c => c.type === 'zaproponuj_pokoj');
const proposal = (cmds) => cmds.find(c => c.type === 'zaproponuj_pokoj');

// ---- 0. prog w pliku danych, nie w kodzie ----
check('P0: prog 20% pochodzi z JSON (przewagaMilitarna.prog = 0.2)', M.WAR_PEACE_PARAMS.przewagaMilitarna.prog === 0.2, M.WAR_PEACE_PARAMS.przewagaMilitarna);
{
  const profTs = fs.readFileSync(path.join(GRA, 'src/game/diplomacy-war-peace-profile.ts'), 'utf8');
  const aiTs = fs.readFileSync(path.join(GRA, 'src/game/ai.ts'), 'utf8');
  check('P0b: kod nie zawiera sztywnego 0.2/1.2/0.8 w klasyfikacji przewagi',
    /params\.przewagaMilitarna/.test(profTs) && !/ratio\s*[<>]=?\s*1\.2\b/.test(profTs) && !/militaryAdvantageClass\([^)]*\)\s*[<>]/.test(aiTs));
}

// ---- 1. granica 20% (19/20/21) -- klasyfikacja ----
const cls = (a, p) => M.militaryAdvantageClass(rwOf(a, p));
check('G1: +19% => posrednia', cls(119, 100) === 'posrednia', cls(119, 100));
check('G2: +20% dokladnie => posrednia (przewaga to WIECEJ niz 20%)', cls(120, 100) === 'posrednia', cls(120, 100));
check('G3: +21% => przewaga', cls(121, 100) === 'przewaga', cls(121, 100));
check('G4: -19% => posrednia', cls(81, 100) === 'posrednia', cls(81, 100));
check('G5: -20% dokladnie => niedobor (co najmniej o 20% mniejsza)', cls(80, 100) === 'niedobor', cls(80, 100));
check('G6: -21% => niedobor', cls(79, 100) === 'niedobor', cls(79, 100));
check('G7: skrajne rw 0 / 1 nie rzuca', M.militaryAdvantageClass(0) === 'niedobor' && M.militaryAdvantageClass(1) === 'przewaga');

// ---- 2. AI proponuje pokoj (decideAIDiplomacy, partner = gracz '0') ----
// tury 30 => sygnal (d) pat aktywny (>=15 tur, >=10 bez zmiany miast) -- bez reguly przewagi AI by zaproponowala.
check('A1: przewaga +25%, tury 30 (zmeczenie < progu) => AI NIE proponuje pokoju',
  !proposes(aiTurn({ rw: rwOf(125, 100), turnsAtWar: 30 })), aiTurn({ rw: rwOf(125, 100), turnsAtWar: 30 }));
check('A2: +15% (przedzial posredni) => reguly dotychczasowe (sygnal pat) => AI proponuje',
  proposes(aiTurn({ rw: rwOf(115, 100), turnsAtWar: 30 })));
check('A3: granica +20% dokladnie => nadal reguly dotychczasowe => AI proponuje',
  proposes(aiTurn({ rw: rwOf(120, 100), turnsAtWar: 30 })));
check('A4: granica +21% => AI NIE proponuje', !proposes(aiTurn({ rw: rwOf(121, 100), turnsAtWar: 30 })));
{
  const c = aiTurn({ rw: rwOf(75, 100), turnsAtWar: 9 });
  check('A5: -25% => AI MOZE proponowac pokoj (sygnal f)', proposes(c) && /sygnaly=[^;]*f/.test(proposal(c).powod), c);
}
check('A5b: -20% dokladnie => AI proponuje', proposes(aiTurn({ rw: rwOf(80, 100), turnsAtWar: 9 })));
{
  const lvl = M.warWearinessLevel({ turnsAtWar: 120, lostCitiesTotal: 0, turnsSinceCityChange: 120 });
  check('A6a: poziom zmeczenia po 120 turach >= progChetnosci (warunek testu)', M.isWarWeary(lvl), lvl);
  check('A6: przewaga +25% PRZY wysokim zmeczeniu => pokoj dozwolony (AI proponuje)',
    proposes(aiTurn({ rw: rwOf(125, 100), turnsAtWar: 120 })));
}
check('A7: przewaga +25% bez wojny nie generuje pokoju (kontrola)', (() => {
  const rel = { partnerId: '0', relation: { zaufanie: 50, respekt: 50, status: 'pokoj' }, respektWzgledny: rwOf(125, 100), stanWojny: false, partnerTypCywilizacji: 'rzymianie' };
  return !proposes(M.decideAIDiplomacy({ myPlayerId: '1', relacje: [rel], agresja: 0.5, agresywnoscRaw: 5, ekspansywnosc: 3, miastaAI: [], myTypCywilizacji: 'grecy', currentTurn: 80, skarbiecGold: 0, sklonnoscDoPodboju: 2 }));
})());

// ---- 3. AI przyjmuje pokoj gracza: bramka evaluatePeaceAiGate ----
const prof = M.resolveWarPeaceProfile('rzymianie');
{
  const rw = rwOf(125, 100);
  const g1 = M.evaluatePeaceAiGate({ rw, turnsAtWar: 30, lostCitiesInWar: 0, wearinessLevel: 0.15 }, prof);
  check('B1: gracz proponuje pokoj silniejszej o 25% AI (zmeczenie 0.15, 30 tur) => odrzucenie', g1.verdict === 'stronger', g1);
  const g2 = M.evaluatePeaceAiGate({ rw, turnsAtWar: 120, lostCitiesInWar: 0, wearinessLevel: 0.6 }, prof);
  check('B2: ta sama przewaga, zmeczenie 0.6 => pokoj rozpatrywany (ok)', g2.verdict === 'ok', g2);
  const g3 = M.evaluatePeaceAiGate({ rw: rwOf(75, 100), turnsAtWar: 30, lostCitiesInWar: 0, wearinessLevel: 0.15 }, prof);
  check('B3: AI slabsza o 25% => ok', g3.verdict === 'ok', g3);
  const g4 = M.evaluatePeaceAiGate({ rw: rwOf(115, 100), turnsAtWar: 30, lostCitiesInWar: 0, wearinessLevel: 0.15 }, prof);
  check('B4: +15% (posrednia) => dotychczasowe reguly (ok po 20 turach)', g4.verdict === 'ok', g4);
  const g5 = M.evaluatePeaceAiGate({ rw, turnsAtWar: 30, lostCitiesInWar: 0 }, prof);
  check('B5: bez wearinessLevel (AI<->AI) regula nie dziala => zachowanie dotychczasowe (ok)', g5.verdict === 'ok', g5);
}

// ---- 4. evaluateProposal: gracz proponuje pokoj AI (pelna sciezka main -> proposals) ----
const WOJNA = { zaufanie: 5, respekt: 5, status: 'wojna' };
function playerPeace(warState) {
  const entry = M.createNegotiation({ actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 1, payload: {} }, 80, 'player', 1);
  return M.evaluateProposal(M.negotiationAsProposal(entry), {
    relation: WOJNA, stanWojny: true, turn: 80, proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1,
    respektWzgledny: 0.5, karaWspolnaGranica: false, difficulty: 'normal',
    responderPlayer: { ownerId: 1, typCywilizacji: 'rzymianie' }, proposerPlayer: { ownerId: 0, typCywilizacji: 'rzymianie' },
    authorOwnerId: 0, warState,
  });
}
{
  const strong = playerPeace({ turnsAtWar: 30, lostCitiesResponder: 0, responderRw: rwOf(125, 100) });
  check('C1: evaluateProposal: +25%, 30 tur => accepted=false z powodem przewagi', strong.accepted === false && /przewag/.test(strong.reason || ''), strong);
  const weary = playerPeace({ turnsAtWar: 120, lostCitiesResponder: 0, responderRw: rwOf(125, 100) });
  check('C2: evaluateProposal: +25%, 120 tur (zmeczenie) => brak odrzucenia z powodu przewagi', !/przewag/.test(weary.reason || ''), weary);
  const weak = playerPeace({ turnsAtWar: 30, lostCitiesResponder: 0, responderRw: rwOf(75, 100) });
  check('C3: evaluateProposal: AI slabsza o 25% => brak odrzucenia z powodu przewagi', !/przewag/.test(weak.reason || ''), weak);
}

// ---- 5. CHARAKTERYZACJA zrzutu (Chinczycy, wojna): pokoj/rozejm zlozony przez AI, bilans PW ujemny, a mimo to accepted ----
{
  const rel29 = { zaufanie: 15, respekt: 14, status: 'wojna' }; // Relacja ~29 (clamp wojenny), "Twoja strona slabsza"
  const entry = M.createNegotiation({ actionId: 'rozejm', proposerOwnerId: 1, responderOwnerId: 0, payload: { turns: 10 } }, 80, 'ai', 1);
  const res = M.evaluateProposal(M.negotiationAsProposal(entry), {
    relation: rel29, stanWojny: true, turn: 80, proposerRespekt: 40, responderRespekt: 60, militaryRatio: 0.7,
    respektWzgledny: 0.45, karaWspolnaGranica: false, difficulty: 'normal',
    responderPlayer: { ownerId: 0, typCywilizacji: 'rzymianie' }, proposerPlayer: { ownerId: 1, typCywilizacji: 'chinczycy' },
    authorOwnerId: 1, warState: { turnsAtWar: 40, lostCitiesResponder: 0, responderRw: 0.55 },
  });
  check('Z1: pokoj/rozejm zlozony przez AI w wojnie: accepted=true (gracz moze przyjac)', res.accepted === true, res);
  check('Z2: ...mimo UJEMNEGO bilansu PW (decyzja wlasciciela 2026-09-07: oferowany pokoj nigdy nie blokowany liczba)',
    typeof res.pwBalance === 'number' && res.pwBalance < 0, res);
  check('Z3: pokoj wyceniany jak towar o bazie PW (200 rozejm) -- bez skladnika zadania miasta/okupu/trybutu w tej propozycji',
    !res.deal && res.oneShotTrade === true, res);
}

console.log(`\ndiplo-peace-balance-accept-test: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
