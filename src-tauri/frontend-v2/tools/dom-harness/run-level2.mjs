#!/usr/bin/env node
/**
 * run-level2.mjs — harness porównania DOM/wyników: 26 modułów P5.5 (`R-RUSTPORT-P5-5-PORT-POZIOM2-Q1`;
 * `PORTING-QUEUE.md` wiersze 46–68, 71, 72, 74) w frontend-v2 vs ten sam moduł z pinu web `edb8fb56`.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
 *   node tools/dom-harness/run-level2.mjs --pin-dir <PIN_DIR> [--json <plik>]
 * EXIT 0 ⇔ 0 różnic (i wszystkie asercje v2 spełnione); 1 ⇔ ≥1 różnica; 2 ⇔ błąd harnessu.
 *
 * Metoda = `run.mjs`/`run-level1a.mjs`/`run-c4.mjs` (P5.2–P5.4): oba drzewa pakowane `esbuild` z tą samą
 * emulacją Vite (`build.mjs`; P5.5: + `?url`), wspólny jsdom, zamrożony `Date`, kanoniczna serializacja całego
 * `document.documentElement` albo JSON/HTML wartości; log akcji (wywołania callbacków) dopisywany do DOM.
 * Nowe w P5.5: **eksploracja generyczna** — po otwarciu panelu harness klika KAŻDY element klikalny (selektor
 * `CLICK_SEL`, w kolejności dokumentu, osobny przypadek na element, panel otwierany od nowa), zmienia KAŻDE pole
 * formularza (`INPUT_SEL`) i wysyła zadane klawisze; liczba elementów = liczba po stronie pinu.
 *
 * Strona v2 dostaje DTO zbudowane w harnessie z DANYCH i FUNKCJI PINU (harness gra rolę „Rust”):
 *   - `StaticCatalogDto` = `gra/data/*.json` + `src/data/wikiBundle.json` + `categoryOf` + `terrainUnlockLabelsForTech`
 *     + stałe `RESEARCH_QUEUE_MAX`, `MAX_PROCENT_PULI_IMPERIUM`, `MAX_ULEPSZENIA_PRACA_AUTO_PERCENT`, `TEMPO_GRY`;
 *   - `UnitCardDto.badges` = `softPathBadgeLevel`/`armorPathBadgeLevel`/`veteranStarCount` (jak `run-level1a.mjs`);
 *   - `DiploCivListLinesDto` = `formatDiploCivListLines` (`game/diplomacy-display.ts`) z `tierLabel` pinu;
 *   - `ResearchViewDto` (drzewko) = `scaledResearchCost` z tym samym tempem/trudnością, które pin dostaje hakami;
 *   - `BuildTypeInfo.affordable` = `!(kosztPraca > pulaPracy)` (formuła pinu `buildModeHud.ts:689`).
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
/** `--only a.ts,b.ts` — tylko wskazane moduły (używane przez `mutate-level2.mjs`, by mutacja modułu nie czekała na 25 pozostałych). */
const ONLY = argOf('--only')?.split(',').filter(Boolean) ?? null;
const want = (m) => ONLY === null || ONLY.includes(m);
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-level2.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PIN_SRC = resolve(PIN_DIR, 'gra/src');
const PIN_DATA = resolve(PIN_DIR, 'gra/data');

const L2 = [
  'leaderBannersHud.ts', 'cityCaptureNotice.ts', 'cityForeignPick.ts', 'cityUnitPick.ts', 'gamePauseMenu.ts',
  'hotSeatHandoff.ts', 'mainMenu.ts', 'unitForeignPick.ts', 'buildModeHud.ts', 'diplomacyPanel.ts', 'techTreeView.ts',
  'unitInfoCard.ts', 'wikiHubHud.ts', 'unitPanelHud.ts', 'contextPanelHud.ts', 'diplomacyProposalBanner.ts',
  'hudChip6c.ts', 'mapToolbarHud.ts', 'armyMergePickPanel.ts', 'armySplitPanel.ts', 'diplomacyPendingHud.ts',
  'interHumanDiplomacyHud.ts', 'unitReplacePicker.ts', 'armyStackHud.ts', 'diploListHud.ts', 'unitActionBarHtml.ts',
];
/** Moduły UI potrzebne do sprzątania (ta sama instancja co w zależnościach modułów L2). */
const AUX = ['techDiscoveryNotice.ts', 'sciencePicker.ts', 'techUnlockParse.ts'];
/** Moduły pinu używane przez harness jako „Rust”. */
const PIN_REF = [
  'units/setup.ts', 'game/unit-building-bonuses.ts', 'game/veteran.ts', 'game/diplomacy-display.ts',
  'game/difficulty-cost.ts', 'game/tech-tempo.ts', 'game/improvement-tech.ts', 'game/cities.ts', 'game/playerState.ts',
];
const V2_CTRL = ['controller/staticCatalog.ts'];

// ─── jsdom ───────────────────────────────────────────────────────────────────
const jsdomErrors = [];
const vc = new VirtualConsole();
/** Moduł i strona bieżącego przypadku — do opisu błędów jsdom (np. arkusz CSS, którego jsdom nie parsuje). */
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
  'HTMLSpanElement', 'HTMLImageElement', 'HTMLVideoElement', 'HTMLMediaElement', 'Event', 'MouseEvent', 'KeyboardEvent',
  'CustomEvent', 'PointerEvent', 'WheelEvent', 'FocusEvent', 'getComputedStyle', 'requestAnimationFrame',
  'cancelAnimationFrame', 'localStorage', 'sessionStorage', 'location', 'DOMParser', 'SVGElement', 'navigator',
];
for (const k of GLOBALS) {
  const v = k === 'window' ? W : W[k];
  if (v === undefined) continue;
  Object.defineProperty(globalThis, k, { value: typeof v === 'function' && k !== 'window' && /^[a-z]/.test(k) ? v.bind(W) : v, configurable: true, writable: true });
}
// jsdom: brak przewijania i mediów — no-op po obu stronach.
W.Element.prototype.scrollIntoView = function scrollIntoView() {};
W.Element.prototype.scrollTo = function scrollTo() {};
W.HTMLMediaElement.prototype.play = function play() { return Promise.resolve(); };
W.HTMLMediaElement.prototype.pause = function pause() {};
W.HTMLMediaElement.prototype.load = function load() {};
// `mainMenu.ts` „Wyjdź” woła `window.close()` — w jsdom zamknęłoby okno harnessu; no-op po obu stronach (okno „nie zamknięte”).
W.close = function close() {};
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

