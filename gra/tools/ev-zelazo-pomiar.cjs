'use strict';
/**
 * ev-zelazo-pomiar.cjs — NIEZALEŻNY runner pomiarowy EVALUATORA dla
 * R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1.
 *
 * Gra jedzie PRAWDZIWĄ pętlą tury w żywym Chromium na artefakcie `vite build`
 * (`doStartGame()` + `triggerPlayerEndTurn()`), instrumentacja wyłącznie w pamięci
 * (`tools/ev-zelazo-pomiar.vite.config.ts`). `gra/src/**` nietknięte.
 *
 * Uruchomienie (z gra/):
 *   node tools/ev-zelazo-pomiar.cjs --seeds 4001,4002,4003 --turns 11 --lever-turn 6 \
 *        --out <katalog> --label PO [--unblock] [--skip-build]
 *
 * --lever-turn N  w turze N wołana jest dźwignia `researchToIron()` (prawdziwe badania).
 *                 0 = bez dźwigni.
 * --unblock       przed dźwignią woła meetAllCivs() + clearStaleCityStateFlags()
 *                 (odblokowanie Z1/Z5 na poziomie STANU gry, nie łatką źródła).
 *                 Bez tej flagi przebieg jest CZYSTO STOCKOWY.
 * EV_ZELAZO_BASELINE=1 (env) → wariant PRZED.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
// P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: cel zapisu unikalny per przebieg.
// Sygnatura `-<pid>-<6 znakow>` jest ta sama, ktorej uzywaja bramki w tools/ — osierocony
// katalog po przerwanym przebiegu sprzata startowy sweep dowolnej z nich.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const DIST = process.env.EV_ZELAZO_DIST || `/tmp/civ-dist-zelazo-wojna-ev-pomiar-${TMPDIR_RUN_ID}`;
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const SEEDS = argOf('--seeds', '4001,4002,4003').split(',').map(s => parseInt(s.trim(), 10));
const TURNS = parseInt(argOf('--turns', '11'), 10);
const LEVER_TURN = parseInt(argOf('--lever-turn', '6'), 10);
const LABEL = argOf('--label', 'PO');
const UNBLOCK = process.argv.includes('--unblock');
const OUT_DIR = path.resolve(argOf('--out', path.join(GRA, '..', 'ev-zelazo-out')));
const SKIP_BUILD = process.argv.includes('--skip-build');

function buildBundle() {
  console.log('[ev-zelazo] vite build (instrumentowany, outDir poza repo) ...');
  execFileSync(
    'node',
    ['./node_modules/vite/bin/vite.js', 'build',
      '--config', 'tools/ev-zelazo-pomiar.vite.config.ts',
      '--outDir', DIST, '--emptyOutDir'],
    { cwd: GRA, stdio: 'inherit' },
  );
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('brak index.html w ' + DIST);
}

async function launch(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage', '--js-flags=--max-old-space-size=4096'];
  try { return await chromium.launch({ headless: true, args }); }
  catch (e) { return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args }); }
}

const wait = ms => new Promise(r => setTimeout(r, ms));

async function runSeed(browser, seed) {
  const t0 = Date.now();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleLines = [];
  page.on('console', m => {
    const t = m.text();
    if (/WYMUSZONA-WOJNA|wypowiada|auto-pokój|eliminac/i.test(t)) consoleLines.push(t.slice(0, 400));
  });
  page.on('pageerror', e => consoleLines.push('PAGEERROR: ' + String(e).slice(0, 300)));

  await page.goto('file://' + path.join(DIST, 'index.html'), { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__evZelazo && window.__evZelazo.ready, undefined, { timeout: 180000 });
  await page.evaluate(() => { window.__EV_ZELAZO__ = { on: true, eras: [], dows: [], cands: [] }; });

  await page.evaluate(s => window.__evZelazo.startGame(s), seed);
  await page.waitForFunction(() => {
    const a = window.__evZelazo.audit();
    return a.citiesLen > 0 || window.__evZelazo.blockers().awaitingFirstCity;
  }, undefined, { timeout: 300000 });
  const founded = await page.evaluate(() => window.__evZelazo.foundFirstCity());
  console.log('[ev-zelazo] seed=' + seed + ' pierwsze miasto gracza: ' + founded);
  await wait(500);

  const snapshots = [];
  const ironStates = [];
  const turnLog = [];
  let lever = null;
  let unblockInfo = null;
  let stuck = 0;

  for (let i = 0; i < TURNS; i++) {
    const before = await page.evaluate(() => window.__evZelazo.audit());
    snapshots.push(before);
    ironStates.push(await page.evaluate(() => window.__evZelazo.ironState()));
    if (before.gameOver) { turnLog.push({ turn: before.turn, note: 'gameOver' }); break; }

    if (LEVER_TURN > 0 && lever === null && before.turn >= LEVER_TURN) {
      if (UNBLOCK) {
        unblockInfo = {
          turn: before.turn,
          met: await page.evaluate(() => window.__evZelazo.meetAllCivs()),
          clearedCsFlags: await page.evaluate(() => window.__evZelazo.clearStaleCityStateFlags()),
        };
        console.log('[ev-zelazo] seed=' + seed + ' ODBLOKOWANIE (stan gry) w turze ' + before.turn
          + ' met=' + unblockInfo.met.length + ' clearedCS=' + unblockInfo.clearedCsFlags.length);
      }
      lever = {
        turn: before.turn,
        result: await page.evaluate(() => window.__evZelazo.researchToIron()),
        auditAfter: await page.evaluate(() => window.__evZelazo.audit()),
        ironAfter: await page.evaluate(() => window.__evZelazo.ironState()),
      };
      console.log('[ev-zelazo] seed=' + seed + ' DZWIGNIA BADAN w turze ' + before.turn
        + ' epoki: ' + JSON.stringify(lever.result.map(r => r.ownerId + ':' + r.eraBefore + '->' + r.eraAfter))
        + ' ironPending=' + JSON.stringify(lever.ironAfter.pending));
    }

    const b = await page.evaluate(() => window.__evZelazo.blockers());
    if (b.preBattleOpen || b.pendingAutoPreBattle) {
      await page.evaluate(() => window.__evZelazo.clearPreBattle());
      await wait(300);
    }
    await page.evaluate(() => window.__evZelazo.endTurn());
    const target = before.turn + 1;
    let advanced = false;
    try {
      await page.waitForFunction(t => {
        const a = window.__evZelazo.audit();
        return a.turn >= t && !a.endTurnInProgress;
      }, target, { timeout: 240000, polling: 500 });
      advanced = true;
    } catch (e) {
      turnLog.push({ turn: before.turn, note: 'TIMEOUT', blockers: await page.evaluate(() => window.__evZelazo.blockers()) });
      await page.evaluate(() => window.__evZelazo.clearPreBattle());
      await wait(1000);
      stuck++;
      if (stuck >= 3) { turnLog.push({ note: 'ABORT po 3 zwisach' }); break; }
    }
    if (advanced) stuck = 0;
    if ((i + 1) % 3 === 0) {
      const a = await page.evaluate(() => window.__evZelazo.audit());
      console.log('[ev-zelazo] seed=' + seed + ' tura=' + a.turn + ' wojny=' + JSON.stringify(a.wars)
        + ' t=' + Math.round((Date.now() - t0) / 1000) + 's');
    }
  }

  const final = await page.evaluate(() => {
    const E = window.__EV_ZELAZO__;
    return {
      audit: window.__evZelazo.audit(),
      ironState: window.__evZelazo.ironState(),
      eras: E.eras, dows: E.dows, cands: E.cands,
    };
  });
  await page.close();
  return {
    label: LABEL, seed, turns: TURNS, leverTurn: LEVER_TURN, unblock: UNBLOCK,
    baseline: process.env.EV_ZELAZO_BASELINE === '1',
    elapsedS: Math.round((Date.now() - t0) / 1000),
    foundedFirstCity: founded, lever, unblockInfo,
    snapshots, ironStates, turnLog, consoleLines,
    finalAudit: final.audit, finalIronState: final.ironState,
    eras: final.eras, dows: final.dows, cands: final.cands,
  };
}

async function main() {
  let chromium;
  try { ({ chromium } = require(path.resolve(GRA, 'node_modules', 'playwright'))); }
  catch (e) { console.error('[ev-zelazo] playwright missing'); process.exit(1); }
  if (!SKIP_BUILD) buildBundle();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await launch(chromium);
  try {
    for (const seed of SEEDS) {
      const res = await runSeed(browser, seed);
      fs.writeFileSync(path.join(OUT_DIR, LABEL + '-seed-' + seed + '.json'), JSON.stringify(res), 'utf8');
      console.log('[ev-zelazo] ' + LABEL + ' seed=' + seed + ' ZAPISANY (' + res.elapsedS + 's, eras='
        + res.eras.length + ', dows=' + res.dows.length + ', cands=' + res.cands.length + ')');
    }
  } finally { await browser.close(); }
}

main().catch(e => { console.error(e); process.exit(1); });
