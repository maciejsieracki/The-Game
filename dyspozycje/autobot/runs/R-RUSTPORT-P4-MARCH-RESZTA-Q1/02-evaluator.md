# R-RUSTPORT-P4-MARCH-RESZTA-Q1: Evaluator r1 (adwersarialny)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-MARCH-RESZTA-Q1 (pozostałe marsze bitwy oblężniczej krok po kroku, zadanie #402)
GOAL: marsze _fallBackStep, _fleeStep, kawaleria i _siegeWalkTo krok po kroku wg pinu 07d2fbd72; _rangedBackStep,
      _kiteStep i _rangedApproachStep jawnie rozstrzygnięte; c1 128/128 @1 i @16; 45 dawnych wektorów bajt w bajt; N1
OCENIANY KOD: d0371f66d (gałąź rust-port-wip/march-reszta-q1-r2 Operatora), baza origin/rust-port/parity-v2 = b41adf6a5
ZMIANY/COMMIT: ten raport + 02-evaluator-mutanty.patch (haki mutantów, NIE kod produkcyjny); kod gry bez zmian
TESTY: §2 (fmt/clippy/pełny test EXIT 0, 4334/0/1; wektory odtworzone generatorem bajt w bajt; c1 128/128 @16 i @1)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Obrona (zarzuty Z1–Z4 niżej), potem Final Control
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza i zakres

- `git rev-parse origin/rust-port/parity-v2` = `b41adf6a5660d8c1b767bdfaeedd237a728e3ce3` (zgodne z DODATKIEM r2).
- `git merge-base --is-ancestor b41adf6a5 d0371f66d`: tak. Diff `b41adf6a5..d0371f66d` dotyka 7 plików:
  `siege_tactics_loop.rs` (+1104), `p6_k5loop_wiring_a_pin.rs`, `p6_k5loop_wiring_a_gen.mjs`, `vectors.json` (+6878/-0),
  `p6_k5loop_wiring_a.rs` (5 linii) i 2 pliki w katalogu tego runu.
- Allowlista: wszystko w allowliście oprócz `engine/tests/p6_k5loop_wiring_a.rs`. Operator zgłosił to sam (§7 raportu)
  z uzasadnieniem. Sprawdziłem: sonda `checkrout_okrazenie_z_biezacego_kafla` woła `body.start` poza sterownikiem.
  Po `play()` jedyny slot marszu jest zajęty, więc N1 `debug_assert!` słusznie by wybuchł. `prepare` buduje ten sam
  układ (`start` = `prepare` + `play`, `siege_battle_session.rs:725-733`). Sonda nadpisuje morale i `flee_morale`
  wprost, więc kara morale ze startu bitwy nie zmienia wyniku. Asercje bez zmian. **Akceptuję** (uwaga U1).
- `siege_tactics_actions.rs`, `siege_tactics_atk*.rs`, `siege_battle_session.rs`, `Cargo.lock`, `gra/`, `src-tauri`,
  `view-model`, `renderer`, `client`: bez zmian.
- `#[ignore]` w diffie: brak. Nowe testy `drugi_marsz_w_slocie_to_blad_kontraktu` (`should_panic`, `cfg(debug_assertions)`)
  to test kontraktu, nie osłabienie. Asercje istniejących testów nie zostały osłabione: diff testów to tylko `&st` → `&mut st`
  (nowa sygnatura `march_fire`), `setup` → `setup_defs` i dopisane testy.
- `ROZBIEZNE_FQ_SPEED_402` z 4 pozycji na 0. Test nadal pada, gdy rozjedzie się którykolwiek wektor prędkości (351/351
  zielone), więc to zamknięcie długu, a nie osłabienie.
- Commity: brak linii z nazwą modelu (jest tylko `Claude-Session:`).

## 2. Bramki odtworzone (własny `CARGO_TARGET_DIR` w scratchpadzie, `CARGO_INCREMENTAL=0`, debug off; target usunięty)

