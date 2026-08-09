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
// diplomacyTradeBasket.ts (importowany dla actionUsesTradeBasket/TRADE_BASKET_ACTION_IDS,
// BUG-TRAKTAT-KOSZYK-REGRESJA=A) ciągnie przez diploUiSkin.ts -> leaderPortraits.ts ORAZ
// bezpośrednio przez ./icons/brandAssets.ts -- oba robią Vite-owy `import.meta.glob(...)`,
// czego esbuild w trybie node/cjs nie obsługuje (wzorzec stubowania jak w
// tools/army-merge-dismiss-bounce-test.cjs — tam stubowany jest icons/brandAssets).
// Treść portretów liderów i ikon jest tu bez znaczenia (test nie asercjonuje wyglądu,
// tylko logikę koszyka), więc podmieniamy oba moduły na lekkie stuby.
// Nazwy plików WŁASNE dla tego testu (nie te z tools/.stubs/leaderPortraits-stub.ts i
// brandAssets-stub.ts używane przez army-merge-dismiss-bounce-test.cjs / danina-podatek-
// tooltip-ui-test.cjs) — inny zestaw eksportów jest tam potrzebny niż tutaj, więc osobne
// pliki, żeby nie nadpisywać ani nie łamać cudzego testu współdzielonym stubem.
const STUB_DIR = path.resolve(__dirname, '.stubs');
const LEADER_PORTRAITS_STUB = path.resolve(STUB_DIR, 'leaderPortraits-diplo-treaty-stub.ts');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'brandAssets-diplo-treaty-stub.ts');
fs.mkdirSync(STUB_DIR, { recursive: true });
fs.writeFileSync(
  LEADER_PORTRAITS_STUB,
  [
    "export function leaderPortraitUrl() { return null; }",
    "export function leaderName() { return null; }",
    "export function leaderNameFromPool() { return null; }",
    "export function civDisplayNameFromKey() { return null; }",
    "export function civCardDisplayName(label) { return label; }",
    "export function civIconIdFromCivLabel() { return null; }",
  ].join('\n'),
  'utf8',
);
fs.writeFileSync(
  BRAND_ASSETS_STUB,
  [
    "export function brandIconSvg() { return ''; }",
    "export function improvementIconSvg() { return ''; }",
    "export function mapResourceIconSvg() { return ''; }",
    "export function terrainIconSvg() { return ''; }",
    "export function buildingIconSvg() { return ''; }",
    "export function unitIconSvg() { return ''; }",
    "export function civIconSvg() { return ''; }",
    "export function epochIconSvg() { return ''; }",
    "export function settingIconSvg() { return ''; }",
    "export function brandMenuComponentsCss() { return ''; }",
    "export function menuIconSvg() { return ''; }",
    "export function brandMenuEmblemSvg() { return ''; }",
    "export function newGameIntroEmblemSvg() { return ''; }",
    "export function brandMotionCss() { return ''; }",
    "export function brandMenuBackgroundCss() { return ''; }",
    "export function svgThumbHtml() { return ''; }",
  ].join('\n'),
  'utf8',
);
fs.writeFileSync(entryFile, `
export {
  evaluateProposal, applyAcceptedProposal, aiCommandToPendingProposal,
  makeDealId, proposalHasResourceAccess, clampDealTurns, resolveNapDealExpiry,
  resolvePlayerAcceptsAiPending, AI_TRADE_GOLD_ONCE, AI_TRADE_GOLD_MAX,
  enrichAiCommandWithTreasury, formatAiDiplomacyPlayerMessage,
  negotiationStillValid, TRIBUTE_PROPOSAL_ACTIONS,
  findWasalDeal, wasalAgeTurns, graczWchloniecieKosztZloto,
  evaluatePendingFromAI,
} from '../src/game/diplomacy-proposals.ts';
export { capAiGoldOffer, AI_TRADE_GOLD_MAX as ECO_GOLD_MAX } from '../src/game/diplomacy-economy.ts';
export { addTreaty, hasTreaty, treatiesBrokenByWar, resolvePokojTrustTier } from '../src/game/diplomacy-treaties.ts';
export { getEffectiveDiplomacyParams } from '../src/game/diplomacy.ts';
export { diplomacyFairGivePn } from '../src/game/diplomacy-value-catalog.ts';
export {
  actionUsesTradeBasket, getTradeBasketMode, isTreatyOnlyFormAction, TRADE_BASKET_ACTION_IDS,
} from '../src/ui/diplomacyTradeBasket.ts';
`);

const stubViteAssetsPlugin = {
  name: 'stub-vite-assets',
  setup(build) {
    build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: LEADER_PORTRAITS_STUB }));
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
  },
};

