'use strict';
/**
 * newgame-adv-apply-btn-test.cjs — R-WEB-NEWGAME-ADV-APPLY-BTN-Q1 (Maciej, 2026-10-31):
 * przycisk stopki okna „Zaawansowane opcje” (klasa `.adv-close`) ma nazywać się „Zastosuj”
 * i być aktywną akcją główną. Klik = zapis wartości (`saveNewGamePrefs` przez
 * `hideAdvancedModal`) + zamknięcie okna. Wartość z okna ma trafić do:
 *   - prefs w localStorage (`advanced.barbariansLevel`, dokładna wartość 'trudny'),
 *   - ponownie otwartego okna (`.sv` = „Trudny”),
 *   - parametrów startu (`onStart(params).advanced.barbariansLevel === 'trudny'`),
 *     które są budowane z `advOpts` przez `buildParams()` (`advanced: { ...advOpts }`).
 *
 * Harness: realny kod `gra/src/ui/newGameFlow.ts` (esbuild, IIFE, te same stuby zasobów co
 * `newgame-settings-layout-reposition-test.cjs`), headless Chromium, prawdziwe kliki myszą
 * (Playwright). Bez pełnego builda gry — mniejsze zużycie pamięci (maszyna współdzielona).
 * Trzy konfiguracje okna: 1280x720 @100%, 1280x600 @100% (niski viewport),
 * 1280x720 @150% (viewport 853x480, DPR 1.5). W każdej: przycisk ma tekst „Zastosuj”,
 * jest widoczny w viewportcie, trafiony myszą (elementFromPoint), ma tło niebędące
 * przezroczystym, klik zamyka okno i zapisuje dokładną wartość. Osobny przebieg:
 * klik w tło (overlay) nadal zamyka i zapisuje wartość.
 *
 * Run from gra/:  node tools/newgame-adv-apply-btn-test.cjs
 * Mutacja / porównanie z bazą: GAME_ROOT=<abs path do katalogu gra/ z innym src> — test
 * czyta `src/ui/newGameFlow.ts` z GAME_ROOT (domyślnie katalog nadrzędny tego pliku).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));

const GRA = process.env.GAME_ROOT || path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'newgame-adv-apply-'));
const EVIDENCE_DIR = process.env.ADV_EVIDENCE_DIR
  || path.resolve(__dirname, '..', '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-NEWGAME-ADV-APPLY-BTN-Q1', 'evidence');
const PREFS_KEY = 'civ-new-game-prefs-v1';
const BARB_LABEL_RE = /Barbarzyńcy/;

let pass = 0;
let fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else { fail++; console.log(`  FAIL ${label}${detail !== undefined ? ` [zmierzone: ${JSON.stringify(detail)}]` : ''}`); }
}
function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function buildBundle(bundle) {
  const entry = path.join(TMP, 'entry.ts');
  fs.writeFileSync(entry, `
import { showNewGameFlow, hideNewGameFlow } from ${JSON.stringify(path.join(GRA, 'src/ui/newGameFlow.ts'))};
import { DEFAULT_PLAYER_CIV_ID, DEFAULT_START_EPOCH_ID } from ${JSON.stringify(path.join(GRA, 'src/map/newGameMapDefaults.ts'))};
const civ = { id: DEFAULT_PLAYER_CIV_ID, name: 'Grecy', epokiStartowe: [DEFAULT_START_EPOCH_ID], epokaWejscia: DEFAULT_START_EPOCH_ID };
const config = { getCivs: () => [civ], onStart: p => { window.__params = p; } };
window.__openWizard = () => showNewGameFlow(config);
window.__closeWizard = () => hideNewGameFlow();
window.__openWizard();
`);
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: bundle, absWorkingDir: GRA, logLevel: 'silent',
    plugins: [{ name: 'browser-asset-stubs', setup(build) {
      build.onResolve({ filter: /data\/loader$/ }, () => ({ path: 'loader', namespace: 'stub' }));
      build.onLoad({ filter: /.*/, namespace: 'stub' }, args => {
        if (args.path === 'loader') return { contents: 'export const loadGameData=()=>null;', loader: 'js' };
        if (args.path === 'brands') return { contents: 'export const civIconSvg=()=>""; export const epochIconSvg=()=>""; export const newGameIntroEmblemSvg=()=>""; export const settingIconSvg=()=>"";', loader: 'js' };
        if (args.path === 'tokens') return { contents: 'export const CIV_BRAND_SCOPE_VARS=""; export const ensureBrandRootTokens=()=>{};', loader: 'js' };
        if (args.path === 'tooltip') return { contents: 'export const installHudTitleTooltips=()=>{};', loader: 'js' };
        return null;
      });
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: 'brands', namespace: 'stub' }));
      build.onResolve({ filter: /brandTokenVars$/ }, () => ({ path: 'tokens', namespace: 'stub' }));
      build.onResolve({ filter: /hero-intro\.png\?url$/ }, () => ({ path: 'hero', namespace: 'asset-stub' }));
      build.onLoad({ filter: /.*/, namespace: 'asset-stub' }, () => ({ contents: 'export default "";', loader: 'js' }));
      build.onResolve({ filter: /hudTitleTooltip$/ }, () => ({ path: 'tooltip', namespace: 'stub' }));
    } }],
  });
}

