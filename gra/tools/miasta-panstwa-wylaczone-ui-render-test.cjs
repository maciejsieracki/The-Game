'use strict';
/**
 * miasta-panstwa-wylaczone-ui-render-test.cjs — P-USTAWIENIA-MIASTA-PANSTWA-WYLACZONE-Q1
 * (Maciej, 2026-09-03). Żywy render w Chromium (Playwright, prawdziwy zbudowany bundel,
 * nie jsdom — R-PROC-AUTOBOT.md §9 pkt 6a): kreator nowej gry, krok 4, modal "Zaawansowane
 * opcje" pokazuje DOKŁADNIE 4 opcje w "Trudność miast-państw"
 * (Łatwy/Normalny/Trudny/Wyłączone), wzorem "Barbarzyńcy" (Łatwy/Normalny/Trudny/Brak).
 *
 * Run from gra/:  node tools/miasta-panstwa-wylaczone-ui-render-test.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
// IZOLACJA (00-dispatch.md): jedyna dozwolona komenda buildu w tym temacie —
// outDir POZA drzewem repo (/tmp), zgodnie z R-PROC-AUTOBOT.md §9 pkt 1.
const OUT_DIR = '/tmp/civ-dist-miasta-panstwa-wylaczone';
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0;
let fail = 0;
function assert(label, cond) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else { fail++; console.error(` FAIL ${label}`); }
}

function buildBundle() {
  console.log('[mpw-ui-render-test] budowanie bundla (vite build, dozwolona komenda CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[mpw-ui-render-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[mpw-ui-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

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

/**
 * Znajdź wiersz `label` w adv-modal (struktura z newGameFlow.ts::showAdvancedModal:
 * `.adv-row` > (`.adv-lbl-row` > `.adv-lbl`) + (`.sctl` > `button.arr`(prev), `.sv`(wartość),
 * `button.arr`(next))) i przeczytaj pełny cykl wartości klikając "next" (drugi `.arr`).
 */
async function readCycleOptions(page, label) {
  const advRow = page.locator('.civ-newgame .adv-modal .adv-row', {
    has: page.locator('.adv-lbl', { hasText: label }),
  }).first();
  if ((await advRow.count()) === 0) return { found: false };
  const valueEl = advRow.locator('.sv').first();
  const nextBtn = advRow.locator('button.arr').nth(1);
  const startText = (await valueEl.textContent())?.trim() ?? null;
  const seen = startText !== null ? [startText] : [];
  for (let i = 0; i < 6; i++) {
    await nextBtn.click();
    await wait(60);
    const t = (await valueEl.textContent())?.trim();
    if (t === startText && seen.length > 1) break;
    if (!seen.includes(t)) seen.push(t);
    if (seen.length > 6) break;
  }
  return { found: true, startText, cycle: seen };
}

