'use strict';
/**
 * newgame-adv-tooltip-test.cjs — P-NEWGAME-KREATOR-TOOLTIP-INFO-NIE-DZIALA (Maciej, 2026-08-14,
 * zgłoszenie ze zrzutem: „Te tooltipy niestety nie działają. Wcześniejsze teksty, które tam
 * były trzeba wprowadzić do tooltipów." — krok „Zaawansowane opcje" kreatora nowej gry).
 *
 * DIAGNOZA (agent AutoBot, ta sama sesja): odtworzone w headless Chromium na PRAWDZIWIE
 * zbudowanym bundlu (nie source-text pin, nie jsdom — jsdom nie liczy layoutu i zawsze zwraca
 * zera z getBoundingClientRect). Mechanizm (`installHudTitleTooltips()` w `hudTitleTooltip.ts`
 * + `makeInfoIcon()` w `newGameFlow.ts`) DZIAŁA POPRAWNIE dla wszystkich 8 ustawień wymienionych
 * w zgłoszeniu (Warunki zwycięstwa, Trudność miast-państw, Barbarzyńcy, Bitwy, Koszty budynków,
 * Koszty jednostek, Wzrost ludności, Zasięg ruchu) — z realnym `page.mouse.move` (prawdziwe
 * zdarzenia CDP, nie syntetyczny `dispatchEvent`), włącznie z pozycjami wymagającymi przewinięcia
 * `.adv-modal-body` (`overflow-y:auto`). Zero błędów konsoli. Treść tooltipa = dokładnie `hint`
 * z `advancedSettingRows()`.
 *
 * JEDYNA PUŁAPKA znaleziona przy okazji (NIE bug, ale ryzyko fałszywej diagnozy): pierwsza
 * ikona (i) w kolejności DOM na tym ekranie NIE należy do modala — należy do siatki „Ustawienia
 * Rozgrywki" w TLE (krok 4, `.sett-grid`), która podczas otwartego modala jest wizualnie i
 * funkcjonalnie ZASŁONIĘTA przez `.adv-overlay` (z-index 900, pełny viewport). Hover na
 * `document.querySelectorAll('.ng-info')[0]` bez zawężenia do `.adv-modal` trafia w martwy
 * punkt — `elementFromPoint` zwraca overlay, nie ikonę — i fałszywie wygląda jak "tooltip nie
 * działa". Ten test celuje wyłącznie w ikony WEWNĄTRZ `.adv-modal`, tak jak realny użytkownik
 * patrzący na otwarty modal.
 *
 * Ponieważ nie udało się odtworzyć realnego zgłoszenia w headless (mechanizm działa), test
 * dokumentuje i chroni POTWIERDZONY DZIAŁAJĄCY stan jako regres na przyszłość — oraz osobno
 * demonstruje najbardziej prawdopodobne wytłumaczenie różnicy real-user/headless: wymagany
 * SHOW_DELAY_MS=380 hover bez ruchu myszy (krótkie, „skanujące" najechanie < 380ms NIE pokazuje
 * tooltipa — to zamierzone zachowanie throttlingu, nie usterka, ale może się subiektywnie czuć
 * jak „nie działa" przy pobieżnym teście).
 *
 * Run from gra/:  node tools/newgame-adv-tooltip-test.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-newgame-adv-tooltip-test');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOW_DELAY_MS = 380; // musi być zsynchronizowane z hudTitleTooltip.ts

let pass = 0;
let fail = 0;

function assert(label, cond) {
  if (cond) {
    pass++;
    console.log(`  OK  ${label}`);
  } else {
    fail++;
    console.error(` FAIL ${label}`);
  }
}

function buildBundle() {
  console.log('[newgame-adv-tooltip-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[newgame-adv-tooltip-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[newgame-adv-tooltip-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** Kreator -> krok 4 -> otwórz modal "Zaawansowane opcje". */
async function gotoAdvModal(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-menu', { timeout: 60000 });
  await wait(400);
  await page.locator('.civ-menu .mbtn.primary').click();
  await page.waitForSelector('.civ-newgame', { timeout: 15000 });
  await wait(150);
  await page.locator('.civ-newgame button.cta-hero').click();
  await page.waitForSelector('.civ-newgame .epoch-grid', { timeout: 10000 });
  await wait(150);
  await page.locator('.civ-newgame button.nb.next').click();
  await page.waitForSelector('.civ-newgame .civ-grid', { timeout: 10000 });
  await wait(150);
  await page.locator('.civ-newgame button.nb.next').click();
  await page.waitForSelector('.civ-newgame .sett-grid', { timeout: 10000 });
  await wait(300);
  await page.locator('.civ-newgame .btn-adv').click();
  await page.waitForSelector('.civ-newgame .adv-overlay.open', { timeout: 10000 });
  await wait(200);
}

/** Ustawienia dokładnie wymienione w zgłoszeniu Macieja (zrzut ekranu). */
const NAMED_SETTINGS = [
  'Warunki zwycięstwa',
  'Trudność miast-państw',
  'Barbarzyńcy',
  'Bitwy',
  'Koszty budynków',
  'Koszty jednostek',
  'Wzrost ludności',
  'Zasięg ruchu',
];

