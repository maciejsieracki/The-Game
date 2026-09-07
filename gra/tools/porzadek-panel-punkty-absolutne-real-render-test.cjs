'use strict';
/**
 * porzadek-panel-punkty-absolutne-real-render-test.cjs
 *
 * TEMAT: R-PORZADEK-PANEL-PUNKTY-ABSOLUTNE-Q1.
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU (00-dispatch.md): zakaz uznania zmiany UI za gotową na
 * podstawie samego `tsc --noEmit`. Ten test bunduje przez esbuild PRAWDZIWY
 * `src/ui/cityPanel.ts` (nie kopię, nie wyciąg regexem) i realnie renderuje w headless
 * Chromium (Playwright) blok Szczęścia i blok Prawa panelu miasta (`renderSpoleczenstwo`)
 * oraz kartę szczegółów Porządku (`buildPorzadekDetailCard`) — ten sam wzorzec co
 * `citypanel-uwagi-hostcard-removed-real-render-test.cjs` (onLoad, dokłada `export {...}`
 * WYŁĄCZNIE w buforze esbuild, plik w repo bez zmian).
 *
 * DOWÓD: w wyrenderowanym DOM oba bloki (Szczęście, Prawo) pokazują JEDNOCZEŚNIE procent
 * ORAZ netto/max w punktach (np. "64% (30/30 pkt)"), a karta szczegółów Porządku pokazuje
 * to samo w wierszach gridu. Realne dane z `data/society-params.json` przez `loadGameData()`
 * (ta sama ścieżka co produkcja) — zero mockowania silnika.
 *
 * Usage (z gra/): node tools/porzadek-panel-punkty-absolutne-real-render-test.cjs
 *   --shots <katalog>  zrzut PNG bloków
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[porzadek-panel-punkty-absolutne-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
// Współdzielone z citypanel-uwagi-hostcard-removed-real-render-test.cjs (te same puste
// no-opy ikon brandu, cityPanel.ts ciągnie te same moduły niezależnie od tematu).
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'citypanel-uwagi-hostcard-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'citypanel-uwagi-hostcard-scienceOwlIcon-stub.ts');
const HUD_STUB = path.resolve(STUB_DIR, 'citypanel-uwagi-hostcard-hud-stub.ts');
const LEADER_PORTRAITS_STUB = path.resolve(STUB_DIR, 'citypanel-uwagi-hostcard-leaderPortraits-stub.ts');
const CITY_PANEL_TS = path.resolve(GRA, 'src', 'ui', 'cityPanel.ts');
const ENTRY = path.resolve(__dirname, '.porzadek-panel-punkty-absolutne-entry.ts');
const OUTFILE = path.resolve(__dirname, '.porzadek-panel-punkty-absolutne-bundle.cjs');
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
    // Dokłada eksport DWÓCH prywatnych funkcji WYŁĄCZNIE w buforze esbuild — produkcyjny
    // plik w repo zostaje bez `export` (wzorzec identyczny jak citypanel-uwagi-hostcard).
    build.onLoad({ filter: /cityPanel\.ts$/ }, (args) => {
      let src = fs.readFileSync(args.path, 'utf8');
      if (!/function renderSpoleczenstwo\(/.test(src) || !/function buildPorzadekDetailCard\(/.test(src)) {
        throw new Error('kotwica renderSpoleczenstwo/buildPorzadekDetailCard nie znaleziona w cityPanel.ts');
      }
      // `__cityPanelOrderStateLocalForTest` jest JUŻ eksportowana produkcyjnie (bramka G15,
      // szew dla `szczescie-przebudowa-skali-test.cjs`) — używamy jej wprost, zero dublowania.
      src += '\nexport { renderSpoleczenstwo, buildPorzadekDetailCard };\n';
      return { contents: src, loader: 'ts' };
    });
  },
};

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[porzadek-panel-punkty-absolutne-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  fs.writeFileSync(
    ENTRY,
    [
      "import { configureCityPanel, __cityPanelOrderStateLocalForTest } from '../src/ui/cityPanel.ts';",
      "import { renderSpoleczenstwo, buildPorzadekDetailCard } from '../src/ui/cityPanel.ts';",
      "import { loadGameData } from '../src/data/loader.ts';",
      'window.__configureCityPanel = configureCityPanel;',
      'window.__renderSpoleczenstwo = renderSpoleczenstwo;',
      'window.__buildPorzadekDetailCard = buildPorzadekDetailCard;',
      'window.__cityPanelOrderStateLocalForTest = __cityPanelOrderStateLocalForTest;',
      // Realne dane (society-params.json, econ-params.json itd.) — ta sama funkcja, którą
      // produkcyjny `gameData()` w cityPanel.ts woła jako fallback gdy `cfg.data` nie jest
      // ustawione. Ładujemy raz i przekazujemy jawnie, żeby test nie zależał od tego, czy
      // moduł JSON bunduje się identycznie po stronie `cfg.data`.
      'window.__loadGameData = loadGameData;',
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
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  const bundleJs = fs.readFileSync(OUTFILE, 'utf8');
  await page.setContent(`
    <style>body{background:#12181f;color:#eee;font-family:sans-serif;}</style>
    <div id="mount" class="civ-cs"></div>
  `);
  await page.addScriptTag({ content: bundleJs });

  // Miasto fikcyjny minimalny (`game/cities.ts` City) — reszta pól opcjonalna,
  // `computeOrderStateLocal` czyta wszystko przez `?? default`. cfg pusty ({}) — panel
  // liczy lokalnie (fromEngine: false), dokładnie ta sama funkcja co produkcja gdy
  // silnik jeszcze nie policzył (patrz komentarz przy `computeOrderStateLocal`).
  const city = {
    id: 'test-city-1',
    ownerId: 1,
    q: 0,
    r: 0,
    name: 'Testopolis',
    population: 6,
  };

  const result = await page.evaluate(({ cityFixture }) => {
    window.__configureCityPanel({});
    const mount = document.getElementById('mount');
    const data = window.__loadGameData();
    window.__renderSpoleczenstwo(mount, cityFixture, data);
    const html = mount.innerHTML;
    const blocks = Array.from(mount.querySelectorAll('.civ-w4-metric')).map((b) => ({
      subhd: (b.querySelector('.civ-w4-subhd')?.textContent || '').trim(),
      pctText: (b.querySelector('.civ-w4-subhd-pct')?.textContent || '').trim(),
      ptsText: (b.querySelector('.civ-w4-subhd-pts')?.textContent || '').trim(),
    }));
    return { html, blocks };
  }, { cityFixture: city });

  if (SHOTS) {
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: path.join(SHOTS, 'panel-blocks.png') });
  }

  console.log('\n-- Bloki wyrenderowane przez renderSpoleczenstwo --');
  for (const b of result.blocks) console.log('  ' + JSON.stringify(b));

  const szBlock = result.blocks.find((b) => b.subhd.startsWith('Szczęście'));
  const prawBlock = result.blocks.find((b) => b.subhd.startsWith('Prawo'));

  check('blok "Szczęście" istnieje w DOM', !!szBlock, result.blocks);
  check('blok "Szczęście": pokazuje %', !!(szBlock && /%/.test(szBlock.pctText)), szBlock);
  check(
    'blok "Szczęście": pokazuje TAKŻE netto/max w punktach (wzorzec "N/M pkt")',
    !!(szBlock && /\(\d+\/\d+ pkt\)/.test(szBlock.ptsText)),
    szBlock,
  );

  check('blok "Prawo" istnieje w DOM', !!prawBlock, result.blocks);
  check('blok "Prawo": pokazuje %', !!(prawBlock && /%/.test(prawBlock.pctText)), prawBlock);
  check(
    'blok "Prawo": pokazuje TAKŻE netto/max w punktach (wzorzec "N/M pkt")',
    !!(prawBlock && /\(\d+\/\d+ pkt\)/.test(prawBlock.ptsText)),
    prawBlock,
  );

  // --- karta szczegółów Porządku (buildPorzadekDetailCard) ---
  // `__cityPanelOrderStateLocalForTest` (już eksportowana produkcyjnie) daje DOKŁADNIE ten
  // sam `state`, który realny panel przekazuje do `buildPorzadekDetailCard` w
  // `appendSectionTitleWithDetails(mount, ..., () => buildPorzadekDetailCard(city, state))`.
  const detailResult = await page.evaluate(({ cityFixture }) => {
    window.__configureCityPanel({});
    const data = window.__loadGameData();
    const { state } = window.__cityPanelOrderStateLocalForTest(cityFixture, data);
    const card = window.__buildPorzadekDetailCard(cityFixture, state);
    // `gridDetailRow` renderuje parę <span.dc-l>label</span><span.dc-v>wartość</span> —
    // sparuj je po kolei (ten sam DOM co realny grid szczegółów Porządku).
    const labels = Array.from(card.querySelectorAll('.dc-l')).map((n) => (n.textContent || '').trim());
    const values = Array.from(card.querySelectorAll('.dc-v')).map((n) => (n.textContent || '').trim());
    const rows = labels.map((l, i) => `${l}: ${values[i] ?? ''}`);
    return { html: card.outerHTML, rows, szMax: state.szMax, prawMax: state.prawMax };
  }, { cityFixture: city });

  console.log('\n-- Wiersze gridu buildPorzadekDetailCard (Szczęście/Prawo) --');
  for (const r of detailResult.rows) console.log('  ' + r);

  check(
    'karta szczegółów Porządku: state.szMax/prawMax obecne (nie undefined)',
    detailResult.szMax != null && detailResult.prawMax != null,
    detailResult,
  );
  check(
    'karta szczegółów Porządku: wiersz "Szczęście" pokazuje % ORAZ "N/M pkt"',
    detailResult.rows.some((r) => /^Szczęście:.*%.*\(\d+\/\d+ pkt\)/.test(r)),
    detailResult.rows,
  );
  check(
    'karta szczegółów Porządku: wiersz "Prawo" pokazuje % ORAZ "N/M pkt"',
    detailResult.rows.some((r) => /^Prawo:.*%.*\(\d+\/\d+ pkt\)/.test(r)),
    detailResult.rows,
  );

  check('brak błędów konsoli/pageerror podczas całego scenariusza', consoleErrors.length === 0, consoleErrors);

  await browser.close();
  console.log(`\n[porzadek-panel-punkty-absolutne-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
