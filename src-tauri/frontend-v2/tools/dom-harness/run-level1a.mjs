#!/usr/bin/env node
/**
 * run-level1a.mjs — harness porównania DOM/wyników: 17 modułów poziomu 1 bez cyklu (P5.3,
 * `R-RUSTPORT-P5-3-PORT-LEVEL1A-Q1`) w frontend-v2 vs ten sam moduł z pinu web `edb8fb56`.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
 *   node tools/dom-harness/run-level1a.mjs --pin-dir <PIN_DIR> [--json <plik>]
 * EXIT 0 ⇔ 0 różnic (i wszystkie asercje v2 spełnione); 1 ⇔ ≥1 różnica; 2 ⇔ błąd harnessu.
 *
 * Metoda = `run.mjs` (P5.2): oba drzewa pakowane `esbuild` z tą samą emulacją Vite (`build.mjs`),
 * wspólny jsdom, zamrożony `Date`; strona v2 dostaje DTO zbudowane w harnessie z DANYCH i FUNKCJI
 * PINU (harness gra rolę „Rust”): `softPathBadgeLevel`/`armorPathBadgeLevel`/`veteranStarCount`,
 * `splitNegotiationDealPlayerSides`/`resourceDisplayLabel`, `orderTierUi` (pin UI), `categoryOf`,
 * `getCityFood`, `buildPostBattleSummary`, `armyStatusBadge` (pin UI). Wartości oblężenia
 * (`zuzycie`, `atrycjaNext`, `milicjaEst`, `playerCanStorm`) pin liczy WEWNĄTRZ panelu
 * (`siegeMapPanel.ts:219-223`, bez funkcji do wywołania) — harness odtwarza te wzory jako „Rust”.
 * Porównanie: kanoniczna serializacja całego `document.documentElement` (wszystkie atrybuty
 * posortowane, tekst dokładnie) albo równość JSON / sparsowanego HTML wartości zwracanych.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { bundle } from './build.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
const JSON_OUT = argOf('--json');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-level1a.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PIN_SRC = resolve(PIN_DIR, 'gra/src');
const PIN_DATA = resolve(PIN_DIR, 'gra/data');

const LEVEL1A = [
  'unitCardStatus.ts', 'diplomacyDealDisplay.ts', 'orderPanel.ts', 'unitRecruitCard.ts', 'cityAttackChoice.ts',
  'postBattleSummary.ts', 'siegeMapPanel.ts', 'diploUiSkin.ts', 'icons/iconRegistry.ts', 'mapUnitHudSkin.ts',
  'armyMergePanel.ts', 'icons/wikiBookIcon.ts', 'powerOverlayHud.ts', 'armyListHud.ts', 'bottomBarHud.ts',
  'cityListHud.ts', 'empireOverlayHud.ts',
];
/** Moduły pinu używane przez harness jako „Rust”. */
const PIN_REF = [
  'units/setup.ts', 'game/visibility.ts', 'game/victory.ts', 'map/mapGenProgress.ts', 'game/power-options.ts',
  'game/unit-building-bonuses.ts', 'game/veteran.ts', 'game/diplomacy-display.ts', 'game/turn-economy.ts',
  'game/battle-summary.ts', 'ui/sideListHud.css.ts',
];
const V2_CTRL = ['controller/staticCatalog.ts'];

// ─── jsdom ───────────────────────────────────────────────────────────────────
const jsdomErrors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => jsdomErrors.push(String(e?.message ?? e).split('\n')[0]));
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const W = dom.window;
const GLOBALS = [
  'window', 'document', 'Node', 'Element', 'HTMLElement', 'HTMLDivElement', 'HTMLCanvasElement', 'HTMLButtonElement',
  'HTMLParagraphElement', 'HTMLPreElement', 'HTMLInputElement', 'HTMLSpanElement', 'HTMLImageElement', 'Event',
  'MouseEvent', 'KeyboardEvent', 'CustomEvent', 'PointerEvent', 'getComputedStyle', 'requestAnimationFrame',
  'cancelAnimationFrame', 'localStorage', 'sessionStorage', 'location', 'DOMParser',
];
for (const k of GLOBALS) {
  const v = k === 'window' ? W : W[k];
  if (v === undefined) continue;
  Object.defineProperty(globalThis, k, { value: typeof v === 'function' && k !== 'window' && /^[a-z]/.test(k) ? v.bind(W) : v, configurable: true, writable: true });
}
const FIXED = Date.UTC(2026, 9, 22, 10, 30, 15);
const RealDate = Date;
class FrozenDate extends RealDate {
  constructor(...a) { if (a.length === 0) super(FIXED); else super(...a); }
  static now() { return FIXED; }
}
globalThis.Date = FrozenDate;
W.Date = FrozenDate;
const origWarn = console.warn;
console.warn = () => {};

