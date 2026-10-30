STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8C-PRODUKCJA-KOLEJKA-Q1
GOAL: P6.8C — tematu wykonawczy z podziału `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` (docs-branch / `parity-v2`). Treść poniżej skopiowana z §9; lista symboli z §11 (wiersze `8C-P*`), partie ≤600 LOC na granicy symbolu, commit po każdej partii, KOD PIERWSZY, brak „budżetu czasu" jako blokady. Wektory z URUCHOMIONEGO weba 91dc998a (pliki ≤ 10 MB), testy NaN/progów/brakujących kluczy, mutacje na każdej gałęzi sterującej lub dowód równoważności z kodu, niezależny weryfikator. Aktualny HEAD: `git fetch origin rust-port/parity-v2`.
- **GOAL:** `production.ts` 1253–1976: `frontItem`, `etaTurns`, `buildingWorkPerTurn`, `unitRecruitmentCapacityPerTurn`, `enqueue`, `forfeitedProgressForIndex`, `bank*`, `sanitizeBuildQueue`, `dropFrontItem`, `dequeue`, `filterQueue`, `promoteToFront`, `insertAtFront`, `advanceProduction`.
- **ALLOWLISTA: wg treści GOAL powyżej (pole ALLOWLISTA z §9); dokument tematu i `dyspozycje/autobot/runs/R-RUSTPORT-P6-8C-PRODUKCJA-KOLEJKA-Q1/**`. Zero zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. IZOLACJA: worktree; commit z jawnym `git add`, PUSH NIE. FAIL → ten sam ID, limit 5 rund.

RUNDA: 1/5

DYSK: po każdym etapie `rm -rf rust-port/engine/target`; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; kopie weba tylko w mktemp -d i usuń.
