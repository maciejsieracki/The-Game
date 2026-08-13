'use strict';
/**
 * fort-nodes-save-load-test.cjs — round-trip save -> load dla `fortNodes`
 * (R-FORT-STRAZNICA-ROZSZERZA-ZASIEG-ZAKLADANIA krok 2).
 *
 * Kontekst: Evaluator rundy 3 Fort/straznicy (PYTANIA-OTWARTE.md, "Fort/straznica krok2
 * (45f673af)") znalazł MUT-6 NIEZŁAPANĄ — mutacja "zapis `fortNodes` do save wyzerowany"
 * przechodziła WSZYSTKIE bramki repo bez śladu, bo w całym repo nie było ani jednej asercji
 * pokrywającej save/load `fortNodes`. Ten plik domyka tę lukę.
 *
 * `fortNodes` żyje jako lokalna zmienna wewnątrz OGROMNEJ funkcji-domknięcia main.ts (setki
 * współzależnych zmiennych) — nie da się jej odpalić w izolacji przez pełny esbuild-bundle
 * (main.ts ma pre-istniejące bramki-przeszkody: import.meta.glob / brak loaderów .svg, patrz
 * CLAUDE.md §BRAMKI, `map-field-battle-test.cjs`/`pre-battle-save-test.cjs`). Zamiast tego —
 * wzorem `auto-wyzywienie-live-recalc-test.cjs` — test WYCINA prawdziwy tekst zapisu (wewnątrz
 * `buildSaveGameSnapshot`) i prawdziwy tekst odczytu (wewnątrz `restoreGameFromSave`) z BIEŻĄCEGO
 * main.ts (nie reimplementację-kopię) i wykonuje je NAPRAWDĘ przez `new Function` (transpilacja
 * TS-only składni przez esbuild, tak jak robi to build produkcyjny).
 *
 * Weryfikacja mutacyjna (część 3 niżej) potwierdza, że ta metoda ekstrakcji faktycznie zależy od
 * treści main.ts: podmieniamy w PAMIĘCI (nie na dysku) prawdziwą linię zapisu na
 * `fortNodes: [],` / prawdziwy blok odczytu na no-op i sprawdzamy, że ta sama logika testu
 * wykrywa regresję (0 węzłów zamiast 2) — czyli że asercje części 1-2 faktycznie łapałyby taką
 * regresję na żywym main.ts, nie są tautologią.
 *
 * node tools/fort-nodes-save-load-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_ROOT, 'src', 'main.ts');
const realSrc = fs.readFileSync(MAIN_TS, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; console.error('FAIL:', label); }
}
function eq(got, want, label) {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  ok(g === w, `${label} (got=${g}, want=${w})`);
}

const BUILD_SAVE_SIG = 'function buildSaveGameSnapshot(label?: string): SaveGame {';
const RESTORE_SIG = 'function restoreGameFromSave(saved: SaveGame): void {';

// ---------------------------------------------------------------------------
// Ekstrakcja: prawdziwy tekst zapisu (RHS wyrażenia `fortNodes: <RHS>,` wewnątrz
// buildSaveGameSnapshot) i prawdziwy tekst odczytu (blok `fortNodes.length = 0; ...`
// wewnątrz restoreGameFromSave) -- działa identycznie na PRAWDZIWYM main.ts i na
// ZMUTOWANEJ w pamięci kopii (część 3), bo lokalizuje przez sąsiedztwo funkcji, nie
// przez hardkodowany numer linii (które i tak się przesuwają, patrz nota N-2 w
// PYTANIA-OTWARTE.md o nieaktualnych numerach linii w komentarzu main.ts:10463-10467).
// / EN: extraction locates the real save/load text by function proximity (not a
// hardcoded line number, which drifts) -- works identically against the real main.ts
// and against an in-memory mutated copy (Part 3).
// ---------------------------------------------------------------------------
function extractSaveRhs(sourceText) {
  const buildIdx = sourceText.indexOf(BUILD_SAVE_SIG);
  if (buildIdx < 0) return { rhs: null, err: 'buildSaveGameSnapshot signature not found' };
  const restoreIdx = sourceText.indexOf(RESTORE_SIG, buildIdx);
  const marker = 'fortNodes:';
  const mIdx = sourceText.indexOf(marker, buildIdx);
  if (mIdx < 0 || (restoreIdx >= 0 && mIdx > restoreIdx)) {
    return { rhs: null, err: 'fortNodes: <expr> line not found inside buildSaveGameSnapshot' };
  }
  const lineEnd = sourceText.indexOf('\n', mIdx);
  const line = sourceText.slice(mIdx, lineEnd < 0 ? undefined : lineEnd);
  const rhs = line.slice(marker.length).trim().replace(/,\s*$/, '');
  return { rhs, err: null };
}

function extractLoadBlock(sourceText) {
  const restoreIdx = sourceText.indexOf(RESTORE_SIG);
  if (restoreIdx < 0) return { body: null, err: 'restoreGameFromSave signature not found' };
  const startMarker = 'fortNodes.length = 0;';
  const startIdx = sourceText.indexOf(startMarker, restoreIdx);
  if (startIdx < 0) return { body: null, err: 'fortNodes.length = 0; not found inside restoreGameFromSave' };
  const endMarker = 'fortNodes.push(...savedFortNodes);';
  const endIdx = sourceText.indexOf(endMarker, startIdx);
  if (endIdx < 0) return { body: null, err: 'fortNodes.push(...savedFortNodes); not found after start marker' };
  const bodyTs = sourceText.slice(startIdx, endIdx + endMarker.length);
  // Blok zawiera składnię TS-only (`as FortNode[] | undefined`) -- `new Function` (czysty JS)
  // tego nie sparsuje. Transpiluj przez esbuild (loader 'ts'), tak jak build produkcyjny.
  const body = esbuild.transformSync(bodyTs, { loader: 'ts', target: 'node18' }).code;
  return { body, err: null };
}

// ---------------------------------------------------------------------------
// Część 1: statyczne umiejscowienie -- oba fragmenty żyją WEWNĄTRZ właściwych funkcji w
// PRAWDZIWYM main.ts (nie w jakimś nieużywanym miejscu).
// ---------------------------------------------------------------------------
const realSave = extractSaveRhs(realSrc);
ok(realSave.rhs !== null, `część 1: zapis fortNodes odnaleziony w buildSaveGameSnapshot (${realSave.err || 'ok'})`);
eq(realSave.rhs, 'fortNodes.slice()', 'część 1: prawdziwy zapis to dokładnie `fortNodes.slice()` (kopia, nie referencja)');

const realLoad = extractLoadBlock(realSrc);
ok(realLoad.body !== null, `część 1: odczyt fortNodes odnaleziony w restoreGameFromSave (${realLoad.err || 'ok'})`);

// ---------------------------------------------------------------------------
// Część 2: round-trip NA PRAWDZIWYM kodzie -- zbuduj stan z niepustym fortNodes, zserializuj
// przez wycięty prawdziwy zapis, przepuść przez JSON (tak jak realny zapis trafia do
// localStorage/IndexedDB -- SaveGame jest JSON-serializowany), zdeserializuj przez wycięty
// prawdziwy odczyt do ŚWIEŻEJ tablicy (symulacja nowej sesji gry), potwierdź że treść
// przetrwała niepusta i identyczna.
// ---------------------------------------------------------------------------
{
  const original = [
    { q: 3, r: -2, ownerId: 1, type: 'fort', contestedUseless: false },
    { q: 5, r: 5, ownerId: 2, type: 'posterunek', contestedUseless: true },
  ];

  const saveFn = new Function('fortNodes', `return (${realSave.rhs});`);
  const snapshot = saveFn(original);

  ok(Array.isArray(snapshot) && snapshot.length === 2, `część 2a: serializacja daje 2 węzły (got ${snapshot && snapshot.length})`);
  eq(snapshot, original, 'część 2a: zawartość snapshotu identyczna z oryginałem');
  ok(snapshot !== original, 'część 2a: fortNodes.slice() zwraca KOPIĘ tablicy, nie referencję oryginału');

  // Mutacja oryginału PO zapisie nie może wpłynąć na już-zserializowany snapshot (dowód, że to
  // realnie kopia, nie alias -- ważne bo main.ts trzyma `fortNodes` jako mutowalny stan gry
  // dalej żyjący po wywołaniu buildSaveGameSnapshot, np. kolejne tury przed kolejnym zapisem).
  original.push({ q: 99, r: 99, ownerId: 3, type: 'fort' });
  eq(snapshot.length, 2, 'część 2a: zmiana oryginału PO save nie wpływa na już-zserializowany snapshot');

  // Realny zapis przechodzi przez JSON (persystencja) -- sprawdź, że nic nie ginie w tej podróży
  // (Set/Map/undefined pól by tu nie przetrwały, FortNode to zwykły plain object -- powinien).
  const jsonRoundTripped = JSON.parse(JSON.stringify(snapshot));
  eq(jsonRoundTripped, [
    { q: 3, r: -2, ownerId: 1, type: 'fort', contestedUseless: false },
    { q: 5, r: 5, ownerId: 2, type: 'posterunek', contestedUseless: true },
  ], 'część 2b: snapshot przetrwał JSON round-trip (tak jak przechodzi realny zapis) bez utraty pól');

  // Deserializacja do ŚWIEŻEJ tablicy, która ma jeszcze "stare" węzły z POPRZEDNIEJ gry --
  // realny scenariusz wczytania zapisu w tej samej sesji przeglądarki bez restartu.
  const staleFromPreviousGame = [{ q: -1, r: -1, ownerId: 0, type: 'fort' }];
  const loadFn = new Function('fortNodes', 'saved', realLoad.body);
  loadFn(staleFromPreviousGame, { meta: { fortNodes: jsonRoundTripped } });

  ok(staleFromPreviousGame.length === 2, `część 2c: po wczytaniu fortNodes ma dokładnie 2 węzły (got ${staleFromPreviousGame.length})`);
  eq(staleFromPreviousGame, jsonRoundTripped, 'część 2c: zawartość po wczytaniu identyczna z zapisanym snapshotem (pełny round-trip)');
  ok(!staleFromPreviousGame.some(n => n.q === -1 && n.r === -1),
    'część 2c: stara zawartość fortNodes sprzed wczytania (poprzednia gra) została wyczyszczona (fortNodes.length = 0)');

  // Kompatybilność wsteczna: stary zapis bez pola meta.fortNodes (sprzed kroku 2) -> pusta
  // tablica, zero błędu -- dokładnie to, co gwarantuje komentarz przy odczycie w main.ts.
  const freshForOldSave = [{ q: 7, r: 7, ownerId: 1, type: 'posterunek' }];
  loadFn(freshForOldSave, { meta: {} });
  eq(freshForOldSave, [], 'część 2d: stary zapis bez pola fortNodes wczytuje się z PUSTĄ tablicą (kompatybilność wsteczna, zero błędu)');
}

// ---------------------------------------------------------------------------
// Część 3: weryfikacja mutacyjna -- podmieniamy W PAMIĘCI prawdziwą linię zapisu na
// `fortNodes: [],` (dokładnie MUT-6 z werdyktu Evaluatora rundy 3: "zapis fortNodes do save
// wyzerowany") i prawdziwy blok odczytu na no-op, i potwierdzamy że TA SAMA logika testu
// wykrywa regresję -- dowód, że część 2 nie jest tautologią, tylko faktycznie zależy od treści
// main.ts.
// ---------------------------------------------------------------------------
{
  const zeroedSaveLine = realSrc.slice(
    realSrc.indexOf('fortNodes:', realSrc.indexOf(BUILD_SAVE_SIG)),
    realSrc.indexOf('\n', realSrc.indexOf('fortNodes:', realSrc.indexOf(BUILD_SAVE_SIG))),
  );
  ok(zeroedSaveLine.includes('fortNodes.slice()'), 'część 3 setup: znaleziono prawdziwą linię zapisu do zmutowania');
  const mutatedSrc = realSrc.replace(zeroedSaveLine, 'fortNodes: [],');
  ok(mutatedSrc !== realSrc, 'część 3 setup: podmiana linii zapisu faktycznie zmieniła tekst źródłowy (nie no-op)');

  const mutatedSave = extractSaveRhs(mutatedSrc);
  eq(mutatedSave.rhs, '[]', 'część 3a: ekstrakcja z zmutowanego źródła widzi zerowany zapis `[]`');

  const original = [
    { q: 3, r: -2, ownerId: 1, type: 'fort' },
    { q: 5, r: 5, ownerId: 2, type: 'posterunek' },
  ];
  const mutatedSaveFn = new Function('fortNodes', `return (${mutatedSave.rhs});`);
  const mutatedSnapshot = mutatedSaveFn(original);
  ok(mutatedSnapshot.length === 0,
    `część 3a: MUTACJA ZŁAPANA -- zapis wyzerowany do \`fortNodes: []\` daje snapshot z 0 węzłów zamiast 2 (got ${mutatedSnapshot.length})`);
  ok(mutatedSnapshot.length !== 2,
    'część 3a: asercja "część 2a: serializacja daje 2 węzły" zła­pałaby dokładnie tę regresję na żywym main.ts (0 !== 2)');

  // Ta sama mutacyjna próba po stronie ODCZYTU: no-op zamiast rekonstrukcji fortNodes (drugi
  // sposób, w jaki round-trip może po cichu zgubić dane -- odczyt nigdy nie pushuje).
  const mutatedLoadBody = 'fortNodes.length = 0;\n/* MUT: brak push -- odczyt zignorowany */';
  const mutatedLoadFn = new Function('fortNodes', 'saved', mutatedLoadBody);
  const freshArr = [{ q: -1, r: -1, ownerId: 0, type: 'fort' }];
  mutatedLoadFn(freshArr, { meta: { fortNodes: original } });
  ok(freshArr.length === 0,
    `część 3b: MUTACJA ZŁAPANA -- odczyt bez push() gubi zapisane węzły, fortNodes zostaje pusty zamiast 2 (got ${freshArr.length})`);
}

console.log(`fort-nodes-save-load-test: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
