STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-DLUG-CFGTEST-Q1
GOAL: Ocenić 3 moduły z cfg(not(test)) w zapisie (replay, save_load, zapis_loader); usunąć atrybut, jeśli zbędny, albo udokumentować w jednej linii, dlaczego jest potrzebny. Baza: origin/rust-port/parity-v2 = ca33abdd6.
ZMIANY/COMMIT: rust-port/engine/src/domain/mod.rs (+3 linie, tylko komentarze), commit 820e4ef16 na gałęzi rust-port-wip/R-RUSTPORT-DLUG-CFGTEST-Q1. Ocena: żaden z 3 atrybutów nie jest zbędny; wszystkie 3 pozostawione z jednolinijkowym uzasadnieniem.
  Wynik eksperymentu (usunięcie wszystkich 3 atrybutów naraz, potem przywrócenie):
  - replay.rs: błędy E0433/E0432 `civ_engine` (gałąź importów cfg(test) odwołuje się do civ_engine::, którego lib test nie ma). Atrybut potrzebny.
  - save_load.rs: błędy E0433/E0432 `civ_engine` oraz `crate::events`. Atrybut potrzebny.
  - zapis_loader.rs: E0432 unresolved import `super::save_load` (zależność od save_load, gdy ten jest bramkowany). Atrybut potrzebny.
  Allowlista: tylko domain/mod.rs. Nie dotykano gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock (Cargo.lock wygenerowany przez cargo został usunięty, nie zacommitowany). Nie pushowano.
TESTY:
  - cargo fmt --check: EXIT 0
  - cargo clippy --all-targets -- -D warnings (rust-port/engine): EXIT 0
  - cargo test --lib: EXIT 0, 28 passed, 0 failed
  Log: /tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/testlib.log
  CARGO_TARGET_DIR poza repo: /home/user/The-Game/.claude/worktrees/scratch-target-cfgtest (usunięty po bramkach).
  Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0.
  Uwaga: przed startem wolne miejsce na / wynosiło 7.1 GB (poniżej progu 8 GB dla nowego tematu Rust z CLAUDE.md §5). Temat zrealizowany, bo bramki są krótkie, a target poza repo został usunięty po bramkach.
BLOKADY: brak. Kryterium 1 (brak cfg(not(test)) bez uzasadnienia): spełnione, 3/3 z komentarzem. Kryterium 2 (bramki zielone): spełnione. Kryterium 3 (allowlista): spełnione.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (diff 820e4ef16 vs ca33abdd6, weryfikacja bramek i uzasadnień), potem Final Control. Integracja wyłącznie przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
