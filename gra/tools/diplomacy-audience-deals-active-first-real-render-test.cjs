'use strict';
/**
 * diplomacy-audience-deals-active-first-real-render-test.cjs
 *
 * TEMAT: P-DYPLO-UMOWY-AKTYWNE-NA-GORZE-Q1.
 *
 * WYZWALACZ (właściciel): „Sprawdź, czy jest możliwość, aby podczas rozmów dyplomatycznych
 * wszystkie aktywne statusy były na samej górze, a nieaktywne zgodnie z obecną kolejnością."
 *
 * FIX (diplomacyAudience.ts, WYŁĄCZNIE `dealsColumnHtml`): kafelki renderowane są teraz
 * najpierw dla `isLocked===false` (aktywne/klikalne), potem `isLocked===true`
 * (nieaktywne/wygaszone) — w OBU grupach zachowana dzisiejsza względna kolejność
 * (`Array.prototype.sort` jest stabilny, ES2019+). `st.actions` (źródło kolejności) i logika
 * `isLocked`/`cls`/`statusNote`/`hoverTip`/ikon NIETKNIĘTE — zmienia się wyłącznie kolejność
 * renderowania wyniku.
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU (dispatch): zakaz uznania stabilności kolejności wewnątrz
 * grup za spełnioną bez ŻYWEGO porównania listy `data-aid` PRZED i PO na TEJ SAMEJ fixturze
 * (8 pozycji: 4 aktywne + 4 nieaktywne, przeplecione) w headless Chromium (Playwright, nie
 * jsdom) — silnik JS renderu w przeglądarce może różnić się od Node użytego do zwykłych
 * testów jednostkowych.
 *
 * METODA: dwa bundle `dealsColumnHtml` (już normalnie eksportowanej z diplomacyAudience.ts,
 * używanej też przez `render()` w tym samym pliku) dla PRAWDZIWEGO silnika przeglądarki (esbuild,
 * platform:'browser', IIFE), oba wykonane w TYM SAMYM headless Chromium na TEJ SAMEJ fixturze:
 *   PO    — bieżący kod (bez mutacji).
 *   PRZED — mutacja W LOCIE (tylko w pamięci bundlera, plik w repo NIETKNIĘTY): komparator
 *           sortu zamieniony na `(x, y) => 0`. Sort jest stabilny, więc komparator zawsze
 *           zwracający 0 nie przestawia NICZEGO — odtwarza dokładnie dzisiejszą (przed-fixową)
 *           kolejność `visible`/`st.actions`, czyli stan „PRZED zmianą" z dispatchu, bez
 *           dotykania samego pliku źródłowego.
 * DOWÓD NIETAUTOLOGICZNOŚCI (mutacja czerwieni test): assercja kryterium 1 (aktywne NAD
 * nieaktywnymi) uruchomiona RÓWNIEŻ na bundlu PRZED — musi być FAŁSZYWA (przeplecione kafelki),
 * inaczej test nie łapałby regresji. Sam plik z tym testem zawiera więc kontrolę negatywną,
 * nie tylko pozytywną.
 *
 * ZRZUTY EKRANU (R-PROC-AUTOBOT.md §9 pkt 6a / §16 pkt 8 — dowód wizualny na żywej
 * przeglądarce), zapisywane ZAWSZE do
 * `dyspozycje/autobot/runs/P-DYPLO-UMOWY-AKTYWNE-NA-GORZE-Q1/dowody/`:
 *   01-przed-przeplecione.png — bundel PRZED (mutacja): kafelki aktywne/nieaktywne przeplecione
 *   02-po-aktywne-na-gorze.png — bundel PO (bieżący kod): wszystkie aktywne kafelki nad wszystkimi nieaktywnymi
 *
 * Usage (z gra/): node tools/diplomacy-audience-deals-active-first-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[diplomacy-audience-deals-active-first-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.dza-active-first-stubs');
const ENTRY = path.resolve(__dirname, '.dza-active-first-entry.ts');
const BUNDLE_PO = path.resolve(__dirname, '.dza-active-first-bundle-po.js');
const BUNDLE_PRZED = path.resolve(__dirname, '.dza-active-first-bundle-przed.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DIPLO_AUD = path.resolve(GRA, 'src', 'ui', 'diplomacyAudience.ts');
const SHOT_DIR = path.resolve(
  GRA, '..', 'dyspozycje', 'autobot', 'runs',
  'P-DYPLO-UMOWY-AKTYWNE-NA-GORZE-Q1', 'dowody',
);
async function shot(page, name) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const p = path.join(SHOT_DIR, name);
  await page.screenshot({ path: p });
  console.log('[diplomacy-audience-deals-active-first-real-render-test] zrzut: ' + p);
}

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const stubs = {
  music: path.resolve(STUB_DIR, 'music-stub.ts'),
  diploUiSkin: path.resolve(STUB_DIR, 'diplouiskin-stub.ts'),
  negotiationModal: path.resolve(STUB_DIR, 'negotiationmodal-stub.ts'),
  tradeBasket: path.resolve(STUB_DIR, 'tradebasket-stub.ts'),
  leaderPortraits: path.resolve(STUB_DIR, 'leaderportraits-stub.ts'),
  civBrandDisplay: path.resolve(STUB_DIR, 'civbranddisplay-stub.ts'),
  brandAssets: path.resolve(STUB_DIR, 'brandassets-stub.ts'),
};

function writeStubs() {
  fs.mkdirSync(STUB_DIR, { recursive: true });
  fs.writeFileSync(stubs.music, [
    "export function startDiplomacyMusic() {}",
    "export function stopDiplomacyMusic() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.diploUiSkin, [
    "export function civLeaderMedallionHtmlById() { return ''; }",
    "export function dipBrandIconHtml() { return ''; }",
    "export function dipCapitalLocateBtnHtml() { return ''; }",
    "export const DIPLO_1E_SHARED_CSS = '';",
    "export function ensureDiploBrandScope() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.negotiationModal, [
    "export function actionNeedsNegotiation() { return false; }",
    "export function showNegotiationModal() {}",
    "export function proposalActionIdFromPayload() { return undefined; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.tradeBasket, [
    "export function actionUsesTradeBasket() { return false; }",
    "export function getTradeBasketMode() { return 'trade'; }",
    "export function showTradeBasketModal() {}",
    "export function hideTradeBasketModal() {}",
    "export function openQuickDealBasket() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.leaderPortraits, [
    "export function civCardDisplayName(label) { return label; }",
    "export function leaderName() { return null; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.civBrandDisplay, "export function civBrandLineForKey() { return ''; }\n", 'utf8');
  fs.writeFileSync(stubs.brandAssets, [
    "export function brandIconSvg() { return ''; }",
    "export function mapResourceIconSvg() { return ''; }",
  ].join('\n'), 'utf8');
}

function cleanupStubs() {
  for (const f of Object.values(stubs).concat([ENTRY, BUNDLE_PO, BUNDLE_PRZED])) {
    try { fs.unlinkSync(f); } catch (_) { /* ok */ }
  }
  try { fs.rmdirSync(STUB_DIR); } catch (_) { /* ok */ }
}

