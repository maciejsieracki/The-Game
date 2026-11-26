'use strict';
/**
 * live-nns-gate-smoke-test.cjs -- R-WEB-HARNESS-NNS-GATE-ENDTURN-Q1 (NNSQ12, odp. 12A).
 *
 * Dymny test ŻYWEJ GRY (Chromium, bundle z vite build poza repo, ?civTest=1): przechodzi N tur przez endTurn i sprawdza,
 * czy bramka „Zakończ turę” (NNS) NIE zatrzymuje tury. Bramka zostaje w grze; helper _live-ready.cjs
 * (prepareEndTurnGate) przygotowuje stan przez istniejący hak __nnsMeasureDebug przed każdą turą.
 *
 * Użycie (z gra/):
 *   node tools/live-nns-gate-smoke-test.cjs --dist <dist> --out <katalog> --seed 4242 --turns 60 [--map Maly]
 *   node tools/live-nns-gate-smoke-test.cjs ... --mutant 1     (mutacja czerwona: helper NIE wywołany -> test ma się zatrzymać na bramce)
 *
 * Wynik: <out>/nns-gate-<seed>[-mutant].json oraz linia JSON na stdout. Kod wyjścia 0 = wszystkie tury przeszły; 1 = zatrzymanie
 * na bramce (FAIL testu) albo błąd gry; 2 = awaria przeglądarki (Chromium), NIE błąd gry.
 */
const fs = require('fs');
const path = require('path');
const { prepareEndTurnGate, closeCivWelcome } = require('./_live-ready.cjs');
const { rejectAwaitingAiOffers } = require('./measure-reject-offers.cjs');
const { acceptForcedPeace } = require('./measure-forced-peace.cjs');
const base = require('./ai-economy-measure-run.cjs'); // closeEndTurnModals / blockerDumpInPage (jak w runnerach pomiarowych)

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const DIST = arg('dist');
const OUT = arg('out');
const SEED = parseInt(arg('seed', '4242'), 10);
const TURNS = parseInt(arg('turns', '60'), 10);
const MAP = arg('map', 'Maly');
const MUTANT = arg('mutant', '0') === '1';
const BUDGET_S = parseInt(arg('budget-s', '470'), 10); // po tym czasie nie zaczynamy nowej tury; zapis slotu i stanu (wznowienie)
const T0 = Date.now();
const wait = ms => new Promise(r => setTimeout(r, ms));
const SLOT = 'nns-gate-' + SEED;

async function launch(chromium, profile) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--headless=new'];
  const opts = { headless: true, args, viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
  try { return await chromium.launchPersistentContext(profile, opts); } catch (_) {
    const exe = require('./_chrome-path.cjs').resolveChromePath() || '/opt/pw-browsers/chromium';
    return await chromium.launchPersistentContext(profile, { ...opts, executablePath: exe });
  }
}

async function openGame(context, res, resume) {
  const errors = res.errors;
  const page = context.pages()[0] || await context.newPage();
  page.on('pageerror', e => errors.push(String(e && e.message || e).slice(0, 200)));
  page.on('dialog', d => d.dismiss().catch(() => {}));
  // Blokady przycisku „Zakończ turę” z konsoli gry (zliczane; nie są błędem strony).
  page.on('console', m => { const t = m.text(); const mm = /\[EndTurn\] blocked: ([^(]{0,60})/.exec(t); if (mm) { const k = mm[1].trim(); res.endTurnBlocks[k] = (res.endTurnBlocks[k] || 0) + 1; } });
  await page.goto('file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1&civSeed=' + SEED, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });
  await page.waitForSelector('.civ-menu', { timeout: 180000 });
  if (resume) {
    await page.evaluate(slot => window.__nnsMeasureDebug.loadSlot(slot), SLOT);
    await wait(3000);
  } else {
    await page.evaluate(o => window.__nnsMeasureDebug.startGame(o), { seed: SEED, mapSize: MAP, civTypes: 15, cityStates: 2 });
    await page.waitForFunction(() => !window.__nnsMeasureDebug.awaitingFirstCity(), undefined, { timeout: 120000 }).catch(async () => {
      await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
    });
    if (await page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity())) {
      await page.evaluate(() => window.__nnsMeasureDebug.refoundPlayerAnywhere());
    }
  }
  await wait(800);
  await closeCivWelcome(page).catch(() => {});
  // Pasywny gracz (runner nie gra) przegrywa miasta po kilkudziesięciu turach -> koniec gry (gameOver). Hooki testowe
  // (tylko ?civTest=1, istniejące) wyłączają sprawdzanie zwycięstwa/porażki, jak w pozostałych runnerach pomiarowych.
  await page.evaluate(() => {
    try { window.__truceTestDebug && window.__truceTestDebug.suppressVictoryForTest && window.__truceTestDebug.suppressVictoryForTest(); } catch (e) { /* hak opcjonalny */ }
    try { window.__rebelProtectionTestDebug && window.__rebelProtectionTestDebug.disableVictoryCheckForTest && window.__rebelProtectionTestDebug.disableVictoryCheckForTest(); } catch (e) { /* hak opcjonalny */ }
  });
  await page.evaluate(() => window.__nnsMeasureDebug.setFast(true));
  return page;
}

