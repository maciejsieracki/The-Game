'use strict';
/**
 * mapgen-rivers-seed22-diag-run.cjs — R-WEB-MAPGEN-RIVERS-SEED22-HANG-DIAG-Q1 (read-only diagnostyka).
 *
 * Odtwarza realną ścieżkę nowej gry (hak __nnsMeasureDebug.startGame → doStartGame, ten sam kod co kreator),
 * mierzy czas generacji świata (nakładka „Tworzenie świata” znika + worldReady) i zapisuje checkpoint JSON
 * co 10 s (overlayProgress). Nie zmienia gry; nie gra tur.
 *
 * Profil CPU (CDP, Profiler.*) w zadanych oknach po starcie generacji (--profile-at, sekundy), dla wątku
 * głównego i dla każdego Workera (generator mapy żyje w genWorker). Wynik: top funkcje wg self-samples.
 *
 * Użycie (z gra/; bundle --minify false, poza repo):
 *   node tools/mapgen-rivers-seed22-diag-run.cjs --dist <dist> --out <katalog> --seed 22 \
 *        [--map Standardowy] [--cell-sec 900] [--profile-at 30,240] [--port 9341]
 * Wynik: <out>/mapgen-<map>-<seed>-<tag>.json
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
const SEED = parseInt(arg('seed', '22'), 10);
const MAP = arg('map', 'Standardowy');
const CELL_SEC = parseInt(arg('cell-sec', '900'), 10);
const CIV_TYPES = parseInt(arg('civ-types', '15'), 10);
const CITY_STATES = parseInt(arg('city-states', '2'), 10);
const PORT = parseInt(arg('port', '9341'), 10);
const TAG = arg('tag', 'run1');
const PROFILE_AT = arg('profile-at', '30,240').split(',').filter(Boolean).map(Number);
const PROFILE_WIN_SEC = parseInt(arg('profile-win', '12'), 10);

// Losowość przeglądarki jak w world-overlay-midgame-diag-run.cjs (ten sam seed → ta sama ścieżka UI).
const SEED_INIT = s0 => {
  let s = s0 | 0;
  Math.random = function () {
    s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Init-script: rejestr pojawień się nakładki (czas znikania).
const INIT = `(() => {
  window.__ovSeen = { appeared: 0, lastVisible: null };
  window.__visOv = () => Array.from(document.querySelectorAll('.civ-map-load-overlay')).some(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
})();`;

async function launch(chromium, profileDir) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage',
    '--headless=new', `--remote-debugging-port=${PORT}`];
  const o = { headless: true, args, viewport: { width: 1280, height: 800 } };
  try { return await chromium.launchPersistentContext(profileDir, o); } catch (_) {
    return await chromium.launchPersistentContext(profileDir, { ...o, executablePath: FALLBACK_CHROME });
  }
}

// Minimalny klient CDP (Node 22 ma globalny WebSocket): sesja strony + auto-attach do Workerów.
async function openCdp() {
  const ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let nextId = 1; const pending = new Map(); const handlers = [];
  const workers = []; // {sessionId, type, url}
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); return; }
    if (m.method === 'Target.attachedToTarget') {
      const ti = m.params.targetInfo;
      if (ti.type !== 'page') workers.push({ sessionId: m.params.sessionId, type: ti.type, url: ti.url });
    }
    for (const h of handlers) h(m);
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const id = nextId++; pending.set(id, { res, rej });
    const msg = { id, method, params }; if (sessionId) msg.sessionId = sessionId;
    ws.send(JSON.stringify(msg));
  });
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const pageT = list.find(t => t.type === 'page' && String(t.url).startsWith('file:'));
  if (!pageT) throw new Error('brak targetu strony file:');
  const { sessionId: pageSid } = await send('Target.attachToTarget', { targetId: pageT.id, flatten: true });
  await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, pageSid);
  await send('Profiler.enable', {}, pageSid).catch(() => {});
  return { send, pageSid, workers, close: () => ws.close() };
}

// Profil CPU jednej sesji: zwraca top funkcji wg liczby próbek (self).
async function profileSession(cdp, sid, label) {
  try {
    await cdp.send('Profiler.enable', {}, sid).catch(() => {});
    await cdp.send('Profiler.setSamplingInterval', { interval: 1000 }, sid);
    await cdp.send('Profiler.start', {}, sid);
    await wait(PROFILE_WIN_SEC * 1000);
    const { profile } = await cdp.send('Profiler.stop', {}, sid);
    const byId = new Map(profile.nodes.map(n => [n.id, n]));
    const counts = new Map();
    for (const nid of profile.samples) counts.set(nid, (counts.get(nid) || 0) + 1);
    const agg = new Map();
    for (const [nid, c] of counts) {
      const cf = byId.get(nid).callFrame;
      const key = `${cf.functionName || '(anon)'} @ ${path.basename(cf.url || '') || '?'}:${cf.lineNumber + 1}`;
      agg.set(key, (agg.get(key) || 0) + c);
    }
    const total = profile.samples.length;
    const top = [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
      .map(([k, c]) => ({ fn: k, samples: c, pct: Math.round((1000 * c) / Math.max(1, total)) / 10 }));
    return { label, windowSec: PROFILE_WIN_SEC, totalSamples: total, top };
  } catch (e) {
    return { label, error: String(e).slice(0, 300) };
  }
}

async function main() {
  if (!DIST || !OUT) { console.error('wymagane: --dist <bundle> --out <katalog>'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) { console.error('playwright nie znaleziony (uruchom z gra/).'); process.exit(1); }
  const T0 = Date.now();
  const el = () => Math.round((Date.now() - T0) / 1000);
  const cpFile = path.join(OUT, `mapgen-${MAP}-${SEED}-${TAG}.json`);
  const res = {
    tool: 'mapgen-rivers-seed22-diag-run.cjs', seed: SEED, map: MAP, tag: TAG, civTypes: CIV_TYPES, cityStates: CITY_STATES,
    startedAt: new Date().toISOString(), overlayProgress: [], labelChanges: [], profiles: [], workers: [],
    pageErrors: [], genStartSec: null, worldReadySec: null, overlayGoneSec: null, stopped: null, done: false,
  };
  const save = () => fs.writeFileSync(cpFile, JSON.stringify(res, null, 1));
  const ctx = await launch(chromium, path.join(OUT, `profile-${MAP}-${SEED}-${TAG}`));
  let cdp = null;
  try {
    const page = ctx.pages()[0] || await ctx.newPage();
    page.on('pageerror', e => { if (res.pageErrors.length < 20) res.pageErrors.push(String(e).slice(0, 300)); });
    await page.addInitScript(SEED_INIT, (0x9e3779b9 ^ SEED) | 0);
    await page.addInitScript(INIT);
    page.on('dialog', d => d.dismiss().catch(() => {}));
    const url = 'file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1&civSeed=' + SEED;
    await page.goto(url, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    // Auto-attach MUSI być przed startGame, żeby Worker generatora został złapany.
    cdp = await openCdp();
    await wait(500);
    await page.evaluate(o => window.__nnsMeasureDebug.startGame(o), { seed: SEED, mapSize: MAP, civTypes: CIV_TYPES, cityStates: CITY_STATES });
    res.genStartSec = el();
    await wait(1000);
    res.workers = cdp.workers.map(w => ({ type: w.type, url: String(w.url).slice(0, 120) }));
    save();

    let lastLabel = null; let lastCp = -10; let nextProf = PROFILE_AT.slice();
    const genStart = Date.now();
    const genSec = () => Math.round((Date.now() - genStart) / 1000);
    while (true) {
      const st = await page.evaluate(() => {
        const el = document.querySelector('.civ-map-load-overlay');
        const h = window.__nnsMeasureDebug;
        return {
          vis: window.__visOv(), txt: el ? el.innerText.replace(/\s+/g, ' ').slice(0, 220) : null,
          w: h.worldReady(), aw: h.awaitingFirstCity(),
        };
      });
      const label = st.txt ? st.txt.replace(/^.*?Kontynenty/, 'Kontynenty').replace(/Upłynęło.*$/, '').trim() : null;
      if (label !== lastLabel) { res.labelChanges.push({ sec: genSec(), label, overlay: st.vis }); lastLabel = label; }
      if (genSec() - lastCp >= 10) {
        res.overlayProgress.push({ sec: genSec(), txt: st.txt, w: st.w, aw: st.aw });
        lastCp = genSec(); save();
      }
      if (res.worldReadySec === null && st.w) res.worldReadySec = genSec();
      if (res.overlayGoneSec === null && st.w && !st.vis) { res.overlayGoneSec = genSec(); res.done = true; save(); break; }
      if (nextProf.length && genSec() >= nextProf[0]) {
        nextProf.shift();
        const t = genSec();
        const main = await profileSession(cdp, cdp.pageSid, `main@${t}s`);
        res.profiles.push(main); save();
        for (const w of cdp.workers) {
          const wsid = w.sessionId;
          res.profiles.push(await profileSession(cdp, wsid, `worker:${w.type}@${t}s`)); save();
        }
        continue;
      }
      if (genSec() > CELL_SEC) { res.stopped = `limit ${CELL_SEC} s (nakładka widoczna: ${st.vis}, etykieta: ${label})`; break; }
      await wait(2000);
    }
    if (!res.stopped) res.stopped = 'generacja zakończona (nakładka zniknęła, worldReady)';
    res.finishedAt = new Date().toISOString();
    save();
    console.log(`[mapgen] map=${MAP} seed=${SEED} tag=${TAG}: overlayGone=${res.overlayGoneSec}s worldReady=${res.worldReadySec}s stop=${res.stopped}`);
  } finally {
    if (cdp) cdp.close();
    await ctx.close().catch(() => {});
  }
}

main().catch(e => { console.error('[mapgen] błąd:', e && e.stack || e); process.exit(1); });
