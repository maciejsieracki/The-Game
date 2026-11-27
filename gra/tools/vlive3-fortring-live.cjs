'use strict';
// R-WEB-VERIFY-LIVE-3-Q1 (VLIVE3), pozycja 3: FORTRING na żywej grze, MAKSYMALNE ustawienia nowej gry
// (difficulty 'Trudny', dyplomacja 'trudna', koszty jednostek 'wysoki' ×4, kultura i religia 'trudny').
// Start REALNYM haczykiem __settingsLive.startNewGame (ta sama funkcja co „Start” kreatora).
// Wariant: on (reguła gry, bez przełącznika) albo off (__settingsLive.setFortRingOff(true), ustawiany PRZED startem).
// SETUP: wymuszenie fortu na wolnym heksie przy mieście gracza (__settingsLive.forceFortLive — rejestracja jak budowa,
// bez zmiany reguły); zakładanie miasta gracza (__nnsMeasureDebug.foundFirstCity).
// Mierzy na każdą turę: liczbę fortów (fortCount), czas tury (ms), bramkę tury; na końcu round-trip zapisu
// (__settingsLive.saveRoundTrip = persistSaveToSlot + loadGameFromSlot): liczba fortów przed/po wczytaniu.
// Surowy log: każda tura to linia JSON z prefiksem VLIVE3-FORT (plik .txt w katalogu wyjściowym, poza repo).
// Uruchomienie (z gra/): node tools/vlive3-fortring-live.cjs <katalog_poza_repo> <on|off> [liczba_tur=20]
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
const VARIANT = process.argv[3];
const TURNS = parseInt(process.argv[4] || '20', 10);
if (!process.argv[2] || OUT.startsWith(path.resolve(GRA, '..')) || (VARIANT !== 'on' && VARIANT !== 'off')) {
  console.error('Uzycie: <katalog_poza_repo> <on|off> [tury]'); process.exit(2);
}
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const LOG = path.join(OUT, `fortring-${VARIANT}-max.txt`);
const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: 'Maly', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: 4242,
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 4, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: {
    barbariansLevel: 'normalny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
    kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30,
    landFractionCustom: false, cityStateDifficultyOverride: 'normal', cityLimitBase: 10,
    diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
  },
  villageRewardsEnabled: true,
};

function logLine(obj) {
  const line = 'VLIVE3-FORT ' + JSON.stringify(obj);
  fs.appendFileSync(LOG, line + '\n');
  console.log(line);
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
  // Jak fortring-measure.cjs: zamknięcie podsumowania / sceny bitwy (bez decyzji gracza; tryb auto).
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

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  if (fs.existsSync(LOG)) fs.unlinkSync(LOG);
  execFileSync('node', [LIVE_TOOL, OUT], { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  const html = path.join(OUT, 'Gra-LIVE.html');
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath() || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const endTurnBlocks = [];
  page.on('console', m => { if (m.type() === 'warning' && /^\[EndTurn\] blocked/.test(m.text())) endTurnBlocks.push(m.text()); });
  let completed = 0;
  try {
    await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__settingsLive, null, { timeout: 60000 });
    if (VARIANT === 'off') await page.evaluate(() => window.__settingsLive.setFortRingOff(true));
    const ringRead = await page.evaluate(() => window.__settingsLive.fortRingOff());
    assert.equal(ringRead, VARIANT === 'off', 'odczyt przelacznika pierscienia = wariant');
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), MAX_PARAMS);
    await page.waitForFunction(() => window.__nnsMeasureDebug.awaitingFirstCity() === true, null, { timeout: 600000, polling: 500 });
    const founded = await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
    assert.ok(founded, 'foundFirstCity=true');
    await page.waitForTimeout(4000);
    await closeCivWelcome(page);
    const settings = await page.evaluate(() => window.__settingsLive.getSettings());
    logLine({ kind: 'start', variant: VARIANT, ringOff: ringRead, settings, errors: errors.length });
    const forced = await page.evaluate(() => window.__settingsLive.forceFortLive(0));
    assert.ok(forced, 'wymuszenie fortu: wolny heks przy miescie gracza');
    logLine({ kind: 'forced', variant: VARIANT, forced });
    const gate0 = await prepareEndTurnGate(page);
    logLine({ kind: 'gate0', variant: VARIANT, gate0 });
    for (let i = 0; i < TURNS; i++) {
      await closeModals(page);
      const battles = await clearBattles(page);
      // Zalozenie pasywnego gracza jak w fortring-measure.cjs: odrzucenie wiszacych ofert AI i przymusowy pokoj.
      const seen = new Set();
      const offers = await rejectAwaitingAiOffers(page, seen);
      const forcedPeace = await acceptForcedPeace(page, {}, null);
      const pre = await page.evaluate(() => ({ turn: window.__nnsMeasureDebug.gateInfo().turn, forts: window.__settingsLive.fortCount() }));
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
        const st = await page.evaluate(() => ({ g: window.__nnsMeasureDebug.gateInfo(), battle: window.__aiTradeWiringTestDebug.battleState() }));
        // R-WEB-EARLY-DEFEAT-CAUSE-Q1 (pkt 4): przegrana gracza (gameOver) to WYNIK przebiegu, nie cannot-end.
        const overNow = await page.evaluate(() => window.__defeatTestDebug.isGameOver());
        if (overNow === true) { logLine({ kind: 'result', variant: VARIANT, outcome: 'przegrana', turn: pre.turn, battles, endTurnBlocks: endTurnBlocks.splice(0) }); break; }
        logLine({ kind: 'stop', variant: VARIANT, turn: pre.turn, reason: 'cannot-end', battles, offers, forcedPeace, endTurnBlocks: endTurnBlocks.splice(0), state: st });
        break;
      }
      const t0 = Date.now();
      await page.evaluate(() => window.__civTest.endTurn());
      await page.waitForFunction((t) => window.__nnsMeasureDebug.gateInfo().turn > t && !window.__nnsMeasureDebug.isEndTurnInProgress(), pre.turn, { timeout: 180000, polling: 200 });
      const ms = Date.now() - t0;
      await closeModals(page);
      const post = await page.evaluate(() => ({ turn: window.__nnsMeasureDebug.gateInfo().turn, forts: window.__settingsLive.fortCount() }));
      completed += 1;
      logLine({ kind: 'turn', variant: VARIANT, turn: post.turn, fortsBefore: pre.forts, forts: post.forts, endTurnMs: ms, errors: errors.length });
    }
    // Round-trip zapisu przy aktualnym stanie fortow (persistSaveToSlot + loadGameFromSlot, ta sama strona).
    await clearBattles(page);
    const fortsBeforeRt = await page.evaluate(() => window.__settingsLive.fortCount());
    const rt = await page.evaluate(() => window.__settingsLive.saveRoundTrip());
    const fortsAfterRt = await page.evaluate(() => window.__settingsLive.fortCount());
    logLine({ kind: 'roundtrip', variant: VARIANT, saved: rt.saved, fortsBeforeRt, fortsAfterRt, equal: fortsBeforeRt === fortsAfterRt });
    assert.deepEqual(errors, [], 'brak pageerror');
    logLine({ kind: 'done', variant: VARIANT, turnsRequested: TURNS, turnsCompleted: completed, errors: errors.length });
  } finally {
    await browser.close();
  }
}
main().catch(e => { console.error('VLIVE3-FORT FAIL', e.message); logLine({ kind: 'fail', message: e.message }); process.exit(1); });
