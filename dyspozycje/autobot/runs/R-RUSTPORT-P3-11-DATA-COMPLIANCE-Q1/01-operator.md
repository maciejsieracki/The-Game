STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-11-DATA-COMPLIANCE-Q1
GOAL: Testy zgodności danych Rust z pinem webowym edb8fb56 (liczba i ID cywilizacji, liczności kolekcji, 1:1 wszystkich plików gra/data/*.json przez moduły src/data/*) jako NOWY plik testowy.
ZMIANY/COMMIT: allowlista: rust-port/engine/tests/data_compliance.rs (NOWY); dyspozycje/rust-port/p3/P3-11-DATA-COMPLIANCE.md (NOWY); dyspozycje/autobot/runs/R-RUSTPORT-P3-11-DATA-COMPLIANCE-Q1/** (NOWY). Commit: patrz SHA w odpowiedzi (worktree, bez push). Brak zmian w src/**, Cargo.toml, istniejących testach, gra/**.
TESTY:
- Baseline (przed zmianą, 1d53dcdb): cargo test --offline EXIT=0, 256 passed, 0 failed.
- Po zmianie: cargo test --offline EXIT=0, 265 passed, 0 failed, 0 ignored (+9). data_compliance: 9 passed, 0 failed.
- Logi: 00-cargo-test-baseline.log, 01-cargo-test-after.log (w tym katalogu).
- Hash: 29/29 plików JSON w rust-port/engine/data == blob SHA na edb8fb56 gra/data (git ls-tree oraz git hash-object).
- git diff --check: do uzupełnienia przez Final Control po commicie (patrz sekcja poniżej).
BLOKADY:
1. LUKA (nie błąd testu): 1:1 round-trip (typed -> Value == raw) możliwy tylko dla 7 plików cywilizacji (Serialize w civilizations.rs; pokryte w data_civilizations.rs). Pozostałe 22 struktury mają wyłącznie Deserialize; zmiana wymaga src/data/** (poza allowlistą). Dla buildings_tech.rs, economy_society*.rs (bez deny_unknown_fields) nieznane klucze są cicho gubione i nie są sprawdzane.
2. Rozbieżność dispatchu: plików JSON w gra/data na pinie jest 29 (nie 27). Potwierdza P1-12-DATA-CATALOG.md (30 pozycji = 29 json + png).
3. Brak #[ignore] — nie napisano testu, który wymagałby ignorowania.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Haiku 5.5) weryfikuje allowlistę, logi i hash; Final Control ocenia lukę 1:1 (punkt 1 BLOKADY) i czy wystarcza do PASS. Integracja i push: krok orkiestratora po Final Control.
DEPLOY/PUSH: NIE WYKONANO
