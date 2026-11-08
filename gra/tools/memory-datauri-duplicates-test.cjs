'use strict';
/**
 * memory-datauri-duplicates-test.cjs — R-WEB-MEMORY-DATA-URI-DUPLICATES-Q1.
 *
 * Bramka dla wtyczki `civ-binary-assets-out-of-js` (gra/vite.config.ts): bajty mp3/png/jpg NIE są w bundlu JS
 * jako literały `data:…;base64`, tylko w nieuruchamianych `<script type="application/octet-stream">` przed
 * bundlem; przy starcie dekodowane raz do Blob (blob: URL), element usuwany z DOM.
 *
 *   node tools/memory-datauri-duplicates-test.cjs --dist <katalog z index.html> [--json <wynik.json>]
 *        [--snapdir /tmp/civ-mem3-heap] [--no-snap]
 *
 * Zbuduj wcześniej POZA repo: `node node_modules/vite/bin/vite.js build --outDir /tmp/civ-mem3-xxx --emptyOutDir`
 * (zakaz `npm run build` w gra/).
 *
 * A (statycznie, HTML): 0 literałów data:audio|image/png|image/jpeg;base64 w skryptach wykonywalnych; każdy
 *   element danych leży przed bundlem; zdekodowane bajty każdego elementu = SHA-256 pliku źródłowego z gra/src
 *   (bez przekodowania); każdy plik mp3 z src/audio/utwory, hero png i portret jpg ma swój element.
 * B (Chromium headless, menu główne): brak błędów konsoli/strony; 0 elementów danych w DOM po starcie;
 *   każdy blob: URL z URL.createObjectURL ma bajty = SHA-256 pliku źródłowego i właściwy typ MIME;
 *   każde audio: HTMLAudioElement `loadedmetadata` (czas trwania) + `decodeAudioData` (długość, kanały)
 *   bez błędów; każdy obraz: hash pikseli z blob: URL == hash pikseli z data: URI tych samych bajtów
 *   (ścieżka sprzed zmiany); obraz menu (`.civ-menu img`) wczytany z blob:.
 * C (migawka sterty po GC w menu): liczba i suma stringów > 1 MB oraz > 100 KB, z rozbiciem: wyglądające na
 *   base64 (bez spacji, alfabet base64) vs reszta (źródło skryptu). Wymóg: 0 stringów base64 > 1 MB.
 *   Do tego heap po GC (performance.memory) i PSS procesów przeglądarki (/proc, informacyjnie).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const DIST = arg('dist');
if (!DIST) { console.error('usage: --dist <dir> [--json out] [--snapdir dir] [--no-snap]'); process.exit(2); }
const OUT_JSON = arg('json');
const SNAPDIR = arg('snapdir', '/tmp/civ-mem3-heap');
const NO_SNAP = process.argv.includes('--no-snap');
const HTML = path.join(path.resolve(DIST), 'index.html');
const GRA = path.resolve(__dirname, '..');
const CHROME = '/opt/pw-browsers/chromium';

const results = [];
let failed = 0;
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  if (!ok) failed++;
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail !== undefined ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''));
}
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

function walk(dir, re, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, re, out); else if (re.test(e.name)) out.push(p);
  }
  return out;
}

// --- źródła: oczekiwane zasoby (te, które build osadzał wcześniej jako data URI)
const srcFiles = [
  // `_wykluczone/` nie jest objęte żadnym import.meta.glob (nie trafia do buildu).
  ...walk(path.join(GRA, 'src', 'audio', 'utwory'), /\.mp3$/i).filter((f) => !f.split(path.sep).includes('_wykluczone')),
  ...walk(path.join(GRA, 'src', 'ui', 'assets', 'hero'), /\.png$/i),
  ...walk(path.join(GRA, 'src', 'assets', 'portrety'), /\.jpe?g$/i),
];
const srcByHash = new Map();
for (const f of srcFiles) {
  const h = sha(fs.readFileSync(f));
  if (!srcByHash.has(h)) srcByHash.set(h, []);
  srcByHash.get(h).push(path.relative(GRA, f));
}

// --- A: statycznie
const html = fs.readFileSync(HTML, 'latin1');
const scripts = [];
{
  const re = /<script\b([^>]*)>/gi; let m;
  while ((m = re.exec(html))) {
    const end = html.indexOf('</script', re.lastIndex);
    scripts.push({ attrs: m[1], start: m.index, bodyStart: re.lastIndex, bodyEnd: end });
    re.lastIndex = end;
  }
}
const dataEls = scripts.filter((s) => /type="application\/octet-stream"/.test(s.attrs));
const execEls = scripts.filter((s) => !/type="application\/octet-stream"/.test(s.attrs));
const mainBundle = execEls.reduce((a, b) => ((b.bodyEnd - b.bodyStart) > (a.bodyEnd - a.bodyStart) ? b : a));
let literalHits = 0; let literalBytes = 0;
for (const s of execEls) {
  const body = html.slice(s.bodyStart, s.bodyEnd);
  const re = /data:(audio\/mpeg|image\/png|image\/jpeg);base64,[A-Za-z0-9+/=]*/g; let m;
  while ((m = re.exec(body))) { literalHits++; literalBytes += m[0].length; }
}
check('A1 brak literałów data:(audio|png|jpeg);base64 w skryptach wykonywalnych', literalHits === 0, { literalHits, literalBytes });
check('A2 elementy danych przed bundlem', dataEls.length > 0 && dataEls.every((s) => s.start < mainBundle.start),
  { dataEls: dataEls.length, mainBundleAt: mainBundle.start, mainBundleChars: mainBundle.bodyEnd - mainBundle.bodyStart });
