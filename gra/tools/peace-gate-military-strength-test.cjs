'use strict';
/**
 * peace-gate-military-strength-test.cjs -- R-WEB-AUDIT-PEACE-GATE-MILITARY-STRENGTH-Q1.
 * Kontrola STRUKTURALNA (main.ts nie jest importowalny w harnessie cjs):
 *  (p1) ścieżka prośby przegrywającej AI↔AI (registerAiAiPeaceRequest) i jej odsłona requesterShareOf
 *       (runAiAiPeaceTick) liczą udział przez aiAiMilitaryRequesterShare (siła militarna z diploMilitarySideOf),
 *       NIE przez objectivePowerForOwner (Power);
 *  (p2) helper aiAiMilitaryRequesterShare woła requesterShare wyłącznie na .sila z diploMilitarySideOf (obie strony);
 *  (p3) w main.ts nie ma żadnego requesterShare(objectivePowerForOwner(...)).
 *  (s1) ai.ts: bramka „AI proponuje pokój" (priorytet 2) i wybór rodzaju używają peacePosMil, nie rw.
 * Kontrola BEHAWIORALNA (esbuild bundle ai.ts → decideAIDiplomacy):
 *  (b1–b5) bramka pokoju AI jest wg SIŁY MILITARNEJ, nie rw (Power). Pasmo/silniejsza z rw=0.20 → brak propozycji;
 *       słabsza militarnie bez miasta → brak (słodzik = miasto); słabsza z miastem → propozycja.
 * Mutacja: powrót do Power w którymkolwiek z tych miejsc (także `rw <= progPokojSlabosc` w bramce) musi zaczerwienić test.
 * Run: node tools/peace-gate-military-strength-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
const aiSrc = fs.readFileSync(path.join(GRA, 'src/game/ai.ts'), 'utf8');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

function bodyOf(anchor, len) {
  const a = src.indexOf(anchor);
  return a < 0 ? null : src.slice(a, a + len);
}

const helper = bodyOf('function aiAiMilitaryRequesterShare(', 400);
check('p2 helper aiAiMilitaryRequesterShare istnieje', helper !== null);
check('p2 helper liczy requesterShare na .sila z diploMilitarySideOf (obie strony)',
  helper !== null
  && /requesterShare\(\s*diploMilitarySideOf\(requesterId,\s*otherId,\s*true\)\.sila\s*,\s*diploMilitarySideOf\(otherId,\s*requesterId,\s*true\)\.sila,?\s*\)/.test(helper),
  helper);
check('p2 helper nie czyta Power (objectivePowerForOwner)', helper !== null && !/objectivePowerForOwner/.test(helper));

const reg = bodyOf('function registerAiAiPeaceRequest(', 900);
check('p1 registerAiAiPeaceRequest liczy udział przez aiAiMilitaryRequesterShare',
  reg !== null && /const share = aiAiMilitaryRequesterShare\(requesterId, otherId\);/.test(reg), reg && reg.slice(0, 400));
check('p1 registerAiAiPeaceRequest nie używa objectivePowerForOwner', reg !== null && !/objectivePowerForOwner/.test(reg));

check('p1 runAiAiPeaceTick requesterShareOf używa aiAiMilitaryRequesterShare',
  /requesterShareOf:\s*\(rq,\s*ot\)\s*=>\s*aiAiMilitaryRequesterShare\(rq,\s*ot\)/.test(src));

check('p3 brak requesterShare(objectivePowerForOwner(...)) w całym main.ts',
  !/requesterShare\(\s*objectivePowerForOwner\(/.test(src));

check('s1 ai.ts: bramka pokoju priorytet 2 używa peacePosMil === \'slabsza\', nie rw <= progPokojSlabosc',
  /\(peacePosMil === 'slabsza' \|\| peaceSignals\.wantsPeace\)/.test(aiSrc) && !/rw <= progPokojSlabosc \|\| peaceSignals\.wantsPeace/.test(aiSrc));
check('s1 ai.ts: wybór rodzaju pokoju (weaker) z peacePosMil, nie rw',
  /const weakerByStrength = peacePosMil === 'slabsza';/.test(aiSrc) && !/const weakerByPower = rw <= progPokojSlabosc;/.test(aiSrc));

// ---- (b) zachowanie decideAIDiplomacy (bramka pokoju wg siły militarnej) ----
const ENTRY = path.resolve(GRA, 'src', `.peace-gate-mil-entry-${process.pid}.ts`);
const BUNDLE = path.resolve(__dirname, `.peace-gate-mil-${process.pid}.cjs`);
fs.writeFileSync(ENTRY, "export { decideAIDiplomacy } from './game/ai';\n", 'utf8');
let M = null;
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE,
    absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent',
  });
  M = require(BUNDLE);
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }
  try { fs.unlinkSync(BUNDLE); } catch (_) { /* ok */ }
}

