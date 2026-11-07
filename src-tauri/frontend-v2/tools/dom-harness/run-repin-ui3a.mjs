#!/usr/bin/env node
/**
 * run-repin-ui3a.mjs — harness partii REPIN UI-3-A (R-RUSTPORT-REPIN-WEB-UI-3-Q1, runda 1).
 *
 * Moduły partii (web `origin/main` `9b019a7d8`, `tools/repin-ui3-manifest.json`):
 *   armyStackLabel.ts        ADAPTER (lokalne kopie `isNonCombatTypeName`/`sortNonCombatLast`/`CIVILIAN_TYPE_IDS`)
 *   armyMergePanel.ts        kopia bajtowa (etykieta „Generał — typ”, klasa `cmd`, generałowie pierwsi, zwiadowca ostatni)
 *   armyMergePickPanel.ts    kopia bajtowa (j.w. + `title`/`aria-label`)
 *   armySplitPanel.ts        kopia bajtowa (j.w.)
 *   gamePauseMenu.ts         kopia bajtowa (przełącznik „Automatyzacja budowy”, domyślnie WYŁ.)
 *   hudChip6c.ts             kopia bajtowa (`shortage`, układ komórki `net`/`rateTone`/`netTone`, `netHint`, `formatGrossNet`)
 *   sidePanelEventTabs.ts    kopia bajtowa (NOWY: klasyfikacja wpisów do zakładek Dyplomacja/Ważne/Inne)
 *   sidePanelEventFilter.ts  kopia bajtowa (filtry wg zakładki)
 *   sidePanelHud.ts          kopia bajtowa (3 zakładki z licznikami, „Zamknij wszystkie informacyjne” nad zakładkami)
 *   empireRecruitPanel.ts    kopia bajtowa (NOWY: „Rekrutacja — cała cywilizacja”)
 *   icons/brand/*            kopia bajtowa (`building-icon-map.json` + `bld-emporion.svg`)
 *   worldOverlayLayer.ts     kopia bajtowa (NOWY: `WORLD_OVERLAY_Z_INDEX`, warstwa nakładek świata pod UI)
 *
 * WEB:  `git archive 9b019a7d8 gra/src gra/data` (`--web-dir`), moduły spakowane `build.mjs`, wykonane w Chromium
 *       (Playwright `/opt/node-tools`, `/opt/pw-browsers/chromium-1194`), serwowane po HTTP z localhost.
 * PORT: `src/ui/**` frontend-v2 (`--src`), ten sam `build.mjs`, ta sama instancja Chromium.
 * Każda scena w dwóch oknach 1280×720 i 360×640 (deviceScaleFactor 1, `reducedMotion`), PRAWDZIWE zdarzenia przeglądarki.
 *
 * Porównanie (EXIT 0 <=> wszystko zgodne):
 *   VEC   każdy krok każdej sceny i każdy wektor funkcji: web === port (JSON);
 *   PIX   zrzuty PNG scen `shot` web vs port: bajty równe;
 *   ERR   `pageerror` + `console.error` = 0 po obu stronach;
 *   COVER asercje na wynikach WEBU (harness naprawdę ćwiczy nowe funkcje).
 * `--out <plik>`: fixtura (sha256 całości wektorów WEB, sha256 każdego kroku, sha256 PNG). `--kinds` podzbiór
 * (label,merge,pick,split,pause,chip,tabs,side,recruit,icon). `--png-dir` zapis zrzutów.
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-repin-ui3a.mjs --web-dir <WEB3_DIR> [--src <src>] [--out <plik>] [--png-dir <dir>] [--kinds <lista>]
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
  console.error('Użycie: node tools/dom-harness/run-repin-ui3a.mjs --web-dir <katalog z gra/src 9b019a7d8> [--src <src>] [--out <plik>]');
  process.exit(2);
}
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const WEB_SRC = join(resolve(WEB_DIR), 'gra/src');
const OUT = argOf('--out');
const PNG_DIR = argOf('--png-dir');
const CHROMIUM = argOf('--chromium') ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PW_DIR = argOf('--playwright') ?? '/opt/node-tools/node_modules/playwright';
const ALL_KINDS = 'label,merge,pick,split,pause,chip,tabs,side,recruit,icon';
const KINDS = new Set((argOf('--kinds') ?? ALL_KINDS).split(','));
const MODULES = ['armyStackLabel', 'armyMergePanel', 'armyMergePickPanel', 'armySplitPanel', 'gamePauseMenu', 'hudChip6c',
  'sidePanelEventTabs', 'sidePanelEventFilter', 'sidePanelHud', 'empireRecruitPanel', 'escapeOverlayStack', 'icons/brandAssets', 'worldOverlayLayer'];
const VIEWPORTS = [{ width: 1280, height: 720 }, { width: 360, height: 640 }];
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'repin-ui3a-'));

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
  const names = ['lb', 'mg', 'pk', 'sp', 'pm', 'ch', 'tb', 'fl', 'sh', 'er', 'eo', 'ba', 'wo'];
  writeFileSync(p, [
    ...MODULES.map((m, i) => `import * as ${names[i]} from ${imp(m)};`),
    side === 'web' ? `import { categoryOf } from ${JSON.stringify(join(srcDir, 'units', 'setup'))};` : '',
    side === 'port' ? `import { installStaticCatalog } from ${JSON.stringify(join(srcDir, 'controller', 'staticCatalog'))};` : '',
    `(globalThis as any).__ui3 = { side: ${JSON.stringify(side)}, ${names.join(', ')},`,
    side === 'web' ? `  cat: () => categoryOf('', '', false, undefined), install: null };`
      : `  cat: null, install: (c: any) => installStaticCatalog(c) };`,
    '',
  ].join('\n'));
  return p;
}

/* ── Sceny ─────────────────────────────────────────────────────────────────────────────────────────────── */
// Jednostki: generał/wódz w różnych miejscach listy, cywile (Zwiadowca/Osadnik/Robotnik) w środku — kolejność po sortowaniu.
const UNIT_SETS = {
  plain: [['u0', 'Wojownik'], ['u1', 'Łucznik <b>'], ['u2', 'Hoplita & co']],
  gen: [['u0', 'Wojownik'], ['u1', 'Zwiadowca'], ['u2', 'Hoplita', 'Generał'], ['u3', 'Łucznik'], ['u4', 'Wojownik', 'Wódz']],
  civ: [['u0', 'Osadnik'], ['u1', 'Robotnik'], ['u2', 'Zwiadowca'], ['u3', 'Włócznik'], ['u4', 'Zwiadowca '], ['u5', 'zwiadowca']],
  allcmd: [['u0', 'Wojownik', 'Wódz'], ['u1', 'Zwiadowca', 'Generał'], ['u2', 'Katapulta z bardzo długą nazwą jednostki', 'Generał']],
  big: Array.from({ length: 20 }, (_, i) => ['u' + i, ['Wojownik', 'Zwiadowca', 'Łucznik', 'Osadnik', 'Hoplita'][i % 5], i === 7 ? 'Generał' : i === 13 ? 'Wódz' : undefined]),
};
const SCENES = [];
for (const [set, list] of Object.entries(UNIT_SETS)) {
  const shot = set === 'gen' || set === 'big';
  SCENES.push({ id: `merge-${set}`, kind: 'merge', set, shot, steps: [{ k: 'key', key: 'Enter' }] });
  SCENES.push({ id: `pick-${set}`, kind: 'pick', set, shot, steps: [
    { k: 'clickSel', sel: '.civ-ampk-u:nth-child(1) input' }, { k: 'clickSel', sel: '.civ-ampk-target:nth-child(2)' }, { k: 'clickSel', sel: '[data-go]' },
  ] });
  SCENES.push({ id: `split-${set}`, kind: 'split', set, shot, steps: [
    { k: 'clickSel', sel: '.civ-asp-u:nth-child(1)' }, { k: 'key', key: 'Home' }, { k: 'key', key: 'End' }, { k: 'clickSel', sel: '[data-go]' },
  ] });
  if (list.length === 0) throw new Error('pusty zestaw');
}
for (const [vi, v] of [{ toggle: false }, { toggle: true, now: false }, { toggle: true, now: true }, { toggle: true }].entries()) {
  SCENES.push({ id: `pause-${vi}`, kind: 'pause', ...v, shot: vi === 1, steps: [
    { k: 'clickSel', sel: '[data-act="autobuild-toggle"]' }, { k: 'clickSel', sel: '[data-act="autobuild-toggle"]' }, { k: 'clickSel', sel: '[data-act="autobuild-toggle"]' }, { k: 'key', key: 'Escape' },
  ] });
}
// Wpisy panelu WYDARZENIA (zestawy do sceny `side`).
const EV = (id, title, kind, extra = {}) => ({ id, icon: id.endsWith('1') ? '⚔' : '', title, kind, ...extra });
const EVENT_SETS = {
  mix: [
    EV('e1', 'Dyplomacja: Rzym proponuje pokój', 'info'),
    EV('e2', 'Wróg u bram <Sparta>', 'enemy'),
    EV('e3', 'Badanie ukończone', 'science', { subtitle: 'Brąz' }),
    EV('e4', 'Egipt handluje z Persją', 'info', { origin: 'other-civs' }),
    EV('e5', 'Brak środków na utrzymanie', 'city', { negative: true }),
    EV('e6', 'Decyzja: bunt w Atenach', 'city', { blocking: true, subtitle: 'Wybierz' }),
    EV('e7', 'Nowe miasto: Ur', 'city'),
    EV('e8', 'Wypowiedziałeś wojnę Kartaginie', 'info'),
    EV('e9', '', 'info', { subtitle: 'Magazyn centralny pusty' }),
  ],
  diploOnly: [EV('d1', 'Audiencja u Faraona', 'info'), EV('d2', 'Chiny handluje z Japonią', 'info', { origin: 'other-civs' })],
  aiOnly: [EV('a1', 'Egipt handluje z Persją', 'info', { origin: 'other-civs' }), EV('a2', 'Inne: Ateny', 'unit')],
  otherOnly: [EV('o1', 'Nowa jednostka w Ur', 'unit'), EV('o2', 'Kultura rośnie', 'culture')],
  blockingOnly: [EV('b1', 'Wybór: Wódz', 'unit', { blocking: true })],
  empty: [],
};
for (const [set] of Object.entries(EVENT_SETS)) {
  for (const dismiss of [true, false]) {
    SCENES.push({ id: `side-${set}-${dismiss ? 'd' : 'n'}`, kind: 'side', set, dismiss, shot: dismiss && (set === 'mix' || set === 'aiOnly'), steps: [
      { k: 'clickSel', sel: '[data-sp-tab="dyplomacja"]', shot: dismiss && set === 'mix' }, { k: 'update' }, { k: 'clickSel', sel: '[data-sp-tab="inne"]' },
      { k: 'clickSel', sel: '[data-sp-tab="wazne"]' }, { k: 'clickSel', sel: '[data-sp-dismiss-all]' }, { k: 'update' },
    ] });
  }
}
const RECRUIT_ROWS = [
  { id: 'wojownik', label: 'Wojownik', koszt: 10, capableCities: 3, totalCities: 4, queued: 2 },
  { id: 'lucznik', label: 'Łucznik <x> & „ł”', koszt: 25, capableCities: 1, totalCities: 4, queued: 0 },
  { id: 'kat', label: 'Katapulta z bardzo długą nazwą jednostki oblężniczej', koszt: 1250, capableCities: 0, totalCities: 4, queued: 7, blockedReason: 'Brak <Drewna> w magazynie' },
  { id: 'jezdziec', label: 'Jeździec', koszt: 40, capableCities: 0, totalCities: 4, queued: 0 },
];
SCENES.push({ id: 'recruit-main', kind: 'recruit', rows: RECRUIT_ROWS, shot: true, steps: [
  { k: 'clickSel', sel: '[data-unit="wojownik"] [data-erp="inc"]' }, { k: 'clickSel', sel: '[data-unit="wojownik"] [data-erp="inc"]' },
  { k: 'clickSel', sel: '[data-unit="wojownik"] [data-erp="dec"]' }, { k: 'clickSel', sel: '[data-unit="wojownik"] [data-erp="go"]' },
  { k: 'fill', sel: '[data-unit="lucznik"] [data-erp="qty"]', val: '1500' }, { k: 'clickSel', sel: '[data-unit="lucznik"] [data-erp="go"]', shot: true },
  { k: 'fill', sel: '[data-unit="lucznik"] [data-erp="qty"]', val: '-4' }, { k: 'clickSel', sel: '[data-unit="lucznik"] [data-erp="go"]' },
  { k: 'clickSel', sel: '[data-unit="kat"] [data-erp="go"]' }, { k: 'refresh' }, { k: 'toggle' }, { k: 'toggle' }, { k: 'clickSel', sel: '[data-erp="close"]' },
] });
SCENES.push({ id: 'recruit-empty', kind: 'recruit', rows: [], steps: [{ k: 'refresh' }, { k: 'reset' }] });

