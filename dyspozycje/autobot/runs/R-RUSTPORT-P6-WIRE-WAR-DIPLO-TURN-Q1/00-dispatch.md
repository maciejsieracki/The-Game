# DISPATCH — R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1 (W6, runda 1/5, Operator)

Orkiestrator: czat RUST (gałąź `claude/rust-sivvrn`). Dispatch zapisany PRZED Workflow.
Źródło planu: `dyspozycje/rust-port/p6/P6-WIRE-WAR-TURN-PLAN.md` (wiersz W6 w tabeli partii, §0 wnioski) na `origin/rust-port/parity-v2`.

## Baza i pin
- Baza Rust: `origin/rust-port/parity-v2` = `a4087f332` (zawiera W1, W2, W3, W4, W5, DYSTANS). Worktree: `git checkout --detach origin/rust-port/parity-v2` po `git fetch origin rust-port/parity-v2`.
- Web (źródło wektorów): `origin/main` w chwili startu = `07d2fbd72f758705f8e1d59cc4968027ffbafe75` (ZAPISZ ten SHA w raporcie jako pin). Wektory: `git archive <pin> gra/src gra/data` do katalogu POZA repo, Node 22 + esbuild 0.24.2 poza repo. NIE pisz wektorów ręcznie.
- Zależności: W1 (`war_turn_state.rs`), W2 (`war_world_view.rs`) — zintegrowane.

## Zakres (GOAL)
Port do Rust fazy dyplomacji tury z web `runDiplomacyTurnTick` (`gra/src/main.ts` ~l.23101–23205, wołane ~36618, oraz ~10959–11069, 11004, 11115): brake AI↔AI (`diplomacy_tick_war_brake`), licznik kryzysu (`advance_crisis_counter` na ≥3 parach), dobra wola (`dobra_wola_turn_step`), sortowanie kolejki kryzysu, wybór deklarującego wojnę, `ai_ai_pairs`. Plus dyplomacja AI w turze: blokady akcji (`resolve_diplomacy_action_lock`), brama oblężenia, cooldown odrzuceń (3 tury, osobny klucz `miasto_za_pokoj`), oferty miasta za pokój.
Moduły istniejące w Rust, które należy WYKORZYSTAĆ (nie duplikować): `diplomacy_tick_war_brake.rs`, `diplomacy.rs` (`tick_pair`), `diplomacy_locks.rs`, `diplomacy_siege_war_gate.rs`, `diplomacy_rejection_cooldown.rs`, `ai_peace_city_offer.rs`, `war_turn_state.rs`, `war_world_view.rs`.
Nowy plik: `rust-port/engine/src/domain/ai_diplomacy_turn.rs` (plan: ~586 LOC; partia ≤600 LOC, dziel testy).

## Wymóg: BEZ martwego kodu
- Funkcje muszą mieć test BEHAWIORALNY na wektorach weba (wektory `23101–23205`, `11115`, `19371/19749/40413`), nie tylko test kompilacji.
- Podpięcie do pętli tury Rust NIE jest w tym temacie: plan przypisuje je do W8 (ostatnia partia). Musisz to jawnie zapisać w raporcie jako zależność do W8, nie jako ukryty brak.
- Jeżeli brakuje wejścia z `WorldState` do wywołania — dodaj adapter w pliku tematu, nie zmieniaj cudzych modułów poza allowlistą.

## Allowlista (naruszenie = FAIL)
- `rust-port/engine/src/domain/ai_diplomacy_turn.rs` (nowy)
- `rust-port/engine/src/domain/mod.rs` (tylko dopisanie `pub mod ai_diplomacy_turn;`)
- `rust-port/engine/tests/p6_wire_war_diplo.rs` (nowy) + ewentualnie `tests/p6_wire_war_diplo_*.rs`
- `rust-port/engine/tests/p6_wire_war_diplo_vectors/*` oraz `p6_wire_war_diplo_gen.mjs` (generator wektorów)
- `dyspozycje/rust-port/p6/P6-WIRE-WAR-DIPLO-TURN*.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1/**`
- ZAKAZ: `gra/**`, `origin/main`, `WERSJE.md`, `rust-port/engine/Cargo.toml`, `REJESTR-PROSB-I-ZADAN.md`, `rust-port/engine/src/domain/*` poza powyższymi plikami. `Cargo.lock` NIE commitować.

## Bramki (surowe logi i EXIT)
- `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `cargo test --test p6_wire_war_diplo` (+ testy sąsiednie `p6_wire_war_*`).
- Zmienne: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` POZA repo (np. `/home/user/target-w6`), usuń po bramkach.
- Polecenia > 120 s: w tle z logiem; NIE_ZMIERZONO, jeśli nie skończono.

## Kryteria końca (binarne)
1. Każda funkcja z GOAL ma test na wektorach weba; wektory z pinu `07d2fbd72f758705f8e1d59cc4968027ffbafe75`.
2. Brak zmian poza allowlistą; brak `#[ignore]`; brak osłabionych asercji.
3. Bramki zielone albo NIE_ZMIERZONO uczciwie.
4. Raport: SHA commita, pin, LOC (`wc -l`), zależność do W8 jako jawna.

## Format raportu
STATUS / DOMAIN: GAME / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY: 1/5 / NASTĘPNY KROK: Evaluator / DEPLOY-PUSH: NIE WYKONANO
Zapisz `01-operator-r1.md` w `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1/` i zacommituj na gałęzi kodu (nie na `claude/rust-sivvrn`).
