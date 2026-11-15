# R-RUSTPORT-P4-1H-RJ-REPIN-Q3 — Operator r1

```text
STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-RJ-REPIN-Q3
GOAL: dryf RJ (ruch marszu) do pinu 07d2fbd72: R1–R4, R6 + trim_path_to_stack_room, wektory z uruchomionego pinu
ZMIANY/COMMIT: kod cc7cde088 (gałąź rust-port-wip/R-RUSTPORT-P4-1H-RJ-REPIN-Q3-r1, rodzic be49ff3c3); raport w commicie następnym
TESTY: fmt EXIT 0, clippy -D warnings EXIT 0, cargo test --all-targets --no-fail-fast EXIT 0 (483 binarek, 3523 passed, 0 failed, 1 ignored = dług bazy)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

**Baza:** `origin/rust-port/parity-v2` = `be49ff3c3d5b52073a92012664fd897321b60c73` (sprawdzone `git rev-parse` po `git fetch`).
**Pin:** `07d2fbd72` (`gra/src/**` tylko odczyt, przez `git show` / `git archive`). `gra/`, `origin/main`, `parity-v2` nietknięte; bez push.
**Model:** Opus (dispatch: OPUS we wszystkich rolach serii P4-1).

## 1. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/pathfinding.rs` | moduł `ruch_jednostek`: nowe typy i funkcje (niżej); stare API zachowane jako cienkie opakowania |
| `rust-port/engine/src/domain/army_follow_auto_merge.rs` | `trim_path_to_stack_room` (`army-stack-limit.ts:86-99`) |
| `rust-port/engine/tests/p4_1h_rj_repin.rs` | NOWY: 7 testów wektorowych |
| `rust-port/engine/tests/p4_1h_rj_repin_vectors/gen.mjs` | NOWY: generator na `git archive 07d2fbd72` + strażnik SHA-256 |
| `rust-port/engine/tests/p4_1h_rj_repin_vectors/vectors.json` | NOWY: wektory (sha256 `d4d6b1d2e5c4ceae1b2e48554e5e08aa1e2c17683bf94419f2dfaa66d9574024`) |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-RJ-REPIN-Q3/` | raport, `mutate-r1.py` + `mutate-r1.txt`, logi bramek |

`mod.rs` bez zmian (nowy moduł nie powstał). `Cargo.lock` niecommitowany. `p6_4_*` bez zmian (pkt 4).

### Nowe API (`ruch_jednostek`, `pathfinding.rs`)

| Rust | Pin `07d2fbd72` |
|---|---|
| `SiegeEntryFn` (`dyn Fn(&RuchJednostka, i32, i32) -> bool`), parametr `siege: Option<&SiegeEntryFn>` | `siegeBlocksEntry` / `setSiegeEntryBlocker` (`setup.ts:692-733`) — jawny predykat zamiast globalnego rejestru; `None` = `siegeEntryBlocker === null`. Cache `withSiegeScope` pominięty (czysta optymalizacja). |
| `MoveOccupancy { blocked, pass_through }`, `MoveOccupancy::from_blocked` | `class MoveOccupancy extends Set` (`setup.ts:750-752`); zwykły `Set` = pusty `pass_through` |
| `build_move_occupancy`, `end_blocked_keys`, `is_pass_through_hex`, `trim_segment_end_off_pass_through` | `setup.ts:759-776`, `:787-791`, `:794-796`, `:803-813` |
| `compute_path_with_siege` (R4) | `computePath`/`computePathImpl` (`setup.ts:1019-1185`), blokada przed gałęzią celu (`:1138-1139`) |
| `plan_path_turns_occ` (R1) | `planPathTurns` (`planned-march.ts:215-285`, trim `:271-275`) |
| `should_stop_at_obstacle_occ` (R2) | `shouldStopAtObstacle` (`:288-350`, trim `:311-313`) |
| `execute_march_step_occ` (R3), `OWN_UNIT_IN_REACH_DETAIL` | `executeMarchStep` (`:353-434`, gałąź `:388-400`) |
| `is_notifiable_march_stop`, `march_paused_label`, `register_march_stop<K>`, `clear_march_stop<K>` (R6) | `planned-march.ts:511-546`; wejście stanu = `BTreeMap<K, MarchStopReason>` (odpowiednik `march_stop_notified`) |
| `army_follow_auto_merge::trim_path_to_stack_room` | `army-stack-limit.ts:86-99`; `limit` parametrem (gra: `armyStackLimit()` = 500 = `save_migrations::ARMY_STACK_LIMIT`) |

Stare `compute_path`, `plan_path_turns`, `should_stop_at_obstacle`, `execute_march_step` (wejście `&HashSet`) delegują do wspólnych `*_impl` z pustym `pass_through` i `siege = None` — to dokładnie zachowanie pinu dla zwykłego `Set` i braku blokady (`instanceof MoveOccupancy` = false, `siegeEntryBlocker === null`). Wołający w `src/` i testy `p6_4_*` bez zmian.

**Decyzja techniczna (do REJESTR-RUST przez orkiestratora; plik poza allowlistą):** detal R3 „własna jednostka na trasie — brak wolnego heksu w zasięgu” jest stałą `OWN_UNIT_IN_REACH_DETAIL` w `pathfinding.rs`, nie w `data/derived/ruch-jednostek-params.json` (plik danych poza allowlistą). Test `vectors_pin_guard_and_constants` porównuje stałą z literałem pinu zapisanym w wektorach. Etykiety R6 (`marchPausedLabel`) biorą istniejące teksty z `marsz.teksty` (`zablokowany_heks`, `obce_miasto`, `brak_trasy`) — wektory potwierdzają zgodność.

## 2. Wektory (z URUCHOMIONEGO pinu)

Generator `node rust-port/engine/tests/p4_1h_rj_repin_vectors/gen.mjs` (Node v22.23.4; sam uruchamia się ponownie z `--experimental-transform-types`): `git archive 07d2fbd72 gra/src gra/data` → `os.tmpdir()` (poza repo, usuwany), import prawdziwych `units/setup.ts`, `game/planned-march.ts`, `game/army-stack-limit.ts` (hak ładowania: `.ts`, `.json`), `configureTerrainMovement(gra/data/terrain-movement.json)`. Bez stubów logiki. `--check` → „vectors.json zgodny z pinem” (sprawdzone).

**Strażnik SHA-256 (zielony):** 21 fragmentów wyciętych po nazwie z plików archiwum (`siegeBlocksEntry`, `withSiegeScope`, `MoveOccupancy`, `buildMoveOccupancy`, `isPassThroughHex`, `trimSegmentEndOffPassThrough`, `computePath`, `computePathImpl`, `pathCost`, `truncatePathToBudget`, `planPathTurns`, `isMarchAttackDest`, `shouldStopAtObstacle`, `executeMarchStep`, `isNotifiableMarchStop`, `marchPausedLabel`, `registerMarchStop`, `clearMarchStop`, `ownUnitCountAt`, `canJoinStackAt`, `trimPathToStackRoom`); skróty w `EXPECTED_SHA` generatora, niezgodność → EXIT 2. Test Rust `vectors_pin_guard_and_constants` sprawdza, że każdy skrót zapisany w wektorach występuje w `EXPECTED_SHA` pliku `gen.mjs`.

**Liczba przypadków per kategoria** (`counts` w `vectors.json`, przeliczane w teście `march_vectors_cover_dispatch_categories`):

| Grupa | Kategoria | Liczba |
|---|---|---|
| marsz (450 przypadków; każdy = `computePath` + `planPathTurns` + `shouldStopAtObstacle` + `executeMarchStep`) | pass-through na środku trasy | 260 |
| | koniec segmentu przycięty (`segment_end_trimmed`) | 158 |
| | jedyny heks w zasięgu = własna jednostka (R3 `obstacle`) | 110 |
| | cel = własna jednostka = scalenie | 54 |
| | oblężenie celu | 35 |
| | oblężenie heksu pośredniego | 45 |
| | zwykły `Set` (stare API, bez `passThrough`) | 40 |
| | inne (obce jednostki, obce miasto, brak trasy, cel = start) | 70 |
| bezpośrednie | `buildMoveOccupancy` (+ `isPassThroughHex`, 6 sond na przypadek, na `MoveOccupancy` i zwykłym `Set`) | 40 |
| | `trimSegmentEndOffPassThrough` | 60 |
| limit stosu | granice: 499+1 dopuszczony, 500+1 odmowa, 498+2 dopuszczone, 499+2 odmowa | 4 |
| | obce nie liczone, ruszający się już na heksie, trim ostatniego pełnego, trim do pustej, pusta ścieżka, pusty `moving` | 6 |
| | losowe (limit 1–5 i 500) | 40 |
| powiadomienia | `isNotifiableMarchStop` | 6 |
| | `marchPausedLabel` (6 powodów × 4 detale, w tym `''`) | 24 |
| | sekwencje `registerMarchStop`/`clearMarchStop` (142 operacje, stan po każdej) | 25 |

Kategorie marszu nakładają się (jeden przypadek może mieć kilka). Łącznie przypadków: 450 + 100 + 50 + 55 = 655 (≥ 200). Wyniki `stopReason` w `executeMarchStep`: ok bez stopu 247, `obstacle` 110, `no_path` 40, `no_movement` 34, `blocked_city` 19.

## 3. Mutacje (wszystkie FAIL — `mutate-r1.py`, log `mutate-r1.txt`)

| Mutacja | Wynik |
|---|---|
| M1 R1: usunięty trim w `plan_path_turns` | EXIT 101, `march_vectors_match_pin_07d2fbd72` FAILED |
| M2 R2: usunięty trim w `should_stop_at_obstacle` | EXIT 101, `march_vectors_match_pin_07d2fbd72` FAILED |
| M3 R3: pusty segment bez `obstacle` | EXIT 101, `march_vectors_match_pin_07d2fbd72` FAILED |
| M4 R4: brak blokady oblężenia dla celu | EXIT 101, `march_vectors_match_pin_07d2fbd72` FAILED |
| M5: `trim_path_to_stack_room` bez przycinania | EXIT 101, `stack_limit_trim_matches_pin_with_limit_500_boundaries` FAILED |

Każda mutacja była przywracana po teście (skrypt w `finally`); po serii `git status` pokazał tylko zamierzone zmiany.

## 4. Stare `p6_4_*` (`edb8fb56`)

Bez zmian oczekiwań. Uzasadnienie: dryf pinu zmienia wynik tylko dla `MoveOccupancy` z niepustym `passThrough` albo przy aktywnej blokadzie oblężenia; wektory `p6_4` używają zwykłego `Set` i nie ustawiają blokady. Potwierdzenie z pinu: 40 przypadków `plain_set` w nowych wektorach (wynik pinu @07 ze zwykłym `Set`) przechodzi przez stare API; test `legacy_api_equals_occupancy_api_without_pass_through` (450 przypadków) potwierdza równość starego API i nowego z pustym `pass_through`. `p6_4_core`, `p6_4_march` i pozostałe `p6_4_*` zielone w pełnym `cargo test`.

## 5. R5 — `computeReachable@07` (nie implementowane, tylko zbadane)

Wynik: **lista różnic z odczytu diffu** `git diff edb8fb56 07d2fbd72 -- gra/src/units/setup.ts` (hunki `computeReachable`); wektorami **NIE_ZMIERZONO**. Względem Rust `compute_reachable` (`pathfinding.rs`, bez zmian w tym temacie):
1. `passThrough` (`setup.ts:856-858`, `:952-953`): heks z własną jednostką jest rozwijany w Dijkstrze (heapPush), ale **nie** trafia do zbioru zasięgu.
2. Blokada oblężenia w Dijkstrze (`setup.ts:942-943`): `siegeBlocksEntry` pomija heks po sprawdzeniu `occupied`, przed liczeniem kosztu.
3. MIN-MOVE (sąsiad przy budżecie ≥ 1, `setup.ts:974`): dodatkowo wymaga `!passThroughKeys.has(nKey) && !siegeBlocksEntry(...)`.
4. `withSiegeScope` (`setup.ts:845-847`) — tylko cache, bez wpływu na wynik.
Innych hunków w `computeReachable` między `edb8fb56` a `07d2fbd72` diff nie pokazuje. Dotyczy `reachable` (P4-1F / Q5), nie trasy.

## 6. Bramki (`rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo)

| Bramka | Kod wyjścia | Log |
|---|---|---|
| `cargo fmt --check` | 0 | `gate-fmt-r1.txt` |
| `cargo clippy --all-targets -- -D warnings` | 0 | `gate-clippy-r1.txt` |
| `cargo test --all-targets --no-fail-fast` | 0 (483 binarki testowe, 3523 passed, 0 failed, 1 ignored: `e2e::dump_tick1_econ_for_web_generator` — dług bazy) | `gate-test-r1.txt` (wyciąg) |
| `node .../gen.mjs --check` | 0 („zgodny z pinem”) | — |

Uwaga procesowa: katalog scratchpad jest współdzielony z innymi agentami — pierwszy pełny przebieg testów (wspólny `scratchpad/target`) został przerwany przez cudze sprzątanie (`No such file or directory` dla binarek), a wspólny `test.log` był nadpisywany przez inny proces. Wiarygodny przebieg powyżej: osobny katalog `scratchpad/rjq3r1/tgt-rjq3r1` (usunięty po bramkach). Brak `#[ignore]` w nowych testach; żadnych osłabionych asercji.

## 7. NIE_ZMIERZONO / uwagi dla Evaluatora

- R5 jak w pkt 5 (bez wektorów).
- Pamięć podręczna `siegeScopeCache` pinu nie jest portowana (czysta optymalizacja; wynik predykatu ten sam).
- Nowe funkcje nie mają jeszcze produkcyjnego wołającego z `PlayableState` (adapter = `R-RUSTPORT-P4-1H-MOVE-MODEL-Q4`).
- `register_march_stop` przyjmuje `BTreeMap<K, MarchStopReason>`; stan gry trzyma `BTreeMap<UnitId, PlayableMarchStopReason>` — mapowanie typów w Q4/Q6.