const elHashes = new Map();
let badDecode = 0; let unknown = []; let dataChars = 0;
for (const s of dataEls) {
  const id = /id="([^"]+)"/.exec(s.attrs)[1];
  const mime = (/data-mime="([^"]+)"/.exec(s.attrs) || [])[1];
  const b64 = html.slice(s.bodyStart, s.bodyEnd);
  dataChars += b64.length;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) { badDecode++; continue; }
  const h = sha(Buffer.from(b64, 'base64'));
  elHashes.set(id, { h, mime });
  if (!srcByHash.has(h)) unknown.push(id);
}
check('A3 bajty każdego elementu = plik źródłowy (SHA-256, bez przekodowania)', badDecode === 0 && unknown.length === 0,
  { badDecode, unknown, dataChars });
const covered = new Set([...elHashes.values()].map((v) => v.h));
const missing = [...srcByHash.entries()].filter(([h]) => !covered.has(h)).map(([, f]) => f[0]);
check('A4 każdy zasób źródłowy (unikalna treść) ma element', missing.length === 0,
  { srcFiles: srcFiles.length, uniqueContents: srcByHash.size, elements: dataEls.length, missing });
const mimeOk = [...elHashes.values()].every((v) => {
  const f = srcByHash.get(v.h); if (!f) return false;
  const ext = path.extname(f[0]).toLowerCase();
  return v.mime === ({ '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' })[ext];
});
check('A5 MIME elementów zgodny z rozszerzeniem', mimeOk);
{
  // bundel nadal w czystym ASCII (wtyczka ascii-only-js z R-WEB-MEMORY-STATIC-FOOTPRINT-Q1 dalej działa)
  let nonAscii = 0;
  for (let i = mainBundle.bodyStart; i < mainBundle.bodyEnd; i++) if (html.charCodeAt(i) > 0x7f) nonAscii++;
  check('A6 bundel JS wyłącznie ASCII', nonAscii === 0, { nonAscii });
}

