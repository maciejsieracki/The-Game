# R-RUSTPORT-P4-1F2-TERRITORY-RANGES-R1 — zasięgi terytorium w nakładkach (PRIO-3D-10, #278/#334)

STATUS: dispatch orkiestratora. Opus (3D). Operator/Obrona Opus; Evaluator/FC Sonnet.
ZALEŻNOŚĆ: START DOPIERO po integracji FOG-VIEW (`R-RUSTPORT-P4-1C-FOG-VIEW-R1`, gałąź `rust-port-wip/R-RUSTPORT-P4-1C-FOG-VIEW-R1`). Bez tego zasięgi nie mają poprawnej mgły.
BAZA: `origin/rust-port/parity-v2` = `c120f2373` (po integracji FOG-VIEW: nowy SHA parity, wpisać przed startem).

## GOAL
Dodać w adapterze nakładek zasięgi terytorium (`TerritoryRangesDto`), zgodne z webem.
Stan: `TerritoryRangesDto` NIE istnieje w kodzie (grep: 0 trafień w parity). Istnieje `TerritoryViewDto` i `territory_by_owner`/`territory_colors`/`territory_border_group` w `renderer/src/view/overlays.rs:285-341`.

## PIN (przeczytaj przed zmianą)
- Zasięgi terytorium w webie: `grep -n 'territory\|Territory' gra/src/render/*.ts gra/src/main.ts` na `07d2fbd72` — wskaż funkcję liczącą zasięgi właściciela i granice; zacytuj linie w raporcie.
- Widoczność użyta przez zasięgi: aktywny fotel `ME()` (decyzja z webu, `main.ts:12995-13015`).

## ZAKRES
1. Producent `TerritoryRangesDto` w view-model (nowy plik `territory_ranges_view.rs` lub rozszerzenie `overlays_view.rs`) z `PlayableState` (granice terytorium per właściciel, przy widoczności ME()).
2. Adapter w `renderer/src/view/overlays.rs`: `territory_by_owner` + `territory_border_group` na nowym DTO.
3. Test `renderer/tests/territory_ranges_f2.rs`: wektory z pinu (generator `.mjs` przez TypeScript) dla 2 właścicieli i granicy.
4. Mutacje FAIL: (a) granica bez sąsiada z innym właścicielem; (b) zasięg bez filtru widoczności ME().

## ALLOWLISTA
`rust-port/view-model/src/`, `rust-port/renderer/src/view/overlays.rs`, `rust-port/renderer/tests/territory_ranges_f2.rs`, generator `.mjs`, katalog runs. Nic więcej.

## BRAMKI (EXIT 0)
`cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test territory_ranges_f2`, `cargo test --all-targets --no-fail-fast` (renderer i view-model).
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo, usuń po bramkach.
DYSK ≥ 12 GB przed bramką pełną (reguła bramki renderera; bez równoległych buildów). Inaczej BLOCK INFRA z liczbą GB.

## KRYTERIA KOŃCA
Zielone bramki, mutacje FAIL, commit jawnym `git add`, bez `Cargo.lock`, trailer bez nazwy modelu (#289). Raport `01-operator-r1.md`. Nie pushować do parity.
