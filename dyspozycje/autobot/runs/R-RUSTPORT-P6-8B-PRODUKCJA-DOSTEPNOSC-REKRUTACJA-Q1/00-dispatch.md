STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1
GOAL: P6.8B — tematu wykonawczy z podziału `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` (docs-branch / `parity-v2`). Treść poniżej skopiowana z §9; lista symboli z §11 (wiersze `8B-P*`), partie ≤600 LOC na granicy symbolu, commit po każdej partii, KOD PIERWSZY, brak „budżetu czasu" jako blokady. Wektory z URUCHOMIONEGO weba 91dc998a (pliki ≤ 10 MB), testy NaN/progów/brakujących kluczy, mutacje na każdej gałęzi sterującej lub dowód równoważności z kodu, niezależny weryfikator. Aktualny HEAD: `git fetch origin rust-port/parity-v2`.
- **GOAL:** `production.ts` 682–1252 i 1977–2541: `unitStockShortfallLabel`, `availableProduction`, `availableReplacementsFor`, rekrutacja (`enqueueRecruitment`, `advanceRecruitmentGated`, `advanceRecruitment`), `rushCost`/`rushProduction`, praca/podział (`splitPraca`, `previewPracaPoolBrutto`), `eraBuildingCatalog`, `splitOutput`, `cityScienceOutput`, `cityMoneyOutput`.
- **ALLOWLISTA: wg treści GOAL powyżej (pole ALLOWLISTA z §9); dokument tematu i `dyspozycje/autobot/runs/R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1/**`. Zero zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. IZOLACJA: worktree; commit z jawnym `git add`, PUSH NIE. FAIL → ten sam ID, limit 5 rund.

RUNDA: 3/5

## Runda 3 — stan wejściowy (orkiestrator)
- Baza: `git fetch origin rust-port/parity-v2` (>= `be924f64f`). P1a (production.ts 694–905) ZINTEGROWANE (`production_units.rs`, `tests/p6_8b_helpers_vectors.rs`, 1602/0, 48 mutantów zabitych / 8 równoważnych). Dokument tematu: `dyspozycje/rust-port/p6/P6-8B-PRODUKCJA-DOSTEPNOSC.md`.
- Zakres r3: P1b — `availableProduction` (923–1135), `availableReplacementsFor` (1136–1252), `setPaused`, `populationCostOf`/`UNIT_POPULATION_COST`, `manpowerCostOf`; potem, jeśli starczy: P2 część 1 (enqueue/dequeueRecruitment, advanceRecruitmentGated). Partie ≤600 LOC, commit po każdej, wektory z uruchomionego weba 91dc998a, testy NaN/progów/kluczy, mutacje (skrypt z ścieżkami względnymi, rozróżnienie błędu kompilacji od zabicia), aktualizacja tabeli symboli w dokumencie tematu.
- Przed P2: potwierdź, że B3 nie ma otwartego `recruitment.rs` (doc §4).
- Uwaga: `git diff --check` czysty (bez pustych linii na końcu plików dowodów).
- DYSK: `rm -rf rust-port/engine/target` po etapie; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0.
