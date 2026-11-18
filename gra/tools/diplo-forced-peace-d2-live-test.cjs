'use strict';
/**
 * diplo-forced-peace-d2-live-test.cjs -- R-WEB-DIPLO-FORCED-PEACE-D2-HOOKS-Q1 (runda 1, Operator).
 *
 * Żywa gra w headless Chromium (bundle Vite, ?playtest=mapa&civTest=1), REALNE endTurn / okno / akceptacja.
 * Trzy ścieżki z dispatchu:
 *   D2 -- dwa pokoje wymuszone w tej samej turze; po akceptacji pierwszego drugie okno pojawia się SAMO
 *         (bez Esc/kliknięcia), pending maleje do 1, tura blokowana do akceptacji drugiego.
 *   S  -- zapis gry z oczekującym pokojem wymuszonym, potem wczytanie: czy pending wraca i okno otwiera się samo.
 *   A  -- pokój wymuszony AI<->AI: nie trafia do kolejki gracza (pendingForcedPeaceForTest) i nie otwiera okna.
 *
 * Hooki civTest użyte: setWarAge, pendingForcedPeaceForTest, pairState, warLogForTest, declareWar,
 *   wearinessStateForTest, saveForTest / loadForTest (dopisane w tym temacie, tylko ?civTest=1).
 *
 * Usage (z gra/): SKIP_BUILD=1 node tools/diplo-forced-peace-d2-live-test.cjs <buildDir> [evidenceDir]
 * Wynik: kod wyjścia 0 = wszystkie zmierzone asercje PASS. Scenariusz bez wystarczających warunków = NIE ZMIERZONO.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

const GRA_DIR = path.resolve(__dirname, '..');
const BUILD = process.argv[2] || path.join(os.tmpdir(), 'civ-fp-d2-' + process.pid);
const EVIDENCE = process.argv[3] || path.join(BUILD, 'evidence');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const PLAYER = 0;
const SEED = 4242;
const BUILD_INDEX = path.join(BUILD, 'index.html');
const MAJOR_DIAG_IDS = [];
const SLOT = 'd2-forced-peace-slot';

const results = {};
let fails = 0;
function scenario(id, label) { results[id] = { label, asserts: [], status: 'PASS' }; console.log(`[${id}] ${label}`); }
function check(id, ok, what, detail) {
  results[id].asserts.push({ ok: !!ok, what, detail });
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''}`);
  if (!ok) { results[id].status = 'FAIL'; fails++; }
}
function measured(id, what, detail) { results[id].asserts.push({ ok: null, what, detail }); console.log(`  DATA ${what} -- ${JSON.stringify(detail)}`); }
function nmz(id, why) { results[id].status = 'NIE ZMIERZONO'; results[id].why = why; console.log(`  NIE ZMIERZONO: ${why}`); }

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  }
}
/** R-WEB-DIPLO-FORCED-PEACE-D2 (r3): pełna gra `?civTest=1&civSeed=` (jak ai-economy-measure-hook-test), NIE playtest=mapa.
 * Powód: playtest=mapa ma jednego głównego AI (AI 2..6 to miasta-państwa), więc pary AI↔AI i druga para z graczem
 * nie kwalifikują się do pokoju wymuszonego (isMajorAiCivForForcedPeace). */
