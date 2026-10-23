#!/usr/bin/env node
/**
 * run-hud-empire.mjs — harness porównania DOM/wyników: 4 moduły P5.7 runda 1 (`R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1`;
 * `PORTING-QUEUE.md` wiersze 78, 79, 80 — cykl C3: `empireDetailPanel.ts`, `empireDetailTypes.ts`, `hud.ts`;
 * 32 — `sceneTimingReport.ts`) w frontend-v2 vs ten sam moduł z pinu web `edb8fb56`.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
 *   node tools/dom-harness/run-hud-empire.mjs --pin-dir <PIN_DIR> [--json <plik>] [--only a.ts,b.ts] [--stop-on-diff]
 * EXIT 0 ⇔ 0 różnic (i wszystkie asercje v2 spełnione); 1 ⇔ ≥1 różnica; 2 ⇔ błąd harnessu.
 *
 * Metoda = `run-cycles.mjs` (P5.6): oba drzewa pakowane `esbuild` z tą samą emulacją Vite (`build.mjs`), wspólny jsdom,
 * zamrożony `Date`, kanoniczna serializacja `document.documentElement` albo JSON/HTML wartości, log akcji (callbacki)
 * dopisany do DOM, eksploracja generyczna (każdy element klikalny / pole / klawisz = osobny przypadek).
 *
 * Strona v2 dostaje DTO zbudowane w harnessie z DANYCH i FUNKCJI PINU (harness gra rolę „Rust”):
 *   - `StaticCatalogDto` = `gra/data/*.json` + stałe `game/cities.ts`, `game/population-growth-v85.ts`,
 *     `game/citizen-resource-upkeep.ts`, `game/building-stock-cost.ts` (`STOCK_RESOURCE_LABEL`), `game/danina-nazwa.ts`,
 *     `map/mapGenProgress.ts` (`MAP_GEN_PHASE_LABELS`), etykieta Mocy `ui/power-labels.ts` (`mocLabel()`), stałe dyplomacji
 *     czytane przy ewaluacji modułów zależnych `hud.ts` (jak `run-cycles.mjs`);
 *   - `EmpireQueriesProvider` = `adjustHandelSplit`, `normalizePodzialHandlu`, `procentPuliImperiumZBudynkow`,
 *     `podzialPracyZProcentuPuli` z `game/cities.ts` pinu;
 *   - nowe pola snapshotu imperium: `resources[].usage.total` = `resourceUsageTotal` (pin), `miastaSummary` =
 *     `computeMiastaSummaryRow` (pin `ui/empireMiastaTable.ts`) na wierszach zbudowanych jak `empireDetailPanel.ts:1783-1836`
 *     pinu (transkrypcja; poprawność weryfikuje samo porównanie), `power.zuzycieObywateliPerTyp` /
 *     `cityPobor[].zuzycieObywateliPerTurn` = `floor(ludki × CITIZEN_UPKEEP_RATE_PER_CITIZEN)` (pin `:2389,2576`),
 *     `food.perCityRows[].wzrostProcentEff` = `nakarmione === false ? 0 : wzrostProcent` (pin `:3111`),
 *     `trade.tradeBaseIncome` = transkrypcja pinu `:3574-3581`;
 *   - `UnitCardBadgesDto` (rozkaz `armyStack` w `hud.ts`) = `softPathBadgeLevel`/`armorPathBadgeLevel`/`veteranStarCount`;
 *   - `PerfDiagnosticsDto` = `CIV_BUILD_STAMP` + `getRiverGenEnabled`/`getRiverGenPhase` pinu (jak `run.mjs`, P5.2).
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

const MODS = ['sceneTimingReport.ts', 'empireDetailPanel.ts', 'empireDetailTypes.ts', 'hud.ts'];
/** Moduły pinu używane przez harness jako „Rust”. */
const PIN_REF = [
  'units/setup.ts', 'game/unit-building-bonuses.ts', 'game/veteran.ts', 'game/cities.ts', 'game/population-growth-v85.ts',
  'game/citizen-resource-upkeep.ts', 'game/building-stock-cost.ts', 'game/resource-usage-breakdown.ts', 'game/danina-nazwa.ts',
  'ui/empireMiastaTable.ts', 'ui/power-labels.ts', 'map/mapGenProgress.ts', 'map/riverGenSwitch.ts', 'buildInfo.ts',
  'game/diplomacy-display.ts', 'game/diplomacy-proposals.ts', 'game/diplomacy-audience-actions.ts',
  'game/diplomacy-value-catalog.ts', 'game/diplomacy-barbarian-cooperation.ts', 'game/playerState.ts', 'game/tech-tempo.ts',
];
const V2_CTRL = ['controller/staticCatalog.ts', 'controller/empireQueries.ts', 'controller/diagnostics.ts'];
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

