'use strict';
/**
 * diplo-peace-balance-accept-test.cjs -- R-WEB-DIPLO-PEACE-BALANCE-ACCEPT-DIAG-Q1 (runda 1),
 * przepisany w R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 (runda 2) na regułę SIŁY MILITARNEJ.
 *  Stara reguła (przewaga rw > 20% blokuje pokój, zmęczenie ją zdejmuje) została zastąpiona:
 *  silniejsza militarnie strona odrzuca pokój bez miasta; słabsza zawsze szuka pokoju (z miastem);
 *  zmęczenie wojną NIE zdejmuje blokady. Dane: silaMilitarnaAI / silaMilitarnaPartner (main.ts).
 *  (A) decideAIDiplomacy: AI proponuje pokój wg pozycji militarnej (silniejsza nie, słabsza tylko z miastem).
 *  (B) evaluatePeaceAiGate: verdict 'stronger' przy pozycji 'silniejsza', niezależnie od zmęczenia.
 *  (C) evaluateProposal: gracz proponuje pokój silniejszej AI bez miasta → odrzucenie.
 *  (Z) charakteryzacja zrzutu (Chińczycy): pokój/rozejm złożony przez AI, ujemny bilans PW, accepted.
 *  Funkcje rw-owe (militaryAdvantageClass, G1–G7) zostają jako pomocnicze i nie biorą udziału w decyzji.
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
  "export { peaceMilitaryPosition } from './game/diplomacy-military-strength';",
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
/** Siła militarna strony (sila = armia + rekruci + wygrane; armiaPkt pomocniczo). */
const side = (id, sila) => ({ id, sila, armiaPkt: 0 });

/**
 * AI (partnerId '0' = gracz) w wojnie; silaAI/silaPlr = siła militarna (silaMilitarnaAI/Partner).
 * rw liczone z tych samych sił, żeby test nie rozjeżdżał się z danymi.
 */
function aiTurn({ silaAI, silaPlr, turnsAtWar, lost = 0, miastaAI = [], health }) {
  const rel = {
    partnerId: '0', relation: { zaufanie: 10, respekt: 20, status: 'wojna' }, respektWzgledny: rwOf(silaAI, silaPlr), stanWojny: true,
    peaceLocked: false, hasNapTreaty: false, partnerTypCywilizacji: 'rzymianie', turnsAtWar, lostCitiesInWar: lost,
    zdobyteMiastaPartnera: 0, turnsSinceCityChange: turnsAtWar, miastaPartnera: [], armyHealthShare: health,
    silaMilitarnaAI: { sila: silaAI, armiaPkt: 0 }, silaMilitarnaPartner: { sila: silaPlr, armiaPkt: 0 },
  };
  return M.decideAIDiplomacy({
    myPlayerId: '1', relacje: [rel], agresja: 0.5, agresywnoscRaw: 5, ekspansywnosc: 3, miastaAI,
    myTypCywilizacji: 'grecy', currentTurn: 80, skarbiecGold: 0, sklonnoscDoPodboju: 2,
  });
}
const proposes = (cmds) => cmds.some(c => c.type === 'zaproponuj_pokoj');
const proposal = (cmds) => cmds.find(c => c.type === 'zaproponuj_pokoj');

// ---- 0. prog w pliku danych, nie w kodzie (helper rw zostaje, nie steruje decyzja) ----
check('P0: prog 20% pochodzi z JSON (przewagaMilitarna.prog = 0.2)', M.WAR_PEACE_PARAMS.przewagaMilitarna.prog === 0.2, M.WAR_PEACE_PARAMS.przewagaMilitarna);
{
  const profTs = fs.readFileSync(path.join(GRA, 'src/game/diplomacy-war-peace-profile.ts'), 'utf8');
  const aiTs = fs.readFileSync(path.join(GRA, 'src/game/ai.ts'), 'utf8');
  check('P0b: kod nie zawiera sztywnego 0.2/1.2/0.8 w klasyfikacji przewagi',
    /params\.przewagaMilitarna/.test(profTs) && !/ratio\s*[<>]=?\s*1\.2\b/.test(profTs) && !/militaryAdvantageClass\([^)]*\)\s*[<>]/.test(aiTs));
}

