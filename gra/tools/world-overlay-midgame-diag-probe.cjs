'use strict';
/**
 * world-overlay-midgame-diag-probe.cjs — R-WEB-WORLD-CREATION-OVERLAY-MIDGAME-DIAG-Q1, runda 2 (obrona).
 * Read-only sonda do zarzutów 1 i 2 Evaluatora. Nie zmienia gry.
 *
 *  - endTurnInProgress: init-script opakowuje console.warn; przy komunikacie
 *    „[EndTurn] blocked: endTurnInProgress” zapisuje numer tury i stos wywołania
 *    (kto wołał canPlayerInitiateEndTurn podczas trwającego endTurn).
 *  - mapa: rejestruje, czy ścieżka ?playtest=mapa dochodzi do finishMapLoadWithPerfReport
 *    (log „[civ-perf] wall-clock … hide overlay” / „[PlaytestMapa] seed=”) oraz liczbę
 *    węzłów .civ-map-load-overlay w DOM w każdej turze.
 *
 * Użycie (z gra/; bundle --minify false):
 *   node tools/world-overlay-midgame-diag-probe.cjs --dist <dist> --out <katalog> --scenario real --seed 11 --turns 3
 *   node tools/world-overlay-midgame-diag-probe.cjs --dist <dist> --out <katalog> --scenario mapa --grant -100000 --seed 11 --turns 3
 * Wynik: <out>/probe-<scenario>-<seed>.json
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
const TURNS = parseInt(arg('turns', '3'), 10);
const GRANT = parseInt(arg('grant', '-100000'), 10);
const CELL_SEC = parseInt(arg('cell-sec', '420'), 10);
const T0 = Date.now();
const timeUp = () => Date.now() - T0 > CELL_SEC * 1000;

const INIT = `(() => {
  window.__blk = [];
  const origWarn = console.warn.bind(console);
  console.warn = function (...a) {
    try {
      if (typeof a[0] === 'string' && a[0].indexOf('blocked: endTurnInProgress') >= 0) {
        let turn = null; try { turn = window.__nnsMeasureDebug.snapshot().turn; } catch (_) {}
        window.__blk.push({ turn, t: Math.round(performance.now()), stack: String(new Error().stack).split('\\n').slice(2, 9).map(s => s.trim()) });
      }
    } catch (_) {}
    return origWarn(...a);
  };
})();`;

async function launch(chromium, profileDir) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--headless=new'];
  const o = { headless: true, args, viewport: { width: 1280, height: 800 } };
  try { return await chromium.launchPersistentContext(profileDir, o); } catch (_) {
    return await chromium.launchPersistentContext(profileDir, { ...o, executablePath: FALLBACK_CHROME });
  }
}

async function endTurnOnce(page) {
  return page.evaluate(() => new Promise(resolve => {
    const h = window.__nnsMeasureDebug; const t0 = performance.now(); const turn0 = h.snapshot().turn;
    const blk0 = window.__blk.length;
    h.endTurn(); let saw = h.isEndTurnInProgress(); let sawOv = false;
    const tick = () => {
      const ip = h.isEndTurnInProgress(); if (ip) saw = true;
      if (document.querySelector('.civ-map-load-overlay')) sawOv = true;
      const turn1 = h.snapshot().turn;
      if (!ip && (saw || performance.now() - t0 > 2000)) {
        resolve({ ms: Math.round(performance.now() - t0), turn0, turn1, overlayDuringEnd: sawOv, endTurnSeen: saw, blockedDuringEnd: window.__blk.length - blk0 });
        return;
      }
      if (performance.now() - t0 > 180000) { resolve({ ms: Math.round(performance.now() - t0), turn0, turn1, hung: true }); return; }
      setTimeout(tick, 20);
    };
    setTimeout(tick, 0);
  }));
}

async function main() {
  if (!DIST || !OUT) { console.error('wymagane: --dist <bundle> --out <katalog>'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  const { chromium } = require('playwright');
  const cpFile = path.join(OUT, `probe-${SCENARIO}-${SEED}.json`);
  const res = { scenario: SCENARIO, seed: SEED, startedAt: new Date().toISOString(), console: [], turns: [], overlayDomCount: [], blk: [] };
  const save = () => fs.writeFileSync(cpFile, JSON.stringify(res, null, 1));
  const ctx = await launch(chromium, path.join(OUT, `profile-probe-${SCENARIO}-${SEED}`));
  try {
    const page = ctx.pages()[0] || await ctx.newPage();
    page.on('pageerror', e => res.console.push({ kind: 'pageerror', text: String(e).slice(0, 300) }));
    page.on('console', m => {
      const t = m.text();
      if (/civ-perf|PlaytestMapa|endTurnInProgress|triggerPlayerEndTurn/.test(t) && res.console.length < 200) res.console.push({ kind: m.type(), text: t.slice(0, 220) });
    });
    page.on('dialog', d => d.dismiss().catch(() => {}));
    await page.addInitScript(s0 => {
      let s = s0 | 0;
      Math.random = function () {
        s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }, (0x9e3779b9 ^ SEED) | 0);
    await page.addInitScript(INIT);
    const base = 'file://' + path.join(path.resolve(DIST), 'index.html');
    const url = SCENARIO === 'mapa' ? base + '?playtest=mapa&civTest=1&civSeed=' + SEED : base + '?civTest=1&civSeed=' + SEED;
    await page.goto(url, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });
    if (SCENARIO === 'real') {
      await page.waitForSelector('.civ-menu', { timeout: 180000 });
      await page.evaluate(o => window.__nnsMeasureDebug.startGame(o), { seed: SEED, mapSize: 'Standardowy', civTypes: 15, cityStates: 2 });
      let ready = false;
      for (let i = 0; i < 400 && !ready && !timeUp(); i++) {
        await wait(1000);
        ready = await page.evaluate(() => { const h = window.__nnsMeasureDebug; return !document.querySelector('.civ-map-load-overlay') && h.worldReady() && h.awaitingFirstCity(); });
      }
      if (!ready) { res.stopped = 'swiat nie gotowy w limicie'; save(); return; }
      await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
      await wait(2000);
    } else {
      await page.waitForFunction(() => window.__nnsMeasureDebug.worldReady && window.__nnsMeasureDebug.worldReady(), undefined, { timeout: 300000, polling: 1000 });
      await wait(3000);
      res.overlayDomCount.push({ when: 'worldReady+3s', n: await page.evaluate(() => document.querySelectorAll('.civ-map-load-overlay').length) });
      await page.evaluate(g => window.__nnsMeasureDebug.grantPlayerGold(g), GRANT);
    }
    await page.evaluate(() => window.__nnsMeasureDebug.setFast(true));
    for (let t = 1; t <= TURNS; t++) {
      if (timeUp()) { res.stopped = 'limit czasu'; break; }
      if (await page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity())) {
        await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
      }
      const et = await endTurnOnce(page);
      res.turns.push(et);
      res.overlayDomCount.push({ when: 'po turze ' + t, n: await page.evaluate(() => document.querySelectorAll('.civ-map-load-overlay').length) });
      res.blk = await page.evaluate(() => window.__blk);
      save();
    }
    res.stopped = res.stopped || ('koniec: ' + TURNS + ' tur');
    res.finishedAt = new Date().toISOString();
    save();
    console.log(`[probe] ${SCENARIO}/${SEED}: tur=${res.turns.length} blk=${res.blk.length} stop=${res.stopped}`);
  } finally {
    await ctx.close().catch(() => {});
  }
}

main().catch(e => { console.error('[probe] błąd:', e && e.stack || e); process.exit(1); });
