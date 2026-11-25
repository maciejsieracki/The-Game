# R-RUSTPORT-P4-MARCH-RESZTA-Q1 — Operator r1 (wznowienie wg DODATKU r2)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-MARCH-RESZTA-Q1 (pozostałe marsze bitwy oblężniczej krok po kroku, zadanie #402)
GOAL: marsze _siegeWalkTo, _fallBackStep, _fleeStep, kroki kawalerii (oraz sprawdzenie _rangedBackStep, _kiteStep,
      _rangedApproachStep) zgodne z pinem 07d2fbd72 (krok po kroku albo jawnie atomowe wg pinu); c1 128/128 @1 i @16;
      45 dawnych wektorów bajt w bajt; przypadki z routem/śmiercią w oknie marszu zmierzone; mutanty >= 15; N1; dług
      atomowego duplikatu rozstrzygnięty
BAZA: origin/rust-port/parity-v2 = b41adf6a5660d8c1b767bdfaeedd237a728e3ce3 (DODATEK r2, sprawdzone `git rev-parse`)
      + praca poprzedniej próby: rust-port-wip/march-reszta-q1-op = bc49f97a1 (baza ee1ceda3e)
GAŁĄŹ: rust-port-wip/march-reszta-q1-r2 (lokalna, worktree wf_1de8803c-d62-1); HEAD = §9
ZMIANY/COMMIT: §7, §9
TESTY: §8 (engine fmt/clippy EXIT 0, pełny cargo test EXIT 0: 4334/0/1; c1 128/128 @1/@16 i @32..@8192; 50/50 wektorów; 351/351 prędkości)
BLOKADY: brak; client/renderer nie uruchamiane (dispatch: robi orkiestrator przy integracji)
RUNDY: 1/5 (wznowienie r2 tej samej rundy Operatora po dwóch pauzach)
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Start pracy (DODATEK r2)

- Gałąź robocza `rust-port-wip/march-reszta-q1-r2` z `bc49f97a1` (2 commity WIP poprzedniej próby + `bc49f97a1`).
- Stash `f8b4744ac` (`rust-port-wip/march-reszta-q1-dirty`) przeczytany: to **wyłącznie haki mutantów środowiskowych**
  (`fn mr_mut(id)` czytające `MR_MUT`, 20 punktów M1–M20) nałożone na `e639275ee`. Nie jest to kod produkcyjny, więc
  **nie został zacommitowany** (zmienna środowiskowa w ciele bitwy byłaby wadą); posłużył jako narzędzie pomiaru
  (§6) i jest zapisany jako `01-operator-r1-mutanty.patch` (stosuje się `git apply` na HEAD tej gałęzi).
- Merge `origin/rust-port/parity-v2` (`b41adf6a5`, FQ-SPEED `7453aecee` + SAVE-LOAD-BRIDGE): **bez konfliktów**
  (auto-merge `siege_tactics_loop.rs`, `p6_k5loop_wiring_a_pin.rs`, `p6_k5loop_wiring_a_gen.mjs`), commit `71fd35556`.
  Oba zachowania obecne: kwantyzacja `frame_ms = 16 × speedMul`/D-FQS-1 i marsze krok po kroku D-MR-1.

## 2. Web najpierw (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`, `git show`)

