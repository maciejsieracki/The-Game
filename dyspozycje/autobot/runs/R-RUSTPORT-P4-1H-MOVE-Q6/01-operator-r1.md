# R-RUSTPORT-P4-1H-MOVE-Q6 — Operator, runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-MOVE-Q6
GOAL: move_unit = planMarchTo + executeMarchSegmentForUnit (bez animacji), bez reguly "tylko sasiad",
      attack_unit_id w komendzie, PlayableUnit.movement/movement_max jako f64.
ZMIANY/COMMIT: gałąź robocza rust-port/wip/R-RUSTPORT-P4-1H-MOVE-Q6-op-r1, baza 9f1a29af3
      (SHA commitu: w wiadomości zwrotnej Operatora; ten plik jest w tym samym commicie)
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0;
      pełny cargo test silnika: 488/488 celów zielonych (3606 passed, 0 failed, 1 ignored — istniejący,
      nie z tego tematu); 4/4 mutacje dają FAIL
BLOKADY: brak blokad technicznych; 2 pliki poza literalną allowlistą (uzasadnienie w §5) — do oceny
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza i środowisko

- Baza: `origin/rust-port/parity-v2` = `9f1a29af32e0064d8b389bca3a403f0bef8b5348` (zgodna z dispatchem `9f1a29af3`).
- Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt przez `git show`).
- Dysk przed bramkami: 13–15 GB wolnego (`df -h /`), warunek ≥ 8 GB spełniony.
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo
  (scratchpad sesji, usunięty po bramkach). `Cargo.lock` nie jest commitowany.

## 2. Co zrobiono

### 2.1 `move_unit` = `planMarchTo` + pierwszy segment (`playable_movement.rs`, `playable.rs`)

- `PlayableGame::move_unit(unit_id, destination)` → `move_unit_with_attack(unit_id, destination, None)`.
- `move_unit_with_attack`: bramki komendy jak dotąd (`UnitNotFound`, `UnitNotOwned`, `UnitNotSelected`),
  potem `playable_movement::plan_march_to` (web `main.ts:31213-31298`), kolejność 1:1 z pinem:
  1. stos `playerStackAt` (Q5 `player_stack_at`), `occupiedForMove(owner, ...stack)` (Q4), `mover =
     unitWithPlanningStackRuch` (Q5);
  2. `attackTarget` = jednostka o `attackUnitId` (nieistniejąca → brak ataku, jak `units.find` → undefined)
     albo obca jednostka na celu (`!isMe && ownerId !== u.ownerId`, `:31245-31247`);
  3. `marchPathPlan` = `plan_path_turns_occ` + `apply_fog_to_path_plan` z budżetem
     `planningStackRuchLeft(stack)`; puste `fullPath` → `PlayableError::MarchNoRoute`
     („Marsz przerwany: brak trasy do celu”, `:31267-31270`);
  4. bez ataku: `!canOccupyHexForUnit` → `MarchForeignCity` (`:31271-31277`);
  5. bez ataku: `!canJoinStackAt(units, stack, dest, armyStackLimit())` → `MarchStackLimit { limit: 500 }`
     (`:31279-31282`; tekst `stackLimitBlockMessage`, `army-stack-limit.ts:221-223`);
  6. `markPlayerMovedUnit`, `plannedMarches.set` (istniejący wpis zostaje na swoim miejscu — web `Map.set`;
     nowy wpis bez `generalTargetId`), `marchStopNotified/Detail.delete`, `syncMarchAttackTarget`;
  7. `planningStackRuchLeft(stack) > 0` → `execute_march_segment_for_unit`.
- `execute_march_segment_for_unit` (web `:31477-31544` + koniec animacji `:44097-44107`, `:44180-44194`):
  `execute_march_step_occ` (Q3, pass-through), porażka → hint + `noteMarchStop`;
  `trimPathToStackRoom` (pusta → TYLKO `plannedMarches.delete`, przycięta → `pathCost`, `arrived=false`);
  przesunięcie całego stosu na ostatni heks; `deductStackRuchLeft` (każdy w stosie `max(0, min − koszt)`);
  potem `tryLaunchMarchAttack` (warunki) albo `finishMarchSegmentHints` (dotarcie → `plannedMarches.delete`).
- Przeniesione czyste funkcje pinu: `isNotifiableMarchStop`, `marchPausedLabel`, `registerMarchStop`
  (`planned-march.ts:511-541`), `noteMarchStop` (stanowa część `main.ts:31437-31452`),
  `finishMarchSegmentHints` (`main.ts:31454-31475`), `stackLimitBlockMessage`.
