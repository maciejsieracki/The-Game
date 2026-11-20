'use strict';
/**
 * R-WEB-LIVE-VERIFY-OBSERVATIONS-W18-W24-MANUAL-LOSSES-Q1 — runda 2, punkt 3 (straty zwycieskiej strony).
 * Driver RECZNY: prawdziwe zdarzenia wejscia w Chromium, bez wywolan metod bitwy:
 *   - klik myszy w przycisk #deploy-toolbar-start ("Start walki") przez page.click,
 *   - klawisz Spacja (page.keyboard.press 'Space') = "Nastepna tura" w trybie RECZNYM, do konca walki.
 * Tryb AUTO: ten sam preset, przelaczenie na AUTO klawiszem R (page.keyboard.press 'r') zamiast hakow metod,
 * po starcie walki przyciskiem Start walki.
 * Tryb skip: przycisk Pomin (page.click), dla porownania.
 * Presety: ?playtest=bitwa-duza (28 vs 28, Rzym: 10 Hastati + 10 Lucznik + 8 Konnica; Grecja: 10 Falanga + 10 Lucznik + 8 Konnica).
 * Zegar deterministyczny (ten sam seed Math.random), tryb trafien hakiem __civSetHitMode przed startem.
 *
 * Usage (z gra/): node tools/live-verify-w18-w24-manual-losses-r2-manual.cjs <dist-dir> <out.json> [limitSekund]
 * Checkpoint: istniejace wpisy bez bledu w out.json nie sa powtarzane.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const DIST = process.argv[2];
const OUT = process.argv[3];
const LIMIT_S = Number(process.argv[4] || 1500);
if (!DIST || !OUT) throw new Error('usage: node live-verify-w18-w24-manual-losses-r2-manual.cjs <dist-dir> <out.json> [limitSekund]');
const CHROME = process.env.W3_CHROMIUM || (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium');
const { chromium } = require('playwright');

const CONFIGS = [
  { id: 'P1-rowne-pewne-s1', pt: 'bitwa-duza', seed: 1, hit: 'pewne', ratioLabel: '1:1 (28 vs 28, mieszana)' },
  { id: 'P2-rowne-losowe-s1', pt: 'bitwa-duza', seed: 1, hit: 'losowe', ratioLabel: '1:1 (28 vs 28, mieszana)' },
  { id: 'P3-rowne-losowe-s2', pt: 'bitwa-duza', seed: 2, hit: 'losowe', ratioLabel: '1:1 (28 vs 28, mieszana)' },
  { id: 'P4-rowne-losowe-s3', pt: 'bitwa-duza', seed: 3, hit: 'losowe', ratioLabel: '1:1 (28 vs 28, mieszana)' },
];
const MODES = ['manual', 'auto', 'skip'];

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.webp': 'image/webp', '.jpg': 'image/jpeg' };

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = decodeURIComponent(req.url.split('?')[0]);
      const f = path.join(DIST, p === '/' ? 'index.html' : p);
      if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

// Zegar deterministyczny (ten sam kod co live-verify-w3-seeds123-obs.cjs).
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
      window.__fakeNow += 16;
      for (const cb of q) cb(window.__fakeNow);
    }
    return !!(bs && bs.finished);
  };
}

async function runOne(browser, base, cfg, mode) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(initDet, cfg.seed);
  const qs = `?playtest=${cfg.pt}&civTest=1&rams=0&chariots=0&towers=0`;
  await page.goto(base + '/' + qs, { waitUntil: 'load', timeout: 180000 });
  for (let i = 0; i < 600; i++) {
    const ready = await page.evaluate(() => { window.__pumpFrames(5); return !!window.__lastBattleScene; });
    if (ready) break;
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => { if (!window.__lastBattleScene) throw new Error('brak sceny bitwy'); });
  await page.evaluate((h) => { window.__civSetHitMode(h); }, cfg.hit);
  await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    bs.renderer.render = () => {};
    window.__dt = 16;
  });
  const start = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    const a = bs._sideEndStats('atk'); const d = bs._sideEndStats('def');
    return { atkTotal: a.total, defTotal: d.total, atkHp: Math.round(a.hp), defHp: Math.round(d.hp), deployPhase: !!bs.deployPhase, manualAtStart: !!bs._manualMode };
  });
  const actions = { startClick: false, spacePresses: 0, rToggle: false, skipClick: false };
  // Pelne klikniecia/klawisze przez Playwright (wejscie uzytkownika), nie przez metody sceny.
  await page.waitForSelector('#deploy-toolbar-start', { timeout: 60000 }).catch(() => {});
  if (mode === 'skip') {
    // Start walki (klik), potem Pomin (klik) jak w produkcyjnym przycisku.
    await page.click('#deploy-toolbar-start', { timeout: 30000 });
    actions.startClick = true;
    await page.evaluate(() => window.__pumpFrames(30));
    const skipBtn = page.locator('button', { hasText: /Pomi/ }).first();
    if (await skipBtn.count()) { await skipBtn.click({ timeout: 30000 }).catch(() => {}); actions.skipClick = true; }
    else { await page.evaluate(() => window.__lastBattleScene.skip()); actions.skipClick = 'fallback-metoda'; }
  } else {
    await page.click('#deploy-toolbar-start', { timeout: 30000 });
    actions.startClick = true;
    await page.evaluate(() => window.__pumpFrames(30));
    if (mode === 'auto') {
      await page.keyboard.press('r'); actions.rToggle = true; // klawisz R = przelacz na AUTO
      await page.evaluate(() => window.__lastBattleScene._setSpeedIdx(3, { clamp: true }));
    }
  }
  const t0 = Date.now();
  let fin = false;
  let stuckLoops = 0;
  while (!fin) {
    if (mode === 'manual') {
      const awaiting = await page.evaluate(() => { window.__pumpFrames(120); const bs = window.__lastBattleScene; return !!bs._battleAwaitingOrders && !bs.finished; });
      if (process.env.R2_TRACE && actions.spacePresses >= 0 && (stuckLoops === 0)) {
        const tr = await page.evaluate(() => { const bs = window.__lastBattleScene; return { round: bs.roundNo, frames: window.__framesRun, fin: !!bs.finished, aw: !!bs._battleAwaitingOrders, sp: bs.speedIdx }; });
        console.log('TRACE', mode, Date.now() - t0, JSON.stringify(tr), 'space=' + actions.spacePresses);
      }
      if (awaiting) { await page.keyboard.press('Space'); actions.spacePresses++; stuckLoops = 0; }
      else { stuckLoops++; }
      if (stuckLoops > 2000) throw new Error('reczna: brak postepu (awaiting=false, nie zakonczone)');
      fin = await page.evaluate(() => { window.__pumpFrames(60); return !!window.__lastBattleScene.finished; });
    } else {
      fin = await page.evaluate(() => window.__pumpFrames(300));
    }
    if (Date.now() - t0 > 420000) throw new Error('timeout bitwy ' + mode);
  }
  const res = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    const a = bs._sideEndStats('atk'); const d = bs._sideEndStats('def');
    return {
      winner: bs._endWinner ?? null, round: bs.roundNo,
      manualAtEnd: !!bs._manualMode,
      wallBreached: bs.wallEverBreached === true,
      atk: { total: a.total, lost: a.lost, remaining: a.remaining, hp: Math.round(a.hp), hpMax: Math.round(a.hpMax) },
      def: { total: d.total, lost: d.lost, remaining: d.remaining, hp: Math.round(d.hp), hpMax: Math.round(d.hpMax) },
      endText: (document.body.innerText.match(/Koniec bitwy|Zwyci[ęe]stwo|Pora[żz]ka|Remis/g) || []).slice(0, 3),
    };
  });
  await page.close();
  return { start, actions, res, errors };
}

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { runs: {}, meta: { chromium: CHROME, dist: DIST, runda: 2, note: 'driver reczny = klik Start walki + Space; AUTO = klawisz R; skip = przycisk Pomin' } };
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const t0 = Date.now();
  try {
    for (const cfg of CONFIGS) {
      for (const mode of MODES) {
        const key = cfg.id + '|' + mode;
        if (out.runs[key] && !out.runs[key].error) continue;
        if ((Date.now() - t0) / 1000 > LIMIT_S) break;
        try {
          const r = await runOne(browser, base, cfg, mode);
          out.runs[key] = { cfg, mode, ...r };
        } catch (e) {
          out.runs[key] = { cfg, mode, error: String(e && e.message || e) };
        }
        fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
        console.log('DONE', key, JSON.stringify(out.runs[key].res || out.runs[key].error));
      }
    }
  } finally {
    await browser.close();
    srv.close();
  }
  const left = CONFIGS.flatMap((c) => MODES.map((m) => c.id + '|' + m)).filter((k) => !out.runs[k] || out.runs[k].error);
  console.log('LEFT', left.length, left.join(','));
})();
