'use strict';
/**
 * ai-rebel-verify-max-live.cjs -- R-WEB-AI-REBEL-VERIFY-LIVE-Q1 (AIREBELVER), pozycja 1 i kontrola na MAKSYMALNYM poziomie.
 * Runda 3 (obrona r2, zarzuty 1, 2, 3, 9):
 *  - nowa gra przez __settingsLive.startNewGame (REALNY doStartGame, NewGameParams) z maksimum:
 *    difficulty Trudny, Kultura i religia trudny, Koszty jednostek wysoki (x4), Dyplomacja i wojna trudna;
 *    poziomy sa odczytywane z __settingsLive.getSettings() i zapisywane w wyniku (nie zakladane);
 *  - wybor AI z DOKLADNIE 1 miastem zalezy od ziarna (indeks = seed mod liczba kandydatow);
 *  - metryka "AI z 0 miast" liczy WSZYSTKICH wlascicieli AI, ktorzy w t1 mieli miasto (brak wiersza = 0 miast),
 *    a nie tylko tych, ktorzy jeszcze maja wiersz;
 *  - --target player: kontrola, ten sam hak na JEDYNYM miescie gracza (owner 0).
 * Uzycie (z gra/, bundle poza repo): node tools/ai-rebel-verify-max-live.cjs --dist <abs> [--target ai|player] [--turns 6] [--seed 4242]
 */
const path = require('path');
const fs = require('fs');

const GRA_DIR = path.resolve(__dirname, '..');
function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const DIST = arg('dist', '');
const TARGET = arg('target', 'ai');
const TURNS = parseInt(arg('turns', '6'), 10);
const SEED = parseInt(arg('seed', '4242'), 10);
if (!['ai', 'player'].includes(TARGET)) throw new Error('--target: ai|player');
if (!DIST || !fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('--dist: brak index.html w ' + DIST);
const URL_GAME = 'file://' + path.join(DIST, 'index.html') + '?civTest=1&civSeed=' + SEED;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const PROG = JSON.parse(fs.readFileSync(path.join(GRA_DIR, 'data', 'society-params.json'), 'utf8')).porzadek.porzadek_prog_bunt_skrajny_pct.hard;

const { closeCivWelcome, prepareEndTurnGate } = require('./_live-ready.cjs');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Maksimum ustawien (zasada wlasciciela 2026-11-26): parametry jak w diplomacy-harder-measure-run.cjs, poziomy na maksimum.
const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brazu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: 'Standardowy', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty',
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 15, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: {
    barbariansLevel: 'normalny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
    kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30, landFractionCustom: false,
    cityStateDifficultyOverride: 'normal', cityLimitBase: 10, diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
  },
  villageRewardsEnabled: true,
};

async function endTurnSettle(page, timeoutMs = 240000) {
  const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
    const now = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    if (!inProg && now > before) return true;
    await wait(150);
  }
  return false;
}

