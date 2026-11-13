const { chromium } = require('/home/user/The-Game/.claude/worktrees/wf_37a45ada-872-3/gra/node_modules/playwright');
(async () => {
  const [file, png] = process.argv.slice(2);
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1000, height: 420 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file://' + file);
  await page.waitForFunction(() => window.__done === true, null, { timeout: 90000 });
  await page.waitForTimeout(800);
  const ring = await page.evaluate(() => window.__ring);
  await page.locator('canvas').first().screenshot({ path: png });
  console.log(JSON.stringify(ring));
  console.log('errors:', JSON.stringify(errs));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
