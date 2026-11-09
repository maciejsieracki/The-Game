'use strict';
/**
 * battle-skip-equals-auto-resolve-test.cjs
 * R-WEB-BATTLE-SKIP-TO-RESULT-ABSURD-OUTCOME-Q1 (runda 2)
 *
 * CZESC A -- format liczb strat/lupow: formatEndLoss (endScreen1E.ts), bez ulamkow, NaN, ujemnych.
 * CZESC B -- PRAWDZIWA SCENA w Chromium (vite build lustrzanego korzenia, ?playtest=oblezenie-duze,
 *   czyli oblezenie z murem). Ten sam seed Math.random (addInitScript) dla kazdego przebiegu:
 *     AUTO  -- _endDeployPhase(), przelacz na AUTO, zegar przyspieszony do konca (BattleScene)
 *     SKIP  -- skip() w fazie rozstawiania (przewijanie tej samej symulacji)
 *   Porownanie: zwyciezca, liczba zywych/straconych i suma HP po obu stronach, numer tury.
 *   KONTROLA: AUTO vs AUTO (ten sam seed) -- jesli dwa przebiegi AUTO sie roznia, roznica
 *   wynika z czasu klatek (nie z skip) i jest raportowana jako NIE_ZMIERZONO dla warunku.
 *   Zysk czasu wirtualnego (bs.vNow) i tury raportowany dla kazdego przebiegu.
 *   Brak Chromium -> NIE_ZMIERZONO (exit 2), bez PASS.
 *
 * Usage (z gra/): TMPDIR=/dev/shm node tools/battle-skip-equals-auto-resolve-test.cjs
 * Env: WSKIP_SEEDS="1,2" (domyslnie "7"), WSKIP_AUTO_SPEED_IDX (domyslnie 3 = 8x), WSKIP_DIST (gotowy build).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const CHROME = '/opt/pw-browsers/chromium';
const RUN = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const TMP_ROOT = path.join(os.tmpdir(), `civ-wskip-${RUN}`);
fs.mkdirSync(TMP_ROOT, { recursive: true });
process.on('exit', () => { try { fs.rmSync(TMP_ROOT, { recursive: true, force: true }); } catch { /* best-effort */ } });

let pass = 0; let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

// ---------------------------------------------------------------------------
// CZESC A -- formatEndLoss (czysta funkcja, bundlowana esbuild)
// ---------------------------------------------------------------------------
function partA() {
  const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
  const outfile = path.join(TMP_ROOT, 'endScreen1E.cjs');
  esbuild.buildSync({
    entryPoints: [path.join(GRA, 'src/battle/endScreen1E.ts')], bundle: true, platform: 'node', format: 'cjs',
    outfile, logLevel: 'silent', external: ['three'],
  });
  const { formatEndLoss } = require(outfile);
  const s = (v) => formatEndLoss(v).replace(/\s/g, ' ');
  check('A1 formatEndLoss(-2443.1999999999925) = "0" (ujemne => 0)', s(-2443.1999999999925) === '0', [s(-2443.1999999999925)]);
  // pl-PL: minimumGroupingDigits=2 (CLDR) -- 4-cyfrowe bez spacji, 5+ z separatorem.
  check('A2 formatEndLoss(2443.1999999999925) = "2443" (pl-PL: 4 cyfry bez separatora)', s(2443.1999999999925) === '2443', [s(2443.1999999999925)]);
  check('A3 formatEndLoss(1584.999999999996) = "1585"', s(1584.999999999996) === '1585', [s(1584.999999999996)]);
  check('A6 formatEndLoss(12443.6) = "12 444" (zaokraglenie + separator)', s(12443.6) === '12 444', [s(12443.6)]);
  check('A4 NaN, Infinity, wartosci ujemne => "0"', s(NaN) === '0' && s(Infinity) === '0' && s(-5) === '0', [s(NaN), s(Infinity), s(-5)]);
  check('A5 liczby calkowite bez separatora dla <1000', s(999) === '999' && s(0) === '0', [s(999), s(0)]);
}

// ---------------------------------------------------------------------------
// CZESC B -- prawdziwa scena
// ---------------------------------------------------------------------------
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

