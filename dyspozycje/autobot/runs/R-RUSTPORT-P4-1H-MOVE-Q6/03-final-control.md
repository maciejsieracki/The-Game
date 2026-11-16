# 03 — Final Control: R-RUSTPORT-P4-1H-MOVE-Q6 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-MOVE-Q6
GOAL: `move_unit` = `planMarchTo` + pierwszy segment `executeMarchSegmentForUnit` (bez animacji), bez reguły „tylko sąsiad”, `attack_unit_id` w komendzie, ruch jako `f64`.
ZMIANY/COMMIT: kod oceniany = `17a12c18e6c149c19bfd510708891b8ef333dbbf` (Obrona r1) → rodzic `b5057adeaa28d3a52de5ff4687a29e7c70e64416` (Operator r1) → rodzic `9f1a29af32e0064d8b389bca3a403f0bef8b5348` (baza z dispatchu). `git merge-base --is-ancestor 9f1a29af3 17a12c18e` = TAK. Commit FC dodaje wyłącznie ten raport (gałąź lokalna `rust-port/wip/R-RUSTPORT-P4-1H-MOVE-Q6-fc-r1`, bez push).
TESTY: patrz §Bramki.
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora (allowlista rozszerzona o 2 pliki — patrz zarzut 1) + wpis zależności `R-RUSTPORT-P4-1H-MARCH-ATTACK-LAUNCH` w `dyspozycje/rust-port/REJESTR-RUST.md`.
DEPLOY/PUSH: NIE WYKONANO

## Bramki (zweryfikowane samodzielnie, `rust-port/engine`, CARGO_TARGET_DIR poza repo)

Kod `17a12c18e`, wolne miejsce przed bramkami 8,9 GB (po buildzie 13 GB, ≥ 8 GB):
- `cargo fmt --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --all-targets --no-fail-fast`: **EXIT 0 w jednym pełnym przebiegu**, 489 binarek (`test result` × 489), **3613 passed, 0 failed, 1 ignored** (ignore istniał przed tematem). Zgodne z Obroną (3613) i Evaluatorem (3610 + 3 testy Obrony).
- Mutacje odtworzone samodzielnie na `p4_1h_move_q6`: (b) `can_join_stack_at(…, 499)` zamiast `ARMY_STACK_LIMIT` → FAIL (22 passed, 1 failed); (c) `pooled - cost.ceil()` (zaokrąglanie kosztu) → FAIL (22 passed, 1 failed). Plik przywrócony (`cmp` = identyczny). Mutacje (a) i (d) — wynik Evaluatora (FAIL 11 i 5) przyjęty, nie powtarzane.
- `CARGO_TARGET_DIR=/tmp/fc-q6-wfb1e-target` usunięty po bramkach.

## Allowlista (samodzielnie)

`git diff --stat 9f1a29af3 17a12c18e`: 19 plików. W allowliście: `playable.rs`, `playable_movement.rs`, `bridge.rs`, `tests/p4_1h_move_q6.rs` (nowy), 11 plików z `git grep -l 'PlayableUnit {' 9f1a29af3 -- rust-port/engine/tests` (lista zgodna 1:1 ze zmienionymi), `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-MOVE-Q6/**`. `save_load.rs` nietknięty. Poza literalną allowlistą: `tests/playable_slice.rs`, `tests/p6_unit_replace_l3_state.rs` (zarzut 1). `Cargo.lock` nie jest w commicie.

Brak nowych `#[ignore]`. Jedyne usunięte asercje są w `playable_slice.rs` (reguła sąsiada i `DestinationImpassable`) — obie sprzeczne z pinem: reguła sąsiada usunięta z ZAKRESU pkt 2; cel nieprzejezdny jest w pinie zawsze osiągalny jako ostatni krok (`units/setup.ts:1141-1144` @ `07d2fbd72`: `nKey === destKey` → „always passable as final step”, `enterCost = movCost === Infinity ? 1 : movCost`). To nie jest osłabienie, tylko parytet; zastępczy test `cel_nieprzejezdny_obok_konczy_sie_wejsciem_kosztem_zero` jest w `p4_1h_move_q6.rs`.

