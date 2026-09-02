'use strict';
/**
 * diplomacy-relacje-ai-ai-audiencja-live-test.cjs — R-DYPLO-RELACJE-AI-AI-AUDIENCJA-Q1
 * (Operator Sonnet 5, runda Obrony 2026-09-02, worktree izolowany).
 *
 * KONTEKST: Evaluator (Zarzut #1, KRYTYCZNY) wskazał, że jedyny dotychczasowy test tego
 * tematu (`diplomacy-relacje-ai-ai-audiencja-test.cjs`, Część C) renderuje `otherCardHtml`
 * przez esbuild + wywołanie funkcji w Node — to jest "test kontraktowy", explicite
 * wykluczony jako wystarczający dowód przez R-PROC-AUTOBOT.md §9 pkt 6(a) dla tematów
 * wizualnych/UX. TA bramka domyka lukę: realny `vite build`, realny headless Chromium
 * (`?playtest=mapa`), REALNE funkcje silnika (`openDiplomacyAudience`,
 * `showDiploPairSummary`, `buildDiploPairSummaryData`, `setDiploRelation`) — zero
 * reimplementacji logiki widoczności/mgły wojny.
 *
 * SCENARIUSZ (wzorem REGUŁY PRZECIW SAMOOSZUKIWANIU dispatchu — trzecia strona NIGDY
 * odkryta przez gracza, nie przypadek w którym gracz akurat zna wszystkich):
 *   - `?playtest=mapa` startuje z ownerId 1 (Grecy) jako JEDYNYM kontaktem dyplomatycznym
 *     gracza (w stanie wojny z graczem, `diplomaticallyDiscoveredOwners = {1}`).
 *   - Hak `__audienceRelTestDebug.setupThirdParties()` (main.ts, wołany WYŁĄCZNIE z
 *     Playwright) dodaje ownerId 2..5 i wiąże każdego z ownerId 1 osobnym rodzajem
 *     relacji (wojna/sojusz/NAP/handel) przez REALNE `setDiploRelation`/`activeDeals`.
 *     ownerId 2..5 NIGDY nie trafiają do `diplomaticallyDiscoveredOwners` — gracz ich
 *     nie odkrył.
 *
 * Pokrycie (kryteria końca 00-dispatch.md):
 *  A. Bootstrap `?playtest=mapa` dobiega końca zanim cokolwiek mierzymy.
 *  B. Kontrola scenariusza: `getContacts()` zawiera 1, NIE zawiera 2/3/4/5 (dowód, że to
 *     realny przypadek spoza mgły wojny gracza — kryterium 2, klauzula
 *     przeciw-samooszukiwaniu).
 *  C. Kryterium 1+2: `openAudience(1)` -> karta rozmówcy (`.da-card.them`) pokazuje
 *     sekcję „Relacje z innymi" z WSZYSTKIMI czterema kategoriami (wojna z 2, sojusz z 3,
 *     NAP z 4, handel z 5) — mimo że 2..5 są poza kontaktem gracza.
 *  D. Kryterium 3 (zero regresu pop-upu): `openPairSummary(1)` (dokładnie ta ścieżka co
 *     kliknięcie na liście „Znane frakcje") NIE pokazuje wojny z ownerId 2 (filtr mgły
 *     wojny nietknięty) — różnica względem C jest DOWODEM, nie tylko brakiem regresji.
 *  E. Zero console.error / pageerror w całym scenariuszu.
 *
 * Bramka (z katalogu gra/): node tools/diplomacy-relacje-ai-ai-audiencja-live-test.cjs
 * — exit 0 = zielona.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-diplomacy-relacje-audiencja-live-test');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  OK  ${label}`);
  } else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

function buildBundle() {
  console.log('[diplomacy-relacje-audiencja-live-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[diplomacy-relacje-audiencja-live-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[diplomacy-relacje-audiencja-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 90; i++) {
    const overlayCount = await page.locator('text=Tworzenie świata').count();
    if (overlayCount === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__audienceRelTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 120000 },
  );
  await wait(300);
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[diplomacy-relacje-audiencja-live-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
    process.exit(1);
  }

  buildBundle();

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push('[pageerror] ' + err.message));

    console.log('\n-- A. Bootstrap ?playtest=mapa dobiega końca (miasta+jednostki, tura=1, hak obecny) --');
    await gotoPlaytestMapa(page);
    const world0 = await page.evaluate(() => window.__eraTestDebug.getWorldState());
    assert('bootstrap zakończony: citiesLen>0', world0.citiesLen > 0, world0);
    assert('bootstrap zakończony: turn===1', world0.turn === 1, world0);

    console.log('\n-- B. Kontrola scenariusza: ownerId 2..5 NIGDY odkryci przez gracza --');
    await page.evaluate(() => window.__audienceRelTestDebug.setupThirdParties());
    const contacts = await page.evaluate(() => window.__audienceRelTestDebug.getContacts());
    assert('kontakt z ownerId 1 (przeciwnik gracza w mapie startowej)', contacts.includes(1), contacts);
    assert('ownerId 2 (wojna z 1) POZA kontaktem gracza', !contacts.includes(2), contacts);
    assert('ownerId 3 (sojusz z 1) POZA kontaktem gracza', !contacts.includes(3), contacts);
    assert('ownerId 4 (NAP z 1) POZA kontaktem gracza', !contacts.includes(4), contacts);
    assert('ownerId 5 (handel z 1) POZA kontaktem gracza', !contacts.includes(5), contacts);

    console.log('\n-- C. Kryterium 1+2: audiencja z ownerId 1 pokazuje WSZYSTKIE relacje z innymi --');
    await page.evaluate(() => window.__audienceRelTestDebug.openAudience(1));
    await page.waitForSelector('.da-card.them', { timeout: 15000 });
    await wait(200);
    const audienceCard = await page.evaluate(() => {
      const card = document.querySelector('.da-card.them');
      return card ? card.innerHTML : null;
    });
    assert('karta rozmówcy obecna w DOM', !!audienceCard, {});
    if (audienceCard) {
      assert('sekcja "Relacje z innymi" obecna', audienceCard.includes('Relacje z innymi'), {});
      assert('sekcja "W stanie wojny z" obecna', audienceCard.includes('W stanie wojny z'), {});
      assert('sekcja "W sojuszu z" obecna', audienceCard.includes('W sojuszu z'), {});
      assert('sekcja paktów o nieagresji obecna', /nieagresji/i.test(audienceCard), {});
      assert('sekcja "Handluje z" obecna', audienceCard.includes('Handluje z'), {});
      assert('audiencja pokazuje "chinczycy" (ownerId 2, wojna, POZA kontaktem gracza)', audienceCard.includes('Chińczycy') || audienceCard.includes('chinczycy'), audienceCard);
    }
    const relRows = await page.evaluate(() => Array.from(document.querySelectorAll('.da-card.them .da-rel-partner-row')).map(e => e.textContent));
    assert('co najmniej 4 wiersze partnerów w sekcji "Relacje z innymi" (po jednym na kategorię)', relRows.length >= 4, relRows);

    console.log('\n-- D. Kryterium 3: pop-up showDiploPairSummary (przed audiencją) NADAL filtruje mgłą wojny --');
    await page.evaluate(() => window.__audienceRelTestDebug.closeAudience());
    await wait(200);
    await page.evaluate(() => window.__audienceRelTestDebug.openPairSummary(1));
    await page.waitForSelector('.civ-diplo-pair-summary', { timeout: 15000 });
    await wait(200);
    const popupHtml = await page.evaluate(() => {
      const el = document.querySelector('.civ-diplo-pair-summary');
      return el ? el.innerHTML : null;
    });
    assert('pop-up obecny w DOM', !!popupHtml, {});
    if (popupHtml) {
      assert('pop-up NIE pokazuje wojny z ownerId 2 (poza mgłą wojny gracza) — REGRESJA jeśli FAIL', !/Chińczycy|chinczycy/.test(popupHtml), popupHtml);
      assert('pop-up NIE pokazuje sojuszu z ownerId 3 (poza mgłą wojny gracza)', !/Inkowie|inkowie/i.test(popupHtml), popupHtml);
    }
    await page.evaluate(() => window.__audienceRelTestDebug.closePairSummary());

    console.log('\n-- E. Konsola czysta --');
    assert('zero console.error / pageerror w całym scenariuszu', consoleErrors.length === 0, consoleErrors);
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
  console.error('[diplomacy-relacje-audiencja-live-test] błąd:', e);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
