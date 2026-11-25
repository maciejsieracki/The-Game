# R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1 — Evaluator r1 (adwersarialny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1
GOAL: `landAt` akcji `TowerShot`/`Boulder` w silniku = chwila, w której pin faktycznie wykonuje trafienie (siatka klatek). Renderer przyjmuje nominał i punkt siatki. Test kontraktu ma pokrycie > 0.
ZMIANY/COMMIT: oceniany stan `rust-port-wip/landat-tower-boulder-q1` = `2535578d3` (kod `56fddce83` + `c455bb480`). Baza `origin/rust-port/parity-v2` = `11c4a5805` (merge-base potwierdzony). Evaluator nie zmienia kodu, dopisuje tylko ten raport.
TESTY: wszystkie bramki odtworzone przez Evaluatora, każda z EXIT 0 (tabela w §2).
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Obrona r1 (uwagi E-1…E-5), potem Final Control
DEPLOY/PUSH: NIE WYKONANO

## 1. Najpierw web: pin 07d2fbd72 (odczyt własny przez `git show`)

- `_schedule` (`battleScene.ts:9595-9606`): `vTimers.push({ due: this._now() + Math.max(0, ms), … })`, gdzie `_now()` = `vNow` (`:9403`).
- `_drainTimers` (`:9616-9634`): `target = this._now()`. Wywołuje każdy zegar z `due <= target` i **nie przesuwa `vNow` do `due`**, więc callback wykonuje się w chwili klatki.
- `_runFastForward` (`:9410-9432`): `vNow += FF_STEP_MS`, `FF_STEP_MS = _scaledWallDelta(BATTLE_FRAME_WALL_MS)`.
- `_fireOneTower` (`:4223-4268`) wywołuje `_schedule(RANGED_FLY_MS, …)`, gdzie `RANGED_FLY_MS = 380`. `_attackWallTile` (`:7540-7568`) wywołuje `_schedule(700, …)`.

Wniosek: trafienie następuje w `t0 + ceil(nominał/F)*F`, czyli 384 i 704 przy klatce 16 ms. Zgadza się to z D-LTB-1 Operatora.

**Pomiar niezależny.** Uruchomiłem sondę Operatora (`01-operator-r1-sonda.mjs`, wykonuje tekst pinu przez generator) na 3 scenariuszach:

| scenariusz | klatka | rodzaj | `fire - t0` | liczba |
|---|---|---|---|---|
| `mur_machiny_wylom` | 16 | kamień / wieża | 704 / 384 | 36 / 23 |
| `b07_wzgorza_katapulta_zejscie_z_korony` | 16 | kamień / wieża | 704 / 384 | 204 / 5 |
| `fq_las_lucz2_d5_palisada_132_klatka4` | 4 | wieża | 380 | 40 |

Każde `t0` przy 16 ms leży na siatce. Pin rozstrzyga sprawę jednoznacznie, więc STOP ani ABC nie są potrzebne. Sonda tylko owija `_schedule` logowaniem i nie zapisuje wektorów (`WIRING_A_TRACE` kończy się `process.exit(0)` przed zapisem). Po przebiegu `vectors.json` ma MD5 `dae3e46efdffe94061347f93e7fc1038` i jest bez zmian w `git status`.

## 2. Bramki (odtworzone, EXIT)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. Własne `CARGO_TARGET_DIR` w scratchpadzie (`LANDAT-EV-target-engine`, `LANDAT-EV-target-rc`), oba usunięte po bramkach. Renderer budowałem bez `--features gpu`, przy 14 GB wolnego i 0 procesów `rustc` przed startem.

| crate | fmt --check | clippy --all-targets -D warnings | test --all-targets --no-fail-fast |
|---|---|---|---|
| engine | 0 | 0 | 0: **4276 passed / 0 failed / 1 ignored** (zgodnie z raportem Operatora; baza 4275 + 1) |
| renderer (gpu OFF) | 0 | 0 | 0: **747 / 0 / 0** (`landat_tb_*` ok) |
| client | 0 | 0 | 0: **40 / 0 / 0** (`engine_bridge_renderer`, `siege_battle_client` w środku) |

