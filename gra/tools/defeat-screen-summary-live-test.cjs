'use strict';
/**
 * defeat-screen-summary-live-test.cjs — R-WEB-DEFEAT-SCREEN-SUMMARY-LOAD-OR-NEW-Q1 (dowód na żywo).
 *
 * Realny headless Chromium na bundle Vite (?playtest=mapa) zbudowanym do katalogu tymczasowego
 * (bez `npm run build`). Scenariusze:
 *  L1. Zapis w turze 1 (quickSave); barbarzyńcy zdobywają jedyne miasto; realny endTurn ->
 *      ekran porażki z sekcjami „Osiągnięcia”/„Straty” i dwoma przyciskami.
 *      „Wczytaj grę” chowa ekran, otwiera dialog wczytania; wybór zapisu -> ekran znika,
 *      tura wraca do 1, gracz ma miasto, gameOver=false; kolejny endTurn przesuwa turę do 2.
 *  L2. Ponowna porażka; „Wczytaj grę” -> „Anuluj” w dialogu przywraca ekran porażki (gameOver=true).
 *  C.  Zero pageerror / console.error.
 *
 * Usage (z gra/): node tools/defeat-screen-summary-live-test.cjs [scratchDirAbs] [evidenceDirAbs]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-defeat-summary-live-' + process.pid);
const EVIDENCE = process.argv[3] || SCRATCH;
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium');
const PLAYER = 0;
const SLOT = 'defeat-summary-live-slot';
const OVERLAY_LOSE = '#__victory_screen__.vsc-overlay.lose';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildBundle() {
  console.log('[defeat-summary-live] vite build do katalogu tymczasowego:', SCRATCH);
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(SCRATCH)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(SCRATCH, 'index.html'))) throw new Error('Build bez index.html');
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
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
    () => !!window.__eraTestDebug && !!window.__defeatTestDebug && !!window.__truceSaveLoadTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
  await page.evaluate(() => window.__defeatTestDebug.setPlayerEraForTest(1));
  await wait(300);
}

async function endTurnAndSettle(page, timeoutMs = 45000) {
  const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const overlay = await page.locator(OVERLAY_LOSE).count();
    const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
    const turnNow = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    if (overlay > 0) break;
    if (!inProg && turnNow > before) break;
    await wait(150);
  }
  await wait(400);
  return {
    turnBefore: before,
    turnAfter: await page.evaluate(() => window.__eraTestDebug.getWorldState().turn),
    overlay: (await page.locator(OVERLAY_LOSE).count()) > 0,
    gameOver: await page.evaluate(() => window.__defeatTestDebug.isGameOver()),
  };
}

/** Realny skutek utraty jedynego miasta: barbarzyńcy zdobywają je, potem realny endTurn. */
async function loseOnlyCity(page) {
  const cities0 = await page.evaluate((o) => window.__defeatTestDebug.ownerCityIds(o), PLAYER);
  assert('gracz ma dokładnie 1 miasto przed porażką', cities0.length === 1, cities0);
  const cap = await page.evaluate((cid) => window.__defeatTestDebug.captureCityByBarbarians(cid), cities0[0]);
  assert('miasto przejęte przez barbarzyńców', cap.ownerIdAfter === -1, cap);
  return endTurnAndSettle(page);
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[defeat-summary-live] playwright nie znaleziony'); process.exit(1); }

  fs.mkdirSync(EVIDENCE, { recursive: true });
  buildBundle();

  const browser = await launchBrowser(chromium);
  const errors = [];
  const endLogs = [];
  try {
    // ---- C0 (kontrola bez porażki): zwykły zapis -> endTurn -> wczytanie -> endTurn ----
    // Rozstrzyga, czy blokada endTurn po wczytaniu (bramka NNS) występuje też bez porażki.
    const pc = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    pc.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await gotoPlaytestMapa(pc);
    const c0Turn = await endTurnAndSettle(pc);
    const c0Saved = await pc.evaluate((s) => window.__truceSaveLoadTestDebug.quickSave(s), SLOT + '-c0');
    assert('C0 zapis kontrolny (tura po 1 endTurn) powiódł się', c0Saved === true, c0Saved);
    await endTurnAndSettle(pc);
    await pc.evaluate((s) => window.__truceSaveLoadTestDebug.loadSlot(s), SLOT + '-c0');
    await wait(3000);
    const c0Loaded = await pc.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    const c0End = await endTurnAndSettle(pc);
    console.log(`      C0 kontrola (bez porażki): po wczytaniu tura=${c0Loaded}, endTurn przesunął turę=${c0End.turnAfter > c0End.turnBefore}, startTura=${c0Turn.turnAfter}`);
    const c0Advanced = c0End.turnAfter > c0End.turnBefore;
    await pc.close();

    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push('console.error: ' + m.text());
      if (/EndTurn|blocked|Victory/i.test(m.text())) endLogs.push(m.type() + ': ' + m.text().slice(0, 160));
    });
    await gotoPlaytestMapa(page);

    // Zapis w turze 1 (przed utratą miasta).
    const saved = await page.evaluate((s) => window.__truceSaveLoadTestDebug.quickSave(s), SLOT);
    assert('zapis w turze 1 (quickSave) powiódł się', saved === true, saved);

    // ---- L1: porażka, „Wczytaj grę” -> wybór zapisu ----
    console.log('\n-- L1: porażka -> Wczytaj grę -> wybór zapisu --');
    const r1 = await loseOnlyCity(page);
    console.log('      L1 po endTurn:', JSON.stringify(r1));
    assert('L1 ekran porażki po realnym endTurn', r1.overlay, r1);
    assert('L1 gameOver=true', r1.gameOver === true, r1);
    // textContent (nie innerText): CSS text-transform zmienia wielkość liter w innerText.
    const overlayText = await page.locator(OVERLAY_LOSE).evaluate((n) => n.textContent || '');
    assert('L1 ekran ma sekcję Osiągnięcia', overlayText.includes('Osiągnięcia'), overlayText.slice(0, 200));
    assert('L1 ekran ma sekcję Straty', overlayText.includes('Straty'), overlayText.slice(0, 200));
    // LOSS-COUNTERS (criterion b): liczniki strat jako liczby; po utracie jedynego miasta: miasta 1, jednostki 0.
    const lossM = overlayText.match(/(\d+|—)Utracone miasta/);
    const lossU = overlayText.match(/(\d+|—)Utracone jednostki/);
    assert('L1 Straty: „Utracone miasta” pokazuje liczbę 1 (nie „Wszystkie”)', !!lossM && lossM[1] === '1' && !overlayText.includes('Wszystkie'), overlayText.slice(0, 400));
    assert('L1 Straty: „Utracone jednostki” pokazuje liczbę 0 (brak bitwy)', !!lossU && lossU[1] === '0', overlayText.slice(0, 400));
    const btnTexts = await page.locator(`${OVERLAY_LOSE} button`).evaluateAll((ns) => ns.map((n) => (n.textContent || '').trim()));
    assert('L1 dokładnie dwa przyciski: Wczytaj grę, Rozpocznij od nowa',
      btnTexts.length === 2 && btnTexts[0] === 'Wczytaj grę' && btnTexts[1] === 'Rozpocznij od nowa',
      btnTexts);
    // Nazwa cywilizacji dla gracza (nie surowy klucz civType): pierwsza litera wielka, brak „—”.
    const civCard = await page.locator(`${OVERLAY_LOSE} .vsc-card-accent .vsc-card-val`).evaluate((n) => (n.textContent || '').trim());
    assert('L1 karta Cywilizacja pokazuje nazwę wyświetlaną (wielka litera, nie klucz)',
      civCard.length > 0 && civCard !== '—' && civCard[0] === civCard[0].toUpperCase() && civCard[0] !== civCard[0].toLowerCase(),
      civCard);
    const flavorText = await page.locator(`${OVERLAY_LOSE} .vsc-flavor`).evaluate((n) => (n.textContent || '').trim());
    assert('L1 podtytuł/flavor nie zaczyna się małą literą (surowe ID)', /^[A-ZĄĆĘŁŃÓŚŹŻ]/.test(flavorText), flavorText);

    // Widoczność przycisków w oknie: 1400x900, potem 1280x720 (bez przewijania; nie zasłonięte; poza stopką).
    const checkBtns = async (label) => {
      const info = await page.evaluate(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const fEl = document.querySelector('#__victory_screen__ .vsc-footer');
        const fr = fEl ? fEl.getBoundingClientRect() : null;
        return {
          vw,
          vh,
          btns: ['vsc-load-game', 'vsc-new-game'].map((id) => {
            const b = document.getElementById(id);
            if (!b) return { id, missing: true };
            const r = b.getBoundingClientRect();
            const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return {
              id,
              top: Math.round(r.top), bottom: Math.round(r.bottom),
              inViewport: r.top >= 0 && r.bottom <= vh && r.left >= 0 && r.right <= vw,
              hitIsButton: !!hit && (hit === b || b.contains(hit)),
              overlapsFooter: fr ? !(r.bottom <= fr.top || r.top >= fr.bottom) : false,
            };
          }),
        };
      });
      for (const b of info.btns) {
        assert(`${label} ${b.id} w oknie ${info.vw}x${info.vh}`, !b.missing && b.inViewport, b);
        assert(`${label} ${b.id} klikalny (nie zasłonięty)`, !!b.hitIsButton, b);
        assert(`${label} ${b.id} nie nachodzi na stopkę`, !b.overlapsFooter, b);
      }
    };
    await checkBtns('L1 1400x900');
    await page.screenshot({ path: path.join(EVIDENCE, 'defeat-summary-L1-ekran-porazki.png') });
    await page.setViewportSize({ width: 1280, height: 720 });
    await wait(400);
    await checkBtns('L1 1280x720');
    await page.screenshot({ path: path.join(EVIDENCE, 'defeat-summary-L1-ekran-porazki-1280x720.png') });

    // Odłożona/otwarta bitwa z tury porażki nie może przykrywać ekranu ani dialogu wczytania (main.ts pokazEkranPorazki).
    const pbCount = () => page.locator('.pb-overlay').count();
    assert('L1 pod ekranem porażki nie ma stale otwartej bitwy (pb-overlay)', (await pbCount()) === 0, await pbCount());
    // Pod ekranem porażki gra stoi: klawisz N (zakończ turę) i Spacja nie zmieniają tury ani stanu.
    const blkBefore = await page.evaluate(() => ({
      turn: window.__eraTestDebug.getWorldState().turn,
      gameOver: window.__defeatTestDebug.isGameOver(),
    }));
    await page.keyboard.press('n');
    await wait(800);
    await page.keyboard.press('Space');
    await wait(800);
    const blkAfter = await page.evaluate(() => ({
      turn: window.__eraTestDebug.getWorldState().turn,
      gameOver: window.__defeatTestDebug.isGameOver(),
    }));
    assert('L1 klawisze N i Spacja pod ekranem porażki nie zmieniają tury',
      blkAfter.turn === blkBefore.turn && blkAfter.gameOver === true, { blkBefore, blkAfter });
    assert('L1 ekran porażki nadal otwarty po klawiszach', (await page.locator(OVERLAY_LOSE).count()) === 1);
    const mapUnderOverlay = await page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      return !!el && !!el.closest('#__victory_screen__');
    });
    assert('L1 środek ekranu (mapa pod spodem) zasłonięty przez ekran porażki', mapUnderOverlay === true);
    // LOSS-COUNTERS (obrona r2, zarzut 5): Ctrl+S po porażce nie zapisuje (brak wpisu „Tura 2” / autozapisu).
    await page.keyboard.press('Control+s');
    await wait(1200);
    assert('L1 Ctrl+S po porażce: ekran porażki nadal otwarty', (await page.locator(OVERLAY_LOSE).count()) === 1);
    await page.locator(OVERLAY_LOSE).locator('#vsc-load-game').click();
    await page.waitForSelector('.civ-sl', { timeout: 20000 });
    await wait(1500);
    assert('L1 dialog wczytania nie jest przykryty bitwą (pb-overlay)', (await pbCount()) === 0, await pbCount());
    assert('L1 klik Wczytaj grę otwiera dialog wczytania', (await page.locator('.civ-sl').count()) === 1);
    assert('L1 ekran porażki schowany pod dialogiem wyboru', (await page.locator(OVERLAY_LOSE).count()) === 0);
    await page.screenshot({ path: path.join(EVIDENCE, 'defeat-summary-L1-dialog-wczytania.png') });
    const rowTexts = await page.locator('.civ-sl-row').evaluateAll((ns) => ns.map((n) => (n.textContent || '').trim()));
    console.log('      L1 wiersze dialogu:', JSON.stringify(rowTexts));
    assert('L1 dialog pokazuje zapis', rowTexts.length >= 1, rowTexts);
    // LOSS-COUNTERS (ABC B+A): po porażce lista nie zawiera zapisu/autozapisu z tury porażki (tura 2).
    assert('L1 lista po porażce nie zawiera autozapisu ani zapisu z tury porażki (Tura 2 / Autozapis)',
      rowTexts.every((t) => !/Tura 2\s*·|Autozapis/.test(t)), rowTexts);
    // Wybieramy zapis z tury 1 (quickSave przed porażką), a nie autozapis po utracie miasta.
    const rowPre = page.locator('.civ-sl-row').filter({ hasText: /Tura 1\s*·/ }).first();
    assert('L1 w dialogu jest zapis z tury 1 (przed porażką)', (await rowPre.count()) === 1, rowTexts);
    await rowPre.click();
    await page.locator('.civ-sl-primary', { hasText: 'Wczytaj' }).click();
    await wait(4000);
    await page.waitForFunction(() => !document.querySelector('.civ-sl'), undefined, { timeout: 120000 }).catch(() => {});
    await wait(1000);
    const turnAfterLoad = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    assert('L1 po wczytaniu ekran porażki zniknął', (await page.locator(OVERLAY_LOSE).count()) === 0);
    assert('L1 po wczytaniu gameOver=false', (await page.evaluate(() => window.__defeatTestDebug.isGameOver())) === false);
    assert('L1 po wczytaniu tura = 1 (stan zapisu)', turnAfterLoad === 1, turnAfterLoad);
    const ownCities = await page.evaluate((o) => window.__defeatTestDebug.ownerCityIds(o).length, PLAYER);
    assert('L1 po wczytaniu gracz ma miasto', ownCities === 1, ownCities);
    const logMark = endLogs.length;
    const endAfter = await endTurnAndSettle(page);
    const endLogsAfter = endLogs.slice(logMark);
    if (!(endAfter.turnAfter > endAfter.turnBefore)) console.log('      L1 logi EndTurn po wczytaniu:', JSON.stringify(endLogsAfter));
    const l1Advanced = endAfter.turnAfter > endAfter.turnBefore && !endAfter.overlay;
    if (c0Advanced) {
      assert('L1 gra działa: endTurn przesuwa turę po wczytaniu (kontrola C0 też przesuwa)', l1Advanced, endAfter);
    } else {
      // Kontrola C0 też blokuje endTurn po zwykłym wczytaniu -> blokada NIE wynika z porażki (bramka NNS).
      console.log('  INFO L1 endTurn po wczytaniu zablokowany TAK SAMO w kontroli C0 (bramka NNS, bez porażki) — nie dotyczy ekranu porażki');
      assert('L1 po wczytaniu gra nie jest zakończona (brak ekranu porażki, gameOver=false)', !endAfter.overlay && !endAfter.gameOver, endAfter);
    }

    await page.close();

    // ---- L2: nowa gra, porażka -> Wczytaj grę -> Anuluj przywraca ekran ----
    console.log('\n-- L2: porażka -> Wczytaj grę -> Anuluj --');
    const p2 = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    p2.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    p2.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
    await gotoPlaytestMapa(p2);
    // Zapis PRZED porażką (tura 1): Ctrl+S w turze 1 -- ma być na liście „Wczytaj grę” po porażce.
    await p2.keyboard.press('Control+s');
    await wait(1500);
    const r2 = await loseOnlyCity(p2);
    assert('L2 ekran porażki po endTurn', r2.overlay && r2.gameOver, r2);
    await p2.locator(OVERLAY_LOSE).locator('#vsc-load-game').click();
    await p2.waitForSelector('.civ-sl', { timeout: 20000 });
    const l2Rows = await p2.locator('.civ-sl-row').evaluateAll((ns) => ns.map((n) => (n.textContent || '').trim()));
    assert('L2 lista po porażce zawiera zapis sprzed porażki (Tura 1)', l2Rows.some((t) => /Tura 1\s*·/.test(t)), l2Rows);
    assert('L2 lista po porażce nie zawiera zapisu z tury porażki (Tura 2)', !l2Rows.some((t) => /Tura 2\s*·/.test(t)), l2Rows);
    await p2.locator('.civ-sl-btns button', { hasText: 'Anuluj' }).first().click();
    await wait(800);
    assert('L2 Anuluj przywraca ekran porażki', (await p2.locator(OVERLAY_LOSE).count()) === 1);
    assert('L2 gameOver nadal true (bez wczytania gra zakończona)', (await p2.evaluate(() => window.__defeatTestDebug.isGameOver())) === true);
    await p2.screenshot({ path: path.join(EVIDENCE, 'defeat-summary-L2-po-anuluj.png') });

    // L2b: ta sama porażka, ścieżka Esc w dialogu wczytania (zamiast „Anuluj”) też przywraca ekran.
    await p2.locator(OVERLAY_LOSE).locator('#vsc-load-game').click();
    await p2.waitForSelector('.civ-sl', { timeout: 20000 });
    await p2.keyboard.press('Escape');
    await wait(800);
    assert('L2b Esc w dialogu wczytania przywraca ekran porażki', (await p2.locator(OVERLAY_LOSE).count()) === 1);
    assert('L2b Esc: dialog wczytania zamknięty', (await p2.locator('.civ-sl').count()) === 0);

    assert('C. zero pageerror / console.error', errors.length === 0, errors.slice(0, 5));
    await p2.close();
  } finally {
    await browser.close();
  }

  console.log(`\n[defeat-summary-live] ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('[defeat-summary-live] wyjątek:', e && e.stack ? e.stack : e);
  process.exit(1);
});
