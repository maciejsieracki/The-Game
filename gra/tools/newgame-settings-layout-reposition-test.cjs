'use strict';

/** Real Chromium regression for the new-game land-share/diplomacy setting slots. */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));

const GRA = process.env.GAME_ROOT || path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'newgame-settings-layout-'));

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
  try { browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] }); }
  catch (_error) {
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  }
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
    await enterSettings();

    const labels = await page.locator('.civ-newgame .sett-grid .srow .sl').allTextContents();
    const normalizedLabels = labels.map(x => x.trim());
    assert(normalizedLabels.includes('Udział lądu na mapie'), 'land share occupies the former era-war slot in the main settings grid');
    assert(normalizedLabels.includes('Wymagaj rozpatrzenia ofert handlowych przed końcem tury'), 'diplomacy review occupies the former city-state difficulty slot in the main grid');
    assert.strictEqual(normalizedLabels.indexOf('Wymagaj rozpatrzenia ofert handlowych przed końcem tury'), 5, 'diplomacy review occupies the sixth main-grid slot');
    assert.strictEqual(normalizedLabels.indexOf('Udział lądu na mapie'), 7, 'land share occupies the former last/era-war main-grid slot');
    assert(!normalizedLabels.includes('Trudność miast-państw'), 'city-state difficulty has moved out of the main grid');
    assert(!normalizedLabels.includes('Wojna epoki z udziałem gracza'), 'era-war player toggle is no longer in the visible main grid');
    const landRow = page.locator('.civ-newgame .sett-grid .srow', { has: page.locator('.sl', { hasText: 'Udział lądu na mapie' }) });
    await landRow.locator('.arr').nth(1).click();
    const selectedLand = (await landRow.locator('.sv').innerText()).trim();
    const dealRow = page.locator('.civ-newgame .sett-grid .srow', { has: page.locator('.sl', { hasText: 'Wymagaj rozpatrzenia ofert handlowych przed końcem tury' }) });
    assert.strictEqual((await dealRow.locator('.sv').innerText()).trim(), 'Włączona', 'diplomacy review keeps its default in the main grid');
    await dealRow.locator('.arr').nth(1).click();
    const selectedDeal = (await dealRow.locator('.sv').innerText()).trim();
    assert.strictEqual(selectedDeal, 'Wyłączona', 'diplomacy review is changeable in its new main-grid slot');

    await page.locator('.civ-newgame .btn-adv').click();
    await page.waitForSelector('.civ-newgame .adv-overlay.open');
    let advLabels = await page.locator('.civ-newgame .adv-modal .adv-lbl').allTextContents();
    advLabels = advLabels.map(x => x.trim());
    assert(advLabels.includes('Trudność miast-państw'), 'city-state difficulty remains configurable in Advanced settings');
    assert(advLabels.includes('Wojna epoki z udziałem gracza'), 'epoch-war toggle remains configurable in Advanced settings');
    assert(!advLabels.includes('Wymagaj rozpatrzenia ofert handlowych przed końcem tury'), 'diplomacy review is not duplicated in Advanced settings');
    assert(!advLabels.includes('Udział lądu na mapie'), 'land share is not duplicated in Advanced settings');
    const cityStateRow = page.locator('.civ-newgame .adv-modal .adv-row', { has: page.locator('.adv-lbl', { hasText: 'Trudność miast-państw' }) });
    await cityStateRow.locator('.arr').nth(1).click();
    const selectedCityStateDifficulty = (await cityStateRow.locator('.sv').innerText()).trim();
    assert.strictEqual(selectedCityStateDifficulty, 'Trudny', 'city-state difficulty remains changeable in Advanced settings');
    const warRow = page.locator('.civ-newgame .adv-modal .adv-row', { has: page.locator('.adv-lbl', { hasText: 'Wojna epoki z udziałem gracza' }) });
    assert.strictEqual((await warRow.locator('.sv').innerText()).trim(), 'Włączona', 'epoch-war participation keeps its default');
    await warRow.locator('.arr').nth(1).click();
    assert.strictEqual((await warRow.locator('.sv').innerText()).trim(), 'Wyłączona', 'epoch-war participation is changeable in Advanced settings');
    const battleRow = page.locator('.civ-newgame .adv-modal .adv-row', { has: page.locator('.adv-lbl', { hasText: 'Bitwy' }) });
    await battleRow.locator('.arr').nth(1).click();
    const selectedBattleMode = (await battleRow.locator('.sv').innerText()).trim();
    assert(selectedBattleMode !== '', 'battle mode remains selectable alongside the relocated settings');
    await page.locator('.civ-newgame .adv-close').click();

    // Close/reopen to verify all moved/retained values persist through the preference store.
    await page.evaluate(() => window.__closeWizard());
    await page.evaluate(() => window.__openWizard());
    await enterSettings();
    const reloadedLandRow = page.locator('.civ-newgame .sett-grid .srow', { has: page.locator('.sl', { hasText: 'Udział lądu na mapie' }) });
    assert.strictEqual((await reloadedLandRow.locator('.sv').innerText()).trim(), selectedLand, 'land-share choice survives closing and reopening the wizard');
    const reloadedDealRow = page.locator('.civ-newgame .sett-grid .srow', { has: page.locator('.sl', { hasText: 'Wymagaj rozpatrzenia ofert handlowych przed końcem tury' }) });
    assert.strictEqual((await reloadedDealRow.locator('.sv').innerText()).trim(), selectedDeal, 'diplomacy gate survives closing and reopening the wizard in the main grid');
    await page.locator('.civ-newgame .btn-adv').click();
    await page.waitForSelector('.civ-newgame .adv-overlay.open');
    const reloadedCityState = page.locator('.civ-newgame .adv-modal .adv-row', { has: page.locator('.adv-lbl', { hasText: 'Trudność miast-państw' }) });
    assert.strictEqual((await reloadedCityState.locator('.sv').innerText()).trim(), selectedCityStateDifficulty, 'city-state difficulty survives closing and reopening the wizard');
    const reloadedWar = page.locator('.civ-newgame .adv-modal .adv-row', { has: page.locator('.adv-lbl', { hasText: 'Wojna epoki z udziałem gracza' }) });
    assert.strictEqual((await reloadedWar.locator('.sv').innerText()).trim(), 'Wyłączona', 'epoch-war toggle survives closing and reopening the wizard');
    const reloadedBattle = page.locator('.civ-newgame .adv-modal .adv-row', { has: page.locator('.adv-lbl', { hasText: 'Bitwy' }) });
    assert.strictEqual((await reloadedBattle.locator('.sv').innerText()).trim(), selectedBattleMode, 'battle mode survives alongside relocated-setting preference persistence');
    await page.locator('.civ-newgame .adv-close').click();

    await page.locator('.civ-newgame .nav .next').click();
    const params = await page.evaluate(() => window.__params);
    assert.strictEqual(params.landFractionPercent, Number.parseInt(selectedLand, 10), 'selected land percentage reaches game-start params');
    assert.strictEqual(params.dealsEndTurnGate, false, 'diplomacy gate value reaches game-start params');
    assert.strictEqual(params.playerEpochWarEnabled, false, 'epoch-war toggle reaches game-start params');
    assert.strictEqual(params.advanced.cityStateDifficultyOverride, 'hard', 'city-state difficulty reaches game-start params');
    // Domyślna po R-WEB-NEWGAME-DEFAULTS-Q1 = „Bitwa ręczna i automatyczna" (battleAlwaysManual=true); tu wybrano jedną zmianę,
    // więc oczekiwana wartość wynika z etykiety wybranej w teście (true tylko dla „ręczna i automatyczna").
    const expectedBattleAlwaysManual = selectedBattleMode === 'Bitwa ręczna i automatyczna';
    assert.strictEqual(params.advanced.battleAlwaysManual, expectedBattleAlwaysManual, 'selected battle mode reaches game-start params alongside relocated settings');
    console.log('newgame-settings-layout-reposition-test: PASS — Chromium placement, retained controls, persistence and game-start params verified');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(TMP, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
