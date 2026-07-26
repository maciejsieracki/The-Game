'use strict';
/**
 * wpiecie-dispatch-check.cjs — uruchamia .wpiecie-dispatch-check-entry.ts w
 * chromium (units.ts wymaga DOM) i wypisuje wynik sprawdzenia dispatchu.
 * Uruchamiać z katalogu gra/:  node tools/wpiecie-dispatch-check.cjs
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const out = esbuild.buildSync({
  entryPoints: [path.join(ROOT, 'tools', '.wpiecie-dispatch-check-entry.ts')],
  bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
  write: false, absWorkingDir: ROOT,
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, () => '<\\/script');
const tmp = path.join(os.tmpdir(), 'wpiecie-dispatch-check.html');
fs.writeFileSync(tmp, `<!DOCTYPE html><meta charset="utf-8"><body><script>${js}</script></body>`);

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__check, { timeout: 20000 });
  const res = await page.evaluate(() => window.__check());
  await browser.close();
  for (const r of res.rows) console.log(r);
  if (errs.length) console.log('BLEDY STRONY:', errs.join(' | '));
  console.log(res.ok ? '\nDISPATCH OK' : '\nDISPATCH FAIL');
  process.exit(res.ok ? 0 : 1);
})().catch((e) => { console.error('FAIL:', (e && e.stack) || e); process.exit(1); });
