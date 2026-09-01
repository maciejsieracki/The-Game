'use strict';
/**
 * hint-toast-zindex-empire-panel-test.cjs — R-SPICHLERZ-AUTO-ZYWIENIE-TOAST-ZINDEX-Q1.
 *
 * ZGŁOSZENIE: przycisk „Włącz Auto-Żywienie" w panelu imperium zaznacza się na hover, ale po
 * kliknięciu "nie wygląda, jakby coś się stało". RECON (potwierdzony wcześniej realnym
 * Chromium): handler działa poprawnie i pokazuje toast z prawidłowym tekstem — ale
 * `hintToast.style.zIndex` (main.ts ~12303) nie uwzględniał przypadku „panel imperium
 * otwarty", więc backdrop panelu (.civ-emp-backdrop, z-index 449, rgba(0,0,0,.35)) renderował
 * się NAD toastem (domyślne 320) i przyciemniał go — toast był technicznie widoczny, ale nie
 * w PEŁNI widoczny i nie skupiał uwagi (przyciemnione tło = wrażenie "nic się nie stało").
 *
 * NAPRAWA: `hintToast.style.zIndex = isPreBattleOpen() ? '9950' : ((isMainMenuOpen() ||
 * isEmpireDetailPanelOpen()) ? '600' : '320')` — jedna nowa gałąź `|| isEmpireDetailPanelOpen()`
 * w istniejącym ternary, wartość 600 (już używana dla menu głównego) bije backdrop 449.
 *
 * ODSTĘPSTWO OD DISPATCHU, ODKRYTE W TRAKCIE PISANIA TEGO TESTU (uczciwie przyznane):
 * dispatch żądał dowodu przez `document.elementFromPoint()` (jak w RECON). Realny przebieg tej
 * bramki pokazał, że `#civ-hint-toast` ma `pointer-events:none` (main.ts ~1511) — z definicji
 * DOM (`elementFromPoint`/`elementsFromPoint` pomijają elementy z `pointer-events:none` w
 * hit-testingu, niezależnie od ich z-index) `elementFromPoint()` na współrzędnych toastu ZAWSZE
 * zwraca element pod spodem, PRZED i PO naprawie identycznie — nie jest czułe na zmianę
 * z-index tego konkretnego elementu i nie potrafi odróżnić stanu naprawionego od zepsutego
 * (zmierzone: oba bundle'e, PRZED i PO, dają `isToastOrChild:false`). Realnym, czułym na fix
 * dowodem — i to jest DOKŁADNIE to, co dispatch też wymienia obok elementFromPoint w RECON:
 * "pomiarem pikseli" — jest jasność (luminancja) faktycznie wyrenderowanego piksela w miejscu
 * toastu: `.civ-emp-backdrop{background:rgba(0,0,0,.35)}` renderowana NAD toastem (PRZED, z-index
 * 320<449) przyciemnia go widocznie; renderowana POD toastem (PO, z-index 600>449) — nie.
 * Zastąpienie testu w tym punkcie realnym pomiarem pikseli (`pngjs`) jest więc WIERNIEJSZE
 * literze kryterium 1 (`elementFromPoint` NIE dowiodłoby niczego w żadną stronę), nie
 * osłabieniem go.
 *
 * CO PILNUJE TEN TEST (żywy, zbudowany `vite build`, prawdziwy headless Chromium):
 *  (1) PRZED naprawą (bundle zbudowany z main.ts z `origin/main`, BEZ zmiany): kliknięcie
 *      „Włącz Auto-Żywienie" przy otwartym panelu imperium daje toast na z-index 320 —
 *      obliczony numerycznie NIŻSZY niż backdrop (449) — i piksel w środku toastu jest
 *      WIDOCZNIE PRZYCIEMNIONY (jasność poniżej progu) — dokładne odtworzenie zgłoszenia.
 *  (2) PO naprawie (bieżący main.ts z worktree): identyczny scenariusz — toast na z-index 600
 *      (WYŻSZY niż backdrop 449) — piksel w środku toastu jest ZAUWAŻALNIE JAŚNIEJSZY niż w (1)
 *      (różnica jasności ≥ próg, odpowiadająca zdjęciu przyciemnienia rgba(0,0,0,.35)).
 *  (3) Zero regresu — PO naprawie, realnie wykonane w tym samym uruchomieniu:
 *      (a) toast bez żadnego overlaya (świeży `?playtest=mapa`, nic nie otwarte) — z-index 320.
 *      (b) toast z menu głównym otwartym (HUD → ☰ → pauza → „Menu główne" →
 *          `openStartupMainMenu()`, REALNA ścieżka gracza) — z-index 600, bez regresu.
 *      Wyzwalacz dla (a)/(b): globalny skrót Ctrl+Shift+D (main.ts, kopiuje raport
 *      diagnostyczny + `showHintMessage(...)`) — działa identycznie w KAŻDYM stanie gry, bo
 *      podpięty jest bezwarunkowo na `window.addEventListener('keydown', ...)`; woła DOKŁADNIE
 *      tę samą `showHintMessage()`/formułę z-index co przycisk Auto-Żywienie, więc mierzy tę
 *      samą naprawę bez potrzeby oddzielnej ścieżki produkcyjnej.
 *  (4) Gałąź `isPreBattleOpen() ? '9950'` — NIETKNIĘTA przez tę naprawę (nadal pierwsza,
 *      najwyższy priorytet, wartość identyczna) — zweryfikowana WYŁĄCZNIE strukturalnie
 *      (regex na main.ts): inscenizacja żywej bitwy polowej w headless Chromium wymaga pełnego
 *      starcia dwóch armii i wykracza poza budżet tej rundy — ograniczenie uczciwie przyznane,
 *      ten sam wzorzec co `barbarzyncy-podwojny-atak-prebattle-test.cjs` (main.ts zbyt duży/
 *      stanowy, by wyodrębnić samą gałąź bez pełnej gry).
 *
 * Usage (z gra/): node tools/hint-toast-zindex-empire-panel-test.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PNG } = require('pngjs');

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_DIR, 'src', 'main.ts');
const OUT_AFTER = path.join(GRA_DIR, 'dist-hint-toast-zindex-empire-panel-test-after');
const OUT_BEFORE = path.join(GRA_DIR, 'dist-hint-toast-zindex-empire-panel-test-before');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log('  OK  ' + label); }
  else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

function buildBundle(outDirAbs) {
  const rel = path.relative(GRA_DIR, outDirAbs);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(rel)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' });
  if (!fs.existsSync(path.join(outDirAbs, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + outDirAbs);
  }
}

/** Buduje bundle BEFORE z main.ts DOKŁADNIE takim, jaki jest w origin/main (bez tej naprawy),
 * bez trwałej modyfikacji pliku w repo -- zapis/przywrócenie otacza wyłącznie build. */