| Ścieżka pinu | Linie | Wołający w pinie | Charakter w pinie | Rust (po temacie) |
|---|---|---|---|---|
| `_advanceStep` | `:8198-8285` | `_activateUnit` | krok po kroku (`_schedule(STEP_GAP_MS)`) | D-MI-1 (MARCH-INCREMENTAL) |
| `_rangedForwardStep` | `:6776-6809` | `_rangedAction` `:6738` | krok po kroku | D-MI-2 (MARCH-INCREMENTAL) |
| `_fallBackStep` | `:7228-7243` | `_activateUnit` `:6275` | krok po kroku, callback `finished`/`moveLeft > 0` | **krok po kroku** (`MarchKind::FallBack`, D-MR-1) |
| `_fleeStep` | `:9845-9897` | `_activateUnit` `:6055`, `:6117`; `:5887` | krok po kroku, wejście czyta `dead/fadingOut/removed`, krawędź = zejście | **krok po kroku** (`MarchKind::Flee`, D-MR-1) + **skutki z `start` w chwili `start` (D-MR-2)** |
| `_cavalryAction` → `_cavDirectedManeuverStep` / `_cavManeuverStep` / szarża | `:6372-6501` | `_activateUnit` `:6284` | callback kroku decyduje o KOLEJNYM kroku od razu (bez `_schedule`), cel `_cavalryTarget(ru) ?? tgt` z chwili callbacku | **krok po kroku** (`CavDirected`/`CavManeuver`/`CavCharge`, D-MR-1) |
| `_siegeWalkTo` | `:8006-8019` | `_siegeRamTowerStep` `:8032`, `:8048`; `:8099`; `:8134` | krok po kroku; `isGoal` i zajętość z chwili wejścia/callbacku; `arrive` wieży `:8044-8047` | **krok po kroku** (`MarchKind::SiegeWalk`, D-MR-1; przekazanie do `start` przez `walk_deferred`) |
| KITE w `_rangedAction` | `:6699-6716` | `_rangedAction` | jeden `_doMove`, potem strzał | jeden krok (`MarchKind::Kite`, bez zmian) |
| `_phalanxStep` | `:6589-6635` | `_phalanxAction` | „exactly one controlled step per turn” (`:6635`) | jeden krok (bez zmian) |
| `_rangedBackStep` | `:7010-7032` | **brak** (jedyne odwołanie to rekurencja `:7029`) | martwy kod w pinie | **nie portowane — jawna notatka**: nieosiągalne w pinie (`grep` po całym `gra/src` przy `07d2fbd72`: zero wołających) |
| `_kiteStep` | `:7065-7094` | **brak** (rekurencja `:7091`) | martwy kod w pinie | jw. |
| `_rangedApproachStep` | `:7257-7286` | **brak** (rekurencja `:7283`) | martwy kod w pinie | jw. |

Wniosek: w pinie nie ma żadnej ŻYWEJ ścieżki marszu wielokrokowego liczonej atomowo; wszystkie osiągalne marsze
wielokrokowe są w Rust krok po kroku. Trzy funkcje z listy dispatchu są w pinie nieosiągalne (nie ma czego portować).

## 3. Zmiany kodu w tej rundzie (po pracy poprzedniej próby)

### D-MR-1 (poprzednia próba, `ab36a79a5`..`bc49f97a1`, zweryfikowane i zachowane)
`MarchKind::{FallBack, Flee, CavDirected, CavManeuver, CavCharge, SiegeWalk}` prowadzone przez ten sam mechanizm co
D-MI-1/2 (`ProdBody::march`, `MarchStage::{StepEnd, Gap}`, `march_advance`, `march_fire`): pierwsze wejście
synchronicznie w `start`, koniec kroku w fazie kroków `_raf`, przerwa `_schedule(STEP_GAP_MS)` jako zegar; jazda bez
przerwy (kolejny krok z callbacku), cel C-FLANK z chwili callbacku; `_siegeWalkTo` przekazywany do `start` przez
`walk_deferred`, `arrive` wieży (`tower_at_wall_rows`). N1: `debug_assert!` jednoslotowego `ProdBody::march`
(`march_advance`) + test `drugi_marsz_w_slocie_to_blad_kontraktu` (`#[cfg(debug_assertions)]`, `should_panic`).

### D-MR-2 (NOWE w tej rundzie) — skutki ucieczki z `start` w chwili `start`
- Pomiar po merge: lista `ROZBIEZNE_FQ_SPEED_402` z FQ-SPEED miała 4 pozycje; 3 z nich (`155`×2, `111`×256/×512)
  **zaczęły się zgadzać** dzięki D-MR-1 (test pada „skróć listę”). Została `p3_wzg_mix_d5_palisada_156` ×32 z tagiem
  `ucieczka-konflikt-zegara`.
