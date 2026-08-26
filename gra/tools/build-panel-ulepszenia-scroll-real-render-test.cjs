'use strict';
/**
 * build-panel-ulepszenia-scroll-real-render-test.cjs
 *
 * TEMAT: P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1.
 *
 * ZGŁOSZENIE WŁAŚCICIELA (ECHO 2026-08-25): „to menu budowania ulepszeń się nie przesuwa,
 * przy dużym powiększeniu nie można otworzyć ulepszeń na samym dole". Na zrzutach dół listy
 * „ULEPSZENIA TERENU" wchodzi pod przyciski WYKONAJ / ZAKOŃCZ TURĘ.
 *
 * CO TEN TEST MIERZY — i dlaczego NIE wystarczy sprawdzić obecności w DOM.
 * Zasłonięta pozycja listy JEST w DOM i ma niezerowy prostokąt, a mimo to gracz jej nie
 * kliknie. Dlatego kryteria końcowe są dwa: `document.elementFromPoint()` w ŚRODKU ostatniej
 * pozycji ORAZ realne `page.mouse.click()` w tym samym punkcie, potwierdzone wywołaniem
 * `onSelectType` z kluczem tej pozycji. Samo `elementFromPoint` nie wystarcza: pozycja
 * zasłonięta półprzezroczystym elementem albo leżąca poza kadrem potrafi je przejść, a i tak
 * nie da się jej kliknąć. jsdom nie nadaje się do tego w ogóle (`getBoundingClientRect()`
 * zwraca zera, `elementFromPoint` nie istnieje) — stąd realny Chromium (§9 poz. 6a).
 *
 * DWA NIEZALEŻNE ZNACZENIA SŁOWA „POWIĘKSZENIE" — oba mierzone osobno:
 *
 *  (1) POWIĘKSZENIE PRZEGLĄDARKI (Ctrl +). Chrome realizuje je tak, że viewport w px CSS
 *      kurczy się `zoom`-krotnie, a każdy px CSS zajmuje `zoom` px urządzenia. Playwright
 *      odtwarza to wiernie parą `viewport: {W/zoom, H/zoom}` + `deviceScaleFactor: zoom`
 *      przy STAŁYM fizycznym oknie W×H — a NIE `document.body.style.zoom` ani CSS `zoom`,
 *      bo te zmieniają układ wewnątrz niezmienionego viewportu i nie odtwarzają skurczu
 *      `100vh`, który jest sednem tego błędu. Siatka: 100/125/150/175/200% × okno o
 *      wysokości fizycznej 1080/900/768/640.
 *
 *  SIATKA JEST ŁĄCZONA — ILOCZYN OBU OSI, nie suma. Runda 1 tego tematu mierzyła każdą oś
 *      osobno (przeglądarka przy UI 100%, UI gry przy przeglądarce 100%) i przepuściła
 *      regresję, która pojawia się DOPIERO w iloczynie (przeglądarka 200% × UI 125% × okno
 *      640 → blok zawierający 256px < rezerwa 264px → `calc()` ujemny → panel zapada się
 *      do ~0). Dlatego dziś: 5 powiększeń przeglądarki × 3 powiększenia UI × 4 wysokości
 *      okna = 60 punktów, każdy mierzony osobno.
 *
 *  (2) POWIĘKSZENIE UI GRY (przyciski −/+ „Powiększenie całej gry", `hud.ts::applyUiZoom`).
 *      Implementacja: `body{width:100/z vw;height:100/z vh;transform:scale(z);
 *      transform-origin:top left}` + klasa `civ-ui-zoom-active` na <html>. Transform na
 *      <body> czyni BODY blokiem zawierającym dla potomków `position:fixed` — więc `top`,
 *      `bottom` i `%` liczą się od pomniejszonego body, a jednostka `vh` NADAL od viewportu.
 *      Ta rozbieżność jest przyczyną błędu. Test replikuje ten sam transform i pilnuje
 *      kontraktem źródła (asercje A4–A5), że replikacja odpowiada produkcyjnemu kodowi.
 *
 * ASERCJE:
 *  (A) kontrakt źródła — `.civ-build-panel` rezerwuje miejsce na stos WYKONAJ/ZAKOŃCZ TURĘ
 *      z JEDNEGO źródła prawdy (`hudLayout.ts::turnStackBottomPx`), nie ze sztywnej liczby,
 *      i nie ogranicza wysokości jednostką `vh` (patrz wyżej — `vh` ignoruje transform UI).
 *  (B) podsiatka bez powiększenia UI gry (20 punktów) — dla KAŻDEGO punktu: ostatnia pozycja
 *      listy (a) wyrenderowana, (b) osiągalna scrollem, (c) KLIKALNA (elementFromPoint),
 *      (d) KLIKNIĘTA realnym `page.mouse.click` z potwierdzeniem przez `onSelectType`.
 *  (C) podsiatka z powiększeniem UI gry 1.25/1.5 (40 punktów) — te same cztery kryteria.
 *  (F) podłoga wysokości panelu — w KAŻDYM z 60 punktów panel jest wyższy niż jeden pełny
 *      wiersz listy (wysokość wiersza mierzona, nie przepisana), więc nigdy nie zapada się
 *      do zera przy ujemnym `calc()`; jednocześnie panel mieści się w kadrze.
 *  (D) hipoteza „kółko myszy zoomuje mapę zamiast przewijać listę" — realne `mouse.wheel`
 *      nad listą przewija listę i NIE dociera do kanwy mapy.
 *  (E) brak regresji: sekcje MIASTO / CUDA ŚWIATA / AUTOMATYZACJA / ULEPSZENIA TERENU
 *      obecne, a przyciski WYKONAJ i ZAKOŃCZ TURĘ nadal klikalne (panel ich nie zasłania)
 *      i nieprzesunięte względem pozycji bez otwartego panelu.
 *  (G) PRAWY KLASTER HUD — patrz niżej.
 *
 * RUNDA 3 — DLACZEGO SCENA MUSI ZAWIERAĆ PRAWY KLASTER HUD.
 * Do rundy 2 ta scena montowała kanwę, dolny pasek i panel budowy — i NIC z górnego HUD-u.
 * Runda 2 dodała ruchomy `top`, który w ciasnych komórkach przesuwał panel budowy w górę,
 * w pas zarezerwowany dla `.hud-right-cluster` (chipy Armia…Religia + Civpedia + Menu;
 * `hud.ts`, `position:fixed;top:HUD_TOP_PX;right:HUD_EDGE_PX;z-index:320`, emitowany
 * BEZWARUNKOWO w `renderTopBanners`). Test tego nie zobaczył, bo mierzył scenę BEZ elementu,
 * na który poprawka przesuwała panel — i pokazywał uczciwe, ale ślepe 30/30. To ta sama klasa
 * błędu co w rundzie 1 (pomiar w niepełnej scenie), tylko piętro wyżej.
 *
 * Dlatego scena montuje teraz cały prawy klaster:
 *  - CSS `.civ-hud` / `.hud-right-cluster` / `.civ-hud-chip*` / `.b-wiki` / `.b-menu` jest
 *    WYCIĘTY PROGRAMOWO z szablonu `const css = ` w `hud.ts` (ten sam skaner nawiasów co
 *    `cssRule`), a wstawki `${…}` podstawione z `hudLayout.ts` — nie przepisane z pamięci.
 *    Asercja G2 czerwieni się, gdy w `hud.ts` pojawi się wstawka, której test nie zna
 *    (wtedy replikacja przestałaby odpowiadać produkcji po cichu).
 *  - `<div class="civ-hud">` jest realnym rodzicem klastra, więc odtwarza także KONTEKST
 *    UKŁADANIA (`.civ-hud{position:fixed;z-index:310}`) — bez tego rodzica `z-index:320`
 *    klastra porównywałby się bezpośrednio z `z-index:311` panelu i wynik hit-testu byłby
 *    artefaktem harnessu, nie odwzorowaniem gry.
 *  - chipy renderuje PRAWDZIWA `chip6cHtml`/`chip6cSep` z `hudChip6c.ts` (ikony stubowane —
 *    geometria chipa zależy od CSS, nie od kształtu ikony).
 *
 * (G) asercje: (G1) `hud.ts` nadal emituje klaster bezwarunkowo i w tej samej strukturze,
 * (G2) CSS klastra wycięty i w pełni podstawiony, z-index klastra > z-index panelu budowy,
 * (G3) środek ostatniej pozycji listy NIE trafia w klaster w żadnej z 60 komórek,
 * (G4) prostokąt panelu budowy NIE przecina prostokąta klastra w żadnej z 60 komórek,
 * (G5) klaster działa w drugą stronę — Civpedia i Menu zostają klikalne przy otwartym panelu.
 *
 * KOMPROMIS GEOMETRYCZNY (runda 3, jawny). W najciaśniejszych komórkach siatki wysokość
 * bloku zawierającego jest MNIEJSZA niż suma: pas górnego HUD-u + jeden pełny wiersz listy
 * + rezerwa stosu WYKONAJ/ZAKOŃCZ TURĘ. Nic się wtedy nie mieści i trzeba wybrać, co ustąpi.
 * Wybór: panel zostaje pod pasem HUD-u i nachodzi na stos tury (jak w stanie zastanym),
 * bo nachodzenie jest mniej złe niż zniknięcie listy pod nieprzezroczystym klastrem.
 * Asercje nachodzenia i klikalności WYKONAJ są więc warunkowe: nachodzenie wolno wyłącznie
 * w komórkach, w których `forcedOverlap` (liczone z realnych stałych, nie z listy wyjątków)
 * dowodzi, że innego układu nie ma. W każdej pozostałej komórce nachodzenie = FAIL.
 *
 * Opcje: --shot <plik.png> (zrzut dowodowy), --verbose (pełna tabela pomiarów siatki).
 * Usage (z gra/): node tools/build-panel-ulepszenia-scroll-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[build-panel-ulepszenia-scroll-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_STUB = path.resolve(STUB_DIR, 'build-panel-scroll-brandAssets-stub.ts');
const OWL_STUB = path.resolve(STUB_DIR, 'build-panel-scroll-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.build-panel-scroll-entry.ts');
const OUTFILE = path.resolve(__dirname, '.build-panel-scroll-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const shotArgIdx = process.argv.indexOf('--shot');
const SHOT_PATH = shotArgIdx !== -1 ? process.argv[shotArgIdx + 1] : null;
const VERBOSE = process.argv.includes('--verbose');
/** `--json <plik>` — surowe wiersze siatki do porównania stan-do-stanu (PRZED vs PO). */
const jsonArgIdx = process.argv.indexOf('--json');
const JSON_PATH = jsonArgIdx !== -1 ? process.argv[jsonArgIdx + 1] : null;

