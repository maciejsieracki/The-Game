'use strict';
/**
 * unit-info-card-badges-real-render-test.cjs
 *
 * TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, T4 MIGRACJA-KARTA-JEDNOSTKI-MAPA, runda 2.
 *
 * Dlaczego ten test istnieje: Evaluator T4 znalazł w ŻYWEJ przeglądarce (Playwright),
 * że sekcja „Statusy" karty jednostki (`unitAdapter.ts`, `options.statusLines` z
 * `main.ts:18799` — flagi garnizon/ufortyfikowanie/sentry/auto-eksploracja) renderuje
 * wiele odznak (`section.badges`) przez `entityCards/renderer.ts`, ale klasy
 * `.entity-card-badges`/`.entity-card-badge` NIE MIAŁY ŻADNEGO reguły CSS nigdzie w
 * repo — odznaki sklejały się w jeden nieczytelny ciąg tekstu bez odstępu/tła/pigułki
 * (np. "wymaga technologii z danychW garnizonieCzuwa"). Żaden z 137 zielonych asercji
 * jsdom w T3/T4 nie mógł tego wykryć, bo jsdom nie liczy realnego layoutu CSS
 * (`getComputedStyle`/`getBoundingClientRect` w jsdom nie odzwierciedlają geometrii).
 *
 * Naprawa (runda 2, orkiestrator): dodano brakujące reguły CSS w `entityCards/
 * renderer.ts` (`.entity-card-badges{display:flex;flex-wrap:wrap;gap:6px}` +
 * `.entity-card-badge{padding:1px 8px;border-radius:999px;background:...}`), wzorem
 * już istniejącego `.entity-card-row-badge`.
 *
 * Ten test odtwarza scenariusz w PRAWDZIWEJ przeglądarce (Playwright/Chromium, ten sam
 * wzorzec co `tech-discovery-card-real-click-test.cjs`): bunduje przez esbuild prawdziwy
 * `src/ui/unitInfoCard.ts` (platform browser, iife), woła `showUnitInfoCardDialog` na
 * realnej jednostce z `gra/data/units.json` z 3 wpisami `statusLines` (dokładnie
 * odtwarzający zgłoszony przez Evaluatora przypadek), i mierzy realną geometrię DOM
 * (`getBoundingClientRect`, `getComputedStyle`) — NIE tylko obecność klas w markupie.
 *
 * Usage (z gra/): node tools/unit-info-card-badges-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[unit-info-card-badges-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'unit-info-card-badges-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'unit-info-card-badges-scienceOwlIcon-stub.ts');
const MINI_PREVIEW_STUB = path.resolve(STUB_DIR, 'unit-info-card-badges-mini-preview-stub.ts');
const ENTRY = path.resolve(__dirname, '.unit-info-card-badges-entry.ts');
const OUTFILE = path.resolve(__dirname, '.unit-info-card-badges-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
const firstUnit = units.find((u) => u && u.Jednostka);
if (!firstUnit) {
  console.error('[unit-info-card-badges-real-render-test] brak jednostek w units.json');
  process.exit(1);
}

const stubPlugin = {
  name: 'stub-icons-and-preview',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
    build.onResolve({ filter: /\/unitMiniPreview$/ }, () => ({ path: MINI_PREVIEW_STUB }));
  },
};

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[unit-info-card-badges-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  fs.writeFileSync(
    ENTRY,
    [
      "import { buildUnitInfoCard, ensureUnitInfoCardStyles } from '../src/ui/unitInfoCard.ts';",
      'window.__buildUnitInfoCard = buildUnitInfoCard;',
      'window.__ensureUnitInfoCardStyles = ensureUnitInfoCardStyles;',
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
  await page.setContent('<div id="root"></div>');
  await page.addScriptTag({ content: bundleJs });

  const statusLines = ['wymaga technologii z danych', 'W garnizonie', 'Czuwa'];
  const result = await page.evaluate(({ unit, statusLines }) => {
    window.__ensureUnitInfoCardStyles();
    const card = window.__buildUnitInfoCard(unit, {}, { statusLines });
    document.getElementById('root').appendChild(card);
    const badgesContainers = Array.from(card.querySelectorAll('.entity-card-badges'));
    const container = badgesContainers[badgesContainers.length - 1];
    if (!container) return { error: 'no-badges-container' };
    const badges = Array.from(container.querySelectorAll('.entity-card-badge'));
    const containerStyle = getComputedStyle(container);
    const rects = badges.map((b) => b.getBoundingClientRect());
    const badgeStyles = badges.map((b) => {
      const s = getComputedStyle(b);
      return { padding: s.padding, background: s.backgroundColor, borderRadius: s.borderRadius };
    });
    return {
      badgeCount: badges.length,
      badgeTexts: badges.map((b) => b.textContent),
      containerDisplay: containerStyle.display,
      containerGap: containerStyle.gap,
      rects: rects.map((r) => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom })),
      badgeStyles,
    };
  }, { unit: firstUnit, statusLines });

  check('brak błędów konsoli/pageerror podczas renderu', consoleErrors.length === 0, consoleErrors);
  check('kontener odznak istnieje w wyrenderowanej karcie', !result.error, result.error);
  if (!result.error) {
    check(
      '4 odznaki statusu wyrenderowane (domyślna odznaka statusu adaptera + 3 przekazane statusLines)',
      result.badgeCount === 4,
      result.badgeCount,
    );
    check(
      'kontener ma display:flex (nie block — inaczej odznaki sklejają się w jeden wiersz tekstu)',
      result.containerDisplay === 'flex',
      result.containerDisplay,
    );
    check(
      'kontener ma realny odstęp (gap) między odznakami, nie "normal"',
      result.containerGap !== 'normal' && result.containerGap !== '0px',
      result.containerGap,
    );
    for (const s of result.badgeStyles) {
      check(
        'każda odznaka ma niezerowy padding (nie płaski, sklejony tekst)',
        s.padding !== '0px',
        s,
      );
      check(
        'każda odznaka ma widoczne tło (nie transparent — inaczej brak wizualnej pigułki)',
        s.background !== 'rgba(0, 0, 0, 0)' && s.background !== 'transparent',
        s,
      );
    }
    if (result.rects.length >= 2) {
      // Kontener ma flex-wrap:wrap — odznaki mogą legalnie zawijać się do nowego
      // wiersza, więc sprawdzamy realny brak nakładania się prostokątów (overlap),
      // a nie sztywną kolejność left/right w jednym wierszu.
      const overlaps = (a, b) =>
        !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
      for (let i = 0; i < result.rects.length; i++) {
        for (let j = i + 1; j < result.rects.length; j++) {
          check(
            `odznaka #${i} i #${j} nie nakładają się na siebie (realna geometria, nie tylko markup)`,
            !overlaps(result.rects[i], result.rects[j]),
            { a: result.rects[i], b: result.rects[j] },
          );
        }
      }
    }
  }

  await browser.close();
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[unit-info-card-badges-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[unit-info-card-badges-real-render-test] BŁĄD:', e);
  process.exit(1);
});
