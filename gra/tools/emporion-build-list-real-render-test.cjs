'use strict';
/**
 * emporion-build-list-real-render-test.cjs -- R-WEB-BUILDING-EMPORION-Q1, runda 3 (poprawka FC R2).
 *
 * Dowód w PRAWDZIWYM Chromium (Playwright), nie w grep/jsdom (R-PROC-AUTOBOT §9 pkt 6a):
 *   Bundel esbuild z realnego cityPanel.ts (renderBuildList = lista „Dostępne do budowy”),
 *   dane realne: gra/data/buildings.json + gra/data/tech.json.
 *   Scenariusze (ta sama epoka 2 = Brąz, Emporion epokaWejscia 2):
 *     S1 brak Handel, brak Targowiska w mieście  -> chip „Wymagane badania: Handel” (unmet)
 *                                                  i „W mieście: Targowisko” (unmet)
 *     S2 Handel, brak Targowiska w mieście       -> chip „W mieście: Targowisko” (unmet), Handel met
 *     S3 Handel + Targowisko w mieście, surowce  -> Emporion na liście jako aktywny wiersz
 *                                                  (can-build-row, Buduj aktywny), oba chipy met
 *     S4 Handel + Targowisko, pusty magazyn      -> Emporion widoczny jako wyszarzony (cannot-build-row)
 *   Zrzuty PNG: dyspozycje/autobot/runs/R-WEB-BUILDING-EMPORION-Q1/ (sciezki w KATALOG_ZRZUTOW).
 *
 * Usage (z gra/): node tools/emporion-build-list-real-render-test.cjs
 * Wymaga: npm ci --ignore-scripts (gra/), Chromium /opt/pw-browsers/chromium-1194.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[emporion-build-list-real-render-test] playwright missing (npm ci --ignore-scripts w gra/)');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const REPO = path.resolve(GRA, '..');
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'recruit-list-visibility-ui-brandAssets-stub.ts');
const ENTRY = path.resolve(__dirname, '.emporion-build-list-entry.ts');
const OUTFILE = path.resolve(__dirname, '.emporion-build-list-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const KATALOG_ZRZUTOW = path.resolve(REPO, 'dyspozycje', 'autobot', 'runs', 'R-WEB-BUILDING-EMPORION-Q1');

const cityPanelSrc = fs.readFileSync(path.join(GRA, 'src', 'ui', 'cityPanel.ts'), 'utf8');

// Eksport wewnetrznych funkcji cityPanel.ts TYLKO do bundla testowego (plik w repo bez zmian).
const exposePlugin = {
  name: 'expose-city-panel-internals',
  setup(build) {
    build.onLoad({ filter: /src\/ui\/cityPanel\.ts$/ }, args => {
      if (path.resolve(args.path) !== path.resolve(GRA, 'src', 'ui', 'cityPanel.ts')) return undefined;
      return {
        contents: cityPanelSrc + '\nexport { productionCtxForCity, buildingRequirementChips, appendBuildingRequirementsBlock, ensureStyles };\n',
        loader: 'ts',
        resolveDir: path.dirname(args.path),
      };
    });
  },
};
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
    "import { configureCityPanel, renderBuildList, productionCtxForCity, buildingRequirementChips, appendBuildingRequirementsBlock, ensureStyles } from '../src/ui/cityPanel.ts';",
    "import unitsJson from '../data/units.json';",
    "import buildingsJson from '../data/buildings.json';",
    "import techJson from '../data/tech.json';",
    'window.__api = { configureCityPanel, renderBuildList, productionCtxForCity, buildingRequirementChips, appendBuildingRequirementsBlock, ensureStyles, units: unitsJson, buildings: buildingsJson, tech: techJson };',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [exposePlugin, stubPlugin, importGlobPlugin, svgRawPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.setContent('<!DOCTYPE html><html><head><style>'
    + ':root{--panel:#141a22;--panel2:#1b2430;--border:#2b3543;--muted:#8a96a6;--gold:#e8d88a;--text:#e6ebf2;}'
    + 'body{margin:0;background:#0b0f16;color:var(--text);font:13px system-ui,sans-serif;}'
    + '#root{padding:10px;width:400px;}'
    + '</style></head><body><div class="civ-cs" id="root"></div></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
  if (await page.evaluate(() => !window.__api)) {
    throw new Error('bundle nie zainicjowal window.__api; bledy: ' + JSON.stringify(pageErrors.slice(0, 3)).slice(0, 400));
  }
  // Pelny CSS panelu miasta (ta sama funkcja co w grze), panel osadzony statycznie zamiast position:fixed.
  await page.evaluate(() => {
    window.__api.ensureStyles();
    const st = document.createElement('style');
    st.textContent = '#root.civ-cs{position:static;inset:auto;display:block;pointer-events:auto;width:400px;height:auto;}';
    document.head.appendChild(st);
  });

  // Scenariusz: epoka 2 (Brąz), Emporion w katalogu; techs / budynki miasta / zapas surowców zmienne.
  const run = async ({ techs, built, drewno, kamien }) => page.evaluate(({ techs, built, drewno, kamien }) => {
    const A = window.__api;
    const data = { units: A.units, buildings: A.buildings, civs: [], tech: [] };
    const city = { id: 'm1', name: 'Start', q: 0, r: 0, ownerId: 0, population: 3,
      surowce: { drewno, kamien } };
    const builtIds = built ? ['targowisko'] : [];
    A.configureCityPanel({
      data,
      getTreasury: () => 500,
      getCities: () => [city],
      getEpoch: () => 2,
      getUnlockedTechs: () => techs,
      getBuiltBuildingIds: () => builtIds,
      getEmpireBuiltIds: () => builtIds,
      getEmpireStock: () => ({ drewno, kamien }),
      getCapitalCityId: () => city.id,
      getCityHasCoastOrRiver: () => true,
      onPurchaseBuilding: () => {},
    });
    const mount = document.getElementById('root');
    mount.innerHTML = '';
    A.renderBuildList(mount, city, data, null);
    const rows = [...mount.querySelectorAll('.bld-compact-row')];
    const row = rows.find(r => (r.querySelector('.bld-compact-name')?.textContent || '') === 'Emporion');
    const emp = A.buildings.find(b => b.id === 'emporion');
    const ctx = A.productionCtxForCity(city);
    const chips = A.buildingRequirementChips(emp, city, data, ctx, techs)
      .map(c => ({ label: c.label, met: c.met, kind: c.kind }));
    const reqDiv = document.createElement('div');
    reqDiv.className = 'civ-detail-scope';
    reqDiv.style.cssText = 'position:static;display:block;width:380px;padding:6px 4px;';
    A.appendBuildingRequirementsBlock(reqDiv, emp, city, data, ctx, techs);
    const chipEls = [...reqDiv.querySelectorAll('.bld-req-chip')].map(c => ({
      text: (c.textContent || '').trim(), met: c.classList.contains('met'),
    }));
    const eyebrows = [...reqDiv.querySelectorAll('.bld-infocard-eyebrow')].map(e => e.textContent.trim());
    mount.insertBefore(reqDiv, mount.firstChild);
    const buduj = row ? [...row.querySelectorAll('button')].find(b => /Buduj/.test(b.textContent || '')) : null;
    return {
      inList: !!row,
      canBuild: !!row && row.classList.contains('can-build-row'),
      cannotBuild: !!row && row.classList.contains('cannot-build-row'),
      budujDisabled: buduj ? !!buduj.disabled : null,
      chips, chipEls, eyebrows,
      listNames: rows.map(r => r.querySelector('.bld-compact-name')?.textContent || ''),
    };
  }, { techs, built, drewno, kamien });

  const shot = async (name) => {
    const f = path.join(KATALOG_ZRZUTOW, name);
    await page.locator('#root').screenshot({ path: f });
    return f;
  };
  const chipText = (r, text) => r.chipEls.find(c => c.text.includes(text));

  console.log('\n-- S1: brak badania Handel i brak Targowiska w mieście --');
  const s1 = await run({ techs: [], built: false, drewno: 0, kamien: 0 });
  const s1Shot = await shot('emporion-s1-brak-warunkow.png');
  check('S1: chip „Handel” (wymagane badanie) jest niespełniony',
    !!chipText(s1, 'Handel') && chipText(s1, 'Handel').met === false, s1.chipEls);
  check('S1: chip „W mieście: Targowisko” jest niespełniony',
    !!chipText(s1, 'W mieście: Targowisko') && chipText(s1, 'W mieście: Targowisko').met === false, s1.chipEls);
  check('S1: sekcje „Wymagane badania” i „Wymagane warunki” są wyrenderowane',
    s1.eyebrows.includes('Wymagane badania') && s1.eyebrows.includes('Wymagane warunki'), s1.eyebrows);

  console.log('\n-- S2: Handel jest, brak Targowiska w mieście --');
  const s2 = await run({ techs: ['Handel'], built: false, drewno: 0, kamien: 0 });
  check('S2: chip „Handel” spełniony', !!chipText(s2, 'Handel') && chipText(s2, 'Handel').met === true, s2.chipEls);
  check('S2: chip „W mieście: Targowisko” niespełniony',
    !!chipText(s2, 'W mieście: Targowisko') && chipText(s2, 'W mieście: Targowisko').met === false, s2.chipEls);
  check('S2: Emporion nie jest aktywny (brak Targowiska)', s2.canBuild === false, { canBuild: s2.canBuild, budujDisabled: s2.budujDisabled });

  console.log('\n-- S3: Handel + Targowisko w mieście + surowce (1000/1000, koszt Emporion w magazynie to 320 drewna i 240 kamienia) --');
  const s3 = await run({ techs: ['Handel'], built: true, drewno: 1000, kamien: 1000 });
  const s3Shot = await shot('emporion-s3-lista-budowy-aktywny.png');
  check('S3: Emporion widoczny na liście „Dostępne do budowy”', s3.inList === true, s3.listNames);
  check('S3: wiersz Emporion aktywny (can-build-row)', s3.canBuild === true && s3.cannotBuild === false, s3);
  check('S3: przycisk Buduj Emporion aktywny', s3.budujDisabled === false, s3.budujDisabled);
  check('S3: chip „Handel” spełniony', !!chipText(s3, 'Handel') && chipText(s3, 'Handel').met === true, s3.chipEls);
  check('S3: chip „W mieście: Targowisko” spełniony',
    !!chipText(s3, 'W mieście: Targowisko') && chipText(s3, 'W mieście: Targowisko').met === true, s3.chipEls);

  console.log('\n-- S4: Handel + Targowisko, pusty magazyn --');
  const s4 = await run({ techs: ['Handel'], built: true, drewno: 0, kamien: 0 });
  const s4Shot = await shot('emporion-s4-brak-surowcow-wyszarzony.png');
  check('S4: Emporion widoczny jako wyszarzony wiersz (cannot-build-row)',
    s4.inList === true && s4.cannotBuild === true, s4);
  check('S4: przycisk Buduj nieaktywny przy braku surowców', s4.budujDisabled === true, s4.budujDisabled);

  console.log('\nZrzuty: ' + [s1Shot, s3Shot, s4Shot].join(' | '));
  console.log('Bledy strony: ' + pageErrors.length);
  pageErrors.slice(0, 5).forEach(e => console.log('  ' + e.slice(0, 200)));
  await browser.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error('[emporion-build-list-real-render-test] ERROR', e); process.exitCode = 1; })
  .finally(() => {
    for (const f of [ENTRY, OUTFILE]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }
    process.exit(process.exitCode || 0);
  });
