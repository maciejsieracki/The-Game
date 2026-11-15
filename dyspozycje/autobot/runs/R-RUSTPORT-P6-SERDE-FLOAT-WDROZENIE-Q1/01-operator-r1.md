STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SERDE-FLOAT-WDROZENIE-Q1 (runda 1) — wdrożenie decyzji TAK (#170 / #139 / #151 / #232)
GOAL: włączyć feature `float_roundtrip` serde_json w `rust-port/engine` i usunąć tolerancję `close()` (1e-9) z `p6_brake_inputs_vectors.rs`, porównanie bit-w-bit.
BAZA: f7baa3848 (detached worktree, zgodnie z dispatchem)

ZMIANY/COMMIT:
- `rust-port/engine/Cargo.toml:9`: `serde_json = { version = "1.0", features = ["float_roundtrip"] }` (wersja i reszta bez zmian).
- `rust-port/engine/tests/p6_brake_inputs_vectors.rs`: usunięta funkcja `close()` (tolerancja 1e-9) wraz z komentarzem; asercje powerBase, rawCount, coefficient, points zamienione na `assert_eq!` (porównanie f64 `==`; dla wartości skończonych równoważne porównaniu bitowemu, z wyjątkiem -0.0 vs +0.0 i NaN, których w tych wektorach nie ma). Brak `#[ignore]`, brak osłabionych asercji.
- `Cargo.lock` wygenerowany przez cargo, NIE commitowany (untracked).

TESTY:
- `cargo fmt --check` (rust-port/engine): EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --test p6_brake_inputs_vectors`: EXIT 0, 9 passed, 0 failed, 0 ignored
- `cargo test --lib`: EXIT 0, 118 passed, 0 failed, 0 ignored
- CARGO_TARGET_DIR=/tmp/claude-0/wf-target-serde (poza repo), do usunięcia po bramkach.

BLOKADY:
- Brak wektora niezgodnego bit-w-bit: wszystkie asercje przechodzą bez luzowania.
- NOTE (nie blokuje): dispatch i komentarze odwołują się do `dyspozycje/rust-port/p6/SERDE-FLOAT-DECYZJA.md` (FC PASS-WITH-NOTES `4cb572a95`). Plik NIE istnieje w bazie `f7baa3848` (jest na `origin/claude/rust-sivvrn` w `b866b853a`, poza tym worktree i poza allowlistą). Nie użyty do zmian; decyzja wykonana wg treści dispatchu.
- NOTE: `git fetch origin claude/rust-sivvrn` zgłosił `cannot lock ref`; dispatch odczytano z `origin/claude/rust-sivvrn` (b866b853a).
- NOTE: HEAD worktree przed startem to 7ac79dafb; przełączono na detached f7baa3848 wg dispatchu.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja diffu (allowlista, brak `close(` w pliku, bramki EXIT 0), następnie Obrona/FC wg obiegu.
DEPLOY/PUSH: NIE WYKONANO (operator nie pushuje; push do rust-port/parity-v2 zakazany dispatchem).
