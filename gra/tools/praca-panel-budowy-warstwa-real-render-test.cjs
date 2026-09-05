'use strict';
/**
 * praca-panel-budowy-warstwa-real-render-test.cjs
 *
 * TEMAT: R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1.
 *
 * TRZY WARSTWY PODZIALU PRACY — nazewnictwo obowiazujace w calym tym pliku:
 *   (a) `CityPodzialPracy.procentBudynki` — podzial Pracy MIASTA: budynki vs pula imperium
 *       (udzial puli 0–`MAX_PROCENT_PULI_IMPERIUM` = 0–50%). Prawowite miejsca w UI:
 *       `empireDetailPanel.ts` (globalnie) i `cityPanel.ts` (per miasto).
 *   (b) podzial samej puli na ulepszenia vs budzet budowy — NIE ISTNIEJE (usuniete
 *       w R-PRACA-JEDEN-PODZIAL-Q1). Zostaly tylko nagrobki w komentarzach.
 *   (c) `UlepszeniaEmpirePolicy.pracaAutoPercent` (globalnie) + `City.ulepszeniaPracaPercent`
 *       (per miasto) — ile ze SKUMULOWANEJ puli Pracy imperium moze w jednej turze wydac
 *       automat ulepszen terenu. Zakres 0–`MAX_ULEPSZENIA_PRACA_AUTO_PERCENT` = 0–100%.
 *
 * ZGLOSZENIE WLASCICIELA: panel trybu budowy pokazywal TRZECI egzemplarz warstwy (a)
 * („w tym miejscu podzial pracy nie jest potrzebny, bo jest dublowany juz w pool imperium"),
 * a warstwe (c) — te, o ktora wlasciciel prosil — chowal pod `tryb === 'auto'`, podczas gdy
 * domyslnym trybem nowej gry jest `'reczny'`. Wiec na starcie gracz widzial w tym panelu
 * ZLA warstwe, a wlasciwej nie widzial wcale.
 *
 * CO MIERZY TEN TEST (zachowanie, nie ksztalt zrodla):
 *   (A) tryb 'reczny': suwak warstwy (c) JEST w zywym DOM, jest `disabled`, ma wyjasnienie;
 *       markup warstwy (a) NIE wystepuje w panelu.  + ZRZUT z Chromium.
 *   (B) tryb 'auto': ten sam suwak warstwy (c) jest AKTYWNY i realny drag zapisuje wartosc
 *       przez `onUlepszeniaEmpirePracaPercentChange`.  + ZRZUT z Chromium.
 *   (C) warstwa (a) NADAL DZIALA w `empireDetailPanel.ts` — realny drag suwaka w Chromium
 *       zapisuje `procentBudynki` do sklepu (pomiar zachowania, nie regex).
 *   (D) warstwa (a) NADAL DZIALA w `cityPanel.ts` — realny drag suwaka w Chromium zapisuje
 *       `city.podzialPracy.procentBudynki` (pomiar zachowania, nie regex).
 *   (E) LICZBOWO: warstwa (c) faktycznie steruje budzetem automatu — pula 5 000,
 *       `pracaAutoPercent` 10% vs 50% daje ROZNA liczbe ulepszen w turze (prawdziwy
 *       `pickAutoImprovements`, nie reimplementacja formuly).
 *   (F) MUTACJE ZRODLA — po jednej celowanej mutacji na asercje, kazda MUSI zapalic
 *       odpowiadajaca jej asercje na czerwono. Mutanty powstaja WYLACZNIE w pamieci
 *       (plugin `onLoad` esbuilda); zaden plik repo nie jest modyfikowany.
 *
 * Usage (z gra/): node tools/praca-panel-budowy-warstwa-real-render-test.cjs
 *   --no-shots  pomija zapis zrzutow (asercje (A)/(B)/(C)/(D)/(E) bez zmian)
 *   --shots-dir <kat>  katalog na zrzuty (domyslnie tools/.shots-praca-panel-budowy-warstwa)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
let chromium;
try { ({ chromium } = require(path.resolve(GRA, 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[praca-panel-budowy-warstwa] playwright missing — npm i -D playwright');
  process.exit(1);
}

const ARGV = process.argv.slice(2);
const NO_SHOTS = ARGV.includes('--no-shots');
// Artefakty (bundle, mutanty, zrzuty) ida do os.tmpdir(), NIE do drzewa repo — katalog
// `gra/` nie jest w allowliscie tego tematu poza `src/ui/buildModeHud.ts`, `src/main.ts`
// i `tools/*`, wiec bramka nie moze zasmiecac repo ani wymuszac zmiany `.gitignore`.
// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalogi/pliki tymczasowe unikalne per przebieg ---
// Stala nazwa pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly przebieg (takze
// uruchomiony z innego worktree). Skutek dziala w obie strony: raz falszywy CZERWONY
// (jeden bieg czysci drugiemu katalog w locie), raz falszywy ZIELONY (dwa biegi mierza
// ten sam artefakt, wiec "parytet" jest artefaktem kolizji, nie dowodem). Sufiks
// per-proces to rozlacza; asercje i progi bramki pozostaja nietkniete.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
// Unikalnosc BEZ sprzatania zamienilaby kolizje w staly wyciek dysku (brak miejsca to
// ta sama klasa problemu z drugiej strony), wiec kasujemy WLASNE artefakty tego biegu.
// Dopasowanie po TMPDIR_RUN_ID nie moze trafic w cudzy katalog. Zrzuty/podglady
// zostaja na dysku celowo — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6).
process.on('exit', () => {
  // `require` lokalnie: hak musi dzialac takze w plikach, ktore nie maja `fs`/`path`
  // w zasiegu modulu — inaczej ReferenceError wpada w catch i sprzatanie milczy.
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      if (!ent.includes(TMPDIR_RUN_ID)) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
});
// Przerwanie (SIGTERM z `timeout`, SIGINT z Ctrl-C, SIGHUP) nie odpala haka `exit`.
// Przekierowujemy je na process.exit(), zeby sprzatanie wyzej wykonalo sie tak samo.
// SIGKILL jest nieprzechwytywalny i zostawi katalog — to jedyna luka i jest swiadoma.
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { process.exit(130); });
}

const SHOTS_DIR = (() => {
  const i = ARGV.indexOf('--shots-dir');
  return i >= 0 && ARGV[i + 1]
    ? path.resolve(ARGV[i + 1])
    : path.join(os.tmpdir(), `civ-shots-praca-panel-budowy-warstwa-${TMPDIR_RUN_ID}`);
})();
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const HUD_TS = path.resolve(GRA, 'src/ui/buildModeHud.ts');
const EMP_TS = path.resolve(GRA, 'src/ui/empireDetailPanel.ts');
const CITY_TS = path.resolve(GRA, 'src/ui/cityPanel.ts');
const AUTO_TS = path.resolve(GRA, 'src/game/auto-improvements.ts');

const TMP = path.join(os.tmpdir(), `civ-praca-panel-budowy-warstwa-${TMPDIR_RUN_ID}`);
fs.mkdirSync(TMP, { recursive: true });

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

// ---------------------------------------------------------------------------------------
// Bundlowanie: prawdziwy kod produkcyjny 1:1, z opcjonalna podmiana JEDNEGO pliku na mutant.
// ---------------------------------------------------------------------------------------
/** `import.meta.glob` (Vite) nie istnieje w esbuildzie — ten sam stub co w istniejacych bramkach. */
const viteCompatPlugin = {
  name: 'vite-compat',
  setup(build) {
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

/** Dokladamy eksporty wewnetrznych builderow BEZ modyfikowania plikow w repo. */
function exposeInternalsPlugin(mutations) {
  return {
    name: 'expose-internals',
    setup(build) {
      // `(^|/)` zamiast `icons/`: `icons/iconRegistry.ts` importuje `./brandAssets`
      // i `./scienceOwlIcon` bez przedrostka katalogu (ten sam wzorzec co w bramce
      // build-panel-ulepszenia-scroll-real-render-test.cjs).
      // Ikony marki sa importowane jako `*.svg?raw` (Vite). esbuild nie zna tego sufiksu,
      // wiec kazdy taki import dostaje pusty string — realny kod ikon zostaje w bundlu 1:1,
      // znika tylko tresc SVG, ktora dla tego pomiaru nie ma znaczenia.
      build.onResolve({ filter: /\.svg\?raw$/ }, (a) => ({ path: a.path, namespace: 'svg-raw' }));
      build.onLoad({ filter: /.*/, namespace: 'svg-raw' }, () => ({ contents: '', loader: 'text' }));
      build.onLoad({ filter: /\.ts$/ }, (args) => {
        const abs = path.resolve(args.path);
        let src = null;
        if (Object.prototype.hasOwnProperty.call(mutations, abs)) src = mutations[abs];
        if (abs === CITY_TS) {
          src = (src ?? fs.readFileSync(abs, 'utf8'))
            + '\nexport { renderPodzialPracy as __renderPodzialPracy,'
            + ' computeView as __computeView, ensureStyles as __ensureCityPanelStyles };\n';
        }
        if (abs === EMP_TS) {
          src = (src ?? fs.readFileSync(abs, 'utf8'))
            + '\nexport { renderEmpirePracaBudgetSplitSection as __renderEmpirePracaSplitSection };\n';
        }
        if (src === null) return null;
        if (src.includes('import.meta.glob')) {
          src = 'const __viteGlobStub = () => ({});\n' + src.replace(/import\.meta\.glob/g, '__viteGlobStub');
        }
        return { contents: src, loader: 'ts', resolveDir: path.dirname(abs) };
      });
    },
  };
}

const J = (p) => JSON.stringify(p);
const BROWSER_ENTRY_SRC = [
  `import { createBuildModeHud } from ${J(HUD_TS)};`,
  `import { configureEmpireGlobalDefaults, __renderEmpirePracaSplitSection } from ${J(EMP_TS)};`,
  `import { configureCityPanel, __renderPodzialPracy, __computeView, __ensureCityPanelStyles } from ${J(CITY_TS)};`,
  `import { loadGameData } from ${J(path.resolve(GRA, 'src/data/loader.ts'))};`,
  `import { foundCityAt } from ${J(path.resolve(GRA, 'src/game/cities.ts'))};`,
  `import { TerenBazowy, Nakladka } from ${J(path.resolve(GRA, 'src/types/hex.ts'))};`,
  'window.__createBuildModeHud = createBuildModeHud;',
  'window.__configureEmpireGlobalDefaults = configureEmpireGlobalDefaults;',
  'window.__renderEmpirePracaSplitSection = __renderEmpirePracaSplitSection;',
  'window.__configureCityPanel = configureCityPanel;',
  'window.__renderPodzialPracy = __renderPodzialPracy;',
  'window.__computeView = __computeView;',
  'window.__ensureCityPanelStyles = __ensureCityPanelStyles;',
  'window.__loadGameData = loadGameData;',
  'window.__foundCityAt = foundCityAt;',
  'window.__TerenBazowy = TerenBazowy;',
  'window.__Nakladka = Nakladka;',
  '',
].join('\n');

async function buildBrowserBundle(mutations, tag) {
  const entry = path.resolve(TMP, `entry-${tag}.ts`);
  const out = path.resolve(TMP, `bundle-${tag}.js`);
  fs.writeFileSync(entry, BROWSER_ENTRY_SRC, 'utf8');
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: out, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: [viteCompatPlugin, exposeInternalsPlugin(mutations || {})], logLevel: 'silent',
  });
  return fs.readFileSync(out, 'utf8');
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[praca-panel-budowy-warstwa] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Fixture panelu trybu budowy — budowany W PRZEGLADARCE (callbacki nie serializuja sie). */
const HUD_FIXTURE_SRC = `
window.__zapisy = [];
window.__mountHud = function (tryb) {
  document.body.innerHTML = '';
  window.__zapisy = [];
  const hud = window.__createBuildModeHud({
    listTypes: () => [],
    getActiveKey: () => null,
    onSelectType: () => {},
    onExit: () => {},
    isOpen: () => true,
    listPlayerCities: () => [{ id: 'm1', name: 'Testowo' }],
    getUlepszeniaCityId: () => 'm1',
    onUlepszeniaCityIdChange: () => {},
    getUlepszeniaEmpireState: () => ({
      focus: 'zrownowazone', tryb: tryb, onlyWorked: false, pracaAutoPercent: 33,
    }),
    onUlepszeniaEmpireFocusChange: () => {},
    onUlepszeniaEmpireTrybChange: () => {},
    onUlepszeniaEmpireOnlyWorkedChange: () => {},
    onUlepszeniaEmpirePracaPercentChange: (p) => { window.__zapisy.push(p); },
    getUlepszeniaCityOverride: () => false,
    onUlepszeniaCityOverrideChange: () => {},
    getUlepszeniaEffectiveState: () => ({
      focus: 'zrownowazone', tryb: tryb, onlyWorked: false, pracaAutoPercent: 33, override: false,
    }),
    onUlepszeniaCityFocusChange: () => {},
    onUlepszeniaCityTrybChange: () => {},
    onUlepszeniaCityOnlyWorkedChange: () => {},
    onUlepszeniaCityPracaPercentChange: () => {},
  });
  document.body.appendChild(hud.el);
  hud.el.style.cssText = 'position:static;display:block;width:340px;padding:10px;';
  hud.update();
  return hud;
};
window.__zmierzHud = function () {
  const panel = document.querySelector('.civ-build-panel') || document.body;
  const c = panel.querySelector('input[data-ulepszenia-empire-percent]');
  const row = c ? c.closest('.civ-build-percent-row') : null;
  const note = row ? row.querySelector('.civ-build-percent-note') : null;
  const head = row ? row.querySelector('.civ-build-percent-head span') : null;
  return {
    warstwaC_obecna: !!c,
    warstwaC_disabled: c ? c.disabled : null,
    warstwaC_max: c ? c.getAttribute('max') : null,
    warstwaC_value: c ? c.value : null,
    warstwaC_etykieta: head ? head.textContent.trim() : null,
    warstwaC_wyjasnienie: note ? note.textContent.trim() : null,
    warstwaC_widoczna: c ? (c.getClientRects().length > 0 && c.getBoundingClientRect().width > 0) : false,
    warstwaA_markup: panel.querySelectorAll(
      '[data-praca-empire-split], .civ-build-global-split, [data-praca-split-scope]').length,
  };
};
`;

// ---------------------------------------------------------------------------------------
// (E) DOWOD LICZBOWY — prawdziwy pickAutoImprovements, bundlowany do CJS.
// ---------------------------------------------------------------------------------------
async function buildPickerBundle(mutantAutoSrc, tag) {
  const entry = path.resolve(TMP, `pick-entry-${tag}.ts`);
  const out = path.resolve(TMP, `pick-bundle-${tag}.cjs`);
  fs.writeFileSync(entry, `export { pickAutoImprovements } from ${JSON.stringify(AUTO_TS)};\n`, 'utf8');
  const mutPlugin = {
    name: 'mutate-auto',
    setup(build) {
      build.onLoad({ filter: /auto-improvements\.ts$/ }, (args) => {
        if (!mutantAutoSrc || path.resolve(args.path) !== AUTO_TS) return null;
        return { contents: mutantAutoSrc, loader: 'ts', resolveDir: path.dirname(AUTO_TS) };
      });
    },
  };
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: out, absWorkingDir: GRA, plugins: [mutPlugin], logLevel: 'silent',
  });
  delete require.cache[require.resolve(out)];
  return require(out).pickAutoImprovements;
}

