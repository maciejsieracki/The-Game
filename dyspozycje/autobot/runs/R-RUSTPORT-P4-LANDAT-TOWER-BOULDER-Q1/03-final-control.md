# R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1 — Final Control (r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1
GOAL: `land_at` akcji TowerShot/Boulder w silniku = chwila, w której pin faktycznie wykonuje trafienie (siatka klatek). Renderer przyjmuje nominał i punkt siatki. Test kontraktu ma pokrycie > 0.
ZMIANY/COMMIT: oceniany stan `452f3dd29` (obrona) ← `a85205993` (Evaluator) ← `2535578d3` (raport Operatora) ← kod `c455bb480` + `56fddce83`. Baza `11c4a5805` = `origin/rust-port/parity-v2`, zgodnie z dispatchem (merge-base potwierdzony). FC dopisuje tylko ten plik, na gałęzi `rust-port-wip/R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1-fc`.
TESTY: wszystkie bramki odtworzone przez FC z EXIT 0 (§2).
BLOKADY: brak. E-1 jest decyzją techniczną orkiestratora do wpisania w rejestr, nie czeka na właściciela.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (wpis D-LTB-1 i D-LTB-2 w `REJESTR-RUST.md`, merge na `parity-v2`)
DEPLOY/PUSH: NIE WYKONANO

## 1. Web najpierw: pin `07d2fbd72` (odczyt własny przez `git show`)

- `RANGED_FLY_MS = 380` (`battleScene.ts:1012`). `_fireOneTower` wywołuje `_schedule(RANGED_FLY_MS, …)` (`:4262`), a pocisk ma `dur: RANGED_FLY_MS` (`:4261`).
- `_attackWallTile` wywołuje `_schedule(700, …)` (`:7555`) po `_spawnCatapultBoulder` (`:7552`).
- `_schedule` (`:9595-9606`) ustawia `due = _now() + ms`. `_drainTimers` (`:9616-9634`) bierze `target = _now()` i odpala zegary z `due <= target`. **Nie przesuwa `vNow` do `due`.** Komentarz nad funkcją mówi o kursorze, ale kod go nie ma. Callback wykonuje się więc w chwili klatki, czyli w pierwszej klatce z `vNow >= due`.

Wynik: trafienie wieży pada w `t0 + ceil(380/F)*F`, a kamienia w `t0 + ceil(700/F)*F`. Przy klatce 16 ms daje to 384 i 704. Zgadza się z D-LTB-1, z sondą Operatora (45 scenariuszy) i z odtworzeniem Evaluatora (3 scenariusze). Pin rozstrzyga sprawę jednoznacznie, więc ABC nie jest potrzebne.

## 2. Bramki (odtworzone przez FC)

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. Własne `CARGO_TARGET_DIR` w scratchpadzie (`LANDAT-FC-target-engine`, `LANDAT-FC-target-rc`), oba usunięte po bramkach. Pełny test engine szedł w tle (`setsid nohup`, log `LANDAT-FC-engine.log`). Bramkę renderera puściłem przy 14 GB wolnego, bez procesów `rustc` i bez `--features gpu`.

| crate | fmt --check | clippy --all-targets -D warnings | test --all-targets --no-fail-fast |
|---|---|---|---|
| engine | 0 | 0 | 0: **4276 passed / 0 failed / 1 ignored** |
| renderer (gpu OFF) | 0 | 0 | 0: **747 / 0 / 0** (`landat_tb_tower_shot…`, `landat_tb_boulder…` ok) |
| client | 0 | 0 | 0: **40 / 0 / 0** (`engine_bridge_renderer`, `siege_battle_client` uruchomione) |

- Wektory pinu K5LOOP-WIRING-A: `wektory_pinu_pelnej_bitwy_bajt_w_bajt ... ok` (45).
- Kontrakt: `kontrakt_czasu_akcji_z_rendererem_klatka_16ms` ok, `kontrakt_land_at_wiezy_i_kamienia_rowny_chwili_trafienia` ok, `zgodnosc_akcji_strzalu_wiezy_z_pinem` ok.
- `git diff --check 11c4a5805 HEAD` jest czysty. W diffie nie ma nowego `#[ignore]` w kodzie. Wzmianki o `#[ignore]` występują tylko w tekstach raportów.
- `gra/`, `src-tauri`, `view-model`, generatory wektorów i `Cargo.lock` są nietknięte. Build renderera nadpisał `rust-port/renderer/Cargo.lock` (stan zastany). Przywróciłem go przez `git checkout` i po bramkach `git status` był czysty.
- Commity nie zawierają linii z nazwą modelu, jest tylko `Claude-Session:`.
- Kandydatów c1 128/128 @16 i @1 FC **NIE ODTWORZYŁ**. Pliki `march-inc/c128_*` leżą poza repo. Wynik niezależnie odtworzył Evaluator (§2 `02-evaluator.md`), a zmiana dotyczy tylko wartości `landAt` w akcjach, nie przebiegu bitwy. Potwierdzają to wektory 45/45 bajt w bajt.

