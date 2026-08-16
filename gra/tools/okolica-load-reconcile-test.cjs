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
 * SEKCJA 3+4 (2026-08-14): P-OKOLICA-TRYB-RECZNY-W-STARYM-ZAPISIE (Evaluator, nota N1
 * przy werdykcie 7ec82223 dla 0d50bb81). Naprawa 0d50bb81 (reset okolicaTryb na 'auto'
 * przy zmianie wlasciciela) siedzi WYLACZNIE w main.ts::seedCityOwnerDefaults() --
 * wolanej PO zmianie city.ownerId W BIEZACEJ grze. Zapis zrobiony PRZED 0d50bb81
 * (miasto GRACZA w trybie recznym przejete przez AI/rebeliantow, zanim ta naprawa
 * wyladowala) niesie na stale okolicaTryb:'reczny' w JSON-ie -- ensureCitySaveDefaults
 * (cities.ts) nadpisuje pole TYLKO gdy jest puste, 'reczny' jest prawdziwe (truthy),
 * wiec przechodzi bez zmian; reconcileAllWorkedTiles/reconcileWorkedTilesForOwner w
 * ogole nie znaja pola okolicaTryb. Efekt: obywatele AI stoja bezczynnie mimo wolnych
 * hekso w, resolveWorkedTiles honoruje 'reczny' bez filtra wlasciciela, AI nie ma
 * sciezki UI powrotu do auto.
 *
 * Naprawa: main.ts::restoreGameFromSave() w PETLI odtwarzajacej cities z saved.cities,
 * TUZ PO ensureCitySaveDefaults(c) a PRZED cities.push(c) -- dla miast o ownerId !== 0
 * (NIE gracz) resetuje c.okolicaTryb na DEFAULT_OKOLICA_TRYB i kasuje c.okolicaReczne.
 * Filtr ownerId !== 0 jest KLUCZOWY -- miasto GRACZA w trybie recznym musi przetrwac
 * load bez zmiany, inaczej cala funkcja trybu recznego przestaje dzialac dla gracza.
 *
 * SEKCJA 3: repro behawioralne -- bez DOM/THREE, testuje bezposrednio resolveWorkedTiles
 * (mechanizm, ktory honoruje/nie honoruje okolicaTryb), wzorem
 * okolica-tryb-reset-ownership-change-test.cjs SEKCJA 1: (3.1) repro buga -- stary
 * zapis, miasto AI w trybie recznym, symulacja PETLI BEZ naprawy -> obywatele
 * bezczynni mimo wolnych heksow; (3.2) PO naprawie (2 linie zreplikowane, dokladnie to,
 * co main.ts teraz robi) -> reset na auto + pelne auto-przypisanie, zero bezczynnych;
 * (3.3) przypadek brzegowy KLUCZOWY -- miasto GRACZA (ownerId===0) w trybie recznym w
 * zapisie MUSI PRZETRWAC symulowany load bez zmiany (dokladnie to, co filtr
 * ownerId !== 0 ma chronic -- regresja tu bylaby gorsza niz naprawiany bug).
 *
 * SEKCJA 4: main.ts zawiera DOM/THREE -- weryfikacja WIRINGU jest tekstowa na zrodle,
 * jak SEKCJA 2 wyzej. Potwierdza: blok "if (c.ownerId !== 0) { c.okolicaTryb =
 * DEFAULT_OKOLICA_TRYB; delete c.okolicaReczne; }" istnieje W PETLI restoreGameFromSave,
 * POMIEDZY ensureCitySaveDefaults(c); a cities.push(c); + mutacja kontrolna dowodzi, ze
 * asercja faktycznie zalezy od tego bloku (nie jest tautologiczna).
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
  resolveWorkedTiles,
} from '../src/game/okolica';
export { ensureCitySaveDefaults, DEFAULT_OKOLICA_TRYB } from '../src/game/cities';
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
  resolveWorkedTiles, DEFAULT_OKOLICA_TRYB,
} = require(BUNDLE);

