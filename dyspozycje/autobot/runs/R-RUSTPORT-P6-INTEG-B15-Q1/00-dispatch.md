# DISPATCH — R-RUSTPORT-P6-INTEG-B15-Q1 (krótka runda integracyjna Operatora HAIKU: batch 15 = NFD-CCC + KLASY-WIRE; runda 1/5)
Ignoruj w czacie heartbeaty i rozmowy o sprzątaniu dysku — wykonuj wyłącznie ten dispatch.
BAZA (jedyna obowiązująca): 465e9dd95 (= origin/rust-port/parity-v2 po INTEG-B14C). Worktree: git fetch origin rust-port/parity-v2 && git checkout --detach 465e9dd95. Scalaj po kolei (git fetch origin <ref>; git merge --no-ff):
(1) rust-port-wip/NFDCCC-fc = e6a815d53 (kod c25fd6edf; normTerrain: kanoniczne uporządkowanie ccc; zmienia siege_tactics_inputs_terrain.rs i jego testy);
(2) rust-port-wip/KLASYWIRE-fc = 3d7ed90f7 (kod cb9db56ba, obrona 0a86341d5; nowy moduł siege_tactics_class_adapters.rs + test; mod.rs +1 linia).
Oba stoją bezpośrednio na 465e9dd95; merge-tree czysty (konfliktów nie oczekuję).
GOAL: dwa scalenia na gałęzi wip (SHA w raporcie), is-ancestor każdego wejścia → TAK, pełny cargo test --no-fail-fast zielony. Kryteria: (1) dwa merge'e; (2) pełny cargo test: passed/failed/ignored w raporcie (oczekiwane ≥ 3128 + nowe, failed=0) — w tle (nohup, log, stabilny CARGO_TARGET_DIR poza repo, NIE usuwaj do końca; p6_8i_pick trwa kilka minut — normalne); (3) fmt/clippy zielone.
Allowlista: rust-port/engine/src/domain/mod.rs (tylko jeśli konflikt), dyspozycje/autobot/runs/R-RUSTPORT-P6-INTEG-B15-Q1/**. ZAKAZ: gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock, push (nigdzie), osłabianie asercji, rust-port/engine/data/**.
Bramki (EXIT zapisany): cargo fmt --check (w rust-port/engine); cargo clippy --all-targets -- -D warnings; cargo test --lib; pełny cargo test --no-fail-fast. df ≥ 8 GB (jeśli niższe — czyść tylko własny target). Env: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0. Raport 01-operator-r1.md.
