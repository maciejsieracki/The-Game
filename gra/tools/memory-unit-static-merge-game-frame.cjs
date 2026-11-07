'use strict';
/**
 * memory-unit-static-merge-game-frame.cjs -- R-WEB-MEMORY-UNIT-STATIC-MERGE-Q1: PELNA klatka gry (1600x1000, realny
 * bundle vite, `?playtest=mapa`, deterministyczny Math.random) w dwoch buildach: A = przed tematem, B = ze scaleniem.
 * Kadry: K1 start (domyslna kamera), K2 przyblizenie kolkiem myszy (8 krokow) na srodek ekranu (jednostki wieksze).
 * Dla kazdego kadru: liczba pikseli roznych (dowolny kanal > 0) i > 8/255, plus zrzuty A/B/roznica do oceny wzrokowej.
 *   F1 -- K1: rozne > 8/255 <= LIMIT px (domyslnie 120);  F2 -- K2: jw.
 * Usage: node tools/memory-unit-static-merge-game-frame.cjs --a <dist A> --b <dist B> [--shots <katalog>] [--limit 120]
 */
const path = require('path');
const fs = require('fs');
const argv = process.argv;
const opt = (n) => (argv.indexOf('--' + n) !== -1 ? argv[argv.indexOf('--' + n) + 1] : null);
const A = opt('a'); const B = opt('b'); const SHOTS = opt('shots'); const LIMIT = Number(opt('limit') || '120');
if (!A || !B) { console.error('podaj --a <dist> --b <dist>'); process.exit(2); }
const GRA = path.resolve(__dirname, '..');
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
const { PNG } = require(path.join(GRA, 'node_modules', 'pngjs'));
const W = 1600; const H = 1000;
let pass = 0; let fail = 0;
const ok = (label, cond, d) => { if (cond) { pass++; console.log('  OK  ' + label + ' -- ' + JSON.stringify(d)); } else { fail++; console.error(' FAIL ' + label + ' -- ' + JSON.stringify(d)); } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function frames(browser, dist) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.addInitScript(() => { let s = 12345; Math.random = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x80000000; }; });
  await page.goto('file://' + path.join(path.resolve(dist), 'index.html') + '?playtest=mapa', { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__fortTerritoryTestDebug && window.__fortTerritoryTestDebug.state().citiesLen > 0, undefined, { timeout: 180000 });
  await wait(3000);
  const k1 = await page.screenshot();
  await page.mouse.move(W / 2, H / 2);
  for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, -240); await wait(150); }
  await wait(2500);
  const k2 = await page.screenshot();
  await page.close();
  return { k1, k2 };
}

function cmp(a, b, out) {
  const pa = PNG.sync.read(a); const pb = PNG.sync.read(b);
  const d = new PNG({ width: pa.width, height: pa.height });
  let any = 0; let bad = 0; let maxCh = 0;
  for (let i = 0; i < pa.data.length; i += 4) {
    const m = Math.max(Math.abs(pa.data[i] - pb.data[i]), Math.abs(pa.data[i + 1] - pb.data[i + 1]), Math.abs(pa.data[i + 2] - pb.data[i + 2]));
    if (m > 0) any++; if (m > 8) bad++; if (m > maxCh) maxCh = m;
    if (m > 0) { d.data[i] = 255; d.data[i + 1] = 0; d.data[i + 2] = 255; } else { d.data[i] = pb.data[i] >> 2; d.data[i + 1] = pb.data[i + 1] >> 2; d.data[i + 2] = pb.data[i + 2] >> 2; }
    d.data[i + 3] = 255;
  }
  if (out) fs.writeFileSync(out, PNG.sync.write(d));
  return { px: pa.width * pa.height, any, over8: bad, maxChannelDiff: maxCh };
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const fa = await frames(browser, A); const fb = await frames(browser, B);
    if (SHOTS) {
      fs.mkdirSync(SHOTS, { recursive: true });
      fs.writeFileSync(path.join(SHOTS, 'gra-K1-A-przed.png'), fa.k1); fs.writeFileSync(path.join(SHOTS, 'gra-K1-B-po.png'), fb.k1);
      fs.writeFileSync(path.join(SHOTS, 'gra-K2-A-przed.png'), fa.k2); fs.writeFileSync(path.join(SHOTS, 'gra-K2-B-po.png'), fb.k2);
    }
    const d1 = cmp(fa.k1, fb.k1, SHOTS && path.join(SHOTS, 'gra-K1-roznica.png'));
    const d2 = cmp(fa.k2, fb.k2, SHOTS && path.join(SHOTS, 'gra-K2-roznica.png'));
    ok('F1 K1 start: piksele > 8/255 <= ' + LIMIT, d1.over8 <= LIMIT, d1);
    ok('F2 K2 przyblizenie: piksele > 8/255 <= ' + LIMIT, d2.over8 <= LIMIT, d2);
  } finally { await browser.close(); }
  console.log(`\nmemory-unit-static-merge-game-frame: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
