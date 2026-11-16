# R-RUSTPORT-P4-1I4-BATTLE-CONSUMER — Operator, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I4-BATTLE-CONSUMER (P4-1I4 / PRIO-3D-9 #277, #248)
GOAL: konsument `BattleActionDto` → wywołania sceny 3D (kolejność = kolejność akcji) i `BattleFrameDto` → paski, bez zmiany kształtu DTO z I2/I3.
ZMIANY/COMMIT: kod `84bfcfe84` (gałąź robocza `worktree-wf_965d78f9-294-1`, rodzic = baza `0deb9a075`); raport w commicie następnym po nim.
- `rust-port/renderer/src/battle/playback.rs` (NOWY, 669 linii)
- `rust-port/renderer/src/battle/mod.rs` (+1 linia: `pub mod playback;`)
- `rust-port/renderer/tests/battle_playback.rs` (NOWY, 7 testów)
- fikstury: bez zmian (użyte istniejące `tests/fixtures/battle3d/dynamics.json`); `Cargo.lock` nie commitowany (przywrócony).
TESTY: bramki w `rust-port/renderer` (CARGO_INCREMENTAL=0, DEBUG=0, `CARGO_TARGET_DIR` poza repo):
- `cargo fmt --check` → EXIT 0
- `cargo clippy --all-targets -- -D warnings` → EXIT 0
- `cargo test --all-targets --no-fail-fast` → EXIT 0; 68 zestawów, 557 passed, 0 failed, 0 ignored
- `cargo test --test battle_playback` → 7 passed
- `df -h /` przed bramkami: 18 GB wolnego.
BLOKADY: brak (uwagi niżej: luka DTO dla rodzaju pocisku wieży; ruch/taran/katapulta/wyłom bez wariantu DTO = I5).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO

## Baza

`0deb9a075` (FC P4-1I3; zawiera I2 `43709ed0a`). Worktree odłączony na bazie, gałąź robocza ustawiona na nią przed commitem
(`git merge-base --is-ancestor 0deb9a075 84bfcfe84` = prawda; jedyny rodzic). Pin webu: `07d2fbd72` (`gra/src/battle/battleScene.ts`, tylko odczyt).

## Co zrobiono

`civ_renderer::battle::playback::BattlePlayback`:
- `push_actions(&[BattleActionDto])`, `push_frame(&BattleFrameDto)` — kolejka FIFO (bez sortowania); czas nie może maleć (`OutOfOrder`), `push_actions` wszystko-albo-nic;
- `play_until(scene, now, wall_clock)` — wykonuje wszystkie pozycje z czasem `<= now` w kolejności listy, potem jedną klatkę animacji w `now` (lunge, pociski) — kolejność klatki webu, w której cios rozstrzyga się przed pozą (`stepAnim` `:9119-9156`);
- `apply_snapshot(frame)` — pełny resync HP+morale+amunicja (ścieżki resetu `:4581-4583`, `:4725-4727`, `:5497-5499`, `:17269-17271`; koniec przewijania, w którym silnik nie emituje `Damage`, `:9943`) — wołany jawnie przez wywołującego;
- `calls()` (ślad wywołań sceny), `labels()`, `hp()`, `projectiles()`, `lunges_in_flight()`, `queued()`.

Mapowanie (pin `07d2fbd72`):

| akcja | wywołanie w pinie | funkcja sceny |
|---|---|---|
| `Facing` | `rotation.y = dirYaw` `:8340`, `:9105`, `:9138`, `:9818` | `set_facing` |
| `Melee` | `_doMeleeAttack` `:9096-9175`, trafienie `t0 + BLOW_HIT_T` `:9122` | `MeleeLunge::start` + `step` (alive = `!removed`, `:9147`) |
| `TowerShot` | `_fireOneTower` `:4250-4262` | `fire_one_tower` → `launch_projectile`, `tick_projectiles` |
| `Damage` | `hp = max(0, hp-dmg)` + `_updateHpBar` `:8991-8992`, `_spawnDamageLabel` `:9125`/`:9142`/`:9940-9971` | `update_hp_bar` + `FloatLabel::damage` (+ tekst `'-'+dmg`, flaga strony gracza `:9951`) |
| `Kill` | `_startFade` → `_removeUnitFromScene` `:9927-9938`; przed nim cios zabójczy ustawił `hp=0` i `_updateHpBar` `:8991-8992`, `:9044-9047` | `update_hp_bar(0)` + `kill_unit`; drugi `Kill` = no-op (strażnik `:9928`) |
| `Rout` | `_startRout` `:9799-9825` (zwrot to osobny `Facing`) | brak zmiany sceny (ślad `RoutSfx`) |
| `Turn`/`Log`/`Clash`/`End` | DOM | brak (ślad `Ui`, P5) |

