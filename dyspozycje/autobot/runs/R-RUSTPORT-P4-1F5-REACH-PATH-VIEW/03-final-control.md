# 03 — Final Control — R-RUSTPORT-P4-1F5-REACH-PATH-VIEW (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F5-REACH-PATH-VIEW
GOAL: `overlays.reachable` (reachableWithMergeTargets + occupiedForMove z passThrough + foreignCityHexKeys) i `overlays.pathRoute` z `turnStops` przez `preview_path` (P4-1H), wg pinu `07d2fbd72`.
ZMIANY/COMMIT: oceniany kod `5b8a70ba5` (obrona r1) -> `ca1da74b5` (Evaluator) -> `a3918f9e1` -> `e34af8294` (Operator) -> baza `05b872fc5` (DODATEK r2). `git merge-base --is-ancestor 05b872fc5 5b8a70ba5` = TAK. Ten raport jest commitem na `5b8a70ba5` (SHA w wyniku FC).
TESTY: patrz niżej (uruchomione samodzielnie przez FC na `5b8a70ba5`).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (uwaga na konflikt z 1F3/1F4 w `overlays_view.rs` i `mod.rs`).
DEPLOY/PUSH: NIE WYKONANO

## Allowlista (diff `05b872fc5..5b8a70ba5`)

- `rust-port/engine/src/domain/overlays_view.rs` (NOWY) — na liście;
- `rust-port/engine/src/domain/pathfinding.rs` — +84 linii, tylko nowa `compute_reachable_occ`;
- `rust-port/engine/src/domain/mod.rs` — tylko `pub mod overlays_view;`;
- `rust-port/engine/tests/view_overlays_reach_path.rs` (NOWY);
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F5-REACH-PATH-VIEW/**`.

Cargo.lock nie jest w diffie. W plikach tematu nie ma `#[ignore]`. `renderer/`, `gra/`, `preview_path` i `move_unit` są nietknięte.

## Bramki (FC, `rust-port/engine`, CARGO_TARGET_DIR w scratchpadzie, po bramkach usunięty)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test view_overlays_reach_path` | EXIT 0, 14/14 |
| `cargo test --all-targets --no-fail-fast` | EXIT 0: 495 zestawów, 3667 passed, 0 failed, 1 ignored (ignorowanie istniało przed tematem) |

Dysk: przed pełnym testem 5,6 GB wolnego, czyli poniżej progu 8 GB. Faktyczne zużycie pełnej bramki to około 3 GB. Test szedł pod watchdogiem, który miał go zabić przy wolnym miejscu < 1,5 GB. Minimum w trakcie wyniosło 4,3 GB, watchdog nie zadziałał. Po bramkach jest 7,9 GB wolnego.

## Mutacje (FC, samodzielnie; po każdej plik przywrócony, `cmp` OK, `git status` czysty)

- `pathCost <= ruchLeft` -> `<` (`overlays_view.rs`, pin `main.ts:14728`): FAIL r7, 13/14;
- heksy `passThrough` dopisywane do zasięgu (`pathfinding.rs`, pin `setup.ts:948-949`): FAIL r1 i r4, 12/14.

## Zgodność z pinem (FC)

- `compute_reachable_occ` odpowiada `computeReachableImpl` (`setup.ts:915-975`) linia w linię. Zgadza się kolejność `occupied`, `siegeBlocksEntry`, budżetu, `passThroughKeys` w głównej pętli i w MIN-MOVE.
- `reachable_with_merge_targets` odpowiada `main.ts:14706-14731`. `computePath` w pinie bierze `occ` tylko jako zbiór zajętych (`setup.ts:1019+`), więc przekazanie `occ.blocked` w Rust jest zgodne.
- `occupied_for_move` (P4-1H) zdejmuje `passThrough` dla heksów obcych miast (`main.ts:14578-14585`); pokrywa to wektor r6.

## Orzeczenia zarzutów

- **Z0** (opis pracy Evaluatora): ODDAL, to nie zarzut.
- **Z1** (granica kosztu scalenia): ODDAL. Naprawione w obronie (wektor r7). FC potwierdził mutacją `<`, która daje FAIL.
- **Z2** (producenci bez wołającego produkcyjnego): ODDAL. Dispatch zabrania ruszać `renderer/`. Zależność P4-1G Q6 / PRIO-3D-2 (#237 / #270) jest jawnie zapisana w nagłówku modułu.
- **Z3** (duplikat `march_path_plan`): ODDAL. Duplikaty usunięto. Skład `plan_path_turns_occ` + `apply_fog_to_path_plan` jest teraz tylko w produkcyjnym `preview_path_plan` (`playable_movement.rs:323-351`). Grep po `src` i `tests` nie znajduje `march_path_plan` ani `path_route_of` poza komentarzem.
- **Z4** (isMe kontra isHuman): ODDAL. Kod używa `HumanSeats::is_active_human`, jak `owner === ME()` w pinie. Aktywny fotel to pierwszy `is_human`, bo stan nie ma pola aktywnego fotela; dług jest zapisany przy #281. Test hot-seat istnieje.
- **Z5** (`compute_reachable_occ` w `pathfinding.rs`): ODDAL w kwestii technicznej. To wierny port `computeReachable` z `MoveOccupancy`, którego zakres 1 dispatchu wymaga (`occupiedForMove` z `passThrough`). Mieści się w zapisie allowlisty „`build_move_occupancy` / passThrough”. Orkiestrator przyjmuje to przy integracji.
- **Z6** (wektor „trasa skrócona przez mgłę”): ODDAL dla kodu. Pin (`planned-march.ts:56-75`, C-RUCH-Q1=B) rozstrzyga, że mgła trasy nie skraca, a zasady 9 i 11 każą iść za pinem. Poprawka tekstu dispatchu i ROZPOZNANIA 1F §4 należy do orkiestratora.
- **Z7** (brak pełnego all-targets): ODDAL. FC zmierzył: EXIT 0, 3667 passed.

Brak orzeczeń NAPRAW, brak orzeczeń DO DECYZJI CZŁOWIEKA. Werdykt: PASS-WITH-NOTES. Noty: Z5 i Z6 przyjmuje orkiestrator; konflikt integracyjny z 1F3/1F4.

## Sprzątanie dysku (prośba użytkownika przekazana przez harness)

Usunąłem wyłącznie pozycje bezspornie porzucone, których nie trzymał otwarte żaden proces:

- `/tmp/p4-1h-rj-repin-*`, 5 katalogów po 92 MB z 15.11. To pozostałości `mkdtemp` generatora `tests/p4_1h_rj_repin_vectors/gen.mjs`;
- `/tmp/k5doc-fc-target`, 356 MB. To cache cargo, nieużywany od 09:13;
- własny `fc1f5_target` i kopie mutacji.

Nie ruszałem:

- `fc1f4_target`, bo w trakcie bramek używał go aktywny FC z worktree `wf_82e7a5d4-927-3`;
- worktree `wf_*`, które należą do trwających Workflow.

Te pozycje zostają orkiestratorowi.
