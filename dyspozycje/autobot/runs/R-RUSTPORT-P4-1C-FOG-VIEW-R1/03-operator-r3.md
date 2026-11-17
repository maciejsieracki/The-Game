# R-RUSTPORT-P4-1C-FOG-VIEW-R1 — Operator, runda 3 (wyłącznie bramka pełna, DODATEK r3)

STATUS: PASS
DOMAIN: INFORMATIONAL (widok/DTO mgły; gameplay bez zmian)
TEMAT: R-RUSTPORT-P4-1C-FOG-VIEW-R1 (#253, #335)
GOAL: producent `FogViewDto` z `PlayableState` dla aktywnego fotela `ME()`, 1:1 z `refreshFog` weba (pin `07d2fbd72`).

## Baza i kod
- BAZA r3: `2760b4f0c` (DODATEK r2/r3); `git merge-base --is-ancestor 2760b4f0c a17f28d42` = prawda.
- KOD: `a17f28d42` BEZ ZMIAN. Gałąź robocza `rust-port-wip/p4-1c-fog-view-r3` startuje od łańcucha raportów r1
  `3aa60773f` (= `refs/keep/FOG-VIEW-R1-fc`, potomek `a17f28d42`); `git diff a17f28d42 HEAD -- rust-port` = pusty.
- Allowlista r3: wyłącznie ten raport. Brak zmian kodu, `gra/`, `Cargo.lock` (zmieniony przez cargo `renderer/Cargo.lock` przywrócony `git checkout`).

## TESTY (env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo, usunięty po bramkach)
DYSK `df -h /`: start 13 GB; przed bramką pełną 13 GB (engine) i 9,1 GB (renderer, inne workery) — ≥ 8 GB w obu punktach; po sprzątnięciu 13 GB.

| Bramka | crate | Wynik |
|---|---|---|
| `cargo fmt --check` | engine | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | engine | EXIT 0 |
| `cargo test --test p4_1c_fog_view` | engine | 5 passed, 0 failed |
| `cargo test --all-targets --no-fail-fast` | engine | EXIT 0; 522 binariów `test result`, 3893 passed, 0 failed, 1 ignored (`e2e::dump_tick1_econ_for_web_generator`, istniejący, poza tematem); 0 linii `FAILED`/`panicked` |
| `cargo fmt --check` | renderer | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | renderer | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` | renderer | EXIT 0; 77 binariów, 666 passed, 0 failed |

Uwaga: pierwsza próba pełnego testu engine z `timeout 580` przerwana przez limit czasu (EXIT 124, nie błąd testów); powtórzona w tle bez limitu → EXIT 0 (wynik w tabeli).
`#[ignore]` w plikach tematu (`git diff --name-only 2760b4f0c a17f28d42`): brak.

## Mutacje (odtworzone z raportu r1; każda na `state.rs`, przywrócona `git checkout`, po przywróceniu `--test p4_1c_fog_view` = 5 passed)
- (a) pominięcie unii sojuszników — `visible.extend(current_visible_for_owner(..))` → `let _ = current_visible_for_owner(..)`:
  FAIL `p4_1c_fog_vectors_match_pinned_web` (`fotel_sojusznik: fog.state`).
- (b) eksploracja współdzielona — `.get_mut(&me)` → `.values_mut().next()`:
  FAIL `p4_1c_fog_explored_is_per_seat` (tests/p4_1c_fog_view.rs:335) i `p4_1c_fog_missing_seat_is_error` (:370).
- (c) pominięcie `revealAllLand` — `explored_set_for_render(explored, &all_land, inputs.reveal_all_land)` → `(.., false)`:
  FAIL `p4_1c_fog_vectors_match_pinned_web` (`reveal_all_land: fog.state`).

## BLOKADY
Brak.

## POZA ZAKRESEM (wg DODATKU r3)
Wołający produkcyjny (`fog_view_dto`, `refresh_fog`) — droga DTO → renderer (L6/#308), `fog_active` w ViewerDto, PRIO-3D-10/11: temat FOG-WIRE (rejestr orkiestratora).
Trailer z nazwą modelu w historycznym commicie r1 `f56b2b796` — do korekty przy integracji (nota FC r1).

## RUNDY
3/5.

## NASTĘPNY KROK
Evaluator r3 → Obrona → Final Control na tym commicie (kod `a17f28d42`).

## DEPLOY/PUSH
NIE WYKONANO.
