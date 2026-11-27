'use strict';
// R-WEB-EARLY-DEFEAT-CAUSE-Q1 (tag DEFEAT): pomiar przyczyny utraty jedynego miasta gracza na żywej grze (Chromium).
// Bazuje na runnerze ENDSTALL (endstall-fortring-live.cjs), bez zmian logiki gry. Różnice:
//  - po każdej turze zapis sondy (`__defeatTestDebug.cityThreatProbe`, tylko odczyt): właściciel miasta gracza,
//    jednostki obce w promieniu 3 heksów (właściciel, typ, kategoria, heks), jednostki własne na heksie miasta;
//  - stan bitew (`__aiTradeWiringTestDebug.battleState`) i linie konsoli o zdobyciu/bitwie/wojnie;
//  - przegrana (`gameOver`) jest WYNIKIEM przebiegu („przegrana w turze N”), nie `cannot-end`;
//  - wariant `garrison`: przed startem tury gracz stawia 2 jednostki wojskowe na heksie miasta
//    (istniejący hak testowy `__hotSeatTestDebug.spawnTestUnitForPlayer`, bez nowych mutacji).
// Uruchomienie (z gra/): node tools/defeat-cause-live.cjs <katalog_poza_repo> <max|low|garrison> <seed> [tury=20]
//   max       = Trudny / trudna / Wysoki x4 / kultura trudny (maksimum; FORTRING ON, domyślnie)
//   low       = jak max, ale Dyplomacja „latwa” + Koszty jednostek „niski” + kultura „latwy” (dolny poziom, dispatch pkt 2b)
//   garrison  = jak max + 2 jednostki gracza na mieście (pkt 2c)
// Surowy log: linie `DEFEAT-CAUSE <json>` w pliku <katalog>/defeat-<wariant>-s<seed>.txt (poza repo).
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
const SEED = parseInt(process.argv[4] || '4242', 10);
const TURNS = parseInt(process.argv[5] || '20', 10);
if (!process.argv[2] || OUT.startsWith(path.resolve(GRA, '..')) || !['max', 'low', 'garrison'].includes(VARIANT) || !Number.isFinite(SEED)) {
  console.error('Uzycie: <katalog_poza_repo> <max|low|garrison> <seed> [tury]'); process.exit(2);
}
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const LOG = path.join(OUT, `defeat-${VARIANT}-s${SEED}.txt`);
// Poziom barbarzyńców: MAKSIMUM = 'trudny' (typ BarbariansLevel: latwy | normalny | trudny | brak; 'brak' = wyłączeni,
// więc najwyższa intensywność to 'trudny'). Runda r1 używała 'normalny' (zarzut obrony nr 1). Nadpisanie do
// odtworzenia starych danych: DEFEAT_BARB_LEVEL=normalny.
const BARB_LEVEL = process.env.DEFEAT_BARB_LEVEL || 'trudny';
const BASE_ADV = {
  barbariansLevel: BARB_LEVEL, battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
  kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30,
  landFractionCustom: false, cityStateDifficultyOverride: 'normal', cityLimitBase: 10,
  diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
};
const LOW_ADV = { ...BASE_ADV, kosztJednostekPace: 'niski', diplomacyWarLevel: 'latwa', kulturaReligiaLevel: 'latwy' };
const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: 'Maly', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: SEED,
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 4, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: variantAdv(),
  villageRewardsEnabled: true,
};
function variantAdv() { return VARIANT === 'low' ? LOW_ADV : BASE_ADV; }

function logLine(obj) {
  const line = 'DEFEAT-CAUSE ' + JSON.stringify(obj);
  fs.appendFileSync(LOG, line + '\n');
  console.log(line);
}

