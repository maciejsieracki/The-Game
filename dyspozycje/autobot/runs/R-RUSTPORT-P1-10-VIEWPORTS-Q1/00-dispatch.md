STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-10-VIEWPORTS-Q1
GOAL: P1.10 z PLAN-PORT-RUST-TAURI-20261020.md §4 — katalog viewportów/breakpointów UI, na świeżo
pinowanym `main` = `edb8fb56`.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
Przeszukać `gra/src/**` (CSS/TS) pod kątem media queries, breakpointów, stałych szerokości/wysokości
okna, logiki responsywnej. Zapisać w `dyspozycje/rust-port/p1/P1-10-VIEWPORTS.md`: listę wszystkich
znalezionych breakpointów z dokładną wartością i ścieżką/linią pliku, czy UI zakłada stały rozmiar okna
czy jest w pełni responsywne, czy są osobne układy dla małych/dużych ekranów.

ANTY-HALUCYNACYJNA REGUŁA
Każdy breakpoint musi mieć ścieżkę+linię+cytat — zakaz ogólnikowego "UI jest responsywne" bez
konkretnych wartości znalezionych grepem w tej rundzie.

BINARNE KRYTERIUM SUKCESU
Plik istnieje, każdy wpis ma ścieżkę+linię+wartość, podsumowanie jawnie stwierdza czy coś pominięto
(np. inline style vs CSS-in-JS) i dlaczego.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-10-VIEWPORTS.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-10-VIEWPORTS-Q1/**`. Odczyt: `gra/src/**` read-only (main
edb8fb56). Zero zapisu w `gra/**`.

IZOLACJA
Świeży checkout/clone `main` (edb8fb56), praca wyłącznie odczytowa (grep/cat), bez builda.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 300 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
