#!/usr/bin/env node
/**
 * run-repin-ui2f.mjs — harness partii REPIN UI-2-F (R-RUSTPORT-REPIN-UI-2-F-Q1): kreator nowej gry `newGameFlow.ts`
 * (port DOM, P5.7 r2) przepięty z pinu `edb8fb56` na web `origin/main` `86d510c66`.
 *
 * WEB:  `gra/src/ui/newGameFlow.ts` z URUCHOMIONEGO weba — katalog `git archive 86d510c66 gra/src gra/data` (`--web-dir`),
 *       spakowany `build.mjs` (emulacja Vite; obraz hero jako prawdziwy `data:` PNG) i WYKONANY w Chromium (Playwright,
 *       `/opt/node-tools`), dane gry = `loadGameData()` weba.
 * PORT: `src/ui/newGameFlow.ts` frontend-v2 (`--src`), ten sam `build.mjs`, ta sama instancja Chromium. Harness gra rolę
 *       „Rust”: `StaticCatalogDto` (civs, cityNamesPools, uiParams = `gra/data/ui-params.json` weba, stałe kreatora
 *       = `map/newGameMapDefaults.ts` weba) i `NewGameQueriesProvider` z FUNKCJI WEBA (`newGameMapDefaults`,
 *       `start-preview` + `summaryRows`, `civ-matrix-semantic` → pola `CivMatrixCellDto`) — jak `run-newgame.mjs`.
 *
 * Scenariusze (lista `SCEN` niżej) pokrywają hunki weba `edb8fb56 → 86d510c66` (P5-REPIN-UI-2 §1 #23): nowe domyślne
 * „Zaawansowane opcje”, nowy układ siatki kroku 4 (12 pozycji, w tym przeniesione udział lądu / trudność miast-państw /
 * barbarzyńcy / warunki zwycięstwa), Ziemia bez suwaka lądu + wiersz podsumowania „szablon kontynentów”, przerysowanie
 * po zmianie typu świata, nowe ustawienia „Wymagaj rozpatrzenia ofert…” (`dealsEndTurnGate`) i „Wojna epoki”
 * (`playerEpochWarEnabled`), glify ikon spoza `SETTING_SVG_KEYS`, przełącznik „Pokaż/Ukryj parametry cywilizacji”
 * (+ reset przy ponownym otwarciu), komórki macierzy jako `<details>`, liczba wskaźników z danych, usunięte bonusy,
 * fotel 2 z profilem macierzy i jednostką specjalną, przycisk startu w pasku nawigacji (+ `data-seat-ready`, disabled),
 * „Zastosuj” w oknie zaawansowanym, etykiety bitew, CSS (przewijanie `.content`, pasek `.nav`, media 900px / 760px).
 *
 * Porównanie (EXIT 0 ⇔ wszystkie zgodne):
 *   DOM   kanoniczna serializacja `document.body` + log akcji (`onStart` z pełnym JSON parametrów, `summaryRows`,
 *         `onCancel`) + `localStorage` po każdym scenariuszu — przy 1280×720 i ponownie po zmianie na 360×640;
 *   PIX   zrzuty PNG (viewport 1280×720 i 360×640, `animations: 'disabled'`) web vs port: bajty PNG równe (próg 0);
 *   ERR   `pageerror` + `console.error` = 0 po obu stronach;
 *   COVER każdy scenariusz z `expect` spełnia warunek na stronie WEB (harness rzeczywiście dotyka hunku).
 * Zapis fiksatury: `--out <plik.json>` (wyniki WEB + sha256 PNG; `webVectorsSha256` — niezależny weryfikator porównuje
 * hash z 2 osobnych katalogów `git archive`).
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-repin-ui2f.mjs --web-dir <WEB_DIR> [--src <katalog src>] [--out <plik>] [--tmp-dir <dir>]
 *        [--chromium <ścieżka>] [--only <fragment nazwy>] [--no-png]
 * EXIT 0 ⇔ brak różnic; 1 ⇔ ≥ 1 różnica; 2 ⇔ błąd harnessu.
 */
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
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
  console.error('Użycie: node tools/dom-harness/run-repin-ui2f.mjs --web-dir <katalog z gra/src i gra/data 86d510c66> [--src <src>] [--out <plik>]');
  process.exit(2);
}
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const WEB_SRC = join(resolve(WEB_DIR), 'gra/src');
const WEB_DATA = join(resolve(WEB_DIR), 'gra/data');
const OUT = argOf('--out');
const ONLY = argOf('--only');
const NO_PNG = args.includes('--no-png');
const PNG_DIR = argOf('--png-dir'); // diagnostyka: zapis zrzutów `<scenariusz>-<strona>-<w>x<h>.png`
const CHROMIUM = argOf('--chromium') ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PW_DIR = argOf('--playwright') ?? '/opt/node-tools/node_modules/playwright';
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'repin-ui2f-'));
const VIEWPORTS = [[1280, 720], [360, 640]];

