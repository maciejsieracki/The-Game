'use strict';
/**
 * entity-card-diorama-real-render-test.cjs
 *
 * TEMAT: R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1 (Wariant A — diorama na całą szerokość karty).
 *
 * Co pilnuje i dlaczego w PRAWDZIWYM Chromium, nie w jsdom:
 *
 *  (A) NORMALNY (non-compact) nagłówek karty jest DIORAMĄ: element `.entity-card-header`
 *      niesie klasę `.entity-card-diorama`, ma pełną szerokość karty (>= 96% jej szerokości),
 *      wysokość ~190px (>=160px), ciemne tło sceny, a podgląd w środku jest POWIĘKSZONY
 *      (>=90px, wobec 34px sprzed tematu) i WYŚRODKOWANY w poziomie. Wszystko to są wielkości
 *      liczone z realnego `getBoundingClientRect()`/`getComputedStyle()` — jsdom nie ma
 *      layoutu ani kaskady, więc nie odróżniłby diaromy od starego wiersza nagłówka.
 *
 *  (B) Tytuł i podtytuł są OVERLAYEM w LEWYM DOLNYM rogu diaromy (pozycja liczona względem
 *      prostokąta nagłówka) i mają `text-shadow` — czyli realnie czytelny tekst na ciemnym
 *      tle, a nie zwykły wiersz pod medalionem.
 *
 *  (C) Podgląd jest TYM SAMYM, co przed tematem: dla `kind:'unit'` wewnątrz
 *      `.entity-card-medallion` żyje zamontowany `canvas.unit-mini-canvas` ALBO tekstowy
 *      fallback `.unit-mini-fallback` (zależnie od dostępności WebGL w środowisku — ta sama
 *      alternatywa co w `unit-card-3d-preview-coverage-test.cjs`), a dla `building`/`wonder`
 *      powiększony, wyśrodkowany `<svg>` (`kind:'icon'`).
 *
 *  (D) TRYB KOMPAKTOWY (`.entity-card--compact`, włączany przez kliknięcie „Pokaż pozostałe N"
 *      na karcie z `compactHeaderOnExpand` — realnie ustawianym przez `technologyAdapter.ts`
 *      dla zagnieżdżonej listy jednostek w karcie technologii) NIE DOSTAJE DIAROMY: nagłówek
 *      wraca do `display:flex`, wysokości < 80px i medalionu 24x24. To jest jawny, żywy dowód
 *      kryterium 1c dispatchu („compact PRZETRWAŁ nietknięty"), a nie założenie.
 *
 *  (E) BRAK POZIOMEGO OVERFLOW przy dwóch szerokościach viewportu (1280 i 380 — poniżej
 *      434px karty, czyli gałąź `calc(100vw - 32px)`): `scrollWidth <= clientWidth` dla
 *      `document.documentElement`, karty i samego nagłówka.
 *
 *  (F) MUTACJA (kontrola nietautologiczności, R-PROC-AUTOBOT.md §9 pkt 6a): po wycięciu
 *      bloku CSS diaromy z arkusza te same asercje MUSZĄ wrócić na czerwono — nagłówek
 *      wraca do starego, płaskiego wiersza (bazowe reguły `.entity-card-header` zostały w
 *      arkuszu celowo nietknięte i pełnią rolę bazy trybu kompaktowego).
 *
 *  (G) ŻYWA ŚCIEŻKA PRODUKCYJNA `showUnitInfoCardDialog` (`unitInfoCard.ts`, POZA allowlistą
 *      tematu): diorama działa też tam, a dopinany przez ten plik przycisk ✕ (`card
 *      .querySelector('.entity-card-header')`, linia 98 — kod liczący na to, że nagłówek jest
 *      flexem) nadal ląduje w prawym górnym rogu i przechodzi hit-test. Żadna inna bramka
 *      nie mierzy pozycji tego przycisku, więc bez (G) regres byłby niewidoczny.
 *
 *  (D2) ŻYWA ŚCIEŻKA `showTechDiscoveryNotice` W COMPACT (runda 2, zarzut 1 Evaluatora):
 *      ten plik dopina do `.entity-card-header` własny ✕ (`.tdn-entity-close`, position:absolute
 *      o niskiej specyficzności 0,1,0). Mierzymy pozycję ✕ PRZED i PO kliknięciu „Pokaż
 *      pozostałe N" — musi być identyczna i absolutna. Sekcja (G) tego nie łapie: dotyczy
 *      wyłącznie `unitInfoCard` i wyłącznie trybu non-compact.
 *
 *  (H) FALLBACK BEZ WebGL (runda 2, zarzut 2): odtworzony 1:1 jak w `unitMiniPreview.ts:130-132`,
 *      mierzony PO wstrzyknięciu arkusza `unitInfoCard` — czyli na ścieżce, gdzie reguła
 *      z rundy 1 przegrywała kaskadę. Sprawdzamy rozmiar czcionki ORAZ brak przycięcia tekstu.
 *
 *  (I) ELIPSA „GRUNTU" REALNIE WIDOCZNA (runda 2, zarzut 3): dwa żywe zrzuty nagłówka
 *      (z elipsą i z `display:none`) dekodowane w Chromium i porównane piksel po pikselu.
 *      Samo istnienie węzła nie jest dowodem widoczności.
 *
 *  Zrzuty PNG (żywy `page.screenshot()`) lądują w
 *  `dyspozycje/autobot/runs/R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1/dowody/`.
 *
 * Usage (z gra/): node tools/entity-card-diorama-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[entity-card-diorama-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const REPO = path.resolve(GRA, '..');
const ENTRY = path.resolve(__dirname, '.entity-card-diorama-entry.ts');
const OUTFILE = path.resolve(__dirname, '.entity-card-diorama-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const RENDERER = path.resolve(GRA, 'src', 'ui', 'entityCards', 'renderer.ts');
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');
const SHOTS = path.resolve(
  REPO, 'dyspozycje', 'autobot', 'runs', 'R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1', 'dowody',
);

// Kotwice bloku CSS dopisanego przez ten temat — używane przez mutację (F). Kotwica końcowa
// jest jawnym komentarzem-sentinelem w `ENTITY_CARD_CSS`, żeby dopisanie kolejnych reguł na
// końcu arkusza nie zmieniło zakresu mutacji (ten sam wzorzec co
// `entity-card-action-buttons-real-render-test.cjs`).
const MARKER_START = '/* R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1 — DIORAMA';
const MARKER_END = '/* KOTWICA KOŃCOWA bloku R-KARTA-JEDNOSTKI-3D-EKSPOZYCJA-UX-Q1';

const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'buildings.json'), 'utf8'));
const wonders = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'wonders.json'), 'utf8'));
const techJson = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'tech.json'), 'utf8'));
const unitName = (units.find((u) => u && u.Jednostka === 'Wojownik') || units.find((u) => u && u.Jednostka)).Jednostka;
const buildingId = buildings.find((b) => b && b.id)?.id;
const wonderId = wonders.cuda.find((w) => w && w.id)?.id;
const techNames = techJson.technologie.map((t) => t.Technologia).filter(Boolean);

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function listSvgs(dir, prefix, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listSvgs(p, prefix + e.name + '/', out);
    else if (e.name.endsWith('.svg')) out[prefix + e.name] = fs.readFileSync(p, 'utf8');
  }
  return out;
}

/** Vite-owe konstrukcje (`import.meta.glob`, `*.svg?raw`) nie istnieją w gołym esbuildzie —
 * inline'ujemy PRAWDZIWE pliki, żeby render w Chromium (i zrzuty) był 1:1 z produkcją.
 * Ten sam wzorzec co `entity-card-action-buttons-real-render-test.cjs`. */
