# R-WEB-POLISH-LANGUAGE-AUDIT-Q1 — niezależna weryfikacja rundy 3

STATUS: PASS w zadeklarowanym, ograniczonym zakresie  
DATA: 2026-11-10  
ZAKRES: wyłącznie zmiany w historii dwóch jednostek, formatterze prezentacji Top 3 i skupionym teście DOM. Audyt pozostałych ekranów UI/CIVPEDII nadal CZĘŚCIOWY. Bez przeglądarki, pełnego buildu ani commitów.

## Wynik

Nie znalazłem blokującej rozbieżności. Zmiana historii iButho korzysta z już istniejącego określenia „krótka, ciężka włócznia kłująca” w historii Impi w `units.json:1243` i w artykule Civpedii `docs/encyklopedia/jednostki/impi.md:69`. Bieżący rekord iButho podaje `Typ: Spearman` (`units.json:5163`) oraz uwagę „iklwa + tarcza” (`:5154`). Nowe zdanie powtarza istniejący opis i zgadza przymiotniki z „włócznią”; nie dodaje szczegółów konstrukcji ani twierdzeń o walce. Użycie tej nazwy dla opisu iklwy ma bezpośrednie oparcie w lokalnym rekordzie/historycznym tekście, więc nie wymaga dalszej decyzji tylko dla kosmetycznego wyboru słowa.

Uruchomiłem `cd gra && node tools/unit-top3-player-language-test.cjs`; test przeszedł. Jest to test rzeczywistego adaptera i renderera w DOM: weryfikuje kontrolowany wiersz obejmujący wzorce mapowań, nieznany `UnknownLabel`, zachowanie wejściowych wartości Top3, poprawioną historię Evocati oraz widok historii iButho. Następnie tworzy karty dla wszystkich 75 aktualnie wypełnionych sekcji Top3 i sprawdza, że w widocznym tekście nie pozostały surowe tokeny z mapowanych rodzin. To potwierdza bieżący zakres danych; nie jest przeglądarkową kontrolą aplikacji.

Sprawdziłem zakres diffa: `units.json` zmienia wyłącznie dwa pola `Historia` (zgoda Evocati oraz zdanie iButho), bez zmian liczb, kluczy i Top3. `unitAdapter.ts` dodaje lokalne mapowania w ścieżce budowania tekstu wierszy Top3 i aktualizuje nieaktualny komentarz; dane źródłowe Top3 pozostają nietknięte. Test obejmuje nieznane etykiety i potwierdza brak mutacji wierszy testowych. Nie zgłaszam korekty do wyboru „jednostki konne” ani pozostałych wspartych odpowiedników w tym dozwolonym zakresie.

Inwentarz i asercje obejmują konkretne nazwy klas faktycznie występujące w Top3. Raport operatora podaje zero wystąpień `Falangite` w Top3 i nie dodaje dla niego mapowania. Twierdzenie o przetłumaczeniu „wszystkich” dotyczy więc wyłącznie zinwentaryzowanych wewnętrznych etykiet Top3 w bieżących danych. Nie oznacza, że wszystkie angielskie słowa, nazwy własne ani pozostałe trasy gry/CIVPEDII zostały przetłumaczone; raport operatora zachowuje tę granicę i kwalifikuje audyt nadrzędny jako częściowy.

**OBRONA POMINIĘTA:** brak osobnego zarzutu wymagającego odpowiedzi.