// --- test harness ------------------------------------------------------------
let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(a, b, msg) {
  ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
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

  // Okno 13000 znakow od poczatku funkcji -- z zapasem obejmuje petle cities.push oraz
  // wywolanie reconcile i linie playerEverOwnedCity zaraz po nim. Rozszerzone z 8000 na
  // 13000 przy naprawie P-OKOLICA-TRYB-RECZNY-W-STARYM-ZAPISIE (2026-08-14): komentarz
  // PL+EN przy nowym bloku resetu okolicaTryb w petli wydluzyl jej cialo z ~400 do
  // ~3234 znakow (zmierzone), co przy starym oknie 8000 obcinalo playerEverOwnedCity
  // (byla dokladnie na granicy, 7975 < 8000, ale slice ucinal string w polowie -- test
  // failowal mimo poprawnego kodu). 13000 to szeroki margines bezpieczenstwa ponad
  // dzisiejszy realny rozmiar (~7975+delta), nie tylko dopasowanie do biezacej dlugosci.
  // / EN: 13000-char window from function start -- with margin, covers the cities.push
  // loop plus the reconcile call and the playerEverOwnedCity line right after it.
  // Widened from 8000 to 13000 while fixing P-OKOLICA-TRYB-RECZNY-W-STARYM-ZAPISIE
  // (2026-08-14): the bilingual comment on the new okolicaTryb reset block lengthened
  // the loop body from ~400 to ~3234 chars (measured), which at the old 8000 window cut
  // off playerEverOwnedCity (it was exactly on the boundary, 7975 < 8000, but the slice
  // truncated the string mid-way -- the test failed despite correct code). 13000 is a
  // wide safety margin above today's real size (~7975+delta), not just a fit to the
  // current length.
  const WINDOW = 13000;
  const fnWindow = fnStart >= 0 ? MAIN_TS_SRC.slice(fnStart, fnStart + WINDOW) : '';

  ok(/cities\.length = 0;\s*for \(const c of saved\.cities\) \{[\s\S]{0,4000}?cities\.push\(c\);\s*\}/.test(fnWindow),
    'restoreGameFromSave zawiera petle "cities.length = 0; for (c of saved.cities) {...cities.push(c);}"');
}

console.log('\n2.2 reconcileAllWorkedTiles(...) wolane WEWNATRZ restoreGameFromSave, PO petli cities.push, PRZED playerEverOwnedCity (kolejnosc = dziala na JUZ odtworzonym stanie)');
{
  const fnMarker = 'function restoreGameFromSave(saved: SaveGame): void {';
  const fnStart = MAIN_TS_SRC.indexOf(fnMarker);
  const WINDOW = 13000;
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
  const fnWindow = fnStart >= 0 ? mutated.slice(fnStart, fnStart + 13000) : '';
  const stillHasCall = /cities\.push\(c\);\s*\}[\s\S]{0,2500}?reconcileAllWorkedTiles\(\s*cities,\s*buildAllTerritoryNodes\(\),\s*computeLostToNearerSiblingByCity\(cities, map\)\s*\)[\s\S]{0,300}?playerEverOwnedCity = cities\.some/.test(fnWindow);
  ok(!stillHasCall, 'PO usunieciu call site\'u load\'u: wzorzec 2.2 faktycznie przestaje pasowac (mutacja wykryta) -- asercja nie jest tautologiczna');
}

console.log('\n================ SEKCJA 3: repro behawioralne -- okolicaTryb=\'reczny\' na miescie AI w STARYM zapisie ================\n');

/** Rownina wszedzie -- identyczny wzorzec co okolica-tryb-reset-ownership-change-test.cjs (juz zweryfikowany dzialajacy z resolveWorkedTiles). */
function buildPlainsMapForResolve(qMin, qMax, rMin, rMax) {
  const hexes = {};
  for (let q = qMin; q <= qMax; q++) {
    for (let r = rMin; r <= rMax; r++) {
      hexes[`${q},${r}`] = { terenBazowy: 0 };
    }
  }
  return { szerokoscQ: qMax - qMin + 1, wysokoscR: rMax - rMin + 1, seed: 1, hexes };
}
const resolveMap = buildPlainsMapForResolve(-15, 15, -15, 15);
const constYieldOf = () => ({ zywnosc: 1, praca: 1, handel: 1 });

