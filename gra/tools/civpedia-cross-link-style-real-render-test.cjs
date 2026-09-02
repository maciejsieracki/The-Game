'use strict';
/**
 * civpedia-cross-link-style-real-render-test.cjs
 *
 * TEMAT: P-CIVPEDIA-KARTY-LINKI-NIEOSTYLOWANE-REGRES-T10-Q1.
 *
 * Co pilnuje (i dlaczego akurat w PRAWDZIWEJ przeglądarce, nie w jsdom):
 *
 *  (A) `ENTITY_CARD_CSS` (`entityCards/renderer.ts`) MA reguły dla
 *      `.entity-card-row-key`/`.entity-card-row-value`. Do T10 wartości wierszy były
 *      `<span>`, więc brak stylu był niewidoczny; T10 (`f17e257e`) zamienił wartości
 *      z `row.linkTo` na `<button>` i przeglądarka zaczęła je rysować jako natywny,
 *      jasny/wypukły przycisk z czarnym tekstem — zgłoszenie właściciela („dziwne
 *      napisy na białym tle"). jsdom NIE potrafi tego wykryć: nie ma w nim
 *      domyślnego arkusza UA dla `<button>` ani realnego kaskadowania, więc
 *      `getComputedStyle(button).backgroundColor` jest tam puste ZAWSZE — i przed,
 *      i po naprawie. Dlatego test liczy REALNE `getComputedStyle` w Chromium.
 *
 *  (B) Wszystkie TRZY warianty linku krzyżowego renderowane przez `renderer.ts`
 *      (`.entity-card-row-value` w wierszu grid, `.entity-card-row-action-text` w
 *      wierszu z odznaką, `.entity-card-pill-text` w pigułce) oraz link
 *      `.entity-card-civpedia-link` mają JEDEN, wspólny język wizualny: brak
 *      natywnego tła/ramki, złoty kolor, podkreślenie, kursor pointer.
 *
 *  (C) Sekcja „Technologie" karty podglądu budynku w panelu budowy miasta
 *      (`cityPanel.ts`, `.bld-detail-tile` + `.dc-grid`/`.dc-l`/`.dc-v`, budowana
 *      przez `appendTechDetailBlock`) realnie renderuje się jako SIATKA — etykieta i
 *      wartość w tym samym wierszu, ale w różnych kolumnach. Regres: CSS tych klas
 *      istnieje wyłącznie pod selektorami zakotwiczonymi w klasie `detail-card`
 *      (`.civ-cs .detail-card .dc-grid`), której karta po migracji T5/T6 do
 *      `entityCards` już nie ma — pola zlewały się w jeden ciąg tekstu
 *      („Odblokowuje techObróbka drewnaEpoka techKamień..."). jsdom nie liczy
 *      layoutu (`getBoundingClientRect()` zwraca zera), więc tylko realny Chromium
 *      potrafi odróżnić siatkę od zlanego bloku.
 *
 *  (D) MUTACJA: po wycięciu dopisanego bloku CSS ze wstrzykniętych arkuszy test
 *      MUSI zacząć oblewać — inaczej niczego nie sprawdza (precedens
 *      `P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1`).
 *
 * Usage (z gra/): node tools/civpedia-cross-link-style-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[civpedia-cross-link-style-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.civpedia-cross-link-style-entry.ts');
const OUTFILE = path.resolve(__dirname, '.civpedia-cross-link-style-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CITY_PANEL = path.resolve(GRA, 'src', 'ui', 'cityPanel.ts');
const RENDERER = path.resolve(GRA, 'src', 'ui', 'entityCards', 'renderer.ts');
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');

// Kotwice bloku CSS dopisanego przez ten temat — używane też przez mutację (D).
const MARKER_RENDERER = '/* P-CIVPEDIA-KARTY-LINKI-NIEOSTYLOWANE-REGRES-T10-Q1: brakujace';
const MARKER_RENDERER_END = '.entity-card-row-icon{';
const MARKER_CITY = '/* P-CIVPEDIA-KARTY-LINKI-NIEOSTYLOWANE-REGRES-T10-Q1 (trzeci komponent';

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

/** Vite-owe konstrukcje (`import.meta.glob`, `*.svg?raw`, `*.css?raw`) nie istnieją w gołym
 * esbuildzie. Zamiast stubować ikony pustym stringiem inline'ujemy PRAWDZIWE pliki, żeby
 * render w Chromium był 1:1 z produkcją (ikony wpływają na layout wiersza — patrz (C)). */
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

/** `cityPanel.ts` nie eksportuje wewnętrznych builderów kart — dokładamy eksporty przez
 * onLoad, BEZ modyfikowania pliku w repo (kod produkcyjny leci do bundla 1:1). */
