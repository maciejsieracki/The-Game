'use strict';
/**
 * tax-slider-default-panel-scale-test.cjs
 *
 * TEMAT: R-WEB-TAX-SLIDER-DEFAULT-PANEL-NOT-EQUAL-Q1.
 * ZGLOSZENIE: w „DOMYSLNY PODZIAL PODATEK" Skarb 50% i Nauka 50% mialy rozne pozycje kropek
 * (Nauka ~83% toru), bo suwak Nauki mial max=60 zamiast wspolnej skali 0-100.
 *
 * CO PILNUJE: (1) wszystkie 3 suwaki maja min=0, max=100 i te sama dlugosc toru;
 * (2) dla kazdej kombinacji srodek kropki = 7 + (szer-14)*value/100 oraz koniec wypelnienia
 * (zmierzony z pikseli, kropka ukryta) leza w +-1 px od tej pozycji; (3) rowne wartosci
 * (np. 50/50/0) daja rowne pozycje kropek Skarb i Nauka; (4) 50% = srodek toru, 100% = koniec,
 * 0% = poczatek; (5) po przeciagnieciu (handler input) nadal. Dodatkowo kontrola limitu Nauki 60%.
 * MUTACJA: bundle z max=60 dla Nauki MUSI dac FAIL.
 *
 * Usage (z gra/): node tools/tax-slider-default-panel-scale-test.cjs [--shot-before png] [--shot-after png]
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { PNG } = require(path.resolve(__dirname, '..', 'node_modules', 'pngjs'));
let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) { console.error('playwright missing'); process.exit(1); }

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.tax-slider-scale-entry.ts');
const OUT_AFTER = path.resolve(__dirname, '.tax-slider-scale-bundle.cjs');
const OUT_BEFORE = path.resolve(__dirname, '.tax-slider-scale-bundle-legacy.cjs');
const PANEL_TS = path.resolve(GRA, 'src', 'ui', 'empireDetailPanel.ts');
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');
const CHROME = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
const argShot = (f) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : null; };
const SHOT_BEFORE = argShot('--shot-before');
const SHOT_AFTER = argShot('--shot-after');

const COMBOS = [[50, 50, 0], [0, 50, 50], [100, 0, 0], [0, 0, 100], [40, 40, 20], [20, 40, 40], [10, 10, 80], [60, 30, 10], [0, 60, 40], [30, 30, 40]];
const KEYS = ['procentPieniadz', 'procentNauka', 'procentLuksus'];
const VIEWS = [{ name: 'szeroki', panelW: 404 }, { name: 'waski', panelW: 260 }];

let pass = 0; let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function listSvgs(dir, prefix, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listSvgs(p, prefix + e.name + '/', out);
    else if (e.name.endsWith('.svg')) out[prefix + e.name] = fs.readFileSync(p, 'utf8');
  }
  return out;
}
const viteCompatPlugin = {
  name: 'vite-compat',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (a) => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw-file' }));
    build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (a) => ({ contents: fs.readFileSync(a.path, 'utf8'), loader: 'text' }));
    build.onLoad({ filter: /brandAssets\.ts$/ }, (a) => {
      if (path.resolve(a.path) !== BRAND_ASSETS_TS) return null;
      const src = fs.readFileSync(a.path, 'utf8').replace(/import\.meta\.glob\('\.\/brand\/\*\*\/\*\.svg',\s*\{[\s\S]*?\}\)/,
        JSON.stringify(listSvgs(BRAND_DIR, './brand/', {})));
      return { contents: src, loader: 'ts', resolveDir: path.dirname(a.path) };
    });
    build.onLoad({ filter: /\.ts$/ }, (a) => {
      const src = fs.readFileSync(a.path, 'utf8');
      if (!src.includes('import.meta.glob')) return null;
      return { contents: 'const __viteGlobStub = () => ({});\n' + src.replace(/import\.meta\.glob/g, '__viteGlobStub'), loader: 'ts', resolveDir: path.dirname(a.path) };
    });
  },
};

/** legacy=true: stara logika (wypełnienie = value% szerokości toru, bez korekty uchwytu). */
function exposePlugin(legacy) {
  return {
    name: 'expose-panel',
    setup(build) {
      build.onLoad({ filter: /empireDetailPanel\.ts$/ }, (a) => {
        if (path.resolve(a.path) !== PANEL_TS) return null;
        let src = fs.readFileSync(a.path, 'utf8');
        if (legacy) {
          const M = "const maxVal = 100; // R-WEB-TAX-SLIDER-DEFAULT-PANEL-NOT-EQUAL-Q1: wspolna skala";
          const idx = src.lastIndexOf("const maxVal = 100; // R-WEB-TAX-SLIDER-DEFAULT-PANEL-NOT-EQUAL-Q1");
          if (idx < 0) throw new Error('mutacja: kotwica nieaktualna');
          const eol = src.indexOf('\n', idx);
          src = src.slice(0, idx) + "const maxVal = row.key === 'procentNauka' ? 60 : 100;" + src.slice(eol);
        }
        return {
          contents: src + '\nexport { renderSkarbiecTaxSplitSection as __renderTax, ensureStyles as __ensureStyles };\n',
          loader: 'ts', resolveDir: path.dirname(a.path),
        };
      });
    },
  };
}
async function buildBundle(outfile, legacy) {
  await esbuild.build({ entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile, absWorkingDir: GRA, loader: { '.ts': 'ts' }, plugins: [viteCompatPlugin, exposePlugin(legacy)], logLevel: 'silent' });
}

