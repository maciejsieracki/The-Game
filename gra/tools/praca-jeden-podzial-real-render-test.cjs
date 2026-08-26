'use strict';
/**
 * praca-jeden-podzial-real-render-test.cjs — REAL RENDER (Chromium/Playwright)
 *
 * TEMAT: R-PRACA-JEDEN-PODZIAL-Q1, zmienione UI sekcji „Podział pracy" w panelu miasta.
 *
 * CO DOWODZI (w ŻYWEJ przeglądarce, nie w jsdom i nie gremp-em źródła):
 *  (A) sekcja renderuje JEDEN suwak podziału Pracy, o zakresie 50–100% dla budynków;
 *  (B) obie kolumny („Budynki" i „Ulepszenia (pula)") pokazują wartości sumujące się
 *      DOKŁADNIE do 100% — stan „100 i 50" jest niemożliwy do wyświetlenia;
 *  (C) udział ulepszeń NIGDY nie przekracza 50% — także wtedy, gdy ktoś spróbuje
 *      ustawić wartość spoza zakresu WPROST na żywym elemencie (natywny `<input
 *      type="range">` klampuje do `min`, czego sam grep źródła nie potwierdzi);
 *  (D) etykieta drugiego strumienia NIE mówi już samego „Ulepszenia" — niesie prawdziwego
 *      adresata („pula"), bo z tej samej puli finansowane są też cuda na mapie,
 *      zakładanie miast i wycinka (root cause ośmiu nawrotów tego tematu).
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA: atrybuty `min`/`max` natywnego suwaka fizycznie
 * ograniczają wartość, jaką gracz ustawi drag'iem/klawiaturą — a klamrowanie wartości
 * spoza zakresu robi silnik przeglądarki, nie nasz kod. Grep źródła pokazuje tylko,
 * jaki string trafia do szablonu.
 *
 * MUTACJA (kontrola negatywna, JEDNA na asercję): po odczycie żywego stanu test ręcznie
 * psuje DOM (rozszerza zakres suwaka, rozjeżdża sumę kolumn, przywraca mylącą etykietę)
 * i potwierdza, że każda z asercji wtedy PADA — dowód, że nie są tautologiami.
 *
 * Usage (z gra/): node tools/praca-jeden-podzial-real-render-test.cjs [--shot out.png]
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[praca-jeden-podzial-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.praca-jeden-podzial-rr-entry.ts');
const OUTFILE = path.resolve(__dirname, '.praca-jeden-podzial-rr-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CITY_PANEL = path.resolve(GRA, 'src', 'ui', 'cityPanel.ts');
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');

const SHOT = (() => {
  const i = process.argv.indexOf('--shot');
  return i > -1 ? process.argv[i + 1] : null;
})();

/** Emoji, które w panelu Pracy NIE MOGĄ już dotrzeć do gracza jako gołe glify. */
const BANNED = ['\u{1F528}', '\u{1F3DB}', '\u{1F4E6}', '\u{1F464}']; // 🔨 🏛 📦 👤
const BANNED_LABEL = { '\u{1F528}': 'mlotek 🔨', '\u{1F3DB}': 'budynek 🏛', '\u{1F4E6}': 'skrzynka 📦', '\u{1F464}': 'chlopek 👤' };

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
 * esbuildzie. Inline'ujemy PRAWDZIWE pliki SVG (ten sam wzorzec co
 * `civpedia-cross-link-style-real-render-test.cjs`) — inaczej `cityPanelChipIconWrap()`
 * zwracałoby pusty string i test „nie widziałby" żadnej ikony ANI przed, ANI po. */
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
      return {
        contents: fs.readFileSync(args.path, 'utf8')
          + '\nexport { renderPodzialPracy as __renderPodzialPracy,'
          + ' buildPracaDetailCard as __buildPracaDetailCard,'
          + ' buildTopBarPracaDetailCard as __buildTopBarPracaDetailCard,'
          + ' computeView as __computeView,'
          + ' cpInlineIcons as __cpInlineIcons,'
          + ' CP_INLINE_EMOJI_BRAND as __CP_INLINE_EMOJI_BRAND,'
          + ' ensureStyles as __ensureCityPanelStyles };\n',
        loader: 'ts', resolveDir: path.dirname(args.path),
      };
    });
  },
};

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[praca-jeden-podzial-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}