/** Rozstrzyga bitwy odłożone (jak clearBattles w ai-economy-measure-run; ta funkcja nie jest eksportowana). */
async function clearBattles(page) {
  let n = 0; let clean = 0;
  const ctx = base.newCtx(null);
  for (let k = 0; k < 400; k++) {
    await base.closeEndTurnModals(page, ctx);
    const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState());
    if (!bs.preBattleOpen && !bs.pendingAuto && !bs.sceneOpen && !bs.summaryOpen && !bs.resolving) { if (++clean >= 2) break; await wait(150); continue; }
    clean = 0;
    const act = await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug;
      const b = document.querySelector('.pb-overlay [data-act="auto"]');
      if (b) { b.click(); return 'auto'; }
      if (h.closeBattleSummary()) return 'summary';
      if (h.flushBattles()) return 'flush';
      return 'wait';
    });
    if (act === 'auto') n++;
    await wait(act === 'wait' ? 300 : 150);
  }
  return n;
}

async function main() {
  if (!DIST || !OUT) { console.error('Brak --dist lub --out'); process.exit(2); }
  fs.mkdirSync(OUT, { recursive: true });
  const tag = 'nns-gate-' + SEED + (MUTANT ? '-mutant' : '');
  const resultFile = path.join(OUT, tag + '.json');
  const stateFile = path.join(OUT, tag + '.state.json');
  const profile = path.join(OUT, tag + '.profile');
  // Wznowienie: stan z poprzedniego wywołania (ten sam --out, --seed) -> wczytanie slotu i dalsze tury.
  const prev = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : null;
  const resume = !!(prev && prev.turn && !MUTANT);
  const res = prev && resume ? prev.res : { test: 'R-WEB-HARNESS-NNS-GATE-ENDTURN-Q1', seed: SEED, map: MAP, turnsTarget: TURNS, mutant: MUTANT, rows: [], gateStop: null, errors: [], status: 'RUNNING' };
  res.errors = [];
  res.endTurnBlocks = {};
  const save = () => fs.writeFileSync(resultFile, JSON.stringify(res, null, 2));
  let context = null;
  try {
    const { chromium } = require('playwright');
    context = await launch(chromium, profile);
  } catch (e) {
    res.status = 'INFRA'; res.infra = String(e && e.message || e).slice(0, 300); save(); console.log(JSON.stringify(res)); process.exit(2);
  }
  let turnNow = null;
  try {
    const page = await openGame(context, res, resume);
    turnNow = await page.evaluate(() => window.__nnsMeasureDebug.snapshot().turn);
    if (resume && turnNow !== prev.turn) throw new Error('wznowienie: tura po loadSlot=' + turnNow + ' != tura stanu ' + prev.turn);
    let turn = turnNow;
    const doneBefore = res.rows.filter(r => r.turnAfter > r.turnBefore).length;
    for (let i = doneBefore; i < TURNS; i++) {
      if ((Date.now() - T0) / 1000 > BUDGET_S) { res.status = 'PAUSED'; break; }
      const row = { i: i + 1, turnBefore: turn };
      if (!MUTANT) row.prepare = await prepareEndTurnGate(page);
      let gi = await page.evaluate(() => window.__nnsMeasureDebug.gateInfo());
      row.canEndBefore = !!gi.canEnd;
      if (gi.gate && gi.gate.blokada) {
        res.gateStop = { turn, gate: gi.gate, forecast: gi.forecast, treasury: gi.treasury, granary: gi.granary };
        res.rows.push(row); res.status = 'FAIL-GATE'; break;
      }
      if (!gi.canEnd) {
        // Blokada inna niż NNS (wisząca oferta AI->gracz / pokój wymuszony z pasywnym graczem): jak w runnerach pomiarowych.
        row.diploOffersRejected = await rejectAwaitingAiOffers(page, new Set());
        row.forcedPeaceAccepted = await acceptForcedPeace(page, { forcedPeaceAccepted: 0 }, wait);
        row.battlesResolved = await clearBattles(page);
        gi = await page.evaluate(() => window.__nnsMeasureDebug.gateInfo());
        row.canEndAfterDiplo = !!gi.canEnd;
        if (!gi.canEnd) {
          const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState()).catch(() => null);
          const modal = await page.evaluate(base.blockerDumpInPage).catch(() => null);
          res.gateStop = { turn, reason: 'canEnd=false bez blokady NNS (inna blokada)', battleState: bs, modal, pendingForcedPeace: await page.evaluate(() => window.__truceTestDebug.pendingForcedPeaceForTest().length).catch(() => null) };
          res.rows.push(row); res.status = 'FAIL-BLOCKED-OTHER'; break;
        }
      }
      await page.evaluate(() => window.__nnsMeasureDebug.endTurn());
      await page.waitForFunction(() => !window.__nnsMeasureDebug.isEndTurnInProgress(), undefined, { timeout: 180000, polling: 200 }).catch(() => {});
      await wait(150);
      const after = await page.evaluate(() => window.__nnsMeasureDebug.snapshot().turn);
      row.turnAfter = after;
      res.rows.push(row);
      if (after <= turn) { res.status = 'FAIL-NO-ADVANCE'; break; }
      turn = after;
      if (res.rows.length % 5 === 0) save();
    }
    if (res.status === 'RUNNING' || res.status === 'PAUSED') {
      const done = res.rows.filter(r => r.turnAfter > r.turnBefore).length;
      if (done >= TURNS) res.status = 'PASS';
      else {
        // Pauza na granicy tury (czysty stan): zapis slotu do wznowienia w kolejnym wywołaniu.
        const saved = await page.evaluate(slot => window.__nnsMeasureDebug.quickSave(slot), SLOT).catch(() => false);
        fs.writeFileSync(stateFile, JSON.stringify({ turn, slot: SLOT, slotSaved: !!saved, res }));
        res.status = 'PAUSED';
      }
    }
    res.turnsDone = res.rows.filter(r => r.turnAfter > r.turnBefore).length;
    if (res.status === 'PASS' && fs.existsSync(stateFile)) fs.unlinkSync(stateFile);
  } catch (e) {
    res.status = 'INFRA-OR-ERROR'; res.exception = String(e && e.message || e).slice(0, 300);
  } finally {
    save();
    if (context) await context.close().catch(() => {});
  }
  const sum = { seed: SEED, mutant: MUTANT, status: res.status, turnsDone: res.turnsDone || 0, resumed: resume, gateStop: res.gateStop, pageErrors: res.errors.length, exception: res.exception || null, elapsedS: Math.round((Date.now() - T0) / 1000) };
  console.log(JSON.stringify(sum));
  // Kody wyjścia: 0 = PASS (pełne tury zrobione); 3 = PAUSED (niepełny bieg, do wznowienia przez slot — NIE zielony);
  // 2 = INFRA; 1 = FAIL. Konsument sprawdzający tylko kod wyjścia nie może uznać PAUSED za PASS.
  process.exit(res.status === 'PASS' ? 0 : (res.status === 'PAUSED' ? 3 : (res.status.startsWith('INFRA') ? 2 : 1)));
}

main();