/** Powiększenia przeglądarki z siatki dispatchu. */
const BROWSER_ZOOMS = [1, 1.25, 1.5, 1.75, 2];
/** Wysokości okna (px fizyczne) z siatki dispatchu. */
const WINDOW_HEIGHTS = [1080, 900, 768, 640];
/** Szerokość okna (px fizyczne) — stała, błąd jest pionowy. */
const WINDOW_WIDTH = 1920;
/** Powiększenia UI gry (hud.ts: UI_ZOOM_MIN 0.85 … UI_ZOOM_MAX 1.5); 1 = brak powiększenia.
 *  Mierzone jako ILOCZYN z osią przeglądarki — patrz nagłówek. */
const UI_ZOOMS = [1, 1.25, 1.5];

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

// ---------------------------------------------------------------------------
// (A) Kontrakt źródła.
// ---------------------------------------------------------------------------
/** Wycina CAŁY blok deklaracji reguły CSS z szablonu w buildModeHud.ts.
 *  Naiwne `indexOf('}')` NIE działa: reguła zawiera wstawki `${HUD_EDGE_PX}`, więc pierwszy
 *  `}` należy do wstawki, a nie do reguły — asercja o `vh` byłaby wtedy zielona zawsze
 *  (sprawdzałaby urwany fragment `position:fixed;top:90px;right:${HUD_EDGE_PX`). */
function cssRule(src, selector, anchored) {
  let i = src.indexOf(selector + '{');
  // `anchored`: selektor musi zaczynać regułę (początek pliku albo nowa linia). Bez tego
  // `indexOf('.civ-hud .hud-right-cluster{')` trafia w dłuższy selektor
  // `html.civ-ui-zoom-active .civ-hud .hud-right-cluster{` i test mierzy nie tę regułę.
  while (anchored && i > 0 && src[i - 1] !== '\n') i = src.indexOf(selector + '{', i + 1);
  if (i === -1) return null;
  let k = i + selector.length + 1;
  let depth = 0;
  while (k < src.length) {
    if (src[k] === '$' && src[k + 1] === '{') { depth++; k += 2; continue; }
    if (src[k] === '}') {
      if (depth === 0) return src.slice(i, k + 1);
      depth--;
    }
    k++;
  }
  return null;
}

function buildPanelCssRule() {
  const src = fs.readFileSync(path.join(GRA, 'src', 'ui', 'buildModeHud.ts'), 'utf8');
  return cssRule(src, '.civ-build-panel');
}

function uiZoomFnSrc() {
  const src = fs.readFileSync(path.join(GRA, 'src', 'ui', 'hud.ts'), 'utf8');
  const i = src.indexOf('function applyUiZoom(): void {');
  if (i === -1) return null;
  const j = src.indexOf('\n}\n', i);
  return j === -1 ? null : src.slice(i, j);
}

/** Prawdziwe stałe layoutu HUD — czytane z hudLayout.ts, nie przepisane z pamięci. */
function hudLayoutConsts() {
  const src = fs.readFileSync(path.join(GRA, 'src', 'ui', 'hudLayout.ts'), 'utf8');
  const num = (name) => {
    const m = new RegExp('export const ' + name + '\\s*=\\s*(\\d+)').exec(src);
    return m ? Number(m[1]) : null;
  };
  const edge = num('HUD_EDGE_PX');
  const gap = num('HUD_GAP_PX');
  const zoomEdge = num('HUD_ZOOM_EDGE_PX');
  const wyk = num('BOTTOM_BAR_WYKONAJ_H_PX');
  const end = num('BOTTOM_BAR_END_TURN_H_PX');
  const lbl = num('BOTTOM_BAR_TURN_LABEL_H_PX');
  const above = num('EVENTS_PANEL_ABOVE_TURN_GAP_PX');
  // RUNDA 3 — pas górnego prawego klastra HUD. `hudRightRailBottomPx()` = HUD_TOP_PX +
  // max(chip row, action row); to jest dolna krawędź pasa, poniżej którego dopiero wolno
  // postawić panel budowy (ten sam rachunek co `eventsPanelTopPx()`).
  const topPx = num('HUD_TOP_PX');
  const chipRow = num('HUD_RIGHT_CHIP_ROW_H_PX');
  const actionRow = num('HUD_RIGHT_ACTION_ROW_H_PX');
  const railGap = num('HUD_RIGHT_RAIL_ROW_GAP_PX');
  const gapMd = num('HUD_GAP_MD_PX');
  const powerTop = num('HUD_POWER_TOP_PX');
  const cityEdge = num('CITY_EDGE_PX');
  return {
    edge, gap, zoomEdge, wyk, end, lbl, above,
    topPx, chipRow, actionRow, railGap, gapMd, powerTop, cityEdge,
    rightRailBottom: topPx + Math.max(chipRow, actionRow),
    turnStack: edge + wyk + gap + end + lbl,
    turnStackZoom: zoomEdge + wyk + gap + end + lbl,
  };
}

/** `top` panelu budowy zadeklarowany w `buildModeHud.ts` — czytany ze źródła, nie z pamięci. */
function buildPanelTopPx(src) {
  const m = /const BUILD_PANEL_TOP_PX = (\d+)/.exec(src);
  return m ? Number(m[1]) : null;
}

/** z-index reguły CSS (pierwsze wystąpienie w wyciętym bloku deklaracji). */
function zIndexOf(rule) {
  const m = /z-index:\s*(\d+)/.exec(rule || '');
  return m ? Number(m[1]) : null;
}

// ---------------------------------------------------------------------------
// (G) Prawy klaster HUD — CSS wycięty PROGRAMOWO z `hud.ts`.
// ---------------------------------------------------------------------------
/** Cały szablon `const css = ` z `hud.ts` (skaner nawiasów, tak jak `cssRule`). */
function hudCssTemplate(src) {
  const marker = 'const css = `';
  const i = src.indexOf(marker);
  if (i === -1) return null;
  let k = i + marker.length;
  const start = k;
  let depth = 0;
  while (k < src.length) {
    if (src[k] === '$' && src[k + 1] === '{') { depth++; k += 2; continue; }
    if (src[k] === '}' && depth > 0) { depth--; k++; continue; }
    if (src[k] === '`' && depth === 0) return src.slice(start, k);
    k++;
  }
  return null;
}

/** Podstawienie wstawek `${…}`. Wartości geometryczne z `hudLayout.ts`; wstawki spoza
 *  prawego klastra (minimapa, dok narzędzi, widok miasta, zmienne brandowe) neutralizowane —
 *  te elementy w scenie testu nie istnieją. Nieznana wstawka NIE jest po cichu przepuszczana:
 *  ląduje w `unknown`, co czerwieni asercję G2. */
function interpolateHudCss(raw, HL) {
  const MAP = {
    HUD_TOP_PX: String(HL.topPx),
    HUD_EDGE_PX: String(HL.edge),
    HUD_ZOOM_EDGE_PX: String(HL.zoomEdge),
    HUD_GAP_MD_PX: String(HL.gapMd),
    HUD_POWER_TOP_PX: String(HL.powerTop),
    HUD_RIGHT_RAIL_ROW_GAP_PX: String(HL.railGap),
    CITY_EDGE_PX: String(HL.cityEdge),
    // Poza prawym klastrem — patrz komentarz wyżej.
    CIV_BRAND_SCOPE_VARS: '',
    MINI_W: '240',
    MINI_H: '160',
    'cityViewRightClusterRightCss()': '0px',
    'utilDockBottomCss()': '0px',
    'utilDockBottomCss(true)': '0px',
    'utilDockLeftCss(MINI_W)': '0px',
    'utilDockLeftCss(MINI_W, true)': '0px',
  };
  const unknown = [];
  const css = raw.replace(/\$\{([^}]*)\}/g, (m, expr) => {
    const e = expr.trim();
    if (Object.prototype.hasOwnProperty.call(MAP, e)) return MAP[e];
    unknown.push(e);
    return m;
  });
  return { css, unknown };
}

