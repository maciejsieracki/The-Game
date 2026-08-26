'use strict';
/**
 * wojny-kamien-audyt.cjs — HARNESS POMIAROWY (AUDYT, nie naprawa)
 * TEMAT: P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1
 *
 * Pytanie właściciela: „czy w epoce Kamienia cywilizacje w ogóle wypowiadają sobie
 * wojny i dlaczego nie widzę, żeby ktoś wypowiedział wojnę MNIE".
 *
 * CO TO MIERZY I DLACZEGO TAK:
 *  - Gra jedzie PRAWDZIWĄ pętlą tury: `doStartGame()` (ta sama funkcja, którą wywołuje
 *    kreator nowej gry) w ŻYWYM Chromium na artefakcie `vite build`. Nie ma tu ani
 *    jednego ręcznego wywołania predykatu w izolacji — wszystkie liczby pochodzą z
 *    `decideAIDiplomacy` wołanego przez `main.ts` w normalnym końcu tury.
 *  - Instrumentacja jest wstrzykiwana W PAMIĘCI przez `tools/wojny-kamien-audyt.vite.config.ts`.
 *    Pliki `gra/src/**` NIE są zmieniane (`git status` czysty jest częścią dowodu).
 *
 * Uruchomienie (z gra/):
 *   node tools/wojny-kamien-audyt.cjs --seeds 111,222,333 --turns 60 --out <katalog>
 *   --skip-build   użyj gotowego /tmp/civ-wojny-audyt/index.html
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const DIST = process.env.WOJNY_AUDYT_DIST || '/tmp/civ-wojny-audyt';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const SEEDS = argOf('--seeds', '111,222,333').split(',').map(s => parseInt(s.trim(), 10));
const TURNS = parseInt(argOf('--turns', '60'), 10);
const OUT_DIR = path.resolve(argOf('--out', path.join(GRA, '..', 'audyt-wojny-out')));
const SKIP_BUILD = process.argv.includes('--skip-build');
const HEADFUL = process.argv.includes('--headful');

function buildBundle() {
  console.log('[audyt] vite build (instrumentowany, outDir poza repo) ...');
  execFileSync(
    'node',
    ['./node_modules/vite/bin/vite.js', 'build',
      '--config', 'tools/wojny-kamien-audyt.vite.config.ts',
      '--outDir', DIST, '--emptyOutDir'],
    { cwd: GRA, stdio: 'inherit' },
  );
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('brak index.html w ' + DIST);
}

async function launch(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage', '--js-flags=--max-old-space-size=4096'];
  try {
    return await chromium.launch({ headless: !HEADFUL, args });
  } catch (e) {
    return await chromium.launch({ headless: !HEADFUL, executablePath: FALLBACK_CHROME, args });
  }
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function runSeed(browser, seed) {
  const t0 = Date.now();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleLines = [];
  page.on('console', (msg) => {
    const t = msg.text();
    if (/Dyplomacja|WYMUSZONA-WOJNA|wypowiada|wojn|ELIMINACJA|eliminac/i.test(t)) {
      consoleLines.push(t.slice(0, 400));
    }
  });
  page.on('pageerror', (e) => consoleLines.push('PAGEERROR: ' + String(e).slice(0, 300)));

  await page.goto('file://' + path.join(DIST, 'index.html'), { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__warAudit && window.__warAudit.ready, undefined, { timeout: 180000 });

  // Rejestratory ON zanim ruszy pierwsza tura.
  await page.evaluate(() => {
    window.__WAR_AUDIT__ = { on: true, gates: [], owners: [], stoneCand: [] };
  });

  const params = await page.evaluate((s) => {
    const p = window.__warAuditBuildParams();
    return {
      difficulty: p.difficulty, mapSize: p.mapSize, worldType: p.worldType,
      epochId: p.epochId, speed: p.speed, civTypesCount: p.civTypesCount,
      cityStatesCount: p.cityStatesCount, civId: p.civId,
      landFractionPercent: p.landFractionPercent,
      barbariansLevel: p.advanced && p.advanced.barbariansLevel,
      battleAlwaysManual: p.advanced && p.advanced.battleAlwaysManual,
      seedRequested: s,
    };
  }, seed);
  console.log('[audyt] seed=' + seed + ' parametry menu:', JSON.stringify(params));

  await page.evaluate((s) => window.__warAudit.startGame(s), seed);
  await page.waitForFunction(() => {
    const st = window.__warAudit.state();
    return st.citiesLen > 0 || st.awaitingFirstCity;
  }, undefined, { timeout: 300000 });

  const founded = await page.evaluate(() => window.__warAudit.foundFirstCity());
  console.log('[audyt] seed=' + seed + ' pierwsze miasto gracza: ' + founded);
  await wait(500);

  const snapshots = [];
  const turnLog = [];
  let stuck = 0;
  for (let i = 0; i < TURNS; i++) {
    const before = await page.evaluate(() => window.__warAudit.state());
    snapshots.push(before);
    if (before.gameOver) { turnLog.push({ turn: before.turn, note: 'gameOver' }); break; }
    const blockers = await page.evaluate(() => window.__warAudit.blockers());
    if (blockers.preBattleOpen || blockers.pendingAutoPreBattle) {
      await page.evaluate(() => window.__warAudit.clearPreBattle());
      await wait(300);
    }
    await page.evaluate(() => window.__warAudit.endTurn());
    const target = before.turn + 1;
    let advanced = false;
    try {
      await page.waitForFunction((t) => {
        const st = window.__warAudit.state();
        return st.turn >= t && !st.endTurnInProgress;
      }, target, { timeout: 240000, polling: 500 });
      advanced = true;
    } catch (e) {
      const b = await page.evaluate(() => window.__warAudit.blockers());
      turnLog.push({ turn: before.turn, note: 'TIMEOUT', blockers: b });
      await page.evaluate(() => window.__warAudit.clearPreBattle());
      await wait(1000);
      stuck++;
      if (stuck >= 3) { turnLog.push({ note: 'ABORT po 3 zwisach' }); break; }
    }
    if (advanced) stuck = 0;
    if ((i + 1) % 10 === 0) {
      const st = await page.evaluate(() => window.__warAudit.state());
      console.log('[audyt] seed=' + seed + ' tura=' + st.turn + ' wojny=' + JSON.stringify(st.wars)
        + ' t=' + Math.round((Date.now() - t0) / 1000) + 's');
      // zapis cząstkowy — awaria nie kasuje pomiaru
      dumpPartial(seed, { params, snapshots, turnLog, consoleLines });
    }
  }

  const final = await page.evaluate(() => ({
    state: window.__warAudit.state(),
    warLog: window.__warAudit.warLog(),
    audit: window.__WAR_AUDIT__,
  }));
  await page.close();
  return {
    seed, params, turns: TURNS, elapsedS: Math.round((Date.now() - t0) / 1000),
    foundedFirstCity: founded, snapshots, turnLog, consoleLines,
    finalState: final.state, warLog: final.warLog,
    gates: final.audit.gates, owners: final.audit.owners, stoneCand: final.audit.stoneCand,
  };
}

function dumpPartial(seed, obj) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'partial-seed-' + seed + '.json'), JSON.stringify(obj), 'utf8');
}

async function main() {
  let chromium;
  try { ({ chromium } = require(path.resolve(GRA, 'node_modules', 'playwright'))); }
  catch (e) { console.error('[audyt] playwright missing'); process.exit(1); }
  if (!SKIP_BUILD) buildBundle();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await launch(chromium);
  try {
    for (const seed of SEEDS) {
      const res = await runSeed(browser, seed);
      fs.writeFileSync(path.join(OUT_DIR, 'seed-' + seed + '.json'), JSON.stringify(res), 'utf8');
      console.log('[audyt] seed=' + seed + ' ZAPISANY (' + res.elapsedS + 's, gates='
        + res.gates.length + ', owners=' + res.owners.length + ')');
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