/** Plaska mapa rowninna 24x24 — kazdy heks kwalifikuje sie pod farme (profil 'zywnosc'). */
function makeFlatMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      hexes[`${q},${r}`] = {
        coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
        wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}

/** Jedno wywolanie pickera przy zadanym `pracaAutoPercent` (warstwa (c)). PULA STALA = 5000. */
function policzUlepszenia(picker, pracaAutoPercent) {
  const PULA = 5000;
  const map = makeFlatMap(24, 24);
  const city = { id: 'c1', ownerId: 0, q: 12, r: 12, name: 'Testowo', population: 10 };
  const picks = picker({
    cities: [city],
    ownerId: 0,
    map,
    territoryNodes: [{ q: city.q, r: city.r, pop: city.population, level: 1, ownerId: 0 }],
    placedImprovements: new Map(),
    pracaAvailable: PULA,
    unlockedTechs: new Set(['Rolnictwo', 'Kamieniarstwo', 'Hodowla', 'Garncarstwo']),
    pracaSurplusThreshold: 0,
    skipWyrab: true,
    civArchetype: 'grecy',
    getFocus: () => 'zywnosc',
    getOnlyWorked: () => false,
    // WARSTWA (c): polityka imperium — % SKUMULOWANEJ puli na automat w tej turze.
    pracaBudgetPercent: pracaAutoPercent,
    getPracaBudgetPercent: () => pracaAutoPercent,
  });
  return { liczba: picks.length, koszt: picks.reduce((s, p) => s + p.kosztPraca, 0), pula: PULA };
}

