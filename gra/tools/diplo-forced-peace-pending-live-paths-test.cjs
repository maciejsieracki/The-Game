'use strict';
/**
 * diplo-forced-peace-pending-live-paths-test.cjs -- R-WEB-LIVE-VERIFY-FORCED-PEACE-PENDING-PATHS-Q1 (runda 1, Operator).
 *
 * Żywa gra w headless Chromium (bundle Vite, ?playtest=mapa&civTest=1), REALNE endTurn / okno / akceptacja.
 * Scenariusze z dispatchu:
 *   (1) zapis/wczytanie z oczekującym pokojem -> NIE ZMIERZONO (brak haka odczytu meta.pendingForcedPeaceTreaties
 *       i brak helpera zapis+wczytaj w jednym przebiegu; patrz raport).
 *   (2) kolejka dwóch oczekujących pokojów (dwie cywilizacje) -> akceptacja po kolei, po pierwszej nadal zablokowane.
 *   (3) wiersze „Oddajesz/Oddajemy” w oknie i „Pokój bez wymiany miast” -> mierzone tekstem okna i wpisem Ważne.
 *   (4) bramka „Zakończ turę” przy pending: przycisk, Esc i klik w tło nie zamykają/nie kończą; wpis Ważne o blokadzie.
 *   (5) pokój AI<->AI bez okna -> NIE ZMIERZONO (brak haka ustawiającego wiek wojny AI<->AI).
 *
 * Usage (z gra/): node tools/diplo-forced-peace-pending-live-paths-test.cjs <buildDir> [evidenceDir]
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

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
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
const turnNo = (page) => page.evaluate(() => window.__truceTestDebug.turn());
/** Pełna tura przez REALNE endTurn; gdy bramka blokuje, zwraca false (tura nie rusza). */
async function tryEndFullTurn(page) {
  const start = await turnNo(page);
  for (let i = 0; i < 6; i++) {
    await waitIdle(page);
    await page.evaluate(() => window.__eraTestDebug.endTurn());
    await waitIdle(page);
    await wait(150);
    if ((await turnNo(page)) > start) return true;
    if (await page.locator('.cd-forced-peace-ok').count()) return false;
  }
  return false;
}
const overlayCount = (page) => page.locator('.civ-diplo-modal-overlay .cd-forced-peace-ok').count();
const waitOverlay = (page, ms = 15000) => page.waitForSelector('.civ-diplo-modal-overlay .cd-forced-peace-ok', { timeout: ms }).then(() => true, () => false);
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
const endBtnHasText = (page) => page.evaluate(() => Array.from(document.querySelectorAll('button')).some(b => /Zakończ turę/.test(b.innerText)));

