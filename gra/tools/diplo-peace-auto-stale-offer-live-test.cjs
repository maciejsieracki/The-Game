'use strict';
/**
 * diplo-peace-auto-stale-offer-live-test.cjs — R-WEB-DIPLO-PEACE-AUTO-NO-CITIES-STALE-OFFER-DIAG-Q1 (r3).
 *
 * PEŁNA PĘTLA GRY w headless Chromium (bundle Vite, ?playtest=mapa&civTest=1), REALNE endTurn / finalizePeaceTreatyBetween /
 * resolvePendingNegotiationsForOwner / pruneInvalidNegotiations. Hooki tylko pod ?civTest=1 (__truceTestDebug).
 *
 *  S1  wojna gracz<->AI ~11-14 tur (zmęczenie ~27-35%), BEZ klikania: pokój NIE powstaje sam (status 'wojna' po każdej turze).
 *  S2  zmęczenie 100% (wiek wojny 40): pokój WYMUSZONY, okno "Rozumiem" w DOM, wpis "Pokój wymuszony" w warEventLog ("Ważne").
 *  S3  wpisy zależne od wojny (pokoj z miastami AI, rozejm) dodane PO pokoju: pruneInvalidNegotiations (negotiationStillValid
 *      + isAtPeace) czyści je (stary zapis / wpis spóźniony).
 *  S4  finalizePeaceTreatyBetween czyści ze stołu WSZYSTKIE wpisy zależne od wojny tej pary (2x pokoj jak na zrzucie 1c + rozejm
 *      z miastem AI = "Dar / prezent").
 *  S5  Z5 (regresja splice): dwa wpisy 'rozejm' tej pary czekające na AI; rozstrzygnięcie pierwszego (pokój) usuwa drugi — pętla
 *      resolvePendingNegotiationsForOwner NIE rzuca TypeError (zero pageerror).
 *  C   zero pageerror / console.error.
 *
 * Usage (z gra/): node ./node_modules/vite/bin/vite.js build --outDir <scratch> --emptyOutDir
 *                 SKIP_BUILD=1 node tools/diplo-peace-auto-stale-offer-live-test.cjs <scratch> [evidenceDir]
 * Wynik: kod wyjścia 0 = PASS; tabela tur w evidenceDir/live-table.json.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-peaceauto-live-' + process.pid);
const EVIDENCE = process.argv[3]
  || path.join(REPO_ROOT, 'dyspozycje', 'autobot', 'runs', 'R-WEB-DIPLO-PEACE-AUTO-NO-CITIES-STALE-OFFER-DIAG-Q1', 'evidence');
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa&civTest=1';
const FALLBACK_CHROME = (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium');
const PLAYER = 0;
const AI = 1;

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else { fail++; console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildBundle() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(SCRATCH, 'index.html'))) return;
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(SCRATCH)} --emptyOutDir`, { cwd: GRA_DIR, stdio: 'pipe' });
  if (!fs.existsSync(path.join(SCRATCH, 'index.html'))) throw new Error('Build bez index.html');
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  }
}

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__peaceRulesTestDebug && !!window.__truceTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1,
    undefined, { timeout: 900000 },
  );
  await wait(300);
}

const waitIdle = (page) => page.waitForFunction(() => !window.__eraTestDebug.isEndTurnInProgress(), undefined, { timeout: 180000 });
async function endOneTurn(page) {
  await waitIdle(page);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  await waitIdle(page);
  await wait(150);
}
/** Pełna tura: endTurn przesuwa miejsce, więc wołamy aż licznik tury wzrośnie (max 12 prób). */
async function endFullTurn(page) {
  const start = await page.evaluate(() => window.__truceTestDebug.turn());
  for (let i = 0; i < 12; i++) {
    await endOneTurn(page);
    if ((await page.evaluate(() => window.__truceTestDebug.turn())) > start) return;
  }
  const st = await page.evaluate(() => ({
    inProgress: window.__eraTestDebug.isEndTurnInProgress(),
    overlays: Array.from(document.querySelectorAll('.civ-diplo-basket-overlay, .civ-diplo-audience, [role=dialog], .civ-diplo-modal-overlay')).map(n => n.className + ' :: ' + (n.innerText || '').slice(0, 200)),
    gate: (document.body.innerText.match(/Zakończ turę[^\n]{0,160}/) || [''])[0],
    toast: (document.querySelector('#civ-hint-toast') || {}).innerText || '',
  })).catch(e => ({ err: String(e) }));
  throw new Error('endFullTurn: tura nie ruszyła z ' + start + ' ' + JSON.stringify(st));
}
const pairState = (page) => page.evaluate(([a, b]) => window.__truceTestDebug.pairState(a, b), [PLAYER, AI]);
const table = (page) => page.evaluate(() => window.__truceTestDebug.tableSummaryForTest());
const warLog = (page) => page.evaluate(() => window.__truceTestDebug.warLogForTest());
const pairWarDep = (rows) => rows.filter((r) => (r.actionId === 'pokoj' || r.actionId === 'rozejm')
  && ((r.proposer === PLAYER && r.responder === AI) || (r.proposer === AI && r.responder === PLAYER)));