/* ── Kod strony ───────────────────────────────────────────────────────────────────────────────────────── */
const LIB = (DATA) => {
  const U = globalThis.__ui3;
  const log = [];
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') U.eo.handleEscapeKeydown(e); });
  const act = (n) => (...a) => log.push(n + JSON.stringify(a));
  const units = (set) => DATA.UNIT_SETS[set].map(([id, name, cmd], i) => ({
    id, name, ...(cmd ? { commanderTitle: cmd } : {}), ...(i % 2 ? { icon: '🛡' } : {}), ...(i % 3 === 2 ? {} : { ruchLeft: i % 3, ruchMax: 2 }),
  }));
  const r2 = (v) => Math.round(v * 100) / 100;
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [r.left, r.top, r.width, r.height].map(r2).join(',');
  };
  const desc = (el) => {
    if (!el || el === document.body || el === document.documentElement) return 'body';
    return el.tagName + ['data-act', 'data-uid', 'data-go', 'data-erp', 'data-sp-tab', 'class'].map((a) => (el.hasAttribute(a) ? `[${a}=${el.getAttribute(a)}]` : '')).join('');
  };
  let cur = null;
  let side = null;
  let events = [];
  let autoBuild = false;
  const H = {
    open(sc) {
      cur = sc;
      log.length = 0;
      if (sc.kind === 'merge') {
        const all = units(sc.set);
        U.mg.showArmyMergePanel({ hexLabel: 'A-7 <x>', existing: all, arriving: { id: 'new', name: 'Zwiadowca' }, onMerge: act('onMerge'), onSeparate: act('onSeparate') });
      } else if (sc.kind === 'pick') {
        U.pk.showArmyMergePickPanel({ hexLabel: 'B-2', sourceUnits: units(sc.set), targets: [
          { q: 1, r: 2, label: 'Heks 1,2', units: units('plain') }, { q: 3, r: 1, label: 'Armia <Generała>', units: units('gen') },
        ], onMerge: act('onMerge'), onCancel: act('onCancel') });
      } else if (sc.kind === 'split') {
        U.sp.showArmySplitPanel({ hexLabel: 'C-3', units: units(sc.set), destHexes: [{ q: 1, r: 2, label: 'Heks 1,2' }], onSplit: act('onSplit'), onCancel: act('onCancel') });
      } else if (sc.kind === 'pause') {
        autoBuild = !!sc.now;
        U.pm.configureGamePauseMenu({
          onResume: act('onResume'),
          ...(sc.toggle ? { onAutoBuildToggle: (v) => { autoBuild = v; log.push('onAutoBuildToggle' + JSON.stringify([v])); } } : {}),
          ...(sc.now === undefined ? {} : { getAutoBuildEnabled: () => autoBuild }),
        });
        U.pm.showGamePauseMenu();
      } else if (sc.kind === 'side') {
        events = DATA.EVENT_SETS[sc.set].map((e) => ({ ...e }));
        side = U.sh.createSidePanelHud({
          getEvents: () => events,
          getContextPanel: () => null,
          onEventClick: act('onEventClick'),
          ...(sc.dismiss ? { onEventDismiss: (id) => { log.push('dismiss' + JSON.stringify([id])); events = events.filter((e) => e.id !== id); } } : {}),
          onDismissAll: act('onDismissAll'),
        });
        document.body.appendChild(side.el);
        document.body.appendChild(side.ctxEl);
        side.update();
      } else if (sc.kind === 'recruit') {
        U.er.resetEmpireRecruitPanelSession();
        H.recruitCfg = { getRows: () => sc.rows.map((r) => ({ ...r })), onOrder: (id, q) => { log.push('onOrder' + JSON.stringify([id, q])); return { message: `Zamówiono ${q} × ${id} <ok>`, changed: q > 0 }; } };
        U.er.toggleEmpireRecruitPanel(H.recruitCfg);
      }
    },
    step(st) {
      if (st.k === 'update' && side) side.update();
      else if (st.k === 'refresh') U.er.refreshEmpireRecruitPanel();
      else if (st.k === 'toggle') U.er.toggleEmpireRecruitPanel(H.recruitCfg);
      else if (st.k === 'reset') U.er.resetEmpireRecruitPanelSession();
    },
    close() {
      U.mg.hideArmyMergePanel(); U.pk.hideArmyMergePickPanel(); U.sp.hideArmySplitPanel(); U.pm.hideGamePauseMenu();
      if (side) { side.destroy(); side.el.remove(); side.ctxEl.remove(); side = null; }
      U.er.resetEmpireRecruitPanelSession();
    },
    state() {
      const sc = cur;
      const st = { html: null, active: desc(document.activeElement), log: log.join(' | ') };
      const sel = { merge: '.civ-amp-overlay', pick: '.civ-ampk-overlay', split: '.civ-asp-overlay', pause: '.civ-pause', recruit: '#civ-empire-recruit-panel' }[sc.kind];
      if (sel) {
        const el = document.querySelector(sel);
        st.html = el ? el.outerHTML : null;
        st.rect = rect(el && (el.firstElementChild ?? el));
      }
      if (sc.kind === 'merge') st.open = U.mg.isArmyMergePanelOpen();
      if (sc.kind === 'pick') st.open = U.pk.isArmyMergePickPanelOpen();
      if (sc.kind === 'split') st.open = U.sp.isArmySplitPanelOpen();
      if (sc.kind === 'pause') { st.open = U.pm.isGamePauseMenuOpen(); st.autoBuild = autoBuild; }
      if (sc.kind === 'recruit') {
        st.open = U.er.isEmpireRecruitPanelOpen();
        st.drafts = sc.rows.map((r) => U.er.getEmpireRecruitDraft(r.id)).join(',');
      }
      if (sc.kind === 'side' && side) {
        st.html = side.el.outerHTML;
        st.rect = rect(side.el.querySelector('.sp-tabs'));
        st.events = events.map((e) => e.id).join(',');
      }
      return JSON.stringify(st);
    },
    vectors(kind) {
      const out = {};
      const safe = (f) => { try { return f(); } catch (e) { return 'THROW:' + String(e && e.message); } };
      if (kind === 'label') {
        const cards = [];
        for (const set of Object.keys(DATA.UNIT_SETS)) cards.push(units(set));
        cards.push([{ name: 'Zwiadowca' }, { name: 'Wojownik', commanderTitle: 'Wódz' }, { commanderTitle: 'Generał' }, {}, { name: '' }, { name: 'Robotnik' }]);
        out.sort = cards.map((c) => safe(() => U.lb.sortArmyStackGeneralsFirst(c).map((x) => (x.id ?? '') + ':' + (x.name ?? '?') + ':' + (x.commanderTitle ?? ''))));
        out.label = [...cards.flat(), { name: 'A', commanderTitle: undefined }, { name: '<b>', commanderTitle: 'Generał' }].map((c) => safe(() => U.lb.armyStackCardLabel(c)));
        out.frozen = safe(() => { const a = Object.freeze(units('gen')); const b = U.lb.sortArmyStackGeneralsFirst(a); return [b !== a, a.length === b.length]; });
      } else if (kind === 'chip') {
        out.chip = DATA.CHIPS.map((o) => safe(() => U.ch.chip6cHtml(o)));
        out.sep = safe(() => U.ch.chip6cSep());
        out.grossNet = DATA.GROSS.map(([g, n, u]) => safe(() => U.ch.formatGrossNet(g, n, u)));
      } else if (kind === 'tabs') {
        out.tab = DATA.TAB_EVENTS.map((e) => safe(() => U.tb.eventTabOf(e)));
        out.norm = DATA.TAB_EVENTS.map((e) => safe(() => U.tb.normalizeEventText(e.title)));
        out.labels = [U.tb.SIDE_PANEL_TABS.join(','), JSON.stringify(U.tb.SIDE_PANEL_TAB_LABELS)];
        out.def = DATA.COUNTS.map((c) => safe(() => U.tb.defaultSidePanelTab(c)));
        const all = DATA.TAB_EVENTS.map((e, i) => ({ id: 'x' + i, ...e }));
        for (const tab of ['dyplomacja', 'wazne', 'inne']) {
          out['by-' + tab] = safe(() => U.fl.filterSidePanelEventsByTab(all, tab).map((e) => e.id).join(','));
          out['rel-' + tab] = safe(() => U.fl.relevantInfoEvents(all, tab).map((e) => e.id).join(','));
          out['hid-' + tab] = all.map((e) => (U.fl.isHiddenAiAiEvent(e, tab) ? 1 : 0)).join('');
        }
        out.counts = [JSON.stringify(U.fl.tabCountsOf(all, true)), JSON.stringify(U.fl.tabCountsOf(all, false)), JSON.stringify(U.fl.tabCountsOf([], true))];
      } else if (kind === 'icon') {
        out.worldZ = [U.wo.WORLD_OVERLAY_Z_INDEX, Object.keys(U.wo).sort().join(',')];
        out.bld = ['emporion', 'targowisko', 'port', 'nieznany_budynek', ''].map((id) => safe(() => U.ba.buildingIconSvg(undefined, id)));
      }
      return JSON.stringify(out);
    },
  };
  globalThis.__h = H;
};

