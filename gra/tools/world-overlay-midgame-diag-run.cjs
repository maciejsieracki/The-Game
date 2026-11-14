'use strict';
/**
 * world-overlay-midgame-diag-run.cjs — R-WEB-WORLD-CREATION-OVERLAY-MIDGAME-DIAG-Q1 (read-only diagnostyka).
 *
 * Pyta: czy nakładka „Tworzenie świata” (ui/mapLoadingOverlay.ts) pojawia się W TRAKCIE partii?
 *
 * Tryby (--scenario):
 *   real   — realna ścieżka: nowa gra przez REALNE doStartGame (hak __nnsMeasureDebug.startGame woła ten sam
 *            kod co kreator), założenie miasta gracza, setFast(true), N razy realne „Zakończ turę” (endTurn).
 *            Bez ?playtest, bez grantPlayerGold. Harness: ?civTest=1 (hak), oraz — jak w no-negative-stocks —
 *            zamykanie okien bitwy i odrzucanie ofert AI blokujących koniec tury (każde takie działanie logowane).
 *   mapa   — artefakt harnessu: ?playtest=mapa&civTest=1 + grantPlayerGold(--grant, np. -100000 / -150000)
 *            po turze 1, potem N endTurn.
 *
 * Rejestrowanie overlay: init-script opakowuje Node.prototype.appendChild/insertBefore i przy dołączeniu
 * węzła z klasą `civ-map-load-overlay` zapisuje JS stack (wskazuje wywołującego w bundlu NIE minifikowanym —
 * należy budować `vite build --minify false`). Dodatkowo MutationObserver rejestruje pojawienie się w DOM.
 * Każda tura: checkpoint JSON (wynik zapisywany po każdej turze, także przy przerwaniu).
 *
 * Użycie (z gra/; bundle budowany poza repo: node ./node_modules/vite/bin/vite.js build --minify false --outDir <dist>):
 *   node tools/world-overlay-midgame-diag-run.cjs --dist <dist> --out <katalog> --scenario real --seed 11 \
 *        [--turns 30] [--map Standardowy] [--civ-types 15] [--city-states 2] [--cell-sec 480]
 *   node tools/world-overlay-midgame-diag-run.cjs --dist <dist> --out <katalog> --scenario mapa --grant -100000 --seed 11 --turns 4
 * Wynik: <out>/checkpoint-<scenario>-<tag>-<seed>.json
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DIST = arg('dist');
const OUT = arg('out');
const SCENARIO = arg('scenario', 'real');
const SEED = parseInt(arg('seed', '11'), 10);
const TURNS = parseInt(arg('turns', '30'), 10);
const MAP = arg('map', 'Standardowy');
const CIV_TYPES = parseInt(arg('civ-types', '15'), 10);
const CITY_STATES = parseInt(arg('city-states', '2'), 10);
const GRANT = parseInt(arg('grant', '-100000'), 10);
const CELL_SEC = parseInt(arg('cell-sec', '480'), 10);
const T0 = Date.now();
const timeUp = () => Date.now() - T0 > CELL_SEC * 1000;
const TAG = SCENARIO === 'mapa' ? `mapa${GRANT}` : 'real';

// Init-script: rejestr pojawień się nakładki + stack wywołującego (przed każdym skryptem strony).
const INIT = `(() => {
  window.__ov = { events: [], domAppear: 0 };
  window.__visOv = () => Array.from(document.querySelectorAll('.civ-map-load-overlay')).some(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  const isOv = n => n && n.nodeType === 1 && typeof n.className === 'string' && n.className.indexOf('civ-map-load-overlay') >= 0;
  const rec = (kind, n) => {
    let turn = null; try { turn = window.__nnsMeasureDebug ? window.__nnsMeasureDebug.snapshot().turn : null; } catch (_) {}
    window.__ov.events.push({ kind, t: Math.round(performance.now()), turn, cls: n.className, stack: String(new Error().stack).split('\\n').slice(1, 14).map(s => s.trim()) });
  };
  for (const m of ['appendChild', 'insertBefore']) {
    const orig = Node.prototype[m];
    Node.prototype[m] = function (...a) {
      const node = a[0];
      if (isOv(node)) rec('attach-' + m, node);
      return orig.apply(this, a);
    };
  }
  new MutationObserver(muts => { for (const mu of muts) for (const n of mu.addedNodes) if (isOv(n)) window.__ov.domAppear++; })
    .observe(document, { childList: true, subtree: true });
})();`;


async function launch(chromium, profileDir) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--headless=new'];
  const o = { headless: true, args, viewport: { width: 1280, height: 800 } };
  try { return await chromium.launchPersistentContext(profileDir, o); } catch (_) {
    return await chromium.launchPersistentContext(profileDir, { ...o, executablePath: FALLBACK_CHROME });
  }
}

async function clearBlockers(page, log) {
  try {
    const rej = await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug; if (!h) return 0;
      if (window.__nnsMeasureDebug.canEnd()) return 0;
      const st = h.state(); let n = 0;
      for (const p of (st.pending || [])) { h.reject(p.id); n++; }
      return n;
    });
    if (rej > 0) { log.actions.push(`odrzucono ofert AI: ${rej}`); await wait(100); }
  } catch (_) { /* hak niedostępny */ }
  for (let k = 0; k < 12; k++) {
    const bs = await page.evaluate(() => (window.__aiTradeWiringTestDebug ? window.__aiTradeWiringTestDebug.battleState() : null));
    if (!bs || (!bs.preBattleOpen && !bs.pendingAuto && !bs.sceneOpen && !bs.summaryOpen && !bs.resolving)) break;
    const act = await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug;
      const b = document.querySelector('.pb-overlay [data-act="auto"]');
      if (b) { b.click(); return 'auto'; }
      if (h.closeBattleSummary()) return 'summary';
      if (h.flushBattles()) return 'flush';
      return 'wait';
    });
    if (act !== 'wait') log.actions.push('okno bitwy: ' + act);
    await wait(act === 'wait' ? 300 : 150);
  }
}