| Bramka | Wynik |
|---|---|
| engine `cargo fmt --check` | **EXIT 0** |
| engine `cargo clippy --all-targets -- -D warnings` | **EXIT 0** |
| engine `cargo test --all-targets --no-fail-fast` (w tle) | **EXIT 0**: 557 × `test result: ok`, **4334 passed / 0 failed / 1 ignored** (zgodnie z raportem Operatora) |
| generator `node p6_k5loop_wiring_a_gen.mjs` (TEKST pinu `07d2fbd72` przez `git show`, strażnik SHA-256 `3eeeb760…`) | **EXIT 0**; `vectors.json` MD5 `9ceefda18531b3325aed3a54c385391a`, `pin_data.json` `432eed76…`; **`git status` czysty po regeneracji**: 50 wektorów (w tym 5 nowych `mr_*`) odtworzone bajt w bajt z wykonania pinu |
| 45 dawnych wektorów | porównanie JSON z `b41adf6a5`: `vectors[0..45]` równe, `pin`/`pinSha256`/`frameMs` równe; dopisane tylko 5 `mr_*` |
| c1 @16 (128 kandydatów, ziarno 101..228, wygenerowane przeze mnie na pinie, `WIRING_A_EXTRA`) | **128/128** |
| c1 @1 (pin `WIRING_A_SWEEP_FRAME=1`, Rust `WIRING_A_RUST_FF_STEP=1`) | **128/128** |
| client / renderer | nie uruchamiane (dispatch: orkiestrator przy integracji; strumień akcji zmienia chwilę skutków ucieczki, D-MR-2) |

Uwaga do pomiaru: pierwszy przebieg „@1” porównywał Rust @1 z pinem @16 i dał 93/128. Był to mój błąd pomiaru
(inna klatka w oraklu), nie rozbieżność. Przy tej samej klatce po obu stronach wynik to 128/128.

## 3. Zgodność z pinem (czytane z `git show 07d2fbd72:gra/src/battle/battleScene.ts`)

| Ścieżka | Pin | Rust (d0371f66d) | Ocena |
|---|---|---|---|
| `_fallBackStep` `:7228-7243` | wejście: finished, dead/fadingOut, `moveLeft<=0`; callback: finished, `moveLeft>0` → `_schedule(STEP_GAP_MS)` | `fall_back_enter` + `fall_back_step_end` (`fall_back_after_move`) | zgodne |
| `_fleeStep` `:9845-9897` | wejście: finished, dead/fadingOut/removed, `moveLeft<=0`, krawędź → remove+shake; wiersze `[0,1,-1,2,-2]`; fleeStuck≥2; callback: finished, removed/dead, krawędź, `moveLeft>0` | `flee_enter` / `flee_step_end`, NaN w callbacku kończy (`NaN>0` = false) | zgodne |
| `_cavDirectedManeuverStep` `:6426-6446` | callback: finished → done; adjGood → done; `moveLeft>0` → `t2=_cavalryTarget(ru) ?? tgt`, rekurencja; brak kroku → done (BEZ przejścia do `_cavManeuverStep`) | `cav_step_end` gałąź `CavDirected` | zgodne |
| `_cavManeuverStep` `:6457-6501` | jw., `t2 && _cavManeuverStep` | gałąź `_` | zgodne |
| szarża `:6403-6409` | `stepKey && moveLeft>0` → `_doMove(..., done)` | `CavCharge`, callback = `Done` | zgodne |
| `_siegeWalkTo` `:8006-8019` + `arrive` `:8044-8047` | callback: finished/dead/isGoal/`moveLeft<=0` → done (arrive); odmowa `_doMove` `:8689-8692` = `moveLeft=0; done()` | `walk_enter`/`walk_step_end`/`walk_done` | zgodne |
| `_rangedBackStep` / `_kiteStep` / `_rangedApproachStep` | `grep` w pinie: jedyne odwołania to definicja i rekurencja własna (`:7010/7029`, `:7065/7091`, `:7257/7283`) | brak portu (D-MR-3) | **potwierdzone**: martwy kod w pinie |
| D-MR-2 (skutki ucieczki w chwili `start`) | `_startRout`/`_fleeStep`/`_shakeAlliesOnLoss` synchronicznie w `_activateUnit` | `LoopBody::after_start` po `start` w `SiegeLoop` (`ActivateUnit`) | zgodne co do chwili. Strażnik `same_seq_units` jest w `after_start` zawsze prawdziwy, bo `start` nie zmienia `st` (U2) |
| N1 | n/d | `debug_assert!(self.march.is_none())` w `march_advance` + test `should_panic` | zamknięte |

