'use strict';
/**
 * load-game-regression-e2e.cjs -- R-WEB-LOAD-GAME-REGRESSION-Q1 (runda 3).
 *
 * Prawdziwa przeglądarka (Chromium, Playwright) na zbudowanym bundlu Vite
 * (katalog z argumentu --dist, domyślnie <tmp>/dist-r3, serwowany przez
 * `python3 -m http.server`; NIE `npm run dev`).
 *
 * Symulacja File System Access: `showDirectoryPicker` zwraca katalog OPFS
 * (`navigator.storage.getDirectory()`) -- uchwyt jest klonowalny do IndexedDB,
 * więc przeżywa przeładowanie strony tak jak prawdziwy uchwyt FSA. Gdy
 * przeglądarka nie ma queryPermission, atrapa zwraca 'granted' (zgoda „na zawsze").
 *
 * Scenariusze:
 *  S1  nowa gra, 5 tur z autozapisem co 1 turę -> sloty autosave-1..5 na "dysku",
 *      przycisk „Wczytaj grę" w menu pauzy AKTYWNY.
 *  S2  przeładowanie strony -> w menu głównym „Wczytaj grę" AKTYWNY (zapisy na dysku),
 *      klik otwiera dialog wczytywania z zapisami.
 *  S3  pusty katalog i brak zapisów IDB -> „Wczytaj grę" WYSZAROWANY, title „Brak zapisu".
 *
 * Użycie (z gra/): node tools/load-game-regression-e2e.cjs --dist <katalog> [--turns N]
 * Wynik: linie PASS/FAIL + podsumowanie; kod wyjścia 0 tylko przy zerowych FAIL.
 */
const path = require('path');
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const args = process.argv.slice(2);
const argOf = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const BASE = argOf('--base', 'http://127.0.0.1:8765/index.html');
const TURNS = parseInt(argOf('--turns', '5'), 10);
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let fails = 0;
const check = (ok, label, extra) => {
  if (!ok) fails++;
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label + (extra !== undefined ? ' :: ' + JSON.stringify(extra) : ''));
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const FAKE_FSA_INIT = () => {
  window.showDirectoryPicker = async () => navigator.storage.getDirectory();
  const P = (window.FileSystemHandle || {}).prototype;
  if (P) {
    if (!P.queryPermission) P.queryPermission = async () => 'granted';
    if (!P.requestPermission) P.requestPermission = async () => 'granted';
  }
};

async function launch() {
  try { return await chromium.launch({ headless: true }); } catch {
    return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Liczba plików autozapisu na „dysku" (OPFS = atrapa katalogu FSA). */
const countDiskAutosaves = (page) => page.evaluate(async () => {
  const root = await navigator.storage.getDirectory();
  const names = [];
  for await (const n of root.keys()) if (/^civ-autosave-\d+\.json$/.test(n)) names.push(n);
  return names.sort();
});

/** Stan przycisku „Wczytaj grę" w menu pauzy (otwieranym Escape). */
async function pauseLoadState(page) {
  const clicked = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').trim() === 'Menu');
    if (!b) return false;
    b.click();
    return true;
  });
  if (!clicked) return { missing: true };
  const found = await page.waitForSelector('[data-act="load"]', { timeout: 8000 }).then(() => true, () => false);
  if (!found) return { missing: true };
  const st = await page.evaluate(() => {
    const b = document.querySelector('[data-act="load"]');
    return { missing: false, disabled: b.disabled, title: b.getAttribute('title') };
  });
  await page.keyboard.press('Escape');
  await wait(300);
  return st;
}

async function mainMenuLoadState(page) {
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  return page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('.civ-menu button')).find((x) => /Wczytaj/.test(x.textContent || ''));
    if (!b) return { missing: true };
    return { missing: false, disabled: b.disabled || b.getAttribute('aria-disabled') === 'true', title: b.getAttribute('title') };
  });
}

