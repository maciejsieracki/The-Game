'use strict';
/**
 * diplo-winner-proposal-table-test.cjs — R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1 (runda 3, pkt 3 GOAL).
 * Tabela przypadków evaluateProposal('pokoj'): autor (gracz/AI) × adresat (silniejszy/słabszy)
 * × tury wojny (5/10/11) × miasta utracone (0/1/3 → poziom zmęczenia L).
 * Asercje: każde odrzucenie ma niepusty powód; słabsza AI przy L>=80% nie odrzuca z powodu siły.
 * Bundle w pamięci (esbuild, bez zapisu plików). Run: node tools/diplo-winner-proposal-table-test.cjs
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
  "export { evaluateProposal, createNegotiation, negotiationAsProposal } from './game/diplomacy-proposals';",
  "export { warWearinessLevel } from './game/war-weariness';",
  "",
].join('\n');

async function main() {
  const result = await esbuild.build({
    stdin: { contents: ENTRY_SRC, resolveDir: path.resolve(GRA, 'src'), sourcefile: 'entry.ts', loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', target: 'node18', write: false,
    absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent',
  });
  const mod = { exports: {} };
  new Function('module', 'exports', result.outputFiles[0].text)(mod, mod.exports);
  const { evaluateProposal, createNegotiation, negotiationAsProposal, warWearinessLevel } = mod.exports;

  const WOJNA = { zaufanie: 0, respekt: 5, status: 'wojna' };
  const PLAYER = 0;
  const AI = 1;
  const rows = [];
  for (const author of ['gracz', 'ai']) {
    for (const adresat of ['silniejszy', 'slabszy']) {
      for (const turns of [5, 10, 11]) {
        for (const lost of [0, 1, 3, 6, 8]) {
          const authorId = author === 'gracz' ? PLAYER : AI;
          const responderId = authorId === PLAYER ? AI : PLAYER;
          const entry = createNegotiation(
            { actionId: 'pokoj', proposerOwnerId: authorId, responderOwnerId: responderId, payload: {} },
            80, author === 'gracz' ? 'player' : 'ai', 1,
          );
          const pozycja = adresat === 'silniejszy' ? 'silniejsza' : 'slabsza';
          const rwResp = adresat === 'silniejszy' ? 0.7 : 0.3;
          const level = warWearinessLevel({ turnsAtWar: turns, lostCitiesTotal: lost, turnsSinceCityChange: 0 });
          const res = evaluateProposal(negotiationAsProposal(entry), {
            relation: WOJNA, stanWojny: true, turn: 80, proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1,
            respektWzgledny: 0.5, karaWspolnaGranica: false, difficulty: 'normal',
            responderPlayer: { ownerId: responderId, typCywilizacji: 'rzymianie' },
            proposerPlayer: { ownerId: authorId, typCywilizacji: 'rzymianie' },
            authorOwnerId: authorId,
            warState: { turnsAtWar: turns, lostCitiesResponder: lost, turnsSinceCityChange: 0, responderRw: rwResp, responderPozycjaMilitarna: pozycja },
          });
          rows.push({ author, adresat, turns, lost, level: Math.round(level * 100), accepted: res.accepted, reason: res.reason ?? '' });
        }
      }
    }
  }
  console.log('autor | adresat | tury | miasta | L% | accepted | powod');
  for (const r of rows) {
    console.log(`${r.author} | ${r.adresat} | ${r.turns} | ${r.lost} | ${r.level} | ${r.accepted} | ${r.reason}`);
  }
  for (const r of rows) {
    if (!r.accepted) {
      check(`odrzucenie ma konkretny powod: ${r.author}/${r.adresat}/t${r.turns}/m${r.lost}`, r.reason.length > 0, r);
    }
  }
  for (const r of rows.filter(x => x.author === 'gracz' && x.adresat === 'slabszy' && x.level >= 80)) {
    check(`slabsza AI L>=80%: brak odmowy militarnej (t${r.turns}/m${r.lost})`, !/silni/.test(r.reason), r);
  }
  console.log(`SUMA: PASS=${pass} FAIL=${fail}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exitCode = 1; });
