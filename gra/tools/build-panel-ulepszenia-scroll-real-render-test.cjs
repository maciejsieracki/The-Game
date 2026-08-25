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
 * kliknie. Dlatego kryterium końcowym jest `document.elementFromPoint()` w ŚRODKU ostatniej
 * pozycji: musi trafić w ten wiersz (albo jego potomka), nie w przycisk dolnego paska i nie
 * w nic. jsdom nie nadaje się do tego w ogóle (`getBoundingClientRect()` zwraca zera,
 * `elementFromPoint` nie istnieje) — stąd realny Chromium (§9 poz. 6a).
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
 *  (B) siatka powiększenia przeglądarki — dla KAŻDEGO punktu: ostatnia pozycja listy
 *      (a) wyrenderowana, (b) osiągalna scrollem, (c) KLIKALNA (elementFromPoint).
 *  (C) siatka powiększenia UI gry (1.25/1.5) — to samo kryterium.
 *  (D) hipoteza „kółko myszy zoomuje mapę zamiast przewijać listę" — realne `mouse.wheel`
 *      nad listą przewija listę i NIE dociera do kanwy mapy.
 *  (E) brak regresji: sekcje MIASTO / CUDA ŚWIATA / AUTOMATYZACJA / ULEPSZENIA TERENU
 *      obecne, a przyciski WYKONAJ i ZAKOŃCZ TURĘ nadal klikalne (panel ich nie zasłania)
 *      i nieprzesunięte względem pozycji bez otwartego panelu.
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

/** Powiększenia przeglądarki z siatki dispatchu. */
const BROWSER_ZOOMS = [1, 1.25, 1.5, 1.75, 2];
/** Wysokości okna (px fizyczne) z siatki dispatchu. */
const WINDOW_HEIGHTS = [1080, 900, 768, 640];
/** Szerokość okna (px fizyczne) — stała, błąd jest pionowy. */
const WINDOW_WIDTH = 1920;
/** Powiększenia UI gry (hud.ts: UI_ZOOM_MIN 0.85 … UI_ZOOM_MAX 1.5). */
const UI_ZOOMS = [1.25, 1.5];

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
function cssRule(src, selector) {
  const i = src.indexOf(selector + '{');
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
  return {
    edge, gap, zoomEdge, wyk, end, lbl, above,
    turnStack: edge + wyk + gap + end + lbl,
    turnStackZoom: zoomEdge + wyk + gap + end + lbl,
  };
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
      'window.__createBuildModeHud = createBuildModeHud;',
      'window.__createBottomBarHud = createBottomBarHud;',
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
        build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
        build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: OWL_STUB }));
      },
    }],
    logLevel: 'silent',
  });
  return fs.readFileSync(OUTFILE, 'utf8');
}

/** Montuje w stronie: kanwę mapy (z licznikiem wheel jak `render/camera.ts`), dolny pasek
 *  WYKONAJ/ZAKOŃCZ TURĘ i panel budowy z REALNĄ listą ulepszeń. */
