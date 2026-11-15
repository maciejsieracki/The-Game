'use strict';
/**
 * trade-route-remove-stock-flow-live-test.cjs -- R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1 (#311).
 *
 * DOWOD W ZYWEJ GRZE (headless Chromium, zbudowany bundle vite POZA repo, `?playtest=mapa&civTest=1`):
 *   1. Gra startuje, tury 1..N przechodza przez REALNY endTurn bez bledow (pageerror / console.error).
 *   2. Po kazdej turze: zapasy wszystkich wlascicieli (ledger snapshot) -- brak wpisu zrodla „szlak”
 *      w ksiedze ticku oraz licznik odpalen przeplywu E3c (e3cFires) pozostaje 0.
 *   3. Jesli w trakcie scenariusza pojawi sie aktywna trasa (`__aiTradeWiringTestDebug.info` / liczniki
 *      tras), raportowany jest dochod Pieniadza ze szlaku (nie wymuszamy trasy -- NIE ZMIERZONO, gdy brak).
 *
 * Usage (z gra/):  BUNDLE_DIR=<abs> node tools/trade-route-remove-stock-flow-live-test.cjs
 *   BUNDLE_DIR -- katalog zbudowanego bundle (vite build --outDir <poza repo>).
 *   TRSF_TURNS=<n> -- liczba tur (domyslnie 3). TRSF_RESULT=<abs file> -- zapis JSON z liczbami.
 *
 * Zero zmian w grze -- test tylko czyta hooki ?civTest=1.
 */
const fs = require('fs');
const path = require('path');

const BUNDLE = process.env.BUNDLE_DIR;
if (!BUNDLE || !fs.existsSync(path.join(BUNDLE, 'index.html'))) {
  console.error('[trsf-live] brak BUNDLE_DIR z index.html (zbuduj vite --outDir poza repo).');
  process.exit(2);
}
const TURNS = Number(process.env.TRSF_TURNS || 3);
const RESULT_FILE = process.env.TRSF_RESULT || '';
const URL_HTML = 'file://' + path.join(BUNDLE, 'index.html') + '?playtest=mapa&civTest=1';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

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
  const prep = await page.evaluate(a => window.__aiTradeWiringTestDebug.prepare(a), aiId);
  assert('setup: kontakt z AI i nie-wojna (prepare)', !!(prep && prep.contact && prep.status !== 'wojna'), prep);

  const result = { turns: [], e3cFiresMax: 0, szlakSourceSeen: false, errorsBefore: errors.length };
  console.log('\n-- tury z REALNYM endTurn --');
  for (let i = 0; i < TURNS; i++) {
    const snap = await page.evaluate(() => {
      const s = window.__ledgerTestDebug.snapshot();
      const stock = s.stock;
      const srcKeys = new Set();
      for (const o of Object.keys(s.tick || {})) {
        for (const rk of Object.keys((s.tick[o] && s.tick[o].byResource) || {})) {
          for (const f of Object.values(s.tick[o].byResource[rk] || {})) {
            if (f && typeof f.kind === 'string') srcKeys.add(f.kind);
          }
        }
      }
      return { turn: s.turn, stock, e3cFires: s.e3cFires, e3cLast: s.e3cLast, kinds: [...srcKeys] };
    });
    const t = await endTurnWait(page);
    result.turns.push({ startTurn: t, stockBefore: snap.stock, kinds: snap.kinds, e3cFires: snap.e3cFires });
    result.e3cFiresMax = Math.max(result.e3cFiresMax, snap.e3cFires || 0);
    if (snap.kinds.some(k => /szlak|trade_route|trasa/i.test(k))) result.szlakSourceSeen = true;
    console.log(`  tura ${t}: zapasy wlascicieli=${Object.keys(snap.stock).length}, zrodla=${snap.kinds.length}, e3cFires=${snap.e3cFires}`);
  }
  const after = await page.evaluate(() => window.__ledgerTestDebug.snapshot());
  result.finalStock = after.stock;
  result.finalTurn = after.turn;

  console.log('\n-- asercje --');
  assert(`tury: przeszlo ${TURNS} tur realnym endTurn`, after.turn >= info0.turn + TURNS, { from: info0.turn, to: after.turn });
  assert('przeplyw E3c nie odpalil ani razu (e3cFires == 0)', result.e3cFiresMax === 0, { e3cFiresMax: result.e3cFiresMax });
  assert('ksiega zrodel nie zawiera zrodla „szlak” / trasa', !result.szlakSourceSeen, { kinds: result.turns.map(t => t.kinds) });
  const errsAfter = errors.slice(result.errorsBefore);
  assert('zero pageerror / console.error w trakcie tur', errsAfter.length === 0, errsAfter.slice(0, 5));

  console.log('\n-- dochod ze szlaku (NIE ZMIERZONO, gdy brak aktywnej trasy w scenariuszu) --');
  console.log('  NIE ZMIERZONO: scenariusz 3 tur w mapa nie wymusza aktywnej trasy handlowej;');
  console.log('  przed/po liczby Pieniadza ze szlaku wymagaja hooka ustawiajacego trasy (poza zakresem tego ruchu).');
  result.szlakIncomeMeasured = false;

  if (RESULT_FILE) fs.writeFileSync(RESULT_FILE, JSON.stringify(result, null, 2));
  await browser.close();
  console.log(`\ntrade-route-remove-stock-flow-live-test: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('[trsf-live] blad:', e && e.stack || e); process.exit(1); });
