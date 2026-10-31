'use strict';
/**
 * newgame-defaults-test.cjs — R-WEB-NEWGAME-DEFAULTS-Q1 (Maciej 2026-10-31).
 *
 * Real-browser test of the NEW-GAME wizard defaults (esbuild harness, jak newgame-settings-layout-reposition-test):
 *   1. świeży profil (pusty localStorage): siatka kroku 4 + okno „Zaawansowane opcje" = tabela domyślnych,
 *   2. udział lądu 30% dla Pangea / Wyspy (suwak obecny), brak suwaka dla Ziemi,
 *   3. krok Start: DOM podsumowania oraz window.__params (parametry startu gry = domyślne),
 *   4. zapisane preferencje gracza NIE są nadpisywane nowymi domyślnymi (po przeładowaniu),
 *   5. wyczyszczenie preferencji (reset) przywraca tabelę domyślnych.
 *
 * Run from gra/:  PLAYWRIGHT_CHROMIUM_EXECUTABLE=... node tools/newgame-defaults-test.cjs
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));

const GRA = process.env.GAME_ROOT || path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'newgame-defaults-'));
const PREFS_KEY = 'civ-new-game-prefs-v1';
const EVIDENCE = path.resolve(GRA, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-NEWGAME-DEFAULTS-Q1', 'evidence');

// Po scaleniu z R-WEB-NEWGAME-MENU-REORDER-Q1: siatka kroku 4 ma 12 kart (warunki zwycięstwa, trudność miast-państw,
// barbarzyńcy, „Wojna epoki”, chatki z nagrodami przeszły z „Zaawansowanych” do siatki).
const EXPECTED_GRID = {
  'Rozmiar mapy': 'Standardowy',
  'Typ świata': 'Kontynenty',
  'Poziom trudności': 'Normalny',
  'Prędkość gry': 'Standardowa',
  'Udział lądu na mapie': '30% lądu / 70% morze',
  'Warunki zwycięstwa': 'Moc + dominacja',
  'Trudność miast-państw': 'Normalny',
  'Barbarzyńcy': 'Normalny',
  'Wojna epoki': 'Włączona',
  'Chatki z nagrodami': 'Włączone',
};

const EXPECTED_ADV = {
  'Wymagaj rozpatrzenia ofert handlowych przed końcem tury': 'Włączona',
  'Bitwy': 'Bitwa ręczna i automatyczna',
  'Koszty budynków': 'Normalny',
  'Koszty jednostek': 'Normalny',
  'Wzrost ludności': 'Normalny',
  'Zasięg ruchu': 'Normalny',
  'Limit miast zakładanych (baza)': '10 miast',
  'Jakość grafiki mapy': 'Średnia',
  'Surowce na mapie': 'Normalnie',
  'Rzeki': 'Normalnie',
  'Pustynie': 'Normalnie',
  'Las': 'Normalnie',
  'Góry i wzgórza': 'Normalnie',
};

/** Parametry startu gry (window.__params.advanced) dla świeżego profilu = tabela domyślnych. */
const EXPECTED_PARAMS_ADVANCED = {
  battleAlwaysManual: true,
  ruchSwiataPace: 'normalny',
  buildingCostPace: 'normalny',
  wzrostLudnosciPace: 'normalny',
  kosztJednostekPace: 'normalny',
  cityStateDifficultyOverride: 'normal',
  barbariansLevel: 'normalny',
  victoryMode: 'moc_i_dominacja',
  cityLimitBase: 10,
  landFractionCustom: false,
};

let pass = 0;
let fail = 0;
function check(label, condition) {
  if (condition) { pass++; console.log(`  OK  ${label}`); }
  else { fail++; console.error(` FAIL ${label}`); }
}

