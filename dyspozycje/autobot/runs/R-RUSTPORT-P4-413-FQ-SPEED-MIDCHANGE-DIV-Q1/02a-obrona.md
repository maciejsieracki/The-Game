# R-RUSTPORT-P4-413-FQ-SPEED-MIDCHANGE-DIV-Q1 — Obrona Operatora (odpowiedź na `02-evaluator.md`)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-413-FQ-SPEED-MIDCHANGE-DIV-Q1
GOAL: koniec KAŻDEGO odcinka `_raf` w toku przy zmianie prędkości wyznaczany siatką klatek obowiązującą w klatkach odcinka, jak w pinie `07d2fbd72`; bez zmian przy stałej prędkości; 40/40 wektorów, lista `ROZBIEZNE_FQ_SPEED_MIDCHANGE` pusta.
ZMIANY/COMMIT: baza oceny = `50426415a` (raport Evaluatora na kodzie Operatora `d70c4cf7c`, baza tematu `31b47d9d954b2638dcb049c990a0373ed848de54` = `origin/rust-port/parity-v2`). Commit kodu obrony: `2e9588c16` (jedyny plik: `rust-port/engine/src/domain/siege_tactics_loop.rs`, +~230 linii, w tym testy). Commit raportu: ten plik + korekta §3.5 w `01-operator-r1.md` (SHA w wyniku dla orkiestratora). Gałąź lokalna `obrona-413` w worktree `wf_957e7b40-d1b-3`, bez push. Wektory, generator, `gra/`, `siege_battle_session.rs`, testy integracyjne — BEZ ZMIAN.
TESTY: engine fmt 0 / clippy 0 / pełny `cargo test --all-targets --no-fail-fast` EXIT 0 (558 binarek, 4370 passed / 0 failed / 1 ignored; 40/40 wektorów, lista pusta); mutanty E4, M-Z1a/b/c, M-U3 zabite (§5, §6).
BLOKADY: brak.
RUNDY: 1/5 (obrona rundy 1; poprawki Z1/Z2 wykonane w tej obronie — do oceny FC albo r2 Evaluatora).
NASTĘPNY KROK: Final Control (albo ponowna ocena Evaluatora) na `2e9588c16` + commit raportu.
DEPLOY/PUSH: NIE WYKONANO.

## Odpowiedzi na zarzuty

| Zarzut | Odpowiedź | Dowód |
|---|---|---|
| Z1 (blokujący) | PRZYJMUJĘ | poprawka w obu gałęziach, 3 testy, korekta §3.5, mutanty M-Z1a/b/c zabite (§1, §5) |
| Z2 (blokujący) | PRZYJMUJĘ | test z dwiema zmianami zabija E4; dowód, że to jedyna obserwowalna klasa (§2, §5) |
| U1 | PRZYJMUJĘ W CZĘŚCI / ODRZUCAM część wektorową | nowy wektor wymagałby zmiany `speed_change_vectors.json`/generatora, zakazanej D-413-1 bez błędu generatora; pokrycie gałęzi E3/E7/E8 testami jednostkowymi utrzymane; luka zgłoszona do rejestru (§3) |
| U2 | PRZYJMUJĘ | doc-komentarz `begin_shot` wrócił nad `fn begin_shot` (§4) |
| U3 | PRZYJMUJĘ | martwe plany usuwane przy planowaniu, test `plany_odpalonych_klockow_nie_zalegaja`, mutant M-U3 zabity (§4, §5) |
| U4 | PRZYJMUJĘ jako poza zakresem | bez zmian w kodzie; do rejestru jako część #405 (zgodnie z oceną Evaluatora) |

## 1. Z1 — krok falangi i `_advanceToward` (PRZYJMUJĘ)

Pin (`git show 07d2fbd72:gra/src/battle/battleScene.ts`):
- `_phalanxStep` `:6588-6636`, `:6635` `this._doMove(ru, nc, nr, () => { done(); }); // exactly one controlled step per turn`.
- `_advanceToward` `:7892-7916`, `:7915` `this._doMove(ru, nc, nr, done);` (wołane z `:6215`, `:8035`, `:8049`).
- `_doMove` `:8685-8775`: `t0 = _now()`, `p = (_now() - t0) / MOVE_STEP_MS` w każdej klatce, `done` przy `p >= 1`.