async function mountScene(page, improvements) {
  await page.evaluate((imps) => {
    document.body.innerHTML = '';
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
    window.__hud = window.__createBuildModeHud({
      listTypes: () => types,
      getActiveKey: () => null,
      onSelectType: () => {},
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
      getEmpirePracaSplit: () => 25,
    });
    window.__hud.update();
  }, improvements);
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
    return {
      itemCount: items.length,
      lastLabel: last.textContent.replace(/\s+/g, ' ').trim().slice(0, 40),
      rendered: r.width > 1 && r.height > 1,
      scrollable: panel.scrollHeight - panel.clientHeight > 1,
      scrollHeight: Math.round(panel.scrollHeight),
      clientHeight: Math.round(panel.clientHeight),
      scrolledTo: Math.round(scrolledTo),
      maxHeightCss: cs.maxHeight,
      panel: { top: Math.round(pr.top), bottom: Math.round(pr.bottom), left: Math.round(pr.left), right: Math.round(pr.right) },
      bar: { top: Math.round(br.top), bottom: Math.round(br.bottom), left: Math.round(br.left), right: Math.round(br.right) },
      overlapPx: Math.round(Math.min(pr.bottom, br.bottom) - Math.max(pr.top, br.top)),
      last: { top: Math.round(r.top), bottom: Math.round(r.bottom), cx, cy },
      vw, vh,
      // (b): cały wiersz mieści się w viewporcie po zjechaniu na dół
      reachable: r.top >= -0.5 && r.bottom <= vh + 0.5 && r.left >= -0.5 && r.right <= vw + 0.5,
      // (c): środek wiersza faktycznie trafia w ten wiersz
      clickable: hitIsLast,
      hitTag: hit ? (hit.className && typeof hit.className === 'string' ? hit.className : hit.tagName) : null,
    };
  });
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
  // Realny Chromium.
  // -------------------------------------------------------------------------
  const bundleJs = await bundle();
  const browser = await launchBrowser();
  const consoleErrors = [];
  const rows = [];
  let shotDone = false;

  const PAGE_CSS = '<style>*{margin:0;padding:0;box-sizing:border-box;}'
    + 'html,body{width:100%;height:100%;background:#0a1020;overflow:hidden;}</style><div id="root"></div>';

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

    for (const winH of WINDOW_HEIGHTS) {
      await page.setViewportSize({
        width: Math.round(WINDOW_WIDTH / browserZoom),
        height: Math.round(winH / browserZoom),
      });
      await mountScene(page, improvements);
      await page.waitForTimeout(20);
      const m = await measureLastItem(page);
      const btns = await measureBottomButtons(page);
      rows.push({ kind: 'browser', zoom: browserZoom, winH, m, btns });

      if (!shotDone && SHOT_PATH && browserZoom === 1.5 && winH === 900) {
        fs.mkdirSync(path.dirname(SHOT_PATH), { recursive: true });
        await page.screenshot({ path: SHOT_PATH });
        console.log('[build-panel-ulepszenia-scroll-real-render-test] zrzut: ' + SHOT_PATH);
        shotDone = true;
      }
    }

    // Powiększenie UI gry mierzymy przy 100% przeglądarki (osobny mechanizm).
    if (browserZoom === 1) {
      for (const uz of UI_ZOOMS) {
        for (const winH of WINDOW_HEIGHTS) {
          await page.setViewportSize({ width: WINDOW_WIDTH, height: winH });
          await mountScene(page, improvements);
          await setUiZoom(page, uz);
          await page.evaluate(() => window.__hud.update());
          await page.waitForTimeout(20);
          const m = await measureLastItem(page);
          const btns = await measureBottomButtons(page);
          rows.push({ kind: 'ui', zoom: uz, winH, m, btns });
        }
        await setUiZoom(page, 1);
      }
    }

    // (D) kółko myszy nad listą — tylko raz, przy 100%.
    let wheel = null;
    if (browserZoom === 1) {
      await page.setViewportSize({ width: WINDOW_WIDTH, height: 900 });
      await mountScene(page, improvements);
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
      await mountScene(page, improvements);
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
  const fmt = (r) => `${r.kind === 'ui' ? 'UI' : 'BR'} ${Math.round(r.zoom * 100)}% × ${r.winH}px`;
  if (VERBOSE) {
    console.log('');
    console.log('--- SIATKA POMIAROWA (a=wyrenderowana, b=osiągalna scrollem, c=klikalna) ---');
    for (const r of rows) {
      console.log(
        `${fmt(r).padEnd(18)} a=${r.m.rendered ? 1 : 0} b=${r.m.reachable ? 1 : 0} c=${r.m.clickable ? 1 : 0}`
        + ` | panel ${r.m.panel.top}..${r.m.panel.bottom} bar ${r.m.bar.top}..${r.m.bar.bottom}`
        + ` overlap=${Math.max(0, r.m.overlapPx)} | scroll ${r.m.scrolledTo}/${r.m.scrollHeight - r.m.clientHeight}`
        + ` maxH=${r.m.maxHeightCss} | last ${r.m.last.top}..${r.m.last.bottom} vh=${r.m.vh} hit=${r.m.hitTag}`,
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

  const badUiB = uiRows.filter((r) => !r.m.reachable).map((r) => ({ cell: fmt(r), last: r.m.last, vh: r.m.vh, maxH: r.m.maxHeightCss }));
  check(`C(b) ostatnia pozycja OSIĄGALNA scrollem w każdym z ${uiRows.length} punktów siatki powiększenia UI gry`,
    badUiB.length === 0, badUiB);

  const badUiC = uiRows.filter((r) => !r.m.clickable).map((r) => ({ cell: fmt(r), hit: r.m.hitTag, last: r.m.last, bar: r.m.bar }));
  check(`C(c) ostatnia pozycja KLIKALNA w każdym z ${uiRows.length} punktów siatki powiększenia UI gry`,
    badUiC.length === 0, badUiC);

  const overlapping = rows.filter((r) => r.m.overlapPx > 0.5).map((r) => ({ cell: fmt(r), overlapPx: r.m.overlapPx }));
  check('B/C prostokąt panelu budowy NIE nachodzi na stos WYKONAJ/ZAKOŃCZ TURĘ w żadnym punkcie siatki',
    overlapping.length === 0, overlapping);

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
    await mountScene(page, improvements);
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
        slider: clickableOf('input[data-praca-empire-split]'),
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
  check('E suwak podziału Pracy nadal klikalny (warstwa suwaków budżetu nietknięta)', sections.slider === true, sections);

  const badBtn = rows.filter((r) => !r.btns.wykonaj || !r.btns.wykonaj.clickable || !r.btns.endTurn || !r.btns.endTurn.clickable)
    .map((r) => ({ cell: fmt(r), btns: r.btns }));
  check('E przyciski WYKONAJ i ZAKOŃCZ TURĘ klikalne przy otwartym panelu w każdym punkcie siatki (panel ich nie zasłania)',
    badBtn.length === 0, badBtn.slice(0, 4));

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

  console.log('');
  console.log(`[build-panel-ulepszenia-scroll-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
