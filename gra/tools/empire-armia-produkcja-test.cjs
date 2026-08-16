'use strict';
/**
 * empire-armia-produkcja-test.cjs — P-ARMIA-PANEL-BRAK-INFO-PRODUKCJA-JEDNOSTEK
 * (Maciej 2026-08-16, `dyspozycje/PYTANIA-OTWARTE.md`): zgłoszenie „w widoku armii powinien być
 * jeszcze jedno miejsce. Jaka jednostka jest produkowana, jeżeli jest produkowana."
 *
 * Run from gra/:  node tools/empire-armia-produkcja-test.cjs
 *
 * Pokrywa:
 *   A. production.ts (pure, esbuild-bundlowany naprawdę): `frontItem()` + `etaTurns()` --
 *      DOKŁADNIE ten sam algorytm filtrowania/ETA, którym main.ts buduje
 *      `EmpireDetailSnap.armiaProdukcja` (patrz sekcja B, kotwice source-text), wykonany
 *      NAPRAWDĘ (nie tylko dopasowanie tekstu) na czterech scenariuszach:
 *        (a) front kolejki = JEDNOSTKA, Praca/turę > 0 -> wiersz z nazwą + ETA liczbowym,
 *        (b) front kolejki = BUDYNEK -> wiersz pominięty,
 *        (c) kolejka PUSTA -> wiersz pominięty,
 *        (d) front kolejki = JEDNOSTKA, ale Praca/turę do budynków == 0 -> wiersz OBECNY,
 *            ETA = null (nie zgadujemy liczby tur bez dopływu Pracy).
 *   B. main.ts + empireDetailTypes.ts (source-text -- main.ts to jedna funkcja-domknięcie
 *      niebundlowalna esbuildem, wzorzec `empire-miasta-table-test.cjs` sekcja E): kotwice
 *      potwierdzające że `buildEmpireDetailSnap()` faktycznie woła TE SAME funkcje z sekcji A
 *      (frontItem/etaTurns), filtruje po `front.kind !== 'jednostka'` i wystawia pole
 *      `armiaProdukcja` w zwracanym obiekcie; oraz że typ `EmpireArmiaProductionRow` istnieje.
 *   C. empireDetailPanel.ts `renderArmiaProdukcjaMini()` (esbuild+jsdom, REALNE wykonanie --
 *      wzorzec sekcji L w empire-miasta-table-test.cjs, ten sam stub brandAssets):
 *        (a) niepuste wiersze -> tabela z MIASTO/JEDNOSTKA/TURY, poprawne wartości w komórkach,
 *        (d) puste wiersze -> komunikat zastępczy `.civ-emp-empty`, BRAK tabeli `.civ-emp-mini`
 *            (nie pusta tabela -- wymóg zadania punkt 5/7d).
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[empire-armia-produkcja-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ===========================================================================
// A. production.ts (pure) -- frontItem() + etaTurns(), REALNE wykonanie
// ===========================================================================
console.log('\n-- A. frontItem()/etaTurns() -- ten sam algorytm co buildEmpireDetailSnap() (main.ts) --');
{
  const ENTRY = path.resolve(__dirname, '.empire-armia-produkcja-A-entry.ts');
  const BUNDLE = path.resolve(__dirname, '.empire-armia-produkcja-A-bundle.cjs');
  fs.writeFileSync(ENTRY, `
export { frontItem, etaTurns } from '../src/game/production';
`, 'utf8');
  try {
    esbuild.buildSync({
      entryPoints: [ENTRY],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE,
      absWorkingDir: GRA,
      logLevel: 'silent',
      resolveExtensions: ['.ts', '.js', '.json'],
    });
  } catch (e) {
    console.error('[empire-armia-produkcja-test] sekcja A esbuild bundling failed:\n', e.message || e);
    process.exit(1);
  }
  const A = require(BUNDLE);

  // Miniaturowa replika PĘTLI z buildEmpireDetailSnap() (main.ts) -- woła WYŁĄCZNIE funkcje
  // realnie zbundlowane z production.ts wyżej, dokładnie ten sam warunek/kolejność co main.ts
  // (patrz kotwica source-text w sekcji B, żeby dwie kopie -- ta i main.ts -- nie mogły po
  // cichu rozjechać się bez wykrycia).
  function buildArmiaProdukcjaRows(cities) {
    const rows = [];
    for (const c of cities) {
      const prod = c.prod;
      if (!prod) continue;
      const front = A.frontItem(prod);
      if (!front || front.kind !== 'jednostka') continue;
      const pracaBudynki = c.pracaBudynki ?? 0;
      rows.push({
        cityId: c.id,
        name: c.name,
        unitName: front.nazwa,
        etaTurns: pracaBudynki > 0 ? A.etaTurns(front.koszt, prod.postep, pracaBudynki) : null,
      });
    }
    return rows;
  }

  // (a) front = JEDNOSTKA, Praca/turę > 0 -> wiersz z ETA liczbowym.
  const cityUnit = {
    id: 'c1', name: 'Roma', pracaBudynki: 10,
    prod: { kolejka: [{ kind: 'jednostka', id: 'hastati', nazwa: 'Hastati', koszt: 45 }], postep: 15 },
  };
  // (b) front = BUDYNEK -> pominięte.
  const cityBuilding = {
    id: 'c2', name: 'Neapolis', pracaBudynki: 8,
    prod: { kolejka: [{ kind: 'budynek', id: 'spichlerz', nazwa: 'Spichlerz', koszt: 30 }], postep: 5 },
  };
  // (c) kolejka PUSTA -> pominięte.
  const cityEmpty = { id: 'c3', name: 'Pompeje', pracaBudynki: 6, prod: { kolejka: [], postep: 0 } };
  // (d) front = JEDNOSTKA, ale pracaBudynki == 0 -> OBECNE, ETA null.
  const cityNoWork = {
    id: 'c4', name: 'Ostia', pracaBudynki: 0,
    prod: { kolejka: [{ kind: 'jednostka', id: 'triarii', nazwa: 'Triarii', koszt: 60 }], postep: 0 },
  };

  const rows = buildArmiaProdukcjaRows([cityUnit, cityBuilding, cityEmpty, cityNoWork]);

  eq(rows.length, 2, 'A1: WYŁĄCZNIE miasta z jednostką na czele kolejki trafiają do listy (Roma + Ostia, 2 z 4 miast)');
  const roma = rows.find(r => r.cityId === 'c1');
  assert(roma !== undefined, 'A2: Roma (front=jednostka) jest w liście');
  eq(roma && roma.unitName, 'Hastati', 'A3: nazwa jednostki = front.nazwa (Hastati)');
  eq(roma && roma.etaTurns, Math.max(1, Math.ceil((45 - 15) / 10)), 'A4: ETA = etaTurns(koszt=45, postep=15, praca=10) = ceil(30/10) = 3 tury');

  assert(!rows.some(r => r.cityId === 'c2'), 'A5 (punkt b zadania): Neapolis (front=budynek) NIE trafia do listy');
  assert(!rows.some(r => r.cityId === 'c3'), 'A6 (punkt c zadania): Pompeje (kolejka pusta) NIE trafia do listy');

  const ostia = rows.find(r => r.cityId === 'c4');
  assert(ostia !== undefined, 'A7: Ostia (front=jednostka, mimo pracaBudynki=0) JEST w liście -- brak Pracy nie ukrywa miasta, tylko chowa liczbę tur');
  eq(ostia && ostia.unitName, 'Triarii', 'A8: nazwa jednostki Ostii = Triarii');
  eq(ostia && ostia.etaTurns, null, 'A9: ETA = null gdy pracaBudynki <= 0 -- nie zgadujemy liczby tur bez dopływu Pracy (wymóg zadania punkt 3)');
}

// ===========================================================================
// B. main.ts + empireDetailTypes.ts -- kotwice source-text (main.ts niebundlowalny esbuildem,
//    wzorzec empire-miasta-table-test.cjs sekcja E)
// ===========================================================================
console.log('\n-- B. main.ts buildEmpireDetailSnap() + empireDetailTypes.ts -- wiring --');
{
  const MAIN_TS = path.join(GRA, 'src', 'main.ts');
  const mainSrcRaw = fs.readFileSync(MAIN_TS, 'utf8');
  const EMPIRE_TYPES_TS = path.join(GRA, 'src', 'ui', 'empireDetailTypes.ts');
  const empireTypesSrc = fs.readFileSync(EMPIRE_TYPES_TS, 'utf8');

  function stripLineComments(src) {
    return src.split('\n').map((line) => {
      const idx = line.indexOf('//');
      return idx >= 0 ? line.slice(0, idx) : line;
    }).join('\n');
  }
  const mainSrc = stripLineComments(mainSrcRaw);

  assert(empireTypesSrc.includes('export interface EmpireArmiaProductionRow {'),
    'B1: EmpireArmiaProductionRow zdefiniowany w empireDetailTypes.ts');
  assert(/armiaProdukcja:\s*EmpireArmiaProductionRow\[\];/.test(empireTypesSrc),
    'B2: EmpireDetailSnap deklaruje pole armiaProdukcja: EmpireArmiaProductionRow[]');

  const fnIdx = mainSrc.indexOf('function buildEmpireDetailSnap(): EmpireDetailSnap {');
  assert(fnIdx > -1, 'B3: kotwica "function buildEmpireDetailSnap()" znaleziona w main.ts');
  const armiaIdx = mainSrc.indexOf('const armiaProdukcja: EmpireDetailSnap[\'armiaProdukcja\'] = [];', fnIdx);
  assert(armiaIdx > fnIdx, 'B4: blok liczący armiaProdukcja leży WEWNĄTRZ buildEmpireDetailSnap()');

  const religionIdx = mainSrc.indexOf('const relStateReligion = ownerReligionForOwnerId(0);', armiaIdx);
  const block = (armiaIdx > -1 && religionIdx > armiaIdx) ? mainSrc.slice(armiaIdx, religionIdx) : '';
  assert(block.includes('for (const c of pc) {'), 'B5: pętla iteruje po `pc` -- miastach GRACZA (ownerId===0), nie po wszystkich miastach');
  assert(block.includes('const front = frontItem(prod);'), 'B6: blok woła frontItem() -- TA SAMA funkcja co sekcja A, zero zduplikowanej logiki frontu');
  assert(block.includes("if (!front || front.kind !== 'jednostka') continue;"),
    'B7: filtr pomija miasta bez frontu ORAZ z budynkiem na froncie -- dokładnie warunek testowany w A5/A6');
  assert(block.includes('pracaBudynki > 0 ? etaTurns(front.koszt, prod.postep, pracaBudynki) : null'),
    'B8: ETA liczone przez etaTurns() (TA SAMA funkcja co sekcja A) z guardem pracaBudynki>0 -- dokładnie warunek testowany w A4/A9');
  assert(block.includes('unitName: front.nazwa,'), 'B9: unitName czyta front.nazwa (nazwa jednostki na czele kolejki, nie coś innego)');

  // Kotwica na SAMEJ obecności pola w zwracanym obiekcie (nie na dokładnym sąsiedztwie z innymi
  // polami) -- P-PANEL-MIASTO-OBYWATELE dociągnięcie (scalone równolegle) dodało `happiness,`
  // między `religion,` a `armiaProdukcja,`; test nie ma pilnować kolejności pól, tylko że
  // armiaProdukcja jest faktycznie w `return { ... }`, nie tylko policzone i porzucone.
  const returnBlockIdx = mainSrc.indexOf('        research,\n        religion,\n', armiaIdx);
  assert(returnBlockIdx > armiaIdx, 'B10a: blok return { ... research, religion, ... } znaleziony po bloku liczącym armiaProdukcja');
  const returnBlockEnd = mainSrc.indexOf('\n      };', returnBlockIdx);
  const returnBlock = returnBlockIdx > -1 && returnBlockEnd > returnBlockIdx
    ? mainSrc.slice(returnBlockIdx, returnBlockEnd) : '';
  assert(/\n\s*armiaProdukcja,\s*$/.test(returnBlock),
    'B10: zwracany obiekt EmpireDetailSnap zawiera armiaProdukcja (pole faktycznie wystawione, nie tylko policzone i porzucone)');
}

// ===========================================================================
// C. empireDetailPanel.ts renderArmiaProdukcjaMini() -- esbuild+jsdom, REALNE wykonanie
// ===========================================================================
async function runSectionC() {
  console.log('\n-- C. renderArmiaProdukcjaMini() (esbuild+jsdom) --');
  let JSDOM;
  try { ({ JSDOM } = require(path.resolve(GRA, 'node_modules', 'jsdom'))); }
  catch (e) {
    console.error('[empire-armia-produkcja-test] jsdom not found. Run: npm install (from gra/)');
    process.exit(1);
  }

  const ENTRY = path.resolve(__dirname, '.empire-armia-produkcja-C-entry.ts');
  const BUNDLE = path.resolve(__dirname, '.empire-armia-produkcja-C-bundle.cjs');
  fs.writeFileSync(ENTRY, `
export { renderArmiaProdukcjaMini } from '../src/ui/empireDetailPanel';
`, 'utf8');

  // Ten sam stub co empire-miasta-table-test.cjs sekcja L: JEDYNA przeszkoda Vite w drzewie
  // zależności empireDetailPanel.ts to ./icons/brandAssets (import.meta.glob) -- funkcja pod
  // testem go nie woła, ale moduły ES wykonują CAŁY top-level kod przy imporcie.
  const STUB_BRAND_ASSETS_PLUGIN = {
    name: 'stub-brand-assets-armia-produkcja',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, (args) => (
        { path: args.path, namespace: 'stub-brand-assets-armia-produkcja' }
      ));
      build.onLoad({ filter: /.*/, namespace: 'stub-brand-assets-armia-produkcja' }, () => ({
        contents:
          'export function brandIconSvg(id, size) { return String(id); }\n'
          + 'export function mapResourceIconSvg(label, size) { return String(label); }\n',
        loader: 'js',
      }));
    },
  };

  try {
    await esbuild.build({
      entryPoints: [ENTRY],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      loader: { '.ts': 'ts', '.json': 'json' },
      plugins: [STUB_BRAND_ASSETS_PLUGIN],
      outfile: BUNDLE,
      absWorkingDir: GRA,
      logLevel: 'silent',
    });
  } catch (e) {
    console.error('[empire-armia-produkcja-test] sekcja C esbuild bundling failed:\n', e.message || e);
    process.exit(1);
  }

  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;

  delete require.cache[require.resolve(BUNDLE)];
  const C = require(BUNDLE);

  const container = document.createElement('div');
  document.body.appendChild(container);

  // (a) niepuste wiersze -- Roma (ETA liczbowe) + Ostia (ETA null -> '—').
  const rowsNonEmpty = [
    { cityId: 'c1', name: 'Roma', unitName: 'Hastati', etaTurns: 3 },
    { cityId: 'c4', name: 'Ostia', unitName: 'Triarii', etaTurns: null },
  ];
  container.innerHTML = C.renderArmiaProdukcjaMini(rowsNonEmpty);

  const table = container.querySelector('.civ-emp-mini');
  assert(table !== null, 'C1: niepuste wiersze -> tabela .civ-emp-mini faktycznie w DOM');
  const dataRows = container.querySelectorAll('.civ-emp-mini-r');
  eq(dataRows.length, 2, 'C2: dokładnie 2 wiersze danych w DOM (jeden per pozycję armiaProdukcja)');
  const bodyText = container.textContent || '';
  assert(bodyText.includes('Roma') && bodyText.includes('Hastati'), 'C3 (punkt 7a zadania): wiersz Romy zawiera nazwę miasta I poprawną nazwę jednostki (Hastati)');
  assert(/~3\s*tur/.test(bodyText), 'C4: ETA liczbowe wyrenderowane jako "~3 tur"');
  assert(bodyText.includes('Ostia') && bodyText.includes('Triarii'), 'C5: wiersz Ostii (ETA null) nadal zawiera miasto+jednostkę');
  const ostiaRow = dataRows[1];
  assert(ostiaRow.textContent.includes('—'), 'C6: ETA null renderuje się jako "—" (nie "null", nie "~null tur")');
  assert(!bodyText.includes('Żadne miasto nie buduje'), 'C7: komunikat pustego stanu NIE pojawia się, gdy lista ma wiersze');

  // (d) puste wiersze -- komunikat zastępczy, BRAK tabeli (wymóg zadania punkt 5/7d: "nie pustą tabelę").
  container.innerHTML = C.renderArmiaProdukcjaMini([]);
  const tableEmpty = container.querySelector('.civ-emp-mini');
  const emptyMsg = container.querySelector('.civ-emp-empty');
  assert(tableEmpty === null, 'C8 (punkt 7d zadania, rdzeń wymogu): lista pusta -> BRAK elementu .civ-emp-mini (nie pusta tabela)');
  assert(emptyMsg !== null, 'C9: lista pusta -> komunikat zastępczy .civ-emp-empty obecny w DOM');
  assert((emptyMsg.textContent || '').length > 0, 'C10: komunikat zastępczy ma niepusty tekst (spokojna informacja, nie cichy brak)');
}

runSectionC().then(() => {
  console.log(`\nempire-armia-produkcja-test: ${passed} passed, ${failed} failed`);
  process.exitCode = failed > 0 ? 1 : 0;
}).catch((e) => {
  console.error('[empire-armia-produkcja-test] sekcja C unexpected error:', e && e.stack || e);
  process.exitCode = 1;
});
