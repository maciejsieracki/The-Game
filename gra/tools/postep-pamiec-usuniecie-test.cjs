'use strict';
/**
 * postep-pamiec-usuniecie-test.cjs — R-PRODUKCJA-POSTEP-PAMIEC-PO-USUNIECIU-Q1
 * Uruchom z gra/:  node tools/postep-pamiec-usuniecie-test.cjs
 *
 * Odwraca P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B WYŁĄCZNIE dla ścieżki
 * anulowania/usunięcia budynku z kolejki Pracy przez gracza (dequeue /
 * cancelQueueItem, front LUB pozycja oczekująca): zamiast bezpowrotnie tracić
 * postęp, `dequeue(prod, index, city)` bankuje go do nowego pola
 * `City.postepBudynkowUsuniete` (`game/cities.ts`), a `enqueue(prod, item,
 * city)` przywraca go przy ponownym dodaniu TEGO SAMEGO budynku w TYM SAMYM
 * mieście (konsumując zapis). Zero zmian w `dropFrontItem`/`promoteToFront`/
 * `advanceProduction`/`rushProduction`/`filterQueue`/`sanitizeBuildQueue` --
 * ich własne testy (promote-to-front-test.cjs) pozostają zielone bez zmian w
 * ich pliku (zweryfikowane osobno, patrz raport rundy).
 *
 * Kryteria końca 1-4 dispatchu (00-dispatch.md), po jednym bloku testowym:
 *   1. połowa Pracy → usunięcie → ponowne dodanie do TEGO SAMEGO miasta →
 *      startuje z ~połową postępu.
 *   2. pamięć NIE znika samoistnie mimo wielu kolejnych `advanceProduction`
 *      (upływu tur) na innych, niepowiązanych kolejkach.
 *   3. pamięć jest PER-MIASTO -- to samo id budynku w INNYM mieście nie
 *      dziedziczy zbankowanego postępu.
 *   4. migracja: prawdziwy fixture starego zapisu (bez nowego pola)
 *      wczytany PRAWDZIWĄ ścieżką `save.ts` (`deserializeGame`) +
 *      `ensureCitySaveDefaults` (dokładnie to, co main.ts::restoreGameFromSave
 *      woła dla każdego miasta po wczytaniu) -- zero crashy, pusta pamięć.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[postep-pamiec-usuniecie-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.postep-pamiec-usuniecie-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.postep-pamiec-usuniecie-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  enqueue,
  dequeue,
  forfeitedProgressForIndex,
  bankRemovedBuildingProgress,
  withdrawBankedBuildingProgress,
  advanceProduction,
} from '../src/game/production';
export { ensureCitySaveDefaults } from '../src/game/cities';
export { serializeGame, deserializeGame, SAVE_VERSION } from '../src/game/save';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[postep-pamiec-usuniecie-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  [OK] ' + label); passed++; }
  else { console.error('  [FAIL] ' + label); failed++; }
}
function eq(a, b, label) { ok(a === b, label + ' (got=' + JSON.stringify(a) + ', want=' + JSON.stringify(b) + ')'); }

function freshCity(id, ownerId) {
  // Minimalny, ale realistyczny City -- wyłącznie pola, których dotykają
  // funkcje pod testem (`postepBudynkowUsuniete`) plus te wymagane przez
  // ensureCitySaveDefaults (część 4), żeby test naprawdę przechodził przez
  // TĘ SAMĄ migrację co main.ts, nie omijał jej.
  return {
    id, ownerId, q: 0, r: 0, name: 'Test', population: 1,
  };
}

console.log('\n=== KRYTERIUM 1: polowa Pracy -> usuniecie -> ponowne dodanie -> ~polowa postepu ===');
{
  const city = freshCity('miasto-A', 0);
  const item = { kind: 'budynek', id: 'stolarnia', nazwa: 'Stolarnia', koszt: 100 };
  let prod = { kolejka: [item], postep: 50, wstrzymana: false };

  console.log('-- PRZED usunieciem --');
  eq(prod.postep, 50, 'front: aktywny postep = 50 (polowa kosztu 100)');
  eq(prod.kolejka.length, 1, 'kolejka ma 1 pozycje (front)');
  eq(city.postepBudynkowUsuniete, undefined, 'miasto: brak pamieci przed usunieciem');

  console.log('-- PO usunieciu (cancelQueueItem -> dequeue(prod, 0, city)) --');
  const forfeited = M.forfeitedProgressForIndex(prod, 0);
  eq(forfeited, 50, 'forfeitedProgressForIndex zwraca dokladnie 50 przed usunieciem');
  const prodAfterCancel = M.dequeue(prod, 0, city);
  eq(prodAfterCancel.kolejka.length, 0, 'kolejka pusta po usunieciu jedynej pozycji');
  eq(prodAfterCancel.postep, 0, 'aktywny postep kolejki = 0 (front pusty)');
  eq(city.postepBudynkowUsuniete.stolarnia, 50, 'miasto: zbankowane DOKLADNIE 50 dla stolarnia');

  console.log('-- PO ponownym dodaniu TEGO SAMEGO budynku w TYM SAMYM miescie (addItem -> enqueue(prod, item, city)) --');
  const freshItem = { kind: 'budynek', id: 'stolarnia', nazwa: 'Stolarnia', koszt: 100 };
  const prodAfterReadd = M.enqueue(prodAfterCancel, freshItem, city);
  eq(prodAfterReadd.kolejka.length, 1, 'kolejka znow ma 1 pozycje (front)');
  eq(prodAfterReadd.postep, 50, 'nowa pozycja startuje z PRZYWROCONYM postepem 50 (polowa 100), nie od zera');
  eq(prodAfterReadd.kolejka[0].postep, undefined, 'niezmiennik: front (index 0) nigdy nie niesie wlasnego pola postep');
  ok(!('stolarnia' in (city.postepBudynkowUsuniete || {})), 'zapis w pamieci SKONSUMOWANY (usuniety) po ponownym dodaniu');
}

console.log('\n=== KRYTERIUM 1b: to samo, ale usunieta pozycja OCZEKUJACA (index=1, nie front) ===');
{
  const city = freshCity('miasto-A2', 0);
  const front = { kind: 'budynek', id: 'koszary', nazwa: 'Koszary', koszt: 40 };
  // Pozycja oczekujaca z WLASNYM zbankowanym postepem (np. wczesniej byla
  // frontem i zeszla z niego przez promoteToFront -- ten sam ksztalt co
  // promote-to-front-test.cjs test 6) -- 30 z kosztu 60.
  const waiting = { kind: 'budynek', id: 'swiatynia', nazwa: 'Swiatynia', koszt: 60, postep: 30 };
  let prod = { kolejka: [front, waiting], postep: 5 };

  console.log('-- PRZED usunieciem (pozycja oczekujaca, index=1) --');
  eq(M.forfeitedProgressForIndex(prod, 1), 30, 'forfeitedProgressForIndex(index=1) = 30 (wlasny zbankowany postep pozycji oczekujacej)');

  console.log('-- PO usunieciu pozycji oczekujacej --');
  const prodAfter = M.dequeue(prod, 1, city);
  eq(prodAfter.kolejka.length, 1, 'front zostaje, pozycja oczekujaca zniknela');
  eq(prodAfter.postep, 5, 'aktywny postep FRONTU nietkniety (5, nie dotyczy usunietej pozycji)');
  eq(city.postepBudynkowUsuniete.swiatynia, 30, 'miasto: zbankowane 30 dla swiatynia (pozycja oczekujaca, nie front)');

  console.log('-- PO ponownym dodaniu (kolejka NIEPUSTA -> nowa pozycja dolacza jako oczekujaca z wlasnym postep) --');
  const prodAfter2 = M.enqueue(prodAfter, { kind: 'budynek', id: 'swiatynia', nazwa: 'Swiatynia', koszt: 60 }, city);
  eq(prodAfter2.kolejka.length, 2, 'kolejka znow ma 2 pozycje');
  eq(prodAfter2.kolejka[1].postep, 30, 'nowo dodana pozycja oczekujaca niesie przywrocony wlasny postep 30');
  eq(prodAfter2.postep, 5, 'aktywny postep frontu bez zmian (5) -- postep nie przeskoczyl na front');
  ok(!('swiatynia' in (city.postepBudynkowUsuniete || {})), 'zapis skonsumowany po ponownym dodaniu (pozycja oczekujaca)');
}

console.log('\n=== KRYTERIUM 1c: powtorne usuniecie TEGO SAMEGO budynku NADPISUJE stary zapis (nie sumuje) ===');
{
  const city = freshCity('miasto-A3', 0);
  const item1 = { kind: 'budynek', id: 'port', nazwa: 'Port', koszt: 200 };
  M.bankRemovedBuildingProgress(city, { kolejka: [item1], postep: 80 }, 0);
  eq(city.postepBudynkowUsuniete.port, 80, 'pierwszy zapis: 80');
  const item2 = { kind: 'budynek', id: 'port', nazwa: 'Port', koszt: 200 };
  M.bankRemovedBuildingProgress(city, { kolejka: [item2], postep: 25 }, 0);
  eq(city.postepBudynkowUsuniete.port, 25, 'drugi zapis NADPISUJE pierwszy: 25 (nie 105=80+25)');
}

console.log('\n=== KRYTERIUM 2: pamiec NIE znika samoistnie mimo uplywu wielu tur (advanceProduction na innej, niepowiazanej kolejce) ===');
{
  const city = freshCity('miasto-B', 0);
  M.bankRemovedBuildingProgress(city, { kolejka: [{ kind: 'budynek', id: 'mennica', nazwa: 'Mennica', koszt: 90 }], postep: 33 }, 0);
  eq(city.postepBudynkowUsuniete.mennica, 33, 'zapis poczatkowy: 33');

  let innaKolejka = { kolejka: [{ kind: 'budynek', id: 'inny-budynek', nazwa: 'Inny', koszt: 10 }], postep: 0 };
  for (let tura = 1; tura <= 5; tura++) {
    const r = M.advanceProduction(innaKolejka, 1);
    innaKolejka = r.prod;
  }
  eq(city.postepBudynkowUsuniete.mennica, 33, 'po 5 turach na NIEPOWIAZANEJ kolejce pamiec dla mennica wciaz = 33 (bez TTL/wygasania)');
}

console.log('\n=== KRYTERIUM 3: pamiec jest PER-MIASTO, nie globalna dla gracza ===');
{
  const cityA = freshCity('miasto-C1', 0);
  const cityB = freshCity('miasto-C2', 0); // ten sam ownerId co A -- ten sam gracz, INNE miasto
  M.bankRemovedBuildingProgress(cityA, { kolejka: [{ kind: 'budynek', id: 'lazienki', nazwa: 'Lazienki', koszt: 70 }], postep: 40 }, 0);
  eq(cityA.postepBudynkowUsuniete.lazienki, 40, 'miasto A: zbankowane 40 dla lazienki');
  eq(cityB.postepBudynkowUsuniete, undefined, 'miasto B: BRAK jakiejkolwiek pamieci (osobny obiekt City)');

  const prodB = { kolejka: [], postep: 0 };
  const prodBAfterEnqueue = M.enqueue(prodB, { kind: 'budynek', id: 'lazienki', nazwa: 'Lazienki', koszt: 70 }, cityB);
  eq(prodBAfterEnqueue.postep, 0, 'miasto B dodaje lazienki od ZERA -- NIE dziedziczy postepu miasta A');
  eq(cityA.postepBudynkowUsuniete.lazienki, 40, 'miasto A: zapis nietkniety przez enqueue w miescie B (40 wciaz stoi)');
}

console.log('\n=== dodatkowa asercja: pamiec jest WYLACZNIE per-budynek (jednostki nie bankuja) ===');
{
  const city = freshCity('miasto-D', 0);
  const prod = { kolejka: [{ kind: 'jednostka', id: 'Wojownik', nazwa: 'Wojownik', koszt: 15, postep: 0 }], postep: 9 };
  const prodAfter = M.dequeue(prod, 0, city);
  eq(prodAfter.postep, 0, 'kolejka wyczyszczona jak dotychczas (kontrakt dequeue bez zmian)');
  ok(!city.postepBudynkowUsuniete || Object.keys(city.postepBudynkowUsuniete).length === 0, 'jednostka (kind=jednostka) NIE trafia do postepBudynkowUsuniete -- mechanizm wylacznie dla budynkow');
}

console.log('\n=== KRYTERIUM 4: migracja realnego zapisu (prawdziwa sciezka save.ts + ensureCitySaveDefaults) ===');
{
  // Prawdziwy fixture STAREGO zapisu -- City JSON bez pola postepBudynkowUsuniete
  // (dokladnie tak wygladal kazdy zapis PRZED ta runda), zserializowany jako
  // string JSON tak jak realny plik zapisu na dysku/w IndexedDB.
  const legacyCityJson = {
    id: 'miasto-legacy', ownerId: 0, q: 3, r: -2, name: 'Stare Miasto', population: 4,
    surowce: { drewno: 12 },
    // BRAK postepBudynkowUsuniete -- to jest sedno testu migracji.
  };
  const legacySave = {
    wersja: M.SAVE_VERSION,
    tura: 17,
    seed: 12345,
    units: [],
    cities: [legacyCityJson],
    explored: ['0,0', '1,0'],
  };
  const legacyJsonString = JSON.stringify(legacySave);
  ok(!legacyJsonString.includes('postepBudynkowUsuniete'), 'fixture faktycznie NIE zawiera nowego pola (prawdziwie "stary" zapis)');

  let deserialized;
  let threw = false;
  try {
    deserialized = M.deserializeGame(legacyJsonString);
  } catch (e) {
    threw = true;
    console.error('  deserializeGame rzucil:', e && e.message);
  }
  ok(!threw, 'deserializeGame() (prawdziwa funkcja save.ts) NIE rzuca na starym zapisie');
  eq(deserialized.cities.length, 1, 'deserializeGame: 1 miasto wczytane');

  const city = deserialized.cities[0];
  eq(city.postepBudynkowUsuniete, undefined, 'PRZED ensureCitySaveDefaults: pole faktycznie nieobecne (nie ukryte {})');

  let threw2 = false;
  try {
    // Dokladnie to, co main.ts::restoreGameFromSave robi dla KAZDEGO miasta z
    // wczytanego zapisu (`for (const c of saved.cities) ensureCitySaveDefaults(c);`).
    M.ensureCitySaveDefaults(city);
  } catch (e) {
    threw2 = true;
    console.error('  ensureCitySaveDefaults rzucil:', e && e.message);
  }
  ok(!threw2, 'ensureCitySaveDefaults() (prawdziwa funkcja cities.ts, ta sama ktora woła main.ts) NIE rzuca na starym miescie');
  ok(!!city.postepBudynkowUsuniete, 'PO ensureCitySaveDefaults: pole obecne');
  eq(Object.keys(city.postepBudynkowUsuniete).length, 0, 'PO ensureCitySaveDefaults: pamiec PUSTA ({}), brak zapisanego postepu dla zadnego budynku');
  eq(city.surowce.drewno, 12, 'kontrola: inne pola starego zapisu (surowce) przetrwaly migracje bez zmian');

  console.log('-- round-trip NOWEGO zapisu (z wypelniona pamiecia) przez prawdziwe serializeGame/deserializeGame --');
  const cityNew = freshCity('miasto-nowy', 0);
  cityNew.postepBudynkowUsuniete = { spichlerz: 17 };
  const saveNew = { wersja: M.SAVE_VERSION, tura: 3, seed: 1, units: [], cities: [cityNew], explored: [] };
  const roundTripped = M.deserializeGame(M.serializeGame(saveNew));
  eq(roundTripped.cities[0].postepBudynkowUsuniete.spichlerz, 17, 'nowy zapis: postepBudynkowUsuniete przezywa pelny round-trip serialize -> deserialize');
}

console.log('\n' + '='.repeat(72));
console.log(`postep-pamiec-usuniecie-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
