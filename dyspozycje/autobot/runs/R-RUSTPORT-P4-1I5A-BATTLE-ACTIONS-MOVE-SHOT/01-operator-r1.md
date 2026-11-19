# R-RUSTPORT-P4-1I5A-BATTLE-ACTIONS-MOVE-SHOT — Operator r1

STATUS: PASS-WITH-NOTES (Operator; nota: jawne odstępstwo od allowlisty w testach r2/r3/r4, §5)
DOMAIN: GAME (port Rust: DTO akcji bitwy, silnik, renderer)
TEMAT: R-RUSTPORT-P4-1I5A-BATTLE-ACTIONS-MOVE-SHOT (#370 I5a)
GOAL: warianty `Move` i `Shot` w `BattleActionKindDto` z walidacją, konwersja w silniku (`actions_to_dto` bez
`MoveWithoutDto`/`ShotWithoutDto`) i konsument w rendererze (`playback.rs`, wyczerpujący `match`), zgodne z pinem
`07d2fbd72` i z wektorami silnika.
BAZA: `origin/rust-port/parity-v2` = `32006733ba65bb22ff7776b104d1afb329841491` (zgodna z dispatchem).
GAŁĄŹ: `rust-port-wip/p4-1i5a-move-shot` (worktree `wf_2d48c121-c4f-1`).
ZMIANY/COMMIT: kod `841a54974` (ostatni commit kodu); raport w commicie następnym po nim na tej samej gałęzi. Commity
WIP: `5d3bb3a09` (view-model), `43ea95518` (engine), `3caee7568` (renderer), `c32e6a217`/`6e08626b1` (szkic raportu),
`4e6c1d64e` (siatka `tilesNow` w teście renderera), `841a54974` (test zwrotu przed krokiem). `git diff --check` czysty.
RUNDY: 1/5.
DEPLOY/PUSH: NIE WYKONANO (Operator nie pushuje).

## 1. Web najpierw (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`)

- `_doMove` `:8685-8776`: odmowa oblężenia (`:8689-8692`) i planowanie AUTO-batch (`:8693-8713`) kończą bez animacji
  (silnik nie emituje wtedy `Move`, `siege_tactics_loop.rs:2286-2330`). Ścieżka animowana: `occByKey`, `fromTopY/toTopY`
  odczytane PRZED `ru.q = col; ru.r = row` (`:8726-8731`), `_updateFacing(ru)` (`:8750`, zmienia `rotation.y` tylko gdy
  kierunek się zmienia, `:8334-8341`), `const t0 = this._now()` (`:8752`), krok `p = min(1, (now - t0)/MOVE_STEP_MS)`
  do `p >= 1` (`:8754-8771`). Stąd: `Facing` (gdy jest) i `Move` mają ten sam `t0`, `Facing` pierwszy; `arriveAt = t0 + 240`.
- `_doRangedAttack` `:9179-9235`: zwrot strzelca zawsze (`:9182-9184`), amunicja (`:9191-9194`), `kind =
  projectileKind(attacker.bu)` (`:9203`; `projectileKind` `:1661-1671` czyta `bu.kategoria` i `stats.Jednostka ?? bu.nazwa`),
  pocisk z tułowia strzelca do tułowia celu (`:9200-9201`), `projectiles.push({t0: this._now(), dur: RANGED_FLY_MS})`
  (`:9218-9221`), trafienie i `_spawnDamageLabel` po `_schedule(RANGED_FLY_MS)` (`:9224-9227`).
- Decyzja D-WIR-7 (sprawdzona, bez pola `kind` w DTO): `PlacedUnit.spawn` ma `category` (= `bu.kategoria`) i `model_name`
  (= `String(bu.stats?.Jednostka ?? bu.nazwa)`), czyli wejścia `projectileKind`. Jedyna różnica: gdy oba źródła nazwy są
  `undefined`, web daje `''`, a `model_name` = `"undefined"`; żaden z wzorców `projectileKind` (`legionist`, `procar`,
  `sling`, `oszczep`, `javelin`, `atlatl`, `estolic`) nie występuje w `"undefined"`, więc wynik jest identyczny. Brak D-I5A-n
  (pole `kind` nie było potrzebne).

## 2. Zmiany

| Plik | Zmiana |
|---|---|
| `rust-port/view-model/src/battle.rs` | `BattleActionKindDto::Move { id, fromCol, fromRow, toCol, toRow, arriveAt }`, `Shot { attacker, target, landAt }` (camelCase, `deny_unknown_fields` z enumu); `validate_at`: `arriveAt`/`landAt` skończone i `>= t0`, `from != to` (sąsiedztwo nie wymagane, D-WIR-6), strzelec != cel. |
| `rust-port/view-model/tests/battle_actions_move_shot.rs` (nowy) | klucze JSON, round-trip (także czas niecałkowity), ścisłe klucze, walidacja Move/Shot. |
| `rust-port/engine/src/domain/siege_tactics_actions.rs` | `actions_to_dto`: `Move`/`Shot` → DTO 1:1; usunięte martwe `ActionError::MoveWithoutDto`/`ShotWithoutDto` (po zmianie testów r2/r3 nic ich nie używa); nowy `ActionError::Cell(i64)` dla pola poza `i32` (bez obcinania); komentarze I5 → I5a/I5b. |
| `rust-port/engine/tests/p4_1i5a_move_shot.rs` (nowy) | konwersja 1:1 na sekwencji zwrot+krok+zwrot+strzał+etykieta (id z rosteru obu stron), brak zamiany pól, `i32`, jednostka spoza rosteru, walidacja listy, warianty I5b nadal błędem. |
| `rust-port/engine/tests/p6_k5loop_close_r2.rs` | **POZA ALLOWLISTĄ (wymuszone GOAL, §5)**: test `move_bez_dto_to_jawny_blad` zastąpiony `move_dto_zgodne_z_wektorami`. |
| `rust-port/engine/tests/p6_k5loop_close_r3.rs` | **POZA ALLOWLISTĄ (wymuszone GOAL, §5)**: test `strzal_bez_dto_to_jawny_blad` zastąpiony `strzal_i_ruch_dto_zgodne_z_wektorami`. |
| `rust-port/engine/tests/p6_k5loop_close_r4.rs` | **POZA ALLOWLISTĄ (dodatek, §5)**: nowy test `move_i_shot_dto_1do1_w_wektorach_r4` (kryterium dispatchu „r3/r4”); istniejące testy bez zmian. |
| `rust-port/renderer/src/battle/playback.rs` | konsument: `Move` → kontrola `arriveAt == t0 + MOVE_STEP_MS` (`ArriveAt`), kontrola `from` == bieżąca komórka jednostki w scenie (`MoveFrom`), `MoveAnim::start(grid, unit, to, t0)`, krok animacji w `play_until` (jeden marsz na jednostkę); `Shot` → kontrola `landAt == t0 + RANGED_FLY_MS` (`ShotLandAt`), `projectile_kind(spawn.category, spawn.model_name)`, `ranged_shot_endpoints`, `launch_projectile`, lot w `tick_projectiles`. `SceneCall::MoveStart`/`UnitProjectile`, `moves_in_flight()`. `match` wyczerpujący, bez `_ =>`, bez `#[non_exhaustive]` (D-WIR-8). `dynamics.rs` bez zmian. |
| `rust-port/renderer/tests/battle_playback_move_shot.rs` (nowy) | scena P (wywołania pinu) == scena Q (odtworzenie DTO) na fiksturze `tests/fixtures/battle3d/dynamics.json` (6 kroków `move`, 4 strzały `shots` z wektorami lotu), pozycje bit w bit z wektorami webu, błędy, dwa kroki w jednej klatce. |

Nie ruszano: `siege_tactics_loop.rs`, `siege_battle_*`, `bridge.rs`, `client/`, `src-tauri/`, `gra/**`, `Cargo.toml`,
`renderer/Cargo.lock`, `REJESTR-RUST.md`, `dynamics.rs`, fikstur.

## 3. Testy i bramki

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`i5a/t-vm`, `i5a/t-eng`, `i5a/t-ren`), każdy usunięty po bramkach. Bramka renderera uruchomiona dopiero przy 14 GB wolnego
i bez innego builda (wcześniej 6–11 GB przez równoległy build innego tematu — odczekano).