// Wektory funkcji czystych (dane wejściowe wspólne dla obu stron).
const CHIPS = [];
for (const shortage of [undefined, false, true]) {
  for (const net of [undefined, '+9', '−3', '']) {
    for (const rate of [undefined, '+12']) {
      for (const tone of [undefined, 'pos', 'neg', 'zero']) {
        CHIPS.push({ iconId: CHIPS.length % 3 === 0 ? 'res-science' : 'res-gold', label: 'Skarbiec <x>', value: '20,9k', rate, rateWarn: CHIPS.length % 5 === 0, shortage, net, netTone: tone, rateTone: tone === 'neg' ? 'pos' : tone,
          ...(CHIPS.length % 4 === 0 ? { act: 'treasury', title: 'Skarb & „ł”', exact: '20 860', netHint: 'brutto / netto' } : {}),
          ...(CHIPS.length % 7 === 0 ? { researchProgress: 0.42, valClass: 'civ-x' } : {}) });
      }
    }
  }
}
const GROSS = [[12, 9, 'zł/turę'], [0, 0], [-3, -7.5, ''], [1234567, -1, 'Praca'], [0.05, -0.04, 'x'], [NaN, Infinity], [-0, 2 ** 53]];
const WORDS = ['Dyplomacja: Rzym', 'Propozycja handlu od Egiptu', 'Kontroferta Persji', 'Audiencja u cesarza', 'Egipt handluje z Persją',
  'Brak środków na budowę', 'Brak zasobów: żelazo', 'Deficyt żywności w Ur', 'Wyczerpany magazyn', 'Nie stać cię na rekrutację', 'Za mało Pracy',
  'Wypowiedziałeś wojnę Rzymowi', 'Rzym wypowiada wojnę', 'Pokój z: Kartagina', 'Pokój zawarty', 'Rozejm podpisany', 'Zerwano traktat', 'Sojusz z Grecją', 'Trybut otrzymany', 'Casus belli',
  'Magazyn centralny pusty', 'Kapitulacja Sparty', 'Oblężenie Aten', 'Głód w mieście', 'GLOD', 'Zagrożenie z północy', 'Atakują nas!', 'Atak na Ur', 'Straty w bitwie', 'Utrata miasta',
  'Armia wroga', 'Wojska przy granicy', 'Wróg', 'Wrogowie', 'Bunt w Atenach', 'Zniszczono farmę', 'Dezercja', 'Eliminacja cywilizacji', 'Zdobyte przez wroga', 'Wojna trwa', 'Szturm', 'Niewola',
  'Nowa farmie przy rzece', 'Armia gotowa', 'Badanie ukończone', 'Nowe miasto: Ur', 'Kultura rośnie', '', 'brakuje', 'Ładowanie   wielu    spacji', 'ŁÓDŹ ŻÓŁW ĘĄ', 'Ruch armiy (literówka)'];
