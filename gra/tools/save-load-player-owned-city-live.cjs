'use strict';
/**
 * R-WEB-SAVE-LOAD-PLAYER-OWNED-CITY-AND-LEDGER-HISTORY-Q1 -- pomiar/test DYNAMICZNY (headless Chromium, realny bundle).
 *
 * Tryby:
 *   --mode 433  (#433) gracz traci WSZYSTKIE miasta, zapis, wczytanie w NOWEJ stronie tej samej sesji przegladarki.
 *               Oczekiwanie (poprawka): isAwaitingFirstPlayerCity == false po wczytaniu (awaiting=false), zero miast.
 *               Bez poprawki (baza c284fe02d): awaiting=true -> blokada "Zakoncz ture".
 *   --mode 432  (#432) zapis w turze N z niepustym dziennikiem -> wczytanie -> liczba wpisow resourceLedgerHistory
 *               PRZED i PO pierwszym ticku (endTurn). Mierzy sam fakt i liczby, bez interpretacji.
 *
 * Budowa dist POZA repo (kopia gra/ w scratchpadzie): npx vite build --outDir <abs-dist>
 * Uruchomienie (foreground, z gra/):
 *   node tools/save-load-player-owned-city-live.cjs --dist <abs-dist> --mode 433 [--seed 4242] [--out <abs.json>]
 *   node tools/save-load-player-owned-city-live.cjs --dist <abs-dist> --mode 432 [--seed 4242] [--turns 2] [--out <abs.json>]
 * Przegladarka: domyslna Playwright (chromium.launch()) albo --chrome <sciezka do binarki>.
 * Exit 0 gdy wynik zgodny z oczekiwaniem trybu (433: awaiting=false); 432 zawsze 0 po zmierzeniu (wynik w JSON).
 */
const fs = require('fs');
const path = require('path');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const GRA = path.resolve(__dirname, '..');
const PW = path.join(GRA, 'node_modules', 'playwright');
const DIST = path.resolve(arg('dist', ''));
const MODE = arg('mode', '433');
const SEED = Number(arg('seed', '4242'));
const TURNS = Number(arg('turns', '2'));
const CHROME = arg('chrome', '');
const OUT = path.resolve(arg('out', path.join(GRA, 'run-owned-city-live.json')));
const SLOT = 'pownedcity-live-' + MODE + '-' + SEED;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), MODE, ...a);

async function bootPage(page) {
  await page.goto('file://' + path.join(DIST, 'index.html') + `?civTest=1&civSeed=${SEED}`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug
    && !!window.__aiBuildingsTestDebug && !!window.__nnsMeasureDebug && !!window.__ledgerRealPathDebug, undefined, { timeout: 180000 });
  await page.waitForSelector('.civ-menu', { timeout: 180000 });
}

async function waitAwaiting(page) {
  const t0 = Date.now();
  for (;;) {
    const ok = await page.evaluate(() => { try { const d = window.__cityStateStartUnitsTestDebug.dumpState(); return d.awaitingFirstPlayerCity === true && d.playerStartHex !== null; } catch (e) { return false; } });
    if (ok) return;
    if (Date.now() - t0 > 900000) throw new Error('timeout awaitingFirstPlayerCity');
    await wait(500);
  }
}

/** Pomiar dziennika: pamiec (wszyscy wlasciciele), pole zapisu (ludzie), limit tur (historyN = stala z ustawien, NIE liczba wpisow). */
const measureLedger = (p) => p.evaluate(() => {
  const d = window.__ledgerRealPathDebug;
  const h = d.historyForSave(); const s = d.savedHistory();
  const len = (x) => (Array.isArray(x) ? x.length : (x && typeof x === 'object' ? Object.keys(x).length : -1));
  return { memEntries: len(h), memBytes: d.historyBytes(), saveEntries: len(s), saveBytes: d.savedBytes(), historyNCap: d.historyN() };
});

async function endTurnAndWait(page, bypassGate = false) {
  const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  if (bypassGate) {
    // Bramka NNS gracza (przed endTurn) -- dosypka jak w ai-economy-measure-run.cjs (tylko tryb 432, zglaszane w raporcie).
    const blocked = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
    if (blocked) {
      await page.evaluate(() => window.__aiTradeWiringTestDebug.grantPlayerGold(500));
      await page.evaluate(() => window.__aiTradeWiringTestDebug.grantPlayerFood(500));
    }
  }
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t1 = Date.now();
  for (;;) {
    const s = await page.evaluate(() => ({ ip: window.__eraTestDebug.isEndTurnInProgress(), turn: window.__eraTestDebug.getWorldState().turn }));
    if (!s.ip && s.turn > before) return s.turn;
    if (Date.now() - t1 > 400000) throw new Error('endTurn timeout at turn ' + before);
    await wait(300);
  }
}