const KEEP_RE = /Diag|Load\]|Save|Zapis|Victory|Oblezenie|[Bb]itw|[Bb]attle|zdob|[Pp]odb|[Bb]arbar|[Ww]ojn|[Ww]ar|[Cc]ession|[Cc]ytad|[Bb]unt|[Rr]ebel|Autosave\] rotacyjny|Ekonomia\] Tura/;

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
  execFileSync('node', [LIVE_TOOL, OUT], { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  const html = path.join(OUT, 'Gra-LIVE.html');
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
  let completed = 0;
  let trackIds = [];
  try {
    await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__settingsLive, null, { timeout: 60000 });
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), MAX_PARAMS);
    await page.waitForFunction(() => window.__nnsMeasureDebug.awaitingFirstCity() === true, null, { timeout: 600000, polling: 500 });
    const founded = await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
    assert.ok(founded, 'foundFirstCity=true');
    await page.waitForTimeout(4000);
    await closeCivWelcome(page);
    const forced = await page.evaluate(() => window.__settingsLive.forceFortLive(0));
    assert.ok(forced, 'wymuszenie fortu: wolny heks przy miescie gracza');
    const c0 = await page.evaluate(() => window.__defeatTestDebug.cityThreatProbe().filter(c => c.ownerId === 0));
    trackIds = c0.map(c => c.id);
    logLine({ kind: 'start', variant: VARIANT, seed: SEED, adv: variantAdv(), playerCities: c0 });
    const gate0 = await prepareEndTurnGate(page);
    logLine({ kind: 'gate0', gate0 });
    let result = null;
    const garrisonIds = [];
    for (let i = 0; i < TURNS && !result; i++) {
      await closeModals(page);
      const battles = await clearBattles(page);
      const seen = new Set();
      const offers = await rejectAwaitingAiOffers(page, seen);
      const forcedPeace = await acceptForcedPeace(page, {}, null);
      const pre = await page.evaluate(() => ({ turn: window.__nnsMeasureDebug.gateInfo().turn }));
      // Wariant garrison: hak klonuje ISTNIEJĄCĄ jednostkę wojskową świata (brak jej na starcie — tylko zwiadowca),
      // więc 2 jednostki gracza stawiamy w pierwszej turze, w której taka jednostka już istnieje (barbarzyńcy).
      if (VARIANT === 'garrison' && garrisonIds.length < 2) {
        const id = await page.evaluate((c) => window.__hotSeatTestDebug.spawnTestUnitForPlayer(c.q, c.r), c0[0]);
        if (id) { garrisonIds.push(id); logLine({ kind: 'garrison-spawn', turn: pre.turn, id }); }
      }
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
      logLine({ kind: 'turn', turn: pr.turn, gameOver: pr.gameOver, tracked: pr.tracked, otherCities: pr.otherCities, battle: pr.battle, errors: errors.length, endTurnBlocks: endTurnBlocks.splice(0) });
      if (pr.gameOver) { result = { outcome: 'przegrana', turn: pr.turn }; }
    }
    if (!result) result = { outcome: 'dokonczone', turn: null };
    logLine({ kind: 'result', variant: VARIANT, seed: SEED, ...result, turnsCompleted: completed });
    // Round-trip zapisu po stanie końcowym (dla przegranej: pkt 3 dispatchu).
    // Po przegranej okno podsumowania bitwy zostaje otwarte (summaryOpen) i twarda bramka zapisu blokuje zapis
    // (persistSaveToSlot -> isSaveBlockedByBattle); zamykamy je tak jak runner ENDSTALL przed round-trip.
    const closedBattles = await clearBattles(page);
    const rt0 = await probe(page, trackIds);
    const rt = await page.evaluate(() => window.__settingsLive.saveRoundTrip());
    const rt1 = await probe(page, trackIds);
    // Po wczytaniu: czy po jednym koncu tury gra ponownie stwierdza przegrana (miasto gracza nie nalezy do gracza)?
    let postLoad = null;
    if (!rt1.gameOver && rt1.tracked.length && rt1.tracked[0].ownerId !== 0) {
      const pl = await prepareEndTurnGate(page);
      if (pl.canEnd) {
        const t0 = rt1.turn;
        await page.evaluate(() => window.__civTest.endTurn());
        await page.waitForFunction((t) => window.__nnsMeasureDebug.gateInfo().turn > t && !window.__nnsMeasureDebug.isEndTurnInProgress(), t0, { timeout: 180000, polling: 200 }).catch(() => null);
        await closeModals(page);
        const pl2 = await probe(page, trackIds);
        postLoad = { turnBefore: t0, turnAfter: pl2.turn, gameOverAfter: pl2.gameOver, owner: pl2.tracked.length ? pl2.tracked[0].ownerId : null };
      } else {
        postLoad = { skipped: 'gate.canEnd=false', gate: pl.canEnd };
      }
    }
    logLine({ kind: 'postload', postLoad });
    logLine({ kind: 'roundtrip', closedBattles, saved: rt && rt.saved, before: { turn: rt0.turn, gameOver: rt0.gameOver, battle: rt0.battle, tracked: rt0.tracked.map(c => ({ owner: c.ownerId, playerOnHex: c.playerOnHex.length })) }, after: { turn: rt1.turn, gameOver: rt1.gameOver, battle: rt1.battle, tracked: rt1.tracked.map(c => ({ owner: c.ownerId, playerOnHex: c.playerOnHex.length })) } });
    assert.deepEqual(errors, [], 'brak pageerror');
    logLine({ kind: 'done', variant: VARIANT, seed: SEED, turnsCompleted: completed, errors: errors.length });
  } finally {
    await browser.close();
  }
}
main().catch(e => { console.error('DEFEAT-CAUSE FAIL', e.message); logLine({ kind: 'fail', message: e.message }); process.exit(1); });
