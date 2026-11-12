'use strict';
/**
 * prod-empty-gate-real-render-test.cjs — R-PROD-EMPTY-GATE-Q1 (żywy pomiar w Chromium).
 *
 * Kryteria (dispatch właściciela):
 *  (1) miasto BEZ surowców (magazyn państwa = 0, skarbiec = 0, rekruci = 0) → brak zdarzenia
 *      `prod-empty-<id>`, chyba że REALNIE istnieje pozycja możliwa do zrobienia teraz;
 *  (2) miasto Z surowcami (magazyn, skarbiec, rekruci > 0) → zdarzenie obecne, bo istnieje pozycja
 *      możliwa teraz;
 *  (3) zdarzenie w `collectTurnEvents` (hak `__prodEmptyTestDebug.probe`) zgadza się z listą
 *      `__sidePanelLinkTestDebug.allEvents()` — czyli z tym, co gracz faktycznie widzi.
 *
 * Bramka „możliwe teraz” to TA SAMA funkcja co wiersz panelu: `buildingCanBuildNow` (budynki i
 * ulepszenia) oraz `unitRecruitAllowedNow` (jednostki) z src/ui/cityPanel.ts. Test sprawdza więc
 * zgodność zdarzenia z tymi predykatami na żywej grze, a nie z kopią logiki.
 *
 * STATUS: napisany, NIEWYKONANY w tej sesji (budowa gry zablokowana przez uprawnienia; C-001 —
 * dozwolone tylko tsc i node tools/*-test.cjs). Uruchomienie wymaga katalogu zbudowanego poza repo:
 *   node ./node_modules/vite/bin/vite.js build --outDir <katalog-poza-repo> --emptyOutDir
 *   node tools/prod-empty-gate-real-render-test.cjs --dist <katalog-poza-repo>
 *
 * Usage (z gra/): node tools/prod-empty-gate-real-render-test.cjs --dist <katalog>
 */
const path = require('path');
const fs = require('fs');

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
};
const DIST = argOf('--dist');
if (!DIST) {
  console.error('Użycie: node tools/prod-empty-gate-real-render-test.cjs --dist <katalog zbudowany poza repo>');
  process.exit(2);
}
const INDEX = path.join(path.resolve(DIST), 'index.html');
if (!fs.existsSync(INDEX)) {
  console.error('Brak ' + INDEX + ' — najpierw zbuduj grę poza repo (patrz nagłówek pliku).');
  process.exit(2);
}
const URL_GAME = 'file://' + INDEX + '?playtest=miasto';

let pass = 0;
let fail = 0;
function assert(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -- ' + detail : '')); }
}

async function launch(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    const fallback = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
    if (!fs.existsSync(fallback)) throw e;
    return chromium.launch({ headless: true, executablePath: fallback, args: ['--no-sandbox'] });
  }
}

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('Brak playwright w node_modules — uruchom najpierw npm ci w gra/.'); process.exit(2); }

  const browser = await launch(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(URL_GAME, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(
      () => !!window.__prodEmptyTestDebug && !!window.__sidePanelLinkTestDebug
        && window.__sidePanelLinkTestDebug.firstPlayerCity() !== null,
      null, { timeout: 180000 },
    );
    const cityId = await page.evaluate(() => window.__sidePanelLinkTestDebug.firstPlayerCity().id);
    const eventId = 'prod-empty-' + cityId;

    console.log('\n-- (1) miasto BEZ surowców: magazyn 0, skarbiec 0, rekruci 0 --');
    await page.evaluate((id) => {
      const d = window.__prodEmptyTestDebug;
      d.grantStock(0, 0);
      d.setTreasury(0, 0);
      d.setManpower(0, 0);
      d.clearQueue(id);
    }, cityId);
    const noRes = await page.evaluate((id) => {
      const probe = window.__prodEmptyTestDebug.probe(id);
      const shown = window.__sidePanelLinkTestDebug.allEvents().some(e => e.id === 'prod-empty-' + id);
      return { probe, shown };
    }, cityId);
    const anyNow1 = noRes.probe.buildings.some(b => b.canBuildNow) || noRes.probe.units.some(u => u.canBuildNow);
    console.log(`        (możliwe teraz: ${anyNow1}; pozycje budowy=${noRes.probe.buildings.length}, jednostki=${noRes.probe.units.length})`);
    assert('(1a) zdarzenie w collectTurnEvents zgadza się z „czy coś możliwe teraz”',
      noRes.probe.eventPresent === anyNow1,
      `eventPresent=${noRes.probe.eventPresent}, anyNow=${anyNow1}`);
    assert('(1b) zdarzenie widoczne w allEvents zgadza się z collectTurnEvents',
      noRes.shown === noRes.probe.eventPresent);
    if (!anyNow1) {
      assert('(1c) bez surowców i bez możliwych pozycji — BRAK zdarzenia ' + eventId,
        noRes.probe.eventPresent === false && noRes.shown === false);
    }

    console.log('\n-- (2) miasto Z surowcami: magazyn, skarbiec i rekruci > 0 --');
    await page.evaluate((id) => {
      const d = window.__prodEmptyTestDebug;
      d.grantStock(0, 100000);
      d.setTreasury(0, 100000);
      d.setManpower(0, 100000);
      d.clearQueue(id);
    }, cityId);
    const withRes = await page.evaluate((id) => {
      const probe = window.__prodEmptyTestDebug.probe(id);
      const shown = window.__sidePanelLinkTestDebug.allEvents().some(e => e.id === 'prod-empty-' + id);
      return { probe, shown };
    }, cityId);
    const anyNow2 = withRes.probe.buildings.some(b => b.canBuildNow) || withRes.probe.units.some(u => u.canBuildNow);
    console.log(`        (możliwe teraz: ${anyNow2}; pozycje budowy=${withRes.probe.buildings.length}, jednostki=${withRes.probe.units.length})`);
    assert('(2a) z surowcami istnieje pozycja możliwa teraz (warunek sandboxu)', anyNow2 === true,
      'brak pozycji możliwej teraz — sprawdź stan sandboxu ?playtest=miasto');
    assert('(2b) z surowcami zdarzenie prod-empty jest obecne',
      withRes.probe.eventPresent === true && withRes.shown === true,
      `eventPresent=${withRes.probe.eventPresent}, shown=${withRes.shown}`);

    console.log('\n-- (3) zgodność z predykatem panelu na tej samej migawce --');
    assert('(3) eventPresent === (buildingCanBuildNow || unitRecruitAllowedNow) dla obu stanów',
      withRes.probe.eventPresent === anyNow2 && noRes.probe.eventPresent === anyNow1);
  } finally {
    await browser.close();
  }

  console.log(`\nWYNIK: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
  console.error('BŁĄD TESTU:', e && e.stack ? e.stack : e);
  process.exit(1);
});
