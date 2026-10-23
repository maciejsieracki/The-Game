STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M12-KLASTRY-COMPUTE-SPAWN-PLAN-Q1
GOAL: port `computeClusters` (clusters.ts:3373-4250) i `buildClusterSpawnPlan` (cluster-spawn.ts:54-69, 166-188, 210-445) do Rust z parytetem do uruchomionego weba (pin edb8fb56)
ZMIANY/COMMIT: `cluster_compute.rs`, `derived.rs` (dopisek na koncu), `data/derived/mapgen-cluster-compute.json`, `tests/p6_m12_{compute,spawn,tables,integration}.rs`, `tests/p6_m12_vectors/**`, `dyspozycje/rust-port/p6/P6-M12-KLASTRY-COMPUTE-SPAWN-PLAN.md`, run dir; SHA: patrz commit w worktree (bez push)
TESTY: fmt EXIT=0; clippy --all-targets -D warnings EXIT=0; cargo test --no-fail-fast EXIT=0, 1010 passed / 0 failed (982 baza + 28 nowych); wektory z weba: 46 map, 654 compute, 372 spawn (21+3 rzuca - blad diagnostycznego logu weba odtworzony); weryfikator Python 55109 sprawdzen, 0 rozbieznosci (negatyw: 3, EXIT=1); pokrycie V8 699/776 i 182/204; mutacje 64: 45 wykrytych, 2 oczekiwane, 17 przezylo nieoczekiwanie (opis i podzial przyczyn w doc §7)
BLOKADY: brak blokad technicznych; luka wektorow (17 mutacji) do oceny Evaluatora; blad weba (rzut w logu diagnostycznym) wymaga decyzji orkiestratora o parytecie vs naprawie (doc §9.2 pkt 6)
RUNDY: 1/5
NASTEPNY KROK: Evaluator (ta sama ID); potem Final Control; w dalszej kolejnosci zasilenie `build_cluster_start_plan` wynikiem Rust (doc §10)
DEPLOY/PUSH: NIE WYKONANO