Ramka → paski: morale (`update_morale_bar`, `_updateMoraleBar` `:9652-9661`) i amunicja (`update_ammo_bar`, `:9671-9684`) dla jednostek nieusuniętych.
Pasek HP NIE z ramki: w pinie `_updateHpBar` jest wołane wyłącznie przy ciosie (`:8992`) i przy resetach — pasek idzie za akcjami.

Decyzje techniczne (do rejestru przez orkiestratora):
1. `Melee.hitAt != t0 + BLOW_HIT_T` i `TowerShot.landAt != t0 + RANGED_FLY_MS` → błąd (`HitAt`/`LandAt`), nie cicha korekta (animacja renderera ma stałe pinu).
2. Luka DTO: `TowerShot` nie niesie rodzaju pocisku (web: `projectileKind` syntetycznego strzelca wieży `:4238-4245`). Bez zmiany DTO (zakaz dispatchu) — wywołujący podaje `PlaybackOpts::tower_projectile` (`tower_projectile_kind(Typ, Jednostka)`); brak → `MissingTowerProjectileKind`. Do decyzji orkiestratora: dopisać pole w DTO w I5 lub w `BattleSetupDto.fort`.
3. `Kill` ustawia pasek HP na 0 (cios zabójczy w pinie zawsze daje `hp = 0` przed `_startFade`). Jedyny producent `Kill` w I3 to gałąź `hp <= 0` `_resolveBlowOutcome`. Śmierć katapulty na murze przy wyłomie (`:7704`, bez ciosu) to I5 — tam trzeba to zrewidować.
4. Ruch (`MoveAnim`), strzał jednostki (`launch_projectile` z `_doRangedAttack`), taran (`RamAnim`), katapulta (`Boulder`), wyłomy (`breach_*`) — brak wariantów DTO; nieobsługiwane (I5 #249/#280, zgodnie z NIE ROBIĆ).

## Wektory (testy `tests/battle_playback.rs`)

Dwie sceny z tego samego rekordu konstruktora `dynamics.json` (`siege`) + te same kroki marszu (zdarzenia `move`, przygotowanie):
P = bezpośrednie wywołania sceny w kolejności pinu; Q = odtworzenie listy akcji w kolejności producenta I3
(`ProdBody::start`/`complete`/`counter_strike`/`start_fade`). Id `atkN`/`defN` → `N`/`1000+N` (id nie wchodzi do węzłów sceny).

1. `melee_playback_equals_pin_calls_and_web_vectors` — 3 lunge z fikstury (`gen_dynamics.ts` cz. 2; `:9096-9175`, kontratak `:9134-9143`, zabicie atakującego `:9047`): w każdej z 18 próbek cały `BattleScene3` P == Q; pozycja atakującego bit-w-bit = wektor webu; moment ciosu = próbka, w której web liczy cios; koniec lunge = web; liczba etykiet = web (1/2/1); 4 etykiety (pozycja, start, czas, wznoszenie) = zdarzenie `labels` fikstury; ramki co odpalenie z morale.
2. `killing_counter_calls_follow_pin_order` — ślad wywołań zabójczego kontrataku: `SetFacing(att)`, `LungeStart`, `HpBar(def)`, `DamageLabel(def)`, `SetFacing(def)`, `HpBar(att,0)`, `KillUnit(att)` (`:9104-9105`, `:9112-9118`, `:8992`, `:9125`, `:9137-9138`, `:9047`/`:9933-9937`); drugi `Kill` = no-op (`:9928`).
3. `hp_bar_follows_the_blow_between_frames` — ramki tylko na granicach fazy (`t0` i `t0+BLOW_LUNGE_MS+BLOW_SETTLE_MS`, `:9150-9155`): pasek HP zmienia się w `hitAt` (`:8991-8992`, stosunek `_updateHpBar` `:9637-9639`), nie przy ramce.
4. `tower_shot_playback_equals_pin_calls` — mur z wieżami (`fortKind='mur'`), `_fireOneTower` `:4223-4270` + `_tickProjectiles`: P == Q w 6 próbkach, pocisk znika przy lądowaniu.
5. `frame_bars_and_snapshot` — ramka zmienia tylko morale+amunicję; `apply_snapshot` także HP (`:4581-4583`).
6. `invalid_steps_are_reported` — `HitAt`, `UnknownUnit`, `OutOfOrder`, `MissingTowerProjectileKind`, `NoTower`, `LandAt`; scena nietknięta; akcje UI bez zmian sceny.
7. `one_batch_keeps_list_order_and_web_positions` — trzy lunge jako jedna lista (`validate_actions` OK), bez ramek: pozycje = web, `LungeStart` zabitego przed `KillUnit`.

Ograniczenie porównania z fiksturą (jawne): generator `gen_dynamics.ts` stubuje `_singleBlow` (nie zmienia HP/pasków, zabicie = tylko `fadingOut`), więc pasków i widoczności zabitego nie porównuję z fiksturą — te części są porównane P == Q (wywołania pinu: `_updateHpBar` `:8992`, `_removeUnitFromScene` `:9910-9925`). Pozycje, momenty ciosu, końce lunge i etykiety — wprost z fikstury.

## Mutacje (muszą dać FAIL) — wykonane skryptem na kopii `playback.rs`, plik przywrócony (`diff` pusty)

| mutacja | zmiana | wynik |
|---|---|---|
| (a) pominięcie `FloatLabel` | w gałęzi `Damage` brak `labels.push` | FAIL 3/7: `melee_playback…` (`lunge 0 labels` 0 != 1), `tower_shot…` (0 != 1), `one_batch…` (0 != 4) |
| (b) odwrócenie `MeleeLunge`/`kill_unit` | `push_actions` kolejkuje akcje `Kill` przed resztą listy | FAIL 2/7: `killing_counter…` (`call 2`: `HpBar(2,0)` zamiast `HpBar(0,31)`), `one_batch…` (`lunge 0 t=20050 pos[2]` — lunge nie wystartował, kolejka zablokowana przez `Kill`) |
| (c) pasek HP z ramki zamiast z akcji | `Damage` nie rusza paska; `apply_frame` ustawia HP z `frame.hp` | FAIL 4/7: `hp_bar_follows…` (`t=20150`: 1.0 != 0.8157…), `killing_counter…` (brak `HpBar(def)` w śladzie), `tower_shot…` (`t=5380` scena != pin), `frame_bars_and_snapshot` |

Uwaga do (c): przy ramkach dostarczanych po KAŻDYM odpaleniu (I2 `record_frames`) HP ramki i HP z akcji są równe w chwilach ramek (cios i ramka w tym samym odpaleniu), dlatego test 1 tę mutację przepuszcza; rozjazd jest widoczny między ramkami (test 3: od `hitAt` do ramki na końcu fazy) i w śladzie wywołań.

## NIE_ZMIERZONO

- Odtwarzanie strumienia wyprodukowanego przez prawdziwy silnik (`SiegeLoop` + `record_frames` + `actions_to_dto`) — renderer nie zależy od `civ-engine` (Cargo.toml poza allowlistą); listy akcji w testach zbudowane ręcznie wg kolejności emisji `ProdBody`.
- Ścieżka przewijania (FF): `apply_snapshot` istnieje, ale DTO nie niesie flagi FF — kiedy go wołać, decyduje wywołujący (P5/sterownik).
