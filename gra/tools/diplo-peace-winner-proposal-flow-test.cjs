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
  "export { peaceProposalTurnsLeft, PEACE_PROPOSAL_MIN_WAR_TURNS } from './game/diplomacy-peace-proposal-timing';",
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
  const { resolveDiplomacyActionLock, peaceProposalTurnsLeft, PEACE_PROPOSAL_MIN_WAR_TURNS } = mod.exports;

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

  // Tabela przypadków: tury wojny → wyszarzenie przed kliknięciem.
  const cases = [
    { t: 0, locked: true, note: 'dostępne za 10 tur' },
    { t: 5, locked: true, note: 'dostępne za 5 tury' },
    { t: 9, locked: true, note: 'dostępne za 1 turę' },
    { t: 10, locked: false },
    { t: 11, locked: false },
  ];
  for (const c of cases) {
    const r = lock(c.t);
    check(`wojna t=${c.t}: locked=${c.locked}`, r.locked === c.locked, r);
    if (c.note) check(`wojna t=${c.t}: notka zawiera „${c.note}"`, r.note.includes(c.note), r.note);
  }

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
