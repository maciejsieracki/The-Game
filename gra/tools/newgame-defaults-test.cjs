'use strict';
/**
 * newgame-defaults-test.cjs — R-WEB-NEWGAME-DEFAULTS-Q1 (Maciej 2026-10-31).
 *
 * Real-browser test of the NEW-GAME wizard defaults on a FRESH profile (empty localStorage):
 *   - krok 4 „Ustawienia Rozgrywki" (grid) i okno „Zaawansowane opcje" pokazują tabelę domyślnych,
 *   - udział lądu = 30% dla Kontynenty / Pangea / Wyspy (suwak widoczny we wszystkich trzech),
 *   - typ Ziemia = brak suwaka „Udział lądu na mapie",
 *   - krok 5 „Start" (podsumowanie parametrów startu) odzwierciedla te same wartości.
 *
 * Bundle budowany vite'em DO KATALOGU TYMCZASOWEGO POZA REPO (nie `npm run build`).
 *
 * Run from gra/:  node tools/newgame-defaults-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'newgame-defaults-'));
let OUT_HTML = '';

let pass = 0;
let fail = 0;

function assert(label, condition) {
  if (condition) {
    pass++;
    console.log(`  OK  ${label}`);
  } else {
    fail++;
    console.error(` FAIL ${label}`);
  }
}

function buildBundle() {
  console.log('[newgame-defaults-test] budowanie bundla (vite build -> katalog tymczasowy)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[newgame-defaults-test] build OK.');
}

async function serveBundleOverHttp() {
  const htmlPath = path.join(OUT_DIR, 'index.html');
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    if (pathname === '/favicon.ico') {
      response.writeHead(204).end();
      return;
    }
    if (pathname !== '/') {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    fs.createReadStream(htmlPath).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  OUT_HTML = `http://127.0.0.1:${server.address().port}/`;
  return server;
}

function browserCandidates() {
  const explicit = process.env.CIV_CHROME_PATH || process.env.CHROME_PATH;
  const candidates = explicit ? [explicit] : [];
  candidates.push('/usr/bin/chromium');
  const roots = [];
  const playwrightRoot = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (playwrightRoot && playwrightRoot !== '0') roots.push(playwrightRoot);
  roots.push(path.join(os.homedir(), '.cache', 'ms-playwright'));
  roots.push('/opt/pw-browsers');
  for (const root of roots) {
    let entries;
    try { entries = fs.readdirSync(root).sort().reverse(); } catch (_) { continue; }
    for (const entry of entries) {
      if (!entry.startsWith('chromium')) continue;
      for (const relative of [path.join('chrome-linux64', 'chrome'), path.join('chrome-linux', 'chrome')]) {
        candidates.push(path.join(root, entry, relative));
      }
    }
  }
  return [...new Set(candidates)].filter((candidate) => fs.existsSync(candidate));
}

async function launchBrowser(chromium) {
  let defaultError;
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    defaultError = error;
  }
  for (const executablePath of browserCandidates()) {
    try {
      return await chromium.launch({
        headless: true,
        executablePath,
        args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
      });
    } catch (_) {
      // next candidate
    }
  }
  throw new Error('Nie udało się uruchomić Chromium. Domyślny błąd: ' + defaultError.message);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Świeży profil: nowy kontekst = pusty localStorage. */
async function openFreshWizard(browser) {
  const context = await browser.newContext({ viewport: { width: 1770, height: 970 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error && error.message)));
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-menu', { timeout: 60000 });
  await wait(400);
  await page.locator('.civ-menu .mbtn.primary').click();
  await page.waitForSelector('.civ-newgame .cta-hero', { timeout: 15000 });
  await wait(120);
  return { context, page, errors };
}

async function activeStepLabel(page) {
  const text = await page.locator('.civ-newgame .stepbar .si.active .si-l').textContent();
  return (text || '').trim();
}