| Crate | Bramka | Wynik |
|---|---|---|
| view-model | `cargo fmt --check` | EXIT 0 |
| view-model | `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| view-model | `cargo test --all-targets` | EXIT 0 (wszystkie binarki `ok`; nowy `battle_actions_move_shot`: 4/4) |
| engine | `cargo fmt --check` | EXIT 0 |
| engine | `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| engine | `cargo test --all-targets` (pełny, w tle, log `i5a/engine_full.log`) | EXIT 0: 543 wyniki `test result`, 4119 passed, 0 failed, 1 ignored (istniejący przed tematem, nie dodano `#[ignore]`) |
| engine | w tym `p4_1i5a_move_shot` | 9/9 |
| engine | w tym `p4_1i3_actions` | 6/6 |
| engine | w tym `bridge_contract` | ok |
| engine | w tym `p6_k5loop_close_r2` / `r3` / `r4` | 6/6, 6/6, 10/10 |
| renderer (bez `gpu`) | `cargo fmt --check` | EXIT 0 |
| renderer | `cargo clippy --all-targets -- -D warnings` | EXIT 0 (także po dodaniu ostatniego testu) |
| renderer | `cargo test --all-targets` | EXIT 0: 82 binarki, 725 passed, 0 failed, 0 ignored (log `i5a/renderer_test.log`); po dodaniu `facing_turn_before_step_matches_pin_calls` ponownie `battle_playback_move_shot` 6/6 i `battle_playback` 9/9 |

