'use strict';
/**
 * korupcja-tekst-gracz-real-render-test.cjs — REAL RENDER (Chromium/Playwright)
 *
 * TEMAT: P-CITYPANEL-KORUPCJA-TEKST-DEWELOPERSKI-Q1
 *
 * ZLECENIE: karta "Podział <daniny> — szczegóły" (panel miasta, sekcja Handel) i skrócony
 * widok karty Handlu (żeton "Korupcja") niosły tekst adresowany do ZESPOŁU DEWELOPERSKIEGO,
 * nie do gracza — notatka projektowa "Do rozkminienia (v2): ... czy gracz może ją obniżać,
 * czy pokazujemy ją per miasto czy imperium", nagłówek sekcji "Korupcja (placeholder)",
 * etykieta wiersza "Silnik (docelowo)" i natywny tooltip "Placeholder — docelowo pełny
 * model korupcji". Cała reszta karty (appendDetailFormula/appendDetailAlgo — wzory silnika,
 * np. "handelBrutto = Σ...") to ŚWIADOMY, zaakceptowany wzorzec transparency-panelu i
 * ZOSTAJE bez zmian — patrz RECON w 00-dispatch.md tego tematu.
 *
 * ZNANA, UDOKUMENTOWANA SPRZECZNOŚĆ DYSPOZYCJI z RUNDY 1 (zgłoszona przez Evaluatora,
 * potwierdzona jako prawdziwa) — ROZSTRZYGNIĘTA przez ECHO orkiestratora w RUNDZIE 2:
 * Kryterium końca [1] w swoim DOSŁOWNYM brzmieniu zakazywało słowa "placeholder"
 * GDZIEKOLWIEK w renderowanym DOM całej karty, a ALLOWLISTA/RECON RUNDY 1 WPROST
 * zakazywała dotykania appendDetailFormula/appendDetailAlgo — te dwie funkcje (linie
 * ~10480, ~10498 cityPanel.ts) legalnie i celowo niosły frazy "(placeholder UI)" /
 * "placeholder X% brutto" jako część wzoru silnika. ECHO RUNDY 2 rozstrzygnęło na
 * korzyść Kryterium [1] w PIERWOTNYM brzmieniu (zero placeholder w CAŁYM DOM) i
 * rozszerzyło allowlistę WYŁĄCZNIE o te 2 konkretne linie: usunięto z nich literalny
 * ciąg "placeholder", zachowując 100% reszty wzoru (struktura, zmienne,
 * HANDEL_KORUPCJA_PCT_PLACEHOLDER jako NAZWA STAŁEJ nietknięta, kolejność kroków,
 * wszystkie inne linie appendDetailFormula/appendDetailAlgo). Ten test dlatego:
 *   (a) pilnuje TWARDO, że wszystkie 4 fragmenty z ALLOWLISTY RUNDY 1 (i TYLKO te 4)
 *       zostały przepisane na ton gracza — zero "Do rozkminienia"/"(v2)"/"placeholder"/
 *       "Silnik"/"prototyp" w notatce, nagłówku sekcji, etykiecie wiersza i tooltipie żetonu;
 *   (b) pilnuje, że appendDetailFormula/appendDetailAlgo pozostały BAJT W BAJT poza
 *       DOKŁADNIE tymi 2 literalnymi wystąpieniami słowa "placeholder" usuniętymi przez
 *       ECHO RUNDY 2 (reszta wzoru, zmiennych i kolejności kroków — bez zmian);
 *   (c) pilnuje TWARDO (Kryterium 1, RUNDA 2), że cały wyrenderowany DOM karty NIE
 *       zawiera już ŻADNEGO literalnego "placeholder"/"Placeholder" — łącznie z
 *       appendDetailFormula/appendDetailAlgo, po poprawce ECHO.
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA (R-PROC-AUTOBOT.md §9 poz. 6a): karta otwiera się
 * REALNYM klikiem w przycisk "i szczegóły" (attachInteractiveDetail z hoverDetailDock.ts —
 * ten sam kod co produkcyjny HUD), nie wywołaniem buildera z pominięciem hosta. Sam grep
 * źródła nie potwierdza co faktycznie trafia do DOM (interpolacje szablonów, HANDEL_KORUPCJA_
 * PCT_PLACEHOLDER jako liczba, nie jako string "placeholder").
 *
 * Usage (z gra/): node tools/korupcja-tekst-gracz-real-render-test.cjs [--shot out.png]
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[korupcja-tekst-gracz-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.korupcja-tekst-gracz-rr-entry.ts');
const OUTFILE = path.resolve(__dirname, '.korupcja-tekst-gracz-rr-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CITY_PANEL = path.resolve(GRA, 'src', 'ui', 'cityPanel.ts');
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');

const SHOT = (() => {
  const i = process.argv.indexOf('--shot');
  return i > -1 ? process.argv[i + 1] : null;
})();

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function listSvgs(dir, prefix, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listSvgs(p, prefix + e.name + '/', out);
    else if (e.name.endsWith('.svg')) out[prefix + e.name] = fs.readFileSync(p, 'utf8');
  }
  return out;
}

/** Vite-owe konstrukcje (`import.meta.glob`, `*.svg?raw`) nie istnieją w gołym esbuildzie —
 * inline'ujemy PRAWDZIWE pliki SVG (ten sam wzorzec co praca-jeden-podzial-real-render-test.cjs). */
