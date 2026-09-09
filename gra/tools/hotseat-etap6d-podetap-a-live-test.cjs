'use strict';
/**
 * hotseat-etap6d-podetap-a-live-test.cjs — bramka R-HOTSEAT-ETAP6D-PODETAP-A-Q1,
 * kryterium 4 dispatchu ("wywołanie funkcji z UI (przycisk wypowiedzenia wojny w panelu
 * audiencji) nadal działa — żywy dowód Chromium, nie tylko unit").
 *
 * Wzorem `tools/diplomacy-relacje-ai-ai-audiencja-live-test.cjs`: realny `vite build`,
 * realny headless Chromium (`?playtest=mapa`), REALNE funkcje silnika — zero
 * reimplementacji logiki `playerDeclareWarOnOwner` (dowód nietautologii/mutacji dla tej
 * funkcji jest w osobnej bramce jednostkowej `hotseat-etap6d-podetap-a-test.cjs`; ta
 * bramka dowodzi wyłącznie, że migracja main.ts (literał `0` → `ME()`) NIE zepsuła
 * ścieżki UI klik-po-kliku).
 *
 * SCENARIUSZ:
 *  - `?playtest=mapa` startuje z ownerId 1 (Grecy) w stanie wojny z graczem — żeby
 *    dojść do przycisku "Wypowiedz wojnę" (akcja audiencji `data-aid="11"`, dostępna
 *    tylko GDY strony NIE są już w wojnie), używamy istniejącego, ogólnego haka
 *    `__dyploMapaOdkrycieTestDebug.prepareContact(1)` (main.ts, wołany też przez
 *    `dyplo-mapa-odkrycie-live-test.cjs`) żeby zresetować relację na `neutralni` — to
 *    jest REALNE wywołanie `setDiploRelation`, nie obejście silnika.
 *  - `__audienceRelTestDebug.openAudience(1)` (main.ts) otwiera panel audiencji REALNĄ
 *    `openDiplomacyAudience(1)` — dokładnie ta sama funkcja, którą woła klik na mapie.
 *  - Klik `button[data-aid="11"]` (REALNY DOM, `src/ui/diplomacyAudience.ts`) → modal
 *    zgody na wojnę → klik `.cd-war-declare-only` (REALNY DOM, `showWarConsentModal`)
 *    → woła `onDeclareOnly()` → `playerDeclareWarOnOwner(1)` (ZMIGROWANA funkcja).
 *  - Dowód skutku: (a) hint-toast pokazuje "Wypowiedziałeś wojnę" (dokładnie ten sam
 *    string co w ciele funkcji), (b) `warEventLog` (main.ts) ma nowy wpis na głowie
 *    (dowód, że `recordWarDeclarationEvent(ME(), 1)` faktycznie wykonał się z
 *    poprawnym callerem, nie tylko że return=true).
 *
 * Run: node tools/hotseat-etap6d-podetap-a-live-test.cjs (z katalogu gra/)
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-hotseat-etap6d-podetap-a-live-test');
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
  console.log('[hotseat-etap6d-podetap-a-live-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[hotseat-etap6d-podetap-a-live-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[hotseat-etap6d-podetap-a-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
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
    () => !!window.__audienceRelTestDebug && !!window.__dyploMapaOdkrycieTestDebug && !!window.__eraTestDebug
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
    console.error('[hotseat-etap6d-podetap-a-live-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
    process.exit(1);
  }

  buildBundle();

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push('[pageerror] ' + err.message));

    console.log('\n-- A. Bootstrap ?playtest=mapa dobiega końca --');
    await gotoPlaytestMapa(page);
    const world0 = await page.evaluate(() => window.__eraTestDebug.getWorldState());
    assert('bootstrap zakończony: citiesLen>0', world0.citiesLen > 0, world0);

    console.log('\n-- B. Setup: reset relacji gracz<->ownerId 1 na "neutralni" (REALNY setDiploRelation) --');
    await page.evaluate(() => window.__dyploMapaOdkrycieTestDebug.prepareContact(1));
    const warLogBefore = await page.evaluate(() => window.__eraTestDebug.getWarEventLogHead());

    console.log('\n-- C. Otwarcie panelu audiencji (REALNA openDiplomacyAudience) --');
    await page.evaluate(() => window.__audienceRelTestDebug.openAudience(1));
    await page.waitForSelector('.civ-diplo-aud', { timeout: 15000 });
    await wait(200);
    const declareBtnCount = await page.locator('button[data-aid="11"]').count();
    assert('przycisk akcji "Wypowiedz wojnę" (data-aid=11) obecny i widoczny w audiencji', declareBtnCount > 0, declareBtnCount);

    console.log('\n-- D. Klik "Wypowiedz wojnę" -> modal zgody -> klik "Wypowiedz wojnę" w modalu --');
    await page.click('button[data-aid="11"]');
    await page.waitForSelector('.cd-war-declare-only', { timeout: 15000 });
    await wait(150);
    await page.click('.cd-war-declare-only');
    await wait(300);

    console.log('\n-- E. Dowód skutku: hint-toast + warEventLog (REALNA playerDeclareWarOnOwner, zmigrowana) --');
    const toast = await page.evaluate(() => window.__eraTestDebug.getToast());
    assert('hint-toast obecny po deklaracji wojny', !!toast, toast);
    if (toast) {
      assert('hint-toast pokazuje "Wypowiedziałeś wojnę" (dokładny string z ciała funkcji)',
        toast.html.includes('Wypowiedziałeś wojnę'), toast);
    }
    const warLogAfter = await page.evaluate(() => window.__eraTestDebug.getWarEventLogHead());
    assert('warEventLog dostał nowy wpis na głowie (recordWarDeclarationEvent(ME(),1) faktycznie wykonany)',
      JSON.stringify(warLogAfter) !== JSON.stringify(warLogBefore), { before: warLogBefore, after: warLogAfter });

    console.log('\n-- F. Konsola czysta --');
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
  console.error('[hotseat-etap6d-podetap-a-live-test] błąd:', e);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
