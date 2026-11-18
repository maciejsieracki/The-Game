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
  "export { peaceRejectReasonSuffix } from './game/diplomacy-peace-proposal-timing';",
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
  const { evaluateProposal, createNegotiation, negotiationAsProposal, warWearinessLevel, peaceRejectReasonSuffix } = mod.exports;

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
  // R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1 r3 (zarzut 3 Evaluatora): asercje na KONKRETNE liczby i rodzaj powodu.
  const find = (author, adresat, turns, lost) => rows.find(x => x.author === author && x.adresat === adresat && x.turns === turns && x.lost === lost);
  // Blokada 10 tur: każdy wariant (autor × adresat × miasta) przy 5 turach wojny = powód „po 10 pełnych turach".
  for (const r of rows.filter(x => x.turns === 5)) {
    check(`blokada 10 tur: t5 ${r.author}/${r.adresat}/m${r.lost} -> powód licznika`, !r.accepted && /dostępne po 10 pełnych turach/.test(r.reason), r);
  }
  // Zmęczenie: wartości L (0,13 / 0,25 / 0,28 / 1,00) wynikają z liczby tur i miast; t11/m0 = 28%.
  check('zmęczenie t11/m0 = 28%', find('gracz', 'slabszy', 11, 0).level === 28, find('gracz', 'slabszy', 11, 0));
  check('zmęczenie t10/m0 = 25%', find('gracz', 'slabszy', 10, 0).level === 25, find('gracz', 'slabszy', 10, 0));
  check('zmęczenie t10/m8 = 100% (cena pokoju 0)', find('gracz', 'slabszy', 10, 8).level === 100, find('gracz', 'slabszy', 10, 8));
  // Słabsza AI, gracz-autor, t10/m0: konkretny bilans PW (N=4050 po rabacie, baza 4500), rodzaj = bilans PW, nie siła.
  const slab = find('gracz', 'slabszy', 10, 0);
  check('slabsza t10/m0: powód = bilans PW z liczbami 4050/4500', /Brakuje 4050 PW.*baza 4500 PW/.test(slab.reason), slab);
  check('slabsza t10/m0: powód NIE jest odmową militarną', !/silni/.test(slab.reason), slab);
  check('slabsza t10/m8: pokój przechodzi (accepted)', find('gracz', 'slabszy', 10, 8).accepted === true, find('gracz', 'slabszy', 10, 8));
  // Silniejsza AI, gracz-autor, t11/m0: odmowa militarna z żądaną wartością miasta = cena pokoju 4350 PN.
  const sil = find('gracz', 'silniejszy', 11, 0);
  check('silniejsza t11/m0: powód militarny z ceną 4350', /militarnie silniejsza/.test(sil.reason) && /≥ 4350 PW/.test(sil.reason) && /wymagane 4350 PN/.test(sil.reason), sil);
  check('silniejsza t11/m0: oferta miast warta 0 PN (liczby w powodzie)', /miasta w ofercie warte 0 PN/.test(sil.reason), sil);
  check('silniejsza t10/m8: pokój przechodzi (accepted)', find('gracz', 'silniejszy', 10, 8).accepted === true, find('gracz', 'silniejszy', 10, 8));
  // AI jako autor: bramka siły nie dotyczy (zgodnie z kodem); przy t10 i t11 bez miast — accepted.
  check('AI-autor t10/m0 accepted (bramka siły tylko dla autora-gracza)', find('ai', 'silniejszy', 10, 0).accepted === true, find('ai', 'silniejszy', 10, 0));
  check('AI-autor t11/m0 accepted', find('ai', 'slabszy', 11, 0).accepted === true, find('ai', 'slabszy', 11, 0));
  // Rozejm: ta sama blokada 10 tur (akcja 'rozejm').
  const rozejm5 = evaluateProposal(negotiationAsProposal(createNegotiation(
    { actionId: 'rozejm', proposerOwnerId: PLAYER, responderOwnerId: AI, payload: { turns: 10 } }, 80, 'player', 1)), {
    relation: WOJNA, stanWojny: true, turn: 80, proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1,
    respektWzgledny: 0.5, karaWspolnaGranica: false, difficulty: 'normal',
    responderPlayer: { ownerId: AI, typCywilizacji: 'rzymianie' }, proposerPlayer: { ownerId: PLAYER, typCywilizacji: 'rzymianie' },
    authorOwnerId: PLAYER, warState: { turnsAtWar: 5, lostCitiesResponder: 0, turnsSinceCityChange: 0, responderRw: 0.3, responderPozycjaMilitarna: 'slabszy' },
  });
  check('rozejm t5: blokada 10 tur (akcja rozejm)', rozejm5.accepted === false && /10 pełnych turach/.test(rozejm5.reason), rozejm5);
  // Dopisek powodu do toastu odmowy (main.ts, resolveNegotiationEntryAt): tylko pokój/rozejm, pusty dla reszty.
  check('toast: pokoj z powodem dostaje dopisek', peaceRejectReasonSuffix('pokoj', 'Brakuje 4050 PW') === ' — powód: Brakuje 4050 PW', peaceRejectReasonSuffix('pokoj', 'Brakuje 4050 PW'));
  check('toast: rozejm z powodem dostaje dopisek', peaceRejectReasonSuffix('rozejm', 'x').length > 0, null);
  check('toast: inna akcja (trybut_zadanie) bez dopisku', peaceRejectReasonSuffix('trybut_zadanie', 'x') === '', null);
  check('toast: pokoj bez powodu bez dopisku', peaceRejectReasonSuffix('pokoj', '   ') === '' && peaceRejectReasonSuffix('pokoj', undefined) === '', null);
  console.log(`SUMA: PASS=${pass} FAIL=${fail}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exitCode = 1; });
