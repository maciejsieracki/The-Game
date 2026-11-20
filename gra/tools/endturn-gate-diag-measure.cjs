'use strict';
/**
 * endturn-gate-diag-measure.cjs -- R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1 (GOAL 4):
 * diagnoza "endTurn nie przesuwa tury" w przebiegu 100 tur PELNEJ GRY w KONFIGURACJI DOMYSLNEJ (domyslny podzial
 * podatkow, zadnych obejsc). Pochodna `longrun-100-turns-leak-q1-measure.cjs` (ten sam bundle/--prepare), z dodatkami:
 *  - przed KAZDYM endTurn odczyt `__nnsMeasureDebug.gateInfo()` (bramka "Zakoncz ture": blokada, komunikat, prognoza
 *    skarbca, podzial podatkow) i `canEnd()`;
 *  - nasluch `console.warn` '[EndTurn] blocked: ...' (kod gry loguje przyczyne odrzucenia endTurn);
 *  - dla kazdego endTurn, ktory nie przesuwa tury, linia `noadvance` (tura, przyczyna z konsoli, stan bramki, ms);
 *  - `--gate-fix taxsplit` : przy blokadzie bramki ustawia podzial 60/30/10 (jawnie zapisany w `gate-fix`) i biegnie dalej;
 *    bez tej flagi harness po 6 nieudanych probach konczy bledem (zachowanie oryginalnego harnessu).
 *  - `--ledger-off` : sekwencyjny wariant OFF (ksiega wylaczona przez __ledgerTestDebug.setRecording(false) od tury 1,
 *    osobny przebieg z przeladowaniem strony). Wariant ON = identyczne wywolanie bez tej flagi. Zdarzenie `ledger-mode`.
 *  Uzycie: --prepare <kopia-gra> (deleguje do longrun ... --prepare), potem --run --pw .. --dist .. --out .. --seed 4242.
 * Zero zmian w grze; zadnych hookow poza istniejacymi (?civTest=1).
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
function prepare(dir) { cp.execFileSync('node', [path.join(__dirname, 'longrun-100-turns-leak-q1-measure.cjs'), '--prepare', dir], { stdio: 'inherit' }); }
const http = require('http');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

function serveDist(dir) {
  const root = path.resolve(dir);
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
  const server = http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); } catch (_) { res.writeHead(400).end(); return; }
    const file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.stat(file, (err, st) => {
      const target = !err && st.isDirectory() ? path.join(file, 'index.html') : file;
      fs.createReadStream(target).on('error', () => { if (!res.headersSent) res.writeHead(404); res.end(); })
        .on('open', () => { res.setHeader('content-type', mime[path.extname(target).toLowerCase()] || 'application/octet-stream'); })
        .pipe(res);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise((r) => server.close(r)) }));
  });
}

if (process.argv.includes('--prepare')) { prepare(arg('prepare')); process.exit(0); }
if (!process.argv.includes('--run')) { console.error('usage: see header'); process.exit(2); }

const PW = arg('pw'); const DIST = arg('dist'); const OUTD = arg('out');
const TYP = arg('typ', 'kontynenty'); const SEED = Number(arg('seed', '4242'));
const TURNS = Number(arg('turns', '100')); const SIZE = arg('size', 'Standardowy');
const CPUPROF = new Set(String(arg('cpuprof', '10,40,70,95')).split(',').filter(Boolean).map(Number));
const PREFLIGHT_ONLY = process.argv.includes('--preflight-only');
const FALLBACK_CHROME = (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(OUTD, `seed${SEED}.jsonl`);
const emit = (o) => fs.appendFileSync(OUT, JSON.stringify(o) + '\n');

async function pollUntil(page, fn, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs; let last = null;
  while (Date.now() < deadline) { last = await page.evaluate(fn); if (last && last.ready) return last; await wait(500); }
  throw new Error(`pollUntil(${what}) timeout, last=` + JSON.stringify(last));
}

async function main() {
  fs.mkdirSync(OUTD, { recursive: true });
  const { chromium } = require(path.join(path.resolve(PW), 'node_modules', 'playwright'));
  const browser = await chromium.launch({
    headless: true, executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--no-sandbox', '--headless=new', '--js-flags=--expose-gc', '--enable-precise-memory-info', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  let server;
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const client = await page.context().newCDPSession(page);
    page.on('pageerror', (e) => emit({ ev: 'pageerror', msg: String(e).slice(0, 200) }));
    const blockedLog = [];
    page.on('console', (m) => { const t = m.text(); if (t.includes('[EndTurn] blocked')) blockedLog.push(t.slice(0, 240)); });
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    await page.addInitScript((s0) => {
      let s = s0 | 0;
      Math.random = function () {
        s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      // liczniki listenerow i timerow (netto)
      const c = (window.__lk = { add: 0, rem: 0, timers: new Set(), intervals: new Set() });
      const ea = EventTarget.prototype.addEventListener; const er = EventTarget.prototype.removeEventListener;
      c.sites = {};
      EventTarget.prototype.addEventListener = function (...a) {
        c.add++;
        if (window.__lkStack) { const o = a[2]; const once = o && typeof o === 'object' && o.once; const sg = o && typeof o === 'object' && o.signal;
          const k = (this && this.constructor ? this.constructor.name : '?') + ':' + a[0] + (once ? ':once' : '') + (sg ? ':signal' : '') + ' @ ' + String(new Error().stack).split('\n').slice(2, 4).map((x) => x.trim().replace(/^at /, '')).join(' <- ');
          c.sites[k] = (c.sites[k] || 0) + 1; }
        return ea.apply(this, a);
      };
      EventTarget.prototype.removeEventListener = function (...a) { c.rem++; return er.apply(this, a); };
      const st = window.setTimeout; const ct = window.clearTimeout; const si = window.setInterval; const ci = window.clearInterval;
      window.setTimeout = function (f, ms, ...r) { const id = st.call(window, function (...x) { c.timers.delete(id); return typeof f === 'function' ? f(...x) : undefined; }, ms, ...r); c.timers.add(id); return id; };
      window.clearTimeout = function (id) { c.timers.delete(id); return ct.call(window, id); };
      window.setInterval = function (f, ms, ...r) { const id = si.call(window, f, ms, ...r); c.intervals.add(id); return id; };
      window.clearInterval = function (id) { c.intervals.delete(id); return ci.call(window, id); };
    }, (0x9e3779b9 ^ SEED) | 0);
    if (process.argv.includes('--lkstack')) await page.addInitScript(() => { window.__lkStack = true; });
    server = await serveDist(DIST);
    await page.goto(server.url + '?civTest=1', { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug
      && !!window.__aiBuildingsTestDebug && !!window.__leakDump && !!window.__ledgerTestDebug, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    emit({ ev: 'start', seed: SEED, typ: TYP, size: SIZE, at: new Date().toISOString() });
    if (PREFLIGHT_ONLY) {
      const before = await page.evaluate(() => ({ enabled: window.__aiBuildingsTestDebug.fogRevealKeyFEnabled(), fogOff: window.__aiBuildingsTestDebug.isFogFullOff() }));
      if (before.enabled !== false || before.fogOff !== false) throw new Error('negative control baseline unexpected: ' + JSON.stringify(before));
      await page.keyboard.press('f'); await wait(100);
      const afterOffF = await page.evaluate(() => ({ enabled: window.__aiBuildingsTestDebug.fogRevealKeyFEnabled(), fogOff: window.__aiBuildingsTestDebug.isFogFullOff() }));
      if (afterOffF.enabled !== false || afterOffF.fogOff !== false) throw new Error('F changed state with option OFF: ' + JSON.stringify(afterOffF));
      emit({ ev: 'negative-control-pass', state: afterOffF });
    }
    await page.evaluate((o) => window.__aiBuildingsTestDebug.startNewGame(o), { seed: SEED, mapSize: SIZE, typSwiata: TYP, fogRevealKeyFEnabled: true });
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
    const fogOptionEnabled = await page.evaluate(() => window.__aiBuildingsTestDebug.fogRevealKeyFEnabled());
    if (fogOptionEnabled !== true) throw new Error('fogRevealKeyFEnabled did not reach doStartGame: ' + fogOptionEnabled);
    if (PREFLIGHT_ONLY) {
      await page.evaluate(() => window.__aiBuildingsTestDebug.setFogRevealKeyFEnabledForTest(false));
      await page.keyboard.press('f'); await wait(150);
      const offGate = await page.evaluate(() => ({ enabled: window.__aiBuildingsTestDebug.fogRevealKeyFEnabled(), fogOff: window.__aiBuildingsTestDebug.isFogFullOff() }));
      if (offGate.enabled !== false || offGate.fogOff !== false) throw new Error('negative control failed, F changed fog with option OFF: ' + JSON.stringify(offGate));
      await page.evaluate(() => window.__aiBuildingsTestDebug.setFogRevealKeyFEnabledForTest(true));
      emit({ ev: 'negative-control-pass', state: offGate });
    }
    if (PREFLIGHT_ONLY) {
      const initialFogOff = await page.evaluate(() => window.__aiBuildingsTestDebug.isFogFullOff());
      if (initialFogOff !== false) throw new Error('new game did not start with FoW on: ' + initialFogOff);
      await page.keyboard.press('f'); await wait(150);
      const onResult = await page.evaluate(() => window.__aiBuildingsTestDebug.isFogFullOff());
      if (onResult !== true) throw new Error('F did not turn FoW off with option ON: ' + onResult);
      await page.keyboard.press('f'); await wait(150);
      const restored = await page.evaluate(() => window.__aiBuildingsTestDebug.isFogFullOff());
      if (restored !== false) throw new Error('F did not restore FoW with option ON: ' + restored);
      emit({ ev: 'preflight-pass', fogRevealKeyFEnabled: true, fToggleOff: onResult, fToggleRestored: restored });
      fs.writeFileSync(path.join(OUTD, `seed${SEED}.DONE`), 'PREFLIGHT-OK\n');
      console.log('PREFLIGHT-OK');
      return;
    }
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    // mgla wojny OFF (klawisz F = toggleDevFogFull)
    await page.keyboard.press('f'); await wait(800);
    if (process.env.MEAS_FAST !== '0') { const fm = await page.evaluate(() => (window.__aiTradeWiringTestDebug && window.__aiTradeWiringTestDebug.setFastMode ? window.__aiTradeWiringTestDebug.setFastMode(true) : null)); emit({ ev: 'fast-mode', on: fm }); }
    emit({ ev: 'world-ready', at: new Date().toISOString() });

    const snap = async (full) => page.evaluate(async (full) => {
      const d = window.__leakDump.dump(); const pm = performance.memory || {};
      const o = { turn: d.turn, units: d.units, cities: d.cities, phase: d.phase, heap: pm.usedJSHeapSize, dom: document.getElementsByTagName('*').length,
        lis: window.__lk.add - window.__lk.rem, timers: window.__lk.timers.size, intervals: window.__lk.intervals.size };
      if (full) {
        o.sizes = d.sizes;
        if (window.gc) { window.gc(); window.gc(); await new Promise((r) => setTimeout(r, 50)); o.heapGC = performance.memory.usedJSHeapSize; }
      }
      return o;
    }, full);

    let turn = (await snap(false)).turn; let lastPhase = { ai: 0, dip: 0 };
    emit({ ev: 'snap', ...(await snap(true)), ms: 0 });
    let stuck = 0; let gateFixed = false;
    const GATE_MODE = arg('gate-fix', '');
    const GATE_FIX = GATE_MODE === 'taxsplit' || GATE_MODE === 'grant';
    let grantCount = 0;
    const TOGGLE_REC = process.argv.includes('--toggle-recording');
    const readGate = () => page.evaluate(() => {
      const d = window.__nnsMeasureDebug; const gi = d.gateInfo();
      return { turn: gi.turn, canEnd: gi.canEnd, blokada: gi.gate.blokada, komunikat: gi.gate.komunikat, zasob: gi.gate.zasob, prognoza: gi.gate.prognoza,
        niewystarczajace: gi.gate.niewystarczajace, propozycjaPodatku: gi.gate.propozycjaPodatku, treasury: gi.treasury, granary: gi.granary,
        forecast: gi.forecast, tax: d.getTaxSplit(), podatekPunkty: gi.podatekPunkty };
    });
    emit({ ev: 'gate-initial', ...(await readGate()) });
    // --ledger-off: sekwencyjny wariant OFF (osobny przebieg, osobne przeladowanie strony): ksiega wylaczona od tury 1.
    // Wariant ON = ten sam przebieg bez flagi (ksiega domyslnie zapisuje). Jedyna roznica miedzy przebiegami to ta flaga.
    const LEDGER_OFF = process.argv.includes('--ledger-off');
    if (LEDGER_OFF) await page.evaluate(() => window.__ledgerTestDebug.setRecording(false));
    emit({ ev: 'ledger-mode', mode: LEDGER_OFF ? 'off' : 'on', from: 'turn1' });
    while (turn < TURNS) {
      const pre = await readGate(); blockedLog.length = 0;
      // --toggle-recording: pomiar narzutu ksiegi w JEDNEJ sesji; kolejnosc ABBA (ON,OFF,OFF,ON) znosi dryf rosnacego czasu tury.
      // `setRecording(false)` wylacza WYLACZNIE zapis do ksiegi (stan gry nietkniety, patrz __ledgerTestDebug w main.ts).
      let rec = null;
      if (TOGGLE_REC) { rec = [1, 0, 0, 1][turn % 4]; await page.evaluate((on) => window.__ledgerTestDebug.setRecording(!!on), rec); }
      const prof = CPUPROF.has(turn + 1);
      if (prof) { await client.send('Profiler.enable'); await client.send('Profiler.setSamplingInterval', { interval: 1000 }); await client.send('Profiler.start'); }
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
      if (prof) {
        const { profile } = await client.send('Profiler.stop');
        fs.writeFileSync(path.join(OUTD, `seed${SEED}-t${turn + 1}.cpuprofile`), JSON.stringify(profile));
        await client.send('Profiler.disable');
      }
      if (r.turn1 <= r.turn0) {
        emit({ ev: 'noadvance', turn0: r.turn0, turn1: r.turn1, ms: Math.round(r.ms), attempt: stuck + 1, timeout: r.ms < 0, pre, consoleBlocked: blockedLog.slice(-5), gateAfter: await readGate() });
        if (GATE_MODE === 'grant' && pre.blokada && grantCount < 40) {
          // Tryb 'grant': dosypanie skarbca/spichlerza gracza (haki __nnsMeasureDebug) az bramka sie zwolni -- dziala dla KAZDEGO ziarna
          // (preset podatku 60/30/10 NIE wystarcza np. dla ziarna 777: prognoza -3 -> -1, bramka nadal aktywna).
          grantCount++;
          const fx = await page.evaluate(() => { const d = window.__nnsMeasureDebug; const gi = d.gateInfo(); d.grantPlayerGold(5000); d.setPlayerGranary((gi.granary || 0) + 5000); return { zasob: gi.gate.zasob, granted: 5000 }; });
          emit({ ev: 'gate-fix', mode: 'grant', turn: r.turn0, n: grantCount, fx, gateAfterFix: await readGate() }); await wait(300); continue;
        }
        if (GATE_MODE === 'taxsplit' && pre.blokada && !gateFixed) {
          const fx = await page.evaluate(() => window.__nnsMeasureDebug.setTaxSplit(60, 30, 10));
          gateFixed = true; emit({ ev: 'gate-fix', turn: r.turn0, taxsplit: fx, gateAfterFix: await readGate() }); await wait(300); continue;
        }
        if (++stuck > 6) throw new Error('tura nie przechodzi: ' + JSON.stringify(r));
        await page.keyboard.press('Escape').catch(() => {});
        await page.evaluate(() => {
          const re = /^(OK|Zamknij|Wróć|Rozumiem|Kontynuuj|Pomiń|Zamknij kartę|Wróć na mapę)$/i;
          for (const b of [...document.querySelectorAll('button')].filter((x) => x.offsetParent !== null && re.test(x.innerText.trim())).slice(0, 3)) b.click();
        });
        await wait(300); continue;
      }
      stuck = 0; turn = r.turn1;
      if (pre.blokada || !pre.canEnd) emit({ ev: 'pre-gate-active-but-advanced', turn0: r.turn0, pre });
      const full = turn % 5 === 0 || turn === 1;
      const s = await snap(full);
      const aiMs = Math.round(s.phase.ai - lastPhase.ai); const dipMs = Math.round(s.phase.dip - lastPhase.dip); lastPhase = { ai: s.phase.ai, dip: s.phase.dip };
      emit({ ev: 'turn', ...s, ms: Math.round(r.ms), aiMs, dipMs, ...(TOGGLE_REC ? { rec } : {}) });
      if (process.argv.includes('--lkstack') && turn % 5 === 0) emit({ ev: 'lkstack', turn, sites: await page.evaluate(() => Object.entries(window.__lk.sites).sort((a, b) => b[1] - a[1]).slice(0, 12)) });
      if (turn % 10 === 0) console.log(new Date().toISOString().slice(11, 19), 'seed', SEED, 'T' + turn, 'ms', Math.round(r.ms), 'heap', Math.round(s.heap / 1e6) + 'MB');
    }
    emit({ ev: 'done' }); fs.writeFileSync(path.join(OUTD, `seed${SEED}.DONE`), 'ok\n'); console.log('DONE');
  } catch (e) {
    emit({ ev: 'error', err: String((e && e.stack) || e).slice(0, 800) });
    fs.writeFileSync(path.join(OUTD, `seed${SEED}.DONE`), 'ERROR\n'); console.log('ERROR', String(e).slice(0, 300)); process.exitCode = 1;
  } finally { await browser.close().catch(() => {}); if (server) await server.close().catch(() => {}); }
}
main().then(() => process.exit(process.exitCode || 0));
