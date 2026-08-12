'use strict';
/**
 * map-snapshot-load-test.cjs
 *
 * P-WCZYTYWANIE-REGENERUJE-MAPE-OD-ZERA (Maciej, ECHO A): zapis niesie teraz
 * pełną siatkę heksów (SaveGame.mapSnapshot); wczytanie z nowego formatu MUSI
 * zbudować mapę wprost z tego snapshotu, BEZ ponownego wołania generatora
 * (generujSwiatAsync) -- stary cel tej naprawy (wczytywanie tak samo wolne
 * jak nowa gra, bo dziś regeneruje mapę od zera z ziarna).
 *
 * RUNDA 2 (Evaluator FAIL, bloker): surowy JSON.stringify(map.hexes) dla mapy
 * `standardowy` (168x120=20160 heksów) to ~4,1 MB znaków ~= 8,6 MB w UTF-16 --
 * ponad limit ~5 MB/origin localStorage w Chromium. Naprawa (Maciej, ECHO A):
 * mapSnapshot.ts koduje teraz mapę w formacie kolumnowym (structure-of-
 * -arrays) + słownik/interning stringów (`dict`) zamiast tablicy obiektów z
 * powtórzonymi kluczami/wartościami tekstowymi -- patrz nagłówek
 * mapSnapshot.ts po pełne uzasadnienie. Sekcja 5 niżej dodaje bramkę na
 * PRAWDZIWEJ mapie `standardowy` (168x120), nie tylko małej 36x28 z sekcji 4
 * (Evaluator: luka w bramce -- mała mapa nie łapie regresji rozmiaru).
 *
 * Zakres testu (moduły czyste, bez DOM/THREE -- main.ts się nie bundluje):
 *   1. Roundtrip zapis->wczytanie NOWEGO formatu:
 *      map -> serializeMapForSave -> SaveGame.mapSnapshot -> serializeGame
 *      (prawdziwy JSON.stringify) -> deserializeGame (prawdziwy JSON.parse)
 *      -> loadMapForSave(saved, genFn) z genFn=licznik wywołań.
 *      Asercja twarda: genFn.calls === 0 (generator NIE wołany) ORAZ
 *      map.hexes po roundtripie jest STRUKTURALNIE IDENTYCZNA z oryginałem
 *      (włącznie z polami dynamicznymi spoza typu Hex: zloze/zlozeMinEra,
 *      ulepszenia/improvementKey -- patrz mapSnapshot.ts, dlaczego `hexes`
 *      NIE jest rekonstruowane pole-po-polu -- oraz widocznosc per gracz).
 *      Porównanie STRUKTURALNE (canonicalJson, klucze sortowane), nie goły
 *      JSON.stringify -- kolejność heksów/pól nie jest częścią kontraktu
 *      (patrz mapSnapshot.ts: "kolejność heksów nieistotna").
 *   2. Wsteczna kompatybilność -- STARY zapis (fixture BEZ mapSnapshot, jak
 *      każdy zapis sprzed tej naprawy): loadMapForSave(saved, genFn) MUSI
 *      wywołać genFn (dokładnie 1x) i zwrócić jego wynik -- zero regresji
 *      dla zapisów graczy sprzed tej zmiany.
 *   3. isValidMapSnapshot odrzuca uszkodzone/niepełne snapshoty (fallback na
 *      generator zamiast cichej złej mapy) -- wymiary <=0, zły `fmt`,
 *      niespójne długości kolumn, riverPaths nie-tablica.
 *   4. Roundtrip prawdziwej (wygenerowanej) małej mapy 36x28 -- szybkie,
 *      łapie pola nie-JSON-safe.
 *   5. Roundtrip + rozmiar PRAWDZIWEJ mapy `standardowy` (168x120=20160
 *      heksów) -- współczynnik kompresji i twardy limit rozmiaru pod
 *      localStorage (z zapasem, RAZEM z reprezentatywną resztą stanu zapisu).
 *
 * Usage (z gra/): node tools/map-snapshot-load-test.cjs
 */

const path = require('path');
const fs = require('fs');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_DIR = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.map-snapshot-load-entry.ts');
const BUNDLE = path.join(__dirname, '.map-snapshot-load-bundle.cjs');

let pass = 0;
let fail = 0;
// Runda 3 (Evaluator, punkt 4b): licznik ODDZIELNY od `fail` -- bloker
// architektury rotacji autozapisu (AUTOSAVE_ROT_COUNT) jest ŚWIADOMIE poza
// zakresem tej naprawy (wymaga ABC właściciela), więc jego wykrycie MUSI być
// WIDOCZNE w wyniku testu, ale NIE MOŻE przerywać exit code (nie blokuje
// pozostałych napraw tej rundy). Patrz sekcja 5b.
// / EN: round 3 (Evaluator, point 4b): counter SEPARATE from `fail` -- the
// autosave rotation architecture blocker (AUTOSAVE_ROT_COUNT) is DELIBERATELY
// out of scope for this fix (needs owner ABC), so detecting it must be
// VISIBLE in the test output but must NOT flip the exit code. See section 5b.
let knownFailures = 0;
function assert(cond, msg) {
  if (cond) {
    pass++;
    console.log('  [OK]', msg);
  } else {
    fail++;
    console.error('  [FAIL]', msg);
  }
}

