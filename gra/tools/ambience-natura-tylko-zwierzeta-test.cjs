'use strict';
/**
 * ambience-natura-tylko-zwierzeta-test.cjs — R-AMBIENT-NATURA-TYLKO-ZWIERZETA-Q1
 * (Operator Sonnet 5, effort=medium, runda 1, 2026-09-01, worktree izolowany).
 *
 * WYZWALACZ: właściciel zgłosił, że szum wiatru/liści/wody w kanale „odgłosy
 * natury" (ambience) przeszkadza — chce WYŁĄCZNIE odgłosy zwierząt (ptak/
 * świerszcz/wycie). Zmiana: wczesny return w `ambSchedule()`
 * (`src/audio/muzyka-antyczna.ts`) dla `e.typ === 'wiatr' | 'liscie' | 'woda'`,
 * PRZED jakąkolwiek alokacją Web Audio.
 *
 * DOWÓD (kryteria końca 1-2, „reguła przeciw samooszukiwaniu"): to jest silnik
 * z losowością (`rr(r, ...)`) i asynchronicznym harmonogramem — NIE wolno
 * uznać poprawności na podstawie samego odczytu kodu (literówka w warunku,
 * np. odwrócona negacja alboliteral 'wода' z inną literą, dałaby fałszywe
 * poczucie sukcesu). Test buduje REALNY bundle (vite build), odpala go w
 * headless Chromium, woła prawdziwy `startAmbience()` i czyta
 * `window.__ambienceTestDebug.getLog()` — lista przypięta bezpośrednio do
 * WYEKSPORTOWANEJ, PRAWDZIWEJ `ambSchedule()` (main.ts robi tylko
 * czytanie/zerowanie tej tablicy, zero reimplementacji logiki planowania).
 *
 * Pokrycie:
 *  A. Bootstrap ?playtest=mapa dobiega końca.
 *  B. Po startAmbience() i >=2 cyklach ambTick (>=700ms, tick co 350ms):
 *     ZERO zdarzeń 'wiatr'/'liscie'/'woda' w logu.
 *  C. W tym samym oknie: 'ptak', 'swierszcz' i 'wycie' NADAL są planowane
 *     (liczniki startowe compose'u sprawiają, że wszystkie trzy padają już
 *     w pierwszym oknie LOOKAHEAD=2.6s — nie trzeba przyspieszać realnego
 *     czasu ponad ~1s, żeby to zobaczyć).
 *  D. Zero console.error / pageerror.
 *  E (dowód anty-tautologia, tryb ręczny AMBIENCE_MUTATE=1): tymczasowa
 *     mutacja `ambSchedule()` (literówka w warunku, jak w kryterium końca 4
 *     „reguła przeciw samooszukiwaniu") — test na zmutowanym bundlu
 *     CZERWIENIEJE na asercji B, mutacja cofnięta.
 *
 * Bramka (z katalogu gra/): node tools/ambience-natura-tylko-zwierzeta-test.cjs
 * Tryb mutacyjny (ręcznie, dowód, NIE część normalnej zielonej bramki):
 *   AMBIENCE_MUTATE=1 node tools/ambience-natura-tylko-zwierzeta-test.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-ambience-natura-tylko-zwierzeta-test');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MUTATE = process.env.AMBIENCE_MUTATE === '1';

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

const SRC_MUZYKA = path.join(GRA_DIR, 'src', 'audio', 'muzyka-antyczna.ts');

/** Mutacja E (kryterium końca 4, "reguła przeciw samooszukiwaniu"): literówka
 *  w guardzie — 'woda' -> 'wода' (cyrylica 'о' zamiast łacińskiego 'o'), więc
 *  woda PRZESTAJE być odrzucana. Test na tym bundlu ma czerwienieć na B. */
function applyMutation() {
  const src = fs.readFileSync(SRC_MUZYKA, 'utf8');
  const anchor = "if (e.typ === 'wiatr' || e.typ === 'liscie' || e.typ === 'woda') return;";
  if (!src.includes(anchor)) throw new Error('applyMutation: kotwica nie znaleziona (źródło się zmieniło?)');
  const mutated = src.replace(anchor, "if (e.typ === 'wiatr' || e.typ === 'liscie' || e.typ === 'wоda') return;");
  fs.writeFileSync(SRC_MUZYKA, mutated, 'utf8');
  return src; // oryginał do przywrócenia
}

function buildBundle() {
  console.log('[ambience-natura-tylko-zwierzeta-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[ambience-natura-tylko-zwierzeta-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[ambience-natura-tylko-zwierzeta-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
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
    () => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 120000 },
  );
  await wait(300);
}

