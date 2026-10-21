STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-4C-IDS-REMAINING-Q1
GOAL: newtypy ID dla AiCity.id, PlayableCity.id, PlayableUnit.id; decyzje jawne dla BarbCamp.id, UnitCombatResult.id, unit_id/target_unit_id w komendach.
ZMIANY/COMMIT: rust-port/engine/src/domain/ai_turn.rs, rust-port/engine/src/domain/playable.rs, dyspozycje/rust-port/p3/P3-4C-IDS-REMAINING.md (SHA w logu gita po commicie)
TESTY: cargo test --offline: 256 passed, 0 failed, EXIT=0 (baseline 256); rustfmt --check czysty; cargo check --all-targets bez ostrzeżeń.
BLOKADY: brak (pominięcia opisane w P3-4C §1).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Haiku 5.5 medium)
DEPLOY/PUSH: NIE WYKONANO
