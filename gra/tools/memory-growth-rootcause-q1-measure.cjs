'use strict';
/**
 * memory-growth-rootcause-q1-measure.cjs -- R-WEB-MEMORY-GROWTH-ROOTCAUSE-Q1: ATRYBUCJA pamieci w dlugiej grze
 * (realny bundle vite, headless Chromium, `?civTest=1`, mgla OFF, gracz konczy tury bez ruchow -- jak
 * longrun-100-turns-leak-q1-measure.cjs). Zero zmian w repo: wszystko w KOPII `gra/` poza repo.
 *
 *  1) node tools/memory-growth-rootcause-q1-measure.cjs --prepare <kopia-gra>
 *     = longrun --prepare (startNewGame z mapSize/typSwiata, __leakDump, __phaseT) + hak window.__memProbe:
 *       stats()  -- renderer.info, przeglad sceny (obiekty/meshe/unikalne geometrie+materialy+tekstury, bajty
 *                   atrybutow geometrii, rozbicie po grupach: improvementMeshes / reszta wg nazwy dziecka sceny),
 *                   canvasy DOM, rozmiar zapisu gry (JSON) per klucz top-level.
 *  2) (w kopii) node ./node_modules/vite/bin/vite.js build --minify false --outDir <poza repo>/dist --emptyOutDir
 *  3) node tools/memory-growth-rootcause-q1-measure.cjs --run --pw <kopia z node_modules/playwright> --dist <dist>
 *        --out <katalog> --seed 4242 [--turns 100] [--probe 1,30,60,100] [--snap 60,100] [--snapdir /tmp/civ-heap-q1]
 *     Co 5 tur: heap po GC (performance.memory + CDP Runtime.getHeapUsage), DOM counters (CDP Memory.getDOMCounters).
 *     W turach --probe: __memProbe.stats() + profil probkowania sterty (HeapProfiler.getSamplingProfile, start przed
 *     startNewGame -> zywe obiekty wg miejsca alokacji) zapisany jako <out>/seed<S>-t<N>.heapprof.json.
 *     W turach --snap: pelna migawka sterty -> <snapdir>/seed<S>-t<N>.heapsnapshot (analiza:
 *     memory-growth-heapsnap-summary.cjs; migawek NIE trzymac w repo).
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
  cp.execFileSync('node', [path.join(__dirname, 'longrun-100-turns-leak-q1-measure.cjs'), '--prepare', root], { stdio: 'inherit' });
  const file = path.join(root, 'src', 'main.ts');
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('__memProbe')) { console.log('memProbe juz jest'); return; }
  const hook = `(window as any).__memProbe = { stats: () => {
      const out: any = { turn };
      try { out.rinfo = { geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, programs: (renderer.info.programs || []).length, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }; } catch (e) { out.rinfo = String(e); }
      const impSet = new Set<any>(improvementMeshes.values());
      const vilSet = new Set<any>([...villageMeshes.values(), ...campMeshes.values()]);
      const clrSet = new Set<any>(clearingMeshes.values());
      const geoSeen = new Set<any>(); const matSeen = new Set<any>(); const texSeen = new Set<any>();
      const geoOwner = new Map<any, string>();
      const groups: Record<string, { roots: number; objects: number; meshes: number; instanced: number; sprites: number; geoUniq: number; geoBytes: number; matUniq: number; texUniq: number; texBytes: number; instances: number }> = {};
      const g0 = () => ({ roots: 0, objects: 0, meshes: 0, instanced: 0, sprites: 0, geoUniq: 0, geoBytes: 0, matUniq: 0, texUniq: 0, texBytes: 0, instances: 0 });
      const geoBytesOf = (geo: any): number => { let b = 0; const at = geo.attributes || {}; for (const k in at) { const a = at[k]; const arr = a && (a.array || (a.data && a.data.array)); if (arr && arr.byteLength) b += arr.byteLength; } if (geo.index && geo.index.array) b += geo.index.array.byteLength; return b; };
      const texBytesOf = (t: any): number => { const im = t && (t.image || (t.source && t.source.data)); if (!im) return 0; const w = im.width || 0; const h = im.height || 0; const d = im.depth || 1; return w * h * d * 4; };
      for (const child of scene.children) {
        const ud: any = child.userData || {};
        const gk = impSet.has(child) ? 'improvementMeshes' : vilSet.has(child) ? 'village/camp' : clrSet.has(child) ? 'clearingMeshes'
          : ud.unitId !== undefined ? 'unit' : ud.cityId !== undefined ? 'city' : (child.name || (Object.keys(ud)[0] ? child.type + ':' + Object.keys(ud)[0] : child.type) || '?');
        const G = (groups[gk] ||= g0()); G.roots++;
        child.traverse((o: any) => {
          G.objects++;
          if (o.isInstancedMesh) { G.instanced++; G.instances += o.count || 0; if (o.instanceMatrix && o.instanceMatrix.array) G.geoBytes += o.instanceMatrix.array.byteLength; if (o.instanceColor && o.instanceColor.array) G.geoBytes += o.instanceColor.array.byteLength; } else if (o.isMesh) G.meshes++;
          if (o.isSprite) G.sprites++;
          const geo = o.geometry; if (geo && !geoSeen.has(geo)) { geoSeen.add(geo); geoOwner.set(geo, gk); G.geoUniq++; G.geoBytes += geoBytesOf(geo); }
          const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
          for (const m of mats) { if (matSeen.has(m)) continue; matSeen.add(m); G.matUniq++;
            for (const k in m) { const t = (m as any)[k]; if (t && t.isTexture && !texSeen.has(t)) { texSeen.add(t); G.texUniq++; G.texBytes += texBytesOf(t); } } }
        });
      }
      out.groups = groups; out.geoUniq = geoSeen.size; out.matUniq = matSeen.size; out.texUniq = texSeen.size;
      let canv = 0; let canvBytes = 0; for (const c of Array.from(document.querySelectorAll('canvas')) as HTMLCanvasElement[]) { canv++; canvBytes += c.width * c.height * 4; }
      out.domCanvas = { n: canv, bytes: canvBytes };
      try {
        const sv: any = buildSaveGameSnapshot('memprobe');
        const per: Record<string, number> = {}; let tot = 0;
        for (const k of Object.keys(sv)) { const n = JSON.stringify(sv[k] ?? null).length; per[k] = n; tot += n; }
        out.save = { total: tot, per };
      } catch (e) { out.save = String(e); }
      try { const ur: any = unitRenderer; const cr: any = cityRenderer; out.rendererMaps = {}; for (const [nm, obj] of [['unit', ur], ['city', cr], ['wonder', wonderRenderer as any], ['siege', siegeMarkerRenderer as any]] as Array<[string, any]>) for (const k of Object.keys(obj)) { const v = obj[k]; if (v instanceof Map || v instanceof Set) out.rendererMaps[nm + '.' + k] = v.size; else if (Array.isArray(v)) out.rendererMaps[nm + '.' + k] = v.length; } } catch (e) { out.rendererMaps = String(e); }
      out.units = units.length; out.cities = cities.length; out.improvementMeshes = improvementMeshes.size;
      return out;
    } };
    `;
  const marker = '(window as any).__aiBuildingsTestDebug = {';
  if (s.split(marker).length !== 2) throw new Error('marker');
  s = s.replace(marker, () => hook + marker);
  fs.writeFileSync(file, s);
  console.log('memProbe dodany', file);
}
if (process.argv.includes('--prepare')) { prepare(arg('prepare')); process.exit(0); }
if (!process.argv.includes('--run')) { console.error('usage: see header'); process.exit(2); }

const PW = arg('pw'); const DIST = arg('dist'); const OUTD = arg('out');
const TYP = arg('typ', 'kontynenty'); const SEED = Number(arg('seed', '4242'));
const TURNS = Number(arg('turns', '100')); const SIZE = arg('size', 'Standardowy');
const list = (v) => new Set(String(v).split(',').filter(Boolean).map(Number));
const PROBE = list(arg('probe', '1,30,60,100')); const SNAP = list(arg('snap', '60,100'));
const SNAPDIR = arg('snapdir', '/tmp/civ-heap-q1');
const FALLBACK_CHROME = '/usr/bin/chromium';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(OUTD, `seed${SEED}.jsonl`);
const emit = (o) => fs.appendFileSync(OUT, JSON.stringify(o) + '\n');

async function pollUntil(page, fn, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs; let last = null;
  while (Date.now() < deadline) { last = await page.evaluate(fn); if (last && last.ready) return last; await wait(500); }
  throw new Error(`pollUntil(${what}) timeout, last=` + JSON.stringify(last));
}

async function heapSnapshot(client, file) {
  const fd = fs.openSync(file, 'w');
  const onChunk = (p) => fs.writeSync(fd, p.chunk);
  client.on('HeapProfiler.addHeapSnapshotChunk', onChunk);
  await client.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false, captureNumericValue: false });
  client.off('HeapProfiler.addHeapSnapshotChunk', onChunk);
  fs.closeSync(fd);
}

async function main() {
  fs.mkdirSync(OUTD, { recursive: true }); fs.mkdirSync(SNAPDIR, { recursive: true });
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
    }, (0x9e3779b9 ^ SEED) | 0);
    await client.send('HeapProfiler.enable');
    server = await serveDist(DIST);
    await page.goto(server.url + '?civTest=1', { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug
      && !!window.__aiBuildingsTestDebug && !!window.__leakDump && !!window.__memProbe, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await client.send('HeapProfiler.startSampling', { samplingInterval: 65536 });
    emit({ ev: 'start', seed: SEED, typ: TYP, size: SIZE, at: new Date().toISOString() });
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
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    await page.keyboard.press('f'); await wait(800);
    emit({ ev: 'world-ready', at: new Date().toISOString() });

    const measure = async (turn) => {
      const o = await page.evaluate(async () => {
        const d = window.__leakDump.dump();
        if (window.gc) { window.gc(); window.gc(); await new Promise((r) => setTimeout(r, 50)); }
        return { turn: d.turn, units: d.units, cities: d.cities, sizes: d.sizes, heapGC: performance.memory.usedJSHeapSize, totalJS: performance.memory.totalJSHeapSize, dom: document.getElementsByTagName('*').length };
      });
      try { o.cdpHeap = await client.send('Runtime.getHeapUsage'); } catch (e) { o.cdpHeap = String(e); }
      try { o.domCounters = await client.send('Memory.getDOMCounters'); } catch (e) { o.domCounters = String(e); }
      if (PROBE.has(turn)) {
        o.probe = await page.evaluate(() => window.__memProbe.stats());
        const { profile } = await client.send('HeapProfiler.getSamplingProfile');
        fs.writeFileSync(path.join(OUTD, `seed${SEED}-t${turn}.heapprof.json`), JSON.stringify(profile));
      }
      if (SNAP.has(turn)) {
        const f = path.join(SNAPDIR, `seed${SEED}-t${turn}.heapsnapshot`);
        const t0 = Date.now(); await heapSnapshot(client, f); o.snapFile = f; o.snapMs = Date.now() - t0;
      }
      o.load = require('os').loadavg();
      return o;
    };

    let turn = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    emit({ ev: 'snap', ...(await measure(1)) });
    let stuck = 0;
    while (turn < TURNS) {
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
      if (turn % 5 === 0 || PROBE.has(turn) || SNAP.has(turn)) emit({ ev: 'turn', ms: Math.round(r.ms), ...(await measure(turn)) });
      if (turn % 10 === 0) console.log(new Date().toISOString().slice(11, 19), 'seed', SEED, 'T' + turn, 'ms', Math.round(r.ms));
    }
    emit({ ev: 'done' }); fs.writeFileSync(path.join(OUTD, `seed${SEED}.DONE`), 'ok\n'); console.log('DONE');
  } catch (e) {
    emit({ ev: 'error', err: String((e && e.stack) || e).slice(0, 800) });
    fs.writeFileSync(path.join(OUTD, `seed${SEED}.DONE`), 'ERROR\n'); console.log('ERROR', String(e).slice(0, 300));
  } finally { await browser.close().catch(() => {}); if (server) await server.close().catch(() => {}); }
}
main().then(() => process.exit(0));
