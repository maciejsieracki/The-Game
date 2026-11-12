'use strict';
/**
 * city-ro-loop-boot-error-test.cjs
 * R-WEB-CITY-SIDE-TOP-RO-LOOP-BOOT-ERROR-Q1.
 * Chromium: otwarcie panelu miasta (cityUxFrame -> fitCitySideTop) i licznik zdarzen window 'error'
 * z komunikatem "ResizeObserver loop" w oknie 5 s.
 * Kryterium (a): po poprawce liczba zdarzen <= 1 (bez narastania).
 * Kryterium (c): --mutant przywraca stary kod fitCitySideTop (nowy ResizeObserver przy kazdym wywolaniu) i musi dac FAIL.
 * Uzycie: node tools/city-ro-loop-boot-error-test.cjs [--mutant]
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const CITY_TS = path.resolve(GRA, 'src/ui/cityPanel.ts');
const FRAME_TS = path.resolve(GRA, 'src/ui/cityUxFrame.ts');
const TMP = path.join(os.tmpdir(), `civ-ro-loop-${process.pid}-${Math.random().toString(36).slice(2, 8)}`);
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MUTANT = process.argv.includes('--mutant');
const WINDOW_MS = 5000;

// Stary kod (przed poprawka): nowy ResizeObserver przy kazdym wywolaniu, callback wola fitCitySideTop.
const OLD_OBSERVER_BLOCK = `  if (typeof ResizeObserver !== 'undefined') {
    sideTopObserver?.disconnect();
    sideTopObserver = new ResizeObserver(() => fitCitySideTop());
    for (const el of els) sideTopObserver.observe(el);
  }`;

let pass = 0; let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail === undefined ? '' : ' — ' + JSON.stringify(detail))); }
}

function plugin() {
  return {
    name: 'ro-loop',
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
          const fixed = fs.readFileSync(FRAME_TS, 'utf8');
          const start = fixed.indexOf('  // Obserwator tworzony RAZ');
          const endMarker = '      sideTopObserved.add(el);\n    }\n  }';
          const end = fixed.indexOf(endMarker, start);
          if (start < 0 || end < 0) throw new Error('mutant: nie znaleziono bloku ResizeObserver w cityUxFrame.ts');
          src = fixed.slice(0, start) + OLD_OBSERVER_BLOCK + fixed.slice(end + endMarker.length);
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
  const esbuild = require(path.resolve(GRA, 'node_modules/esbuild'));
  const { chromium } = require(path.resolve(GRA, 'node_modules/playwright'));
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const pageErrs = [];
  page.on('pageerror', (e) => pageErrs.push(String(e)));
  await page.setContent('<!doctype html><html><head><style>html,body{margin:0;height:100%;background:#080c12;color:#eee}</style></head><body></body></html>');
  await page.addScriptTag({ content: bundle });
  await page.addScriptTag({ content: FIXTURE });
  await page.evaluate(() => {
    window.__roCount = 0;
    window.addEventListener('error', (e) => { if (String(e.message).includes('ResizeObserver loop')) window.__roCount++; });
  });
  await page.evaluate(() => window.__openCity());
  await page.waitForTimeout(WINDOW_MS);
  const roCount = await page.evaluate(() => window.__roCount);
  console.log(`ZDARZENIA RO w oknie ${WINDOW_MS} ms (${MUTANT ? 'MUTANT' : 'KOD'}): ${roCount}`);
  check('panel miasta: zdarzenia "ResizeObserver loop" w 5 s <= 1', roCount <= 1, { roCount });
  await browser.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`WYNIK (${MUTANT ? 'MUTANT' : 'KOD'}): PASS=${pass} FAIL=${fail}`);
  process.exit(fail > 0 ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
