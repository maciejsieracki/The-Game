'use strict';
/**
 * diplomacy-own-proposal-edit-test.cjs — R-PROPOZYCJA-BRAK-EDYCJI, wariant A (Maciej,
 * 2026-08-10): edycja WŁASNEJ, jeszcze nierozstrzygniętej propozycji (direction='own' w
 * UI) W MIEJSCU, bez resetu kontekstu negocjacji.
 *
 * 1) SILNIK: `applyOwnProposalEdit` (diplomacy-proposals.ts) podmienia WYŁĄCZNIE payload —
 *    round/awaitingOwnerId/authorOwnerId (i cała reszta wpisu) zostają BEZ ZMIAN, w
 *    kontraście z `applyCounterOffer` (kontroferta), które zawsze +1 rundę i przełącza
 *    stronę odpowiadającą.
 * 2) UI-GATING: replika formuły `canCounter` z `buildPendingNegotiationRows`
 *    (main.ts) — własne propozycje typu koszykowego (np. `handel`, uiActionId '14')
 *    kwalifikują się do edycji (`canCounter=true`); `umowa_szlakow`/`umowa_handlowa`
 *    (uiActionId '5', CELOWO bez koszyka — patrz komentarz przy TRADE_BASKET_ACTION_IDS w
 *    diplomacyTradeBasket.ts) NADAL nie ma edycji — regresja negatywna, musi zostać
 *    nietknięta.
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const STUB_DIR = path.resolve(__dirname, '.stubs');
const LEADER_PORTRAITS_STUB = path.resolve(STUB_DIR, 'leaderPortraits-own-edit-stub.ts');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'brandAssets-own-edit-stub.ts');
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

const BUNDLE = path.resolve(__dirname, '.dip-own-edit-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dip-own-edit-entry.ts');
fs.writeFileSync(entryFile, `
export {
  createNegotiation, applyCounterOffer, applyOwnProposalEdit, canPlayerCounterNegotiation,
  NEGOTIATION_MAX_ROUNDS,
} from '../src/game/diplomacy-proposals.ts';
export { actionUsesTradeBasket } from '../src/ui/diplomacyTradeBasket.ts';
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
    createNegotiation, applyCounterOffer, applyOwnProposalEdit, canPlayerCounterNegotiation,
    NEGOTIATION_MAX_ROUNDS, actionUsesTradeBasket,
  } = require(BUNDLE);

  let pass = 0;
  let fail = 0;
  function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

  console.log('diplomacy-own-proposal-edit-test');

  /** Formuła canCounter z main.ts::buildPendingNegotiationRows — kopia do testu (nie eksportowana z main.ts). */
  function ownCanCounter(entry, uiActionId) {
    return canPlayerCounterNegotiation(entry) && actionUsesTradeBasket(uiActionId);
  }

  // --- 1) applyOwnProposalEdit: podmienia TYLKO payload — round/awaitingOwnerId/authorOwnerId BEZ ZMIAN ---
  {
    const proposal = {
      actionId: 'handel',
      proposerOwnerId: 0,
      responderOwnerId: 1,
      payload: { giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 10 }], receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 20 }] },
    };
    const entry = createNegotiation(proposal, 10, 'player', 1);
    ok(entry.round === 1, 'setup: round=1 przed edycją');
    ok(entry.awaitingOwnerId === 1, 'setup: awaitingOwnerId=partner (AI) przed edycją');

    const newPayload = { giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 25 }], receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 20 }] };
    const edited = applyOwnProposalEdit(entry, newPayload);

    ok(edited.payload === newPayload, 'applyOwnProposalEdit: payload podmieniony na nowy');
    ok(edited.round === entry.round, `applyOwnProposalEdit: round BEZ ZMIAN (${edited.round} === ${entry.round})`);
    ok(edited.awaitingOwnerId === entry.awaitingOwnerId, 'applyOwnProposalEdit: awaitingOwnerId BEZ ZMIAN (AI dalej odpowiada, bez resetu kontekstu)');
    ok(edited.authorOwnerId === entry.authorOwnerId, 'applyOwnProposalEdit: authorOwnerId BEZ ZMIAN');
    ok(edited.createdTurn === entry.createdTurn, 'applyOwnProposalEdit: createdTurn BEZ ZMIAN');
    ok(edited.lastActionTurn === entry.lastActionTurn, 'applyOwnProposalEdit: lastActionTurn BEZ ZMIAN (brak resetu terminu)');
    ok(edited.expiresTurn === entry.expiresTurn, 'applyOwnProposalEdit: expiresTurn BEZ ZMIAN');
    ok(edited.id === entry.id, 'applyOwnProposalEdit: TEN SAM wpis (id), nie nowy');
    ok(edited.proposerOwnerId === entry.proposerOwnerId && edited.responderOwnerId === entry.responderOwnerId,
      'applyOwnProposalEdit: role proposer/responder BEZ ZMIAN');

    // Kontrast z applyCounterOffer (kontroferta) na TYM SAMYM wejściowym wpisie — musi
    // faktycznie zwiększyć rundę i przełączyć stronę, inaczej test niczego by nie odróżniał.
    const countered = applyCounterOffer(entry, newPayload, 0, 11);
    ok(countered.round === entry.round + 1, 'kontrast: applyCounterOffer +1 rundę (w odróżnieniu od applyOwnProposalEdit)');
    ok(countered.awaitingOwnerId === 1, 'kontrast: applyCounterOffer zostawia awaitingOwnerId=partner po kontrze gracza (round 1->2)');
  }

  // --- 2) UI-gating: własna propozycja typu koszykowego (handel, uiActionId '14') -> canCounter=true ---
  {
    const entry = createNegotiation(
      { actionId: 'handel', proposerOwnerId: 0, responderOwnerId: 1, payload: { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 10 }] } },
      10, 'player', 2,
    );
    ok(ownCanCounter(entry, '14') === true, 'own + handel (uiActionId 14, koszykowy): canCounter=true -> dostaje przycisk Edytuj');
  }

  // --- 3) Regresja negatywna: umowa_szlakow (uiActionId '5', CELOWO bez koszyka) -> canCounter=false ---
  {
    const entry = createNegotiation(
      { actionId: 'umowa_szlakow', proposerOwnerId: 0, responderOwnerId: 1, payload: { turns: 20 } },
      10, 'player', 3,
    );
    ok(actionUsesTradeBasket('5') === false, 'kontrola: uiActionId 5 (umowa_szlakow/umowa_handlowa) NIE jest w TRADE_BASKET_ACTION_IDS');
    ok(ownCanCounter(entry, '5') === false, 'own + umowa_szlakow (uiActionId 5, bez koszyka): canCounter=false — NIE dostaje Edytuj (nietknięte)');
  }

  // --- 4) Limit rund: nawet koszykowa własna propozycja traci canCounter po osiągnięciu limitu ---
  {
    const base = {
      id: 'x', proposerOwnerId: 0, responderOwnerId: 1, actionId: 'handel', payload: {},
      authorOwnerId: 0, awaitingOwnerId: 1, createdTurn: 1, lastActionTurn: 1, expiresTurn: 99, source: 'player',
    };
    ok(ownCanCounter({ ...base, round: NEGOTIATION_MAX_ROUNDS - 1 }, '14') === true, `own+koszyk: round ${NEGOTIATION_MAX_ROUNDS - 1} (< limit) -> canCounter=true`);
    ok(ownCanCounter({ ...base, round: NEGOTIATION_MAX_ROUNDS }, '14') === false, `own+koszyk: round ${NEGOTIATION_MAX_ROUNDS} (limit) -> canCounter=false`);
  }

  try { fs.unlinkSync(entryFile); } catch (_) { /* ok */ }
  try { fs.unlinkSync(LEADER_PORTRAITS_STUB); } catch (_) { /* ok */ }
  try { fs.unlinkSync(BRAND_ASSETS_STUB); } catch (_) { /* ok */ }

  console.log(`\n${pass}/${pass + fail} PASS`);
  process.exit(fail ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
