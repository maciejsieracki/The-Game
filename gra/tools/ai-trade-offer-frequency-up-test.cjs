'use strict';
/**
 * ai-trade-offer-frequency-up-test.cjs — R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1 (obrona r2).
 *
 * Strażnik odstępu i limitu propozycji cyklicznej wymiany AI -> gracz.
 * Runda 2 cofnęła zmianę cooldownu 15 -> 5 (zarzut 1 Evaluatora: brak zmierzonego efektu,
 * cooldown nie był ogranicznikiem). Wartość 15 jest wartością właściciela; każda zmiana
 * wymaga decyzji właściciela (O1/O2/O3 w 10-operator-claude.md / 30-obrona-claude.md).
 *
 *   [1] cooldown = 15 (ai-params.json i ai.ts) — strażnik przed nieplanowaną zmianą (dowód mutacyjny: 5 -> FAIL).
 *   [2] odstęp (zachowanie): canAiProposeResourceTrade blokuje tury 1..14 po propozycji, dozwala od 15.
 *   [3] bramki (zachowanie, decideAIDiplomacy z ai.ts): brak kontaktu, wojna, brak oferty,
 *       cooldown (14 tur blokuje, 15 dozwala), partner inny niż gracz -> brak komendy.
 *   [4] limit 1 aktywnej oferty i zapis cooldownu (źródłowo, main.ts): hasPendingBarter w bramce,
 *       zapis aiResourceBarterLastProposalTurn dopiero przy wstawieniu oferty na stół.
 *       Uwaga: pkt 4 sprawdza obecność kodu, nie zachowanie w rozgrywce; zachowanie w pełnej grze
 *       mierzy gra/tools/measure-ai-trade-offer-frequency*.cjs (NIE_ZMIERZONO tutaj).
 *
 * Uruchom z katalogu gra/:  node tools/ai-trade-offer-frequency-up-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const bundle = path.resolve(__dirname, '.ai-trade-offer-frequency-up-bundle.cjs');
const entry = path.resolve(__dirname, '.ai-trade-offer-frequency-up-entry.ts');
fs.writeFileSync(entry, `
export { AI_TRADE_BARTER_COOLDOWN_TURNS, decideAIDiplomacy } from '../src/game/ai.ts';
export { canAiProposeResourceTrade } from '../src/game/diplomacy-economy.ts';
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle,
  absWorkingDir: GRA, logLevel: 'silent',
});
const { AI_TRADE_BARTER_COOLDOWN_TURNS, decideAIDiplomacy, canAiProposeResourceTrade } = require(bundle);

let pass = 0;
let fail = 0;
function check(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); } else { fail++; console.log('  FAIL:', msg); }
}

const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const aiSrc = fs.readFileSync(path.join(GRA, 'src', 'game', 'ai.ts'), 'utf8');
const paramsRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'ai-params.json'), 'utf8'));

// Helpery zachowania — jak w ai-trade-proposal-branch-test.cjs.
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
function run(relOver, turn, lastProposalTurn) {
  const r = rel(relOver || {});
  if (lastProposalTurn !== undefined) r.lastResourceBarterProposalTurn = lastProposalTurn;
  return decideAIDiplomacy({
    myPlayerId: '2', agresja: 0.1, myTypCywilizacji: 'grecy',
    currentTurn: turn === undefined ? 30 : turn, relacje: [r],
  });
}
const barterCmds = (cmds) => cmds.filter(c => c.type === 'zaproponuj_wymiane_cykliczna');

console.log('[1] cooldown propozycji cyklicznej (strażnik wartości właściciela)');
check(paramsRaw.propozycja_wymiany_surowcow_cooldown_tur.wartosc === 15,
  `ai-params.json propozycja_wymiany_surowcow_cooldown_tur = 15 (jest ${paramsRaw.propozycja_wymiany_surowcow_cooldown_tur.wartosc})`);
check(AI_TRADE_BARTER_COOLDOWN_TURNS === 15,
  `AI_TRADE_BARTER_COOLDOWN_TURNS (ai.ts) = 15 (jest ${AI_TRADE_BARTER_COOLDOWN_TURNS})`);

console.log('[2] odstęp między propozycjami tej samej AI (zachowanie)');
const last = 40;
check(canAiProposeResourceTrade(last + 14, last, AI_TRADE_BARTER_COOLDOWN_TURNS) === false,
  'w 14. turze po propozycji (przed upływem cooldownu 15) propozycja zablokowana');
check(canAiProposeResourceTrade(last + 15, last, AI_TRADE_BARTER_COOLDOWN_TURNS) === true,
  'w 15. turze po propozycji cooldown upływa, propozycja dozwolona');
check(canAiProposeResourceTrade(last + 1, undefined, AI_TRADE_BARTER_COOLDOWN_TURNS) === true,
  'AI bez poprzedniej propozycji może zaproponować');

console.log('[3] bramki decyzji AI (zachowanie, decideAIDiplomacy)');
check(barterCmds(run({})).length === 1, 'pełne warunki -> dokładnie jedna komenda zaproponuj_wymiane_cykliczna');
check(barterCmds(run({ contactEstablished: false })).length === 0, 'brak kontaktu -> brak oferty');
check(barterCmds(run({ stanWojny: true })).length === 0, 'wojna -> brak oferty');
check(barterCmds(run({ resourceBarterOffer: undefined })).length === 0, 'brak kandydata wymiany -> brak oferty');
check(barterCmds(run({ partnerId: '3' })).length === 0, 'partner inny niż gracz (AI-AI) -> brak oferty cyklicznej');
check(barterCmds(run({}, 24, 10)).length === 0, 'tura 24, ostatnia propozycja 10 (14 tur po) -> zablokowane');
check(barterCmds(run({}, 25, 10)).length === 1, 'tura 25, ostatnia propozycja 10 (15 tur po) -> dozwolone');

console.log('[4] limit 1 aktywnej oferty i zapis cooldownu (źródłowo, main.ts)');
const gateRe = /const resourceBarterOffer = relStatus !== 'wojna'[\s\S]*?&& !hasPendingBarter[\s\S]*?canAiProposeResourceTrade\(\s*turn, aiResourceBarterLastProposalTurn\.get\(ownerId\), AI_TRADE_BARTER_COOLDOWN_TURNS,/;
check(gateRe.test(mainSrc), 'resourceBarterOffer: wojna wyklucza, brak oferty w toku (!hasPendingBarter), cooldown AI_TRADE_BARTER_COOLDOWN_TURNS');
check(/n\.aiCyclicBarter && n\.proposerOwnerId === ownerId && n\.responderOwnerId === ME\(\)/.test(mainSrc),
  'hasPendingBarter liczy oferty cykliczne AI->gracz na stole (aiCyclicBarter)');
check(/aiResourceBarterLastProposalTurn\.set\(ownerId, turn\);/.test(mainSrc),
  'cooldown zapisywany dopiero po wstawieniu oferty na stół (main.ts enqueue)');
check(/!rel\.stanWojny && rel\.partnerId === '0' && rel\.contactEstablished === true\s*&& barter\s*&& canAiProposeResourceTrade\(currentTurnForTrade, rel\.lastResourceBarterProposalTurn, AI_TRADE_BARTER_COOLDOWN_TURNS\)/.test(aiSrc),
  'ai.ts: propozycja cykliczna wymaga braku wojny, kontaktu i cooldownu (AI_TRADE_BARTER_COOLDOWN_TURNS)');
check(/diplomaticContactEstablishedSet\(\)\.has\(ownerId\)/.test(mainSrc),
  'main.ts: propozycja wymaga ustanowionego kontaktu dyplomatycznego');

console.log(`\n=== ai-trade-offer-frequency-up-test: ${pass} pass, ${fail} fail ===`);
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (_) { /* sprzątanie best-effort */ }
process.exit(fail === 0 ? 0 : 1);