async function launchBrowser() {
  const args = ['--no-sandbox', '--disable-dev-shm-usage'];
  try { return await chromium.launch({ headless: true, args }); }
  catch (_e) {
    return await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
      headless: true, args,
    });
  }
}

async function enterSettings(page) {
  await page.locator('.civ-newgame .cta-hero').click();
  await page.locator('.civ-newgame .nav .next').click();
  await page.locator('.civ-newgame .nav .next').click();
  await page.waitForSelector('.civ-newgame .sett-grid');
  await wait(150);
}

function barbRow(page) {
  return page.locator('.civ-newgame .adv-modal .adv-row', {
    has: page.locator('.adv-lbl', { hasText: BARB_LABEL_RE }),
  }).first();
}

async function readBarbValue(page) {
  return (await barbRow(page).locator('.sv').innerText()).trim();
}

async function readPrefsBarb(page) {
  return page.evaluate((k) => {
    try {
      const raw = localStorage.getItem(k);
      return raw ? (JSON.parse(raw).advanced?.barbariansLevel ?? null) : null;
    } catch (_e) { return null; }
  }, PREFS_KEY);
}

async function overlayIsOpen(page) {
  return page.evaluate(() => !!document.querySelector('.adv-overlay')?.classList.contains('open'));
}

/** Przebieg „Zastosuj” w jednej konfiguracji okna. */
async function runApplyScenario(browser, origin, cfg) {
  console.log(`\n[scenariusz] ${cfg.label}`);
  const ctx = await browser.newContext({ viewport: { width: cfg.w, height: cfg.h }, deviceScaleFactor: cfg.dpr });
  const page = await ctx.newPage();
  const jsErrors = [];
  page.on('pageerror', (e) => jsErrors.push(e.message));
  try {
    await page.goto(origin, { waitUntil: 'load' });
    await page.addScriptTag({ path: cfg.bundle });
    await enterSettings(page);

    await page.locator('.civ-newgame .btn-adv').click();
    await page.waitForSelector('.civ-newgame .adv-overlay.open');
    await wait(200);

    const before = await readBarbValue(page);
    check(`domyślna wartość „Barbarzyńcy” = „Normalny” (zmierzone: ${before})`, before === 'Normalny', before);
    await barbRow(page).locator('button.arr').nth(1).click();
    await wait(120);
    const changed = await readBarbValue(page);
    check(`wartość zmieniona w oknie na „Trudny” (zmierzone: ${changed})`, changed === 'Trudny', changed);

    const btn = page.locator('.civ-newgame .adv-modal .adv-close');
    const btnText = ((await btn.textContent()) ?? '').trim();
    check(`przycisk stopki ma tekst „Zastosuj” (zmierzone: „${btnText}”)`, btnText === 'Zastosuj', btnText);
    const btnType = await btn.getAttribute('type');
    check(`przycisk ma type="button" (zmierzone: ${btnType})`, btnType === 'button', btnType);
    check('przycisk nie jest disabled', await btn.isEnabled());

    const geo = await page.evaluate(() => {
      const b = document.querySelector('.civ-newgame .adv-modal .adv-close');
      const r = b.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const cs = getComputedStyle(b);
      return {
        inVp: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
        hitIsBtn: !!hit && (hit === b || b.contains(hit)),
        pointerEvents: cs.pointerEvents,
        background: cs.backgroundColor,
        borderColor: cs.borderTopColor,
        rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      };
    });
    check(`przycisk w całości widoczny w viewportcie (zmierzone rect: ${geo.rect})`, geo.inVp, geo.rect);
    check(`przycisk trafiony myszą (elementFromPoint, nie zasłonięty)`, geo.hitIsBtn, geo.hitIsBtn);
    check(`pointer-events nie blokuje kliku (zmierzone: ${geo.pointerEvents})`, geo.pointerEvents !== 'none', geo.pointerEvents);
    check(`tło przycisku nieprzezroczyste / aktywne (zmierzone: ${geo.background})`,
      geo.background !== 'transparent' && geo.background !== 'rgba(0, 0, 0, 0)', geo.background);

    if (cfg.screenshot) {
      fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
      await page.locator('.civ-newgame .adv-modal').screenshot({ path: path.join(EVIDENCE_DIR, cfg.screenshot) });
      console.log(`  zrzut: ${path.join(EVIDENCE_DIR, cfg.screenshot)}`);
    }

    await btn.click();
    await wait(200);
    check('klik „Zastosuj” zamyka okno', !(await overlayIsOpen(page)));
    const savedAfterApply = await readPrefsBarb(page);
    check(`prefs zapisane: advanced.barbariansLevel === 'trudny' (zmierzone: ${savedAfterApply})`,
      savedAfterApply === 'trudny', savedAfterApply);

    await page.locator('.civ-newgame .btn-adv').click();
    await page.waitForSelector('.civ-newgame .adv-overlay.open');
    await wait(200);
    const reopened = await readBarbValue(page);
    check(`po ponownym otwarciu okna wartość „Trudny” (zmierzone: ${reopened})`, reopened === 'Trudny', reopened);
    await btn.click();
    await wait(150);

    await page.locator('.civ-newgame .nav .next').click();
    await page.waitForFunction(() => window.__params !== undefined, null, { timeout: 10000 });
    const params = await page.evaluate(() => window.__params);
    const startBarb = params?.advanced?.barbariansLevel;
    check(`parametry startu: advanced.barbariansLevel === 'trudny' (zmierzone: ${startBarb})`,
      startBarb === 'trudny', startBarb);
    check('brak błędów JS na stronie', jsErrors.length === 0, jsErrors.slice(0, 3));
  } finally {
    await ctx.close();
  }
}