async function main() {
await esbuild.build({
  entryPoints: [entryFile],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
  loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
  plugins: [stubViteAssetsPlugin],
});

const {
  evaluateProposal, applyAcceptedProposal, aiCommandToPendingProposal,
  addTreaty, hasTreaty, treatiesBrokenByWar, resolvePokojTrustTier,
  getEffectiveDiplomacyParams, proposalHasResourceAccess, clampDealTurns,
  resolveNapDealExpiry, resolvePlayerAcceptsAiPending, AI_TRADE_GOLD_ONCE, AI_TRADE_GOLD_MAX,
  enrichAiCommandWithTreasury, formatAiDiplomacyPlayerMessage, capAiGoldOffer,
  negotiationStillValid, TRIBUTE_PROPOSAL_ACTIONS,
  findWasalDeal, wasalAgeTurns, graczWchloniecieKosztZloto,
  evaluatePendingFromAI, diplomacyFairGivePn,
  actionUsesTradeBasket, getTradeBasketMode, isTreatyOnlyFormAction, TRADE_BASKET_ACTION_IDS,
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

// 1 NAP accept — Relacja >= 50 @ normal (bez progu Zaufania, Maciej 2026-07-21)
// @ rel 100 bilans PW = 0 (FALA 213: przy rel 50 wymagana dopłata)
let r = evaluateProposal(prop('nap', 0, 1, { turns: 15 }), ctx({ relation: rel(50, 50) }));
ok(r.accepted && r.deal?.rodzaj === 'pakt_nieagresji', 'NAP accept rel 100 @ normal');

// 1a NAP accept — Rel OK, niskie Zaufanie (brak progu Zauf)
r = evaluateProposal(prop('nap'), ctx({ relation: rel(50, 50) }));
ok(r.accepted, 'NAP accept rel 100 (bez progu Zauf)');

// 2 NAP reject low relacja @ normal
r = evaluateProposal(prop('nap'), ctx({ relation: rel(25, 24) }));
ok(!r.accepted, 'NAP reject relacja 49 normal');

// 3 NAP reject border expansion
r = evaluateProposal(prop('nap'), ctx({ ekspansjaPrzyGranicy: true }));
ok(!r.accepted, 'NAP reject ekspansja');

// 3b WIAR-NAP-IMP: NAP bezterminowy (turns=0) vs terminowy (10–20)
r = evaluateProposal(prop('nap', 0, 1, { turns: 0 }), ctx({ relation: rel(50, 50), turn: 10 }));
ok(r.accepted && r.deal?.wygasaTura === null, 'NAP bezterminowy → wygasaTura null');
const napExp = resolveNapDealExpiry(10, { turns: 0 });
ok(napExp.wygasaTura === null, 'resolveNapDealExpiry turns=0 → null');
const napTerm = resolveNapDealExpiry(10, { turns: 15 });
ok(napTerm.wygasaTura === 25, 'resolveNapDealExpiry turns=15 → turn+15');
r = evaluateProposal(prop('nap', 0, 1, { turns: 8 }), ctx({ relation: rel(50, 50), turn: 5 }));
ok(r.accepted && r.deal?.wygasaTura === 15, 'NAP turns=8 clamped to 10 → wygasa t.15');

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

// 8a Maciej 2026-08-02 — trybut zablokowany u miasta-państwa (Tarent-path)
r = evaluateProposal(prop('trybut_oferta', 0, 7, { goldOnce: 50 }), ctx({
  responderIsCityState: true,
  militaryRatio: 1.5,
}));
ok(!r.accepted && r.reason.includes('miasta-państwa'), 'trybut oferta reject CS partner');
r = evaluateProposal(prop('trybut_zadanie', 0, 7, { goldPerTurn: 15 }), ctx({
  proposerIsCityState: true,
  proposerRespekt: 80,
}));
ok(!r.accepted, 'trybut żądanie reject CS proposer');
ok(TRIBUTE_PROPOSAL_ACTIONS.has('trybut_oferta'), 'TRIBUTE_PROPOSAL_ACTIONS exported');
{
  const entry = {
    id: 'n1', actionId: 'trybut_oferta', proposerOwnerId: 7, responderOwnerId: 0,
    payload: {}, createdTurn: 1, expiresTurn: 20, round: 1, authorOwnerId: 7,
    awaitingOwnerId: 0, lastActionTurn: 1, source: 'ai',
  };
  const v = negotiationStillValid(entry, {
    turn: 5, isAtWar: false, proposerEliminated: false, responderEliminated: false,
    proposerIsCityState: true,
  });
  ok(!v.valid && v.reason.includes('miasta-państwa'), 'negotiationStillValid gasi trybut CS');
}

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

// 9c NAP easy — accept rel 100, reject rel 39 (bez progu Zauf; FALA 213: bilans PW @ rel 40)
r = evaluateProposal(prop('nap', 0, 1, { turns: 15 }), ctx({
  relation: rel(50, 50),
  difficulty: 'easy',
}));
ok(r.accepted, 'NAP accept rel 100 easy');
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

// 12b Tech-za-tech (R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1=A, runda 2) — accepted, cena/próg
// gotówkowy NIE dotyczy tego trybu (techPrice pominięty w payloadzie celowo).
r = evaluateProposal(prop('tech', 0, 1, { techId: 'kolba', techPaymentMode: 'tech', techOfferId: 'proch' }), ctx({
  relation: rel(75, 50),
  techMinPrice: 50,
}));
ok(r.accepted, 'tech-za-tech: akceptowana bez ceny gotówkowej (próg gotówkowy nie dotyczy)');

// 12c Tech-za-tech reject — brak techOfferId.
r = evaluateProposal(prop('tech', 0, 1, { techId: 'kolba', techPaymentMode: 'tech' }), ctx({
  relation: rel(75, 50),
  techMinPrice: 50,
}));
ok(!r.accepted && r.reason.includes('oferowanej technologii'), 'tech-za-tech reject: brak techOfferId');

// 12d Tech-za-tech reject — techOfferId === techId (nie można wymienić na samą siebie).
r = evaluateProposal(prop('tech', 0, 1, { techId: 'kolba', techPaymentMode: 'tech', techOfferId: 'kolba' }), ctx({
  relation: rel(75, 50),
  techMinPrice: 50,
}));
ok(!r.accepted && r.reason.includes('samą siebie'), 'tech-za-tech reject: techOfferId === techId');

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
ok(!r.accepted && (r.reason.includes('Relacja') || r.reason.includes('Brakuje')), 'granice reject rel 90 zauf 50');

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
    && pendingHandel.payload.goldOnce === 5
    && pendingHandel.payload.isGift === true,
  'AI pending handel goldOnce 5 + isGift',
);
const acceptHandel = resolvePlayerAcceptsAiPending(pendingHandel, 12);
ok(
  acceptHandel.accepted && acceptHandel.oneShotTrade && !acceptHandel.deal,
  'gracz akceptuje AI handel → oneShotTrade',
);

// BUG-DYP-GIFT-WAR: dar/handel złota w wojnie — evaluateProposal i resolvePlayerAcceptsAiPending
{
  const giftPayload = { goldOnce: 50, giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 50 }], isGift: true };
  const giftProp = prop('handel', 3, 0, giftPayload);
  const warReject = evaluateProposal(giftProp, ctx({ stanWojny: true }));
  ok(!warReject.accepted && /wojna/i.test(warReject.reason ?? ''), 'evaluateProposal handel gift + wojna: rejected');

  const atWarReject = resolvePlayerAcceptsAiPending(pendingHandel, 12, 'normal', { atWar: true });
  ok(!atWarReject.accepted && /wojnie pieniądze/i.test(atWarReject.reason ?? ''), 'resolvePlayerAcceptsAiPending handel gift + atWar: rejected');

  const peaceAccept = resolvePlayerAcceptsAiPending(pendingHandel, 12, 'normal', { atWar: false });
  ok(peaceAccept.accepted && peaceAccept.oneShotTrade, 'resolvePlayerAcceptsAiPending handel gift + atWar false: accepted (regresja)');
}

