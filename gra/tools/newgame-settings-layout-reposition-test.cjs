'use strict';

/**
 * Real Chromium regression for the new-game settings layout (krok 4 kreatora).
 * R-WEB-NEWGAME-MENU-REORDER-Q1: układ 12 kart głównej siatki (2 kolumny) + 13 pozycji
 * okna „Zaawansowane opcje" bez duplikatów; wartości zapisują się i trafiają do parametrów startu.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));

const GRA = process.env.GAME_ROOT || path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'newgame-settings-layout-'));

/** Kolejność głównej siatki: [lewa1, prawa1, lewa2, prawa2, …] (LEWA góra→dół, potem PRAWA). */
const MAIN_GRID_ORDER = [
  'Rozmiar mapy', 'Liczba cywilizacji',
  'Typ świata', 'Miasta-państwa',
  'Udział lądu na mapie', 'Trudność miast-państw',
  'Prędkość gry', 'Wojna epoki',
  'Poziom trudności', 'Barbarzyńcy',
  'Warunki zwycięstwa', 'Chatki z nagrodami',
];
/** Kolejność okna zaawansowanych (13 pozycji, bez duplikatów z siatką). */
const ADV_ORDER = [
  'Zasięg ruchu', 'Limit miast zakładanych (baza)', 'Bitwy',
  'Wymagaj rozpatrzenia ofert handlowych przed końcem tury', 'Wzrost ludności',
  'Koszty budynków', 'Koszty jednostek', 'Jakość grafiki mapy', 'Surowce na mapie',
  'Rzeki', 'Pustynie', 'Las', 'Góry i wzgórza',
];

