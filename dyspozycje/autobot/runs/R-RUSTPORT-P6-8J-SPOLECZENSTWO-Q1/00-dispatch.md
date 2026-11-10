STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1
GOAL: P6.8J — tematu wykonawczy z podziału `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` (docs-branch / `parity-v2`). Treść poniżej skopiowana z §9; lista symboli z §11 (wiersze `8J-P*`), partie ≤600 LOC na granicy symbolu, commit po każdej partii, KOD PIERWSZY, brak „budżetu czasu" jako blokady. Wektory z URUCHOMIONEGO weba 91dc998a (pliki ≤ 10 MB), testy NaN/progów/brakujących kluczy, mutacje na każdej gałęzi sterującej lub dowód równoważności z kodu, niezależny weryfikator. Aktualny HEAD: `git fetch origin rust-port/parity-v2`.
- **GOAL:** `society-breakdown.ts` (1172 LOC, 36 fn; w tym nowy `applyCivMatrixHappinessModifier`, rebel owner `-99`).
- **ALLOWLISTA: wg treści GOAL powyżej (pole ALLOWLISTA z §9); dokument tematu i `dyspozycje/autobot/runs/R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1/**`. Zero zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. IZOLACJA: worktree; commit z jawnym `git add`, PUSH NIE. FAIL → ten sam ID, limit 5 rund.

RUNDA: 2/5

## Runda 2 — stan wejściowy (orkiestrator)
- Start: `git checkout --detach 56f43f84` (lokalny ref `refs/keep/P68J-r2wip`; zawiera partię 1 `3f01bfd5` i partię 2: `society_breakdown/{breakdown,order}.rs`, `tests/p6_8j_order.rs`, wektory z sekcją `order`).
- Zrobione i NIEWERYFIKOWANE do końca: pełny `cargo test --no-fail-fast` (nieukończony, ENOSPC), mutacje (żadne), ponowny test po poprawce clippy/fmt.
- Do zrobienia: pełny suite + clippy + fmt z logami i EXIT, mutacje na gałęziach sterujących (`pickOsiedlePopBonus`, `maxFromEraTable`, `popScaleMultiplier`, `luksus`, `pctFromNetto`, `resolvePalacTier`, pasma `porPctBand`…, `applyCivMatrixHappinessModifier`), niezależny weryfikator, `podzialLuksus` (TS:667) — potwierdzić pokrycie, dokument tematu z tabelą symboli.
- Decyzje orkiestratora: Z-8J-2 `applyCivMatrixHappinessModifier` — PORTOWAĆ (jest w pinie). Z-8J-6 pliki >600 LOC — podział na moduły jak w 56f43f84 jest zaakceptowany.
- DYSK: po każdym etapie `rm -rf rust-port/engine/target`; używaj `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`; NIE trzymaj kopii weba poza `mktemp -d` i usuń po użyciu.