## Kontrola kodu względem pinu (`main.ts:31213-31298`)

Kolejność bramek w `plan_march_to` zgodna z pinem: stos / `occupiedForMove` / `unitWithPlanningStackRuch` → `attackTarget` (jawny id albo obca jednostka na celu; nieistniejący id → brak ataku, jak `units.find` → `undefined`) → `marchPathPlan` (`fullPath` puste → „Marsz przerwany: brak trasy do celu”) → bez ataku: `canOccupyHexForUnit` → bez ataku: `canJoinStackAt(…, 500)` → `markPlayerMovedUnit`, `plannedMarches.set`, `marchStop*.delete`, `syncMarchAttackTarget` → segment tylko przy `planningStackRuchLeft > 0`. Odrzucenie nie zmienia stanu (test `bramki_komendy_bez_zmian_stanu`). Wołający produkcyjny: `bridge.rs` (oba adaptery). JSON `MoveUnit` bez `attack_unit_id` zachowuje kształt (`skip_serializing_if`). `MovementPoints` serializuje całkowite jak dawne `u8` (golden zielony).

## Orzeczenia zarzutów

| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 1 | 2 pliki spoza literalnej allowlisty | **ODDAL** | `playable_slice.rs:58-68` jest wprost wskazany do aktualizacji w obowiązkowym źródle dispatchu (`P4-1H-COMMANDS-ROZPOZNANIE.md` §4 wiersz Q6: „aktualizacja `tests/playable_slice.rs:58-68`”); `p6_unit_replace_l3_state.rs:336` — 1 linia wymuszona kompilacją przez erratę 1 (przypisanie pola, nie literał, więc grep z erraty go nie złapał; intencja erraty = pliki testów łamane zmianą typu). Obie zmiany minimalne, jawnie ujawnione przez Operatora. Orkiestrator: przy integracji dopisać oba pliki do allowlisty tematu. |
| 2 | Stos na heksie wroga przy `attack_pending` | **ODDAL** (zależność, bez kodu) | W pinie stos też staje na końcu odcinka przed `tryLaunchMarchAttack` (`main.ts:44097-44107`, potem `:44184`); bitwa jest wprost poza ZAKRESEM pkt 3 dispatchu. Orkiestrator: wpis zależności `R-RUSTPORT-P4-1H-MARCH-ATTACK-LAUNCH` (tekst gotowy w `02a-obrona.md`) w `REJESTR-RUST.md`. |
| 3 | Widoczność celu ataku pominięta | **ODDAL** (NIE_ZMIERZONO, zależność P4-1C) | `PlayableState` nie ma mgły; wymyślanie zbioru widoczności łamałoby zasadę 11. Jawnie oznaczone w kodzie (`playable_movement.rs`, komentarze przy `attack_target` i `attack_pending`) i w raporcie Operatora. Do objęcia tym samym wpisem zależności co zarzut 2. |
| 4 | Niezmiennik `Eq` dla `MovementPoints` | **ODDAL** (naprawione w Obronie) | `MovementPoints::new` ma `debug_assert!(value.is_finite())`, `From<f64>` idzie przez `new`; 3 testy (2× `should_panic` NaN/Inf, 1× wartości skończone). Deserializacja omija `new`, ale `serde_json` nie przyjmuje NaN/Inf, więc niezmiennik trzyma. |
| 5 | `from_state` bez wołającego produkcyjnego | **ODDAL** | Konstruktor scenariuszy testowych, udokumentowany; ścieżka produkcyjna `move_unit` idzie przez `bridge.rs`. Brak wpływu na parytet. |

Brak orzeczeń NAPRAW i DO DECYZJI CZŁOWIEKA → werdykt PASS-WITH-NOTES (noty: rozszerzenie allowlisty o 2 pliki oraz wpis zależności w rejestrze — czynności orkiestratora).
