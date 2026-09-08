'use strict';
/**
 * menu-trudnosc-tooltip-real-render-test.cjs — R-MENU-TRUDNOSC-TOOLTIP-ROZNICE-Q1.
 *
 * Żywy dowód Chromium (headless, prawdziwy build vite + prawdziwy hover) że GŁÓWNY
 * selektor trudności (krok 4 kreatora nowej gry, `newGameFlow.ts` / SETT klucz
 * `difficulty`, wiersz "Poziom trudności" w `.sett-grid`, POZA modalem Zaawansowane)
 * pokazuje przy najechaniu na ikonę (i) tooltip z konkretnymi różnicami Normal/Hard —
 * ten sam mechanizm `.ng-info` + `installHudTitleTooltips()` co reszta kreatora
 * (chroniony przez `tools/newgame-adv-tooltip-test.cjs` dla opcji Zaawansowane).
 *
 * ASERCJE:
 *  (A) wiersz "Poziom trudności" i jego ikona (i) istnieją w `.sett-grid` (poza modalem);
 *  (B) hover >380ms pokazuje tooltip (display:block) dla KAŻDEGO z 3 poziomów
 *      (Łatwy/Normalny/Trudny), z osobnym zrzutem ekranu na dowód;
 *  (C) treść tooltipa różni się per poziom i zawiera frazy-kotwice zgodne ze
 *      świeżo zweryfikowanymi liczbami (koszt gracza ×2 na Trudnym, brak takiego
 *      mnożnika na Normalnym, bonus produkcji/walki AI, wzmianka o osobnym
 *      ustawieniu trudności miast-państw);
 *  (D) zero błędów konsoli w całym scenariuszu.
 *
 * Run from gra/: node tools/menu-trudnosc-tooltip-real-render-test.cjs [--shot-dir DIR]
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-menu-trudnosc-tooltip-test');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOW_DELAY_MS = 380; // musi być zsynchronizowane z hudTitleTooltip.ts

const SHOT_DIR = (() => {
  const i = process.argv.indexOf('--shot-dir');
  return i > -1 ? process.argv[i + 1] : null;
})();
if (SHOT_DIR) fs.mkdirSync(SHOT_DIR, { recursive: true });

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
  console.log('[menu-trudnosc-tooltip-real-render-test] budowanie bundla (vite build)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[menu-trudnosc-tooltip-real-render-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[menu-trudnosc-tooltip-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** Kreator -> krok 4 ("Ustawienia Rozgrywki"), BEZ otwierania modala Zaawansowane. */
async function gotoStep4(page) {
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
}

function difficultyRow(page) {
  return page.locator('.civ-newgame .sett-grid .srow', {
    has: page.locator('.sl', { hasText: 'Poziom trudności' }),
  }).first();
}

async function hoverIcon(page, row) {
  await row.scrollIntoViewIfNeeded();
  await wait(120);
  const icon = row.locator('.ng-info');
  const box = await icon.boundingBox();
  if (!box) return null;
  await page.mouse.move(5, 5);
  await wait(30);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  return box;
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

async function currentOptionValue(row) {
  return (await row.locator('.sv').first().textContent())?.trim() ?? '';
}

async function clickArrow(row, dir) {
  // .sctl ma dokładnie dwa .arr (lewa/prawa) wokół .sv.
  const arrows = row.locator('.arr');
  await (dir > 0 ? arrows.nth(1) : arrows.nth(0)).click();
}

/** Kotwice treściowe per poziom — muszą pochodzić ze świeżo zweryfikowanych liczb, nie z pamięci. */
const EXPECTED = {
  'Łatwy': [/AI.*×2 za budynki|jednostki i badania/i, /nie przejmuj/i],
  'Normalny': [/Symetryczne koszty/i, /\+10% produkcji/i],
  'Trudny': [/Gracz płaci ×2/i, /\+25% produkcji/i, /\+5% do walki/i],
};

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[menu-trudnosc-tooltip-real-render-test] playwright nie znaleziony.');
    process.exit(1);
  }

  buildBundle();

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push('[pageerror] ' + err.message));

    await gotoStep4(page);

    const row = difficultyRow(page);
    assert('[Poziom trudności] wiersz znaleziony w .sett-grid', (await row.count()) > 0);

    // Ustaw na Łatwy jako punkt startowy (idx 0), niezależnie od domyślnego (Normalny).
    let val = await currentOptionValue(row);
    let guard = 0;
    while (val !== 'Łatwy' && guard < 5) {
      await clickArrow(row, -1);
      val = await currentOptionValue(row);
      guard++;
    }

    for (const label of ['Łatwy', 'Normalny', 'Trudny']) {
      val = await currentOptionValue(row);
      assert(`[krok] wartość selektora = ${label} (jest: ${val})`, val === label);

      const box = await hoverIcon(page, row);
      assert(`[${label}] ikona (i) znaleziona i ma rozmiar`, !!box);
      if (!box) continue;

      await wait(SHOW_DELAY_MS + 250);
      const tip = await readTip(page);
      assert(`[${label}] tooltip display:block po hover >380ms`, tip.display === 'block');
      assert(`[${label}] tooltip ma niepusty tekst`, !!tip.text && tip.text.trim().length > 0);

      const patterns = EXPECTED[label] || [];
      for (const re of patterns) {
        assert(`[${label}] tooltip zawiera „${re}"`, re.test(tip.text || ''));
      }
      assert(`[${label}] tooltip wspomina osobne ustawienie trudności miast-państw`,
        /miast-państw/i.test(tip.text || ''));

      if (SHOT_DIR) {
        const file = path.join(SHOT_DIR, `menu-trudnosc-tooltip-${label === 'Łatwy' ? 'latwy' : label === 'Normalny' ? 'normalny' : 'trudny'}.png`);
        await page.screenshot({ path: file });
        console.log('  [zrzut]', file);
      }

      await page.mouse.move(5, 5);
      await wait(150);
      await clickArrow(row, 1);
    }

    // Kontrola treściowa: Normal i Hard MUSZĄ mieć różny tekst (dowód, że nie jest to
    // jeden statyczny opis skopiowany na wszystkie poziomy).
    await gotoStep4(page); // reset stanu (nowa nawigacja od zera)
    const row2 = difficultyRow(page);
    let v = await currentOptionValue(row2);
    let g2 = 0;
    while (v !== 'Normalny' && g2 < 5) { await clickArrow(row2, 1); v = await currentOptionValue(row2); g2++; }
    await hoverIcon(page, row2);
    await wait(SHOW_DELAY_MS + 250);
    const tipNormal = (await readTip(page)).text;
    await page.mouse.move(5, 5); await wait(150);
    await clickArrow(row2, 1); // -> Trudny
    await hoverIcon(page, row2);
    await wait(SHOW_DELAY_MS + 250);
    const tipHard = (await readTip(page)).text;
    assert('[Normal vs Hard] treść tooltipa RÓŻNI SIĘ między poziomami', tipNormal !== tipHard && !!tipNormal && !!tipHard);

    assert('[konsola] zero console.error / pageerror w całym scenariuszu', consoleErrors.length === 0);
    if (consoleErrors.length) console.error('   konsola:', consoleErrors.join(' | '));

    await page.close();
  } finally {
    await browser.close();
  }

  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (e) { /* nieistotne */ }

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[menu-trudnosc-tooltip-real-render-test] błąd:', e);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