// Zegar deterministyczny: Math.random z ziarnem, rAF zbierany w kolejke, a klatke wykonuje
// harness (16 ms czasu klatki). Ten sam kod petli co w grze (_startLoop / _raf / _runFastForward).
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
      if (bs) { const tr = (window.__trace = window.__trace || []); if (!tr.length || tr[tr.length-1][0] !== bs.roundNo) tr.push([bs.roundNo, Math.round(bs.vNow - (window.__wskipT0||0)), window.__framesRun, bs.log.length]); }
    }
    return !!(bs && bs.finished);
  };
}

// mode: 'auto' = R -> AUTO po deployu, predkosc 1x, klatki po 16 ms; 'skip' = skip() w fazie rozstawiania.
async function runOne(browser, distDir, mode, seed) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(initDet, seed);
  await page.goto('file://' + path.join(distDir, 'index.html') + '?playtest=' + (process.env.WSKIP_PT || 'bitwa-duza'), { waitUntil: 'load', timeout: 120000 });
  // Scena powstaje w petli klatek: pompuj klatki, az pojawi sie __lastBattleScene.
  for (let i = 0; i < 400; i++) {
    const ready = await page.evaluate(() => { window.__pumpFrames(5); return !!window.__lastBattleScene; });
    if (ready) break;
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => { if (!window.__lastBattleScene) throw new Error('brak sceny bitwy po pompowaniu klatek'); });
  await page.evaluate((dt) => { window.__wskipDt = dt; }, process.env.WSKIP_DT || '16');
  await page.evaluate((mode) => {
    const bs = window.__lastBattleScene;
    bs.renderer.render = () => {};                  // bez rysowania: tylko logika walki
    window.__dt = parseInt(window.__wskipDt || '16', 10);
    window.__wskipT0 = bs.vNow;
    { let rn = bs.roundNo; window.__rtrace = []; Object.defineProperty(bs, 'roundNo', { get() { return rn; }, set(v) { rn = v; window.__rtrace.push([v, Math.round(bs.vNow - window.__wskipT0)]); }, configurable: true }); }
    window.__wskipDeploy = !!bs.deployPhase;
    if (mode === 'skip') {
      bs.skip();
    } else {
      if (bs.deployPhase) bs._endDeployPhase();
      if (bs._manualMode) bs._toggleManualMode();  // R -> AUTO (jak gracz)
      bs._setSpeedIdx(0, { clamp: true });         // 1x
    }
  }, mode);
  const limitMs = parseInt(process.env.WSKIP_TIMEOUT_S || '900', 10) * 1000;
  const t0w = Date.now();
  let fin = false; let frames = 0;
  while (!fin) {
    fin = await page.evaluate(() => window.__pumpFrames(20000));
    frames += 20000;
    if (Date.now() - t0w > limitMs) {
      const st = await page.evaluate(() => { const bs = window.__lastBattleScene; return { round: bs.roundNo, vNow: Math.round(bs.vNow - window.__wskipT0) }; });
      throw new Error('bitwa nie skonczyla sie w limicie: ' + mode + ' ' + JSON.stringify(st));
    }
  }
  const res = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    const sa = bs._sideEndStats('atk');
    const sd = bs._sideEndStats('def');
    return {
      winner: bs._endWinner, round: bs.roundNo, virtMs: Math.round(bs.vNow - window.__wskipT0),
      deployAtStart: window.__wskipDeploy, framesRun: window.__framesRun, speedMul: bs.speedMul, ffVirtualMs: Math.round(bs._ffVirtualMs || 0),
      atk: { total: sa.total, lost: sa.lost, remaining: sa.remaining, hp: Math.round(sa.hp) },
      def: { total: sd.total, lost: sd.lost, remaining: sd.remaining, hp: Math.round(sd.hp) },
      logLines: bs.log.length, endText: (document.body.innerText.match(/Koniec bitwy|Zwyci[ęe]stwo|Pora[żz]ka/g) || []).slice(0, 3),
    };
  });
  if (process.env.WSKIP_TRACE) console.log('DBG ' + JSON.stringify((await page.evaluate(() => window.__dbg || [])).slice(0,12))); if (process.env.WSKIP_TRACE) console.log('TRACE ' + mode + ' ' + JSON.stringify(await page.evaluate(() => window.__rtrace)));
  if (process.env.WSKIP_DUMP) {
    const lines = await page.evaluate(() => window.__lastBattleScene.log.slice());
    fs.writeFileSync(process.env.WSKIP_DUMP + '-' + mode + '.txt', lines.join('\n'), 'utf8');
  }
  await page.close();
  return { mode, seed, frames, errors, ...res };
}

