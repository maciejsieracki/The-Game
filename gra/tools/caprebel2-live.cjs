'use strict';
/**
 * caprebel2-live.cjs -- R-WEB-AI-CAPITAL-REBEL-SAVE-Q2 (CAPREBEL2, runda 2). Zywy pomiar skutkow buntu STOLICY AI.
 * Tryby (--mode):
 *   sl    -- pozycja 1: zapis PRZED buntem -> wczytanie -> ponowny bunt (deterministycznosc) ; zapis PO buncie -> wczytanie.
 *   odb   -- pozycja 2: po buncie stolicy odbicie (przekazanie miasta z powrotem wlascicielowi, hak __ledgerRealPathDebug.cession)
 *            i odczyt jawnego wpisu capitalCityIdByOwner oraz stolicy w kolejnych turach.
 *   men   -- pozycja 3: Mennica + Palac postawione w stolicy AI przed buntem (hak __cityForestTestDebug.adminSetup), odczyt po buncie.
 *   long  -- pozycja 5: bieg >= 20 tur po buncie, podzielony na wywolania; stan miedzy wywolaniami = __detHarness.snapshotJson
 *            zapisany do pliku poza repo (--snap-out) i wczytany (--snap-in) przez restoreJson.
 * Ustawienia: maksymalne (jak CAPREBEL: Trudny, dyplomacja trudna, Wysoki x4, kultura trudny, flagi ON, wzrost surowcow ON).
 * Zero zmian gra/src. Uzycie (z gra/, bundle poza repo):
 *   node tools/caprebel2-live.cjs --dist <abs katalog z Gra-LIVE.html> --mode sl --seed 4242
 */
const path = require('path');
const fs = require('fs');

const GRA_DIR = path.resolve(__dirname, '..');
function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const MODE = arg('mode', 'sl');
const DIST = arg('dist', '');
const SEED = parseInt(arg('seed', '4242'), 10);
const TURNS = parseInt(arg('turns', '3'), 10);
const UNTIL = parseInt(arg('until', '0'), 10); // long: docelowa tura (koniec wywolania)
const SNAP_IN = arg('snap-in', '');
const SNAP_OUT = arg('snap-out', '');
if (!DIST || !fs.existsSync(path.join(DIST, 'index.html')) && !fs.existsSync(path.join(DIST, 'Gra-LIVE.html'))) {
  throw new Error('--dist: brak Gra-LIVE.html w ' + DIST);
}
const HTML = fs.existsSync(path.join(DIST, 'Gra-LIVE.html')) ? 'Gra-LIVE.html' : 'index.html';
const URL_GAME = 'file://' + path.join(DIST, HTML) + '?civTest=1&civSeed=' + SEED;
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
    wzrostSurowcowZEpoka: true,
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
    const df = window.__defeatTestDebug;
    const capNow = cc.capitalOf(owner);
    return {
      turn: pr.getTurn(),
      capitalNow: capNow,
      explicitCapitalNow: cap.explicitCapitalOf(owner),
      treasuryOwner: cap.treasuryOf(owner),
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
      gameOver: df.isGameOver(),
      digest: window.__detHarness.digest(),
    };
  }, { owner, capOrigId, rebelId });
}

