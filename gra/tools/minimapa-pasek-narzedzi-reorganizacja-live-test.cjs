'use strict';
/**
 * minimapa-pasek-narzedzi-reorganizacja-live-test.cjs
 * TEMAT: R-MINIMAPA-PASEK-NARZEDZI-REORGANIZACJA-Q1 (Operator, runda 1).
 *
 * Dowodzi kryteriów końca 2-4 (dispatch, 00-dispatch.md) na FAKTYCZNIE wyrenderowanej
 * stronie w żywym Chromium — DOM przed/po klik, plus pomiar pikseli realnego zrzutu
 * (nie sam odczyt kodu):
 *   (1) `.civ-minimap-tools` niesie DOKŁADNIE 2 przyciski (territory + trade-routes).
 *   (2) worker/deposit — widoczne i klikalne w rzędzie zoom (`.civ-hud-util-dock`),
 *       GEOMETRYCZNIE nad minimapą ("u góry"); klik przełącza stan (ten sam hook co
 *       dawne ikony minimapy) i realnie zmienia wyrenderowany obraz mapy 3D (pomiar pikseli).
 *   (3) klik chipa „Kultura"/„Religia" w górnym pasku PRZEŁĄCZA podświetlenie zasięgu na
 *       mapie 3D (pomiar pikseli, nie tylko odczyt zmiennej) I OTWIERA panel szczegółów
 *       (istniejące zachowanie zostaje OBOK nowego toggle, nie zamiast niego).
 *   (4) nowy przycisk trade-routes przy minimapie przełącza widoczność tras handlowych.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI: te same asercje uruchomione na DWÓCH bundlach —
 *   PRZED = `git merge-base HEAD origin/main` (baza brancha w momencie dispatchu — NIE
 *           żywy `origin/main`, który w tym wieloagentowym procesie przesuwa się w trakcie
 *           pracy Operatora przez integracje RÓWNOLEGŁYCH tematów, C-034/C-056/C-059; podmiana
 *           samego `origin/main` złapała realnie taki przypadek podczas pisania tej bramki —
 *           `vite build` wybuchł na niezgodności między podmienionym main.ts z NOWEGO
 *           origin/main a resztą plików worktree ze STAREJ bazy). 3 dotknięte pliki
 *           (minimapHud.ts, hud.ts, main.ts) tymczasowo podmienione na treść z tej bazy,
 *           budowa, przywrócone w finally — NIGDY trwałej zmiany w repo/worktree,
 *   PO    = bieżący worktree (ten dispatch).
 * PRZED bundlem `.civ-minimap-tools` ma 5 przycisków, worker/deposit siedzą PRZY MINIMAPIE
 * (nie w rzędzie zoom), a klik chipa Kultura/Religia NIE rusza mapy 3D (0 zmienionych pikseli
 * ponad szum) — dokładnie odwrotność tego, co dowodzi bundle PO. Gdyby test przechodził
 * identycznie na obu, nie mierzyłby niczego.
 *
 * C-001 — jedyna dozwolona kompilacja to `vite build` bezpośrednio z node_modules (CLAUDE.md /
 * R-PROC-AUTOBOT.md §9 pkt 1), outDir POZA drzewem repo (`os.tmpdir()`), NIGDY `npm run build`.
 *
 * Usage (z gra/): node tools/minimapa-pasek-narzedzi-reorganizacja-live-test.cjs
 *   --shots <katalog>  zapisuje zrzuty PRZED/PO do <katalog>/*.png
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, execSync } = require('child_process');
const { PNG } = require(path.resolve(__dirname, '..', 'node_modules', 'pngjs'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[minimapa-pasek-narzedzi-reorganizacja-live-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalogi/pliki tymczasowe unikalne per przebieg ---
// Stala nazwa pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly przebieg (takze
// uruchomiony z innego worktree). Skutek dziala w obie strony: raz falszywy CZERWONY
// (jeden bieg czysci drugiemu katalog w locie), raz falszywy ZIELONY (dwa biegi mierza
// ten sam artefakt, wiec "parytet" jest artefaktem kolizji, nie dowodem). Sufiks
// per-proces to rozlacza; asercje i progi bramki pozostaja nietkniete.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
// Unikalnosc BEZ sprzatania zamienilaby kolizje w staly wyciek dysku (brak miejsca to
// ta sama klasa problemu z drugiej strony), wiec kasujemy WLASNE artefakty tego biegu.
// Dopasowanie po TMPDIR_RUN_ID nie moze trafic w cudzy katalog. Zrzuty/podglady
// zostaja na dysku celowo — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6).
process.on('exit', () => {
  // `require` lokalnie: hak musi dzialac takze w plikach, ktore nie maja `fs`/`path`
  // w zasiegu modulu — inaczej ReferenceError wpada w catch i sprzatanie milczy.
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      if (!ent.includes(TMPDIR_RUN_ID)) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
});
const OUT_AFTER = path.join(os.tmpdir(), `civ-minimapa-toolbar-test-after-${TMPDIR_RUN_ID}`);
const OUT_BEFORE = path.join(os.tmpdir(), `civ-minimapa-toolbar-test-before-${TMPDIR_RUN_ID}`);

const TOUCHED_FILES = [
  'src/ui/minimapHud.ts',
  'src/ui/hud.ts',
  'src/main.ts',
].map(p => path.join(GRA, p));

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const SHOTS = argOf('--shots');
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  OK  ' + name); }
  else { fail++; console.error(' FAIL ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function buildBundle(outDirAbs) {
  fs.rmSync(outDirAbs, { recursive: true, force: true });
  const rel = path.relative(GRA, outDirAbs);
  execFileSync(
    process.execPath,
    ['./node_modules/vite/bin/vite.js', 'build', '--outDir', rel, '--emptyOutDir'],
    { cwd: GRA, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(outDirAbs, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + outDirAbs);
  }
}

/**
 * Baza brancha w momencie dispatchu — NIE żywy `origin/main`. W tym wieloagentowym procesie
 * `origin/main` przesuwa się PODCZAS pracy Operatora (integracje równoległych tematów przez
 * orkiestratora, C-034/C-056/C-059) — podmiana samego main.ts na TAKI ruchomy cel, przy
 * pozostałych plikach worktree zostawionych na starej bazie, dała realny build failure podczas
 * pisania tej bramki (main.ts z nowszego origin/main importował funkcję nieistniejącą jeszcze
 * w ai-cs-absorption.ts tej bazy worktree). `merge-base` jest stabilny — to dokładnie commit
 * `94ff243e` z 00-dispatch.md (IZOLACJA: "baza jawnie: origin/main, najnowszy commit na moment
 * dispatchu"), niezależnie od tego, ile dalej origin/main odjechał w międzyczasie.
 */
