#!/usr/bin/env node
/**
 * run-k08a-units.mjs — test zachowania jednostek K08A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1, runda 1).
 *
 * Zasada: port (`src/ui/cityPanel/k08a-fundament.ts`) jest bundlowany esbuildem i wywoływany w Node z wektorami.
 * Oczekiwane wartości to semantyka pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`, linie w komentarzach przy każdym wektorze),
 * a NIE wynik portu. Efekty DOM (clearGarrisonPanel, disposeHoverDetailDock, isCityUxFrameOpen, rerender) są
 * zastąpione przez `setK08aDeps` z rejestratorem wywołań (K08A-Z2).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-k08a-units.mjs [--v2 <plik-portu>] [--tmp-dir <katalog poza repo>]
 * EXIT 0 <=> wszystkie wektory zgodne; 1 <=> >=1 niezgodność; 2 <=> błąd harnessu.
 */
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const V2_FILE = resolve(argOf('--v2') ?? join(V2_ROOT, 'src/ui/cityPanel/k08a-fundament.ts'));
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'k08a-units-'));

const results = [];
const check = (id, pin, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  results.push({ id, pin, ok, got, want });
};

try {
  // Wejście bundla: K08A + akcesory stanu K06A/K07A (lustra `activeCity`/`activeMap`/`activeOnClose`/`uxSectionRefresh`).
  const dir = dirname(V2_FILE);
  const entry = join(TMP, 'entry.ts');
  // Katalog statyczny v2 (ZAŁOŻENIE P5.2-Z1) instalowany PIERWSZYM modułem, zanim załadują się moduły z `staticCatalog()`.
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
      `export { setK06aActive, getK06aState } from ${JSON.stringify(join(dir, 'k06a-fundament.ts'))};`,
      `export { setK07aActiveCity, getK07aActiveCity, setK07aUxSectionRefresh, getK07aUxSectionRefresh, setK07aDeps } from ${JSON.stringify(join(dir, 'k07a-fundament.ts'))};`,
      '',
    ].join('\n'),
  );
  const outFile = join(TMP, 'k08a-bundle.mjs');
  // Importy `*.svg?raw` (Vite) → tekst pliku; w Node bez Vite.
  const rawPlugin = {
    name: 'raw-svg',
    setup(build) {
      build.onResolve({ filter: /\?raw$/ }, (a) => ({
        path: resolve(a.resolveDir, a.path.replace(/\?raw$/, '')),
        namespace: 'raw-file',
      }));
      build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (a) => ({
        contents: readFileSync(a.path, 'utf8'),
        loader: 'text',
      }));
    },
  };
  // `import.meta.glob('./brand/**/*.svg', {query:'?raw', eager})` (Vite) → literał obiektu z plikami SVG (klucze `./brand/…`).
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
  const m = await import(pathToFileURL(outFile).href);

  // Rejestrator zależności DOM/kontrolera (K08A-Z2).
  const calls = [];
  const fx = { open: true, rerenderCalls: 0 };
  m.setK08aDeps({
    rerender: () => { calls.push('rerender'); fx.rerenderCalls++; },
    clearGarrisonPanel: () => calls.push('clearGarrisonPanel'),
    disposeHoverDetailDock: () => calls.push('disposeHoverDetailDock'),
    isCityUxFrameOpen: () => fx.open,
  });
  const cityA = { id: 'c1', ownerId: 0, name: 'A', population: 3 };
  const onCloseCalls = { n: 0 };
  const reset = () => {
    calls.length = 0;
    fx.rerenderCalls = 0;
    m.setK07aUxSectionRefresh(null);
    m.setK07aActiveCity(null);
    m.setK06aActive(null, null, () => { onCloseCalls.n++; });
    m.setK08aActiveCityPanelTab('rekrutacja');
    onCloseCalls.n = 0;
  };

  // --- isCityPanelOpen (pin :11979-11981) ---
  reset();
  fx.open = true;
  check('isCityPanelOpen.open', 'cityPanel.ts:11980 return isCityUxFrameOpen()', m.isCityPanelOpen(), true);
  fx.open = false;
  check('isCityPanelOpen.closed', 'cityPanel.ts:11980', m.isCityPanelOpen(), false);

  // --- getOpenCityPanelCityId (pin :11984-11986) ---
  reset();
  check('getOpenCityPanelCityId.null', 'cityPanel.ts:11985 activeCity?.id ?? null', m.getOpenCityPanelCityId(), null);
  m.setK07aActiveCity(cityA);
  check('getOpenCityPanelCityId.id', 'cityPanel.ts:11985', m.getOpenCityPanelCityId(), 'c1');

  // --- refreshCityPanelIfOpen (pin :10337-10346) ---
  reset();
  fx.open = false;
  m.refreshCityPanelIfOpen();
  check('refreshCityPanelIfOpen.closed-noop', 'cityPanel.ts:10342 if (!isCityPanelOpen()) return', calls, []);
  fx.open = true;
  m.refreshCityPanelIfOpen();
  check('refreshCityPanelIfOpen.open-rerender', 'cityPanel.ts:10344-10345 resolveActiveCity; rerender', calls, ['rerender']);
  reset();
  let refreshed = 0;
  m.setK07aUxSectionRefresh(() => { refreshed++; });
  m.refreshCityPanelIfOpen();
  check('refreshCityPanelIfOpen.uxRefresh-wins', 'cityPanel.ts:10339-10341 uxSectionRefresh() i return', [refreshed, calls], [1, []]);

  // --- clearCityPanelUxMode (pin :10367-10374) ---
  reset();
  m.setK07aActiveCity(cityA);
  m.setK06aActive(cityA, null, () => { onCloseCalls.n++; });
  m.setK07aUxSectionRefresh(() => {});
  m.setK08aActiveCityPanelTab('spichlerz');
  const onCloseBefore = m.getK06aState().activeOnClose;
  m.clearCityPanelUxMode();
  check('clearCityPanelUxMode.calls', 'cityPanel.ts:10368 clearGarrisonPanel; :10373 disposeHoverDetailDock', calls, ['clearGarrisonPanel', 'disposeHoverDetailDock']);
  check('clearCityPanelUxMode.uxRefresh', 'cityPanel.ts:10369 uxSectionRefresh = null', m.getK07aUxSectionRefresh(), null);
  check('clearCityPanelUxMode.tab', 'cityPanel.ts:10370 activeCityPanelTab = budowa', m.getK08aActiveCityPanelTab(), 'budowa');
  check('clearCityPanelUxMode.activeCity', 'cityPanel.ts:10371 activeCity = null', m.getOpenCityPanelCityId(), null);
  check('clearCityPanelUxMode.activeMap', 'cityPanel.ts:10372 activeMap = null', m.getK06aState().activeMap, null);
  check('clearCityPanelUxMode.onCloseKept', 'pin nie zeruje activeOnClose (ta sama referencja)', m.getK06aState().activeOnClose === onCloseBefore, true);

  // --- closeCityView (pin :10694-10698) ---
  reset();
  m.setK07aActiveCity(cityA);
  let custom = 0;
  m.closeCityView(() => { custom++; });
  check('closeCityView.custom', 'cityPanel.ts:10696 if (onClose) onClose()', [custom, onCloseCalls.n], [1, 0]);
  check('closeCityView.cleared', 'cityPanel.ts:10695 clearCityPanelUxMode()', [m.getOpenCityPanelCityId(), calls], [null, ['clearGarrisonPanel', 'disposeHoverDetailDock']]);
  reset();
  m.closeCityView();
  check('closeCityView.default-onClose', 'cityPanel.ts:10697 else activeOnClose()', onCloseCalls.n, 1);

  // --- closeCityPanelIfOpen (pin :11971-11976) ---
  reset();
  fx.open = false;
  check('closeCityPanelIfOpen.closed', 'cityPanel.ts:11972 return false', [m.closeCityPanelIfOpen(), calls, onCloseCalls.n], [false, [], 0]);
  fx.open = true;
  check('closeCityPanelIfOpen.open', 'cityPanel.ts:11973-11975 clearGarrisonPanel; activeOnClose; return true', [m.closeCityPanelIfOpen(), calls, onCloseCalls.n], [true, ['clearGarrisonPanel'], 1]);

  // --- Stałe i czyste formatery (pin :11540-11593) ---
  check('CITY_PANEL_ICONS_LEFT.ids', 'cityPanel.ts:11554-11557', m.CITY_PANEL_ICONS_LEFT.map((x) => x.id), ['budowa', 'rekrutacja']);
  check('CITY_PANEL_ICONS_RIGHT.ids', 'cityPanel.ts:11559-11571', m.CITY_PANEL_ICONS_RIGHT.map((x) => x.id), ['spichlerz', 'handel', 'praca', 'porzadek', 'zdrowie', 'kultura', 'religia']);
  check('isProductionPanelTab.budowa', 'cityPanel.ts:11574', m.isProductionPanelTab('budowa'), true);
  check('isProductionPanelTab.spichlerz', 'cityPanel.ts:11574', m.isProductionPanelTab('spichlerz'), false);
  check('CADUCEUS_SVG.prefix', 'cityPanel.ts:11577-11578', m.CADUCEUS_SVG.startsWith('<svg viewBox="0 0 24 24"'), true);
  check('cityRailIconHtml.empty-unknown', 'cityPanel.ts:11588-11589 brandIconSvg null -> ""', m.cityRailIconHtml('__brak_ikony__'), '');

  // --- Akcesor zakładki K08A-Z3 (pin `let activeCityPanelTab`, :11593) ---
  reset();
  m.setK08aActiveCityPanelTab('spichlerz');
  check('accessor.tab-roundtrip', 'K08A-Z3 set/get activeCityPanelTab', m.getK08aActiveCityPanelTab(), 'spichlerz');
  m.setK08aActiveCityPanelTab('religia');
  check('accessor.tab-roundtrip-2', 'K08A-Z3 set/get activeCityPanelTab (ostatnia zakładka)', m.getK08aActiveCityPanelTab(), 'religia');

  // --- isProductionPanelTab: gałąź rekrutacji (pin :11574) ---
  check('isProductionPanelTab.rekrutacja', 'cityPanel.ts:11574 tab === rekrutacja', m.isProductionPanelTab('rekrutacja'), true);
  check('isProductionPanelTab.religia', 'cityPanel.ts:11574', m.isProductionPanelTab('religia'), false);

  // --- Ikony i tytuły paneli (pin :11554-11571, wartości dokładne) ---
  check('CITY_PANEL_ICONS_LEFT.iconIds', 'cityPanel.ts:11554-11557 iconId', m.CITY_PANEL_ICONS_LEFT.map((x) => x.iconId), ['cp-buildings', 'cp-recruit']);
  check('CITY_PANEL_ICONS_LEFT.titles', 'cityPanel.ts:11554-11557 title', m.CITY_PANEL_ICONS_LEFT.map((x) => x.title), ['Budowa — dostępne i w mieście', 'Jednostki do rekrutacji']);
  check('CITY_PANEL_ICONS_RIGHT.iconIds', 'cityPanel.ts:11559-11571 iconId', m.CITY_PANEL_ICONS_RIGHT.map((x) => x.iconId), ['cp-granary', 'cp-trade', 'cp-labor', 'cp-order', 'cp-health', 'cp-culture', 'cp-religion']);
  check('CITY_PANEL_ICONS_RIGHT.titles', 'cityPanel.ts:11559-11571 title', m.CITY_PANEL_ICONS_RIGHT.map((x) => x.title), [
    'Wyżywienie i wzrost — suwak 0–6',
    'Podział daniny/podatku i zamożność — suwaki Skarb / Nauka / Zamożność',
    'Podział pracy — budynki i pula imperium',
    'Społeczeństwo i porządek',
    'Zdrowie miasta',
    'Kultura — granice i progi',
    'Religia — wiara i szerzenie',
  ]);

  // --- CADUCEUS_SVG: pełny łańcuch (pin :11577-11585) ---
  check('CADUCEUS_SVG.full', 'cityPanel.ts:11577-11585 łańcuch znaków', m.CADUCEUS_SVG, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="9.2" x2="12" y2="21.5"/><circle cx="12" cy="7.4" r="1.35" fill="currentColor" stroke="none"/><path d="M12 8.6 C8.2 6.2 5.2 7.1 4 9.2"/><path d="M12 8.6 C15.8 6.2 18.8 7.1 20 9.2"/><path d="M9.6 10.8 C7.2 13.2 7.8 16.8 12 19.2"/><path d="M14.4 10.8 C16.8 13.2 16.2 16.8 12 19.2"/></svg>');

  // --- cityRailIconHtml: gałąź znanej ikony (pin :11590 podmiana klasy) ---
  const railHtml = m.cityRailIconHtml('cp-trade');
  check('cityRailIconHtml.known-class', 'cityPanel.ts:11590 svg.replace("<svg ", class=civ-cp-rail-ic)', railHtml.startsWith('<svg class="civ-cp-rail-ic" '), true);

  // --- clearCityPanelUxMode: lustra K06A (activeCity, activeMap) czyszczone razem (K08A-Z3) ---
  reset();
  m.setK07aActiveCity(cityA);
  m.setK06aActive(cityA, { __mapa: 'k08a' }, () => {});
  m.clearCityPanelUxMode();
  check('clearCityPanelUxMode.mirror-map', 'cityPanel.ts:10372 activeMap = null (lustro K06A)', m.getK06aState().activeMap, null);
  check('clearCityPanelUxMode.mirror-k06a-city', 'cityPanel.ts:10371 activeCity = null (lustro K06A)', m.getK06aState().activeCity, null);

  // --- resolveActiveCity w refreshCityPanelIfOpen (pin :10339/:10345; v2 = resolveK07aActiveCity, K08A-Z4) ---
  reset();
  m.setK07aDeps({ isMe: () => true, getCapitalCityId: () => null, getCities: () => [{ ...cityA, name: 'Odswiezona' }], canSetCapital: false, chipDeltaStockHtml: () => '' });
  m.setK07aActiveCity(cityA);
  fx.open = true;
  m.refreshCityPanelIfOpen();
  check('refreshCityPanelIfOpen.resolve-fresh', 'cityPanel.ts:10345 resolveActiveCity -> odświeżony obiekt z listy miast', m.getK07aActiveCity()?.name, 'Odswiezona');
  m.setK07aActiveCity(cityA);
  m.setK07aUxSectionRefresh(() => {});
  m.refreshCityPanelIfOpen();
  check('refreshCityPanelIfOpen.resolve-fresh-ux', 'cityPanel.ts:10340 resolveActiveCity przed uxSectionRefresh', m.getK07aActiveCity()?.name, 'Odswiezona');
  // --- resolveActiveCity (pin :10339/:10345: JEDNO activeCity) -> resolveK08aActiveCity (r3, K08A-Z4): lustro K06A ---
  reset();
  m.setK07aDeps({ isMe: () => true, getCapitalCityId: () => null, getCities: () => [{ ...cityA, name: 'Odswiezona' }], canSetCapital: false, chipDeltaStockHtml: () => '' });
  fx.open = true;
  m.setK07aActiveCity(cityA);
  m.setK06aActive(cityA, { __mapa: 'k08a-r3' }, () => {});
  const onCloseR3 = m.getK06aState().activeOnClose;
  m.refreshCityPanelIfOpen();
  check('refreshCityPanelIfOpen.k06-mirror-sync', 'cityPanel.ts:10345 jedno activeCity: lustro K06A = świeży obiekt z listy (r3)', m.getK06aState().activeCity?.name, 'Odswiezona');
  check('refreshCityPanelIfOpen.k06-mirror-same-as-k07', 'cityPanel.ts:10345 jedno activeCity: K06A i K07A to ten sam obiekt (r3)', m.getK06aState().activeCity === m.getK07aActiveCity(), true);
  check('refreshCityPanelIfOpen.k06-mirror-map-kept', 'K08A-Z4 sync nie rusza activeMap (r3)', m.getK06aState().activeMap?.__mapa, 'k08a-r3');
  check('refreshCityPanelIfOpen.k06-mirror-onclose-kept', 'K08A-Z4 sync nie rusza activeOnClose (r3)', m.getK06aState().activeOnClose === onCloseR3, true);
  check('refreshCityPanelIfOpen.k06-mirror-rerender', 'cityPanel.ts:10346 rerender po synchronizacji (r3)', calls, ['rerender']);
  // ścieżka UX: synchronizacja lustra K06A PRZED uxSectionRefresh (pin :10340 resolve przed wywołaniem)
  reset();
  m.setK07aActiveCity(cityA);
  m.setK06aActive(cityA, null, () => {});
  let seenK06 = null;
  m.setK07aUxSectionRefresh(() => { seenK06 = m.getK06aState().activeCity?.name ?? null; });
  m.refreshCityPanelIfOpen();
  check('refreshCityPanelIfOpen.k06-mirror-before-ux', 'cityPanel.ts:10340 resolve (w tym lustro K06A) przed uxSectionRefresh (r3)', seenK06, 'Odswiezona');
  // brak miasta w K07A: lustro K06A zerowane (activeOnClose zostaje)
  reset();
  m.setK07aActiveCity(null);
  m.setK06aActive(cityA, null, () => {});
  m.refreshCityPanelIfOpen();
  check('refreshCityPanelIfOpen.k06-mirror-null-city', 'K08A-Z4 brak miasta -> lustro K06A null (r3)', m.getK06aState().activeCity, null);
  // inne id w lustrze K06A: sync nie nadpisuje (pin nie ma takiego stanu; dziedzina brzegowa)
  reset();
  m.setK07aActiveCity(cityA);
  m.setK06aActive({ ...cityA, id: 'c9', name: 'Inne' }, null, () => {});
  m.refreshCityPanelIfOpen();
  check('refreshCityPanelIfOpen.k06-mirror-other-id', 'K08A-Z4 lustro K06A o innym id nie nadpisane (r3)', m.getK06aState().activeCity?.name, 'Inne');
  m.setK07aDeps(null);

  // --- Dziedziny brzegowe: brak deps = wyjątek (nie cicha utrata efektu) ---
  m.setK08aDeps(null);
  let threw = false;
  let threwMsg = '';
  try { m.isCityPanelOpen(); } catch (e) { threw = true; threwMsg = String(e && e.message); }
  check('deps.null-throws', 'K08A-Z2 brak setK08aDeps = wyjątek', threw, true);
  check('deps.null-message', 'K08A-Z2 komunikat wyjątku wskazuje setK08aDeps', threwMsg.includes('setK08aDeps'), true);
} catch (err) {
  console.error('run-k08a-units: błąd harnessu:', err);
  rmSync(TMP, { recursive: true, force: true });
  process.exit(2);
}
rmSync(TMP, { recursive: true, force: true });

const bad = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'DIFF'} ${r.id} [${r.pin}]${r.ok ? '' : ` got=${JSON.stringify(r.got)} want=${JSON.stringify(r.want)}`}`);
console.log(`run-k08a-units: wektorów=${results.length} różnic=${bad.length}`);
process.exit(bad.length === 0 ? 0 : 1);
