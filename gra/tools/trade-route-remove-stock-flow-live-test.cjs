'use strict';
/**
 * trade-route-remove-stock-flow-live-test.cjs -- R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1 (#311).
 *
 * DOWOD W ZYWEJ GRZE (headless Chromium, zbudowany bundle vite POZA repo, `?playtest=mapa&civTest=1`):
 *   1. Wymuszona AKTYWNA trasa handlowa gracz<->AI (hak civTest forceTradeRoute = createTradeRoute, ta sama
 *      funkcja co refreshTradeRoutes); trasa musi przetrwac realne endTurn (probe tradeRoutesProbe).
 *   2. Zapasy obu stron w kluczach szlakowych (braz, zelazo, cegla, kon, zloto, sol) ustawione PRZED pomiarem
 *      (setStock). Po KAZDEJ realnej turze: roznica magazynu = suma wpisow ksiegi (ticku + okno pending) --
 *      ta sama formula co tools/resource-ledger-live-measure.cjs (turnDiffs). Przeplyw szlakowy, ktory zmienia
 *      zapasy BEZ wpisu w ksiedze, daje roznice != 0 -> test czerwony (mutacja: przywrocenie E3c).
 *   3. Dochod Pieniadza ze szlaku (computeTradeRouteIncomeByCityBreakdown, probe) > 0 po kazdej turze.
 *   4. Zero pageerror / console.error w trakcie tur.
 *
 * Usage (z gra/):  BUNDLE_DIR=<abs> node tools/trade-route-remove-stock-flow-live-test.cjs
 *   BUNDLE_DIR -- katalog zbudowanego bundle (vite build --outDir <poza repo>); brak = test buduje go sam.
 *   TRSF_TURNS=<n> -- liczba tur (domyslnie 3). TRSF_RESULT=<abs file> -- zapis JSON z liczbami.
 *
 * Zmiana gry: tylko haki ?civTest=1 (odczyt + wymuszenie trasy testowej); logika tury nietknieta.
 */
const fs = require('fs');
const path = require('path');

// R-TEST-DEBT-BASE-RED-MAIN-Q2 (klasa D): test sam buduje bundle vite POZA repo, gdy BUNDLE_DIR nie wskazuje
// gotowego index.html (wcześniej exit 2 = brak kroku przygotowania, nie defekt gry).
const { execSync } = require('child_process');
const os = require('os');
const GRA_DIR = path.resolve(__dirname, '..');
let BUNDLE = process.env.BUNDLE_DIR;
if (!BUNDLE || !fs.existsSync(path.join(BUNDLE, 'index.html'))) {
  BUNDLE = path.join(os.tmpdir(), 'civ-trsf-bundle-' + process.pid);
  console.log('[trsf-live] brak BUNDLE_DIR — vite build do katalogu tymczasowego poza repo:', BUNDLE);
  // R-TEST-DEBT-BASE-RED-MAIN-Q2 (obrona r1, zarzut 3): bundle utworzony przez ten test jest sprzątany przy każdym wyjściu
  // (sukces, FAIL, blad), bo katalog w os.tmpdir() nie znika sam i zostawiał civ-trsf-bundle-<pid> po przebiegu.
  process.on('exit', () => { try { fs.rmSync(BUNDLE, { recursive: true, force: true }); } catch (_) { /* sprzątanie best-effort */ } });
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(BUNDLE)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' });
  if (!fs.existsSync(path.join(BUNDLE, 'index.html'))) {
    console.error('[trsf-live] build bez index.html');
    process.exit(2);
  }
}
const TURNS = Number(process.env.TRSF_TURNS || 3);
const RESULT_FILE = process.env.TRSF_RESULT || '';
const URL_HTML = 'file://' + path.join(BUNDLE, 'index.html') + '?playtest=mapa&civTest=1';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SZLAK_KEYS = ['braz', 'zelazo', 'cegla', 'kon', 'zloto', 'sol'];
const SETUP_STOCK = 400;

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK   ${label}`); } else {
    fail++; console.error(`  FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const endTurnBlocked = [];

async function launchBrowser(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  try { return await chromium.launch({ headless: true, args }); } catch (_) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args });
  }
}