for (const p of [join(WEB_SRC, 'ui/newGameFlow.ts'), join(SRC, 'ui/newGameFlow.ts'), join(WEB_DATA, 'ui-params.json')]) {
  if (!existsSync(p)) {
    console.error(`BRAK ${p}`);
    process.exit(2);
  }
}

const J = (p) => JSON.stringify(p);
function writeEntries() {
  const web = join(TMP, 'entry-web.ts');
  writeFileSync(web, [
    `import { loadGameData } from ${J(join(WEB_SRC, 'data/loader'))};`,
    `import { startPreviewSummaryRows } from ${J(join(WEB_SRC, 'game/start-preview'))};`,
    `import * as flow from ${J(join(WEB_SRC, 'ui/newGameFlow'))};`,
    `(globalThis as any).__ng = { side: 'web', flow, data: loadGameData(), summaryRows: (p: any) => startPreviewSummaryRows(p) };`,
    '',
  ].join('\n'));
  const port = join(TMP, 'entry-port.ts');
  // „Rust” = funkcje i dane WEBA (tak jak `run-newgame.mjs` używa pinu); kreator portu importowany dynamicznie PO
  // instalacji katalogu i dostawcy (ZAŁOŻENIE P5.2-Z1: moduł czyta katalog przy ewaluacji).
  writeFileSync(port, [
    `import { loadGameData } from ${J(join(WEB_SRC, 'data/loader'))};`,
    `import * as ND from ${J(join(WEB_SRC, 'map/newGameMapDefaults'))};`,
    `import * as SP from ${J(join(WEB_SRC, 'game/start-preview'))};`,
    `import * as CM from ${J(join(WEB_SRC, 'game/civ-matrix-semantic'))};`,
    `import uiParams from ${J(join(WEB_DATA, 'ui-params.json'))};`,
    `import { installStaticCatalog } from ${J(join(SRC, 'controller/staticCatalog'))};`,
    `import { installNewGameQueries } from ${J(join(SRC, 'controller/newGameQueries'))};`,
    `const data: any = loadGameData();`,
    `const catalog: any = {`,
    `  contentHash: 'harness-web-86d510c66', buildings: [], units: [], tech: { technologie: [] }, terrainImprovements: {},`,
    `  wonders: { cuda: [] }, counters: {}, civs: data.civs, cityNamesPools: data.cityNamesPools, powerParams: {},`,
    `  uiParams: JSON.parse(JSON.stringify(uiParams)), wiki: { poradnik: [], encyklopedia: [] },`,
    `  constants: { newGameDefaultPlayerCivId: ND.DEFAULT_PLAYER_CIV_ID, newGameDefaultStartEpochId: ND.DEFAULT_START_EPOCH_ID,`,
    `    newGameDefaultRenderQuality: ND.DEFAULT_RENDER_QUALITY, maxTypyCywilizacjiMenu: ND.MAX_TYPY_CYWILIZACJI_MENU,`,
    `    landFractionPercentOpts: [...ND.LAND_FRACTION_PERCENT_OPTS] },`,
    `  labels: {}, unitCategory: {}, unitCategoryNameOnly: {}, techTerrainUnlockLabels: {},`,
    `};`,
    `const ORDER = ['kamien', 'braz', 'zelazo'];`,
    `const idx = (id: string) => { const i = ORDER.indexOf(id); return i >= 0 ? i : ORDER.length; };`,
    `const minIdx = (ep: readonly string[]) => (ep.length === 0 ? 0 : Math.min(...ep.map(idx)));`,
    `const used: string[] = [];`,
    `const q = (n: string, f: any) => (...a: any[]) => { used.push(n); return f(...a); };`,
    `installStaticCatalog(catalog);`,
    `installNewGameQueries({`,
    `  miastaPanstwaMenuForMapLabel: q('miastaPanstwaMenuForMapLabel', (l: string) => ND.miastaPanstwaMenuForMapLabel(l)),`,
    `  civTypesMenuForMapLabel: q('civTypesMenuForMapLabel', (l: string, e: string, r: any) => ND.civTypesMenuForMapLabel(l, e, r)),`,
    `  defaultMiastaPanstwaFromMapLabel: q('defaultMiastaPanstwaFromMapLabel', (l: string) => ND.defaultMiastaPanstwaFromMapLabel(l)),`,
    `  defaultCivTypesFromMapLabel: q('defaultCivTypesFromMapLabel', (l: string, e: string, r: any) => ND.defaultCivTypesFromMapLabel(l, e, r)),`,
    `  maxCivTypesForStartEpoch: q('maxCivTypesForStartEpoch', (e: string, r: any) => ND.maxCivTypesForStartEpoch(e, r)),`,
    `  clampMiastaPanstwaCount: q('clampMiastaPanstwaCount', (n: number) => ND.clampMiastaPanstwaCount(n)),`,
    `  typSwiataFromMenuLabel: q('typSwiataFromMenuLabel', (l: string) => ND.typSwiataFromMenuLabel(l)),`,
    `  defaultLandFractionPercentForTyp: q('defaultLandFractionPercentForTyp', (t: any) => ND.defaultLandFractionPercentForTyp(t)),`,
    `  worldGenerationPresetFromLabels: q('worldGenerationPresetFromLabels', (x: any) => ND.worldGenerationPresetFromLabels(x)),`,
    `  buildStartPreview: q('buildStartPreview', (input: any) => { const p: any = SP.buildStartPreview(input); return { ...p, summaryRows: SP.startPreviewSummaryRows(p) }; }),`,
    `  civMatrixProfile: q('civMatrixProfile', (civKey: string) => { const pr: any = CM.buildCivMatrixSemanticProfile(civKey); return {`,
    `    civilizationId: pr.civilizationId, civilizationName: pr.civilizationName, parameterCount: pr.parameterCount,`,
    `    activeCount: pr.activeCount, inactiveCount: pr.inactiveCount, blockedReasonPl: pr.blockedReasonPl,`,
    `    cells: pr.cells.map((c: any) => ({ paramLabel: CM.civMatrixParameterLabelPl(c.parameterId), formatted: CM.civMatrixFormattedValue(c.rawValue, c.unit),`,
    `      baselineFormatted: CM.civMatrixFormattedValue(c.baselineValue, c.unit), intensity: c.signedIntensity,`,
    `      intensityLabel: CM.civMatrixIntensityLabel(c.signedIntensity), visibleByDefault: CM.statusAllowsDefaultVisibility(c.consumerStatus),`,
    `      parameterId: c.parameterId, domain: c.domain, consumerStatus: c.consumerStatus, statusLabelPl: c.statusLabelPl,`,
    `      statusReasonPl: c.statusReasonPl, explanationPl: c.explanationPl, label: c.label, polarity: c.polarity })) }; }),`,
    `  civAvailableAtEpoch: q('civAvailableAtEpoch', (ep: readonly string[], e: string) => minIdx(ep) <= idx(e)),`,
    `} as any);`,
    `const flow = await import(${J(join(SRC, 'ui/newGameFlow'))});`,
    `(globalThis as any).__ng = { side: 'port', flow, data, used, summaryRows: null };`,
    '',
  ].join('\n'));
  return { web, port };
}

