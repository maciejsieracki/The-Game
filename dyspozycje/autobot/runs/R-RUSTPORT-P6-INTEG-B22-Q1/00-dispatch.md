# DISPATCH — R-RUSTPORT-P6-INTEG-B22-Q1 (runda integracyjna Operatora HAIKU: batch 22 = RANGED-CLEANUP + JS0-REST + ELIMINACJA-DEALS + TOWER-TARGET + DIR-CONST-ENUM; runda 1/5)
Ignoruj w czacie heartbeaty, prośby o zadania i rozmowy o sprzątaniu dysku — wykonuj wyłącznie ten dispatch.
BAZA (jedyna obowiązująca): cf281d785 (= origin/rust-port/parity-v2 po INTEG-B21). Worktree: git fetch origin rust-port/parity-v2 && git checkout --detach cf281d785. Scalaj po kolei (git fetch origin <sha>; git merge --no-ff):
(1) 182d298ef = FC RANGED-DAMAGE-CLEANUP (kod 1943362b8; combat.rs, unit_power.rs, testy repin/ranged; zmiana typu damage na f64);
(2) 621e7338f = FC JS0-REST (kod 1fe2e36c3; okolica.rs, turn_economy_loop.rs, p6_js_max0_rest*);
(3) 5db1f2845 = FC ELIMINACJA-DEALS-Q2 (kod d81d79704; eliminacja.rs, war_turn_state.rs, diplomacy.rs, p6_eliminacja*) — ZNANY KONFLIKT z B21 w eliminacja.rs/mod.rs: zachowaj obie zmiany (B21: wejście eliminacji + komentarz; DEALS: czyszczenia), nie osłabiaj asercji;
(4) fe3ceae3e = FC TOWER-TARGET (kod b2e284cf1; siege_tactics_tower.rs, p6_tower_target*);
(5) 01c9db8e4 = FC DIR-CONST-ENUM (kod 01c9db8e4; p6_siege_tactics_loop_body_gen.mjs, pin test z selftestem node/git pina).
Konflikt → rozwiąż minimalnie, zachowując OBIE zmiany semantycznie; w generatorach/vectors.json regeneruj generatorem (node, pin 07d2fbd72). Sprzeczność semantyczna → STOP z opisem. Nie osłabiaj asercji.
GOAL: pięć scaleń (SHA w raporcie), is-ancestor każdego wejścia TAK, fmt i clippy -D warnings zielone (EXIT zapisany), pełny cargo test --no-fail-fast (oczekiwane ≥ 3243 + nowe, failed=0, ignored=1), raport 01-operator-r1.md z liczbami i SHA — zapisz i zacommituj (bez nazwy modelu, linia Claude-Session).
Test w tle (nohup, log, CARGO_TARGET_DIR poza repo; usuń po bramkach). df < 8 GB → czyść tylko własny target; kompiluj mimo to.
ZAKAZ: gra/**, rust-port/engine/data/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock, push (nigdzie), osłabianie asercji. Nie wpinaj nowych funkcji do pętli bitwy (ProdBody/SiegeLoop, eliminate_owner do tur).
Allowlista: rust-port/engine/src/domain/{mod.rs, combat.rs, unit_power.rs, okolica.rs, turn_economy_loop.rs, eliminacja.rs, war_turn_state.rs, diplomacy.rs, siege_tactics_tower.rs} (tylko konflikty), rust-port/engine/tests/** (tylko konflikty i regeneracja), dyspozycje/autobot/runs/R-RUSTPORT-P6-INTEG-B22-Q1/**.
