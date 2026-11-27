'use strict';
// R-WEB-VERIFY-LIVE-3-Q1 (VLIVE3), pozycja 1: Targowisko (Żywność → Podatek, kurs 0,2) — pomiar JEDNEJ tury
// na żywej grze na poziomie MAKSYMALNYM (difficulty 'Trudny', dyplomacja 'trudna', koszty jednostek 'wysoki' ×4,
// kultura i religia 'trudny'). Start przez REALNY hak __settingsLive.startNewGame (ta sama funkcja co „Start”).
// Dwa ramiona, każde = osobna strona i osobna gra:
//   A: Targowisko w mieście gracza, rezerwa Żywności 100, BEZ zamiany, jedna tura.
//   B: jak A, ale REALNA zamiana 100 Żywności (convertOwnerFoodToTaxLive = ta sama wiązka io co przycisk w UI), jedna tura.
// Mierzy: zmianę skarbca gracza po jednej turze (B − A), rezerwę Żywności, kolejkę podatku, wynik zamiany.
// Oczekiwane: zamiana 100 -> 20 Podatku (kurs 0,2 z gra/data/econ-params.json, budynki.targowisko_zywnosc_na_podatek_kurs.hard).
// Zero zmian reguł; SETUP (budynek, rezerwa) przez istniejący hak civTest (__civTest.adminSetup) i __settingsLive.setOwnerFoodReserveLive.
// Uruchomienie (z gra/): node tools/vlive3-targowisko-live.cjs <katalog_poza_repo>   wynik: linia JSON + rc 0/1.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const { resolveChromePath } = require('./_chrome-path.cjs');
const { closeCivWelcome, prepareEndTurnGate } = require('./_live-ready.cjs');

const GRA = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || '/nonexistent-out');
if (!process.argv[2] || OUT.startsWith(path.resolve(GRA, '..'))) { console.error('Podaj katalog POZA repo'); process.exit(2); }
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const RATE_HARD = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'econ-params.json'), 'utf8')).budynki.targowisko_zywnosc_na_podatek_kurs.hard;
const FOOD_RESERVE = 100;
const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: 'Maly', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: 778899,
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 4, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: {
    barbariansLevel: 'normalny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
    kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30,
    landFractionCustom: false, cityStateDifficultyOverride: 'normal', cityLimitBase: 10,
    diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
  },
  villageRewardsEnabled: true,
};

async function runArm(browser, html, withConversion) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__settingsLive, null, { timeout: 60000 });
  await page.evaluate((p) => window.__settingsLive.startNewGame(p), MAX_PARAMS);
  await page.waitForFunction(() => !!(window.__nnsMeasureDebug && window.__nnsMeasureDebug.gateInfo && window.__nnsMeasureDebug.gateInfo()), null, { timeout: 400000 });
  // SETUP (jak fortring-measure.cjs): po utworzeniu świata gracz zakłada pierwsze miasto realnym wzorcem (foundFirstCity).
  await page.waitForFunction(() => window.__nnsMeasureDebug.awaitingFirstCity() === true, null, { timeout: 600000, polling: 500 });
  const founded = await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
  assert.ok(founded, 'foundFirstCity=true');
  await page.waitForTimeout(6000);
  const welcome = await closeCivWelcome(page);
  const settings = await page.evaluate(() => window.__settingsLive.getSettings());
  const cityId = await page.evaluate(() => window.__cityCessionTestDebug.ownerCityIds(0)[0] ?? null);
  assert.ok(cityId, 'gracz ma miasto');
  // SETUP: Targowisko w mieście gracza (budynek zbudowany, nie efekt tury).
  await page.evaluate((cid) => window.__civTest.adminSetup(cid, ['targowisko'], null, null, null), cityId);
  const built = await page.evaluate((cid) => window.__civTest.adminState(cid).built, cityId);
  assert.ok(Array.isArray(built) && built.includes('targowisko'), 'Targowisko zbudowane w mieście gracza (setup): ' + JSON.stringify(built));
  await page.evaluate(() => window.__settingsLive.setOwnerFoodReserveLive(0, 100));
  const gate = await prepareEndTurnGate(page);
  const before = await page.evaluate(() => {
    const s = window.__settingsLive;
    const conv = s.convertFoodToTax(0, 100, 100);
    return { turn: window.__nnsMeasureDebug.gateInfo().turn, treasury: s.ownerTreasuryLive(0), reserve: s.ownerFoodReserveLive(0),
      pending: s.ownerTaxPendingLive(0), canConvert: conv.enabled, rate: conv.rate };
  });
  let act = null;
  if (withConversion) {
    act = await page.evaluate(() => window.__settingsLive.convertOwnerFoodToTaxLive(0, 100));
  }
  const mid = await page.evaluate(() => {
    const s = window.__settingsLive;
    return { treasury: s.ownerTreasuryLive(0), reserve: s.ownerFoodReserveLive(0), pending: s.ownerTaxPendingLive(0) };
  });
  await page.evaluate(() => window.__civTest.endTurn());
  await page.waitForFunction((t) => window.__nnsMeasureDebug.gateInfo().turn > t, before.turn, { timeout: 300000 });
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => {
    const s = window.__settingsLive;
    return { turn: window.__nnsMeasureDebug.gateInfo().turn, treasury: s.ownerTreasuryLive(0), reserve: s.ownerFoodReserveLive(0), pending: s.ownerTaxPendingLive(0), rates: s.ownerRatesLive() };
  });
  await context.close();
  return { welcome, settings, gate, before, act, mid, after, errors };
}

