'use strict';
/**
 * city-ro-loop-expand-click-test.cjs
 * R-WEB-CITY-SIDE-TOP-RO-LOOP-BOOT-ERROR-Q1, DODATEK 2 (pkt g/h).
 * Chromium: panel miasta otwarty (cityUxFrame -> fitCitySideTop) + karta jednostki z przyciskiem
 * [data-sp-expand] (sidePanelHud). Liczy zdarzenia window 'error' z "ResizeObserver loop" i
 * wyjatki strony podczas klikniec "Więcej szczegółów" i "Mniej szczegółów".
 * Uzycie: node tools/city-ro-loop-expand-click-test.cjs [--mutant]
 *   --mutant: przywraca stary obserwator cityUxFrame (pre-fix); liczniki musza byc > 0.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const CITY_TS = path.resolve(GRA, 'src/ui/cityPanel.ts');
const HUD_TS = path.resolve(GRA, 'src/ui/sidePanelHud.ts');
const FRAME_TS = path.resolve(GRA, 'src/ui/cityUxFrame.ts');
const TMP = path.join(os.tmpdir(), `civ-ro-expand-${process.pid}-${Math.random().toString(36).slice(2, 8)}`);
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MUTANT = process.argv.includes('--mutant');

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
    name: 'ro-expand',
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
  let expanded = false;
  const hud = window.__createHud({
    getContextPanel: () => ({
      kind: 'unit',
      expandable: true,
      html: '<div class="sp-ctx-title">Łucznik</div><div>HP 10/10</div>',
    }),
    isContextExpanded: () => expanded,
    onContextExpand: () => { expanded = !expanded; hud.update(); },
  });
  window.__hud = hud;
})();`;

async function main() {
  fs.mkdirSync(TMP, { recursive: true });
  const esbuild = require(path.resolve(GRA, 'node_modules/esbuild'));
  const { chromium } = require(path.resolve(GRA, 'node_modules/playwright'));
  const entry = path.join(TMP, 'entry.ts');
  fs.writeFileSync(entry, [
    `import { configureCityPanel, showCityPanel } from ${JSON.stringify(CITY_TS)};`,
    `import { createSidePanelHud } from ${JSON.stringify(HUD_TS)};`,
    'window.__configureCityPanel = configureCityPanel; window.__showCityPanel = showCityPanel;',
    'window.__createHud = (cfg) => { const api = createSidePanelHud(cfg); document.body.appendChild(api.el); document.body.appendChild(api.ctxEl); api.update(); return api; };',
    ''].join('\n'));
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
    window.__roCount = 0; window.__roMsgs = [];
    window.addEventListener('error', (e) => {
      if (String(e.message).includes('ResizeObserver loop')) window.__roCount++;
    });
  });
  await page.evaluate(() => window.__openCity());
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => window.__roCount);
  const bClick = await page.evaluate(() => {
    const b = document.querySelector('[data-sp-expand]');
    if (!b) return false;
    b.click();
    return true;
  });
  check('przycisk "Więcej szczegółów" obecny', bClick);
  await page.waitForTimeout(2000);
  const afterMore = await page.evaluate(() => window.__roCount);
  const lessClick = await page.evaluate(() => {
    const b = document.querySelector('[data-sp-expand]');
    if (!b) return false;
    b.click();
    return true;
  });
  check('przycisk "Mniej szczegółów" obecny', lessClick);
  await page.waitForTimeout(2000);
  const afterLess = await page.evaluate(() => window.__roCount);
  const roMore = afterMore - before;
  const roLess = afterLess - afterMore;
  console.log(`RO po otwarciu panelu miasta: ${before}`);
  console.log(`RO w 2 s po "Więcej szczegółów" (${MUTANT ? 'MUTANT' : 'KOD'}): ${roMore}`);
  console.log(`RO w 2 s po "Mniej szczegółów" (${MUTANT ? 'MUTANT' : 'KOD'}): ${roLess}`);
  check('klik "Więcej szczegółów": RO <= 1', roMore <= 1, { roMore });
  check('klik "Mniej szczegółów": RO <= 1', roLess <= 1, { roLess });
  check('brak wyjątków strony przy kliknięciach', pageErrs.filter((m) => !m.includes('ResizeObserver loop')).length === 0, pageErrs.slice(0, 3));
  await browser.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`WYNIK (${MUTANT ? 'MUTANT' : 'KOD'}): PASS=${pass} FAIL=${fail}`);
  process.exit(fail > 0 ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
