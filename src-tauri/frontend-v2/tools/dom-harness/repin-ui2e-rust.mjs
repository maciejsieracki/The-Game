/**
 * repin-ui2e-rust.mjs — „Rust” harnessu Chromium partii REPIN UI-2-E (`R-RUSTPORT-REPIN-UI-2-E-Q1`): `StaticCatalogDto`
 * (fragment czytany przez panele dyplomacji) i `DiplomacyQueriesProvider` zbudowane z FUNKCJI WEBU (`origin/main`).
 *
 * Formuły = `run-repin-ui2e-cycles.mjs` / `run-cycles.mjs` (P5.6: `relDeal`, `panelDto`, `treatyDto`, `sumPn`, provider),
 * z polami kontraktu partii E: `ctx.basketActionId` → `basketPnOpts.actionId`, `cityPn`/`cityWeight` w pozycjach
 * (web `diplomacyTradeBasket.ts:195-227`), `constants.miastoAkcjeDozwolone` = `MIASTO_AKCJE_DOZWOLONE`.
 * Moduł jest pakowany do strony PORTU razem z modułami `game/*` webu (strona webu go nie używa).
 *
 * `m` = { VC, E, AP, DD, PR, TV, AOB, WG, AA, BC, CR, AB } — moduły webu: diplomacy-value-catalog, diplomacy-pn-engine,
 * diplomacy-acceptance-points, diplomacy-display, diplomacy-proposals, diplomacy-trade-validation,
 * diplomacy-ai-offer-balance, diplomacy-war-gates, diplomacy-audience-actions, diplomacy-barbarian-cooperation,
 * diplomacy-credibility, ui/diplomacyAcceptanceBalance (r2: stan audiencji).
 * `data` = { tech, resourceKeyLabels, civs } (tech.json webu; etykiety `RESOURCE_KEY_LABEL` odczytane z pliku webu w Node).
 */