- Wektory pinu K5LOOP-WIRING-A: `wektory_pinu_pelnej_bitwy_bajt_w_bajt ... ok` (45/45).
- Kontrakt: `kontrakt_czasu_akcji_z_rendererem_klatka_16ms` ok, `kontrakt_land_at_wiezy_i_kamienia_rowny_chwili_trafienia` ok, `zgodnosc_akcji_strzalu_wiezy_z_pinem` ok.
- Kandydaci c1 (`kandydaci_z_pliku_na_zadanie`, pliki `march-inc/c128_{16,1}_pin.json` z MD5 `307d5942…` / `ed9a3c98…`): **@16 ms 128/128 ZGODNY, @1 ms (`WIRING_A_RUST_FF_STEP=1`) 128/128 ZGODNY**.
- `git diff --check 11c4a5805 HEAD`: czysto. Brak nowych `#[ignore]` i brak usuniętych asercji w diffie.
- Uwaga środowiskowa: build renderera nadpisuje `rust-port/renderer/Cargo.lock` (stan zastany, jak N3 Operatora). Przywróciłem go przez `git checkout`.

## 3. Allowlista

| plik | allowlista | ocena |
|---|---|---|
| `engine/src/domain/siege_tactics_loop.rs` | tak (emisja `land_at` + import) | zmiana ograniczona do 2 miejsc emisji i importu `ff_step_ms`. Zegary i `TOWER_FLY_MS`/`WALL_HIT_FLY_MS` bez zmian. OK |
| `engine/tests/p6_k5loop_wiring_a_pin.rs` | tak | OK |
| `renderer/src/battle/playback.rs` | tak | OK |
| `renderer/tests/battle_playback.rs`, `battle_playback_siege.rs` | tak | OK |
| `dyspozycje/.../R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1/*` | tak | OK |
| **`engine/tests/p4_1i3_actions.rs`** | **NIE** | patrz E-1 |

`gra/`, `src-tauri`, `view-model`, generatory wektorów i `Cargo.lock` są nietknięte. `siege_tactics_atk_b.rs` też bez zmian (`WALL_HIT_FLY_MS` zostaje 700).

## 4. Mutanty

Operator zgłosił 14/14 zabitych (E1–E8, R1–R6). Ich nie powtarzałem. Dodałem własne mutanty adwersarialne. Każdy to jedna podmiana tekstu, po której przywracałem plik. Po przebiegu `git status` był czysty.

| ID | mutant | wynik | zabójca |
|---|---|---|---|
| EV1 | wieża: `land_at = due + …` (nominalny `due` zegara salwy zamiast `v_now` klatki) | ZABITY | `kontrakt_land_at…`, `kontrakt_czasu…`, `zgodnosc_akcji_strzalu_wiezy_z_pinem` |
| EV9 | kamień: `frame_sched(...).max(704)` (stała 16 ms przemycona dla każdej klatki) | ZABITY | `kontrakt_land_at…` (bliźniaki @1/@4) |
| EV10 | wieża: `frame_sched(...).max(384)` | ZABITY | `kontrakt_land_at…` (bliźniaki @1/@4) |
| RV1 | renderer wieża: zakres `[t0+380, t0+384]` zamiast dwóch punktów | ZABITY | `landat_tb_tower_shot…` (offsety 381/383) |
| RV2 | renderer kamień: tylko punkt siatki (bez nominału) | ZABITY | 4 testy siege, w tym `landat_tb_boulder…` |
| RV3 | renderer wieża: tylko punkt siatki | ZABITY | `landat_tb_tower_shot…`, `tower_shot_playback_equals_pin_calls`, `invalid_steps_are_reported` |
| RV4 | renderer kamień: zakres `[t0+700, t0+716]` | ZABITY | `landat_tb_boulder…`, `siege_errors_are_reported` |
| EV6 | wpis `tower_in_flight` z `due = land_at` (siatka) zamiast nominału | **PRZEŻYŁ** | patrz E-2 |

Razem 14 mutantów Operatora i 7 moich nowej gałęzi zabitych (≥ 12). EV6 nie dotyczy nowej gałęzi, bo kod zostawia nominał bez zmian. Ujawnia jednak lukę w pokryciu istniejącej reguły D-FQ-2.

## 5. Ustalenia (zarzuty i uwagi)