/** Lista ulepszeń terenu prosto z rejestru render/improvements.ts (bez `pole_irygowane`,
 *  dokładnie jak filtruje `buildModeHud.update()`), żeby długość listy w teście była realna. */
function realImprovements() {
  const src = fs.readFileSync(path.join(GRA, 'src', 'render', 'improvements.ts'), 'utf8');
  const i = src.indexOf('export const IMPROVEMENTS');
  const j = src.indexOf('\n];', i);
  const body = src.slice(i, j);
  const out = [];
  const re = /\{\s*key:\s*'([a-z_]+)'\s*,\s*label:\s*'([^']+)'\s*,\s*epoka:\s*(\d+)\s*\}/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    if (m[1] === 'pole_irygowane') continue;
    out.push({ key: m[1], label: m[2], epoka: Number(m[3]) });
  }
  return out;
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[build-panel-ulepszenia-scroll-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function bundle() {
  fs.writeFileSync(
    ENTRY,
    [
      "import { createBuildModeHud } from '../src/ui/buildModeHud.ts';",
      "import { createBottomBarHud } from '../src/ui/bottomBarHud.ts';",
      // RUNDA 3 — prawdziwe chipy prawego klastra HUD (nie atrapa prostokąta).
      "import { chip6cHtml, chip6cSep } from '../src/ui/hudChip6c.ts';",
      'window.__createBuildModeHud = createBuildModeHud;',
      'window.__createBottomBarHud = createBottomBarHud;',
      'window.__chip6cHtml = chip6cHtml;',
      'window.__chip6cSep = chip6cSep;',
      '',
    ].join('\n'),
    'utf8',
  );
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: OUTFILE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [{
      name: 'stub-icons',
      setup(build) {
        // `(^|/)` zamiast `icons/`: `icons/iconRegistry.ts` importuje `./brandAssets`
        // i `./scienceOwlIcon` bez przedrostka katalogu — bez tego oba moduły z `?raw`
        // trafiłyby do bundla i esbuild wywraca się na loaderze `.svg`.
        build.onResolve({ filter: /(^|\/)brandAssets$/ }, () => ({ path: BRAND_STUB }));
        build.onResolve({ filter: /(^|\/)scienceOwlIcon$/ }, () => ({ path: OWL_STUB }));
      },
    }],
    logLevel: 'silent',
  });
  return fs.readFileSync(OUTFILE, 'utf8');
}

/** Montuje w stronie: kanwę mapy (z licznikiem wheel jak `render/camera.ts`), dolny pasek
 *  WYKONAJ/ZAKOŃCZ TURĘ i panel budowy z REALNĄ listą ulepszeń. */
async function mountScene(page, improvements, hudCss) {
  await page.evaluate(({ imps, hudCss: css }) => {
    document.body.innerHTML = '';
    // RUNDA 3 — CSS górnego HUD-u wycięty z `hud.ts` (raz na stronę, nie na każdy montaż).
    if (css && !document.getElementById('civ-hud-css-test')) {
      const st = document.createElement('style');
      st.id = 'civ-hud-css-test';
      st.textContent = css;
      document.head.appendChild(st);
    }
    // Kanwa mapy — wheel podpięty do KANWY (tak jak render/camera.ts:229), nie do window.
    const cv = document.createElement('canvas');
    cv.id = 'map-canvas';
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:0;';
    window.__canvasWheel = 0;
    cv.addEventListener('wheel', () => { window.__canvasWheel++; }, { passive: false });
    document.body.appendChild(cv);

    window.__bottomBar = window.__createBottomBarHud({
      getTurn: () => 42,
      getYearLabel: () => '2000 p.n.e.',
      onExecutePending: () => {},
      onEndTurn: () => {},
      canEndTurn: () => true,
      getBlockingCount: () => 1,
      hideEndTurn: () => false,
      getBlockingTitles: () => ['Wydarzenie testowe'],
    });
    window.__bottomBar.update();

    const wonders = [
      { id: 'piramidy', label: 'Piramidy', kosztPraca: 200, epokaWejscia: 1, dostep: 'R' },
      { id: 'wisz-ogrody', label: 'Wiszące ogrody', kosztPraca: 220, epokaWejscia: 2, dostep: 'R' },
    ];
    const types = imps.map((t, i) => ({
      key: t.key,
      label: t.label,
      kosztPraca: 20 + (i % 4) * 10,
      epoka: t.epoka,
      techUnlocked: i % 5 !== 3,
      techLabel: 'Obróbka kamienia',
      lockHint: 'Technologia: «Obróbka kamienia» · Koszt: 40 Pracy',
    }));
    window.__types = types;
    window.__selected = [];
    window.__hud = window.__createBuildModeHud({
      listTypes: () => types,
      getActiveKey: () => null,
      // Kryterium (d): realne kliknięcie musi dojść do callbacku wyboru ulepszenia.
      onSelectType: (k) => { window.__selected.push(k); },
      onExit: () => {},
      isOpen: () => true,
      getPracaPool: () => 999,
      canFoundCity: () => true,
      isFoundCityActive: () => false,
      isFoundCityOnly: () => false,
      getFoundCityCostLabel: () => '60 P',
      listWonders: () => wonders,
      getActiveWonderId: () => null,
      getWonderTargetLabel: () => 'Cel: stolica',
      listPlayerCities: () => [{ id: 'c1', name: 'Roma' }, { id: 'c2', name: 'Neapolis' }],
      getUlepszeniaCityId: () => 'c1',
      getUlepszeniaEmpireState: () => ({ focus: 'zywnosc', tryb: 'auto', pracaAutoPercent: 30, onlyWorked: false }),
      getUlepszeniaEffectiveState: () => ({ focus: 'zywnosc', tryb: 'auto', pracaAutoPercent: 30, onlyWorked: false, override: false }),
      getUlepszeniaCityOverride: () => false,
    });
    window.__hud.update();

    // ------------------------------------------------------------------
    // PRAWY KLASTER HUD (`.hud-right-cluster`) — ten sam szkielet co
    // `hud.ts::renderTopBanners` (asercja G1 pilnuje, że szkielet w źródle się nie
    // rozjechał), chipy z PRAWDZIWEJ `chip6cHtml`, rodzic `.civ-hud` z prawdziwym
    // `z-index:310`, żeby kontekst układania był taki jak w grze.
    // ------------------------------------------------------------------
    const chips = [
      window.__chip6cHtml({ iconId: 'tb-army', label: 'Armia', value: '12', rate: '+3', act: 'armia' }),
      window.__chip6cSep(),
      window.__chip6cHtml({ iconId: 'res-settlements', label: 'Miasta', value: '4', rate: '+1', act: 'miasta' }),
      window.__chip6cSep(),
      window.__chip6cHtml({ iconId: 'res-population', label: 'Obywatele', value: '37', rate: '+2', act: 'ludnosc' }),
      window.__chip6cSep(),
      window.__chip6cHtml({ iconId: 'res-culture', label: 'Kultura', value: '128', rate: '+6', act: 'kultura' }),
      window.__chip6cSep(),
      window.__chip6cHtml({ iconId: 'res-religion', label: 'Religia', value: '55', rate: '+2', act: 'religia' }),
    ].join('');
    const hudRoot = document.createElement('div');
    hudRoot.className = 'civ-hud';
    hudRoot.innerHTML = '<div class="hud-right-cluster">'
      + '<div class="civ-hud-banner-shell civ-hud-banner-right"><div class="hud-chip-row">'
      + chips + '</div></div>'
      + '<div class="hud-right">'
      + '<button type="button" class="b-wiki" data-act="wiki" aria-label="Civpedia — poradnik i encyklopedia">'
      + '<span>Civpedia</span></button>'
      + '<button type="button" class="b-menu" data-act="menu" title="Menu główne"><span>Menu</span></button>'
      + '</div></div>';
    document.body.appendChild(hudRoot);
  }, { imps: improvements, hudCss });
}

/** Powiększenie UI gry — dokładnie ten sam transform co `hud.ts::applyUiZoom` (asercje A4–A5
 *  pilnują, że replikacja nie rozjeżdża się z produkcyjnym kodem). */
async function setUiZoom(page, z) {
  await page.evaluate((zz) => {
    const root = document.documentElement;
    const body = document.body;
    if (zz === 1) {
      root.classList.remove('civ-ui-zoom-active');
      root.style.removeProperty('--civ-ui-zoom');
      body.style.width = '';
      body.style.height = '';
      body.style.transform = '';
      body.style.transformOrigin = '';
      body.style.overflow = '';
    } else {
      root.classList.add('civ-ui-zoom-active');
      root.style.setProperty('--civ-ui-zoom', String(zz));
      body.style.width = `${100 / zz}vw`;
      body.style.height = `${100 / zz}vh`;
      body.style.transform = `scale(${zz})`;
      body.style.transformOrigin = 'top left';
      body.style.overflow = 'hidden';
    }
    window.dispatchEvent(new Event('resize'));
  }, z);
}