function pssOfTree(rootPid) {
  const kids = new Map();
  for (const d of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(d)) continue;
    try {
      const st = fs.readFileSync(`/proc/${d}/stat`, 'utf8');
      const ppid = Number(st.slice(st.lastIndexOf(')') + 2).split(' ')[1]);
      if (!kids.has(ppid)) kids.set(ppid, []);
      kids.get(ppid).push(Number(d));
    } catch (_) { /* proces zniknął */ }
  }
  const all = []; const q = [rootPid];
  while (q.length) { const p = q.pop(); all.push(p); for (const k of kids.get(p) || []) q.push(k); }
  const per = [];
  for (const p of all) {
    try {
      const r = fs.readFileSync(`/proc/${p}/smaps_rollup`, 'utf8');
      const pss = Number((/^Pss:\s+(\d+)/m.exec(r) || [])[1] || 0);
      const cmd = fs.readFileSync(`/proc/${p}/cmdline`, 'utf8');
      const type = (/--type=([a-z-]+)/.exec(cmd) || [])[1] || 'browser';
      per.push({ pid: p, type, pssKB: pss });
    } catch (_) { /* brak */ }
  }
  const byType = {};
  for (const x of per) byType[x.type] = (byType[x.type] || 0) + x.pssKB;
  return { totalMB: +(per.reduce((a, x) => a + x.pssKB, 0) / 1024).toFixed(1), byTypeMB: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, +(v / 1024).toFixed(1)])) };
}

async function heapSnapshotStrings(client, file) {
  const fd = fs.openSync(file, 'w');
  const onChunk = (p) => fs.writeSync(fd, p.chunk);
  client.on('HeapProfiler.addHeapSnapshotChunk', onChunk);
  await client.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false, captureNumericValue: false });
  client.off('HeapProfiler.addHeapSnapshotChunk', onChunk);
  fs.closeSync(fd);
  const snap = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.unlinkSync(file);
  const m = snap.snapshot.meta; const NF = m.node_fields; const types = m.node_types[0];
  const iT = NF.indexOf('type'); const iN = NF.indexOf('name'); const iS = NF.indexOf('self_size');
  const nodes = snap.nodes; const strs = snap.strings; const nfl = NF.length;
  const big = { gt1MB: { n: 0, bytes: 0 }, gt100KB: { n: 0, bytes: 0 }, base64gt1MB: { n: 0, bytes: 0 }, base64gt100KB: { n: 0, bytes: 0 }, list: [] };
  let total = 0;
  for (let i = 0; i < nodes.length; i += nfl) {
    const self = nodes[i + iS]; total += self;
    const t = types[nodes[i + iT]];
    if (t !== 'string' && t !== 'concatenated string' && t !== 'sliced string') continue;
    if (self <= 100 * 1024) continue;
    const name = strs[nodes[i + iN]] || '';
    const head = name.slice(0, 600);
    const isB64 = /^(data:[a-z/+.-]+;base64,)?[A-Za-z0-9+/]{400,}/.test(head);
    big.gt100KB.n++; big.gt100KB.bytes += self;
    if (isB64) { big.base64gt100KB.n++; big.base64gt100KB.bytes += self; }
    if (self > 1024 * 1024) {
      big.gt1MB.n++; big.gt1MB.bytes += self;
      if (isB64) { big.base64gt1MB.n++; big.base64gt1MB.bytes += self; }
      big.list.push({ type: t, MB: +(self / 1048576).toFixed(2), base64: isB64, head: head.slice(0, 48) });
    }
  }
  big.snapshotTotalMB = +(total / 1048576).toFixed(1);
  for (const k of ['gt1MB', 'gt100KB', 'base64gt1MB', 'base64gt100KB']) big[k].MB = +(big[k].bytes / 1048576).toFixed(1);
  return big;
}

