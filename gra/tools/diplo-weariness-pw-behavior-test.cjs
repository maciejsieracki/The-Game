'use strict';
/**
 * diplo-weariness-pw-behavior-test.cjs -- R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1, runda 2 (BEHAWIORALNY).
 * Nie tautologia: wola PRAWDZIWE sciezki — decideAIDiplomacy (ai.ts) i evaluateProposal (diplomacy-proposals.ts).
 *   (b)  tury 10..20 x 3 mnozniki ceny C: AI proponuje pokoj bezwarunkowy (zaproponuj_pokoj bezwarunkowy)
 *        <=> bilans tabeli po Z >= 0 (R = C - Z = 0).
 *   (b2) tabela: pwBalance(t) - pwBalance(10) == Z(t) = wearinessPeaceItemPw(C, L(t)) dla slabszej AI
 *        (mutacja basePn = cenaPokojuPn wylacza Z i daje CZERWONE).
 *   (b3) pokoj silniejszej AI: odrzucenie podaje wymagane C (zmeczenie nie obniza tej ceny).
 * Mnozniki: mnoznik ceny cywilizacji (civMult) zaciskany do 0,7 / 1,0 / 1,5 w WAR_PEACE_PARAMS.cenaPokoju;
 * C(t) odczytywane z silnika (tekst „wymagane C PN” dla silniejszej AI) w kazdej turze.
 * Run: node tools/diplo-weariness-pw-behavior-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', `.pw-behav-entry-${process.pid}.ts`);
const BUNDLE = path.resolve(__dirname, `.pw-behav-${process.pid}.cjs`);

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

fs.writeFileSync(ENTRY, [
  "export { decideAIDiplomacy } from './game/ai';",
  "export { evaluateProposal, createNegotiation, negotiationAsProposal } from './game/diplomacy-proposals';",
  "export { wearinessPeaceItemPw, warWearinessLevel, WAR_WEARINESS_PARAMS } from './game/war-weariness';",
  "export { WAR_PEACE_PARAMS } from './game/diplomacy-war-peace-profile';",
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

const rwOf = (aiPower, plrPower) => aiPower / (aiPower + plrPower);
const WOJNA = { zaufanie: 5, respekt: 5, status: 'wojna' };
const L_OF = (t) => M.warWearinessLevel({ turnsAtWar: t, lostCitiesTotal: 0 });

/** Ocena pokoju zaproponowanego przez gracza (AI = oceniajacy, responder). */
function playerPeace({ t, pos }) {
  const entry = M.createNegotiation({ actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 1, payload: {} }, 80, 'player', 1);
  const rw = pos === 'slabsza' ? rwOf(75, 100) : rwOf(125, 100);
  return M.evaluateProposal(M.negotiationAsProposal(entry), {
    relation: WOJNA, stanWojny: true, turn: 80, proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1,
    respektWzgledny: 0.5, karaWspolnaGranica: false, difficulty: 'normal',
    responderPlayer: { ownerId: 1, typCywilizacji: 'rzymianie' }, proposerPlayer: { ownerId: 0, typCywilizacji: 'rzymianie' },
    authorOwnerId: 0,
    warState: { turnsAtWar: t, lostCitiesResponder: 0, turnsSinceCityChange: t, responderRw: rw, responderPozycjaMilitarna: pos },
  });
}

