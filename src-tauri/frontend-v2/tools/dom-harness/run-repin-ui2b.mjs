#!/usr/bin/env node
/**
 * run-repin-ui2b.mjs — harness partii REPIN UI-2-B (R-RUSTPORT-REPIN-UI-2-B-Q1).
 *
 * Moduły partii:
 *   aiOwnerProgressFrame.ts  kopia bajtowa (shouldYieldAiOwnerProgressFrame)
 *   armyMergePanel.ts        kopia bajtowa („Połączenie armii”: siatka 3×5, licznik, „▼ jeszcze N”, Enter/autofokus)
 *   armySplitPanel.ts        kopia bajtowa („Rozdziel armię”: siatka 3×5, stabilny scroll, roving tabindex)
 *   unitReplacePicker.ts     port DOM (pole `blockedReason`; `affordable` z DTO)
 *   siegeMapPanel.ts         port DOM (`SiegePanelDto.milicjaRegen`, bez „~” przy Milicji)
 *
 * WEB:  moduły z URUCHOMIONEGO weba — katalog `git archive origin/main gra/src gra/data` (`--web-dir`), spakowane
 *       `build.mjs` i wykonane w Chromium (Playwright, `/opt/node-tools`), serwowane po HTTP z localhost.
 * PORT: moduły `src/ui/**` frontend-v2 (`--src`), ten sam `build.mjs`, ta sama instancja Chromium.
 * Wejście portu DOM = „Rust”: `affordable = skarb >= surcharge`; `SiegePanelDto` z tych samych liczb, które web dostaje
 * przez `setSiegePanelMilitiaEstimator`/`setSiegePanelMilitiaRegenLeft`; `food` = web `getCityFood(city)` (wyliczone na
 * stronie WEB i przekazane portowi).
 *
 * Każda scena wykonywana w DWÓCH oknach: 1280×720 i 360×640 (deviceScaleFactor 1, animacje wyłączone przez
 * `prefers-reduced-motion` i `animations: 'disabled'`). Kroki sceny używają PRAWDZIWYCH zdarzeń przeglądarki
 * (`page.keyboard`, `page.mouse`), a stan po kroku = DOM panelu (`outerHTML` po parsowaniu), aktywny element
 * (autofokus), metryki przewijania listy, prostokąty panelu/przycisków (czy w kadrze), dziennik akcji.
 *
 * Porównanie (EXIT 0 <=> wszystkie zgodne i pokrycie spełnione):
 *   VEC   każdy krok każdej sceny: stan web === port (JSON);
 *   PIX   zrzuty PNG scen oznaczonych `shot` (merge/split 20 i 45 jednostek, picker, siege) web vs port: bajty równe;
 *   ERR   `pageerror` + `console.error` = 0 po obu stronach;
 *   COVER asercje na wynikach WEBU (harness naprawdę ćwiczy funkcje partii): „▼ jeszcze N” widoczne i znika po
 *         „przewiń”, Enter zamyka panel scaleniem, autofokus na „Połącz armie”, roving focus w split, zablokowana
 *         pozycja pickera nie wybiera, „Milicja odnawia się: za N tur/tury/turę”, brak „~”.
 * Zapis wektorów: `--out <plik.json>` (fixtura: sha256 całości wektorów WEB, sha256 każdego kroku, sha256 zrzutów PNG;
 * niezależny weryfikator = dwa osobne `git archive` → bajtowo ta sama fixtura), `--out-full` (pełne stany, ~10 MB).
 * `--kinds ai,merge,split,picker,siege` — podzbiór scen (używa `mutate-repin-ui2b.mjs`).
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-repin-ui2b.mjs --web-dir <WEB_DIR> [--src <src>] [--out <plik>] [--out-full <plik>]
 *        [--png-dir <dir>] [--kinds <lista>] [--tmp-dir <dir>] [--chromium <ścieżka>]
 * EXIT 0 <=> brak różnic; 1 <=> >= 1 różnica; 2 <=> błąd harnessu.
 */
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from './build.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const WEB_DIR = argOf('--web-dir');
if (!WEB_DIR) {
  console.error('Użycie: node tools/dom-harness/run-repin-ui2b.mjs --web-dir <katalog z gra/src origin/main> [--src <src>] [--out <plik>]');
  process.exit(2);
}
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const WEB_SRC = join(resolve(WEB_DIR), 'gra/src');
const OUT = argOf('--out');
const PNG_DIR = argOf('--png-dir');
const CHROMIUM = argOf('--chromium') ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PW_DIR = argOf('--playwright') ?? '/opt/node-tools/node_modules/playwright';
const MODULES = ['aiOwnerProgressFrame', 'armyMergePanel', 'armySplitPanel', 'unitReplacePicker', 'siegeMapPanel', 'escapeOverlayStack'];
const VIEWPORTS = [{ width: 1280, height: 720 }, { width: 360, height: 640 }];
/** `--kinds merge,split,picker,siege,ai` — podzbiór rodzajów scen (szybsze mutacje); domyślnie wszystkie. */
const KINDS = new Set((argOf('--kinds') ?? 'ai,merge,split,picker,siege').split(','));
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'repin-ui2b-'));

for (const m of MODULES) {
  for (const dir of [join(SRC, 'ui'), join(WEB_SRC, 'ui')]) {
    if (!existsSync(join(dir, m + '.ts'))) {
      console.error(`BRAK modułu ${join(dir, m + '.ts')}`);
      process.exit(2);
    }
  }
}

