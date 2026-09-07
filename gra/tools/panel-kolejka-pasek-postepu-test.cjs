'use strict';
/**
 * panel-kolejka-pasek-postepu-test.cjs
 *
 * TEMAT: P-PANEL-KOLEJKA-PRODUKCJI-PASEK-POSTEPU-Q1.
 *
 * ZGŁOSZENIE WŁAŚCICIELA (werbatim, z dwoma zrzutami):
 *   „Przydałyby się oprócz procentów jakieś paski postępu w tym miejscu, czyli dąb starszy
 *    byłby w takim podłużnym batonie, na przykład dąb starszyzny, i wskazywałby procent
 *    zajętości lub realizacji – taki pasek postępu." + „Coś takiego jak tutaj."
 *   („dąb starszyzny" = przejęzyczenie dyktowania, chodzi o budynek Dom Starszyzny.)
 *
 * CO PILNUJE TEN TEST — sekcja „Kolejka produkcji" w panelu imperium (zakładka MIASTO):
 *   (A) wiersz miasta z pozycją na froncie ma pasek, którego REALNA szerokość wypełnienia
 *       odpowiada procentowi ukończenia — mierzone `getBoundingClientRect()` OBU elementów
 *       (tor i wypełnienie), nigdy odczytem atrybutu `style`. To osobna klasa dowodu:
 *       `width:63%` w atrybucie NIE dowodzi, że pasek zajmuje 63% toru (precedens pigułek
 *       kart encji w tym repo: pomalowane pudełko ≠ realny obszar).
 *   (B) procent LICZBOWY nadal jest w komórce — właściciel prosił o pasek „oprócz procentów",
 *       nie zamiast nich; asercja przeciw zamianie zamiast dodania.
 *   (C) przypadki brzegowe realnie istniejące w danych:
 *         0%   → tor widoczny, wypełnienie o szerokości 0 (miasto nie znika z tabeli);
 *         100% → wypełnienie nie przelewa się poza tor;
 *         `postep == null` → BRAK paska i BRAK procentu („nie wiadomo" ≠ „0%");
 *         kolejka pusta → brak paska;
 *         kolejka wstrzymana → pasek jest, ale wygaszony (nie sugeruje trwającego postępu).
 *   (D) FORMUŁA: pasek jest BEZWZGLĘDNY (`postep / koszt`, ukończenie 0-100%), a NIE
 *       względny jak sąsiedni pasek „Produkcji nauki" (`n / maxN`, udział wobec
 *       najsilniejszego miasta). Fixture jest tak dobrany, że obie formuły dają RÓŻNE
 *       wyniki dla tych samych miast — test porównuje zmierzoną szerokość z oczekiwaniem
 *       bezwzględnym i jednocześnie wymaga, żeby NIE zgadzała się z formułą względną.
 *   (E) stopka sekcji mówi wprost, co pasek znaczy, ORAZ nadal niesie zastrzeżenie o froncie
 *       kolejki i zbankowanym postępie (naprawa N5 po FAIL Evaluatora — asercja przeciw
 *       cofnięciu cudzej pracy).
 *   (F) tor kolejki i tor „Produkcji nauki" mają tę samą wysokość i promień — `getComputedStyle`
 *       na obu, nie ogląd. Spójność wizualna była wprost wskazana przez właściciela.
 *   (G) LAYOUT przy 12 MIASTACH (tyle widać na zrzucie właściciela) i realnej szerokości
 *       panelu 404px: żadna komórka nie przepełnia swojej kolumny, tabela nie rozpycha panelu.
 *       Tabela, która wygląda dobrze przy trzech miastach, potrafi się rozjechać przy dwunastu.
 *   (H) artefakt PRODUKCYJNY `vite build` niesie tę samą zmianę (wersja, którą dostaje gracz).
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA, NIE jsdom / grep (R-PROC-AUTOBOT.md §9 poz. 6a):
 * cały temat jest o szerokości i wysokości realnie wyrenderowanych pudełek wewnątrz komórki
 * grida `.civ-emp-mini-r`. jsdom nie ma layoutu i zwróciłby zera zarówno przed, jak i po
 * zmianie — czyli przepuściłby pasek, który w Chromium ma szerokość 0 albo wylewa się poza tor.
 *
 * MUTACJA (M) — dowód nietautologiczności: ten sam plik buduje DRUGI bundel, w którym formuła
 * paska jest podmieniona na `pct = 100` dla WSZYSTKICH pozycji (podmiana w `onLoad`, BEZ
 * dotykania pliku w repo) i wymaga, żeby asercje (A)/(C)/(D) zapaliły się na CZERWONO.
 * Gdyby przechodziły także tam, nie mierzyłyby niczego.
 *
 * C-001 — ZERO DEV SERVERA. Dwa niezależne źródła dowodu, oba to PRODUKTY BUDOWANIA: bundel
 * esbuild mierzony w Chromium oraz artefakt `vite build` z binarki `node_modules/vite/bin/vite.js`
 * do katalogu POZA drzewem repo. Nigdy `npm run build` (przepuszcza export-data i nadpisuje JSON-y).
 *
 * Usage (z gra/): node tools/panel-kolejka-pasek-postepu-test.cjs
 *   --shots <katalog>   zrzuty do <katalog>/kolejka-pasek-{po,przed-mutacja,nauka}.png
 *   --dist <index.html> użyj gotowego artefaktu vite zamiast budować go w teście
 *   --skip-vite         pomiń sekcję (H)
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
// SPRZATANIE PO PRZERWANYM PRZEBIEGU — BEZ dotykania dyspozycji sygnalow.
// Wczesniejsza wersja rejestrowala tu handlery SIGINT/SIGTERM/SIGHUP. To bylo GORSZE niz
// wyciek katalogu. Rejestracja handlera zdejmuje domyslna akcje sygnalu, a sygnal
// dostarczony w trakcie synchronicznego `execSync` (`vite build` — czyli wiekszosc czasu
// zycia tej bramki) NIE odpala handlera JS w ogole i zostaje POLKNIETY. Zmierzone na
// minimalnej reprodukcji i na tej bramce: bez handlera SIGTERM daje `exit=143` natychmiast,
// z handlerem proces zyje dalej i konczy sie `exit=0`. Bramka tracila zabijalnosc, a
// przerwany przebieg raportowal SUKCES — dokladnie ten falszywy ZIELONY, ktory ten temat
// ma likwidowac. Dlatego handlerow sygnalow tu nie ma i byc nie moze.
// Zamiast tego przy STARCIE kasujemy wlasne osierocone katalogi z poprzednich przebiegow,
// ktorych proces juz nie zyje. Dziala takze po SIGKILL, nieprzechwytywalnym z definicji.
(() => {
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  // Sygnatura nazw nadawana przez ten temat: `<baza>-<pid>-<6 znakow>` (+ ewent. rozszerzenie).
  const STALE = /-(\d+)-[a-z0-9]{6}(?:\.[A-Za-z0-9]+)?$/;
  const alive = (pid) => {
    try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
  };
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      const m = STALE.exec(ent);
      if (!m) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;   // zrzuty sa DOWODEM (§9 pkt 6)
      const pid = Number(m[1]);
      // Cudzy (albo wlasny) ZYWY przebieg zostaje nietkniety — kasujemy wylacznie sieroty.
      if (!Number.isInteger(pid) || pid === process.pid || alive(pid)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
})();

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[panel-kolejka-pasek-postepu-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.kolejka-pasek-entry.ts');
const BUNDLE_PO = path.resolve(__dirname, '.kolejka-pasek-bundle.js');
const BUNDLE_MUT = path.resolve(__dirname, '.kolejka-pasek-bundle-mut.js');
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
/** Asercja odwrotna — używana WYŁĄCZNIE na bundlu zmutowanym (sekcja M). */
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

