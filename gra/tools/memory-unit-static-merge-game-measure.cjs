'use strict';
/**
 * memory-unit-static-merge-game-measure.cjs -- R-WEB-MEMORY-UNIT-STATIC-MERGE-Q1: pomiar w PELNEJ grze (realny bundle
 * vite, headless Chromium, `?civTest=1`, mgla OFF, gracz konczy tury bez ruchow; seed/mapa jak FALA 526-530).
 * Zero zmian w repo: przygotowanie kopii `gra/` = `memory-growth-rootcause-q1-measure.cjs --prepare <kopia>`
 * (haki __leakDump/__memProbe), potem w kopii `vite build --minify false --outDir <poza repo>`.
 *
 *  node tools/memory-unit-static-merge-game-measure.cjs --pw <katalog z node_modules/playwright> --dist <dist>
 *       --out <plik.jsonl> --label <nazwa> [--seed 4242] [--turns 50] [--at 1,50]
 *
 * W turach --at: MB sterty JS po GC (performance.memory po window.gc x2), renderer.info (draw calls, trojkaty,
 * geometrie) z __memProbe.stats(), liczba meshy/obiektow zetonow, oraz profil CPU (CDP Profiler, 1 ms):
 *   idle -- 4 s pracy petli renderu bez zmian swiata: czas wlaczny `renderLoop` na klatke;
 *   sync -- przejscie tury (t-1 -> t): czas wlaczny `syncUnitsRender` w tej turze.
 * Nazwy funkcji sa czytelne, bo build jest bez minifikacji.
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const PW = arg('pw'); const DIST = arg('dist'); const OUT = arg('out'); const LABEL = arg('label', '?');
const SEED = Number(arg('seed', '4242')); const TURNS = Number(arg('turns', '50'));
const AT = new Set(String(arg('at', '1,50')).split(',').map(Number));
if (!PW || !DIST || !OUT) { console.error('usage: see header'); process.exit(2); }
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const emit = (o) => fs.appendFileSync(OUT, JSON.stringify({ label: LABEL, ...o }) + '\n');

/** Czas wlaczny (ms) funkcji o nazwie `name` w profilu CPU (bez podwojnego liczenia rekurencji). */
function inclusiveMs(profile, name) {
  const parent = new Map(); const byId = new Map();
  for (const n of profile.nodes) { byId.set(n.id, n); for (const c of n.children || []) parent.set(c, n.id); }
  const hasFn = new Map();
  const under = (id) => {
    if (hasFn.has(id)) return hasFn.get(id);
    let v = false; let cur = id;
    const chain = [];
    while (cur !== undefined) {
      if (hasFn.has(cur)) { v = hasFn.get(cur); break; }
      chain.push(cur);
      if (byId.get(cur).callFrame.functionName === name) { v = true; break; }
      cur = parent.get(cur);
    }
    for (const c of chain) hasFn.set(c, v);
    return v;
  };
  let us = 0;
  const s = profile.samples || []; const d = profile.timeDeltas || [];
  for (let i = 0; i < s.length; i++) if (under(s[i])) us += d[i + 1] !== undefined ? d[i + 1] : 0;
  return us / 1000;
}

async function pollUntil(page, fn, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs; let last = null;
  while (Date.now() < deadline) { last = await page.evaluate(fn); if (last && last.ready) return last; await wait(500); }
  throw new Error(`pollUntil(${what}) timeout, last=` + JSON.stringify(last));
}