// ─── scenariusze ─────────────────────────────────────────────────────────────
// Operacje (interpretowane w stronie, identycznie po obu stronach):
//   ['prefs', klucz, json]  ['show', cfg]  ['hide']  ['click', selektor, i=0]  ['row', etykieta, kierunek 0|1, razy=1]
//   ['adv', etykieta, kierunek, razy] (wiersz okna „Zaawansowane opcje”)  ['nav'] (= `.nav .nb.next`)
// `expect` (COVER, strona WEB): [selektor, liczba|'>0'|'=0'] albo ['text', fragment] albo ['log', fragment].
const S3 = [['show', 'dane'], ['click', '.cta-hero'], ['nav']];
const S4 = [...S3, ['nav']];
const PREFS_V4 = JSON.stringify({
  v: 4, selEpoch: 'braz', selCiv: 'egipt', settings: { difficulty: 2, map_size: 4 },
  settingLabels: { world_type: 'Ziemia', deals_end_turn_gate: 'Wyłączona', player_epoch_war: 'Wyłączona', village_rewards_enabled: 'Wyłączone' },
  advanced: { barbariansLevel: 'trudny', battleAlwaysManual: false, victoryMode: 'moc', cityStateDifficultyOverride: null, cityLimitBase: 15 },
});
const SCEN = [
  { name: 'k1-intro', ops: [['show', 'dane']], png: true },
  { name: 'k2-epoka', ops: [['show', 'dane'], ['click', '.cta-hero']], png: true },
  { name: 'k3-cyw-profil-zwiniety', ops: S3, png: true, expect: [['.civ-layout.civ-profile-collapsed', 1], ['.civ-profile-toggle[aria-expanded="false"]', 1], ['.civ-matrix-cell', '>0'], ['article.civ-matrix-cell', '=0'], ['.bonus', '=0'], ['text', 'Parametry cywilizacji'], ['text', 'Styl: ']] },
  { name: 'k3-cyw-profil-rozwiniety', ops: [...S3, ['click', '.civ-profile-toggle']], png: true, expect: [['.civ-layout:not(.civ-profile-collapsed)', 1], ['.civ-profile-toggle[aria-expanded="true"]', 1], ['text', 'Ukryj parametry cywilizacji']] },
  { name: 'k3-profil-x2', ops: [...S3, ['click', '.civ-profile-toggle'], ['click', '.civ-profile-toggle']], expect: [['.civ-layout.civ-profile-collapsed', 1]] },
  { name: 'k3-komorka-details', ops: [...S3, ['click', '.civ-profile-toggle'], ['click', '.civ-matrix-cell > summary', 0], ['click', '.civ-matrix-cell > summary', 3]], png: true, expect: [['details.civ-matrix-cell[open]', 2], ['.civ-matrix-cell-chevron', '>0'], ['.civ-matrix-cell-body', '>0']] },
  { name: 'k3-inna-cyw', ops: [...S3, ['click', '.civ-grid .card:not(.disabled)', 5], ['click', '.civ-profile-toggle']], expect: [['text', 'wskaźników']] },
  { name: 'k3-filtr-szukaj', ops: [...S3, ['click', '.civ-profile-toggle'], ['input', '[data-civ-matrix-search]', 'walka'], ['input', '[data-civ-matrix-filter]', 'inactive']], expect: [['text', 'Widoczne:']] },
  { name: 'k3-ponowne-otwarcie-resetuje-profil', ops: [...S3, ['click', '.civ-profile-toggle'], ['hide'], ...S3], expect: [['.civ-layout.civ-profile-collapsed', 1]] },
  { name: 'k4-ustawienia', ops: S4, png: true, expect: [['.sett-grid .srow', 12], ['.nav .nb.next[data-seat-ready="true"]', 1], ['.sett-actions .start', '=0'], ['.ng-glyph', '>0'], ['text', 'Wojna epoki'], ['text', 'Udział lądu']] },
  { name: 'k4-zaawansowane', ops: [...S4, ['click', '.btn-adv']], png: true, expect: [['.adv-overlay.open', 1], ['button.adv-close[type="button"]', 1], ['text', 'Zastosuj'], ['text', 'Wymagaj rozpatrzenia']] },
  { name: 'k4-start-domyslne', ops: [...S4, ['nav']], png: true, expect: [['log', '"battleAlwaysManual":true'], ['log', '"dealsEndTurnGate":true'], ['log', '"playerEpochWarEnabled":true'], ['log', '"buildingCostPace":"normalny"'], ['log', '"cityStateDifficultyOverride":"normal"']] },
  { name: 'k4-typ-pangea', ops: [...S4, ['row', 'Typ świata', 1, 1], ['nav']], expect: [['log', '"typSwiata":"pangea"']] },
  { name: 'k4-typ-wyspy', ops: [...S4, ['row', 'Typ świata', 1, 2]], expect: [['text', 'Udział lądu']] },
  { name: 'k4-typ-ziemia', ops: [...S4, ['row', 'Typ świata', 1, 3]], png: true, expect: [['.sett-grid .srow', 11]] },
  { name: 'k4-typ-ziemia-start', ops: [...S4, ['row', 'Typ świata', 0, 1], ['nav']], expect: [['text', 'szablon kontynentów']] },
  { name: 'k4-wojna-epoki-off', ops: [...S4, ['row', 'Wojna epoki', 1, 1], ['nav']], expect: [['log', '"playerEpochWarEnabled":false']] },
  { name: 'k4-oferty-off', ops: [...S4, ['click', '.btn-adv'], ['adv', 'Wymagaj rozpatrzenia ofert handlowych przed końcem tury', 1, 1], ['click', '.adv-close'], ['nav']], expect: [['log', '"dealsEndTurnGate":false']] },
  { name: 'k4-bitwy-auto', ops: [...S4, ['click', '.btn-adv'], ['adv', 'Bitwy', 1, 1], ['click', '.adv-close'], ['nav']], expect: [['log', '"battleAlwaysManual":false'], ['text', 'Bitwa automatyczna']] },
  { name: 'k4-zaawansowane-wszystkie', ops: [...S4, ['click', '.btn-adv'], ['advAll'], ['click', '.adv-close'], ['nav']] },
  { name: 'k4-siatka-dodatkowe', ops: [...S4, ['row', 'Udział lądu na mapie', 1, 2], ['row', 'Trudność miast-państw', 0, 1], ['row', 'Barbarzyńcy', 1, 3], ['row', 'Warunki zwycięstwa', 1, 1], ['row', 'Chatki z nagrodami', 1, 1], ['nav']] },
  { name: 'k4-siatka-cykle', ops: [...S4, ['rowAll'], ['nav']] },
  { name: 'k4-fotel2', ops: [...S4, ['click', '.seat2-toggle-btn']], expect: [['text', 'Dalej']] },
  { name: 'k4-fotel2-ekran', ops: [...S4, ['click', '.seat2-toggle-btn'], ['nav']], png: true, expect: [['.nav .nb.next[data-seat-ready="true"]', 1], ['text', 'Rozpocznij grę']] },
  { name: 'getCivs1-fotel2-niegotowy', ops: [['show', 'getCivs1'], ['click', '.cta-hero'], ['nav'], ['nav'], ['click', '.seat2-toggle-btn'], ['nav'], ['nav']], expect: [['.nav .nb.next[disabled]', 1], ['.nav .nb.next[data-seat-ready="false"]', 1], ['text', 'Brak innej cywilizacji']] },
  { name: 'k4-fotel2-wybor', ops: [...S4, ['click', '.seat2-toggle-btn'], ['nav'], ['click', '.civ-grid .card:not(.disabled):not(.sel)', 3], ['click', '.civ-profile-toggle']], png: true, expect: [['.nav .nb.next[data-seat-ready="true"]', 1], ['.su', 1], ['.civ-matrix-profile', 1], ['text', 'Cywilizacja fotela 2']] },
  { name: 'k4-fotel2-start', ops: [...S4, ['click', '.seat2-toggle-btn'], ['nav'], ['click', '.civ-grid .card:not(.disabled):not(.sel)', 3], ['click', '.seat2-dist-opt', 0], ['nav']], expect: [['log', 'onStart(']] },
  { name: 'k4-fotel2-wstecz', ops: [...S4, ['click', '.seat2-toggle-btn'], ['nav'], ['click', '.nav .nb.back']] },
  { name: 'k4-wstecz-k3', ops: [...S4, ['click', '.nav .nb.back']] },
  { name: 'prefs-v4-ziemia', ops: [['prefs', 'civ-new-game-prefs-v1', PREFS_V4], ...S4], expect: [['.sett-grid .srow', 11]] },
  { name: 'prefs-v4-start', ops: [['prefs', 'civ-new-game-prefs-v1', PREFS_V4], ...S4, ['nav']], expect: [['log', '"dealsEndTurnGate":false'], ['log', '"playerEpochWarEnabled":false']] },
  { name: 'getCivs-k3', ops: [['show', 'getCivs'], ['click', '.cta-hero'], ['nav'], ['click', '.civ-grid .card', 0], ['click', '.civ-profile-toggle']] },
  { name: 'getCivs-start', ops: [['show', 'getCivs'], ['click', '.cta-hero'], ['nav'], ['nav'], ['nav']] },
  // Pusty stan panelu szczegółów (selCiv = null): lista `getCivs` opróżniona po wejściu na krok 3 + przerysowanie.
  { name: 'k3-pusty-profil', ops: [['show', 'znikajace'], ['click', '.cta-hero'], ['nav'], ['flag'], ['click', '.civ-grid .card', 1]], png: true, expect: [['text', 'aby zobaczyć jej parametry i jednostkę specjalną.'], ['.detail .empty', 1]] },
  { name: 'menu-glowne', ops: [['show', 'dane'], ['click', '.cta-menu-back']] },
];

