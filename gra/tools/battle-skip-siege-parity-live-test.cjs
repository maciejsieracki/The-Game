'use strict';
/**
 * battle-skip-siege-parity-live-test.cjs -- R-WEB-BATTLE-SKIP-SIEGE-TRUE-RESULT-Q1 (CZESC B).
 *
 * Zywa scena Chromium ?playtest=oblezenie-duze: ta sama bitwa oblezenia (ten sam seed Math.random,
 * ta sama petla klatek z zegarem deterministycznym, dt=16 ms) rozgrywana dwa razy:
 *   auto -- _endDeployPhase(), przelacz na AUTO, predkosc 1x, rozstrzygniecie wylacznie przez silnik
 *           (_checkEnd, w tym sufit FF_MAX_ROUNDS);
 *   skip -- skip() w fazie rozstawiania (przewijanie: _runFastForward -> _ffRoundCapResult).
 * Porownanie: zwyciezca, tura konca, straty i pozostali zywi po obu stronach, czy byl wylom,
 * oraz ktora sciezka zakonczyla bitwe (wpis logu: SZTURM / PAT / przewijanie).
 *
 * Przebiegi sa rozbite na wywolania (limit narzedzia): WSKIP_SEEDS="1" WSKIP_MODES="auto" itd.
 * Wyniki dopisywane sa jako linie JSON do WSKIP_OUT; tryb 'compare' (WSKIP_COMPARE=1) porownuje pary.
 *
 * Mutant (dowod, ze test wykrywa stara regule): WSKIP_BATTLE_SRC=<sciezka do battleScene.ts>
 * podmienia zrodlo sceny w buildzie (np. wersja z 1d068199 = kod przed poprawka).
 *
 * Env:
 *   WSKIP_SEEDS   (domyslnie "1")         WSKIP_MODES (domyslnie "auto,skip")
 *   WSKIP_OUT     plik wynikow JSON-lines WSKIP_DIST  gotowy build (pomija vite build)
 *   WSKIP_BATTLE_SRC  mutant sceny        WSKIP_TIMEOUT_S (domyslnie 540)
 *   WSKIP_AUTO_SPEED_IDX (domyslnie 0 = 1x; 3 = 8x, skraca czas przebiegu AUTO)
 *   WSKIP_COMPARE=1  tylko porownanie wynikow z WSKIP_OUT
 *
 * Brak Chromium / playwright -> NIE_ZMIERZONO (exit 2).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const CHROME = '/opt/pw-browsers/chromium';
const RUN = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const TMP_ROOT = path.join(os.tmpdir(), `civ-wsiege-${RUN}`);
fs.mkdirSync(TMP_ROOT, { recursive: true });
process.on('exit', () => { if (process.env.WSKIP_KEEP === '1') return; try { fs.rmSync(TMP_ROOT, { recursive: true, force: true }); } catch { /* best-effort */ } });

let pass = 0; let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

function buildVite() {
  if (process.env.WSKIP_DIST) return process.env.WSKIP_DIST;
  const root = path.join(TMP_ROOT, 'root');
  fs.mkdirSync(root, { recursive: true });
  for (const f of ['index.html', 'vite.config.ts', 'tsconfig.json', 'package.json']) {
    fs.copyFileSync(path.join(GRA, f), path.join(root, f));
  }
  for (const d of ['data', 'node_modules']) {
    fs.symlinkSync(fs.realpathSync(path.join(GRA, d)), path.join(root, d), 'dir');
  }
  fs.cpSync(path.join(GRA, 'src'), path.join(root, 'src'), { recursive: true });
  if (process.env.WSKIP_BATTLE_SRC) {
    fs.copyFileSync(process.env.WSKIP_BATTLE_SRC, path.join(root, 'src/battle/battleScene.ts'));
  }
  const outDir = path.join(TMP_ROOT, 'dist');
  execSync(
    `node ${JSON.stringify(path.join(GRA, 'node_modules/vite/bin/vite.js'))} build`
    + ` --outDir ${JSON.stringify(outDir)} --emptyOutDir`,
    { cwd: root, stdio: 'pipe', maxBuffer: 128 * 1024 * 1024 },
  );
  fs.rmSync(root, { recursive: true, force: true });
  if (!fs.existsSync(path.join(outDir, 'index.html'))) throw new Error('brak index.html po vite build');
  return outDir;
}

// Zegar deterministyczny (ten sam co battle-skip-equals-auto-resolve-test.cjs).
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

