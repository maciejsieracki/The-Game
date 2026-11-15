# R-WEB-UI-RESOURCE-CARDS-GROSS-AND-NET-Q1 — obrona Operatora wobec zarzutów Evaluatora (obrona r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-CARDS-GROSS-AND-NET-Q1
GOAL: w panelu surowców każda karta pokazuje BRUTTO i NETTO na turę; suma kart = nagłówek „Brutto … → netto …”.
ZMIANY-COMMIT: baza kandydata `8a7e1f4b3` (kod `b16a2c63d`, raport Operatora `8a7e1f4b3`). Poprawka testu (zarzut 4) — osobny commit po `8a7e1f4b3` (SHA w polu sha wyniku). Ten raport — osobny commit po poprawce (SHA końcowy w polu sha).
ALLOWLISTA tej rundy: `gra/tools/resource-cards-gross-net-test.cjs`, `dyspozycje/autobot/runs/R-WEB-UI-RESOURCE-CARDS-GROSS-AND-NET-Q1/**`. Kod gry NIE zmieniony.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora

**Zarzut 1 — rozjazd plakietka „+X” vs netto na karcie. PRZYJMUJĘ jako fakt, NIE zmieniam kodu.**
Potwierdzam: plakietka nad paskiem (`resCardHtml`, `ratePerTurn`) to produkcja ± dyplomacja PRZED zużyciem (Drewno: +457), a wiersz „netto” to wartość po zużyciu (+422). Dwie liczby podobne do netto na jednej karcie. Zmiana znaczenia plakietki (przemianowanie, ukrycie lub przeliczenie) jest decyzją produktową: zgodnie z CLAUDE.md zasada 3 nie rozstrzygam jej sam. ZAŁOŻENIE w tym temacie: plakietka zostaje bez zmian (dispatch: „najpierw netto jak dziś jako plakietka”), a wiersz netto po zużyciu jest zgodny z nagłówkiem. **Wymaga decyzji ABC właściciela przed integracją.** Opcje do pytania: (A) plakietka zostaje jako „produkcja ±”, (B) plakietka ukryta, zostaje tylko wiersz brutto/netto, (C) plakietka przemianowana na „przed zużyciem”.

**Zarzut 2 — brak weryfikacji w żywej grze w Chromium. PRZYJMUJĘ jako NIE_ZMIERZONO (nie zamykam).**
Operator renderował prawdziwą funkcję `resCardHtml` w statycznym kontenerze. Pełnej gry (budowa, endTurn, zrzut panelu z nagłówkiem) nie uruchamiałem w tej rundzie i nie podaję tego jako dowodu. Równość sumy kart z nagłówkiem w realnym stanie gry pozostaje NIE_ZMIERZONO.

**Zarzut 3 — dotknięty `gra/src/main.ts`. ODRZUCAM jako przyczynę zmiany.**
Dispatch wymaga jednego źródła liczb (`resourceGrossNetPerTurn`) dla nagłówka i kart oraz zakazuje drugiej kalkulacji. Nagłówek `surowceBilans` liczony jest w `main.ts` (ok. l. 23154), więc przepięcie go na wspólny moduł wymaga zmiany w `main.ts`: 1 import i 3 linie. Alternatywa bez zmiany `main.ts` oznacza drugą kalkulację, czyli naruszenie dispatchu. Zmiana jest minimalna i nie zmienia listy wierszy. Ryzyko konfliktu z równoległymi tematami zostaje jako uwaga dla orkiestratora.

**Zarzut 4 — wzór „netto = brutto − zużycia” nie zachodzi przy wypływach dyplomacji; fixture bez realnego przypadku. PRZYJMUJĘ, poprawka wykonana.**
Potwierdzam: w kodzie `netto = ratePerTurn − zużycie`, a `ratePerTurn` już zawiera `rateDiploOutPerTurn`. GOAL dispatchu mówi o zużyciu „i innych opłatach”, więc wydatki umów należą do netto. Znalazłem jednak błąd w fixture testu: `ratePerTurn: 6` przy `prod 10 − out 4 + in 3` (spójnie = 9). Poprawka (commit testu): fixture `ratePerTurn: 9`, asercja A5 zmieniona na `netto === 8` (9 − zużycie 1), z opisem „wydatki umów już w ratePerTurn”. Test A4 (brutto 13) bez zmian: brutto nie odejmuje wydatków umów.

**Zarzut 5 — hotseat (ownerId ≠ 0): zgodność kart z nagłówkiem nie testowana. PRZYJMUJĘ jako NIE_ZMIERZONO.**
Potwierdzam kod: dla `ownerId ≠ 0` nagłówek liczy `buildEmpireResourceRows(ownerId)` (main.ts ok. l. 23144–23146). Nie sprawdziłem w tej rundzie, czy panel kart dla tego samego właściciela dostaje ten sam zbiór wierszy. Brak testu hotseat. Zostaje NIE_ZMIERZONO.

**Zarzut 6 — test D (statyczny, po tekście main.ts) jest kruchy. ODRZUCAM zmianę.**
Test D nie jest jedynym dowodem: zmiany w kodzie wykrywają asercje B i C oraz mutanty M1/M2 (po poprawce nadal 22 pass / 0 fail). Test D nie daje fałszywej zieleni, a zarzut dotyczy stylu, nie błędu.

## Weryfikacja tej rundy (liczby z surowego wyjścia)

Środowisko: `npm ci` w `gra/` (worktree, 71 pakietów, `node_modules` nie jest śledzone).

| Bramka | Wynik |
|---|---|
| `git diff --check 15d0a81a5 8a7e1f4b3` (zarzut Evaluatora: nie dało się uruchomić) | exit 0, bez wyjścia |
| `node tools/resource-cards-gross-net-test.cjs` (po poprawce) | `=== resource-cards-gross-net-test: 22 pass, 0 fail ===`, exit 0 |
| `npx tsc --noEmit` (gra/) | exit 0, bez wyjścia |

Pozostałych 5 bramek referencyjnych z raportu Operatora nie uruchamiałem ponownie: poprawka dotyczy wyłącznie pliku testu `resource-cards-gross-net-test.cjs`, którego nie importują. Wyniki z raportu Operatora (213/213, 20/0, 33/0, 21/21, 6/6) są cytowane z jego raportu, nie z tej rundy.

## NIE_ZMIERZONO (bez zmian względem Operatora, plus nowe)

- Żywa gra w Chromium: pełny panel surowców z nagłówkiem i sumą kart.
- Hotseat (ownerId ≠ 0): zgodność właściciela wierszy kart i nagłówka.
- Test „nowy test czerwony na bazie” nadal nie został zmierzony osobno (na bazie brak modułu).

## BLOKADY

- Decyzja ABC właściciela o plakietce „+X” vs netto (zarzut 1, opcje A/B/C). Bez niej integracja nie powinna wejść.
- Dług bazowy (poza tematem, bez zmian): `resource-usage-breakdown-test`, `ui-language-count-renderer-test`, `citizen-resource-upkeep-test` (2 fail), `empire-armia-produkcja-test` — czerwone także na `15d0a81a5`.

## NASTĘPNY KROK

Evaluator r2 (kod + poprawiony test) → Final Control. Równolegle ABC do właściciela o plakietkę. Przed FC: sprawdzić żywą grę albo przyjąć NIE_ZMIERZONO jawnie w raporcie FC.

RUNDY: obrona r1/5 (Operator runda 1/5), ostatni werdykt Evaluatora: PASS-WITH-NOTES
DEPLOY/PUSH: NIE WYKONANO
