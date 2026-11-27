'use strict';
// R-WEB-ENDTURN-SYNC-PERF-Q1 (tag ENDPERF): pomiar kosztu cyklu syncEndTurnState (bottomBarHud.ts, co 500 ms),
// konsoli w oknie 30 s oraz klatek rAF. Konfiguracja MAKSYMALNA (Trudny, barbarzyncy Trudny, dyplomacja trudna,
// kultura trudna, Wysoki x4 ludnosc/koszt jednostek). Wyłącznie odczyt haków i prawdziwe zdarzenia myszy.
//
// Uruchomienie (z gra/): node tools/endturn-perf-probe.cjs <katalog_poza_repo> <seed> <tury_pomiaru=1,30,60> [max_tur_na_segment=25]
// Wynik: <katalog>/endperf-s<seed>.jsonl (jeden wiersz na checkpoint) + log na stdout. Nic nie jest commitowane.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const { resolveChromePath } = require('./_chrome-path.cjs');
const { closeCivWelcome } = require('./_live-ready.cjs');
const { TECH_SIDE_CLOSE_SEL, TECH_MAIN_CLOSE_SEL } = require('./measure-close-modals.cjs');
const { rejectAwaitingAiOffers } = require('./measure-reject-offers.cjs');
const { acceptForcedPeace } = require('./measure-forced-peace.cjs');

const GRA = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || '/nonexistent-out');
const SEED = parseInt(process.argv[3] || '4242', 10);
const CHECK = (process.argv[4] || '1,30,60').split(',').map(x => parseInt(x, 10));
const SEG = parseInt(process.argv[5] || '25', 10);
if (!process.argv[2] || OUT.startsWith(path.resolve(GRA, '..')) || !Number.isFinite(SEED)) {
  console.error('Uzycie: <katalog_poza_repo> <seed> [tury=1,30,60] [seg=25]'); process.exit(2);
}
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const DANE = path.join(OUT, `endperf-s${SEED}.jsonl`);
const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: 'Maly', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: SEED,
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 4, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: {
    barbariansLevel: 'trudny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
    kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30,
    landFractionCustom: false, cityStateDifficultyOverride: 'normal', cityLimitBase: 10,
    diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
  },
  villageRewardsEnabled: true,
};

function stats(xs) {
  const s = xs.slice().sort((a, b) => a - b);
  const pick = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { n: s.length, median: +pick(0.5).toFixed(4), p95: +pick(0.95).toFixed(4), max: +s[s.length - 1].toFixed(4) };
}

async function closeModals(page) {
  await page.evaluate(({ side, main }) => {
    const aud = document.querySelector('.civ-diplo-aud');
    if (aud && aud.style.display !== 'none') { const b = aud.querySelector('.civ-diplo-aud-back'); if (b) b.click(); }
    if (document.getElementById('civ-amp-title')) { const b = document.querySelector('.civ-amp-btn-sep'); if (b) b.click(); }
    const tn = document.getElementById('civ-tech-discovery-notice-host');
    if (tn) { const b = tn.querySelector(side) || tn.querySelector(main); if (b) b.click(); }
  }, { side: TECH_SIDE_CLOSE_SEL, main: TECH_MAIN_CLOSE_SEL });
}

async function clearBattles(page) {
  for (let k = 0; k < 200; k++) {
    const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState());
    if (!bs.preBattleOpen && !bs.pendingAuto && !bs.sceneOpen && !bs.summaryOpen && !bs.resolving) break;
    await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug;
      const b = document.querySelector('.pb-overlay [data-act="auto"]');
      if (b) { b.click(); return; }
      if (!h.closeBattleSummary()) h.flushBattles();
    });
    await new Promise(r => setTimeout(r, 150));
  }
}

// Pomiar czasu wywołania bramki tury (gateInfo zawiera canPlayerInitiateEndTurn) w stanie gry. Hak tylko odczyt.
async function measureGate(page) {
  return page.evaluate(() => {
    const N = 200; const times = [];
    let canEnd = null;
    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      const gi = window.__nnsMeasureDebug.gateInfo();
      times.push(performance.now() - t0);
      canEnd = gi.canEnd;
    }
    // Srednia z partii 1000 wywolan: rozdzielczosc performance.now() (~0,1 ms) nie pozwala zmierzyc
    // pojedynczego wywolania, wiec sredni koszt liczymy jako (czas partii)/1000. Tylko odczyt.
    const B = 1000;
    const tb0 = performance.now();
    for (let i = 0; i < B; i++) window.__nnsMeasureDebug.gateInfo();
    const batchMeanMs = (performance.now() - tb0) / B;
    return { times, canEnd, batchMeanMs, batchN: B };
  });
}

