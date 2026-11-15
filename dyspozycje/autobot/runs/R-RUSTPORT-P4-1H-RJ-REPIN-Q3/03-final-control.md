# Final Control r1 — R-RUSTPORT-P4-1H-RJ-REPIN-Q3

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-RJ-REPIN-Q3
GOAL: dryf RJ (ruch marszu) Rust do pinu `07d2fbd72`: R1–R4, R6, `trim_path_to_stack_room`; R5 tylko zbadany.
ZMIANY/COMMIT: oceniany kod = `faffd0a54` (Obrona r1, nad `576093738` / `cc7cde088`); ten raport = commit FC nad `faffd0a54` na gałęzi lokalnej `rust-port-wip/R-RUSTPORT-P4-1H-RJ-REPIN-Q3-fc`.
TESTY: niżej (wszystkie powtórzone samodzielnie przez FC).
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora (`faffd0a54` + ten raport) na `rust-port/parity-v2`; wpisy do `REJESTR-RUST.md` (Z1, Z2, Z5).
DEPLOY/PUSH: NIE WYKONANO.

## Baza i ancestry

- Baza z dispatchu: `be49ff3c3` (`origin/rust-port/parity-v2` w chwili dispatchu). Teraz `origin/rust-port/parity-v2` = `b90894920`; integrację orkiestrator robi względem bieżącego stanu (merge-tree).
- `git merge-base --is-ancestor be49ff3c3 faffd0a54` → prawda. Łańcuch: `be49ff3c3` → `cc7cde088` → `576093738` → `faffd0a54` → commit FC.

## Allowlista (zweryfikowana `git diff --stat be49ff3c3 faffd0a54`)

Zmienione: `src/domain/pathfinding.rs`, `src/domain/army_follow_auto_merge.rs`, `tests/p4_1h_rj_repin.rs` (nowy), `tests/p4_1h_rj_repin_vectors/{gen.mjs,vectors.json}` (nowe), `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-RJ-REPIN-Q3/**`. Wszystko w allowliście. `p6_4_*` bez zmian, `mod.rs` bez zmian, `Cargo.lock` nie w commicie, `gra/` nietknięte. `git diff --check` czysty. Brak `#[ignore]`, `todo!`, `unimplemented!` w diffie kodu.

## Bramki (FC, `rust-port/engine`, CARGO_TARGET_DIR w scratchpadzie, usunięty)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` | EXIT 0; 483 binarki, 3523 passed, 0 failed, 1 ignored (dług bazy `e2e::dump_tick1_econ_for_web_generator`) |
| `node tests/p4_1h_rj_repin_vectors/gen.mjs --check` (Node v22.23.4) | EXIT 0, „vectors.json zgodny z pinem”, strażnik SHA-256 24 fragmentów zielony (w tym `main.ts#armyStackLimit`, `battleScene.ts#MAX_PER_SIDE`, `#BATTLE_MAX_PER_SIDE`) |

Liczności kategorii (z `--check`): march 500 (pass_through_mid_route 273, segment_end_trimmed 159, only_own_hex_in_reach 111, dest_own_unit_merge 61, siege_dest 60, siege_mid 70, siege_predicate_false_for_mover 50, siege_predicate_changes_path 49, plain_set 40, other 70), buildMoveOccupancy 40, trimSegmentEndOffPassThrough 60, stack 50 (granice 499+1 ok, 500+1 odmowa, 498+2 ok, 499+2 odmowa), notify 6+24+25. Łącznie > 200.

Stabilność starych wektorów po Obronie (FC, porównanie JSON `576093738` vs `faffd0a54`): pin, generator, armyStackLimit=500, ownUnitInReachDetail, maps, occupancy, trimSegment, stack, notify identyczne; march[0..450] identyczne, dopisane 50; excerpts 21 → 24 (prefiks identyczny).

## Przegląd kodu względem pinu (odczyt `git show 07d2fbd72:...`)