async function main() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({
    headless: true, executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    args: ['--no-sandbox', '--headless=new', '--js-flags=--expose-gc', '--autoplay-policy=no-user-gesture-required',
      '--enable-precise-memory-info', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--civ-mem3-tag=' + process.pid],
  });
  const out = { dist: DIST, htmlBytes: fs.statSync(HTML).size, dataEls: dataEls.length, dataChars, mainBundleChars: mainBundle.bodyEnd - mainBundle.bodyStart };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 300)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
    await page.addInitScript(() => {
      const rec = [];
      window.__blobUrlProbe = rec;
      const orig = URL.createObjectURL.bind(URL);
      URL.createObjectURL = function (obj) {
        const u = orig(obj);
        if (obj instanceof Blob) rec.push({ url: u, type: obj.type, size: obj.size });
        return u;
      };
    });
    const t0 = Date.now();
    await page.goto('file://' + HTML, { waitUntil: 'load', timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.waitForTimeout(1500);
    out.menuMs = Date.now() - t0;
    const dom = await page.evaluate(() => {
      const img = document.querySelector('.civ-menu img');
      return {
        dataLeft: document.querySelectorAll('script[type="application/octet-stream"]').length,
        menuImg: img ? { src: img.src.slice(0, 5), natural: [img.naturalWidth, img.naturalHeight], complete: img.complete } : null,
        blobs: window.__blobUrlProbe.slice(),
      };
    });
    check('B1 0 elementów danych w DOM po starcie', dom.dataLeft === 0, { dataLeft: dom.dataLeft });
    check('B2 obraz menu z blob: wczytany', !!dom.menuImg && dom.menuImg.src === 'blob:' && dom.menuImg.natural[0] > 0 && dom.menuImg.complete, dom.menuImg);
    const assetBlobs = dom.blobs.filter((b) => /^(audio\/mpeg|image\/png|image\/jpeg)$/.test(b.type));
    check('B3 liczba blob: URL zasobów = liczba elementów danych', assetBlobs.length === dataEls.length, { blobs: assetBlobs.length, dataEls: dataEls.length, allBlobs: dom.blobs.length });

    // C: pamięć — PRZED sprawdzeniami B4–B6 (te pobierają i dekodują wszystkie bloby, co chwilowo podbija pamięć)
    const client = await page.context().newCDPSession(page);
    await page.evaluate(async () => { for (let i = 0; i < 3; i++) { window.gc(); await new Promise((r) => setTimeout(r, 100)); } });
    out.heapGC_MB = await page.evaluate(() => +(performance.memory.usedJSHeapSize / 1048576).toFixed(1));
    const hu = await client.send('Runtime.getHeapUsage');
    out.cdpHeap_MB = Object.fromEntries(Object.entries(hu).map(([k, v]) => [k, +(v / 1048576).toFixed(1)]));
    try {
      const tag = '--civ-mem3-tag=' + process.pid;
      const root = fs.readdirSync('/proc').filter((d) => /^\d+$/.test(d)).find((d) => {
        try { const c = fs.readFileSync(`/proc/${d}/cmdline`, 'utf8').split('\0'); return c.includes(tag) && !c.some((x) => x.startsWith('--type=')); } catch (_) { return false; }
      });
      out.pss = root ? pssOfTree(Number(root)) : 'brak procesu';
    } catch (e) { out.pss = String(e); }
    if (!NO_SNAP) {
      fs.mkdirSync(SNAPDIR, { recursive: true });
      out.strings = await heapSnapshotStrings(client, path.join(SNAPDIR, 'datauri-menu-' + process.pid + '.heapsnapshot'));
      check('C1 0 stringów base64 > 1 MB na stercie (po GC, menu)', out.strings.base64gt1MB.n === 0,
        { base64gt1MB: out.strings.base64gt1MB, gt1MB: out.strings.gt1MB, base64gt100KB: out.strings.base64gt100KB });
    }
    console.log('MEM', JSON.stringify({ heapGC_MB: out.heapGC_MB, cdpHeap_MB: out.cdpHeap_MB, pss: out.pss, strings: out.strings && { gt1MB: out.strings.gt1MB, base64gt1MB: out.strings.base64gt1MB, snapshotTotalMB: out.strings.snapshotTotalMB } }));

    // bajty + dekodowanie
    const info = await page.evaluate(async (list) => {
      const hex = (buf) => Array.from(new Uint8Array(buf)).map((x) => x.toString(16).padStart(2, '0')).join('');
      const res = [];
      const ac = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, 44100, 44100);
      for (const b of list) {
        const r = { url: b.url, type: b.type, size: b.size };
        try {
          const ab = await (await fetch(b.url)).arrayBuffer();
          r.sha = hex(await crypto.subtle.digest('SHA-256', ab));
          if (b.type === 'audio/mpeg') {
            r.duration = await new Promise((resolve) => {
              const a = new Audio(); let done = false;
              const fin = (v) => { if (!done) { done = true; a.removeAttribute('src'); a.load(); resolve(v); } };
              a.addEventListener('loadedmetadata', () => fin(a.duration));
              a.addEventListener('error', () => fin('error:' + (a.error && a.error.code)));
              setTimeout(() => fin('timeout'), 20000);
              a.preload = 'metadata'; a.src = b.url;
            });
            const buf = await ac.decodeAudioData(ab.slice(0));
            r.decoded = { length: buf.length, channels: buf.numberOfChannels, sampleRate: buf.sampleRate };
          } else {
            const pix = async (src) => {
              const bmp = await createImageBitmap(await (await fetch(src)).blob());
              const c = new OffscreenCanvas(bmp.width, bmp.height); const g = c.getContext('2d');
              g.drawImage(bmp, 0, 0);
              const d = g.getImageData(0, 0, bmp.width, bmp.height).data;
              return { w: bmp.width, h: bmp.height, sha: hex(await crypto.subtle.digest('SHA-256', d)) };
            };
            r.pixBlob = await pix(b.url);
            // ścieżka sprzed zmiany: data: URI z tych samych bajtów
            let bin = ''; const u8 = new Uint8Array(ab);
            for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
            r.pixDataUri = await pix('data:' + b.type + ';base64,' + btoa(bin));
          }
        } catch (e) { r.err = String(e).slice(0, 200); }
        res.push(r);
      }
      return res;
    }, assetBlobs);
    const badBytes = info.filter((r) => !srcByHash.has(r.sha)).map((r) => r.url);
    check('B4 bajty każdego blob: = plik źródłowy (SHA-256)', badBytes.length === 0, { n: info.length, badBytes });
    const audio = info.filter((r) => r.type === 'audio/mpeg');
    const audioBad = audio.filter((r) => r.err || typeof r.duration !== 'number' || !(r.duration > 0) || !r.decoded || !(r.decoded.length > 0));
    const totalSec = audio.reduce((a, r) => a + (typeof r.duration === 'number' ? r.duration : 0), 0);
    check('B5 audio: metadane + decodeAudioData bez błędów', audio.length > 0 && audioBad.length === 0,
      { audio: audio.length, bad: audioBad.map((r) => ({ f: (srcByHash.get(r.sha) || ['?'])[0], d: r.duration, err: r.err })), totalSec: Math.round(totalSec) });
    const img = info.filter((r) => r.type !== 'audio/mpeg');
    const imgBad = img.filter((r) => r.err || !r.pixBlob || !r.pixDataUri || r.pixBlob.sha !== r.pixDataUri.sha || !(r.pixBlob.w > 0));
    check('B6 obrazy: piksele blob: == data: URI (bit w bit)', img.length > 0 && imgBad.length === 0, { images: img.length, bad: imgBad.map((r) => r.err || r.url) });
    out.audio = audio.map((r) => ({ file: (srcByHash.get(r.sha) || ['?'])[0], bytes: r.size, duration: r.duration, decoded: r.decoded }));
    out.images = img.map((r) => ({ file: (srcByHash.get(r.sha) || ['?'])[0], bytes: r.size, w: r.pixBlob && r.pixBlob.w, h: r.pixBlob && r.pixBlob.h, pixSha: r.pixBlob && r.pixBlob.sha.slice(0, 16) }));
    check('B7 brak błędów konsoli/strony', errors.length === 0, errors.slice(0, 5));

  } catch (e) {
    check('RUN bez wyjątku', false, String((e && e.stack) || e).slice(0, 500));
  } finally {
    await browser.close().catch(() => {});
  }
  out.results = results; out.failed = failed;
  if (OUT_JSON) fs.mkdirSync(path.dirname(path.resolve(OUT_JSON)), { recursive: true });
  if (OUT_JSON) fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 1));
  console.log(failed === 0 ? `memory-datauri-duplicates-test: PASS (${results.length} sprawdzeń)` : `memory-datauri-duplicates-test: FAIL (${failed}/${results.length})`);
  process.exit(failed === 0 ? 0 : 1);
}
main();