const exposeCityPanelPlugin = {
  name: 'expose-city-panel',
  setup(build) {
    build.onLoad({ filter: /cityPanel\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== CITY_PANEL) return null;
      return {
        contents: fs.readFileSync(args.path, 'utf8')
          + '\nexport { buildBuildingBuildTabDetailCard as __buildBuildingBuildTabDetailCard,'
          + ' ensureStyles as __ensureCityPanelStyles };\n',
        loader: 'ts', resolveDir: path.dirname(args.path),
      };
    });
  },
};

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[civpedia-cross-link-style-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Zbiera pomiary obu asercji (A/B i C) z żywej strony. */
async function measure(page) {
  return page.evaluate(() => {
    const linkStyle = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return { missing: true };
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName,
        bg: cs.backgroundColor,
        bgImage: cs.backgroundImage,
        borderTopWidth: cs.borderTopWidth,
        color: cs.color,
        decoration: cs.textDecorationLine,
        cursor: cs.cursor,
      };
    };
    const grid = document.querySelector('#civ-test-dock .dc-grid');
    const gridCs = grid ? getComputedStyle(grid) : null;
    const ls = grid ? Array.from(grid.querySelectorAll('.dc-l')) : [];
    const vs = grid ? Array.from(grid.querySelectorAll('.dc-v')) : [];
    const l = ls[0] || null;
    const v = vs[0] || null;
    const lr = l ? l.getBoundingClientRect() : null;
    const vr = v ? v.getBoundingClientRect() : null;
    // Rozstrzygający dowód siatki vs. zlanego bloku inline: w siatce WSZYSTKIE wartości
    // startują w tej samej kolumnie (ta sama współrzędna X) niezależnie od długości
    // etykiety; przy inline'owym zlaniu każda wartość startuje tam, gdzie skończyła się
    // jej etykieta, więc X-y się rozjeżdżają.
    const valueLefts = vs.slice(0, 4).map((e) => Math.round(e.getBoundingClientRect().left));
    return {
      rowValue: linkStyle('#civ-test-card button.entity-card-row-value'),
      actionText: linkStyle('#civ-test-card button.entity-card-row-action-text'),
      // Pudelkiem przycisku pigulki jest KONTENER .entity-card-pill, a zloty tekst zostaje
      // na przycisku w srodku — dlatego dwa osobne pomiary.
      pill: linkStyle('#civ-test-card .entity-card-pill'),
      pillText: linkStyle('#civ-test-card button.entity-card-pill-text'),
      civpediaLink: linkStyle('#civ-test-dock button.entity-card-civpedia-link'),
      techBtn: linkStyle('#civ-test-dock .dc-v-btn'),
      grid: gridCs ? { display: gridCs.display } : null,
      pair: (lr && vr) ? {
        label: l.textContent.trim(), value: v.textContent.trim(),
        sameRow: Math.abs(lr.top - vr.top) < 6,
        valueLefts,
        columnAligned: valueLefts.length >= 2 && valueLefts.every((x) => x === valueLefts[0]),
      } : null,
      tileHeadUppercase: (() => {
        const hd = document.querySelector('#civ-test-dock .bld-detail-tile-hd');
        return hd ? getComputedStyle(hd).textTransform : null;
      })(),
    };
  });
}

const GOLD = 'rgb(232, 216, 138)';
function isNativeButtonLook(s) {
  // Natywny przycisk Chromium: niepusta ramka + wypełnione tło (buttonface).
  return !s.missing && s.borderTopWidth !== '0px' && s.bg !== 'rgba(0, 0, 0, 0)';
}
/* P-ENTITYCARD-LINKI-KRZYZOWE-NA-PRZYCISKI-Q1: jezyk wizualny linkow krzyzowych zmienil sie
   ze "zloty podkreslony link" na PRZYCISK (obwodka + ciemne tlo, zero podkreslenia) — na
   wprost zgloszenie wlasciciela ("przyciski wygladaja bardziej profesjonalnie niz linki").
   Asercja pilnuje TEGO SAMEGO co przedtem: wspolnego jezyka wszystkich czterech wariantow
   i braku natywnego przycisku przegladarki — zmienil sie wylacznie wzorzec docelowy.
   Pelny dowod nowego stylu (hierarchia wobec akcji primary, trzy kopie .dc-v-btn, zrzuty):
   tools/entity-card-cross-links-button-style-real-render-test.cjs. */
/* RUNDA 1 OBRONA, zarzut 2: pierwsza wersja tej asercji przenosila z dawnego link-looku
   warunek `s.bg === 'rgba(0, 0, 0, 0)'` — czyli WYMAGALA braku tla od elementu, ktoremu
   GOAL kaze miec "stonowane tlo"; przechodzila tylko dlatego, ze wypelnienie jest
   `background-image` (gradient), a nie `background-color`. Warunek jest teraz odwrocony
   na wlasciwa strone: wymagamy OBECNOSCI wypelnienia, obojetnie ktora wlasciwoscia. */
