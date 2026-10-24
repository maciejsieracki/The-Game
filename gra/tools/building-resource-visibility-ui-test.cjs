'use strict';
/**
 * building-resource-visibility-ui-test.cjs -- R-WEB-RECRUIT-LIST-REGRESSION-Q1 r3 (2026-10-24).
 * Test DOM w PRAWDZIWYM Chromium (Playwright):
 *  B1-B4: lista budowy (renderBuildList z cityPanel.ts, dane realne gra/data/buildings.json):
 *    budynek z bramka surowca (Stolarnia / Drewno) bez zapasu jest WIDOCZNY jako wiersz
 *    wyszarzony (cannot-build-row, przycisk Buduj nieaktywny); z zapasem wiersz jest aktywny.
 *  P1-P4: modal Zastąp (unitReplacePicker.ts): pozycja z blockedReason jest wyszarzona,
 *    nie do wyboru, z przyczyna w tekscie; pozycja bez blokady dziala jak dotad.
 * Mutacja (usuniecie showResourceGatedBuildings w renderBuildList) musi czerwienic B1/B2.
 * Mutacja (usuniecie blockedReason z modala) musi czerwienic P1/P2.
 *
 * Usage (z gra/): node tools/building-resource-visibility-ui-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[building-resource-visibility-ui-test] playwright missing (npm ci --ignore-scripts w gra/)');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'recruit-list-visibility-ui-brandAssets-stub.ts');
const ENTRY = path.resolve(__dirname, '.building-resource-visibility-ui-entry.ts');
const OUTFILE = path.resolve(__dirname, '.building-resource-visibility-ui-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const cityPanelSrc = fs.readFileSync(path.join(GRA, 'src', 'ui', 'cityPanel.ts'), 'utf8');
const chipCssLines = cityPanelSrc.split('\n').filter(l => l.startsWith('.civ-cs .bld-infocard-chip'));
if (chipCssLines.length < 2) { console.error('nie znaleziono CSS chipa w cityPanel.ts'); process.exit(1); }

const stubPlugin = {
  name: 'stub-brand-assets',
  setup(build) { build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB })); },
};
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
    "import { configureCityPanel, renderBuildList } from '../src/ui/cityPanel.ts';",
    "import { showUnitReplacePicker, hideUnitReplacePicker } from '../src/ui/unitReplacePicker.ts';",
    "import unitsJson from '../data/units.json';",
    "import buildingsJson from '../data/buildings.json';",
    'window.__api = { configureCityPanel, renderBuildList, showUnitReplacePicker, hideUnitReplacePicker, units: unitsJson, buildings: buildingsJson };',
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

  // Lista budowy: nowa gra, epoka budynku Stolarnia, wszystkie technologie z danych, Drewno w magazynie = `drewno`.
  const runBuildList = async (drewno) => page.evaluate(({ drewno }) => {
    const A = window.__api;
    const data = { units: A.units, buildings: A.buildings, civs: [], tech: [] };
    const stolarnia = A.buildings.find(b => b.id === 'stolarnia');
    const techs = [...new Set(A.buildings.map(b => (b.techUnlock || '').toString().trim())
      .filter(t => t && t !== '-' && t !== '—'))];
    const city = { id: 'm1', name: 'Start', q: 0, r: 0, ownerId: 0, population: 3, surowce: { drewno } };
    A.configureCityPanel({
      data,
      getTreasury: () => 500,
      getCities: () => [city],
      // Epoka o jeden wyzej: Stolarnia (epokaWejscia 1) NIE jest w katalogu biezacej epoki,
      // wiec pojawia sie tylko przez liste budowy (buildableProduction), nie przez „Jeszcze zablokowane”.
      getEpoch: () => stolarnia.epokaWejscia + 1,
      getUnlockedTechs: () => techs,
      getBuiltBuildingIds: () => [],
      getEmpireBuiltIds: () => [],
      getEmpireStock: () => ({ drewno }),
      getCapitalCityId: () => city.id,
      getCityHasCoastOrRiver: () => true,
      onPurchaseBuilding: () => {},
    });
    const mount = document.getElementById('root');
    mount.innerHTML = '';
    A.renderBuildList(mount, city, data, null);
    const rows = [...mount.querySelectorAll('.bld-compact-row')];
    const row = rows.find(r => (r.querySelector('.bld-compact-name')?.textContent || '') === 'Stolarnia');
    if (!row) return { found: false, rowNames: rows.map(r => r.querySelector('.bld-compact-name')?.textContent) };
    const buduj = [...row.querySelectorAll('button')].find(b => /Buduj/.test(b.textContent || ''));
    return {
      found: true,
      cannotBuild: row.classList.contains('cannot-build-row'),
      canBuild: row.classList.contains('can-build-row'),
      budujDisabled: buduj ? !!buduj.disabled : null,
    };
  }, { drewno });

  console.log('\n-- LISTA BUDOWY: Stolarnia (wymaga Drewna), pusty magazyn --');
  const empty = await runBuildList(0);
  check('B1: Stolarnia widoczna jako wiersz mimo braku Drewna', empty.found === true, empty);
  check('B2: wiersz wyszarzony (cannot-build-row), przycisk Buduj nieaktywny',
    !!empty.found && empty.cannotBuild === true && empty.budujDisabled === true, empty);

  console.log('\n-- LISTA BUDOWY: Stolarnia, Drewno w magazynie (1000, koszt budowy pokryty) --');
  const stocked = await runBuildList(1000);
  check('B3: z Drewnem wiersz Stolarni aktywny (can-build-row)',
    !!stocked.found && stocked.canBuild === true && stocked.cannotBuild === false, stocked);

  // Modal Zastąp (unitReplacePicker.ts) -- realny DOM.
  const runPicker = async () => page.evaluate(() => {
    const A = window.__api;
    window.__picked = [];
    A.showUnitReplacePicker({
      unitName: 'Wojownik',
      skarb: 100,
      options: [
        { id: 'Oszczepnik', name: 'Oszczepnik', icon: '', surcharge: 0, atk: 1, def: 1, hpMax: 10,
          blockedReason: 'Brak w magazynie państwa: Drewno' },
        { id: 'Łucznik', name: 'Łucznik', icon: '', surcharge: 0, atk: 2, def: 1, hpMax: 10 },
      ],
      onPick: id => window.__picked.push(id),
    });
    const items = [...document.querySelectorAll('.civ-urp-item')];
    const blocked = items[0];
    const free = items[1];
    const blockedText = blocked ? blocked.textContent || '' : '';
    if (blocked) blocked.click();
    const afterBlocked = window.__picked.slice();
    const freeEl = document.querySelectorAll('.civ-urp-item')[1];
    if (freeEl) freeEl.click();
    const out = {
      count: items.length,
      blockedDisabled: !!blocked && blocked.classList.contains('disabled'),
      blockedTitle: blocked ? blocked.title : '',
      blockedShowsReason: blockedText.includes('Brak w magazynie państwa: Drewno'),
      freeDisabled: !!free && free.classList.contains('disabled'),
      pickedAfterBlocked: afterBlocked,
      pickedFinal: window.__picked.slice(),
    };
    A.hideUnitReplacePicker();
    return out;
  });

  console.log('\n-- MODAL ZASTĄP: pozycja bez zapasu surowca --');
  const pk = await runPicker();
  check('P1: pozycja z blockedReason ma klase disabled (wyszarzona)', pk.blockedDisabled === true, pk);
  check('P2: przyczyna braku widoczna w tekscie pozycji', pk.blockedShowsReason === true, pk);
  check('P3: klik w zablokowana pozycje nie wywoluje onPick', pk.pickedAfterBlocked.length === 0, pk.pickedAfterBlocked);
  check('P4: pozycja bez blokady nadal wybieralna', pk.pickedFinal.length === 1 && pk.pickedFinal[0] === 'Łucznik', pk.pickedFinal);
  check('P5: tooltip pozycji zablokowanej podaje przyczyne', /Brak w magazynie państwa: Drewno/.test(pk.blockedTitle), pk.blockedTitle);

  console.log('\nBledy strony: ' + pageErrors.length);
  pageErrors.slice(0, 5).forEach(e => console.log('  ' + e.slice(0, 200)));
  await browser.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error('[building-resource-visibility-ui-test] ERROR', e); process.exitCode = 1; })
  .finally(() => {
    for (const f of [ENTRY, OUTFILE]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }
    process.exit(process.exitCode || 0);
  });
