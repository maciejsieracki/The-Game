# Final Control — R-WEB-TECH-CARDS-TOP5-TEST-DEBT-Q1

**Werdykt: PASS-WITH-NOTES. Etap: 8 — Final Control.** Baza kontrolna zadania: `2b0f49da4c6101a86652e7919f12cd4454d18fdb`, zgodnie z raportami Operatora i Evaluatora.

## Kontrola

- Porównałem kanoniczny CSV z bazą zadania: zmiany ograniczają się do wskazanych pól wierszy `Hutnictwo żelaza` (`Top5`, odpowiadający slot `Dowod_plik_linia`, czwarty element `Co_mozesz_zrobic_PROPOZYCJA`), `Obróbka żelaza` (`Co_mozesz_zrobic_PROPOZYCJA`) i `Sztuka wojenna` (`Top3`, odpowiadający slot dowodu, drugi element propozycji CMZ). Pozostałe kolumny i wiersze są bez zmian.
- W `tech-cards-top5.json` różnice względem bazy to wyłącznie `_meta.csvSha256` oraz `Sztuka wojenna.top5[2].tytul`. Po zamaskowaniu tych dwóch oczekiwanych wartości pliki JSON są identyczne. Tytuł Top3 brzmi dokładnie `Odblokowuje jednostki epoki Żelaza`; opis i dowód pozostają zachowane.
- Test dodaje asercję dokładnego zatwierdzonego tytułu. Generator i jego źródło zdań pozostają niezmienione. Nie zmieniono mechaniki ani plików implementacji gry w ramach tego runu; inne zastane, niezwiązane zmiany w checkoutcie pozostawiono nietknięte.
- Niezależna kontrola generatora: `node gra/tools/gen-tech-cards-top5.cjs --check` — PASS. `git diff --check` dla trzech plików zakresu — PASS.
- Raport Evaluatora dokumentuje niezależny test renderowania: **595 pass, 0 fail**, oraz przegląd bramek rekrutacji i synchronizacji źródła. Final Control nie uruchamiał ponownie przeglądarki.

**Ograniczenia:** nie uruchamiano pełnej gry ani nie symulowano wszystkich cywilizacji i konfiguracji miast; zakres tej kontroli to źródło CSV, wynik generatora, asercja regresyjna i udokumentowany test renderowania. Raport utworzono bez stage, commita, deployu i pushu.