- Ślad (diagnostyka tymczasowa, usunięta): `a2` ucieka w `t = 655872`; kopia stanu z `start` obniża morale `a0`
  40,909 → 28,909 (`_shakeAlliesOnLoss`/rout), a trafienie wieży w oknie marszu (zegar) zmienia `a0` hp 19 → 17 i
  morale 40,909 → 31,818 — liczone od morale SPRZED wstrząsu, bo kopia trafiała do stanu dopiero w `complete` (koniec
  marszu). W pinie skutki są synchroniczne w `_activateUnit` (`:6055`, `:6117`, `:9845-9897`), więc wieża czyta już
  obniżone morale (pin: `a0` ginie, Rust: żyje).
- Naprawa: nowa metoda `LoopBody::after_start(unit, &mut st)` (domyślnie bez efektu), wołana przez `SiegeLoop`
  bezpośrednio po `start` tej samej aktywacji (`siege_tactics_loop.rs`, gałąź `SeqEvent::ActivateUnit`). `ProdBody`
  przy `march_incremental` przepisuje kopię ucieczki (`flee_after`) do stanu sterownika od razu i ustawia
  `ProdFleeAfter::applied`; `complete` dla `applied` przepisuje już tylko `moveLeft` (bez łączenia i bez tagu). Dalsze
  kroki ucieczki działają na stanie sterownika (jak dotąd). Marsz atomowy (`march_incremental = false`, testy lib
  spoza sesji) bez zmian.
- Wynik: `156`×32 zgodny; lista `ROZBIEZNE_FQ_SPEED_402` **pusta** (`[(&str, f64); 0]`).

## 4. Pomiar zgodności (binarka release `p6_k5loop_wiring_a_pin`, `kandydaci_z_pliku_na_zadanie`)

Kandydaci c1 = `R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1/01-operator-r1-kandydaci-c1.py` (128 scenariuszy, ziarno 101..228),
wygenerowani na pinie generatorem (`WIRING_A_EXTRA`, `WIRING_A_SWEEP_FRAME`); świeże c1 z ziarnem 1000 (1001..1128).

| Zbiór | Klatka | Wynik (HEAD) | Uwaga |
|---|---|---|---|
| c1 | @1 (`WIRING_A_RUST_FF_STEP=1`) | **128/128** | kryterium dispatchu |
| c1 | @16 | **128/128** | kryterium dispatchu |
| c1 | @32 (×2) | **128/128** | FQ-SPEED: 127/128 (`155`) |
| c1 | @64 (×4) | **128/128** | |
| c1 | @512 (×32) | **128/128** | FQ-SPEED: 126/128 (`124`, `156`) |
| c1 | @1024 (×64) | **128/128** | FQ-SPEED: 126/128 (`144`, `147`) |
| c1 | @2048 (×128) | **128/128** | FQ-SPEED: 124/128 (`143`, `147`, `176`, `211`) |
| c1 | @4096 / @8192 (×256 / ×512) | **128/128 / 128/128** | FQ-SPEED: 127/128 (`111`) |
| c1 ziarno 1000 | @16 / @64 (×4) / @1024 (×64) | **128/128 / 128/128 / 128/128** | FQ-SPEED: `1087`@×4 127/128, `1048`/`1075`@×64 126/128 |
| mr (128, jazda/wieże/mix, poprzednia próba) | @16 / @1 | **128/128 / 127/128** | @1: `mr_rown_jazda3_dk_mury_401` = `LoopUnsupported("przewijanie bez konca w budzecie krokow")` — bitwa do sufitu 400 tur (pat), przy kroku 1 ms przekracza `SKIP_STEP_BUDGET = 2 000 000` kroków; ograniczenie diagnostyki, nie rozbieżność (@16 zgodny) |
| mr2 (128, słabi/wieże) | @16 | **128/128** | |
| wektory `vectors.json` | produkcyjne | **50/50** (45 dawnych + 5 `mr_*`) | dawne 45: równość JSON z bazą `b41adf6a5` |
| `speed_vectors.json` (351 bitew ×2..×512) | | **351/351** (lista długu pusta) | |