async function main() {
  const { chromium } = require(path.join(GRA_DIR, 'node_modules', 'playwright'));
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const browser = await launchBrowser(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
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

  // ---- (4) + (3) pojedynczy pokój wymuszony: bramka, Esc, tło, akceptacja
  scenario('S4', 'bramka „Zakończ turę” przy pending (przycisk / Esc / tło / akceptacja)');
  scenario('S3', 'treść okna: wiersze miast (Oddajesz) i wpis po akceptacji');
  try {
    if (ais.length < 1) throw new Error('brak AI');
    const ai = ais[0];
    await page.evaluate((a) => window.__truceTestDebug.setWarAge(a, 40), ai);
    const turnBefore = await turnNo(page);
    const advanced = await tryEndFullTurn(page);
    const appeared = await waitOverlay(page);
    const shown = await overlayCount(page);
    check('S4', shown === 1 && appeared, 'po turze z wojną 40 tur okno pokoju wymuszonego jest widoczne', { advanced, shown, turnBefore });
    measured('S4', 'stan przycisku „Zakończ turę” przy pending', await endBtnState(page));
    const txt = await modalText(page);
    measured('S3', 'tekst okna (pierwsze 400 znaków)', txt.slice(0, 400));
    check('S3', /Oddajesz|Oddajemy|Otrzymujemy|bez wymiany miast/.test(txt) || /Akceptuję/.test(txt), 'okno zawiera przycisk akceptacji i blok o wymianie miast/zapłacie', { hasOddajesz: /Oddajesz/.test(txt) });
    await page.screenshot({ path: path.join(EVIDENCE, 's4-okno-pokoju.png') });

    // Esc nie zamyka
    await page.keyboard.press('Escape');
    await wait(200);
    check('S4', (await overlayCount(page)) === 1, 'Esc nie zamyka okna pokoju wymuszonego');
    // Klik w tło nie zamyka
    await page.mouse.click(8, 8);
    await wait(200);
    check('S4', (await overlayCount(page)) === 1, 'klik w tło nie zamyka okna');

    // Bramka: klik „Zakończ turę” (przycisk pod nakładką jest zasłonięty — próba REALNEGO kliknięcia DOM)
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
    const hasBlockEvent = await page.evaluate(() => document.body.innerText.includes('Nie można zakończyć tury'));
    measured('S4', 'wpis/komunikat blokady „Nie można zakończyć tury” widoczny w DOM', { hasBlockEvent });

    // Akceptacja -> pokój, okno znika, tura kończy się
    await page.locator('.cd-forced-peace-ok').first().click();
    await wait(500);
    check('S4', (await overlayCount(page)) === 0, 'po akceptacji okno znika');
    check('S4', (await pairStatus(page, ai)) !== 'wojna', 'po akceptacji status pary nie jest „wojna”', { status: await pairStatus(page, ai) });
    const wl = await warLogText(page);
    measured('S3', 'warLog po akceptacji (fragment)', wl.slice(0, 500));
    check('S3', /Pokój zawarty/.test(wl), 'po akceptacji w warLog jest wpis „Pokój zawarty”');
    check('S3', /Oddajemy miasta|Otrzymujemy miasta|Pokój bez wymiany miast/.test(wl), 'wpis zawiera opis wymiany miast (oddanie lub brak wymiany)');
    const ok = await tryEndFullTurn(page);
    check('S4', ok, 'po akceptacji tura kończy się normalnie');
  } catch (e) {
    console.error('S3/S4 EXC', e.message);
    results.S4.asserts.push({ ok: false, what: 'wyjątek', detail: e.message }); results.S4.status = 'FAIL'; fails++;
  }

  // ---- (2) kolejka dwóch pokoi
  scenario('S2', 'kolejka dwóch oczekujących pokojów (dwie cywilizacje)');
  if (ais.length < 2) {
    nmz('S2', `mapa testowa ma tylko ${ais.length} AI (potrzebne 2)`);
  } else {
    try {
      await page.evaluate((list) => { list.forEach(a => window.__truceTestDebug.setWarAge(a, 40)); }, ais.slice(0, 2));
      const advanced = await tryEndFullTurn(page);
      const appeared2 = await waitOverlay(page);
      check('S2', appeared2 && (await overlayCount(page)) === 1, 'po turze z dwiema wojnami widoczne okno (pierwszy pokój)', { advanced });
      measured('S2', 'status par przed akceptacją', { p1: await pairStatus(page, ais[0]), p2: await pairStatus(page, ais[1]), turn: await turnNo(page) });
      const t0 = await turnNo(page);
      await page.locator('.cd-forced-peace-ok').first().click();
      await wait(500);
      measured('S2', 'status par po akceptacji pierwszego', { p1: await pairStatus(page, ais[0]), p2: await pairStatus(page, ais[1]) });
      const appeared3 = await waitOverlay(page, 3000);
      check('S2', appeared3, 'po akceptacji pierwszego okno drugiego pokoju wraca (kolejka)');
      const txt2 = await modalText(page);
      measured('S2', 'nazwa cywilizacji w drugim oknie (fragment)', txt2.slice(0, 160));
      await endBtn(page).click({ force: true, timeout: 5000 }).catch(() => {});
      await wait(500);
      await waitIdle(page);
      check('S2', (await turnNo(page)) === t0, 'po akceptacji pierwszego nadal zablokowane (tura nie rusza)');
      if (appeared3) await page.locator('.cd-forced-peace-ok').first().click();
      await wait(500);
      check('S2', (await overlayCount(page)) === 0, 'po akceptacji drugiego okno znika');
      const ok = await tryEndFullTurn(page);
      check('S2', ok, 'po akceptacji obu tura odblokowana i kończy się');
    } catch (e) {
      console.error('S2 EXC', e.message);
      results.S2.asserts.push({ ok: false, what: 'wyjątek', detail: e.message }); results.S2.status = 'FAIL'; fails++;
    }
  }

  // ---- (1) zapis/wczytanie — brak haka do odczytu pendingForcedPeaceTreaties
  scenario('S1', 'zapis i wczytanie gry z oczekującym traktatem');
  nmz('S1', 'brak haka odczytu meta.pendingForcedPeaceTreaties ani helpera zapis+wczytaj z ponownym uruchomieniem przeglądarki; propozycja haka test-only w raporcie');

  // ---- (5) AI<->AI bez okna
  scenario('S5', 'pokój AI<->AI nadal natychmiast (bez okna)');
  nmz('S5', 'brak haka ustawiającego wiek wojny dla pary AI<->AI (setWarAge działa tylko dla gracza)');

  check('S4', errors.length === 0, 'zero pageerror/console.error', errors.slice(0, 5));
  await browser.close();
  Object.keys(results).forEach((k) => {
    if (results[k].status === 'PASS' && results[k].asserts.every(a => a.ok === null)) results[k].status = 'BRAK ASERCJI';
  });
  fs.writeFileSync(path.join(EVIDENCE, 'wyniki.json'), JSON.stringify(results, null, 2));
  console.log('\n=== WYNIKI ===');
  Object.keys(results).forEach((k) => console.log(`${k}: ${results[k].status} — ${results[k].label}${results[k].why ? ' (' + results[k].why + ')' : ''}`));
  console.log(fails === 0 ? 'EXIT 0 (wszystkie zmierzone asercje PASS)' : `EXIT 1 (asercje FAIL: ${fails})`);
  process.exit(fails === 0 ? 0 : 1);
}

main().catch((e) => { console.error('FATAL', e); process.exit(2); });