async function gotoFullGame(page) {
  await page.goto('file://' + BUILD_INDEX + '?civTest=1&civSeed=' + SEED, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(
    () => !!window.__nnsMeasureDebug && !!window.__aiTradeWiringTestDebug && !!window.__truceTestDebug && !!window.__eraTestDebug,
    undefined, { timeout: 180000 },
  );
  await page.evaluate((sd) => window.__nnsMeasureDebug.startGame({ seed: sd }), SEED);
  await page.waitForFunction(() => { try { return window.__aiTradeWiringTestDebug.state().turn >= 1; } catch (_) { return false; } }, undefined, { timeout: 180000 });
  await page.waitForFunction(() => {
    const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
  }, undefined, { timeout: 600000, polling: 500 });
  if (!(await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity()))) throw new Error('foundFirstCity=false');
  await wait(300);
  // Ekran powitalny cywilizacji (z-index 9650) zasłania okna dyplomacji w nowej grze: zamykamy jak gracz („Zamknij”).
  await page.evaluate(() => { const b = document.querySelector('#civ-welcome-screen-root [data-cww="close"]'); if (b) b.click(); });
  await wait(300);
  try { await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest()); } catch (e) { /* opcjonalne */ }
}
/** Obejście bramki NNS gracza (tura 1+: canEnd=false bez dosypki) — jak ai-economy-measure-run (dodatnia dosypka, tylko civTest). */
const ungate = (page) => page.evaluate(() => {
  const d = window.__aiTradeWiringTestDebug;
  if (d.nnsGateBlocked()) { d.grantPlayerGold(200); d.grantPlayerFood(200); }
});
const waitIdle = (page) => page.waitForFunction(() => !window.__eraTestDebug.isEndTurnInProgress(), undefined, { timeout: 180000 });
const turnNo = (page) => page.evaluate(() => window.__truceTestDebug.turn());
const pendingList = (page) => page.evaluate(() => window.__truceTestDebug.pendingForcedPeaceForTest());
const overlayCount = (page) => page.locator('.civ-diplo-modal-overlay .cd-forced-peace-ok').count();
const battleCount = (page) => page.locator('.pb-overlay').count();
const pairStatus = (page, ai) => page.evaluate(([a, b]) => window.__truceTestDebug.pairState(a, b).status, [PLAYER, ai]);
const aiPairStatus = (page, a, b) => page.evaluate(([x, y]) => window.__truceTestDebug.pairState(x, y).status, [a, b]);