Wszystkie przypadki z listy DODATKU r2 (`155`@×2, `156`@×32, `124`@×32, `111`@×256/×512, `144`/`147`@×64,
`143`/`147`/`176`/`211`@×128, `1087`@×4, `1048`/`1075`@×64) — **zmierzone i zgodne**.

Przypadki z routem/śmiercią/zmianą celu w oknie marszu: wektory `mr_*` (MARCH_RESZTA, 5 w `vectors.json`, pilnowane jako
zwykłe zgodne), `p3_wzg_mix_d5_palisada_156` ×32 (rout/wstrząs ucieczki + trafienie wieży w oknie marszu, w
`speed_vectors.json`), dawne `155`/`111`/`144`/`147` (rozbicie od wieży w trakcie marszu kawalerii) — zielone.

## 5. Dług atomowego duplikatu (`march_incremental = false`)

**Zostaje, z uzasadnieniem.** Sesja produkcyjna ustawia `march_incremental = true` zawsze
(`siege_battle_session.rs:1055`), ale `ProdBody::new` domyślnie `false` i z tej ścieżki korzystają testy poza sesją:
`tests/p6_k5loop_close_r3.rs`, `p6_k5loop_close_r4.rs`, `p6_k5loop_tags_rest.rs`, `p6_k5loop_adapter.rs`,
`p6_siege_tactics_loop_body.rs`, `p4_1i3_actions.rs`, `p6_k5doc_t4e.rs` oraz moduły testowe w
`siege_tactics_loop.rs` (`pin3_timeline_tests` i in.), które sprawdzają wynik aktywacji z `start` (czas i pozycję po
całym marszu bez zegara). Usunięcie wymaga przepisania tych testów na sterownik marszu (poza allowlistą: większość to
pliki `tests/` spoza listy dispatchu). Do rejestru: dług **MARCH-ATOMIC-TESTONLY** — usunąć gałęzie `!march_incremental`
po przeniesieniu wymienionych testów na marsz krok po kroku.

## 6. Mutanty (haki `MR_MUT`, `01-operator-r1-mutanty.patch`; jedna kompilacja release, każdy mutant = zmienna środowiskowa)

Zbiory: lib = `march_incremental_tests` (36 testów), vec = `wektory_pinu_pelnej_bitwy_bajt_w_bajt` (50 wektorów),
speed = `predkosc_bitwy_wektory_pinu_bajt_w_bajt` (351 bitew). c1/mr = 128+128 kandydatów (wyniki poprzedniej próby
na kodzie przed merge, tabela z plików `M*_c1_*.txt`/`M*_mr_*.txt`).