- Reguła „tylko sąsiad” usunięta (`playable.rs`, dawne `:1095-1107`), wraz z nieużywanym `axial_distance`
  i wariantami błędów `DestinationOutOfBounds`, `DestinationImpassable`, `DestinationNotAdjacent`,
  `DestinationOutOfRange` (web nie ma tych błędów: cel poza mapą → `computePath` = [] → „brak trasy”).
- `PlayableGame::from_state(state)` — konstruktor scenariusza testowego (kolejka faz bieżącej tury), bez komendy w UI.

### 2.2 `attack_unit_id` w komendzie (`bridge.rs`)

`EngineCommand::MoveUnit { unit_id, destination, attack_unit_id: Option<u64> }` z
`#[serde(default, skip_serializing_if = "Option::is_none")]` — dawny JSON `{unit_id, destination}` bez zmian.
Oba adaptery (`EngineBridge`, sesja) wołają `move_unit_with_attack`.

### 2.3 Errata 1 — ruch jako `f64` (decyzja techniczna)

- `PlayableUnit.movement` / `movement_max`: `u8` → `MovementPoints` (obwoluta `f64`, `.get()` zwraca `f64`).
  Powody obwoluty zamiast gołego `f64`:
  1. `PlayableState` derywuje `Eq` (wymagane przez `bridge.rs`); `Eq` ręczny przy niezmienniku „tylko
     skończone” — ten sam wzorzec co `PlayableReplaceEconomy`;
  2. JSON bajt w bajt: wartość całkowita serializuje się jak dawne `u8` (`1`, nie `1.0`; tak też
     `JSON.stringify`), ułamkowa jako liczba zmiennoprzecinkowa; odczyt przyjmuje obie formy;
  3. `war_world_view.rs` (poza allowlistą) woła `f64::from(u.movement)` — z gołym `f64` clippy
     (`useless_conversion`, `-D warnings`) wymusiłby zmianę tego pliku; z obwolutą `From<MovementPoints>
     for f64` kod się kompiluje bez zmian;
  4. `PartialEq<i32>` — istniejące asercje `assert_eq!(unit.movement, 1)` / `, 0)` w plikach testów poza
     allowlistą kompilują się bez zmian.
- Pierwsze odjęcie ułamkowego kosztu: `execute_march_segment_for_unit` (`max(0, pula − koszt)` na `f64`,
  bez zaokrągleń). Test: droga 1/3 + 1/3 → ruch `1 − 2/3` = `0.33333333333333337`, JSON
  `"movement":0.33333333333333337`, odczyt bez straty.
- `replace_unit` zapisuje `MovementPoints::new(target.ruch_left)` zamiast `as u8`.
- Golden: `p6_unit_replace_l3_state::zapis_sprzed_etapu_2_jest_wyjsciem_generatora_startu` (fixture JSON
  sprzed zmian) zielony; nowy test `json_ruchu_calkowitego_bez_zmian_ksztaltu` sprawdza
  `"movement":2,"movementMax":2` i identyczny zapis po odczycie.

### 2.4 Lista plików testów z literałami `PlayableUnit { … }` (errata 1)

Polecenie na bazie: `git grep -l 'PlayableUnit {' 9f1a29af3 -- rust-port/engine/tests` → 11 plików:

```
tests/p4_1h_cancel_planned_march.rs
tests/p4_1h_move_model.rs
tests/p4_1h_preview_path.rs
tests/p4_1j_general_target_vectors.rs
tests/p4_1j_planned_march_bounds.rs
tests/p4_1j_planned_march_pin_vectors.rs
tests/p4_1j_planned_march_state.rs
tests/p6_eliminacja.rs
tests/p6_wire_war_march_adapter.rs
tests/p6_wire_war_view.rs
tests/view_city_pin_vectors.rs
```

Zmiana w każdym: `movement: N` → `MovementPoints::from(N_u8)` (albo `MovementPoints::from(movement)` w
helperach) + jeden `use`. Żadnych zmian asercji.

## 3. Wektory / testy (`tests/p4_1h_move_q6.rs`, 20 testów; wartości liczone ręcznie z pinu)

