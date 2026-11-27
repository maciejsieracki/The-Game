'use strict';
/**
 * caprebel-capital-live.cjs -- R-WEB-AI-CAPITAL-REBEL-EFFECTS-Q1 (CAPREBEL).
 * Zywy pomiar skutkow buntu STOLICY AI przy >= 2 miastach (wymuszenie istniejacym hakiem
 * __rebelNotifyTestDebug.forceRevoltEligible na stolicy), maksymalne ustawienia nowej gry
 * (__settingsLive.startNewGame: Trudny, kultura trudny, koszty jednostek wysoki x4, dyplomacja trudna).
 * Odczyt: __cityCessionTestDebug (stolica, miasta wlasciciela), __capRebelReadTestDebug (budynki, Mennica,
 * osierocona Mennica; tylko odczyt), __rebelNotifyTestDebug (eliminacja), __rebelProtectionTestDebug
 * (relacje, gameOver, tura).
 * Uzycie (z gra/, bundle poza repo): node tools/caprebel-capital-live.cjs --dist <abs> [--turns 3] [--seed 4242]
 */
const path = require('path');
const fs = require('fs');

const GRA_DIR = path.resolve(__dirname, '..');
function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const DIST = arg('dist', '');
const TURNS = parseInt(arg('turns', '3'), 10);
const SEED = parseInt(arg('seed', '4242'), 10);
if (!DIST || !fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('--dist: brak index.html w ' + DIST);
const URL_GAME = 'file://' + path.join(DIST, 'index.html') + '?civTest=1&civSeed=' + SEED;
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const PROG = JSON.parse(fs.readFileSync(path.join(GRA_DIR, 'data', 'society-params.json'), 'utf8')).porzadek.porzadek_prog_bunt_skrajny_pct.hard;

const { closeCivWelcome, prepareEndTurnGate } = require('./_live-ready.cjs');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brazu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: 'Standardowy', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty',
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 15, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: {
    barbariansLevel: 'normalny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
    kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30, landFractionCustom: false,
    cityStateDifficultyOverride: 'normal', cityLimitBase: 10, diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
  },
  villageRewardsEnabled: true,
};

async function endTurnSettle(page, timeoutMs = 300000) {
  const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
    const now = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    if (!inProg && now > before) return true;
    await wait(150);
  }
  return false;
}

async function snapshot(page, owner, capOrigId, rebelId) {
  return page.evaluate(({ owner, capOrigId, rebelId }) => {
    const cc = window.__cityCessionTestDebug;
    const rb = window.__rebelNotifyTestDebug;
    const cap = window.__capRebelReadTestDebug;
    const pr = window.__rebelProtectionTestDebug;
    const capNow = cc.capitalOf(owner);
    return {
      turn: pr.getTurn(),
      capitalNow: capNow,
      capitalOrigOwnerNow: cc.cityOwner(capOrigId),
      ownerCityIds: cc.ownerCityIds(owner),
      capOrigBuildings: cap.buildingsOf(capOrigId),
      capNowBuildings: capNow ? cap.buildingsOf(capNow) : null,
      mennicaWCapitalOwner: cap.ownerMennicaInCapital(owner),
      orphanMennicaOwner: cap.ownerOrphanMennica(owner),
      mennicaAnyCities: cap.cityIdsWithMennicaAnyOwner(),
      ownerEliminated: rb.isOwnerEliminated(owner),
      relOwnerRebel: pr.getRelationStatus(owner, rebelId),
      relOwnerPlayer: pr.getRelationStatus(owner, 0),
      gameOver: typeof pr.isGameOver === "function" ? pr.isGameOver() : null,
    };
  }, { owner, capOrigId, rebelId });
}

async function main() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({
    headless: true, executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const errors = [];
  const rows = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text().slice(0, 200)); });
    await page.goto(URL_GAME, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__aiEconomyMeasure && !!window.__settingsLive && !!window.__rebelNotifyTestDebug && !!window.__eraTestDebug && !!window.__rebelProtectionTestDebug && !!window.__capRebelReadTestDebug && !!window.__cityCessionTestDebug, null, { timeout: 180000 });
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), Object.assign({ seed: SEED }, MAX_PARAMS));
    await page.waitForFunction(() => { try { return window.__eraTestDebug.getWorldState().turn >= 1; } catch (_) { return false; } }, null, { timeout: 240000 });
    await page.waitForFunction(() => {
      const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
    }, null, { timeout: 600000, polling: 500 });
    const founded = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
    if (!founded) throw new Error('foundFirstCity=false');
    await page.waitForFunction(() => { try { return window.__rebelProtectionTestDebug.pickTwoAiOwners() !== null; } catch (_) { return false; } }, null, { timeout: 240000, polling: 500 });
    await page.evaluate(() => { try { window.__truceTestDebug && window.__truceTestDebug.suppressVictoryForTest && window.__truceTestDebug.suppressVictoryForTest(); } catch (_) {} });
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
    const settings = await page.evaluate(() => window.__settingsLive.getSettings());
    const rebelId = await page.evaluate(() => window.__rebelProtectionTestDebug.REBEL_FACTION_OWNER_ID);

    const t1 = await page.evaluate((p) => window.__aiEconomyMeasure.cityStateTurn(p).map((x) => [x.owner, x.miasta]), PROG);
    const aiTwoPlus = t1.filter(([o, m]) => o > 0 && m >= 2).map(([o]) => o);
    if (aiTwoPlus.length === 0) throw new Error('brak AI z >= 2 miastami w t1 (seed ' + SEED + ')');
    const ownerId = aiTwoPlus[SEED % aiTwoPlus.length];
    const capId = await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), ownerId);
    if (!capId) throw new Error('brak stolicy dla owner ' + ownerId);
    const pre = await snapshot(page, ownerId, capId, rebelId);
    const forced = await page.evaluate((c) => window.__rebelNotifyTestDebug.forceRevoltEligible(c), capId);
    rows.push({ tura: 1, faza: 'przed-wymuszeniem', ...pre, forced });

    for (let t = 2; t <= TURNS + 1; t++) {
      await closeCivWelcome(page);
      await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
      await prepareEndTurnGate(page).catch(() => null);
      const settled = await endTurnSettle(page);
      if (!settled) { rows.push({ tura: t, nieSettled: true }); break; }
      rows.push({ tura: t, faza: 'po-turze', ...(await snapshot(page, ownerId, capId, rebelId)) });
    }
    const after = rows.filter((r) => r.faza === 'po-turze');
    const newCapOk = after.length > 0 && after.every((r) => r.capitalNow && r.capitalNow !== capId);
    const verdict = rows.some((r) => r.nieSettled) ? 'NIE ZMIERZONO (tura nie zakonczyla sie)'
      : (newCapOk ? 'NOWA-STOLICA-PO-BUNTCIE' : 'BRAK-ZMIANY-STOLICY');
    console.log('PREFIX=CAPREBEL-CAPITAL ' + JSON.stringify({
      seed: SEED, ownerId, capId, kandydaciDwaMiasta: aiTwoPlus, settings, verdict, rows, errors: errors.slice(0, 8),
    }));
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error('FAIL ' + (e && e.stack || e)); process.exit(1); });
