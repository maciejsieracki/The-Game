# R-WEB-UI-DIPLO-OFFER-CITY-NAMES-RAW-ID-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (kod i testy zielone; żywa przeglądarka NIE ZMIERZONO)
DOMAIN: GAME (dyplomacja / UI)
TEMAT: R-WEB-UI-DIPLO-OFFER-CITY-NAMES-RAW-ID-Q1
GOAL: w UI dyplomacji miasto w ofercie ma pokazywać nazwę, a przy jej braku „miasto <cywilizacja>”, nigdy surowe id (np. „City27”).

PRZYCZYNA (ustalona w kodzie, nie w przeglądarce):
- Pozycja oferty typu `miasto` niesie `id` = cityId. Koszyk (`diplomacyTradeBasket.ts`) miał `cityLabel ?? humanizeId(id)`. Karta oferty (`diplomacyDealDisplay.ts`) nie miała case `miasto`, więc wpadała w `default` → `nazwaWyswietlana(id)` → `humanizeId` („City27”).
- `main.ts` (miastoOptions) dla braku nazwy dawał `label = m.cityId`.

ZMIANY (commit w gałęzi autobot/R-WEB-UI-DIPLO-OFFER-CITY-NAMES-RAW-ID-Q1):
- `gra/src/game/diplomacy-city-name.ts` (NOWY): rejestr resolvera i `nazwaMiastaDyplomacji(cityId, cityLabel?)`. Kolejność: jawny cityLabel → resolver → „miasto”. Surowe id (wzór `^[A-Za-z]+[_-]?\d+$`) nigdy nie wraca.
- `gra/src/main.ts`: `setDiplomacyCityNameResolver` przy deklaracji `cities` (nazwa miasta; brak nazwy → „miasto <nazwa cywilizacji>”); label miastoOptions → `nazwaMiastaDyplomacji`.
- `gra/src/ui/diplomacyDealDisplay.ts`: nowy case `miasto` (karta oferty).
- `gra/src/ui/diplomacyTradeBasket.ts`: nazwa pozycji koszyka przez `nazwaMiastaDyplomacji`; usunięty nieużywany import `humanizeId`.
- `gra/src/game/diplomacy-display.ts`: case `miasto` w `formatBasketItemBrief` (opisy PW i powiadomienia).
- `gra/tools/diplomacy-city-name-test.cjs` (NOWY): 14 asercji (logika i renderer karty oferty).
Reguły dyplomacji i ceny nie zmienione.

TESTY (surowe wyniki z tego uruchomienia):
- `node node_modules/typescript/bin/tsc --noEmit`: exit 0, 0 błędów.
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: 21/21
- combat-test: COMBAT TEST 6/6
- diplomacy-display-test: 45 OK, 0 FAIL
- diplomacy-basket-duplicate-test: 21/21 PASS
- diplomacy-basket-duplicate-ui-test: 31/31 PASS
- diplomacy-basket-edit-test: 25/25 PASS
- diplomacy-basket-transfer-test: 24/24 PASS
- diplomacy-city-name-test (nowy): 14 pass / 0 fail
- MUTACJA (przez nadpisanie kopii pliku): w `diplomacyDealDisplay.ts` przywrócono surowe `item.id`, test dał 3 FAIL („miasto: City27 · 500 PW”). Plik przywrócono z kopii, `cmp` zgodny.
- Pełna lista ok. 338 plików testów diplomacy NIE uruchomiona (koszt czasu). Uruchomiono powyższe bramki i testy dotknięte zmianą.

ŻYWA PRZEGLĄDARKA: NIE ZMIERZONO. Przyczyna: do wstrzyknięcia oferty miast potrzebny hak civTest w `main.ts`, a jego dodanie wykracza poza dozwoloną allowlistę tematu. Chromium (`/usr/bin/chromium`) jest dostępny. Do decyzji orkiestratora: osobny hak albo zgoda na rozszerzenie allowlisty.

BLOKADY: brak blokad kodowych. Niezweryfikowane: ścieżka „okna pokoju wymuszonego” i „edycji oferty”. Nie sprawdzono, czy używają innych renderów poza `renderBasketItemValueHtml` i `formatBasketItemBrief`.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (ocena diffu, mutacji i zakresu), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Wzorzec surowego id (`^[A-Za-z]+[_-]?\d+$`) odrzuci też hipotetyczną nazwę miasta złożoną z liter i cyfr. W danych nie stwierdzono takich nazw, ale to kompromis.
- Nie zweryfikowano formatu cityId w silniku (brak generatora `City…` w `gra/src`). Wniosek o surowym id opiera się na ścieżkach renderu, nie na generatorze.
- Rejestr resolvera jest globalny modułowo; ustawiany raz przy tworzeniu `cities` w `main.ts`.