function hasFill(s) {
  return s.bg !== 'rgba(0, 0, 0, 0)' || (typeof s.bgImage === 'string' && s.bgImage !== 'none');
}
function isNavButtonLook(s) {
  return !s.missing && parseFloat(s.borderTopWidth) >= 1 && hasFill(s)
    && s.color === GOLD && !s.decoration.includes('underline') && s.cursor === 'pointer';
}

async function main() {
  // --- (0) Statyczna kotwica: blok CSS istnieje w źródle (czytelny sygnał przy regresie) ---
  const rendererSrc = fs.readFileSync(RENDERER, 'utf8');
  check('(0) ENTITY_CARD_CSS zawiera regułę .entity-card-row-key', /\n\.entity-card-row-key\{/.test(rendererSrc));
  check('(0) ENTITY_CARD_CSS zawiera regułę .entity-card-row-value', /\n\.entity-card-row-value\{/.test(rendererSrc));
  check('(0) ENTITY_CARD_CSS resetuje natywny wygląd <button> dla linków krzyżowych',
    /button\.entity-card-row-value[\s\S]{0,400}appearance:none/.test(rendererSrc));
  check('(0) techDiscoveryNotice.ts NIE duplikuje już lokalnego stylu linku improvement',
    !/#\$\{HOST_ID\} \.entity-card-row-value\[data-entity-kind="improvement"\]\{/.test(
      fs.readFileSync(path.resolve(GRA, 'src', 'ui', 'techDiscoveryNotice.ts'), 'utf8')));

  fs.writeFileSync(ENTRY, [
    "import { renderEntityCard, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
    "import { __buildBuildingBuildTabDetailCard, __ensureCityPanelStyles } from '../src/ui/cityPanel.ts';",
    "import { loadGameData } from '../src/data/loader.ts';",
    'window.__renderEntityCard = renderEntityCard;',
    'window.__ENTITY_CARD_CSS = ENTITY_CARD_CSS;',
    'window.__buildBuildingBuildTabDetailCard = __buildBuildingBuildTabDetailCard;',
    'window.__ensureCityPanelStyles = __ensureCityPanelStyles;',
    'window.__loadGameData = loadGameData;',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: [viteCompatPlugin, exposeCityPanelPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  try {
    // Globalny reset 1:1 z `gra/index.html` — bez niego pomiar tła/ramki przycisku byłby
    // liczony w innym otoczeniu niż produkcyjne.
    await page.setContent('<!DOCTYPE html><html><head><style>'
      + '*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;font-family:monospace;}'
      + '</style></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    await page.evaluate(() => {
      // (A/B) Karta z WSZYSTKIMI trzema wariantami linku + linkiem CivPedia.
      const style = document.createElement('style');
      style.id = 'entity-card-css-under-test';
      style.textContent = window.__ENTITY_CARD_CSS;
      document.head.appendChild(style);
      const card = window.__renderEntityCard({
        kind: 'technology', id: 'x', title: 'Test',
        medallion: { kind: 'icon', svg: '<svg></svg>' },
        sections: [
          { key: 'g', title: 'Grid', rows: [{ label: 'Technologia', value: 'Obróbka drewna', linkTo: { kind: 'technology', id: 't' } }] },
          { key: 'b', title: 'Badge', rows: [{ label: 'Możesz teraz', value: 'Żegluga', badge: { kind: 'ok', label: 'Możesz teraz' }, linkTo: { kind: 'technology', id: 'z' } }] },
          { key: 'p', title: 'Pills', rows: [{ label: 'Rolnictwo', value: '', linkTo: { kind: 'technology', id: 'r' } }], layout: 'pills' },
        ],
      });
      card.id = 'civ-test-card';
      document.body.appendChild(card);

      // (C) Karta podglądu budynku w panelu budowy — PRAWDZIWY builder z cityPanel.ts.
      window.__ensureCityPanelStyles();
      const data = window.__loadGameData();
      const def = data.buildings.find((b) => /Palisada drewniana/i.test(b.nazwa)) || data.buildings[0];
      const wrap = document.createElement('div');
      wrap.className = 'civ-cs';
      wrap.style.cssText = 'position:static;display:block;pointer-events:auto;width:432px;padding:16px;';
      const scope = document.createElement('div');
      scope.className = 'civ-detail-scope civ-hover-detail-scope';
      const dock = document.createElement('div');
      dock.className = 'civ-hover-detail-content';
      dock.id = 'civ-test-dock';
      dock.style.cssText = 'width:400px;';
      scope.appendChild(dock); wrap.appendChild(scope); document.body.appendChild(wrap);
      dock.appendChild(window.__buildBuildingBuildTabDetailCard(def, data, undefined, {}));

      // Przełącznik mutacji (D): wycięcie dopisanego bloku CSS ze wszystkich arkuszy.
      window.__origCss = new Map();
      window.__setFix = (on, mR, mRe, mC) => {
        document.querySelectorAll('style').forEach((s) => {
          if (!window.__origCss.has(s)) window.__origCss.set(s, s.textContent);
          const orig = window.__origCss.get(s);
          if (on) { s.textContent = orig; return; }
          let out = orig;
          const a = out.indexOf(mR);
          if (a > -1) { const b = out.indexOf(mRe, a); if (b > -1) out = out.slice(0, a) + out.slice(b); }
          const c = out.indexOf(mC);
          if (c > -1) out = out.slice(0, c);
          s.textContent = out;
        });
      };
    });

    const m = await measure(page);

    check('(A) wiersz grid: wartość z linkTo jest <button>', m.rowValue.tag === 'BUTTON', m.rowValue);
    check('(A) wiersz grid: link NIE wygląda jak natywny przycisk przeglądarki (brak ramki i tła)',
      !isNativeButtonLook(m.rowValue), m.rowValue);
    check('(A) wiersz grid: link krzyzowy ma styl PRZYCISKU (obwodka, zloty tekst, bez podkreslenia)',
      isNavButtonLook(m.rowValue), m.rowValue);
    check('(B) wiersz z odznaką: link ma TEN SAM język wizualny', isNavButtonLook(m.actionText), m.actionText);
    // RUNDA 1 OBRONA, zarzut 1: pudelko przycisku niesie KLIKALNY <button>, a nie
    // nieklikalny kontener .entity-card-pill (delegacja lapie wylacznie
    // button[data-entity-kind], wiec malowanie kontenera dawalo martwa strefe).
    check('(B) pigułka: pudełko przycisku niesie sam <button> (ten sam element, który łapie klik)',
      isNavButtonLook(m.pillText), m.pillText);
    check('(B) pigułka: kontener NIE maluje już pudełka ani cursor:pointer (był nieklikalny)',
      !m.pill.missing && parseFloat(m.pill.borderTopWidth) === 0
      && m.pill.cursor !== 'pointer' && !hasFill(m.pill), m.pill);
    check('(B) link "Więcej informacji (Civpedia)" ma TEN SAM język wizualny',
      isNavButtonLook(m.civpediaLink), m.civpediaLink);
    check('(C) link "Zobacz pełną kartę technologii →" w panelu budowy ma TEN SAM język wizualny',
      isNavButtonLook(m.techBtn), m.techBtn);

    check('(C) sekcja "Technologie" karty w panelu budowy renderuje .dc-grid jako REALNĄ siatkę',
      m.grid && m.grid.display === 'grid', m.grid);
    check('(C) etykieta i wartość pierwszego pola są w TYM SAMYM wierszu (brak zlanego bloku tekstu)',
      m.pair && m.pair.sameRow, m.pair);
    check('(C) wszystkie wartości startują w TEJ SAMEJ kolumnie X (dowód realnej siatki, nie inline flow)',
      m.pair && m.pair.columnAligned, m.pair);
    check('(C) nagłówek kafla ("TECHNOLOGIE") ma odzyskany styl uppercase',
      m.tileHeadUppercase === 'uppercase', m.tileHeadUppercase);

    // --- (D) MUTACJA: bez dopisanego bloku CSS te same asercje MUSZĄ oblać ---
    console.log('\n-- Mutacja: wycięcie dopisanego bloku CSS z arkuszy --');
    await page.evaluate(({ mR, mRe, mC }) => window.__setFix(false, mR, mRe, mC),
      { mR: MARKER_RENDERER, mRe: MARKER_RENDERER_END, mC: MARKER_CITY });
    const mut = await measure(page);
    check('(D) mutacja: link wiersza grid WRACA do natywnego wyglądu przycisku (test realnie testuje)',
      isNativeButtonLook(mut.rowValue), mut.rowValue);
    check('(D) mutacja: .dc-grid PRZESTAJE być siatką (wraca zlany blok tekstu)',
      !mut.grid || mut.grid.display !== 'grid', mut.grid);
    check('(D) mutacja: wartości PRZESTAJĄ być wyrównane do wspólnej kolumny (zlany tekst inline)',
      !mut.pair || !mut.pair.columnAligned, mut.pair);
    await page.evaluate(({ mR, mRe, mC }) => window.__setFix(true, mR, mRe, mC),
      { mR: MARKER_RENDERER, mRe: MARKER_RENDERER_END, mC: MARKER_CITY });

    check('brak błędów konsoli/pageerror w trakcie renderu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE, { force: true });
  }

  console.log('');
  console.log(`[civpedia-cross-link-style-real-render-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
