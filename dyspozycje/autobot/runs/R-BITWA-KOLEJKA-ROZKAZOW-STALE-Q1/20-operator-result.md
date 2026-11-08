# R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1 — operator result

## Wynik

**Operator: PASS.** Potwierdzono nieaktualne członkostwo rozkazów oczekujących po aktywacji jednostek i naprawiono je w `BattleScene`: po zakończeniu rzeczywistej aktywacji jednostka jest usuwana z `_queuedOrderUnitIds`, a oznaczenia kolejki są odświeżane. Pozostali członkowie batcha pozostają oczekujący do swoich aktywacji.

## Reprodukcja i zakres

W produkcyjnym Chromium uruchomiono `BattleScene` z mieszaną armią 28 na 28 (20 jednostek dystansowych i 8 konnych po stronie gracza). Test rzeczywistymi kliknięciami wskaźnika zaznaczył jednostkę, użył przycisku „Wszystkie”, wskazał cel przeciwnika i pusty heks. Po Space przejście przez kolejkę aktywacji objęło wszystkie 28 jednostek; 8 wykonało ruch w tym cyklu, wszystkie 28 miały aktywację, a `_queuedOrderUnitIds.size` wynosiło 0. To bezpośrednio odtwarza problem R2 (28 identyfikatorów pozostawało w zbiorze po aktywacji) i weryfikuje, że poprawka usuwa je podczas wykonywania kolejki.

W tej samej sesji sprawdzono osobno bramkę wodza: bez dowódcy przełączenie AUTO → MANUAL jest zablokowane. Dla drugiego rozkazu fixture testowy wstrzymał następną fazę przeciwnika, odgrupował jedną jednostkę i wybrał ją w selekcji; produkcyjna metoda `_issueBattleMove(col,row,false)` wykonała rozkaz, jednostka dostała `acted=true`, a zbiór oczekujących pozostał pusty. To sprawdza późniejszy rozkaz podzbioru, ale nie jest drugim pełnym cyklem wskaźnikowym: drugi rozkaz jest wywołany metodą produkcyjną, a fixture kontroluje stan fazy i selekcję.

## Dowody

- `evidence/queued-order-lifecycle-two-cycles.json` — pełny stan dwóch sekwencji i asercje.
- `evidence/queued-order-lifecycle-two-cycles.png` — zrzut końcowego stanu bitwy.
- Operatorowy Chromium: 10/10 asercji PASS, brak błędów strony i konsoli.

## Weryfikacja

Zakres obejmuje produkcyjną kolejkę aktywacji oraz wykonanie kolejnego rozkazu podzbioru po jej zakończeniu. Test nie twierdzi, że 28 rozkazów skutkowało ruchem: 20 pozostałych jednostek nie zmieniło heksu w tym cyklu, choć uzyskały aktywację i nie pozostały oznaczone jako oczekujące. Zmieniony jest wyłącznie lifecycle markera/kolejki; semantyka ruchu i wybór celu nie są tu oceniane.