console.log('3.1 repro buga: zapis sprzed naprawy 0d50bb81 -- miasto AI (ownerId=3) w trybie recznym, symulacja PETLI restoreGameFromSave BEZ naprawy P-OKOLICA-TRYB-RECZNY-W-STARYM-ZAPISIE -> obywatele bezczynni mimo wolnych heksow');
{
  const savedCities = [
    { id: 'ai1', ownerId: 3, q: 0, r: 0, name: 'ai1', population: 6, okolicaTryb: 'reczny', okolicaReczne: { '1,0': 1, '2,0': 1 } },
  ];
  // Petla restoreGameFromSave SPRZED naprawy tego tematu: tylko ensureCitySaveDefaults,
  // cities.push -- BEZ resetu okolicaTryb dla ownerId !== 0 (dokladnie stan main.ts przed
  // ta zmiana, ten sam wzorzec co SEKCJA 1.2 wyzej).
  const cities = [];
  for (const c of savedCities) {
    ensureCitySaveDefaults(c);
    cities.push(c);
  }
  const ai1 = cities.find(c => c.id === 'ai1');
  eq(ai1.okolicaTryb, 'reczny', 'kontrola czulosci: BEZ naprawy, okolicaTryb miasta AI ze starego zapisu pozostaje \'reczny\' po symulowanym load -- ensureCitySaveDefaults nadpisuje pole TYLKO gdy puste, \'reczny\' jest truthy');
  const worked = resolveWorkedTiles(ai1, resolveMap, constYieldOf);
  eq(worked.length, 2, 'BUG: tryb reczny z 2 wpisami -> tylko 2 kafle obrobione mimo populacji 6 i mnostwa wolnych heksow -- obywatele AI bezczynni, dokladnie objaw ze zgloszenia (populacja 6, obrobione 2, bezczynnych 4)');
}

console.log('\n3.2 PO naprawie: symulacja PETLI restoreGameFromSave Z naprawa (2 linie zreplikowane, dokladnie to, co main.ts teraz robi w petli po saved.cities) -> miasto AI wraca do auto, pelne auto-przypisanie, zero bezczynnych');
{
  const savedCities = [
    { id: 'ai2', ownerId: 3, q: 0, r: 0, name: 'ai2', population: 6, okolicaTryb: 'reczny', okolicaReczne: { '1,0': 1, '2,0': 1 } },
  ];
  const cities = [];
  for (const c of savedCities) {
    ensureCitySaveDefaults(c);
    // Naprawiony main.ts konczy petle tym (SEKCJA 4 nizej potwierdza, ze te dwie linie
    // faktycznie tam sa, wewnatrz "if (c.ownerId !== 0) { ... }"):
    if (c.ownerId !== 0) {
      c.okolicaTryb = DEFAULT_OKOLICA_TRYB;
      delete c.okolicaReczne;
    }
    cities.push(c);
  }
  const ai2 = cities.find(c => c.id === 'ai2');
  eq(ai2.okolicaTryb, 'auto', 'okolicaTryb miasta AI zresetowany na \'auto\' przy symulowanym load');
  ok(!('okolicaReczne' in ai2), 'okolicaReczne miasta AI skasowane przy symulowanym load (martwe dane w trybie auto)');
  const worked = resolveWorkedTiles(ai2, resolveMap, constYieldOf);
  eq(worked.length, 6, 'PO naprawie: 6 kafli obrobionych automatycznie = cala populacja, zero bezczynnych obywateli AI');
}

console.log('\n3.3 przypadek brzegowy KLUCZOWY: miasto GRACZA (ownerId===0) w trybie recznym w zapisie MUSI PRZETRWAC symulowany load BEZ ZMIANY -- filtr ownerId !== 0 chroni dokladnie to');
{
  const savedCities = [
    { id: 'player1', ownerId: 0, q: 0, r: 0, name: 'player1', population: 6, okolicaTryb: 'reczny', okolicaReczne: { '1,0': 1, '2,0': 1 } },
  ];
  const cities = [];
  for (const c of savedCities) {
    ensureCitySaveDefaults(c);
    if (c.ownerId !== 0) {
      c.okolicaTryb = DEFAULT_OKOLICA_TRYB;
      delete c.okolicaReczne;
    }
    cities.push(c);
  }
  const player1 = cities.find(c => c.id === 'player1');
  eq(player1.okolicaTryb, 'reczny', 'REGRESJA GORSZA NIZ BUG, gdyby to failowalo: miasto GRACZA w trybie recznym MUSI przetrwac load niezmienione -- filtr ownerId !== 0 wylacza gracza z resetu');
  ok(!!player1.okolicaReczne && player1.okolicaReczne['1,0'] === 1 && player1.okolicaReczne['2,0'] === 1, 'wlasne reczne ustawienia gracza (1,0)/(2,0) nietkniete przez naprawe tego tematu');
  const worked = resolveWorkedTiles(player1, resolveMap, constYieldOf);
  eq(worked.length, 2, 'miasto gracza zachowuje swoj wlasny, celowy wybor 2 recznych kafli -- funkcja trybu recznego dalej dziala dla gracza po load');
}

