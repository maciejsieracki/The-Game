'use strict';
/** diplomacy-proposal-test.cjs — v1.1 evaluateProposal (15 scenariuszy) */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.dip-proposal-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dip-proposal-entry.ts');
fs.writeFileSync(entryFile, `
export {
  evaluateProposal, applyAcceptedProposal, aiCommandToPendingProposal,
  makeDealId, proposalHasResourceAccess, clampDealTurns,
  resolvePlayerAcceptsAiPending, AI_TRADE_GOLD_ONCE, AI_TRADE_GOLD_MAX,
  enrichAiCommandWithTreasury, formatAiDiplomacyPlayerMessage,
} from '../src/game/diplomacy-proposals.ts';
export { capAiGoldOffer, AI_TRADE_GOLD_MAX as ECO_GOLD_MAX } from '../src/game/diplomacy-economy.ts';
export { addTreaty, hasTreaty, treatiesBrokenByWar, resolvePokojTrustTier } from '../src/game/diplomacy-treaties.ts';
export { getEffectiveDiplomacyParams } from '../src/game/diplomacy.ts';
`);

esbuild.buildSync({
  entryPoints: [entryFile],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const {
  evaluateProposal, applyAcceptedProposal, aiCommandToPendingProposal,
  addTreaty, hasTreaty, treatiesBrokenByWar, resolvePokojTrustTier,
  getEffectiveDiplomacyParams, proposalHasResourceAccess, clampDealTurns,
  resolvePlayerAcceptsAiPending, AI_TRADE_GOLD_ONCE, AI_TRADE_GOLD_MAX,
  enrichAiCommandWithTreasury, formatAiDiplomacyPlayerMessage, capAiGoldOffer,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

function rel(z = 50, r = 50, status = 'pokoj') {
  return { zaufanie: z, respekt: r, status };
}
function ctx(over = {}) {
  return {
    relation: rel(60, 50),
    stanWojny: false,
    turn: 10,
    proposerRespekt: 40,
    responderRespekt: 60,
    militaryRatio: 1,
    ...over,
  };
}
function prop(actionId, a = 0, b = 1, payload = {}) {
  return { actionId, proposerOwnerId: a, responderOwnerId: b, payload };
}

console.log('diplomacy-proposal-test');

// 0 Baseline progów @ normal (Maciej 2026-07-21)
const dipNormal = getEffectiveDiplomacyParams('normal');
const dipEasy = getEffectiveDiplomacyParams('easy');
const dipHard = getEffectiveDiplomacyParams('hard');
ok(dipNormal.progNapRelacja === 50, 'normal progNapRelacja 50');
ok(dipNormal.progHandelRelacja === 0, 'normal progHandelRelacja 0');
ok(dipEasy.progNapRelacja === 40, 'easy progNapRelacja 40');
ok(dipEasy.progHandelRelacja === 0, 'easy progHandelRelacja 0');
ok(dipHard.progNapRelacja === 60, 'hard progNapRelacja 60');
ok(dipHard.progHandelRelacja === 0, 'hard progHandelRelacja 0 (bez skali trudnosci)');
ok(dipNormal.progNapZaufanie === 40, 'normal progNapZaufanie 40');
ok(dipEasy.progNapZaufanie === 30, 'easy progNapZaufanie 30');
ok(dipHard.progNapZaufanie === 50, 'hard progNapZaufanie 50');

// 1 NAP accept — Relacja >= 50 @ normal (bez progu Zaufania, Maciej 2026-07-21)
let r = evaluateProposal(prop('nap', 0, 1, { turns: 15 }), ctx({ relation: rel(40, 10) }));
ok(r.accepted && r.deal?.rodzaj === 'pakt_nieagresji', 'NAP accept rel 50 zauf 5 normal');

// 1a NAP accept — Rel OK, niskie Zaufanie (brak progu Zauf)
r = evaluateProposal(prop('nap'), ctx({ relation: rel(30, 20) }));
ok(r.accepted, 'NAP accept rel 50 zauf 30 normal (bez progu Zauf)');

// 2 NAP reject low relacja @ normal
r = evaluateProposal(prop('nap'), ctx({ relation: rel(25, 24) }));
ok(!r.accepted, 'NAP reject relacja 49 normal');

// 3 NAP reject border expansion
r = evaluateProposal(prop('nap'), ctx({ ekspansjaPrzyGranicy: true }));
ok(!r.accepted, 'NAP reject ekspansja');

// 4 Sojusz pełny accept (równowaga — Zauf >90, Relacja >150)
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(96, 56),
  militaryRatio: 1,
}));
ok(r.accepted && r.deal?.rodzaj === 'sojusz_pelny', 'sojusz pełny accept');