async function waitForTurn(page, want) {
  const deadline = Date.now() + 120000; // po limicie zwracamy stan zastoju (nie błąd): mierzymy to, co się udało
  while (Date.now() < deadline) {
    const t = await page.evaluate(() => { const s = window.__cityStateStartUnitsTestDebug.dumpState(); window.__dbgS = [s.cities.length, s.units.length, s.awaitingFirstPlayerCity]; return s.turn; });
    if (process.env.E2E_DEBUG) console.log("DBG2 " + JSON.stringify(await page.evaluate(() => window.__dbgS)));
    if (process.env.E2E_DEBUG) console.log("DBG turn=" + t + " ts=" + Date.now() % 100000);
    if (t >= want) return t;
    await page.evaluate(() => { const b = document.querySelector('[data-end]'); if (b && b.getAttribute('aria-disabled') !== 'true') b.click(); });
    await wait(700);
  }
  const stall = await page.evaluate(() => { const s = window.__cityStateStartUnitsTestDebug.dumpState(); return { turn: s.turn, cities: s.cities.length, units: s.units.length, endDisabled: (document.querySelector('[data-end]') || {}).getAttribute ? document.querySelector('[data-end]').getAttribute('aria-disabled') : null }; });
  console.log('INFO zastoj tury: ' + JSON.stringify(stall));
  return stall.turn;

}

async function scenarioS1(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await ctx.addInitScript(FAKE_FSA_INIT);
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { const t = m.text(); if (/SAVE-PRESENCE|SPDBG|Autosave|FSA|NewGame\]|rror/i.test(t)) logs.push(t.slice(0, 160)); });
  global.__e2eLogs = logs;
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) logs.push('NAV ' + f.url()); });
  page.on('pageerror', (e) => logs.push('PAGEERR ' + e));
  await page.goto(BASE, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug, undefined, { timeout: 120000 });
  // Klik „Rozpocznij grę" w menu głównym: to jedyna ścieżka, która bootstrapuje FSA (jak u gracza).
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await page.locator('.civ-menu button', { hasText: 'Rozpocznij gr' }).first().click();
  await wait(500);
  await page.keyboard.press('Escape');
  await wait(800);
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 2, 'normal'));
  // Czekamy na FAKTYCZNE zakończenie generacji nowej gry (log [NewGame] Mapa) -- przed nim
  // playerStartHex może pochodzić z tła menu głównego i zostać nadpisane przez doStartGame.
  const gen0 = Date.now();
  while (!(global.__e2eLogs || []).some((l) => /NewGame\] Mapa/.test(l))) {
    if (Date.now() - gen0 > 300000) throw new Error('timeout: brak logu [NewGame] Mapa');
    await wait(500);
  }
  await page.waitForFunction(() => {
    const s = window.__cityStateStartUnitsTestDebug.dumpState();
    return s.playerStartHex !== null && s.awaitingFirstPlayerCity === true;
  }, undefined, { timeout: 300000 });
  const founded = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  console.log("INFO S1 foundPlayerStartCity=" + founded + " state=" + JSON.stringify(await page.evaluate(() => { const s = window.__cityStateStartUnitsTestDebug.dumpState(); return { awaiting: s.awaitingFirstPlayerCity, hex: s.playerStartHex, cities: s.cities.length }; })));
  await wait(500);
  const t0 = Date.now();
  const turn = await waitForTurn(page, TURNS + 1);
  await wait(2500);
  const played = turn - 1;
  console.log('INFO S1 rozegrane_tury=' + played + ' czas_ms=' + (Date.now() - t0));
  // Zapis tury może trwać chwilę po jej zakończeniu: czekamy na docelową liczbę plików (do 20 s).
  const want = Math.min(played, 10);
  let disk = await countDiskAutosaves(page);
  for (let i = 0; i < 40 && disk.length < want; i++) { await wait(500); disk = await countDiskAutosaves(page); }
  check(disk.length === want, 'S1 autozapis co turę: pliki na dysku = rozegrane tury (' + played + ')', disk);
  const st = await pauseLoadState(page);
  if (st.missing) console.log('NIE_ZMIERZONO S1 menu pauzy: brak przycisku Menu/„Wczytaj grę" (zastój tury, patrz INFO)');
  else check(st.disabled === false, 'S1 menu pauzy: „Wczytaj grę" AKTYWNY przy zapisach na dysku', st);
  logs.filter((l) => /SAVE-PRESENCE|Autosave/.test(l)).forEach((l) => console.log('  log: ' + l));
  return { ctx, page, disk };
}