async function endTurnWait(page) {
  const t0 = await page.evaluate(() => window.__aiTradeWiringTestDebug.info().turn);
  await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
  try {
    await page.waitForFunction(
      t => window.__aiTradeWiringTestDebug.info().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(),
      t0, { timeout: 60000 },
    );
  } catch (err) {
    const dbg = await page.evaluate(() => ({ info: window.__aiTradeWiringTestDebug.info(), inProgress: window.__aiTradeWiringTestDebug.isEndTurnInProgress(), nns: window.__aiTradeWiringTestDebug.nnsDiag() })).catch(e => ({ evalErr: String(e) }));
    console.error('  [timeout-tury] stan:', JSON.stringify(dbg).slice(0, 1200));
    console.error('  [timeout-tury] blokady:', endTurnBlocked.slice(-3));
    throw err;
  }
  await wait(150);
  return t0;
}

/** Suma rekordu ksiegi per surowiec (ta sama logika co sumRec w resource-ledger-live-measure.cjs). */
function sumRec(rec) {
  const out = {};
  for (const [rk, srcs] of Object.entries((rec && rec.byResource) || {})) {
    let s = 0;
    for (const f of Object.values(srcs)) s += f.amount;
    out[rk] = s;
  }
  return out;
}

/** Roznice (magazyn_po - magazyn_przed) - (tick + pending_po - pending_przed) per wlasciciel i surowiec. */
function turnDiffs(before, after) {
  const rows = [];
  for (const o of after.owners) {
    const sB = before.stock[o] || {}, sA = after.stock[o] || {};
    const L = after.tickSeq > before.tickSeq ? sumRec(after.tick[o]) : {};
    const PA = sumRec(after.pending[o]), PB = sumRec(before.pending[o]);
    const keys = new Set([...Object.keys(sB), ...Object.keys(sA), ...Object.keys(L), ...Object.keys(PA), ...Object.keys(PB)]);
    for (const k of keys) {
      const d = ((sA[k] || 0) - (sB[k] || 0)) - ((L[k] || 0) + (PA[k] || 0) - (PB[k] || 0));
      if (d !== 0) rows.push({ owner: o, resource: k, diff: d, stockDelta: (sA[k] || 0) - (sB[k] || 0) });
    }
  }
  return rows;
}