const closeModal = (page) => page.evaluate(() => { document.querySelectorAll('.cd-forced-peace-ok').forEach((b) => b.click()); });

async function main() {
  const { chromium } = require('playwright');
  fs.mkdirSync(EVIDENCE, { recursive: true });
  buildBundle();
  const browser = await launchBrowser(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  const rows = [];
  try {
    // --- S1: 28% bez klikania (świeża strona; po 1 pełnej turze gra może blokować kolejne - bitwa w kolejce)
    console.log('[S1] wojna ~11 tur (zmęczenie ~27-30%), bez klikania');
    const page1 = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page1.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page1.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
    await gotoPlaytestMapa(page1);
    await page1.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
    await page1.evaluate(() => window.__nnsMeasureDebug.setPlayerGranary(999));
    await page1.evaluate((ai) => window.__truceTestDebug.setWarAge(ai, 11), AI);
    await endFullTurn(page1);
    // Tick po turze mógł zostać pominięty (bitwa w kolejce); wołamy REALNY tick jeszcze raz bez bramki bitwy.
    await page1.evaluate(() => window.__truceTestDebug.runWearinessTickForTest());
    {
      const st = await pairState(page1);
      const t = await table(page1);
      const w = await page1.evaluate(([a, b]) => window.__truceTestDebug.wearinessStateForTest(a, b), [PLAYER, AI]);
      const war = await page1.evaluate((ai) => window.__peaceRulesTestDebug.getWarTurns(ai), AI);
      rows.push({ scenario: 'S1', turn: st.turn, warTurns: war.turnsAtWar, status: st.status, weariness: w, tablePairWarDep: pairWarDep(t).length });
      assert(`S1 tura ${st.turn}: tick zmęczenia policzył stan pary (dowód, że tick zadziałał)`, !!w && w.peak > 0 && w.peak < 1, w);
      assert(`S1 wojna trwa bez kliknięcia gracza (wiek ${war.turnsAtWar}, szczyt ${w && w.peak})`, st.status === 'wojna', st);
    }
    await page1.close();
    // --- S2: 100% (świeża strona)
    console.log('[S2] zmęczenie 100% (wiek 40)');
    await gotoPlaytestMapa(page);
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
    await page.evaluate(() => window.__nnsMeasureDebug.setPlayerGranary(999));
    await page.evaluate((ai) => window.__truceTestDebug.setWarAge(ai, 40), AI);
    await endFullTurn(page);
    await page.evaluate(() => window.__truceTestDebug.runWearinessTickForTest());
    {
      const st = await pairState(page);
      const wl = await warLog(page);
      const modal = await page.locator('.cd-forced-peace-ok').count();
      rows.push({ scenario: 'S2-pending', turn: st.turn, status: st.status, peaceLogBefore: wl.filter((e) => /Pokój zawarty/.test(e.title)).length, modalOpen: modal > 0 });
      // PENDING-FORCED-PEACE-Q1: pokój wymuszony z graczem czeka na akceptację (status „wojna”, okno w DOM, bez wpisu „Pokój zawarty”).
      assert('S2 pokój wymuszony OCZEKUJE na akceptację przy 100% (status wojna)', st.status === 'wojna', st);
      assert('S2 okno "Akceptuję warunki pokoju" (showForcedPeaceModal) w DOM', modal > 0, modal);
      assert('S2 przed akceptacją: brak wpisu "Pokój zawarty" w "Ważne"', !wl.some((e) => /Pokój zawarty/.test(e.title)), wl);
      await closeModal(page);
      await wait(100);
    }
    {
      const st = await pairState(page);
      const wl = await warLog(page);
      const peaceEntries = wl.filter((e) => /Pokój zawarty/.test(e.title));
      const forcedEntries = wl.filter((e) => e.id.startsWith('forced-peace'));
      rows.push({ scenario: 'S2-accepted', turn: st.turn, status: st.status, peaceLogAfter: peaceEntries.map((e) => e.title), forcedPeaceLog: forcedEntries.length });
      assert('S2 po akceptacji pokój zawarty (status pokoj)', st.status === 'pokoj', st);
      assert('S2 po akceptacji dokładnie 1 wpis "Pokój zawarty" w "Ważne"', peaceEntries.length === 1, wl);
      assert('S2 brak duplikatu wpisu forced-peace-*', forcedEntries.length === 0, forcedEntries);
    }
    // --- S3: wpisy po pokoju -> prune
    console.log('[S3] martwe wpisy po pokoju (prune)');
    await page.evaluate(([ai]) => {
      const d = window.__truceTestDebug;
      d.pushNegotiationForTest('pokoj', ai, 0, 0, ai);       // oferta miasta AI "za pokój" (u gracza jako Dar/prezent)
      d.pushNegotiationForTest('rozejm', 0, ai, ai, null, 5);
    }, [AI]);
    const before3 = pairWarDep(await table(page)).length;
    await page.evaluate(() => window.__truceTestDebug.purgeStaleForTest());
    const after3 = pairWarDep(await table(page)).length;
    rows.push({ scenario: 'S3', before: before3, after: after3 });
    assert('S3 przed prune: 2 wpisy zależne od wojny', before3 === 2, before3);
    assert('S3 po prune (negotiationStillValid+isAtPeace): 0 wpisów', after3 === 0, after3);
    // --- S4: finalize czyści
    console.log('[S4] finalizePeaceTreatyBetween czyści wpisy pary');
    await page.evaluate((ai) => window.__truceTestDebug.setWarAge(ai, 12), AI);
    await page.evaluate(([ai]) => {
      const d = window.__truceTestDebug;
      d.pushNegotiationForTest('pokoj', 0, ai, ai, null);
      d.pushNegotiationForTest('pokoj', ai, 0, 0, ai);
      d.pushNegotiationForTest('rozejm', ai, 0, 0, ai, 5);
    }, [AI]);
    const before4 = pairWarDep(await table(page)).length;
    await page.evaluate(([a, b]) => window.__truceTestDebug.finalizePeaceForTest(a, b), [PLAYER, AI]);
    const after4 = pairWarDep(await table(page)).length;
    rows.push({ scenario: 'S4', before: before4, after: after4, status: (await pairState(page)).status });
    assert('S4 przed pokojem: 3 wpisy zależne od wojny', before4 === 3, before4);
    assert('S4 po pokoju: 0 wpisów (pokoj x2 + rozejm z miastem)', after4 === 0, after4);
    // --- S5: Z5 stabilność pętli
    console.log('[S5] Z5: dwa wpisy rozejm, pierwszy rozstrzygnięty usuwa drugi, brak TypeError');
    await page.evaluate((ai) => window.__truceTestDebug.setWarAge(ai, 12), AI);
    await page.evaluate(([ai]) => {
      const d = window.__truceTestDebug;
      d.pushNegotiationForTest('rozejm', 0, ai, ai, null, 5);
      d.pushNegotiationForTest('rozejm', 0, ai, ai, null, 5);
      d.forceAiTruceDecisionForTest('accept');
    }, [AI]);
    const errBefore = errors.length;
    await page.evaluate((ai) => window.__truceTestDebug.resolveAiAwaitingForTest(ai), AI);
    const after5 = pairWarDep(await table(page)).length;
    const st5 = await pairState(page);
    rows.push({ scenario: 'S5', after: after5, status: st5.status, truceUntilTurn: st5.truceUntilTurn, newErrors: errors.slice(errBefore) });
    assert('S5 brak błędu strony (TypeError) po rozstrzygnięciu wpisów z usuwaniem sąsiada', errors.length === errBefore, errors.slice(errBefore));
    assert('S5 rozejm zawarty, oba wpisy usunięte', st5.status === 'pokoj' && st5.truceUntilTurn != null && after5 === 0, { st5, after5 });
  } catch (e) {
    fail++;
    console.error(' FAIL wyjątek testu: ' + (e && e.stack || e));
  }
  assert('C zero pageerror/console.error', errors.length === 0, errors.slice(0, 5));
  fs.writeFileSync(path.join(EVIDENCE, 'live-table.json'), JSON.stringify({ rows, errors }, null, 2));
  await browser.close();
  console.log(`\nPASS=${pass} FAIL=${fail}`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(2); });
