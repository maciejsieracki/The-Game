STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-13-COMMANDS-EVENTS-Q1
GOAL: P1.13 z PLAN-PORT-RUST-TAURI-20261020.md §4 — katalog komend/eventów/przejść stanu na podstawie
`main.ts` i modułów `game/*.ts`, na świeżo pinowanym `main` = `edb8fb56`.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
Przejrzeć `gra/src/main.ts` i `gra/src/game/*.ts` i zapisać w
`dyspozycje/rust-port/p1/P1-13-COMMANDS-EVENTS.md`: listę wszystkich typów komend/akcji gracza
(np. union types, switch/case na typie akcji, dispatcherów), listę eventów/przejść stanu (np. zmiany
fazy tury, triggery AI, zdarzenia UI), z dokładną ścieżką+linią dla każdego wpisu. To jest materiał
wejściowy do P2.5 (zestaw komend frontend→Rust) i P2.6 (eventy Rust→frontend) — ma być wyczerpujący,
nie przykładowy.

ANTY-HALUCYNACYJNA REGUŁA
Każdy wpis musi mieć ścieżkę+linię+cytat fragmentu kodu. Zakaz parafrazowania z pamięci/dawnego audytu.

BINARNE KRYTERIUM SUKCESU
Plik istnieje, lista komend i eventów ma dla każdej pozycji ścieżkę+linię, podsumowanie podaje łączną
liczbę znalezionych typów komend i eventów.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-13-COMMANDS-EVENTS.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-13-COMMANDS-EVENTS-Q1/**`. Odczyt: `gra/src/**` read-only (main
edb8fb56). Zero zapisu w `gra/**`.

IZOLACJA
Świeży checkout/clone `main` (edb8fb56), praca wyłącznie odczytowa.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 300 słów (treść katalogu w pliku, nie w raporcie).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
