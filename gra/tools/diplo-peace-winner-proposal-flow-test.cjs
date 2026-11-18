'use strict';
/**
 * diplo-peace-winner-proposal-flow-test.cjs — R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1 (runda 1).
 * Blokada 10 pełnych tur wojny (`peaceProposalBlocked`) widoczna W UI PRZED kliknięciem:
 * resolveDiplomacyActionLock('10') zwraca locked=true z licznikiem „dostępne za N tur".
 * Tabela: turyWojny 0/5/9/10/11/undefined × atWar true/false, plus licznik tur (peaceProposalTurnsLeft).
 * Bundle w pamięci (esbuild stdin, bez zapisu plików). Run: node tools/diplo-peace-winner-proposal-flow-test.cjs
 */
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = [
  "export { resolveDiplomacyActionLock } from './game/diplomacy-locks';",
  "export { peaceProposalTurnsLeft, turyWojnyLabel, PEACE_PROPOSAL_MIN_WAR_TURNS } from './game/diplomacy-peace-proposal-timing';",
  "",
].join('\n');

async function main() {
  const result = await esbuild.build({
    stdin: { contents: ENTRY_SRC, resolveDir: path.resolve(GRA, 'src'), sourcefile: 'entry.ts', loader: 'ts' },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    write: false,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    logLevel: 'silent',
  });
  const mod = { exports: {} };
  new Function('module', 'exports', result.outputFiles[0].text)(mod, mod.exports);
  const { resolveDiplomacyActionLock, peaceProposalTurnsLeft, turyWojnyLabel, PEACE_PROPOSAL_MIN_WAR_TURNS } = mod.exports;

  // Odmiana polska: 1 turę, 2–4 tury, 5+ tur (w tym 12–14 → tur).
  const labelCases = [[1, 'turę'], [2, 'tury'], [3, 'tury'], [4, 'tury'], [5, 'tur'], [9, 'tur'], [10, 'tur'], [12, 'tur'], [22, 'tury'], [25, 'tur']];
  for (const [n, want] of labelCases) {
    check(`odmiana: ${n} → „${want}"`, turyWojnyLabel(n) === want, turyWojnyLabel(n));
  }

  check('prog blokady = 10 pełnych tur', PEACE_PROPOSAL_MIN_WAR_TURNS === 10, PEACE_PROPOSAL_MIN_WAR_TURNS);

  // Licznik tur do odblokowania.
  check('turnsLeft(0)=10', peaceProposalTurnsLeft(0) === 10);
  check('turnsLeft(5)=5', peaceProposalTurnsLeft(5) === 5);
  check('turnsLeft(9)=1', peaceProposalTurnsLeft(9) === 1);
  check('turnsLeft(10)=0', peaceProposalTurnsLeft(10) === 0);
  check('turnsLeft(11)=0', peaceProposalTurnsLeft(11) === 0);
  check('turnsLeft(NaN)=10 (fail-closed)', peaceProposalTurnsLeft(NaN) === 10);
  check('turnsLeft(9.7)=1 (pełne tury)', peaceProposalTurnsLeft(9.7) === 1);

  const lock = (turnsAtWar, atWar = true) =>
    resolveDiplomacyActionLock({ actionId: '10', atWar, turnsAtWar, contact: true });

  // Tabela przypadków (oś tur wojny 0..11) dla akcji '10' (pokój/rozejm): wyszarzenie przed kliknięciem.
  const expLeft = { 0: 10, 1: 9, 2: 8, 3: 7, 4: 6, 5: 5, 6: 4, 7: 3, 8: 2, 9: 1 };
  for (let t = 0; t <= 11; t++) {
    const r = lock(t);
    if (t < 10) {
      check(`'10' wojna t=${t}: locked=true`, r.locked === true, r);
      const want = `dostępne za ${expLeft[t]} ${turyWojnyLabel(expLeft[t])}`;
      check(`'10' wojna t=${t}: notka „${want}"`, r.note.startsWith(want), r.note);
    } else {
      check(`'10' wojna t=${t}: locked=false`, r.locked === false, r);
    }
  }
  check("'10' wojna t=9: nie ma błędnej formy 'za 1 tury'", !/za 1 tury/.test(lock(9).note), lock(9).note);
  check("'10' wojna t=5: forma 'za 5 tur' (nie 'za 5 tury')", !/za 5 tury/.test(lock(5).note), lock(5).note);

  // Akcja '8' (trybut / oferta trybutu): w wojnie blokowana tą samą regułą (peaceProposalBlocked: trybut_oferta).
  const lock8 = (t) => resolveDiplomacyActionLock({ actionId: '8', atWar: true, turnsAtWar: t, contact: true, respekt: 100 });
  check("'8' wojna t=5: locked=true z licznikiem", lock8(5).locked === true && /dostępne za 5 tur/.test(lock8(5).note), lock8(5));
  check("'8' wojna t=10: odblokowane (oferta reparacji)", lock8(10).locked === false, lock8(10));
  check("'8' wojna undefined turnsAtWar: bez zmian (wsteczna zgodność)", resolveDiplomacyActionLock({ actionId: '8', atWar: true, contact: true, respekt: 100 }).locked === false);

  // Brak wojny: nadal zablokowane (inny powód), bez licznika.
  const noWar = lock(0, false);
  check('brak wojny: locked=true', noWar.locked === true, noWar);
  check('brak wojny: notka bez licznika tur', !/dostępne za/.test(noWar.note), noWar.note);

  // Wsteczna zgodność: brak pola turnsAtWar nie blokuje (fikstury sprzed zmiany).
  const legacy = resolveDiplomacyActionLock({ actionId: '10', atWar: true, contact: true });
  check('undefined turnsAtWar: odblokowane (wsteczna zgodność)', legacy.locked === false, legacy);

  // Inne akcje nie zmieniają się przez tę blokadę (np. wypowiedzenie wojny w trwającej wojnie).
  const war11 = resolveDiplomacyActionLock({ actionId: '11', atWar: true, turnsAtWar: 2, contact: true });
  check('akcja 11 nie jest blokowana licznikiem pokoju', !/dostępne za/.test(war11.note || ''), war11);

  console.log(`\nSUMA: PASS=${pass} FAIL=${fail}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
