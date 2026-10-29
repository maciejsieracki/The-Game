'use strict';
/**
 * End-to-end mount regression against the actual Robocza HTML page. The game
 * applies UI zoom by transforming body; this loads that production page, sets
 * the persisted 150% setting, then mounts the current production panel module
 * into the live document. This catches fixed-position overlays accidentally
 * mounted under the transformed body (which isolated fixture tests miss).
 */
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));
const { PNG } = require(path.resolve(__dirname, '..', 'node_modules', 'pngjs'));

const GRA = path.resolve(__dirname, '..');
const REPO = path.resolve(GRA, '..');
const GAME_HTML = path.join(REPO, 'gra-robocza', 'Gra-ROBOCZA.html');
const TMPDIR = fs.mkdtempSync(path.join(os.tmpdir(), 'army-merge-production-mount-'));
const BUNDLE = path.join(TMPDIR, 'panel.cjs');
const STUB = path.join(TMPDIR, 'brandAssets-stub.ts');
let pass = 0;
let fail = 0;

function check(name, condition, detail) {
  if (condition) { pass++; console.log('PASS:', name); }
  else { fail++; console.log('FAIL:', name, detail === undefined ? '' : JSON.stringify(detail)); }
}

async function main() {
  if (!fs.existsSync(GAME_HTML)) throw new Error('Missing production Robocza HTML: ' + GAME_HTML);
  fs.writeFileSync(STUB, 'export function unitIconSvg() { return ""; }\n', 'utf8');
  await esbuild.build({
    stdin: {
      contents: "import {showArmyMergePanel} from './src/ui/armyMergePanel.ts';"
        + 'window.__showMergePanel = showArmyMergePanel;',
      resolveDir: GRA,
      sourcefile: 'army-merge-production-mount-entry.ts',
      loader: 'ts',
    },
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: BUNDLE,
    plugins: [{
      name: 'brand-assets-test-stub',
      setup(build) {
        build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB }));
      },
    }],
    logLevel: 'silent',
  });

  const server = http.createServer((req, res) => {
    if (req.url !== '/' && req.url !== '/Gra-ROBOCZA.html') {
      res.writeHead(404).end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(GAME_HTML).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  } catch (_error) {
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium';
    browser = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox'] });
  }
  const page = await browser.newPage({ viewport: { width: 600, height: 413 }, deviceScaleFactor: 1.5 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  try {
    await page.addInitScript(() => localStorage.setItem('civ-ui-zoom-v1', '1.5'));
    await page.goto(`http://127.0.0.1:${address.port}/Gra-ROBOCZA.html`, {
      waitUntil: 'domcontentloaded', timeout: 60000,
    });
    await page.waitForFunction(() => getComputedStyle(document.body).transform === 'matrix(1.5, 0, 0, 1.5, 0, 0)', null, { timeout: 20000 });
    await page.addScriptTag({ path: BUNDLE });
    const game = await page.evaluate(() => ({
      transform: getComputedStyle(document.body).transform,
      bodyWidth: document.body.getBoundingClientRect().width,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
    }));
    check('production Robocza uruchamia rzeczywisty body zoom 150%',
      game.transform === 'matrix(1.5, 0, 0, 1.5, 0, 0)' && game.bodyWidth <= game.viewport.width + 1
        && game.viewport.width === 600 && game.viewport.height === 413 && game.viewport.dpr === 1.5,
      game);

    await page.evaluate(() => {
      const existing = Array.from({ length: 88 }, (_, i) => ({
        id: `existing-${i + 1}`, name: `Oddział ${i + 1}`, ruchLeft: i % 13, ruchMax: 13,
      }));
      window.__mergeCalls = { merge: 0, separate: 0 };
      window.__showMergePanel({
        hexLabel: '(67,55)', existing,
        arriving: { id: 'arriving', name: 'Nowa jednostka', ruchLeft: 12, ruchMax: 18 },
        arrivingCount: 1,
        onMerge: () => { window.__mergeCalls.merge++; },
        onSeparate: () => { window.__mergeCalls.separate++; },
      });
    });
    await page.waitForTimeout(350);
    const geometry = await page.evaluate(() => {
      const box = document.querySelector('.civ-amp')?.getBoundingClientRect();
      const foot = document.querySelector('.civ-amp-foot')?.getBoundingClientRect();
      const roster = document.querySelector('.civ-amp-body');
      const thumb = document.querySelector('.civ-amp-scrollbar');
      return {
        box: box && { top: box.top, bottom: box.bottom, left: box.left, right: box.right },
        foot: foot && { top: foot.top, bottom: foot.bottom },
        roster: roster && { top: roster.getBoundingClientRect().top, client: roster.clientHeight, height: roster.scrollHeight },
        thumb: thumb && { disabled: thumb.disabled, visible: thumb.getBoundingClientRect().width > 0 },
        overlayParent: document.querySelector('.civ-amp-overlay')?.parentElement?.tagName,
        document: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
        rowCount: document.querySelectorAll('.civ-amp-row').length,
        buttons: [...document.querySelectorAll('.civ-amp-foot button')].map((button) => {
          const r = button.getBoundingClientRect();
          return { text: button.textContent.trim(), top: r.top, bottom: r.bottom, visible: r.top >= 0 && r.bottom <= innerHeight };
        }),
      };
    });
    check('panel w prawdziwym dokumencie Roboczej jest portalem do HTML poza transformowanym body',
      geometry.overlayParent === 'HTML', geometry);
    check('88 oddziałów: modal ma co najmniej 24 px marginesu na ekranie 150%',
      !!geometry.box && geometry.box.top >= 24 && 413 - geometry.box.bottom >= 24, geometry.box);
    check('88 oddziałów: strona nie dostaje zewnętrznego overflow',
      geometry.document.width <= 600 && geometry.document.height <= 413, geometry.document);
    check('CTA pozostają w kadrze, a roster ma 89 wierszy i aktywny przewijany suwak',
      geometry.rowCount === 89 && geometry.buttons.length === 2 && geometry.buttons.every((button) => button.visible)
        && geometry.roster.height > geometry.roster.client && geometry.thumb.visible && !geometry.thumb.disabled,
      geometry);

    await page.locator('.civ-amp-scrollbar').fill('1000');
    await page.waitForTimeout(40);
    const endReached = await page.evaluate(() => {
      const roster = document.querySelector('.civ-amp-body');
      const rows = [...document.querySelectorAll('.civ-amp-body .civ-amp-row')];
      const last = rows[rows.length - 1]?.getBoundingClientRect();
      const body = roster?.getBoundingClientRect();
      return !!last && !!body && last.bottom <= body.bottom + 1
        && roster.scrollTop >= roster.scrollHeight - roster.clientHeight - 1;
    });
    check('suwak na stronie Roboczej przewija listę do ostatniego oddziału', endReached);

    const merge = page.locator('[data-act="merge"]');
    await merge.click();
    check('klik „Połącz armie” działa na stronie Roboczej przy 88 oddziałach',
      await page.evaluate(() => window.__mergeCalls.merge === 1 && !document.querySelector('.civ-amp-overlay')));

    await page.evaluate(() => {
      window.__showMergePanel({
        hexLabel: '(67,55)', existing: [{ id: 'one', name: 'Oddział' }],
        arriving: { id: 'in', name: 'Przybywa' },
        onMerge: () => { window.__mergeCalls.merge++; },
        onSeparate: () => { window.__mergeCalls.separate++; },
      });
    });
    await page.locator('[data-act="sep"]').click();
    check('klik „Zostaw osobno” działa na stronie Roboczej',
      await page.evaluate(() => window.__mergeCalls.separate === 1 && !document.querySelector('.civ-amp-overlay')));

    const screenshotPath = process.env.ARMY_MERGE_PRODUCTION_SCREENSHOT
      || path.join(REPO, 'dyspozycje/autobot/runs/R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1/06-production-robocza-150-percent.png');
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    await page.evaluate(() => {
      const existing = Array.from({ length: 88 }, (_, i) => ({ id: `unit-${i}`, name: `Oddział ${i + 1}` }));
      window.__showMergePanel({ hexLabel: '(67,55)', existing, arriving: { id: 'last', name: 'Przybywa' }, onMerge() {}, onSeparate() {} });
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: screenshotPath, scale: 'device' });
    console.log('SCREENSHOT:', screenshotPath);
    check('production page bez błędów JavaScript', errors.length === 0, errors);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(TMPDIR, { recursive: true, force: true });
  }

  console.log(`\n[army-merge-panel-production-mount] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exit(1); });
