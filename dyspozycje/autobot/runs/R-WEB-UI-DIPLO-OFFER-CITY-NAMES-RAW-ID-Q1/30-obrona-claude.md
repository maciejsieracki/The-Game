# R-WEB-UI-DIPLO-OFFER-CITY-NAMES-RAW-ID-Q1 — Obrona Operatora, runda 1/5

STATUS: PASS-WITH-NOTES (zarzut 1 przyjęty i naprawiony; zarzut 2 częściowo przyjęty; zarzut 3 odrzucony jako możliwy do wykonania w allowliście — pozostaje NIE ZMIERZONO z powodem)
DOMAIN: GAME (dyplomacja/UI)
TEMAT: R-WEB-UI-DIPLO-OFFER-CITY-NAMES-RAW-ID-Q1
GOAL: miasto w ofercie dyplomacji pokazywane nazwą / „miasto <cywilizacja>”, nigdy surowe id (bez zmian reguł i cen).
BAZA: da727c9a4 (origin/main). Kandydat Operatora: b21fdaaa0. Gałąź: autobot/R-WEB-UI-DIPLO-OFFER-CITY-NAMES-RAW-ID-Q1.

ZMIANY/COMMIT (obrona): commit obrony na wierzchu b21fdaaa0 (SHA podaje orkiestrator/`git rev-parse HEAD`). Pliki: `gra/src/ui/diplomacyTradeBasket.ts` (1 linia: `function renderBasketItemValueHtml` → `export function`, bez zmiany logiki), `gra/tools/diplomacy-city-name-test.cjs` (sekcje 10–11 + stub brandAssets/import.meta.glob), raport `30-obrona-claude.md`. Nic poza allowlistą. `git add` tylko po ścieżkach.

## Odpowiedzi na zarzuty Evaluatora

**Zarzut 1 (renderer koszyka bez testu) — PRZYJMUJĘ, naprawione.**
Funkcja `renderBasketItemValueHtml` w `diplomacyTradeBasket.ts` została wyeksportowana i jest testowana w bundlu esbuild (`tools/diplomacy-city-name-test.cjs`, sekcja 10). Asercje: koszyk pokazuje „Ateny” dla City27 z rejestrem; brak id w tekście; nieznane miasto → „miasto”, bez id.
Mutacja (kopia pliku; zamiana `nazwaMiastaDyplomacji(item.id, item.cityLabel)` na `item.cityLabel ?? item.id`): wynik surowy `14 pass / 3 fail`, FAIL: `koszyk pokazuje nazwę miasta: <span class="da-deal-amt">miasto: City27 · 500 PW…`. Plik przywrócony z kopii; `git diff` pokazuje tylko zmianę `export`.

**Zarzut 2 (resolver w main.ts bez pokrycia) — PRZYJMUJĘ CZĘŚCIOWO.**
Pełnego testu behawioralnego nie da się zrobić bez importu `main.ts`: resolver jest domknięciem nad lokalnym `cities`, `nazwaCywilizacji` i `civTypeForOwner`. Dodane asercje statyczne (sekcja 11): rejestracja `setDiplomacyCityNameResolver((cityId: string) => {`, wyszukanie po `id`, gałąź `return 'miasto ' + nazwaCywilizacji(civTypeForOwner(c.ownerId));`. Wynik surowy: `20 pass / 0 fail`.
Ścieżka w grze (gracz widzi właściwe nazwy z `main.ts`) pozostaje NIE ZMIERZONO w silniku i w Chromium.

**Zarzut 3 (brak dowodu live w Chromium) — ODRZUCAM jako możliwe do wykonania w obecnym zakresie.**
Zrzut z żywej przeglądarki wymaga haka civTest, który wstrzykuje ofertę miast. Taki hak leży w `gra/src/main.ts` poza dozwolonym zakresem „tylko mapowanie id→nazwa”. Bez tego haka nie ma sposobu, żeby w grze wymusić ofertę z miastami. Nie dodawałem haka ani nie budowałem przeglądarki. Stan: NIE ZMIERZONO (live: karta oferty, koszyk, okno pokoju wymuszonego, edycja oferty). Ryzyko zostaje niskie, bo grep pozostałych renderów pozycji `miasto` nie znalazł innych miejsc pokazujących `item.id` (zob. raport Evaluatora). Propozycja dla orkiestratora: osobny temat z hakiem civTest w allowliście.

## TESTY (surowe wyniki, po poprawkach)
- `npm ci --ignore-scripts` (gra/): added 71 packages.
- `node tsc --noEmit -p .` (gra/): exit 0.
- `tools/diplomacy-city-name-test.cjs`: `[diplomacy-city-name-test] 20 pass / 0 fail` (exit 0). Przed poprawką test nie buduł się przez stub brandAssets i import.meta.glob; po poprawce tylko stuby, bez zmian asercji 1–8.
- `tools/logic-test.cjs`: `LOGIC OK (213/213)`.
- `tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`.
- `tools/research-test.cjs`: `ALL GREEN`.
- `tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`.
- `tools/combat-test.cjs`: `All sanity checks passed.`
- Testy koszyka/wyświetlania: `diplomacy-basket-duplicate-test` 21/21; `diplomacy-basket-duplicate-ui-test` 31/31; `diplomacy-basket-edit-test` 25/25; `diplomacy-basket-transfer-test` 24/24; `diplomacy-display-test` `45 OK, 0 FAIL`.
- Regresje: brak. Żadna bramka nie była czerwona, więc porównanie z bazą nie było potrzebne.

## BLOKADY
- Live Chromium: NIE ZMIERZONO (zakres allowlisty, hak civTest poza nią).
- Silnikowa ścieżka resolvera w `main.ts`: NIE ZMIERZONO w działającej grze (pokryta tylko statycznie).

## RUNDY
1/5 (obrona). Brak wyroku FC.

## NASTĘPNY KROK
Evaluator/Final Control na commicie obrony. Jeśli FC wymaga live: osobny temat z hakiem civTest w allowliście.

## DEPLOY/PUSH
NIE WYKONANO. Nie integrowano, nie pushowano na main.
