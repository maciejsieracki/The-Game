# R-RUSTPORT-P4-FQ-SPEED-Q1 — Obrona Operatora r1 (odpowiedź na 02-evaluator.md)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-FQ-SPEED-Q1 (prędkość bitwy speedMul ≠ 1: zgodność z pinem i klatka renderera z PlaybackOpts)
GOAL: odpowiedź na zarzuty Z1–Z3 i uwagi N1–N4 Evaluatora r1 (7d6754ae1): PRZYJMUJĘ z poprawką i dowodem albo ODRZUCAM
BAZA: 7d6754ae1 (raport Evaluatora) nad 342d5ad86 (Operator r1) nad ee1ceda3ebed21f90ec207f9e541e792738f7abc (linia BAZA)
ZMIANY/COMMIT: ca30599a3 (kod + testy), commit tego raportu (SHA w wyniku Workflow); allowlista §5
TESTY: §4 (engine: fmt, clippy -D warnings, lib + 38 binarek pętli/sesji release = 499 passed / 0 failed; renderer: fmt;
       bramka renderera NIE ODTWORZONO — dysk)
BLOKADY: bramka renderera (clippy/test) i mutanty R4/R5 NIE ODTWORZONO — wolne 5,5 GB (< 12 GB) i równoległy build
         innego tematu (`wf_a3715841-1e5-3`, MARCH-RESZTA); pełny `cargo test --all-targets` engine NIE ODTWORZONO z tego samego
         powodu (zastąpiony zestawem binarek dotkniętego kodu, §4)
RUNDY: 1/5 (obrona rundy 1)
NASTĘPNY KROK: Evaluator r2 — odtworzyć bramkę renderera (≥ 12 GB) i mutanty R4/R5 na nowych testach; pełny test engine
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Z1 (renderer: gałęzie `Shot` i `Boulder` bez testu zabijającego R4/R5) — PRZYJMUJĘ

Zarzut trafny: przy ×4 siatki 64 ms i 16 ms dają te same chwile (380 → 384, 700 → 704), a jedyne testy `frame_ms ≠ 16`
dla `Shot`/`Boulder` nie istniały. Dopisane (commit `ca30599a3`):

| Test | Plik | Co sprawdza | Zabija |
|---|---|---|---|
| `fq_speed_shot_lands_on_the_session_frame_grid` | `renderer/tests/battle_playback_move_shot.rs` | klatka 256 (×16) i 512 (×32): `t0 + 512` przyjęte jak nominalne `t0 + 380` (te same wywołania sceny i scena); `t0 + 384` przy 256/512 → `ShotLandAt`; `t0 + 512` przy 16 → `ShotLandAt`; odrzucony strzał nie rusza sceny | R4 (gałąź `Shot` stałą 16 ms: 512 przy klatce 256 → błąd, 384 przy 256 → przyjęte) |
| `fq_speed_boulder_lands_on_the_session_frame_grid` | `renderer/tests/battle_playback_siege.rs` | klatka 128 (×8) i 256 (×16): `t0 + 768` przyjęte jak nominalne `t0 + 700`; `t0 + 704` przy 128/256 → `BoulderLandAt`; `t0 + 768` przy 16 → `BoulderLandAt`; scena nietknięta | R5 (gałąź `Boulder` stałą 16 ms) |

Pin: `_schedule(RANGED_FLY_MS)` `:9223`, `_schedule(700)` `:7555`, `_drainTimers` `:9616-9634` (pierwsza klatka z
`vNow >= due`), `FF_STEP_MS = _scaledWallDelta(16) = 16 * speedMul` `:9419`, `:9512-9515`. Wartości: `ceil(380/256)*256 =
ceil(380/512)*512 = 512`, `ceil(700/128)*128 = ceil(700/256)*256 = 768`.

`cargo fmt --check` renderera: EXIT 0. **Kompilacja i przebieg tych testów oraz mutanty R4/R5: NIE ODTWORZONO** —
bramka renderera wymaga ≥ 12 GB wolnego i braku równoległego builda (dispatch, §BRAMKI); w chwili obrony wolne 5,5 GB, a w
`wf_a3715841-1e5-3` trwa build engine innego tematu. Do odtworzenia przez Evaluatora r2 (mutacje: w `playback.rs` gałąź
`ShotLandAt` / `BoulderLandAt` z `PIN_FRAME_MS` zamiast `self.opts.frame_ms`).

## 2. Z2 (silnik: martwa gałąź `ranged` `at == 0`, nieodróżnialne S3/E7) — PRZYJMUJĘ