function writeEntry(side, srcDir) {
  const p = join(TMP, `entry-${side}.ts`);
  const imp = (m) => JSON.stringify(join(srcDir, 'ui', m));
  writeFileSync(p, [
    `import * as ai from ${imp('aiOwnerProgressFrame')};`,
    `import * as mg from ${imp('armyMergePanel')};`,
    `import * as sp from ${imp('armySplitPanel')};`,
    `import * as rp from ${imp('unitReplacePicker')};`,
    `import * as sg from ${imp('siegeMapPanel')};`,
    `import * as eo from ${imp('escapeOverlayStack')};`,
    side === 'web' ? `import { getCityFood } from ${JSON.stringify(join(srcDir, 'game', 'turn-economy'))};` : '',
    side === 'web' ? `import { categoryOf } from ${JSON.stringify(join(srcDir, 'units', 'setup'))};` : '',
    side === 'port' ? `import { installStaticCatalog } from ${JSON.stringify(join(srcDir, 'controller', 'staticCatalog'))};` : '',
    `(globalThis as any).__ui2b = { side: ${JSON.stringify(side)}, ai, mg, sp, rp, sg, eo, food: ${side === 'web' ? 'getCityFood' : 'null'},`,
    side === 'web' ? `  cat: () => categoryOf('', '', false, undefined), install: null };`
      : `  cat: null, install: (c: any) => installStaticCatalog(c) };`,
    '',
  ].join('\n'));
  return p;
}

/* ── Sceny ─────────────────────────────────────────────────────────────────────────────────────────────── */
// Krok: { k: 'open' | 'state' | 'key' | 'scroll' | 'clickSel' | 'clickXY' | 'focusSel' | 'eval', ... }.
const SCENES = [];
const shotSet = new Set([20, 45]);
for (const n of [0, 1, 3, 14, 15, 16, 20, 44, 45]) {
  const base = { kind: 'merge', n, arrivingCount: n === 20 ? 3 : undefined, hexLabel: 'A-7 <x> & „ł”', icon: n === 3 };
  SCENES.push({ id: `merge-${n}-enter`, ...base, shot: shotSet.has(n), steps: [
    { k: 'scroll', sel: '[data-sec="field"] .civ-amp-units', to: 60 },
    { k: 'scroll', sel: '[data-sec="field"] .civ-amp-units', to: 'bottom' },
    { k: 'scroll', sel: '[data-sec="field"] .civ-amp-units', to: 0 },
    { k: 'clickSel', sel: '.civ-amp-more.on', shot: n === 45 },
    { k: 'focusSel', sel: '[data-sec="field"] .civ-amp-units' },
    { k: 'key', key: 'Enter' },
  ] });
  if (n === 20 || n === 0 || n === 45) {
    SCENES.push({ id: `merge-${n}-btn-enter`, ...base, steps: [{ k: 'key', key: 'Enter' }] });
    SCENES.push({ id: `merge-${n}-sep-enter`, ...base, steps: [{ k: 'focusSel', sel: '[data-act="sep"]' }, { k: 'key', key: 'Enter' }] });
    SCENES.push({ id: `merge-${n}-escape`, ...base, steps: [{ k: 'key', key: 'Escape' }] });
    SCENES.push({ id: `merge-${n}-backdrop`, ...base, steps: [{ k: 'clickXY', x: 2, y: 2 }] });
    SCENES.push({ id: `merge-${n}-tab`, ...base, steps: [{ k: 'key', key: 'Tab' }, { k: 'key', key: 'Tab' }, { k: 'key', key: 'Shift+Tab' }, { k: 'key', key: 'Enter' }] });
  }
}
for (const n of [1, 2, 3, 15, 16, 20, 45]) {
  const dests = [{ q: 1, r: 2, label: 'Heks 1,2' }, { q: 2, r: 2, label: 'w mieście Ur <b>' }];
  const base = { kind: 'split', n, dests, hexLabel: 'B-3 & <i>' };
  SCENES.push({ id: `split-${n}-nav`, ...base, shot: shotSet.has(n), steps: [
    { k: 'key', key: 'ArrowLeft' }, { k: 'key', key: 'ArrowUp' }, { k: 'key', key: 'Space' }, { k: 'key', key: 'Home' },
    { k: 'key', key: 'ArrowDown' }, { k: 'key', key: 'ArrowRight' }, { k: 'key', key: 'End' }, { k: 'key', key: 'Space' },
    { k: 'scroll', sel: '.civ-asp-units', to: 120 }, { k: 'clickSel', sel: '.civ-asp-u:nth-child(4)' },
    { k: 'clickSel', sel: '[data-dq="2"]' }, { k: 'clickSel', sel: '[data-go]' },
  ] });
  if (n === 2 || n === 20) {
    SCENES.push({ id: `split-${n}-all`, ...base, steps: [
      { k: 'key', key: 'Home' }, { k: 'key', key: 'Space' }, { k: 'clickSel', sel: '[data-go]' }, { k: 'key', key: 'Escape' },
    ] });
    SCENES.push({ id: `split-${n}-cancel`, ...base, steps: [{ k: 'clickSel', sel: '[data-cancel]' }] });
    SCENES.push({ id: `split-${n}-backdrop`, ...base, steps: [{ k: 'clickXY', x: 2, y: 2 }] });
  }
}
SCENES.push({ id: 'split-nodest', kind: 'split', n: 5, dests: [], hexLabel: 'X', steps: [] });
const OPTS = [
  { id: 'hoplita', name: 'Hoplita', icon: '🛡', surcharge: 20, atk: 4, def: 6, hpMax: 10 },
  { id: 'legion', name: 'Legion <x>', icon: '<b>L</b>', surcharge: 80, atk: 7, def: 7, hpMax: 12 },
  { id: 'zero', name: 'Bez dopłaty', icon: '', surcharge: 0, atk: 1, def: 1, hpMax: 5 },
  { id: 'drewno', name: 'Łucznik', icon: '', surcharge: 10, atk: 3, def: 2, hpMax: 8, blockedReason: 'Brak w magazynie państwa: Drewno' },
  { id: 'drewno0', name: 'Proca', icon: '', surcharge: 0, atk: 2, def: 1, hpMax: 6, blockedReason: 'Brak w magazynie <państwa> & „Żelazo”' },
  { id: 'drogi', name: 'Katafrakt', icon: '', surcharge: 900, atk: 9, def: 8, hpMax: 14, blockedReason: 'Brak: Konie' },
  { id: 'pusty', name: 'Pusty powód', icon: '', surcharge: 5, atk: 1, def: 1, hpMax: 4, blockedReason: '' },
];
for (const [vi, v] of [{ skarb: 50, cancel: true }, { skarb: 5000 }, { skarb: 0, cancel: true }].entries()) {
  for (const [ti, target] of ['hoplita', 'legion', 'zero', 'drewno', 'drewno0', 'drogi', 'pusty'].entries()) {
    SCENES.push({ id: `picker-${vi}-${target}`, kind: 'picker', options: OPTS, skarb: v.skarb, cancel: !!v.cancel, shot: ti === 0 && vi === 0, steps: [
      { k: 'focusSel', sel: `.civ-urp-item:nth-child(${ti + 1})` }, { k: 'key', key: 'Enter' }, { k: 'key', key: ' ' },
      { k: 'clickSel', sel: `.civ-urp-item:nth-child(${ti + 1})` }, { k: 'key', key: 'Escape' },
    ] });
  }
}
SCENES.push({ id: 'picker-empty', kind: 'picker', options: [], skarb: 0, cancel: true, steps: [{ k: 'clickXY', x: 2, y: 2 }] });
const REGENS = [undefined, 0, 1, 2, 3, 4, 5, 11, 12, 13, 14, 15, 21, 22, 24, 25, 102, 112, 114, 122, -3, 2.5];
let si = 0;
for (const regen of REGENS) {
  for (const est of [0, 3, -2]) {
    for (const [garnizon, owner] of [[0, 0], [40, 2]]) {
      si++;
      SCENES.push({ id: `siege-r${regen}-e${est}-g${garnizon}`, kind: 'siege', regen, est, owner, shot: (regen === 5 && est === 0 && garnizon === 0),
        city: { id: 'c' + si, name: 'Sparta <x>', ownerId: 1, q: 3, r: 4, population: 12, garnizon, maMur: garnizon > 0, magazynZywnosci: 7 + (si % 5), siegeCapitulationPending: si % 7 === 0, siegeMachines: { queue: si % 2 ? ['taran'] : [], ready: si % 3 ? [] : ['wieza'], buildProgress: (si % 4) * 0.35 } },
        steps: si % 9 === 0 ? [{ k: 'key', key: '2' }, { k: 'key', key: '3' }, { k: 'key', key: 'Enter' }, { k: 'key', key: '1' }, { k: 'update' }, { k: 'key', key: 'Escape' }] : [{ k: 'update' }] });
    }
  }
}