// Liczba wpisow konsoli i rAF w oknie 10 s (bez zmiany stanu gry).
async function observeWindow(page, sec, consoleCounts) {
  consoleCounts.length = 0;
  const frames = await page.evaluate((ms) => new Promise(resolve => {
    const deltas = []; let last = null; const t0 = performance.now();
    function step(ts) {
      if (last !== null) deltas.push(ts - last);
      last = ts;
      if (performance.now() - t0 < ms) requestAnimationFrame(step); else resolve(deltas);
    }
    requestAnimationFrame(step);
  }), sec * 1000);
  return { frames: stats(frames), frameCount: frames.length };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  if (fs.existsSync(DANE)) fs.unlinkSync(DANE);
  const html = path.join(OUT, 'Gra-LIVE.html');
  if (!fs.existsSync(html)) execFileSync('node', [LIVE_TOOL, OUT], { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath() || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await (await browser.newContext()).newPage();
  const errors = [];
  let consoleWin = null; // tablica wpisow w aktualnym oknie
  let clusterStartSeen = 0;
  const consoleAll = { warn: 0, error: 0, log: 0, endTurnBlockedWarn: 0 };
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {
    const t = m.text();
    if (/\[ClusterStart\]/.test(t)) clusterStartSeen++;
    if (m.type() === 'warning') consoleAll.warn++;
    if (m.type() === 'error') consoleAll.error++;
    if (m.type() === 'log') consoleAll.log++;
    if (/\[EndTurn\] blocked/.test(t)) consoleAll.endTurnBlockedWarn++;
    if (consoleWin) consoleWin.push(m.type() + ': ' + t.slice(0, 120));
  });
  const rows = [];
  try {
    await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__settingsLive, null, { timeout: 60000 });
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), MAX_PARAMS);
    const t0 = Date.now();
    while (clusterStartSeen < 1 && Date.now() - t0 < 600000) await new Promise(r => setTimeout(r, 250));
    await page.waitForFunction(() => window.__nnsMeasureDebug.awaitingFirstCity() === true, null, { timeout: 600000, polling: 500 });
    assert.ok(await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity()), 'foundFirstCity=true');
    await page.waitForTimeout(3000);
    await closeCivWelcome(page);

    let turn = await page.evaluate(() => window.__nnsMeasureDebug.gateInfo().turn);
    for (const target of CHECK) {
      // segmenty <= SEG tur: pasywne zakonczenie tury prawdziwym klikiem, az do celu
      while (turn < target) {
        const segEnd = Math.min(target, turn + SEG);
        while (turn < segEnd) {
          await closeModals(page);
          await clearBattles(page);
          const seen = new Set();
          await rejectAwaitingAiOffers(page, seen);
          await acceptForcedPeace(page, {}, null);
          const rect = await page.evaluate(() => {
            const b = document.querySelector('button[data-end]');
            if (!b) return null;
            const r = b.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          });
          if (!rect) throw new Error('brak przycisku Zakończ turę w turze ' + turn);
          const hit = await page.evaluate(({ x, y }) => {
            const e = document.elementFromPoint(x, y);
            return e ? (e.tagName + '.' + String(e.className).slice(0, 60) + (e.closest('[data-end]') ? ' [data-end]' : '')) : null;
          }, rect);
          console.log('ENDPERF HIT', JSON.stringify(hit));
          await page.mouse.click(rect.x, rect.y);
          const tStart = Date.now();
          let nt = turn;
          while (Date.now() - tStart < 240000) {
            await page.waitForTimeout(500);
            nt = await page.evaluate(() => window.__nnsMeasureDebug.gateInfo().turn);
            if (nt !== turn) break;
          }
          if (nt === turn) {
            const diag = await page.evaluate(() => {
              const gi = window.__nnsMeasureDebug.gateInfo();
              const b = document.querySelector('button[data-end]');
              return { canEnd: gi.canEnd, gateBlok: gi.gate && gi.gate.blokada, aria: b ? b.getAttribute('aria-disabled') : null,
                txt: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 300), battle: window.__aiTradeWiringTestDebug.battleState() };
            });
            console.log('ENDPERF DIAG', JSON.stringify(diag));
            throw new Error('tura nie zmienila sie w ciagu 120 s (tura ' + turn + ')');
          }
          turn = nt;
        }
        // Chromium SIGSEGV: segment konczy sie tutaj; kolejny segment startuje od nowego page.evaluate
      }
      // Checkpoint: pomiar
      await closeModals(page);
      await clearBattles(page);
      const gate = await measureGate(page);
      // okno 10 s: liczba wywolan cyklu nie jest mierzona bezposrednio; pomiar konsoli i klatek
      consoleWin = [];
      const before = { ...consoleAll };
      const frames = await observeWindow(page, 10, consoleWin);
      const win30 = [];
      consoleWin = win30;
      const frames30 = await observeWindow(page, 20, win30);
      const row = {
        seed: SEED, turn, target,
        canEndTurnProxyMs: stats(gate.times), canEnd: gate.canEnd,
        gateBatchMeanMs: +gate.batchMeanMs.toFixed(5), gateBatchN: gate.batchN,
        frames10s: frames, frames20s: frames30,
        consoleLast30s: { total: win30.length, sample: win30.slice(0, 10) },
        consoleCountsDelta: {
          warn: consoleAll.warn - before.warn, error: consoleAll.error - before.error,
          log: consoleAll.log - before.log, endTurnBlockedWarn: consoleAll.endTurnBlockedWarn - before.endTurnBlockedWarn,
        },
      };
      consoleWin = null;
      rows.push(row);
      fs.appendFileSync(DANE, JSON.stringify(row) + '\n');
      console.log('ENDPERF', JSON.stringify(row));
    }
    assert.deepEqual(errors, [], 'brak pageerror');
  } finally {
    await browser.close();
  }
}
main().catch(e => { console.error('ENDPERF FAIL', e.message); process.exit(1); });
