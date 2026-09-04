'use strict';
/**
 * mgla-sciezka-live-test.cjs — P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1.
 *
 * DOWOD Z ZYWEJ PRZEGLADARKI (R-PROC-AUTOBOT.md §9 pkt 6a) — zarzut 4 Evaluatora rundy 1.
 *
 * PO CO. Ten sam blad zglaszany byl CZTERY razy, a trzy poprzednie rundy przeszly zielone
 * bramki KONTRAKTOWE przy nadal widocznym bledzie w grze. Bramka statyczna dowodzi, ze kod
 * ma wlasciwy KSZTALT; ta bramka dowodzi, ze gra ma wlasciwe ZACHOWANIE — w realnym
 * Chromium, na realnym bundlu z `vite build`, po realnym kliknieciu w przycisk „Zwiedzaj"
 * i realnym koncu tury.
 *
 * SCENARIUSZ (czwarte miejsce wzorca — auto-eksploracja zwiadowcy):
 *   1. `?playtest=mapa`, tura 1.
 *   2. Zwiadowca gracza postawiony na wolnym ladzie przez REALNY spawner gry.
 *   3. `explored` skasowane do tego, co gracz WIDZI teraz (sandbox startuje z odkrytym
 *      promieniem 12 wokol miasta — bez tego kroku nie ma czego odkrywac).
 *   4. Realny klik w `button[data-act="scout-explore"]` (przycisk „Zwiedzaj" w pasku akcji).
 *   5. Realny koniec tury (`triggerPlayerEndTurn`, identyczny z przyciskiem „Zakoncz ture").
 *   6. Zwiadowca przeszedl WIELE heksow w JEDNEJ turze.
 *
 * ASERCJA GLOWNA [C3] — sformulowana tak, zeby NIE wymagala znajomosci trasy:
 *   istnieje heks, ktory (a) doszedl do `explored` w tej turze i (b) NIE jest widoczny
 *   z pozycji KONCOWEJ zwiadowcy.
 *   Gdyby odkrycie powstawalo — jak w zgloszeniu wlasciciela — wylacznie z heksu koncowego,
 *   kazdy nowo odkryty heks bylby widoczny z pozycji koncowej i ten zbior bylby PUSTY.
 *   To jest doslowne przelozenie zdania „odkrywa sie w tym miejscu, w ktorym pojawi sie na
 *   koncu, a nie odkrywa nic po drodze" na sprawdzalny warunek.
 *
 * NIETAUTOLOGICZNOSC. Uruchom z `--mutacja`: przed buildem podmienia w main.ts wywolanie
 * `revealAlongPathForStack` w haku `onAfterStep` na no-op (przywraca stan sprzed naprawy),
 * buduje, mierzy i PRZYWRACA plik. Oczekiwany wynik: [C3] czerwone.
 *
 * Hak `__mglaSciezkaTestDebug` (main.ts) steruje WYLACZNIE danymi wejsciowymi scenariusza
 * i czyta stan — nigdy nie dopisuje do `explored`.
 *
 * Usage (z gra/): node tools/mgla-sciezka-live-test.cjs [--mutacja]
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_DIR, 'src', 'main.ts');
// C-001: --outDir POZA drzewem repo (dispatch tematu).
const OUT_DIR = path.join(os.tmpdir(), 'civ-mgla-sciezka-live-dist');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOT_DIR = path.resolve(
  GRA_DIR, '..', 'dyspozycje', 'autobot', 'runs',
  'P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1', 'dowody',
);

const MUTACJA = process.argv.includes('--mutacja');
const ODKRYCIE_W_HAKU = 'revealAlongPathForStack([u], [{ q: u.q, r: u.r }]);';
const NOOP_W_HAKU = 'void u; /* MUTACJA TESTOWA: odkrycie per-krok usuniete */';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) {
    pass++;
    console.log('  OK  ' + label);
  } else {
    fail++;
    console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

function zastosujMutacje() {
  const src = fs.readFileSync(MAIN_TS, 'utf8');
  if (!src.includes(ODKRYCIE_W_HAKU)) {
    throw new Error('Mutacja: nie znaleziono wywolania odkrycia w haku onAfterStep');
  }
  fs.writeFileSync(MAIN_TS, src.replace(ODKRYCIE_W_HAKU, NOOP_W_HAKU), 'utf8');
  console.log('[mgla-sciezka-live-test] MUTACJA zastosowana (odkrycie per-krok -> no-op).');
}

function cofnijMutacje() {
  const src = fs.readFileSync(MAIN_TS, 'utf8');
  if (!src.includes(NOOP_W_HAKU)) return;
  fs.writeFileSync(MAIN_TS, src.replace(NOOP_W_HAKU, ODKRYCIE_W_HAKU), 'utf8');
  console.log('[mgla-sciezka-live-test] MUTACJA cofnieta, main.ts przywrocony.');
}

function buildBundle() {
  console.log('[mgla-sciezka-live-test] vite build (dozwolona komenda C-001, --outDir poza repo)...');
  execSync(
    'node ./node_modules/vite/bin/vite.js build --outDir ' + JSON.stringify(OUT_DIR) + ' --emptyOutDir',
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukowal index.html w ' + OUT_DIR);
  }
  console.log('[mgla-sciezka-live-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[mgla-sciezka-live-test] domyslny Chromium niedostepny, fallback:', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function shot(page, name) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const p = path.join(SHOT_DIR, name);
  await page.screenshot({ path: p });
  console.log('[mgla-sciezka-live-test] zrzut: ' + p);
  return p;
}

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 180000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 180000 });
  for (let i = 0; i < 120; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__mglaSciezkaTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 180000 },
  );
  await wait(400);
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[mgla-sciezka-live-test] playwright nie znaleziony.');
    process.exit(1);
  }

  if (MUTACJA) zastosujMutacje();
  try {
    buildBundle();
  } catch (e) {
    if (MUTACJA) cofnijMutacje();
    throw e;
  }

  const browser = await launchBrowser(chromium);
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  try {
    await gotoPlaytestMapa(page);

    // === [A] SCENARIUSZ: zwiadowca gracza na wolnym ladzie, mgla zresetowana ===
    console.log('\n[A] SCENARIUSZ -- zwiadowca gracza, mgla startowa');

    const hex = await page.evaluate(
      () => window.__mglaSciezkaTestDebug.findFreeLandNearPlayerCity(4, 9),
    );
    assert('[A] znaleziono wolny heks ladowy w promieniu 4-9 od miasta gracza', hex !== null, hex);
    if (!hex) throw new Error('brak heksu startowego');

    const scoutId = await page.evaluate(
      (h) => window.__mglaSciezkaTestDebug.spawnPlayerScout(h.q, h.r),
      hex,
    );
    assert('[A] zwiadowca gracza powolany REALNYM spawnerem gry', typeof scoutId === 'string', scoutId);

    const exploredPoReset = await page.evaluate(
      () => window.__mglaSciezkaTestDebug.resetFogToCurrentlyVisible(),
    );
    assert('[A] mgla zresetowana do biezacej widocznosci (explored > 0, ale male)',
      exploredPoReset > 0, exploredPoReset);

    const przed = await page.evaluate((id) => ({
      unit: window.__mglaSciezkaTestDebug.getUnit(id),
      explored: window.__mglaSciezkaTestDebug.getExploredKeys(),
    }), scoutId);
    assert('[A] zwiadowca odczytany przed tura', przed.unit !== null, przed.unit);

    await shot(page, 'live-01-przed-tura.png');

    // === [B] REALNY UI: zaznaczenie + klik „Zwiedzaj" ===
    console.log('\n[B] REALNY UI -- przycisk „Zwiedzaj" (data-act="scout-explore")');

    await page.evaluate((id) => { window.__mglaSciezkaTestDebug.selectUnit(id); }, scoutId);
    await wait(300);

    const btn = page.locator('button.uc-act-btn[data-act="scout-explore"]').first();
    const btnCount = await btn.count();
    assert('[B] przycisk „Zwiedzaj" obecny w pasku akcji zaznaczonego zwiadowcy', btnCount > 0, btnCount);
    if (btnCount > 0) {
      await btn.click();
      await wait(400);
    }

    const poKliku = await page.evaluate(
      (id) => window.__mglaSciezkaTestDebug.getUnit(id), scoutId,
    );
    assert('[B] auto-eksploracja WLACZONA realnym klikiem (u.autoExplore === true)',
      poKliku !== null && poKliku.autoExplore === true, poKliku);

    // === [C] REALNY KONIEC TURY -> ruch wieloheksowy -> pomiar mgly ===
    console.log('\n[C] REALNY koniec tury -- ruch wieloheksowy i pomiar odkrycia');

    await page.evaluate(() => { window.__eraTestDebug.endTurn(); });
    for (let i = 0; i < 60; i++) {
      const busy = await page.evaluate(() => window.__mglaSciezkaTestDebug.isAnimatingNow());
      if (!busy) break;
      await wait(500);
    }
    await wait(1200);

    const po = await page.evaluate((id) => ({
      unit: window.__mglaSciezkaTestDebug.getUnit(id),
      explored: window.__mglaSciezkaTestDebug.getExploredKeys(),
      widoczneZKonca: window.__mglaSciezkaTestDebug.getVisibleKeysFromUnit(id),
    }), scoutId);
    assert('[C] zwiadowca nadal istnieje po turze', po.unit !== null, po.unit);
    if (!po.unit || !przed.unit) throw new Error('brak stanu jednostki do porownania');

    const dystans = await page.evaluate(
      (a) => window.__mglaSciezkaTestDebug.hexDistanceBetween(a.q0, a.r0, a.q1, a.r1),
      { q0: przed.unit.q, r0: przed.unit.r, q1: po.unit.q, r1: po.unit.r },
    );
    assert('[C1] zwiadowca przeszedl WIECEJ NIZ JEDEN heks w JEDNEJ turze'
      + ' (bez tego scenariusz nie dotyka zglaszanego bledu)', dystans >= 2,
      { start: przed.unit, koniec: po.unit, dystans });

    const przedSet = new Set(przed.explored);
    const noweHeksy = po.explored.filter((k) => !przedSet.has(k));
    assert('[C2] mgla faktycznie sie cofnela w tej turze (nowe heksy w explored)',
      noweHeksy.length > 0, noweHeksy.length);

    const widoczneZKonca = new Set(po.widoczneZKonca);
    const odkryteWylacznieWzdluzSciezki = noweHeksy.filter((k) => !widoczneZKonca.has(k));
    assert('[C3] ISTNIEJE heks odkryty w tej turze, ktory NIE jest widoczny z pozycji KONCOWEJ'
      + ' -- czyli mgla odkryla sie PO DRODZE, nie tylko na heksie koncowym',
      odkryteWylacznieWzdluzSciezki.length > 0,
      {
        noweHeksy: noweHeksy.length,
        widocznychZKonca: widoczneZKonca.size,
        odkrytychTylkoPoDrodze: odkryteWylacznieWzdluzSciezki.length,
        probka: odkryteWylacznieWzdluzSciezki.slice(0, 8),
      });

    await shot(page, MUTACJA ? 'live-02-po-turze-MUTACJA.png' : 'live-02-po-turze.png');

    console.log('\n  POMIAR: dystans=' + dystans
      + ' noweHeksy=' + noweHeksy.length
      + ' widoczneZKonca=' + widoczneZKonca.size
      + ' odkryteTylkoPoDrodze=' + odkryteWylacznieWzdluzSciezki.length);

    const bledyKrytyczne = consoleErrors.filter((e) => !/favicon|WebGL|SwiftShader|GPU/i.test(e));
    assert('[C4] brak krytycznych bledow konsoli w trakcie scenariusza',
      bledyKrytyczne.length === 0, bledyKrytyczne.slice(0, 3));
  } finally {
    await browser.close();
    if (MUTACJA) cofnijMutacje();
  }

  console.log('\n' + pass + ' pass, ' + fail + ' fail' + (MUTACJA ? '  (przebieg MUTACYJNY)' : ''));
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  if (MUTACJA) cofnijMutacje();
  console.error('[mgla-sciezka-live-test] BLAD:', e && e.stack ? e.stack : e);
  process.exit(1);
});
