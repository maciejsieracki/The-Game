'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const bundle = path.resolve(__dirname, '.ai-trade-proposal-bundle.cjs');
const entry = path.resolve(__dirname, '.ai-trade-proposal-entry.ts');
fs.writeFileSync(entry, `
export { selectAiTradeBarter } from '../src/game/ai-trade-proposal.ts';
export { evaluateProposal, resolvePlayerAcceptsAiPending, aiCommandToPendingProposal, handelFairnessGate } from '../src/game/diplomacy-proposals.ts';
export { diplomacyHandelSurowiecKrok, diplomacyPnSurowiecIlosc } from '../src/game/diplomacy-value-catalog.ts';
export { transferSurowiecIlosc } from '../src/game/diplomacy-basket-transfer.ts';
export { canAiProposeResourceTrade } from '../src/game/diplomacy-economy.ts';
export { rejectCooldownKeyFor, recordRejectedOffer, isOfferRejectedOnCooldown } from '../src/game/diplomacy-rejection-cooldown.ts';
export { AI_TRADE_BARTER_COOLDOWN_TURNS } from '../src/game/ai.ts';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
const { selectAiTradeBarter, evaluateProposal, resolvePlayerAcceptsAiPending, aiCommandToPendingProposal, handelFairnessGate, diplomacyPnSurowiecIlosc, transferSurowiecIlosc, canAiProposeResourceTrade, rejectCooldownKeyFor, recordRejectedOffer, isOfferRejectedOnCooldown, AI_TRADE_BARTER_COOLDOWN_TURNS } = require(bundle);
let pass = 0;
function ok(v, m) { if (!v) throw new Error(`FAIL: ${m}`); pass++; console.log('  OK:', m); }
const relation = { zaufanie: 60, respekt: 50, status: 'pokoj' };
const evalCtx = { relation, stanWojny: false, turn: 20, proposerRespekt: 50, responderRespekt: 50, militaryRatio: 1 };
let gateCalls = 0;
const candidate = selectAiTradeBarter({
  aiResources: [
    { key: 'drewno', stock: 2030, netRate: 0, deficit: false, surplus: true, reserve: 30 },
    { key: 'zelazo', stock: 0, netRate: -10, deficit: true, surplus: false, reserve: 0 },
  ],
  playerResources: [
    { key: 'drewno', stock: 0, netRate: -20, deficit: true, surplus: false, reserve: 0 },
    { key: 'zelazo', stock: 2030, netRate: 0, deficit: false, surplus: true, reserve: 30 },
  ],
  turns: 10,
  resolvePayloadPn: payload => ({
    givePn: diplomacyPnSurowiecIlosc(payload.giveItems[0].id, payload.giveItems[0].ilosc),
    receivePn: diplomacyPnSurowiecIlosc(payload.receiveItems[0].id, payload.receiveItems[0].ilosc),
  }),
  fairnessGate: (givePn, receivePn) => { gateCalls++; return handelFairnessGate(givePn, receivePn, 110, 1) == null; },
  evaluateExactPayload: payload => evaluateProposal({ actionId: 'handel', proposerOwnerId: 2, responderOwnerId: 0, payload }, evalCtx).accepted,
});
ok(candidate && candidate.giveKey === 'drewno' && candidate.receiveKey === 'zelazo', 'selects AI surplus wood for player iron deficit');
ok(candidate.giveQty === 200 && candidate.receiveQty === 10, 'derives feasible fair quantities from stock reserve and deficit rate');
ok(gateCalls > 0 && candidate.givePn >= candidate.receivePn, 'passes candidates through existing PW fairness gate');
ok(evaluateProposal({ actionId: 'handel', proposerOwnerId: 2, responderOwnerId: 0, payload: candidate.payload }, evalCtx).accepted, 'exact per-turn payload passes incoming proposal evaluation');

let negativeGateCalls = 0;
const unfair = selectAiTradeBarter({
  aiResources: [
    { key: 'drewno', stock: 330, netRate: 0, deficit: false, surplus: true, reserve: 30 },
    { key: 'zelazo', stock: 0, netRate: -10, deficit: true, surplus: false, reserve: 0 },
  ],
  playerResources: [
    { key: 'drewno', stock: 0, netRate: -10, deficit: true, surplus: false, reserve: 0 },
    { key: 'zelazo', stock: 130, netRate: 0, deficit: false, surplus: true, reserve: 30 },
  ],
  turns: 10,
  resolvePayloadPn: payload => ({
    givePn: diplomacyPnSurowiecIlosc(payload.giveItems[0].id, payload.giveItems[0].ilosc),
    receivePn: diplomacyPnSurowiecIlosc(payload.receiveItems[0].id, payload.receiveItems[0].ilosc),
  }),
  fairnessGate: (givePn, receivePn) => { negativeGateCalls++; return handelFairnessGate(givePn, receivePn, 110, 1) == null; },
  evaluateExactPayload: () => true,
});
ok(unfair === null && negativeGateCalls > 0, 'rejects wood 30 (3 PW) for iron 10 (20 PW) through existing gate');

const cmd = { type: 'zaproponuj_wymiane_cykliczna', targetId: '0', powod: 'barter', giveKey: candidate.giveKey, giveQty: candidate.giveQty, receiveKey: candidate.receiveKey, receiveQty: candidate.receiveQty, turns: 10 };
const pending = aiCommandToPendingProposal(cmd, 2, 0, 20);
ok(pending && pending.actionId === 'handel' && pending.payload.resourceTradeMode === 'per_turn', 'uses standard AI pending negotiation conversion');
const accepted = resolvePlayerAcceptsAiPending(pending, 20, 'normal', { hasTradeTech: ownerId => ownerId === 0 || ownerId === 2 });
ok(accepted.accepted && accepted.deal && accepted.deal.handelSurowiecCykliczny.length === 2, 'acceptance builds standard active cyclic exchange with both deliveries');
let cities = [
  { id: 'ai', ownerId: 2, surowce: { drewno: candidate.giveQty } },
  { id: 'human', ownerId: 0, surowce: { zelazo: candidate.receiveQty } },
];
for (const item of accepted.deal.handelSurowiecCykliczny) {
  const delivery = transferSurowiecIlosc(item.surowiecKey, item.pakietyPerTura, item.sellerOwnerId, item.buyerOwnerId, null, cities);
  ok(delivery.moved === item.pakietyPerTura, `cyclic tick delivers ${item.surowiecKey}`);
  cities = delivery.cities;
}
ok(cities[0].surowce.zelazo === candidate.receiveQty && cities[1].surowce.drewno === candidate.giveQty, 'accepted deal delivers each resource on the following cyclic tick');
ok(AI_TRADE_BARTER_COOLDOWN_TURNS === 15, 'uses owner configured 15-turn AI barter cooldown');
ok(!canAiProposeResourceTrade(24, 10, AI_TRADE_BARTER_COOLDOWN_TURNS), 'barter cooldown blocks turn 14');
ok(canAiProposeResourceTrade(25, 10, AI_TRADE_BARTER_COOLDOWN_TURNS), 'barter cooldown opens on turn 15');
ok(canAiProposeResourceTrade(26, 10, AI_TRADE_BARTER_COOLDOWN_TURNS), 'barter cooldown stays open after turn 15');
const rejectKey = rejectCooldownKeyFor('zaproponuj_wymiane_cykliczna', 'handel');
const rejected = recordRejectedOffer([], 2, rejectKey, 20);
ok(rejectKey === 'wymiana_cykliczna' && isOfferRejectedOnCooldown(rejected, 2, rejectKey, 21), 'rejection records a separate cyclic barter key');
ok(!isOfferRejectedOnCooldown(rejected, 2, 'handel', 21), 'barter rejection does not block other handel proposals');
console.log(`ai-trade-proposal-to-player-test: ${pass} assertions passed`);
fs.rmSync(bundle, { force: true });
fs.rmSync(entry, { force: true });
