'use strict';
/**
 * load-game-regression-e2e-r5.cjs -- R-WEB-LOAD-GAME-REGRESSION-Q1, runda 5 (zakres a, b, d).
 *
 * Prawdziwa przegladarka (Chromium, Playwright) na zbudowanym bundlu Vite (--dist, serwowany
 * przez `python3 -m http.server`; NIE `npm run dev`). Kazdy scenariusz startuje od czystego
 * profilu (nowy BrowserContext), wiec zapisy pochodza wylacznie z tego przebiegu.
 *
 * Tryby zapisu:
 *   FSA  -- atrapa File System Access: showDirectoryPicker zwraca katalog OPFS (klonowalny do IDB,
 *           przezywa reload). queryPermission zalezy od wariantu (granted / prompt).
 *   IDB  -- BEZ atrapy FSA: autozapis idzie do IndexedDB/localStorage (fallback przegladarkowy).
 *
 * Scenariusze:
 *  A-FSA   nowa gra, N tur z autozapisem co turę (FSA), reload, „Wczytaj grę" (menu glowne) AKTYWNY,
 *          wczytanie najnowszego slotu: tura > 1, miasta >= 1, jednostki >= 1, koniec tury klikalny,
 *          klik „Zakończ turę" podnosi turę o 1, zero pageerror i zero console.error.
 *  A-IDB   jak A-FSA, ale bez atrapy FSA (zapis w IndexedDB/localStorage).
 *  B-PROMPT jak A-FSA, po reloadzie queryPermission = 'prompt' (atrapa); requestPermission = 'granted'
 *          (gracz klika zgode). Oczekiwane: „Wczytaj grę" AKTYWNY, wczytanie dziala.
 *  D-EMPTY pusty katalog FSA i brak zapisow IDB -> „Wczytaj grę" WYSZAROWANY, podpowiedz „brak zapisów".
 *
 * Usage (z gra/): node tools/load-game-regression-e2e-r5.cjs --dist <katalog> [--turns N] [--only A-FSA,A-IDB,B-PROMPT,D-EMPTY]
 * Wynik: linie PASS/FAIL/INFO + podsumowanie; kod wyjscia 0 tylko przy zerowych FAIL.
 */
const path = require('path');
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const args = process.argv.slice(2);
const argOf = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const BASE = argOf('--base', 'http://127.0.0.1:8765/index.html');
const TURNS = parseInt(argOf('--turns', '5'), 10);
const ONLY = argOf('--only', 'A-FSA,A-IDB,B-PROMPT,D-EMPTY').split(',');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let fails = 0;
const check = (ok, label, extra) => {
  if (!ok) fails++;
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label + (extra !== undefined ? ' :: ' + JSON.stringify(extra) : ''));
};
const info = (label, extra) => console.log('INFO ' + label + (extra !== undefined ? ' :: ' + JSON.stringify(extra) : ''));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Atrapa FSA. mode: 'granted' (zgoda na zawsze) albo 'prompt' (zgoda do ponowienia). */
const fakeFsaInit = (mode) => {
  window.__fakeFsaMode = mode;
  window.showDirectoryPicker = async () => navigator.storage.getDirectory();
  const P = (window.FileSystemHandle || {}).prototype;
  if (P) {
    P.queryPermission = async () => window.__fakeFsaMode;
    P.requestPermission = async () => { window.__fakeFsaMode = 'granted'; return 'granted'; };
  }
};

async function launch() {
  try { return await chromium.launch({ headless: true }); } catch {
    return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

const countDiskAutosaves = (page) => page.evaluate(async () => {
  const root = await navigator.storage.getDirectory();
  const names = [];
  for await (const n of root.keys()) if (/^civ-autosave-\d+\.json$/.test(n)) names.push(n);
  return names.sort();
});

const stateOf = (page) => page.evaluate(() => {
  const s = window.__cityStateStartUnitsTestDebug.dumpState();
  return { turn: s.turn, cities: s.cities.length, units: s.units.length, awaiting: s.awaitingFirstPlayerCity };
});

async function mainMenuLoadState(page) {
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  return page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('.civ-menu button')).find((x) => /Wczytaj/.test(x.textContent || ''));
    if (!b) return { missing: true };
    return {
      missing: false,
      disabled: b.disabled || b.getAttribute('aria-disabled') === 'true',
      title: b.getAttribute('title'),
      hint: (b.innerText || '').replace(/\s+/g, ' ').trim(),
    };
  });
}

