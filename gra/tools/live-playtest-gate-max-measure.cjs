// R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1 (runda 3, odp. na zarzut 1 Evaluatora): pomiar bramki „Zakończ turę”
// przy MAKSYMALNYCH ustawieniach nowej gry dostępnych w kreatorze, przez REALNY hak __settingsLive.startNewGame
// (tylko ?civTest=1). Ustawienia maksymalne (wg newGameFlow.ts):
//   difficulty 'Trudny'; advanced.diplomacyWarLevel 'trudna' (kary ×3, bonusy ÷3);
//   advanced.kosztJednostekPace 'wysoki' (×4); advanced.kulturaReligiaLevel 'trudny';
//   mapSize: MENU_KEYS / ROZMIAR_MENU_LABELS najwyższy = 'Super Huge' (zmienna MAPSIZE może to nadpisać).
// Mierzy: echo ustawień (getSettings), gateInfo PRZED, prepareEndTurnGate, gateInfo PO, numer tury.
// Zero zmian gra/src; tylko odczyt i ustawienie stanu przez istniejący hak civTest.
// Uruchomienie: node tools/live-playtest-gate-max-measure.cjs  (wynik: linia ZMIERZONO-JSON, rc 0/1).
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const { resolveChromePath } = require('./_chrome-path.cjs');
const { prepareEndTurnGate, closeCivWelcome } = require('./_live-ready.cjs');

const GRA = path.resolve(__dirname, '..');
const WORK = process.env.LIVE_WORK || path.join(GRA, 'dist-live-playtest-gate-max-measure');
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const LIVE_OUT = path.join(WORK, 'live');
const MAPSIZE = process.env.MAPSIZE || 'Super Huge';

const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: MAPSIZE, rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: 778899,
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

function buildLiveGame() {
  fs.mkdirSync(LIVE_OUT, { recursive: true });
  execFileSync('node', [LIVE_TOOL, LIVE_OUT], { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  return path.join(LIVE_OUT, 'Gra-LIVE.html');
}

async function main() {
  const html = buildLiveGame();
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath() || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const result = { mapSize: MAPSIZE };
  let endTurnWarn = [];
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    endTurnWarn = [];
    page.on('console', (m) => { if (m.text().includes('[EndTurn] blocked')) endTurnWarn.push(m.text()); });
    const t0 = Date.now();
    await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__settingsLive, null, { timeout: 60000 });
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), MAX_PARAMS);
    await page.waitForFunction(() => !!(window.__nnsMeasureDebug && window.__nnsMeasureDebug.gateInfo && window.__nnsMeasureDebug.gateInfo()), null, { timeout: 400000 });
    await page.waitForTimeout(8000);
    result.welcomeClosed = await closeCivWelcome(page);
    result.startSec = Math.round((Date.now() - t0) / 1000);
    result.settings = await page.evaluate(() => window.__settingsLive.getSettings());
    result.gateBefore = await page.evaluate(() => window.__nnsMeasureDebug.gateInfo());
    const gate = await prepareEndTurnGate(page);
    result.prepare = gate;
    result.gateAfter = await page.evaluate(() => window.__nnsMeasureDebug.gateInfo());
    assert.equal(result.settings.diplomacyWarLevel, 'trudna', 'echo: Dyplomacja i wojna = trudna');
    assert.equal(result.settings.kulturaReligiaLevel, 'trudny', 'echo: Kultura i religia = trudny');
    assert.equal(gate.canEnd, true, 'bramka Zakończ turę otwarta po prepareEndTurnGate przy maksimum');
    assert.deepEqual(errors, [], 'brak pageerror');
    result.endTurnBlockedLog = endTurnWarn;
    result.ok = true;
  } catch (e) {
    result.endTurnBlockedLog = endTurnWarn;
    result.ok = false;
    result.error = String(e && e.message ? e.message : e);
  } finally {
    await browser.close();
  }
  console.log('ZMIERZONO-JSON ' + JSON.stringify(result));
  console.log(result.ok ? 'live-playtest-gate-max-measure: PASS' : 'live-playtest-gate-max-measure: FAIL -- ' + result.error);
  process.exitCode = result.ok ? 0 : 1;
}

main();
