'use strict';
/**
 * web-turn-slowdown-measure.cjs — R-WEB-TURN-SLOWDOWN-Q2, część (A) POMIAR i (B) PROFIL.
 *
 * Realny bundle (Vite build) w headless Chromium, realne `doStartGame`
 * (`__aiBuildingsTestDebug.startNewGame`), realne „Zakończ turę” (`__eraTestDebug.endTurn()`
 * = `advanceSeat()`), realne otwarcie panelu miasta (`openCityPanelForPlayer` przez
 * `__turnSlowdownTestDebug`). Math.random podmieniony ziarnowanym mulberry32 (jak w
 * `ai-buduje-budynki-test.cjs`) — ta sama gra przy tym samym ziarnie.
 *
 * Per tura zapisuje wiersz CSV: czas tury (ms, klik→endTurnInProgress=false→klatka),
 * czas otwarcia panelu miasta (ms, wywołanie→2 klatki), jsHeapMB, węzły DOM i nasłuchiwacze
 * (CDP Memory.getDOMCounters), liczniki three.js z `?memdebug=1`, rozmiar JSON zapisu
 * i jego skrót (determinizm), rozmiary kolekcji stanu.
 *
 * Użycie (z katalogu gra/):
 *   node tools/web-turn-slowdown-measure.cjs --dist <katalog z index.html> --out <katalog>
 *        [--turns 80] [--seed 778899] [--profile-at 12,72] [--label base]
 * Wynik: <out>/<label>-turns.csv, <label>-collections.json, <label>-snapshot-sections.json,
 *        <label>-summary.json oraz (gdy --profile-at) <label>-turn<T>.cpuprofile,
 *        <label>-city<T>.cpuprofile.
 */
const path = require('path');
const fs = require('fs');

const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const DIST = arg('dist');
const OUT = arg('out');
const TURNS = Number(arg('turns', '80'));
const SEED = Number(arg('seed', '778899'));
const PROFILE_AT_LIST = String(arg('profile-at', '')).split(',').filter(Boolean).map(Number);
const LABEL = arg('label', 'run');
const PRNG_SEED = Number(arg('prng', String(0x9e3779b9 | 0)));
if (!DIST || !OUT) {
  console.error('Użycie: --dist <katalog z index.html> --out <katalog wyjściowy>');
  process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function pollUntil(page, fn, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await page.evaluate(fn);
    if (last && last.ready) return last;
    await wait(500);
  }
  throw new Error(`pollUntil(${what}) timeout, last=` + JSON.stringify(last));
}