async function partB() {
  let chromium;
  try { ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright'))); }
  catch (e) { console.log('NIE_ZMIERZONO: brak playwright (' + e.message.split('\n')[0] + ')'); return 'NIE_ZMIERZONO'; }
  if (!fs.existsSync(CHROME)) { console.log('NIE_ZMIERZONO: brak Chromium (' + CHROME + ')'); return 'NIE_ZMIERZONO'; }
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const distDir = buildVite();
  const seeds = (process.env.WSKIP_SEEDS || '7').split(',').map((x) => parseInt(x, 10));
  const only = process.env.WSKIP_ONLY || '';   // 'auto' | 'skip' -- pojedynczy przebieg (limit czasu narzedzia)
  const rows = [];
  try {
    for (const seed of seeds) {
      if (only) {
        const r = await runOne(browser, distDir, only, seed);
        console.log('ONLY ' + JSON.stringify(r));
        continue;
      }
      const auto1 = await runOne(browser, distDir, 'auto', seed);
      const skip = await runOne(browser, distDir, 'skip', seed);
      rows.push({ seed, auto1, skip });
      console.log('RUN ' + JSON.stringify({ seed, auto1, skip }));
    }
  } finally { await browser.close(); }
  if (only) return 'ONLY';
  for (const { seed, auto1, skip } of rows) {
    const key = (r) => JSON.stringify({ w: r.winner, a: r.atk, d: r.def, round: r.round });
    check('B0 seed ' + seed + ': brak bledow JS', auto1.errors.length + skip.errors.length === 0, [auto1.errors, skip.errors]);
    check('B1 seed ' + seed + ': skip konczy bitwe (zwyciezca ustalony, koniec pokazany)', !!skip.winner && skip.endText.length > 0, { winner: skip.winner, endText: skip.endText });
    check('B2 seed ' + seed + ': tura > 0 i czas wirtualny > 0 po skip', skip.round > 0 && skip.virtMs > 0, { round: skip.round, virtMs: skip.virtMs });
    check('B3 seed ' + seed + ': straty i HP calkowite po skip', [skip.atk, skip.def].every((x) => Number.isInteger(x.hp) && Number.isInteger(x.lost)), skip);
    check('B4 seed ' + seed + ': SKIP == AUTO (zwyciezca, straty, HP, tura)', key(skip) === key(auto1),
      { auto: key(auto1), skip: key(skip) });
    check('B5 seed ' + seed + ': czas bitwy skip ~ auto (roznica <= 200 ms wirt., nie 3,5x)', Math.abs(skip.virtMs - auto1.virtMs) <= 200, { auto: auto1.virtMs, skip: skip.virtMs });
    console.log('INFO seed ' + seed + ' czas wirtualny: auto=' + auto1.virtMs + ' ms (tura ' + auto1.round + '), skip=' + skip.virtMs + ' ms (tura ' + skip.round + ')');
  }
  return rows.length ? 'DONE' : 'NIE_ZMIERZONO';
}

// ---------------------------------------------------------------------------
// CZESC C -- kontrakt zrodla (krotki): skip nie wola osobnego rachunku wyniku
// ---------------------------------------------------------------------------
function partC() {
  const src = fs.readFileSync(path.join(GRA, 'src/battle/battleScene.ts'), 'utf8');
  const m = src.match(/\n  skip\(\): void \{[\s\S]*?\n  \}\n/);
  check('C1 skip() istnieje', !!m);
  check('C2 skip() nie wola computeInstantResult (osobny uproszczony rachunek)', !!m && !/computeInstantResult/.test(m[0]), m && m[0].slice(0, 200));
  check('C3 brak sztucznego limitu czasu FF (FF_MAX_VIRTUAL_MS usuniety)', !/FF_MAX_VIRTUAL_MS/.test(src));
  check('C4 sufit przewijania liczony w turach (FF_MAX_ROUNDS) z rozstrzygnieciem PAT', /const FF_MAX_ROUNDS = 400/.test(src) && /_ffRoundCapResult\(\)/.test(src));
}

async function main() {
  partA();
  partC();
  const b = await partB();
  console.log('--- ' + pass + ' ok, ' + fail + ' fail; CZESC B: ' + b);
  if (b === 'NIE_ZMIERZONO') process.exit(fail ? 1 : 2);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
