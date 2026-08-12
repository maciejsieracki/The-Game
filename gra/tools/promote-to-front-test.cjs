'use strict';
/**
 * promote-to-front-test.cjs — P-PRODUKCJA-BRAK-PROMOCJI-NA-GORE-KOLEJKI +
 * P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B.
 *
 * Run from gra/:  node tools/promote-to-front-test.cjs
 *
 * Zgłoszenie Macieja (org.): strzałki ↑↓ w panelu produkcji miasta przesuwały pozycję
 * WYŁĄCZNIE wewnątrz kolejki oczekujących (index >= 1 w CityProduction.kolejka) — nie dało
 * się "wciągnąć" żadnej pozycji na sam szczyt, zamieniając ją z aktualnie budowanym elementem
 * (index 0). Naprawa: promoteToFront() w src/game/production.ts + przycisk "⇈" (i rozszerzone
 * działanie ↑ na 1. pozycji kolejki) w src/ui/cityPanel.ts.
 *
 * DECYZJA 2026-08-13 (P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B, ODWRACA poprzednią decyzję pod
 * tym samym testem): promoteToFront() już NIE resetuje postępu do 0 przy zamianie. Zamiast
 * tego postęp jest BANKOWANY PER-ITEM (`ProductionItem.postep`, pole opcjonalne): item
 * schodzący z frontu zabiera ze sobą swój aktywny postęp (zapisany na SOBIE, nie ginie);
 * item wchodzący na front oddaje swój wcześniej zbankowany postęp (0, jeśli nigdy nie był
 * na froncie) jako nowy aktywny `prod.postep`. Oryginalny exploit ("zbierz Pracę na drogim
 * froncie, dokończ tani element za darmo") POZOSTAJE zablokowany, bo postęp nigdy nie
 * przeskakuje między RÓŻNYMI itemami — wraca WYŁĄCZNIE do TEGO SAMEGO itemu, gdy ten ponownie
 * staje się frontem. Testy 5-6 poniżej zaktualizowane pod nowe zachowanie; testy 8-10 pokrywają
 * pełny scenariusz z dyspozycji (Cud koszt 1000 + tani element koszt 10).
 * / EN: Maciej's report: the ↑↓ arrows in the city production panel only reordered WITHIN
 * the waiting queue (index >= 1 in CityProduction.kolejka) — nothing could be "pulled" all
 * the way to the top, swapping with the currently-building item (index 0). Fix:
 * promoteToFront() in src/game/production.ts + a "⇈" button (and the first queue row's ↑ now
 * doing the same) in src/ui/cityPanel.ts.
 *
 * DECISION 2026-08-13 (P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B, REVERSES the previous decision
 * under this same test): promoteToFront() no longer resets progress to 0 on swap. Instead
 * progress is BANKED PER-ITEM (`ProductionItem.postep`, optional field): the item leaving the
 * front takes its active progress WITH it (banked on itself, not lost); the item entering the
 * front hands back its own previously-banked progress (0 if it was never on the front) as the
 * new active `prod.postep`. The original exploit ("farm Praca on an expensive front item,
 * finish a cheap item for free") REMAINS blocked because progress never jumps between
 * DIFFERENT items -- it only ever returns to the SAME item once it becomes the front again.
 * Tests 5-6 below updated for the new behaviour; tests 8-10 cover the full scenario from the
 * work order (a Wonder costing 1000 + a cheap item costing 10).
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
export { promoteToFront, frontItem, advanceProduction, enqueue, dequeue, rushProduction, insertAtFront } from '../src/game/production';
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
  eq(next.postep, 0, 'Studnia (nigdy wcześniej nie była frontem) startuje z zbankowanym 0 -- to NIE reset, po prostu nigdy wcześniej nic nie zbankowała (patrz decyzja Q1=B, sekcja 5-6 niżej)');
  // niemutowalnosc wejscia
  eq(ids(prod.kolejka), 'Spichlerz,Studnia,Garncarnia,Dom Starszyzny', 'oryginalny obiekt prod.kolejka nie jest mutowany');
  eq(prod.postep, 4, 'oryginalny prod.postep nie jest mutowany');
}

console.log('-- 2. zamiana z dalszą pozycją (index=2) to prawdziwy SWAP, nie przesunięcie całej listy --');
{
  const prod = { kolejka: [item('A', 10), item('B', 20), item('C', 30)], postep: 5 };
  const next = M.promoteToFront(prod, 2);
  eq(ids(next.kolejka), 'C,B,A', 'tylko index 0 i index 2 zamieniają się miejscami; B (index 1) zostaje na miejscu');
  eq(next.postep, 0, 'C (nigdy wcześniej nie był frontem) startuje z zbankowanym 0 również przy zamianie z dalszą pozycją kolejki -- nie jest to reset');
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

console.log('-- 5. exploit NADAL zablokowany: postęp nie przeskakuje na RÓŻNY, wcześniej-nie-frontowy element --');
{
  // Front = bardzo drogi budynek (koszt 1000) z prawie ukończonym postępem (990/1000).
  // Chatka NIGDY wcześniej nie była frontem (brak własnego pola postep) -- mimo że postęp
  // jest teraz bankowany per-item (nie resetowany do 0), Chatka i tak startuje z zbankowanym
  // 0, bo bankowanie jest PER-ITEM, nie "przenoszone dalej" na inny item.
  const prod = { kolejka: [item('Cud', 1000), item('Chatka', 15)], postep: 990 };
  const next = M.promoteToFront(prod, 1);
  eq(M.frontItem(next).id, 'Chatka', 'Chatka (tani element) staje się frontem');
  eq(next.postep, 0, 'postęp NIE przeskakuje na Chatkę -- zero Pracy zebranej, brak darmowego ukończenia');
  assert(next.postep < (M.frontItem(next)).koszt, 'nowy front nie jest "ukończony" od razu po zamianie');
  // Nowość vs stare zachowanie: postęp Cudu NIE ginie -- jest zbankowany NA NIM, widoczny
  // w kolejce pod jego własnym `postep`, gotowy do odzyskania gdy Cud wróci na front.
  const cudInQueue = next.kolejka.find(it => it.id === 'Cud');
  eq(cudInQueue.postep, 990, 'postęp Cudu (990) jest zbankowany NA NIM w kolejce, nie utracony');
}

console.log('-- 6. podwójna zamiana (round-trip): powrót do TEGO SAMEGO frontu PRZYWRACA jego postęp (nie resetuje) --');
{
  let prod = { kolejka: [item('A', 10), item('B', 20), item('C', 30)], postep: 8 };
  prod = M.promoteToFront(prod, 1); // B front, A na 1. pozycji kolejki (zbankowane postep:8), aktywny postęp=0
  eq(M.frontItem(prod).id, 'B', 'po 1. zamianie B jest frontem');
  eq(prod.postep, 0, 'B nigdy wcześniej nie był frontem -- startuje z zbankowanym 0');
  eq(prod.kolejka.find(it => it.id === 'A').postep, 8, 'postęp A (8) zbankowany na A w kolejce po zejściu z frontu');
  prod = { ...prod, postep: 15 }; // symulacja: kilka tur Pracy zebranej na B (advanceProduction w realnej grze)
  prod = M.promoteToFront(prod, 1); // A wraca na front (zamiana z pozycją 1, gdzie teraz siedzi A)
  eq(M.frontItem(prod).id, 'A', 'po 2. zamianie A ponownie jest frontem');
  eq(ids(prod.kolejka), 'A,B,C', 'kolejka wraca do oryginalnego porządku');
  eq(prod.postep, 8, 'A ODZYSKUJE dokładnie swój wcześniej zbankowany postęp (8) -- NIE reset do 0 (decyzja Q1=B)');
  eq(prod.kolejka.find(it => it.id === 'B').postep, 15, 'postęp B (15) jest teraz zbankowany na B, czeka na jego powrót');
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

console.log('-- 8. scenariusz z dyspozycji, krok 1: Cud (koszt 1000) na froncie, zebrano 500 Pracy, promuj tani element --');
{
  // Cud (koszt 1000, np. cud starożytny) na froncie z 500/1000 Pracy zebranej. Tani element
  // (koszt 10) NIGDY wcześniej nie był na froncie -- w kolejce na indeksie 1.
  const prod = { kolejka: [item('Cud', 1000), item('TaniElement', 10)], postep: 500 };
  const next = M.promoteToFront(prod, 1);
  eq(M.frontItem(next).id, 'TaniElement', 'tani element staje się nowym frontem');
  eq(next.postep, 0, 'tani element startuje z postępem 0 -- NIE dziedziczy 500 Pracy Cudu');
  assert(next.postep < M.frontItem(next).koszt, 'tani element (koszt 10) nie jest ukończony od razu po promocji');
  const cudBanked = next.kolejka.find(it => it.id === 'Cud');
  eq(cudBanked.postep, 500, 'Cud zachowuje zbankowane 500 Pracy, teraz na pozycji w kolejce (nie na froncie)');
}

console.log('-- 9. RUNDA 2 (naprawa B1): Cud odzyskuje zbankowany postęp przy NATURALNYM dokończeniu poprzedzającego elementu, nie tylko przy ręcznej promocji --');
{
  // Scenariusz z dyspozycji rundy 2: Cud (koszt 1000) na froncie z 500/1000 Pracy zebranej.
  // Promujemy Wojownika (koszt 10, nigdy wcześniej nie był frontem) -- Cud schodzi z frontu i
  // bankuje swoje 500 (promoteToFront, patrz test 8). Wojownik kończy się NATURALNIE (bez
  // kolejnej ręcznej promocji) w jednej turze advanceProduction -- to DOMINUJĄCA ścieżka
  // powrotu itemu na front, którą Evaluator w rundzie 1 wskazał jako martwą: advanceProduction
  // zdejmował front gołym `kolejka.slice(1)` + `postep: remainder`, NIE czytając zbankowanego
  // ProductionItem.postep nowego frontu -- zbankowana wartość Cudu ginęła bezpowrotnie, nadpisana
  // przy następnej promocji. Ten test PRZED naprawą rundy 2 przypinał to zachowanie jako
  // "zamierzone" (fałszywy komentarz "advanceProduction NIE zna per-item postep") -- teraz
  // asercjonuje naprawę: Cud wraca z 500, NIE z 0.
  // / EN: round-2 work-order scenario: a Wonder (cost 1000) on the front with 500/1000 Praca
  // banked. Promote a Warrior (cost 10, never on the front before) -- the Wonder leaves the
  // front and banks its 500 (promoteToFront, see test 8). The Warrior finishes NATURALLY
  // (no further manual promotion) in one advanceProduction turn -- the DOMINANT path back to
  // the front, which the Evaluator flagged as dead in round 1: advanceProduction used to drop
  // the front with a bare `kolejka.slice(1)` + `postep: remainder`, never reading the new
  // front's banked ProductionItem.postep -- the Wonder's banked value was lost for good, silently
  // overwritten by the next promotion. This test used to pin that as "intended" (a false comment
  // claiming "advanceProduction doesn't know per-item postep") -- it now asserts the fix instead:
  // the Wonder comes back with 500, NOT 0.
  let prod = { kolejka: [item('Cud', 1000), item('Wojownik', 10, 'jednostka')], postep: 500 };
  prod = M.promoteToFront(prod, 1);
  eq(M.frontItem(prod).id, 'Wojownik', 'Wojownik staje się frontem po promocji');
  eq(prod.postep, 0, 'Wojownik nigdy wcześniej nie był frontem -- startuje z zbankowanym 0');
  eq(prod.kolejka.find(it => it.id === 'Cud').postep, 500, 'Cud bankuje swoje 500 Pracy schodząc z frontu');

  const { prod: afterAdv, completed } = M.advanceProduction(prod, 10);
  eq(completed && completed.id, 'Wojownik', 'Wojownik kończy się naturalnie (10 Pracy = dokładnie jego koszt)');
  eq(M.frontItem(afterAdv).id, 'Cud', 'Cud staje się nowym frontem po naturalnym dokończeniu Wojownika');
  eq(afterAdv.postep, 500, 'B1 NAPRAWIONY: Cud ODZYSKUJE zbankowane 500 Pracy przy naturalnym dokończeniu poprzednika -- NIE 0');
  eq(M.frontItem(afterAdv).postep, undefined, 'niezmiennik: front (Cud) po zdjęciu poprzednika nie niesie już własnego pola postep -- żyje wyłącznie w afterAdv.postep');
}

console.log('-- 10. scenariusz z dyspozycji, krok 3: promuj Cud z powrotem na front -- odzyskuje dokładnie 500 --');
{
  // Cud (koszt 1000, zbankowane postep:500) siedzi na indeksie 1 za nowym frontem (np. kolejny
  // tani element dodany po ukończeniu poprzedniego, koszt 20, aktywny postęp 3).
  const prod = { kolejka: [item('Inny', 20), item('Cud', 1000)], postep: 3 };
  prod.kolejka[1].postep = 500; // Cud niesie zbankowane 500 z testów 8-9
  const next = M.promoteToFront(prod, 1);
  eq(M.frontItem(next).id, 'Cud', 'Cud ponownie staje się frontem');
  eq(next.postep, 500, 'Cud ODZYSKUJE dokładnie 500 Pracy postępu -- NIE 0 (decyzja właściciela Q1=B)');
  const innyBanked = next.kolejka.find(it => it.id === 'Inny');
  eq(innyBanked.postep, 3, 'Inny (poprzedni front) zabiera swoje 3 Pracy zbankowane na siebie, zamiast je tracić');
}

console.log('-- 11. regresja: naturalne dokończenie BEZ promocji nadal przenosi remainder na kolejny element (advanceProduction) --');
{
  // Zero interakcji z promoteToFront -- czysta regresja istniejącego mechanizmu przeniesienia
  // nadwyżki Pracy (remainder) na kolejny element w JEDNEJ turze (Schemat sec.3.2).
  const prod = M.enqueue({ kolejka: [item('A', 10)], postep: 7 }, item('B', 20));
  const { prod: afterAdv, completed } = M.advanceProduction(prod, 8); // 7+8=15 >= 10 -> A kończy się, remainder=5
  eq(completed && completed.id, 'A', 'A kończy się (7+8=15 Pracy >= koszt 10)');
  eq(M.frontItem(afterAdv).id, 'B', 'B staje się nowym frontem po naturalnym dokończeniu A');
  eq(afterAdv.postep, 5, 'nadwyżka Pracy (15-10=5) przechodzi jako startowy postęp B -- bez zmian vs dotychczasowa logika');
}

console.log('-- 12. RUNDA 2 (naprawa B1): niezmiennik postep -- rushProduction też odzyskuje zbankowany postęp nowego frontu, i czyści jego pole --');
{
  // Cud (koszt 1000, 500/1000 Pracy) na froncie; promuj Wojownika (koszt 10) -- Cud bankuje 500.
  // Wykup (rushProduction) kończy Wojownika NATYCHMIAST, niezależnie od Pracy -- to druga
  // linia z bloku Evaluatora (~1507), ta sama klasa martwego pola co advanceProduction w teście 9.
  // / EN: same class of dead-field bug as advanceProduction (test 9), but via the rush-buy path
  // (~line 1507 in the Evaluator's report) instead of natural completion.
  let prod = { kolejka: [item('Cud', 1000), item('Wojownik', 10, 'jednostka')], postep: 500 };
  prod = M.promoteToFront(prod, 1); // Wojownik front (postep 0), Cud zbankowany (postep 500)
  const { prod: afterRush, completed } = M.rushProduction(prod);
  eq(completed && completed.id, 'Wojownik', 'rushProduction kończy front (Wojownik) natychmiast, niezależnie od zebranej Pracy');
  eq(M.frontItem(afterRush).id, 'Cud', 'Cud staje się nowym frontem po wykupie Wojownika');
  eq(afterRush.postep, 500, 'B1 NAPRAWIONY: rushProduction też odzyskuje zbankowane 500 Pracy Cudu -- NIE 0');
  eq(M.frontItem(afterRush).postep, undefined, 'niezmiennik: front (Cud) po rushProduction nie niesie już własnego pola postep');
}

console.log('-- 13. RUNDA 2: niezmiennik postep -- dequeue(0) też odzyskuje zbankowany postęp NOWEGO frontu; anulowany item traci TYLKO swój własny postęp --');
{
  // Decyzja techniczna Operatora (runda 2, Zadanie 1): dequeue(index=0) to świadome anulowanie
  // -- item schodzący z frontu traci SWOJĄ aktywną Pracę (remainder=0 przekazany do
  // dropFrontItem, bez zmian vs dotychczasowy kontrakt "reset do 0"). Ale nowy front NIE MOŻE
  // po cichu tracić WŁASNEGO zbankowanego postępu -- to byłaby dokładnie ta sama klasa wycieku,
  // którą naprawia B1, tylko przez trzecią ścieżkę (dequeue zamiast advanceProduction/rush).
  // / EN: Operator's technical call (round 2, Task 1): dequeue(index=0) is a deliberate
  // cancellation -- the item leaving the front forfeits ITS OWN active Praca (remainder=0 into
  // dropFrontItem, unchanged vs. the existing "reset to 0" contract). But the new front must NOT
  // silently lose ITS OWN banked progress -- that would be the exact same class of leak B1 fixes,
  // just via a third path (dequeue instead of advanceProduction/rush).
  let prod = { kolejka: [item('Cud', 1000), item('Wojownik', 10, 'jednostka')], postep: 500 };
  prod = M.promoteToFront(prod, 1); // Wojownik front (postep 0), Cud zbankowany (postep 500)
  prod = { ...prod, postep: 7 }; // symulacja: kilka Pracy zebranej na Wojowniku przed anulowaniem
  const afterDequeue = M.dequeue(prod, 0); // gracz anuluje Wojownika (traci jego własne 7 Pracy)
  eq(M.frontItem(afterDequeue).id, 'Cud', 'Cud staje się nowym frontem po anulowaniu Wojownika');
  eq(afterDequeue.postep, 500, 'Cud odzyskuje SWOJE zbankowane 500 Pracy -- anulowanie Wojownika nie kasuje cudzego postępu (7 Pracy Wojownika przepada, zgodnie z kontraktem dequeue)');
  eq(M.frontItem(afterDequeue).postep, undefined, 'niezmiennik: front (Cud) po dequeue nie niesie już własnego pola postep');
}

console.log('-- 14. RUNDA 3 (notatka N1 Evaluatora): niezmiennik postep -- bezpośrednio na promoteToFront, front (kolejka[0]) nigdy nie ma zdefiniowanego własnego pola postep --');
{
  // Testy 9/12/13 asercjonowały ten niezmiennik już PO advanceProduction/rushProduction/dequeue
  // -- nigdy bezpośrednio po promoteToFront, czyli funkcji która faktycznie ZAPISUJE to pole
  // (na itemie SCHODZĄCYM z frontu). Ta sekcja domyka lukę: element WCHODZĄCY na front musi mieć
  // pole wyczyszczone, niezależnie czy wcześniej sam je niósł (round-trip) czy nie (pierwsza
  // promocja). / EN: tests 9/12/13 already asserted this invariant AFTER advanceProduction/
  // rushProduction/dequeue -- never directly after promoteToFront itself, the function that
  // actually WRITES this field (on the item LEAVING the front). This section closes that gap:
  // the item ENTERING the front must have the field cleared, whether or not it carried one
  // itself before (round-trip) or not (first-ever promotion).
  const prod1 = { kolejka: [item('Spichlerz', 80), item('Studnia', 40)], postep: 4 };
  const next1 = M.promoteToFront(prod1, 1);
  eq(next1.kolejka[0].postep, undefined, 'Studnia (pierwsza promocja, wchodzi na front) nie niesie własnego pola postep -- żyje wyłącznie w next1.postep');

  // Round-trip: element, który WCZEŚNIEJ zbankował własne postep schodząc z frontu, musi mieć
  // je wyczyszczone gdy wraca NA front (przywrócone do scalara, nie zdublowane w obu miejscach).
  let prod2 = { kolejka: [item('A', 10), item('B', 20)], postep: 8 };
  prod2 = M.promoteToFront(prod2, 1); // B front, A zbankowane postep:8 w kolejce
  eq(prod2.kolejka.find(it => it.id === 'A').postep, 8, 'A ma zbankowane pole postep po zejściu z frontu (przygotowanie sceny)');
  prod2 = M.promoteToFront(prod2, 1); // A wraca na front
  eq(M.frontItem(prod2).id, 'A', 'A ponownie frontem');
  eq(prod2.kolejka[0].postep, undefined, 'A (z powrotem na froncie) ma pole postep wyczyszczone mimo że wcześniej je niosło -- żyje tylko w prod2.postep (8)');
}

console.log('-- 15. RUNDA 3, naprawa B2: repro dosłowne z rejestru Evaluatora -- brak Manpower NIE gubi już zbankowanego postępu Cudu --');
{
  // Repro Evaluatora (rundy 1 i 2, ten sam scenariusz): kolejka [Cud 1000, Wojownik 10], 500
  // Pracy zebrane, ⇈ na Wojownika, Wojownik kończy się, tryDeductUnitSpawnCostsEmpire -> ok:false
  // (brak Manpower). Runda 1: ręczna ⇈ na Cud po tym zdarzeniu odzyskiwała aktywny postęp=500.
  // Runda 2 (przed tą naprawą): identyczny scenariusz dawał aktywny postęp=0 -- main.ts
  // applyProductionCompleted (gałąź `!d.ok`) nadpisywało scalar `completed.koszt`, tracąc
  // zbankowany postęp `prodAfterAdvance.kolejka[0]` (Cud). Ten test odtwarza DOKŁADNIE tę samą
  // sekwencję operacji na production.ts, kończąc dokładnie tym wywołaniem `insertAtFront`, którego
  // main.ts (applyProductionCompleted, gałąź `!d.ok`) teraz używa zamiast ręcznego klepania
  // kolejki/postep -- weryfikacja "przez realny kod", bo applyProductionCompleted samo jest zbyt
  // wplecione w main.ts (dostęp do city/units/tryDeductUnitSpawnCostsEmpire itd.), by odpalić je
  // w izolacji tutaj. / EN: the Evaluator's literal repro (rounds 1 and 2, same scenario): queue
  // [Wonder 1000, Warrior 10], 500 Praca collected, promote the Warrior, the Warrior finishes,
  // tryDeductUnitSpawnCostsEmpire -> ok:false (no Manpower). Round 1: manually re-promoting the
  // Wonder afterwards recovered active postep=500. Round 2 (before this fix): the identical
  // scenario gave active postep=0 -- main.ts's applyProductionCompleted (`!d.ok` branch) overwrote
  // the scalar with `completed.koszt`, losing the banked postep on `prodAfterAdvance.kolejka[0]`
  // (the Wonder). This test replays the EXACT same sequence of production.ts operations, ending
  // with the very `insertAtFront` call that main.ts (applyProductionCompleted, `!d.ok` branch) now
  // uses instead of manually splicing kolejka/postep -- verification "through the real code",
  // since applyProductionCompleted itself is too entangled in main.ts (city/units/
  // tryDeductUnitSpawnCostsEmpire access etc.) to exercise in isolation here.
  let prod = { kolejka: [item('Cud', 1000), item('Wojownik', 10, 'jednostka')], postep: 500 };
  prod = M.promoteToFront(prod, 1); // gracz ⇈ na Wojownika -- Cud schodzi z frontu, bankuje 500
  eq(M.frontItem(prod).id, 'Wojownik', 'Wojownik jest frontem po promocji gracza');
  eq(prod.postep, 0, 'Wojownik (nigdy wcześniej frontem) startuje z zbankowanym 0');

  const { prod: prodAfterAdvance, completed } = M.advanceProduction(prod, 10); // Wojownik kończy się (10 Pracy = koszt)
  eq(completed && completed.id, 'Wojownik', 'Wojownik kończy się naturalnie w advanceProduction (dokładnie ta funkcja, którą main.ts woła przed applyProductionCompleted)');
  eq(M.frontItem(prodAfterAdvance).id, 'Cud', 'Cud staje się nowym frontem -- dropFrontItem odczytało jego zbankowany postęp');
  eq(prodAfterAdvance.postep, 500, 'prodAfterAdvance.postep = 500 Cudu -- to DOKŁADNIE ta wartość, którą stary kod main.ts nadpisywał');

  // Symulacja main.ts: tryDeductUnitSpawnCostsEmpire zwraca ok:false (brak Manpower) --
  // applyProductionCompleted (gałąź `!d.ok`) woła teraz insertAtFront zamiast ręcznego splice.
  const afterManpowerFail = M.insertAtFront(prodAfterAdvance, completed, completed.koszt);
  eq(M.frontItem(afterManpowerFail).id, 'Wojownik', 'Wojownik wraca na front kolejki (czeka na wolny Manpower w kolejnej turze)');
  eq(afterManpowerFail.postep, completed.koszt, 'aktywny postęp = koszt Wojownika (w pełni "opłacony", czeka tylko na Manpower) -- kontrakt applyProductionCompleted zachowany');
  const cudAfterFail = afterManpowerFail.kolejka.find(it => it.id === 'Cud');
  eq(cudAfterFail.postep, 500, 'B2 NAPRAWIONY: Cud zachowuje zbankowane 500 Pracy mimo że Wojownik wrócił na front -- NIE ginie (przed naprawą: pole nadal 0/undefined, bo prodAfterAdvance.postep był ślepo nadpisywany)');
}

console.log(`\npromote-to-front-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