DŁUG-T1-LOCK: build renderera dopisał wpisy do `rust-port/renderer/Cargo.lock`; przywrócony (`git checkout`) przed
commitem, nie wchodzi do zmian.

Zgodność z wektorami silnika (sweep po WSZYSTKICH przypadkach, progi = zmierzone liczby):
- r2 (`vectors_r2.json`, 760+ przypadków): `actions_to_dto` 1:1 dla każdego; 572 scenariusze z ruchem, 1563 kroki `Move`
  = kroki pinu (`from` = pole po poprzednim kroku, `t0` z wektora, `arriveAt = t0 + 240`), 581 zwrotów `_updateFacing`
  bezpośrednio przed `Move` o tym samym `t0`.
- r3 (`vectors_r3.json`, 1040): 328 strzałów `Shot` = strzał pinu (cel z `blows`, `t0 = t − 380`, `landAt = t`), każdy
  poprzedzony zwrotem strzelca o tym samym `t0` z `facing` wektora; 328 etykiet `Damage` w `landAt`; 1292 kroki `Move`.
- r4 (`vectors_r4.json`, 1220, pierwsza aktywacja): 1467 kroków i 339 strzałów przez `actions_to_dto` 1:1 (bez `Leave`/
  `Shaken`, I5b).

Scena po odtworzeniu = scena po wywołaniach pinu (fikstura `tests/fixtures/battle3d/dynamics.json`):
- 6 kroków `move` (atk0 ×4, atk1 ×2), 22 próbki: cały `BattleScene3` P == Q, pozycja grupy i paska = wektor webu bit w bit,
  koniec marszu w tej samej próbce co web (`p >= 1`). Uwaga: wektory webu są liczone na siatce `tilesNow` (README fikstury,
  część 4); test ustawia ją w obu scenach (wcześniejsza wersja na `tilesRle` dawała różnicę `y` na wzgórzu — naprawione
  w `4e6c1d64e`).
- 4 strzały `shots` (strzała, proca, oszczep, pilum z kategorii strzelca): rodzaj = web, scena P == Q po każdym
  wystrzale i w każdym z 10 ticków, pozycje pocisków bit w bit z webem, odpięcie przy lądowaniu, liczba w locie = web.

