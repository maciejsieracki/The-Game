'use strict';
/**
 * ai-trade-offer-frequency-up-test.cjs — R-WEB-AI-TRADE-OFFER-FREQUENCY-UP-Q1 (runda 2).
 *
 * Regresja odstępu i limitu propozycji cyklicznej wymiany AI -> gracz:
 *   1. Cooldown propozycji (ai-params.json `propozycja_wymiany_surowcow_cooldown_tur`) = 5 tur
 *      (baza sprzed rundy: 15 — test czerwony na bazie).
 *   2. Odstęp: AI nie składa kolejnej propozycji przed upływem cooldownu, a składa po jego upływie
 *      (`canAiProposeResourceTrade`, src/game/diplomacy-economy.ts).
 *   3. Limit 1 aktywnej (nierozpatrzonej) oferty cyklicznej od jednej AI: bramka `!hasPendingBarter`
 *      oraz `canAiProposeResourceTrade(...)` w kroku decyzji AI (main.ts) i w ai.ts (zaproponuj_wymiane_cykliczna).
 *   4. Bramki pozostają: wojna / brak kontaktu / brak wymiany wykluczają propozycję (źródłowo, main.ts + ai.ts).
 *
 * Uwaga: testy źródłowe (pkt 3-4) weryfikują obecność bramek w kodzie, nie zachowanie w grze —
 * zachowanie w pełnej rozgrywce mierzy gra/tools/measure-ai-trade-offer-frequency*.cjs (NIE_ZMIERZONO tutaj).
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
export { AI_TRADE_BARTER_COOLDOWN_TURNS } from '../src/game/ai.ts';
export { canAiProposeResourceTrade } from '../src/game/diplomacy-economy.ts';
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle,
  absWorkingDir: GRA, logLevel: 'silent',
});
const { AI_TRADE_BARTER_COOLDOWN_TURNS, canAiProposeResourceTrade } = require(bundle);

let pass = 0;
let fail = 0;
function check(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); } else { fail++; console.log('  FAIL:', msg); }
}

const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const aiSrc = fs.readFileSync(path.join(GRA, 'src', 'game', 'ai.ts'), 'utf8');
const paramsRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'ai-params.json'), 'utf8'));

console.log('[1] cooldown propozycji cyklicznej');
check(paramsRaw.propozycja_wymiany_surowcow_cooldown_tur.wartosc === 5,
  `ai-params.json propozycja_wymiany_surowcow_cooldown_tur = 5 (jest ${paramsRaw.propozycja_wymiany_surowcow_cooldown_tur.wartosc})`);
check(AI_TRADE_BARTER_COOLDOWN_TURNS === 5,
  `AI_TRADE_BARTER_COOLDOWN_TURNS (ai.ts) = 5 (jest ${AI_TRADE_BARTER_COOLDOWN_TURNS})`);

console.log('[2] odstęp między propozycjami tej samej AI');
const last = 40;
check(canAiProposeResourceTrade(last + 4, last, AI_TRADE_BARTER_COOLDOWN_TURNS) === false,
  'w 4. turze po propozycji (przed upływem cooldownu 5) propozycja zablokowana');
check(canAiProposeResourceTrade(last + 5, last, AI_TRADE_BARTER_COOLDOWN_TURNS) === true,
  'w 5. turze po propozycji cooldown upływa, propozycja dozwolona');
check(canAiProposeResourceTrade(last + 1, undefined, AI_TRADE_BARTER_COOLDOWN_TURNS) === true,
  'AI bez poprzedniej propozycji może zaproponować');

console.log('[3] limit 1 aktywnej oferty cyklicznej od AI (źródłowo, main.ts)');
const gateRe = /const resourceBarterOffer = relStatus !== 'wojna'[\s\S]*?&& !hasPendingBarter[\s\S]*?canAiProposeResourceTrade\(\s*turn, aiResourceBarterLastProposalTurn\.get\(ownerId\), AI_TRADE_BARTER_COOLDOWN_TURNS,/;
check(gateRe.test(mainSrc), 'resourceBarterOffer: wojna wyklucza, brak oferty w toku (!hasPendingBarter), cooldown AI_TRADE_BARTER_COOLDOWN_TURNS');
check(/n\.aiCyclicBarter && n\.proposerOwnerId === ownerId && n\.responderOwnerId === ME\(\)/.test(mainSrc),
  'hasPendingBarter liczy oferty cykliczne AI->gracz na stole (aiCyclicBarter)');
check(/aiResourceBarterLastProposalTurn\.set\(ownerId, turn\);/.test(mainSrc),
  'cooldown zapisywany dopiero po wstawieniu oferty na stół (main.ts enqueue)');

console.log('[4] bramki wojny / kontaktu / wymiany (źródłowo, ai.ts)');
check(/!rel\.stanWojny && rel\.partnerId === '0' && rel\.contactEstablished === true\s*&& barter\s*&& canAiProposeResourceTrade\(currentTurnForTrade, rel\.lastResourceBarterProposalTurn, AI_TRADE_BARTER_COOLDOWN_TURNS\)/.test(aiSrc),
  'ai.ts: propozycja cykliczna wymaga braku wojny, kontaktu i cooldownu (AI_TRADE_BARTER_COOLDOWN_TURNS)');
check(/diplomaticContactEstablishedSet\(\)\.has\(ownerId\)/.test(mainSrc),
  'main.ts: propozycja wymaga ustanowionego kontaktu dyplomatycznego');

console.log(`\n=== ai-trade-offer-frequency-up-test: ${pass} pass, ${fail} fail ===`);
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (_) { /* sprzątanie best-effort */ }
process.exit(fail === 0 ? 0 : 1);
