'use strict';

/** Real Chromium regression for the new-game land-share/diplomacy setting slots. */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));

const GRA = path.resolve(__dirname, '..');
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
    assert(labels.includes('Udział lądu na mapie'), 'land share occupies the former era-war slot in the main settings grid');
    assert(labels.includes('Trudność miast-państw'), 'city-state difficulty remains visible in the main settings grid');
    assert.strictEqual(labels.indexOf('Trudność miast-państw'), 5, 'city-state difficulty follows the city-state count in the main grid');
    assert(!labels.includes('Wojna epoki z udziałem gracza'), 'era-war player toggle is no longer in the visible main grid');
    assert(!labels.includes('Wymagaj rozpatrzenia ofert handlowych przed końcem tury'), 'diplomacy review moved out of its old main-grid slot');
    const landRow = page.locator('.sett-grid .srow', { has: page.locator('.sl', { hasText: 'Udział lądu na mapie' }) });
    const initialLand = (await landRow.locator('.sv').innerText()).trim();
    await landRow.locator('.arr').nth(1).click();
    const selectedLand = (await landRow.locator('.sv').innerText()).trim();
    assert.notStrictEqual(selectedLand, initialLand, 'land share can be selected directly in the main grid');
    const cityStateRow = page.locator('.sett-grid .srow', { has: page.locator('.sl', { hasText: 'Trudność miast-państw' }) });
    await cityStateRow.locator('.arr').nth(1).click();
    const selectedCityStateDifficulty = (await cityStateRow.locator('.sv').innerText()).trim();
    assert.notStrictEqual(selectedCityStateDifficulty, 'Normalny', 'city-state difficulty remains changeable');

    await page.locator('.civ-newgame .btn-adv').click();
    await page.waitForSelector('.civ-newgame .adv-overlay.open');
    let advLabels = await page.locator('.civ-newgame .adv-modal .adv-lbl').allTextContents();
    advLabels = advLabels.map(x => x.trim());
    assert(advLabels.includes('Wymagaj rozpatrzenia ofert handlowych przed końcem tury'), 'diplomacy review occupies the former city-state difficulty slot in advanced settings');
    assert(!advLabels.includes('Trudność miast-państw'), 'city-state difficulty has moved out of advanced settings without being removed');
    assert(!advLabels.includes('Udział lądu na mapie'), 'land share is not duplicated in advanced settings');
    const dealRow = page.locator('.civ-newgame .adv-modal .adv-row', { has: page.locator('.adv-lbl', { hasText: 'Wymagaj rozpatrzenia ofert handlowych przed końcem tury' }) });
    assert.strictEqual((await dealRow.locator('.sv').innerText()).trim(), 'Włączona', 'default diplomacy review remains enabled');
    await dealRow.locator('.arr').nth(1).click();
    assert.strictEqual((await dealRow.locator('.sv').innerText()).trim(), 'Wyłączona', 'diplomacy review value remains changeable');
    const battleRow = page.locator('.civ-newgame .adv-modal .adv-row', { has: page.locator('.adv-lbl', { hasText: 'Bitwy' }) });
    await battleRow.locator('.arr').nth(1).click();
    const selectedBattleMode = (await battleRow.locator('.sv').innerText()).trim();
    assert(selectedBattleMode !== '', 'battle mode remains selectable alongside the relocated settings');
    await page.locator('.civ-newgame .adv-close').click();

    // Close/reopen to verify both changed values persist through the existing preference store.
    await page.evaluate(() => window.__closeWizard());
    await page.evaluate(() => window.__openWizard());
    await enterSettings();
    const reloadedLandRow = page.locator('.sett-grid .srow', { has: page.locator('.sl', { hasText: 'Udział lądu na mapie' }) });
    assert.strictEqual((await reloadedLandRow.locator('.sv').innerText()).trim(), selectedLand, 'land-share choice survives closing and reopening the wizard');
    const reloadedCityState = page.locator('.sett-grid .srow', { has: page.locator('.sl', { hasText: 'Trudność miast-państw' }) });
    assert.strictEqual((await reloadedCityState.locator('.sv').innerText()).trim(), selectedCityStateDifficulty, 'city-state difficulty survives closing and reopening the wizard');
    await page.locator('.civ-newgame .btn-adv').click();
    await page.waitForSelector('.civ-newgame .adv-overlay.open');
    const reloadedDeal = page.locator('.civ-newgame .adv-modal .adv-row', { has: page.locator('.adv-lbl', { hasText: 'Wymagaj rozpatrzenia ofert handlowych przed końcem tury' }) });
    assert.strictEqual((await reloadedDeal.locator('.sv').innerText()).trim(), 'Wyłączona', 'diplomacy setting survives closing and reopening the wizard');
    const reloadedBattle = page.locator('.civ-newgame .adv-modal .adv-row', { has: page.locator('.adv-lbl', { hasText: 'Bitwy' }) });
    assert.strictEqual((await reloadedBattle.locator('.sv').innerText()).trim(), selectedBattleMode, 'battle mode survives alongside relocated-setting preference persistence');
    await page.locator('.civ-newgame .adv-close').click();

    await page.locator('.civ-newgame .nav .next').click();
    const params = await page.evaluate(() => window.__params);
    assert.strictEqual(params.landFractionPercent, Number.parseInt(selectedLand, 10), 'selected land percentage reaches game-start params');
    assert.strictEqual(params.dealsEndTurnGate, false, 'diplomacy gate value reaches game-start params');
    assert.strictEqual(params.advanced.battleAlwaysManual, true, 'selected battle mode reaches game-start params alongside relocated settings');
    console.log('newgame-settings-layout-reposition-test: PASS — Chromium placement, land/diplomacy/battle persistence and game-start params verified');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(TMP, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
