# Raport operatora — R-TECHNOLOGIA-KARTY-PODGLAD-KLIK-Q1

STATUS: PASS-WITH-NOTES

TEMAT: R-TECHNOLOGIA-KARTY-PODGLAD-KLIK-Q1

GOAL: Klik technologii w pełnym drzewku i w panelu Badań otwiera istniejącą kartę technologii w trybie podglądu. Podgląd obejmuje stany zbadana, aktywnie badana, dostępna i zablokowana; wybór/rozpoczęcie badania jest osobną akcją.

ZMIANY-COMMIT:
- Brak commita — bez integracji.
- `gra/src/ui/techDiscoveryNotice.ts`: tryb `preview`, jasna informacja o podglądzie i osobny przycisk „Rozpocznij badanie”; zachowane Esc, click-outside i istniejący format karty.
- `gra/src/ui/techTreeView.ts`: klik każdego węzła otwiera podgląd; dostępna technologia może zostać rozpoczęta wyłącznie przez osobny przycisk w karcie.
- `gra/src/ui/scienceHubHud.ts`: klik wiersza/ikony, aktywnego celu i pozycji planu otwiera kartę; akcja wyboru pozostaje osobna. Dodany jasny hint interakcji.
- Nie zmieniano danych gry ani `dyspozycje/WERSJE.md`.

TESTY:
- `technology-discovery-card-visual-test.cjs`: 17 PASS / 0 FAIL.
- `tech-tree-test.cjs`: 19 PASS / 0 FAIL.
- `research-test.cjs`: 33 PASS / 0 FAIL.
- `tsc --noEmit`: 6 pre-existing błędów poza allowlistą w `main.ts`/`empireDetailPanel.ts` (`getOwnerDefaultPodzialPracy`, `CityPodzialPracy`); brak błędów w zmienionych plikach.
- `science-hub-test.cjs`: 5 PASS / 2 FAIL w istniejącym założeniu „>=5”; silnik i hub zgodnie zwracają 4 dostępne technologie (`4 vs 4`), więc nie jest to regresja tego tematu.
- Live Chromium / test DOM-harness: niedostępny; wykonano najlepsze dostępne testy statyczne i bundlowane.

BLOKADY:
- Pełny `tsc` pozostaje czerwony przez istniejące, niezwiązane zmiany w `main.ts` i `empireDetailPanel.ts`.
- `science-hub-test` ma nieaktualny próg liczby dostępnych technologii.
- Współdzielone drzewo zawiera niezwiązane modyfikacje; pozostawiono je bez zmian.

NASTĘPNY KROK: Evaluator

DEPLOY-PUSH: NIE WYKONANO.
