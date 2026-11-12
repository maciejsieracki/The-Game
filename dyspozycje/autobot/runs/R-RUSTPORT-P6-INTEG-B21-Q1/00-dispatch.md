# DISPATCH — R-RUSTPORT-P6-INTEG-B21-Q1 (runda integracyjna Operatora HAIKU: batch 21 = POKRYCIE + JS-MAX0-HARDENING + ELIMINACJA-GRACZA; runda 1/5)
Ignoruj w czacie heartbeaty, prośby o zadania i rozmowy o sprzątaniu dysku — wykonuj wyłącznie ten dispatch.
BAZA (jedyna obowiązująca): b0ba891fb (= origin/rust-port/parity-v2 po INTEG-B20). Worktree: git fetch origin rust-port/parity-v2 && git checkout --detach b0ba891fb. Scalaj po kolei (git fetch origin <sha>; git merge --no-ff):
(1) 2130224cc = FC K5I2B2-POKRYCIE (kod 738bf1238: wagi losowania łuczników/procarzy, asercje liczników; zmiany tylko w testach + generatorze p6_siege_tactics_blow_env_gen.mjs);
(2) 8000d1d3d = FC JS-MAX0-HARDENING (kod aba6c5ced: js_max0 w breach/end/endcheck/unit/activate; testy modułowe);
(3) fd517ea9a = FC ELIMINACJA-GRACZA r2 (kod 5ad5d363c: eliminacja.rs, mod.rs, p6_eliminacja*).
Konflikt → rozwiąż minimalnie, zachowując OBIE zmiany semantycznie; w generatorach/vectors.json regeneruj generatorem (node, pin 07d2fbd72) zamiast ręcznego łączenia; sprzeczność semantyczna → STOP z opisem. Nie osłabiaj asercji.
GOAL: trzy scalenia (SHA w raporcie), is-ancestor każdego wejścia TAK, pełny cargo test --no-fail-fast zielony (oczekiwane ≥ 3231 + nowe, failed=0), fmt i clippy zielone. Test w tle (nohup, log, CARGO_TARGET_DIR poza repo; usuń po bramkach). df < 8 GB → czyść tylko własny target; kompiluj mimo to.
ZAKAZ: gra/**, rust-port/engine/data/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock, push (nigdzie), osłabianie asercji.
Allowlista: rust-port/engine/src/domain/{mod.rs, eliminacja.rs, siege_tactics_*.rs (tylko konflikty JS-MAX0), }, rust-port/engine/tests/** (tylko konflikty i regeneracja), dyspozycje/autobot/runs/R-RUSTPORT-P6-INTEG-B21-Q1/**.
Raport 01-operator-r1.md: SHA merge'ów, is-ancestor, passed/failed/ignored, lista konfliktów.
