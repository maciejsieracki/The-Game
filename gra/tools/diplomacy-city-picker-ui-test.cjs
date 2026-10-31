'use strict';
/**
 * R-WEB-PEACE-CITY-CESSION-Q1 r3 (N2) — UI wyboru miasta w koszyku pokoju, w realnym Chromium.
 *
 * Bundluje `showTradeBasketModal` (src/ui/diplomacyTradeBasket.ts) do katalogu tymczasowego
 * (poza repo) i otwiera modal na stronie testowej. Sprawdza:
 *  1. akcja pokoju ('10'): chip „Miasto" widoczny, po wyborze pokazuje listę miast z wyceną PW,
 *  2. dodanie miasta → pozycja w koszyku z wyceną, miasto znika z listy wyborów,
 *  3. ZATWIERDZENIE → payload: giveItems[0] = miasto z cityPn, givePn = round(1.5 × cityPn)
 *     (bramka actionId + waga oddającego przechodzą przez UI → diplomacySumPn),
 *  4. akcja handlu ('14') i prezentów ('13'): chip „Miasto" NIE pojawia się,
 *  5. zrzut modala pokoju z wybranym miastem,
 *  6. zero pageerror / console.error.
 * Realny transfer miasta w silniku (main.ts transferCityByTreaty) NIE jest tu testowany — wymaga
 * pełnej gry; patrz raport R-WEB-PEACE-CITY-CESSION-Q1 r3 (NIE_ZMIERZONO).
 *
 * Usage (z gra/): node tools/diplomacy-city-picker-ui-test.cjs [scratchDirAbs] [evidenceDirAbs]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-city-picker-ui-' + process.pid);
const EVIDENCE = process.argv[3]
  || path.join(REPO_ROOT, 'dyspozycje', 'autobot', 'runs', 'R-WEB-PEACE-CITY-CESSION-Q1', 'evidence');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log('  OK  ' + label); }
  else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

fs.mkdirSync(SCRATCH, { recursive: true });
fs.mkdirSync(EVIDENCE, { recursive: true });

const entry = path.join(SCRATCH, 'entry.ts');
fs.writeFileSync(entry, `
export { showTradeBasketModal, getTradeBasketMode } from ${JSON.stringify(path.join(GRA_DIR, 'src/ui/diplomacyTradeBasket.ts'))};
`, 'utf8');
const bundle = path.join(SCRATCH, 'bundle.js');
// Vite (nie esbuild): ui/leaderPortraits.ts i pokrewne używają import.meta.glob.
async function buildBundle() {
  const { pathToFileURL } = require('url');
  const vite = await import(pathToFileURL(path.join(GRA_DIR, 'node_modules', 'vite', 'dist', 'node', 'index.js')).href);
  await vite.build({
    root: GRA_DIR,
    logLevel: 'silent',
    configFile: false,
    build: {
      outDir: SCRATCH,
      emptyOutDir: false,
      minify: false,
      lib: { entry: entry, name: 'CityPicker', formats: ['iife'], fileName: () => 'bundle.js' },
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
}
fs.writeFileSync(path.join(SCRATCH, 'index.html'),
  '<!doctype html><html><head><meta charset="utf-8"><title>city picker</title></head>'
  + '<body style="background:#1a1d24;color:#eee;font-family:sans-serif"><script src="bundle.js"></script></body></html>', 'utf8');

const CTX = {
  civName: 'Test AI',
  relacjaTotal: 50,
  atWar: true,
  progHandelRelacja: 0,
  tempoGry: 'standardowa',
  difficulty: 'normal',
  // Lista już przefiltrowana w main.ts (bez stolicy i ostatniego miasta).
  miastoOptions: [
    { id: 'c1', label: 'Alfa', pn: 1060 },
    { id: 'c2', label: 'Beta', pn: 700 },
  ],
};

(async () => {
  await buildBundle();
  const launchOpts = { headless: true };
  if (fs.existsSync(FALLBACK_CHROME)) launchOpts.executablePath = FALLBACK_CHROME;
  const browser = await chromium.launch(launchOpts);
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  await page.goto('file://' + path.join(SCRATCH, 'index.html'));

  async function openModal(actionId, ctx, captured) {
    await page.evaluate(([a, c]) => {
      window.__submitted = null;
      window.CityPicker.showTradeBasketModal(
        window.CityPicker.getTradeBasketMode(a),
        { id: a, label: 'test ' + a, enabled: true },
        c,
        (payload) => { window.__submitted = payload; },
        () => {},
      );
    }, [actionId, ctx]);
    return captured;
  }

  // --- 1–3, 5: akcja pokoju '10' (formularz traktatu, blok „Miasto do oddania") ---
  await openModal('10', CTX);
  const pickCount = await page.locator('.cdb-city-pick[data-side="give"]').count();
  assert('pokój: blok wyboru miasta jest widoczny (2 miasta do oddania)', pickCount === 2, pickCount);
  const pickLabels = await page.locator('.cdb-city-pick[data-side="give"] .cdb-chip-lbl').allTextContents();
  assert('pokój: etykiety miast zawierają wycenę PW', pickLabels.some(t => t.includes('Beta') && t.includes('700 PW')), pickLabels);
  await page.locator('.cdb-city-pick[data-value="c2"]').click();
  const sideText = await page.locator('.cdb-land-side').allTextContents();
  assert('pokój: po kliknięciu miasto „Beta · 700 PW" pojawia się w podsumowaniu koszyka',
    sideText.some(t => t.includes('Beta') && t.includes('700 PW')), sideText.map(t => t.slice(0, 120)));
  const pickAfter = await page.locator('.cdb-city-pick[data-side="give"]').count();
  assert('pokój: dodane miasto znika z listy wyboru (zostaje 1)', pickAfter === 1, pickAfter);
  await page.screenshot({ path: path.join(EVIDENCE, 'r3-modal-pokoj-miasto.png'), fullPage: false });
  console.log('  zrzut: ' + path.join(EVIDENCE, 'r3-modal-pokoj-miasto.png'));
  await page.locator('.cdb-submit').click();
  const submitted = await page.evaluate(() => window.__submitted);
  assert('pokój: zatwierdzenie wysyła payload', submitted != null, submitted);
  if (submitted) {
    const gi = submitted.giveItems ?? [];
    assert('payload: giveItems[0].typ = miasto', gi[0]?.typ === 'miasto', gi);
    assert('payload: giveItems[0].id = c2 (wybrane miasto)', gi[0]?.id === 'c2', gi);
    assert('payload: giveItems[0].cityPn = 700', gi[0]?.cityPn === 700, gi);
    assert('payload: givePn = round(700 × 1.5) = 1050 (waga oddającego przez actionId)',
      submitted.givePn === 1050, submitted.givePn);
  }

  // --- 4: handel '14' i prezent '13' — brak chipa „Miasto" ---
  await openModal('14', CTX);
  const tradeChip = await page.locator('.cdb-chip-typ[data-side="give"][data-value="miasto"], .cdb-city-pick').count();
  assert('handel (14): brak chipa „Miasto" i bloku wyboru miasta', tradeChip === 0, tradeChip);
  await openModal('13', CTX);
  const giftChip = await page.locator('.cdb-chip-typ[data-side="give"][data-value="miasto"], .cdb-city-pick').count();
  assert('prezent (13): brak chipa „Miasto" i bloku wyboru miasta', giftChip === 0, giftChip);
  await openModal('10', { ...CTX, miastoOptions: [] });
  const emptyChip = await page.locator('.cdb-city-pick').count();
  assert('pokój bez miast do oddania: brak bloku wyboru miasta', emptyChip === 0, emptyChip);

  assert('brak pageerror / console.error w scenariuszu', errors.length === 0, errors);
  await browser.close();
  console.log(`diplomacy-city-picker-ui-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => {
  console.error('FAIL (wyjątek):', e && e.stack || e);
  process.exit(1);
});