**Osiągalność (dowód z kodu).** Atomowa gałąź `if ranged { … }` w `ProdBody::start` (`siege_tactics_loop.rs`) wykonuje się
tylko bez `march_incremental` (`if ranged && self.march_incremental { … return … }` tuż przed nią). Jedyny produkcyjny
konstruktor `ProdBody` to `SiegeBattleSession` (`siege_battle_session.rs:959`), który ustawia `march_incremental = true`
(`:1055`) razem z `pin_blow_timing = true` (`:1048`). `pin_blow_timing = true` bez `march_incremental` występuje wyłącznie w
testach modułu (`pin3_timeline_tests`), a `body_done_raf` (jedyny konsument flagi) tylko w sesji (`:1143`) i w atrapach
sterownika. Wniosek: część `at == 0` (flaga + nominalne 380) była nieosiągalna w produkcji i bez znaczenia poza nią —
zgodne z sondą P1 Evaluatora.

**Poprawka: usunięcie** (commit `ca30599a3`): gałąź atomowa wraca do modelu sprzed tematu (`at + frame_sched(380)`), z
komentarzem, że strzał w chwili wywołania ciała w sesji idzie przez `MarchNext::Shot`. D-FQS-1 obejmuje teraz dokładnie dwa
miejsca osiągalne w sesji: `attack_tail` z `attack_pre == 0` (E1 zabity korpusem) i `MarchNext::Shot` (wejście marszu
strzelca).

**`MarchNext::Shot` (S3, E7) — test rozróżniający.** Korpus pinu nie rozróżnia tych mutantów, bo wymagają zbieżności w
jednej klatce trafienia strzału z wejścia marszu i innego zegaru z rzutem RNG o `due` w `(t0+380, koniec klatki]`
(NIE_ZMIERZONO szukaniem kandydatów — 512 świeżych bitew Evaluatora i 128 c1 × 12 klatek Operatora bez takiego przypadku).
Semantykę pinu sprawdzają więc testy jednostkowe (wg tekstu pinu `_doRangedAttack` `:9223-9229`, `_schedule` `:9595-9605`,
`_drainTimers` `:9616-9634`):

| Test (`siege_tactics_loop.rs`, `march_incremental_tests`) | Co sprawdza | Zabija |
|---|---|---|
| `strzal_z_wejscia_marszu_jest_zegarem_z_nominalnym_due` | przy klatce 16/64/256 strzał z pierwszego wejścia `_rangedAction` (z szablonem strzału, więc `shot = Some`): `start` zwraca nominalne `RANGED_FLY_MS` (nie 384/384/512), `done_is_timer == true`, ogon `RANGED_GAP_MS` | **S3** (flaga `false`), **E7** (`fly` zamiast nominalnego) |
| `trafienie_strzalu_w_fazie_zegarow_wg_due` (atrapa `ShotTimerMock`) | sterownik z `body_done_raf`: `BodyDone` o `due + 380` z `done_is_timer` odpala się PRZED zwykłym zegarem `due + 383` tej samej klatki; bez flagi (model D-PIN3-3) PO nim | **D1** (`defer_to_raf` ignoruje `done_is_timer`) |

Uwaga do istniejącego testu `strzal_z_pierwszego_wejscia_marszu_ma_czas_do_skutku`: działa bez szablonu strzału
(`begin_shot` → `strzal-bez-szablonu`, `shot = None`), więc jego gałąź `if shot` nigdy się nie wykonuje — dlatego E7
przeżywał. Nowy test ma szablon (`neutral_tower_shot_template`) i asercję `shot.is_some()`.

Mutanty (skrypt `fqspeed-obrona-mut.sh` w scratchpadzie; podmiana → `cargo test --release --lib march_incremental_tests` →
przywrócenie; `git diff` po przebiegu = tylko zmiany commitu):

| ID | Mutant | Wynik |
|---|---|---|
| S3 | `MarchNext::Shot`: `shot_done_timer = false` | **ZABITY** (`strzal_z_wejscia_marszu_jest_zegarem_z_nominalnym_due`) |
| E7 | `MarchNext::Shot`: `fly` zamiast `RANGED_FLY_MS` | **ZABITY** (jw.) |
| D1 | `defer_to_raf`: `BodyDone` odkładany bez względu na `done_is_timer` | **ZABITY** (`trafienie_strzalu_w_fazie_zegarow_wg_due`) |
| E2/E3/P1 | gałąź `ranged` `at == 0` | **USUNIĘTA** (kod nie istnieje) |
| S4 | strzał po krokach atomowych (`attack_pre > 0`) jako zegar | bez zmian: PRZEŻYŁ (gałąź `attack_tail` z `attack_pre > 0` ze strzałem praktycznie nieosiągalna w sesji: strzelec z amunicją idzie `_rangedAction` krok po kroku; zostaje w dawnym modelu, jak w r1) |