async function clickNext(page) {
  // Krok Intro: przejście CTA „cta-hero" (dolna nawigacja pojawia się od kroku 2).
  if ((await activeStepLabel(page)) === 'Intro') {
    await page.locator('.civ-newgame .cta-hero').click();
  } else {
    await page.locator('.civ-newgame .nav .nb.next').click();
  }
  await wait(150);
}

async function gotoStep(page, label) {
  for (let i = 0; i < 8; i++) {
    if ((await activeStepLabel(page)) === label) return;
    await clickNext(page);
  }
  throw new Error('Nie udało się dojść do kroku ' + label + ' (aktywny: ' + (await activeStepLabel(page)) + ')');
}

/** Wiersze siatki „Ustawienia Rozgrywki" (krok 4): [{lbl, val}]. */
async function gridRows(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('.civ-newgame .sett-grid .srow')).map((row) => ({
    lbl: (row.querySelector('.sl')?.textContent || '').trim(),
    val: (row.querySelector('.sv')?.textContent || '').trim(),
  })));
}

/** Kliknij strzałkę „›" w wierszu siatki o danej etykiecie. */
async function clickGridArrow(page, lbl, dir) {
  const ok = await page.evaluate(({ lbl, dir }) => {
    const row = Array.from(document.querySelectorAll('.civ-newgame .sett-grid .srow'))
      .find((r) => (r.querySelector('.sl')?.textContent || '').trim() === lbl);
    if (!row) return false;
    const arrows = row.querySelectorAll('.sctl .arr');
    const btn = dir < 0 ? arrows[0] : arrows[arrows.length - 1];
    if (!btn) return false;
    btn.click();
    return true;
  }, { lbl, dir });
  await wait(150);
  return ok;
}

function valueOf(rows, lbl) {
  const row = rows.find((r) => r.lbl === lbl);
  return row ? row.val : undefined;
}

const EXPECTED_GRID = {
  'Rozmiar mapy': 'Standardowy',
  'Typ świata': 'Kontynenty',
  'Poziom trudności': 'Normalny',
  'Prędkość gry': 'Standardowa',
  'Wymagaj rozpatrzenia ofert handlowych przed końcem tury': 'Włączona',
  'Udział lądu na mapie': '30% lądu / 70% morze',
};

const EXPECTED_ADV = {
  'Warunki zwycięstwa': 'Moc + dominacja',
  'Trudność miast-państw': 'Normalny',
  'Barbarzyńcy': 'Normalny',
  'Bitwy': 'Bitwa ręczna i automatyczna',
  'Koszty budynków': 'Normalny',
  'Koszty jednostek': 'Normalny',
  'Wzrost ludności': 'Normalny',
  'Zasięg ruchu': 'Normalny',
  'Limit miast zakładanych (baza)': '10 miast',
  'Wojna epoki z udziałem gracza': 'Włączona',
  'Chatki z nagrodami': 'Włączone',
  'Jakość grafiki mapy': 'Średnia',
  'Surowce na mapie': 'Normalnie',
  'Rzeki': 'Normalnie',
  'Pustynie': 'Normalnie',
  'Las': 'Normalnie',
  'Góry i wzgórza': 'Normalnie',
};

