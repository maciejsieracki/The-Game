'use strict';
/**
 * war-sim.cjs — pomiar wojen AI<->AI w PELNEJ grze (realny bundle w headless Chromium; bundle ze zmodyfikowanej KOPII
 * gra/ poza repo: prep-war.cjs + ai-city-count-sim.cjs --prepare). Uzycie:
 *  GRA_ROOT=<gra z node_modules> node war-sim.cjs --dist <dist> --out <json> --seeds 1,2 --turns 150 --size Maly --types kontynenty --label pre
 * Metryki per ziarno: wojny AI<->AI (start, koniec, czas), zdobyte miasta (zmiana wlasciciela), pokoje (+ lock),
 * prosby o pokoj AI->AI (log cmd), czas tury.
 */
const fs = require('fs');
const path = require('path');
const GRA = process.env.GRA_ROOT;
function arg(name, def) { const i = process.argv.indexOf('--' + name); return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def; }
const DIST = arg('dist'), OUT = arg('out');
const SEEDS = arg('seeds', '1').split(',').map(Number);
const TYPES = arg('types', 'kontynenty').split(',');
const TURNS = Number(arg('turns', '150'));
const SIZE = arg('size', 'Maly');
const LABEL = arg('label', 'run');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), LABEL, ...a);
async function pollUntil(page, fn, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs; let last = null;
  while (Date.now() < deadline) { last = await page.evaluate(fn); if (last && last.ready) return last; await wait(500); }
  throw new Error(`pollUntil(${what}) timeout, last=` + JSON.stringify(last));
}
async function runOne(typ, seed) {
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = []; const dipLogs = [];
    page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e).slice(0, 200)));
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    page.on('console', (m) => { const t = m.text(); if (/R-AI-PEACE|R-AI-WOJNY|Oblezenie AI|AI-AI-PEACE/.test(t)) dipLogs.push(t.slice(0, 220)); });
    await page.addInitScript((s0) => {
      let s = s0 | 0;
      Math.random = function () { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }, (0x9e3779b9 ^ seed) | 0);
    await page.goto('file://' + path.join(path.resolve(DIST), 'index.html'), { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug && !!window.__aiBuildingsTestDebug && !!window.__rebelProtectionTestDebug && !!window.__aiCityCountDebug && !!window.__warSimDebug, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    const tGen = Date.now();
    await page.evaluate((o) => window.__aiBuildingsTestDebug.startNewGame(o), { seed, mapSize: SIZE, typSwiata: typ });
    await pollUntil(page, () => {
      const dbg = window.__cityStateStartUnitsTestDebug;
      const overlay = Array.from(document.querySelectorAll('*')).some((el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      const st = dbg.dumpState();
      return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
    }, 900000, 'awaitingFirstPlayerCity');
    log('worldgen ms', Date.now() - tGen);
    if (!(await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()))) throw new Error('foundPlayerStartCity false');
    await pollUntil(page, () => { const st = window.__cityStateStartUnitsTestDebug.dumpState(); return { ready: st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0) }; }, 60000, 'playerCity');
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    await wait(500);
    const turnMs = [];
    let turn = (await page.evaluate(() => window.__warSimDebug.snapshot())).turn;
    const warStart = {}; const wars = []; const ownerOfCity = {}; const captures = [];
    const t0all = Date.now();
    const take = async () => {
      const sn = await page.evaluate(() => window.__warSimDebug.snapshot());
      const key = (a, b) => a + '_' + b;
      for (const [a, b, st] of sn.rel) {
        const k = key(a, b);
        if (st === 'wojna' && warStart[k] === undefined) warStart[k] = sn.turn;
        if (st !== 'wojna' && warStart[k] !== undefined) { wars.push({ a, b, start: warStart[k], end: sn.turn, ended: st }); delete warStart[k]; }
      }
      for (const c of sn.cities) { if (ownerOfCity[c.id] !== undefined && ownerOfCity[c.id] !== c.o) captures.push({ turn: sn.turn, id: c.id, from: ownerOfCity[c.id], to: c.o, walls: c.w }); ownerOfCity[c.id] = c.o; }
      return sn;
    };
    let sn = await take();
    while (turn < TURNS) {
      let r = null; let retries = 0;
      for (;;) {
        r = await page.evaluate(() => new Promise((resolve) => {
          const dbg = window.__eraTestDebug; const turn0 = dbg.getWorldState().turn; const t0 = performance.now();
          dbg.endTurn(); let saw = dbg.isEndTurnInProgress();
          const tick = () => { const ip = dbg.isEndTurnInProgress(); if (ip) saw = true;
            if (!ip && (saw || performance.now() - t0 > 2000)) { resolve({ ms: performance.now() - t0, turn0, turn1: dbg.getWorldState().turn }); return; }
            if (performance.now() - t0 > 400000) { resolve({ ms: -1, turn0, turn1: dbg.getWorldState().turn }); return; }
            setTimeout(tick, 4); };
          setTimeout(tick, 0);
        }));
        if (r.turn1 > r.turn0) break;
        if (++retries > 6) throw new Error('tura nie przechodzi: ' + JSON.stringify(r));
        await page.keyboard.press('Escape').catch(() => {});
        await page.evaluate(() => { const re = /^(OK|Zamknij|Wróć|Rozumiem|Kontynuuj|Pomiń|Zamknij kartę|Wróć na mapę)$/i;
          for (const b of [...document.querySelectorAll('button')].filter((x) => x.offsetParent !== null && re.test(x.innerText.trim())).slice(0, 3)) b.click(); });
        await wait(300);
      }
      turn = r.turn1; turnMs.push(r.ms);
      sn = await take();
      if (turn % 10 === 0) log(`${typ} ${seed} T${turn} wars=${Object.keys(warStart).length} done=${wars.length} caps=${captures.length} ms=${r.ms.toFixed(0)} elapsed=${Math.round((Date.now() - t0all) / 1000)}s`);
      if (turn % 25 === 0 && OUT) fs.writeFileSync(OUT + '.partial.' + typ + seed, JSON.stringify({ turn, wars, open: warStart, captures, log: sn.log }));
    }
    const sorted = [...turnMs].sort((a, b) => a - b);
    return { typ, seed, turns: turn, wars, open: warStart, captures, log: sn.log, dipLogs: dipLogs.slice(-60), errors: errors.slice(0, 5),
      finalCities: sn.cities.reduce((a, c) => { a[c.o] = (a[c.o] || 0) + 1; return a; }, {}), majors: sn.majors,
      turnMs: { n: turnMs.length, total: turnMs.reduce((a, b) => a + b, 0), median: sorted[sorted.length >> 1], max: sorted[sorted.length - 1] } };
  } finally { await browser.close().catch(() => {}); }
}
(async () => {
  const results = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
  for (const typ of TYPES) for (const seed of SEEDS) {
    if (results.some((x) => x.typ === typ && x.seed === seed)) { log('pomijam', typ, seed); continue; }
    const t0 = Date.now();
    try { const res = await runOne(typ, seed); results.push(res); log(`DONE ${typ} ${seed} wars=${res.wars.length}+${Object.keys(res.open).length} caps=${res.captures.length} wall=${Math.round((Date.now() - t0) / 1000)}s`); }
    catch (e) { results.push({ typ, seed, error: String(e).slice(0, 400) }); log('ERROR', typ, seed, String(e).slice(0, 300)); }
    fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
  }
})();