- **E-1 (proces, nie blokuje): plik poza allowlistą `engine/tests/p4_1i3_actions.rs`.** Operator zgłosił go jawnie (§2a, D-LTB-2). Bez tej zmiany bramka engine byłaby czerwona (generator P4-1I3 woła callback w czasie ciągłym). Sprawdziłem, że zmiana netto **zaostrza** test. Dochodzą dwie asercje: `land_at == t0 + frame_sched(16, 380)` i trafienie dokładnie w `grid`. Stare okno `[land, land+16)` zostaje. Kodowanie `landAt` dla porównania z generatorem jest teraz odtwarzane z `t0 + 380`, a nie z `land_at` silnika, ale tę samą informację niesie nowa asercja wprost. Mutant EV1 zabija ten test. Wymagana jest decyzja orkiestratora o zgodzie (zapis w rejestrze).
- **E-2 (dług, nie blokuje): EV6 przeżywa.** Żaden test nie rozróżnia, czy `tower_in_flight` niesie nominalny `due` (`t0+380`) czy siatkowy (`t0+384`). Według pinu `_drainTimers` porządkuje zegary klatki po nominalnym `due`, więc nominał jest poprawny i kod go zachowuje. Pokrycie kolejności D-FQ-2 dla trafienia wieży wobec innych zegarów tej samej klatki pozostaje jednak niezmierzone. Proponuję dług „LANDAT-TB-TOWER-DUE-ORDER”: wektor, w którym inny zegar ma `due` w (t0+380, t0+384].
- **E-3 (uwaga): dowód pinu jest sondą, a nie zamrożonym wektorem.** Wektory K5LOOP-WIRING-A nie niosą czasów trafień. Test (b) w `kontrakt_land_at…` porównuje `landAt` silnika z chwilą skutku w strumieniu silnika (spójność wewnętrzna). Wartości 384/704 są zamrożone literalnie w `kontrakt_czasu…` i potwierdzone sondą pinu (odtworzoną przeze mnie, §1). Akceptuję to wobec brzmienia dispatchu („wyprowadź z kodu pinu i dodaj wektor/test z uzasadnieniem”). Na przyszłość warto dopisać czasy trafień do wektorów, co wymaga zgody na zmianę generatora.
- **E-4 (uwaga, FQ-SPEED #401): dwa źródła długości klatki.** Wieża liczy `ff_step_ms(clock)`, a kamień `ProdBody::frame_ms`. W sesji oba są równe (`siege_battle_session.rs:1332` ustawia `frame_ms = scaled_wall_delta(16)` przy zmianie prędkości). Bliźniaki @1/@4 są zielone. Renderer przyjmuje wyłącznie siatkę 16 ms (`PIN_FRAME_MS`), co jest istniejącym długiem #401.
- **E-5 (uwaga, N1 Operatora):** przy `auto_batch_planning` zegar wykonuje się synchronicznie (`RunNow`), więc `landAt` ≠ chwila trafienia. Gałąź jest dziś nieosiągalna w produkcji. Dług przyjęty.

Nie stwierdziłem osłabionych asercji, `#[ignore]` ani rozjazdu z decyzjami dispatchu (D-HFQ-1 analogicznie dla `TowerShot`/`Boulder`, `PlaybackError::LandAt`/`BoulderLandAt` zostają, testy negatywne są obecne).

## 6. Długi: zamknięte / zostaje

| dług | stan wg Evaluatora |
|---|---|
| N2 (HITAT-FQ) `landAt` wieży/kamienia | **ZAMKNIĘTE** (silnik 384/704 @16, renderer dwa punkty, kontrakt tower 1140 / boulder 1641 @16, mutanty zabite) |
| SHOT-LAND-AT-RENDER (#405) | ZOSTAJE (poza zakresem) |
| D-PIN3-3-SHOT-ID | ZOSTAJE (bez zmian; FIFO po celu, N4 Operatora) |
| FQ-SPEED (#401) | ZOSTAJE (E-4) |
| LANDAT-TB-TOWER-DUE-ORDER (nowy) | ZOSTAJE (E-2) |
| AUTO-planowanie a trafienie wieży (N1) | ZOSTAJE (E-5, nieosiągalne) |

## 7. Werdykt

**PASS-WITH-NOTES.** Kod realizuje GOAL zgodnie z tekstem pinu. Bramki trzech crate'ów są zielone (EXIT 0), wektory 45/45, kandydaci 128/128 @16 i @1, mutanty nowej gałęzi zabite. Do rozstrzygnięcia przez orkiestratora zostaje E-1 (zgoda na plik poza allowlistą). Pozycje E-2…E-5 to długi.
