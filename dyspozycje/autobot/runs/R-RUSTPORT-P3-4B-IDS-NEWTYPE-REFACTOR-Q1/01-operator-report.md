STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-4B-IDS-NEWTYPE-REFACTOR-Q1
GOAL: newtypy UnitId/PlayerId w PlayablePlayer.id, CombatUnit.id, AiUnit.id, BarbUnit.id (runda 2, allowlista rozszerzona).
ZMIANY/COMMIT: 6 plików kodu (bridge.rs konwersje ID, tests/combat.rs import, barbarians.rs, ai_turn.rs, playable.rs, combat.rs) + dokument dyspozycje/rust-port/p3/P3-4B-IDS-NEWTYPE-REFACTOR.md; commit lokalny w worktree, bez push. Szczegóły: dyspozycje/rust-port/p3/P3-4B-IDS-NEWTYPE-REFACTOR.md
TESTY: cargo check --all-targets: 0 błędów/ostrzeżeń. cargo test: 256 passed, 0 failed, EXIT=0 (baseline rundy 1: 256/256). Surowy log w dokumencie docelowym.
BLOKADY: brak. Odstępstwo: import UnitId w ai_turn.rs przez civ_engine::domain (ai_turn.rs ładowany wyłącznie przez #[path]); tests/terrain_movement_fix.rs nietknięty.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (weryfikacja diff + logu) -> Final Control
DEPLOY/PUSH: NIE WYKONANO