async function main() {
  const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--js-flags=--expose-gc'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  const memLines = [];
  page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e)));
  page.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error') errors.push(t.slice(0, 300));
    if (t.includes('[memdebug]')) memLines.push(t);
  });
  await page.addInitScript((seed) => {
    let s = seed | 0;
    Math.random = function seededRandom() {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }, PRNG_SEED);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');

  const url = 'file://' + path.join(path.resolve(DIST), 'index.html') + '?memdebug=1';
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(
    () => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug
      && !!window.__aiBuildingsTestDebug && !!window.__rebelProtectionTestDebug
      && !!window.__turnSlowdownTestDebug,
    undefined, { timeout: 180000 },
  );
  await page.waitForSelector('.civ-menu', { timeout: 180000 });
  const tGen = Date.now();
  await page.evaluate((seed) => window.__aiBuildingsTestDebug.startNewGame({ seed }), SEED);
  await pollUntil(page, () => {
    const dbg = window.__cityStateStartUnitsTestDebug;
    if (!dbg) return { ready: false };
    const overlay = Array.from(document.querySelectorAll('*')).some(
      (el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null,
    );
    const st = dbg.dumpState();
    return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
  }, 900000, 'awaitingFirstPlayerCity');
  log('worldgen ms', Date.now() - tGen);
  const founded = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  if (!founded) throw new Error('foundPlayerStartCity() = false');
  await pollUntil(page, () => {
    const st = window.__cityStateStartUnitsTestDebug.dumpState();
    return { ready: st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0) };
  }, 60000, 'playerCity');
  await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
  await wait(1000);

  const rows = [];
  const collHistory = [];
  const sectionHistory = [];
  const sectionHashHistory = [];
  const header = ['turn', 'endTurnMs', 'cityOpenSyncMs', 'cityOpenFrameMs', 'cityCloseMs',
    'jsHeapMB', 'domNodes', 'jsEventListeners', 'documents', 'geometries', 'textures', 'programs',
    'cityModels', 'cityBadgeTextures', 'saveBytes', 'saveHash', 'snapshotMs', 'units', 'cities',
    'endTurnRetries'];

  async function cpuProfile(fn, file) {
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
    await cdp.send('Profiler.start');
    const r = await fn();
    const { profile } = await cdp.send('Profiler.stop');
    fs.writeFileSync(path.join(OUT, file), JSON.stringify(profile));
    await cdp.send('Profiler.disable');
    return r;
  }

  const endTurnInPage = () => page.evaluate(() => new Promise((resolve) => {
    const dbg = window.__eraTestDebug;
    const turn0 = dbg.getWorldState().turn;
    const t0 = performance.now();
    dbg.endTurn();
    let saw = dbg.isEndTurnInProgress();
    const tick = () => {
      const ip = dbg.isEndTurnInProgress();
      if (ip) saw = true;
      if (!ip && (saw || performance.now() - t0 > 2000)) {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve({
          ms: performance.now() - t0, turn0, turn1: dbg.getWorldState().turn, saw,
        })));
        return;
      }
      if (performance.now() - t0 > 600000) { resolve({ ms: -1, turn0, turn1: dbg.getWorldState().turn, saw }); return; }
      setTimeout(tick, 4);
    };
    setTimeout(tick, 0);
  }));

  const cityOpenInPage = () => page.evaluate(() => new Promise((resolve) => {
    const dbg = window.__turnSlowdownTestDebug;
    const t0 = performance.now();
    const syncMs = dbg.openFirstPlayerCityPanel();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const frameMs = performance.now() - t0;
      const open = dbg.isCityPanelOpen();
      const t1 = performance.now();
      dbg.closeCityPanel();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        resolve({ syncMs, frameMs, open, closeMs: performance.now() - t1 });
      }));
    }));
  }));

  const dismissModals = async () => {
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => {
      const re = /^(OK|Zamknij|Wróć|Rozumiem|Kontynuuj|Pomiń|Zamknij kartę|Wróć na mapę)$/i;
      const bs = [...document.querySelectorAll('button')].filter((x) => x.offsetParent !== null && re.test(x.innerText.trim()));
      for (const b of bs.slice(0, 3)) b.click();
    });
    await wait(300);
  };

  // Watchdog: gdy krok wisi > WATCHDOG_MS, zatrzymaj JS strony (CDP Debugger.pause) i
  // wypisz stos — rozróżnia pętlę w kodzie gry od zawieszenia harnessu.
  const WATCHDOG_MS = Number(arg('watchdog-ms', '420000'));
  const withWatchdog = async (what, promise) => {
    let timer;
    const dog = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('WATCHDOG ' + what)), WATCHDOG_MS); });
    try {
      return await Promise.race([promise, dog]);
    } catch (e) {
      if (!String(e.message).startsWith('WATCHDOG')) throw e;
      log('WATCHDOG: krok wisi', what, '- pauza JS i stos');
      try {
        await cdp.send('Debugger.enable');
        const paused = new Promise((res) => cdp.once('Debugger.paused', res));
        await cdp.send('Debugger.pause');
        const ev = await Promise.race([paused, wait(20000).then(() => null)]);
        if (ev) {
          for (const f of ev.callFrames.slice(0, 25)) log('  at', f.functionName || '(anon)', 'L' + (f.location.lineNumber + 1));
        } else log('  brak zdarzenia paused (wątek nie odpowiada)');
        await cdp.send('Debugger.resume').catch(() => {});
      } catch (e2) { log('  pauza nieudana', String(e2)); }
      throw e;
    } finally { clearTimeout(timer); }
  };
  page.on('dialog', (d) => { log('DIALOG', d.type(), d.message().slice(0, 120)); d.dismiss().catch(() => {}); });

  let turn = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  while (turn < TURNS) {
    let r = null; let retries = 0;
    const doTurn = () => withWatchdog('endTurn T' + turn, endTurnInPage());
    for (;;) {
      if (PROFILE_AT_LIST.includes(turn) && retries === 0) {
        r = await cpuProfile(doTurn, `${LABEL}-turn${turn}.cpuprofile`);
      } else {
        r = await doTurn();
      }
      if (r.turn1 > r.turn0) break;
      retries++;
      if (retries > 6) throw new Error('tura nie przechodzi: ' + JSON.stringify(r));
      log('endTurn odrzucony, zamykam modale', JSON.stringify(r));
      await dismissModals();
    }
    turn = r.turn1;
    await wait(250);
    let city;
    if (PROFILE_AT_LIST.includes(turn - 1)) {
      city = await cpuProfile(() => withWatchdog('city T' + turn, cityOpenInPage()), `${LABEL}-city${turn}.cpuprofile`);
    } else {
      city = await withWatchdog('city T' + turn, cityOpenInPage());
    }
    const dom = await cdp.send('Memory.getDOMCounters');
    const heap = await cdp.send('Runtime.getHeapUsage');
    const snap = await withWatchdog('snapshot T' + turn, page.evaluate(() => window.__turnSlowdownTestDebug.snapshotInfo()));
    const coll = await withWatchdog('collections T' + turn, page.evaluate(() => {
      const d = window.__turnSlowdownTestDebug;
      const out = d.collections();
      if (typeof d.textureCensus === 'function') {
        for (const [k, v] of Object.entries(d.textureCensus())) out['tex:' + k] = v;
      }
      return out;
    }));
    const world = await page.evaluate(() => window.__eraTestDebug.getWorldState());
    const ml = memLines[memLines.length - 1] || '';
    const num = (k) => { const m = ml.match(new RegExp(k + '=(\\d+)')); return m ? Number(m[1]) : ''; };
    const row = {
      turn, endTurnMs: r.ms.toFixed(1), cityOpenSyncMs: city.syncMs.toFixed(1),
      cityOpenFrameMs: city.frameMs.toFixed(1), cityCloseMs: city.closeMs.toFixed(1),
      jsHeapMB: (heap.usedSize / 1048576).toFixed(1), domNodes: dom.nodes,
      jsEventListeners: dom.jsEventListeners, documents: dom.documents,
      geometries: num('geometries'), textures: num('textures'), programs: num('programs'),
      cityModels: num('cityModels'), cityBadgeTextures: num('cityBadgeTextures'),
      saveBytes: snap.bytes, saveHash: snap.hash, snapshotMs: snap.ms.toFixed(1),
      units: world.unitsLen, cities: world.citiesLen, endTurnRetries: retries,
    };
    rows.push(row);
    collHistory.push({ turn, ...coll });
    sectionHistory.push({ turn, ...snap.sections });
    if (snap.sectionHashes) sectionHashHistory.push({ turn, ...snap.sectionHashes });
    log(`T${turn} endTurn=${row.endTurnMs} city=${row.cityOpenFrameMs}/${row.cityOpenSyncMs} heap=${row.jsHeapMB}`
      + ` dom=${row.domNodes} lst=${row.jsEventListeners} tex=${row.textures} geo=${row.geometries}`
      + ` save=${row.saveBytes} u=${row.units} c=${row.cities} hash=${row.saveHash}`);
    fs.writeFileSync(path.join(OUT, `${LABEL}-turns.csv`),
      header.join(',') + '\n' + rows.map((x) => header.map((h) => x[h]).join(',')).join('\n') + '\n');
  }
  fs.writeFileSync(path.join(OUT, `${LABEL}-collections.json`), JSON.stringify(collHistory));
  fs.writeFileSync(path.join(OUT, `${LABEL}-snapshot-sections.json`), JSON.stringify(sectionHistory));
  fs.writeFileSync(path.join(OUT, `${LABEL}-snapshot-section-hashes.json`), JSON.stringify(sectionHashHistory));
  fs.writeFileSync(path.join(OUT, `${LABEL}-summary.json`), JSON.stringify({
    seed: SEED, prng: PRNG_SEED, turns: TURNS, finalHash: rows.length ? rows[rows.length - 1].saveHash : null,
    errors: errors.slice(0, 50), errorCount: errors.length,
  }, null, 2));
  log('DONE errors=' + errors.length + ' finalHash=' + (rows.length ? rows[rows.length - 1].saveHash : ''));
  await browser.close();
}

main().catch((e) => { console.error('FATAL', e && e.stack || e); process.exit(1); });
