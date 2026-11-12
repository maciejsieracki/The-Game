'use strict';
/**
 * measure-ai-trade-offer-frequency.cjs — R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 (POMIAR, tylko odczyt).
 *
 * Mierzy, jak czesto AI skladala graczowi oferte handlowa w PELNEJ grze (zywy bundle vite, headless Chromium,
 * `?playtest=mapa&civTest=1`, realny endTurn, AI normalny). Zero zmian w gra/src: skrypt korzysta wylacznie z
 * istniejacego haka `window.__aiTradeWiringTestDebug` (ta sama bramka ?civTest=1 co reszta hakow).
 *
 * Liczone per przebieg (surowe liczby, bez progu):
 *   - offers        : nowe wpisy AI->gracz typu wymiana cykliczna (aiCyclicBarter) pojawiajace sie na stole,
 *   - activePrzyjmij: z tych ofert ile mialo podglad „Przyjmij” gracza AKTYWNY (previewAccept.accepted),
 *   - pairs         : liczba ofert per para (give -> recv) z payloadu,
 *   - cyclicDealsMax: maks. liczba aktywnych umow cyklicznych w jednej turze,
 *   - tableGrowth   : przyrost calkowitej liczby wpisow na stole (wszystkie typy; NIE klasyfikowane — jednorazowe
 *                     i pozostale oferty nie maja hakowego odczytu typu, wiec ich liczba jest NIE_ZMIERZONO),
 *   - per100        : offers * 100 / turnsRun.
 * Gdy wisząca oferta blokuje koniec tury (bramka stolu), skrypt ja odrzuca (reject) i liczy jako „odrzucona przez
 * skrypt” — gracz nie reaguje w tym tescie; to jest jawne zalozenie pomiaru.
 *
 * Ograniczenia (jawnie, nie ukrywane):
 *   - ziarno: stale PLAYTEST_MAPA_SEED (brak parametru URL ani haka zmiany ziarna) => 1 ziarno, NIE_ZMIERZONO 3 ziaren;
 *   - relacja: brak haka ustawiania poziomu relacji => 1 poziom (naturalny po setupie), NIE_ZMIERZONO 3 poziomow;
 *   - ramiona: „natural” = bez haka prepare (kontakt/technologia wg gry); „prepared” = prepare() raz na starcie
 *     (kontakt + technologia Wymiany, wyciszenie innych klas ofert) — tylko do porownania, NIE jest pomiarem naturalnym.
 *
 * Usage (z gra/):
 *   MEAS_TURNS=150 MEAS_ARM=natural MEAS_RESULT=<abs.json> BUNDLE_DIR=<abs> node tools/measure-ai-trade-offer-frequency.cjs
 *   MEAS_ARM: natural | prepared (domyslnie natural). MEAS_MAX_SEC: limit czasu przebiegu (domyslnie 540 s);
 *   po limicie zapisuje raport czesciowy z `turnsRun`. Bundle: BUNDLE_DIR (budowany osobno poza repo; SKIP_BUILD=1 pomija build).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const BUNDLE = process.env.BUNDLE_DIR || path.join(os.tmpdir(), 'measure-ai-trade-dist');
const TURNS = parseInt(process.env.MEAS_TURNS || '150', 10);
const ARM = process.env.MEAS_ARM === 'prepared' ? 'prepared' : 'natural';
const MAX_MS = parseInt(process.env.MEAS_MAX_SEC || '540', 10) * 1000;
const RESULT_FILE = process.env.MEAS_RESULT || '';
const URL_HTML = 'file://' + path.join(BUNDLE, 'index.html') + '?playtest=mapa&civTest=1';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const wait = ms => new Promise(r => setTimeout(r, ms));

function buildBundle() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(BUNDLE, 'index.html'))) return;
  console.log(`[meas] build vite -> ${BUNDLE}`);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(BUNDLE)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', timeout: 500000 });
}

async function launchBrowser(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  try { return await chromium.launch({ headless: true, args }); } catch (_) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args });
  }
}

/** Bitwa otwarta w oknie przedbitewnym (gracz/AI/barbarzyńcy) blokuje koniec tury: rozstrzyga ją przycisk „Auto” (wybór gracza w grze). */
async function clearBattles(page) {
  let n = 0;
  for (let k = 0; k < 5; k++) {
    const clicked = await page.evaluate(() => {
      const b = document.querySelector('.pb-overlay [data-act="auto"]');
      if (!b) return false;
      b.click();
      return true;
    });
    if (!clicked) break;
    n++;
    await wait(400);
  }
  return n;
}

