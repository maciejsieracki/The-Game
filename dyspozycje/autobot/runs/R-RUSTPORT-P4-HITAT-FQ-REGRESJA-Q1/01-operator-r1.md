# R-RUSTPORT-P4-HITAT-FQ-REGRESJA-Q1 — Operator r1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-HITAT-FQ-REGRESJA-Q1
GOAL: przywrócić zgodność kontraktu silnik ↔ renderer po FRAME-QUANT (`PlaybackError::HitAt` w E2E klienta) przy niezmienionych 42 wektorach pinu.
BAZA: `origin/rust-port/parity-v2` = `3e5db0673b26c0838d23f621e8727ffd051a9c88` (merge FRAME-QUANT FC 80b97acc4). Gałąź robocza: `rust-port-wip/hitat-fq-q1`.
ZMIANY/COMMIT: kod `5e6614e00` (renderer playback + testy), `a9d96a33f` (test kontraktu silnika, fmt, raport, mutanty); gałąź `rust-port-wip/hitat-fq-q1`.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (02-evaluator.md).
DEPLOY/PUSH: NIE WYKONANO

## 1. Web najpierw (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`)

- `_doMeleeAttack` `:9096-9175`: `const t0 = this._now()`, pętla `_raf(stepAnim)`; cios w `stepAnim` przy
  `if (!hitDone && localT >= BLOW_HIT_T)` (`:9122`), gdzie `localT = this._now() - t0`. `_now()` w kroku `_raf` = czas
  klatki (krok 16 ms, `FF_STEP_MS = _scaledWallDelta(BATTLE_FRAME_WALL_MS)`, `:9419`). Mechaniczny i wizualny cios pada
  więc w **pierwszej klatce z `localT >= 150`**, czyli przy klatce 16 ms w `t0 + 160`, nie w `t0 + 150`.
- `_doRangedAttack` `:9223`: `_schedule(RANGED_FLY_MS, …)` → `_drainTimers` (`:9616-9634`) odpala w pierwszej klatce
  `vNow >= due`, czyli `t0 + ceil(380/16)*16 = t0 + 384`.
- Silnik po FRAME-QUANT emituje dokładnie te chwile (`siege_tactics_loop.rs` `:4845` `hit = frame_raf(frame, body_ms)`,
  `:4877` `hit_at = saved + dur`; `:4157` `land_at = t_shot + frame_sched(frame, 380)`), a renderer
  (`playback.rs:746`, `:879`) wymagał równości z nominałem → `HitAt { t0: 137600, hit_at: 137760 }`.

## 2. Decyzja techniczna D-HFQ-1 (wariant A)

Wybrano **A: renderer akceptuje czas zdarzenia na siatce klatek pinu**. Uzasadnienie pinem: §1 — w pinie przy klatce 16 ms
cios pada w `t0 + 160`, a strzał ląduje w `t0 + 384`; silnik ma rację, renderer miał model nominalny. Wariant B
(nominalny `hit_at` w DTO) odrzucony: DTO kłamałoby względem chwili ciosu (`Damage` pada w `t0 + 160`), a wektory
42 nie porównują `hit_at` (0 wystąpień `hit_at`/`hitAt` w `vectors.json`), więc B nie miał oparcia w pinie.

Forma walidacji (dokładna, bez okna): `is_pin_event_time(t0, nominal, at)` = `at == t0 + nominal` **albo**
`at == t0 + pin_frame_time(PIN_FRAME_MS, nominal)`, `pin_frame_time(F, ms) = ceil(ms/F)*F` (F ≤ 0/NaN lub ms ≤ 0 →
nominał), `PIN_FRAME_MS = 16` (`BATTLE_FRAME_WALL_MS`, `:2552`). Akceptowane są tylko dwa punkty: nominalny (oś
nominalna, klatka 0/1 ms — dotychczasowe testy renderera i pętli) i punkt siatki 16 ms sesji. Odrzucono okno
`[t0+nom, t0+nom+F)` z dispatchu, bo przepuszczałoby `t0+151` (osłabiłoby istniejący test `+1.0` dla `ShotLandAt`,
D-WIR-7). Klatka stała 16 ms, bo `PlaybackOpts` jest budowane w `client/src/lib.rs:1324` (poza allowlistą), a
`speedMul ≠ 1` występuje wyłącznie w `diag_set_speed_mul` (diagnostyka testów silnika, klient go nie woła).