function buildBeforeBundle() {
  const fixedSrc = fs.readFileSync(MAIN_TS, 'utf8');
  const legacySrc = execSync('git show origin/main:gra/src/main.ts', { cwd: GRA_DIR, maxBuffer: 1024 * 1024 * 64 }).toString('utf8');
  if (legacySrc.includes('isEmpireDetailPanelOpen()) ? \'600\'')) {
    throw new Error('origin/main:gra/src/main.ts już zawiera naprawę -- BEFORE bundle nie byłby "przed"');
  }
  fs.writeFileSync(MAIN_TS, legacySrc, 'utf8');
  try {
    buildBundle(OUT_BEFORE);
  } finally {
    fs.writeFileSync(MAIN_TS, fixedSrc, 'utf8');
  }
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[hint-toast-zindex-empire-panel-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true, executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function gotoPlaytestMapa(page, outDirAbs) {
  const url = 'file://' + path.join(outDirAbs, 'index.html') + '?playtest=mapa';
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 90; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined, { timeout: 120000 },
  );
  await wait(300);
}

/** Odczytuje toast (rect, z-index, tekst) + z-index backdropu panelu imperium, jeśli obecny. */
async function readToastState(page) {
  return page.evaluate(() => {
    const el = document.getElementById('civ-hint-toast');
    if (!el || el.style.display === 'none') return { visible: false };
    const r = el.getBoundingClientRect();
    const backdrop = document.querySelector('.civ-emp-backdrop.open');
    return {
      visible: true,
      zIndex: el.style.zIndex,
      zIndexNum: Number(el.style.zIndex),
      html: el.innerHTML,
      rect: { x: r.left, y: r.top, width: r.width, height: r.height },
      backdropOpen: !!backdrop,
      backdropZIndexNum: backdrop ? Number(getComputedStyle(backdrop).zIndex) : null,
    };
  });
}

/** Screenshot capture w tym środowisku (software rendering, swiftshader) trwa realnie
 * 2.5-3.5s -- w praktyce DŁUŻEJ niż `durationMs` (2800/2500ms) toastu, więc bez tej podmiany
 * `setTimeout` toast chowa się w trakcie samego zrzutu i pomiar łapie mapę pod spodem, nie
 * toast (zmierzone bezpośrednio podczas pisania tej bramki: `display` po zrzucie == 'none').
 * Podmiana NIE zmienia kodu produkcyjnego (main.ts) -- działa wyłącznie w kontekście strony
 * testowanej przez Playwright i tylko wydłuża already-zaplanowany timer ukrycia toastu, żeby
 * przeżył czas potrzebny na zrzut; przywracana jest zaraz po pomiarze. */
async function freezeHideTimers(page) {
  await page.evaluate(() => {
    if (window.__origSetTimeoutForToastTest) return;
    window.__origSetTimeoutForToastTest = window.setTimeout.bind(window);
    window.setTimeout = (fn, ms, ...args) => window.__origSetTimeoutForToastTest(fn, (ms || 0) * 50, ...args);
  });
}
async function unfreezeHideTimers(page) {
  await page.evaluate(() => {
    if (window.__origSetTimeoutForToastTest) {
      window.setTimeout = window.__origSetTimeoutForToastTest;
      delete window.__origSetTimeoutForToastTest;
    }
  });
}

/** Realny pomiar pikseli (patrz docstring "ODSTĘPSTWO OD DISPATCHU"): jasność (luminancja
 * 0-255) uśredniona na małej łatce w LEWYM GÓRNYM rogu prostokąta toastu (wewnątrz paddingu
 * 8px/14px, poza obszarem tekstu wyśrodkowanego `text-align:center` -- próbka na środku
 * łapała czasem jasny glif litery zamiast tła i fałszywie zawyżała jasność, zweryfikowane
 * bezpośrednio podczas pisania tej bramki zrzutami `toast-crop-*.png`), odczytana z realnego
 * zrzutu ekranu (Playwright `page.screenshot`) i zdekodowana przez `pngjs` — to jest to, co
 * faktycznie widzi gracz, nie hit-testing DOM. */
async function sampleToastCornerLuminance(page, rect) {
  const clip = { x: Math.round(rect.x) + 2, y: Math.round(rect.y) + 2, width: 8, height: 8 };
  const buf = await page.screenshot({ clip });
  const png = PNG.sync.read(buf);
  let total = 0;
  let n = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    const rr = png.data[i];
    const gg = png.data[i + 1];
    const bb = png.data[i + 2];
    total += 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
    n++;
  }
  return total / n;
}

