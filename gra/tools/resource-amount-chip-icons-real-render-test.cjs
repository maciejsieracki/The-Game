'use strict';
/**
 * resource-amount-chip-icons-real-render-test.cjs
 *
 * TEMAT: R-WEB-UI-CITY-BUILDINGS-RESOURCE-ICONS-Q1.
 *
 * Wiersze budynków w panelu miasta (utrzymanie, produkcja konwertera, łączne utrzymanie)
 * pokazywały nazwy surowców słowami ("−1 Drewno/t", "Prod.: −60 Glina/t"), które na
 * szerokości panelu (~520 px) nachodziły na siebie i były obcinane. Po zmianie każdy surowiec
 * jest ikoną z tego samego źródła co pasek zasobów / Spichlerz (mapResourceIconSvg,
 * resources-map/), a nazwa siedzi wyłącznie w title/aria-label ikony.
 *
 * Bramki:
 *  A. Pokrycie ikon: dla KAŻDEGO surowca z koszt_surowce / utrzymanie_surowce budynków
 *     z data/buildings.json oraz kluczy receptur konwerterów generator czipa daje realną
 *     ikonę SVG (nie fallback tekstowy), z title i aria-label = nazwa surowca.
 *  B. Wiersze w Chromium (prawdziwe funkcje cityPanel.ts): tekst wierszy utrzymania i
 *     produkcji NIE zawiera żadnej nazwy surowca (STOCK_RESOURCE_LABEL); każdy chip ma ikonę.
 *  C. Układ przy szerokości panelu 520 px: brak poziomego przepełnienia wiersza i kafelka
 *     utrzymania, brak nachodzenia nazwy budynku na kafelek utrzymania/produkcji.
 *  D. Zrzuty przed/po (BUILDING_RESOURCE_ICONS_SHOTS_DIR), jeśli ustawiono zmienną.
 *
 * ZAŁOŻENIA (jawnie):
 *  - Wiersz budynku jest składany w teście z tej samej powłoki CSS (.bld-owned-row / -hd /
 *    -tail / -conv-row) i z WYNIKÓW prawdziwych funkcji formatujących cityPanel.ts
 *    (formatBuildingUpkeepRowHtml, formatConverterProductionRowHtml). appendOwnedBuildingRow
 *    wymaga obiektu City z pełnym stanem gry, więc nie jest wywoływany wprost.
 *  - Liczby receptur konwertera (Garncarnia, Odlewnia brązu) są fixture'ami z
 *    tools/citypanel-konwerter-produkcja-test.cjs (era 1).
 *
 * Uruchomienie (z gra/): node tools/resource-amount-chip-icons-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[resource-amount-chip-icons] playwright missing — npm ci, then install Chromium');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const CHIP_MODULE = path.resolve(GRA, 'src', 'ui', 'resourceAmountChip.ts');
const HAS_CHIP = fs.existsSync(CHIP_MODULE);
const ENTRY = path.resolve(__dirname, '.resource-amount-chip-entry.ts');
const OUTFILE = path.resolve(__dirname, '.resource-amount-chip-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOTS_DIR = process.env.BUILDING_RESOURCE_ICONS_SHOTS_DIR
  ? path.resolve(process.env.BUILDING_RESOURCE_ICONS_SHOTS_DIR)
  : null;
const SHOT_TAG = process.env.BUILDING_RESOURCE_ICONS_SHOT_TAG || 'run';
const PANEL_WIDTH_PX = 520;

let pass = 0;
let fail = 0;
function check(name, condition, detail) {
  if (condition) { pass++; console.log('PASS: ' + name); }
  else {
    fail++;
    console.log('FAIL: ' + name + (detail === undefined ? '' : ' — ' + JSON.stringify(detail)));
  }
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

// Exposes the private formatting helpers of cityPanel.ts without editing the tracked file.
const exposeCityPanelPlugin = {
  name: 'expose-city-panel',
  setup(build) {
    build.onLoad({ filter: /cityPanel\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== path.resolve(GRA, 'src', 'ui', 'cityPanel.ts')) return null;
      return {
        contents: fs.readFileSync(args.path, 'utf8') + [
          '',
          'export {',
          '  buildingUpkeepDisplay as __buildingUpkeepDisplay,',
          '  formatBuildingUpkeepRowHtml as __formatBuildingUpkeepRowHtml,',
          '  formatConverterProductionRowHtml as __formatConverterProductionRowHtml,',
          '  formatBuildingUpkeepTotalHtml as __formatBuildingUpkeepTotalHtml,',
          '  formatBuildingUpkeepGridValue as __formatBuildingUpkeepGridValue,',
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
    console.log('[resource-amount-chip-icons] default Chromium unavailable, trying', FALLBACK_CHROME);
    return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function screenshot(page, name) {
  if (!SHOTS_DIR) return;
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS_DIR, name), fullPage: true });
}

// Resource keys that appear in building costs, upkeep and converter recipes (fixtures from
// citypanel-konwerter-produkcja-test era 1: Garncarnia, Odlewnia brazu).
const CONVERTER_FIXTURES = {
  garncarnia: { consumed: { glina: 50, drewno: 50 }, produced: { ceramika: 50 } },
  odlewnia_brazu: { consumed: { ruda: 50, drewno: 50, ruda_cyny: 5 }, produced: { braz: 50 } },
};
const ROW_FIXTURE_IDS = ['garncarnia', 'cegielnia', 'odlewnia_brazu', 'port', 'spichlerz_ii', 'spichlerz'];

async function main() {
  const chipImport = HAS_CHIP
    ? "import { resourceAmountChipHtml } from '../src/ui/resourceAmountChip.ts';"
    : '';
  const chipExport = HAS_CHIP ? 'resourceAmountChipHtml,' : '';
  fs.writeFileSync(ENTRY, [
    "import { STOCK_RESOURCE_LABEL } from '../src/game/building-stock-cost.ts';",
    "import { loadGameData } from '../src/data/loader.ts';",
    "import { DEFAULT_CONVERTER_RECIPES } from '../src/game/converters.ts';",
    "import * as CP from '../src/ui/cityPanel.ts';",
    chipImport,
    'const cp = CP as any;',
    'window.__C = {',
    '  STOCK_RESOURCE_LABEL, loadGameData, DEFAULT_CONVERTER_RECIPES, ' + chipExport,
    '  buildingUpkeepDisplay: cp.__buildingUpkeepDisplay,',
    '  formatBuildingUpkeepRowHtml: cp.__formatBuildingUpkeepRowHtml,',
    '  formatConverterProductionRowHtml: cp.__formatConverterProductionRowHtml,',
    '  formatBuildingUpkeepTotalHtml: cp.__formatBuildingUpkeepTotalHtml,',
    '  formatBuildingUpkeepGridValue: cp.__formatBuildingUpkeepGridValue,',
    '  ensureCityPanelStyles: cp.__ensureCityPanelStyles,',
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
    plugins: [viteCompatPlugin, exposeCityPanelPlugin],
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

    const result = await page.evaluate(({ rowIds, converterFixtures, panelWidth, hasChip }) => {
      const C = window.__C;
      const data = C.loadGameData();
      const byId = new Map(data.buildings.map((b) => [b.id, b]));
      C.ensureCityPanelStyles();
      const labels = C.STOCK_RESOURCE_LABEL;
      const out = { coverage: null, rows: [], layout: [], rowsMissing: [] };

      // A. Coverage of resource icons for every resource that a building cost/upkeep uses.
      const keys = new Set(Object.keys(converterFixtures.garncarnia.consumed));
      for (const f of Object.values(converterFixtures)) {
        for (const k of [...Object.keys(f.consumed), ...Object.keys(f.produced)]) keys.add(k);
      }
      for (const b of data.buildings) {
        for (const k of Object.keys(b.koszt_surowce ?? {})) keys.add(k);
        for (const k of Object.keys(b.utrzymanie_surowce ?? {})) keys.add(k);
      }
      // Every converter recipe in the game (inputs + output), not just the two fixtures above.
      for (const r of C.DEFAULT_CONVERTER_RECIPES) {
        for (const k of [...Object.keys(r.inputs), r.output]) keys.add(k);
      }
      const coverage = { total: keys.size, withIcon: 0, missing: [], badLabel: [], htmlSamples: {} };
      if (hasChip) {
        for (const k of keys) {
          const html = C.resourceAmountChipHtml(k, '−1', '/t');
          const label = labels[k] ?? k;
          const tmp = document.createElement('div');
          tmp.innerHTML = html;
          const icon = tmp.querySelector('.bld-res-chip-ic');
          const hasSvg = !!(icon && icon.querySelector('svg'));
          if (hasSvg) coverage.withIcon++; else coverage.missing.push(k);
          if (!icon || icon.getAttribute('aria-label') !== label || icon.getAttribute('title') !== label) {
            coverage.badLabel.push(k);
          }
          if (coverage.htmlSamples.drewno === undefined && k === 'drewno') coverage.htmlSamples.drewno = html;
        }
      }
      out.coverage = coverage;

      // Visible text of a row without the icon metadata (aria/title are not text nodes).
      const visibleText = (node) => node.textContent ?? '';
      const labelRe = (name) => new RegExp('(^|[^\\p{L}])' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^\\p{L}])', 'iu');
      const labelList = Object.values(labels);

      // B/C. Rows built from the production formatters, real panel CSS, fixed panel width.
      const stage = document.getElementById('stage');
      const mount = document.createElement('div');
      mount.className = 'bld-owned-compact-mount';
      mount.style.width = panelWidth + 'px';
      mount.style.background = '#14110c';
      mount.style.padding = '8px';
      stage.appendChild(mount);
      for (const id of rowIds) {
        const def = byId.get(id);
        if (!def) { out.rowsMissing.push(id); continue; }
        const upkeep = C.buildingUpkeepDisplay(def, 1);
        const row = document.createElement('div');
        row.className = 'bld-owned-row';
        row.dataset.id = id;
        const hd = document.createElement('div');
        hd.className = 'bld-owned-hd';
        const name = document.createElement('span');
        name.className = 'bld-owned-name';
        name.textContent = def.nazwa;
        hd.appendChild(name);
        row.appendChild(hd);
        const tail = document.createElement('div');
        tail.className = 'bld-owned-tail';
        const up = document.createElement('span');
        const hasUpkeep = upkeep.gold > 0 || Object.keys(upkeep.resources).length > 0;
        up.className = 'bld-owned-upkeep' + (hasUpkeep ? '' : ' muted');
        up.innerHTML = C.formatBuildingUpkeepRowHtml(upkeep, false);
        tail.appendChild(up);
        row.appendChild(tail);
        const fx = converterFixtures[id];
        if (fx) {
          const convHtml = C.formatConverterProductionRowHtml(fx, false);
          const convRow = document.createElement('div');
          convRow.className = 'bld-owned-conv-row';
          convRow.innerHTML = convHtml;
          row.appendChild(convRow);
        }
        mount.appendChild(row);

        const text = visibleText(up) + ' ' + (fx ? visibleText(row.querySelector('.bld-owned-conv-row')) : '');
        const leaked = labelList.filter((lbl) => labelRe(lbl).test(text));
        const chips = Array.from(row.querySelectorAll('.bld-res-chip'));
        const chipsWithoutIcon = chips.filter((c) => !c.querySelector('.bld-res-chip-ic svg')).length;
        out.rows.push({ id, name: def.nazwa, leaked, chipCount: chips.length, chipsWithoutIcon, text: text.replace(/\s+/g, ' ').trim() });

        // C. Layout checks in real pixels.
        const r = row.getBoundingClientRect();
        const h = hd.getBoundingClientRect();
        const t = tail.getBoundingClientRect();
        const overflowRow = row.scrollWidth - row.clientWidth;
        const overflowTail = tail.scrollWidth - tail.clientWidth;
        const overlapX = Math.min(h.right, t.right) - Math.max(h.left, t.left);
        const overlapY = Math.min(h.bottom, t.bottom) - Math.max(h.top, t.top);
        const insideRow = t.right <= r.right + 0.5 && h.left >= r.left - 0.5;
        out.layout.push({ id, overflowRow, overflowTail, overlapArea: overlapX > 0 && overlapY > 0 ? overlapX * overlapY : 0, insideRow, rowWidth: Math.round(r.width) });
      }
      return out;
    }, {
      rowIds: ROW_FIXTURE_IDS,
      converterFixtures: CONVERTER_FIXTURES,
      panelWidth: PANEL_WIDTH_PX,
      hasChip: HAS_CHIP,
    });

    // A. Coverage
    console.log('[coverage] ' + JSON.stringify(result.coverage.total) + ' resource keys');
    check('chip module present (src/ui/resourceAmountChip.ts)', HAS_CHIP, { path: CHIP_MODULE });
    check('A1: every resource key from building costs/upkeep/converters has a real SVG icon',
      HAS_CHIP && result.coverage.missing.length === 0 && result.coverage.withIcon === result.coverage.total,
      { total: result.coverage.total, withIcon: result.coverage.withIcon, missing: result.coverage.missing });
    check('A2: every icon carries title and aria-label equal to the resource name',
      HAS_CHIP && result.coverage.badLabel.length === 0, { badLabel: result.coverage.badLabel });

    // B. Rows
    check('B0: all fixture buildings exist in buildings.json', result.rowsMissing.length === 0, result.rowsMissing);
    for (const row of result.rows) {
      check(`B1 ${row.id}: no resource name as visible text in upkeep/production`, row.leaked.length === 0,
        { leaked: row.leaked, text: row.text });
      check(`B2 ${row.id}: every chip has an SVG icon`, HAS_CHIP && row.chipsWithoutIcon === 0,
        { chips: row.chipCount, withoutIcon: row.chipsWithoutIcon });
    }

    // C. Layout
    for (const l of result.layout) {
      check(`C1 ${l.id}: no horizontal overflow at ${PANEL_WIDTH_PX}px`, l.overflowRow <= 1 && l.overflowTail <= 1,
        { overflowRow: l.overflowRow, overflowTail: l.overflowTail, rowWidth: l.rowWidth });
      check(`C2 ${l.id}: name and upkeep/production tiles do not overlap`, l.overlapArea === 0 && l.insideRow,
        { overlapArea: l.overlapArea, insideRow: l.insideRow });
    }

    await screenshot(page, `resource-icons-${SHOT_TAG}-${PANEL_WIDTH_PX}px.png`);
    check('no page errors during render', pageErrors.length === 0, pageErrors.slice(0, 5));
  } finally {
    await browser.close();
  }

  console.log(`\nRESULT: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('[resource-amount-chip-icons] crashed:', error);
  process.exit(1);
});
