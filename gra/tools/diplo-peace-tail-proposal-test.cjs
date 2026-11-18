'use strict';
/**
 * diplo-peace-tail-proposal-test.cjs — R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 (runda 2, ścieżka gracza).
 * Ogon ceny pokoju po miastach (złoto → brąz → żelazo → rudy) w evaluateProposal (diplomacy-proposals.ts):
 *  (t1) pokój: złoto NIE jest odrzucane słodzikiem (zakaz wycofany dla pokoju, ABC A);
 *  (t2) silniejsza AI: złoto z zapasem płatnika pokrywa cenę (ogon zastępuje brakujące miasto, ABC B);
 *  (t3) zapas płatnika 0 → odrzucone „brak zapasu”, nigdy poniżej zera;
 *  (t4) surowiec spoza kolejności ogona (np. drewno) → odrzucone;
 *  (t5) rozejm: złoto nadal odrzucane (rozejm bez złota/surowców, ABC A);
 *  (t6) silniejsza AI, miasto bez ogona i za małe → odrzucone (ogon nie pojawia się sam).
 * Run: node tools/diplo-peace-tail-proposal-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', '.dip-tail-proposal-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-tail-proposal-bundle.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = "export { evaluateProposal, createNegotiation, negotiationAsProposal } from './game/diplomacy-proposals';\n";

function cleanup() {
  for (const p of [ENTRY, BUNDLE]) {
    try { fs.rmSync(p, { force: true }); } catch (_) { /* ok */ }
  }
}

async function main() {
  fs.writeFileSync(ENTRY, ENTRY_SRC);
  try {
    await esbuild.build({
      entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: BUNDLE, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent',
    });
    const mod = require(BUNDLE);
    const WOJNA = { zaufanie: 5, respekt: 5, status: 'wojna' };
    const ctx = (pozycja, payerStock) => ({
      relation: WOJNA, stanWojny: true, turn: 80, proposerRespekt: 60, responderRespekt: 60,
      militaryRatio: 1, respektWzgledny: 0.5, karaWspolnaGranica: false, difficulty: 'normal',
      responderPlayer: { ownerId: 1, typCywilizacji: 'rzymianie' },
      proposerPlayer: { ownerId: 0, typCywilizacji: 'rzymianie' },
      authorOwnerId: 0,
      payerStock,
      warState: { turnsAtWar: 12, lostCitiesResponder: 0, responderRw: 0.5, responderPozycjaMilitarna: pozycja },
    });
    const evalP = (actionId, payload, pozycja, payerStock, turns = 12) => {
      const entry = mod.createNegotiation(
        { actionId, proposerOwnerId: 0, responderOwnerId: 1, payload }, 80, 'player', turns);
      return mod.evaluateProposal(mod.negotiationAsProposal(entry), ctx(pozycja, payerStock));
    };
    const BIG = 1e9;

    const t1 = evalP('pokoj', { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }] }, 'slabsza', { zloto: BIG });
    check('t1 pokoj: zloto nie jest odrzucane slodzikiem', !/Złoto i surowce/.test(t1.reason || ''), t1);

    const t2 = evalP('pokoj', { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: BIG }] }, 'silniejsza', { zloto: BIG });
    check('t2 silniejsza AI: zloto z zapasem pokrywa cene (ogon zastepuje miasto)', t2.accepted === true, t2);

    const t3 = evalP('pokoj', { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: BIG }] }, 'silniejsza', { zloto: 0 });
    check('t3 zapas platnika 0 → odrzucone „brak zapasu”', t3.accepted === false && /brak zapasu/.test(t3.reason || ''), t3);

    const t4 = evalP('pokoj', { giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 50 }] }, 'silniejsza', { drewno: BIG });
    check('t4 surowiec spoza ogona (drewno) → odrzucone', t4.accepted === false && /nieobsługiwany/.test(t4.reason || ''), t4);

    const t5 = evalP('rozejm', { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }] }, 'silniejsza', { zloto: BIG });
    check('t5 rozejm: zloto nadal odrzucane (bez zlota/surowcow)', t5.accepted === false && /Złoto i surowce/.test(t5.reason || ''), t5);

    const t6 = evalP('pokoj', { giveItems: [{ typ: 'miasto', id: 'x', ilosc: 1, cityPn: 10, cityWeight: 1 }] }, 'silniejsza', { zloto: BIG });
    check('t6 silniejsza AI: male miasto bez ogona odrzucone', t6.accepted === false, t6);

    console.log(`\ndiplo-peace-tail-proposal-test: ${pass} pass / ${fail} fail`);
    process.exitCode = fail > 0 ? 1 : 0;
  } finally {
    cleanup();
  }
}

main().catch(err => { console.error(err); cleanup(); process.exitCode = 1; });
