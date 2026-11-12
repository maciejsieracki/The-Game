'use strict';
/**
 * ai-trade-oneshot-overpay-limit-test.cjs — R-WEB-AI-TRADE-ONESHOT-OVERPAY-LIMIT-Q1.
 * Jednorazowa oferta handlowa AI -> gracz nie może oddawać więcej PW, niż AI otrzymuje
 * (givePn <= receivePn). Dar (isGift) i kierunek gracz -> AI są poza limitem.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const bundle = path.resolve(__dirname, '.ai-trade-oneshot-overpay-bundle.cjs');
const entry = path.resolve(__dirname, '.ai-trade-oneshot-overpay-entry.ts');
fs.writeFileSync(entry, `
export { evaluateProposal, aiHandelOverpaysPlayer } from '../src/game/diplomacy-proposals.ts';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
const { evaluateProposal, aiHandelOverpaysPlayer } = require(bundle);
let pass = 0;
function ok(v, m) { if (!v) throw new Error(`FAIL: ${m}`); pass++; console.log('  OK:', m); }
const relation = { zaufanie: 60, respekt: 50, status: 'pokoj' };
const evalCtx = { relation, stanWojny: false, turn: 20, proposerRespekt: 50, responderRespekt: 50, militaryRatio: 1 };

// AI (2) -> gracz (0): AI oddaje 300 PW, dostaje 100 PW -> nadpłata, odrzucona.
const overpay = { actionId: 'handel', givePn: 300, receivePn: 100 };
ok(aiHandelOverpaysPlayer(overpay) === true, 'helper: AI overpay (givePn 300 > receivePn 100) is flagged');

// Równa wartość (givePn == receivePn) nie jest nadpłatą.
const equal = { actionId: 'handel', givePn: 100, receivePn: 100 };
ok(aiHandelOverpaysPlayer(equal) === false, 'helper: equal PW (givePn == receivePn) is not an overpay');
const rEq = evaluateProposal({ actionId: 'handel', proposerOwnerId: 2, responderOwnerId: 0, payload: equal }, evalCtx);
ok(!/nadpłacona/.test(rEq.reason || ''), 'evaluate: equal PW is not rejected by the overpay limit');

// Dar AI (isGift, bez receivePn) jest poza limitem.
const gift = { actionId: 'handel', isGift: true, givePn: 200, receivePn: 0 };
ok(aiHandelOverpaysPlayer(gift) === false, 'helper: AI gift is exempt from the overpay limit');

// Kierunek gracz -> AI: limit nie dotyczy (bramka gracz->AI bez zmian).
const playerOver = { actionId: 'handel', givePn: 300, receivePn: 100 };
ok(aiHandelOverpaysPlayer(playerOver) === true, 'helper: payload itself is overpay (direction is decided by caller)');
const rPlayer = evaluateProposal({ actionId: 'handel', proposerOwnerId: 0, responderOwnerId: 2, payload: playerOver }, evalCtx);
ok(!/nadpłacona/.test(rPlayer.reason || ''), 'evaluate: player->AI direction is not gated by the AI overpay limit');

console.log(`ai-trade-oneshot-overpay-limit-test: ${pass} assertions passed`);
fs.rmSync(bundle, { force: true });
fs.rmSync(entry, { force: true });