## 4. Mutanty (≥ 10; każdy zabity)

Uruchamiane skryptem (mutant → test → przywrócenie pliku), log w scratchpadzie `i5a/mutants.log`.

| ID | Mutant | Wynik | Zabijające testy |
|---|---|---|---|
| VM1 | brak `arriveAt >= t0` | ZABITY | `walidacja_move` |
| VM2 | brak `from != to` | ZABITY | `walidacja_move` |
| VM3b | brak `landAt >= t0` (ramię `Shot`) | ZABITY | `walidacja_shot` |
| VM4 | brak strzelec != cel | ZABITY | `walidacja_shot` |
| VM5 | brak skończoności `arriveAt` | ZABITY | `walidacja_move` |
| EM1 | `from`/`to` zamienione w `actions_to_dto` | ZABITY | 5 testów (p4_1i5a, r2, r3, r4) |
| EM2 | kolumna/wiersz pola startu zamienione | ZABITY | 5 testów |
| EM3 | strzelec/cel zamienieni | ZABITY | 3 testy |
| EM4 | pole poza `i32` obcinane `as i32` zamiast `Cell` | ZABITY | `wspolrzedna_poza_i32_to_blad` |
| EM5 | błędne `arriveAt` (+1 ms) | ZABITY | 6 testów |
| EM6 | błędne `landAt` (−1 ms) | ZABITY | 3 testy |
| EM7 | błędne `t0` kroku w DTO (+1 ms) | ZABITY | 5 testów |
| EM8 | pominięty `Facing` (zwrot nie trafia do DTO) | ZABITY | 4 testy (w tym `move_dto_zgodne_z_wektorami`: zwrot o `t0` kroku bezpośrednio przed `Move`) |
| EM9 | id jednostki kroku z przeciwnej strony rosteru | ZABITY | 6 testów |
| RM1 | renderer: brak kontroli `arriveAt == t0 + MOVE_STEP_MS` | ZABITY | `move_and_shot_errors_are_reported` |
| RM2 | renderer: brak walidacji komórki bieżącej (`from`) | ZABITY | `move_and_shot_errors_are_reported` |
| RM3 | renderer: zły rodzaj pocisku (zawsze strzała) | ZABITY | `shot_playback_equals_pin_calls_and_web_vectors` |
| RM4 | renderer: zamienione końce lotu | ZABITY | `shot_playback_equals_pin_calls_and_web_vectors` |
| RM5 | renderer: błędne `t0` marszu (`arriveAt` zamiast `t0`) | ZABITY | 3 testy |
| RM6 | renderer: brak kontroli `landAt == t0 + RANGED_FLY_MS` | ZABITY | `move_and_shot_errors_are_reported` |
| RM7b | renderer: pominięty `Facing` (zwrot bez skutku) | ZABITY | `facing_turn_before_step_matches_pin_calls` |
| RM8 | renderer: zamienione kolumna/wiersz celu kroku | ZABITY | 3 testy |
| RM9 | renderer: błędne `t0` pocisku (`landAt`) | ZABITY | 2 testy |
| RM10 | renderer: marsz nie krokowany w klatce | ZABITY | 2 testy |
| RM11 | renderer: nowy `Move` nie zastępuje marszu w locie | ZABITY | `two_steps_in_one_frame_follow_the_logical_cell` |

Razem: 25 mutantów na kodzie tematu (VM 5, EM 9, RM 11), 25 zabitych, 0 równoważnych. Historia: RM7 (pierwsza wersja) PRZEŻYŁ — kroki
fikstury nie zmieniają kierunku (facing 1 = kierunek startowy), więc pominięcie `set_facing` nie zmieniało sceny. Dodano
test `facing_turn_before_step_matches_pin_calls` (zwrot o 180° przed krokiem, P == Q i yaw różny od sceny startowej); po
nim RM7b ZABITY.

