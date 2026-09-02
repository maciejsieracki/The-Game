'use strict';
/**
 * civpedia-historia-infra-test.cjs
 *
 * TEMAT: R-CIVPEDIA-HISTORIA-INFRA-Q1 — mechanizm (infrastruktura) przenoszenia
 * rysu historycznego do CivPedii: pole `historia` w bundlerze
 * (`bundle-wiki-for-game.cjs`) + doklejanie sekcji "## Rys historyczny" w
 * `wikiHubHud.ts::pickEncyContent` dla depth 'm'/'full' (NIE 's').
 *
 * Pokrywa WSZYSTKIE kryteria końca z 00-dispatch.md:
 * [1] bundleEncyklopedia() na fixture .md z "## Rys historyczny" -> historia
 *     === "Tekst testowy." (dokładnie, bez nagłówka). Plik BEZ tej sekcji ->
 *     historia === "".
 * [2] Fixture z ISTNIEJĄCĄ sekcją "## Historia / decyzje" (changelog wiki) ale
 *     BEZ "## Rys historyczny" -> historia MUSI być "" (nowa ekstrakcja nie
 *     myli się z podobnie nazwanym, niezwiązanym nagłówkiem).
 * [3] Żywy dowód w headless Chromium (Playwright): depth 'm'/'full' dla wpisu
 *     z niepustym `historia` -> DOM zawiera nagłówek "Rys historyczny" i treść
 *     pola; depth 's' -> NIE zawiera (nawet gdy historia niepuste).
 * [4] Realny wpis dzisiejszego wikiBundle.json (żaden nie ma jeszcze pola
 *     `historia` w tej rundzie) renderuje się DOKŁADNIE jak dotychczas — zero
 *     sekcji "Rys historyczny" na żadnej głębokości, zero regresu wyglądu.
 *
 * Zero mutacji docs/encyklopedia/** i gra/src/data/wikiBundle.json — fixture'y
 * .md żyją WYŁĄCZNIE w tymczasowym katalogu pod gra/tools/, sprzątane na końcu.
 * bundle-wiki-for-game.cjs jest `require()`-owany (patrz guard require.main===
 * module w tym pliku) — zero efektu ubocznego zapisu do prawdziwego bundle'a.
 *
 * Usage (z gra/): node tools/civpedia-historia-infra-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[civpedia-historia-infra-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'civpedia-historia-infra-brandAssets-stub.ts');
const FIXTURE_DIR = path.resolve(__dirname, '.tmp-civpedia-historia-fixture');
const FIXTURE_BUNDLE_JSON = path.resolve(__dirname, '.civpedia-historia-fixture-bundle.json');
const ENTRY = path.resolve(__dirname, '.civpedia-historia-entry.ts');
const OUTFILE = path.resolve(__dirname, '.civpedia-historia-bundle.cjs');
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
    console.log('[civpedia-historia-infra-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

function cleanupFixtureDir() {
  try { fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }); } catch (_e) { /* noop */ }
}

