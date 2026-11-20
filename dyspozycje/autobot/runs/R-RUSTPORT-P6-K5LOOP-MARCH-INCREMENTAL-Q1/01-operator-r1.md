# R-RUSTPORT-P6-K5LOOP-MARCH-INCREMENTAL-Q1 — Operator r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-MARCH-INCREMENTAL-Q1 (klasa A z PIN3: marsz jednostki krok po kroku jak w pinie; c1 118/196/221)
GOAL: wynik Rust bajt w bajt zgodny z pinem dla c1 118, 196, 221 (@1 i @16 ms) — decyzja o kolejnym kroku marszu w chwili
      kroku, nie atomowo przy starcie aktywacji; ROZBIEZNE_B_WIRA_PIN_3 pusta; dawne wektory bajt w bajt; mutanty >= 20
BAZA: origin/rust-port/parity-v2 = 3e5db0673b26c0838d23f621e8727ffd051a9c88 (linia BAZA dispatchu, zawiera FRAME-QUANT)
GAŁĄŹ: rust-port-wip/march-incremental-q1 (lokalna, worktree wf_be2f551a-b12-1)
ZMIANY/COMMIT: §6, §10
TESTY: §7
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Web najpierw (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`, `git show`)

Ślad pinu przy kroku klatki 1 ms (generator `WIRING_A_TRACE`, nowa diagnostyka `WALK` = każde wejście metody marszu
wielokrokowego z pozycją i `moveLeft`) dla trzech kandydatów klasy A:

| Kandydat | Metoda marszu w pinie | Co zmienia się między krokami |
|---|---|---|
| `k_las_mix_d3l_palisada_118` | `_advanceStep` (a1: 37,65 → 38,65 → 38,66 → 39,66 → 39,65; wejścia 170 840, 171 150, 171 460, 171 770) | wieża rozbija a0 w 171 220 (`_startRout` `:9812` zwalnia 39,65); wejście 171 460 liczy BFS na nowej zajętości |
| `k_gory_lucz2_d5_palisada_196` | `_advanceStep` (a4: 23,79 → 24,79 → 24,78 → 25,78) | rozbicie a5 w 150 740; wejście 150 900 wybiera inny krok |
| `k_rown_lucz2_d3l_mury_221` | `_rangedForwardStep` (a2: 38,81 → 39,81 → 39,82; trzecie wejście 250 090 bez kroku) | rozbicie a4 (sojusznik wręcz) w 249 890 zmienia `meleeLine` / `lineAllowsRangedStep` (`:6791-6798`) |

Ustalenie: **dispatch wskazywał `_siegeWalkTo` (`:8006-8019`), ale żaden z trzech kandydatów nie idzie tą ścieżką** —
118 i 196 to `_advanceStep` (`:8198-8285`), 221 to `_rangedForwardStep` (`:6776-6809`). Klasa ta sama (A: decyzja kroku
w chwili kroku), metoda inna. Mechanika wszystkich marszy w pinie jest jednakowa:

| Miejsce pinu | Treść |
|---|---|
| `_advanceStep` `:8199-8202`, `_rangedForwardStep` `:6777-6779` | preludium KAŻDEGO wejścia: `finished`, `dead`/`fadingOut`, `moveLeft <= 0` (stan w chwili wejścia) |
| `_doMove` `:8685-8775` | `occByKey`, `ru.q/r`, `_updateFacing` w chwili startu kroku; animacja `_raf(step)` do `p >= 1` |
| callback kroku `:8273-8284` / `:8222-8229` / `:6800-6807` / KITE `:6704-6716` | w fazie kroków klatki (`_raf`), PO `_drainTimers`: `lastAutoMoveFrom`, `finished`, `_canAttackFrom` / wejście w zasięg (`_rangedAction` od nowa), `moveLeft > 0` → `_schedule(STEP_GAP_MS, () => metoda(ru, done))`, inaczej `done()` |
| `_schedule` `:9595-9606`, `_drainTimers` `:9616-9634` | przerwa to zwykły zegar (`due = vNow + 70`, `id` z chwili końca kroku); kolejne wejście w fazie zegarów, w kolejności `due`/`id` z wieżami |
| odmowa bramki `:8689-8692` | `ru.moveLeft = 0; done()` synchronicznie, bez callbacku |

Rust przed tematem liczył cały marsz w `start` (D-WIRA-18) ze stanu z chwili startu aktywacji; zdarzenia zegara z okna
marszu (trafienie i rozbicie od wieży) były widoczne tylko przez oś czasu dla CZYTAJĄCYCH (wieża), nie dla DECYZJI
kolejnych kroków.

## 2. Rozwiązanie (D-MI-1, D-MI-2)

- **D-MI-1 marsz krok po kroku** (`ProdBody::march_incremental`, sesja = `true`): `_advanceStep` i `_rangedAction` /
  `_rangedForwardStep` (z KITE) w modelu pinu. Pierwsze wejście synchronicznie w `start` (jak `_activateUnit`), krok
  `_doMove` w chwili wejścia. Dalej stan `MarchCont` i odroczone wywołania ciała (`take_timers`/`fire_timer`, ten sam
  mechanizm co kamień katapulty): koniec kroku po `frame_raf(MOVE_STEP_MS)` → callback kroku; przerwa
  `_schedule(STEP_GAP_MS)` planowana Z CHWILI KOŃCA KROKU (nominalny `due`, `id` jak w pinie, klatkę wyznacza zegar) →
  kolejne wejście, które czyta BIEŻĄCY stan (`st`: martwi/rozbici/`finished`, zajętość `occByKey`, `ru.routed` do bramki
  muru). `done()`/cios/strzał zgłaszane przez `LoopBody::take_march_done` z czasem do skutku; cios po marszu idzie wspólną
  ścieżką `attack_tail` (wydzielony z `start` bez zmian treści). Sterownik nie planuje `BodyDone` po `start`, gdy
  `LoopBody::march_pending`. Dawny marsz atomowy zostaje dla `march_incremental = false` (wektory pętli bez sesji).
- **D-MI-2 faza kroków klatki**: koniec kroku (callback `_raf`) jest odroczonym wywołaniem fazy kroków
  (`LoopBody::timer_raf`) — sterownik odkłada je jak `BodyDone` (D-PIN3-3) do kolejki `_raf`/`_ffQueue` po
  `_drainTimers` (`raf_pending: Vec<LoopTimer>`, `fire_raf_next`), a `done()` zgłoszone w tej fazie wykonuje od razu
  (`in_raf`), w tej samej klatce. Przerwa (wejście z zegara) zostaje w fazie zegarów.
- Bez zmiany reguł gameplay; każda decyzja to te same klocki co dotąd (`flank_decide`, `advance_step_decide`,
  `advance_after_move`, `best_forward_step`, `ranged_line_allows_step`, `best_kite_shot_step`), tylko w chwili pinu.

Oś czasu ciała (D-WIRA-18, D-PIN3-1/2/5, D-FQ-2) dla marszy krok po kroku jest trywialna (każdy wpis `t0 <= vNow` w
chwili zapisu); zostaje dla marszy nadal atomowych (§9).

## 3. Kandydaci c1 (128, pliki pinu z PIN3/FQ, binarka `p6_k5loop_wiring_a_pin` release)

| Klatka | Przed (baza 3e5db0673) | Po | Rozbieżne po |
|---|---|---|---|
| @1 ms | 125/128 | **128/128** | — |
| @16 ms (produkcja) | 125/128 | **128/128** | — |
| @32 ms (diagnostyka, FQ-SPEED poza zakresem) | 124/128 (118, 127, 155, 196) | 127/128 | `k_wzg_mix_d5_mury_155` (dług FQ-SPEED, bez zmian) |

Nowe rozbieżności (zgodny przed, rozbieżny po): **0** przy każdej klatce. 127 @32 ms zgodny po tym samym mechanizmie
(tylko pomiar, dług FQ-SPEED nie w zakresie).

## 4. Wektory

- `ROZBIEZNE_B_WIRA_PIN_3` **pusta**; trzy dawne wyjątki `a3_*_klatka1` są zwykłymi wektorami bajt w bajt, a test pilnuje,
  że nadal są w pliku (`DAWNA_KLASA_A`).
- Dopisane 3 wektory `mi_las_mix_d3l_palisada_118`, `mi_gory_lucz2_d5_palisada_196`, `mi_rown_lucz2_d3l_mury_221` (te same
  bitwy przy klatce produkcyjnej 16 ms; przed tematem rozbieżne także @16). 42 → **45** wektorów; 42 dawne bajt w bajt
  (porównanie JSON 1:1, diff = same dopiski, 0 linii usuniętych).
- Generator: dopiski (3 scenariusze + diagnostyka `WALK` tylko w trybie śladu), strażnik SHA-256 pinu bez zmian, dwie pełne
  regeneracje: `vectors.json` MD5 **`dae3e46efdffe94061347f93e7fc1038`** (2×), `pin_data.json`
  `432eed76e34a0e8cc96ec548e88eae64` (bez zmian).

## 5. Decyzje techniczne (do `REJESTR-RUST.md`, wpis orkiestratora)

- **D-MI-1** — j.w. §2 (marsz krok po kroku `_advanceStep`/`_rangedAction`/`_rangedForwardStep`/KITE; trait:
  `march_pending`, `take_march_done`, `timer_raf`, wszystkie z domyślnymi wartościami = dawne zachowanie).
- **D-MI-2** — j.w. §2 (callback kroku w fazie `_raf`, `done()` z tej fazy od razu).
- **D-MI-3** (test) — dawne wyjątki klasy A stają się zwykłymi wektorami; nowe `mi_*` @16.

## 6. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `engine/src/domain/siege_tactics_loop.rs` | trait `LoopBody`: `march_pending`, `take_march_done`, `timer_raf` (domyślne); `SiegeLoop`: `raf_pending: Vec<LoopTimer>`, `in_raf`, `fire_raf_next`, `defer_to_raf` dla `BodyTimer` z `timer_raf`, `ActivateUnit` bez `BodyDone` przy marszu w toku, `BodyTimer` → `take_march_done`; `ProdBody`: `march_incremental`, `MarchKind`/`MarchStage`/`MarchCont`/`MarchNext`, `advance_enter`, `advance_step_end`, `march_move`, `ranged_action_enter`, `ranged_forward_enter`, `ranged_step_end`, `march_advance`, `march_fire`, `march_start_dur`, `attack_tail` (wydzielony z `start`, treść bez zmian); moduł testów `march_incremental_tests` (11). |
| `engine/src/domain/siege_battle_session.rs` | `body.march_incremental = true` (1 linia + komentarz). |
| `engine/tests/p6_k5loop_wiring_a_pin.rs` | `ROZBIEZNE_B_WIRA_PIN_3` pusta, `DAWNA_KLASA_A` (asercja obecności). |
| `engine/tests/p6_k5loop_wiring_a_gen.mjs` | 3 scenariusze `mi_*`; ślad `WALK` (tylko `WIRING_A_TRACE`). |
| `engine/tests/p6_k5loop_wiring_a_pin_vectors/vectors.json` | 42 → 45 (dopiski). |
| `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-MARCH-INCREMENTAL-Q1/` | raport, `01-operator-r1-mutanty.py`. |

Nie ruszano: `bridge.rs`, `siege_battle_apply.rs`, `city_capture_apply.rs`, `playable.rs`, `siege_surrender.rs`,
`siege_transfer*.rs`, `client`, `renderer`, `src-tauri`, `gra/`, `Cargo.*`, rejestru. Brak `#[ignore]`.

## 7. Testy / bramki

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` =
scratchpad `march-inc/tgt` (usuwany po bramkach), wszystkie pliki tymczasowe w `scratchpad/march-inc/`.

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 (kod `f1ed9468d`) |
| `p6_k5loop_wiring_a_pin` (release) | 8/8 ok; 45 wektorów bajt w bajt, lista klasy A pusta |
| `march_incremental_tests` (lib, release) | 11/11 ok |
| `cargo test --release --all-targets --no-fail-fast` (engine, w tle, kod `f1ed9468d`) | **FULL_EXIT=0**: 553 × `test result: ok`, **4232 passed / 0 failed / 1 ignored** (istniejący, spoza diffu); w tym `p6_k5loop_wiring_a*` (złoty skrót `zlote_wyniki_sesji` BEZ zmian, `czas_rzeczywisty_niezalezny_od_podzialu_krokow` ok), `p6_k5loop_wiring_b*`, `bridge_contract`, `p6_k5loop_*`, `p6_zdobycie_miasta_a*`, `march_incremental_tests`, `pin3_timeline_tests` |
| `git diff --check 3e5db0673 HEAD` | czysty |
| Kandydaci c1 128 | @1 128/128, @16 128/128, @32 127/128 (§3) |

## 8. Mutanty (`01-operator-r1-mutanty.py`; podmiana w źródle, build, wektory + 256 kandydatów; ocalałe dodatkowo w trybie `--lib`)

| ID | Mutant | Wektory/kandydaci | Testy lib | Wynik |
|---|---|---|---|---|
| A1 | **marsz atomowy** (sesja bez `march_incremental`) | FAIL: 6 wektorów (a3_×3, mi_×3), @1 125/128, @16 125/128 | — | ZABITY |
| A2 | koniec kroku w fazie zegarów (`timer_raf` = false) | ok | `etapy_marszu_krok_po_kroku` | ZABITY |
| A3 | przerwa też w fazie kroków | FAIL (fq_*_klatka4 ×3) | — | ZABITY |
| A4 | wejście `_advanceStep` bez preludium dead/fadingOut | ok | `smierc_miedzy_krokami_konczy_marsz` | ZABITY |
| A5 | callback bez `lastAutoMoveFrom` | FAIL, @1 83/128 | — | ZABITY |
| A6 | callback `_advanceStep` bez `finished` | ok | `koniec_bitwy_w_trakcie_kroku_konczy_marsz` | ZABITY |
| A7 | odmowa bramki muru czeka na koniec kroku | FAIL, @1 104/128 | — | ZABITY |
| A8 | `ru.routed` do bramki ze startu aktywacji | ok | `rozbicie_w_trakcie_marszu_widoczne_w_bramce_kolejnego_kroku` | ZABITY |
| A9 | decyzja `_advanceStep` z `moveLeft` startu aktywacji | ok | ok | **RÓWNOWAŻNY**: `moveLeft` decyzji służy tylko do preludium `<= 0`; przerwa jest planowana wyłącznie przy `moveLeft > 0` (callback), a pierwsze wejście ma tę samą wartość — obie wartości są dodatnie albo równe |
| A10 | `_rangedForwardStep` bez `moveLeft <= 0` | ok | `marsz_strzelca_bez_ruchu_konczy_od_razu` | ZABITY |
| A11 | wejście w zasięg = koniec (bez `_rangedAction`) | FAIL, @1 38/128 | — | ZABITY |
| A12 | NaN `moveLeft` kontynuuje | ok | `marsz_strzelca_nan_konczy_po_kroku` | ZABITY |
| A13 | przerwa 71 ms | ok | `etapy_marszu_krok_po_kroku` | ZABITY |
| A14 | koniec kroku 1 ms wcześniej | FAIL, @1 121/128 | — | ZABITY |
| A15 | `done()` z fazy kroków przez zegar | FAIL, @16 123/128 | — | ZABITY |
| A16 | `march_pending` zawsze false | FAIL (test wektorów pada; kandydaci przerwani po 6/128) | — | ZABITY |
| A17 | KITE bez strzału w zagrożenie po kroku | ok | ok | **RÓWNOWAŻNY**: w pinie (`:6709-6713`) gałąź `meleeThreat` jest martwa — `_rangedTargetInRange` (`:7041-7052`) obejmuje każdego żywego, nierozbitego wroga w `[1..range]`, więc zagrożenie spełniające warunek zawsze jest już wynikiem pierwszego zapytania |
| A18 | strzał z marszu bez ogona (`fly + gap`) | FAIL, @1 113/128 | — | ZABITY |
| A19 | cios po marszu przesunięty o klatkę | ok | `cios_przy_kolejnym_wejsciu_od_chwili_wejscia` | ZABITY |
| A20 | `moveLeft` marszu nie trafia do `complete` | ok | `etapy_marszu_krok_po_kroku` | ZABITY |
| A21 | `_rangedForwardStep` bez preludium dead | ok | `marsz_strzelca_preludium_przy_wejsciu` | ZABITY |
| A22 | callback strzelca bez `finished` | ok | `strzelec_koniec_bitwy_w_trakcie_kroku_bez_strzalu` | ZABITY |
| A23 | KITE bez `finished` w callbacku | ok | `strzelec_koniec_bitwy_w_trakcie_kroku_bez_strzalu` | ZABITY |
| A24 | `BodyTimer` końca kroku bez odroczenia do fazy kroków | ok | `sterownik_koniec_kroku_po_zegarach_i_done_w_tej_samej_klatce` | ZABITY |

**24 mutanty: 22 zabite, 2 jawnie równoważne (A9, A17), mutant „marsz atomowy” (A1) = FAIL.** Źródła przywracane po
każdym mutancie (`git status` czysty po przebiegu).

## 9. Zamknięte / zostaje długiem

| Pozycja | Stan |
|---|---|
| Klasa A (B-WIRA-PIN-3): 118, 196, 221 @1 i @16 | **ZAMKNIĘTE** (bajt w bajt; lista wyjątków pusta) |
| 127 @32 ms | zgodny po D-MI-1 (pomiar; FQ-SPEED poza zakresem) |
| **MARCH-INCREMENTAL-RESZTA** | nadal atomowe: `_siegeWalkTo` (`:8006-8019`), `_fallBackStep` (`:7228-7243`), `_fleeStep` (`:9845-9897`), `_rangedBackStep` (`:7029`), `_kiteStep` (`:7091`), `_rangedApproachStep` (`:7283`), kroki jazdy. W 128 c1 żadna rozbieżność z nich nie wynika (@1/@16 128/128); przypadek z rozbiciem w ich oknie marszu NIE_ZMIERZONO. Ten sam mechanizm D-MI-1/2 do przeniesienia. |
| FQ-SPEED (`k_wzg_mix_d5_mury_155` @32) | bez zmian, poza zakresem |
| D-PIN3-3-SHOT-ID | poza zakresem, bez zmian |
| Duplikacja marszu atomowego i krokowego | `advance_step`/`ranged_action` zostają dla `march_incremental = false` (wektory pętli bez sesji); do usunięcia, gdy te testy przejdą na model pinu |
| Kolejność akcji sesji | akcje `Move` kolejnych kroków są emitowane w chwili kroku (wcześniej wszystkie przy starcie aktywacji, z przyszłym `t0`); treść akcji i `t0` bez zmian; złoty skrót sesji (liczba akcji, wynik) bez zmian, niezależność od podziału kroków zielona. |
| Przełączenie czas rzeczywisty → przewijanie w trakcie marszu | marsz w zegarze sterownika (przechodzi przez `resume`); niezależność od podziału kroków pilnowana dotychczasowymi testami sesji |

## 10. Commity (gałąź `rust-port-wip/march-incremental-q1`, nad `3e5db0673`)

| SHA | Treść |
|---|---|
| `0c3a30362` | generator: ślad `WALK` (diagnostyka) |
| `efdc8219e` | D-MI-1/2: marsz krok po kroku |
| `93695a25e` | lista klasy A pusta, 3 wektory `mi_*`, skrypt mutantów |
| `c09130fa6` | testy lib `march_incremental_tests` + `cargo fmt` |
| `f1ed9468d` | test A22, tryb `--lib` skryptu |
| (commit raportu) | ten raport — SHA końcowy w wyniku Workflow |

## 11. Kryteria końca dispatchu

| Kryterium | Stan |
|---|---|
| 128/128 c1 @1 i @16 | spełnione |
| `ROZBIEZNE_B_WIRA_PIN_3` pusta | spełnione |
| 42+ wektorów bajt w bajt (stare bez zmian) | 45; 42 dawne bez zmian |
| Mutanty >= 20 w logice kroku marszu, „marsz atomowy” = FAIL | 24 (22 zabite, 2 równoważne), A1 FAIL |
| Tabela zamknięte / dług | §9 |
