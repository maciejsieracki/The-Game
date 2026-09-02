'use strict';
/**
 * civpedia-cuda-historia-test.cjs
 *
 * TEMAT: P-CIVPEDIA-TESTY-GIT-HEAD-SAMOODNOSZACE-Q1 (treść przeniesiona z
 * niezintegrowanej rundy R-CIVPEDIA-CUDA-Q1, commit referencyjny 4a4369c5) —
 * batch treści, kategoria cuda: sekcja "## Rys historyczny" dopisana na
 * końcu WSZYSTKICH 19 plików `docs/encyklopedia/cuda/*.md`, z treścią
 * wziętą dosłownie z pola `historia` odpowiadającego wpisu w tablicy `cuda`
 * w `gra/data/wonders.json` (dopasowanie po polu `id` z `## Metadane`).
 *
 * WAŻNE — metoda weryfikacji jest CELOWO niezależna od pozycji git HEAD i od
 * zakresu `git diff`: sprawdzamy WYŁĄCZNIE aktualny stan plików na dysku
 * (wzorowane na civpedia-budynki-historia-test.cjs / civpedia-ulepszenia-
 * historia-batch-test.cjs / civpedia-technologie-rys-historyczny-test.cjs).
 * Test ma przechodzić identycznie zarówno PRZED, jak i PO scommitowaniu tej
 * zmiany, na dowolnym HEAD — bo o poprawności decyduje wyłącznie struktura
 * pliku, nie jego relacja do historii gita.
 *
 * Pokrywa kryteria końca z 00-dispatch.md:
 * [1] Dla WSZYSTKICH 19 plików: treść pod "## Rys historyczny" ===
 *     wonders.json.cuda[id].historia (dopasowanie po polu `id` z Metadanych).
 * [2] Istniejące sekcje "## Historia / decyzje" (niezwiązany changelog wiki)
 *     pozostają obecne i występują STRUKTURALNIE PRZED nową sekcją
 *     "## Rys historyczny" (porównanie pozycji indeksów w treści pliku).
 * [3] Dokładnie JEDEN nagłówek "## Rys historyczny" w pliku, na samym końcu.
 * [4] Żywy dowód w headless Chromium (Playwright): 3 z 19 haseł (depth 'm')
 *     pokazują wyrenderowaną sekcję "Rys historyczny" z realną treścią, na
 *     realnym, świeżo zregenerowanym gra/src/data/wikiBundle.json.
 *
 * Usage (z gra/): node tools/civpedia-cuda-historia-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[civpedia-cuda-historia-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ROOT = path.resolve(GRA, '..');
const CUDA_DIR = path.join(ROOT, 'docs', 'encyklopedia', 'cuda');
const WONDERS_JSON = path.join(GRA, 'data', 'wonders.json');
const REAL_BUNDLE_PATH = path.join(GRA, 'src', 'data', 'wikiBundle.json');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'civpedia-historia-infra-brandAssets-stub.ts');
const ENTRY = path.resolve(__dirname, '.civpedia-cuda-historia-entry.ts');
const OUTFILE = path.resolve(__dirname, '.civpedia-cuda-historia-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[civpedia-cuda-historia-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

function extractRysHistoryczny(content) {
  const idx = content.indexOf('## Rys historyczny');
  if (idx === -1) return null;
  const after = content.slice(idx + '## Rys historyczny'.length);
  return after.replace(/^\s*\n+/, '').trimEnd();
}

async function main() {
  // -------------------------------------------------------------------
  // [1]+[2]+[3] Programowa, strukturalna iteracja po WSZYSTKICH 19 plikach.
  // Zero odwołań do gita — wyłącznie aktualny stan pliku na dysku.
  // -------------------------------------------------------------------
  const wonders = JSON.parse(fs.readFileSync(WONDERS_JSON, 'utf8'));
  const byId = new Map(wonders.cuda.map((w) => [w.id, w]));
  check('wonders.json: tablica cuda ma dokładnie 19 wpisów', wonders.cuda.length === 19, wonders.cuda.length);

  const files = fs.readdirSync(CUDA_DIR).filter((f) => f.endsWith('.md')).sort();
  check('dokładnie 19 plików .md w docs/encyklopedia/cuda/', files.length === 19, files.length);

  const results = [];
  for (const f of files) {
    const p = path.join(CUDA_DIR, f);
    const content = fs.readFileSync(p, 'utf8');
    const idMatch = content.match(/\|\s*\*\*id\*\*\s*\|\s*`([^`]+)`/);
    const id = idMatch ? idMatch[1] : null;
    const w = id ? byId.get(id) : undefined;
    const rys = extractRysHistoryczny(content);
    results.push({ file: f, id, hasWonderEntry: !!w, rys, expected: w ? w.historia : null, content });
  }

  for (const r of results) {
    check(`${r.file}: id znaleziony w sekcji Metadane`, !!r.id, r.file);
  }
  for (const r of results) {
    check(`${r.file}: id "${r.id}" ma odpowiadający wpis w wonders.json.cuda`, r.hasWonderEntry, r.id);
  }
  for (const r of results) {
    check(`${r.file}: dokładnie 1 wystąpienie nagłówka "## Rys historyczny"`,
      (r.content.match(/## Rys historyczny/g) || []).length === 1,
      (r.content.match(/## Rys historyczny/g) || []).length);
  }
  for (const r of results) {
    check(`${r.file}: sekcja "## Rys historyczny" obecna i jest OSTATNIĄ sekcją pliku (na samym końcu)`,
      r.rys !== null && r.content.trimEnd().endsWith(r.rys),
      { rysPresent: r.rys !== null });
  }
  for (const r of results) {
    check(`${r.file}: treść "## Rys historyczny" === wonders.json.cuda["${r.id}"].historia (dokładnie)`,
      r.expected !== null && r.rys === r.expected,
      { rysLen: r.rys ? r.rys.length : null, expectedLen: r.expected ? r.expected.length : null });
  }
  // [2] Pliki z istniejącym changelogiem "## Historia / decyzje" muszą go
  // zachować i nowa sekcja musi wystąpić STRUKTURALNIE PO nim.
  let changelogFilesChecked = 0;
  for (const r of results) {
    const idxChangelog = r.content.indexOf('## Historia / decyzje');
    if (idxChangelog === -1) continue;
    changelogFilesChecked++;
    const idxRys = r.content.indexOf('## Rys historyczny');
    check(`${r.file}: istniejący "## Historia / decyzje" jest PRZED nową "## Rys historyczny"`,
      idxChangelog !== -1 && idxRys !== -1 && idxChangelog < idxRys, { idxChangelog, idxRys });
  }
  check('kontrola przytomności: co najmniej 1 plik miał istniejący "## Historia / decyzje" (test [2] nie jest pusty)',
    changelogFilesChecked > 0, changelogFilesChecked);

  console.log(`[info] plików z istniejącym "## Historia / decyzje": ${changelogFilesChecked}/${results.length}`);

  // -------------------------------------------------------------------
  // [4] Żywy dowód w headless Chromium: realny wikiBundle.json, 3 hasła.
  // -------------------------------------------------------------------
  const realBundle = JSON.parse(fs.readFileSync(REAL_BUNDLE_PATH, 'utf8'));
  const cudaEntries = realBundle.encyklopedia.filter((e) => e.folder === 'cuda');
  check('realny wikiBundle.json: 19 wpisów folder=cuda', cudaEntries.length === 19, cudaEntries.length);
  const withHistoria = cudaEntries.filter((e) => e.historia && e.historia.length >= 100);
  check('realny wikiBundle.json: WSZYSTKIE 19 wpisów cuda mają niepuste pole historia (≥100 znaków)',
    withHistoria.length === 19, withHistoria.length);

  const sample = [cudaEntries[0], cudaEntries[Math.floor(cudaEntries.length / 2)], cudaEntries[cudaEntries.length - 1]];

  const stubPlugin = {
    name: 'stub-wiki-bundle',
    setup(build) {
      build.onResolve({ filter: /brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
      build.onResolve({ filter: /tokens\.css\?raw$/ }, () => ({ path: 'civpedia-cuda-empty-css-raw', namespace: 'civpedia-cuda-virtual' }));
      build.onLoad({ filter: /^civpedia-cuda-empty-css-raw$/, namespace: 'civpedia-cuda-virtual' }, () => ({ contents: 'export default "";', loader: 'js' }));
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

  for (const entry of sample) {
    const result = await page.evaluate(({ folder, slug }) => {
      const api = window.__createWikiHubHud({});
      api.openEncyEntry(folder, slug);
      const content = document.querySelector('.wh-content');
      const h3s = Array.from(content.querySelectorAll('h3')).map((h) => h.textContent.trim());
      const bodyText = content.textContent;
      api.destroy();
      return { h3s, bodyText };
    }, { folder: entry.folder, slug: entry.slug });

    check(`[4] żywy DOM: "${entry.title}" (${entry.slug}) — nagłówek "Rys historyczny" obecny (depth m)`,
      result.h3s.includes('Rys historyczny'), result.h3s);
    check(`[4] żywy DOM: "${entry.title}" (${entry.slug}) — treść zawiera realny fragment pola historia`,
      result.bodyText.includes(entry.historia.slice(0, 60)),
      { expectedStart: entry.historia.slice(0, 60) });
  }

  await browser.close();

  check('brak błędów konsoli/pageerror podczas scenariusza przeglądarkowego', consoleErrors.length === 0, consoleErrors);

  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[civpedia-cuda-historia-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }
  process.exit(1);
});
