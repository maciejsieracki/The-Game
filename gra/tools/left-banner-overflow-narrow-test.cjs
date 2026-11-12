'use strict';
/**
 * left-banner-overflow-narrow-test.cjs
 * R-WEB-UI-LEFT-BANNER-OVERFLOW-NARROW-WINDOW-Q1.
 * Chromium: widok miasta, banery górne (.civ-v-w3-chips-flank lewy/prawy) przy 2000/1366/1280/1024 px:
 * l >= 0, r <= szerokość okna, brak nakładania lewy/prawy/plakietka, brak poziomego scrolla, panele boczne pod banerem.
 * Użycie: node tools/city-side-panels-below-topbanners-test.cjs [--mutant] [--shots=<dir>] [--tag=<nazwa>]
 * --mutant: cofa poprawkę (flank nowrap, 0 0 auto) i musi dać FAIL.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const CITY_TS = path.resolve(GRA, 'src/ui/cityPanel.ts');
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
        if (MUTANT && path.resolve(a.path) === CITY_TS) {
          src = src.replace('flex-wrap:wrap;gap:0.32rem 0.48rem;\n  padding:0.38rem 0.82rem', 'flex-wrap:nowrap;gap:0.32rem 0.48rem;\n  padding:0.38rem 0.82rem')
            .replace('flex:0 1 auto;min-width:0;max-width:100%;box-sizing:border-box;overflow:visible;}', 'flex:0 0 auto;min-width:0;overflow:visible;}');
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
  if (MUTANT) check('mutant: poprawka rzeczywiscie cofnieta w bundlu', bundle.includes('flex:0 0 auto;min-width:0;overflow:visible;}'));
  let browser;
  try { browser = await chromium.launch({ headless: true }); }
  catch (e) { browser = await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] }); }
  const sizes = [[2000, 900], [1366, 768], [1280, 720], [1024, 768]];
  console.log('TABELA (' + TAG + '): rozdz | lewy l..r | prawy l..r | plakietka l..r | scrollW | wysokosc banera');
  for (const [w, h] of sizes) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
    await page.setContent('<!doctype html><html><head><style>html,body{margin:0;height:100%;background:#080c12;color:#eee}</style></head><body></body></html>');
    await page.addScriptTag({ content: bundle });
    await page.addScriptTag({ content: FIXTURE });
    await page.evaluate(() => window.__openCity());
    await page.waitForTimeout(200);
    const m = await page.evaluate(() => {
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
      return { left: r(document.querySelector('.civ-ux-top .civ-v-w3-chips-left')), right: r(document.querySelector('.civ-ux-top .civ-v-w3-chips-right')),
        badge: r(document.querySelector('.civ-ux-top .civ-v-w3-city-badge')), sw: document.documentElement.scrollWidth, vw: innerWidth,
        panelL: r(document.querySelector('.civ-ux-left')), panelR: r(document.querySelector('.civ-ux-right')) };
    });
    const f = (b) => b ? `${b.l.toFixed(0)}..${b.r.toFixed(0)}` : 'brak';
    console.log(`  ${w}x${h} | L ${f(m.left)} | R ${f(m.right)} | badge ${f(m.badge)} | scrollW=${m.sw} | h=${m.left ? (m.left.b - m.left.t).toFixed(0) : '-'}`);
    check(`${w}: lewy i prawy baner istnieja`, !!m.left && !!m.right);
    if (m.left && m.right) {
      check(`${w}: lewy baner l >= 0`, m.left.l >= -0.5, m.left);
      check(`${w}: lewy baner r <= okno`, m.left.r <= w + 0.5, m.left);
      check(`${w}: prawy baner r <= okno`, m.right.r <= w + 0.5, m.right);
      check(`${w}: prawy baner l >= 0`, m.right.l >= -0.5, m.right);
      check(`${w}: lewy nie nachodzi na prawy`, m.left.r <= m.right.l + 0.5, { L: m.left, R: m.right });
      if (m.badge) check(`${w}: baner nie nachodzi na plakietke miasta`, m.left.r <= m.badge.l + 0.5 && m.badge.r <= m.right.l + 0.5, { m: m.badge });
    }
    check(`${w}: brak poziomego scrolla`, m.sw <= w, m.sw);
    if (m.panelL && m.left) {
      const bottom = Math.max(m.left.b, m.right.b, m.badge ? m.badge.b : 0);
      check(`${w}: panele boczne pod banerem`, m.panelL.t >= bottom - 0.5 && m.panelR.t >= bottom - 0.5, { bottom, pl: m.panelL.t, pr: m.panelR.t });
    }
    if (w === 2000 && m.left) check('2000: uklad szeroki zachowany (jedna linia, wysokosc < 70 px)', m.left.b - m.left.t < 70, m.left);
    check(`${w}: brak bledow strony`, errs.length === 0, errs);
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `${TAG}-${w}x${h}.png`) }); }
    await page.close();
  }
  await browser.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`\nWYNIK (${TAG}): PASS=${pass} FAIL=${fail}`);
  process.exit(fail > 0 ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
