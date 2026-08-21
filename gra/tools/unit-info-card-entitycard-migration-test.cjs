'use strict';
/**
 * unit-info-card-entitycard-migration-test.cjs
 *
 * TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, T4 MIGRACJA-KARTA-JEDNOSTKI-MAPA.
 *
 * Weryfikuje MIGRACJĘ `unitInfoCard.ts::buildUnitInfoCard`/`showUnitInfoCardDialog` na
 * `entityCards/unitAdapter.ts` + `entityCards/renderer.ts`, na REALNYCH danych z
 * `gra/data/{units,counters}.json` (nie fixture'ach) — bunduje PRAWDZIWY
 * `src/ui/unitInfoCard.ts` przez esbuild (node/cjs) + jsdom, ten sam wzorzec co
 * `entity-card-contract-test.cjs` (T1).
 *
 * UWAGA (świadome ograniczenie, zgłoszone w raporcie T4): ten test NIE renderuje
 * prawdziwego WebGL — środowisko headless/node tutaj nie ma `gl`/`canvas`, więc
 * `mountUnitMiniPreview` jest STUBOWANY (`.stubs/unit-info-card-migration-...-stub.ts`),
 * tak jak istniejące `unit-info-card-contract-test.cjs` weryfikuje łańcuch 3D
 * WYŁĄCZNIE string-matchem na źródle (ten sam, PRE-ISTNIEJĄCY problem opisany w
 * `19-dispatch-T4-migracja-jednostka-mapa.md` §Ograniczenia, odziedziczony z T3 —
 * `P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1`). Ten test idzie DALEJ niż
 * string-match: weryfikuje na PRAWDZIWYM DOM że `mount()` (tu: stub zamiast
 * prawdziwego Three.js) jest wywoływane PO osadzeniu medalionu w nagłówku karty
 * (`container.parentElement !== null` w momencie wywołania) — czyli dokładnie
 * kolejność krytyczną z dispatch. Prawdziwy render WebGL wymagałby `headless-gl`/
 * `node-canvas` (brak w `node_modules` tego repo) albo realnego przeglądarkowego
 * uruchomienia gry (`run` + klik na jednostkę na mapie) — opisane w raporcie jako
 * alternatywna, nie w pełni wykonana tu weryfikacja.
 *
 * Usage (z gra/): node tools/unit-info-card-entitycard-migration-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[unit-info-card-entitycard-migration-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'entity-card-contract-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'entity-card-contract-scienceOwlIcon-stub.ts');
const MINI_PREVIEW_STUB = path.resolve(STUB_DIR, 'unit-info-card-migration-unitMiniPreview-stub.ts');
const ENTRY = path.resolve(__dirname, '.unit-info-card-migration-entry.ts');
const BUNDLE = path.resolve(__dirname, '.unit-info-card-migration-bundle.cjs');

const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
const counters = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'counters.json'), 'utf8'));

const stubIconsAndPreviewPlugin = {
  name: 'stub-icons-and-preview',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
    // Redirect WYŁĄCZNIE importu unitMiniPreview używanego przez `unitInfoCard.ts` —
    // patrz nagłówek stub-a: nie testujemy tu prawdziwego WebGL.
    build.onResolve({ filter: /\/unitMiniPreview$/ }, () => ({ path: MINI_PREVIEW_STUB }));
  },
};

fs.writeFileSync(
  ENTRY,
  [
    "export { buildUnitInfoCard, showUnitInfoCardDialog, ensureUnitInfoCardStyles } from '../src/ui/unitInfoCard.ts';",
    "export { mountCalls } from './.stubs/unit-info-card-migration-unitMiniPreview-stub.ts';",
    '',
  ].join('\n'),
  'utf8',
);

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail ? ' — ' + detail : '')); }
}

async function main() {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [stubIconsAndPreviewPlugin],
    logLevel: 'silent',
  });

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Node = dom.window.Node;
  global.MouseEvent = dom.window.MouseEvent;

  const { buildUnitInfoCard, showUnitInfoCardDialog, mountCalls } = require(BUNDLE);

  const fakeGameData = { counters };

  // ---------------------------------------------------------------------
  // Wojownik — jednostka bez specjalnych pól brzegowych, parytet treści podstawowej.
  // ---------------------------------------------------------------------
  const wojownik = units.find((u) => u.Jednostka === 'Wojownik');
  check('fixture: Wojownik istnieje w units.json', !!wojownik);

  mountCalls.length = 0;
  const statusLine = 'TEST-STATUS-LINE-XYZ';
  const card1 = buildUnitInfoCard(wojownik, fakeGameData, {
    ownerColor: 0x445566,
    statusLines: [statusLine],
    onClose: () => {},
  });

  check('buildUnitInfoCard: zwraca element karty', card1 instanceof dom.window.HTMLElement);
  check('buildUnitInfoCard: ścieżka T4 — klasa entity-card', card1.classList.contains('entity-card'));
  check('buildUnitInfoCard: ścieżka T4 — klasa entity-card-unit', card1.classList.contains('entity-card-unit'));
  check('buildUnitInfoCard: data-entity-kind === "unit"', card1.getAttribute('data-entity-kind') === 'unit');
  check('buildUnitInfoCard: dataset.unitName zachowany (parytet z dawną kartą)',
    card1.dataset.unitName === 'Wojownik', card1.dataset.unitName);
  check('buildUnitInfoCard: dataset.unit3dHook zachowany (parytet, string-match w innych testach)',
    card1.dataset.unit3dHook === 'buildUnitModel', card1.dataset.unit3dHook);
  const h2 = card1.querySelector('h2');
  check('buildUnitInfoCard: <h2> z tytułem "Wojownik"', h2 && h2.textContent === 'Wojownik', h2 && h2.textContent);

  // --- KRYTYCZNE — kolejność montowania 3D (patrz dispatch §„mechanizm 3D") ------------
  check('mount 3D: wywołany dokładnie raz', mountCalls.length === 1, String(mountCalls.length));
  if (mountCalls.length === 1) {
    check('mount 3D: medalion JUŻ osadzony w nagłówku w momencie wywołania mount() (hadParent=true)',
      mountCalls[0].hadParent === true);
    check('mount 3D: wywołany dla właściwej jednostki (Wojownik)', mountCalls[0].unitName === 'Wojownik');
  }
  const medallion = card1.querySelector('.entity-card-medallion');
  check('mount 3D: element medalionu obecny w karcie', medallion !== null);
  check('mount 3D: efekt uboczny mount() widoczny na ŻYWYM elemencie zwróconej karty (nie kopii)',
    medallion !== null && medallion.textContent === 'STUB-3D-PREVIEW');
  check('mount 3D: klasa stub-mounted obecna (potwierdza że mount dostał TEN sam el. co w DOM)',
    medallion !== null && medallion.classList.contains('stub-mounted'));

  // --- Statusy — options.statusLines dopełnia badge z adaptera -------------------------
  check('statusLines: tekst z options widoczny w karcie',
    card1.textContent.includes(statusLine));
  check('statusLines: bazowy status z danych (wymaga technologii/brak wymogu) też obecny',
    card1.textContent.includes('wymaga technologii z danych') || card1.textContent.includes('brak wymogu'));

  // --- Przycisk zamknięcia — dopisany po renderEntityCard (renderer.ts go nie rysuje) --
  const closeBtn = card1.querySelector('.unit-info-card-close');
  check('onClose: przycisk zamknięcia dopisany do nagłówka', closeBtn !== null);

  // ---------------------------------------------------------------------
  // Parytet „Kontry" — jednostka z realnymi counterami w counters.json.
  // ---------------------------------------------------------------------
  const counterTypes = new Set(counters.map((c) => String(c['Typ atakujący'] || '').toLowerCase()));
  const unitWithCounters = units.find((u) => counterTypes.has(String(u.Typ || '').toLowerCase()));
  check('fixture: istnieje jednostka z typem obecnym w counters.json', !!unitWithCounters,
    unitWithCounters && unitWithCounters.Jednostka);

  if (unitWithCounters) {
    const expectedCounters = counters
      .filter((row) => String(row['Typ atakujący'] || '').toLowerCase() === String(unitWithCounters.Typ || '').toLowerCase())
      .map((row) => {
        const target = String(row['Cel (typ)'] || '').trim();
        const bonus = String(row.Bonus || '').trim();
        return bonus ? `${target}: ${bonus}` : target;
      })
      .filter(Boolean);

    const card2 = buildUnitInfoCard(unitWithCounters, fakeGameData, {});
    check(`Kontry: karta "${unitWithCounters.Jednostka}" zawiera etykietę "Kontry"`,
      card2.textContent.includes('Kontry'));
    let allPresent = true;
    for (const expected of expectedCounters) {
      if (!card2.textContent.includes(expected)) allPresent = false;
    }
    check('Kontry: wszystkie wartości z counters.json obecne w treści karty (parytet z unitInfoCard.ts::collectCounters)',
      allPresent, expectedCounters.join(' | '));
  }

  // ---------------------------------------------------------------------
  // showUnitInfoCardDialog — sygnatura bez zmian, backdrop w document.body, dismiss sprząta.
  // ---------------------------------------------------------------------
  const dismiss = showUnitInfoCardDialog(wojownik, fakeGameData, {});
  const backdrop = document.querySelector('.unit-info-card-backdrop');
  check('showUnitInfoCardDialog: backdrop zamontowany w document.body', backdrop !== null);
  const cardInDialog = backdrop && backdrop.querySelector('.entity-card-unit');
  check('showUnitInfoCardDialog: karta entityCards wewnątrz backdropu', cardInDialog !== null);
  dismiss();
  check('showUnitInfoCardDialog: dismiss() usuwa backdrop', document.querySelector('.unit-info-card-backdrop') === null);

  // ---------------------------------------------------------------------
  // Fallback do starej implementacji — wymuszony błąd ścieżki entityCards.
  // ---------------------------------------------------------------------
  const brokenUnit = { ...wojownik, Jednostka: undefined };
  const origError = console.error;
  let loggedFallback = false;
  console.error = (...args) => {
    if (String(args[0] || '').includes('fallback do starej implementacji')) loggedFallback = true;
  };
  let threw = false;
  let card3 = null;
  try { card3 = buildUnitInfoCard(brokenUnit, fakeGameData, {}); }
  catch (e) { threw = true; }
  console.error = origError;

  check('fallback: buildUnitInfoCard NIE rzuca nawet gdy ścieżka T4 rzuca wewnętrznie', !threw);
  check('fallback: zaloguje błąd i przełącza na starą implementację', loggedFallback);
  check('fallback: karta zwrócona przez starą implementację (klasa unit-info-card, nie entity-card)',
    card3 !== null && card3.classList.contains('unit-info-card') && !card3.classList.contains('entity-card'));

  console.log('');
  console.log(`[unit-info-card-entitycard-migration-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