/** Jeden pomiar: ostatnia pozycja listy ULEPSZENIA TERENU po zjechaniu na sam dół. */
async function measureLastItem(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('.civ-build-panel');
    const items = Array.from(panel.querySelectorAll('.civ-build-item[data-key]'));
    const last = items[items.length - 1];
    const cs = getComputedStyle(panel);
    // (b) osiągalność scrollem — zjedź na maksimum, jakie panel dopuszcza.
    panel.scrollTop = panel.scrollHeight;
    const scrolledTo = panel.scrollTop;
    const r = last.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = Math.round(r.left + r.width / 2);
    const cy = Math.round(r.top + r.height / 2);
    const inViewport = cx >= 0 && cx <= vw && cy >= 0 && cy <= vh;
    const hit = inViewport ? document.elementFromPoint(cx, cy) : null;
    const hitIsLast = !!hit && (hit === last || last.contains(hit));
    const bar = document.querySelector('.civ-bottom-bar');
    const br = bar.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    // RUNDA 3 — prawy klaster HUD. Kryterium prostokątowe liczymy na PANELU, nie na
    // pojedynczych wierszach: panel jest kontenerem klipującym (`overflow-y:auto`), więc
    // wiersz zwinięty poza jego klip ma prostokąt, którego nikt nie maluje — porównywanie
    // takich prostokątów daje fałszywe alarmy. Jeśli panel nie przecina klastra, to żaden
    // widoczny wiersz też nie.
    const cluster = document.querySelector('.hud-right-cluster');
    const clr = cluster ? cluster.getBoundingClientRect() : null;
    const clusterOverlapPx = clr
      ? Math.round(Math.min(Math.min(pr.bottom, clr.bottom) - Math.max(pr.top, clr.top),
        Math.min(pr.right, clr.right) - Math.max(pr.left, clr.left)))
      : null;
    const hitInCluster = !!(hit && cluster && (hit === cluster || cluster.contains(hit)));
    const clusterBtns = {};
    for (const [nm, sel] of [['wiki', '.hud-right-cluster .b-wiki'], ['menu', '.hud-right-cluster .b-menu']]) {
      const b = document.querySelector(sel);
      if (!b) { clusterBtns[nm] = null; continue; }
      const rb = b.getBoundingClientRect();
      const hb = document.elementFromPoint(Math.round(rb.left + rb.width / 2), Math.round(rb.top + rb.height / 2));
      clusterBtns[nm] = {
        clickable: !!hb && (hb === b || b.contains(hb)),
        hit: hb ? (typeof hb.className === 'string' && hb.className ? hb.className : hb.tagName) : null,
      };
    }
    window.__selected = [];
    return {
      itemCount: items.length,
      lastKey: last.getAttribute('data-key'),
      lastDisabled: last.classList.contains('disabled'),
      lastLabel: last.textContent.replace(/\s+/g, ' ').trim().slice(0, 40),
      // Wysokość wiersza MIERZONA w tym samym renderze — podłoga panelu jest z nią porównywana.
      itemH: Math.round(r.height * 100) / 100,
      panelH: Math.round(pr.height * 100) / 100,
      panelChromePx: Math.round((parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
        + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)) * 100) / 100,
      uiZoom: Number(document.documentElement.style.getPropertyValue('--civ-ui-zoom') || 1),
      rendered: r.width > 1 && r.height > 1,
      scrollable: panel.scrollHeight - panel.clientHeight > 1,
      scrollHeight: Math.round(panel.scrollHeight),
      clientHeight: Math.round(panel.clientHeight),
      scrolledTo: Math.round(scrolledTo),
      maxHeightCss: cs.maxHeight,
      panel: { top: Math.round(pr.top), bottom: Math.round(pr.bottom), left: Math.round(pr.left), right: Math.round(pr.right) },
      bar: { top: Math.round(br.top), bottom: Math.round(br.bottom), left: Math.round(br.left), right: Math.round(br.right) },
      overlapPx: Math.round(Math.min(pr.bottom, br.bottom) - Math.max(pr.top, br.top)),
      cluster: clr ? { top: Math.round(clr.top), bottom: Math.round(clr.bottom), left: Math.round(clr.left), right: Math.round(clr.right) } : null,
      clusterOverlapPx,
      hitInCluster,
      clusterBtns,
      last: { top: Math.round(r.top), bottom: Math.round(r.bottom), cx, cy },
      vw, vh,
      // (b): cały wiersz mieści się w viewporcie po zjechaniu na dół
      reachable: r.top >= -0.5 && r.bottom <= vh + 0.5 && r.left >= -0.5 && r.right <= vw + 0.5,
      // (c): środek wiersza faktycznie trafia w ten wiersz
      clickable: hitIsLast,
      // (d): punkt do realnego page.mouse.click — tylko jeśli leży w kadrze
      clickPoint: inViewport ? { x: cx, y: cy } : null,
      hitTag: hit ? (hit.className && typeof hit.className === 'string' ? hit.className : hit.tagName) : null,
    };
  });
}

/** (d) REALNE kliknięcie w środek ostatniej pozycji listy — myszą przeglądarki, nie skryptem.
 *  Kryterium: `onSelectType` dostał klucz tej pozycji. Zasłonięta albo wypchnięta poza kadr
 *  pozycja tego nie zaliczy, nawet gdy przejdzie `elementFromPoint`. */
async function clickLastItem(page, m) {
  if (!m.clickPoint) return false;
  try {
    await page.mouse.click(m.clickPoint.x, m.clickPoint.y);
    await page.waitForTimeout(10);
    return await page.evaluate((k) => Array.isArray(window.__selected) && window.__selected.includes(k), m.lastKey);
  } catch (_e) {
    return false;
  }
}

/** Klikalność przycisków dolnego paska — panel nie może ich zasłonić (z-index 311 > 310). */
async function measureBottomButtons(page) {
  return page.evaluate(() => {
    const out = {};
    for (const [name, sel] of [['wykonaj', '.civ-bottom-bar .wykonaj'], ['endTurn', '.civ-bottom-bar .end-turn']]) {
      const b = document.querySelector(sel);
      if (!b) { out[name] = null; continue; }
      const r = b.getBoundingClientRect();
      const cx = Math.round(r.left + r.width / 2);
      const cy = Math.round(r.top + r.height / 2);
      const hit = document.elementFromPoint(cx, cy);
      out[name] = {
        rect: { top: Math.round(r.top), bottom: Math.round(r.bottom) },
        clickable: !!hit && (hit === b || b.contains(hit)),
        hit: hit ? (typeof hit.className === 'string' && hit.className ? hit.className : hit.tagName) : null,
      };
    }
    return out;
  });
}

