STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1
GOAL: P6.8F — tematu wykonawczy z podziału `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` (docs-branch / `parity-v2`). Treść poniżej skopiowana z §9; lista symboli z §11 (wiersze `8F-P*`), partie ≤600 LOC na granicy symbolu, commit po każdej partii, KOD PIERWSZY, brak „budżetu czasu" jako blokady. Wektory z URUCHOMIONEGO weba 91dc998a (pliki ≤ 10 MB), testy NaN/progów/brakujących kluczy, mutacje na każdej gałęzi sterującej lub dowód równoważności z kodu, niezależny weryfikator. Aktualny HEAD: `git fetch origin rust-port/parity-v2`.
- **GOAL:** `economy.ts` (1243 LOC, 23 fn) fn-po-fn, partie `8F-P1..P3`, po zamknięciu REPIN-D.
- **ALLOWLISTA: wg treści GOAL powyżej (pole ALLOWLISTA z §9); dokument tematu i `dyspozycje/autobot/runs/R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1/**`. Zero zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. IZOLACJA: worktree; commit z jawnym `git add`, PUSH NIE. FAIL → ten sam ID, limit 5 rund.

RUNDA: 1/5

BAZA: `git fetch origin rust-port/parity-v2` (>= `28f16d9da`, 1757/0). Zależności zamknięte: 8A, 8B, 8B2 (production), REPIN-EKONOMIA-D/D2 (`economy_yield.rs`: `city_yield_per_turn*`, `city_praca_integer`; `work_tax.rs`). REUŻYWAJ istniejących symboli, nie portuj duplikatów (`git grep` przed portem). Web: `origin/main` = `7164f7ca1`, pin wektorów 91dc998a/dc8a3adc bez zmian dla tych plików.
KONTRAKT: logi bramek Z LINIĄ `EXIT=`, bez pustych linii na końcu plików (`git diff --check`), komparatory sortowania zgodne z V8 (NaN → Equal), mutacje na każdej gałęzi sterującej lub dowód równoważności plik:linia, wektory z uruchomionego weba, dokument tematu z tabelą symboli i statusem.
DYSK: `rm -rf rust-port/engine/target` po etapie; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; kopie weba tylko w mktemp -d i usuń.