async function main() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({
    headless: true, executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const errors = [];
  const rows = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await page.goto(URL_GAME, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__aiEconomyMeasure && !!window.__settingsLive && !!window.__rebelNotifyTestDebug && !!window.__eraTestDebug && !!window.__rebelProtectionTestDebug, null, { timeout: 180000 });
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), Object.assign({ seed: SEED }, MAX_PARAMS));
    await page.waitForFunction(() => { try { return window.__eraTestDebug.getWorldState().turn >= 1; } catch (_) { return false; } }, null, { timeout: 240000 });
    await page.waitForFunction(() => {
      const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
    }, null, { timeout: 600000, polling: 500 });
    const founded = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
    if (!founded) throw new Error('foundFirstCity=false');
    await page.waitForFunction(() => { try { return window.__rebelProtectionTestDebug.pickTwoAiOwners() !== null; } catch (_) { return false; } }, null, { timeout: 240000, polling: 500 });
    await page.evaluate(() => { try { window.__truceTestDebug && window.__truceTestDebug.suppressVictoryForTest && window.__truceTestDebug.suppressVictoryForTest(); } catch (_) {} });
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
    const settings = await page.evaluate(() => window.__settingsLive.getSettings());

    const t1 = await page.evaluate((p) => window.__aiEconomyMeasure.cityStateTurn(p).map((x) => [x.owner, x.miasta]), PROG);
    const aiOneCity = t1.filter(([o, m]) => o > 0 && m === 1).map(([o]) => o);
    const aiWithCity = t1.filter(([o, m]) => o > 0 && m >= 1).map(([o]) => o);
    let ownerId;
    let cityId;
    if (TARGET === 'ai') {
      if (aiOneCity.length === 0) throw new Error('brak AI z dokladnie 1 miastem w t1 (seed ' + SEED + ')');
      ownerId = aiOneCity[SEED % aiOneCity.length];
      cityId = await page.evaluate((o) => window.__rebelProtectionTestDebug.getCityIdForOwner(o), ownerId);
    } else {
      ownerId = 0;
      cityId = await page.evaluate(() => window.__rebelProtectionTestDebug.getCityIdForOwner(0));
    }
    if (!cityId) throw new Error('brak cityId dla owner ' + ownerId);
    const forced = await page.evaluate((c) => window.__rebelNotifyTestDebug.forceRevoltEligible(c), cityId);
    const st0 = await page.evaluate((c) => window.__rebelNotifyTestDebug.getCityState(c), cityId);
    rows.push({ tura: 1, ownerId: st0.ownerId, rebelState: st0.rebelState, grace: st0.revoltGraceRemaining, forced });

    for (let t = 2; t <= TURNS + 1; t++) {
      await closeCivWelcome(page);
      await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
      await prepareEndTurnGate(page).catch(() => null);
      const settled = await endTurnSettle(page);
      if (!settled) { rows.push({ tura: t, nieSettled: true }); break; }
      const st = await page.evaluate((c) => window.__rebelNotifyTestDebug.getCityState(c), cityId);
      const now = await page.evaluate((p) => window.__aiEconomyMeasure.cityStateTurn(p).map((x) => [x.owner, x.miasta]), PROG);
      const countOf = (o) => { const r = now.find(([oo]) => oo === o); return r ? r[1] : 0; };
      // Metryka: wszyscy wlasciciele AI, ktorzy w t1 mieli miasto; brak wiersza = 0 miast.
      const aiZ0Miast = aiWithCity.filter((o) => countOf(o) === 0).length;
      rows.push({ tura: t, ownerId: st.ownerId, rebelState: st.rebelState, grace: st.revoltGraceRemaining, celMiasta: countOf(ownerId), aiZ0Miast, aiZ1PoT1: aiWithCity.length });
    }
    const data = rows.filter((r) => !r.nieSettled);
    const incomplete = rows.some((r) => r.nieSettled);
    let verdict;
    if (incomplete) verdict = 'NIE ZMIERZONO (tura nie zakonczyla sie)';
    else if (TARGET === 'ai') {
      verdict = data.every((r) => r.rebelState === false && r.ownerId === ownerId && (r.aiZ0Miast === undefined || r.aiZ0Miast === 0))
        ? 'OCHRONA-DZIALA (miasto zostalo przy wlascicielu we wszystkich turach; AI z 0 miast = 0)'
        : 'OCHRONA-NIE-DZIALA (miasto zbuntowane albo AI z 0 miast > 0)';
    } else {
      verdict = data.some((r) => r.rebelState === true || r.ownerId !== ownerId)
        ? 'KONTROLA-ZBUNTOWANA (bez ochrony miasto gracza przeszlo do buntu)'
        : 'KONTROLA-NIEZBUNTOWANA (miasto gracza nie zbuntowane; hak nie wymusil buntu)';
    }
    console.log('PREFIX=AIREBELVER-MAX-' + (TARGET === 'ai' ? 'LAST-CITY' : 'CONTROL-PLAYER') + ' ' + JSON.stringify({
      seed: SEED, target: TARGET, settings, kandydaciJedenMiasto: aiOneCity, ownerId, cityId, turnsRun: data.length - 1, verdict, rows, errors: errors.slice(0, 5),
    }));
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error('FAIL ' + (e && e.stack || e)); process.exit(1); });
