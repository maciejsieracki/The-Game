'use strict';
// TDQ16C r3 (odp. na zarzut Evaluatora nr 1): pomiar Pytania B (skok prognozy Spichlerza) przy MAKSIMUM ustawien
// nowej gry (MAX_PARAMS jak w live-playtest-gate-max-measure.cjs) na ziarnie podanym w argumencie.
// Pasywny gracz: pullPlayerUnitsHome + endTurn (jak diag pytb). Mode 'sweep': w t15+ mierzy racje 0/1/6/12 i przywraca;
// mode 'r0': w t15+ mierzy sweep, od t17 trwale racja 0. Tylko odczyt + setRationAll (hak __nnsMeasureDebug) + prepareEndTurnGate.
// Uzycie (z gra/): node tools/tdq16c-pytb-max.cjs <katalog-poza-repo> <seed> <sweep|r0> [turaMax=19]
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const { resolveChromePath } = require('./_chrome-path.cjs');
const { prepareEndTurnGate, closeCivWelcome } = require('./_live-ready.cjs');
const { rejectAwaitingAiOffers } = require('./measure-reject-offers.cjs');
const { acceptForcedPeace } = require('./measure-forced-peace.cjs');

const GRA = path.resolve(__dirname, '..');
const WORK = path.resolve(process.argv[2]);
const SEED = parseInt(process.argv[3], 10);
const MODE = process.argv[4] || 'sweep';
const TMAX = parseInt(process.argv[5] || '19', 10);
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: process.env.MAPSIZE || 'Super Huge', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: SEED,
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 4, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: {
    barbariansLevel: 'normalny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
    wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30, landFractionCustom: false,
    cityStateDifficultyOverride: 'normal', cityLimitBase: 10,
    diplomacyWarLevel: 'trudna', kosztJednostekPace: 'wysoki', kulturaReligiaLevel: 'trudny',
  },
  villageRewardsEnabled: true,
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (tag, obj) => console.log(tag + ' ' + JSON.stringify(obj));

// Porzadkowanie jak w grace15fx-active3-live.cjs (tidy): bitwy/oferty AI/pokoj wymuszony, bez zmian stanu gry poza kolejkami UI.
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
    await wait(150);
  }
}

async function settle(page, turnBefore, timeoutMs = 120000) {
  await clearBattles(page);
  await rejectAwaitingAiOffers(page, new Set());
  await acceptForcedPeace(page, {}, null);
  const gate = await prepareEndTurnGate(page);
  if (!gate.canEnd) {
    const diag = await page.evaluate(() => ({ battle: window.__aiTradeWiringTestDebug.battleState(), endInProg: window.__eraTestDebug.isEndTurnInProgress() }));
    throw new Error('bramka zamknieta: ' + JSON.stringify({ gate, diag }));
  }
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const st = await page.evaluate(() => ({ inProg: window.__eraTestDebug.isEndTurnInProgress(), turn: window.__eraTestDebug.getWorldState().turn }));
    if (st.turn > turnBefore && !st.inProg) return true;
    await page.evaluate(() => { const b = document.querySelector('.pb-overlay [data-act="auto"]'); if (b) b.click(); });
    await wait(200);
  }
  return false;
}

async function main() {
  fs.mkdirSync(WORK, { recursive: true });
  const t00 = Date.now();
  const html = path.join(WORK, 'Gra-LIVE.html');
  if (!fs.existsSync(html)) execFileSync('node', [LIVE_TOOL, WORK], { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath() || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  let ok = false, err = null;
  try {
    const page = await (await browser.newContext()).newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__settingsLive, null, { timeout: 60000 });
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), MAX_PARAMS);
    await page.waitForFunction(() => !!(window.__nnsMeasureDebug && window.__nnsMeasureDebug.gateInfo && window.__nnsMeasureDebug.gateInfo()), null, { timeout: 400000 });
    // Jak w grace15fx-active3-live.cjs: czekaj na pierwsze miasto i zaloz je (hak civTest, ta sama procedura).
    await page.waitForFunction(() => window.__nnsMeasureDebug.awaitingFirstCity() === true, null, { timeout: 500000, polling: 500 });
    const founded = await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
    if (!founded) throw new Error('foundFirstCity zwrocil false');
    await wait(3000);
    await closeCivWelcome(page);
    log('SETUP', { seed: SEED, mode: MODE, sec: Math.round((Date.now() - t00) / 1000), settings: await page.evaluate(() => window.__settingsLive.getSettings()) });
    let turn = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    let r0persist = false;
    while (turn <= TMAX) {
      try { await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome()); } catch (e) { /* hak opcjonalny */ }
      const snap = await page.evaluate(() => {
        const n = window.__nnsMeasureDebug; const g = n.gateInfo();
        let units = null, cities = null;
        try { const d = window.__cityStateStartUnitsTestDebug && window.__cityStateStartUnitsTestDebug.dumpState(); if (d) {
          units = d.units.filter((u) => u.ownerId === 0).length; cities = d.cities.filter((c) => c.ownerId === 0).length; } } catch (e) {}
        return { turn: g.turn, canEnd: g.canEnd, treasury: g.treasury, granary: g.granary, forecast: g.forecast, gate: g.gate && g.gate.komunikat, rations: n.cityRations(), units, cities, unitCount: n.unitCount(0) };
      });
      log('SNAP', snap);
      if (turn >= 15 && !r0persist) {
        const orig = snap.rations.map((r) => r.poziomRacji);
        for (const lvl of [0, 1, 6, 12]) {
          const r = await page.evaluate((lvl) => { const n = window.__nnsMeasureDebug; n.setRationAll(lvl); n.forceGateRecompute(); const g = n.gateInfo();
            return { lvl, spichlerzPo: g.forecast && g.forecast.spichlerzPo, canEnd: g.canEnd, blokada: g.gate && g.gate.blokada }; }, lvl);
          log('  RACJA', r);
        }
        if (orig.length && orig.every((v) => v === orig[0]) && orig[0] != null) {
          await page.evaluate((v) => { window.__nnsMeasureDebug.setRationAll(v); window.__nnsMeasureDebug.forceGateRecompute(); }, orig[0]);
        }
        if (MODE === 'r0' && turn === 17) {
          await page.evaluate(() => { window.__nnsMeasureDebug.setRationAll(0); window.__nnsMeasureDebug.forceGateRecompute(); });
          r0persist = true; log('  R0-PERSIST-ON', { turn });
        }
      }
      const ok2 = await settle(page, turn);
      turn = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
      if (!ok2) { log('NOT-SETTLED', { turn }); break; }
    }
    ok = true;
    log('PAGEERRORS', { n: errors.length, first: errors.slice(0, 3) });
  } catch (e) { err = String(e && e.message ? e.message : e); }
  finally { await browser.close(); }
  log('RESULT', { ok, err, sec: Math.round((Date.now() - t00) / 1000) });
  process.exitCode = ok ? 0 : 1;
}
main();
