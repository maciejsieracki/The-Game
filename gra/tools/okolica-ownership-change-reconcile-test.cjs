'use strict';
/**
 * okolica-ownership-change-reconcile-test.cjs
 *
 * Zgloszenie Macieja: "Milet trzyma pracownikow na heksie Aten". Rozpoznanie
 * (dyspozycje/PYTANIA-OTWARTE.md, naglowek "Rozpoznanie zakonczone: Milet trzyma
 * pracownikow na heksie Aten") ustalilo: silnik/przydzial jest SZCZELNY (patrz
 * okolica-multi-city-overlap-test.cjs SEKCJA 1) -- luka byla w tym, ze ZMIANA
 * WLASCICIELA miasta (podboj w bitwie, kapitulacja z glodu, wchloniecie
 * dyplomatyczne miasta-panstwa, przejscie do rebeliantow) NIGDY nie wolala
 * reconcileAllWorkedTiles -- w odroznieniu od konca tury (turn-economy.ts) i
 * zakladania miasta (main.ts ~linia 10922), gdzie reconcile juz byl wpiety. Stary/
 * nielegalny wpis okolicaReczne (np. na centrum SASIADA, ktore wlasnie zmienilo
 * wlasciciela) wisial wiec w panelu (cityPanel.ts::renderWorkedPreview czyta surowy
 * okolicaReczne bez filtra -- SWIADOMIE, R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1) az do
 * konca tury.
 *
 * Naprawa: reconcileAllWorkedTiles(...) wpiety NA KONCU main.ts::seedCityOwnerDefaults
 * -- funkcji, ktora WSZYSTKIE 9 call site'ow zmiany wlasciciela/zalozenia miasta i tak
 * juz musialy wolac (kontrakt "wywoluj PO kazdej zmianie city.ownerId" byl juz w jej
 * JSDoc przed ta naprawa) -- wiec pojedyncza zmiana pokrywa WSZYSTKIE scenariusze bez
 * koniecznosci pamietania o tym osobno przy kazdym call site.
 * / EN: the fix wires reconcileAllWorkedTiles(...) into the END of
 * main.ts::seedCityOwnerDefaults itself -- the function all 9 ownership-change/founding
 * call sites already had to call (its JSDoc already said "call this AFTER every
 * city.ownerId change" before this fix) -- so a single change covers every scenario
 * without having to remember it at each call site separately.
 *
 * SEKCJA 1: repro behawioralne dokladnego scenariusza zgloszenia -- bez DOM/THREE,
 * wzorem SEKCJI 1.5/1.6/5.1 w okolica-multi-city-overlap-test.cjs -- testuje
 * bezposrednio reconcileAllWorkedTiles/reconcileWorkedTilesForOwner (mechanizm, ktory
 * naprawa teraz woła z wnetrza seedCityOwnerDefaults).
 *
 * SEKCJA 2: main.ts zawiera DOM/THREE (nie da sie zbundlowac standalone w node, patrz
 * pre-istniejace bledy harnessu map-field-battle-test.cjs/pre-battle-save-test.cjs w
 * CLAUDE.md) -- weryfikacja WIRINGU jest wiec tekstowa na zrodle, dokladnie jak SEKCJA
 * 3/4 w okolica-multi-city-overlap-test.cjs (ten sam, juz przyjety w repo wzorzec).
 * Potwierdza: (a) cialo seedCityOwnerDefaults(...) faktycznie woła
 * reconcileAllWorkedTiles z prawidlowymi argumentami; (b) wszystkie 4 realne miejsca
 * zmiany wlasciciela (kapitulacja glodowa, wchloniecie dyplomatyczne, podboj w bitwie,
 * przejscie do rebeliantow) nadal woluja seedCityOwnerDefaults -- gdyby ktorys call
 * site przestal ja wolac, naprawa (a) by go nie objela.
 *
 * Run from gra/: node tools/okolica-ownership-change-reconcile-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[okolica-ownership-change-reconcile-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.okolica-ownership-change-reconcile-entry.ts');
const BUNDLE = path.join(__dirname, '.okolica-ownership-change-reconcile-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  buildTerritoryNodesFromCities,
  computeLostToNearerSiblingByCity,
  reconcileWorkedTilesForOwner,
  reconcileAllWorkedTiles,
} from '../src/game/okolica';
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
  console.error('[okolica-ownership-change-reconcile-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  buildTerritoryNodesFromCities, computeLostToNearerSiblingByCity,
  reconcileWorkedTilesForOwner, reconcileAllWorkedTiles,
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
/** Rownina wszedzie w [qMin,qMax]x[rMin,rMax] -- teren jednorodny. */
function buildPlainsMap(qMin, qMax, rMin, rMax) {
  const hexes = {};
  for (let q = qMin; q <= qMax; q++) {
    for (let r = rMin; r <= rMax; r++) {
      hexes[`${q},${r}`] = { terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak', rzeka: null };
    }
  }
  return { szerokoscQ: qMax - qMin + 1, wysokoscR: rMax - rMin + 1, seed: 1, hexes };
}

console.log('\n================ SEKCJA 1: repro "Milet trzyma pracownikow na heksie Aten" ================\n');

// 1.1 Scenariusz DOKLADNIE ze zgloszenia: Milet (gracz, ownerId=0) w trybie recznym ma
// STARY/NIELEGALNY wpis okolicaReczne wskazujacy na heks, ktory jest centrum Aten
// (ownerId=1, inny wlasciciel) -- dokladnie ten wpis renderWorkedPreview pokazuje jako
// "zajety" bez filtra (R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1). Gracz zdobywa Ateny (podboj
// w bitwie / kapitulacja z glodu / wchloniecie -- mechanizm nizej jest identyczny dla
// kazdego z tych 3 realnych call site'ow, patrz SEKCJA 2.2): city.ownerId Aten zmienia
// sie na 0. PRZED naprawa nic wiecej sie nie dzialo -- wpis Miletu wisial do konca tury.
// PO naprawie: reconcileAllWorkedTiles (teraz wywolywane z wnetrza
// seedCityOwnerDefaults, ktora KAZDY z tych call site'ow i tak juz musi wolac) usuwa go
// natychmiast.
console.log('1.1 Milet (recznie) ma nielegalny wpis na centrum Aten -- podboj Aten + reconcile usuwa wpis natychmiast');
{
  const map = buildPlainsMap(-15, 15, -15, 15);
  const milet = {
    id: 'milet', ownerId: 0, q: 0, r: 0, population: 9,
    okolicaTryb: 'reczny',
    // Wpis na centrum Aten (8,0) -- nielegalny bezwarunkowo (centrum KAZDEGO miasta) --
    // plus jeden bezsporny legalny wpis (1,0), zeby test odroznial "wyczyszczono
    // wszystko" od "wyczyszczono selektywnie tylko nielegalny wpis".
    okolicaReczne: { '8,0': 1, '1,0': 1 },
  };
  const ateny = { id: 'ateny', ownerId: 1, q: 8, r: 0, population: 9 };
  const cities = [milet, ateny];

  ok('8,0' in milet.okolicaReczne, 'precondition: Milet ma wpis na (8,0), centrum Aten, PRZED podbojem');

  // Podboj: Ateny zmieniaja wlasciciela (ownerId 1 -> 0), dokladnie jak main.ts::
  // applyCityCaptureToMap/resolveSiegeSurrender/annexCityStateToOwner robia PRZED
  // wywolaniem seedCityOwnerDefaults(city).
  ateny.ownerId = 0;

  // Naprawiony seedCityOwnerDefaults konczy sie WLASNIE tym wywolaniem (main.ts, ten
  // sam wzorzec argumentow co juz istniejacy call site zakladania miasta gracza,
  // main.ts ~linia 10922).
  const territoryNodes = buildTerritoryNodesFromCities(cities);
  const lostToSiblingByCity = computeLostToNearerSiblingByCity(cities, map);
  reconcileAllWorkedTiles(cities, territoryNodes, lostToSiblingByCity);

  ok(!('8,0' in milet.okolicaReczne), 'PO naprawie: wpis Miletu na (8,0), centrum (teraz WLASNYCH) Aten, usuniety natychmiast po podboju');
  ok('1,0' in milet.okolicaReczne, 'bezsporny wpis (1,0) Miletu nietkniety');
}

// 1.2 Kontrola czulosci: DOKLADNIE ten sam scenariusz, ale BEZ wywolania reconcile po
// zmianie wlasciciela (stan SPRZED naprawy) -- wpis POZOSTAJE. Dowodzi, ze SEKCJA 1.1
// faktycznie testuje efekt reconcile, nie jakis inny, niezalezny mechanizm.
console.log('\n1.2 kontrola czulosci: BEZ reconcile po zmianie wlasciciela wpis Miletu na centrum Aten POZOSTAJE (dokladnie bug ze zgloszenia)');
{
  const milet = {
    id: 'milet2', ownerId: 0, q: 0, r: 0, population: 9,
    okolicaTryb: 'reczny',
    okolicaReczne: { '8,0': 1, '1,0': 1 },
  };
  const ateny = { id: 'ateny2', ownerId: 1, q: 8, r: 0, population: 9 };

  ateny.ownerId = 0; // podboj -- ale reconcile NIE jest wolany (stan sprzed naprawy)

  ok('8,0' in milet.okolicaReczne, 'kontrola: bez reconcile wpis Miletu na (8,0) POZOSTAJE po podboju Aten -- dokladnie bug zgloszony przez Macieja');
}

// 1.3 Symetria: nielegalny wpis dotyczy SASIADA gracza (nie samego przejmowanego
// miasta) -- recon (PYTANIA-OTWARTE.md) explicite wskazywal, ze luka dotyczy "przejetego
// miasta LUB sasiadow, ktorych terytorium sie przesunelo". reconcileAllWorkedTiles (nie
// wariant per-owner) czysci WSZYSTKICH wlascicieli jednym wywolaniem -- ten sam wpis
// zostaje wykryty niezaleznie od tego, czy to Milet (sasiad) czy same Ateny
// (przejmowane miasto) mialyby nielegalny zapis.
console.log('\n1.3 reconcileAllWorkedTiles czysci WSZYSTKICH wlascicieli (nie tylko nowego), gdy Ateny zmieniaja rece');
{
  const map = buildPlainsMap(-15, 15, -15, 15);
  const sparta = {
    // Trzeci wlasciciel (AI, ownerId=2), NIEZWiazany z podbojem Aten -- ma wlasny stary
    // nielegalny wpis na centrum Aten sprzed naprawy. reconcileAllWorkedTiles musi go
    // tez wyczyscic, mimo ze Sparta nie jest ani stara, ani nowa strona podboju.
    id: 'sparta', ownerId: 2, q: -8, r: 0, population: 9,
    okolicaTryb: 'reczny',
    okolicaReczne: { '8,0': 1 },
  };
  const ateny = { id: 'ateny3', ownerId: 1, q: 8, r: 0, population: 9 };
  const gracz = { id: 'milet3', ownerId: 0, q: 0, r: 0, population: 9 };
  const cities = [sparta, ateny, gracz];

  ateny.ownerId = 0; // gracz podbija Ateny -- Sparta (ownerId=2) nie jest strona zmiany

  const territoryNodes = buildTerritoryNodesFromCities(cities);
  const lostToSiblingByCity = computeLostToNearerSiblingByCity(cities, map);
  reconcileAllWorkedTiles(cities, territoryNodes, lostToSiblingByCity);

  ok(!('8,0' in sparta.okolicaReczne), 'wpis Sparty (trzeci, niezwiazany wlasciciel) na centrum Aten tez usuniety -- reconcileAllWorkedTiles nie ogranicza sie do stron podboju');
}

console.log('\n================ SEKCJA 2: wiring main.ts -- naprawa faktycznie wpieta we WSZYSTKIE call site\'y ================\n');

const MAIN_TS_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
const POST_BATTLE_MAP_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'game', 'post-battle-map.ts'), 'utf8');

