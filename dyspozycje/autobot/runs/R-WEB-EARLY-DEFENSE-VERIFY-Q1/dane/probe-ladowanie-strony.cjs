'use strict';
// Probe: load Gra-LIVE.html and report page errors / __settingsLive presence (no game actions).
const path = require('node:path');
const WT = '/home/user/The-Game/.claude/worktrees/wf_630eee37-cb5-1/gra';
const { chromium } = require(path.join(WT, 'node_modules', 'playwright'));
const { resolveChromePath } = require(path.join(WT, 'tools', '_chrome-path.cjs'));
const html = process.argv[2];
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath(), args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGEERROR', e.message.slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE-ERR', m.text().slice(0, 300)); });
  await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(20000);
  console.log('settingsLive', await page.evaluate(() => !!window.__settingsLive));
  await browser.close();
})().catch(e => { console.log('PROBE-FAIL', e.message.slice(0, 300)); process.exit(1); });
