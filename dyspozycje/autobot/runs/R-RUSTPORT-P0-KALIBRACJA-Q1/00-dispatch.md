STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P0-KALIBRACJA-Q1
GOAL: Faza P0 portu Rust/Tauri (patrz dyspozycje/rust-port/PLAN-PORT-RUST-TAURI-20261020.md §4 P0):
  (1) ustalić aktualny main web przez `git ls-remote` na żywo + zapisać SHA i datę;
  (2) policzyć manifest SHA-256 wszystkich plików `gra/**` na tym pinie;
  (3) zmapować istniejący `rust-port/engine` + gałęzie (`autobot/real24-staging`,
      `hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920`,
      `hermes/R-RUSTREAL-20-SAVE-LOAD-Q1-RECOVERY-R2-20260915`): HEAD, pliki,
      realny wynik `cargo test`/`cargo build` (nie deklarację ze starych raportów).
RUNDA: 1/5
MODEL+EFFORT per rola:
  Operator: Haiku 5.5, effort medium
  Evaluator: Haiku 5.5, effort medium
  Final Control: Sonnet 5.5, effort medium
  (wszystkie trzy wyłącznie przez agent() w skrypcie Workflow — nigdy przez Agent/subagent)

ZADANIE (wąski zakres, jedno zdanie)
Po zakończeniu tego tematu istnieje w worktree: plik z pinowanym SHA+datą main
webowego, manifest SHA-256 `gra/**`, oraz tabela stanu dla każdej z 4 gałęzi Rust
(HEAD, `cargo test`/`cargo build` wynik faktycznie uruchomiony, nie zacytowany).

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz cytowania starych deklaracji wyniku testów (np. "218/218" ze starych
raportów OpenClaw) jako dowodu bieżącego stanu. Każdy wynik `cargo test`/
`cargo build` w raporcie musi pochodzić z komendy faktycznie uruchomionej w tej
rundzie, z pełnym poleceniem i rzeczywistym wyjściem (liczba testów PASS/FAIL,
nie samo słowo "zielone").

BINARNE KRYTERIUM SUKCESU
PRAWDA, jeśli: (a) zapisany SHA main jest wynikiem polecenia `git ls-remote`
wykonanego w tej rundzie (nie z pamięci/dokumentacji), (b) manifest SHA-256
obejmuje wszystkie pliki `gra/**` na tym SHA, (c) dla każdej z 4 gałęzi Rust
podano HEAD i wynik realnie uruchomionego `cargo test`/`cargo build` (sukces,
porażka, lub błąd kompilacji — z komunikatem).

ALLOWLISTA
- dyspozycje/rust-port/** (odczyt i zapis wyników tego tematu)
- dyspozycje/autobot/runs/R-RUSTPORT-P0-KALIBRACJA-Q1/** (raporty faz)
- odczyt: cały `rust-port/**`, cały `gra/**` (tylko odczyt — zero zapisu w `gra/**`)
Zakazane bezwzględnie: zapis w `gra/**`, `docs/decyzje/<ID>.md`, `.git/**` poza
normalnym działaniem git, `dyspozycje/WERSJE.md`, `npm run build`/`npm run dev`
bez scratch outDir, `git add -A`/`git add .`.

IZOLACJA
Praca odczytowa/diagnostyczna — nie wymaga nowego worktree zapisu w `gra/**`;
operacje `cargo test`/`cargo build` wykonywać w osobnych, czystych checkoutach
poszczególnych gałęzi Rust (świeży checkout z origin, nie dzielony worktree).
Baza: świeży `git fetch`/`git ls-remote` z `origin` tego repo (`maciejsieracki/The-Game`).

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 na tym samym
temacie. Po 5 rundach: LIMIT-5-EXCEEDED, decyzja właściciela.

OGRANICZENIA WYJŚCIA
- maks. ok. 400 słów w raporcie
- destylat: SHA/hashe/ścieżki + wynik komendy, nie surowy log
- zakaz edycji plików spoza allowlisty
- przy decyzji produktowej: status DECISION_REQUIRED

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