## 4. Mutanty adwersarialne (własne, E1–E12; haki `MR_MUT` na łatce Operatora, `02-evaluator-mutanty.patch`)

Jedna kompilacja release. Każdy mutant uruchomiony na: lib `march_incremental_tests` (36), `wektory_pinu_pelnej_bitwy_bajt_w_bajt`
(50), `predkosc_bitwy_wektory_pinu_bajt_w_bajt` (351). Ocalałe dodatkowo sprawdzone na c1 @16 (128). BASE (bez mutanta):
36/36, wektory ok, prędkość ok.

| ID | Mutant (nowa gałąź) | lib | vec | speed | c1@16 | Wynik |
|---|---|---|---|---|---|---|
| E1 | `fall_back_enter`: najbliższy wróg na KONIEC listy (`nearest_enemy` = `first()` → `dNow` z innego wroga) | ok | ok | ok | 128/128 | **PRZEŻYŁ, nierównoważny** (Z1) |
| E2 | `fall_back_step_end`: `Schedule` → `Done` | FAIL | ok | ok | n/d | zabity |
| E3 | `flee_enter`: brak zejścia z pola na krawędzi w wejściu | FAIL | ok | ok | n/d | zabity |
| E4 | `flee_enter`: kolejność wierszy `[0,-1,1,2,-2]` | ok | FAIL | FAIL | n/d | zabity |
| E5 | `flee_enter`: próg `fleeStuck` 2 → 3 | ok | FAIL | FAIL | n/d | zabity |
| E6 | `cav_enter`: szarża bez strażnika `moveLeft > 0` | ok | ok | ok | 128/128 | **PRZEŻYŁ** (Z3, trudno osiągalny) |
| E7 | `cav_step_end`: `NaN` w `moveLeft` nie kończy (pin: `NaN > 0` = false → done) | ok | ok | ok | 128/128 | **PRZEŻYŁ, nierównoważny przy NaN** (Z3) |
| E8 | `cav_step_end` C-FLANK: brak kroku skierowanego → `_cavManeuverStep` (pin tego NIE robi) | ok | ok | ok | 128/128 | **PRZEŻYŁ, nierównoważny** (Z2) |
| E9 | `walk_done`: `q >= base` → `q > base` | FAIL | FAIL | FAIL | n/d | zabity |
| E10 | wejście jazdy: bez `pend.move_left = Some(..)` | ok | ok | ok | 128/128 | **RÓWNOWAŻNY**: `march_advance` przepisuje `pending.move_left`, gdy `c.moved`, a w gałęzi `Attack` `c.moved == false` (atak tylko przed krokiem) |
| E11 | wejście `_siegeWalkTo`: `move_left` w `AtkRun` = `None` | FAIL | ok | ok | n/d | zabity |
| E12 | `fall_back_enter`: `mover_routed = false` | ok | ok | ok | 128/128 | **RÓWNOWAŻNY praktycznie**: jednostka rozbita idzie gałęzią ucieczki przed odwrotem, a odwrót dotyczy strzelców (`_siegeApproachRestricted` `:7953` zwraca false dla `primaryRanged && canShoot`). Bez dowodu formalnego |

Bilans: 12 mutantów, 6 zabitych, 2 równoważne (E10 dowód z kodu, E12 praktycznie) i **4 ocalałe nierównoważne
(E1, E6, E7, E8)**. Wraz z 23 mutantami Operatora (22 zabite i M18 równoważny; sprawdziłem uzasadnienie M18:
`_siegeMoveRefused` → `_siegeApproachRestricted` zwraca false dla `isSiegeUnit`, a `arrive_base` ma tylko wieża)
kryterium dispatchu „≥ 15 zabitych lub jawnie równoważnych” jest spełnione: 23 + 8 = 31.

