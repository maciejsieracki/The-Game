#!/usr/bin/env node
/**
 * run-k08b-rail.mjs — harness DOM partii `rail` K08B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1, runda 1).
 *
 * Port (`src/ui/cityPanel/k08b-rail.ts`) jest bundlowany esbuildem (z emulacją `?raw` / `import.meta.glob` jak w
 * `run-k08a-units.mjs`) i wywoływany w jsdom. Oczekiwane wartości = semantyka pinu `edb8fb56`
 * (`gra/src/ui/cityPanel.ts`, linia w opisie każdego wektora), NIE wynik portu.
 * Zależności: `setK08aDeps` z rejestratorem (clearGarrisonPanel, rerender, disposeHoverDetailDock, isCityUxFrameOpen),
 * `setK05bHost` z `cfg.getBuiltBuildingIds`, stan `activeCityPanelTab`/`scalePx` przez akcesory K08A/K07A.
 *
 * PIN (r2): `--pin-dir <PIN_DIR>` jest WYMAGANE. Harness czyta `<PIN_DIR>/gra/src/ui/cityPanel.ts` i sprawdza
 * kotwice (sekcja PIN-ANCHOR): każdy literał, na którym opiera się oczekiwana wartość wektora, MUSI występować
 * w linii pinu, którą wektor cytuje. Zmiana pinu lub zły numer linii = różnica (nie cicha rozbieżność).
 * Domknięcie „harness wykonuje pin” (uruchomienie funkcji pinu) wymaga wiringu zależności pinu — NIE_ZROBIONE, §7.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k08b-rail.mjs --pin-dir <PIN_DIR> [--v2 <plik-partii>] [--tmp-dir <katalog poza repo>]
 * EXIT 0 <=> wszystkie wektory zgodne; 1 <=> >=1 niezgodność; 2 <=> błąd harnessu.
 */
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import * as esbuild from 'esbuild';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const V2_FILE = resolve(argOf('--v2') ?? join(V2_ROOT, 'src/ui/cityPanel/k08b-rail.ts'));
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-k08b-rail.mjs --pin-dir <PIN_DIR> [--v2 <plik>] [--tmp-dir <katalog>]');
  process.exit(2);
}
const PIN_LINES = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k08b-rail-'));

const results = [];
const check = (id, pin, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  results.push({ id, pin, ok, got, want });
};

/** PIN-ANCHOR: [linia pinu (1-indeksowana), literał]. Literał musi być w tej linii pinu (sprawdzane na każdym runie). */
const PIN_ANCHORS = [
  [9279, 'pokaż szczegóły'], [9281, 'Budynki w mieście ('], [9282, 'gap:0.4em'], [9285, 'ℹ szczegóły'],
  [9288, 'e.stopPropagation()'], [9289, "'left'"], [9291, "280, 'left'"],
  [10703, 'Wróć na mapę świata (Esc)'], [10705, 'Wróć na mapę'], [10707, 'Esc — szybkie zamknięcie'],
  [10785, 'civ-cs civ-ux-panel-scope'], [10787, 'civ-v-icon-rail-mount'], [10788, 'cs-icon-rail-left'],
  [11060, 'Wróć na mapę świata (Esc)'], [11064, 'Esc — szybkie wyjście'], [11072, 'hidden aria-hidden="true"'], [11075, 'okstats is-collapsed'],
  [11613, "'civ-v-icon-rail civ-v-icon-rail-vert civ-v-icon-rail-w3'"], [11614, "'civ-v-icon-rail'"],
  [11616, 'Math.round(scalePx * CITY_PANEL_ICON_RAIL_VERT_EM)'], [11618, "activeCityPanelTab === item.id ? ' on'"],
  [11622, "activeCityPanelTab === item.id ? 'true' : 'false'"], [11626, "'26px'"], [11630, "'24px'"],
  [11640, 'activeCityPanelTab !== item.id'], [11641, 'clearGarrisonPanel();'], [11643, 'rerender();'],
  [11658, "'civ-w4-tab-card civ-w4-tab-card--scroll'"], [11660, 'if (id) card.id = id;'], [11661, "'civ-w4-tab-body civ-w4-tab-body--scroll'"],
];
PIN_ANCHORS.forEach(([line, lit], i) => check(`pin.anchor.${i + 1}`, `cityPanel.ts:${line} "${lit}"`, PIN_LINES[line - 1]?.includes(lit) ?? false, true));