Zarzut jest trafny: w r1 oba kroki w sesji (`march_incremental = true`) kończyły aktywację jako `BodyDone` z `dur = step_ms(..)` bez planu `_raf`, więc `respeed` ich nie przeliczał; §3.5 raportu r1 był niekompletny.

Poprawka (`siege_tactics_loop.rs`):
- nowa `ProdBody::put_step_done_plan(unit, ms)`: plan `RafPlan { ms: MOVE_STEP_MS, then: 0, frame: frame_ms }` dla `RafPlanKey::Done(unit)`, wyłącznie gdy krok wykonany (`ms > 0`); odmowa (`_siegeMoveRefused`/bramka muru, `step_ms = 0`) i brak kroku = `done()` od razu, bez odcinka (jak pin `:8689-8692`);
- `phalanx_action`, gałąź `PhalanxDecision::Move` — wołanie po `body_step`;
- `siege_atk_advance_toward` — wołanie po `move_step_core` (z `dur = step_ms(..)`).
Sterownik bez zmian: plan przechodzi przez istniejący strażnik bitowej zgodności `due` w `schedule_body` (przy stałej prędkości tożsamość), `respeed` przelicza go jak każdy `Done`.

Testy (oczekiwania z pinu):
- `march_incremental_tests::p413_krok_falangi_ma_plan_raf` — dwie falangi atakującego (linia `lineFront = 0`), wróg w (8,0), klatka 1024: `PhalanxDecision::Move` na (1,0), `ms = 1024`, plan `{240, 0, 1024}`; `moveLeft = 0` (`:6589`) = `done()` bez planu.
- `march_incremental_tests::p413_krok_advance_toward_ma_plan_raf` — klatka 64: krok na (1,0), `dur = 256`, plan `{240, 0, 64}`; `moveLeft = 0` (`:7895`) bez planu; krok odmówiony (`ms = 0`) bez planu.
- `respeed_tests::krok_konczacy_aktywacje_na_nowej_siatce` — atrapa z krokiem kończącym aktywację: start 1000 przy x64 (`due` 2024), zmiana na x1: `due` 1240, `done()` w klatce 1240 (pierwsza klatka siatki 16 z `p >= 1`).

Wektory: sonda Evaluatora (74 przypadki, 0 zastosowanych) wykazała, że żaden scenariusz bazowy #412 nie wykonuje tych kroków po 1. turze — pokrycie wektorowe tych gałęzi pozostaje **NIE_ZMIERZONO** (nowy wektor = zmiana `speed_change_vectors.json`/scenariuszy generatora, poza D-413-1; patrz §3). Zgodność wynika z kodu i testów jednostkowych wyprowadzonych z pinu.

### 1.1 Korekta §3.5 raportu r1 — pełna lista odcinków `_raf` pinu i ich odpowiednik w Rust (sesja, `march_incremental = true`)

Wszystkie wywołania `_doMove` w pinie (`grep -n "_doMove(" battleScene.ts`) i `_doMeleeAttack`:

