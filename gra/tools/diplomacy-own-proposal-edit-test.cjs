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
 * 2) UI-GATING runda 2 (doprecyzowanie 2026-08-10 po Evaluatorze rundy 1 — 2 defekty):
 *    replika formuły `canCounter` z `buildPendingNegotiationRows` (main.ts) — własne
 *    propozycje kwalifikują się do edycji TYLKO gdy `getTradeBasketMode(uiActionId)` to
 *    `'trade'` ('14') lub `'gift'` ('13'), NIE cały `actionUsesTradeBasket` (12 typów).
 *    Runda 1 użyła pełnego `actionUsesTradeBasket` dla własnych propozycji i wprowadziła:
 *    Defekt 1 — edycja czystych traktatów (np. `nap`, uiActionId '2') to cichy no-op
 *    (payload bez koszyka i bez goldOnce>0 odrzucony przez
 *    clampNegotiationPayloadToRealResources); Defekt 2 — synteza giveItems z goldOnce w
 *    main.ts dubluje złoto dla typów, gdzie goldOnce to OSOBNE pole obok giveItems (np.
 *    `granice`/opłata, uiActionId '4'). Runda 2 usuwa OBA defekty przez brak dostępu do
 *    edycji w ogóle dla tych typów — `umowa_szlakow`/`umowa_handlowa` (uiActionId '5',
 *    CELOWO bez koszyka) NADAL nie ma edycji — regresja negatywna, musi zostać nietknięta.
 * / EN: round 2 UI-gating (2026-08-10 refinement after round-1 Evaluator — 2 defects):
 *    own proposals qualify for edit ONLY when `getTradeBasketMode(uiActionId)` is 'trade'
 *    ('14') or 'gift' ('13'), NOT the full actionUsesTradeBasket set (12 types). Round 1
 *    used the full set for own proposals and introduced defect 1 (editing pure treaties
 *    e.g. `nap` is a silent no-op) and defect 2 (gold duplication for types where goldOnce
 *    is a separate field alongside giveItems, e.g. `granice`/fee). Round 2 removes both by
 *    denying edit access entirely for those types.
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
export { actionUsesTradeBasket, getTradeBasketMode } from '../src/ui/diplomacyTradeBasket.ts';
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
    NEGOTIATION_MAX_ROUNDS, actionUsesTradeBasket, getTradeBasketMode,
  } = require(BUNDLE);

  let pass = 0;
  let fail = 0;
  function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

  console.log('diplomacy-own-proposal-edit-test');

  /**
   * Formuła canCounter z main.ts::buildPendingNegotiationRows — kopia do testu (nie
   * eksportowana z main.ts). Runda 2: dla direction='own' zawężona do getTradeBasketMode
   * 'trade'/'gift' (patrz komentarz na górze pliku). `actionUsesTradeBasket` MUSI zostać
   * jako pierwszy warunek — getTradeBasketMode ma fallback 'trade' dla KAŻDEGO uiActionId
   * spoza TRADE_BASKET_ACTION_IDS (np. '5'), więc sam tryb bez tego warunku przepuściłby
   * też typy CELOWO bez koszyka.
   */
  function ownCanCounter(entry, uiActionId) {
    if (!actionUsesTradeBasket(uiActionId)) return false;
    const mode = getTradeBasketMode(uiActionId);
    return canPlayerCounterNegotiation(entry) && (mode === 'trade' || mode === 'gift');
  }

  /**
   * Replika syntezy `giveItems` z `goldOnce` w gałęzi direction==='own' (counterInitial,
   * main.ts::buildPendingNegotiationRows) — dokładnie ten fragment, który w rundzie 1
   * dublował złoto dla typów z osobnym polem goldOnce. Zwraca kształt counterInitial (nie
   * pełny obiekt — tylko pola istotne dla sprawdzenia duplikacji: giveItems + goldOnce).
   */
  function ownCounterInitialGiveShape(uiActionId, p) {
    if (uiActionId === '13') {
      // Gałąź '13' (gift) — WYŁĄCZNIE giveItems, obiekt nie ma w ogóle klucza goldOnce ->
      // strukturalnie niemożliwa duplikacja (nie ma drugiego pola do zdublowania).
      return { giveItems: p.giveItems?.length ? [...p.giveItems] : undefined };
    }
    return {
      giveItems: p.giveItems?.length
        ? [...p.giveItems]
        : (p.goldOnce ?? 0) > 0
          ? [{ typ: 'zloto', id: 'zloto', ilosc: p.goldOnce }]
          : undefined,
      goldOnce: p.goldOnce,
    };
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

  // --- 2) UI-gating: własna propozycja typu koszykowego (handel '14', dar '13') -> canCounter=true ---
  {
    const entryTrade = createNegotiation(
      { actionId: 'handel', proposerOwnerId: 0, responderOwnerId: 1, payload: { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 10 }] } },
      10, 'player', 2,
    );
    ok(getTradeBasketMode('14') === 'trade', 'kontrola: getTradeBasketMode(14) === "trade"');
    ok(ownCanCounter(entryTrade, '14') === true, 'own + handel (uiActionId 14, trade): canCounter=true -> dostaje przycisk Edytuj');

    const entryGift = createNegotiation(
      { actionId: 'handel', proposerOwnerId: 0, responderOwnerId: 1, payload: { giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 5 }] } },
      10, 'player', 6,
    );
    ok(getTradeBasketMode('13') === 'gift', 'kontrola: getTradeBasketMode(13) === "gift"');
    ok(ownCanCounter(entryGift, '13') === true, 'own + dar (uiActionId 13, gift): canCounter=true -> dostaje przycisk Edytuj');
  }

  // --- 3) Regresja negatywna: umowa_szlakow (uiActionId '5', CELOWO bez koszyka) -> canCounter=false ---
  {
    const entry = createNegotiation(
      { actionId: 'umowa_szlakow', proposerOwnerId: 0, responderOwnerId: 1, payload: { turns: 20 } },
      10, 'player', 3,
    );
    ok(actionUsesTradeBasket('5') === false, 'kontrola: uiActionId 5 (umowa_szlakow/umowa_handlowa) NIE jest w TRADE_BASKET_ACTION_IDS');
    // PUŁAPKA: getTradeBasketMode('5') zwraca 'trade' przez fallback (ostatnie `return
    // 'trade'` dla KAŻDEGO id spoza TRADE_BASKET_ACTION_IDS) — gdyby ownCanCounter liczył
    // WYŁĄCZNIE tryb, bez actionUsesTradeBasket jako pierwszego warunku, ta asercja
    // fałszywie wróciłaby canCounter=true dla '5'. Pinuje tę pułapkę na przyszłość.
    ok(getTradeBasketMode('5') === 'trade', 'PUŁAPKA (pinned): getTradeBasketMode(5) === "trade" mimo że 5 CELOWO nie ma koszyka — to fallback, nie prawdziwy tryb');
    ok(ownCanCounter(entry, '5') === false, 'own + umowa_szlakow (uiActionId 5, bez koszyka): canCounter=false — NIE dostaje Edytuj (nietknięte, mimo pułapki fallbacku wyżej)');
  }

  // --- 3b) NAPRAWA Defekt 1: czysty traktat (nap, uiActionId '2') -> canCounter=false,
  // mimo że JEST w actionUsesTradeBasket (12-typowy zbiór). Runda 1 dawałaby tu
  // canCounter=true i cichy no-op po "Zapisz zmiany" (clampNegotiationPayloadToRealResources
  // odrzuca payload bez koszyka/goldOnce>0). Runda 2: brak przycisku Edytuj w ogóle.
  {
    const entry = createNegotiation(
      { actionId: 'nap', proposerOwnerId: 0, responderOwnerId: 1, payload: { turns: 15 } },
      10, 'player', 7,
    );
    ok(actionUsesTradeBasket('2') === true, 'kontrola: uiActionId 2 (nap) JEST w TRADE_BASKET_ACTION_IDS (dlatego runda 1 dawała mu błędnie canCounter=true)');
    ok(getTradeBasketMode('2') === 'treaty', 'kontrola: getTradeBasketMode(2) === "treaty" (nie trade/gift)');
    ok(ownCanCounter(entry, '2') === false, 'NAPRAWA Defekt 1: own + nap (uiActionId 2, czysty traktat): canCounter=false — NIE dostaje Edytuj (był cichy no-op)');
  }

  // --- 3c) NAPRAWA Defekt 2: granice/opłata (uiActionId '4') -> canCounter=false, mimo że
  // JEST w actionUsesTradeBasket. Runda 1: payload miałby giveItems (koszyk) ORAZ osobne
  // pole goldOnce (buildTreatyPayload emituje oba OBOK siebie) — synteza w main.ts
  // dokładałaby drugą kopię złota z goldOnce do giveItems przy zapisie bez zmian. Runda 2:
  // brak przycisku Edytuj w ogóle, więc ta ścieżka syntezy jest nieosiągalna dla '4'.
  {
    const entry = createNegotiation(
      {
        actionId: 'granice',
        proposerOwnerId: 0,
        responderOwnerId: 1,
        payload: { giveItems: [{ typ: 'surowiec_ilosc', id: 'zboze', ilosc: 3 }], goldOnce: 20, borderMilitary: false },
      },
      10, 'player', 8,
    );
    ok(actionUsesTradeBasket('4') === true, 'kontrola: uiActionId 4 (granice) JEST w TRADE_BASKET_ACTION_IDS');
    ok(getTradeBasketMode('4') === 'treaty', 'kontrola: getTradeBasketMode(4) === "treaty" (nie trade/gift)');
    ok(ownCanCounter(entry, '4') === false, 'NAPRAWA Defekt 2: own + granice (uiActionId 4, goldOnce OBOK giveItems): canCounter=false — synteza dublująca złoto nieosiągalna');
  }

  // --- 3d) Potwierdzenie: dla '14'/'13' (jedyne typy z canCounter=true dla 'own', jedyne
  // przechodzące przez syntezę giveItems<-goldOnce) synteza NIE dubluje złota.
  {
    // '14' (trade): zgodnie z komentarzem w main.ts tryb trade NIE ma osobnego pola
    // goldOnce — gdy giveItems jest niepuste, payload.goldOnce jest 0/undefined (gracz
    // płaci zasobami/koszykiem, nie osobnym polem gotówki). Synteza używa WYŁĄCZNIE
    // giveItems (klon), a `goldOnce` w wynikowym kształcie jest falsy -> brak drugiej
    // wartości do zdublowania.
    const pTrade = { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 30 }], goldOnce: undefined };
    const shapeTrade = ownCounterInitialGiveShape('14', pTrade);
    ok(shapeTrade.giveItems.length === 1 && shapeTrade.giveItems[0].ilosc === 30, 'synteza 14 (trade): giveItems sklonowane 1:1, bez dodatkowej pozycji');
    ok(!shapeTrade.goldOnce, 'synteza 14 (trade): goldOnce w wynikowym kształcie jest falsy (brak osobnej wartości do zdublowania)');

    // '14' (trade) — wariant "gracz oferuje tylko gotówkę": giveItems puste, goldOnce>0 ->
    // synteza tworzy DOKŁADNIE JEDNĄ pozycję zloto z goldOnce (nie dubluje, bo giveItems
    // było puste — to jedyny nośnik treści).
    const pTradeGoldOnly = { giveItems: [], goldOnce: 40 };
    const shapeTradeGoldOnly = ownCounterInitialGiveShape('14', pTradeGoldOnly);
    ok(shapeTradeGoldOnly.giveItems.length === 1 && shapeTradeGoldOnly.giveItems[0].ilosc === 40, 'synteza 14 (trade, tylko gotówka): DOKŁADNIE 1 pozycja zloto z goldOnce, bez duplikatu');

    // '13' (gift): gałąź strukturalnie nie ma pola goldOnce w wyniku -> zero ryzyka duplikacji.
    const pGift = { giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 12 }] };
    const shapeGift = ownCounterInitialGiveShape('13', pGift);
    ok(shapeGift.giveItems.length === 1 && shapeGift.giveItems[0].ilosc === 12, 'synteza 13 (gift): giveItems sklonowane 1:1');
    ok(!('goldOnce' in shapeGift), 'synteza 13 (gift): wynikowy kształt NIE MA klucza goldOnce w ogóle — strukturalnie brak duplikacji');
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