/* ── Kod strony ───────────────────────────────────────────────────────────────────────────────────────── */
const LIB = () => {
  const U = globalThis.__ui2b;
  const log = [];
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') U.eo.handleEscapeKeydown(e); });
  const act = (n) => (...a) => log.push(n + JSON.stringify(a));
  const NAMES = ['Wojownik', 'Łucznik <b>', 'Hoplita & co', 'Jeździec', 'Katapulta z bardzo długą nazwą jednostki', 'Włócznik'];
  const units = (n, icon) => Array.from({ length: n }, (_, i) => ({
    id: 'u' + i, name: NAMES[i % NAMES.length] + ' ' + (i + 1), ...(icon && i % 2 === 0 ? { icon: '🛡' } : {}),
    ...(i % 4 === 3 ? {} : { ruchLeft: ((i * 7) % 5) / 2, ruchMax: 2 + (i % 3) }),
  }));
  const r2 = (v) => Math.round(v * 100) / 100;
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [r.left, r.top, r.width, r.height].map(r2).join(',');
  };
  const desc = (el) => {
    if (!el || el === document.body || el === document.documentElement) return 'body';
    return el.tagName + ['data-act', 'data-uid', 'data-dq', 'data-go', 'data-cancel', 'class', 'tabindex'].map((a) => (el.hasAttribute(a) ? `[${a}=${el.getAttribute(a)}]` : '')).join('');
  };
  let cur = null;
  const H = {
    log,
    open(sc) {
      cur = sc;
      log.length = 0;
      if (sc.kind === 'merge') {
        const all = units(sc.n + 1, sc.icon);
        U.mg.showArmyMergePanel({ hexLabel: sc.hexLabel, existing: all.slice(0, sc.n), arriving: all[sc.n], arrivingCount: sc.arrivingCount, onMerge: act('onMerge'), onSeparate: act('onSeparate') });
      } else if (sc.kind === 'split') {
        U.sp.showArmySplitPanel({ hexLabel: sc.hexLabel, units: units(sc.n, false), destHexes: sc.dests, onSplit: act('onSplit'), onCancel: act('onCancel') });
      } else if (sc.kind === 'picker') {
        const options = U.side === 'web' ? sc.options : sc.options.map((o) => ({ ...o, affordable: sc.skarb >= o.surcharge }));
        U.rp.showUnitReplacePicker({ unitName: 'Wojownik & <co>', options, skarb: sc.skarb, onPick: act('onPick'), onCancel: sc.cancel ? act('onCancel') : undefined });
      } else if (sc.kind === 'siege') {
        const ctx = { tryb: 'oblezenie', city: sc.city, atakujacy: { id: 'a1', typeId: 'Hoplita <h>', ownerId: sc.owner }, garnizonUnit: null, oblegajacyOwnerId: sc.owner };
        const acts = { onBesiege: act('onBesiege'), onStorm: (c) => log.push('onStorm' + JSON.stringify([c.city.id])), onRetreat: act('onRetreat'), onQueueMachine: act('onQueueMachine') };
        if (U.side === 'web') {
          U.sg.setSiegePanelMilitiaEstimator(() => sc.est);
          U.sg.setSiegePanelMilitiaRegenLeft(sc.regen === undefined ? null : () => sc.regen);
          U.sg.showSiegeMapPanel(ctx, acts, 3);
        } else {
          U.sg.showSiegeMapPanel(H.siegeDto(ctx, sc), acts, 3);
        }
        U.sg.setSiegePanelBesiegerCount(4);
      }
    },
    /** „Rust”: SiegePanelDto z tych samych liczb co web (wzory pinu dla zużycia/atrycji, `food` z web getCityFood). */
    siegeDto(ctx, sc) {
      const city = ctx.city;
      const garnizon = city.garnizon ?? 0;
      return {
        ctx,
        city: { id: 0, owner: city.ownerId, q: city.q, r: city.r, name: city.name, mapLabel: city.name, population: city.population, isCapital: false, isMine: false },
        food: sc.food,
        garnizon,
        zuzycie: city.population + garnizon,
        atrycjaNext: garnizon > 0 ? Math.max(1, Math.floor(garnizon * 0.08)) : 0,
        milicjaEst: Math.max(0, sc.est),
        ...(sc.regen === undefined ? {} : { milicjaRegen: sc.regen }),
        playerCanStorm: ctx.oblegajacyOwnerId === 0,
        machines: city.siegeMachines,
      };
    },
    update() {
      const sc = cur;
      const city = { ...sc.city, population: sc.city.population - 1, garnizon: (sc.city.garnizon ?? 0) + 1 };
      const sc2 = { ...sc, city, regen: sc.regen === undefined ? undefined : Math.max(0, sc.regen - 1), est: sc.est + 1, food: sc.food2 };
      if (U.side === 'web') {
        U.sg.setSiegePanelMilitiaEstimator(() => sc2.est);
        U.sg.setSiegePanelMilitiaRegenLeft(sc2.regen === undefined ? null : () => sc2.regen);
        U.sg.updateSiegeMapPanelTurn(4, city);
      } else {
        const ctx = { tryb: 'oblezenie', city, atakujacy: { id: 'a1', typeId: 'Hoplita <h>', ownerId: sc.owner }, garnizonUnit: null, oblegajacyOwnerId: sc.owner };
        U.sg.updateSiegeMapPanelTurn(4, H.siegeDto(ctx, sc2));
      }
    },
    close() {
      U.mg.hideArmyMergePanel(); U.sp.hideArmySplitPanel(); U.rp.hideUnitReplacePicker(); U.sg.hideSiegeMapPanel();
      if (U.sg.setSiegePanelMilitiaEstimator) U.sg.setSiegePanelMilitiaEstimator(null);
      if (U.sg.setSiegePanelMilitiaRegenLeft) U.sg.setSiegePanelMilitiaRegenLeft(null);
    },
    state() {
      const sc = cur;
      const st = { open: null, html: null, active: desc(document.activeElement), log: log.join(' | '), vw: innerWidth + 'x' + innerHeight };
      if (sc.kind === 'merge') {
        const ov = document.querySelector('.civ-amp-overlay');
        st.open = U.mg.isArmyMergePanelOpen();
        st.html = ov ? ov.outerHTML : null;
        st.parent = ov ? ov.parentElement.tagName : null;
        const g = document.querySelector('[data-sec="field"] .civ-amp-units');
        if (g) st.grid = { sh: g.scrollHeight, ch: g.clientHeight, st: r2(g.scrollTop), cols: getComputedStyle(g).gridTemplateColumns.split(' ').length };
        const box = document.querySelector('.civ-amp');
        st.rects = [box, document.querySelector('[data-act="merge"]'), document.querySelector('[data-act="sep"]'), document.querySelector('.civ-amp-sum'), document.querySelector('.civ-amp-more')].map(rect);
      } else if (sc.kind === 'split') {
        const ov = document.querySelector('.civ-asp-overlay');
        st.open = U.sp.isArmySplitPanelOpen();
        st.html = ov ? ov.outerHTML : null;
        const l = document.querySelector('.civ-asp-units');
        if (l) st.grid = { sh: l.scrollHeight, ch: l.clientHeight, st: r2(l.scrollTop), cols: getComputedStyle(l).gridTemplateColumns.split(' ').length };
        st.checked = [...document.querySelectorAll('.civ-asp-units input')].map((i) => (i.checked ? 1 : 0)).join('');
        st.rects = [document.querySelector('.civ-asp'), document.querySelector('[data-go]'), document.querySelector('[data-cancel]')].map(rect);
      } else if (sc.kind === 'picker') {
        const ov = document.querySelector('.civ-urp-overlay');
        st.open = U.rp.isUnitReplacePickerOpen();
        st.html = ov ? ov.outerHTML : null;
        st.rects = [document.querySelector('.civ-urp')].map(rect);
      } else if (sc.kind === 'siege') {
        const ov = document.getElementById('civ-siege-map-panel');
        st.open = U.sg.isSiegeMapPanelOpen();
        st.html = ov ? ov.outerHTML : null;
        st.cityId = U.sg.getActiveSiegeCityId();
      }
      return JSON.stringify(st);
    },
    ai() {
      const out = [];
      for (let oc = -1; oc <= 13; oc++) for (let s = -2; s <= 14; s++) for (let oi = -2; oi <= 15; oi++) out.push(U.ai.shouldYieldAiOwnerProgressFrame(oi, oc, s) ? 1 : 0);
      for (const [oi, oc, s] of [[50, 100, 0], [99, 100, 0], [98, 100, 2], [0, 1, 0], [1, 1, 0], [0.5, 3, 0], [3.0000001, 10, 0], [NaN, 5, 0], [2, NaN, 0], [2, 5, NaN], [Infinity, Infinity, 0], [2 ** 53, 2 ** 53 + 2, 0]]) {
        out.push(U.ai.shouldYieldAiOwnerProgressFrame(oi, oc, s) ? 1 : 0);
      }
      return out.join('');
    },
  };
  globalThis.__h = H;
};

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
function serve(dir) {
  return new Promise((ok) => {
    const srv = createServer((req, res) => {
      const p = join(dir, decodeURIComponent((req.url ?? '/').split('?')[0]));
      if (!p.startsWith(dir) || !existsSync(p)) {
        if (process.env.UI2B_DEBUG) console.error('404', p);
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }).end(readFileSync(p));
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}

/**
 * Ustalenie stanu po kroku: kończy animacje CSS (`getAnimations().finish()` — prostokąty nie zależą od chwili pomiaru)
 * i czeka, aż przewinięcia wszystkich elementów będą stałe przez 3 kolejne klatki (maks. 60 klatek).
 */
const raf2 = (page) => page.evaluate(() => new Promise((res) => {
  let last = '';
  let same = 0;
  let n = 0;
  const tick = () => {
    for (const a of document.getAnimations()) {
      try { a.finish(); } catch { /* animacja nieskończona */ }
    }
    const sig = [...document.querySelectorAll('*')].filter((e) => e.scrollTop || e.scrollLeft).map((e) => e.scrollTop + ':' + e.scrollLeft).join(',') + '|' + scrollY;
    if (sig === last) same++;
    else { same = 0; last = sig; }
    if (same >= 3 || ++n > 60) res();
    else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}));

/**
 * Zrzut ustalony: Chromium wygasza/odrysowuje nakładkowy pasek przewijania z opóźnieniem po przewinięciu (zmierzone:
 * 7 px kciuka paska listy `.civ-amp-units` różniło się między przebiegami). Zrzut powtarzany co 250 ms, aż dwa kolejne
 * są bajtowo równe (maks. 8 prób) — porównanie web/port dotyczy stanu ustalonego, nie chwili wygaszania.
 * Kciuk paska jest rysowany przez przeglądarkę poza DOM i bywał różny także przy ustalonym zrzucie (7 px, ten sam DOM i
 * ten sam scrollTop po obu stronach) — na czas zrzutu `scrollbar-color: transparent` (kolor, nie układ: szerokości
 * i pozycje bez zmian). Reguła `scrollbar-color` paneli jest w CSS kopii bajtowych (porównywane bajtowo przez manifest).
 */
const SHOT_STYLE = '*{scrollbar-color:transparent transparent !important}';
async function stableShot(page) {
  let prev = await page.screenshot({ animations: 'disabled', style: SHOT_STYLE });
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(250);
    const cur = await page.screenshot({ animations: 'disabled', style: SHOT_STYLE });
    if (Buffer.compare(prev, cur) === 0) return cur;
    prev = cur;
  }
  return prev;
}

async function runSide(browser, side, dir, foods, errs, shots) {
  const srv = await serve(dir);
  const vec = {};
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      page.on('pageerror', (e) => errs.push(`${side}: ${e.message}`));
      page.on('console', (m) => { if (m.type() === 'error') errs.push(`${side}: ${m.text()}`); });
      await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
      try {
        await page.waitForFunction(() => globalThis.__ui2b !== undefined, null, { timeout: 60000 });
      } catch (e) {
        throw new Error(`${side}: moduły nie załadowane (${errs.join(' | ') || e.message})`);
      }
      // Port: `unitIconSvg(undefined)` czyta kategorię z katalogu („Rust”); wartość = web `categoryOf('', '', false)`.
      if (side === 'web') foods.set('__cat', await page.evaluate(() => globalThis.__ui2b.cat()));
      else {
        await page.evaluate((cat) => globalThis.__ui2b.install({ contentHash: 'harness-ui2b', unitCategory: {}, unitCategoryNameOnly: { '': cat } }), foods.get('__cat'));
      }
      await page.evaluate(LIB);
      const vk = `${vp.width}x${vp.height}`;
      if (KINDS.has('ai')) vec[`ai@${vk}`] = [await page.evaluate(() => globalThis.__h.ai())];
      if (side === 'web' && !foods.has('siege-done')) {
        foods.set('siege-done', true);
        for (const sc of SCENES.filter((s) => s.kind === 'siege' && KINDS.has('siege'))) {
          const f = await page.evaluate(([c]) => [globalThis.__ui2b.food(c), globalThis.__ui2b.food({ ...c, population: c.population - 1, garnizon: (c.garnizon ?? 0) + 1 })], [sc.city]);
          foods.set(sc.id, f);
        }
      }
      for (const sc0 of SCENES.filter((x) => KINDS.has(x.kind))) {
        const sc = sc0.kind === 'siege' ? { ...sc0, food: foods.get(sc0.id)[0], food2: foods.get(sc0.id)[1] } : sc0;
        const states = [];
        await page.evaluate((s) => globalThis.__h.open(s), sc);
        await raf2(page);
        states.push(await page.evaluate(() => globalThis.__h.state()));
        if (sc.shot) shots.push({ side, key: `${sc.id}@${vk}`, png: await stableShot(page) });
        for (const st of sc.steps) {
          if (st.k === 'key') await page.keyboard.press(st.key);
          else if (st.k === 'scroll') {
            await page.evaluate(([sel, to]) => {
              const el = document.querySelector(sel);
              if (el) el.scrollTop = to === 'bottom' ? el.scrollHeight : to;
            }, [st.sel, st.to]);
          } else if (st.k === 'clickSel') {
            const ok = await page.evaluate((sel) => {
              const el = document.querySelector(sel);
              if (!el) return false;
              el.scrollIntoView({ block: 'nearest' });
              return true;
            }, st.sel);
            if (ok) await page.click(st.sel, { timeout: 5000 }).catch(() => page.evaluate((sel) => document.querySelector(sel)?.click(), st.sel));
          } else if (st.k === 'clickXY') await page.mouse.click(st.x, st.y);
          else if (st.k === 'focusSel') await page.evaluate((sel) => document.querySelector(sel)?.focus(), st.sel);
          else if (st.k === 'update') await page.evaluate(() => globalThis.__h.update());
          await raf2(page);
          states.push(await page.evaluate(() => globalThis.__h.state()));
          if (st.shot) shots.push({ side, key: `${sc.id}+${st.k}@${vk}`, png: await stableShot(page) });
        }
        await page.evaluate(() => globalThis.__h.close());
        vec[`${sc.id}@${vk}`] = states;
      }
      await page.close();
    }
  } finally {
    srv.close();
  }
  return vec;
}

/** Asercje pokrycia na wektorach WEBU (harness naprawdę ćwiczy funkcje partii). */
function coverage(vec) {
  const P = (k, i) => JSON.parse(vec[k][i]);
  const checks = [];
  // Asercja liczona tylko dla scen włączonych filtrem `--kinds` (nazwa zaczyna się od rodzaju sceny).
  const c = (name, fn) => {
    if (!KINDS.has(name.split(/[\d@ ]/)[0])) return;
    let ok = false;
    try { ok = !!fn(); } catch { ok = false; }
    checks.push([name, ok]);
  };
  for (const vk of ['1280x720', '360x640']) {
    const m45 = (vec[`merge-45-enter@${vk}`] ?? []).map((s) => JSON.parse(s));
    c(`merge45@${vk} autofokus Połącz`, () => m45[0].active.includes('[data-act=merge]'));
    c(`merge45@${vk} licznik`, () => m45[0].html.includes('Na polu: <b>45</b> · Dołącza: <b>1</b> · Razem: <b>46</b>'));
    c(`merge45@${vk} „▼ jeszcze N” widoczne`, () => /civ-amp-more on"[^>]*>▼ jeszcze \d+ jednost/.test(m45[0].html));
    c(`merge45@${vk} po „przewiń” wskaźnik znika`, () => !m45[4].html.includes('civ-amp-more on'));
    c(`merge45@${vk} montaż w <html>`, () => m45[0].parent === 'HTML');
    c(`merge45@${vk} Enter na liście = Połącz + zamknięcie`, () => m45[6].log === 'onMerge[]' && m45[6].open === false);
    c(`merge45@${vk} przewijanie zmienia scrollTop`, () => m45[1].grid.st > 0 && m45[3].grid.st === 0);
    c(`merge3@${vk} brak wskaźnika`, () => !P(`merge-3-enter@${vk}`, 0).html.includes('civ-amp-more on'));
    c(`merge20@${vk} Dołącza 3`, () => P(`merge-20-enter@${vk}`, 0).html.includes('Dołącza: <b>3</b> · Razem: <b>23</b>'));
    c(`merge20@${vk} Enter na przycisku = 1×Połącz`, () => P(`merge-20-btn-enter@${vk}`, 1).log === 'onMerge[]');
    c(`merge20@${vk} Enter na „Zostaw osobno”`, () => P(`merge-20-sep-enter@${vk}`, 2).log === 'onSeparate[]');
    c(`merge20@${vk} Escape = Połącz`, () => P(`merge-20-escape@${vk}`, 1).log === 'onMerge[]');
    c(`merge0@${vk} „—”`, () => P(`merge-0-enter@${vk}`, 0).html.includes('Na polu (0)'));
    const s45 = (vec[`split-45-nav@${vk}`] ?? []).map((s) => JSON.parse(s));
    c(`split45@${vk} autofokus ostatnia`, () => s45[0].active.includes('[data-uid=u44]'));
    c(`split45@${vk} siatka przewijana`, () => s45[0].grid.sh > s45[0].grid.ch);
    c(`split45@${vk} Home → u0`, () => s45[4].active.includes('[data-uid=u0]'));
    c(`split45@${vk} onSplit`, () => s45[12].log.startsWith('onSplit[') && s45[12].open === false);
    c(`split2@${vk} wszystkie zaznaczone blokują`, () => P(`split-2-all@${vk}`, 3).open === true && P(`split-2-all@${vk}`, 3).html.includes('musi zostać co najmniej 1'));
    c(`split1@${vk} nie otwiera`, () => P(`split-1-nav@${vk}`, 0).open === false);
  }
  c('merge15@1280 (5 rzędów × 3) bez wskaźnika', () => !JSON.parse(vec['merge-15-enter@1280x720'][0]).html.includes('civ-amp-more on'));
  c('merge16@1280 wskaźnik „jeszcze 1 jednostka”', () => JSON.parse(vec['merge-16-enter@1280x720'][0]).html.includes('▼ jeszcze 1 jednostka<'));
  c('merge14@360 (2 kolumny) wskaźnik', () => JSON.parse(vec['merge-14-enter@360x640'][0]).html.includes('civ-amp-more on'));
  c('split45@360 siatka 2 kolumny', () => JSON.parse(vec['split-45-nav@360x640'][0]).grid.cols === 2);
  c('split45@1280 siatka 3 kolumny', () => JSON.parse(vec['split-45-nav@1280x720'][0]).grid.cols === 3);
  c('merge45@1280 siatka 3 kolumny', () => JSON.parse(vec['merge-45-enter@1280x720'][0]).grid.cols === 3);
  const pk = (id, i) => JSON.parse(vec[`picker-0-${id}@1280x720`][i]);
  c('picker zablokowana: brak wyboru', () => !pk('drewno', 4).log.includes('onPick') && pk('drewno', 0).html.includes('Brak w magazynie państwa: Drewno'));
  c('picker zablokowana bez dopłaty: brak wyboru', () => !pk('drewno0', 4).log.includes('onPick'));
  c('picker dostępna: Enter wybiera', () => pk('hoplita', 2).log === 'onPick["hoplita"]');
  c('picker za drogo: brak wyboru', () => !pk('legion', 4).log.includes('onPick'));
  const sg = (r, e, g) => JSON.parse(vec[`siege-r${r}-e${e}-g${g}@1280x720`][0]).html;
  c('siege brak „~”', () => sg(undefined, 3, 40).includes('Milicja przy szturmie: <b>3</b>') && !sg(undefined, 3, 40).includes('~'));
  c('siege odnowa 1 turę', () => sg(1, 0, 0).includes('Milicja odnawia się: za <b>1</b> turę'));
  c('siege odnowa 2/22 tury', () => sg(2, 0, 0).includes('za <b>2</b> tury') && sg(22, 0, 0).includes('za <b>22</b> tury'));
  c('siege odnowa 5/12/112 tur', () => sg(5, 0, 0).includes('za <b>5</b> tur<') && sg(12, 0, 0).includes('za <b>12</b> tur<') && sg(112, 0, 0).includes('za <b>112</b> tur<'));
  c('siege Milicja ma pierwszeństwo przed odnową', () => sg(5, 3, 0).includes('Milicja przy szturmie') && !sg(5, 3, 0).includes('odnawia'));
  c('siege 0/brak/ujemna = brak wiersza', () => !sg(0, 0, 0).includes('Milicja') && !sg(undefined, 0, 0).includes('Milicja') && !sg(-3, -2, 0).includes('Milicja'));
  const ai = (vec["ai@1280x720"] ?? [""])[0];
  c('ai wektor niejednorodny', () => ai.includes('0') && ai.includes('1'));
  return checks;
}

let exitCode = 0;
let browser = null;
try {
  const sides = {};
  for (const [side, srcDir] of [['web', WEB_SRC], ['port', SRC]]) {
    const outdir = join(TMP, side);
    const pad = join(TMP, `pad-${side}.ts`);
    writeFileSync(pad, 'export {};\n');
    await bundle([writeEntry(side, srcDir), pad], outdir);
    const entryJs = readdirSync(outdir, { recursive: true }).map(String).find((f) => f.split('/').pop() === `entry-${side}.js`);
    if (!entryJs) throw new Error(`${side}: brak entry-${side}.js w ${outdir}`);
    writeFileSync(join(outdir, 'index.html'), `<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,"><body style="margin:0;background:#20283a;font:14px sans-serif"><div id="map" style="width:100%;height:100vh"></div><script type="module" src="./${entryJs}"></script>`);
    sides[side] = outdir;
  }
  const require = createRequire(join(PW_DIR, 'package.json'));
  const { chromium } = require(PW_DIR);
  browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--font-render-hinting=none', '--disable-gpu'] });
  const errs = [];
  const shots = [];
  const foods = new Map();
  const web = await runSide(browser, 'web', sides.web, foods, errs, shots);
  const port = await runSide(browser, 'port', sides.port, foods, errs, shots);
  const ua = await (async () => { const p = await browser.newPage(); const u = await p.evaluate(() => navigator.userAgent); await p.close(); return u; })();
  let diffs = 0;
  const groups = new Map();
  for (const key of Object.keys(web)) {
    const w = web[key];
    const p = port[key] ?? [];
    const g = key.split('@')[0].split('-')[0];
    const gr = groups.get(g) ?? { scenes: 0, steps: 0, diffs: 0, first: '' };
    gr.scenes++;
    for (let i = 0; i < Math.max(w.length, p.length); i++) {
      gr.steps++;
      if (w[i] !== p[i]) {
        gr.diffs++;
        diffs++;
        if (!gr.first) {
          let j = 0;
          const a = w[i] ?? '';
          const b = p[i] ?? '';
          while (j < a.length && a[j] === b[j]) j++;
          gr.first = `${key}#${i} @${j} web=…${a.slice(Math.max(0, j - 60), j + 100)} port=…${b.slice(Math.max(0, j - 60), j + 100)}`;
        }
      }
    }
    groups.set(g, gr);
  }
  for (const [g, gr] of groups) console.log(`${g.padEnd(8)} scen=${String(gr.scenes).padStart(4)} kroków=${String(gr.steps).padStart(5)} różnic=${gr.diffs}${gr.first ? ' PIERWSZA ' + gr.first : ''}`);
  const webShots = shots.filter((s) => s.side === 'web');
  let pixDiff = 0;
  for (const ws of webShots) {
    const ps = shots.find((s) => s.side === 'port' && s.key === ws.key);
    const eq = !!ps && Buffer.compare(ws.png, ps.png) === 0;
    if (!eq) pixDiff++;
    console.log(`PIX ${ws.key.padEnd(34)} ${eq ? 'identyczny' : 'RÓŻNY'} (PNG ${ws.png.length} B, sha256 ${createHash('sha256').update(ws.png).digest('hex').slice(0, 16)}…)`);
    if (PNG_DIR) {
      mkdirSync(PNG_DIR, { recursive: true });
      writeFileSync(join(PNG_DIR, `web-${ws.key.replace(/[^\w.-]+/g, '_')}.png`), ws.png);
      if (ps) writeFileSync(join(PNG_DIR, `port-${ws.key.replace(/[^\w.-]+/g, '_')}.png`), ps.png);
    }
  }
  diffs += pixDiff;
  const checks = coverage(web);
  const coverFail = checks.filter(([, ok]) => !ok);
  for (const [n] of coverFail) console.log(`COVER-FAIL ${n}`);
  diffs += coverFail.length;
  if (errs.length) {
    console.log('pageerror/console.error:', errs.slice(0, 10).join(' | '));
    diffs += errs.length;
  }
  console.log(`Chromium: ${ua}`);
  const webHash = createHash('sha256').update(JSON.stringify(web)).digest('hex');
  if (OUT && KINDS.size < 5) throw new Error('--out wymaga pełnego zestawu scen (bez --kinds)');
  // Fixtura: pełne stany kroków mają ~10,6 MB (outerHTML paneli × 2 okna) — zapisujemy sha256 (16 hex) KAŻDEGO kroku
  // + hash całości + sha256 zrzutów PNG webu; pełne wektory: `--out-full <plik>` (poza repo).
  const h16 = (x) => createHash('sha256').update(x).digest('hex').slice(0, 16);
  if (OUT) {
    const steps = Object.fromEntries(Object.entries(web).map(([k, v]) => [k, v.map(h16)]));
    const png = Object.fromEntries(webShots.map((s) => [s.key, createHash('sha256').update(s.png).digest('hex')]));
    writeFileSync(OUT, JSON.stringify({ topic: 'R-RUSTPORT-REPIN-UI-2-B-Q1', source: 'web origin/main 86d510c66 (Chromium 141, git archive gra/src gra/data)', webVectorsSha256: webHash, viewports: VIEWPORTS, pngSha256: png, stepSha256_16: steps }, null, 0).replace(/\],"/g, '],\n"') + '\n');
  }
  if (argOf('--out-full')) writeFileSync(argOf('--out-full'), JSON.stringify({ webVectorsSha256: webHash, vectors: web }) + '\n');
  const steps = [...groups.values()].reduce((a, g) => a + g.steps, 0);
  console.log(`run-repin-ui2b: scen=${SCENES.length}×${VIEWPORTS.length} kroków=${steps} zrzutów=${webShots.length} PIX_różnych=${pixDiff} asercji_pokrycia=${checks.length - coverFail.length}/${checks.length} błędów_strony=${errs.length} różnic=${diffs} webVectorsSha256=${webHash}`);
  exitCode = diffs === 0 ? 0 : 1;
} catch (e) {
  console.error('BŁĄD harnessu:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  if (browser) await browser.close();
  rmSync(TMP, { recursive: true, force: true });
}
process.exitCode = exitCode;
