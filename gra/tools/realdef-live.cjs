'use strict';
// R-WEB-EARLY-DEFENSE-REALISTIC-Q1 (tag REALDEF): przeżywalność pierwszych 20 tur przy GRZE ROZSĄDNEGO GRACZA
// na MAKSIMUM (Trudny / trudna / Wysoki ×4 / kultura trudny / barbarzyńcy TRUDNY), żywa gra w Chromium.
// Bazuje na runnerze defeat-cause-live.cjs (ta sama konfiguracja startu, to samo zamknięcie ekranów,
// ta sama bramka tury), różnice:
//  - polityka p0 = pasywny (kontrola, jak DEFEAT);
//  - p1 (budowa jednostki obronnej) ZABLOKOWANA w tym runnerze: karta „Rekrutuj” nie jest dostępna w widoku miasta
//    (brak kart w panelu), a jedyny hak zakupu (__siegeBlockTestDebug.tryPurchase) kupuje PIERWSZĄ jednostkę
//    z listy (w praktyce cywilną Zwiadowcę, nie wojskową); wybór konkretnej jednostki wymagałby zmiany main.ts
//    (poza allowlistą). Patrz raport w dyspozycje/autobot/runs/R-WEB-EARLY-DEFENSE-REALISTIC-Q1/10-operator-claude.md.
//  - p2 / p3 NIE są zaimplementowane (NIE ZMIERZONO).
// Uruchomienie (z gra/): node tools/realdef-live.cjs <katalog_poza_repo> p0 <seed> [tury=20]
// Surowy log: linie `REALDEF <json>` w pliku <katalog>/realdef-<polityka>-s<seed>.txt. Jeden wiersz wyniku
// na przebieg: linia `REALDEF {"kind":"result",...}`; po zakończeniu runner dopisuje ją też do <katalog>/dane.jsonl.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const { resolveChromePath } = require('./_chrome-path.cjs');
const { closeCivWelcome, prepareEndTurnGate } = require('./_live-ready.cjs');
const { TECH_SIDE_CLOSE_SEL, TECH_MAIN_CLOSE_SEL } = require('./measure-close-modals.cjs');
const { rejectAwaitingAiOffers } = require('./measure-reject-offers.cjs');
const { acceptForcedPeace } = require('./measure-forced-peace.cjs');

const GRA = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || '/nonexistent-out');
const POLICY = process.argv[3];
const SEED = parseInt(process.argv[4] || '4242', 10);
const TURNS = parseInt(process.argv[5] || '20', 10);
if (!process.argv[2] || OUT.startsWith(path.resolve(GRA, '..')) || POLICY !== 'p0' || !Number.isFinite(SEED)) {
  console.error('Uzycie: <katalog_poza_repo> p0 <seed> [tury]  (p1 zablokowany: brak hooka zakupu konkretnej jednostki)'); process.exit(2);
}
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const LOG = path.join(OUT, `realdef-${POLICY}-s${SEED}.txt`);
const DANE = path.join(OUT, 'dane.jsonl');
// Maksimum (jak DEFEAT r2): barbarzyńcy TRUDNY. Nadpisanie tylko do odtworzenia starych danych.
const BARB_LEVEL = process.env.DEFEAT_BARB_LEVEL || 'trudny';
const ADV = {
  barbariansLevel: BARB_LEVEL, battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
  kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30,
  landFractionCustom: false, cityStateDifficultyOverride: 'normal', cityLimitBase: 10,
  diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
};
const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: 'Maly', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: SEED,
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 4, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: ADV,
  villageRewardsEnabled: true,
};

function logLine(obj) {
  const line = 'REALDEF ' + JSON.stringify(obj);
  fs.appendFileSync(LOG, line + '\n');
  console.log(line);
}

const KEEP_RE = /Diag|Load\]|Save|Zapis|Victory|Oblezenie|[Bb]itw|[Bb]attle|zdob|[Pp]odb|[Bb]arbar|[Ww]ojn|[Ww]ar|[Cc]ession|[Cc]ytad|[Bb]unt|[Rr]ebel|Autosave\] rotacyjny|Ekonomia\] Tura/;
const MILITARY_EXCL = new Set(['zwiadowca', 'osadnik', 'robotnik']);

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
  let n = 0;
  for (let k = 0; k < 200; k++) {
    const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState());
    if (!bs.preBattleOpen && !bs.pendingAuto && !bs.sceneOpen && !bs.summaryOpen && !bs.resolving) break;
    n++;
    await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug;
      const b = document.querySelector('.pb-overlay [data-act="auto"]');
      if (b) { b.click(); return; }
      if (!h.closeBattleSummary()) h.flushBattles();
    });
    await new Promise(r => setTimeout(r, 150));
  }
  return n;
}

