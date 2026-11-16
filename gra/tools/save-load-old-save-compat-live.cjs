'use strict';
/**
 * save-load-old-save-compat-live.cjs -- R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1.
 *
 * Narzędzie żywe (Chromium, Playwright) sprawdzające zgodność wsteczną starych
 * zapisów po FALACH 760-762 (pola meta: nnsAiOverrides, orderMultByCity,
 * orderGrowthMultByCity, orderValueByCity, playerEverOwnedCityByOwner oraz
 * top-level resourceLedgerHistory).
 *
 * Faza "old" (--phase old --old-dist <katalog>):
 *   zbudowany bundle z commita sprzed FAL 760-762 (np. f6b09c76b, zbudowany POZA
 *   repo) -- nowa gra, założenie stolicy, N tur, wyeksportowanie ostatniego
 *   autozapisu (civ-autosave-N.json z OPFS = atrapa katalogu FSA, ścieżka
 *   produkcyjna) do pliku --save-out. Tryb --strip-from-current: zamiast bundla
 *   starego commita użyj bieżącego bundla (--old-dist) i USUŃ z JSON sześć pól
 *   (symulacja; jawnie oznaczona w raporcie).
 *
 * Faza "new" (--phase new --new-dist <katalog> --save-in <plik>):
 *   wkłada zapis do OPFS nowej strony (bieżący kod), wczytuje go przez menu
 *   główne „Wczytaj grę" (ścieżka produkcyjna), asercje:
 *     A1 brak pageerror i błędów konsoli,
 *     A2 liczba miast i jednostek po wczytaniu = zapisowi,
 *     A3 isAwaitingFirstPlayerCity()=false gdy gracz ma miasta,
 *     A4 „Zakończ turę" działa przez >=3 tury (tura rośnie o 1 na kliknięcie).
 *   Asercje ekonomii (Pieniądz, spichlerz) i dziennika „Skąd zapasy" wymagają
 *   odczytu UI, którego brak w haku dumpState -> NIE ZMIERZONO (raport).
 *
 * Użycie (z gra/):
 *   node tools/save-load-old-save-compat-live.cjs --phase old --old-dist <dir> --save-out <f> [--turns 6] [--strip-from-current]
 *   node tools/save-load-old-save-compat-live.cjs --phase new --new-dist <dir> --save-in <f>
 * Wynik: linie PASS/FAIL/NIE_ZMIERZONO; kod wyjścia 1 przy jakimkolwiek FAIL.
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const args = process.argv.slice(2);
const argOf = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const hasFlag = (k) => args.indexOf(k) >= 0;
const PHASE = argOf('--phase', '');
const DIST = argOf('--old-dist', argOf('--new-dist', ''));
const SAVE_FILE = argOf(PHASE === 'old' ? '--save-out' : '--save-in', '');
const TURNS = parseInt(argOf('--turns', '6'), 10);
const PORT = parseInt(argOf('--port', PHASE === 'old' ? '8771' : '8772'), 10);
const STRIP = hasFlag('--strip-from-current');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT_JSON = path.resolve(__dirname, '..', '..', 'dyspozycje', 'autobot', 'runs',
  'R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1', 'evidence', `${PHASE}-result.json`);

/** Pola zapisu dodane przez FALE 760-762 (ścieżka: meta.* lub top-level). */
const META_FIELDS_760_761 = [
  'nnsAiOverrides', 'orderMultByCity', 'orderGrowthMultByCity', 'orderValueByCity', 'playerEverOwnedCityByOwner',
];
const TOP_FIELDS_762 = ['resourceLedgerHistory'];

let fails = 0;
const results = [];
const check = (ok, label, extra) => {
  if (!ok) fails++;
  const line = (ok ? 'PASS' : 'FAIL') + ' ' + label + (extra !== undefined ? ' :: ' + JSON.stringify(extra) : '');
  console.log(line);
  results.push({ status: ok ? 'PASS' : 'FAIL', label, extra: extra === undefined ? null : extra });
};
const nzm = (label, why) => {
  console.log('NIE_ZMIERZONO ' + label + ' :: ' + why);
  results.push({ status: 'NIE_ZMIERZONO', label, extra: why });
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
    return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  }
}

/** Serwer statyczny na porcie PORT (python3, w tle procesu, zabijany na końcu). */
function startServer(dir) {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', dir, '--bind', '127.0.0.1'], { stdio: 'ignore' });
  return srv;
}

async function newestAutosaveName(page) {
  return page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const names = [];
    for await (const n of root.keys()) if (/^civ-autosave-\d+\.json$/.test(n)) names.push(n);
    names.sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));
    return names.length ? names[names.length - 1] : null;
  });
}