ok(
  aiCommandToPendingProposal(
    { type: 'zaproponuj_handel', targetId: 'p0', powod: 'test', goldOnce: 0 },
    3, 0, 12,
  ) === null,
  'AI pending handel 0¤ → null',
);

// 17 willingnessTrade vs uczciwa oferta (Maciej 2026-08-02, BUG-DYPLO-TRADE-WILLINGNESS)
const zulusResponder = { typCywilizacji: 'zulusi' };
const rzymProposer = { typCywilizacji: 'rzymianie' };
const lowTradeCtx = {
  relation: rel(25, 25),
  responderPlayer: zulusResponder,
  proposerPlayer: rzymProposer,
};
r = evaluateProposal(prop('handel', 0, 1, { givePn: 250, receivePn: 100 }), lowTradeCtx);
ok(
  r.accepted && r.oneShotTrade,
  'handel gracz→AI: oferta przebija PODNIESIONY (niska willingnessTrade Zulusów) próg PW @ Relacji — R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1=B+C runda 3 (etykieta poprawiona pkt 4: nie "mimo", tylko "mimo podniesionego progu")',
);
r = evaluateProposal(prop('handel', 0, 1, { givePn: 50, receivePn: 100 }), lowTradeCtx);
ok(
  !r.accepted && /niechęć/i.test(r.reason ?? ''),
  'handel gracz→AI unfair + niska willingness: mnożnik chęci respondenta-AI podnosi próg PW (komunikat "niechęć")',
);

// 17e R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1=B+C runda 3 (naprawa regresji rundy 2):
// kierunek AI→gracz — respondentem jest GRACZ, więc "chęć AI" nikt nie liczy w tym
// kierunku (AI jest proponentem). Mnożnik MUSI być neutralny (1) — próg = fair @ Relacji
// bez wpływu (fałszywego) "nastawienia" gracza wstawianego przez buildProposalEvalContext.
// Pokrycie: (a) evaluatePendingFromAI (droga UI realna), (b) evaluateProposal bezpośrednio.
const aiToPlayerCtx = {
  relation: rel(25, 25),
  responderPlayer: { typCywilizacji: 'rzymianie' },
  proposerPlayer: { typCywilizacji: 'zulusi' },
};
const aiToPlayerPending = {
  id: 'ai-h1', fromOwnerId: 1, toOwnerId: 0, actionId: 'handel',
  payload: { goldOnce: 200, receivePn: 100 }, createdTurn: 1, expiresTurn: null, source: 'ai',
};
r = evaluatePendingFromAI(aiToPlayerPending, aiToPlayerCtx);
ok(
  r.accepted && r.oneShotTrade,
  'AI→gracz handel @ progu neutralnym (200 PW oferty ≥ 200 PW wymagane @ Relacji 50): akceptacja bez wpływu (sztucznej) checi gracza-jako-respondenta',
);
ok(!/niechęć/i.test(r.reason ?? ''), 'AI→gracz handel accept: komunikat bez "niechęć" (multiplier neutralny=1)');

r = evaluateProposal(prop('handel', 1, 0, { goldOnce: 199, receivePn: 100 }), aiToPlayerCtx);
ok(!r.accepted, 'AI→gracz handel poniżej progu neutralnego (oferta 199 PW < wymagane 200 PW @ Relacji 50): odrzucenie');
ok(
  !/niechęć/i.test(r.reason ?? ''),
  'AI→gracz handel reject: komunikat NIE przypisuje przyczyny nieistniejącej "niechęci AI" (AI jest proponentem, nie respondentem, w tym kierunku)',
);
ok(
  (r.reason ?? '').includes('200') && (r.reason ?? '').includes('199'),
  'AI→gracz handel reject: komunikat z realnymi liczbami PW (wymagane ≥ 200 PW, oferta 199 PW)',
);

// R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1=B+C runda 4 (naprawa FAIL rundy 3): PODŁOGA
// PARYTETU w handelFairnessGate. Kontrprzykład rundy 3 — proposer=gracz(0), responder=AI(1),
// rel(100,100) → relTotal=200 pkt Relacji (relationTotal = min(200, zaufanie+respekt)) →
// relForFair clampowane do 100 pkt (górna granica clampa) → diplomacyFairGivePn(receivePn=110, 100)=110 PW
// (parytet: fair=receivePn dokładnie na granicy clampa).
// Bez podłogi wysoka chęć partnera (multiplier<1) mogła zejść PONIŻEJ receivePn=110 PW,
// pozwalając graczowi "skimować" — oferta 105 PW za 110 PW MUSI być odrzucona.
const highRelCtx = {
  relation: rel(100, 100),
  responderPlayer: { typCywilizacji: 'fenicjanie' }, // wysoka chęć handlu — test podłogi
  proposerPlayer: rzymProposer,
};
r = evaluateProposal(prop('handel', 0, 1, {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 105 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 110 }],
}), highRelCtx);
ok(
  !r.accepted,
  'PODŁOGA PARYTETU: handel gracz→AI @ rel(100,100) (relTotal=200→clamp 100 pkt, parytet fair=receivePn=110 PW), oferta 105 PW < receivePn 110 PW: odrzucenie mimo wysokiej chęci partnera (Fenicjanie)',
);
ok(
  (r.reason ?? '').includes('110') && (r.reason ?? '').includes('105'),
  'PODŁOGA PARYTETU reject: komunikat z realnymi liczbami PW (wymagane ≥ 110 PW, oferujesz 105 PW)',
);