| Pin (linia, funkcja) | Rust w sesji | Plan `_raf` |
|---|---|---|
| `:9096-9174` `_doMeleeAttack` (cios `BLOW_HIT_T`, koniec lunge `BLOW_LUNGE_MS`) | `attack_tail` (`BodyDone`), `take_tail` (`BodyTail`, potem nominalne `BLOW_SETTLE_MS`) | TAK (r1) |
| `:8221`, `:8273` `_advanceStep` | `MarchKind::Advance`, `MarchStage::StepEnd` (`BodyTimer`) | TAK (r1) |
| `:6799` `_rangedForwardStep`; `:6703` krok KITE `_rangedAction` | `MarchKind::RangedForward` / `Kite` | TAK (r1, wspólne `march_advance`) |
| `:7239` `_fallBackStep` | `MarchKind::FallBack` | TAK (r1) |
| `:9884` `_fleeStep` | `MarchKind::Flee` | TAK (r1) |
| `:6408` szarża / `:6436` `_cavDirectedManeuverStep` / `:6489` `_cavManeuverStep` | `MarchKind::CavCharge` / `CavDirected` / `CavManeuver` | TAK (r1) |
| `:8015` `_siegeWalkTo` | `MarchKind::SiegeWalk` | TAK (r1) |
| `:6635` `_phalanxStep` | `phalanx_action` → `BodyDone` | **TAK (r2, Z1)** |
| `:7915` `_advanceToward` | `siege_atk_advance_toward` → `BodyDone` | **TAK (r2, Z1)** |
| `:5955` `_resolveAutoBatchMovement` (`_launchAutoBatchResolution`) | poza sesją oblężenia (`SeqEvent::BeginAutoBatchPhase` nie jest składane przez sterownik oblężenia) | nie dotyczy |
| `:18346-18419` `_performPlayerOrder` | nieportowane (tag `doktryna-rozkaz-ruchu`, #404) | nie dotyczy |
| `:7025` `_rangedBackStep`, `:7087` `_kiteStep`, `:7277` `_rangedApproachStep` | brak wołającego w pinie poza rekurencją własną (`:7029`, `:7091`, `:7283`) — martwy kod pinu | nie dotyczy |

Poza sesją (`march_incremental = false`, ścieżki atomowe `attack_pre > 0`, `cavalry_action`, `ranged_action`, `fall_back`, `flee_run`, `siege_walk_dur`) — bez planu, jak w r1 (strażnik planu); sesja produkcyjna ich nie używa.
Zegary nominalne `_schedule` (przerwy `STEP_GAP_MS`, settle `BLOW_SETTLE_MS`, lot `RANGED_FLY_MS`, wieże, `RANGED_GAP_MS`) — bez przeliczenia, jak w pinie (`:9595-9634`).

## 2. Z2 — mutant E4 (PRZYJMUJĘ)

Test `respeed_tests::dwie_zmiany_druga_po_koncu_lunge_nie_rusza_settle` (kontrprzykład Evaluatora, liczby z pinu): x4 (siatka 64), lunge od 1000, cios w klatce 1192; koniec lunge na starej siatce 1320 (`due` settle 1540). Zmiana na x1 w 1192 → koniec lunge 1272 (pierwsza klatka siatki 16 `>= 1260`), `due` 1492. Druga zmiana (x2) w klatce 1288 — po końcu lunge (1272), przed starym końcem (1320): settle już nominalny z klatki 1272, `due` zostaje 1492, `done()` w klatce 1512 (pierwsza klatka siatki 32 `>= 1492`). Mutant E4 przelicza na `1288 + 220 = 1508` → test FAIL (zabity, §5).

Dodatkowo `respeed_tests::dwie_zmiany_w_jednym_ogonie_po_ciosie` (x1 → x64 po ciosie → x1 w klatce końca lunge 2184): `due` 2404 bez zmian, `done()` w 2408.

Dlaczego jeden kierunek wystarcza (dowód, że innego rozjazdu E4 nie ma): po przeliczeniu w klatce `a` siatką `F` klatki odcinka leżą w `a + kF`, a nowy koniec `E = pierwsza a + kF >= target`. Mutant porównuje `now` ze starym końcem `E_old >= target`. Przypadek „mutant: zakończony, poprawnie: w toku” wymagałby klatki `f` z `E_old <= f < E`; ale `f >= E_old >= target` i `f` leży na siatce od `a`, więc `E <= f` — sprzeczność (to samo przy kolejnych zmianach, bo każda zaczyna nową siatkę od klatki zmiany). Zostaje tylko przypadek „mutant: w toku, poprawnie: zakończony” (`E <= now < E_old`), a on wymaga `then > 0` (przy `then = 0` klocek jest już odpalony i nieobecny w kolejce) — czyli dokładnie ogona lunge; test go pokrywa. Dla kroku (`then = 0`) dwie zmiany w toku dają ten sam wynik z kotwicą i bez (`first_frame_at_or_after(now, frame, target)` nie zależy od kotwicy).

## 3. U1 — pokrycie wektorowe E3/E7/E8 (PRZYJMUJĘ W CZĘŚCI)

- Fakt przyjęty: E3, E7, E8 zabijają wyłącznie testy jednostkowe (Evaluator §4). Testy te zostają i są wyprowadzone z pinu; E8 strzeże dodatkowo test strukturalny `p413_cios_wreczny_ma_plan_raf_od_chwili_wywolania` (produkcyjny `ProdBody`).
- ODRZUCAM dodanie wektora w tej rundzie: D-413-1 (dispatch) zakazuje modyfikacji `speed_change_vectors.json`, a allowlista dopuszcza zmianę generatora `p6_k5loop_wiring_a_gen.mjs` tylko przy błędzie generatora — a błędu nie ma (40/40 bajt w bajt). Nowy wektor `lunge` (np. x4→x1 tuż po starcie wypadu) oraz wektory kroku falangi i `_advanceToward` (Z1) to rozszerzenie zestawu #412 — propozycja dla orkiestratora: osobny temat „FQ-SPEED-MIDCHANGE-VEC-2” (generator: rodzaje chwili `movingPh`/`movingAdv` z sondy Evaluatora + scenariusze bazowe z falangą i `_advanceToward` po 1. turze + para przesuwająca cios o klatkę). Do tego czasu: pokrycie wektorowe tych gałęzi = NIE_ZMIERZONO.

## 4. U2, U3, U4

- U2 (PRZYJMUJĘ): `put_raf_plan` przeniesione przed doc-komentarz `begin_shot`; opis `K5LOOP-CLOSE r3/r4: wystrzał _doRangedAttack …` znów dokumentuje `fn begin_shot`, `put_raf_plan` i `put_step_done_plan` mają własne komentarze.
- U3 (PRZYJMUJĘ): `SiegeLoop::schedule_body` przed zapamiętaniem nowego planu usuwa plany klocków nieobecnych w kolejce zegara (`retain` po `clock.timers`), więc `raf_plans` ma co najwyżej (liczba zaplanowanych klocków z planem) + 1 wpisów. Wynik bez zmian (martwe plany i tak są pomijane w `respeed`; potwierdzone pełnym testem, §6). Test `respeed_tests::plany_odpalonych_klockow_nie_zalegaja` (po ciosie zostaje wyłącznie plan ogona, same żywe `id`).
- U4 (PRZYJMUJĘ jako poza zakresem D-413-2): `Melee.hit_at`, `Shot.land_at`, `TowerShot.land_at` bez zmian; do rejestru razem z #405 (SHOT-LAND-AT-RENDER).

## 5. Mutanty (zastosowane na kopii pliku, przywrócony oryginał; `cargo test --lib -- respeed_tests p413_`)

| ID | Mutacja | Wynik |
|---|---|---|
| E4 | bez `p.anchor = now; p.frame = frame;` w `respeed` | EXIT 101, FAIL `dwie_zmiany_druga_po_koncu_lunge_nie_rusza_settle` — **zabity** |
| M-Z1a | bez planu w `phalanx_action` (Move) | EXIT 101, FAIL `p413_krok_falangi_ma_plan_raf` — zabity |
| M-Z1b | bez planu w `siege_atk_advance_toward` | EXIT 101, FAIL `p413_krok_advance_toward_ma_plan_raf` — zabity |
| M-Z1c | plan także przy kroku odmówionym (`ms = 0`) | EXIT 101, FAIL `p413_krok_advance_toward_ma_plan_raf` — zabity (behawioralnie równoważny dzięki strażnikowi `due` w sterowniku, ale strzeżony) |
| M-U3 | bez sprzątania martwych planów | EXIT 101, FAIL `plany_odpalonych_klockow_nie_zalegaja` — zabity |

Mutanty E1–E3, E5–E9 Evaluatora: kod i testy, które je zabijały, bez zmian (E2 — równoważny, jak ocenił Evaluator).

## 6. Bramki (engine; jeden build, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`; wolne przed startem 12 GB.

| Crate | fmt --check | clippy --all-targets -D warnings | test --all-targets --no-fail-fast |
|---|---|---|---|
| engine | EXIT 0 | EXIT 0 | EXIT 0 — 558 binarek, 4370 passed / 0 failed / 1 ignored (= 4364 z r1 + 6 nowych testów); `zmiana_predkosci_w_trakcie_bitwy_wektory_pinu_bajt_w_bajt` ok (40/40, lista pusta), `zmiana_predkosci_w_trakcie_mutanty_sterownika_daja_fail` ok |

Po bramkach: `CARGO_TARGET_DIR` usunięty, brak procesów `cargo`.

`client` / `renderer`: nie ruszane (zmiana wyłącznie w `domain/siege_tactics_loop.rs`, kontrakt mostu/akcji/`set_speed_idx` bez zmian; D-413-2: wystarczy engine). Ostatnie przejście tych bramek: Evaluator r1 na `d70c4cf7c` (client 66, renderer 758).

## 7. Zakazy — kontrola

Brak zmian w `gra/`, wektorach, generatorze, `p6_k5loop_wiring_a_pin.rs`; brak `#[ignore]` i osłabionych asercji; brak `git add -A`; brak push/integracji; commit bez linii z nazwą modelu (tylko `Claude-Session:`); brak procesów `cargo` po rundzie.
