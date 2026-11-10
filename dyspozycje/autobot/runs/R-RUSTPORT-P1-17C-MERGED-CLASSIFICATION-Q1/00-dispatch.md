STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-17C-MERGED-CLASSIFICATION-Q1
GOAL: Scalić wyniki P1.17 (`gra/src/game` vs `rust-port/engine`) i P1.17b (`gra/src/ui` vs
`src-tauri/frontend`) w jeden zbiorczy dokument klasyfikacji REUSE/ADAPT/REPLACE/UNKNOWN dla całego
`gra/src` (300 plików game+ui razem), z jedną tabelą podsumowującą dla P2.1/P2.13.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
Przeczytać `dyspozycje/rust-port/p1/P1-17-RUST-CLASSIFICATION.md` (183 wiersze, game) i
`dyspozycje/rust-port/p1/P1-17B-UI-CLASSIFICATION.md` (117 wierszy, ui). Zapisać w
`dyspozycje/rust-port/p1/P1-17C-MERGED-CLASSIFICATION.md`: (1) jedną zbiorczą tabelę liczbową
(REUSE/ADAPT/REPLACE/UNKNOWN, osobno dla game, osobno dla ui, razem — musi sumować się do 300), (2)
listę WSZYSTKICH plików z etykietą inną niż UNKNOWN (ADAPT/REPLACE, 24 z P1.17 + 10 z P1.17b = 34
pozycji) w jednej tabeli z kolumną źródła (game/ui) i oryginalnym uzasadnieniem, (3) jedno zdanie
podsumowania dla właściciela: jaki realistycznie procent `gra/src` ma dziś jakikolwiek odpowiednik w
istniejącym kodzie Rust/Tauri.

ANTY-HALUCYNACYJNA REGUŁA
Nie przeliczać etykiet od nowa (to już zrobione w P1.17/17b, zweryfikowane przez Final Control) —
tylko scalić istniejące, zweryfikowane dane. Zakaz zmiany jakiejkolwiek etykiety bez nowego dowodu.

BINARNE KRYTERIUM SUKCESU
Plik istnieje, suma REUSE+ADAPT+REPLACE+UNKNOWN = 300, lista 34 pozycji nie-UNKNOWN jest kompletna
(porównanie z oryginalnymi plikami, zero pominięć).

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-17C-MERGED-CLASSIFICATION.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-17C-MERGED-CLASSIFICATION-Q1/**`. Odczyt:
`dyspozycje/rust-port/p1/P1-17-RUST-CLASSIFICATION.md` i `P1-17B-UI-CLASSIFICATION.md`, read-only.

IZOLACJA
Czysta praca odczytowa na już istniejących plikach w repo.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 300 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