Przyczyna ocalałych jest jedna. Nowe gałęzie krokowe (`fall_back_enter`, `cav_enter`, `cav_step_end`) to kopie
logiki atomowej (`fall_back`, `cavalry_action`). Testy jednostkowe K5DOC-T6/T7 pilnują kopii atomowej, a
`march_incremental_tests` nie mają przypadku z ≥ 2 wrogami w różnej odległości dla odwrotu, z C-FLANK bez kroku
ani z `moveLeft` NaN lub `<= 0` dla jazdy. Pełne bitwy AUTO tego nie rozróżniają (C-FLANK wymaga `attackDirection`
`bok`/`tyl`, a w AUTO bez generała jest front).

## 5. Zarzuty (do Obrony; żaden nie wskazuje rozbieżności z pinem w zmierzonych zbiorach)

- **Z1 (średni, pokrycie):** E1 przeżywa. W lib dodać test `fall_back_enter` z dwoma wrogami, w którym najbliższy NIE jest
  pierwszy w `live_enemy_cells`. Test ma sprawdzać `dNow` z `_nearestEnemy` (pin `:7246-7249`) przez wybór kafla
  odrzuconego przy złym `dNow`.
- **Z2 (średni, pokrycie):** E8 przeżywa. W lib dodać test callbacku C-FLANK (`CavDirected`), gdy kolejny krok skierowany
  nie istnieje, a krok manewru tak. Oczekiwane `Done` (pin `:6441-6444`: `done()`, bez `_cavManeuverStep`).
- **Z3 (niski, pokrycie):** E6/E7. Brak testu jazdy dla `moveLeft = NaN` w callbacku i `moveLeft <= 0` przy szarży z
  wejścia. Pin `:6405` i `:6439`/`:6496`. Do dodania albo jawnie do długu z uzasadnieniem osiągalności.
- **Z4 (niski, dokumentacja):** §6 raportu Operatora mówi „23 mutanty: 22 zabite”. Słusznie przyznaje, że pełne bitwy
  rozróżniają tylko część z nich. Dopisać do „Długów”, że wejścia i callbacki krokowe są duplikatami kopii atomowej
  (MARCH-ATOMIC-TESTONLY) i że ich testy dotąd nie obejmowały E1/E6/E7/E8.

## 6. Uwagi (bez wpływu na werdykt)

- **U1:** zmiana `p6_k5loop_wiring_a.rs` poza allowlistą jest uzasadniona i minimalna. Orkiestrator powinien ją
  zaakceptować przy integracji.
- **U2:** w `after_start` warunek `same_seq_units(st, before)` jest martwy przy obecnym kontrakcie (`start(&st)` nie
  zmienia stanu). Zostawienie go jako strażnika jest dopuszczalne.
- **U3:** dług MARCH-ATOMIC-TESTONLY (duplikat `!march_incremental`) zostaje z poprawnym uzasadnieniem. Gałąź jest
  używana przez testy poza allowlistą (`p6_k5loop_close_r3/r4`, `p6_k5loop_tags_rest`, `p6_k5loop_adapter`,
  `p6_siege_tactics_loop_body`, `p4_1i3_actions`, `p6_k5doc_t4e`). Właśnie przez ten duplikat powstały luki Z1–Z3.
- **U4:** `mr_rown_jazda3_dk_mury_401` @1 = `SKIP_STEP_BUDGET`. Nie odtwarzałem tego (zbiór `mr` nie był w moim pomiarze).
  NIE_ZMIERZONO przez Evaluatora; opieram się na raporcie Operatora.
- **U5:** bramki client i renderer są wymagane przy integracji, bo zmienia się chwila skutków ucieczki w strumieniu akcji.

## 7. Werdykt

**PASS-WITH-NOTES.** Kod jest zgodny z tekstem pinu dla wszystkich osiągalnych marszy. Martwe ścieżki pinu są jawnie
rozstrzygnięte. Wektory odtworzyłem z wykonania pinu bajt w bajt, a 45 dawnych się nie zmieniło. c1 daje 128/128 @16
i @1. Bramki engine mają EXIT 0. Kryterium mutantów jest spełnione. Zarzuty Z1–Z3 to luki testów nowych kopii
krokowych (4 ocalałe, nierównoważne mutanty), nie rozbieżności z pinem. Obrona powinna je zamknąć testami lib albo
jawnie wpisać do długu.
