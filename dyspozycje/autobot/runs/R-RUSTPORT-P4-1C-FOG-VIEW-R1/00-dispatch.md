# R-RUSTPORT-P4-1C-FOG-VIEW-R1 — producent FogViewDto (mgła dla aktywnego fotela) (#253, #335)

STATUS: dispatch orkiestratora (Opus: 3D/grafika-widoki). DOMAIN: GAME=nie (widok/DTO mgły); gameplay bez zmian.
Decyzja (rozstrzygnięta przez web, bez pytania): mgła liczona dla aktywnego fotela `ME()`; eksploracja per fotel.

## GOAL
Dodać producenta `FogViewDto` z stanu silnika, tak jak web:
- widoczność = `computePlayerVisibility` dla jednostek i miast ownera `ME()` + start hex, z unią widoczności sojuszników
  (pin: `gra/src/main.ts:12995-13015` (`currentVisible`), `:13059-13075` (`currentVisibleForOwner`), `:13475-13492` (`refreshFog`));
- eksploracja per fotel: `exploredByHuman.get(ME())` (pin `main.ts:13490`); `exploredSetForRender` = `visibility.ts:244-250`;
- przełączniki: `fogOn` (`main.ts:12801`), `revealAllLand` (`main.ts:12804`); bez `revealAllLand` kopia `explored`.

## BAZA
`origin/rust-port/parity-v2` = `c120f2373`. Worktree świeży: `git worktree add --detach <ścieżka> c120f2373`.

## ISTNIEJĄCE ELEMENTY (zweryfikuj przed zmianą)
- `FogViewDto` (view-model/src/map.rs:207-210), reeksport view-model/src/lib.rs:49, pole `fog` w `root.rs:37,72`, walidacja `validate.rs:14`.
- Konsument: renderer/src/view/fog.rs:65 (`fog: &FogViewDto`).
- Silnik: `compute_player_visibility` (engine/src/domain/state.rs:1067) i `…_with_extra` (:1080); `explored_set_for_render` (state.rs:1028-1034).
- BRAK producenta: nie ma miejsca, które z `PlayableState` buduje `FogViewDto` dla ME(). Dodać.

## ZAKRES
1. Producent w engine (lub adapterze view-model wg istniejącego wzorca `city_view.rs` / `map_view.rs`): funkcja z `PlayableState` + `active_seat` → `FogViewDto`.
2. Aktywny fotel: pole/funkcja `ME()` z istniejącego stanu (sprawdź, co już jest w `PlayableState`; nie wymyślaj nowego pojęcia).
3. Unia sojuszników: tylko gdy `allianceFormalKindBetween` ∈ {sojusz_defensywny, sojusz_pelny} (pin `main.ts:13011-13013`); istniejące `activeDeals`.
4. Test: wektory z pinu (generator `.mjs` wykonujący `visibility.ts` przez TypeScript, jak w `p6_*_gen.mjs`) dla 3 scenariuszy: sam fotel, fotel + sojusznik, `revealAllLand=true`.
5. Eksploracja: test, że `explored` jest per fotel (zmiana fotela nie przenosi mgły drugiego).

## ALLOWLISTA
`rust-port/view-model/src/map.rs`, `rust-port/engine/src/domain/state.rs` (tylko producent), nowy plik producenta, `rust-port/renderer/src/view/fog.rs` (tylko jeśli konieczne), testy `p4_1c_fog_*`, generator `.mjs`, katalog runs. NIC więcej.

## BRAMKI (EXIT 0)
- `cargo fmt --check` i `cargo clippy --all-targets -- -D warnings` w `rust-port/engine` oraz `rust-port/renderer` (osobno).
- `cargo test --test <nowy test>` oraz `--all-targets --no-fail-fast` w obu crate'ach.
- Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` POZA repo, usuń po bramkach.
- DYSK: ≥ 8 GB przed startem i przed bramką pełną (`df -h /`). Przy < 8 GB: BLOCK INFRA z liczbą GB.

## KRYTERIA KOŃCA
1. Producent + testy wektorów z pinu zielone; test eksploracji per fotel zielony.
2. Mutacje FAIL: (a) pominięcie unii sojuszników; (b) `explored` współdzielone między fotelami; (c) pominięcie `revealAllLand`.
3. Commit jawnym `git add` (nigdy `-A`), bez `Cargo.lock`, trailer bez nazwy modelu (#289). Raport `01-operator-r1.md`.

## NIE WOLNO
- Nie pushować do `rust-port/parity-v2`. Nie dotykać `gra/`. Nie wyłączać testów.
- Nie dodawać odstępstw od webu. Każde odstępstwo = pytanie ABC do orkiestratora (nie do właściciela, jeśli web rozstrzyga).

## DODATEK r2 (orkiestrator, 2026-11-17 13:5x): BAZA przesunięta
- BAZA r2: `origin/rust-port/parity-v2` = `2760b4f0c` (zawiera T4e-0 `732ef51a0`, R6 `c120f2373`, renderer zbiorczo). Worktree detached na `2760b4f0c`.
- Zakres bez zmian. Konflikty z T4e nieprzewidziane: T4e dotyka `siege_tactics_loop.rs`, `siege_tactics_move_effects.rs`; FOG dotyka `state.rs`/view-model.

## DODATEK r3 (orkiestrator, po FC FAIL r1 = wyłącznie INFRA): kod bez zmian, tylko bramka pełna
- KOD: `a17f28d42` (zabezpieczony: `refs/keep/FOG-VIEW-R1-code`, gałąź `rust-port-wip/R-RUSTPORT-P4-1C-FOG-VIEW-R1-impl`). Nie zmieniać kodu.
- BAZA r3: `2760b4f0c` (zgodna z DODATKIEM r2).
- ZAKRES r3: wyłącznie bramka pełna na `a17f28d42`: `cargo fmt --check` i `cargo clippy --all-targets -- -D warnings` w engine i renderer; `cargo test --test p4_1c_fog_view`; `cargo test --all-targets --no-fail-fast` w engine i renderer. Zero FAILED/panicked.
- MUTACJE r3: (a) unia sojuszników, (b) eksploracja współdzielona, (c) revealAllLand — każda musi dać FAIL (odtworzyć z raportu r1).
- DYSK: ≥ 8 GB przed startem i przed bramką pełną. Przy < 8 GB: BLOCK INFRA z liczbą GB (bez zmian kodu).
- POZA ZAKRESEM (osobny temat, nie w tej rundzie): wołający produkcyjny producenta (`fog_view_dto`, `refresh_fog`) — droga DTO → renderer (L6/#308), `fog_active` w ViewerDto, PRIO-3D-11/10. Zapis w rejestrze jako FOG-WIRE.
- Trailery commitów: BEZ nazwy modelu (#289). Raport `03-operator-r3.md`. Nie pushować do parity.
