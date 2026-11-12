'use strict';
/**
 * measure-siege-fallback-vs-skip-auto.cjs -- R-WEB-SIEGE-FALLBACK-LOSS-MEASURE-Q1 (POMIAR, tylko odczyt).
 *
 * Mierzy, czy sciezki zakonczenia bitwy oblezenia daja inne straty i zwyciezce:
 *   fallback -- wymuszona sciezka awaryjna _skipInstantFallback (deployPhase=false, started=false, skip());
 *   skip     -- skip() w fazie rozstawiania (przewijanie _runFastForward);
 *   auto     -- _endDeployPhase() + AUTO 1x, rozstrzygniecie wylacznie przez silnik.
 * Scenariusze: breach (oblezenie z machinami, wylom mozliwy) i nobreach (&bare=1, bez machin, bez wylomu).
 *
 * Zrodlo: ta sama logika co gra/tools/battle-skip-siege-parity-live-test.cjs (affa09bd5), skopiowana
 * i rozszerzona o scenariusze, ponowne proby startu Chromium i tabele wynikow. ZERO zmian gra/src.
 *
 * Env:
 *   MSF_SEEDS      (domyslnie "1,2,3")            ziarna Math.random
 *   MSF_SCENARIOS  (domyslnie "breach,nobreach")
 *   MSF_MODES      (domyslnie "fallback,skip,auto")
 *   MSF_OUT        plik JSON-lines (dopisywany; wznawialny: pominie pary juz zapisane)
 *   MSF_DIST       gotowy build (pomija vite build); bez tego build do katalogu tymczasowego poza repo
 *   MSF_TIMEOUT_S  limit czasu jednego przebiegu (domyslnie 540)
 *   MSF_TABLE=1    tylko tabela z MSF_OUT (bez Chromium)
 *   MSF_CHROMIUM   sciezka Chromium (domyslnie /usr/bin/chromium)
 *   MSF_LAUNCH_TRIES  proby startu przegladarki (domyslnie 4)
 * Brak Chromium / playwright lub brak startu po probach -> NIE_ZMIERZONO (exit 2).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const CHROME = process.env.MSF_CHROMIUM || '/usr/bin/chromium';
const OUT = process.env.MSF_OUT || '';

function readRows(file) {
  if (!file || !fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

function fmtSide(s) {
  return s ? `${s.lost}/${s.remaining}/${s.hp}` : '-';
}

function printTable() {
  const rows = readRows(OUT);
  const modes = ['fallback', 'skip', 'auto'];
  const keys = [...new Set(rows.map((r) => r.scenario + '|' + r.seed))];
  console.log('scenariusz | ziarno | tryb | zwyciezca | tura | wylom | atk strat/zywi/HP | def strat/zywi/HP | status');
  for (const k of keys) {
    const [sc, sd] = k.split('|');
    for (const m of modes) {
      const r = rows.filter((x) => x.scenario === sc && String(x.seed) === sd && x.mode === m).pop();
      if (!r) { console.log(`${sc} | ${sd} | ${m} | - | - | - | - | - | NIE_ZMIERZONO (brak przebiegu)`); continue; }
      if (r.timeout) { console.log(`${sc} | ${sd} | ${m} | - | r${r.round} | - | - | - | NIE_ZMIERZONO (limit czasu, vNow ${r.vNow} ms)`); continue; }
      if (r.error) { console.log(`${sc} | ${sd} | ${m} | - | - | - | - | - | NIE_ZMIERZONO (${r.error})`); continue; }
      console.log(`${sc} | ${sd} | ${m} | ${r.winner} | ${r.round} | ${r.breached ? 'tak' : 'nie'} | ${fmtSide(r.atk)} | ${fmtSide(r.def)} | OK`);
    }
  }
}

function buildVite() {
  if (process.env.MSF_DIST) return process.env.MSF_DIST;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-msf-'));
  const root = path.join(tmp, 'root');
  fs.mkdirSync(root, { recursive: true });
  for (const f of ['index.html', 'vite.config.ts', 'tsconfig.json', 'package.json']) {
    fs.copyFileSync(path.join(GRA, f), path.join(root, f));
  }
  for (const d of ['data', 'node_modules']) {
    fs.symlinkSync(fs.realpathSync(path.join(GRA, d)), path.join(root, d), 'dir');
  }
  fs.cpSync(path.join(GRA, 'src'), path.join(root, 'src'), { recursive: true });
  const outDir = path.join(tmp, 'dist');
  execSync(
    `node ${JSON.stringify(path.join(GRA, 'node_modules/vite/bin/vite.js'))} build`
    + ` --outDir ${JSON.stringify(outDir)} --emptyOutDir`,
    { cwd: root, stdio: 'pipe', maxBuffer: 128 * 1024 * 1024 },
  );
  if (!fs.existsSync(path.join(outDir, 'index.html'))) throw new Error('brak index.html po vite build');
  return outDir;
}

// Zegar deterministyczny (ten sam co battle-skip-siege-parity-live-test.cjs).
function initDet(seed) {
  let s = seed >>> 0;
  Math.random = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  window.__fakeNow = 1000;
  window.__rafQ = [];
  window.requestAnimationFrame = (cb) => { window.__rafQ.push(cb); return window.__rafQ.length; };
  window.cancelAnimationFrame = () => {};
  performance.now = () => { window.__fakeNow += 0.01; return window.__fakeNow; };
  window.__framesRun = 0;
  window.__pumpFrames = (n) => {
    const bs = window.__lastBattleScene;
    for (let i = 0; i < n && !(bs && bs.finished); i++) {
      window.__framesRun++;
      const q = window.__rafQ; window.__rafQ = [];
      window.__fakeNow += window.__dt || 16;
      for (const cb of q) cb(window.__fakeNow);
    }
    return !!(bs && bs.finished);
  };
}

async function launchBrowser(chromium) {
  const tries = parseInt(process.env.MSF_LAUNCH_TRIES || '4', 10);
  let lastErr = null;
  for (let i = 0; i < tries; i++) {
    try {
      return await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'], timeout: 90000 });
    } catch (e) {
      lastErr = e;
      console.log(`start Chromium proba ${i + 1}/${tries} nieudana: ${String(e.message).split('\n')[0]}`);
    }
  }
  throw lastErr;
}

async function runOne(browser, baseUrl, scenario, mode, seed) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(initDet, seed);
  const query = scenario === 'nobreach' ? '&bare=1' : '';
  await page.goto(baseUrl + '?playtest=oblezenie-duze' + query, { waitUntil: 'load', timeout: 120000 });
  for (let i = 0; i < 400; i++) {
    const ready = await page.evaluate(() => { window.__pumpFrames(5); return !!window.__lastBattleScene; });
    if (ready) break;
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => { if (!window.__lastBattleScene) throw new Error('brak sceny bitwy po pompowaniu klatek'); });
  await page.evaluate((m) => {
    const bs = window.__lastBattleScene;
    bs.renderer.render = () => {};
    window.__dt = 16;
    window.__wskipT0 = bs.vNow;
    bs._setSpeedIdx(0, { clamp: true });
    if (m === 'skip') {
      bs.skip();
    } else if (m === 'fallback') {
      bs.deployPhase = false;
      bs.started = false;
      bs.skip();
    } else {
      if (bs.deployPhase) bs._endDeployPhase();
      if (bs._manualMode) bs._toggleManualMode();
    }
  }, mode);
  const limitMs = parseInt(process.env.MSF_TIMEOUT_S || '540', 10) * 1000;
  const t0w = Date.now();
  let fin = false;
  while (!fin) {
    fin = await page.evaluate(() => window.__pumpFrames(200));
    if (!fin && Date.now() - t0w > limitMs) {
      const st = await page.evaluate(() => { const bs = window.__lastBattleScene; return { round: bs.roundNo, vNow: Math.round(bs.vNow - window.__wskipT0) }; });
      await page.close();
      return { scenario, mode, seed, timeout: true, ...st };
    }
  }
  const res = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    const sa = bs._sideEndStats('atk');
    const sd = bs._sideEndStats('def');
    return {
      winner: bs._endWinner, round: bs.roundNo, vNow: Math.round(bs.vNow - window.__wskipT0),
      breached: !!bs.wallEverBreached,
      atk: { total: sa.total, lost: sa.lost, remaining: sa.remaining, hp: Math.round(sa.hp) },
      def: { total: sd.total, lost: sd.lost, remaining: sd.remaining, hp: Math.round(sd.hp) },
      endLine: bs.log.find((l) => /PAT|SZTURM/.test(l)) || null,
    };
  });
  await page.close();
  return { scenario, mode, seed, timeout: false, errors, ...res };
}

async function main() {
  if (process.env.MSF_TABLE === '1') { printTable(); process.exit(0); }
  let chromium;
  try { ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright'))); }
  catch (e) { console.log('NIE_ZMIERZONO: brak playwright (' + String(e.message).split('\n')[0] + ')'); process.exit(2); }
  if (!fs.existsSync(CHROME)) { console.log('NIE_ZMIERZONO: brak Chromium ' + CHROME); process.exit(2); }

  const seeds = (process.env.MSF_SEEDS || '1,2,3').split(',').map((x) => parseInt(x, 10));
  const scenarios = (process.env.MSF_SCENARIOS || 'breach,nobreach').split(',');
  const modes = (process.env.MSF_MODES || 'fallback,skip,auto').split(',');
  const done = new Set(readRows(OUT).filter((r) => !r.timeout && !r.error).map((r) => `${r.scenario}|${r.seed}|${r.mode}`));

  const distDir = buildVite();
  console.log('DIST: ' + distDir);
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.resolve(distDir, rel);
    if (!file.startsWith(path.resolve(distDir) + path.sep) && file !== path.join(path.resolve(distDir), 'index.html')) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, data) => { if (err) { res.writeHead(404).end(); return; } res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' }); res.end(data); });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/`;

  let browser;
  try {
    browser = await launchBrowser(chromium);
  } catch (e) {
    console.log('NIE_ZMIERZONO: Chromium nie startuje (' + String(e.message).split('\n')[0] + ')');
    server.close();
    process.exit(2);
  }
  for (const scenario of scenarios) {
    for (const seed of seeds) {
      for (const mode of modes) {
        if (done.has(`${scenario}|${seed}|${mode}`)) { console.log('POMIJAM (zapisane): ' + scenario + ' ' + seed + ' ' + mode); continue; }
        let r;
        try {
          r = await runOne(browser, baseUrl, scenario, mode, seed);
        } catch (e) {
          r = { scenario, mode, seed, timeout: false, error: String(e.message).split('\n')[0].slice(0, 200) };
        }
        console.log('RUN ' + JSON.stringify(r));
        if (OUT) fs.appendFileSync(OUT, JSON.stringify(r) + '\n', 'utf8');
      }
    }
  }
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  printTable();
  process.exit(0);
}

main().catch((e) => { console.log('NIE_ZMIERZONO: wyjatek: ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); process.exit(2); });
