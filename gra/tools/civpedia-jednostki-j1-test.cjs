'use strict';
/**
 * civpedia-jednostki-j1-test.cjs
 *
 * TEMAT: R-CIVPEDIA-JEDNOSTKI-J1-Q1 — batch treści CivPedii, kategoria
 * jednostki, część 1/2 (25 plików, patrz 00-dispatch.md).
 *
 * Pokrywa kryteria końca dispatchu:
 * [1] Wszystkie 25 plików `docs/encyklopedia/jednostki/*.md` z tej listy mają
 *     na końcu "## Rys historyczny" z treścią DOKŁADNIE zgodną z polem
 *     `Historia` dopasowanej pozycji `gra/data/units.json` (dopasowanie po
 *     `Jednostka` === polu **tytuł** z tabeli `## Metadane` pliku .md) —
 *     programowa iteracja po wszystkich 25, nie próbka.
 * [2] Zero zmian w istniejących sekcjach "## Historia / decyzje" (changelog
 *     wiki, NIEZWIĄZANY z nową sekcją) — sprawdzane STRUKTURALNIE, na
 *     aktualnym stanie pliku na dysku, BEZ odwołania do gita: sekcja
 *     "## Historia / decyzje" (tam gdzie występuje) jest obecna i występuje
 *     w treści pliku PRZED nagłówkiem "## Rys historyczny" (porównanie
 *     pozycji indeksów).
 * [3] Pozostałe pliki folderu `jednostki/` poza tymi 25 (batch J2, w tym
 *     `wojownik-celtycki.md`) mają WŁASNĄ, strukturalnie poprawną zawartość:
 *     dokładnie jeden nagłówek "## Rys historyczny", na samym końcu pliku —
 *     sprawdzane niezależnie od historii gita (patrz [2]/[3] w
 *     civpedia-jednostki-j2-test.cjs dla treści merytorycznej J2).
 * [4] Żywy dowód w headless Chromium (Playwright): 3 z 25 haseł (widok 'm')
 *     pokazują wyrenderowaną sekcję "Rys historyczny" z realną treścią, przez
 *     `createWikiHubHud` na bundlu zregenerowanym z bieżących plików .md
 *     (`bundle-wiki-for-game.cjs`, ten sam mechanizm co
 *     `civpedia-historia-infra-test.cjs`).
 *
 * WAŻNE — metoda weryfikacji [2]/[3] jest CELOWO niezależna od pozycji git
 * HEAD i od zakresu `git diff`: test ma przechodzić identycznie PRZED i PO
 * scommitowaniu tej zmiany, na dowolnym HEAD, na zwykłym świeżym checkout —
 * bo o poprawności decyduje wyłącznie struktura pliku na dysku (wzorowane na
 * civpedia-budynki-historia-test.cjs / civpedia-technologie-rys-historyczny-
 * test.cjs), nie relacja do historii gita.
 *
 * Zero mutacji `docs/encyklopedia/**` — tylko odczyt. `gra/src/data/wikiBundle.json`
 * używany do [4] jest ODCZYTYWANY (już zregenerowany przez Operatora poleceniem
 * `node tools/bundle-wiki-for-game.cjs` — do własnego testu, poza integracją
 * wg dispatchu), nie modyfikowany przez ten test.
 *
 * Usage (z gra/): node tools/civpedia-jednostki-j1-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[civpedia-jednostki-j1-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const GRA = path.resolve(__dirname, '..');
const JEDNOSTKI_DIR = path.resolve(REPO_ROOT, 'docs', 'encyklopedia', 'jednostki');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'civpedia-historia-infra-brandAssets-stub.ts');
const ENTRY = path.resolve(__dirname, '.civpedia-jednostki-j1-entry.ts');
const OUTFILE = path.resolve(__dirname, '.civpedia-jednostki-j1-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Dokładnie 25 plików batcha J1 (kopia listy z 00-dispatch.md, w tej samej
// kolejności alfabetycznej — pozycje 1-25 z `ls jednostki/*.md | sort`).
const J1_FILES = [
  'berserker-germanski.md', 'falanga.md', 'gaesatae.md', 'galera.md',
  'gwardia-krolewska-sumeru.md', 'halabardnik-shang.md', 'hastati.md',
  'hieros-lochos-swiety-zastep.md', 'hu-ben-wei-gwardia-tygrysa.md', 'impi.md',
  'jezdziec-chinski.md', 'katapulta.md', 'konnica.md', 'krolewska-gwardia.md',
  'medzaj-gwardia-faraona.md', 'oszczepnik-estolica.md', 'oszczepnik-zulu-izijula.md',
  'oszczepnik.md', 'procarz-huaracoc.md', 'procarz.md', 'rydwan-celtycki.md',
  'rydwan-egipski.md', 'rydwan-konny.md', 'rydwan-mykenski.md', 'rydwan-shang.md',
];

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[civpedia-jednostki-j1-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
  const byName = {};
  for (const u of units) byName[u.Jednostka] = u;

  // -------------------------------------------------------------------
  // [1] + [2] Iteracja po wszystkich 25 plikach: sekcja "## Rys historyczny"
  // na końcu, treść dokładnie zgodna z units.json, zero zmian w treści
  // sprzed sekcji (w tym "## Historia / decyzje").
  // -------------------------------------------------------------------
  for (const file of J1_FILES) {
    const full = path.join(JEDNOSTKI_DIR, file);
    const content = fs.readFileSync(full, 'utf8');
    const m = content.match(/\*\*tytuł\*\*\s*\|\s*(.+?)\s*\|/);
    const tytul = m ? m[1].trim() : null;
    check(`[1] ${file}: tytuł odczytany z tabeli Metadane`, !!tytul, tytul);
    const unit = tytul ? byName[tytul] : null;
    check(`[1] ${file}: tytuł "${tytul}" dopasowany do units.json (pole Jednostka)`, !!unit, tytul);
    if (!unit) continue;

    const expectedBlock = '\n\n## Rys historyczny\n\n' + unit.Historia + '\n';
    check(`[1] ${file}: plik kończy się dokładnie blokiem "## Rys historyczny" + treść units.json.Historia`,
      content.endsWith(expectedBlock),
      { got_tail: content.slice(-80), expected_tail: expectedBlock.slice(-80) });

    // dokładnie jedno wystąpienie nagłówka (brak duplikatów)
    const occurrences = (content.match(/## Rys historyczny/g) || []).length;
    check(`[1] ${file}: dokładnie 1 wystąpienie nagłówka "## Rys historyczny"`, occurrences === 1, occurrences);

    // [2] Metoda STRUKTURALNA, niezależna od gita: istniejący changelog
    // "## Historia / decyzje" (tam gdzie występuje) jest obecny i występuje
    // w treści pliku PRZED nagłówkiem "## Rys historyczny" (pozycje indeksów).
    const idxChangelog = content.indexOf('## Historia / decyzje');
    const idxRys = content.indexOf('## Rys historyczny');
    check(`[2] ${file}: istniejąca sekcja "## Historia / decyzje" obecna PRZED nową "## Rys historyczny"`,
      idxChangelog !== -1 && idxRys !== -1 && idxChangelog < idxRys,
      { idxChangelog, idxRys });
  }

  // -------------------------------------------------------------------
  // [3] Pozostałe pliki folderu jednostki/ (poza tymi 25, tj. batch J2) mają
  // WŁASNĄ, strukturalnie poprawną zawartość — sprawdzane niezależnie od
  // gita: dokładnie 1 nagłówek "## Rys historyczny", na samym końcu pliku.
  // -------------------------------------------------------------------
  const allFiles = fs.readdirSync(JEDNOSTKI_DIR).filter((f) => f.endsWith('.md')).sort();
  const j1Set = new Set(J1_FILES);
  const otherFiles = allFiles.filter((f) => !j1Set.has(f));
  check('[3] folder jednostki/ zawiera pliki batcha J1 (25) + pozostałe pliki (batch J2)',
    otherFiles.length === allFiles.length - J1_FILES.length, { total: allFiles.length, other: otherFiles.length });
  for (const f of otherFiles) {
    const p = path.join(JEDNOSTKI_DIR, f);
    const content = fs.readFileSync(p, 'utf8');
    const occurrences = (content.match(/## Rys historyczny/g) || []).length;
    const idx = content.indexOf('## Rys historyczny');
    const rysContent = idx === -1 ? null : content.slice(idx + '## Rys historyczny'.length).replace(/^\s*\n+/, '').trimEnd();
    check(`[3] pozostały plik "${f}" (poza batchem J1): dokładnie 1 "## Rys historyczny", na samym końcu pliku (własna, nietknięta zawartość)`,
      occurrences === 1 && idx !== -1 && rysContent !== null && content.trimEnd().endsWith(rysContent),
      { occurrences });
  }

  // -------------------------------------------------------------------
  // [4] Żywy DOM w headless Chromium: 3 z 25 haseł pokazują "Rys historyczny".
  // -------------------------------------------------------------------
  delete require.cache[require.resolve(path.join(GRA, 'tools', 'bundle-wiki-for-game.cjs'))];
  const bundler = require(path.join(GRA, 'tools', 'bundle-wiki-for-game.cjs'));
  const liveEntries = bundler.bundleEncyklopedia(JEDNOSTKI_DIR);

  const sampleSlugs = ['falanga', 'katapulta', 'impi'];
  const sampleEntries = sampleSlugs.map((slug) => liveEntries.find((e) => e.slug === slug));
  check('[4] kontrola przytomności: 3 próbki (falanga, katapulta, impi) znalezione w świeżym bundlu z docs/encyklopedia/jednostki/',
    sampleEntries.every(Boolean), sampleSlugs);
  sampleEntries.forEach((e, i) => {
    if (!e) return;
    check(`[4] próbka "${sampleSlugs[i]}": pole historia w świeżym bundlu niepuste i zgodne z units.json`,
      !!e.historia && byName[e.title] && e.historia === byName[e.title].Historia,
      { slug: sampleSlugs[i], title: e.title });
  });

  const fixtureBundleObj = {
    version: 'fixture-civpedia-jednostki-j1-test',
    generated: '2026-09-02',
    poradnik: [],
    encyklopedia: liveEntries.map((e) => ({ ...e, folder: 'jednostki', category: 'Jednostki i walka' })),
  };
  const FIXTURE_BUNDLE_JSON = path.resolve(__dirname, '.civpedia-jednostki-j1-fixture-bundle.json');
  fs.writeFileSync(FIXTURE_BUNDLE_JSON, JSON.stringify(fixtureBundleObj), 'utf8');

  const stubPlugin = {
    name: 'stub-wiki-bundle',
    setup(build) {
      build.onResolve({ filter: /data\/wikiBundle\.json$/ }, () => ({ path: FIXTURE_BUNDLE_JSON }));
      build.onResolve({ filter: /brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
      build.onResolve({ filter: /tokens\.css\?raw$/ }, () => ({ path: 'civpedia-jednostki-j1-empty-css-raw', namespace: 'civpedia-jednostki-j1-virtual' }));
      build.onLoad({ filter: /^civpedia-jednostki-j1-empty-css-raw$/, namespace: 'civpedia-jednostki-j1-virtual' }, () => ({ contents: 'export default "";', loader: 'js' }));
    },
  };

  fs.writeFileSync(
    ENTRY,
    [
      "import { createWikiHubHud } from '../src/ui/wikiHubHud.ts';",
      'window.__createWikiHubHud = createWikiHubHud;',
      '',
    ].join('\n'),
    'utf8',
  );

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: OUTFILE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [stubPlugin],
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  const bundleJs = fs.readFileSync(OUTFILE, 'utf8');
  await page.setContent('<div id="root"></div>');
  await page.addScriptTag({ content: bundleJs });

  for (const slug of sampleSlugs) {
    const entry = sampleEntries[sampleSlugs.indexOf(slug)];
    if (!entry) continue;
    const result = await page.evaluate(({ folder, slug }) => {
      const api = window.__createWikiHubHud({});
      api.openEncyEntry(folder, slug);
      const content = document.querySelector('.wh-content');
      const h3s = Array.from(content.querySelectorAll('h3')).map((h) => h.textContent.trim());
      const bodyText = content.textContent;
      api.destroy();
      document.getElementById('root').innerHTML = '';
      return { h3s, bodyText };
    }, { folder: 'jednostki', slug });
    check(`[4] żywy render "${slug}" (depth 'm'): DOM zawiera nagłówek "Rys historyczny"`,
      result.h3s.includes('Rys historyczny'), result.h3s);
    check(`[4] żywy render "${slug}" (depth 'm'): treść sekcji zawiera dokładny tekst pola historia z units.json`,
      result.bodyText.includes(entry.historia), { entryHistoriaPreview: entry.historia.slice(0, 60) });
  }

  await browser.close();

  check('brak błędów konsoli/pageerror podczas scenariusza przeglądarkowego', consoleErrors.length === 0, consoleErrors);

  try { fs.unlinkSync(FIXTURE_BUNDLE_JSON); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[civpedia-jednostki-j1-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
