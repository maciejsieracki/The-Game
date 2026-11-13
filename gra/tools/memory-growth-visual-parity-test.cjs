'use strict';
/**
 * memory-growth-visual-parity-test.cjs -- R-WEB-MEMORY-GROWTH-ROOTCAUSE-Q1 (Chromium): ten sam kadr mapy
 * (?playtest=mapa) w dwoch buildach -- PRZED i PO zmianie mergeDecor (indeksowane wierzcholki + zwolnienie kopii CPU)
 * -- oraz posterunek postawiony realnym spawnImprovementMesh. Porownanie pikseli zrzutow (canvas getImageData).
 *   V1 -- kadr startowy: odsetek pikseli rozniacych sie > 8/255 na dowolnym kanale <= prog (animacje wody/jednostek)
 *   V2 -- kadr po postawieniu posterunku: jw.
 * Usage: node tools/memory-growth-visual-parity-test.cjs --a <dist PRZED> --b <dist PO> [--pw <kopia z playwright>] [--shot <prefix>]
 */
const path = require('path');
const fs = require('fs');
const argv = process.argv;
const opt = (n) => (argv.indexOf('--' + n) !== -1 ? argv[argv.indexOf('--' + n) + 1] : null);
const A = opt('a'); const B = opt('b'); const PW = opt('pw'); const SHOT = opt('shot');
const THRESH = Number(opt('thresh') || '0.02');
if (!A || !B) { console.error('podaj --a <dist> --b <dist>'); process.exit(2); }
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
let pass = 0; let fail = 0;
const ok = (label, cond, detail) => { if (cond) { pass++; console.log('  OK  ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); } else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function shots(browser, dist, forcedHex) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.addInitScript(() => { let s = 12345; Math.random = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x80000000; }; });
  await page.goto('file://' + path.join(path.resolve(dist), 'index.html') + '?playtest=mapa', { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__fortTerritoryTestDebug && window.__fortTerritoryTestDebug.state().citiesLen > 0, undefined, { timeout: 180000 });
  await wait(2500);
  const s1 = await page.screenshot({ clip: { x: 300, y: 150, width: 700, height: 450 } });
  const T = (fn, ...args) => page.evaluate(([f, a]) => window.__fortTerritoryTestDebug[f](...a), [fn, args]);
  const st = await T('state');
  // ten sam heks w obu buildach: pierwszy ladowy heks w odl. 2 wg kolejnosci map.hexes (mapa playtestu stala)
  // heks wybiera build PO (nowy hak), build PRZED dostaje ten sam heks (mapa playtestu stala)
  const hex = forcedHex || await page.evaluate((c) => window.__fortTerritoryTestDebug.nearLandHexWithoutImprovement(c.q, c.r, 2), st.myCity);
  if (hex) await T('placeFort', 'posterunek', hex.q, hex.r, st.myOwnerId);
  await wait(2000);
  const s2 = await page.screenshot({ clip: { x: 300, y: 150, width: 700, height: 450 } });
  await page.close();
  return { s1, s2, hex };
}

async function diff(browser, a, b) {
  const page = await browser.newPage();
  const r = await page.evaluate(async ([a64, b64]) => {
    const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = src; });
    const [ia, ib] = await Promise.all([load('data:image/png;base64,' + a64), load('data:image/png;base64,' + b64)]);
    const cv = document.createElement('canvas'); cv.width = ia.width; cv.height = ia.height; const cx = cv.getContext('2d');
    cx.drawImage(ia, 0, 0); const da = cx.getImageData(0, 0, cv.width, cv.height).data;
    cx.clearRect(0, 0, cv.width, cv.height); cx.drawImage(ib, 0, 0); const db = cx.getImageData(0, 0, cv.width, cv.height).data;
    let bad = 0; let any = 0; const n = da.length / 4;
    for (let i = 0; i < da.length; i += 4) {
      const m = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      if (m > 0) any++; if (m > 8) bad++;
    }
    return { n, any, bad, frac: bad / n };
  }, [a.toString('base64'), b.toString('base64')]);
  await page.close();
  return r;
}

(async () => {
  const { chromium } = require(PW ? path.join(path.resolve(PW), 'node_modules', 'playwright') : 'playwright');
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const rb = await shots(browser, B, null); const ra = await shots(browser, A, rb.hex);
    if (SHOT) { fs.writeFileSync(SHOT + '-A1.png', ra.s1); fs.writeFileSync(SHOT + '-B1.png', rb.s1); fs.writeFileSync(SHOT + '-A2.png', ra.s2); fs.writeFileSync(SHOT + '-B2.png', rb.s2); }
    ok('posterunek postawiony na tym samym heksie w obu buildach', !!rb.hex && JSON.stringify(ra.hex) === JSON.stringify(rb.hex), { a: ra.hex, b: rb.hex });
    const d0 = await diff(browser, rb.s1, rb.s2); ok('V0 posterunek jest w kadrze (kadr PO postawieniu rozni sie od startowego)', d0.any > 0, d0);
    const d1 = await diff(browser, ra.s1, rb.s1); ok(`V1 kadr startowy: piksele rozne >8/255 <= ${THRESH * 100}%`, d1.frac <= THRESH, d1);
    const d2 = await diff(browser, ra.s2, rb.s2); ok(`V2 kadr z posterunkiem: piksele rozne >8/255 <= ${THRESH * 100}%`, d2.frac <= THRESH, d2);
  } finally { await browser.close(); }
  console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
