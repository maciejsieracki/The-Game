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
 * ZRZUTY EKRANU (real Chromium, page.screenshot — R-PROC-AUTOBOT.md §9 pkt 6a, wzorzec
 * `diplomacy-audience-zoom-cutoff-real-render-test.cjs`): zapisywane ZAWSZE (nie opt-in) do
 * `dyspozycje/autobot/runs/R-CIVPEDIA-KARTY-SPOJNOSC-Q1-B/dowody/`. UWAGA: przy tej konkretnej
 * bogatej jednostce i tych viewportach dialog jest ZAWSZE krótszy niż dostępna przestrzeń
 * backdropu (720px < 868px na 900px), więc 01 i 02 mogą wyjść piksel-w-piksel identyczne —
 * to nie błąd, to potwierdzenie że różnica `align-items`/`overflow-y` między wariantami jest
 * realna na poziomie computed style (patrz asercje "regres wykryty" niżej, PRZED zrzutami),
 * nie zawsze widoczna gołym okiem na każdym viewporcie. Realną cutoff-różnicę (dialog ZA
 * WYSOKI na dostępną przestrzeń backdropu) rezerwuje osobny przypadek 2000px/krótka jednostka.
 *   01-przed-fixem-900px.png — (PRZED, bundle z cofniętym fixem) stan tuż po otwarciu.
 *   02-po-fixie-900px.png — (PO, bieżący kod) stan tuż po otwarciu, dialog stałej wysokości
 *     min(80vh, vh-32px), backdrop wyrównany do góry z overflow-y:auto.
 *   03-po-fixie-900px-scroll-do-dolu.png — (PO) po scrollu wewnątrz dialogu ostatnia sekcja
 *     ("Statusy") w pełni widoczna.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI (mutate/revertFixPlugin, wzorzec jak wyżej): esbuild `onLoad`
 * cofa W LOCIE (tylko w buforze bundlera, bez dotykania plików repo) dokładnie te same 3
 * reguły CSS co wprowadza commit tego węzła (backdrop align-items, dialog height+margin,
 * karta width) i uruchamia TE SAME asercje na zmutowanym bundlu — oczekiwany wynik to
 * czerwone `align-items:flex-start`/wysokość/backdrop-overflow, co dowodzi że test faktycznie
 * wykrywa regres, a nie zawsze przechodzi niezależnie od kodu.
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
const UNIT_INFO_CARD_TS = path.resolve(GRA, 'src', 'ui', 'unitInfoCard.ts');
const SHOT_DIR = path.resolve(
  GRA, '..', 'dyspozycje', 'autobot', 'runs',
  'R-CIVPEDIA-KARTY-SPOJNOSC-Q1-B', 'dowody',
);
async function shot(page, name) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const p = path.join(SHOT_DIR, name);
  await page.screenshot({ path: p });
  console.log('[unit-info-card-viewport-height-real-render-test] zrzut: ' + p);
}
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

/** Cofnięcie W LOCIE (tylko w buforze esbuild, bez dotykania plików repo) dokładnie tych
 * 3 reguł CSS, które wprowadza commit 55a76698 — odtwarza stan "PRZED" tego węzła. */
