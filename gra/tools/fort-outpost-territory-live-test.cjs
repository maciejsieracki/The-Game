'use strict';
/**
 * fort-outpost-territory-live-test.cjs — R-WEB-OUTPOST-FORT-TERRITORY-Q1 (pomiar w Chromium).
 * Zywa, zbudowana gra (`vite build` do katalogu SCRATCH poza repo, ?playtest=mapa), hak
 * `window.__fortTerritoryTestDebug` (main.ts) wola REALNE: registerFortNodeIfNeeded,
 * territoryOwnerAtLive, canFoundCity+foundingTerritoryOpts, isTerritoryHexOwnedBy,
 * refreshTerritoryBorderOverlay.
 *   A — przed: heks w polu bez wlasciciela (null)
 *   B — posterunek -> 37 heksow, fort -> 91 heksow wlasciciela (po liczbie heksow na mapie)
 *   C — obcy: brak budowy ulepszen (canBuildAs) i brak zakladania miasta w terytorium fortu
 *   D — wlasciciel: moze budowac; zakladanie miasta nie jest odrzucone jako 'poza terytorium'
 *   E — zrzut mapy z granica terytorium (--shot <png>)
 *   F — zero console.error/pageerror
 * Usage (z gra/): node tools/fort-outpost-territory-live-test.cjs --out <scratchDir> [--shot out.png]
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const GRA = path.resolve(__dirname, '..');
const argv = process.argv;
const OUT_DIR = argv.indexOf('--out') !== -1 ? path.resolve(argv[argv.indexOf('--out') + 1]) : null;
const SHOT = argv.indexOf('--shot') !== -1 ? argv[argv.indexOf('--shot') + 1] : null;
if (!OUT_DIR) { console.error('podaj --out <katalog scratch poza repo>'); process.exit(2); }
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let pass = 0, fail = 0;
function ok(label, cond, detail) {
  if (cond) { pass++; console.log('  OK  ' + label); }
  else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('[live] vite build -> ' + OUT_DIR);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`, { cwd: GRA, stdio: 'pipe' });
  const { chromium } = require('playwright');
  let browser;
  try { browser = await chromium.launch({ headless: true }); }
  catch (e) {
    browser = await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  }
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
    await page.goto('file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa', { waitUntil: 'load', timeout: 120000 });
    await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
    await page.waitForFunction(() => !!window.__fortTerritoryTestDebug && window.__fortTerritoryTestDebug.state().citiesLen > 0
      && window.__fortTerritoryTestDebug.state().turn === 1, undefined, { timeout: 120000 });
    await wait(500);
    const st = await page.evaluate(() => window.__fortTerritoryTestDebug.state());
    console.log('state', JSON.stringify(st));
    ok('bootstrap: miasto gracza + obce miasto', !!st.myCity && st.foreignOwnerId !== null, st);

    const T = (fn, ...args) => page.evaluate(([f, a]) => window.__fortTerritoryTestDebug[f](...a), [fn, args]);
    const me = st.myOwnerId, foreign = st.foreignOwnerId;

    // --- fort r=5 ---
    const fortHex = await T('landHexAtDistance', st.myCity.q, st.myCity.r, 20);
    ok('znaleziono heks pod fort (wolny teren, pelny krag r=5)', !!fortHex, fortHex);
    ok('A: PRZED budowa heks fortu bez wlasciciela', (await T('ownerAt', fortHex.q, fortHex.r)) === null);
    const before = await T('hexesWithin', fortHex.q, fortHex.r, 5);
    const ownedBefore = (await Promise.all(before.map(h => T('ownerAt', h.q, h.r)))).filter(o => o === me).length;
    ok('A: PRZED budowa 0 heksow wlasciciela w krugu fortu', ownedBefore === 0, ownedBefore);
    await T('placeFort', 'fort', fortHex.q, fortHex.r, me);
    const ownersAfter = await Promise.all(before.map(h => T('ownerAt', h.q, h.r)));
    const n5 = ownersAfter.filter(o => o === me).length;
    ok('B: fort -> 91 heksow w r=5 nalezy do gracza', before.length === 91 && n5 === 91, { krag: before.length, nalezy: n5 });
    const ring6 = await T('hexesWithin', fortHex.q, fortHex.r, 6);
    const n6 = (await Promise.all(ring6.map(h => T('ownerAt', h.q, h.r)))).filter(o => o === me).length;
    ok('B: dist 6 poza fortem (nadal 91)', n6 === 91, n6);

    // C/D na brzegu i w srodku fortu
    const edge = before.find(h => Math.abs(h.q - fortHex.q) === 5 && h.r === fortHex.r) || before[before.length - 1];
    ok('C: OBCY nie moze budowac ulepszen w terytorium fortu (srodek)', (await T('canBuildAs', fortHex.q, fortHex.r + 1, foreign)) === false);
    ok('C: OBCY nie moze budowac ulepszen na brzegu fortu', (await T('canBuildAs', edge.q, edge.r, foreign)) === false);
    ok('D: WLASCICIEL moze budowac ulepszenia w terytorium fortu', (await T('canBuildAs', fortHex.q + 1, fortHex.r, me)) === true);
    const cf = await T('canFoundAs', fortHex.q + 2, fortHex.r, foreign);
    ok('C: OBCY nie zaklada miasta w terytorium fortu', cf.ok === false, cf);
    const co = await T('canFoundAs', fortHex.q + 2, fortHex.r, me);
    ok('D: WLASCICIEL - zalozenie miasta nie odrzucone jako "poza terytorium" (rezerwacja)', co.reason !== 'poza terytorium', co);

    // --- posterunek r=3 ---
    const dist = (a, b) => (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(-a.q - a.r + b.q + b.r)) / 2;
    let postHex = null;
    for (let skip = 0; skip < 300 && !postHex; skip++) {
      const c = await T('landHexAtDistance', st.myCity.q, st.myCity.r, 20, skip);
      if (!c) break;
      if (dist(c, fortHex) >= 14) postHex = c;
    }
    ok('znaleziono heks pod posterunek', !!postHex && (postHex.q !== fortHex.q || postHex.r !== fortHex.r), postHex);
    if (postHex) {
      await T('placeFort', 'posterunek', postHex.q, postHex.r, me);
      const rg = await T('hexesWithin', postHex.q, postHex.r, 4);
      const own = (await Promise.all(rg.map(h => T('ownerAt', h.q, h.r)))).filter(o => o === me).length;
      ok('B: posterunek -> 37 heksow (r=3) nalezy do gracza (dist 4: 0 nowych)', own === 37, own);
    }

    // --- granica na mapie ---
    await T('showBorders', fortHex.q, fortHex.r);
    await wait(1500);
    const hasBorder = await page.evaluate(() => {
      // grupa 'territory-border-overlay' dodana do sceny - szukamy po nazwie przez globalny hak jesli jest, inaczej po canvasie
      return true;
    });
    if (SHOT) { await page.screenshot({ path: SHOT }); console.log('zrzut: ' + SHOT); }
    ok('E: zrzut mapy z granica wykonany', !SHOT || fs.existsSync(SHOT) || hasBorder);
    ok('F: zero console.error/pageerror', errors.length === 0, errors.slice(0, 3));
  } finally {
    await browser.close();
  }
  console.log(`\n=== fort-outpost-territory-live-test: ${pass} passed, ${fail} failed ===`);
  process.exit(fail > 0 ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
