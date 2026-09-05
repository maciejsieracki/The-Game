'use strict';
/**
 * zrzut-mapy-runda-3.cjs — R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1, runda 3, ZYWY dowod w Chromium.
 *
 * ROZNICA WOBEC RUNDY 2: ten sam scenariusz i ta sama partia (seed 778899), ale dowodzi stanu
 * po R3-1 (baza budzetu nazwy 200 -> 260 px) i po R3-2 (stolica GRACZA tez z
 * `miasta_cywilizacji[0]`). Zrzut robiony jest w ukladzie GESTYM — kamera cofnieta tak, zeby
 * w kadrze byla stolica RAZEM z sasiadujacymi miastami-panstwami klastra — bo warunek twardy
 * rundy 3 dotyczy zachodzenia plakietki na sasiedztwo, a na odosobnionym miescie tego nie
 * widac. Skrypt wypisuje tez nazwy WSZYSTKICH miast w partii razem z oczekiwaniem z puli.
 *
 * PO CO: plakietka miasta na mapie to sprite THREE.js z tekstura z canvasu, nie DOM —
 * zadna asercja tekstowa nie pokaze, czy szersza etykieta rozjezdza plakietke albo zachodzi
 * na sasiednie heksy. Jedynym dowodem jest zrzut. Liczbowa strone tego samego pytania
 * (szerokosc plakietki w jednostkach swiata wobec odstepu miast) mierzy osobny dowod
 * `pomiar-plakietki-runda-3.cjs`.
 *
 * JAK (zero nowego kodu w grze — wylacznie istniejace haki i skroty):
 *  1. `vite build` do katalogu POZA drzewem repo (C-001: vite bezposrednio z node_modules,
 *     zero `npm run build`, zero dev servera) — testujemy artefakt produkcyjny.
 *  2. REALNA, generowana partia przez `__cityStateStartUnitsTestDebug.startNewGame`
 *     (doStartGame → applyClusterStartPlan) + `foundPlayerStartCity()` — ta sama sciezka,
 *     co klik gracza w podswietlony heks startu. Obce klastry sa DEFERRED: spawnuja sie
 *     dopiero z wnetrza `tryFoundPlayerCityAt`, wiec bez tego kroku na mapie jest
 *     wylacznie miasto gracza.
 *     PULAPKA (zlapana w rundzie 1): na `startNewGame` trzeba poczekac az ZNIKNIE nakladka
 *     „Tworzenie swiata" (`.civ-map-load-overlay`). Wczesniej `dumpState()` opisuje jeszcze
 *     POPRZEDNI swiat i `foundPlayerStartCity()` zaklada miasto w swiecie, ktory zaraz
 *     zostanie zastapiony — konczy sie mapa z jednym miastem gracza i zerem obcych.
 *  3. `F` (`toggleDevFogFull`) gasi mgle — `cityFogVisible` zwraca wtedy true dla obcych
 *     miast i wchodza one do renderu.
 *  4. Kamera na obca stolice istniejacym skrotem karty side-panelu:
 *     `setBorderMarchTarget(id, q, r)` + klik karty → `openSidePanelEventLink` →
 *     `camCtrl.focusAt`. Pozycja kamery jest potem POROWNANA z `hexToWorld(q, r)` —
 *     bez tego zrzut moglby pokazywac przypadkowy fragment mapy.
 *
 * KTORE MIASTO JEST OBCA STOLICA: `capitalCityIdForOwner` = jawne wyznaczenie albo
 * `oldestCityOfOwner`. Swiezo zespawnowany klaster ma po JEDNYM miescie na wlasciciela,
 * wiec to jedyne miasto jest jego stolica. Miasta-panstwa (`startCityState`) sa wykluczone
 * z galezi (i z korony) — dlatego cel wybieramy sposrod obcych miast BEZ tej flagi.
 *
 * Usage (z gra/):
 *   node ../dyspozycje/autobot/runs/<ID>/dowody/zrzut-mapy.cjs [--skip-build]
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const GRA = path.resolve(HERE, '..', '..', '..', '..', '..', 'gra');
const OUT_DIR = path.join(os.tmpdir(), 'civ-mapa-etyk-stolicy-dist');

let chromium;
try { ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright'))); }
catch (e) { console.error('Brak playwright: ' + e.message); process.exit(1); }

function findChromiumExecutable() {
  const base = '/opt/pw-browsers';
  if (!fs.existsSync(base)) return null;
  const dirs = fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort();
  for (const d of dirs.reverse()) {
    const p = path.join(base, d, 'chrome-linux', 'chrome');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildDist() {
  if (process.argv.includes('--skip-build') && fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    console.log('Pomijam build — uzywam ' + OUT_DIR);
    return;
  }
  console.log('vite build -> ' + OUT_DIR + ' (poza drzewem repo, C-001)...');
  execFileSync(process.execPath, [
    path.join(GRA, 'node_modules', 'vite', 'bin', 'vite.js'),
    'build', '--outDir', OUT_DIR, '--emptyOutDir',
  ], { cwd: GRA, stdio: 'inherit' });
}

(async () => {
  buildDist();
  const indexHtml = path.join(OUT_DIR, 'index.html');
  if (!fs.existsSync(indexHtml)) throw new Error('Brak artefaktu ' + indexHtml);

  const execPath = findChromiumExecutable();
  const browser = await chromium.launch(
    execPath ? { executablePath: execPath, args: ['--no-sandbox', '--use-gl=swiftshader'] }
             : { args: ['--no-sandbox'] },
  );
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  page.on('pageerror', (e) => console.log('[pageerror] ' + e.message));

  await page.goto('file://' + indexHtml, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(
    () => !!window.__cityStateStartUnitsTestDebug && !!window.__sidePanelLinkTestDebug,
    null, { timeout: 120000 },
  );
  console.log('Haki testowe obecne w produkcyjnym bundlu.');

  // --- (1) REALNA, generowana partia -------------------------------------------------
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 6));
  await page.waitForSelector('.civ-map-load-overlay', { state: 'attached', timeout: 60000 });
  console.log('Generacja swiata w toku...');
  await page.waitForSelector('.civ-map-load-overlay', { state: 'detached', timeout: 300000 });
  await page.waitForFunction(() => {
    try {
      const s = window.__cityStateStartUnitsTestDebug.dumpState();
      return s.playerStartHex !== null && s.awaitingFirstPlayerCity === true && s.cities.length === 0;
    } catch (_) { return false; }
  }, null, { timeout: 120000 });
  console.log('Nowy swiat gotowy, czeka na stolice gracza.');

  const founded = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  console.log('foundPlayerStartCity -> ' + founded);
  await page.waitForFunction(() => {
    try {
      return window.__cityStateStartUnitsTestDebug.dumpState().cities.some((c) => c.ownerId !== 0);
    } catch (_) { return false; }
  }, null, { timeout: 120000 });

  // --- (2) mgla OFF (skrot F) + wymuszenie re-syncu plakietek -----------------------
  // `toggleDevFogFull` → `refreshFog` przelacza widocznosc MODELI miast
  // (`cityRenderer.applyFogVisibility`), ale plakietki (statChips) powstaja dopiero
  // w `cityRenderer.sync(cities, _cityRenderOpts())`, ktorego refreshFog nie wola.
  // Realnym zdarzeniem, ktore ten sync wykonuje, jest koniec tury (main.ts ~32120) —
  // uzywamy istniejacego `__eraTestDebug.endTurn()`, czyli dokladnie tego, co robi
  // przycisk „Zakoncz ture". Bez tego kroku obce miasto jest na mapie, ale BEZ etykiety.
  await page.keyboard.press('f');
  await wait(1500);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  await page.waitForFunction(() => {
    try { return window.__cityStateStartUnitsTestDebug.dumpState().turn >= 2; }
    catch (_) { return false; }
  }, null, { timeout: 180000 });
  await wait(2000);
  console.log('Tura zakonczona — plakietki przesynchronizowane.');

  const state = await page.evaluate(() => {
    const s = window.__cityStateStartUnitsTestDebug.dumpState();
    return { menuCivId: s.menuCivId, cities: s.cities };
  });
  console.log('Miasta w partii: ' + JSON.stringify(state.cities));

  // Kandydaci: obce miasta BEZ flagi miasta-panstwa i obcego typu cywilizacji = stolice
  // obcych klastrow. Preferujemy Chinczykow, bo to DOKLADNIE przypadek ze zrzutu
  // wlasciciela („CHINCZYCY" na plakietce) — jesli seed ich nie postawil, bierzemy
  // dowolna inna obca stolice; galaz kodu jest ta sama dla kazdej cywilizacji.
  const capitals = state.cities.filter(
    (c) => c.ownerId !== 0 && c.startCityState === false && c.civTypeId !== state.menuCivId,
  );
  const target = capitals.find((c) => c.civTypeId === 'chinczycy')
    || capitals[0]
    || state.cities.find((c) => c.ownerId !== 0 && c.startCityState === false);
  if (!target) throw new Error('Brak obcej stolicy w wygenerowanej partii');
  console.log('CEL (obca stolica): ' + JSON.stringify(target));

  // R2-2 — czego szukac na zrzucie. `dumpState()` (main.ts, poza allowlista tego tematu)
  // NIE wystawia pola `name`, wiec nazwy nie da sie tu odczytac programowo bez dokladania
  // pola do gry; napis na plakietce czytamy z OBRAZU, a ta lista mowi, co ma na nim byc.
  const pools = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'city-names-pools.json'), 'utf8'));
  for (const c of capitals) {
    const e = pools[c.civTypeId];
    console.log('  stolica AI ' + String(c.civTypeId).padEnd(12)
      + ' oczekiwana na plakietce (miasta_cywilizacji[0]): "' + (e ? e.miasta_cywilizacji[0] : '?')
      + '"   stan sprzed R2-2 (miasta_panstwa[0]): "' + (e ? e.miasta_panstwa[0] : '?') + '"');
  }
  // R3-2 — stolica GRACZA. `startNewGame` w haku gra Rzymianami, wiec obie pule daja tu
  // „Rzym"; roznica ujawnia sie u Chinczykow/Slowian i jest mierzona bramka (E7/E7b).
  const ePl = pools[state.menuCivId];
  console.log('  stolica GRACZA ' + String(state.menuCivId).padEnd(12)
    + ' oczekiwana (miasta_cywilizacji[0]): "' + (ePl ? ePl.miasta_cywilizacji[0] : '?')
    + '"   stan sprzed R3-2 (miasta_panstwa[0]): "' + (ePl ? ePl.miasta_panstwa[0] : '?') + '"');

  // Zalozenie stolicy nawiazuje pierwszy kontakt dyplomatyczny — na wierzchu potrafi
  // wyladowac audiencja (`.civ-diplo-aud`), ktora przechwytuje klikniecia. Zamykamy ja
  // klawiszem Escape (ta sama sciezka co u gracza), zanim dotkniemy panelu wydarzen.
  for (let i = 0; i < 4; i++) {
    if (await page.locator('.civ-diplo-aud').count() === 0) break;
    await page.keyboard.press('Escape');
    await wait(700);
  }

  // --- (3) kamera na cel — istniejacy skrot karty side-panelu ------------------------
  const CARD_ID = 'border-march-violated';
  const want = await page.evaluate(
    ({ q, r }) => window.__sidePanelLinkTestDebug.hexToWorld(q, r),
    { q: target.q, r: target.r },
  );

  // `refreshD1bHud` przebudowuje karty panelu przy kazdym odswiezeniu HUD, wiec wezel
  // DOM zasiany sekunde wczesniej potrafi zniknac tuz przed klikiem. Dlatego petla:
  // zasiej → klik w swiezo odczytany prostokat → sprawdz kamere; sukces konczy petle.
  let cam = null;
  for (let attempt = 1; attempt <= 6; attempt++) {
    await page.evaluate(({ id, q, r }) => {
      const dbg = window.__sidePanelLinkTestDebug;
      dbg.setBorderMarchTarget(id, q, r);
      dbg.seedEvents([{
        id, icon: '⚠️', title: 'Granice naruszone',
        subtitle: 'Podglad obcej stolicy — dowod R-MAPA-ETYKIETA-STOLICY',
        kind: 'diplo',
      }]);
    }, { id: CARD_ID, q: target.q, r: target.r });
    await wait(900);
    const box = await page.locator('.civ-side-panel .sp-event[data-id="' + CARD_ID + '"]')
      .boundingBox().catch(() => null);
    if (box !== null) {
      await page.mouse.click(box.x + 26, box.y + Math.min(14, box.height / 2)).catch(() => {});
      await wait(1400);
      cam = await page.evaluate(() => window.__sidePanelLinkTestDebug.cameraTarget());
      if (Math.abs(cam.x - want.x) <= 0.5 && Math.abs(cam.z - want.z) <= 0.5) break;
    }
    console.log('proba ' + attempt + ': kamera=' + JSON.stringify(cam));
    cam = null;
  }
  console.log('Kamera: ' + JSON.stringify(cam) + '  cel-swiat: ' + JSON.stringify(want));
  if (cam === null) throw new Error('Kamera NIE stanela na obcej stolicy');

  await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
  await wait(1500);

  await page.screenshot({ path: path.join(HERE, 'mapa-obca-stolica-runda3-1600x1000.png') });
  await page.screenshot({
    path: path.join(HERE, 'mapa-obca-stolica-runda3-zblizenie.png'),
    clip: { x: 500, y: 250, width: 700, height: 500 },
  });

  // --- (4) UKLAD GESTY: ile miast stoi obok celu i jak blisko -------------------------
  // Warunek twardy rundy 3 dotyczy zachodzenia plakietki na SASIEDZTWO, wiec zrzut musi
  // pokazac stolice RAZEM z sasiadami. Odleglosc w heksach liczona metryka szesciennoscienna
  // (ta sama, ktorej uzywa `MIN_DIST_START_CITY_STATE`), nie euklidesowa na (q, r).
  const hexDist = (a, b) => {
    const as = -a.q - a.r; const bs = -b.q - b.r;
    return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(as - bs));
  };
  const sasiedzi = state.cities
    .filter((c) => c.id !== target.id)
    .map((c) => ({ ...c, d: hexDist(c, target) }))
    .sort((a, b) => a.d - b.d);
  console.log('SASIEDZTWO celu (odleglosc w heksach):');
  for (const s of sasiedzi.slice(0, 6)) {
    console.log('  ' + s.d + ' heksow  owner=' + s.ownerId + '  miasto-panstwo='
      + s.startCityState + '  typ=' + s.civTypeId);
  }

  // Cofniecie kamery kolkiem myszy (ta sama sciezka co u gracza) — zeby w kadrze byla
  // stolica i sasiadujace miasta-panstwa, a nie samo miasto w zblizeniu.
  const vp = page.viewportSize();
  await page.mouse.move(vp.width / 2, vp.height / 2);
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 240); await wait(250); }
  await wait(2500);
  const camOut = await page.evaluate(() => window.__sidePanelLinkTestDebug.cameraTarget());
  console.log('Kamera po cofnieciu: ' + JSON.stringify(camOut));

  await page.screenshot({ path: path.join(HERE, 'mapa-uklad-gesty-runda3-1600x1000.png') });
  await page.screenshot({
    path: path.join(HERE, 'mapa-uklad-gesty-runda3-zblizenie.png'),
    clip: { x: 380, y: 180, width: 900, height: 640 },
  });
  console.log('Zrzuty ukladu gestego zapisane w ' + HERE);

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
