'use strict';
/**
 * civpedia-budynki-historia-test.cjs
 *
 * TEMAT: R-CIVPEDIA-BUDYNKI-Q1 — pierwszy batch treści CivPedii: dla
 * KAŻDEGO pliku docs/encyklopedia/budynki/*.md sekcja
 * "## Rys historyczny" dopisana na końcu pliku, treść DOKŁADNIE zgodna
 * z polem `historia` odpowiadającego wpisu w gra/data/buildings.json.
 *
 * Pokrywa kryteria końca z 00-dispatch.md:
 * [1] Programowe porównanie KAŻDEGO pliku .md z buildings.json —
 *     treść pod "## Rys historyczny" === buildings.json[id].historia
 *     dokładnie (bez skrótów/parafraz).
 * [2] Istniejące sekcje "## Historia / decyzje" (changelog wiki, tam gdzie
 *     występują) pozostają nietknięte — dowód: string wciąż obecny
 *     w pliku, PRZED nową sekcją "## Rys historyczny".
 * [3] Żywy dowód w headless Chromium: 3 hasła z tego katalogu renderują
 *     w CivPedii (depth 'm') sekcję "Rys historyczny" z realną treścią
 *     (z realnego wikiBundle.json, nie fixture).
 *
 * Usage (z gra/): node tools/civpedia-budynki-historia-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[civpedia-budynki-historia-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ROOT = path.resolve(GRA, '..');
const BUDYNKI_DIR = path.join(ROOT, 'docs', 'encyklopedia', 'budynki');
const BUILDINGS_JSON = path.join(GRA, 'data', 'buildings.json');
const REAL_BUNDLE_PATH = path.join(GRA, 'src', 'data', 'wikiBundle.json');
const ENTRY = path.resolve(__dirname, '.civpedia-budynki-historia-entry.ts');
const OUTFILE = path.resolve(__dirname, '.civpedia-budynki-historia-bundle.cjs');
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
    console.log('[civpedia-budynki-historia-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

function extractRysHistoryczny(content) {
  // Sekcja jest ZAWSZE ostatnią sekcją pliku (dopisana na końcu) — bierzemy
  // wszystko po nagłówku "## Rys historyczny" do końca pliku, trimowane.
  const idx = content.indexOf('## Rys historyczny');
  if (idx === -1) return null;
  const after = content.slice(idx + '## Rys historyczny'.length);
  return after.replace(/^\s*\n+/, '').trimEnd();
}

async function main() {
  // -------------------------------------------------------------------
  // [1] + [2] Programowa iteracja po WSZYSTKICH plikach katalogu.
  // -------------------------------------------------------------------
  const buildings = JSON.parse(fs.readFileSync(BUILDINGS_JSON, 'utf8'));
  const byId = new Map(buildings.map((b) => [b.id, b]));

  const files = fs.readdirSync(BUDYNKI_DIR).filter((f) => f.endsWith('.md')).sort();
  // =====================================================================
  // LICZNIKI — NIE ZASZYWAJ ICH Z POWROTEM (R3-A, 2026-09-06,
  // R-BUDYNEK-GARNIZON-NOWY-Q1 runda 3)
  //
  // Do rundy 2 ta bramka miała w TRZECH miejscach zaszytą liczbę `25` — rozmiar
  // pierwszego batcha `R-CIVPEDIA-BUDYNKI-Q1` z lipca 2026. Dopisanie 26. hasła
  // (`docs/encyklopedia/budynki/garnizon.md`) przestawiło bramkę z **136/0 na 138/3**,
  // bez ani jednego realnego defektu treści. To ta sama klasa długu, którą R2-B
  // naprawił w `grupy-budynkow-test.cjs`.
  //
  // TUTAJ liczniki DA SIĘ POLICZYĆ Z DANYCH i dlatego ich już nie ma. Powód: ta
  // bramka pracuje na TRZECH niezależnych artefaktach — (1) plikach
  // `docs/encyklopedia/budynki/*.md`, (2) rekordach `gra/data/buildings.json`,
  // (3) WYGENEROWANYM I ZACOMMITOWANYM `gra/src/data/wikiBundle.json`. Porównanie
  // liczności między dwoma RÓŻNYMI artefaktami nie jest tautologią: łapie dokładnie
  // ten błąd, który ma łapać — hasło dopisane w `docs/`, ale bundle
  // niezregenerowany (albo odwrotnie).
  //
  // W `grupy-budynkow-test.cjs` tak się NIE da: tam licznik `buildings.length === 40`
  // porównywałby `buildings.json` SAM ZE SOBĄ (`X === X`, zawsze zielone), więc tam
  // liczba musi zostać zaszyta i **wymaga bumpu przy każdym nowym budynku**.
  //
  // Jedyna liczba zostawiona tu na sztywno to DOLNA GRANICA batcha źródłowego.
  // NIE jest licznikiem: nie wymaga bumpu przy dodaniu hasła, czerwieni się tylko,
  // gdy ktoś skasuje hasła z pierwszego batcha. Nie zamieniaj jej z powrotem na `===`.
  // =====================================================================
  const BATCH_MIN = 25; // R-CIVPEDIA-BUDYNKI-Q1 (lipiec 2026) — granica, nie licznik
  check(`docs/encyklopedia/budynki/: co najmniej ${BATCH_MIN} plików .md (batch źródłowy nie skurczył się)`,
    files.length >= BATCH_MIN, files.length);
  console.log(`[info] plików .md w docs/encyklopedia/budynki/: ${files.length}`);

  const results = [];
  for (const f of files) {
    const p = path.join(BUDYNKI_DIR, f);
    const content = fs.readFileSync(p, 'utf8');
    const idMatch = content.match(/\|\s*\*\*id\*\*\s*\|\s*`([^`]+)`/);
    const id = idMatch ? idMatch[1] : null;
    const b = id ? byId.get(id) : undefined;
    const rys = extractRysHistoryczny(content);
    results.push({ file: f, id, hasBuildingsEntry: !!b, rys, expected: b ? b.historia : null, content });
  }

  for (const r of results) {
    check(`${r.file}: id znaleziony w sekcji Metadane`, !!r.id, r.file);
  }
  for (const r of results) {
    check(`${r.file}: id "${r.id}" ma odpowiadający wpis w buildings.json`, r.hasBuildingsEntry, r.id);
  }
  for (const r of results) {
    check(`${r.file}: sekcja "## Rys historyczny" obecna`, r.rys !== null, r.file);
  }
  for (const r of results) {
    check(`${r.file}: treść "## Rys historyczny" === buildings.json["${r.id}"].historia (dokładnie)`,
      r.expected !== null && r.rys === r.expected,
      { rysLen: r.rys ? r.rys.length : null, expectedLen: r.expected ? r.expected.length : null });
  }
  // [2] Pliki, które MIAŁY już istniejący changelog "## Historia / decyzje",
  // muszą go zachować NIETKNIĘTY i PRZED nową sekcją.
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
  // [3] Żywy dowód w headless Chromium: realny wikiBundle.json, 3 hasła.
  // -------------------------------------------------------------------
  const realBundle = JSON.parse(fs.readFileSync(REAL_BUNDLE_PATH, 'utf8'));
  const budynkiEntries = realBundle.encyklopedia.filter((e) => e.folder === 'budynki');
  // Liczba POLICZONA Z DRUGIEGO ARTEFAKTU (patrz blok LICZNIKI wyżej): bundle jest
  // generowany z katalogu `docs/encyklopedia/budynki/`, więc różnica liczności = bundle
  // niezregenerowany po dopisaniu/usunięciu hasła. To NIE jest `X === X`.
  check(`realny wikiBundle.json: liczba wpisów folder=budynki === liczba plików .md w docs/encyklopedia/budynki/ (bundle zregenerowany)`,
    budynkiEntries.length === files.length, { bundle: budynkiEntries.length, docs: files.length });
  const withHistoria = budynkiEntries.filter((e) => e.historia && e.historia.length >= 100);
  // „WSZYSTKIE” liczone z danych — predykat jest treściowy, więc porównanie do własnej
  // liczności zbioru NIE jest tautologią: jedno puste `historia` czerwieni asercję.
  check('realny wikiBundle.json: WSZYSTKIE wpisy budynki mają niepuste pole historia (≥100 znaków)',
    withHistoria.length === budynkiEntries.length, { zHistoria: withHistoria.length, wszystkich: budynkiEntries.length });

  // Wybór 3 haseł (deterministyczny — start, środek, koniec listy).
  const sample = [budynkiEntries[0], budynkiEntries[Math.floor(budynkiEntries.length / 2)], budynkiEntries[budynkiEntries.length - 1]];

  const stubPlugin = {
    name: 'stub-wiki-bundle',
    setup(build) {
      build.onResolve({ filter: /brandAssets$/ }, () => ({ path: path.resolve(GRA, 'tools', '.stubs', 'civpedia-historia-infra-brandAssets-stub.ts') }));
      build.onResolve({ filter: /tokens\.css\?raw$/ }, () => ({ path: 'civpedia-budynki-empty-css-raw', namespace: 'civpedia-budynki-virtual' }));
      build.onLoad({ filter: /^civpedia-budynki-empty-css-raw$/, namespace: 'civpedia-budynki-virtual' }, () => ({ contents: 'export default "";', loader: 'js' }));
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

    check(`[3] żywy DOM: "${entry.title}" (${entry.slug}) — nagłówek "Rys historyczny" obecny (depth m)`,
      result.h3s.includes('Rys historyczny'), result.h3s);
    check(`[3] żywy DOM: "${entry.title}" (${entry.slug}) — treść zawiera realny fragment pola historia`,
      result.bodyText.includes(entry.historia.slice(0, 60)),
      { expectedStart: entry.historia.slice(0, 60) });
  }

  await browser.close();

  check('brak błędów konsoli/pageerror podczas scenariusza przeglądarkowego', consoleErrors.length === 0, consoleErrors);

  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[civpedia-budynki-historia-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }
  process.exit(1);
});
