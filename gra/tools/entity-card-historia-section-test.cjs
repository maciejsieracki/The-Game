'use strict';
/**
 * entity-card-historia-section-test.cjs
 *
 * TEMAT: R-KARTY-HISTORIA-INFRA-Q1 (1/17 — infrastruktura rysu historycznego +
 * usunięcie wycieku tekstu deweloperskiego z kart, patrz 00-dispatch.md).
 *
 * Weryfikuje w PRAWDZIWEJ przeglądarce (Chromium/Playwright, nie jsdom — wzorem
 * `entity-card-cross-links-nested-overlay-test.cjs`/
 * `building-detail-card-hover-layout-real-render-test.cjs`), na REALNYCH danych
 * gry (`data/terrain-improvements.json`/`data/tech.json` jak dziś w repo, ZERO
 * mutacji plików danych):
 *
 * [1] Karta „Tarasy uprawne" (`improvement`/`tarasy`): wiersz „Cywilizacje" pokazuje
 *     WYŁĄCZNIE „chinczycy, inkowie" (bez dev-adnotacji `cywilizacje_uwaga` w
 *     nawiasie), wiersz „Technologia" pokazuje WYŁĄCZNIE „Rolnictwo" (bez
 *     `tech_uwaga`), wiersz „Uwagi" NIE ISTNIEJE w DOM (kryteria końca 1/dispatchu).
 * [2] Karta technologii „Brązownictwo" (ma niepuste `Uwagi` w `tech.json`) NIE
 *     pokazuje wiersza „Uwagi" (kryterium 2).
 * [3] Fixture z ustawionym `historicalNote` (WYŁĄCZNIE w danych testu, NIE w
 *     `gra/data/**`) renderuje sekcję `.entity-card-historia` z dokładnie tym
 *     tekstem, stylistycznie odróżnioną (kursywa) od sekcji mechanicznych
 *     (kryterium 3).
 * [4] Realne encje z dzisiejszych danych (`historia`/`Historia` jeszcze nie
 *     ustawione nigdzie — batche treści dopiszą je osobno) NIE pokazują sekcji
 *     `.entity-card-historia` w DOM w ŻADNYM z 4 kinds (kryterium 4) — zero
 *     pustego/białego bloku.
 * [5] Każdy z 4 adapterów czyta WŁAŚCIWE dla swojego pliku pole nazwy —
 *     `buildingAdapter`/`improvementAdapter` ← `historia` (lowercase),
 *     `technologyAdapter`/`unitAdapter` ← `Historia` (capitalizowane) — bez
 *     mutacji `gra/data/**`, przez wstrzyknięcie pola bezpośrednio do surowego
 *     wiersza PRZED wywołaniem adaptera (adaptery są czystymi funkcjami
 *     `(row, ctx) => EntityCardData`, patrz `types.ts::EntityCardAdapter`) —
 *     oraz kontrolnie, że BŁĘDNA wielkość liter (`Historia` tam gdzie adapter
 *     oczekuje `historia`, i odwrotnie) NIE aktywuje sekcji.
 *
 * Usage (z gra/): node tools/entity-card-historia-section-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[entity-card-historia-section-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'entity-card-contract-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'entity-card-contract-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.entity-card-historia-entry.ts');
const OUTFILE = path.resolve(__dirname, '.entity-card-historia-bundle.cjs');
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
    console.log('[entity-card-historia-section-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  fs.writeFileSync(
    ENTRY,
    [
      "import { renderEntityCard, buildEntityCardData, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
      "import { technologyIdFromName, unitToSlug, resolveBuildingRow, resolveTechnologyRow, resolveUnitRow, resolveImprovementRow } from '../src/ui/entityCards/registry.ts';",
      "import { buildingAdapter } from '../src/ui/entityCards/buildingAdapter.ts';",
      "import { technologyAdapter } from '../src/ui/entityCards/technologyAdapter.ts';",
      "import { unitAdapter } from '../src/ui/entityCards/unitAdapter.ts';",
      "import { improvementAdapter } from '../src/ui/entityCards/improvementAdapter.ts';",
      'window.__renderEntityCard = renderEntityCard;',
      'window.__buildEntityCardData = buildEntityCardData;',
      'window.__ENTITY_CARD_CSS = ENTITY_CARD_CSS;',
      'window.__technologyIdFromName = technologyIdFromName;',
      'window.__unitToSlug = unitToSlug;',
      'window.__resolveBuildingRow = resolveBuildingRow;',
      'window.__resolveTechnologyRow = resolveTechnologyRow;',
      'window.__resolveUnitRow = resolveUnitRow;',
      'window.__resolveImprovementRow = resolveImprovementRow;',
      'window.__buildingAdapter = buildingAdapter;',
      'window.__technologyAdapter = technologyAdapter;',
      'window.__unitAdapter = unitAdapter;',
      'window.__improvementAdapter = improvementAdapter;',
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
  // [1] Karta „Tarasy uprawne" — regres dokładnego zgłoszenia właściciela.
  // ---------------------------------------------------------------------
  const tarasy = await page.evaluate(() => {
    const data = window.__buildEntityCardData('improvement', 'tarasy', {});
    if (!data) return { found: false };
    const card = window.__renderEntityCard(data);
    document.getElementById('root').appendChild(card);
    const rows = Array.from(card.querySelectorAll('.entity-card-row')).map((r) => r.textContent.trim());
    const civRow = rows.find((t) => t.startsWith('Cywilizacje')) || null;
    const techRow = rows.find((t) => t.startsWith('Technologia')) || null;
    return {
      found: true,
      civRow,
      techRow,
      uwagiRowExists: rows.some((t) => t.startsWith('Uwagi')),
      historiaExists: card.querySelector('.entity-card-historia') !== null,
    };
  });
  check('Tarasy uprawne: encja znaleziona', tarasy.found, tarasy);
  check('Tarasy uprawne: wiersz "Cywilizacje" === "Cywilizacjechinczycy, inkowie" (BEZ dev-adnotacji w nawiasie)',
    tarasy.civRow === 'Cywilizacjechinczycy, inkowie', tarasy.civRow);
  check('Tarasy uprawne: wiersz "Technologia" === "TechnologiaRolnictwo" (BEZ tech_uwaga w nawiasie)',
    tarasy.techRow === 'TechnologiaRolnictwo', tarasy.techRow);
  check('Tarasy uprawne: wiersz "Uwagi" NIE ISTNIEJE na karcie', tarasy.uwagiRowExists === false, tarasy);
  check('Tarasy uprawne: sekcja "Rys historyczny" nie istnieje (pole "historia" jeszcze puste w danych)',
    tarasy.historiaExists === false, tarasy);

  // ---------------------------------------------------------------------
  // [2] Karta technologii "Brązownictwo" — ma niepuste Uwagi w tech.json (regres
  //     przykładu z P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1) — wiersz "Uwagi" NIE ISTNIEJE.
  // ---------------------------------------------------------------------
  await page.evaluate(() => { document.getElementById('root').innerHTML = ''; });
  const brazownictwoUwagiRaw = fs.readFileSync(path.join(GRA, 'data', 'tech.json'), 'utf8');
  const brazownictwoHasUwagi = /"Technologia"\s*:\s*"Brązownictwo"[\s\S]{0,1000}?"Uwagi"\s*:\s*"[^"]+"/.test(brazownictwoUwagiRaw);
  check('kontrola przytomności: Brązownictwo w tech.json realnie ma niepuste pole "Uwagi"', brazownictwoHasUwagi);
  const brazownictwo = await page.evaluate(() => {
    const techId = window.__technologyIdFromName('Brązownictwo');
    const data = window.__buildEntityCardData('technology', techId, {});
    if (!data) return { found: false, techId };
    const card = window.__renderEntityCard(data);
    document.getElementById('root').appendChild(card);
    const rowTexts = Array.from(card.querySelectorAll('.entity-card-row,.entity-card-row-action,.entity-card-pill')).map((r) => r.textContent.trim());
    return { found: true, techId, uwagiRowExists: rowTexts.some((t) => t.startsWith('Uwagi')), rowCount: rowTexts.length };
  });
  check('Brązownictwo: encja znaleziona', brazownictwo.found, brazownictwo);
  check('Brązownictwo: karta ma >0 wierszy (sanity, nie karta pusta)', brazownictwo.rowCount > 0, brazownictwo);
  check('Brązownictwo: wiersz "Uwagi" NIE ISTNIEJE na karcie technologii', brazownictwo.uwagiRowExists === false, brazownictwo);

  // ---------------------------------------------------------------------
  // [3] Rys historyczny — fixture (WYŁĄCZNIE w teście, zero mutacji gra/data/**).
  // ---------------------------------------------------------------------
  await page.evaluate(() => { document.getElementById('root').innerHTML = ''; });
  const fixtureText = 'To jest testowy rys historyczny — WYŁĄCZNIE fixture testu, nie dane gry.';
  const fixture = await page.evaluate((fixtureText) => {
    const withNote = {
      kind: 'unit', id: 'fixture-historia-with', title: 'Fixture Z Historią',
      medallion: { kind: 'icon', svg: '<svg></svg>' },
      sections: [{ key: 'x', title: 'Sekcja', rows: [{ label: 'A', value: '1' }] }],
      historicalNote: fixtureText,
    };
    const withoutNote = {
      kind: 'unit', id: 'fixture-historia-without', title: 'Fixture Bez Historii',
      medallion: { kind: 'icon', svg: '<svg></svg>' },
      sections: [{ key: 'x', title: 'Sekcja', rows: [{ label: 'A', value: '1' }] }],
    };
    const cardWith = window.__renderEntityCard(withNote);
    const cardWithout = window.__renderEntityCard(withoutNote);
    document.getElementById('root').appendChild(cardWith);
    document.getElementById('root').appendChild(cardWithout);
    const historiaEl = cardWith.querySelector('.entity-card-historia');
    const textEl = cardWith.querySelector('.entity-card-historia-text');
    return {
      withHasSection: historiaEl !== null,
      withText: textEl ? textEl.textContent : null,
      withFontStyleItalic: textEl ? getComputedStyle(textEl).fontStyle === 'italic' : false,
      // Rys historyczny musi być POD wszystkimi sekcjami mechanicznymi — sprawdzone
      // pozycyjnie: ostatni węzeł-dziecko klasy .entity-card-section poprzedza w DOM
      // .entity-card-historia (nie odwrotnie).
      historiaAfterSections: (() => {
        const sections = Array.from(cardWith.querySelectorAll('.entity-card-section'));
        const lastSection = sections[sections.length - 1];
        if (!lastSection || !historiaEl) return false;
        return !!(lastSection.compareDocumentPosition(historiaEl) & Node.DOCUMENT_POSITION_FOLLOWING);
      })(),
      withoutHasSection: cardWithout.querySelector('.entity-card-historia') !== null,
    };
  }, fixtureText);
  check('[3] fixture z historicalNote: sekcja ".entity-card-historia" obecna', fixture.withHasSection);
  check('[3] fixture: tekst sekcji === dokładnie tekst fixture (bez okrojenia)', fixture.withText === fixtureText, fixture.withText);
  check('[3] fixture: tekst renderuje się kursywą (font-style:italic — stylistycznie odróżniona od sekcji mechanicznych)', fixture.withFontStyleItalic);
  check('[3] fixture: sekcja "Rys historyczny" jest POD (po) wszystkich sekcjami mechanicznymi w DOM', fixture.historiaAfterSections);
  check('[4] fixture BEZ historicalNote: sekcja ".entity-card-historia" NIEOBECNA (zero pustego bloku)', fixture.withoutHasSection === false);

  // ---------------------------------------------------------------------
  // [4] Realne karty (4 kinds) na dzisiejszych danych — zero sekcji ".entity-card-historia"
  //     (pole źródłowe jeszcze puste we WSZYSTKICH encjach, batche treści to zmienią osobno).
  // ---------------------------------------------------------------------
  await page.evaluate(() => { document.getElementById('root').innerHTML = ''; });
  const realCards = await page.evaluate(() => {
    const specs = [
      ['unit', window.__unitToSlug('Wojownik')],
      ['building', 'stolarnia'],
      ['technology', window.__technologyIdFromName('Łowiectwo')],
      ['improvement', 'farma'],
    ];
    return specs.map(([kind, id]) => {
      const data = window.__buildEntityCardData(kind, id, {});
      if (!data) return { kind, id, found: false };
      const card = window.__renderEntityCard(data);
      document.getElementById('root').appendChild(card);
      return { kind, id, found: true, historiaExists: card.querySelector('.entity-card-historia') !== null };
    });
  });
  for (const r of realCards) {
    check(`[4] realna karta ${r.kind}/${r.id}: encja znaleziona`, r.found, r);
    if (r.found) {
      check(`[4] realna karta ${r.kind}/${r.id}: BRAK sekcji "Rys historyczny" (pole źródłowe dziś puste)`, r.historiaExists === false, r);
    }
  }

  // ---------------------------------------------------------------------
  // [5] Konwencja nazw pól per plik danych — wstrzyknięcie WYŁĄCZNIE w pamięci testu
  //     (zero mutacji gra/data/**), bezpośrednio w surowy wiersz przed adapterem.
  // ---------------------------------------------------------------------
  const fieldConventionResult = await page.evaluate(() => {
    const out = {};

    // buildingAdapter <- buildings.json pole "historia" (lowercase).
    const buildingRow = window.__resolveBuildingRow('stolarnia');
    out.buildingLower = window.__buildingAdapter({ ...buildingRow, historia: 'Historia budynku (test)' }, {}).historicalNote;
    out.buildingWrongCase = window.__buildingAdapter({ ...buildingRow, Historia: 'Zła wielkość liter' }, {}).historicalNote;

    // technologyAdapter <- tech.json pole "Historia" (capitalizowane).
    const techRow = window.__resolveTechnologyRow(window.__technologyIdFromName('Łowiectwo'));
    out.techUpper = window.__technologyAdapter({ ...techRow, Historia: 'Historia technologii (test)' }, {}).historicalNote;
    out.techWrongCase = window.__technologyAdapter({ ...techRow, historia: 'Zła wielkość liter' }, {}).historicalNote;

    // unitAdapter <- units.json pole "Historia" (capitalizowane).
    const unitRow = window.__resolveUnitRow(window.__unitToSlug('Wojownik'));
    out.unitUpper = window.__unitAdapter({ ...unitRow, Historia: 'Historia jednostki (test)' }, {}).historicalNote;
    out.unitWrongCase = window.__unitAdapter({ ...unitRow, historia: 'Zła wielkość liter' }, {}).historicalNote;

    // improvementAdapter <- terrain-improvements.json pole "historia" (lowercase).
    const impRow = window.__resolveImprovementRow('farma');
    out.improvementLower = window.__improvementAdapter({ ...impRow, historia: 'Historia ulepszenia (test)' }, {}).historicalNote;
    out.improvementWrongCase = window.__improvementAdapter({ ...impRow, Historia: 'Zła wielkość liter' }, {}).historicalNote;

    return out;
  });
  check('[5] buildingAdapter czyta "historia" (lowercase, buildings.json)', fieldConventionResult.buildingLower === 'Historia budynku (test)', fieldConventionResult.buildingLower);
  check('[5] buildingAdapter IGNORUJE "Historia" (zła wielkość liter)', fieldConventionResult.buildingWrongCase === undefined, fieldConventionResult.buildingWrongCase);
  check('[5] technologyAdapter czyta "Historia" (capitalizowane, tech.json)', fieldConventionResult.techUpper === 'Historia technologii (test)', fieldConventionResult.techUpper);
  check('[5] technologyAdapter IGNORUJE "historia" (zła wielkość liter)', fieldConventionResult.techWrongCase === undefined, fieldConventionResult.techWrongCase);
  check('[5] unitAdapter czyta "Historia" (capitalizowane, units.json)', fieldConventionResult.unitUpper === 'Historia jednostki (test)', fieldConventionResult.unitUpper);
  check('[5] unitAdapter IGNORUJE "historia" (zła wielkość liter)', fieldConventionResult.unitWrongCase === undefined, fieldConventionResult.unitWrongCase);
  check('[5] improvementAdapter czyta "historia" (lowercase, terrain-improvements.json)', fieldConventionResult.improvementLower === 'Historia ulepszenia (test)', fieldConventionResult.improvementLower);
  check('[5] improvementAdapter IGNORUJE "Historia" (zła wielkość liter)', fieldConventionResult.improvementWrongCase === undefined, fieldConventionResult.improvementWrongCase);

  check('brak błędów konsoli/pageerror podczas całego scenariusza', consoleErrors.length === 0, consoleErrors);

  await browser.close();
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }

  console.log('');
  console.log(`[entity-card-historia-section-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