async function main() {
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

  let browser;
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><html><head></head><body></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const launchArgs = { headless: true, args: ['--no-sandbox'] };
  const fallback = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  try { browser = await chromium.launch(launchArgs); }
  catch (_error) { browser = await chromium.launch({ ...launchArgs, executablePath: fallback }); }
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(origin, { waitUntil: 'load' });
    await page.addScriptTag({ path: bundle });
    const enterSettings = async () => {
      await page.locator('.civ-newgame .cta-hero').click();
      await page.locator('.civ-newgame .nav .next').click();
      await page.locator('.civ-newgame .nav .next').click();
      await page.waitForSelector('.civ-newgame .sett-grid');
    };
    const rowOf = (label) => page.locator('.civ-newgame .sett-grid .srow', { has: page.locator('.sl', { hasText: label }) });
    const advRowOf = (label) => page.locator('.civ-newgame .adv-modal .adv-row', { has: page.locator('.adv-lbl', { hasText: label }) });
    await enterSettings();

    // 1. Główna siatka: 12 kart w dokładnej kolejności, 2 kolumny wypełniane rzędami.
    const labels = (await page.locator('.civ-newgame .sett-grid .srow .sl').allTextContents()).map(x => x.trim());
    assert.deepStrictEqual(labels, MAIN_GRID_ORDER, 'main grid shows 12 cards in the agreed left/right order');
    const rects = await page.locator('.civ-newgame .sett-grid .srow').evaluateAll(els => els.map(e => {
      const r = e.getBoundingClientRect(); return { x: r.x, y: r.y };
    }));
    for (let r = 0; r < 6; r++) {
      assert(Math.abs(rects[2 * r].y - rects[2 * r + 1].y) < 1, `grid row ${r + 1}: left and right cards aligned`);
      assert(rects[2 * r].x < rects[2 * r + 1].x, `grid row ${r + 1}: left card is left of right card`);
    }
    assert.strictEqual(await rowOf('Wymagaj rozpatrzenia ofert handlowych przed końcem tury').count(), 0, 'deals_end_turn_gate absent from main grid');

    // 2. Ikony: pozycje bez dedykowanego SVG mają glif (nie wspólną ikonę Trudności).
    const glyphOf = async (label) => (await rowOf(label).locator('.srow-ic').innerText()).trim();
    assert.strictEqual(await glyphOf('Udział lądu na mapie'), 'Ld', 'land share uses its own glyph');
    assert.strictEqual(await glyphOf('Barbarzyńcy'), 'Ba', 'barbarians uses its own glyph');
    assert.strictEqual(await glyphOf('Warunki zwycięstwa'), 'Zw', 'victory conditions uses its own glyph');
    assert.strictEqual(await glyphOf('Trudność miast-państw'), 'TM', 'city-state difficulty uses its own glyph');
    assert.strictEqual(await glyphOf('Chatki z nagrodami'), 'Ch', 'village rewards uses its own glyph');

    // 3. Okno zaawansowane: 13 pozycji w dokładnej kolejności, bez duplikatów z siatką.
    await page.locator('.civ-newgame .btn-adv').click();
    await page.waitForSelector('.civ-newgame .adv-overlay.open');
    const advLabels = (await page.locator('.civ-newgame .adv-modal .adv-lbl').allTextContents()).map(x => x.trim());
    assert.deepStrictEqual(advLabels, ADV_ORDER, 'advanced window lists 13 options in the agreed order');
    for (const l of advLabels) assert(!MAIN_GRID_ORDER.includes(l), `no duplicate "${l}" between grid and advanced`);
    await page.locator('.civ-newgame .adv-close').click();

    // 4. Zmiana wartości w nowych kartach (siatka).
    const landRow = rowOf('Udział lądu na mapie');
    await landRow.locator('.arr').nth(1).click();
    const selectedLand = (await landRow.locator('.sv').innerText()).trim();
    const cityStateRow = rowOf('Trudność miast-państw');
    await cityStateRow.locator('.arr').nth(1).click();
    const selectedCityState = (await cityStateRow.locator('.sv').innerText()).trim();
    const warRow = rowOf('Wojna epoki');
    assert.strictEqual((await warRow.locator('.sv').innerText()).trim(), 'Włączona', 'epoch-war participation keeps its default');
    await warRow.locator('.arr').nth(1).click();
    const selectedWar = (await warRow.locator('.sv').innerText()).trim();
    const barbRow = rowOf('Barbarzyńcy');
    await barbRow.locator('.arr').nth(0).click();
    const selectedBarb = (await barbRow.locator('.sv').innerText()).trim();
    const victoryRow = rowOf('Warunki zwycięstwa');
    await victoryRow.locator('.arr').nth(0).click();
    await victoryRow.locator('.arr').nth(0).click();
    const selectedVictory = (await victoryRow.locator('.sv').innerText()).trim();
    const villageRow = rowOf('Chatki z nagrodami');
    await villageRow.locator('.arr').nth(1).click();
    const selectedVillage = (await villageRow.locator('.sv').innerText()).trim();
    const dealsRowAdv = advRowOf('Wymagaj rozpatrzenia ofert handlowych przed końcem tury');
    await page.locator('.civ-newgame .btn-adv').click();
    await page.waitForSelector('.civ-newgame .adv-overlay.open');
    assert.strictEqual((await dealsRowAdv.locator('.sv').innerText()).trim(), 'Włączona', 'deals gate keeps its default in advanced window');
    await dealsRowAdv.locator('.arr').nth(1).click();
    const selectedDeal = (await dealsRowAdv.locator('.sv').innerText()).trim();
    assert.strictEqual(selectedDeal, 'Wyłączona', 'deals gate is changeable in advanced window');
    const battleRow = advRowOf('Bitwy');
    await battleRow.locator('.arr').nth(1).click();
    const selectedBattleMode = (await battleRow.locator('.sv').innerText()).trim();
    await page.locator('.civ-newgame .adv-close').click();

    // 5. Zamknij/otwórz kreator — wartości przetrwają (preferencje).
    await page.evaluate(() => window.__closeWizard());
    await page.evaluate(() => window.__openWizard());
    await enterSettings();
    assert.strictEqual((await rowOf('Udział lądu na mapie').locator('.sv').innerText()).trim(), selectedLand, 'land-share choice survives reopening');
    assert.strictEqual((await rowOf('Trudność miast-państw').locator('.sv').innerText()).trim(), selectedCityState, 'city-state difficulty survives reopening');
    assert.strictEqual((await rowOf('Wojna epoki').locator('.sv').innerText()).trim(), selectedWar, 'epoch-war toggle survives reopening');
    assert.strictEqual((await rowOf('Barbarzyńcy').locator('.sv').innerText()).trim(), selectedBarb, 'barbarians survive reopening');
    assert.strictEqual((await rowOf('Warunki zwycięstwa').locator('.sv').innerText()).trim(), selectedVictory, 'victory mode survives reopening');
    assert.strictEqual((await rowOf('Chatki z nagrodami').locator('.sv').innerText()).trim(), selectedVillage, 'village rewards survive reopening');
    await page.locator('.civ-newgame .btn-adv').click();
    await page.waitForSelector('.civ-newgame .adv-overlay.open');
    assert.strictEqual((await advRowOf('Wymagaj rozpatrzenia ofert handlowych przed końcem tury').locator('.sv').innerText()).trim(), selectedDeal, 'deals gate survives reopening');
    assert.strictEqual((await advRowOf('Bitwy').locator('.sv').innerText()).trim(), selectedBattleMode, 'battle mode survives reopening');
    await page.locator('.civ-newgame .adv-close').click();

    // 6. Parametry startu.
    await page.locator('.civ-newgame .nav .next').click();
    const params = await page.evaluate(() => window.__params);
    assert.strictEqual(params.landFractionPercent, Number.parseInt(selectedLand, 10), 'selected land percentage reaches game-start params');
    assert.strictEqual(params.dealsEndTurnGate, false, 'deals gate value reaches game-start params');
    assert.strictEqual(params.playerEpochWarEnabled, false, 'epoch-war toggle reaches game-start params');
    assert.strictEqual(params.villageRewardsEnabled, selectedVillage === 'Włączona', 'village rewards reach game-start params');
    assert.strictEqual(params.advanced.cityStateDifficultyOverride, 'hard', 'city-state difficulty reaches game-start params');
    assert.strictEqual(params.advanced.barbariansLevel, 'latwy', 'barbarians level reaches game-start params');
    assert.strictEqual(params.advanced.victoryMode, 'moc', 'victory mode reaches game-start params');
    assert.strictEqual(params.advanced.battleAlwaysManual, true, 'selected battle mode reaches game-start params');
    console.log('newgame-settings-layout-reposition-test: PASS — 12-card grid order, 13-row advanced order, persistence and game-start params verified');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(TMP, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