async function main() {
  const { chromium } = require(path.join(path.resolve(PW), 'node_modules', 'playwright'));
  const browser = await chromium.launch({
    headless: true, executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--no-sandbox', '--headless=new', '--js-flags=--expose-gc', '--enable-precise-memory-info', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const client = await page.context().newCDPSession(page);
    page.on('pageerror', (e) => emit({ ev: 'pageerror', msg: String(e).slice(0, 200) }));
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    await page.addInitScript((s0) => {
      let s = s0 | 0;
      Math.random = function () {
        s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      window.__rafN = 0; const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => raf((t) => { window.__rafN++; cb(t); });
    }, (0x9e3779b9 ^ SEED) | 0);
    await client.send('Profiler.enable');
    await client.send('Profiler.setSamplingInterval', { interval: 1000 });
    await page.goto('file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1', { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug
      && !!window.__aiBuildingsTestDebug && !!window.__leakDump && !!window.__memProbe, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    emit({ ev: 'start', seed: SEED, at: new Date().toISOString() });
    await page.evaluate((o) => window.__aiBuildingsTestDebug.startNewGame(o), { seed: SEED, mapSize: 'Standardowy', typSwiata: 'kontynenty' });
    await pollUntil(page, () => {
      const dbg = window.__cityStateStartUnitsTestDebug;
      const overlay = Array.from(document.querySelectorAll('*')).some((el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      const st = dbg.dumpState();
      return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
    }, 1500000, 'awaitingFirstPlayerCity');
    if (!(await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()))) throw new Error('foundPlayerStartCity() = false');
    await pollUntil(page, () => {
      const st = window.__cityStateStartUnitsTestDebug.dumpState();
      return { ready: st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0) };
    }, 60000, 'playerCity');
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    await page.keyboard.press('f'); await wait(800);
    emit({ ev: 'world-ready', at: new Date().toISOString() });

    const measure = async (turn, syncProfile) => {
      await wait(1500);
      const o = await page.evaluate(async () => {
        if (window.gc) { window.gc(); window.gc(); await new Promise((r) => setTimeout(r, 50)); }
        const heapGC = performance.memory.usedJSHeapSize;
        const p = window.__memProbe.stats();
        const u = p.groups && p.groups.unit;
        return { turn: p.turn, units: p.units, cities: p.cities, heapGC, rinfo: p.rinfo, unitGroup: u, geoUniq: p.geoUniq, matUniq: p.matUniq };
      });
      o.heapMB = +(o.heapGC / 1048576).toFixed(2);
      // profil bezczynnej petli renderu
      const n0 = await page.evaluate(() => window.__rafN);
      await client.send('Profiler.start'); await wait(4000);
      const { profile } = await client.send('Profiler.stop');
      const frames = (await page.evaluate(() => window.__rafN)) - n0;
      const rl = inclusiveMs(profile, 'renderLoop');
      o.idle = { frames, renderLoopMs: +rl.toFixed(1), renderLoopMsPerFrame: frames ? +(rl / frames).toFixed(3) : null };
      if (syncProfile) o.sync = { syncUnitsRenderMs: +inclusiveMs(syncProfile, 'syncUnitsRender').toFixed(1), endTurnRenderLoopMs: +inclusiveMs(syncProfile, 'renderLoop').toFixed(1) };
      o.load = require('os').loadavg();
      return o;
    };

    let turn = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    if (AT.has(turn)) emit({ ev: 'snap', ...(await measure(turn, null)) });
    let stuck = 0;
    while (turn < TURNS) {
      const profiling = AT.has(turn + 1);
      if (profiling) await client.send('Profiler.start');
      const r = await page.evaluate(() => new Promise((resolve) => {
        const dbg = window.__eraTestDebug; const turn0 = dbg.getWorldState().turn; const t0 = performance.now();
        dbg.endTurn(); let saw = dbg.isEndTurnInProgress();
        const tick = () => {
          const ip = dbg.isEndTurnInProgress(); if (ip) saw = true;
          if (!ip && (saw || performance.now() - t0 > 2000)) { resolve({ ms: performance.now() - t0, turn0, turn1: dbg.getWorldState().turn }); return; }
          if (performance.now() - t0 > 500000) { resolve({ ms: -1, turn0, turn1: dbg.getWorldState().turn }); return; }
          setTimeout(tick, 4);
        };
        setTimeout(tick, 0);
      }));
      const syncProfile = profiling ? (await client.send('Profiler.stop')).profile : null;
      if (r.turn1 <= r.turn0) {
        if (++stuck > 6) throw new Error('tura nie przechodzi: ' + JSON.stringify(r));
        await page.keyboard.press('Escape').catch(() => {});
        await page.evaluate(() => {
          const re = /^(OK|Zamknij|Wróć|Rozumiem|Kontynuuj|Pomiń|Zamknij kartę|Wróć na mapę)$/i;
          for (const b of [...document.querySelectorAll('button')].filter((x) => x.offsetParent !== null && re.test(x.innerText.trim())).slice(0, 3)) b.click();
        });
        await wait(300); continue;
      }
      stuck = 0; turn = r.turn1;
      if (AT.has(turn)) emit({ ev: 'snap', endTurnMs: Math.round(r.ms), ...(await measure(turn, syncProfile)) });
      if (turn % 10 === 0) console.log(new Date().toISOString().slice(11, 19), LABEL, 'T' + turn, 'ms', Math.round(r.ms));
    }
    emit({ ev: 'done', at: new Date().toISOString() }); console.log('DONE');
  } catch (e) {
    emit({ ev: 'error', err: String((e && e.stack) || e).slice(0, 800) }); console.log('ERROR', String(e).slice(0, 300));
  } finally { await browser.close().catch(() => {}); }
}
main().then(() => process.exit(0));
