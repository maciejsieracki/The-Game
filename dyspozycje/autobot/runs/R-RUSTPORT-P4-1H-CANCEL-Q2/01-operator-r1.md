# R-RUSTPORT-P4-1H-CANCEL-Q2 — Operator r1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-CANCEL-Q2
GOAL: `PlayableGame::cancel_planned_march(unit_id, force)` 1:1 z gałęzią `unitId !== undefined` web `clearPlannedMarch` (`gra/src/main.ts:31051-31056` @ `07d2fbd72`) + `EngineCommand::CancelPlannedMarch` w obu adapterach `bridge.rs`.
ZMIANY/COMMIT: gałąź `rust-port-wip/R-RUSTPORT-P4-1H-CANCEL-Q2-op-r1`, SHA w wiadomości końcowej Operatora (commit zawiera ten raport). Baza: `origin/rust-port/parity-v2` = `2799cdd4ba89bb4421a128a56efddea0ec4e2ace` (detached, zgodnie z dispatchem).
TESTY: patrz §3 (fmt/clippy/test EXIT 0; mutacja → FAIL).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO.

## 1. Źródło (pin, `git show 07d2fbd72:gra/src/main.ts`)

```ts
if (unitId !== undefined) {
  if (!force && plannedMarches.get(unitId)?.attackUnitId) return;
  plannedMarches.delete(unitId);
  marchAttackTargets.delete(unitId);
  marchStopNotified.delete(unitId);
  marchStopDetail.delete(unitId);
}
```

Gałęzie globalne (`unitId === undefined`, `:31057-31070`) i `unitRenderer.clearPathRoute()` (`:31071-31073`, efekt UI) — poza zakresem.

## 2. Zmiany (allowlista)

- `rust-port/engine/src/domain/playable.rs`
  - `PlayableState::clear_planned_march_for_unit(unit_id: UnitId, force: bool)` — czysta logika 1:1: `!force` i plan jednostki ma `attack_unit_id` → `return`; inaczej usunięcie wpisu z `planned_marches` (`retain`, kolejność reszty zachowana jak `Map.delete`), `march_attack_targets`, `march_stop_notified`, `march_stop_detail` (nazwy pól zweryfikowane: `playable.rs` pola P4-1J). `status` niezmieniany (web nie daje tu hintu).
  - `PlayableGame::cancel_planned_march(unit_id: u64, force: bool) -> Result<(), PlayableError>` — walidacja jak `select_unit`/`move_unit`: brak jednostki → `UnitNotFound`, obca → `UnitNotOwned` (decyzja techniczna w `REJESTR-RUST.md`, 15.11); potem delegacja. Brak planu → `Ok(())` bez zmian. Nie wymaga zaznaczenia jednostki (web woła też dla `u.id` z HUD, np. `main.ts:25920`).
  - moduł `#[cfg(test)] cancel_planned_march_game_tests` (3 testy) — przypadki komendy z planami w stanie i z obcą jednostką: pola `PlayableGame` są prywatne, a w API nie ma konstruktora ze stanu ani komendy tworzącej plan, więc tych przypadków nie da się zbudować z testu integracyjnego. Nie dodawałem publicznego konstruktora (zmiana API poza zakresem).
- `rust-port/engine/src/bridge.rs`
  - `EngineCommand::CancelPlannedMarch { unit_id: u64, force: bool }` (serde: `{"kind":"cancel_planned_march","unit_id":…,"force":…}`).
  - `CivEngineAdapter`: delegacja do `game.cancel_planned_march`, błąd → `engine_rejected(error.to_string())`.
  - `MockEngineAdapter`: brak sesji → `engine_rejected("create session before cancelling a march")`; inaczej ta sama delegacja i odświeżenie `state`. Kontrakt w obu adapterach identyczny (test `bridge_adapters_share_the_contract`).
- `rust-port/engine/tests/p4_1h_cancel_planned_march.rs` (NOWY) — 12 testów własnych (+1 test modułu `bridge.rs` włączonego `#[path]`).

`Cargo.lock` nie commitowany. `gra/`, `origin/main`, `rust-port/parity-v2` nietknięte.

## 3. Bramki (`rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 (pierwsze uruchomienie: `manual_retain` w helperze testu → poprawione, ponowione EXIT 0) |
| `cargo test --all-targets --no-fail-fast` | EXIT 0; 482 zestawy, passed 3518, failed 0, ignored 1 (dług `#[ignore]` z bazy, nieruszany) |
| `git diff --check` | czysto |

Wektory (dispatch) → test:

| Wektor | Test |
|---|---|
| (a) `force=false` + atak → stan bajt-w-bajt (`==` i identyczny JSON) | `a_no_force_keeps_attack_plan_byte_for_byte`; game: `attack_plan_survives_without_force_and_is_cleared_with_force` |
| (b) `force=false` bez ataku → 4 mapy wyczyszczone | `b_no_force_without_attack_clears_four_maps`; game: `plain_plan_is_cleared_without_force` |
| (c) `force=true` z atakiem → wyczyszczone | `c_force_clears_attack_plan`, `c_force_clears_plain_plan`; game: j.w. |
| (d) brak planu → `Ok`, bez zmian | `d_no_plan_is_ok_without_changes` (także: wpisy powiadomień bez planu są czyszczone — `delete` bezwarunkowy w webie) |
| (e) podwójne wywołanie | `e_double_call_is_idempotent` |
| (f) inne jednostki nietknięte, kolejność | `f_other_units_untouched_and_order_kept` (usunięcie ze środka, początku, końca wektora) |
| (g) nieznana → `UnitNotFound`; obca → `UnitNotOwned`; stan bez zmian | `g_unknown_unit_is_rejected_without_changes`; game: `foreign_and_unknown_units_are_rejected_without_changes` (oba `force`) |
| bridge | `bridge_adapters_share_the_contract`, `mock_rejects_cancel_before_session`, `command_serde_shape` |

## 4. Mutacja „pomiń warunek attack”

Mutacja: `if !force && …` → `if false && !force && …` w `clear_planned_march_for_unit`. Wynik:
- `cargo test --test p4_1h_cancel_planned_march`: **FAILED** — `a_no_force_keeps_attack_plan_byte_for_byte` (12 passed, 1 failed);
- `cargo test --lib cancel_planned_march`: **FAILED** — `attack_plan_survives_without_force_and_is_cleared_with_force` (2 passed, 1 failed).

Mutacja cofnięta przed bramkami końcowymi (bramki z §3 uruchomione na kodzie bez mutacji).

## 5. Uwagi / NIE_ZMIERZONO

1. Wektory z uruchomionego webu: NIE_ZMIERZONO (dopuszczalne wg dispatchu); oczekiwania wyprowadzone z kodu pinu `main.ts:31051-31056`.
2. Web sprawdza `attackUnitId` jako wartość truthy (id-napis; pusty napis = brak ataku). W Rust `attack_unit_id: Option<UnitId>`; `Some(_)` = atak. Pusty napis nie ma reprezentacji w `UnitId` (odczyt zapisu filtruje to w warstwie `save_load`, poza zakresem) — rozbieżności nie ma w osiągalnym stanie.
3. Brak wołającego produkcyjnego poza bridge (PPM/Esc, przycisk „Zatrzymaj”, HUD) — to osobne komendy UI, poza zakresem tematu (§1.1 rozpoznania).