/** Mutacja W LOCIE (tylko dla bundla PRZED) — plik w repo NIETKNIĘTY. Komparator sortu
 * zamieniony na `(x, y) => 0`: sort stabilny + komparator zawsze 0 = zero przestawień,
 * czyli dokładnie kolejność `visible`/`st.actions` sprzed tego tematu. */
const mutation = { applied: 0 };
const revertSortPlugin = {
  name: 'revert-active-first-sort',
  setup(build) {
    build.onLoad({ filter: /diplomacyAudience\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_AUD) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      const out = src.replace(
        '.sort((x, y) => Number(x.isLocked) - Number(y.isLocked))',
        '.sort((x, y) => 0)',
      );
      if (out !== src) mutation.applied++;
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

async function buildBundle(outfile, mutate) {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'DZA',
    target: 'es2020',
    outfile,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    logLevel: 'silent',
    plugins: [
      ...(mutate ? [revertSortPlugin] : []),
      {
        name: 'stub-diplomacy-audience-deps',
        setup(build) {
          build.onResolve({ filter: /audio\/muzyka-antyczna$/ }, () => ({ path: stubs.music }));
          build.onResolve({ filter: /diploUiSkin$/ }, () => ({ path: stubs.diploUiSkin }));
          build.onResolve({ filter: /diplomacyNegotiationModal$/ }, () => ({ path: stubs.negotiationModal }));
          build.onResolve({ filter: /diplomacyTradeBasket$/ }, () => ({ path: stubs.tradeBasket }));
          build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: stubs.leaderPortraits }));
          build.onResolve({ filter: /civBrandDisplay$/ }, () => ({ path: stubs.civBrandDisplay }));
          build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: stubs.brandAssets }));
        },
      },
    ],
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[diplomacy-audience-deals-active-first-real-render-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Fixture: 8 kafelków, PRZEPLECIONE aktywne/nieaktywne, dokładnie jak w RECON dispatchu —
 * 4x `isLocked===false` (id parzyste: '2','4','6','8') + 4x `isLocked===true` (id nieparzyste:
 * '3','5','7','9'), w tej właśnie kolejności w `st.actions` (id '1' odfiltrowane przez
 * `dealsColumnHtml` samo, nieużywane tutaj). Trzy różne DROGI do `isLocked===true`, żeby
 * pokryć cały predykat z RECON (`a.locked || !a.enabled || a.active===true || onTableBlocks`):
 *   '3' → a.locked=true, '5' → a.enabled=false, '7' → a.active=true, '9' → a.locked=true. */
function fixtureState() {
  return {
    playerTitle: 'Gracz', playerCivName: 'Rzym', otherTitle: 'Rozmówca', otherCivName: 'Grecja',
    zaufanie: 50, respekt: 50, tier: 1, layer: 'full', contactEstablished: true,
    actions: [
      { id: '2', label: 'Traktat handlowy', enabled: true, locked: false },
      { id: '3', label: 'Pakt nieagresji', enabled: true, locked: true, tooltip: 'Niedostępne u rywala tego samego typu' },
      { id: '4', label: 'Umowa wymiany surowców', enabled: true, locked: false },
      { id: '5', label: 'Granice', enabled: false, tooltip: 'Wymaga wyższego zaufania' },
      { id: '6', label: 'Wspólna obrona', enabled: true, locked: false },
      { id: '7', label: 'Pokój', enabled: true, locked: false, active: true },
      { id: '8', label: 'Wymiana technologii', enabled: true, locked: false },
      { id: '9', label: 'Wasal', enabled: true, locked: true, tooltip: 'Zbyt niski respekt' },
    ],
    pendingNegotiations: [],
  };
}
const EXPECTED_ACTIVE_IDS = ['2', '4', '6', '8'];
const EXPECTED_LOCKED_IDS = ['3', '5', '7', '9'];
const EXPECTED_PRZED_ORDER = ['2', '3', '4', '5', '6', '7', '8', '9'];

const PAGE_HTML = '<!DOCTYPE html><html><head><meta charset="utf-8"></head>'
  + '<body><div id="root"></div></body></html>';

async function renderDealsColumn(page, bundleFile, state) {
  await page.setContent(PAGE_HTML);
  await page.addScriptTag({ path: bundleFile });
  await page.evaluate((st) => {
    document.getElementById('root').innerHTML = window.DZA.dealsColumnHtml(st);
  }, state);
  return page.evaluate(() => {
    const tiles = Array.from(document.querySelectorAll('.da-deal'));
    return {
      ids: tiles.map(t => t.getAttribute('data-aid')),
      disabled: tiles.map(t => t.hasAttribute('disabled')),
      lockedCls: tiles.map(t => t.classList.contains('locked')),
      cnt: document.querySelector('.cnt') ? document.querySelector('.cnt').textContent : null,
      outerById: Object.fromEntries(tiles.map(t => [t.getAttribute('data-aid'), t.outerHTML])),
    };
  });
}

async function main() {
  console.log('diplomacy-audience-deals-active-first-real-render-test — start');
  writeStubs();
  fs.writeFileSync(ENTRY, `export { dealsColumnHtml } from '../src/ui/diplomacyAudience.ts';\n`, 'utf8');

  await buildBundle(BUNDLE_PO, false);
  await buildBundle(BUNDLE_PRZED, true);
  check('mutacja PRZED faktycznie zaaplikowana w bundlu (komparator sortu zamieniony)', mutation.applied === 1, mutation);

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    const state = fixtureState();

    const przed = await renderDealsColumn(page, BUNDLE_PRZED, state);
    await shot(page, '01-przed-przeplecione.png');
    const po = await renderDealsColumn(page, BUNDLE_PO, state);
    await shot(page, '02-po-aktywne-na-gorze.png');

    // --- Fixture ma naprawdę 4 aktywne + 4 nieaktywne jednocześnie (wymóg dispatchu: 3+/3+).
    check('fixture: 8 kafelków obecnych w PO', po.ids.length === 8, po.ids);
    check('fixture: 8 kafelków obecnych w PRZED', przed.ids.length === 8, przed.ids);
    check('fixture: dokładnie 4 aktywne (bez disabled) w PO',
      po.disabled.filter(d => !d).length === 4, po.disabled);
    check('fixture: dokładnie 4 nieaktywne (disabled) w PO',
      po.disabled.filter(d => d).length === 4, po.disabled);

    // --- KRYTERIUM 1: w PO wszystkie aktywne kafelki NAD wszystkimi nieaktywnymi.
    check('KRYTERIUM 1 (PO): kolejność data-aid dokładnie [aktywne...][nieaktywne...]',
      JSON.stringify(po.ids) === JSON.stringify(EXPECTED_ACTIVE_IDS.concat(EXPECTED_LOCKED_IDS)),
      po.ids);
    check('KRYTERIUM 1 (PO): pierwsze 4 kafelki nie mają disabled',
      po.disabled.slice(0, 4).every(d => d === false), po.disabled);
    check('KRYTERIUM 1 (PO): ostatnie 4 kafelki mają disabled',
      po.disabled.slice(4).every(d => d === true), po.disabled);

    // --- DOWÓD NIETAUTOLOGICZNOŚCI: to samo kryterium 1 na bundlu PRZED (mutacja) musi być
    // FAŁSZYWE — kafelki przeplecione, nie pogrupowane — inaczej test nie łapałby regresji.
    check('MUTACJA CZERWIENI TEST: w PRZED kafelki NIE są pogrupowane aktywne/nieaktywne (kontrola negatywna)',
      JSON.stringify(przed.ids) !== JSON.stringify(EXPECTED_ACTIVE_IDS.concat(EXPECTED_LOCKED_IDS)),
      przed.ids);
    check('PRZED odtwarza dokładnie dzisiejszą (przed-fixową) kolejność st.actions',
      JSON.stringify(przed.ids) === JSON.stringify(EXPECTED_PRZED_ORDER), przed.ids);

    // --- KRYTERIUM 2: względna kolejność WEWNĄTRZ grupy aktywnych identyczna PRZED i PO.
    const przedActiveOrder = przed.ids.filter(id => EXPECTED_ACTIVE_IDS.includes(id));
    const poActiveOrder = po.ids.filter(id => EXPECTED_ACTIVE_IDS.includes(id));
    check('KRYTERIUM 2: kolejność wewnątrz grupy AKTYWNYCH identyczna PRZED vs PO (żywe porównanie data-aid)',
      JSON.stringify(przedActiveOrder) === JSON.stringify(poActiveOrder),
      { przed: przedActiveOrder, po: poActiveOrder });

    // --- KRYTERIUM 3: względna kolejność WEWNĄTRZ grupy nieaktywnych identyczna PRZED i PO.
    const przedLockedOrder = przed.ids.filter(id => EXPECTED_LOCKED_IDS.includes(id));
    const poLockedOrder = po.ids.filter(id => EXPECTED_LOCKED_IDS.includes(id));
    check('KRYTERIUM 3: kolejność wewnątrz grupy NIEAKTYWNYCH identyczna PRZED vs PO (żywe porównanie data-aid)',
      JSON.stringify(przedLockedOrder) === JSON.stringify(poLockedOrder),
      { przed: przedLockedOrder, po: poLockedOrder });

    // --- KRYTERIUM 4: wygląd pojedynczego kafelka bit-for-bit identyczny PRZED vs PO (dla
    // każdego id z osobna — zmienia się WYŁĄCZNIE pozycja w liście, nie treść/styl/klasy).
    let allTilesIdentical = true;
    const tileDiffs = [];
    for (const id of EXPECTED_ACTIVE_IDS.concat(EXPECTED_LOCKED_IDS)) {
      if (po.outerById[id] !== przed.outerById[id]) {
        allTilesIdentical = false;
        tileDiffs.push({ id, po: po.outerById[id], przed: przed.outerById[id] });
      }
    }
    check('KRYTERIUM 4: HTML pojedynczego kafelka (klasy, tekst, ikony, disabled, tooltip) bit-for-bit identyczny PRZED vs PO, dla każdego z 8 id',
      allTilesIdentical, tileDiffs);

    // --- KRYTERIUM 5: licznik w nagłówku liczy WSZYSTKIE widoczne pozycje (8), nie tylko aktywne.
    check('KRYTERIUM 5: licznik nagłówka "Możliwe umowy" == 8 w PO', po.cnt === '8', po.cnt);
    check('KRYTERIUM 5: licznik nagłówka "Możliwe umowy" == 8 w PRZED (bez zmian logiki licznika)', przed.cnt === '8', przed.cnt);

    await page.close();
  } finally {
    await browser.close();
    cleanupStubs();
  }

  console.log('\n' + 'diplomacy-audience-deals-active-first-real-render-test: ' + pass + ' PASS, ' + fail + ' FAIL');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  cleanupStubs();
  process.exit(1);
});
