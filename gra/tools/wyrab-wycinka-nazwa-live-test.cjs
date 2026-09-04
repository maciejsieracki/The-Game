'use strict';
/**
 * wyrab-wycinka-nazwa-live-test.cjs
 *
 * TEMAT: P-ULEPSZENIA-WYRAB-WYCINKA-NAZWA-Q1.
 *
 * Zywy dowod w headless Chromium (nie zalozenie z kodu): panel budowy (build mode HUD)
 * renderuje etykiete ulepszenia terenu `wyrab` jako "Wycinka", nie "Wyrab" -- dokladnie
 * tym samym mechanizmem co produkcja: `label: meta?.nazwa ?? label` z
 * `createImprovementBuildApi.listTypes()` (gra/src/map/improvement-build.ts), gdzie `meta`
 * pochodzi z `getImprovementMeta('wyrab')` (gra/src/game/improvement-tech.ts, czyta
 * `gra/data/terrain-improvements.json`) i zawsze wygrywa nad statyczna etykieta z
 * `gra/src/render/improvements.ts` (ta druga jest wiec martwa dla tego klucza -- test to
 * potwierdza asercja [2]).
 *
 * Sprawdza takze hinty z main.ts (kryterium 2 dispatchu) na poziomie zrodla (dokladny
 * literal), bo wywolanie tych fragmentow main.ts wymagaloby pelnego stanu gry.
 *
 * Usage (z gra/): node tools/wyrab-wycinka-nazwa-live-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[wyrab-wycinka-nazwa-live-test] playwright missing');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ENTRY = path.resolve(__dirname, '.wyrab-wycinka-live-entry.ts');
const OUTFILE = path.resolve(__dirname, '.wyrab-wycinka-live-bundle.cjs');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_STUB = path.resolve(STUB_DIR, 'build-panel-scroll-brandAssets-stub.ts');
const OWL_STUB = path.resolve(STUB_DIR, 'build-panel-scroll-scienceOwlIcon-stub.ts');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) { return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] }); }
}

async function main() {
  // -----------------------------------------------------------------------
  // [1] Zywy DOM: createBuildModeHud renderuje "Wycinka" dla klucza 'wyrab',
  //     etykieta pochodzi z getImprovementMeta('wyrab').nazwa (JSON), dokladnie
  //     jak listTypes() w improvement-build.ts.
  // -----------------------------------------------------------------------
  fs.writeFileSync(
    ENTRY,
    [
      "import { createBuildModeHud } from '../src/ui/buildModeHud.ts';",
      "import { getImprovementMeta } from '../src/game/improvement-tech.ts';",
      "import { IMPROVEMENTS } from '../src/render/improvements.ts';",
      'window.__createBuildModeHud = createBuildModeHud;',
      'window.__getImprovementMeta = getImprovementMeta;',
      'window.__IMPROVEMENTS = IMPROVEMENTS;',
      '',
    ].join('\n'),
    'utf8',
  );

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: OUTFILE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json', '.css': 'text' },
    plugins: [{
      name: 'stub-icons',
      setup(build) {
        build.onResolve({ filter: /(^|\/)brandAssets$/ }, () => ({ path: BRAND_STUB }));
        build.onResolve({ filter: /(^|\/)scienceOwlIcon$/ }, () => ({ path: OWL_STUB }));
      },
    }],
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  const bundleJs = fs.readFileSync(OUTFILE, 'utf8');
  await page.setContent('<div id="root"></div>');
  await page.addScriptTag({ content: bundleJs });

  const result = await page.evaluate(() => {
    // Odtwarza DOKLADNIE formule z improvement-build.ts::listTypes():
    //   label: meta?.nazwa ?? label
    const staticEntry = window.__IMPROVEMENTS.find((t) => t.key === 'wyrab');
    const meta = window.__getImprovementMeta('wyrab');
    const types = [{
      key: 'wyrab',
      label: (meta && meta.nazwa) ?? staticEntry.label,
      kosztPraca: meta ? meta.kosztPraca : 0,
      epoka: staticEntry.epoka,
      techUnlocked: true,
      techLabel: null,
      lockHint: null,
    }];
    const hud = window.__createBuildModeHud({
      listTypes: () => types,
      getActiveKey: () => null,
      onSelectType: () => {},
      onExit: () => {},
      isOpen: () => true,
      getPracaPool: () => 999,
      canFoundCity: () => false,
      isFoundCityActive: () => false,
      isFoundCityOnly: () => false,
      getFoundCityCostLabel: () => '0 P',
      listWonders: () => [],
      getActiveWonderId: () => null,
      getWonderTargetLabel: () => '',
      listPlayerCities: () => [{ id: 'c1', name: 'Roma' }],
      getUlepszeniaCityId: () => 'c1',
      getUlepszeniaEmpireState: () => ({ focus: 'zywnosc', tryb: 'auto', pracaAutoPercent: 30, onlyWorked: false }),
      getUlepszeniaEffectiveState: () => ({ focus: 'zywnosc', tryb: 'auto', pracaAutoPercent: 30, onlyWorked: false, override: false }),
      getUlepszeniaCityOverride: () => false,
    });
    hud.update();
    const panelText = document.body.textContent || '';
    return {
      staticLabel: staticEntry.label,
      metaNazwa: meta && meta.nazwa,
      effectiveLabel: types[0].label,
      panelText,
      panelHasWycinka: panelText.includes('Wycinka'),
      panelHasWyrab: panelText.includes('Wyrąb'),
    };
  });

  check('[1] JSON meta.nazwa dla "wyrab" == "Wycinka"', result.metaNazwa === 'Wycinka', result.metaNazwa);
  check('[1] panel budowy (zywy DOM) zawiera tekst "Wycinka"', result.panelHasWycinka, result.panelText.slice(0, 300));
  check('[1] panel budowy (zywy DOM) NIE zawiera "Wyrąb"', !result.panelHasWyrab);

  // -----------------------------------------------------------------------
  // [2] improvements.ts label (statyczna lista) potwierdzona MARTWA dla tego
  //     klucza: meta zawsze istnieje dla 'wyrab' (wpis w JSON), wiec fallback
  //     na staticEntry.label nigdy nie jest uzywany w produkcji. Test i tak
  //     zmienia ja (allowlist), bo to jedyna zywa proba jej uzycia w repo.
  // -----------------------------------------------------------------------
  check('[2] improvements.ts static label dla "wyrab" == "Wycinka" (zmieniona zgodnie z allowlista)',
    result.staticLabel === 'Wycinka', result.staticLabel);
  check('[2] meta.nazwa (JSON, zawsze wygrywa w listTypes()) != null -- staticEntry.label jest martwy dla "wyrab"',
    result.metaNazwa !== null && result.metaNazwa !== undefined);

  await browser.close();
  check('brak bledow konsoli/pageerror', consoleErrors.length === 0, consoleErrors);

  // -----------------------------------------------------------------------
  // [3] Literalne stringi main.ts (hinty gracza) -- kryterium 2 dispatchu.
  // -----------------------------------------------------------------------
  const mainTs = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
  check('[3] main.ts: hint zaznaczenia akcji wycinki zawiera "Wycinka" (nie "Wyrąb")',
    mainTs.includes("'Wycinka' + costPart + ': +20 Pracy/turę przez 3 tury"));
  check('[3] main.ts: hint po zbiorze Drewna zawiera "Wycinka" (nie "Wyrąb")',
    mainTs.includes("'Wycinka: +' + drewnoCredit + ' Drewna"));
  check('[3] main.ts: log konsoli AI zawiera "Wycinka" (opcjonalne, dla spojnosci)',
    mainTs.includes('] Wycinka @ (${cmd.q},${cmd.r})'));

  // -----------------------------------------------------------------------
  // [4] improvement-build.ts: komunikat blokady lasu -- TYLKO nazwa w nawiasie
  //     zmieniona, czasownik "wyrąb" NIETKNIĘTY.
  // -----------------------------------------------------------------------
  const buildTs = fs.readFileSync(path.join(GRA, 'src', 'map', 'improvement-build.ts'), 'utf8');
  check('[4] improvement-build.ts: "najpierw wyrąb las" (czasownik) NIETKNIĘTY',
    buildTs.includes('najpierw wyrąb las (Wycinka w panelu ulepszeń)'));

  console.log('');
  console.log(`[wyrab-wycinka-nazwa-live-test] ${pass} pass, ${fail} fail`);
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }
  process.exit(1);
});