| Wektor dispatchu | Test | Źródło pinu |
|---|---|---|
| cel w zasięgu: dotarcie, plan usunięty | `cel_w_zasiegu_dociera_i_usuwa_plan` | `planned-march.ts:182-209`, `main.ts:31463-31464` |
| cel wieloturowy: plan zostaje, `turn_stops` | `cel_wieloturowy_zostawia_plan_i_turn_stops` (przed: (2)t1,(4)t2,(5)t3; po: (4)t1,(5)t2) | `planned-march.ts:235-262` |
| brak trasy → błąd | `brak_trasy_daje_march_no_route_bez_zmian` (woda w korytarzu, cel poza mapą, cel = pozycja) | `main.ts:31267-31270`, `planned-march.ts:226-228` |
| obce miasto | `obce_miasto_na_celu_odrzuca_rozkaz`, `obce_miasto_na_trasie_blokuje_trase` | `main.ts:31271-31277`, `:14578-14584` |
| limit stosu 500+1 / 499+1 | `limit_stosu_500_plus_1_odmowa`, `limit_stosu_499_plus_1_dopuszczone` (stała testu `ARMY_STACK_LIMIT_PIN = 500`) | `main.ts:4358-4360`, `battleScene.ts:721`, `:723`, `army-stack-limit.ts:56-66` |
| cel = własna jednostka | `cel_wlasna_jednostka_to_zwykly_marsz_ze_scaleniem`, `wlasna_jednostka_na_trasie_nie_jest_koncem_segmentu` | `main.ts:31245-31247`, `planned-march.ts:271-275` |
| cel = wróg → plan, bez bitwy | `cel_wrog_zapisuje_plan_ataku_bez_bitwy`, `jawny_attack_unit_id_i_nieistniejacy_cel`, `cel_wroga_w_zasiegu_konczy_na_granicy_bitwy` | `main.ts:31243-31255`, `:31124-31143` |
| brak MP → plan bez segmentu | `brak_ruchu_zapisuje_plan_bez_segmentu` | `main.ts:31294-31296` |
| golden JSON | `json_ruchu_calkowitego_bez_zmian_ksztaltu` + istniejący fixture L3 | — |
| dodatkowe | ułamkowy koszt drogi, stos rusza razem (pula = minimum), kolejność planów `Map.set`, bramki komendy, cel nieprzejezdny obok (koszt 0), etykiety/deduplikacja powodów | `road-movement.ts:14`, `:81`; `armyMerge.ts:961`; `setup.ts:1201-1215`; `planned-march.ts:511-546` |

`tests/playable_slice.rs`: test `movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations`
zastąpiony `movement_rejects_route_less_destinations_and_plans_multi_hex_marches` (cel poza mapą →
`MarchNoRoute`; cel 2 heksy → plan, pierwszy odcinek 1 heks) — zgodnie z rozpoznaniem §4 wiersz Q6
(„aktualizacja `tests/playable_slice.rs:58-68` (oczekiwania sąsiedztwa)”).

## 4. Mutacje (skrypt: podmiana w kodzie, `cargo test --test p4_1h_move_q6 --test playable_slice --test p6_unit_replace_l3_state`, przywrócenie)

| Mutacja | Wynik | Testy FAIL |
|---|---|---|
| (a) przywrócenie reguły „tylko sąsiad” w `move_unit_with_attack` | **FAIL** (exit 101) | 12 (m.in. `cel_w_zasiegu…`, `cel_wieloturowy…`, `limit_stosu_499…`, `ulamkowy_koszt…`, `movement_rejects_route_less…`) |
| (b) limit stosu 499 zamiast 500 (`ARMY_STACK_LIMIT - 1` w `plan_march_to`) | **FAIL** | 1 (`limit_stosu_499_plus_1_dopuszczone`) |
| (c) koszt ułamkowy zaokrąglany (`pooled - cost.round()`) | **FAIL** | 1 (`ulamkowy_koszt_drogi_odejmowany_bez_zaokraglen`) |
| (d) pominięcie planu przy celu wieloturowym (`finishMarchSegmentHints` usuwa plan zawsze) | **FAIL** | 6 (m.in. `cel_wieloturowy…`, `cel_wrog_zapisuje_plan…`, `movement_rejects_route_less…`) |

Po mutacjach pliki przywrócone; `grep` na treść mutantów w `src/` = 0 trafień; `git diff --check` czysty.

## 5. Uwagi do allowlisty (do oceny Evaluatora)

Zmieniono 2 pliki spoza literalnej listy allowlisty (oba wymuszone przez zakres, zmiany minimalne):

