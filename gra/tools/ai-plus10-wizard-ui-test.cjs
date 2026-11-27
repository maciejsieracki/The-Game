'use strict';

/**
 * ai-plus10-wizard-ui-test.cjs -- R-WEB-CULT-REL-AI-PLUS10-Q1 (runda 3, zarzut Evaluatora nr 1).
 * Prawdziwy Chromium (headless) na kreatorze nowej gry:
 *   1. zaawansowane okno ma DWA selektory „Kultura i religia”: „— dla gracza” i „— dla komputera (AI)”;
 *   2. kombinacja: gracz Duży wpływ (trudny), komputer Mały wpływ (łatwy) — wybór zapisuje się w oknie
 *      (zamknięcie i ponowne otwarcie) i trafia do parametrów startu (`advanced.kulturaReligiaLevel` /
 *      `advanced.kulturaReligiaLevelAI`);
 *   3. opisy (hint) obu selektorów pokazują tabelę po epokach (minus/plus), a nie stary model „bez plusów”.
 * Zrzut kreatora (PNG) zapisywany do ścieżki z env SCREENSHOT, jeśli ustawiona.
 *
 * Odczyt wartości D/G w ŻYWEJ grze (silnik) jest pokryty przez ai-plus10-matrix-test.cjs (macierz 3×3)
 * na poziomie funkcji silnika; ten test pokrywa wiązanie UI → parametry startu.
 *
 * Run (z gra/): node tools/ai-plus10-wizard-ui-test.cjs
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));

const GRA = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(process.env.GARRISON_TMP || os.tmpdir(), 'ai-plus10-ui-'));

const LBL_PLAYER = 'Kultura i religia — dla gracza';
const LBL_AI = 'Kultura i religia — dla komputera (AI)';

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
  const origin = `http://127.0.0.1:${server.address().port}`;
  const launchArgs = { headless: true, args: ['--no-sandbox'] };
  const fallback = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/pw-browsers/chromium';
  try { browser = await chromium.launch(launchArgs); }
  catch (_error) { browser = await chromium.launch({ ...launchArgs, executablePath: fallback }); }
  let pass = 0;
  const ok = (name) => { pass++; console.log(`ok - ${name}`); };
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(origin, { waitUntil: 'load' });
    await page.addScriptTag({ path: bundle });
    await page.locator('.civ-newgame .cta-hero').click();
    await page.locator('.civ-newgame .nav .next').click();
    await page.locator('.civ-newgame .nav .next').click();
    await page.waitForSelector('.civ-newgame .sett-grid');
    await page.locator('.civ-newgame .btn-adv').click();
    await page.waitForSelector('.civ-newgame .adv-overlay.open');

    const advRowOf = (label) => page.locator('.civ-newgame .adv-modal .adv-row', { has: page.locator('.adv-lbl', { hasText: label }) });
    const rowP = advRowOf(LBL_PLAYER);
    const rowA = advRowOf(LBL_AI);
    assert.strictEqual(await rowP.count(), 1, 'okno zaawansowane: jeden selektor „dla gracza”');
    assert.strictEqual(await rowA.count(), 1, 'okno zaawansowane: jeden selektor „dla komputera (AI)”');
    ok('dwa selektory „Kultura i religia” (gracz i komputer) w oknie zaawansowanym');

    // Wartości domyślne: oba „Mały wpływ (łatwy)”.
    assert.strictEqual((await rowP.locator('.sv').innerText()).trim(), 'Mały wpływ (łatwy)', 'domyślnie gracz: łatwy');
    assert.strictEqual((await rowA.locator('.sv').innerText()).trim(), 'Mały wpływ (łatwy)', 'domyślnie AI: łatwy');
    ok('domyślnie oba selektory: Mały wpływ (łatwy)');

    // Opisy (hint): tabela po epokach, bez starego „bez plusów”.
    const hintP = (await rowP.locator('.ng-info').first().getAttribute('title')) || '';
    const hintA = (await rowA.locator('.ng-info').first().getAttribute('title')) || '';
    assert.ok(!/bez plusów/.test(hintP), 'opis gracza nie zawiera starego „bez plusów”');
    assert.ok(/od −33 do \+13/.test(hintP), 'opis gracza podaje zakres epoki 3 dla trudnego (−33…+13)');
    assert.ok(/\+23/.test(hintA), 'opis AI podaje plus +23 w epoce 3');
    ok('opisy: tabela po epokach (bez starego „bez plusów”)');

    // Kombinacja: gracz Duży wpływ (trudny), komputer Mały wpływ (łatwy).
    await rowP.locator('.arr').nth(1).click();
    await rowP.locator('.arr').nth(1).click();
    assert.strictEqual((await rowP.locator('.sv').innerText()).trim(), 'Duży wpływ (trudny)', 'gracz: Duży wpływ');
    assert.strictEqual((await rowA.locator('.sv').innerText()).trim(), 'Mały wpływ (łatwy)', 'komputer pozostaje: Mały wpływ');
    ok('wybór: gracz Duży wpływ (trudny), komputer Mały wpływ (łatwy)');

    // Zapis: zamknięcie i ponowne otwarcie okna zachowuje oba wybory.
    await page.locator('.civ-newgame .adv-close').click();
    await page.locator('.civ-newgame .btn-adv').click();
    await page.waitForSelector('.civ-newgame .adv-overlay.open');
    assert.strictEqual((await advRowOf(LBL_PLAYER).locator('.sv').innerText()).trim(), 'Duży wpływ (trudny)', 'po ponownym otwarciu: gracz trudny');
    assert.strictEqual((await advRowOf(LBL_AI).locator('.sv').innerText()).trim(), 'Mały wpływ (łatwy)', 'po ponownym otwarciu: AI łatwy');
    ok('zapis w oknie: oba wybory przeżywają ponowne otwarcie');

    if (process.env.SCREENSHOT) {
      await page.screenshot({ path: process.env.SCREENSHOT, fullPage: false });
      console.log(`screenshot: ${process.env.SCREENSHOT}`);
    }
    await page.locator('.civ-newgame .adv-close').click();

    // Parametry startu.
    await page.locator('.civ-newgame .nav .next').click();
    const params = await page.evaluate(() => window.__params);
    assert.strictEqual(params.advanced.kulturaReligiaLevel, 'trudny', 'parametr startu: gracz trudny');
    assert.strictEqual(params.advanced.kulturaReligiaLevelAI, 'latwy', 'parametr startu: AI łatwy');
    ok('parametry startu: kulturaReligiaLevel=trudny, kulturaReligiaLevelAI=latwy');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(TMP, { recursive: true, force: true });
  }
  console.log(`ai-plus10-wizard-ui-test: ${pass} pass / 0 fail`);
}

main().catch(error => { console.error(error); console.log('ai-plus10-wizard-ui-test: FAIL'); process.exitCode = 1; });