function buildHarness() {
  const entry = path.join(TMP, 'entry.ts');
  const bundle = path.join(TMP, 'bundle.js');
  fs.writeFileSync(entry, `
import { showNewGameFlow, hideNewGameFlow } from ${JSON.stringify(path.join(GRA, 'src/ui/newGameFlow.ts'))};
import { DEFAULT_PLAYER_CIV_ID, DEFAULT_START_EPOCH_ID } from ${JSON.stringify(path.join(GRA, 'src/map/newGameMapDefaults.ts'))};
const civ = { id: DEFAULT_PLAYER_CIV_ID, name: 'Grecy', epokiStartowe: [DEFAULT_START_EPOCH_ID], epokaWejscia: DEFAULT_START_EPOCH_ID };
const config = { getCivs: () => [civ], onStart: p => { window.__params = p; } };
window.__openWizard = () => showNewGameFlow(config);
window.__closeWizard = () => hideNewGameFlow();
window.__openWizard();
`);
  return esbuild.build({
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
  }).then(() => bundle);
}

async function launch() {
  try { return await chromium.launch({ headless: true, args: ['--no-sandbox'] }); }
  catch (_error) {
    return chromium.launch({
      headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

/** Ładuje bundle do świeżej strony; localStorage pochodzi z kontekstu przeglądarki. */
async function loadPage(context, origin, bundle) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error && error.message)));
  await page.goto(origin, { waitUntil: 'load' });
  await page.addScriptTag({ path: bundle });
  await page.waitForSelector('.civ-newgame .cta-hero', { timeout: 15000 });
  return { page, errors };
}

async function reloadPage(page, bundle) {
  await page.reload({ waitUntil: 'load' });
  await page.addScriptTag({ path: bundle });
  await page.waitForSelector('.civ-newgame .cta-hero', { timeout: 15000 });
}

async function activeStepLabel(page) {
  return ((await page.locator('.civ-newgame .stepbar .si.active .si-l').textContent()) || '').trim();
}

async function gotoStep(page, label) {
  for (let i = 0; i < 8; i++) {
    const current = await activeStepLabel(page);
    if (current === label) return;
    if (current === 'Intro') await page.locator('.civ-newgame .cta-hero').click();
    else await page.locator('.civ-newgame .nav .nb.next').click();
    await page.waitForTimeout(150);
  }
  throw new Error('Nie udało się dojść do kroku ' + label + ' (aktywny: ' + (await activeStepLabel(page)) + ')');
}

async function gridRows(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('.civ-newgame .sett-grid .srow')).map((row) => ({
    lbl: (row.querySelector('.sl')?.textContent || '').trim(),
    val: (row.querySelector('.sv')?.textContent || '').trim(),
  })));
}

async function advRows(page) {
  await page.locator('.civ-newgame .btn-adv').click();
  await page.waitForSelector('.civ-newgame .adv-overlay.open');
  return page.evaluate(() => Array.from(document.querySelectorAll('.adv-modal .adv-row')).map((row) => ({
    lbl: (row.querySelector('.adv-lbl')?.textContent || '').trim(),
    val: (row.querySelector('.sv')?.textContent || '').trim(),
  })));
}

async function closeAdv(page) {
  await page.locator('.adv-modal .adv-close').click();
  await page.waitForTimeout(150);
}

async function clickGridArrow(page, lbl, dir) {
  const ok = await page.evaluate(({ lbl, dir }) => {
    const row = Array.from(document.querySelectorAll('.civ-newgame .sett-grid .srow'))
      .find((r) => (r.querySelector('.sl')?.textContent || '').trim() === lbl);
    if (!row) return false;
    const arrows = row.querySelectorAll('.sctl .arr');
    const btn = dir < 0 ? arrows[0] : arrows[arrows.length - 1];
    if (!btn) return false;
    btn.click();
    return true;
  }, { lbl, dir });
  await page.waitForTimeout(150);
  return ok;
}

function valueOf(rows, lbl) {
  const row = rows.find((r) => r.lbl === lbl);
  return row ? row.val : undefined;
}

