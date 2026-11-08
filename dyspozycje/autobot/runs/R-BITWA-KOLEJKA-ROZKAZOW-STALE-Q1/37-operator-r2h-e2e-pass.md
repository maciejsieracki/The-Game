# Operator R2-H — PASS warstwy E2E i martwego ID

**Wynik: 13/13 checks PASS. Brak błędów strony i konsoli.**

Statyczna walidacja przed runem przeszła: `node --check`, `npm --prefix gra run
typecheck`, `git diff --check`. Chromium zbudował produkcyjny bundle (Vite: 917 modułów,
70,029,425 B; SHA-256 `2164c747231241b2c148940fa1c6b602a77006c984b3f12f45330b6f42ecac0e`).

Scenariusz 28v28 utrzymał żywy, mieszany skład: po stronie gracza było 20 jednostek
dystansowych i 8 konnych/rydwanów. Bramka ręcznego sterowania bez wodza zablokowała
próbę przełączenia. Rzeczywiste zdarzenia klawiatury ustawiły tempo 2/4/8/16, a
produkcyjne kliknięcia `Zwolnij` obniżyły je 8/4/2/1.

Pierwszy cykl wykonał wszystkie 28/28 rozkazów przez produkcyjną kolejkę: runda 1,
`turnIdx=28`, `queueRemaining=0`, 28 żywych/wykonanych, 8 zmieniło pozycję. W
produkcyjnej pętli w oczekiwanym miejscu nie występuje druga faza `_battleAwaitingOrders`;
harness obserwował aktywną rundę. Runda 1 doszła do `turnIdx=56`, następnie pojawiła
się runda 2, `turnIdx=1`, `awaitingOrders=false`.

W rundzie 2 wybrano kartą rostera nieaktywną jednostkę gracza `atk27`, indeks 27.
Po przewinięciu karty ponownie sprawdzono, że jest nadal nieaktywna i przed nią w
kolejce pozostaje 14 indeksów (`turnIdx=13`). Mapa została ponownie przeliczona po
scrollu; zwykły klik wskazał pusty kafel. Jednostka otrzymała rozkaz `move`, została
oznaczona `acted`, a jej pozycja zmieniła się z `(30,72)` na `(31,70)` przed końcem
timeoutu ruchu. Po rozkazie kolejka pozostała pusta. Wartość końcowego rozkazu
`{col:31,row:68}` różni się od klikniętego kafla `(31,72)`, ale potwierdzona pozycja
zmieniła się; test obejmuje tylko przekazanie i wykonanie rozkazu ruchu, nie dokładny
algorytm ruchu do kafla docelowego.

Osobny deterministyczny test woła produkcyjne `_activateNext`, `_activateUnit` i
`Set` bez podmiany. Jedynym stubem jest `_schedule`. Martwy kandydat `atk0` stał na
`turnOrder[turnIdx]`; po aktywacji jego ID zniknęło z kolejki, a następny żywy `atk1`
został aktywowany. Koniec: `turnIdx=2`, kolejka pusta.

Pełne dowody: `evidence/operator-r2h-execution-trace.json`,
`evidence/operator-r2h-full-result.json`, `evidence/operator-r2h-skipped-dead.json`,
`evidence/operator-r2h-page-state.json`, `evidence/operator-r2h-result.png`.

**Operator przekazuje pakiet niezależnemu Evaluatorowi; bez merge, deployu i pushu.**
