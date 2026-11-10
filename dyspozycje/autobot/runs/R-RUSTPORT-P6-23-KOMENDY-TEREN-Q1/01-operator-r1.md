STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-23-KOMENDY-TEREN-Q1
GOAL: Port P6.2 (order.ts = Porzadek) i P6.3 (terrain-improvements.ts, city-hex-movement.ts, fort-territory.ts) do Rust 1:1 z wektorami z uruchomionego weba, tabelami data/derived/*.json i niezaleznym weryfikatorem Python.
ZMIANY/COMMIT: allowlista - src/domain/{types,improvements,pathfinding,terrain,mod}.rs, src/data/derived.rs, data/derived/{porzadek-params,ulepszenia-reguly,teren-ruch-reguly}.json, tests/p6_23_*.rs, tests/p6_23_vectors/**, dyspozycje/rust-port/p6/P6-23-KOMENDY-TEREN.md, dyspozycje/autobot/runs/R-RUSTPORT-P6-23-KOMENDY-TEREN-Q1/**. SHA: patrz git log worktree (jeden commit Operatora, bez push).
TESTY: fmt EXIT=0; clippy --all-targets -D warnings EXIT=0; cargo test EXIT=0 (461 passed = 428 + 33 nowych); weryfikator Python 16242 porownan, 0 rozbieznosci; 8 mutacji kodu/tabel czerwieni testy. Logi: gate-*-r1.log, dowody/.
BLOKADY: brak. Uwagi: (1) order.ts to Porzadek, nie kolejka rozkazow (ZALOZENIE 1 dokumentu); czesc "walidacja komend/transakcyjnosc" nie ma odpowiednika w order.ts -> RUNDA-2/poza zakresem plikow; (2) `pub use types::porzadek;` w mod.rs (jedyne odstepstwo od "tylko deklaracje"); (3) 2 symbole PORTOWANY-Z-WYJATKIEM (klucze prototypu JS).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Haiku 5.5 medium) - weryfikacja niezalezna; Obrona/Final Control.
DEPLOY/PUSH: NIE WYKONANO
