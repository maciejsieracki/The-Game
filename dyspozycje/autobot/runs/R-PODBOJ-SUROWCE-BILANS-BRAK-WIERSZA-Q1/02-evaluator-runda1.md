STATUS: PASS
DOMAIN: GAME
TEMAT: R-PODBOJ-SUROWCE-BILANS-BRAK-WIERSZA-Q1
GOAL: Popup "Bilans zdobycia" pokazuje wiersz(e) "surowce zdobyte" z city.surowce
przejmowanego miasta, zero zmiany mechaniki transferu, zero zmiany wiersza "Pula pracy".

ZMIANY/COMMIT: worktree `/home/user/wt-podboj-surowce-bilans`, gałąź
`autobot/R-PODBOJ-SUROWCE-BILANS-BRAK-WIERSZA-Q1`, zweryfikowano na dysku commity
`1876c216` (kod: gra/src/main.ts + gra/tools/miasto-zdobycie-raport-test.cjs) i
`a626bde2` (raport operatora). `git diff --stat c469c7b5..1876c216` = wyłącznie
`gra/src/main.ts` (32 wstawki/2 usunięcia) i `gra/tools/miasto-zdobycie-raport-test.cjs`
(60/2); `git diff --stat origin/main...HEAD` dodatkowo tylko własne pliki raportowe w
`dyspozycje/autobot/runs/R-PODBOJ-SUROWCE-BILANS-BRAK-WIERSZA-Q1/`. Zero dotknięcia
`gra/src/game/capital-capture.ts` i `gra/src/ui/cityCaptureNotice.ts` (`git diff` na oba
puste). `git diff --check` czyste. `git status --short` czyste po mojej własnej sesji
weryfikacyjnej (patrz TESTY, mutacja przywrócona).

TESTY (uruchomione SAMODZIELNIE, nie przepisane z raportu Operatora):
- `node ./node_modules/typescript/bin/tsc --noEmit` w `gra/` → 0 błędów (potwierdzone).
- `node tools/miasto-zdobycie-raport-test.cjs` → 105 passed, 0 failed (potwierdzone,
  sekcja 13 z konkretnymi liczbami 13a +42 drewna, 13b +7 żelaza, 13f +13 gliny dla
  barbarzyńcy-zdobywcy z kontrolą 13g złoto nadal blokowane, 13i floor 3.9→+3 —
  wszystkie liczby zgodne z raportem Operatora).
- Nietautologiczność zweryfikowana SAMODZIELNIE: podmieniłem `if (input.surowce) {` na
  `if (false && input.surowce) {` w `src/main.ts`, uruchomiłem test ponownie — sekcja 13
  faktycznie czerwienieje/crashuje (TypeError na `drewno.group`, bo `rowFor` zwraca
  `null`), plik przywrócony z kopii zapasowej przed dalszą pracą, `git status` czyste.
- 5 bramek referencyjnych uruchomione samodzielnie: logic-test 213/213, tech-tree-test
  19/19, research-test 33/33, unit-replace-test 13/13, combat-test 6/6 — wszystkie
  zielone, liczby zgodne z raportem.
- Sąsiednie testy: eliminacja-lup-kwoty-test 35/35, capital-capture-test 86/86 — zielone,
  zgodne z raportem.
- Wiersz "Pula pracy": `git diff` na main.ts nie zawiera żadnej linii z tym stringiem —
  potwierdzone brakiem zmiany.
- `EMPIRE_STOCK_RESOURCE_KEYS` i `stockResourceLabel` zweryfikowane jako ISTNIEJĄCY
  słownik w `gra/src/game/building-stock-cost.ts` (linie 95/101) — nie wymyślony.
- `cityCaptureNotice.ts` zweryfikowany źródłowo: pole `group` jest jawnie ignorowane przez
  render (komentarz w kodzie: "Render ignoruje to pole"), więc nowa grupa `przejete` z
  wierszami surowców faktycznie renderuje się bez żadnej zmiany w tym pliku — potwierdza
  zasadność zera zmian tam.

WERYFIKACJA "PRZED zmianą ownerId (nie po)": zlokalizowałem wszystkie 4 wywołania
`buildCityCaptureReportRows()` (main.ts:13557, 26689, 26750, 27161) i prześledziłem
kolejność wykonania względem `city.ownerId = …`:
  - Ścieżka kapitulacji głodowej: `city.ownerId = newOwner` na L13451, odczyt
    `surowce: city.surowce` w wywołaniu na L13564 — PO zmianie ownerId, nie PRZED.
  - Ścieżka stolicy/eliminacji: `applyCityCaptureAfterBattle(...)` (L26988, poza
    allowlistą) ustawia ownerId wewnątrz `post-battle-map.ts` PRZED wywołaniem
    `runCapitalCapturePlunder()` (L27145), które dopiero wewnątrz siebie buduje
    `capitalRows`/`eliminationRows` z `surowce: city.surowce` — również PO zmianie.
  - Ścieżka zwykłego miasta (L27161): ten sam łańcuch — PO.
  W KAŻDYM z 4 miejsc odczyt jest faktycznie PO zmianie ownerId, nie PRZED — to NIE jest
  literalnie to, o co pytał dispatch/zlecenie. Operator to jawnie ujawnił w swoim raporcie
  rundy 1 i podał uzasadnienie równoważności (nic między zmianą ownerId a odczytem nie
  modyfikuje `city.surowce`). Zweryfikowałem to uzasadnienie SAMODZIELNIE:
  `grep -rn "\.surowce"` po całym `gra/src` pokazuje, że jedyne miejsca MODYFIKUJĄCE
  `city.surowce` to `building-stock-cost.ts` (koszt budowy/kredyt magazynu — wołane tylko
  przy budowaniu, nie w ścieżce zdobycia) i `diplomacy-basket-transfer.ts` (handel) —
  żadna z funkcji faktycznie wołanych między zmianą ownerId a wywołaniem
  `buildCityCaptureReportRows()` w tych 4 miejscach (`applyCityCaptureAfterBattle`,
  `seedCityOwnerDefaults`, `syncCityGarnizon`, `clearCityStateFlagOnCapture`,
  `applyLiveSafeRationForCity`, `capital-capture.ts`) nie dotyka pola `surowce`. Wniosek:
  odczyt PO zmianie ownerId jest w tym konkretnym kodzie FUNKCJONALNIE RÓWNOWAŻNY odczytowi
  PRZED — wartość pokazana w bilansie faktycznie odpowiada temu, co miasto miało w
  magazynie w momencie zdobycia, bez żadnej luki. Traktuję to jako zweryfikowaną,
  jawnie ujawnioną przez Operatora równoważność, NIE jako defekt wymagający poprawki w
  tej rundzie — literalne "przed" zamiast "po" byłoby zmianą kosmetyczną kolejności bez
  wpływu na wynik, przy dodatkowym ryzyku (dociąganie osobnego snapshotu do sygnatury
  zwiększyłoby powierzchnię zmiany bez korzyści). Odnotowuję to jednak jawnie, bo zlecenie
  wprost o to pytało.

BLOKADY: brak.

RUNDY: 1/5

NASTĘPNY KROK: Evaluator → Final Control.

ZARZUTY: brak (patrz uwaga wyżej o kolejności odczytu `city.surowce` względem zmiany
`ownerId` — zweryfikowana jako funkcjonalnie równoważna, nie zgłaszam jej jako defektu
blokującego, ale flaguję jawnie dla Final Control, jako że dyspozycja pytała o to wprost).

DEPLOY/PUSH: NIE WYKONANO
