'use strict';
/**
 * improvement-adapter-resource-note-test.cjs
 *
 * TEMAT: P-CIVPEDIA-KARTY-NOTATKI-DEWELOPERSKIE-Q1.
 *
 * Weryfikuje że `entityCards/improvementAdapter.ts` PRZESTAŁ wstrzykiwać wewnętrzny
 * dziennik balansu (`surowiecOdblokowany_uwaga` z `terrain-improvements.json`) do
 * wiersza "Odblokowuje surowiec" karty ulepszenia terenu renderowanej graczowi.
 *
 * Przed naprawą wiersz "Odblokowuje surowiec" dla "tartak" zawierał (przez
 * `wartość (uwaga)`) fragmenty typu "korekta balansu Maciej 2026-...", "PYTANIE-84-B9",
 * "R-EKONOMIA-SUROWCE-SKALA-5X-Q1" wprost w karcie gracza. Po naprawie wiersz niesie
 * WYŁĄCZNIE nazwę surowca ("drewno"); osobny, już czysty wiersz "Produkcja surowca"
 * (pole `surowiec_ilosc_tura`) zostaje nietknięty.
 *
 * Testowane bezpośrednio na 9 kluczach ze zidentyfikowanym pełnym wzorcem "dziennika
 * balansu" (stadnina, glinianka, kamieniolom, tartak, warzelnia_soli, kopalnia_miedzi,
 * kopalnia_zelaza, kopalnia_cyny, kopalnia_zlota) + kontrola negatywna na "pastwisko"
 * (krótka, właściwie opisowa notatka — pole samo ma zostać w danych, adapter i tak go
 * nie ma renderować do wiersza "Odblokowuje surowiec").
 *
 * Usage (z gra/): node tools/improvement-adapter-resource-note-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_STUB = path.resolve(STUB_DIR, 'improvement-adapter-resource-note-brandAssets-stub.ts');
const OWL_STUB = path.resolve(STUB_DIR, 'improvement-adapter-resource-note-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.improvement-adapter-resource-note-entry.ts');
const BUNDLE = path.resolve(__dirname, '.improvement-adapter-resource-note-bundle.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const DEV_JOURNAL_PATTERNS = [
  /korekta balansu/i,
  /\bMaciej\s+\d{4}-\d{2}-\d{2}/,
  /\bR-[A-ZĄĆĘŁŃÓŚŹŻ-]+-Q\d/,
  /\bP-[A-ZĄĆĘŁŃÓŚŹŻ-]+-Q\d/,
  /\bPYTANIE-?\s?\d+/i,
];

// R-WEB-UI-RESOURCE-ICONS-ENTITYCARDS-Q1: surowce wiersza są DANYMI (`row.resources`), renderer rysuje ikonę;
// nazwa dla asercji = nazwa wyświetlana id (tę samą pokazuje title/aria-label chipa).
let NAME_OF = (id) => id;
function rowName(row) {
  const fromRes = (row.resources || []).map((r) => NAME_OF(r.id)).join(', ');
  return [row.value, fromRes].filter(Boolean).join(', ');
}
function containsDevJournalText(s) {
  return DEV_JOURNAL_PATTERNS.some((re) => re.test(s));
}

async function main() {
  fs.writeFileSync(
    ENTRY,
    "export { improvementAdapter } from '../src/ui/entityCards/improvementAdapter.ts';\n" +
      "export { nazwaWyswietlana } from '../src/game/text-names.ts';\n",
    'utf8',
  );

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [{
      name: 'stub-icons',
      setup(build) {
        build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
        build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: OWL_STUB }));
      },
    }],
    logLevel: 'silent',
  });

  delete require.cache[BUNDLE];
  const { improvementAdapter, nazwaWyswietlana } = require(BUNDLE);
  NAME_OF = nazwaWyswietlana;

  // Oczekiwana nazwa wyświetlana wiersza "Odblokowuje surowiec" (surowy id z danych → nazwa z resources.json).
  // Wpisane ręcznie, nie wyliczane resolverem — test ma niezależnie potwierdzać wynik dla gracza.
  const EXPECTED_SUROWIEC_NAZWA = {
    stadnina: 'Koń', glinianka: 'Glina', kamieniolom: 'Kamień', tartak: 'Drewno',
    warzelnia_soli: 'Sól', kopalnia_miedzi: 'Ruda', kopalnia_zelaza: 'Ruda żelaza',
    kopalnia_cyny: 'Ruda cyny', kopalnia_zlota: 'Złoto',
    bydlo: 'Trzoda', owce: 'Owce', lama: 'Lama',
  };

  const terrainImprovements = JSON.parse(
    fs.readFileSync(path.join(GRA, 'data', 'terrain-improvements.json'), 'utf8'),
  );

  function resourceRowFor(key) {
    const raw = terrainImprovements[key];
    check(`fixture: terrain-improvements.json ma klucz "${key}"`, !!raw, key);
    if (!raw) return null;
    check(`fixture: "${key}" ma niepuste surowiecOdblokowany_uwaga (test faktycznie ćwiczy to pole)`,
      typeof raw.surowiecOdblokowany_uwaga === 'string' && raw.surowiecOdblokowany_uwaga.length > 0, key);
    const card = improvementAdapter(raw, {});
    const resourcesSection = card.sections.find((s) => s.key === 'resources');
    check(`"${key}": karta ma sekcję "resources"`, !!resourcesSection, key);
    if (!resourcesSection) return null;
    const row = resourcesSection.rows.find((r) => r.label === 'Odblokowuje surowiec');
    check(`"${key}": sekcja "resources" ma wiersz "Odblokowuje surowiec"`, !!row, key);
    return row;
  }

  // --- 9 kluczy z pełnym wzorcem "dziennika balansu" (recon P-CIVPEDIA-KARTY-NOTATKI-DEWELOPERSKIE-Q1) ---
  const DEV_JOURNAL_KEYS = [
    'stadnina', 'glinianka', 'kamieniolom', 'tartak', 'warzelnia_soli',
    'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'kopalnia_zlota',
  ];

  for (const key of DEV_JOURNAL_KEYS) {
    const row = resourceRowFor(key);
    if (!row) continue;
    check(`"${key}": wiersz "Odblokowuje surowiec" NIE zawiera wewnętrznej notatki dziennika balansu`,
      !containsDevJournalText(rowName(row)), rowName(row));
    check(`"${key}": wiersz "Odblokowuje surowiec" = dokładnie nazwa surowca (bez nawiasu z uwagą)`,
      rowName(row) === EXPECTED_SUROWIEC_NAZWA[key] && !rowName(row).includes('('),
      rowName(row));
  }

  // --- kontrola specyficzna: "tartak" (fixture cytowany w zgłoszeniu właściciela) ---
  const tartakRaw = terrainImprovements.tartak;
  const tartakCard = improvementAdapter(tartakRaw, {});
  const tartakResources = tartakCard.sections.find((s) => s.key === 'resources');
  const tartakResourceRow = tartakResources && tartakResources.rows.find((r) => r.label === 'Odblokowuje surowiec');
  check('"tartak": "Odblokowuje surowiec" === "Drewno" (bez notatki)',
    !!tartakResourceRow && rowName(tartakResourceRow) === 'Drewno'
      && tartakResourceRow.resources.length === 1 && tartakResourceRow.resources[0].id === 'drewno',
    tartakResourceRow && rowName(tartakResourceRow));
  const tartakProdRow = tartakResources && tartakResources.rows.find((r) => r.label === 'Produkcja surowca');
  // R-WEB-SAWMILL-QUARRY-PRODUCTION-50-Q1 (2026-10-31): baza 50 (przywrócona z regresu 200)
  // R-WEB-UI-RESOURCE-ICONS-ENTITYCARDS-Q1: „50 / turę" = chip {drewno, 50} + sufiks „/ turę" (ikona zamiast nazwy).
  check('"tartak": "Produkcja surowca" nietknięta — 50 drewna / turę (baza epoki 1; dane, nie tekst)',
    !!tartakProdRow && tartakProdRow.value === '' && tartakProdRow.resourcesSuffix === '/ turę'
      && tartakProdRow.resources.length === 1 && tartakProdRow.resources[0].id === 'drewno'
      && String(tartakProdRow.resources[0].amount) === '50',
    tartakProdRow);

  const farmCard = improvementAdapter(terrainImprovements.farma, {});
  const farmRequirements = farmCard.sections.find((s) => s.key === 'requirements');
  const farmCostRow = farmRequirements && farmRequirements.rows.find((r) => r.label === 'Koszt (Praca)');
  check('"farma": karta pokazuje koszt budowy po FALA2 i stawce epoki Kamienia (20 P)',
    !!farmCostRow && farmCostRow.value === '20 P', farmCostRow && farmCostRow.value);

  // --- kontrola negatywna: pole JSON samo w sobie NIE zostało ruszone (dane nietknięte) ---
  check('dane: terrain-improvements.json["tartak"].surowiecOdblokowany_uwaga wciąż w pliku (dane NIETKNIĘTE)',
    typeof tartakRaw.surowiecOdblokowany_uwaga === 'string' && tartakRaw.surowiecOdblokowany_uwaga.includes('korekta balansu'),
    tartakRaw.surowiecOdblokowany_uwaga);

  // --- kontrola negatywna: krótkie, opisowe notatki (5 kluczy NIE do ruszania wg reconu) ---
  // Adapter i tak nigdy nie ma renderować `surowiecOdblokowany_uwaga` (usunięty segment,
  // nie warunek), więc te klucze też muszą wyjść czysto mimo że ich notatka nie jest
  // "dziennikiem balansu" w sensie wzorca powyżej.
  const SHORT_NOTE_KEYS = ['bydlo', 'owce', 'lama'];
  for (const key of SHORT_NOTE_KEYS) {
    if (!terrainImprovements[key]) continue;
    const row = resourceRowFor(key);
    if (!row) continue;
    check(`"${key}" (krótka notatka, nie dziennik balansu): wiersz i tak = sama nazwa surowca (bez nawiasu)`,
      !rowName(row).includes('(') && rowName(row) === EXPECTED_SUROWIEC_NAZWA[key],
      rowName(row));
  }

  // --- regresja slugu surowca: „Złoto” i „Cegła” (ł nie rozkłada się przez NFD) muszą mieć nazwę z tabeli ---
  check('nazwaWyswietlana("zloto") === "Złoto" (slug z ł, nie „Zloto”)',
    nazwaWyswietlana('zloto') === 'Złoto', nazwaWyswietlana('zloto'));
  check('nazwaWyswietlana("cegla") === "Cegła" (slug z ł, nie „Cegla”)',
    nazwaWyswietlana('cegla') === 'Cegła', nazwaWyswietlana('cegla'));

  // --- "oboz_lowiecki"/"lodzie_rybackie": krótkie notatki, ale BEZ pola surowiecOdblokowany
  // (dzika zwierzyna/ryby nie są osobnym surowcem v0.1) — adapter POPRAWNIE w ogóle nie
  // renderuje wiersza "Odblokowuje surowiec" dla tych kluczy (hasValue(undefined) === false),
  // więc test tu tylko potwierdza brak wiersza (nie regres tej naprawy — stan sprzed i po jest
  // identyczny, bo `surowiecOdblokowany_uwaga` nigdy nie miało do czego się doczepić).
  for (const key of ['oboz_lowiecki', 'lodzie_rybackie']) {
    if (!terrainImprovements[key]) continue;
    const raw = terrainImprovements[key];
    const card = improvementAdapter(raw, {});
    const resourcesSection = card.sections.find((s) => s.key === 'resources');
    const row = resourcesSection && resourcesSection.rows.find((r) => r.label === 'Odblokowuje surowiec');
    check(`"${key}": brak surowiecOdblokowany w danych → wiersz "Odblokowuje surowiec" poprawnie NIEOBECNY`,
      !row, row);
  }

  fs.rmSync(ENTRY, { force: true });
  fs.rmSync(BUNDLE, { force: true });

  console.log(`\n[improvement-adapter-resource-note-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[improvement-adapter-resource-note-test] błąd:', err);
  process.exit(1);
});
