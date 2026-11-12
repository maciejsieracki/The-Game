STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-NAN-STRICT-Q1
GOAL: w brake_power.rs odrzucać nieskończone/NaN wartości Provided jawnym błędem (STRICT); udokumentować różnicę względem webu; testy p6_power_nan.rs; istniejące wektory z pinu bez zmian.
ZMIANY/COMMIT: gałąź rust-port-wip/P6-POWER-NAN-STRICT-Q1, commit SHA = patrz sekcja DEPLOY/PUSH (commit tworzony po zapisie raportu; SHA podaje odpowiedź Operatora).
  Pliki (allowlista):
  - rust-port/engine/src/domain/brake_power.rs (zmodyfikowany): nowe `NonFiniteComponents`, `PowerInputError { Missing, NonFinite }`; `compute_objective_power` i `objective_power_for_owner` zwracają `Result<_, PowerInputError>`; walidacja `is_finite()` przed `max(0.0)` tylko dla aktywnych pól; Missing ma pierwszeństwo przed NonFinite; komentarz o różnicy względem webu.
  - rust-port/engine/tests/p6_power_nan.rs (nowy): 9 testów (NaN/+Inf/-Inf w każdym aktywnym polu w obu modelach, regresja NaN.max, adapter, kolejność kluczy, pierwszeństwo Missing, nieaktywne pole bitew nieczytane, ujemne skończone nadal 0, jawne zero).
  - rust-port/engine/tests/p6_power_nozeros.rs (adaptacja sygnatury): asercje `MissingComponents(...)` -> `PowerInputError::Missing(MissingComponents(...))`; treść asercji (dokładna lista kluczy) bez zmian.
  Nie zmieniano: p6_brake_inputs.rs, p6_brake_inputs_vectors.rs (kompilują się bez zmian; wektory z pinu przechodzą), gra/**, Cargo.toml, Cargo.lock, WERSJE.md, origin/main, rust-port/parity-v2.
  Decyzja techniczna: odrzucane są NaN, +Inf i -Inf (zgodnie z wariantem A dispatchu). Tylko aktywny model bitew jest walidowany (nieaktywne pole nie jest czytane, jak w webie).
  Odnotowana rozbieżność z webem (świadoma): web `Math.max(0, x)` propaguje NaN i +Inf, daje 0 dla -Inf; Rust odrzuca wszystkie trzy przypadki jako błąd wejścia. Rust `f64::NAN.max(0.0)` dawałby ciche 0 - to był powód zmiany.
  Nie walidowano pola `epoka` (nie jest składnikiem; nie wchodzi do wzoru, mnożnik zawsze 1).
TESTY:
  - cargo fmt --check: EXIT 0
  - cargo clippy --all-targets -- -D warnings: EXIT 0
  - cargo test --lib: EXIT 0 (48 passed, 0 failed)
  - cargo test --test p6_power_nan: 9 passed
  - cargo test --test p6_power_nozeros: 9 passed
  - cargo test --test p6_brake_inputs: 10 passed
  - cargo test --test p6_brake_inputs_vectors: 9 passed
  - cargo test --test p6_power_producers: 9 passed
  - cargo test --test p6_power_army: 7 passed
  - git diff --check: EXIT 0
  Środowisko: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo (scratchpad/target-p6nan).
BLOKADY:
  - Rozbieżność bazy: dispatch wskazuje 258afaf8f (czubek BATCH6, gałąź origin rust-port-wip/BATCH6-tip); treść zadania wskazywała origin/rust-port/parity-v2 (f207ea6b1 lub nowszy). Użyto 258afaf8f: origin/rust-port/parity-v2 (94cba6667) NIE zawiera POWER-ARMIA/POWER-NOZEROS, na których stoi brake_power.rs; f207ea6b1 jest przodkiem 258afaf8f, więc warunek "lub nowszy" jest spełniony. Orkiestrator powinien potwierdzić bazę przy integracji.
  - Cargo.lock wygenerowany przez cargo został usunięty i NIE jest commitowany.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (R-RUSTPORT-P6-POWER-NAN-STRICT-Q1, runda 1) na gałęzi rust-port-wip/P6-POWER-NAN-STRICT-Q1 (baza 258afaf8f).
DEPLOY/PUSH: NIE WYKONANO (Operator nie pushuje; gałąź tylko lokalna w worktree).