const viteCompatPlugin = {
  name: 'vite-compat',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'raw-file',
    }));
    build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (args) => ({
      contents: fs.readFileSync(args.path, 'utf8'), loader: 'text',
    }));
    build.onLoad({ filter: /brandAssets\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== BRAND_ASSETS_TS) return null;
      const src = fs.readFileSync(args.path, 'utf8').replace(
        /import\.meta\.glob\('\.\/brand\/\*\*\/\*\.svg',\s*\{[\s\S]*?\}\)/,
        JSON.stringify(listSvgs(BRAND_DIR, './brand/', {})),
      );
      return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      const src = fs.readFileSync(args.path, 'utf8');
      if (!src.includes('import.meta.glob')) return null;
      return {
        contents: 'const __viteGlobStub = () => ({});\n' + src.replace(/import\.meta\.glob/g, '__viteGlobStub'),
        loader: 'ts', resolveDir: path.dirname(args.path),
      };
    });
  },
};

/** `cityPanel.ts` nie eksportuje wewnętrznych builderów panelu — dokładamy eksporty przez
 * onLoad, BEZ modyfikowania pliku w repo (kod produkcyjny leci do bundla 1:1). */
const exposeCityPanelPlugin = {
  name: 'expose-city-panel',
  setup(build) {
    build.onLoad({ filter: /cityPanel\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== CITY_PANEL) return null;
      let src = fs.readFileSync(args.path, 'utf8');
      if (!/function renderHandelSlidersPanel\(/.test(src) || !/function buildHandelDetailCard\(/.test(src)
        || !/function appendPodzialHandlu\(/.test(src) || !/function computeView\(/.test(src)) {
        throw new Error('kotwica renderHandelSlidersPanel/buildHandelDetailCard/appendPodzialHandlu/computeView nie znaleziona w cityPanel.ts');
      }
      src += '\nexport { renderHandelSlidersPanel as __renderHandelSlidersPanel,'
        + ' buildHandelDetailCard as __buildHandelDetailCard,'
        + ' appendPodzialHandlu as __appendPodzialHandlu,'
        + ' computeView as __computeView,'
        + ' ensureStyles as __ensureCityPanelStyles };\n';
      return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[korupcja-tekst-gracz-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  const citySrc = fs.readFileSync(CITY_PANEL, 'utf8');

  // --- (0) Kotwice statyczne w źródle — sygnał czytelny bez otwierania przeglądarki -----
  check('(0) notatka "Do rozkminienia (v2)" ZNIKNĘŁA ze źródła', !citySrc.includes('Do rozkminienia (v2)'), null);
  check('(0) nagłówek sekcji "Korupcja (placeholder)" ZNIKNĄŁ ze źródła', !citySrc.includes("'Korupcja (placeholder)'"), null);
  check('(0) etykieta wiersza "Silnik (docelowo)" ZNIKNĘŁA ze źródła', !citySrc.includes("'Silnik (docelowo)'"), null);
  check('(0) tooltip żetonu "Placeholder — docelowo pełny model korupcji" ZNIKNĄŁ ze źródła',
    !citySrc.includes('Placeholder — docelowo pełny model korupcji'), null);
  // Kontrola RUNDY 2 (ECHO) — dowód, że appendDetailFormula/appendDetailAlgo zostały
  // BAJT W BAJT poza DOKŁADNIE literalnym ciągiem "placeholder" w tych 2 liniach, który
  // ECHO orkiestratora nakazało usunąć (reszta wzoru, zmiennych, kolejności — bez zmian).
  check('(0) appendDetailFormula strataKorupcji: wzór/zmienne NIETKNIĘTE, ciąg "placeholder" USUNIĘTY (ECHO runda 2)',
    citySrc.includes('strataKorupcji = handelBrutto × ${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% (dziś: stały %)')
    && !/strataKorupcji = handelBrutto × \$\{HANDEL_KORUPCJA_PCT_PLACEHOLDER\}% \(placeholder/i.test(citySrc), null);
  check('(0) appendDetailAlgo krok "Odejmij korupcję": struktura/kolejność NIETKNIĘTE, ciąg "placeholder" USUNIĘTY (ECHO runda 2)',
    citySrc.includes('Odejmij korupcję (dziś: stały ${HANDEL_KORUPCJA_PCT_PLACEHOLDER}% brutto; docelowo: dystans, miasta, cap) → handelNetto.')
    && !/Odejmij korupcję \(placeholder/i.test(citySrc), null);

  fs.writeFileSync(ENTRY, [
    "import { configureCityPanel } from '../src/ui/cityPanel.ts';",
    "import { __renderHandelSlidersPanel, __buildHandelDetailCard, __appendPodzialHandlu, __computeView, __ensureCityPanelStyles } from '../src/ui/cityPanel.ts';",
    "import { attachInteractiveDetail } from '../src/ui/hoverDetailDock.ts';",
    "import { loadGameData } from '../src/data/loader.ts';",
    "import { foundCityAt } from '../src/game/cities.ts';",
    "import { TerenBazowy, Nakladka } from '../src/types/hex.ts';",
    'window.__configureCityPanel = configureCityPanel;',
    'window.__renderHandelSlidersPanel = __renderHandelSlidersPanel;',
    'window.__buildHandelDetailCard = __buildHandelDetailCard;',
    'window.__appendPodzialHandlu = __appendPodzialHandlu;',
    'window.__computeView = __computeView;',
    'window.__ensureCityPanelStyles = __ensureCityPanelStyles;',
    'window.__attachInteractiveDetail = attachInteractiveDetail;',
    'window.__loadGameData = loadGameData;',
    'window.__foundCityAt = foundCityAt;',
    'window.__TerenBazowy = TerenBazowy;',
    'window.__Nakladka = Nakladka;',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: [viteCompatPlugin, exposeCityPanelPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  try {
    await page.setContent('<!DOCTYPE html><html><head><style>'
      + '*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;}'
      + '</style></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    const boot = await page.evaluate(() => {
      window.__ensureCityPanelStyles();
      const data = window.__loadGameData();
      const T = window.__TerenBazowy;
      const N = window.__Nakladka;
      const hexes = {};
      for (let q = -5; q <= 5; q++) {
        for (let r = -5; r <= 5; r++) {
          const far = Math.max(Math.abs(q), Math.abs(r)) >= 2;
          hexes[q + ',' + r] = {
            coords: { q, r },
            terenBazowy: far ? T.Wzgorza : T.Laka,
            nakladka: far ? N.Las : undefined,
          };
        }
      }
      const map = { szerokoscQ: 11, wysokoscR: 11, hexes, seed: 1, riverPaths: [] };
      const city = window.__foundCityAt(0, 0, 0, [], map, 'Testowo');
      if (!city) return { error: 'foundCityAt zwrocilo null' };
      city.population = 6;
      window.__city = city;
      window.__map = map;
      window.__data = data;

      window.__configureCityPanel({
        data,
        difficulty: 'normal',
        getCities: () => [city],
        getBuiltBuildingIds: () => [],
        getUnlockedTechs: () => [],
        getOwnerHasZlotoAccess: () => true,
        getTradeRoutes: () => [],
      });

      const view = window.__computeView(city, map, data);

      const wrap = document.createElement('div');
      wrap.className = 'civ-cs';
      wrap.style.cssText = 'position:static;display:block;pointer-events:auto;width:460px;padding:16px;';
      wrap.id = 'civ-handel-wrap';
      document.body.appendChild(wrap);
      const mount = document.createElement('div');
      mount.id = 'civ-handel-mount';
      wrap.appendChild(mount);

      // REALNY host panelu — dokładnie ta sama funkcja co produkcyjny HUD
      // (renderHandelSlidersPanel), łącznie z przyciskiem "i szczegóły".
      window.__renderHandelSlidersPanel(mount, city, view, data);

      return { htmlLen: mount.innerHTML.length, hasView: !!view, est: null };
    });
    check('boot: sekcja Handlu (renderHandelSlidersPanel) wyrenderowana bez błędu, HTML niepusty',
      !boot.error && boot.htmlLen > 0, boot);
    check('boot: computeView zwrócił realny widok (CityView niepusty)', boot.hasView === true, boot);

    // === KRYTERIUM 2: skrócony widok — żeton "Korupcja", atrybut title ====================
    const chip = await page.evaluate(() => {
      const chipEl = document.querySelector('#civ-handel-mount .handel-korupcja-chip');
      return {
        found: !!chipEl,
        title: chipEl ? chipEl.getAttribute('title') : null,
      };
    });
    check('(2) żeton "Korupcja" w skróconym widoku istnieje w DOM', chip.found === true, chip);
    check('(2) tooltip żetonu NIE zawiera "placeholder"/"Placeholder"',
      !/placeholder/i.test(chip.title || ''), chip);
    check('(2) tooltip żetonu adresowany do gracza (wspomina "korupcj" i "aktualizacj")',
      /korupcj/i.test(chip.title || '') && /aktualizacj/i.test(chip.title || ''), chip);

    if (SHOT) {
      await page.locator('#civ-handel-wrap').screenshot({ path: SHOT.replace(/\.png$/, '-chip.png') });
    }

    // === KRYTERIUM 1/3: klik REALNY na "i szczegóły" -> otwiera kartę przez PRAWDZIWY
    // attachInteractiveDetail (produkcyjny hoverDetailDock.ts), nie wywołanie buildera
    // z pominięciem hosta. =================================================================
    const infoBtn = page.locator('#civ-handel-mount button.civ-w4-panel-detail');
    check('setup: przycisk "i szczegóły" istnieje w DOM', await infoBtn.count() > 0);
    await infoBtn.click();
    await page.waitForTimeout(150);

    const cardHtml = await page.evaluate(() => {
      const dock = document.querySelector('.civ-hover-detail-content, .civ-hover-detail-dock, #civ-hover-detail-float');
      return dock ? { html: dock.innerHTML, text: dock.textContent || '' } : null;
    });
    check('(1) realny klik na "i szczegóły" otworzył kartę "Podział ... — szczegóły"', !!cardHtml, cardHtml);

    if (SHOT) {
      await page.screenshot({ path: SHOT });
    }

    if (cardHtml) {
      const html = cardHtml.html;
      const text = cardHtml.text;

      // --- (1a) 4 fragmenty z ALLOWLISTY: zero żargonu deweloperskiego -------------------
      check('(1a) karta NIE zawiera "Do rozkminienia"', !/Do rozkminienia/i.test(text), text.slice(0, 4000));
      check('(1a) karta NIE zawiera "(v2)"', !text.includes('(v2)'), text.slice(0, 4000));
      check('(1a) nagłówek sekcji korupcji NIE zawiera "placeholder"/"Placeholder" (dc-section)',
        !Array.from((cardHtml.html.match(/<div class="dc-section">([^<]*Korupcja[^<]*)<\/div>/gi)) || [])
          .some((h) => /placeholder/i.test(h)), cardHtml.html.match(/<div class="dc-section">[^<]*<\/div>/gi));
      check('(1a) etykieta wiersza siatki korupcji NIE zawiera "Silnik" (zastąpiona "Planowane zmiany")',
        !/>Silnik[^<]*</i.test(html) && /Planowane zmiany/.test(text), { hasPlanowane: /Planowane zmiany/.test(text) });
      check('(1a) notatka korupcji NIE zawiera "prototyp"/"prototypie"', !/prototyp/i.test(text), text.slice(0, 4000));

      // --- (1b) merytoryka zachowana (Kryterium 3): stały % dziś, w przyszłości dystans/miasta
      check('(3) karta nadal informuje, że korupcja to DZIŚ stały procent',
        /stał[ay]? procent/i.test(text), text.slice(0, 4000));
      check('(3) karta nadal informuje o przyszłej zależności od ODLEGŁOŚCI/dystansu',
        /odległoś|dystans/i.test(text), text.slice(0, 4000));
      check('(3) karta nadal informuje o przyszłej zależności od LICZBY MIAST',
        /liczby miast|liczba miast/i.test(text), text.slice(0, 4000));

      // --- (1c) reszta karty (appendDetailFormula/appendDetailAlgo, WZORY silnika) zachowana
      // BAJT W BAJT poza DOKŁADNIE literalnym ciągiem "placeholder" usuniętym przez ECHO
      // runda 2 w tych 2 liniach — struktura wzoru, zmienne i kolejność kroków bez zmian.
      check('(4) wzór "handelBrutto = Σ" nietknięty (poza allowlistą)', /handelBrutto = Σ/.test(text), null);
      check('(4) wzór "strataKorupcji = handelBrutto ×" nietknięty, ciąg "placeholder" USUNIĘTY (ECHO runda 2)',
        /strataKorupcji = handelBrutto ×.*\(dziś: stały %\)/.test(text), text.slice(0, 4000));
      check('(4) algorytm "Odejmij korupcję" nietknięty, ciąg "placeholder" USUNIĘTY (ECHO runda 2)',
        /Odejmij korupcję \(dziś: stały \d+% brutto; docelowo: dystans, miasta, cap\)/.test(text), text.slice(0, 4000));
      check('(4) algorytm "Zbierz ... ze wszystkich obrabianych pól" nietknięty', /Zbierz .*obrabianych pól/.test(text), null);

      // --- KRYTERIUM 1 (RUNDA 2, ECHO — brzmienie PIERWOTNE): cały wyrenderowany DOM karty
      // NIE zawiera już ŻADNEGO literalnego "placeholder"/"Placeholder", wliczając
      // appendDetailFormula/appendDetailAlgo po poprawce ECHO. Dozwolona jest wyłącznie
      // nazwa stałej w kodzie źródłowym (HANDEL_KORUPCJA_PCT_PLACEHOLDER) — a ta nigdy nie
      // trafia do renderowanego tekstu (interpoluje się jako liczba, np. "5%").
      check('(1) KRYTERIUM 1: cały wyrenderowany DOM karty NIE zawiera "placeholder"/"Placeholder" (zero wyjątków, ECHO runda 2)',
        !/placeholder/i.test(html) && !/placeholder/i.test(text), text.slice(0, 4000));
    }

    check('brak błędów konsoli/pageerror w trakcie renderu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE, { force: true });
  }

  console.log('');
  console.log(`[korupcja-tekst-gracz-real-render-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
