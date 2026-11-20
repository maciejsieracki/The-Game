'use strict';
/**
 * diplo-forced-peace-pending-live-paths-test.cjs -- R-WEB-LIVE-VERIFY-FORCED-PEACE-PENDING-PATHS-Q1 (runda 2, Operator).
 *
 * Żywa gra w headless Chromium (bundle Vite, ?playtest=mapa&civTest=1), REALNE endTurn / okno / akceptacja.
 * Runda 2 (odpowiedź na zarzuty Evaluatora 082e7d016):
 *   - bitwa wyzwolona przez AI (pre-battle „WRÓG ATAKUJE”, .pb-overlay) jest domykana przed każdą asercją okna pokoju,
 *     bo bramka bitwy (isPreBattleOpen / hasPendingAutoPreBattle) działa PRZED bramką pending; bez tego okno pokoju
 *     nie ma szansy się pojawić i Esc/klik trafiałyby w okno bitwy (zarzuty 1, 2, 4);
 *   - asercja S3 nie jest tautologią: okno i warLog muszą zgadzać się co do wariantu wymiany miast; wariant z miastami
 *     NIE ZMIERZONO, jeśli mapa nie daje planu miast (zarzut 3);
 *   - S2 nie twierdzi o istnieniu drugiej pozycji w kolejce bez haka odczytu: stan pary + okno są jedynym dowodem (zarzut 4);
 *   - D3 (wpis „Nie można zakończyć tury”) nie jest asercją: panel „Ważne” bywa zamknięty (zarzut 6).
 *
 * Scenariusze z dispatchu:
 *   (1) zapis/wczytanie z oczekującym pokojem -> NIE ZMIERZONO (brak haka odczytu meta.pendingForcedPeaceTreaties).
 *   (2) kolejka dwóch oczekujących pokojów (dwie cywilizacje) -> akceptacja po kolei, po pierwszej nadal zablokowane.
 *   (3) wiersze „Oddajesz” w oknie vs „Pokój bez wymiany miast” w warLog (spójność okna z wpisem po akceptacji).
 *   (4) bramka „Zakończ turę” przy pending: przycisk (force), Enter, Esc i klik w tło nie kończą tury / nie zamykają okna.
 *   (5) pokój AI<->AI bez okna -> NIE ZMIERZONO (brak haka ustawiającego wiek wojny AI<->AI).
 *
 * Usage (z gra/): node ./node_modules/vite/bin/vite.js build --outDir <scratch> --emptyOutDir
 *                 SKIP_BUILD=1 node tools/diplo-forced-peace-pending-live-paths-test.cjs <scratch> [evidenceDir]
 * Wynik: kod wyjścia 0 = wszystkie zmierzone asercje PASS.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

const GRA_DIR = path.resolve(__dirname, '..');
const BUILD = process.argv[2] || path.join(os.tmpdir(), 'civ-fp-pending-' + process.pid);
const EVIDENCE = process.argv[3] || path.join(BUILD, 'evidence');
const OUT_HTML = 'file://' + path.join(BUILD, 'index.html') + '?playtest=mapa&civTest=1';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const PLAYER = 0;

const results = {};
const notes = [];
let fails = 0;
function scenario(id, label) { results[id] = { label, asserts: [], status: 'PASS' }; console.log(`[${id}] ${label}`); }
function check(id, ok, what, detail) {
  const r = results[id];
  r.asserts.push({ ok: !!ok, what, detail });
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${what}${detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''}`);
  if (!ok) { r.status = 'FAIL'; fails++; }
}
function measured(id, what, detail) { results[id].asserts.push({ ok: null, what, detail }); console.log(`  DATA ${what} -- ${JSON.stringify(detail)}`); }
function nmz(id, why) { results[id].status = 'NIE ZMIERZONO'; results[id].why = why; console.log(`  NIE ZMIERZONO: ${why}`); }
function note(text) { notes.push(text); console.log(`  NOTA: ${text}`); }

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function launchBrowser(chromium) {
  // R-WEB-TEST-DEBT-Q12: jawna binarka z CHROME_PATH (pierwszeństwo), potem domyślny Playwright, potem FALLBACK_CHROME.
  if (process.env.CHROME_PATH) {
    try { return await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] }); }
    catch (e) { console.log('CHROME_PATH nie uruchomil sie: ' + e.message.split('\n')[0]); }
  }
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
const turnNo = (page) => page.evaluate(() => window.__truceTestDebug.turn());

/** Domyka bitwy wyzwolone przez AI (pre-battle .pb-overlay). Preferuje „Auto” (rozstrzyga bitwę bez wycofania), inaczej pierwszy aktywny przycisk.
 * Zwraca liczbę kliknięć — ile bitew zostało domkniętych przed asercją. */
