'use strict';
/**
 * empire-trade-route-split-real-render-test.cjs
 *
 * TEMAT: R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T6 (ostatni temat serii przebudowy szlaków).
 *
 * ZLECENIE WŁAŚCICIELA (werbatim, decyzja R-HANDEL-SZLAKI-PRZEBUDOWA-Q1):
 *   „Bardzo ważne jest, aby z każdej drogi w widoku handlu od razu pojawiały się kwoty,
 *   które z tego handlu nam przychodzą do przychodu."
 * Po T3/T4 dochód trasy ma DWA składniki o różnym pochodzeniu, więc „kwota z każdej drogi"
 * to od teraz rozkład, nie jedna liczba:
 *   (1) dochód DYSTANSOWY — leci do skarbca wprost, od zawarcia umowy, BEZ żadnego budynku
 *       (to jest zmiana z T3: budynek przestał warunkować istnienie trasy),
 *   (2) premia 5% za budynek handlowy — 0,05 × dochód dystansowy TEJ trasy, naliczana tylko
 *       gdy `TradeRoute.budynekOdblokowany === true` (T4, ECHO Q3 Wariant C), i wchodząca do
 *       Podatku miasta, nie wprost do skarbca.
 *
 * CO PILNUJE TEN TEST (oba przypadki, oba miejsca w panelu imperium):
 *   (A) zakładka HANDEL, tabela „Trasy": trasa Z budynkiem pokazuje w komórce DOCHÓD/TURĘ
 *       DWIE linie — dochód dystansowy ORAZ kwotę składnika 5%.
 *   (B) ta sama tabela: trasa BEZ budynku pokazuje dochód dystansowy ORAZ jawne, słowne
 *       „5% — brak: Targowisko" — NIE gołe „0" ani generyczne „brak budynku". To jest sedno
 *       zgłoszenia (R-HANDEL-BRAK-BUDYNKU-NAZWA-Q1): gracz ma zrozumieć DLACZEGO nie dostaje
 *       5% i JAKI KONKRETNIE budynek wystarczy dobudować (Targowisko — jedyny z trzech
 *       kwalifikujących budynków budowalny w każdym mieście bez wyjątku).
 *   (C) zakładka MIASTO, tabela „Handel — szlaki per miasto": ten sam rozkład zagregowany
 *       per miasto (kwota 5% + liczba tras czekających na budynek).
 *   (D) LAYOUT na realnej szerokości panelu (404px): żadna komórka rozkładu nie przepełnia
 *       swojej kolumny w poziomie, tabela nie rozpycha panelu, a wiersz z rozkładem jest
 *       realnie WYŻSZY od nagłówka — czyli druga linia faktycznie się wyrenderowała, a nie
 *       została schowana przez `overflow`/zerową wysokość.
 *   (E) artefakt PRODUKCYJNY `vite build`: wersja, którą dostaje gracz, niesie klasę
 *       `.civ-emp-route-split` i frazę „brak: Targowisko".
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA, NIE GREP ŹRÓDŁA / jsdom (R-PROC-AUTOBOT.md §9 poz. 6a):
 *   - „czy rozkład WIDAĆ" to pytanie o kaskadę CSS i layout, nie o obecność stringa: nowa
 *     klasa `.civ-emp-route-split` jest `display:block` wewnątrz komórki grida — dopiero
 *     `getBoundingClientRect()`/`getComputedStyle()` w Chromium mówi, czy druga linia ma
 *     niezerową wysokość, czy nie przepełnia kolumny i czy kolor stanu faktycznie się
 *     zastosował. jsdom nie ma layoutu i zwróciłby zera zarówno przed, jak i po zmianie.
 *   - kolumna DOCHÓD/TURĘ została w T6 poszerzona (grid 0.95fr → 1.25fr) właśnie po to, żeby
 *     dłuższy tekst „5% — brak: Targowisko" nie łamał się w środku wyrazu przy 404px. Tego nie da
 *     się sprawdzić inaczej niż mierząc realny render.
 *
 * MUTACJA (F) — dowód nietautologiczności: ten sam plik buduje DRUGI bundel z ODWRÓCONĄ
 * poprawką (podmiana w `onLoad`, BEZ dotykania plików w repo: komórka DOCHÓD wraca do
 * jednej linii sprzed T6) i wymaga, żeby asercje (A)/(B) zapaliły się na tym bundlu na
 * CZERWONO. Bez tego test nie mierzyłby niczego — precedens
 * P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1. Ten sam przebieg dostarcza zrzut PRZED.
 *
 * C-001 — ZERO DEV SERVERA. Dwa niezależne źródła dowodu, oba to PRODUKTY BUDOWANIA:
 * bundel esbuild (render mierzony w Chromium) oraz artefakt `vite build` z binarki
 * `node_modules/vite/bin/vite.js` do katalogu POZA drzewem repo (sekcja E).
 *
 * Usage (z gra/): node tools/empire-trade-route-split-real-render-test.cjs
 *   --shots <katalog>   zrzuty PRZED/PO do <katalog>/trasy-rozklad-{przed,po}.png
 *   --dist <index.html> użyj gotowego artefaktu vite zamiast budować go w teście
 *   --skip-vite         pomiń sekcję (E)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

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

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[empire-trade-route-split-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.empire-trade-split-entry.ts');
const BUNDLE_PO = path.resolve(__dirname, '.empire-trade-split-bundle.js');
const BUNDLE_PRZED = path.resolve(__dirname, '.empire-trade-split-bundle-przed.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PANEL_TS = path.resolve(GRA, 'src', 'ui', 'empireDetailPanel.ts');
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const SHOTS = argOf('--shots');
const DIST_ARG = argOf('--dist');
const SKIP_VITE = process.argv.includes('--skip-vite');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}
/** Asercja odwrotna — używana WYŁĄCZNIE na bundlu zmutowanym (sekcja F). */
function checkRed(name, cond, detail) {
  if (!cond) { pass++; console.log('PASS: ' + name); }
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

/** `import.meta.glob`, `*.svg?raw` nie istnieją w gołym esbuildzie — inline'ujemy PRAWDZIWE
 * pliki (ten sam wzorzec co empire-autofeed-btn-label-real-render-test.cjs). */
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

/** Kotwica mutacji: cała nowa komórka DOCHÓD/TURĘ w tabeli „Trasy" (dwie linie). */
const NEW_CELL_RE = /`<span style="color:#78c95a"\$\{tipAttr\('Dochód dystansowy tej trasy[\s\S]*?\+ routeBonusSplitHtml\(r\.premiaBudynku, r\.budynekOdblokowany\),/;
/** Stan sprzed T6: jedna linia, sam dochód dystansowy — dokładnie jak w `main` przed tą zmianą. */
const LEGACY_CELL = '`<span style="color:#78c95a">+${r.income}</span>`,';

/**
 * `renderHandelSection` i `ensureStyles` są wewnętrzne — dokładamy eksporty przez `onLoad`,
 * BEZ dotykania pliku w repo (kod produkcyjny leci do bundla 1:1). `legacy=true` dodatkowo
 * przywraca stan sprzed T6 (mutacja F + materiał na zrzut PRZED).
 */
function exposePanelPlugin(legacy) {
  return {
    name: 'expose-empire-panel',
    setup(build) {
      build.onLoad({ filter: /empireDetailPanel\.ts$/ }, (args) => {
        if (path.resolve(args.path) !== PANEL_TS) return null;
        let src = fs.readFileSync(args.path, 'utf8');
        if (legacy) {
          if (!NEW_CELL_RE.test(src)) {
            throw new Error('mutacja (F): nie znaleziono nowej komórki DOCHÓD/TURĘ — kotwica NEW_CELL_RE nieaktualna');
          }
          src = src.replace(NEW_CELL_RE, LEGACY_CELL)
            // stara szerokość kolumn tabeli „Trasy" sprzed T6
            .replace("const grid = '0.8fr 0.9fr 0.9fr 1.25fr';", "const grid = '0.95fr 0.9fr 1.1fr 0.95fr';")
            // stary wiersz SUMA tabeli „Trasy" — bez zsumowanego składnika 5%
            .replace(
              /const sumaPremii = t\.routes[\s\S]*?\$\{signedPl\(t\.totalIncome\)\}\$\{sumaSplit\}<\/div><\/div>`;/,
              'h += `<div class="civ-emp-mini-r civ-emp-mini-summary" style="grid-template-columns:${grid}">`\n'
              + '      + `<div>SUMA</div><div></div><div></div><div>${signedPl(t.totalIncome)}</div></div>`;',
            )
            // stara, jednoskładnikowa komórka DOCHÓD w tabeli „Handel — szlaki per miasto"
            .replace(
              /treasuryBalanceSignedTxt\(Math\.round\(income\)\)\s*\n\s*\+ \(cityRoutes\.length > 0 \? cityBonusSplitHtml\(premia, brakBudynku\) : ''\),/,
              'treasuryBalanceSignedTxt(Math.round(income)),',
            );
        }
        return {
          contents: src
            + '\nexport { renderHandelSection as __renderHandelSection,'
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
    target: 'es2020', outfile, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [viteCompatPlugin, exposePanelPlugin(legacy)], logLevel: 'silent',
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[empire-trade-route-split-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/**
 * Fixture SPÓJNY Z SILNIKIEM, nie wymyślony: parametry dochodu po T1 (podłoga 5, szczyt 40,
 * ląd max 12 heks., morze max 20 heks.) + bonus morski ×2 (T2). Liczby poniżej są policzone
 * TĄ SAMĄ arytmetyką co `tradeRouteTotalDistanceIncome`, żeby zrzut pokazywał realistyczne
 * wartości, a nie okrągłe atrapy:
 *   Roma↔Ur   — ląd, 12 heks. → dochód dystansowy 40; budynek JEST → premia 0,05×40 = 2
 *   Roma↔Tyr  — morze, 20 heks. → 40 ×2 = 80; budynku BRAK → premia 0 („brak: Targowisko")
 *   Ostia↔Kisz— ląd, 3 heks. → 5 + 3×2,9167 ≈ 13 (floor); budynku BRAK → premia 0
 */
const ROUTES = [
  { id: 'r-ur', cityId: 'c-roma', cityName: 'Roma', partnerCityName: 'Ur', partnerOwnerLabel: 'Sumerowie',
    medium: 'lad', dystans: 12, income: 40, budynekOdblokowany: true, premiaBudynku: 2 },
  { id: 'r-tyr', cityId: 'c-roma', cityName: 'Roma', partnerCityName: 'Tyr', partnerOwnerLabel: 'Fenicjanie',
    medium: 'morze', dystans: 20, income: 80, budynekOdblokowany: false, premiaBudynku: 0 },
  { id: 'r-kisz', cityId: 'c-ostia', cityName: 'Ostia', partnerCityName: 'Kisz', partnerOwnerLabel: 'Babilończycy',
    medium: 'lad', dystans: 3, income: 13, budynekOdblokowany: false, premiaBudynku: 0 },
];
const TRADE_SNAP = {
  totalIncome: ROUTES.reduce((s, r) => s + r.income, 0),
  routes: ROUTES,
  activeDeals: [
    { partnerLabel: 'Sumerowie', partnerOwnerId: 1, turnsLeft: null, trustPerTurn: 1, hasActiveRoute: true },
    { partnerLabel: 'Fenicjanie', partnerOwnerId: 2, turnsLeft: 8, trustPerTurn: 1, hasActiveRoute: true },
  ],
  daninaLabel: 'Podatek',
  wonderBonusLadPct: 0,
  wonderBonusMorzePct: 0,
  resourceGrants: [],
};

/** Renderuje zakładkę Handel na realnej szerokości panelu (404px) i mierzy komórki DOCHÓD. */
async function renderAndMeasure(browser, bundleFile, shotPath) {
  const page = await browser.newPage({ viewport: { width: 520, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });

  // Reset 1:1 z `gra/index.html`; `.civ-emp-panel` odpięty od `position:fixed`, żeby zrzut
  // obejmował samą sekcję, ale zachował szerokość 404px i typografię panelu.
  await page.setContent('<!DOCTYPE html><html><head><style>'
    + '*{margin:0;padding:0;box-sizing:border-box;}'
    + 'body{background:#0b0f16;color:#eee;padding:12px;}'
    + '#stage.civ-emp-panel{position:static;transform:none;width:404px;height:auto;'
    + 'box-shadow:none;border-left:none;border:1px solid #2b3543;border-radius:8px;padding:10px;}'
    + '</style></head><body><div id="stage" class="civ-emp-panel"></div></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(bundleFile, 'utf8') });

  const measured = await page.evaluate((snap) => {
    window.__ensureEmpireStyles();
    const stage = document.getElementById('stage');
    stage.innerHTML = window.__renderHandelSection(snap);

    // Ostatni blok `.civ-emp-mini` w sekcji Handel to tabela „Trasy" (przed nią stoi tabela
    // „Umowy handlowe"); szukamy jej po nagłówku, nie po indeksie, żeby test nie pękał przy
    // dołożeniu kolejnej tabeli obok.
    const minis = Array.from(stage.querySelectorAll('.civ-emp-mini'));
    const trasy = minis.find(m => (m.querySelector('.civ-emp-mini-h') || {}).textContent
      && m.querySelector('.civ-emp-mini-h').textContent.includes('DOCHÓD/TURĘ')) || null;
    if (!trasy) return { missing: true, minis: minis.length };

    const header = trasy.querySelector('.civ-emp-mini-h');
    const rows = Array.from(trasy.querySelectorAll('.civ-emp-mini-r'));
    const readRow = (row) => {
      if (!row) return null;
      const cells = Array.from(row.children);
      const incomeCell = cells[cells.length - 1];
      const split = incomeCell ? incomeCell.querySelector('.civ-emp-route-split') : null;
      const cellRect = incomeCell ? incomeCell.getBoundingClientRect() : null;
      const splitRect = split ? split.getBoundingClientRect() : null;
      return {
        text: (row.textContent || '').replace(/\s+/g, ' ').trim(),
        incomeText: incomeCell ? (incomeCell.textContent || '').replace(/\s+/g, ' ').trim() : '',
        hasSplit: split !== null,
        splitText: split ? (split.textContent || '').replace(/\s+/g, ' ').trim() : '',
        splitClass: split ? split.className : '',
        splitTitle: split ? (split.getAttribute('title') || '') : '',
        splitColor: split ? getComputedStyle(split).color : '',
        splitDisplay: split ? getComputedStyle(split).display : '',
        splitHeight: splitRect ? Math.round(splitRect.height) : 0,
        cellWidth: cellRect ? Math.round(cellRect.width) : 0,
        cellScrollWidth: incomeCell ? incomeCell.scrollWidth : 0,
        cellClientWidth: incomeCell ? incomeCell.clientWidth : 0,
        // najgorsza z POZOSTAŁYCH kolumn — po zwężeniu ich w T6 muszą nadal mieścić
        // swoją treść (PARTNER „(Fenicjanie)", MEDIUM „Morze · 20 heks.")
        otherOverflowPx: Math.max(0, ...cells.slice(0, -1)
          .map(c => c.scrollWidth - c.clientWidth)),
        perCellOverflow: cells.map(c => c.scrollWidth - c.clientWidth),
        perCellWidth: cells.map(c => Math.round(c.getBoundingClientRect().width)),
        rowHeight: Math.round(row.getBoundingClientRect().height),
      };
    };

    return {
      rowCount: rows.length,
      headerHeight: header ? Math.round(header.getBoundingClientRect().height) : 0,
      // kolejność wierszy = kolejność w `routes` (main.ts sortuje przed wstawieniem do snapa)
      zBudynkiem: readRow(rows[0]),
      bezBudynku: readRow(rows[1]),
      bezBudynku2: readRow(rows[2]),
      suma: readRow(rows.find(r => r.classList.contains('civ-emp-mini-summary'))),
      stageScrollWidth: stage.scrollWidth,
      stageClientWidth: stage.clientWidth,
      // podpis pod tabelą — musi opisywać mechanikę PO T1/T2/T4, nie sprzed niej
      footText: (stage.querySelector('.civ-emp-foot') || {}).textContent || '',
    };
  }, TRADE_SNAP);

  if (shotPath) {
    fs.mkdirSync(path.dirname(path.resolve(shotPath)), { recursive: true });
    await page.locator('#stage').screenshot({ path: shotPath });
  }

  // --- (C) DRUGIE miejsce tego samego rozkładu: zakładka MIASTO, tabela „Handel — szlaki
  // per miasto". Renderowana w tym samym żywym dokumencie i mierzona tak samo, bo to też
  // zmiana wizualna (§9 poz. 6a nie zna wyjątku „tabela obok"). Fixture: Roma = przypadek
  // MIESZANY (jedna trasa z budynkiem, jedna bez), Ostia = wszystkie bez budynku.
  const miasto = await page.evaluate((snapRoutes) => {
    const cp = [
      { cityId: 'c-roma', name: 'Roma', ludki: 5, ludnoscAbsLabel: '500', ludnoscAbsolutna: 500, rekruci: 0, rekruciMax: 0, regenPerTurn: 0 },
      { cityId: 'c-ostia', name: 'Ostia', ludki: 2, ludnoscAbsLabel: '200', ludnoscAbsolutna: 200, rekruci: 0, rekruciMax: 0, regenPerTurn: 0 },
    ];
    const ce = [0, 1].map(() => ({
      pieniadz: 5, pracaPula: 1, pracaBudynki: 1, nauka: 2, buildingGroups: [],
      queue: [], queueWstrzymana: false,
      defense: { structBonusPct: 0, hasWalls: false, garnizonCount: 0 },
    }));
    const stage = document.getElementById('stage');
    stage.innerHTML = window.__renderMiastoSection(ce, cp, { nauka: 0 }, { routes: snapRoutes }, []);
    const minis = Array.from(stage.querySelectorAll('.civ-emp-mini'));
    const handel = minis.find(m => {
      const hdr = m.querySelector('.civ-emp-mini-h');
      return hdr && hdr.textContent.includes('SZLAKI') && hdr.textContent.includes('DOCHÓD');
    }) || null;
    if (!handel) return { missing: true };
    const rows = Array.from(handel.querySelectorAll('.civ-emp-mini-r'));
    const read = (row) => {
      if (!row) return null;
      const cells = Array.from(row.children);
      const last = cells[cells.length - 1];
      const split = last ? last.querySelector('.civ-emp-route-split') : null;
      return {
        text: (row.textContent || '').replace(/\s+/g, ' ').trim(),
        hasSplit: split !== null,
        splitText: split ? (split.textContent || '').replace(/\s+/g, ' ').trim() : '',
        splitClass: split ? split.className : '',
        splitHeight: split ? Math.round(split.getBoundingClientRect().height) : 0,
        cellOverflow: last ? last.scrollWidth - last.clientWidth : 0,
      };
    };
    return {
      rowCount: rows.length,
      roma: read(rows[0]),
      ostia: read(rows[1]),
      suma: read(rows.find(r => r.classList.contains('civ-emp-mini-summary'))),
      stageScrollWidth: stage.scrollWidth,
      stageClientWidth: stage.clientWidth,
    };
  }, ROUTES);

  if (shotPath) {
    await page.locator('#stage').screenshot({ path: shotPath.replace(/\.png$/, '-miasto.png') });
  }
  await page.close();
  return { ...measured, miasto, pageErrors };
}

async function main() {
  const panelSrc = fs.readFileSync(PANEL_TS, 'utf8');

  // --- (0) Statyczne kotwice w źródle — czytelny sygnał, gdy poprawka zniknie ---------
  check('(0) helper routeBonusSplitHtml() istnieje (rozkład per trasa)',
    panelSrc.includes('function routeBonusSplitHtml('));
  check('(0) helper cityBonusSplitHtml() istnieje (rozkład zagregowany per miasto)',
    panelSrc.includes('function cityBonusSplitHtml('));
  check('(0) CSS .civ-emp-route-split ma oba warianty stanu (.on / .off)',
    /\.civ-emp-route-split\.on\{color:#78c95a;\}/.test(panelSrc)
    && /\.civ-emp-route-split\.off\{color:#d9a441;\}/.test(panelSrc));
  check('(0) podpis tabeli tras NIE opisuje już wzoru sprzed T1 („max(podłoga, bazowy − dystans×…")',
    !panelSrc.includes('max(podłoga, bazowy − dystans×współczynnik)'));
  check('(0) pusta lista tras NIE żąda już budynku handlowego do POWSTANIA trasy (stan po T3)',
    !panelSrc.includes('Brak aktywnych tras handlowych. Wymagany: budynek handlowy'));

  fs.writeFileSync(ENTRY, [
    "import { __renderHandelSection, __ensureEmpireStyles, renderMiastoSection } from '../src/ui/empireDetailPanel.ts';",
    'window.__renderHandelSection = __renderHandelSection;',
    'window.__renderMiastoSection = renderMiastoSection;',
    'window.__ensureEmpireStyles = __ensureEmpireStyles;',
    '',
  ].join('\n'), 'utf8');

  await buildBundle(BUNDLE_PO, false);
  await buildBundle(BUNDLE_PRZED, true);

  const browser = await launchBrowser();
  let po;
  let przed;
  try {
    po = await renderAndMeasure(browser, BUNDLE_PO, SHOTS ? path.join(SHOTS, 'trasy-rozklad-po.png') : null);
    przed = await renderAndMeasure(browser, BUNDLE_PRZED, SHOTS ? path.join(SHOTS, 'trasy-rozklad-przed.png') : null);
  } finally {
    await browser.close();
  }

  check('(setup) tabela „Trasy" wyrenderowana', !po.missing, po);
  check('(setup) render bez błędów strony/konsoli', po.pageErrors.length === 0, po.pageErrors);
  check('(setup) 3 wiersze tras + wiersz SUMA', po.rowCount === 4, po.rowCount);

  // --- (A) trasa Z BUDYNKIEM: dochód dystansowy ORAZ kwota 5% ------------------------
  const zb = po.zBudynkiem || {};
  check('(A) trasa Z budynkiem: wiersz to Roma↔Ur', (zb.text || '').includes('Ur'), zb.text);
  check('(A) trasa Z budynkiem: widać dochód dystansowy „+40"', (zb.incomeText || '').includes('+40'), zb.incomeText);
  check('(A) trasa Z budynkiem: komórka DOCHÓD ma drugą linię rozkładu', zb.hasSplit === true, zb);
  check('(A) trasa Z budynkiem: druga linia niesie KWOTĘ składnika 5% („+2")',
    (zb.splitText || '').includes('+2') && (zb.splitText || '').includes('5%'), zb.splitText);
  check('(A) trasa Z budynkiem: wariant „on" (stan naliczony)',
    (zb.splitClass || '').includes('on') && !(zb.splitClass || '').includes('off'), zb.splitClass);
  check('(A) trasa Z budynkiem: linia rozkładu jest FIZYCZNIE widoczna (display:block, wysokość > 0)',
    zb.splitDisplay === 'block' && zb.splitHeight > 0, { d: zb.splitDisplay, h: zb.splitHeight });
  check('(A) trasa Z budynkiem: kolor stanu naliczonego zastosowany przez kaskadę (zielony #78c95a)',
    zb.splitColor === 'rgb(120, 201, 90)', zb.splitColor);

  // --- (B) trasa BEZ BUDYNKU: powód, nie gołe zero ------------------------------------
  const bb = po.bezBudynku || {};
  check('(B) trasa BEZ budynku: wiersz to Roma↔Tyr (morze)', (bb.text || '').includes('Tyr'), bb.text);
  check('(B) trasa BEZ budynku: dochód dystansowy NADAL widoczny („+80") — od T3 leci bez budynku',
    (bb.incomeText || '').includes('+80'), bb.incomeText);
  check('(B) trasa BEZ budynku: druga linia mówi WPROST, jaki budynek dobudować („brak: Targowisko")',
    (bb.splitText || '').includes('brak: Targowisko'), bb.splitText);
  check('(B) trasa BEZ budynku: druga linia nazywa składnik po imieniu („5%")',
    (bb.splitText || '').includes('5%'), bb.splitText);
  check('(B) trasa BEZ budynku: NIE pokazuje gołej kwoty „+0" bez wyjaśnienia',
    !/\+0(\D|$)/.test(bb.splitText || ''), bb.splitText);
  check('(B) trasa BEZ budynku: wariant „off" (stan oczekiwania)',
    (bb.splitClass || '').includes('off'), bb.splitClass);
  check('(B) trasa BEZ budynku: kolor ostrzegawczy zastosowany przez kaskadę (#d9a441)',
    bb.splitColor === 'rgb(217, 164, 65)', bb.splitColor);
  check('(B) trasa BEZ budynku: tooltip tłumaczy, CO odblokuje premię (Targowisko/Port)',
    /Targowisko/.test(bb.splitTitle || '') && /Port/.test(bb.splitTitle || ''), bb.splitTitle);
  check('(B) trasa BEZ budynku: tooltip mówi, że dochód dystansowy leci JUŻ TERAZ',
    /już teraz/i.test(bb.splitTitle || ''), bb.splitTitle);
  check('(B) druga trasa bez budynku (Ostia↔Kisz) zachowuje się tak samo',
    (po.bezBudynku2 || {}).hasSplit === true
    && ((po.bezBudynku2 || {}).splitText || '').includes('brak: Targowisko'), po.bezBudynku2);

  // --- (C) wiersz SUMA: składniki zsumowane osobno, każdy w swojej kolumnie ------------
  const su = po.suma || {};
  check('(C) SUMA: dochód dystansowy zsumowany („+133" = 40+80+13)',
    (su.incomeText || '').includes('+133'), su.incomeText);
  check('(C) SUMA: składnik 5% zsumowany osobno („+2")',
    (su.splitText || '').includes('+2') && (su.splitText || '').includes('5%'), su.splitText);
  check('(C) SUMA: liczba tras czekających na budynek pokazana wprost („2 bez budynku")',
    (su.splitText || '').includes('2 bez budynku'), su.splitText);

  // --- (C2) podpis pod tabelą opisuje mechanikę PO T1/T2/T4, nie sprzed niej -----------
  check('(C2) podpis wymienia OBA składniki i mówi, że nie sumuje ich w jedną liczbę',
    /Dystans/.test(po.footText) && /5% za budynek/.test(po.footText)
    && /nie sumujemy/.test(po.footText), po.footText.slice(0, 240));
  check('(C2) podpis mówi wprost, że dochód dystansowy leci bez żadnego budynku (stan po T3)',
    /bez żadnego budynku/.test(po.footText), po.footText.slice(0, 240));

  // --- (C3) zakładka MIASTO: ten sam rozkład, zagregowany per miasto -------------------
  const mi = po.miasto || {};
  check('(C3) tabela „Handel — szlaki per miasto" wyrenderowana', !mi.missing, mi);
  check('(C3) Roma (1 trasa z budynkiem + 1 bez): kwota 5% ORAZ liczba tras czekających',
    (mi.roma || {}).hasSplit === true
    && ((mi.roma || {}).splitText || '').includes('+2')
    && ((mi.roma || {}).splitText || '').includes('1 bez budynku'), mi.roma);
  check('(C3) Roma: wariant „off" — miasto ma trasę czekającą na budynek',
    ((mi.roma || {}).splitClass || '').includes('off'), (mi.roma || {}).splitClass);
  // Miasto, w którym ŻADNA trasa nie ma budynku, dostaje dokładnie to samo brzmienie co wiersz
  // pojedynczej trasy w zakładce Handel — nigdy „0 · 5%" (milczące zero bez powodu).
  check('(C3) Ostia (wszystkie trasy bez budynku): dokładnie „5% — brak: Targowisko", nie „0 · 5%"',
    (mi.ostia || {}).splitText === '5% — brak: Targowisko', mi.ostia);
  check('(C3) Ostia: dochód dystansowy nadal widoczny obok („+13")',
    ((mi.ostia || {}).text || '').includes('+13'), (mi.ostia || {}).text);
  check('(C3) linia rozkładu w zakładce Miasto jest FIZYCZNIE widoczna (wysokość > 0)',
    (mi.roma || {}).splitHeight > 0 && (mi.ostia || {}).splitHeight > 0,
    { roma: (mi.roma || {}).splitHeight, ostia: (mi.ostia || {}).splitHeight });
  check('(C3) wiersz CAŁA CYWILIZACJA sumuje ten sam składnik („+2", „2 bez budynku")',
    ((mi.suma || {}).splitText || '').includes('+2')
    && ((mi.suma || {}).splitText || '').includes('2 bez budynku'), mi.suma);
  for (const [label, r] of [['Roma', mi.roma || {}], ['Ostia', mi.ostia || {}], ['SUMA', mi.suma || {}]]) {
    check(`(C3) ${label}: komórka DOCHÓD nie przepełnia kolumny po zwężeniu SZLAKI (404px)`,
      (r.cellOverflow ?? 0) <= 1, r.cellOverflow);
  }
  check('(C3) zakładka Miasto nie rozpycha panelu w poziomie',
    mi.stageScrollWidth <= mi.stageClientWidth + 1, { scroll: mi.stageScrollWidth, client: mi.stageClientWidth });

  // --- (D) LAYOUT na 404px -------------------------------------------------------------
  for (const [label, r] of [['Z budynkiem', zb], ['BEZ budynku', bb], ['SUMA', su]]) {
    check(`(D) ${label}: komórka DOCHÓD nie przepełnia swojej kolumny w poziomie`,
      r.cellScrollWidth <= r.cellClientWidth + 1, { scroll: r.cellScrollWidth, client: r.cellClientWidth });
  }
  // Kolumny MIASTO/PARTNER/MEDIUM zwęziły się w T6 na rzecz DOCHODU — muszą mieścić treść
  // NIE GORZEJ niż przed zmianą (pomiar na tym samym fixture, bundel „przed" z sekcji F).
  for (const [label, r, ref] of [['Z budynkiem', zb, przed.zBudynkiem || {}], ['BEZ budynku', bb, przed.bezBudynku || {}]]) {
    check(`(D) ${label}: zwężone kolumny (MIASTO/PARTNER/MEDIUM) nie przepełniają się bardziej niż przed T6`,
      r.otherOverflowPx <= (ref.otherOverflowPx ?? 0),
      { po: r.otherOverflowPx, przed: ref.otherOverflowPx,
        poCells: r.perCellOverflow, poW: r.perCellWidth,
        przedCells: ref.perCellOverflow, przedW: ref.perCellWidth });
  }
  check('(D) tabela nie rozpycha panelu w poziomie (404px bez poziomego przewijania)',
    po.stageScrollWidth <= po.stageClientWidth + 1, { scroll: po.stageScrollWidth, client: po.stageClientWidth });
  check('(D) wiersz z rozkładem jest realnie WYŻSZY niż nagłówek — druga linia faktycznie zajmuje miejsce',
    zb.rowHeight > po.headerHeight, { row: zb.rowHeight, header: po.headerHeight });
  check('(D) wiersz „brak: Targowisko" mieści tekst bez dodatkowego, trzeciego złamania (wysokość ≤ 64px)',
    bb.rowHeight <= 64, bb.rowHeight);

  // --- (F) MUTACJA: na kodzie sprzed T6 asercje (A)/(B) MUSZĄ być czerwone -------------
  console.log('\n-- (F) mutacja: bundel z komórką DOCHÓD sprzed T6 (jedna linia) --');
  const mzb = przed.zBudynkiem || {};
  const mbb = przed.bezBudynku || {};
  check('(F) mutacja wyrenderowała się (kotwica NEW_CELL_RE nadal trafia w kod)', !przed.missing, przed);
  check('(F) kontrola: stary render NADAL pokazuje dochód dystansowy „+40"',
    (mzb.incomeText || '').includes('+40'), mzb.incomeText);
  checkRed('(F) asercja (A) czerwona na starym kodzie: BRAK drugiej linii dla trasy z budynkiem',
    mzb.hasSplit === true, mzb);
  checkRed('(F) asercja (B) czerwona na starym kodzie: BRAK frazy „brak: Targowisko" dla trasy bez budynku',
    (mbb.splitText || '').includes('brak: Targowisko'), mbb.splitText);
  checkRed('(F) asercja (C) czerwona na starym kodzie: SUMA bez składnika 5%',
    ((przed.suma || {}).splitText || '').includes('5%'), (przed.suma || {}).splitText);

  // --- (E) artefakt PRODUKCYJNY vite build (C-001: dowód na produkcie budowania) -------
  if (!SKIP_VITE) {
    let dist = DIST_ARG;
    if (dist === null) {
      // Poza drzewem repo (os.tmpdir), binarka wprost z node_modules — kanon C-001; NIGDY
      // `npm run build` (ten przepuszcza export-data.py i nadpisuje JSON-y danych gry).
      const outDir = path.join(os.tmpdir(), `civ-empire-trade-split-dist-${TMPDIR_RUN_ID}`);
      execFileSync(process.execPath,
        [path.resolve(GRA, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--outDir', outDir, '--emptyOutDir'],
        { cwd: GRA, stdio: 'ignore' });
      dist = path.join(outDir, 'index.html');
    }
    const built = fs.readFileSync(dist, 'utf8');
    check('(E1) artefakt vite build niesie klasę rozkładu .civ-emp-route-split', built.includes('civ-emp-route-split'));
    check('(E2) artefakt vite build niesie tekst stanu „brak: Targowisko"', built.includes('brak: Targowisko'));
    check('(E3) artefakt vite build niesie etykietę składnika „5% budynek"', built.includes('5% budynek'));
    check('(E4) artefakt vite build NIE niesie już podpisu sprzed T1',
      !built.includes('max(podłoga, bazowy'));
  } else {
    console.log('SKIP: (E) sekcja artefaktu vite build pominięta (--skip-vite)');
  }

  try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE_PO); fs.unlinkSync(BUNDLE_PRZED); } catch (_) {}

  console.log('\nempire-trade-route-split-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty PRZED/PO: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error('[empire-trade-route-split-real-render-test] unexpected error:', (e && e.stack) || e);
  process.exit(1);
});
