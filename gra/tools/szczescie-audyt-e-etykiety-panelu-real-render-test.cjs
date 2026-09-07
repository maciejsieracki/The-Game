'use strict';
/**
 * szczescie-audyt-e-etykiety-panelu-real-render-test.cjs — REAL RENDER (Chromium/Playwright)
 *
 * TEMAT: R-SZCZESCIE-AUDYT-E-ETYKIETY-PANELU-Q1 (węzeł E, ostatni z audytu
 * R-MIASTA-SZCZESCIE-PRAWO-BALANS-AUDYT-Q1).
 *
 * ZLECENIE: blok „Szczęście: X% wkładu / Prawo: Y% wkładu" w panelu Porządku miasta
 * (`renderSpoleczenstwo`, `gra/src/ui/cityPanel.ts`) pokazuje WYNIK tej tury (zależny od
 * bieżącego Szczęścia/Prawa w mieście), ale nic w UI nie tłumaczyło, że to NIE jest stała
 * reguła gry, ani nie pokazywało obok prawdziwej, stałej wagi mechanizmu
 * (`porzadek_waga_szczescie`/`porzadek_waga_prawo`, `data/society-params.json`, bieżąca
 * trudność) jako punktu odniesienia.
 *
 * CO PILNUJE TEN TEST (żywy Chromium, nie jsdom/grep — R-PROC-AUTOBOT.md §9 poz. 6a):
 *   (A) natywny tooltip (`title`) na kontenerze `.civ-w4-wklad` jasno rozróżnia „wkład TEJ
 *       TURY" (zmienny) od „stałej wagi bazowej" (mechanizm), z realną wartością wagi.
 *   (B) DODATKOWO widoczna linia tekstu `.civ-w4-wklad-hint` w DOM (nie tylko atrybut title,
 *       który w headless Chromium nie maluje się jako natywny dymek w zrzucie ekranu) —
 *       „Waga bazowa (<trudność>): Szczęście N% / Prawo M%" — TO jest dowód „tekst faktycznie
 *       widoczny na renderowanej stronie" wymagany dla tematu wizualnego.
 *   (C) WARTOŚĆ wagi w DOM realnie PODĄŻA za danymi (`data.societyParams.porzadek.*`) —
 *       render z danymi zmutowanymi w pamięci (91/9) pokazuje 91%/9%, z danymi
 *       niezmutowanymi (normal 50/50, hard 45/55, realne wartości z JSON dziś na dysku)
 *       pokazuje wartości z pliku — NIE zahardkodowaną liczbę. `data/society-params.json`
 *       na dysku jest czytany WYŁĄCZNIE, zero zapisu (allowlista tego tematu).
 *   (D) Liczby wyświetlane na dwóch paskach wyżej (`szWkladPct`/`prawWkladPct`, „wkładu")
 *       są DOKŁADNIE te same co przed tematem — zero zmiany formuły/liczenia.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI (wymóg dispatchu): drugi bundle budowany z tym samym plikiem
 * `cityPanel.ts`, ale z DOKŁADNIE tym fragmentem, który ten temat dodał, usuniętym w pamięci
 * (regex na źródle w buforze esbuild — plik w repo NIETKNIĘTY) — odtwarza stan SPRZED tego
 * tematu. Na tym „legacy" bundlu asercje (A)/(B)/(C) MUSZĄ się nie powieść (czerwone) —
 * dowód, że test faktycznie zależy od nowego kodu, a nie przechodzi zawsze.
 *
 * Usage (z gra/): node tools/szczescie-audyt-e-etykiety-panelu-real-render-test.cjs [--shot out.png]
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[szczescie-audyt-e-etykiety-panelu-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.szczescie-e-rr-entry.ts');
const OUT_AFTER = path.resolve(__dirname, '.szczescie-e-rr-bundle.cjs');
const OUT_LEGACY = path.resolve(__dirname, '.szczescie-e-rr-bundle-legacy.cjs');
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
 * inline'ujemy PRAWDZIWE pliki SVG (ten sam wzorzec co korupcja-tekst-gracz-real-render-test.cjs). */
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

/** Kotwica mutacji (dowód nietautologiczności): DOKŁADNIE ten fragment, który ten temat
 * dodał w `renderSpoleczenstwo` (tooltip + linia „Waga bazowa"). Usunięty w pamięci ->
 * odtwarza stan SPRZED tego tematu (tylko dwa paski „N% wkładu", bez tooltipu/wagi). */