/** Skan środkowego rzędu toru: x pierwszego piksela w kolorze tła toru #1f2733 (koniec wypełnienia). */
function fillEndPx(buf) {
  const png = PNG.sync.read(buf);
  const y = Math.floor(png.height / 2);
  const bg = [0x1f, 0x27, 0x33];
  const isBg = (x) => {
    const i = (y * png.width + x) * 4;
    return Math.abs(png.data[i] - bg[0]) + Math.abs(png.data[i + 1] - bg[1]) + Math.abs(png.data[i + 2] - bg[2]) < 10;
  };
  for (let x = 2; x < png.width - 2; x++) if (isBg(x)) return x;
  return png.width; // wypełnienie do końca
}

async function measure(browser, bundleFile, view, combo, dragFirst, shotPath) {
  const ctx = await browser.newContext({ viewport: { width: 560, height: 700 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.setContent('<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}'
    + 'body{background:#0b0f16;color:#eee;padding:12px;}'
    + `#stage.civ-emp-panel{position:static;transform:none;width:${view.panelW}px;height:auto;box-shadow:none;border:1px solid #2b3543;}`
    + '</style></head><body><div id="stage" class="civ-emp-panel"></div></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(bundleFile, 'utf8') });
  const start = dragFirst ? [40, 40, 20] : combo;
  await page.evaluate((s) => {
    window.__ensureStyles();
    let cur = { procentPieniadz: s[0], procentNauka: s[1], procentLuksus: s[2] };
    window.__configureHandel({ getOwnerDefault: () => cur, onOwnerDefaultChange: (_o, v) => { cur = v; }, getActiveOwnerId: () => 0, getDaninaLabel: () => 'Podatek' });
    document.getElementById('stage').innerHTML = window.__renderTax(100);
  }, start);
  await page.waitForTimeout(50);
  if (dragFirst) {
    // Przeciągnięcie Skarbu: handler przelicza pozostałe suwaki i odświeża wypełnienia.
    await page.evaluate((v) => {
      const inp = document.querySelector('input[data-handel-key="procentPieniadz"]');
      inp.value = String(v); inp.dispatchEvent(new Event('input', { bubbles: true }));
    }, combo[0]);
  }
  await page.addStyleTag({ content: '.civ-emp-slider::-webkit-slider-thumb{opacity:0 !important}' });
  const rows = [];
  for (const key of KEYS) {
    const loc = page.locator(`input[data-handel-key="${key}"]`);
    const info = await loc.evaluate((i) => {
      const r = i.getBoundingClientRect();
      return { w: r.width, value: Number(i.value), min: Number(i.min), max: Number(i.max) };
    });
    const buf = await loc.screenshot();
    const end = fillEndPx(buf);
    const center = 7 + (info.w - 14) * info.value / 100;
    rows.push({ key, ...info, fillEnd: end, thumbCenter: center, diff: Math.abs(end - center), scaleBad: info.min !== 0 || info.max !== 100 });
  }
  if (shotPath) {
    await page.addStyleTag({ content: '.civ-emp-slider::-webkit-slider-thumb{opacity:1 !important}' });
    fs.mkdirSync(path.dirname(path.resolve(shotPath)), { recursive: true });
    await page.locator('#emp-skarbiec-tax-split').screenshot({ path: shotPath });
  }
  await ctx.close();
  return { rows, errs };
}

async function runSuite(browser, bundleFile, label, verbose) {
  let worst = 0; let bad = 0; let errs = 0;
  for (const view of VIEWS) {
    for (const drag of [false, true]) {
      for (const combo of COMBOS) {
        const r = await measure(browser, bundleFile, view, combo, drag, null);
        errs += r.errs.length;
        if (r.rows[0].value === r.rows[1].value) { const d = Math.abs(r.rows[0].fillEnd - r.rows[1].fillEnd); worst = Math.max(worst, d); if (d > 1) { bad++; if (verbose) console.log('  rozne pozycje Skarb vs Nauka', combo.join('/'), d); } }
        for (const row of r.rows) {
          worst = Math.max(worst, row.diff);
          if (row.diff > 1 || row.scaleBad) bad++;
          if (verbose && (row.diff > 1 || row.scaleBad)) console.log('  odchylka', view.name, drag ? 'drag' : 'render', combo.join('/'), row.key, 'val=' + row.value, 'koniec=' + row.fillEnd, 'srodek=' + row.thumbCenter.toFixed(1));
        }
      }
    }
  }
  console.log(`[${label}] najwieksza roznica = ${worst.toFixed(1)} px, pomiarow >1px: ${bad}, bledy strony: ${errs}`);
  return { worst, bad, errs };
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { configureEmpireHandelSplit } from '../src/ui/empireDetailPanel.ts';",
    "import { __renderTax, __ensureStyles } from '../src/ui/empireDetailPanel.ts';",
    'window.__configureHandel = configureEmpireHandelSplit; window.__renderTax = __renderTax; window.__ensureStyles = __ensureStyles;', '',
  ].join('\n'), 'utf8');
  await buildBundle(OUT_AFTER, false);
  await buildBundle(OUT_BEFORE, true);
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  try {
    const after = await runSuite(browser, OUT_AFTER, 'PO', true);
    check('PO: wspolna skala 0-100, kropka=wypelnienie=value% toru (<=1 px), rowne wartosci = rowne pozycje', after.bad === 0 && after.worst <= 1, after);
    check('PO: brak bledow strony', after.errs === 0);
    const before = await runSuite(browser, OUT_BEFORE, 'MUTACJA/PRZED', false);
    check('MUTACJA (max=60 dla Nauki) zapala pomiar na czerwono', before.bad > 0 && before.worst > 5, before);
    if (SHOT_BEFORE) await measure(browser, OUT_BEFORE, VIEWS[0], [40, 40, 20], false, SHOT_BEFORE);
    if (SHOT_AFTER) await measure(browser, OUT_AFTER, VIEWS[0], [40, 40, 20], false, SHOT_AFTER);
  } finally { await browser.close(); }
  for (const f of [ENTRY, OUT_AFTER, OUT_BEFORE]) { try { fs.unlinkSync(f); } catch (e) { /* brak */ } }
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