const tmp = mkdtempSync(join(tmpdir(), 'p53-harness-'));
const pinOut = join(tmp, 'pin');
const v2Out = join(tmp, 'v2');
let exitCode = 0;
try {
  await bundle([...LEVEL1A.map((m) => join(PIN_SRC, 'ui', m)), ...PIN_REF.map((m) => join(PIN_SRC, m))], pinOut);
  await bundle([...V2_CTRL.map((m) => join(V2_ROOT, 'src', m)), ...LEVEL1A.map((m) => join(V2_ROOT, 'src/ui', m))], v2Out);
  const imp = (base, rel) => import(pathToFileURL(join(base, rel.replace(/\.ts$/, '.js'))).href);

  const pin = {};
  for (const m of PIN_REF) pin[m] = await imp(pinOut, m);
  for (const m of LEVEL1A) pin['ui/' + m] = await imp(pinOut, 'ui/' + m);

  const json = (f) => JSON.parse(readFileSync(join(PIN_DATA, f), 'utf8'));
  const unitsJson = json('units.json');
  const civsJson = json('civs.json');
  const { categoryOf } = pin['units/setup.ts'];

  // „Rust”: StaticCatalogDto z danych i funkcji pinu (jak run.mjs).
  const unitCategory = {};
  const unitCategoryNameOnly = {};
  for (const u of unitsJson) {
    unitCategory[u.Jednostka] = categoryOf(u.Jednostka ?? '', u['Rola (linia)'] ?? '', u['Super-jednostka'] === 'TAK', u['Typ']);
    unitCategoryNameOnly[u.Jednostka] = categoryOf(u.Jednostka ?? '', '', false, undefined);
  }
  const catalog = {
    contentHash: 'harness-pin-edb8fb56',
    buildings: json('buildings.json'), units: unitsJson, tech: json('tech.json'), terrainImprovements: {}, wonders: [], counters: {},
    civs: civsJson, cityNamesPools: {}, powerParams: {}, uiParams: json('ui-params.json'), wiki: {},
    constants: {
      fogExploredBrightness: pin['game/visibility.ts'].FOG_EXPLORED_BRIGHTNESS,
      progDominacjiPower: pin['game/victory.ts'].PROG_DOMINACJI_POWER,
      mapGenPhaseTotal: pin['map/mapGenProgress.ts'].MAP_GEN_PHASE_TOTAL,
      mapGenPhaseLabels: { ...pin['map/mapGenProgress.ts'].MAP_GEN_PHASE_LABELS },
    },
    labels: { powerHudLabelPl: pin['game/power-options.ts'].loadPowerOpcje().hudEtykietaPl },
    unitCategory, unitCategoryNameOnly,
  };
  const v2 = {};
  for (const m of V2_CTRL) v2[m] = await imp(v2Out, m);
  v2['controller/staticCatalog.ts'].installStaticCatalog(catalog);
  for (const m of LEVEL1A) v2['ui/' + m] = await imp(v2Out, 'ui/' + m);

  // ─── porównanie ────────────────────────────────────────────────────────────
  const results = new Map();
  const R = (mod) => {
    if (!results.has(mod)) results.set(mod, { module: mod, cases: 0, diffs: 0, examples: [], notMeasured: [] });
    return results.get(mod);
  };
  function ser(node) {
    if (node.nodeType === 3) return JSON.stringify(node.data);
    if (node.nodeType === 8) return `<!--${node.data}-->`;
    if (node.nodeType !== 1) return '';
    const tag = node.tagName.toLowerCase();
    const attrs = [...node.attributes].map((a) => `${a.name}=${JSON.stringify(a.value)}`).sort().join(' ');
    const kids = tag === 'template' ? node.content.childNodes : node.childNodes;
    return `<${tag}${attrs ? ' ' + attrs : ''}>${[...kids].map(ser).join('')}</${tag}>`;
  }
  const htmlSer = (s) => {
    const t = document.createElement('template');
    t.innerHTML = s;
    return [...t.content.childNodes].map(ser).join('');
  };
  const canon = (v) => (typeof v === 'string' && /<[a-zA-Z!]/.test(v) ? 'HTML:' + htmlSer(v) : 'JSON:' + JSON.stringify(v));
  function record(mod, label, a, b) {
    const r = R(mod);
    r.cases++;
    if (a !== b) {
      r.diffs++;
      if (r.examples.length < 5) {
        let i = 0;
        while (i < a.length && a[i] === b[i]) i++;
        r.examples.push({ label, at: i, pin: a.slice(Math.max(0, i - 60), i + 120), v2: b.slice(Math.max(0, i - 60), i + 120) });
      }
    }
  }
  const cmpVal = (mod, label, a, b) => record(mod, label, canon(a), canon(b));
  function resetDoc() {
    for (const n of [...document.documentElement.childNodes]) {
      if (n !== document.head && n !== document.body) n.remove();
    }
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  }
  const snapshot = () => ser(document.documentElement);
  /** Log akcji (wywołania callbacków) dopisywany do DOM — porównywany razem z drzewem. */
  let actionLog = [];
  const act = (name) => (...a) => { actionLog.push(name + '(' + a.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(',') + ')'); };
  const dumpActions = () => {
    const pre = document.createElement('pre');
    pre.setAttribute('data-action-log', '');
    pre.textContent = actionLog.join('\n');
    document.body.appendChild(pre);
  };
  /**
   * `persist` (selektor): korzeń panelu trzymany przez moduł między wywołaniami (np. `siegeMapPanel`,
   * `orderPanel` tworzą go raz i potem tylko ukrywają) — po `resetDoc` wraca do `body` swojej strony,
   * jak w grze (inaczej moduł renderowałby do odłączonego węzła, a porównanie byłoby puste).
   */
  const parked = new Map();
  async function domCase(mod, label, runPin, runV2, { persist } = {}) {
    const side = async (name, run) => {
      resetDoc();
      localStorage.clear();
      actionLog = [];
      const keep = persist ? parked.get(name + persist) : null;
      if (keep) document.body.appendChild(keep);
      await run();
      if (persist) {
        const n = document.querySelector(persist);
        if (n) parked.set(name + persist, n);
      }
      dumpActions();
      return snapshot();
    };
    const a = await side('pin', runPin);
    const b = await side('v2', runV2);
    resetDoc();
    record(mod, label, a, b);
    // Kontrola niepustości: czy v2 zostawił w <body> coś poza logiem akcji (stan `hide` bywa pusty celowo).
    const r = R(mod);
    r.domCases = (r.domCases ?? 0) + 1;
    if (!/<body>(?:(?!<pre data-action-log)<[a-z])/.test(b.replace(/<body><\/body>/, '<body>'))) r.domEmpty = (r.domEmpty ?? 0) + 1;
    return b;
  }
  const notMeasured = (mod, why) => R(mod).notMeasured.push(why);
  const assertV2 = (mod, checks) => {
    const r = R(mod);
    r.v2Assertions = [...(r.v2Assertions ?? []), ...checks.map(([k, ok]) => ({ check: k, ok: !!ok }))];
    r.v2AssertionsFailed = r.v2Assertions.filter((c) => !c.ok).length;
  };
  const key = (k) => document.dispatchEvent(new W.KeyboardEvent('keydown', { key: k, bubbles: true }));
  const click = (sel) => document.querySelector(sel)?.dispatchEvent(new W.MouseEvent('click', { bubbles: true }));
  const escFn = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // 1. unitCardStatus.ts
  {
    const M = 'unitCardStatus.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const UB = pin['game/unit-building-bonuses.ts'];
    const VT = pin['game/veteran.ts'];
    // „Rust”: UnitCardDto.badges z funkcji pinu.
    const badges = (inp) => ({
      softPath: UB.softPathBadgeLevel({ parametryBonusProc: inp.parametryPathPp ?? 0 }),
      armorPath: UB.armorPathBadgeLevel({ pancerzBonusProc: inp.pancerzPathPp ?? 0 }),
      veteranStars: VT.veteranStarCount(inp.veteranProgress ?? null),
    });
    const PP = [undefined, 0, 5, 16, 17, 33, 34, 50, -3, Number.NaN];
    const AP = [undefined, 0, 15, 16, 30, 31, 45];
    const VP = [undefined, null, { battlesSurvived: 0 }, { battlesSurvived: 1 }, { battlesSurvived: 2 }, { battlesSurvived: 3 }, { battlesSurvived: 9 }, { battlesSurvived: 2.7 }];
    const extras = [
      {},
      { veteranBadgeLabel: 'Weteran <II>', veteranStarsTooltip: '★★ 2 wygrane', veteranExperienceLine: 'Doświadczenie: 2/3', veteranPanelExplanation: 'Premia "+15%" & więcej' },
      { veteranBadgeLabel: 'Elita', inGarnizon: true, sentry: true, ufortyfikowanyWPolu: true, oblegaCityName: 'Rzym <&>' },
      { glodWojska: true, glodWojskaStatMult: 0.75, glodWojskaHpFrac: 0.05, glodWojskaTurDoAtrycji: 3, poziomTrudnosciLabel: 'trudny',
        zlotoDeficyt: true, zlotoDeficytStatMult: 0.9, zlotoDeficytHpFrac: 0.1, zlotoDeficytAtrycjaAktywna: true },
      { glodWojska: true, glodWojskaStatMult: 1, glodWojskaHpFrac: 0, zlotoDeficyt: true, zlotoDeficytTurDoAtrycji: 22, zlotoDeficytHpFrac: 0.025 },
      { glodWojska: true, glodWojskaTurDoAtrycji: 1, glodWojskaHpFrac: 0.3, glodWojskaStatMult: 0.5, zlotoDeficyt: true, zlotoDeficytTurDoAtrycji: 13, zlotoDeficytHpFrac: 0.2 },
    ];
    let n = 0;
    for (const pp of PP) for (const ap of AP) for (const vp of VP) {
      const ex = extras[n++ % extras.length];
      const inp = { parametryPathPp: pp, pancerzPathPp: ap, veteranProgress: vp, ...ex, esc: escFn };
      const vin = { ...inp, badges: badges(inp) };
      const lbl = `(${pp},${ap},${JSON.stringify(vp)},#${n % extras.length})`;
      cmpVal(M, 'icons' + lbl, P.buildPathLevelIconsRowHtml(inp), V.buildPathLevelIconsRowHtml(vin));
      cmpVal(M, 'pathRow' + lbl, P.buildPathStatusRowHtml(inp), V.buildPathStatusRowHtml(vin));
      cmpVal(M, 'hasChips' + lbl, P.pathStatusRowHasChips(inp), V.pathStatusRowHasChips(vin));
      cmpVal(M, 'section' + lbl, P.buildUnitCardStatusSectionHtml(inp), V.buildUnitCardStatusSectionHtml(vin));
    }
    for (const ex of extras) {
      const inp = { ...ex, esc: escFn };
      cmpVal(M, 'extra:' + JSON.stringify(ex), P.buildUnitExtraStatusLinesHtml(inp), V.buildUnitExtraStatusLinesHtml({ ...inp, badges: badges(inp) }));
      cmpVal(M, 'vetEdu:' + JSON.stringify(ex), P.buildUnitVeteranEducationHtml(inp), V.buildUnitVeteranEducationHtml({ ...inp, badges: badges(inp) }));
      cmpVal(M, 'pickSuffering:' + JSON.stringify(ex), P.pickUnitSufferingFields(ex), V.pickUnitSufferingFields(ex));
    }
    for (const [e, b] of [[5, 5], [5.04, 5], [5.06, 5], [7.5, 6], [12, 10.25], [0, 0]]) cmpVal(M, `statValue(${e},${b})`, P.unitCardStatValueHtml(e, b), V.unitCardStatValueHtml(e, b));
    const combat = { atakBase: 10, atakEffective: 12.5, obronaBase: 8, obronaEffective: 8, hpMaxBase: 20, hpMaxEffective: 22, pancerzBase: 2, pancerzEffective: 3,
      weaponDamageBase: 1, weaponDamageEffective: 1, piercingBase: 0, piercingEffective: 0, chargeBonusBase: 0, chargeBonusEffective: 0, missileAttackBase: 0, missileAttackEffective: 0 };
    cmpVal(M, 'atkDef', P.unitCardAtkDefLineHtml(combat), V.unitCardAtkDefLineHtml(combat));
    for (const lv of [0, 1, 2, 3]) cmpVal(M, `chip(${lv})`, P.pathBadgeChipHtml('🛡', 'Koszary <x>', lv, 20, escFn), V.pathBadgeChipHtml('🛡', 'Koszary <x>', lv, 20, escFn));
    cmpVal(M, 'CSS', P.UNIT_CARD_STATUS_CSS, V.UNIT_CARD_STATUS_CSS);
    cmpVal(M, 'PATH_BADGE_COLOR', P.PATH_BADGE_COLOR, V.PATH_BADGE_COLOR);
  }

  // 2. diplomacyDealDisplay.ts
  {
    const M = 'diplomacyDealDisplay.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const DD = pin['game/diplomacy-display.ts'];
    const view = (it) => ({ ...it, label: DD.resourceDisplayLabel(it.id) });
    // „Rust”: NegotiationDealSidesDto = splitNegotiationDealPlayerSides + kontekst z payloadu.
    const sides = (payload, incoming) => {
      const s = DD.splitNegotiationDealPlayerSides(payload, incoming);
      if (!s) return null;
      return {
        weOffer: s.weOffer.map(view), theyOffer: s.theyOffer.map(view), schedule: s.schedule ?? null,
        perTurn: payload.resourceTradeMode === 'per_turn', turns: payload.turns ?? null,
      };
    };
    const items = [
      { typ: 'zloto', id: 'zloto', ilosc: 40 },
      { typ: 'surowiec_ilosc', id: 'drewno', ilosc: 3 },
      { typ: 'surowiec_ilosc', id: 'Zelazo' },
      { typ: 'surowiec_ilosc', id: 'konopie <x>', ilosc: 2 },
      { typ: 'surowiec_boolean', id: 'kon' },
      { typ: 'zloze', id: 'Złoże <soli>' },
      { typ: 'praca', id: 'praca', ilosc: 12 },
      { typ: 'zywnosc', id: 'zywnosc' },
      { typ: 'tech', id: 'Brązownictwo' },
      { typ: 'jednostka', id: 'Łucznik & co' },
    ];
    const payloads = [
      {},
      { goldOnce: 75 },
      { goldOnce: 0 },
      { giveItems: [items[0], items[1]], receiveItems: [items[4]] },
      { giveItems: items.slice(0, 5), receiveItems: items.slice(5), resourceTradeMode: 'per_turn', turns: 10 },
      { giveItems: [items[1], items[2]], receiveItems: [], resourceTradeMode: 'per_turn' },
      { giveItems: [], receiveItems: [items[6], items[7], items[8]], resourceTradeMode: 'once', turns: 5 },
      { giveItems: [items[3], items[9]], receiveItems: [items[0]], resourceTradeMode: 'per_turn', turns: 0 },
    ];
    for (const [pi, p] of payloads.entries()) for (const incoming of [false, true]) {
      const s = sides(p, incoming);
      const L = `#${pi},in=${incoming}`;
      cmpVal(M, 'deal' + L, P.renderNegotiationDealHtml(p, { incoming }), V.renderNegotiationDealHtml(s));
      for (const focus of ['we', 'they']) {
        for (const [tl, tpw, tbase] of [[undefined], ['Traktat handlowy', 30, 25], ['Sojusz <x>', 0], ['', 5], ['Pakt', 12, 12]]) {
          cmpVal(M, `tableSide${L},${focus},${tl},${tpw},${tbase}`, P.renderNegotiationTableDealSideHtml(p, focus, incoming, tl, tpw, tbase), V.renderNegotiationTableDealSideHtml(s, focus, tl, tpw, tbase));
          cmpVal(M, `hasContent${L},${focus},${tl}`, P.negotiationTableDealSideHasContent(p, focus, incoming, tl), V.negotiationTableDealSideHasContent(s, focus, tl));
        }
        for (const ta of [undefined, { label: 'Traktat', pw: 20, basePw: 10 }]) {
          cmpVal(M, `sideOnly${L},${focus},${!!ta}`, P.renderNegotiationDealSideOnlyHtml(p, focus, incoming, ta), V.renderNegotiationDealSideOnlyHtml(s, focus, ta));
        }
        for (const sc of [undefined, true, false]) {
          cmpVal(M, `oneSide${L},${focus},${sc}`, P.renderNegotiationDealOneSideHtml(p, focus, { incoming, showContext: sc }), V.renderNegotiationDealOneSideHtml(s, focus, { showContext: sc }));
        }
      }
    }
    for (const mode of [undefined, 'once', 'per_turn']) for (const turns of [undefined, 0, 7]) {
      cmpVal(M, `tradePreview(${mode},${turns})`, P.renderTradeBasketDealPreviewHtml(items.slice(0, 4), items.slice(4), { resourceTradeMode: mode, turns }),
        V.renderTradeBasketDealPreviewHtml(items.slice(0, 4).map(view), items.slice(4).map(view), { resourceTradeMode: mode, turns }));
    }
    for (const it of items) for (const ctx of [{}, { perTurn: true }, { perTurn: true, turns: 4 }, { perTurn: false, turns: 4 }]) {
      cmpVal(M, `item(${it.typ},${it.id},${JSON.stringify(ctx)})`, P.renderBasketItemValueHtml(it, ctx), V.renderBasketItemValueHtml(view(it), ctx));
    }
    cmpVal(M, 'list(empty)', P.renderBasketListHtml([], {}), V.renderBasketListHtml([], {}));
    cmpVal(M, 'list(undefined)', P.renderBasketListHtml(undefined, {}), V.renderBasketListHtml(undefined, {}));
    for (const [l, pw, b] of [['A<b>', undefined, undefined], ['A', 10, undefined], ['A', 10, 10], ['A', 10, 7], ['A', 0, 7]]) {
      cmpVal(M, `treatyItem(${l},${pw},${b})`, P.renderTreatyDealItemHtml(l, pw, b), V.renderTreatyDealItemHtml(l, pw, b));
    }
  }

  // 3. orderPanel.ts
  {
    const M = 'orderPanel.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const lines = (n, sgn) => Array.from({ length: n }, (_, i) => ({ id: 'l' + i, label: 'Linia <' + i + '>', value: sgn * (i + 1) * (i % 2 ? -1 : 1) }));
    const base = { szczescie: 7, porzadek: 5, progT1: 8, progT2: 4 };
    const states = [
      { ...base },
      { ...base, szczescie: 1, porzadek: 1 },
      { ...base, szczescie: 3, porzadek: 2 },
      { ...base, szczescie: 20, porzadek: 9, bandLabel: 'Ład' },
      { ...base, bunt: true },
      { ...base, szPct: 80, prawPct: 70, porPct: 75, szLines: lines(3, 1), prawLines: lines(8, -1), bandLabel: 'Ład' },
      { ...base, szPct: 50, prawPct: 40, porPct: 45 },
      { ...base, szPct: 20, prawPct: 30, porPct: 25, bandLabel: 'Bunt' },
      { ...base, szPct: 5, prawPct: 5, porPct: 5 },
      { ...base, szPct: 90, prawPct: 90, porPct: 90, revoltWarning: true, revoltGraceRemaining: 2 },
      { ...base, szPct: 90, prawPct: 90, porPct: 90, revoltWarning: true, revoltGraceRemaining: 0 },
      { ...base, szPct: 90, prawPct: 90, porPct: 90, rebelState: true },
      { ...base, szPct: 69.6, prawPct: 70.4, porPct: 70 },
      { ...base, szPct: 9.9, prawPct: 10, porPct: 10, szLines: [], prawLines: lines(6, 1) },
    ];
    const optsList = [undefined, { isPlaceholder: true }, { cssPrefix: 'cp-', skipTitle: true }, { skipLines: true, skipNote: true }];
    // „Rust”: tierUi = pin orderTierUi.
    const dto = (s) => ({ ...s, tierUi: P.orderTierUi(s) });
    for (const [i, s] of states.entries()) {
      cmpVal(M, `tier#${i}`, P.orderTierUi(s), V.orderTierUi(dto(s)));
      for (const [j, o] of optsList.entries()) cmpVal(M, `section#${i}.${j}`, P.buildOrderSectionHtml(s, o), V.buildOrderSectionHtml(dto(s), o));
    }
    const o1 = await domCase(M, 'showOrderPanel(placeholder)', () => { P.showOrderPanel('c1', {}); }, () => { V.showOrderPanel('c1', {}); }, { persist: '.civ-order' });
    const o2 = await domCase(M, 'showOrderPanel(live)+refresh+hide', () => {
      P.showOrderPanel('c2', { getOrderState: () => states[5] }); P.refreshOrderPanel(); P.hideOrderPanel(); P.showOrderPanel('c3', { getOrderState: () => states[7] });
    }, () => {
      V.showOrderPanel('c2', { getOrderState: () => dto(states[5]) }); V.refreshOrderPanel(); V.hideOrderPanel(); V.showOrderPanel('c3', { getOrderState: () => dto(states[7]) });
    }, { persist: '.civ-order' });
    const o3 = await domCase(M, 'hideOrderPanel', () => { P.hideOrderPanel(); }, () => { V.hideOrderPanel(); }, { persist: '.civ-order' });
    // Kontrola niepustości: panel porządku obecny w DOM v2 we wszystkich trzech przypadkach
    // (placeholder → „szacunek”, live → „Bunt” ze stanu #7, po hide → display:none).
    assertV2(M, [
      ['placeholder w DOM (szacunek, Napięcie)', o1.includes('class="civ-order"') && o1.includes('"szacunek"') && o1.includes('Napięcie')],
      ['live w DOM (Bunt)', o2.includes('class="civ-order"') && o2.includes('Bunt')],
      ['hide → display:none', /class="civ-order" style="display: none;"/.test(o3)],
    ]);
  }

  // 4. unitRecruitCard.ts
  {
    const M = 'unitRecruitCard.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    cmpVal(M, 'CSS', P.UNIT_RECRUIT_CARD_CSS, V.UNIT_RECRUIT_CARD_CSS);
    const variants = [
      { skarb: undefined, canPurchase: true },
      { skarb: 1000000, canPurchase: true, mpCost: 1000, mpCostLabel: '1 tys.', manpowerAvailable: 123456, manpowerRequired: 1500, maxQuantity: 4 },
      { skarb: 0, canPurchase: true, mpCost: 0, mpCostLabel: '0', manpowerAvailable: 999 },
      { skarb: 50, canPurchase: false, manpowerAvailable: 2500000, manpowerRequired: 12345678, manpowerMissingLabel: 'Brak rekrutów', stockMissingLabel: 'Brak Brązu', stockChipsHtml: '<span class="chip">2 Brąz</span>', resourceUpkeepChipsHtml: '<span class="chip">1 Drewno/t</span>' },
      { skarb: 50, canPurchase: false },
      { skarb: 999, canPurchase: true, manpowerAvailable: Number.NaN, maxQuantity: 2.9 },
      { skarb: 999, canPurchase: true, manpowerAvailable: 99999.6, manpowerRequired: 100000, maxQuantity: Number.POSITIVE_INFINITY },
    ];
    let k = 0;
    for (const u of unitsJson) {
      const v = variants[k++ % variants.length];
      const koszt = 30 + (k % 5) * 20;
      const item = { kind: 'unit', id: u.Jednostka, nazwa: u.Jednostka, koszt };
      const itemDto = { kind: 'unit', id: u.Jednostka, label: u.Jednostka, koszt, postep: 0, etaTurns: null, stockCost: {}, stockMissing: {} };
      const common = { ...v, treasuryIconHtml: '<i class="tr"></i>', onRecruit: act('onRecruit') };
      await domCase(M, `card(${u.Jednostka},#${k % variants.length})`,
        () => { document.body.appendChild(P.buildUnitRecruitCard({ ...common, udef: u, item, data: {} })); },
        () => { document.body.appendChild(V.buildUnitRecruitCard({ ...common, udef: u, item: itemDto, data: catalog, affordable: v.skarb === undefined || v.skarb >= koszt })); });
    }
    // Interakcja: + / + / − / wpis / Rekrutuj (wartości przycisków i log akcji w DOM).
    const u0 = unitsJson[3];
    for (const [i, v] of [variants[1], variants[2], variants[0]].entries()) {
      const koszt = 40;
      const steps = (S, opts) => {
        document.body.appendChild(S.buildUnitRecruitCard(opts));
        const q = (s) => document.querySelector(s);
        q('[data-recruit-quantity-action="increase"]').click();
        q('[data-recruit-quantity-action="increase"]').click();
        q('[data-recruit-quantity-action="decrease"]').click();
        const inp = q('.unit-recruit-quantity-input');
        inp.value = '3';
        inp.dispatchEvent(new W.Event('input'));
        q('.unit-recruit-submit').click();
        const pre = document.createElement('pre');
        pre.textContent = [...document.querySelectorAll('button,input')].map((b) => `${b.className}:${b.disabled}:${b.title}:${b.value ?? ''}`).join('\n');
        document.body.appendChild(pre);
      };
      await domCase(M, `interakcja#${i}`,
        () => steps(P, { ...v, treasuryIconHtml: '¤', onRecruit: act('onRecruit'), udef: u0, item: { kind: 'unit', id: u0.Jednostka, nazwa: u0.Jednostka, koszt }, data: {} }),
        () => steps(V, { ...v, treasuryIconHtml: '¤', onRecruit: act('onRecruit'), udef: u0, item: { kind: 'unit', id: u0.Jednostka, label: u0.Jednostka, koszt, postep: 0, etaTurns: null, stockCost: {}, stockMissing: {} }, data: catalog, affordable: v.skarb === undefined || v.skarb >= koszt }));
    }
  }

  // 5. cityAttackChoice.ts + 7. siegeMapPanel.ts — wspólne konteksty.
  const mkCity = (o) => ({ id: 'c-' + (o.name ?? 'x'), name: 'Miasto', ownerId: 1, population: 4, magazynZywnosci: 12, q: 3, r: 4, ...o });
  const ctxs = [
    { tryb: 'oblezenie', city: mkCity({ name: 'Rzym', maMur: true, garnizon: 3 }), atakujacy: { id: 'u1', typeId: 'Wojownik', ownerId: 0 }, garnizonUnit: { id: 'g1', typeId: 'Łucznik', ownerId: 1 }, oblegajacyOwnerId: 0 },
    { tryb: 'oblezenie', city: mkCity({ name: 'Teby <&>', garnizon: 0, population: 0, magazynZywnosci: { aktualny: 7.5 } }), atakujacy: { id: 'u2', typeId: 'Rydwan <x>', ownerId: 0 }, garnizonUnit: null, oblegajacyOwnerId: 0 },
    { tryb: 'zdobycie_z_marszu', city: mkCity({ name: 'Ur', garnizon: undefined, population: 17, magazynZywnosci: -4, siegeCapitulationPending: true, siegeMachines: { queue: ['taran', 'wieza'], ready: ['wieza'], buildProgress: 0.46 } }), atakujacy: { id: 'u3', typeId: 'Taran', ownerId: 2 }, garnizonUnit: { id: 'g3', typeId: 'Milicja', ownerId: 1 }, oblegajacyOwnerId: 2 },
    { tryb: 'oblezenie', city: mkCity({ name: 'Sparta', maMur: true, garnizon: 40, population: 12, magazynZywnosci: undefined, siegeMachines: { queue: [], ready: ['taran'], buildProgress: 0 } }), atakujacy: { id: 'u4', typeId: 'Hoplita', ownerId: 0 }, garnizonUnit: null, oblegajacyOwnerId: 0 },
  ];
  {
    const M = 'cityAttackChoice.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    for (const [i, c] of ctxs.entries()) {
      for (const k of [null, '1', '2', 'Escape-cancel']) {
        const run = (S) => {
          S.showCityAttackChoice(c, { onSiege: act('onSiege'), onStorm: act('onStorm'), onCancel: act('onCancel') });
          const open = S.isCityAttackChoiceOpen();
          if (k === 'Escape-cancel') click('[data-act="cancel"]');
          else if (k) key(k);
          actionLog.push('open=' + open + ' after=' + S.isCityAttackChoiceOpen());
        };
        await domCase(M, `show#${i}.${k}`, () => run(P), () => run(V));
        P.hideCityAttackChoice(); V.hideCityAttackChoice();
      }
    }
  }

  // 6. postBattleSummary.ts
  {
    const M = 'postBattleSummary.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const BS = pin['game/battle-summary.ts'];
    const snaps = (pfx, kinds) => kinds.map((k, i) => ({ id: pfx + i, typeId: 'Jedn ' + pfx + i, kategoria: k, hp: 20 - i * 3, maxHp: 20 }));
    const hpMap = { a0: 20, a1: 5, a2: null, a3: 0, d0: 3.6, d1: null, d2: 16, d3: 12 };
    const inputs = [
      { winner: 'atakujacy', atkLabel: 'Grecy', defLabel: 'Persowie', atkCivLabel: 'Grecy', defCivLabel: 'Persowie', atkCivIconId: 'grecy', defCivIconId: 'persowie', atkEra: 2, defEra: 1, teren: 'Wzgórza', placeLabel: 'pod Maratonem', mode: 'manual',
        atkBefore: snaps('a', ['Kawaleria', 'Łucznicy', 'Machina oblężnicza', 'Piechota']), defBefore: snaps('d', ['konnica', 'dystansowa', 'Katapulta', 'Wojownik']), playerSide: 'atk' },
      { winner: 'obronca', atkLabel: 'Hoplita', defLabel: 'Barbarzyńcy', atkIsBarbarian: false, defIsBarbarian: true, mode: 'auto', atkBefore: snaps('a', ['Piechota']), defBefore: snaps('d', ['Piechota', 'mur']), playerSide: 'def' },
      { winner: 'remis', atkLabel: 'Ur', defLabel: 'Ur', atkCivLabel: 'ur', defCivLabel: 'Teby', defIsCityState: true, defCivIconId: 'egipt', mode: 'szturm', atkBefore: [], defBefore: snaps('d', ['jezdni']) },
      { winner: 'atakujacy', atkLabel: 'Wódz', defLabel: 'Obrońca', mode: 'auto', atkBefore: snaps('a', ['Piechota', 'Piechota']), defBefore: snaps('d', ['Piechota']), atkCivIconId: 'nieznana', atkEra: 3 },
    ];
    const optsList = [undefined, { continueLabel: 'Dalej <x>', zIndex: '999', statusHeading: 'Wynik szturmu' }];
    for (const [i, inp] of inputs.entries()) {
      const data = BS.buildPostBattleSummary({ ...inp, lookupHp: (id) => (id in hpMap ? hpMap[id] : null) });
      if (i === 0) data.lootNote = '+16 Pieniądz, +2 Brąz';
      for (const [j, o] of optsList.entries()) for (const k of [null, 'Enter', 'click']) {
        const run = (S) => {
          S.showPostBattleSummary(data, act('onContinue'), o);
          const open = S.isPostBattleSummaryOpen();
          if (k === 'Enter') key('Enter');
          else if (k === 'click') document.querySelector('footer button')?.click();
          actionLog.push('open=' + open + ' after=' + S.isPostBattleSummaryOpen());
        };
        await domCase(M, `show#${i}.${j}.${k}`, () => run(P), () => run(V));
        P.hidePostBattleSummary(); V.hidePostBattleSummary();
      }
    }
    // Hak testowy okna: obie strony piszą do tego samego `window`; v2 importowany PO pinie, więc hak = v2.
    // v2 celowo bez `build` (pin `buildPostBattleSummary` = reguła → Rust); reszta kluczy jak pin `:594-601`.
    const hook = W.__postBattleSummaryTestDebug ?? {};
    assertV2(M, [
      ['hak okna = v2 (show === V.showPostBattleSummary)', hook.show === V.showPostBattleSummary],
      ['klucze haka = pin bez `build`', JSON.stringify(Object.keys(hook)) === JSON.stringify(['show', 'hide', 'civIconSvg', 'brandIconSvg', 'leaderPortraitUrl', 'commanderFallbackSvg'])],
    ]);
  }

  // 7. siegeMapPanel.ts
  {
    const M = 'siegeMapPanel.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const TE = pin['game/turn-economy.ts'];
    // „Rust”: SiegePanelDto. `food` = pin getCityFood; pozostałe = wzory pina `siegeMapPanel.ts:218-224`.
    const panel = (ctx) => {
      const city = ctx.city;
      const garnizon = city.garnizon ?? 0;
      return {
        ctx,
        city: { id: 0, owner: city.ownerId, q: city.q, r: city.r, name: city.name, mapLabel: city.name, population: city.population, isCapital: false, isMine: false },
        food: TE.getCityFood(city),
        garnizon,
        zuzycie: city.population + garnizon,
        atrycjaNext: garnizon > 0 ? Math.max(1, Math.floor(garnizon * 0.08)) : 0,
        milicjaEst: garnizon <= 0 ? 0 : Math.max(1, Math.floor((city.population ?? 0) * 0.2)),
        playerCanStorm: ctx.oblegajacyOwnerId === 0,
        machines: city.siegeMachines ?? { queue: [], ready: [], buildProgress: 0 },
      };
    };
    const actionsFor = (withQueue, withIsMe) => ({
      onBesiege: act('onBesiege'), onStorm: (c) => act('onStorm')(c.city.id), onRetreat: act('onRetreat'),
      ...(withQueue ? { onQueueMachine: act('onQueueMachine') } : {}),
      ...(withIsMe ? { isMe: (o) => o === 2 } : {}),
    });
    let nonEmpty = 0;
    let total = 0;
    for (const [i, c] of ctxs.entries()) for (const wq of [false, true]) for (const wm of [false, true]) {
      for (const k of [null, 'Enter', '1', '2', '3', 'storm-click', 'mach-click']) {
        const run = (S, first, other) => {
          other.hideSiegeMapPanel();
          S.showSiegeMapPanel(first, actionsFor(wq, wm), 3);
          if (k === 'storm-click') click('[data-act="storm"]');
          else if (k === 'mach-click') document.querySelectorAll('.civ-smp-mach-btn').forEach((b) => b.click());
          else if (k) key(k);
          actionLog.push('open=' + S.isSiegeMapPanelOpen() + ' city=' + S.getActiveSiegeCityId());
        };
        const snap = await domCase(M, `show#${i}.q${wq}.me${wm}.${k}`, () => run(P, c, V), () => run(V, panel(c), P), { persist: '#civ-siege-map-panel' });
        if (snap.includes('class="civ-smp"')) nonEmpty++;
        total++;
        P.hideSiegeMapPanel(); V.hideSiegeMapPanel();
      }
    }
    // Aktualizacja: licznik oblegających + nowa tura z nowym stanem miasta.
    {
      const c0 = ctxs[0];
      const c0b = { ...c0, city: { ...c0.city, garnizon: 1, population: 9, magazynZywnosci: 2, siegeCapitulationPending: true } };
      await domCase(M, 'update(besiegers, turn+city)', () => {
        V.hideSiegeMapPanel();
        P.showSiegeMapPanel(c0, actionsFor(true, false), 1); P.setSiegePanelBesiegerCount(4); P.setSiegePanelBesiegerCount(-2); P.setSiegePanelBesiegerCount(5);
        P.updateSiegeMapPanelTurn(2, c0b.city); P.updateSiegeMapPanelTurn(3); key('2');
      }, () => {
        P.hideSiegeMapPanel();
        V.showSiegeMapPanel(panel(c0), actionsFor(true, false), 1); V.setSiegePanelBesiegerCount(4); V.setSiegePanelBesiegerCount(-2); V.setSiegePanelBesiegerCount(5);
        V.updateSiegeMapPanelTurn(2, panel(c0b)); V.updateSiegeMapPanelTurn(3); key('2');
      }, { persist: '#civ-siege-map-panel' });
      P.hideSiegeMapPanel(); V.hideSiegeMapPanel();
      await domCase(M, 'hide → klawisze martwe', () => { V.hideSiegeMapPanel(); P.showSiegeMapPanel(c0, actionsFor(false, false)); P.hideSiegeMapPanel(); key('1'); key('2'); },
        () => { P.hideSiegeMapPanel(); V.showSiegeMapPanel(panel(c0), actionsFor(false, false)); V.hideSiegeMapPanel(); key('1'); key('2'); }, { persist: '#civ-siege-map-panel' });
    }
    assertV2(M, [[`panel obecny w DOM v2 we wszystkich przypadkach pokazu (${nonEmpty}/${total})`, nonEmpty === total && total > 0]]);
  }

  // 8. diploUiSkin.ts (kopia bajtowa)
  {
    const M = 'diploUiSkin.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const names = ['Grecy', 'Egipcjanie', 'Rzymianie', 'Persowie', 'Nieznani', '', 'Hetyci', 'Asyria', 'ŻÓŁW'];
    for (const c of civsJson.cywilizacje) if (c.Cywilizacja) names.push(c.Cywilizacja);
    for (const t of [-1, 0, 0.4, 1, 1.6, 2, 3, 4, 5, 9]) {
      cmpVal(M, `tierIcon(${t})`, P.tierDipIconId(t), V.tierDipIconId(t));
      cmpVal(M, `tone(${t})`, P.pennantTone(t), V.pennantTone(t));
      cmpVal(M, `tierBadge(${t})`, P.tierBadgeHtml(t, 'Etykieta'), V.tierBadgeHtml(t, 'Etykieta'));
    }
    for (const n of names) {
      cmpVal(M, `resolve(${n})`, P.resolveCivIconIdFromName(n), V.resolveCivIconIdFromName(n));
      cmpVal(M, `pennant(${n})`, P.civPennantHtml(n, 2, n.length % 2 === 0), V.civPennantHtml(n, 2, n.length % 2 === 0));
      cmpVal(M, `medallion(${n})`, P.civLeaderMedallionHtml(n), V.civLeaderMedallionHtml(n));
    }
    for (const c of civsJson.cywilizacje) for (const era of [undefined, 1, 2, 3]) for (const force of [false, true]) {
      cmpVal(M, `medallionById(${c.ikonaId},${era},${force})`, P.civLeaderMedallionHtmlById(c.ikonaId, c.kolorHex, era, force), V.civLeaderMedallionHtmlById(c.ikonaId, c.kolorHex, era, force));
      cmpVal(M, `pennantById(${c.ikonaId})`, P.civPennantHtmlById(c.ikonaId, c.kolorHex, 4, true), V.civPennantHtmlById(c.ikonaId, c.kolorHex, 4, true));
    }
    for (const ids of [[], ['Sojusz pełny'], ['Pakt nieagresji', 'Traktat handlowy', 'Rozejm', 'Wasal', 'Otwarte granice', 'Przemarsz', 'Inne <x>']]) cmpVal(M, `treaties(${ids.length})`, P.treatyChipsHtml(ids), V.treatyChipsHtml(ids));
    for (const id of ['tb-diplomacy', 'ui-close', 'nieistnieje']) cmpVal(M, `dipIcon(${id})`, P.dipBrandIconHtml(id, 40, 'x'), V.dipBrandIconHtml(id, 40, 'x'));
    cmpVal(M, 'closeBtn', P.dipCloseBtnHtml('Zamknij <x>'), V.dipCloseBtnHtml('Zamknij <x>'));
    cmpVal(M, 'locateBtn', P.dipCapitalLocateBtnHtml('Pokaż "stolicę"'), V.dipCapitalLocateBtnHtml('Pokaż "stolicę"'));
    cmpVal(M, 'CSS', P.DIPLO_1E_SHARED_CSS, V.DIPLO_1E_SHARED_CSS);
    await domCase(M, 'ensureDiploBrandScope', () => P.ensureDiploBrandScope(), () => V.ensureDiploBrandScope());
  }

  // 9. icons/iconRegistry.ts, 12. icons/wikiBookIcon.ts, 10. mapUnitHudSkin.ts (kopie bajtowe)
  {
    const ids = ['res-food', 'res-work', 'res-treasury', 'res-science', 'res-culture', 'res-religion', 'res-population', 'res-influence', 'res-settlements', 'res-resources', 'res-trade', 'tb-cities', 'tb-science', 'tb-diplomacy', 'tb-army', 'tb-build'];
    const P = pin['ui/icons/iconRegistry.ts'];
    const V = v2['ui/icons/iconRegistry.ts'];
    for (const id of ids) for (const s of [16, 24, 40]) cmpVal('icons/iconRegistry.ts', `iconHtml(${id},${s})`, P.iconHtml(id, s), V.iconHtml(id, s));
    const PW = pin['ui/icons/wikiBookIcon.ts'];
    const VW = v2['ui/icons/wikiBookIcon.ts'];
    for (const s of [16, 24, 26, 40, undefined]) cmpVal('icons/wikiBookIcon.ts', `wikiBookIcon(${s})`, PW.wikiBookIcon(s), VW.wikiBookIcon(s));
    const PM = pin['ui/mapUnitHudSkin.ts'];
    const VM = v2['ui/mapUnitHudSkin.ts'];
    for (const id of ['ui-close', 'tb-army', 'nieistnieje']) for (const s of [24, 40]) cmpVal('mapUnitHudSkin.ts', `icon(${id},${s})`, PM.mapUnitBrandIconHtml(id, s), VM.mapUnitBrandIconHtml(id, s));
    cmpVal('mapUnitHudSkin.ts', 'closeBtn', PM.mapUnitCloseBtnHtml(), VM.mapUnitCloseBtnHtml());
    cmpVal('mapUnitHudSkin.ts', 'closeBtn(t)', PM.mapUnitCloseBtnHtml('X'), VM.mapUnitCloseBtnHtml('X'));
    cmpVal('mapUnitHudSkin.ts', 'CSS', PM.MAP_UNIT_1E_SHARED_CSS, VM.MAP_UNIT_1E_SHARED_CSS);
    await domCase('mapUnitHudSkin.ts', 'ensureMapUnitBrandScope', () => PM.ensureMapUnitBrandScope(), () => VM.ensureMapUnitBrandScope());
  }

  // 11. armyMergePanel.ts (kopia bajtowa)
  {
    const M = 'armyMergePanel.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const row = (i, o = {}) => ({ id: 'u' + i, name: 'Jednostka <' + i + '>', ...o });
    const optsList = [
      { hexLabel: '3,4', existing: [], arriving: row(9) },
      { hexLabel: '(1,2)', existing: [row(1, { ruchLeft: 1, ruchMax: 2 }), row(2, { icon: '<b>I</b>' })], arriving: row(9, { ruchLeft: 0, ruchMax: 3 }), arrivingCount: 3 },
    ];
    for (const [i, o] of optsList.entries()) for (const k of [null, 'Enter', 'Escape', 'merge', 'sep', 'bg']) {
      const run = (S) => {
        S.showArmyMergePanel({ ...o, onMerge: act('onMerge'), onSeparate: act('onSeparate') });
        if (k === 'merge' || k === 'sep') click(`[data-act="${k}"]`);
        else if (k === 'bg') document.querySelector('.civ-amp-overlay')?.click();
        else if (k === 'Escape') { /* stos Escape testowany w P5.1 (escapeOverlayStack) */ }
        else if (k) key(k);
        actionLog.push('open=' + S.isArmyMergePanelOpen());
      };
      await domCase(M, `show#${i}.${k}`, () => run(P), () => run(V));
      P.hideArmyMergePanel(); V.hideArmyMergePanel();
    }
  }

  // 13. powerOverlayHud.ts (kopia bajtowa)
  {
    const M = 'powerOverlayHud.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const ranking = [
      { civ: 'Grecy', power: 120, powerMilitary: 40, powerEconomic: 80, rank: 1, isPlayer: true, wiarygodnosc: 12.6 },
      { civ: 'Persowie <x>', power: 150, powerMilitary: 90, powerEconomic: 60, rank: 2, wiarygodnosc: -40.2 },
      { civ: 'Rzym', power: 90, powerMilitary: 10, powerEconomic: 80, rank: 3, wiarygodnosc: 0 },
      { civ: 'Ur', power: 90, powerMilitary: 50, powerEconomic: 40, rank: 4 },
    ];
    for (const mode of ['total', 'economic', 'military']) {
      cmpVal(M, `sort(${mode})`, P.sortPowerRankingForMode(ranking, mode), V.sortPowerRankingForMode(ranking, mode));
      for (const r of ranking) cmpVal(M, `value(${mode},${r.civ})`, P.powerRankingValueForMode(r, mode), V.powerRankingValueForMode(r, mode));
    }
    const datas = [
      { power: 0, components: [], ranking: [] },
      { power: 3020, components: [{ key: 'a', label: 'Armia <x>', weightPct: 30, normalized: 0.456, points: 13.7 }, { key: 'b', label: 'Miasta', weightPct: 20, normalized: 1, points: 20 }],
        ranking, absoluteRank: { rank: 2, total: 9 }, respektExample: { civ: 'Persowie', respekt: 45, playerPower: 120, theirPower: 150 },
        diagMajorAi: [{ ownerId: 0, label: 'Gracz', moc: 120.4, miasta: 3, pracaPool: 55.5, kolejkaPuste: 1, kolejkaAktywne: 2 }, { ownerId: 2, label: 'AI <2>', moc: 150, miasta: 5, pracaPool: 10, kolejkaPuste: 0, kolejkaAktywne: 5 }] },
    ];
    for (const [i, d] of datas.entries()) for (const [j, extra] of [[], [undefined, undefined, '<svg x="1"></svg>', (o) => o === 2]].entries()) {
      await domCase(M, `show#${i}.${j}`, () => { P.showPowerOverlay(d, act('onClose'), ...extra.slice(1)); click('.civ-pow-close'); P.showPowerOverlay(d, act('onClose'), ...extra.slice(1)); },
        () => { V.showPowerOverlay(d, act('onClose'), ...extra.slice(1)); click('.civ-pow-close'); V.showPowerOverlay(d, act('onClose'), ...extra.slice(1)); });
      P.hidePowerOverlay(); V.hidePowerOverlay();
    }
  }

  // 14. armyListHud.ts (zmieniony: plakietka stanu z DTO `status`)
  {
    const M = 'armyListHud.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const SL = pin['ui/sideListHud.css.ts'];
    const TEXT_TO_STATUS = { 'w garnizonie': 'garrison', 'ufortyfikowana w polu': 'fieldFortified', 'uśpiona': 'sentry', 'auto-eksploracja': 'autoExplore' };
    // „Rust”: status = wybór pinowego `armyStatusBadge` (priorytet flag).
    const toDto = (e) => ({ ...e, status: TEXT_TO_STATUS[SL.armyStatusBadge(e)?.text] ?? null });
    const entries = [];
    for (let m = 0; m < 16; m++) {
      entries.push({ id: 'a' + m, unitTypeId: m % 3 ? 'Wojownik' : undefined, name: 'Armia <' + m + '>', unitCount: (m % 4) + 1, hexLabel: m + ',' + (m * 2),
        inGarnizon: !!(m & 1), ufortyfikowanyWPolu: !!(m & 2), sentry: !!(m & 4), autoExplore: !!(m & 8),
        ...(m % 5 === 0 ? {} : { hp: 37 - m * 2, hpMax: 40, ruchLeft: m % 3, ruchMax: 2 }), ...(m % 4 === 1 ? { detailLine: 'Szczegół', metaLine: 'Meta' } : {}) });
    }
    for (const [label, list, withCard] of [['pusto', [], false], ['16', entries, true], ['16-bez-karty', entries, false]]) {
      const run = (S, conv) => {
        const api = S.createArmyListHud({ getArmies: () => list.map(conv), onSelectArmy: act('onSelectArmy'), ...(withCard ? { onOpenUnitCard: act('onOpenUnitCard') } : {}), onClose: act('onClose') });
        api.show();
        S.setArmyListSelectedId('a5');
        document.querySelector('.sl-item')?.click();
        document.querySelector('.sl-unit-card-btn')?.click();
        actionLog.push('open=' + S.isArmyListHudOpen());
        S.refreshArmyListHudIfOpen();
      };
      await domCase(M, `list(${label})`, () => run(P, (e) => e), () => run(V, toDto));
      P.destroyArmyListHud(); V.destroyArmyListHud();
    }
    const badgeCount = (await domCase(M, 'list(16) — kontrola niepustości', () => { P.createArmyListHud({ getArmies: () => entries, onSelectArmy: () => {} }).show(); },
      () => { V.createArmyListHud({ getArmies: () => entries.map(toDto), onSelectArmy: () => {} }).show(); })).match(/class="sl-badge (gold|neutral|blue)"/g)?.length ?? 0;
    P.destroyArmyListHud(); V.destroyArmyListHud();
    assertV2(M, [['plakietki stanu w DOM = 15 (16 kombinacji flag − 1 bez flag)', badgeCount === 15]]);
  }

  // 15. bottomBarHud.ts (kopia bajtowa)
  {
    const M = 'bottomBarHud.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const cfgs = [
      { getTurn: () => 1 },
      { getTurn: () => 12, getYearLabel: () => '-3000 p.n.e.', getBlockingCount: () => 1, getBlockingTitles: () => ['Wybór <technologii>'] },
      { getTurn: () => 13, getBlockingCount: () => 2, getBlockingTitles: () => ['A', 'B'] },
      { getTurn: () => 14, getBlockingCount: () => 5, getBlockingTitles: () => ['A', 'B', 'C'] },
      { getTurn: () => 15, getBlockingCount: () => 3 },
      { getTurn: () => 16, getBlockingCount: () => 22, getBlockingTitles: () => [] },
      { getTurn: () => 17, getBlockingCount: () => 2, canEndTurn: () => false },
      { getTurn: () => 18, getBlockingCount: () => 2, hideEndTurn: () => true },
    ];
    for (const [i, c] of cfgs.entries()) {
      const run = (S) => {
        const api = S.createBottomBarHud({ ...c, onExecutePending: act('onExecutePending'), onEndTurn: act('onEndTurn') });
        click('[data-wykonaj]'); click('[data-end]'); click('[data-et-show]'); click('[data-et-tooltip]');
        api.update();
      };
      await domCase(M, `bar#${i}`, () => run(P), () => run(V));
    }
  }

  // 16. cityListHud.ts (kopia bajtowa)
  {
    const M = 'cityListHud.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const cities = [
      { id: 'c1', name: 'Rzym <&>', population: 12, productionName: 'Stolarnia', productionProgress: 8.6, productionMax: 20, metaLine: 'Garnizon: 2', garrison: 2, isCapital: true },
      { id: 'c2', name: 'Ostia', population: 3, productionQueueEmpty: true },
      { id: 'c3', name: 'Capua', population: 7, productionName: 'Łucznik', productionProgress: 30, productionMax: 25, garrison: 1 },
      { id: 'c4', name: 'Pompeje', population: 0, productionName: 'X', productionProgress: 1 },
    ];
    for (const [label, list] of [['pusto', []], ['4', cities]]) {
      const run = (S) => {
        const api = S.createCityListHud({ getCities: () => list, onSelectCity: act('onSelectCity'), onClose: act('onClose') });
        api.toggle();
        document.querySelector('.sl-item')?.click();
        actionLog.push('open=' + S.isCityListHudOpen() + ' get=' + (S.getCityListHud() === api));
        S.refreshCityListHudIfOpen();
      };
      await domCase(M, `list(${label})`, () => run(P), () => run(V));
      P.destroyCityListHud(); V.destroyCityListHud();
    }
  }

  // 17. empireOverlayHud.ts (kopia bajtowa)
  {
    const M = 'empireOverlayHud.ts';
    const P = pin['ui/' + M];
    const V = v2['ui/' + M];
    const cult = [
      { kulturaTotal: 0, kulturaRate: -2, cityCount: 0, cities: [] },
      { kulturaTotal: 340, kulturaRate: 12, cityCount: 2, cities: [{ name: 'Rzym <x>', kultura: 200, borderRadius: 3 }, { name: 'Ostia', kultura: 140, borderRadius: 2 }],
        thresholds: [50, 150, 400], nextThreshold: 400, pctToNext: 85, happinessNote: 'Szczęście +1 & więcej', sourcesNote: 'Źródła: <świątynie>' },
    ];
    const rel = [
      { stateReligion: 'Politeizm <x>', cityCount: 1, cities: [{ name: 'Ur', dominujaca: 'Politeizm', udzialPct: 80 }] },
      { stateReligion: 'Zaratusztrianizm', cityCount: 3, cities: [], spreadNote: 'Szerzy się', dominanceThresholdPct: 60, dominantCityCount: 2, happinessNote: 'Jedność' },
      { stateReligion: 'X', cityCount: 0, cities: [], dominanceThresholdPct: 50 },
    ];
    for (const [i, d] of cult.entries()) {
      await domCase(M, `culture#${i}`, () => { P.showCultureOverlay(d, act('onClose')); click('.civ-emp-close'); P.showCultureOverlay(d); },
        () => { V.showCultureOverlay(d, act('onClose')); click('.civ-emp-close'); V.showCultureOverlay(d); });
      P.hideEmpireOverlay(); V.hideEmpireOverlay();
    }
    for (const [i, d] of rel.entries()) {
      await domCase(M, `religion#${i}`, () => { P.showReligionOverlay(d, act('onClose')); document.querySelector('.civ-emp-ov')?.click(); P.showReligionOverlay(d); },
        () => { V.showReligionOverlay(d, act('onClose')); document.querySelector('.civ-emp-ov')?.click(); V.showReligionOverlay(d); });
      P.hideEmpireOverlay(); V.hideEmpireOverlay();
    }
  }

  // ─── raport ────────────────────────────────────────────────────────────────
  const rows = LEVEL1A.map((m) => R(m));
  let totalCases = 0;
  let totalDiffs = 0;
  for (const r of rows) {
    totalCases += r.cases;
    totalDiffs += r.diffs + (r.v2AssertionsFailed ?? 0);
    const extra = [];
    if (r.v2Assertions) extra.push(`asercje_v2=${r.v2Assertions.length - r.v2AssertionsFailed}/${r.v2Assertions.length}`);
    if (r.domCases) extra.push(`DOM_puste=${r.domEmpty ?? 0}/${r.domCases}`);
    if (r.cases === 0) { extra.push('BRAK_PRZYPADKÓW'); totalDiffs++; }
    console.log(`${r.module.padEnd(28)} przypadki=${String(r.cases).padStart(5)} różnice=${r.diffs}${extra.length ? ' ' + extra.join(' ') : ''}${r.notMeasured.length ? ' NIE_ZMIERZONO=' + r.notMeasured.length : ''}`);
    for (const ex of r.examples) console.log(`   RÓŻNICA ${ex.label} @${ex.at}\n     pin: ${ex.pin}\n     v2 : ${ex.v2}`);
    for (const nm of r.notMeasured) console.log(`   NIE_ZMIERZONO: ${nm}`);
  }
  console.log(`dom-harness-level1a: pin=edb8fb56 modułów=${rows.length} przypadków=${totalCases} różnic=${totalDiffs} jsdomErrors=${jsdomErrors.length}`);
  if (jsdomErrors.length) console.log('jsdomErrors (unikalne): ' + [...new Set(jsdomErrors)].slice(0, 5).join(' | '));
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ pin: 'edb8fb56', totalCases, totalDiffs, modules: rows }, null, 2) + '\n');
  exitCode = totalDiffs === 0 ? 0 : 1;
} catch (err) {
  console.error('dom-harness-level1a: BŁĄD', err?.stack ?? err);
  exitCode = 2;
} finally {
  console.warn = origWarn;
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