Zakres (tylko to, co łamie renderer/klienta przy klatce 16 ms):
| Akcja | Silnik @16 ms | Renderer przed | Po |
|---|---|---|---|
| `Melee.hit_at` | `t0+160` | `== t0+150` → **HitAt** | siatka/nominał |
| `Shot.land_at` | `t0+384` | `== t0+380` → **ShotLandAt** (dług SHOT-LAND-AT-RENDER) | siatka/nominał |
| `Move.arrive_at` | `t0+240` (240 = 15·16) | `== t0+240` | bez zmian |
| `TowerShot.land_at` | `t0+380` (nominalny, `:1095`) | `==` | bez zmian |
| `Boulder.land_at` | `t0+700` (nominalny) | `==` | bez zmian |
| `Ram.until` | `t0+320` (nominalny) | `==` | bez zmian |

Silnik: **bez zmian w kodzie** (`siege_tactics_loop.rs`, `siege_tactics_actions.rs`, `siege_battle_session.rs` nietknięte).
`client/tests/siege_battle_client.rs`: bez zmian (asercje nieosłabione).

## 3. Zmiany (allowlista)

- `rust-port/renderer/src/battle/playback.rs`: `PIN_FRAME_MS`, `pin_frame_time`, `is_pin_event_time`; walidacja
  `Melee` i `Shot` przez `is_pin_event_time`; dokumentacja wariantów `HitAt`/`ShotLandAt` i tabeli modułu.
- `rust-port/renderer/tests/battle_playback.rs`: `hitat_fq_pin_frame_time_matches_pin_frame_grid` (wartości siatki,
  granice, NaN/0/ujemne; 9 złych offsetów ciosu, 7 złych strzału), `hitat_fq_melee_on_frame_grid_is_played_like_nominal`
  (cios `t0+160` przyjęty, ta sama scena i te same wywołania co nominalny; 144/151/159/161/166/176/192 → `HitAt`, scena nietknięta).
- `rust-port/renderer/tests/battle_playback_move_shot.rs`: `hitat_fq_shot_on_frame_grid_is_played_like_nominal`
  (`t0+384` przyjęte, scena jak nominalna; 368/379/381/383/385/396/400 → `ShotLandAt`).
