'use strict';
/**
 * okolica-load-reconcile-test.cjs
 *
 * Kontynuacja tematu "Milet trzyma pracownikow na heksie Aten" (naprawiony commitem
 * 3f1a2f85 -- reconcile worked tiles PO zmianie wlasciciela miasta). Evaluator
 * (dyspozycje/PYTANIA-OTWARTE.md, "Evaluator: reconcile worked tiles po zmianie
 * wlasciciela (Milet/Ateny)", nota N2) znalazl, ze dispatch mial 3 punkty, a naprawiony
 * zostal tylko 1: (1) reconcile PO zdobyciu miasta -- ZROBIONE 3f1a2f85; (2) sanityzacja
 * okolicaReczne PRZY WCZYTANIU SAVE'A -- NIEZROBIONE do tego commitu; (3) wizualne
 * odroznienie w panelu -- rowniez odlozone.
 *
 * Luka (2): main.ts::restoreGameFromSave() ODTWARZA cities.push(c) z zapisu, ale (przed
 * ta naprawa) NIGDY nie wolala reconcileAllWorkedTiles po tym odtworzeniu. Zapis
 * powstaly PRZED naprawa 3f1a2f85 (albo z gry, ktorej dawna zmiana wlasciciela nigdy nie
 * przeszla przez reconcile) mogl wiec zostac WCZYTANY z nielegalnym okolicaReczne (np.
 * na centrum cudzego miasta) i wpis wisial w panelu az do PIERWSZEGO KONCA TURY
 * (jedyne inne miejsce wolajace reconcileAllWorkedTiles, turn-economy.ts) -- dokladnie
 * ten sam objaw co zgloszenie Milet/Ateny, tylko wyzwolony load'em zamiast podbojem.
 *
 * Naprawa: reconcileAllWorkedTiles(cities, buildAllTerritoryNodes(),
 * computeLostToNearerSiblingByCity(cities, map)) wpiety w main.ts::restoreGameFromSave
 * TUZ PO petli odtwarzajacej cities z saved.cities -- ten sam wzorzec argumentow co
 * juz istniejace call site'y (seedCityOwnerDefaults, zalozenie miasta gracza).
 *
 * SEKCJA 1: repro behawioralne -- symuluje DOKLADNIE to, co robi restoreGameFromSave
 * (ensureCitySaveDefaults per miasto + reconcile), bez DOM/THREE, importujac PRAWDZIWE
 * funkcje z game/cities.ts (pure) i game/okolica.ts (pure), wzorem istniejacego
 * okolica-ownership-change-reconcile-test.cjs SEKCJA 1.
 * SEKCJA 2: main.ts zawiera DOM/THREE (nie da sie zbundlowac standalone w node, ten sam
 * pre-istniejacy powod co map-field-battle-test.cjs/pre-battle-save-test.cjs w
 * CLAUDE.md) -- weryfikacja WIRINGU jest wiec tekstowa na zrodle, jak SEKCJA 2 w
 * okolica-ownership-change-reconcile-test.cjs. Potwierdza: reconcileAllWorkedTiles
 * jest wywolywane WEWNATRZ restoreGameFromSave, PO petli odtwarzajacej cities z
 * saved.cities, PRZED playerEverOwnedCity (kolejnosc -- dowod, ze dziala na juz
 * odtworzonym stanie miast, nie na starym).
 *
 * Run from gra/: node tools/okolica-load-reconcile-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[okolica-load-reconcile-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.okolica-load-reconcile-entry.ts');
const BUNDLE = path.join(__dirname, '.okolica-load-reconcile-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  buildTerritoryNodesFromCities,
  computeLostToNearerSiblingByCity,
  reconcileAllWorkedTiles,
} from '../src/game/okolica';
export { ensureCitySaveDefaults } from '../src/game/cities';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[okolica-load-reconcile-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  buildTerritoryNodesFromCities, computeLostToNearerSiblingByCity,
  reconcileAllWorkedTiles, ensureCitySaveDefaults,
} = require(BUNDLE);

// --- test harness ------------------------------------------------------------
let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

// --- fixtures ------------------------------------------------------------------
function buildPlainsMap(qMin, qMax, rMin, rMax) {
  const hexes = {};
  for (let q = qMin; q <= qMax; q++) {
    for (let r = rMin; r <= rMax; r++) {
      hexes[`${q},${r}`] = { terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak', rzeka: null };
    }
  }
  return { szerokoscQ: qMax - qMin + 1, wysokoscR: rMax - rMin + 1, seed: 1, hexes };
}

/** Miasto minimalne -- wystarczy do ensureCitySaveDefaults + reconcile. */
function fakeSavedCity(id, ownerId, q, r, okolicaReczne) {
  return {
    id, ownerId, q, r, name: id, population: 9,
    okolicaTryb: 'reczny',
    okolicaReczne,
  };
}

