'use strict';
/**
 * hud-tooltip-body-mounted-panels-test.cjs — P-NEWGAME-KREATOR-TOOLTIP-INFO-NIE-DZIALA RUNDA 2
 * (Maciej, 2026-08-15, cytat: „tak, muszę przytrzymać, muszę naciskać na ikonkę. Wtedy pojawia
 * się taki pytajnik, jak się znajdzie tam ikonkę, ale niestety się nie pojawia żadna informacja."
 * + „tak problem dotyczy wszystkich.").
 *
 * ROOT CAUSE znaleziony w tej rundzie: `SCOPE_SELECTOR` w `hudTitleTooltip.ts` jest
 * ALLOWLISTĄ kontenerów. Panele montowane bezpośrednio na `document.body` (poza tą listą)
 * mają ikony/etykiety z natywnym `title=` + CSS `cursor:help` (pytajnik), ale
 * `resolveTarget()` je odrzuca (`hit.closest(SCOPE_SELECTOR)` = null) — hover-detect na
 * poziomie CSS (kursor zmienia kształt) działa niezależnie od JS, ale treść dymka zależy
 * WYŁĄCZNIE od natywnego tooltipa przeglądarki, znanego z niestabilności w wielu realnych
 * środowiskach (zdalny pulpit, DPI, część kombinacji przeglądarka/OS) — dokładnie pasuje do
 * zgłoszenia: „pytajnik jest, treści nie ma".
 *
 * DOWÓD (ten sam agent, żywy headless): PRZED naprawą `.civ-emp-info-tip` (magazyn surowców,
 * panel Imperium/Surowce) po hover >380ms zostawiał natywny atrybut `title` NIETKNIĘTY i
 * `#civ-hud-title-tip-el` pusty (`display:''`, `text:''`) — mechanizm JS nigdy się nie
 * uruchomił. PO naprawie (dopisanie `.civ-emp-panel`, `.civ-diplo-aud`, `.civ-diplo-basket`
 * do SCOPE_SELECTOR): `title` zostaje zdjęty (jak dla każdego elementu w zasięgu), tooltip
 * JS pokazuje się z pełnym tekstem.
 *
 * Ten test chroni panel Imperium (`.civ-emp-panel` / `.civ-emp-info-tip`) — jedyny z trzech
 * naprawionych kontenerów łatwo osiągalny w headless bez pełnego přejścia dyplomacji.
 * Dowód mutacyjny: zdjęcie klasy `civ-emp-panel` z roota NA ŻYWO musi zgasić tooltip —
 * potwierdza że to SCOPE_SELECTOR rządzi, nie coś innego (test nie jest tautologią).
 *
 * Run from gra/:  node tools/hud-tooltip-body-mounted-panels-test.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-hud-tooltip-body-panels-test');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=miasto';
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
  console.log('[hud-tooltip-body-panels-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[hud-tooltip-body-panels-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[hud-tooltip-body-panels-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** Sandbox jednego miasta (?playtest=miasto) -> wróć na mapę HUD -> otwórz panel Imperium/Surowce. */
async function gotoEmpireResourcesPanel(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  // Generacja mapy w tle bywa wolna w headless — czekaj aż zniknie ekran "Tworzenie świata".
  for (let i = 0; i < 90; i++) {
    const overlayCount = await page.locator('text=Tworzenie świata').count();
    if (overlayCount === 0) break;
    await wait(2000);
  }
  await wait(1500);

  // playtest=miasto ląduje w panelu miasta (.civ-cs) — wróć na mapę HUD.
  const backBtn = page.locator('button:has-text("WRÓĆ NA MAPĘ")').first();
  if (await backBtn.count()) {
    await backBtn.click({ force: true });
    await wait(1000);
  }

  const surowceChip = page.locator('[data-act="surowce"]').first();
  await surowceChip.waitFor({ state: 'visible', timeout: 15000 });
  await surowceChip.click({ force: true });
  await page.waitForSelector('.civ-emp-panel.open', { timeout: 15000 });
  await wait(400);
}

