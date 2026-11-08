'use strict';
/**
 * city-clears-forest-live-test.cjs — R-WEB-CITY-CLEARS-FOREST-Q1 (realny Chromium).
 *
 * Realny vite build do katalogu tymczasowego POZA repo (bez `npm run build`), realny headless
 * Chromium, REALNA „Nowa Gra" (`doStartGame`) i REALNE `tryFoundPlayerCityAt`.
 *  L1  stolica startowa gracza na heksie z lasem (las wstawiony fixture'em na playerStartHex PRZED
 *      założeniem) -> po założeniu brak Las; miasta-państwa/klastry (spawn po stolicy) bez Las;
 *  L2  drugie miasto gracza na heksie z lasem + tartakiem -> brak Las, brak tartaku;
 *  L3  kontrola: leśne heksy BEZ miasta zostają lasem (liczba lasów spada o <= liczbę założonych miast);
 *  L4  stary zapis: las+tartak pod KAŻDYM miastem -> REALNY snapshot/restore/reapply -> brak Las,
 *      brak tartaku; drugi przebieg bez zmian (idempotencja);
 *  L5  granica tury: las wstawiony pod miasto -> REALNY endTurn -> brak Las;
 *  C   zero pageerror / console.error.
 * Zrzut: <evidence>/forest-city-*.png.   Usage (z gra/): node tools/city-clears-forest-live-test.cjs [evidenceDirAbs]
 * NIE_ZMIERZONO live: miasto AI (cmd foundCityAt, main.ts) — pokryte okablowaniem w city-clears-forest-test.cjs B1.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-city-clears-forest-'));
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');
const EVIDENCE = process.argv[2] || path.join(GRA_DIR, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-CITY-CLEARS-FOREST-Q1', 'evidence');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
const assert = (label, cond, detail) => {
  if (cond) { pass++; console.log('  OK  ' + label); }
  else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({
      headless: true, executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}
async function pollUntil(page, label, fn, timeoutMs) {
  const end = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < end) {
    last = await page.evaluate(fn);
    if (last && last.ready) return last;
    await wait(500);
  }
  throw new Error('pollUntil(' + label + '): timeout ' + JSON.stringify(last));
}

async function main() {
  const { chromium } = require('playwright');
  fs.mkdirSync(EVIDENCE, { recursive: true });
  console.log('[city-clears-forest-live] vite build ->', OUT_DIR);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`, { cwd: GRA_DIR, stdio: 'pipe' });

  const browser = await launchBrowser(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__cityForestTestDebug && !!window.__eraTestDebug, undefined, { timeout: 120000 });
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await wait(200);

  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 4, 'normal'));
  await pollUntil(page, 'world', () => {
    const st = window.__cityStateStartUnitsTestDebug.dumpState();
    const overlay = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
  }, 240000);

  const LAS = await page.evaluate(() => window.__cityForestTestDebug.lasValue());
  const forestBefore = await page.evaluate(() => window.__cityForestTestDebug.forestHexCount());
  console.log('  [info] lasy na mapie przed zalozeniem: ' + forestBefore + ', Las=' + JSON.stringify(LAS));

  // L1: las pod startowa stolica
  const start = await page.evaluate(() => window.__cityForestTestDebug.playerStartHex());
  await page.evaluate(([q, r]) => window.__cityForestTestDebug.plantForest(q, r, true), [start.q, start.r]);
  assert('L1.0 fixture: playerStartHex ma Las przed zalozeniem', (await page.evaluate(([q, r]) => window.__cityForestTestDebug.hexNakladka(q, r), [start.q, start.r])) === LAS);
  const founded = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  assert('L1.1 REALNE zalozenie stolicy gracza zwrocilo true', founded === true);
  await pollUntil(page, 'cs-spawned', () => {
    const st = window.__cityStateStartUnitsTestDebug.dumpState();
    return { ready: st.awaitingFirstPlayerCity === false && st.cities.some(c => c.ownerId === 0) };
  }, 60000);
  await wait(400);
  let hexes = await page.evaluate(() => window.__cityForestTestDebug.citiesHexState());
  const cs = hexes.filter(h => h.startCityState);
  assert('L1.2 stolica gracza: brak Las i brak tartaku', hexes.filter(h => h.ownerId === 0).every(h => h.nakladka !== LAS && !h.layers.includes('tartak')), hexes.filter(h => h.ownerId === 0));
  assert('L1.3 miasta-panstwa/klastry istnieja (n=' + cs.length + ') i zadne nie stoi na Las', cs.length >= 1 && cs.every(h => h.nakladka !== LAS), cs);
  assert('L1.4 ZADNE miasto na mapie (n=' + hexes.length + ') nie stoi na Las', hexes.every(h => h.nakladka !== LAS), hexes.filter(h => h.nakladka === LAS));
  await page.screenshot({ path: path.join(EVIDENCE, 'forest-city-L1-stolica.png') });

  // L2: drugie miasto gracza na lesie + tartaku
  const cands = await page.evaluate(() => window.__cityForestTestDebug.foundCandidates(1));
  assert('L2.0 jest kandydat na drugie miasto (REALNA canFoundPlayerCityAt)', cands.length >= 1);
  let secondOk = false;
  if (cands.length) {
    const c = cands[0];
    await page.evaluate(([q, r]) => window.__cityForestTestDebug.plantForest(q, r, true), [c.q, c.r]);
    assert('L2.1 fixture: kandydat ma Las', (await page.evaluate(([q, r]) => window.__cityForestTestDebug.hexNakladka(q, r), [c.q, c.r])) === LAS);
    secondOk = await page.evaluate(([q, r]) => window.__cityForestTestDebug.foundPlayerCity(q, r), [c.q, c.r]);
    assert('L2.2 REALNE zalozenie drugiego miasta zwrocilo true', secondOk === true);
    hexes = await page.evaluate(() => window.__cityForestTestDebug.citiesHexState());
    const mine = hexes.find(h => h.q === c.q && h.r === c.r);
    assert('L2.3 drugie miasto: brak Las i brak tartaku', !!mine && mine.nakladka !== LAS && !mine.layers.includes('tartak'), mine);
  }
  // L3: kontrola — lasy poza miastami zostaja
  const forestAfter = await page.evaluate(() => window.__cityForestTestDebug.forestHexCount());
  const nCities = (await page.evaluate(() => window.__cityForestTestDebug.citiesHexState())).length;
  assert('L3 lasy bez miasta zostaja: ' + forestBefore + ' -> ' + forestAfter + ' (spadek <= liczba miast ' + nCities + ' + fixture)',
    forestAfter >= forestBefore - nCities && forestAfter > 0);

  // L4: stary zapis — las+tartak pod KAZDYM miastem, REALNY snapshot/restore/reapply
  hexes = await page.evaluate(() => window.__cityForestTestDebug.citiesHexState());
  await page.evaluate((hs) => { for (const h of hs) window.__cityForestTestDebug.plantForest(h.q, h.r, true); }, hexes);
  let planted = await page.evaluate(() => window.__cityForestTestDebug.citiesHexState());
  assert('L4.0 fixture „stary zapis": las+tartak pod KAZDYM z ' + planted.length + ' miast', planted.every(h => h.nakladka === LAS && h.layers.includes('tartak')));
  await page.evaluate(() => window.__cityForestTestDebug.reloadLikeLoad());
  await wait(500);
  let after = await page.evaluate(() => window.__cityForestTestDebug.citiesHexState());
  assert('L4.1 po wczytaniu: zadne miasto nie stoi na Las', after.every(h => h.nakladka !== LAS), after.filter(h => h.nakladka === LAS).length);
  assert('L4.2 po wczytaniu: tartak pod miastem zniknal', after.every(h => !h.layers.includes('tartak')));
  const f1 = await page.evaluate(() => window.__cityForestTestDebug.forestHexCount());
  await page.evaluate(() => window.__cityForestTestDebug.reloadLikeLoad());
  await wait(300);
  const f2 = await page.evaluate(() => window.__cityForestTestDebug.forestHexCount());
  assert('L4.3 idempotencja: drugie wczytanie nie zmienia liczby lasow (' + f1 + ' == ' + f2 + ')', f1 === f2);
  await page.screenshot({ path: path.join(EVIDENCE, 'forest-city-L4-po-wczytaniu.png') });

  // L5: granica tury
  const one = after[0];
  await page.evaluate(([q, r]) => window.__cityForestTestDebug.plantForest(q, r, false), [one.q, one.r]);
  const t0 = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const tEnd = Date.now();
  while (Date.now() - tEnd < 60000) {
    const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
    const t = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    if (!inProg && t > t0) break;
    await wait(200);
  }
  const t1 = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  assert('L5.0 REALNY endTurn przesunal ture (' + t0 + ' -> ' + t1 + ')', t1 > t0);
  const nk = await page.evaluate(([q, r]) => window.__cityForestTestDebug.hexNakladka(q, r), [one.q, one.r]);
  assert('L5.1 las wstawiony pod miasto zniknal po granicy tury', nk !== LAS, nk);

  assert('C zero pageerror/console.error (n=' + errors.length + ')', errors.length === 0, errors.slice(0, 5));
  await browser.close();
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* ignore */ }
  console.log('\ncity-clears-forest-live-test: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('[city-clears-forest-live] BLAD:', e && e.stack || e); process.exit(2); });