const tmp = mkdtempSync(join(tmpdir(), 'p55-harness-'));
const pinOut = join(tmp, 'pin');
const v2Out = join(tmp, 'v2');
let exitCode = 0;
try {
  await bundle([...[...L2, ...AUX].map((m) => join(PIN_SRC, 'ui', m)), ...PIN_REF.map((m) => join(PIN_SRC, m))], pinOut);
  await bundle([...V2_CTRL.map((m) => join(V2_ROOT, 'src', m)), ...[...L2, ...AUX].map((m) => join(V2_ROOT, 'src/ui', m))], v2Out);
  const imp = (base, rel) => import(pathToFileURL(join(base, rel.replace(/\.ts$/, '.js'))).href);

  const pin = {};
  for (const m of PIN_REF) pin[m] = await imp(pinOut, m);
  for (const m of [...L2, ...AUX]) pin['ui/' + m] = await imp(pinOut, 'ui/' + m);

  const json = (f) => JSON.parse(readFileSync(join(PIN_DATA, f), 'utf8'));
  const unitsJson = json('units.json');
  const techJson = json('tech.json');
  const countersJson = json('counters.json');
  const wikiJson = JSON.parse(readFileSync(join(PIN_SRC, 'data/wikiBundle.json'), 'utf8'));
  const { categoryOf } = pin['units/setup.ts'];
  const TECHS = techJson.technologie;
  const CITIES = pin['game/cities.ts'];

  // „Rust”: StaticCatalogDto z danych i funkcji pinu.
  const unitCategory = {};
  const unitCategoryNameOnly = {};
  for (const u of unitsJson) {
    unitCategory[u.Jednostka] = categoryOf(u.Jednostka ?? '', u['Rola (linia)'] ?? '', u['Super-jednostka'] === 'TAK', u['Typ']);
    unitCategoryNameOnly[u.Jednostka] = categoryOf(u.Jednostka ?? '', '', false, undefined);
  }
  const techTerrainUnlockLabels = {};
  for (const t of TECHS) techTerrainUnlockLabels[t.Technologia] = pin['game/improvement-tech.ts'].terrainUnlockLabelsForTech(t.Technologia);
  const catalog = {
    contentHash: 'harness-pin-edb8fb56',
    buildings: json('buildings.json'), units: unitsJson, tech: techJson, terrainImprovements: json('terrain-improvements.json'),
    wonders: json('wonders.json'), counters: countersJson, civs: json('civs.json'), cityNamesPools: {}, powerParams: {},
    uiParams: json('ui-params.json'), wiki: wikiJson,
    constants: {
      researchQueueMax: pin['game/playerState.ts'].RESEARCH_QUEUE_MAX,
      maxProcentPuliImperium: CITIES.MAX_PROCENT_PULI_IMPERIUM,
      maxUlepszeniaPracaAutoPercent: CITIES.MAX_ULEPSZENIA_PRACA_AUTO_PERCENT,
      tempoGry: { ...pin['game/tech-tempo.ts'].TEMPO_GRY },
    },
    labels: {},
    unitCategory, unitCategoryNameOnly, techTerrainUnlockLabels,
  };
  const v2 = {};
  for (const m of V2_CTRL) v2[m] = await imp(v2Out, m);
  v2['controller/staticCatalog.ts'].installStaticCatalog(catalog);
  for (const m of [...L2, ...AUX]) v2['ui/' + m] = await imp(v2Out, 'ui/' + m);

  // „Rust”: UnitCardDto.badges z funkcji pinu (jak run-level1a.mjs).
  const UB = pin['game/unit-building-bonuses.ts'];
  const VT = pin['game/veteran.ts'];
  const badges = (inp) => ({
    softPath: UB.softPathBadgeLevel({ parametryBonusProc: inp.parametryPathPp ?? 0 }),
    armorPath: UB.armorPathBadgeLevel({ pancerzBonusProc: inp.pancerzPathPp ?? 0 }),
    veteranStars: VT.veteranStarCount(inp.veteranProgress ?? null),
  });

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
  const act = (name, ret) => (...a) => { actionLog.push(name + '(' + a.map(fmtArg).join(',') + ')'); return ret; };
  const dumpActions = () => {
    const pre = document.createElement('pre');
    pre.setAttribute('data-action-log', '');
    pre.textContent = actionLog.join('\n');
    document.body.appendChild(pre);
  };
  /** `stash` per moduł: węzły trzymane przez moduł między wywołaniami wracają do `body` swojej strony. */
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
      if (stash) st[name] = [...document.body.childNodes].filter((n) => !(n.nodeType === 1 && n.hasAttribute('data-action-log')));
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
  };
  const fire = (el, type, init = {}) => el?.dispatchEvent(new W.MouseEvent(type, { bubbles: true, cancelable: true, clientX: 120, clientY: 80, ...init }));
  const key = (k, target = document) => target.dispatchEvent(new W.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const data = (v) => JSON.parse(JSON.stringify(v ?? null));
  const safe = (fn) => { try { return fn(); } catch (e) { return { throw: String(e?.message ?? e) }; } };
  const desc = (el) => (el ? el.tagName.toLowerCase() + '.' + (el.getAttribute('class') ?? '') + [...el.attributes].filter((a) => a.name.startsWith('data-')).map((a) => `[${a.name}=${a.value}]`).join('') : 'BRAK');

  const CLICK_SEL = 'button, [data-act], [data-key], [data-id], [data-oid], [data-wonder-id], [data-found-city], [data-tab], [data-filter], [role="button"], [tabindex], input[type="checkbox"], input[type="radio"], summary, a[href], [data-z]';
  const INPUT_SEL = 'input[type="range"], input[type="number"], input[type="text"], input:not([type]), select, textarea';
  /**
   * Eksploracja: otwarcie (`open`), klik w każdy element `CLICK_SEL` (osobny przypadek), zmiana każdego pola
   * `INPUT_SEL`, zadane klawisze. `setup(S, side)` otwiera panel od zera; `after(S, side)` po akcji (np. `update`).
   */
  async function explore(M, label, setup, { P, V, cleanupP, cleanupV, stash = false, maxClicks = 80, keys = [], after, clickSel = CLICK_SEL } = {}) {
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
          if (el.tagName === 'SELECT') el.value = el.options[el.options.length - 1]?.value ?? '';
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
  const mods = (m) => [pin['ui/' + m], v2['ui/' + m]];

  // ─── 1. leaderBannersHud.ts ───────────────────────────────────────────────
  if (want('leaderBannersHud.ts')) {
    const M = 'leaderBannersHud.ts';
    const [P, V] = mods(M);
    const api = {};
    await explore(M, 'create', (S, s) => { api[s] = S.createLeaderBannersHud(); actionLog.push('el=' + api[s].el.className); },
      { P, V, cleanupP: () => api.pin?.destroy(), cleanupV: () => api.v2?.destroy() });
    await domCase(M, 'destroy', () => { P.createLeaderBannersHud().destroy(); }, () => { V.createLeaderBannersHud().destroy(); });
  }

  // ─── 2. cityCaptureNotice.ts ──────────────────────────────────────────────
  if (want('cityCaptureNotice.ts')) {
    const M = 'cityCaptureNotice.ts';
    const [P, V] = mods(M);
    const rows = [
      { label: 'Złoto', value: '+120', tone: 'gain', group: 'lup' },
      { label: 'Ludność <x>', value: '−2', tone: 'loss', group: 'strata' },
      { label: 'Budynki', value: '3 przejęte', tone: 'info', group: 'przejete' },
      { label: 'Szczegół A', value: '1', collapsible: true },
      { label: 'Szczegół B', value: '2', tone: 'gain', collapsible: true, group: 'lup' },
    ];
    const VARS = [
      ['bez-opcji', 'Ateny', undefined],
      ['callbacki', 'Sparta <b>', { onEnterCity: 'cb', onStayOnMap: 'cb' }],
      ['eliminacja', 'Rzym', { onEnterCity: 'cb', eliminatedCivLabel: 'Rzymianie', eliminatedDetails: 'Ostatnie miasto & koniec' }],
      ['raport', 'Teby', { onStayOnMap: 'cb', reportRows: rows }],
      ['raport-pusty', 'Korynt', { reportRows: [] }],
    ];
    for (const [name, city, o] of VARS) {
      const mk = (S) => {
        const opts = o === undefined ? undefined : { ...o };
        if (opts?.onEnterCity) opts.onEnterCity = act('onEnterCity');
        if (opts?.onStayOnMap) opts.onStayOnMap = act('onStayOnMap');
        S.showCityCaptureNotice(city, opts);
        actionLog.push('open=' + S.isCityCaptureNoticeOpen());
      };
      await explore(M, `show(${name})`, mk, { P, V, cleanupP: () => P.hideCityCaptureNotice(), cleanupV: () => V.hideCityCaptureNotice(), keys: ['Escape', 'Enter'],
        after: (S) => actionLog.push('open-po=' + S.isCityCaptureNoticeOpen()) });
    }
    for (const [name, o] of [['zdobycie', { title: 'Miasto zdobyte', cityName: 'Ateny', subtitle: 'Podtytuł', rows, rowsTitle: 'Bilans zdobycia' }],
      ['strata', { title: 'Miasto utracone', cityName: 'Rzym <i>', rows: rows.slice(0, 2) }], ['puste', { title: 'T', cityName: 'C', rows: [] }]]) {
      await explore(M, `raport(${name})`, (S) => { S.showCaptureReportNotice(o); actionLog.push('open=' + S.isCityCaptureNoticeOpen()); },
        { P, V, cleanupP: () => P.hideCityCaptureNotice(), cleanupV: () => V.hideCityCaptureNotice(), keys: ['Escape'],
          after: (S) => actionLog.push('open-po=' + S.isCityCaptureNoticeOpen()) });
    }
  }

  // ─── 3–5. cityForeignPick.ts / cityUnitPick.ts / unitForeignPick.ts ───────
  {
    const picks = [
      ['cityForeignPick.ts', 'showCityForeignPick', 'hideCityForeignPick', 'isCityForeignPickOpen', [
        { cityName: 'Ateny', civName: 'Grecy', cityPopulation: 7.6 },
        { cityName: 'Sparta <x>', civName: 'Grecy & co', diplomacyAvailable: false, cancel: true },
        { cityName: 'Teby', civName: 'X', diplomacyAvailable: true, cancel: true },
      ], ['onInfo', 'onDiplomacy']],
      ['cityUnitPick.ts', 'showCityUnitPick', 'hideCityUnitPick', 'isCityUnitPickOpen', [
        { cityName: 'Ateny', unitLabel: 'Hoplita' },
        { cityName: 'Rzym', cityPopulation: 12.4, unitLabel: 'Legion <x>', unitHealthPercent: 66.6, unitRuchLeft: 1.6, unitRuchMax: 2, stackCount: 3, cancel: true },
        { cityName: 'Teby', unitLabel: 'Łucznik', unitRuchLeft: -1, unitRuchMax: 0, stackCount: 1, cancel: true },
        { cityName: 'Korynt', unitLabel: 'Para', unitHealthPercent: 100, stackCount: 2 },
      ], ['onCity', 'onUnit']],
      ['unitForeignPick.ts', 'showUnitForeignPick', 'hideUnitForeignPick', 'isUnitForeignPickOpen', [
        { unitName: 'Hoplita', civName: 'Grecy', unitHp: 7.4, unitHpMax: 10 },
        { unitName: 'Legion <x>', civName: 'Rzym', diplomacyAvailable: false, cancel: true },
        { unitName: 'Rydwan', civName: 'Egipt', unitHp: 3, cancel: true },
      ], ['onInfo', 'onDiplomacy']],
    ];
    for (const [M, show, hide, isOpen, variants, cbs] of picks) {
      if (!want(M)) continue;
      const [P, V] = mods(M);
      for (const [vi, v] of variants.entries()) {
        const mk = (S) => {
          const o = { ...v };
          delete o.cancel;
          for (const c of cbs) o[c] = act(c);
          if (v.cancel) o.onCancel = act('onCancel');
          S[show](o);
          actionLog.push('open=' + S[isOpen]());
        };
        await explore(M, `show#${vi}`, mk, { P, V, cleanupP: () => P[hide](), cleanupV: () => V[hide](), keys: ['1', '2', '3', 'Escape', 'Enter'],
          after: (S) => actionLog.push('open-po=' + S[isOpen]()) });
      }
    }
  }

  // ─── 6. gamePauseMenu.ts ──────────────────────────────────────────────────
  if (want('gamePauseMenu.ts')) {
    const M = 'gamePauseMenu.ts';
    const [P, V] = mods(M);
    const CFGS = [
      ['minimalny', {}],
      ['pełny', { hasSave: true, music: [true, 0.42], amb: [false, 0.1], sfx: [true, 1], freq: 5 }],
      ['skrajne', { hasSave: false, music: [false, 2], amb: [true, -1], sfx: [false, 0], freq: 37.6 }],
    ];
    for (const [name, c] of CFGS) {
      const cfg = () => {
        const o = { onResume: act('onResume'), onSave: act('onSave'), onLoad: act('onLoad'), onNewGame: act('onNewGame'), onMainMenu: act('onMainMenu') };
        if (c.hasSave !== undefined) o.hasSave = () => c.hasSave;
        if (c.music) Object.assign(o, { getMusicEnabled: () => c.music[0], getMusicVolume: () => c.music[1], onMusicToggle: act('onMusicToggle'), onMusicVolumeChange: act('onMusicVolumeChange') });
        if (c.amb) Object.assign(o, { getAmbienceEnabled: () => c.amb[0], getAmbienceVolume: () => c.amb[1], onAmbienceToggle: act('onAmbienceToggle'), onAmbienceVolumeChange: act('onAmbienceVolumeChange') });
        if (c.sfx) Object.assign(o, { getSfxEnabled: () => c.sfx[0], getSfxVolume: () => c.sfx[1], onSfxToggle: act('onSfxToggle'), onSfxVolumeChange: act('onSfxVolumeChange') });
        if (c.freq !== undefined) Object.assign(o, { getAutosaveFreq: () => c.freq, onAutosaveFreqChange: act('onAutosaveFreqChange') });
        return o;
      };
      const mk = (S) => { S.configureGamePauseMenu(cfg()); S.showGamePauseMenu(); actionLog.push('open=' + S.isGamePauseMenuOpen()); };
      await explore(M, `menu(${name})`, mk, { P, V, cleanupP: () => P.hideGamePauseMenu(), cleanupV: () => V.hideGamePauseMenu(), keys: ['Escape'],
        after: (S) => { S.refreshGamePauseMenuLoadState(); actionLog.push('open-po=' + S.isGamePauseMenuOpen()); } });
      await domCase(M, `toggle(${name})`, () => { P.configureGamePauseMenu(cfg()); P.toggleGamePauseMenu(); actionLog.push('t1=' + P.isGamePauseMenuOpen()); P.toggleGamePauseMenu(); actionLog.push('t2=' + P.isGamePauseMenuOpen()); P.toggleGamePauseMenu(); },
        () => { V.configureGamePauseMenu(cfg()); V.toggleGamePauseMenu(); actionLog.push('t1=' + V.isGamePauseMenuOpen()); V.toggleGamePauseMenu(); actionLog.push('t2=' + V.isGamePauseMenuOpen()); V.toggleGamePauseMenu(); },
        { cleanupPin: () => P.hideGamePauseMenu(), cleanupV2: () => V.hideGamePauseMenu() });
    }
  }

  // ─── 7. hotSeatHandoff.ts ─────────────────────────────────────────────────
  if (want('hotSeatHandoff.ts')) {
    const M = 'hotSeatHandoff.ts';
    const [P, V] = mods(M);
    for (const [vi, info] of [{ fromLabel: 'Gracz 1', toLabel: 'Gracz 2' }, { fromLabel: 'Ateny <x>', toLabel: 'Sparta & co', toCivIconId: 'grecja' }, { fromLabel: '', toLabel: 'Rzym', toCivIconId: 'nieznana' }].entries()) {
      await explore(M, `show#${vi}`, (S) => { S.showHotSeatHandoff(info, act('onContinue')); actionLog.push('open=' + S.isHotSeatHandoffOpen()); },
        { P, V, cleanupP: () => P.hideHotSeatHandoff(), cleanupV: () => V.hideHotSeatHandoff(), keys: ['Enter', ' ', 'Escape'],
          after: (S) => actionLog.push('open-po=' + S.isHotSeatHandoffOpen()) });
    }
  }

  // ─── 8. mainMenu.ts ───────────────────────────────────────────────────────
  if (want('mainMenu.ts')) {
    const M = 'mainMenu.ts';
    const [P, V] = mods(M);
    cmpVal(M, 'DEFAULT_MENU_VIDEO_URL', P.DEFAULT_MENU_VIDEO_URL, V.DEFAULT_MENU_VIDEO_URL);
    cmpVal(M, 'getMenuSettings()', P.getMenuSettings(), V.getMenuSettings());
    cmpVal(M, 'getMenuAudioVolumes()', P.getMenuAudioVolumes(), V.getMenuAudioVolumes());
    for (const vol of [{ muzyka: 0 }, { efekty: 0.33 }, { muzyka: 0.71, efekty: 1 }, { muzyka: 2, efekty: -1 }]) {
      P.syncMenuAudioVolumes(vol);
      V.syncMenuAudioVolumes(vol);
      cmpVal(M, `sync(${JSON.stringify(vol)})`, [P.getMenuSettings(), P.getMenuAudioVolumes()], [V.getMenuSettings(), V.getMenuAudioVolumes()]);
    }
    const CFGS = [
      ['domyślny', undefined],
      ['pełny', { version: 'v9 <x>', backgroundVideoUrl: 'video.webm', hasSave: true, initialAudioVolumes: { muzyka: 0.2, efekty: 0.5 }, perf: true }],
      ['bez-zapisu', { hasSave: false, initialAudioVolumes: { muzyka: 0 } }],
    ];
    for (const [name, c] of CFGS) {
      const cfg = () => (c === undefined ? undefined : {
        ...c, hasSave: () => c.hasSave, onNewGame: act('onNewGame'), onContinue: act('onContinue'), onLoad: act('onLoad'), onAbout: act('onAbout'),
        onQuit: act('onQuit'), onSettingsChange: act('onSettingsChange'), onPerfTest: c.perf ? act('onPerfTest') : undefined,
      });
      const mk = (S) => { S.showMainMenu(cfg()); actionLog.push('open=' + S.isMainMenuOpen() + ' ' + JSON.stringify(S.getMenuSettings())); };
      await explore(M, `menu(${name})`, mk, { P, V, stash: true, cleanupP: () => P.hideMainMenu(), cleanupV: () => V.hideMainMenu(), keys: ['Escape', 'Enter'],
        // 150 ms: ekran pożegnalny „Wyjdź” pojawia się po `setTimeout(…, 120)` — w obrębie tej samej strony.
        after: async (S) => { await sleep(150); actionLog.push('po=' + S.isMainMenuOpen() + ' ' + JSON.stringify(S.getMenuSettings())); } });
    }
    assertV2(M, [['obraz tła menu = bajty `assets/hero/hero-menu.png` (data URI; `?url`)', readFileSync(join(V2_ROOT, 'src/ui/assets/hero/hero-menu.png')).equals(readFileSync(join(PIN_SRC, 'ui/assets/hero/hero-menu.png')))]]);
  }

  // ─── 9. contextPanelHud.ts ────────────────────────────────────────────────
  if (want('contextPanelHud.ts')) {
    const M = 'contextPanelHud.ts';
    const [P, V] = mods(M);
    for (const [vi, msgs] of [[undefined], [null, '  ', 'Tekst <b>pogrubiony</b> <span class="cp-lbl">x</span>', ''], ['A & B']].entries()) {
      const run = (S) => {
        let i = 0;
        const api = S.createContextPanelHud(msgs[0] === undefined ? undefined : { getMessage: () => msgs[i] ?? null });
        actionLog.push('0:' + api.el.outerHTML);
        for (i = 1; i < msgs.length; i++) { api.update(); actionLog.push(i + ':' + api.el.outerHTML); }
      };
      await domCase(M, `panel#${vi}`, () => run(P), () => run(V));
    }
  }

  // ─── 10. diplomacyProposalBanner.ts ───────────────────────────────────────
  if (want('diplomacyProposalBanner.ts')) {
    const M = 'diplomacyProposalBanner.ts';
    const [P, V] = mods(M);
    for (const [acc, reason] of [[true, 'Pokój przyjęty <x>'], [false, ''], [false, 'Odmowa & powód']]) {
      await domCase(M, `banner(${acc},${reason})`, () => P.showDiplomacyProposalBanner(acc, reason), () => V.showDiplomacyProposalBanner(acc, reason),
        { cleanupPin: () => P.hideDiplomacyProposalBanner(), cleanupV2: () => V.hideDiplomacyProposalBanner() });
    }
    await domCase(M, 'podmiana+hide', () => { P.showDiplomacyProposalBanner(true, 'a'); P.showDiplomacyProposalBanner(false, 'b'); actionLog.push(document.body.innerHTML); P.hideDiplomacyProposalBanner(); },
      () => { V.showDiplomacyProposalBanner(true, 'a'); V.showDiplomacyProposalBanner(false, 'b'); actionLog.push(document.body.innerHTML); V.hideDiplomacyProposalBanner(); });
    notMeasured(M, 'auto-ukrycie po 4500 ms (`setTimeout`) — nie czekano; `hide` porównany jawnie');
  }

  // ─── 11. hudChip6c.ts ─────────────────────────────────────────────────────
  if (want('hudChip6c.ts')) {
    const M = 'hudChip6c.ts';
    const [P, V] = mods(M);
    const IDS = ['res-food', 'res-work', 'res-treasury', 'res-science', 'res-culture', 'res-religion', 'res-population', 'res-influence',
      'res-settlements', 'res-resources', 'res-trade', 'tb-cities', 'tb-science', 'tb-diplomacy', 'tb-army'];
    for (const id of IDS) {
      for (const o of [{}, { rate: '+3', rateWarn: true, act: 'open-x', title: 'Tytuł "x"', researchProgress: 0.42 }, { medVariant: 'science', valClass: ' warn', iconAssetId: 'chip-crate', rate: '−1' }]) {
        const opts = { iconId: id, label: 'Etykieta <b>', value: '12 & 3', ...o };
        cmpVal(M, `chip6cHtml(${id},${JSON.stringify(o)})`, P.chip6cHtml(opts), V.chip6cHtml(opts));
      }
    }
    cmpVal(M, 'chip6cSep()', P.chip6cSep(), V.chip6cSep());
  }

  // ─── 12. mapToolbarHud.ts ─────────────────────────────────────────────────
  if (want('mapToolbarHud.ts')) {
    const M = 'mapToolbarHud.ts';
    const [P, V] = mods(M);
    const CFGS = [
      ['pusty', {}],
      ['aktywny', { act: true, war: 3, research: 0.37, ih: [true, true, 2] }],
      ['wyłączony', { act: false, war: 0, research: 1.4, ih: [false, false, 0] }],
      ['ih-bez-badge', { act: false, war: 1, research: -0.2, ih: [true, false, 0] }],
    ];
    for (const [name, c] of CFGS) {
      const api = {};
      const cfg = () => {
        const o = {};
        if (c.act !== undefined) {
          for (const k of ['onOpenCities', 'onOpenScience', 'onOpenCulture', 'onOpenReligion', 'onOpenDiplomacy', 'onOpenArmy', 'onOpenBuild', 'onOpenInterHumanDiplo']) o[k] = act(k);
          for (const k of ['isCityListActive', 'isArmyListActive', 'isDiploListActive', 'isScienceHubActive', 'isBuildModeActive', 'isCultureRangeActive', 'isReligionRangeActive']) o[k] = () => c.act;
          o.getWarBadge = () => c.war;
          o.getResearchProgress = () => c.research;
          o.isInterHumanDiploVisible = () => c.ih[0];
          o.isInterHumanDiploActive = () => c.ih[1];
          o.getInterHumanProposalsBadge = () => c.ih[2];
        }
        return o;
      };
      await explore(M, `toolbar(${name})`, (S, s) => { api[s] = S.createMapToolbarHud(cfg()); },
        { P, V, cleanupP: () => api.pin?.destroy(), cleanupV: () => api.v2?.destroy(), after: (S, s) => api[s].update() });
    }
    cmpVal(M, 'TOOLBAR_*', [P.TOOLBAR_BTN_PX, P.TOOLBAR_LEFT_PX, P.TOOLBAR_TOP_PX], [V.TOOLBAR_BTN_PX, V.TOOLBAR_LEFT_PX, V.TOOLBAR_TOP_PX]);
  }

  // ─── 13–14. armyMergePickPanel.ts / armySplitPanel.ts ─────────────────────
  {
    const U = (n, extra = {}) => Array.from({ length: n }, (_, i) => ({ id: 'u' + i, name: 'Jednostka <' + i + '>', icon: i % 2 ? '🛡' : undefined, ruchLeft: i, ruchMax: 2, ...extra }));
    if (want('armyMergePickPanel.ts')) {
      const M = 'armyMergePickPanel.ts';
      const [P, V] = mods(M);
      const VARS = [
        { hexLabel: 'Heks (3, 4)', sourceUnits: U(3), targets: [{ q: 1, r: 2, label: 'Cel A', units: U(2) }, { q: -1, r: 0, label: 'Cel <B>', units: [] }] },
        { hexLabel: 'Heks', sourceUnits: U(1), targets: [{ q: 0, r: 0, label: 'Jedyny', units: U(4) }] },
        { hexLabel: 'Pusty', sourceUnits: [], targets: [] },
      ];
      for (const [vi, v] of VARS.entries()) {
        await explore(M, `show#${vi}`, (S) => { S.showArmyMergePickPanel({ ...v, onMerge: act('onMerge'), onCancel: act('onCancel') }); actionLog.push('open=' + S.isArmyMergePickPanelOpen()); },
          { P, V, cleanupP: () => P.hideArmyMergePickPanel(), cleanupV: () => V.hideArmyMergePickPanel(), keys: ['Escape', 'Enter'],
            after: (S) => actionLog.push('open-po=' + S.isArmyMergePickPanelOpen()) });
      }
    }
    if (want('armySplitPanel.ts')) {
      const M = 'armySplitPanel.ts';
      const [P, V] = mods(M);
      const VARS = [
        { hexLabel: 'Heks (3, 4)', units: U(4), destHexes: [{ q: 1, r: 2, label: 'N' }, { q: 2, r: 2, label: 'NE <x>' }] },
        { hexLabel: 'Dwie', units: U(2), destHexes: [{ q: 0, r: 1, label: 'S' }] },
        { hexLabel: 'Jedna (brak panelu)', units: U(1), destHexes: [{ q: 0, r: 1, label: 'S' }] },
        { hexLabel: 'Brak celów', units: U(3), destHexes: [] },
      ];
      for (const [vi, v] of VARS.entries()) {
        await explore(M, `show#${vi}`, (S) => { S.showArmySplitPanel({ ...v, onSplit: act('onSplit'), onCancel: act('onCancel') }); actionLog.push('open=' + S.isArmySplitPanelOpen()); },
          { P, V, cleanupP: () => P.hideArmySplitPanel(), cleanupV: () => V.hideArmySplitPanel(), keys: ['Escape'],
            after: (S) => actionLog.push('open-po=' + S.isArmySplitPanelOpen()) });
      }
      // Sekwencja: odznacz/zaznacz wszystkie i „Podziel” (reguła UI `stay < 1`, pin :170).
      for (const n of [2, 4]) {
        const run = (S) => {
          S.showArmySplitPanel({ hexLabel: 'Seq', units: U(n), destHexes: [{ q: 1, r: 1, label: 'X' }, { q: 2, r: 1, label: 'Y' }], onSplit: act('onSplit'), onCancel: act('onCancel') });
          const rows = [...document.querySelectorAll('[data-uid], [data-id], input[type="checkbox"]')];
          for (const r of rows) fire(r, 'click');
          actionLog.push(ser(document.body));
          for (const b of [...document.querySelectorAll('button')].filter((b) => b.hasAttribute('data-go'))) fire(b, 'click');
          actionLog.push('open-po=' + S.isArmySplitPanelOpen());
        };
        await domCase(M, `sekwencja(${n})`, () => run(P), () => run(V), { cleanupPin: () => P.hideArmySplitPanel(), cleanupV2: () => V.hideArmySplitPanel() });
      }
    }
  }

  // ─── 15. diplomacyPendingHud.ts ───────────────────────────────────────────
  if (want('diplomacyPendingHud.ts')) {
    const M = 'diplomacyPendingHud.ts';
    const [P, V] = mods(M);
    const item = { id: 'p1', civName: 'Grecy <x>', title: 'Propozycja pokoju', detail: 'Szczegóły & warunki' };
    for (const [vi, o] of [undefined, { hasNext: true, next: true }, { hasNext: false, next: true }, { hasNext: true }].entries()) {
      await explore(M, `modal#${vi}`, (S) => S.showDiplomacyPendingModal(item, act('onAccept'), act('onReject'), o === undefined ? undefined : { hasNext: o.hasNext, onNext: o.next ? act('onNext') : undefined }),
        { P, V, cleanupP: () => P.hideDiplomacyPendingModal(), cleanupV: () => V.hideDiplomacyPendingModal(), keys: ['Escape', 'Enter'] });
    }
  }

  // ─── 16. interHumanDiplomacyHud.ts ────────────────────────────────────────
  if (want('interHumanDiplomacyHud.ts')) {
    const M = 'interHumanDiplomacyHud.ts';
    const [P, V] = mods(M);
    const PROPS = [
      { id: 'a', fromLabel: 'Gracz 1', kind: 'zaproponuj_pokoj', detail: 'Pokój <x>', fields: { powod: 'koniec wojny' } },
      { id: 'b', fromLabel: 'Gracz 1', kind: 'zaproponuj_sojusz', detail: 'Sojusz', fields: { powod: '', allianceKind: 'pelny' } },
      { id: 'c', fromLabel: 'Gracz 1', kind: 'zaproponuj_pakt', detail: 'Pakt', fields: { powod: 'x', turns: 7 } },
      { id: 'd', fromLabel: 'Gracz 1', kind: 'zaproponuj_audiencje', detail: 'Audiencja', fields: { powod: 'y', motive: 'handel & co' } },
      { id: 'e', fromLabel: 'Gracz 1', kind: 'zaproponuj_pakt', detail: 'Pakt bez tur', fields: { powod: 'z' } },
    ];
    for (const [vi, props] of [[], PROPS, PROPS.slice(1, 3)].entries()) {
      await explore(M, `hud#${vi}`, (S) => {
        S.showInterHumanDiplomacyHud({ otherLabel: 'Gracz 2 <y>', proposals: props, onAccept: act('onAccept'), onReject: act('onReject'), onCounter: act('onCounter'),
          onPropose: act('onPropose'), onClose: vi === 1 ? act('onClose') : undefined });
        actionLog.push('open=' + S.isInterHumanDiplomacyHudOpen());
      }, { P, V, cleanupP: () => P.hideInterHumanDiplomacyHud(), cleanupV: () => V.hideInterHumanDiplomacyHud(), keys: ['Escape'],
        after: (S) => { actionLog.push('open-po=' + S.isInterHumanDiplomacyHudOpen()); actionLog.push(ser(document.body)); } });
    }
    // Sekwencja: zmiana rodzaju propozycji (select), wypełnienie pól, wysłanie.
    const run = (S) => {
      S.showInterHumanDiplomacyHud({ otherLabel: 'G2', proposals: PROPS, onAccept: act('onAccept'), onReject: act('onReject'), onCounter: act('onCounter'), onPropose: act('onPropose') });
      for (const sel of document.querySelectorAll('select')) {
        for (const o of [...sel.options]) {
          sel.value = o.value;
          sel.dispatchEvent(new W.Event('change', { bubbles: true }));
          for (const inp of document.querySelectorAll('input')) { inp.value = inp.type === 'number' ? '12' : 'pole ' + o.value; inp.dispatchEvent(new W.Event('input', { bubbles: true })); }
          actionLog.push(ser(document.body));
          for (const b of document.querySelectorAll('button')) if (/Wyślij|Zaproponuj|Kontr/i.test(b.textContent)) { fire(b, 'click'); actionLog.push('klik:' + b.textContent); break; }
        }
      }
    };
    await domCase(M, 'sekwencja-formularz', () => run(P), () => run(V), { cleanupPin: () => P.hideInterHumanDiplomacyHud(), cleanupV2: () => V.hideInterHumanDiplomacyHud() });
  }

  // ─── 17. unitReplacePicker.ts ─────────────────────────────────────────────
  if (want('unitReplacePicker.ts')) {
    const M = 'unitReplacePicker.ts';
    const [P, V] = mods(M);
    const OPTS = [
      { id: 'hoplita', name: 'Hoplita', icon: '🛡', surcharge: 20, atk: 4, def: 6, hpMax: 10 },
      { id: 'legion', name: 'Legion <x>', icon: '<b>L</b>', surcharge: 80, atk: 7, def: 7, hpMax: 12 },
      { id: 'zero', name: 'Bez dopłaty', icon: '', surcharge: 0, atk: 1, def: 1, hpMax: 5 },
    ];
    for (const [vi, v] of [{ options: OPTS, skarb: 50, cancel: true }, { options: OPTS, skarb: 500 }, { options: [], skarb: 0, cancel: true }].entries()) {
      await explore(M, `picker#${vi}`, (S, s) => {
        // „Rust”: `affordable` = formuła pinu `unitReplacePicker.ts:155` (`skarb >= surcharge`); pin pole ignoruje.
        const options = s === 'pin' ? v.options : v.options.map((o) => ({ ...o, affordable: v.skarb >= o.surcharge }));
        S.showUnitReplacePicker({ unitName: 'Wojownik & co', options, skarb: v.skarb, onPick: act('onPick'), onCancel: v.cancel ? act('onCancel') : undefined });
        actionLog.push('open=' + S.isUnitReplacePickerOpen());
      }, { P, V, cleanupP: () => P.hideUnitReplacePicker(), cleanupV: () => V.hideUnitReplacePicker(), keys: ['Escape', '1', '2', 'Enter'],
        after: (S) => actionLog.push('open-po=' + S.isUnitReplacePickerOpen()) });
    }
  }

  // ─── 18. unitActionBarHtml.ts ─────────────────────────────────────────────
  if (want('unitActionBarHtml.ts')) {
    const M = 'unitActionBarHtml.ts';
    const [P, V] = mods(M);
    cmpVal(M, 'UNIT_ACTION_BAR_CSS', P.UNIT_ACTION_BAR_CSS, V.UNIT_ACTION_BAR_CSS);
    const IDS = ['fortify', 'unfortify-all', 'sentry', 'scout-explore', 'split', 'merge', 'replace', 'skip', 'disband', 'march-stop', 'siege-hold', 'nieznana', 'attack', 'garrison'];
    const ALL = IDS.map((id, i) => ({ id, label: 'Akcja <' + id + '>', primary: i % 3 === 0, danger: id === 'disband', disabled: i % 4 === 1, active: i % 5 === 0 ? true : i % 5 === 1 ? false : undefined }));
    for (const [vi, acts] of [[], ALL, ALL.slice(0, 5), ALL.slice(8, 11), ALL.filter((_, i) => i % 2), ALL.map((a) => ({ id: a.id, label: a.label }))].entries()) {
      cmpVal(M, `buildUnitActionBarHtml#${vi}`, P.buildUnitActionBarHtml(acts), V.buildUnitActionBarHtml(acts));
    }
  }

  // ─── 19–20. unitPanelHud.ts / armyStackHud.ts (badges z „Rust”) ──────────
  const STATUS_VARIANTS = [
    {},
    { parametryPathPp: 17, pancerzPathPp: 31, veteranBadgeLabel: 'Weteran <II>', veteranStarsTooltip: '★★', veteranExperienceLine: 'Dośw. 2/3', veteranPanelExplanation: 'Premia "+15%"', inGarnizon: true },
    { parametryPathPp: 34, pancerzPathPp: 0, sentry: true, ufortyfikowanyWPolu: true, oblegaCityName: 'Ateny <x>', buildingBonusLabel: 'Koszary +10%' },
    { parametryPathPp: 5, pancerzPathPp: 46, buildingBonusLabel: 'Kuźnia', glodWojska: true, glodWojskaStatMult: 0.75, glodWojskaHpFrac: 0.1, glodWojskaAtrycjaAktywna: false, glodWojskaTurDoAtrycji: 2, poziomTrudnosciLabel: 'trudny' },
    { zlotoDeficyt: true, zlotoDeficytStatMult: 0.8, zlotoDeficytHpFrac: 0.05, zlotoDeficytAtrycjaAktywna: true, zlotoDeficytTurDoAtrycji: null, buildingBonusLabel: 'X' },
  ];
  const ACTIONS = [{ id: 'fortify', label: 'Fortyfikuj', primary: true, active: true }, { id: 'disband', label: 'Rozwiąż <x>', danger: true }, { id: 'skip', label: 'Pomiń', disabled: true }, { id: 'sentry', label: 'Czuwaj', active: false }];
  if (want('unitPanelHud.ts')) {
    const M = 'unitPanelHud.ts';
    const [P, V] = mods(M);
    const units = [null, ...STATUS_VARIANTS.map((st, i) => ({ name: 'Hoplita <' + i + '>', subtitle: 'Brąz · piechota', icon: i % 2 ? '🛡' : '', ownerEmblemHtml: i === 2 ? '<i>E</i>' : undefined,
      atk: 4 + i, def: 6, mov: 2, rng: i, hp: 7 - i, hpMax: i === 4 ? 0 : 10, actions: i === 1 ? [] : ACTIONS, ...st }))];
    for (const [ui, u] of units.entries()) {
      const api = {};
      const withBadges = u === null ? null : { ...u, badges: badges(u) };
      await explore(M, `panel#${ui}`, (S, s) => { api[s] = S.createUnitPanelHud({ getUnit: () => (s === 'pin' ? u : withBadges), onAction: act('onAction'), onClose: act('onClose') }); },
        { P, V, cleanupP: () => api.pin?.destroy(), cleanupV: () => api.v2?.destroy(), after: (S, s) => api[s].update() });
    }
  }
  if (want('armyStackHud.ts')) {
    const M = 'armyStackHud.ts';
    const [P, V] = mods(M);
    const combat = (k) => ({ atakBase: 4, atakEffective: 4 + k, obronaBase: 6, obronaEffective: 6 - k, hpMaxBase: 10, hpMaxEffective: 10 + k, pancerzBase: 1, pancerzEffective: 1 + k,
      weaponDamageBase: 2, weaponDamageEffective: 2, piercingBase: 0, piercingEffective: k, chargeBonusBase: 0, chargeBonusEffective: 0, missileAttackBase: 0, missileAttackEffective: k });
    const cards = (n) => Array.from({ length: n }, (_, i) => ({ id: 'c' + i, name: 'Karta <' + i + '>', icon: i % 2 ? '🛡' : '', hp: 10 - i, hpMax: 10, ruchLeft: i % 3, ruchMax: 2, active: i === 0 }));
    const stacks = [null, ...STATUS_VARIANTS.map((st, i) => ({ hexLabel: 'Heks <' + i + '>', unitCount: i + 1, cards: cards(i + 1), displayName: i % 2 ? 'Hoplita' : undefined,
      ownerEmblemHtml: i === 3 ? '<i>E</i>' : undefined, combat: combat(i - 1), mov: 2, rng: i, hp: 9 - i, actions: i === 2 ? [] : ACTIONS, ...st }))];
    const CFG = [
      ['minimalny', (s) => ({})],
      ['pełny', (s) => ({ onMerge: act('onMerge'), canMerge: () => true, onSplit: act('onSplit'), canSplit: () => true, onOpenArmyList: act('onOpenArmyList'), onCycleUnit: act('onCycleUnit'), canCycleUnits: () => true })],
      ['zablokowany', (s) => ({ onMerge: act('onMerge'), canMerge: () => false, onSplit: act('onSplit'), canSplit: () => false, onCycleUnit: act('onCycleUnit'), canCycleUnits: () => false })],
    ];
    for (const [si, st] of stacks.entries()) {
      for (const [cn, extra] of CFG) {
        if (st === null && cn !== 'minimalny') continue;
        const api = {};
        const withBadges = st === null ? null : { ...st, badges: badges(st) };
        await explore(M, `stos#${si}(${cn})`, (S, s) => {
          api[s] = S.createArmyStackHud({ getStack: () => (s === 'pin' ? st : withBadges), onSelectUnit: act('onSelectUnit'), onAction: act('onAction'), onClose: act('onClose'), ...extra(s) });
        }, { P, V, cleanupP: () => api.pin?.destroy(), cleanupV: () => api.v2?.destroy(), keys: ['Tab', 'ArrowLeft', 'ArrowRight'], after: (S, s) => api[s].update() });
      }
    }
  }

  // ─── 21. buildModeHud.ts ──────────────────────────────────────────────────
  if (want('buildModeHud.ts')) {
    const M = 'buildModeHud.ts';
    const [P, V] = mods(M);
    const TYPES = [
      { key: 'farma', label: 'Farma', kosztPraca: 20, epoka: 1, typ: 'ulepszenie', techUnlocked: true },
      { key: 'kopalnia_miedzi', label: 'Kopalnia miedzi', kosztPraca: 60, epoka: 2, techId: 'brazownictwo', techUnlocked: false, techLabel: 'Brązownictwo', lockHint: 'Wymaga «Brązownictwo» <x>' },
      { key: 'tartak', label: 'Tartak', kosztPraca: 45, epoka: 1, techUnlocked: false, techLabel: null },
      { key: 'droga', label: 'Droga', kosztPraca: 0, epoka: 1 },
      { key: 'pole_irygowane', label: 'Pole irygowane', kosztPraca: 10, epoka: 2 },
      { key: 'wyrab', label: 'Wyrąb', kosztPraca: 35.5, epoka: 1, typ: 'wycinka', techUnlocked: true },
      { key: 'fort', label: 'Fort', kosztPraca: 120, epoka: 3, techUnlocked: false, techLabel: 'Inżynieria' },
    ];
    const WONDERS = [{ id: 'piramidy', label: 'Piramidy', kosztPraca: 300, epokaWejscia: 1, dostep: 'R' }, { id: 'mur', label: 'Mur <x>', kosztPraca: 200, epokaWejscia: 2, dostep: 'E', building: true },
      { id: 'kolos', label: 'Kolos', kosztPraca: 0, epokaWejscia: 2, lockHint: 'Zablokowane: X' }];
    const empire = (o) => ({ focus: 'zrownowazone', tryb: 'auto', onlyWorked: true, pracaAutoPercent: 40, wolnoWycinacLas: false, ...o });
    const SC = [
      ['zamknięty', { open: false }],
      ['podstawowy', { open: true, pool: undefined }],
      ['pula-40', { open: true, pool: 40.7, active: 'farma', wonders: true, wonderTarget: 'Postęp: 3/5', cities: true, emp: empire(), cityId: null }],
      ['miasto-override', { open: true, pool: 1000, wonders: true, activeWonder: 'piramidy', cities: true, emp: empire({ tryb: 'reczny', focus: 'zywnosc' }), cityId: 'c1', override: true,
        eff: { focus: 'surowce', tryb: 'auto', onlyWorked: false, pracaAutoPercent: 75, wolnoWycinacLas: true, override: true } }],
      ['miasto-bez-override', { open: true, pool: 0, cities: true, emp: empire({ tryb: 'auto', onlyWorked: false, wolnoWycinacLas: true, pracaAutoPercent: 0 }), cityId: 'c2', override: false,
        eff: { focus: 'infrastruktura', tryb: 'reczny', onlyWorked: true, pracaAutoPercent: 100, wolnoWycinacLas: false, override: false } }],
      ['załóż-miasto', { open: true, found: true, foundActive: false, foundHint: 'Za mało P <x>', foundCost: '20 P · 1 👤', pool: 50 }],
      ['tylko-miasto', { open: true, found: true, foundOnly: true, foundActive: true, foundCost: '20 P' }],
    ];
    for (const [name, c] of SC) {
      const api = {};
      const cfg = (s) => {
        const pool = c.pool;
        const types = TYPES.map((t) => (s === 'pin' ? { ...t } : { ...t, affordable: !(t.kosztPraca > (pool ?? Infinity)) }));
        const o = { listTypes: () => types, getActiveKey: () => c.active ?? null, onSelectType: act('onSelectType'), onExit: act('onExit'), isOpen: () => c.open };
        if (pool !== undefined) o.getPracaPool = () => pool;
        if (c.wonders) Object.assign(o, { listWonders: () => WONDERS, onSelectWonder: act('onSelectWonder'), getActiveWonderId: () => c.activeWonder ?? null, getWonderTargetLabel: () => c.wonderTarget ?? null });
        if (c.found) Object.assign(o, { canFoundCity: () => true, isFoundCityActive: () => c.foundActive, onSelectFoundCity: act('onSelectFoundCity'), getFoundCityCostLabel: () => c.foundCost, getFoundCityLockHint: () => c.foundHint ?? null, isFoundCityOnly: () => !!c.foundOnly });
        if (c.cities) {
          Object.assign(o, {
            listPlayerCities: () => [{ id: 'c1', name: 'Ateny' }, { id: 'c2', name: 'Sparta <x>' }], getUlepszeniaCityId: () => c.cityId, onUlepszeniaCityIdChange: act('onUlepszeniaCityIdChange'),
            getUlepszeniaEmpireState: () => c.emp, onUlepszeniaEmpireFocusChange: act('onUlepszeniaEmpireFocusChange'), onUlepszeniaEmpireTrybChange: act('onUlepszeniaEmpireTrybChange'),
            onUlepszeniaEmpireOnlyWorkedChange: act('onUlepszeniaEmpireOnlyWorkedChange'), onUlepszeniaEmpireWyrabChange: act('onUlepszeniaEmpireWyrabChange'),
            onUlepszeniaEmpirePracaPercentChange: act('onUlepszeniaEmpirePracaPercentChange'), getUlepszeniaCityOverride: () => !!c.override,
            onUlepszeniaCityOverrideChange: act('onUlepszeniaCityOverrideChange'), getUlepszeniaEffectiveState: () => c.eff ?? null,
            onUlepszeniaCityFocusChange: act('onUlepszeniaCityFocusChange'), onUlepszeniaCityTrybChange: act('onUlepszeniaCityTrybChange'),
            onUlepszeniaCityOnlyWorkedChange: act('onUlepszeniaCityOnlyWorkedChange'), onUlepszeniaCityWyrabChange: act('onUlepszeniaCityWyrabChange'),
            onUlepszeniaCityPracaPercentChange: act('onUlepszeniaCityPracaPercentChange'),
          });
        }
        return o;
      };
      const cleanup = (s) => () => { api[s]?.destroy(); for (const b of document.querySelectorAll('.entity-card-backdrop')) fire(b, 'click'); };
      await explore(M, `budowa(${name})`, (S, s) => { api[s] = S.createBuildModeHud(cfg(s)); document.body.append(api[s].el, api[s].bannerEl); api[s].update(); },
        { P, V, cleanupP: cleanup('pin'), cleanupV: cleanup('v2'), keys: ['Escape'], after: (S, s) => api[s].update() });
      // Najechanie na pozycje zablokowane (dymek blokady).
      const hover = (S, s) => {
        api[s] = S.createBuildModeHud(cfg(s));
        document.body.append(api[s].el, api[s].bannerEl);
        api[s].update();
        for (const it of document.querySelectorAll('.civ-build-item')) {
          fire(it, 'mouseenter', { bubbles: false });
          actionLog.push('tip:' + (document.querySelector('.civ-build-lock-tip')?.outerHTML ?? ''));
          fire(it, 'mouseleave', { bubbles: false });
        }
      };
      await domCase(M, `hover(${name})`, () => hover(P, 'pin'), () => hover(V, 'v2'), { cleanupPin: cleanup('pin'), cleanupV2: cleanup('v2') });
    }
    assertV2(M, [['stałe zakresu z katalogu = pin (`MAX_PROCENT_PULI_IMPERIUM`, `MAX_ULEPSZENIA_PRACA_AUTO_PERCENT`)',
      catalog.constants.maxProcentPuliImperium === CITIES.MAX_PROCENT_PULI_IMPERIUM && catalog.constants.maxUlepszeniaPracaAutoPercent === CITIES.MAX_ULEPSZENIA_PRACA_AUTO_PERCENT]]);
    notMeasured(M, 'zamknięcie kliknięciem poza panelem (`pointerdown` na `document`, pin :396-410) — wspólny `document` obu stron, nie wysyłane');
    notMeasured(M, 'pozycja dymka blokady (`offsetWidth`/`innerWidth`) — jsdom bez układu (0×0); porównany tylko jako ten sam wynik');
  }

  // ─── 22. diplomacyPanel.ts ────────────────────────────────────────────────
  if (want('diplomacyPanel.ts')) {
    const M = 'diplomacyPanel.ts';
    const [P, V] = mods(M);
    for (const t of [-2, -1, 0, 0.4, 0.5, 1, 2, 2.6, 3, 4, 5, 9, Number.NaN]) cmpVal(M, `tier(${t})`, [P.tierLabel(t), P.tierBg(t), P.tierFg(t)], [V.tierLabel(t), V.tierBg(t), V.tierFg(t)]);
    const RELS = [
      { ownerId: 1, civ: 'Grecy', tier: 3, zaufanie: 65, respekt: 40, theirRespekt: 20, population: 12.7, armyCount: 4, cultureLabel: 'Hellenowie', epochLabel: 'Brąz', ikonaId: 'grecja', kolorHex: '#2244aa', activeTreaties: ['Pakt', 'Handel'], wiarygodnosc: 12.6, layer: 'full', contactEstablished: true },
      { ownerId: 2, civ: 'Sparta · miasto-państwo', isCityState: true, tier: 0, zaufanie: 3, respekt: 170, layer: 'simplified', allowedActions: ['pokoj', 'wojna'], wiarygodnosc: -40 },
      { ownerId: 3, civ: 'Hunowie <x>', tier: 1, layer: 'pre_contact', contactEstablished: false },
      { civ: 'Bez ownerId', tier: 4, zaufanie: 90, respekt: 55, wiarygodnosc: 0 },
      { ownerId: 5, civ: 'Egipcjanie', tier: 2, zaufanie: 150, respekt: 150, ikonaId: 'egipt' },
    ];
    const CFGS = [
      ['placeholder', {}],
      ['puste', { rels: [] }],
      ['relacje', { rels: RELS, wars: [{ civA: 'Grecy', civB: 'Hunowie <x>' }], aud: true }],
      ['relacje-bez-audiencji', { rels: RELS.slice(0, 3), wars: [] }],
    ];
    for (const [name, c] of CFGS) {
      const cfg = () => {
        const o = {};
        if (c.rels) o.getRelations = () => c.rels;
        if (c.wars) o.getKnownWarsBetweenOthers = () => c.wars;
        if (c.aud) o.onOpenAudience = act('onOpenAudience');
        return o;
      };
      await explore(M, `panel(${name})`, (S) => { S.showDiplomacyPanel(cfg()); actionLog.push('open=' + S.isDiplomacyPanelOpen()); },
        { P, V, stash: true, cleanupP: () => P.hideDiplomacyPanel(), cleanupV: () => V.hideDiplomacyPanel(), keys: ['Escape'],
          after: (S) => { S.updateDiplomacyPanel(); actionLog.push('open-po=' + S.isDiplomacyPanelOpen()); } });
    }
    const P_ = (id, name, isPlayer) => ({ ownerId: id, name, isPlayer });
    const SUM = [
      ['null', null],
      ['pełne', { ownerId: 1, civName: 'Grecy <x>', ikonaId: 'grecja', kolorHex: '#aa2244', tier: 3, wars: [P_(0, 'Ty', true), P_(2, 'Sparta')], alliances: [P_(3, 'Hunowie')], deals: [P_(4, 'Egipt')] }],
      ['puste-listy', { ownerId: 2, civName: 'Rzym', tier: 0, wars: [], alliances: [], deals: [] }],
    ];
    for (const [name, d] of SUM) {
      await explore(M, `para(${name})`, (S) => { S.showDiploPairSummary({ getData: () => d, onOpenAudience: act('onOpenAudience'), onClose: act('onClose') }); actionLog.push('open=' + S.isDiploPairSummaryOpen()); },
        { P, V, stash: true, cleanupP: () => P.hideDiploPairSummary(), cleanupV: () => V.hideDiploPairSummary(), keys: ['Escape'],
          after: (S) => { S.updateDiploPairSummary(); actionLog.push('open-po=' + S.isDiploPairSummaryOpen()); } });
    }
  }

  // ─── 23. diploListHud.ts ──────────────────────────────────────────────────
  if (want('diploListHud.ts')) {
    const M = 'diploListHud.ts';
    const [P, V] = mods(M);
    const DD = pin['game/diplomacy-display.ts'];
    const tierLabelPin = pin['ui/diplomacyPanel.ts'].tierLabel;
    /** „Rust”: DiploCivListLinesDto = formatDiploCivListLines z tymi samymi polami co pin `:481-490`. */
    const lines = (rel) => DD.formatDiploCivListLines({
      cultureLabel: rel.cultureLabel, epochLabel: rel.epochLabel, theirPopulation: rel.population, theirArmyCount: rel.armyCount,
      theirRespektTowardPlayer: rel.theirRespekt, ourRespektTowardThem: rel.respekt, zaufanie: rel.zaufanie, relationTierLabel: tierLabelPin(rel.tier),
    });
    const RELS = [
      { ownerId: 1, civ: 'Grecy', tier: 3, zaufanie: 65.4, respekt: 40.5, theirRespekt: 20.49, population: 12.7, armyCount: 4, cultureLabel: 'Hellenowie', epochLabel: 'Brąz', activeTreaties: ['Pakt', 'Handel'], kolorHex: '#102030' },
      { ownerId: 2, civ: 'Sparta · miasto-państwo', isCityState: true, tier: 0, zaufanie: 3 },
      { ownerId: 3, civ: 'Hunowie <x>', tier: 1, activeTreaties: [] },
      { civ: 'Bez ownerId', tier: 4 },
      { ownerId: 5, civ: 'Egipcjanie', tier: 2.6, population: 0.4, armyCount: 0, theirRespekt: 0, respekt: 0, zaufanie: 0, cultureLabel: '', epochLabel: 'Żelazo', kolorHex: '#ffeeaa' },
      { ownerId: 6, civ: 'Ateny', isCityState: true, tier: 4, epochLabel: 'Kamień', kolorHex: 'zly' },
    ];
    const entriesPin = [];
    const entriesV2 = [];
    for (const rel of RELS) {
      const a = P.diploListEntryFromRelation(rel);
      const b = V.diploListEntryFromRelation({ ...rel, lines: lines(rel) });
      cmpVal(M, `entryFromRelation(${rel.civ})`, a, b);
      if (a) entriesPin.push(a);
      if (b) entriesV2.push(b);
    }
    for (const a of entriesPin) for (const b of entriesPin) cmpVal(M, `compare(${a.name},${b.name})`, P.compareDiploListEntries(a, b), V.compareDiploListEntries(a, b));
    const SUMS = [null, { name: 'Ty <x>', ikonaId: 'rzym', kolorHex: '#334455', cultureLabel: 'Rzymianie', epochLabel: 'Brąz', era: 2, personalityTags: ['Kupiec', 'Wojownik'], detailLine: 'Ludność 10', metaLine: 'meta' },
      { name: 'Gracz', ikonaId: 'nieznana', era: 9, detailLine: '' }];
    for (const [si, sum] of SUMS.entries()) {
      for (const filter of ['all', 'war']) {
        const api = {};
        const run = (S, s) => {
          S.setDiploListFilter(filter);
          api[s] = S.createDiploListHud({ getEntries: () => (s === 'pin' ? entriesPin : entriesV2), getPlayerSummary: si === 0 ? undefined : () => sum,
            onSelectEntry: act('onSelectEntry'), onFocusCapital: si === 2 ? undefined : act('onFocusCapital'), onClose: act('onClose') });
          document.body.appendChild(api[s].el);
          api[s].show();
          actionLog.push('open=' + api[s].isOpen() + ' filtr=' + S.getDiploListFilter());
        };
        await explore(M, `lista#${si}(${filter})`, run, {
          P, V, cleanupP: () => { api.pin?.destroy(); P.setDiploListFilter('all'); }, cleanupV: () => { api.v2?.destroy(); V.setDiploListFilter('all'); }, keys: ['Escape'],
          after: (S, s) => { api[s].update(); actionLog.push('open-po=' + api[s].isOpen() + ' filtr=' + S.getDiploListFilter()); },
        });
      }
    }
    await domCase(M, 'toggle/hide', () => { const a = P.createDiploListHud({ getEntries: () => entriesPin, onSelectEntry: act('s') }); a.toggle(); actionLog.push('t=' + a.isOpen()); a.toggle(); actionLog.push('t=' + a.isOpen()); a.show(); a.hide(); actionLog.push('h=' + a.isOpen()); a.destroy(); },
      () => { const a = V.createDiploListHud({ getEntries: () => entriesV2, onSelectEntry: act('s') }); a.toggle(); actionLog.push('t=' + a.isOpen()); a.toggle(); actionLog.push('t=' + a.isOpen()); a.show(); a.hide(); actionLog.push('h=' + a.isOpen()); a.destroy(); });
    notMeasured(M, 'zamknięcie kliknięciem poza panelem (`bindHudPanelOutsideDismiss`, moduł P5.1) — wspólny `document` obu stron, nie wysyłane');
    notMeasured(M, 'singleton `showDiploListHud`/`toggleDiploListHud`/`refreshDiploListHudIfOpen` — `api` modułu ustawiany wyłącznie wewnętrznie (brak publicznego settera); `createDiploListHud` porównany wprost');
  }

  // ─── 24. techTreeView.ts ──────────────────────────────────────────────────
  if (want('techTreeView.ts')) {
    const M = 'techTreeView.ts';
    const [P, V] = mods(M);
    const SPp = pin['ui/sciencePicker.ts'];
    const DC = pin['game/difficulty-cost.ts'];
    const SLUGS = TECHS.map((t) => SPp.techToSlug(t.Technologia));
    const byEpoch = (e) => TECHS.filter((t) => t.Epoka === e).map((t) => SPp.techToSlug(t.Technologia));
    const kam = byEpoch('Kamień');
    const braz = byEpoch('Brąz');
    /** „Rust”: ResearchViewDto (koszt efektywny po tempie/trudności/epoce, tempo) — te same dane, które pin dostaje hakami. */
    const researchView = (sc, owner) => {
      const tempo = sc.tempo ?? 'standardowa';
      const difficulty = sc.difficulty ?? 'normal';
      return {
        techs: TECHS.map((t) => ({ id: SPp.techToSlug(t.Technologia), baseCost: t['Koszt nauki'], effectiveCost: DC.scaledResearchCost(t['Koszt nauki'], tempo, owner, difficulty, t.Epoka),
          epoka: t.Epoka, state: '', terrainUnlockLabels: [] })),
        queue: [], queueMax: 4, eraGate: null, tempo, difficulty, treeEpoch: null, hubEntries: [],
      };
    };
    const SCEN = [
      { name: 'bez-haków', hooks: false },
      { name: 'start', researched: [], available: kam.slice(0, 3), state: null, rate: 0 },
      { name: 'cel', researched: kam.slice(0, 2), available: kam.slice(2), state: { pula: 12.4, targetId: kam[3], kosztCelu: 80, postepFraction: 0.155, turnsLeft: 4 }, rate: 5.5,
        tempo: 'szybka', difficulty: 'easy', plan: [{ id: kam[3], pos: 1 }, { id: kam[4], pos: 2 }], gates: [false, true] },
      { name: 'brąz', researched: kam, available: braz.slice(0, 4), state: { pula: 3, targetId: braz[1], kosztCelu: 200, postepFraction: 0.02, turnsLeft: 0 }, tempo: 'dluga', difficulty: 'hard', gates: [true, false], details: true },
      { name: 'wszystko', researched: SLUGS, available: [], state: { pula: 0, targetId: null, kosztCelu: 0, postepFraction: 0, turnsLeft: 0 }, tempo: 'standardowa', difficulty: 'normal' },
    ];
    const cfgFor = (sc, s) => {
      if (sc.hooks === false) {
        return s === 'pin' ? { getTempoGry: undefined, getDifficulty: undefined, getResearchState: undefined, getResearchedTechs: undefined, getAvailableTechs: undefined, getNaukaRate: undefined,
          isBuildingGateMet: undefined, isImprovementGateMet: undefined, onStartResearch: undefined, getPlan: undefined, onOpenTechDetails: undefined }
          // v2: brak haków = pin z domyślnym tempem/trudnością; „Rust” zawsze podaje ResearchViewDto (ZAŁOŻENIE P5.5-Z3).
          : { getResearchView: (o) => researchView(sc, o), getResearchState: undefined, getResearchedTechs: undefined, getAvailableTechs: undefined, getNaukaRate: undefined,
            isBuildingGateMet: undefined, isImprovementGateMet: undefined, onStartResearch: undefined, getPlan: undefined, onOpenTechDetails: undefined };
      }
      const c = {
        getResearchState: () => sc.state ?? null, getResearchedTechs: () => sc.researched ?? [], getAvailableTechs: () => sc.available ?? [],
        getNaukaRate: sc.rate === undefined ? undefined : () => sc.rate, onStartResearch: act('onStartResearch'), getPlan: sc.plan ? () => sc.plan : undefined,
        isBuildingGateMet: sc.gates ? () => sc.gates[0] : undefined, isImprovementGateMet: sc.gates ? () => sc.gates[1] : undefined,
        onOpenTechDetails: sc.details ? act('onOpenTechDetails') : undefined,
      };
      if (s === 'pin') Object.assign(c, { getTempoGry: sc.tempo === undefined ? undefined : () => sc.tempo, getDifficulty: sc.difficulty === undefined ? undefined : () => sc.difficulty });
      else Object.assign(c, { getResearchView: (o) => researchView(sc, o), getTempoGry: undefined, getDifficulty: undefined });
      return c;
    };
    const TDN = { pin: pin['ui/techDiscoveryNotice.ts'], v2: v2['ui/techDiscoveryNotice.ts'] };
    const cleanup = (S, s) => () => { S.hideTechTreeView(); TDN[s].hideTechDiscoveryNotice(); };
    const ttvOk = [];
    let cardsShown = 0;
    for (const sc of SCEN) {
      for (const owner of [0, 1]) {
        const run = (S, s) => {
          S.configureTechTreeView(cfgFor(sc, s));
          S.showTechTreeView(owner);
          actionLog.push('open=' + S.isTechTreeViewOpen());
          // karta węzła na najechanie: pierwszy, środkowy, ostatni węzeł i wszystkie w epoce Kamienia (scenariusz „cel”)
          const nodes = [...document.querySelectorAll('.civ-ttv-tn')];
          const pick = sc.name === 'cel' ? nodes : [nodes[0], nodes[Math.floor(nodes.length / 2)], nodes[nodes.length - 1]];
          for (const n of pick) {
            if (!n) continue;
            fire(n, 'mouseover');
            // karta węzła = `.civ-ttv-tt` (pin `showCardFor`, :788-805)
            const tt = document.querySelector('.civ-ttv-tt');
            actionLog.push('karta:' + (tt?.outerHTML ?? 'BRAK'));
            if (s === 'v2' && tt && tt.innerHTML.length > 0) cardsShown++;
            fire(n, 'mouseout', { relatedTarget: document.body });
          }
          S.refreshTechTreeViewIfOpen();
        };
        const res = await domCase(M, `drzewko(${sc.name},${owner})`, () => run(P, 'pin'), () => run(V, 'v2'), { stash: true, cleanupPin: cleanup(P, 'pin'), cleanupV2: cleanup(V, 'v2') });
        ttvOk.push(res.v2.includes('civ-ttv-tn') && res.v2.includes('class="civ-ttv-overlay'));
      }
      const setup = (S, s) => { S.configureTechTreeView(cfgFor(sc, s)); S.showTechTreeView(0); };
      await explore(M, `klik(${sc.name})`, setup, { P, V, stash: true, cleanupP: cleanup(P, 'pin'), cleanupV: cleanup(V, 'v2'), maxClicks: sc.name === 'cel' ? 90 : 25,
        clickSel: 'button, .civ-ttv-tn, .ttv-info-ic, [data-z], [role="button"]', keys: ['Escape'],
        after: (S) => { actionLog.push('open-po=' + S.isTechTreeViewOpen()); actionLog.push('tdn:' + (document.querySelector('#civ-tech-discovery-notice-host')?.innerHTML.length ?? 0)); } });
    }
    // Pokrycie danych: czy etykiety ulepszeń z kodu (katalog „Rust”) różnią się od pola `tech.json` (fallback pinu :168-170).
    const TUP = pin['ui/techUnlockParse.ts'];
    const fromCode = TECHS.filter((t) => techTerrainUnlockLabels[t.Technologia].length > 0);
    const differ = fromCode.filter((t) => JSON.stringify(techTerrainUnlockLabels[t.Technologia]) !== JSON.stringify(TUP.splitList(t['Odblokowuje ulepszenie terenu'], /,/)));
    console.log(`techTreeView: technologii z etykietami ulepszeń z kodu=${fromCode.length}/${TECHS.length}, różnych od pola tech.json=${differ.length} (${differ.map((t) => t.Technologia).join(', ')})`);
    if (differ.length === 0) notMeasured(M, 'etykiety ulepszeń z katalogu (`techTerrainUnlockLabels`) = pole `tech.json` dla wszystkich technologii pinu — podmiana źródła nieobserwowalna na danych pinu');
    assertV2(M, [[`drzewko: karta węzła (.civ-ttv-tt) wypełniona po najechaniu (v2: ${cardsShown}; ≥ ${TECHS.length} — scenariusz „cel” × 2 właścicieli najeżdża każdy węzeł)`, cardsShown >= TECHS.length]]);
    assertV2(M, [[`drzewko: nakładka z węzłami w DOM v2 (${ttvOk.filter(Boolean).length}/${ttvOk.length})`, ttvOk.length === SCEN.length * 2 && ttvOk.every(Boolean)]]);
    assertV2(M, [['v2 nie woła scaledResearchCost (koszt = ResearchViewDto.techs[].effectiveCost)', !readFileSync(join(V2_ROOT, 'src/ui/techTreeView.ts'), 'utf8').includes('scaledResearchCost(')]]);
    notMeasured(M, 'zoom kółkiem i przeciąganie (`wheel`/`pointer*`, pin :877-920) — jsdom bez układu; przyciski zoomu porównane');
    notMeasured(M, 'pozycja karty węzła (`showCardFor`, `offsetWidth`/`innerWidth`) — jsdom bez układu (0×0); porównany tylko jako ten sam wynik');
  }

  // ─── 25. unitInfoCard.ts ──────────────────────────────────────────────────
  if (want('unitInfoCard.ts')) {
    const M = 'unitInfoCard.ts';
    const [P, V] = mods(M);
    const gd = { counters: countersJson };
    cmpVal(M, 'UNIT_INFO_CARD_CSS', P.UNIT_INFO_CARD_CSS, V.UNIT_INFO_CARD_CSS);
    cmpVal(M, 'UNIT_3D_RENDER_HOOK', P.UNIT_3D_RENDER_HOOK, V.UNIT_3D_RENDER_HOOK);
    let cardOk = 0;
    for (const [ui, u] of unitsJson.entries()) {
      const opts = ui % 3 === 0 ? { ownerColor: 0x336699, statusLines: ['Ufortyfikowana', 'Głód <x>'] } : ui % 3 === 1 ? {} : { onClose: 'cb' };
      const run = (S) => {
        const o = { ...opts };
        if (o.onClose) o.onClose = act('onClose');
        const card = S.buildUnitInfoCard(u, gd, o);
        document.body.appendChild(card);
        fire(card.querySelector('.unit-info-card-close'), 'click');
      };
      const res = await domCase(M, `karta(${u.Jednostka})`, () => run(P), () => run(V));
      if (res.v2.includes('entity-card')) cardOk++;
    }
    // Ścieżka zapasowa `_legacyBuildUnitInfoCard` (pin :230-…, jedyne użycie `categoryOf`, :254): osiągana, gdy
    // ścieżka entityCards rzuci wyjątek — wymuszona polem czytanym WYŁĄCZNIE przez adapter (`unitAdapter.ts`
    // „Kara od tyłu”), którego `toString` rzuca; ścieżka zapasowa tego pola nie czyta.
    const boom = { toString() { throw new Error('wymuszony wyjątek ścieżki entityCards'); } };
    const legacyRows = [];
    for (const u of unitsJson) legacyRows.push({ ...u, 'Kara obrony z tyłu (%)': boom });
    let legacyOk = 0;
    for (const u of legacyRows) {
      const res = await domCase(M, `legacy(${u.Jednostka})`, () => { document.body.appendChild(P.buildUnitInfoCard(u, gd, { statusLines: ['S1'], onClose: act('onClose') })); },
        () => { document.body.appendChild(V.buildUnitInfoCard(u, gd, { statusLines: ['S1'], onClose: act('onClose') })); });
      if (res.v2.includes('unit-info-card-header') && !res.v2.includes('entity-card-header')) legacyOk++;
    }
    for (const u of unitsJson.slice(0, 6)) {
      const run = (S) => {
        const d = S.showUnitInfoCardDialog(u, gd, { statusLines: ['X'] });
        actionLog.push(ser(document.body));
        fire(document.querySelector('.unit-info-card-backdrop'), 'click');
        actionLog.push('po-tle=' + document.querySelectorAll('.unit-info-card-backdrop').length);
        const d2 = S.showUnitInfoCardDialog(u, gd, {});
        fire(document.querySelector('.unit-info-card-close'), 'click');
        actionLog.push('po-x=' + document.querySelectorAll('.unit-info-card-backdrop').length);
        S.showUnitInfoCardDialog(u, gd, { onClose: act('onCloseZewn') });
        d();
        d2();
      };
      await domCase(M, `dialog(${u.Jednostka})`, () => run(P), () => run(V), {
        cleanupPin: () => document.querySelectorAll('.unit-info-card-backdrop').forEach((b) => fire(b, 'click')),
        cleanupV2: () => document.querySelectorAll('.unit-info-card-backdrop').forEach((b) => fire(b, 'click')),
      });
    }
    await domCase(M, 'ensureUnitInfoCardStyles', () => { P.ensureUnitInfoCardStyles(); P.ensureUnitInfoCardStyles(); }, () => { V.ensureUnitInfoCardStyles(); V.ensureUnitInfoCardStyles(); });
    assertV2(M, [[`karta: ścieżka entityCards w DOM v2 (${cardOk}/${unitsJson.length})`, cardOk === unitsJson.length]]);
    assertV2(M, [[`legacy: ścieżka zapasowa osiągnięta w v2 (${legacyOk}/${legacyRows.length})`, legacyOk === legacyRows.length]]);
    notMeasured(M, 'miniatura jednostki (`mountUnitMiniPreview`, kolejka rAF): pin renderuje WebGL (three), v2 obraz z Rust/placeholder (D-UI-3) — zrzut przed rAF');
  }

  // ─── 26. wikiHubHud.ts ────────────────────────────────────────────────────
  if (want('wikiHubHud.ts')) {
    const M = 'wikiHubHud.ts';
    const [P, V] = mods(M);
    const ENCY = wikiJson.encyklopedia;
    const ids = [];
    for (const e of ENCY) ids.push([e.folder, e.slug], [e.folder, e.title], ...(e.gameIds ?? []).map((g) => [e.folder, g]));
    ids.push(['jednostki', 'nieistnieje'], ['', ''], ['brak-folderu', 'x']);
    for (const [f, g] of ids) cmpVal(M, `hasWikiEncyEntry(${f},${g})`, P.hasWikiEncyEntry(f, g), V.hasWikiEncyEntry(f, g));
    const api = {};
    const mk = (opts) => (S, s) => {
      api[s] = S.createWikiHubHud({ onClose: act('onClose') });
      document.body.appendChild(api[s].el);
      api[s].show(opts);
      actionLog.push('open=' + api[s].isOpen());
    };
    const cleanup = (s) => () => { api[s]?.destroy(); };
    for (const [name, opts] of [['domyślny', undefined], ['encyklopedia-overlay', { tab: 'encyklopedia', layout: 'overlay' }],
      ['poradnik-rozdział', { tab: 'poradnik', layout: 'dock', openPoradnikId: wikiJson.poradnik[1]?.id }]]) {
      await explore(M, `hub(${name})`, mk(opts), { P, V, cleanupP: cleanup('pin'), cleanupV: cleanup('v2'), maxClicks: 60, keys: ['Escape'],
        after: (S, s) => actionLog.push('open-po=' + api[s].isOpen()) });
    }
    // Otwarcie hasła encyklopedii (most Civpedii z kart encji): próbka co 7. hasło + nieznane.
    for (const e of [...ENCY.filter((_, i) => i % 7 === 0), { folder: 'jednostki', slug: 'nieistnieje' }]) {
      const run = (S, s) => {
        api[s] = S.createWikiHubHud({});
        document.body.appendChild(api[s].el);
        api[s].openEncyEntry(e.folder, e.slug);
        actionLog.push('open=' + api[s].isOpen());
        actionLog.push('res=' + JSON.stringify(S.openWikiHubEncyEntry(e.folder, e.slug)));
      };
      await domCase(M, `hasło(${e.folder}/${e.slug})`, () => run(P, 'pin'), () => run(V, 'v2'), { cleanupPin: cleanup('pin'), cleanupV2: cleanup('v2') });
    }
    await domCase(M, 'toggle', () => { const a = P.createWikiHubHud({}); a.toggle(); actionLog.push('t=' + a.isOpen()); a.toggle(); actionLog.push('t=' + a.isOpen()); a.destroy(); },
      () => { const a = V.createWikiHubHud({}); a.toggle(); actionLog.push('t=' + a.isOpen()); a.toggle(); actionLog.push('t=' + a.isOpen()); a.destroy(); });
    notMeasured(M, 'zamknięcie kliknięciem poza panelem (`bindHudPanelOutsideDismiss`, moduł P5.1) — wspólny `document` obu stron, nie wysyłane');
  }

  // ─── raport ────────────────────────────────────────────────────────────────
  const rows = L2.filter(want).map((m) => R(m));
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
  console.log(`dom-harness-level2: pin=edb8fb56 modułów=${rows.length} przypadków=${totalCases} różnic=${totalDiffs} jsdomErrors=${jsdomErrors.length} consoleErrors=${consoleErrors.length}`);
  if (jsdomErrors.length) console.log('jsdomErrors (unikalne): ' + [...new Set(jsdomErrors)].slice(0, 12).join(' | '));
  if (consoleErrors.length) console.log('consoleErrors (unikalne): ' + [...new Set(consoleErrors)].slice(0, 5).join(' | '));
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ pin: 'edb8fb56', totalCases, totalDiffs, modules: rows }, null, 2) + '\n');
  exitCode = totalDiffs === 0 ? 0 : 1;
} catch (err) {
  console.error = origError;
  console.error('dom-harness-level2: BŁĄD', err?.stack ?? err);
  exitCode = 2;
} finally {
  console.warn = origWarn;
  console.error = origError;
  console.log = origLog;
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
