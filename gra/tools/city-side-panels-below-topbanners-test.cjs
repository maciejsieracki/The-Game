'use strict';
/**
 * city-side-panels-below-topbanners-test.cjs
 * R-WEB-UI-CITY-SIDE-PANELS-OVERLAP-TOPBANNERS-Q1.
 * Chromium: widok miasta, pomiar getBoundingClientRect() banerów górnych (.civ-v-w3-chips-flank:
 * lewy/środkowy/prawy) vs paneli bocznych (.civ-ux-left, .civ-ux-right) w 4 rozdzielczościach.
 * Kryterium: panel.top >= baner.bottom (brak nakładania prostokątów), panel.bottom <= viewport.
 * Użycie: node tools/city-side-panels-below-topbanners-test.cjs [--mutant] [--shots=<dir>] [--tag=<nazwa>]
 * --mutant: cofa poprawkę (top paneli = stałe CITY_RAIL_TOP_PX) i musi dać FAIL.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const CITY_TS = path.resolve(GRA, 'src/ui/cityPanel.ts');
const FRAME_TS = path.resolve(GRA, 'src/ui/cityUxFrame.ts');
const TMP = path.join(os.tmpdir(), `civ-side-top-${process.pid}-${Math.random().toString(36).slice(2, 8)}`);
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MUTANT = process.argv.includes('--mutant');
const SHOTS = (process.argv.find((a) => a.startsWith('--shots=')) || '').slice(8) || null;
const TAG = (process.argv.find((a) => a.startsWith('--tag=')) || '').slice(6) || (MUTANT ? 'mutant' : 'after');
const esbuild = require(path.resolve(GRA, 'node_modules/esbuild'));
const { chromium } = require(path.resolve(GRA, 'node_modules/playwright'));

let pass = 0; let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail === undefined ? '' : ' — ' + JSON.stringify(detail))); }
}

function plugin() {
  return {
    name: 'side-top',
    setup(build) {
      build.onResolve({ filter: /\?raw$/ }, (a) => {
        const clean = a.path.slice(0, -4);
        const abs = path.isAbsolute(clean) ? clean : path.resolve(path.dirname(a.importer), clean);
        return { path: abs, namespace: 'raw' };
      });
      build.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({ contents: fs.readFileSync(a.path, 'utf8'), loader: 'text' }));
      build.onLoad({ filter: /\.ts$/ }, (a) => {
        let src = fs.readFileSync(a.path, 'utf8');
        let changed = false;
        if (src.includes('import.meta.glob')) {
          src = 'const __g = () => ({});\n' + src.replace(/import\.meta\.glob/g, '__g'); changed = true;
        }
        if (MUTANT && path.resolve(a.path) === FRAME_TS) {
          // cofnięcie poprawki: panele znów od stałego CITY_RAIL_TOP_PX
          src = src.replace(/const SIDE_TOP_EXPR = .*;/, 'const SIDE_TOP_EXPR = `${LEFT_RAIL_TOP}px`;');
          changed = true;
        }
        return changed ? { contents: src, loader: 'ts', resolveDir: path.dirname(a.path) } : null;
      });
    },
  };
}

const FIXTURE = `
(() => {
  const cityA = { id: 'city-a', ownerId: 0, q: 0, r: 0, name: 'Ateny', population: 6 };
  const map = { szerokoscQ: 8, wysokoscR: 8, seed: 42, riverPaths: [],
    hexes: { '0,0': { coords: { q: 0, r: 0 }, terenBazowy: 'rownina', nakladka: 'brak' } } };
  window.__configureCityPanel({
    getCities: () => [cityA], getUnitsAt: () => [], getBuiltBuildingIds: () => [], getWorkedTiles: () => [],
    getProduction: () => ({ kolejka: [], postep: 0 }), getEpoch: () => 1, getTurn: () => 1, onSwitchCity: () => {},
  });
  window.__openCity = () => window.__showCityPanel(cityA, map, () => {});
})();`;

async function main() {
  fs.mkdirSync(TMP, { recursive: true });
  const entry = path.join(TMP, 'entry.ts');
  fs.writeFileSync(entry, [
    `import { configureCityPanel, showCityPanel } from ${JSON.stringify(CITY_TS)};`,
    'window.__configureCityPanel = configureCityPanel; window.__showCityPanel = showCityPanel;', ''].join('\n'));
  const out = path.join(TMP, 'bundle.js');
  await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: out, absWorkingDir: GRA, plugins: [plugin()], logLevel: 'silent' });
  const bundle = fs.readFileSync(out, 'utf8');
  let browser;
  try { browser = await chromium.launch({ headless: true }); }
  catch (e) { browser = await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] }); }
  const sizes = [[2000, 900], [1600, 900], [1366, 768], [1280, 720]];
  console.log('TABELA (' + TAG + '): rozdz | baner bottom | panel top/bottom | vh | nakladanie');
  for (const [w, h] of sizes) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
    await page.setContent('<!doctype html><html><head><style>html,body{margin:0;height:100%;background:#080c12;color:#eee}</style></head><body></body></html>');
    await page.addScriptTag({ content: bundle });
    await page.addScriptTag({ content: FIXTURE });
    await page.evaluate(() => window.__openCity());
    await page.waitForTimeout(150);
    const m = await page.evaluate(() => {
      const r = (el) => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
      const vis = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
      const banners = Array.from(document.querySelectorAll('.civ-ux-top .civ-v-w3-chips-flank')).filter(vis).map((e) => ({ cls: e.className.replace('civ-v-w3-chips-flank', '').trim() || 'flank', ...r(e) }));
      const sels = { 'panel-lewy': '.civ-ux-left', 'panel-prawy': '.civ-ux-right', 'rail-lewy': '.civ-ux-left-icon-rail', 'rail-prawy': '.civ-ux-right-icon-rail' };
      const panels = {};
      for (const [k, s] of Object.entries(sels)) { const e = document.querySelector(s); if (e && vis(e)) panels[k] = r(e); }
      return { banners, panels, vh: innerHeight };
    });
    check(`${w}x${h}: znaleziono banery górne`, m.banners.length >= 2, m.banners.length);
    check(`${w}x${h}: znaleziono oba panele boczne`, !!m.panels['panel-lewy'] && !!m.panels['panel-prawy']);
    for (const [pk, p] of Object.entries(m.panels)) {
      for (const b of m.banners) {
        const overlap = p.l < b.r && p.r > b.l && p.t < b.b && p.b > b.t;
        console.log(`  ${w}x${h} | ${b.cls}[x ${b.l.toFixed(0)}..${b.r.toFixed(0)}] bottom=${b.b.toFixed(1)} | ${pk}[x ${p.l.toFixed(0)}..${p.r.toFixed(0)}] top=${p.t.toFixed(1)} bottom=${p.b.toFixed(1)} | vh=${m.vh} | ${overlap ? 'NAKLADA' : 'ok'}`);
        check(`${w}x${h}: ${pk} nie nachodzi na baner ${b.cls}`, !overlap && p.t >= b.b - 0.5, { panelTop: p.t, bannerBottom: b.b });
      }
      check(`${w}x${h}: ${pk} nie wychodzi poza dół okna`, p.b <= m.vh + 0.5, { bottom: p.b, vh: m.vh });
    }
    check(`${w}x${h}: brak bledow strony`, errs.length === 0, errs);
    if (SHOTS && (w === 2000 || w === 1366)) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `${TAG}-${w}x${h}.png`) }); }
    if (w === 1600) {
      await page.setViewportSize({ width: 1366, height: 768 }); await page.waitForTimeout(150);
      const rz = await page.evaluate(() => {
        const bs = Array.from(document.querySelectorAll('.civ-ux-top .civ-v-w3-chips-flank')).map((e) => e.getBoundingClientRect().bottom);
        const pt = ['.civ-ux-left', '.civ-ux-right'].map((s) => document.querySelector(s).getBoundingClientRect().top);
        return { maxB: Math.max(...bs), minP: Math.min(...pt) };
      });
      check('resize 1600->1366: panel.top >= baner.bottom', rz.minP >= rz.maxB - 0.5, rz);
    }
    await page.close();
  }
  await browser.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`\nWYNIK (${TAG}): PASS=${pass} FAIL=${fail}`);
  process.exit(fail > 0 ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
