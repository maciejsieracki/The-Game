# 01-operator-r1 — R-RUSTPORT-P4-371-T0-BRIDGE-CONTRACT-ROOT (= #374)

STATUS: PASS
DOMAIN: GAME (kontrakt mostu/powłoki, testy engine)
TEMAT: R-RUSTPORT-P4-371-T0-BRIDGE-CONTRACT-ROOT
GOAL: kontrakt powłoki (`src-tauri/src/lib.rs`) i mostu (`engine/src/bridge.rs`) z root `tests/bridge_contract.rs` przeniesiony do `rust-port/engine/tests/bridge_contract.rs` (kompilowany przez CI engine: `cargo test --all-targets`), z `match` wyczerpującym po wszystkich wariantach `EngineCommand` i `BridgeResult`.
BAZA: `origin/rust-port/parity-v2` = `38f5939e2` (w chwili startu). Gałąź robocza: `rust-port-wip/P4-371-T0-bridge`.

## ZMIANY/COMMIT

Allowlista dotrzymana (1 plik kodu, rename + raport):

- `tests/bridge_contract.rs` (root) → `git mv` → `rust-port/engine/tests/bridge_contract.rs` (rename, 135+/3-).
- `#[path = "../src/bridge.rs"]`, `include_str!("../../../src-tauri/src/lib.rs")` (D-371-6).
- `state_from`: jawne ramiona `RenderLayers`/`RenderMap`/`RenderFrame` z `panic!` podającym nazwę wariantu; brak `_ =>`.
- Nowe `command_kind(&EngineCommand)` (11 wariantów, wire `kind`) i `result_kind(&BridgeResult)` (4 warianty) — wyczerpujące, bez `_ =>`.
- Nowy test `every_command_serializes_with_its_wire_kind_and_round_trips`: próbka każdego wariantu, `command.kind` JSON == `command_kind`, round-trip `BridgeRequest`, unikalność kindów.
- Nowy test `render_queries_through_real_adapter_answer_their_variant_without_events`: `GetRenderLayers`/`GetRenderMap`/`GetRenderFrame` przez `EngineBridge<CivEngineAdapter>` po `CreateSession` → `events.is_empty()`, `request_id`, `contract_version`, właściwy wariant `BridgeResult`.
- Wszystkie dotychczasowe asercje zachowane, w tym 8 asercji napisów powłoki. Jedyna zmiana: `players[0].id == 1` → `== civ_engine::PlayerId::new(1)`. Martwy root-test nie kompilował się także z tego powodu (`EnginePlayer.id` ma dziś typ `PlayerId`, E0308). Semantyka asercji ta sama.
- NIE ruszano: `bridge.rs`, `src-tauri/**`, `Cargo.toml`/`Cargo.lock`, innych testów. Root `tests/` zachowuje pliki `.cjs` (nie w zakresie).

Commit: SHA podany w raporcie StructuredOutput / `git log` gałęzi `rust-port-wip/P4-371-T0-bridge` (commit z tym raportem).

## TESTY (w `rust-port/engine`, CARGO_TARGET_DIR w scratchpadzie `t0bridge/target`, INCREMENTAL=0, DEBUG=0)

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test bridge_contract` | EXIT 0, 9 passed (8 testów pliku: 6 przeniesionych + 2 nowe; 1 unit test z `bridge.rs` przez `#[path]`) |
| `cargo test --all-targets --no-fail-fast` (tło, `setsid nohup`) | EXIT=0; 532 binarki testowe, 3997 passed, 0 failed, 1 ignored (istniejący wcześniej `e2e::dump_tick1_econ_for_web_generator`, nie w tym pliku) |
| `git diff --cached --check` | czysty |
| `#[ignore]` w nowym pliku | 0 |

Korekta liczby: plik ma 8 testów (6 przeniesionych + 2 nowe), a dziewiąty przebieg w binarce to `bridge::add_player_atomicity_tests::…` z `bridge.rs`, dołączony przez `#[path]`.

Dysk przed pełną bramką: 11–12 GB wolne.

## Mutanty (tymczasowe, przywrócone; `cmp` potwierdził identyczność `bridge.rs` z kopią)

1. **Nowy wariant `EngineCommand::MutantProbe` w `bridge.rs` bez ramienia w teście** → `cargo test --test bridge_contract --no-run`: `error[E0004]: non-exhaustive patterns: &bridge::EngineCommand::MutantProbe not covered --> tests/bridge_contract.rs:33:11` (`command_kind`). Do tego dwa błędy w adapterach `bridge.rs:396`/`:499`. Test łamie kompilację niezależnie od nich.
2. **Usunięta gałąź `BridgeResult::RenderFrame` w `state_from`** → `error[E0004]: non-exhaustive patterns: &BridgeResult::RenderFrame { .. } not covered --> tests/bridge_contract.rs:22:11`.

## BLOKADY

Brak.

Uwaga dla orkiestratora (poza allowlistą, bez zmian): komentarz w `rust-port/engine/src/bridge.rs:20-22` nadal mówi o „root `tests/bridge_contract.rs`, which is outside this topic's allowlist". Po integracji jest nieaktualny i proponuję mikrotemat dokumentacyjny. CI `rust-engine.yml` uruchamia `cargo test --all-targets`, więc nowy plik jest teraz w CI.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (`02-evaluator.md`), Obrona, Final Control. Integrację robi orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
