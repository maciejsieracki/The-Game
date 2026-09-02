'use strict';
/**
 * civpedia-jednostki-j2-test.cjs
 *
 * TEMAT: R-CIVPEDIA-JEDNOSTKI-J2-Q1 — batch treści, kategoria jednostki,
 * część 2/2 (druga połowa alfabetyczna, 24 pliki).
 *
 * Pokrywa kryteria końca 1-5 z 00-dispatch.md:
 * [1] Każdy z 24 plików ma na końcu "## Rys historyczny" z treścią DOKŁADNIE
 *     zgodną z polem `Historia` w gra/data/units.json (dopasowanie po
 *     `Jednostka` === tytuł pliku, poza wyjątkiem [2]).
 * [2] wojownik-celtycki.md: sekcja odpowiada KONKRETNIE wpisowi
 *     `Jednostka === "Soldurii"` w units.json (via `gra-id: soldurii` w
 *     `## Metadane`), NIE jakiemukolwiek wpisowi zawierającemu "Wojownik" —
 *     osobna, jawna asercja.
 * [3] Zero zmian w istniejących sekcjach "## Historia / decyzje" (tam gdzie
 *     obecne) — treść PRZED "## Rys historyczny" bez tego nagłówka jest
 *     identyczna z wersją w `git show HEAD:<plik>` (bazowy `origin/main`).
 * [4] Zero zmian w pozostałych 25 plikach folderu `jednostki/` (batch J1) —
 *     dowód przez `git diff --stat` (ten test woła `git` jako subprocess,
 *     read-only).
 * [5] Żywy dowód w headless Chromium: 3 z 24 haseł (w tym KONIECZNIE
 *     wojownik-celtycki / Soldurii) pokazują wyrenderowaną sekcję
 *     "Rys historyczny" z realną treścią, w widoku depth 'm'.
 *
 * Usage (z gra/): node tools/civpedia-jednostki-j2-test.cjs
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[civpedia-jednostki-j2-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA, '..');
const JEDNOSTKI_DIR = path.resolve(REPO_ROOT, 'docs', 'encyklopedia', 'jednostki');
const UNITS_JSON = path.resolve(GRA, 'data', 'units.json');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'civpedia-historia-infra-brandAssets-stub.ts');
const FIXTURE_BUNDLE_JSON = path.resolve(__dirname, '.civpedia-j2-fixture-bundle.json');
const ENTRY = path.resolve(__dirname, '.civpedia-j2-entry.ts');
const OUTFILE = path.resolve(__dirname, '.civpedia-j2-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const BATCH_FILES = [
  'rydwan-sumeryjski.md', 'rydwan-wo-y.md', 'taran.md', 'triari.md',
  'ucznik-akadyjski.md', 'ucznik-egipski.md', 'ucznik-sumeryjski.md', 'ucznik.md',
  'uthulwana-bia-e-tarcze.md', 'w-ocznik-sumeryjski.md', 'w-ocznik.md',
  'wieza-obleznicza.md', 'wojownik-celtycki.md', 'wojownik-germanski.md',
  'wojownik-mykenski.md', 'wojownik-sherden.md', 'wojownik-szekelesz.md',
  'wojownik-tyrrenski.md', 'wojownik-z-khopesh.md', 'wojownik-z-maczuga-chaska.md',
  'wojownik-z-mieczem-i-tarcza.md', 'wojownik-z-toporem.md', 'wojownik.md',
  'zwiadowca.md',
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
    console.log('[civpedia-jednostki-j2-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

function readFrontMatterGraId(md) {
  const m = md.match(/\|\s*gra-id\s*\|\s*([^|]+?)\s*\|/i);
  return m ? m[1].trim() : null;
}

function titleFromMd(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

async function main() {
  // ------------------------------------------------------------------
  // [1] + [2] Statyczna weryfikacja treści 24 plików vs units.json.
  // ------------------------------------------------------------------
  const units = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
  const byName = new Map(units.map((u) => [u.Jednostka, u]));

  check('kontrola przytomności: units.json ma >0 wpisów', Array.isArray(units) && units.length > 0, units.length);

  const soldurii = byName.get('Soldurii');
  check('kontrola przytomności: units.json zawiera dokładnie wpis "Soldurii" z niepustym Historia',
    !!soldurii && !!soldurii.Historia && soldurii.Historia.trim().length > 0);

  const wojownikGeneric = byName.get('Wojownik');
  check('kontrola przeciw pomyłce: Historia("Soldurii") !== Historia("Wojownik") w units.json',
    soldurii && wojownikGeneric && soldurii.Historia !== wojownikGeneric.Historia,
    { soldurii: soldurii && soldurii.Historia.slice(0, 40), wojownik: wojownikGeneric && wojownikGeneric.Historia.slice(0, 40) });

  const fileResults = {};
  for (const fname of BATCH_FILES) {
    const p = path.join(JEDNOSTKI_DIR, fname);
    const content = fs.readFileSync(p, 'utf8');
    const graId = readFrontMatterGraId(content);
    let expectedUnit;
    if (fname === 'wojownik-celtycki.md') {
      check('[2] wojownik-celtycki.md ma "gra-id: soldurii" w Metadanych', graId === 'soldurii', graId);
      expectedUnit = soldurii;
    } else {
      const title = titleFromMd(content);
      expectedUnit = byName.get(title);
      check(`[1] "${fname}": tytuł pliku ("${title}") ma dopasowany wpis w units.json`, !!expectedUnit, title);
    }
    check(`kontrola przytomności: "${fname}" nie ma "gra-id" poza wyjątkiem wojownik-celtycki.md`,
      fname === 'wojownik-celtycki.md' || graId === null, graId);

    const m = content.match(/## Rys historyczny\n\n([\s\S]*?)\n$/);
    const actualHistoria = m ? m[1] : null;
    fileResults[fname] = { actualHistoria, hasSection: content.includes('## Rys historyczny') };
    check(`[1] "${fname}": zawiera sekcję "## Rys historyczny"`, fileResults[fname].hasSection);
    check(`[1] "${fname}": treść sekcji === units.json Historia (dokładnie, dla ${fname === 'wojownik-celtycki.md' ? 'Soldurii' : titleFromMd(content)})`,
      expectedUnit && actualHistoria === expectedUnit.Historia,
      { actual: actualHistoria && actualHistoria.slice(0, 60), expected: expectedUnit && expectedUnit.Historia.slice(0, 60) });

    if (fname === 'wojownik-celtycki.md') {
      check('[2] wojownik-celtycki.md: sekcja NIE odpowiada wpisowi "Wojownik" (generic) w units.json',
        wojownikGeneric && actualHistoria !== wojownikGeneric.Historia, actualHistoria && actualHistoria.slice(0, 60));
    }
  }

  // ------------------------------------------------------------------
  // [3] Zero zmian w "## Historia / decyzje" — treść PRZED nowym nagłówkiem
  // identyczna z bazową wersją w git (origin/main / HEAD przed tym batchem).
  // ------------------------------------------------------------------
  let baseAvailable = true;
  let baseRef = null;
  try {
    baseRef = execFileSync('git', ['merge-base', 'HEAD', 'origin/main'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch (e) {
    try {
      baseRef = execFileSync('git', ['rev-parse', 'origin/main'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    } catch (e2) { baseAvailable = false; }
  }
  if (baseAvailable) {
    for (const fname of BATCH_FILES) {
      const rel = path.join('docs', 'encyklopedia', 'jednostki', fname);
      let baseContent;
      try {
        baseContent = execFileSync('git', ['show', `${baseRef}:${rel}`], { cwd: REPO_ROOT, encoding: 'utf8' });
      } catch (e) {
        check(`[3] "${fname}": bazowa wersja w git czytelna (${baseRef})`, false, String(e.message || e));
        continue;
      }
      const current = fs.readFileSync(path.join(JEDNOSTKI_DIR, fname), 'utf8');
      const currentWithoutNewSection = current.replace(/\n\n## Rys historyczny\n\n[\s\S]*$/, '\n');
      check(`[3] "${fname}": treść PRZED "## Rys historyczny" identyczna z bazową (origin/main) — zero zmian w istniejących sekcjach`,
        currentWithoutNewSection === (baseContent.endsWith('\n') ? baseContent : baseContent + '\n')
        || currentWithoutNewSection.trimEnd() === baseContent.trimEnd());
    }
  } else {
    check('[3] baza git (origin/main) dostępna do porównania', false, 'brak dostępu do origin/main w tym repo');
  }

  // ------------------------------------------------------------------
  // [4] Zero zmian poza tymi 24 plikami w folderze jednostki/ (batch J1
  // nietknięty) — `git diff --stat` względem bazy.
  // ------------------------------------------------------------------
  if (baseAvailable) {
    let diffStat = '';
    try {
      diffStat = execFileSync('git', ['diff', '--name-only', `${baseRef}`, '--', 'docs/encyklopedia/jednostki/'], { cwd: REPO_ROOT, encoding: 'utf8' });
    } catch (e) { diffStat = ''; }
    const changedFiles = diffStat.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => path.basename(l));
    const expectedSet = new Set(BATCH_FILES);
    const unexpected = changedFiles.filter((f) => !expectedSet.has(f));
    const missing = BATCH_FILES.filter((f) => !changedFiles.includes(f));
    check('[4] git diff w docs/encyklopedia/jednostki/ obejmuje WYŁĄCZNIE tych 24 plików batcha J2 (zero dotknięcia J1)',
      unexpected.length === 0, unexpected);
    check('[4] git diff w docs/encyklopedia/jednostki/ obejmuje WSZYSTKIE 24 pliki batcha J2',
      missing.length === 0, missing);
  }

  // ------------------------------------------------------------------
  // [5] Żywy dowód w headless Chromium: 3 z 24 haseł (w tym KONIECZNIE
  // wojownik-celtycki/Soldurii) w widoku depth 'm'.
  // ------------------------------------------------------------------
  const SAMPLE = ['wojownik-celtycki.md', 'wojownik.md', 'zwiadowca.md'];
  const fixtureEncy = SAMPLE.map((fname) => {
    const slug = fname.replace(/\.md$/, '');
    const r = fileResults[fname];
    return {
      id: `jednostki/${slug}`,
      slug,
      folder: 'jednostki',
      category: 'Jednostki',
      title: slug,
      gameIds: [],
      wikiS: 'Skrót testowy.',
      wikiM: 'Hasło testowe (depth m).',
      full: 'Pełna treść testowa (depth full).',
      historia: r.actualHistoria || '',
    };
  });
  const fixtureBundle = {
    version: 'fixture-civpedia-jednostki-j2-test',
    generated: '2026-09-02',
    poradnik: [],
    encyklopedia: fixtureEncy,
  };
  fs.writeFileSync(FIXTURE_BUNDLE_JSON, JSON.stringify(fixtureBundle), 'utf8');

  const stubPlugin = {
    name: 'stub-wiki-bundle',
    setup(build) {
      build.onResolve({ filter: /data\/wikiBundle\.json$/ }, () => ({ path: FIXTURE_BUNDLE_JSON }));
      build.onResolve({ filter: /brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
      build.onResolve({ filter: /tokens\.css\?raw$/ }, () => ({ path: 'civpedia-j2-empty-css-raw', namespace: 'civpedia-j2-virtual' }));
      build.onLoad({ filter: /^civpedia-j2-empty-css-raw$/, namespace: 'civpedia-j2-virtual' }, () => ({ contents: 'export default "";', loader: 'js' }));
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

  for (const fname of SAMPLE) {
    const slug = fname.replace(/\.md$/, '');
    const expectedSnippet = (fileResults[fname].actualHistoria || '').slice(0, 80);
    const result = await page.evaluate(({ slug, expectedSnippet }) => {
      document.getElementById('root').innerHTML = '';
      const api = window.__createWikiHubHud({});
      api.openEncyEntry('jednostki', slug);
      const content = document.querySelector('.wh-content');
      const h3s = Array.from(content.querySelectorAll('h3')).map((h) => h.textContent.trim());
      const bodyText = content.textContent;
      api.destroy();
      return { h3s, hasSnippet: expectedSnippet ? bodyText.includes(expectedSnippet) : false };
    }, { slug, expectedSnippet });
    check(`[5] żywy render (depth 'm'): hasło "${fname}" pokazuje nagłówek "Rys historyczny"`, result.h3s.includes('Rys historyczny'), result.h3s);
    check(`[5] żywy render (depth 'm'): hasło "${fname}" pokazuje realną treść pola historia`, result.hasSnippet, expectedSnippet);
  }

  await browser.close();

  try { fs.unlinkSync(FIXTURE_BUNDLE_JSON); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  check('brak błędów konsoli/pageerror podczas scenariusza przeglądarkowego', consoleErrors.length === 0, consoleErrors);

  console.log('');
  console.log(`[civpedia-jednostki-j2-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
