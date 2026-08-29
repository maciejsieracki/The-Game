# Raport Evaluatora — R-TECHNOLOGIA-KARTY-PODGLAD-KLIK-Q1

STATUS: PASS-WITH-NOTES

TEMAT: R-TECHNOLOGIA-KARTY-PODGLAD-KLIK-Q1

GOAL: Niezależnie potwierdzić, że kliknięcie technologii w `techTreeView` oraz kliknięcie wiersza/ikony/pozycji panelu Badań otwiera istniejącą kartę technologii jako podgląd, bez automatycznego rozpoczęcia badania ani zmiany planu, dla stanów zbadana, aktywna, dostępna i zablokowana.

ZMIANY/COMMIT:
- Zweryfikowana baza: README.md obecny i przeczytany; HEAD `47cdca15757efb89d5e634e9e9ddff370925708d`; FALA 300 w `dyspozycje/WERSJE.md` oznaczona jako ROBOCZA/`VERIFY OK`.
- Brak commita i brak integracji. Właściwy diff tematu obejmuje wyłącznie:
  - `gra/src/ui/techTreeView.ts` — wszystkie statusy `lk`, `ip`, `od`, `av` otwierają `showTechDiscoveryNotice(... kind: 'preview')`; tylko `av` dostaje osobną akcję `Rozpocznij badanie`.
  - `gra/src/ui/scienceHubHud.ts` — klik celu aktywnego, wiersza/ikony listy i pozycji planu otwiera tę samą kartę; akcja wyboru pozostaje osobnym przyciskiem karty dla dostępnej technologii.
  - `gra/src/ui/techDiscoveryNotice.ts` — rozszerzenie istniejącej karty o jawny tryb `preview` i osobny handler `data-act="research"`; nie powstał drugi format karty.
- Zakres diffu: `+55/-22` w trzech plikach UI. Brak zmian w `gra/data`, logice silnika badań, `availableTechs`, snapshot logic ani `science-hub-test.cjs`.
- Współdzielony worktree nadal zawiera niezwiązane modyfikacje (`dyspozycje/REJESTR-PROSB-I-ZADAN.md`, `gra/src/game/cities.ts`, `gra/src/ui/empireDetailPanel.ts`) i inne katalogi runów; pozostawiono je bez zmian.

TESTY:
- `node tools/technology-discovery-card-visual-test.cjs`: **17 PASS / 0 FAIL**.
- `node tools/tech-tree-test.cjs`: **19 PASS / 0 FAIL**.
- `node tools/research-test.cjs`: **33 PASS / 0 FAIL**.
- `node tools/science-hub-test.cjs`: **5 PASS / 2 FAIL**. Oba FAIL-e dotyczą nieaktualnego warunku `>=5`: niezależnie zmierzony silnik zwraca 4 dostępne technologie, a hub zwraca te same 4 (`4 vs 4`). FAIL-e nie są regresją tego tematu, ponieważ źródła silnika/listy i sam test nie są w diffie.
- `tsc --noEmit`: **exit 0, 0 błędów**. Raportowanych przez Operatora 6 błędów pre-existing nie udało się odtworzyć w aktualnym worktree; nie traktuję ich jako blokady.
- `git diff --check`: bez błędów whitespace dla trzech plików tematu.
- Dowody statyczne: zachowane `tdn-back` → click outside, `pushOverlay/popOverlay` → stos Escape, istniejące `focus-visible` dla przycisków karty; wiersze hubu mają `role="button"`, `tabIndex=0` i obsługę Enter/Space. Hint panelu i tekst karty jawnie informują o podglądzie oraz rozdzieleniu wyboru badania.
- Chromium: pierwsza próba Playwright w sandboxie zakończyła się `spawn EPERM`; poza sandboxem lokalny Chrome headless uruchomił się poprawnie. Nie istnieje jednak dedykowany live DOM-harness dla tych nowych ścieżek, więc nie składam mocniejszego twierdzenia o pełnym playteście klików w przeglądarce.

BLOKADY:
- Brak blokady kontraktu. Pozostaje ograniczenie dowodowe: brak dedykowanego live DOM-harnessu dla kombinacji drzewko/hub × cztery statusy × Escape/click outside/focus.
- Utrzymany czerwony test `science-hub-test` wymaga korekty progu z `>=5` do aktualnego kontraktu danych `>=4` albo zastąpienia go asercją zgodności hub↔silnik; to osobna korekta testu, nie regresja tej zmiany.

NASTĘPNY KROK: Final Control może przyjąć temat jako PASS-WITH-NOTES. Przy najbliższej konserwacji testów poprawić próg science hubu i dodać mały live DOM-harness dla modalnego podglądu, bez zmiany kontraktu.

DEPLOY/PUSH: NIE WYKONANO.
