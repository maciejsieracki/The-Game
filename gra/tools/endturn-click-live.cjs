'use strict';
// R-WEB-ENDTURN-CLICK-LIVE-Q1 (tag ENDCLICK): pomiar NA ŻYWO kliku „Zakończ turę” w turach 2–8 (maksimum).
// Każdy klik to page.mouse.click na środku button[data-end]. Po kliku czekamy do 60 s na zmianę numeru tury;
// ponowienia kliku co 20 s (do 3 ponowień). Przed każdym kliknięciem wykonujemy TYLKO zdjęcie blokad
// harnessu (zamknięcie modali, bitew, ofert AI, pokoju wymuszonego) — jak endturn-perf-probe.cjs.
// Zero haków zmieniających stan gry: odczyt __nnsMeasureDebug.gateInfo() i DOM.
//
// Uruchomienie (z gra/): node tools/endturn-click-live.cjs <katalog_poza_repo> <seed> [bundle_html] [tura_min=2] [tura_max=8]
//   bundle_html (opcjonalnie): gotowy Gra-LIVE.html; bez niego bundluje bieżący katalog gra/ do <katalog>/Gra-LIVE.html.
// Wynik: <katalog>/endclick-s<seed>.jsonl (jeden wiersz na turę pomiaru) + log ENDCLICK na stdout.
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
const BUNDLE_HTML = process.argv[4] && process.argv[4] !== '-' ? path.resolve(process.argv[4]) : null;
const T_MIN = parseInt(process.argv[5] || '2', 10);
const T_MAX = parseInt(process.argv[6] || '8', 10);
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const DANE = path.join(OUT, `endclick-s${SEED}.jsonl`);
const RETRY_EVERY_MS = 20000;
const RETRIES = 3;
const WAIT_MAX_MS = 60000;
// CONSOLE30=1: dodatkowe okna 30 s konsoli (stan a: przed założeniem miasta; stan b: po kliku, tury <= CONSOLE_TURN_MAX).
const CONSOLE30 = process.env.CONSOLE30 === '1';
const CONSOLE_TURN_MAX = parseInt(process.env.CONSOLE_TURN_MAX || '4', 10);

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

async function closeModals(page) {
  return page.evaluate(({ side, main }) => {
    const closed = [];
    const aud = document.querySelector('.civ-diplo-aud');
    if (aud && aud.style.display !== 'none') { const b = aud.querySelector('.civ-diplo-aud-back'); if (b) { b.click(); closed.push('diplo-aud'); } }
    if (document.getElementById('civ-amp-title')) { const b = document.querySelector('.civ-amp-btn-sep'); if (b) { b.click(); closed.push('amp'); } }
    const tn = document.getElementById('civ-tech-discovery-notice-host');
    if (tn) { const b = tn.querySelector(side) || tn.querySelector(main); if (b) { b.click(); closed.push('tech-notice'); } }
    return closed;
  }, { side: TECH_SIDE_CLOSE_SEL, main: TECH_MAIN_CLOSE_SEL });
}

async function clearBattles(page) {
  let rounds = 0;
  for (let k = 0; k < 200; k++) {
    const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState());
    if (!bs.preBattleOpen && !bs.pendingAuto && !bs.sceneOpen && !bs.summaryOpen && !bs.resolving) break;
    rounds++;
    await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug;
      const b = document.querySelector('.pb-overlay [data-act="auto"]');
      if (b) { b.click(); return; }
      if (!h.closeBattleSummary()) h.flushBattles();
    });
    await new Promise(r => setTimeout(r, 150));
  }
  return rounds;
}

// Stan tylko do odczytu: bramka, przycisk, widoczne modale/ekrany.
async function readState(page) {
  return page.evaluate(() => {
    const gi = window.__nnsMeasureDebug.gateInfo();
    const b = document.querySelector('button[data-end]');
    const vis = sel => { const e = document.querySelector(sel); return !!e && e.offsetParent !== null; };
    const bs = window.__aiTradeWiringTestDebug.battleState();
    return {
      turn: gi.turn, canEnd: gi.canEnd, gateBlokada: gi.gate ? (gi.gate.blokada ?? null) : null,
      aria: b ? b.getAttribute('aria-disabled') : 'NO_BUTTON',
      modalDiplo: vis('.civ-diplo-aud'), modalAmp: !!document.getElementById('civ-amp-title'),
      welcome: !!document.querySelector('#civ-welcome-screen-root'), techNotice: !!document.getElementById('civ-tech-discovery-notice-host'),
      battleOpen: !!(bs.preBattleOpen || bs.pendingAuto || bs.sceneOpen || bs.summaryOpen || bs.resolving),
      battle: { preBattleOpen: !!bs.preBattleOpen, pendingAuto: !!bs.pendingAuto, sceneOpen: !!bs.sceneOpen, summaryOpen: !!bs.summaryOpen, resolving: !!bs.resolving },
      pbOverlay: vis('.pb-overlay'), gallery: false,
    };
  });
}

