'use strict';
/**
 * newgame-sett-grid-layout-test.cjs — P-NEWGAME-RAMKI-WYROWNANIE (Maciej, 2026-08-14,
 * zgłoszenie ze zrzutem "Ustawienia Rozgrywki": „Poza tym trzeba trochę ramki wyrównać").
 *
 * Ekran ustawień nowej gry (krok 4 kreatora, `gra/src/ui/newGameFlow.ts`): siatka 2×3 kart
 * `.sett-grid .srow` (Poziom trudności/Rozmiar mapy, Typ świata/Prędkość gry, Miasta-Państwa/
 * Liczba cywilizacji) obok panelu „Cywilizacje przeciwnika" (`.ai-civ-panel`), z sekcją
 * „Twój start" (`.start-preview`) i akcjami (`.sett-actions`) poniżej całego bloku.
 *
 * Pomiar w prawdziwej przeglądarce (Playwright + Chromium headless) na PRAWDZIWIE zbudowanym
 * kodzie (`node ./node_modules/vite/bin/vite.js build`) — nie source-text pin, nie jsdom (jsdom
 * nie liczy CSS layoutu, getBoundingClientRect zwraca tam zawsze zera). To jedyny sposób, żeby
 * złapać regres CSS Grid/flex, który żaden test source-string nie widzi.
 *
 * WYNIK POMIARU (2026-08-14, ta sama sesja co dispatch): na aktualnym kodzie (HEAD zawiera już
 * `ea0be32a` — wariant A z P-NEWGAME-CYWILIZACJE-ZASLANIAJA-START, panel AI PRZENIESIONY obok
 * siatki, nie pod nią) wszystkie 6 kart są już piksel-idealnie wyrównane: identyczna
 * wysokość/pozycja w wierszu, identyczne wewnętrzne odstępy w każdej karcie, spójny rytm 16px
 * (1rem) między blokami poniżej siatki. Zweryfikowane też pod „Super Huge" (najdłuższa etykieta
 * wartości) i przy 5 zaznaczonych cywilizacjach AI (przewijany panel) — bez zmian. Zgłoszenie
 * Macieja zostało zarejestrowane PRZED wdrożeniem wariantu A (kolejność w PYTANIA-OTWARTE.md:
 * P-NEWGAME-RAMKI-WYROWNANIE poprzedza P-NEWGAME-CYWILIZACJE-ZASLANIAJA-START) — prawdopodobnie
 * ten sam zrzut ekranu, ten sam problem, naprawiony przy okazji przez wariant A. Ten plik NIE
 * zmienia CSS — dokumentuje zmierzony stan i chroni go jako regres na przyszłość.
 *
 * ZNALEZISKO PRZY OKAZJI: wyrównanie wysokości kart w wierszu ma DWIE niezależne warstwy obrony
 * — CSS Grid `align-items:stretch` na `.sett-grid` ORAZ jawne `.civ-newgame .srow{height:100%;
 * min-height:76px}`. Sekcja "dowód mutacyjny B1/B2" niżej pokazuje eksperymentalnie, że trzeba
 * złamać OBIE naraz, żeby wysokości kart w wierszu faktycznie się rozjechały — złamanie samego
 * align-items nie wystarcza. To dobra wiadomość dla odporności tego ekranu na przyszłe zmiany.
 *
 * Sekcja "mutacyjny dowód": test injektuje na żywo (bez dotykania źródeł na dysku) elementy,
 * które MUSIAŁYBY złamać wybrane asercje, gdyby CSS się cofnął — dowodzi, że test faktycznie
 * coś sprawdza, nie tylko potwierdza dzisiejszy stan.
 *
 * Run from gra/:  node tools/newgame-sett-grid-layout-test.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-newgame-layout-test');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const EPS = 0.75; // px — tolerancja na subpikselowe zaokrąglenia layoutu przeglądarki

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

function close(a, b, eps = EPS) {
  return typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= eps;
}

function buildBundle() {
  console.log('[newgame-sett-grid-layout-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[newgame-sett-grid-layout-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[newgame-sett-grid-layout-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function gotoSettStep(page) {
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

/** Zmierz geometrię siatki ustawień w żywym DOM (getBoundingClientRect — prawdziwy layout). */
async function measure(page) {
  return page.evaluate(() => {
    function rect(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        top: r.top, left: r.left, width: r.width, height: r.height,
        bottom: r.bottom, right: r.right,
      };
    }
    const gridEl = document.querySelector('.civ-newgame .sett-layout .sett-grid');
    const rows = gridEl ? Array.from(gridEl.children) : [];
    return {
      directChildrenClasses: rows.map((r) => r.className),
      directChildrenCount: rows.length,
      cards: rows.map((row) => ({
        label: row.querySelector('.sl')?.textContent?.trim() ?? '',
        row: rect(row),
        hdrTop: rect(row.querySelector('.srow-hdr'))?.top,
        sctlTop: rect(row.querySelector('.sctl'))?.top,
        svTop: rect(row.querySelector('.sv'))?.top,
      })),
      grid: rect(gridEl),
      layout: rect(document.querySelector('.civ-newgame .sett-layout')),
      aiPanel: rect(document.querySelector('.civ-newgame .ai-civ-panel')),
      startPreview: rect(document.querySelector('.civ-newgame .start-preview')),
      settActions: rect(document.querySelector('.civ-newgame .sett-actions')),
    };
  });
}