/** Ustaw wiersz `label` na dokładnie `target` (klikając "next" aż tekst się zgodzi, max 6 prób). */
async function setCycleTo(page, label, target) {
  const advRow = page.locator('.civ-newgame .adv-modal .adv-row', {
    has: page.locator('.adv-lbl', { hasText: label }),
  }).first();
  const valueEl = advRow.locator('.sv').first();
  const nextBtn = advRow.locator('button.arr').nth(1);
  for (let i = 0; i < 6; i++) {
    const t = (await valueEl.textContent())?.trim();
    if (t === target) return t;
    await nextBtn.click();
    await wait(60);
  }
  return (await valueEl.textContent())?.trim();
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[mpw-ui-render-test] playwright nie znaleziony.');
    process.exit(1);
  }

  buildBundle();

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  const consoleLogs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
      consoleLogs.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push('[pageerror] ' + err.message));

    await gotoAdvModal(page);

    console.log('\n-- KRYTERIUM 1: "Trudność miast-państw" pokazuje dokładnie 4 opcje --');
    const cs = await readCycleOptions(page, 'Trudność miast-państw');
    assert('wiersz "Trudność miast-państw" znaleziony w adv-modal', cs.found);
    if (cs.found) {
      console.log('   cykl wartości:', JSON.stringify(cs.cycle));
      assert('cykl zawiera dokładnie 4 unikatowe wartości', cs.cycle.length === 4);
      assert('cykl zawiera "Wyłączone"', cs.cycle.includes('Wyłączone'));
      assert('cykl zawiera "Łatwy"', cs.cycle.some((v) => v && v.includes('Łatwy')));
      assert('cykl zawiera "Trudny"', cs.cycle.some((v) => v && v.includes('Trudny')));
    }

    console.log('\n-- Kontrola regresji: "Barbarzyńcy" nadal ma dokładnie 4 opcje (Łatwy/Normalny/Trudny/Brak) --');
    const barb = await readCycleOptions(page, 'Barbarzyńcy');
    assert('wiersz "Barbarzyńcy" znaleziony', barb.found);
    if (barb.found) {
      console.log('   cykl wartości:', JSON.stringify(barb.cycle));
      assert('cykl "Barbarzyńcy" ma dokładnie 4 unikatowe wartości (nietknięty wzorzec)', barb.cycle.length === 4);
      assert('cykl "Barbarzyńcy" zawiera "Brak"', barb.cycle.includes('Brak'));
    }

    console.log('\n-- Podsumowanie ekranu generowania odzwierciedla wybór "Wyłączone" (csLabel, newGameFlow.ts) --');
    const finalVal = await setCycleTo(page, 'Trudność miast-państw', 'Wyłączone');
    assert('wartość ustawiona na "Wyłączone" przed zamknięciem modala', finalVal === 'Wyłączone');
    await page.locator('.civ-newgame .adv-modal button.adv-close').click();
    await wait(200);
    // "ROZPOCZNIJ GRE" -> curStep=5 -> renderGenStep() renderuje panel `.gp` z wierszem
    // "Trudnosc miast-panstw" ZANIM generacja się zakończy (buildParams() woła csLabel).
    await page.locator('.civ-newgame button.start').click();
    await wait(250);
    const summaryText = await page.locator('.civ-newgame .gp').innerText().catch(() => '');
    console.log('   panel .gp:', JSON.stringify(summaryText.slice(0, 400)));
    assert('panel podsumowania generowania zawiera "Wyłączone" w wierszu "Trudnosc miast-panstw"',
      summaryText.includes('Wyłączone'));

    console.log('\n-- ŻYWY dowód punktu podłączenia (main.ts applyMenuParams): log silnika po realnej generacji --');
    // Czekamy aż realna generacja świata (main.ts, applyClusterStartPlan) się zakończy i
    // wypisze "[NewGame] Mapa: ... rywale=N ..." — N to DOKŁADNIE _menuCityStates
    // faktycznie przekazane do applyClusterStartPlan() w URUCHOMIONEJ grze, nie w izolowanym
    // teście węzłowym (patrz miasta-panstwa-wylaczone-test.cjs dla tamtej strony dowodu).
    const mapLogDeadline = Date.now() + 150000;
    let mapLog = null;
    while (Date.now() < mapLogDeadline && !mapLog) {
      mapLog = consoleLogs.find((t) => t.includes('[NewGame] Mapa:'));
      if (!mapLog) await wait(500);
    }
    assert('log silnika "[NewGame] Mapa: ..." pojawił się (generacja faktycznie ruszyła, brak crasha)', !!mapLog);
    if (mapLog) {
      console.log('   log:', mapLog);
      assert('log silnika pokazuje rywale=0 (dokładnie _menuCityStates po fix w main.ts)', /rywale=0(\s|$)/.test(mapLog));
    } else {
      console.log('   [diag] ostatnie 15 linii konsoli:', JSON.stringify(consoleLogs.slice(-15), null, 2));
    }

    assert('\n[konsola] zero console.error / pageerror w całym scenariuszu', consoleErrors.length === 0);
    if (consoleErrors.length) console.error('   konsola:', consoleErrors.join(' | '));
  } finally {
    await browser.close();
  }

  console.log(`\n========================================\nmpw-ui-render-test: ${pass} pass, ${fail} fail\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('[mpw-ui-render-test] BŁĄD:', e && e.stack || e);
  process.exit(1);
});
