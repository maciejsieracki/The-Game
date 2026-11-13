'use strict';
/**
 * ai-trade-proposal-branch-test.cjs — R-WEB-AI-TRADE-PROPOSALS-TO-PLAYER-Q1 (obrona r1).
 * Galaz decideAIDiplomacy 'zaproponuj_wymiane_cykliczna' (ai.ts): warunki kontaktu,
 * wojny, brak oferty, cooldown 15 tur (14/15/16) i zakres tylko AI->gracz (partnerId '0').
 * Run from gra/: node tools/ai-trade-proposal-branch-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const BUNDLE = path.resolve(__dirname, '.ai-trade-branch-bundle.cjs');
const entry = path.resolve(__dirname, '.ai-trade-branch-entry.ts');
fs.writeFileSync(entry, `
export { decideAIDiplomacy, AI_TRADE_BARTER_COOLDOWN_TURNS } from '../src/game/ai.ts';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
const { decideAIDiplomacy, AI_TRADE_BARTER_COOLDOWN_TURNS } = require(BUNDLE);
let pass = 0;
let fail = 0;
function assert(c, m) {
  if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); }
}

const BARTER = { giveKey: 'drewno', giveQty: 200, receiveKey: 'zelazo', receiveQty: 10, turns: 10 };
function rel(over) {
  return {
    partnerId: '0',
    relation: { zaufanie: 60, respekt: 50, status: 'pokoj' },
    respektWzgledny: 1,
    stanWojny: false,
    peaceLocked: false,
    hasNapTreaty: false,
    contactEstablished: true,
    partnerTypCywilizacji: 'rzymianie',
    resourceBarterOffer: BARTER,
    ...over,
  };
}
function run(relOver, turn) {
  return decideAIDiplomacy({
    myPlayerId: '2', agresja: 0.1, myTypCywilizacji: 'grecy',
    currentTurn: turn === undefined ? 30 : turn, relacje: [rel(relOver || {})],
  });
}
function barterCmds(cmds) { return cmds.filter(c => c.type === 'zaproponuj_wymiane_cykliczna'); }

console.log('--- A: pelne warunki -> komenda cykliczna z parametrami z resourceBarterOffer ---');
{
  const cmds = barterCmds(run({}));
  assert(cmds.length === 1, 'A: dokladnie jedna komenda zaproponuj_wymiane_cykliczna');
  assert(cmds[0] && cmds[0].targetId === '0' && cmds[0].giveKey === 'drewno' && cmds[0].receiveQty === 10 && cmds[0].turns === 10, 'A: parametry przeniesione 1:1 z oferty');
}
console.log('--- B: brak kontaktu -> brak oferty ---');
assert(barterCmds(run({ contactEstablished: false })).length === 0, 'B: contactEstablished=false blokuje');
console.log('--- C: wojna -> brak oferty ---');
assert(barterCmds(run({ stanWojny: true })).length === 0, 'C: stanWojny=true blokuje');
console.log('--- D: brak kandydata (resourceBarterOffer undefined) -> brak oferty ---');
assert(barterCmds(run({ resourceBarterOffer: undefined })).length === 0, 'D: brak resourceBarterOffer -> brak komendy');
console.log('--- E: cooldown ' + AI_TRADE_BARTER_COOLDOWN_TURNS + ' tur (ostatnia propozycja tura 10) ---');
assert(AI_TRADE_BARTER_COOLDOWN_TURNS === 15, 'E0: stala cooldownu = 15');
assert(barterCmds(run({ lastResourceBarterProposalTurn: 10 }, 24)).length === 0, 'E1: tura 24 (14 tur po) -> zablokowane');
assert(barterCmds(run({ lastResourceBarterProposalTurn: 10 }, 25)).length === 1, 'E2: tura 25 (15 tur po) -> dozwolone');
assert(barterCmds(run({ lastResourceBarterProposalTurn: 10 }, 26)).length === 1, 'E3: tura 26 (16 tur po) -> dozwolone');
console.log('--- F: partner inny niz gracz (AI-AI poza zakresem) -> brak oferty cyklicznej ---');
assert(barterCmds(run({ partnerId: '3' })).length === 0, 'F: partnerId != "0" -> brak oferty cyklicznej');

fs.rmSync(BUNDLE, { force: true });
fs.rmSync(entry, { force: true });
console.log('ai-trade-proposal-branch-test: ' + pass + ' passed, ' + fail + ' failed');
if (fail) process.exit(1);