const closeWelcome = (page) => page.evaluate(() => { const b = document.querySelector('#civ-welcome-screen-root [data-cww="close"]'); if (b) b.click(); });
async function closeSummaries(page) {
  let n = 0;
  await closeWelcome(page);
  for (let i = 0; i < 10; i++) {
    const btn = page.locator('button').filter({ hasText: /^\s*kontynuuj\s*$/i }).first();
    if (!(await btn.count()) || !(await btn.isVisible().catch(() => false))) break;
    await btn.click({ force: true, timeout: 5000 }).catch(() => {});
    n++;
    await wait(400);
    await waitIdle(page);
  }
  return n;
}
async function clearBattles(page) {
  let n = 0;
  for (let i = 0; i < 40; i++) {
    n += await closeSummaries(page);
    if ((await page.locator('.pb-overlay').count()) === 0) break;
    const auto = page.locator('.pb-overlay button[data-act="auto"]:not([disabled])').first();
    const target = (await auto.count()) ? auto : page.locator('.pb-overlay button:not([disabled])').first();
    await target.click({ force: true, timeout: 5000 }).catch(() => {});
    n++;
    await wait(700);
    await waitIdle(page);
  }
  n += await closeSummaries(page);
  return n;
}
/** Jedna tura przez REALNE endTurn; bitwy AI domykane. Zwraca stan pending widoczny po endTurn (przed domknięciem bitew). */
async function driveOneTurn(page) {
  const start = await turnNo(page);
  await waitIdle(page);
  await clearBattles(page);
  await ungate(page);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  await waitIdle(page);
  await wait(150);
  const pendingAfterEnd = (await pendingList(page)).length;
  await clearBattles(page);
  return { advanced: (await turnNo(page)) > start, pendingAfterEnd };
}
/** Czeka na okno pokoju wymuszonego, domykając bitwy AI po drodze (bez akcji na oknie). */
async function waitOverlay(page, ms) {
  const t = Date.now();
  let cleared = 0;
  while (Date.now() - t < ms) {
    if ((await overlayCount(page)) > 0) return { ok: true, sec: (Date.now() - t) / 1000, cleared };
    cleared += await clearBattles(page);
    await wait(500);
  }
  return { ok: false, sec: ms / 1000, cleared };
}
const armAutoOpenObserver = (page) => page.evaluate(() => {
  window.__fpFirstSeen = null;
  if (window.__fpObs) window.__fpObs.disconnect();
  window.__fpObs = new MutationObserver(() => {
    if (window.__fpFirstSeen === null && document.querySelector('.civ-diplo-modal-overlay .cd-forced-peace-ok')) {
      window.__fpFirstSeen = performance.now();
    }
  });
  window.__fpObs.observe(document.body, { childList: true, subtree: true });
});
/** DIAG (r3): wejścia tyku zmęczenia dla par z graczem (ais) i pary AI↔AI (ais[0],ais[1]). Tylko odczyt. */
const diagPairs = (page) => page.evaluate((ai) => {
  const d = window.__truceTestDebug.wearDiagForTest;
  const out = {};
  for (const x of ai) out['0_' + x] = d(0, x);
  if (ai.length >= 2) out['AI' + ai[0] + '_AI' + ai[1]] = d(ai[0], ai[1]);
  return out;
}, MAJOR_DIAG_IDS);
const autoOpenSeen = (page) => page.evaluate(() => window.__fpFirstSeen !== null);
const coverInfo = (page) => page.evaluate(() => {
  const b = document.querySelector('.civ-diplo-modal-overlay .cd-forced-peace-ok');
  if (!b) return 'brak przycisku';
  const r = b.getBoundingClientRect();
  const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  if (!el) return 'null';
  const chain = [];
  for (let n = el, i = 0; n && i < 6; n = n.parentElement, i++) chain.push(n.tagName + '.' + String(n.className).slice(0, 40) + '#' + n.id + ' z=' + getComputedStyle(n).zIndex + ' pos=' + getComputedStyle(n).position);
  const ov = document.querySelector('.civ-diplo-modal-overlay');
  return { chain, overlayZ: ov ? getComputedStyle(ov).zIndex : null, text: (el.textContent || '').slice(0, 60) };
});
const overlayTopmost = (page) => page.evaluate(() => {
  const b = document.querySelector('.civ-diplo-modal-overlay .cd-forced-peace-ok');
  if (!b) return false;
  const r = b.getBoundingClientRect();
  const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !!el && !!el.closest('.civ-diplo-modal-overlay');
});
/** Akceptacja okna: klik DOM na przycisku (przycisk pod nakładką bywa nieklikalny dla Playwright). */
const acceptOverlay = (page) => page.evaluate(() => {
  const b = document.querySelector('.civ-diplo-modal-overlay .cd-forced-peace-ok');
  if (b) b.click();
});
async function tryEndFullTurn(page) {
  const start = await turnNo(page);
  for (let i = 0; i < 8; i++) {
    await waitIdle(page);
    await clearBattles(page);
    if (await overlayCount(page)) return false;
    await ungate(page);
    await page.evaluate(() => window.__eraTestDebug.endTurn());
    await waitIdle(page);
    await wait(150);
    await clearBattles(page);
    if ((await turnNo(page)) > start) return true;
    if (await overlayCount(page)) return false;
  }
  return false;
}
/** Prowadzi tury, aż pending ma co najmniej `want` pozycji (tura utworzenia). */
async function advanceUntilPending(page, want, maxTurns) {
  const log = [];
  for (let k = 0; k < maxTurns; k++) {
    const n = (await pendingList(page)).length;
    if (n >= want) return { ok: true, turns: k, log, n };
    log.push(await driveOneTurn(page));
    console.log('  DIAG tura ' + (await turnNo(page)) + ' ' + JSON.stringify(await diagPairs(page)));
  }
  return { ok: (await pendingList(page)).length >= want, turns: maxTurns, log, n: (await pendingList(page)).length };
}

