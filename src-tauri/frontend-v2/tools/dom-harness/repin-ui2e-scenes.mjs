/**
 * repin-ui2e-scenes.mjs — wektory i sceny harnessu Chromium partii REPIN UI-2-E (`R-RUSTPORT-REPIN-UI-2-E-Q1`).
 *
 * TEN SAM kod wykonuje się na stronie WEBU i PORTU (pakowany do obu wejść); różnią się tylko moduły w `api`
 * i adapter `entryFromRelation` (web: `diploListEntryFromRelation(rel)`; port: ten sam eksport z polem `lines`
 * policzonym przez „Rust” = web `formatDiploCivListLines`, P5.5 `DiploListDto.lines`).
 *
 * `api` = { LH: diploListHud, DP: diplomacyPanel, NM: diplomacyNegotiationModal, TB: diplomacyTradeBasket,
 *           entryFromRelation(rel), setScenarioCtx(ctx) }.
 * Hunki webu `86d510c66` objęte (plik:linia po stronie main): diploListHud `:39-52,180-181,367-385,512-515,538-544`;
 * diplomacyPanel `:34-35,220-235,266`; diplomacyNegotiationModal `:14-15,25-26,103-112,565`;
 * diplomacyTradeBasket `:5,20,43,71,139-140,158,171-175,206-207,225-243,360-361,531-534,632-633,839-859,874-880,
 * 1195-1202,1320-1322,1351-1353,1379-1381,1400-1421,1454-1455,1463,1537-1543,1642-1665,1743-1747,1764-1796,2191-2198,
 * 2234-2240,2354-2359,2411-2414,2417,2435-2436,2497-2499,2508-2509,2546-2548,2554-2555,2573,2585-2599,2633-2653,2743-2744,
 * 2792-2817,2854-2870,3021-3027` (zakresy wg `git diff -U0 edb8fb56 86d510c66`).
 */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Wejścia wektorów (liczby specjalne kodowane przez stronę wywołującą). */
export const AGRESOR_N = [undefined, null, NaN, Infinity, -Infinity, -1, 0, 0.4, 0.99, 1, 1.5, 1.99, 2, 3, 5, 9, 10, 11, 99, 100, 2 ** 31, 2 ** 53, -0, '3'];
const NAMES = ['Rzym', 'Kartagina <x>', 'Egipt & co', 'Persja', 'Sparta', 'Ateny "A"', 'Babilon', 'Asyria', 'Hetyci', 'Troja'];

export function relationVariants() {
  const out = [];
  const base = { ownerId: 3, civ: 'Persja <x>', tier: 2, zaufanie: 40, respekt: 55, theirRespekt: 12, cultureLabel: 'Perska', epochLabel: 'Brąz', population: 23, armyCount: 7, activeTreaties: ['Pakt'], kolorHex: '#204060' };
  for (const n of [undefined, 0, 1, 2, 3, 4, 10]) for (const which of ['war', 'ally', 'deal', 'all']) {
    const names = n === undefined ? undefined : NAMES.slice(0, n);
    out.push({
      ...base,
      warPartnerNames: which === 'war' || which === 'all' ? names : undefined,
      alliancePartnerNames: which === 'ally' || which === 'all' ? names : undefined,
      dealPartnerNames: which === 'deal' || which === 'all' ? (names ? [...names].reverse() : names) : undefined,
    });
  }
  out.push({ ...base, ownerId: undefined, warPartnerNames: ['X'] });
  out.push({ ...base, ownerId: 0, isCityState: true, tier: 0, warPartnerNames: [], alliancePartnerNames: [], dealPartnerNames: [] });
  return out;
}

