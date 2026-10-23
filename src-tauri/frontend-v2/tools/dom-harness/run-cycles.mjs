#!/usr/bin/env node
/**
 * run-cycles.mjs — harness porównania DOM/wyników: 7 modułów P5.6 (`R-RUSTPORT-P5-6-PORT-CYKLE-C1235-Q1`;
 * `PORTING-QUEUE.md` wiersze 69, 70, 73 — cykl C2; 75 — `hexContextTooltip.ts`; 76, 77 — cykl C5; 83 — `preBattle.ts`)
 * w frontend-v2 vs ten sam moduł z pinu web `edb8fb56`.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
 *   node tools/dom-harness/run-cycles.mjs --pin-dir <PIN_DIR> [--json <plik>] [--only a.ts,b.ts]
 * EXIT 0 ⇔ 0 różnic (i wszystkie asercje v2 spełnione); 1 ⇔ ≥1 różnica; 2 ⇔ błąd harnessu.
 *
 * Metoda = `run-level2.mjs` (P5.5): oba drzewa pakowane `esbuild` z tą samą emulacją Vite (`build.mjs`), wspólny jsdom,
 * zamrożony `Date`, kanoniczna serializacja `document.documentElement` albo JSON/HTML wartości, log akcji (callbacki)
 * dopisany do DOM, eksploracja generyczna (każdy element klikalny / pole / klawisz = osobny przypadek).
 *
 * Strona v2 dostaje DTO i odpowiedzi zapytań zbudowane w harnessie z DANYCH i FUNKCJI PINU (harness gra rolę „Rust”):
 *   - `StaticCatalogDto` = `gra/data/*.json` + stałe/etykiety dyplomacji z `game/diplomacy-*` pinu;
 *   - `HexTooltipViewDto` = `improvementKeysForHex`, `improvementDisplayName`, `improvementBonusForKey`,
 *     `territoryResourceYieldForImprovement`, `labelsForImprovementUnlock`, `tileYield`, `hexDepositDisplayLabel`,
 *     `hexHiddenDepositHint`, `isLamaDepositVisibleForCiv`, bramki `map/improvement-build.ts` + `hexHasRiverAccess` pinu;
 *     filtr listy ulepszeń i rozbicie plonów = transkrypcja `hexContextTooltip.ts:274-295,327-358,440-513` pinu
 *     (poprawność transkrypcji weryfikuje samo porównanie z pinem);
 *   - `FieldPowerDto` = `fieldPower`; `UnitCardBadgesDto` = `softPathBadgeLevel`/`armorPathBadgeLevel`/`veteranStarCount`;
 *   - `PreBattleSide.bonusChips` = `bonusChipTexts(resolveSideBonusy(…))` (wybór źródła = transkrypcja `preBattle.ts:598-606`);
 *   - `DiplomacyQueriesProvider` (koszyk PW) = `diplomacySumPn`, `diplomacyFairGivePn`, `diplomacyTradeTrustFromDeal`,
 *     `diplomacyGiftTrustFromPn`, `diplomacyDobraWolaFromSurplus`, `computePlayerAcceptanceSides`, `computeQuickDealBasket`,
 *     `balanceGiveItemsToFairMin`, `validateTradeBasketSides`, `isCurrencyProposalForbiddenDuringWar`, …;
 *     panel PW = formuła z `run.mjs` (P5.2, ta sama co `renderPnBalancePanelFromBasket`/`ForTreaty` pinu);
 *   - stan audiencji: `effectiveNastawienieScores`/`nastawienieLabelFromScore`/`nastawienieHintPl`, `wiarygodnoscLabelPl`
 *     + tooltipy, `balancePanelDataFromRows`/`filterActionableNegotiationRows` (pin `ui/diplomacyAcceptanceBalance.ts`),
 *     `splitNegotiationDealPlayerSides`, `playerTreatyDisplayPw`/`partnerTreatyDisplayPw`/`bilateralTreatyDisplayPw`,
 *     `proposalHasResourceAccess`.
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
/** `--only a.ts,b.ts` — tylko wskazane moduły (używane przez `mutate-cycles.mjs`). */
const ONLY = argOf('--only')?.split(',').filter(Boolean) ?? null;
const want = (m) => ONLY === null || ONLY.includes(m);
/** `--stop-on-diff` — koniec przy pierwszej różnicy/asercji (EXIT 1); używane przez `mutate-cycles.mjs`, by wykryta mutacja nie czekała na resztę przypadków. */
const STOP_ON_DIFF = args.includes('--stop-on-diff');
class StopOnDiff extends Error {}
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-cycles.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PIN_SRC = resolve(PIN_DIR, 'gra/src');
const PIN_DATA = resolve(PIN_DIR, 'gra/data');

const MODS = [
  'diplomacyAudience.ts', 'diplomacyNegotiationModal.ts', 'diplomacyTradeBasket.ts', 'hexContextTooltip.ts',
  'sidePanelHud.ts', 'sidePanelEventFilter.ts', 'preBattle.ts',
];
/** Moduły pinu używane przez harness jako „Rust”. */
const PIN_REF = [
  'units/setup.ts', 'game/unit-building-bonuses.ts', 'game/veteran.ts', 'game/unit-power.ts', 'game/terrain-improvements.ts',
  'game/economy.ts', 'map/improvement-build.ts', 'game/resource-access.ts', 'game/livestock-unlock.ts', 'game/display-names.ts',
  'game/defenseBreakdown.ts', 'game/diplomacy-value-catalog.ts', 'game/diplomacy-pn-engine.ts',
  'game/diplomacy-trade-validation.ts', 'game/diplomacy-ai-offer-balance.ts', 'game/diplomacy-proposals.ts',
  'game/diplomacy-war-gates.ts', 'game/diplomacy-acceptance-points.ts', 'game/diplomacy-display.ts',
  'game/diplomacy-credibility.ts', 'game/diplomacy-audience-actions.ts', 'game/diplomacy-barbarian-cooperation.ts',
  'ui/diplomacyAcceptanceBalance.ts', 'game/tech-tempo.ts',
];
const V2_CTRL = ['controller/staticCatalog.ts', 'controller/diplomacyQueries.ts', 'controller/audio.ts'];
const V2_EXTRA = ['armyStackHudSuppression.ts'];

// ─── jsdom ───────────────────────────────────────────────────────────────────
const jsdomErrors = [];
const vc = new VirtualConsole();
let curCase = '';
vc.on('jsdomError', (e) => jsdomErrors.push(String(e?.message ?? e).split('\n')[0] + ' @' + curCase));
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const W = dom.window;
const GLOBALS = [
  'window', 'document', 'Node', 'Element', 'HTMLElement', 'HTMLDivElement', 'HTMLCanvasElement', 'HTMLButtonElement',
  'HTMLParagraphElement', 'HTMLPreElement', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement',
  'HTMLSpanElement', 'HTMLImageElement', 'HTMLVideoElement', 'HTMLMediaElement', 'HTMLAudioElement', 'Audio', 'Event',
  'MouseEvent', 'KeyboardEvent', 'CustomEvent', 'PointerEvent', 'WheelEvent', 'FocusEvent', 'getComputedStyle',
  'requestAnimationFrame', 'cancelAnimationFrame', 'localStorage', 'sessionStorage', 'location', 'DOMParser', 'SVGElement',
  'navigator', 'matchMedia', 'ResizeObserver',
];
for (const k of GLOBALS) {
  const v = k === 'window' ? W : W[k];
  if (v === undefined) continue;
  Object.defineProperty(globalThis, k, { value: typeof v === 'function' && k !== 'window' && /^[a-z]/.test(k) ? v.bind(W) : v, configurable: true, writable: true });
}
W.Element.prototype.scrollIntoView = function scrollIntoView() {};
W.Element.prototype.scrollTo = function scrollTo() {};
W.HTMLMediaElement.prototype.play = function play() { return Promise.resolve(); };
W.HTMLMediaElement.prototype.pause = function pause() {};
W.HTMLMediaElement.prototype.load = function load() {};
const FIXED = Date.UTC(2026, 9, 22, 10, 30, 15);
const RealDate = Date;
class FrozenDate extends RealDate {
  constructor(...a) { if (a.length === 0) super(FIXED); else super(...a); }
  static now() { return FIXED; }
}
globalThis.Date = FrozenDate;
W.Date = FrozenDate;
const origWarn = console.warn;
const origError = console.error;
const origLog = console.log;
console.warn = () => {};
const consoleErrors = [];
console.error = (...a) => { consoleErrors.push(a.map(String).join(' ').slice(0, 200)); };