async function probe(page, trackIds) {
  return page.evaluate((ids) => {
    const all = window.__defeatTestDebug.cityThreatProbe();
    const tracked = all.filter(c => ids.includes(c.id));
    const others = all.filter(c => !ids.includes(c.id)).map(c => ({ id: c.id, owner: c.ownerId, q: c.q, r: c.r }));
    return { turn: window.__nnsMeasureDebug.gateInfo().turn, gameOver: window.__defeatTestDebug.isGameOver(), tracked, otherCities: others.length, battle: window.__aiTradeWiringTestDebug.battleState() };
  }, trackIds);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  if (fs.existsSync(LOG)) fs.unlinkSync(LOG);
  const html = path.join(OUT, 'Gra-LIVE.html');
  if (!fs.existsSync(html)) execFileSync('node', [LIVE_TOOL, OUT], { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath() || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const endTurnBlocks = [];
  page.on('console', m => {
    const t = m.text();
    if (m.type() === 'warning' && /^\[EndTurn\] blocked/.test(t)) endTurnBlocks.push(t);
    if (KEEP_RE.test(t)) logLine({ kind: 'console', type: m.type(), text: t.slice(0, 260) });
  });
  const run = { policy: POLICY, seed: SEED, adv: ADV };
  let completed = 0;
  let trackIds = [];
  let firstDefender = null;
  try {
    await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__settingsLive, null, { timeout: 60000 });
    // Readback ustawień: parametry startu i odczyt po starcie (kontrola maksimum).
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), MAX_PARAMS);
    await page.waitForFunction(() => window.__nnsMeasureDebug.awaitingFirstCity() === true, null, { timeout: 600000, polling: 500 });
    const founded = await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
    assert.ok(founded, 'foundFirstCity=true');
    await page.waitForTimeout(4000);
    await closeCivWelcome(page);
    // Wymuszenie fortu jak w DEFEAT (wspólna baza porównania z kontrolą P0 z r2).
    const forced = await page.evaluate(() => window.__settingsLive.forceFortLive(0));
    assert.ok(forced, 'wymuszenie fortu: wolny heks przy miescie gracza');
    const c0 = await page.evaluate(() => window.__defeatTestDebug.cityThreatProbe().filter(c => c.ownerId === 0));
    trackIds = c0.map(c => c.id);
    const readback = await page.evaluate(() => ({ turn: window.__nnsMeasureDebug.gateInfo().turn, treasury: window.__nnsMeasureDebug.gateInfo().treasury }));
    logLine({ kind: 'start', policy: POLICY, seed: SEED, adv: ADV, playerCities: c0.map(c => ({ id: c.id, q: c.q, r: c.r })), readback });
    const gate0 = await prepareEndTurnGate(page);
    logLine({ kind: 'gate0', gate0 });
    let result = null;
    for (let i = 0; i < TURNS && !result; i++) {
      await closeModals(page);
      const battles = await clearBattles(page);
      const seen = new Set();
      const offers = await rejectAwaitingAiOffers(page, seen);
      const forcedPeace = await acceptForcedPeace(page, {}, null);
      const pre = await page.evaluate(() => ({ turn: window.__nnsMeasureDebug.gateInfo().turn, treasury: window.__nnsMeasureDebug.gateInfo().treasury }));
      let gate = await prepareEndTurnGate(page);
      for (let k = 0; k < 6 && !gate.canEnd; k++) {
        await closeModals(page);
        await clearBattles(page);
        await rejectAwaitingAiOffers(page, seen);
        await acceptForcedPeace(page, {}, null);
        await new Promise(r => setTimeout(r, 500));
        gate = await prepareEndTurnGate(page);
      }
      if (!gate.canEnd) {
        const over = await page.evaluate(() => window.__defeatTestDebug.isGameOver());
        if (over) { result = { outcome: 'przegrana', turn: pre.turn }; break; }
        logLine({ kind: 'stop', reason: 'cannot-end', turn: pre.turn, battles, offers, forcedPeace, endTurnBlocks: endTurnBlocks.splice(0) });
        result = { outcome: 'zatrzymanie', turn: pre.turn };
        break;
      }
      await page.evaluate(() => window.__civTest.endTurn());
      await page.waitForFunction((t) => window.__nnsMeasureDebug.gateInfo().turn > t && !window.__nnsMeasureDebug.isEndTurnInProgress(), pre.turn, { timeout: 180000, polling: 200 });
      await closeModals(page);
      const pr = await probe(page, trackIds);
      completed += 1;
      const defenders = pr.tracked.length ? pr.tracked[0].playerOnHex.filter(u => !MILITARY_EXCL.has(String(u.typeId).toLowerCase()) && u.category !== 'zwiadowca') : [];
      if (!firstDefender && defenders.length) firstDefender = { turn: pr.turn, units: defenders.map(u => ({ typeId: u.typeId, category: u.category, inGarnizon: u.inGarnizon })) };
      logLine({ kind: 'turn', turn: pr.turn, gameOver: pr.gameOver, tracked: pr.tracked, otherCities: pr.otherCities, battle: pr.battle, errors: errors.length, endTurnBlocks: endTurnBlocks.splice(0) });
      if (pr.gameOver) { result = { outcome: 'przegrana', turn: pr.turn }; }
    }
    if (!result) result = { outcome: 'dokonczone', turn: null };
    // Strata miasta: tura, w której właściciel miasta gracza przestał być 0 (z pierwszego przebiegu probe).
    const lastTurn = await probe(page, trackIds);
    const ownerNow = lastTurn.tracked.length ? lastTurn.tracked[0].ownerId : null;
    const row = {
      kind: 'result', policy: POLICY, seed: SEED, barb: BARB_LEVEL, ...result, turnsCompleted: completed,
      cityOwnerAfter: ownerNow, cityLost: ownerNow !== 0, errors: errors.length,
    };
    logLine(row);
    fs.appendFileSync(DANE, JSON.stringify(row) + '\n');
    assert.deepEqual(errors, [], 'brak pageerror');
    logLine({ kind: 'done', policy: POLICY, seed: SEED, turnsCompleted: completed, errors: errors.length, run: run.policy });
  } finally {
    await browser.close();
  }
}
main().catch(e => { console.error('REALDEF FAIL', e.message); logLine({ kind: 'fail', message: e.message }); process.exit(1); });