console.log('\n================ SEKCJA 1: symulacja restoreGameFromSave -- load z nielegalnym wpisem ================\n');

// 1.1 Scenariusz: zapis (saved.cities) powstal PRZED naprawa 3f1a2f85 -- Milet
// (gracz, ownerId=0, tryb reczny) ma nielegalny wpis okolicaReczne na centrum Aten
// (ownerId=1, INNY wlasciciel juz W SAMYM ZAPISIE -- np. save zrobiony PO tym, jak
// stary bug pozwolil takiemu wpisowi powstac i przetrwac do zapisu gry). Symulujemy
// DOKLADNIE to, co robi restoreGameFromSave: dla kazdego miasta z saved.cities wolaj
// ensureCitySaveDefaults (migracja pol), potem PO calej petli -- reconcile. Zero
// koncow tury pomiedzy -- weryfikujemy, ze wpis znika NATYCHMIAST przy wczytaniu.
console.log('1.1 zapis z nielegalnym wpisem Milet->centrum Aten -- po symulacji load (cities restore + reconcile) wpis znika BEZ konca tury');
{
  const map = buildPlainsMap(-15, 15, -15, 15);
  const savedCities = [
    fakeSavedCity('milet', 0, 0, 0, { '8,0': 1, '1,0': 1 }),
    fakeSavedCity('ateny', 1, 8, 0, undefined),
  ];

  // Krok 1 restoreGameFromSave: cities.length = 0; for (c of saved.cities) { ensureCitySaveDefaults(c); cities.push(c); }
  const cities = [];
  for (const c of savedCities) {
    ensureCitySaveDefaults(c);
    cities.push(c);
  }
  const milet = cities.find(c => c.id === 'milet');

  ok('8,0' in milet.okolicaReczne, 'precondition: PO odtworzeniu z zapisu (ensureCitySaveDefaults), wpis Miletu na (8,0) nadal obecny -- migracja go nie rusza');

  // Krok 2 (NAPRAWA -- brakujacy krok przed ta zmiana): reconcile TUZ PO petli cities.push,
  // dokladnie jak main.ts::restoreGameFromSave po naprawie.
  const territoryNodes = buildTerritoryNodesFromCities(cities);
  const lostToSiblingByCity = computeLostToNearerSiblingByCity(cities, map);
  reconcileAllWorkedTiles(cities, territoryNodes, lostToSiblingByCity);

  ok(!('8,0' in milet.okolicaReczne), 'PO symulowanym load (naprawa): wpis Miletu na (8,0), centrum cudzego miasta Aten, usuniety NATYCHMIAST przy wczytaniu -- bez czekania na koniec tury');
  ok('1,0' in milet.okolicaReczne, 'bezsporny legalny wpis (1,0) Miletu nietkniety przez sanityzacje load');
}

