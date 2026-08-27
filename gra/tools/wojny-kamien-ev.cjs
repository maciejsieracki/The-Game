'use strict';
/**
 * wojny-kamien-ev.cjs — HARNESS POMIAROWY EVALUATORA
 * TEMAT: P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1 (runda 1)
 *
 * METODA (celowo INNA niz u Operatora):
 *  - Operator instrumentowal WEJSCIA bramy wojny w `ai.ts` i liczyl, ile ocen
 *    przechodzi kazdy warunek. To pomiar od strony DECYZJI.
 *  - Ten harness liczy od strony STANU GRY: co ture zrzuca cala mape
 *    `diplomacyRelations` i wylania wypowiedzenia wojny z DIFFU macierzy
 *    (para, ktora w turze N ma status 'wojna', a w N-1 nie miala).
 *    Dodatkowo zrzuca to, co widzi GRACZ (warEventLog = panel Wydarzen,
 *    collectWarsWithPlayer + collectKnownWarsBetweenOthers = panel dyplomacji)
 *    oraz census komend `wypowiedz_wojne` na granicy main.ts (raw vs po filtrze
 *    warstwy) — bez wchodzenia w ai.ts.
 *
 * Gra jedzie prawdziwa petla: `doStartGame()` + `triggerPlayerEndTurn()`
 * w zywym Chromium na artefakcie `vite build`. Zero zmian w `gra/src`.
 *
 * Uruchomienie (z gra/):
 *   node tools/wojny-kamien-ev.cjs --seeds 777,888 --turns 60 --out <kat> [--tag base]
 *   EV_MUT_CS=1 EV_MUT_LAYER=1 ... --dist /tmp/civ-ev-mut  (mutanty)
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const SEEDS = argOf('--seeds', '777').split(',').map(s => parseInt(s.trim(), 10));
const TURNS = parseInt(argOf('--turns', '60'), 10);
const OUT_DIR = path.resolve(argOf('--out', '/tmp/ev-wojny-out'));
const DIST = path.resolve(argOf('--dist', '/tmp/civ-ev-wojny'));
const TAG = argOf('--tag', 'base');
const SKIP_BUILD = process.argv.includes('--skip-build');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function build() {
  console.log('[ev] vite build -> ' + DIST + ' (EV_MUT_CS=' + (process.env.EV_MUT_CS || '0')
    + ' EV_MUT_LAYER=' + (process.env.EV_MUT_LAYER || '0') + ')');
  execFileSync('node', ['./node_modules/vite/bin/vite.js', 'build',
    '--config', 'tools/wojny-kamien-ev.vite.config.ts',
    '--outDir', DIST, '--emptyOutDir'], { cwd: GRA, stdio: 'inherit' });
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('brak index.html w ' + DIST);
}

const wait = ms => new Promise(r => setTimeout(r, ms));

/** Kompresja zrzutu — pelna macierz relacji to setki par na ture. */
function compact(s) {
  const warPairs = [];
  const playerPairs = [];
  const statusCount = {};
  for (const p of s.rel) {
    statusCount[p.s] = (statusCount[p.s] || 0) + 1;
    if (p.s === 'wojna') warPairs.push(p.k);
    const parts = p.k.split('_').map(Number);
    if (parts[0] === 0 || parts[1] === 0) {
      const oid = parts[0] === 0 ? parts[1] : parts[0];
      playerPairs.push({ o: oid, s: p.s, z: p.z, r: p.r, score: (p.z || 0) + (p.r || 0) });
    }
  }
  return {
    t: s.turn, era: s.era, gameOver: s.gameOver,
    warPairs: warPairs.sort(), playerPairs, statusCount,
    owners: s.owners, discovered: s.discovered, contactEstablished: s.contactEstablished,
    stonePending: s.stonePending, stoneCycle: s.stoneCycle, stoneActive: s.stoneActive,
    bronzePending: s.bronzePending, bronzeActive: s.bronzeActive,
    warEvents: s.warEvents,
    panelWarsWithPlayer: s.panelWarsWithPlayer,
    panelWarsBetweenOthers: s.panelWarsBetweenOthers,
  };
}