// 4a Sojusz reject — Relacja dokładnie 150 (≤150)
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(95, 55),
  militaryRatio: 1,
}));
ok(!r.accepted, 'sojusz reject relacja 150');

// 4b Sojusz reject — równowaga Zauf 75 (<91)
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(75, 50),
  militaryRatio: 1,
}));
ok(!r.accepted, 'sojusz reject równowaga zauf 75');

// 5 Sojusz reject low trust (słaby proponent, bez premii siły)
r = evaluateProposal(prop('sojusz_defensywny'), ctx({ relation: rel(50, 60), militaryRatio: 0.4 }));
ok(!r.accepted, 'sojusz reject zaufanie 50 słaby proponent');

// 5b Sojusz accept — silny proponent obniża progi Zauf., nie Rel. (<151)
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(95, 58),
  militaryRatio: 2.5,
  proposerRespekt: 71,
  responderRespekt: 29,
}));
ok(r.accepted && r.deal?.rodzaj === 'sojusz_pelny', 'sojusz silny proponent premia siły');

// 5c Sojusz — gracz 3× silniejszy, Zauf od 83, Relacja ≥151
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(90, 62),
  militaryRatio: 3,
  proposerRespekt: 75,
  responderRespekt: 25,
}));
ok(r.accepted, 'sojusz gracz 3× silniejszy zauf 90 rel 152');

r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(85, 66),
  militaryRatio: 3,
  proposerRespekt: 75,
  responderRespekt: 25,
}));
ok(r.accepted, 'sojusz gracz 3× silniejszy zauf 85 rel 151');

r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(90, 60),
  militaryRatio: 3,
  proposerRespekt: 75,
  responderRespekt: 25,
}));
ok(!r.accepted, 'sojusz reject gracz 3× rel 150');

// 5c2 — gracz 2×: sojusz od 85 Zauf., Rel ≥151
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(91, 61),
  militaryRatio: 2,
  proposerRespekt: 67,
  responderRespekt: 33,
}));
ok(r.accepted, 'sojusz gracz 2× silniejszy zauf 91 rel 152');

r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(85, 66),
  militaryRatio: 2,
  proposerRespekt: 67,
  responderRespekt: 33,
}));
ok(r.accepted, 'sojusz gracz 2× silniejszy zauf 85 rel 151');

r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(85, 65),
  militaryRatio: 2,
  proposerRespekt: 67,
  responderRespekt: 33,
}));
ok(!r.accepted, 'sojusz reject gracz 2× rel 150');

// 5d Sojusz — gracz 2× silniejszy, wysokie zaufanie, Rel >150
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(100, 52),
  militaryRatio: 2,
  proposerRespekt: 67,
  responderRespekt: 33,
}));
ok(r.accepted, 'sojusz gracz 2× silniejszy zauf 100 rel 152');

// 5d Hegemon — AI 3× silniejsze, nawet max zaufanie
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(100, 75),
  militaryRatio: 0.33,
  proposerRespekt: 25,
  responderRespekt: 75,
}));
ok(!r.accepted && r.reason.includes('Hegemon'), 'sojusz reject hegemon AI 3× zauf 100');

// 5e AI 2× silniejsze — wymaga bardzo wysokiego zaufania (minZ≈105)
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(100, 67),
  militaryRatio: 0.5,
  proposerRespekt: 33,
  responderRespekt: 67,
}));
ok(!r.accepted, 'sojusz reject AI 2× zauf 100 (kara siły respondenta)');