- R1 `planned-march.ts:271-275` i R2 `:311-313`: `trim_end_off_pass_through(truncate_path_to_budget(...), path.len(), pass_through)` — zgodne.
- R3 `:388-400`: `full_path.first()` w `pass_through` → `Obstacle` + literał pinu — zgodne.
- R4 `setup.ts:1138-1139`: `siegeBlocksEntry` przed gałęzią celu, `continue` — zgodne (kolejność względem innych `continue` bez wpływu na wynik).
- R6 `:511-546`: `isNotifiableMarchStop`, `marchPausedLabel` (pusty detail = falsy), `registerMarchStop`, `clearMarchStop` — zgodne.
- `buildMoveOccupancy` `setup.ts:759-776` i `trimPathToStackRoom` `army-stack-limit.ts:86-99` — zgodne.
- Stare API (`compute_path`, `plan_path_turns`, `should_stop_at_obstacle`, `execute_march_step`) delegują z pustym `pass_through` i `siege=None` — zachowanie dla zwykłego `Set` bez zmian (p6_4_* zielone bez edycji).

## Mutacje własne FC (obie przywrócone, drzewo czyste)

| Mutacja | Wynik |
|---|---|
| FC-M1: `build_move_occupancy` wpuszcza do `pass_through` heksy zablokowane obcą jednostką | EXIT 101 (`move_occupancy_and_trim_match_pin`, `march_vectors_match_pin_07d2fbd72` FAILED) |
| FC-M2: trim przy pełnej trasie (`>=` → `>`; cel na własnej jednostce przestaje być scaleniem) | EXIT 101 (te same 2 testy FAILED) |

## Orzeczenia zarzutów

| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| Z1 | Nowe API bez produkcyjnego wołającego | ODDAL | Dispatch Q3 obejmuje funkcje domeny; wpięcie należy do P4-1H Q4 MOVE-MODEL / Q6 MOVE (także mapowanie `MarchStopReason` → `PlayableMarchStopReason`). Dług jawny w `02a-obrona.md`; orkiestrator wpisuje go do `REJESTR-RUST.md`. |
| Z2 | `OWN_UNIT_IN_REACH_DETAIL` jako stała w kodzie, nie w JSON | ODDAL | `ruch-jednostek-params.json` poza allowlistą; w pinie to też literał w kodzie (`planned-march.ts:399`); stała pilnowana wektorem `ownUnitInReachDetail` i 111 przypadkami. Decyzja techniczna do `REJESTR-RUST.md` (orkiestrator). |
| Z3 | `ARMY_STACK_LIMIT = 500` na sztywno w generatorze | ODDAL (naprawione w `faffd0a54`) | FC potwierdził: generator czyta `MAX_PER_SIDE` z pinu, łańcuch objęty strażnikiem SHA (24 fragmenty), test Rust odrzuca literał. |
| Z4 | Brak przypadku, gdzie predykat oblężenia zwraca false | ODDAL (naprawione w `faffd0a54`) | FC potwierdził: 50 przypadków `siege_predicate_false_for_mover`, 49 `siege_predicate_changes_path`, progi ≥ 40 w teście, stare wektory bajt w bajt. |
| Z5 | R5 `computeReachable@07` NIE_ZMIERZONE | ODDAL | Dispatch: „R5 NIE implementować, tylko zbadać; wynik NIE_ZMIERZONO albo lista różnic”. Lista różnic jest w raporcie Operatora. Proponowany osobny temat `R-RUSTPORT-P4-1H-RJ-REPIN-R5-REACHABLE` — decyzja o dispatchu należy do orkiestratora (parytet z pinem, zasada 9; bez pytania gameplay). |

Brak NAPRAW, brak DO DECYZJI CZŁOWIEKA. Werdykt: PASS-WITH-NOTES (uwagi = wpisy do rejestru Z1, Z2, Z5 i nowy temat R5).