export const PAYLOADS = [
  { actionId: '10' }, { actionId: '10', rodzaj: 'rozejm' }, { actionId: '10', rodzaj: 'inny' }, { actionId: '10', isGift: true, rodzaj: 'rozejm' },
  { actionId: '13', rodzaj: 'rozejm' }, { actionId: '3', rodzaj: 'rozejm' }, { actionId: '3', allianceKind: 'defensywny' }, { actionId: '12' },
  { actionId: '8' }, { actionId: '8', tributeMode: 'offer' }, { actionId: '14', isGift: true }, { actionId: '99' },
];

/** Wektory funkcji: każda pozycja = string (HTML/JSON) — porównanie web === port. */
export function vectors(api, input) {
  const { LH, DP, NM, TB } = api;
  const safe = (f) => { try { const v = f(); return typeof v === 'string' ? v : JSON.stringify(v); } catch (e) { return 'THROW:' + String(e && e.message); } };
  const out = {};
  out.agresorBadgeHtml = input.AGRESOR_N.map((n) => safe(() => DP.agresorBadgeHtml(n)));
  out.DIPLO_LIST_RELATION_SHOW_MAX = [safe(() => LH.DIPLO_LIST_RELATION_SHOW_MAX)];
  out.diploListEntryFromRelation = relationVariants().map((rel) => safe(() => api.entryFromRelation(rel)));
  out.proposalActionIdFromPayload = PAYLOADS.map((p) => safe(() => NM.proposalActionIdFromPayload(p)));
  out.dealDurationControlOptions = [];
  for (const hra of [false, true]) for (const rtm of ['once', 'per_turn']) for (const hq of [false, true]) for (const sm of [false, true]) {
    out.dealDurationControlOptions.push(safe(() => TB.dealDurationControlOptions(hra, rtm, hq, sm)));
  }
  out.dealDurationHtml = [];
  for (const turns of [1, 5, 15, 20, 21, 30, 31, 0, -3, 7.5]) for (const vis of [false, true]) for (const [mt, ai] of [[20, false], [30, false], [30, true], [21, true], [undefined, undefined]]) {
    out.dealDurationHtml.push(safe(() => TB.dealDurationHtml(turns, vis, 'Co ile <tur>', 'Opis & więcej', mt, ai)));
  }
  return out;
}

/** Konteksty modala koszyka (te same obiekty po obu stronach). */
export function ctxs(qtyKeys, techIds) {
  const techOpt = (ids) => ids.map((id, i) => ({ id, label: id, suggestedPrice: 20 + i * 5 }));
  const QTY = (keys, max) => keys.map((id, i) => ({ id, label: id, maxQty: max[i] ?? 50 }));
  return {
    pelny: {
      civName: 'Rzym <x>', relacjaTotal: 140, trustPnGainedThisTurn: 2, difficulty: 'hard', playerSkarbiec: 340.7,
      rivalOptions: [{ ownerId: 2, label: 'Egipt' }], giveTechOptions: techOpt(techIds.slice(0, 3)), receiveTechOptions: techOpt(techIds.slice(3, 5)),
      giveQuantityResourceOptions: QTY(qtyKeys.slice(0, 4), [120, 3, 2500, 7]), receiveQuantityResourceOptions: QTY(qtyKeys.slice(2, 6), [40, 9, 1234567, 0]),
      tradeFairnessPreview: (g, r) => ({ accepted: g >= r * 0.8, pwBalance: Math.round(g - r * 0.8) }),
      miastoOptions: [{ id: 'c7', label: 'Kartagina <x>', pn: 412 }, { id: 'c9', label: 'Utyka & co', pn: 0 }, { id: 'c11', label: 'Hippo', pn: 1250.6 }],
    },
    wojna: { civName: 'Egipt', relacjaTotal: 120, atWar: true, playerSkarbiec: 999, giveQuantityResourceOptions: QTY(qtyKeys.slice(0, 2), [5, 5]), miastoOptions: [{ id: 'c3', label: 'Teby', pn: NaN }, { id: 'c4', label: 'Memfis', pn: 300 }] },
    bezMiast: { civName: 'Asyria', relacjaTotal: 90, atWar: true, playerSkarbiec: 120, miastoOptions: [] },
  };
}