/** Interpreter scenariusza — wykonywany w stronie (web i port identycznie). */
const DRIVER = async (sc) => {
  const G = globalThis.__ng;
  const log = [];
  Math.random = () => 0.4242;
  Date.now = () => 1792665015000;
  const sleep = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  const $$ = (sel) => [...document.querySelectorAll('.civ-newgame ' + sel)];
  const onStart = (params) => {
    const p = JSON.parse(JSON.stringify(params));
    if (p.startPreview) {
      if (G.side === 'port') { log.push('summaryRows=' + JSON.stringify(p.startPreview.summaryRows)); delete p.startPreview.summaryRows; }
      else log.push('summaryRows=' + JSON.stringify(G.summaryRows(params.startPreview)));
    }
    log.push('onStart(' + JSON.stringify(p) + ')');
  };
  const CFG = {
    dane: () => ({ data: G.data, onStart, onCancel: () => log.push('onCancel()') }),
    getCivs: () => ({
      data: G.data, onStart, onCancel: () => log.push('onCancel()'),
      getCivs: () => [
        { id: 'rzymianie', name: 'Rzym', styl: 'Wojna', religia: 'Jowisz', typGlowny: 'Militarny', superJednostka: 'Legion', epokaWejscia: 'kamien', epokiStartowe: ['kamien'], kolorHex: '#aa0000' },
        { id: 'egipt', name: 'Egipt', epokaWejscia: 'braz', epokiStartowe: ['braz', 'zelazo'] },
        { id: 'grecy', name: 'Grecy', styl: 'Handel', epokaWejscia: 'kamien', epokiStartowe: ['kamien'] },
      ],
    }),
    znikajace: () => ({
      data: G.data, onStart, onCancel: () => log.push('onCancel()'),
      getCivs: () => (globalThis.__ngEmpty ? [] : [
        { id: 'rzymianie', name: 'Rzym', styl: 'Wojna', epokaWejscia: 'kamien', epokiStartowe: ['kamien'] },
        { id: 'grecy', name: 'Grecy', epokaWejscia: 'kamien', epokiStartowe: ['kamien'] },
      ]),
    }),
    getCivs1: () => ({
      data: G.data, onStart, onCancel: () => log.push('onCancel()'),
      getCivs: () => [{ id: 'rzymianie', name: 'Rzym', styl: 'Wojna', epokaWejscia: 'kamien', epokiStartowe: ['kamien'] }],
    }),
  };
  const rowsByLabel = (rowSel, lblSel, lbl) => [...document.querySelectorAll('.civ-newgame ' + rowSel)].filter((r) => r.querySelector(lblSel)?.textContent === lbl);
  const missing = [];
  localStorage.clear();
  for (const op of sc.ops) {
    const [k, a, b, c] = op;
    if (k === 'prefs') localStorage.setItem(a, b);
    else if (k === 'show') G.flow.showNewGameFlow(CFG[a]());
    else if (k === 'hide') G.flow.hideNewGameFlow();
    else if (k === 'flag') globalThis.__ngEmpty = true;
    else if (k === 'click') { const el = $$(a)[b ?? 0]; if (el) el.click(); else missing.push(a + '#' + (b ?? 0)); }
    else if (k === 'nav') { const el = $$('.nav .nb.next')[0]; if (el) el.click(); else missing.push('nav'); }
    else if (k === 'input') {
      const el = $$(a)[0];
      if (!el) missing.push(a);
      else { el.value = b; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
    } else if (k === 'row' || k === 'adv') {
      for (let i = 0; i < (c ?? 1); i++) {
        const row = k === 'row' ? rowsByLabel('.sett-grid .srow', '.sl', a)[0] : rowsByLabel('.adv-row', '.adv-lbl', a)[0];
        if (!row) { missing.push(k + ':' + a); break; }
        row.querySelectorAll('.arr')[b]?.click();
        await sleep();
      }
    } else if (k === 'advAll' || k === 'rowAll') {
      const n = $$(k === 'advAll' ? '.adv-row' : '.sett-grid .srow').length;
      for (let i = 0; i < n; i++) {
        for (let t = 0; t <= i % 4; t++) {
          const row = $$(k === 'advAll' ? '.adv-row' : '.sett-grid .srow')[i];
          row?.querySelectorAll('.arr')[1]?.click();
          await sleep();
        }
      }
    }
    await sleep();
  }
  log.push('open=' + G.flow.isNewGameFlowOpen());
  if (missing.length) log.push('BRAK:' + missing.join(','));
  const ls = ['civ-new-game-prefs-v1', 'civ-newgame-prefs-v2'].map((k) => `ls[${k}]=${localStorage.getItem(k)}`);
  return { log, ls, missing };
};

/** Kanoniczna serializacja `document.body` (+ `<head>` stylów) — w stronie. */
const SER = () => {
  const ser = (node) => {
    if (node.nodeType === 3) return JSON.stringify(node.data);
    if (node.nodeType === 8) return `<!--${node.data}-->`;
    if (node.nodeType !== 1) return '';
    const tag = node.tagName.toLowerCase();
    if (tag === 'script') return ''; // wejście harnessu (`entry-web.js` / `entry-port.js`) — nie część kreatora
    const attrs = [...node.attributes].map((a) => `${a.name}=${JSON.stringify(a.value)}`).sort().join(' ');
    const open = node.tagName === 'DETAILS' ? ` [open=${node.open}]` : '';
    return `<${tag}${attrs ? ' ' + attrs : ''}${open}>${[...node.childNodes].map(ser).join('')}</${tag}>`;
  };
  const styles = [...document.head.querySelectorAll('style')].map((s) => s.id + ':' + s.textContent).join('\n');
  const scroll = [...document.querySelectorAll('.civ-newgame, .civ-newgame .content')].map((e) => `${e.className}:${e.scrollHeight}x${e.clientHeight}`).join('|');
  return { body: ser(document.body), styles, layout: scroll };
};

function evalCover(exp, side) {
  const out = [];
  for (const e of exp ?? []) {
    let ok;
    if (e[0] === 'text') ok = side.texts.includes(e[1]);
    else if (e[0] === 'log') ok = side.log.join('\n').includes(e[1]);
    else {
      const n = side.counts[e[0]];
      ok = e[1] === '>0' ? n > 0 : e[1] === '=0' ? n === 0 : n === e[1];
    }
    out.push({ exp: e.join(' '), ok });
  }
  return out;
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png' };
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

const sha = (x) => createHash('sha256').update(x).digest('hex');
let exitCode = 0;
let browser = null;
const servers = [];
try {
  const entries = writeEntries();
  const sides = {};
  for (const side of ['web', 'port']) {
    const outdir = join(TMP, side);
    const pad = join(TMP, `pad-${side}.ts`);
    writeFileSync(pad, 'export {};\n');
    await bundle([entries[side], pad], outdir);
    const entryJs = readdirSync(outdir, { recursive: true }).map(String).find((f) => f.split('/').pop() === `entry-${side}.js`);
    if (!entryJs) throw new Error(`${side}: brak entry-${side}.js`);
    writeFileSync(join(outdir, 'index.html'), `<!doctype html><html lang="pl"><head><meta charset="utf-8"><link rel="icon" href="data:,"></head><body style="margin:0"><script type="module" src="./${entryJs}"></script></body></html>`);
    sides[side] = outdir;
  }
  const require = createRequire(join(PW_DIR, 'package.json'));
  const { chromium } = require(PW_DIR);
  browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--font-render-hinting=none', '--disable-gpu'] });
  const scen = SCEN.filter((s) => !ONLY || s.name.includes(ONLY));
  const res = { web: {}, port: {} };
  const errors = [];
  let ua = '';
  for (const side of ['web', 'port']) {
    const srv = await serve(sides[side]);
    servers.push(srv);
    for (const sc of scen) {
      // Każdy scenariusz = świeża strona (stan modułu kreatora od zera; `localStorage` czyszczony w DRIVER).
      const page = await browser.newPage({ viewport: { width: VIEWPORTS[0][0], height: VIEWPORTS[0][1] }, deviceScaleFactor: 1 });
      page.on('pageerror', (e) => errors.push(`${side}/${sc.name}: pageerror ${e.message}`));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(`${side}/${sc.name}: console.error ${m.text()}`); });
      await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
      await page.waitForFunction(() => globalThis.__ng !== undefined, null, { timeout: 60000 });
      if (!ua) ua = await page.evaluate(() => navigator.userAgent);
      const r = await page.evaluate(DRIVER, sc);
      const shots = [];
      const doms = [];
      for (const [w, h] of VIEWPORTS) {
        await page.setViewportSize({ width: w, height: h });
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map((im) => (im.complete ? 0 : new Promise((ok) => { im.onload = im.onerror = ok; }))));
          await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
        });
        doms.push(await page.evaluate(SER));
        if (sc.png && !NO_PNG) {
          // Animacje nieskończone (`cng-pulse`/`cng-spin`, kroki 5) zatrzymane arkuszem tylko na czas zrzutu, po obu stronach
          // identycznie (sama obecność animacji jest w porównaniu `styles`).
          shots.push(await page.screenshot({ animations: 'disabled', caret: 'hide', style: '*,*::before,*::after{animation:none!important;transition:none!important}' }));
          if (PNG_DIR) writeFileSync(join(PNG_DIR, `${sc.name}-${side}-${w}x${h}.png`), shots.at(-1));
        }
      }
      const counts = {};
      for (const e of sc.expect ?? []) if (e[0] !== 'text' && e[0] !== 'log') counts[e[0]] = await page.evaluate((s) => document.querySelectorAll('.civ-newgame ' + s).length, e[0]);
      const texts = await page.evaluate(() => document.body.textContent + '\n' + [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).join('\n'));
      if (side === 'port' && sc.name === 'k4-start-domyslne') r.used = await page.evaluate(() => [...new Set(globalThis.__ng.used)].sort());
      res[side][sc.name] = { ...r, doms, shots, counts, texts };
      await page.close();
    }
  }
  let diffs = 0;
  const fixture = [];
  for (const sc of scen) {
    const w = res.web[sc.name];
    const p = res.port[sc.name];
    const problems = [];
    const wl = JSON.stringify([w.log, w.ls]);
    const pl = JSON.stringify([p.log, p.ls]);
    if (wl !== pl) problems.push(`LOG różny: web=${wl.slice(0, 300)} port=${pl.slice(0, 300)}`);
    for (let i = 0; i < VIEWPORTS.length; i++) {
      for (const part of ['body', 'styles', 'layout']) {
        const a = w.doms[i][part];
        const b = p.doms[i][part];
        if (a !== b) {
          let k = 0;
          while (k < a.length && a[k] === b[k]) k++;
          problems.push(`DOM ${part} ${VIEWPORTS[i].join('×')} @${k}: web=${a.slice(Math.max(0, k - 60), k + 120)} | port=${b.slice(Math.max(0, k - 60), k + 120)}`);
        }
      }
      if (w.shots[i] && Buffer.compare(w.shots[i], p.shots[i]) !== 0) problems.push(`PIX ${VIEWPORTS[i].join('×')} różny`);
    }
    if (w.missing.length) problems.push(`BRAK elementów scenariusza (web): ${w.missing.join(',')}`);
    const cover = evalCover(sc.expect, w);
    for (const c of cover) if (!c.ok) problems.push(`COVER-FAIL ${c.exp}`);
    diffs += problems.length;
    console.log(`${sc.name.padEnd(38)} ${problems.length === 0 ? 'OK' : 'RÓŻNICE=' + problems.length} cover=${cover.filter((c) => c.ok).length}/${cover.length} png=${w.shots.length}`);
    for (const pr of problems.slice(0, 4)) console.log('   ' + pr);
    fixture.push({ name: sc.name, log: w.log, ls: w.ls, domSha256: w.doms.map((d) => sha(d.body + '\n' + d.styles + '\n' + d.layout)), pngSha256: w.shots.map((s) => sha(s)), cover });
  }
  const used = res.port['k4-start-domyslne']?.used;
  if (used) {
    const NEED = ['miastaPanstwaMenuForMapLabel', 'civTypesMenuForMapLabel', 'defaultMiastaPanstwaFromMapLabel', 'defaultCivTypesFromMapLabel',
      'maxCivTypesForStartEpoch', 'typSwiataFromMenuLabel', 'defaultLandFractionPercentForTyp', 'worldGenerationPresetFromLabels',
      'buildStartPreview', 'civMatrixProfile', 'civAvailableAtEpoch'];
    const miss = NEED.filter((n) => !used.includes(n));
    if (miss.length) { diffs++; console.log(`ASERCJA_PORT zapytania nieużyte: ${miss.join(',')}`); }
    else console.log(`ASERCJA_PORT zapytania silnika użyte przez kreator: ${NEED.length}/${NEED.length}`);
  }
  if (errors.length) { diffs += errors.length; console.log('ERR: ' + [...new Set(errors)].slice(0, 8).join(' | ')); }
  const webHash = sha(JSON.stringify(fixture));
  console.log(`Chromium: ${ua}`);
  if (OUT) writeFileSync(OUT, JSON.stringify({ topic: 'R-RUSTPORT-REPIN-UI-2-F-Q1', source: 'web 86d510c66 gra/src/ui/newGameFlow.ts (Chromium)', viewports: VIEWPORTS, webVectorsSha256: webHash, scenarios: fixture }, null, 1) + '\n');
  const nPng = fixture.reduce((a, f) => a + f.pngSha256.length, 0);
  console.log(`run-repin-ui2f: scenariuszy=${scen.length} zrzutów_PNG=${nPng}×2 pageerror+console.error=${errors.length} różnic=${diffs} webVectorsSha256=${webHash}`);
  exitCode = diffs === 0 ? 0 : 1;
} catch (e) {
  console.error('BŁĄD harnessu:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  if (browser) await browser.close();
  for (const s of servers) s.close();
  rmSync(TMP, { recursive: true, force: true });
}
process.exitCode = exitCode;