export function createUi2eRust(m, data) {
  const { VC, E, AP, DD, PR, TV, AOB, WG, AA, BC, CR, AB } = m;
  const multiOwn = [];
  for (let i = 0; i <= 30; i++) if (AA.uiActionAllowsMultipleOwnOnTable(String(i))) multiOwn.push(String(i));
  const catalog = {
    contentHash: 'harness-web-ui2e-chromium',
    buildings: [], units: [], tech: data.tech, terrainImprovements: {}, wonders: [], counters: {}, civs: data.civs ?? { cywilizacje: [] },
    cityNamesPools: {}, powerParams: {}, uiParams: {}, wiki: { poradnik: [], encyklopedia: [] },
    constants: {
      barbarianCooperationDefaultDurationTurns: BC.BARBARIAN_COOPERATION_DEFAULT_DURATION_TURNS,
      zywnoscNaPn: VC.diplomacyZywnoscNaPn(),
      progDarRelacja: VC.diplomacyProgDarRelacja(),
      handelZaufaniePerTura: VC.diplomacyHandelZaufaniePerTura(),
      handelSurowceKeys: Object.keys(VC.diplomacyHandelSurowceCatalog()),
      audienceMultiOwnActionIds: multiOwn,
      miastoAkcjeDozwolone: [...VC.MIASTO_AKCJE_DOZWOLONE],
    },
    labels: {
      traktatHandlowyLabel: DD.TRAKTAT_HANDLOWY_LABEL,
      resourceAccessTradeWithdrawnReason: PR.RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON,
      resourceKeyLabels: data.resourceKeyLabels,
    },
    unitCategory: {}, unitCategoryNameOnly: {}, techTerrainUnlockLabels: {},
  };
  let scenarioCtx = null;
  const relDeal = (t) => ({
    total: t, modPct: E.relationPnModPct(E.relationSignedFromTotal(t)), modLabel: E.formatRelationModLabel(t),
    tradeFairMult: 100 / Math.max(1, t), tradeParity: t >= 100, signed: E.relationSignedFromTotal(t),
  });
  const panelDto = (give, recv, t, fp) => {
    if (give == null || recv == null) return { givePn: give, receivePn: recv, fairMinPn: 0, balancePn: 0, accepted: false, relation: { ...relDeal(t), signed: 0 } };
    const fairMin = VC.diplomacyFairGivePn(recv, Math.min(100, t));
    return {
      givePn: give, receivePn: recv,
      balancePn: fp?.pwBalance ?? (give - fairMin),
      fairMinPn: fp?.pwBalance != null ? give - fp.pwBalance : fairMin,
      accepted: fp?.accepted ?? E.pnDealAcceptedByAi(give, recv, t),
      relation: relDeal(t),
    };
  };
  const treatyDto = (playerTreatyPw, give, recv, t, relRequired, treatyBasePw, partnerTreatyPw) => {
    const base = treatyBasePw ?? partnerTreatyPw ?? playerTreatyPw;
    const partnerPw = partnerTreatyPw ?? E.treatyPwForRole(base, t, 'partner');
    const playerPw = playerTreatyPw > 0 ? playerTreatyPw : E.treatyPwForRole(base, t, 'player');
    const myDisplay = playerPw + give;
    const theirDisplay = partnerPw + recv;
    const asym = myDisplay - theirDisplay;
    const relOk = relRequired == null || t >= relRequired;
    const basketFairMin = recv > 0 ? VC.diplomacyFairGivePn(recv, Math.min(100, t)) : 0;
    const basketFair = recv <= 0 || E.pnDealAcceptedByAi(give, recv, t);
    return {
      givePn: give, receivePn: recv, treatyPw: { my: playerPw, their: partnerPw, bilateral: 0, base },
      accepted: relOk && asym >= 0 && basketFair, balancePn: basketFair ? asym : (give - basketFairMin), relation: relDeal(t),
      treatyGate: { basketNet: Math.max(0, give - recv), myDisplayPw: myDisplay, theirDisplayPw: theirDisplay, relRequired: relRequired ?? null, relOk, basketFair },
    };
  };
  const sumPn = (q) => {
    const tempo = q.ctx.tempoGry ?? 'standardowa';
    const perTurn = q.resourceTradeMode === 'per_turn';
    return VC.diplomacySumPn(q.items.map((i) => ({ typ: i.typ, id: i.id, ilosc: i.ilosc, tempo, cityPn: i.cityPn, cityWeight: i.cityWeight })), {
      difficulty: q.ctx.difficulty ?? 'normal', proposerOwnerId: 0, playerOwnerId: 0, side: q.side, tempo, perTurn,
      turnsMultiplier: perTurn ? Math.max(1, q.dealTurns) : 1,
      actionId: q.ctx.basketActionId,
    });
  };
  const queryLog = [];
  const provider = {
    basketSumPn: (q) => { queryLog.push('basketSumPn:' + (q.ctx.basketActionId ?? '-')); return sumPn(q); },
    basketSummary(q) {
      queryLog.push('basketSummary');
      const c = q.ctx;
      const rel = c.relacjaTotal ?? 100;
      const trustGained = c.trustPnGainedThisTurn ?? 0;
      const base = { resourceTradeMode: q.resourceTradeMode, dealTurns: q.dealTurns, ctx: c };
      const givePn = sumPn({ ...base, items: q.give, side: 'give' });
      const receivePn = q.mode === 'trade' ? sumPn({ ...base, items: q.receive, side: 'receive' }) : 0;
      const fp = q.mode === 'trade' ? scenarioCtx?.tradeFairnessPreview?.(givePn ?? 0, receivePn ?? 0) : undefined;
      const both = givePn != null && receivePn != null;
      const trust = q.mode === 'trade' && both ? VC.diplomacyTradeTrustFromDeal(givePn, receivePn, rel, trustGained) : null;
      const gift = q.mode === 'gift' && givePn != null ? VC.diplomacyGiftTrustFromPn(givePn, trustGained) : null;
      const dw = trust ? VC.diplomacyDobraWolaFromSurplus(trust.surplusPn) : null;
      const fmt = { perTurn: q.resourceTradeMode === 'per_turn', turns: q.dealTurns };
      return {
        ...panelDto(givePn, receivePn, rel, fp),
        treatyPw: { my: 0, their: 0, bilateral: 0, base: 0 },
        trust: { surplusPn: trust?.surplusPn ?? 0, delta: trust?.deltaZaufanie ?? 0, deltaRaw: trust?.deltaZaufanieRaw ?? 0, cap: VC.diplomacyPnRelacjaParams().max_zaufanie_na_ture, gained: trustGained },
        dobraWola: dw?.active ? { perTurn: dw.zaufaniePerTura, turns: dw.tur } : null,
        giftTrust: gift ? { delta: gift.deltaZaufanie, deltaRaw: gift.deltaZaufanieRaw } : null,
        validation: { valid: true, reason: null }, currencyForbiddenWar: false,
        turnsMultiplier: E.proposalPnTurnsMultiplier({ resourceTradeMode: q.resourceTradeMode, turns: q.dealTurns }).turnsMultiplier,
        brief: { give: DD.formatBasketListBrief(q.give, fmt), receive: DD.formatBasketListBrief(q.receive, fmt) },
        treatyGate: null,
        summaryFairMinPn: both ? VC.diplomacyFairGivePn(receivePn, rel) : 0,
      };
    },
    treatyBasketSummary(q) {
      queryLog.push('treatyBasketSummary');
      const rel = q.ctx.relacjaTotal ?? 100;
      const sides = AP.computePlayerAcceptanceSides(q.proposalActionId, q.payload, rel, false);
      const treatyBasePw = sides.my.treatyBasePn ?? sides.their.treatyBasePn;
      const bil = AP.bilateralTreatyDisplayPw(sides.my, sides.their);
      const myPw = AP.sideDisplayOfferPw(sides.my, bil);
      const theirPw = AP.sideDisplayOfferPw(sides.their, bil);
      const base = { resourceTradeMode: q.resourceTradeMode, dealTurns: q.dealTurns, ctx: q.ctx };
      const g = sumPn({ ...base, items: q.give, side: 'give' }) ?? 0;
      const r = sumPn({ ...base, items: q.receive, side: 'receive' }) ?? 0;
      let treatyPreview = null;
      let basketPreview = null;
      if (bil != null && bil > 0) {
        treatyPreview = treatyDto(sides.my.treatyEffectivePn ?? bil, g, r, rel, sides.my.relRequired ?? sides.their.relRequired, treatyBasePw, sides.their.treatyEffectivePn ?? treatyBasePw ?? bil);
      } else if (myPw > 0 || theirPw > 0) basketPreview = panelDto(myPw, theirPw, rel, undefined);
      return { bilateralPw: bil ?? null, myPw, theirPw, treatyPreview, basketPreview };
    },
    validateTradeBasketSides: (mo, g, r) => TV.validateTradeBasketSides(mo, g, r),
    currencyForbiddenDuringWar: (id, p, w) => WG.isCurrencyProposalForbiddenDuringWar(id, p, w),
    quickDealBasket: (q) => E.computeQuickDealBasket({
      relacjaTotal: q.ctx.relacjaTotal ?? 0, ourGoldAvailable: q.ctx.playerSkarbiec ?? 0, ourResourceOptions: [], theirResourceOptions: [],
      ourQuantityResourceOptions: q.ourQuantityResourceOptions, theirQuantityResourceOptions: q.theirQuantityResourceOptions,
    }),
    balanceGiveItemsToFairMin: (q) => AOB.balanceGiveItemsToFairMin(q.giveItems, q.receivePn, q.ctx.relacjaTotal ?? 0, Math.floor(q.ctx.playerSkarbiec ?? 0), {
      difficulty: q.ctx.difficulty ?? 'normal', proposerOwnerId: 0, playerOwnerId: 0, tempoGry: q.ctx.tempoGry ?? 'standardowa',
      ...E.proposalPnTurnsMultiplier({ resourceTradeMode: q.resourceTradeMode, turns: q.dealTurns }),
    }),
    handelSurowiecKrok: (id) => VC.diplomacyHandelSurowiecKrok(id),
    normalizeSurowiecIlosc: (id, q, mx) => VC.diplomacyNormalizeSurowiecIlosc(id, q, mx),
    stripWithdrawnResourceAccessItems: (i) => PR.stripWithdrawnResourceAccessItems(i),
    proposalHasResourceAccess: (p) => PR.proposalHasResourceAccess(p),
  };
  // Z2 (r2): DTO stanu audiencji (P5-0 §6.6 `DiplomacyAudienceDto`) z funkcji webu — formuła `run-repin-ui2e-cycles.mjs`
  // `toV2State` (sekcja 7), dla scen Chromium `audiencja*` (bez pozycji negocjacji na stole).
  const viewW = (w, rozbicie) => {
    if (w === undefined) return undefined;
    const wr = Math.round(Math.max(-100, Math.min(100, w)));
    const band = CR.wiarygodnoscLabelPl(wr);
    return { band, tooltip: rozbicie ? DD.wiarygodnoscTooltipDefPl() + ' ' + CR.wiarygodnoscTooltipRozbiciePl(rozbicie, band) : DD.wiarygodnoscTooltipPl() };
  };
  const audienceState = (st) => {
    if (st == null) return st;
    const atWar = st.formalStatus?.kind === 'wojna';
    const rows = st.pendingNegotiations ?? [];
    if (rows.length) throw new Error('audienceState: pozycje negocjacji nieobsługiwane w harnessie Chromium (jsdom: run-repin-ui2e-cycles)');
    const panel = AB.balancePanelDataFromRows(rows);
    return {
      ...st,
      nastawienie: { scores: DD.effectiveNastawienieScores(st.zaufanie, st.respekt, atWar), label: DD.nastawienieLabelFromScore(st.zaufanie, st.respekt, { atWar }), hint: DD.nastawienieHintPl(atWar) },
      playerWiarygodnoscView: viewW(st.playerWiarygodnosc, st.playerWiarygodnoscRozbicie),
      otherWiarygodnoscView: viewW(st.otherWiarygodnosc, st.otherWiarygodnoscRozbicie),
      negotiationTablePanel: panel == null ? null : { ...panel, relation: relDeal(panel.theirBalance.relCurrent ?? panel.myBalance?.relCurrent ?? 100) },
      actionableNegotiationCount: AB.filterActionableNegotiationRows(rows).length,
    };
  };
  return { catalog, provider, queryLog, setScenarioCtx: (c) => { scenarioCtx = c; }, audienceState };
}
