'use strict';
/**
 * improvement-growth-live-test.cjs -- R-WEB-ECONOMY-IMPROVEMENT-GROWTH-WITH-ERA-NEWGAME-TOGGLE-Q1
 * (Operator obrona r1: odpowiedź na Evaluator zarzut 1 — dowód z żywego Chromium).
 *
 * Dwa REALNE starty gry (real vite build, real Chromium), po jednym na stan ustawienia:
 *   WYŁ. (domyślnie): plon farmy (zywnosc, baza 3) i produkcja tartaku (baza 50) w epokach 1/2/3
 *                     mają być STAŁE: farma 3/3/3, tartak 50/50/50;
 *   WŁ.:              dawny wzrost z epoką: farma 3/4/5, tartak 50/75/113.
 * Start idzie przez `__cityStateStartUnitsTestDebug.startNewGame(...)` -> REALNE `doStartGame`
 * -> `applyMenuParams` (main.ts), które ustawia flagę w `econ-era-rebalance`. Odczyt przez
 * `probeWzrostYields()` (main.ts) woła te same funkcje, których używa silnik (improvementYieldForEra,
 * resourceProductionAmountForEra), w żywym bundlu, z flagą ustawioną przez start gry.
 *
 * Zakres dowodu: ścieżka startu (doStartGame -> applyMenuParams -> flaga -> funkcje plonów) w żywej grze.
 * NIE pokrywa: migrateAdvanced (kreator, parsowanie pola z wyboru) ani restoreGameFromSave (wczytanie zapisu)
 * — te są pinowane źródłowo w tools/improvement-growth-toggle-test.cjs (sekcja G8).
 *
 * Bramka (z katalogu gra/): node tools/improvement-growth-live-test.cjs -- exit 0 = zielona.
 */

const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.join(os.tmpdir(), `civ-improvement-growth-live-${RUN_ID}-${TMPDIR_RUN_ID}`);
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else { fail++; console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildBundle() {
  console.log('[improvement-growth-live-test] budowanie bundla (vite build poza repo)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) throw new Error('Build nie wyprodukował index.html');
  console.log('[improvement-growth-live-test] build OK.');
}

async function runOnce(chromium, browser, wzrost) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug, undefined, { timeout: 120000 });
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await page.evaluate((w) => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 0, 'normal', w), wzrost);
  const deadline = Date.now() + 240000;
  let st = null;
  while (Date.now() < deadline) {
    st = await page.evaluate(() => {
      const d = window.__cityStateStartUnitsTestDebug.dumpState();
      const overlay = Array.from(document.querySelectorAll('*')).some(
        (el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null,
      );
      return { ready: !overlay && d.awaitingFirstPlayerCity === true, overlay };
    });
    if (st.ready) break;
    await wait(500);
  }
  if (!st || !st.ready) throw new Error('świat nie został wygenerowany w czasie: ' + JSON.stringify(st));
  await wait(400);
  const probe = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.probeWzrostYields());
  await page.close();
  return { probe, errors };
}

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[improvement-growth-live-test] playwright nie znaleziony.'); process.exit(1); }
  buildBundle();
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    console.log('== start WYŁ. (domyślnie) ==');
    const off = await runOnce(chromium, browser, false);
    console.log('  odczyt: ' + JSON.stringify(off.probe));
    assert('WYŁ.: flaga w żywej grze = false', off.probe.flag === false, off.probe.flag);
    assert('WYŁ.: farma zywnosc 3/3/3 (stałe z Kamienia)', eq(off.probe.farmaZywnosc, [3, 3, 3]), off.probe.farmaZywnosc);
    assert('WYŁ.: tartak produkcja 50/50/50', eq(off.probe.tartakProdukcja, [50, 50, 50]), off.probe.tartakProdukcja);
    assert('WYŁ.: brak błędów strony', off.errors.length === 0, off.errors);

    console.log('== start WŁ. (dawny wzrost z epoką) ==');
    const on = await runOnce(chromium, browser, true);
    console.log('  odczyt: ' + JSON.stringify(on.probe));
    assert('WŁ.: flaga w żywej grze = true', on.probe.flag === true, on.probe.flag);
    assert('WŁ.: farma zywnosc 3/4/5 (+1 Brąz, +2 Żelazo)', eq(on.probe.farmaZywnosc, [3, 4, 5]), on.probe.farmaZywnosc);
    assert('WŁ.: tartak produkcja 50/75/113 (×1,5 na epokę)', eq(on.probe.tartakProdukcja, [50, 75, 113]), on.probe.tartakProdukcja);
    assert('WŁ.: brak błędów strony', on.errors.length === 0, on.errors);
  } finally {
    await browser.close();
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }
  console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