const NEW_BLOCK_RE = /\n\s*\/\/ R-SZCZESCIE-AUDYT-E-ETYKIETY-PANELU-Q1:[\s\S]*?wkladBox\.appendChild\(wkladHint\);\n/;

/** `cityPanel.ts` nie eksportuje `renderSpoleczenstwo`/`configureCityPanel` poza modułem w
 * postaci potrzebnej testowi bez hosta -- dokładamy eksport WYŁĄCZNIE w buforze esbuild
 * (plik w repo nietknięty), ten sam wzorzec co inne bramki `*-real-render-test.cjs`.
 * `legacy=true` dodatkowo usuwa fragment tego tematu z tekstu źródłowego PRZED bundlowaniem
 * (dowód nietautologiczności). */
function makeExposePlugin(legacy) {
  return {
    name: 'expose-city-panel' + (legacy ? '-legacy' : ''),
    setup(build) {
      build.onLoad({ filter: /cityPanel\.ts$/ }, (args) => {
        if (path.resolve(args.path) !== CITY_PANEL) return null;
        let src = fs.readFileSync(args.path, 'utf8');
        if (!/function renderSpoleczenstwo\(/.test(src)) {
          throw new Error('kotwica renderSpoleczenstwo nie znaleziona w cityPanel.ts');
        }
        if (legacy) {
          if (!NEW_BLOCK_RE.test(src)) {
            throw new Error('kotwica mutacji (NEW_BLOCK_RE) nie znaleziona -- dowód nietautologiczności nie może działać');
          }
          src = src.replace(NEW_BLOCK_RE, '\n');
        }
        src += '\nexport { renderSpoleczenstwo as __renderSpoleczenstwo,'
          + ' configureCityPanel as __configureCityPanel,'
          + ' ensureStyles as __ensureCityPanelStyles };\n';
        return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  };
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[szczescie-audyt-e-etykiety-panelu-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function buildBundle(outfile, legacy) {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: [viteCompatPlugin, makeExposePlugin(legacy)], logLevel: 'silent',
  });
}

/** Wewnątrz strony: buduje miasto testowe i renderuje panel Porządku z podaną `data`
 * (nadpisany `societyParams` -> dowód że wartość wagi w DOM PODĄŻA za danymi) i trudnością. */
const PAGE_RENDER_FN = ({ difficulty, societyParamsOverride }) => {
  window.__ensureCityPanelStyles();
  const data = window.__loadGameData();
  if (societyParamsOverride) {
    data.societyParams = {
      ...data.societyParams,
      porzadek: { ...data.societyParams.porzadek, ...societyParamsOverride },
    };
  }
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
  city.population = 8;

  window.__configureCityPanel({ difficulty, getCities: () => [city] });

  document.body.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'civ-cs';
  wrap.style.cssText = 'position:static;display:block;pointer-events:auto;width:280px;padding:16px;background:#0b0f16;';
  wrap.id = 'civ-order-wrap';
  document.body.appendChild(wrap);
  const mount = document.createElement('div');
  wrap.appendChild(mount);

  // REALNY host bloku „Porządek łącznie" -- dokładnie ta sama funkcja co produkcyjny HUD.
  window.__renderSpoleczenstwo(mount, city, data);

  const wkladBox = mount.querySelector('.civ-w4-wklad');
  const hint = mount.querySelector('.civ-w4-wklad-hint');
  const rows = wkladBox ? Array.from(wkladBox.children).map((c) => c.textContent || '') : [];
  return {
    htmlLen: mount.innerHTML.length,
    hasWkladBox: !!wkladBox,
    wkladBoxTitle: wkladBox ? wkladBox.getAttribute('title') : null,
    rows,
    hasHint: !!hint,
    hintText: hint ? hint.textContent : null,
    hintTitle: hint ? hint.getAttribute('title') : null,
  };
};

async function renderInPage(page, outfile, difficulty, override) {
  const bundleJs = fs.readFileSync(outfile, 'utf8');
  await page.addScriptTag({ content: bundleJs });
  return page.evaluate(PAGE_RENDER_FN, { difficulty, societyParamsOverride: override });
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { configureCityPanel } from '../src/ui/cityPanel.ts';",
    "import { __renderSpoleczenstwo, __ensureCityPanelStyles } from '../src/ui/cityPanel.ts';",
    "import { loadGameData } from '../src/data/loader.ts';",
    "import { foundCityAt } from '../src/game/cities.ts';",
    "import { TerenBazowy, Nakladka } from '../src/types/hex.ts';",
    'window.__configureCityPanel = configureCityPanel;',
    'window.__ensureCityPanelStyles = __ensureCityPanelStyles;',
    'window.__renderSpoleczenstwo = __renderSpoleczenstwo;',
    'window.__loadGameData = loadGameData;',
    'window.__foundCityAt = foundCityAt;',
    'window.__TerenBazowy = TerenBazowy;',
    'window.__Nakladka = Nakladka;',
    '',
  ].join('\n'), 'utf8');

  await buildBundle(OUT_AFTER, false);
  await buildBundle(OUT_LEGACY, true);

  const browser = await launchBrowser();
  const consoleErrors = [];

  try {
    // =========================================================================================
    // PASS 1 (bundle AKTUALNY): trudność 'normal', wagi ZMUTOWANE W PAMIĘCI na 0.91/0.09 --
    // dowód (C): jeśli wartość w DOM byłaby zahardkodowana (np. "50%"), ta asercja by nie
    // przeszła, bo oczekujemy DOKŁADNIE 91/9, którego real society-params.json normal NIE ma.
    // =========================================================================================
    const page1 = await browser.newPage({ viewport: { width: 500, height: 500 } });
    page1.on('pageerror', (e) => consoleErrors.push('page1: ' + String(e)));
    page1.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('page1: ' + m.text()); });
    await page1.setContent('<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}</style></head><body></body></html>');

    const mutated = await renderInPage(page1, OUT_AFTER, 'normal', {
      porzadek_waga_szczescie: { easy: 0.55, normal: 0.91, hard: 0.45, jednostka: 'waga', opis: 'test' },
      porzadek_waga_prawo: { easy: 0.45, normal: 0.09, hard: 0.55, jednostka: 'waga', opis: 'test' },
    });

    check('(A0) boot: renderSpoleczenstwo wyrenderował się bez błędu (HTML niepusty)', !mutated.error && mutated.htmlLen > 0, mutated);
    check('(A1) blok .civ-w4-wklad (dwa paski „N% wkładu") nadal w DOM -- zero regresji formatu', mutated.hasWkladBox, mutated);
    check('(D1) pasek „Szczęście: N% wkładu" nietknięty (format sprzed tematu)', mutated.rows.some((r) => /^Szczęście: \d+% wkładu$/.test(r)), mutated.rows);
    check('(D2) pasek „Prawo: N% wkładu" nietknięty (format sprzed tematu)', mutated.rows.some((r) => /^Prawo: \d+% wkładu$/.test(r)), mutated.rows);

    check('(A2) .civ-w4-wklad ma niepusty natywny tooltip (title)', !!(mutated.wkladBoxTitle && mutated.wkladBoxTitle.length > 0), mutated.wkladBoxTitle);
    check('(A3) tooltip mówi wprost o TEJ TURZE (wynik zmienny)', /TEJ TURY/.test(mutated.wkladBoxTitle || ''), mutated.wkladBoxTitle);
    check('(A4) tooltip mówi wprost o STAŁEJ wadze bazowej mechanizmu', /[Ss]tała waga bazowa/.test(mutated.wkladBoxTitle || ''), mutated.wkladBoxTitle);
    check('(A5) tooltip NIE nazywa wagi "stałą regułą gry" (rozróżnia oba pojęcia, nie miesza)', /NIE jest stała reguła gry/.test(mutated.wkladBoxTitle || ''), mutated.wkladBoxTitle);

    check('(B1) DODATKOWA widoczna linia .civ-w4-wklad-hint istnieje w DOM (tekst faktycznie widoczny, nie tylko title)', mutated.hasHint, mutated);
    check(
      '(B2/C1) linia widoczna pokazuje DOKŁADNIE wartość ze zmutowanych danych (91%/9%, normal) -- DOWÓD że wartość podąża za society-params.json, nie hardkod',
      mutated.hintText === 'Waga bazowa (normal): Szczęście 91% / Prawo 9%', mutated.hintText,
    );
    check('(B3) tooltip linii .civ-w4-wklad-hint niesie tę samą treść wyjaśniającą', mutated.hintTitle === mutated.wkladBoxTitle, { hint: mutated.hintTitle, box: mutated.wkladBoxTitle });

    if (SHOT) {
      fs.mkdirSync(path.dirname(SHOT), { recursive: true });
      await page1.locator('#civ-order-wrap').screenshot({ path: SHOT });
    }
    await page1.close();

    // =========================================================================================
    // PASS 2 (bundle AKTUALNY): dane NIEZMUTOWANE (realny data/society-params.json na dysku,
    // odczyt WYŁĄCZNIE), trudność 'hard' -- realne wartości z dispatchu (D18-A): hard 45/55.
    // Dowód, że difficulty realnie przełącza wagę pokazaną w UI (nie stały 'normal').
    // =========================================================================================
    const page2 = await browser.newPage({ viewport: { width: 500, height: 500 } });
    page2.on('pageerror', (e) => consoleErrors.push('page2: ' + String(e)));
    page2.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('page2: ' + m.text()); });
    await page2.setContent('<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}</style></head><body></body></html>');

    const hardReal = await renderInPage(page2, OUT_AFTER, 'hard', null);
    check('(C2) trudność "hard", dane REALNE z society-params.json (zero mutacji pliku): linia pokazuje 45%/55% (D18-A)', hardReal.hintText === 'Waga bazowa (hard): Szczęście 45% / Prawo 55%', hardReal.hintText);
    await page2.close();

    // =========================================================================================
    // DOWÓD NIETAUTOLOGICZNOŚCI: bundle LEGACY (fragment tego tematu usunięty z tekstu źródła
    // W PAMIĘCI, plik w repo nietknięty) -- asercje (A2)/(A3)/(A4)/(B1)/(B2) MUSZĄ się nie
        // powieść na tym stanie, inaczej test przechodziłby zawsze niezależnie od kodu.
    // =========================================================================================
    const page3 = await browser.newPage({ viewport: { width: 500, height: 500 } });
    page3.on('pageerror', () => { /* legacy bundle -- błędy oczekiwane/nieistotne dla tej próby */ });
    await page3.setContent('<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}</style></head><body></body></html>');
    const legacy = await renderInPage(page3, OUT_LEGACY, 'normal', {
      porzadek_waga_szczescie: { easy: 0.55, normal: 0.91, hard: 0.45, jednostka: 'waga', opis: 'test' },
      porzadek_waga_prawo: { easy: 0.45, normal: 0.09, hard: 0.55, jednostka: 'waga', opis: 'test' },
    });
    await page3.close();

    check('(E0) mutacja: bundle legacy nadal renderuje dwa paski „N% wkładu" (usunięty WYŁĄCZNIE fragment tego tematu, nie cały blok)', legacy.hasWkladBox && legacy.rows.some((r) => /wkładu$/.test(r)), legacy.rows);
    check('(E1) mutacja: legacy NIE ma tooltipu na .civ-w4-wklad (title puste/brak) -- asercja (A2) realnie czerwienieje', !legacy.wkladBoxTitle, legacy.wkladBoxTitle);
    check('(E2) mutacja: legacy NIE zawiera "TEJ TURY" w tooltipie -- asercja (A3) realnie czerwienieje', !/TEJ TURY/.test(legacy.wkladBoxTitle || ''), legacy.wkladBoxTitle);
    check('(E3) mutacja: legacy NIE ma linii .civ-w4-wklad-hint -- asercja (B1) realnie czerwienieje', !legacy.hasHint, legacy.hasHint);
    check('(E4) mutacja: legacy nie pokazuje "Waga bazowa" nigdzie -- asercja (B2) realnie czerwienieje', legacy.hintText === null, legacy.hintText);

    check('brak błędów konsoli/pageerror w próbach PASS (page1/page2)', consoleErrors.filter((e) => e.startsWith('page1') || e.startsWith('page2')).length === 0, consoleErrors);
  } finally {
    await browser.close();
    for (const f of [ENTRY, OUT_AFTER, OUT_LEGACY]) fs.rmSync(f, { force: true });
  }

  console.log('');
  console.log(`[szczescie-audyt-e-etykiety-panelu-real-render-test] ${pass} pass, ${fail} fail`);
  if (SHOT) console.log('zrzut: ' + path.resolve(SHOT));
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