// 1.2 Kontrola czulosci: DOKLADNIE ten sam zapis, ale BEZ reconcile po odtworzeniu
// cities (stan SPRZED tej naprawy) -- wpis POZOSTAJE po "wczytaniu". Dowodzi, ze 1.1
// faktycznie testuje efekt reconcile-na-load, nie inny mechanizm.
console.log('\n1.2 kontrola czulosci: BEZ reconcile po odtworzeniu cities (load) wpis Miletu na centrum Aten POZOSTAJE');
{
  const savedCities = [
    fakeSavedCity('milet2', 0, 0, 0, { '8,0': 1, '1,0': 1 }),
    fakeSavedCity('ateny2', 1, 8, 0, undefined),
  ];
  const cities = [];
  for (const c of savedCities) {
    ensureCitySaveDefaults(c);
    cities.push(c);
  }
  const milet = cities.find(c => c.id === 'milet2');
  // brak reconcile tutaj -- dokladnie stan sprzed naprawy load'u

  ok('8,0' in milet.okolicaReczne, 'kontrola: bez reconcile-na-load wpis Miletu na (8,0) POZOSTAJE po "wczytaniu" -- dokladnie luka (2) ze zgloszenia Evaluatora N2');
}

// 1.3 Stary zapis SPRZED calej rodziny napraw R-HEKS-* moze miec ownera trzeciego,
// niezwiazanego miasta (nie Miletu, nie Aten) z nielegalnym wpisem -- reconcileAllWorkedTiles
// (nie wariant per-owner) czysci WSZYSTKICH wlascicieli JEDNYM wywolaniem na load, wiec
// stary "brud" dowolnego gracza/AI w tym samym zapisie tez znika od razu.
console.log('\n1.3 reconcile-na-load czysci WSZYSTKICH wlascicieli w zapisie (nie tylko Miletu)');
{
  const map = buildPlainsMap(-15, 15, -15, 15);
  const savedCities = [
    fakeSavedCity('sparta', 2, -8, 0, { '8,0': 1 }),
    fakeSavedCity('ateny3', 1, 8, 0, undefined),
    fakeSavedCity('milet3', 0, 0, 0, undefined),
  ];
  const cities = [];
  for (const c of savedCities) {
    ensureCitySaveDefaults(c);
    cities.push(c);
  }
  const sparta = cities.find(c => c.id === 'sparta');

  const territoryNodes = buildTerritoryNodesFromCities(cities);
  const lostToSiblingByCity = computeLostToNearerSiblingByCity(cities, map);
  reconcileAllWorkedTiles(cities, territoryNodes, lostToSiblingByCity);

  ok(!('8,0' in sparta.okolicaReczne), 'wpis Sparty (trzeci wlasciciel, AI) na centrum Aten tez usuniety przy load -- reconcile-na-load nie ogranicza sie do gracza');
}

console.log('\n================ SEKCJA 2: wiring main.ts -- reconcile faktycznie wpiety w restoreGameFromSave, PO odtworzeniu cities ================\n');

const MAIN_TS_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

console.log('2.1 restoreGameFromSave(...) istnieje i zawiera petle odtwarzajaca cities z saved.cities');
{
  const fnMarker = 'function restoreGameFromSave(saved: SaveGame): void {';
  const fnStart = MAIN_TS_SRC.indexOf(fnMarker);
  ok(fnStart >= 0, 'znaleziono restoreGameFromSave(...) w main.ts');

  // Okno 8000 znakow od poczatku funkcji -- z zapasem obejmuje petle cities.push oraz
  // (po naprawie) wywolanie reconcile i linie playerEverOwnedCity zaraz po nim (zmierzone
  // realne odleglosci: petla ~2860 znakow od startu, reconcile ~2020 znakow po petli,
  // playerEverOwnedCity ~110 znakow po reconcile -- 8000 to szeroki margines bezpieczenstwa).
  const WINDOW = 8000;
  const fnWindow = fnStart >= 0 ? MAIN_TS_SRC.slice(fnStart, fnStart + WINDOW) : '';

  ok(/cities\.length = 0;\s*for \(const c of saved\.cities\) \{[\s\S]{0,400}?cities\.push\(c\);\s*\}/.test(fnWindow),
    'restoreGameFromSave zawiera petle "cities.length = 0; for (c of saved.cities) {...cities.push(c);}"');
}

