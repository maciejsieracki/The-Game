#!/usr/bin/env node
/**
 * run-cityux.mjs — harness porównania DOM/wyników: `cityUxFrame.ts` (P5.7 runda 3, `R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1`;
 * `PORTING-QUEUE.md` wiersz 82, cykl C1) w frontend-v2 vs ten sam moduł z pinu web `edb8fb56`.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   git archive edb8fb56 gra/src gra/data | tar -x -C <PIN_DIR>
 *   node tools/dom-harness/run-cityux.mjs --pin-dir <PIN_DIR> [--json <plik>] [--stop-on-diff]
 * EXIT 0 ⇔ 0 różnic (i wszystkie asercje v2 spełnione); 1 ⇔ ≥1 różnica; 2 ⇔ błąd harnessu.
 *
 * Metoda = `run-hud-empire.mjs` (P5.7 r1): oba drzewa pakowane `esbuild` z tą samą emulacją Vite (`build.mjs`), wspólny
 * jsdom, kanoniczna serializacja `document.documentElement` albo JSON wartości, log akcji (callbacki) dopisany do DOM.
 *
 * Izolacja ramki od panelu miasta (port `cityPanel.ts` = r4): po stronie pinu import `./cityPanel` z `cityUxFrame.ts`
 * jest podmieniony (opcja `alias` w `build.mjs`) na `city-panel-stub.mjs`; po stronie v2 ta sama atrapa jest
 * rejestrowana w moście `cityPanelUxBridge.ts` (`registerCityPanelUx`). Atrapa loguje wywołania i maluje w każdym
 * kontenerze ramki znacznik + elementy używane przez ramkę (`#cs-okolica-center`, `.civ-v-map-bottom-stack`, pola
 * formularza do blokady skrótów, przyciski wołające `refresh`/`onClose`). Pin dostaje `City` = obiekt z tymi samymi
 * polami co `CityRefDto` v2 i atrapę `GameMap` (`{}`; v2 nie przekazuje mapy — ZAŁOŻENIE P5.7-Z7, asercja osobna).
 *
 * Pokrycie: `getCityUxLayoutMetrics` × 8 szerokości okna; `isCityUxFrameOpen`; `showCityUxFrame` (czysty dokument,
 * dokument z elementami legacy, ponowne otwarcie, otwarcie po zamknięciu); `refreshCityUxFrame` przed/po otwarciu;
 * `hideCityUxFrame` (w tym podwójne); skróty klawiszowe × 10 klawiszy × 7 celów (dokument, `body`, pola formularza,
 * `contenteditable`, zwykły element) z `defaultPrevented` i propagacją; Escape (stos `escapeOverlayStack`); przyciski
 * atrapy (`refresh`, `onClose`); `isPointOverCityPanelUi` × 2 szerokości × 8 konfiguracji elementów (prostokąty
 * `getBoundingClientRect` ustawione jawnie, jsdom nie liczy układu) × 4 stany docków szczegółów × siatka 44×11 punktów.
 */
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
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
const STOP_ON_DIFF = args.includes('--stop-on-diff');
class StopOnDiff extends Error {}
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-cityux.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const PIN_SRC = resolve(PIN_DIR, 'gra/src');
const STUB = fileURLToPath(new URL('./city-panel-stub.mjs', import.meta.url));
const M = 'cityUxFrame.ts';
const SHARED = ['hoverDetailDock.ts', 'escapeOverlayStack.ts'];

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
  'window', 'document', 'Node', 'Element', 'HTMLElement', 'HTMLDivElement', 'HTMLButtonElement', 'HTMLInputElement',
  'HTMLSelectElement', 'HTMLTextAreaElement', 'HTMLSpanElement', 'Event', 'MouseEvent', 'KeyboardEvent', 'CustomEvent',
  'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'localStorage', 'location', 'navigator', 'matchMedia',
];
for (const k of GLOBALS) {
  const v = k === 'window' ? W : W[k];
  if (v === undefined) continue;
  Object.defineProperty(globalThis, k, { value: typeof v === 'function' && k !== 'window' && /^[a-z]/.test(k) ? v.bind(W) : v, configurable: true, writable: true });
}
const setWidth = (w) => Object.defineProperty(W, 'innerWidth', { value: w, configurable: true, writable: true });
const origLog = console.log;
const origError = console.error;
const origWarn = console.warn;
console.warn = () => {};
const consoleErrors = [];
console.error = (...a) => { consoleErrors.push(a.map(String).join(' ').slice(0, 200)); };