/** Nowa gra + N tur (autozapis co turę). Zwraca stan po turach. */
async function playNewGame(page, turns, logs) {
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug, undefined, { timeout: 120000 });
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await page.locator('.civ-menu button', { hasText: 'Rozpocznij gr' }).first().click();
  await wait(500);
  await page.keyboard.press('Escape');
  await wait(800);
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 2, 'normal'));
  const gen0 = Date.now();
  while (!logs.some((l) => /NewGame\] Mapa/.test(l))) {
    if (Date.now() - gen0 > 300000) throw new Error('timeout: brak logu [NewGame] Mapa');
    await wait(500);
  }
  await page.waitForFunction(() => {
    const s = window.__cityStateStartUnitsTestDebug.dumpState();
    return s.playerStartHex !== null && s.awaitingFirstPlayerCity === true;
  }, undefined, { timeout: 300000 });
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  await wait(500);
  const t0 = Date.now();
  let turn = (await stateOf(page)).turn;
  const budgetMs = parseInt(argOf('--budget-s', '900'), 10) * 1000;
  while (turn < turns + 1 && Date.now() - t0 < budgetMs) {
    await page.evaluate(() => { const b = document.querySelector('[data-end]'); if (b && b.getAttribute('aria-disabled') !== 'true') b.click(); });
    await wait(700);
    turn = (await stateOf(page)).turn;
  }
  await wait(2500);
  const st = await stateOf(page);
  if (st.turn < turns + 1) {
    // Diagnostyka zastoju tury: stan przycisku i ostatnie logi konca tury (nie zmienia wyniku).
    const endState = await page.evaluate(() => { const b = document.querySelector('[data-end]'); return b ? b.getAttribute('aria-disabled') : 'brak'; });
    info('ZASTOJ tury', { turn: st.turn, endAriaDisabled: endState, ostatnieLogi: logs.slice(-12) });
  }
  info('rozegrane tury', { turn_koncowa: st.turn, czas_s: Math.round((Date.now() - t0) / 1000) });
  return st;
}

/** Wczytanie najnowszego slotu z menu głównego (Wczytaj grę -> pierwszy wiersz). */
async function loadNewestFromMainMenu(page) {
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('.civ-menu button')).find((x) => /Wczytaj/.test(x.textContent || ''));
    if (b) b.click();
  });
  const row = await page.waitForSelector('.civ-sl-row[data-slot]', { timeout: 20000 }).then(() => true, () => false);
  if (!row) return { listed: false };
  const rows = await page.evaluate(() => Array.from(document.querySelectorAll('.civ-sl-row[data-slot]')).map((r) => ({
    slot: r.dataset.slot, meta: (r.querySelector('.civ-sl-row-meta') || {}).textContent || '',
  })));
  // Pojedynczy klik wiersza tylko ZAZNACZA zapis (saveLoadDialog.ts: click = select, dblclick = load);
  // wczytanie idzie przez przycisk „Wczytaj" w dialogu (loadBtn.click -> opts.onLoad).
  await page.locator('.civ-sl-row[data-slot]').first().click();
  await wait(300);
  await page.locator('.civ-sl-primary', { hasText: 'Wczytaj' }).first().click();
  // Czekamy na załadowaną grę: menu zamknięte, stan gry dostępny i miasta/jednostki niepuste.
  // Przechwycenie komunikatów (toastów) pojawiających się w pierwszych sekundach po kliknięciu.
  const hintsSeen = [];
  for (let i = 0; i < 30; i++) {
    const h = await page.evaluate(() => {
      const t = (document.body.innerText || '').replace(/\s+/g, ' ');
      const m = /(Nie mo[żz]na[^.]{0,80}|Wczytano[^.]{0,80}|niekompletny[^.]{0,80}|Błąd[^.]{0,80}|Uwaga[^.]{0,80}|Brak[^.]{0,60})/.exec(t);
      return m ? m[0] : null;
    }).catch(() => null);
    if (h && hintsSeen[hintsSeen.length - 1] !== h) hintsSeen.push(h);
    await wait(300);
  }
  info('LOAD komunikaty w 9 s po kliknieciu', hintsSeen);
  const deadline = Date.now() + 240000;
  let st = null;
  while (Date.now() < deadline) {
    st = await page.evaluate(() => {
      try { const s = window.__cityStateStartUnitsTestDebug.dumpState(); return { turn: s.turn, cities: s.cities.length, units: s.units.length, awaiting: s.awaitingFirstPlayerCity }; }
      catch (e) { return null; }
    }).catch(() => null);
    if (st && st.turn >= 1 && st.cities >= 1 && st.units >= 1) break;
    await wait(1000);
  }
  await wait(1500);
  if (!st || st.cities < 1) {
    // Diagnostyka nieudanego wczytania: ostatnie logi konsoli i widoczne komunikaty (toast).
    const toast = await page.evaluate(() => {
      const t = (document.body.innerText || '').replace(/\s+/g, ' ');
      const m = /(Nie mo[żz]na[^.]{0,80}|Wczytano[^.]{0,80}|niekompletny[^.]{0,80}|Błąd[^.]{0,80}|Uwaga[^.]{0,80})/.exec(t);
      return { hit: m ? m[0] : null, menuVisible: !!document.querySelector('.civ-menu.active, .civ-menu:not([hidden])'), head: t.slice(0, 120) };
    });
    info('LOAD nie dokonczyl: logi konsoli', (global.__p2all || []).slice(-25));
    info('LOAD nie dokonczyl: tekst strony', toast);
  }
  return { listed: true, rows, state: st };
}

