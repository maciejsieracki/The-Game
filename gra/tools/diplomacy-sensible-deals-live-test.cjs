'use strict';

/**
 * diplomacy-sensible-deals-live-test.cjs — R-WEB-DIPLO-DEALS-SENSIBLE-Q1 (R2, B4).
 *
 * POMIAR W PRAWDZIWEJ GRZE (headless Chromium, zbudowany bundle vite, `?playtest=mapa`).
 * Dwa przebiegi na tym samym ziarnie/sandboxie:
 *   BASE  = filtr bilansu OFF + blokada końca tury OFF (zachowanie sprzed zmiany),
 *   SENS  = filtr bilansu ON  + blokada końca tury ON  (nowe zachowanie).
 * Dla każdej tury: liczba ofert handlowych AI->gracz na stole (przed decyzją gracza),
 * ile z nich ma bilans PW gracza < 0, powody (reason), czy koniec tury jest zablokowany
 * gdy oferta wisi, czy odblokowuje się po rozpatrzeniu (odrzuceniu), i czas zakończenia tury.
 *
 * OGRANICZENIE (BLOKADA, zgłoszona w raporcie): `?playtest=mapa` jest jednym ustalonym
 * sandboxem; hak nie pozwala na zmianę ziarna z URL, więc pomiar obejmuje JEDNO ziarno.
 * Parametry: DEALS_LIVE_TURNS (domyślnie 40), DEALS_LIVE_OUT (katalog bundla, poza repo).
 *
 * Uruchamianie z gra/: node tools/diplomacy-sensible-deals-live-test.cjs
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = process.env.DEALS_LIVE_OUT || path.join(os.tmpdir(), 'deals-sensible-live-dist');
const TURNS = Number(process.env.DEALS_LIVE_TURNS || 40);
const URL_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0;
let fail = 0;
let lastEndTurnBlock = '';
function assert(label, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  OK   ${label}`);
  } else {
    fail++;
    console.error(`  FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function median(xs) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function buildBundle() {
  console.log(`[deals-live] build vite -> ${OUT_DIR}`);
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) throw new Error('Build bez index.html');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (_) {
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function bootPlaytest(page) {
  await page.goto(URL_HTML, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(
    () => !!window.__dealsLiveDebug && !!window.__buildRequestTestDebug
      && window.__buildRequestTestDebug.getWorldState().citiesLen > 0
      && window.__dealsLiveDebug.snapshot().turn === 1,
    undefined,
    { timeout: 180000 },
  );
  // Playtest startuje bez miasta gracza (bramka awaitingFirstPlayerCity blokuje koniec tury).
  const founded = await page.evaluate(() => window.__dealsLiveDebug.foundFirstCity());
  if (!founded) throw new Error('Nie udało się założyć pierwszego miasta gracza w sandboxie');
  await wait(300);
}

/** Jedna pełna seria tur w zadanym ustawieniu (gate, filter); zwraca statystyki. */
async function runSeries(page, label, gate, filter) {
  await page.evaluate(([g, f]) => {
    window.__dealsLiveDebug.setGate(g);
    window.__dealsLiveDebug.setFilter(f);
  }, [gate, filter]);
  const perTurn = [];
  const endTurnMs = [];
  for (let i = 0; i < TURNS; i++) {
    const snap = await page.evaluate(() => window.__dealsLiveDebug.snapshot());
    const pendingNeg = snap.pending.length;
    const negCount = snap.pending.filter(p => p.balancePn < 0).length;
    const canEndWhilePending = snap.canEnd;
    const reasons = snap.pending.map(p => p.reason);
    // Rozpatrz (odrzuć) wszystkie oferty handlowe AI, potem sprawdź odblokowanie końca tury.
    const rejected = await page.evaluate(() => window.__dealsLiveDebug.rejectAllAiTradeOffers());
    const snapAfter = await page.evaluate(() => window.__dealsLiveDebug.snapshot());
    const t0 = Date.now();
    const turnBefore = snapAfter.turn;
    await page.evaluate(() => window.__dealsLiveDebug.endTurn());
    try {
      await page.waitForFunction(
        (t) => {
          const s = window.__dealsLiveDebug.snapshot();
          return s.turn > t && !s.endTurnInProgress;
        },
        turnBefore,
        { timeout: 60000 },
      );
    } catch (_) { /* oznaczone niżej jako brak przejścia tury */ }
    const ms = Date.now() - t0;
    const after = await page.evaluate(() => window.__dealsLiveDebug.snapshot());
    if (after.turn <= turnBefore) {
      console.log(`[deals-live] tura ${turnBefore} NIE przeszła: ${JSON.stringify({ turn: after.turn, eip: after.endTurnInProgress, canEnd: after.canEnd, pending: after.pending.length, lastBlock: lastEndTurnBlock })}`);
    }
    perTurn.push({
      turn: turnBefore,
      pendingNeg,
      negCount,
      canEndWhilePending,
      rejected,
      canEndAfterDecision: snapAfter.canEnd,
      reasons,
      advanced: after.turn > turnBefore,
    });
    endTurnMs.push(ms);
  }
  const totalPending = perTurn.reduce((s, t) => s + t.pendingNeg, 0);
  const totalNeg = perTurn.reduce((s, t) => s + t.negCount, 0);
  const advanced = perTurn.filter(t => t.advanced).length;
  console.log(`[deals-live] ${label}: tury=${perTurn.length} ofert AI->gracz=${totalPending} z bilansem<0=${totalNeg} przejść tury=${advanced}/${perTurn.length} medianaMs=${median(endTurnMs)}`);
  return { label, perTurn, endTurnMs, totalPending, totalNeg, advanced };
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (_) {
    console.error('[deals-live] playwright nie znaleziony (uruchom z gra/).');
    process.exit(1);
  }
  buildBundle();
  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
      if (msg.text().startsWith('[EndTurn] blocked')) lastEndTurnBlock = msg.text().slice(0, 160);
    });
    page.on('pageerror', err => consoleErrors.push('[pageerror] ' + err.message));
    await bootPlaytest(page);

    const base = await runSeries(page, 'BASE (filtr OFF, blokada OFF)', false, false);
    await page.evaluate(() => window.__dealsLiveDebug.setGate(true));

    // Świeży bootstrap przed serią SENS (ten sam sandbox).
    await page.reload({ waitUntil: 'load', timeout: 180000 });
    await bootPlaytest(page);
    const sens = await runSeries(page, 'SENS (filtr ON, blokada ON)', true, true);

    assert('BASE: oferty AI->gracz w sandboxie zaobserwowane (pomiar nie jest pusty)', base.totalPending > 0, base.totalPending);
    assert('SENS: żadna oferta AI->gracz z bilansem PW < 0', sens.totalNeg === 0, sens.totalNeg);
    assert('SENS: gdy oferta wisi, koniec tury jest zablokowany', sens.perTurn.every(t => t.pendingNeg === 0 || t.canEndWhilePending === false));
    assert('SENS: po rozpatrzeniu oferty koniec tury odblokowany', sens.perTurn.every(t => t.canEndAfterDecision === true));
    assert('SENS: każda tura przeszła (brak osieroconej blokady)', sens.advanced === TURNS, { advanced: sens.advanced, turns: TURNS });
    const baseMed = median(base.endTurnMs);
    const sensMed = median(sens.endTurnMs);
    assert('czas tury SENS <= 1,10 x BASE (mediana)', sensMed <= baseMed * 1.10 + 1, { sensMed, baseMed });
    const reasonsSeen = sens.perTurn.flatMap(t => t.reasons).filter(r => r);
    console.log(`[deals-live] powody ofert SENS (próbka): ${JSON.stringify(reasonsSeen.slice(0, 5))}`);
    console.log(`[deals-live] JSON ${JSON.stringify({
      turns: TURNS,
      base: { offers: base.totalPending, negBalance: base.totalNeg, advanced: base.advanced, medianMs: baseMed },
      sens: { offers: sens.totalPending, negBalance: sens.totalNeg, advanced: sens.advanced, medianMs: sensMed },
      seeds: 1,
    })}`);
    const realErrors = consoleErrors.filter(e => !/favicon|Failed to load resource/i.test(e));
    assert('zero console.error / pageerror w trakcie pomiaru', realErrors.length === 0, realErrors.slice(0, 3));
  } finally {
    await browser.close();
  }
  console.log(`\ndiplomacy-sensible-deals-live-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('[deals-live] błąd:', err && err.stack ? err.stack : err);
  process.exit(1);
});