async function readOpfsFile(page, name) {
  return page.evaluate(async (n) => {
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle(n);
    return (await fh.getFile()).text();
  }, name);
}

async function writeOpfsFile(page, name, text) {
  await page.evaluate(async ([n, t]) => {
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle(n, { create: true });
    const w = await fh.createWritable();
    await w.write(t);
    await w.close();
  }, [name, text]);
}

async function endTurnOnce(page) {
  const before = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState().turn);
  await page.evaluate(() => { const b = document.querySelector('[data-end]'); if (b && b.getAttribute('aria-disabled') !== 'true') b.click(); });
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline) {
    await wait(500);
    const t = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState().turn);
    if (t > before) return t;
  }
  return null;
}

async function phaseOld() {
  if (!DIST || !SAVE_FILE) throw new Error('faza old: wymagane --old-dist i --save-out');
  const srv = startServer(DIST);
  const browser = await launch();
  let saveText = null;
  try {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await ctx.addInitScript(FAKE_FSA_INIT);
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('PAGEERR ' + e));
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug, undefined, { timeout: 120000 });
    await page.waitForSelector('.civ-menu', { timeout: 120000 });
    await wait(300);
    await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 2, 'normal'));
    await page.waitForFunction(() => {
      const s = window.__cityStateStartUnitsTestDebug.dumpState();
      return s.playerStartHex !== null && s.awaitingFirstPlayerCity === true;
    }, undefined, { timeout: 500000 });
    const founded = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
    check(founded === true, 'OLD zakłada stolicę gracza', founded);
    await page.waitForFunction(() => window.__cityStateStartUnitsTestDebug.dumpState().cities.length > 0, undefined, { timeout: 30000 }).catch(() => {});
    const diag = await page.evaluate(() => {
      const s = window.__cityStateStartUnitsTestDebug.dumpState();
      return { turn: s.turn, cities: s.cities.length, units: s.units.length, awaiting: s.awaitingFirstPlayerCity, nnsGateBlocked: typeof window.__cityStateStartUnitsTestDebug.nnsGateBlocked === 'function' ? window.__cityStateStartUnitsTestDebug.nnsGateBlocked() : 'brak haka' };
    });
    console.log('INFO OLD po zakładaniu stolicy=' + JSON.stringify(diag));
    let turn = diag.turn;
    for (let i = 0; i < TURNS; i++) {
      const t = await endTurnOnce(page);
      if (t === null) { check(false, 'OLD tura ' + (i + 1) + ' nie przechodzi (timeout)'); break; }
      turn = t;
    }
    await wait(2500);
    const name = await newestAutosaveName(page);
    check(name !== null, 'OLD autozapis w OPFS powstał', name);
    if (name) saveText = await readOpfsFile(page, name);
    check(errs.length === 0, 'OLD brak pageerror', errs.slice(0, 3));
    const snap = await page.evaluate(() => { const s = window.__cityStateStartUnitsTestDebug.dumpState(); return { turn: s.turn, cities: s.cities.length, units: s.units.length }; });
    console.log('INFO OLD stan=' + JSON.stringify(snap) + ' plik=' + name);
    await ctx.close();
  } finally {
    await browser.close().catch(() => {});
    srv.kill('SIGKILL');
  }
  if (!saveText) return;
  let obj = JSON.parse(saveText);
  const removed = { meta: [], top: [] };
  if (STRIP) {
    for (const f of META_FIELDS_760_761) if (obj.meta && f in obj.meta) { delete obj.meta[f]; removed.meta.push(f); }
    for (const f of TOP_FIELDS_762) if (f in obj) { delete obj[f]; removed.top.push(f); }
    console.log('INFO OLD SYMULACJA: usunięto pola ' + JSON.stringify(removed) + ' (zapis z bieżącego kodu, NIE prawdziwy stary commit)');
  }
  fs.mkdirSync(path.dirname(SAVE_FILE), { recursive: true });
  fs.writeFileSync(SAVE_FILE, JSON.stringify(obj));
  check(true, 'OLD zapis wyeksportowany do ' + SAVE_FILE, { strip: STRIP, removed, bytes: fs.statSync(SAVE_FILE).size });
}

