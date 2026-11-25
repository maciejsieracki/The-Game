# R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1 — Operator r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1
GOAL: `landAt` akcji `TowerShot` i `Boulder` w silniku = chwila, w której pin faktycznie wykonuje trafienie (siatka klatek), renderer akceptuje nominał i punkt siatki, test kontraktu z pokryciem > 0.
ZMIANY/COMMIT: gałąź `rust-port-wip/landat-tower-boulder-q1`, baza `origin/rust-port/parity-v2` = `11c4a5805337faf97bdea6cbf9c35fac6108641f`; commity kodu `56fddce83` (silnik + renderer + testy kontraktu) i `c455bb480` (testy renderera, fmt, skrypt mutantów); raport w osobnym commicie (SHA w odpowiedzi Operatora).
TESTY: engine fmt/clippy EXIT 0, pełny `cargo test --all-targets --no-fail-fast` EXIT 0 (4276 passed / 0 failed / 1 ignored; baza 4275 + 1 nowy test); client fmt/clippy/test EXIT 0 (40/0/0); renderer (gpu OFF) fmt/clippy/test EXIT 0 (747/0/0; baza 745 + 2 nowe); wektory pinu K5LOOP-WIRING-A 45/45 (`wektory_pinu_pelnej_bitwy_bajt_w_bajt` ok); kandydaci c1 128/128 @16 ms i 128/128 @1 ms; mutanty 14/14 zabite.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO

## 1. Najpierw web: co pin robi naprawdę

Pin `07d2fbd72`, `gra/src/battle/battleScene.ts` (czytany przez `git show`):

- `_fireOneTower` (`:4223-4268`): pocisk z `dur: RANGED_FLY_MS` (`:4261`), trafienie `this._schedule(RANGED_FLY_MS, …)` (`:4262`), `RANGED_FLY_MS = 380` (`:1012`).
- `_attackWallTile` (`:7540-7568`): `_spawnCatapultBoulder` (`:7552`), trafienie `this._schedule(700, …)` (`:7555`).
- `_schedule` (`:9595-9606`): `vTimers.push({ due: this._now() + ms, … })`.
- `_drainTimers` (`:9616-9634`): `target = this._now()` (vNow klatki), odpala każdy zegar z `due <= target`, a **nie przesuwa `vNow` do `due`**. Callback (trafienie) wykonuje się więc w chwili klatki, czyli w pierwszej klatce z `vNow >= due`.
- `_runFastForward` (`:9415-9437`): `vNow += FF_STEP_MS`, `FF_STEP_MS = _scaledWallDelta(16)` (16 ms przy `speedMul = 1`).

Wniosek z kodu: wystrzał wieży i atak katapulty dzieją się w chwili klatki `t0` (wołane z zegara lub kroku `_raf`), trafienie w `t0 + ceil(380 / F) * F` i `t0 + ceil(700 / F) * F`, czyli 384 i 704 przy klatce 16 ms. Animacja pocisku i kamienia zachowuje nominalną długość (380, 700).

### 1a. Pomiar na wykonaniu pinu (sonda)

Wektory K5LOOP-WIRING-A nie zawierają czasów trafień wieży ani kamienia (tylko stan końcowy). Dlatego dodałem sondę: `01-operator-r1-sonda.mjs`. Sonda uruchamia generator `p6_k5loop_wiring_a_gen.mjs`, czyli wykonuje cały tekst pinu. Strażnik SHA-256 pinu pozostaje nietknięty. Sonda dopisuje tylko diagnostykę po `new BattleScene(opts)`: owija `_schedule` wywołane z `_fireOneTower` (ms 380) i `_attackWallTile` (ms 700), a następnie loguje `t0` oraz `vNow` w chwili wykonania callbacku. Uruchomiłem ją dla wszystkich 45 scenariuszy wektorów, z klatką każdego scenariusza (16, a bliźniaki `frameMs` 1 i 4):

| klatka | rodzaj | `fire - t0` | liczba |
|---|---|---|---|
| 16 ms | wieża | **384** | 1137 |
| 16 ms | kamień | **704** | 1640 |
| 4 ms | wieża | 380 | 185 |
| 4 ms | kamień | 700 | 46 |
| 1 ms | wieża | 380 | 409 |
| 1 ms | kamień | 700 | 365 |