r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(50, 67),
  militaryRatio: 0.5,
  proposerRespekt: 33,
  responderRespekt: 67,
}));
ok(!r.accepted, 'sojusz reject AI 2× zauf 50');

// 6 Trybut żądanie — Respekt > 70
r = evaluateProposal(prop('trybut_zadanie', 0, 1, { goldPerTurn: 15 }), ctx({
  proposerRespekt: 80,
  responderRespekt: 40,
}));
ok(r.accepted && r.deal?.ekonomia?.pieniadzePerTura === 15, 'trybut żądanie accept');

// 6b Trybut żądanie reject — Respekt dokładnie 70
r = evaluateProposal(prop('trybut_zadanie', 0, 1, { goldPerTurn: 15 }), ctx({
  proposerRespekt: 70,
  responderRespekt: 30,
}));
ok(!r.accepted, 'trybut żądanie reject Respekt 70');

// 7 Trybut żądanie reject — słabszy
r = evaluateProposal(prop('trybut_zadanie', 0, 1, { goldPerTurn: 15 }), ctx({
  proposerRespekt: 30,
  responderRespekt: 70,
}));
ok(!r.accepted, 'trybut żądanie reject słabszy');

// 7a Trybut żądanie reject — kwota powyżej limitu przy danym Respekcie (audyt #21)
r = evaluateProposal(prop('trybut_zadanie', 0, 1, { goldPerTurn: 150 }), ctx({
  proposerRespekt: 80,
  responderRespekt: 40,
}));
ok(!r.accepted, 'trybut żądanie reject kwota powyżej limitu (Respekt 80)');

// 7b Trybut żądanie reject — duplikat, wasalizacja już aktywna dla tej pary (audyt #21)
r = evaluateProposal(prop('trybut_zadanie', 0, 1, { goldPerTurn: 15 }), ctx({
  proposerRespekt: 80,
  responderRespekt: 40,
  activeDeals: [{ id: 'wasalizacja-0-1-t5', rodzaj: 'wasalizacja', strony: [0, 1], wygasaTura: null }],
}));
ok(!r.accepted, 'trybut żądanie reject duplikat wasalizacja aktywna');

// 8 Trybut oferta near war
r = evaluateProposal(prop('trybut_oferta', 0, 1, { goldOnce: 50 }), ctx({
  relation: rel(25, 30),
  militaryRatio: 1.5,
}));
ok(r.accepted && r.oneShotTrade, 'trybut oferta jednorazowy');

// 9 Handel fair (strict PN W4-A) @ normal — givePn skalowany do fair @ Rel 45
r = evaluateProposal(prop('handel', 0, 1, { givePn: 250, receivePn: 100 }), ctx({
  relation: rel(25, 20),
}));
ok(r.accepted && r.oneShotTrade, 'handel fair strict PN rel 45');

// 9a Handel accept Rel 39 @ normal (dawniej odrzucone przy progu 40)
r = evaluateProposal(prop('handel', 0, 1, { givePn: 300, receivePn: 100 }), ctx({
  relation: rel(20, 19),
}));
ok(r.accepted, 'handel accept relacja 39 normal (progHandelRelacja=0)');

// 9b Handel accept Rel 40 @ normal
r = evaluateProposal(prop('handel', 0, 1, { givePn: 250, receivePn: 100 }), ctx({
  relation: rel(25, 15),
}));
ok(r.accepted, 'handel accept relacja 40 normal');

// 9c NAP easy — accept rel 40, reject rel 39 (bez progu Zauf)
r = evaluateProposal(prop('nap', 0, 1, { turns: 15 }), ctx({
  relation: rel(30, 10),
  difficulty: 'easy',
}));
ok(r.accepted, 'NAP accept rel 40 zauf 5 easy');
r = evaluateProposal(prop('nap'), ctx({ relation: rel(20, 19), difficulty: 'easy' }));
ok(!r.accepted, 'NAP reject relacja 39 easy');