async function phaseNew() {
  if (!DIST || !SAVE_FILE) throw new Error('faza new: wymagane --new-dist i --save-in');
  const saveObj = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8'));
  const expectCities = saveObj.cities ? saveObj.cities.length : null;
  const expectUnits = saveObj.units ? saveObj.units.length : null;
  const expectTurn = saveObj.turn !== undefined ? saveObj.turn : null;
  const srv = startServer(DIST);
  const browser = await launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await ctx.addInitScript(FAKE_FSA_INIT);
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('PAGEERR ' + e));
    page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 160)); });
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug, undefined, { timeout: 120000 });
    await page.waitForSelector('.civ-menu', { timeout: 120000 });
    await writeOpfsFile(page, 'civ-autosave-1.json', fs.readFileSync(SAVE_FILE, 'utf8'));
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug, undefined, { timeout: 120000 });
    await page.waitForSelector('.civ-menu', { timeout: 120000 });
    await wait(800);
    const clicked = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('.civ-menu button')).find((x) => /Wczytaj/.test(x.textContent || ''));
      if (!b || b.disabled) return false;
      b.click();
      return true;
    });
    check(clicked, 'NEW menu główne: „Wczytaj grę" klikalne przy zapisie w OPFS', clicked);
    await page.waitForSelector('.civ-sl-row', { timeout: 20000 }).catch(() => {});
    await page.evaluate(() => {
      const row = document.querySelector('.civ-sl-row');
      if (row) row.click();
    });
    await wait(300);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('.civ-sl-btns button')).find((x) => /Wczytaj/.test(x.textContent || ''));
      if (btn) btn.click();
    });
    await page.waitForFunction(() => {
      try { return window.__cityStateStartUnitsTestDebug.dumpState().cities.length > 0; } catch { return false; }
    }, undefined, { timeout: 300000 }).catch(() => {});
    await wait(1500);
    const st = await page.evaluate(() => {
      const s = window.__cityStateStartUnitsTestDebug.dumpState();
      return { turn: s.turn, cities: s.cities.length, units: s.units.length, awaiting: s.awaitingFirstPlayerCity };
    });
    console.log('INFO NEW po wczytaniu=' + JSON.stringify(st) + ' zapis=' + JSON.stringify({ expectCities, expectUnits, expectTurn }));
    check(expectCities === null || st.cities === expectCities, 'NEW liczba miast po wczytaniu = zapis', { got: st.cities, want: expectCities });
    check(expectUnits === null || st.units === expectUnits, 'NEW liczba jednostek po wczytaniu = zapis', { got: st.units, want: expectUnits });
    if (st.cities > 0) check(st.awaiting === false, 'NEW isAwaitingFirstPlayerCity()=false przy miastach gracza', st.awaiting);
    const turns = [st.turn];
    for (let i = 0; i < 3; i++) {
      const t = await endTurnOnce(page);
      turns.push(t);
      if (t === null) break;
    }
    const ok3 = turns.length === 4 && turns.every((t, i) => i === 0 || (t !== null && t === turns[i - 1] + 1));
    check(ok3, 'NEW „Zakończ turę" działa 3 razy (tura rośnie o 1)', turns);
    nzm('NEW Pieniądz/spichlerz po wczytaniu = zapis', 'brak odczytu tych wartości w haku dumpState (potrzebny hak metryk)');
    nzm('NEW dziennik „Skąd zapasy" pusty po wczytaniu i rośnie po tickach', 'brak odczytu dziennika w haku dumpState; wymaga odczytu UI');
    nzm('NEW scenariusz 0 miast (stary zapis bez flagi playerEverOwnedCityByOwner)', 'nie wygenerowano osobnego zapisu bez miast w tej rundzie');
    nzm('MUTACJA: usunięcie ochrony Array.isArray -> narzędzie czerwone', 'nie wykonano (kopia main.ts poza zakresem allowlisty tego tematu)');
    check(errs.length === 0, 'NEW brak pageerror i błędów konsoli', errs.slice(0, 5));
    await ctx.close();
  } finally {
    await browser.close().catch(() => {});
    srv.kill('SIGKILL');
  }
}

(async () => {
  if (PHASE === 'old') await phaseOld();
  else if (PHASE === 'new') await phaseNew();
  else { console.error('użycie: --phase old|new'); process.exit(2); }
  try {
    fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
    fs.writeFileSync(OUT_JSON, JSON.stringify({ phase: PHASE, strip: STRIP, results }, null, 2));
  } catch (e) { console.error('zapis wyniku nieudany: ' + e.message); }
  console.log(fails === 0 ? 'WYNIK: brak FAIL' : 'WYNIK: FAIL=' + fails);
  process.exit(fails === 0 ? 0 : 1);
})().catch((e) => { console.error('BŁĄD: ' + (e && e.stack || e)); process.exit(1); });