async function main() {
  const citySrc = fs.readFileSync(CITY_PANEL, 'utf8');

  // --- (0) Kotwice w źródle: jedna rodzina nazw zamiast czterech różnych ---------------
  // R-PRACA-JEDEN-PODZIAL-Q1 RUNDA 2 (F2) — AKTUALIZACJA TEJ ASERCJI, jawnie uzasadniona:
  //   CO PILNOWAŁA: że nazwa drugiego strumienia jest JEDNĄ stałą, nie czterema literałami.
  //   DLACZEGO STARY WARUNEK PRZESTAŁ BYĆ PRAWDĄ: stałe były LOKALNE dla `cityPanel.ts`, więc
  //     `empireDetailPanel.ts` i `buildModeHud.ts` miały własne, rozjechane literały (bloker F2).
  //     Definicje przeniesiono do JEDNEGO źródła `game/cities.ts`; w `cityPanel.ts` zostały już
  //     tylko aliasy.
  //   CO PILNUJE TERAZ: ta sama własność, ale dla WSZYSTKICH TRZECH paneli naraz — warunek jest
  //     mocniejszy: literał nie może mieszkać w pliku UI, a każdy panel musi czytać wspólną stałą.
  const citiesSrc = fs.readFileSync(path.resolve(GRA, 'src', 'game', 'cities.ts'), 'utf8');
  check('(0) etykieta drugiego strumienia to JEDNA stała w game/cities.ts, nie literał w UI',
    /export const PODZIAL_PRACY_PULA_LBL = 'Ulepszenia \(pula\)';/.test(citiesSrc)
      && /export const PODZIAL_PRACY_PULA_LBL_PELNA = 'Ulepszenia \(pula imperium\)';/.test(citiesSrc)
      && /const PULA_LBL = PODZIAL_PRACY_PULA_LBL;/.test(citySrc)
      && /const PULA_LBL_PELNA = PODZIAL_PRACY_PULA_LBL_PELNA;/.test(citySrc));
  // R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1 — AKTUALIZACJA TEJ ASERCJI (uzasadnienie w 01-operator.md):
  //   CO PILNOWALA: ze panel imperium i HUD trybu budowy czytaja TE SAMA stala nazwy warstwy (a)
  //     (`CityPodzialPracy.procentBudynki`) — koniec trzeciej, rozjechanej nazwy tej samej liczby.
  //   DLACZEGO STARY WARUNEK PRZESTAL BYC PRAWDA: HUD trybu budowy NIE RENDERUJE juz warstwy (a)
  //     w ogole — trzeci egzemplarz suwaka zostal usuniety (ECHO wlasciciela: „w tym miejscu
  //     podzial pracy nie jest potrzebny, bo jest dublowany juz w pool imperium"). Plik nie
  //     importuje juz `PODZIAL_PRACY_PULA_LBL*`. UWAGA: stary warunek nadal przechodzil BLADEM —
  //     regex trafial w KOMENTARZ objasniajacy usuniecie, nie w zywy import. Zielone z komentarza
  //     nie jest dowodem, wiec asercja zostaje rozdzielona na dwie, obie odporne na komentarze.
  //   CO PILNUJE TERAZ (warunek mocniejszy): (1) panel imperium NADAL ma zywy import wspolnej
  //     stalej; (2) HUD budowy NIE ma zywego importu nazw warstwy (a) — sprawdzane na zrodle
  //     ze zdjetymi komentarzami, wiec nie da sie tego zazielenic komentarzem.
  const bezKomentarzy = (src) => src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !/^\s*(\/\/|\*)/.test(l)).join('\n');
  const empSrcNoCom = bezKomentarzy(fs.readFileSync(path.resolve(GRA, 'src', 'ui', 'empireDetailPanel.ts'), 'utf8'));
  const hudSrcNoCom = bezKomentarzy(fs.readFileSync(path.resolve(GRA, 'src', 'ui', 'buildModeHud.ts'), 'utf8'));
  check('(0) panel imperium czyta WSPOLNA stala nazwy warstwy (a) (zywy kod, nie komentarz)',
    /PODZIAL_PRACY_PULA_LBL/.test(empSrcNoCom));
  check('(0) HUD trybu budowy NIE renderuje juz warstwy (a): zero nazw i zero markupu tego suwaka',
    !/PODZIAL_PRACY_PULA_LBL/.test(hudSrcNoCom)
      && !/renderEmpirePracaSplit|civ-build-global-split|data-praca-empire-split/.test(hudSrcNoCom));
  check('(0) pole `doUlepszen` niosące pulę imperium zniknęło z cityPanel.ts',
    !/\bdoUlepszen\b\s*[:,)]/.test(citySrc.split('\n').filter((l) => !/^\s*(\*|\/\/)/.test(l)).join('\n')));

  fs.writeFileSync(ENTRY, [
    "import { configureCityPanel } from '../src/ui/cityPanel.ts';",
    "import { __renderPodzialPracy, __computeView, __ensureCityPanelStyles } from '../src/ui/cityPanel.ts';",
    "import { loadGameData } from '../src/data/loader.ts';",
    "import { foundCityAt } from '../src/game/cities.ts';",
    "import { TerenBazowy, Nakladka } from '../src/types/hex.ts';",
    'window.__configureCityPanel = configureCityPanel;',
    'window.__renderPodzialPracy = __renderPodzialPracy;',
    'window.__computeView = __computeView;',
    'window.__ensureCityPanelStyles = __ensureCityPanelStyles;',
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
        // PRAWDZIWA ścieżka zapisu panelu; zapis do miasta jak w main.ts (override
        // rozstrzyga `applyPodzialPracyLocalChange`, testowany osobno w bramce kontraktu).
        getPodzialPracy: (id) => (id === city.id ? (city.podzialPracy || { procentBudynki: 70 }) : null),
        onPodzialPracyChange: (id, split) => {
          if (id === city.id) city.podzialPracy = { procentBudynki: split.procentBudynki };
        },
        getEmpireHud: () => ({ pracaPool: 137, pracaRate: 13 }),
      });

      const wrap = document.createElement('div');
      wrap.className = 'civ-cs';
      wrap.style.cssText = 'position:static;display:block;pointer-events:auto;width:460px;padding:16px;';
      wrap.id = 'civ-praca-wrap';
      document.body.appendChild(wrap);
      const mount = document.createElement('div');
      mount.id = 'civ-praca-hero';
      wrap.appendChild(mount);
      window.__mount = mount;
      window.__renderAt = (pctB) => {
        city.podzialPracy = { procentBudynki: pctB };
        const view = window.__computeView(city, window.__map, window.__data);
        window.__renderPodzialPracy(window.__mount, city, view, window.__data);
      };
      window.__renderAt(70);
      return { htmlLen: mount.innerHTML.length };
    });
    check('boot: sekcja „Podział pracy" wyrenderowana bez błędu, HTML niepusty',
      !boot.error && boot.htmlLen > 0, boot);

    /** Odczyt ŻYWEGO DOM-u sekcji: suwak + obie kolumny procentowe. */
    const readLive = () => page.evaluate(() => {
      const root = document.querySelector('#civ-praca-hero');
      const inp = root ? root.querySelector('input[type="range"]') : null;
      const cols = root ? Array.from(root.querySelectorAll('.praca-split-col')) : [];
      const pct = (el) => {
        const m = (el.textContent || '').match(/(\d+)\s*%/);
        return m ? Number(m[1]) : null;
      };
      const left = cols.find((c) => c.classList.contains('left'));
      const right = cols.find((c) => c.classList.contains('right'));
      return {
        sliderMissing: !inp,
        sliderCount: root ? root.querySelectorAll('input[type="range"]').length : 0,
        min: inp ? inp.getAttribute('min') : null,
        max: inp ? inp.getAttribute('max') : null,
        value: inp ? inp.value : null,
        leftText: left ? (left.textContent || '').replace(/\s+/g, ' ').trim() : null,
        rightText: right ? (right.textContent || '').replace(/\s+/g, ' ').trim() : null,
        leftPct: left ? pct(left) : null,
        rightPct: right ? pct(right) : null,
        summaryText: root ? (root.querySelector('.praca-split-summary')?.textContent || '').replace(/\s+/g, ' ').trim() : null,
      };
    });

    // --- (A) JEDEN suwak, zakres 50–100% dla budynków ------------------------------------
    const live70 = await readLive();
    check('(A) w sekcji jest DOKŁADNIE JEDEN suwak podziału Pracy', live70.sliderCount === 1, live70);
    check('(A) suwak ma min="50" na żywym elemencie DOM', live70.min === '50', live70);
    check('(A) suwak ma max="100" na żywym elemencie DOM', live70.max === '100', live70);

    // --- (B) suma kolumn = 100% dla całej siatki kontraktu --------------------------------
    for (const pctU of [0, 10, 20, 30, 40, 50]) {
      const pctB = 100 - pctU;
      await page.evaluate((v) => window.__renderAt(v), pctB);
      const l = await readLive();
      check(`(B) ulepszenia ${pctU}%: kolumny sumują się do 100% (${l.leftPct}+${l.rightPct})`,
        l.leftPct + l.rightPct === 100, l);
      check(`(B) ulepszenia ${pctU}%: kolumna ulepszeń pokazuje dokładnie ${pctU}%`,
        l.rightPct === pctU, l);
      check(`(B) ulepszenia ${pctU}%: wartość suwaka = ${pctB}% budynków`, l.value === String(pctB), l);
    }

    // --- (C) > 50% na ulepszenia nieosiągalne NA ŻYWYM suwaku ----------------------------
    await page.evaluate((v) => window.__renderAt(v), 70);
    const clamped = await page.evaluate(() => {
      const inp = document.querySelector('#civ-praca-hero input[type="range"]');
      inp.value = '20';               // próba: 80% na ulepszenia
      const after20 = inp.value;      // natywny klamp przeglądarki do min
      inp.value = '0';                // próba: 100% na ulepszenia
      const after0 = inp.value;
      inp.value = '120';
      const after120 = inp.value;
      return { after20, after0, after120 };
    });
    check('(C) próba ustawienia 80% na ulepszenia jest klampowana przez przeglądarkę do 50% budynków',
      clamped.after20 === '50', clamped);
    check('(C) próba ustawienia 100% na ulepszenia jest klampowana do 50% budynków',
      clamped.after0 === '50', clamped);
    check('(C) wartość powyżej zakresu jest klampowana do 100% budynków (0% ulepszeń)',
      clamped.after120 === '100', clamped);

    // --- (D) etykieta niesie prawdziwego adresata ----------------------------------------
    await page.evaluate((v) => window.__renderAt(v), 70);
    const labels = await readLive();
    check('(D) kolumna budynków nazwana „Budynki"', /Budynki/.test(labels.leftText), labels);
    check('(D) kolumna drugiego strumienia mówi „Ulepszenia" ORAZ „pula" (nie samo „Ulepszenia")',
      /Ulepszenia/.test(labels.rightText) && /pula/i.test(labels.rightText), labels);
    check('(D) nagłówek sekcji mówi „Ulepszenia (pula imperium)"',
      /Ulepszenia \(pula imperium\)/.test(labels.summaryText), labels);

    check('brak błędów konsoli/pageerror w trakcie renderu', consoleErrors.length === 0, consoleErrors);

    if (SHOT) {
      await page.locator('#civ-praca-wrap').screenshot({ path: SHOT });
      console.log('[shot] zapisano zrzut żywego Chromium: ' + SHOT);
    }

    // --- (E) MUTACJE: jedna na asercję — dowód, że powyższe NIE są tautologiami ----------
    const mut = await page.evaluate(() => {
      const root = document.querySelector('#civ-praca-hero');
      const inp = root.querySelector('input[type="range"]');
      // MUT-1: rozluźnienie zakresu suwaka (regres capu 50%).
      inp.setAttribute('min', '0');
      const mutMin = inp.getAttribute('min');
      inp.value = '20';
      const mutClamp = inp.value;
      inp.setAttribute('min', '50');
      // MUT-2: rozjechanie sumy kolumn (stan „100 i 50").
      const right = root.querySelector('.praca-split-col.right');
      const rightBefore = right.innerHTML;
      right.innerHTML = right.innerHTML.replace(/\d+%/, '50%');
      const left = root.querySelector('.praca-split-col.left');
      const leftBefore = left.innerHTML;
      left.innerHTML = left.innerHTML.replace(/\d+%/, '100%');
      const pct = (el) => Number(((el.textContent || '').match(/(\d+)\s*%/) || [])[1]);
      const mutSum = pct(left) + pct(right);
      left.innerHTML = leftBefore;
      // MUT-3: powrót do mylącej etykiety „Ulepszenia" bez adresata.
      right.innerHTML = 'Ulepszenia 30%';
      const mutLabel = (right.textContent || '');
      right.innerHTML = rightBefore;
      return { mutMin, mutClamp, mutSum, mutLabel };
    });
    check('(E) MUT-1: po rozluźnieniu min suwak przyjmuje 20% budynków — asercja (A/C) faktycznie by PADŁA',
      mut.mutMin === '0' && mut.mutClamp === '20', mut);
    check('(E) MUT-2: rozjechana suma kolumn (100+50=150) — asercja (B) faktycznie by PADŁA',
      mut.mutSum === 150, mut);
    check('(E) MUT-3: sama „Ulepszenia" bez słowa „pula" — asercja (D) faktycznie by PADŁA',
      /Ulepszenia/.test(mut.mutLabel) && !/pula/i.test(mut.mutLabel), mut);
    // Po mutacjach DOM wraca do stanu produkcyjnego — kontrola, że mutacje nie zostały.
    const restored = await readLive();
    check('(E) po mutacjach DOM wrócił do stanu produkcyjnego (suma 100%, min=50)',
      restored.min === '50' && restored.leftPct + restored.rightPct === 100, restored);
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE, { force: true });
  }

  console.log('');
  console.log(`[praca-jeden-podzial-real-render-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
