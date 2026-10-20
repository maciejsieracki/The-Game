STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-12-DATA-CATALOG-Q1
GOAL: P1.12 z PLAN-PORT-RUST-TAURI-20261020.md §4 — katalog pełnych danych `gra/data/*.json` (ok. 30
plików: cywilizacje, epoki, tereny, budynki, jednostki, zasoby, dyplomacja, handel, kultura/religia,
parametry AI), na świeżo pinowanym `main` = `edb8fb56`.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
Dla KAŻDEGO pliku `gra/data/*.json` zapisać w `dyspozycje/rust-port/p1/P1-12-DATA-CATALOG.md`: nazwę
pliku, rozmiar, liczbę rekordów top-level (np. liczba cywilizacji/jednostek/budynków), kształt
schematu (lista kluczy jednego przykładowego rekordu), jedno zdanie o przeznaczeniu. Podsumowanie:
łączna liczba plików w `gra/data/` (potwierdź albo skoryguj liczbę 30 z poprzedniego audytu).

ANTY-HALUCYNACYJNA REGUŁA
Liczba plików i rekordów musi pochodzić z realnie uruchomionej komendy (`ls`, `jq`/`node -e` do
policzenia długości tablic) w tej rundzie, nie z pamięci.

BINARNE KRYTERIUM SUKCESU
Plik istnieje, pokrywa WSZYSTKIE pliki `gra/data/*.json` bez pominięcia, każdy wpis ma zweryfikowaną
liczbę rekordów.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-12-DATA-CATALOG.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-12-DATA-CATALOG-Q1/**`. Odczyt: `gra/data/**` read-only (main
edb8fb56). Zero zapisu w `gra/**`.

IZOLACJA
Świeży checkout/clone `main` (edb8fb56), praca wyłącznie odczytowa.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 300 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