async function main() {
  const bundle = await buildHarness().then(() => path.join(TMP, 'bundle.js'));
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><html><head></head><body></body></html>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}/`;
  const browser = await launch();
  try {
    fs.mkdirSync(EVIDENCE, { recursive: true });

    // --- 1. Świeży profil: siatka kroku 4 + okno Zaawansowane ---
    console.log('== 1. świeży profil: siatka + Zaawansowane');
    const ctxA = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const a = await loadPage(ctxA, origin, bundle);
    await gotoStep(a.page, 'Ustawienia');
    const grid = await gridRows(a.page);
    for (const [lbl, expected] of Object.entries(EXPECTED_GRID)) {
      check(`krok 4 „${lbl}" = ${expected}`, valueOf(grid, lbl) === expected);
    }
    await a.page.screenshot({ path: path.join(EVIDENCE, 'krok4-ustawienia-domyslne.png') });
    const adv = await advRows(a.page);
    for (const [lbl, expected] of Object.entries(EXPECTED_ADV)) {
      const row = adv.find((r) => r.lbl === lbl);
      check(`okno „Zaawansowane" „${lbl}" = ${expected}`, !!row && row.val === expected);
    }
    check('okno „Zaawansowane" nie zawiera suwaka „Udział lądu" (jest tylko w siatce)',
      !adv.some((r) => r.lbl === 'Udział lądu na mapie'));
    await a.page.screenshot({ path: path.join(EVIDENCE, 'zaawansowane-domyslne.png') });
    await closeAdv(a.page);

    // --- 2. Udział lądu 30%: Kontynenty -> Pangea -> Wyspy; Ziemia bez suwaka ---
    console.log('== 2. udział lądu 30% (Pangea/Wyspy), Ziemia bez suwaka');
    check('Kontynenty -> Pangea', await clickGridArrow(a.page, 'Typ świata', 1));
    let rows = await gridRows(a.page);
    check('Pangea: typ = Pangea', valueOf(rows, 'Typ świata') === 'Pangea');
    check('Pangea: udział lądu = 30%', valueOf(rows, 'Udział lądu na mapie') === '30% lądu / 70% morze');
    check('Pangea -> Wyspy', await clickGridArrow(a.page, 'Typ świata', 1));
    rows = await gridRows(a.page);
    check('Wyspy: typ = Wyspy', valueOf(rows, 'Typ świata') === 'Wyspy');
    check('Wyspy: udział lądu = 30%', valueOf(rows, 'Udział lądu na mapie') === '30% lądu / 70% morze');
    check('Wyspy -> Ziemia', await clickGridArrow(a.page, 'Typ świata', 1));
    rows = await gridRows(a.page);
    check('Ziemia: typ = Ziemia', valueOf(rows, 'Typ świata') === 'Ziemia');
    check('Ziemia: brak wiersza „Udział lądu na mapie" w siatce', valueOf(rows, 'Udział lądu na mapie') === undefined);
    const advZiemia = await advRows(a.page);
    check('Ziemia: brak suwaka lądu w oknie Zaawansowane', !advZiemia.some((r) => r.lbl === 'Udział lądu na mapie'));
    await closeAdv(a.page);
    check('Ziemia -> Wyspy', await clickGridArrow(a.page, 'Typ świata', -1));
    rows = await gridRows(a.page);
    check('Wyspy po powrocie: udział lądu = 30%', valueOf(rows, 'Udział lądu na mapie') === '30% lądu / 70% morze');

    // --- 3. Krok Start: DOM podsumowania + window.__params ---
    console.log('== 3. krok Start: podsumowanie + parametry startu');
    await gotoStep(a.page, 'Start');
    const summary = await a.page.evaluate(() => (document.querySelector('.civ-newgame')?.textContent || ''));
    for (const needle of ['Bitwa ręczna i automatyczna', 'Moc + dominacja', 'Standardowy', 'Normalny']) {
      check(`krok Start zawiera „${needle}"`, summary.includes(needle));
    }
    // Krok 5 (Start) sam wywołuje onStart(params) przy renderze (newGameFlow.ts ~l.2271) — nie ma już przycisku nav.
    await a.page.waitForFunction(() => !!window.__params, null, { timeout: 15000 });
    const params = await a.page.evaluate(() => window.__params);
    check('__params: landFractionPercent = 30 (Wyspy)', !!params && params.landFractionPercent === 30);
    check('__params: dealsEndTurnGate = true', !!params && params.dealsEndTurnGate === true);
    check('__params: playerEpochWarEnabled = true', !!params && params.playerEpochWarEnabled === true);
    for (const [key, expected] of Object.entries(EXPECTED_PARAMS_ADVANCED)) {
      check(`__params.advanced.${key} = ${JSON.stringify(expected)}`, !!params && !!params.advanced && params.advanced[key] === expected);
    }
    check('brak błędów strony (pageerror)', a.errors.length === 0);
    await ctxA.close();

    // --- 4. Zapisane preferencje gracza nie są nadpisywane nowymi domyślnymi ---
    console.log('== 4. zapisane preferencje nie są nadpisywane');
    const ctxB = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const b = await loadPage(ctxB, origin, bundle);
    await gotoStep(b.page, 'Ustawienia');
    const battleRowB = b.page.locator('.civ-newgame .adv-modal .adv-row', { has: b.page.locator('.adv-lbl', { hasText: 'Bitwy' }) });
    await b.page.locator('.civ-newgame .btn-adv').click();
    await b.page.waitForSelector('.civ-newgame .adv-overlay.open');
    await battleRowB.locator('button.arr').nth(1).click();
    check('zmiana Bitwy na „Bitwa automatyczna" przed zapisem',
      (await battleRowB.locator('.sv').textContent()).trim() === 'Bitwa automatyczna');
    await closeAdv(b.page);
    await b.page.evaluate(() => window.__closeWizard());
    const saved = await b.page.evaluate((key) => window.localStorage.getItem(key), PREFS_KEY);
    check(`prefs zapisane pod kluczem ${PREFS_KEY}`, typeof saved === 'string' && saved.length > 0);
    await reloadPage(b.page, bundle);
    await gotoStep(b.page, 'Ustawienia');
    const advAfterReload = await advRows(b.page);
    check('po przeładowaniu: zapisana Bitwa „Bitwa automatyczna" zachowana (nie nadpisana domyślną)',
      valueOf(advAfterReload, 'Bitwy') === 'Bitwa automatyczna');
    await closeAdv(b.page);
    await ctxB.close();

    // --- 5. Reset (wyczyszczenie preferencji) przywraca domyślne ---
    console.log('== 5. reset preferencji = domyślne');
    const ctxC = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const c = await loadPage(ctxC, origin, bundle);
    await c.page.evaluate((key) => window.localStorage.removeItem(key), PREFS_KEY);
    await reloadPage(c.page, bundle);
    await gotoStep(c.page, 'Ustawienia');
    const resetAdv = await advRows(c.page);
    check('reset: Bitwy = Bitwa ręczna i automatyczna', valueOf(resetAdv, 'Bitwy') === 'Bitwa ręczna i automatyczna');
    check('reset: Zasięg ruchu = Normalny', valueOf(resetAdv, 'Zasięg ruchu') === 'Normalny');
    await closeAdv(c.page);
    const resetGrid = await gridRows(c.page);
    check('reset: udział lądu (Kontynenty) = 30%', valueOf(resetGrid, 'Udział lądu na mapie') === '30% lądu / 70% morze');
    await ctxC.close();
  } finally {
    await browser.close();
    server.close();
    fs.rmSync(TMP, { recursive: true, force: true });
  }
  console.log(`\n${pass} pass · ${fail} fail`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((error) => { console.error('[newgame-defaults-test] błąd:', error); process.exitCode = 1; });