async function runScenario(chromium, { mutated }) {
  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  const local = { pass: 0, fail: 0 };
  function localAssert(label, cond, detail) {
    if (mutated) {
      console.log(`  [MUTOWANY] ${cond ? 'OK  ' : 'FAIL'} ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
      if (cond) local.pass++; else local.fail++;
    } else {
      assert(label, cond, detail);
    }
  }

  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push('[pageerror] ' + err.message));

    console.log('\n-- A. Bootstrap ?playtest=mapa dobiega końca --');
    await gotoPlaytestMapa(page);
    const world0 = await page.evaluate(() => window.__eraTestDebug.getWorldState());
    localAssert('bootstrap zakończony: citiesLen>0', world0.citiesLen > 0, world0);
    localAssert('hak __ambienceTestDebug obecny', await page.evaluate(() => !!window.__ambienceTestDebug), null);

    console.log('\n-- B. startAmbience() + >=2 cykle ambTick (>=700ms): wiatr/liscie/woda --');
    await page.evaluate(() => {
      window.__ambienceTestDebug.resetLog();
      window.__ambienceTestDebug.startAmbience();
    });
    await wait(900); // >= 2x tick 350ms + margines throttlingu headless
    let log = await page.evaluate(() => window.__ambienceTestDebug.getLog());
    console.log('   log e.typ po 900ms:', JSON.stringify(log));
    let forbidden = log.filter((t) => t === 'wiatr' || t === 'liscie' || t === 'woda');
    localAssert('B. ZERO zdarzeń wiatr/liscie/woda faktycznie zaplanowanych w ambience (okno >=700ms)', forbidden.length === 0, { log, forbidden });

    // C. ptak/swierszcz/wycie są rzadsze (start liczników w newState(): tPtak
    // rr(2,7), tSwierszcz rr(20,70), tWycie rr(25,70) — patrz recon dispatchu),
    // więc realny wall-clock musi dobiec do progu (ac.currentTime jest realnym
    // zegarem AudioContext, niemockowalnym przez timery JS/Playwright Clock —
    // przyspieszenie POZA zmianą stałych produkcyjnych nie jest tu wykonalne).
    // Pollujemy do ~85s (margines nad najgorszym przypadkiem rr(..,70)).
    console.log('\n-- C. czekanie (do ~85s) na ptak/swierszcz/wycie --');
    const deadline = Date.now() + 85000;
    let hasPtak = log.includes('ptak');
    let hasSwierszcz = log.includes('swierszcz');
    let hasWycie = log.includes('wycie');
    while (Date.now() < deadline && !(hasPtak && hasSwierszcz && hasWycie)) {
      await wait(5000);
      log = await page.evaluate(() => window.__ambienceTestDebug.getLog());
      hasPtak = log.includes('ptak');
      hasSwierszcz = log.includes('swierszcz');
      hasWycie = log.includes('wycie');
      console.log(`   +5s: ptak=${hasPtak} swierszcz=${hasSwierszcz} wycie=${hasWycie} (len=${log.length})`);
    }
    forbidden = log.filter((t) => t === 'wiatr' || t === 'liscie' || t === 'woda');
    localAssert('C. ptak nadal planowany', hasPtak, log);
    localAssert('C. swierszcz nadal planowany', hasSwierszcz, log);
    localAssert('C. wycie nadal planowany', hasWycie, log);
    localAssert('C. nadal ZERO wiatr/liscie/woda po całym oknie oczekiwania', forbidden.length === 0, { log, forbidden });

    await page.evaluate(() => window.__ambienceTestDebug.stopAmbience());

    console.log('\n-- D. Konsola czysta --');
    localAssert('zero console.error / pageerror w całym scenariuszu', consoleErrors.length === 0, consoleErrors);
    if (consoleErrors.length) console.error('   konsola:', consoleErrors.join(' | '));

    await page.close();
  } finally {
    await browser.close();
  }

  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (e) { /* nieistotne */ }
  return local;
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[ambience-natura-tylko-zwierzeta-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
    process.exit(1);
  }

  if (MUTATE) {
    console.log('[ambience-natura-tylko-zwierzeta-test] TRYB MUTACYJNY -- mutuję źródło (literówka \'woda\'->\'w\\u043eda\'), oczekuję CZERWONEGO wyniku na asercji B.');
    const original = applyMutation();
    let result;
    try {
      buildBundle();
      result = await runScenario(chromium, { mutated: true });
    } finally {
      fs.writeFileSync(SRC_MUZYKA, original, 'utf8');
      console.log('[ambience-natura-tylko-zwierzeta-test] źródło przywrócone do oryginału.');
    }
    console.log(`\n[MUTOWANY PRZEBIEG] ${result.pass} pass, ${result.fail} fail`);
    process.exit(result.fail > 0 ? 0 : 1);
  }

  buildBundle();
  const result = await runScenario(chromium, { mutated: false });
  void result;

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[ambience-natura-tylko-zwierzeta-test] BŁĄD:', e);
  process.exit(1);
});