const viteCompatPlugin = {
  name: 'vite-compat',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'raw-file',
    }));
    build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (args) => ({
      contents: fs.readFileSync(args.path, 'utf8'), loader: 'text',
    }));
    build.onLoad({ filter: /brandAssets\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== BRAND_ASSETS_TS) return null;
      const src = fs.readFileSync(args.path, 'utf8').replace(
        /import\.meta\.glob\('\.\/brand\/\*\*\/\*\.svg',\s*\{[\s\S]*?\}\)/,
        JSON.stringify(listSvgs(BRAND_DIR, './brand/', {})),
      );
      return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      const src = fs.readFileSync(args.path, 'utf8');
      if (!src.includes('import.meta.glob')) return null;
      return {
        contents: 'const __viteGlobStub = () => ({});\n' + src.replace(/import\.meta\.glob/g, '__viteGlobStub'),
        loader: 'ts', resolveDir: path.dirname(args.path),
      };
    });
  },
};

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[entity-card-diorama-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Realny pomiar jednej wyrenderowanej karty — wyłącznie `getBoundingClientRect`
 * i `getComputedStyle`, czyli rzeczy, których jsdom nie potrafi policzyć. */
const MEASURE = (rootId) => {
  const card = document.getElementById(rootId);
  if (!card) return { missing: true };
  const header = card.querySelector('.entity-card-header');
  const med = card.querySelector('.entity-card-medallion');
  const tw = card.querySelector('.entity-card-title-wrap');
  const h2 = card.querySelector('h2');
  if (!header || !med) return { missing: true };
  const cr = card.getBoundingClientRect();
  const hr = header.getBoundingClientRect();
  const mr = med.getBoundingClientRect();
  const twr = tw ? tw.getBoundingClientRect() : null;
  const hcs = getComputedStyle(header);
  const twcs = tw ? getComputedStyle(tw) : null;
  return {
    cardW: Math.round(cr.width),
    headerW: Math.round(hr.width),
    headerH: Math.round(hr.height),
    headerDisplay: hcs.display,
    headerBgImage: hcs.backgroundImage,
    hasDioramaClass: header.classList.contains('entity-card-diorama'),
    medW: Math.round(mr.width),
    medH: Math.round(mr.height),
    // odchylenie środka podglądu od środka nagłówka (poziomo)
    medCenterOffset: Math.round(Math.abs((mr.left + mr.width / 2) - (hr.left + hr.width / 2))),
    medTop: Math.round(mr.top - hr.top),
    groundVisible: (() => {
      const g = card.querySelector('.entity-card-diorama-ground');
      if (!g) return 'no-node';
      const gr = g.getBoundingClientRect();
      return getComputedStyle(g).display !== 'none' && gr.width > 40 ? 'yes' : 'no';
    })(),
    titleText: h2 ? (h2.textContent || '').trim() : null,
    titleFontSize: h2 ? getComputedStyle(h2).fontSize : null,
    // pozycja overlayu tytułu WZGLĘDEM nagłówka
    titleLeftInHeader: twr ? Math.round(twr.left - hr.left) : null,
    titleBottomGap: twr ? Math.round(hr.bottom - twr.bottom) : null,
    titleInsideHeader: twr ? (twr.top >= hr.top - 1 && twr.bottom <= hr.bottom + 1) : null,
    titlePosition: twcs ? twcs.position : null,
    titleTextShadow: twcs ? twcs.textShadow : null,
    subtitleText: (() => {
      const s = card.querySelector('.entity-card-subtitle');
      return s ? (s.textContent || '').trim() : null;
    })(),
    hasCanvas: !!card.querySelector('.entity-card-medallion canvas.unit-mini-canvas'),
    hasFallback: !!card.querySelector('.entity-card-medallion .unit-mini-fallback'),
    hasSvg: !!card.querySelector('.entity-card-medallion > svg'),
    svgW: (() => {
      const s = card.querySelector('.entity-card-medallion > svg');
      return s ? Math.round(s.getBoundingClientRect().width) : 0;
    })(),
    isCompact: card.classList.contains('entity-card--compact'),
    // Kolejność DOM w karcie: nagłówek/diorama musi poprzedzać historię i body.
    childOrder: Array.from(card.children).map((c) => c.className.split(' ')[0]),
    overflowX: {
      doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      card: card.scrollWidth - card.clientWidth,
      header: header.scrollWidth - header.clientWidth,
    },
  };
};

function isDiorama(m) {
  return !m.missing
    && m.hasDioramaClass
    && m.headerDisplay === 'block'
    && m.headerH >= 160
    && m.headerW >= Math.round(m.cardW * 0.96)
    && m.medW >= 90 && m.medH >= 90
    && m.medCenterOffset <= 2
    && m.groundVisible === 'yes'
    && m.titlePosition === 'absolute'
    && m.titleInsideHeader === true
    && m.titleLeftInHeader >= 0 && m.titleLeftInHeader <= 24
    && m.titleBottomGap >= 0 && m.titleBottomGap <= 28
    && m.titleTextShadow !== 'none';
}

function isOldSmallHeader(m) {
  return !m.missing
    && m.headerDisplay === 'flex'
    && m.headerH < 80
    && m.medW <= 40 && m.medH <= 40
    && m.titlePosition === 'static';
}

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });

  // --- (0) Statyczne kotwice w źródle -----------------------------------------------------
  const rendererSrc = fs.readFileSync(RENDERER, 'utf8');
  check('(0) renderEntityCard nadaje nagłówkowi klasę entity-card-diorama',
    /el\('div', 'entity-card-header entity-card-diorama'\)/.test(rendererSrc));
  check('(0) ENTITY_CARD_CSS zawiera regułę .entity-card-diorama', /\n\.entity-card-diorama\{/.test(rendererSrc));
  check('(0) ENTITY_CARD_CSS zachowuje BAZOWĄ regułę .entity-card-header (baza trybu compact)',
    /\n\.entity-card-header\{display:flex/.test(rendererSrc));
  check('(0) blok ma kotwicę początkową i końcową dla mutacji (F)',
    rendererSrc.includes(MARKER_START) && rendererSrc.includes(MARKER_END));

  fs.writeFileSync(ENTRY, [
    "import { buildEntityCardData, renderEntityCard, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
    "import { unitToSlug, technologyIdFromName } from '../src/ui/entityCards/registry.ts';",
    "import { ensureBrandRootTokens } from '../src/ui/brandTokenVars.ts';",
    "import { showUnitInfoCardDialog, ensureUnitInfoCardStyles } from '../src/ui/unitInfoCard.ts';",
    "import { showTechDiscoveryNotice } from '../src/ui/techDiscoveryNotice.ts';",
    "import { loadGameData } from '../src/data/loader.ts';",
    'window.__C = { buildEntityCardData, renderEntityCard, ENTITY_CARD_CSS, unitToSlug, technologyIdFromName,',
    '  ensureBrandRootTokens, showUnitInfoCardDialog, ensureUnitInfoCardStyles, showTechDiscoveryNotice, loadGameData };',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: [viteCompatPlugin], logLevel: 'silent',
  });
  const bundle = fs.readFileSync(OUTFILE, 'utf8');

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  async function boot() {
    // Reset 1:1 z `gra/index.html` — bez niego pomiary liczyłyby się w innym otoczeniu.
    await page.setContent('<!DOCTYPE html><html><head><style>'
      + '*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;padding:16px;display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;}'
      + '</style></head><body></body></html>');
    await page.addScriptTag({ content: bundle });
    await page.evaluate(() => {
      window.__C.ensureBrandRootTokens();
      const style = document.createElement('style');
      style.id = 'entity-card-css-under-test';
      style.textContent = window.__C.ENTITY_CARD_CSS;
      document.head.appendChild(style);
      window.__origCss = new Map();
      window.__setFix = (on, mStart, mEnd) => {
        document.querySelectorAll('style').forEach((s) => {
          if (!window.__origCss.has(s)) window.__origCss.set(s, s.textContent);
          const orig = window.__origCss.get(s);
          if (on) { s.textContent = orig; return; }
          const a = orig.indexOf(mStart);
          if (a < 0) { s.textContent = orig; return; }
          const b = orig.indexOf(mEnd, a);
          s.textContent = b > -1 ? orig.slice(0, a) + orig.slice(b) : orig.slice(0, a);
        });
      };
      window.__mount = (kind, id, domId) => {
        const data = window.__C.buildEntityCardData(kind, id, {});
        if (!data) return { error: 'no-data', kind, id };
        const card = window.__C.renderEntityCard(data);
        card.id = domId;
        document.body.appendChild(card);
        return { ok: true, medallionKind: data.medallion.kind, compactFlag: data.compactHeaderOnExpand === true };
      };
    });
  }

  try {
    await boot();

    // ------------------------------------------------------------------------------------
    // (A/B/C) karta JEDNOSTKI — diorama z powiększonym, zamontowanym podglądem 3D
    // ------------------------------------------------------------------------------------
    console.log('\n-- (A/B/C) karta jednostki (non-compact) --');
    const mountedUnit = await page.evaluate((n) => window.__mount('unit', window.__C.unitToSlug(n), 'card-unit'), unitName);
    check('fixture: karta jednostki zbudowana z realnych danych', mountedUnit.ok === true, mountedUnit);
    check('(C) medallion.kind === "unit3d" (ta sama zawartość co przed tematem)',
      mountedUnit.medallionKind === 'unit3d', mountedUnit);
    // `mountUnitMiniPreview` montuje przez requestAnimationFrame + kolejkę — dajemy czas.
    await page.waitForTimeout(900);
    const u = await page.evaluate(MEASURE, 'card-unit');
    console.log('[unit]', JSON.stringify(u));
    check('(A) nagłówek karty jednostki JEST diaromą (pełna szerokość, ~190px, wyśrodkowany podgląd >=90px, elipsa gruntu, overlay tytułu w lewym dolnym rogu)',
      isDiorama(u), u);
    check('(A) tło diaromy to ciemny gradient sceny (nie płaskie tło starego nagłówka)',
      u.headerBgImage.includes('gradient'), u.headerBgImage);
    check('(C) podgląd jednostki w diaromie to realnie zamontowany canvas 3D ALBO fallback tekstowy',
      u.hasCanvas || u.hasFallback, { hasCanvas: u.hasCanvas, hasFallback: u.hasFallback });
    check('(B) tytuł karty jest niepusty i większy niż w starym nagłówku (19px)',
      !!u.titleText && u.titleFontSize === '19px', { t: u.titleText, fs: u.titleFontSize });
    check('kolejność DOM: diorama (nagłówek) jest PIERWSZYM dzieckiem karty, przed historią i body',
      u.childOrder[0] === 'entity-card-header', u.childOrder);
    check('kolejność DOM: entity-card-body występuje PO nagłówku',
      u.childOrder.indexOf('entity-card-body') > 0, u.childOrder);
    await page.locator('#card-unit').screenshot({ path: path.join(SHOTS, '1a-karta-jednostki-diorama.png') });

    // ------------------------------------------------------------------------------------
    // (A/C) karta BUDYNKU i CUDU — diorama z powiększoną ikoną SVG
    // ------------------------------------------------------------------------------------
    console.log('\n-- (A/C) karta budynku i cudu (non-compact) --');
    const mountedB = await page.evaluate((id) => window.__mount('building', id, 'card-building'), buildingId);
    const mountedW = await page.evaluate((id) => window.__mount('wonder', id, 'card-wonder'), wonderId);
    check('fixture: karta budynku i cudu zbudowane z realnych danych',
      mountedB.ok === true && mountedW.ok === true, { b: mountedB, w: mountedW });
    check('(C) building/wonder: medallion.kind === "icon" (bez zmian)',
      mountedB.medallionKind === 'icon' && mountedW.medallionKind === 'icon', [mountedB.medallionKind, mountedW.medallionKind]);
    const b = await page.evaluate(MEASURE, 'card-building');
    const w = await page.evaluate(MEASURE, 'card-wonder');
    console.log('[building]', JSON.stringify(b));
    check('(A) nagłówek karty budynku JEST diaromą', isDiorama(b), b);
    check('(A) nagłówek karty cudu JEST diaromą', isDiorama(w), w);
    check('(C) ikona SVG budynku jest POWIĘKSZONA w diaromie (>=90px, wobec 34px sprzed tematu)',
      b.hasSvg && b.svgW >= 90, { hasSvg: b.hasSvg, svgW: b.svgW });
    check('(C) ikona SVG cudu jest POWIĘKSZONA w diaromie', w.hasSvg && w.svgW >= 90, { hasSvg: w.hasSvg, svgW: w.svgW });
    await page.locator('#card-building').screenshot({ path: path.join(SHOTS, '1b-karta-budynku-diorama.png') });
    await page.locator('#card-wonder').screenshot({ path: path.join(SHOTS, '1b-karta-cudu-diorama.png') });
    await page.screenshot({ path: path.join(SHOTS, '1-przeglad-1280px.png'), fullPage: true });

    // ------------------------------------------------------------------------------------
    // (E) brak poziomego overflow — 1280px oraz 380px (gałąź calc(100vw - 32px))
    // ------------------------------------------------------------------------------------
    check('(E) 1280px: zero poziomego overflow (dokument/karta/nagłówek)',
      u.overflowX.doc <= 0 && u.overflowX.card <= 0 && u.overflowX.header <= 0, u.overflowX);

    // ------------------------------------------------------------------------------------
    // (D) TRYB COMPACT — realna ścieżka `compactHeaderOnExpand` karty technologii
    // ------------------------------------------------------------------------------------
    console.log('\n-- (D) karta technologii w trybie compact (compactHeaderOnExpand) --');
    const compactRes = await page.evaluate((names) => {
      const C = window.__C;
      for (const name of names) {
        const id = C.technologyIdFromName(name);
        const data = C.buildEntityCardData('technology', id, {});
        if (!data || data.compactHeaderOnExpand !== true) continue;
        const card = C.renderEntityCard(data);
        card.id = 'card-tech';
        document.body.appendChild(card);
        const more = card.querySelector('button.entity-card-more');
        if (!more) { card.remove(); continue; }
        // Zdjęcie PRZED kliknięciem (nagłówek jeszcze non-compact) do porównania.
        const beforeCompact = card.classList.contains('entity-card--compact');
        more.click();
        return {
          ok: true, tech: name, beforeCompact,
          afterCompact: card.classList.contains('entity-card--compact'),
          moreLabel: (more.textContent || '').trim(),
        };
      }
      return { ok: false };
    }, techNames);
    check('fixture (D): znaleziona karta technologii z compactHeaderOnExpand i przyciskiem „Pokaż pozostałe N"',
      compactRes.ok === true, compactRes);
    check('(D) klik „Pokaż pozostałe N" faktycznie włącza klasę .entity-card--compact (realna ścieżka technologyAdapter)',
      compactRes.beforeCompact === false && compactRes.afterCompact === true, compactRes);
    const t = await page.evaluate(MEASURE, 'card-tech');
    console.log('[tech-compact]', JSON.stringify(t));
    check('(D) karta w trybie compact NIE MA diaromy — stary mały nagłówek flex, medalion 24x24',
      t.isCompact === true && isOldSmallHeader(t) && t.medW === 24 && t.medH === 24 && !isDiorama(t), t);
    check('(D) w trybie compact elipsa gruntu jest ukryta',
      t.groundVisible === 'no', t.groundVisible);
    // RUNDA 2, zarzut 4 Evaluatora: reguła skalująca zawartość medalionu ('> svg{width:100%}')
    // działała także w compact i kurczyła ikonę z 28px (rozmiar własny z atrybutów pliku SVG,
    // stan bazy `3d9dd86c`) do 24px. Wymiar samego medalionu (24x24) tego nie łapał.
    check('(D) w trybie compact ikona SVG ma SWÓJ rozmiar 28px (jak na bazie), a nie skurczone 24px',
      t.hasSvg && t.svgW === 28, { hasSvg: t.hasSvg, svgW: t.svgW });
    await page.locator('#card-tech').screenshot({ path: path.join(SHOTS, '1c-karta-technologii-compact-bez-diaromy.png') });

    // ------------------------------------------------------------------------------------
    // (D2) ŻYWA ŚCIEŻKA `showTechDiscoveryNotice` W TRYBIE COMPACT — RUNDA 2, zarzut 1.
    //      `techDiscoveryNotice.ts:610` dopina do `.entity-card-header` własny ✕
    //      (`.tdn-entity-close{position:absolute;top:10px;right:10px}`, specyficzność 0,1,0).
    //      Runda 1 dodała w bloku kompaktowym regułę `... > :not(...){position:static}`
    //      (0,4,0), która ten ✕ wypychała do potoku flex PO kliknięciu „Pokaż pozostałe N".
    //      Sekcja (G) tego nie łapała: mierzy ✕ tylko dla `unitInfoCard` i tylko non-compact.
    // ------------------------------------------------------------------------------------
    console.log('\n-- (D2) żywa ścieżka showTechDiscoveryNotice: ✕ w trybie compact --');
    const tdn = await page.evaluate(async (techName) => {
      window.__C.showTechDiscoveryNotice({ techName, eraIndex: 0, kind: 'preview' });
      await new Promise((r) => setTimeout(r, 500));
      const host = document.getElementById('civ-tech-discovery-notice-host');
      if (!host) return { missing: 'host' };
      const card = host.querySelector('.entity-card');
      const btn = host.querySelector('.tdn-entity-close');
      if (!card || !btn) return { missing: 'card-or-btn' };
      const more = card.querySelector('button.entity-card-more');
      if (!more) return { missing: 'more-button' };
      const read = () => {
        const header = card.querySelector('.entity-card-header');
        const hr = header.getBoundingClientRect();
        const br = btn.getBoundingClientRect();
        const svg = card.querySelector('.entity-card-medallion > svg');
        const hit = document.elementFromPoint(br.left + br.width / 2, br.top + br.height / 2);
        return {
          compact: card.classList.contains('entity-card--compact'),
          btnPosition: getComputedStyle(btn).position,
          btnFromRight: Math.round(hr.right - br.right),
          btnFromTop: Math.round(br.top - hr.top),
          btnInsideHeader: br.top >= hr.top - 1 && br.bottom <= hr.bottom + 1,
          svgW: svg ? Math.round(svg.getBoundingClientRect().width) : 0,
          hitClass: hit ? String(hit.className) : null,
        };
      };
      const before = read();
      more.click();
      await new Promise((r) => setTimeout(r, 150));
      const after = read();
      return { ok: true, before, after };
    }, compactRes.tech);
    console.log('[tdn]', JSON.stringify(tdn));
    check('fixture (D2): showTechDiscoveryNotice wyrenderował kartę z ✕ i przyciskiem „Pokaż pozostałe N"',
      tdn.ok === true, tdn);
    check('(D2) klik „Pokaż pozostałe N" włącza compact na żywej ścieżce techDiscoveryNotice',
      tdn.ok && tdn.before.compact === false && tdn.after.compact === true, tdn);
    check('(D2) ✕ POZOSTAJE absolutnie pozycjonowany w compact (10px od prawej/góry — jak na bazie)',
      tdn.ok && tdn.after.btnPosition === 'absolute' && tdn.after.btnInsideHeader === true
      && tdn.after.btnFromRight >= 6 && tdn.after.btnFromRight <= 14
      && tdn.after.btnFromTop >= 6 && tdn.after.btnFromTop <= 14, tdn.ok ? tdn.after : tdn);
    check('(D2) pozycja ✕ jest IDENTYCZNA przed i po przejściu w compact (zero przeskoku)',
      tdn.ok && tdn.before.btnFromRight === tdn.after.btnFromRight
      && tdn.before.btnFromTop === tdn.after.btnFromTop,
      tdn.ok ? { before: tdn.before, after: tdn.after } : tdn);
    check('(D2) elementFromPoint na środku ✕ trafia w SAM przycisk także w compact',
      tdn.ok && typeof tdn.after.hitClass === 'string' && tdn.after.hitClass.includes('tdn-entity-close'),
      tdn.ok ? tdn.after.hitClass : tdn);
    check('(D2) ikona SVG w compact na ścieżce techDiscoveryNotice ma 28px (jak na bazie)',
      tdn.ok && tdn.after.svgW === 28, tdn.ok ? tdn.after.svgW : tdn);
    if (tdn.ok) {
      await page.locator('#civ-tech-discovery-notice-host .entity-card').first()
        .screenshot({ path: path.join(SHOTS, '1c-tdn-compact-przycisk-zamkniecia.png') });
    }
    await page.evaluate(() => {
      const h = document.getElementById('civ-tech-discovery-notice-host');
      if (h) h.remove();
    });

    // ------------------------------------------------------------------------------------
    // (E) druga szerokość viewportu — 380px
    // ------------------------------------------------------------------------------------
    console.log('\n-- (E) druga szerokość viewportu: 380px --');
    await page.setViewportSize({ width: 380, height: 900 });
    await page.waitForTimeout(150);
    const uNarrow = await page.evaluate(MEASURE, 'card-unit');
    console.log('[unit@380]', JSON.stringify({ cardW: uNarrow.cardW, overflowX: uNarrow.overflowX }));
    check('(E) 380px: karta zwęża się wg calc(100vw - 32px), NIE zostaje przy 434px',
      uNarrow.cardW < 434 && uNarrow.cardW > 300, uNarrow.cardW);
    check('(E) 380px: zero poziomego overflow (dokument/karta/nagłówek)',
      uNarrow.overflowX.doc <= 0 && uNarrow.overflowX.card <= 0 && uNarrow.overflowX.header <= 0, uNarrow.overflowX);
    check('(E) 380px: diorama nadal poprawna (pełna szerokość karty, wyśrodkowany podgląd)',
      isDiorama(uNarrow), uNarrow);
    await page.screenshot({ path: path.join(SHOTS, '4-przeglad-380px.png'), fullPage: true });
    await page.setViewportSize({ width: 1280, height: 950 });

    // ------------------------------------------------------------------------------------
    // (F) MUTACJA — bez bloku CSS diaromy asercje MUSZĄ oblać
    // ------------------------------------------------------------------------------------
    console.log('\n-- (F) Mutacja: wycięcie bloku CSS diaromy z arkusza --');
    await page.evaluate(({ a, b }) => window.__setFix(false, a, b), { a: MARKER_START, b: MARKER_END });
    await page.waitForTimeout(120);
    const mut = await page.evaluate(MEASURE, 'card-unit');
    console.log('[unit-mutated]', JSON.stringify({ headerH: mut.headerH, display: mut.headerDisplay, medW: mut.medW }));
    check('(F) mutacja: nagłówek karty jednostki PRZESTAJE być diaromą (test realnie testuje)',
      !isDiorama(mut), mut);
    check('(F) mutacja: nagłówek wraca do starego, płaskiego wiersza (flex, <80px, medalion <=40px)',
      isOldSmallHeader(mut), mut);
    await page.locator('#card-unit').screenshot({ path: path.join(SHOTS, 'F-kontrola-negatywna-bez-css-diaromy.png') });
    await page.evaluate(({ a, b }) => window.__setFix(true, a, b), { a: MARKER_START, b: MARKER_END });
    await page.waitForTimeout(120);
    const restored = await page.evaluate(MEASURE, 'card-unit');
    check('(F) po przywróceniu arkusza diorama wraca (mutacja nie zostawiła strony w złym stanie)',
      isDiorama(restored), restored);

    // ------------------------------------------------------------------------------------
    // (G) ŻYWA ŚCIEŻKA PRODUKCYJNA — `showUnitInfoCardDialog` (unitInfoCard.ts, POZA
    //     allowlistą tematu). Ten plik dopina własny przycisk ✕ do `.entity-card-header`
    //     (`card.querySelector`, linia 98) i liczy na to, że nagłówek jest flexem. Diorama
    //     flexem nie jest, więc ENTITY_CARD_CSS ustawia takim doczepionym elementom pozycję
    //     w prawym górnym rogu sceny. Bez tej asercji regres byłby niewidoczny dla
    //     wszystkich pozostałych bramek (żadna nie mierzy pozycji ✕).
    // ------------------------------------------------------------------------------------
    console.log('\n-- (G) żywa ścieżka showUnitInfoCardDialog: diorama + przycisk zamknięcia --');
    const live = await page.evaluate(async (n) => {
      const P = window.__C;
      P.ensureUnitInfoCardStyles();
      const data = await P.loadGameData();
      const unit = data.units.find((x) => x.Jednostka === n) || data.units[0];
      P.showUnitInfoCardDialog(unit, data, {});
      await new Promise((r) => setTimeout(r, 900));
      const card = document.querySelector('.unit-info-card-backdrop .entity-card-unit');
      if (!card) return { missing: true };
      const header = card.querySelector('.entity-card-header');
      const btn = card.querySelector('.unit-info-card-close');
      if (!header || !btn) return { missing: true };
      const hr = header.getBoundingClientRect();
      const br = btn.getBoundingClientRect();
      const hit = document.elementFromPoint(br.left + br.width / 2, br.top + br.height / 2);
      return {
        headerH: Math.round(hr.height),
        isDioramaHeader: header.classList.contains('entity-card-diorama'),
        btnPosition: getComputedStyle(btn).position,
        btnFromRight: Math.round(hr.right - br.right),
        btnFromTop: Math.round(br.top - hr.top),
        btnInsideHeader: br.top >= hr.top - 1 && br.bottom <= hr.bottom + 1,
        hitClass: hit ? String(hit.className) : null,
        medW: Math.round(card.querySelector('.entity-card-medallion').getBoundingClientRect().width),
      };
    }, unitName);
    console.log('[live-unitInfoCard]', JSON.stringify(live));
    check('(G) żywy dialog karty jednostki ma nagłówek-dioramę z powiększonym podglądem',
      live.isDioramaHeader === true && live.headerH >= 160 && live.medW >= 90, live);
    check('(G) przycisk ✕ doczepiony przez unitInfoCard.ts ląduje w prawym górnym rogu diaromy',
      live.btnPosition === 'absolute' && live.btnInsideHeader === true
      && live.btnFromRight >= 0 && live.btnFromRight <= 20
      && live.btnFromTop >= 0 && live.btnFromTop <= 20, live);
    check('(G) elementFromPoint na środku ✕ trafia w SAM przycisk (diorama go nie przykryła)',
      typeof live.hitClass === 'string' && live.hitClass.includes('unit-info-card-close'), live.hitClass);
    await page.locator('.unit-info-card-backdrop .entity-card-unit').screenshot({
      path: path.join(SHOTS, '1a-zywa-sciezka-unitInfoCard-dialog.png'),
    });

    // ------------------------------------------------------------------------------------
    // (H) FALLBACK BEZ WebGL — RUNDA 2, zarzut 2 Evaluatora. W tym środowisku WebGL DZIAŁA
    //     (sekcja C mierzy `hasCanvas:true`), więc stanu bez rendera nie da się zaobserwować
    //     biernie — odtwarzamy go DOKŁADNIE tak, jak robi to `unitMiniPreview.ts:130-132`
    //     (`container.textContent = fallbackText; container.classList.add('unit-mini-fallback')`)
    //     z tym samym zdaniem, które przekazują wszystkie trzy call-site'y kart encji.
    //     Mierzymy PO sekcji (G), czyli gdy arkusz `unitInfoCard` JEST już wstrzyknięty —
    //     to ta ścieżka, na której reguła z rundy 1 (`font-size:44px`, specyficzność 0,3,0)
    //     przegrywała z `unitInfoCard.ts:396` i była martwa.
    // ------------------------------------------------------------------------------------
    // Dialog z (G) to pełnoekranowy backdrop — zostawiony przykryłby karty mierzone niżej
    // (zrzuty elementów kapturują też to, co jest NA WIERZCHU), więc zamykamy go tutaj.
    await page.evaluate(() => {
      document.querySelectorAll('.unit-info-card-backdrop').forEach((b) => b.remove());
    });
    await page.waitForTimeout(120);

    console.log('\n-- (H) fallback bez WebGL wewnątrz diaromy --');
    const FALLBACK_TEXT = 'Render 3D niedostępny w tym środowisku';
    const fb = await page.evaluate((text) => {
      const sheets = Array.from(document.querySelectorAll('style')).map((s) => s.id || '(anon)');
      const card = document.getElementById('card-unit');
      const med = card.querySelector('.entity-card-medallion');
      med.innerHTML = '';
      med.textContent = text;
      med.classList.add('unit-mini-fallback');
      const cs = getComputedStyle(med);
      const r = med.getBoundingClientRect();
      return {
        sheets,
        hasUnitInfoCardSheet: sheets.some((id) => id.includes('unit-info-card')),
        cardIsUnit: card.classList.contains('entity-card-unit'),
        fontSize: cs.fontSize,
        boxW: Math.round(r.width), boxH: Math.round(r.height),
        scrollW: med.scrollWidth, scrollH: med.scrollHeight,
        clientW: med.clientWidth, clientH: med.clientHeight,
        text: (med.textContent || '').trim(),
      };
    }, FALLBACK_TEXT);
    console.log('[fallback]', JSON.stringify(fb));
    check('fixture (H): mierzymy na karcie .entity-card-unit z WSTRZYKNIĘTYM arkuszem unitInfoCard (ścieżka sporna)',
      fb.cardIsUnit === true && fb.hasUnitInfoCardSheet === true, fb.sheets);
    check('(H) fallback ma rozmiar czcionki z bloku diaromy (11px), a nie 12px z unitInfoCard.ts ani 44px z rundy 1',
      fb.fontSize === '11px', fb.fontSize);
    check('(H) tekst fallbacku MIEŚCI SIĘ w medalionie diaromy — zero przycięcia (scrollH <= clientH)',
      fb.scrollH <= fb.clientH && fb.scrollW <= fb.clientW,
      { scrollW: fb.scrollW, clientW: fb.clientW, scrollH: fb.scrollH, clientH: fb.clientH });
    check('(H) fallback niesie PEŁNE zdanie z call-site\'ów kart encji', fb.text === FALLBACK_TEXT, fb.text);
    await page.locator('#card-unit .entity-card-header').screenshot({
      path: path.join(SHOTS, 'H-fallback-bez-webgl-w-diaromie.png'),
    });

    // ------------------------------------------------------------------------------------
    // (I) ELIPSA „GRUNTU" JEST REALNIE WIDOCZNA — RUNDA 2, zarzut 3 Evaluatora. Poprzednia
    //     asercja (`groundVisible === 'yes'`) sprawdzała wyłącznie ISTNIENIE i szerokość
    //     węzła, więc przeszłaby też dla elipsy w 100% zakrytej albo o zerowym kontraście —
    //     i faktycznie przechodziła: różnica pikselowa wobec `display:none` wynosiła 8/255.
    //     Teraz porównujemy DWA ŻYWE ZRZUTY nagłówka (z elipsą i bez) piksel po pikselu,
    //     dekodując je w Chromium przez <img> + canvas.getImageData.
    // ------------------------------------------------------------------------------------
    console.log('\n-- (I) różnica pikselowa: elipsa gruntu vs display:none --');
    // Przywracamy nietknięty medalion (sekcja H nadpisała go fallbackiem).
    await page.evaluate(() => { document.getElementById('card-unit').remove(); });
    await page.evaluate((n) => window.__mount('unit', window.__C.unitToSlug(n), 'card-unit'), unitName);
    await page.waitForTimeout(900);
    const headerLoc = page.locator('#card-unit .entity-card-header');
    const withGround = (await headerLoc.screenshot()).toString('base64');
    await page.evaluate(() => {
      document.querySelector('#card-unit .entity-card-diorama-ground').style.display = 'none';
    });
    await page.waitForTimeout(120);
    const withoutGround = (await headerLoc.screenshot()).toString('base64');
    await page.evaluate(() => {
      document.querySelector('#card-unit .entity-card-diorama-ground').style.display = '';
    });
    const diff = await page.evaluate(async ([a, b]) => {
      const load = (b64) => new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = 'data:image/png;base64,' + b64;
      });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      if (ia.width !== ib.width || ia.height !== ib.height) {
        return { sizeMismatch: [ia.width, ia.height, ib.width, ib.height] };
      }
      const px = (img) => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        return c.getContext('2d').getImageData(0, 0, img.width, img.height).data;
      };
      const da = px(ia), db = px(ib);
      let maxDelta = 0, changed = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
        if (d > maxDelta) maxDelta = d;
        if (d >= 8) changed++;
      }
      return { w: ia.width, h: ia.height, total: da.length / 4, maxDelta, changed };
    }, [withGround, withoutGround]);
    console.log('[ground-diff]', JSON.stringify(diff));
    check('(I) elipsa gruntu realnie zmienia obraz nagłówka — maks. różnica kanału >= 24/255 (runda 1: 8/255)',
      !diff.sizeMismatch && diff.maxDelta >= 24, diff);
    check('(I) elipsa gruntu pokrywa realną, niezasłoniętą powierzchnię — >= 2000 pikseli różnicy >= 8/255',
      !diff.sizeMismatch && diff.changed >= 2000, diff);
    await headerLoc.screenshot({ path: path.join(SHOTS, 'I-elipsa-gruntu-widoczna.png') });
    await page.evaluate(() => {
      document.querySelector('#card-unit .entity-card-diorama-ground').style.display = 'none';
    });
    await headerLoc.screenshot({ path: path.join(SHOTS, 'I-kontrola-elipsa-gruntu-ukryta.png') });
    await page.evaluate(() => {
      document.querySelector('#card-unit .entity-card-diorama-ground').style.display = '';
    });

    check('brak błędów konsoli/pageerror w trakcie renderu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE, { force: true });
  }

  console.log('');
  console.log(`[entity-card-diorama-real-render-test] ${pass} pass, ${fail} fail`);
  console.log(`[entity-card-diorama-real-render-test] zrzuty: ${SHOTS}`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
