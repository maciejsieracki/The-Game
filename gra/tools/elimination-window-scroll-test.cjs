'use strict';
/**
 * elimination-window-scroll-test.cjs — R-WEB-UI-ELIMINATION-WINDOW-FIXED-HEIGHT-SCROLL-Q1.
 *
 * Real render (Chromium/Playwright) modala zdobycia / eliminacji z `showCityCaptureNotice`:
 * wariant widowiskowy (`spectacle`) i wariant bez `spectacle` (sam bilans zdobycia z wierszami).
 * Dla każdego rozmiaru okna (1280x720, 1366x768, 1920x1080, małe 1000x560) sprawdza:
 *  - okno modala mieści się w widoku: top >= 0 i bottom <= innerHeight (bez obcięcia nagłówka);
 *  - gdy treść jest dłuższa niż okno: scrollHeight > clientHeight, a po przewinięciu do dołu
 *    przycisk zamknięcia („Wróć na mapę”) jest w całości w widoku;
 *  - nagłówek „ELIMINACJA!” (wariant widowiskowy) w pełni widoczny przy scrollTop = 0;
 *  - rozwinięcie „Pokaż wszystkie surowce” nie rozpycha okna ponad ekran (przewijanie wewnątrz).
 *
 * Zrzuty PNG: podkatalog `evidence/` obok tego pliku nie jest używany — zapisujemy do katalogu
 * podanego w env ELIM_SCROLL_OUT (domyślnie katalog tymczasowy systemu).
 *
 * Usage (z gra/): node tools/elimination-window-scroll-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));

let chromium;
try {
  ({ chromium } = require(path.resolve(GRA, 'node_modules', 'playwright')));
} catch (_e) {
  console.error('[elimination-window-scroll] playwright missing — npm ci');
  process.exit(1);
}

const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SYSTEM_CHROME = '/usr/bin/chromium';
const TMPDIR = fs.mkdtempSync(path.join(os.tmpdir(), 'elim-window-scroll-'));
const OUT = process.env.ELIM_SCROLL_OUT || TMPDIR;
fs.mkdirSync(OUT, { recursive: true });
const ENTRY = path.join(TMPDIR, 'entry.ts');
const BUNDLE = path.join(TMPDIR, 'bundle.js');

const SIZES = [[1280, 720], [1366, 768], [1920, 1080], [1000, 560]];

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  PASS:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

async function buildBundle() {
  fs.writeFileSync(ENTRY,
    "export * from '" + path.join(GRA, 'src/ui/eliminationSpectacle.ts') + "';\n"
    + "export { showCityCaptureNotice, hideCityCaptureNotice } from '"
    + path.join(GRA, 'src/ui/cityCaptureNotice.ts') + "';\n", 'utf8');
  const stub = {
    name: 'stub-brand',
    setup(b) {
      b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: 'brand-stub', namespace: 'stub' }));
      b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
        contents: "export function brandIconSvg(){return '<svg></svg>';}", loader: 'ts',
      }));
    },
  };
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', globalName: 'M',
    target: 'es2020', outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent', plugins: [stub],
  });
  return fs.readFileSync(BUNDLE, 'utf8');
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (_e) {
    try {
      return await chromium.launch({ headless: true, executablePath: SYSTEM_CHROME, args: ['--no-sandbox'] });
    } catch (_e2) {
      return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
    }
  }
}

/** Wiersze bilansu zdobycia: stały zestaw głównych pozycji + rozwijane surowce (jak na zrzucie). */
function reportRows(long) {
  const rows = [
    { label: 'Przejęte miasto', value: 'Elefantyna', tone: 'info', group: 'przejete' },
    { label: 'Ludność', value: '+12', tone: 'gain', group: 'lup' },
    { label: 'Złoto', value: '+300', tone: 'gain', group: 'lup' },
    { label: 'Budynki', value: '+4', tone: 'gain', group: 'lup' },
  ];
  const extra = long ? 60 : 25;
  for (let i = 0; i < extra; i++) {
    rows.push({ label: 'Surowiec ' + (i + 1), value: '+' + (i + 1), tone: 'gain', group: 'lup', collapsible: true });
  }
  return rows;
}

