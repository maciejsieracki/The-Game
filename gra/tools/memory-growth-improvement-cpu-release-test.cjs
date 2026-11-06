'use strict';
/**
 * memory-growth-improvement-cpu-release-test.cjs -- R-WEB-MEMORY-GROWTH-ROOTCAUSE-Q1 (Chromium, zbudowana gra).
 * Mesh ulepszenia (REALNY spawnImprovementMesh przez hak __fortTerritoryTestDebug.placeFort):
 *   A -- po wyrenderowaniu kopia CPU geometrii jest zwolniona (attribute.array === null), sfera otaczajaca policzona,
 *        mesh w scenie, liczba wierzcholkow > 0
 *   B -- utrata + odzyskanie kontekstu WebGL (WEBGL_lose_context): mesh przebudowany (nowy uuid), znow w scenie,
 *        po ponownym uploadzie znow zwolniony; zero pageerror/console.error po odzyskaniu
 *   C -- zrzuty ekranu przed/po (--shot <prefix>) do recznej oceny
 * Usage (z gra/): node tools/memory-growth-improvement-cpu-release-test.cjs --dist <katalog z index.html poza repo> [--shot /tmp/x]
 *   (dist: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo>` -- NIE `npm run build`)
 */
const path = require('path');
const fs = require('fs');
const argv = process.argv;
const opt = (n) => (argv.indexOf('--' + n) !== -1 ? argv[argv.indexOf('--' + n) + 1] : null);
const DIST = opt('dist') ? path.resolve(opt('dist')) : null;
const SHOT = opt('shot');
const PW = opt('pw');
if (!DIST) { console.error('podaj --dist <katalog z index.html>'); process.exit(2); }
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
let pass = 0; let fail = 0;
function ok(label, cond, detail) {
  if (cond) { pass++; console.log('  OK  ' + label); }
  else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { chromium } = require(PW ? path.join(path.resolve(PW), 'node_modules', 'playwright') : 'playwright');
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
    await page.goto('file://' + path.join(DIST, 'index.html') + '?playtest=mapa', { waitUntil: 'load', timeout: 180000 });
    await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 180000 });
    await page.waitForFunction(() => !!window.__fortTerritoryTestDebug && window.__fortTerritoryTestDebug.state().citiesLen > 0
      && window.__fortTerritoryTestDebug.state().turn === 1, undefined, { timeout: 180000 });
    await wait(800);
    const T = (fn, ...args) => page.evaluate(([f, a]) => window.__fortTerritoryTestDebug[f](...a), [fn, args]);
    const st = await T('state');
    ok('bootstrap: miasto gracza', !!st.myCity, st);
    let hex = null;
    for (const d of [2, 3, 4]) { hex = await T('nearLandHexWithoutImprovement', st.myCity.q, st.myCity.r, d); if (hex) break; }
    ok('heks pod posterunek blisko miasta (widoczny w kadrze)', !!hex, hex);
    await T('placeFort', 'posterunek', hex.q, hex.r, st.myOwnerId);
    const info0 = await T('improvementMeshInfo', hex.q, hex.r);
    ok('A0: mesh ulepszenia utworzony, w scenie', !!info0 && info0.inScene && info0.vertexCount > 0, info0);
    ok('A0: sfera otaczajaca policzona PRZED zwolnieniem tablic', !!info0 && info0.hasBoundingSphere && info0.sphereRadius > 0, info0);
    await wait(1500);
    const info1 = await T('improvementMeshInfo', hex.q, hex.r);
    ok('A1: po wyrenderowaniu kopia CPU (position/color) zwolniona', !!info1 && info1.released === true, info1);
    ok('A1: liczba wierzcholkow zachowana (draw range)', !!info1 && info1.vertexCount === info0.vertexCount, { info0, info1 });
    if (SHOT) await page.screenshot({ path: SHOT + '-A.png' });
    const errBefore = errors.length;
    ok('B0: WEBGL_lose_context dostepne', await T('glLoseContext', true) === true);
    await wait(800);
    await T('glLoseContext', false);
    await wait(2500);
    const info2 = await T('improvementMeshInfo', hex.q, hex.r);
    ok('B1: po odzyskaniu kontekstu mesh przebudowany (nowy obiekt) i w scenie', !!info2 && info2.uuid !== info1.uuid && info2.inScene, { info1, info2 });
    ok('B1: po ponownym uploadzie kopia CPU znow zwolniona', !!info2 && info2.released === true, info2);
    ok('B1: ta sama liczba wierzcholkow', !!info2 && info2.vertexCount === info0.vertexCount, info2);
    const newErr = errors.slice(errBefore).filter((e) => !/CONTEXT_LOST_WEBGL|context lost/i.test(e));
    ok('B2: zero pageerror/console.error po odzyskaniu kontekstu', newErr.length === 0, newErr.slice(0, 5));
    if (SHOT) await page.screenshot({ path: SHOT + '-B.png' });
  } finally { await browser.close(); }
  console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL` + (errors.length ? ` (bledy konsoli lacznie: ${errors.length})` : ''));
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
