'use strict';
/**
 * build-mode-lock-tip-position-real-render-test.cjs
 *
 * TEMAT: P-BUILDMODE-LOCKTIP-ZASLANIA-LISTE-Q1.
 *
 * Zgłoszenie właściciela: tooltip blokady technologicznej w panelu „ULEPSZENIA TERENU”
 * zasłaniał całe ulepszenie (wiersze listy pod triggerem). Przyczyna: `showLockTip()`
 * w `src/ui/buildModeHud.ts` pozycjonował sztywno (`left = r.left - 250`, `top = r.top`)
 * bez pomiaru tooltipa ani granic viewportu, a przy `max-width:480px` tooltip rozlewał
 * się z powrotem NA panel.
 *
 * jsdom NIE nadaje się do weryfikacji tej naprawy — `getBoundingClientRect()` w jsdom
 * zwraca same zera, więc każda asercja „tooltip nie nachodzi na wiersz” byłaby fałszywie
 * zielona (precedens: `R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1`). Dlatego test odtwarza
 * panel w PRAWDZIWYM Chromium (wzorzec `building-detail-card-hover-layout-real-render-test.cjs`)
 * i liczy REALNE prostokąty:
 *
 *  (A) kontrakt źródła: `showLockTip()` mierzy tooltip (`offsetWidth/offsetHeight`),
 *      kotwiczy się poziomo o prostokąt CAŁEJ listy i clampuje do `window.innerWidth/
 *      innerHeight` — oraz NIE zawiera już sztywnego offsetu `r.left - 250`;
 *  (B) realny hover w Chromium na wierszu ze ŚRODKA listy: tooltip nie przecina ANI
 *      JEDNEGO `.civ-build-item` i nie przecina prostokąta `.civ-build-panel`;
 *  (C) realny hover na OSTATNIM (najniższym) zablokowanym wierszu: tooltip nadal w
 *      całości mieści się w viewport (clamp pionowy) i nadal nie zasłania listy;
 *  (D) wąski viewport (flip/clamp nie wypycha tooltipa poza ekran).
 *
 * Opcjonalny zrzut ekranu: --shot <ścieżka.png> (dowód wizualny do raportu, nie do repo).
 *
 * Usage (z gra/): node tools/build-mode-lock-tip-position-real-render-test.cjs [--shot out.png]
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[build-mode-lock-tip-position-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_STUB = path.resolve(STUB_DIR, 'build-mode-lock-tip-brandAssets-stub.ts');
const OWL_STUB = path.resolve(STUB_DIR, 'build-mode-lock-tip-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.build-mode-lock-tip-entry.ts');
const OUTFILE = path.resolve(__dirname, '.build-mode-lock-tip-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const shotArgIdx = process.argv.indexOf('--shot');
const SHOT_PATH = shotArgIdx !== -1 ? process.argv[shotArgIdx + 1] : null;

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

// ---------------------------------------------------------------------------
// (A) Kontrakt źródła — logika clamp/flip realnie żyje w `showLockTip()`.
// ---------------------------------------------------------------------------
function extractShowLockTip() {
  const src = fs.readFileSync(path.join(GRA, 'src', 'ui', 'buildModeHud.ts'), 'utf8');
  const start = src.indexOf('function showLockTip(text: string, anchor: HTMLElement): void {');
  if (start === -1) return null;
  const end = src.indexOf('\n  }\n', start);
  if (end === -1) return null;
  return src.slice(start, end);
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[build-mode-lock-tip-position-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

function overlap(a, b) {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0.5 && h > 0.5 ? { w: Math.round(w), h: Math.round(h) } : null;
}

async function main() {
  const fnSrc = extractShowLockTip();
  check('kotwica showLockTip() znaleziona w buildModeHud.ts', !!fnSrc);
  if (!fnSrc) { process.exit(1); return; }

  check('showLockTip() mierzy REALNY rozmiar tooltipa (offsetWidth + offsetHeight)',
    fnSrc.includes('offsetWidth') && fnSrc.includes('offsetHeight'));
  check('showLockTip() clampuje do granic viewportu (window.innerWidth + window.innerHeight)',
    fnSrc.includes('window.innerWidth') && fnSrc.includes('window.innerHeight'));
  check('showLockTip() kotwiczy się poziomo o prostokąt CAŁEJ listy (el.getBoundingClientRect), nie tylko o wiersz',
    /el\.getBoundingClientRect\(\)/.test(fnSrc));
  check('showLockTip() NIE zawiera już sztywnego offsetu `r.left - 250` (stary bug)',
    !/r\.left\s*-\s*250/.test(fnSrc), fnSrc.slice(0, 400));
  check('showLockTip() ma flip na drugą stronę listy (dwie gałęzie poziome)',
    /listRight/.test(fnSrc) && /listLeft/.test(fnSrc));

  // ---------------------------------------------------------------------
  // Bundle + realna przeglądarka.
  // ---------------------------------------------------------------------
  fs.writeFileSync(
    ENTRY,
    [
      "import { createBuildModeHud } from '../src/ui/buildModeHud.ts';",
      'window.__createBuildModeHud = createBuildModeHud;',
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

  const bundleJs = fs.readFileSync(OUTFILE, 'utf8');
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  await page.setContent(
    '<style>*{margin:0;padding:0;box-sizing:border-box;}'
    + 'html,body{width:100%;height:100%;background:#0a1020;}</style>'
    + '<div id="root"></div>',
  );
  await page.addScriptTag({ content: bundleJs });

  // Panel z długą listą; kilka pozycji zablokowanych DWIEMA technologiami naraz —
  // dokładnie taki lockHint jak na zrzucie właściciela (najdłuższy realny tekst).
  await page.evaluate(() => {
    const LONG = 'Technologie: «Obróbka kamienia» + «Garncarstwo» · Koszt: 40 Pracy';
    const types = [
      { key: 'farma', label: 'Farma', kosztPraca: 20, epoka: 1, techUnlocked: true },
      { key: 'pastwisko', label: 'Pastwisko', kosztPraca: 20, epoka: 1, techUnlocked: true },
      { key: 'tartak', label: 'Tartak', kosztPraca: 30, epoka: 1, techUnlocked: false, techLabel: 'Stolarstwo', lockHint: LONG },
      { key: 'kamieniolom', label: 'Kamieniołom', kosztPraca: 30, epoka: 1, techUnlocked: false, techLabel: 'Murarstwo', lockHint: LONG },
      { key: 'kopalnia', label: 'Kopalnia', kosztPraca: 40, epoka: 2, techUnlocked: false, techLabel: 'Górnictwo', lockHint: LONG },
      { key: 'droga', label: 'Droga', kosztPraca: 15, epoka: 1, techUnlocked: true },
      { key: 'fort', label: 'Fort', kosztPraca: 45, epoka: 2, techUnlocked: false, techLabel: 'Fortyfikacje', lockHint: LONG },
      { key: 'winnica', label: 'Winnica', kosztPraca: 35, epoka: 2, techUnlocked: false, techLabel: 'Uprawa winorośli', lockHint: LONG },
      { key: 'plantacja', label: 'Plantacja', kosztPraca: 35, epoka: 2, techUnlocked: false, techLabel: 'Rolnictwo', lockHint: LONG },
      { key: 'obozowisko', label: 'Obozowisko', kosztPraca: 25, epoka: 1, techUnlocked: true },
      { key: 'rybolowstwo', label: 'Rybołówstwo', kosztPraca: 25, epoka: 1, techUnlocked: false, techLabel: 'Żegluga', lockHint: LONG },
      { key: 'mlyn', label: 'Młyn', kosztPraca: 50, epoka: 3, techUnlocked: false, techLabel: 'Koło wodne', lockHint: LONG },
    ];
    window.__hud = window.__createBuildModeHud({
      listTypes: () => types,
      getActiveKey: () => null,
      onSelectType: () => {},
      onExit: () => {},
      isOpen: () => true,
      getPracaPool: () => 999,
    });
    window.__hud.update();
  });

  const lockedCount = await page.evaluate(
    () => document.querySelectorAll('.civ-build-item[data-lock-hint]').length,
  );
  check('panel wyrenderował zablokowane wiersze z data-lock-hint', lockedCount >= 6, { lockedCount });

  // Pomiar: hover na N-tym zablokowanym wierszu -> prostokąty tooltipa, panelu, wierszy.
  async function measureOnLocked(idx) {
    await page.evaluate((i) => {
      const rows = document.querySelectorAll('.civ-build-item[data-lock-hint]');
      const row = rows[i < 0 ? rows.length + i : i];
      row.scrollIntoView({ block: 'nearest' });
      row.setAttribute('data-under-test', '1');
    }, idx);
    await page.hover('.civ-build-item[data-under-test="1"]');
    await page.waitForTimeout(60);
    const res = await page.evaluate(() => {
      const tip = document.querySelector('.civ-build-lock-tip');
      const panel = document.querySelector('.civ-build-panel');
      const cs = getComputedStyle(tip);
      const rect = (e) => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
      return {
        display: cs.display,
        text: tip.textContent,
        tip: rect(tip),
        panel: rect(panel),
        rows: Array.from(document.querySelectorAll('.civ-build-item')).map(rect),
        vw: window.innerWidth,
        vh: window.innerHeight,
      };
    });
    return res;
  }

  async function clearUnderTest() {
    await page.evaluate(() => {
      document.querySelector('[data-under-test]')?.removeAttribute('data-under-test');
    });
  }

  function assertNoOverlap(tag, m) {
    check(`${tag}: tooltip jest widoczny (display != none, niezerowa geometria)`,
      m.display !== 'none' && m.tip.width > 0 && m.tip.height > 0, { display: m.display, tip: m.tip });
    const hits = m.rows.map((r, i) => ({ i, ov: overlap(m.tip, r) })).filter(x => x.ov);
    check(`${tag}: (a) tooltip NIE nachodzi na ŻADEN wiersz listy (${m.rows.length} wierszy zmierzonych realnie)`,
      hits.length === 0, { hits, tip: m.tip });
    check(`${tag}: tooltip nie przecina prostokąta całego panelu .civ-build-panel`,
      overlap(m.tip, m.panel) === null, { tip: m.tip, panel: m.panel });
    check(`${tag}: (b) tooltip w CAŁOŚCI w viewport (left/top >= 0, right <= vw, bottom <= vh)`,
      m.tip.left >= -0.5 && m.tip.top >= -0.5 && m.tip.right <= m.vw + 0.5 && m.tip.bottom <= m.vh + 0.5,
      { tip: m.tip, vw: m.vw, vh: m.vh });
  }

  // (B) wiersz ze ŚRODKA listy — scenariusz ze zgłoszenia.
  const mid = await measureOnLocked(2);
  assertNoOverlap('B/środek listy', mid);
  check('B/środek listy: tooltip pokazuje realny lockHint z dwiema technologiami',
    mid.text.includes('Technologie:') && mid.text.includes('Koszt:'), { text: mid.text });

  if (SHOT_PATH) {
    fs.mkdirSync(path.dirname(SHOT_PATH), { recursive: true });
    await page.screenshot({ path: SHOT_PATH });
    console.log('[build-mode-lock-tip-position-real-render-test] zrzut: ' + SHOT_PATH);
  }
  await clearUnderTest();

  // (C) OSTATNI zablokowany wiersz (najniżej) — clamp pionowy.
  const last = await measureOnLocked(-1);
  assertNoOverlap('C/ostatni wiersz listy', last);
  await clearUnderTest();

  // (D) wąski viewport — flip/clamp nie może wypchnąć tooltipa poza ekran.
  await page.setViewportSize({ width: 760, height: 560 });
  await page.evaluate(() => window.__hud.update());
  const narrow = await measureOnLocked(2);
  assertNoOverlap('D/wąski viewport 760x560', narrow);
  await clearUnderTest();

  check('brak błędów konsoli/pageerror w całym scenariuszu', consoleErrors.length === 0, consoleErrors);

  await browser.close();
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[build-mode-lock-tip-position-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
