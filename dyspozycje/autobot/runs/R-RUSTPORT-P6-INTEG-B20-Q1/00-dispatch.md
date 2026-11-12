# DISPATCH — R-RUSTPORT-P6-INTEG-B20-Q1 (runda integracyjna Operatora HAIKU: batch 20 = B19 + COMBAT-HARNESS r2 + K5LOOP-FACING + K5LOOP-KONTRATAK; runda 1/5)
Ignoruj w czacie heartbeaty, prośby o zadania i rozmowy o sprzątaniu dysku — wykonuj wyłącznie ten dispatch.
BAZA (jedyna obowiązująca): eda6aeaa9 (= origin/rust-port/parity-v2 po NIEPODPIETE-INDEKS, dokumenty). Worktree: git fetch origin rust-port/parity-v2 && git checkout --detach eda6aeaa9. Scalaj po kolei (git fetch origin <sha>; git merge --no-ff):
(1) a8210a4f2 = FC INTEG-B19 (kod: terytorium z fortami, wiarygodność wojny, ciało jednostki, długi ciosu; już rozwiązany konflikt unit_power.rs; rename TERRITORY_MIN_SEQ_INDEPENDENCE_CASES);
(2) 6a4a864dd = FC COMBAT-HARNESS r2 (obrona be4682480: ULP-граничne przypadki roll==hitPct, generator p6_combat_harness_gen.mjs);
(3) ee0e3970d = FC K5LOOP-FACING (facing i relative_hit w ProdBody, generator loop_body_gen.mjs);
(4) 039066ae1 = FC K5LOOP-KONTRATAK (kod bd4e4f63e — gałąź -obrona; _defenderCounters w ProdBody; UWAGA: NIE integruj gałęzi ...Q1 ze starszymi commitami 9a1386214/6f9f6a762).
Każde wejście: merge-tree na bieżącym HEAD czysty przed merge. Konflikt → rozwiąż minimalnie, zachowując OBIE zmiany semantycznie (wzorzec: B19 unit_power.rs); sprzeczność semantyczna → STOP z opisem; nie osłabiaj asercji. Konflikty w generatorach .mjs i vectors.json — regeneruj generatorem (node, pin 07d2fbd72) zamiast ręcznego łączenia.
GOAL: cztery scalenia (SHA w raporcie), is-ancestor każdego wejścia TAK, pełny cargo test --no-fail-fast zielony (oczekiwane ≥ 3225 + nowe, failed=0), fmt/clippy zielone. Pełny test w tle (nohup, log, CARGO_TARGET_DIR w worktree własnym, usuń po bramkach). df < 8 GB → czyść tylko własny target; kompiluj mimo to.
ZAKAZ: gra/**, rust-port/engine/data/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock, push (nigdzie), osłabianie asercji. Nie wpinaj ProdBody do SiegeLoop (to osobny temat po portach strzelca/OUTCOME).
Allowlista: rust-port/engine/src/domain/{mod.rs, siege_tactics_loop.rs, combat.rs, unit_power.rs (tylko konflikty)}, rust-port/engine/tests/** (tylko konflikty i regeneracja), dyspozycje/autobot/runs/R-RUSTPORT-P6-INTEG-B20-Q1/**.
Raport 01-operator-r1.md: SHA merge'ów, is-ancestor, dokładne wyniki testów (passed/failed/ignored), lista rozwiązanych konfliktów.