console.log('2.1 main.ts::seedCityOwnerDefaults(...) wola reconcileAllWorkedTiles z prawidlowymi argumentami');
{
  const fnStartMarker = 'function seedCityOwnerDefaults(c: City): void {';
  const fnStart = MAIN_TS_SRC.indexOf(fnStartMarker);
  ok(fnStart >= 0, 'znaleziono seedCityOwnerDefaults(...) w main.ts');
  // Kolejna funkcja na TYM SAMYM poziomie zagniezdzenia (4 spacje) -- granica ciala.
  const fnEndIdx = fnStart >= 0 ? MAIN_TS_SRC.indexOf('\n    function ', fnStart + fnStartMarker.length) : -1;
  ok(fnEndIdx > fnStart, 'znaleziono koniec seedCityOwnerDefaults(...) (kolejna funkcja na tym samym poziomie)');
  const fnBody = fnStart >= 0 && fnEndIdx > fnStart ? MAIN_TS_SRC.slice(fnStart, fnEndIdx) : '';

  ok(/reconcileAllWorkedTiles\(/.test(fnBody),
    'P-MILET-ATENY: cialo seedCityOwnerDefaults(...) wola reconcileAllWorkedTiles(...)');
  ok(/reconcileAllWorkedTiles\(\s*cities,\s*buildAllTerritoryNodes\(\),\s*computeLostToNearerSiblingByCity\(cities, map\)\s*\)/.test(fnBody),
    'wywolanie uzywa tego samego wzorca argumentow co juz istniejacy call site zakladania miasta gracza (main.ts ~linia 10922): cities, buildAllTerritoryNodes(), computeLostToNearerSiblingByCity(cities, map)');
}

console.log('\n2.2 wszystkie 4 realne miejsca zmiany wlasciciela miasta nadal woluja seedCityOwnerDefaults(...) (naprawa (2.1) je wiec pokrywa)');
{
  // (a) Kapitulacja z glodu (resolveSiegeSurrender) -- city.ownerId = newOwner PRZED
  // seedCityOwnerDefaults. Odstep az do 1500 znakow -- miedzy nimi jest dlugi
  // dwujezyczny komentarz B1 (Evaluator RUNDA 1) tlumaczacy R-EPOKA-BRAZU-WYMUSZONA-WOJNA.
  ok(/city\.ownerId = newOwner;[\s\S]{0,1500}?seedCityOwnerDefaults\(city\);/.test(MAIN_TS_SRC),
    '(a) kapitulacja glodowa (resolveSiegeSurrender): city.ownerId = newOwner -> seedCityOwnerDefaults(city)');

  // (b) Wchloniecie dyplomatyczne (annexCityStateToOwner) -- petla po csCities, kazde dostaje nowego wlasciciela.
  ok(/for \(const city of csCities\) \{[\s\S]{0,300}?city\.ownerId = annexerId;[\s\S]{0,300}?seedCityOwnerDefaults\(city\);/.test(MAIN_TS_SRC),
    '(b) wchloniecie dyplomatyczne (annexCityStateToOwner): city.ownerId = annexerId -> seedCityOwnerDefaults(city) w petli po csCities');

  // (c) Podboj w bitwie (applyCityCaptureToMap -> onOwnerChanged callback).
  ok(/onOwnerChanged: \(c: City\): void => \{\s*seedCityOwnerDefaults\(c\);/.test(MAIN_TS_SRC),
    "(c) podboj w bitwie (applyCityCaptureToMap): callback onOwnerChanged wola seedCityOwnerDefaults(c)");
  // post-battle-map.ts musi USTAWIC city.ownerId PRZED wywolaniem tego callbacku --
  // inaczej reconcile w seedCityOwnerDefaults widzialby jeszcze STAREGO wlasciciela.
  ok(/city\.ownerId = atkOwner;[\s\S]{0,200}?captureOpts\?\.onOwnerChanged\?\.\(city\);/.test(POST_BATTLE_MAP_SRC),
    'post-battle-map.ts::applyCityCaptureAfterBattle: city.ownerId = atkOwner USTAWIONE przed wywolaniem onOwnerChanged (wiec reconcile widzi juz NOWEGO wlasciciela)');

  // (d) Rebelia (city.ownerId = REBEL_FACTION_OWNER_ID).
  ok(/city\.ownerId = REBEL_FACTION_OWNER_ID;[\s\S]{0,300}?seedCityOwnerDefaults\(city\);/.test(MAIN_TS_SRC),
    '(d) przejscie do rebeliantow: city.ownerId = REBEL_FACTION_OWNER_ID -> seedCityOwnerDefaults(city)');
}

console.log('\n2.3 kontrakt "wywoluj PO kazdej zmianie city.ownerId" nadal udokumentowany w JSDoc seedCityOwnerDefaults');
{
  ok(/Wywołuj tę funkcję PO każdej zmianie city\.ownerId/.test(MAIN_TS_SRC),
    'JSDoc seedCityOwnerDefaults nadal jednoznacznie wymaga wywolania PO zmianie ownerId (kontrakt, na ktorym opiera sie cala naprawa)');
}

// --- summary -------------------------------------------------------------------
const total = passed + failed;
if (failed === 0) {
  console.log(`\nOKOLICA-OWNERSHIP-CHANGE-RECONCILE OK (${passed}/${total})`);
} else {
  console.log(`\nOKOLICA-OWNERSHIP-CHANGE-RECONCILE FAIL (${passed}/${total} passed, ${failed} failed)`);
}

try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }

process.exit(failed === 0 ? 0 : 1);