/** Start nowej gry (maksymalne ustawienia), zalozenie 1 miasta gracza, wybor AI z >= 2 miastami. */
async function startGame(page) {
  await page.goto(URL_GAME, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__aiEconomyMeasure && !!window.__settingsLive && !!window.__rebelNotifyTestDebug && !!window.__eraTestDebug && !!window.__rebelProtectionTestDebug && !!window.__capRebelReadTestDebug && !!window.__cityCessionTestDebug && !!window.__defeatTestDebug && !!window.__detHarness && !!window.__ledgerRealPathDebug && !!window.__cityForestTestDebug, null, { timeout: 180000 });
  await page.evaluate((p) => window.__settingsLive.startNewGame(p), Object.assign({ seed: SEED }, MAX_PARAMS));
  await page.waitForFunction(() => { try { return window.__eraTestDebug.getWorldState().turn >= 1; } catch (_) { return false; } }, null, { timeout: 240000 });
  await page.waitForFunction(() => {
    const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
  }, null, { timeout: 600000, polling: 500 });
  const founded = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
  if (!founded) throw new Error('foundFirstCity=false');
  await page.waitForFunction(() => { try { return window.__rebelProtectionTestDebug.pickTwoAiOwners() !== null; } catch (_) { return false; } }, null, { timeout: 240000, polling: 500 });
  await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
  const rebelId = await page.evaluate(() => window.__rebelProtectionTestDebug.REBEL_FACTION_OWNER_ID);
  const t1 = await page.evaluate((p) => window.__aiEconomyMeasure.cityStateTurn(p).map((x) => [x.owner, x.miasta]), PROG);
  const aiTwoPlus = t1.filter(([o, m]) => o > 0 && m >= 2).map(([o]) => o);
  if (aiTwoPlus.length === 0) throw new Error('brak AI z >= 2 miastami w t1 (seed ' + SEED + ')');
  const ownerId = aiTwoPlus[SEED % aiTwoPlus.length];
  const capId = await page.evaluate((o) => window.__cityCessionTestDebug.capitalOf(o), ownerId);
  if (!capId) throw new Error('brak stolicy dla owner ' + ownerId);
  return { rebelId, ownerId, capId, aiTwoPlus };
}

async function runTurns(page, n, owner, capId, rebelId, rows, faza) {
  for (let i = 0; i < n; i++) {
    await closeCivWelcome(page);
    await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
    await prepareEndTurnGate(page).catch(() => null);
    const settled = await endTurnSettle(page);
    if (!settled) { rows.push({ faza, nieSettled: true }); return false; }
    rows.push({ faza, ...(await snapshot(page, owner, capId, rebelId)) });
  }
  return true;
}

function emit(obj) {
  console.log('PREFIX=CAPREBEL2 ' + JSON.stringify(Object.assign({ mode: MODE, seed: SEED }, obj)));
}