- `rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs` (tylko dopisek): `kontrakt_czasu_akcji_z_rendererem_klatka_16ms` —
  wszystkie 30 scenariuszy z krokiem 16 ms w czasie rzeczywistym; każda akcja z czasem ma odstęp zgodny z rendererem
  (melee 160, shot 384, move 240, tower 380, boulder 700, ram 320). Pokrycie zmierzone:
  `{boulder: 1641, melee: 385, move: 9326, ram: 580, shot: 920, tower: 991}`. Wektory 42 i lista wyjątków bez zmian.
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-HITAT-FQ-REGRESJA-Q1/`: ten raport i skrypt mutantów.

Poza commitem: `rust-port/renderer/Cargo.lock` był przepisywany przez cargo (brak `civ-view-model`/`serde_json`
w zatwierdzonym lockfile na bazie — dług istniejący, poza allowlistą); przywrócony `git checkout`, nie commitowany.

## 4. Regresja odtworzona na bazie

- Klient na bazie: objaw z dispatchu (`HitAt { t0: 137600, hit_at: 137760 }`, 10 testów). Po zmianie:
  `cargo test --test siege_battle_client` → 18 passed, 0 failed (log `hitat-client.log`).
- Test czuły na stary kod: mutanty R10 (warunek `Melee` jak na bazie) i R11 (warunek `Shot` jak na bazie) są ZABITE
  przez nowe testy renderera (`hitat_fq_melee_…`, `hitat_fq_shot_…`), czyli te testy padają na kodzie bazy.

## 5. TESTY (EXIT 0; CARGO_INCREMENTAL=0, debug off, CARGO_TARGET_DIR w scratchpadzie `hitat-target`)

| Bramka | Wynik |
|---|---|
| renderer `cargo fmt --check` | 1. przebieg EXIT=1 (tylko zawijanie linii w nowym teście) → `cargo fmt` → EXIT=0 |
| renderer `cargo clippy --all-targets -- -D warnings` (gpu OFF) | EXIT=0 |
| renderer `cargo test` (gpu OFF) | EXIT=0; 745 passed, 0 failed, 0 ignored |
| client `cargo fmt --check` / `clippy --all-targets -D warnings` | EXIT=0 / EXIT=0 |
| client `cargo test` (wszystkie, w tym `engine_bridge_renderer`, `siege_battle_client`) | EXIT=0; 36 passed, 0 failed |
| engine `cargo fmt --check` / `clippy --all-targets -D warnings` | EXIT=0 / EXIT=0 |
| engine `cargo test --all-targets --no-fail-fast` | EXIT=0; 4225 passed, 0 failed, 1 ignored (istniejący `dump_tick1_econ_for_web_generator`); `wektory_pinu_pelnej_bitwy_bajt_w_bajt` ok |

Po rozszerzeniu testu kontraktu na wszystkie 30 scenariuszy (po pełnej bramce) ponowiono: engine `fmt --check` EXIT=0,
`clippy --test p6_k5loop_wiring_a_pin -D warnings` EXIT=0, test `kontrakt_czasu…` ok (43,8 s). Wolny dysk w trakcie: 11 GB
(start 6,9 GB przy równoległej budowie innego tematu; renderer budowany przy ≥ 11 GB, jedna wspólna budowa).
Liczba testów silnika (4225+1) różni się od „4242" z dispatchu — NIE_ZMIERZONO, skąd liczba w dispatchu.

## 6. Mutanty (18; zabite 17) — `01-operator-r1-mutanty.py` (log `*.log` jest w .gitignore; kopia w scratchpadzie `hitat-mut.log`)

R1 ceil→floor, R2 ceil→round, R3 `frame>0`→`>=0`, R4 bez `nominal>0`, R5 `||`→`&&`, R6 tylko siatka, R7 tylko nominał,
R8 okno zamiast siatki, R9 klatka 32, R10 melee: warunek bazy, R11 shot: warunek bazy, R12 melee ze stałą strzału,
R13 shot ze stałą ciosu, R14 melee bez walidacji, E1 silnik: cios nominalny, E2 silnik: strzał nominalny,
E4 silnik: `Move.arrive_at` +16 — wszystkie **ZABITE**.

**E3 PRZEŻYŁ** (`hit_at = saved + hit` zamiast `saved + dur`): różni się wyłącznie przy `attack_pre > 0` (cios po
krokach `_advanceStep`, K5DOC-T8, doktryna `steady`/`aggressive`). W żadnym z 30 scenariuszy sesji 16 ms ta gałąź nie
występuje (sprawdzone: mutant przeżył po rozszerzeniu testu na wszystkie scenariusze). Pokrycie wymagałoby testu
jednostkowego w `siege_tactics_loop.rs` (allowlista: „tylko to, co konieczne" — nie ruszano). Do oceny Evaluatora.

## 7. Reguła do bramek integracji (propozycja dla orkiestratora → `REJESTR-RUST.md`)

„Każda zmiana strumienia akcji silnika (czasy/kolejność/nowe warianty `BattleAction`, kwantyzacja zegara) ⇒ bramka
integracji obejmuje także `client` (`cargo test`, w tym `siege_battle_client`, `engine_bridge_renderer`) i `renderer`
(`cargo test`, gpu OFF), nie tylko `engine`." Plus test kontraktu po stronie silnika
`kontrakt_czasu_akcji_z_rendererem_klatka_16ms` pilnuje odstępów czasów akcji bez budowy renderera.

## BLOKADY

Brak. Uwagi: E3 (§6); dług `renderer/Cargo.lock` (§3); klatka renderera stała 16 ms — przy produkcyjnym `speedMul ≠ 1`
(dziś brak wołającego) trzeba będzie przekazać klatkę w `PlaybackOpts` (zmiana w `client/src/lib.rs`).