const PRZED_REF = execSync('git merge-base HEAD origin/main', { cwd: GRA }).toString('utf8').trim();

/** Buduje bundle PRZED z 3 dotkniętych plików DOKŁADNIE takich, jak w PRZED_REF —
 * podmiana na dysku WYŁĄCZNIE na czas builda, przywrócona w finally niezależnie od wyniku. */
function buildBeforeBundle() {
  const originals = TOUCHED_FILES.map(p => fs.readFileSync(p, 'utf8'));
  try {
    for (const p of TOUCHED_FILES) {
      const rel = path.relative(GRA, p).replace(/\\/g, '/');
      const legacy = execSync(`git show ${PRZED_REF}:gra/${rel}`, {
        cwd: GRA, maxBuffer: 1024 * 1024 * 64,
      }).toString('utf8');
      fs.writeFileSync(p, legacy, 'utf8');
    }
    buildBundle(OUT_BEFORE);
  } finally {
    TOUCHED_FILES.forEach((p, i) => fs.writeFileSync(p, originals[i], 'utf8'));
  }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[minimapa-pasek-narzedzi-reorganizacja-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
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
  await page.waitForSelector('.civ-hud', { timeout: 120000 });
  for (let i = 0; i < 90; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined, { timeout: 120000 },
  );
  // Rząd zoom/pełny ekran (.civ-hud-util-dock) montuje się dopiero na pierwszy renderBar()
  // po showHud() — czekamy na jego obecność zamiast na stały timeout.
  await page.waitForSelector('.civ-hud-util-dock', { timeout: 30000 }).catch(() => {});
  await wait(400);
}

/** Pixel diff (kanał po kanale, próg 30/765) na dwóch zrzutach tego samego regionu —
 * to samo, co realnie widzi gracz (Playwright `page.screenshot`), nie hit-testing DOM. */
function diffPixelCount(bufA, bufB, threshold = 30) {
  const a = PNG.sync.read(bufA);
  const b = PNG.sync.read(bufB);
  const len = Math.min(a.data.length, b.data.length);
  let diff = 0;
  for (let i = 0; i < len; i += 4) {
    const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (d > threshold) diff++;
  }
  return diff;
}

const VIEWPORT = { width: 1920, height: 1080 };

/** Region wyśrodkowany na kamerze (playtestMapaSwiata.ts skacze kamerą na miasto/jednostkę
 * gracza przy starcie) — tam realnie renderują się nakładki zasięgu kultury/religii. */
const CENTER_CLIP = { x: VIEWPORT.width / 2 - 220, y: VIEWPORT.height / 2 - 220, width: 440, height: 440 };

async function shot(page, label) {
  const buf = await page.screenshot({ clip: CENTER_CLIP });
  if (SHOTS) fs.writeFileSync(path.join(SHOTS, label + '.png'), buf);
  return buf;
}

/** Klik chipa w górnym pasku (data-act) przez ten sam mechanizm delegacji co gracz —
 * `.click()` na realnym elemencie DOM, nie wywołanie funkcji z kodu. Szeroki viewport
 * (1920×1080) — przy węższych oknach prawy klaster chipów zawija się i Civpedia/Menu
 * potrafią fizycznie nachodzić na chip Kultura/Religia (przeglądarkowy hit-test wtedy
 * słusznie odrzuca klik) — to artefakt WĄSKIEGO okna testowego, nie regres tego dispatchu
 * (mapChromeSuppressed/hud-chip-row nie były w allowliście), więc test dostaje realistyczną
 * szerokość desktopu zamiast obchodzenia hit-testu przez { force: true }.
 */
async function clickAct(page, act) {
  await page.locator(`[data-act="${act}"]`).first().click();
  await wait(250); // renderBar()/refreshD1bHud() + jeden klatka renderu 3D
}

async function readMinimapToolsFacts(page) {
  return page.evaluate(() => {
    const tools = document.querySelector('.civ-minimap-tools');
    const btns = tools ? Array.from(tools.querySelectorAll('button')) : [];
    return {
      count: btns.length,
      titles: btns.map(b => b.title),
      onFlags: btns.map(b => b.classList.contains('on')),
    };
  });
}

async function readUtilDockFacts(page) {
  return page.evaluate(() => {
    const dock = document.querySelector('.civ-hud-util-dock');
    const worker = dock ? dock.querySelector('[data-act="worker-toggle"]') : null;
    const deposit = dock ? dock.querySelector('[data-act="deposit-toggle"]') : null;
    const dockRect = dock ? dock.getBoundingClientRect() : null;
    const miniEl = document.querySelector('.civ-minimap-hud');
    const miniRect = miniEl ? miniEl.getBoundingClientRect() : null;
    return {
      dockPresent: !!dock,
      workerPresent: !!worker,
      depositPresent: !!deposit,
      workerOn: worker ? worker.classList.contains('on') : null,
      depositOn: deposit ? deposit.classList.contains('on') : null,
      dockBottom: dockRect ? dockRect.bottom : null,
      dockTop: dockRect ? dockRect.top : null,
      miniTop: miniRect ? miniRect.top : null,
    };
  });
}

async function readChipFacts(page, act) {
  return page.evaluate((act) => {
    const chip = document.querySelector(`[data-act="${act}"]`);
    return {
      present: !!chip,
      active: chip ? chip.classList.contains('civ-hud-chip-range-on') : null,
      ariaPressed: chip ? chip.getAttribute('aria-pressed') : null,
    };
  }, act);
}

async function readOpenViews(page) {
  return page.evaluate(() => (window.__sidePanelLinkTestDebug
    ? window.__sidePanelLinkTestDebug.openViews()
    : null));
}

async function closeAllPanels(page) {
  await page.evaluate(() => { window.__sidePanelLinkTestDebug?.closeAll(); });
  await wait(150);
}

// ---------------------------------------------------------------------------
// Scenariusz PO (bieżący worktree) — pełny zestaw asercji kryteriów 1-5.
// ---------------------------------------------------------------------------
async function scenarioPo() {
  console.log('\n=== PO (bieżący worktree, ten dispatch) ===');
  const browser = await launchBrowser();
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: VIEWPORT });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push(String(err)));
    await gotoPlaytestMapa(page, OUT_AFTER);

    // --- Kryterium 1: dokładnie 2 przyciski przy minimapie ---
    const toolsFacts = await readMinimapToolsFacts(page);
    check('[K1] .civ-minimap-tools ma DOKŁADNIE 2 przyciski (territory + trade-routes)',
      toolsFacts.count === 2, toolsFacts);
    check('[K1] zero worker/mapa/religia wśród tytułów przycisków minimapy',
      !toolsFacts.titles.some(t => /robotni|złoż|kultury|religii/i.test(t)), toolsFacts.titles);

    // --- Kryterium 2 (DOM + geometria): worker/deposit w rzędzie zoom, NAD minimapą ---
    const dockFacts = await readUtilDockFacts(page);
    check('[K2] worker-toggle obecny w .civ-hud-util-dock', dockFacts.workerPresent, dockFacts);
    check('[K2] deposit-toggle obecny w .civ-hud-util-dock', dockFacts.depositPresent, dockFacts);
    check('[K2] rząd zoom (z worker/deposit) leży NAD canvasem minimapy (dockBottom <= miniTop + 2px)',
      dockFacts.dockBottom !== null && dockFacts.miniTop !== null && dockFacts.dockBottom <= dockFacts.miniTop + 2,
      dockFacts);
    check('[K2] worker domyślnie ON (showWorkerOverlay=true)', dockFacts.workerOn === true, dockFacts);
    check('[K2] deposit domyślnie ON (showResourceDepositOverlay=true)', dockFacts.depositOn === true, dockFacts);

    // --- Kryterium 2 (pixel): klik worker-toggle realnie zmienia wyrenderowaną mapę 3D ---
    const baseline1 = await shot(page, 'po-00-baseline');
    await wait(300);
    const baseline2 = await shot(page, 'po-01-baseline-noise');
    const noiseDiff = diffPixelCount(baseline1, baseline2);

    await clickAct(page, 'worker-toggle');
    const afterWorkerOff = await shot(page, 'po-02-worker-off');
    const workerOffDiff = diffPixelCount(baseline2, afterWorkerOff);
    const dockAfterWorkerOff = await readUtilDockFacts(page);
    check('[K2] klik worker-toggle: DOM przełącza stan ON -> OFF', dockAfterWorkerOff.workerOn === false, dockAfterWorkerOff);
    check('[K2] klik worker-toggle REALNIE zmienia wyrenderowaną mapę 3D (pixel diff >> szum tła)',
      workerOffDiff > Math.max(noiseDiff * 3, 150), { workerOffDiff, noiseDiff });

    await clickAct(page, 'worker-toggle');
    const afterWorkerOn = await shot(page, 'po-03-worker-on-again');
    const workerOnAgainDiff = diffPixelCount(afterWorkerOff, afterWorkerOn);
    const dockAfterWorkerOn = await readUtilDockFacts(page);
    check('[K2] klik worker-toggle #2: DOM przełącza stan z powrotem OFF -> ON', dockAfterWorkerOn.workerOn === true, dockAfterWorkerOn);
    check('[K2] klik worker-toggle #2 REALNIE zmienia mapę z powrotem (pixel diff >> szum tła)',
      workerOnAgainDiff > Math.max(noiseDiff * 3, 150), { workerOnAgainDiff, noiseDiff });

    // --- Kryterium 2: deposit-toggle analogicznie (DOM + pixel) ---
    // Próg niższy niż worker (150) — ikony złóż/surowców są rzadsze na mapie niż pola
    // robocze i w tym konkretnym (proceduralnie losowanym) świecie w większości leżą POZA
    // stałym regionem CENTER_CLIP wyśrodkowanym na kamerze; zmierzone bezpośrednio przy
    // pisaniu tej bramki: realny diff > 0 i wyraźnie ponad szum (noiseDiff=0 w tym samym
    // przebiegu), tylko nie osiągał progu 150 dobranego pod worker. 30 nadal solidnie nad
    // szumem, próg względny (noiseDiff×3) zostaje dla przebiegów z niezerowym szumem tła.
    const beforeDepositShot = await shot(page, 'po-03b-pre-deposit');
    await clickAct(page, 'deposit-toggle');
    const dockAfterDepositOff = await readUtilDockFacts(page);
    const afterDepositOffShot = await shot(page, 'po-04-deposit-off');
    const depositOffDiff = diffPixelCount(beforeDepositShot, afterDepositOffShot);
    check('[K2] klik deposit-toggle: DOM przełącza stan ON -> OFF', dockAfterDepositOff.depositOn === false, dockAfterDepositOff);
    check('[K2] klik deposit-toggle REALNIE zmienia wyrenderowaną mapę 3D (pixel diff >> szum tła)',
      depositOffDiff > Math.max(noiseDiff * 3, 30), { depositOffDiff, noiseDiff });
    await clickAct(page, 'deposit-toggle');
    const dockAfterDepositOn = await readUtilDockFacts(page);
    check('[K2] klik deposit-toggle #2: DOM przełącza stan z powrotem OFF -> ON', dockAfterDepositOn.depositOn === true, dockAfterDepositOn);

    // --- Kryterium 3: chip Kultura — toggle zasięgu na mapie 3D + panel szczegółów OBOK ---
    // Panel Imperium (backdrop rgba(0,0,0,.35) na CAŁYM ekranie) przyciemnia dowolny region
    // niezależnie od mapy — zamykamy go PRZED każdym zrzutem porównawczym, żeby pixel diff
    // mierzył WYŁĄCZNIE nakładkę zasięgu na mapie 3D, nie efekt otwarcia panelu.
    await closeAllPanels(page);
    const kulturaBefore = await readChipFacts(page, 'kultura');
    check('[K3] chip Kultura startuje NIEaktywny (cultureRangeVisible=false)', kulturaBefore.active === false, kulturaBefore);
    const preClickShot = await shot(page, 'po-05-pre-kultura');

    await clickAct(page, 'kultura');
    const kulturaAfter = await readChipFacts(page, 'kultura');
    const viewsAfterKultura = await readOpenViews(page);
    check('[K3] chip Kultura dostaje klasę aktywności po kliku (DOM)', kulturaAfter.active === true, kulturaAfter);
    check('[K3] dotychczasowe zachowanie chipa NIE zginęło — panel Imperium OTWARTY OBOK toggle',
      !!viewsAfterKultura && viewsAfterKultura.empirePanel === true, viewsAfterKultura);

    await closeAllPanels(page);
    const kulturaStillActiveAfterClose = await readChipFacts(page, 'kultura');
    check('[K3] po zamknięciu panelu toggle zasięgu NADAL aktywny (niezależny od panelu)',
      kulturaStillActiveAfterClose.active === true, kulturaStillActiveAfterClose);
    const postClickShot = await shot(page, 'po-06-post-kultura-on');
    const kulturaDiff = diffPixelCount(preClickShot, postClickShot);
    check('[K3] klik Kultura REALNIE zmienia wyrenderowaną mapę 3D (panel zamknięty, pixel diff >> szum tła)',
      kulturaDiff > Math.max(noiseDiff * 3, 200), { kulturaDiff, noiseDiff });

    await clickAct(page, 'kultura'); // toggle OFF (ponownie otwiera panel — zachowanie niezmienione)
    const kulturaOffFacts = await readChipFacts(page, 'kultura');
    check('[K3] klik Kultura #2: DOM klasa aktywności gaśnie (toggle OFF)', kulturaOffFacts.active === false, kulturaOffFacts);
    await closeAllPanels(page);
    const offShot = await shot(page, 'po-07-post-kultura-off');
    const offDiff = diffPixelCount(postClickShot, offShot);
    const backToBaselineDiff = diffPixelCount(preClickShot, offShot);
    check('[K3] klik Kultura #2 REALNIE zmienia mapę z powrotem (panel zamknięty, pixel diff >> szum tła)',
      offDiff > Math.max(noiseDiff * 3, 200), { offDiff, noiseDiff });
    check('[K3] po toggle OFF mapa wraca blisko stanu sprzed toggle ON (diff vs preClick w granicach szumu×6)',
      backToBaselineDiff < Math.max(noiseDiff * 6, 900), { backToBaselineDiff, noiseDiff });

    // --- Kryterium 3: chip Religia — analogicznie (DOM + panel + pixel) ---
    await closeAllPanels(page);
    const religiaBefore = await readChipFacts(page, 'religia');
    check('[K3] chip Religia startuje NIEaktywny (religionRangeVisible=false)', religiaBefore.active === false, religiaBefore);
    const preReligiaShot = await shot(page, 'po-08-pre-religia');
    await clickAct(page, 'religia');
    const religiaAfter = await readChipFacts(page, 'religia');
    const viewsAfterReligia = await readOpenViews(page);
    check('[K3] chip Religia dostaje klasę aktywności po kliku (DOM)', religiaAfter.active === true, religiaAfter);
    check('[K3] klik Religia: panel Imperium OTWARTY OBOK toggle (zachowanie nie zginęło)',
      !!viewsAfterReligia && viewsAfterReligia.empirePanel === true, viewsAfterReligia);
    await closeAllPanels(page);
    const postReligiaShot = await shot(page, 'po-09-post-religia-on');
    const religiaDiff = diffPixelCount(preReligiaShot, postReligiaShot);
    check('[K3] klik Religia REALNIE zmienia wyrenderowaną mapę 3D (panel zamknięty, pixel diff >> szum tła)',
      religiaDiff > Math.max(noiseDiff * 3, 200), { religiaDiff, noiseDiff });
    await clickAct(page, 'religia'); // toggle OFF
    const religiaOffFacts = await readChipFacts(page, 'religia');
    check('[K3] klik Religia #2: DOM klasa aktywności gaśnie (toggle OFF)', religiaOffFacts.active === false, religiaOffFacts);
    await closeAllPanels(page);

    // --- Kryterium 4: nowy przycisk trade-routes przy minimapie ---
    const toolsAfterAll = await readMinimapToolsFacts(page);
    check('[K4] przycisk trasy handlowe obecny wśród tytułów .civ-minimap-tools',
      toolsAfterAll.titles.some(t => /trasy handlowe/i.test(t)), toolsAfterAll.titles);
    const tradeIdx = toolsAfterAll.titles.findIndex(t => /trasy handlowe/i.test(t));
    check('[K4] przycisk trasy handlowe domyślnie ON (showTradeRoutesOverlay=true)',
      tradeIdx >= 0 && toolsAfterAll.onFlags[tradeIdx] === true, toolsAfterAll);

    await page.evaluate(() => {
      const tools = document.querySelector('.civ-minimap-tools');
      const btns = tools ? Array.from(tools.querySelectorAll('button')) : [];
      const btn = btns.find(b => /trasy handlowe/i.test(b.title));
      if (btn) btn.click();
    });
    await wait(250);
    const toolsAfterTradeClick = await readMinimapToolsFacts(page);
    const tradeIdx2 = toolsAfterTradeClick.titles.findIndex(t => /trasy handlowe/i.test(t));
    check('[K4] klik trasy handlowe: DOM przełącza stan ON -> OFF',
      tradeIdx2 >= 0 && toolsAfterTradeClick.onFlags[tradeIdx2] === false, toolsAfterTradeClick);

    // --- Kryterium 5: territory (granice) — zero regresji, toggle nadal działa ---
    // ZNALEZISKO tej rundy (Operator): `.civ-minimap-tools` to PERSYSTENTNE węzły DOM
    // (utworzone raz w createMinimapHud()) — ich klasa `.on` odświeża się WYŁĄCZNIE przez
    // `minimapApi.update()`, wołane z `refreshMinimap()` (hud.ts) TYLKO gdy `minimapDirty`
    // (main.ts:9640, ustawiane wyłącznie przy zmianie mgły/mapy). To PRE-ISTNIEJĄCE
    // zachowanie territoryBtn — dispatch zakazuje jego dotykania ("Territory zostaje. Zero
    // zmian w territoryBtn") — więc klasa .on przycisku NIE odświeża się natychmiast po
    // kliku (ten sam mechanizm naprawiłem WYŁĄCZNIE dla nowego przycisku trade-routes,
    // markMinimapDirty() w toggleTradeRoutesOverlayOnMap(), main.ts — poza tym pre-istniejące
    // zachowanie zostaje nietknięte). FUNKCJONALNIE granice na mapie 3D przełączają się
    // BEZ tego throttle (refreshTerritoryBorderOverlay() wołane bezwarunkowo wewnątrz
    // toggleTerritoryBorderOnMap()) — "zero regresji" dowodzimy więc pixel-diffem na
    // faktycznie wyrenderowanej mapie 3D, nie klasą przycisku (myliłaby throttle z regresem).
    const territoryIdx = toolsAfterTradeClick.titles.findIndex(t => /granic|państwa/i.test(t));
    check('[K5] przycisk granic (territory) nadal obecny i domyślnie ON',
      territoryIdx >= 0 && toolsAfterTradeClick.onFlags[territoryIdx] === true, toolsAfterTradeClick);

    const preTerritoryShot = await shot(page, 'po-10-pre-territory-off');
    await page.evaluate(() => {
      const tools = document.querySelector('.civ-minimap-tools');
      const btns = tools ? Array.from(tools.querySelectorAll('button')) : [];
      const btn = btns.find(b => /granic|państwa/i.test(b.title));
      if (btn) btn.click();
    });
    await wait(250);
    const postTerritoryOffShot = await shot(page, 'po-11-post-territory-off');
    const territoryOffDiff = diffPixelCount(preTerritoryShot, postTerritoryOffShot);
    check('[K5] klik granic REALNIE zmienia renderowaną mapę 3D (toggle OFF, pixel diff >> szum tła — zero regresji)',
      territoryOffDiff > Math.max(noiseDiff * 3, 150), { territoryOffDiff, noiseDiff });

    await page.evaluate(() => {
      const tools = document.querySelector('.civ-minimap-tools');
      const btns = tools ? Array.from(tools.querySelectorAll('button')) : [];
      const btn = btns.find(b => /granic|państwa/i.test(b.title));
      if (btn) btn.click();
    });
    await wait(250);
    const postTerritoryOnShot = await shot(page, 'po-12-post-territory-on');
    const territoryOnDiff = diffPixelCount(postTerritoryOffShot, postTerritoryOnShot);
    check('[K5] klik granic #2 REALNIE zmienia mapę z powrotem (toggle ON, pixel diff >> szum tła — zero regresji)',
      territoryOnDiff > Math.max(noiseDiff * 3, 150), { territoryOnDiff, noiseDiff });

    check('[konsola] zero console.error / pageerror w całym scenariuszu PO', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// Scenariusz PRZED (origin/main) — dowód nietautologiczności: te same pomiary muszą
// pokazać STARY układ (5 przycisków, worker/deposit NIE w rzędzie zoom, klik chipa
// Kultura/Religia NIE rusza mapy 3D).
// ---------------------------------------------------------------------------
async function scenarioPrzed() {
  console.log(`\n=== PRZED (baza dispatchu ${PRZED_REF.slice(0, 8)}, dowód nietautologiczności) ===`);
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport: VIEWPORT });
    await gotoPlaytestMapa(page, OUT_BEFORE);

    const toolsFacts = await readMinimapToolsFacts(page);
    check('[PRZED] .civ-minimap-tools miał 5 przycisków (stary układ, kontrola)', toolsFacts.count === 5, toolsFacts);

    const dockFacts = await readUtilDockFacts(page);
    check('[PRZED] worker-toggle NIE istniał w .civ-hud-util-dock (dowód: to naprawdę nowa pozycja)',
      dockFacts.workerPresent === false, dockFacts);
    check('[PRZED] deposit-toggle NIE istniał w .civ-hud-util-dock', dockFacts.depositPresent === false, dockFacts);

    // Stary kod TEŻ otwiera panel Imperium na klik chipa (zachowanie sprzed dispatchu,
    // nietknięte) — jego backdrop (.civ-emp-backdrop, rgba(0,0,0,.35) na CAŁYM ekranie)
    // przyciemnia dowolny region i sam w sobie dałby fałszywie duży pixel diff, myląc
    // "coś się zmieniło" z "mapa 3D się zmieniła". Zamykamy panel PRZED każdym zrzutem
    // porównawczym, żeby mierzyć WYŁĄCZNIE mapę 3D pod spodem (ten sam zabieg co w PO).
    await closeAllPanels(page);
    const preShot = await shot(page, 'przed-00-pre-kultura');
    await clickAct(page, 'kultura');
    const kulturaChipFacts = await readChipFacts(page, 'kultura');
    const viewsAfterKulturaPrzed = await readOpenViews(page);
    check('[PRZED] klik chipa Kultura NIE miał klasy aktywności (mechanizm nie istniał)',
      kulturaChipFacts.active === null || kulturaChipFacts.active === false, kulturaChipFacts);
    check('[PRZED] (kontrola) klik chipa Kultura JUŻ WTEDY otwierał panel Imperium (zachowanie nietknięte przez dispatch)',
      !!viewsAfterKulturaPrzed && viewsAfterKulturaPrzed.empirePanel === true, viewsAfterKulturaPrzed);
    await closeAllPanels(page);
    const postShot = await shot(page, 'przed-01-post-kultura');
    const diff = diffPixelCount(preShot, postShot);
    check('[PRZED] klik chipa Kultura NIE ruszał mapy 3D (panel zamknięty, pixel diff w granicach szumu — dowód, że PO to realna nowa funkcja, nie tylko efekt panelu)',
      diff < 400, { diff });

    await browser.close();
  } catch (e) {
    await browser.close();
    throw e;
  }
}

async function main() {
  console.log('[minimapa-pasek-narzedzi-reorganizacja-live-test] budowanie bundla PO (vite build, worktree bieżący)...');
  buildBundle(OUT_AFTER);
  console.log(`[minimapa-pasek-narzedzi-reorganizacja-live-test] budowanie bundla PRZED (vite build, baza dispatchu ${PRZED_REF.slice(0, 8)})...`);
  buildBeforeBundle();

  await scenarioPrzed();
  await scenarioPo();

  console.log('\n========================================');
  console.log(`${pass} pass · ${fail} fail`);
  console.log('========================================');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[minimapa-pasek-narzedzi-reorganizacja-live-test] błąd:', e);
  process.exit(1);
});