const tmp = mkdtempSync(join(tmpdir(), 'p56-harness-'));
const pinOut = join(tmp, 'pin');
const v2Out = join(tmp, 'v2');
let exitCode = 0;
try {
  await bundle([...MODS.map((m) => join(PIN_SRC, 'ui', m)), ...PIN_REF.map((m) => join(PIN_SRC, m))], pinOut);
  await bundle([...V2_CTRL.map((m) => join(V2_ROOT, 'src', m)), ...[...MODS, ...V2_EXTRA].map((m) => join(V2_ROOT, 'src/ui', m))], v2Out);
  const imp = (base, rel) => import(pathToFileURL(join(base, rel.replace(/\.ts$/, '.js'))).href);

  const pin = {};
  for (const m of PIN_REF) pin[m] = await imp(pinOut, m);
  for (const m of MODS) pin['ui/' + m] = await imp(pinOut, 'ui/' + m);

  const json = (f) => JSON.parse(readFileSync(join(PIN_DATA, f), 'utf8'));
  const unitsJson = json('units.json');
  const techJson = json('tech.json');
  const civsJson = json('civs.json');
  const { categoryOf } = pin['units/setup.ts'];
  const VC = pin['game/diplomacy-value-catalog.ts'];
  const E = pin['game/diplomacy-pn-engine.ts'];
  const AP = pin['game/diplomacy-acceptance-points.ts'];
  const DD = pin['game/diplomacy-display.ts'];
  const CR = pin['game/diplomacy-credibility.ts'];
  const PR = pin['game/diplomacy-proposals.ts'];
  const AA = pin['game/diplomacy-audience-actions.ts'];
  const AB = pin['ui/diplomacyAcceptanceBalance.ts'];

  // „Rust”: StaticCatalogDto z danych i funkcji pinu.
  const unitCategory = {};
  const unitCategoryNameOnly = {};
  for (const u of unitsJson) {
    unitCategory[u.Jednostka] = categoryOf(u.Jednostka ?? '', u['Rola (linia)'] ?? '', u['Super-jednostka'] === 'TAK', u['Typ']);
    unitCategoryNameOnly[u.Jednostka] = categoryOf(u.Jednostka ?? '', '', false, undefined);
  }
  // `RESOURCE_KEY_LABEL` (`game/diplomacy-display.ts:416-432`) nie jest eksportowany — odczyt literału z pliku pinu (te same dane).
  const ddSrc = readFileSync(join(PIN_SRC, 'game/diplomacy-display.ts'), 'utf8');
  const rkl = ddSrc.slice(ddSrc.indexOf('const RESOURCE_KEY_LABEL'), ddSrc.indexOf('};', ddSrc.indexOf('const RESOURCE_KEY_LABEL')));
  const resourceKeyLabels = {};
  for (const m of rkl.matchAll(/^\s*([a-z_]+):\s*'([^']*)',/gm)) resourceKeyLabels[m[1]] = m[2];
  const multiOwn = [];
  for (let i = 0; i <= 30; i++) if (AA.uiActionAllowsMultipleOwnOnTable(String(i))) multiOwn.push(String(i));
  const catalog = {
    contentHash: 'harness-pin-edb8fb56',
    buildings: json('buildings.json'), units: unitsJson, tech: techJson, terrainImprovements: json('terrain-improvements.json'),
    wonders: json('wonders.json'), counters: json('counters.json'), civs: civsJson, cityNamesPools: {}, powerParams: {},
    uiParams: json('ui-params.json'), wiki: { poradnik: [], encyklopedia: [] },
    constants: {
      barbarianCooperationDefaultDurationTurns: pin['game/diplomacy-barbarian-cooperation.ts'].BARBARIAN_COOPERATION_DEFAULT_DURATION_TURNS,
      zywnoscNaPn: VC.diplomacyZywnoscNaPn(),
      progDarRelacja: VC.diplomacyProgDarRelacja(),
      handelZaufaniePerTura: VC.diplomacyHandelZaufaniePerTura(),
      handelSurowceKeys: Object.keys(VC.diplomacyHandelSurowceCatalog()),
      audienceMultiOwnActionIds: multiOwn,
    },
    labels: {
      traktatHandlowyLabel: DD.TRAKTAT_HANDLOWY_LABEL,
      resourceAccessTradeWithdrawnReason: PR.RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON,
      resourceKeyLabels,
    },
    unitCategory, unitCategoryNameOnly, techTerrainUnlockLabels: {},
  };
  const v2 = {};
  for (const m of V2_CTRL) v2[m] = await imp(v2Out, m);
  v2['controller/staticCatalog.ts'].installStaticCatalog(catalog);
  for (const m of [...MODS, ...V2_EXTRA]) v2['ui/' + m] = await imp(v2Out, 'ui/' + m);

  const UB = pin['game/unit-building-bonuses.ts'];
  const VT = pin['game/veteran.ts'];
  const badges = (inp) => ({
    softPath: UB.softPathBadgeLevel({ parametryBonusProc: inp.parametryPathPp ?? 0 }),
    armorPath: UB.armorPathBadgeLevel({ pancerzBonusProc: inp.pancerzPathPp ?? 0 }),
    veteranStars: VT.veteranStarCount(inp.veteranProgress ?? null),
  });

  // ─── porównanie (= run-level2.mjs) ──────────────────────────────────────────
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
      if (STOP_ON_DIFF) throw new StopOnDiff(`${mod}: ${label}`);
      if (r.examples.length < 5) {
        let i = 0;
        while (i < a.length && a[i] === b[i]) i++;
        r.examples.push({ label, at: i, pin: a.slice(Math.max(0, i - 80), i + 140), v2: b.slice(Math.max(0, i - 80), i + 140) });
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
    for (const el of [document.documentElement, document.body]) for (const a of [...el.attributes]) el.removeAttribute(a.name);
  }
  const snapshot = () => ser(document.documentElement);
  let actionLog = [];
  const fmtArg = (x) => (typeof x === 'object' ? JSON.stringify(x) : String(x));
  const act = (name, ret) => (...a) => { actionLog.push(name + '(' + a.map(fmtArg).join(',') + ')'); return typeof ret === 'function' ? ret(...a) : ret; };
  const dumpActions = () => {
    const pre = document.createElement('pre');
    pre.setAttribute('data-action-log', '');
    pre.textContent = actionLog.join('\n');
    document.body.appendChild(pre);
  };
  const stashed = {};
  async function domCase(mod, label, runPin, runV2, { stash = false, cleanupPin, cleanupV2 } = {}) {
    const st = (stashed[mod] ??= { pin: [], v2: [] });
    const one = async (name, run, cleanup) => {
      curCase = mod + '/' + name;
      resetDoc();
      localStorage.clear();
      actionLog = [];
      if (stash) for (const n of st[name]) document.body.appendChild(n);
      try { await run(); } catch (e) { actionLog.push('THROW:' + String(e?.message ?? e)); }
      dumpActions();
      const snap = snapshot();
      // `stash` = true (wszystkie węzły `body`) albo selektor CSS (tylko trwały korzeń modułu, np. `.civ-diplo-aud`).
      if (stash) st[name] = [...document.body.childNodes].filter((n) => !(n.nodeType === 1 && n.hasAttribute('data-action-log'))
        && (stash === true || (n.nodeType === 1 && n.matches(stash))));
      try { await cleanup?.(); } catch (e) { /* sprzątanie nie wpływa na zrzut */ }
      return snap;
    };
    const a = await one('pin', runPin, cleanupPin);
    const b = await one('v2', runV2, cleanupV2);
    resetDoc();
    record(mod, label, a, b);
    const r = R(mod);
    r.domCases = (r.domCases ?? 0) + 1;
    if (!/<body>(?:(?!<pre data-action-log)<[a-z])/.test(b.replace(/<body><\/body>/, '<body>'))) r.domEmpty = (r.domEmpty ?? 0) + 1;
    return { pin: a, v2: b };
  }
  const notMeasured = (mod, why) => R(mod).notMeasured.push(why);
  const assertV2 = (mod, checks) => {
    const r = R(mod);
    r.v2Assertions = [...(r.v2Assertions ?? []), ...checks.map(([k, ok]) => ({ check: k, ok: !!ok }))];
    r.v2AssertionsFailed = r.v2Assertions.filter((c) => !c.ok).length;
    if (STOP_ON_DIFF && r.v2AssertionsFailed > 0) throw new StopOnDiff(`${mod}: asercja v2`);
  };
  const fire = (el, type, init = {}) => el?.dispatchEvent(new W.MouseEvent(type, { bubbles: true, cancelable: true, clientX: 120, clientY: 80, ...init }));
  const key = (k, target = document) => target.dispatchEvent(new W.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const desc = (el) => (el ? el.tagName.toLowerCase() + '.' + (el.getAttribute('class') ?? '') + [...el.attributes].filter((a) => a.name.startsWith('data-')).map((a) => `[${a.name}=${a.value}]`).join('') : 'BRAK');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const CLICK_SEL = 'button, [data-act], [data-aid], [data-negot-act], [data-negot-editable], [data-unit], [data-id], [data-sp-expand], [data-goods-cat], [data-deal-id], [data-turns], [data-value], [role="button"], [tabindex], input[type="checkbox"], input[type="radio"], summary, a[href]';
  const INPUT_SEL = 'input[type="range"], input[type="number"], input[type="text"], input:not([type]), select, textarea';
  /** Eksploracja = `run-level2.mjs` (P5.5) — opcja `fill(el)` nadpisuje wartość wpisywaną w pole. */
  async function explore(M, label, setup, { P, V, cleanupP, cleanupV, stash = false, maxClicks = 80, keys = [], after, clickSel = CLICK_SEL, fill } = {}) {
    let nClick = 0;
    let nInput = 0;
    const counted = (fn) => async (S, s) => {
      await fn(S, s);
      if (s === 'pin') {
        nClick = document.querySelectorAll(clickSel).length;
        nInput = document.querySelectorAll(INPUT_SEL).length;
      }
    };
    const res = await domCase(M, `${label}:open`, () => counted(setup)(P, 'pin'), () => setup(V, 'v2'), { stash, cleanupPin: cleanupP, cleanupV2: cleanupV });
    for (let i = 0; i < Math.min(nClick, maxClicks); i++) {
      const run = async (S, s) => {
        await setup(S, s);
        const el = document.querySelectorAll(clickSel)[i];
        actionLog.push(`klik#${i}:${desc(el)}`);
        fire(el, 'click');
        await after?.(S, s);
      };
      await domCase(M, `${label}:klik#${i}`, () => run(P, 'pin'), () => run(V, 'v2'), { stash, cleanupPin: cleanupP, cleanupV2: cleanupV });
    }
    if (nClick > maxClicks) notMeasured(M, `${label}: kliknięto ${maxClicks} z ${nClick} elementów (limit przypadków)`);
    for (let i = 0; i < nInput; i++) {
      const run = async (S, s) => {
        await setup(S, s);
        const el = document.querySelectorAll(INPUT_SEL)[i];
        actionLog.push(`pole#${i}:${desc(el)}`);
        if (el) {
          if (fill) el.value = fill(el);
          else if (el.tagName === 'SELECT') el.value = el.options[el.options.length - 1]?.value ?? '';
          else if (el.type === 'range') el.value = String(Math.round((Number(el.min || 0) + Number(el.max || 100)) * 0.37));
          else if (el.type === 'number') el.value = '7';
          else el.value = 'Tekst <x> & y';
          el.dispatchEvent(new W.Event('input', { bubbles: true }));
          el.dispatchEvent(new W.Event('change', { bubbles: true }));
        }
        await after?.(S, s);
      };
      await domCase(M, `${label}:pole#${i}`, () => run(P, 'pin'), () => run(V, 'v2'), { stash, cleanupPin: cleanupP, cleanupV2: cleanupV });
    }
    for (const k of keys) {
      const run = async (S, s) => {
        await setup(S, s);
        actionLog.push('klawisz:' + k);
        key(k);
        await after?.(S, s);
      };
      await domCase(M, `${label}:klawisz(${k})`, () => run(P, 'pin'), () => run(V, 'v2'), { stash, cleanupPin: cleanupP, cleanupV2: cleanupV });
    }
    return res;
  }
  /** Sekwencja kroków na jednym otwartym panelu (każdy krok: selektor + akcja), zrzut DOM po każdym kroku. */
  async function sequence(M, label, setup, steps, { P, V, cleanupP, cleanupV } = {}) {
    const run = async (S, s) => {
      await setup(S, s);
      for (const [si, st] of steps.entries()) {
        const el = st.sel ? document.querySelectorAll(st.sel)[st.idx ?? 0] : null;
        actionLog.push(`krok#${si}:${st.do}:${st.sel ?? ''}:${desc(el)}`);
        if (st.do === 'click') fire(el, 'click');
        else if (st.do === 'value' && el) {
          el.value = st.value;
          el.dispatchEvent(new W.Event('input', { bubbles: true }));
          el.dispatchEvent(new W.Event('change', { bubbles: true }));
        } else if (st.do === 'key') key(st.key);
        actionLog.push(ser(document.body).length > 0 ? 'stan#' + si + '=' + ser(document.body).replace(/<pre data-action-log[\s\S]*$/, '').length : '');
      }
    };
    return domCase(M, label, () => run(P, 'pin'), () => run(V, 'v2'), { cleanupPin: cleanupP, cleanupV2: cleanupV });
  }
  const mods = (m) => [pin['ui/' + m], v2['ui/' + m]];

  // ─── 1. sidePanelEventFilter.ts ───────────────────────────────────────────
  const EVENTS = [
    { id: 'e1', icon: '🔬', title: 'Nauka', subtitle: 'Odkryto <b>Brąz</b>', kind: 'science' },
    { id: 'e2', icon: '⚔', title: 'Wróg u bram', subtitle: 'Armia & co', kind: 'enemy', blocking: true },
    { id: 'e3', icon: '🏛', title: '', subtitle: 'Produkcja zakończona', kind: 'city', cityId: '7' },
    { id: 'e4', icon: '🤝', title: 'Handel AI↔AI', subtitle: 'Grecy ↔ Rzym', kind: 'diplo', origin: 'other-civs' },
    { id: 'e5', icon: '!', title: 'Głód', subtitle: 'Spichlerz pusty', kind: 'info', negative: true },
    { id: 'e6', icon: '🛡', title: 'Jednostka', kind: 'unit', hex: { q: 2, r: 3 }, blocking: true },
    { id: 'e7', icon: '🎭', title: 'Kultura', subtitle: 'Święto', kind: 'culture', ownerId: 2 },
  ];
  if (want('sidePanelEventFilter.ts')) {
    const M = 'sidePanelEventFilter.ts';
    const [P, V] = mods(M);
    for (const evs of [[], EVENTS, EVENTS.filter((e) => e.origin), EVENTS.slice(0, 3)]) for (const show of [false, true]) {
      cmpVal(M, `filter(${evs.length},${show})`, P.filterSidePanelEvents(evs, show), V.filterSidePanelEvents(evs, show));
    }
  }

  // ─── 2. hexContextTooltip.ts ──────────────────────────────────────────────
  // „Rust”: HexTooltipViewDto z funkcji pinu (transkrypcja `hexContextTooltip.ts` pinu tam, gdzie funkcja nie jest eksportowana).
  const TI = pin['game/terrain-improvements.ts'];
  const EC = pin['game/economy.ts'];
  const IB = pin['map/improvement-build.ts'];
  const RA = pin['game/resource-access.ts'];
  const LU = pin['game/livestock-unlock.ts'];
  const UP = pin['game/unit-power.ts'];
  const HX = pin['ui/hexContextTooltip.ts'];
  const RIVER_BONUS = { zywnosc: 3, praca: 2, handel: 2, drewno: 0, kamien: 0, glina: 2, ruda: 0, ruda_zelaza: 0 };
  const FOREST_BONUS = { zywnosc: -1, praca: 3, handel: -1, drewno: 3, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 };
  const bonusToTileYield = (b) => ({ zywnosc: b.zywnosc ?? 0, praca: b.praca ?? 0, handel: (b.handel ?? 0) + (b.pieniadz ?? 0), drewno: b.drewno ?? 0, kamien: b.kamien ?? 0, glina: b.glina ?? 0, ruda: 0, ruda_zelaza: 0 });
  const cityYieldOnly = (y) => ({ zywnosc: y.zywnosc ?? 0, praca: y.praca ?? 0, handel: y.handel ?? 0, drewno: 0, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 });
  const impLine = (key, zloze) => ({
    key, name: TI.improvementDisplayName(key), bonus: TI.improvementBonusForKey(key),
    magazyn: TI.territoryResourceYieldForImprovement(key, zloze) ?? null, unlockLabels: RA.labelsForImprovementUnlock(key),
  });
  const hexView = (hex, { era = 99, civ, map } = {}) => {
    const keys = TI.improvementKeysForHex(hex);
    const zloze = hex.zloze;
    const fullY = EC.tileYield({ terenBazowy: hex.terenBazowy, nakladka: hex.nakladka ?? 'brak', maRzeke: !!(hex.rzeka && hex.rzeka.obecna), zloze, ulepszeniaKeys: keys });
    const parts = [{ label: 'teren bazowy', delta: EC.tileYield({ terenBazowy: hex.terenBazowy, nakladka: 'brak', maRzeke: false }) }];
    if (hex.nakladka === 'las') parts.push({ label: 'las', delta: { ...FOREST_BONUS } });
    if (hex.rzeka?.obecna) parts.push({ label: 'rzeka', delta: { ...RIVER_BONUS } });
    const builtSet = new Set(keys);
    for (const k of keys) {
      const bonus = cityYieldOnly(bonusToTileYield(TI.improvementBonusForKey(k)));
      if (!['zywnosc', 'praca', 'handel'].some((yk) => (bonus[yk] ?? 0) !== 0)) continue;
      parts.push({ label: `${TI.improvementDisplayName(k)} (${builtSet.has(k) ? 'postawione' : 'złoże / hodowla'})`, delta: bonus });
    }
    const out = [];
    const seen = new Set();
    const push = (label) => { const k = label.toLowerCase(); if (seen.has(k)) return; seen.add(k); out.push(label); };
    if (hex.nakladka === 'zloze_lamy' && !LU.isLamaDepositVisibleForCiv(civ)) { /* lama — tylko cywilizacje andyjskie */ } else {
      const d = RA.hexDepositDisplayLabel(hex, era); if (d) push(d);
      const h = RA.hexHiddenDepositHint(hex, era); if (h) push(h);
    }
    for (const k of keys) for (const u of RA.labelsForImprovementUnlock(k)) push(u);
    if (hex.nakladka === 'las') push('Las (drewno)');
    if (hex.rzeka?.obecna) push('Rzeka');
    const active = new Set(keys);
    const teren = hex.terenBazowy;
    const nak = hex.nakladka;
    const possible = [];
    for (const k of TI.IMPROVEMENT_KEYS) {
      if (active.has(k)) continue;
      if (!TI.isImprovementAllowedForCiv(k, civ)) continue;
      if (!IB.galleryTerrainEligible(k, teren)) continue;
      if (IB.isImprovementBlockedOnForest(k, nak)) continue;
      if (k === 'bydlo' && nak !== 'zloze_bydla') continue;
      if (k === 'owce' && nak !== 'zloze_owiec') continue;
      if (k === 'lama' && nak !== 'zloze_lamy') continue;
      if (k === 'stadnina' && nak !== 'zloze_konia') continue;
      if (k === 'farma' && !IB.isFarmBaseTerrain(teren, nak)) continue;
      if (k === 'tartak' && nak !== 'las') continue;
      if (k === 'wyrab' && nak !== 'las') continue;
      if (k === 'glinianka' && !IB.hexHasClayDeposit(hex)) continue;
      if (k === 'oboz_lowiecki' && nak !== 'las') continue;
      if (k === 'oboz_lowiecki' && !active.has('tartak')) continue;
      if (k === 'warzelnia_soli' && teren !== 'plytkie_morze' && zloze !== 'sol') continue;
      if (k === 'kopalnia_zelaza' && zloze !== 'zelazo') continue;
      if (k === 'kopalnia_miedzi' && zloze !== 'miedz' && nak !== 'zloze_rudy' && zloze !== 'ruda') continue;
      if (k === 'kopalnia_zlota' && zloze !== 'zloto') continue;
      if (k === 'kopalnia_cyny' && zloze !== 'cyna') continue;
      if (k === 'droga_brukowana' && !active.has('droga') && hex.ulepszenie !== 'droga') continue;
      if (k === 'irygacja' && !HX.hexHasRiverAccess(hex, map)) continue;
      possible.push(impLine(k, undefined));
      if (possible.length >= 10) break;
    }
    return { terrainBase: String(hex.terenBazowy), resourceLabels: out, built: keys.map((k) => impLine(k, zloze)), implicit: keys.filter((k) => !keys.includes(k)).map((k) => impLine(k, zloze)), yieldParts: parts, yieldFull: fullY, possible };
  };
  const combat = (k) => ({
    atakBase: 4, atakEffective: 4 + k, obronaBase: 6, obronaEffective: 6 - k / 2, hpMaxBase: 10, hpMaxEffective: 10 + k, pancerzBase: 1,
    pancerzEffective: 1 + k * 1.25, weaponDamageBase: 2, weaponDamageEffective: 2 + k, piercingBase: 1, piercingEffective: 1, chargeBonusBase: 3,
    chargeBonusEffective: 3 + k * 2, missileAttackBase: 0, missileAttackEffective: k > 2 ? 5 : 0,
  });
  const fieldPower = (c) => UP.fieldPower({ meleeAttack: c.atakEffective, meleeDefence: c.obronaEffective, armor: c.pancerzEffective, health: c.hpMaxEffective, weaponDamage: c.weaponDamageEffective, piercing: c.piercingEffective, chargeBonus: c.chargeBonusEffective, missileAttack: c.missileAttackEffective });
  if (want('hexContextTooltip.ts')) {
    const M = 'hexContextTooltip.ts';
    const [P, V] = mods(M);
    cmpVal(M, 'UNIT_CONTEXT_PANEL_CSS', P.UNIT_CONTEXT_PANEL_CSS, V.UNIT_CONTEXT_PANEL_CSS);
    const TERRAINS = ['laka', 'rownina', 'wzgorza', 'gory', 'plytkie_morze', 'morze', 'pustynia', 'polarny', 'nieznany<x>'];
    const OVERLAYS = ['brak', 'las', 'zloze_gliny', 'zloze_rudy', 'zloze_konia', 'zloze_owiec', 'zloze_bydla', 'zloze_lamy', undefined];
    const hexCases = [];
    for (const t of TERRAINS) for (const o of OVERLAYS) for (const river of [false, true]) {
      hexCases.push([`${t}/${o}/${river}`, { coords: { q: 3, r: -2 }, terenBazowy: t, nakladka: o, rzeka: river ? { obecna: true } : undefined, ulepszenie: 'brak' }, {}]);
    }
    for (const k of TI.IMPROVEMENT_KEYS) for (const [t, o] of [['laka', 'brak'], ['wzgorza', 'las'], ['gory', 'zloze_rudy']]) {
      hexCases.push([`imp:${k}@${t}/${o}`, { coords: { q: 1, r: 1 }, terenBazowy: t, nakladka: o, ulepszenia: [k], zloze: k.includes('zelaza') ? 'zelazo' : undefined }, {}]);
    }
    for (const z of ['sol', 'zelazo', 'miedz', 'zloto', 'cyna', 'ruda', 'glina', 'kamien', 'wegiel', ' Zelazo ']) for (const t of ['gory', 'wzgorza', 'plytkie_morze', 'pustynia']) for (const era of [1, 2, 3, 99]) {
      hexCases.push([`zloze:${z}@${t}/era${era}`, { coords: { q: 0, r: 0 }, terenBazowy: t, nakladka: 'brak', zloze: z }, { era }]);
    }
    for (const civ of [null, 'inkowie', 'rzymianie', 'astekowie']) for (const o of ['zloze_lamy', 'zloze_konia', 'zloze_bydla']) {
      hexCases.push([`civ:${civ}/${o}`, { coords: { q: 2, r: 2 }, terenBazowy: 'gory', nakladka: o }, { civ }]);
    }
    const riverMap = { riverPaths: [[{ q: 5, r: 4 }, { q: 6, r: 4 }]] };
    for (const [name, hex] of [['sąsiad-rzeki', { coords: { q: 4, r: 4 }, terenBazowy: 'laka', nakladka: 'brak' }], ['na-ścieżce', { coords: { q: 5, r: 4 }, terenBazowy: 'rownina', nakladka: 'brak' }], ['daleko', { coords: { q: 0, r: 0 }, terenBazowy: 'laka', nakladka: 'brak' }]]) {
      hexCases.push([`mapa:${name}`, hex, { map: riverMap }]);
    }
    hexCases.push(['wiele-ulepszeń', { coords: { q: 1, r: 0 }, terenBazowy: 'wzgorza', nakladka: 'las', rzeka: { obecna: true }, ulepszenia: ['tartak', 'droga', 'oboz_lowiecki', 'tartak'], zloze: 'glina' }, {}]);
    hexCases.push(['ulepszenie-pojedyncze', { coords: { q: 1, r: 0 }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'droga' }, {}]);
    const CITY = [
      {}, { cityName: 'Ateny <x>' }, { cityName: 'Sparta', cityIsCityState: true, cityOwnerLabel: 'Grecy & co', cityPopulation: 7.6 },
      { cityName: 'Rzym', cityIsCityState: false, cityPopulation: 0 }, { cityName: '', cityOwnerLabel: 'X' },
    ];
    const DN = pin['game/display-names.ts'];
    let nHex = 0;
    for (const [name, hex, o] of hexCases) {
      for (const [ci, city] of (nHex % 5 === 0 ? CITY : [CITY[nHex % 3]]).entries()) for (const worked of (nHex % 4 === 0 ? [false, true] : [nHex % 2 === 0])) {
        const base = { q: hex.coords.q, r: hex.coords.r, esc, hexWorkedForMagazyn: worked, ...city };
        const pinIn = { ...base, hex, currentEra: o.era, playerCivType: o.civ, map: o.map };
        const v2In = { ...base, view: hexView(hex, o), cityDisplayLabel: city.cityName ? DN.formatEntityDisplayName({ baseName: city.cityName, isCityState: city.cityIsCityState }) : null };
        delete v2In.cityIsCityState;
        cmpVal(M, `hex(${name})#${ci}/${worked}`, P.buildHexContextTooltipHtml(pinIn), V.buildHexContextTooltipHtml(v2In));
      }
      nHex++;
    }
    for (const [name, hex] of [['sam-heks', { coords: { q: 0, r: 0 }, rzeka: { obecna: true } }], ['sąsiad', { coords: { q: 4, r: 4 } }], ['brak', { coords: { q: 9, r: 9 } }]]) {
      cmpVal(M, `hexHasRiverAccess(${name}) — pin (v2: brak eksportu, reguła w Rust)`, P.hexHasRiverAccess(hex, riverMap), V.hexHasRiverAccess === undefined ? P.hexHasRiverAccess(hex, riverMap) : 'EKSPORT-W-V2');
    }
    assertV2(M, [['v2 nie eksportuje `hexHasRiverAccess` (reguła rzeki u sąsiada → Rust)', V.hexHasRiverAccess === undefined]]);
    // Karta jednostki.
    const ACTS = [{ id: 'fortify', label: 'Fortyfikuj', active: true }, { id: 'sentry', label: 'Czuwaj' }, { id: 'split', label: 'Rozdziel', disabled: true }, { id: 'disband', label: 'Rozwiąż <x>', danger: true }, { id: 'skip', label: 'Pomiń', primary: true }];
    const STACK = [
      { id: 'u1', name: 'Hoplita', icon: '', hp: 7.6, hpMax: 10, ruchLeft: 1, ruchMax: 2, active: true },
      { id: 'u2<x>', name: 'Łucznik & co', icon: '<svg></svg>', hp: 3, hpMax: 0, ruchLeft: 0, ruchMax: 0, active: false },
      { id: 'u3', name: 'Rydwan', icon: '', hp: 12, hpMax: 10, ruchLeft: 3, ruchMax: 2, active: false },
    ];
    const UNITS = [
      ['minimalna', { displayName: 'Wojownik', q: 0, r: 0, ruchLeft: 1, ruchMax: 1, k: 0 }],
      ['pełna', { displayName: 'Hoplita <b>', headMeta: '2 jednostki', ownerEmblemHtml: '<i>E</i>', q: 3, r: 4, ruchLeft: 1.5, ruchMax: 2, hp: 7.25, category: 'piechota', inGarnizon: true, ownerLabel: 'Grecy', relationLabel: 'Pokój', buildingBonusLabel: 'Pancerz +30% · Parametry +20%', parametryPathPp: 22, pancerzPathPp: 35, veteranProgress: { battlesSurvived: 5 }, veteranBadgeLabel: '★★ Doświadczony +10%', veteranStarsTooltip: 'Weteran', veteranPanelExplanation: 'Wyjaśnienie <x>', veteranExperienceLine: 'Bitwy: 5', sentry: true, ufortyfikowanyWPolu: true, oblegaCityName: 'Troja', zasieg: 2, expandable: true, actions: ACTS, k: 2 }],
      ['obca-readOnly', { displayName: 'Legion', q: 1, r: 1, ruchLeft: 0, ruchMax: 2, readOnly: true, ownerLabel: 'Rzym', relationLabel: 'Wojna', parametryPathPp: 10, k: 1, glodWojska: true, glodWojskaStatMult: 0.8, zlotoDeficyt: true, zlotoDeficytTurDoAtrycji: 2, poziomTrudnosciLabel: 'normalny' }],
      ['armia', { displayName: 'Armia (3)', q: 2, r: 2, ruchLeft: 1, ruchMax: 2, stackCards: STACK, actions: ACTS.slice(0, 3), expandable: true, k: 3, buildingBonusLabel: 'Pancerz +10%' }],
      ['armia-1', { displayName: 'Solo', q: 2, r: 2, ruchLeft: 1, ruchMax: 2, stackCards: STACK.slice(0, 1), k: 4, hp: 0 }],
      ['bez-akcji', { displayName: 'Zwiadowca', q: 0, r: 1, ruchLeft: 3, ruchMax: 3, actions: [], k: 5, veteranProgress: null, pancerzPathPp: 0 }],
    ];
    for (const [name, u] of UNITS) for (const expanded of [false, true]) {
      const c = combat(u.k);
      const base = { ...u, combat: c, expanded, esc };
      delete base.k;
      cmpVal(M, `unit(${name},${expanded})`, P.buildUnitContextTooltipHtml(base), V.buildUnitContextTooltipHtml({ ...base, fieldPower: fieldPower(c), badges: badges(base) }));
    }
    notMeasured(M, 'filtr „Możliwe ulepszenia” i rozbicie plonów po stronie „Rust” = transkrypcja kodu pinu na funkcjach pinu (zgodność z przyszłym silnikiem Rust — poza harnessem)');
  }

  // ─── 3. sidePanelHud.ts (kopia bajtowa) ───────────────────────────────────
  if (want('sidePanelHud.ts')) {
    const M = 'sidePanelHud.ts';
    const [P, V] = mods(M);
    const unitHtml = (S) => S === P ? pin['ui/hexContextTooltip.ts'].UNIT_CONTEXT_PANEL_CSS.length : 0;
    void unitHtml;
    const CFGS = [
      ['pusty', {}],
      ['wydarzenia', { events: EVENTS, link: true }],
      ['kontekst-heks', { events: EVENTS.slice(0, 2), ctx: { kind: 'hex', html: '<div class="cp-hero-names">Łąka</div>' } }],
      ['kontekst-jednostka', { events: [], ctx: { kind: 'unit', html: '<div class="sp-unit-card-body"><button data-sp-expand>Więcej</button><div class="sp-unit-stack-card" data-unit="u1" role="button" tabindex="0">A</div><button class="sp-act" data-act="fortify">F</button></div>', ownUnit: true, expandable: true, expandInHtml: true }, cycle: true }],
      ['kontekst-jednostka-obca', { events: EVENTS.slice(3), ctx: { kind: 'unit', html: '<b>Legion</b>', expandable: true }, cycle: false, expanded: true }],
      ['tylko-legacy-hex', { events: EVENTS.slice(4), legacyHex: '<p>Heks legacy</p>' }],
    ];
    for (const [name, c] of CFGS) {
      const api = {};
      const mk = (S, s) => {
        const cfg = {
          getEvents: c.events ? () => c.events : undefined,
          getContextPanel: c.ctx ? () => c.ctx : undefined,
          getHexContext: c.legacyHex ? () => c.legacyHex : undefined,
          onContextExpand: act('onContextExpand'), isContextExpanded: () => c.expanded === true, onContextAction: act('onContextAction'),
          onContextSelectUnit: act('onContextSelectUnit'), onContextCycleUnit: act('onContextCycleUnit'), canContextCycleUnit: () => c.cycle === true,
          onEventClick: act('onEventClick'), onEventDismiss: act('onEventDismiss'), onDismissAll: act('onDismissAll'),
          getEventLink: c.link ? (ev) => (ev.cityId || ev.hex ? { label: 'Pokaż <na> mapie →' } : null) : undefined,
        };
        api[s] = S.createSidePanelHud(cfg);
        document.body.append(api[s].el, api[s].ctxEl);
        api[s].update();
      };
      await explore(M, `panel(${name})`, mk, { P, V, cleanupP: () => api.pin?.destroy(), cleanupV: () => api.v2?.destroy(), keys: ['Escape', 'Enter'],
        after: (S, s) => api[s].update() });
    }
  }

  // ─── 4. preBattle.ts ──────────────────────────────────────────────────────
  if (want('preBattle.ts')) {
    const M = 'preBattle.ts';
    const [P, V] = mods(M);
    const DB = pin['game/defenseBreakdown.ts'];
    const civBonusy = (o) => (civsJson.cywilizacje[o % civsJson.cywilizacje.length]?.bonusy ?? []);
    const resolveSideBonusy = (side, explicit, get) => (explicit?.length ? explicit : (side.ownerId !== undefined && get ? get(side.ownerId) : []));
    const U = (n, k, o = {}) => ({ nazwa: n, kategoria: k, hp: 7, maxHp: 10, atak: 5, ...o });
    const units = [
      U('Hoplita', 'piechota'), U('Łucznik <x>', 'lucznik', { hp: 2, ilosc: 3 }), U('Jeźdźcy', 'kawaleria', { moc: 11, veteranBadge: '★★' }),
      U('Katapulta', 'machina', { hp: 0, maxHp: 0 }), U('Garnizon', 'garnizon'), U('A', 'x'), U('B', 'x'), U('C', 'x'), U('D', 'x', { hp: 1 }),
    ];
    const SIDE = (o) => ({ nazwa: 'Strona', units: units.slice(0, 3), ...o });
    const INFOS = [
      ['atak-gracza', { atakujacy: SIDE({ nazwa: 'Grecy', cywilizacja: 'Grecja', wodz: 'Leonidas', ownerId: 0, civId: 'grecy', era: 2 }), obronca: SIDE({ nazwa: 'Rzym <x>', ownerId: 1, civId: 'rzymianie', units: units }), teren: 'Łąka', szanseAtkPct: 71.6, tura: 12, modyfikatory: [{ tekst: 'Rzeka', wartosc: '−20%', typ: 'neg' }, { tekst: 'Wzgórze', typ: 'pos' }, { tekst: 'Noc' }] }],
      ['obrona-gracza', { atakujacy: SIDE({ nazwa: 'Barbarzyńcy', isBarbarian: true, ownerId: 9 }), obronca: SIDE({ nazwa: 'Ty', ownerId: 0, civId: 'egipcjanie' }), teren: 'Góry', szanseAtkPct: 30, canRetreat: false, defenderCanRetreat: true, werdykt: 'Ciężko' }],
      ['miasto-państwo', { atakujacy: SIDE({ nazwa: 'Ty', civId: 'grecy' }), obronca: SIDE({ nazwa: 'Sparta', isCityState: true, civId: 'grecy', ownerId: 5 }), teren: 'Pustynia', szanseAtkPct: 50, retreatExhaustedThisTurn: true, canRetreat: false, bonusyAtakujacy: civBonusy(3), bonusyObronca: [] }],
      ['bez-ownerów', { atakujacy: SIDE({ nazwa: 'A', units: [] }), obronca: SIDE({ nazwa: '', units: units.slice(5) }), teren: 'Morze', szanseAtkPct: 120, bonusyObronca: civBonusy(7) }],
      ['skrajne', { atakujacy: SIDE({ ownerId: 3, civId: 'nieznana', era: 9 }), obronca: SIDE({ ownerId: 4 }), teren: 'X', szanseAtkPct: -5, canRetreat: true, defenderCanRetreat: true }],
      ['próg-werdyktu', { atakujacy: SIDE({ nazwa: 'P', ownerId: 0 }), obronca: SIDE({ nazwa: 'Q', ownerId: 2 }), teren: 'Łąka', szanseAtkPct: 65 }],
      ['próg-werdyktu-obrona', { atakujacy: SIDE({ nazwa: 'P', ownerId: 0 }), obronca: SIDE({ nazwa: 'Q', ownerId: 2 }), teren: 'Łąka', szanseAtkPct: 35.4 }],
    ];
    const cfgFor = (S, getB, isMe) => S.configurePreBattle(S === P ? { getCivBonusy: getB, isMe, isOtherEndTurnModalOpen: () => false } : { isMe, isOtherEndTurnModalOpen: () => false });
    // „Rust”: bonusChips = bonusChipTexts(resolveSideBonusy(side, jawne, hak)) — po stronie v2 w danych strony.
    const toV2 = (info, getB, optsGet) => {
      const get = optsGet ?? getB;
      const v = { ...info };
      v.atakujacy = { ...info.atakujacy, bonusChips: DB.bonusChipTexts(resolveSideBonusy(info.atakujacy, info.bonusyAtakujacy, get)) };
      v.obronca = { ...info.obronca, bonusChips: DB.bonusChipTexts(resolveSideBonusy(info.obronca, info.bonusyObronca, get)) };
      delete v.bonusyAtakujacy;
      delete v.bonusyObronca;
      return v;
    };
    const suppressLog = [];
    v2['ui/armyStackHudSuppression.ts'].registerArmyStackHudSuppression((s) => suppressLog.push(s));
    for (const [name, info] of INFOS) for (const [hi, getB] of [undefined, civBonusy].entries()) for (const [di, opts] of [undefined, { defaultAction: 'auto' }, { getCivBonusy: (o) => civBonusy(o + 1) }].entries()) {
      if (hi === 0 && di === 2) continue;
      const isMe = name === 'skrajne' ? (o) => o === 4 : undefined;
      const cbs = (withSave) => ({ onAuto: act('onAuto'), onBattlefield: act('onBattlefield'), onCancel: act('onCancel'), onSave: withSave ? act('onSave', () => Promise.resolve(name !== 'skrajne')) : undefined });
      const mk = (S) => {
        cfgFor(S, getB, isMe);
        const o = opts ? { ...opts } : undefined;
        if (S === V && o) delete o.getCivBonusy;
        S.showPreBattle(S === P ? info : toV2(info, getB, opts?.getCivBonusy), cbs(di !== 1), o);
        actionLog.push('open=' + S.isPreBattleOpen());
      };
      await explore(M, `show(${name})#${hi}${di}`, mk, { P, V, cleanupP: () => P.hidePreBattle(), cleanupV: () => V.hidePreBattle(), keys: ['Enter', 'Escape', 'x'],
        after: async (S) => { await sleep(0); actionLog.push('open-po=' + S.isPreBattleOpen()); } });
    }
    // Kolejka automatycznych wywołań (inny modal końca tury otwarty / preBattle już otwarty).
    for (const blocking of [false, true]) {
      const run = (S) => {
        S.clearDeferredAutoPreBattleQueue();
        S.configurePreBattle({ getCivBonusy: undefined, isMe: undefined, isOtherEndTurnModalOpen: () => blocking });
        const i0 = S === P ? INFOS[0][1] : toV2(INFOS[0][1], undefined, undefined);
        const i1 = S === P ? INFOS[1][1] : toV2(INFOS[1][1], undefined, undefined);
        const cb = { onAuto: act('onAuto'), onBattlefield: act('onBattlefield'), onCancel: act('onCancel') };
        S.showPreBattle(i0, cb, { auto: true });
        S.showPreBattle(i1, cb, { auto: true });
        actionLog.push('pending=' + S.hasPendingAutoPreBattle() + ' age=' + S.oldestPendingAutoPreBattleAgeMs() + ' open=' + S.isPreBattleOpen());
        S.configurePreBattle({ isOtherEndTurnModalOpen: () => false });
        S.hidePreBattle();
        S.flushDeferredAutoPreBattle();
        actionLog.push('po-flush open=' + S.isPreBattleOpen() + ' pending=' + S.hasPendingAutoPreBattle());
        S.flushDeferredAutoPreBattle();
        actionLog.push('po-flush2 open=' + S.isPreBattleOpen() + ' pending=' + S.hasPendingAutoPreBattle());
      };
      await domCase(M, `kolejka-auto(${blocking})`, () => run(P), () => run(V), { cleanupPin: () => { P.hidePreBattle(); P.clearDeferredAutoPreBattleQueue(); }, cleanupV2: () => { V.hidePreBattle(); V.clearDeferredAutoPreBattleQueue(); } });
    }
    // Zapis z nakładki (toast) — po rozwiązaniu obietnicy.
    for (const ok of [true, false]) {
      const run = async (S) => {
        S.configurePreBattle({ getCivBonusy: undefined, isMe: undefined, isOtherEndTurnModalOpen: () => false });
        const info = S === P ? INFOS[0][1] : toV2(INFOS[0][1], undefined, undefined);
        S.showPreBattle(info, { onAuto: act('onAuto'), onBattlefield: act('onBattlefield'), onCancel: act('onCancel'), onSave: act('onSave', () => Promise.resolve(ok)) });
        fire(document.querySelector('[data-act="save"]'), 'click');
        await sleep(5);
      };
      await domCase(M, `zapis(${ok})`, () => run(P), () => run(V), { cleanupPin: () => P.hidePreBattle(), cleanupV2: () => V.hidePreBattle() });
    }
    suppressLog.length = 0;
    V.configurePreBattle({ isOtherEndTurnModalOpen: () => false });
    V.showPreBattle(toV2(INFOS[0][1], undefined, undefined), { onAuto() {}, onBattlefield() {}, onCancel() {} });
    V.hidePreBattle();
    // Pin `preBattle.ts:250,263,278`: `showPreBattle` woła najpierw `hidePreBattle()` (→ false), potem `true`; `hidePreBattle` → false.
    assertV2(M, [[`most ukrycia rosteru armii: pokaż → [false, true], ukryj → false (${JSON.stringify(suppressLog)})`, JSON.stringify(suppressLog) === '[false,true,false]']]);
    resetDoc();
    notMeasured(M, 'efekt `setArmyStackHudSuppressed` na panelu rosteru armii (`hud.ts`, poza paczką) — v2: asercja wywołania mostu; pin: `hud.ts` bez zamontowanego panelu nie zmienia DOM');
    notMeasured(M, 'muzyka nakładki (`startPreBattleMusic`/`stopPreBattleMusic`) — pin: odtwarzacz nie gra (muzyka gry nie uruchomiona), v2: usługa audio niezainstalowana; nie wpływa na DOM');
  }

  // ─── C2: „Rust” — zapytania koszyka PW (DiplomacyQueriesProvider) i DTO stanu audiencji ─────
  const TV = pin['game/diplomacy-trade-validation.ts'];
  const AOB = pin['game/diplomacy-ai-offer-balance.ts'];
  const WG = pin['game/diplomacy-war-gates.ts'];
  const TEMPO = Object.keys(pin['game/tech-tempo.ts'].TEMPO_GRY);
  /** Kontekst modala bieżącego przypadku — hak `tradeFairnessPreview` pinu = bramka PW, którą w v2 liczy „Rust” (P5.2). */
  let scenarioCtx = null;
  const relDeal = (t) => ({
    total: t, modPct: E.relationPnModPct(E.relationSignedFromTotal(t)), modLabel: E.formatRelationModLabel(t),
    tradeFairMult: 100 / Math.max(1, t), tradeParity: t >= 100, signed: E.relationSignedFromTotal(t),
  });
  // Panel PW koszyka = formuła `run.mjs` (P5.2) ↔ pin `renderPnBalancePanelFromBasket(give, recv, rel, label, fp)`.
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
  // Panel traktatu = formuła `run.mjs` (P5.2) ↔ pin `renderPnBalancePanelForTreaty(playerPw, give, recv, rel, label, relReq, meta, base, partnerPw)`.
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
  // Wycena strony = pin `diplomacySumPn(toPnItems(items, ctx), basketPnOpts(ctx, side, mode, turns))` (`diplomacyTradeBasket.ts:190-227`).
  const sumPn = (q) => {
    const tempo = q.ctx.tempoGry ?? 'standardowa';
    const perTurn = q.resourceTradeMode === 'per_turn';
    return VC.diplomacySumPn(q.items.map((i) => ({ typ: i.typ, id: i.id, ilosc: i.ilosc, tempo })), {
      difficulty: q.ctx.difficulty ?? 'normal', proposerOwnerId: 0, playerOwnerId: 0, side: q.side, tempo, perTurn,
      turnsMultiplier: perTurn ? Math.max(1, q.dealTurns) : 1,
    });
  };
  const queryLog = [];
  const provider = {
    basketSumPn: (q) => { queryLog.push('basketSumPn'); return sumPn(q); },
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
    validateTradeBasketSides: (m, g, r) => TV.validateTradeBasketSides(m, g, r),
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
    normalizeSurowiecIlosc: (id, q, m) => VC.diplomacyNormalizeSurowiecIlosc(id, q, m),
    stripWithdrawnResourceAccessItems: (i) => PR.stripWithdrawnResourceAccessItems(i),
    proposalHasResourceAccess: (p) => PR.proposalHasResourceAccess(p),
  };
  v2['controller/diplomacyQueries.ts'].installDiplomacyQueries(provider);

  // Fikstury kontekstu modala (NegotiationModalContext) — te same obiekty po obu stronach.
  const TECHS = techJson.technologie.map((t) => t.Technologia);
  const techOpt = (ids) => ids.map((id, i) => ({ id, label: id + (i === 1 ? ' <x>' : ''), suggestedPrice: i === 2 ? 0 : 20 + i * 5 }));
  const qtyKeys = Object.keys(VC.diplomacyHandelSurowceCatalog());
  const QTY = (keys, max) => keys.map((id, i) => ({ id, label: id, maxQty: max[i] ?? 50 }));
  const CTXS = {
    pelny: {
      civName: 'Rzym <x>', relacjaTotal: 140, trustPnGainedThisTurn: 2, tempoGry: TEMPO[0], difficulty: 'hard', playerSkarbiec: 340.7,
      rivalOptions: [{ ownerId: 2, label: 'Egipt' }, { ownerId: 3, label: 'Persja & co' }], techOptions: techOpt(TECHS.slice(8, 10)),
      giveTechOptions: techOpt(TECHS.slice(0, 4)), receiveTechOptions: techOpt(TECHS.slice(4, 7)),
      giveQuantityResourceOptions: QTY(qtyKeys.slice(0, 4), [120, 3, 2500, 7]), receiveQuantityResourceOptions: QTY(qtyKeys.slice(2, 6), [40, 9, 1234567, 0]),
      borderFeeCivil: 25, borderFeeMilitary: 55, wchloniecieGoldRequired: 260, progHandelRelacja: 100, progDarRelacja: 30,
      tradeFairnessPreview: (g, r) => ({ accepted: g >= r * 0.8, pwBalance: Math.round(g - r * 0.8) }),
    },
    sredni: {
      civName: 'Grecy', relacjaTotal: 100, trustPnGainedThisTurn: 0, tempoGry: TEMPO[1], difficulty: 'normal', playerSkarbiec: 50,
      giveTechOptions: [], receiveTechOptions: techOpt(TECHS.slice(10, 12)), giveQuantityResourceOptions: QTY(qtyKeys.slice(1, 3), [12, 100]),
      receiveQuantityResourceOptions: [], aiCounterOffer: 'Chcemy <więcej> & szybciej',
    },
    niskaRel: { civName: 'Persja', relacjaTotal: 25, trustPnGainedThisTurn: 4, difficulty: 'easy', playerSkarbiec: 0, progDarRelacja: 30 },
    wojna: { civName: 'Egipt', relacjaTotal: 120, atWar: true, playerSkarbiec: 999, giveQuantityResourceOptions: QTY(qtyKeys.slice(0, 2), [5, 5]), tradeFairnessPreview: () => ({ accepted: false }) },
    minimalny: { civName: 'X' },
    // Limit Zaufania/turę prawie wyczerpany + duża nadwyżka → dopisek „(limit N/turę, już +M)” (pin `:1929-1931,1990-1992`).
    limit: { civName: 'Limit', relacjaTotal: 100, trustPnGainedThisTurn: Math.max(0, VC.diplomacyPnRelacjaParams().max_zaufanie_na_ture - 1), playerSkarbiec: 5000, progDarRelacja: 30 },
  };
  const ACTION = (id, label, o = {}) => ({ id, label, enabled: true, ...o });

  // ─── 5. diplomacyNegotiationModal.ts ──────────────────────────────────────
  if (want('diplomacyNegotiationModal.ts')) {
    const M = 'diplomacyNegotiationModal.ts';
    const [P, V] = mods(M);
    for (const id of ['1', '2', '5', '6', '7', '9', '10', '13', '14', 'x']) cmpVal(M, `actionNeedsNegotiation(${id})`, P.actionNeedsNegotiation(id), V.actionNeedsNegotiation(id));
    const PAYLOADS = [
      { actionId: '13' }, { actionId: '14', isGift: true }, { actionId: '3' }, { actionId: '3', allianceKind: 'defensywny' }, { actionId: '8' },
      { actionId: '8', tributeMode: 'offer' }, ...['2', '4', '5', '6', '7', '9', '10', '12', '14', '15', '99'].map((a) => ({ actionId: a })),
    ];
    for (const p of PAYLOADS) cmpVal(M, `proposalActionIdFromPayload(${JSON.stringify(p)})`, P.proposalActionIdFromPayload(p), V.proposalActionIdFromPayload(p));
    const IDS = [['2', 'Pakt'], ['3', 'Sojusz'], ['4', 'Przemarsz'], ['5', 'Traktat handlowy'], ['6', 'Technologia'], ['7', 'Namów <x>'], ['8', 'Trybut'], ['9', 'Ultimatum'], ['10', 'Pokój'], ['12', 'Wasal'], ['13', 'Dar'], ['14', 'Wymiana'], ['99', 'Inna']];
    for (const [id, label] of IDS) for (const cn of (['6', '7', '8', '2'].includes(id) ? ['pelny', 'sredni', 'minimalny'] : ['pelny'])) {
      const ctx = CTXS[cn];
      const mk = (S) => { S.showNegotiationModal(ACTION(id, label), ctx, act('onPreview', { accepted: true }), act('onAccept'), act('onCancel')); };
      await explore(M, `modal(${id},${cn})`, mk, { P, V, cleanupP: () => P.hideNegotiationModal(), cleanupV: () => V.hideNegotiationModal(), keys: ['Escape'], maxClicks: 30 });
      // Wypełnienie pól + „Zaproponuj” (payload z wartościami formularza).
      const run = (S) => {
        S.showNegotiationModal(ACTION(id, label), ctx, act('onPreview', { accepted: true }), act('onAccept'), act('onCancel'));
        document.querySelectorAll('input[type="number"]').forEach((el, i) => { el.value = String(5 + i * 7); });
        document.querySelectorAll('select').forEach((el) => { el.value = el.options[el.options.length - 1]?.value ?? ''; el.dispatchEvent(new W.Event('change', { bubbles: true })); });
        document.querySelectorAll('input[type="checkbox"]').forEach((el) => { el.checked = true; });
        fire(document.querySelector('.cdn-submit'), 'click');
      };
      await domCase(M, `modal(${id},${cn}):wypełnij+zaproponuj`, () => run(P), () => run(V), { cleanupPin: () => P.hideNegotiationModal(), cleanupV2: () => V.hideNegotiationModal() });
    }
    await domCase(M, 'hideNegotiationModal', () => { P.showNegotiationModal(ACTION('6', 'T'), CTXS.pelny, act('p'), act('a'), act('c')); P.hideNegotiationModal(); },
      () => { V.showNegotiationModal(ACTION('6', 'T'), CTXS.pelny, act('p'), act('a'), act('c')); V.hideNegotiationModal(); });
  }

  // ─── 6. diplomacyTradeBasket.ts ───────────────────────────────────────────
  const GIVE = [{ typ: 'zloto', id: 'zloto', ilosc: 30 }, { typ: 'surowiec_ilosc', id: qtyKeys[0], ilosc: 10 }, { typ: 'tech', id: TECHS[0] }];
  const RECV = [{ typ: 'surowiec_ilosc', id: qtyKeys[2], ilosc: 15 }, { typ: 'praca', id: 'praca', ilosc: 5 }, { typ: 'zywnosc', id: 'zywnosc', ilosc: 12 }];
  const ACCESS = [{ typ: 'surowiec_boolean', id: 'kon' }, { typ: 'zloze', id: 'sol' }];
  if (want('diplomacyTradeBasket.ts')) {
    const M = 'diplomacyTradeBasket.ts';
    const [P, V] = mods(M);
    for (const id of ['2', '5', '6', '13', '14', '15', '99']) {
      cmpVal(M, `isTreatyOnlyFormAction(${id})`, P.isTreatyOnlyFormAction(id), V.isTreatyOnlyFormAction(id));
      cmpVal(M, `getTradeBasketMode(${id})`, P.getTradeBasketMode(id), V.getTradeBasketMode(id));
      cmpVal(M, `actionUsesTradeBasket(${id})`, P.actionUsesTradeBasket(id), V.actionUsesTradeBasket(id));
    }
    cmpVal(M, 'TRADE_BASKET_ACTION_IDS', [...P.TRADE_BASKET_ACTION_IDS], [...V.TRADE_BASKET_ACTION_IDS]);
    cmpVal(M, 'defaultSzlakiTreatyPayload', P.defaultSzlakiTreatyPayload(), V.defaultSzlakiTreatyPayload());
    for (const [m, g, r] of [['gift', [], []], ['gift', GIVE, []], ['trade', [], []], ['trade', [], RECV], ['treaty', [], []]]) {
      cmpVal(M, `validateTradeBasketSides(${m},${g.length},${r.length})`, P.validateTradeBasketSides(m, g, r), V.validateTradeBasketSides(m, g, r));
    }
    for (const cn of Object.keys(CTXS)) {
      const ctx = CTXS[cn];
      scenarioCtx = ctx;
      for (const side of ['give', 'receive']) for (const [mode, aid, tm] of [['trade', '14'], ['gift', '13'], ['treaty', '8', 'offer'], ['treaty', '10'], ['trade', '9']]) {
        cmpVal(M, `computeAvailableTypes(${cn},${side},${mode},${aid},${tm})`, P.computeAvailableTypes(side, ctx, mode, aid, tm), V.computeAvailableTypes(side, ctx, mode, aid, tm));
        for (const it of [...GIVE, ...RECV, ...ACCESS]) {
          cmpVal(M, `basketItemEditAvailable(${cn},${side},${mode},${it.typ})`, P.basketItemEditAvailable(it, side, ctx, mode, aid, tm), V.basketItemEditAvailable(it, side, ctx, mode, aid, tm));
        }
        cmpVal(M, `buildAddForm(${cn},${side},${mode},${aid})`, P.buildAddForm(side, ctx, mode, aid, tm, undefined, side === 'give' ? GIVE : RECV), V.buildAddForm(side, ctx, mode, aid, tm, undefined, side === 'give' ? GIVE : RECV));
        const list = side === 'give' ? GIVE : RECV;
        cmpVal(M, `buildAddForm-edycja(${cn},${side},${mode},${aid})`, P.buildAddForm(side, ctx, mode, aid, tm, { item: list[1], idx: 1 }, list), V.buildAddForm(side, ctx, mode, aid, tm, { item: list[1], idx: 1 }, list));
      }
      for (const [li, list] of [GIVE, RECV, [...GIVE, ...RECV]].entries()) for (const it of [...GIVE, ...RECV, { typ: 'surowiec_ilosc', id: qtyKeys[0], ilosc: 9999 }, { typ: 'zloto', id: 'zloto', ilosc: 9999 }, { typ: 'tech', id: TECHS[0] }]) for (const side of ['give', 'receive']) {
        cmpVal(M, `addOrMerge(${cn},${li},${it.typ}:${it.id}:${it.ilosc},${side})`, P.addOrMergeBasketItem(list, it, side, ctx), V.addOrMergeBasketItem(list, it, side, ctx));
        for (const ei of [0, 1]) cmpVal(M, `applyEdit(${cn},${li},${ei},${it.typ},${side})`, P.applyBasketItemEdit(list, ei, it, side, ctx), V.applyBasketItemEdit(list, ei, it, side, ctx));
      }
      for (const [mode, aid] of [['trade', '14'], ['gift', '13'], ['treaty', '2'], ['treaty', '8'], ['treaty', '15'], ['trade', '9']]) for (const [gi, g] of [[], GIVE, GIVE.slice(0, 1), [...ACCESS]].entries()) for (const [ri, r] of [[], RECV, RECV.slice(1)].entries()) for (const [turns, rtm] of [[15, 'once'], [5, 'per_turn'], [0, 'per_turn'], [25, 'once']]) {
        cmpVal(M, `validateTradeBasketForm(${cn},${mode},${aid},${gi},${ri},${turns},${rtm})`, P.validateTradeBasketForm(mode, aid, g, r, ctx, turns, rtm), V.validateTradeBasketForm(mode, aid, g, r, ctx, turns, rtm));
      }
    }
    // readItemFromForm: formularz „Dodaj” z wartościami pól.
    for (const cn of ['pelny', 'sredni']) for (const side of ['give', 'receive']) for (const typ of ['zloto', 'praca', 'zywnosc', 'tech', 'surowiec_ilosc', 'zloze', 'nieznany']) for (const qty of ['0', '7', '13', '-2']) {
      const ctx = CTXS[cn];
      const run = (S) => {
        const box = document.createElement('div');
        box.innerHTML = S.buildAddForm(side, ctx, 'trade', '14', undefined, undefined, []);
        document.body.appendChild(box);
        const prefix = side === 'give' ? 'give' : 'recv';
        const t = box.querySelector(`.cdb-typ[data-side="${prefix}"]`);
        if (t) t.value = typ;
        box.querySelectorAll('input[type="number"]').forEach((el) => { el.value = qty; });
        actionLog.push('item=' + JSON.stringify(S.readItemFromForm(side, box, ctx)));
      };
      await domCase(M, `readItemFromForm(${cn},${side},${typ},${qty})`, () => run(P), () => run(V));
    }
    // Modal koszyka: tryby × akcje × konteksty × koszyki startowe — eksploracja (klik, pole, klawisz).
    const SCEN = [
      ['trade', '14', 'pelny', undefined], ['trade', '14', 'pelny', { giveItems: GIVE, receiveItems: RECV }],
      ['trade', '14', 'sredni', { giveItems: GIVE.slice(0, 2), receiveItems: [], resourceTradeMode: 'per_turn', turns: 7 }],
      ['trade', '14', 'niskaRel', { giveItems: GIVE }], ['trade', '14', 'wojna', { giveItems: [...GIVE, ...ACCESS], receiveItems: RECV }],
      ['trade', '14', 'minimalny', { giveItems: [GIVE[1]], receiveItems: [RECV[0]], resourceTradeMode: 'per_turn', turns: 40 }],
      ['trade', '14', 'pelny', { giveItems: [...ACCESS, GIVE[0]], receiveItems: [ACCESS[0], RECV[1]] }],
      ['trade', '14', 'limit', { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 900 }], receiveItems: [{ typ: 'praca', id: 'praca', ilosc: 1 }] }],
      ['gift', '13', 'limit', { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 900 }] }],
      ['gift', '13', 'pelny', { giveItems: GIVE }], ['gift', '13', 'niskaRel', { giveItems: GIVE }], ['gift', '13', 'sredni', undefined],
      ['treaty', '2', 'pelny', undefined], ['treaty', '2', 'sredni', { turns: 7, giveItems: GIVE.slice(0, 1) }], ['treaty', '3', 'pelny', { allianceKind: 'defensywny' }],
      ['treaty', '4', 'pelny', { borderMilitary: true, barbarianCooperation: true, treatyTurns: 3 }], ['treaty', '4', 'sredni', undefined],
      ['treaty', '5', 'pelny', { treatyTurns: 0, giveItems: GIVE.slice(0, 1), receiveItems: RECV.slice(0, 1) }], ['treaty', '5', 'sredni', { turns: 7 }],
      ['treaty', '6', 'pelny', undefined], ['treaty', '6', 'pelny', { techDirection: 'buy', techPaymentMode: 'tech' }], ['treaty', '6', 'sredni', { techDirection: 'buy' }],
      ['treaty', '7', 'pelny', { bribeGold: 70 }], ['treaty', '7', 'minimalny', undefined], ['treaty', '8', 'pelny', { tributeMode: 'offer', goldPerTurn: 25, tributeTurns: 6 }],
      ['treaty', '8', 'wojna', undefined], ['treaty', '9', 'pelny', { goldOnce: 80, giveItems: GIVE.slice(0, 1) }], ['treaty', '10', 'pelny', { giveItems: GIVE, receiveItems: RECV }],
      ['treaty', '10', 'wojna', { giveItems: GIVE.slice(0, 1) }], ['treaty', '12', 'pelny', undefined], ['treaty', '15', 'pelny', { goldOnce: 100 }], ['treaty', '15', 'minimalny', undefined],
    ];
    for (const [si, [mode, aid, cn, initial]] of SCEN.entries()) {
      const ctx = CTXS[cn];
      const mo = si % 3 === 0 ? { dialogTitle: 'Tytuł <x>', submitLabel: 'Wyślij & co' } : undefined;
      const mk = (S) => { scenarioCtx = ctx; S.showTradeBasketModal(mode, ACTION(aid, 'Akcja ' + aid), ctx, act('onSubmit'), act('onCancel'), initial, mo); };
      await explore(M, `koszyk#${si}(${mode},${aid},${cn})`, mk, { P, V, cleanupP: () => P.hideTradeBasketModal(), cleanupV: () => V.hideTradeBasketModal(), keys: ['Escape'], maxClicks: 70,
        fill: (el) => (el.tagName === 'SELECT' ? (el.options[el.options.length - 1]?.value ?? '') : el.type === 'number' ? String(3 + (el.className.length % 17)) : 'x') });
    }
    // Sekwencje: dodanie pozycji (typ → wartość → „Dodaj”), edycja, zmiana ilości, wyrównanie, wysłanie.
    const SEQ = [
      ['trade-dodaj-złoto+surowiec', 'trade', '14', 'pelny', undefined, [
        { do: 'click', sel: '.cdb-chip-typ[data-value="zloto"][data-side="give"]' }, { do: 'value', sel: '.cdb-qty[data-side="give"]', value: '45' },
        { do: 'click', sel: '.cdb-add-btn[data-side="give"]' }, { do: 'click', sel: '.cdb-chip-typ[data-value="surowiec_ilosc"][data-side="recv"]' },
        { do: 'click', sel: '.cdb-chip-resqty[data-side="recv"]', idx: 1 }, { do: 'value', sel: '.cdb-res-qty-num[data-side="recv"]', value: '23' },
        { do: 'click', sel: '.cdb-add-btn[data-side="recv"]' }, { do: 'click', sel: '.cdb-balance-btn' }, { do: 'click', sel: '.cdb-submit' }]],
      ['trade-tech+edycja+ilość', 'trade', '14', 'pelny', { giveItems: GIVE, receiveItems: RECV }, [
        { do: 'click', sel: '.cdb-edit-item[data-side="give"]', idx: 0 }, { do: 'value', sel: '.cdb-qty[data-side="give"]', value: '12' },
        { do: 'click', sel: '.cdb-add-btn[data-side="give"]' }, { do: 'click', sel: '.cdb-row-qty-step', idx: 1 }, { do: 'value', sel: '.cdb-row-qty-inp', idx: 2, value: '999' },
        { do: 'click', sel: '.cdb-chip-mode[data-value="per_turn"]' }, { do: 'click', sel: '.cdb-chip-turn', idx: 1 }, { do: 'click', sel: '.cdb-rm', idx: 0 },
        { do: 'click', sel: '.cdb-war-threat-cb' }, { do: 'click', sel: '.cdb-submit' }]],
      ['gift-dodaj+wyślij', 'gift', '13', 'pelny', undefined, [
        { do: 'click', sel: '.cdb-chip-typ[data-value="zywnosc"][data-side="give"]' }, { do: 'value', sel: '.cdb-food-qty[data-side="give"]', value: '40' },
        { do: 'click', sel: '.cdb-add-btn[data-side="give"]' }, { do: 'click', sel: '.cdb-submit' }]],
      ['traktat-8-tryb+kwota', 'treaty', '8', 'pelny', undefined, [
        { do: 'value', sel: '.cdb-treaty-trib-mode', value: 'offer' }, { do: 'value', sel: '.cdb-treaty-gpt', value: '33' }, { do: 'value', sel: '.cdb-treaty-trib-turns', value: '4' },
        { do: 'click', sel: '.cdb-submit' }]],
      ['traktat-2-czas', 'treaty', '2', 'pelny', undefined, [
        { do: 'click', sel: '.cdb-chip-turn', idx: 2 }, { do: 'click', sel: '.cdb-qty-step', idx: 0 }, { do: 'value', sel: '.cdb-treaty-turns', value: '0' },
        { do: 'click', sel: '.cdb-chip-typ[data-value="tech"][data-side="give"]' }, { do: 'click', sel: '.cdb-add-btn[data-side="give"]' }, { do: 'click', sel: '.cdb-submit' }]],
      ['traktat-4-barb', 'treaty', '4', 'pelny', undefined, [
        { do: 'click', sel: '.cdb-treaty-barb' }, { do: 'click', sel: '.cdb-chip-barbturns', idx: 1 }, { do: 'click', sel: '.cdb-treaty-mil' }, { do: 'click', sel: '.cdb-submit' }]],
      ['traktat-6-kupno-tech', 'treaty', '6', 'pelny', undefined, [
        { do: 'click', sel: '.cdb-treaty-tech-dir[data-value="buy"]' }, { do: 'click', sel: '.cdb-treaty-tech-pay[data-value="tech"]' },
        { do: 'value', sel: '.cdb-treaty-tech-offer', value: TECHS[2] }, { do: 'click', sel: '.cdb-submit' }]],
      ['traktat-10-pokój', 'treaty', '10', 'pelny', { giveItems: GIVE, receiveItems: RECV }, [{ do: 'click', sel: '.cdb-row-qty-step', idx: 0 }, { do: 'click', sel: '.cdb-submit' }]],
      ['traktat-15-za-mało', 'treaty', '15', 'pelny', undefined, [{ do: 'value', sel: '.cdb-treaty-wchlon-gold', value: '10' }, { do: 'click', sel: '.cdb-submit' }, { do: 'value', sel: '.cdb-treaty-wchlon-gold', value: '400' }, { do: 'click', sel: '.cdb-submit' }]],
      ['trade-tło', 'trade', '14', 'sredni', undefined, [{ do: 'click', sel: '.civ-diplo-basket-overlay' }]],
    ];
    for (const [name, mode, aid, cn, initial, steps] of SEQ) {
      const ctx = CTXS[cn];
      await sequence(M, `sekwencja(${name})`, (S) => { scenarioCtx = ctx; S.showTradeBasketModal(mode, ACTION(aid, 'Akcja ' + aid), ctx, act('onSubmit'), act('onCancel'), initial); }, steps,
        { P, V, cleanupP: () => P.hideTradeBasketModal(), cleanupV: () => V.hideTradeBasketModal() });
    }
    for (const cn of Object.keys(CTXS)) {
      const ctx = CTXS[cn];
      const mk = (S) => { scenarioCtx = ctx; S.openQuickDealBasket(ACTION('14', 'Szybka'), ctx, act('onSubmit'), act('onCancel')); };
      await explore(M, `szybka-umowa(${cn})`, mk, { P, V, cleanupP: () => P.hideTradeBasketModal(), cleanupV: () => V.hideTradeBasketModal(), maxClicks: 20 });
    }
    queryLog.length = 0;
    scenarioCtx = CTXS.pelny;
    V.showTradeBasketModal('trade', ACTION('14', 'W'), CTXS.pelny, () => {}, () => {}, { giveItems: GIVE, receiveItems: RECV });
    fire(document.querySelector('.cdb-balance-btn'), 'click');
    V.hideTradeBasketModal();
    V.showTradeBasketModal('treaty', ACTION('2', 'P'), CTXS.pelny, () => {}, () => {});
    V.hideTradeBasketModal();
    resetDoc();
    assertV2(M, [
      [`v2 woła zapytania Rust: basketSummary (${queryLog.filter((q) => q === 'basketSummary').length}), treatyBasketSummary (${queryLog.filter((q) => q === 'treatyBasketSummary').length}), basketSumPn (${queryLog.filter((q) => q === 'basketSumPn').length})`,
        queryLog.includes('basketSummary') && queryLog.includes('treatyBasketSummary') && queryLog.includes('basketSumPn')],
    ]);
    notMeasured(M, 'pola `validation`/`currencyForbiddenWar`/`treatyPw` w wyniku `basketSummary` — UI ich nie czyta (wartości atrapy harnessu)');
  }

  // ─── 7. diplomacyAudience.ts ──────────────────────────────────────────────
  if (want('diplomacyAudience.ts')) {
    const M = 'diplomacyAudience.ts';
    const [P, V] = mods(M);
    const sides = (aid, payload, rel, incoming) => AP.computePlayerAcceptanceSides(aid, payload, rel, incoming);
    const ROWS = (rel) => {
      const p1 = { giveItems: GIVE.slice(0, 2), receiveItems: RECV.slice(0, 1) };
      const s1 = sides('handel', p1, rel, false);
      const p2 = { turns: 15, treatyTurns: 15 };
      const s2 = sides('nap', p2, rel, true);
      const p3 = { giveItems: [], receiveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 50 }], isGift: true };
      const s3 = sides('handel', p3, rel, true);
      const p4 = { treatyTurns: 10, giveItems: GIVE.slice(0, 1) };
      const s4 = sides('umowa_szlakow', p4, rel, false);
      const p5 = { giveItems: [ACCESS[0]], receiveItems: RECV.slice(1, 2) };
      const s5 = sides('handel', p5, rel, true);
      const p6 = { giveItems: [{ typ: 'tech', id: TECHS[0] }], receiveItems: [] };
      const s6 = sides('handel', p6, rel, false);
      return [
        { id: 'n1', direction: 'own', actionLabel: 'Umowa wymiany', summary: 'Wymiana', dealPayload: p1, counterInitial: { giveItems: p1.giveItems, receiveItems: p1.receiveItems }, round: 1, maxRounds: 3, expiresInTurns: 2, canCounter: true, uiActionId: '14', acceptanceMy: s1.my, acceptanceTheir: s1.their },
        { id: 'n2', direction: 'incoming', actionLabel: 'Pakt nieagresji', summary: 'NAP 15 tur', dealPayload: p2, round: 2, maxRounds: 3, expiresInTurns: 0, canCounter: true, uiActionId: '2', canAccept: true, responderPreview: { accepted: true, pwBalance: 4 }, acceptanceMy: s2.my, acceptanceTheir: s2.their },
        { id: 'n3', direction: 'incoming', actionLabel: 'Dar', summary: '50 ¤', dealPayload: p3, round: 1, maxRounds: 3, expiresInTurns: 1, canCounter: false, uiActionId: '13', isGift: true, responderPreview: { accepted: true }, acceptanceMy: s3.my, acceptanceTheir: s3.their },
        { id: 'n4', direction: 'own', actionLabel: 'Traktat handlowy', summary: 'Szlaki', dealPayload: p4, round: 1, maxRounds: 3, expiresInTurns: 3, canCounter: true, uiActionId: '5', awaitingAiResponse: true, responderPreview: { accepted: false, reason: 'Za mało <PW>', pwBalance: -12 }, acceptanceMy: s4.my, acceptanceTheir: s4.their },
        { id: 'n5', direction: 'incoming', actionLabel: 'Wymiana (dostęp)', summary: 'Stary dostęp', dealDetails: 'Dostęp & sztuki', dealPayload: p5, round: 1, maxRounds: 2, expiresInTurns: 5, canCounter: true, uiActionId: '14', responderPreview: { accepted: false, reason: 'Wycofane' }, acceptanceMy: s5.my, acceptanceTheir: s5.their },
        { id: 'n6', direction: 'own', actionLabel: 'Umowa wymiany 2', summary: 'Tech', dealPayload: p6, round: 1, maxRounds: 3, expiresInTurns: 4, canCounter: true, uiActionId: '14', acceptanceMy: s6.my, acceptanceTheir: s6.their },
        { id: 'n7', direction: 'own', actionLabel: 'Bez payloadu', summary: 'Tekst <fallback>', round: 1, maxRounds: 3, expiresInTurns: 1, canCounter: false, uiActionId: '7' },
      ];
    };
    const ACTIONS = [
      ACTION('1', 'Nawiązanie kontaktu'), ACTION('2', 'Pakt o nieagresji', { opis: 'Opis NAP' }), ACTION('3', 'Sojusz', { enabled: false, locked: true, lockNote: 'zablokowana — wymaga Zaufania 91 (masz 34)', tooltip: 'Opis sojuszu <x>' }),
      ACTION('4', 'Przemarsz'), ACTION('5', 'Traktat handlowy'), ACTION('6', 'Technologia', { active: true }), ACTION('7', 'Namów do wojny', { enabled: false, tooltip: 'Brak wrogów' }),
      ACTION('8', 'Trybut'), ACTION('9', 'Ultimatum'), ACTION('10', 'Pokój'), ACTION('11', 'Wojna'), ACTION('12', 'Wasalizacja', { enabled: false }), ACTION('13', 'Dar'),
      ACTION('14', 'Umowa wymiany'), ACTION('15', 'Wchłonięcie', { enabled: false, locked: true }),
    ];
    const PEN = { lines: [{ kind: 'wiarygodnosc', delta: -10, reason: 'Zerwanie <paktu>' }, { kind: 'zaufanie', delta: -20, reason: 'Zdrada' }, { kind: 'info', delta: 0, reason: 'Info' }], wiarygodnoscTotal: -10, zaufanieTotal: -20 };
    const rozb = { startowa: 20, trwalyZyciorys: -5.25, biezaceUczynki: 3, strumien: 1.5, razem: 18 };
    const STATES = {
      pelny: () => ({
        playerTitle: 'Król <x>', playerCivName: 'Grecy', otherTitle: 'Cesarz', otherCivName: 'Rzymianie', zaufanie: 62, respekt: 48, tier: 3, layer: 'full',
        contactEstablished: true, actions: ACTIONS, relacjaTotal: 110, zaufanieDeltaPerTurn: 1.5, relacjaDeltaPerTurn: -0.25, trustPnGainedThisTurn: 2, progDarRelacja: 30,
        playerPower: 120, otherPower: 80, powerRatioLabel: '3:2', activeTreaties: [{ id: 'd1', label: 'Pakt nieagresji', sinceTurns: 4, breakPenaltyLabel: '−20 Zaufania' }, { label: 'Umowa handlowa', detail: 'szlaki <x>' }, { id: 'd3', label: 'Sojusz wojskowy' }],
        formalStatus: { label: 'Pakt', kind: 'pakt' }, formalStatusDetail: { sinceTurns: 4, breakPenaltyLabel: '−30 Relacji' }, personalityTags: ['Kupiec', 'Ostrożny <x>'],
        otherEpochLabel: 'Brąz', otherIkonaId: 'rzymianie', otherWodz: 'Cezar', otherEra: 2, otherKolorHex: '#aa2222', otherCultureLabel: 'Łacińska', cultureCircleSame: false,
        thresholds: { sojuszZaufanie: 70 }, relationBreakdown: { pozytywne: [{ label: 'Handel', value: 5, perTurn: true }, { label: 'Dar', value: 2.5 }], negatywne: [{ label: 'Wojna <x>', value: -10 }] },
        playerIkonaId: 'grecy', playerWodz: 'Perykles', playerKolorHex: '#2244aa', playerEra: 2, playerWiarygodnosc: 37.6, playerWiarygodnoscRozbicie: rozb,
        playerWiarygodnoscBreakdown: { pozytywne: [{ label: 'Dotrzymane umowy', value: 4.25 }, { label: 'Strumień', value: 0.5, perTurn: true }], negatywne: [{ label: 'Zerwany pakt', value: -12 }] },
        otherWiarygodnosc: -45, otherWiarygodnoscRozbicie: { ...rozb, razem: -45 }, playerSkarbiec: 420, playerZlotoPerTura: -3, sojuszPotencjal: { pct: 64, label: 'Średni' },
        playerGoodsCats: { surowce: ['Drewno', 'Glina <x>'], technologie: [TECHS[0]], inne: [] }, otherGoodsCats: { surowce: [], technologie: [], inne: ['Coś'] },
        pendingNegotiations: ROWS(110), otherRelations: { wars: [{ ownerId: 3, name: 'Persja' }], alliances: [{ ownerId: 0, name: 'Ty', isPlayer: true }], naps: [], deals: [{ ownerId: 4, name: 'Egipt & co' }] },
      }),
      wojna: () => ({
        playerTitle: 'Wódz', playerCivName: 'Egipcjanie', otherTitle: 'Szach', otherCivName: 'Persowie', zaufanie: 70, respekt: 65, tier: 0, layer: 'simplified',
        contactEstablished: true, actions: ACTIONS.slice(8), formalStatus: { label: 'Wojna', kind: 'wojna' }, otherIsCityState: true, otherIkonaId: 'persowie',
        playerWiarygodnosc: 0, otherWiarygodnosc: 100, pendingNegotiations: ROWS(40).slice(1, 3), playerSkarbiec: 0,
      }),
      pusty: () => ({ playerTitle: 'A', playerCivName: 'B', otherTitle: 'C', otherCivName: 'D', zaufanie: 10, respekt: 5, tier: 1, layer: 'pre_contact', contactEstablished: false, actions: [] }),
    };
    // „Rust”: DTO stanu audiencji z funkcji pinu.
    const viewW = (w, rozbicie) => {
      if (w === undefined) return undefined;
      const wr = Math.round(Math.max(-100, Math.min(100, w)));
      const band = CR.wiarygodnoscLabelPl(wr);
      return { band, tooltip: rozbicie ? DD.wiarygodnoscTooltipDefPl() + ' ' + CR.wiarygodnoscTooltipRozbiciePl(rozbicie, band) : DD.wiarygodnoscTooltipPl() };
    };
    const dview = (it) => ({ ...it, label: DD.resourceDisplayLabel(it.id) });
    const dealSides = (payload, incoming) => {
      const s = DD.splitNegotiationDealPlayerSides(payload, incoming);
      if (!s) return null;
      return { weOffer: s.weOffer.map(dview), theyOffer: s.theyOffer.map(dview), schedule: s.schedule ?? null, perTurn: payload.resourceTradeMode === 'per_turn', turns: payload.turns ?? null };
    };
    const toV2State = (st) => {
      if (st == null) return st;
      const atWar = st.formalStatus?.kind === 'wojna';
      const rows = st.pendingNegotiations ?? [];
      const panel = AB.balancePanelDataFromRows(rows);
      return {
        ...st,
        nastawienie: { scores: DD.effectiveNastawienieScores(st.zaufanie, st.respekt, atWar), label: DD.nastawienieLabelFromScore(st.zaufanie, st.respekt, { atWar }), hint: DD.nastawienieHintPl(atWar) },
        playerWiarygodnoscView: viewW(st.playerWiarygodnosc, st.playerWiarygodnoscRozbicie),
        otherWiarygodnoscView: viewW(st.otherWiarygodnosc, st.otherWiarygodnoscRozbicie),
        negotiationTablePanel: panel == null ? null : { ...panel, relation: relDeal(panel.theirBalance.relCurrent ?? panel.myBalance?.relCurrent ?? 100) },
        actionableNegotiationCount: AB.filterActionableNegotiationRows(rows).length,
        pendingNegotiations: st.pendingNegotiations && rows.map((r) => {
          const base = r.acceptanceMy?.treatyBasePn ?? r.acceptanceTheir?.treatyBasePn;
          return {
            ...r,
            dealSides: r.dealPayload ? dealSides(r.dealPayload, r.direction === 'incoming') : null,
            treatyPwWe: AP.playerTreatyDisplayPw(r.acceptanceMy) ?? AP.bilateralTreatyDisplayPw(r.acceptanceMy, r.acceptanceTheir),
            treatyPwThey: AP.partnerTreatyDisplayPw(r.acceptanceTheir) ?? base,
            resourceAccessWithdrawn: r.dealPayload != null && PR.proposalHasResourceAccess(r.dealPayload),
          };
        }),
      };
    };
    const NEGCTX = { '14': CTXS.pelny, '13': CTXS.pelny, '2': CTXS.sredni, '5': CTXS.pelny, '6': CTXS.pelny, '7': CTXS.pelny, '8': CTXS.pelny, '9': CTXS.pelny, '10': CTXS.pelny, '12': CTXS.minimalny, '15': CTXS.pelny, '4': CTXS.sredni, '3': CTXS.pelny };
    const cfgFor = (S, stName, o = {}) => {
      const stFn = STATES[stName];
      return {
        ownerId: 1, otherCivId: 'rzymianie',
        getState: () => (S === P ? stFn() : toV2State(stFn())),
        onAction: act('onAction'), onBack: act('onBack'), backLabel: o.backLabel,
        hasNextOpenProposal: o.next ? () => true : undefined, onNextOpenProposal: o.next ? act('onNextOpenProposal') : undefined,
        onOpenKnownFactions: o.known ? act('onOpenKnownFactions') : undefined,
        getCivBonusy: (id) => civsJson.cywilizacje[(id + 2) % civsJson.cywilizacje.length]?.bonusy ?? [],
        getNegotiationContext: o.noNeg ? undefined : (aid) => { const c = NEGCTX[aid] ?? null; scenarioCtx = c; return c; },
        previewNegotiation: o.preview ? (owner, payload) => ({ accepted: payload.actionId !== '3' && payload.actionId !== '12', reason: payload.actionId === '12' ? undefined : 'Za niska <Relacja>' }) : undefined,
        onBreakTreaty: act('onBreakTreaty'), previewBreakTreatyPenalties: (id) => (id === 'd1' ? PEN : undefined),
        onAcceptNegotiation: act('onAcceptNegotiation'), onRejectNegotiation: act('onRejectNegotiation'), onAcceptNegotiationPackage: act('onAcceptNegotiationPackage'),
        onRejectNegotiationPackage: act('onRejectNegotiationPackage'), onRemoveNegotiation: act('onRemoveNegotiation'), onCounterNegotiation: act('onCounterNegotiation'),
        onEditOwnNegotiation: act('onEditOwnNegotiation'), onRequestAiNegotiationResponse: act('onRequestAiNegotiationResponse'), onFocusCapital: o.focus ? act('onFocusCapital') : undefined,
      };
    };
    // Sprzątanie przez API/kliknięcie tła (moduł trzyma `modalOverlay` — usunięcie węzła z zewnątrz zostawiłoby stan).
    const closeModals = () => document.querySelectorAll('.civ-diplo-modal-overlay').forEach((n) => fire(n, 'click'));
    const cleanup = (S) => () => { closeModals(); S.hideTradeBasketModal(); (S === P ? pin : v2)['ui/diplomacyNegotiationModal.ts'].hideNegotiationModal(); S.hideDiplomacyAudience(); };
    const VARIANTS = [
      ['pelny', { next: true, known: true, preview: true, focus: true, backLabel: 'Wróć' }],
      ['pelny', { noNeg: true }],
      ['wojna', { preview: true }],
      ['pusty', {}],
    ];
    for (const [vi, [stName, o]] of VARIANTS.entries()) {
      const mk = (S) => { S.showDiplomacyAudience(cfgFor(S, stName, o)); actionLog.push('open=' + S.isDiplomacyAudienceOpen()); };
      await explore(M, `audiencja#${vi}(${stName})`, mk, { P, V, stash: '.civ-diplo-aud', cleanupP: cleanup(P), cleanupV: cleanup(V), keys: ['Escape'], maxClicks: 90,
        after: (S) => { actionLog.push('open-po=' + S.isDiplomacyAudienceOpen()); } });
    }
    // Wejście w koszyk z audiencji i kontroferta automatyczna.
    const autoRun = (S) => {
      S.requestAutoCounterNegotiation('n2');
      S.showDiplomacyAudience(cfgFor(S, 'pelny', { preview: true }));
      S.updateDiplomacyAudience();
    };
    await domCase(M, 'auto-kontroferta(n2)', () => autoRun(P), () => autoRun(V), { stash: '.civ-diplo-aud', cleanupPin: cleanup(P), cleanupV2: cleanup(V) });
    await domCase(M, 'brak-stanu', () => { P.showDiplomacyAudience({ ...cfgFor(P, 'pusty'), getState: () => null }); }, () => { V.showDiplomacyAudience({ ...cfgFor(V, 'pusty'), getState: () => null }); },
      { stash: '.civ-diplo-aud', cleanupPin: cleanup(P), cleanupV2: cleanup(V) });
    // Funkcje eksportowane (render kolumn, filtr technologii).
    for (const stName of Object.keys(STATES)) {
      const st = STATES[stName]();
      const st2 = toV2State(st);
      cmpVal(M, `actionBarHtml(${stName})`, P.actionBarHtml(st), V.actionBarHtml(st2));
      cmpVal(M, `dealsColumnHtml(${stName})`, P.dealsColumnHtml(st), V.dealsColumnHtml(st2));
      cmpVal(M, `treatiesColumnHtml(${stName})`, P.treatiesColumnHtml(st, undefined), V.treatiesColumnHtml(st2, undefined));
      cmpVal(M, `treatiesColumnHtml+handler(${stName})`, P.treatiesColumnHtml(st, () => {}), V.treatiesColumnHtml(st2, () => {}));
      cmpVal(M, `otherCardHtml(${stName})`, P.otherCardHtml(st, civsJson.cywilizacje[1]?.bonusy ?? []), V.otherCardHtml(st2, civsJson.cywilizacje[1]?.bonusy ?? []));
      for (const aid of ['14', '2', '13']) for (const ex of [undefined, 'n1', 'n6']) {
        cmpVal(M, `withOwnTableTechFilter(${stName},${aid},${ex})`, P.withOwnTableTechFilter(CTXS.pelny, st, aid, ex), V.withOwnTableTechFilter(CTXS.pelny, st2, aid, ex));
      }
    }
    // Modale potwierdzeń.
    for (const [name, run] of [
      ['sojusz', (S) => S.showAllianceObligationModal({ allyName: 'Sparta <x>', targetName: 'Ateny', previewRefuse: PEN, onFulfill: act('onFulfill'), onRefuse: act('onRefuse') })],
      ['zgoda-wojna', (S) => S.showWarConsentModal({ civName: 'Rzym <x>', previewDeclareOnly: PEN, previewDeclareAndAttack: { ...PEN, lines: PEN.lines.slice(0, 1) }, onDeclareOnly: act('onDeclareOnly'), onDeclareAndAttack: act('onDeclareAndAttack') })],
      ['zgoda-wojna-bez-ataku', (S) => S.showWarConsentModal({ civName: 'Rzym', previewDeclareOnly: PEN, showAttackOption: false, onDeclareOnly: act('onDeclareOnly') })],
      ['wojna', (S) => S.showWarConfirmModal('Rzym <x>', act('onConfirm'), PEN)],
      ['wojna-bez-kar', (S) => S.showWarConfirmModal('Rzym', act('onConfirm'))],
      ['zerwanie', (S) => S.showBreakTreatyConfirmModal('Pakt <x>', PEN, act('onConfirm'))],
      ['zerwanie-bez-kar', (S) => S.showBreakTreatyConfirmModal('Pakt', undefined, act('onConfirm'))],
    ]) {
      await explore(M, `modal(${name})`, (S) => run(S), { P, V, cleanupP: closeModals, cleanupV: closeModals, maxClicks: 10 });
    }
    notMeasured(M, 'muzyka dyplomacji (`startDiplomacyMusic(otherCivId)`/`stopDiplomacyMusic`) — pin: odtwarzacz nie gra (muzyka gry nie uruchomiona), v2: usługa audio niezainstalowana; nie wpływa na DOM');
    notMeasured(M, 'eksploracja wewnątrz koszyka/modalu otwartego z audiencji — tylko pierwszy poziom (koszyk eksplorowany osobno w `diplomacyTradeBasket.ts`)');
  }

  // ─── raport ────────────────────────────────────────────────────────────────
  const rows = MODS.filter(want).map((m) => R(m));
  let totalCases = 0;
  let totalDiffs = 0;
  for (const r of rows) {
    totalCases += r.cases;
    totalDiffs += r.diffs + (r.v2AssertionsFailed ?? 0);
    const extra = [];
    if (r.v2Assertions) extra.push(`asercje_v2=${r.v2Assertions.length - r.v2AssertionsFailed}/${r.v2Assertions.length}`);
    if (r.domCases) extra.push(`DOM_puste=${r.domEmpty ?? 0}/${r.domCases}`);
    if (r.cases === 0) { extra.push('BRAK_PRZYPADKÓW'); totalDiffs++; }
    console.log(`${r.module.padEnd(30)} przypadki=${String(r.cases).padStart(5)} różnice=${r.diffs}${extra.length ? ' ' + extra.join(' ') : ''}${r.notMeasured.length ? ' NIE_ZMIERZONO=' + r.notMeasured.length : ''}`);
    for (const ex of r.examples) console.log(`   RÓŻNICA ${ex.label} @${ex.at}\n     pin: ${ex.pin}\n     v2 : ${ex.v2}`);
    for (const nm of r.notMeasured) console.log(`   NIE_ZMIERZONO: ${nm}`);
    for (const a of r.v2Assertions ?? []) if (!a.ok) console.log(`   ASERCJA_V2_NIESPEŁNIONA: ${a.check}`);
  }
  console.log(`dom-harness-cycles: pin=edb8fb56 modułów=${rows.length} przypadków=${totalCases} różnic=${totalDiffs} jsdomErrors=${jsdomErrors.length} consoleErrors=${consoleErrors.length}`);
  if (jsdomErrors.length) console.log('jsdomErrors (unikalne): ' + [...new Set(jsdomErrors)].slice(0, 12).join(' | '));
  if (consoleErrors.length) console.log('consoleErrors (unikalne): ' + [...new Set(consoleErrors)].slice(0, 5).join(' | '));
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ pin: 'edb8fb56', totalCases, totalDiffs, modules: rows }, null, 2) + '\n');
  exitCode = totalDiffs === 0 ? 0 : 1;
} catch (err) {
  console.error = origError;
  if (err instanceof StopOnDiff) {
    console.log = origLog;
    console.log(`dom-harness-cycles: STOP_ON_DIFF pierwsza różnica: ${err.message}`);
    exitCode = 1;
  } else {
    console.error('dom-harness-cycles: BŁĄD', err?.stack ?? err);
    exitCode = 2;
  }
} finally {
  console.warn = origWarn;
  console.error = origError;
  console.log = origLog;
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
