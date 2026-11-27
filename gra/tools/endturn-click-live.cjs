'use strict';
// R-WEB-ENDTURN-CLICK-LIVE-Q1 (tag ENDCLICK): pomiar NA ŻYWO kliku „Zakończ turę” w turach 2–8 (maksimum).
// Każdy klik to page.mouse.click na środku button[data-end]. Po kliku czekamy do 60 s na zmianę numeru tury;
// ponowienia kliku co 20 s (do 3 ponowień). Przed każdym kliknięciem wykonujemy TYLKO zdjęcie blokad
// harnessu (zamknięcie modali, bitew, ofert AI, pokoju wymuszonego) — jak endturn-perf-probe.cjs.
// Zero haków zmieniających stan gry w pomiarze: odczyt DOM, flagi i snapshot (gateInfo tylko raz, po nieudanym pomiarze).
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
    barbariansLevel: 'trudny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'wysoki',
    kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'dlugi', landFractionPercent: 30,
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

// Stan tylko do odczytu, BEZ haków z efektami ubocznymi: NIE wołamy __nnsMeasureDebug.gateInfo()
// (canPlayerInitiateEndTurn loguje console.warn i wywołuje healStaleEndTurnBlockers). Odczyt:
// aria-disabled z DOM, endTurnInProgress przez isEndTurnInProgress() (zwraca flagę), numer tury przez getTurn,
// modale/bitwa przez DOM i battleState (oba tylko odczyt). canEnd NIE jest odczytywany w tym pomiarze.
async function readState(page) {
  return page.evaluate(() => {
    const b = document.querySelector('button[data-end]');
    const vis = sel => { const e = document.querySelector(sel); return !!e && e.offsetParent !== null; };
    const bs = window.__aiTradeWiringTestDebug.battleState();
    const nm = window.__nnsMeasureDebug;
    return {
      turn: window.__nnsMeasureDebug.snapshot().turn,
      eot: nm.isEndTurnInProgress(),
      aria: b ? b.getAttribute('aria-disabled') : 'NO_BUTTON',
      modalDiplo: vis('.civ-diplo-aud'), modalAmp: !!document.getElementById('civ-amp-title'),
      welcome: !!document.querySelector('#civ-welcome-screen-root'), techNotice: !!document.getElementById('civ-tech-discovery-notice-host'),
      battleOpen: !!(bs.preBattleOpen || bs.pendingAuto || bs.sceneOpen || bs.summaryOpen || bs.resolving),
      battle: { preBattleOpen: !!bs.preBattleOpen, pendingAuto: !!bs.pendingAuto, sceneOpen: !!bs.sceneOpen, summaryOpen: !!bs.summaryOpen, resolving: !!bs.resolving },
      pbOverlay: vis('.pb-overlay'),
    };
  });
}

async function preamble(page) {
  // Ekran powitalny (civ-welcome-screen) w turze zasłania przycisk; gracz go zamyka, więc zamykamy go też w harnessie.
  const welcomeClosed = await closeCivWelcome(page, 3).catch(() => -1);
  const closed = await closeModals(page);
  const battleRounds = await clearBattles(page);
  const seen = new Set();
  const offersRejected = await rejectAwaitingAiOffers(page, seen);
  const peace = await acceptForcedPeace(page, {}, null);
  return { closed, welcomeClosed, battleRounds, offersRejected: offersRejected ?? null, peace: peace ?? null };
}

