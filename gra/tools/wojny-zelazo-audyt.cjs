'use strict';
/**
 * wojny-zelazo-audyt.cjs — HARNESS POMIAROWY R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1.
 *
 * Gra jedzie PRAWDZIWĄ pętlą tury: `doStartGame()` (ta sama funkcja, którą woła kreator
 * nowej gry) w ŻYWYM Chromium na artefakcie `vite build`, `triggerPlayerEndTurn()` na
 * każdą turę. Ani jednego ręcznego wywołania predykatu w izolacji — wszystkie liczby
 * pochodzą z `decideAIDiplomacy` wołanego przez `main.ts` w normalnym końcu tury.
 * Instrumentacja wstrzykiwana W PAMIĘCI (`tools/wojny-zelazo-audyt.vite.config.ts`);
 * pliki `gra/src/**` NIE są zmieniane.
 *
 * Uruchomienie (z gra/):
 *   node tools/wojny-zelazo-audyt.cjs --seeds 111,222,333 --turns 30 --era-turn 8 \
 *        --out <katalog> [--label PO]
 *
 * Flagi środowiskowe buildu (przekazywane do vite):
 *   ZELAZO_BASELINE=1   wariant PRZED (origin/main, brak mechanizmu Żelaza)
 *   ZELAZO_SCEN_CS=1    odblokowanie Z1 (klasyfikator miasta-państwa)
 *   ZELAZO_SCEN_LAYER=1 odblokowanie Z5 (warstwa dyplomacji pre_contact)
 *
 * --era-turn N: w turze N wołany jest hak `advanceMajorAiToIron()` (akcelerator czasu:
 *   epoka startowa głównych AI → 3 + PRAWDZIWY reconcileAllOwnerErasFromResearch()).
 *   --era-turn 0 wyłącza akcelerator (przebieg czysto naturalny).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const DIST = process.env.ZELAZO_AUDYT_DIST || '/tmp/civ-dist-zelazo-wojna-op-audyt';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const SEEDS = argOf('--seeds', '111,222,333').split(',').map(s => parseInt(s.trim(), 10));
const TURNS = parseInt(argOf('--turns', '30'), 10);
const ERA_TURN = parseInt(argOf('--era-turn', '8'), 10);
const LABEL = argOf('--label', 'PO');
const OUT_DIR = path.resolve(argOf('--out', path.join(GRA, '..', 'audyt-zelazo-out')));
const SKIP_BUILD = process.argv.includes('--skip-build');

function buildBundle() {
  console.log('[zelazo] vite build (instrumentowany, outDir poza repo) ...');
  execFileSync(
    'node',
    ['./node_modules/vite/bin/vite.js', 'build',
      '--config', 'tools/wojny-zelazo-audyt.vite.config.ts',
      '--outDir', DIST, '--emptyOutDir'],
    { cwd: GRA, stdio: 'inherit' },
  );
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('brak index.html w ' + DIST);
}

async function launch(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage', '--js-flags=--max-old-space-size=4096'];
  try {
    return await chromium.launch({ headless: true, args });
  } catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args });
  }
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function runSeed(browser, seed) {
  const t0 = Date.now();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleLines = [];
  page.on('console', (msg) => {
    const t = msg.text();
    if (/WYMUSZONA-WOJNA|wypowiada|Dyplomacja|eliminac/i.test(t)) consoleLines.push(t.slice(0, 400));
  });
  page.on('pageerror', (e) => consoleLines.push('PAGEERROR: ' + String(e).slice(0, 300)));

  await page.goto('file://' + path.join(DIST, 'index.html'), { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__zelazoAudit && window.__zelazoAudit.ready, undefined, { timeout: 180000 });
  await page.evaluate(() => {
    window.__ZELAZO_AUDIT__ = { on: true, owners: [], ironCand: [], ironWars: [] };
  });

  const params = await page.evaluate(() => {
    const p = window.__zelazoAuditBuildParams();
    return {
      difficulty: p.difficulty, mapSize: p.mapSize, worldType: p.worldType,
      epochId: p.epochId, speed: p.speed, civTypesCount: p.civTypesCount,
      cityStatesCount: p.cityStatesCount, civId: p.civId,
      barbariansLevel: p.advanced && p.advanced.barbariansLevel,
    };
  });
  console.log('[zelazo] seed=' + seed + ' parametry menu:', JSON.stringify(params));

  await page.evaluate((s) => window.__zelazoAudit.startGame(s), seed);
  await page.waitForFunction(() => {
    const st = window.__zelazoAudit.state();
    return st.citiesLen > 0 || st.awaitingFirstCity;
  }, undefined, { timeout: 300000 });
  const founded = await page.evaluate(() => window.__zelazoAudit.foundFirstCity());
  console.log('[zelazo] seed=' + seed + ' pierwsze miasto gracza: ' + founded);
  await wait(500);

  const snapshots = [];
  const ironStates = [];
  const turnLog = [];
  let acceleratorApplied = null;
  let stuck = 0;
  for (let i = 0; i < TURNS; i++) {
    const before = await page.evaluate(() => window.__zelazoAudit.state());
    snapshots.push(before);
    ironStates.push(await page.evaluate(() => window.__zelazoAudit.ironState()));
    if (before.gameOver) { turnLog.push({ turn: before.turn, note: 'gameOver' }); break; }
    if (ERA_TURN > 0 && acceleratorApplied === null && before.turn >= ERA_TURN) {
      acceleratorApplied = {
        turn: before.turn,
        owners: await page.evaluate(() => window.__zelazoAudit.advanceMajorAiToIron()),
        stateAfter: await page.evaluate(() => window.__zelazoAudit.state()),
        ironAfter: await page.evaluate(() => window.__zelazoAudit.ironState()),
      };
      console.log('[zelazo] seed=' + seed + ' AKCELERATOR w turze ' + before.turn
        + ' owners=' + JSON.stringify(acceleratorApplied.owners)
        + ' ironPending=' + JSON.stringify(acceleratorApplied.ironAfter.pending));
    }
    const blockers = await page.evaluate(() => window.__zelazoAudit.blockers());
    if (blockers.preBattleOpen || blockers.pendingAutoPreBattle) {
      await page.evaluate(() => window.__zelazoAudit.clearPreBattle());
      await wait(300);
    }
    await page.evaluate(() => window.__zelazoAudit.endTurn());
    const target = before.turn + 1;
    let advanced = false;
    try {
      await page.waitForFunction((t) => {
        const st = window.__zelazoAudit.state();
        return st.turn >= t && !st.endTurnInProgress;
      }, target, { timeout: 240000, polling: 500 });
      advanced = true;
    } catch (e) {
      const b = await page.evaluate(() => window.__zelazoAudit.blockers());
      turnLog.push({ turn: before.turn, note: 'TIMEOUT', blockers: b });
      await page.evaluate(() => window.__zelazoAudit.clearPreBattle());
      await wait(1000);
      stuck++;
      if (stuck >= 3) { turnLog.push({ note: 'ABORT po 3 zwisach' }); break; }
    }
    if (advanced) stuck = 0;
    if ((i + 1) % 5 === 0) {
      const st = await page.evaluate(() => window.__zelazoAudit.state());
      const ir = await page.evaluate(() => window.__zelazoAudit.ironState());
      console.log('[zelazo] seed=' + seed + ' tura=' + st.turn + ' wojny=' + JSON.stringify(st.wars)
        + ' ironPary=' + JSON.stringify(ir.activePairs.map(p => p[0]))
        + ' t=' + Math.round((Date.now() - t0) / 1000) + 's');
      fs.mkdirSync(OUT_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(OUT_DIR, 'partial-' + LABEL + '-seed-' + seed + '.json'),
        JSON.stringify({ snapshots, ironStates, turnLog, consoleLines, acceleratorApplied }), 'utf8',
      );
    }
  }

  const final = await page.evaluate(() => {
    const A = window.__ZELAZO_AUDIT__;
    return {
      state: window.__zelazoAudit.state(),
      ironState: window.__zelazoAudit.ironState(),
      owners: A.owners,
      ironCand: A.ironCand,
      ironWars: A.ironWars,
    };
  });
  await page.close();
  return {
    label: LABEL, seed, params, turns: TURNS, eraTurn: ERA_TURN,
    elapsedS: Math.round((Date.now() - t0) / 1000),
    foundedFirstCity: founded, acceleratorApplied,
    snapshots, ironStates, turnLog, consoleLines,
    finalState: final.state, finalIronState: final.ironState,
    owners: final.owners, ironCand: final.ironCand, ironWars: final.ironWars,
  };
}

async function main() {
  let chromium;
  try { ({ chromium } = require(path.resolve(GRA, 'node_modules', 'playwright'))); }
  catch (e) { console.error('[zelazo] playwright missing'); process.exit(1); }
  if (!SKIP_BUILD) buildBundle();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await launch(chromium);
  try {
    for (const seed of SEEDS) {
      const res = await runSeed(browser, seed);
      fs.writeFileSync(
        path.join(OUT_DIR, LABEL + '-seed-' + seed + '.json'), JSON.stringify(res), 'utf8',
      );
      console.log('[zelazo] ' + LABEL + ' seed=' + seed + ' ZAPISANY (' + res.elapsedS + 's, '
        + 'ownerRec=' + res.owners.length + ', ironWars=' + res.ironWars.length + ')');
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
