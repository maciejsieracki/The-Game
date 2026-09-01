'use strict';
/**
 * citypanel-uwagi-hostcard-removed-real-render-test.cjs
 *
 * TEMAT: R-KARTY-HISTORIA-INFRA-Q1, RUNDA 2 (ECHO właściciela na końcu 00-dispatch.md).
 *
 * Runda 1 użyła jako dowodu izolowanej ścieżki `entityCards` (adapter + renderer
 * wywołane wprost w teście), z pominięciem HOSTA (`cityPanel.ts`), który doklejał
 * osobny wiersz/kafelek „Uwagi" PO wyrenderowaniu karty — Evaluator/Final Control
 * uznali to za błąd metodologii dowodowej (Zarzut 2). Ten test bunduje przez esbuild
 * PRAWDZIWY `src/ui/cityPanel.ts` (nie kopię, nie wyciąg) i woła DOKŁADNIE te same
 * funkcje, których używa realny hover/klik w panelu miasta:
 *   - `buildBuildingDetailCard(def, data, city)` — wołana z `attachHoverDetail`/
 *     `showHoverDetailNow` w liniach ~8714/~8718 (lista „Dostępne do budowy").
 *   - `buildUnitDetailCard(u, data)` — wołana z `attachHoverDetail` w ~7637/7781/7838
 *     (miniatury/wiersze rekrutacji).
 * Obie funkcje nie są eksportowane produkcyjnie (celowo — publiczne API modułu to
 * `showCityPanel`/`hideCityPanel`/`isCityPanelOpen`), więc test dokłada `export {...}`
 * WYŁĄCZNIE w buforze esbuild (`onLoad`, bez dotykania pliku w repo — ten sam wzorzec
 * co `empire-trade-route-split-real-render-test.cjs`).
 *
 * DOWÓD: `stolarnia` (`data/buildings.json`) ma DZIŚ realne, niepuste `uwagi`
 * ("B-SUROW-BUD-03: ..."), `Procarz` (`data/units.json`) ma realne, niepuste `Uwagi`
 * — ZERO mutacji danych. Real `page.hover()` na realnym anchor-elemencie przez
 * prawdziwy `attachHoverDetail` (import z `hoverDetailDock.ts`, nie symulacja),
 * zrzut PRZED/PO, i asercja że w DOM wyrenderowanej karty NIE ISTNIEJE żaden wiersz/
 * kafelek z etykietą „Uwagi" (tytuł kafelka `beginBuildingDetailTile(card,'Uwagi')`
 * ani klasa `.dc-note` z tekstem `uwagi`/`Uwagi`).
 *
 * Usage (z gra/): node tools/citypanel-uwagi-hostcard-removed-real-render-test.cjs
 *   --shots <katalog>  zrzuty PRZED/PO
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[citypanel-uwagi-hostcard-removed-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
// Stub WŁASNY tego testu (nie dzielony z innymi bramkami — P-BRAMKA-STUB-KOLIZJA-
// WSPOLDZIELONY): cityPanel.ts ciągnie DUŻO więcej modułów niż entity-card-contract-test
// (buildModeHud, sidePanelHud, iconRegistry.ts wewnątrz icons/ z relatywnym "./brandAssets"
// itd.), więc pokrywa WSZYSTKIE eksporty realnych plików ikon (puste no-opy — test nie
// weryfikuje ikon brandu, tylko brak wiersza "Uwagi").
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'citypanel-uwagi-hostcard-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'citypanel-uwagi-hostcard-scienceOwlIcon-stub.ts');
const HUD_STUB = path.resolve(STUB_DIR, 'citypanel-uwagi-hostcard-hud-stub.ts');
const LEADER_PORTRAITS_STUB = path.resolve(STUB_DIR, 'citypanel-uwagi-hostcard-leaderPortraits-stub.ts');
const CITY_PANEL_TS = path.resolve(GRA, 'src', 'ui', 'cityPanel.ts');
const ENTRY = path.resolve(__dirname, '.citypanel-uwagi-hostcard-entry.ts');
const OUTFILE = path.resolve(__dirname, '.citypanel-uwagi-hostcard-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const SHOTS = argOf('--shots');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const stubPlugin = {
  name: 'stub-icons-and-export-private-fns',
  setup(build) {
    build.onResolve({ filter: /(^|\/)brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /(^|\/)scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
    build.onResolve({ filter: /(^|\/)hud$/ }, () => ({ path: HUD_STUB }));
    build.onResolve({ filter: /(^|\/)leaderPortraits$/ }, () => ({ path: LEADER_PORTRAITS_STUB }));
    // Dokłada eksport dwóch PRYWATNYCH funkcji cityPanel.ts WYŁĄCZNIE w buforze esbuild
    // (produkcyjny plik w repo zostaje bez `export`) -- ten sam wzorzec co
    // empire-trade-route-split-real-render-test.cjs (onLoad, bez dotykania repo).
    build.onLoad({ filter: /cityPanel\.ts$/ }, (args) => {
      let src = fs.readFileSync(args.path, 'utf8');
      if (!/function buildBuildingDetailCard\(/.test(src) || !/function buildUnitDetailCard\(/.test(src)) {
        throw new Error('kotwica buildBuildingDetailCard/buildUnitDetailCard nie znaleziona w cityPanel.ts');
      }
      src += '\nexport { buildBuildingDetailCard, buildUnitDetailCard };\n';
      return { contents: src, loader: 'ts' };
    });
  },
};

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[citypanel-uwagi-hostcard-removed-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'buildings.json'), 'utf8'));
  const stolarnia = buildings.find((b) => b.id === 'stolarnia');
  check('fixture: "stolarnia" istnieje w buildings.json', !!stolarnia);
  check('fixture: stolarnia.uwagi jest DZIŚ niepuste (realne dane, zero mutacji)', !!(stolarnia && String(stolarnia.uwagi || '').trim()), stolarnia && stolarnia.uwagi);

  const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
  const procarz = units.find((u) => u.Jednostka === 'Procarz');
  check('fixture: "Procarz" istnieje w units.json', !!procarz);
  check('fixture: Procarz.Uwagi jest DZIŚ niepuste (realne dane, zero mutacji)', !!(procarz && String(procarz.Uwagi || '').trim()), procarz && procarz.Uwagi);
  if (!stolarnia || !procarz) { process.exit(1); return; }

  // tech.json jest opakowany ({ technologie: [...] }) -- ta sama normalizacja co
  // `loadGameData` w `src/data/loader.ts` (data.tech musi być tablicą, nie obiektem).
  const techRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'tech.json'), 'utf8'));
  const tech = Array.isArray(techRaw) ? techRaw : (techRaw.technologie ?? []);

  fs.writeFileSync(
    ENTRY,
    [
      "import { attachHoverDetail } from '../src/ui/hoverDetailDock.ts';",
      "import { buildBuildingDetailCard, buildUnitDetailCard } from '../src/ui/cityPanel.ts';",
      'window.__attachHoverDetail = attachHoverDetail;',
      'window.__buildBuildingDetailCard = buildBuildingDetailCard;',
      'window.__buildUnitDetailCard = buildUnitDetailCard;',
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
    loader: { '.ts': 'ts' },
    plugins: [stubPlugin],
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  const bundleJs = fs.readFileSync(OUTFILE, 'utf8');
  await page.setContent(`
    <style>body{background:#12181f;color:#eee;font-family:sans-serif;}
      #row{width:260px;height:36px;background:#222;border:1px solid #555;margin:40px;}
      #dock{position:fixed;top:0;right:0;width:420px;}
    </style>
    <div id="stage">
      <!-- Wiersz-anchor: dokładnie to, co realnie hover'uje panel miasta
           ("Dostępne do budowy" / lista rekrutacji). -->
      <div id="row-building">stolarnia (real hover anchor)</div>
      <div id="row-unit">Procarz (real hover anchor)</div>
    </div>
    <div id="dock"></div>
  `);
  await page.addScriptTag({ content: bundleJs });

  const gameData = { tech, buildings, units };

  // --- BUDYNEK: PRZED = wywołanie hosta jeszcze nie nastąpiło (dock pusty) ---
  await page.evaluate(() => { document.getElementById('dock').innerHTML = '<em>przed hoverem — pusto</em>'; });
  if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, 'stolarnia-przed.png') }); }

  const buildingResult = await page.evaluate(({ stolarniaDef, gd }) => {
    const card = window.__buildBuildingDetailCard(stolarniaDef, gd, undefined);
    document.getElementById('dock').innerHTML = '';
    document.getElementById('dock').appendChild(card);
    const html = card.outerHTML;
    const tiles = Array.from(card.querySelectorAll('.dc-tile-h, .bld-detail-tile-h, h3, [class*="tile"]'))
      .map((n) => (n.textContent || '').trim());
    return {
      hasUwagiWord: /Uwagi/.test(html),
      hasStolarniaUwagiText: html.includes(stolarniaDef.uwagi),
      tileTitles: tiles,
    };
  }, { stolarniaDef: stolarnia, gd: gameData });

  if (SHOTS) { await page.screenshot({ path: path.join(SHOTS, 'stolarnia-po.png') }); }

  check('BUDYNEK (stolarnia, uwagi niepuste): karta REALNIE zbudowana przez cityPanel.ts::buildBuildingDetailCard NIE zawiera słowa "Uwagi" nigdzie w DOM', !buildingResult.hasUwagiWord, buildingResult);
  check('BUDYNEK: treść pola uwagi ("B-SUROW-BUD-03...") NIE pojawia się w wyrenderowanej karcie', !buildingResult.hasStolarniaUwagiText, buildingResult);

  // --- JEDNOSTKA ---
  await page.evaluate(() => { document.getElementById('dock').innerHTML = '<em>przed hoverem — pusto</em>'; });
  if (SHOTS) { await page.screenshot({ path: path.join(SHOTS, 'procarz-przed.png') }); }

  const unitResult = await page.evaluate(({ procarzDef, gd }) => {
    const card = window.__buildUnitDetailCard(procarzDef, gd);
    document.getElementById('dock').innerHTML = '';
    document.getElementById('dock').appendChild(card);
    const html = card.outerHTML;
    return {
      hasUwagiWord: /Uwagi/.test(html),
      hasProcarzUwagiText: html.includes(procarzDef.Uwagi),
    };
  }, { procarzDef: procarz, gd: gameData });

  if (SHOTS) { await page.screenshot({ path: path.join(SHOTS, 'procarz-po.png') }); }

  check('JEDNOSTKA (Procarz, Uwagi niepuste): karta REALNIE zbudowana przez cityPanel.ts::buildUnitDetailCard NIE zawiera słowa "Uwagi" nigdzie w DOM', !unitResult.hasUwagiWord, unitResult);
  check('JEDNOSTKA: treść pola Uwagi NIE pojawia się w wyrenderowanej karcie', !unitResult.hasProcarzUwagiText, unitResult);

  // --- Realny hover end-to-end przez PRAWDZIWY attachHoverDetail (nie symulacja) ---
  const hoverResult = await page.evaluate(({ stolarniaDef, gd }) => {
    const row = document.getElementById('row-building');
    window.__attachHoverDetail(row, () => window.__buildBuildingDetailCard(stolarniaDef, gd, undefined), 30);
    return true;
  }, { stolarniaDef: stolarnia, gd: gameData });
  check('attachHoverDetail (realny import z hoverDetailDock.ts) zainstalowany bez wyjątku', hoverResult === true);

  await page.hover('#row-building');
  await page.waitForTimeout(400);
  const afterRealHoverHtml = await page.evaluate(() => {
    const dock = document.querySelector('.civ-hover-detail-content, .civ-hover-detail-dock, #civ-hover-detail-float');
    return dock ? dock.innerHTML : null;
  });
  if (SHOTS && afterRealHoverHtml) { await page.screenshot({ path: path.join(SHOTS, 'stolarnia-realny-hover-po.png') }); }
  check('REALNY page.hover() (prawdziwy attachHoverDetail, nie wywołanie bezpośrednie): karta się pojawiła', !!afterRealHoverHtml);
  if (afterRealHoverHtml) {
    check('REALNY hover: wyrenderowana karta NIE zawiera słowa "Uwagi"', !/Uwagi/.test(afterRealHoverHtml), afterRealHoverHtml.slice(0, 4000));
  }

  check('brak błędów konsoli/pageerror podczas całego scenariusza', consoleErrors.length === 0, consoleErrors);

  await browser.close();
  console.log(`\n[citypanel-uwagi-hostcard-removed-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