/** `import.meta.glob` i `*.svg?raw` nie istnieją w gołym esbuildzie — inline'ujemy PRAWDZIWE
 * pliki (ten sam wzorzec co empire-trade-route-split-real-render-test.cjs). */
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
 * Kotwica mutacji: FORMUŁA paska kolejki. Mutacja podmienia ją na `pct = 100` dla wszystkich
 * pozycji — dokładnie ten wariant samooszukania, przed którym ostrzega dispatch („bramka ma
 * czerwienieć"). Jeśli kotwica przestanie trafiać, test rzuca wyjątkiem zamiast po cichu
 * zaliczyć mutację jako przechodzącą.
 */
const PCT_RE = /const pct = front\.postep != null\s*\n\s*\? Math\.max\(0, Math\.min\(100, Math\.round\(\(front\.postep \/ Math\.max\(1, front\.koszt\)\) \* 100\)\)\)\s*\n\s*: null;/;
const PCT_MUT = 'const pct = 100;';

/**
 * `renderMiastoSection` i `ensureStyles` — pierwsza jest eksportowana, druga wewnętrzna;
 * dokładamy brakujący eksport przez `onLoad`, BEZ dotykania pliku w repo (kod produkcyjny
 * leci do bundla 1:1). `mutate=true` dodatkowo podmienia formułę paska (sekcja M).
 */
function exposePanelPlugin(mutate) {
  return {
    name: 'expose-empire-panel',
    setup(build) {
      build.onLoad({ filter: /empireDetailPanel\.ts$/ }, (args) => {
        if (path.resolve(args.path) !== PANEL_TS) return null;
        let src = fs.readFileSync(args.path, 'utf8');
        if (mutate) {
          if (!PCT_RE.test(src)) {
            throw new Error('mutacja (M): nie znaleziono formuły paska kolejki — kotwica PCT_RE nieaktualna');
          }
          src = src.replace(PCT_RE, PCT_MUT);
        }
        return {
          contents: src + '\nexport { ensureStyles as __ensureEmpireStyles };\n',
          loader: 'ts', resolveDir: path.dirname(args.path),
        };
      });
    },
  };
}

async function buildBundle(outfile, mutate) {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [viteCompatPlugin, exposePanelPlugin(mutate)], logLevel: 'silent',
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[panel-kolejka-pasek-postepu-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/**
 * FIXTURE — DWANAŚCIE miast, tyle ile na zrzucie właściciela (Sparta z „Dom Starszyzny (63%)"
 * oraz Yan i Zhao na realnym zerze pochodzą wprost z tego zrzutu). Pola `nauka` są dobrane tak,
 * żeby formuła WZGLĘDNA (`nauka / maxNauka`, tak liczy sąsiedni pasek „Produkcji nauki") dawała
 * dla każdego miasta INNĄ liczbę niż formuła BEZWZGLĘDNA (`postep / koszt`) — dzięki temu
 * asercja (D) faktycznie rozróżnia obie formuły, zamiast przechodzić przy obu.
 */
const CITIES = [
  { name: 'Sparta',    nazwa: 'Dom Starszyzny',      postep: 63,   koszt: 100, nauka: 20, pct: 63,   wstrz: false },
  { name: 'Ateny',     nazwa: 'Koszary',             postep: 45,   koszt: 60,  nauka: 4,  pct: 75,   wstrz: false },
  { name: 'Yan',       nazwa: 'Spichlerz',           postep: 0,    koszt: 80,  nauka: 18, pct: 0,    wstrz: false },
  { name: 'Zhao',      nazwa: 'Mury miejskie',       postep: 0,    koszt: 120, nauka: 16, pct: 0,    wstrz: false },
  { name: 'Qin',       nazwa: 'Świątynia',           postep: 90,   koszt: 90,  nauka: 3,  pct: 100,  wstrz: false },
  { name: 'Wei',       nazwa: 'Targowisko',          postep: null, koszt: 70,  nauka: 12, pct: null, wstrz: false },
  { name: 'Chu',       nazwa: null,                  postep: null, koszt: 0,   nauka: 9,  pct: null, wstrz: false },
  { name: 'Han',       nazwa: 'Biblioteka',          postep: 33,   koszt: 100, nauka: 15, pct: 33,   wstrz: true },
  { name: 'Lu',        nazwa: 'Warsztat',            postep: 7,    koszt: 100, nauka: 14, pct: 7,    wstrz: false },
  { name: 'Song',      nazwa: 'Port',                postep: 99,   koszt: 100, nauka: 2,  pct: 99,   wstrz: false },
  { name: 'Qi',        nazwa: 'Akwedukt',            postep: 150,  koszt: 100, nauka: 11, pct: 100,  wstrz: false },
  { name: 'Yue',       nazwa: 'Dom Starszyzny Rady', postep: 12,   koszt: 48,  nauka: 6,  pct: 25,   wstrz: false },
];

/** Kolejka: front + tyle wypełniaczy, ile trzeba, żeby kolumna „W KOLEJCE" nie była zawsze 0. */
function queueFor(c, i) {
  if (c.nazwa === null) return [];
  const front = { nazwa: c.nazwa, koszt: c.koszt };
  if (c.postep !== null) front.postep = c.postep;
  const behind = [];
  for (let k = 0; k < (i % 3); k++) behind.push({ nazwa: 'Zapasowa ' + (k + 1), koszt: 50 });
  return [front].concat(behind);
}

const CITY_POBOR = CITIES.map((c, i) => ({
  cityId: 'c-' + i, name: c.name, ludki: 3 + (i % 4),
  ludnoscAbsLabel: String(300 + i * 40), ludnoscAbsolutna: 300 + i * 40,
  rekruci: 0, rekruciMax: 0, regenPerTurn: 0,
  poziomRacji: 1, racjaGrowthPct: 0, prawoPct: 0, prawoAdminBuildingCount: 0,
  zdrowieBuildingCount: 0,
}));

const CITY_ECON = CITIES.map((c, i) => ({
  pieniadz: 3 + i, pieniadzBrutto: 4 + i, handelZeSzlakow: 0, utrzymanieBudynkow: 1,
  pracaPula: 2, pracaBudynki: 3, nauka: c.nauka, buildingGroups: [],
  queue: queueFor(c, i), queueWstrzymana: c.wstrz,
  defense: { structBonusPct: 0, hasWalls: false, garnizonCount: 0 },
}));

/** Renderuje zakładkę MIASTO na realnej szerokości panelu (404px) i mierzy paski. */
async function renderAndMeasure(browser, bundleFile, shotPrefix) {
  const page = await browser.newPage({ viewport: { width: 520, height: 2400 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });

  // Reset 1:1 z `gra/index.html`; `.civ-emp-panel` odpięty od `position:fixed`, żeby zrzut
  // obejmował całą sekcję, ale zachował szerokość 404px i typografię panelu.
  await page.setContent('<!DOCTYPE html><html><head><style>'
    + '*{margin:0;padding:0;box-sizing:border-box;}'
    + 'body{background:#0b0f16;color:#eee;padding:12px;}'
    + '#stage.civ-emp-panel{position:static;transform:none;width:404px;height:auto;'
    + 'box-shadow:none;border-left:none;border:1px solid #2b3543;border-radius:8px;padding:10px;}'
    + '</style></head><body><div id="stage" class="civ-emp-panel"></div></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(bundleFile, 'utf8') });

  const measured = await page.evaluate((fx) => {
    window.__ensureEmpireStyles();
    const stage = document.getElementById('stage');
    stage.innerHTML = window.__renderMiastoSection(fx.ce, fx.cp, { nauka: 120 }, { routes: [] }, []);

    // Tabelę „Kolejka produkcji" szukamy po nagłówku, nie po indeksie — żeby test nie pękał
    // przy dołożeniu kolejnej tabeli obok.
    const minis = Array.from(stage.querySelectorAll('.civ-emp-mini'));
    const tbl = minis.find((m) => {
      const hdr = m.querySelector('.civ-emp-mini-h');
      return hdr && hdr.textContent.includes('BUDUJE TERAZ') && hdr.textContent.includes('W KOLEJCE');
    }) || null;
    if (!tbl) return { missing: true, minis: minis.length };

    // Kotwice do zrzutów wycinkowych: pełny zrzut zakładki ma ~3700px wysokości i nie nadaje
    // się do OBEJRZENIA sekcji — a dispatch wymaga zrzutu obejrzanego, nie tylko zapisanego.
    tbl.id = 'shot-kolejka';
    const naukaBarForShot = stage.querySelector('.civ-emp-nauka-bar');
    if (naukaBarForShot && naukaBarForShot.parentElement && naukaBarForShot.parentElement.parentElement) {
      naukaBarForShot.parentElement.parentElement.id = 'shot-nauka';
    }

    const rows = Array.from(tbl.querySelectorAll('.civ-emp-mini-r'));
    const readRow = (row) => {
      const cells = Array.from(row.children);
      const cell = cells[1]; // kolumna „BUDUJE TERAZ"
      const bar = cell ? cell.querySelector('.civ-emp-q-bar') : null;
      const fillEl = bar ? bar.querySelector('.civ-emp-q-bar-fill') : null;
      // POMIAR Z REALNEGO UKŁADU, nie z atrybutu `style`: szerokość wypełnienia w procentach
      // szerokości TORU liczona z dwóch prostokątów zwróconych przez przeglądarkę.
      const barRect = bar ? bar.getBoundingClientRect() : null;
      const fillRect = fillEl ? fillEl.getBoundingClientRect() : null;
      const cs = bar ? getComputedStyle(bar) : null;
      const csFill = fillEl ? getComputedStyle(fillEl) : null;
      const txt = (cell ? cell.textContent : '').replace(/\s+/g, ' ').trim();
      const m = txt.match(/\((\d+)%\)/);
      return {
        city: (cells[0].textContent || '').trim(),
        cellText: txt,
        pctText: m ? Number(m[1]) : null,
        hasBar: bar !== null,
        barW: barRect ? barRect.width : 0,
        fillW: fillRect ? fillRect.width : 0,
        measuredPct: barRect && barRect.width > 0 && fillRect ? (fillRect.width / barRect.width) * 100 : null,
        barH: cs ? cs.height : '',
        barR: cs ? cs.borderTopLeftRadius : '',
        barBg: cs ? cs.backgroundColor : '',
        fillGradient: csFill ? csFill.backgroundImage : '',
        overflowPx: cell ? cell.scrollWidth - cell.clientWidth : 0,
        rowH: Math.round(row.getBoundingClientRect().height),
      };
    };
    const byCity = {};
    for (const r of rows) { const d = readRow(r); byCity[d.city] = d; }

    // Pasek sekcji „Produkcja nauki" — wzorzec wskazany przez właściciela, tor musi być ten sam.
    const naukaBar = stage.querySelector('.civ-emp-nauka-bar');
    const naukaFill = stage.querySelector('.civ-emp-nauka-bar-fill');
    const nb = naukaBar ? getComputedStyle(naukaBar) : null;
    const naukaRect = naukaBar ? naukaBar.getBoundingClientRect() : null;
    const naukaFillRect = naukaFill ? naukaFill.getBoundingClientRect() : null;

    const footEls = Array.from(stage.querySelectorAll('.civ-emp-foot'));
    const queueFootEl = footEls.find((f) => /W kolejce/.test(f.textContent)) || null;
    const queueFoot = queueFootEl ? queueFootEl.textContent : '';

    // Wycinek do zrzutu: od nagłówka tabeli do DOŁU stopki — czyli dokładnie to, co gracz
    // czyta jako jedną całość (tabela + wyjaśnienie znaczenia paska).
    const tblRect = tbl.getBoundingClientRect();
    const footRect = queueFootEl ? queueFootEl.getBoundingClientRect() : tblRect;
    const shotClip = {
      x: Math.floor(tblRect.x) - 2, y: Math.floor(tblRect.y) - 2,
      width: Math.ceil(tblRect.width) + 4,
      height: Math.ceil(footRect.bottom - tblRect.top) + 4,
    };

    return {
      rowCount: rows.length,
      byCity,
      queueFoot,
      shotClip,
      naukaBar: naukaBar
        ? {
          h: nb.height, r: nb.borderTopLeftRadius, bg: nb.backgroundColor,
          w: naukaRect.width,
          measuredPct: naukaRect.width > 0 && naukaFillRect ? (naukaFillRect.width / naukaRect.width) * 100 : null,
        }
        : null,
      stageScrollWidth: stage.scrollWidth,
      stageClientWidth: stage.clientWidth,
    };
  }, { ce: CITY_ECON, cp: CITY_POBOR });

  if (shotPrefix) {
    fs.mkdirSync(path.dirname(path.resolve(shotPrefix)), { recursive: true });
    await page.locator('#stage').screenshot({ path: shotPrefix + '-cala-zakladka.png' });
    if (measured.shotClip) {
      await page.screenshot({ path: shotPrefix + '.png', clip: measured.shotClip });
    }
    if (await page.locator('#shot-nauka').count()) {
      await page.locator('#shot-nauka').screenshot({ path: shotPrefix + '-wzorzec-nauka.png' });
    }
  }
  await page.close();
  return { ...measured, pageErrors };
}

async function main() {
  const panelSrc = fs.readFileSync(PANEL_TS, 'utf8');

  // --- (0) Statyczne kotwice w źródle — czytelny sygnał, gdy poprawka zniknie -------------
  check('(0) wspólny helper toru empireBarHtml() istnieje', panelSrc.includes('function empireBarHtml('));
  check('(0) sekcja „Kolejka produkcji" używa wspólnego toru (klasa civ-emp-q-bar)',
    panelSrc.includes("'civ-emp-q-bar'"));
  check('(0) sekcja „Produkcja nauki" używa TEGO SAMEGO helpera (jedno źródło wyglądu)',
    panelSrc.includes("'civ-emp-nauka-bar'"));
  check('(0) formuła paska kolejki jest BEZWZGLĘDNA (postep / koszt), nie udziałem względem miast',
    PCT_RE.test(panelSrc) && !/front\.postep \/ .*max[A-Z]/.test(panelSrc));
  check('(0) formuła paska nauki pozostała WZGLĘDNA (n / maxN) — wzorzec nietknięty co do znaczenia',
    panelSrc.includes('const pct = maxN > 0 ? Math.max(0, Math.round((n / maxN) * 100)) : 0;'));

  fs.writeFileSync(ENTRY, [
    "import { renderMiastoSection, __ensureEmpireStyles } from '../src/ui/empireDetailPanel.ts';",
    'window.__renderMiastoSection = renderMiastoSection;',
    'window.__ensureEmpireStyles = __ensureEmpireStyles;',
    '',
  ].join('\n'), 'utf8');

  await buildBundle(BUNDLE_PO, false);
  await buildBundle(BUNDLE_MUT, true);

  const browser = await launchBrowser();
  let po;
  let mut;
  try {
    po = await renderAndMeasure(browser, BUNDLE_PO, SHOTS ? path.join(SHOTS, 'kolejka-pasek-po-12-miast') : null);
    mut = await renderAndMeasure(browser, BUNDLE_MUT, SHOTS ? path.join(SHOTS, 'kolejka-pasek-mutacja-pct100') : null);
  } finally {
    await browser.close();
  }

  check('(setup) tabela „Kolejka produkcji" wyrenderowana', !po.missing, po);
  check('(setup) render bez błędów strony/konsoli', po.pageErrors.length === 0, po.pageErrors);
  check('(setup) DWANAŚCIE wierszy miast (tyle co na zrzucie właściciela)', po.rowCount === 12, po.rowCount);

  const R = (name) => (po.byCity || {})[name] || {};

  // --- (A) szerokość paska = procent ukończenia, mierzona z REALNEGO UKŁADU ---------------
  for (const c of CITIES.filter((x) => x.pct !== null)) {
    const r = R(c.name);
    check(`(A) ${c.name}: pasek istnieje w komórce „BUDUJE TERAZ"`, r.hasBar === true, r);
    check(`(A) ${c.name}: tor ma niezerową szerokość w realnym układzie`, r.barW > 20, r.barW);
    check(`(A) ${c.name}: zmierzona szerokość wypełnienia = ${c.pct}% toru (tolerancja ≤1 p.p., getBoundingClientRect)`,
      r.measuredPct !== null && Math.abs(r.measuredPct - c.pct) <= 1,
      { measured: r.measuredPct, expected: c.pct, barW: r.barW, fillW: r.fillW });
  }

  // --- (B) procent LICZBOWY nadal obecny — pasek „oprócz procentów", nie zamiast ----------
  for (const c of CITIES.filter((x) => x.pct !== null)) {
    check(`(B) ${c.name}: procent liczbowy „(${c.pct}%)" nadal w komórce (dodanie, nie zamiana)`,
      R(c.name).pctText === c.pct, { txt: R(c.name).cellText, expected: c.pct });
  }
  check('(B) nazwa pozycji nadal widoczna obok paska (Sparta · Dom Starszyzny)',
    /Dom Starszyzny/.test(R('Sparta').cellText || ''), R('Sparta').cellText);

  // --- (C) przypadki brzegowe ------------------------------------------------------------
  check('(C1) 0% (Yan): tor JEST widoczny, wypełnienie ma szerokość 0 — miasto nie znika',
    R('Yan').hasBar === true && R('Yan').barW > 20 && R('Yan').fillW < 0.5,
    { barW: R('Yan').barW, fillW: R('Yan').fillW });
  check('(C1) 0% (Zhao): to samo dla drugiego realnego zera ze zrzutu właściciela',
    R('Zhao').hasBar === true && R('Zhao').barW > 20 && R('Zhao').fillW < 0.5,
    { barW: R('Zhao').barW, fillW: R('Zhao').fillW });
  check('(C2) 100% (Qin): wypełnienie NIE przelewa się poza tor',
    R('Qin').fillW <= R('Qin').barW + 0.5 && Math.abs((R('Qin').measuredPct ?? 0) - 100) <= 1,
    { fillW: R('Qin').fillW, barW: R('Qin').barW, pct: R('Qin').measuredPct });
  check('(C2) postęp > kosztu (Qi, 150/100): przycięte do 100%, bez przelania poza tor',
    R('Qi').fillW <= R('Qi').barW + 0.5 && R('Qi').pctText === 100,
    { fillW: R('Qi').fillW, barW: R('Qi').barW, pct: R('Qi').pctText });
  check('(C3) postep == null (Wei): BRAK paska — „nie wiadomo" to inny stan niż „0%"',
    R('Wei').hasBar === false, R('Wei'));
  check('(C3) postep == null (Wei): BRAK procentu liczbowego (stan bez zmian wobec bazy)',
    R('Wei').pctText === null && /Targowisko/.test(R('Wei').cellText || ''), R('Wei').cellText);
  check('(C4) kolejka pusta (Chu): BRAK paska, komórka nadal mówi „pusta"',
    R('Chu').hasBar === false && /pusta/.test(R('Chu').cellText || ''), R('Chu'));
  check('(C5) kolejka wstrzymana (Han): pasek JEST (postęp istnieje) i ma poprawną szerokość',
    R('Han').hasBar === true && Math.abs((R('Han').measuredPct ?? -1) - 33) <= 1, R('Han'));
  check('(C5) kolejka wstrzymana (Han): wypełnienie WYGASZONE — inny gradient niż pasek aktywny',
    R('Han').fillGradient !== '' && R('Han').fillGradient !== R('Sparta').fillGradient,
    { han: R('Han').fillGradient, sparta: R('Sparta').fillGradient });
  check('(C5) kolejka wstrzymana (Han): dopisek „· wstrzymana" nadal w komórce',
    /wstrzymana/.test(R('Han').cellText || ''), R('Han').cellText);

  // --- (D) FORMUŁA BEZWZGLĘDNA, nie udział względem innych miast --------------------------
  // Gdyby ktoś skopiował formułę paska nauki (`wartość / max(wartości)`), Sparta dostałaby
  // 63/150 ≈ 42% zamiast 63%, a Ateny 45/150 = 30% zamiast 75%. Ta asercja to wyklucza.
  const maxPostep = Math.max(...CITIES.map((c) => c.postep ?? 0));
  for (const c of [CITIES[0], CITIES[1], CITIES[8]]) {
    const wzgl = Math.round((c.postep / maxPostep) * 100);
    const r = R(c.name);
    check(`(D) ${c.name}: pasek to UKOŃCZENIE ${c.pct}% (postep/koszt), a NIE udział ${wzgl}% wobec najsilniejszego`,
      Math.abs((r.measuredPct ?? -1) - c.pct) <= 1 && Math.abs((r.measuredPct ?? -1) - wzgl) > 1,
      { measured: r.measuredPct, bezwzgledny: c.pct, wzgledny: wzgl });
  }

  // --- (E) stopka: znaczenie paska DOPISANE, zastrzeżenie N5 NIENARUSZONE -----------------
  check('(E1) stopka mówi wprost, że pasek to UKOŃCZENIE pozycji (0-100%)',
    /Pasek = UKOŃCZENIE pozycji na froncie/.test(po.queueFoot) && /0-100%/.test(po.queueFoot),
    po.queueFoot.slice(0, 200));
  // Mierzone na `textContent`, więc znaczniki (`<b>nie</b>`) są już rozwinięte do samego tekstu.
  check('(E2) stopka jawnie ODCINA się od znaczenia paska nauki (nie udział względem innych miast)',
    /nie udział względem innych miast/.test(po.queueFoot)
    && /Produkcja nauki/.test(po.queueFoot), po.queueFoot.slice(0, 260));
  check('(E3) stopka wyjaśnia wygaszony pasek (kolejka wstrzymana)',
    /Wygaszony pasek = kolejka wstrzymana/.test(po.queueFoot), po.queueFoot.slice(0, 320));
  check('(E4) zastrzeżenie N5 o froncie kolejki NADAL obecne (nie zjedzone przez nowy tekst)',
    /WYŁĄCZNIE pozycji na froncie kolejki/.test(po.queueFoot)
    && /ewentualny wcześniejszy postęp ten widok nie pokazuje/.test(po.queueFoot),
    po.queueFoot.slice(-220));

  // --- (F) spójność toru z paskiem „Produkcji nauki" — getComputedStyle, nie ogląd --------
  check('(F) pasek „Produkcji nauki" istnieje i jest mierzalny', po.naukaBar !== null, po.naukaBar);
  check('(F) ta sama WYSOKOŚĆ toru co pasek nauki', R('Sparta').barH === (po.naukaBar || {}).h,
    { kolejka: R('Sparta').barH, nauka: (po.naukaBar || {}).h });
  check('(F) ten sam PROMIEŃ toru co pasek nauki', R('Sparta').barR === (po.naukaBar || {}).r,
    { kolejka: R('Sparta').barR, nauka: (po.naukaBar || {}).r });
  check('(F) ten sam KOLOR toru co pasek nauki', R('Sparta').barBg === (po.naukaBar || {}).bg,
    { kolejka: R('Sparta').barBg, nauka: (po.naukaBar || {}).bg });
  // Kontrola regresu wzorca: pasek nauki NADAL liczy udział względem najsilniejszego miasta.
  // Sparta ma nauka=20 = maxN → 100% toru; gdyby helper zmienił znaczenie, ta asercja pęknie.
  check('(F) pasek nauki NIETKNIĘTY co do znaczenia: Sparta (nauka 20 = max) wypełnia 100% toru',
    Math.abs(((po.naukaBar || {}).measuredPct ?? -1) - 100) <= 1, (po.naukaBar || {}).measuredPct);

  // --- (G) LAYOUT przy 12 miastach na 404px ------------------------------------------------
  const worst = Math.max(...Object.values(po.byCity).map((r) => r.overflowPx ?? 0));
  check('(G) żadna komórka „BUDUJE TERAZ" nie przepełnia swojej kolumny przy 12 miastach', worst <= 1,
    { worst, perCity: Object.fromEntries(Object.entries(po.byCity).map(([k, v]) => [k, v.overflowPx])) });
  check('(G) tabela nie rozpycha panelu w poziomie (404px bez poziomego przewijania)',
    po.stageScrollWidth <= po.stageClientWidth + 1,
    { scroll: po.stageScrollWidth, client: po.stageClientWidth });
  check('(G) wiersz z paskiem jest realnie WYŻSZY niż wiersz bez paska — pasek zajmuje miejsce, nie jest zerowy',
    R('Sparta').rowH > R('Chu').rowH, { zPaskiem: R('Sparta').rowH, bezPaska: R('Chu').rowH });

  // --- (M) MUTACJA: pct = 100 dla wszystkich → asercje MUSZĄ być czerwone ------------------
  console.log('\n-- (M) mutacja: formuła paska podmieniona na `pct = 100` dla wszystkich --');
  const MR = (name) => (mut.byCity || {})[name] || {};
  check('(M) mutacja wyrenderowała się (kotwica PCT_RE nadal trafia w kod)', !mut.missing, mut);
  checkRed('(M) asercja (A) czerwona: Sparta NIE ma już 63% szerokości wypełnienia',
    Math.abs((MR('Sparta').measuredPct ?? -1) - 63) <= 1, MR('Sparta').measuredPct);
  checkRed('(M) asercja (C1) czerwona: Yan NIE ma już pustego toru przy 0%',
    (MR('Yan').fillW ?? 99) < 0.5, { fillW: MR('Yan').fillW });
  checkRed('(M) asercja (C3) czerwona: Wei (postep == null) dostaje pasek, którego nie powinien mieć',
    MR('Wei').hasBar === false, MR('Wei').hasBar);
  checkRed('(M) asercja (B) czerwona: procent liczbowy Ateny przestaje wynosić 75',
    MR('Ateny').pctText === 75, MR('Ateny').pctText);

  // --- (H) artefakt PRODUKCYJNY vite build (C-001: dowód na produkcie budowania) -----------
  if (!SKIP_VITE) {
    let dist = DIST_ARG;
    if (dist === null) {
      // Poza drzewem repo (os.tmpdir), binarka wprost z node_modules — kanon C-001; NIGDY
      // `npm run build` (ten przepuszcza export-data.py i nadpisuje JSON-y danych gry).
      const outDir = path.join(os.tmpdir(), `civ-kolejka-pasek-dist-${TMPDIR_RUN_ID}`);
      execFileSync(process.execPath,
        [path.resolve(GRA, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--outDir', outDir, '--emptyOutDir'],
        { cwd: GRA, stdio: 'ignore' });
      dist = path.join(outDir, 'index.html');
    }
    const built = fs.readFileSync(dist, 'utf8');
    check('(H1) artefakt vite build niesie klasę paska kolejki (civ-emp-q-bar)', built.includes('civ-emp-q-bar'));
    check('(H2) artefakt vite build niesie nową stopkę o znaczeniu paska',
      built.includes('Pasek = UKOŃCZENIE pozycji na froncie'));
    check('(H3) artefakt vite build NADAL niesie zastrzeżenie N5 o froncie kolejki',
      built.includes('WYŁĄCZNIE pozycji na froncie kolejki'));
  } else {
    console.log('SKIP: (H) sekcja artefaktu vite build pominięta (--skip-vite)');
  }

  try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE_PO); fs.unlinkSync(BUNDLE_MUT); } catch (_) {}

  console.log('\npanel-kolejka-pasek-postepu-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error('[panel-kolejka-pasek-postepu-test] unexpected error:', (e && e.stack) || e);
  process.exit(1);
});
