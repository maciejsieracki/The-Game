# R-RUSTPORT-P4-412-FQ-SPEED-MIDCHANGE-VEC-Q1 — Operator r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-412-FQ-SPEED-MIDCHANGE-VEC-Q1
GOAL: zamrozić w repo wektory pinu `07d2fbd72` dla zmiany prędkości bitwy W TRAKCIE walki (`_setSpeedIdx` między klatkami `_raf`) i pilnować ich testem silnika bajt w bajt + kontrolą czułości (mutanty).
ZMIANY/COMMIT: gałąź `rust-port-wip/412-fq-speed-midchange-vec-q1` od BAZY `3f98dd284229f975e373b9c3be7a0d28232089d3` (= `origin/rust-port/parity-v2` w chwili startu). Commity: `2195249c6` (WIP), `0d57d83dd` (wektory + testy), commit raportu (SHA w opisie commita / `git log`). Pliki (wyłącznie allowlista): `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (rozszerzenie), `rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs` (2 nowe testy), `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/speed_change_vectors.json` (NOWY), ten raport. `speed_vectors.json`, `vectors.json`, `pin_data.json` — bez zmian (MD5 `speed_vectors.json` = `d764f078f08aa5df274e3f74d09df14b`, jak w bazie). Kod produkcyjny silnika/mostu/klienta — BEZ ZMIAN (D-412-2).
TESTY: engine `cargo fmt --check` EXIT 0, `cargo clippy --all-targets -- -D warnings` EXIT 0, `cargo test --all-targets --no-fail-fast` EXIT 0 (4354 passed / 0 failed / 1 ignored); nowe testy 2/2; szczegóły §6.
BLOKADY: brak blokad technicznych. Uwaga merytoryczna: 9 z 40 wektorów jest JAWNIE rozbieżnych z pinem (lista w teście, klasy niżej) — wg D-412-2 nie poprawiane tutaj; potrzebny osobny temat.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (02-evaluator.md); orkiestrator: wpis w REJESTR-RUST (liczba `speed_vectors.json` = 288, nowy plik, dług FQ-SPEED-MIDCHANGE-DIV — §Wnioski).
DEPLOY/PUSH: NIE WYKONANO.

## 1. Web najpierw (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`)

- `_setSpeedIdx` `:9518-9527` — `speedMul = SPEED_STEPS[idx]`, „Safe to call mid-battle” `:9535`.
- `_advanceVClock` `:9500-9511` + `_scaledWallDelta` `:9512-9515` — skala delty ściennej działa od NASTĘPNEJ klatki `_raf`.
- `_drainTimers` `:9616-9634` — terminy `_schedule` (`due` absolutne w `vNow`) NIE są przeskalowywane przy zmianie.
- Pętle `_raf`: krok `_doMove` `:8746-8775` (`p = (now - t0) / MOVE_STEP_MS`), wypad `_doMeleeAttack` `:9114-9174` (`localT >= BLOW_HIT_T` sprawdzane w każdej klatce) — przy zmianie prędkości w trakcie siatka kolejnych klatek jest nowa.

## 2. Co zrobiono

### 2.1 Generator (`p6_k5loop_wiring_a_gen.mjs`, D-412-1: wykonanie tekstu pinu, strażnik SHA-256 bez zmian)