// 9d Handel easy — ten sam próg Relacji co normal (progHandelRelacja nie skaluje się z trudnością)
r = evaluateProposal(prop('handel', 0, 1, { givePn: 300, receivePn: 100 }), ctx({
  relation: rel(20, 19),
  difficulty: 'easy',
}));
ok(r.accepted, 'handel accept relacja 39 easy (progHandelRelacja=0)');

// 10 Handel unfair (strict PN W4-A)
r = evaluateProposal(prop('handel', 0, 1, { givePn: 50, receivePn: 100 }), ctx({ relation: rel(25, 20) }));
ok(!r.accepted, 'handel reject unfair PN');

// 10b Handel z dostępem do złoża — wycofany (SUROW-TERYT)
r = evaluateProposal(prop('handel', 0, 1, {
  giveItems: [{ typ: 'zloze', id: 'zelazo', hexKey: '10,20' }],
  receiveItems: [{ typ: 'zloze', id: 'miedz', hexKey: '5,8' }],
  turns: 7,
}), ctx({ relation: rel(60, 50), turn: 10 }));
ok(!r.accepted && r.reason.includes('SUROW-TERYT'), 'handel zloze odrzucony po wycofaniu dostepu');
ok(clampDealTurns(25) === 20 && clampDealTurns(0) === 1, 'clampDealTurns 1-20');
ok(proposalHasResourceAccess({ giveItems: [{ typ: 'zloze', id: 'zelazo' }] }), 'proposalHasResourceAccess zloze');

// 10c resolvePokojTrustTier — sojusz > NAP > pokoj
let tierDeals = [{ id: 'nap1', rodzaj: 'pakt_nieagresji', strony: [0, 1], wygasaTura: 30 }];
ok(resolvePokojTrustTier(tierDeals, 0, 1, { contactEstablished: true, atWar: false }) === 'nap', 'tier NAP');
tierDeals = [{ id: 's1', rodzaj: 'sojusz_pelny', strony: [0, 1], wygasaTura: null }];
ok(resolvePokojTrustTier(tierDeals, 0, 1, { contactEstablished: true, atWar: false }) === 'sojusz', 'tier sojusz');
ok(resolvePokojTrustTier([], 0, 1, { contactEstablished: true, atWar: false }) === 'pokoj', 'tier pokoj kontakt');
ok(resolvePokojTrustTier([], 0, 1, { contactEstablished: false, atWar: false }) === undefined, 'brak tier bez kontaktu');

// 11 Namów wojna
r = evaluateProposal(prop('namow_wojne', 0, 1, { targetOwnerId: 2, bribeGold: 60 }), ctx({
  relation: rel(55, 50),
  epoka: 1,
}));
ok(r.accepted, 'namów wojna + łapówka');

// 12 Tech sell — Rel >= 40 AND Zaufanie >= 70
r = evaluateProposal(prop('tech', 0, 1, { techId: 'kolba', techPrice: 80 }), ctx({
  relation: rel(75, 50),
  techMinPrice: 50,
}));
ok(r.accepted, 'tech sprzedaż rel+zauf OK');

// 12a Tech reject — Rel OK, Zaufanie za niskie
r = evaluateProposal(prop('tech', 0, 1, { techId: 'kolba', techPrice: 80 }), ctx({
  relation: rel(25, 20),
  techMinPrice: 50,
}));
ok(!r.accepted && r.reason.includes('Zaufanie'), 'tech reject zauf 25 rel 45');

// 13 Granice wojskowe — Rel >= 100 AND Zaufanie >= 45
r = evaluateProposal(prop('granice', 0, 1, { borderMilitary: true }), ctx({
  relation: rel(50, 60),
  proposerRespekt: 60,
}));
ok(r.accepted && r.deal?.rodzaj === 'prawo_wojskowe_przemarszu', 'granice wojskowe');

// 13a Granice reject — Rel OK, Zaufanie za niskie
r = evaluateProposal(prop('granice', 0, 1, { borderMilitary: false }), ctx({
  relation: rel(40, 65),
}));
ok(!r.accepted && r.reason.includes('Zaufanie'), 'granice reject zauf 40 rel 105');

