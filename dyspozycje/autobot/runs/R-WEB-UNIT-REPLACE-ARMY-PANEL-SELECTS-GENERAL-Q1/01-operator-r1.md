STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UNIT-REPLACE-ARMY-PANEL-SELECTS-GENERAL-Q1
GOAL: "Zastąp" w panelu armii działa WYŁĄCZNIE na jednostkach zaznaczonych checkboxami (nie na wodzu/selectedId); zbiorcza zamiana z pełnym kosztem × liczba.
ZMIANY/COMMIT: gra/src/main.ts, gra/src/ui/unitReplacePicker.ts, gra/tools/unit-replace-army-multi-select-test.cjs (nowy), ten raport. SHA: patrz `git log` gałęzi worktree (commit "R-WEB-UNIT-REPLACE-ARMY-PANEL-SELECTS-GENERAL-Q1 r1").

DIAGNOZA
- Akcja `replace` w handleSelectedUnitHudAction brała `u` = jednostkę z `selectedId` (aktywna karta, domyślnie pierwsza = wódz) i wołała openUnitReplacePicker(u). Zaznaczenie checkboxami żyje osobno (`stackPickState`, pickedUnitsOnStack) i nie było w ogóle czytane. Stąd: zaznaczony "Wojownik my…" (1 z 106), a okno "Zastąp — Rydwan mykeński" (aktywna/wybrana wcześniej karta).
- Stan przycisku (replaceDisabled) też liczony po `active`.

NAPRAWA
- main.ts: `unitReplaceTargetsOnStack` (cele = pickedUnitsOnStack; stos 1-osobowy bez zaznaczenia = ta jednostka; większy stos bez zaznaczenia = brak celów, komunikat "zaznacz w panelu armii jednostki do zastąpienia"). Nigdy selectedId.
- `openUnitReplaceForSelection`: filtr kwalifikujących się (własne terytorium, 1 zamiana/turę, istnieje zamiennik), grupowanie wg typu, wódz ZAWSZE osobną grupą (klucz G:) i tylko gdy jawnie zaznaczony; kolejne grupy = kolejne okna ("grupa i/n"); gdy nikt nie kwalifikuje się — dotychczasowe komunikaty przyczyn (openUnitReplacePicker).
- `openUnitReplaceGroupPicker`: opcje z kosztem za sztukę, kosztem zbiorczym (pełna rekrutacja × N: Pieniądz + surowiec), `affordableCount` (ile z N stać wg skarbca i puli państwa); wykonanie = performUnitReplace per jednostka (quiet) do wyczerpania zasobów/limitu Super-jednostki, podsumowanie "× done (nie zastąpiono k z N)".
- `performUnitReplace(id, type, quiet=false): boolean` — bez zmiany semantyki (ruch zerowany, replaceUsedThisTurn, isGeneral nietknięte = wódz zachowuje rolę).
- Przycisk "Zastąp": disabled wg zaznaczonych celów (`replaceTargets.some(unitReplaceEligible)`).
- unitReplacePicker.ts: `count`, `affordableCount`, `totalMoneyCost/totalStockText`; tytuł "Zastąp — <typ> ×N", wiersz "Razem N: … · stać na K z N", wyszarzenie gdy stać na 0.
- Tekst: obecna ścieżka drukuje tekst FALA 571 ("Koszt = pełna rekrutacja nowej jednostki"); w src nie ma już "Dopłata = koszt nowej − koszt starej"/"bez dopłaty" w ścieżce Zastąp (pozostałe trafienia "Dopłata" to dyplomacja/miasta, niezwiązane). Stary tekst ze zrzutu właściciela = starsza wersja pliku ROBOCZEJ (sprzed FALA 571) — odnotowane.

TESTY
- node tools/unit-replace-army-multi-select-test.cjs: 29/29 OK (cele: stos 106 bez zaznaczenia = 0 celów, 1 zaznaczona = ta, 3 zaznaczone = 3, wódz tylko jawnie; okablowanie; koszt zbiorczy; częściowo przy braku Pieniądza/surowca; picker).
- Regresje: unit-replace-test 15/15 OK; unit-replace-full-cost-test 40/0 OK; army-panel-recruit-rally-general-test 5/5 OK.
- tsc --noEmit: błędy wyłącznie środowiskowe (brak @types/three w współdzielonym node_modules), żadnych w moim kodzie (main.ts/unitReplacePicker).
- NIE_ZMIERZONO: army-panel-general-label-multiselect-test, army-panel-recruit-remove-test (brak jsdom/playwright w piaskownicy; dysk 3 GB, node_modules podpięty symlinkiem z /tmp), Chromium/test wizualny panelu na żywo.

BLOKADY: brak (Chromium niedostępny — jawnie NIE_ZMIERZONO).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (uruchomić regresje army-panel-* z jsdom/Chromium, jeśli dostępne; sprawdzić UX zbiorczego okna z >1 grupą typów).
DEPLOY/PUSH: NIE WYKONANO
