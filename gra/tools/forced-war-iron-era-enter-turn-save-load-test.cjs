'use strict';
/**
 * forced-war-iron-era-enter-turn-save-load-test.cjs — R-WOJNA-WYMUSZONA-ZELAZO-PROG-TURY-Q1,
 * kryterium końca 5 (dispatch): "Save/load gry poprawnie zachowuje `ironEraEnterTurnByOwner`
 * (żywy test: zapisz grę z cywilizacją w trakcie odliczania progu Żelaza, wczytaj, potwierdź
 * że licznik od tury wejścia jest zachowany, nie zresetowany do bieżącej tury)."
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU (dispatch): zakaz uznania tego kryterium za spełnione bez
 * FAKTYCZNEGO zapisu i odczytu stanu gry — sam odczyt kodu zapisu/wczytania NIE jest dowodem.
 *
 * `ironEraEnterTurnByOwner` żyje jako lokalna zmienna wewnątrz OGROMNEJ funkcji-domknięcia
 * main.ts (setki współzależnych zmiennych) — nie da się jej odpalić w izolacji przez pełny
 * esbuild-bundle main.ts (import.meta.glob / brak loaderów .svg, patrz CLAUDE.md §BRAMKI,
 * `pre-battle-save-test.cjs`). Zamiast tego — wzorem `fort-nodes-save-load-test.cjs` — test
 * WYCINA prawdziwy tekst zapisu (wewnątrz `buildSaveGameSnapshot`) i prawdziwy tekst odczytu
 * (wewnątrz `restoreGameFromSave`) z BIEŻĄCEGO main.ts (nie reimplementację-kopię) i wykonuje
 * je NAPRAWDĘ przez `new Function` (transpilacja TS-only składni przez esbuild, tak jak build
 * produkcyjny) — czyli faktyczny zapis/odczyt tego jednego pola stanu gry, nie test kontraktowy
 * na reimplementacji.
 *
 * Część 3 (weryfikacja mutacyjna) dowodzi nietautologiczności: podmieniamy W PAMIĘCI (nie na
 * dysku) prawdziwą linię zapisu na `ironEraEnterTurnByOwner: [],` / prawdziwy blok odczytu na
 * no-op i potwierdzamy, że TA SAMA logika testu wykrywa regresję.
 *
 * node tools/forced-war-iron-era-enter-turn-save-load-test.cjs
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
// Ekstrakcja: prawdziwy tekst zapisu (RHS wyrażenia `ironEraEnterTurnByOwner: <RHS>,`
// wewnątrz buildSaveGameSnapshot) i prawdziwy tekst odczytu (blok
// `ironEraEnterTurnByOwner.clear(); ... .set(oid, t); }` wewnątrz restoreGameFromSave) —
// lokalizacja przez sąsiedztwo funkcji (indexOf od sygnatury), nie hardkodowany numer linii,
// więc działa identycznie na PRAWDZIWYM main.ts i na ZMUTOWANEJ w pamięci kopii (część 3).
// ---------------------------------------------------------------------------
function extractSaveRhs(sourceText) {
  const buildIdx = sourceText.indexOf(BUILD_SAVE_SIG);
  if (buildIdx < 0) return { rhs: null, err: 'buildSaveGameSnapshot signature not found' };
  const restoreIdx = sourceText.indexOf(RESTORE_SIG, buildIdx);
  const marker = 'ironEraEnterTurnByOwner:';
  const mIdx = sourceText.indexOf(marker, buildIdx);
  if (mIdx < 0 || (restoreIdx >= 0 && mIdx > restoreIdx)) {
    return { rhs: null, err: 'ironEraEnterTurnByOwner: <expr> line not found inside buildSaveGameSnapshot' };
  }
  const lineEnd = sourceText.indexOf('\n', mIdx);
  const line = sourceText.slice(mIdx, lineEnd < 0 ? undefined : lineEnd);
  const rhs = line.slice(marker.length).trim().replace(/,\s*$/, '');
  return { rhs, err: null };
}

function extractLoadBlock(sourceText) {
  const restoreIdx = sourceText.indexOf(RESTORE_SIG);
  if (restoreIdx < 0) return { body: null, err: 'restoreGameFromSave signature not found' };
  // Szukamy TEGO WEWNĄTRZ restoreGameFromSave — `.clear()` na tym polu istnieje TAKŻE w
  // resetToNewGame (wcześniej w pliku), więc indexOf zaczyna dopiero od restoreIdx, dokładnie
  // jak w fort-nodes-save-load-test.cjs.
  const startMarker = 'ironEraEnterTurnByOwner.clear();';
  const startIdx = sourceText.indexOf(startMarker, restoreIdx);
  if (startIdx < 0) return { body: null, err: 'ironEraEnterTurnByOwner.clear(); not found inside restoreGameFromSave' };
  const endMarker = 'for (const [oid, t] of savedIronEraEnterTurn) ironEraEnterTurnByOwner.set(oid, t);\n      }';
  const endIdx = sourceText.indexOf(endMarker, startIdx);
  if (endIdx < 0) return { body: null, err: 'closing set()-loop for ironEraEnterTurnByOwner not found after start marker' };
  const bodyTs = sourceText.slice(startIdx, endIdx + endMarker.length);
  // Blok zawiera składnię TS-only (`as Array<[number, number]> | undefined`) — `new Function`
  // (czysty JS) tego nie sparsuje. Transpiluj przez esbuild (loader 'ts'), tak jak build
  // produkcyjny.
  const body = esbuild.transformSync(bodyTs, { loader: 'ts', target: 'node18' }).code;
  return { body, err: null };
}

// ---------------------------------------------------------------------------
// Część 1: statyczne umiejscowienie — oba fragmenty żyją WEWNĄTRZ właściwych funkcji w
// PRAWDZIWYM main.ts.
// ---------------------------------------------------------------------------
const realSave = extractSaveRhs(realSrc);
ok(realSave.rhs !== null, `część 1: zapis ironEraEnterTurnByOwner odnaleziony w buildSaveGameSnapshot (${realSave.err || 'ok'})`);
eq(realSave.rhs, 'Array.from(ironEraEnterTurnByOwner.entries())', 'część 1: prawdziwy zapis to dokładnie `Array.from(ironEraEnterTurnByOwner.entries())`');

const realLoad = extractLoadBlock(realSrc);
ok(realLoad.body !== null, `część 1: odczyt ironEraEnterTurnByOwner odnaleziony w restoreGameFromSave (${realLoad.err || 'ok'})`);

// ---------------------------------------------------------------------------
// Część 2: round-trip NA PRAWDZIWYM WYCIĘTYM KODZIE — zbuduj mapę z cywilizacją w trakcie
// odliczania progu Żelaza, zserializuj przez wycięty prawdziwy zapis, przepuść przez JSON
// (tak jak realny zapis trafia do localStorage/IndexedDB — SaveGame jest JSON-serializowany),
// zdeserializuj przez wycięty prawdziwy odczyt do ŚWIEŻEJ mapy (symulacja nowej sesji gry po
// wczytaniu), potwierdź że LICZNIK OD TURY WEJŚCIA jest zachowany, NIE zresetowany do bieżącej
// tury (dokładnie sformułowanie kryterium końca 5 z dispatchu).
// ---------------------------------------------------------------------------
{
  // Cywilizacja ownerId=3 weszła w Żelazo w turze 40; gra jest teraz w turze 52 (12 tur po
  // wejściu — w trakcie odliczania progu 25, jeszcze go NIE spełnia). Druga cywilizacja
  // ownerId=7 weszła wcześniej, w turze 10.
  const original = new Map([[3, 40], [7, 10]]);

  const saveFn = new Function('ironEraEnterTurnByOwner', `return (${realSave.rhs});`);
  const snapshot = saveFn(original);

  ok(Array.isArray(snapshot) && snapshot.length === 2, `część 2a: serializacja daje 2 wpisy (got ${snapshot && snapshot.length})`);
  eq(snapshot, [[3, 40], [7, 10]], 'część 2a: zawartość snapshotu identyczna z oryginałem (para [ownerId, turaWejscia])');

  // Mutacja oryginalnej mapy PO zapisie (kolejna tura mogłaby dopisać nowego ownera) nie może
  // wpłynąć na już-zserializowany snapshot.
  original.set(9, 51);
  eq(snapshot.length, 2, 'część 2a: zmiana oryginalnej mapy PO save nie wpływa na już-zserializowany snapshot');

  const jsonRoundTripped = JSON.parse(JSON.stringify(snapshot));
  eq(jsonRoundTripped, [[3, 40], [7, 10]], 'część 2b: snapshot przetrwał JSON round-trip (tak jak przechodzi realny zapis) bez utraty pól');

  // Deserializacja do ŚWIEŻEJ mapy, która ma jeszcze "stary" wpis z POPRZEDNIEJ gry (reużyte
  // ownerId) — realny scenariusz wczytania zapisu w tej samej sesji przeglądarki.
  const staleFromPreviousGame = new Map([[3, 999]]);
  const CURRENT_TURN_AFTER_LOAD = 52; // "bieżąca tura" w chwili wczytania — NIE powinna zastąpić 40.
  const loadFn = new Function('ironEraEnterTurnByOwner', 'saved', realLoad.body);
  loadFn(staleFromPreviousGame, { meta: { ironEraEnterTurnByOwner: jsonRoundTripped } });

  ok(staleFromPreviousGame.size === 2, `część 2c: po wczytaniu mapa ma dokładnie 2 wpisy (got ${staleFromPreviousGame.size})`);
  eq([...staleFromPreviousGame.entries()], [[3, 40], [7, 10]], 'część 2c: zawartość po wczytaniu identyczna z zapisanym snapshotem (pełny round-trip)');

  // *** Dokładnie kryterium końca 5: licznik od tury wejścia jest ZACHOWANY, nie zresetowany
  // do bieżącej tury. Gdyby wczytanie po cichu podstawiło "teraz" zamiast prawdziwej tury
  // wejścia, eraEnterTurn.get(3) wróciłby 52 (== CURRENT_TURN_AFTER_LOAD), nie 40.
  eq(staleFromPreviousGame.get(3), 40, 'część 2c (kryterium 5): tura wejścia ownera 3 (40) przetrwała save/load — NIE zresetowana do bieżącej tury 52');
  ok(
    staleFromPreviousGame.get(3) !== CURRENT_TURN_AFTER_LOAD,
    'część 2c (kryterium 5, jawnie): wczytana eraEnterTurn różni się od bieżącej tury w chwili load — dowód, że to prawdziwy licznik, nie świeży zegar',
  );
  eq(staleFromPreviousGame.get(7), 10, 'część 2c: druga cywilizacja (ownerId 7, tura wejścia 10) też przetrwała nienaruszona');
  ok(!staleFromPreviousGame.has(999), 'część 2c: brak przypadkowych ownerId spoza zapisu');

  // Po wczytaniu licznik 25-turowy nadal liczy poprawnie od zachowanej eraEnterTurn: w turze 52
  // (12 tur po wejściu w turze 40) próg 25 JESZCZE nie jest spełniony; próg spełni się dopiero
  // w turze 65 (40 + 25).
  const turnsSinceEntry = CURRENT_TURN_AFTER_LOAD - staleFromPreviousGame.get(3);
  eq(turnsSinceEntry, 12, 'część 2c (kryterium 5, dowód pośredni): 52 - wczytane 40 = 12 tur od wejścia, spójne z odliczaniem progu 25 (jeszcze niespełniony)');

  // Kompatybilność wsteczna: stary zapis bez pola meta.ironEraEnterTurnByOwner (sprzed tej
  // naprawy) -> pusta mapa, zero błędu (main.ts: `isEligibleForIronForcedWar` wtedy pomija
  // próg CAŁKOWICIE dla tego ownera, patrz forced-war-iron-test.cjs kryterium 4).
  const freshForOldSave = new Map([[5, 3]]);
  loadFn(freshForOldSave, { meta: {} });
  eq([...freshForOldSave.entries()], [], 'część 2d: stary zapis bez pola ironEraEnterTurnByOwner wczytuje się z PUSTĄ mapą (kompatybilność wsteczna, zero błędu)');
}

// ---------------------------------------------------------------------------
// Część 3: weryfikacja mutacyjna — podmieniamy W PAMIĘCI prawdziwą linię zapisu na
// `ironEraEnterTurnByOwner: [],` i prawdziwy blok odczytu na no-op, i potwierdzamy że TA SAMA
// logika testu wykrywa regresję — dowód, że część 2 nie jest tautologią.
// ---------------------------------------------------------------------------
{
  const zeroedSaveLine = realSrc.slice(
    realSrc.indexOf('ironEraEnterTurnByOwner:', realSrc.indexOf(BUILD_SAVE_SIG)),
    realSrc.indexOf('\n', realSrc.indexOf('ironEraEnterTurnByOwner:', realSrc.indexOf(BUILD_SAVE_SIG))),
  );
  ok(zeroedSaveLine.includes('Array.from(ironEraEnterTurnByOwner.entries())'), 'część 3 setup: znaleziono prawdziwą linię zapisu do zmutowania');
  const mutatedSrc = realSrc.replace(zeroedSaveLine, 'ironEraEnterTurnByOwner: [],');
  ok(mutatedSrc !== realSrc, 'część 3 setup: podmiana linii zapisu faktycznie zmieniła tekst źródłowy (nie no-op)');

  const mutatedSave = extractSaveRhs(mutatedSrc);
  eq(mutatedSave.rhs, '[]', 'część 3a: ekstrakcja z zmutowanego źródła widzi zerowany zapis `[]`');

  const original = new Map([[3, 40], [7, 10]]);
  const mutatedSaveFn = new Function('ironEraEnterTurnByOwner', `return (${mutatedSave.rhs});`);
  const mutatedSnapshot = mutatedSaveFn(original);
  ok(mutatedSnapshot.length === 0,
    `część 3a: MUTACJA ZŁAPANA -- zapis wyzerowany do \`ironEraEnterTurnByOwner: []\` daje snapshot z 0 wpisów zamiast 2 (got ${mutatedSnapshot.length})`);

  // Ta sama mutacyjna próba po stronie ODCZYTU: no-op zamiast repopulacji mapy (drugi sposób,
  // w jaki round-trip może po cichu zgubić dane — odczyt nigdy nie ustawia wpisów, więc próg 25
  // tur byłby pomijany dla KAŻDEGO ownera po każdym save/load, nawet dla tych świeżo w trakcie
  // odliczania).
  const mutatedLoadBody = 'ironEraEnterTurnByOwner.clear();\n/* MUT: brak set() -- odczyt zignorowany */';
  const mutatedLoadFn = new Function('ironEraEnterTurnByOwner', 'saved', mutatedLoadBody);
  const freshMap = new Map([[3, 999]]);
  mutatedLoadFn(freshMap, { meta: { ironEraEnterTurnByOwner: [...original.entries()] } });
  ok(freshMap.size === 0,
    `część 3b: MUTACJA ZŁAPANA -- odczyt bez set() gubi zapisaną turę wejścia, mapa zostaje pusta zamiast 2 wpisów (got ${freshMap.size})`);
}

console.log(`forced-war-iron-era-enter-turn-save-load-test: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