const tmp = mkdtempSync(join(tmpdir(), 'p57-harness-'));
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
  const { categoryOf } = pin['units/setup.ts'];
  const CITIES = pin['game/cities.ts'];
  const PG = pin['game/population-growth-v85.ts'];
  const CU = pin['game/citizen-resource-upkeep.ts'];
  const BSC = pin['game/building-stock-cost.ts'];
  const RUB = pin['game/resource-usage-breakdown.ts'];
  const EMT = pin['ui/empireMiastaTable.ts'];
  const VC = pin['game/diplomacy-value-catalog.ts'];
  const DD = pin['game/diplomacy-display.ts'];
  const PR = pin['game/diplomacy-proposals.ts'];
  const AA = pin['game/diplomacy-audience-actions.ts'];
  const RG = pin['map/riverGenSwitch.ts'];

  // „Rust”: StaticCatalogDto z danych i funkcji pinu.
  const unitCategory = {};
  const unitCategoryNameOnly = {};
  for (const u of unitsJson) {
    unitCategory[u.Jednostka] = categoryOf(u.Jednostka ?? '', u['Rola (linia)'] ?? '', u['Super-jednostka'] === 'TAK', u['Typ']);
    unitCategoryNameOnly[u.Jednostka] = categoryOf(u.Jednostka ?? '', '', false, undefined);
  }
  const multiOwn = [];
  for (let i = 0; i <= 30; i++) if (AA.uiActionAllowsMultipleOwnOnTable(String(i))) multiOwn.push(String(i));
  const ddSrc = readFileSync(join(PIN_SRC, 'game/diplomacy-display.ts'), 'utf8');
  const rkl = ddSrc.slice(ddSrc.indexOf('const RESOURCE_KEY_LABEL'), ddSrc.indexOf('};', ddSrc.indexOf('const RESOURCE_KEY_LABEL')));
  const resourceKeyLabels = {};
  for (const m of rkl.matchAll(/^\s*([a-z_]+):\s*'([^']*)',/gm)) resourceKeyLabels[m[1]] = m[2];
  const catalog = {
    contentHash: 'harness-pin-edb8fb56',
    buildings: json('buildings.json'), units: unitsJson, tech: json('tech.json'), terrainImprovements: json('terrain-improvements.json'),
    wonders: json('wonders.json'), counters: json('counters.json'), civs: json('civs.json'), cityNamesPools: {}, powerParams: {},
    uiParams: json('ui-params.json'), wiki: { poradnik: [], encyklopedia: [] },
    constants: {
      handelPctStep: CITIES.HANDEL_PCT_STEP,
      maxProcentNauka: CITIES.MAX_PROCENT_NAUKA,
      maxProcentPuliImperium: CITIES.MAX_PROCENT_PULI_IMPERIUM,
      maxUlepszeniaPracaAutoPercent: CITIES.MAX_ULEPSZENIA_PRACA_AUTO_PERCENT,
      wyzywienieMin: PG.WYZYWIENIE_MIN,
      wyzywienieMax: PG.WYZYWIENIE_MAX,
      wyzywienieStep: PG.WYZYWIENIE_STEP,
      citizenUpkeepRatePerCitizen: CU.CITIZEN_UPKEEP_RATE_PER_CITIZEN,
      researchQueueMax: pin['game/playerState.ts'].RESEARCH_QUEUE_MAX,
      tempoGry: { ...pin['game/tech-tempo.ts'].TEMPO_GRY },
      mapGenPhaseLabels: { ...pin['map/mapGenProgress.ts'].MAP_GEN_PHASE_LABELS },
      fogExploredBrightness: 0.55,
      barbarianCooperationDefaultDurationTurns: pin['game/diplomacy-barbarian-cooperation.ts'].BARBARIAN_COOPERATION_DEFAULT_DURATION_TURNS,
      zywnoscNaPn: VC.diplomacyZywnoscNaPn(),
      progDarRelacja: VC.diplomacyProgDarRelacja(),
      handelZaufaniePerTura: VC.diplomacyHandelZaufaniePerTura(),
      handelSurowceKeys: Object.keys(VC.diplomacyHandelSurowceCatalog()),
      audienceMultiOwnActionIds: multiOwn,
    },
    labels: {
      podzialPracyPulaLbl: CITIES.PODZIAL_PRACY_PULA_LBL,
      podzialPracyPulaPelna: CITIES.PODZIAL_PRACY_PULA_LBL_PELNA,
      podzialPracyPulaTip: CITIES.PODZIAL_PRACY_PULA_TIP,
      powerHudLabelPl: pin['ui/power-labels.ts'].mocLabel(),
      traktatHandlowyLabel: DD.TRAKTAT_HANDLOWY_LABEL,
      resourceAccessTradeWithdrawnReason: PR.RESOURCE_ACCESS_TRADE_WITHDRAWN_REASON,
      resourceKeyLabels,
      stockResourceLabels: { ...BSC.STOCK_RESOURCE_LABEL },
      daninaGenitive: pin['game/danina-nazwa.ts'].daninaLabelGenitive(),
    },
    unitCategory, unitCategoryNameOnly, techTerrainUnlockLabels: {},
  };
  const v2 = {};
  for (const m of V2_CTRL) v2[m] = await imp(v2Out, m);
  v2['controller/staticCatalog.ts'].installStaticCatalog(catalog);
  v2['controller/empireQueries.ts'].installEmpireQueries({
    adjustHandelSplit: (cur, changed, val) => CITIES.adjustHandelSplit(cur, changed, val),
    normalizePodzialHandlu: (split) => CITIES.normalizePodzialHandlu(split),
    procentPuliImperiumZBudynkow: (b) => CITIES.procentPuliImperiumZBudynkow(b),
    podzialPracyZProcentuPuli: (p) => CITIES.podzialPracyZProcentuPuli(p),
  });
  const installDiag = () => v2['controller/diagnostics.ts'].installPerfDiagnostics({
    buildStamp: pin['buildInfo.ts'].CIV_BUILD_STAMP, riverGenEnabled: RG.getRiverGenEnabled(), riverGenPhase: RG.getRiverGenPhase(),
  });
  installDiag();
  for (const m of [...MODS, ...V2_EXTRA]) v2['ui/' + m] = await imp(v2Out, 'ui/' + m);

  const UB = pin['game/unit-building-bonuses.ts'];
  const VT = pin['game/veteran.ts'];
  const badges = (inp) => ({
    softPath: UB.softPathBadgeLevel({ parametryBonusProc: inp.parametryPathPp ?? 0 }),
    armorPath: UB.armorPathBadgeLevel({ pancerzBonusProc: inp.pancerzPathPp ?? 0 }),
    veteranStars: VT.veteranStarCount(inp.veteranProgress ?? null),
  });

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

  const CLICK_SEL = 'button, [data-act], [data-section], [data-moc-view], [data-miasto-scope], [role="button"], [tabindex], input[type="checkbox"], input[type="radio"], summary, a[href], .civ-emp-backdrop';
  const INPUT_SEL = 'input[type="range"], input[type="number"], input[type="text"], input:not([type]), select, textarea';
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

  // ─── fikstury snapshotu imperium (kształt pinu `empireDetailTypes.ts`) ─────
  const hudStateBase = () => ({
    zloto: 120, zlotoRate: 7, praca: 40.4, pracaRate: 5, pracaUpkeep: 2, pracaAutoUlepszeniaKoszt: 3, pracaCudaKoszt: 1,
    zywnoscLabel: '55', zywnoscMax: 200, zywnoscRate: 3, zywnoscWplywMiast: 9, zywnoscKosztWojska: 4, glodWojska: false,
    zywnoscMiastNiedokarmionych: 0, zywnoscKarencjaZaTur: 2, nauka: 33.7, naukaRate: 4, kultura: 12.4, kulturaRate: 2,
    bogactwo: 120.4, bogactwoRate: 3, bogactwoWplywyBrutto: 40, bogactwoHandel: 8, bogactwoUtrzymanieBudynkow: 12,
    bogactwoUtrzymanieSurowcowBudynkow: { drewno: 2, kamien: 1 }, bogactwoUtrzymanieJednostek: 6, ludnosc: 14, ludnoscRate: 1.4,
    power: 3020, rekruci: 1200, rekruciLabel: '1,2 tys.', rekrutEkw: 3, kosztJednostki: 400, ludnoscAbsLabel: '14 tys.',
    osiedla: 3, osiedlaMax: 5, tura: 42, epoka: 'Brąz', epokaPostep: 0.4, eraGateSummary: 'Brama: 2/3', researchProgress: 0.3,
    badana: 'Pismo <x>', sojusze: 1, pakty: 2, wojny: 1, wplyw: 5, nacja: 'Rzymianie', religionStock: 5.6, religionRate: 1,
    stateReligion: 'Jowisz', civKolorHex: '#aa3322', playerEra: 2, playerWodz: 'Cezar', surowceSummary: 'Drewno 5 · Kamień 2',
    surowceAlert: true, handelIncome: 9, handelRouteCount: 2, uchwalaSolAktywna: true, uchwalaSolSpichlerzIICount: 2,
    armyUnitsOnMap: 4, rekruciRegenPerTurn: 30,
  });
  const recOpt = (id, name, gold, mp, stock, water) => ({ id, name, goldCost: gold, manpowerCost: mp, stockCost: stock, requiresWater: water });
  const CITIES_FX = [
    { cityId: 'c1', name: 'Roma <x>', ludki: 7, abs: 7100, rek: 600, rekMax: 900, regen: 15, zdr: 2, prawo: 1, prawoPct: 34, racje: 3.5, racjaG: 1.5,
      econ: { pieniadz: 14, pieniadzBrutto: 20, handelZeSzlakow: 6, utrzymanieBudynkow: 4, utrzymanieSurowcowBudynkow: { drewno: 1, kamien: 1 }, pracaPula: 3, pracaBudynki: 9, nauka: 6 },
      food: { produkcja: 18.4, kosztRacji: 11, bilans: 7.4, wzrostProcent: 2.6, nakarmione: true },
      opts: [recOpt('Wojownik', 'Wojownik', 20, 100, {}, false), recOpt('Trirema', 'Trirema <x>', 60, 200, { drewno: 3 }, true)], water: true },
    { cityId: 'c2', name: 'Ostia', ludki: 4, abs: 3900, rek: 400, rekMax: 600, regen: 9, zdr: 0, prawo: 0, prawoPct: null, racje: 2, racjaG: -0.5,
      econ: { pieniadz: -2, pieniadzBrutto: undefined, handelZeSzlakow: 0, utrzymanieBudynkow: 3, pracaPula: 1, pracaBudynki: 4, nauka: 2 },
      food: { produkcja: 5, kosztRacji: 8, bilans: -3, wzrostProcent: 1.2, nakarmione: false },
      opts: [recOpt('Trirema', 'Trirema <x>', 60, 200, { drewno: 3 }, true)], water: false },
    { cityId: 'c3', name: 'Ostia', ludki: 3, abs: 2400, rek: 200, rekMax: 500, regen: 6, zdr: 1, prawo: 2, prawoPct: 12, racje: 6, racjaG: 3,
      econ: { pieniadz: 5, pieniadzBrutto: 7, handelZeSzlakow: 2, utrzymanieBudynkow: 5, utrzymanieSurowcowBudynkow: { sol: 2 }, pracaPula: 2, pracaBudynki: 6, nauka: 3 },
      food: { produkcja: 9, kosztRacji: 9, bilans: 0, wzrostProcent: 4.5 },
      opts: [], water: true },
  ];
  function snapFor(variant) {
    const e = hudStateBase();
    const cities = variant === 'pusty' ? [] : CITIES_FX;
    if (variant === 'glod') {
      Object.assign(e, { bogactwoRate: -9, glodWojska: true, zywnoscMiastNiedokarmionych: 2, zywnoscRate: -4, uchwalaSolAktywna: false, ludnoscRate: -0.6, kulturaRate: 0 });
    }
    if (variant === 'pusty') Object.assign(e, { osiedla: 0, ludnosc: 0, bogactwoWplywyBrutto: 0, bogactwoHandel: 0, bogactwoUtrzymanieSurowcowBudynkow: undefined });
    const cityEcon = cities.map((c, i) => ({
      name: c.name, ...c.econ,
      buildingGroups: i === 1 ? [] : [{ grupa: 'Rolnictwo', count: 2 + i }, { grupa: 'Wojsko <x>', count: 1 }],
      queue: i === 2 ? [] : [{ nazwa: 'Koszary', koszt: 40, postep: 12 + i }, { nazwa: 'Mur', koszt: 80 }],
      queueWstrzymana: i === 1,
      defense: { structBonusPct: 10 * i, hasWalls: i !== 1, garnizonCount: i },
    }));
    const cityPobor = cities.map((c) => ({
      cityId: c.cityId, name: c.name, ludki: c.ludki, ludnoscAbsLabel: `${(c.abs / 1000).toFixed(1).replace('.', ',')} tys.`, ludnoscAbsolutna: c.abs,
      rekruci: c.rek, rekruciMax: c.rekMax, regenPerTurn: c.regen, zdrowieBuildingCount: c.zdr, prawoAdminBuildingCount: c.prawo,
      prawoPct: c.prawoPct, poziomRacji: c.racje, racjaGrowthPct: c.racjaG,
      massRecruitment: { options: c.opts, queueCount: c.opts.length, waterAccess: c.water },
    }));
    const routes = cities.length === 0 ? [] : [
      { id: 'r1', cityId: 'c1', cityName: 'Roma <x>', partnerCityName: 'Kartago', partnerOwnerLabel: 'Kartagina', medium: 'morze', dystans: 9, income: 11, budynekOdblokowany: true, premiaBudynku: 2 },
      { id: 'r2', cityId: 'c1', cityName: 'Roma <x>', partnerCityName: 'Memfis', partnerOwnerLabel: 'Egipt', medium: 'lad', dystans: 4, income: 6, budynekOdblokowany: false, premiaBudynku: 0 },
      { id: 'r3', cityId: 'c3', cityName: 'Ostia', partnerCityName: 'Ateny', partnerOwnerLabel: 'Grecja <x>', medium: 'lad', dystans: 6, income: 7, budynekOdblokowany: true, premiaBudynku: 1 },
    ];
    const resources = cities.length === 0 ? [] : [
      { id: 'drewno', icon: '🪵', label: 'Drewno', stock: 40, ratePerTurn: 3, rateProductionPerTurn: 5, rateDiploOutPerTurn: 2, typ: 'surowy', dostep: true, cap: variant === 'glod' ? 1100 : 1200, capBase: 1000, capBonusPerMagazyn: 100,
        citizenRequired: true, citizenCovered: true, usage: { buildings: 2, citizens: 14, units: 1 } },
      { id: 'kamien', icon: '🪨', label: 'Kamień', stock: 0, ratePerTurn: -2, typ: 'surowy', dostep: true, cap: variant === 'glod' ? 1100 : 1200, capBase: 1000, capBonusPerMagazyn: 100,
        citizenRequired: true, citizenCovered: false, usage: { buildings: 1, citizens: 0, units: 0 } },
      { id: 'ceramika', icon: '🏺', label: 'Ceramika', stock: 1200, ratePerTurn: 0, rateProductionPerTurn: 4, rateDiploInPerTurn: 1, typ: 'przetworzony', dostep: true, zrodlo: 'Warsztat', cap: 1200,
        usage: { buildings: 0, citizens: 0, units: 0 } },
      { id: 'kon', icon: '🐎', label: 'Koń', stock: 3, ratePerTurn: 1, typ: 'hodowla', dostep: false, assigned: 'Roma', cap: 1200 },
      { id: 'zywnosc', icon: '🌾', label: 'Żywność', stock: 55, ratePerTurn: 3, typ: 'podstawowy', dostep: true },
      { id: 'ruda_cyny', icon: '⛏', label: 'Ruda cyny', stock: 0, ratePerTurn: 0, typ: 'surowy', dostep: false, placeholder: true },
    ];
    const snap = {
      global: {
        civName: 'Rzym <x>', civEmoji: '🏛', civPortraitUrl: variant === 'glod' ? 'data:image/png;base64,AAAA' : null,
        styl: variant === 'pusty' ? '' : 'Militarny', jednostkaSpec: variant === 'pusty' ? '' : 'Legion', bonusStartowy: '+1 Praca <b>', religiaPanstwowa: 'Jowisz',
        bonusy: [{ opis: 'Bonus A <b>', realizuje: 'silnik' }, { opis: 'Bonus B', realizuje: 'UI' }],
        uchwaly: variant === 'glod' ? [{ id: 'u1', nazwa: 'Uchwała <x>', opis: 'Opis', zrodlo: 'Źródło', aktywna: true }, { id: 'u2', nazwa: 'Off', opis: 'x', zrodlo: 'y', aktywna: false }] : undefined,
      },
      economy: e,
      kultura: cities.length === 0
        ? { total: 0, rate: 0, thresholds: [], nextThreshold: null, pctToNext: null, happinessNote: 'Brak <x>', cities: [] }
        : { total: 50, rate: variant === 'glod' ? -2 : 3, thresholds: [10, 30, 60, 100], nextThreshold: 60, pctToNext: 70, happinessNote: 'Nota <x>',
          cities: [{ name: 'Roma <x>', kultura: 42, borderRadius: 2 }, { name: 'Ostia', kultura: 8, borderRadius: 1 }] },
      power: {
        power: 3020, powerBase: 2800.6,
        components: [
          { key: 'ludnosc', label: 'Ludność', rawCount: 14, weightPct: 30, normalized: 0.5, points: 900, sharePct: 30, formulaNote: 'x <b>' },
          { key: 'armia', label: 'Armia', rawCount: 4, weightPct: 40, normalized: 0.25, points: 1200, sharePct: 40 },
        ],
        ranking: [
          { civ: 'Rzym', power: 3020, powerMilitary: 1500, powerEconomic: 1520, rank: 1, isPlayer: true, wiarygodnosc: 12 },
          { civ: 'Kartagina <x>', power: 2500, powerMilitary: 1900, powerEconomic: 600, rank: 2, wiarygodnosc: -30 },
          { civ: 'Egipt', power: 2100, powerMilitary: 500, powerEconomic: 1600, rank: 3 },
        ],
        respektExample: variant === 'pusty' ? undefined : { civ: 'Kartagina', respekt: 10, playerPower: 3020, theirPower: 2500 },
        absoluteRank: { rank: 1, total: 3 },
        ludnoscLudki: 14, ludnoscAbsLabel: '14 tys.', rekruci: 1200, rekruciLabel: '1,2 tys.', rekrutEkw: 3, rekruciMax: 2000,
        rekruciMaxLabel: '2 tys.', unitsOnMap: 4, kosztJednostki: variant === 'glod' ? 0 : 400,
      },
      cityEcon, cityPobor,
      massRecruitment: { ownerId: variant === 'glod' ? 1 : 0, treasury: 500, manpower: 1200, stock: { drewno: 10, kamien: 0, ceramika: 3 }, queuedCount: 1, completedCount: 2 },
      resources,
      trade: {
        totalIncome: 24, routes,
        activeDeals: cities.length === 0 ? [] : [
          { partnerLabel: 'Kartagina', partnerOwnerId: 2, turnsLeft: 5, trustPerTurn: 1, hasActiveRoute: true },
          { partnerLabel: 'Egipt <x>', partnerOwnerId: 3, turnsLeft: null, trustPerTurn: 0, hasActiveRoute: false, blockReason: 'Wojna' },
        ],
        daninaLabel: 'Podatek', wonderBonusLadPct: 10, wonderBonusMorzePct: variant === 'glod' ? 15 : 0,
        resourceGrants: cities.length === 0 ? [] : [{ resourceKey: 'sol', label: 'Sól', partnerLabel: 'Kartagina' }],
      },
      food: {
        zapasy: 55, maxCap: 200, glodWojska: variant === 'glod',
        tick: variant === 'pusty' ? undefined : { uprawaHodowla: 30, wyzwienieLudnosci: 20, nadwyzka: 10, pomocMiastom: 3, spichlerzStolicy: 2, wojsko: 4, przyrostZapasow: 3 },
        perCityRows: cities.map((c) => ({ cityId: c.cityId, name: c.name, ...c.food })),
      },
      research: variant === 'pusty' ? null : { targetLabel: 'Pismo <x>', kosztCelu: 120, pula: 33, postepFraction: 0.27, turnsLeft: variant === 'glod' ? null : 6 },
      religion: {
        stateReligionLabel: 'Jowisz', totalAdherents: variant === 'pusty' ? 0 : 12345, ownSharePct: 70, foreignSharePct: 30, foreignLabel: variant === 'pusty' ? null : 'Ozyrys',
        faithRatePerTurn: 2, zadowolenieBonus: 1, templeCount: 2,
        cities: cities.length === 0 ? [] : [{ name: 'Roma <x>', religionLabel: 'Jowisz', isOwn: true, adherents: 9000 }, { name: 'Ostia', religionLabel: 'Ozyrys', isOwn: false, adherents: 3345 }],
      },
      happiness: cities.length === 0 ? { sources: [], totalNetto: 0, hasData: false }
        : { sources: [{ id: 'bud', label: 'Budynki', value: 3.5 }, { id: 'glod', label: 'Głód <x>', value: -2 }], totalNetto: 1.5, hasData: true },
      armiaProdukcja: cities.length === 0 ? [] : [
        { cityId: 'c1', name: 'Roma <x>', unitName: 'Wojownik', etaTurns: 2, wstrzymana: false },
        { cityId: 'c2', name: 'Ostia', unitName: 'Trirema', etaTurns: null, wstrzymana: true },
      ],
    };
    return snap;
  }
  /** „Rust”: snapshot v2 = snapshot pinu + pola reguł liczone funkcjami/transkrypcją pinu. */
  function toV2Snap(s) {
    const rate = CU.CITIZEN_UPKEEP_RATE_PER_CITIZEN;
    const foodById = new Map(s.food.perCityRows.map((r) => [r.cityId, r]));
    // Transkrypcja pinu `empireDetailPanel.ts:1783-1836` (wiersze tabeli Miasta → wejście `computeMiastaSummaryRow`).
    const rows = s.cityPobor.map((pob, i) => {
      const econ = s.cityEcon[i];
      const fd = foodById.get(pob.cityId);
      return {
        obyw: pob.ludki,
        ludnoscAbsolutna: pob.ludnoscAbsolutna,
        wzrostProcent: fd != null ? (fd.nakarmione === false ? 0 : fd.wzrostProcent) : null,
        praca: (econ?.pracaPula ?? 0) + (econ?.pracaBudynki ?? 0),
        pieniadz: econ?.pieniadz ?? 0,
        zywnosc: fd != null ? fd.bilans : 0,
        surowce: econ?.utrzymanieSurowcowBudynkow,
      };
    });
    const t = s.trade;
    return {
      ...s,
      power: { ...s.power, zuzycieObywateliPerTyp: Math.floor(s.cityPobor.reduce((a, c) => a + c.ludki, 0) * rate) },
      cityPobor: s.cityPobor.map((c) => ({ ...c, zuzycieObywateliPerTurn: Math.floor(c.ludki * rate) })),
      food: { ...s.food, perCityRows: s.food.perCityRows.map((r) => ({ ...r, wzrostProcentEff: r.nakarmione === false ? 0 : r.wzrostProcent })) },
      resources: s.resources.map((r) => {
        const out = r.usage ? { ...r, usage: { ...r.usage, total: RUB.resourceUsageTotal(r.usage) } } : { ...r };
        // r2: transkrypcja pinu `empireDetailPanel.ts:3434-3436` (liczba Magazynów z capu) → `magazynyCount`.
        if (r.cap != null) {
          out.magazynyCount = (r.capBase != null && r.capBonusPerMagazyn != null && r.capBonusPerMagazyn > 0 && r.cap > r.capBase)
            ? Math.round((r.cap - r.capBase) / r.capBonusPerMagazyn) : 0;
        }
        return out;
      }),
      trade: {
        ...t,
        // Transkrypcja pinu `empireDetailPanel.ts:3574-3581`.
        tradeBaseIncome: t.routes.reduce((sum, r) => {
          const bonusPct = r.medium === 'morze' ? t.wonderBonusMorzePct : t.wonderBonusLadPct;
          return sum + (bonusPct > 0 ? Math.round(r.income / (1 + bonusPct / 100)) : r.income);
        }, 0),
      },
      miastaSummary: EMT.computeMiastaSummaryRow(rows),
    };
  }
  const VARIANTS = ['pelny', 'glod', 'pusty'];

  // ─── 1. sceneTimingReport.ts ──────────────────────────────────────────────
  if (want('sceneTimingReport.ts')) {
    const M = 'sceneTimingReport.ts';
    const [P, V] = mods(M);
    const gen = { prep: 1, terrain: 2, landSea: 3, relief: 4, coast: 5, riversMain: 6, riversFill: 7, forest: 8, deposits: 9, starts: 10, total: 55 };
    const scene = { hexes: 11, coast: 12, overlays: 13, rivers: 14, tail: 15, total: 65, hexCount: 4000, overlayTotal: 321, riverStage: 2,
      detail: { heksy: { alokacja: 1, pryzmy: 2, instancjeReliefu: 3, styledWPetli: 4, brzegWPetli: 5, pustynia: 6, finalizacja: 7 },
        nakladki: { scalMerge: 8, instancjePlazaWydmy: 9, scalMergeCollapsed: 2, scalMergeSkippedMerged: 1, scalMergeSkippedLight: 0 } } };
    const optsList = [
      {},
      { hideAfterMs: 60000 },
      { hideAfterMs: 60000, sourcePath: 'ścieżka <x>' },
      { hideAfterMs: 60000, rozmiarLabel: 'Duża', ksztaltLabel: 'Kontynenty', typLabel: 'Kontynenty <x>', mapGen: gen, scene },
      { hideAfterMs: 60000, typLabel: 'Pangea', mapGen: gen, scene: { ...scene, detail: undefined }, error: 'boom <b>', mapGenHandoffMs: 40, postSceneMs: 300, wallClockMs: 900,
        postSceneSteps: [{ label: 'krok A', ms: 10 }, { label: 'krok <B>', ms: 20 }] },
      { hideAfterMs: 60000, scene: { ...scene, detail: { ...scene.detail, nakladki: { scalMerge: 1, instancjePlazaWydmy: 2 } } }, wallClockMs: 30 },
      { mapGen: gen, scene },
    ];
    for (const en of [true, false]) {
      RG.setRiverGenEnabledOverride(en);
      installDiag();
      // Sprzątanie: odczekanie timerów modułu (ponowny montaż 0/500 ms, usunięcie linku pobierania 200 ms), żeby nie
      // przeciekły do następnego przypadku (identycznie po obu stronach).
      const flush = async () => { await sleep(560); document.getElementById('civ-perf-report')?.remove(); };
      for (const [i, o] of optsList.entries()) {
        await explore(M, `show#${i}(rzeki=${en})`, (S) => { S.showSceneTimingReport(o); }, { P, V, maxClicks: 3, cleanupP: flush, cleanupV: flush });
      }
    }
    RG.setRiverGenEnabledOverride(null);
    installDiag();
    // Ponowne zamontowanie (retry `setTimeout` 0/500 ms) — panel usunięty z zewnątrz → odtworzony.
    const remount = async (S) => {
      S.showSceneTimingReport(optsList[3]);
      document.getElementById('civ-perf-report')?.remove();
      await sleep(5);
      actionLog.push('po0=' + !!document.getElementById('civ-perf-report'));
    };
    const flush2 = async () => { await sleep(560); document.getElementById('civ-perf-report')?.remove(); };
    await domCase(M, 'retry-po-usunięciu', () => remount(P), () => remount(V), { cleanupPin: flush2, cleanupV2: flush2 });
    // r2 (zarzut 5 Evaluatora r1): niepełny katalog etykiet faz — te same klucze usunięte po obu stronach (pin: obiekt
    // `MAP_GEN_PHASE_LABELS` współdzielony przez chunk esbuild; v2: `catalog.constants.mapGenPhaseLabels`, czytany przez
    // `staticCatalog()` przy użyciu). Pin daje `undefined` dla brakującej fazy — v2 musi dać to samo (bez wartości zastępczej).
    const pinLabels = pin['map/mapGenProgress.ts'].MAP_GEN_PHASE_LABELS;
    const v2Labels = catalog.constants.mapGenPhaseLabels;
    for (const missing of [['relief'], ['prep', 'starts', 'deposits'], Object.keys(v2Labels)]) {
      const savedPin = { ...pinLabels };
      const savedV2 = { ...v2Labels };
      for (const k of missing) { delete pinLabels[k]; delete v2Labels[k]; }
      try {
        await explore(M, `katalog-niepełny(${missing.length === 10 ? 'pusty' : missing.join('+')})`, (S) => { S.showSceneTimingReport(optsList[3]); },
          { P, V, maxClicks: 1, cleanupP: flush2, cleanupV: flush2 });
      } finally {
        // Przywrócenie z zachowaniem kolejności kluczy (perfReport iteruje `Object.entries`).
        for (const k of Object.keys(pinLabels)) delete pinLabels[k];
        for (const k of Object.keys(v2Labels)) delete v2Labels[k];
        Object.assign(pinLabels, savedPin);
        Object.assign(v2Labels, savedV2);
      }
    }
  }

  // ─── 2–3. empireDetailPanel.ts / empireDetailTypes.ts ─────────────────────
  if (want('empireDetailPanel.ts')) {
    const M = 'empireDetailPanel.ts';
    const [P, V] = mods(M);
    const SECTIONS = [undefined, 'parametry', 'moc', 'ekonomia', 'kultura', 'surowce', 'econ-surowiec-drewno', 'spichlerz', 'armia',
      'handel', 'econ-skarbiec', 'econ-praca', 'econ-nauka', 'econ-religia', 'econ-rekruci', 'econ-miasto', 'econ-obywatele'];
    const configure = (S, cfgVariant) => {
      if (cfgVariant === 'brak') {
        S.configureEmpireHandelSplit({ getOwnerDefault: undefined, onOwnerDefaultChange: undefined, getDaninaLabel: undefined, getActiveOwnerId: undefined });
        S.configureEmpireGlobalDefaults({ getOwnerDefaultPodzialPracy: undefined, onOwnerDefaultPodzialPracyChange: undefined, getOwnerDefaultPoziomRacji: undefined,
          onOwnerDefaultPoziomRacjiChange: undefined, onOwnerSetAutoWyzywienieForAll: undefined, getActiveOwnerId: undefined });
        S.configureEmpireMassRecruitment({ onPurchase: undefined });
        return;
      }
      const owner = cfgVariant === 'fotel2' ? 1 : 0;
      S.configureEmpireHandelSplit({
        getOwnerDefault: (o) => (o === 0 ? { procentPieniadz: 50, procentNauka: 30, procentLuksus: 20 } : { procentPieniadz: 33, procentNauka: 77, procentLuksus: 5 }),
        onOwnerDefaultChange: act('onOwnerDefaultChange'), getDaninaLabel: () => 'Podatek', getActiveOwnerId: () => owner,
      });
      S.configureEmpireGlobalDefaults({
        getOwnerDefaultPodzialPracy: (o) => ({ procentBudynki: o === 0 ? 70 : 55 }), onOwnerDefaultPodzialPracyChange: act('onOwnerDefaultPodzialPracyChange'),
        getOwnerDefaultPoziomRacji: (o) => (o === 0 ? 3.5 : 6), onOwnerDefaultPoziomRacjiChange: act('onOwnerDefaultPoziomRacjiChange'),
        onOwnerSetAutoWyzywienieForAll: act('onOwnerSetAutoWyzywienieForAll'), getActiveOwnerId: () => owner,
      });
      S.configureEmpireMassRecruitment({ onPurchase: act('onPurchase', (c, it, n) => n < 5) });
    };
    const cleanup = (S) => () => { S.hideEmpireDetailPanel(); };
    const rangeFills = (el) => {
      if (el.type === 'range') {
        const mn = Number(el.min || 0);
        const mx = Number(el.max || 100);
        return [String(mn), String(mx), String(Math.round((mn + mx) * 0.37)), String(Math.round((mn + mx) * 0.81))];
      }
      if (el.type === 'number') return ['3', '0', '9999', '2.5'];
      if (el.tagName === 'SELECT') return [...el.options].map((o) => o.value);
      return [null];
    };
    for (const variant of VARIANTS) {
      const pinSnap = snapFor(variant);
      const v2Snap = toV2Snap(pinSnap);
      for (const cfgVariant of variant === 'pelny' ? ['pelny', 'fotel2', 'brak'] : ['pelny']) {
        for (const section of SECTIONS) {
          if (cfgVariant !== 'pelny' && !['ekonomia', 'econ-skarbiec', 'econ-praca', 'econ-nauka', 'spichlerz', 'armia', undefined].includes(section)) continue;
          const setup = (S, s) => {
            configure(S, cfgVariant);
            S.mountEmpireDetailPanel(() => (s === 'v2' ? v2Snap : pinSnap));
            S.showEmpireDetailPanel(section);
            actionLog.push('open=' + S.isEmpireDetailPanelOpen());
          };
          await explore(M, `${variant}/${cfgVariant}/${section ?? 'all'}`, setup, {
            P, V, stash: true, cleanupP: cleanup(P), cleanupV: cleanup(V), keys: section === undefined ? ['Escape'] : [], maxClicks: 120, fills: rangeFills,
            after: (S) => { actionLog.push('open-po=' + S.isEmpireDetailPanelOpen()); },
          });
        }
      }
      // Sekwencje: toggle / refresh / zmiana sekcji przy otwartym panelu.
      const seq = (S, s) => {
        configure(S, 'pelny');
        S.mountEmpireDetailPanel(() => (s === 'v2' ? v2Snap : pinSnap));
        S.toggleEmpireDetailPanel('moc');
        S.refreshEmpireDetailPanel();
        S.showEmpireDetailPanel('econ-skarbiec');
        S.showEmpireDetailPanel('econ-skarbiec');
        actionLog.push('open=' + S.isEmpireDetailPanelOpen());
        S.toggleEmpireDetailPanel();
        actionLog.push('open=' + S.isEmpireDetailPanelOpen());
        S.refreshEmpireDetailPanel();
      };
      await domCase(M, `${variant}/sekwencja`, () => seq(P, 'pin'), () => seq(V, 'v2'), { stash: true, cleanupPin: cleanup(P), cleanupV2: cleanup(V) });
      // Funkcje eksportowane (czyste).
      const pe = pinSnap;
      const ve = v2Snap;
      cmpVal(M, `cityMiastaMiniDetail(${variant})`, P.cityMiastaMiniDetail(pe.cityEcon, pe.cityPobor, pe.food, pe.economy),
        V.cityMiastaMiniDetail(ve.cityEcon, ve.cityPobor, ve.food, ve.economy, ve.miastaSummary));
      cmpVal(M, `renderMiastoSection(${variant})`, P.renderMiastoSection(pe.cityEcon, pe.cityPobor, pe.economy, pe.trade, pe.resources),
        V.renderMiastoSection(ve.cityEcon, ve.cityPobor, ve.economy, ve.trade, ve.resources));
      cmpVal(M, `renderObywateleSection(${variant})`, P.renderObywateleSection(pe.cityEcon, pe.cityPobor, pe.economy, pe.power, pe.kultura, pe.religion, pe.resources, pe.happiness),
        V.renderObywateleSection(ve.cityEcon, ve.cityPobor, ve.economy, ve.power, ve.kultura, ve.religion, ve.resources, ve.happiness));
      cmpVal(M, `renderArmiaProdukcjaMini(${variant})`, P.renderArmiaProdukcjaMini(pe.armiaProdukcja), V.renderArmiaProdukcjaMini(ve.armiaProdukcja));
      cmpVal(M, `renderMassRecruitmentSection(${variant})`, P.renderMassRecruitmentSection(pe.cityPobor, pe.massRecruitment), V.renderMassRecruitmentSection(ve.cityPobor, ve.massRecruitment));
      pe.resources.forEach((r, i) => cmpVal(M, `resUsageDetailsHtml(${variant}#${i})`, P.resUsageDetailsHtml(r), V.resUsageDetailsHtml(ve.resources[i])));
      // `mountMassRecruitmentControls(host, snap, onAccepted)` — formularz poza panelem.
      for (const cnt of ['1', '4', '0', 'x', '6']) {
        const mm = async (S, s) => {
          configure(S, 'pelny');
          const host = document.createElement('div');
          host.innerHTML = S.renderMassRecruitmentSection((s === 'v2' ? ve : pe).cityPobor, (s === 'v2' ? ve : pe).massRecruitment);
          document.body.appendChild(host);
          S.mountMassRecruitmentControls(host, s === 'v2' ? ve : pe, act('onPurchase', (c, it, n) => n < 5));
          for (const inp of host.querySelectorAll('[data-mass-recruitment-count]')) {
            inp.value = cnt;
            inp.dispatchEvent(new W.Event('input', { bubbles: true }));
          }
          for (const sel of host.querySelectorAll('[data-mass-recruitment-unit]')) {
            sel.value = sel.options[sel.options.length - 1]?.value ?? '';
            sel.dispatchEvent(new W.Event('change', { bubbles: true }));
          }
          for (const b of host.querySelectorAll('[data-mass-recruitment-submit]')) fire(b, 'click');
        };
        await domCase(M, `mountMassRecruitmentControls(${variant},${cnt})`, () => mm(P, 'pin'), () => mm(V, 'v2'));
      }
    }
    for (const n of [0, 1, -1, 5, 12.5, -1234.5, 1e6]) cmpVal(M, `treasuryBalanceSignedTxt(${n})`, P.treasuryBalanceSignedTxt(n), V.treasuryBalanceSignedTxt(n));
    for (const s of [null, '', 'moc', 'econ-skarbiec', 'econ-surowiec-x', 'econ-cokolwiek', 'spichlerz-centralny', 'nieznana']) {
      cmpVal(M, `empirePanelBlockForSection(${s})`, P.empirePanelBlockForSection(s), V.empirePanelBlockForSection(s));
    }
    for (const a of ['skarbiec', 'praca', 'miasta', 'ludnosc', 'moc', 'power', 'zywnosc', 'religia', 'x']) cmpVal(M, `empireSectionFromHudAct(${a})`, P.empireSectionFromHudAct(a), V.empireSectionFromHudAct(a));
    // Asercje v2: zapytania suwaków trafiają do dostawcy (P5.7-Z2) — atrapa licząca wywołania. Przebieg jako przypadek DOM
    // (`stash` — panel jest singletonem modułu), pin wykonuje te same kroki (porównanie liczone jak każde inne).
    {
      const calls = [];
      const EQ = v2['controller/empireQueries.ts'];
      const real = {
        adjustHandelSplit: (cur, changed, val) => CITIES.adjustHandelSplit(cur, changed, val),
        normalizePodzialHandlu: (split) => CITIES.normalizePodzialHandlu(split),
        procentPuliImperiumZBudynkow: (b) => CITIES.procentPuliImperiumZBudynkow(b),
        podzialPracyZProcentuPuli: (p) => CITIES.podzialPracyZProcentuPuli(p),
      };
      EQ.installEmpireQueries({
        adjustHandelSplit: (c, k, val) => { calls.push('adjust'); return real.adjustHandelSplit(c, k, val); },
        normalizePodzialHandlu: (sp) => { calls.push('normalize'); return real.normalizePodzialHandlu(sp); },
        procentPuliImperiumZBudynkow: (b) => { calls.push('pula'); return real.procentPuliImperiumZBudynkow(b); },
        podzialPracyZProcentuPuli: (p) => { calls.push('podzial'); return real.podzialPracyZProcentuPuli(p); },
      });
      const pinSnap = snapFor('pelny');
      const v2Snap = toV2Snap(pinSnap);
      const runQ = async (S, s) => {
        configure(S, 'pelny');
        S.mountEmpireDetailPanel(() => (s === 'v2' ? v2Snap : pinSnap));
        S.showEmpireDetailPanel('econ-praca');
        await sleep(0);
        const r = document.querySelector('input[data-praca-empire-split]');
        actionLog.push('praca=' + desc(r));
        if (r) { r.value = '20'; r.dispatchEvent(new W.Event('input', { bubbles: true })); }
        S.showEmpireDetailPanel();
        await sleep(0);
        const h = document.querySelector('input[data-handel-key="procentNauka"]');
        actionLog.push('handel=' + desc(h));
        if (h) { h.value = '40'; h.dispatchEvent(new W.Event('input', { bubbles: true })); }
      };
      await domCase(M, 'zapytania-suwaków(praca 20, nauka 40)', () => runQ(P, 'pin'), () => runQ(V, 'v2'), { stash: true, cleanupPin: cleanup(P), cleanupV2: cleanup(V) });
      assertV2(M, [
        ['normalizePodzialHandlu → zapytanie', calls.includes('normalize')],
        ['procentPuliImperiumZBudynkow → zapytanie', calls.includes('pula')],
        ['podzialPracyZProcentuPuli → zapytanie', calls.includes('podzial')],
        ['adjustHandelSplit → zapytanie', calls.includes('adjust')],
      ]);
      EQ.installEmpireQueries(real);
    }
    notMeasured(M, 'przewijanie (`scrollTop`, `scrollIntoView` po `requestAnimationFrame`) — jsdom nie liczy układu; obie strony wołają te same API (zrzut DOM identyczny)');
    notMeasured(M, 'wygląd CSS (kolory, układ siatek) w realnej przeglądarce — porównanie dotyczy tekstu CSS i DOM, nie renderu');
  }
  if (want('empireDetailTypes.ts')) {
    const M = 'empireDetailTypes.ts';
    const [P, V] = mods(M);
    cmpVal(M, 'UCHWALA_SOL_SPICHLERZ_II_ID', P.UCHWALA_SOL_SPICHLERZ_II_ID, V.UCHWALA_SOL_SPICHLERZ_II_ID);
    for (const a of [true, false]) for (const n of [undefined, 0, 1, 3, -2]) {
      cmpVal(M, `buildUchwalaSolSpichlerzII(${a},${n})`, P.buildUchwalaSolSpichlerzII(a, n), V.buildUchwalaSolSpichlerzII(a, n));
    }
    assertV2(M, [['aggregateHappinessSources usunięta z frontendu (P5.13 — liczy silnik)', V.aggregateHappinessSources === undefined]]);
    notMeasured(M, 'pozostała zawartość = typy TS (brak wartości w runtime); kształt DTO sprawdza `tsc --noEmit`');
  }

  // ─── 4. hud.ts ────────────────────────────────────────────────────────────
  if (want('hud.ts')) {
    const M = 'hud.ts';
    const [P, V] = mods(M);
    const BR = v2['ui/armyStackHudSuppression.ts'];
    const combat = (k) => ({ atakBase: 4, atakEffective: 4 + k, obronaBase: 6, obronaEffective: 6 - k, hpMaxBase: 10, hpMaxEffective: 10 + k, pancerzBase: 1, pancerzEffective: 1 + k,
      weaponDamageBase: 2, weaponDamageEffective: 2, piercingBase: 0, piercingEffective: k, chargeBonusBase: 0, chargeBonusEffective: 0, missileAttackBase: 0, missileAttackEffective: k });
    const stack = { hexLabel: 'Heks <1>', unitCount: 2, cards: [{ id: 'c0', name: 'Karta <0>', icon: '', hp: 10, hpMax: 10, ruchLeft: 1, ruchMax: 2, active: true }, { id: 'c1', name: 'Karta 1', icon: '🛡', hp: 6, hpMax: 10, ruchLeft: 0, ruchMax: 2 }],
      displayName: 'Hoplita', combat: combat(1), mov: 2, rng: 0, hp: 9, parametryPathPp: 17, pancerzPathPp: 31, actions: [{ id: 'fortify', label: 'Fortyfikuj', primary: true }] };
    const stackV2 = { ...stack, badges: badges(stack) };
    const EVENTS = [
      { id: 'e1', kind: 'info', text: 'Zdarzenie <x>', turn: 41, origin: 'own' },
      { id: 'e2', kind: 'war', text: 'Wojna!', turn: 42, origin: 'other-civs' },
    ];
    const STATES = {
      pelny: () => hudStateBase(),
      deficyt: () => ({ ...hudStateBase(), zlotoRate: -4, pracaRate: -1, glodWojska: true, zywnoscMiastNiedokarmionych: 3, zywnoscRate: -2, wojny: 0, sojusze: 0, pakty: 0, badana: null, epokaPostep: 1.4 }),
      minimalny: () => ({ zloto: 0, zlotoRate: 0, praca: 0, pracaRate: 0, zywnoscLabel: '0', nauka: 0, kultura: 0, bogactwo: 0, ludnosc: 0, power: 0, osiedla: 0, osiedlaMax: 1, tura: 1, epoka: 'Kamień' }),
    };
    const cfgFor = (S, s, stName, o = {}) => ({
      getState: STATES[stName],
      onEndTurn: act('onEndTurn'), onOpenCities: act('onOpenCities'), onOpenScience: act('onOpenScience'), onOpenDiplomacy: act('onOpenDiplomacy'),
      onOpenMenu: act('onOpenMenu'), onOpenWiki: act('onOpenWiki'), isWikiActive: () => !!o.wiki,
      getMinimapData: () => null, onMinimapClick: act('onMinimapClick'),
      getContextPanelMessage: () => (o.ctxMsg ? 'Wybierz cel <x>' : null),
      getEvents: () => (o.events ? EVENTS : []), onEventClick: act('onEventClick'), onEventDismiss: act('onEventDismiss'), onDismissAll: act('onDismissAll'),
      getEventLink: (ev) => (ev.id === 'e1' ? { label: 'Pokaż' } : null),
      getWarsWithPlayer: () => (o.wars ? [{ civName: 'Kartagina <x>', civId: 'kartagina', ownerId: 2 }] : []),
      // `legacy` = brak `onExecutePending`/`mapToolbar` → układ paska `renderBarLegacy` (`hud.ts:543,1437-1441`).
      onExecutePending: o.legacy ? undefined : act('onExecutePending'), canEndTurn: () => o.canEnd !== false, getBlockingCount: () => (o.blocking ?? 0),
      getYearLabel: () => '1200 p.n.e.', hideEndTurn: () => !!o.hideEnd,
      armyStack: o.army ? { getStack: () => (s === 'v2' ? stackV2 : stack), onSelectUnit: act('onSelectUnit'), onAction: act('onAction'), onClose: act('onClose') } : undefined,
      onDiploChip: act('onDiploChip'), onOpenEmpireDetail: act('onOpenEmpireDetail'),
      getPowerOverlay: () => null, getCultureOverlay: () => null, getReligionOverlay: () => null,
    });
    const cleanup = (S) => () => { S.hideHud(); };
    const HV = [
      ['pelny', { events: true, wars: true, army: true, ctxMsg: true }],
      ['pelny', { blocking: 2, canEnd: false, wiki: true }],
      ['deficyt', { hideEnd: true, army: true }],
      ['minimalny', {}],
      ['pelny', { legacy: true, events: true, wars: true }],
      ['deficyt', { legacy: true }],
      ['minimalny', { legacy: true }],
    ];
    for (const [hi, [stName, o]] of HV.entries()) {
      const setup = (S, s) => { S.showHud(cfgFor(S, s, stName, o)); actionLog.push('open=' + S.isHudOpen()); };
      await explore(M, `hud#${hi}(${stName})`, setup, { P, V, stash: true, cleanupP: cleanup(P), cleanupV: cleanup(V), maxClicks: 70, keys: ['Escape', 'Enter'],
        after: (S) => { S.updateHud(); actionLog.push('open-po=' + S.isHudOpen()); } });
    }
    for (const stName of Object.keys(STATES)) cmpVal(M, `renderBarD1B(${stName})`, P.renderBarD1B(STATES[stName]()), V.renderBarD1B(STATES[stName]()));
    // Ukrycie rosteru armii: pin `hud.setArmyStackHudSuppressed` vs v2 — ta sama funkcja oraz most `armyStackHudSuppression.ts`
    // (droga `preBattle.ts` od P5.6, ZAŁOŻENIE P5.6-Z3).
    for (const viaBridge of [false, true]) {
      for (const seqName of ['ukryj', 'ukryj-pokaz', 'ukryj-przed-show']) {
        const run = (S, s) => {
          const sup = (b) => (s === 'v2' && viaBridge ? BR.setArmyStackHudSuppressed(b) : S.setArmyStackHudSuppressed(b));
          if (seqName === 'ukryj-przed-show') sup(true);
          S.showHud(cfgFor(S, s, 'pelny', { army: true }));
          if (seqName !== 'ukryj-przed-show') sup(true);
          actionLog.push('display=' + (document.querySelector('.civ-army-stack-hud, [class*="army-stack"]')?.style.display ?? 'BRAK'));
          if (seqName === 'ukryj-pokaz') sup(false);
          S.updateHud();
        };
        await domCase(M, `armyStackSuppressed(${seqName}${viaBridge ? ',most' : ''})`, () => run(P, 'pin'), () => run(V, 'v2'),
          { stash: true, cleanupPin: () => { P.setArmyStackHudSuppressed(false); P.hideHud(); }, cleanupV2: () => { V.setArmyStackHudSuppressed(false); V.hideHud(); } });
      }
    }
    const chrome = (S, s) => { S.showHud(cfgFor(S, s, 'pelny', { army: true, events: true })); S.setMapHudChromeSuppressed(true); S.markMinimapDirty(); S.updateHud(); actionLog.push('chrome'); S.setMapHudChromeSuppressed(false); };
    await domCase(M, 'setMapHudChromeSuppressed', () => chrome(P, 'pin'), () => chrome(V, 'v2'), { stash: true, cleanupPin: cleanup(P), cleanupV2: cleanup(V) });
    // Asercja v2: most zarejestrowany przez ewaluację `hud.ts` (bez niego `preBattle.ts` nie ukryje rosteru).
    {
      resetDoc();
      V.showHud(cfgFor(V, 'v2', 'pelny', { army: true }));
      const before = [...document.querySelectorAll('body > div')].filter((d) => d.style.display === 'none').length;
      BR.setArmyStackHudSuppressed(true);
      const after = [...document.querySelectorAll('body > div')].filter((d) => d.style.display === 'none').length;
      BR.setArmyStackHudSuppressed(false);
      V.hideHud();
      resetDoc();
      assertV2(M, [['most `armyStackHudSuppression` → `hud.setArmyStackHudSuppressed` (ukrywa panel rosteru)', after === before + 1]]);
    }
    notMeasured(M, 'minimapa (`getMinimapData` → dane) oraz `mapToolbar`/`buildMode` — moduły porównane z pinem w P5.2 (`minimapHud.ts`) i P5.5 (`mapToolbarHud.ts`, `buildModeHud.ts`); tu przekazywane bez zmian (`hud.ts` = pin + most)');
    notMeasured(M, 'pełny ekran / zoom UI (`requestFullscreen`, `transform: scale` na `body`) — jsdom bez API pełnego ekranu i układu');
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
  console.log(`dom-harness-hud-empire: pin=edb8fb56 modułów=${rows.length} przypadków=${totalCases} różnic=${totalDiffs} jsdomErrors=${jsdomErrors.length} consoleErrors=${consoleErrors.length}`);
  if (jsdomErrors.length) console.log('jsdomErrors (unikalne): ' + [...new Set(jsdomErrors)].slice(0, 12).join(' | '));
  if (consoleErrors.length) console.log('consoleErrors (unikalne): ' + [...new Set(consoleErrors)].slice(0, 5).join(' | '));
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ pin: 'edb8fb56', totalCases, totalDiffs, modules: rows }, null, 2) + '\n');
  exitCode = totalDiffs === 0 ? 0 : 1;
} catch (err) {
  console.error = origError;
  if (err instanceof StopOnDiff) {
    console.log = origLog;
    console.log(`dom-harness-hud-empire: STOP_ON_DIFF pierwsza różnica: ${err.message}`);
    exitCode = 1;
  } else {
    console.error('dom-harness-hud-empire: BŁĄD', err?.stack ?? err);
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