// Kontrola: relTotal=60 pkt Relacji (rel(30,30)) — fair-neutralny próg dla receivePn=100 PW
// jest > receivePn (relTotal<100 pkt, poniżej parytetu) — sprawdź realną wartość i potwierdź,
// że wysoka chęć partnera NADAL może obniżyć próg PONIŻEJ fair-neutralnego (ulga realnie
// działa tam, gdzie fair>receivePn), o ile nie schodzi poniżej receivePn=100 PW (podłoga).
const midRelCtx = {
  relation: rel(30, 30),
  responderPlayer: { typCywilizacji: 'fenicjanie' },
  proposerPlayer: rzymProposer,
};
const fairAt60 = diplomacyFairGivePn(100, 60);
ok(
  fairAt60 > 100,
  `kontrola podłogi: diplomacyFairGivePn(receivePn=100 PW, relTotal=60 pkt Relacji)=${fairAt60} PW > receivePn=100 PW (poniżej parytetu, ulga ma pole działania)`,
);
// Oferta DOKŁADNIE @ fair-neutralny (bez ulgi) musi zawsze przejść, niezależnie od
// wielkości ulgi (multiplier <= 1 dla wysokiej chęci) — punkt odniesienia.
r = evaluateProposal(prop('handel', 0, 1, {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: fairAt60 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }],
}), midRelCtx);
ok(
  r.accepted === true,
  `punkt odniesienia: handel gracz→AI @ rel 60 pkt, oferta ${fairAt60} PW == fair-neutralny (bez ulgi): akceptacja`,
);
// willingnessTrade Fenicjan @ rel(30,30) = 0,66 (zweryfikowane: archTrade 0,90 × 0,60 +
// relFactor 0,12 = 0,66) → multiplier = 1 − 0,15 × ((0,66−0,5)/0,5) = 1 − 0,15×0,32 = 0,952
// → wymagany próg PW = max(100 PW podłoga, ceil(167 PW fair × 0,952)) = max(100, 159) = 159 PW.
// Oferta 160 PW: PONIŻEJ fair-neutralnego (167 PW), ale POWYŻEJ wymaganego progu z ulgą
// (159 PW) — musi być zaakceptowana: to jest realny dowód działania ulgi poniżej parytetu.
r = evaluateProposal(prop('handel', 0, 1, {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 160 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }],
}), midRelCtx);
ok(
  r.accepted === true,
  'kontrola ulgi (realnie działa poniżej parytetu): handel gracz→AI @ rel 60 pkt, oferta 160 PW (poniżej fair-neutralnego 167 PW, powyżej wymaganego z ulgą 159 PW) @ wysoka chęć partnera (Fenicjanie): akceptacja — podłoga nie blokuje ulgi tam, gdzie fair>receivePn',
);
// Oferta 158 PW: poniżej wymaganego progu z ulgą (159 PW) — musi być odrzucona; dowodzi,
// że ulga jest OGRANICZONA (nie zbija progu do samej podłogi receivePn=100 PW).
r = evaluateProposal(prop('handel', 0, 1, {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 158 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }],
}), midRelCtx);
ok(
  !r.accepted,
  'kontrola ulgi (ograniczona, nie sięga podłogi): handel gracz→AI @ rel 60 pkt, oferta 158 PW (poniżej wymaganego z ulgą 159 PW) @ wysoka chęć partnera (Fenicjanie): odrzucenie',
);

// ---------------------------------------------------------------------------
// R-DYPLOMACJA-HANDEL-BRAMKA-PRIORYTET-Q1, notatka Evaluatora rundy 4 (N3):
// handelWillingnessMultiplier działa też dla par AI(1)→AI(2) (proposerOwnerId=1,
// responderOwnerId=2, żadne z dwóch nie jest graczem=0) — kierunek zweryfikowany
// sweepem 1728 przypadków jako bezpieczny, ale dotąd niepokryty żadnym testem.
// Poniższe 3 bloki domykają lukę pokrycia (nie zmieniają kodu produkcyjnego).
// ---------------------------------------------------------------------------