## 3. Mutanty (własne FC, na kodzie po zmianie, pliki przywrócone)

| ID | mutant | wynik | zabójca |
|---|---|---|---|
| FC2 | kamień: stary nominał `self.now + WALL_HIT_FLY_MS` | ZABITY (EXIT 101) | `kontrakt_land_at…` (`:1141`), `kontrakt_czasu_akcji…` (`:998`) |
| FC3 | wieża: stała klatka `frame_sched(16.0, …)` zamiast `ff_step_ms(clock)` | ZABITY (EXIT 101) | `kontrakt_land_at…` (`:1118`, bliźniaki @1/@4) |

Razem z mutantami Operatora (14/14) i Evaluatora (7 zabitych w nowej gałęzi) próg ≥ 12 jest spełniony. Mutant EV6 (`due` w `tower_in_flight` na siatce) przeżywa, ale nie dotyczy zmienionego kodu. Opis w E-2.

## 4. Orzeczenia

| zarzut | orzeczenie | uzasadnienie |
|---|---|---|
| E-1: `engine/tests/p4_1i3_actions.rs` poza allowlistą (D-LTB-2) | **ODDAL** (warunek integracji: orkiestrator wpisuje D-LTB-2 do `REJESTR-RUST.md`) | To nie jest granica §9 R-PROC-AUTOBOT. Plik nie jest na liście „Nie ruszać”. Zmiana wynika wprost z GOAL: test przypinał stary `landAt` strumienia akcji, a kryterium dispatchu („pełny test silnika bez regresji”) wymaga zielonej bramki. Diff tylko dokłada 2 asercje (`land_at == t0 + frame_sched(16, 380)` i trafienie dokładnie w siatce) i zostawia stare okno klatki. Jest jawnie zgłoszony, a mutanty E1/EV1 go zabijają. Zakres decyzji jest techniczny, więc należy do orkiestratora (zasada 8), nie do właściciela |
| E-2: EV6 przeżywa, kolejność D-FQ-2 trafienia wieży niepokryta | **ODDAL** jako błąd tematu, przyjęte jako dług `LANDAT-TB-TOWER-DUE-ORDER` | Kod trzyma nominalny `due` jak pin (`_drainTimers` `:9627` sortuje po `due = vNow + 380`). Luka pokrycia dotyczy istniejącej reguły, nie GOAL. Wektor wymaga zmiany generatora, który jest poza allowlistą |
| E-3: czasy trafień pinu nie są zamrożone w wektorze | **ODDAL** | Dispatch dopuszcza „wyprowadź z kodu pinu i dodaj test z uzasadnieniem”. Literały 384/704 są w teście kontraktu, a sondę pinu odtworzyły dwie niezależne role. Zamrożenie w wektorze dopisano do długu E-2 |
| E-4: dwa źródła długości klatki (wieża `ff_step_ms`, kamień `frame_ms`) | **ODDAL** (dług #401) | W sesji oba są równe (`siege_battle_session.rs` `diag_set_speed_mul`). Przypadek 16 ms i bliźniaki @1/@4 są zielone. speedMul ≠ 1 jest poza zakresem |
| E-5 / N1: `auto_batch_planning` + `RunNow` | **ODDAL** (dług N1) | Gałąź jest nieosiągalna w produkcji. Pin w tym trybie też woła callback synchronicznie |

Żadne orzeczenie nie jest NAPRAW ani DO DECYZJI CZŁOWIEKA.

## 5. Długi: zamknięte / zostaje

| dług | stan |
|---|---|
| N2 (HITAT-FQ): nominalny `landAt` TowerShot/Boulder | **ZAMKNIĘTE**: silnik 384/704 @16, renderer przyjmuje dokładnie dwa punkty (`is_pin_event_time`), kontrakt z pokryciem tower/boulder > 0, mutanty zabite |
| SHOT-LAND-AT-RENDER (#405) | ZOSTAJE (poza zakresem) |
| D-PIN3-3-SHOT-ID | ZOSTAJE (bez zmian; FIFO po celu) |
| FQ-SPEED (#401) | ZOSTAJE (renderer zna tylko siatkę 16 ms, E-4) |
| LANDAT-TB-TOWER-DUE-ORDER (nowy, E-2/E-3) | ZOSTAJE |
| N1 AUTO-planowanie a trafienie wieży (E-5) | ZOSTAJE (nieosiągalne) |

## 6. Werdykt

**PASS-WITH-NOTES.** Zmiana jest zgodna z tekstem pinu. Trzy crate'y są zielone w odtworzeniu FC, wektory 45/45, mutanty „stary nominał” dają FAIL. Notatka do integracji: wpisać D-LTB-1 i D-LTB-2 (zgoda na `p4_1i3_actions.rs`) oraz nowe długi do `REJESTR-RUST.md`.
