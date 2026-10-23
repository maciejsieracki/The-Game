#!/usr/bin/env node
/**
 * run-newgame.mjs — harness porównania DOM/wyników: `newGameFlow.ts` (P5.7 runda 2, `R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1`;
 * `PORTING-QUEUE.md` wiersz 29) w frontend-v2 vs ten sam moduł z pinu web `edb8fb56`.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
 *   node tools/dom-harness/run-newgame.mjs --pin-dir <PIN_DIR> [--json <plik>] [--stop-on-diff]
 * EXIT 0 ⇔ 0 różnic (i wszystkie asercje v2 spełnione); 1 ⇔ ≥1 różnica; 2 ⇔ błąd harnessu.
 *
 * Metoda = `run-hud-empire.mjs` (P5.7 r1): oba drzewa pakowane `esbuild` z tą samą emulacją Vite (`build.mjs`), wspólny
 * jsdom, zamrożony `Date` i `Math.random` (ziarno mapy), kanoniczna serializacja `document.documentElement`, log akcji
 * (callbacki `onStart`/`onCancel` z pełnym JSON parametrów + stan `localStorage`) dopisany do DOM, eksploracja generyczna
 * (każdy element klikalny / pole × wartości = osobny przypadek) na każdym kroku kreatora.
 *
 * Strona v2 dostaje DTO zbudowane w harnessie z DANYCH i FUNKCJI PINU (harness gra rolę „Rust”):
 *   - `StaticCatalogDto.civs` / `.cityNamesPools` = `loadGameData()` pinu (te same obiekty, co dane pinu), `.uiParams` =
 *     `gra/data/ui-params.json`, stałe kreatora = `map/newGameMapDefaults.ts` pinu (`DEFAULT_PLAYER_CIV_ID`,
 *     `DEFAULT_START_EPOCH_ID`, `DEFAULT_RENDER_QUALITY`, `MAX_TYPY_CYWILIZACJI_MENU`, `LAND_FRACTION_PERCENT_OPTS`);
 *   - `NewGameQueriesProvider` = funkcje pinu `map/newGameMapDefaults.ts`, `game/start-preview.ts` (+ `summaryRows` =
 *     `startPreviewSummaryRows`), `game/civ-matrix-semantic.ts` (profil + formattery → pola `CivMatrixCellDto`);
 *     `civAvailableAtEpoch` = transkrypcja pinu `newGameFlow.ts:509-521,580-582` (poprawność weryfikuje samo porównanie).
 *   - `onStart` po stronie v2: `startPreview.summaryRows` (pole DTO §6.10, którego pin nie ma w `StartPreview`) logowane
 *     osobno i porównywane z `startPreviewSummaryRows(startPreview)` pinu; reszta parametrów — pełny JSON 1:1.
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
const ONLY = argOf('--only')?.split(',').filter(Boolean) ?? null;
const want = (m) => ONLY === null || ONLY.includes(m);
const STOP_ON_DIFF = args.includes('--stop-on-diff');
class StopOnDiff extends Error {}
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-hud-empire.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PIN_SRC = resolve(PIN_DIR, 'gra/src');
const PIN_DATA = resolve(PIN_DIR, 'gra/data');

const MODS = ['newGameFlow.ts'];
/** Moduły pinu używane przez harness jako „Rust”. */
const PIN_REF = ['data/loader.ts', 'map/newGameMapDefaults.ts', 'game/start-preview.ts', 'game/civ-matrix-semantic.ts', 'ui/uiParams.ts'];
const V2_CTRL = ['controller/staticCatalog.ts', 'controller/newGameQueries.ts'];

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
  'navigator', 'matchMedia', 'ResizeObserver', 'HTMLDetailsElement',
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
// Pobieranie pliku (`perfReport.downloadTextFile`): klik w link = wpis do logu akcji (nazwa pliku + URL blob); sam węzeł
// `<a download>` usuwany od razu po kliku (moduł usuwa go timerem 200 ms — zależność od obciążenia pętli zdarzeń, nie
// od kodu; późniejsze `a.remove()` modułu = no-op po obu stronach).
let onDownload = () => {};
W.HTMLAnchorElement.prototype.click = function click() { if (this.hasAttribute('download')) { onDownload(this); this.remove(); } };
let blobSeq = 0;
URL.createObjectURL = () => `blob:harness/${++blobSeq}`;
URL.revokeObjectURL = () => {};
W.URL.createObjectURL = URL.createObjectURL;
W.URL.revokeObjectURL = URL.revokeObjectURL;
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
const origInfo = console.info;
console.warn = () => {};
console.info = () => {};
const consoleErrors = [];
console.error = (...a) => { consoleErrors.push(a.map(String).join(' ').slice(0, 200)); };

