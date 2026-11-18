'use strict';
/**
 * garncarnia-throughput-chromium-render-test.cjs -- R-WEB-DATA-GARNCARNIA-THROUGHPUT-30-PLUS-20-PER-ERA-Q1
 * (criterion e): wiersz produkcji Garncarni w karcie miasta w PRAWDZIWYM Chromium.
 *
 * Bundluje PRAWDZIWE `formatConverterProductionRowHtml` z cityPanel.ts (ta sama funkcja, którą
 * woła karta miasta) oraz PRAWDZIWE `converterProductionDisplayForBuilding` z converters.ts i
 * PRAWDZIWY econ-params.json. Dla epok 1, 3, 5 renderuje wiersz w kontenerze 520 px i sprawdza,
 * że pokazana produkcja ceramiki = 30 / 70 / 110 oraz zużycie gliny/drewna = ta sama liczba.
 * Opcjonalnie zrzut ekranu: GARNCARNIA_SHOTS_DIR=<katalog>.
 *
 * Run from gra/:  node tools/garncarnia-throughput-chromium-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) { console.error('[garncarnia-render] playwright missing -- npm ci'); process.exit(1); }

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.garncarnia-render-entry.ts');
const OUTFILE = path.resolve(__dirname, '.garncarnia-render-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const SHOTS_DIR = process.env.GARNCARNIA_SHOTS_DIR ? path.resolve(process.env.GARNCARNIA_SHOTS_DIR) : null;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail === undefined ? '' : ' -- ' + JSON.stringify(detail))); }
}

function listSvgs(dir, prefix, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) listSvgs(file, prefix + entry.name + '/', out);
    else if (entry.name.endsWith('.svg')) out[prefix + entry.name] = fs.readFileSync(file, 'utf8');
  }
  return out;
}

// Same small Vite adapters as the other real-render tests (?raw imports, import.meta.glob stub,
// brand SVG map read from disk so resource chips render their real icons).
const viteCompatPlugin = {
  name: 'vite-compat',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'raw-file',
    }));
    build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (args) => ({
      contents: fs.readFileSync(args.path, 'utf8'),
      loader: 'text',
    }));
    build.onLoad({ filter: /brandAssets\.ts$/ }, (args) => {
      const expected = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');
      if (path.resolve(args.path) !== expected) return null;
      const source = fs.readFileSync(args.path, 'utf8').replace(
        /import\.meta\.glob\('\.\/brand\/\*\*\/\*\.svg',\s*\{[\s\S]*?\}\)/,
        JSON.stringify(listSvgs(path.resolve(GRA, 'src', 'ui', 'icons', 'brand'), './brand/', {})),
      );
      return { contents: source, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      const source = fs.readFileSync(args.path, 'utf8');
      if (!source.includes('import.meta.glob')) return null;
      return {
        contents: 'const __viteGlobStub = () => ({});\n' + source.replace(/import\.meta\.glob/g, '__viteGlobStub'),
        loader: 'ts',
        resolveDir: path.dirname(args.path),
      };
    });
  },
};

// Exposes the private row formatter of cityPanel.ts without editing the tracked file.
const exposeCityPanelPlugin = {
  name: 'expose-city-panel',
  setup(build) {
    build.onLoad({ filter: /cityPanel\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== path.resolve(GRA, 'src', 'ui', 'cityPanel.ts')) return null;
      return {
        contents: fs.readFileSync(args.path, 'utf8') + [
          '',
          'export {',
          '  formatConverterProductionRowHtml as __formatConverterProductionRowHtml,',
          '  ensureStyles as __ensureCityPanelStyles,',
          '};',
          '',
        ].join('\n'),
        loader: 'ts',
        resolveDir: path.dirname(args.path),
      };
    });
  },
};

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (error) {
    console.log('[garncarnia-render] default Chromium unavailable, trying', FALLBACK_CHROME);
    return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { converterProductionDisplayForBuilding } from '../src/game/converters.ts';",
    "import econParams from '../data/econ-params.json';",
    "import * as CP from '../src/ui/cityPanel.ts';",
    'const cp = CP as any;',
    'window.__G = {',
    "  display: (era: number) => converterProductionDisplayForBuilding('garncarnia', econParams as any, 'normal', era),",
    '  rowHtml: (d: any) => cp.__formatConverterProductionRowHtml(d, false),',
    '  ensureStyles: () => cp.__ensureCityPanelStyles(),',
    '};',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: OUTFILE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [viteCompatPlugin, exposeCityPanelPlugin],
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 560, height: 420 } });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()); });

  try {
    await page.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:12px;background:#1b1b1b;color:#eee;font-family:sans-serif"></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
    await page.evaluate(() => { window.__G.ensureStyles(); });

    const EXPECTED = { 1: 30, 3: 70, 5: 110 };
    const result = await page.evaluate((eras) => {
      const out = {};
      for (const era of eras) {
        const d = window.__G.display(era);
        const wrap = document.createElement('div');
        wrap.style.cssText = 'width:520px;margin:10px 0;padding:6px;border:1px dashed #555;';
        const label = document.createElement('div');
        label.textContent = 'Garncarnia, epoka ' + era + ' (normal)';
        label.style.cssText = 'font-size:12px;opacity:.8;margin-bottom:4px;';
        const row = document.createElement('div');
        row.className = 'bld-owned-conv-row';
        row.innerHTML = window.__G.rowHtml(d);
        wrap.appendChild(label);
        wrap.appendChild(row);
        document.body.appendChild(wrap);
        out[era] = {
          produced: d.produced.ceramika,
          consumedGlina: d.consumed.glina,
          consumedDrewno: d.consumed.drewno,
          text: row.textContent.replace(/\s+/g, ' ').trim(),
          svgCount: row.querySelectorAll('svg').length,
          overflow: row.scrollWidth > row.clientWidth + 1,
        };
      }
      return out;
    }, [1, 3, 5]);

    for (const era of [1, 3, 5]) {
      const r = result[era];
      check(`epoka ${era}: produkcja ceramiki = ${EXPECTED[era]} (model z econ-params)`, r.produced === EXPECTED[era], r);
      check(`epoka ${era}: zuzycie gliny i drewna = ${EXPECTED[era]}`, r.consumedGlina === EXPECTED[era] && r.consumedDrewno === EXPECTED[era], r);
      check(`epoka ${era}: wiersz w DOM zawiera liczbe ${EXPECTED[era]} i ikony (svg)`,
        r.text.includes(String(EXPECTED[era])) && r.svgCount >= 2, { text: r.text, svgCount: r.svgCount });
      check(`epoka ${era}: brak poziomego przepelnienia wiersza przy 520 px`, r.overflow === false, r);
    }
    check('brak bledow strony', pageErrors.length === 0, pageErrors);

    if (SHOTS_DIR) {
      fs.mkdirSync(SHOTS_DIR, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS_DIR, 'garncarnia-era-rows.png'), fullPage: true });
      console.log('screenshot: ' + path.join(SHOTS_DIR, 'garncarnia-era-rows.png'));
    }
  } finally {
    await browser.close();
  }

  console.log(`\ngarncarnia-throughput-chromium-render-test: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