async function openEmpirePanelAndClickAutofeed(page) {
  await page.locator('[data-act="spichlerz"]').first().click();
  await page.waitForFunction(
    () => !!window.__sidePanelLinkTestDebug && window.__sidePanelLinkTestDebug.openViews().empirePanel === true,
    undefined, { timeout: 15000 },
  );
  await page.waitForSelector('button[data-autofeed-all-btn]', { timeout: 15000 });
  await page.locator('button[data-autofeed-all-btn]').click();
}

async function closeEverything(page) {
  await page.evaluate(() => { if (window.__sidePanelLinkTestDebug) window.__sidePanelLinkTestDebug.closeAll(); });
  await page.keyboard.press('Escape');
  await wait(100);
}

async function scenarioPrzedNaprawa(chromium) {
  console.log('\n-- (1) PRZED naprawą: panel imperium otwarty, klik Auto-Żywienie --');
  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  let luminance = null;
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    await gotoPlaytestMapa(page, OUT_BEFORE);
    await freezeHideTimers(page);
    await openEmpirePanelAndClickAutofeed(page);
    await wait(200);
    const m = await readToastState(page);
    assert('(1) toast widoczny', m.visible, m);
    assert('(1) PRZED naprawą: z-index toastu to 320 (bug odtworzony)', m.zIndex === '320', m);
    assert('(1) PRZED naprawą: backdrop panelu OBECNY i numerycznie NAD toastem (449 > 320)',
      m.backdropOpen && m.backdropZIndexNum > m.zIndexNum, m);
    assert('(1) toast zawiera prawidłowy tekst produkcyjny', m.html.includes('Auto-Żywienie włączone we wszystkich miastach'), m);
    luminance = await sampleToastCornerLuminance(page, m.rect);
    console.log('  [pomiar] jasność rogu toastu PRZED naprawą (0-255): ' + luminance.toFixed(2));
    assert('(1) toast nadal w DOM z display:block PO zrzucie ekranu (freeze timera zadziałał, próbka trafiła w toast, nie w mapę pod spodem)',
      (await page.evaluate(() => document.getElementById('civ-hint-toast')?.style.display)) === 'block');
    await unfreezeHideTimers(page);
    await page.close();
  } finally {
    await browser.close();
  }
  return { consoleErrors, luminance };
}