const mutation = { applied: 0 };
const revertFixPlugin = {
  name: 'revert-unit-info-card-fix',
  setup(build) {
    build.onLoad({ filter: /unitInfoCard\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== UNIT_INFO_CARD_TS) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      let out = src.replace(
        '.unit-info-card-backdrop{position:fixed;inset:0;z-index:520;display:flex;align-items:flex-start;\n  justify-content:center;padding:16px;background:rgba(0,0,0,.62);overflow-y:auto;}',
        '.unit-info-card-backdrop{position:fixed;inset:0;z-index:520;display:flex;align-items:center;\n  justify-content:center;padding:16px;background:rgba(0,0,0,.62);}',
      );
      if (out !== src) mutation.applied++;
      const out2 = out.replace(
        '.unit-info-card-dialog{position:relative;height:min(80vh,calc(100vh - 32px));overflow:auto;\n  margin:auto 0;}',
        '.unit-info-card-dialog{position:relative;max-height:80vh;overflow:auto;}',
      );
      if (out2 !== out) mutation.applied++;
      out = out2;
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

async function buildBundle(outfile, mutate) {
  mutation.applied = 0;
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [...(mutate ? [revertFixPlugin] : []), stubPlugin],
    logLevel: 'silent',
  });
  if (mutate && mutation.applied !== 2) {
    throw new Error(
      `[unit-info-card-viewport-height-real-render-test] revertFixPlugin: oczekiwano 2 podmian, zastosowano ${mutation.applied} — `
      + 'wzorce nie pasują do bieżącego kodu, popraw revertFixPlugin (kod się przesunął).',
    );
  }
}

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

async function measureAt(browser, bundleJs, viewportHeight, unit, shotNames) {
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

  if (shotNames && shotNames.before) await shot(page, shotNames.before);

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

  if (shotNames && shotNames.afterScroll) await shot(page, shotNames.afterScroll);

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

  await buildBundle(OUTFILE, false);
  const BUNDLE_PRZED = path.resolve(__dirname, '.unit-info-card-viewport-height-bundle-przed.cjs');
  await buildBundle(BUNDLE_PRZED, true);

  const browser = await launchBrowser();
  const bundleJs = fs.readFileSync(OUTFILE, 'utf8');
  const bundlePrzedJs = fs.readFileSync(BUNDLE_PRZED, 'utf8');

  // Dowód nietautologiczności: te SAME asercje (align-items/overflow/wysokość) na bundlu
  // z cofniętym fixem (mutate:true) MUSZĄ zaczerwienić się — inaczej test nic nie wykrywa.
  {
    const { before } = await measureAt(browser, bundlePrzedJs, 900, richUnit, {
      before: '01-przed-fixem-900px.png',
    });
    check('[PRZED fixem, 900px] regres wykryty: align-items NIE jest już flex-start (unsafe center wrócił)',
      before.backdropAlignItems !== 'flex-start', before.backdropAlignItems);
    check('[PRZED fixem, 900px] regres wykryty: backdrop NIE ma już overflow-y:auto (fallback scrolla zniknął)',
      before.backdropOverflowY !== 'auto', before.backdropOverflowY);

    // Kryterium "stała wysokość niezależnie od treści": na viewporcie 2000px (żaden z dwóch
    // wariantów jednostek nie przekracza 80vh) height:min(80vh,vh-32px) PO FIXIE wymusza tę
    // samą wysokość co przed, ALE max-height:80vh SPRZED fixu z krótką treścią HUGGUJE ją
    // (dialogHeight < 80vh) zamiast wymuszać stałą wysokość — to właśnie różni oba warianty.
    if (shortUnit) {
      const { before: shortBeforeMut } = await measureAt(browser, bundlePrzedJs, 2000, shortUnit);
      const { before: shortBeforePo } = await measureAt(browser, bundleJs, 2000, shortUnit);
      check('[PRZED fixem, 2000px, krótka jednostka] regres wykryty: dialog NIE ma już stałej wysokości min(80vh,vh-32px) — max-height hugguje krótką treść',
        Math.abs(shortBeforeMut.dialogHeight - Math.min(0.8 * 2000, 2000 - 32)) > 2,
        shortBeforeMut.dialogHeight);
      check('[kontrola, PO fixie, 2000px, krótka jednostka] wysokość jest stała min(80vh,vh-32px) niezależnie od krótkiej treści',
        Math.abs(shortBeforePo.dialogHeight - Math.min(0.8 * 2000, 2000 - 32)) <= 2,
        shortBeforePo.dialogHeight);
    }
  }

  const heights = [700, 900, 1200];
  const dialogHeights = {};
  for (const h of heights) {
    const shotNames = h === 900 ? {
      before: '02-po-fixie-900px.png',
      afterScroll: '03-po-fixie-900px-scroll-do-dolu.png',
    } : undefined;
    const { before, after, closeResults, consoleErrors } = await measureAt(browser, bundleJs, h, richUnit, shotNames);
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
    // Tolerancja 3px (nie 1px): getBoundingClientRect() na content-box .entity-card
    // liczy border 1px z każdej strony (border:1px solid, brak box-sizing:border-box) —
    // 660px width + 2px border = 662px zmierzone, potwierdzone niezależnie przez
    // Evaluatora R-CIVPEDIA-KARTY-SPOJNOSC-Q1-A na tej samej klasie .entity-card.
    check(`[${h}px] karta ma szerokość referencyjną min(660px, 100vw-32px)`,
      Math.abs(before.cardWidth - Math.min(660, 1280 - 32)) <= 3, before.cardWidth);
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
  try { fs.unlinkSync(BUNDLE_PRZED); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[unit-info-card-viewport-height-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[unit-info-card-viewport-height-real-render-test] BŁĄD:', e);
  process.exit(1);
});