// (1) NISKA chęć respondenta-AI(2) (Zulusi, archTrade=0,20) @ rel(50,50): relTotal=100
// pkt → relForFair=min(100,100)=100 pkt → diplomacyFairGivePn(receivePn,100)=receivePn
// (parytet dokładny — BEZ modyfikatora oferta give=receive przeszłaby zawsze). Z modyfikatorem:
// score=100, relFactor=100/200*0,4=0,20, tradeW=0,20*0,60+0,20=0,32 < mid=0,50 (progHandelWillingnessMin)
// → kara: t=(0,50−0,32)/0,50=0,36 → multiplier=1+0,20×0,36=1,072 → wymagany próg=
// max(100, ceil(100×1,072))=max(100,108)=108 PW > 100 PW oferty → ODRZUCENIE.
// Dowód, że zaostrzenie (penalty) mnożnika chęci realnie działa w kierunku AI(1)→AI(2),
// nie tylko gracz(0)→AI(1) (jedyny kierunek pokryty przed tą naprawą).
const aiToAiLowWillCtx = {
  relation: rel(50, 50),
  responderPlayer: { typCywilizacji: 'zulusi' }, // AI(2), respondent, niska chęć handlu
  proposerPlayer: { typCywilizacji: 'rzymianie' }, // AI(1), proponent
};
r = evaluateProposal(prop('handel', 1, 2, {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }],
}), aiToAiLowWillCtx);
ok(
  !r.accepted,
  'AI(1)→AI(2) handel @ parytecie dokładnym (100 PW = 100 PW, rel(50,50)→relForFair=100 pkt, fair=receivePn bez modyfikatora): ODRZUCENIE z niską chęcią respondenta-AI(2) (Zulusi) — dowód że zaostrzenie mnożnika chęci działa też dla pary AI↔AI, nie tylko gracz→AI',
);
ok(
  /niechęć/i.test(r.reason ?? ''),
  'AI(1)→AI(2) handel odrzucone @ niskiej chęci: komunikat zawiera "Niechęć" (przyczynowo trafny, ten sam mechanizm co gracz→AI)',
);
ok(
  (r.reason ?? '').includes('108') && (r.reason ?? '').includes('100'),
  'AI(1)→AI(2) handel odrzucone: komunikat z realnymi liczbami PW (wymagane ≥ 108 PW, oferujesz 100 PW)',
);

// (2) WYSOKA chęć respondenta-AI(2) (Fenicjanie, archTrade=0,90) @ rel(30,30) — MIRROR
// dokładny testu ulgi gracz→AI (midRelCtx wyżej, ta sama relacja/archetyp/kwoty). Skoro
// handelWillingnessMultiplier zależy WYŁĄCZNIE od stance (funkcja relacji + archetypów
// obu stron) i responderIsPlayer (responderOwnerId===0), a nie od konkretnych wartości
// proposerOwnerId/responderOwnerId poza tym jednym porównaniem do 0 — te same 3 progi
// (167/160/158 PW, zweryfikowane wyżej dla gracz(0)→AI(1)) MUSZĄ dać identyczny wynik
// dla AI(1)→AI(2) (responderOwnerId=2, wciąż ≠ 0 — modyfikator wciąż aktywny, tak jak
// dla AI(1) w kierunku gracz→AI). Dowód, że ulga też działa identycznie w obu kierunkach.
const aiToAiHighWillCtx = {
  relation: rel(30, 30),
  responderPlayer: { typCywilizacji: 'fenicjanie' }, // AI(2), respondent, wysoka chęć handlu
  proposerPlayer: { typCywilizacji: 'rzymianie' }, // AI(1), proponent
};
r = evaluateProposal(prop('handel', 1, 2, {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: fairAt60 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }],
}), aiToAiHighWillCtx);
ok(
  r.accepted === true,
  `AI(1)→AI(2) handel @ rel 60 pkt, oferta ${fairAt60} PW == fair-neutralny (bez ulgi): akceptacja (identyczny próg co gracz→AI)`,
);
r = evaluateProposal(prop('handel', 1, 2, {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 160 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }],
}), aiToAiHighWillCtx);
ok(
  r.accepted === true,
  'AI(1)→AI(2) handel @ rel 60 pkt, oferta 160 PW (poniżej fair-neutralnego 167 PW, powyżej wymaganego z ulgą 159 PW) @ wysoka chęć respondenta-AI(2) (Fenicjanie): akceptacja — ulga działa identycznie jak dla gracz→AI',
);
r = evaluateProposal(prop('handel', 1, 2, {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 158 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 100 }],
}), aiToAiHighWillCtx);
ok(
  !r.accepted,
  'AI(1)→AI(2) handel @ rel 60 pkt, oferta 158 PW (poniżej wymaganego z ulgą 159 PW) @ wysoka chęć respondenta-AI(2) (Fenicjanie): odrzucenie — ulga ograniczona identycznie jak dla gracz→AI',
);

// (3) KONTROLA STRUKTURALNA (zbadanie hipotezy luki z KONTEKSTU zadania): czy brak
// proposerUnfairToPartnerGate dla proponenta-AI (ten gate sprawdza tylko proposerIsPlayer)
// otwiera realną lukę dla 'handel' w parze AI(1)→AI(2)? ODPOWIEDŹ: NIE — 'handel' jest
// CELOWO poza PROPOSER_PW_FAIRNESS_ACTIONS (usunięty w rundzie 3, patrz komentarz przy
// stałej), więc proposerUnfairToPartnerGate i tak NIGDY nie uruchamia się dla 'handel',
// niezależnie od tożsamości proponenta (gracz LUB AI) — to nie jest asymetria specyficzna
// dla AI↔AI, to strukturalna nieobecność dla WSZYSTKICH proponentów w tej akcji. Jedynym
// i pełnym strażnikiem uczciwości dla 'handel' jest handelFairnessGate z PODŁOGĄ PARYTETU
// (Math.max(receivePn, …)) — a ta podłoga, w przeciwieństwie do proposerUnfairToPartnerGate,
// NIE sprawdza proposerIsPlayer nigdzie w swoim kodzie (patrz handelFairnessGate — jedyna
// zależność od tożsamości to responderIsPlayer w handelWillingnessMultiplier, użyta TYLKO
// do neutralizacji modyfikatora gdy respondentem jest gracz). Poniższy test to MIRROR
// dokładny testu PODŁOGI PARYTETU z rundy 4 (highRelCtx wyżej) z proposerOwnerId=1,
// responderOwnerId=2 zamiast 0,1 — identyczne odrzucenie dowodzi, że AI(1) NIE MOŻE
// "skimować" kosztem AI(2) tak samo, jak gracz nie mógł kosztem AI (naprawa rundy 4
// jest proposer-identity-agnostyczna, nie tylko player-specific). Brak realnej luki —
// nie wymaga decyzji Macieja, zamyka hipotezę z KONTEKSTU zadania.
const aiToAiFloorCtx = {
  relation: rel(100, 100),
  responderPlayer: { typCywilizacji: 'fenicjanie' }, // AI(2), wysoka chęć — test podłogi
  proposerPlayer: { typCywilizacji: 'rzymianie' }, // AI(1)
};
r = evaluateProposal(prop('handel', 1, 2, {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 105 }],
  receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 110 }],
}), aiToAiFloorCtx);
ok(
  !r.accepted,
  'KONTROLA STRUKTURALNA — brak luki: AI(1)→AI(2) @ rel(100,100) (parytet fair=receivePn=110 PW), oferta 105 PW < 110 PW: odrzucenie mimo wysokiej chęci respondenta-AI(2) (Fenicjanie) — podłoga parytetu chroni AI(2) przed AI(1) identycznie jak chroniła AI przed graczem (proposerUnfairToPartnerGate nieobecny dla \'handel\' niezależnie od tożsamości proponenta — to nie luka, handelFairnessGate jest proposer-identity-agnostyczny)',
);
ok(
  (r.reason ?? '').includes('110') && (r.reason ?? '').includes('105'),
  'KONTROLA STRUKTURALNA reject: komunikat z realnymi liczbami PW (wymagane ≥ 110 PW, oferujesz 105 PW) — identyczny format co gracz→AI',
);

