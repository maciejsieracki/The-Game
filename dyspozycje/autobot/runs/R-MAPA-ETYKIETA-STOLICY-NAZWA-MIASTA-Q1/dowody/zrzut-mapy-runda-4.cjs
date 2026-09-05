'use strict';
/**
 * zrzut-mapy-runda-4.cjs — R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1, runda 4, ZYWY dowod w Chromium.
 *
 * CO MUSI POKAZAC (kryterium 3 ratyfikacji rundy 4): uklad GESTY z WLASNA STOLICA GRACZA
 * majaca TRZY sloty na plakietce — korone stolicy, glif produkcji i segment WZROST%.
 * To wlasnie ta konfiguracja rozstrzyga o wartosci bazy `CITY_NAME_BUDGET_BASE`, bo trzeci
 * slot zabiera nazwie kolejne ~45 px budzetu (`render/cities.ts` wola `getCityGrowth`
 * WYLACZNIE dla miast gracza).
 *
 * DLACZEGO INNA SCIEZKA STARTU NIZ W RUNDACH 1–3: tamte uzywaly haka
 * `__cityStateStartUnitsTestDebug.startNewGame`, ktory ma NA STALE wpisane `civId: 'rzymianie'`
 * (main.ts, poza allowlista tego tematu — nie wolno go zmieniac). Gracz-Rzymianin startuje
 * w „Rzymie", nazwie krotkiej, ktora zmiescilaby sie w kazdym budzecie — zrzut niczego by nie
 * dowiodl. Dlatego partia jest zakladana PRAWDZIWYM kreatorem nowej gry, klikniecie po
 * kliknieciu (Menu → Nowa gra → Epoka Brazu → Zulusi → Rozpocznij gre), zeby stolica gracza
 * nazywala sie `uMgungundlovu` — najdluzsza nazwa z pul (213,9 px), ta, ktora przy bazie 260
 * byla w tej konfiguracji przycinana do `UMGUNGUND…`.
 *
 * PRODUKCJA (drugi slot) tez idzie sciezka gracza: klikniecie w miasto otwiera widok miasta,
 * przycisk „Buduj" przy budynku wstawia pozycje do kolejki, „Wroc na mape" zamyka widok.
 * Zaden hak testowy nie ustawia produkcji — w grze nie ma takiego haka i nie wolno go dodawac.
 *
 * MGLA: skrot `F` (`toggleDevFogFull`) — bez niego obce miasta nie wchodza do renderu.
 * PRZESYNCHRONIZOWANIE PLAKIETEK: `__eraTestDebug.endTurn()` (to samo, co przycisk „Zakoncz
 * ture") — `cityRenderer.sync` jest wolane na koniec tury, samo `refreshFog` go nie wola.
 *
 * C-001: build wylacznie `node_modules/vite/bin/vite.js`, `--outDir` POZA drzewem repo.
 *
 * Usage (z gra/):  node ../dyspozycje/autobot/runs/<ID>/dowody/zrzut-mapy-runda-4.cjs [--skip-build]
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const GRA = path.resolve(HERE, '..', '..', '..', '..', '..', 'gra');
const OUT_DIR = '/tmp/civ-mapa-etyk-r4-dist';

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

  await page.goto('file://' + indexHtml, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(
    () => !!window.__cityStateStartUnitsTestDebug && !!window.__sidePanelLinkTestDebug
      && !!window.__eraTestDebug,
    null, { timeout: 180000 },
  );
  console.log('Haki testowe obecne w produkcyjnym bundlu.');

  // --- (1) PRAWDZIWY kreator nowej gry: Zulusi, epoka Brazu -----------------------------
  // `visible=true` jest konieczne: menu glowne i kreator maja przyciski o tym samym napisie,
  // a ten z zamknietego ekranu zostaje w DOM jako niewidoczny.
  const widoczny = (sel) => page.locator(sel).locator('visible=true').first();
  await widoczny('button:has-text("Rozpocznij grę")').click();
  await wait(2500);
  await widoczny('button:has-text("Rozpocznij konfigurację")').click();
  await wait(2000);
  await page.getByText(/Epoka Br[aą]zu/i).first().click();
  await wait(800);
  await widoczny('button.nb.next').click();
  await wait(2000);
  await page.locator('div.card', { hasText: 'Zulusi' }).first().click();
  await wait(800);
  await widoczny('button.nb.next').click();
  await wait(2000);
  const podglad = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('div'))
      .find((d) => /Stolica\s+\S+,/.test(d.textContent || '') && d.children.length === 0);
    return el ? el.textContent.trim() : null;
  });
  console.log('Podglad startu z kreatora: ' + podglad);
  if (!podglad || !/uMgungundlovu/i.test(podglad)) {
    throw new Error('Kreator nie wybral Zulusow — podglad: ' + podglad);
  }
  // Przycisk startu kreatora nie jest elementem <button> (jest to klikalna plakietka),
  // wiec szukamy go po tekscie wsrod widocznych elementow bez dzieci.
  const startKreatora = page.locator(':is(button, div, span, a)')
    .filter({ hasText: /rozpocznij gr/i }).locator('visible=true').last();
  await startKreatora.click();

  await page.waitForSelector('.civ-map-load-overlay', { state: 'attached', timeout: 120000 });
  console.log('Generacja swiata w toku...');
  await page.waitForSelector('.civ-map-load-overlay', { state: 'detached', timeout: 600000 });
  await page.waitForFunction(() => {
    try {
      const s = window.__cityStateStartUnitsTestDebug.dumpState();
      return s.playerStartHex !== null && s.awaitingFirstPlayerCity === true && s.cities.length === 0;
    } catch (_) { return false; }
  }, null, { timeout: 180000 });
  console.log('Nowy swiat gotowy, czeka na stolice gracza.');

  console.log('foundPlayerStartCity -> '
    + await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()));
  await page.waitForFunction(() => {
    try {
      return window.__cityStateStartUnitsTestDebug.dumpState().cities.some((c) => c.ownerId !== 0);
    } catch (_) { return false; }
  }, null, { timeout: 180000 });

  const zamknijAudiencje = async () => {
    for (let i = 0; i < 5; i++) {
      if (await page.locator('.civ-diplo-aud').count() === 0) break;
      await page.keyboard.press('Escape');
      await wait(700);
    }
  };
  await zamknijAudiencje();

  // --- (2) mgla OFF + resync plakietek -------------------------------------------------
  await page.keyboard.press('f');
  await wait(1500);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  await page.waitForFunction(() => {
    try { return window.__cityStateStartUnitsTestDebug.dumpState().turn >= 2; }
    catch (_) { return false; }
  }, null, { timeout: 240000 });
  await wait(2500);
  await zamknijAudiencje();

  const state = await page.evaluate(() => {
    const s = window.__cityStateStartUnitsTestDebug.dumpState();
    return { menuCivId: s.menuCivId, cities: s.cities };
  });
  const stolicaGracza = state.cities.find((c) => c.ownerId === 0);
  if (!stolicaGracza) throw new Error('Brak stolicy gracza w partii');
  console.log('menuCivId=' + state.menuCivId + '  stolica gracza: ' + JSON.stringify(stolicaGracza));
  const pools = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'city-names-pools.json'), 'utf8'));
  console.log('  oczekiwana nazwa (miasta_cywilizacji[0]): "'
    + pools[state.menuCivId].miasta_cywilizacji[0] + '"   stan sprzed R3-2 (miasta_panstwa[0]): "'
    + pools[state.menuCivId].miasta_panstwa[0] + '"');

  // --- (3) kamera na stolice gracza — istniejacy skrot karty side-panelu ----------------
  const CARD_ID = 'border-march-violated';
  const naCel = async (cel) => {
    const want = await page.evaluate(({ q, r }) => window.__sidePanelLinkTestDebug.hexToWorld(q, r),
      { q: cel.q, r: cel.r });
    let cam = null;
    for (let a = 1; a <= 6; a++) {
      await page.evaluate(({ id, q, r }) => {
        const dbg = window.__sidePanelLinkTestDebug;
        dbg.setBorderMarchTarget(id, q, r);
        dbg.seedEvents([{
          id, icon: '⚠️', title: 'Granice naruszone',
          subtitle: 'Podglad stolicy — dowod R-MAPA-ETYKIETA-STOLICY', kind: 'diplo',
        }]);
      }, { id: CARD_ID, q: cel.q, r: cel.r });
      await wait(900);
      const box = await page.locator('.civ-side-panel .sp-event[data-id="' + CARD_ID + '"]')
        .boundingBox().catch(() => null);
      if (box !== null) {
        await page.mouse.click(box.x + 26, box.y + Math.min(14, box.height / 2)).catch(() => {});
        await wait(1400);
        cam = await page.evaluate(() => window.__sidePanelLinkTestDebug.cameraTarget());
        if (Math.abs(cam.x - want.x) <= 0.5 && Math.abs(cam.z - want.z) <= 0.5) break;
      }
      cam = null;
    }
    await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
    await wait(1200);
    if (cam === null) throw new Error('Kamera NIE stanela na celu ' + JSON.stringify(cel));
    console.log('Kamera: ' + JSON.stringify(cam) + '  cel-swiat: ' + JSON.stringify(want));
  };
  await naCel(stolicaGracza);

  // --- (4) PRODUKCJA sciezka gracza: klik w miasto -> „Buduj" -> „Wroc na mape" ---------
  const vp = page.viewportSize();
  await page.mouse.click(vp.width / 2, vp.height / 2);
  await wait(2500);
  const budujWidoczne = await page.locator('button:has-text("Buduj")').locator('visible=true').count();
  if (budujWidoczne === 0) throw new Error('Widok miasta sie nie otworzyl (brak przyciskow „Buduj")');
  await page.screenshot({ path: path.join(HERE, 'widok-miasta-runda4-produkcja.png') });
  // Pierwszy odblokowany budynek na liscie — dokladnie to, co klika gracz.
  await widoczny('button:has-text("Buduj")').click();
  await wait(1500);
  await widoczny('button:has-text("Wróć na mapę")').click();
  await wait(2500);
  await zamknijAudiencje();

  // Kolejny koniec tury: plakietka przebudowuje sie z aktywna produkcja (glif) i WZROST%.
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  await page.waitForFunction(() => {
    try { return window.__cityStateStartUnitsTestDebug.dumpState().turn >= 3; }
    catch (_) { return false; }
  }, null, { timeout: 240000 });
  await wait(2500);
  await zamknijAudiencje();

  // --- (5) zrzuty: zblizenie na stolice gracza + uklad gesty ----------------------------
  await naCel(stolicaGracza);
  await page.screenshot({ path: path.join(HERE, 'mapa-stolica-gracza-runda4-1600x1000.png') });
  await page.screenshot({
    path: path.join(HERE, 'mapa-stolica-gracza-runda4-zblizenie.png'),
    clip: { x: 480, y: 260, width: 760, height: 460 },
  });

  const hexDist = (a, b) => {
    const as = -a.q - a.r; const bs = -b.q - b.r;
    return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(as - bs));
  };
  const sasiedzi = state.cities
    .filter((c) => c.id !== stolicaGracza.id)
    .map((c) => ({ ...c, d: hexDist(c, stolicaGracza) }))
    .sort((a, b) => a.d - b.d);
  console.log('SASIEDZTWO stolicy gracza (odleglosc w heksach):');
  for (const s of sasiedzi.slice(0, 6)) {
    console.log('  ' + s.d + ' heksow  owner=' + s.ownerId + '  miasto-panstwo='
      + s.startCityState + '  typ=' + s.civTypeId);
  }

  await page.mouse.move(vp.width / 2, vp.height / 2);
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 240); await wait(250); }
  await wait(2500);
  console.log('Kamera po cofnieciu: '
    + JSON.stringify(await page.evaluate(() => window.__sidePanelLinkTestDebug.cameraTarget())));
  await page.screenshot({ path: path.join(HERE, 'mapa-uklad-gesty-runda4-1600x1000.png') });
  await page.screenshot({
    path: path.join(HERE, 'mapa-uklad-gesty-runda4-zblizenie.png'),
    clip: { x: 380, y: 180, width: 900, height: 640 },
  });
  console.log('Zrzuty rundy 4 zapisane w ' + HERE);

  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