const TAB_EVENTS = [];
for (const [i, w] of WORDS.entries()) {
  for (const kind of ['info', 'diplo', 'enemy', 'city']) {
    if (kind !== 'info' && i % 3) continue;
    TAB_EVENTS.push({ title: w, kind, ...(i % 4 === 1 ? { subtitle: WORDS[(i * 7) % WORDS.length] } : {}), ...(i % 9 === 2 ? { blocking: true } : {}), ...(i % 11 === 3 ? { origin: 'other-civs' } : {}) });
  }
}
const COUNTS = [];
for (const d of [0, 1, 5]) for (const w of [0, 1, 2]) for (const n of [0, 3]) COUNTS.push({ dyplomacja: d, wazne: w, inne: n });
const DATA = { UNIT_SETS, EVENT_SETS, CHIPS, GROSS, TAB_EVENTS, COUNTS };

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
function serve(dir) {
  return new Promise((ok) => {
    const srv = createServer((req, res) => {
      const p = join(dir, decodeURIComponent((req.url ?? '/').split('?')[0]));
      if (!p.startsWith(dir) || !existsSync(p)) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }).end(readFileSync(p));
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}
const settle = (page) => page.evaluate(() => new Promise((res) => {
  let n = 0;
  const tick = () => {
    for (const a of document.getAnimations()) {
      try { a.finish(); } catch { /* nieskończona */ }
    }
    if (++n >= 3) res();
    else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}));
const SHOT_STYLE = '*{scrollbar-color:transparent transparent !important;caret-color:transparent !important}';
async function stableShot(page) {
  let prev = await page.screenshot({ animations: 'disabled', style: SHOT_STYLE });
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(200);
    const cur = await page.screenshot({ animations: 'disabled', style: SHOT_STYLE });
    if (Buffer.compare(prev, cur) === 0) return cur;
    prev = cur;
  }
  return prev;
}

async function runSide(browser, side, dir, shared, errs, shots) {
  const srv = await serve(dir);
  const vec = {};
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      page.on('pageerror', (e) => errs.push(`${side}: ${e.message}`));
      page.on('console', (m) => { if (m.type() === 'error') errs.push(`${side}: ${m.text()}`); });
      await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
      try {
        await page.waitForFunction(() => globalThis.__ui3 !== undefined, null, { timeout: 60000 });
      } catch (e) {
        throw new Error(`${side}: moduły nie załadowane (${errs.join(' | ') || e.message})`);
      }
      // Port: `unitIconSvg(undefined)` czyta kategorię z katalogu („Rust”) = web `categoryOf('', '', false)` (jak UI-2-B).
      if (side === 'web') shared.cat = await page.evaluate(() => globalThis.__ui3.cat());
      else await page.evaluate((cat) => globalThis.__ui3.install({ contentHash: 'harness-ui3a', unitCategory: {}, unitCategoryNameOnly: { '': cat } }), shared.cat);
      await page.evaluate(LIB, DATA);
      const vk = `${vp.width}x${vp.height}`;
      for (const k of ['label', 'chip', 'tabs', 'icon']) if (KINDS.has(k)) vec[`${k}@${vk}`] = [await page.evaluate((x) => globalThis.__h.vectors(x), k)];
      for (const sc of SCENES.filter((x) => KINDS.has(x.kind))) {
        const states = [];
        await page.evaluate((s) => globalThis.__h.open(s), sc);
        await settle(page);
        states.push(await page.evaluate(() => globalThis.__h.state()));
        if (sc.shot) shots.push({ side, key: `${sc.id}@${vk}`, png: await stableShot(page) });
        for (const st of sc.steps) {
          if (st.k === 'key') await page.keyboard.press(st.key);
          else if (st.k === 'clickSel') {
            const ok = await page.evaluate((sel) => {
              const el = document.querySelector(sel);
              if (!el) return false;
              el.scrollIntoView({ block: 'nearest' });
              return true;
            }, st.sel);
            if (ok) await page.click(st.sel, { timeout: 3000 }).catch(() => page.evaluate((sel) => document.querySelector(sel)?.click(), st.sel));
          } else if (st.k === 'fill') {
            if (await page.$(st.sel)) await page.fill(st.sel, st.val);
          } else await page.evaluate((s) => globalThis.__h.step(s), st);
          await settle(page);
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

/** Asercje pokrycia na wektorach WEBU. */
function coverage(vec) {
  const checks = [];
  const c = (kind, name, fn) => {
    if (!KINDS.has(kind)) return;
    let ok = false;
    try { ok = !!fn(); } catch { ok = false; }
    checks.push([name, ok]);
  };
  const S = (k, i) => JSON.parse(vec[k][i]);
  const V = (k) => JSON.parse(vec[k][0]);
  for (const vk of ['1280x720', '360x640']) {
    c('label', `label@${vk} generałowie pierwsi, cywile ostatni`, () => V(`label@${vk}`).sort[1].join(' ') === 'u2:Hoplita:Generał u4:Wojownik:Wódz u0:Wojownik: u3:Łucznik: u1:Zwiadowca:');
    c('label', `label@${vk} cywile na koniec (stabilnie, wielkość liter)`, () => V(`label@${vk}`).sort[2].join(' ') === 'u3:Włócznik: u4:Zwiadowca : u5:zwiadowca: u0:Osadnik: u1:Robotnik: u2:Zwiadowca:');
    c('label', `label@${vk} dowódca-zwiadowca nie idzie na koniec`, () => V(`label@${vk}`).sort[3][1] === 'u1:Zwiadowca:Generał');
    c('label', `label@${vk} etykieta „Generał — typ”`, () => V(`label@${vk}`).label.includes('Generał — Hoplita') && V(`label@${vk}`).label.includes('Wojownik'));
    c('merge', `merge-gen@${vk} rola + klasa cmd + kolejność`, () => { const h = S(`merge-gen@${vk}`, 0).html; return h.includes('civ-amp-row cmd') && h.indexOf('Generał — Hoplita') < h.indexOf('Zwiadowca') && h.indexOf('Wódz — Wojownik') < h.indexOf('Łucznik'); });
    c('merge', `merge-gen@${vk} Enter = Połącz`, () => S(`merge-gen@${vk}`, 1).log === 'onMerge[]');
    c('pick', `pick-gen@${vk} title/aria-label z rolą`, () => S(`pick-gen@${vk}`, 0).html.includes('title="Generał — Hoplita"') && S(`pick-gen@${vk}`, 0).html.includes('aria-label="Generał — Hoplita"'));
    // Wszystkie domyślnie zaznaczone; klik w PIERWSZY wiersz odznacza generała (u2) — dowód, że stoi na początku listy.
    c('pick', `pick-gen@${vk} pierwszy wiersz = generał`, () => S(`pick-gen@${vk}`, 3).log === 'onMerge[["u0","u1","u3","u4"],3,1]');
    c('split', `split-gen@${vk} cmd + rola`, () => S(`split-gen@${vk}`, 0).html.includes('civ-asp-u cmd') && S(`split-gen@${vk}`, 0).html.includes('Wódz — Wojownik'));
    c('pause', `pause@${vk} bez konfiguracji brak przełącznika`, () => !S(`pause-0@${vk}`, 0).html.includes('autobuild'));
    c('pause', `pause@${vk} domyślnie WYŁ. i przełączanie`, () => S(`pause-3@${vk}`, 0).html.includes('aria-pressed="false"') && S(`pause-1@${vk}`, 1).log === 'onAutoBuildToggle[true]' && S(`pause-1@${vk}`, 2).autoBuild === false);
    c('pause', `pause@${vk} stan bieżący WŁ.`, () => S(`pause-2@${vk}`, 0).html.includes('data-act="autobuild-toggle" role="switch" aria-pressed="true"'));
    c('side', `side-mix@${vk} 3 zakładki, Ważne domyślnie`, () => { const h = S(`side-mix-d@${vk}`, 0).html; return (h.match(/data-sp-tab=/g) || []).length === 3 && /sp-tab sp-tab-active" aria-selected="true" data-sp-tab="wazne"/.test(h); });
    c('side', `side-mix@${vk} klik Dyplomacja`, () => /sp-tab-active" aria-selected="true" data-sp-tab="dyplomacja"/.test(S(`side-mix-d@${vk}`, 1).html));
    c('side', `side-mix@${vk} Zamknij nad zakładkami`, () => { const h = S(`side-mix-d@${vk}`, 0).html; return h.indexOf('data-sp-dismiss-all') > 0 && h.indexOf('data-sp-dismiss-all') < h.indexOf('sp-tabs'); });
    c('side', `side-mix@${vk} „Zamknij wszystkie” zamyka tylko informacyjne`, () => S(`side-mix-d@${vk}`, 5).log.includes('dismiss') && S(`side-mix-d@${vk}`, 6).events.includes('e6'));
    c('side', `side-aiOnly@${vk} handel AI↔AI nie przełącza na Dyplomację`, () => /aria-selected="true" data-sp-tab="inne"/.test(S(`side-aiOnly-d@${vk}`, 0).html));
    c('side', `side-n@${vk} bez onEventDismiss brak przycisku`, () => !S(`side-mix-n@${vk}`, 0).html.includes('data-sp-dismiss-all'));
    c('recruit', `recruit@${vk} liczniki niezależne, nie zerują się`, () => S(`recruit-main@${vk}`, 4).log === 'onOrder["wojownik",2]' && S(`recruit-main@${vk}`, 4).drafts.startsWith('2,1'));
    // Pole: 1500 → 999, −4 → 1 (clampQty). Zmierzone: klik „Rekrutuj” zaraz po edycji pola NIE składa zamówienia (blur →
    // `change` → render podmienia przycisk przed `click`) — zachowanie weba, identyczne w porcie (kopia bajtowa).
    c('recruit', `recruit@${vk} limit 999 i minimum 1`, () => S(`recruit-main@${vk}`, 5).drafts === '2,999,1,1' && S(`recruit-main@${vk}`, 7).drafts === '2,1,1,1');
    c('recruit', `recruit@${vk} zablokowany typ bez zamówienia`, () => !S(`recruit-main@${vk}`, 9).log.includes('"kat"') && S(`recruit-main@${vk}`, 0).html.includes('Brak &lt;Drewna&gt; w magazynie'));
    c('recruit', `recruit@${vk} komunikat po zamówieniu`, () => S(`recruit-main@${vk}`, 4).html.includes('Zamówiono 2 × wojownik &lt;ok&gt;'));
    c('recruit', `recruit@${vk} toggle zamyka/otwiera, Zamknij`, () => S(`recruit-main@${vk}`, 11).open === false && S(`recruit-main@${vk}`, 12).open === true && S(`recruit-main@${vk}`, 13).open === false);
    c('chip', `chip@${vk} shortage/komórka net/netHint`, () => { const ch = V(`chip@${vk}`).chip; return ch.some((h) => h.includes('civ-hud-chip-short')) && ch.some((h) => h.includes('civ-hud-chip-cell') && h.includes('civ-hud-chip-net neg')) && ch.some((h) => h.includes('· brutto / netto')); });
    c('chip', `chip@${vk} formatGrossNet`, () => V(`chip@${vk}`).grossNet[0] === 'BRUTTO +12 → NETTO +9 zł/turę');
    c('tabs', `tabs@${vk} wszystkie 3 zakładki trafione`, () => { const t = V(`tabs@${vk}`).tab; return ['dyplomacja', 'wazne', 'inne'].every((x) => t.includes(x)); });
    c('tabs', `tabs@${vk} „farmie” ≠ armia (granica wyrazu)`, () => V(`tabs@${vk}`).tab[WORDS.indexOf('Nowa farmie przy rzece') >= 0 ? TAB_EVENTS.findIndex((e) => e.title === 'Nowa farmie przy rzece') : -1] === 'inne');
    c('icon', `icon@${vk} emporion ma własną ikonę`, () => { const b = V(`icon@${vk}`).bld; return b[0] !== b[3] && b[0].startsWith('<svg'); });
  }
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
  browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--font-render-hinting=none', '--disable-gpu', '--num-raster-threads=1'] });
  const errs = [];
  const shots = [];
  const shared = {};
  const web = await runSide(browser, 'web', sides.web, shared, errs, shots);
  const port = await runSide(browser, 'port', sides.port, shared, errs, shots);
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
  for (const key of Object.keys(port)) if (!(key in web)) { diffs++; console.log(`TYLKO-PORT ${key}`); }
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
      if (ps && !eq) writeFileSync(join(PNG_DIR, `port-${ws.key.replace(/[^\w.-]+/g, '_')}.png`), ps.png);
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
  if (OUT && KINDS.size < ALL_KINDS.split(',').length) throw new Error('--out wymaga pełnego zestawu scen (bez --kinds)');
  const h16 = (x) => createHash('sha256').update(x).digest('hex').slice(0, 16);
  if (OUT) {
    const steps = Object.fromEntries(Object.entries(web).map(([k, v]) => [k, v.map(h16)]));
    const png = Object.fromEntries(webShots.map((s) => [s.key, createHash('sha256').update(s.png).digest('hex')]));
    writeFileSync(OUT, JSON.stringify({ topic: 'R-RUSTPORT-REPIN-WEB-UI-3-Q1', source: 'web origin/main 9b019a7d8 (Chromium headless, git archive gra/src gra/data)', webVectorsSha256: webHash, viewports: VIEWPORTS, pngSha256: png, stepSha256_16: steps }, null, 0).replace(/\],"/g, '],\n"') + '\n');
  }
  if (argOf('--out-full')) writeFileSync(argOf('--out-full'), JSON.stringify({ webVectorsSha256: webHash, vectors: web }) + '\n');
  const steps = [...groups.values()].reduce((a, g) => a + g.steps, 0);
  console.log(`run-repin-ui3a: scen=${SCENES.filter((x) => KINDS.has(x.kind)).length}×${VIEWPORTS.length} kroków=${steps} zrzutów=${webShots.length} PIX_różnych=${pixDiff} asercji_pokrycia=${checks.length - coverFail.length}/${checks.length} błędów_strony=${errs.length} różnic=${diffs} webVectorsSha256=${webHash}`);
  exitCode = diffs === 0 ? 0 : 1;
} catch (e) {
  console.error('BŁĄD harnessu:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  if (browser) await browser.close();
  rmSync(TMP, { recursive: true, force: true });
}
process.exitCode = exitCode;
