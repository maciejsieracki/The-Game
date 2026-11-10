STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8E-UTRZYMANIE-EKONOMII-Q1
GOAL: P6.8E — tematu wykonawczy z podziału `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` (docs-branch / `parity-v2`). Treść poniżej skopiowana z §9; lista symboli z §11 (wiersze `8E-P*`), partie ≤600 LOC na granicy symbolu, commit po każdej partii, KOD PIERWSZY, brak „budżetu czasu" jako blokady. Wektory z URUCHOMIONEGO weba 91dc998a (pliki ≤ 10 MB), testy NaN/progów/brakujących kluczy, mutacje na każdej gałęzi sterującej lub dowód równoważności z kodu, niezależny weryfikator. Aktualny HEAD: `git fetch origin rust-port/parity-v2`.
- **GOAL:** `economy-upkeep.ts` (1174 LOC, 42 fn), partie `8E-P1` (34 sym.) i `8E-P2` (37 sym.).
- **ALLOWLISTA: wg treści GOAL powyżej (pole ALLOWLISTA z §9); dokument tematu i `dyspozycje/autobot/runs/R-RUSTPORT-P6-8E-UTRZYMANIE-EKONOMII-Q1/**`. Zero zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. IZOLACJA: worktree; commit z jawnym `git add`, PUSH NIE. FAIL → ten sam ID, limit 5 rund.

RUNDA: 1/5

BAZA: `git fetch origin rust-port/parity-v2` (>= `1dd3c12c6`, 1815/0). Zależności zamknięte: 8A, 8B, 8B2, 8C (production), 8D (utrzymanie obywateli), 8F (`economy_city_fns.rs`: 23/23 symboli `economy.ts`), REPIN-EKONOMIA-D/D2 (`economy_yield.rs`, `work_tax.rs`). REUŻYWAJ istniejących symboli, nie portuj duplikatów (`git grep` przed portem).
KONTRAKT: logi bramek Z LINIĄ `EXIT=`, bez pustych linii na końcu plików (`git diff --check`), komparatory sortowania zgodne z V8 (NaN → Equal), mutacje na każdej gałęzi sterującej lub dowód równoważności plik:linia, wektory z uruchomionego pinu `91dc998a` (bundle esbuild w `mktemp -d`; zakaz buildu w `gra/`; fixture ≤ 6 MB), dokument tematu z tabelą symboli i statusem per symbol.
DYSK: `rm -rf rust-port/engine/target` po etapie; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; kopie weba tylko w mktemp -d i usuń.
