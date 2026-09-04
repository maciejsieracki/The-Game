'use strict';
/**
 * unit-info-card-viewport-height-real-render-test.cjs
 *
 * TEMAT: R-CIVPEDIA-KARTY-SPOJNOSC-Q1-B, runda 1.
 *
 * Zgłoszenie właściciela (2026-09-04, zrzut karty jednostki "Taran"): karta jednostki
 * otwierana z mapy (`showUnitInfoCardDialog`) ucinała się na dole ekranu bez paska
 * przewijania — `.unit-info-card-backdrop` centrowała się przez `align-items:center`
 * ("unsafe" centrowanie flex), a `.unit-info-card-dialog` miała `max-height` (hugguje
 * treść) zamiast STAŁEJ wysokości z fallbackiem scrolla.
 *
 * Ten test odtwarza scenariusz w PRAWDZIWEJ przeglądarce (Playwright/Chromium, wzorzec
 * `unit-info-card-badges-real-render-test.cjs`): bunduje przez esbuild prawdziwy
 * `src/ui/unitInfoCard.ts`, woła `showUnitInfoCardDialog` na realnej, BOGATEJ jednostce
 * (`Jeździec chiński` — 57 wypełnionych pól + 4 wpisy kontr w `counters.json`, żeby
 * sekcja "Wymagania i kontry"/"Statystyki" na pewno przekraczała 80vh na niskich
 * viewportach) na TRZECH wysokościach viewportu (700/900/1200px) i mierzy realną
 * geometrię DOM (`getBoundingClientRect`, `getComputedStyle`, scrollTop/scrollHeight po
 * realnym scrollowaniu) — NIE odczyt CSS z kodu źródłowego.
 *
 * Usage (z gra/): node tools/unit-info-card-viewport-height-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[unit-info-card-viewport-height-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'unit-info-card-badges-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'unit-info-card-badges-scienceOwlIcon-stub.ts');
const MINI_PREVIEW_STUB = path.resolve(STUB_DIR, 'unit-info-card-badges-mini-preview-stub.ts');
const ENTRY = path.resolve(__dirname, '.unit-info-card-viewport-height-entry.ts');
const OUTFILE = path.resolve(__dirname, '.unit-info-card-viewport-height-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
const counters = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'counters.json'), 'utf8'));
const richUnit = units.find((u) => u && u.Jednostka === 'Jeździec chiński');
const shortUnit = units.find((u) => u && u.Jednostka && u.Jednostka !== richUnit.Jednostka
  && !counters.some((c) => c['Typ atakujący'] === u.Typ));
if (!richUnit) {
  console.error('[unit-info-card-viewport-height-real-render-test] brak jednostki referencyjnej "Jeździec chiński"');
  process.exit(1);
}
const gameData = { units, counters, techs: [], buildings: [] };

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
    console.log('[unit-info-card-viewport-height-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function measureAt(browser, bundleJs, viewportHeight, unit) {
  const page = await browser.newPage({ viewport: { width: 1280, height: viewportHeight } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.setContent('<div id="root"></div>');
  await page.addScriptTag({ content: bundleJs });

  const before = await page.evaluate(({ unit, gameData }) => {
    window.__ensureUnitInfoCardStyles();
    window.__dismiss = window.__showUnitInfoCardDialog(unit, gameData, {});
    const backdrop = document.querySelector('.unit-info-card-backdrop');
    const dialog = document.querySelector('.unit-info-card-dialog');
    const card = dialog.firstElementChild;
    const backdropStyle = getComputedStyle(backdrop);
    const dialogRect = dialog.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    return {
      backdropAlignItems: backdropStyle.alignItems,
      backdropOverflowY: backdropStyle.overflowY,
      dialogHeight: dialogRect.height,
      dialogScrollHeight: dialog.scrollHeight,
      dialogTop: dialogRect.top,
      cardWidth: cardRect.width,
      cardClassName: card.className,
      viewportInnerHeight: window.innerHeight,
    };
  }, { unit, gameData });

  // Przewiń dialog do samego dołu i zweryfikuj że ostatnia sekcja jest w pełni widoczna.
  const after = await page.evaluate(() => {
    const dialog = document.querySelector('.unit-info-card-dialog');
    dialog.scrollTop = dialog.scrollHeight;
    const card = dialog.firstElementChild;
    const sections = Array.from(card.querySelectorAll('.entity-card-section, .unit-info-card-section'));
    const lastSection = sections[sections.length - 1];
    const dialogRect = dialog.getBoundingClientRect();
    const lastRect = lastSection ? lastSection.getBoundingClientRect() : null;
    return {
      scrollTopAfter: dialog.scrollTop,
      scrollHeight: dialog.scrollHeight,
      clientHeight: dialog.clientHeight,
      hasScrollRoom: dialog.scrollHeight > dialog.clientHeight,
      lastSectionText: lastSection ? lastSection.textContent.slice(0, 60) : null,
      lastSectionFullyVisible: lastRect
        ? lastRect.bottom <= dialogRect.bottom + 1 && lastRect.top >= dialogRect.top - 1
        : null,
    };
  });

  // Zamknij: Esc, przycisk ✕, klik w backdrop — po kolei, świeże otwarcie za każdym razem.
  const closeResults = {};
  for (const mode of ['esc', 'button', 'backdrop-click']) {
    await page.evaluate(({ unit, gameData }) => {
      document.querySelector('.unit-info-card-backdrop')?.remove();
      window.__showUnitInfoCardDialog(unit, gameData, {});
    }, { unit, gameData });
    if (mode === 'esc') {
      await page.keyboard.press('Escape');
    } else if (mode === 'button') {
      await page.click('.entity-card-header button, .unit-info-card-close').catch(() => {});
    } else {
      await page.evaluate(() => {
        const backdrop = document.querySelector('.unit-info-card-backdrop');
        backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    }
    await page.waitForTimeout(30);
    closeResults[mode] = await page.evaluate(() => !document.querySelector('.unit-info-card-backdrop'));
  }

  await page.close();
  return { before, after, closeResults, consoleErrors };
}

async function main() {
  fs.writeFileSync(
    ENTRY,
    [
      "import { showUnitInfoCardDialog, ensureUnitInfoCardStyles } from '../src/ui/unitInfoCard.ts';",
      'window.__showUnitInfoCardDialog = showUnitInfoCardDialog;',
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
  const bundleJs = fs.readFileSync(OUTFILE, 'utf8');

  const heights = [700, 900, 1200];
  const dialogHeights = {};
  for (const h of heights) {
    const { before, after, closeResults, consoleErrors } = await measureAt(browser, bundleJs, h, richUnit);
    check(`[${h}px] brak błędów konsoli/pageerror`, consoleErrors.length === 0, consoleErrors);
    check(`[${h}px] backdrop align-items:flex-start (bezpieczne centrowanie, nie "unsafe" center)`,
      before.backdropAlignItems === 'flex-start', before.backdropAlignItems);
    check(`[${h}px] backdrop overflow-y:auto (fallback scrolla gdy box wyższy niż viewport)`,
      before.backdropOverflowY === 'auto', before.backdropOverflowY);
    check(`[${h}px] dialog ma zapas scrolla gdy treść przekracza wysokość (scrollHeight > clientHeight lub treść mieści się w całości)`,
      after.hasScrollRoom || after.scrollHeight <= after.clientHeight + 1,
      { scrollHeight: after.scrollHeight, clientHeight: after.clientHeight });
    check(`[${h}px] po przewinięciu do dołu ostatnia sekcja w pełni widoczna w oknie dialogu`,
      after.lastSectionFullyVisible === true, after);
    check(`[${h}px] karta ma szerokość referencyjną min(660px, 100vw-32px)`,
      Math.abs(before.cardWidth - Math.min(660, 1280 - 32)) <= 1, before.cardWidth);
    check(`[${h}px] zamknięcie przez Esc działa`, closeResults.esc === true, closeResults);
    check(`[${h}px] zamknięcie przez przycisk ✕ działa`, closeResults.button === true, closeResults);
    check(`[${h}px] zamknięcie klikiem w backdrop działa`, closeResults['backdrop-click'] === true, closeResults);
    dialogHeights[h] = before.dialogHeight;
  }

  // Krótka jednostka: dialog ma TĘ SAMĄ wysokość niezależnie od ilości treści.
  if (shortUnit) {
    const { before: shortBefore } = await measureAt(browser, bundleJs, 900, shortUnit);
    check('dialog ma identyczną wysokość dla bogatej i krótkiej jednostki na tym samym viewporcie (900px)',
      Math.abs(shortBefore.dialogHeight - dialogHeights[900]) <= 1,
      { short: shortBefore.dialogHeight, rich: dialogHeights[900] });
  }

  // Kryterium 2: wysokość dialogu skaluje się z viewportem (min(80vh, vh-32px)), stała PROPORCJA.
  for (const h of heights) {
    const expected = Math.min(0.8 * h, h - 32);
    check(`[${h}px] wysokość dialogu ≈ min(80vh, vh-32px) = ${expected.toFixed(1)}px`,
      Math.abs(dialogHeights[h] - expected) <= 2, dialogHeights[h]);
  }

  await browser.close();
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[unit-info-card-viewport-height-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[unit-info-card-viewport-height-real-render-test] BŁĄD:', e);
  process.exit(1);
});
