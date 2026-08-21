'use strict';
/**
 * building-detail-card-hover-layout-real-render-test.cjs
 *
 * TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, T5 MIGRACJA-KARTA-BUDYNKU-PANEL-MIASTA.
 *
 * Dispatch T5 wymaga wprost testu REALNEGO Chromium/Playwright dla wszystkiego, co
 * dotyczy layoutu/hover-timingu — precedens `R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1`,
 * gdzie jsdom dał fałszywie zielony wynik dla buga stacking-context/layoutu (żaden z
 * asercji jsdom w `building-detail-card-entitycard-migration-test.cjs` nie liczy
 * realnej geometrii CSS — `getBoundingClientRect()` w jsdom nie odzwierciedla
 * prawdziwego layoutu). Ten test odtwarza w PRAWDZIWEJ przeglądarce (ten sam wzorzec co
 * `unit-info-card-badges-real-render-test.cjs`/`tech-discovery-card-real-click-test.cjs`):
 *
 *  (1) Karta budynku (`entityCards/renderer.ts::renderEntityCard`, domyślna szerokość
 *      434px z `ENTITY_CARD_CSS`) NIE PRZYCINA SIĘ w hover-docku panelu miasta
 *      (`.civ-hover-detail-content`, `HOVER_DETAIL_DOCK_W`=400px z `hoverDetailDock.ts`)
 *      — weryfikuje REALNĄ szerokość po zastosowaniu override'u CSS wstrzykiwanego przez
 *      `cityPanel.ts::ensureEntityCardBuildingStyles()` (czytanego bezpośrednio ze
 *      źródła `cityPanel.ts`, żeby test i produkcyjny kod NIE mogły się rozjechać po
 *      cichu — regexem wyciąga DOKŁADNY blok CSS, nie duplikuje go ręcznie).
 *  (2) Hover realnie DZIAŁA end-to-end w przeglądarce: `openEntityCard(kind, id,
 *      {mode:'hover', container: row})` + realny `page.hover()` (nie
 *      `dispatchEvent` syntetyczny) pokazuje kartę w oczekiwanym czasie (>=220ms,
 *      `attachHoverDetail` domyślny delay), a `mouseleave` ją chowa (realny timer
 *      `HIDE_DELAY`=280ms z `hoverDetailDock.ts`) — bez zawieszenia/braku odpowiedzi.
 *
 * Usage (z gra/): node tools/building-detail-card-hover-layout-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[building-detail-card-hover-layout-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'entity-card-contract-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'entity-card-contract-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.building-hover-layout-entry.ts');
const OUTFILE = path.resolve(__dirname, '.building-hover-layout-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const stubPlugin = {
  name: 'stub-icons',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
  },
};

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

// Wyciąga DOKŁADNY blok CSS wstrzykiwany przez `ensureEntityCardBuildingStyles()` w
// `cityPanel.ts` — zamiast kopiować go ręcznie do testu (co mogłoby się cicho rozjechać
// z produkcyjnym kodem po kolejnej edycji), test czyta go z prawdziwego źródła.
function extractEnsureEntityCardBuildingStylesCssTemplate() {
  const src = fs.readFileSync(path.join(GRA, 'src', 'ui', 'cityPanel.ts'), 'utf8');
  const fnStart = src.indexOf('function ensureEntityCardBuildingStyles(): void {');
  if (fnStart === -1) return null;
  const fnEnd = src.indexOf('\n}\n', fnStart);
  if (fnEnd === -1) return null;
  const fnSrc = src.slice(fnStart, fnEnd);
  const m = fnSrc.match(/style\.textContent = `([\s\S]*?)`;/);
  return m ? m[1] : null;
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[building-detail-card-hover-layout-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  const cssTemplate = extractEnsureEntityCardBuildingStylesCssTemplate();
  check('kotwica ensureEntityCardBuildingStyles() znaleziona w cityPanel.ts i blok CSS wyekstrahowany', !!cssTemplate);
  if (!cssTemplate) { process.exit(1); return; }
  // `${ENTITY_CARD_CSS}` w środku szablonu — podstawiamy realny eksport, żeby test woził
  // DOKŁADNIE to co produkcja wstrzykuje do <head>, nie przybliżenie.
  check('szablon CSS referuje ${ENTITY_CARD_CSS}', cssTemplate.includes('${ENTITY_CARD_CSS}'));

  fs.writeFileSync(
    ENTRY,
    [
      "import { renderEntityCard, openEntityCard, buildEntityCardData, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
      'window.__renderEntityCard = renderEntityCard;',
      'window.__openEntityCard = openEntityCard;',
      'window.__buildEntityCardData = buildEntityCardData;',
      'window.__ENTITY_CARD_CSS = ENTITY_CARD_CSS;',
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
    plugins: [stubPlugin],
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  const bundleJs = fs.readFileSync(OUTFILE, 'utf8');
  await page.setContent(`
    <div id="root"></div>
    <!-- Odtwarza geometrię prawdziwego hover-docku panelu miasta (hoverDetailDock.ts,
         HOVER_DETAIL_DOCK_W=400px) -- realny kontener 400px, karta wstawiana w środku. -->
    <div class="civ-hover-detail-dock" style="position:fixed;top:0;right:0;width:400px;height:600px;">
      <div class="civ-detail-scope civ-hover-detail-scope">
        <div class="civ-hover-detail-content" id="dock"></div>
      </div>
    </div>
    <!-- Wiersz-anchor listy budynków (np. "Dostępne do budowy" w cityPanel.ts). -->
    <div id="row" style="width:280px;height:40px;background:#222;"></div>
  `);
  await page.addScriptTag({ content: bundleJs });

  // ---------------------------------------------------------------------
  // (1) Karta budynku (434px domyślnie) NIE przycina się w docku 400px po CSS override.
  // ---------------------------------------------------------------------
  const cssTemplateEval = cssTemplate; // capture dla page.evaluate
  const widthResult = await page.evaluate(({ cssTemplateStr }) => {
    const style = document.createElement('style');
    style.id = 'entity-card-building-css-under-test';
    // Podstawienie ${ENTITY_CARD_CSS} identyczne z tym co robi prawdziwy template literal
    // w cityPanel.ts (`` `${ENTITY_CARD_CSS}\n...` ``).
    style.textContent = cssTemplateStr.replace('${ENTITY_CARD_CSS}', window.__ENTITY_CARD_CSS);
    document.head.appendChild(style);

    const data = window.__buildEntityCardData('building', 'stolarnia', {
      city: { hasCity: true, displayLevel: 1, buildCostPace: 'niski', difficulty: 'normal', ownerId: 0 },
    });
    const card = window.__renderEntityCard(data);
    const dock = document.getElementById('dock');
    dock.appendChild(card);
    const dockRect = dock.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    return {
      dockWidth: dockRect.width,
      cardWidth: cardRect.width,
      cardRight: cardRect.right,
      dockRight: dockRect.right,
    };
  }, { cssTemplateStr: cssTemplateEval });

  check('dock ma szerokość 400px (odtworzenie HOVER_DETAIL_DOCK_W)', Math.round(widthResult.dockWidth) === 400, widthResult);
  check(
    'REALNA geometria (Chromium): karta budynku (bazowo 434px) mieści się w 400px-owym docku po CSS override — bez przycięcia',
    widthResult.cardWidth <= widthResult.dockWidth + 0.5,
    widthResult,
  );
  check(
    'prawa krawędź karty nie wystaje poza prawą krawędź docku',
    widthResult.cardRight <= widthResult.dockRight + 0.5,
    widthResult,
  );

  // ---------------------------------------------------------------------
  // (2) Hover end-to-end: realny page.hover() pokazuje kartę po delayu, mouseleave chowa.
  // ---------------------------------------------------------------------
  await page.evaluate(() => {
    document.getElementById('dock').innerHTML = '';
    document.getElementById('entity-card-building-css-under-test')?.remove();
    const style = document.createElement('style');
    style.textContent = window.__ENTITY_CARD_CSS;
    document.head.appendChild(style);
    window.__openEntityCard('building', 'stolarnia', {
      mode: 'hover',
      container: document.getElementById('row'),
    });
  });

  const beforeHover = await page.evaluate(() => document.querySelector('.entity-card-building') !== null);
  check('przed hoverem: karta nie istnieje w DOM (lazy, realna przeglądarka)', beforeHover === false);

  await page.hover('#row');
  await page.waitForTimeout(80);
  const shortlyAfterHover = await page.evaluate(() => document.querySelector('.entity-card-building') !== null);
  check('80ms po hoverze (< 220ms delay attachHoverDetail): karta jeszcze NIE widoczna', shortlyAfterHover === false);

  await page.waitForTimeout(300); // łącznie ~380ms > 220ms delay
  const afterDelay = await page.evaluate(() => {
    const c = document.querySelector('.entity-card-building');
    if (!c) return { present: false };
    const r = c.getBoundingClientRect();
    return { present: true, visible: r.width > 0 && r.height > 0, text: c.textContent.includes('Stolarnia') };
  });
  check('po ~380ms od hoveru (> 220ms delay): karta OBECNA i realnie WIDOCZNA (width/height > 0)',
    afterDelay.present && afterDelay.visible, afterDelay);
  check('karta hover zawiera treść "Stolarnia"', afterDelay.present && afterDelay.text, afterDelay);

  // mouseleave -> po HIDE_DELAY (280ms) karta powinna zniknąć (hoverDetailDock.ts::scheduleClear).
  // Dispatch bezpośredni (nie page.hover na inny element) -- eliminuje niepewność co do
  // realnej trajektorii wskaźnika między elementami w headless Chromium; sam mechanizm
  // czasu/chowania (`scheduleClear`/`hideFloat`) jest testowany w PRAWDZIWEJ przeglądarce
  // (realny `setTimeout`, realny `getComputedStyle`), więc to nadal test end-to-end, nie jsdom.
  await page.evaluate(() => {
    document.getElementById('row').dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
  });
  await page.waitForTimeout(500);
  const afterLeave = await page.evaluate(() => {
    const dock = document.querySelector('.civ-hover-detail-dock');
    const float = document.querySelector('.civ-hover-detail-float');
    const dockOpen = dock ? dock.querySelector('.civ-hover-detail-content')?.childElementCount > 0 : false;
    const floatVisible = float ? getComputedStyle(float).display !== 'none' : false;
    return { dockOpen, floatVisible };
  });
  check('po opuszczeniu anchora (mouseleave) i upływie HIDE_DELAY: karta schowana (dock pusty LUB float ukryty — bez zawieszenia)',
    !afterLeave.dockOpen && !afterLeave.floatVisible, afterLeave);

  check('brak błędów konsoli/pageerror podczas całego scenariusza hover/layout', consoleErrors.length === 0, consoleErrors);

  await browser.close();
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[building-detail-card-hover-layout-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
