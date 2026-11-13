'use strict';
/**
 * resource-icons-everywhere-render-test.cjs
 *
 * TEMAT: R-WEB-UI-RESOURCE-ICONS-EVERYWHERE-Q1 (poprawka po zarzutach Evaluatora, runda 2).
 *
 * Test BEHAWIORALNY w Chromium na PRAWDZIWYCH funkcjach renderujących (nie regex po źródle):
 *  A. Wyjście formatterów (formatResourceUpkeepSummary z cityPanel.ts oraz
 *     formatResourceUpkeepEmpireLine / ...Colored z empireDetailPanel.ts) dla KAŻDEGO surowca
 *     z STOCK_RESOURCE_LABEL: widoczny tekst NIE zawiera nazwy słownej surowca; każdy chip ma
 *     realną ikonę SVG z aria-label/title = nazwa.
 *  B. Wiersz „Utrzymanie surowców budynków” w bilansie miasta (appendCitySkarbiecBalance):
 *     wartość jest wyrenderowana jako ikony (innerHTML), NIE jako surowy kod HTML
 *     (textContent nie zawiera '<', nazwy surowców ani atrybutów); pozostałe wiersze nadal
 *     tekstowe (textContent) i zawierają oczekiwane liczby.
 *  C. Układ przy szerokości panelu 520 px: brak poziomego przepełnienia bilansu i wierszy
 *     imperium; zrzuty (gdy ustawiono BUILDING_RESOURCE_ICONS_SHOTS_DIR).
 *
 * Zmienne środowiskowe (opcjonalne):
 *  - RESOURCE_ICONS_SRC_DIR  — katalog z cityPanel.ts / empireDetailPanel.ts do zbudowania
 *                              zamiast gra/src/ui (np. wersja BAZOWA do zrzutów „przed").
 *  - BUILDING_RESOURCE_ICONS_SHOTS_DIR, RESOURCE_ICONS_SHOT_TAG — zrzuty przed/po.
 *
 * Uruchomienie (z gra/): node tools/resource-icons-everywhere-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[resource-icons-everywhere] playwright missing — npm ci, then install Chromium');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const UI_DIR = path.resolve(GRA, 'src', 'ui');
const SRC_OVERRIDE = process.env.RESOURCE_ICONS_SRC_DIR
  ? path.resolve(process.env.RESOURCE_ICONS_SRC_DIR) : null;
const ENTRY = path.resolve(__dirname, '.resource-icons-everywhere-entry.ts');
const OUTFILE = path.resolve(__dirname, '.resource-icons-everywhere-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOTS_DIR = process.env.BUILDING_RESOURCE_ICONS_SHOTS_DIR
  ? path.resolve(process.env.BUILDING_RESOURCE_ICONS_SHOTS_DIR) : null;
const SHOT_TAG = process.env.RESOURCE_ICONS_SHOT_TAG || process.env.BUILDING_RESOURCE_ICONS_SHOT_TAG || 'run';
const PANEL_WIDTH_PX = 520;

let pass = 0;
let fail = 0;
function check(name, condition, detail) {
  if (condition) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + detail : '')); }
}

// Dwa moduły UI, każdy eksportuje wybrane lokalne funkcje do testu (tylko w buildzie testowym).
const exposeSpecs = {
  'cityPanel.ts': [
    'appendCitySkarbiecBalance as __appendCitySkarbiecBalance',
    'formatResourceUpkeepSummary as __formatResourceUpkeepSummary',
    'ensureStyles as __ensureCityPanelStyles',
  ],
  'empireDetailPanel.ts': [
    'ensureStyles as __ensureEmpireStyles',
    'formatResourceUpkeepEmpireLine as __formatResourceUpkeepEmpireLine',
    'formatResourceUpkeepEmpireLineColored as __formatResourceUpkeepEmpireLineColored',
  ],
};

function makeExposePlugin() {
  return {
    name: 'expose-resource-icons-everywhere',
    setup(build) {
      build.onLoad({ filter: /(cityPanel|empireDetailPanel)\.ts$/ }, (args) => {
        const base = path.basename(args.path);
        if (path.resolve(path.dirname(args.path)) !== UI_DIR) return null;
        const specs = exposeSpecs[base];
        if (!specs) return null;
        const srcFile = SRC_OVERRIDE ? path.join(SRC_OVERRIDE, base) : args.path;
        return {
          contents: fs.readFileSync(srcFile, 'utf8') + [
            '', 'export {', ...specs.map((s) => '  ' + s + ','), '};', '',
          ].join('\n'),
          loader: 'ts',
          resolveDir: path.dirname(args.path),
        };
      });
    },
  };
}

function listSvgs(dir, prefix, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) listSvgs(file, prefix + entry.name + '/', out);
    else if (entry.name.endsWith('.svg')) out[prefix + entry.name] = fs.readFileSync(file, 'utf8');
  }
  return out;
}

// Vite-only imports need the same small adapters as the other real-render tests; the SVG
// contents and the source modules are the real repository files.
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

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (error) {
    console.log('[resource-icons-everywhere] default Chromium unavailable, trying', FALLBACK_CHROME);
    return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function screenshot(page, name) {
  if (!SHOTS_DIR) return;
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS_DIR, name), fullPage: true });
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { STOCK_RESOURCE_LABEL } from '../src/game/building-stock-cost.ts';",
    "import * as CP from '../src/ui/cityPanel.ts';",
    "import * as EP from '../src/ui/empireDetailPanel.ts';",
    'const cp = CP as any;',
    'const ep = EP as any;',
    'window.__T = {',
    '  STOCK_RESOURCE_LABEL,',
    '  configureCityPanel: CP.configureCityPanel,',
    '  appendCitySkarbiecBalance: cp.__appendCitySkarbiecBalance,',
    '  formatResourceUpkeepSummary: cp.__formatResourceUpkeepSummary,',
    '  ensureCityPanelStyles: cp.__ensureCityPanelStyles,',
    '  ensureEmpireStyles: ep.__ensureEmpireStyles,',
    '  formatResourceUpkeepEmpireLine: ep.__formatResourceUpkeepEmpireLine,',
    '  formatResourceUpkeepEmpireLineColored: ep.__formatResourceUpkeepEmpireLineColored,',
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
    loader: { '.ts': 'ts' },
    plugins: [viteCompatPlugin, makeExposePlugin()],
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 560, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()); });

  try {
    await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
      + '*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;font-family:"Segoe UI",Tahoma,sans-serif;padding:16px;}'
      + '#stage{display:flex;flex-direction:column;gap:12px;align-items:flex-start;}'
      + '</style></head><body><main id="stage"></main></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    const res = await page.evaluate(({ panelWidth }) => {
      const T = window.__T;
      // Z3: panel imperium musi mieć style chipa BEZ wcześniejszego otwarcia panelu miasta.
      T.ensureEmpireStyles();
      const z3 = (() => {
        const h = document.createElement('div');
        h.innerHTML = T.formatResourceUpkeepEmpireLine({ drewno: 1 });
        document.body.appendChild(h);
        const chip = h.querySelector('.bld-res-chip');
        const ic = h.querySelector('.bld-res-chip-ic');
        const r = { chipDisplay: chip ? getComputedStyle(chip).display : 'none', icDisplay: ic ? getComputedStyle(ic).display : 'none' };
        h.remove();
        return r;
      })();
      T.ensureCityPanelStyles();
      const labels = T.STOCK_RESOURCE_LABEL;
      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const labelRe = (name) => new RegExp('(^|[^\\p{L}])' + esc(name) + '($|[^\\p{L}])', 'iu');
      const stage = document.getElementById('stage');
      const mkMount = (cls) => {
        const m = document.createElement('div');
        m.className = cls;
        m.style.width = panelWidth + 'px';
        m.style.background = '#14110c';
        m.style.padding = '8px';
        stage.appendChild(m);
        return m;
      };
      const out = { formatter: [], balance: null, layout: [], z3 };

      // A. Formatters, every resource key. Visible text = textContent; icons read via aria-label.
      const probe = (name, html) => {
        const holder = document.createElement('div');
        holder.innerHTML = html;
        const label = labels[name];
        const visible = holder.textContent ?? '';
        const icons = [...holder.querySelectorAll('.bld-res-chip-ic')];
        const iconOk = icons.length > 0 && icons.every((ic) => ic.querySelector('svg')
          && ic.getAttribute('aria-label') === label && ic.getAttribute('title') === label);
        return {
          key: name,
          bareName: labelRe(label).test(visible),
          visible,
          iconOk,
          hasHtmlLeak: visible.includes('<') || visible.includes('aria-label'),
        };
      };
      for (const k of Object.keys(labels)) {
        const single = {}; single[k] = 2;
        out.formatter.push({ fn: 'formatResourceUpkeepSummary', ...probe(k, T.formatResourceUpkeepSummary(single)) });
        out.formatter.push({ fn: 'formatResourceUpkeepEmpireLine', ...probe(k, T.formatResourceUpkeepEmpireLine(single)) });
        out.formatter.push({ fn: 'formatResourceUpkeepEmpireLineColored', ...probe(k, T.formatResourceUpkeepEmpireLineColored(single)) });
      }

      // B. Balance card with real appendCitySkarbiecBalance, 520 px mount.
      const snap = {
        pieniadzBrutto: 12, wealthMnoznik: 1, handelZeSzlakow: 3, doSkarbca: 9,
        utrzymanieBudynkow: 2, utrzymanieGarnizonu: 0,
        utrzymanieSurowcowBudynkow: { drewno: 1, glina: 2, ruda_zelaza: 3 },
      };
      T.configureCityPanel({ getCityMoneySnap: () => snap });
      const balMount = mkMount('bal-mount');
      T.appendCitySkarbiecBalance(balMount, { id: 'c1' });
      const rows = [...balMount.querySelectorAll('.city-money-row')];
      const upkeepRow = rows.find((r) => r.querySelector('.city-money-lbl')?.textContent === 'Utrzymanie surowców budynków');
      const mnoznikRow = rows.find((r) => r.querySelector('.city-money-lbl')?.textContent === 'Mnożnik zamożności W');
      const valEl = upkeepRow ? upkeepRow.querySelector('.city-money-val') : null;
      out.balance = {
        rowCount: rows.length,
        hasUpkeepRow: !!valEl,
        chipCount: valEl ? valEl.querySelectorAll('.bld-res-chip').length : -1,
        valText: valEl ? valEl.textContent : '',
        valHasRawHtml: valEl ? (valEl.textContent.includes('<') || valEl.textContent.includes('aria-label')) : true,
        valBareNames: valEl ? ['Drewno', 'Glina', 'Ruda żelaza'].filter((n) => labelRe(n).test(valEl.textContent)) : ['?'],
        mnoznikText: mnoznikRow ? mnoznikRow.querySelector('.city-money-val').textContent : '',
        mnoznikIsPlain: mnoznikRow ? !mnoznikRow.querySelector('.city-money-val').children.length : false,
        iconsOk: valEl ? [...valEl.querySelectorAll('.bld-res-chip-ic')].every((ic) => ic.querySelector('svg')) : false,
        gridOverflow: balMount.scrollWidth > balMount.clientWidth + 1,
      };

      // C. Empire line at 520 px (table cell) — no horizontal overflow.
      const empMount = mkMount('emp-mount');
      const empTbl = document.createElement('div');
      empTbl.style.width = '100%';
      empTbl.innerHTML = T.formatResourceUpkeepEmpireLineColored({ drewno: 4, glina: 2, ruda_zelaza: 3 });
      empMount.appendChild(empTbl);
      out.layout.push({ name: 'balance', overflow: balMount.scrollWidth > balMount.clientWidth + 1 });
      out.layout.push({ name: 'empire-colored', overflow: empMount.scrollWidth > empMount.clientWidth + 1 });
      return out;
    }, { panelWidth: PANEL_WIDTH_PX });

    // Assertions on the formatters.
    const fmtBad = res.formatter.filter((p) => p.bareName || !p.iconOk || p.hasHtmlLeak);
    check('A1: formatery (city + empire, ' + res.formatter.length + ' probek) bez gołych nazw surowców w widocznym tekście',
      fmtBad.filter((p) => p.bareName).length === 0,
      JSON.stringify(fmtBad.filter((p) => p.bareName).slice(0, 5).map((p) => [p.fn, p.key, p.visible])));
    check('A2: każdy chip formatera ma realną ikonę SVG z aria-label/title = nazwa surowca',
      fmtBad.filter((p) => !p.iconOk).length === 0,
      JSON.stringify(fmtBad.filter((p) => !p.iconOk).slice(0, 5).map((p) => [p.fn, p.key])));
    check('A3: formatery nie zwracają surowego HTML jako tekstu',
      fmtBad.filter((p) => p.hasHtmlLeak).length === 0);

    // Assertions on the balance card (the regression from Evaluator zarzut 1).
    const b = res.balance;
    check('B1: bilans miasta ma wiersz „Utrzymanie surowców budynków”', b.hasUpkeepRow, 'rows=' + b.rowCount);
    check('B2: wiersz utrzymania ma 3 chipy (jeden na surowiec)', b.chipCount === 3, 'chipCount=' + b.chipCount);
    check('B3: wiersz utrzymania NIE pokazuje surowego kodu HTML (regresja zarzutu 1)',
      !b.valHasRawHtml, JSON.stringify(b.valText));
    check('B4: wiersz utrzymania nie zawiera nazw słownych surowców', b.valBareNames.length === 0,
      JSON.stringify(b.valBareNames));
    check('B5: każdy chip w wierszu bilansu ma ikonę SVG', b.iconsOk === true);
    check('B6: pozostałe wiersze bilansu nadal tekstowe i zawierają wartość (×1.00)',
      b.mnoznikIsPlain && b.mnoznikText === '×1.00', JSON.stringify(b.mnoznikText));

    check('Z3: style chipa w panelu imperium bez otwierania panelu miasta (chip inline-flex, ikona flex)',
      res.z3.chipDisplay === 'inline-flex' && ['flex', 'inline-flex'].includes(res.z3.icDisplay), JSON.stringify(res.z3));

    // Layout at 520 px.
    for (const l of res.layout) check('C: brak poziomego przepełnienia przy 520 px — ' + l.name, !l.overflow);
    check('C: brak błędów strony podczas renderu', pageErrors.length === 0, JSON.stringify(pageErrors.slice(0, 3)));

    // Screenshots (before/after) on request.
    if (SHOTS_DIR) {
      await screenshot(page, `resource-icons-everywhere-${SHOT_TAG}-520px.png`);
      console.log('[resource-icons-everywhere] screenshot saved in ' + SHOTS_DIR);
    }
  } finally {
    await browser.close();
  }

  console.log('\nresource-icons-everywhere-render-test: ' + pass + ' PASS, ' + fail + ' FAIL');
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