r = evaluateProposal(prop('umowa_szlakow', 0, 1, { givePn: 250, receivePn: 100, turns: 20 }), lowTradeCtx);
ok(r.accepted && r.deal?.rodzaj === 'umowa_szlakow', 'traktat handlowy fair PW: akceptacja mimo willingness');
r = evaluateProposal(prop('umowa_szlakow', 0, 1, { turns: 20 }), lowTradeCtx);
ok(!r.accepted && r.reason.includes('Brakuje'), 'traktat handlowy bez koszyka @ niska Rel: odrzucenie (ujemny bilans PW)');
r = evaluateProposal(prop('umowa_szlakow', 0, 1, { turns: 20 }), { ...lowTradeCtx, relation: rel(50, 50) });
ok(r.accepted && r.deal?.rodzaj === 'umowa_szlakow', 'traktat handlowy bez koszyka @ rel 100: bilans 0');
r = evaluateProposal(prop('umowa_szlakow', 0, 1, {
  turns: 20,
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 40 }],
}), lowTradeCtx);
ok(r.accepted && r.deal?.rodzaj === 'umowa_szlakow', 'traktat handlowy: dopłata gold pokrywa bilans @ niska Rel');
r = evaluateProposal(prop('umowa_handlowa', 0, 1, { turns: 20 }), { ...lowTradeCtx, relation: rel(50, 50) });
ok(r.accepted && r.deal?.rodzaj === 'umowa_szlakow', 'umowa_handlowa alias @ rel 100: accepted + deal szlaków (R-DYPLO-PRZYJMIJ-TRADE)');
r = evaluateProposal(prop('umowa_handlowa', 0, 1, { turns: 20 }), lowTradeCtx);
ok(!r.accepted && r.reason?.includes('nieuczciwa'), 'umowa_handlowa @ niska Rel bez koszyka: odrzucenie jak szlaki');

// 17f R-DYPLO-FAIRNESS-GATE-ZAKRES-Q2=A (BUG-PAKIET-BILANS-DODATNI-BLOKADA): treatyBaseFairnessGap
// dolicza PW z INNYCH pozycji na tym samym stole (packageSiblingGivePn/packageSiblingReceivePn w
// ProposalEvalContext — main.ts packageSiblingPn liczy je z negotiationTable i wątki tego samego
// kierunku proposerId→responderId). Baseline (linia 769-770 wyżej): umowa_szlakow bez koszyka @
// lowTradeCtx (rel 25/25 → relTotal 50 pkt) ma DOKŁADNIE 40 PW deficytu (playerRequired=40,
// partnerRequired=80, gap=40) — liczby poniżej pochodzą z TEGO baseline, nie z ilustracyjnych
// "80 baza / 54 bezpośrednio" z opisu zadania (ten opis nie ma źródłowego dokumentu w repo do
// zweryfikowania dokładnych liczb — patrz raport sesji).
r = evaluateProposal(
  prop('umowa_szlakow', 0, 1, { turns: 20 }),
  { ...lowTradeCtx, packageSiblingGivePn: 40 },
);
ok(
  r.accepted && r.deal?.rodzaj === 'umowa_szlakow',
  'Q2: traktat bez własnego koszyka + sąsiad na stole daje DOKŁADNIE 40 PW (== deficyt 40): pakiet akceptowany',
);
r = evaluateProposal(
  prop('umowa_szlakow', 0, 1, { turns: 20 }),
  { ...lowTradeCtx, packageSiblingGivePn: 54 },
);
ok(
  r.accepted && r.deal?.rodzaj === 'umowa_szlakow',
  'Q2: sąsiad 54 PW > deficyt 40 PW: pakiet akceptowany z nadwyżką (scenariusz zgłoszenia — pakiet total ≥ wymagane)',
);
r = evaluateProposal(
  prop('umowa_szlakow', 0, 1, { turns: 20 }),
  { ...lowTradeCtx, packageSiblingGivePn: 20 },
);
ok(
  !r.accepted && r.reason.includes('Brakuje 20 PW') && r.reason.includes('pakiet na stole'),
  'Q2: sąsiad 20 PW < deficyt 40 PW: nadal zablokowane, komunikat "Brakuje 20 PW ... pakiet na stole" (nie stara liczba 40 licząca sam traktat)',
);
r = evaluateProposal(
  prop('umowa_szlakow', 0, 1, { turns: 20 }),
  lowTradeCtx,
);
ok(
  !r.accepted && r.reason.includes('Brakuje 40 PW') && !r.reason.includes('pakiet na stole'),
  'Q2: BEZ sąsiada (ctx bez packageSiblingGivePn/receivePn) — zachowanie identyczne jak przed Q2 (Brakuje 40 PW, bez wzmianki o pakiecie): brak regresji dla wywołań spoza stołu',
);
r = evaluateProposal(
  prop('umowa_szlakow', 0, 1, { turns: 20 }),
  { ...lowTradeCtx, packageSiblingGivePn: 50, packageSiblingReceivePn: 15 },
);
ok(
  !r.accepted && r.reason.includes('Brakuje 5 PW'),
  'Q2: sąsiad z OBIE stronami koszyka (give 50, receive 15) — receive sąsiada TEŻ liczy się do gapu (80+15) - (40+50) = 5 PW, nie tylko give',
);
r = evaluateProposal(
  prop('umowa_handlowa', 0, 1, { turns: 20 }),
  { ...lowTradeCtx, packageSiblingGivePn: 40 },
);
ok(
  r.accepted && r.deal?.rodzaj === 'umowa_szlakow',
  'Q2: alias umowa_handlowa też package-aware (ten sam case w evaluateProposal)',
);

