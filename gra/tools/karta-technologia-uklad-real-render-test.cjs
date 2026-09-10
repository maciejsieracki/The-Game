'use strict';
/**
 * karta-technologia-uklad-real-render-test.cjs
 *
 * TEMAT: P-KARTA-PRZEBUDOWA-UKLAD-TECH-Q1 (`00-dispatch.md`, część "technologia" wyłącznie
 * — część "ulepszenie" robi równoległy Operator w innym worktree, zero nakładania plików).
 *
 * Dowodzi w PRAWDZIWEJ przeglądarce (Chromium/Playwright, nie jsdom — ten sam wzorzec co
 * `entity-card-historia-section-test.cjs`), na REALNYCH danych gry (`data/tech.json` i
 * pliki od niego zależne, ZERO mutacji), że karta technologii renderuje sekcje w DOKŁADNIE
 * zaakceptowanej kolejności:
 *
 *   Wymagania (sections[0]) → Charakterystyka (NOWA, sections[1]) → Rys historyczny
 *   (wstawiany przez `renderer.ts::renderEntityCard` na NIETKNIĘTYM, stałym indeksie 2,
 *   zaraz po Charakterystyce) → Budynki → Jednostki → Ulepszenia terenu → Kolejne
 *   technologie (4 sekcje NIESCALONE, ABC Q1 właściciela) → Zmiany ekonomiczne.
 *
 * [1] „Żegluga" (realna technologia z Historia+Budynki+Jednostki+Ulepszenia terenu+
 *     Kolejne technologie WSZYSTKIE niepuste jednocześnie — dowód nietautologiczności:
 *     gdyby jedna z tych sekcji nie renderowała się wcale, test by to złapał) — kolejność
 *     DOM dokładnie jak wyżej.
 * [2] Sekcja „Charakterystyka" niesie Koszt nauki/Epokę/Poziom (dane z `tech.json`, zero
 *     wymyślonej treści) i NIE duplikuje „Dostęp do surowca" z sekcji Zmiany ekonomiczne
 *     (różne pola źródłowe — `Dostęp do surowca.` vs `Odblokowuje surowiec.`).
 * [3] Fixture technologii BEZ pola „Historia" (skonstruowany WYŁĄCZNIE w pamięci testu z
 *     realnego wiersza „Żegluga" z usuniętym polem — zero mutacji `gra/data/**`)
 *     NIE renderuje `.entity-card-historia` (zero regresji „brak węzła gdy brak danych").
 * [4] Zero regresji: kontrakt karty encji (`entity-card-contract-test.cjs`) i test pozycji
 *     historii budynku/jednostki (`entity-card-historia-section-test.cjs`) pozostają zielone
 *     — uruchamiane osobno w tym samym raporcie, nie duplikowane tutaj.
 *
 * Usage (z gra/): node tools/karta-technologia-uklad-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[karta-technologia-uklad-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
// Stuby WSPÓLDZIELONE Z `entity-card-historia-section-test.cjs`/`entity-card-contract-test.cjs`
// — czytane, NIE modyfikowane (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY dotyczy zapisu, nie
// odczytu; wielokrotny odczyt tego samego pustego stuba jest bezpieczny).
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'entity-card-contract-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'entity-card-contract-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.karta-technologia-uklad-entry.ts');
const OUTFILE = path.resolve(__dirname, '.karta-technologia-uklad-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const stubPlugin = {
  name: 'stub-icons',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
  },
};

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[karta-technologia-uklad-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  fs.writeFileSync(
    ENTRY,
    [
      "import { renderEntityCard, buildEntityCardData, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
      "import { technologyIdFromName, resolveTechnologyRow } from '../src/ui/entityCards/registry.ts';",
      "import { technologyAdapter } from '../src/ui/entityCards/technologyAdapter.ts';",
      'window.__renderEntityCard = renderEntityCard;',
      'window.__buildEntityCardData = buildEntityCardData;',
      'window.__ENTITY_CARD_CSS = ENTITY_CARD_CSS;',
      'window.__technologyIdFromName = technologyIdFromName;',
      'window.__resolveTechnologyRow = resolveTechnologyRow;',
      'window.__technologyAdapter = technologyAdapter;',
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
    loader: { '.ts': 'ts' },
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
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = window.__ENTITY_CARD_CSS;
    document.head.appendChild(style);
  });

  // ---------------------------------------------------------------------
  // [1]+[2] "Żegluga" — kolejność sekcji + kontrola nietautologiczności
  //         (wszystkie 4 sekcje odblokowań + historia realnie niepuste w danych) +
  //         zawartość Charakterystyki.
  // ---------------------------------------------------------------------
  const drewno = await page.evaluate(() => {
    const techId = window.__technologyIdFromName('Żegluga');
    const row = window.__resolveTechnologyRow(techId);
    const data = window.__buildEntityCardData('technology', techId, {});
    if (!data || !row) return { found: false, techId };
    const card = window.__renderEntityCard(data);
    document.getElementById('root').appendChild(card);
    const body = card.querySelector('.entity-card-body');
    const orderedKeys = Array.from(body.children).map((child) =>
      child.classList.contains('entity-card-historia') ? '__historia__' : child.getAttribute('data-section-key'));
    const charRows = Array.from(card.querySelectorAll('[data-section-key="characteristics"] .entity-card-row'))
      .map((r) => r.textContent.trim());
    const econRows = Array.from(card.querySelectorAll('[data-section-key="econ"] .entity-card-row'))
      .map((r) => r.textContent.trim());
    card.remove();
    return {
      found: true, techId, orderedKeys, charRows, econRows,
      historiaFieldNonEmpty: typeof row['Historia'] === 'string' && row['Historia'].trim().length > 0,
      buildingsNonEmpty: typeof row['Odblokowuje budynek'] === 'string' && row['Odblokowuje budynek'].trim().length > 0,
      resourceUnlockedNonEmpty: typeof row['Odblokowuje surowiec.'] === 'string' && row['Odblokowuje surowiec.'].trim().length > 0,
    };
  });
  check('[1] "Żegluga": encja znaleziona', drewno.found, drewno);
  check('[1] "Żegluga": pole "Historia" realnie niepuste (dowód nietautologiczności pozycji historii)', drewno.historiaFieldNonEmpty, drewno);
  check('[1] "Żegluga": kolejność DOM Wymagania → Charakterystyka → Rys historyczny → Co możesz teraz zrobić → Budynki → Jednostki → Ulepszenia terenu → Kolejne technologie → Zmiany ekonomiczne',
    JSON.stringify(drewno.orderedKeys) === JSON.stringify(['requirements', 'characteristics', '__historia__', 'actions', 'buildings', 'units', 'improvements', 'next', 'econ']),
    drewno.orderedKeys);
  check('[2] Charakterystyka: wiersz "Koszt nauki" obecny', drewno.charRows.some((t) => t.startsWith('Koszt nauki')), drewno.charRows);
  check('[2] Charakterystyka: wiersz "Epoka" obecny', drewno.charRows.some((t) => t.startsWith('Epoka')), drewno.charRows);
  check('[2] Charakterystyka: wiersz "Poziom" obecny', drewno.charRows.some((t) => t.startsWith('Poziom')), drewno.charRows);
  check('[2] Charakterystyka: brak duplikacji etykiety "Dostęp do surowca" (zajęta przez Zmiany ekonomiczne, inne pole źródłowe)',
    !drewno.charRows.some((t) => t.startsWith('Dostęp do surowca')), drewno.charRows);
  check(`[2] Zmiany ekonomiczne: sekcja niezmieniona, etykieta "Dostęp do surowca" obecna WTEDY I TYLKO WTEDY, gdy pole "Odblokowuje surowiec." jest niepuste (dziś dla "Żegluga": ${drewno.resourceUnlockedNonEmpty})`,
    drewno.econRows.some((t) => t.startsWith('Dostęp do surowca')) === drewno.resourceUnlockedNonEmpty, drewno.econRows);

  // ---------------------------------------------------------------------
  // [3] Fixture bez "Historia" — skonstruowany z realnego wiersza "Żegluga" z
  //     usuniętym polem, WYŁĄCZNIE w pamięci testu (zero mutacji gra/data/**).
  // ---------------------------------------------------------------------
  await page.evaluate(() => { document.getElementById('root').innerHTML = ''; });
  const noHistoria = await page.evaluate(() => {
    const techId = window.__technologyIdFromName('Żegluga');
    const row = window.__resolveTechnologyRow(techId);
    const { Historia: _drop, ...rowWithoutHistoria } = row;
    const data = window.__technologyAdapter(rowWithoutHistoria);
    const card = window.__renderEntityCard(data);
    document.getElementById('root').appendChild(card);
    const body = card.querySelector('.entity-card-body');
    const orderedKeys = Array.from(body.children).map((child) =>
      child.classList.contains('entity-card-historia') ? '__historia__' : child.getAttribute('data-section-key'));
    const historiaExists = card.querySelector('.entity-card-historia') !== null;
    card.remove();
    return { historiaExists, orderedKeys };
  });
  check('[3] fixture bez pola "Historia": sekcja ".entity-card-historia" NIEOBECNA (zero pustego bloku)', noHistoria.historiaExists === false, noHistoria);
  check('[3] fixture bez pola "Historia": Wymagania i Charakterystyka nadal na indeksach 0/1 (kolejność reszty niezmieniona)',
    noHistoria.orderedKeys[0] === 'requirements' && noHistoria.orderedKeys[1] === 'characteristics', noHistoria.orderedKeys);

  check('brak błędów konsoli/pageerror podczas całego scenariusza', consoleErrors.length === 0, consoleErrors);

  await browser.close();
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[karta-technologia-uklad-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