async function main() {
  const { chromium } = require(path.join(GRA_DIR, 'node_modules', 'playwright'));
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const browser = await launchBrowser(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  const forcedLogs = [];
  page.on('console', (m) => { const t = m.text(); if (/pokój WYMUSZONY AI/.test(t)) forcedLogs.push(t); });
  let ais = [];
  try {
    await gotoFullGame(page);
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
    await page.evaluate(() => window.__nnsMeasureDebug && window.__nnsMeasureDebug.setPlayerGranary(999));
    const allAi = await page.evaluate(() => window.__peaceRulesTestDebug.listAiOwnerIds());
    // R-WEB-DIPLO-FORCED-PEACE-D2 (r3): pokój wymuszony wymaga GŁÓWNEGO AI (isMajorAiCivForForcedPeace).
    // Mapa testowa ma AI 1..6, ale nie wszystkie są główne (np. AI 2 = city-state/kopia) — bierzemy tylko główne.
    ais = [];
    for (const x of allAi) {
      const m = await page.evaluate((y) => window.__truceTestDebug.wearDiagForTest(0, y).majorB, x);
      if (m) ais.push(x);
    }
    MAJOR_DIAG_IDS.splice(0, MAJOR_DIAG_IDS.length, ...ais.slice(0, 2));
    console.log(`AI owners: ${JSON.stringify(allAi)} glowne: ${JSON.stringify(ais)}`);
  } catch (e) {
    console.error('SETUP FAIL', e.message);
    fails++;
  }

  // ---------------- D2: drugi pokój wymuszony w tej samej turze
  scenario('D2', 'D2: dwa pokoje wymuszone w tej samej turze -> po akceptacji pierwszego drugie okno pojawia się samo');
  if (ais.length < 2) {
    nmz('D2', `mapa testowa ma ${ais.length} AI (potrzebne 2)`);
  } else {
    try {
      await page.evaluate((list) => { list.forEach(a => window.__truceTestDebug.setWarAge(a, 40)); }, ais.slice(0, 2));
      const st = [await pairStatus(page, ais[0]), await pairStatus(page, ais[1])];
      check('D2', st[0] === 'wojna' && st[1] === 'wojna', 'setup: obie pary z graczem w stanie wojny', { st });
      const adv = await advanceUntilPending(page, 2, 12);
      measured('D2', 'tury do pending (dane)', { turns: adv.turns, log: adv.log, n: adv.n });
      check('D2', adv.n === 2, 'w jednej turze powstają DWA oczekujące pokoje (pending = 2)', { n: adv.n });
      const w1 = await waitOverlay(page, 90000);
      await closeSummaries(page);
      check('D2', w1.ok && (await overlayCount(page)) === 1 && (await overlayTopmost(page)), 'okno pierwszego pokoju pojawia się samo i jest na wierzchu', { sec: w1.sec, pending: (await pendingList(page)).length, cover: await coverInfo(page) });
      const before = await pendingList(page);
      check('D2', before.length === 2, 'przed akceptacją pending = 2', { keys: before.map(p => p.pairKey) });
      await armAutoOpenObserver(page);
      await acceptOverlay(page);
      await wait(600);
      const after1 = await pendingList(page);
      check('D2', after1.length === 1, 'po akceptacji pierwszego pending maleje do 1', { n: after1.length });
      check('D2', after1.length === 1 && after1[0].pairKey !== before[0].pairKey, 'pozostała pozycja to DRUGI pokój (inny pairKey)', { first: before[0].pairKey, rest: after1.map(p => p.pairKey) });
      const count2 = await overlayCount(page);
      const seen2 = await autoOpenSeen(page);
      check('D2', count2 === 1 && seen2, 'drugie okno pojawia się SAMO po akceptacji pierwszego (bez Esc/kliknięcia; MutationObserver)', { count: count2, seen2 });
      check('D2', (await overlayTopmost(page)), 'drugie okno jest na wierzchu', { cover: await coverInfo(page) });
      measured('D2', 'statusy par po akceptacji pierwszego', { p1: await pairStatus(page, ais[0]), p2: await pairStatus(page, ais[1]) });
      const endBlocked = await tryEndFullTurn(page);
      check('D2', endBlocked === false, 'tura NIE kończy się, dopóki wisi drugi pokój (blokada)', { advanced: endBlocked });
      await acceptOverlay(page);
      await wait(600);
      check('D2', (await pendingList(page)).length === 0 && (await overlayCount(page)) === 0, 'po akceptacji drugiego: pending = 0, okno zamknięte');
      check('D2', (await pairStatus(page, ais[1])) !== 'wojna', 'po akceptacji drugiego para z drugim AI nie jest w wojnie', { status: await pairStatus(page, ais[1]) });
      check('D2', (await tryEndFullTurn(page)) === true, 'po akceptacji obu tura kończy się normalnie');
    } catch (e) {
      console.error('D2 EXC', e.message);
      results.D2.asserts.push({ ok: false, what: 'wyjątek', detail: e.message }); results.D2.status = 'FAIL'; fails++;
    }
  }

  // ---------------- S: zapis i wczytanie z oczekującym pokojem
  scenario('S', 'S: zapis gry z oczekującym pokojem wymuszonym, wczytanie -> pending wraca i okno otwiera się samo');
  if (ais.length < 1) {
    nmz('S', 'brak AI');
  } else {
    try {
      const ai = ais[0];
      await page.evaluate((a) => window.__truceTestDebug.setWarAge(a, 40), ai);
      check('S', (await pairStatus(page, ai)) === 'wojna', 'setup: para z graczem w stanie wojny przed utworzeniem pending', { status: await pairStatus(page, ai) });
      const adv = await advanceUntilPending(page, 1, 12);
      check('S', adv.n === 1, 'pending pokoju wymuszonego powstaje (1)', { turns: adv.turns, n: adv.n });
      const w = await waitOverlay(page, 90000);
      await closeSummaries(page);
      check('S', w.ok && (await overlayCount(page)) === 1, 'okno pokoju pojawia się przed zapisem', { sec: w.sec });
      const pendBefore = await pendingList(page);
      const turnBefore = await turnNo(page);
      const saved = await page.evaluate((s) => window.__truceTestDebug.saveForTest(s), SLOT);
      check('S', saved === true, 'zapis z oczekującym pokojem zakończony (persistSaveToSlot)', { saved });
      // Zamknięcie okna przed wczytaniem NIE jest wykonywane: wczytanie ma zastać pending w stanie zapisu.
      await page.evaluate((s) => window.__truceTestDebug.loadForTest(s), SLOT);
      await wait(1500);
      await waitIdle(page);
      const pendAfter = await pendingList(page);
      measured('S', 'pending przed zapisem / po wczytaniu, tura przed/po', { pendBefore, pendAfter, turnBefore, turnAfter: await turnNo(page) });
      check('S', pendAfter.length === 1 && pendAfter[0].pairKey === pendBefore[0].pairKey, 'po wczytaniu pending wraca (ten sam pairKey)', { n: pendAfter.length });
      const wl = await waitOverlay(page, 60000);
      await closeSummaries(page);
      const shown = await overlayCount(page);
      check('S', wl.ok && shown === 1 && (await overlayTopmost(page)), 'po wczytaniu okno pokoju otwiera się samo i jest na wierzchu', { sec: wl.sec, shown });
      await acceptOverlay(page);
      await wait(600);
      check('S', (await pendingList(page)).length === 0 && (await overlayCount(page)) === 0, 'po akceptacji po wczytaniu pending = 0, okno zamknięte');
      check('S', (await tryEndFullTurn(page)) === true, 'po akceptacji po wczytaniu tura kończy się normalnie');
    } catch (e) {
      console.error('S EXC', e.message);
      results.S.asserts.push({ ok: false, what: 'wyjątek', detail: e.message }); results.S.status = 'FAIL'; fails++;
    }
  }

  // ---------------- A: pokój AI<->AI nie trafia do kolejki gracza i nie otwiera okna
  scenario('A', 'A: pokój wymuszony AI<->AI nie otwiera okna gracza i nie trafia do kolejki gracza');
  if (ais.length < 2) {
    nmz('A', `mapa testowa ma ${ais.length} AI (potrzebne 2 dla wojny AI<->AI)`);
  } else {
    try {
      const [a, b] = ais;
      await page.evaluate(([x, y]) => window.__truceTestDebug.declareWar(x, y), [a, b]);
      // Wiek wojny 40 tur => poziom zmęczenia pary 100% => pokój WYMUSZONY AI<->AI w najbliższym ticku (setup, nie temat testu).
      await page.evaluate(([x, y]) => window.__truceTestDebug.setPairWarAgeForTest(x, y, 40), [a, b]);
      const st0 = await aiPairStatus(page, a, b);
      measured('A', 'stan pary AI<->AI po wypowiedzeniu wojny i ustawieniu wieku 40 (dane)', { a, b, st0 });
      check('A', st0 === 'wojna', 'setup: para AI<->AI w stanie wojny', { st0 });
      await armAutoOpenObserver(page);
      let peaceTurn = null;
      let leakedToPlayer = false;
      let openedWindow = false;
      const MAX = 8;
      for (let k = 0; k < MAX; k++) {
        await driveOneTurn(page);
        const pl = await pendingList(page);
        if (pl.some(p => p.loser !== PLAYER && p.winner !== PLAYER)) leakedToPlayer = true;
        if ((await overlayCount(page)) > 0 || (await autoOpenSeen(page))) openedWindow = true;
        if (leakedToPlayer || openedWindow) break;
        if ((await aiPairStatus(page, a, b)) !== 'wojna') { peaceTurn = k + 1; break; }
      }
      await closeSummaries(page);
      const pairForcedLogs = forcedLogs.filter(t => t.includes(`AI${a}↔AI${b}`) || t.includes(`AI${b}↔AI${a}`));
      measured('A', 'wynik po pętli tur', { peaceTurn, endStatus: await aiPairStatus(page, a, b), pairForcedLogs, pendingNow: await pendingList(page) });
      check('A', !leakedToPlayer, 'pending gracza NIE zawiera pary AI<->AI', { pending: await pendingList(page) });
      check('A', !openedWindow, 'okno pokoju gracza się NIE otwiera przy pokoju wymuszonym AI<->AI');
      check('A', peaceTurn !== null && pairForcedLogs.length >= 1, 'pokój AI<->AI zapadł jako WYMUSZONY (log silnika „pokój WYMUSZONY AI..”) i para nie jest w wojnie', { peaceTurn, pairForcedLogs });
    } catch (e) {
      console.error('A EXC', e.message);
      results.A.asserts.push({ ok: false, what: 'wyjątek', detail: e.message }); results.A.status = 'FAIL'; fails++;
    }
  }

  check('D2', errors.length === 0, 'zero pageerror/console.error (cały przebieg)', errors.slice(0, 5));
  await browser.close();
  Object.keys(results).forEach((k) => {
    if (results[k].status === 'PASS' && results[k].asserts.every(x => x.ok === null)) results[k].status = 'BRAK ASERCJI';
  });
  fs.writeFileSync(path.join(EVIDENCE, 'wyniki-d2.json'), JSON.stringify({ results }, null, 2));
  console.log('\n=== WYNIKI ===');
  Object.keys(results).forEach((k) => console.log(`${k}: ${results[k].status} — ${results[k].label}${results[k].why ? ' (' + results[k].why + ')' : ''}`));
  console.log(fails === 0 ? 'EXIT 0 (wszystkie zmierzone asercje PASS)' : `EXIT 1 (asercje FAIL: ${fails})`);
  process.exit(fails === 0 ? 0 : 1);
}

async function warLogText(page) {
  return page.evaluate(() => { try { return JSON.stringify(window.__truceTestDebug.warLogForTest()); } catch (e) { return 'ERR ' + e; } });
}

main().catch((e) => { console.error('FATAL', e); process.exit(2); });