async function endTurnEnabled(page) {
  return page.evaluate(() => {
    const b = document.querySelector('[data-end]');
    return !!b && b.getAttribute('aria-disabled') !== 'true';
  });
}

async function clickEndTurnAndCheckAdvance(page, before) {
  await page.evaluate(() => { const b = document.querySelector('[data-end]'); if (b) b.click(); });
  const dl = Date.now() + 90000;
  let after = before;
  while (Date.now() < dl) {
    after = (await stateOf(page)).turn;
    if (after > before) break;
    await wait(800);
  }
  return after;
}

/** Scenariusz z zapisem i wczytaniem. mode: 'FSA' | 'IDB'; perm: 'granted' | 'prompt'. */
async function scenarioSaveLoad(browser, name, mode, perm) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  if (mode === 'FSA') await ctx.addInitScript(fakeFsaInit, 'granted');
  const logs = [];
  const errs = [];
  const page = await ctx.newPage();
  page.on('console', (m) => {
    const t = m.text();
    if (/NewGame\] Mapa|Autosave|SAVE-PRESENCE|FSA|EndTurn|PreBattle|blok/i.test(t)) logs.push(t.slice(0, 200));
    if (m.type() === 'error') errs.push('console.error ' + t.slice(0, 160));
  });
  page.on('pageerror', (e) => errs.push('PAGEERR ' + String(e).slice(0, 160)));
  page.on('response', (r) => { if (r.status() >= 400) errs.push('HTTP' + r.status() + ' ' + r.url().slice(-90)); });
  await page.goto(BASE, { waitUntil: 'load', timeout: 180000 });
  const before = await playNewGame(page, TURNS, logs);
  check(before.turn >= 2, name + ' gra: rozegrano tury (>=2)', { turn: before.turn });
  if (mode === 'FSA') {
    const disk = await countDiskAutosaves(page);
    info(name + ' pliki autozapisu na dysku', disk.length);
    check(disk.length >= 1, name + ' autozapis na dysk: pliki istnieja', disk.length);
  }
  await page.close();

  // Reload w tym samym kontekscie (zapisy przezywaja przeladowanie).
  const p2 = await ctx.newPage();
  p2.on('pageerror', (e) => errs.push('PAGEERR2 ' + String(e).slice(0, 160)));
  const p2logs = [];
  global.__p2all = [];
  p2.on('console', (m) => {
    if (m.type() === 'error') errs.push('console.error2 ' + m.text().slice(0, 160));
    if (/SAVE-PRESENCE|FSA|Autosave|Wczyt|load/i.test(m.text())) p2logs.push(m.text().slice(0, 160));
    global.__p2all.push(m.type() + ': ' + m.text().slice(0, 180));
  });
  p2.on('pageerror', (e) => global.__p2all.push('PAGEERR ' + String(e).slice(0, 180)));
  p2.on('response', (r) => { if (r.status() >= 400) errs.push('HTTP' + r.status() + ' ' + r.url().slice(-90)); });
  await p2.goto(BASE, { waitUntil: 'load', timeout: 180000 });
  await p2.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug, undefined, { timeout: 120000 });
  // Pomiar: po ilu sekundach od startu „Wczytaj grę" staje sie aktywny (asynchroniczne przeliczenie).
  const tReload = Date.now();
  let ms = await mainMenuLoadState(p2);
  while ((ms.missing || ms.disabled) && Date.now() - tReload < 30000) { await wait(1000); ms = await mainMenuLoadState(p2); }
  info(name + ' czas do aktywnego „Wczytaj grę" po reloadzie (ms)', { ms: Date.now() - tReload, disabled: ms.disabled });
  if (ms.disabled) info(name + ' logi p2 (presence/FSA/load)', p2logs.slice(-15));
  check(ms.missing === false && ms.disabled === false, name + ' po reloadzie: „Wczytaj grę" AKTYWNY', ms);
  const loaded = await loadNewestFromMainMenu(p2);
  check(loaded.listed === true, name + ' lista zapisów w dialogu wczytywania', { listed: loaded.listed, rows: (loaded.rows || []).length });
  const st = loaded.state;
  check(!!st && st.turn > 1 && st.cities >= 1 && st.units >= 1 && st.awaiting === false,
    name + ' wczytanie: tura>1, miasta>=1, jednostki>=1', st);
  if (st) {
    info(name + ' po wczytaniu', st);
    const enabled = await endTurnEnabled(p2);
    check(enabled === true, name + ' po wczytaniu: „Zakończ turę" klikalny', { enabled });
    const after = await clickEndTurnAndCheckAdvance(p2, st.turn);
    check(after === st.turn + 1, name + ' po wczytaniu: koniec tury podnosi turę o 1', { before: st.turn, after });
  }
  check(errs.length === 0, name + ' brak pageerror / console.error', errs.slice(0, 5));
  await ctx.close();
  return st;
}