console.log('\n================ SEKCJA 4: wiring main.ts -- reset okolicaTryb dla ownerId !== 0 w petli restoreGameFromSave ================\n');

console.log('4.1 blok "if (c.ownerId !== 0) { c.okolicaTryb = DEFAULT_OKOLICA_TRYB; delete c.okolicaReczne; }" istnieje W PETLI restoreGameFromSave, POMIEDZY ensureCitySaveDefaults(c); a cities.push(c);');
{
  const fnMarker = 'function restoreGameFromSave(saved: SaveGame): void {';
  const fnStart = MAIN_TS_SRC.indexOf(fnMarker);
  const WINDOW = 13000;
  const fnWindow = fnStart >= 0 ? MAIN_TS_SRC.slice(fnStart, fnStart + WINDOW) : '';

  const RE = /ensureCitySaveDefaults\(c\);[\s\S]{0,3500}?if \(c\.ownerId !== 0\) \{[\s\S]{0,200}?c\.okolicaTryb = DEFAULT_OKOLICA_TRYB;[\s\S]{0,100}?delete c\.okolicaReczne;[\s\S]{0,100}?\}[\s\S]{0,500}?cities\.push\(c\);/;
  ok(RE.test(fnWindow),
    'P-OKOLICA-TRYB-RECZNY-W-STARYM-ZAPISIE: petla "for (c of saved.cities) {...}" zawiera "if (c.ownerId !== 0) { c.okolicaTryb = DEFAULT_OKOLICA_TRYB; delete c.okolicaReczne; }" POMIEDZY ensureCitySaveDefaults(c) a cities.push(c)');
}

console.log('\n4.2 DEFAULT_OKOLICA_TRYB uzyte w tym bloku jest tym samym, juz zaimportowanym symbolem z \'./game/cities\' (weryfikowanym w okolica-tryb-reset-ownership-change-test.cjs 2.3) -- brak duplikatu/literowki nazwy');
{
  const importBlockMatch = MAIN_TS_SRC.match(/import \{[\s\S]*?\} from '\.\/game\/cities';/);
  ok(!!importBlockMatch && /\bDEFAULT_OKOLICA_TRYB\b/.test(importBlockMatch[0]),
    "DEFAULT_OKOLICA_TRYB wymienione w bloku import z './game/cities' w main.ts (reuzywane, nie nowy symbol)");
}

console.log('\n4.3 mutacja kontrolna -- fizyczne usuniecie bloku "if (c.ownerId !== 0) {...}" z petli load\'u zawala TYLKO 4.1, dowod ze asercja nie jest tautologiczna');
{
  const BLOCK = '        if (c.ownerId !== 0) {\n          c.okolicaTryb = DEFAULT_OKOLICA_TRYB;\n          delete c.okolicaReczne;\n        }\n';
  const occurrences = MAIN_TS_SRC.split(BLOCK).length - 1;
  eq(occurrences, 1, 'punkt mutacji (blok if ownerId!==0 w petli load\'u) wystepuje dokladnie raz w main.ts');
  const mutated = MAIN_TS_SRC.replace(BLOCK, '');
  const fnMarker = 'function restoreGameFromSave(saved: SaveGame): void {';
  const fnStart = mutated.indexOf(fnMarker);
  const fnWindow = fnStart >= 0 ? mutated.slice(fnStart, fnStart + 13000) : '';
  const RE = /ensureCitySaveDefaults\(c\);[\s\S]{0,3500}?if \(c\.ownerId !== 0\) \{[\s\S]{0,200}?c\.okolicaTryb = DEFAULT_OKOLICA_TRYB;[\s\S]{0,100}?delete c\.okolicaReczne;[\s\S]{0,100}?\}[\s\S]{0,500}?cities\.push\(c\);/;
  ok(!RE.test(fnWindow), 'PO usunieciu bloku resetu z petli load\'u: wzorzec 4.1 faktycznie przestaje pasowac (mutacja wykryta) -- asercja nie jest tautologiczna');
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