let exitCode = 0;
try {
  // ─── bundle ──────────────────────────────────────────────────────────────────────────────────────────────────────
  const dir = dirname(V2_FILE);
  const entry = join(TMP, 'entry.ts');
  const setup = join(TMP, 'setup.ts');
  writeFileSync(
    setup,
    [
      `import { installStaticCatalog } from ${JSON.stringify(join(V2_ROOT, 'src/controller/staticCatalog.ts'))};`,
      `import { MOCK_STATIC_CATALOG } from ${JSON.stringify(join(V2_ROOT, 'src/controller/mockCatalog.ts'))};`,
      'installStaticCatalog(MOCK_STATIC_CATALOG);',
      '',
    ].join('\n'),
  );
  writeFileSync(
    entry,
    [
      `import ${JSON.stringify(setup)};`,
      `export * from ${JSON.stringify(V2_FILE)};`,
      `export { setK08aDeps, setK08aActiveCityPanelTab, getK08aActiveCityPanelTab, CITY_PANEL_ICONS_LEFT, cityRailIconHtml } from ${JSON.stringify(join(dir, 'k08a-fundament.ts'))};`,
      `export { setK05bHost } from ${JSON.stringify(join(dir, 'k05b-host.ts'))};`,
      `export { setK07aScalePx, getK07aScalePx, setK07aActiveCity } from ${JSON.stringify(join(dir, 'k07a-fundament.ts'))};`,
      `export { setHoverDetailDocks } from ${JSON.stringify(join(dir, '../hoverDetailDock.ts'))};`,
      `export { setK06bDeps } from ${JSON.stringify(join(dir, 'k06b-deps.ts'))};`,
      `export { el } from ${JSON.stringify(join(dir, 'k01b-dom.ts'))};`,
      `export { setK06aActive } from ${JSON.stringify(join(dir, 'k06a-fundament.ts'))};`,
      '',
    ].join('\n'),
  );
  const outFile = join(TMP, 'k08b-rail-bundle.mjs');
  const rawPlugin = {
    name: 'raw-svg',
    setup(build) {
      build.onResolve({ filter: /\?raw$/ }, (a) => ({ path: resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw-file' }));
      build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (a) => ({ contents: readFileSync(a.path, 'utf8'), loader: 'text' }));
    },
  };
  const iconsDir = resolve(V2_ROOT, 'src/ui/icons');
  const listSvg = (d, rel = '') =>
    readdirSync(join(d, rel), { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? listSvg(d, join(rel, e.name)) : e.name.endsWith('.svg') ? [join(rel, e.name)] : [],
    );
  const svgObj = Object.fromEntries(listSvg(join(iconsDir, 'brand')).map((rel) => [`./brand/${rel.split(sep).join('/')}`, readFileSync(join(iconsDir, 'brand', rel), 'utf8')]));
  const globPlugin = {
    name: 'vite-glob-brand',
    setup(build) {
      build.onLoad({ filter: /icons\/brandAssets\.ts$/ }, (a) => {
        const src = readFileSync(a.path, 'utf8');
        const out = src.replace(/import\.meta\.glob\('\.\/brand\/\*\*\/\*\.svg'[\s\S]*?\}\)/, JSON.stringify(svgObj));
        if (out === src) throw new Error('brandAssets: nie znaleziono import.meta.glob (zmiana pliku?)');
        return { contents: out, loader: 'ts', resolveDir: dirname(a.path) };
      });
    },
  };
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: outFile,
    logLevel: 'silent',
    loader: { '.ts': 'ts', '.svg': 'text' },
    plugins: [rawPlugin, globPlugin],
  });

  // ─── jsdom (globalne przed importem bundla) ─────────────────────────────────────────────────────────────────────
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'http://localhost/' });
  const g = globalThis;
  for (const k of ['window', 'document', 'HTMLElement', 'HTMLDivElement', 'Element', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'localStorage', 'navigator', 'DOMParser', 'SVGElement']) {
    if (k === 'window') g.window = dom.window;
    else if (k === 'requestAnimationFrame') g.requestAnimationFrame = (cb) => setTimeout(() => cb(0), 0);
    else if (k === 'cancelAnimationFrame') g.cancelAnimationFrame = (id) => clearTimeout(id);
    else if (k === 'navigator') continue;
    else if (k in dom.window) g[k] = dom.window[k];
  }
  g.document = dom.window.document;

  const m = await import(pathToFileURL(outFile).href);

  // ─── rejestrator zależności ─────────────────────────────────────────────────────────────────────────────────────
  const calls = [];
  const fx = { open: true };
  m.setK08aDeps({
    rerender: () => calls.push('rerender'),
    clearGarrisonPanel: () => calls.push('clearGarrisonPanel'),
    disposeHoverDetailDock: () => calls.push('disposeHoverDetailDock'),
    isCityUxFrameOpen: () => fx.open,
  });
  const host = { cfg: { getBuiltBuildingIds: undefined } };
  m.setK05bHost(host);
  const city = { id: 1, ownerId: 0, name: 'A', population: 3 };
  const fresh = () => {
    calls.length = 0;
    const mount = document.createElement('div');
    document.body.innerHTML = '';
    document.body.appendChild(mount);
    return mount;
  };
  const items = [
    { id: 'budowa', iconId: 'icon-a', title: 'Budowa' },
    { id: 'handel', iconId: 'icon-b', title: 'Handel' },
  ];
  const q = (root, sel) => root.querySelector(sel);
  const qa = (root, sel) => [...root.querySelectorAll(sel)];

  // ─── renderCityIconRail (pin :11605-11649) ──────────────────────────────────────────────────────────────────────
  {
    m.setK08aActiveCityPanelTab('handel');
    let mount = fresh();
    m.renderCityIconRail(mount, items, false, false);
    const rail = q(mount, ':scope > div');
    check('rail.horiz.class', 'cityPanel.ts:11614 railCls', rail?.className, 'civ-v-icon-rail');
    const btns = qa(mount, 'button');
    check('rail.horiz.count', 'cityPanel.ts:11620 items.length', btns.length, 2);
    check('rail.horiz.on', 'cityPanel.ts:11622 activeCityPanelTab === item.id ? " on"', btns.map((b) => b.className), ['civ-v-icon-btn', 'civ-v-icon-btn on']);
    check('rail.horiz.pressed', 'cityPanel.ts:11625 aria-pressed', btns.map((b) => b.getAttribute('aria-pressed')), ['false', 'true']);
    check('rail.horiz.label', 'cityPanel.ts:11624 aria-label = title', btns.map((b) => [b.title, b.getAttribute('aria-label')]), [['Budowa', 'Budowa'], ['Handel', 'Handel']]);
    check('rail.horiz.type', 'cityPanel.ts:11623 type=button', btns.map((b) => b.type), ['button', 'button']);
    check('rail.horiz.glyph', 'cityPanel.ts:11627 glyph innerHTML = cityRailIconHtml(iconId)', btns.map((b) => q(b, '.civ-v-icon-glyph').innerHTML), [m.cityRailIconHtml('icon-a'), m.cityRailIconHtml('icon-b')]);
    check('rail.horiz.noStyle', 'cityPanel.ts:11637-11643 brak stylu gdy !vertical i iconPx=0', q(btns[0], '.civ-v-icon-glyph').getAttribute('style'), null);

    mount = fresh();
    m.renderCityIconRail(mount, items, true, false);
    check('rail.vert.class', 'cityPanel.ts:11613 civ-v-icon-rail-vert', q(mount, ':scope > div')?.className, 'civ-v-icon-rail civ-v-icon-rail-vert');
    check('rail.vert.glyph24', 'cityPanel.ts:11634-11636 vertical 24px', q(mount, '.civ-v-icon-glyph').style.width, '24px');

    mount = fresh();
    m.renderCityIconRail(mount, items, true, true);
    check('rail.w3.class', 'cityPanel.ts:11612 civ-v-icon-rail-w3', q(mount, ':scope > div')?.className, 'civ-v-icon-rail civ-v-icon-rail-vert civ-v-icon-rail-w3');
    check('rail.w3.glyph26', 'cityPanel.ts:11630-11633 w3 26px', [q(mount, '.civ-v-icon-glyph').style.width, q(mount, '.civ-v-icon-glyph').style.height], ['26px', '26px']);

    // klik na nieaktywną: clearGarrisonPanel, ustawienie zakładki, rerender (pin :11648-11651)
    mount = fresh();
    m.setK08aActiveCityPanelTab('handel');
    m.renderCityIconRail(mount, items, false, false);
    qa(mount, 'button')[0].click();
    check('rail.click.inactive.calls', 'cityPanel.ts:11645-11647 clearGarrisonPanel; rerender', calls.slice(), ['clearGarrisonPanel', 'rerender']);
    check('rail.click.inactive.tab', 'cityPanel.ts:11646 activeCityPanelTab = item.id', m.getK08aActiveCityPanelTab(), 'budowa');
    // klik na drugi element przy aktywnym pierwszym: zakładka = id KLIKNIĘTEGO elementu (pin :11646)
    mount = fresh();
    m.setK08aActiveCityPanelTab('budowa');
    m.renderCityIconRail(mount, items, false, false);
    qa(mount, 'button')[1].click();
    check('rail.click.second.tab', 'cityPanel.ts:11646 activeCityPanelTab = item.id (drugi)', m.getK08aActiveCityPanelTab(), 'handel');
    // klik na aktywną: brak efektów (pin :11644 if (activeCityPanelTab !== item.id))
    mount = fresh();
    m.setK08aActiveCityPanelTab('budowa');
    m.renderCityIconRail(mount, items, false, false);
    qa(mount, 'button')[0].click();
    check('rail.click.active.noop', 'cityPanel.ts:11644 brak efektów dla aktywnej', calls.slice(), []);
  }

  // ─── renderCityIconLeftRail (pin :10783-10791) ──────────────────────────────────────────────────────────────────
  {
    const mount = fresh();
    m.renderCityIconLeftRail(mount);
    const scope = q(mount, ':scope > div');
    check('left.scope', 'cityPanel.ts:10785 class civ-cs civ-ux-panel-scope', scope?.className, 'civ-cs civ-ux-panel-scope');
    const iconMount = q(mount, '#cs-icon-rail-left');
    check('left.mount.class', 'cityPanel.ts:10787 civ-v-icon-rail-mount', iconMount?.className, 'civ-v-icon-rail-mount');
    const rail = q(mount, '#cs-icon-rail-left .civ-v-icon-rail');
    check('left.rail.class', 'cityPanel.ts:10791 vert+w3', rail?.className, 'civ-v-icon-rail civ-v-icon-rail-vert civ-v-icon-rail-w3');
    check('left.rail.count', 'cityPanel.ts:10791 CITY_PANEL_ICONS_LEFT', qa(mount, '#cs-icon-rail-left button').length, m.CITY_PANEL_ICONS_LEFT.length);
  }

  // ─── renderCityExitFooter (pin :10700-10710) ────────────────────────────────────────────────────────────────────
  {
    let mount = fresh();
    let n = 0;
    m.renderCityExitFooter(mount, () => n++);
    const wrap = q(mount, ':scope > div');
    check('footer.class', 'cityPanel.ts:10701 civ-v-exit-foot', wrap?.className, 'civ-v-exit-foot');
    check('footer.btn', 'cityPanel.ts:10704 data-city-exit title', [q(mount, '[data-city-exit]')?.title, q(mount, '[data-city-exit]')?.className], ['Wróć na mapę świata (Esc)', 'civ-v-exit-map-btn civ-v-exit-foot-btn']);
    check('footer.hint', 'cityPanel.ts:10708 hint', q(mount, '.civ-v-exit-foot-hint')?.textContent, 'Esc — szybkie zamknięcie');
    check('footer.label', 'cityPanel.ts:10707 label', q(mount, '[data-city-exit] > span:last-child')?.textContent, 'Wróć na mapę');
    q(mount, '[data-city-exit]').click();
    check('footer.click.calls', 'cityPanel.ts:10709 closeCityView(onClose) -> clearCityPanelUxMode, onClose', [calls.slice(), n], [['clearGarrisonPanel', 'disposeHoverDetailDock'], 1]);
    check('footer.click.tab', 'K08A closeCityView -> zakładka budowa', m.getK08aActiveCityPanelTab(), 'budowa');
  }

  // ─── renderCivMapChrome (pin :11056-11079) ──────────────────────────────────────────────────────────────────────
  {
    const mount = fresh();
    let n = 0;
    m.renderCivMapChrome(mount, city, () => n++);
    check('chrome.stack', 'cityPanel.ts:11057 civ-v-map-bottom-stack', !!q(mount, ':scope > .civ-v-map-bottom-stack'), true);
    check('chrome.btn', 'cityPanel.ts:11060 #civ-v-map-close', q(mount, '#civ-v-map-close')?.title, 'Wróć na mapę świata (Esc)');
    check('chrome.hint', 'cityPanel.ts:11066 hint', q(mount, '.civ-v-exit-foot-hint')?.textContent, 'Esc — szybkie wyjście');
    check('chrome.center.ids', 'cityPanel.ts:11068-11071', ['cs-okhead-ux', 'cs-oktoolbar-ux', 'cs-okmode'].map((id) => !!q(mount, '#cs-okolica-center #' + id)), [true, true, true]);
    check('chrome.aux.hidden', 'cityPanel.ts:11074 hidden aria-hidden', [q(mount, '#cs-okolica-aux')?.hasAttribute('hidden'), q(mount, '#cs-okolica-aux')?.getAttribute('aria-hidden')], [true, 'true']);
    check('chrome.aux.children', 'cityPanel.ts:11075-11078', ['cs-oksurowce', 'cs-okolica', 'cs-okstats', 'cs-okhint'].map((id) => !!q(mount, '#cs-okolica-aux > #' + id)), [true, true, true, true]);
    check('chrome.stats.class', 'cityPanel.ts:11077 okstats is-collapsed', q(mount, '#cs-okstats')?.className, 'okstats is-collapsed');
    q(mount, '#civ-v-map-close').click();
    check('chrome.click', 'cityPanel.ts:11079 closeCityView(onClose)', [calls.slice(), n], [['clearGarrisonPanel', 'disposeHoverDetailDock'], 1]);
  }

  // ─── withW4TabCard (pin :11651-11667) ───────────────────────────────────────────────────────────────────────────
  {
    const parent = fresh();
    let seen = null;
    m.withW4TabCard(parent, 'cs-x', city, (body) => { seen = body; body.dataset.probe = '1'; }, { scrollable: true });
    const card = q(parent, ':scope > div');
    check('w4.scroll.card', 'cityPanel.ts:11656 civ-w4-tab-card--scroll', card?.className, 'civ-w4-tab-card civ-w4-tab-card--scroll');
    check('w4.id', 'cityPanel.ts:11657 card.id', card?.id, 'cs-x');
    check('w4.body', 'cityPanel.ts:11659-11660 body class', seen?.className, 'civ-w4-tab-body civ-w4-tab-body--scroll');
    check('w4.body.parent', 'cityPanel.ts:11662 card.appendChild(body)', seen?.parentElement === card, true);
    const p2 = fresh();
    m.withW4TabCard(p2, undefined, city, () => {}, undefined);
    const c2 = q(p2, ':scope > div');
    check('w4.plain.card', 'cityPanel.ts:11656 bez opts', c2?.className, 'civ-w4-tab-card');
    check('w4.plain.noid', 'cityPanel.ts:11657 brak id gdy undefined', c2?.hasAttribute('id'), false);
    check('w4.plain.body', 'cityPanel.ts:11659 body bez scroll', q(c2, ':scope > div')?.className, 'civ-w4-tab-body');
  }

  // ─── renderOwnedBuildingsBar (pin :9273-9293) ───────────────────────────────────────────────────────────────────
  {
    host.cfg.getBuiltBuildingIds = undefined;
    let mount = fresh();
    m.renderOwnedBuildingsBar(mount, city, null);
    const bar = q(mount, 'button.bld-owned-bar');
    check('owned.cfg-undef.label', 'cityPanel.ts:9276 count ?? 0', bar?.getAttribute('aria-label'), 'Budynki w mieście (0) — pokaż szczegóły');
    check('owned.type', 'cityPanel.ts:9277 type=button', bar?.type, 'button');
    check('owned.chev', 'cityPanel.ts:9290 chevron', q(bar, '.bld-owned-chevron')?.textContent, 'ℹ szczegóły');
    check('owned.left.text', 'cityPanel.ts:9284 span text', q(bar, ':scope > span:first-child > span:last-child')?.textContent, 'Budynki w mieście (0)');
    check('owned.left.style', 'cityPanel.ts:9285 cssText', q(bar, ':scope > span').getAttribute('style'), 'display: inline-flex; align-items: center; gap: 0.4em;');
    check('owned.single', 'cityPanel.ts:9276-9292 jeden przycisk w mount', qa(mount, 'button').length, 1);

    host.cfg.getBuiltBuildingIds = (cid) => (cid === 1 ? ['a', 'b', 'c'] : undefined);
    mount = fresh();
    m.renderOwnedBuildingsBar(mount, city, null);
    check('owned.count3', 'cityPanel.ts:9276 built.length = 3', q(mount, 'button.bld-owned-bar')?.getAttribute('aria-label'), 'Budynki w mieście (3) — pokaż szczegóły');
    mount.innerHTML = '<p>stare</p>';
    m.renderOwnedBuildingsBar(mount, city, null);
    check('owned.clears', 'cityPanel.ts:9274 mount.innerHTML = ""', qa(mount, 'p').length, 0);
    host.cfg.getBuiltBuildingIds = undefined;
  }

  // ─── renderOwnedBuildingsBar: ścieżka KLIK i HOVER (pin :9287-9291 -> ui/hoverDetailDock) ───────────────────────
  // Wektory używają liczby budynków 0 i data={} (karta: „(brak — zbuduj pierwszy)”), data=null daje „Brak danych gry”.
  // Delegaty K06B: `el` (k01b-dom) i wartość `cfg` (ten sam obiekt co host.cfg) — ścieżka built=[] nie woła innych
  // delegatów K06B. Ścieżka built≠[] (sumowanie utrzymania, grupy budynków) = NIE_ZMIERZONO (K08B §7).
  m.setK06bDeps({ el: m.el, cfg: host.cfg });
  {
    host.cfg.getBuiltBuildingIds = () => [];
    const mount = fresh();
    const dockL = document.createElement('div');
    const dockR = document.createElement('div');
    document.body.appendChild(dockL);
    document.body.appendChild(dockR);
    m.setHoverDetailDocks({ left: dockL, right: dockR });
    let parentClicks = 0;
    mount.addEventListener('click', () => parentClicks++);
    m.renderOwnedBuildingsBar(mount, city, {});
    const bar = q(mount, 'button.bld-owned-bar');
    bar.click();
    check('owned.click.stop', 'cityPanel.ts:9288 e.stopPropagation() (klik nie bąbelkuje do rodzica)', parentClicks, 0);
    check('owned.click.header', 'cityPanel.ts:9289 karta w docku: nagłówek', dockL.querySelector('.dc-h')?.textContent ?? null, 'Budynki w mieście (0)');
    check('owned.click.side', 'cityPanel.ts:9289 showHoverDetailNow(..., "left") -> dok lewy, nie prawy', [dockL.querySelector('.detail-card') !== null, dockR.querySelector('.detail-card') !== null], [true, false]);
    check('owned.click.data', 'cityPanel.ts:9289 buildOwnedBuildingsDetailCard(city, data) dostaje data (nie null)', dockL.querySelector('.dc-note')?.textContent ?? null, '(brak — zbuduj pierwszy)');

    // hover: attachHoverDetail(bar, …, 280, 'left') — karta dopiero po ~280 ms, strona lewa.
    m.setHoverDetailDocks(null);
    m.setHoverDetailDocks({ left: dockL, right: dockR });
    bar.dispatchEvent(new window.MouseEvent('mouseenter'));
    await new Promise((r) => setTimeout(r, 150));
    check('owned.hover.early', 'cityPanel.ts:9291 brak karty przed opóźnieniem 280 ms (sprawdzone po 150 ms)', dockL.querySelector('.detail-card') !== null, false);
    await new Promise((r) => setTimeout(r, 400));
    check('owned.hover.late', 'cityPanel.ts:9291 po 280 ms karta w docku lewym z danymi (data != null)', [dockL.querySelector('.dc-note')?.textContent ?? null, dockR.querySelector('.detail-card') !== null], ['(brak — zbuduj pierwszy)', false]);
    bar.dispatchEvent(new window.MouseEvent('mouseleave'));
    m.setHoverDetailDocks(null);
    host.cfg.getBuiltBuildingIds = undefined;
  }

  // ─── Adnotacje pomocnicze: scalePx (K08B-Z3) ────────────────────────────────────────────────────────────────────
  {
    m.setK07aScalePx(20);
    check('scale.accessor', 'K08B-Z3 getK07aScalePx() zwraca wartość z setK07aScalePx (round-trip akcesora)', m.getK07aScalePx(), 20);
    const mount = fresh();
    m.renderCityIconRail(mount, items, true, false);
    check('scale.vertical.unchanged', 'cityPanel.ts:11634 gałąź vertical (24px) ma pierwszeństwo przed iconPx', q(mount, '.civ-v-icon-glyph').style.width, '24px');
    m.setK07aScalePx(10);
  }
} catch (e) {
  console.error('run-k08b-rail: błąd harnessu:', e?.stack ?? e);
  exitCode = 2;
} finally {
  rmSync(TMP, { recursive: true, force: true });
}

if (exitCode === 0) {
  const bad = results.filter((r) => !r.ok);
  for (const r of bad) console.log(`DIFF ${r.id} [${r.pin}] got=${JSON.stringify(r.got)} want=${JSON.stringify(r.want)}`);
  console.log(`run-k08b-rail: ${results.length} porównań, ${bad.length} różnic`);
  exitCode = bad.length === 0 ? 0 : 1;
}
process.exit(exitCode);