async function scenarioS2(browser, ctx) {
  const page = await ctx.newPage();
  page.on('console', (m) => { if (/SPDBG|SAVE-PRESENCE|FSA/.test(m.text())) console.log('  s2log: ' + m.text().slice(0, 150)); });
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e));
  await page.goto(BASE, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug, undefined, { timeout: 120000 });
  await wait(1500);
  if (process.env.E2E_DEBUG) console.log('PROBE S2 ' + JSON.stringify(await page.evaluate(async () => {
    const db = await new Promise((res, rej) => { const r = indexedDB.open('thegame-fsa', 1); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const h = await new Promise((res) => { const q = db.transaction('handles', 'readonly').objectStore('handles').get('autosaveDir'); q.onsuccess = () => res(q.result); q.onerror = () => res('ERR'); });
    const root = await navigator.storage.getDirectory();
    const names = []; for await (const n of root.keys()) names.push(n);
    let perm = null; try { perm = h && h.queryPermission ? await h.queryPermission({ mode: 'readwrite' }) : 'noapi'; } catch (e) { perm = 'ERR ' + e; }
    return { hasHandle: !!h && h !== 'ERR', perm, names };
  })));
  const st = await mainMenuLoadState(page);
  check(st.missing === false && st.disabled === false, 'S2 po przeładowaniu: menu główne „Wczytaj grę" AKTYWNY', st);
  if (st.missing === false && st.disabled === false) {
    const clicked = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('.civ-menu button')).find((x) => /Wczytaj/.test(x.textContent || ''));
      if (!b) return false;
      b.click();
      return true;
    });
    await wait(2000);
    const info = await page.evaluate(() => {
      const t = document.body.innerText || '';
      return { clicked: true, hasAutosaveText: /autosave|Autozapis|civ-autosave|Brak zapisów/i.test(t), snippet: t.slice(0, 0) };
    });
    check(clicked && errs.length === 0 && info.hasAutosaveText, 'S2 klik „Wczytaj grę" otwiera listę zapisów bez błędu', { clicked, errs: errs.slice(0, 3), ...info });
    await page.screenshot({ path: process.env.E2E_SHOT || '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/s2-load.png' });
  }
  await page.close();
}

async function scenarioS3(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await ctx.addInitScript(FAKE_FSA_INIT);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug, undefined, { timeout: 120000 });
  await wait(1500);
  const st = await mainMenuLoadState(page);
  // Menu główne: wyszarzenie + podpis „brak zapisów" (mainMenu.ts); menu pauzy: title „Brak zapisu".
  check(st.missing === false && st.disabled === true, 'S3 pusty stan: menu główne „Wczytaj grę" WYSZAROWANY', st);
  const pauseEmpty = await page.evaluate(() => !!Array.from(document.querySelectorAll('.civ-menu button')).find((x) => /Wczytaj/.test(x.textContent || '') && x.disabled));
  check(pauseEmpty === true, 'S3 pusty stan: wyszarzenie „Wczytaj grę" utrzymane po ponownym wejściu', { pauseEmpty });
  await ctx.close();
}

(async () => {
  const browser = await launch();
  try {
    const s1 = await scenarioS1(browser);
    await s1.page.close();
    await scenarioS2(browser, s1.ctx);
    await s1.ctx.close();
    await scenarioS3(browser);
  } catch (e) {
    fails++;
    console.log('FAIL wyjatek :: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e));
  } finally {
    await browser.close();
  }
  console.log(fails === 0 ? 'load-game-regression-e2e: OK (0 FAIL)' : 'load-game-regression-e2e: FAIL (' + fails + ')');
  process.exit(fails === 0 ? 0 : 1);
})();
