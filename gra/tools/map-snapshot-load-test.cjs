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
 * Zakres testu (moduły czyste, bez DOM/THREE -- main.ts się nie bundluje):
 *   1. Roundtrip zapis->wczytanie NOWEGO formatu:
 *      map -> serializeMapForSave -> SaveGame.mapSnapshot -> serializeGame
 *      (prawdziwy JSON.stringify) -> deserializeGame (prawdziwy JSON.parse)
 *      -> loadMapForSave(saved, genFn) z genFn=licznik wywołań.
 *      Asercja twarda: genFn.calls === 0 (generator NIE wołany) ORAZ
 *      map.hexes po roundtripie jest STRUKTURALNIE IDENTYCZNA z oryginałem
 *      (włącznie z polami dynamicznymi spoza typu Hex: zloze/zlozeMinEra,
 *      ulepszenia/improvementKey -- patrz mapSnapshot.ts, dlaczego `hexes`
 *      NIE jest rekonstruowane pole-po-polu).
 *   2. Wsteczna kompatybilność -- STARY zapis (fixture BEZ mapSnapshot, jak
 *      każdy zapis sprzed tej naprawy): loadMapForSave(saved, genFn) MUSI
 *      wywołać genFn (dokładnie 1×) i zwrócić jego wynik -- zero regresji
 *      dla zapisów graczy sprzed tej zmiany.
 *   3. isValidMapSnapshot odrzuca uszkodzone/niepełne snapshoty (fallback na
 *      generator zamiast cichej złej mapy) -- wymiary <=0, brak hexes, puste
 *      hexes, riverPaths nie-tablica.
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
function assert(cond, msg) {
  if (cond) {
    pass++;
    console.log('  [OK]', msg);
  } else {
    fail++;
    console.error('  [FAIL]', msg);
  }
}

fs.writeFileSync(
  ENTRY,
  [
    "export { serializeMapForSave, buildGameMapFromSnapshot, isValidMapSnapshot } from '../src/map/mapSnapshot.ts';",
    "export { loadMapForSave } from '../src/game/load-map-source.ts';",
    "export { serializeGame, deserializeGame, SAVE_VERSION } from '../src/game/save.ts';",
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
  generateMap,
} = require(BUNDLE);
fs.unlinkSync(ENTRY);

// ---------------------------------------------------------------------------
// Fixture: mała mapa z przykładem KAŻDEGO rodzaju mutacji rozgrywki, żeby
// roundtrip łapał wszystkie kategorie pól (nie tylko teren bazowy).
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
      widocznosc: {},
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
console.log('--- 1. Roundtrip zapis -> wczytanie (nowy format, mapSnapshot obecny) ---');

const originalMap = buildFixtureMap();
const snap = serializeMapForSave(originalMap);
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
    JSON.stringify(gotHexes) === JSON.stringify(originalMap.hexes),
    'map.hexes po roundtripie jest BAJT-W-BAJT identyczna z oryginałem (JSON.stringify porównanie)',
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
  assert(isValidMapSnapshot({ szerokoscQ: 0, wysokoscR: 1, hexes: { a: 1 }, seed: 1, riverPaths: [] }) === false, 'szerokoscQ<=0 -> invalid');
  assert(isValidMapSnapshot({ szerokoscQ: 2, wysokoscR: 1, hexes: {}, seed: 1, riverPaths: [] }) === false, 'hexes puste -> invalid');
  assert(isValidMapSnapshot({ szerokoscQ: 2, wysokoscR: 1, hexes: { a: 1 }, seed: 1, riverPaths: 'nope' }) === false, 'riverPaths nie-tablica -> invalid');
  assert(isValidMapSnapshot(snap) === true, 'snapshot poprawnej mapy fixture -> valid');

  const corruptSave = fakeSave({ mapSnapshot: { szerokoscQ: 0, wysokoscR: 0, hexes: {}, seed: 1, riverPaths: [] } });
  let corruptGenCalls = 0;
  async function mockGenForCorrupt() { corruptGenCalls++; return regeneratedMap; }
  const corruptResult = await loadMapForSave(corruptSave, mockGenForCorrupt);
  assert(corruptGenCalls === 1, 'mapSnapshot uszkodzony -> loadMapForSave spada na generator (fallback), nie cichą złą mapę');
  assert(corruptResult.usedSnapshot === false, 'mapSnapshot uszkodzony -> usedSnapshot=false');

  console.log('');

  // ---------------------------------------------------------------------------
  // 4. Prawdziwa mapa z generatora (nie syntetyczny fixture) -- łapie ewentualne
  //    pola nie-JSON-safe (funkcje, Date, Map/Set) które syntetyczny fixture
  //    mógłby przeoczyć. Mała mapa (36x28, DEFAULT) -- szybka i deterministyczna.
  // ---------------------------------------------------------------------------
  console.log('--- 4. Roundtrip prawdziwej mapy z generateMap() (36×28, seed=777) ---');

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
    JSON.stringify(realResult.map.hexes) === JSON.stringify(realMap.hexes),
    'realna mapa: hexes po pełnym roundtripie (JSON.stringify -> JSON.parse -> loadMapForSave) identyczna z oryginałem',
  );
  assert(
    Object.keys(realResult.map.hexes).length === realHexCount,
    'realna mapa: liczba heksów po roundtripie niezmieniona (' + realHexCount + ')',
  );

  console.log('');
  console.log('=== map-snapshot-load-test: ' + pass + ' pass, ' + fail + ' fail ===');
  try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
  process.exit(fail > 0 ? 1 : 0);
})().catch((e) => {
  console.error('UNCAUGHT:', e);
  try { fs.unlinkSync(BUNDLE); } catch (e2) { /* ignore */ }
  process.exit(1);
});