async function main() {
  // =====================================================================================
  // CZESC I — zywy render w Chromium (kod produkcyjny bez mutacji)
  // =====================================================================================
  const bundleCzysty = await buildBrowserBundle({}, 'czysty');
  const browser = await launchBrowser();
  const consoleErrors = [];
  if (!NO_SHOTS) fs.mkdirSync(SHOTS_DIR, { recursive: true });

  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    await page.setContent('<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;font-family:system-ui,sans-serif;}</style></head><body></body></html>');
    await page.addScriptTag({ content: bundleCzysty });
    await page.addScriptTag({ content: HUD_FIXTURE_SRC });

    // --- (A) tryb 'reczny' — warstwa (c) widoczna i NIEAKTYWNA, warstwa (a) nieobecna ---
    const reczny = await page.evaluate(() => { window.__mountHud('reczny'); return window.__zmierzHud(); });
    check('(A) tryb "reczny": suwak WARSTWY (c) (pracaAutoPercent) JEST w zywym DOM',
      reczny.warstwaC_obecna === true, reczny);
    check('(A) tryb "reczny": suwak warstwy (c) jest realnie widoczny (niezerowa geometria)',
      reczny.warstwaC_widoczna === true, reczny);
    check('(A) tryb "reczny": suwak warstwy (c) jest NIEAKTYWNY (disabled)',
      reczny.warstwaC_disabled === true, reczny);
    check('(A) tryb "reczny": pod suwakiem warstwy (c) stoi wyjasnienie, kiedy zadziala',
      typeof reczny.warstwaC_wyjasnienie === 'string' && /automatyzacj/i.test(reczny.warstwaC_wyjasnienie), reczny);
    check('(A) tryb "reczny": etykieta warstwy (c) mowi o pracy automatycznej, nie o podziale Budynki/Pula',
      typeof reczny.warstwaC_etykieta === 'string'
        && /automatyczn/i.test(reczny.warstwaC_etykieta)
        && !/Budynki/i.test(reczny.warstwaC_etykieta), reczny);
    check('(A) tryb "reczny": ZERO markupu WARSTWY (a) (procentBudynki) w panelu trybu budowy',
      reczny.warstwaA_markup === 0, reczny);
    if (!NO_SHOTS) {
      await page.locator('.civ-build-panel').screenshot({ path: path.join(SHOTS_DIR, 'A-tryb-reczny.png') });
      console.log('[shot] ' + path.join(SHOTS_DIR, 'A-tryb-reczny.png'));
    }

    // --- (B) tryb 'auto' — ten sam suwak AKTYWNY, realny zapis wartosci ------------------
    const auto = await page.evaluate(() => { window.__mountHud('auto'); return window.__zmierzHud(); });
    check('(B) tryb "auto": suwak warstwy (c) JEST w zywym DOM i jest AKTYWNY',
      auto.warstwaC_obecna === true && auto.warstwaC_disabled === false, auto);
    check('(B) tryb "auto": suwak warstwy (c) ma pelny zakres 0-100% (MAX_ULEPSZENIA_PRACA_AUTO_PERCENT)',
      auto.warstwaC_max === '100', auto);
    check('(B) tryb "auto": ZERO markupu WARSTWY (a) rowniez tutaj',
      auto.warstwaA_markup === 0, auto);
    const zapis = await page.evaluate(() => {
      const inp = document.querySelector('input[data-ulepszenia-empire-percent]');
      inp.value = '64';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      const row = inp.closest('.civ-build-percent-row');
      const lbl = row ? row.querySelector('[data-ulepszenia-empire-percent-label]') : null;
      return { zapisy: window.__zapisy.slice(), etykietaPoDragu: lbl ? lbl.textContent.trim() : null };
    });
    check('(B) tryb "auto": realny ruch suwakiem zapisuje warstwe (c) przez onUlepszeniaEmpirePracaPercentChange(64)',
      zapis.zapisy.length > 0 && zapis.zapisy[zapis.zapisy.length - 1] === 64, zapis);
    // ZNALEZISKO UBOCZNE z dispatchu: usuniety handler warstwy (a) nadpisywal podsumowanie
    // innym formatem niz render poczatkowy („50% ulepszenia / 50% budynki" malymi literami
    // vs „50% Ulepszenia (pula) / 50% Budynki"), wiec napis zmienial sie po pierwszym ruchu
    // suwakiem. Zniknal razem z blokiem warstwy (a) — tu SPRAWDZAMY POMIAREM, ze ten sam
    // wzorzec nie powtarza sie w suwaku warstwy (c), ktory w tym panelu zostaje.
    check('(B) znalezisko uboczne: etykieta warstwy (c) po ruchu suwakiem ma TEN SAM format co render poczatkowy',
      zapis.etykietaPoDragu === '64%', zapis);

    if (!NO_SHOTS) {
      await page.evaluate(() => window.__mountHud('auto'));
      await page.locator('.civ-build-panel').screenshot({ path: path.join(SHOTS_DIR, 'B-tryb-auto.png') });
      console.log('[shot] ' + path.join(SHOTS_DIR, 'B-tryb-auto.png'));
    }

    // --- (C) WARSTWA (a) NADAL DZIALA w panelu imperium — pomiar zachowania --------------
    const empPomiar = await page.evaluate(async () => {
      document.body.innerHTML = '';
      const sklep = { procentBudynki: 70 };
      window.__configureEmpireGlobalDefaults({
        getOwnerDefaultPodzialPracy: () => ({ procentBudynki: sklep.procentBudynki }),
        onOwnerDefaultPodzialPracyChange: (ownerId, split) => {
          sklep.procentBudynki = split.procentBudynki;
          sklep.ostatniOwner = ownerId;
        },
      });
      const host = document.createElement('div');
      host.id = 'emp-host';
      host.innerHTML = window.__renderEmpirePracaSplitSection();
      document.body.appendChild(host);
      await new Promise((res) => queueMicrotask(res));   // sekcja wpina listenery w microtasku
      const inp = host.querySelector('input[data-praca-empire-split]');
      if (!inp) return { brakSuwaka: true };
      const przed = sklep.procentBudynki;
      inp.value = '40';                                   // 40% do puli => 60% budynkow
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      const poDrag = sklep.procentBudynki;
      const btnMax = host.querySelector('[data-praca-empire-split-max]');
      btnMax.click();                                     // MAX = 50% do puli => 50% budynkow
      return {
        przed, poDrag, poMax: sklep.procentBudynki,
        max: inp.getAttribute('max'),
        hero: (host.querySelector('[data-praca-empire-split-hero]') || {}).textContent,
      };
    });
    check('(C) panel imperium: suwak WARSTWY (a) nadal sie renderuje', !empPomiar.brakSuwaka, empPomiar);
    check('(C) panel imperium: drag warstwy (a) na 40% puli ZAPISUJE procentBudynki = 60 (pomiar zachowania)',
      empPomiar.przed === 70 && empPomiar.poDrag === 60, empPomiar);
    check('(C) panel imperium: znacznik MAX warstwy (a) zapisuje procentBudynki = 50 (cap 0-50% puli dziala)',
      empPomiar.poMax === 50 && empPomiar.max === '50', empPomiar);

    // --- (D) WARSTWA (a) NADAL DZIALA w panelu miasta — pomiar zachowania ----------------
    const cityPomiar = await page.evaluate(async () => {
      document.body.innerHTML = '';
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
      if (!city) return { blad: 'foundCityAt zwrocilo null' };
      city.population = 6;
      city.podzialPracy = { procentBudynki: 70 };
      window.__configureCityPanel({
        data, difficulty: 'normal', getCities: () => [city],
        getPodzialPracy: (id) => (id === city.id ? (city.podzialPracy || { procentBudynki: 70 }) : null),
        onPodzialPracyChange: (id, split) => {
          if (id === city.id) city.podzialPracy = { procentBudynki: split.procentBudynki };
        },
        getEmpireHud: () => ({ pracaPool: 137, pracaRate: 13 }),
      });
      const wrap = document.createElement('div');
      wrap.className = 'civ-cs';
      wrap.style.cssText = 'position:static;display:block;width:460px;padding:16px;';
      document.body.appendChild(wrap);
      const mount = document.createElement('div');
      wrap.appendChild(mount);
      const view = window.__computeView(city, map, data);
      window.__renderPodzialPracy(mount, city, view, data);
      await new Promise((res) => queueMicrotask(res));
      const inp = mount.querySelector('input[type="range"]');
      if (!inp) return { brakSuwaka: true };
      const przed = city.podzialPracy.procentBudynki;
      // Suwak warstwy (a) w panelu miasta chodzi krokiem 10 — bierzemy wartosc z siatki kroku,
      // zeby pomiar mierzyl ZAPIS, a nie zaokraglenie kroku.
      inp.value = '90';                                   // 90% budynkow => 10% do puli
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      return { przed, po: city.podzialPracy.procentBudynki, min: inp.getAttribute('min'), max: inp.getAttribute('max') };
    });
    check('(D) panel miasta: suwak WARSTWY (a) nadal sie renderuje', !cityPomiar.brakSuwaka && !cityPomiar.blad, cityPomiar);
    check('(D) panel miasta: realny ruch suwakiem ZAPISUJE procentBudynki = 90 (pomiar zachowania)',
      cityPomiar.przed === 70 && cityPomiar.po === 90, cityPomiar);
    check('(D) panel miasta: zakres warstwy (a) to nadal 50-100% budynkow',
      cityPomiar.min === '50' && cityPomiar.max === '100', cityPomiar);

    check('brak bledow konsoli/pageerror w calym renderze', consoleErrors.length === 0, consoleErrors.slice(0, 5));

    // =====================================================================================
    // CZESC III — MUTACJE ZRODLA (mutant tylko w pamieci, repo nietkniete)
    // =====================================================================================
    console.log('\n-- Mutacje zrodla: kazda MUSI zapalic swoja asercje na czerwono --');
    const hudSrc = fs.readFileSync(HUD_TS, 'utf8');

    // M1: cofniecie p.2 — suwak warstwy (c) z powrotem TYLKO pod `tryb === 'auto'`.
    const m1 = hudSrc.replace(
      "          const trybAuto = empireState.tryb === 'auto';\n          html += renderUlepszeniaPercentRow(",
      "          const trybAuto = empireState.tryb === 'auto';\n          if (trybAuto) html += renderUlepszeniaPercentRow(");
    if (m1 === hudSrc) { check('(F/M1) mutacja przygotowana', false, 'kotwica M1 nie trafila'); }
    else {
      const b = await buildBrowserBundle({ [HUD_TS]: m1 }, 'm1');
      const p2 = await browser.newPage({ viewport: { width: 900, height: 1100 } });
      await p2.setContent('<!DOCTYPE html><html><body></body></html>');
      await p2.addScriptTag({ content: b });
      await p2.addScriptTag({ content: HUD_FIXTURE_SRC });
      const r = await p2.evaluate(() => { window.__mountHud('reczny'); return window.__zmierzHud(); });
      await p2.close();
      check('(F/M1) po cofnieciu warstwy (c) pod `tryb === "auto"` asercja (A) "suwak JEST w reczny" PADA',
        r.warstwaC_obecna === false, r);
    }

    // M2: usuniecie stanu `disabled` — suwak w 'reczny' bylby aktywny.
    const m2 = hudSrc.replace(
      "    + (disabled ? 'disabled aria-disabled=\"true\" ' : '')\n", '');
    if (m2 === hudSrc) { check('(F/M2) mutacja przygotowana', false, 'kotwica M2 nie trafila'); }
    else {
      const b = await buildBrowserBundle({ [HUD_TS]: m2 }, 'm2');
      const p2 = await browser.newPage({ viewport: { width: 900, height: 1100 } });
      await p2.setContent('<!DOCTYPE html><html><body></body></html>');
      await p2.addScriptTag({ content: b });
      await p2.addScriptTag({ content: HUD_FIXTURE_SRC });
      const r = await p2.evaluate(() => { window.__mountHud('reczny'); return window.__zmierzHud(); });
      await p2.close();
      check('(F/M2) po usunieciu `disabled` asercja (A) "suwak NIEAKTYWNY w reczny" PADA',
        r.warstwaC_disabled === false, r);
    }

    // M3: ponowne wstawienie bloku WARSTWY (a) do panelu trybu budowy.
    const m3 = hudSrc.replace(
      "        html += '<div class=\"lbl\">Automatyzacja ulepszeń terenu</div>';",
      "        html += '<div class=\"civ-build-global-split\" data-praca-split-scope=\"empire\">'\n"
      + "          + '<input type=\"range\" data-praca-empire-split value=\"25\" />' + '</div>';\n"
      + "        html += '<div class=\"lbl\">Automatyzacja ulepszeń terenu</div>';");
    if (m3 === hudSrc) { check('(F/M3) mutacja przygotowana', false, 'kotwica M3 nie trafila'); }
    else {
      const b = await buildBrowserBundle({ [HUD_TS]: m3 }, 'm3');
      const p2 = await browser.newPage({ viewport: { width: 900, height: 1100 } });
      await p2.setContent('<!DOCTYPE html><html><body></body></html>');
      await p2.addScriptTag({ content: b });
      await p2.addScriptTag({ content: HUD_FIXTURE_SRC });
      const r = await p2.evaluate(() => { window.__mountHud('reczny'); return window.__zmierzHud(); });
      await p2.close();
      check('(F/M3) po ponownym wstawieniu bloku warstwy (a) asercja (A) "ZERO markupu warstwy (a)" PADA',
        r.warstwaA_markup > 0, r);
    }

    // M4: zepsucie zapisu warstwy (a) w panelu imperium — asercja (C) musi paść.
    const empSrc = fs.readFileSync(EMP_TS, 'utf8');
    const m4 = empSrc.replace('      onChange(0, podzialPracyZProcentuPuli(pctU));\n', '');
    if (m4 === empSrc) { check('(F/M4) mutacja przygotowana', false, 'kotwica M4 nie trafila'); }
    else {
      const b = await buildBrowserBundle({ [EMP_TS]: m4 }, 'm4');
      const p2 = await browser.newPage({ viewport: { width: 900, height: 1100 } });
      await p2.setContent('<!DOCTYPE html><html><body></body></html>');
      await p2.addScriptTag({ content: b });
      const r = await p2.evaluate(async () => {
        const sklep = { procentBudynki: 70 };
        window.__configureEmpireGlobalDefaults({
          getOwnerDefaultPodzialPracy: () => ({ procentBudynki: sklep.procentBudynki }),
          onOwnerDefaultPodzialPracyChange: (o, s) => { sklep.procentBudynki = s.procentBudynki; },
        });
        const host = document.createElement('div');
        host.innerHTML = window.__renderEmpirePracaSplitSection();
        document.body.appendChild(host);
        await new Promise((res) => queueMicrotask(res));
        const inp = host.querySelector('input[data-praca-empire-split]');
        inp.value = '40';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        return { po: sklep.procentBudynki };
      });
      await p2.close();
      check('(F/M4) po wycieciu zapisu warstwy (a) w panelu imperium asercja (C) "drag zapisuje 60" PADA',
        r.po !== 60, r);
    }
  } finally {
    await browser.close();
  }

  // =====================================================================================
  // CZESC II — DOWOD LICZBOWY warstwy (c)
  // =====================================================================================
  console.log('\n-- (E) Dowod liczbowy warstwy (c): pula 5 000, pracaAutoPercent 10% vs 50% --');
  const picker = await buildPickerBundle(null, 'czysty');
  const w10 = policzUlepszenia(picker, 10);
  const w50 = policzUlepszenia(picker, 50);
  console.log(`[liczby] pula=${w10.pula} · pracaAutoPercent=10% -> ${w10.liczba} ulepszen (${w10.koszt} P)`);
  console.log(`[liczby] pula=${w50.pula} · pracaAutoPercent=50% -> ${w50.liczba} ulepszen (${w50.koszt} P)`);
  check('(E) 10% i 50% warstwy (c) daja ROZNA liczbe ulepszen w turze przy tej samej puli 5 000',
    w10.liczba !== w50.liczba, { p10: w10.liczba, p50: w50.liczba });
  check('(E) wyzszy % warstwy (c) = WIECEJ ulepszen (kierunek zgodny z sensem pola)',
    w50.liczba > w10.liczba, { p10: w10.liczba, p50: w50.liczba });
  check('(E) wydatek miesci sie w zadeklarowanym budzecie warstwy (c) (10% z 5 000 = 500 P)',
    w10.koszt <= 500, w10);
  check('(E) wydatek miesci sie w zadeklarowanym budzecie warstwy (c) (50% z 5 000 = 2 500 P)',
    w50.koszt <= 2500, w50);
  // Kontrola pozytywna: TEN SAM % po obu stronach daje TE SAMA liczbe (roznica nie jest szumem).
  const w50b = policzUlepszenia(picker, 50);
  check('(E) kontrola: to samo 50% dwa razy daje TE SAMA liczbe (roznica wyzej to skutek %, nie szumu)',
    w50.liczba === w50b.liczba, { a: w50.liczba, b: w50b.liczba });

  // M5: mutacja zrodla budzetu — pulap przestaje zalezec od `pracaAutoPercent`.
  const autoSrc = fs.readFileSync(AUTO_TS, 'utf8');
  // Mutacja celowana w SAM mechanizm warstwy (c): pulap miasta przestaje zalezec od procentu.
  // (`effectiveCityCap` jest min(cityBudgetCap, imperiumBudgetCap) — odpiecie samego
  // `imperiumBudgetCap` nie wystarcza, bo drugi czlon dalej niesie ten procent.)
  const m5 = autoSrc
    .replace(': (imperiumPercentClamped / 100) * globalPracaPulaAtEntry,', ': globalPracaPulaAtEntry,')
    .replace('const cityBudgetCap = (cityPercent / 100) * globalPracaPulaAtEntry;',
      'const cityBudgetCap = globalPracaPulaAtEntry;');
  if (m5 === autoSrc) { check('(F/M5) mutacja przygotowana', false, 'kotwica M5 nie trafila'); }
  else {
    const mutPicker = await buildPickerBundle(m5, 'm5');
    const mm10 = policzUlepszenia(mutPicker, 10);
    const mm50 = policzUlepszenia(mutPicker, 50);
    check('(F/M5) po odpieciu pulapu od pracaAutoPercent asercja (E) "10% != 50%" PADA',
      mm10.liczba === mm50.liczba, { p10: mm10.liczba, p50: mm50.liczba });
  }

  console.log(`\n[praca-panel-budowy-warstwa-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
