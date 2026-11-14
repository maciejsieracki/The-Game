'use strict';
/**
 * R-WEB-LIVE-VERIFY-W18-W24-MANUAL-LOSSES-Q1 — runda 3, punkt 3 (straty zwycieskiej strony w bitwie, zadanie #272/#335).
 * Prawdziwa scena BattleScene w Chromium (vite build poza repo), presety playtestu (?playtest=bitwa-duza|oblezenie-duze),
 * zegar deterministyczny (ten sam seed Math.random), tryb trafien ustawiany hakiem __civSetHitMode.
 *
 * Zmiany wzgledem r2 (odpowiedz na zarzuty Evaluatora):
 *  - tryb 'skip' zamiast 'manual': bs.skip() = przycisk Pomin (BEZ klikania jednostek). Klik-po-klik (ManualBattle /
 *    rozkazy BattleScene) NIE jest wykonywany w tym skrypcie.
 *  - hitMode NIE jest odczytywany z bs._hitMode (pole nie istnieje). Zamiast tego: 'pewne' ustawiane hakiem przed
 *    startem walki, plus przebieg kontrolny 'losowe' (ten sam seed) — roznica wyniku dowodzi, ze przelacznik dziala.
 *  - wallBreached: bs.wallEverBreached (czy byl wylom) — rozstrzyga, ktory sufit tur obowiazuje (150 bez wylomu, 400 z wylomem).
 *  - 'auto' = _endDeployPhase() + wylaczenie trybu recznego + predkosc 8x (jak klawisz R).
 *
 * Usage (z gra/): node tools/live-verify-w18-w24-manual-losses-w3r3.cjs <dist-dir> <out.json> [limitSekund]
 * Checkpoint: istniejace wpisy bez bledu w out.json nie sa powtarzane.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const DIST = process.argv[2];
const OUT = process.argv[3];
const LIMIT_S = Number(process.argv[4] || 480);
if (!DIST || !OUT) throw new Error('usage: node w3r3.cjs <dist-dir> <out.json> [limitSekund]');
const CHROME = process.env.W3_CHROMIUM || '/usr/bin/chromium';
const { chromium } = require('playwright');

const CONFIGS = [
  { id: 'B1-rowne-bitwa-duza-s1', pt: 'bitwa-duza', rams: 0, chariots: 0, seed: 1, hit: 'pewne', ratioLabel: '1:1 (preset bitwa-duza)' },
  { id: 'B2-rowne-bitwa-duza-s2', pt: 'bitwa-duza', rams: 0, chariots: 0, seed: 2, hit: 'pewne', ratioLabel: '1:1 (preset bitwa-duza)' },
  { id: 'B3-oblezenie-bazowe-s1', pt: 'oblezenie-duze', rams: 0, chariots: 0, seed: 1, hit: 'pewne', ratioLabel: 'bazowy (preset oblezenie-duze)' },
  { id: 'B4-oblezenie-rydwany6-s1', pt: 'oblezenie-duze', rams: 0, chariots: 6, seed: 1, hit: 'pewne', ratioLabel: 'atakujacy +6 rydwanow' },
  { id: 'B5-oblezenie-rydwany12-s1', pt: 'oblezenie-duze', rams: 0, chariots: 12, seed: 1, hit: 'pewne', ratioLabel: 'atakujacy +12 rydwanow' },
  { id: 'B6-oblezenie-taran6-s2', pt: 'oblezenie-duze', rams: 6, chariots: 0, seed: 2, hit: 'pewne', ratioLabel: 'atakujacy +6 taranow' },
  { id: 'K1-kontrola-losowe-bitwa-duza-s1', pt: 'bitwa-duza', rams: 0, chariots: 0, seed: 1, hit: 'losowe', ratioLabel: 'kontrola trybu: losowe (1:1)' },
];

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

// Zegar deterministyczny (ten sam kod co battle-skip-equals-auto-resolve-test.cjs).
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
  const qs = `?playtest=${cfg.pt}&civTest=1&rams=${cfg.rams}&chariots=${cfg.chariots}&towers=0`;
  await page.goto(base + '/' + qs, { waitUntil: 'load', timeout: 180000 });
  for (let i = 0; i < 600; i++) {
    const ready = await page.evaluate(() => { window.__pumpFrames(5); return !!window.__lastBattleScene; });
    if (ready) break;
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => { if (!window.__lastBattleScene) throw new Error('brak sceny bitwy'); });
  // Tryb trafien (przelacznik #285): ustawiany PRZED startem walki; wartosc nie jest odczytywalna z okna,
  // dlatego dowodem jest kontrola 'losowe' na tym samym ziarnie (K1), a nie odczyt pola.
  await page.evaluate((h) => { window.__civSetHitMode(h); }, cfg.hit);
  const start = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    bs.renderer.render = () => {};
    const a = bs._sideEndStats('atk'); const d = bs._sideEndStats('def');
    window.__t0 = bs.vNow;
    return { atkTotal: a.total, defTotal: d.total, atkHp: Math.round(a.hp), defHp: Math.round(d.hp), deployPhase: !!bs.deployPhase };
  });
  await page.evaluate((m) => {
    const bs = window.__lastBattleScene;
    window.__dt = 16;
    bs._setSpeedIdx(0, { clamp: true });
    if (m === 'skip') {
      bs.skip();
    } else {
      if (bs.deployPhase) bs._endDeployPhase();
      if (bs._manualMode) bs._toggleManualMode();
      bs._setSpeedIdx(3, { clamp: true });
    }
  }, mode);
  const t0 = Date.now();
  let fin = false;
  while (!fin) {
    fin = await page.evaluate(() => window.__pumpFrames(300));
    if (Date.now() - t0 > 420000) throw new Error('timeout bitwy ' + mode);
  }
  const res = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    const a = bs._sideEndStats('atk'); const d = bs._sideEndStats('def');
    return {
      winner: bs._endWinner ?? null, round: bs.roundNo,
      wallBreached: bs.wallEverBreached === true,
      siegeWallCol: bs.siegeWallCol ?? null,
      atk: { total: a.total, lost: a.lost, remaining: a.remaining, hp: Math.round(a.hp), hpMax: Math.round(a.hpMax) },
      def: { total: d.total, lost: d.lost, remaining: d.remaining, hp: Math.round(d.hp), hpMax: Math.round(d.hpMax) },
      endText: (document.body.innerText.match(/Koniec bitwy|Zwyci[ęe]stwo|Pora[żz]ka|Remis/g) || []).slice(0, 3),
    };
  });
  await page.close();
  return { start, res, errors };
}

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { runs: {}, meta: { chromium: CHROME, dist: DIST, runda: 3 } };
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const t0 = Date.now();
  try {
    for (const cfg of CONFIGS) {
      for (const mode of ['skip', 'auto']) {
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
  const left = CONFIGS.flatMap((c) => ['skip', 'auto'].map((m) => c.id + '|' + m)).filter((k) => !out.runs[k] || out.runs[k].error);
  console.log('LEFT', left.length, left.join(','));
})();