## 3. Z3 (pomiar: teza „FQ-SPEED ZAMKNIĘTE dla ×1..×16”) — PRZYJMUJĘ (korekta tabeli, klasa #402 potwierdzona śladem)

Kandydaci odtworzeni: `01-operator-r1-kandydaci-c1.py <plik> 1000` (PIN2-PROBE-Q1), z nich 3 nazwy; generator na pinie
(`WIRING_A_SWEEP_FRAME=64` i `1024`), Rust `kandydaci_z_pliku_na_zadanie` (release):

| Kandydat | Klatka | Pin | Rust | Wynik |
|---|---|---|---|---|
| `k_gory_mix_d5_mury_1087` | 64 (×4) | tura 70, rzuty 187 | tura 71, rzuty 185, hp a3/a6/d1 | rozbieżny (odtworzone) |
| `k_wzg_jazda_d5_palisada_1048` | 1024 (×64) | tura 56, rzuty 100 | hp a0/a1/a6, d1 martwy vs rozbity | rozbieżny |
| `k_gory_jazda_d6l_mury_1075` | 1024 (×64) | tura 57, rzuty 133 | tura 53, rzuty 118 | rozbieżny |
| `k_gory_mix_d5_mury_1087` | 1024 (×64) | — | — | zgodny |

Ślady pierwszej rozbieżności (pin `WIRING_A_TRACE`, Rust `slad_diagnostyczny_na_zadanie` z `WIRING_A_TRACE_MODE=skip` i
`WIRING_A_RUST_FF_STEP`; porównanie zdarzeń MOVE/ROUT/KILL/TOWER po czasie; Rust ma stałe przesunięcie osi +64 ms przy ×4
i −38 912 ms przy ×64 — oś tury 1 przewijania, PRE-SKIP-RAF #405 — wszystkie wcześniejsze zdarzenia zgodne):

| Przypadek | Pierwsze rozjechane zdarzenie | Mechanizm | Klasa |
|---|---|---|---|
| `1087` @×4 | r55, t 299 584 (oś pinu): pin krok jazdy a3 41,88→41,89, Rust 41,88→41,87 | a3 (Konnica, skład `mix`) zaczyna `_cavalryAction` w t 299 072; w TEJ samej chwili wieża rzędu 90 rozbija a2 (41,89, sąsiad celu d4). Pin decyduje każdy krok jazdy w chwili kroku (`CAVT` co krok: 299 072, 299 328, 299 584) i trzeci krok wchodzi na 41,89; Rust liczy całą jazdę atomowo w `start` (oscylacja 41,88↔41,87 przez 6 kroków) | **#402** MARCH-INCREMENTAL-RESZTA |
| `1048` @×64 | t 1 230 848: pin a1 39,86→39,87, Rust 39,86→39,85 | a1 (Konnica) w marszu; rozbicie a4 w t 1 229 824 (w trakcie marszu) | **#402** |
| `1075` @×64 | t 1 234 944: pin a0 39,70→39,71, Rust 39,70→39,69 | a0 (Konnica) w marszu; rozbicie a2 w t 1 234 944 (wieża rzędu 70 w t 1 233 920) | **#402** |

Wszystkie trzy to ten sam wzorzec co `155`/`144`/`147`/`111` z §4 r1: rozbicie (zegar wieży) w trakcie marszu kawalerii,
którą Rust liczy atomowo. Brak nowej klasy długu; brak naprawy w tym temacie (#402 poza zakresem dispatchu).

**Korekta tabeli §11 raportu r1** (wiersz „FQ-SPEED”), obowiązuje zamiast „ZAMKNIĘTE dla ×1..×16”:

| Pozycja | Stan |
|---|---|
| FQ-SPEED (zgodność przy speedMul ≠ 1) | **ZAMKNIĘTE poza #402**: c1 (seed 101..228) ×1/×4/×8/×16 128/128, wektory 45/45 (poza `155`@×2), `speed_vectors` 347/351 + 4 na liście #402; świeże c1-kształt (seed 1001..1128, Evaluator): ×1 128/128, ×4 **127/128** (`1087`, #402, ślad §3), ×16 128/128, ×64 **126/128** (`1048`, `1075`, #402, ślad §3). Każda zmierzona rozbieżność ×2..×512 ma ślad albo analogię w klasie #402 (kawaleria/ucieczka atomowo w `start`); żadna nie wynika z kwantyzacji klatki ani kolejności strzału |
| MARCH-INCREMENTAL-RESZTA (#402) | **DŁUG** — lista przypadków uzupełniona o `1087`@×4, `1048`@×64, `1075`@×64 (seed 1000, PIN2-PROBE) |

## 4. Testy po poprawkach

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` = scratchpad
`fqspeed-obrona-tgt` (usunięty po bramkach).

| Bramka | Wynik |
|---|---|
| engine `cargo fmt --all -- --check` | EXIT 0 |
| renderer `cargo fmt --all -- --check` | EXIT 0 |
| engine `cargo test --release --lib` | **174 passed / 0 failed** (było 172; +2 testy §2) |
| engine `p6_k5loop_wiring_a_pin` (release) | **13/13** (45 wektorów bajt w bajt, 351 bitew prędkości) |
| engine `p4_fq_speed` | 4/4 |
| engine `--lib` + `p4_fq_speed` + 37 binarek z `ProdBody`/`SiegeLoop`/`SiegeBattleSession` (release, w tle `setsid nohup`) | **EXIT 0: 39 × `test result: ok`, 499 passed / 0 failed / 0 ignored** (m.in. `bridge_contract`, `p4_1i3_actions`, `p6_k5loop_*`, `p6_siege_tactics_loop*`, `p6_w6s_siege`, `p6_zdobycie_miasta_*`) |
| engine `cargo clippy --all-targets -- -D warnings` | **EXIT 0** |
| engine pełny `cargo test --release --all-targets` (556 binarek) | **NIE ODTWORZONO** (dysk 5,2–5,7 GB, równoległy build innego tematu; 556 binarek release nie mieści się) |
| renderer clippy / test, client clippy / test | **NIE ODTWORZONO** (renderer: < 12 GB; client bez zmian w tej obronie) |

Zakres zmiany engine uzasadnia zestaw binarek: usunięty kod działał tylko przy `pin_blow_timing && !march_incremental`
(brak w `tests/`; w `lib` tylko `pin3_timeline_tests` — zielone), nowe testy są w `lib`.

## 5. Allowlista

`git diff --name-only 7d6754ae1..ca30599a3`: `rust-port/engine/src/domain/siege_tactics_loop.rs`,
`rust-port/renderer/tests/battle_playback_move_shot.rs`, `rust-port/renderer/tests/battle_playback_siege.rs` (allowlista:
`siege_tactics_loop.rs`, `renderer/tests/battle_playback*.rs`) + ten raport. Brak `#[ignore]`, brak osłabionych asercji,
`Cargo.lock` nietknięty, `vectors.json`/`speed_vectors.json` bez zmian.

## 6. Uwagi Evaluatora (N1–N4)

| Uwaga | Odpowiedź |
|---|---|
| N1 (@32 = 128/128 vs wyłączenie #402) | Bez sporu: @32 c1 126/128 (`124`, `156`) i wektor `155`@×2 to #402 (ślady r1 §4). Rozstrzyga orkiestrator; z mojej strony brak naprawy w zakresie. |
| N2 (dług FQ-SPEED-BRIDGE bez numeru) | PRZYJMUJĘ: dług opisany w r1 §6 (komenda mostu `SetSiegeBattleSpeed`, `DriverOp::Speed`, pole klatki w `SiegeBattlePayload`, `BattlePlayback::set_frame_ms`; pliki poza allowlistą). Numer zadania nadaje orkiestrator w `REJESTR-RUST.md` — Operator nie prowadzi listy zadań. Proponowany ID: R-RUSTPORT-P4-FQ-SPEED-BRIDGE-Q1. |
| N3 (E5: odkładanie `BodyDone` ciosu niewidoczne dla korpusu) | PRZYJMUJĘ jako dług czułości poza diffem (D-PIN3-3, kod sprzed tematu): kandydat na osobny temat „czułość D-PIN3-3 ciosu” (wektor z ciosem i zegarem wieży w tej samej klatce). |
| N4 (siatka renderera przy nieregularnej delcie ściennej) | PRZYJMUJĘ jako dług istniejący od HITAT (D-HFQ-1); przy speedMul > 1 i realnych deltach (clamp 100 ms) czasy akcji nie leżą na siatce `16 * speedMul`. Do wpisu w rejestrze przez orkiestratora razem z FQ-SPEED-BRIDGE (zmiana prędkości w trakcie = N5). |

## Długi

FQ-SPEED-BRIDGE (numer nada orkiestrator), #402 (lista z §3 + r1 §4), N3 (czułość D-PIN3-3 ciosu), N4 (siatka renderera
przy nieregularnej delcie ściennej), S4 (strzał po krokach atomowych `attack_pre > 0` w dawnym modelu, nieosiągalny w
sesji praktycznie), PRE-SKIP-RAF #405 (oś tury 1 przewijania przesunięta, widoczna w śladach §3).