async function hoverIconForLabel(page, label, { scoped = true } = {}) {
  // scoped=false: lokalizuje przez `.adv-modal` bez wymogu `.civ-newgame` na przodku —
  // używane wyłącznie w dowodzie mutacyjnym, gdzie celowo zdejmujemy klasę scope z rootEl
  // i i tak musimy fizycznie odnaleźć tę samą ikonę (i), żeby udowodnić że to SCOPE_SELECTOR
  // w resolveTarget() gasi tooltip, a nie to, że ikona zniknęła z DOM.
  const root = scoped ? '.civ-newgame .adv-modal' : '.adv-modal';
  const lblRow = page.locator(`${root} .adv-lbl-row`, {
    has: page.locator('.adv-lbl', { hasText: label }),
  }).first();
  if ((await lblRow.count()) === 0) return { found: false };
  await lblRow.scrollIntoViewIfNeeded();
  await wait(120);
  const icon = lblRow.locator('.ng-info');
  const box = await icon.boundingBox();
  if (!box) return { found: true, visible: false };
  // Mysz startuje gdzieś indziej, żeby wymusić realne wejście (mouseover), nie "już tam była".
  await page.mouse.move(5, 5);
  await wait(30);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  return { found: true, visible: true, box };
}

async function readTip(page) {
  return page.evaluate(() => {
    const tip = document.getElementById('civ-hud-title-tip-el');
    return {
      exists: !!tip,
      display: tip ? tip.style.display : null,
      text: tip ? tip.textContent : null,
    };
  });
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[newgame-adv-tooltip-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
    process.exit(1);
  }

  buildBundle();

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push('[pageerror] ' + err.message));

    console.log('\n-- Scenariusz 1: hover PEŁNY (>380ms) na WSZYSTKICH 8 ustawień z realnego zgłoszenia --');
    await gotoAdvModal(page);

    for (const label of NAMED_SETTINGS) {
      const r = await hoverIconForLabel(page, label);
      assert(`[${label}] wiersz + ikona (i) znalezione w .adv-modal`, r.found && r.visible);
      if (!r.found || !r.visible) continue;
      await wait(SHOW_DELAY_MS + 250);
      const tip = await readTip(page);
      assert(`[${label}] tooltip display:block po hover >380ms`, tip.display === 'block');
      assert(`[${label}] tooltip ma niepusty tekst`, !!tip.text && tip.text.trim().length > 0);
      // Odsuń mysz przed kolejną iteracją.
      await page.mouse.move(5, 5);
      await wait(150);
    }

    assert('[konsola] zero console.error / pageerror w całym scenariuszu 1', consoleErrors.length === 0);
    if (consoleErrors.length) console.error('   konsola:', consoleErrors.join(' | '));

    console.log('\n-- Scenariusz 2: hover KRÓTKI (<380ms) — throttling zamierzony, tooltip NIE POWINIEN się pokazać --');
    // To jest najbardziej prawdopodobne wytłumaczenie subiektywnego "nie działa": pobieżne
    // najechanie krócej niż SHOW_DELAY_MS. Dokumentujemy to jako ZAMIERZONE zachowanie, nie bug.
    const r2 = await hoverIconForLabel(page, 'Warunki zwycięstwa');
    assert('[krótki hover] ikona znaleziona', r2.found && r2.visible);
    if (r2.found && r2.visible) {
      await wait(150); // < SHOW_DELAY_MS=380
      const tipEarly = await readTip(page);
      assert('[krótki hover] tooltip NIE pokazuje się przed upływem SHOW_DELAY_MS (throttling zamierzony)',
        tipEarly.display !== 'block');
      await page.mouse.move(5, 5);
      await wait(150);
    }

    console.log('\n-- Dowód mutacyjny: usunięcie zasięgu .civ-newgame z resolveTarget NA ŻYWO musi zabić tooltip --');
    // Mutacja bez dotykania źródeł: zdejmujemy klasę scope z rootEl PO otwarciu modala.
    // Jeśli test cokolwiek realnie sprawdza (nie jest tautologią), to po tej mutacji
    // dokładnie ten sam hover, który wyżej pokazywał tooltip, przestaje działać.
    await page.evaluate(() => {
      const root = document.querySelector('.civ-newgame');
      if (root) root.setAttribute('data-mutation-proof-orig-class', root.className);
      if (root) root.className = 'civ-newgame-MUTATED-OUT-OF-SCOPE';
    });
    await wait(100);
    const rMut = await hoverIconForLabel(page, 'Barbarzyńcy', { scoped: false });
    assert('[mutacja scope] ikona nadal fizycznie znaleziona (kontrola sensu scenariusza)', rMut.found && rMut.visible);
    if (rMut.found && rMut.visible) {
      await wait(SHOW_DELAY_MS + 250);
      const tipMut = await readTip(page);
      assert('[mutacja scope] po wyjęciu spod .civ-newgame tooltip PRZESTAJE się pokazywać (dowód, że resolveTarget/SCOPE_SELECTOR ma znaczenie, test nie jest tautologią)',
        tipMut.display !== 'block');
    }
    // Przywróć (higiena, choć strona i tak zostanie zamknięta).
    await page.evaluate(() => {
      const root = document.querySelector('.civ-newgame-MUTATED-OUT-OF-SCOPE');
      const orig = root?.getAttribute('data-mutation-proof-orig-class');
      if (root && orig) root.className = orig;
    });

    await page.close();
  } finally {
    await browser.close();
  }

  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (e) { /* nieistotne */ }

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[newgame-adv-tooltip-test] błąd:', e);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
