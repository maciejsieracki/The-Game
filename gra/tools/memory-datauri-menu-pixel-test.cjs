'use strict';
/**
 * memory-datauri-menu-pixel-test.cjs — R-WEB-MEMORY-DATA-URI-DUPLICATES-Q1.
 *
 * Menu główne (obraz tła z hero-menu.png) w dwóch buildach produkcyjnych — PRZED (obraz jako data: URI w JS)
 * i PO (obraz jako blob: z elementu danych) — zrzut piksel w piksel (Chromium headless, reducedMotion).
 *   M1 — zrzut menu: 0 pikseli różnych (dowolny kanał, próg 0);
 *   M2 — obraz menu wczytany w obu buildach z tymi samymi wymiarami naturalnymi;
 *   M3 — brak błędów konsoli/strony w obu buildach.
 *
 *   node tools/memory-datauri-menu-pixel-test.cjs --a <dist PRZED> --b <dist PO> [--shot <prefix .png>]
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const argv = process.argv;
const opt = (n) => (argv.indexOf('--' + n) !== -1 ? argv[argv.indexOf('--' + n) + 1] : null);
const A = opt('a'); const B = opt('b'); const SHOT = opt('shot');
if (!A || !B) { console.error('podaj --a <dist> --b <dist>'); process.exit(2); }
const CHROME = '/opt/pw-browsers/chromium';
let pass = 0; let fail = 0;
const ok = (label, cond, detail) => {
  if (cond) pass++; else fail++;
  console.log((cond ? '  OK  ' : ' FAIL ') + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
};

async function shot(browser, dist) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  await page.goto('file://' + path.join(path.resolve(dist), 'index.html'), { waitUntil: 'load', timeout: 180000 });
  await page.waitForSelector('.civ-menu', { timeout: 180000 });
  await page.waitForFunction(() => { const i = document.querySelector('.civ-menu img'); return !!i && i.complete && i.naturalWidth > 0; }, undefined, { timeout: 60000 });
  // wyłącz animacje/przejścia CSS całkowicie, by zrzut był stabilny
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  await page.waitForTimeout(1500);
  const img = await page.evaluate(() => { const i = document.querySelector('.civ-menu img'); return { scheme: i.src.split(':')[0], w: i.naturalWidth, h: i.naturalHeight }; });
  const buf = await page.screenshot({ fullPage: false });
  await ctx.close();
  return { png: PNG.sync.read(buf), buf, img, errors };
}

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({
    headless: true, executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const a = await shot(browser, A);
    const b = await shot(browser, B);
    if (SHOT) { fs.writeFileSync(SHOT + '-a.png', a.buf); fs.writeFileSync(SHOT + '-b.png', b.buf); }
    let diff = 0; let maxd = 0;
    const n = a.png.width * a.png.height;
    if (a.png.width === b.png.width && a.png.height === b.png.height) {
      for (let i = 0; i < a.png.data.length; i += 4) {
        let d = 0;
        for (let k = 0; k < 4; k++) d = Math.max(d, Math.abs(a.png.data[i + k] - b.png.data[i + k]));
        if (d > 0) diff++;
        if (d > maxd) maxd = d;
      }
    } else diff = -1;
    ok('M1 zrzut menu PRZED == PO (0 pikseli różnych)', diff === 0, { n, diff, maxd, a: [a.png.width, a.png.height], b: [b.png.width, b.png.height] });
    ok('M2 obraz menu wczytany w obu, te same wymiary', a.img.w > 0 && a.img.w === b.img.w && a.img.h === b.img.h, { a: a.img, b: b.img });
    ok('M3 brak błędów konsoli/strony', a.errors.length === 0 && b.errors.length === 0, { a: a.errors, b: b.errors });
  } catch (e) {
    ok('RUN bez wyjątku', false, String((e && e.stack) || e).slice(0, 400));
  } finally { await browser.close().catch(() => {}); }
  console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})();