const tmp = mkdtempSync(join(tmpdir(), 'p57-newgame-harness-'));
const pinOut = join(tmp, 'pin');
const v2Out = join(tmp, 'v2');
let exitCode = 0;
try {
  await bundle([...MODS.map((m) => join(PIN_SRC, 'ui', m)), ...PIN_REF.map((m) => join(PIN_SRC, m))], pinOut, { urlAsHash: true });
  await bundle([...V2_CTRL.map((m) => join(V2_ROOT, 'src', m)), ...MODS.map((m) => join(V2_ROOT, 'src/ui', m))], v2Out, { urlAsHash: true });
  const imp = (base, rel) => import(pathToFileURL(join(base, rel.replace(/\.ts$/, '.js'))).href);

  const pin = {};
  for (const m of PIN_REF) pin[m] = await imp(pinOut, m);
  for (const m of MODS) pin['ui/' + m] = await imp(pinOut, 'ui/' + m);

  const json = (f) => JSON.parse(readFileSync(join(PIN_DATA, f), 'utf8'));
  const ND = pin['map/newGameMapDefaults.ts'];
  const SP = pin['game/start-preview.ts'];
  const CM = pin['game/civ-matrix-semantic.ts'];
  const pinData = pin['data/loader.ts'].loadGameData();

  // „Rust”: StaticCatalogDto (pola czytane przez kreator) z danych i stałych pinu.
  const catalog = {
    contentHash: 'harness-pin-edb8fb56',
    buildings: [], units: [], tech: { technologie: [] }, terrainImprovements: {}, wonders: { cuda: [] }, counters: {},
    civs: pinData.civs, cityNamesPools: pinData.cityNamesPools, powerParams: {},
    uiParams: json('ui-params.json'), wiki: { poradnik: [], encyklopedia: [] },
    constants: {
      newGameDefaultPlayerCivId: ND.DEFAULT_PLAYER_CIV_ID,
      newGameDefaultStartEpochId: ND.DEFAULT_START_EPOCH_ID,
      newGameDefaultRenderQuality: ND.DEFAULT_RENDER_QUALITY,
      maxTypyCywilizacjiMenu: ND.MAX_TYPY_CYWILIZACJI_MENU,
      landFractionPercentOpts: [...ND.LAND_FRACTION_PERCENT_OPTS],
    },
    labels: {}, unitCategory: {}, unitCategoryNameOnly: {}, techTerrainUnlockLabels: {},
  };
  // Transkrypcja pinu `newGameFlow.ts:509-521,580-582` (reguła dostępności cywilizacji w epoce startu).
  const START_EPOCH_ORDER = ['kamien', 'braz', 'zelazo'];
  const startEpochIndex = (id) => { const i = START_EPOCH_ORDER.indexOf(id); return i >= 0 ? i : START_EPOCH_ORDER.length; };
  const civMinStartEpochIndex = (ep) => (ep.length === 0 ? 0 : Math.min(...ep.map(startEpochIndex)));
  const queryLog = [];
  const q = (name, fn) => (...a) => { queryLog.push(name); return fn(...a); };
  const provider = {
    miastaPanstwaMenuForMapLabel: q('miastaPanstwaMenuForMapLabel', (l) => ND.miastaPanstwaMenuForMapLabel(l)),
    civTypesMenuForMapLabel: q('civTypesMenuForMapLabel', (l, e, r) => ND.civTypesMenuForMapLabel(l, e, r)),
    defaultMiastaPanstwaFromMapLabel: q('defaultMiastaPanstwaFromMapLabel', (l) => ND.defaultMiastaPanstwaFromMapLabel(l)),
    defaultCivTypesFromMapLabel: q('defaultCivTypesFromMapLabel', (l, e, r) => ND.defaultCivTypesFromMapLabel(l, e, r)),
    maxCivTypesForStartEpoch: q('maxCivTypesForStartEpoch', (e, r) => ND.maxCivTypesForStartEpoch(e, r)),
    clampMiastaPanstwaCount: q('clampMiastaPanstwaCount', (n) => ND.clampMiastaPanstwaCount(n)),
    typSwiataFromMenuLabel: q('typSwiataFromMenuLabel', (l) => ND.typSwiataFromMenuLabel(l)),
    defaultLandFractionPercentForTyp: q('defaultLandFractionPercentForTyp', (t) => ND.defaultLandFractionPercentForTyp(t)),
    worldGenerationPresetFromLabels: q('worldGenerationPresetFromLabels', (x) => ND.worldGenerationPresetFromLabels(x)),
    buildStartPreview: q('buildStartPreview', (input) => {
      const p = SP.buildStartPreview(input);
      return { ...p, summaryRows: SP.startPreviewSummaryRows(p) };
    }),
    civMatrixProfile: q('civMatrixProfile', (civKey) => {
      const pr = CM.buildCivMatrixSemanticProfile(civKey);
      return {
        civilizationId: pr.civilizationId, civilizationName: pr.civilizationName, parameterCount: pr.parameterCount,
        activeCount: pr.activeCount, inactiveCount: pr.inactiveCount, blockedReasonPl: pr.blockedReasonPl,
        cells: pr.cells.map((c) => ({
          paramLabel: CM.civMatrixParameterLabelPl(c.parameterId),
          formatted: CM.civMatrixFormattedValue(c.rawValue, c.unit),
          baselineFormatted: CM.civMatrixFormattedValue(c.baselineValue, c.unit),
          intensity: c.signedIntensity,
          intensityLabel: CM.civMatrixIntensityLabel(c.signedIntensity),
          visibleByDefault: CM.statusAllowsDefaultVisibility(c.consumerStatus),
          parameterId: c.parameterId, domain: c.domain, consumerStatus: c.consumerStatus, statusLabelPl: c.statusLabelPl,
          statusReasonPl: c.statusReasonPl, explanationPl: c.explanationPl, label: c.label, polarity: c.polarity,
        })),
      };
    }),
    civAvailableAtEpoch: q('civAvailableAtEpoch', (ep, epochId) => civMinStartEpochIndex(ep) <= startEpochIndex(epochId)),
  };
  const v2 = {};
  for (const m of V2_CTRL) v2[m] = await imp(v2Out, m);
  v2['controller/staticCatalog.ts'].installStaticCatalog(catalog);
  v2['controller/newGameQueries.ts'].installNewGameQueries(provider);
  if (process.env.HARNESS_DEBUG) process.stderr.write('DBG: zainstalowano dostawcę\n');
  for (const m of MODS) v2['ui/' + m] = await imp(v2Out, 'ui/' + m);
  // Ziarno mapy (`buildParams`: `Math.floor(Math.random() * 1e6)`) — deterministyczne, identyczne po obu stronach.
  Math.random = () => 0.4242;

  // ─── porównanie (= run-cycles.mjs) ─────────────────────────────────────────
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
  const snapshot = () => {
    for (const a of document.querySelectorAll('a[download][href^="blob:harness/"]')) a.remove();
    return ser(document.documentElement);
  };
  let actionLog = [];
  onDownload = (a) => actionLog.push(`download(${a.getAttribute('download')},${a.getAttribute('href')})`);
  const fmtArg = (x) => (typeof x === 'object' ? JSON.stringify(x) : String(x));
  const act = (name, ret) => (...a) => { actionLog.push(name + '(' + a.map(fmtArg).join(',') + ')'); return typeof ret === 'function' ? ret(...a) : ret; };
  const dumpActions = () => {
    const pre = document.createElement('pre');
    pre.setAttribute('data-action-log', '');
    pre.textContent = actionLog.join('\n');
    document.body.appendChild(pre);
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const stashed = {};
  async function domCase(mod, label, runPin, runV2, { stash = false, cleanupPin, cleanupV2, seedStorage } = {}) {
    const st = (stashed[mod] ??= { pin: [], v2: [] });
    const one = async (name, run, cleanup) => {
      curCase = mod + '/' + name;
      resetDoc();
      localStorage.clear();
      seedStorage?.();
      blobSeq = 0;
      actionLog = [];
      if (stash) for (const n of st[name]) document.body.appendChild(n);
      try { await run(); } catch (e) { actionLog.push('THROW:' + String(e?.message ?? e)); }
      await sleep(0);
      dumpActions();
      const snap = snapshot();
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
    if (!/<body[^>]*>(?:(?!<pre data-action-log)<[a-z])/.test(b)
      && !/<\/body><[a-z]/.test(b)) { r.domEmpty = (r.domEmpty ?? 0) + 1; if (process.env.HARNESS_DEBUG_EMPTY) origLog('DOM_PUSTY', mod, label); }
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
  const desc = (el) => (el ? el.tagName.toLowerCase() + '.' + (el.getAttribute('class') ?? '') + [...el.attributes].filter((a) => a.name.startsWith('data-')).map((a) => `[${a.name}=${a.value}]`).join('') : 'BRAK');

  const CLICK_SEL = '.civ-newgame .card, .civ-newgame .ec, .civ-newgame .si, .civ-newgame .adv-overlay, button, [data-act], [data-section], [data-moc-view], [data-miasto-scope], [role="button"], [tabindex], input[type="checkbox"], input[type="radio"], summary, a[href], .civ-emp-backdrop';
  const INPUT_SEL = 'input[type="search"], input[type="range"], input[type="number"], input[type="text"], input:not([type]), select, textarea';
  async function explore(M, label, setup, { P, V, cleanupP, cleanupV, stash = false, maxClicks = 80, keys = [], after, clickSel = CLICK_SEL, fills } = {}) {
    let nClick = 0;
    let nInput = 0;
    const counted = (fn) => async (S, s) => {
      await fn(S, s);
      await sleep(0);
      if (s === 'pin') {
        nClick = document.querySelectorAll(clickSel).length;
        nInput = document.querySelectorAll(INPUT_SEL).length;
      }
    };
    const res = await domCase(M, `${label}:open`, () => counted(setup)(P, 'pin'), () => setup(V, 'v2'), { stash, cleanupPin: cleanupP, cleanupV2: cleanupV });
    for (let i = 0; i < Math.min(nClick, maxClicks); i++) {
      const run = async (S, s) => {
        await setup(S, s);
        await sleep(0);
        const el = document.querySelectorAll(clickSel)[i];
        actionLog.push(`klik#${i}:${desc(el)}`);
        fire(el, 'click');
        await sleep(0);
        await after?.(S, s);
      };
      await domCase(M, `${label}:klik#${i}`, () => run(P, 'pin'), () => run(V, 'v2'), { stash, cleanupPin: cleanupP, cleanupV2: cleanupV });
    }
    if (nClick > maxClicks) notMeasured(M, `${label}: kliknięto ${maxClicks} z ${nClick} elementów (limit przypadków)`);
    // Każde pole × każda wartość z `fills(el)` (domyślnie jedna wartość) = osobny przypadek.
    for (let i = 0; i < nInput; i++) {
      const probe = async () => {
        await setup(P, 'probe');
        await sleep(0);
        return document.querySelectorAll(INPUT_SEL)[i];
      };
      let values = [null];
      if (fills) {
        resetDoc();
        const el = await probe();
        values = el ? fills(el) : [null];
        cleanupP?.();
        resetDoc();
      }
      for (const val of values) {
        const run = async (S, s) => {
          await setup(S, s);
          await sleep(0);
          const el = document.querySelectorAll(INPUT_SEL)[i];
          actionLog.push(`pole#${i}=${val}:${desc(el)}`);
          if (el) {
            if (val !== null) el.value = val;
            else if (el.tagName === 'SELECT') el.value = el.options[el.options.length - 1]?.value ?? '';
            else if (el.type === 'range') el.value = String(Math.round((Number(el.min || 0) + Number(el.max || 100)) * 0.37));
            else if (el.type === 'number') el.value = '7';
            else el.value = 'Tekst <x> & y';
            el.dispatchEvent(new W.Event('input', { bubbles: true }));
            el.dispatchEvent(new W.Event('change', { bubbles: true }));
          }
          await sleep(0);
          await after?.(S, s);
        };
        await domCase(M, `${label}:pole#${i}=${val}`, () => run(P, 'pin'), () => run(V, 'v2'), { stash, cleanupPin: cleanupP, cleanupV2: cleanupV });
      }
    }
    for (const k of keys) {
      const run = async (S, s) => {
        await setup(S, s);
        await sleep(0);
        actionLog.push('klawisz:' + k);
        key(k);
        await sleep(0);
        await after?.(S, s);
      };
      await domCase(M, `${label}:klawisz(${k})`, () => run(P, 'pin'), () => run(V, 'v2'), { stash, cleanupPin: cleanupP, cleanupV2: cleanupV });
    }
    return res;
  }
  const mods = (m) => [pin['ui/' + m], v2['ui/' + m]];

  // ─── newGameFlow.ts ───────────────────────────────────────────────────────
  const M = 'newGameFlow.ts';
  const [P, V] = mods(M);
  /** Diagnostyka: `--only-label <fragment>` ogranicza eksplorację kombinacji; `--progress` = czas każdej kombinacji na stderr. */
  const ONLY_LABEL = argOf('--only-label');
  const PROGRESS = args.includes('--progress');
  const progress = [];
  // Kreator trzyma `rootEl` w stanie modułu i tworzy go tylko raz; `resetDoc()` odpina go od `body`. Każda strona
  // przed `showNewGameFlow` dopina z powrotem SWÓJ węzeł (ten sam obiekt co na pinie: render czyści `innerHTML`).
  const roots = new Map();
  const remount = (S) => { const r = roots.get(S); if (r) document.body.appendChild(r); };
  const capture = (S) => { if (!roots.has(S)) { const r = document.querySelector('.civ-newgame'); if (r) roots.set(S, r); } };
  const startLog = (S) => (params) => {
    const p = JSON.parse(JSON.stringify(params));
    if (p.startPreview) {
      if (S === V) { actionLog.push('summaryRows=' + JSON.stringify(p.startPreview.summaryRows)); delete p.startPreview.summaryRows; }
      else actionLog.push('summaryRows=' + JSON.stringify(SP.startPreviewSummaryRows(params.startPreview)));
    }
    actionLog.push('onStart(' + JSON.stringify(p) + ')');
  };
  const allCivs = pinData.civs.cywilizacje;
  const reducedRows = [
    { ...allCivs[0], epokiStartowe: ['zelazo'], epokaWejscia: 'zelazo' },
    (() => { const r = { ...allCivs[1], epokaWejscia: 'braz' }; delete r.epokiStartowe; return r; })(),
    (() => { const r = { ...allCivs[2], 'Bonus startowy': '-słabsza gospodarka', 'Bonusy/minusy (do dopracowania)': 'Szybszy wzrost', kolorHex: undefined }; delete r.bonusy; delete r.Religia; return r; })(),
    (() => { const r = { ...allCivs[3] }; delete r.ikonaId; delete r.epokiStartowe; delete r.epokaWejscia; return r; })(),
    { ...allCivs[4], Cywilizacja: '' },
    { ...allCivs[11] },
  ];
  const onlyLateRows = allCivs.filter((c) => c.epokiStartowe?.[0] !== 'kamien');
  const CFGS = {
    dane: (S) => ({ data: pinData, onStart: startLog(S), onCancel: act('onCancel') }),
    'bez-danych': (S) => ({ onStart: startLog(S) }),
    getCivs: (S) => ({
      data: pinData, onStart: startLog(S), onCancel: act('onCancel'),
      getCivs: () => [
        { id: 'rzymianie', name: 'Rzym <b>', styl: 'Wojna', bonusy: ['+1 atak', 'słabsza flota'], religia: 'Jowisz', typGlowny: 'Militarny', epokaWejscia: 'kamien', epokiStartowe: ['kamien'], kolorHex: '#aa0000' },
        { id: 'egipt', name: 'Egipt', epokaWejscia: 'braz', epokiStartowe: ['braz', 'zelazo'] },
        { id: 'nieznana', name: 'Nieznana', superJednostka: 'Rydwan', epokaWejscia: 'zelazo', epokiStartowe: [] },
      ],
    }),
    zredukowane: (S) => ({ data: { ...pinData, civs: { ...pinData.civs, cywilizacje: reducedRows } }, onStart: startLog(S), onCancel: act('onCancel') }),
    'tylko-pozne': (S) => ({ data: { ...pinData, civs: { ...pinData.civs, cywilizacje: onlyLateRows } }, onStart: startLog(S), onCancel: act('onCancel') }),
    // Pusty roster w danych + własna lista (`civRosterRows()` = [] → `MAX_TYPY_CYWILIZACJI_MENU`, pin `:2004-2006`).
    'getCivs-pusty-roster': (S) => ({ ...CFGS.getCivs(S), data: { ...pinData, civs: { ...pinData.civs, cywilizacje: [] } } }),
    // Własna lista z cywilizacją epoki Kamienia + roster danych bez niej (limit typów epoki = 0, pin `:2004-2006,2049-2052`).
    'getCivs-pozny-roster': (S) => ({ ...CFGS.getCivs(S), data: { ...pinData, civs: { ...pinData.civs, cywilizacje: onlyLateRows } } }),
  };
  const PREFS = {
    brak: null,
    v4: ['civ-new-game-prefs-v1', JSON.stringify({
      v: 4, selEpoch: 'braz', selCiv: 'egipt', settings: { difficulty: 2, map_size: 4 },
      settingLabels: { difficulty: 'Trudny', map_size: 'Duży', world_type: 'Pangea', game_speed: 'Długa', map_quality: 'Wysoka', rivers_density: 'Dużo', relief_density: 'Mało', village_rewards_enabled: 'Wyłączone', city_states_count: '4' },
      advanced: { barbariansLevel: 'trudny', battleAlwaysManual: true, victoryMode: 'moc', buildingCostPace: 'wysoki', kosztJednostekPace: 'normalny',
        wzrostLudnosciPace: 'wolny', ruchSwiataPace: 'dlugi', landFractionPercent: 60, landFractionCustom: true, cityStateDifficultyOverride: 'off', cityLimitBase: 20 },
      selAiCivIds: ['grecy', 'celtowie', 'nie-ma', 7],
    })],
    legacy: ['civ-newgame-prefs-v2', JSON.stringify({
      v: 3, selEpoch: 'zelazo', selCiv: 'slowianie', settings: { difficulty: 0, map_size: 1, world_type: 2, resources_density: 9 },
      advanced: { barbariansLevel: 'wielu', victoryPowerAndDominance: false, landFractionPercent: 20, buildingCostPace: 'x', cityStateDifficultyOverride: 'easy', cityLimitBase: -3 },
    })],
    legacy2: ['civ-newgame-prefs-v2', JSON.stringify({ v: 3, selEpoch: 'nieznana', settings: {}, advanced: { barbariansEnabled: false, victoryPowerAndDominance: true, wzrostLudnosciPace: 'normalny', ruchSwiataPace: 'normalny' } })],
    uszkodzone: ['civ-new-game-prefs-v1', '{x'],
  };
  const click = async (sel) => { fire(document.querySelector('.civ-newgame ' + sel), 'click'); await sleep(0); };
  // Kroki: 1 intro, 2 epoka, 3 cywilizacja, 4 ustawienia (+ modal / fotel 2), 5 generowanie (`onStart`).
  const STEPS = {
    s1: async () => {},
    s2: async () => { await click('.cta-hero'); },
    s3: async () => { await click('.cta-hero'); await click('.nb.next'); },
    s4: async () => { await click('.cta-hero'); await click('.nb.next'); await click('.nb.next'); },
    's4-adv': async () => { await STEPS.s4(); await click('.btn-adv'); },
    's4-fotel2': async () => { await STEPS.s4(); await click('.seat2-toggle-btn'); await click('.sett-actions .start'); },
    s5: async () => { await STEPS.s4(); await click('.sett-actions .start'); },
  };
  const dumpPrefs = () => {
    for (const k of ['civ-new-game-prefs-v1', 'civ-newgame-prefs-v2']) actionLog.push(`ls[${k}]=${localStorage.getItem(k)}`);
  };
  const setupFor = (cfgName, prefsName, step) => async (S) => {
    const pr = PREFS[prefsName];
    if (pr) localStorage.setItem(pr[0], pr[1]);
    remount(S);
    S.showNewGameFlow(CFGS[cfgName](S));
    capture(S);
    await STEPS[step]();
    actionLog.push('open=' + S.isNewGameFlowOpen());
  };
  const INPUT_FILLS = (el) => (el.tagName === 'SELECT' ? [...el.options].map((o) => o.value)
    : el.type === 'search' ? ['walka', 'REAL_GAMEPLAY', 'NEGATYWNY', '  ATAK ', 'zzz-brak', ''] : [null]);
  const after = async () => { dumpPrefs(); };
  const COMBOS = [
    ['dane', 'brak', ['s1', 's2', 's3', 's4', 's4-adv', 's4-fotel2', 's5']],
    ['dane', 'v4', ['s2', 's3', 's4', 's4-adv', 's5']],
    ['dane', 'legacy', ['s2', 's3', 's4', 's4-adv', 's5']],
    ['dane', 'legacy2', ['s3', 's4-adv', 's5']],
    ['dane', 'uszkodzone', ['s1', 's5']],
    ['bez-danych', 'brak', ['s1', 's3', 's4', 's5']],
    ['getCivs', 'brak', ['s2', 's3', 's4', 's4-fotel2', 's5']],
    ['zredukowane', 'brak', ['s2', 's3', 's4', 's4-fotel2', 's5']],
    ['tylko-pozne', 'brak', ['s1', 's2', 's3']],
  ];
  for (const [cfgName, prefsName, steps] of COMBOS) {
    for (const step of steps) {
      const label = `${cfgName}/${prefsName}/${step}`;
      if (ONLY_LABEL && !label.includes(ONLY_LABEL)) continue;
      const t0 = RealDate.now();
      const c0 = R(M).cases;
      progress.push(() => `${label}: przypadki=${R(M).cases - c0} ms=${RealDate.now() - t0}`);
      // Kroki 4 i 4-adv: po każdym kliknięciu także start gry (parametry `onStart` po zmianie ustawienia).
      const afterStep = step === 's4' || step === 's4-adv'
        ? async () => { dumpPrefs(); await click('.adv-close'); await click('.sett-actions .start'); }
        : after;
      await explore(M, label, setupFor(cfgName, prefsName, step), {
        P, V, maxClicks: 160, after: afterStep, fills: INPUT_FILLS,
        cleanupP: () => P.hideNewGameFlow(), cleanupV: () => V.hideNewGameFlow(),
      });
      if (PROGRESS) process.stderr.write(progress.at(-1)() + '\n');
    }
  }
  // Ścieżki wielokrokowe (sekwencje kliknięć niepokryte pojedynczym klikiem eksploracji).
  const seqs = [
    ['epoka-zelazo→cyw→ust→start', 'dane', async () => { await click('.cta-hero'); fire(document.querySelectorAll('.civ-newgame .ec')[2], 'click'); await sleep(0); await click('.nb.next'); await click('.nb.next'); await click('.sett-actions .start'); }],
    ['wstecz-z-kroku-4-do-1', 'dane', async () => { await STEPS.s4(); await click('.nb.back'); await click('.nb.back'); await click('.nb.back'); }],
    ['pasek-kroków→krok-2', 'dane', async () => { await STEPS.s4(); fire(document.querySelectorAll('.civ-newgame .si')[1], 'click'); await sleep(0); }],
    ['fotel2-wstecz-nav', 'dane', async () => { await STEPS['s4-fotel2'](); await click('.nb.back'); }],
    ['fotel2-wybór→start', 'dane', async () => { await STEPS['s4-fotel2'](); fire(document.querySelectorAll('.civ-newgame .civ-grid .card:not(.disabled)')[3], 'click'); await sleep(0); fire(document.querySelectorAll('.civ-newgame .seat2-dist-opt')[0], 'click'); await sleep(0); await click('.sett-actions .start'); }],
    ['fotel2-wyłącz', 'dane', async () => { await STEPS.s4(); await click('.seat2-toggle-btn'); await click('.seat2-toggle-btn'); await click('.sett-actions .start'); }],
    ['ai-limit', 'dane', async () => {
      await STEPS.s4();
      for (let i = 0; i < 8; i++) { fire(document.querySelectorAll('.civ-newgame .ai-civ-grid .card:not(.sel):not(.disabled)')[0], 'click'); await sleep(0); }
      fire(document.querySelectorAll('.civ-newgame .ai-civ-grid .card.sel')[0], 'click'); await sleep(0);
      await click('.sett-actions .start');
    }],
    ['mapa-cykl-strzałek', 'dane', async () => {
      await STEPS.s4();
      for (let i = 0; i < 7; i++) { fire(document.querySelectorAll('.civ-newgame .sett-grid .srow')[1].querySelectorAll('.arr')[1], 'click'); await sleep(0); }
      for (let i = 0; i < 3; i++) { fire(document.querySelectorAll('.civ-newgame .sett-grid .srow')[4].querySelectorAll('.arr')[0], 'click'); await sleep(0); }
      await click('.sett-actions .start');
    }],
    ['zaawansowane-wszystkie-strzałki', 'dane', async () => {
      await STEPS['s4-adv']();
      const rows = document.querySelectorAll('.civ-newgame .adv-row');
      for (const [i, row] of [...rows].entries()) for (let k = 0; k <= (i % 4); k++) { fire(row.querySelectorAll('.arr')[1], 'click'); await sleep(0); }
      fire(document.querySelector('.civ-newgame .adv-overlay'), 'click'); await sleep(0);
      await click('.sett-actions .start');
    }],
    ['typ-świata→ląd', 'dane', async () => {
      await STEPS['s4-adv']();
      const land = [...document.querySelectorAll('.civ-newgame .adv-row')].find((r) => /lądu/.test(r.textContent));
      fire(land.querySelectorAll('.arr')[0], 'click'); await sleep(0);
      await click('.adv-close');
      fire(document.querySelectorAll('.civ-newgame .sett-grid .srow')[2].querySelectorAll('.arr')[1], 'click'); await sleep(0);
      await click('.sett-actions .start');
    }],
    ['menu-główne-z-kroku-1', 'dane', async () => { await click('.cta-menu-back'); }],
    ['ukryj-kreator', 'dane', async (S) => { await STEPS.s3(); S.hideNewGameFlow(); actionLog.push('open-po-ukryciu=' + S.isNewGameFlowOpen()); }],
    ['pusty-roster→start', 'getCivs-pusty-roster', async () => { await STEPS.s5(); }],
    ['późny-roster→start', 'getCivs-pozny-roster', async () => { await STEPS.s5(); }],
    ['późny-roster→brąz→start', 'getCivs-pozny-roster', async () => { await click('.cta-hero'); fire(document.querySelectorAll('.civ-newgame .ec')[1], 'click'); await sleep(0); await click('.nb.next'); await click('.nb.next'); await click('.sett-actions .start'); }],
    ['pusty-roster→zelazo→start', 'getCivs-pusty-roster', async () => { await click('.cta-hero'); fire(document.querySelectorAll('.civ-newgame .ec')[2], 'click'); await sleep(0); await click('.nb.next'); await click('.nb.next'); await click('.sett-actions .start'); }],
  ];
  // Parametry UI bez części ustawień (wartości zastępcze `buildParams`, pin `:1983-1993,2062`): te same klucze usunięte
  // z `UI_PARAMS.nowa_gra.ustawienia` pinu (`ui/uiParams.ts`) i z `StaticCatalogDto.uiParams` v2 (`resetSettingsFromParams`
  // czyta tablicę przy każdym otwarciu kreatora); przywrócone po przypadku.
  for (const [tag, dropKeys, steps] of [
    ['A', ['map_quality', 'resources_density', 'relief_density', 'world_type', 'village_rewards_enabled'], ['s4', 's4-adv', 's5']],
    // B: bez suwaków miast-państw / typów cywilizacji i rozmiaru mapy → wartości domyślne z zapytań (pin `:1995-2003,2038,2049-2055`).
    ['B', ['city_states_count', 'civ_types_count', 'map_size'], ['s4', 's5']],
  ]) {
    const pinSett = pin['ui/uiParams.ts'].UI_PARAMS.nowa_gra.ustawienia;
    const v2Sett = catalog.uiParams.nowa_gra.ustawienia;
    const DROP = new Set(dropKeys);
    const savedPin = [...pinSett];
    const savedV2 = [...v2Sett];
    pinSett.splice(0, pinSett.length, ...savedPin.filter((s) => !DROP.has(s.key)));
    v2Sett.splice(0, v2Sett.length, ...savedV2.filter((s) => !DROP.has(s.key)));
    try {
      for (const step of steps) {
        await explore(M, `ui-params-niepełne-${tag}/${step}`, setupFor('dane', 'brak', step), {
          P, V, maxClicks: 120, after: step === 's5' ? after : async () => { dumpPrefs(); await click('.adv-close'); await click('.sett-actions .start'); },
          cleanupP: () => P.hideNewGameFlow(), cleanupV: () => V.hideNewGameFlow(),
        });
      }
    } finally {
      pinSett.splice(0, pinSett.length, ...savedPin);
      v2Sett.splice(0, v2Sett.length, ...savedV2);
    }
  }
  for (const [label, cfgName, run] of seqs) {
    const go = async (S) => {
      remount(S);
      S.showNewGameFlow(CFGS[cfgName](S));
      capture(S);
      await run(S);
      dumpPrefs();
    };
    await domCase(M, 'sekwencja:' + label, () => go(P), () => go(V), { cleanupPin: () => P.hideNewGameFlow(), cleanupV2: () => V.hideNewGameFlow() });
  }
  // Ponowne otwarcie po zapisie preferencji (stan modułu + `localStorage` z poprzedniego otwarcia w tym samym przypadku).
  {
    const go = async (S) => {
      remount(S);
      S.showNewGameFlow(CFGS.dane(S));
      capture(S);
      await STEPS.s4();
      fire(document.querySelectorAll('.civ-newgame .sett-grid .srow')[0].querySelectorAll('.arr')[1], 'click'); await sleep(0);
      S.hideNewGameFlow();
      S.showNewGameFlow(CFGS.dane(S));
      await STEPS.s5();
      dumpPrefs();
    };
    await domCase(M, 'ponowne-otwarcie-z-prefs', () => go(P), () => go(V), { cleanupPin: () => P.hideNewGameFlow(), cleanupV2: () => V.hideNewGameFlow() });
  }
  // Asercje v2: reguły idą przez zapytania (nie lokalnie).
  queryLog.length = 0;
  remount(V);
  V.showNewGameFlow(CFGS.dane(V));
  await STEPS.s5();
  V.hideNewGameFlow();
  resetDoc();
  const used = new Set(queryLog);
  assertV2(M, [
    'miastaPanstwaMenuForMapLabel', 'civTypesMenuForMapLabel', 'defaultMiastaPanstwaFromMapLabel', 'defaultCivTypesFromMapLabel',
    'maxCivTypesForStartEpoch', 'clampMiastaPanstwaCount', 'typSwiataFromMenuLabel', 'defaultLandFractionPercentForTyp',
    'worldGenerationPresetFromLabels', 'buildStartPreview', 'civMatrixProfile', 'civAvailableAtEpoch',
  ].map((n) => [`zapytanie ${n} użyte przez kreator`, used.has(n)]));
  notMeasured(M, '`syncSettLayoutHeight` (`offsetHeight` = 0 w jsdom, brak układu) — dopasowanie wysokości panelu AI do siatki ustawień');
  notMeasured(M, 'wygląd CSS (tło hero, rozmycie, animacje `cng-pulse`/`cng-spin`) w realnej przeglądarce; podpowiedzi `title` (hover `hudTitleTooltip`)');

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
  console.log(`dom-harness-newgame: pin=edb8fb56 modułów=${rows.length} przypadków=${totalCases} różnic=${totalDiffs} jsdomErrors=${jsdomErrors.length} consoleErrors=${consoleErrors.length}`);
  if (jsdomErrors.length) console.log('jsdomErrors (unikalne): ' + [...new Set(jsdomErrors)].slice(0, 12).join(' | '));
  if (consoleErrors.length) console.log('consoleErrors (unikalne): ' + [...new Set(consoleErrors)].slice(0, 5).join(' | '));
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ pin: 'edb8fb56', totalCases, totalDiffs, modules: rows }, null, 2) + '\n');
  exitCode = totalDiffs === 0 ? 0 : 1;
} catch (err) {
  console.error = origError;
  if (err instanceof StopOnDiff) {
    console.log = origLog;
    console.log(`dom-harness-newgame: STOP_ON_DIFF pierwsza różnica: ${err.message}`);
    exitCode = 1;
  } else {
    console.error('dom-harness-newgame: BŁĄD', err?.stack ?? err);
    exitCode = 2;
  }
} finally {
  console.warn = origWarn;
  console.error = origError;
  console.log = origLog;
  console.info = origInfo;
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