/** B-PROMPT: po reloadzie queryPermission = 'prompt'; klik „Wczytaj" prosi o zgode i wczytuje. */
async function scenarioPromptVariant(browser) {
  const name = 'B-PROMPT';
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await ctx.addInitScript(fakeFsaInit, 'granted');
  const logs = [];
  const page = await ctx.newPage();
  page.on('console', (m) => { if (/NewGame\] Mapa|Autosave|SAVE-PRESENCE/.test(m.text())) logs.push(m.text()); });
  await page.goto(BASE, { waitUntil: 'load', timeout: 180000 });
  await playNewGame(page, TURNS, logs);
  await page.close();
  // Po reloadzie: zgoda w stanie 'prompt' (przegladarka cofnela zapamietane uprawnienie).
  await ctx.addInitScript(fakeFsaInit, 'prompt');
  const p2 = await ctx.newPage();
  const errs = [];
  p2.on('pageerror', (e) => errs.push('PAGEERR ' + String(e).slice(0, 160)));
  await p2.goto(BASE, { waitUntil: 'load', timeout: 180000 });
  await p2.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug, undefined, { timeout: 120000 });
  await wait(2000);
  const ms = await mainMenuLoadState(p2);
  check(ms.missing === false && ms.disabled === false, name + ' po reloadzie (prompt): „Wczytaj grę" AKTYWNY', ms);
  const loaded = await loadNewestFromMainMenu(p2);
  const st = loaded.state;
  check(!!st && st.turn > 1 && st.cities >= 1 && st.units >= 1, name + ' wczytanie po zgodzie (prompt->granted): tura/miasta/jednostki', st);
  check(errs.length === 0, name + ' brak pageerror', errs.slice(0, 5));
  await ctx.close();
}

/** D-EMPTY: pusty katalog FSA, brak zapisow IDB -> wyszarzone + podpowiedz. */
async function scenarioEmpty(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await ctx.addInitScript(fakeFsaInit, 'granted');
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug, undefined, { timeout: 120000 });
  await wait(1500);
  const ms = await mainMenuLoadState(page);
  check(ms.missing === false && ms.disabled === true, 'D-EMPTY: „Wczytaj grę" WYSZAROWANY przy pustym katalogu', ms);
  check(/brak zapis/i.test(ms.hint || ''), 'D-EMPTY: podpowiedz „brak zapisów" widoczna przy przycisku', { hint: ms.hint });
  await ctx.close();
}

(async () => {
  const browser = await launch();
  try {
    if (ONLY.includes('A-FSA')) await scenarioSaveLoad(browser, 'A-FSA', 'FSA', 'granted');
    if (ONLY.includes('A-IDB')) await scenarioSaveLoad(browser, 'A-IDB', 'IDB', 'granted');
    if (ONLY.includes('B-PROMPT')) await scenarioPromptVariant(browser);
    if (ONLY.includes('D-EMPTY')) await scenarioEmpty(browser);
  } catch (e) {
    fails++;
    console.log('FAIL wyjatek :: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e));
  } finally {
    await browser.close();
  }
  console.log(fails === 0 ? 'load-game-regression-e2e-r5: OK (0 FAIL)' : 'load-game-regression-e2e-r5: FAIL (' + fails + ')');
  process.exit(fails === 0 ? 0 : 1);
})();