/** Decyzja AI (ai.ts) wobec gracza, partner '0', wojna od t tur. */
function aiDecision({ t, silaAI }) {
  const rel = {
    partnerId: '0', relation: { zaufanie: 10, respekt: 20, status: 'wojna' }, respektWzgledny: rwOf(silaAI, 100), stanWojny: true,
    peaceLocked: false, hasNapTreaty: false, partnerTypCywilizacji: 'rzymianie', turnsAtWar: t, lostCitiesInWar: 0,
    zdobyteMiastaPartnera: 0, turnsSinceCityChange: t, miastaPartnera: [], armyHealthShare: 1,
    silaMilitarnaAI: { sila: silaAI, armiaPkt: 0 }, silaMilitarnaPartner: { sila: 100, armiaPkt: 0 },
  };
  const cmds = M.decideAIDiplomacy({
    myPlayerId: '1', relacje: [rel], agresja: 0.5, agresywnoscRaw: 5, ekspansywnosc: 3, miastaAI: [],
    myTypCywilizacji: 'grecy', currentTurn: 80, skarbiecGold: 0, sklonnoscDoPodboju: 2,
  });
  return cmds.some(c => c.type === 'zaproponuj_pokoj' && c.bezwarunkowy === true);
}

/** Cena pokoju C (PN) odczytana z odrzucenia silniejszej AI: „wymagane C PN". */
function priceFromStrongerReason(t) {
  const r = playerPeace({ t, pos: 'silniejsza' });
  const m = /wymagane (\d+) PN/.exec(r.reason || '');
  return m ? Number(m[1]) : null;
}

/** Bilans tabeli dla slabszej AI, bez miasta: pwBalance; brak pola = R=0 -> bilans 0. */
function tableBalance(t) {
  const r = playerPeace({ t, pos: 'slabsza' });
  return r.pwBalance === undefined ? 0 : r.pwBalance;
}

// Mnoznik ceny cywilizacji (civMult) jest zaciskany do zadanej wartosci (min = max) — trzy realne przebiegi
// cenowe C = 500 x mnoznik (przed turyBezOgraniczenAi; po nim min(1, civMult), zgodnie z regula gry).
const PRICE = M.WAR_PEACE_PARAMS.cenaPokoju;
const savedMin = PRICE.mnoznikCywMin;
const savedMax = PRICE.mnoznikCywMax;
for (const mnoznik of [0.7, 1.0, 1.5]) {
  PRICE.mnoznikCywMin = mnoznik;
  PRICE.mnoznikCywMax = mnoznik;
  const label = `mnoznik=${mnoznik}`;
  // C(t) = cena pokoju w turze t, odczytana z odrzucenia silniejszej AI („wymagane C PN").
  const cAt = (t) => priceFromStrongerReason(t);
  check(`C0 ${label}: cena pokoju odczytana w turze 10`, cAt(10) !== null && cAt(10) > 0, { cena: cAt(10) });
  for (let t = 10; t <= 20; t++) {
    const C = cAt(t);
    const Z = M.wearinessPeaceItemPw(C, L_OF(t));
    const proposes = aiDecision({ t, silaAI: 75 });
    const bal = tableBalance(t);
    // (b) decyzja AI <=> bilans tabeli >= 0 (R = C - Z = 0)
    check(`(b) ${label} tura ${t}: AI proponuje bezwarunkowy pokoj (${proposes}) <=> bilans tabeli >= 0 (${bal})`,
      proposes === (bal >= 0), { t, proposes, bal, Z, C });
    // (b2) przed progiem konca zmeczenia bilans rosnie z kazda tura (Z rosnie, C stale): mutacja basePn=C -> plasko
    if (t >= 11 && t <= 15) {
      const prev = tableBalance(t - 1);
      check(`(b2) ${label} tura ${t}: bilans rosnie wzgledem tury ${t - 1} (Z=${Z})`, bal > prev, { t, bal, prev });
    }
    // (b3) silniejsza AI: odrzucenie podaje wymagane C w tej turze (zmeczenie nie obniza ceny)
    const rs = playerPeace({ t, pos: 'silniejsza' });
    check(`(b3) ${label} tura ${t}: silniejsza AI odrzuca i podaje wymagane C=${C} PN`,
      rs.accepted === false && typeof rs.reason === 'string' && rs.reason.includes(`wymagane ${C} PN`), rs);
  }
}
PRICE.mnoznikCywMin = savedMin;
PRICE.mnoznikCywMax = savedMax;

console.log(`diplo-weariness-pw-behavior-test: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