async function runSeed(browser, seed) {
  const t0 = Date.now();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleLines = [];
  page.on('console', m => {
    const t = m.text();
    if (/WYMUSZONA-WOJNA|wypowiada|wypowiedzia|ELIMINACJA/i.test(t)) consoleLines.push(t.slice(0, 300));
  });
  page.on('pageerror', e => consoleLines.push('PAGEERROR: ' + String(e).slice(0, 300)));

  await page.goto('file://' + path.join(DIST, 'index.html'), { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__ev && window.__ev.ready, undefined, { timeout: 180000 });
  await page.evaluate(() => { window.__EV__ = { on: true, cmd: [] }; });

  const params = await page.evaluate(() => {
    const p = window.__ev.params();
    return {
      difficulty: p.difficulty, mapSize: p.mapSize, worldType: p.worldType, epochId: p.epochId,
      speed: p.speed, civTypesCount: p.civTypesCount, cityStatesCount: p.cityStatesCount,
      civId: p.civId, landFractionPercent: p.landFractionPercent,
      barbariansLevel: p.advanced && p.advanced.barbariansLevel,
      battleAlwaysManual: p.advanced && p.advanced.battleAlwaysManual,
    };
  });
  console.log('[ev] seed=' + seed + ' params=' + JSON.stringify(params));

  await page.evaluate(s => window.__ev.start(s), seed);
  await page.waitForFunction(() => {
    const t = window.__ev.tick();
    return t.cities > 0 || window.__ev.blockers().awaitingFirstCity;
  }, undefined, { timeout: 300000 });
  const founded = await page.evaluate(() => window.__ev.foundFirstCity());
  console.log('[ev] seed=' + seed + ' pierwsze miasto: ' + founded);
  await wait(500);

  const snaps = [];
  const notes = [];
  let stuck = 0;
  // Ile razy harness musial odblokowac koniec tury (`resetEndTurnBlockers` kasuje m.in.
  // `aiCmdResume`, wiec to INGERENCJA — musi byc policzona i zaraportowana, nie przemilczana).
  let unblockCount = 0;
  for (let i = 0; i <= TURNS; i++) {
    const s = compact(await page.evaluate(() => window.__ev.snap()));
    snaps.push(s);
    if (s.gameOver) { notes.push({ t: s.t, note: 'gameOver' }); break; }
    if (i === TURNS) break;
    const b = await page.evaluate(() => window.__ev.blockers());
    if (b.preBattleOpen || b.pendingAutoPreBattle) {
      unblockCount++;
      notes.push({ t: s.t, note: 'unblock', b });
      await page.evaluate(() => window.__ev.unblock());
      await wait(250);
    }
    await page.evaluate(() => window.__ev.endTurn());
    const target = s.t + 1;
    try {
      await page.waitForFunction(t => {
        const x = window.__ev.tick();
        return x.turn >= t && !x.endTurnInProgress;
      }, target, { timeout: 240000, polling: 500 });
      stuck = 0;
    } catch (e) {
      notes.push({ t: s.t, note: 'TIMEOUT', blockers: await page.evaluate(() => window.__ev.blockers()) });
      await page.evaluate(() => window.__ev.unblock());
      await wait(1000);
      stuck++;
      if (stuck >= 3) { notes.push({ note: 'ABORT po 3 zwisach' }); break; }
    }
    if ((i + 1) % 5 === 0) {
      console.log('[ev] seed=' + seed + ' tura=' + s.t + ' wojny=' + JSON.stringify(s.warPairs)
        + ' pending=' + JSON.stringify(s.stonePending)
        + ' t=' + Math.round((Date.now() - t0) / 1000) + 's');
      dump(seed, { partial: true, seed, tag: TAG, params, snaps, notes, consoleLines, unblockCount });
    }
  }

  // Census komend — agregat per tura + pelne rekordy z komenda wojny.
  const cmd = await page.evaluate(() => {
    const A = window.__EV__.cmd;
    const byTurn = {};
    const warRecords = [];
    for (const r of A) {
      const k = String(r.t);
      if (!byTurn[k]) byTurn[k] = { t: r.t, owners: 0, layerFull: 0, layerSimpl: 0, layerPre: 0,
        rawWarTotal: 0, rawWarVsPlayer: 0, keptWarTotal: 0, keptWarVsPlayer: 0 };
      const a = byTurn[k];
      a.owners++;
      if (r.l === 'full') a.layerFull++;
      else if (r.l === 'simplified') a.layerSimpl++;
      else a.layerPre++;
      a.rawWarTotal += r.rw.length;
      a.rawWarVsPlayer += r.rw.filter(x => x === '0').length;
      a.keptWarTotal += r.kw.length;
      a.keptWarVsPlayer += r.kw.filter(x => x === '0').length;
      if (r.rw.length > 0 || r.kw.length > 0) warRecords.push(r);
    }
    return {
      total: A.length,
      byTurn: Object.keys(byTurn).map(k => byTurn[k]).sort((x, y) => x.t - y.t),
      warRecords,
    };
  });

  await page.close();
  return { seed, tag: TAG, params, turnsRequested: TURNS, elapsedS: Math.round((Date.now() - t0) / 1000),
    founded, snaps, notes, consoleLines, cmd, unblockCount };
}

function dump(seed, obj) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, TAG + '-seed-' + seed + '.json'), JSON.stringify(obj), 'utf8');
}

async function main() {
  let chromium;
  try { ({ chromium } = require(path.resolve(GRA, 'node_modules', 'playwright'))); }
  catch (e) { console.error('[ev] brak playwright'); process.exit(1); }
  if (!SKIP_BUILD) build();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage', '--js-flags=--max-old-space-size=3072'];
  let browser;
  try { browser = await chromium.launch({ headless: true, args }); }
  catch (e) { browser = await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args }); }
  try {
    for (const seed of SEEDS) {
      const res = await runSeed(browser, seed);
      dump(seed, res);
      const last = res.snaps[res.snaps.length - 1];
      console.log('[ev] seed=' + seed + ' ZAPISANY (' + res.elapsedS + 's, tur=' + last.t
        + ', wojny=' + JSON.stringify(last.warPairs) + ', cmdRec=' + res.cmd.total + ')');
    }
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exit(1); });