const measure = () => {
  const r = (e) => {
    if (!e) return null;
    const b = e.getBoundingClientRect();
    return { top: b.top, bottom: b.bottom, h: b.height };
  };
  const box = document.querySelector('.civ-ccn');
  const btn = document.querySelector('[data-stay]');
  const ttl = document.querySelector('.elsp-ttl');
  return {
    ih: window.innerHeight,
    box: r(box),
    btn: r(btn),
    ttl: r(ttl),
    scrollH: box ? box.scrollHeight : 0,
    clientH: box ? box.clientHeight : 0,
    scrollTop: box ? box.scrollTop : 0,
    overflowY: box ? getComputedStyle(box).overflowY : null,
  };
};

async function runCase(browser, bundle, label, w, h, opts) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width"></head>'
    + '<body style="background:#345"></body></html>');
  await page.addScriptTag({ content: bundle });
  await page.evaluate(({ spectacle, rows }) => {
    const M = window.M;
    const d = spectacle ? M.buildEliminationSpectacle({
      civLabel: 'Egipt',
      iconSvg: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>',
      era: 2, fallTurn: 120, elimOwner: 1, captorOwner: 0, captorLabel: 'Ty', captorIsPlayer: true,
      chronicles: new Map(), currentCities: 3, currentPopulation: 40, wonders: 1, techs: 20,
      elimPower: 50, captorPower: 80, captorMaxCities: 9, rulerName: 'Ramzes', capitalName: 'Memfis',
    }) : undefined;
    M.showCityCaptureNotice('Elefantyna', {
      eliminatedCivLabel: 'Egipt', reportRows: rows, spectacle: d,
    });
  }, { spectacle: opts.spectacle, rows: reportRows(opts.long) });
  // Animacje wejścia (opacity/transform) mają się skończyć przed pomiarem.
  await page.waitForTimeout(800);
  if (opts.openMore) {
    await page.evaluate(() => { const d = document.querySelector('.civ-ccn-more'); if (d) d.open = true; });
    await page.waitForTimeout(100);
  }
  const m = await page.evaluate(measure);
  const tag = label + ' ' + w + 'x' + h;
  console.log('[' + tag + ']', JSON.stringify(m));
  ok(m.box && m.box.top >= 0, tag + ': górna krawędź modala >= 0 (nagłówek nie przycięty)');
  ok(m.box && m.box.bottom <= m.ih + 0.5, tag + ': dolna krawędź modala <= innerHeight');
  ok(m.box && m.box.h <= m.ih, tag + ': wysokość modala <= wysokości widoku');
  if (opts.spectacle) {
    ok(m.ttl && m.ttl.top >= 0 && m.ttl.bottom <= m.ih, tag + ': nagłówek ELIMINACJA! w pełni widoczny');
  }
  const longContent = m.scrollH > m.clientH;
  ok(longContent, tag + ': treść dłuższa niż okno -> przewijanie włączone (overflow-y ' + m.overflowY + ')');
  // Przewiń do samego dołu wewnątrz okna i sprawdź, że przycisk zamknięcia jest dostępny.
  await page.evaluate(() => { const b = document.querySelector('.civ-ccn'); if (b) b.scrollTop = b.scrollHeight; });
  const end = await page.evaluate(measure);
  ok(end.btn && end.btn.bottom <= end.ih + 0.5 && end.btn.top >= 0,
    tag + ': po przewinięciu do końca przycisk „Wróć na mapę” w widoku');
  if (opts.screenshot) {
    await page.evaluate(() => { const b = document.querySelector('.civ-ccn'); if (b) b.scrollTop = 0; });
    await page.screenshot({ path: path.join(OUT, opts.screenshot + '-' + w + 'x' + h + '.png') });
  }
  await page.close();
}

async function main() {
  console.log('elimination-window-scroll-test (R-WEB-UI-ELIMINATION-WINDOW-FIXED-HEIGHT-SCROLL-Q1)\n');
  const bundle = await buildBundle();
  const browser = await launchBrowser();
  try {
    console.log('[1] wariant widowiskowy (spectacle), treść długa, rozwinięty „Pokaż wszystkie surowce”');
    for (const [w, h] of SIZES) {
      await runCase(browser, bundle, 'spectacle', w, h,
        { spectacle: true, long: true, openMore: true, screenshot: 'after-spectacle-long' });
    }
    console.log('\n[2] wariant bez spectacle (bilans zdobycia z wierszami), treść długa');
    for (const [w, h] of SIZES) {
      await runCase(browser, bundle, 'nospec', w, h,
        { spectacle: false, long: true, openMore: true, screenshot: 'after-nospec-long' });
    }
  } finally {
    await browser.close();
  }
  console.log('\n' + pass + ' PASS / ' + fail + ' FAIL');
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
