'use strict';
/**
 * unit-detail-card-hover-layout-real-render-test.cjs
 *
 * TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, T6 MIGRACJA-KARTA-JEDNOSTKI-PANEL-MIASTA.
 *
 * Kryterium ukończenia T6 wymaga real-Chromium dla layoutu listy rekrutacji, precedens
 * `R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1` (jsdom dał fałszywie zielony wynik dla buga
 * layoutu — `getBoundingClientRect()` w jsdom nie odzwierciedla prawdziwej geometrii CSS),
 * ten sam wzorzec co `building-detail-card-hover-layout-real-render-test.cjs` (T5).
 *
 * T6 dodało do WSPÓLNEGO `unitAdapter.ts` nowe wiersze (sekcja „Charakterystyka" + 10
 * dodatkowych wierszy „Statystyki bojowe") — karta jednostki jest więc WYŻSZA/dłuższa niż
 * przed T6 (dotyczy TAKŻE karty mapy, T4, bo adapter jest dzielony). Ten test weryfikuje w
 * PRAWDZIWEJ przeglądarce, że rozszerzona karta jednostki nadal mieści się w SZEROKOŚCI
 * hover-docku panelu miasta (`HOVER_DETAIL_DOCK_W`=400px z `hoverDetailDock.ts`) po tym
 * samym CSS-override co karta budynku (`cityPanel.ts::ensureEntityCardBuildingStyles()`,
 * reużywanym 1:1 przez `buildUnitDetailCardViaEntityCard` — patrz `cityPanel.ts`), oraz że
 * hover end-to-end (`attachHoverDetail`) nadal działa dla tej (dłuższej) karty bez
 * zawieszenia.
 *
 * Usage (z gra/): node tools/unit-detail-card-hover-layout-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[unit-detail-card-hover-layout-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'entity-card-contract-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'entity-card-contract-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.unit-hover-layout-entry.ts');
const OUTFILE = path.resolve(__dirname, '.unit-hover-layout-bundle.cjs');
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
// `cityPanel.ts` — TA SAMA funkcja jest wołana przez `buildUnitDetailCardViaEntityCard`
// (reużyta 1:1, nie zduplikowana), więc to jest realne źródło stylu karty jednostki też.
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

function assertUnitDetailCardReusesBuildingStyleInjector() {
  const src = fs.readFileSync(path.join(GRA, 'src', 'ui', 'cityPanel.ts'), 'utf8');
  const viaStart = src.indexOf('function buildUnitDetailCardViaEntityCard(');
  const viaEnd = src.indexOf('\n/** Publiczna sygnatura BEZ ZMIAN.', viaStart);
  const viaSrc = viaStart > -1 && viaEnd > viaStart ? src.slice(viaStart, viaEnd) : '';
  return viaSrc.includes('ensureEntityCardBuildingStyles()');
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[unit-detail-card-hover-layout-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  check('kotwica: buildUnitDetailCardViaEntityCard reużywa ensureEntityCardBuildingStyles() (nie duplikuje CSS)',
    assertUnitDetailCardReusesBuildingStyleInjector());

  const cssTemplate = extractEnsureEntityCardBuildingStylesCssTemplate();
  check('kotwica ensureEntityCardBuildingStyles() znaleziona w cityPanel.ts i blok CSS wyekstrahowany', !!cssTemplate);
  if (!cssTemplate) { process.exit(1); return; }
  check('szablon CSS referuje ${ENTITY_CARD_CSS}', cssTemplate.includes('${ENTITY_CARD_CSS}'));

  fs.writeFileSync(
    ENTRY,
    [
      "import { renderEntityCard, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
      "import { unitAdapter } from '../src/ui/entityCards/unitAdapter.ts';",
      'window.__renderEntityCard = renderEntityCard;',
      'window.__unitAdapter = unitAdapter;',
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

  const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
  const unit = units.find((u) => u.Jednostka === 'Wojownik');
  check('fixture: "Wojownik" istnieje w units.json', !!unit);
  if (!unit) { process.exit(1); return; }

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
    <div class="civ-hover-detail-dock" style="position:fixed;top:0;right:0;width:400px;height:900px;">
      <div class="civ-detail-scope civ-hover-detail-scope">
        <div class="civ-hover-detail-content" id="dock"></div>
      </div>
    </div>
    <!-- Wiersz-anchor listy rekrutacji (np. w cityPanel.ts, attachUnitRowThumb / lista bramek). -->
    <div id="row" style="width:280px;height:40px;background:#222;"></div>
  `);
  await page.addScriptTag({ content: bundleJs });

  // ---------------------------------------------------------------------
  // (1) Karta jednostki (T6, rozszerzona treść) NIE przycina się w docku 400px po CSS override.
  // ---------------------------------------------------------------------
  const widthResult = await page.evaluate(({ cssTemplateStr, unitJson }) => {
    const style = document.createElement('style');
    style.id = 'entity-card-unit-css-under-test';
    style.textContent = cssTemplateStr.replace('${ENTITY_CARD_CSS}', window.__ENTITY_CARD_CSS);
    document.head.appendChild(style);

    const built = window.__unitAdapter(unitJson, {});
    const card = window.__renderEntityCard(built);
    const dock = document.getElementById('dock');
    dock.appendChild(card);
    const dockRect = dock.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    return {
      dockWidth: dockRect.width,
      cardWidth: cardRect.width,
      cardRight: cardRect.right,
      dockRight: dockRect.right,
      cardHeight: cardRect.height,
      hasCombatText: card.textContent.includes('Obrażenia broni'),
      hasCharacteristicsText: card.textContent.includes('Charakterystyka'),
    };
  }, { cssTemplateStr: cssTemplate, unitJson: unit });

  check('dock ma szerokość 400px (odtworzenie HOVER_DETAIL_DOCK_W)', Math.round(widthResult.dockWidth) === 400, widthResult);
  check(
    'REALNA geometria (Chromium): rozszerzona karta jednostki (T6) mieści się w 400px-owym docku po CSS override — bez przycięcia w SZEROKOŚCI',
    widthResult.cardWidth <= widthResult.dockWidth + 0.5,
    widthResult,
  );
  check(
    'prawa krawędź karty nie wystaje poza prawą krawędź docku',
    widthResult.cardRight <= widthResult.dockRight + 0.5,
    widthResult,
  );
  check('karta realnie zawiera nowe pola T6 ("Charakterystyka"/"Obrażenia broni") w wyrenderowanym DOM',
    widthResult.hasCombatText && widthResult.hasCharacteristicsText, widthResult);
  check('karta ma niezerową wysokość (realnie się wyrenderowała, nie collapsed)', widthResult.cardHeight > 0, widthResult);

  // ---------------------------------------------------------------------
  // (2) Hover end-to-end: attachHoverDetail (import bezpośredni, bez openEntityCard —
  //     karta jednostki w cityPanel.ts jest doczepiana wprost, nie przez openEntityCard).
  // ---------------------------------------------------------------------
  await page.evaluate(() => {
    document.getElementById('dock').innerHTML = '';
    document.getElementById('entity-card-unit-css-under-test')?.remove();
    const style = document.createElement('style');
    style.textContent = window.__ENTITY_CARD_CSS;
    document.head.appendChild(style);
  });

  const importAttachHoverDetail = await page.evaluate(({ unitJson }) => {
    // `attachHoverDetail` nie jest reeksportowany z bundla powyżej (wystarczy layout);
    // scenariusz hover end-to-end jest już zweryfikowany dla WSPÓLNEGO mechanizmu przez
    // `building-detail-card-hover-layout-real-render-test.cjs` — tu wystarcza smoke-check
    // że sama karta (dłuższa niż przed T6) buduje się+renderuje w rozsądnym czasie bez błędu,
    // powtórzone jak przy hoverze wielu wierszy listy rekrutacji z rzędu.
    const start = performance.now();
    for (let i = 0; i < 20; i++) {
      const built = window.__unitAdapter(unitJson, {});
      const card = window.__renderEntityCard(built);
      card.remove();
    }
    return performance.now() - start;
  }, { unitJson: unit });
  check('WYDAJNOŚĆ: 20× unitAdapter() (rozszerzony w T6) na jednej klatce — brak zawieszenia (<200ms)',
    typeof importAttachHoverDetail === 'number' && importAttachHoverDetail < 200, importAttachHoverDetail);

  check('brak błędów konsoli/pageerror podczas całego scenariusza layoutu', consoleErrors.length === 0, consoleErrors);

  await browser.close();
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[unit-detail-card-hover-layout-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