console.log('\n2.2 reconcileAllWorkedTiles(...) wolane WEWNATRZ restoreGameFromSave, PO petli cities.push, PRZED playerEverOwnedCity (kolejnosc = dziala na JUZ odtworzonym stanie)');
{
  const fnMarker = 'function restoreGameFromSave(saved: SaveGame): void {';
  const fnStart = MAIN_TS_SRC.indexOf(fnMarker);
  const WINDOW = 8000;
  const fnWindow = fnStart >= 0 ? MAIN_TS_SRC.slice(fnStart, fnStart + WINDOW) : '';

  ok(/cities\.push\(c\);\s*\}[\s\S]{0,2500}?reconcileAllWorkedTiles\(\s*cities,\s*buildAllTerritoryNodes\(\),\s*computeLostToNearerSiblingByCity\(cities, map\)\s*\)[\s\S]{0,300}?playerEverOwnedCity = cities\.some/.test(fnWindow),
    'P-MILET-ATENY-OKOLICA-RECZNE-PRZY-PRZEJECIU-LOAD: reconcileAllWorkedTiles(cities, buildAllTerritoryNodes(), computeLostToNearerSiblingByCity(cities, map)) wywolane MIEDZY koncem petli cities.push a linia playerEverOwnedCity = cities.some(...) -- czyli PO odtworzeniu miast z zapisu');
}

console.log('\n2.3 dokladnie 3 miejsca w main.ts wolaja reconcileAllWorkedTiles z tym samym wzorcem argumentow (seedCityOwnerDefaults, zalozenie miasta gracza, load) -- zero duplikatow/literowek');
{
  const PATTERN = 'reconcileAllWorkedTiles(cities, buildAllTerritoryNodes(), computeLostToNearerSiblingByCity(cities, map))';
  let count = 0, idx = 0;
  while ((idx = MAIN_TS_SRC.indexOf(PATTERN, idx)) !== -1) { count++; idx += PATTERN.length; }
  ok(count === 3, `dokladnie 3 wystapienia wzorca reconcileAllWorkedTiles(cities, buildAllTerritoryNodes(), computeLostToNearerSiblingByCity(cities, map)) w main.ts (got ${count})`);
}

console.log('\n2.4 mutacja kontrolna -- fizyczne usuniecie call site\'u load\'u zawala TYLKO 2.2, nie 2.1/2.3 w izolacji (dowod, ze asercja 2.2 faktycznie zalezy od tego call site\'u)');
{
  const CALL = 'reconcileAllWorkedTiles(cities, buildAllTerritoryNodes(), computeLostToNearerSiblingByCity(cities, map));\n      playerEverOwnedCity = cities.some(c => c.ownerId === 0);';
  const REPLACEMENT = 'playerEverOwnedCity = cities.some(c => c.ownerId === 0);';
  ok(MAIN_TS_SRC.includes(CALL), 'punkt mutacji zlokalizowany dokladnie (string do podmiany istnieje raz w pliku)');
  const mutated = MAIN_TS_SRC.split(CALL).join(REPLACEMENT);
  const fnMarker = 'function restoreGameFromSave(saved: SaveGame): void {';
  const fnStart = mutated.indexOf(fnMarker);
  const fnWindow = fnStart >= 0 ? mutated.slice(fnStart, fnStart + 8000) : '';
  const stillHasCall = /cities\.push\(c\);\s*\}[\s\S]{0,2500}?reconcileAllWorkedTiles\(\s*cities,\s*buildAllTerritoryNodes\(\),\s*computeLostToNearerSiblingByCity\(cities, map\)\s*\)[\s\S]{0,300}?playerEverOwnedCity = cities\.some/.test(fnWindow);
  ok(!stillHasCall, 'PO usunieciu call site\'u load\'u: wzorzec 2.2 faktycznie przestaje pasowac (mutacja wykryta) -- asercja nie jest tautologiczna');
}

// --- summary -------------------------------------------------------------------
const total = passed + failed;
if (failed === 0) {
  console.log(`\nOKOLICA-LOAD-RECONCILE OK (${passed}/${total})`);
} else {
  console.log(`\nOKOLICA-LOAD-RECONCILE FAIL (${passed}/${total} passed, ${failed} failed)`);
}

try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }

process.exit(failed === 0 ? 0 : 1);
