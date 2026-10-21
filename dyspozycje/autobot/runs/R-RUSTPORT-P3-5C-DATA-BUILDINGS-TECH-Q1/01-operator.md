STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-5C-DATA-BUILDINGS-TECH-Q1
GOAL: Przenieść 1:1 dane z gra/data/buildings.json, wonders.json, tech.json do struktur Rust z serde::Deserialize, embedded przez include_str!, parsowane w teście jednostkowym.
ZMIANY/COMMIT: allowlista: rust-port/engine/data/{buildings,wonders,tech}.json (kopie cmp-identyczne), rust-port/engine/src/data/buildings_tech.rs (nowy), rust-port/engine/tests/data_buildings_tech.rs (nowy), dyspozycje/rust-port/p3/P3-5C-DATA-BUILDINGS-TECH.md (nowy), ten plik. Brak zmian w lib.rs, domain/**, Cargo.toml, gra/**. Commit w worktree, bez push.
TESTY: cargo test --test data_buildings_tech (CARGO_PROFILE_DEV_DEBUG=0): 3 passed, 0 failed, exit 0. Pełny cargo test nie uruchomiony (dysk / pełny, brak miejsca). Surowy log w dokumencie P3-5C.
BLOKADY: (1) serde_json jest tylko dev-dependency; moduł kompiluje się przez #[path] w teście. Przy podpinaniu do lib trzeba przenieść serde_json do [dependencies]. (2) Dysk / pełny podczas pierwszej próby (ENOSPC w syn); usunięto tylko własny target. (3) Cargo.lock generowany lokalnie, nieobjęty allowlistą, nie commitowany.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator weryfikuje testy i spot-checki względem gra/data (pin edb8fb56) oraz allowlistę w worktree.
DEPLOY/PUSH: NIE WYKONANO
