'use strict';
/**
 * autowyzywienie-stan-przycisku-test.cjs
 *
 * TEMAT: R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B
 * (poprzednicy tego samego defektu: `R-AUTO-WYZYWIENIE-CHECKBOX-NA-PRZYCISK` — OTWARTE,
 *  oraz drugi defekt opisany w `R-AUTOWYZYWIENIE-GLOBALNY-BLOKER-I-STAN-PRZYCISKU-Q1`).
 *
 * ZGŁOSZENIE (właściciel, ze zrzutem panelu miasta): „Niestety autowyżywienie można tylko
 * kliknąć i nie wiadomo, czy jest włączone, czy nie. Powinno być zaznaczenie przycisku:
 * albo włączone, albo wyłączone. Inne przyciski: po prostu ten przycisk się świeci, gdy
 * jest aktywny, a gdy jest odznaczony, jest nieaktywny."
 *
 * STAN PRZED: obie połówki przełącznika wyżywienia w panelu miasta — „Auto Wyżywienie"
 * (`cityPanel.ts`, renderMagazyn) i „Indywidualne" (`appendIndywidualneToggle`) — dostawały
 * klasę `active` WYŁĄCZNIE w stanie WŁĄCZONYM. Stan WYŁĄCZONY nie miał ŻADNEGO własnego
 * oznaczenia: wyglądał identycznie jak każdy inny, w pełni klikalny `.hbtn` (pełny kolor
 * tekstu `var(--text)` + złoty kontur). Dlatego „ciemny" przycisk nie czytał się jako
 * WYŁĄCZONY, tylko jako „zwykły przycisk, w który można kliknąć".
 *
 * STAN PO: aktywny wariant ŚWIECI (`.active`), nieaktywny jest WYGASZONY (`.off`) —
 * ta sama para co istniejący `.civ-cs .fsbtn` / `.fsbtn.active` w tym samym arkuszu.
 * Dodatkowo `data-stan="wl" | "wyl"` jako jednoznaczna kotwica stanu.
 *
 * CZEGO PILNUJE TEN TEST — RÓŻNICY MIĘDZY STANAMI, NIE OBECNOŚCI ATRYBUTU:
 * asercja „element ma klasę `active`" przechodzi także wtedy, gdy klasa siedzi na OBU
 * przyciskach naraz. Dlatego każdy blok (B)/(C) renderuje TEN SAM przycisk w DWÓCH
 * stanach i wymaga, żeby oznaczenie się PRZEŁĄCZYŁO oraz żeby w każdym pojedynczym
 * stanie dokładnie jedna z klas `active`/`off` była obecna (blok (D): XOR).
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA, A NIE jsdom / grep źródła:
 * zgłoszenie jest o tym, CO WIDAĆ. Sama klasa w DOM nie dowodzi, że stany różnią się
 * dla oka — dopiero kaskada CSS rozstrzyga, czy `.off` faktycznie wygasza. Blok (E)
 * mierzy `getComputedStyle` w Chromium: kolor tekstu, `box-shadow` i tło muszą się
 * realnie różnić między stanem WŁ a WYŁ. jsdom nie ma kaskady ani layoutu.
 *
 * MUTACJA (F) — dowód nietautologiczności: ten sam plik buduje DRUGI bundel z COFNIĘTĄ
 * poprawką (podmiana w `onLoad`, BEZ dotykania plików w repo: z powrotem tylko
 * `if (on) classList.add('active')`, bez `data-stan`, bez reguł CSS `.hbtn.off`) i
 * wymaga, żeby asercje (B)–(E) zapaliły się na CZERWONO. Ten sam przebieg dostarcza
 * materiał PRZED do zrzutów.
 *
 * SPICHLERZ CENTRALNY — blok (G), INWENTARYZACJA, NIE NAPRAWA. Panel Spichlerza
 * (`empireDetailPanel.ts`, `renderDefaultPoziomRacjiSection`) NIE MA przełącznika
 * auto/indywidualne. Jedyna kontrola Auto-Żywienia w tej sekcji to JEDNORAZOWA AKCJA
 * „Włącz Auto-Żywienie" (`data-autofeed-all-btn`, `P-SPICHLERZ-AUTO-ZYWIENIE-MASOWY-
 * PRZYCISK-Q1`), a stan `city.autoWyzywienie` w ogóle nie dociera do tego panelu:
 * `EmpireFoodCityUiRow` (`empireDetailTypes.ts:531-539`) nie niesie takiego pola, a
 * jedynym producentem snapshotu jest `buildEmpireFoodSnap()` w `gra/src/main.ts:14401`
 * — plik ZAKAZANY w allowliście tego tematu. Blok (G) pinuje więc ten fakt: przycisk
 * jest akcją (brak `aria-pressed`, brak `active`/`off`, brak `data-stan`), żeby każda
 * przyszła zmiana tego założenia zapaliła bramkę zamiast przejść niezauważona.
 *
 * Usage (z gra/): node tools/autowyzywienie-stan-przycisku-test.cjs
 *   --shots <katalog>   zrzuty PO   -> <katalog>/po-miasto-{auto,indywidualne}.png + po-spichlerz.png
 *                       zrzuty PRZED -> <katalog>/przed-miasto-*.png + przed-spichlerz.png
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[autowyzywienie-stan-przycisku-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.autowyz-stan-entry.ts');
const OUT_PO = path.resolve(__dirname, '.autowyz-stan-bundle.cjs');
const OUT_PRZED = path.resolve(__dirname, '.autowyz-stan-bundle-przed.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CITY_PANEL = path.resolve(GRA, 'src', 'ui', 'cityPanel.ts');
const EMPIRE_PANEL = path.resolve(GRA, 'src', 'ui', 'empireDetailPanel.ts');
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const SHOTS = argOf('--shots');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

/* ── kotwice mutacji: dokładnie te trzy hunki tworzą poprawkę ───────────────────────── */
const MUT_AUTO_NEW = "    autoBtn.classList.add(autoWyzywienieOn ? 'active' : 'off');\n"
  + "    autoBtn.dataset.stan = autoWyzywienieOn ? 'wl' : 'wyl';\n";
