# Niezależny Evaluator — R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1

**Werdykt: PASS-WITH-NOTES. Etap: 8/11 — niezależna ewaluacja zakończona, z ograniczeniem zakresu drugiego cyklu.** Oceniono dokładnie commit `6069f2e2` na branchu `autobot/R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1`. Produktu nie zmieniano.

## Ustalenia

- Minimalny diff produkcyjny usuwa ID aktywowanej jednostki z `_queuedOrderUnitIds` w callbacku rzeczywistej aktywacji, tylko w trybie ręcznym; odświeża podgląd kolejki, jeśli ID było oczekujące. Pozostałe ID pozostają do własnych aktywacji.
- Sprawdziłem raport operatora i zapisane browser evidence dla mieszanego, produkcyjnego scenariusza 28v28. Rzeczywiste kliknięcia wskazały oddział, zaznaczyły 28 jednostek, wydały rozkaz na konkretny cel i rozkaz ruchu na pusty heks. Po Spacji kolejka aktywowała 28/28 jednostek; 8 zmieniło heks, `queueRemaining` wyniosło 0. W logu zapisano 0 błędów strony i konsoli.
- Niezależnie uruchomiłem `node --check gra/tools/battle-manual-queued-order-lifecycle-live-test.cjs` — PASS, `npm run typecheck` — PASS oraz `git diff --check 6069f2e2^ 6069f2e2` — PASS.

## Ograniczenie drugiego cyklu

Drugi rozkaz podzbioru nie jest drugim pełnym cyklem wskaźnikowym. Fixture bezpośrednio ustawia `_battleAwaitingOrders`, czyści timery, odznacza `acted`, usuwa `groupId`, ręcznie ustawia selekcję, a następnie wywołuje produkcyjne `_issueBattleMove(col, row, false)`. Asercje potwierdzają, że jednostka ma `acted=true`, zachowała rozkaz `move` i nie została ponownie oznaczona jako oczekująca. Nie sprawdzają jawnie zmiany pozycji dla tego drugiego rozkazu. To celny test ścieżki produkcyjnego dispatchu po poprzedniej kolejce, lecz nie pełny dowód interakcji gracza przez wskaźnik w kolejnym cyklu.

Drugą ograniczoną krawędzią jest jednostka, która umrze/zostanie usunięta i zostanie pominięta zanim otrzyma aktywację: usuwanie ID odbywa się w callbacku aktywacji, więc zapisany test tego wariantu nie rozstrzyga. Nie podważa to wykazanego scenariusza żywych jednostek, ale warto sprawdzić czyszczenie markerów dla pominiętych pozycji w osobnym przypadku.

## Zakres werdyktu i dalszy krok

Naprawa rozwiązuje wykazany problem 28 żywych jednostek pozostawianych w kolejce po aktywacji. PASS-WITH-NOTES dotyczy tego zakresu i bramki dowódcy uwzględnionej w operatorowym browser teście; nie oznacza integracji ani wydania. Aby zamknąć uwagi, dodaj assertion rzeczywistego ruchu drugiego rozkazu po pełnym pointerowym wyborze podzbioru i przypadek ID jednostki pominiętej z powodu śmierci/usunięcia przed aktywacją. Nie scalono, nie wdrożono ani nie wypchnięto.

## Evidence

- `evidence/queued-order-lifecycle-two-cycles.json`
- `evidence/queued-order-lifecycle-two-cycles.png`
- `gra/tools/battle-manual-queued-order-lifecycle-live-test.cjs`