const ACTION = (id, label) => ({ id, label, enabled: true });

/**
 * Sceny (nazwa → funkcja renderująca do `document.body`). Każda scena zwraca log akcji (callbacki) — dopisywany do DOM.
 * `log` = tablica, do której callbacki dopisują wywołania. Scena zwraca funkcję sprzątania albo `{ cleanup, after }`,
 * gdzie `after` (np. „Zaproponuj”) wykonuje się PO zrzucie DOM/PNG — payload trafia do logu.
 */
export function scenes(api, C) {
  const { LH, DP, TB } = api;
  const log = [];
  const act = (name) => (...a) => { log.push(name + '(' + a.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(',') + ')'); };
  const click = (sel, idx = 0) => {
    const el = document.querySelectorAll(sel)[idx];
    log.push('klik ' + sel + '#' + idx + (el ? '' : ' BRAK'));
    el?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  };
  const setVal = (sel, v) => {
    const el = document.querySelector(sel);
    log.push('pole ' + sel + '=' + v + (el ? '' : ' BRAK'));
    if (!el) return;
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const basket = (mode, aid, cn, initial) => {
    api.setScenarioCtx(C[cn]);
    TB.showTradeBasketModal(mode, ACTION(aid, 'Akcja ' + esc(aid)), C[cn], act('onSubmit'), act('onCancel'), initial);
  };
  const MIASTO = { typ: 'miasto', id: 'c7', ilosc: 1, cityPn: 412, cityLabel: 'Kartagina <x>' };
  const QTY0 = { typ: 'surowiec_ilosc', id: api.qtyKeys[0], ilosc: 10 };
  const QTY2 = { typ: 'surowiec_ilosc', id: api.qtyKeys[2], ilosc: 15 };
  const S = {
    lista: () => {
      // Warianty „all” (wojny+sojusze+handel) dla n ∈ {brak, 0, 1, 2, 3, 4, 10} + 2 warianty jednej relacji (granica „+N”: 3 vs 4 nazwy).
      const rv = relationVariants();
      const rels = [...rv.filter((r, i) => r.ownerId !== undefined && i % 4 === 3), rv[16], rv[17]];
      const entries = rels.map((r, i) => ({ ...api.entryFromRelation({ ...r, ownerId: i + 1, civ: NAMES[i % NAMES.length] + ' ' + i }) }));
      const hud = LH.createDiploListHud({ getEntries: () => entries, onSelectEntry: act('onSelectEntry'), onFocusCapital: act('onFocusCapital'), onClose: act('onClose') });
      hud.show();
      return () => { hud.destroy(); };
    },
    panel: () => {
      const rels = [undefined, 0, 1, 3, 10, NaN, 2.7].map((n, i) => ({ ownerId: i + 1, civ: NAMES[i] + (i === 1 ? ' <b>' : ''), tier: i % 5, zaufanie: 10 * i, respekt: 5 * i, agresorPozostaleTury: n, contactEstablished: i % 2 === 0, layer: 'full' }));
      DP.showDiplomacyPanel({ getRelations: () => rels, getKnownWarsBetweenOthers: () => [{ civA: 'Rzym', civB: 'Kartagina' }], onOpenAudience: act('onOpenAudience') });
      return () => { DP.hideDiplomacyPanel(); };
    },
    rozejm: () => {
      basket('treaty', '10', 'pelny', { peaceKind: 'rozejm', truceTurns: 15 });
      click('.cdb-chip-truceturns[data-turns="5"]');
      return () => TB.hideTradeBasketModal();
    },
    'rozejm-wyslij': () => {
      basket('treaty', '10', 'wojna', undefined);
      click('.cdb-chip-peacekind[data-kind="rozejm"]');
      click('.cdb-chip-truceturns[data-turns="15"]');
      return { cleanup: () => TB.hideTradeBasketModal(), after: () => click('.cdb-submit') };
    },
    // Waluta w wojnie: rozejm = ta sama bramka co pokój (web `diplomacy-war-gates.ts:11`, `PEACE_CURRENCY_ACTION_IDS`).
    'rozejm-wojna-zloto': () => {
      basket('treaty', '10', 'wojna', { peaceKind: 'rozejm', truceTurns: 10, giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 40 }] });
      return { cleanup: () => TB.hideTradeBasketModal(), after: () => click('.cdb-submit') };
    },
    // Formularz „Dodaj” z typem 'miasto' (koszyk handlu dla akcji '10' → propozycja 'pokoj'): chipy bez miasta już w koszyku,
    // pole `data-extra=give-miasto` widoczne, dodanie pozycji (web `:1537-1543,1642-1665,1743-1747,2191-2198,2234-2240`).
    'handel10-miasto': () => {
      basket('trade', '10', 'pelny', { giveItems: [MIASTO] });
      click('.cdb-chip-typ[data-value="miasto"][data-side="give"]');
      click('.cdb-chip-miasto', 1);
      click('.cdb-add-btn[data-side="give"]');
      click('.cdb-chip-typ[data-value="miasto"][data-side="give"]');
      return { cleanup: () => TB.hideTradeBasketModal(), after: () => click('.cdb-submit') };
    },
    // Wycena NaN (`!(opt.pn >= 0)` → pozycja odrzucona).
    'handel10-miasto-nan': () => {
      basket('trade', '10', 'wojna', undefined);
      click('.cdb-chip-typ[data-value="miasto"][data-side="give"]');
      click('.cdb-add-btn[data-side="give"]');
      click('.cdb-chip-miasto', 1);
      click('.cdb-add-btn[data-side="give"]');
      return { cleanup: () => TB.hideTradeBasketModal(), after: () => click('.cdb-submit') };
    },
    'pokoj-miasto': () => {
      basket('treaty', '10', 'pelny', { giveItems: [MIASTO] });
      click('.cdb-city-pick', 1);
      return () => TB.hideTradeBasketModal();
    },
    'wasal-picker': () => {
      basket('treaty', '12', 'pelny', undefined);
      click('.cdb-city-pick', 0);
      return { cleanup: () => TB.hideTradeBasketModal(), after: () => click('.cdb-submit') };
    },
    'pokoj-bez-miast': () => {
      basket('treaty', '10', 'bezMiast', undefined);
      return () => TB.hideTradeBasketModal();
    },
    bezterminowo: () => {
      basket('trade', '14', 'pelny', { giveItems: [QTY0], receiveItems: [QTY2], resourceTradeMode: 'per_turn', turns: 30, exchangeDurationTurns: null });
      return { cleanup: () => TB.hideTradeBasketModal(), after: () => click('.cdb-submit') };
    },
    // „Bezterminowo” → wpisanie liczby tur w pole: wymiana znów terminowa (web `:2813-2817`).
    'bezterminowo-pole': () => {
      basket('trade', '14', 'pelny', { giveItems: [QTY0], receiveItems: [QTY2], resourceTradeMode: 'per_turn', turns: 10 });
      click('.cdb-duration-indefinite');
      setVal('.cdb-deal-turns', '12');
      return { cleanup: () => TB.hideTradeBasketModal(), after: () => click('.cdb-submit') };
    },
    'wymiana-30': () => {
      basket('trade', '14', 'pelny', { giveItems: [QTY0], receiveItems: [QTY2], resourceTradeMode: 'per_turn', turns: 10 });
      click('.cdb-chip-turn[data-turns="30"]');
      setVal('.cdb-deal-turns', '27');
      click('.cdb-qty-step[data-target="cdb-deal-turns"]', 0);
      return { cleanup: () => TB.hideTradeBasketModal(), after: () => click('.cdb-submit') };
    },
  };
  return { S, log };
}
