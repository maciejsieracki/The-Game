STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-3D-B2-Q1
GOAL: REPIN-3D B2 i B3 z weba `origin/main` @ `86d510c66` przeniesione do `units::overlay` i `raster::atlas::keys`. B2 obejmuje `ringHex`/`normalizeRingHex`, klucz `civ:<civ>:<era>:<ring>` i `PLATE_OWNER_ICON_SIZE` 0,80·HEX_R. B3 to gwiazda dowódcy. Fixtury `overlay_web_parity` i atlas zregenerowano razem z kodem.

ZMIANY-COMMIT:
- Ocena dotyczy `a827fac07` (kod, testy i fixtury) oraz `55bdd989c` (raport Operatora) na `wf-repin3d-b2`.
- Baza i merge-base to `8d74519c2`, czyli bieżący `origin/rust-port/parity-v2`.
- Ten raport jest commitem FC na `fc-repin3d-b2-q1`, którego rodzicem jest `55bdd989c`.
- Diff do allowlisty sprawdziłem sam (`git diff --name-only 8d74519c2 HEAD`): 49 plików, wszystkie w allowliście.
- `tests/atlas_keys.rs` i `tests/overlay_web_parity.rs` mają wyłącznie `ring_hex: None` w 3 literałach. To wymóg kompilacji, uzasadniony w Z-RP-B2-1. Żadna asercja się nie zmieniła.
- Zero zmian w `gra/`, `engine/`, `src-tauri/`, `Cargo.*`, `WERSJE.md`, `gra-robocza/`, `src/battle/**` i `src/cities/**`.

TESTY (sprawdzone w worktree `wf_ed52b9a2-3cd-3`, detached @ `55bdd989c`, rustc 1.97.0):
- `cargo fmt --all -- --check`: EXIT=0.
- `cargo test --locked --no-fail-fast`: EXIT=0, passed=456, failed=0, binaries=60. Baza miała 448.
- `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0.
- `cargo +1.87.0 test` dla `repin3d_b2`, `overlay_web_parity` i `atlas_keys`: 8 + 11 + 7 passed, EXIT=0.
- `sha256sum -c`: `fixtures/overlay/MANIFEST.sha256` i `fixtures/atlas/SHA256SUMS` dają 0 linii innych niż OK. `MANIFEST_B.sha256` ma 29 OK.
- `git diff --check 8d74519c2 HEAD`: czysto.
- Kontrola źródła weba `86d510c66`:
  - `unitStatPlate.ts:154` to `0.80 * HEX_R`.
  - `unitOwnerEmblem.ts:249-252` to `normalizeRingHex` z regexem `/^#[0-9a-fA-F]{6}$/` i lower-case.
  - `:337-338` daje `civ:${civ}:${era}:${ring}`, a gdy barwy brak, `brass`.
  - Rust (`keys.rs`, `stat_plate.rs`) jest z tym zgodny.
- Generator, mutacje 30/30 i SSIM odtworzył niezależnie Evaluator. Nie powtarzałem ich, bo zarzutów brak.
- GPU: NIE_ZMIERZONO, brak `/dev/dri`. Nie blokuje.
- `target` usunięty po bramkach.

ORZECZENIE ZARZUTÓW: Evaluator nie zgłosił żadnego zarzutu, a Obrona = null. Uwagi Evaluatora (a)–(d):
- (a) README fixtur pinu ma nieaktualne SHA i pochodzenie. ODDAL jako blokadę. To dokumentacja bez wpływu na testy, a precedens Z-RP-B-1 przeszedł FC. Do poprawy w A6 albo przy integracji.
- (b) Reszta B3 (`HIGHLIGHT_OPACITY`, cache odznak) trafiła do kolejki §10.5. ODDAL: dispatch jawnie na to pozwala.
- (c) Możliwy konflikt §10 z A3. ODDAL: dziś parity-v2 = `8d74519c2`, więc konfliktu nie ma. Jeśli A3 wejdzie pierwsze, orkiestrator przenumeruje sekcję przy integracji.
- (d) Dysk: informacja, bez zarzutu.

Zero NAPRAW → PASS.

BLOKADY: brak.
RUNDY: 1/5 (FC runda 1, werdykt PASS)
NASTĘPNY KROK:
- Integracja orkiestratora: fast-forward `origin/rust-port/parity-v2` (`8d74519c2`) do SHA FC na `fc-repin3d-b2-q1`.
- Kolejność: B2-Q1 bezpośrednio na `8d74519c2`, przed ewentualną A3. Jeśli A3 trafi do parity-v2 wcześniej: rebase lub merge i ponowne bramki.
DEPLOY-PUSH: NIE WYKONANO