1. `tests/playable_slice.rs` — jedyny test asercji reguły „tylko sąsiad” (`DestinationOutOfRange` dla celu
   o 2 heksy). Usunięcie reguły jest celem tematu (pkt 2 ZAKRESU) i mutacja (a) musi dać FAIL, więc ta
   asercja musiała się zmienić. Rozpoznanie (źródło OBOWIĄZKOWE dispatchu, §4 wiersz Q6) wprost wymienia
   ten plik: „aktualizacja `tests/playable_slice.rs:58-68`”. Pozostałe testy pliku bez zmian.
2. `tests/p6_unit_replace_l3_state.rs` — 1 linia: `before.units[0].movement = 0;` →
   `= civ_engine::domain::playable::MovementPoints::ZERO;`. Przypisanie literału całkowitego do pola
   ruchu nie kompiluje się po zmianie typu wymaganej erratą 1 (dotyczy każdej reprezentacji `f64`); plik
   nie ma literału `PlayableUnit {`, więc polecenie z erraty go nie wykazało.

`war_world_view.rs` (poza allowlistą) pozostał bez zmian dzięki `MovementPoints` (§2.3 pkt 3).
`save_load.rs` bez zmian (pole ruchu nie ma tam własnej obsługi; zapis/odczyt przez serde `PlayableUnit`).

## 6. NIE_ZMIERZONO / poza stanem (zatrzymane gałęzie, bez zgadywania)

- **Widoczność celu ataku** (`currentVisible()`, `main.ts:31248-31251`, `:31135`) — brak widoczności w
  `PlayableState` (P4-1C). Warunek pominięty (cel traktowany jak widoczny). NIE_ZMIERZONO.
- **Bitwa po dotarciu** (`tryLaunchMarchAttack` → `clearPlannedMarch(force)` + `openPlayerMapUnitAttack`) —
  poza zakresem. Gdy warunki startu ataku są spełnione (cel istnieje, `hexDistance <= 1`), wynik
  `attack_pending = true`, plan z `attackUnitId` zostaje, `finishMarchSegmentHints` nie jest wołane (jak w
  webie przy udanym starcie). Uwaga: jak w pinie, odcinek może wejść na heks wroga (cel ataku jest
  dopuszczony przez `canOccupy`), więc do czasu tematu bitwy jednostka może stać na heksie wroga.
- **Errata 2 (`ownerId === 0`)**: `moveCostFnForUnit` → `ownerHasSeafaring` ma gałąź `ownerId === 0`;
  jak w Q5 przyjęto `cost_fn = None` (bez Żeglugi). `isMe` = `players[].is_human` na surowym `PlayerId`.
  Mapowanie gracz 0/1 — NIE_ZMIERZONO.
- **Errata 3**: strażnik `isMe(uSel.ownerId)` hovera nie przeniesiony do silnika (zostaje bramka
  `UnitNotOwned` komendy, istniejąca wcześniej).
- **Brak pól w `PlayableState`** (skutki końca animacji nieprzeniesione): `embarked`
  (`applyEmbarkStateAfterMove` — cel na wodzie jest osiągany jak w pinie kosztem 0, bo `pathCost` liczy
  `Infinity` jako 0, ale flagi zaokrętowania nie ma gdzie zapisać), oblężenie (`oblegaCityId`,
  `siegeBlocksEntry`, `validateActiveSieges`), `syncGeneralMarchTargets`, mgła/odkrycie, chatki, obozy
  barbarzyńców, bonusy wizyty miast, `tryAutoCaptureEmptyCityAt`, `sweepFortCaptures`, propozycja scalenia,
  `isAwaitingFirstPlayerCity`, `clearScoutAutoExplore`, karta „Trasa wstrzymana” w `warEventLog`.
- Wykonanie planów na końcu tury (`runPlannedMarchesAtPlayerEndTurn`) — poza zakresem Q6 (osobny temat).

## 7. Bramki (EXIT)

| Bramka (w `rust-port/engine`) | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` | pełny zestaw: 488 celów (lib + 487 plików `tests/`), 3606 passed, 0 failed, 1 ignored (istniejący) |

Pełny test uruchomiono jednym `cargo test --all-targets --no-fail-fast` (251 celów w limicie 580 s polecenia
pierwszego planu), a pozostałe 237 celów (w tym przerwany w limicie czasu `p6_m07b3_q3`) tym samym
zbudowanym artefaktem w 4 partiach `cargo test --no-fail-fast --test …` (60+60+60+57 celów), każda EXIT 0.
Suma wyników: 488 linii `test result: ok`, 0 `FAILED`.

Brak `#[ignore]` i osłabionych asercji w zmienionych/nowych plikach.
