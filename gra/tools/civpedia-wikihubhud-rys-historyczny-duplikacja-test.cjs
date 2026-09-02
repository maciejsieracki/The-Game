'use strict';
/**
 * civpedia-wikihubhud-rys-historyczny-duplikacja-test.cjs
 *
 * TEMAT: P-CIVPEDIA-WIKIHUBHUD-RYS-HISTORYCZNY-DUPLIKACJA-Q1.
 *
 * Bug (odkryty niezależnie przez Operatora/Evaluatora/Final Control przy
 * R-CIVPEDIA-TECHNOLOGIE-Q1, wprowadzony wcześniej poza allowlistą przez
 * R-CIVPEDIA-HISTORIA-INFRA-Q1, d6032099): `pickEncyContent(entry, 'full')`
 * zwracał `entry.full` (który JUŻ zawiera wyrenderowaną sekcję
 * "## Rys historyczny", bo `entry.full` to surowy body pliku .md po
 * bundle-wiki-for-game.cjs) i DOKLEJAŁ `historiaBlock` po raz drugi — sekcja
 * występowała w DOM dwukrotnie. Widok 'm' (`entry.wikiM`, osobna wyekstrahowana
 * sekcja BEZ "## Rys historyczny") był poprawny.
 *
 * Ten test renderuje PRAWDZIWY `createWikiHubHud` (wikiHubHud.ts) w żywym
 * headless Chromium (jsdom nie jest tu potrzebny do wykrycia duplikacji tekstu,
 * ale test i tak idzie ścieżką produkcyjną 1:1 — esbuild + realny DOM/innerHTML —
 * żeby pokrywać faktyczny markdownToHtml() i faktyczne dane z wikiBundle.json,
 * zgodnie z regułą przeciw samooszukiwaniu w dyspozycji).
 *
 * Pokrywa kryteria końca 1-4 z dyspozycji:
 *   1. hasło z niepustym entry.historia, depth 'full' -> "Rys historyczny" DOKŁADNIE RAZ w DOM
 *   2. to samo hasło, depth 'm' -> nadal DOKŁADNIE RAZ (zero regresu)
 *   3. hasło BEZ entry.historia -> zero wystąpień na 'm' i 'full'
 *   4. MUTACJA: wariant bundla z warunkiem cofniętym na "zawsze dokleja"
 *      (odtworzenie buga) MUSI dać 2 wystąpienia na depth 'full' dla kryterium 1
 *      -- inaczej test niczego nie sprawdza.
 *
 * Usage (z gra/): node tools/civpedia-wikihubhud-rys-historyczny-duplikacja-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[civpedia-wikihubhud-rys-historyczny-duplikacja-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.civpedia-wikihubhud-rys-hist-entry.ts');
const OUTFILE_FIXED = path.resolve(__dirname, '.civpedia-wikihubhud-rys-hist-bundle-fixed.cjs');
const OUTFILE_MUT = path.resolve(__dirname, '.civpedia-wikihubhud-rys-hist-bundle-mut.cjs');
const HUD_TS = path.resolve(GRA, 'src', 'ui', 'wikiHubHud.ts');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Hasła realne z wikiBundle.json (patrz recon dyspozycji): akademia ma niepuste
// entry.historia, bogactwo (kategoria "pojęcia") nie ma go wcale.
const WITH_HISTORIA = { folder: 'budynki', id: 'akademia' };
const WITHOUT_HISTORIA = { folder: 'pojecia', id: 'bogactwo' };

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

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

/** MUTACJA (kryterium 4): cofa fix w pickEncyContent na "zawsze dokleja
 * historiaBlock" -- czyli odtwarza dokładnie stan przed tym tematem. */
function mutateHudSource(src) {
  const marker = "const fullAlreadyHasHistoria = entry.full.includes('\\n## Rys historyczny\\n');";
  if (!src.includes(marker)) {
    throw new Error('MUTACJA: kotwica fixu nie znaleziona w wikiHubHud.ts -- test niezsynchronizowany ze źródłem');
  }
  return src
    .replace(marker, '')
    .replace(
      "return `${entry.full}${fullAlreadyHasHistoria ? '' : historiaBlock}`;",
      'return `${entry.full}${historiaBlock}`;',
    );
}

