'use strict';
/**
 * promote-to-front-test.cjs — P-PRODUKCJA-BRAK-PROMOCJI-NA-GORE-KOLEJKI.
 *
 * Run from gra/:  node tools/promote-to-front-test.cjs
 *
 * Zgłoszenie Macieja: strzałki ↑↓ w panelu produkcji miasta przesuwały pozycję WYŁĄCZNIE
 * wewnątrz kolejki oczekujących (index >= 1 w CityProduction.kolejka) — nie dało się
 * "wciągnąć" żadnej pozycji na sam szczyt, zamieniając ją z aktualnie budowanym elementem
 * (index 0). Naprawa: promoteToFront() w src/game/production.ts + przycisk "⇈" (i rozszerzone
 * działanie ↑ na 1. pozycji kolejki) w src/ui/cityPanel.ts.
 *
 * Kluczowa decyzja projektowa pod testem: `postep` (zebrana Praca frontu) resetuje się do 0
 * przy KAŻDEJ zamianie — dokładnie ta sama reguła co przy dequeue(prod, 0) już w kodzie
 * ("Removing the front item resets postep to 0 -- accumulated work belonged to that item").
 * W tym modelu danych TYLKO index 0 ma pole postępu; pozycje kolejki (index >= 1) to gołe
 * ProductionItem bez własnego licznika Pracy — nie ma więc gdzie "odłożyć" częściowej Pracy
 * przy zdjęciu elementu z frontu. Dosłowne przeniesienie postep razem z pozycją byłoby też
 * furtką do nadużycia (zbierz Pracę na drogim froncie, zamień na tani element z kolejki,
 * dokończ go od razu za darmo) — patrz test 5 niżej.
 * / EN: Maciej's report: the ↑↓ arrows in the city production panel only reordered WITHIN
 * the waiting queue (index >= 1 in CityProduction.kolejka) — nothing could be "pulled" all
 * the way to the top, swapping with the currently-building item (index 0). Fix:
 * promoteToFront() in src/game/production.ts + a "⇈" button (and the first queue row's ↑ now
 * doing the same) in src/ui/cityPanel.ts.
 *
 * Design decision under test: `postep` (front's accumulated Praca) resets to 0 on EVERY swap
 * — the same rule dequeue(prod, 0) already applies. Only index 0 carries a progress field in
 * this data model; see test 5 for the exploit this reset prevents.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[promote-to-front-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.promote-to-front-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.promote-to-front-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { promoteToFront, frontItem } from '../src/game/production';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[promote-to-front-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch { /* best effort */ }
}

const M = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function item(id, koszt, kind = 'budynek') { return { kind, id, nazwa: id, koszt }; }
function ids(kolejka) { return kolejka.map(it => it.id).join(','); }

console.log('-- 1. podstawowa zamiana: pozycja 1 w kolejce staje się frontem --');
{
  // Odtwarza dokładnie scenariusz zgłoszenia: front=Spichlerz (postęp 4/80), kolejka=[Studnia, Garncarnia, Dom Starszyzny].
  const prod = {
    kolejka: [item('Spichlerz', 80), item('Studnia', 40), item('Garncarnia', 60), item('Dom Starszyzny', 100)],
    postep: 4,
  };
  const next = M.promoteToFront(prod, 1);
  eq(M.frontItem(next).id, 'Studnia', 'Studnia staje się aktualnie budowana');
  eq(ids(next.kolejka), 'Studnia,Spichlerz,Garncarnia,Dom Starszyzny', 'Spichlerz wraca do kolejki na miejsce Studni, reszta bez zmian');
  eq(next.postep, 0, 'postęp resetuje się do 0 -- Studnia zaczyna budowę od zera');
  // niemutowalnosc wejscia
  eq(ids(prod.kolejka), 'Spichlerz,Studnia,Garncarnia,Dom Starszyzny', 'oryginalny obiekt prod.kolejka nie jest mutowany');
  eq(prod.postep, 4, 'oryginalny prod.postep nie jest mutowany');
}

console.log('-- 2. zamiana z dalszą pozycją (index=2) to prawdziwy SWAP, nie przesunięcie całej listy --');
{
  const prod = { kolejka: [item('A', 10), item('B', 20), item('C', 30)], postep: 5 };
  const next = M.promoteToFront(prod, 2);
  eq(ids(next.kolejka), 'C,B,A', 'tylko index 0 i index 2 zamieniają się miejscami; B (index 1) zostaje na miejscu');
  eq(next.postep, 0, 'postęp resetuje się także przy zamianie z dalszą pozycją kolejki');
}

console.log('-- 3. index poza zakresem = no-op --');
{
  const prod = { kolejka: [item('A', 10), item('B', 20)], postep: 7 };
  eq(ids(M.promoteToFront(prod, 0).kolejka), 'A,B', 'index=0 (sam front) to no-op');
  eq(M.promoteToFront(prod, 0).postep, 7, 'no-op zachowuje postęp bez zmian');
  eq(ids(M.promoteToFront(prod, 2).kolejka), 'A,B', 'index >= kolejka.length to no-op');
  eq(ids(M.promoteToFront(prod, -1).kolejka), 'A,B', 'index ujemny to no-op');
  eq(ids(M.promoteToFront({ kolejka: [], postep: 0 }, 1).kolejka), '', 'pusta kolejka: no-op, nie rzuca wyjątkiem');
}

