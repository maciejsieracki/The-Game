'use strict';
/**
 * empire-armia-produkcja-test.cjs — P-ARMIA-PANEL-BRAK-INFO-PRODUKCJA-JEDNOSTEK
 * (Maciej 2026-08-16, `dyspozycje/PYTANIA-OTWARTE.md`): zgłoszenie „w widoku armii powinien być
 * jeszcze jedno miejsce. Jaka jednostka jest produkowana, jeżeli jest produkowana."
 *
 * Run from gra/:  node tools/empire-armia-produkcja-test.cjs
 *
 * RUNDA 2 (Evaluator FAIL dla `e5b4a91a`, naprawa N1+N2 blokujących z werdyktu):
 *   N1 — dodano scenariusz (e) w sekcji A + kotwice B, i wiersze w sekcji C pokrywające
 *        `prod.wstrzymana === true` (dawniej mini-tabela ignorowała to pole i pokazywała liczbę
 *        tur, która nigdy nie nadejdzie -- silnik nie dodaje Pracy do wstrzymanej kolejki).
 *   N2 — dodano A12/A13: dwie asercje brzegowe na `etaTurns()` z TWARDYMI literałami (nie tym
 *        samym wzorem co produkcja), żeby złapać mutacje `Math.ceil→Math.floor` i
 *        `Math.max(1,...)→Math.max(0,...)` (zweryfikowane ręcznie -- patrz raport Operatora).
 *
 * Pokrywa:
 *   A. production.ts (pure, esbuild-bundlowany naprawdę): `frontItem()` + `etaTurns()` --
 *      DOKŁADNIE ten sam algorytm filtrowania/ETA, którym main.ts buduje
 *      `EmpireDetailSnap.armiaProdukcja` (patrz sekcja B, kotwice source-text), wykonany
 *      NAPRAWDĘ (nie tylko dopasowanie tekstu) na pięciu scenariuszach:
 *        (a) front kolejki = JEDNOSTKA, Praca/turę > 0 -> wiersz z nazwą + ETA liczbowym,
 *        (b) front kolejki = BUDYNEK -> wiersz pominięty,
 *        (c) kolejka PUSTA -> wiersz pominięty,
 *        (d) front kolejki = JEDNOSTKA, ale Praca/turę do budynków == 0 -> wiersz OBECNY,
 *            ETA = null (nie zgadujemy liczby tur bez dopływu Pracy),
 *        (e) front kolejki = JEDNOSTKA, kolejka WSTRZYMANA (mimo Praca/turę > 0) -> wiersz
 *            OBECNY, ETA = null, `wstrzymana` = true (N1).
 *      Plus (A12/A13, N2) dwie asercje brzegowe wyłącznie na `etaTurns()`, literały niezależne
 *      od wzoru produkcji: reszta niepodzielna (zaokrąglenie w GÓRĘ) i clamp minimum 1 tura.
 *   B. main.ts + empireDetailTypes.ts (source-text -- main.ts to jedna funkcja-domknięcie
 *      niebundlowalna esbuildem, wzorzec `empire-miasta-table-test.cjs` sekcja E): kotwice
 *      potwierdzające że `buildEmpireDetailSnap()` faktycznie woła TE SAME funkcje z sekcji A
 *      (frontItem/etaTurns), filtruje po `front.kind !== 'jednostka'`, czyta `prod.wstrzymana`
 *      (N1) BEZ zbędnego duplikatu guardu `pracaBudynki > 0 ?` (N5) i wystawia pole
 *      `armiaProdukcja` w zwracanym obiekcie; oraz że typ `EmpireArmiaProductionRow` (z polem
 *      `wstrzymana: boolean`) istnieje.
 *   C. empireDetailPanel.ts `renderArmiaProdukcjaMini()` (esbuild+jsdom, REALNE wykonanie --
 *      wzorzec sekcji L w empire-miasta-table-test.cjs, ten sam stub brandAssets):
 *        (a) niepuste wiersze -> tabela z MIASTO/JEDNOSTKA/TURY, poprawne wartości w komórkach,
 *        (d) puste wiersze -> komunikat zastępczy `.civ-emp-empty`, BRAK tabeli `.civ-emp-mini`
 *            (nie pusta tabela -- wymóg zadania punkt 5/7d),
 *        (e) wiersz `wstrzymana: true` -> tekst "wstrzymana", NIE "—" i NIE liczba tur (N1),
 *        (f) odmiana „tura/tury/tur" wg liczby (N4): 1/2/5/13.
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
  // cichu rozjechać się bez wykrycia). N1 (runda 2): dołożono `wstrzymana` -- ETA = null gdy
  // kolejka wstrzymana, niezależnie od pracaBudynki (silnik nie dodaje Pracy do wstrzymanej
  // kolejki, więc liczba tur byłaby fikcyjna).
  function buildArmiaProdukcjaRows(cities) {
    const rows = [];
    for (const c of cities) {
      const prod = c.prod;
      if (!prod) continue;
      const front = A.frontItem(prod);
      if (!front || front.kind !== 'jednostka') continue;
      const wstrzymanaProdukcja = prod.wstrzymana === true;
      const pracaBudynki = c.pracaBudynki ?? 0;
      rows.push({
        cityId: c.id,
        name: c.name,
        unitName: front.nazwa,
        wstrzymana: wstrzymanaProdukcja,
        etaTurns: wstrzymanaProdukcja ? null : A.etaTurns(front.koszt, prod.postep, pracaBudynki),
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
  // (e) N1: front = JEDNOSTKA, kolejka WSTRZYMANA, MIMO pracaBudynki > 0 -> OBECNE, ETA null,
  //     wstrzymana = true. To dokładnie sytuacja z werdyktu Evaluatora: bez tej naprawy panel
  //     pokazywałby liczbę tur, która nigdy nie nadejdzie (silnik nie dodaje Pracy do
  //     wstrzymanej kolejki, `advanceProduction()`, production.ts).
  const cityPaused = {
    id: 'c5', name: 'Capua', pracaBudynki: 12,
    prod: {
      kolejka: [{ kind: 'jednostka', id: 'legio', nazwa: 'Legionista', koszt: 80 }],
      postep: 20,
      wstrzymana: true,
    },
  };

  const rows = buildArmiaProdukcjaRows([cityUnit, cityBuilding, cityEmpty, cityNoWork, cityPaused]);

  eq(rows.length, 3, 'A1: WYŁĄCZNIE miasta z jednostką na czele kolejki trafiają do listy (Roma + Ostia + Capua, 3 z 5 miast)');
  const roma = rows.find(r => r.cityId === 'c1');
  assert(roma !== undefined, 'A2: Roma (front=jednostka) jest w liście');
  eq(roma && roma.unitName, 'Hastati', 'A3: nazwa jednostki = front.nazwa (Hastati)');
  eq(roma && roma.etaTurns, Math.max(1, Math.ceil((45 - 15) / 10)), 'A4: ETA = etaTurns(koszt=45, postep=15, praca=10) = ceil(30/10) = 3 tury');
  eq(roma && roma.wstrzymana, false, 'A4b (N1): Roma nie jest wstrzymana -> wstrzymana=false');

  assert(!rows.some(r => r.cityId === 'c2'), 'A5 (punkt b zadania): Neapolis (front=budynek) NIE trafia do listy');
  assert(!rows.some(r => r.cityId === 'c3'), 'A6 (punkt c zadania): Pompeje (kolejka pusta) NIE trafia do listy');

  const ostia = rows.find(r => r.cityId === 'c4');
  assert(ostia !== undefined, 'A7: Ostia (front=jednostka, mimo pracaBudynki=0) JEST w liście -- brak Pracy nie ukrywa miasta, tylko chowa liczbę tur');
  eq(ostia && ostia.unitName, 'Triarii', 'A8: nazwa jednostki Ostii = Triarii');
  eq(ostia && ostia.etaTurns, null, 'A9: ETA = null gdy pracaBudynki <= 0 -- nie zgadujemy liczby tur bez dopływu Pracy (wymóg zadania punkt 3)');
  eq(ostia && ostia.wstrzymana, false, 'A9b (N1): Ostia nie jest wstrzymana (brak Pracy != wstrzymana) -> wstrzymana=false');

  const capua = rows.find(r => r.cityId === 'c5');
  assert(capua !== undefined, 'A10 (N1): Capua (front=jednostka, wstrzymana=true) JEST w liście -- wstrzymanie nie ukrywa miasto, tylko liczbę tur');
  eq(capua && capua.unitName, 'Legionista', 'A10b: nazwa jednostki Capui = Legionista');
  eq(capua && capua.etaTurns, null, 'A11 (N1, rdzeń naprawy): ETA = null gdy wstrzymana=true, MIMO pracaBudynki=12>0 -- silnik nie dodaje Pracy do wstrzymanej kolejki, liczba tur byłaby fikcyjna');
  eq(capua && capua.wstrzymana, true, 'A11b (N1): flaga wstrzymana=true dotarła do wiersza -- panel może odróżnić od zwykłego braku Pracy (Ostia, A9b)');

  // A12/A13 (N2, RUNDA 2 -- Evaluator FAIL): asercje brzegowe WYŁĄCZNIE na etaTurns(), literały
  // policzone RĘCZNIE (nie tym samym wzorem co funkcja pod testem) -- inaczej mutacja formuły
  // przechodzi bramkę zielono, bo test i implementacja liczą to samo błędnie tą samą drogą.
  eq(A.etaTurns(45, 15, 7), 5,
    'A12 (N2a): etaTurns(koszt=45, postep=15, praca=7) -- reszta 30/7=4.285..., zaokrąglenie w GÓRĘ do 5 (Math.ceil); Math.floor dałby błędnie 4');
  eq(A.etaTurns(30, 30, 10), 1,
    'A13 (N2b): etaTurns(koszt=30, postep=30, praca=10) -- koszt<=postep (reszta 0), clamp Math.max(1,...) wymusza MINIMUM 1 turę; bez clampu wyszłoby błędnie 0');
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

  const rowTypeIdx = empireTypesSrc.indexOf('export interface EmpireArmiaProductionRow {');
  const rowTypeEnd = empireTypesSrc.indexOf('\n}', rowTypeIdx);
  const rowTypeBlock = rowTypeIdx > -1 && rowTypeEnd > rowTypeIdx ? empireTypesSrc.slice(rowTypeIdx, rowTypeEnd) : '';
  assert(/wstrzymana:\s*boolean;/.test(rowTypeBlock),
    'B2b (N1): EmpireArmiaProductionRow deklaruje pole wstrzymana: boolean');

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

  // N1 (runda 2): blok musi czytać prod.wstrzymana wprost.
  assert(block.includes('const wstrzymanaProdukcja = prod.wstrzymana === true;'),
    'B7b (N1): blok czyta prod.wstrzymana === true -- naprawa rdzenia werdyktu Evaluatora (mini-tabela dawniej to pole ignorowała)');

  // B8 (N5, runda 2): etaTurns() wywołane BEZ zbędnego zewnętrznego duplikatu guardu
  // `pracaBudynki > 0 ?` -- etaTurns() strażuje `praca<=0` sama (patrz production.ts JSDoc);
  // zewnętrzny warunek pozostaje TYLKO dla wstrzymania (co etaTurns() nie może wiedzieć, bo nie
  // dostaje tej flagi jako argument).
  assert(block.includes('wstrzymanaProdukcja ? null : etaTurns(front.koszt, prod.postep, pracaBudynki)'),
    'B8: ETA = null gdy wstrzymana, inaczej etaTurns() woła się BEZPOŚREDNIO (bez zbędnego pracaBudynki>0 ? na zewnątrz -- ten guard żyje już wewnątrz etaTurns())');
  assert(!block.includes('pracaBudynki > 0 ? etaTurns('),
    'B8b (N5, regresja): zbędny zewnętrzny duplikat guardu `pracaBudynki > 0 ? etaTurns(...)` NIE wrócił -- etaTurns() ma własny guard, main.ts nie ma go dublować');

  assert(block.includes('unitName: front.nazwa,'), 'B9: unitName czyta front.nazwa (nazwa jednostki na czele kolejki, nie coś innego)');
  assert(block.includes('wstrzymana: wstrzymanaProdukcja,'),
    'B9b (N1): pole wstrzymana w pushowanym wierszu czyta flagę wyliczoną z prod.wstrzymana, nie jest zakodowane na sztywno');

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

  // (a) niepuste wiersze -- Roma (ETA liczbowe) + Ostia (ETA null, brak Pracy) + Capua
  // (wstrzymana, N1).
  const rowsNonEmpty = [
    { cityId: 'c1', name: 'Roma', unitName: 'Hastati', wstrzymana: false, etaTurns: 3 },
    { cityId: 'c4', name: 'Ostia', unitName: 'Triarii', wstrzymana: false, etaTurns: null },
    { cityId: 'c5', name: 'Capua', unitName: 'Legionista', wstrzymana: true, etaTurns: null },
  ];
  container.innerHTML = C.renderArmiaProdukcjaMini(rowsNonEmpty);

  const table = container.querySelector('.civ-emp-mini');
  assert(table !== null, 'C1: niepuste wiersze -> tabela .civ-emp-mini faktycznie w DOM');
  const dataRows = container.querySelectorAll('.civ-emp-mini-r');
  eq(dataRows.length, 3, 'C2: dokładnie 3 wiersze danych w DOM (jeden per pozycję armiaProdukcja)');
  const bodyText = container.textContent || '';
  assert(bodyText.includes('Roma') && bodyText.includes('Hastati'), 'C3 (punkt 7a zadania): wiersz Romy zawiera nazwę miasta I poprawną nazwę jednostki (Hastati)');
  assert(/~3\s*tur/.test(bodyText), 'C4: ETA liczbowe wyrenderowane jako "~3 tury" (3 -> forma "few")');
  assert(bodyText.includes('Ostia') && bodyText.includes('Triarii'), 'C5: wiersz Ostii (ETA null) nadal zawiera miasto+jednostkę');
  const ostiaRow = dataRows[1];
  assert(ostiaRow.textContent.includes('—'), 'C6: ETA null (brak Pracy) renderuje się jako "—" (nie "null", nie "~null tur")');
  assert(!bodyText.includes('Żadne miasto nie buduje'), 'C7: komunikat pustego stanu NIE pojawia się, gdy lista ma wiersze');

  // (e) N1 (rdzeń naprawy runda 2): wiersz wstrzymany -> tekst "wstrzymana", NIE "—", NIE liczba.
  const capuaRow = dataRows[2];
  assert(capuaRow.textContent.includes('Capua') && capuaRow.textContent.includes('Legionista'),
    'C11 (N1): wiersz Capui (wstrzymana) zawiera miasto + nazwę jednostki');
  assert(capuaRow.textContent.includes('wstrzymana'),
    'C12 (N1, rdzeń naprawy): wiersz wstrzymany pokazuje tekst "wstrzymana" w kolumnie TURY -- czytelnie inne niż "—" (brak danych o Pracy), zgodnie z panelem miasta');
  assert(!capuaRow.textContent.includes('—'),
    'C13 (N1): wiersz wstrzymany NIE pokazuje "—" obok "wstrzymana" -- jeden jednoznaczny sygnał, nie dwa sprzeczne');
  eq((capuaRow.textContent.match(/\d/g) || []).length, 0,
    'C14 (N1): wiersz wstrzymany nie zawiera ŻADNEJ cyfry w kolumnie TURY -- zero ryzyka pokazania fikcyjnej liczby tur (rdzeń defektu z werdyktu Evaluatora)');

  // (d) puste wiersze -- komunikat zastępczy, BRAK tabeli (wymóg zadania punkt 5/7d: "nie pustą tabelę").
  container.innerHTML = C.renderArmiaProdukcjaMini([]);
  const tableEmpty = container.querySelector('.civ-emp-mini');
  const emptyMsg = container.querySelector('.civ-emp-empty');
  assert(tableEmpty === null, 'C8 (punkt 7d zadania, rdzeń wymogu): lista pusta -> BRAK elementu .civ-emp-mini (nie pusta tabela)');
  assert(emptyMsg !== null, 'C9: lista pusta -> komunikat zastępczy .civ-emp-empty obecny w DOM');
  assert((emptyMsg.textContent || '').length > 0, 'C10: komunikat zastępczy ma niepusty tekst (spokojna informacja, nie cichy brak)');

  // (f) N4 (runda 2): odmiana „tura/tury/tur" -- 1 -> tura, 2 -> tury (few), 5 -> tur (many),
  // 13 -> tur (wyjątek 12-14, MIMO że lastDigit=3 sugerowałby "few").
  const rowsPlural = [
    { cityId: 'p1', name: 'M1', unitName: 'J1', wstrzymana: false, etaTurns: 1 },
    { cityId: 'p2', name: 'M2', unitName: 'J2', wstrzymana: false, etaTurns: 2 },
    { cityId: 'p3', name: 'M3', unitName: 'J3', wstrzymana: false, etaTurns: 5 },
    { cityId: 'p4', name: 'M4', unitName: 'J4', wstrzymana: false, etaTurns: 13 },
  ];
  container.innerHTML = C.renderArmiaProdukcjaMini(rowsPlural);
  const pluralRows = container.querySelectorAll('.civ-emp-mini-r');
  eq(pluralRows.length, 4, 'C15 (N4): 4 wiersze odmiany wyrenderowane');
  assert(/~1\s*tura(?!\w)/.test(pluralRows[0].textContent), 'C16 (N4): 1 -> "~1 tura" (forma pojedyncza)');
  assert(/~2\s*tury(?!\w)/.test(pluralRows[1].textContent), 'C17 (N4): 2 -> "~2 tury" (forma "few", 2-4 poza 12-14)');
  assert(/~5\s*tur(?!\w)/.test(pluralRows[2].textContent), 'C18 (N4): 5 -> "~5 tur" (forma "many", 5+)');
  assert(/~13\s*tur(?!\w)/.test(pluralRows[3].textContent), 'C19 (N4): 13 -> "~13 tur" (wyjątek 12-14 -- NIE "13 tury", mimo że ostatnia cyfra to 3)');
}

runSectionC().then(() => {
  console.log(`\nempire-armia-produkcja-test: ${passed} passed, ${failed} failed`);
  process.exitCode = failed > 0 ? 1 : 0;
}).catch((e) => {
  console.error('[empire-armia-produkcja-test] sekcja C unexpected error:', e && e.stack || e);
  process.exitCode = 1;
});
