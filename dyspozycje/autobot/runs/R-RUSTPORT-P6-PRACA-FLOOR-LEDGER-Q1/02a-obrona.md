STATUS: OBRONA (runda 1, rola Operator, odpowiedź na BLOCK 01-operator-r1.md, SHA 096b16ab4)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-PRACA-FLOOR-LEDGER-Q1
GOAL: odpowiedź na każdy zarzut: PRZYJMUJĘ (z dowodem) albo ODRZUCAM (z dowodem).
ZMIANY/COMMIT: brak zmian kodu gry (żadnego pliku poza tym raportem). Commit obrony tylko z plikiem 02a-obrona.md.
TESTY: NIE WYKONANO (brak zmian kodu, cargo nie uruchamiane). Dowody poniżej są statyczne (odczyt kodu Rust i pinu) plus jeden pomiar numeryczny w node 22 (sekcja Zarzut 3).

Odniesienia (commit bazy 533d46dd3, pin 07d2fbd72):
- Rust: rust-port/engine/src/domain/turn_war_dipl_steps.rs: praca_of 343-348; apply_cyclic_outcome, gałąź Work 413-418; bramka buyer_ok 546-551; apply puli Pracy 1083-1101 (podłoga max(0) na SUMIE delt, linia 1100).
- Pin: gra/src/main.ts (07d2fbd72): setOwnerPracaPool 34879-34880 (`Math.max(0, value)` przy KAŻDYM zapisie); applyCyclicDeliveryOutcome Work 24015-24016; bramka buyerOk praca 24155 (`ownerPracaPool(a.buyerOwnerId) >= zaplata`, odczyt na żywej puli).

---

## Zarzut 1. BLOCK uzasadniony: scenariusz z dispatchu nieosiągalny

**PRZYJMUJĘ.**

Dowód (sprawdzony ponownie na kodzie):
1. Każda pozycja Work w D3 przechodzi przez bramkę na żywym ledgerze, przed zapisem: Rust 551 `buyer_ok = ledger.praca_of(buyer)? >= z`; pin 24155 `buyerOk = ownerPracaPool(a.buyerOwnerId) >= zaplata`. Pula kupującego jest zmniejszana tylko, gdy bramka przeszła (Rust: `apply_cyclic_outcome` wołane z `delivered = s_ok && buyer_ok`, gałąź Work 413-418 tylko przy `delivered`; pin: 24015 wykonywane tylko w gałęzi dostawy, po warunku z 24155).
2. Sprzedający tylko zyskuje (Rust 417-418 / pin 24016), więc w D3 nie ma operacji, która obniża pulę poniżej dopuszczalnego ustawienia.
3. Scenariusz z dispatchu (pula 5; −10, potem +10): pozycja −10 jest blokowana, bo 5 < 10. Wynik to 5 w obu implementacjach przy kolejności 1→2 i 15 przy 2→1. Oczekiwane „pin 10” z dispatchu jest błędne: pin nie wykonuje pozycji −10, zanim nie wejdzie na nią w ogóle.
4. Barter (Rust 486-528, pin 24117-24127) łączy tylko pozycje bez zapłaty, więc nie dotyka puli Pracy.

Wniosek: w osiągalnych stanach D3 podłoga per operację nie zmienia wyniku. Test reprodukcyjny z kryterium 1 dispatchu nie może być czerwony na obecnym kodzie, bo taki stan nie istnieje. Zgadzam się z zamknięciem tematu jako nieosiągalnego (wariant a z DECYZJA WYMAGANA).

Zastrzeżenie: „podłoga per operację” w pinie jest strukturalnie inna niż w Ruście (pin: w setterze, Rust: na sumie w apply). To różnica kodu, nie różnica wyniku dla osiągalnych wejść. Nie zmieniam kodu, bo byłaby to zmiana bez czerwonego testu (zgodnie z uwagą Operatora).

Rozpoznanie 0515603ee (R7K7C-WIRING-ROZPOZNANIE-Q1): NIE_ZMIERZONO. Nie sprawdzałem tego dokumentu w tej rundzie; wskazanie, że rozbieżność dotyczy D3, nie jest potwierdzone. Źródło rozbieżności trzeba wskazać w osobnym rozpoznaniu (kandydat: apply_dipl_deltas_to_state, który sumuje delty dla jednego kroku).