/**
 * Porównanie STRUKTURALNE (nie zależne od kolejności kluczy) -- serializuje
 * dowolną wartość do JSON z kluczami obiektów posortowanymi rekurencyjnie.
 * Używane zamiast gołego JSON.stringify(a) === JSON.stringify(b), bo
 * kolejność pól/heksów nie jest częścią kontraktu round-tripu (patrz
 * mapSnapshot.ts: "kolejność heksów nieistotna, o ile da się je jednoznacznie
 * zrekonstruować po q,r") -- goły JSON.stringify łapałby fałszywe FAILe przy
 * każdej przyszłej zmianie kolejności pól w implementacji.
 */
function canonicalJson(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalJson(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

fs.writeFileSync(
  ENTRY,
  [
    "export { serializeMapForSave, buildGameMapFromSnapshot, isValidMapSnapshot } from '../src/map/mapSnapshot.ts';",
    "export { loadMapForSave } from '../src/game/load-map-source.ts';",
    "export { serializeGame, deserializeGame, SAVE_VERSION, SAVE_PREFIX, SAVE_META_PREFIX } from '../src/game/save.ts';",
    "export { generateMap } from '../src/map/generator.ts';",
    '',
  ].join('\n'),
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: GRA_DIR,
  logLevel: 'silent',
});

const {
  serializeMapForSave, buildGameMapFromSnapshot, isValidMapSnapshot,
  loadMapForSave, serializeGame, deserializeGame, SAVE_VERSION,
  SAVE_PREFIX, SAVE_META_PREFIX,
  generateMap,
} = require(BUNDLE);
fs.unlinkSync(ENTRY);

// ---------------------------------------------------------------------------
// 0. SAVE_META_PREFIX rozłączny z SAVE_PREFIX (runda 3, Evaluator, punkt 3) --
//    stary SAVE_META_PREFIX='thegame.save.meta.' BYŁ podprefiksem SAVE_PREFIX
//    ='thegame.save.' mimo komentarza twierdzącego inaczej -- listSaves()
//    zwracał fantomowy slot 'meta.<realSlot>'. Sprawdzamy to explicit.
// ---------------------------------------------------------------------------
console.log('--- 0. SAVE_META_PREFIX rozłączny z SAVE_PREFIX ---');
assert(!SAVE_META_PREFIX.startsWith(SAVE_PREFIX), 'SAVE_META_PREFIX (' + SAVE_META_PREFIX + ') NIE jest podprefiksem SAVE_PREFIX (' + SAVE_PREFIX + ') -- listSaves() nie zwróci fantomowego slotu meta.<realSlot>');
console.log('');

// ---------------------------------------------------------------------------
// Fixture: mała mapa z przykładem KAŻDEGO rodzaju mutacji rozgrywki, żeby
// roundtrip łapał wszystkie kategorie pól (nie tylko teren bazowy) -- w tym
// widocznosc per gracz (typ na to pozwala, generator dziś zawsze zostawia
// {}, ale round-trip musi to obsłużyć poprawnie, patrz mapSnapshot.ts).
// ---------------------------------------------------------------------------
function buildFixtureMap() {
  const hexes = {
    '0,0': {
      coords: { q: 0, r: 0 },
      terenBazowy: 'rownina',
      nakladka: 'brak', // las wycięty gameplayem (finalizeHexClearing) -- NIE regeneruje się z seed
      ulepszenie: 'farma',
      wlasciciel: 'p0',
      wioska: { istnieje: false, ludnosc: 0 }, // złupiona
      widocznosc: {},
      rzeka: { obecna: true, krawedzie: [1, 3] },
      // Pola dynamiczne spoza typu Hex bazowego (deposit-era.ts / syncHexUlepszenieFields) --
      // MUSZĄ przetrwać roundtrip, bo hexes nie jest rekonstruowane pole-po-polu.
      zloze: 'ruda',
      zlozeMinEra: 2,
      ulepszenia: ['farma'],
      improvementKey: 'farma',
    },
    '1,0': {
      coords: { q: 1, r: 0 },
      terenBazowy: 'wzgorza',
      nakladka: 'las',
      ulepszenie: 'brak',
      wlasciciel: null,
      wioska: { istnieje: true, ludnosc: 2 },
      // widocznosc per gracz -- pole dziś nieużywane przez generator (zawsze {}),
      // ale typ Record<string,Widocznosc> na to pozwala -- musi przetrwać round-trip.
      widocznosc: { p0: 'widoczny', p1: 'odkryty' },
      rzeka: { obecna: false, krawedzie: [] },
    },
  };
  return {
    szerokoscQ: 2,
    wysokoscR: 1,
    hexes,
    seed: 12345,
    riverPaths: [[{ q: 0, r: 0 }, { q: 1, r: 0 }]],
    riverPathKinds: ['main'],
  };
}

function fakeSave(overrides) {
  return Object.assign({
    wersja: SAVE_VERSION,
    tura: 5,
    seed: 12345,
    units: [],
    cities: [],
    explored: ['0,0'],
    meta: { label: 'test' },
  }, overrides);
}

// ---------------------------------------------------------------------------
// 1. Roundtrip: serializeMapForSave -> SaveGame -> JSON -> deserializeGame
//    -> loadMapForSave. Generator NIE wołany; hexes strukturalnie identyczna.
// ---------------------------------------------------------------------------
console.log('--- 1. Roundtrip zapis -> wczytanie (nowy format kolumnowy, mapSnapshot obecny) ---');

const originalMap = buildFixtureMap();
const snap = serializeMapForSave(originalMap);
assert(snap.fmt === 2, 'serializeMapForSave zwraca fmt=2 (format kolumnowy/słownikowy)');
assert(Array.isArray(snap.dict) && snap.dict.length > 0, 'snapshot zawiera niepusty słownik stringów (dict)');
assert(Array.isArray(snap.q) && snap.q.length === 2 && Array.isArray(snap.r) && snap.r.length === 2, 'kolumny q/r mają długość = liczbie heksów');

const saveWithMap = fakeSave({ mapSnapshot: snap });

const json = serializeGame(saveWithMap);
assert(typeof json === 'string' && json.length > 0, 'serializeGame produkuje niepusty JSON string');
assert(json.includes('"mapSnapshot"'), 'JSON zapisu zawiera pole mapSnapshot');

const restoredSave = deserializeGame(json);
assert(!!restoredSave.mapSnapshot, 'deserializeGame zachowuje mapSnapshot (nie gubi go w normalizacji)');
assert(isValidMapSnapshot(restoredSave.mapSnapshot), 'mapSnapshot po roundtripie JSON przechodzi isValidMapSnapshot');

let genCalls = 0;
async function mockGenFail() {
  genCalls++;
  throw new Error('generujSwiatAsync NIE POWINNO być wołane -- mapSnapshot jest poprawny');
}

(async () => {
  const result = await loadMapForSave(restoredSave, mockGenFail);
  assert(genCalls === 0, 'loadMapForSave NIE wywołało generatora, gdy mapSnapshot jest poprawny (calls=' + genCalls + ')');
  assert(result.usedSnapshot === true, 'loadMapForSave zwraca usedSnapshot=true dla nowego formatu');

  const gotHexes = result.map.hexes;
  assert(
    canonicalJson(gotHexes) === canonicalJson(originalMap.hexes),
    'map.hexes po roundtripie jest STRUKTURALNIE identyczna z oryginałem (canonicalJson porównanie, kolejność kluczy nieistotna)',
  );
  assert(
    gotHexes['0,0'].zloze === 'ruda' && gotHexes['0,0'].zlozeMinEra === 2,
    'pola dynamiczne spoza Hex bazowego (zloze/zlozeMinEra) przetrwały roundtrip',
  );
  assert(
    Array.isArray(gotHexes['0,0'].ulepszenia) && gotHexes['0,0'].ulepszenia[0] === 'farma',
    'pole dynamiczne ulepszenia przetrwało roundtrip',
  );
  assert(gotHexes['0,0'].wioska.istnieje === false, 'wioska złupiona (istnieje=false) przetrwała roundtrip -- BEZ replaya lootedVillageHexKeys');
  assert(gotHexes['1,0'].nakladka === 'las', 'las NIEwycięty (hex 1,0) przetrwał roundtrip bez zmian');
  assert(
    gotHexes['1,0'].widocznosc.p0 === 'widoczny' && gotHexes['1,0'].widocznosc.p1 === 'odkryty',
    'widocznosc per gracz (hex 1,0) przetrwała roundtrip',
  );
  assert(result.map.szerokoscQ === 2 && result.map.wysokoscR === 1, 'wymiary mapy przetrwały roundtrip');
  assert(result.map.seed === 12345, 'seed przetrwał roundtrip');
  assert(
    JSON.stringify(result.map.riverPaths) === JSON.stringify(originalMap.riverPaths)
    && JSON.stringify(result.map.riverPathKinds) === JSON.stringify(originalMap.riverPathKinds),
    'riverPaths/riverPathKinds przetrwały roundtrip',
  );

  console.log('');

  // ---------------------------------------------------------------------------
  // 2. Wsteczna kompatybilność -- STARY zapis (bez mapSnapshot) MUSI wołać
  //    genFn dokładnie raz i zwrócić dokładnie to, co on zwrócił.
  // ---------------------------------------------------------------------------
  console.log('--- 2. Wsteczna kompatybilność: stary zapis (bez mapSnapshot) -> regeneracja z seed ---');

  const oldSave = fakeSave({}); // brak pola mapSnapshot -- fixture "zapis sprzed tej naprawy"
  const oldJson = serializeGame(oldSave);
  const oldRestored = deserializeGame(oldJson);
  assert(oldRestored.mapSnapshot === undefined, 'stary zapis (bez mapSnapshot) deserializuje się z mapSnapshot=undefined');

  const regeneratedMap = { szerokoscQ: 2, wysokoscR: 1, hexes: { '0,0': { fake: 'regenerated-from-seed' } }, seed: 12345, riverPaths: [] };
  let oldGenCalls = 0;
  async function mockGenOk() {
    oldGenCalls++;
    return regeneratedMap;
  }
  const oldResult = await loadMapForSave(oldRestored, mockGenOk);
  assert(oldGenCalls === 1, 'loadMapForSave WOŁA generator dokładnie raz dla starego zapisu (calls=' + oldGenCalls + ')');
  assert(oldResult.usedSnapshot === false, 'loadMapForSave zwraca usedSnapshot=false dla starego formatu');
  assert(oldResult.map === regeneratedMap, 'loadMapForSave zwraca DOKŁADNIE to, co zwrócił generator (regeneracja z seed, zero zmian zachowania)');

  console.log('');

  // ---------------------------------------------------------------------------
  // 3. isValidMapSnapshot -- odrzuca uszkodzone snapshoty, fallback na genFn.
  // ---------------------------------------------------------------------------
  console.log('--- 3. isValidMapSnapshot: odrzuca uszkodzone/niepełne snapshoty ---');

  assert(isValidMapSnapshot(null) === false, 'null -> invalid');
  assert(isValidMapSnapshot(undefined) === false, 'undefined -> invalid');
  assert(isValidMapSnapshot({}) === false, 'obiekt pusty -> invalid');
  assert(isValidMapSnapshot({ fmt: 1, szerokoscQ: 2, wysokoscR: 1, seed: 1, riverPaths: [], n: 1, dict: [] }) === false, 'fmt != 2 (stary format rundy 1, nigdy niewdrożony) -> invalid');
  assert(isValidMapSnapshot({ ...snap, szerokoscQ: 0 }) === false, 'szerokoscQ<=0 -> invalid');
  assert(isValidMapSnapshot({ ...snap, n: 0 }) === false, 'n<=0 -> invalid');
  assert(isValidMapSnapshot({ ...snap, riverPaths: 'nope' }) === false, 'riverPaths nie-tablica -> invalid');
  assert(isValidMapSnapshot({ ...snap, q: snap.q.slice(1) }) === false, 'kolumna q krótsza niż n -> invalid (niespójne długości)');
  assert(isValidMapSnapshot({ ...snap, zloze: { hexIdx: [0], val: [] } }) === false, 'kolumna rzadka zloze z niezgodną długością hexIdx/val -> invalid');
  assert(isValidMapSnapshot({ ...snap, widocznosc: { hexIdx: [0], playerIdx: [], valIdx: [] } }) === false, 'widocznosc z niezgodnymi długościami -> invalid');
  assert(isValidMapSnapshot(snap) === true, 'snapshot poprawnej mapy fixture -> valid');

  const corruptSave = fakeSave({ mapSnapshot: { fmt: 2, szerokoscQ: 0, wysokoscR: 0, seed: 1, riverPaths: [], n: 0, dict: [] } });
  let corruptGenCalls = 0;
  async function mockGenForCorrupt() { corruptGenCalls++; return regeneratedMap; }
  const corruptResult = await loadMapForSave(corruptSave, mockGenForCorrupt);
  assert(corruptGenCalls === 1, 'mapSnapshot uszkodzony -> loadMapForSave spada na generator (fallback), nie cichą złą mapę');
  assert(corruptResult.usedSnapshot === false, 'mapSnapshot uszkodzony -> usedSnapshot=false');

  console.log('');

  // ---------------------------------------------------------------------------
  // 3b. Snapshot z POPRAWNYM kształtem (przechodzi isValidMapSnapshot), ale
  //     NIESPÓJNĄ WARTOŚCIĄ wewnątrz kolumny rzadkiej (hexIdx poza zakresem
  //     hexList) -- isValidMapSnapshot celowo NIE sprawdza wartości (patrz
  //     komentarz przy funkcji, koszt na dużych mapach), więc taki snapshot
  //     przechodzi walidację kształtu i trafia do buildGameMapFromSnapshot,
  //     która rzuca (Evaluator runda 3, punkt 1): `hexList[999]` jest
  //     `undefined` (n=2), `.zloze = ...` na `undefined` -> TypeError.
  //
  //     DECYZJA WŁAŚCICIELA N1 (Maciej, 2026-08-11): cichy fallback na inny,
  //     regenerowany świat (wprowadzony rundą 3) jest COFNIĘTY -- taki
  //     przypadek (kształt OK, budowa rzuca) ma teraz dawać TWARDY BŁĄD:
  //     loadMapForSave NIE łapie już wyjątku, propaguje go NIEZMIENIONY do
  //     wywołującego (main.ts::regenerateWorldForLoad -> diagError('load',
  //     ...), przerwanie wczytywania + powrót do menu). Sekcja asercjonuje
  //     PRZECIWNIE niż w rundzie 3: genFn NIE jest wołany (zero fallbacku) i
  //     loadMapForSave rzuca dokładnie ten sam wyjątek, co
  //     buildGameMapFromSnapshot.
  // ---------------------------------------------------------------------------
  console.log('--- 3b. buildGameMapFromSnapshot rzuca na niespójnym indeksie -> loadMapForSave PROPAGUJE wyjątek (twardy błąd, bez fallbacku) ---');

  const brokenIndexSnap = { ...snap, zloze: { hexIdx: [999], val: [0] } };
  assert(isValidMapSnapshot(brokenIndexSnap) === true, 'snapshot z hexIdx poza zakresem nadal przechodzi isValidMapSnapshot (sprawdza tylko kształt, nie wartości)');

  let brokenThrew = false;
  try {
    buildGameMapFromSnapshot(brokenIndexSnap);
  } catch (e) {
    brokenThrew = true;
  }
  assert(brokenThrew === true, 'buildGameMapFromSnapshot RZUCA na hexIdx poza zakresem (demonstracja luki sprzed naprawy punktu 1)');

  const brokenSave = fakeSave({ mapSnapshot: brokenIndexSnap });
  let brokenGenCalls = 0;
  async function mockGenForBroken() { brokenGenCalls++; return regeneratedMap; }
  let loadMapForSaveThrew = false;
  let loadMapForSaveThrownErr = null;
  try {
    await loadMapForSave(brokenSave, mockGenForBroken);
  } catch (e) {
    loadMapForSaveThrew = true;
    loadMapForSaveThrownErr = e;
  }
  assert(loadMapForSaveThrew === true, 'loadMapForSave: mapSnapshot kształtowo poprawny, ale buildGameMapFromSnapshot rzuca -> wyjątek PROPAGUJE się do wywołującego (decyzja N1, twardy błąd zamiast cichego fallbacku)');
  assert(brokenGenCalls === 0, 'loadMapForSave: genFn NIE jest wołany, gdy budowa ze snapshotu rzuca (zero cichego fallbacku na inną mapę)');
  assert(!!loadMapForSaveThrownErr, 'loadMapForSave propaguje realny obiekt wyjątku (nie undefined/cichą porażkę)');

  console.log('');

  // ---------------------------------------------------------------------------
  // 4. Prawdziwa mapa z generatora (nie syntetyczny fixture) -- łapie ewentualne
  //    pola nie-JSON-safe (funkcje, Date, Map/Set) które syntetyczny fixture
  //    mógłby przeoczyć. Mała mapa (36x28, DEFAULT) -- szybka i deterministyczna.
  // ---------------------------------------------------------------------------
  console.log('--- 4. Roundtrip prawdziwej mapy z generateMap() (36x28, seed=777) ---');

  const realMap = generateMap(36, 28, 777, 'kontynenty');
  const realHexCount = Object.keys(realMap.hexes).length;
  assert(realHexCount > 100, 'generateMap produkuje realną mapę (hexCount=' + realHexCount + ')');

  const realSnap = serializeMapForSave(realMap);
  const realSaveJson = serializeGame(fakeSave({ mapSnapshot: realSnap }));
  assert(typeof realSaveJson === 'string', 'JSON.stringify realnej mapy nie rzuca (brak pól nie-JSON-safe: funkcji/Date/Map/Set)');

  const realRestored = deserializeGame(realSaveJson);
  let realGenCalls = 0;
  async function mockGenFailReal() { realGenCalls++; throw new Error('nie powinno być wołane'); }
  const realResult = await loadMapForSave(realRestored, mockGenFailReal);
  assert(realGenCalls === 0, 'realna mapa: generator NIE wołany przy wczytywaniu mapSnapshot');
  assert(
    canonicalJson(realResult.map.hexes) === canonicalJson(realMap.hexes),
    'realna mapa 36x28: hexes po pełnym roundtripie (JSON.stringify -> JSON.parse -> loadMapForSave) strukturalnie identyczna z oryginałem',
  );
  assert(
    Object.keys(realResult.map.hexes).length === realHexCount,
    'realna mapa 36x28: liczba heksów po roundtripie niezmieniona (' + realHexCount + ')',
  );

  console.log('');

  // ---------------------------------------------------------------------------
  // 5. PRAWDZIWA mapa `standardowy` (168x120=20160 heksów) -- kompresja +
  //    limit rozmiaru. Evaluator (runda 2): sekcja 4 (36x28) NIE łapie
  //    regresji rozmiaru na mapie domyślnego rozmiaru gry -- ta sekcja tak.
  //    generateMap(168,120,...) trwa ~110-120s (deterministyczny, ale wolny
  //    generator terenu/rzek) -- świadomie akceptowane, to jedyny sposób na
  //    zmierzenie PRAWDZIWEGO rozmiaru na mapie, którą gra faktycznie tworzy
  //    domyślnie (Evaluator odrzucił wcześniej pomiar na małej mapie jako
  //    niewystarczający dowód).
  // ---------------------------------------------------------------------------
  console.log('--- 5. Roundtrip + rozmiar PRAWDZIWEJ mapy standardowy (168x120, seed=777) ---');
  console.log('    (generateMap na 168x120 trwa ~110-120s, deterministyczny generator terenu/rzek -- proszę czekać)');

  const stdT0 = Date.now();
  const stdMap = generateMap(168, 120, 777, 'kontynenty');
  console.log('    generateMap(168,120) took ' + (Date.now() - stdT0) + ' ms');

  const stdHexCount = Object.keys(stdMap.hexes).length;
  assert(stdHexCount === 168 * 120, 'mapa standardowy ma dokładnie 168*120=20160 heksów (got ' + stdHexCount + ')');

  // "Przed": surowy JSON.stringify(map.hexes) -- dokładnie to, co Evaluator zmierzył
  // jako bloker rundy 1 (~4,1 MB znaków / ~8,6 MB UTF-16, ponad limit localStorage).
  const rawHexesJson = JSON.stringify(stdMap.hexes);

  // "Po": nowy format kolumnowy/słownikowy (runda 2).
  const stdSnap = serializeMapForSave(stdMap);
  const compressedJson = JSON.stringify(stdSnap);

  const reductionFactor = rawHexesJson.length / compressedJson.length;
  console.log(
    '    RAW hexes JSON: ' + rawHexesJson.length + ' znaków (' + (rawHexesJson.length / 1024 / 1024).toFixed(3) + ' MB)'
    + ' | COMPRESSED mapSnapshot JSON: ' + compressedJson.length + ' znaków (' + (compressedJson.length / 1024 / 1024).toFixed(3) + ' MB)'
    + ' | redukcja: ' + reductionFactor.toFixed(2) + 'x',
  );

  assert(rawHexesJson.length > 3.5 * 1024 * 1024, 'RAW hexes JSON mapy standardowy jest w oczekiwanym rzędzie wielkości (>3,5 MB znaków) -- potwierdza punkt odniesienia z rundy 1');
  assert(reductionFactor >= 5, 'kompresja rundy 2 daje redukcję >= 5x względem surowego JSON.stringify(hexes) (cel: rząd 5-10x, got ' + reductionFactor.toFixed(2) + 'x)');
  // Zapas: sam mapSnapshot (bez reszty stanu zapisu) MUSI zmieścić się dużo
  // poniżej limitu -5MB/origin -- 1,5 MB znaków to ~3 MB UTF-16, jeszcze
  // zostawia >2 MB UTF-16 na resztę SaveGame (sekcja niżej) w budżecie 5 MB.
  assert(compressedJson.length < 1.5 * 1024 * 1024, 'mapSnapshot skompresowany mapy standardowy < 1,5 MB znaków (got ' + (compressedJson.length / 1024 / 1024).toFixed(3) + ' MB)');

  // Roundtrip pełny na PRAWDZIWEJ mapie standardowy (nie tylko rozmiar -- też poprawność).
  const stdSaveJson = serializeGame(fakeSave({ mapSnapshot: stdSnap, explored: Object.keys(stdMap.hexes) }));
  const stdRestored = deserializeGame(stdSaveJson);
  let stdGenCalls = 0;
  async function mockGenFailStd() { stdGenCalls++; throw new Error('nie powinno być wołane'); }
  const stdResult = await loadMapForSave(stdRestored, mockGenFailStd);
  assert(stdGenCalls === 0, 'mapa standardowy: generator NIE wołany przy wczytywaniu mapSnapshot');
  assert(
    canonicalJson(stdResult.map.hexes) === canonicalJson(stdMap.hexes),
    'mapa standardowy: hexes po pełnym roundtripie (JSON.stringify -> JSON.parse -> loadMapForSave) strukturalnie identyczna z oryginałem (20160 heksów)',
  );

  // ---------------------------------------------------------------------------
  // 5b. Rozmiar CAŁEGO zapisu (mapSnapshot + reprezentatywna reszta stanu gry)
  //     -- Evaluator: "policz go z prawdziwego serializeGame całej gry, nie
  //     tylko mapy". Brak żywej rozgrywki do zmierzenia w tym harnessie (moduły
  //     czyste, main.ts się nie bundluje) -- budujemy CELOWO HOJNĄ syntetyczną
  //     resztę stanu (więcej jednostek/miast/budynków niż typowa gra), żeby
  //     próg miał realny margines bezpieczeństwa, nie optymistyczne zero.
  //
  //     KOREKTA JEDNOSTEK (runda 3, Evaluator, punkt 4a): poprzedni próg
  //     2,5 mln znaków był OPISANY jako "połowa limitu ~5 MB UTF-16", ale
  //     matematycznie to CAŁY limit (string .length liczy jednostki UTF-16;
  //     2,5 mln znaków x 2 bajty/znak UTF-16 = 5 MB), nie jego połowa.
  //     ORIGIN_LIMIT_UTF16_CHARS niżej to CAŁY budżet originu w jednostkach
  //     .length (2,5 mln znaków = ~5 MB UTF-16); PROG_CHARS to jego POŁOWA
  //     (1,25 mln znaków = ~2,5 MB UTF-16) na JEDEN zapis -- zapas x2, bo:
  //     (a) gracz może mieć kilka nazwanych zapisów jednocześnie w tym samym
  //     originie, (b) autozapis rotacyjny (main.ts AUTOSAVE_ROT_COUNT, patrz
  //     odczyt niżej) w fallbacku bez FSA trzyma wiele kopii naraz -- osobny,
  //     pre-istniejący temat architektury rotacji, poza zakresem tej naprawy
  //     (patrz asercja agregatowa 5c niżej, ŚWIADOMIE czerwona/ostrzegawcza).
  //     Definiowanie PROG_CHARS jako przeliczenie z ORIGIN_LIMIT_UTF16_CHARS
  //     (a nie osobna literalna stała) ma nie dopuścić do powtórki tego
  //     samego błędu jednostek w przyszłej zmianie.
  // ---------------------------------------------------------------------------
  console.log('');
  console.log('--- 5b. Rozmiar CAŁEGO zapisu: mapSnapshot standardowy + reprezentatywna reszta stanu ---');

  function buildBig(prefix, n, fields) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(fields(i, prefix + i));
    return out;
  }
  const OWNER_COUNT = 8;
  const bigUnits = buildBig('u', 120, (i, id) => ({
    id, ownerId: i % OWNER_COUNT, typeId: 'legionista', category: 'infantry',
    q: i % 168, r: Math.floor(i / 168) % 120, ruch: 2, ruchLeft: 2,
    hp: 100, embarked: false, sentry: false,
  }));
  const bigCities = buildBig('c', 32, (i, id) => ({
    id, ownerId: i % OWNER_COUNT, q: i % 168, r: Math.floor(i / 168) % 120,
    name: 'Miasto ' + i, population: 8, magazynZywnosci: 40,
    surowce: { drewno: 20, kamien: 15, glina: 5, ruda: 3 },
    maMur: true, oblegane: false,
  }));
  const cityBuilt = {};
  const cityProd = {};
  for (const c of bigCities) {
    cityBuilt[c.id] = ['spichlerz', 'kuznia', 'mury', 'targ', 'swiatynia', 'lazienki', 'koszary', 'stajnia', 'biblioteka', 'akwedukt', 'amfiteatr', 'port'];
    cityProd[c.id] = { queue: ['legionista', 'triarius'], progress: 12 };
  }
  const diploRelations = {};
  for (let i = 0; i < OWNER_COUNT; i++) {
    for (let j = i + 1; j < OWNER_COUNT; j++) {
      diploRelations[i + '_' + j] = { status: 'neutralny', wiarygodnosc: 50, historia: [] };
    }
  }
  const aiResearchDone = [];
  for (let i = 1; i < OWNER_COUNT; i++) {
    aiResearchDone.push([i, ['rolnictwo', 'garncarstwo', 'brazownictwo', 'kolo', 'pismo', 'kalendarz', 'zeglarstwo', 'gornictwo', 'hodowla', 'lucznictwo', 'filozofia', 'matematyka', 'zelazo', 'budowa_drog', 'monarchia']]);
  }
  const tradeRoutes = buildBig('tr', 10, (i, id) => ({ id, fromCityId: 'c' + i, toOwnerId: (i % OWNER_COUNT) + 1, active: true }));

  const bigSave = fakeSave({
    mapSnapshot: stdSnap,
    units: bigUnits,
    cities: bigCities,
    // Zapas x2 na wielkosc explored: PELNA mapa odkryta (worst case realnej gry).
    explored: Object.keys(stdMap.hexes),
    cityBuilt,
    cityProd,
    diploRelations,
    aiResearchDone,
    tradeRoutes,
  });
  const bigJson = serializeGame(bigSave);

  // Limit CAŁEGO originu localStorage w Chromium (~5 MB UTF-16); .length w JS
  // liczy jednostki UTF-16, więc w ZNAKACH (nie bajtach) to 5 MB / 2 bajty =
  // 2,5 mln znaków. PROG_CHARS to POŁOWA tego budżetu -- patrz uzasadnienie
  // w komentarzu sekcji wyżej.
  const ORIGIN_LIMIT_UTF16_CHARS = 2.5 * 1024 * 1024;
  const PROG_CHARS = ORIGIN_LIMIT_UTF16_CHARS / 2;

  console.log(
    '    Pelny zapis (mapa standardowy + ' + bigUnits.length + ' jednostek + ' + bigCities.length + ' miast + explored pelny): '
    + bigJson.length + ' znakow (' + (bigJson.length / 1024 / 1024).toFixed(3) + ' MB) = '
    + (bigJson.length * 2 / 1024 / 1024).toFixed(3) + ' MB w UTF-16',
  );
  assert(
    bigJson.length < PROG_CHARS,
    'PELNY zapis (mapa standardowy + reprezentatywna reszta stanu) < ' + (PROG_CHARS / 1000000).toFixed(3) + ' mln znakow (polowa budzetu originu ~' + (ORIGIN_LIMIT_UTF16_CHARS / 1000000).toFixed(3) + ' mln znakow / ~5 MB UTF-16) dla JEDNEGO zapisu (got ' + (bigJson.length / 1000000).toFixed(3) + ' mln znakow)',
  );

  // ---------------------------------------------------------------------------
  // 5c. Budżet AGREGATOWY dla scenariusza ROTACYJNEGO (runda 3, Evaluator,
  //     punkt 4b) -- sekcja 5b mierzy TYLKO pojedynczy zapis; realny scenariusz
  //     ryzyka to rotacja WIELU zapisów jednocześnie w tym samym originie
  //     (main.ts, autosave rotacyjny w fallbacku bez FSA). AUTOSAVE_ROT_COUNT
  //     jest lokalną, nieeksportowaną stałą main.ts -- ODCZYTUJEMY jej wartość
  //     z tekstu źródłowego (nie zmieniamy jej, zakaz tej rundy), żeby budżet
  //     agregatowy zawsze podążał za realną liczbą slotów rotacji.
  //     OCZEKIWANE: ta asercja jest DZIŚ CZERWONA (Evaluator zmierzył 13,80 MB
  //     UTF-16 dla 10 slotów, ponad budżet originu ~5 MB) -- to dokumentuje
  //     jawnie nierozwiązany bloker architektury rotacji, celowo POZA
  //     zakresem tej naprawy (wymaga ABC właściciela). Dlatego NIE używamy
  //     assert() (który wywaliłby exit 1) -- licznik knownFailures osobny,
  //     WIDOCZNY w podsumowaniu, ale nie blokujący pozostałych 4 napraw.
  // ---------------------------------------------------------------------------
  console.log('');
  console.log('--- 5c. Budzet AGREGATOWY rotacji autozapisu (AUTOSAVE_ROT_COUNT slotow naraz) ---');

  const mainTsSrc = fs.readFileSync(path.join(GRA_DIR, 'src', 'main.ts'), 'utf8');
  const rotMatch = mainTsSrc.match(/const\s+AUTOSAVE_ROT_COUNT\s*=\s*(\d+)/);
  assert(rotMatch !== null, 'main.ts zawiera `const AUTOSAVE_ROT_COUNT = <liczba>` (odczyt do wyliczenia budzetu agregatowego, BEZ modyfikacji stałej)');
  const AUTOSAVE_ROT_COUNT = rotMatch ? parseInt(rotMatch[1], 10) : 10;

  const aggregateChars = bigJson.length * AUTOSAVE_ROT_COUNT;
  console.log(
    '    Budzet agregatowy: ' + AUTOSAVE_ROT_COUNT + ' slotow x ' + bigJson.length + ' znakow/slot = '
    + aggregateChars + ' znakow (' + (aggregateChars / 1000000).toFixed(3) + ' mln znakow) = '
    + (aggregateChars * 2 / 1024 / 1024).toFixed(3) + ' MB w UTF-16, budzet originu ~5 MB UTF-16 (~'
    + (ORIGIN_LIMIT_UTF16_CHARS / 1000000).toFixed(3) + ' mln znakow)',
  );
  if (aggregateChars < ORIGIN_LIMIT_UTF16_CHARS) {
    assert(true, 'budzet AGREGATOWY rotacji autozapisu (' + AUTOSAVE_ROT_COUNT + ' slotow) miesci sie w budzecie originu ~5 MB UTF-16');
  } else {
    knownFailures++;
    console.warn(
      '  [KNOWN-FAIL] budzet AGREGATOWY rotacji autozapisu (' + AUTOSAVE_ROT_COUNT + ' slotow x '
      + (bigJson.length / 1000000).toFixed(3) + ' mln znakow/slot = ' + (aggregateChars * 2 / 1024 / 1024).toFixed(3)
      + ' MB UTF-16) PRZEKRACZA budzet originu ~5 MB UTF-16.',
    );
    console.warn(
      '  // ZNANY, OTWARTY BLOKER — wymaga ABC właściciela ws. architektury rotacji autozapisu, patrz PYTANIA-OTWARTE.md',
    );
  }

  console.log('');
  console.log('=== map-snapshot-load-test: ' + pass + ' pass, ' + fail + ' fail, ' + knownFailures + ' known-fail (nie liczy sie do exit code) ===');
  try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
  process.exit(fail > 0 ? 1 : 0);
})().catch((e) => {
  console.error('UNCAUGHT:', e);
  try { fs.unlinkSync(BUNDLE); } catch (e2) { /* ignore */ }
  process.exit(1);
});