`t0` poza siatką klatki: 0. Kamień występuje w 11 scenariuszach, wieża w 42. Pin rozstrzyga sprawę jednoznacznie, więc STOP ani pytanie ABC nie są potrzebne. Surowe dane sondy (3782 linie) znajdują się w scratchpadzie jako `LANDAT-TB-probe-all.txt` (MD5 `9c58e973cbb8b4bc93cc8cb2ad23e31b`). Plik nie jest commitowany i można go odtworzyć sondą.

Silnik po zmianie emituje (test `kontrakt_land_at_wiezy_i_kamienia_rowny_chwili_trafienia`): wieża @16 1140, @4 186, @1 409; kamień @16 1641, @4 46, @1 366. Różnica 0–3 względem pinu wynika z tego, że sonda liczy trafienia, które NASTĄPIŁY, a silnik wystrzały. Pocisk wystrzelony tuż przed końcem bitwy nie trafia (`finished` czyści zegary, `:9620`).

## 2. Zmiany (jeden spójny zestaw: silnik + renderer + test kontraktu)

**Decyzja techniczna D-LTB-1:** `landAt` = chwila wykonania trafienia w pinie, czyli `t0 + ceil(nominał / F) * F`. Stała nominalna (`TOWER_FLY_MS`, `WALL_HIT_FLY_MS`) i zegar zostają bez zmian, bo `_schedule(ms)` w pinie dostaje nominał, a kwantyzację robi `_drainTimers`. Zmienia się wyłącznie wartość emitowana w akcji.

- `engine/src/domain/siege_tactics_loop.rs`
  - `tower_shoot`: `land_at = clock.v_now + frame_sched(ff_step_ms(clock), TOWER_FLY_MS)`. Pętla nie zna klatki ciała (`B: LoopBody`), dlatego klatkę liczy z zegara. Jedynym sterownikiem zegara jest `run_fast_forward` z krokiem `ff_step_ms(clock)` = `FF_STEP_MS`. Wpis `tower_in_flight` zachowuje nominalny `due`, bo służy do porządku zegarów w klatce (D-FQ-2).
  - `siege_atk_wall_tile`: `land_at = self.now + frame_sched(self.frame_ms, WALL_HIT_FLY_MS)` według tej samej reguły co `Shot` (`:4720`). Klatka `0` (testy pętli bez klatki) daje nominał 700. Zegar `take_timers` zostaje nominalny.
  - import `ff_step_ms`. `siege_tactics_atk_b.rs` bez zmian, bo `WALL_HIT_FLY_MS` zostaje 700.
- `renderer/src/battle/playback.rs`: `TowerShot` i `Boulder` przyjmują dokładnie dwa punkty przez `is_pin_event_time` (nominał oraz `t0 + pin_frame_time(16, nominał)`), analogicznie do `Melee`/`Shot` (D-HFQ-1). Każda inna chwila daje `PlaybackError::LandAt` / `BoulderLandAt`. Zaktualizowałem dokumentację wariantów błędów i tabelę modułu. Animacja pocisku (`dur = RANGED_FLY_MS`) i kamienia (`BOULDER_MS`) bez zmian.
- `engine/tests/p6_k5loop_wiring_a_pin.rs`
  - `kontrakt_czasu_akcji_z_rendererem_klatka_16ms`: wieża 384, kamień 704 (było 380/700). Pokrycie obejmuje teraz także `boulder` (wymagane > 0). Liczniki: `{"boulder": 1641, "melee": 444, "move": 10258, "ram": 667, "shot": 996, "tower": 1140}`.
  - nowy `kontrakt_land_at_wiezy_i_kamienia_rowny_chwili_trafienia`: wszystkie 45 scenariuszy (bliźniaki przy swojej klatce). Sprawdza (a) `landAt - t0 = frame_sched(F, nominał)` oraz (b) `landAt` = `t0` skutku trafienia w strumieniu akcji: `Clash` z aktorem `Tower(row)` na ten sam cel dla wieży, `WallDamage` tego wiersza dla kamienia, w parach FIFO. Wyniki: trafień wieży 748, kamienia 2051, bez pary 688. Bez pary są chybienia wieży bez `_pushClash` oraz trafienia pominięte (cel martwy, koniec bitwy). Pokrycie > 0 jest wymagane także przy 16 ms.