---

## Zarzut 2. Mapowanie właściciela AI (praca_of błąd vs pin `?? 0`)

**ODRZUCAM w tym temacie, PRZYJMUJĘ jako kandydat na osobny temat.**

Dowód:
- Rust praca_of 343-348 zwraca błąd dla braku wpisu, dla każdego właściciela (także AI).
- Pin 34876-34877: `aiPracaPoolByOwner.get(ownerId) ?? 0` dla AI.
- Zmiana mapowania jest wprost wykluczona w ZAŁOŻENIACH dispatchu (ZAŁOŻENIA: „Mapowanie właściciela człowieka... Nie zmieniaj tego w tym temacie; odnotuj w raporcie”).
- Osiągalność brakującego wpisu dla AI: NIE_ZMIERZONO (nie sprawdzono, czy każdy właściciel AI ma wpis w `state.economy.praca_pool_by_owner`; producent wpisów to playable.rs:924).

Dlatego kandydat idzie do osobnego tematu (R7K7C-WIRING), nie do tego.

---

## Zarzut 3. Zaokrąglenia f64: sekwencja vs suma delt

**PRZYJMUJĘ jako realną rozbieżność bitową. Poprawki nie wykonano w tej rundzie.**

Dowód (node 22, pomiar):
- `0.7 − 0.1 − 0.2` (sekwencja, jak w pinie) = `0.39999999999999997`
- `0.7 + ((0 − 0.1) − 0.2)` (suma delt, jak w Ruście, apply 1094) = `0.3999999999999999`
- Różnica 1 ULP. Dla `5.1−0.3−0.2` i `12.7−4.1−3.3` obie formy dają ten sam wynik, więc rozbieżność zależy od wartości.

Osiągalność: Praca bywa niecałkowita (NIE_ZMIERZONO: nie sprawdzono, czy `payment_per_turn` i pule są w praktyce całkowite). Gdy są całkowite, rozbieżność nie występuje.

Proponowana poprawka (do decyzji orkiestratora, osobna runda z czerwonym testem): zamiast `praca_delta: BTreeMap<i64, f64>` zbierać uporządkowaną listę operacji per właściciel (`Vec<f64>`), a w apply składać `fold(cur, |v, d| max0(v + d))`. To odtwarza pin dokładnie, z podłogą per operację. Zmiana dotyczy tylko turn_war_dipl_steps.rs (pole `praca_deltas` nie jest używane poza tym plikiem: grep po rust-port/engine/src i tests). Nie wykonano jej tutaj, bo wymaga testu czerwonego i bramek cargo, których nie uruchomiłem.

---

## Uwaga własna (nie zarzut): self-transfer

Rust 413-416 czyta `s` przed zapisem `buyer`. Dla buyer == seller końcowy ledger.praca wynosi cur+z, a pin daje cur. Sumowany apply (praca_delta: −z, +z) daje cur, więc zapis puli jest zgodny z pinem. Różnica dotyczy tylko odczytów bramki w dalszej części kroku D3. Osiągalność: NIE_ZMIERZONO (nie sprawdzono, czy umowa może mieć kupującego równego sprzedającemu). Jeśli nie może, to nie wpływa na wynik.

---

## Podsumowanie dla orkiestratora
- Zarzut 1: PRZYJMUJĘ (temat nieosiągalny; bez zmiany kodu).
- Zarzut 2: ODRZUCAM w tym temacie; kandydat na R7K7C-WIRING.
- Zarzut 3: PRZYJMUJĘ jako realny, poprawka odroczona do decyzji (propozycja wyżej).
- Brak zmian kodu. Testy NIE WYKONANO. Brak push.
RUNDY: obrona 1.
NASTĘPNY KROK: decyzja orkiestratora: (a) zamknąć temat jako nieosiągalny i otworzyć rozpoznanie źródła rozbieżności oraz osobny temat na zarzut 3; albo (b) runda 2 z czerwonym testem ULP dla sekwencji operacji.
DEPLOY/PUSH: NIE WYKONANO
