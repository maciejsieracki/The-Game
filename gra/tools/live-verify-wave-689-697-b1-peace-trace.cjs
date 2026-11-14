'use strict';
/**
 * live-verify-wave-689-697-b1-peace-trace.cjs — R-WEB-LIVE-VERIFY-WAVE-689-697-B1-AI-PEACE-GATE-TRACE-Q1 (pomiar, odczyt).
 *
 * Realna wojna AI->gracz (REALNE ownerDeclareWarOn przez __truceTestDebug.declareWar), zwykly endTurn, tryb przyspieszony,
 * bundle vite zbudowany POZA repo (BUNDLE_DIR). Po kazdej turze zapisuje checkpoint (JSON) i wiersze sladu z haka
 * `__aiTradeWiringTestDebug.peaceTrace*` (tylko gdy ?civTest=1). Hak nie zmienia logiki gry: tylko zapisuje wiersze.
 *
 * Usage (z gra/):
 *   WAR_TURNS=22 WAR_SEED=N RESULT=<abs.json> BUNDLE_DIR=<abs> SKIP_BUILD=0|1 node tools/live-verify-wave-689-697-b1-peace-trace.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const BUNDLE = process.env.BUNDLE_DIR;
const WAR_TURNS = parseInt(process.env.WAR_TURNS || '22', 10);
const SEED = parseInt(process.env.WAR_SEED || '271828', 10);
const RESULT = process.env.RESULT;
const MAX_MS = parseInt(process.env.MAX_SEC || '420', 10) * 1000;
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL_HTML = 'file://' + path.join(BUNDLE, 'index.html') + '?playtest=mapa&civTest=1&civSeed=' + SEED;
const wait = ms => new Promise(r => setTimeout(r, ms));

function buildBundle() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(BUNDLE, 'index.html'))) return;
  console.log('[b1] build vite -> ' + BUNDLE);
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

async function endTurnWait(page) {
  const t0 = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
  await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
  await page.waitForFunction(
    t => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(),
    t0, { timeout: 120000 },
  );
  await wait(50);
}

function save(rep) { fs.writeFileSync(RESULT, JSON.stringify(rep, null, 2)); }

async function main() {
  if (!BUNDLE || !RESULT) { console.error('[b1] wymagane BUNDLE_DIR i RESULT'); process.exit(1); }
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) {
    console.error('[b1] playwright nie znaleziony (uruchom z gra/).'); process.exit(1);
  }
  buildBundle();
  const browser = await launchBrowser(chromium);
  const t0 = Date.now();
  const rep = { seed: SEED, warTurnsRequested: WAR_TURNS, ai: null, warDeclaredAtTurn: null, turns: [], stoppedBy: null, consoleErrors: 0, pageErrors: [] };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => rep.pageErrors.push(e.message.slice(0, 200)));
    page.on('console', m => {
      if (m.type() === 'error') rep.consoleErrors++;
      if (/EndTurn\] blocked/.test(m.text())) { rep.endBlocks = rep.endBlocks || []; rep.endBlocks.push(m.text().slice(0, 160)); if (rep.endBlocks.length > 20) rep.endBlocks.shift(); }
    });
    await page.goto(URL_HTML, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(
      () => !!window.__aiTradeWiringTestDebug && !!window.__civTest && !!window.__truceTestDebug
        && window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0,
      undefined, { timeout: 180000 },
    );
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest && window.__truceTestDebug.suppressVictoryForTest());
    await page.evaluate(() => window.__aiTradeWiringTestDebug.setFastMode(true));
    const info = await page.evaluate(() => window.__aiTradeWiringTestDebug.info());
    rep.ai = info.ai;
    rep.startTurn = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
    // REALNE wypowiedzenie wojny AI -> gracz (ownerDeclareWarOn), nie setWar.
    await page.evaluate(ai => window.__truceTestDebug.declareWar(ai, 0), info.ai);
    rep.warDeclaredAtTurn = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
    rep.relAfterDeclare = process.env.NOTRACE === '1' ? null : await page.evaluate(ai => window.__aiTradeWiringTestDebug.peaceTracePair(ai), info.ai);
    save(rep);
    if (process.env.NOTRACE !== '1') await page.evaluate(() => window.__aiTradeWiringTestDebug.peaceTraceStart());
    rep.traceOn = process.env.NOTRACE !== '1';
    for (let i = 0; i < WAR_TURNS; i++) {
      if (Date.now() - t0 > MAX_MS) { rep.stoppedBy = 'limit czasu'; break; }
      await clearBattles(page);
      // Wiszaca oferta blokujaca koniec tury: odrzucana (jawne zalozenie pomiaru, jak w measure-ai-trade-offer-frequency.cjs); zapisywana w raporcie.
      let guard = 0;
      while (guard++ < 12) {
        const can = await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd());
        if (can) break;
        // R2 (bramka NNS, założenie pomiaru): tylko DODATNIE dosypki złota/żywności, gdy bramka NNS blokuje koniec tury.
        const nnsB = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
        if (nnsB) {
          const curT = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
          const gg = await page.evaluate(() => { const h = window.__aiTradeWiringTestDebug; return [h.grantPlayerGold(200000), h.grantPlayerFood(100000)]; });
          rep.nnsGrants = rep.nnsGrants || [];
          rep.nnsGrants.push({ turn: curT, goldAfter: gg[0], foodAfter: gg[1] });
          await wait(50);
          continue;
        }
        const ents = await page.evaluate(() => window.__truceTestDebug.negotiationEntries());
        if (!ents.length) {
          // Karta decyzji w panelu bocznym („wymaga decyzji”) bez wpisu na stole: klik przycisku odrzucenia (jak gracz).
          const clicked = await page.evaluate(() => {
            const btn = [...document.querySelectorAll('button')].find(b => {
              const t = (b.textContent || '').trim();
              return b.getBoundingClientRect().width > 0 && /odrzuć|odrzuc|nie dziękuj|zamknij/i.test(t) && !/wszystkie/i.test(t);
            });
            if (!btn) return null;
            const label = (btn.textContent || '').trim().slice(0, 60);
            btn.click();
            return label;
          });
          if (!clicked) {
            // Blokujaca karta „Kolejka pusta” (prod-empty-<miasto>): test uzupelnia kolejke 5 budynkami (hak __workPoolTestDebug), jak w tools/city-empty-queue-*.
            const cid = await page.evaluate(() => {
              const el = document.querySelector('[data-id^="prod-empty-"]');
              return el ? el.getAttribute('data-id').slice('prod-empty-'.length) : null;
            });
            if (!cid) break;
            const bids = await page.evaluate(() => window.__workPoolTestDebug.buildingIds().slice(0, 5));
            await page.evaluate(a => window.__workPoolTestDebug.enqueueBuildings(a.id, a.ids), { id: cid, ids: bids });
            rep.queuedForEmptyCity = rep.queuedForEmptyCity || [];
            rep.queuedForEmptyCity.push({ turn: rep.lastTurn ?? null, cityId: cid, ids: bids });
            await wait(200);
            continue;
          }
          rep.clickedDecisionButtons = rep.clickedDecisionButtons || [];
          rep.clickedDecisionButtons.push({ turn: rep.lastTurn ?? null, label: clicked });
          await wait(200);
          continue;
        }
        for (const e of ents) {
          rep.rejectedByScript = rep.rejectedByScript || [];
          rep.rejectedByScript.push({ turn: rep.lastTurn ?? null, actionId: e.actionId, proposerOwnerId: e.proposerOwnerId, responderOwnerId: e.responderOwnerId, rodzaj: e.rodzaj });
          await page.evaluate(id => window.__aiTradeWiringTestDebug.reject(id), e.id);
        }
        await wait(100);
      }
      try {
        await endTurnWait(page);
      } catch (e) {
        rep.diagAtHang = await page.evaluate(() => {
          const h = window.__aiTradeWiringTestDebug;
          const vis = [...document.querySelectorAll('body *')].filter(el => {
            const st = getComputedStyle(el); return st.display !== 'none' && st.visibility !== 'hidden' && el.children.length === 0 && (el.textContent || '').trim().length > 2 && el.getBoundingClientRect().width > 0;
          }).slice(0, 0);
          const modals = [...document.querySelectorAll('[class*="overlay"],[class*="modal"],[class*="panel"]')]
            .filter(el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0)
            .slice(0, 8).map(el => (el.className || '').toString().slice(0, 60) + ' :: ' + (el.textContent || '').trim().slice(0, 120));
          const sp = document.querySelector('.civ-side-panel');
          const panelButtons = sp ? [...sp.querySelectorAll('button,[role=button],a')].map(b => (b.className || '').toString().slice(0, 40) + ' | ' + (b.textContent || '').trim().slice(0, 50)).slice(0, 30) : null;
          const panelHtml = sp ? sp.innerHTML.slice(0, 1500) : null;
          return { panelButtons, panelHtml, turnNow: h.state().turn, canEnd: h.canEnd(), inProgress: h.isEndTurnInProgress(), battle: h.battleState(), entries: window.__truceTestDebug.negotiationEntries(), modals, vis: vis.length };
        }).catch(x => 'diag-err ' + x.message);
        rep.stoppedBy = 'blad: endTurn w turze ' + (rep.lastTurn ?? '?') + ': ' + String((e && e.message) || e).slice(0, 160);
        save(rep);
        break;
      }
      const pair = process.env.NOTRACE === '1'
        ? { turn: await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn), ai: info.ai, nohook: true }
        : await page.evaluate(ai => window.__aiTradeWiringTestDebug.peaceTracePair(ai), info.ai);
      const rows = await page.evaluate(on => {
        const h = window.__aiTradeWiringTestDebug;
        const r = on ? h.peaceTraceStop() : []; if (on) h.peaceTraceStart(); return r;
      }, rep.traceOn);
      // Skrot stanu (FNV-1a po __detHarness.digest) — dowod kryterium 3 (hak nie zmienia przebiegu).
      const dg = await page.evaluate(() => {
        const s = window.__detHarness.digest(); let h = 2166136261;
        for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
        return (h >>> 0).toString(16) + ':' + s.length;
      });
      rep.turns.push({ pair, rows, digest: dg });
      rep.lastTurn = pair.turn;
      save(rep);
      console.log('[b1] tura ' + pair.turn + ' turnsAtWar=' + pair.turnsAtWar + ' status=' + pair.status + ' wiersze=' + rows.length);
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
  console.log('[b1] zapisano ' + RESULT + ' stoppedBy=' + rep.stoppedBy + ' tury=' + rep.turns.length);
}

main();