- `renderer/tests/battle_playback.rs` (`landat_tb_tower_shot_on_frame_grid_is_played_like_nominal`) i `renderer/tests/battle_playback_siege.rs` (`landat_tb_boulder_on_frame_grid_is_played_like_nominal`): nominał i punkt siatki dają te same wywołania sceny i tę samą scenę. Przesunięcia 0, ±1, ±3, ±12/16, +20 wokół obu punktów dają błąd, a scena pozostaje nietknięta (test negatywny).

### 2a. Plik poza allowlistą (uzasadnienie, D-LTB-2)

`engine/tests/p4_1i3_actions.rs` (`zgodnosc_akcji_strzalu_wiezy_z_pinem`) porównuje zakodowany `towerShot … <landAt>` z generatorem P4-1I3. Ten generator woła callback dokładnie w `landAt` (czas ciągły, komentarz w teście `:788-790`). Po zmianie silnika test padał wyłącznie na tekście `landAt` (102 rozbieżności, np. `884` zamiast `880`). Wprowadziłem minimalną zmianę samego testu: `landAt` silnika musi być równy `t0 + frame_sched(16, RANGED_FLY_MS)`, a trafienie musi paść DOKŁADNIE w nim (zaostrzenie względem dotychczasowego okna `[land, land+16)`). Do porównania z generatorem `landAt` wraca do nominału, tak jak test już robił z `t0` trafienia. Bez tej zmiany bramka engine byłaby czerwona. Plik nie jest na liście „Nie ruszać”. Evaluator powinien potwierdzić zgodę.