console.log('-- 4. flagi wstrzymana + kolejka rekrutacji przechodzą przez zamianę bez zmian --');
{
  const prod = {
    kolejka: [item('A', 10), item('B', 20)],
    postep: 3,
    wstrzymana: true,
    rekrutacja: [item('Zwiadowca', 5, 'jednostka')],
  };
  const next = M.promoteToFront(prod, 1);
  eq(next.wstrzymana, true, 'flaga wstrzymana pozostaje bez zmian po zamianie (kolejka budowy nadal wstrzymana)');
  eq(next.rekrutacja.length, 1, 'kolejka rekrutacji (osobna, płatna Pieniądzem) nietknięta przez zamianę kolejki budowy');
  eq(next.rekrutacja[0].id, 'Zwiadowca', 'zawartość kolejki rekrutacji bez zmian');
}

console.log('-- 5. reset postępu blokuje nadużycie "zbierz Pracę na drogim froncie, dokończ tani element za darmo" --');
{
  // Front = bardzo drogi budynek (koszt 1000) z prawie ukończonym postępem (990/1000).
  // Gdyby postęp "podróżował" razem z pozycją, zamiana na tani element (koszt 15) dałaby
  // natychmiastowe ukończenie za 990 Pracy, której ten element nigdy nie zebrał.
  const prod = { kolejka: [item('Cud', 1000), item('Chatka', 15)], postep: 990 };
  const next = M.promoteToFront(prod, 1);
  eq(M.frontItem(next).id, 'Chatka', 'Chatka (tani element) staje się frontem');
  eq(next.postep, 0, 'postęp NIE przenosi się na Chatkę -- zero Pracy zebranej, brak darmowego ukończenia');
  assert(next.postep < (M.frontItem(next)).koszt, 'nowy front nie jest "ukończony" od razu po zamianie');
}

console.log('-- 6. podwójna zamiana (round-trip): powrót do oryginalnego frontu też resetuje postęp --');
{
  let prod = { kolejka: [item('A', 10), item('B', 20), item('C', 30)], postep: 8 };
  prod = M.promoteToFront(prod, 1); // B front, A na 1. pozycji kolejki, postęp=0
  eq(M.frontItem(prod).id, 'B', 'po 1. zamianie B jest frontem');
  prod = { ...prod, postep: 15 }; // symulacja: kilka tur Pracy zebranej na B
  prod = M.promoteToFront(prod, 1); // A wraca na front (zamiana z pozycją 1, gdzie teraz siedzi A)
  eq(M.frontItem(prod).id, 'A', 'po 2. zamianie A ponownie jest frontem');
  eq(ids(prod.kolejka), 'A,B,C', 'kolejka wraca do oryginalnego porządku');
  eq(prod.postep, 0, 'postęp resetuje się przy KAŻDEJ zamianie, także przy powrocie do poprzedniego frontu');
}

console.log('-- 7. index nie-całkowity (NaN / undefined / ułamkowy) = no-op odporny, nie crash i nie wstawienie undefined --');
{
  // Bez Number.isInteger w guardzie: `NaN < 1` i `NaN >= length` są OBA false, więc guard
  // przepuszczał, a kolejka[NaN] dawało undefined -- ten undefined lądował na froncie kolejki.
  const prod = { kolejka: [item('A', 10), item('B', 20), item('C', 30)], postep: 7 };

  const viaNaN = M.promoteToFront(prod, NaN);
  eq(ids(viaNaN.kolejka), 'A,B,C', 'index=NaN: kolejka niezmieniona, brak undefined wstawionego na front');
  eq(viaNaN.postep, 7, 'index=NaN: postęp niezmieniony (prawdziwy no-op, nie reset)');
  assert(viaNaN.kolejka.every(it => it !== undefined), 'index=NaN: żaden element kolejki nie jest undefined');
  assert(!!M.frontItem(viaNaN), 'index=NaN: frontItem() nie rzuca (front nie jest undefined)');
  eq(M.frontItem(viaNaN).id, 'A', 'index=NaN: front pozostaje oryginalnym elementem A');

  const viaUndefined = M.promoteToFront(prod, undefined);
  eq(ids(viaUndefined.kolejka), 'A,B,C', 'index=undefined: kolejka niezmieniona');
  eq(viaUndefined.postep, 7, 'index=undefined: postęp niezmieniony');
  assert(viaUndefined.kolejka.every(it => it !== undefined), 'index=undefined: żaden element kolejki nie jest undefined');
  assert(!!M.frontItem(viaUndefined), 'index=undefined: frontItem() nie rzuca');

  const viaFractional = M.promoteToFront(prod, 1.5);
  eq(ids(viaFractional.kolejka), 'A,B,C', 'index=1.5 (ułamkowy, w zakresie): kolejka niezmieniona -- brak "prawie trafienia"');
  eq(viaFractional.postep, 7, 'index=1.5: postęp niezmieniony');
  assert(viaFractional.kolejka.every(it => it !== undefined), 'index=1.5: żaden element kolejki nie jest undefined');
  assert(!!M.frontItem(viaFractional), 'index=1.5: frontItem() nie rzuca');

  // oryginalny obiekt wejściowy nadal nietknięty po wszystkich trzech wywołaniach
  eq(ids(prod.kolejka), 'A,B,C', 'oryginalny prod.kolejka nie jest mutowany przez żadne z powyższych wywołań');
  eq(prod.postep, 7, 'oryginalny prod.postep nie jest mutowany');
}

console.log(`\npromote-to-front-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