async function endTurnOnce(page) {
  return page.evaluate(() => new Promise(resolve => {
    const h = window.__nnsMeasureDebug; const t0 = performance.now(); const turn0 = h.snapshot().turn;
    const ov0 = window.__ov.events.length;
    h.endTurn(); let saw = h.isEndTurnInProgress(); let sawOv = false;
    const tick = () => {
      const ip = h.isEndTurnInProgress(); if (ip) saw = true;
      if (document.querySelector('.civ-map-load-overlay')) sawOv = true;
      const turn1 = h.snapshot().turn;
      if (!ip && (saw || performance.now() - t0 > 2000)) {
        resolve({ ms: Math.round(performance.now() - t0), turn0, turn1, overlayDuringEnd: sawOv, newOverlayEvents: window.__ov.events.length - ov0, endTurnSeen: saw, hung: false });
        return;
      }
      if (performance.now() - t0 > 180000) { resolve({ ms: Math.round(performance.now() - t0), turn0, turn1, overlayDuringEnd: sawOv, newOverlayEvents: window.__ov.events.length - ov0, endTurnSeen: saw, hung: true, endTurnInProgressStill: ip }); return; }
      setTimeout(tick, 20);
    };
    setTimeout(tick, 0);
  }));
}

async function main() {
  if (!DIST || !OUT) { console.error('wymagane: --dist <bundle> --out <katalog>'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) { console.error('playwright nie znaleziony (uruchom z gra/).'); process.exit(1); }
  const cpFile = path.join(OUT, `checkpoint-${SCENARIO}-${TAG}-${SEED}.json`);
  const res = {
    scenario: SCENARIO, tag: TAG, seed: SEED, map: MAP, civTypes: CIV_TYPES, cityStates: CITY_STATES, startedAt: new Date().toISOString(),
    overlayEventsAtStart: [], turns: [], harness: [], pageErrors: [], endBlocks: [], stopped: null, done: false,
  };
  const save = () => fs.writeFileSync(cpFile, JSON.stringify(res, null, 1));
  const ctx = await launch(chromium, path.join(OUT, `profile-${TAG}-${SEED}`));
  try {
    const page = ctx.pages()[0] || await ctx.newPage();
    page.on('pageerror', e => { if (res.pageErrors.length < 20) res.pageErrors.push(String(e).slice(0, 300)); });
    page.on('console', m => { const t = m.text(); if (/EndTurn\] blocked/.test(t) && res.endBlocks.length < 30) res.endBlocks.push(t.slice(0, 200)); });
    page.on('dialog', d => d.dismiss().catch(() => {}));
    await page.addInitScript(s0 => {
      let s = s0 | 0;
      Math.random = function () {
        s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }, (0x9e3779b9 ^ SEED) | 0);
    await page.addInitScript(INIT);
    const url = SCENARIO === 'mapa'
      ? 'file://' + path.join(path.resolve(DIST), 'index.html') + '?playtest=mapa&civTest=1&civSeed=' + SEED
      : 'file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1&civSeed=' + SEED;
    await page.goto(url, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });

    if (SCENARIO === 'real') {
      await page.waitForSelector('.civ-menu', { timeout: 180000 });
      const ovBefore = await page.evaluate(() => window.__ov.events.length);
      await page.evaluate(o => window.__nnsMeasureDebug.startGame(o), { seed: SEED, mapSize: MAP, civTypes: CIV_TYPES, cityStates: CITY_STATES });
      let ready = false;
      for (let i = 0; i < 1500 && !ready && !timeUp(); i++) {
        await wait(1000);
        const st = await page.evaluate(() => {
          const h = window.__nnsMeasureDebug;
          return { ov: window.__ov.events.length, vis: window.__visOv(), w: h.worldReady(), aw: h.awaitingFirstCity() };
        });
        ready = !st.vis && st.w && st.aw;
        if (i % 20 === 0) { const txt = await page.evaluate(() => { const el = document.querySelector('.civ-map-load-overlay'); return el ? el.innerText.replace(/\s+/g, ' ').slice(0, 220) : null; }); (res.overlayProgress = res.overlayProgress || []).push({ t: Math.round((Date.now() - T0) / 1000), txt }); }
        res.lastPoll = { i, ...st, t: Math.round((Date.now() - T0) / 1000) };
        if (i % 30 === 0) save();
      }
      if (!ready) { res.stopped = 'swiat nie wygenerowany w limicie'; save(); return; }
      res.overlayEventsAtStart = await page.evaluate(n => window.__ov.events.slice(n), ovBefore);
      if (!(await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity()))) { res.stopped = 'foundFirstCity()=false'; save(); return; }
      res.harness.push('założono pierwsze miasto (foundFirstCity)');
      await page.waitForFunction(() => window.__nnsMeasureDebug.playerCities() > 0 && !window.__nnsMeasureDebug.awaitingFirstCity(), undefined, { timeout: 60000 });
      await wait(2000);
    } else {
      // artefakt: czekamy aż playtest sam zbuduje świat (nakładka ma się pojawić i zniknąć przy starcie)
      await page.waitForFunction(() => window.__nnsMeasureDebug.worldReady && window.__nnsMeasureDebug.worldReady(), undefined, { timeout: 300000, polling: 1000 });
      await wait(3000);
      res.overlayEventsAtStart = await page.evaluate(() => window.__ov.events.slice());
      await page.evaluate(g => window.__nnsMeasureDebug.grantPlayerGold(g), GRANT);
      res.harness.push(`grantPlayerGold(${GRANT}) przed pierwszą turą (ARTEFAKT harnessu)`);
    }

    await page.evaluate(() => window.__nnsMeasureDebug.setFast(true));
    res.harness.push('setFast(true) — pominięcie renderu (tryb przyspieszony)');
    let ovSeen = await page.evaluate(() => window.__ov.events.length);
    for (let t = 1; t <= TURNS; t++) {
      if (timeUp()) { res.stopped = 'limit czasu (cell-sec) po turze ' + (t - 1); break; }
      const log = { idx: t, actions: [] };
      if (await page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity())) {
        const ok = await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
        log.actions.push('awaitingFirstCity -> foundFirstCity=' + ok);
        if (!ok) { res.stopped = 'gracz bez miasta (tura ' + t + ')'; break; }
      }
      await clearBlockers(page, log);
      const pre = await page.evaluate(() => ({ turn: window.__nnsMeasureDebug.snapshot().turn, vis: window.__visOv(), ov: window.__ov.events.length }));
      const et = await endTurnOnce(page);
      await clearBlockers(page, log);
      const post = await page.evaluate(() => {
        const h = window.__nnsMeasureDebug;
        return { turn: h.snapshot().turn, vis: window.__visOv(), ov: window.__ov.events.length, w: h.worldReady(), aw: h.awaitingFirstCity(), cities: h.playerCities() };
      });
      log.preTurn = pre.turn; log.postTurn = post.turn; log.endTurn = et;
      log.overlayVisibleBefore = pre.vis; log.overlayVisibleAfter = post.vis;
      log.overlayEventsThisTurn = post.ov - pre.ov;
      log.playerCities = post.cities; log.awaitingFirstCity = post.aw;
      if (log.overlayEventsThisTurn > 0) {
        log.overlayEvents = await page.evaluate(n => window.__ov.events.slice(n), pre.ov);
      }
      res.turns.push(log);
      res.overlayEventsTotal = await page.evaluate(() => window.__ov.events.length);
      res.domAppearTotal = await page.evaluate(() => window.__ov.domAppear);
      save();
      if (et.hung) { res.stopped = 'endTurn nie zakończył się w 180 s (tura ' + t + ')'; break; }
      if (post.aw) { res.stopped = 'gracz bez miasta po turze ' + t; break; }
      void ovSeen;
    }
    res.done = !res.stopped;
    if (!res.stopped) res.stopped = 'koniec: ' + TURNS + ' tur';
    res.finishedAt = new Date().toISOString();
    res.overlayEventsFinal = await page.evaluate(() => window.__ov.events.slice());
    res.domAppearFinal = await page.evaluate(() => window.__ov.domAppear);
    save();
    console.log(`[wom] ${SCENARIO}/${TAG}/${SEED}: tur=${res.turns.length} overlayEvents=${res.overlayEventsFinal.length} domAppear=${res.domAppearFinal} stop=${res.stopped}`);
  } finally {
    await ctx.close().catch(() => {});
  }
}

main().catch(e => { console.error('[wom] błąd:', e && e.stack || e); process.exit(1); });