## 3. Bramki (EXIT 0)

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR` w scratchpadzie (`LANDAT-TB-target-engine`, potem `LANDAT-TB-target-rc`), oba usunięte po bramkach.

| crate | fmt --check | clippy --all-targets -D warnings | test --all-targets --no-fail-fast |
|---|---|---|---|
| engine | 0 | 0 | 0 — 4276 passed / 0 failed / 1 ignored |
| renderer (gpu OFF) | 0 | 0 | 0 — 747 / 0 / 0 |
| client | 0 | 0 | 0 — 40 / 0 / 0 (`engine_bridge_renderer`, `siege_battle_client` w środku) |

Bramka renderera: wolne 14 GB, bez równoległych buildów renderera (`ps` rustc = 0 przed startem).

Wektory pinu K5LOOP-WIRING-A: 45/45 (`wektory_pinu_pelnej_bitwy_bajt_w_bajt` ok w pełnym teście). Zmiana dotyczy wyłącznie wartości `landAt` w akcjach, a nie przebiegu bitwy.

Kandydaci c1 (pliki `march-inc/c128_{1,16}_pin.json`, MD5 `ed9a3c98…` / `307d5942…`, te same co w MARCH-INCREMENTAL FC; test `kandydaci_z_pliku_na_zadanie`, binarka debug z bramki): **@16 ms 128/128 ZGODNY, @1 ms (`WIRING_A_RUST_FF_STEP=1`) 128/128 ZGODNY**.

## 4. Mutanty (14, wszystkie zabite)

Skrypt: `01-operator-r1-mutanty.py`. Każdy mutant to jedna podmiana tekstu, po której skrypt uruchamia testy i przywraca plik (`git status` czysty po przebiegu). Testy engine: `kontrakt_land_at_wiezy…`, `kontrakt_czasu_akcji…`, `zgodnosc_akcji_strzalu_wiezy_z_pinem`. Testy renderer: `landat_tb*`, `invalid_steps_are_reported`, `siege_errors_are_reported`.

| ID | mutant | wynik |
|---|---|---|
| E1 | wieża: stary nominał `v_now + TOWER_FLY_MS` | ZABITY |
| E2 | kamień: stary nominał `now + WALL_HIT_FLY_MS` | ZABITY |
| E3 | wieża: stała klatka 16 zamiast `FF_STEP_MS` | ZABITY (bliźniaki @1/@4) |
| E4 | kamień: stała klatka 16 zamiast klatki ciała | ZABITY |
| E5 | wieża: `floor` zamiast `ceil` (368) | ZABITY |
| E6 | wieża: o klatkę za późno (400) | ZABITY |
| E7 | kamień: o klatkę za późno (720) | ZABITY |
| E8 | kamień: `floor` zamiast `ceil` (688) | ZABITY |
| R1 | renderer wieża: tylko nominał | ZABITY |
| R2 | renderer kamień: tylko nominał | ZABITY |
| R3 | renderer wieża: bez kontroli `landAt` | ZABITY |
| R4 | renderer kamień: bez kontroli `landAt` | ZABITY |
| R5 | renderer wieża: stała kamienia | ZABITY |
| R6 | renderer kamień: stała wieży | ZABITY |

Mutant równoważny (nie liczony, zapisany jawnie): `frame_sched` ↔ `frame_raf` w obu miejscach (`frame_raf` = `frame_sched`, `:1986-1988`).

## 5. Uwagi

- N1: tryb planowania AUTO (`auto_batch_planning`) wykonuje `_schedule` synchronicznie (`RunNow`), więc trafienie wieży nastąpiłoby w `v_now`, a nie w `landAt`. W produkcji pole nie jest nigdzie ustawiane na `true` (`grep auto_batch_planning =` = 0 trafień, sesja `false`), więc gałąź jest nieosiągalna. Zostaje jako dług na wypadek wpięcia planowania.
- N2: `v_now` zegara jest na siatce klatki, bo sterownik dodaje wyłącznie `FF_STEP_MS`. Przy zmianie `speedMul` w trakcie bitwy (FQ-SPEED, #401, poza zakresem) faza klatki może się przesunąć. Formuła liczy wtedy siatkę od `v_now`, tak jak pin (`_drainTimers` też od `vNow`). Renderer przyjmuje tylko siatkę 16 ms (`PIN_FRAME_MS`), co jest istniejącym długiem PlaybackOpts `frame_ms` z #401.
- N3: budowa renderera nadpisuje `rust-port/renderer/Cargo.lock` (+34 linie, stan zastany). Plik przywróciłem `git checkout` i nie commitowałem.
- N4: `tower_in_flight` dopasowuje trafienie po celu (FIFO na cel, nie na wiersz). Przy stałym locie kolejność jest zgodna z pinem. Bez zmian, poza zakresem.

## 6. Długi: zamknięte / zostaje

| dług | stan |
|---|---|
| N2 (HITAT-FQ): `landAt` wieży i kamienia nominalne, a trafienie na siatce | **ZAMKNIĘTE**: silnik emituje chwilę siatki, renderer przyjmuje oba punkty, kontrakt z pokryciem tower 1140 / boulder 1641 @16, mutanty E1–E8 i R1–R6 zabite |
| SHOT-LAND-AT-RENDER (#405) | **ZOSTAJE**: poza zakresem (dotyczy `Shot` po stronie renderera/klienta; ten temat nie zmienia `Shot`) |
| D-PIN3-3-SHOT-ID | **ZOSTAJE**: niezmienione (identyfikacja strzału/trafienia po celu; patrz też N4 dla wieży) |
| FQ-SPEED (#401) | **ZOSTAJE**: renderer przyjmuje tylko siatkę 16 ms; formuła silnika jest poprawna dla dowolnego `FF_STEP_MS` (bliźniaki @1/@4 zielone) |
| Planowanie AUTO a trafienie wieży (N1) | **ZOSTAJE (nowy, nieosiągalny dziś)** |

## 7. Artefakty

- `dyspozycje/autobot/runs/R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1/00-dispatch.md` (kopia dispatchu z `claude/rust-sivvrn`)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1/01-operator-r1-sonda.mjs` (sonda pinu)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1/01-operator-r1-mutanty.py` (mutanty)