/** Zamyka ekran wyniku bitwy („Wynik auto-walki” / „Wynik bitwy”, przycisk Kontynuuj) — część bitwy, nie okno pokoju. */
async function closeSummaries(page) {
  let n = 0;
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
/** Otwarty ekran bitwy: pre-battle (.pb-overlay) albo wynik bitwy z przyciskiem Kontynuuj. */
const battleUiOpen = (page) => page.evaluate(() => {
  if (document.querySelector('.pb-overlay')) return true;
  return [...document.querySelectorAll('button')].some(b => /^\s*kontynuuj\s*$/i.test(b.textContent || '') && b.offsetParent !== null);
});
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

/** Pełna tura przez REALNE endTurn; bitwy AI domykane między próbami. Gdy wisi okno pokoju, zwraca false. */
async function tryEndFullTurn(page) {
  const start = await turnNo(page);
  for (let i = 0; i < 8; i++) {
    await waitIdle(page);
    await clearBattles(page);
    if (await page.locator('.cd-forced-peace-ok').count()) return false;
    await page.evaluate(() => window.__eraTestDebug.endTurn());
    await waitIdle(page);
    await wait(150);
    await clearBattles(page);
    if ((await turnNo(page)) > start) return true;
    if (await page.locator('.cd-forced-peace-ok').count()) return false;
  }
  return false;
}
const overlayCount = (page) => page.locator('.civ-diplo-modal-overlay .cd-forced-peace-ok').count();
const battleCount = (page) => page.locator('.pb-overlay').count();
/** Czeka na okno pokoju wymuszonego, domykając po drodze bitwy AI (okno może pojawić się z opóźnieniem po kolejce bitew).
 * Zwraca czas do pojawienia się (s) i liczbę domkniętych bitew — mierzone, nie zakładane. */
async function waitOverlayClearing(page, ms) {
  const t = Date.now();
  let cleared = 0;
  while (Date.now() - t < ms) {
    if (await page.locator('.civ-diplo-modal-overlay .cd-forced-peace-ok').count()) {
      return { ok: true, sec: (Date.now() - t) / 1000, cleared };
    }
    cleared += await clearBattles(page);
    await wait(500);
  }
  return { ok: false, sec: ms / 1000, cleared };
}
const pendingCount = (page) => page.evaluate(() => window.__truceTestDebug.pendingForcedPeaceForTest().length);
/** Obserwator (MutationObserver) zapamiętuje PIERWSZE pojawienie się okna pokoju; bez wejścia użytkownika. */
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
const autoOpenSeen = (page) => page.evaluate(() => window.__fpFirstSeen !== null);
/** Przycisk okna pokoju jest widoczny i to nakładka okna jest na wierzchu (nie przesłania jej inne okno). */
const overlayTopmost = (page) => page.evaluate(() => {
  const b = document.querySelector('.civ-diplo-modal-overlay .cd-forced-peace-ok');
  if (!b) return false;
  const r = b.getBoundingClientRect();
  const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !!el && !!el.closest('.civ-diplo-modal-overlay');
});
/** Jedna tura przez REALNE endTurn. Bitwy AI są widoczne na końcu tury (przed domknięciem) — stan pending mierzony w tym oknie. */
async function driveOneTurn(page) {
  const start = await turnNo(page);
  await waitIdle(page);
  await clearBattles(page);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  await waitIdle(page);
  await wait(150);
  const battleOpenAfterEnd = await battleUiOpen(page);
  const pendingAfterEnd = await pendingCount(page);
  const clicks = await clearBattles(page);
  return { advanced: (await turnNo(page)) > start, battleOpenAfterEnd, pendingAfterEnd, clicks };
}
/** Prowadzi tury, aż pendingForcedPeaceForTest() pokaże pozycję (tura utworzenia pending). Bez akcji na oknie pokoju. */
async function advanceUntilPending(page, maxTurns) {
  const log = [];
  for (let k = 0; k < maxTurns; k++) {
    if ((await pendingCount(page)) > 0) return { ok: true, turns: k, log };
    if ((await overlayCount(page)) > 0) return { ok: true, turns: k, log, overlayAlreadyUp: true };
    await armAutoOpenObserver(page);
    log.push(await driveOneTurn(page));
  }
  return { ok: (await pendingCount(page)) > 0, turns: maxTurns, log };
}
const endBtn = (page) => page.locator('button.end-turn[data-end]');
const endBtnState = (page) => page.evaluate(() => {
  const b = document.querySelector('button.end-turn[data-end]');
  return b ? { aria: b.getAttribute('aria-disabled'), cls: b.className } : null;
});
const modalText = (page) => page.evaluate(() => {
  const m = document.querySelector('.civ-diplo-modal-overlay .cd-war-consent-modal');
  return m ? m.innerText : '';
});
const pairStatus = (page, ai) => page.evaluate(([a, b]) => window.__truceTestDebug.pairState(a, b).status, [PLAYER, ai]);
const warLogText = (page) => page.evaluate(() => {
  try { return JSON.stringify(window.__truceTestDebug.warLogForTest()); } catch (e) { return 'ERR ' + e; }
});
/** Wariant wymiany miast z tekstu okna / wpisu warLog. */
const branchOfModal = (txt) => (/Oddajesz:/.test(txt) ? 'miasta' : (/Pokój bez wymiany miast/.test(txt) ? 'bez-wymiany' : 'brak'));
const branchOfLog = (wl) => (/Oddajemy miasta|Otrzymujemy miasta/.test(wl) ? 'miasta' : (/Pokój bez wymiany miast/.test(wl) ? 'bez-wymiany' : 'brak'));

async function main() {
  const { chromium } = require(path.join(GRA_DIR, 'node_modules', 'playwright'));
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const browser = await launchBrowser(chromium);
  const errors = [];
  const warns = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text());
    if (m.type() === 'warning' && /ForcedPeace|EndTurn|pokój|forced/i.test(m.text())) warns.push(m.text().slice(0, 160));
  });
  let ais = [];
  try {
    await gotoPlaytestMapa(page);
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
    await page.evaluate(() => window.__nnsMeasureDebug && window.__nnsMeasureDebug.setPlayerGranary(999));
    ais = await page.evaluate(() => window.__peaceRulesTestDebug.listAiOwnerIds());
    console.log(`AI owners: ${JSON.stringify(ais)}`);
  } catch (e) {
    console.error('SETUP FAIL', e.message);
    fails++;
  }

  // ---- (4) + (3) pojedynczy pokój wymuszony: bramka, Esc, tło, akceptacja (runda 3: tura utworzenia pending, auto-otwarcie)
  scenario('S4', 'bramka „Zakończ turę” przy pending (przycisk / Enter / Esc / tło / akceptacja) + auto-otwarcie okna');
  scenario('S3', 'spójność okna (wiersze miast) z wpisem warLog po akceptacji');
  try {
    if (ais.length < 1) throw new Error('brak AI');
    const ai = ais[0];
    await page.evaluate((a) => window.__truceTestDebug.setWarAge(a, 40), ai);
    const adv = await advanceUntilPending(page, 12);
    measured('S4', 'tury do utworzenia pending (od ustawienia wojny)', { turns: adv.turns, log: adv.log });
    check('S4', adv.ok, 'pending pokoju wymuszonego powstaje w ciągu 12 tur (pendingForcedPeaceForTest)', { turns: adv.turns });
    // (3) Odroczenie: w turach, w których bitwa była otwarta po końcu tury, pending NIE może powstać.
    const deferredTurns = adv.log.filter(r => r.battleOpenAfterEnd && r.pendingAfterEnd === 0).length;
    const leaked = adv.log.filter(r => r.battleOpenAfterEnd && r.pendingAfterEnd > 0).length;
    if (deferredTurns > 0) {
      check('S4', leaked === 0, 'odroczenie: przy trwającej bitwie pending nie powstaje do jej zamknięcia', { deferredTurns, leaked });
    } else {
      nmz('S4', 'odroczenie przy trwającej bitwie NIE ZMIERZONO: w żadnej turze bitwa nie była otwarta po końcu tury');
    }
    // (2) Samo otwarcie okna: po utworzeniu pending okno ma się pojawić BEZ Esc/kliknięcia w okno pokoju.
    const w4 = await waitOverlayClearing(page, 90000);
    const autoFired = await autoOpenSeen(page);
    // Ekran wyniku bitwy (Kontynuuj) może przesłaniać okno — zamykamy go jak bitwę, nie okno pokoju.
    const summariesClosed = await closeSummaries(page);
    measured('S4', 'czas do pojawienia się okna (s), domknięte bitwy, obserwator MutationObserver', { ...w4, autoFired, summariesClosed, pendingNow: await pendingCount(page) });
    const battlesLeft = await battleCount(page);
    const autoShown = (await overlayCount(page)) === 1;
    const topmost = await overlayTopmost(page);
    check('S4', w4.ok && autoShown && autoFired, 'okno pokoju pojawia się SAMO w tej turze (bez Esc/kliknięcia; MutationObserver)', { autoShown, autoFired, sec: w4.sec, battlesLeft });
    check('S4', topmost, 'okno pokoju jest na wierzchu (przycisk widoczny, nie przesłonięty innym oknem)', { topmost });
    if (!autoShown) {
      // Okno nie pojawiło się: jeden Esc tylko diagnostycznie, by domknąć resztę scenariusza.
      await page.keyboard.press('Escape');
      await wait(300);
      measured('S4', 'okno po jednym Esc, gdy nie pojawiło się samo (odsłonięcie, diagnostyka)', { count: await overlayCount(page) });
    }
    check('S4', (await overlayCount(page)) === 1, 'okno pokoju wymuszonego jest widoczne przed sprawdzaniem bramki', { count: await overlayCount(page) });
    check('S4', (await pendingCount(page)) === 1, 'pending istnieje i okno jest widoczne (rozróżnienie: pending + okno)', { pending: await pendingCount(page), okno: await overlayCount(page) });
    measured('S4', 'stan przycisku „Zakończ turę” przy pending', await endBtnState(page));
    const txt = await modalText(page);
    measured('S3', 'tekst okna (pierwsze 400 znaków)', txt.slice(0, 400));
    const modalBranch = branchOfModal(txt);
    check('S3', modalBranch !== 'brak', 'okno zawiera jeden z dwóch wariantów: „Oddajesz:” albo „Pokój bez wymiany miast”', { modalBranch });
    await page.screenshot({ path: path.join(EVIDENCE, 's4-okno-pokoju.png') });

    // Drugi Esc przy WIDOCZNYM oknie nie może go zamknąć (brak odmowy).
    await page.keyboard.press('Escape');
    await wait(200);
    check('S4', (await overlayCount(page)) === 1, 'Esc przy widocznym oknie nie zamyka okna pokoju wymuszonego');
    // Klik w tło nie zamyka
    await page.mouse.click(8, 8);
    await wait(200);
    check('S4', (await overlayCount(page)) === 1, 'klik w tło nie zamyka okna');

    // Bramka: klik „Zakończ turę” (przycisk pod nakładką — REALNE kliknięcie DOM z force)
    const t0 = await turnNo(page);
    const clickErr = await endBtn(page).click({ force: true, timeout: 5000 }).then(() => null, (e) => String(e.message).slice(0, 120));
    await wait(600);
    await waitIdle(page);
    check('S4', (await turnNo(page)) === t0, 'klik „Zakończ turę” (button.end-turn, force) przy pending nie kończy tury', { t0, t1: await turnNo(page), clickErr });
    // Enter na sfokusowanym przycisku końca tury
    await page.evaluate(() => { const b = document.querySelector('button.end-turn[data-end]'); if (b) b.focus(); });
    await page.keyboard.press('Enter');
    await wait(600);
    await waitIdle(page);
    check('S4', (await turnNo(page)) === t0, 'Enter na przycisku „Zakończ turę” przy pending nie kończy tury', { t1: await turnNo(page) });
    // Wpis „Nie można zakończyć tury” zależy od otwartego panelu „Ważne” — nie jest asercją (zarzut 6).
    note('D3 (wpis „Nie można zakończyć tury”) nie jest mierzony: panel „Ważne” bywa zamknięty, DOM nie dowodzi braku wpisu.');

    // Akceptacja -> pokój, okno znika, tura kończy się
    await page.locator('.cd-forced-peace-ok').first().click();
    await wait(500);
    check('S4', (await overlayCount(page)) === 0, 'po akceptacji okno znika');
    check('S4', (await pairStatus(page, ai)) !== 'wojna', 'po akceptacji status pary nie jest „wojna”', { status: await pairStatus(page, ai) });
    const wl = await warLogText(page);
    measured('S3', 'warLog po akceptacji (fragment)', wl.slice(0, 500));
    check('S3', /Pokój zawarty/.test(wl), 'po akceptacji w warLog jest wpis „Pokój zawarty”');
    const logBranch = branchOfLog(wl);
    check('S3', logBranch !== 'brak', 'wpis warLog zawiera wariant wymiany miast', { logBranch });
    check('S3', modalBranch === logBranch, 'wariant w oknie zgadza się z wpisem warLog po akceptacji', { modalBranch, logBranch });
    if (logBranch === 'bez-wymiany') {
      note('S3 wariant „Oddajesz: <miasta>” NIE ZMIERZONO: w tej mapie plan pokoju nie zawiera miast do oddania (tylko cena=0 / bez wymiany).');
    }
    const ok = await tryEndFullTurn(page);
    check('S4', ok, 'po akceptacji tura kończy się normalnie');
  } catch (e) {
    console.error('S3/S4 EXC', e.message);
    results.S4.asserts.push({ ok: false, what: 'wyjątek', detail: e.message }); results.S4.status = 'FAIL'; fails++;
  }

  // ---- (2) kolejka dwóch pokoi. S2(a) = asserted: okno pierwszego pojawia się SAMO. S2(b)/D2 = NIE ROZSTRZYGNIĘTE (tylko dane).
  scenario('S2', 'S2(a): dwie wojny -> okno pierwszego pokoju pojawia się samo w turze utworzenia pending');
  scenario('S2b', 'S2(b)/D2: kolejka drugiego pokoju po akceptacji pierwszego');
  if (ais.length < 2) {
    nmz('S2', `mapa testowa ma tylko ${ais.length} AI (potrzebne 2)`);
    nmz('S2b', `mapa testowa ma tylko ${ais.length} AI (potrzebne 2)`);
  } else {
    try {
      await page.evaluate((list) => { list.forEach(a => window.__truceTestDebug.setWarAge(a, 40)); }, ais.slice(0, 2));
      const adv2 = await advanceUntilPending(page, 12);
      check('S2', adv2.ok, 'pending dla dwóch wojen powstaje (do 12 tur)', { turns: adv2.turns });
      const w2 = await waitOverlayClearing(page, 90000);
      const autoFired2 = await autoOpenSeen(page);
      measured('S2', 'czas do pojawienia się pierwszego okna (s), domknięte bitwy, obserwator', { ...w2, autoFired2 });
      await closeSummaries(page);
      check('S2', w2.ok && autoFired2 && (await overlayCount(page)) === 1 && (await overlayTopmost(page)), 'po turze z dwiema wojnami okno pierwszego pokoju pojawia się samo i jest na wierzchu (do 90 s, bez Esc/kliknięcia)', { battlesLeft: await battleCount(page), pending: await pendingCount(page) });
      measured('S2', 'status par i pending przed akceptacją', { p1: await pairStatus(page, ais[0]), p2: await pairStatus(page, ais[1]), turn: await turnNo(page), pending: await pendingCount(page) });
      // Akceptacja pierwszego: klik DOM na przycisku okna (Playwright odrzucał klik — przechwytywany przez nakładkę).
      const t0 = await turnNo(page);
      await page.evaluate(() => { const b = document.querySelector('.civ-diplo-modal-overlay .cd-forced-peace-ok'); if (b) b.click(); });
      await wait(500);
      measured('S2b', 'po akceptacji pierwszego: pending, okno, statusy par', { pending: await pendingCount(page), okno: await overlayCount(page), p1: await pairStatus(page, ais[0]), p2: await pairStatus(page, ais[1]) });
      const w3 = await waitOverlayClearing(page, 30000);
      measured('S2b', 'drugie okno w ciągu 30 s po akceptacji pierwszego (dane, nie asercja)', w3);
      const tEnd = await tryEndFullTurn(page);
      measured('S2b', 'tura po akceptacji pierwszego (dane)', { t0, t1: await turnNo(page), advanced: tEnd });
      nmz('S2b', 'NIE ROZSTRZYGNIĘTE (D2, decyzja właściciela 2026-11-18): druga wojna → drugi pokój; brak haka odczytu pozycji po prune; wynik tylko zmierzony powyżej');
    } catch (e) {
      console.error('S2 EXC', e.message);
      results.S2.asserts.push({ ok: false, what: 'wyjątek', detail: e.message }); results.S2.status = 'FAIL'; fails++;
    }
  }

  // ---- (1) zapis/wczytanie — brak haka do odczytu pendingForcedPeaceTreaties
  scenario('S1', 'zapis i wczytanie gry z oczekującym traktatem');
  nmz('S1', 'brak haka odczytu meta.pendingForcedPeaceTreaties ani helpera zapis+wczytaj; propozycja haka test-only w raporcie');

  // ---- (5) AI<->AI bez okna
  scenario('S5', 'pokój AI<->AI nadal natychmiast (bez okna)');
  nmz('S5', 'brak haka ustawiającego wiek wojny dla pary AI<->AI (setWarAge działa tylko dla gracza)');

  check('S4', errors.length === 0, 'zero pageerror/console.error', errors.slice(0, 5));
  await browser.close();
  Object.keys(results).forEach((k) => {
    if (results[k].status === 'PASS' && results[k].asserts.every(a => a.ok === null)) results[k].status = 'BRAK ASERCJI';
  });
  fs.writeFileSync(path.join(EVIDENCE, 'wyniki.json'), JSON.stringify({ results, notes }, null, 2));
  console.log('\n=== WYNIKI ===');
  Object.keys(results).forEach((k) => console.log(`${k}: ${results[k].status} — ${results[k].label}${results[k].why ? ' (' + results[k].why + ')' : ''}`));
  console.log(fails === 0 ? 'EXIT 0 (wszystkie zmierzone asercje PASS)' : `EXIT 1 (asercje FAIL: ${fails})`);
  process.exit(fails === 0 ? 0 : 1);
}

main().catch((e) => { console.error('FATAL', e); process.exit(2); });