/** Gracz = partnerId '0'; rw (respektWzgledny, Power) podawane osobno od sił militarnych (silaAI/silaPlr). */
function aiTurn({ silaAI, silaPlr, rw, turnsAtWar, miastaAI = [] }) {
  const rel = {
    partnerId: '0', relation: { zaufanie: 10, respekt: 20, status: 'wojna' }, respektWzgledny: rw, stanWojny: true,
    peaceLocked: false, hasNapTreaty: false, partnerTypCywilizacji: 'rzymianie', turnsAtWar, lostCitiesInWar: 0,
    zdobyteMiastaPartnera: 0, turnsSinceCityChange: turnsAtWar, miastaPartnera: [],
    silaMilitarnaAI: { sila: silaAI, armiaPkt: 0 }, silaMilitarnaPartner: { sila: silaPlr, armiaPkt: 0 },
  };
  return M.decideAIDiplomacy({
    myPlayerId: '1', relacje: [rel], agresja: 0.5, agresywnoscRaw: 5, ekspansywnosc: 3, miastaAI,
    myTypCywilizacji: 'grecy', currentTurn: 80, skarbiecGold: 0, sklonnoscDoPodboju: 2,
  });
}
const peaceCmd = (cmds) => cmds.some(c => c.type === 'zaproponuj_pokoj' || c.type === 'oferuj_miasto_za_pokoj');
// Tura 7 = minTurWojny: zmęczenie (5%/turę) jest poniżej progu sygnału (e), więc tylko pozycja militarna może zadecydować.
// Słabsza AI oddaje miasto wyłącznie przy wystarczającej liczbie miast i wartości (aiPickMiastoDoOddania).
const CITY = [1, 2, 3, 4, 5, 6].map(i => ({ cityId: `c${i}`, cityPn: 1000, zakazane: false }));

{
  const c = aiTurn({ silaAI: 110, silaPlr: 100, rw: 0.20, turnsAtWar: 7 });
  // Strażnik (NIE dyskryminuje rw: w siatce t=7–12 wyjścia rw-owe i militarne są identyczne, patrz raport 30-obrona-claude.md).
  check('b1: strażnik — pasmo militarne (110 vs 100), Power rw=0.20, bez miasta → AI NIE proponuje pokoju',
    !peaceCmd(c), c);
}
{
  const c = aiTurn({ silaAI: 125, silaPlr: 100, rw: 0.20, turnsAtWar: 7 });
  check('b2: AI silniejsza militarnie (125 vs 100), rw=0.20 → AI NIE proponuje pokoju',
    !peaceCmd(c), c);
}
{
  const c = aiTurn({ silaAI: 80, silaPlr: 100, rw: 0.90, turnsAtWar: 12 });
  check('b3: AI słabsza militarnie (80 vs 100), rw=0.90, bez miasta → brak pokoju (słodzik = miasto)',
    !peaceCmd(c), c);
}
{
  const c = aiTurn({ silaAI: 80, silaPlr: 100, rw: 0.90, turnsAtWar: 12, miastaAI: CITY });
  check('b4: AI słabsza militarnie z miastem → propozycja pokoju/oddania miasta (słabszy szuka)',
    peaceCmd(c), c);
}
{
  const c = aiTurn({ silaAI: 125, silaPlr: 100, rw: 0.20, turnsAtWar: 12 });
  check('b5: kontrola — AI silniejsza po czasie wojny (125 vs 100, rw=0.20) nadal nie proponuje pokoju',
    !peaceCmd(c), c);
}

console.log(`\nWynik: ${pass} PASS / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