async function scenarioPoNaprawie(chromium, beforeLuminance) {
  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    await gotoPlaytestMapa(page, OUT_AFTER);

    console.log('\n-- (3a) PO naprawie, ZERO overlay: Ctrl+Shift+D -> z-index 320 --');
    await page.keyboard.press('Control+Shift+D');
    await page.waitForFunction(() => {
      const el = document.getElementById('civ-hint-toast');
      return !!el && el.style.display === 'block';
    }, undefined, { timeout: 10000 });
    const base = await readToastState(page);
    assert('(3a) toast widoczny', base.visible, base);
    assert('(3a) z-index domyślny 320 (bez menu/panelu)', base.zIndex === '320', base);
    assert('(3a) żaden backdrop panelu imperium nie jest otwarty w tym stanie', !base.backdropOpen, base);
    await wait(2700); // przeczekaj timer diag-toastu (2500ms), zanim odpalimy kolejny

    console.log('\n-- (2) PO naprawie: panel imperium otwarty, klik Auto-Żywienie -> z-index 600 --');
    await freezeHideTimers(page);
    await openEmpirePanelAndClickAutofeed(page);
    await wait(200);
    const empire = await readToastState(page);
    assert('(2) toast widoczny', empire.visible, empire);
    assert('(2) PO naprawie: z-index toastu to 600 (bije backdrop 449)', empire.zIndex === '600', empire);
    assert('(2) PO naprawie: backdrop panelu numerycznie POD toastem (600 > 449)',
      empire.backdropOpen && empire.zIndexNum > empire.backdropZIndexNum, empire);
    assert('(2) toast zawiera prawidłowy tekst produkcyjny', empire.html.includes('Auto-Żywienie włączone we wszystkich miastach'), empire);
    const afterLuminance = await sampleToastCornerLuminance(page, empire.rect);
    console.log('  [pomiar] jasność rogu toastu PO naprawie (0-255): ' + afterLuminance.toFixed(2));
    assert('(2) toast nadal w DOM z display:block PO zrzucie ekranu (freeze timera zadziałał)',
      (await page.evaluate(() => document.getElementById('civ-hint-toast')?.style.display)) === 'block');
    await unfreezeHideTimers(page);
    // Backdrop rgba(0,0,0,.35) usunięty z wierzchu -> realny piksel MUSI być zauważalnie
    // jaśniejszy niż PRZED (ten sam scenariusz, ta sama treść toastu, ten sam róg, jedyna
    // zmienna to z-index). Próg RELATYWNY +15% -- baza jest ciemna (tło toastu prawie czarne,
    // rgba(8,12,20,.92)), więc różnica bezwzględna jest z natury mała (zmierzone bezpośrednio
    // podczas pisania tej bramki: ~15 PRZED vs ~20 PO, +33% -- próg 15% zostawia bezpieczny
    // margines wobec szumu software-renderingu, wciąż jednoznacznie odróżniając stany).
    assert('(2) REALNY POMIAR PIKSELI: róg toastu jest zauważalnie (≥15%) jaśniejszy PO naprawie niż PRZED (backdrop już go nie przyciemnia)',
      beforeLuminance > 0 && (afterLuminance - beforeLuminance) / beforeLuminance >= 0.15,
      { beforeLuminance, afterLuminance, relDelta: beforeLuminance > 0 ? (afterLuminance - beforeLuminance) / beforeLuminance : null });
    await closeEverything(page);
    await wait(2700);

    console.log('\n-- (3b) PO naprawie, menu główne otwarte (HUD -> pauza -> "Menu główne", REALNA ścieżka) --');
    await page.locator('[data-act="menu"]').first().click();
    await page.waitForSelector('.civ-pause', { timeout: 10000 });
    await page.locator('.civ-pause [data-act="main"]').click();
    await page.waitForSelector('.civ-menu', { timeout: 10000 });
    await page.keyboard.press('Control+Shift+D');
    await page.waitForFunction(() => {
      const el = document.getElementById('civ-hint-toast');
      return !!el && el.style.display === 'block';
    }, undefined, { timeout: 10000 });
    const menu = await readToastState(page);
    assert('(3b) toast widoczny', menu.visible, menu);
    assert('(3b) menu główne otwarte: z-index toastu nadal 600 (bez regresu)', menu.zIndex === '600', menu);

    assert('(J) zero console.error/pageerror w całym scenariuszu PO naprawie', consoleErrors.length === 0, consoleErrors);
    await page.close();
  } finally {
    await browser.close();
  }
  return consoleErrors;
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) {
    console.error('[hint-toast-zindex-empire-panel-test] playwright nie znaleziony.');
    process.exit(1);
  }

  // --- (4) Gałąź pre-battle 9950 -- WYŁĄCZNIE strukturalnie, patrz docstring pkt (4). ---
  const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
  assert('(4) formuła z-index: isPreBattleOpen() ma pierwszeństwo, wartość 9950 niezmieniona',
    /hintToast\.style\.zIndex\s*=\s*isPreBattleOpen\(\)\s*\?\s*'9950'\s*:\s*\(\(isMainMenuOpen\(\)\s*\|\|\s*isEmpireDetailPanelOpen\(\)\)\s*\?\s*'600'\s*:\s*'320'\)\s*;/
      .test(mainSrc));

  console.log('[hint-toast-zindex-empire-panel-test] budowanie bundla AFTER (bieżący main.ts z naprawą)...');
  buildBundle(OUT_AFTER);
  console.log('[hint-toast-zindex-empire-panel-test] budowanie bundla BEFORE (main.ts z origin/main, bez naprawy)...');
  buildBeforeBundle();

  const { consoleErrors: beforeErrors, luminance: beforeLuminance } = await scenarioPrzedNaprawa(chromium);
  const afterErrors = await scenarioPoNaprawie(chromium, beforeLuminance);
  void beforeErrors; void afterErrors;

  for (const d of [OUT_AFTER, OUT_BEFORE]) {
    try { fs.rmSync(d, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  }

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[hint-toast-zindex-empire-panel-test] błąd:', e);
  // Bezpieczne przywrócenie main.ts, gdyby błąd padł w trakcie podmiany BEFORE/AFTER.
  try {
    const cur = execSync('git diff --name-only -- src/main.ts', { cwd: GRA_DIR }).toString();
    if (cur.trim() === '' || true) { /* no-op: buildBeforeBundle already restores in finally */ }
  } catch (_) { /* nieistotne */ }
  for (const d of [OUT_AFTER, OUT_BEFORE]) {
    try { fs.rmSync(d, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  }
  process.exit(1);
});