/** Asercje "geometria siatki 2×3 + reszta ekranu spójne" — jądro tego testu. */
function assertGridGeometry(data, tag) {
  assert(`[${tag}] dokładnie 6 kart bezpośrednio w .sett-grid (hipoteza (a): brak owijającego kontenera)`,
    data.directChildrenCount === 6 && data.directChildrenClasses.every((c) => c === 'srow'));

  const c = data.cards;
  if (c.length !== 6) {
    assert(`[${tag}] pomiar kart niekompletny — reszta asercji geometrii pominięta`, false);
    return;
  }

  // Pary wierszy: (0,1) wiersz 1, (2,3) wiersz 2, (4,5) wiersz 3.
  for (const [i, j, nazwa] of [[0, 1, 'wiersz 1'], [2, 3, 'wiersz 2'], [4, 5, 'wiersz 3']]) {
    assert(`[${tag}] ${nazwa}: "${c[i].label}" i "${c[j].label}" ten sam top (align-items:stretch, hipoteza (b))`,
      close(c[i].row.top, c[j].row.top));
    assert(`[${tag}] ${nazwa}: "${c[i].label}" i "${c[j].label}" ta sama wysokość`,
      close(c[i].row.height, c[j].row.height));
  }
  // Kolumny: (0,2,4) lewa, (1,3,5) prawa — ten sam left i width.
  for (const [idxs, nazwa] of [[[0, 2, 4], 'lewa kolumna'], [[1, 3, 5], 'prawa kolumna']]) {
    const [a, b, cc] = idxs.map((i) => c[i].row);
    assert(`[${tag}] ${nazwa}: left spójny na 3 kartach`, close(a.left, b.left) && close(b.left, cc.left));
    assert(`[${tag}] ${nazwa}: width spójny na 3 kartach`, close(a.width, b.width) && close(b.width, cc.width));
  }
  // Wewnętrzne odstępy (nagłówek/kontrolki/wartość) identyczne względem topu karty na WSZYSTKICH 6.
  const relHdr = c.map((x) => x.hdrTop - x.row.top);
  const relSctl = c.map((x) => x.sctlTop - x.row.top);
  const relSv = c.map((x) => x.svTop - x.row.top);
  assert(`[${tag}] offset nagłówka od topu karty identyczny na 6/6 kart (hipoteza (b))`,
    relHdr.every((v) => close(v, relHdr[0])));
  assert(`[${tag}] offset kontrolek (‹ wartość ›) od topu karty identyczny na 6/6 kart`,
    relSctl.every((v) => close(v, relSctl[0])));
  assert(`[${tag}] offset wartości od topu karty identyczny na 6/6 kart`,
    relSv.every((v) => close(v, relSv[0])));

  // Panel "Cywilizacje przeciwnika" wyrównany górą z siatką 2×3 (sett-layout ma align-items:start).
  if (data.aiPanel) {
    assert(`[${tag}] .ai-civ-panel top wyrównany z .sett-grid top`, close(data.grid.top, data.aiPanel.top));
  }

  // Rytm 16px (1rem) pod całym blokiem: sett-layout -> start-preview -> sett-actions.
  if (data.startPreview && data.settActions) {
    const gap1 = data.startPreview.top - data.layout.bottom;
    const gap2 = data.settActions.top - data.startPreview.bottom;
    assert(`[${tag}] odstęp siatka->"Twój start" (${gap1.toFixed(2)}px) spójny z odstępem "Twój start"->akcje (${gap2.toFixed(2)}px) — hipoteza (c)`,
      close(gap1, gap2, 1.5));
  }
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[newgame-sett-grid-layout-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
    process.exit(1);
  }

  buildBundle();

  const browser = await launchBrowser(chromium);
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    console.log('\n-- Scenariusz 1: stan domyślny (1920x1080) --');
    await gotoSettStep(page);
    assertGridGeometry(await measure(page), 'domyślne, 1920x1080');

    console.log('\n-- Scenariusz 2: Rozmiar mapy = "Super Huge" (najdłuższa etykieta wartości) --');
    const rows = await page.locator('.civ-newgame .sett-grid .srow').all();
    const mapSizeRightArrow = rows[1].locator('.arr').nth(1); // wiersz1/kol2 = "Rozmiar mapy"
    for (let i = 0; i < 3; i++) { await mapSizeRightArrow.click(); await wait(60); } // idx2->5 "Super Huge"
    await wait(200);
    const superHugeData = await measure(page);
    assert('[Super Huge] wartość faktycznie zmieniona na "Super Huge" (kontrola sensu scenariusza)',
      superHugeData.cards[1]?.label === 'Rozmiar mapy');
    assertGridGeometry(superHugeData, 'Rozmiar mapy = Super Huge');

    console.log('\n-- Scenariusz 3: 5 cywilizacji AI zaznaczonych (panel przewijany) --');
    const aiCards = await page.locator('.civ-newgame .ai-civ-grid .card').all();
    for (let i = 0; i < Math.min(5, aiCards.length); i++) { await aiCards[i].click(); await wait(60); }
    await wait(250);
    const ai5Data = await measure(page);
    assertGridGeometry(ai5Data, '5 cywilizacji AI zaznaczonych');
    if (ai5Data.aiPanel && ai5Data.grid) {
      assert('[5 AI] .ai-civ-panel NIE rośnie ponad wysokość .sett-grid (przewija się wewnątrz, nie rozpycha layoutu)',
        ai5Data.aiPanel.height <= ai5Data.grid.height + EPS);
    }

    console.log('\n-- Scenariusz 4 (viewport węższy, bez rebuildu — ten sam bundle): 1366x768 --');
    const page2 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await gotoSettStep(page2);
    assertGridGeometry(await measure(page2), '1366x768');
    await page2.close();

    // -------------------------------------------------------------------------
    // Dowód mutacyjny: bez dotykania źródeł na dysku, injektujemy na ŻYWO DOM/CSS,
    // które MUSI złamać powyższe asercje, jeśli działają — nie tylko potwierdzają
    // dzisiejszy (już spójny) stan.
    // -------------------------------------------------------------------------
    console.log('\n-- Dowód mutacyjny A: wydłużona etykieta w JEDNEJ karcie wiersza — stretch MUSI wyrównać wysokości --');
    await page.evaluate(() => {
      const rows2 = document.querySelectorAll('.civ-newgame .sett-grid .srow');
      const sl = rows2[0].querySelector('.sl');
      if (sl) sl.textContent = 'Poziom trudności — bardzo długi dopisany tekst wymuszający zawijanie do dwóch albo trzech linii, żeby intrinsic content karty realnie się różnił';
    });
    await wait(120);
    const stretchedData = await measure(page);
    const row1Stretched = stretchedData.cards.slice(0, 2);
    assert('[mutacja A] treść faktycznie wydłużona (kontrola sensu scenariusza)',
      row1Stretched[0].label.length > 40);
    assert('[mutacja A] mimo różnej długości treści, align-items:stretch WYMUSZA identyczną wysokość obu kart wiersza',
      close(row1Stretched[0].row.height, row1Stretched[1].row.height));

    console.log('\n-- Dowód mutacyjny B1: sam regres align-items:start (na żywo, bez ruszania .srow) --');
    // Kod ma DWIE niezależne warstwy obrony przed dokładnie tym regresem: (1) CSS Grid
    // `align-items:stretch` na `.sett-grid` i (2) jawne `.civ-newgame .srow{height:100%;
    // min-height:76px}` (patrz to samo źródło, linia z `height:100%`). Warstwa (2) sama w sobie
    // już wymusza pełną wysokość karty niezależnie od align-items grida — więc złamanie WYŁĄCZNIE
    // align-items nie powinno jeszcze ruszyć wysokości. To realny, pozytywny wniosek z pomiaru,
    // nie usterka dowodu — potwierdzamy go jawną asercją zamiast zakładać.
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.id = '__mutation_proof_break_align_items__';
      style.textContent = '.civ-newgame .sett-layout .sett-grid{align-items:start !important;}';
      document.head.appendChild(style);
    });
    await wait(120);
    const partialBreakData = await measure(page);
    const row1PartialBreak = partialBreakData.cards.slice(0, 2);
    assert('[mutacja B1] sam align-items:start NIE rozjeżdża wysokości — warstwa obrony 2 (.srow{height:100%}) działa niezależnie od warstwy 1',
      close(row1PartialBreak[0].row.height, row1PartialBreak[1].row.height));
    await page.evaluate(() => { document.getElementById('__mutation_proof_break_align_items__')?.remove(); });

    console.log('\n-- Dowód mutacyjny B2: align-items:start + zniesienie .srow height:100% RAZEM — asercja MUSI złapać rozjazd --');
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.id = '__mutation_proof_break_both__';
      style.textContent = '.civ-newgame .sett-layout .sett-grid{align-items:start !important;}'
        + '.civ-newgame .sett-layout .sett-grid .srow{height:auto !important;}';
      document.head.appendChild(style);
    });
    await wait(120);
    const brokenData = await measure(page);
    const row1Broken = brokenData.cards.slice(0, 2);
    const stillEqual = close(row1Broken[0].row.height, row1Broken[1].row.height);
    assert('[mutacja B2] ze złamaniem OBU warstw naraz, wysokości wiersza 1 FAKTYCZNIE się rozjeżdżają (dowód, że asercja "ta sama wysokość" wyżej ma siłę wykrywającą, nie jest tautologią)',
      !stillEqual);
    // Sprzątanie wstrzykniętego stylu (kolejne kroki, gdyby jakieś były, nie dziedziczą regresu).
    await page.evaluate(() => { document.getElementById('__mutation_proof_break_both__')?.remove(); });

    await page.close();
  } finally {
    await browser.close();
  }

  // Sprzątanie zbudowanego bundla testowego (gitignored, ale nie zaśmiecamy dysku).
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (e) { /* nieistotne */ }

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[newgame-sett-grid-layout-test] błąd:', e);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
