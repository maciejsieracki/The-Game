'use strict';
/**
 * live-verify-wave-689-697-b2-panel-run.cjs — R-WEB-LIVE-VERIFY-WAVE-689-697-B2-PANEL-AIAI-CITYCHANGE-Q1 (r2, pomiar, odczyt).
 *
 * Realna sciezka startu (__nnsMeasureDebug.startGame + foundFirstCity, BEZ ?playtest=mapa), tryb przyspieszony.
 * Scenariusze (SCEN):
 *   war    — REALNE wypowiedzenie wojny AI -> gracz (__truceTestDebug.declareWar(ai, 0)) w turze 1; probe w turach
 *            PROBE_TURNS (domyslnie 5,10,16,17,18,20): czekanie az znikna nakladki „Tworzenie swiata”, zrzut,
 *            otwarcie karty AI (__truceTestDebug.openAudience = ta sama sciezka co klik w karte AI) i odczyt DOM.
 *   aiwar  — REALNA wojna AI <-> AI (__truceTestDebug.declareWar(aiA, aiB)) w turze 1, gracz w pokoju.
 *            Odczyt karty AI A (sekcja „W stanie wojny z” z procentem zmęczenia) w PROBE_TURNS, zmiany liczby miast
 *            per wlasciciel po kazdej turze (P3: zmiana wlasciciela miasta).
 *   speed  — wariant bez trybu przyspieszonego: wojna AI->gracz, setFastMode(false), czas kazdej tury (P4).
 * Zadna logika gry nie jest zmieniana. Jedyne ingerencje w tury (jak w B1/W80B): odrzucanie ofert AI blokujacych
 * koniec tury (PO odczycie obserwacji danej tury) i DODATNIE dosypki zlota/zywnosci przy bramce NNS.
 *
 * Usage (z gra/):
 *   SCEN=war SEED=271828 RUN_DIR=<abs> BUNDLE_DIR=<abs> SKIP_BUILD=1 node tools/live-verify-wave-689-697-b2-panel-run.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const BUNDLE = process.env.BUNDLE_DIR;
const SCEN = process.env.SCEN || 'war';
const SEED = parseInt(process.env.SEED || '271828', 10);
const TAG = process.env.TAG || '';
const RUN_DIR = process.env.RUN_DIR;
const LAST_TURN = parseInt(process.env.LAST_TURN || (SCEN === 'speed' ? '4' : '22'), 10);
const PROBE = (process.env.PROBE_TURNS || (SCEN === 'aiwar' ? '5,10,16,20,22' : '5,10,16,17,18,20'))
  .split(',').map(s => parseInt(s, 10));
const MAX_MS = parseInt(process.env.MAX_SEC || '480', 10) * 1000;
const OVERLAY_WAIT_MS = 10000;
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const wait = ms => new Promise(r => setTimeout(r, ms));
const RESULT = path.join(RUN_DIR, `b2-${SCEN}-seed${SEED}${TAG}.json`);
const SHOT = (turn, what) => path.join(RUN_DIR, `b2-${SCEN}-seed${SEED}${TAG}-T${turn}-${what}.png`);
const T0 = Date.now();

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

// Rejestr nakladki „Tworzenie swiata” (init-script): kazde dolaczenie wezla z klasa overlay z numerem tury i stosem.
const INIT = `(() => {
  window.__ovLog = [];
  const isOv = n => n && n.nodeType === 1 && typeof n.className === 'string' && n.className.indexOf('civ-map-load-overlay') >= 0;
  for (const m of ['appendChild', 'insertBefore']) {
    const orig = Node.prototype[m];
    Node.prototype[m] = function (...a) {
      const n = a[0];
      if (isOv(n)) {
        let turn = null; try { turn = window.__aiTradeWiringTestDebug ? window.__aiTradeWiringTestDebug.state().turn : null; } catch (_) {}
        window.__ovLog.push({ m, turn, t: Math.round(performance.now()), stack: String(new Error().stack).split('\\n').slice(2, 7).map(s => s.trim()) });
      }
      return orig.apply(this, a);
    };
  }
})();`;

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

// Odrzucenie ofert blokujacych koniec tury — WYWOLYWANE DOPIERO PO OBSERWACJI tury (zob. observe).
async function clearOffers(page, rep) {
  for (let k = 0; k < 12; k++) {
    const can = await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd());
    if (can) return;
    const gate = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
    if (gate) {
      const t = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
      const g = await page.evaluate(() => { const h = window.__aiTradeWiringTestDebug; return [h.grantPlayerGold(200000), h.grantPlayerFood(100000)]; });
      rep.nnsGrants = rep.nnsGrants || []; rep.nnsGrants.push({ turn: t, goldAfter: g[0], foodAfter: g[1] });
      await wait(50);
      continue;
    }
    const ents = await page.evaluate(() => window.__truceTestDebug.negotiationEntries());
    if (!ents.length) {
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
      if (!clicked) return;
      rep.clickedDecisionButtons = rep.clickedDecisionButtons || []; rep.clickedDecisionButtons.push(clicked);
      await wait(200);
      continue;
    }
    for (const e of ents) {
      rep.rejectedByScript = rep.rejectedByScript || [];
      rep.rejectedByScript.push({ turn: rep.lastTurn, actionId: e.actionId, proposerOwnerId: e.proposerOwnerId, responderOwnerId: e.responderOwnerId, rodzaj: e.rodzaj, turns: e.turns });
      await page.evaluate(id => window.__aiTradeWiringTestDebug.reject(id), e.id);
    }
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

async function overlayState(page) {
  return page.evaluate(() => [...document.querySelectorAll('.civ-map-load-overlay')].map(el => {
    const r = el.getBoundingClientRect();
    return { visible: r.width > 0 && r.height > 0, text: (el.innerText || '').replace(/\s+/g, ' ').slice(0, 160) };
  }));
}

// Czeka, az zadna nakladka „Tworzenie swiata” nie bedzie widoczna (maks OVERLAY_WAIT_MS).
async function waitOverlayGone(page) {
  const t0 = Date.now();
  let st = await overlayState(page);
  while (st.some(o => o.visible) && Date.now() - t0 < OVERLAY_WAIT_MS) {
    await wait(500);
    st = await overlayState(page);
  }
  return { waitedMs: Date.now() - t0, stillVisible: st.some(o => o.visible), states: st };
}

let AI1_ID = null;
let ME_ID = 0;
const LINE_RE = /zmęcz|zmecz|desper|pokój|pokoj|rozejm|propon|wojn|wojnie/i;

// Odczyt DOM karty AI (otwartej przez ten sam wpis co klik w karte) — tylko odczyt.
async function readAudience(page, ownerId) {
  await page.evaluate(id => window.__truceTestDebug.openAudience(id), ownerId);
  await wait(400);
  return page.evaluate(() => {
    const box = document.querySelector('.civ-diplo-aud-box');
    const boxText = box ? (box.innerText || '') : null;
    const body = (document.body.innerText || '').split('\n').map(s => s.trim()).filter(Boolean);
    const bodyHits = body.filter(s => /zmęcz|zmecz|desper|pokój|pokoj|rozejm|propon|wojn/i.test(s)).slice(0, 60);
    return {
      audienceOpen: !!box,
      audienceLines: boxText ? boxText.split('\n').map(s => s.trim()).filter(s => /zmęcz|zmecz|desper|pokój|pokoj|rozejm|propon|wojn|Relacje|Zaufanie|Respekt/i.test(s)).slice(0, 60) : [],
      audienceTextFull: boxText ? boxText.slice(0, 6000) : null,
      bodyHits,
      totalBodyLines: body.length,
    };
  });
}

async function observe(page, rep, turn, ais, isProbe) {
  const rec = { turn };
  rec.digest = await page.evaluate(() => {
    const s = window.__detHarness.digest(); let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16) + ':' + s.length;
  });
  rec.owners = await page.evaluate(() => window.__nnsMeasureDebug.snapshot().owners.map(o => ({ oid: o.oid, cities: o.cities, units: o.units })));
  rec.pairStates = await page.evaluate(ids => ids.map(([a, b]) => ({ a, b, st: window.__truceTestDebug.pairState(a, b) })), [[ais[0], ME_ID], ...(SCEN === 'aiwar' ? [[ais[0], AI1_ID]] : [])]);
  rec.cityCounts = await page.evaluate(() => { const i = window.__aiTradeWiringTestDebug.info(); return { me: i.myCities, ai0: i.aiCities, citiesLen: window.__eraTestDebug.getWorldState().citiesLen, aiOwners: i.aiOwners }; });
  rec.entries = await page.evaluate(() => window.__truceTestDebug.negotiationEntries().map(e => ({
    actionId: e.actionId, proposerOwnerId: e.proposerOwnerId, responderOwnerId: e.responderOwnerId, rodzaj: e.rodzaj, turns: e.turns,
  })));
  rec.war = await page.evaluate(() => ({ battle: window.__aiTradeWiringTestDebug.battleState() }));
  if (!isProbe) return rec;
  const ov = await waitOverlayGone(page);
  rec.overlayWait = { waitedMs: ov.waitedMs, stillVisible: ov.stillVisible, states: ov.states };
  rec.screenshotNoOverlay = !ov.stillVisible;
  for (const aid of ais) {
    const a = await readAudience(page, aid);
    rec[`audience_${aid}`] = a;
    const shot = SHOT(turn, `aud${aid}`);
    await page.screenshot({ path: shot });
    rec[`shot_${aid}`] = path.basename(shot);
    await page.evaluate(() => window.__truceTestDebug.closeAudience());
    await wait(150);
  }
  rec.proposalsAfterProbe = await page.evaluate(() => window.__truceTestDebug.negotiationEntries().length);
  return rec;
}

async function main() {
  if (!BUNDLE || !RUN_DIR) { console.error('wymagane BUNDLE_DIR i RUN_DIR'); process.exit(1); }
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) { console.error('playwright nie znaleziony'); process.exit(1); }
  buildBundle();
  const browser = await launchBrowser(chromium);
  const rep = { scen: SCEN, seed: SEED, tag: TAG, lastTurnRequested: LAST_TURN, probeTurns: PROBE, ai: [], warDeclaredAtTurn: null,
    turns: [], probes: [], stoppedBy: null, pageErrors: [], overlayLog: [], startMs: null };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.addInitScript(INIT);
    page.on('pageerror', e => { if (rep.pageErrors.length < 10) rep.pageErrors.push(String(e).slice(0, 200)); });
    page.on('dialog', d => d.dismiss().catch(() => {}));
    const url = 'file://' + path.join(BUNDLE, 'index.html') + '?civTest=1&civSeed=' + SEED;
    await page.goto(url, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__nnsMeasureDebug && !!window.__aiTradeWiringTestDebug, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.evaluate(o => window.__nnsMeasureDebug.startGame(o), { seed: SEED, mapSize: 'Standardowy', civTypes: 15, cityStates: 2 });
    let ready = false;
    for (let i = 0; i < 400 && !ready && Date.now() - T0 < MAX_MS; i++) {
      await wait(1000);
      const st = await page.evaluate(() => { const h = window.__nnsMeasureDebug; return { w: h.worldReady(), aw: h.awaitingFirstCity() }; })
        .catch(e => ({ err: String(e).slice(0, 120) }));
      ready = !!st.w && !!st.aw;
    }
    if (!ready) { rep.stoppedBy = 'swiat nie wygenerowany w limicie'; return; }
    rep.startMs = Date.now() - T0;
    if (!(await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity()))) { rep.stoppedBy = 'foundFirstCity()=false'; return; }
    await wait(1500);
    // Os czasu nakladki „Tworzenie swiata” po starcie (bez ingerencji): co 5 s, do OVERLAY_START_SEC (domyslnie 60 s).
    rep.overlayTimeline = [];
    const OV_START_SEC = parseInt(process.env.OVERLAY_START_SEC || '60', 10);
    for (let k = 0; k <= Math.ceil(OV_START_SEC / 5); k++) {
      const s = await overlayState(page);
      rep.overlayTimeline.push({ sec: k * 5, states: s });
      if (!s.some(o => o.visible)) break;
      await wait(5000);
    }
    rep.overlayAfterFound = rep.overlayTimeline[rep.overlayTimeline.length - 1].states;
    await page.evaluate(fast => window.__aiTradeWiringTestDebug.setFastMode(fast), SCEN !== 'speed');
    const info = await page.evaluate(() => window.__aiTradeWiringTestDebug.info());
    rep.ai = info.aiOwners;
    rep.me = info.me;
    ME_ID = info.me;
    // SETUP odkrycia AI (jak W4 r1/r2 tematu W35): karta AI bez odkrycia na mapie pokazuje „Brak danych audiencji”.
    // Hak __aiTradeWiringTestDebug.prepare(ai) — PRZED realnym wypowiedzeniem wojny (sam przestawia 'wojna' na 'pokoj',
    // wiec musi byc wywolany przed declareWar). Skutki uboczne: tech Wymiany obu stron, skarbiec AI >= 300,
    // wyciszone cooldowny handlu AI (zob. r2 raport, sekcja ZALOZENIA).
    rep.prepared = [];
    const prepIds = SCEN === 'aiwar' ? [info.aiOwners[0], info.aiOwners[1]] : [info.aiOwners[0]];
    for (const a of prepIds) {
      rep.prepared.push({ ai: a, res: await page.evaluate(x => { const r = window.__aiTradeWiringTestDebug.prepare(x); return r; }, a) });
    }
    if (SCEN === 'aiwar') {
      if (info.aiOwners.length < 2) { rep.stoppedBy = 'mniej niz 2 AI'; return; }
      AI1_ID = info.aiOwners[1];
      await page.evaluate(([a, b]) => window.__truceTestDebug.declareWar(a, b), [info.aiOwners[0], info.aiOwners[1]]);
    } else {
      await page.evaluate(a => window.__truceTestDebug.declareWar(a.ai, a.me), { ai: info.aiOwners[0], me: info.me });
    }
    rep.warDeclaredAtTurn = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
    const ais = SCEN === 'aiwar' ? [info.aiOwners[0]] : [info.aiOwners[0]];
    rep.observedAis = ais;
    // Pierwsza obserwacja przed jakakolwiek ingerencja (stan po deklaracji).
    rep.preTurn = await observe(page, rep, rep.warDeclaredAtTurn, ais, false);
    for (let t = 1; t <= LAST_TURN; t++) {
      if (Date.now() - T0 > MAX_MS) { rep.stoppedBy = 'limit czasu po turze ' + (t - 1); break; }
      await clearBattles(page);
      const tStart = Date.now();
      try { await endTurnWait(page); } catch (e) { rep.stoppedBy = 'blad endTurn: ' + String(e.message || e).slice(0, 160); break; }
      const turn = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
      rep.lastTurn = turn;
      rep.turns.push(turn);
      const turnSec = Math.round((Date.now() - tStart) / 100) / 10;
      rep.turnTiming = rep.turnTiming || []; rep.turnTiming.push({ turn, sec: turnSec, fast: SCEN !== 'speed' });
      // OBSERWACJA tury (przed odrzuceniem ofert).
      const isProbe = PROBE.includes(turn);
      const obs = await observe(page, rep, turn, ais, isProbe);
      rep.turns[rep.turns.length - 1] = { turn, digest: obs.digest, owners: obs.owners, cities: obs.cityCounts, pair: obs.pairStates, entriesBeforeReject: obs.entries, sec: turnSec };
      if (isProbe) rep.probes.push(obs);
      // Dopiero teraz odrzucenie blokujacych ofert (zalozenie pomiaru, jak w B1).
      await clearOffers(page, rep);
      rep.overlayLog = await page.evaluate(() => window.__ovLog.slice(-20));
      fs.writeFileSync(RESULT, JSON.stringify(rep, null, 2));
    }
    if (!rep.stoppedBy) rep.stoppedBy = 'koniec zakresu';
  } catch (e) {
    rep.stoppedBy = 'blad: ' + String((e && e.message) || e).slice(0, 300);
  } finally {
    rep.elapsedSec = Math.round((Date.now() - T0) / 1000);
    fs.writeFileSync(RESULT, JSON.stringify(rep, null, 2));
    await browser.close();
  }
  console.log('[b2] zapisano ' + RESULT + ' stoppedBy=' + rep.stoppedBy + ' lastTurn=' + rep.lastTurn + ' elapsedSec=' + rep.elapsedSec);
}

main();
