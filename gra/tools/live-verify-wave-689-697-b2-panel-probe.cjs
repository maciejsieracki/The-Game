'use strict';
/**
 * live-verify-wave-689-697-b2-panel-probe.cjs — R-WEB-LIVE-VERIFY-WAVE-689-697-B2-PANEL-AIAI-CITYCHANGE-Q1 (pomiar, odczyt).
 *
 * Realna sciezka startu gry (__nnsMeasureDebug.startGame + foundFirstCity, BEZ ?playtest=mapa), REALNE wypowiedzenie
 * wojny AI -> gracz (__truceTestDebug.declareWar), zwykly endTurn, tryb przyspieszony. Po turach docelowych
 * (PROBE_TURNS, domyslnie 5,10,16,20) zapisuje: zrzut ekranu (PNG) i tekst DOM zawierajacy slowa panelu
 * zmeczenia/desperacji. Wszystko read-only; hak nie zmienia logiki gry.
 *
 * Usage (z gra/):
 *   SEED=271828 RESULT=<abs.json> SHOT_DIR=<abs> BUNDLE_DIR=<abs> SKIP_BUILD=1 node tools/live-verify-wave-689-697-b2-panel-probe.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const BUNDLE = process.env.BUNDLE_DIR;
const SEED = parseInt(process.env.SEED || '271828', 10);
const RESULT = process.env.RESULT;
const SHOT_DIR = process.env.SHOT_DIR || path.dirname(RESULT || '.');
const MAX_MS = parseInt(process.env.MAX_SEC || '480', 10) * 1000;
const LAST_TURN = parseInt(process.env.LAST_TURN || '20', 10);
const PROBE = (process.env.PROBE_TURNS || '5,10,16,20').split(',').map(s => parseInt(s, 10));
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const wait = ms => new Promise(r => setTimeout(r, ms));

function buildBundle() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(BUNDLE, 'index.html'))) return;
  execSync('node ./node_modules/vite/bin/vite.js build --outDir ' + JSON.stringify(BUNDLE) + ' --emptyOutDir',
    { cwd: GRA_DIR, stdio: 'pipe', timeout: 500000 });
}

async function launchBrowser(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  try { return await chromium.launch({ headless: true, args }); } catch (_) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args });
  }
}

async function clearBattles(page) {
  for (let k = 0; k < 12; k++) {
    const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState());
    if (!bs.preBattleOpen && !bs.pendingAuto && !bs.sceneOpen && !bs.summaryOpen && !bs.resolving) break;
    const act = await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug;
      const b = document.querySelector('.pb-overlay [data-act="auto"]');
      if (b) { b.click(); return 'auto'; }
      if (h.closeBattleSummary()) return 'summary';
      if (h.flushBattles()) return 'flush';
      return 'wait';
    });
    await wait(act === 'wait' ? 300 : 150);
  }
}

async function clearOffers(page) {
  for (let k = 0; k < 12; k++) {
    if (await page.evaluate(() => window.__nnsMeasureDebug.canEnd())) return;
    const n = await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug;
      const ents = window.__truceTestDebug.negotiationEntries();
      for (const e of ents) h.reject(e.id);
      return ents.length;
    });
    if (!n) return;
    await wait(100);
  }
}

async function endTurnWait(page) {
  const t0 = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
  await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
  await page.waitForFunction(
    t => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(),
    t0, { timeout: 120000 },
  );
  await wait(50);
}

// Zbiera tylko linie tekstu zawierajace slowa panelu wojny (read-only).
async function domProbe(page) {
  return page.evaluate(() => {
    const txt = (document.body.innerText || '').split('\n').map(s => s.trim()).filter(Boolean);
    const hits = txt.filter(s => /zmęcz|zmecz|desper|pokój|pokoj|wojn/i.test(s)).slice(0, 40);
    return { lines: hits, totalLines: txt.length };
  });
}

function save(rep) { fs.writeFileSync(RESULT, JSON.stringify(rep, null, 2)); }

async function main() {
  if (!BUNDLE || !RESULT) { console.error('wymagane BUNDLE_DIR i RESULT'); process.exit(1); }
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) { console.error('playwright nie znaleziony'); process.exit(1); }
  buildBundle();
  const browser = await launchBrowser(chromium);
  const t0 = Date.now();
  const rep = { seed: SEED, lastTurnRequested: LAST_TURN, probeTurns: PROBE, ai: null, warDeclaredAtTurn: null, probes: [], turns: [], stoppedBy: null, pageErrors: [] };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => { if (rep.pageErrors.length < 10) rep.pageErrors.push(String(e).slice(0, 200)); });
    page.on('dialog', d => d.dismiss().catch(() => {}));
    const url = 'file://' + path.join(BUNDLE, 'index.html') + '?civTest=1&civSeed=' + SEED;
    await page.goto(url, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__nnsMeasureDebug && !!window.__aiTradeWiringTestDebug, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.evaluate(o => window.__nnsMeasureDebug.startGame(o), { seed: SEED, mapSize: 'Standardowy', civTypes: 15, cityStates: 2 });
    let ready = false;
    for (let i = 0; i < 400 && !ready && Date.now() - t0 < MAX_MS; i++) {
      await wait(1000);
      const st = await page.evaluate(() => {
        const h = window.__nnsMeasureDebug;
        return { w: h.worldReady(), aw: h.awaitingFirstCity() };
      }).catch(e => ({ err: String(e).slice(0, 120) }));
      rep.lastState = st;
      if (i % 15 === 0) { rep.stateLog = rep.stateLog || []; rep.stateLog.push({ i, ...st }); save(rep); }
      ready = !!st.w && !!st.aw;
    }
    if (!ready) { rep.stoppedBy = 'swiat nie wygenerowany w limicie'; save(rep); return; }
    if (!(await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity()))) { rep.stoppedBy = 'foundFirstCity()=false'; save(rep); return; }
    await wait(1500);
    await page.evaluate(() => window.__aiTradeWiringTestDebug.setFastMode(true));
    const info = await page.evaluate(() => window.__aiTradeWiringTestDebug.info());
    rep.ai = info.ai;
    await page.evaluate(ai => window.__truceTestDebug.declareWar(ai, 0), info.ai);
    rep.warDeclaredAtTurn = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
    save(rep);
    for (let t = 1; t <= LAST_TURN; t++) {
      if (Date.now() - t0 > MAX_MS) { rep.stoppedBy = 'limit czasu po turze ' + (t - 1); break; }
      await clearBattles(page);
      await clearOffers(page);
      try { await endTurnWait(page); } catch (e) { rep.stoppedBy = 'blad endTurn: ' + String(e.message || e).slice(0, 160); break; }
      const turn = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
      rep.turns.push(turn);
      rep.lastTurn = turn;
      if (PROBE.includes(turn)) {
        const shot = path.join(SHOT_DIR, `b2-T${turn}-seed${SEED}.png`);
        await page.screenshot({ path: shot });
        const dom = await domProbe(page);
        rep.probes.push({ turn, screenshot: shot, dom });
      }
      save(rep);
    }
    if (!rep.stoppedBy) rep.stoppedBy = 'koniec zakresu';
    rep.elapsedSec = Math.round((Date.now() - t0) / 1000);
    save(rep);
  } catch (e) {
    rep.stoppedBy = 'blad: ' + String((e && e.message) || e).slice(0, 300);
    save(rep);
  } finally {
    await browser.close();
  }
  console.log('[b2] zapisano ' + RESULT + ' stoppedBy=' + rep.stoppedBy + ' lastTurn=' + rep.lastTurn);
}

main();