function makeHudPlugin(mutate) {
  return {
    name: 'wiki-hub-hud-src',
    setup(build) {
      build.onLoad({ filter: /wikiHubHud\.ts$/ }, (args) => {
        if (path.resolve(args.path) !== HUD_TS) return null;
        let src = fs.readFileSync(args.path, 'utf8');
        if (mutate) src = mutateHudSource(src);
        return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  };
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[civpedia-wikihubhud-rys-historyczny-duplikacja-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Otwiera hasło (folder,id), przełącza na depth 'full' i 'm', licząc REALNE
 * wystąpienia nagłówka "Rys historyczny" w DOM na każdej głębokości. */
async function measureOccurrences(page, folder, id) {
  return page.evaluate(({ folder, id }) => {
    window.__api?.destroy?.();
    const api = window.__createWikiHubHud({});
    window.__api = api;
    api.openEncyEntry(folder, id);

    const countHeading = () => Array.from(document.querySelectorAll('.wh-content h3'))
      .filter((h) => h.textContent.trim() === 'Rys historyczny').length;

    const atM = countHeading(); // openEncyEntry ustawia depth='m' na starcie

    const fullBtn = Array.from(document.querySelectorAll('.wh-depth button'))
      .find((b) => b.textContent.trim() === 'Pełny');
    if (!fullBtn) return { atM, atFull: null, error: 'brak przycisku "Pełny" (encyDepthVisible?)' };
    fullBtn.click();
    const atFull = countHeading();

    return { atM, atFull };
  }, { folder, id });
}

async function buildBundle(outfile, mutate) {
  fs.writeFileSync(ENTRY, [
    "import { createWikiHubHud } from '../src/ui/wikiHubHud.ts';",
    'window.__createWikiHubHud = createWikiHubHud;',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [viteCompatPlugin, makeHudPlugin(mutate)], logLevel: 'silent',
  });
}

async function main() {
  await buildBundle(OUTFILE_FIXED, false);
  await buildBundle(OUTFILE_MUT, true);

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  try {
    // --- (1)-(3) Wariant NAPRAWIONY (kod produkcyjny 1:1) ---
    await page.setContent('<!DOCTYPE html><html><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE_FIXED, 'utf8') });

    const withHistFixed = await measureOccurrences(page, WITH_HISTORIA.folder, WITH_HISTORIA.id);
    check('(1) hasło z entry.historia, depth "full": "Rys historyczny" DOKŁADNIE RAZ w DOM',
      withHistFixed.atFull === 1, withHistFixed);
    check('(2) to samo hasło, depth "m": nadal DOKŁADNIE RAZ (zero regresu)',
      withHistFixed.atM === 1, withHistFixed);

    const noHistFixed = await measureOccurrences(page, WITHOUT_HISTORIA.folder, WITHOUT_HISTORIA.id);
    check('(3) hasło BEZ entry.historia, depth "m": zero wystąpień',
      noHistFixed.atM === 0, noHistFixed);
    check('(3) hasło BEZ entry.historia, depth "full": zero wystąpień',
      noHistFixed.atFull === 0, noHistFixed);

    // --- (4) MUTACJA: fix cofnięty na "zawsze dokleja" (odtworzony bug) ---
    console.log('\n-- Mutacja: warunek pickEncyContent cofnięty na "zawsze dokleja historiaBlock" --');
    await page.setContent('<!DOCTYPE html><html><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE_MUT, 'utf8') });

    const withHistMut = await measureOccurrences(page, WITH_HISTORIA.folder, WITH_HISTORIA.id);
    check('(4) mutacja: depth "full" WRACA do DWÓCH wystąpień (test realnie testuje duplikację)',
      withHistMut.atFull === 2, withHistMut);
    check('(4) mutacja: depth "m" pozostaje niezmieniony (bug dotyczy wyłącznie "full")',
      withHistMut.atM === 1, withHistMut);

    check('brak błędów konsoli/pageerror w trakcie renderu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE_FIXED, { force: true });
    fs.rmSync(OUTFILE_MUT, { force: true });
  }

  console.log('');
  console.log(`[civpedia-wikihubhud-rys-historyczny-duplikacja-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
  console.log('ALL GREEN');
}

main().catch((e) => { console.error(e); process.exit(1); });