/** Klik w tło (overlay) — zachowanie bez zmian: zamyka i zapisuje. */
async function runBackgroundScenario(browser, origin, bundle) {
  console.log('\n[scenariusz] klik w tło zamyka i zapisuje (zachowanie bez zmian)');
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  try {
    await page.goto(origin, { waitUntil: 'load' });
    await page.addScriptTag({ path: bundle });
    await enterSettings(page);
    await page.locator('.civ-newgame .btn-adv').click();
    await page.waitForSelector('.civ-newgame .adv-overlay.open');
    await wait(200);
    await barbRow(page).locator('button.arr').nth(1).click();
    await barbRow(page).locator('button.arr').nth(1).click();
    await wait(120);
    const changed = await readBarbValue(page);
    check(`wartość zmieniona w oknie na „Brak” (zmierzone: ${changed})`, changed === 'Brak', changed);
    await page.mouse.click(5, 5);
    await wait(200);
    check('klik w tło zamyka okno', !(await overlayIsOpen(page)));
    const saved = await readPrefsBarb(page);
    check(`klik w tło zapisuje: advanced.barbariansLevel === 'brak' (zmierzone: ${saved})`, saved === 'brak', saved);
  } finally {
    await ctx.close();
  }
}

(async () => {
  const bundle = path.join(TMP, 'bundle.js');
  await buildBundle(bundle);
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><html><head></head><body></body></html>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}/`;
  const browser = await launchBrowser();
  const guarded = async (name, fn) => {
    try { await fn(); }
    catch (e) { check(`scenariusz „${name}” przerwany wyjątkiem: ${String(e.message).split('\n')[0]}`, false); }
  };
  try {
    await guarded('1280x720 @100%', () => runApplyScenario(browser, origin, { label: '1280x720 @100%', w: 1280, h: 720, dpr: 1, bundle, screenshot: 'adv-zastosuj-1280x720-100.png' }));
    await guarded('1280x600 @100%', () => runApplyScenario(browser, origin, { label: '1280x600 @100% (niski viewport)', w: 1280, h: 600, dpr: 1, bundle }));
    await guarded('1280x720 @150%', () => runApplyScenario(browser, origin, { label: '1280x720 @150% (viewport 853x480, DPR 1.5)', w: 853, h: 480, dpr: 1.5, bundle, screenshot: 'adv-zastosuj-1280x720-150.png' }));
    await guarded('klik w tło', () => runBackgroundScenario(browser, origin, bundle));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(TMP, { recursive: true, force: true });
  }
  console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
  if (fail !== 0) process.exitCode = 1;
})().catch((e) => { console.error('FATAL', e); process.exitCode = 1; });