| ID | Mutant | lib | vec | speed | Wynik |
|---|---|---|---|---|---|
| M1 | ucieczka z `start` atomowo (bez `flee_first`) | FAIL (`ucieczka_ze_start_move_left_w_complete`) | ok | ok | ZABITY |
| M2 | jazda z `start` atomowo | FAIL (`jazda_ze_start_marsz_w_toku`) | FAIL | FAIL | ZABITY |
| M3 | odwrót z `start` atomowo | FAIL (`odwrot_ze_start_marsz_w_toku`) | ok | ok | ZABITY |
| M4 | `_siegeWalkTo` z aktywacji atomowo | FAIL (`marsz_machiny_z_aktywacji_krok_po_kroku`) | ok | ok | ZABITY |
| M5 | callback ucieczki ignoruje `removed/dead` | FAIL (`ucieczka_smierc_w_trakcie_kroku_bez_zejscia`) | ok | ok | ZABITY |
| M6 | wejście ucieczki ignoruje `dead` | FAIL (`ucieczka_martwy_przed_wejsciem_bez_kroku`, NOWY) | ok | ok | ZABITY |
| M7 | callback ucieczki bez zejścia na krawędzi | FAIL (`ucieczka_krok_po_kroku_zejscie_w_chwili_kroku`) | ok | ok | ZABITY |
| M8 | callback jazdy ignoruje `finished` | FAIL (`jazda_cel_i_koniec_bitwy_z_chwili_callbacku`) | ok | ok | ZABITY |
| M9 | callback jazdy ignoruje sąsiada bez włóczni | FAIL (2 testy) | FAIL | FAIL | ZABITY |
| M10 | jazda kończy po pierwszym kroku | FAIL (3 testy) | FAIL | FAIL | ZABITY |
| M11 | callback machiny ignoruje `dead` | FAIL (`marsz_machiny_smierc_w_trakcie_kroku`) | ok | ok | ZABITY |
| M12 | `arrive` wieży bez `towerAtWallRows.add` | FAIL (`marsz_machiny_krok_po_kroku_i_arrive`) | FAIL | FAIL | ZABITY |
| M13 | wejście `_siegeWalkTo` nie czyta `routed` z chwili wejścia | FAIL (`marsz_routed_z_chwili_wejscia`, NOWY) | ok | ok | ZABITY |
| M14 | callback odwrotu ignoruje `finished` | FAIL (`odwrot_koniec_bitwy_w_callbacku`) | ok | ok | ZABITY |
| M15 | callback odwrotu ignoruje `dead` | FAIL (`odwrot_krok_po_kroku_i_smierc_przed_kolejnym_wejsciem`) | ok | ok | ZABITY |
| M16 | `moveLeft` ucieczki nie trafia do stanu w `complete` | FAIL (`ucieczka_ze_start_move_left_w_complete`) | ok | ok | ZABITY |
| M17 | uciekający dostaje odmowę bramki (`mover_routed = false`) | FAIL (`ucieczka_krok_po_kroku_zejscie_w_chwili_kroku`) | ok | ok | ZABITY |
| M18 | odmowa bramki w wejściu `_siegeWalkTo` bez `arrive` | ok | ok | ok | **RÓWNOWAŻNY**: `_siegeApproachRestricted` (`:7953`) nigdy nie odmawia jednostce oblężniczej (`isSiegeUnit`), a `arrive` (`arrive_base`) ma tylko wieża; dla piechoty `walk_done` bez `arrive_base` nic nie robi |
| M19 | callback ucieczki kończy po pierwszym kroku | FAIL (3 testy) | FAIL | FAIL | ZABITY |
| M20 | jazda: cel z wejścia zamiast `_cavalryTarget` z chwili callbacku | FAIL (`jazda_c_flank_cel_z_chwili_callbacku`) | ok | ok | ZABITY |
| M21 | `after_start` bez efektu (D-MR-2 wyłączone) | FAIL (`ucieczka_skutki_start_w_stanie_od_razu`, NOWY) | ok | FAIL (`156`×32) | ZABITY |
| M22 | `complete` ignoruje `applied` (łączenie jak dawniej) | ok | ok | FAIL | ZABITY |
| M23 | `applied` nieustawiane po przepisaniu | ok | ok | FAIL | ZABITY |

**23 mutanty: 22 zabite, 1 jawnie równoważny (M18).** Uwaga do pokrycia (uczciwie): pełne bitwy (`vec`, `speed`,
c1, mr) rozróżniają tylko M2, M9, M10, M12, M19, M21–M23; pozostałe gałęzie są pilnowane testami jednostkowymi
`march_incremental_tests` napisanymi wprost z tekstu pinu. W pomiarze poprzedniej próby (kod przed merge) mutanty
M1, M3, M4, M6, M13, M18, M20 były zgodne na c1 128/128 @1/@16 — okno „zdarzenie zegara w trakcie marszu” przy klatce
16 ms rzadko rozstrzyga wynik; przy klatkach ×2..×512 (speed) rozstrzyga częściej (FQ-SPEED §4).

