STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-17B-UI-CLASSIFICATION-Q1
GOAL: Rozszerzenie P1.17 na `gra/src/ui` (117 plików .ts wg P1-1-FILE-CATALOG.md) — ale UI nie mapuje
się na `rust-port/engine` (logika domeny), tylko na warstwę frontendu Tauri. Ustalić, które pliki
`gra/src/ui` mają odpowiednik w ISTNIEJĄCYM froncie Tauri (`src-tauri/frontend/` na gałęziach
`autobot/real24-staging`/`hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920` — jedyne dwie gałęzie z
shellem Tauri) jako REUSE/ADAPT/REPLACE/UNKNOWN. Materiał wejściowy dla przyszłej fazy P5
(frontend/UI 1:1).
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
Przeczytać `dyspozycje/rust-port/p1/P1-1-FILE-CATALOG.md` (lista plików `gra/src/ui`). W świeżym
checkoucie `autobot/real24-staging` (jedyna gałąź z `src-tauri/frontend/`, obok identycznego
`hermes/handoff`) skatalogować zawartość `src-tauri/frontend/` (liczba plików, co to za technologia —
czy to w ogóle port UI, czy tylko statyczny placeholder/shell). Dla KAŻDEGO z 117 plików `.ts`
`gra/src/ui` ustalić etykietę: `REUSE` (frontend Tauri ma gotowy, semantycznie zgodny odpowiednik),
`ADAPT` (częściowy/różniący się odpowiednik), `REPLACE` (odpowiednik błędny/nieadekwatny), `UNKNOWN`
(brak odpowiednika albo nie dało się ustalić). Zapisać w
`dyspozycje/rust-port/p1/P1-17B-UI-CLASSIFICATION.md`.

ANTY-HALUCYNACYJNA REGUŁA
Jak w P1.17: zakaz `REUSE` bez realnie otwartego pliku frontu Tauri i porównania w TEJ rundzie.
Domyślna etykieta przy braku takiego sprawdzenia to `UNKNOWN`.

BINARNE KRYTERIUM SUKCESU
Plik istnieje, WSZYSTKIE 117 plików `.ts` z `gra/src/ui` mają etykietę z uzasadnieniem i dowodem,
podsumowanie liczbowe per etykieta sumuje się do 117, jawnie opisana zawartość `src-tauri/frontend/`
(czy to w ogóle realny port UI, czy placeholder).

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-17B-UI-CLASSIFICATION.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-17B-UI-CLASSIFICATION-Q1/**`. Odczyt: `gra/src/ui/**` (main
edb8fb56) i `src-tauri/**` (`autobot/real24-staging`), oba read-only. Zero zapisu poza allowlistą.

IZOLACJA
Dwa świeże, osobne checkouty read-only: `main` (edb8fb56) i `autobot/real24-staging`.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