// ---- 0b. funkcja pomocnicza rw (zostaje, bez wplywu na decyzje): granica 20% ----
const cls = (a, p) => M.militaryAdvantageClass(rwOf(a, p));
check('G1: +19% => posrednia', cls(119, 100) === 'posrednia', cls(119, 100));
check('G2: +20% dokladnie => posrednia (przewaga to WIECEJ niz 20%)', cls(120, 100) === 'posrednia', cls(120, 100));
check('G3: +21% => przewaga', cls(121, 100) === 'przewaga', cls(121, 100));
check('G4: -19% => posrednia', cls(81, 100) === 'posrednia', cls(81, 100));
check('G5: -20% dokladnie => niedobor (co najmniej o 20% mniejsza)', cls(80, 100) === 'niedobor', cls(80, 100));
check('G6: -21% => niedobor', cls(79, 100) === 'niedobor', cls(79, 100));
check('G7: skrajne rw 0 / 1 nie rzuca', M.militaryAdvantageClass(0) === 'niedobor' && M.militaryAdvantageClass(1) === 'przewaga');

// ---- 1. pozycja militarna (siła, nie rw): granica bez progu = każda różnica decyduje ----
check('M1: siła 101 vs 100 => strona z 101 silniejsza', M.peaceMilitaryPosition(side('1', 101), side('0', 100)) === 'silniejsza');
check('M2: siła 100 vs 101 => strona z 100 słabsza', M.peaceMilitaryPosition(side('1', 100), side('0', 101)) === 'slabsza');
{
  const a = M.peaceMilitaryPosition(side('1', 100), side('0', 100));
  const b = M.peaceMilitaryPosition(side('0', 100), side('1', 100));
  check('M3: remis 100:100 rozstrzygany deterministycznie (dokładnie jedna strona silniejsza)',
    (a === 'silniejsza' && b === 'slabsza') || (a === 'slabsza' && b === 'silniejsza'), { a, b });
}

// ---- 2. AI proponuje pokoj (decideAIDiplomacy, partner = gracz '0') ----
check('A1: AI silniejsza militarnie (125 vs 100), 12 tur => AI NIE proponuje pokoju',
  !proposes(aiTurn({ silaAI: 125, silaPlr: 100, turnsAtWar: 12 })), aiTurn({ silaAI: 125, silaPlr: 100, turnsAtWar: 12 }));
check('A2: AI silniejsza o 15% (115 vs 100) => AI NIE proponuje pokoju',
  !proposes(aiTurn({ silaAI: 115, silaPlr: 100, turnsAtWar: 12 })));
check('A3: AI silniejsza o 1 jednostke siły (101 vs 100) => AI NIE proponuje pokoju (brak progu pasma)',
  !proposes(aiTurn({ silaAI: 101, silaPlr: 100, turnsAtWar: 12 })));
check('A4: AI słabsza militarnie (75 vs 100), BEZ miasta => AI NIE proponuje pokoju wobec gracza (ZAŁOŻENIE Z5)',
  !proposes(aiTurn({ silaAI: 75, silaPlr: 100, turnsAtWar: 12 })));
{
  const c = aiTurn({ silaAI: 75, silaPlr: 100, turnsAtWar: 12, lost: 0 });
  check('A4b: AI słabsza bez miasta — brak zaproponuj_pokoj (nie ma słodzika)', !proposes(c), c);
}
// R-WEB-DIPLO-WEARINESS-20-TURNS-Q1: koniec zmęczenia (20 tur = 100%) zdejmuje blokadę — silniejsza AI proponuje pokój bezwarunkowy.
check('A5: AI silniejsza militarnie, koniec zmęczenia (20 tur) => AI proponuje pokój bezwarunkowy',
  proposes(aiTurn({ silaAI: 125, silaPlr: 100, turnsAtWar: 20 })));
check('A6: AI silniejsza, wojna 9 tur (przed minimalnym czasem) => AI NIE proponuje',
  !proposes(aiTurn({ silaAI: 125, silaPlr: 100, turnsAtWar: 9 })));
check('A7: przewaga militarna bez wojny nie generuje pokoju (kontrola)', (() => {
  const rel = { partnerId: '0', relation: { zaufanie: 50, respekt: 50, status: 'pokoj' }, respektWzgledny: rwOf(125, 100), stanWojny: false, partnerTypCywilizacji: 'rzymianie',
    silaMilitarnaAI: { sila: 125, armiaPkt: 0 }, silaMilitarnaPartner: { sila: 100, armiaPkt: 0 } };
  return !proposes(M.decideAIDiplomacy({ myPlayerId: '1', relacje: [rel], agresja: 0.5, agresywnoscRaw: 5, ekspansywnosc: 3, miastaAI: [], myTypCywilizacji: 'grecy', currentTurn: 80, skarbiecGold: 0, sklonnoscDoPodboju: 2 }));
})());

