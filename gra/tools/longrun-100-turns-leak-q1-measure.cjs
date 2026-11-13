'use strict';
/**
 * longrun-100-turns-leak-q1-measure.cjs -- R-WEB-LONGRUN-100-TURNS-LEAK-Q1: pomiar wydajnosci/wyciekow na 100 turach
 * PELNEJ GRY (realny bundle vite, headless Chromium, `?civTest=1`, mgla wojny WYLACZONA, gracz konczy tury bez ruchow).
 * Zero zmian w repo: wszystko w KOPII `gra/` poza repo.
 *
 *  1) node tools/longrun-100-turns-leak-q1-measure.cjs --prepare <kopia-gra>
 *     (uruchamia `ai-city-live-measure.cjs --prepare` = startNewGame z mapSize/typSwiata, potem dokleja:
 *      window.__leakDump.dump()  -- rozmiary WSZYSTKICH module-level Map/Set/[] z main.ts (wykrywane regexem),
 *                                   units/cities, three.js renderer.info (jesli widoczny);
 *      __tmW -- licznik czasu faz AI (decideAITurn) i dyplomacji AI (decideAIDiplomacy).)
 *  2) (w kopii) node ./node_modules/vite/bin/vite.js build --outDir <poza repo>/dist --emptyOutDir
 *  3) node tools/longrun-100-turns-leak-q1-measure.cjs --run --pw <katalog z node_modules/playwright> --dist <dist>
 *        --out <katalog> --seed 4242 [--turns 100] [--typ kontynenty] [--size Standardowy] [--cpuprof 1]
 * Wynik: <out>/seed<seed>.jsonl (linia per tura), <out>/seed<seed>.DONE; profile CPU: <out>/seed<seed>-t<N>.cpuprofile
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
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

function prepare(dir) {
  const root = path.resolve(dir);
  cp.execFileSync('node', [path.join(__dirname, 'ai-city-live-measure.cjs'), '--prepare', root], { stdio: 'inherit' });
  const file = path.join(root, 'src', 'main.ts');
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('__leakDump')) { console.log('juz zapatchowany'); return; }
  // 1) lista module-level kolekcji (wciecie 4 = wnetrze glownej funkcji main.ts)
  const re = /^    (?:const|let) ([A-Za-z_0-9]+)(?:: [^=]+)? = (new (?:Map|Set)\b|\[\])/gm;
  const names = []; let m;
  while ((m = re.exec(s))) names.push(m[1]);
  const uniq = [...new Set(names)];
  const entries = uniq.map((n) => `['${n}', () => ${n}]`).join(',\n        ');
  const hook = `(window as any).__leakDump = { dump: () => {
      const regs: Array<[string, () => any]> = [
        ${entries}
      ];
      const sizes: Record<string, number[]> = {};
      for (const [n, get] of regs) {
        try {
          const v: any = get();
          if (v instanceof Map) { let deep = 0; for (const x of v.values()) { if (Array.isArray(x)) deep += x.length; else if (x instanceof Map || x instanceof Set) deep += x.size; } sizes[n] = [v.size, deep]; }
          else if (v instanceof Set) sizes[n] = [v.size, 0];
          else if (Array.isArray(v)) sizes[n] = [v.length, 0];
        } catch (e) { /* TDZ */ }
      }
      return { turn, units: units.length, cities: cities.length, sizes, phase: (window as any).__phaseT };
    } };
    `;
  const marker = '(window as any).__aiBuildingsTestDebug = {';
  if (s.split(marker).length < 2) throw new Error('marker');
  s = s.replace(marker, () => hook + marker);
  // FALA 587: this measurement presses F after starting a game, so configure
  // the approved test option through the real doStartGame params. Expose the
  // resulting closure state only in this disposable measurement copy so each
  // runner can assert that the option reached doStartGame before measuring.
  const gameHook = '(window as any).__aiBuildingsTestDebug = {';
  const hookAt = s.indexOf(gameHook);
  const callAt = s.indexOf('void doStartGame({', hookAt);
  const callEnd = s.indexOf('} as NewGameParams);', callAt);
  if (hookAt < 0 || callAt < 0 || callEnd < 0) throw new Error('doStartGame measurement hook markers');
  const gameParams = s.slice(callAt, callEnd);
  const alreadyConfigured = gameParams.includes('fogRevealKeyFEnabled: true,');
  if (!alreadyConfigured) {
    const advancedCount = gameParams.split('advanced,').length - 1;
    if (advancedCount !== 1) throw new Error('expected one advanced param in measurement hook, found ' + advancedCount);
    s = s.slice(0, callAt) + gameParams.replace('advanced,', 'fogRevealKeyFEnabled: true,\n          advanced,') + s.slice(callEnd);
  }
  const stateHook = 'startNewGame: (opts: { rivals?: string; cityStates?: number; civTypes?: number; seed?: number; mapSize?: string; typSwiata?: string }): void => {';
  if (!s.includes('fogRevealKeyFEnabled: () => fogRevealKeyFEnabled')) {
    if (s.split(stateHook).length !== 2) throw new Error('startNewGame state hook marker');
    s = s.replace(stateHook, 'fogRevealKeyFEnabled: () => fogRevealKeyFEnabled,\n      isFogFullOff: () => !fogOn,\n      setFogRevealKeyFEnabledForTest: (enabled: boolean) => { fogRevealKeyFEnabled = enabled; },\n      ' + stateHook);
  }
  // 2) liczniki faz AI
  const imp = "import { decideAITurn, chooseAIResearch, decideAIDiplomacy,";
  if (s.split(imp).length !== 2) throw new Error('import marker');
  const idx = s.indexOf(imp); const lineEnd = s.indexOf('\n', idx);
  s = s.slice(0, lineEnd + 1)
    + "const __phaseT: any = ((window as any).__phaseT = { ai: 0, dip: 0, aiN: 0, dipN: 0 });\n"
    + "function __tmW(k: 'ai' | 'dip', fn: any, ...a: any[]): any { const t0 = performance.now(); try { return fn(...a); } finally { __phaseT[k] += performance.now() - t0; __phaseT[k + 'N']++; } }\n"
    + s.slice(lineEnd + 1);
  const c1 = s.split('commands = decideAITurn(').length - 1;
  const c2 = s.split('decideAIDiplomacy(\n').length - 1;
  if (c1 !== 1) throw new Error('decideAITurn call count ' + c1);
  s = s.replace('commands = decideAITurn(', () => "commands = __tmW('ai', decideAITurn, ");
  const dipRe = /(= )decideAIDiplomacy\(/;
  if (!dipRe.test(s)) throw new Error('decideAIDiplomacy call');
  s = s.replace(dipRe, (a, b) => b + "__tmW('dip', decideAIDiplomacy, ");
  fs.writeFileSync(file, s);
  console.log('zapatchowano', file, 'kolekcji:', uniq.length, 'dipCalls:', c2);
}
if (process.argv.includes('--prepare')) { prepare(arg('prepare')); process.exit(0); }
if (!process.argv.includes('--run')) { console.error('usage: see header'); process.exit(2); }

const PW = arg('pw'); const DIST = arg('dist'); const OUTD = arg('out');
const TYP = arg('typ', 'kontynenty'); const SEED = Number(arg('seed', '4242'));
const TURNS = Number(arg('turns', '100')); const SIZE = arg('size', 'Standardowy');
const CPUPROF = new Set(String(arg('cpuprof', '10,40,70,95')).split(',').filter(Boolean).map(Number));
const PREFLIGHT_ONLY = process.argv.includes('--preflight-only');
const FALLBACK_CHROME = '/usr/bin/chromium';
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
      && !!window.__aiBuildingsTestDebug && !!window.__leakDump, undefined, { timeout: 180000 });
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
    let stuck = 0;
    while (turn < TURNS) {
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
        if (++stuck > 6) throw new Error('tura nie przechodzi: ' + JSON.stringify(r));
        await page.keyboard.press('Escape').catch(() => {});
        await page.evaluate(() => {
          const re = /^(OK|Zamknij|Wróć|Rozumiem|Kontynuuj|Pomiń|Zamknij kartę|Wróć na mapę)$/i;
          for (const b of [...document.querySelectorAll('button')].filter((x) => x.offsetParent !== null && re.test(x.innerText.trim())).slice(0, 3)) b.click();
        });
        await wait(300); continue;
      }
      stuck = 0; turn = r.turn1;
      const full = turn % 5 === 0 || turn === 1;
      const s = await snap(full);
      const aiMs = Math.round(s.phase.ai - lastPhase.ai); const dipMs = Math.round(s.phase.dip - lastPhase.dip); lastPhase = { ai: s.phase.ai, dip: s.phase.dip };
      emit({ ev: 'turn', ...s, ms: Math.round(r.ms), aiMs, dipMs });
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