async function main() {
  execFileSync('node', [LIVE_TOOL, OUT], { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  const html = path.join(OUT, 'Gra-LIVE.html');
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath() || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const res = { rateHardFromData: RATE_HARD, foodReserve: FOOD_RESERVE };
  try {
    res.A = await runArm(browser, html, false);
    res.B = await runArm(browser, html, true);
  } finally { await browser.close(); }
  const dTreasury = res.B.after.treasury - res.A.after.treasury;
  res.deltaTreasuryB_minus_A = dTreasury;
  res.expectedTax = Math.floor(FOOD_RESERVE * RATE_HARD + 1e-9);
  console.log('VLIVE3-TARGOWISKO-JSON ' + JSON.stringify(res));
  const errs = [...res.A.errors, ...res.B.errors];
  assert.deepEqual(errs, [], 'brak pageerror');
  assert.equal(res.A.settings.difficulty, 'hard', 'poziom Trudny (klucz wewnetrzny hard)');
  assert.equal(res.B.before.canConvert, true, 'bramka zamiany otwarta z Targowiskiem');
  assert.equal(res.B.before.rate, RATE_HARD, 'kurs z danych (hard)');
  // Wynik zamiany: runManualFoodTaxAction zwraca zamienione Żywność (100). Kolejka podatku = 100 x kurs 0,2 = 20.
  assert.equal(res.B.act, FOOD_RESERVE, 'zamieniono 100 Zywnosci');
  assert.equal(res.B.mid.reserve, 0, 'rezerwa Zywnosci po zamianie = 0');
  assert.equal(res.B.mid.pending, res.expectedTax, 'kolejka podatku po zamianie = 100 x 0,2');
  // Skarbiec po jednej turze: Podatek wchodzi do ekonomii stolicy (turn-economy additionalTax), wiec netto <= 20.
  // Pomiar: netto skarbca (B - A). Udzial netto = wynik / 20 — raportowany, mechanizm podzialu NIE ZMIERZONO w tym biegu.
  res.measuredTreasuryShareOfTax = dTreasury / res.expectedTax;
  assert.ok(dTreasury > 0 && dTreasury <= res.expectedTax, 'skarbiec po turze rosnie o czesc podatku (0 < d <= 20): ' + dTreasury);
  console.log('VLIVE3-TARGOWISKO PASS (zamiana 100->20 zgodna z kursem 0,2; netto skarbca po turze ' + dTreasury + ' z 20)');
}
main().catch(e => { console.error('VLIVE3-TARGOWISKO FAIL', e.message); process.exit(1); });