async function main() {
  // -------------------------------------------------------------------------
  // (A) Kontrakt źródła.
  // -------------------------------------------------------------------------
  const rule = buildPanelCssRule();
  check('A1 reguła .civ-build-panel znaleziona w buildModeHud.ts', !!rule);
  if (!rule) { process.exit(1); return; }

  check('A2 .civ-build-panel NIE ogranicza wysokości jednostką vh (vh ignoruje transform powiększenia UI, przez co panel wychodzi poza ekran i nigdy nie włącza scrolla)',
    !/\dvh/.test(rule), { rule });
  const hudSrc = fs.readFileSync(path.join(GRA, 'src', 'ui', 'buildModeHud.ts'), 'utf8');
  check('A3 .civ-build-panel rezerwuje miejsce na stos WYKONAJ/ZAKOŃCZ TURĘ z jednego źródła prawdy (hudLayout: turnStackBottomPx), nie ze sztywnej liczby',
    /BUILD_PANEL_BOTTOM_PX/.test(rule)
      && /const BUILD_PANEL_BOTTOM_PX = turnStackBottomPx\(\)/.test(hudSrc),
    { rule });

  const zoomFn = uiZoomFnSrc();
  check('A4 hud.ts::applyUiZoom nadal skaluje body transformem (replikacja w teście jest wierna)',
    !!zoomFn && /transform\s*=\s*`scale\(\$\{z\}\)`/.test(zoomFn) && /transformOrigin\s*=\s*'top left'/.test(zoomFn),
    zoomFn ? zoomFn.slice(0, 300) : null);
  check('A5 hud.ts::applyUiZoom nadal ustawia body na 100/z vw × 100/z vh i klasę civ-ui-zoom-active',
    !!zoomFn && /100 \/ z\}vw/.test(zoomFn) && /100 \/ z\}vh/.test(zoomFn) && /civ-ui-zoom-active/.test(zoomFn));

  const HL = hudLayoutConsts();
  check('A6 stałe stosu tury odczytane z hudLayout.ts (nie z pamięci)',
    HL.turnStack > 0 && HL.turnStackZoom > 0, HL);
  const zoomRule = cssRule(hudSrc, 'html.civ-ui-zoom-active .civ-build-panel');
  check('A7 .civ-build-panel ma osobną regułę dla powiększenia UI gry (html.civ-ui-zoom-active), jak .civ-side-panel i .civ-bottom-bar',
    !!zoomRule && /BUILD_PANEL_BOTTOM_ZOOM_PX/.test(zoomRule) && !/\dvh/.test(zoomRule), { zoomRule });

  const camSrc = fs.readFileSync(path.join(GRA, 'src', 'render', 'camera.ts'), 'utf8');
  check('A8 kamera mapy słucha wheel na KANWIE, nie na window/document (kółko nad panelem nie może zoomować mapy)',
    /this\.canvas\.addEventListener\('wheel'/.test(camSrc) && !/window\.addEventListener\('wheel'/.test(camSrc));

  const improvements = realImprovements();
  check('A9 lista ulepszeń odczytana z render/improvements.ts (realna długość, ostatnia pozycja = Fort)',
    improvements.length >= 20 && improvements[improvements.length - 1].key === 'fort',
    { n: improvements.length, last: improvements[improvements.length - 1] });

  // -------------------------------------------------------------------------
  // (G) Kontrakt źródła prawego klastra HUD + wycięcie jego CSS.
  // -------------------------------------------------------------------------
  const hudTsSrc = fs.readFileSync(path.join(GRA, 'src', 'ui', 'hud.ts'), 'utf8');
  // Klaster jest doklejany do `html` BEZWARUNKOWO (bez `if`, bez operatora warunkowego) —
  // gdyby kiedyś stał się warunkowy, scena testu przestałaby odpowiadać grze i ta asercja
  // ma o tym powiedzieć głośno.
  const EXPECTED_CLUSTER_EMIT = "html += '<div class=\"hud-right-cluster\">' "
    + "+ '<div class=\"civ-hud-banner-shell civ-hud-banner-right\"><div class=\"hud-chip-row\">' "
    + "+ rightChips.join('') + '</div></div>' "
    + "+ '<div class=\"hud-right\">'";
  const emitIdx = hudTsSrc.indexOf('html += \'<div class="hud-right-cluster">\'');
  const emitNorm = emitIdx === -1 ? null
    : hudTsSrc.slice(emitIdx, emitIdx + 400).replace(/\s+/g, ' ').trim();
  check('G1 hud.ts emituje .hud-right-cluster BEZWARUNKOWO (zwykłe `html +=`, bez `if`/`?:`) i w strukturze odtworzonej w scenie testu',
    !!emitNorm && emitNorm.startsWith(EXPECTED_CLUSTER_EMIT)
      && /const rightChips: string\[\] = \[/.test(hudTsSrc)
      && /class="b-wiki/.test(hudTsSrc) && /class="b-menu"/.test(hudTsSrc),
    { emitNorm: emitNorm ? emitNorm.slice(0, 300) : null });

  const hudCssRaw = hudCssTemplate(hudTsSrc);
  check('G2a szablon CSS znaleziony w hud.ts (const css = `…`)', !!hudCssRaw && hudCssRaw.length > 2000,
    { len: hudCssRaw ? hudCssRaw.length : 0 });
  const interp = interpolateHudCss(hudCssRaw || '', HL);
  const hudCss = interp.css;
  check('G2b wszystkie wstawki ${…} CSS HUD-u podstawione ze znanych źródeł (nieznana wstawka = replikacja rozjechałaby się z produkcją po cichu)',
    interp.unknown.length === 0, interp.unknown);
  const clusterRule = cssRule(hudCss, '.civ-hud .hud-right-cluster', true);
  const hudRootRule = cssRule(hudCss, '.civ-hud', true);
  const panelZ = zIndexOf(rule);
  const clusterZ = zIndexOf(clusterRule);
  const hudRootZ = zIndexOf(hudRootRule);
  check('G2c reguła .hud-right-cluster wycięta, position:fixed, geometria z hudLayout.ts (top HUD_TOP_PX, right HUD_EDGE_PX)',
    !!clusterRule && /position:fixed/.test(clusterRule)
      && clusterRule.includes(`top:${HL.topPx}px`) && clusterRule.includes(`right:${HL.edge}px`)
      && !/\$\{/.test(clusterRule),
    { clusterRule });
  check('G2d z-index: klaster HUD > panel budowy (obie liczby ze źródła — to jest powód, dla którego panel może pod nim zniknąć)',
    clusterZ !== null && panelZ !== null && clusterZ > panelZ, { clusterZ, panelZ, hudRootZ });
  check('G2e rodzic .civ-hud ma własny z-index (kontekst układania odtworzony w scenie, nie pominięty)',
    hudRootZ !== null && /position:fixed/.test(hudRootRule || ''), { hudRootZ });
  // G6 — „czy panel nie chowa się pod ŻADNYM elementem o wyższym z-index".
  // Scena montuje ten jeden element górnego HUD-u, który przy trybie budowy stoi na ekranie
  // zawsze (`.hud-right-cluster`). Żeby to nie było założeniem na słowo, skanujemy CAŁY
  // `src/ui/*.ts` w poszukiwaniu reguł `position:fixed` z z-indexem wyższym niż panel budowy,
  // zakotwiczonych do prawej krawędzi (tylko takie mogą go zasłonić w tym rogu). Każda musi
  // być na przejrzanej liście z powodem — nowa reguła czerwieni asercję i wymusza decyzję,
  // czy scena testu ma ją montować.
  const KNOWN_RIGHT_HIGH_Z = {
    '.civ-ux-top': 'ramka WIDOKU MIASTA (cityUxFrame) — inny ekran, tryb budowy mapy tam nie działa',
    '.civ-diplo': 'panel dyplomacji — otwierany na żądanie, nie jest stałym chromem mapy',
    '.civ-emp-panel': 'szuflada szczegółów imperium — otwierana na żądanie',
    '.civ-order': 'panel rozkazów jednostki — otwierany na żądanie',
    '.civ-smp-overlay': 'nakładka oblężenia — otwierana na żądanie',
  };
  const foundRightHighZ = [];
  for (const f of fs.readdirSync(path.join(GRA, 'src', 'ui')).filter((x) => x.endsWith('.ts'))) {
    const src = fs.readFileSync(path.join(GRA, 'src', 'ui', f), 'utf8');
    for (const chunk of src.split(/\n(?=[.#][A-Za-z])/)) {
      if (!/position:fixed/.test(chunk)) continue;
      const mz = /z-index:(\d+)/.exec(chunk);
      if (!mz || Number(mz[1]) <= (panelZ || 311)) continue;
      const body = chunk.slice(0, chunk.indexOf('}') + 1);
      if (!/right:/.test(body) || /inset:0/.test(body)) continue;
      foundRightHighZ.push({ file: f, sel: chunk.split('{')[0].trim(), z: Number(mz[1]) });
    }
  }
  const unreviewed = foundRightHighZ.filter((x) => !Object.prototype.hasOwnProperty.call(KNOWN_RIGHT_HIGH_Z, x.sel));
  check('G6 żaden NIEPRZEJRZANY element position:fixed o z-index > panelu budowy nie stoi w prawym pasie ekranu (nowy = scena testu może być znów niepełna)',
    unreviewed.length === 0, { unreviewed, przejrzane: foundRightHighZ.map((x) => x.sel + ' z=' + x.z) });

  // G7 — założenie, na którym stoi cała scena: `.civ-hud` (z własnym `z-index:310`) i panel
  // budowy (`z-index:311`) są RODZEŃSTWEM, oba doklejane wprost do <body>. Dlatego `z-index:320`
  // klastra jest domknięty w kontekście układania `.civ-hud` i porównuje się 310 vs 311, a nie
  // 320 vs 311 — panel maluje się NAD górnym HUD-em, nie pod nim. Gdyby któryś z tych elementów
  // przeniósł się w inne miejsce drzewa, kolejność malowania odwróciłaby się i scena testu
  // przestałaby odpowiadać grze; ta asercja ma o tym powiedzieć od razu.
  check('G7 .civ-hud i .civ-build-panel są rodzeństwem doklejanym wprost do <body> (kontekst układania odtworzony w scenie zgodnie z grą)',
    /barEl\.className = 'civ-hud';\s*\n\s*document\.body\.appendChild\(barEl\);/.test(hudTsSrc)
      && /document\.body\.appendChild\(bannerEl\);\s*\n\s*document\.body\.appendChild\(el\);/.test(hudSrc));

  const buildTopPx = buildPanelTopPx(hudSrc);
  check('G2f pas zarezerwowany dla prawego klastra policzony z hudLayout.ts (hudRightRailBottomPx)',
    HL.rightRailBottom > 0 && buildTopPx !== null,
    { rightRailBottom: HL.rightRailBottom, buildPanelTopPx: buildTopPx });

  // -------------------------------------------------------------------------
  // Realny Chromium.
  // -------------------------------------------------------------------------
  const bundleJs = await bundle();
  const browser = await launchBrowser();
  const consoleErrors = [];
  const rows = [];
  let shotDone = false;

  // `font-family:monospace` na <body> — dokładnie jak `gra/index.html`. To NIE jest kosmetyka:
  // etykiety chipów prawego klastra dziedziczą font z body, a od ich szerokości zależy, czy
  // wiersz chipów się zawija (czyli jak wysoki jest realnie klaster). Domyślny font przeglądarki
  // dałby klaster węższy i niższy niż w grze — czyli pomiar łagodniejszy niż rzeczywistość.
  const PAGE_CSS = '<style>*{margin:0;padding:0;box-sizing:border-box;}'
    + 'html,body{width:100%;height:100%;background:#0a1020;overflow:hidden;}'
    + 'body{font-family:monospace;color:#eee;}</style><div id="root"></div>';

  async function runGrid(browserZoom) {
    const ctx = await browser.newContext({
      viewport: { width: Math.round(WINDOW_WIDTH / browserZoom), height: Math.round(WINDOW_HEIGHTS[0] / browserZoom) },
      deviceScaleFactor: browserZoom,
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    await page.setContent(PAGE_CSS);
    await page.addScriptTag({ content: bundleJs });

    // SIATKA ŁĄCZONA: powiększenie przeglądarki × powiększenie UI gry × wysokość okna.
    // Iloczyn, nie suma — regresja rundy 1 pojawiała się wyłącznie w komórkach mieszanych.
    for (const uiZoom of UI_ZOOMS) {
      for (const winH of WINDOW_HEIGHTS) {
        await setUiZoom(page, 1);
        await page.setViewportSize({
          width: Math.round(WINDOW_WIDTH / browserZoom),
          height: Math.round(winH / browserZoom),
        });
        await mountScene(page, improvements, hudCss);
        if (uiZoom !== 1) {
          await setUiZoom(page, uiZoom);
          await page.evaluate(() => window.__hud.update());
        }
        await page.waitForTimeout(20);
        const m = await measureLastItem(page);
        const btns = await measureBottomButtons(page);
        const realClick = await clickLastItem(page, m);
        rows.push({ kind: uiZoom === 1 ? 'browser' : 'ui', zoom: browserZoom, uiZoom, winH, m, btns, realClick });

        if (!shotDone && SHOT_PATH && browserZoom === 1.5 && uiZoom === 1 && winH === 900) {
          fs.mkdirSync(path.dirname(SHOT_PATH), { recursive: true });
          await page.screenshot({ path: SHOT_PATH });
          console.log('[build-panel-ulepszenia-scroll-real-render-test] zrzut: ' + SHOT_PATH);
          shotDone = true;
        }
      }
    }
    await setUiZoom(page, 1);

    // (D) kółko myszy nad listą — tylko raz, przy 100%.
    let wheel = null;
    if (browserZoom === 1) {
      await setUiZoom(page, 1);
      await page.setViewportSize({ width: WINDOW_WIDTH, height: 900 });
      await mountScene(page, improvements, hudCss);
      await page.waitForTimeout(20);
      wheel = await (async () => {
        const before = await page.evaluate(() => {
          const p = document.querySelector('.civ-build-panel');
          p.scrollTop = 0;
          window.__canvasWheel = 0;
          const r = p.getBoundingClientRect();
          return { scrollTop: p.scrollTop, cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2) };
        });
        await page.mouse.move(before.cx, before.cy);
        await page.mouse.wheel(0, 400);
        await page.waitForTimeout(80);
        return page.evaluate((b) => ({
          before: b.scrollTop,
          after: document.querySelector('.civ-build-panel').scrollTop,
          canvasWheel: window.__canvasWheel,
        }), before);
      })();
    }

    // (E) przyciski dolnego paska bez otwartego panelu — pozycja odniesienia.
    let barNoPanel = null;
    if (browserZoom === 1) {
      await page.setViewportSize({ width: WINDOW_WIDTH, height: 900 });
      await mountScene(page, improvements, hudCss);
      barNoPanel = await page.evaluate(() => {
        document.querySelector('.civ-build-panel').remove();
        const b = document.querySelector('.civ-bottom-bar .end-turn').getBoundingClientRect();
        const w = document.querySelector('.civ-bottom-bar .wykonaj').getBoundingClientRect();
        return { endTop: Math.round(b.top), endBottom: Math.round(b.bottom), wykTop: Math.round(w.top) };
      });
    }

    await ctx.close();
    return { wheel, barNoPanel };
  }

  let wheelRes = null;
  let barNoPanel = null;
  for (const z of BROWSER_ZOOMS) {
    const r = await runGrid(z);
    if (r.wheel) wheelRes = r.wheel;
    if (r.barNoPanel) barNoPanel = r.barNoPanel;
  }

  // -------------------------------------------------------------------------
  // Werdykty.
  // -------------------------------------------------------------------------
  const fmt = (r) => `BR ${Math.round(r.zoom * 100)}% × UI ${Math.round(r.uiZoom * 100)}% × ${r.winH}px`;
  if (VERBOSE) {
    console.log('');
    console.log('--- SIATKA POMIAROWA (a=wyrenderowana, b=osiągalna scrollem, c=klikalna) ---');
    for (const r of rows) {
      console.log(
        `${fmt(r).padEnd(30)} a=${r.m.rendered ? 1 : 0} b=${r.m.reachable ? 1 : 0} c=${r.m.clickable ? 1 : 0} d=${r.realClick ? 1 : 0}`
        + ` | panel ${r.m.panel.top}..${r.m.panel.bottom} bar ${r.m.bar.top}..${r.m.bar.bottom}`
        + ` overlap=${Math.max(0, r.m.overlapPx)} | scroll ${r.m.scrolledTo}/${r.m.scrollHeight - r.m.clientHeight}`
        + ` maxH=${r.m.maxHeightCss} panelH=${r.m.panelH} | last ${r.m.last.top}..${r.m.last.bottom} vh=${r.m.vh} hit=${r.m.hitTag}`
        + ` | klaster ${r.m.cluster ? r.m.cluster.top + '..' + r.m.cluster.bottom : '—'}`
        + ` xKlaster=${Math.max(0, r.m.clusterOverlapPx)} podKlastrem=${r.m.hitInCluster ? 1 : 0}`,
      );
    }
    console.log('');
  }

  const browserRows = rows.filter((r) => r.kind === 'browser');
  const uiRows = rows.filter((r) => r.kind === 'ui');

  const badA = rows.filter((r) => !r.m.rendered).map(fmt);
  check(`B/C(a) ostatnia pozycja listy wyrenderowana w KAŻDYM z ${rows.length} punktów siatki`,
    badA.length === 0, badA);

  const badB = browserRows.filter((r) => !r.m.reachable).map((r) => ({ cell: fmt(r), last: r.m.last, vh: r.m.vh, maxH: r.m.maxHeightCss }));
  check(`B(b) ostatnia pozycja OSIĄGALNA scrollem w każdym z ${browserRows.length} punktów siatki powiększenia przeglądarki`,
    badB.length === 0, badB);

  const badC = browserRows.filter((r) => !r.m.clickable).map((r) => ({ cell: fmt(r), hit: r.m.hitTag, last: r.m.last, bar: r.m.bar }));
  check(`B(c) ostatnia pozycja KLIKALNA (elementFromPoint) w każdym z ${browserRows.length} punktów siatki powiększenia przeglądarki`,
    badC.length === 0, badC);

  const badD = browserRows.filter((r) => !r.realClick).map((r) => ({ cell: fmt(r), panelH: r.m.panelH, last: r.m.last, hit: r.m.hitTag }));
  check(`B(d) ostatnia pozycja faktycznie KLIKNIĘTA myszą (page.mouse.click → onSelectType) w każdym z ${browserRows.length} punktów siatki powiększenia przeglądarki`,
    badD.length === 0, badD);

  const badUiB = uiRows.filter((r) => !r.m.reachable).map((r) => ({ cell: fmt(r), last: r.m.last, vh: r.m.vh, maxH: r.m.maxHeightCss }));
  check(`C(b) ostatnia pozycja OSIĄGALNA scrollem w każdym z ${uiRows.length} punktów siatki powiększenia UI gry`,
    badUiB.length === 0, badUiB);

  const badUiC = uiRows.filter((r) => !r.m.clickable).map((r) => ({ cell: fmt(r), hit: r.m.hitTag, last: r.m.last, bar: r.m.bar }));
  check(`C(c) ostatnia pozycja KLIKALNA w każdym z ${uiRows.length} punktów siatki powiększenia UI gry`,
    badUiC.length === 0, badUiC);

  const badUiD = uiRows.filter((r) => !r.realClick).map((r) => ({ cell: fmt(r), panelH: r.m.panelH, last: r.m.last, hit: r.m.hitTag }));
  check(`C(d) ostatnia pozycja faktycznie KLIKNIĘTA myszą (page.mouse.click → onSelectType) w każdym z ${uiRows.length} punktów siatki powiększenia UI gry`,
    badUiD.length === 0, badUiD);

  // -------------------------------------------------------------------------
  // (G) Prawy klaster HUD w scenie — pomiar.
  // -------------------------------------------------------------------------
  const noCluster = rows.filter((r) => !r.m.cluster).map(fmt);
  check(`G3a prawy klaster HUD faktycznie zamontowany i wyrenderowany w każdym z ${rows.length} punktów siatki`,
    noCluster.length === 0, noCluster.slice(0, 4));

  const underCluster = rows.filter((r) => r.m.hitInCluster)
    .map((r) => ({ cell: fmt(r), hit: r.m.hitTag, last: r.m.last, cluster: r.m.cluster }));
  check(`G3b środek ostatniej pozycji listy NIE trafia w prawy klaster HUD (chipy/Civpedia/Menu) w żadnym z ${rows.length} punktów siatki`,
    underCluster.length === 0, underCluster.slice(0, 6));

  // G4 — kontrakt, nie „zero pikseli". Źródłem prawdy dla pasa górnego prawego HUD-u jest
  // `hudLayout.ts::hudRightRailBottomPx()` (= HUD_TOP_PX + max(chip row, action row)); ten sam
  // rachunek robi `eventsPanelTopPx()` dla panelu wydarzeń. Twarde kryterium: górna krawędź
  // panelu budowy NIGDY nie wchodzi w ten pas. Runda 2 to łamała (`top` schodzące do 0px).
  const intoRail = rows
    .map((r) => ({ r, topCss: Math.round((r.m.panel.top / (r.m.uiZoom || 1)) * 10) / 10 }))
    .filter((x) => x.topCss + 0.5 < HL.rightRailBottom)
    .map((x) => ({ cell: fmt(x.r), panelTopCss: x.topCss, railBottomCss: HL.rightRailBottom, cluster: x.r.m.cluster }));
  check(`G4 górna krawędź panelu budowy NIGDY nie wchodzi w pas zarezerwowany dla prawego klastra HUD (hudRightRailBottomPx = ${HL.rightRailBottom}px CSS) — ${rows.length} punktów siatki`,
    intoRail.length === 0, intoRail.slice(0, 6));

  // Reszta przecięcia prostokątów: przy powiększeniu UI wiersz chipów ZAWIJA SIĘ, więc realny
  // klaster bywa wyższy niż jego własna stała `hudRightRailBottomPx()`. To rozjazd w warstwie
  // HUD-u (nie w panelu budowy) i istnieje tak samo w stanie zastanym — raportujemy liczbą,
  // nie chowamy, ale nie blokuje tego tematu.
  const crossCluster = rows.filter((r) => r.m.clusterOverlapPx !== null && r.m.clusterOverlapPx > 0.5)
    .map((r) => ({ cell: fmt(r), overlapPx: r.m.clusterOverlapPx,
      clusterBottomCss: Math.round((r.m.cluster.bottom / (r.m.uiZoom || 1)) * 10) / 10 }));
  console.log(`[info] resztkowe przecięcie prostokątów panel×klaster (klaster wyższy niż własna stała ${HL.rightRailBottom}px, bo wiersz chipów się zawija): ${crossCluster.length}/${rows.length}`
    + (crossCluster.length ? ' — max ' + Math.max(...crossCluster.map((c) => c.overlapPx)) + 'px, np. ' + JSON.stringify(crossCluster[0]) : ''));

  // G5 — w drugą stronę: panel budowy ma z-index WYŻSZY od całego `.civ-hud`, więc to on
  // może zasłonić Civpedię/Menu. Kryterium liczone tylko tam, gdzie klaster mieści się we
  // własnym pasie (`hudRightRailBottomPx`). Przy powiększeniu UI wiersz chipów zawija się
  // (`.civ-hud-banner-right{max-width:min(calc(50vw - 340px),780px)}` schodzi przy BR175/200
  // do ~140px) i klaster rozlewa się na 190–230px CSS — wtedy realnym elementem, który w
  // teście przechwytuje klik (`hit`), jest PANEL BUDOWY (stoi nad `.civ-hud` w każdej
  // komórce), nie sam klaster. Korzeń usterki geometrycznej mieszka jednak w warstwie
  // HUD-u — `hudRightRailBottomPx()` zaniża realną wysokość klastra — i istnieje tak samo
  // w stanie zastanym (poprawienie tej stałej usunęłoby też ten skutek uboczny). Raportowane
  // liczbą i do rejestru, poza zakresem tego tematu; poprawka Final Control r3 — patrz
  // 09-final-control-r3.md.
  const clusterFits = (r) => !!r.m.cluster && (r.m.cluster.bottom / (r.m.uiZoom || 1)) <= HL.rightRailBottom + 0.5;
  const btnsBlocked = (r) => !r.m.clusterBtns || !r.m.clusterBtns.wiki || !r.m.clusterBtns.wiki.clickable
    || !r.m.clusterBtns.menu || !r.m.clusterBtns.menu.clickable;
  const fitRows = rows.filter(clusterFits);
  const clusterBlocked = fitRows.filter(btnsBlocked).map((r) => ({ cell: fmt(r), btns: r.m.clusterBtns, panel: r.m.panel }));
  check(`G5 przyciski Civpedia i Menu prawego klastra zostają klikalne przy OTWARTYM panelu budowy we wszystkich ${fitRows.length} komórkach, w których klaster mieści się w swoim pasie (${HL.rightRailBottom}px CSS)`,
    clusterBlocked.length === 0, clusterBlocked.slice(0, 4));
  const spill = rows.filter((r) => !clusterFits(r));
  const spillBlocked = spill.filter(btnsBlocked);
  console.log(`[info] klaster HUD wylewa się poza własny pas (zawijanie wiersza chipów przy powiększeniu UI): ${spill.length}/${rows.length};`
    + ` z tego Civpedia/Menu zasłonięte PRZEZ PANEL BUDOWY: ${spillBlocked.length} — korzeń w warstwie HUD (hudRightRailBottomPx zaniżony), poza zakresem tematu`);

  // -------------------------------------------------------------------------
  // Nachodzenie na stos tury — asercja WARUNKOWA (jawny kompromis geometryczny).
  // W komórce, w której blok zawierający jest niższy niż `top panelu + jeden pełny wiersz
  // + rezerwa stosu tury`, żaden układ nie mieści wszystkiego naraz. Wybór tematu: panel
  // nachodzi wtedy na stos tury (jak w stanie zastanym), zamiast wchodzić pod nieprzezroczysty
  // klaster HUD-u. `forcedOverlap` liczy tę granicę z realnych stałych — to NIE jest lista
  // wyjątków wpisana ręcznie, więc gdy geometria się poprawi, asercja zacznie wymagać zera.
  // -------------------------------------------------------------------------
  const withForced = rows.map((r) => {
    const uz = r.m.uiZoom || 1;
    const bodyHcss = r.m.vh / uz;
    const bottomReserve = (uz === 1 ? HL.turnStack : HL.turnStackZoom) + HL.above;
    const minPanel = r.m.itemH / uz + r.m.panelChromePx;
    const needed = (buildTopPx || 0) + minPanel + bottomReserve;
    return { r, bodyHcss: Math.round(bodyHcss * 10) / 10, needed: Math.round(needed * 10) / 10, forced: bodyHcss + 0.5 < needed };
  });
  const forcedCells = withForced.filter((x) => x.forced);
  const overlapping = withForced.filter((x) => x.r.m.overlapPx > 0.5 && !x.forced)
    .map((x) => ({ cell: fmt(x.r), overlapPx: x.r.m.overlapPx, bodyHcss: x.bodyHcss, needed: x.needed }));
  check('B/C prostokąt panelu budowy nachodzi na stos WYKONAJ/ZAKOŃCZ TURĘ WYŁĄCZNIE w komórkach, w których geometria tego wymusza (jawny kompromis rundy 3)',
    overlapping.length === 0, overlapping);
  console.log(`[info] komórki z wymuszoną geometrią (blok zawierający < top+wiersz+rezerwa): ${forcedCells.length}/${rows.length}`
    + (forcedCells.length ? ' — ' + forcedCells.map((x) => fmt(x.r)).join(', ') : ''));
  console.log(`[info] faktyczne nachodzenie panel×stos tury: ${rows.filter((r) => r.m.overlapPx > 0.5).length}/${rows.length}`);

  // -------------------------------------------------------------------------
  // (F) Podłoga wysokości panelu — rezerwa 90+184px (174px w trybie powiększenia UI) bywa
  // WYŻSZA niż cały blok zawierający (przeglądarka 200% × okno 640 → 320px CSS, a przy UI
  // 125% body ma 256px). `calc(100% - rezerwa)` jest wtedy ujemny; bez podłogi max-height
  // zapada się do zera i panel znika. Wysokość wiersza jest MIERZONA w tym samym renderze,
  // nie przepisana ze stałej — jeśli wiersz urośnie, a podłoga nie, ta asercja czerwieni.
  // -------------------------------------------------------------------------
  // Prostokąty z `getBoundingClientRect()` są w px viewportu, więc przy powiększeniu UI gry
  // są przeskalowane transformem body; `getComputedStyle` zwraca px CSS. Sprowadzamy jedno
  // i drugie do px CSS, dzieląc pomiary prostokątów przez aktywne powiększenie UI.
  const cssPx = (v, r) => v / (r.m.uiZoom || 1);
  const tooShort = rows
    .map((r) => ({ r, panelHcss: cssPx(r.m.panelH, r), minNeeded: cssPx(r.m.itemH, r) + r.m.panelChromePx }))
    .filter(({ panelHcss, minNeeded }) => panelHcss + 0.5 < minNeeded)
    .map(({ r, panelHcss, minNeeded }) => ({
      cell: fmt(r),
      panelHcss: Math.round(panelHcss * 100) / 100,
      minNeeded: Math.round(minNeeded * 100) / 100,
      maxH: r.m.maxHeightCss,
    }));
  const rowHcss = Math.max(...rows.map((r) => cssPx(r.m.itemH, r)));
  check(`F panel budowy NIGDY nie jest niższy niż jeden pełny wiersz listy + chrom panelu (podłoga max-height) — ${rows.length} punktów siatki łączonej`,
    tooShort.length === 0, { rowHcss: Math.round(rowHcss * 100) / 100, tooShort });

  const outOfFrame = rows.filter((r) => r.m.panel.top < -0.5 || r.m.panel.bottom > r.m.vh + 0.5)
    .map((r) => ({ cell: fmt(r), panel: r.m.panel, vh: r.m.vh }));
  check('F panel budowy mieści się w kadrze (górna i dolna krawędź w viewporcie) w każdym punkcie siatki łączonej',
    outOfFrame.length === 0, outOfFrame);

  const badLast = rows.filter((r) => r.m.lastDisabled || r.m.lastKey !== 'fort')
    .map((r) => ({ cell: fmt(r), lastKey: r.m.lastKey, disabled: r.m.lastDisabled }));
  check('F mierzona ostatnia pozycja to odblokowany „Fort" (kliknięcie ma prawo dojść do callbacku)',
    badLast.length === 0, badLast.slice(0, 3));

  // (D) kółko myszy.
  check('D kółko myszy nad listą przewija LISTĘ (scrollTop rośnie)',
    !!wheelRes && wheelRes.after > wheelRes.before, wheelRes);
  check('D kółko myszy nad listą NIE dociera do kanwy mapy (zero zdarzeń wheel na kanwie)',
    !!wheelRes && wheelRes.canvasWheel === 0, wheelRes);

  // (E) regresja pozostałych sekcji panelu + dolny pasek.
  const sections = await (async () => {
    const ctx = await browser.newContext({ viewport: { width: WINDOW_WIDTH, height: 900 } });
    const page = await ctx.newPage();
    await page.setContent(PAGE_CSS);
    await page.addScriptTag({ content: bundleJs });
    await mountScene(page, improvements, hudCss);
    const res = await page.evaluate(() => {
      const panel = document.querySelector('.civ-build-panel');
      const labels = Array.from(panel.querySelectorAll('.lbl')).map((e) => e.textContent.trim());
      const clickableOf = (sel) => {
        const e = panel.querySelector(sel);
        if (!e) return null;
        e.scrollIntoView({ block: 'nearest' });
        const r = e.getBoundingClientRect();
        const hit = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
        return !!hit && (hit === e || e.contains(hit));
      };
      return {
        labels,
        foundCity: clickableOf('[data-found-city]'),
        wonder: clickableOf('[data-wonder-id]'),
        autoBtn: clickableOf('.civ-build-auto-btn'),
        slider: clickableOf('input[data-ulepszenia-empire-percent]'),
      };
    });
    await ctx.close();
    return res;
  })();

  check('E sekcje panelu obecne (Miasto / Cuda świata / Automatyzacja ulepszeń terenu / Ulepszenia terenu)',
    ['Miasto', 'Cuda świata', 'Automatyzacja ulepszeń terenu', 'Ulepszenia terenu']
      .every((l) => sections.labels.includes(l)), sections.labels);
  check('E pozycja „Załóż miasto" nadal klikalna', sections.foundCity === true, sections);
  check('E pozycja cudu świata nadal klikalna', sections.wonder === true, sections);
  check('E przycisk profilu automatu nadal klikalny', sections.autoBtn === true, sections);
  // R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1 — AKTUALIZACJA CELU TEJ ASERCJI (uzasadnienie
  // w 01-operator.md):
  //   CO PILNOWALA: ze przebudowa scrolla panelu budowy nie zaslania suwaka w tym panelu —
  //     mierzone przez `elementFromPoint` na `input[data-praca-empire-split]`, czyli na suwaku
  //     WARSTWY (a) (`CityPodzialPracy.procentBudynki`, podzial Pracy: budynki vs pula imperium).
  //   DLACZEGO STARY WARUNEK PRZESTAL BYC PRAWDA: ten suwak zostal z panelu trybu budowy
  //     usuniety jako TRZECI, zdublowany egzemplarz warstwy (a) (ECHO wlasciciela), wiec
  //     selektor nie ma juz czego znalezc. Wlasnosc „suwak w panelu nie jest zaslaniany" nie
  //     zostala oslabiona — zmienil sie tylko jej nosnik.
  //   CO PILNUJE TERAZ: DOKLADNIE ta sama wlasnosc, zmierzona na suwaku WARSTWY (c)
  //     (`UlepszeniaEmpirePolicy.pracaAutoPercent`, `input[data-ulepszenia-empire-percent]`) —
  //     jedynym suwaku, ktory w tym panelu zostaje. Fixture ma `tryb: 'auto'`, wiec suwak jest
  //     aktywny; test dalej mierzy realny hit-test w Chromium, nie obecnosc w zrodle.
  check('E suwak warstwy (c) (budzet automatu) nadal klikalny — nie zaslaniany przez przebudowany panel',
    sections.slider === true, sections);

  // Rozróżnienie kluczowe dla uczciwości pomiaru: przycisk zasłonięty PRZEZ PANEL BUDOWY to
  // wina tego tematu, przycisk zasłonięty przez górny klaster HUD to skutek okna tak niskiego,
  // że pas HUD-u i stos tury same na siebie zachodzą — i dzieje się to niezależnie od panelu.
  const byPanel = (b) => !!b && !b.clickable && typeof b.hit === 'string' && /civ-build/.test(b.hit);
  const badBtn = withForced.filter((x) => !x.forced && (byPanel(x.r.btns.wykonaj) || byPanel(x.r.btns.endTurn)))
    .map((x) => ({ cell: fmt(x.r), btns: x.r.btns, bodyHcss: x.bodyHcss, needed: x.needed }));
  check('E przyciski WYKONAJ i ZAKOŃCZ TURĘ nie są zasłonięte PRZEZ PANEL BUDOWY w żadnej komórce, w której geometria na to pozwala (w komórkach wymuszonych — jawny kompromis rundy 3)',
    badBtn.length === 0, badBtn.slice(0, 4));
  const blockedByPanelAll = rows.filter((r) => byPanel(r.btns.wykonaj) || byPanel(r.btns.endTurn));
  const blockedByOther = rows.filter((r) => (!r.btns.wykonaj.clickable || !r.btns.endTurn.clickable)
    && !byPanel(r.btns.wykonaj) && !byPanel(r.btns.endTurn));
  console.log(`[info] WYKONAJ/ZAKOŃCZ TURĘ zasłonięte przez PANEL BUDOWY: ${blockedByPanelAll.length}/${rows.length}`
    + (blockedByPanelAll.length ? ' — ' + blockedByPanelAll.map(fmt).join(', ') : ''));
  console.log(`[info] WYKONAJ/ZAKOŃCZ TURĘ zasłonięte przez GÓRNY HUD (nie przez panel; okno niższe niż pas HUD + stos tury): ${blockedByOther.length}/${rows.length}`
    + (blockedByOther.length ? ' — ' + blockedByOther.map(fmt).join(', ') : ''));

  const ref = rows.find((r) => r.kind === 'browser' && r.zoom === 1 && r.winH === 900);
  check('E przyciski WYKONAJ/ZAKOŃCZ TURĘ nieprzesunięte przez otwarcie panelu (ta sama pozycja co bez panelu)',
    !!ref && !!barNoPanel
      && Math.abs(ref.btns.endTurn.rect.top - barNoPanel.endTop) < 1
      && Math.abs(ref.btns.wykonaj.rect.top - barNoPanel.wykTop) < 1,
    { zPanelem: ref ? { end: ref.btns.endTurn.rect.top, wyk: ref.btns.wykonaj.rect.top } : null, bezPanelu: barNoPanel });

  check('brak błędów konsoli/pageerror w całym scenariuszu', consoleErrors.length === 0, consoleErrors.slice(0, 5));

  await browser.close();
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  if (JSON_PATH) {
    fs.mkdirSync(path.dirname(path.resolve(JSON_PATH)), { recursive: true });
    fs.writeFileSync(path.resolve(JSON_PATH), JSON.stringify(rows.map((r) => ({
      cell: fmt(r), zoom: r.zoom, uiZoom: r.uiZoom, winH: r.winH,
      rendered: r.m.rendered, reachable: r.m.reachable, clickable: r.m.clickable, realClick: r.realClick,
      hitTag: r.m.hitTag, hitInCluster: r.m.hitInCluster, clusterOverlapPx: r.m.clusterOverlapPx,
      overlapPx: r.m.overlapPx, panel: r.m.panel, cluster: r.m.cluster, bar: r.m.bar,
      panelH: r.m.panelH, itemH: r.m.itemH, maxHeightCss: r.m.maxHeightCss, vh: r.m.vh,
      wykonaj: r.btns.wykonaj ? r.btns.wykonaj.clickable : null,
      wykonajHit: r.btns.wykonaj ? r.btns.wykonaj.hit : null,
      endTurn: r.btns.endTurn ? r.btns.endTurn.clickable : null,
      endTurnHit: r.btns.endTurn ? r.btns.endTurn.hit : null,
      wiki: r.m.clusterBtns && r.m.clusterBtns.wiki ? r.m.clusterBtns.wiki.clickable : null,
      menu: r.m.clusterBtns && r.m.clusterBtns.menu ? r.m.clusterBtns.menu.clickable : null,
    })), null, 1), 'utf8');
    console.log('[build-panel-ulepszenia-scroll-real-render-test] siatka JSON: ' + path.resolve(JSON_PATH));
  }

  console.log('');
  console.log(`[build-panel-ulepszenia-scroll-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