Uwaga: pierwsza wersja VM3 trafiła (przez niejednoznaczną kotwicę) w ramię `TowerShot`, nie `Shot`, i przeżyła test
nowego pliku (ramię `TowerShot` pilnuje `battle_actions.rs`, nie uruchomiony w tym przebiegu). Zastąpiona VM3b na właściwym
ramieniu (zabity). Nie liczona do wyniku.

## 5. Odstępstwo od allowlisty (jawne)

Zamiana `Err(MoveWithoutDto)`/`Err(ShotWithoutDto)` na DTO (GOAL dispatchu) z konieczności łamie dwa istniejące testy,
które asertowały ten błąd: `p6_k5loop_close_r2.rs::move_bez_dto_to_jawny_blad` (`:797-823` na bazie) i
`p6_k5loop_close_r3.rs::strzal_bez_dto_to_jawny_blad` (`:843-873`). Te pliki nie są w allowliście. Bez ich zmiany bramka
`cargo test` engine jest czerwona przy każdej implementacji GOAL, więc pozostawienie ich = FAIL. Zmiana ograniczona do
zastąpienia tych dwóch testów testami nowego zachowania (sweep po WSZYSTKICH wektorach r2/r3: konwersja 1:1, `Move` =
kroki pinu, `Shot` = strzał pinu, zwrot przed krokiem/strzałem, `Damage` strzału) + kopia helpera w każdym pliku (pliki
testów to osobne crate'y). W `p6_k5loop_close_r4.rs` dodano jeden test (bez zmian istniejących), bo dispatch wymaga
zgodności z wektorami r4, a buildera wektorów r4 nie da się użyć z innego pliku. Do decyzji Evaluatora/FC: akceptacja jako
wymuszone albo wskazanie innej drogi.

## 6. FC-U3 (Damage strzału w wektorach)

Dotyczy częściowo. Wektory r3 (`vectors_r3.json`, generator `p6_k5loop_close_r3_gen.mjs`) nie niosą `dmg` (rekord
`blows`: cel, `t`, łuk, `facing`, `ranged`). Sprawdzono więc spójność silnik→DTO: dla każdego z 328 strzałów r3 DTO ma
dokładnie jedną `Damage { target, dmg = BlowRecord::dmg }` z `t0 = landAt` (= `t` trafienia z wektora). Gałąź „pudło / cel
martwy → brak etykiety” (`:9225`) nie występuje w wektorach r3 (0 przypadków; `CountRolls` trafia zawsze) — NIE_ZMIERZONO
na wektorach; pokryta logiką testu (`n_miss`), ale bez przypadku. Dług poniżej.

## 7. Długi

- **I5b** (#370): warianty oblężnicze po T2 bez DTO i konsumenta: `Boulder`, `WallDamage`, `Ram`, `GateDamage`,
  `WallBreach`, `GateBreach`, `TowerDestroyed`, `ClimbWall`, `LeaveField`; także `Leave` i `Shaken` (r4). Ich jawne błędy
  `*WithoutDto` zostają.
- **FC-U3-MISS**: wektor pinu ze strzałem chybionym / w cel już martwy (brak `Damage`), np. generator r3 z rzutem pudła.
- **PLAYBACK-OVERLAP**: konsument zastępuje marsz jednostki będący w locie nowym `Move` (pin łańcuchuje kroki przez
  `done()`, więc w pinie nie ma nakładania). Test `two_steps_in_one_frame_follow_the_logical_cell` pilnuje wyniku przy
  zgrubnej klatce; brak wektora webu dla takiej sytuacji (nie występuje w pinie).
- Produkcyjny wołający playbacku dla `Move`/`Shot` (pętla w czasie rzeczywistym, rozpoznanie §0.5) — poza I5a.
- Wpis decyzji D-WIR-7 (brak pola `kind`) do `REJESTR-RUST.md` — orkiestrator (plik poza allowlistą).

## 8. Następny krok

Evaluator r1 (Opus): weryfikacja kodu, mutantów i odstępstwa od allowlisty (§5).
