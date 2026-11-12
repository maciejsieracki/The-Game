STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-PROC-GATE-REFERENCE-REFRESH-Q2
GOAL: odświeżyć tabelę punktów odniesienia bramek w docs/decyzje/R-PROC-AUTOBOT.md §6 na podstawie świeżego pomiaru; obrona po zarzutach Evaluatora (20-evaluator-claude.md, report_sha 31de02abb7e483df2e5553a5797beb0e2b9757fc).
ZMIANY/COMMIT: baza kandydata 2fab4f18a. Poprawka: docs/decyzje/R-PROC-AUTOBOT.md (§6: wiersz „Moc jednostek", nagłówek §6). Raport: dyspozycje/autobot/runs/R-PROC-GATE-REFERENCE-REFRESH-Q2/30-obrona-claude.md. Commit poprawki i commit raportu: SHA w polu sha wyniku (SHA końcowy = commit raportu). gra/, WERSJE.md, rust-port nietknięte.

ODPOWIEDZI NA ZARZUTY:

Zarzut 1 (wiersz „Moc jednostek" podaje „czerwony pre-istniejąco: 4 pass / 2 fail"): PRZYJMUJĘ.
- Dowód pomiaru (surowe wyjście, gra/, ef27be007 + 2fab4f18a bez zmian w gra/):
  `node tools/unit-power-test.cjs` -> `=== unit-power-test: 6 pass, 0 fail ===`, exit 0 (OK: Hastati M_pole=57.5; Katapulta is siege; Katapulta armyFieldPower=0; Katapulta M_siege>0 (got 45); sumArmyFieldPower 3 units (got 173.5); JSON fieldPower matches runtime for Triari (62)).
- Poprawka: wiersz zapisuje teraz wynik 6/0 z datą pomiaru; zdanie „czerwony pre-istniejąco ... nie naprawiaj" usunięte. Wpis „4 pass / 2 fail" oznaczony jako nieaktualny (historyczny).
- Weryfikacja: `grep -n "czerwony\|4 pass / 2 fail" docs/decyzje/R-PROC-AUTOBOT.md` zwraca tylko nowy wiersz 592 z treścią „Poprzedni wpis „czerwony 4 pass / 2 fail” jest nieaktualny”.

Zarzut 2 (nagłówek §6 nie zastrzega NIE_ZMIERZONO dla wierszy poza zmierzonymi): PRZYJMUJĘ.
- Nagłówek §6 przepisany: świeży pomiar 2026-11-12 objął WYŁĄCZNIE wiersze TypeScript, Logika, Drzewo technologii, Badania, Wymiana jednostek, Walka, Moc jednostek. Pozostałe wiersze (Generator mapy, Mgła, AI stawia budynki, Bitwa na polu mapy, Kontrakt karty encji, Karta technologii/scrollbar, Krążenie barbarzyńców, AI zdobycie miasta) oznaczone jako NIE_ZMIERZONO w tym temacie, z zaleceniem zmierzenia przed użyciem jako punktu odniesienia.
- Ta sama treść nie została wpisana w każdy wiersz osobno; zastrzeżenie jest w nagłówku, który obejmuje całą tabelę.

ZAŁOŻENIE (luka rozstrzygnięta w raporcie): Evaluator w zarzucie 2 dopuszcza zastrzeżenie w nagłówku; przyjąłem, że wystarczy nagłówek i nie dopisuję NIE_ZMIERZONO do każdego wiersza.

TESTY (surowe wyniki):
- Ta runda, ponowny pomiar: `node tools/unit-power-test.cjs` -> `6 pass, 0 fail`, exit 0 (powyżej).
- Pozostałe bramki z §6 (tsc, logic 213/213, tech-tree 20/20, research 33/33, unit-replace 21/21, combat 6/6) NIE były ponownie uruchamiane w tej rundzie obrony — zmiana dotyczy wyłącznie tekstu §6 i wiersza unit-power, nie kodu gry. Wartości cytowane z 10-operator-claude.md (surowe wyjścia tej rundy operatora) i potwierdzone przez Evaluatora (20-evaluator-claude.md). Zostały one NIE_ZMIERZONE ponownie w obronie.
- `git diff --check`: czysto (brak wyjścia, exit 0).
- `git diff --stat` przed commitem raportu: docs/decyzje/R-PROC-AUTOBOT.md, 9 insertions(+), 5 deletions(-) — jedyny zmieniony plik kodu/dokumentacji.
- Brak zmian w gra/ i WERSJE.md (zgodnie z allowlistą DODATKU).

BLOKADY: brak. Środowisko: `npm ci --ignore-scripts` w gra/ (tylko do uruchomienia bramki unit-power; brak npm run build/dev).

RUNDY: 2/5 (runda obrony po zarzutach Evaluatora r1)

NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja, że wiersz „Moc jednostek" i nagłówek §6 zgadzają się z surowym wyjściem powyżej, oraz decyzja FC. Integracja i push po Final Control, nie przez Operatora.

DEPLOY/PUSH: NIE WYKONANO
