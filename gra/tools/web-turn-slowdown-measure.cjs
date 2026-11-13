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
 *        [--turns 80] [--seed 778899] [--profile-at 12,72] [--label base] [--profile-all]
 *   --profile-all (runda 2): profil CPU KAŻDEJ tury i KAŻDEGO otwarcia panelu miasta;
 *        kolumny turnJsMs/cityJsMs = próbki bez „(program)” i „(idle)” (czas kodu gry
 *        bez natywnego narzutu swiftshadera) oraz turnProgramMs/cityProgramMs. Pliki
 *        .cpuprofile zapisywane tylko dla tur z --profile-at.
 * Wynik: <out>/<label>-turns.csv, <label>-collections.json, <label>-snapshot-sections.json,
 *        <label>-summary.json oraz (gdy --profile-at) <label>-turn<T>.cpuprofile,
 *        <label>-city<T>.cpuprofile, <label>-textures.csv (spis tekstur sceny per tura,
 *        `textureCensus`), <label>-cities-per-owner.json.
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
const PROFILE_ALL = process.argv.includes('--profile-all');
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
    'endTurnRetries', 'playerCities', 'maxAiCitiesPerOwner', 'drawCalls', 'triangles',
    'turnJsMs', 'turnProgramMs', 'cityJsMs', 'cityProgramMs'];
  const texRows = [];
  const cpoHistory = [];
  const lastProf = { turn: null, city: null };
  /** Czas JS z profilu: suma próbek bez „(program)” i „(idle)” (GC wliczony). */
  const splitProfile = (profile) => {
    const byId = new Map(profile.nodes.map((n) => [n.id, n.callFrame.functionName]));
    let all = 0, prog = 0, idle = 0;
    for (let i = 0; i < profile.samples.length; i++) {
      const d = profile.timeDeltas[i] || 0; all += d;
      const fn = byId.get(profile.samples[i]);
      if (fn === '(program)') prog += d; else if (fn === '(idle)') idle += d;
    }
    return { jsMs: (all - prog - idle) / 1000, programMs: prog / 1000 };
  };

  async function cpuProfile(fn, file, slot) {
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
    await cdp.send('Profiler.start');
    const r = await fn();
    const { profile } = await cdp.send('Profiler.stop');
    if (file) fs.writeFileSync(path.join(OUT, file), JSON.stringify(profile));
    if (slot) lastProf[slot] = splitProfile(profile);
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
      // Runda 2 (zarzut 7): każde wywołanie CDP ograniczone czasem — w zawieszeniu z
      // 2026-10-23 04:44 (przebieg PRE bramki) proces renderera strony już NIE ISTNIAŁ i
      // `Debugger.enable` czekał bez końca, więc watchdog sam wisiał zamiast wyjść.
      const bounded = (p, what2) => Promise.race([p, wait(20000).then(() => { throw new Error('CDP timeout ' + what2); })]);
      try {
        await bounded(cdp.send('Debugger.enable'), 'Debugger.enable');
        const paused = new Promise((res) => cdp.once('Debugger.paused', res));
        await bounded(cdp.send('Debugger.pause'), 'Debugger.pause');
        const ev = await Promise.race([paused, wait(20000).then(() => null)]);
        if (ev) {
          for (const f of ev.callFrames.slice(0, 25)) log('  at', f.functionName || '(anon)', 'L' + (f.location.lineNumber + 1));
        } else log('  brak zdarzenia paused (wątek nie odpowiada)');
        await cdp.send('Debugger.resume').catch(() => {});
      } catch (e2) { log('  pauza nieudana', String(e2)); }
      throw e;
    } finally { clearTimeout(timer); }
  };
  page.on('crash', () => log('PAGE CRASH: proces renderera strony zakończony (nie pętla w kodzie gry)'));
  page.on('close', () => log('PAGE CLOSE'));
  page.on('dialog', (d) => { log('DIALOG', d.type(), d.message().slice(0, 120)); d.dismiss().catch(() => {}); });

  let turn = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  while (turn < TURNS) {
    let r = null; let retries = 0;
    const doTurn = () => withWatchdog('endTurn T' + turn, endTurnInPage());
    for (;;) {
      if ((PROFILE_ALL || PROFILE_AT_LIST.includes(turn)) && retries === 0) {
        lastProf.turn = null;
        r = await cpuProfile(doTurn, PROFILE_AT_LIST.includes(turn) ? `${LABEL}-turn${turn}.cpuprofile` : null, 'turn');
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
    const rinfo = await page.evaluate(() => window.__turnSlowdownTestDebug.renderInfo
      ? window.__turnSlowdownTestDebug.renderInfo() : null);
    lastProf.city = null;
    if (PROFILE_ALL || PROFILE_AT_LIST.includes(turn - 1)) {
      city = await cpuProfile(() => withWatchdog('city T' + turn, cityOpenInPage()),
        PROFILE_AT_LIST.includes(turn - 1) ? `${LABEL}-city${turn}.cpuprofile` : null, 'city');
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
    const cpo = await page.evaluate(() => window.__turnSlowdownTestDebug.citiesPerOwner
      ? window.__turnSlowdownTestDebug.citiesPerOwner() : {});
    cpoHistory.push({ turn, ...cpo });
    const tex = { turn };
    for (const [k, v] of Object.entries(coll)) if (k.startsWith('tex:')) tex[k.slice(4)] = v;
    texRows.push(tex);
    const aiCounts = Object.entries(cpo).filter(([k]) => k.startsWith('o:')).map(([, v]) => v);
    const fmtMs = (x) => (x === null || x === undefined ? '' : x.toFixed(1));
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
      playerCities: Object.entries(cpo).filter(([k]) => k.startsWith('me:')).reduce((a, [, v]) => a + v, 0),
      maxAiCitiesPerOwner: aiCounts.length ? Math.max(...aiCounts) : 0,
      drawCalls: rinfo ? rinfo.calls : '', triangles: rinfo ? rinfo.triangles : '',
      turnJsMs: fmtMs(lastProf.turn && lastProf.turn.jsMs), turnProgramMs: fmtMs(lastProf.turn && lastProf.turn.programMs),
      cityJsMs: fmtMs(lastProf.city && lastProf.city.jsMs), cityProgramMs: fmtMs(lastProf.city && lastProf.city.programMs),
    };
    rows.push(row);
    collHistory.push({ turn, ...coll });
    sectionHistory.push({ turn, ...snap.sections });
    if (snap.sectionHashes) sectionHashHistory.push({ turn, ...snap.sectionHashes });
    log(`T${turn} endTurn=${row.endTurnMs} city=${row.cityOpenFrameMs}/${row.cityOpenSyncMs} heap=${row.jsHeapMB}`
      + ` dom=${row.domNodes} lst=${row.jsEventListeners} tex=${row.textures} geo=${row.geometries}`
      + ` save=${row.saveBytes} u=${row.units} c=${row.cities} aiMaxC=${row.maxAiCitiesPerOwner}`
      + (row.turnJsMs ? ` js=${row.turnJsMs}/${row.cityJsMs}` : '') + ` hash=${row.saveHash}`);
    fs.writeFileSync(path.join(OUT, `${LABEL}-turns.csv`),
      header.join(',') + '\n' + rows.map((x) => header.map((h) => x[h]).join(',')).join('\n') + '\n');
    const texKeys = [...new Set(texRows.flatMap((x) => Object.keys(x)))].filter((k) => k !== 'turn').sort();
    fs.writeFileSync(path.join(OUT, `${LABEL}-textures.csv`), ['turn', ...texKeys].join(',') + '\n'
      + texRows.map((x) => [x.turn, ...texKeys.map((k) => x[k] ?? 0)].join(',')).join('\n') + '\n');
  }
  fs.writeFileSync(path.join(OUT, `${LABEL}-collections.json`), JSON.stringify(collHistory));
  fs.writeFileSync(path.join(OUT, `${LABEL}-cities-per-owner.json`), JSON.stringify(cpoHistory));
  fs.writeFileSync(path.join(OUT, `${LABEL}-snapshot-sections.json`), JSON.stringify(sectionHistory));
  fs.writeFileSync(path.join(OUT, `${LABEL}-snapshot-section-hashes.json`), JSON.stringify(sectionHashHistory));
  // Runda 2 (zarzut 5, K4): po OSTATNIEJ turze (skróty stanu już zebrane) — czas 20 wywołań
  // `empireTerritoryResourceRatesForOwner` gracza, 5 serii po rozgrzewce, minimum serii.
  const territoryRatesMs = await page.evaluate(() => {
    const d = window.__turnSlowdownTestDebug;
    if (!d.timeTerritoryRatesMs) return null;
    d.timeTerritoryRatesMs(5);
    const s = [];
    for (let i = 0; i < 5; i++) s.push(d.timeTerritoryRatesMs(20));
    return s;
  });
  if (territoryRatesMs) log('territoryRatesMs(20 wywołań, 5 serii)=' + territoryRatesMs.map((x) => x.toFixed(1)).join(','));
  fs.writeFileSync(path.join(OUT, `${LABEL}-summary.json`), JSON.stringify({
    seed: SEED, prng: PRNG_SEED, turns: TURNS, finalHash: rows.length ? rows[rows.length - 1].saveHash : null,
    territoryRatesMs,
    errors: errors.slice(0, 50), errorCount: errors.length,
  }, null, 2));
  log('DONE errors=' + errors.length + ' finalHash=' + (rows.length ? rows[rows.length - 1].saveHash : ''));
  await browser.close();
}

main().catch((e) => { console.error('FATAL', e && e.stack || e); process.exit(1); });