- `runScenario`: nowe pole scenariusza `speedChanges = [{ at, speedMul }]` (tylko czas rzeczywisty, klatki 16 ms ściany). Zmiana = METODA PINU `bs._setSpeedIdx(idx)` między klatkami rAF, przed klatką N. Chwila `at`: `{frame}`, `{round}` (jak obrona #407) albo `{when, afterRound}` z obserwatorem stanu pinu: `inflight` (pocisk `_schedule(380|700)` w locie dłużej niż klatka), `prehit` (pocisk ląduje w najbliższej klatce przy szybszej prędkości, później przy wolniejszej — zmiana przesuwa trafienie o klatkę), `moving` (krok `_doMove` w trakcie animacji), `lunge` (wypad przed ciosem). Wektor zapisuje ROZWIĄZANĄ klatkę i stan pinu w chwili zmiany (`vNow`, `roundNo`, prędkość przed/po, liczniki).
- Strumień zdarzeń pinu (`recordEvents`): `_pushClash` / `_startRout` / `_startFade` / `_spawnDamageLabel` z `vNow` (opakowania metod instancji; pomijają planowanie AUTO-batch `_autoBatchPlanning`). Tekst pinu bez zmian (jedyna podmiana nadal `:8960`).
- Tryb `WIRING_A_SPEED_CHANGE_VECTORS=1` → `speed_change_vectors.json`; podział na procesy `WIRING_A_SPEED_CHANGE_SHARD=k/n` + składanie `WIRING_A_SPEED_CHANGE_MERGE=…` (czas rzeczywisty pinu ~30–80 s na bitwę). Przypadek, którego chwila `when` w bitwie nie występuje, jest jawnie pomijany (log `POMINIETY`).
- Przypadki: 37 scenariuszy bazowych `vectors.json` (klatka produkcyjna, bez bliźniaków `ffStepMs`) × para prędkości z rotacji `[1→4, 1→64, 64→1, 4→512, 1→2, 8→32, 2→128, 512→8]` × rodzaj chwili z rotacji `[round, inflight, prehit, moving, lunge, frame]` + 11 bitew z wieloma zmianami = 48 zadanych; **40 zapisanych**, 8 pominiętych (chwila nie wystąpiła: 3× `moving`/`lunge` przy x512/x64 — krok/wypad krótszy niż klatka; `inflight` przy x512; 2 bitwy wielokrotne).
- Plik: `speed_change_vectors.json`, 172 339 B, MD5 `a374deaea878eca21ff4166817fb03a9`; 40 bitew, 42 zmiany, 260 243 klatek, 3 301 zdarzeń pinu. Kolejność deterministyczna (składanie wg listy przypadków; każdy przypadek ładuje moduł pinu od nowa).

### 2.2 Testy silnika (`p6_k5loop_wiring_a_pin.rs`)

- `zmiana_predkosci_w_trakcie_bitwy_wektory_pinu_bajt_w_bajt`: wejście z `vectors.json` (scenariusz bazowy), `SiegeBattleSession::set_speed_idx` przed klatką z wektora, porównanie: chwila zmiany (klatka, `vNow`, `roundNo`, prędkość przed i po), strumień zdarzeń (`Clash`/`Rout`/`Kill`/`Damage` z `t0`, bity `f64`), liczba klatek do końca, wynik (`diff`: zwycięzca, tura, wyłom, rzuty, HP/dead/routed/removed każdej jednostki). Jawna lista `ROZBIEZNE_FQ_SPEED_MIDCHANGE` (9): test pada, gdy pozycja listy zacznie się zgadzać albo rozjedzie się wektor spoza listy. Pokrycie liczone wyłącznie z wektorów zgodnych (≥ 24 przypadki, ≥ 6 par, ≥ 6 tur, w górę i w dół, ≥ 3 bitwy wielokrotne, każda chwila `inFlight`/`preHit`/`moving`/`lunging` > 0).
- `zmiana_predkosci_w_trakcie_mutanty_sterownika_daja_fail`: 8 mutantów sterownika na wektorach zgodnych; każdy musi rozjechać ≥ 1 przypadek (przerwanie przebiegu na pierwszym rozbieżnym zdarzeniu).

## 3. Wyniki (faktyczne liczby)

| Pomiar | Wynik |
|---|---|
| Przypadki zapisane | 40 (31 zgodnych bajt w bajt, 9 jawnie rozbieżnych) |
| Pary prędkości (wszystkie zmiany) | 18: (1,2) (1,4) (1,8) (1,16) (1,32) (1,64) (1,128) (1,256) (2,8) (2,32) (2,128) (4,512) (8,1) (8,32) (16,1) (32,2) (64,1) (512,8) |
| Zmiany w zgodnych | 42 zmian ogółem w pliku; w zgodnych: w górę 35 / w dół 7 (licznik testu), 6 bitew wielokrotnych |
| Tury zmiany (zgodne) | 22 różne: 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 19, 20, 21, 25, 26, 29, 40, 45, 48 |
| Chwile zmiany (zgodne) | pocisk w locie 15, tuż przed trafieniem 16, krok ruchu w trakcie 6, wypad przed ciosem 1 |
| Zgodne wg rodzaju | round 6/7, inflight 4/4, prehit 4/6, frame 6/6, moving 4/4, lunge 1/4, wielokrotne 6/9 |

Kontrola czułości (31 wektorów zgodnych, liczba rozbieżnych przypadków):

| Mutant | Rozbieżne |
|---|---|
| Skip — zmiana w trakcie pominięta | 31/31 |
| SkipLater — pominięte zmiany poza pierwszą | 6/6 bitew wielokrotnych (6/31) |
| Late — zmiana o klatkę za późno | 31/31 |
| Early — zmiana o klatkę za wcześnie | 29/31 |
| WrongSpeed — sąsiedni krok `SPEED_STEPS` | 31/31 |
| OldGrid — zegar nowy, siatka ciała `frame_ms` bez przeliczenia | 21/31 |
| NewGridOldClock — siatka nowa, zegar stary | 31/31 |
| Grid16 — siatka ciała zawsze 16 ms | 19/31 |

Wszystkie 8 zabite; brak mutantów równoważnych (OldGrid i Grid16 są tożsame dla zmian ze startu x1 — różnią się na startach x2/x4/x8/x64/x512, stąd 21 vs 19).

## 4. Rozbieżności z pinem (D-412-2: NIE poprawiane w tym temacie)

W każdym z 9 przypadków pierwsza różnica jest PO pierwszej zmianie prędkości (przed nią strumień zgodny), więc dotyczą one zmiany w trakcie, nie prędkości stałej.

| Klasa | Przypadki | Opis / przyczyna |
|---|---|---|
| L — wypad wręcz w trakcie zmiany | `sc_mur_jazda_rzeka_x1to2_lunge`, `sc_p3_rown_mix_d8l_palisada_218_x1to4_lunge`, `sc_fq_rown_mix_d8l_mury_217_x1to2_lunge` | Ciało liczy chwilę ciosu i ogon wypadu w `start` siatką sprzed zmiany (`siege_tactics_loop.rs:3196` `frame_raf(self.frame_ms, pu.body_ms)`, `:1991`); pin sprawdza `localT >= BLOW_HIT_T` w każdej klatce `_raf` nową siatką. Cios/zdarzenie o 1 klatkę (16–32 ms) później w Rust, klatek do końca +1. ZMIERZONE (3/4 przypadków `lunge`; jedyny zgodny ma zmianę, po której cios i tak wypada w tej samej klatce). |
| R — inne odcinki ciała w toku | `sc_p3_las_mix_d5_mury_123_x2to128_prehit`, `sc_fq_gory_lucz2_d6l_mury_191_x64to1_prehit`, `sc_fq_las_mix_d8l_palisada_122_x64to1_round`, `scm_mr_wzg_jazda3_d3l_mury_333_2_1_64`, `scm_mi_las_mix_d3l_palisada_118_1_512_1_4`, `scm_rt_mur_machiny_wylom_1_4_64_2` | Ten sam mechanizm prawdopodobny dla innych odcinków liczonych atomowo w `start` z `frame_ms` (ogon wypadu/strzału, przerwy `frame_sched`): przy zmianie z x64/x512 w dół albo do x64/x128 w górę inny odcinek ciała był w toku. Przyczyna szczegółowa per przypadek: NIE_ZMIERZONO (do tematu naprawczego). Np. 118: po zmianie x1→x512 (klatka 25) tura w chwili `vNow=776160` Rust 4 vs pin 6. |

Pomiar obrony #407 (32/32 zgodnych, zmiany wyłącznie `{round}` na c1) nie jest z tym sprzeczny: tutaj chwile zmiany celowo trafiają w wypad/pocisk/krok w toku, a jeden z 7 przypadków `round` (122, start x64) też się rozjeżdża.

Proponowany temat następczy (do decyzji orkiestratora): `FQ-SPEED-MIDCHANGE-DIV` — odcinki czasu ciała (wypad, ogon, przerwy) liczone przyrostowo po klatkach albo przeliczane przy `set_speed_idx`, tak jak pin; kryterium końca = lista `ROZBIEZNE_FQ_SPEED_MIDCHANGE` pusta.

## 5. Poprawka liczby w rejestrze

`speed_vectors.json` zawiera **288** wektorów = 32 scenariusze z klatką produkcyjną × 9 prędkości (`frames` = 32…8192, `speedMul` 2…512) — NIE 351. Sprawdzone `python3` na pliku (len = 288), plik bez zmian w tym temacie (MD5 `d764f078f08aa5df274e3f74d09df14b`). Wpis do `REJESTR-RUST.md` robi orkiestrator.

## 6. Bramki (engine, D-412-3)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (usunięty po bramkach), jeden build naraz, wolne 13 GB.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` | EXIT 0: 558 binarek, **4354 passed / 0 failed / 1 ignored** (baza 4352 + 2 nowe; `ignored` 1 — istniejący przed tematem) |
| Nowe testy (`--test p6_k5loop_wiring_a_pin zmiana_predkosci`) | 2 passed (276,9 s debug) |

Istniejące wektory bez regresji: `wektory_pinu_pelnej_bitwy_bajt_w_bajt` (50 wektorów vectors.json), `predkosc_bitwy_wektory_pinu_bajt_w_bajt` (288) — w pełnym teście (wyżej). c1 128/128 @1/@16 — kandydaci c1 nie są w repo (plik scratchpadu obrony #407); test z repo, który ich pilnował, nie istnieje — NIE_ZMIERZONO w tej rundzie (kod silnika bez zmian, więc wynik obrony #407 obowiązuje).

## 7. Zakazy — kontrola

Brak zmian w `gra/`, brak `#[ignore]`, brak osłabionych asercji (istniejące testy nietknięte), brak `git add -A` (dodawane pliki po nazwie), brak push/integracji, brak zmian kodu produkcyjnego, brak linii z nazwą modelu w commitach. Procesy `node`/`cargo` tematu zakończone po rundzie.
