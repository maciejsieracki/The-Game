# R-RUSTPORT-P6-K5LOOP-PIN3-DIVERGENCE-Q1 — Operator r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-PIN3-DIVERGENCE-Q1 (B-WIRA-PIN-3: realne rozbieżności logiki Rust vs pin, 11/128 bitew c1 @1 ms)
GOAL: zmierzyć i usunąć przyczyny rozbieżności Rust vs pin przy kroku klatki 1 ms; >= 3 rozróżniające przypadki w
      wektorach; dawne wektory bajt w bajt; mutanty >= 8
BAZA: origin/rust-port/parity-v2 = 540be622e608ee4261ddf4513ea4adb83ef8c666 (linia BAZA dispatchu)
GAŁĄŹ: rust-port-wip/pin3-divergence-q1 (lokalna, worktree wf_26a365c8-926-1), 7 commitów kodu nad bazą + raport
ZMIANY/COMMIT: §6, §10 (SHA)
TESTY: §7
BLOKADY: brak blokujących. Jawny wyjątek B-WIRA-PIN-3 klasy A (3 kandydaci, marsz atomowy ciała, §4) z testem
         pilnującym; 12 kandydatów rozbieżnych tylko przy klatce 16 ms = FRAME-QUANT (osobny temat, D-PIN2-2)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Web najpierw (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`, `git show`)

| Miejsce pinu | Treść istotna dla rozjazdów |
|---|---|
| `:9415-9437` `_runFastForward` | klatka FF: `vNow += FF_STEP_MS` → `_drainTimers()` → pociski/zaniki → kolejka `_ffQueue` (kroki animacji `_raf`). Zegary z `due <= vNow` wykonują się PRZED krokami animacji tej samej klatki. |
| `:9616-9634` `_drainTimers` | zegary w kolejności `due`, remis = `id` (kolejność `_schedule`); `_now()` w callbacku = czas klatki. |
| `:4208-4270` `_fireSiegeTowers` / `_fireOneTower` | cel w chwili wystrzału (`pickTowerTarget` na `u.q/u.r`), trafienie `_schedule(RANGED_FLY_MS)` → `_singleBlow(shooter, target, true)` na stanie celu W CHWILI trafienia. |
| `:8809-8880` `_singleBlow` | teren obrońcy z `defender.q/r` (`:8831-8833`), łuk `relativeHit(defender.facing, ...)` (`:8880`) — bieżące pole i zwrot. |
| `:8685-8775` `_doMove` | `occByKey.delete(old)/set(new)`, `ru.q/r`, `_updateFacing(ru)` w chwili STARTU kroku; animacja `_raf(step)` do `p >= 1`; kolejny krok wołany z callbacku kroku (decyzja w chwili kroku). |
| `:9799-9825` `_startRout` | `occByKey.delete(cellKey(ru.q, ru.r))` (`:9812`), zwrot ku własnej krawędzi (`:9818`). Marsz rozbitej jednostki w toku NIE jest przerywany (kolejne kroki `_doMove` dalej zajmują pola). |
| `:9223` `_doRangedAttack`, lunge `localT >= BLOW_HIT_T` | trafienie strzału = `_schedule` wołane z kroku `_raf`; cios wręcz = krok `_raf` — oba w fazie kroków animacji klatki. |

## 2. Metoda i pierwszy pomiar (odtworzenie 11 kandydatów)

- Kandydaci c1 odtworzeni generatorem `PIN2-PROBE-Q1/01-operator-r1-kandydaci-c1.py` (128, ziarno 100+i) → pin
  `WIRING_A_EXTRA` z `ffStepMs` 16 / 4 / 1 → Rust `kandydaci_z_pliku_na_zadanie`. **Wszystkie 11 rozbieżne @1 ms
  odtworzone** (te same nazwy co w §4.3 PIN2).
- **Ustalenie metodyczne (nowe):** sonda PIN2 porównywała pin @1 ms z Rust @16 ms. Rust przewija zegarem z krokiem
  `FF_STEP_MS = 16` (`siege_tactics_fastforward.rs`), czyli kwantyzuje zegary do 16 ms, a kroki ciała liczy nominalnie —
  model POŚREDNI. Przy takim porównaniu rozbieżnych @1 ms było **29/128** (nie 11): 18 kolejnych było zgodnych z pinem
  @16 i rozbieżnych @1 tylko przez krok zegara Rust. Dodano diagnostykę `WIRING_A_RUST_FF_STEP=<ms>` (Rust przy tym
  samym kroku klatki co pin, `SiegeBattleSession::diag_set_speed_mul`, bliźniak `WIRING_A_FF_STEP` generatora).
  Rust @1 vs pin @1 PRZED poprawkami: **14/128 rozbieżnych**; Rust @16 vs pin @16: 23/128 (105 zgodnych, jak w PIN2).
- Ślad: generator `WIRING_A_TRACE` (+ nowe `BLOW` z polem/zwrotem obu stron, `CAVT` z celem jazdy i pozycjami) vs Rust
  `slad_diagnostyczny_na_zadanie` (teraz także z pliku kandydatów, + linie `FACE`), zdarzenia sortowane po czasie.

## 3. Tabela 11 kandydatów (dispatch)

| Kandydat | Pierwszy rozjazd (ślad pin @1 vs Rust @1) | Przyczyna | Poprawka / status |
|---|---|---|---|
| `k_las_jazda_d6l_mury_111` | t. 52, 221 780 ms: a0 (Konnica) 39,72→39,73 w Rust, w pinie oscyluje 72↔71 | a3 rozbity przez wieżę W TRAKCIE własnego marszu (217 040 ms, krok 217 140 jeszcze przed nim); pin zwalnia pole z chwili rozbicia, a kolejny krok zajmuje 39,73; Rust (marsz atomowy) zwalniał pole końcowe 39,73 | **D-PIN3-5** (`09cbf6c95`) — zgodny @1 i @16 |
| `k_las_mix_d3l_palisada_118` | t. 48, 171 460 ms: a1 38,66→39,66 w pinie, →38,67 w Rust | rozbicie a0 (wieża, 171 220) w trakcie marszu a1 zwalnia 39,65 — pin decyduje o kroku w chwili kroku | **wyjątek klasy A** (B-WIRA-PIN-3, §4) |
| `k_las_mix_d6l_palisada_120` | brak przy tym samym kroku klatki (Rust @1 = pin @1 już przed poprawkami) | artefakt porównania: krok zegara Rust 16 ms vs pin 1 ms | zgodny @1; @16 rozbieżny = **FRAME-QUANT** |
| `k_las_mix_d5_mury_123` | j.w. (@1 zgodny); @16: trafienie wieży w trakcie marszu celu | @16: zwrot celu wieży po marszu zamiast w chwili trafienia | @1 zgodny; @16 zgodny po **D-PIN3-1** (wektor `p3_las_mix_d5_mury_123`, zabija M2) |
| `k_las_lucz2_d5_palisada_132` | trafienie wieży w cel w trakcie marszu | pole celu po marszu zamiast w chwili trafienia | **D-PIN3-1** (`e3bb8513e`) — zgodny @1 i @16 |
| `k_wzg_mix_d5_palisada_156` | t. 53, 243 440 ms: Rust trafia a2 (2 HP), pin pudłuje tym samym rzutem | `_singleBlow` wieży liczył teren i łuk z pola i zwrotu PO marszu (42,74) zamiast z chwili trafienia (42,76) | **D-PIN3-1** — zgodny @1 i @16 (wektor `p3_wzg_mix_d5_palisada_156`, zabija M1) |
| `k_gory_lucz2_d3l_palisada_190` | brak przy tym samym kroku klatki | artefakt kroku zegara Rust | zgodny @1; @16 = **FRAME-QUANT** |
| `k_gory_lucz2_d5_palisada_196` | t. 49, 150 900 ms: a4 24,79→24,78 w pinie, →25,79 w Rust | rozbicie a5 (150 740) w trakcie marszu a4 zmienia jego kolejny krok | **wyjątek klasy A** |
| `k_rown_mix_d8l_mury_217` | t. 35, 193 140 ms: Rust trafia a5 wieżą, pin pudłuje | kolejność rzutów RNG: trafienie strzału a5 (Rust: zegar z numerem z chwili `start`) przed trafieniem wieży; w pinie wieża (faza zegarów) przed strzałem (`_schedule` z fazy `_raf`) | **D-PIN3-3** (`11e4235d3`) — zgodny @1; @16 = FRAME-QUANT |
| `k_rown_mix_d8l_palisada_218` | t. 35, 193 140 ms (jak 217) | j.w. | **D-PIN3-3** — zgodny @1 i @16 (wektor `p3_rown_mix_d8l_palisada_218`) |
| `k_rown_lucz2_d3l_mury_221` | t. 68, 250 090 ms: a2 robi 3. krok w Rust, w pinie kończy na 2 | rozbicie a4 (249 890) w trakcie marszu a2 skraca marsz | **wyjątek klasy A** |

Poza 11 z dispatchu poprawki domknęły też: 121, 149, 181, 182, 213, 214 (@1; D-PIN3-1/-2) oraz 187, 219, 220 (@16).

## 4. Klasyfikacja wszystkich 128 kandydatów c1 po poprawkach

| Porównanie | Przed | Po |
|---|---|---|
| Rust @1 vs pin @1 (ten sam krok klatki) | 114 zgodnych | **125 zgodnych**; 3 rozbieżne = klasa A |
| Rust @16 vs pin @16 (model produkcyjny) | 105 zgodnych | **113 zgodnych**; 15 rozbieżnych = 3 klasa A + 12 FRAME-QUANT |
| Nowe rozbieżności (kandydat zgodny przed, rozbieżny po) | — | **0** (@1 i @16) |

- **Klasa A (B-WIRA-PIN-3, jawny wyjątek):** 118, 196, 221. Przyczyna zmierzona (§3): pin decyduje o każdym kroku marszu
  w chwili kroku i widzi rozbicie INNEJ jednostki od wieży w oknie marszu; ciało Rust liczy marsz atomowo w `start`
  (D-WIRA-18). Poprawka = marsz przyrostowy (ponowne planowanie pozostałych kroków po zdarzeniu zegara w oknie marszu,
  zmiana czasu `BodyDone`) — przebudowa ciała i sterownika poza zakresem rundy. Test pilnujący: wektory
  `a3_*_klatka1` na liście `ROZBIEZNE_B_WIRA_PIN_3` (test pada, gdy wektor zacznie się zgadzać albo skończy błędem sesji).
  Gameplay nie jest niejednoznaczny (pin rozstrzyga) — nie wymaga decyzji właściciela, tylko tematu technicznego.
- **FRAME-QUANT (D-PIN2-2, poza zakresem):** 120, 122, 154, 155, 157, 161, 162, 189, 190, 191, 204, 217 — zgodne @1,
  rozbieżne tylko @16: pin kwantyzuje czas kroków animacji do klatek (`_raf` co klatkę, koniec przy pierwszej klatce
  `p >= 1`), Rust liczy czasy kroków nominalnie.
- **`mur_jazda_rzeka` (dawny wyjątek B-WIRA-PIN-2) jest teraz ZGODNY @16 bajt w bajt** (D-PIN3-3 rozstrzyga remis t. 70:
  cios `localT >= 150` w fazie `_raf` po pocisku wieży z `_drainTimers`). Lista `ROZBIEZNE_B_WIRA_PIN_2` jest pusta;
  bliźniak `mur_jazda_rzeka_klatka1` liczony przy kroku 1 ms (D-PIN3-4) — zgodny.

## 5. Decyzje techniczne (do `REJESTR-RUST.md`, wpis orkiestratora)

- **D-PIN3-1** (`siege_tactics_loop.rs`, `tower_blow_full`): `_singleBlow` wieży czyta pole celu i zwrot W CHWILI trafienia
  (oś kroków `unit_cell_at`, nowa oś zwrotów `facing_timeline`/`facing_at`), nie stan po atomowo policzonym marszu.
  Pin `:4262-4266`, `:8831-8833`, `:8880`, `_doMove` `:8714-8757`.
- **D-PIN3-2** (`timeline_done`, `timeline_key`, `call_now`): krok marszu z kolejki `_raf` z `t0 == vNow` jest dla zegara
  (wieża) jeszcze niewykonany; krok wykonany synchronicznie w wywołaniu ciała (pierwszy krok z `_activateUnit`) —
  wykonany. Kolejność wpisów osi: chwila, faza zegara przed fazą `_raf`, remis = kolejność zapisu. Pin `:9427-9435`.
- **D-PIN3-3** (`SiegeLoop::body_done_raf`, sesja = `true`): skutek ciała (`BodyDone`: trafienie strzału, cios, koniec
  marszu) odkładany do fazy kroków animacji klatki (`_ffQueue`/rAF), po wszystkich zegarach z `due <= vNow`. Pin
  `:9223`, lunge `BLOW_HIT_T`, `:9427-9435`. Domyślnie `false` (dotychczasowe testy pętli bez zmian).
- **D-PIN3-4** (test, diagnostyka): wektor z własnym `frameMs` (bliźniak `_klatka1`) liczony w Rust przy tym samym kroku
  (`diag_set_speed_mul(frameMs/16)`, `#[doc(hidden)]`, wyłącznie testy; pin dopuszcza tylko `SPEED_STEPS >= 1`).
  Diagnostyka `WIRING_A_RUST_FF_STEP`. Bez wpływu na model produkcyjny (16 ms).
- **D-PIN3-5** (`start_rout`, `set_facing`): rozbicie W TRAKCIE własnego marszu nie zwalnia pola końcowego (pin: kolejne
  kroki `_doMove` je zajmują) i nie nadpisuje bieżącego zwrotu, gdy na osi jest późniejszy zwrot kroku (bieżący stan =
  zwrot najpóźniejszy w czasie). Pin `:9812`, `:9818`, `:8714-8757`.

## 6. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `engine/src/domain/siege_tactics_loop.rs` | D-PIN3-1/2/3/5: `facing_timeline`, `call_now`, `set_facing`, `facing_at`, `timeline_done`, `timeline_key`, `has_future_steps`, `body_done_raf` + `raf_pending` (faza `_raf` w `resume`/`step_realtime`), krotka `MoveStepAt` z flagą `synchr`; moduł testów `pin3_timeline_tests` (3 testy). |
| `engine/src/domain/siege_battle_session.rs` | `lp.body_done_raf = true`; `diag_set_speed_mul` (`#[doc(hidden)]`, D-PIN3-4). |
| `engine/tests/p6_k5loop_wiring_a_pin.rs` | `run_vector` z `frameMs`; `ROZBIEZNE_B_WIRA_PIN_2` pusta; `ROZBIEZNE_B_WIRA_PIN_3` (3); diagnostyka `WIRING_A_RUST_FF_STEP`, ślad z pliku kandydatów, `FACE`. |
| `engine/tests/p6_k5loop_wiring_a_gen.mjs` | 8 scenariuszy (5 rozróżniających `p3_*`, 3 wyjątku `a3_*_klatka1`); ślad `BLOW`/`CAVT` (tylko tryb śladu). |
| `engine/tests/p6_k5loop_wiring_a_pin_vectors/vectors.json` | 14 → 22 wektory; 14 dawnych bajt w bajt (diff = same dopiski). |
| `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-PIN3-DIVERGENCE-Q1/` | raport, `01-operator-r1-mutanty.py`. |

Nie ruszano: `bridge.rs`, `siege_battle_apply.rs` (WIRING-B), `siege_tactics_clock.rs`, `siege_tactics_fastforward.rs`,
`renderer/`, `gra/**`, `Cargo.*`, rejestru. Złoty skrót `p6_k5loop_wiring_a` **bez zmian** (`zlote_wyniki_sesji` ok).
Brak `#[ignore]`.

## 7. Testy / bramki

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
(`pin3/tgt-pin3-op`, usuwany po bramkach).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 (po `cargo fmt`, commit `a757194da`) |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `p6_k5loop_wiring_a_pin` (release) | 6/6 ok: 19 wektorów bajt w bajt + 3 jawny wyjątek klasy A |
| `p6_k5loop_wiring_a` (release) | 22/22 ok, złoty skrót bez zmian |
| `pin3_timeline_tests` (lib) | 3/3 ok |
| `cargo test --all-targets --no-fail-fast` | §7a |
| Generator (2 pełne regeneracje) | EXIT 0, strażnik SHA-256 pinu ok; `vectors.json` MD5 **`1fcd154c8ec119e4cdf1d1bc4c454853`**, `pin_data.json` MD5 `432eed76e34a0e8cc96ec548e88eae64` (bez zmian); `git status` czysty po drugiej regeneracji |
| Kandydaci c1 128 | @1: 125/128, @16: 113/128, 0 nowych rozbieżności (§4) |

### 7a. Pełny test
Kod `a757194da` (tło, `setsid nohup`, dev): **FULL_EXIT=0**, 547 × `test result: ok`, **4159 passed / 0 failed /
1 ignored** (istniejący, spoza diffu; baza PIN2-FC: 4156). W tym: `p6_k5loop_wiring_a_pin` 6, `p6_k5loop_wiring_a` 22,
`p6_k5loop_tags_rest` 5, `p6_k5loop_adapter` 27, `p6_k5loop_siege_atk_a` 8, `p6_k5loop_siege_atk_b` 10,
`p6_k5loop_siege_def` 10, `p6_battle_setup` 15, `p6_battle_setup_units` 7, `bridge_contract` 9 — wszystkie ok.
`git diff --check 540be622e` czysty; `Co-Authored-By` w commitach: brak.

## 8. Mutanty (`01-operator-r1-mutanty.py`; wektory + testy osi; źródła przywrócone, `git status` czysty)

| Mutant | Wektory | Testy osi | Wynik |
|---|---|---|---|
| M1 wieża: pole celu po marszu | ZABITY (`p3_wzg_mix_d5_palisada_156`) | — | ZABITY |
| M2 wieża: zwrot celu po marszu | ZABITY (`p3_las_mix_d5_mury_123`) | — | ZABITY |
| M3 krok `t0 == vNow` zawsze wykonany | ZABITY (`p3_gory_mix_d3l_mury_181_klatka1`) | ZABITY | ZABITY |
| M4 krok `t0 == vNow` nigdy wykonany (ignoruje `synchr`) | przeżył (brak przypadku w 256 kandydatach) | ZABITY (`krok_w_tej_samej_chwili_co_zegar`) | ZABITY |
| M5 skutek ciała jako zwykły zegar (bez fazy `_raf`) | ZABITY (`mur_jazda_rzeka`, `p3_rown_mix_d8l_palisada_218`) | — | ZABITY |
| M6 rozbicie w marszu zwalnia pole końcowe | ZABITY (`p3_las_jazda_d6l_mury_111`) | — | ZABITY |
| M7 zwrot z wcześniejszej chwili nadpisuje bieżący | przeżył | ZABITY (`rozbicie_w_trakcie_marszu_nie_cofa_zwrotu_z_pozniejszego_kroku`) | ZABITY |
| M8 remis chwili: fazy zegara i `_raf` bez rozróżnienia | przeżył | ZABITY (`zegar_i_krok_w_tej_samej_chwili_krok_wygrywa`) | ZABITY |

**8/8 zabitych.** M4/M7/M8 tylko testami osi (niezmienniki kolejności klatki pinu) — w 256 losowych bitwach przypadek
nie wystąpił w sposób zmieniający wynik (dług: wektor pełnej bitwy NIE_ZMIERZONO).

## 9. Długi

| ID | Stan |
|---|---|
| B-WIRA-PIN-3 klasa A / MARCH-INCREMENTAL | 3/128 kandydatów c1 (118, 196, 221): marsz atomowy ciała nie widzi rozbicia innej jednostki w oknie marszu. Temat następczy: marsz przyrostowy w `ProdBody` + sterownik (przeplanowanie kroków i `BodyDone`). Wektory `a3_*_klatka1` pilnują. |
| FRAME-QUANT (D-PIN2-2) | 12/128 c1 rozbieżnych tylko @16 (lista §4); `mur_jazda_rzeka` już zgodny. Kryterium tematu do aktualizacji: 12 kandydatów z §4 zamiast dawnych 12 z PIN2. |
| Zabicie (`_startFade`) w trakcie własnego marszu | D-PIN3-5 obejmuje tylko rozbicie; czy pin kontynuuje marsz zabitej jednostki — NIE_ZMIERZONO (brak przypadku w kandydatach). |
| M4/M7/M8 na wektorze pełnej bitwy | zabite tylko testami osi; wektor NIE_ZMIERZONO. |
| Oś zwrotów: `prev` wpisu przy zapisach nie w kolejności czasu | `facing_at` dla chwili przed wszystkimi wpisami zwraca `prev` najwcześniejszego — przybliżenie przy wielu wpisach spoza kolejności; brak przypadku w kandydatach. |
| `diag_set_speed_mul` | API diagnostyczne (`#[doc(hidden)]`), wartości < 1 nie są w `SPEED_STEPS` pinu; produkcyjne sterowanie prędkością (`_setSpeedIdx`) — NIEPORTOWANE. |
| pozostałe (PIN2 FC §5) | bez zmian |

## 10. Commity (gałąź `rust-port-wip/pin3-divergence-q1`, nad `540be622e`)

| SHA | Treść |
|---|---|
| `e3bb8513e` | D-PIN3-1 + diagnostyka kroku FF Rust |
| `cd4a7139e` | D-PIN3-2 |
| `11e4235d3` | D-PIN3-3, D-PIN3-4, `mur_jazda_rzeka` zgodny @16 |
| `09cbf6c95` | D-PIN3-5 |
| `7681aad28` | kolejność osi (faza zegara przed `_raf`), testy osi, skrypt mutantów |
| `73af7c5f4` | 5 wektorów rozróżniających + 3 wektory wyjątku B-WIRA-PIN-3 |
| `a757194da` | `cargo fmt` |
| (commit raportu) | ten raport — SHA końcowy podaje wynik Workflow |

## 11. Kryteria końca dispatchu

| Kryterium | Stan |
|---|---|
| Tabela 11 kandydatów: pierwszy rozjazd, przyczyna, poprawka albo wyjątek z testem | spełnione (§3): 5 poprawionych (D-PIN3-1/3/5), 3 artefakt kroku zegara (zgodne @1), 3 wyjątek klasy A z testem |
| 128 c1 @1 ms: 0 albo każdy sklasyfikowany | 125 zgodnych, 3 sklasyfikowane (klasa A, wektory pilnujące) |
| Dawne wektory bajt w bajt | 14/14 (rekordy i bajty bez zmian; diff `vectors.json` = same dopiski) |
| >= 3 rozróżniające przypadki w wektorach, strażnik SHA, MD5 | 5 (`p3_*`), strażnik ok, MD5 odtwarzalne |
| Mutanty >= 8 | 8/8 zabitych |
| Złoty skrót `p6_k5loop_wiring_a` | bez zmian |