r = evaluateProposal(prop('pokoj', 0, 1, { givePn: 355, receivePn: 0 }), {
  ...lowTradeCtx,
  stanWojny: true,
  relation: rel(50, 50, 'wojna'),
});
ok(r.accepted, 'pokój z dopłatą bilansu PW @ wojna: bez bramki willingnessTrade (willingnessPeace)');

// 18 Dar złota — pokój OK, wojna zablokowana; ugoda pokojowa ze złotem w wojnie OK
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

// R-GRACZ-WCHLONIECIE
ok(graczWchloniecieKosztZloto(4) === 250, 'koszt wchłonięcia pop 4 → max(200,150+100)=250');
const wasalDeal = {
  id: 'wasal-0-5-t10', rodzaj: 'wasalizacja', strony: [0, 5],
  wygasaTura: null, zawartaTura: 10,
  ekonomia: { payerOwnerId: 5, receiverOwnerId: 0, pieniadzePerTura: 10 },
};
r = evaluateProposal(prop('wchloniecie', 0, 5, { goldOnce: 300 }), ctx({
  responderIsCityState: false, activeDeals: [wasalDeal], wasalAgeTurns: 10,
  proposerRespekt: 90, relation: rel(70, 70),
}));
ok(!r.accepted && r.reason.includes('miasta-państwa'), 'wchłonięcie reject not CS');

r = evaluateProposal(prop('wchloniecie', 0, 5, { goldOnce: 300 }), ctx({
  responderIsCityState: true, activeDeals: [], wasalAgeTurns: undefined,
  proposerRespekt: 90, relation: rel(70, 70),
}));
ok(!r.accepted && r.reason.includes('wasalizacji'), 'wchłonięcie reject no wasal');

r = evaluateProposal(prop('wchloniecie', 0, 5, { goldOnce: 300 }), ctx({
  responderIsCityState: true, activeDeals: [wasalDeal], wasalAgeTurns: 9, turn: 19,
  proposerRespekt: 90, relation: rel(70, 70),
}));
ok(!r.accepted && r.reason.includes('pozostało'), 'wchłonięcie reject wasal age 9');

r = evaluateProposal(prop('wchloniecie', 0, 5, { goldOnce: 250 }), ctx({
  responderIsCityState: true, activeDeals: [wasalDeal], wasalAgeTurns: 10,
  responderPopulation: 4, proposerRespekt: 90, relation: rel(70, 70),
}));
ok(r.accepted && !r.deal && !r.oneShotTrade, 'wchłonięcie accept age 10 respekt 90 CS goldOnce ok');

// ---------------------------------------------------------------------------
// 19 R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1=A — 5 akcji (nap, sojusz_defensywny,
// sojusz_pelny, wasal, pokoj) przy niskiej Relacji BEZ koszyka: dedykowany,
// przyczynowo trafny komunikat zamiast generycznego „Przewaga u Ciebie —
// oferta nieuczciwa dla partnera" (dawna proposerUnfairToPartnerGate maskowała
// te komunikaty odpalając się bezwarunkowo przed switch(actionId)). granice i
// umowa_szlakow/umowa_handlowa mają już takie asercje wyżej (§13, §17).
// ---------------------------------------------------------------------------

// 19a nap — Relacja 49 < progNapRelacja(50): komunikat dedykowany, nie generyczny
r = evaluateProposal(prop('nap'), ctx({ relation: rel(25, 24) }));
ok(
  !r.accepted && r.reason.includes('pakt') && !r.reason.includes('Przewaga'),
  'nap @ niska Rel bez koszyka: dedykowany komunikat "Relacja zbyt niska na pakt", nie generyczny',
);

// 19b sojusz_defensywny — Relacja/Zaufanie za niskie: komunikat dedykowany
r = evaluateProposal(prop('sojusz_defensywny'), ctx({ relation: rel(30, 30) }));
ok(
  !r.accepted && (r.reason.includes('Zaufanie') || r.reason.includes('Relacja')) && !r.reason.includes('Przewaga'),
  'sojusz_defensywny @ niska Rel bez koszyka: dedykowany komunikat Zaufanie/Relacja, nie generyczny',
);

// 19c sojusz_pelny — jak wyżej
r = evaluateProposal(prop('sojusz_pelny'), ctx({ relation: rel(30, 30) }));
ok(
  !r.accepted && (r.reason.includes('Zaufanie') || r.reason.includes('Relacja')) && !r.reason.includes('Przewaga'),
  'sojusz_pelny @ niska Rel bez koszyka: dedykowany komunikat Zaufanie/Relacja, nie generyczny',
);

