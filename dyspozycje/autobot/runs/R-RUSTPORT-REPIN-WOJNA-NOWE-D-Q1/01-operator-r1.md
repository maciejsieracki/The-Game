STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-NOWE-D-Q1
GOAL: Port gra/src/game/warAllInCapital.ts (pin dc8a3adc, 859 linii) do rust-port/engine, partia 1 (symbole pure + planer bez W1/W2).
ZMIANY/COMMIT: commit 47110d3c0 (baza origin/rust-port/parity-v2 = a83ae51d6). Allowlista: rust-port/engine/src/domain/mod.rs (dopisek pub mod x2), war_all_in_capital.rs, war_all_in_capital_nav.rs, war_all_in_capital_plan.rs, war_all_in_capital_params.json (NOWE, poza data/ -- patrz ZALOZENIA), tests/p6_repin_wojna_d_nav.rs (NOWY), dyspozycje/rust-port/p6/P6-REPIN-WOJNA-NOWE-D.md, runs/R-RUSTPORT-REPIN-WOJNA-NOWE-D-Q1/**. Zero zmian w gra/**, renderer, src-tauri, Cargo.toml, WERSJE.md. Push: NIE.
TESTY: cargo fmt --all -- --check: czysty. cargo clippy --all-targets -- -D warnings: czysty (evidence/r1-clippy.log). cargo test --no-fail-fast: 1680 passed / 0 failed (baseline 1666/0; +14 nowych w p6_repin_wojna_d_nav) (evidence/r1-cargo-test.log). git diff --check: czysty.
BLOKADY: (1) W1/W2 (pickEngagementArmy, allocateGroupsToEnemies, engageGoal, filtr celow W2) nieportowane -- zaleznosc war-rules-multiwar.ts bez portu. (2) JSON parametrow w src/domain/ a nie data/: testy data_loader.rs (DATA_FILES) i data_compliance.rs (probe, 29) sa poza allowlista. (3) Wektory z uruchomionego weba dc8a3adc: NIE_ZMIERZONO (brak harnessu TS w tej rundzie). (4) Testy progow NaN/N-1/N/N+1, mutacje galezi sterujacych: NIE_ZMIERZONO w tej rundzie. (5) WarAllInContext i podpiecie w ai.ts/barbarians.ts/main.ts: poza zakresem.
RUNDY: 1/5
NASTEPNY KROK: Partia 2 -- port war-rules-multiwar (pickEngagementArmy, allocateGroupsToEnemies) i galezi W1/W2 w planerze; wektory z weba dc8a3adc + testy progow i mutacje; decyzja o przeniesieniu JSON do data/ wymaga rozszerzenia allowlisty.
DEPLOY/PUSH: NIE WYKONANO