## 7. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `engine/src/domain/siege_tactics_loop.rs` | D-MR-1 (poprzednia próba), N1 `debug_assert`; D-MR-2: `LoopBody::after_start`, wywołanie w `SiegeLoop` po `start`, `ProdBody::after_start`, `ProdFleeAfter::applied`, `complete` dla `applied`; testy lib `ucieczka_martwy_przed_wejsciem_bez_kroku`, `ucieczka_skutki_start_w_stanie_od_razu`, `marsz_routed_z_chwili_wejscia` |
| `engine/tests/p6_k5loop_wiring_a_pin.rs` | `MARCH_RESZTA` (5 wektorów, poprzednia próba); `ROZBIEZNE_FQ_SPEED_402` pusta z opisem zamknięcia |
| `engine/tests/p6_k5loop_wiring_a_gen.mjs` | scenariusze `mr_*` (poprzednia próba; tekst pinu i strażnik SHA bez zmian) |
| `engine/tests/p6_k5loop_wiring_a_pin_vectors/vectors.json` | 45 → 50 (MD5 `9ceefda18531b3325aed3a54c385391a`); `speed_vectors.json` i `pin_data.json` bez zmian (`d764f078…`, `432eed76…`) |
| `engine/tests/p6_k5loop_wiring_a.rs` (**POZA allowlistą — uzasadnienie niżej**) | sonda `checkrout_okrazenie_z_biezacego_kafla`: `SiegeBattleSession::prepare` zamiast `start` (1 linia + komentarz) |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-MARCH-RESZTA-Q1/` | ten raport, `01-operator-r1-mutanty.patch` |

**Odstępstwo od allowlisty (jawne):** pełny `cargo test` (debug, kod `05b562521`) dał 4333 passed / **1 failed**:
`p6_k5loop_wiring_a::checkrout_okrazenie_z_biezacego_kafla` — panika N1 (`debug_assert!` jednoslotowego
`ProdBody::march`, wymóg dispatchu). Sonda po `SiegeBattleSession::start` (czyli po `play()`, gdy pierwsza aktywacja ma
już marsz krok po kroku w slocie) woła `body.start` obrońcy wprost, poza sterownikiem; ucieczka z okrążenia jest od
D-MR-1 marszem, więc druga aktywacja w toku = naruszenie kontraktu N1, które asercja słusznie wykrywa (w produkcji
aktywacje są sekwencyjne). Alternatywy: osłabić N1 (sprzeczne z dispatchem) albo zostawić czerwony test. Wybrałem
minimalną zmianę sondy: scena przed `play()` (`prepare`, ten sam układ jednostek i teren), asercje testu bez zmian
(ucieczka na kaflu startowym, brak na wzgórzach) — `p6_k5loop_wiring_a` 22/22. Do oceny Evaluatora.

Nie ruszano: `siege_tactics_actions.rs`, `siege_tactics_atk*.rs`, `siege_battle_session.rs` (po merge bez zmian
tematu), `gra/`, `src-tauri`, `view-model`, `renderer/*`, `client/*`, `Cargo.lock`. Brak `#[ignore]`. Strumień akcji
(`BattleAction`) bez nowych wariantów; zmienia się tylko kolejność/chwila skutków ucieczki (D-MR-2), więc bramki
client+renderer przy integracji (orkiestrator) są potrzebne.

## 8. Testy / bramki

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` = scratchpad
`mr/tgt` (usuwany po bramkach); jeden build naraz.

| Bramka | Wynik |
|---|---|
| engine `cargo fmt --check` | EXIT 0 |
| engine `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| engine pełny `cargo test --all-targets --no-fail-fast` (debug, w tle) | kod `05b562521`: 4333 passed / 1 failed (`checkrout_okrazenie_z_biezacego_kafla`, N1 — §7); kod `de1792ebb`: **EXIT 0, 557 × `test result: ok`, 4334 passed / 0 failed / 1 ignored** (istniejący, spoza diffu; baza 4315) |
| `p6_k5loop_wiring_a_pin` (release) | po merge bez D-MR-2: 12/13 (`predkosc_…`: „zgodne mimo listy” 3 pozycje); po D-MR-2 i pustej liście: wektory + prędkość zielone (przebieg bazowy mutantów), pełny plik zielony w pełnym `cargo test` |
| lib `march_incremental_tests` (release) | 36/36 |
| client / renderer | NIE URUCHAMIANE (dispatch: orkiestrator przy integracji) |

## 9. Commity (gałąź `rust-port-wip/march-reszta-q1-r2`)

| SHA | Treść |
|---|---|
| `ab36a79a5`, `e639275ee`, `bc49f97a1` | poprzednia próba (D-MR-1, testy lib, 5 wektorów `mr_*`, N1) |
| `71fd35556` | merge `origin/rust-port/parity-v2` `b41adf6a5` |
| `83fe1c4c4` | D-MR-2 + pusta lista `ROZBIEZNE_FQ_SPEED_402` |
| `05b562521` | testy lib (M6, M13, D-MR-2) |
| `de1792ebb` | sonda `checkrout_okrazenie_z_biezacego_kafla` na scenie przed `play()` (N1) |
| (commit raportu) | ten raport + patch mutantów — SHA w odpowiedzi Operatora / `git log` gałęzi |

## 10. Decyzje techniczne (do `REJESTR-RUST.md`, wpis orkiestratora)

- **D-MR-1** — marsze `_fallBackStep`, `_fleeStep`, `_cavalryAction` (manewr skierowany, manewr, szarża) i
  `_siegeWalkTo` krok po kroku przez `ProdBody::march`/`MarchStage` (jak D-MI-1/2).
- **D-MR-2** — skutki synchroniczne ucieczki z `_activateUnit` (rout z okrążenia, pierwsze wejście `_fleeStep`,
  zejście z pola, wstrząs sojuszników) trafiają do stanu sterownika w `LoopBody::after_start` (chwila `start`), nie w
  `complete`; zamyka tag `ucieczka-konflikt-zegara` w zmierzonych zbiorach.
- **D-MR-3** — `_rangedBackStep`, `_kiteStep`, `_rangedApproachStep` w pinie nieosiągalne (brak wołających) — bez
  portu; KITE i `_phalanxStep` to w pinie jeden krok.

## 11. Tabela „zamknięte / zostaje długiem”

| Pozycja | Stan |
|---|---|
| `_fallBackStep`, `_fleeStep`, kawaleria, `_siegeWalkTo` krok po kroku | ZAMKNIĘTE (D-MR-1) |
| `_rangedBackStep`, `_kiteStep`, `_rangedApproachStep` | ZAMKNIĘTE jako nieosiągalne w pinie (D-MR-3) |
| Rozbieżności FQ-SPEED przypisane #402 (`155`, `156`, `124`, `111`, `144`, `147`, `143`, `176`, `211`, `1087`, `1048`, `1075`) | ZAMKNIĘTE (zmierzone, zgodne; lista długu pusta) |
| N1 jednoslotowy `ProdBody::march` | ZAMKNIĘTE (`debug_assert!` + test) |
| Duplikat atomowy `march_incremental = false` | DŁUG **MARCH-ATOMIC-TESTONLY** (§5) |
| Tag `morale-konflikt-zegara` (aktywacja nie-ucieczkowa: skutki morale z `start` stosowane w `complete`) | DŁUG (NIE_ZMIERZONO w tym temacie; w zbiorach §4 tag nie wystąpił — wszystkie zgodne). Ten sam mechanizm `after_start` można rozszerzyć na `pend.morale`/`start_rout` |
| `mr_rown_jazda3_dk_mury_401` @1 ms | ograniczenie budżetu kroków diagnostyki (`SKIP_STEP_BUDGET`), nie rozbieżność; @16 zgodny |

## Długi

1. **MARCH-ATOMIC-TESTONLY** — gałęzie `!march_incremental` w `ProdBody` używane tylko przez testy poza sesją (§5).
2. **MORALE-START-IN-COMPLETE** — skutki morale/`start_rout` aktywacji nie-ucieczkowej nadal w `complete` (tag
   `morale-konflikt-zegara`); kandydat na rozszerzenie `after_start` (NIE_ZMIERZONO osobnym generatorem).
3. **DIAG-BUDGET-1MS** — przy `WIRING_A_RUST_FF_STEP=1` bitwy do sufitu 400 tur przekraczają `SKIP_STEP_BUDGET`
   (diagnostyka; produkcja 16 ms).
4. Pokrycie mutantów pełnymi bitwami słabe dla gałęzi wejścia/callbacku (§6) — pilnowane testami lib.