async function hoverInfoTip(page) {
  const infoTip = page.locator('.civ-emp-info-tip').first();
  if ((await infoTip.count()) === 0) return { found: false };
  await infoTip.scrollIntoViewIfNeeded();
  await wait(150);
  const box = await infoTip.boundingBox();
  if (!box) return { found: true, visible: false };
  await page.mouse.move(5, 5);
  await wait(30);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  return { found: true, visible: true };
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
    console.error('[hud-tooltip-body-panels-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
    process.exit(1);
  }

  buildBundle();

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push('[pageerror] ' + err.message));

    console.log('\n-- Scenariusz 1: panel Imperium (.civ-emp-panel), montowany na document.body, poza .civ-hud --');
    await gotoEmpireResourcesPanel(page);

    const r1 = await hoverInfoTip(page);
    assert('[.civ-emp-info-tip] ikona znaleziona w panelu Surowce', r1.found && r1.visible);

    if (r1.found && r1.visible) {
      // Margines ponad SHOW_DELAY_MS — pierwsze uruchomienie w headless bywa wolniejsze
      // (layout/reflow panelu Imperium świeżo otwartego), stąd bezpieczny zapas +500ms.
      await wait(SHOW_DELAY_MS + 500);
      const tip = await readTip(page);
      assert('[.civ-emp-info-tip] tooltip display:block po hover >380ms', tip.display === 'block');
      assert('[.civ-emp-info-tip] tooltip ma niepusty tekst', !!tip.text && tip.text.trim().length > 0);
      assert('[.civ-emp-info-tip] tekst zawiera formułę pojemności magazynu (dowód treści, nie placeholder)',
        !!tip.text && tip.text.includes('Pojemność'));

      const nativeTitleGone = await page.evaluate(() => {
        const el = document.querySelector('.civ-emp-info-tip');
        return el ? el.getAttribute('title') : 'ELEMENT-NOT-FOUND';
      });
      assert('[.civ-emp-info-tip] natywny atrybut title zdjęty po hover (mechanizm JS przejął kontrolę)',
        nativeTitleGone === null);
    }

    assert('[konsola] zero console.error / pageerror w scenariuszu 1', consoleErrors.length === 0);
    if (consoleErrors.length) console.error('   konsola:', consoleErrors.join(' | '));

    console.log('\n-- Dowód mutacyjny: zdjęcie klasy .civ-emp-panel z roota NA ŻYWO musi zgasić tooltip --');
    await page.mouse.move(5, 5);
    await wait(150);
    await page.evaluate(() => {
      const root = document.querySelector('.civ-emp-panel');
      if (root) {
        root.setAttribute('data-mutation-proof-orig-class', root.className);
        root.className = root.className.replace('civ-emp-panel', 'civ-emp-panel-MUTATED-OUT-OF-SCOPE');
      }
    });
    await wait(100);

    const infoTipMut = page.locator('.civ-emp-info-tip').first();
    const mutCount = await infoTipMut.count();
    assert('[mutacja scope] ikona nadal fizycznie znaleziona (kontrola sensu scenariusza)', mutCount > 0);
    if (mutCount > 0) {
      const box = await infoTipMut.boundingBox();
      if (box) {
        await page.mouse.move(5, 5);
        await wait(30);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await wait(SHOW_DELAY_MS + 500);
        const tipMut = await readTip(page);
        assert(
          '[mutacja scope] po wyjęciu spod .civ-emp-panel tooltip PRZESTAJE się pokazywać ' +
          '(dowód, że SCOPE_SELECTOR ma znaczenie, test nie jest tautologią)',
          tipMut.display !== 'block',
        );
      }
    }
    // Przywróć (higiena, choć strona i tak zostanie zamknięta).
    await page.evaluate(() => {
      const root = document.querySelector('[data-mutation-proof-orig-class]');
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
  console.error('[hud-tooltip-body-panels-test] błąd:', e);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
