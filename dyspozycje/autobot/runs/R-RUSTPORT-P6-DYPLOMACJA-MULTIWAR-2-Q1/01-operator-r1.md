STATUS: PASS-WITH-NOTES (partia A z 7 partii; reszta NIE wykonana w rundzie 1/5)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1
GOAL: Port 1:1 z webem origin/main 5dd53e60f (FALA 546–547) — zakres A–F z dispatchu. Ta runda: część A (ERADELAY/ERAIGN) + wektory z uruchomionego weba.
BAZA: origin/rust-port/parity-v2 9e6d26c4b (detached). Zmiany tylko w allowliście.
ZMIANY/COMMIT:
- be9927351 — `rust-port/engine/src/domain/diplomacy_multiwar_gate.rs` (ForcedEraTag, is_era_forced_war_ignoring_r1, is_war_treaty_blocked, ERA_FORCED_WAR_START_TURNS_*, pole era_tag w evaluate_inter_civ_war_gate), `tests/p6_dyplo_multiwar_interciv.rs` (era_tag w literałach), nowe `tests/p6_dyplo_multiwar2_eraign.rs`, nowe wektory `tests/p6_dyplo_multiwar_gates_data/eraign.json` (183 wpisy z uruchomionego weba, Node 22).
- Commit 2 (ten raport + dokumenty): `dyspozycje/rust-port/p6/P6-DYPLOMACJA-MULTIWAR-2.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1/` (raport, generator, patch importu). SHA: patrz git log gałęzi po tym commicie.
- Zero zmian w gra/**, WERSJE.md, save_load.rs, Cargo.toml, renderer, src-tauri, data/.
TESTY:
- cargo fmt --check: OK
- cargo clippy --all-targets -- -D warnings: OK (0 ostrzeżeń)
- cargo test --lib: 22 passed, 0 failed
- p6_dyplo_multiwar2_eraign: 3 passed (wektory 183/183 zgodne z webem; N-1/N/N+1/NaN; sojusz-only dla wojny epoki)
- p6_dyplo_multiwar_interciv: 2 passed (wektory 23 bez zmian)
- Baseline pełnego `cargo test` parity-v2: NIE_ZMIERZONO (dysk; 0 nowych #[ignore]: TAK)
- Mutacje ≥85%: NIE_ZMIERZONO
BLOKADY:
- (B) war-weariness (runWarWearinessTick) — NIE ZROBIONE
- (C) forced-peace AI↔AI (registerAiPeaceRequest, isForcedPeaceDue, decideAiPeaceRequest, runAiAiPeaceTick) — NIE ZROBIONE
- (D) diplomacy-siege-war-gate.ts — NIE ZROBIONE
- (E) diplomacy-locks.ts case'y poza '2' — NIE ZROBIONE
- (F) REPIN modułów wobec origin/main — diff NIE_ZMIERZONO
- Timer ERADELAY (forced-war-bronze/iron: start po 20 turach od wejścia w epokę) — brak modułu forced_war_* w Rust
- Wywołanie isWarTreatyBlocked w ścieżce wypowiedzenia wojny — brak w Rust
- Dysk: 3,9 GB wolnego po buildzie (próg 1,5 GB nie naruszony)
RUNDY: 1/5 (ostatni werdykt: brak; decyzja wymagana: nie)
NASTĘPNY KROK: runda 2 (dopisek w 00-dispatch.md) — partia B (war-weariness), potem C, D, E, F; po każdej partii commit i bramki jak wyżej.
DEPLOY/PUSH: NIE WYKONANO (push nie wykonywany przez Operatora; worktree zostaje do review orkiestratora)