async function endTurnWait(page) {
  const t0 = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
  await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
  await page.waitForFunction(
    t => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(), t0, { timeout: 90000 },
  );
  await wait(50);
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) {
    console.error('[meas] playwright nie znaleziony (uruchom z gra/).'); process.exit(1);
  }
  buildBundle();
  const browser = await launchBrowser(chromium);
  const t00 = Date.now();
  const rep = {
    arm: ARM, seedNote: 'PLAYTEST_MAPA_SEED (stale, 1 ziarno)', relationNote: 'naturalny (brak haka ustawiania relacji)',
    turnsRequested: TURNS, turnsRun: 0, offers: 0, activePrzyjmij: 0, pairs: {}, cyclicDealsMax: 0,
    tableStart: 0, tableEnd: 0, tableGrowth: 0, scriptRejected: 0, per100: 0, aiOwner: null, stoppedBy: null,
    autoBattles: 0, consoleErrors: 0, offerLog: [], perTurn: [],
  };
  const consoleErrors = [];
  const endBlocks = [];
  let page = null;
  try {
    page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => consoleErrors.push('[pageerror] ' + e.message));
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); if (/EndTurn\] blocked/.test(m.text())) endBlocks.push(m.text().slice(0, 160)); });
    await page.goto(URL_HTML, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(
      () => !!window.__aiTradeWiringTestDebug && !!window.__civTest && !!window.__eraTestDebug
        && window.__eraTestDebug.getWorldState().citiesLen > 0,
      undefined, { timeout: 180000 },
    );
    await page.evaluate(() => window.__truceTestDebug && window.__truceTestDebug.suppressVictoryForTest());
    const info = await page.evaluate(() => window.__aiTradeWiringTestDebug.info());
    rep.aiOwner = info.ai;
    if (!(await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity()))) throw new Error('nie udalo sie zalozyc miasta gracza');
    if (ARM === 'prepared') await page.evaluate(ai => window.__aiTradeWiringTestDebug.prepare(ai), info.ai);

    const seen = new Set();
    const s0 = await page.evaluate(() => window.__aiTradeWiringTestDebug.state());
    rep.tableStart = s0.tableLen;
    const tStart = Date.now();
    for (let i = 0; i < TURNS; i++) {
      if (Date.now() - t00 > MAX_MS) { rep.stoppedBy = 'limit czasu'; break; }
      // Wisząca oferta blokuje koniec tury: odrzuc (zalozenie pomiaru: gracz nie reaguje).
      let st = await page.evaluate(() => window.__aiTradeWiringTestDebug.state());
      if (st.pending.length > 0 && !(await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd()))) {
        for (const p of st.pending) { await page.evaluate(id => window.__aiTradeWiringTestDebug.reject(id), p.id); rep.scriptRejected++; }
      }
      rep.autoBattles += await clearBattles(page);
      await endTurnWait(page);
      st = await page.evaluate(() => window.__aiTradeWiringTestDebug.state());
      rep.turnsRun = i + 1;
      rep.cyclicDealsMax = Math.max(rep.cyclicDealsMax, st.cyclicDeals.length);
      const fresh = st.pending.filter(p => p.proposer === info.ai && p.responder === 0 && !seen.has(p.id));
      for (const p of fresh) {
        seen.add(p.id);
        const pa = await page.evaluate(id => window.__aiTradeWiringTestDebug.previewAccept(id), p.id);
        const gi = p.payload.giveItems?.[0]?.id ?? '?';
        const ri = p.payload.receiveItems?.[0]?.id ?? '?';
        const key = `${gi}->${ri}`;
        rep.offers++;
        rep.pairs[key] = (rep.pairs[key] || 0) + 1;
        if (pa && pa.accepted) rep.activePrzyjmij++;
        rep.offerLog.push({ turn: st.turn, give: gi, giveQty: p.payload.giveItems?.[0]?.ilosc, recv: ri, recvQty: p.payload.receiveItems?.[0]?.ilosc, przyjmijAktywne: !!(pa && pa.accepted) });
      }
      rep.perTurn.push({ t: st.turn, pending: st.pending.length, deals: st.cyclicDeals.length, table: st.tableLen });
    }
    const sEnd = await page.evaluate(() => window.__aiTradeWiringTestDebug.state());
    rep.tableEnd = sEnd.tableLen;
    rep.tableGrowth = rep.tableEnd - rep.tableStart;
    rep.per100 = rep.turnsRun > 0 ? +(rep.offers * 100 / rep.turnsRun).toFixed(2) : 0;
    rep.secs = Math.round((Date.now() - tStart) / 1000);
    if (!rep.stoppedBy) rep.stoppedBy = rep.turnsRun >= TURNS ? 'koniec przebiegu' : 'przerwany';
  } catch (e) {
    rep.stoppedBy = 'blad: ' + e.message;
    if (page) {
      rep.endBlocks = endBlocks.slice(-5);
      rep.diag = await page.evaluate(() => { try { const h = window.__aiTradeWiringTestDebug; const s = h.state(); return { turn: s.turn, pending: s.pending.map(p => ({ id: p.id, proposer: p.proposer, responder: p.responder })), canEnd: h.canEnd(), inProg: h.isEndTurnInProgress(), table: s.tableLen }; } catch (x) { return 'diag-err ' + x.message; } }).catch(x => 'eval-err ' + x.message);
    }
  } finally {
    await browser.close();
  }
  rep.consoleErrors = consoleErrors.length;
  rep.consoleErrorSample = consoleErrors.slice(0, 5);
  const line = JSON.stringify({ arm: rep.arm, turnsRun: rep.turnsRun, offers: rep.offers, per100: rep.per100, activePrzyjmij: rep.activePrzyjmij, pairs: rep.pairs, cyclicDealsMax: rep.cyclicDealsMax, tableGrowth: rep.tableGrowth, scriptRejected: rep.scriptRejected, stoppedBy: rep.stoppedBy, consoleErrors: rep.consoleErrors });
  console.log('[meas] RESULT ' + line);
  if (RESULT_FILE) fs.writeFileSync(RESULT_FILE, JSON.stringify(rep, null, 2));
}

main().catch(e => { console.error('[meas] FATAL', e); process.exit(1); });
