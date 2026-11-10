STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-1-FILE-CATALOG-Q1
GOAL: P1.1 z PLAN-PORT-RUST-TAURI-20261020.md §4 — katalog plików/modułów `gra/src/game`,
`gra/src/ui`, `gra/src/map`, `gra/src/units`, `gra/src/battle`, `gra/src/render`, entry pointy, na
świeżo pinowanym `main` = `edb8fb56`.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
Zbudować i zapisać w `dyspozycje/rust-port/p1/P1-1-FILE-CATALOG.md` pełny katalog: dla każdego z
katalogów `gra/src/game`, `gra/src/ui`, `gra/src/map`, `gra/src/units`, `gra/src/battle`,
`gra/src/render` oraz plików wejściowych (`main.ts` i inne entry pointy z `gra/src`) — ścieżka, liczba
linii, jedno zdanie o przeznaczeniu (na podstawie nazwy/importów/eksportów, nie zgadywanie). Podsumowanie
liczbowe na końcu (łączna liczba plików/linii per katalog), porównane z liczbami z poprzedniego audytu
(179 plików `gra/src/game`, 105 `gra/src/ui` — potwierdź albo skoryguj na świeżym pinie).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz podawania liczby plików/linii z pamięci albo z cytatu starego audytu bez przeliczenia na bieżącym
checkoucie (`find ... | wc -l`, `wc -l` per plik) w TEJ rundzie.

BINARNE KRYTERIUM SUKCESU
Plik `P1-1-FILE-CATALOG.md` istnieje, pokrywa WSZYSTKIE 6 katalogów + entry pointy, liczby zweryfikowane
komendą w tej rundzie (nie cytatem), struktura czytelna (tabela lub lista per katalog).

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-1-FILE-CATALOG.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-1-FILE-CATALOG-Q1/**`. Odczyt: cały `gra/src/**` (świeży
checkout `main`=`edb8fb56`), read-only. Zero zapisu w `gra/**`, zero `npm run build/dev`, zero
`git add -A`.

IZOLACJA
Świeży, płytki checkout/clone `main` (`edb8fb56`) do odczytu — nie modyfikuj bieżącego checkoutu repo
poza allowlistą.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje brakujący katalog/błędną liczbę, Operator uzupełnia w tej samej rundzie. Po 5
rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 300 słów (treść katalogu jest w pliku, nie w raporcie). Zakaz zapisu poza allowlistą.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
