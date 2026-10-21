STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-5B-DATA-UNITS-COMBAT-Q1
GOAL: 6 plikow JSON jednostek/walki z gra/data (pin edb8fb56) jako struktury serde 1:1, include_str!, test parsowania ze spot-checkami.
ZMIANY/COMMIT: 6 kopii JSON (rust-port/engine/data/, SHA-256 zgodne z manifestem), rust-port/engine/src/data/units_combat.rs (NOWY), rust-port/engine/tests/data_units_combat.rs (NOWY), dyspozycje/rust-port/p3/P3-5B-DATA-UNITS-COMBAT.md (NOWY), ten plik. Zero zmian w istniejacych .rs, Cargo.toml, gra/**. Commit w worktree, bez push.
TESTY: cargo test (rust-port/engine) exit 0, 0 warningow, 237 passed / 0 failed; w tym data_units_combat 6/6 (units 75 rekordow, counters 17, terrain-combat 7, spot-checki). Surowe logi: P3-5B-DATA-UNITS-COMBAT.md sekcja 6.
BLOKADY: brak. Baza uzyta: origin/rust-port/parity-v2 @ e72c74f7 (dispatch podawal 9e33fc77, starszy).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (weryfikacja logow cargo test i allowlisty), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
