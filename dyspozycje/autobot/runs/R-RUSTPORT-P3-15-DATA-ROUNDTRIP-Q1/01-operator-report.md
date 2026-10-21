STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-15-DATA-ROUNDTRIP-Q1
GOAL: Domknąć lukę P3.11 — round-trip 1:1 (typed -> serde_json::Value == surowy JSON) dla WSZYSTKICH 29 plików rust-port/engine/data/*.json; wykryć pola gubione cicho i zamknąć je tam, gdzie bezpieczne.
ZMIANY/COMMIT: baza origin/rust-port/parity-v2 = aa7b225b (potwierdzone). Commit lokalny w worktree (detached), BEZ push. Allowlista: src/data/{buildings_tech,economy_society,economy_society_part2,terrain_map,units_combat}.rs (Serialize; deny_unknown_fields w 3 modułach, 80 struktur), tests/data_compliance.rs (dopisane testy round-trip; reformat rustfmt istniejących linii), dyspozycje/rust-port/p3/P3-15-DATA-ROUNDTRIP.md (nowy, z surowymi logami), ten raport. Poza allowlistą nic nie zmieniono; Cargo.lock nie dodany.
TESTY: baseline cargo test --offline = 292 passed (EXIT=0, przed zmianami). Po zmianach = 322 passed, 0 failed, EXIT=0 (+30: 29 round-trip + 1 test pokrycia). Lista nazw testów baseline ⊆ final (0 usuniętych). Round-trip 29/29 zielone, 0 błędów, bez #[ignore]. rustfmt --check exit 0 na wszystkich zmienionych plikach. Surowe logi: P3-15-DATA-ROUNDTRIP.md §6.
BLOKADY: brak blokad kryterium. Ustalenia do oceny: (1) N1 — Option bez klucza w raw emituje null (277 w buildings, 375 w terrain-improvements itd.); traktowane jako równoważne zgodnie z doc-komentarzem buildings_tech.rs, nie naprawiane (surowe pliki mają jawne null). (2) N2 — f64 vs integer (np. units 52, terrain-improvements 21); ta sama wartość, bez zmiany typów. (3) tests/data_compliance.rs sformatowany całym plikiem (+609/−45, tylko layout). (4) Współdzielony CARGO_TARGET_DIR dawał stale artefakty; pomiary w /home/user/cargo-target-shared/wf_74ebccc7-56b-1.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Haiku 5.5) — weryfikacja surowych logów w P3-15-DATA-ROUNDTRIP.md §6 i commita; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