const tmp = mkdtempSync(join(tmpdir(), 'p57r3-harness-'));
const pinOut = join(tmp, 'pin');
const v2Out = join(tmp, 'v2');
let exitCode = 0;
try {
  await bundle([join(PIN_SRC, 'ui', M), ...SHARED.map((m) => join(PIN_SRC, 'ui', m))], pinOut, {
    alias: [{ from: join(PIN_SRC, 'ui/cityPanel'), to: STUB }],
  });
  await bundle([M, 'cityPanelUxBridge.ts', ...SHARED].map((m) => join(V2_ROOT, 'src/ui', m)), v2Out);
  const imp = (base, rel) => import(pathToFileURL(join(base, rel.replace(/\.ts$/, '.js'))).href);
  const P = { ...(await imp(pinOut, M)), dock: await imp(pinOut, 'hoverDetailDock.ts') };
  const V = { ...(await imp(v2Out, M)), dock: await imp(v2Out, 'hoverDetailDock.ts') };
  const BR = await imp(v2Out, 'cityPanelUxBridge.ts');

  // ─── wyniki ────────────────────────────────────────────────────────────────
  const R = { module: M, cases: 0, diffs: 0, examples: [], notMeasured: [], v2Assertions: [], v2AssertionsFailed: 0 };
  function ser(node) {
    if (node.nodeType === 3) return JSON.stringify(node.data);
    if (node.nodeType === 8) return `<!--${node.data}-->`;
    if (node.nodeType !== 1) return '';
    const tag = node.tagName.toLowerCase();
    const attrs = [...node.attributes].map((a) => `${a.name}=${JSON.stringify(a.value)}`).sort().join(' ');
    return `<${tag}${attrs ? ' ' + attrs : ''}>${[...node.childNodes].map(ser).join('')}</${tag}>`;
  }
  function record(label, a, b) {
    R.cases++;
    if (a !== b) {
      R.diffs++;
      if (STOP_ON_DIFF) throw new StopOnDiff(`${M}: ${label}`);
      if (R.examples.length < 5) {
        let i = 0;
        while (i < a.length && a[i] === b[i]) i++;
        R.examples.push({ label, at: i, pin: a.slice(Math.max(0, i - 80), i + 140), v2: b.slice(Math.max(0, i - 80), i + 140) });
      }
    }
  }
  const assertV2 = (check, ok) => {
    R.v2Assertions.push({ check, ok: !!ok });
    if (!ok) {
      R.v2AssertionsFailed++;
      if (STOP_ON_DIFF) throw new StopOnDiff(`${M}: asercja v2: ${check}`);
    }
  };
  function resetDoc() {
    for (const n of [...document.documentElement.childNodes]) if (n !== document.head && n !== document.body) n.remove();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    for (const el of [document.documentElement, document.body]) for (const a of [...el.attributes]) el.removeAttribute(a.name);
  }

  // ─── atrapa panelu miasta (wspólna dla obu stron) ─────────────────────────
  let actionLog = [];
  let paintSeq = 0;
  let stubMode = 'pelny';
  let mapArgs = [];
  const MOUNT_KEYS = ['top', 'left', 'leftIconRail', 'rightIconRail', 'leftDetailDock', 'detailDock', 'right', 'mapChrome'];
  globalThis.__cityPanelStub = {
    mapArg: (m) => mapArgs.push(m),
    paint(mounts, city, refresh, onClose) {
      paintSeq++;
      actionLog.push(`paint#${paintSeq}(${city.id},${city.name},${city.owner},${city.q},${city.r},mounts=${MOUNT_KEYS.filter((k) => mounts[k] instanceof W.HTMLElement).join('+')},refresh=${typeof refresh},onClose=${typeof onClose})`);
      if (stubMode === 'pusty') return;
      for (const k of MOUNT_KEYS) {
        const m = mounts[k];
        if (!m) continue;
        const d = document.createElement('div');
        d.className = 'stub-sec';
        d.setAttribute('data-sec', k);
        d.textContent = `${k}:${city.name}#${paintSeq}`;
        m.appendChild(d);
      }
      const btn = (mount, attr, fn) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute(attr, '');
        b.textContent = attr;
        b.addEventListener('click', fn);
        mount.appendChild(b);
      };
      btn(mounts.top, 'data-stub-refresh', () => { actionLog.push('stub:refresh'); refresh(); });
      btn(mounts.right, 'data-stub-close', () => { actionLog.push('stub:close'); onClose?.(); });
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.id = 'stub-input';
      mounts.left.appendChild(inp);
      const ta = document.createElement('textarea');
      ta.id = 'stub-ta';
      mounts.left.appendChild(ta);
      const sel = document.createElement('select');
      sel.id = 'stub-sel';
      mounts.left.appendChild(sel);
      const ce = document.createElement('div');
      ce.id = 'stub-ce';
      ce.setAttribute('contenteditable', 'true');
      const ceIn = document.createElement('span');
      ceIn.id = 'stub-ce-in';
      ce.appendChild(ceIn);
      mounts.right.appendChild(ce);
      const plain = document.createElement('span');
      plain.id = 'stub-plain';
      mounts.right.appendChild(plain);
      if (mounts.mapChrome) {
        const center = document.createElement('div');
        center.id = 'cs-okolica-center';
        mounts.mapChrome.appendChild(center);
        const bottom = document.createElement('div');
        bottom.className = 'civ-v-map-bottom-stack';
        mounts.mapChrome.appendChild(bottom);
      }
    },
    clear: () => actionLog.push('clearCityPanelUxMode'),
    nav: (d) => actionLog.push(`navigateCityPanel(${d})`),
  };
  // v2: ta sama atrapa w moście (bez `map`).
  const stubImpl = {
    paintCityPanelSections: (m, c, r, o) => globalThis.__cityPanelStub.paint(m, c, r, o),
    clearCityPanelUxMode: () => globalThis.__cityPanelStub.clear(),
    navigateCityPanel: (d) => globalThis.__cityPanelStub.nav(d),
  };
  BR.registerCityPanelUx(stubImpl);

  const CITIES = [
    { id: 7, owner: 0, q: 12, r: -4, name: 'Babilon', mapLabel: 'Babilon', population: 5, isCapital: true, isMine: true },
    { id: 19, owner: 0, q: 3, r: 8, name: 'Ur', mapLabel: 'Ur', population: 2, isCapital: false, isMine: true },
  ];
  // Pin: `City` (te same pola, które czyta atrapa); v2: `CityRefDto`.
  const pinCity = (c) => ({ id: c.id, owner: c.owner, q: c.q, r: c.r, name: c.name, population: c.population });
  const MAP = {};
  const S = {
    pin: { show: (c, cb) => P.showCityUxFrame(pinCity(c), MAP, act('paint'), cb ?? act('onClose')), refresh: (c) => P.refreshCityUxFrame(pinCity(c), MAP, act('paint')), m: P },
    v2: { show: (c, cb) => V.showCityUxFrame(c, act('paint'), cb ?? act('onClose')), refresh: (c) => V.refreshCityUxFrame(c, act('paint')), m: V },
  };
  function act(name) { return () => actionLog.push(name + '()'); }
  const dumpActions = () => {
    const pre = document.createElement('pre');
    pre.setAttribute('data-action-log', '');
    pre.textContent = actionLog.join('\n');
    document.body.appendChild(pre);
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function domCase(label, run, { width = 1920, mode = 'pelny' } = {}) {
    const one = async (side) => {
      curCase = `${label}/${side}`;
      resetDoc();
      setWidth(width);
      actionLog = [];
      paintSeq = 0;
      stubMode = mode;
      try { await run(S[side], side); } catch (e) { actionLog.push('THROW:' + String(e?.message ?? e)); }
      actionLog.push(`isCityUxFrameOpen=${S[side].m.isCityUxFrameOpen()}`);
      await sleep(0);
      dumpActions();
      const snap = ser(document.documentElement);
      try { S[side].m.hideCityUxFrame(); S[side].m.dock.setHoverDetailDocks(null); } catch { /* sprzątanie */ }
      return snap;
    };
    const a = await one('pin');
    const b = await one('v2');
    resetDoc();
    record(label, a, b);
  }
  const valCase = (label, fnPin, fnV2) => {
    let a; let b;
    try { a = JSON.stringify(fnPin()); } catch (e) { a = 'THROW:' + e.message; }
    try { b = JSON.stringify(fnV2()); } catch (e) { b = 'THROW:' + e.message; }
    record(label, a, b);
  };

  // 1. Metryki układu.
  for (const w of [320, 800, 1167, 1280, 1416, 1417, 1920, 2560]) {
    setWidth(w);
    valCase(`metrics@${w}`, () => P.getCityUxLayoutMetrics(), () => V.getCityUxLayoutMetrics());
  }
  valCase('isCityUxFrameOpen(zamknięta)', () => P.isCityUxFrameOpen(), () => V.isCityUxFrameOpen());
  valCase('isPointOverCityPanelUi(zamknięta)', () => [[0, 0], [500, 500], [1900, 50]].map(([x, y]) => P.isPointOverCityPanelUi(x, y)),
    () => [[0, 0], [500, 500], [1900, 50]].map(([x, y]) => V.isPointOverCityPanelUi(x, y)));

  // 2. Cykl życia ramki.
  const legacy = () => {
    const st = document.createElement('style');
    st.id = 'civ-okolica-ux-frame-css';
    st.textContent = '.x{}';
    document.body.appendChild(st);
    for (const id of ['civ-ux-top-mask', 'civ-ux-map-mask']) {
      const d = document.createElement('div');
      d.id = id;
      document.body.appendChild(d);
    }
    const old = document.createElement('div');
    old.className = 'civ-ux-frame';
    old.setAttribute('data-old', '');
    document.body.appendChild(old);
  };
  const existingStyle = () => {
    const st = document.createElement('style');
    st.id = 'civ-okolica-ux-frame-css-w3';
    st.textContent = '.stary{}';
    document.head.appendChild(st);
    const dim = document.createElement('div');
    dim.id = 'civ-ux-dim-full';
    dim.setAttribute('data-stary', '');
    document.body.appendChild(dim);
  };
  const LIFE = [
    ['show', (s) => s.show(CITIES[0])],
    ['show(pusta atrapa)', (s) => s.show(CITIES[0]), { mode: 'pusty' }],
    ['show@1280', (s) => s.show(CITIES[1]), { width: 1280 }],
    ['legacy+show', (s) => { legacy(); s.show(CITIES[0]); }],
    ['istniejący-styl+show', (s) => { existingStyle(); s.show(CITIES[0]); }],
    ['show×2', (s) => { s.show(CITIES[0]); s.show(CITIES[1]); }],
    ['refresh przed show', (s) => { s.refresh(CITIES[0]); }],
    ['show+refresh', (s) => { s.show(CITIES[0]); s.refresh(CITIES[1]); }],
    ['show+hide', (s) => { s.show(CITIES[0]); s.m.hideCityUxFrame(); }],
    ['show+hide+refresh', (s) => { s.show(CITIES[0]); s.m.hideCityUxFrame(); s.refresh(CITIES[1]); }],
    ['hide×2 bez show', (s) => { s.m.hideCityUxFrame(); s.m.hideCityUxFrame(); }],
    ['show+hide+show', (s) => { s.show(CITIES[0]); s.m.hideCityUxFrame(); s.show(CITIES[1]); }],
    ['show+hide+legacy+hide', (s) => { s.show(CITIES[0]); s.m.hideCityUxFrame(); legacy(); s.m.hideCityUxFrame(); }],
    ['stub:refresh', (s) => { s.show(CITIES[0]); document.querySelector('[data-stub-refresh]').click(); }],
    ['stub:close', (s) => { s.show(CITIES[0]); document.querySelector('[data-stub-close]').click(); }],
    ['stub:close po refresh', (s) => { s.show(CITIES[0]); s.refresh(CITIES[1]); document.querySelectorAll('[data-stub-close]')[1].click(); }],
    ['onClose zgłasza hide (re-entry)', (s, side) => { s.show(CITIES[0], () => { actionLog.push('onClose()'); S[side].m.hideCityUxFrame(); }); document.querySelector('[data-stub-close]').click(); }],
  ];
  for (const [label, run, opt] of LIFE) await domCase(label, run, opt);

  // 3. Klawisze (← → , . + `code`, inne, Escape) × cele.
  const KEYS = [
    { key: 'ArrowLeft' }, { key: ',' }, { key: 'x', code: 'Comma' }, { key: 'ArrowRight' }, { key: '.' },
    { key: 'y', code: 'Period' }, { key: 'ArrowUp' }, { key: 'a', code: 'KeyA' }, { key: '<', code: 'IntlBackslash' }, { key: 'Escape' },
  ];
  const TARGETS = ['document', 'body', '#stub-input', '#stub-ta', '#stub-sel', '#stub-ce-in', '#stub-plain'];
  for (const k of KEYS) {
    for (const t of TARGETS) {
      await domCase(`klawisz ${k.key}/${k.code ?? '-'} @${t}`, (s) => {
        s.show(CITIES[0]);
        const later = () => actionLog.push('document:keydown(po ramce)');
        document.addEventListener('keydown', later, true);
        const bodyL = () => actionLog.push('body:keydown');
        document.body.addEventListener('keydown', bodyL);
        const target = t === 'document' ? document : t === 'body' ? document.body : document.querySelector(t);
        const ev = new W.KeyboardEvent('keydown', { key: k.key, code: k.code ?? '', bubbles: true, cancelable: true });
        target.dispatchEvent(ev);
        actionLog.push(`defaultPrevented=${ev.defaultPrevented}`);
        document.removeEventListener('keydown', later, true);
        document.body.removeEventListener('keydown', bodyL);
      });
    }
  }
  // Klawisze po zamknięciu (odpięcie nasłuchu) i po ponownym otwarciu (brak podwójnego nasłuchu).
  for (const seq of ['hide', 'show×2', 'escape+klawisz']) {
    await domCase(`klawisze po: ${seq}`, (s) => {
      s.show(CITIES[0]);
      if (seq === 'hide') s.m.hideCityUxFrame();
      if (seq === 'show×2') s.show(CITIES[1]);
      if (seq === 'escape+klawisz') document.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      for (const key of ['ArrowLeft', 'ArrowRight', ',', '.', 'Escape']) {
        const ev = new W.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        document.dispatchEvent(ev);
        actionLog.push(`${key}:defaultPrevented=${ev.defaultPrevented}`);
      }
    });
  }

  // 4. `isPointOverCityPanelUi` — siatka punktów × szerokości × elementy (prostokąty jawne) × docki.
  // Granice dla 1280 i 1920 px (lewy panel 339,2 / 372; szyna 355,2–411,2 / 388–444; z dokiem +400; prawy panel 948 / 1588; szyna prawa 886 / 1526; z dokiem −400).
  const XS = [0, 10, 31, 32, 100, 300, 339, 340, 355, 356, 371, 372, 380, 387, 388, 411, 412, 420, 444, 445, 500, 700, 739, 740, 755, 772, 788, 811, 844, 845, 886, 948, 960, 1100, 1126, 1188, 1500, 1526, 1540, 1580, 1587, 1588, 1600, 1900];
  const YS = [0, 5, 9, 10, 50, 89, 90, 95, 96, 400, 900];
  const rect = (l, t, r, b) => () => ({ left: l, top: t, right: r, bottom: b, x: l, y: t, width: r - l, height: b - t, toJSON() {} });
  const ELEM_CFG = [
    ['brak elementów', { top: false, bottom: false, center: false }],
    ['top', { top: rect(0, 0, 1920, 60) }],
    ['top wysoki', { top: rect(0, 0, 1920, 120) }],
    ['bottom-stack', { top: false, bottom: rect(600, 800, 1300, 900) }],
    ['okolica-center', { top: false, center: rect(700, 300, 1200, 600) }],
    ['wszystkie', { top: rect(0, 0, 1920, 90), bottom: rect(600, 800, 1300, 900), center: rect(700, 300, 1200, 600) }],
    ['center brzegi', { top: rect(0, 0, 1920, 5), center: rect(500, 400, 500, 400) }],
    ['bottom bez top', { top: false, bottom: rect(0, 880, 1920, 900) }],
  ];
  const DOCKS = ['brak', 'lewy', 'prawy', 'oba'];
  for (const w of [1280, 1920]) {
    for (const [cfgName, cfg] of ELEM_CFG) {
      for (const dk of DOCKS) {
        await domCase(`isPointOver@${w} ${cfgName} dock=${dk}`, (s) => {
          s.show(CITIES[0]);
          const topEl = document.querySelector('.civ-ux-top');
          const bottomEl = document.querySelector('.civ-v-map-bottom-stack');
          const centerEl = document.getElementById('cs-okolica-center');
          if (cfg.top === false) topEl.className = 'civ-ux-top-wyl'; else if (cfg.top) topEl.getBoundingClientRect = cfg.top;
          if (!cfg.bottom) bottomEl.remove(); else bottomEl.getBoundingClientRect = cfg.bottom;
          if (!cfg.center) centerEl.remove(); else centerEl.getBoundingClientRect = cfg.center;
          const leftDock = document.querySelector('.civ-ux-detail-dock-left');
          const rightDock = document.querySelector('.civ-ux-detail-dock');
          s.m.dock.setHoverDetailDocks({ left: leftDock, right: rightDock });
          if (dk === 'lewy' || dk === 'oba') leftDock.classList.add('is-open');
          if (dk === 'prawy' || dk === 'oba') rightDock.classList.add('is-open');
          const rows = YS.map((y) => `${y}:` + XS.map((x) => (s.m.isPointOverCityPanelUi(x, y) ? '1' : '0')).join(''));
          actionLog.push(...rows);
        }, { width: w });
      }
    }
  }

  // 5. Asercje v2 (most, ZAŁOŻENIE P5.7-Z7).
  {
    resetDoc();
    setWidth(1920);
    actionLog = [];
    mapArgs = [];
    V.showCityUxFrame(CITIES[0], () => {}, () => {});
    assertV2('most: `paintCityPanelSections` z `cityUxFrame.ts` trafia do zarejestrowanej implementacji', actionLog.some((l) => l.startsWith('paint#')));
    assertV2('v2 nie przekazuje `map` (Z7)', mapArgs.length === 0);
    V.hideCityUxFrame();
    assertV2('most: `clearCityPanelUxMode` przy zamknięciu', actionLog.includes('clearCityPanelUxMode'));
    BR.registerCityPanelUx(null);
    actionLog = [];
    let threw = false;
    try {
      V.showCityUxFrame(CITIES[0], () => {}, () => {});
      document.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
      V.hideCityUxFrame();
    } catch { threw = true; }
    assertV2('most bez rejestracji = brak efektu (ramka działa, zero wywołań panelu)', !threw && actionLog.length === 0);
    BR.registerCityPanelUx(stubImpl);
    // Pin: atrapa dostaje `map` (5 argumentów, `cityPanel.ts:11756-11762`).
    actionLog = [];
    P.showCityUxFrame(pinCity(CITIES[0]), MAP, () => {}, () => {});
    assertV2('pin przekazuje `map` do `paintCityPanelSections` (kontrola atrapy)', mapArgs.length === 1 && mapArgs[0] === MAP);
    P.hideCityUxFrame();
    resetDoc();
  }
  R.notMeasured.push('układ i wygląd CSS w realnej przeglądarce (jsdom bez układu: `getBoundingClientRect` ustawiony jawnie, `min(24vw,…)`, przejścia `transition`) — CSS porównany bajtowo jako tekst `<style>`');
  R.notMeasured.push('treść panelu miasta (`paintCityPanelSections`) — atrapa po obu stronach; port `cityPanel.ts` = P5.7 r4');

  // ─── raport ────────────────────────────────────────────────────────────────
  const totalDiffs = R.diffs + R.v2AssertionsFailed;
  console.log(`${M.padEnd(30)} przypadki=${String(R.cases).padStart(5)} różnice=${R.diffs} asercje_v2=${R.v2Assertions.length - R.v2AssertionsFailed}/${R.v2Assertions.length} NIE_ZMIERZONO=${R.notMeasured.length}`);
  for (const ex of R.examples) console.log(`   RÓŻNICA ${ex.label} @${ex.at}\n     pin: ${ex.pin}\n     v2 : ${ex.v2}`);
  for (const nm of R.notMeasured) console.log(`   NIE_ZMIERZONO: ${nm}`);
  for (const a of R.v2Assertions) if (!a.ok) console.log(`   ASERCJA_V2_NIESPEŁNIONA: ${a.check}`);
  console.log(`dom-harness-cityux: pin=edb8fb56 modułów=1 przypadków=${R.cases} różnic=${totalDiffs} jsdomErrors=${jsdomErrors.length} consoleErrors=${consoleErrors.length}`);
  if (jsdomErrors.length) console.log('jsdomErrors (unikalne): ' + [...new Set(jsdomErrors)].slice(0, 12).join(' | '));
  if (consoleErrors.length) console.log('consoleErrors (unikalne): ' + [...new Set(consoleErrors)].slice(0, 5).join(' | '));
  if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ pin: 'edb8fb56', totalCases: R.cases, totalDiffs, modules: [R] }, null, 2) + '\n');
  exitCode = totalDiffs === 0 && R.cases > 0 ? 0 : 1;
} catch (err) {
  console.error = origError;
  if (err instanceof StopOnDiff) {
    console.log = origLog;
    console.log(`dom-harness-cityux: STOP_ON_DIFF pierwsza różnica: ${err.message}`);
    exitCode = 1;
  } else {
    console.error('dom-harness-cityux: BŁĄD', err?.stack ?? err);
    exitCode = 2;
  }
} finally {
  console.warn = origWarn;
  console.error = origError;
  console.log = origLog;
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
