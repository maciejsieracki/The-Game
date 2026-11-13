# Niezależna kontrola końcowa — R-WEB-TERMINOLOGY-TRADE-VS-TAX-Q1, runda 2

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
ETAP: 8 — Final Control
MODEL / EFFORT: GPT-6 Luna / High

## Zakres i wynik

Niezależnie sprawdziłem zmianę testową z rundy 2 oraz ponownie uruchomiłem test focused z `gra/`:
`node tools/terminology-trade-vs-tax-test.cjs` — exit 0, **796 pass, 0 fail**.

W bieżącym diffie zmieniono pod `gra/` wyłącznie `gra/tools/terminology-trade-vs-tax-test.cjs`; nie ma zmian w `gra/data/` ani `gra/src/`. Zachowano wszystkie dotychczasowe asercje terminologiczne `[A]`, `[B]`, `[J]`, `[P]`, `[C]`, `[D]` i `[P2]`: kontrola liczby wywołań `check()` dla tych grup daje 70 w wersji bieżącej i 70 w `HEAD`. Dodano dwie jawne asercje `normalizeCsvText`: `+3 handlu na polu` → `+3 podatku na polu` oraz `Warunek Wymiany — klucza…` → `Warunek Wymiany — klucz…`. Zmiana usuwa wyłącznie pełne wywołanie `gen-tech-cards-top5.cjs --check` z testu terminologii; błędy nadal zwiększają licznik `fail`, są drukowane, a końcowy exit code zależy od `fail === 0`.

Globalna bramka kart odkryć pozostaje w `gra/tools/tech-cards-top5-test.cjs`: jej asercja `[A] gen-tech-cards-top5.cjs --check: dane zgodne z generatorem` nadal uruchamia generator i kontroluje jego kod wyjścia. Nie znalazłem wyciszania błędów ani warunkowego pomijania porażek. Nie uruchamiałem suite kart ani przeglądarki; kontrola tej bramki była odczytem źródła, a nie zaliczeniem suite.

## Uwagi i niezależne długi

Poprzedni test-fix `c6b0a58d5` pozostaje niedostępny: `git cat-file -t c6b0a58d5` zwraca `Not a valid object name`, a bieżące drzewo nie zawiera refu `TERMTAX-test`. Zatem stara poprawka nie została zastosowana ani uznana za źródło tej zmiany; obecny hunk jest niezależną zmianą testu widoczną w diffie względem `HEAD`.

Dług kart odkryć `Sztuka wojenna: Top3 = NIE_USTALONO nie może trafić na kartę` pozostaje jawnie nierozwiązany i poza zakresem. Raporty Operatora i Evaluatora zapisują błąd oraz brak Chromium; ta kontrola nie zamyka długu Top3 i nie przedstawia suite kart jako zaliczonego. Nie używałem przeglądarki.

`git diff --check` dla scoped diffu testu i dispatchu — exit 0. Bez zmian produktowych, commitów, deployu ani pushu.

Mała uwaga redakcyjna: nagłówek komentarza testu nadal opisuje `[G]` jako „generatory kart (--check)”, choć grupa zawiera teraz dwa testy normalizatora i tylko generator kart budynków. Nie wpływa to na wykonanie ani wynik; warto uaktualnić komentarz przy następnym dozwolonym edycie tego testu.

## Werdykt

**Etap 8: PASS-WITH-NOTES.** Zatwierdzam odsprzężenie focused testu od globalnej bramki Top3: asercje terminologiczne pozostały, oba nowe przypadki normalizatora są bezpośrednio sprawdzane, focused test przechodzi 796/0, a niezależna bramka kart odkryć nadal istnieje. Notatki: niedostępny historyczny `c6b0a58d5`, nierozstrzygnięty dług Top3 oraz suite kart nieuruchomiony w tej kontroli.
