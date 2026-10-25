'use strict';
/**
 * diplomacy-direct-negotiation-live-test.cjs — R-WEB-DIPLO-UI-DIRECT-NEGOTIATION-Q1.
 *
 * Realny headless Chromium (?playtest=mapa, prawdziwy bundle Vite zbudowany do katalogu
 * tymczasowego poza repo, wzorem diplomacy-relacje-ai-ai-audiencja-live-test.cjs):
 *  A. Klik cywilizacji na liście dyplomacji (REALNY klik toolbara + karty) prowadzi OD RAZU
 *     do ekranu negocjacji/audiencji — pośredni pop-up `.civ-diplo-pair-summary` NIE powstaje.
 *  B. Karta cywilizacji na liście zawiera wiersze „Wojny / Sojusze / Handel” zgodne ze
 *     stanem gry (wojna gracza z ownerId 1 w mapie startowej -> „Wojny: Ty”).
 *  C. Zrzuty ekranu listy i ekranu negocjacji -> dyspozycje/autobot/runs/R-WEB-DIPLO-UI-DIRECT-NEGOTIATION-Q1/evidence/
 *  D. 0 pageerror / console.error w scenariuszu.
 *
 * Usage (z gra/): node tools/diplomacy-direct-negotiation-live-test.cjs [outDirAbs] [evidenceDirAbs]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-direct-neg-live-' + process.pid);
const EVIDENCE = process.argv[3]
  || path.join(REPO_ROOT, 'dyspozycje', 'autobot', 'runs', 'R-WEB-DIPLO-UI-DIRECT-NEGOTIATION-Q1', 'evidence');
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

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
  console.log('[direct-neg-live] vite build do katalogu tymczasowego:', SCRATCH);
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
    () => !!window.__audienceRelTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
  await wait(300);
}

async function readCards(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('.civ-diplo-list-hud .dl-item')).map((item) => ({
    name: (item.querySelector('.dl-name') || {}).textContent || '',
    rows: Array.from(item.querySelectorAll('.dl-rel-row')).map((n) => n.textContent),
  })));
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[direct-neg-live] playwright nie znaleziony'); process.exit(1); }

  fs.mkdirSync(EVIDENCE, { recursive: true });
  buildBundle();

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push('[pageerror] ' + err.message));

    console.log('\n-- Bootstrap --');
    await gotoPlaytestMapa(page);
    await page.evaluate(() => window.__audienceRelTestDebug.setupThirdParties());
    await page.evaluate(() => window.__audienceRelTestDebug.setupListRelationsFixture());

    console.log('\n-- B. Lista dyplomacji: wiersze relacji na karcie (stan wstrzyknięty: wojna / sojusz / handel / pakt) --');
    await page.locator('[data-act="diplo"]').first().click();
    await page.waitForSelector('.civ-diplo-list-hud.open .dl-item', { timeout: 15000 });
    await wait(200);
    await page.screenshot({ path: path.join(EVIDENCE, 'lista-karta-relacje.png') });
    const cards = await readCards(page);
    const contactCount = await page.evaluate(() => window.__audienceRelTestDebug.getContacts().length);
    console.log('  karty:', JSON.stringify(cards));
    assert('każda karta ma dokładnie 3 wiersze Wojny / Sojusze / Handel', cards.length > 0
      && cards.every((c) => c.rows.length === 3 && c.rows[0].startsWith('Wojny: ')
        && c.rows[1].startsWith('Sojusze: ') && c.rows[2].startsWith('Handel: ')), cards);
    // Mgła wojny: lista pokazuje wyłącznie kontakty gracza (ten sam zbiór co audiencja).
    assert('liczba kart listy = liczba kontaktów (brak wycieku niespotkanych cywilizacji)',
      cards.length === contactCount, { cards: cards.length, contactCount });
    // Stan (wstrzyknięty + setupThirdParties): gracz „Ty” w wojnie z Chińczykami, sojuszu
    // z Inkami, handlu z Egiptem; pakt o nieagresji z Zulusami nie daje wiersza. Wiersze
    // partnerów zawierają też istniejące relacje AI (Grecy) z setupThirdParties — zgodnie
    // z dymkiem (ta sama funkcja danych), więc asercje są dokładne, nie tylko obecności.
    const byName = (n) => cards.find((c) => c.name === n);
    const chin = byName('Chińczycy');
    const ink = byName('Inkowie');
    const egy = byName('Egipt');
    const zul = byName('Zulusi');
    const grk = byName('Grecy');
    assert('Chińczycy: „Wojny: Grecy, Ty” (wojna gracza z Chińczykami)',
      !!chin && chin.rows[0] === 'Wojny: Grecy, Ty', chin && chin.rows);
    assert('Chińczycy: sojusze i handel „brak”', !!chin && chin.rows[1] === 'Sojusze: brak' && chin.rows[2] === 'Handel: brak', chin && chin.rows);
    assert('Inkowie: „Sojusze: Grecy, Ty” (sojusz wojskowy gracza)', !!ink && ink.rows[1] === 'Sojusze: Grecy, Ty', ink && ink.rows);
    assert('Egipt: „Handel: Grecy, Ty” (umowa szlaków gracza)', !!egy && egy.rows[2] === 'Handel: Grecy, Ty', egy && egy.rows);
    assert('Zulusi (tylko pakt o nieagresji z graczem): 3 x „brak”',
      !!zul && zul.rows.join('|') === 'Wojny: brak|Sojusze: brak|Handel: brak', zul && zul.rows);
    assert('Grecy (AI): wojna z Chińczykami i gracz „Ty” po stronie wojny; sojusz z Inkami',
      !!grk && grk.rows[0].includes('Ty') && grk.rows[0].includes('Chińczycy') && grk.rows[1] === 'Sojusze: Inkowie', grk && grk.rows);
    const bodyRowCount = await page.evaluate(() => document.querySelectorAll('.civ-diplo-list-hud .dl-rel-row').length);
    assert('wiersze relacji renderują się na każdej karcie (3 x liczba kart)', bodyRowCount === 3 * cards.length, bodyRowCount);

    console.log('\n-- A. Klik cywilizacji prowadzi od razu do negocjacji --');
    await page.locator('.civ-diplo-list-hud .dl-item').first().click();
    await page.waitForSelector('.civ-diplo-aud-box', { timeout: 15000 }).catch(() => {});
    await wait(300);
    const audOpen = await page.locator('.civ-diplo-aud-box').count();
    const summaryOpen = await page.locator('.civ-diplo-pair-summary').count();
    assert('po kliknięciu karty od razu widoczny ekran negocjacji/audiencji', audOpen > 0, audOpen);
    assert('pośredni dymek (.civ-diplo-pair-summary) NIE jest otwierany', summaryOpen === 0, summaryOpen);
    await page.screenshot({ path: path.join(EVIDENCE, 'po-kliknieciu-negocjacje.png') });

    await page.evaluate(() => window.__audienceRelTestDebug.closeAudience());
    await wait(150);

    console.log('\n-- E. Mobile 360 px: układ karty bez regresji --');
    await page.setViewportSize({ width: 360, height: 740 });
    await wait(300);
    // Czyste ujęcie karty: zamknij audiencję (zostawała pod listą na zrzucie), otwórz listę.
    await page.evaluate(() => window.__audienceRelTestDebug.closeAudience());
    await wait(150);
    if ((await page.locator('.civ-diplo-list-hud.open').count()) === 0) {
      await page.locator('[data-act="diplo"]').first().click();
      await page.waitForSelector('.civ-diplo-list-hud.open .dl-item', { timeout: 15000 });
    }
    await wait(200);
    if ((await page.locator('.civ-diplo-aud-box').count()) > 0) {
      await page.evaluate(() => window.__audienceRelTestDebug.closeAudience());
      await wait(200);
    }
    assert('360 px: lista dyplomacji otwarta na zrzucie',
      (await page.locator('.civ-diplo-list-hud.open .dl-item').count()) > 0,
      { list: await page.locator('.civ-diplo-list-hud.open').count() });
    await page.screenshot({ path: path.join(EVIDENCE, 'lista-karta-relacje-360px.png') });
    const layout = await page.evaluate(() => {
      const docOverflow = document.documentElement.scrollWidth - window.innerWidth;
      const items = Array.from(document.querySelectorAll('.civ-diplo-list-hud .dl-item'));
      let worst = 0;
      for (const it of items) {
        const ir = it.getBoundingClientRect();
        for (const r of it.querySelectorAll('.dl-rel-row')) {
          const rr = r.getBoundingClientRect();
          worst = Math.max(worst, rr.right - ir.right, ir.left - rr.left);
        }
      }
      return { innerWidth: window.innerWidth, docOverflow, worst, items: items.length };
    });
    assert('360 px: brak poziomego przewijania strony', layout.docOverflow <= 0, layout);
    assert('360 px: wiersze relacji mieszczą się w szerokości karty', layout.worst <= 1 && layout.items > 0, layout);

    console.log('\n-- D. Konsola czysta --');
    assert('zero console.error / pageerror w scenariuszu', consoleErrors.length === 0, consoleErrors.slice(0, 5));
  } finally {
    await browser.close();
  }
  console.log(`\ndiplomacy-direct-negotiation-live-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