async function main() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({
    headless: true, executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const errors = [];
  const warnings = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push('console.error: ' + m.text().slice(0, 200));
      // Ostrzezenia gry (np. powod odrzucenia cesji) -- tylko do raportu, nie wplywaja na wynik.
      if (m.type() === 'warning' && /cesja|Dyplomacja/.test(m.text())) warnings.push(m.text().slice(0, 240));
    });
    const g = await startGame(page);
    const { rebelId, ownerId, capId } = g;
    const rows = [];

    if (MODE === 'sl') {
      // Pozycja 1. A = zapis PRZED buntem (tura 1), B = zapis PO buncie (tura 2).
      const pre = await snapshot(page, ownerId, capId, rebelId);
      const snapA = await page.evaluate(() => window.__detHarness.snapshotJson());
      const forcedA = await page.evaluate((c) => window.__rebelNotifyTestDebug.forceRevoltEligible(c), capId);
      const runBunt1 = [];
      await runTurns(page, 1, ownerId, capId, rebelId, runBunt1, 'bunt-tura-2');
      const postB = runBunt1[0];
      const snapB = await page.evaluate(() => window.__detHarness.snapshotJson());
      // Wczytanie zapisu PRZED buntem.
      await page.evaluate((s) => window.__detHarness.restoreJson(s), snapA);
      const restoredA = await snapshot(page, ownerId, capId, rebelId);
      // Ponowny bunt z tego samego zapisu (deterministycznosc).
      await page.evaluate((c) => window.__rebelNotifyTestDebug.forceRevoltEligible(c), capId);
      const rerun = [];
      await runTurns(page, 1, ownerId, capId, rebelId, rerun, 'ponowny-bunt-tura-2');
      // Wczytanie zapisu PO buncie.
      await page.evaluate((s) => window.__detHarness.restoreJson(s), snapB);
      const restoredB = await snapshot(page, ownerId, capId, rebelId);
      emit({
        ownerId, capId, rebelId, forcedA,
        pre, postBunt: postB, restoredA, rerunAfterRestoreA: rerun[0], restoredB,
        digestRestoreA_eq_pre: restoredA.digest === pre.digest,
        digestRerun_eq_postBunt: rerun[0] && postB ? rerun[0].digest === postB.digest : null,
        digestRestoreB_eq_postBunt: restoredB.digest === postB.digest,
        errors: errors.slice(0, 8),
      });
    } else if (MODE === 'odb') {
      // Pozycja 2. Bunt, potem odbicie (przekazanie miasta stolicy z powrotem wlascicielowi) i obserwacja kolejnych tur.
      const pre = await snapshot(page, ownerId, capId, rebelId);
      const forced = await page.evaluate((c) => window.__rebelNotifyTestDebug.forceRevoltEligible(c), capId);
      await runTurns(page, 1, ownerId, capId, rebelId, rows, 'po-buncie');
      const afterRevolt = rows[rows.length - 1];
      const cessionOk = await page.evaluate(({ c, from, to }) => window.__ledgerRealPathDebug.cession(c, from, to), { c: capId, from: rebelId, to: ownerId });
      const afterOdb = await snapshot(page, ownerId, capId, rebelId);
      rows.push({ faza: 'po-odbiciu-bez-tury', cessionOk, ...afterOdb });
      await runTurns(page, 3, ownerId, capId, rebelId, rows, 'po-odbiciu');
      emit({ ownerId, capId, rebelId, forced, pre, afterRevolt, cessionOk, rows, warnings: warnings.slice(0, 8), errors: errors.slice(0, 8) });
    } else if (MODE === 'men') {
      // Pozycja 3. Mennica + Palac w stolicy AI przed buntem (istniejacy hak adminSetup), potem bunt i 3 tury.
      const built = await page.evaluate((c) => window.__capRebelReadTestDebug.buildingsOf(c), capId);
      const want = Array.from(new Set([...built, 'mennica', 'palac']));
      const setup = await page.evaluate(({ c, b }) => window.__civTest.adminSetup(c, b, null, null, null), { c: capId, b: want });
      const preMen = await snapshot(page, ownerId, capId, rebelId);
      const forced = await page.evaluate((c) => window.__rebelNotifyTestDebug.forceRevoltEligible(c), capId);
      await runTurns(page, 3, ownerId, capId, rebelId, rows, 'po-buncie');
      emit({ ownerId, capId, rebelId, builtBefore: built, setupOk: !!setup, forced, preMen, rows, errors: errors.slice(0, 8) });
    } else if (MODE === 'long') {
      // Pozycja 5. Wywolanie 1 (bez --snap-in): bunt w turze 1 i bieg do --until.
      // Wywolanie >1 (z --snap-in): wczytanie zapisu z poprzedniego wywolania i bieg dalej.
      let meta = null;
      if (SNAP_IN) {
        meta = JSON.parse(fs.readFileSync(SNAP_IN, 'utf8'));
        await page.evaluate((s) => window.__detHarness.restoreJson(s), meta.snap);
      } else {
        await page.evaluate((c) => window.__rebelNotifyTestDebug.forceRevoltEligible(c), capId);
      }
      const startRow = await snapshot(page, ownerId, capId, rebelId);
      const cur = startRow.turn;
      const n = Math.max(0, UNTIL - cur);
      await runTurns(page, n, ownerId, capId, rebelId, rows, 'long');
      const snapOut = await page.evaluate(() => window.__detHarness.snapshotJson());
      if (SNAP_OUT) fs.writeFileSync(SNAP_OUT, JSON.stringify({ snap: snapOut, ownerId, capId, rebelId, fromTurn: cur, toTurn: UNTIL }));
      emit({ ownerId, capId, rebelId, startTurn: cur, until: UNTIL, startRow, rows, errorsCount: errors.length, errors: errors.slice(0, 8), snapOutBytes: snapOut.length });
    } else {
      throw new Error('nieznany --mode ' + MODE);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error('FAIL ' + (e && e.stack || e)); process.exit(1); });
