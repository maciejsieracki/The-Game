# Operator R2-E — harness zatrzymał się na zmianie tempa

**Wynik: WSTRZYMANY przed testem rundy 2; brak wyniku zachowania kolejki.**

Po verdictcie Evaluatora, który potwierdził, że `roundNo >= 2 && awaitingOrders` nie
jest osiągalnym kryterium w tej pętli produkcyjnej, harness zmieniono na obserwację
aktywnej rundy 2 (`roundNo === 2 && turnIdx > 0`) i rozkaz natychmiastowy jednostce
gracza, która jeszcze nie wykonała ruchu. Walidacja statyczna przeszła: `node --check`,
`tsc --noEmit`, `git diff --check`.

Run `391422-wa177n` poprawnie zbudował 917-modułowy bundle, otworzył produkcyjną bitwę
28v28, przeszedł bramkę wodza i wykonał pierwszą aktywację: runda 1, `turnIdx=28`,
28/28 żywych i wykonanych, 8 przesuniętych. Handler `V` ustawił tempo kolejno
2/4/8/16. Następnie test oczekiwał, że kolejne `V` wróci z 16x do 1x; produkcyjny
kod ustawił 32x, więc harness przerwał próbę **przed** oczekiwaniem na rundę 2.

To rozbieżność w założeniu harnessu, nie awaria kolejki. Kod produkcyjny ma drabinę
`1,2,4,8,16,32,64,128,256,512`, zaś komentarz przy handlerze V podaje nieaktualny
cykl `1,2,4,8,16,1`. Dokładny ślad, zrzut strony i błąd zapisano w
`evidence/operator-r2e-execution-trace.json`, `evidence/operator-r2e-tempo-failure.json`
i `evidence/operator-r2e-tempo-failure.png`. Proces zakończył się, brak aktywnego
Chromium.

**Nie zaliczono regresji E2E ani testu `_activateNext` z martwym ID; bez commitu.**
Następny test powinien użyć produkcyjnego przycisku `Zwolnij` pięć razy (32→16→8→4→2→1),
za każdym razem asercją odczytując `speedMul`, a potem kontynuować z twardym limitem.
