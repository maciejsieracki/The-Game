'use strict';

/** Browser regression for truthful new-game battle-mode labels and summary. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const GRA = path.resolve(__dirname, '..');
const OUT = path.join(GRA, 'dist-battle-mode-choice-labels-test');

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  let server;
  let browser;
  try {
    execFileSync(process.execPath, ['./node_modules/vite/bin/vite.js', 'build', '--outDir', OUT, '--emptyOutDir'], {
      cwd: GRA, stdio: 'pipe',
    });
    server = http.createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
      const file = path.resolve(OUT, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (!file.startsWith(OUT + path.sep) && file !== path.join(OUT, 'index.html')) {
        res.writeHead(403).end(); return;
      }
      fs.createReadStream(file).on('error', () => res.writeHead(404).end()).pipe(res);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    } catch (_) {
      browser = await chromium.launch({
        headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
        args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
      });
    }
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForSelector('.civ-menu .mbtn.primary', { timeout: 60000 });
    await page.locator('.civ-menu .mbtn.primary').click();
    await page.locator('.civ-newgame .cta-hero').click();
    await page.locator('.civ-newgame .nav .nb.next').click(); // epoch -> civ
    await page.locator('.civ-newgame .nav .nb.next').click(); // civ -> settings
    await page.waitForSelector('.civ-newgame .sett-layout');
    await page.locator('.civ-newgame .sett-actions .btn-adv').click();

    const row = page.locator('.adv-modal .adv-row').filter({ has: page.locator('.adv-lbl', { hasText: 'Bitwy' }) });
    assert.equal(await row.count(), 1, 'one battle setting is present');
    const value = row.locator('.sv');
    const info = row.locator('.ng-info');
    // Domyślna po R-WEB-NEWGAME-DEFAULTS-Q1: battleAlwaysManual=true (newGameFlow.ts DEFAULT_ADVANCED ~l.250),
    // więc etykieta startowa to „Bitwa ręczna i automatyczna" (dawniej „Bitwa automatyczna").
    assert.equal((await value.textContent()).trim(), 'Bitwa ręczna i automatyczna', 'default is labelled as manual-enabled');
    assert.match(await info.getAttribute('title'), /Bitwa ręczna i automatyczna[\s\S]*wybierasz[\s\S]*automatycznie/, 'help distinguishes both modes');
    const fits = await value.evaluate(el => el.scrollWidth <= el.clientWidth + 1
      && el.parentElement.scrollWidth <= el.parentElement.clientWidth + 1);
    assert.equal(fits, true, 'longer label fits the settings control without horizontal overflow');

    await row.locator('button.arr').nth(1).click();
    assert.equal((await value.textContent()).trim(), 'Bitwa automatyczna', 'choice cycles to auto-only');
    await row.locator('button.arr').nth(1).click();
    assert.equal((await value.textContent()).trim(), 'Bitwa ręczna i automatyczna', 'choice cycles back to manual-enabled');
    await row.locator('button.arr').nth(1).click();
    assert.equal((await value.textContent()).trim(), 'Bitwa automatyczna', 'manual-enabled choice can be selected again as auto-only');

    await page.locator('.adv-modal .adv-close').click();
    const source = fs.readFileSync(path.join(GRA, 'src/ui/newGameFlow.ts'), 'utf8');
    assert.match(source, /\['Bitwy', p\.advanced\.battleAlwaysManual \? 'Bitwa ręczna i automatyczna' : 'Bitwa automatyczna'\]/,
      'start summary maps each selection to its truthful label');
    assert.match(source, /hint: 'Bitwa automatyczna[\s\S]*Bitwa ręczna i automatyczna[\s\S]*przed każdą bitwą wybierasz/,
      'help explains the per-battle choice');
    console.log('battle-mode-choice-labels-test: PASS — both labels, help, selection and start summary');
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    fs.rmSync(OUT, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