async function main() {
  buildBundle();
  const server = await serveBundleOverHttp();
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (error) {
    throw new Error('Brak modułu playwright: ' + error.message);
  }
  const browser = await launchBrowser(chromium);
  try {
    // --- 1. Świeży profil: krok 4, siatka + domyślne Kontynenty ---
    console.log('\n== 1. świeży profil, Kontynenty ==');
    const a = await openFreshWizard(browser);
    await gotoStep(a.page, 'Ustawienia');
    const grid = await gridRows(a.page);
    console.log('  GRID ' + JSON.stringify(grid));
    for (const [lbl, expected] of Object.entries(EXPECTED_GRID)) {
      assert(`krok 4 „${lbl}" = ${expected}`, valueOf(grid, lbl) === expected);
    }
    const evidenceDir = path.resolve(GRA_DIR, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-NEWGAME-DEFAULTS-Q1', 'evidence');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await a.page.screenshot({ path: path.join(evidenceDir, 'krok4-ustawienia-domyslne.png') });
    await a.page.locator('.civ-newgame .btn-adv').click();
    await wait(200);
    await a.page.screenshot({ path: path.join(evidenceDir, 'zaawansowane-domyslne.png') });
    const adv =await a.page.evaluate(() => Array.from(document.querySelectorAll('.adv-modal .adv-row')).map((row) => ({
      lbl: (row.querySelector('.adv-lbl')?.textContent || '').trim(),
      val: (row.querySelector('.sv')?.textContent || '').trim(),
    })));
    console.log('  ADV ' + JSON.stringify(adv));
    for (const [lbl, expected] of Object.entries(EXPECTED_ADV)) {
      const row = adv.find((r) => r.lbl === lbl);
      assert(`okno „Zaawansowane" „${lbl}" = ${expected}`, !!row && row.val === expected);
    }
    await a.page.locator('.adv-modal .adv-close').click();
    await wait(150);

    // --- 2. Udział lądu 30% dla Pangea i Wyspy (suwak obecny) ---
    console.log('\n== 2. udział lądu: Pangea / Wyspy ==');
    assert('Kontynenty: zmiana typu na Pangea (strzałka w prawo)', await clickGridArrow(a.page, 'Typ świata', 1));
    let rows = await gridRows(a.page);
    assert('Pangea: typ świata = Pangea', valueOf(rows, 'Typ świata') === 'Pangea');
    assert('Pangea: suwak lądu obecny = 30% lądu / 70% morze', valueOf(rows, 'Udział lądu na mapie') === '30% lądu / 70% morze');
    assert('Wyspy: zmiana typu na Wyspy', await clickGridArrow(a.page, 'Typ świata', 1));
    rows = await gridRows(a.page);
    assert('Wyspy: typ świata = Wyspy', valueOf(rows, 'Typ świata') === 'Wyspy');
    assert('Wyspy: suwak lądu obecny = 30% lądu / 70% morze', valueOf(rows, 'Udział lądu na mapie') === '30% lądu / 70% morze');

    // --- 3. Ziemia: brak suwaka udziału lądu ---
    console.log('\n== 3. typ Ziemia: brak suwaka ==');
    assert('Wyspy: zmiana typu na Ziemia', await clickGridArrow(a.page, 'Typ świata', 1));
    rows = await gridRows(a.page);
    assert('Ziemia: typ świata = Ziemia', valueOf(rows, 'Typ świata') === 'Ziemia');
    assert('Ziemia: brak wiersza „Udział lądu na mapie"', valueOf(rows, 'Udział lądu na mapie') === undefined);
    assert('Ziemia -> Wyspy: strzałka w lewo', await clickGridArrow(a.page, 'Typ świata', -1));
    rows = await gridRows(a.page);
    assert('Wyspy po powrocie: suwak wraca = 30% lądu / 70% morze', valueOf(rows, 'Udział lądu na mapie') === '30% lądu / 70% morze');
    await a.page.locator('.civ-newgame .btn-adv').click();
    await wait(200);
    await a.page.locator('.adv-modal .adv-close').click();
    await wait(150);

    // --- 4. Krok 5 „Start": podsumowanie parametrów startu ---
    console.log('\n== 4. krok Start: podsumowanie ==');
    await gotoStep(a.page, 'Start');
    const summary = await a.page.evaluate(() => (document.querySelector('.civ-newgame')?.textContent || ''));
    for (const needle of ['Bitwa ręczna i automatyczna', 'Normalny', 'Moc + dominacja', 'Standardowy']) {
      assert(`krok Start zawiera „${needle}"`, summary.includes(needle));
    }
    assert('brak błędów strony (pageerror)', a.errors.length === 0);
    await a.context.close();
  } finally {
    await browser.close();
    server.close();
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }
  console.log(`\n${pass} pass · ${fail} fail`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('[newgame-defaults-test] błąd:', error);
  process.exitCode = 1;
});
