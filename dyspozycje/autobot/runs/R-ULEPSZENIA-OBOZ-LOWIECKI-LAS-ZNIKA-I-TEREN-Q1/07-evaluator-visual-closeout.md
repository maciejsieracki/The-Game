# AutoBot — niezależna ewaluacja wizualnego domknięcia tartaku

**Zakres:** tartak zbudowany na leśnym wzgórzu zachowuje ukształtowanie terenu i las; wyrąb usuwa tartak.
**Baza:** `e4af7741`
**Werdykt:** **PASS-WITH-NOTES** dla wizualnego kontraktu tartaku. Nie jest to zatwierdzenie szerszych testów obozu łowieckiego ani wyścigu AI/gracza.

## Niezależna weryfikacja

Przejrzałem test real-render i implementację, a następnie uruchomiłem test ponownie na drzewie operatora bez modyfikowania kodu produktu. Test tworzy bieżący build i build kontrolny z regresją w pamięci, ładuje grę w Chromium przez lokalny HTTP, wykonuje `page.screenshot` przed i po budowie oraz czyta stan renderowanej mapy. Kontrolny build jest użyteczny: na tym samym leśnym wzgórzu liczba instancji dekoru spada z 3 do 1, podczas gdy bieżący kod utrzymuje 3.

Niezależny rerun `node gra/tools/tartak-wzgorze-las-real-render-test.cjs --shots /tmp/sawmill-evaluator-rerun-shots` zakończył się wynikiem **8 PASS / 0 FAIL**. W bieżącym buildzie scenariusz potwierdził teren `wzgorza`, nakładkę `las`, warstwę `tartak`, obecny mesh, pozycję modelu na wzgórzu (`groupY=0.65`, `topY=0.64`), konfigurację reliefu (`sectorR=0.86`, próbnik powierzchni dostępny) oraz dekor lasu 3→3. Po wycince warstwa tartaku znika, nakładka przechodzi na `brak`, a pozostająca pojedyncza instancja gruntu jest oczekiwana.

Test bada rzeczywiste renderowanie produkcyjnego modelu, a nie tylko pola danych: używa dwóch bundli gry, aktywnej strony Chromium i zrzutów ekranu. Sekwencja umieszczenia tartaku w głównym scenariuszu ustawia jego commit przez produkcyjne funkcje synchronizujące ulepszenie, dekor i nakładkę, zamiast klikać przycisk UI. To właściwy zakres dla regresji warstwy wizualnej, ale nie dowodzi pełnej ścieżki interakcji użytkownika ani tego, że każda kombinacja legalności budowy działa.

## Powiązane bramki

- `node gra/tools/sawmill-hill-relief-test.cjs` — **8/8 PASS**.
- `node gra/tools/map-improvement-qualify-test.cjs` — **133 PASS / 0 FAIL**.
- `node gra/tools/relief-preserving-mine-prefix-test.cjs` — **24 PASS / 0 FAIL**.
- `npm run typecheck -- --pretty false` z katalogu `gra/` — **PASS**.
- `node gra/tools/tartak-oboz-wyscig-race-test.cjs` — **FAIL w harnessie**, odtworzone niezależnie. Asercje wyścigu AI i zasadnicze asercje gracza przechodzą, po czym kontrola dodatnia gracza kończy się `ReferenceError: setOwnerLastPraca is not defined` w wygenerowanym `.tartak-race-player-bundle.cjs`. To pozostawia niezweryfikowaną kontrolę dodatnią tego harnessu; nie podważa wyniku testu renderowania, ale wymaga naprawy osobno przed zamknięciem powiązanego tematu wyścigu.
- `oboz-lowiecki-las-test.cjs` w raporcie operatora: **72 passed / 19 failed**. Zakres obozu łowieckiego pozostaje otwarty i nie jest objęty niniejszym werdyktem.

Test real-render wypisał błędy pobierania zasobów 404 do konsoli, ale nie zgłosił `pageerror`; nie zablokowały one zrzutów ani odczytów modelu. Są warte osobnego uporządkowania, jeśli oczekujemy czystej konsoli z testu.

## Konkluzja ewaluatora

Niezależny test i kontrola regresyjna potwierdzają, że bieżący kod wizualnie zachowuje las oraz relief wzgórza pod tartakiem, ustawia model zgodnie z reliefem i usuwa tartak przy wycince. Dla tego konkretnego kontraktu wizualnego wynik jest **PASS-WITH-NOTES**. Wynik nie zamyka powiązanego harnessu wyścigu ani szerszego obozu łowieckiego. Nie wprowadzono zmian produktu, nie commitowano ani nie wdrażano.