// Odczyt numeru tury bez haka bramki: snapshot().turn (tylko odczyt, bez canPlayerInitiateEndTurn).
async function readTurn(page) {
  return page.evaluate(() => window.__nnsMeasureDebug.snapshot().turn);
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

// Próbka przycisku (tylko odczyt): aria-disabled, endTurnInProgress, czy punkt środka trafia w przycisk, czy ekran porażki.
async function sampleBtn(page) {
  return page.evaluate(() => {
    const b = document.querySelector('button[data-end]');
    if (!b) return { aria: 'NO_BUTTON', eot: null, turn: null, onButton: false, hitEl: null, lose: false };
    const r = b.getBoundingClientRect();
    const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const cls = n => (n && typeof n.className === 'string' ? n.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
    return {
      aria: b.getAttribute('aria-disabled'), eot: window.__nnsMeasureDebug.isEndTurnInProgress(),
      turn: window.__nnsMeasureDebug.snapshot().turn,
      onButton: !!(e && e.closest('button[data-end]')),
      hitEl: e ? e.tagName + (e.id ? '#' + e.id : '') + '.' + cls(e) : null,
      lose: !!document.querySelector('.vsc-overlay.lose'),
    };
  });
}

async function hitInfo(page) {
  const s = await sampleBtn(page);
  return { onButton: s.onButton, el: s.hitEl };
}

// Czeka, aż przycisk będzie aktywny i trafiony (bez efektów ubocznych); co ~5 s wykonuje tylko zdjęcie blokad harnessu.
async function waitEnabled(page, limitMs, preambleFn) {
  const t0 = Date.now();
  const samples = [];
  let k = 0;
  while (Date.now() - t0 <= limitMs) {
    if (k % 10 === 0) await preambleFn(page);
    k++;
    const smp = await sampleBtn(page);
    samples.push({ at: Date.now() - t0, ...smp });
    if (smp.lose) return { ok: false, reason: 'PORAZKA_GRACZA_EKRAN_LOSE', samples };
    if (smp.aria === 'false' && smp.eot === false && smp.onButton) return { ok: true, reason: 'aktywny', samples };
    await page.waitForTimeout(500);
  }
  return { ok: false, reason: 'NIE_AKTYWNY_W_LIMICIE', samples };
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

    let turn = await readTurn(page);
    log('start tura', turn);
    // Tury poza zakresem pomiaru (przed T_MIN) przechodzimy tym samym klikiem, bez zapisu.
    // PROTOKÓŁ (ENDCLICK r2): gracz klika dopiero, gdy przycisk jest AKTYWNY (aria-disabled=false),
    // endTurnInProgress=false i trafienie punktu środka przycisku to ten przycisk. Ponowny klik tylko po ponownym
    // aktywowaniu przycisku. Cała sekwencja próbkowana co ~500 ms (odczyt DOM + flaga, zero haków bramki).
    while (turn <= T_MAX) {
      const measuring = turn >= T_MIN;
      const turnBefore = turn;
      const preSt = await readState(page);
      const tStart = Date.now();
      windowLog = [];
      const cBefore = { ...counts };
      let attempts = 0;
      let changedAt = null;
      let outcome = null;
      const attemptLog = [];
      const phases = [];
      const postSamples = [];
      let gateDiag = null;
      while (attempts <= RETRIES && changedAt === null) {
        const w = await waitEnabled(page, attempts === 0 ? WAIT_MAX_MS : RETRY_EVERY_MS, preamble);
        phases.push({ attempt: attempts, reason: w.reason, samples: w.samples });
        if (!w.ok) { outcome = w.reason; break; }
        const hit = await hitInfo(page);
        const pt = await endButtonCenter(page);
        await page.mouse.click(pt.x, pt.y);
        attempts++;
        attemptLog.push({ at: Date.now() - tStart, hitEl: hit.el, onButton: hit.onButton });
        const tClick = Date.now();
        while (Date.now() - tClick <= WAIT_MAX_MS) {
          await page.waitForTimeout(500);
          const smp = await sampleBtn(page);
          postSamples.push({ at: Date.now() - tStart, ...smp });
          const nt = await readTurn(page);
          if (nt !== turn) { changedAt = Date.now() - tStart; turn = nt; break; }
          if (smp.lose) break;
        }
        if (changedAt === null && attempts > RETRIES) outcome = 'BRAK_ZMIANY_PO_PONOWIENIACH';
      }
      if (changedAt === null && outcome === null) outcome = 'BRAK_ZMIANY_PO_PONOWIENIACH';
      if (changedAt === null && outcome === 'BRAK_ZMIANY_PO_PONOWIENIACH') {
        // Diagnoza po nieudanym pomiarze (jedno wywołanie po zakończeniu pomiaru tej tury): bramka i stan.
        gateDiag = await page.evaluate(() => { const g = window.__nnsMeasureDebug.gateInfo(); return { canEnd: g.canEnd, gateBlokada: g.gate ? (g.gate.blokada ?? null) : null }; });
      }
      // (b) CONSOLE30: okno 30 s od pierwszego kliku (tura AI i początek następnej), tylko dla tur <= CONSOLE_TURN_MAX.
      if (CONSOLE30 && measuring && turnBefore <= CONSOLE_TURN_MAX) {
        const remain = 30000 - (Date.now() - tStart);
        if (remain > 0) await new Promise(r => setTimeout(r, remain));
      }
      const warnsWin = windowLog.slice(); // okno zamykamy PRZED odczytem stanu
      windowLog = null;
      const post = await readState(page);
      const blockedReasons = warnsWin.filter(l => /\[EndTurn\] blocked/.test(l)).map(l => l.slice(0, 140));
      const result = changedAt !== null ? 'tura_zmieniona' : (outcome || 'BRAK_ZMIANY');
      const row = {
        seed: SEED, turn: turnBefore, measuring, result, outcome,
        preState: preSt, attempts, attemptLog, phases,
        timeToChangeMs: changedAt, turnAfter: changedAt !== null ? turn : null,
        postSamples, post, gateDiag,
        endTurnBlockedInWindow: blockedReasons, consoleWindowTotal: warnsWin.length,
        consoleCountsDelta: {
          warn: counts.warn - cBefore.warn, error: counts.error - cBefore.error,
          log: counts.log - cBefore.log, endTurnBlockedWarn: counts.endTurnBlockedWarn - cBefore.endTurnBlockedWarn,
        },
        last20Console: ring.slice(),
      };
      if (CONSOLE30 && measuring && row.turn <= CONSOLE_TURN_MAX) {
        const rowB = { seed: SEED, state: 'b_po_kliknieciu_zakoncz_ture', turn: row.turn, windowMs: Date.now() - tStart,
          warnTotal: warnsWin.length, byType: row.consoleCountsDelta, sample: warnsWin.slice(0, 12) };
        fs.appendFileSync(DANE, JSON.stringify(rowB) + '\n');
        log('STAN_B', JSON.stringify({ t: row.turn, byType: rowB.byType }));
      }
      if (measuring) fs.appendFileSync(DANE, JSON.stringify(row) + '\n');
      log(JSON.stringify({ t: row.turn, measuring, result, attempts, changedAt, preAria: preSt.aria, preEot: preSt.eot, blocked: blockedReasons.length }));
      if (changedAt === null) { log('KONIEC: brak zmiany tury', row.turn, 'outcome', outcome); break; }
    }
    assert.deepEqual(errors, [], 'brak pageerror');
    log('KONIEC turn', turn, 'errors', errors.length);
  } finally {
    await browser.close();
  }
}
main().catch(e => { console.error('ENDCLICK FAIL', e.message); process.exit(1); });