async function main() {
  // -------------------------------------------------------------------
  // [1] + [2] bundleEncyklopedia() na fixture .md — Node, zero przeglądarki.
  // -------------------------------------------------------------------
  cleanupFixtureDir();
  fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(FIXTURE_DIR, 'z-historia.md'),
    [
      '# Wpis z rysem historycznym',
      '',
      '## Wiki-S',
      '',
      'Skrót testowy.',
      '',
      '## Rys historyczny',
      '',
      'Tekst testowy.',
      '',
    ].join('\n'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(FIXTURE_DIR, 'bez-historii.md'),
    [
      '# Wpis bez rysu historycznego',
      '',
      '## Wiki-S',
      '',
      'Skrót testowy 2.',
      '',
    ].join('\n'),
    'utf8',
  );
  // [2] Fixture z ISTNIEJĄCYM, PODOBNIE nazwanym nagłówkiem-changelogiem
  // ("## Historia / decyzje") ale BEZ "## Rys historyczny" — dowód, że
  // regex extractSection(['Rys historyczny']) nie łapie za szeroko.
  fs.writeFileSync(
    path.join(FIXTURE_DIR, 'z-changelogiem-bez-rysu.md'),
    [
      '# Wpis z changelogiem strony wiki',
      '',
      '## Wiki-S',
      '',
      'Skrót testowy 3.',
      '',
      '## Historia / decyzje',
      '',
      'rev. G2 2026-08-04 — Nauka/Kultura lokalnie zaktualizowane w tabeli.',
      '',
    ].join('\n'),
    'utf8',
  );

  delete require.cache[require.resolve(path.join(GRA, 'tools', 'bundle-wiki-for-game.cjs'))];
  const bundler = require(path.join(GRA, 'tools', 'bundle-wiki-for-game.cjs'));
  const fixtureEntries = bundler.bundleEncyklopedia(FIXTURE_DIR);
  const withHistoria = fixtureEntries.find((e) => e.slug === 'z-historia');
  const withoutHistoria = fixtureEntries.find((e) => e.slug === 'bez-historii');
  const withChangelogOnly = fixtureEntries.find((e) => e.slug === 'z-changelogiem-bez-rysu');

  check('[1] fixture "z-historia.md" znaleziony przez bundleEncyklopedia(fixtureDir)', !!withHistoria, fixtureEntries.map((e) => e.slug));
  check('[1] fixture "z-historia.md": historia === "Tekst testowy." (dokładnie, bez nagłówka)',
    withHistoria && withHistoria.historia === 'Tekst testowy.', withHistoria && withHistoria.historia);
  check('[1] fixture "bez-historii.md": historia === "" (brak sekcji "## Rys historyczny")',
    withoutHistoria && withoutHistoria.historia === '', withoutHistoria && withoutHistoria.historia);
  check('[2] fixture z "## Historia / decyzje" (changelog) ale BEZ "## Rys historyczny": historia === "" (regex nie myli nagłówków)',
    withChangelogOnly && withChangelogOnly.historia === '', withChangelogOnly && withChangelogOnly.historia);
  // Kontrola przytomności: fixture [2] REALNIE ma sekcję "## Historia / decyzje"
  // (żeby test nie przechodził trywialnie przez brak takiej sekcji w ogóle).
  check('kontrola przytomności: fixture z-changelogiem-bez-rysu.md realnie zawiera nagłówek "## Historia / decyzje"',
    fs.readFileSync(path.join(FIXTURE_DIR, 'z-changelogiem-bez-rysu.md'), 'utf8').includes('## Historia / decyzje'));

  cleanupFixtureDir();

  // -------------------------------------------------------------------
  // [3] + [4] Żywy DOM w headless Chromium: wikiHubHud.ts + createWikiHubHud.
  // -------------------------------------------------------------------
  const fixtureBundle = {
    version: 'fixture-civpedia-historia-infra-test',
    generated: '2026-09-02',
    poradnik: [],
    encyklopedia: [
      {
        id: 'pojecia/wpis-z-historia',
        slug: 'wpis-z-historia',
        folder: 'pojecia',
        category: 'Pojęcia',
        title: 'Wpis Z Historią',
        gameIds: [],
        wikiS: 'Skrót testowy.',
        wikiM: 'Hasło testowe (depth m).',
        full: 'Pełna treść testowa (depth full).',
        historia: 'To jest testowy rys historyczny — WYŁĄCZNIE fixture testu.',
      },
      {
        id: 'pojecia/wpis-bez-historii',
        slug: 'wpis-bez-historii',
        folder: 'pojecia',
        category: 'Pojęcia',
        title: 'Wpis Bez Historii',
        gameIds: [],
        wikiS: 'Skrót testowy 2.',
        wikiM: 'Hasło testowe 2 (depth m).',
        full: 'Pełna treść testowa 2 (depth full).',
        historia: '',
      },
    ],
  };
  fs.writeFileSync(FIXTURE_BUNDLE_JSON, JSON.stringify(fixtureBundle), 'utf8');

  const stubPlugin = {
    name: 'stub-wiki-bundle',
    setup(build) {
      build.onResolve({ filter: /data\/wikiBundle\.json$/ }, () => ({ path: FIXTURE_BUNDLE_JSON }));
      build.onResolve({ filter: /brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
      // `brandTokenVars.ts` importuje `./icons/brand/tokens.css?raw` (Vite raw-import,
      // esbuild go nie rozumie) — wirtualny pusty moduł, testowi CSS tokenów niepotrzebny.
      build.onResolve({ filter: /tokens\.css\?raw$/ }, () => ({ path: 'civpedia-historia-infra-empty-css-raw', namespace: 'civpedia-historia-infra-virtual' }));
      build.onLoad({ filter: /^civpedia-historia-infra-empty-css-raw$/, namespace: 'civpedia-historia-infra-virtual' }, () => ({ contents: 'export default "";', loader: 'js' }));
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

  // [3] Fixture z niepustym `historia`: depth 'm' (domyślne po openEncyEntry) i
  // 'full' pokazują nagłówek "Rys historyczny" + treść; depth 's' — NIE.
  const withHistoriaResult = await page.evaluate(() => {
    const api = window.__createWikiHubHud({});
    api.openEncyEntry('pojecia', 'wpis-z-historia');
    const content = document.querySelector('.wh-content');
    const h3s = () => Array.from(content.querySelectorAll('h3')).map((h) => h.textContent.trim());
    const bodyText = () => content.textContent;

    const atM = { h3s: h3s(), hasFieldText: bodyText().includes('To jest testowy rys historyczny — WYŁĄCZNIE fixture testu.') };

    // depth 'full' — kliknij przycisk "Pełny" w pasku szczegółów.
    const fullBtn = Array.from(document.querySelectorAll('.wh-depth button')).find((b) => b.textContent === 'Pełny');
    fullBtn.click();
    const atFull = { h3s: h3s(), hasFieldText: bodyText().includes('To jest testowy rys historyczny — WYŁĄCZNIE fixture testu.') };

    // depth 's' — kliknij "Skrót".
    const sBtn = Array.from(document.querySelectorAll('.wh-depth button')).find((b) => b.textContent === 'Skrót');
    sBtn.click();
    const atS = { h3s: h3s(), hasFieldText: bodyText().includes('To jest testowy rys historyczny — WYŁĄCZNIE fixture testu.') };

    api.destroy();
    return { atM, atFull, atS };
  });
  check('[3] depth "m" (domyślne po otwarciu hasła z niepustym historia): DOM zawiera nagłówek "Rys historyczny"',
    withHistoriaResult.atM.h3s.includes('Rys historyczny'), withHistoriaResult.atM);
  check('[3] depth "m": treść sekcji zawiera dokładny tekst pola historia',
    withHistoriaResult.atM.hasFieldText, withHistoriaResult.atM);
  check('[3] depth "full": DOM zawiera nagłówek "Rys historyczny"',
    withHistoriaResult.atFull.h3s.includes('Rys historyczny'), withHistoriaResult.atFull);
  check('[3] depth "full": treść sekcji zawiera dokładny tekst pola historia',
    withHistoriaResult.atFull.hasFieldText, withHistoriaResult.atFull);
  check('[3] depth "s": DOM NIE zawiera nagłówka "Rys historyczny" (mimo niepustego historia)',
    !withHistoriaResult.atS.h3s.includes('Rys historyczny'), withHistoriaResult.atS);
  check('[3] depth "s": treść sekcji NIE zawiera tekstu pola historia',
    !withHistoriaResult.atS.hasFieldText, withHistoriaResult.atS);

  // Wpis z PUSTYM `historia` — na ŻADNEJ głębokości sekcja się nie pojawia
  // (zero pustego/białego bloku — regres kontrolny obok kryterium 4).
  await page.evaluate(() => { document.getElementById('root').innerHTML = ''; });
  const withoutHistoriaResult = await page.evaluate(() => {
    const api = window.__createWikiHubHud({});
    api.openEncyEntry('pojecia', 'wpis-bez-historii');
    const content = document.querySelector('.wh-content');
    const h3sNow = () => Array.from(content.querySelectorAll('h3')).map((h) => h.textContent.trim());
    const atM = h3sNow();
    const fullBtn = Array.from(document.querySelectorAll('.wh-depth button')).find((b) => b.textContent === 'Pełny');
    fullBtn.click();
    const atFull = h3sNow();
    api.destroy();
    return { atM, atFull };
  });
  check('wpis z PUSTYM historia: depth "m" — zero nagłówka "Rys historyczny"',
    !withoutHistoriaResult.atM.includes('Rys historyczny'), withoutHistoriaResult.atM);
  check('wpis z PUSTYM historia: depth "full" — zero nagłówka "Rys historyczny"',
    !withoutHistoriaResult.atFull.includes('Rys historyczny'), withoutHistoriaResult.atFull);

  await browser.close();

  // -------------------------------------------------------------------
  // [4] Realny wikiBundle.json (dzisiejszy, NIETKNIĘTY) — zero regresu.
  // Node-only: żaden dzisiejszy wpis nie ma pola `historia`, więc
  // pickEncyContent (odtworzone jako czarna skrzynka na tym samym kontrakcie,
  // wzorem civpedia-gra-id-mostek-test.cjs) MUSI dawać identyczny wynik jak
  // przed tą rundą — brak bloku "## Rys historyczny" dla depth 'm'/'full'.
  // -------------------------------------------------------------------
  const REAL_BUNDLE_PATH = path.join(GRA, 'src', 'data', 'wikiBundle.json');
  const realBundle = JSON.parse(fs.readFileSync(REAL_BUNDLE_PATH, 'utf8'));
  function pickEncyContentBlackBox(entry, d) {
    const historiaBlock = entry.historia ? `\n\n## Rys historyczny\n\n${entry.historia}` : '';
    if (d === 's') return `## ${entry.title}\n\n${entry.wikiS}`;
    if (d === 'm') return `## ${entry.title}\n\n${entry.wikiM}${historiaBlock}`;
    return `${entry.full}${historiaBlock}`;
  }
  check('[4] kontrola przytomności: dzisiejszy wikiBundle.json ma >0 wpisów encyklopedii', realBundle.encyklopedia.length > 0, realBundle.encyklopedia.length);
  const regressed = realBundle.encyklopedia.filter((e) => {
    const m = pickEncyContentBlackBox(e, 'm');
    const full = pickEncyContentBlackBox(e, 'full');
    return m.includes('## Rys historyczny') || full !== e.full;
  });
  check('[4] WSZYSTKIE dzisiejsze wpisy encyklopedii: depth "m"/"full" bez sekcji "## Rys historyczny" (zero regresu — pole historia jeszcze nigdzie niewypełnione)',
    regressed.length === 0, regressed.map((e) => e.id));

  check('brak błędów konsoli/pageerror podczas całego scenariusza przeglądarkowego', consoleErrors.length === 0, consoleErrors);

  cleanupFixtureDir();
  try { fs.unlinkSync(FIXTURE_BUNDLE_JSON); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[civpedia-historia-infra-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  cleanupFixtureDir();
  process.exit(1);
});