const MUT_AUTO_OLD = "    if (autoWyzywienieOn) autoBtn.classList.add('active');\n";
const MUT_IND_NEW = "  btn.classList.add(overrideOn ? 'active' : 'off');\n"
  + "  btn.dataset.stan = overrideOn ? 'wl' : 'wyl';\n";
const MUT_IND_OLD = "  if (overrideOn) btn.classList.add('active');\n";
const MUT_CSS_RE = /\.civ-cs \.hbtn\.off\{[\s\S]*?\.civ-cs \.hbtn\.off:hover\{[^}]*\}\n/;

function listSvgs(dir, prefix, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listSvgs(p, prefix + e.name + '/', out);
    else if (e.name.endsWith('.svg')) out[prefix + e.name] = fs.readFileSync(p, 'utf8');
  }
  return out;
}

/** `import.meta.glob`, `*.svg?raw`, `*.css?raw` nie istnieją w gołym esbuildzie — inline'ujemy
 * PRAWDZIWE pliki (ten sam wzorzec co `praca-jeden-podzial-real-render-test.cjs`). */
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

/**
 * Panele nie eksportują wewnętrznych builderów — dokładamy eksporty przez `onLoad`,
 * BEZ dotykania plików w repo (kod produkcyjny leci do bundla 1:1).
 * `legacy=true` cofa poprawkę (mutacja (F) + materiał PRZED do zrzutów).
 */
function exposePanelsPlugin(legacy) {
  return {
    name: 'expose-panels',
    setup(build) {
      build.onLoad({ filter: /cityPanel\.ts$/ }, (args) => {
        if (path.resolve(args.path) !== CITY_PANEL) return null;
        let src = fs.readFileSync(args.path, 'utf8');
        if (legacy) {
          for (const [neu, alt] of [[MUT_AUTO_NEW, MUT_AUTO_OLD], [MUT_IND_NEW, MUT_IND_OLD]]) {
            if (!src.includes(neu)) throw new Error('mutacja (F): kotwica nieaktualna — ' + JSON.stringify(neu.slice(0, 60)));
            src = src.replace(neu, alt);
          }
          if (!MUT_CSS_RE.test(src)) throw new Error('mutacja (F): kotwica CSS .hbtn.off nieaktualna');
          src = src.replace(MUT_CSS_RE, '');
        }
        return {
          contents: src
            + '\nexport { renderMagazyn as __renderMagazyn, computeView as __computeView,'
            + ' ensureStyles as __ensureCityPanelStyles,'
            // R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B, obrona zarzutu 2 (C-026): dowod ma
            // pokrywac WSZYSTKIE TRZY miejsca wywolania wspoldzielonego
            // `appendIndywidualneToggle`, nie tylko grupe Zywnosc. Te dwa buildery
            // renderuja pozostale dwa: `indywidualne-row-handlu` i `indywidualne-row-praca`.
            + ' renderEkonomiaStrip as __renderEkonomia, renderPodzialPracy as __renderPraca };\n',
          loader: 'ts', resolveDir: path.dirname(args.path),
        };
      });
      build.onLoad({ filter: /empireDetailPanel\.ts$/ }, (args) => {
        if (path.resolve(args.path) !== EMPIRE_PANEL) return null;
        return {
          contents: fs.readFileSync(args.path, 'utf8')
            + '\nexport { renderDefaultPoziomRacjiSection as __renderRacjeSection,'
            + ' ensureStyles as __ensureEmpireStyles };\n',
          loader: 'ts', resolveDir: path.dirname(args.path),
        };
      });
    },
  };
}