(async () => {
  const { chromium } = require('playwright');
  const errors = [];
  const browser = await launchBrowser(chromium);
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errors.push('pageerror: ' + String(e && e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); if (m.type() === 'warning' && /\[EndTurn\] blocked/.test(m.text())) endTurnBlocked.push(m.text()); });

  console.log('\n-- start gry (?playtest=mapa&civTest=1) --');
  await page.goto(URL_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!(window.__aiTradeWiringTestDebug && window.__ledgerTestDebug), null, { timeout: 120000 });
  const info0 = await page.evaluate(() => window.__aiTradeWiringTestDebug.info());
  assert('start: hak gry dostepny (tura startowa)', typeof info0.turn === 'number', info0);

  const founded = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
  assert('sandbox: zalozenie pierwszego miasta gracza', founded === true);
  const aiId = info0.ai;
  const me = info0.me;
  const prep = await page.evaluate(a => window.__aiTradeWiringTestDebug.prepare(a), aiId);
  assert('setup: kontakt z AI i nie-wojna (prepare)', !!(prep && prep.contact && prep.status !== 'wojna'), prep);

  // SETUP: miasto AI (realne foundCityAt, pierscien 8..30 od gracza) -- bez niego AI nie ma zapasow ani trasy.
  const spawned = await page.evaluate(a => window.__ledgerTestDebug.spawnOwnerCity(a), aiId);
  assert('setup: miasto AI zalozone (spawnOwnerCity)', !!spawned, spawned);
  // SETUP: zapasy obu stron w kluczach szlakowych (przed pierwszym pomiarem) i AKTYWNA trasa gracz<->AI.
  for (const k of SZLAK_KEYS) {
    await page.evaluate(([o, key, v]) => window.__aiTradeWiringTestDebug.setStock(o, key, v), [me, k, SETUP_STOCK]);
    // AI bez zapasu (0): deficyt po jednej stronie, zeby przeplyw (gdyby istnial) mial powod zadzialac.
    await page.evaluate(([o, key, v]) => window.__aiTradeWiringTestDebug.setStock(o, key, v), [aiId, k, 0]);
  }
  const forced = await page.evaluate(([a, b]) => window.__ledgerTestDebug.forceTradeRoute(a, b), [me, aiId]);
  assert('setup: Umowa Szlakow gracz<->AI + przeliczenie tras (realna sciezka refreshTradeRoutes): >=1 trasa', !!(forced && forced.routes > 0), forced);
  const probe0 = await page.evaluate(() => window.__ledgerTestDebug.tradeRoutesProbe());
  assert('setup: trasa widoczna w tradeRoutes przed pierwsza tura', probe0.count > 0, probe0);

  const result = { me, ai: aiId, forced, turns: [], errorsBefore: errors.length };
  console.log('\n-- tury z REALNYM endTurn, aktywna trasa --');
  for (let i = 0; i < TURNS; i++) {
    const before = await page.evaluate(() => window.__ledgerTestDebug.snapshot());
    const probeBefore = await page.evaluate(() => window.__ledgerTestDebug.tradeRoutesProbe());
    const t = await endTurnWait(page);
    const after = await page.evaluate(() => window.__ledgerTestDebug.snapshot());
    const probeAfter = await page.evaluate(() => window.__ledgerTestDebug.tradeRoutesProbe());
    const diffs = turnDiffs(before, after);
    const stockPick = o => SZLAK_KEYS.reduce((acc, k) => { acc[k] = { przed: (before.stock[o] || {})[k] || 0, po: (after.stock[o] || {})[k] || 0 }; return acc; }, {});
    const row = {
      startTurn: t,
      routesBefore: probeBefore.count,
      routesAfter: probeAfter.count,
      incomeBefore: probeBefore.incomeByOwner,
      incomeAfter: probeAfter.incomeByOwner,
      stockMe: stockPick(me),
      stockAi: stockPick(aiId),
      unexplainedStockDiffs: diffs,
    };
    // Zmiany kluczy szlakowych obu stron (scenariusz bez produkcji/konsumpcji tych kluczy: zapas stale 400).
    row.szlakDeltas = [me, aiId].flatMap(o => SZLAK_KEYS
      .map(k => ({ owner: o, key: k, delta: ((after.stock[o] || {})[k] || 0) - ((before.stock[o] || {})[k] || 0), zrodla: Object.keys(((after.tick[o] || {}).byResource || {})[k] || {}) }))
      .filter(x => x.delta !== 0));
    result.turns.push(row);
    console.log(`  tura ${t}: trasy ${probeBefore.count}->${probeAfter.count}; dochod ${JSON.stringify(probeAfter.incomeByOwner)}; nieujete roznice zapasow=${diffs.length}`);
    console.log(`    zapasy gracz (braz/zelazo/cegla/kon/zloto/sol) przed=${SZLAK_KEYS.map(k => row.stockMe[k].przed).join('/')} po=${SZLAK_KEYS.map(k => row.stockMe[k].po).join('/')}`);
    console.log(`    zapasy AI    (braz/zelazo/cegla/kon/zloto/sol) przed=${SZLAK_KEYS.map(k => row.stockAi[k].przed).join('/')} po=${SZLAK_KEYS.map(k => row.stockAi[k].po).join('/')}`);
  }

  console.log('\n-- asercje --');
  assert(`tury: przeszlo ${TURNS} tur realnym endTurn`, result.turns.length === TURNS);
  assert('szlak aktywny w KAZDEJ turze (trasa przetrwala refreshTradeRoutes)', result.turns.every(r => r.routesBefore > 0 && r.routesAfter > 0), result.turns.map(r => [r.routesBefore, r.routesAfter]));
  assert('dochod Pieniadza ze szlaku naliczany w KAZDEJ turze (suma > 0)', result.turns.every(r => Object.values(r.incomeAfter).reduce((s, v) => s + v, 0) > 0), result.turns.map(r => r.incomeAfter));
  const allDiffs = result.turns.flatMap(r => r.unexplainedStockDiffs.map(d => ({ turn: r.startTurn, ...d })));
  assert('zapasy: zero nieujetych zmian magazynu w turach z aktywnym szlakiem (szlak nie przenosi zapasow)', allDiffs.length === 0, allDiffs.slice(0, 8));
  const szlakChanges = result.turns.flatMap(r => r.szlakDeltas.map(d => ({ turn: r.startTurn, ...d })));
  assert('szlak nie zmienia zapasow obu stron (kl. szlakowe stale; brak produkcji w scenariuszu)', szlakChanges.length === 0, szlakChanges.slice(0, 8));
  const errsAfter = errors.slice(result.errorsBefore);
  assert('zero pageerror / console.error w trakcie tur', errsAfter.length === 0, errsAfter.slice(0, 5));

  if (RESULT_FILE) fs.writeFileSync(RESULT_FILE, JSON.stringify(result, null, 2));
  await browser.close();
  console.log(`\ntrade-route-remove-stock-flow-live-test: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('[trsf-live] blad:', e && e.stack || e); process.exit(1); });