async function runOne(browser, distDir, mode, seed) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(initDet, seed);
  await page.goto('file://' + path.join(distDir, 'index.html') + '?playtest=oblezenie-duze', { waitUntil: 'load', timeout: 120000 });
  for (let i = 0; i < 400; i++) {
    const ready = await page.evaluate(() => { window.__pumpFrames(5); return !!window.__lastBattleScene; });
    if (ready) break;
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => { if (!window.__lastBattleScene) throw new Error('brak sceny bitwy po pompowaniu klatek'); });
  await page.evaluate(([mode, speedIdx]) => {
    const bs = window.__lastBattleScene;
    window.__wskipSpeedIdx = speedIdx;
    bs.renderer.render = () => {};                  // bez rysowania: tylko logika walki
    window.__dt = 16;
    window.__wskipT0 = bs.vNow;
    if (mode === 'skip') {
      bs.skip();
    } else {
      if (bs.deployPhase) bs._endDeployPhase();
      if (bs._manualMode) bs._toggleManualMode();  // R -> AUTO (jak gracz)
      bs._setSpeedIdx(parseInt(window.__wskipSpeedIdx || '0', 10), { clamp: true }); // domyslnie 1x
    }
  }, [mode, process.env.WSKIP_AUTO_SPEED_IDX || '0']);
  const limitMs = parseInt(process.env.WSKIP_TIMEOUT_S || '540', 10) * 1000;
  const t0w = Date.now();
  let fin = false;
  while (!fin) {
    fin = await page.evaluate(() => window.__pumpFrames(20000));
    if (!fin && Date.now() - t0w > limitMs) {
      const st = await page.evaluate(() => { const bs = window.__lastBattleScene; return { round: bs.roundNo, vNow: Math.round(bs.vNow - window.__wskipT0) }; });
      await page.close();
      return { mode, seed, timeout: true, ...st };
    }
  }
  const res = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    const sa = bs._sideEndStats('atk');
    const sd = bs._sideEndStats('def');
    const capLine = bs.log.find((l) => /PAT|SZTURM/.test(l)) || null;
    return {
      winner: bs._endWinner, round: bs.roundNo, virtMs: Math.round(bs.vNow - window.__wskipT0),
      breached: !!bs.wallEverBreached, siegeWallCol: bs.siegeWallCol, framesRun: window.__framesRun,
      atk: { total: sa.total, lost: sa.lost, remaining: sa.remaining, hp: Math.round(sa.hp) },
      def: { total: sd.total, lost: sd.lost, remaining: sd.remaining, hp: Math.round(sd.hp) },
      endLine: capLine,
      logTail: bs.log.slice(-3),
    };
  });
  await page.close();
  return { mode, seed, errors, timeout: false, ...res };
}

function readRows(file) {
  if (!file || !fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

async function main() {
  if (process.env.WSKIP_COMPARE === '1') {
    const rows = readRows(process.env.WSKIP_OUT);
    const seeds = [...new Set(rows.map((r) => r.seed))];
    let allOk = true;
    for (const sd of seeds) {
      const a = rows.filter((r) => r.seed === sd && r.mode === 'auto').pop();
      const k = rows.filter((r) => r.seed === sd && r.mode === 'skip').pop();
      if (!a || !k) { console.log('NIE_ZMIERZONO: seed ' + sd + ' bez pary auto/skip'); allOk = false; continue; }
      if (a.timeout || k.timeout) { console.log('NIE_ZMIERZONO: seed ' + sd + ' limit czasu'); allOk = false; continue; }
      const same = a.winner === k.winner && a.round === k.round
        && a.atk.lost === k.atk.lost && a.def.lost === k.def.lost
        && a.atk.remaining === k.atk.remaining && a.def.remaining === k.def.remaining
        && a.atk.hp === k.atk.hp && a.def.hp === k.def.hp;
      check('P1 seed ' + sd + ': wynik SKIP == wynik AUTO (zwyciezca, tura, straty, zywi, HP)', same, { auto: a, skip: k });
      if (!same) allOk = false;
    }
    console.log('--- ' + pass + ' ok, ' + fail + ' fail');
    process.exit(fail || !allOk ? 1 : 0);
  }

  let chromium;
  try { ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright'))); }
  catch (e) { console.log('NIE_ZMIERZONO: brak playwright (' + e.message.split('\n')[0] + ')'); process.exit(2); }
  if (!fs.existsSync(CHROME)) { console.log('NIE_ZMIERZONO: brak Chromium ' + CHROME); process.exit(2); }

  const seeds = (process.env.WSKIP_SEEDS || '1').split(',').map((x) => parseInt(x, 10));
  const modes = (process.env.WSKIP_MODES || 'auto,skip').split(',');
  const outFile = process.env.WSKIP_OUT || '';
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const t0 = Date.now();
  const distDir = buildVite();
  console.log('BUILD ok in ' + Math.round((Date.now() - t0) / 1000) + ' s: ' + distDir);
  for (const seed of seeds) {
    for (const mode of modes) {
      const r = await runOne(browser, distDir, mode, seed);
      console.log('RUN ' + JSON.stringify(r));
      if (outFile) fs.appendFileSync(outFile, JSON.stringify(r) + '\n', 'utf8');
      if (r.timeout) {
        // AUTO 1x do sufitu 400 tur to ok. 24 min wall (zmierzone): limit narzedzia -> NIE_ZMIERZONO, nie FAIL.
        console.log('NIE_ZMIERZONO: ' + mode + ' seed ' + seed + ' -- limit czasu przebiegu (round ' + r.round + ', vNow ' + r.vNow + ' ms)');
        continue;
      }
      check('L0 ' + mode + ' seed ' + seed + ': bitwa zakonczona w limicie, brak bledow JS', (r.errors || []).length === 0, r.errors);
    }
  }
  await browser.close();
  console.log('--- ' + pass + ' ok, ' + fail + ' fail (uruchom z WSKIP_COMPARE=1 WSKIP_OUT=... dla porownania par)');
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.log('FAIL: wyjatek: ' + String(e && e.stack || e)); process.exit(1); });