async function main() {
  const { chromium } = require(PW);
  const res = { mode: MODE, dist: DIST, seed: SEED, slot: SLOT, steps: [], error: null };
  const flush = () => fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  const launchOpts = { headless: true, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  if (CHROME) launchOpts.executablePath = CHROME;
  const browser = await chromium.launch(launchOpts);
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p1 = await context.newPage();
    p1.on('dialog', (d) => d.dismiss().catch(() => {}));
    await bootPage(p1);
    await p1.evaluate((s) => window.__aiBuildingsTestDebug.startNewGame({ seed: s }), SEED);
    await waitAwaiting(p1);
    if (!(await p1.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()))) throw new Error('foundPlayerStartCity false');
    await wait(500);
    try { await p1.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest()); } catch (e) { res.steps.push({ note: 'disableVictoryCheck: ' + String(e).slice(0, 120) }); }

    if (MODE === '433') {
      res.steps.push({ step: 'sesja1 po zalozeniu miasta', playerCities: await p1.evaluate(() => window.__nnsMeasureDebug.playerCities()) });
      await p1.evaluate(() => window.__nnsMeasureDebug.debugKillPlayer(false)); // gracz traci miasta i jednostki, flaga w pamieci zostaje
      res.steps.push({ step: 'sesja1 po utracie miast', playerCities: await p1.evaluate(() => window.__nnsMeasureDebug.playerCities()) });
      res.steps.push({ step: 'sesja1 quickSave', ok: await p1.evaluate((s) => window.__nnsMeasureDebug.quickSave(s), SLOT) });
      flush();
      const p2 = await context.newPage();
      p2.on('dialog', (d) => d.dismiss().catch(() => {}));
      await bootPage(p2);
      await p2.evaluate((s) => window.__nnsMeasureDebug.loadSlot(s), SLOT);
      await p2.waitForFunction(() => { try { return window.__nnsMeasureDebug.worldReady() && !!window.__cityStateStartUnitsTestDebug.dumpState(); } catch (e) { return false; } }, undefined, { timeout: 300000 });
      await wait(800);
      const d = await p2.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
      res.awaitingAfterLoad = d.awaitingFirstPlayerCity;
      res.steps.push({ step: 'sesja2 po wczytaniu', playerCities: await p2.evaluate(() => window.__nnsMeasureDebug.playerCities()), awaitingFirstPlayerCity: d.awaitingFirstPlayerCity });
      try {
        const t = await endTurnAndWait(p2);
        res.steps.push({ step: 'sesja2 endTurn po wczytaniu', ok: true, turnAfter: t });
      } catch (e) { res.steps.push({ step: 'sesja2 endTurn po wczytaniu', ok: false, err: String(e).slice(0, 160) }); }
      res.pass = res.awaitingAfterLoad === false;
      flush();
      log('awaitingAfterLoad=' + res.awaitingAfterLoad + ' PASS=' + res.pass);
      process.exitCode = res.pass ? 0 : 1;
    } else if (MODE === '432') {
      for (let i = 0; i < TURNS; i++) {
        const t = await endTurnAndWait(p1, true);
        res.steps.push({ step: 'sesja1 endTurn', turn: t, ledger: await measureLedger(p1) });
        flush();
      }
      res.steps.push({ step: 'sesja1 PRZED zapisem', ledger: await measureLedger(p1) });
      res.steps.push({ step: 'sesja1 quickSave', ok: await p1.evaluate((s) => window.__nnsMeasureDebug.quickSave(s), SLOT) });
      // Diagnostyka (ta sama sesja): round-trip w pamieci REALNYM buildSaveGameSnapshot+restoreGameFromSave.
      res.steps.push({ step: 'sesja1 saveRoundTrip (ta sama sesja)', rt: await p1.evaluate(() => window.__ledgerRealPathDebug.saveRoundTrip(false)) });
      flush();
      const p2 = await context.newPage();
      p2.on('dialog', (d) => d.dismiss().catch(() => {}));
      await bootPage(p2);
      await p2.evaluate((s) => window.__nnsMeasureDebug.loadSlot(s), SLOT);
      await p2.waitForFunction(() => { try { return window.__nnsMeasureDebug.worldReady(); } catch (e) { return false; } }, undefined, { timeout: 300000 });
      await wait(800);
      res.steps.push({ step: 'sesja2 PO wczytaniu, PRZED tickiem', ledger: await measureLedger(p2) });
      flush();
      try {
        const t = await endTurnAndWait(p2, true);
        res.steps.push({ step: 'sesja2 PO pierwszym ticku', turnAfter: t, ledger: await measureLedger(p2) });
      } catch (e) { res.steps.push({ step: 'sesja2 PO pierwszym ticku', ok: false, err: String(e).slice(0, 160) }); }
      flush();
      log('432 zmierzone; kroki=' + res.steps.length);
    } else {
      throw new Error('nieznany --mode ' + MODE);
    }
  } catch (e) {
    res.error = String(e).slice(0, 400);
    log('FATAL ' + res.error);
    process.exitCode = 1;
  } finally {
    flush();
    await browser.close();
  }
}

main();
