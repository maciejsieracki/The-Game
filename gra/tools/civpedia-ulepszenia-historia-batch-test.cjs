'use strict';
/**
 * civpedia-ulepszenia-historia-batch-test.cjs
 *
 * TEMAT: R-CIVPEDIA-ULEPSZENIA-Q1 — batch treści: sekcja "## Rys historyczny"
 * dopisana na końcu 17 plików `docs/encyklopedia/ulepszenia/*.md`, treścią
 * dosłownie zgodną z polem `historia` w `gra/data/terrain-improvements.json`.
 * 16 plików mapuje się 1:1 przez `id` z `## Metadane`. WYJĄTEK: `kopalnia.md`
 * — jeden plik, JEDNA sekcja "## Rys historyczny" zawierająca WSZYSTKIE 4
 * teksty (kopalnia_miedzi/zelaza/cyny/zlota), każdy pod własnym pogrubionym
 * podnagłówkiem z nazwą surowca.
 *
 * Pokrywa kryteria końca [1]-[4] z 00-dispatch.md tego tematu:
 * [1] 16 "zwykłych" plików: "## Rys historyczny" === dokładnie pole `historia`
 *     z JSON-a (po `id` z `## Metadane`).
 * [2] `kopalnia.md`: jedna sekcja "## Rys historyczny" zawierająca wszystkie
 *     4 teksty, każdy pod podnagłówkiem z nazwą surowca, treść dokładnie
 *     zgodna z odpowiadającym kluczem w JSON-ie.
 * [3] Zero zmian w istniejących sekcjach "## Historia / decyzje" (obecne,
 *     niepuste, identyczne z tym co repo miało przed tą rundą — porównanie
 *     przez obecność znanej linii `rev. E 2026-07-03`).
 * [4] Żywy dowód w headless Chromium: 3 "zwykłe" hasła + `kopalnia` (depth
 *     'm') pokazują wyrenderowaną sekcję "Rys historyczny" z realną treścią;
 *     dla kopalni — wszystkie 4 podnagłówki obecne w DOM.
 *
 * Czyta WYŁĄCZNIE prawdziwe pliki repo (docs/encyklopedia/ulepszenia/*.md,
 * gra/data/terrain-improvements.json, gra/src/data/wikiBundle.json) — zero
 * mutacji. Renderuje przez esbuild+Playwright, wzorem
 * civpedia-historia-infra-test.cjs.
 *
 * Usage (z gra/): node tools/civpedia-ulepszenia-historia-batch-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[civpedia-ulepszenia-historia-batch-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const GRA = path.resolve(__dirname, '..');
const ULEPSZENIA_DIR = path.join(REPO_ROOT, 'docs', 'encyklopedia', 'ulepszenia');
const TERRAIN_JSON = path.join(REPO_ROOT, 'gra', 'data', 'terrain-improvements.json');
const BRAND_ASSETS_STUB = path.resolve(__dirname, '.stubs', 'civpedia-historia-infra-brandAssets-stub.ts');
const ENTRY = path.resolve(__dirname, '.civpedia-ulepszenia-batch-entry.ts');
const OUTFILE = path.resolve(__dirname, '.civpedia-ulepszenia-batch-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const REGULAR_IDS = [
  'bydlo', 'droga', 'farma', 'fort', 'glinianka', 'irygacja', 'kamieniolom',
  'lama', 'lodzie_rybackie', 'oboz_lowiecki', 'owce', 'posterunek', 'tarasy',
  'tartak', 'warzelnia_soli', 'wyrab',
];
const KOPALNIA_VARIANTS = [
  ['kopalnia_miedzi', 'Kopalnia miedzi'],
  ['kopalnia_zelaza', 'Kopalnia żelaza'],
  ['kopalnia_cyny', 'Kopalnia cyny'],
  ['kopalnia_zlota', 'Kopalnia złota'],
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
    console.log('[civpedia-ulepszenia-historia-batch-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

function extractLastSection(content, headingLine) {
  const marker = `${headingLine}\n\n`;
  const idx = content.lastIndexOf(marker);
  if (idx === -1) return null;
  let body = content.slice(idx + marker.length);
  if (body.endsWith('\n')) body = body.slice(0, -1);
  return body;
}

async function main() {
  const terrain = JSON.parse(fs.readFileSync(TERRAIN_JSON, 'utf8'));

  // -------------------------------------------------------------------
  // [1] 16 "zwykłych" plików — treść "## Rys historyczny" dokładnie zgodna
  //     z JSON-em, po id z "## Metadane".
  // -------------------------------------------------------------------
  for (const fname of REGULAR_IDS) {
    const mdPath = path.join(ULEPSZENIA_DIR, `${fname}.md`);
    const content = fs.readFileSync(mdPath, 'utf8');
    const idMatch = content.match(/\|\s*\*\*id\*\*\s*\|\s*`([^`]+)`\s*\|/);
    const metaId = idMatch ? idMatch[1] : null;
    check(`[1] ${fname}.md: "## Metadane" -> id === "${fname}"`, metaId === fname, metaId);

    const extracted = extractLastSection(content, '## Rys historyczny');
    const expected = terrain[fname] && terrain[fname].historia;
    check(`[1] ${fname}.md: JSON["${fname}"].historia niepuste`, !!expected, expected && expected.length);
    check(`[1] ${fname}.md: "## Rys historyczny" === dokładnie JSON["${fname}"].historia`,
      extracted !== null && extracted === expected,
      { extractedLen: extracted && extracted.length, expectedLen: expected && expected.length });
  }

  // -------------------------------------------------------------------
  // [2] kopalnia.md — jedna sekcja, 4 teksty pod podnagłówkami surowców.
  // -------------------------------------------------------------------
  const kopalniaPath = path.join(ULEPSZENIA_DIR, 'kopalnia.md');
  const kopalniaContent = fs.readFileSync(kopalniaPath, 'utf8');
  const kopalniaIdMatch = kopalniaContent.match(/\|\s*\*\*id\*\*\s*\|\s*`([^`]+)`\s*\|/);
  check('[2] kopalnia.md: "## Metadane" -> id === "kopalnia"', kopalniaIdMatch && kopalniaIdMatch[1] === 'kopalnia', kopalniaIdMatch);
  const kopalniaGraIdMatch = kopalniaContent.match(/\|\s*gra-id\s*\|\s*([^|]+)\|/);
  check('[2] kopalnia.md: "## Metadane" -> gra-id wymienia wszystkie 4 warianty',
    !!(kopalniaGraIdMatch && KOPALNIA_VARIANTS.every(([k]) => kopalniaGraIdMatch[1].includes(k))),
    kopalniaGraIdMatch && kopalniaGraIdMatch[1]);

  const occurrences = kopalniaContent.split('## Rys historyczny').length - 1;
  check('[2] kopalnia.md: DOKŁADNIE JEDNA sekcja "## Rys historyczny" (nie 4 osobne)', occurrences === 1, occurrences);

  const kopalniaSection = extractLastSection(kopalniaContent, '## Rys historyczny');
  check('[2] kopalnia.md: sekcja "## Rys historyczny" istnieje', !!kopalniaSection);
  for (const [key, label] of KOPALNIA_VARIANTS) {
    const expected = terrain[key] && terrain[key].historia;
    check(`[2] kopalnia.md: JSON["${key}"].historia niepuste`, !!expected, expected && expected.length);
    const subheading = `**${label}**`;
    const hasSubheading = kopalniaSection ? kopalniaSection.includes(subheading) : false;
    check(`[2] kopalnia.md: podnagłówek "${subheading}" obecny w sekcji`, hasSubheading);
    const hasExactText = kopalniaSection && expected ? kopalniaSection.includes(expected) : false;
    check(`[2] kopalnia.md: tekst dla "${key}" DOKŁADNIE zgodny z JSON-em (bez skrótów)`, hasExactText);
  }
  // Kolejność: miedź / żelazo / cyna / złoto.
  if (kopalniaSection) {
    const positions = KOPALNIA_VARIANTS.map(([, label]) => kopalniaSection.indexOf(`**${label}**`));
    const sorted = positions.every((p, i) => i === 0 || p > positions[i - 1]);
    check('[2] kopalnia.md: kolejność podnagłówków miedź/żelazo/cyna/złoto', sorted && positions.every((p) => p !== -1), positions);
  }
  // Kontrola przeciw samooszukiwaniu: NIE wolno, żeby sekcja zawierała
  // tylko JEDEN z 4 tekstów (np. skopiowanie tylko kopalnia_miedzi).
  const matchCount = KOPALNIA_VARIANTS.filter(([key]) => {
    const expected = terrain[key] && terrain[key].historia;
    return kopalniaSection && expected && kopalniaSection.includes(expected);
  }).length;
  check('[2] kopalnia.md: WSZYSTKIE 4 (nie 1, nie 2, nie 3) teksty obecne jednocześnie', matchCount === 4, matchCount);

  // -------------------------------------------------------------------
  // [3] Zero zmian w istniejących "## Historia / decyzje" (changelog wiki).
  // -------------------------------------------------------------------
  const ALL_FILES = [...REGULAR_IDS, 'kopalnia'];
  for (const fname of ALL_FILES) {
    const mdPath = path.join(ULEPSZENIA_DIR, `${fname}.md`);
    const content = fs.readFileSync(mdPath, 'utf8');
    const hasChangelog = content.includes('## Historia / decyzje');
    const hasKnownRevLine = content.includes('rev. E 2026-07-03 (pogłębienie + przykłady).');
    check(`[3] ${fname}.md: "## Historia / decyzje" nadal obecna i niezmieniona (linia rev. E 2026-07-03)`,
      hasChangelog && hasKnownRevLine);
    // "## Rys historyczny" musi być PO "## Historia / decyzje" (dopisane na końcu).
    const idxChangelog = content.indexOf('## Historia / decyzje');
    const idxRys = content.lastIndexOf('## Rys historyczny');
    check(`[3] ${fname}.md: "## Rys historyczny" dopisana PO "## Historia / decyzje" (na końcu pliku)`,
      idxRys > idxChangelog, { idxChangelog, idxRys });
  }

  // -------------------------------------------------------------------
  // [4] Żywy dowód w headless Chromium: 3 "zwykłe" hasła + kopalnia.
  // -------------------------------------------------------------------
  const stubPlugin = {
    name: 'stub-brand',
    setup(build) {
      build.onResolve({ filter: /brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
      build.onResolve({ filter: /tokens\.css\?raw$/ }, () => ({ path: 'civpedia-ulepszenia-batch-empty-css-raw', namespace: 'civpedia-ulepszenia-batch-virtual' }));
      build.onLoad({ filter: /^civpedia-ulepszenia-batch-empty-css-raw$/, namespace: 'civpedia-ulepszenia-batch-virtual' }, () => ({ contents: 'export default "";', loader: 'js' }));
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

  const SAMPLE_REGULAR = ['bydlo', 'farma', 'tartak'];
  for (const slug of SAMPLE_REGULAR) {
    const expected = terrain[slug].historia;
    // eslint-disable-next-line no-await-in-loop
    const result = await page.evaluate(({ slug }) => {
      document.getElementById('root').innerHTML = '';
      const api = window.__createWikiHubHud({});
      api.openEncyEntry('ulepszenia', slug);
      const content = document.querySelector('.wh-content');
      const h3s = Array.from(content.querySelectorAll('h3')).map((h) => h.textContent.trim());
      const bodyText = content.textContent;
      api.destroy();
      return { h3s, bodyText };
    }, { slug });
    check(`[4] żywy DOM: '${slug}' (depth 'm') zawiera nagłówek "Rys historyczny"`, result.h3s.includes('Rys historyczny'), result.h3s);
    check(`[4] żywy DOM: '${slug}' — treść sekcji zawiera dokładny tekst z JSON-a`, result.bodyText.includes(expected));
  }

  const kopalniaResult = await page.evaluate(() => {
    document.getElementById('root').innerHTML = '';
    const api = window.__createWikiHubHud({});
    api.openEncyEntry('ulepszenia', 'kopalnia');
    const content = document.querySelector('.wh-content');
    const h3s = Array.from(content.querySelectorAll('h3')).map((h) => h.textContent.trim());
    const strongs = Array.from(content.querySelectorAll('strong')).map((s) => s.textContent.trim());
    const bodyText = content.textContent;
    api.destroy();
    return { h3s, strongs, bodyText };
  });
  check('[4] żywy DOM: "kopalnia" (depth \'m\') zawiera nagłówek "Rys historyczny"', kopalniaResult.h3s.includes('Rys historyczny'), kopalniaResult.h3s);
  for (const [key, label] of KOPALNIA_VARIANTS) {
    check(`[4] żywy DOM: "kopalnia" — podnagłówek "${label}" obecny w DOM`, kopalniaResult.strongs.includes(label), kopalniaResult.strongs);
    check(`[4] żywy DOM: "kopalnia" — tekst dla "${key}" obecny w DOM`, kopalniaResult.bodyText.includes(terrain[key].historia));
  }

  await browser.close();

  check('brak błędów konsoli/pageerror podczas całego scenariusza przeglądarkowego', consoleErrors.length === 0, consoleErrors);

  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[civpedia-ulepszenia-historia-batch-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }
  process.exit(1);
});
