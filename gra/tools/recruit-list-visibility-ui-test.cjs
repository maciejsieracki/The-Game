'use strict';
/**
 * recruit-list-visibility-ui-test.cjs -- R-WEB-RECRUIT-LIST-REGRESSION-Q1 (2026-10-24).
 * Test DOM w PRAWDZIWYM Chromium (Playwright) na PRAWDZIWYM cityPanel.ts:
 *  - lista panelu (recruitPanelPurchasableUnits, dane z gra/data/units.json) dla nowej gry
 *    z pusta pula Drewna ma >=2 jednostki wojskowe;
 *  - kazdy wiersz trafia przez appendUnitRecruitCompactRow: jednostka bez zapasu jest
 *    WIDOCZNA, wyszarzona (is-disabled, button.disabled), z chipem „brak Drewno (N)"
 *    i tooltipem „Brakuje w magazynie"; z zapasem -- aktywna, bez chipa braku.
 * Mutacja (usuniecie showStockGatedUnits w recruitPanelPurchasableUnits) musi czerwienic U1/U3.
 * Mutacja (przywrocenie ukrywania w production.ts) czerwieni U1/U3 przez brak wojskowych.
 *
 * Usage (z gra/): node tools/recruit-list-visibility-ui-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[recruit-list-visibility-ui-test] playwright missing (npm ci --ignore-scripts w gra/)');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'recruit-list-visibility-ui-brandAssets-stub.ts');
const ENTRY = path.resolve(__dirname, '.recruit-list-visibility-ui-entry.ts');
const OUTFILE = path.resolve(__dirname, '.recruit-list-visibility-ui-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const cityPanelSrc = fs.readFileSync(path.join(GRA, 'src', 'ui', 'cityPanel.ts'), 'utf8');
const chipCssLines = cityPanelSrc.split('\n').filter(l => l.startsWith('.civ-cs .bld-infocard-chip'));
if (chipCssLines.length < 2) { console.error('nie znaleziono CSS chipa w cityPanel.ts'); process.exit(1); }

const stubPlugin = {
  name: 'stub-brand-assets',
  setup(build) { build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB })); },
};
// Vite-owe `import.meta.glob(...)` (leaderPortraits, sidePanelEventFilter, unitVitalsPalette, ...)
// nie istnieje w esbuild/iife -- w tym tescie (DOM wiersza rekrutacji) ikony sa bez znaczenia,
// wiec glob zwraca pusty obiekt.
const importGlobPlugin = {
  name: 'import-meta-glob-empty',
  setup(build) {
    build.onLoad({ filter: /\/src\/.*\.ts$/ }, async args => {
      const c = await fs.promises.readFile(args.path, 'utf8');
      if (!c.includes('import.meta.glob')) return undefined;
      return { contents: c.replace(/import\.meta\.glob\(/g, '((..._g) => ({}))('), loader: 'ts' };
    });
  },
};
// Vite-owe `import X from '*?raw'` (svg, css) -> tekst pliku.
const svgRawPlugin = {
  name: 'svg-raw',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, args => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'svg-raw',
    }));
    build.onLoad({ filter: /.*/, namespace: 'svg-raw' }, args => ({
      contents: 'export default ' + JSON.stringify(fs.readFileSync(args.path, 'utf8')) + ';',
      loader: 'js',
    }));
  },
};

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { configureCityPanel, recruitPanelPurchasableUnits, appendUnitRecruitCompactRow } from '../src/ui/cityPanel.ts';",
    "import { UNIT_RECRUIT_CARD_CSS } from '../src/ui/unitRecruitCard.ts';",
    "import unitsJson from '../data/units.json';",
    "import buildingsJson from '../data/buildings.json';",
    'window.__api = { configureCityPanel, recruitPanelPurchasableUnits, appendUnitRecruitCompactRow, UNIT_RECRUIT_CARD_CSS, units: unitsJson, buildings: buildingsJson };',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' }, plugins: [stubPlugin, importGlobPlugin, svgRawPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.setContent('<div class="civ-cs" id="root"></div>');
  await page.addStyleTag({ content: chipCssLines.join('\n') });
  await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
  if (await page.evaluate(() => !window.__api)) {
    throw new Error('bundle nie zainicjowal window.__api; bledy strony: ' + JSON.stringify(pageErrors.slice(0, 3)).slice(0, 400));
  }

  // Scenariusz: nowa gra (Kamien, epoka 1), skarb 55 zlota, rekruci 4000, miasto bez zapasu Drewna.
  const run = async (drewnoPool) => page.evaluate(({ drewnoPool }) => {
    const A = window.__api;
    if (!document.getElementById('urc-css')) {
      const s = document.createElement('style'); s.id = 'urc-css'; s.textContent = A.UNIT_RECRUIT_CARD_CSS;
      document.head.appendChild(s);
    }
    const city = { id: 'm1', name: 'Start', q: 0, r: 0, ownerId: 0, population: 3, surowce: { drewno: drewnoPool } };
    const data = { units: A.units, buildings: A.buildings, civs: [], tech: [] };
    A.configureCityPanel({
      data,
      getTreasury: () => 55,
      getCities: () => [city],
      getEpoch: () => 1,
      getUnlockedTechs: () => [],
      getEmpireRekruciTotal: () => 4000,
      getBuiltBuildingIds: () => [],
      getEmpireBuiltIds: () => [],
      onPurchaseUnit: () => {},
    });
    const items = A.recruitPanelPurchasableUnits(city, data);
    const root = document.getElementById('root');
    root.innerHTML = '';
    const scroll = document.createElement('div');
    root.appendChild(scroll);
    for (const item of items) A.appendUnitRecruitCompactRow(scroll, city, item, data, 55);
    const rows = [...scroll.querySelectorAll('.unit-recruit-compact-row')];
    const info = rows.map(row => {
      const btn = row.querySelector('.unit-recruit-submit');
      const stock = row.querySelector('.bld-infocard-chip.stock-missing');
      return {
        name: (row.textContent || '').slice(0, 80),
        disabledRow: row.classList.contains('is-disabled'),
        btnDisabled: btn ? !!btn.disabled : null,
        btnTitle: btn ? (btn.title || '') : '',
        stockChipText: stock ? stock.textContent : null,
      };
    });
    return { ids: items.map(i => i.id), info };
  }, { drewnoPool });

  const MILITARY = ['Wojownik', 'Oszczepnik'];

  console.log('\n-- NOWA GRA, PUSTA PULA DREWNA (0) --');
  const empty = await run(0);
  const militaryEmpty = empty.ids.filter(id => MILITARY.includes(id));
  check('U1: lista panelu ma >=2 jednostki wojskowe przy braku Drewna', militaryEmpty.length >= 2, empty.ids);
  check('U2: Zwiadowca widoczny', empty.ids.includes('Zwiadowca'), empty.ids);
  for (const name of MILITARY) {
    const r = empty.info.find(x => x.name.startsWith(name));
    check(`U3: ${name} widoczny jako wiersz`, !!r, empty.info.map(x => x.name));
    if (!r) continue;
    check(`U4: ${name} wiersz wyszarzony (is-disabled)`, r.disabledRow === true, r);
    check(`U5: ${name} przycisk Rekrutuj nieaktywny`, r.btnDisabled === true, r);
    check(`U6: ${name} chip braku ma tekst „N Drewno (brak)"`,
      !!r.stockChipText && /^\d+ Drewno \(brak\)$/.test(r.stockChipText), r.stockChipText);
    check(`U7: ${name} tooltip przycisku podaje przyczyne`,
      /Brakuje w magazynie: \d+ Drewno/.test(r.btnTitle), { btn: r.btnTitle });
  }
  const zw = empty.info.find(x => x.name.startsWith('Zwiadowca'));
  check('U8: Zwiadowca nie jest wyszarzony (brak wymagan surowca)', !!zw && zw.disabledRow === false && zw.btnDisabled === false, zw);

  console.log('\n-- Z ZAPASEM DREWNA (50) --');
  const stocked = await run(50);
  const wok = stocked.info.find(x => x.name.startsWith('Wojownik'));
  check('U9: z Drewnem Wojownik aktywny (bez is-disabled, przycisk wlaczony)',
    !!wok && wok.disabledRow === false && wok.btnDisabled === false, wok);
  check('U10: z Drewnem brak chipa braku', !!wok && wok.stockChipText === null, wok && wok.stockChipText);

  console.log('\nBledy strony: ' + pageErrors.length);
  pageErrors.slice(0, 5).forEach(e => console.log('  ' + e.slice(0, 200)));
  await browser.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error('[recruit-list-visibility-ui-test] ERROR', e); process.exitCode = 1; })
  .finally(() => {
    for (const f of [ENTRY, OUTFILE]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }
    process.exit(process.exitCode || 0);
  });
