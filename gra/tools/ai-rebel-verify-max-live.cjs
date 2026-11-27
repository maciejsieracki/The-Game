'use strict';
/**
 * ai-rebel-verify-max-live.cjs -- R-WEB-AI-REBEL-VERIFY-LIVE-Q1 (AIREBELVER), pozycja 1 na MAKSYMALNYM poziomie:
 * prawdziwa nowa gra (__nnsMeasureDebug.startGame -> doStartGame) z trudnoscia Trudny i Kultura i religia Trudny.
 * Scenariusz: AI z DOKLADNIE 1 miastem (w t1 zwykle stolica), wymuszony bunt skrajny (__rebelNotifyTestDebug.forceRevoltEligible),
 * potem N REALNYCH endTurn. Oczekiwanie (ochrona ostatniego miasta): miasto zostaje przy wlascicielu (rebelState=false).
 * OGRANICZENIE (jawne): startGame na sztywno ustawia Koszty jednostek = 'niski' (nie 'wysoki' x4) -- brak parametru w haku.
 *
 * Uzycie (z gra/, bundle poza repo): node tools/ai-rebel-verify-max-live.cjs --dist <abs> [--turns 6] [--seed 4242]
 */
const path = require('path');
const fs = require('fs');

const GRA_DIR = path.resolve(__dirname, '..');
function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const DIST = arg('dist', '');
const TURNS = parseInt(arg('turns', '6'), 10);
const SEED = parseInt(arg('seed', '4242'), 10);
if (!DIST || !fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('--dist: brak index.html w ' + DIST);
const URL_GAME = 'file://' + path.join(DIST, 'index.html') + '?civTest=1&civSeed=' + SEED;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const PROG = JSON.parse(fs.readFileSync(path.join(GRA_DIR, 'data', 'society-params.json'), 'utf8')).porzadek.porzadek_prog_bunt_skrajny_pct.hard;

const { closeCivWelcome, prepareEndTurnGate } = require('./_live-ready.cjs');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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
    await page.waitForFunction(() => !!window.__aiEconomyMeasure && !!window.__nnsMeasureDebug && !!window.__rebelNotifyTestDebug && !!window.__eraTestDebug, null, { timeout: 180000 });
    await page.evaluate((s) => window.__nnsMeasureDebug.startGame({ seed: s, kulturaReligiaLevel: 'trudny', difficulty: 'trudny' }), SEED);
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

    // Wybor AI z dokladnie 1 miastem (scenariusz "ostatnie miasto").
    const pick = await page.evaluate((p) => {
      const two = window.__rebelProtectionTestDebug.pickTwoAiOwners();
      if (!two) return null;
      const rows = window.__aiEconomyMeasure.cityStateTurn(p);
      const mine = rows.find((x) => x.owner === two.a);
      return { owner: two.a, miasta: mine ? mine.miasta : null, rozklad: rows.map((x) => [x.owner, x.miasta]) };
    }, PROG);
    if (!pick) throw new Error('brak AI z miastem w t1 (seed ' + SEED + ')');
    const ownerId = pick.owner;
    const cityId = await page.evaluate((o) => window.__rebelProtectionTestDebug.getCityIdForOwner(o), ownerId);
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
      const countAi0 = await page.evaluate((p) => window.__aiEconomyMeasure.cityStateTurn(p).filter((x) => x.owner > 0 && x.miasta === 0).length, PROG).catch(() => null);
      rows.push({ tura: t, ownerId: st.ownerId, rebelState: st.rebelState, grace: st.revoltGraceRemaining, aiZ0Miast: countAi0 });
    }
    const data = rows.filter((r) => !r.nieSettled);
    const incomplete = rows.some((r) => r.nieSettled);
    const verdict = incomplete ? 'NIE ZMIERZONO (tura nie zakonczyla sie)'
      : (data.every((r) => r.rebelState === false && r.ownerId === ownerId) ? 'OCHRONA-DZIALA (miasto zostalo przy wlascicielu we wszystkich turach)' : 'OCHRONA-NIE-DZIALA (miasto zbuntowane)');
    console.log('PREFIX=AIREBELVER-MAX-LAST-CITY ' + JSON.stringify({ seed: SEED, settings, pick, ownerId, cityId, turnsRun: data.length - 1, verdict, rows, errors: errors.slice(0, 5) }));
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error('FAIL ' + (e && e.stack || e)); process.exit(1); });