async function buildBundle(outfile, legacy) {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: [viteCompatPlugin, exposePanelsPlugin(legacy)], logLevel: 'silent',
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[autowyzywienie-stan-przycisku-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Odczyt jednej połówki przełącznika z ŻYWEGO DOM-u + jej realnie skaskadowany styl. */
const READ_BTN = `(sel) => {
  const b = document.querySelector(sel);
  if (!b) return { missing: true };
  const cs = getComputedStyle(b);
  return {
    missing: false,
    text: (b.textContent || '').trim(),
    hasActive: b.classList.contains('active'),
    hasOff: b.classList.contains('off'),
    stan: b.dataset.stan || null,
    ariaPressed: b.getAttribute('aria-pressed'),
    color: cs.color,
    boxShadow: cs.boxShadow,
    backgroundImage: cs.backgroundImage,
    borderColor: cs.borderTopColor,
  };
}`;

const SEL_AUTO = '#civ-autowyz-stage .auto-wyzywienie-btn';
const SEL_IND = '#civ-autowyz-stage .indywidualne-row-zywnosc .indywidualne-btn';
/* Pozostale DWA wywolania tego samego wspoldzielonego komponentu (C-026). */
const SEL_HANDEL = '#civ-autowyz-stage-handel .indywidualne-row-handlu .indywidualne-btn';
const SEL_PRACA = '#civ-autowyz-stage-praca .indywidualne-row-praca .indywidualne-btn';

/**
 * Renderuje zakładkę „Wyżywienie i wzrost" panelu miasta w DWÓCH trybach i sekcję
 * „DOMYŚLNE WYŻYWIENIE" panelu Spichlerza. Zwraca odczyty obu połówek w obu trybach.
 */
async function renderAndRead(browser, bundleFile, shotPrefix) {
  const page = await browser.newPage({ viewport: { width: 560, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });

  await page.setContent('<!DOCTYPE html><html><head><style>'
    + '*{margin:0;padding:0;box-sizing:border-box;}'
    + 'body{background:#0b0f16;color:#eee;padding:12px;}'
    + '#civ-autowyz-wrap.civ-cs{position:static;display:block;pointer-events:auto;width:440px;padding:14px;}'
    + '#emp-stage.civ-emp-panel{position:static;transform:none;width:404px;height:auto;'
    + 'box-shadow:none;border-left:none;border:1px solid #2b3543;border-radius:8px;margin-top:14px;}'
    + '</style></head><body></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(bundleFile, 'utf8') });

  const boot = await page.evaluate(() => {
    window.__ensureCityPanelStyles();
    window.__ensureEmpireStyles();
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
    window.__override = false;

    window.__configureCityPanel({
      data,
      difficulty: 'normal',
      getCities: () => [city],
      // PRAWDZIWE hooki panelu — te same nazwy, które podpina main.ts.
      onCityRationChange: (id, poziom) => { if (id === city.id) city.poziomRacji = poziom; },
      onCityAutoWyzywienieChange: (id, enabled) => { if (id === city.id) city.autoWyzywienie = enabled; },
      getMaxSafePoziomRacji: () => 10,
      getPoziomRacjiOverride: () => window.__override === true,
      onPoziomRacjiOverrideToggle: () => { window.__override = !window.__override; },
      // Hooki pozostalych dwoch grup — bez nich `indywidualne-row-handlu`
      // i `indywidualne-row-praca` w ogole sie nie renderuja (cityPanel.ts:4510, :4974).
      onPodzialHandluChange: () => {},
      getPodzialHandluOverride: () => window.__override === true,
      onPodzialHandluOverrideToggle: () => { window.__override = !window.__override; },
      onPodzialPracyChange: () => {},
      getPodzialPracyOverride: () => window.__override === true,
      onPodzialPracyOverrideToggle: () => { window.__override = !window.__override; },
    });

    const wrap = document.createElement('div');
    wrap.className = 'civ-cs';
    wrap.id = 'civ-autowyz-wrap';
    document.body.appendChild(wrap);
    const stage = document.createElement('div');
    stage.id = 'civ-autowyz-stage';
    wrap.appendChild(stage);
    const stageHandel = document.createElement('div');
    stageHandel.id = 'civ-autowyz-stage-handel';
    wrap.appendChild(stageHandel);
    const stagePraca = document.createElement('div');
    stagePraca.id = 'civ-autowyz-stage-praca';
    wrap.appendChild(stagePraca);

    // ODNIESIENIE: zwykly, NIE-przelacznikowy `.hbtn` tej samej klasy co przyciski naglowka
    // panelu (cs-rename / cs-manager, cityPanel.ts ~9848). Sedno zgloszenia: PRZED poprawka
    // stan WYLACZONY wygladal DOKLADNIE tak jak ten przycisk, wiec „ciemny" nie czytal sie
    // jako WYLACZONY. Blok (E) mierzy wlasnie te odleglosc.
    const ref = document.createElement('button');
    ref.type = 'button';
    ref.className = 'hbtn';
    ref.id = 'civ-autowyz-ref';
    ref.textContent = 'Odniesienie';
    wrap.appendChild(ref);

    const empStage = document.createElement('div');
    empStage.id = 'emp-stage';
    empStage.className = 'civ-emp-panel';
    document.body.appendChild(empStage);

    // TRYB „auto"          -> autoWyzywienie WL,  Indywidualne WYL
    // TRYB „indywidualne"  -> autoWyzywienie WYL, Indywidualne WL
    window.__renderTryb = (tryb) => {
      city.autoWyzywienie = tryb === 'auto';
      window.__override = tryb !== 'auto';
      const view = window.__computeView(city, map, data);
      window.__renderMagazyn(stage, city, view);
      window.__renderEkonomia(stageHandel, city, view, data);
      window.__renderPraca(stagePraca, city, view, data);
    };
    window.__renderTryb('auto');

    window.__configureEmpireGlobalDefaults({
      getOwnerDefaultPoziomRacji: () => 4,
      onOwnerDefaultPoziomRacjiChange: () => {},
      onOwnerSetAutoWyzywienieForAll: () => {},
    });
    empStage.innerHTML = window.__renderRacjeSection();
    return { ok: true };
  });

  const read = async (sel) => page.evaluate(new Function('sel', 'return (' + READ_BTN + ')(sel);'), sel);

  const ref = await read('#civ-autowyz-ref');

  await page.evaluate(() => window.__renderTryb('auto'));
  const autoMode = {
    auto: await read(SEL_AUTO), ind: await read(SEL_IND),
    handel: await read(SEL_HANDEL), praca: await read(SEL_PRACA),
  };
  if (shotPrefix) {
    fs.mkdirSync(path.dirname(path.resolve(shotPrefix + 'miasto-auto.png')), { recursive: true });
    await page.locator('#civ-autowyz-wrap').screenshot({ path: shotPrefix + 'miasto-auto.png' });
  }

  await page.evaluate(() => window.__renderTryb('indywidualne'));
  const indMode = {
    auto: await read(SEL_AUTO), ind: await read(SEL_IND),
    handel: await read(SEL_HANDEL), praca: await read(SEL_PRACA),
  };
  if (shotPrefix) {
    await page.locator('#civ-autowyz-wrap').screenshot({ path: shotPrefix + 'miasto-indywidualne.png' });
  }

  const spichlerz = await page.evaluate(() => {
    const host = document.getElementById('emp-stage');
    const btns = Array.from(host.querySelectorAll('button'));
    const af = host.querySelector('button[data-autofeed-all-btn]');
    return {
      buttonCount: btns.length,
      autofeedText: af ? (af.textContent || '').trim() : null,
      autofeedAria: af ? af.getAttribute('aria-pressed') : null,
      autofeedHasActive: af ? af.classList.contains('active') : null,
      autofeedHasOff: af ? af.classList.contains('off') : null,
      autofeedStan: af ? (af.dataset.stan || null) : null,
      anyPressed: btns.filter(b => b.hasAttribute('aria-pressed')).length,
    };
  });
  if (shotPrefix) await page.locator('#emp-stage').screenshot({ path: shotPrefix + 'spichlerz.png' });

  await page.close();
  return { boot, ref, autoMode, indMode, spichlerz, pageErrors };
}

async function main() {
  const citySrc = fs.readFileSync(CITY_PANEL, 'utf8');
  const empSrc = fs.readFileSync(EMPIRE_PANEL, 'utf8');

  // --- (A) KOTWICE W ŹRÓDLE — czytelny sygnał, gdy poprawka zniknie z pliku -------------
  check('(A) „Auto Wyżywienie" oznacza OBA stany (active/off), nie tylko włączony',
    citySrc.includes(MUT_AUTO_NEW), null);
  check('(A) „Indywidualne" oznacza OBA stany (active/off), nie tylko włączony',
    citySrc.includes(MUT_IND_NEW), null);
  check('(A) w źródle nie został stary, jednostronny zapis dla „Auto Wyżywienie"',
    !citySrc.includes(MUT_AUTO_OLD));
  check('(A) w źródle nie został stary, jednostronny zapis dla „Indywidualne"',
    !citySrc.includes(MUT_IND_OLD));
  check('(A) arkusz panelu miasta niesie regułę wygaszenia .civ-cs .hbtn.off',
    MUT_CSS_RE.test(citySrc));
  check('(A) logika przełączania NIETKNIĘTA — auto nadal woła onCityAutoWyzywienieChange z negacją',
    /cfg\.onCityAutoWyzywienieChange\?\.\(city\.id, !city\.autoWyzywienie\)/.test(citySrc));
  check('(A) logika przełączania NIETKNIĘTA — „Indywidualne" nadal woła onToggle()',
    /btn\.addEventListener\('click', \(\) => \{\s*onToggle\(\);/.test(citySrc));
  check('(A) INWENTARYZACJA: appendIndywidualneToggle ma DOKŁADNIE 3 miejsca wywołania',
    (citySrc.match(/appendIndywidualneToggle\(/g) || []).length === 4, // 1 definicja + 3 wywołania
    (citySrc.match(/appendIndywidualneToggle\(/g) || []).length);
  for (const [grupa, rowCls, hook] of [
    ['Żywność', 'indywidualne-row-zywnosc', 'onPoziomRacjiOverrideToggle'],
    ['Skarbiec+Nauka', 'indywidualne-row-handlu', 'onPodzialHandluOverrideToggle'],
    ['Praca', 'indywidualne-row-praca', 'onPodzialPracyOverrideToggle'],
  ]) {
    check('(A) INWENTARYZACJA: wywołanie grupy ' + grupa + ' przekazuje własne `' + rowCls + '`',
      citySrc.includes("'" + rowCls + "',"), rowCls);
    check('(A) INWENTARYZACJA: grupa ' + grupa + ' nadal wpięta we własny hook `' + hook + '`',
      new RegExp('cfg\\.' + hook + '\\?\\.\\(city\\.id\\)').test(citySrc), hook);
  }
  check('(A) INWENTARYZACJA: „Auto Wyżywienie" renderowany dokładnie raz w całym UI',
    (citySrc.match(/autoBtn\.textContent = 'Auto Wyżywienie';/g) || []).length === 1);

  fs.writeFileSync(ENTRY, [
    "import { configureCityPanel } from '../src/ui/cityPanel.ts';",
    "import { __renderMagazyn, __computeView, __ensureCityPanelStyles } from '../src/ui/cityPanel.ts';",
    "import { __renderEkonomia, __renderPraca } from '../src/ui/cityPanel.ts';",
    "import { configureEmpireGlobalDefaults } from '../src/ui/empireDetailPanel.ts';",
    "import { __renderRacjeSection, __ensureEmpireStyles } from '../src/ui/empireDetailPanel.ts';",
    "import { loadGameData } from '../src/data/loader.ts';",
    "import { foundCityAt } from '../src/game/cities.ts';",
    "import { TerenBazowy, Nakladka } from '../src/types/hex.ts';",
    'window.__configureCityPanel = configureCityPanel;',
    'window.__renderMagazyn = __renderMagazyn;',
    'window.__computeView = __computeView;',
    'window.__ensureCityPanelStyles = __ensureCityPanelStyles;',
    'window.__renderEkonomia = __renderEkonomia;',
    'window.__renderPraca = __renderPraca;',
    'window.__configureEmpireGlobalDefaults = configureEmpireGlobalDefaults;',
    'window.__renderRacjeSection = __renderRacjeSection;',
    'window.__ensureEmpireStyles = __ensureEmpireStyles;',
    'window.__loadGameData = loadGameData;',
    'window.__foundCityAt = foundCityAt;',
    'window.__TerenBazowy = TerenBazowy;',
    'window.__Nakladka = Nakladka;',
    '',
  ].join('\n'), 'utf8');

  await buildBundle(OUT_PO, false);
  // Nota Evaluatora (runda 1): przy CAŁKOWICIE cofniętej poprawce kotwice mutacji (F)
  // nie istnieją i esbuild rzucał wyjątkiem — bramka kończyła się stack trace'em zamiast
  // bilansem. Teraz to zwykły FAIL: nadal czerwono (kryterium 3 dispatchu), ale z pełnym
  // podsumowaniem `pass/fail`, a nie urwanym przebiegiem.
  let legacyOk = true;
  let legacyErr = null;
  try { await buildBundle(OUT_PRZED, true); }
  catch (e) { legacyOk = false; legacyErr = String((e && e.message) || e).slice(0, 200); }

  const browser = await launchBrowser();
  let po;
  let przed = null;
  try {
    po = await renderAndRead(browser, OUT_PO, SHOTS ? path.join(SHOTS, 'po-') : null);
    if (legacyOk) przed = await renderAndRead(browser, OUT_PRZED, SHOTS ? path.join(SHOTS, 'przed-') : null);
  } finally {
    await browser.close();
  }

  check('boot: panel miasta i sekcja Spichlerza wyrenderowane bez błędu strony',
    !po.boot.error && po.pageErrors.length === 0, { boot: po.boot, err: po.pageErrors });
  check('boot: obie połówki przełącznika istnieją w wyrenderowanym panelu miasta',
    !po.autoMode.auto.missing && !po.autoMode.ind.missing,
    { auto: po.autoMode.auto.missing, ind: po.autoMode.ind.missing });
  check('boot: pozostałe DWA wywołania wspólnego komponentu też się wyrenderowały '
    + '(Skarbiec+Nauka, Praca) — dowód nie może pokrywać 1 z 3',
    !po.autoMode.handel.missing && !po.autoMode.praca.missing,
    { handel: po.autoMode.handel.missing, praca: po.autoMode.praca.missing });

  /* ── (B) PRZYCISK „Auto Wyżywienie" — RÓŻNICA między trybami ────────────────────── */
  check('(B) tryb auto: „Auto Wyżywienie" ŚWIECI (active), tryb indywidualny: NIE',
    po.autoMode.auto.hasActive === true && po.indMode.auto.hasActive === false,
    { auto: po.autoMode.auto.hasActive, ind: po.indMode.auto.hasActive });
  check('(B) tryb indywidualny: „Auto Wyżywienie" WYGASZONY (off), tryb auto: NIE',
    po.indMode.auto.hasOff === true && po.autoMode.auto.hasOff === false,
    { auto: po.autoMode.auto.hasOff, ind: po.indMode.auto.hasOff });
  check('(B) data-stan „Auto Wyżywienie" przełącza się wl -> wyl',
    po.autoMode.auto.stan === 'wl' && po.indMode.auto.stan === 'wyl',
    { auto: po.autoMode.auto.stan, ind: po.indMode.auto.stan });
  check('(B) aria-pressed „Auto Wyżywienie" przełącza się true -> false',
    po.autoMode.auto.ariaPressed === 'true' && po.indMode.auto.ariaPressed === 'false',
    { auto: po.autoMode.auto.ariaPressed, ind: po.indMode.auto.ariaPressed });

  /* ── (C) PRZYCISK „Indywidualne" (grupa Żywność) — RÓŻNICA między trybami ───────── */
  check('(C) tryb indywidualny: „Indywidualne" ŚWIECI (active), tryb auto: NIE',
    po.indMode.ind.hasActive === true && po.autoMode.ind.hasActive === false,
    { auto: po.autoMode.ind.hasActive, ind: po.indMode.ind.hasActive });
  check('(C) tryb auto: „Indywidualne" WYGASZONY (off), tryb indywidualny: NIE',
    po.autoMode.ind.hasOff === true && po.indMode.ind.hasOff === false,
    { auto: po.autoMode.ind.hasOff, ind: po.indMode.ind.hasOff });
  check('(C) data-stan „Indywidualne" przełącza się wyl -> wl',
    po.autoMode.ind.stan === 'wyl' && po.indMode.ind.stan === 'wl',
    { auto: po.autoMode.ind.stan, ind: po.indMode.ind.stan });

  /* ── (C2) POZOSTAŁE DWA WYWOŁANIA wspólnego komponentu (C-026) ──────────────────
     `appendIndywidualneToggle` jest współdzielony przez trzy grupy. Blok (C) mierzył
     tylko Żywność; te dwie grupy renderują się z innych builderów i innych hooków,
     więc muszą mieć własny dowód, a nie założenie „to ten sam kod, więc działa". */
  for (const [grupa, key] of [['Skarbiec+Nauka', 'handel'], ['Praca', 'praca']]) {
    const wl = po.indMode[key];
    const wyl = po.autoMode[key];
    check('(C2) ' + grupa + ': „Indywidualne" ŚWIECI (active) tylko przy włączonym override',
      wl.hasActive === true && wyl.hasActive === false,
      { wl: wl.hasActive, wyl: wyl.hasActive });
    check('(C2) ' + grupa + ': „Indywidualne" WYGASZONY (off) tylko przy wyłączonym override',
      wyl.hasOff === true && wl.hasOff === false, { wl: wl.hasOff, wyl: wyl.hasOff });
    check('(C2) ' + grupa + ': data-stan przełącza się wyl -> wl',
      wyl.stan === 'wyl' && wl.stan === 'wl', { wl: wl.stan, wyl: wyl.stan });
    check('(C2) ' + grupa + ': aria-pressed przełącza się false -> true',
      wyl.ariaPressed === 'false' && wl.ariaPressed === 'true',
      { wl: wl.ariaPressed, wyl: wyl.ariaPressed });
  }

  /* ── (D) XOR: w KAŻDYM stanie dokładnie jedno oznaczenie, nigdy oba naraz ───────── */
  const xorCases = [
    ['tryb auto / Auto Wyżywienie', po.autoMode.auto],
    ['tryb auto / Indywidualne', po.autoMode.ind],
    ['tryb indywidualny / Auto Wyżywienie', po.indMode.auto],
    ['tryb indywidualny / Indywidualne', po.indMode.ind],
    ['override WYŁ / Indywidualne (Skarbiec+Nauka)', po.autoMode.handel],
    ['override WŁ / Indywidualne (Skarbiec+Nauka)', po.indMode.handel],
    ['override WYŁ / Indywidualne (Praca)', po.autoMode.praca],
    ['override WŁ / Indywidualne (Praca)', po.indMode.praca],
  ];
  for (const [nazwa, b] of xorCases) {
    check('(D) ' + nazwa + ': dokładnie jedna z klas active/off (nigdy obie, nigdy żadna)',
      b.hasActive !== b.hasOff, { active: b.hasActive, off: b.hasOff });
  }
  check('(D) w trybie auto ŚWIECI dokładnie JEDNA połówka przełącznika',
    (po.autoMode.auto.hasActive ? 1 : 0) + (po.autoMode.ind.hasActive ? 1 : 0) === 1);
  check('(D) w trybie indywidualnym ŚWIECI dokładnie JEDNA połówka przełącznika',
    (po.indMode.auto.hasActive ? 1 : 0) + (po.indMode.ind.hasActive ? 1 : 0) === 1);

  /* ── (E) RÓŻNICA WIDOCZNA DLA OKA — realna kaskada CSS w Chromium ───────────────── */
  const on = po.autoMode.auto;   // ta sama kontrolka, stan WŁ
  const off = po.indMode.auto;   // ta sama kontrolka, stan WYŁ
  check('(E) kolor tekstu RÓŻNI SIĘ między stanem WŁ a WYŁ',
    on.color !== off.color, { wl: on.color, wyl: off.color });
  check('(E) stan WŁ ma poświatę (box-shadow), stan WYŁ jej NIE ma',
    on.boxShadow !== 'none' && off.boxShadow === 'none', { wl: on.boxShadow, wyl: off.boxShadow });
  check('(E) tło RÓŻNI SIĘ między stanem WŁ a WYŁ',
    on.backgroundImage !== off.backgroundImage, { wl: on.backgroundImage, wyl: off.backgroundImage });
  const onInd = po.indMode.ind;
  const offInd = po.autoMode.ind;
  check('(E) „Indywidualne": kolor tekstu RÓŻNI SIĘ między stanem WŁ a WYŁ',
    onInd.color !== offInd.color, { wl: onInd.color, wyl: offInd.color });
  check('(E) „Indywidualne": poświata tylko w stanie WŁ',
    onInd.boxShadow !== 'none' && offInd.boxShadow === 'none',
    { wl: onInd.boxShadow, wyl: offInd.boxShadow });

  /* SEDNO ZGŁOSZENIA — mierzone wobec ODNIESIENIA, nie wobec drugiego stanu.
     „Świeci vs nie świeci" różniło się także PRZED poprawką (blok (F) to udowadnia).
     Defekt polegał na czym innym: stan WYŁĄCZONY był NIEODRÓŻNIALNY od zwykłego,
     w pełni klikalnego przycisku `.hbtn`, więc nie czytał się jako „odznaczony". */
  check('(E) SEDNO: stan WYŁ jest WYGASZONY wobec zwykłego .hbtn — inny kolor tekstu',
    off.color !== po.ref.color, { wyl: off.color, zwykly: po.ref.color });
  check('(E) SEDNO: stan WYŁ jest WYGASZONY wobec zwykłego .hbtn — inne tło',
    off.backgroundImage !== po.ref.backgroundImage,
    { wyl: off.backgroundImage, zwykly: po.ref.backgroundImage });
  check('(E) SEDNO: „Indywidualne" w stanie WYŁ też wygaszony wobec zwykłego .hbtn',
    offInd.color !== po.ref.color, { wyl: offInd.color, zwykly: po.ref.color });
  for (const [grupa, key] of [['Skarbiec+Nauka', 'handel'], ['Praca', 'praca']]) {
    const wl = po.indMode[key];
    const wyl = po.autoMode[key];
    check('(E) SEDNO ' + grupa + ': stan WYŁ wygaszony wobec zwykłego .hbtn (kolor tekstu)',
      wyl.color !== po.ref.color, { wyl: wyl.color, zwykly: po.ref.color });
    check('(E) SEDNO ' + grupa + ': stan WYŁ wygaszony wobec zwykłego .hbtn (tło)',
      wyl.backgroundImage !== po.ref.backgroundImage,
      { wyl: wyl.backgroundImage, zwykly: po.ref.backgroundImage });
    check('(E) ' + grupa + ': poświata tylko w stanie WŁ',
      wl.boxShadow !== 'none' && wyl.boxShadow === 'none',
      { wl: wl.boxShadow, wyl: wyl.boxShadow });
  }
  check('(E) odniesienie jest naprawdę neutralne (bez active/off) — pomiar ma sens',
    po.ref.hasActive === false && po.ref.hasOff === false, po.ref);

  /* ── (F) MUTACJA: te SAME predykaty puszczone na cofniętej poprawce MUSZĄ dać FAŁSZ ──
     Nie opisujemy tu mutacji słowami — bierzemy dosłownie predykaty z bloków (B)–(E),
     wołamy je na odczycie z bundla PRZED i wymagamy `false`. Gdyby któryś przeszedł
     także bez poprawki, nie mierzyłby niczego (precedens
     P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1). */
  if (!legacyOk) {
    check('(F) mutacja: wariant PRZED (cofnięta poprawka) daje się w ogóle zbudować — '
      + 'kotwice mutacji aktualne', false, legacyErr);
  } else {
  const PREDYKATY = {
    '(B) auto: active przełącza się między trybami':
      (r) => r.autoMode.auto.hasActive === true && r.indMode.auto.hasActive === false
        && r.indMode.auto.hasOff === true && r.autoMode.auto.hasOff === false,
    '(B) auto: data-stan przełącza wl -> wyl':
      (r) => r.autoMode.auto.stan === 'wl' && r.indMode.auto.stan === 'wyl',
    '(C) Indywidualne: active/off przełączają się między trybami':
      (r) => r.indMode.ind.hasActive === true && r.autoMode.ind.hasActive === false
        && r.autoMode.ind.hasOff === true && r.indMode.ind.hasOff === false,
    '(C) Indywidualne: data-stan przełącza wyl -> wl':
      (r) => r.autoMode.ind.stan === 'wyl' && r.indMode.ind.stan === 'wl',
    '(D) XOR active/off w każdym z czterech stanów':
      (r) => [r.autoMode.auto, r.autoMode.ind, r.indMode.auto, r.indMode.ind]
        .every((b) => b.hasActive !== b.hasOff),
    '(E) SEDNO: stan WYŁ wygaszony wobec zwykłego .hbtn (kolor tekstu)':
      (r) => r.indMode.auto.color !== r.ref.color,
    '(E) SEDNO: stan WYŁ wygaszony wobec zwykłego .hbtn (tło)':
      (r) => r.indMode.auto.backgroundImage !== r.ref.backgroundImage,
    '(E) SEDNO: „Indywidualne" w stanie WYŁ wygaszony wobec zwykłego .hbtn':
      (r) => r.autoMode.ind.color !== r.ref.color,
    '(C2) Skarbiec+Nauka: active/off przełączają się między stanami override':
      (r) => r.indMode.handel.hasActive === true && r.autoMode.handel.hasActive === false
        && r.autoMode.handel.hasOff === true && r.indMode.handel.hasOff === false,
    '(C2) Skarbiec+Nauka: stan WYŁ wygaszony wobec zwykłego .hbtn':
      (r) => r.autoMode.handel.color !== r.ref.color,
    '(C2) Praca: active/off przełączają się między stanami override':
      (r) => r.indMode.praca.hasActive === true && r.autoMode.praca.hasActive === false
        && r.autoMode.praca.hasOff === true && r.indMode.praca.hasOff === false,
    '(C2) Praca: stan WYŁ wygaszony wobec zwykłego .hbtn':
      (r) => r.autoMode.praca.color !== r.ref.color,
  };
  for (const [nazwa, pred] of Object.entries(PREDYKATY)) {
    check('(F) mutacja: predykat ' + nazwa + ' — PRAWDA po poprawce', pred(po) === true);
    check('(F) mutacja: predykat ' + nazwa + ' — FAŁSZ bez poprawki (nietautologiczny)',
      pred(przed) === false);
  }
  check('(F) mutacja realnie cofa poprawkę: bez niej stan WYŁ nie ma ŻADNEGO oznaczenia',
    przed.indMode.auto.hasOff === false && przed.indMode.auto.hasActive === false
      && przed.indMode.auto.stan === null,
    { off: przed.indMode.auto.hasOff, active: przed.indMode.auto.hasActive, stan: przed.indMode.auto.stan });
  check('(F) mutacja: bez poprawki stan WYŁ wyglądał jak zwykły, w pełni aktywny przycisk',
    przed.indMode.auto.color !== po.indMode.auto.color
      && przed.indMode.auto.backgroundImage !== po.indMode.auto.backgroundImage,
    { przed: przed.indMode.auto.color, po: po.indMode.auto.color });
  check('(F) poprawka NIE rusza stanu WŁ — świecenie było i jest identyczne',
    przed.autoMode.auto.hasActive === true
      && przed.autoMode.auto.color === po.autoMode.auto.color
      && przed.autoMode.auto.boxShadow === po.autoMode.auto.boxShadow,
    { przed: przed.autoMode.auto.color, po: po.autoMode.auto.color });
  }

  /* ── (G) SPICHLERZ CENTRALNY — inwentaryzacja przypięta bramką ──────────────────── */
  check('(G) sekcja „DOMYŚLNE WYŻYWIENIE" ma DOKŁADNIE JEDEN przycisk',
    po.spichlerz.buttonCount === 1, po.spichlerz);
  check('(G) ten przycisk to jednorazowa AKCJA „Włącz Auto-Żywienie", nie przełącznik stanu',
    po.spichlerz.autofeedText === 'Włącz Auto-Żywienie', po.spichlerz.autofeedText);
  check('(G) w panelu Spichlerza NIE MA przełącznika auto/indywidualne '
    + '(brak aria-pressed, brak active/off, brak data-stan)',
    po.spichlerz.anyPressed === 0 && po.spichlerz.autofeedAria === null
      && po.spichlerz.autofeedHasActive === false && po.spichlerz.autofeedHasOff === false
      && po.spichlerz.autofeedStan === null, po.spichlerz);
  check('(G) POWÓD (kotwica na przyszłość): EmpireFoodCityUiRow nie niesie autoWyzywienie, '
    + 'więc stan per-miasto nie dociera do panelu Spichlerza',
    !/autoWyzywienie/.test(fs.readFileSync(path.resolve(GRA, 'src', 'ui', 'empireDetailTypes.ts'), 'utf8')));
  check('(G) sekcja Spichlerza NIETKNIĘTA przez ten temat — nadal jednorazowa akcja w źródle',
    /Akcja jednorazowa — ustawia stan teraz, nie jest trwałym przełącznikiem\./.test(empSrc));

  for (const f of [ENTRY, OUT_PO, OUT_PRZED]) fs.rmSync(f, { force: true });

  console.log('\n' + (fail === 0 ? 'OK' : 'FAILED') + ` — pass ${pass}, fail ${fail}`);
  if (SHOTS) console.log('zrzuty: ' + path.resolve(SHOTS));
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