// 13b Granice reject — Zauf OK, Rel za niska
r = evaluateProposal(prop('granice', 0, 1, { borderMilitary: false }), ctx({
  relation: rel(50, 40),
}));
ok(!r.accepted && r.reason.includes('Relacja'), 'granice reject rel 90 zauf 50');

// 14 applyAcceptedProposal + treatiesBrokenByWar
let deals = applyAcceptedProposal([], r);
deals = addTreaty(deals, {
  id: 'nap-x', rodzaj: 'pakt_nieagresji', strony: [0, 1], wygasaTura: 20,
});
const broken = treatiesBrokenByWar(deals, 0, 1);
ok(broken.length >= 1, 'wojna zerwie traktaty pary');

// 15 AI pending sojusz
const pending = aiCommandToPendingProposal(
  { type: 'zaproponuj_sojusz', targetId: 'p1', powod: 'test' },
  2, 0, 10,
);
ok(pending?.actionId === 'sojusz_pelny' && pending.fromOwnerId === 2, 'AI pending sojusz');

// 16 AI handel — kwota ze skarbca (cap max 20)
ok(capAiGoldOffer(5, AI_TRADE_GOLD_MAX) === 5, 'capAiGoldOffer 5¤ → 5');
ok(capAiGoldOffer(0, AI_TRADE_GOLD_MAX) === 0, 'capAiGoldOffer 0¤ → brak oferty');
ok(capAiGoldOffer(100, AI_TRADE_GOLD_MAX) === 20, 'capAiGoldOffer 100¤ → max 20');

const enriched5 = enrichAiCommandWithTreasury(
  { type: 'zaproponuj_handel', targetId: 'p0', powod: 'test' },
  5,
);
ok(enriched5?.goldOnce === 5, 'enrich handel 5¤ skarbca');
ok(
  enrichAiCommandWithTreasury({ type: 'zaproponuj_handel', targetId: 'p0', powod: 'x' }, 0) === null,
  'enrich handel 0¤ → null',
);
ok(
  formatAiDiplomacyPlayerMessage({ type: 'zaproponuj_handel', targetId: 'p0', powod: 'x', goldOnce: 5 })
    .includes('5 ¤'),
  'UI tekst handel 5¤',
);

const pendingHandel = aiCommandToPendingProposal(
  { type: 'zaproponuj_handel', targetId: 'p0', powod: 'test', goldOnce: 5 },
  3, 0, 12,
);
ok(
  pendingHandel?.actionId === 'handel'
    && pendingHandel.payload.goldOnce === 5,
  'AI pending handel goldOnce 5',
);
const acceptHandel = resolvePlayerAcceptsAiPending(pendingHandel, 12);
ok(
  acceptHandel.accepted && acceptHandel.oneShotTrade && !acceptHandel.deal,
  'gracz akceptuje AI handel → oneShotTrade',
);

ok(
  aiCommandToPendingProposal(
    { type: 'zaproponuj_handel', targetId: 'p0', powod: 'test', goldOnce: 0 },
    3, 0, 12,
  ) === null,
  'AI pending handel 0¤ → null',
);

// 17 Dar złota — pokój OK, wojna zablokowana; ugoda pokojowa ze złotem w wojnie OK
r = evaluateProposal(prop('handel', 0, 1, {
  isGift: true,
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 50 }],
  givePn: 50,
}), ctx({ relation: rel(60, 50), stanWojny: false }));
ok(r.accepted && r.oneShotTrade, 'dar złota w pokoju accepted');

r = evaluateProposal(prop('handel', 0, 1, {
  isGift: true,
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 50 }],
  givePn: 50,
}), ctx({ stanWojny: true }));
ok(!r.accepted && r.reason.includes('wojna'), 'dar złota w wojnie blocked');

r = evaluateProposal(prop('pokoj', 0, 1, { goldOnce: 50 }), ctx({ stanWojny: true }));
ok(!r.reason.includes('pieniądze tylko w ugodzie'), 'pokój ze złotem w wojnie — brak blokady waluty');

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
