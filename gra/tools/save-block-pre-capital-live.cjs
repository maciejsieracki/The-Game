'use strict';
/**
 * save-block-pre-capital-live.cjs -- R-WEB-SAVE-BLOCK-PRE-CAPITAL-Q43B (test live, Chromium).
 *
 * Sprawdza na żywej grze (poziom MAKSYMALNY: Trudny, Koszty jednostek Wysoki x4, dyplomacja trudna,
 * kultura trudny, rivals=9, civTypesCount=14):
 *   1. przed założeniem pierwszego miasta: saveRoundTrip (persistSaveToSlot) zwraca saved=false,
 *      skrót Ctrl+S nie tworzy wpisu zapisu w localStorage i pokazuje komunikat
 *      „Zapis niedostępny przed założeniem pierwszego miasta” (czytany z #civ-hint-toast);
 *   2. po założeniu stolicy: saveRoundTrip zwraca saved=true i ustawienia po wczytaniu = przed zapisem.
 * NIE obejmuje: pozycji menu pauzy (brak haka do jej kliknięcia), ciągłości B==A >= 6 tur (osobny test).
 *
 * Uruchomienie (z gra/): node tools/save-block-pre-capital-live.cjs <abs-sciezka-do-Gra-LIVE.html>
 * Bundle: node tools/test-hook-setcitylimit-live-bundle.cjs <katalog-wyjsciowy>  (poza repo, np. scratchpad).
 * Kod wyjścia: 0 = wszystkie asercje OK; 1 = porażka; 2 = błąd infrastruktury.
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const { resolveChromePath } = require('./_chrome-path.cjs');

const MSG = 'Zapis niedostępny przed założeniem pierwszego miasta';
const HTML = path.resolve(process.argv[2] || process.env.SBQ_HTML || '');

const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: 'Maly', rivals: '9', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: 4242,
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 14, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: {
    barbariansLevel: 'trudny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
    kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30,
    landFractionCustom: false, cityStateDifficultyOverride: 'normal', cityLimitBase: 10,
    diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny', kulturaReligiaLevelAI: 'trudny',
  },
  villageRewardsEnabled: true,
};

async function localKeys(page) {
  return page.evaluate(() => {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) out.push(localStorage.key(i));
    return out.sort();
  });
}

/** Tekst komunikatu z dymka podpowiedzi (#civ-hint-toast, showHintMessage) razem z jego widocznością. */
async function hintText(page) {
  return page.evaluate(() => {
    const el = document.getElementById('civ-hint-toast');
    if (!el) return '';
    return el.style.display === 'none' ? '' : (el.textContent || '');
  });
}

async function main() {
  if (!HTML) throw new Error('brak ścieżki do Gra-LIVE.html (argv[2])');
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath() || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const report = { steps: [] };
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + HTML + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__settingsLive && !!window.__nnsMeasureDebug, null, { timeout: 120000 });
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), MAX_PARAMS);
    await page.waitForTimeout(8000);
    await page.waitForFunction(() => window.__nnsMeasureDebug.awaitingFirstCity() === true, null, { timeout: 600000, polling: 500 });

    // 1. Przed stolicą.
    const keys0 = await localKeys(page);
    const rt0 = await page.evaluate(() => window.__settingsLive.saveRoundTrip());
    assert.equal(rt0.saved, false, 'przed stolicą saveRoundTrip: saved=false');
    report.steps.push({ krok: 'saveRoundTrip przed stolicą', saved: rt0.saved });

    await page.keyboard.press('Control+s');
    await page.waitForTimeout(1500);
    const keys1 = await localKeys(page);
    const txt1 = await hintText(page);
    assert.deepEqual(keys1, keys0, 'przed stolicą Ctrl+S nie tworzy wpisu w localStorage');
    const msgSeen = txt1.includes(MSG);
    report.steps.push({ krok: 'Ctrl+S przed stolicą', nowe_klucze: keys1.filter(k => !keys0.includes(k)), komunikat_w_dymku: msgSeen });
    assert.ok(msgSeen, 'przed stolicą Ctrl+S pokazuje komunikat: ' + MSG);

    // 2. Po stolicy.
    const founded = await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
    assert.ok(founded, 'foundFirstCity=true');
    await page.waitForTimeout(3000);
    const before = await page.evaluate(() => window.__settingsLive.getSettings());
    const rt1 = await page.evaluate(() => window.__settingsLive.saveRoundTrip());
    assert.equal(rt1.saved, true, 'po stolicy saveRoundTrip: saved=true');
    assert.deepEqual(rt1.after, before, 'po stolicy round-trip: ustawienia po wczytaniu = przed zapisem');
    report.steps.push({ krok: 'saveRoundTrip po stolicy', saved: rt1.saved, ustawienia_zgodne: true });

    assert.deepEqual(errors, [], 'brak pageerror');
    report.wynik = 'PASS';
    console.log(JSON.stringify(report, null, 2));
  } catch (e) {
    report.wynik = 'FAIL';
    report.blad = String(e && e.message || e);
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error('INFRA: ' + (e && e.stack || e));
  process.exit(2);
});