async function preamble(page) {
  const closed = await closeModals(page);
  const battleRounds = await clearBattles(page);
  const seen = new Set();
  const offersRejected = await rejectAwaitingAiOffers(page, seen);
  const peace = await acceptForcedPeace(page, {}, null);
  return { closed, battleRounds, offersRejected: offersRejected ?? null, peace: peace ?? null };
}

// Odczyt numeru tury BEZ wywołania bramki (gateInfo() woła canPlayerInitiateEndTurn() z console.warn,
// więc zapytania w oknie pomiaru zaśmiecałyby konsolę). Fallback tylko gdy hak getTurn nie istnieje.
async function readTurn(page) {
  return page.evaluate(() => {
    const t = window.__turnSlowdownTestDebug;
    if (t && typeof t.getTurn === 'function') return t.getTurn();
    return window.__nnsMeasureDebug.gateInfo().turn;
  });
}

async function endButtonCenter(page) {
  return page.evaluate(() => {
    const b = document.querySelector('button[data-end]');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
}

async function hitTest(page, pt) {
  return page.evaluate(({ x, y }) => {
    const e = document.elementFromPoint(x, y);
    return e ? (e.tagName + '.' + String(e.className).slice(0, 60) + (e.closest('[data-end]') ? ' [data-end]' : '')) : null;
  }, pt);
}

async function main() {
  if (!process.argv[2] || OUT.startsWith(path.resolve(GRA, '..')) || !Number.isFinite(SEED)) {
    console.error('Uzycie: <katalog_poza_repo> <seed> [bundle_html|-] [tura_min=2] [tura_max=8]'); process.exit(2);
  }
  fs.mkdirSync(OUT, { recursive: true });
  if (fs.existsSync(DANE)) fs.unlinkSync(DANE);
  let html = BUNDLE_HTML;
  if (!html) {
    html = path.join(OUT, 'Gra-LIVE.html');
    if (!fs.existsSync(html)) execFileSync('node', [LIVE_TOOL, OUT], { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  }
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath() || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await (await browser.newContext()).newPage();
  const errors = [];
  const ring = []; // ostatnie wpisy konsoli
  let clusterStartSeen = 0;
  let windowLog = null; // tablica wpisow w aktualnym oknie pomiaru
  const counts = { warn: 0, error: 0, log: 0, endTurnBlockedWarn: 0 };
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {
    const t = m.text();
    const line = `${Date.now()} ${m.type()}: ${t.slice(0, 160)}`;
    if (/\[ClusterStart\]/.test(t)) clusterStartSeen++;
    if (m.type() === 'warning') counts.warn++;
    if (m.type() === 'error') counts.error++;
    if (m.type() === 'log') counts.log++;
    if (/\[EndTurn\] blocked/.test(t)) counts.endTurnBlockedWarn++;
    ring.push(line); if (ring.length > 20) ring.shift();
    if (windowLog) windowLog.push(line);
  });
  const log = (...a) => console.log('ENDCLICK', ...a);
  try {
    await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__settingsLive, null, { timeout: 60000 });
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), MAX_PARAMS);
    const t0 = Date.now();
    while (clusterStartSeen < 1 && Date.now() - t0 < 600000) await new Promise(r => setTimeout(r, 250));
    log('ClusterStart po', Date.now() - t0, 'ms');
    await page.waitForFunction(() => window.__nnsMeasureDebug.awaitingFirstCity() === true, null, { timeout: 600000, polling: 500 });
    // (a) PRZED założeniem miasta: 30 s okno na konsolę, tylko gdy gra nadal czeka na pierwsze miasto (odczyt bez bramki).
    if (CONSOLE30) {
      const cA = { ...counts }; const winA = []; windowLog = winA;
      const tA = Date.now(); let stillAwaiting = true;
      while (Date.now() - tA < 30000) {
        await page.waitForTimeout(1000);
        stillAwaiting = await page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity() === true);
        if (!stillAwaiting) break;
      }
      windowLog = null;
      const rowA = { seed: SEED, state: 'a_przed_zalozeniem_miasta', windowMs: Date.now() - tA, stillAwaiting,
        warnTotal: winA.length, byType: { warn: counts.warn - cA.warn, error: counts.error - cA.error, log: counts.log - cA.log, endTurnBlockedWarn: counts.endTurnBlockedWarn - cA.endTurnBlockedWarn }, sample: winA.slice(0, 12) };
      fs.appendFileSync(DANE, JSON.stringify(rowA) + '\n');
      log('STAN_A', JSON.stringify(rowA.byType), 'stillAwaiting', stillAwaiting);
    }
    assert.ok(await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity()), 'foundFirstCity=true');
    await page.waitForTimeout(3000);
    await closeCivWelcome(page);

    let turn = await page.evaluate(() => window.__nnsMeasureDebug.gateInfo().turn);
    log('start tura', turn);
    // Tury poza zakresem pomiaru (przed T_MIN) przechodzimy tym samym klikiem, bez zapisu.
    while (turn <= T_MAX) {
      const measuring = turn >= T_MIN;
      await preamble(page);
      const st0 = await readState(page);
      const rowBase = { seed: SEED, turn, measuring, pre: st0 };
      const pt = await endButtonCenter(page);
      if (!pt) throw new Error('brak przycisku Zakończ turę w turze ' + turn);
      const hit = await hitTest(page, pt);
      const tStart = Date.now();
      windowLog = [];
      const cBefore = { ...counts };
      let attempts = 0;
      let changedAt = null;
      let nextRetryAt = 0;
      const attemptLog = [];
      while (Date.now() - tStart <= WAIT_MAX_MS) {
        const el = Date.now() - tStart;
        if (el >= nextRetryAt && attempts <= RETRIES) {
          if (attempts > 0) { await preamble(page); }
          const cur = await endButtonCenter(page);
          if (cur) {
            const h = await hitTest(page, cur);
            await page.mouse.click(cur.x, cur.y);
            attempts++;
            attemptLog.push({ at: el, hit: h });
          }
          nextRetryAt = el + RETRY_EVERY_MS;
        }
        await page.waitForTimeout(500);
        const nt = await readTurn(page);
        if (nt !== turn) { changedAt = Date.now() - tStart; turn = nt; break; }
      }
      // (b) PO kliknięciu: 30 s od kliku (tura AI i początek kolejnej), tylko dla tur <= CONSOLE_TURN_MAX.
      if (CONSOLE30 && measuring && rowBase.turn <= CONSOLE_TURN_MAX) {
        const remain = 30000 - (Date.now() - tStart);
        if (remain > 0) await new Promise(r => setTimeout(r, remain));
      }
      const warnsWin = windowLog.slice(); // okno zamykamy PRZED odczytem stanu (gateInfo loguje ostrzezenia)
      windowLog = null;
      const winMs = Date.now() - tStart;
      const post = await readState(page);
      const blockedReasons = warnsWin.filter(l => /\[EndTurn\] blocked/.test(l)).map(l => l.slice(0, 140));
      const row = {
        ...rowBase,
        hit,
        result: changedAt !== null ? 'tura_zmieniona' : 'BRAK_ZMIANY',
        attempts,
        attemptLog,
        timeToChangeMs: changedAt,
        turnAfter: changedAt !== null ? turn : null,
        windowWaitMs: Date.now() - tStart,
        post,
        endTurnBlockedInWindow: blockedReasons,
        consoleWindowTotal: warnsWin.length,
        consoleCountsDelta: {
          warn: counts.warn - cBefore.warn, error: counts.error - cBefore.error,
          log: counts.log - cBefore.log, endTurnBlockedWarn: counts.endTurnBlockedWarn - cBefore.endTurnBlockedWarn,
        },
        last20Console: ring.slice(),
      };
      if (CONSOLE30 && measuring && rowBase.turn <= CONSOLE_TURN_MAX) {
        const rowB = { seed: SEED, state: 'b_po_kliknieciu_zakoncz_ture', turn: rowBase.turn, windowMs: winMs,
          warnTotal: warnsWin.length, byType: row.consoleCountsDelta, sample: warnsWin.slice(0, 12) };
        fs.appendFileSync(DANE, JSON.stringify(rowB) + '\n');
        log('STAN_B', JSON.stringify({ t: rowBase.turn, byType: rowB.byType, windowMs: winMs }));
      }
      if (measuring) { fs.appendFileSync(DANE, JSON.stringify(row) + '\n'); }
      log(JSON.stringify({ t: rowBase.turn, measuring, result: row.result, attempts, changedAt, aria: st0.aria, canEnd: st0.canEnd, blocked: blockedReasons.length }));
      if (changedAt === null) {
        log('BRAK ZMIANY tury', rowBase.turn, 'post', JSON.stringify(post));
        break;
      }
    }
    assert.deepEqual(errors, [], 'brak pageerror');
    log('KONIEC turn', turn, 'errors', errors.length);
  } finally {
    await browser.close();
  }
}
main().catch(e => { console.error('ENDCLICK FAIL', e.message); process.exit(1); });
