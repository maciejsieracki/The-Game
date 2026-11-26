# R-RUSTPORT-P4-413-FQ-SPEED-MIDCHANGE-DIV-Q1 — Operator r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-413-FQ-SPEED-MIDCHANGE-DIV-Q1
GOAL: naprawić 9/40 rozbieżności zmiany prędkości bitwy w trakcie walki: koniec każdego odcinka w toku (wypad do ciosu i do końca, krok ruchu, lot pocisku) wyznaczany siatką klatek obowiązującą w klatkach odcinka, jak w pinie `07d2fbd72`; bez zmian przy stałej prędkości.
ZMIANY/COMMIT: gałąź `rust-port-wip/413-fq-speed-midchange-div` od BAZY `31b47d9d954b2638dcb049c990a0373ed848de54` (= `origin/rust-port/parity-v2`, merge #412, bez przesunięcia). Commity: `8309eecb1` (kod + testy), `af69d2eb3` (clippy), commit raportu (SHA w `git log`, podany orkiestratorowi w wyniku). Pliki: `rust-port/engine/src/domain/siege_tactics_loop.rs`, `rust-port/engine/src/domain/siege_battle_session.rs` (spoza listy allowlisty — uzasadnienie §3.4), `rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs`, ten raport. `speed_change_vectors.json`, `vectors.json`, `speed_vectors.json`, generator — BEZ ZMIAN (MD5 `speed_change_vectors.json` = `a374deaea878eca21ff4166817fb03a9`, jak w #412).
TESTY: engine fmt 0 / clippy 0 / `cargo test --all-targets --no-fail-fast` EXIT 0 (558 binarek, 4364 passed / 0 failed / 1 ignored = baza 4354 + 10 nowych); client fmt 0 / clippy 0 / test EXIT 0 (66 passed); renderer (gpu OFF) fmt 0 / clippy 0 / test EXIT 0 (758 passed, `Cargo.lock` cofnięty). Szczegóły §5.
BLOKADY: brak. Uwagi: §6 (zmiana testu poza literą allowlisty: kontrola czułości strażnika przy pustej liście; akcje renderera `Melee.hit_at`/`Shot.land_at` liczone dalej w chwili startu).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (`02-evaluator.md`); orkiestrator: wpis w `REJESTR-RUST.md` (D-413-4, lista 9 -> 0).
DEPLOY/PUSH: NIE WYKONANO.

## 1. Web najpierw (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`)

- `_setSpeedIdx` `:9518-9527` zmienia tylko `speedIdx`/`speedMul` (i etykiety). Nic w toku nie jest przeliczane.
- `_advanceVClock` `:9500-9511` / `_scaledWallDelta` `:9512-9515`, `_runFastForward` `:9414-9435` (`FF_STEP_MS` liczony przy wejściu): od NASTĘPNEJ klatki `vNow` rośnie o `16 * speedMul`.
- Pętle `_raf` sprawdzają czas od `t0` w KAŻDEJ klatce: `_doMove` `:8752-8775` (`p = (_now() - t0) / MOVE_STEP_MS`, koniec przy `p >= 1`), `_doMeleeAttack` `:9115-9172` (cios przy `localT >= BLOW_HIT_T`, koniec lunge przy `localT >= BLOW_LUNGE_MS`, potem `_schedule(BLOW_SETTLE_MS)` z TEJ klatki). Koniec odcinka = pierwsza klatka (rzeczywistej siatki, także mieszanej) z `vNow >= t0 + ms`.
- `_schedule` `:9595-9606`: `due = _now() + ms` nominalny; `_drainTimers` `:9616-9634` odpala w pierwszej klatce `vNow >= due`, callback widzi `_now()` = czas klatki (trafienie strzału `:9223-9228`).

Wniosek: przy zmianie prędkości w trakcie odcinka `_raf` jego koniec wyznacza nowa siatka; zegary `_schedule` są nominalne i nie wymagają przeliczenia, ale skutek ich callbacku ma czas klatki odpalenia.

## 2. Pomiar przyczyn 9 pozycji (na kodzie bazy, sesja Rust vs wektor pinu)

Diagnostyka: kolejka zegara w chwili zmiany (lokalny wydruk w teście, usunięty przed commitem) + wyłączanie każdej z trzech poprawek osobno (lokalne łaty, nie zacommitowane) na pliku 9 wektorów (`WIRING_A_SPEED_CHANGE_FILE`).

| Wektor | Zmiana (klatka, vNow) | Klocek w toku w chwili zmiany | Pierwsza różnica przed naprawą (Rust vs pin) | Mechanizm (zmierzony) |
|---|---|---|---|---|
| `sc_mur_jazda_rzeka_x1to2_lunge` | x1→x2 (7503, 120016) | `BodyDone` ciosu, `due` 120160 | zdarzenie 2: 125008 vs 124976 (+32), klatek +1 | L: ogon lunge (`melee_tail_ms`) liczony w `start` siatką 16 |
| `sc_p3_rown_mix_d8l_palisada_218_x1to4_lunge` | x1→x4 (16082, 257280) | `BodyDone` ciosu, `due` 257424 | zdarzenie 81: 258688 vs 258624 (+64), klatek +1 | L: jw. |
| `sc_fq_rown_mix_d8l_mury_217_x1to2_lunge` | x1→x2 (16217, 259440) | `BodyDone` ciosu, `due` 259584 | zdarzenie 73: 264656 vs 264624 (+32), klatek +1 | L: jw. |
| `sc_p3_las_mix_d5_mury_123_x2to128_prehit` | x2→x128 (3015, 96416) | `BodyDone` strzału (nominalny, `due` 96796) | zdarzenie 0: 96800 vs 98464 | czas skutku strzału = `hit_at` z wystrzału (`t_shot + frame_sched(32, 380)`), nie klatka odpalenia |
| `sc_fq_gory_lucz2_d6l_mury_191_x64to1_prehit` | x64→x1 (433, 441344) | `BodyDone` strzału (nominalny, `due` 441724) | zdarzenie 0: 442368 vs 441728 | jw. (`hit_at` siatką 1024) |
| `sc_fq_las_mix_d8l_palisada_122_x64to1_round` | x64→x1 (119, 119808) | `BodyTimer` końca kroku, `due` 120832 (= `frame_raf(1024, 240)`) | zdarzenie 0: 200816 vs 200032, klatek 24140 vs 24091 | koniec kroku `_doMove` skwantyzowany starą siatką |
| `scm_mr_wzg_jazda3_d3l_mury_333_2_1_64` | x2→x1 (262, 8320); x1→x64 (7122) | `BodyTimer` końca kroku, `due` 8544 (siatka 32) | zdarzenie 0: 75168 vs 75152 (+16) | jw. (koniec kroku) |
| `scm_mi_las_mix_d3l_palisada_118_1_512_1_4` | x1→x512 (25); x512→x1 (118, 762224); x1→x4 (989) | (2) `BodyTimer` końca kroku `due` 770416 (= +8192) | tura w chwili 3. zmiany 4 vs 6; zdarzenie 0: 850912 vs 841824; klatek 4259 vs 4117 | jw. (krok przy x512) |
| `scm_rt_mur_machiny_wylom_1_4_64_2` | x1→x4; x4→x64 (698, 31584); x64→x2 (888, 226144) | `BodyTimer` końców kroków (`due` +256 przy x4, +1024 przy x64) | zdarzenie 0: 293088 vs 292320; klatek 5606 vs 5582 | jw. |

Atrybucja (każda poprawka wyłączona osobno, reszta włączona, 9 wektorów):

| Wyłączona poprawka | Rozbieżne |
|---|---|
| przeliczenie klocków `_raf` w toku (`respeed`) | 122, 333, 118, rt_mur (4) |
| ogon wypadu liczony w chwili ciosu | 3× lunge (L) |
| czas skutku strzału = klatka odpalenia | 123, 191 (2) |
| żadna (stan końcowy) | 0 |

Zgodnie z D-413-3: dwie pozycje klasy R z #412 (123, 191) miały inną przyczynę niż odcinek `_raf` — czas skutku trafienia strzału (precomputed `hit_at`); naprawione wg pinu (`:9223-9228`).

## 3. Naprawa (wybór techniczny: przeliczenie pozostałego odcinka przy `set_speed_idx`)

Uzasadnienie wyboru (zamiast przyrostowego liczenia po klatkach): ciało liczy aktywację w `start`/callbackach atomowo i oddaje sterownikowi czasy do `_schedule`; przerobienie wszystkich odcinków na pętle per klatka zmieniłoby kolejność `id` zegarów i strukturę faz (`body_done_raf`, `timer_raf`), czyli dziesiątki istniejących wektorów. Pin w chwili zmiany niczego nie przelicza, ale wynik „pierwsza klatka nowej siatki `>= t0 + ms`” można wyznaczyć dokładnie w chwili zmiany, bo siatka po zmianie jest jednorodna aż do kolejnej zmiany (wtedy przeliczenie się powtarza). Identyfikator klocka (remisy `_drainTimers`) zostaje.

### 3.1 Sterownik (`SiegeLoop`)
- `LoopBody::take_raf_plan(RafPlanKey) -> Option<RafPlan>` (domyślnie `None`) — ciało opisuje klocek będący odcinkiem `_raf`: nominalne `ms` od chwili zaplanowania, nominalne `then` (np. `BLOW_SETTLE_MS`) i klatkę, którą skwantyzowało `due`.
- `schedule_body` (wszystkie miejsca planowania `BodyDone`/`BodyTail`/`BodyTimer`): plan przyjmowany wyłącznie, gdy `t + frame_raf(frame, ms) + then` jest BITOWO równe `due` klocka (strażnik: przy stałej prędkości przeliczenie jest tożsamością; plan niezgodny jest odrzucany — test `plan_niezgodny_z_due_odrzucony`).
- `SiegeLoop::respeed(clock, frame)`: dla każdego klocka z planem — koniec odcinka na starej siatce `<= vNow` ⇒ bez zmian (zostaje nominalne `then`); inaczej `due = pierwsza klatka vNow + k*frame >= target` `+ then`.

### 3.2 Ciało (`ProdBody`)
- cios wręcz (`attack_tail`, `attack_pre == 0`): plan `Done{BLOW body_ms}`; zapis `lunge_t0` (start lunge).
- `take_tail`: ogon liczony w chwili ciosu (`call_now`) siatką obowiązującą wtedy: koniec lunge = pierwsza klatka `>= t0 + BLOW_LUNGE_MS`, `+ BLOW_SETTLE_MS`; plan `Tail` (zmiana po ciosie, przed końcem lunge). Przy stałej prędkości równe `melee_tail_ms` (test tożsamości dla klatek 16…8192).
- koniec kroku marszu (`march_advance`, `MarchStage::StepEnd`): plan `Timer{MOVE_STEP_MS}`; przerwa `STEP_GAP_MS` jest nominalna (bez planu).
- `complete_shot`: w modelu czasu pinu skutek trafienia ma czas klatki odpalenia (`call_now`), nie `hit_at` z wystrzału.

### 3.3 Sesja
- `SiegeBattleSession::set_speed_idx` woła `self.lp.respeed(&mut self.clock, frame)` po ustawieniu `speedMul` i klatki ciała. `diag_set_speed_mul` (tylko diagnostyka, ustawiany przed startem) — bez zmian.

### 3.4 Pliki spoza dosłownej allowlisty
- `siege_battle_session.rs` (6 linii): jedyny punkt, w którym sesja zmienia prędkość; bez wywołania `respeed` poprawka sterownika byłaby martwa. Kontrakt publiczny (`set_speed_idx`, `frame_ms`, strumień akcji) bez zmian — dlatego dodatkowo bramki client i renderer (D-413-2).
- `p6_k5loop_wiring_a_pin.rs`: poza skróceniem listy (`[&str; 9]` → `[&str; 0]`) — patrz §6.1.

### 3.5 Odcinki NIE objęte (świadomie, udokumentowane)

> **KOREKTA (obrona, zarzut Z1 Evaluatora):** lista poniżej była niekompletna. W sesji (`march_incremental = true`) bez planu
> zostały w r1 także dwa kroki `_doMove` liczone atomowo jako `BodyDone`: krok falangi (`_phalanxStep` `:6635`) i
> `_advanceToward` (`:7915`). Naprawione w obronie (commit `2e9588c16`); pełna lista odcinków `_raf` pinu z odpowiednikami w
> Rust: `02a-obrona.md` §1.1.
- Odcinki złożone liczone atomowo z `attack_pre > 0` (marsz nieprzyrostowy `march_incremental = false`, poza sesją) — bez planu, bez przeliczenia (strażnik planu). W sesji marsze są przyrostowe, więc `attack_pre = 0`.
- Akcje dla renderera wyliczone w chwili startu: `BattleAction::Melee.hit_at`, `BattleAction::Shot.land_at` (i `TowerShot.land_at`) zakładają siatkę z chwili startu; nie są porównywane z pinem (nie są zdarzeniami `_pushClash/_startRout/_startFade/_spawnDamageLabel`) i zmiana kontraktu renderera jest poza zakresem (D-413-2). Do decyzji orkiestratora jako osobny drobny dług (np. do #405 SHOT-LAND-AT-RENDER).

## 4. Dowód zgodności po naprawie

- `zmiana_predkosci_w_trakcie_bitwy_wektory_pinu_bajt_w_bajt`: 40/40 zgodnych bajt w bajt (zdarzenia, klatki, wynik), lista `ROZBIEZNE_FQ_SPEED_MIDCHANGE` pusta. Kryteria pokrycia (≥ 24 przypadki, ≥ 6 par, ≥ 6 tur, w górę/w dół, ≥ 3 bitwy wielokrotne, każda chwila `inFlight/preHit/moving/lunging`) liczone teraz z 40 wektorów — spełnione (test zielony w pełnym `cargo test`).
- `zmiana_predkosci_w_trakcie_mutanty_sterownika_daja_fail`: 8/8 mutantów nadal zabitych (test zielony; liczy na wszystkich 40 wektorach, bo lista jest pusta).
- Brak regresji: `wektory_pinu_pelnej_bitwy_bajt_w_bajt` (50), `predkosc_bitwy_wektory_pinu_bajt_w_bajt` (288), pozostałe K5LOOP/FRAME-QUANT/SAVE-LOAD/FQ-SPEED-BRIDGE — zielone w pełnym `cargo test` engine.

Nowe testy jednostkowe (oczekiwania wyliczone z pinu, §1):
- `siege_tactics_loop::respeed_tests` (sterownik + atrapa ciała): `cios_w_trakcie_wypadu_na_nowej_siatce_w_dol` (x4→x1 w połowie wypadu: cios 1160 zamiast 1192), `ogon_wypadu_po_zmianie_przed_ciosem` (x1→x2: cios 1176, settle `due` 1492, `done()` w klatce 1496 zamiast 1528), `koniec_lunge_po_ciosie_na_nowej_siatce` (x2→x1 po ciosie: `due` 1508 → 1492; odcinek zakończony nie jest ruszany), `koniec_kroku_marszu_na_nowej_siatce` (x64→x1: koniec kroku 1240 zamiast 2024), `plan_niezgodny_z_due_odrzucony`, `respeed_przy_tej_samej_klatce_tozsamosc`.
- `siege_tactics_loop::march_incremental_tests` (`ProdBody`): `p413_cios_wreczny_ma_plan_raf_od_chwili_wywolania`, `p413_ogon_wypadu_liczony_siatka_z_chwili_ciosu` (w tym tożsamość z `melee_tail_ms` dla klatek 16/32/64/1024/8192), `p413_koniec_kroku_marszu_ma_plan_raf`, `p413_trafienie_strzalu_w_klatce_odpalenia` (x4→x1: czas akcji trafienia 1392, nie `hit_at` 1384).

## 5. Bramki

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, osobny `CARGO_TARGET_DIR` w scratchpadzie dla każdego crate'a, usunięty po bramce; jeden build naraz; wolne 13–14 GB (renderer przy 14 GB).

| Crate | fmt --check | clippy --all-targets -D warnings | test --all-targets --no-fail-fast |
|---|---|---|---|
| engine | EXIT 0 | EXIT 0 | EXIT 0: 558 binarek, 4364 passed / 0 failed / 1 ignored (istniejący) |
| client | EXIT 0 | EXIT 0 | EXIT 0: 66 passed |
| renderer (gpu OFF) | EXIT 0 | EXIT 0 | EXIT 0: 758 passed; przepisany `renderer/Cargo.lock` cofnięty |

## 6. Uwagi

### 6.1 Test strażnika przy pustej liście (zmiana poza dosłowną allowlistą)
Kontrola czułości strażnika „regresja przed pierwszą zmianą” (Uwaga 1 Evaluatora #412) wykonywała się tylko na pozycji listy rozbieżności; przy liście pustej asercja `straz_sprawdzona` padała (zmierzone: jedyny FAIL po naprawie). Zmiana: kontrola idzie na pierwszej pozycji listy, a przy pustej liście na pierwszym wektorze pliku ze zdarzeniem przed zmianą (warunek `listed || ROZBIEZNE_FQ_SPEED_MIDCHANGE.is_empty()`). Asercje, mutanty i kryteria pokrycia nietknięte; nic nie zostało osłabione (sprawdzenie dalej wymaga wykrycia symulowanej regresji). Do oceny Evaluatora.

### 6.2 Zakazy — kontrola
Brak zmian w `gra/`, w wektorach i generatorze; brak `#[ignore]`; brak `git add -A` (pliki po nazwie); brak push/integracji; brak linii z nazwą modelu w commitach (tylko `Claude-Session:`); brak procesów `cargo` po rundzie; targety usunięte.