// 19d wasal — Respekt proponenta (40, domyślny ctx) < progWasalizacjaRespekt(70)
r = evaluateProposal(prop('wasal'), ctx({ relation: rel(25, 24) }));
ok(
  !r.accepted && r.reason.includes('Respekt') && !r.reason.includes('Przewaga'),
  'wasal @ niska Rel bez koszyka: dedykowany komunikat Respekt, nie generyczny',
);

// 19e pokój — BEZPIECZEŃSTWO (wymóg #2): peaceProposalOfferPn ma samospełniający
// się warunek przy pustym koszyku (offerPn = required + 0 = required, nigdy
// < required) — bez dedykowanej bramki lokalnej to byłby exploit „darmowy pokój
// podczas wojny". Musi ODRZUCIĆ mimo pustego koszyka.
r = evaluateProposal(prop('pokoj', 0, 1, {}), ctx({ stanWojny: true, relation: rel(25, 24, 'wojna') }));
ok(
  !r.accepted && r.reason.includes('PW') && !r.reason.includes('Przewaga u Ciebie —'),
  'BEZPIECZEŃSTWO: pokój bez koszyka podczas wojny @ niska Rel — ODRZUCONY (brak exploita "darmowy pokój"), komunikat dedykowany',
);
// ...i przy Relacji bliskiej neutralnej (ale wciąż capowanej WAR_RELATION_SCORE_CAP=29
// podczas wojny) — też odrzucony bez koszyka, bo baza pokoju (500 PW) nie jest pokryta
// samą Relacją @ tym capie; dopłata koszykiem (patrz test #17 wyżej, `pokój z dopłatą
// bilansu PW @ wojna`) pokrywa różnicę.
r = evaluateProposal(prop('pokoj', 0, 1, {}), ctx({ stanWojny: true, relation: rel(50, 50, 'wojna') }));
ok(!r.accepted, 'pokój bez koszyka @ wojna, Relacja przedwojenna neutralna: wciąż wymaga dopłaty (WAR_RELATION_SCORE_CAP)');

// ---------------------------------------------------------------------------
// 19f-g R-DYPLO-FAIRNESS-GATE-ZAKRES-Q1=A — zakres treatyPnGate receive-side
// ŚWIADOMIE zawężony do proposerIsPlayer (jak dawna proposerUnfairToPartnerGate),
// żeby nie wykraczać poza literę decyzji A ("bug komunikatu, nie logiki
// akceptacji"). Mutation-test dowód: cofnięcie guardu `!proposerIsPlayer` w
// treatyPnGate NIE zmienia wyniku poniższych dwóch asercji (bo 19f i tak
// oczekuje odrzucenia); usunięcie CAŁEGO receive-side sprawdzenia (przywrócenie
// starego hasBasket liczącego tylko `give`) łamie 19f.
// ---------------------------------------------------------------------------

// 19f proposer=gracz, koszyk "tylko odbieram" (receivePn bez givePn) dla nap —
// nadal zablokowane (zachowanie sprzed poszerzenia zakresu, proposerIsPlayer=true).
r = evaluateProposal(prop('nap', 0, 1, { receivePn: 100 }), ctx({ relation: rel(50, 50) }));
ok(
  !r.accepted && r.reason.includes('nieuczciwa'),
  'nap proposer=gracz, koszyk tylko-odbieram (receivePn=100, givePn=0): odrzucone jako nieuczciwe dla partnera',
);

// 19g proposer=AI, ten sam koszyk "tylko odbieram" — treatyPnGate (receive-side)
// świadomie NIE blokuje (poza zakresem decyzji A, guard proposerIsPlayer),
// zgodnie z dawnym zachowaniem proposerUnfairToPartnerGate. Test przypina ZAKRES,
// nie deklaruje że to pożądane docelowo — patrz komentarz przy guardzie w kodzie.
r = evaluateProposal(prop('nap', 1, 0, { receivePn: 100 }), ctx({ relation: rel(50, 50) }));
ok(
  r.accepted !== false || !r.reason.includes('nieuczciwa dla partnera'),
  'nap proposer=AI, koszyk tylko-odbieram: treatyPnGate receive-side NIE odrzuca (zakres zawężony do proposerIsPlayer, poza literą decyzji A)',
);

// ---------------------------------------------------------------------------
// 20 BUG-TRAKTAT-KOSZYK-REGRESJA=A (2026-08-08) — akcja 5 (traktat szlaków,
// `umowa_szlakow`) MUSI zostać poza koszykiem wymiany (HANDEL-SPLIT-Q1=B).
// Commit 9cc7c76c przypadkiem dopisał '5' do TRADE_BASKET_ACTION_IDS w
// diplomacyTradeBasket.ts, co otwierało pełny koszyk PW pod klikiem "Traktat
// handlowy". Test wprost na warstwie UI-eligibility, nie tylko na silniku.
// ---------------------------------------------------------------------------
ok(
  actionUsesTradeBasket('5') === false,
  'UI: akcja 5 (traktat szlaków) NIE używa koszyka wymiany (actionUsesTradeBasket)',
);
ok(
  !TRADE_BASKET_ACTION_IDS.has('5'),
  'UI: TRADE_BASKET_ACTION_IDS nie zawiera akcji 5 (traktat szlaków bez koszyka)',
);
// Kontrola pozytywna: 14 (umowa wymiany) i 13 (dar) — sąsiednie akcje na tym
// samym stole — MUSZĄ zostać w koszyku, żeby asercja wyżej nie przechodziła
// przez przypadek (np. pusty zbiór po literówce).
ok(
  actionUsesTradeBasket('14') === true && actionUsesTradeBasket('13') === true,
  'UI: kontrola pozytywna — akcje 13 (dar) i 14 (umowa wymiany) nadal używają koszyka',
);

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