// ---- 3. AI przyjmuje pokoj gracza: bramka evaluatePeaceAiGate (pozycjaMilitarna) ----
const prof = M.resolveWarPeaceProfile('rzymianie');
{
  const g1 = M.evaluatePeaceAiGate({ rw: rwOf(125, 100), turnsAtWar: 30, lostCitiesInWar: 0, wearinessLevel: 0.15, pozycjaMilitarna: 'silniejsza' }, prof);
  check('B1: gracz proponuje pokoj silniejszej AI (zmeczenie 0.15, 30 tur) => stronger', g1.verdict === 'stronger', g1);
  const g2 = M.evaluatePeaceAiGate({ rw: rwOf(125, 100), turnsAtWar: 120, lostCitiesInWar: 0, wearinessLevel: 0.6, pozycjaMilitarna: 'silniejsza' }, prof);
  check('B2: silniejsza AI przy zmęczeniu 0.6 => nadal stronger (zmęczenie nie zdejmuje blokady)', g2.verdict === 'stronger', g2);
  const g3 = M.evaluatePeaceAiGate({ rw: rwOf(75, 100), turnsAtWar: 30, lostCitiesInWar: 0, wearinessLevel: 0.15, pozycjaMilitarna: 'slabsza' }, prof);
  check('B3: AI słabsza militarnie => ok', g3.verdict === 'ok', g3);
  const g4 = M.evaluatePeaceAiGate({ rw: rwOf(115, 100), turnsAtWar: 30, lostCitiesInWar: 0, wearinessLevel: 0.15, pozycjaMilitarna: 'pasmo' }, prof);
  check('B4: pozycja pasmo (progRozniceSilyPokoj > 0) => ok', g4.verdict === 'ok', g4);
  const g5 = M.evaluatePeaceAiGate({ rw: rwOf(125, 100), turnsAtWar: 30, lostCitiesInWar: 0 }, prof);
  check('B5: bez pozycjaMilitarna (AI<->AI, stare wywolania) => ok, brak reguly rw', g5.verdict === 'ok', g5);
  const g6 = M.evaluatePeaceAiGate({ rw: rwOf(125, 100), turnsAtWar: 3, lostCitiesInWar: 0, pozycjaMilitarna: 'slabsza' }, prof);
  check('B6: minimalny czas wojny nadal blokuje (too_early) nawet przy slabszej AI', g6.verdict === 'too_early', g6);
}

// ---- 4. evaluateProposal: gracz proponuje pokoj AI (pelna sciezka main -> proposals) ----
const WOJNA = { zaufanie: 5, respekt: 5, status: 'wojna' };
function playerPeace(warState, actionId = 'pokoj', payload = {}) {
  const entry = M.createNegotiation({ actionId, proposerOwnerId: 0, responderOwnerId: 1, payload }, 80, 'player', 1);
  return M.evaluateProposal(M.negotiationAsProposal(entry), {
    relation: WOJNA, stanWojny: true, turn: 80, proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1,
    respektWzgledny: 0.5, karaWspolnaGranica: false, difficulty: 'normal',
    responderPlayer: { ownerId: 1, typCywilizacji: 'rzymianie' }, proposerPlayer: { ownerId: 0, typCywilizacji: 'rzymianie' },
    authorOwnerId: 0, warState,
  });
}
{
  const strong = playerPeace({ turnsAtWar: 30, lostCitiesResponder: 0, responderRw: rwOf(125, 100), responderPozycjaMilitarna: 'silniejsza' });
  check('C1: evaluateProposal: AI silniejsza militarnie, bez miasta => accepted=false z powodem militarnym', strong.accepted === false && /silni|miast/.test(strong.reason || ''), strong);
  const weary = playerPeace({ turnsAtWar: 120, lostCitiesResponder: 0, responderRw: rwOf(125, 100), responderPozycjaMilitarna: 'silniejsza' });
  check('C2: evaluateProposal: silniejsza AI przy 120 turach (zmęczenie) => nadal odrzucone', weary.accepted === false, weary);
  const weak = playerPeace({ turnsAtWar: 30, lostCitiesResponder: 0, responderRw: rwOf(75, 100), responderPozycjaMilitarna: 'slabsza' });
  check('C3: evaluateProposal: AI słabsza militarnie => brak odrzucenia z powodu siły', !/silni|miast w ofercie/.test(weak.reason || ''), weak);
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
