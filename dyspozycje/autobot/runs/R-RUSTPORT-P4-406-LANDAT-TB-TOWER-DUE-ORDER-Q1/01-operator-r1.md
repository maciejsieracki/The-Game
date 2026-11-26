# R-RUSTPORT-P4-406-LANDAT-TB-TOWER-DUE-ORDER-Q1 — Operator r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-406-LANDAT-TB-TOWER-DUE-ORDER-Q1
GOAL: kolejność trafienia wieży (`due = t0 + 380`) wobec innych zegarów tej samej klatki (`due ∈ (t0 + 380, t0 + 384]`) zamrożona w wektorach z wykonania pinu i pilnowana testem bajt w bajt; czasy trafień wieży/kamienia `t0 + 384` / `t0 + 704` jako kontrakt z pinu; mutant EV6 i mutanty kolejności zmierzone.
ZMIANY/COMMIT: gałąź `rust-port-wip/406-tower-due-order-q1`, baza `origin/rust-port/parity-v2` = `81bf861d24f543b6718f043f34a8ce29a3294a80` (zgodna z dispatchem). Commity: `f5f6288c9` (WIP: generator, test lib, skrypt mutantów), `20179cbd0` (wektory + test bajt w bajt), commit raportu (SHA w odpowiedzi Operatora). Kod produkcyjny silnika BEZ ZMIAN (D-406-2).
TESTY: engine `cargo fmt --check` EXIT 0, `cargo clippy --all-targets -- -D warnings` EXIT 0, pełny `cargo test --all-targets --no-fail-fast` EXIT 0 (**4372 passed / 0 failed / 1 ignored**; baza 4370 + 2 nowe testy). Nowy test wektorów 74/74 bajt w bajt; nowy test lib ok; mutanty 9/9 zabite (§4).
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO

## 1. Najpierw web: co pin robi (odczyt `git show 07d2fbd72:gra/src/battle/battleScene.ts`)

- `_schedule` (`:9595-9606`): `vTimers.push({ due: this._now() + Math.max(0, ms), cb, id: this.vTimerSeq++ })`; w planowaniu AUTO callback synchronicznie.
- `_drainTimers` (`:9616-9640`): `target = vNow` klatki; w pętli wybiera zegar z `due <= target` o najmniejszym `due`, remis — mniejsze `id`; `vNow` NIE jest przesuwane do `due`. Zegar zaplanowany w trakcie klatki z `due <= target` odpala w tej samej klatce.
- Wieża: `_fireOneTower` (`:4223-4268`) → `_schedule(RANGED_FLY_MS = 380, …)` (`:4262`); kamień: `_attackWallTile` (`:7540-7568`) → `_schedule(700, …)` (`:7555`). Inne odstępy zegarów pinu: `ACT_GAP_MS 160`, `TURN_GAP_MS 240`, `STEP_GAP_MS 70`, `BLOW_SETTLE_MS 220`, `RANGED_GAP_MS 320`, salwa wież `stagger += 180` (`:4216`), `_schedule(0)` (`:10009`), `_schedule(40)` (`:18601`).
- Wniosek arytmetyczny: wszystkie zegary planowane są w chwili klatki, więc `due ≡ ms (mod F)`. Przy `F = 16` przedział `(t0 + 380, t0 + 384]` zawiera tylko `due = t0 + 384`, czyli zegary z `ms ≡ 0 (mod 16)`: 160, 240, 320, 0, salwa 720, 1440… Przy `F = 8` dochodzą `ms ≡ 6 (mod 8)` — krok marszu `STEP_GAP_MS = 70` (`due = t0 + 382`).

## 2. Zmiany

Pliki (wszystkie na allowliście):

- `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` — nowy tryb `WIRING_A_TOWER_ORDER_VECTORS=16,8` (+ `_SHARD=k/n`, `_MERGE=…`, `_ONLY=…`) i obserwator `sc.recordTowerOrder` w `runScenario`. Obserwator to wyłącznie opakowania metod instancji (tekst pinu i strażnik SHA-256 `3eeeb760…` bez zmian): każdy `_schedule` dostaje rekord `{due, ms, src, kind}` i opakowany callback zapisujący odpalenie `[vNow klatki, rekord]`; zdarzenia `S` (wystrzał wieży, cel = `pickTowerTarget` pinu z tymi samymi wejściami co `:4229-4234`), `B` (kamień), `T` (napis tury `_beginTurn` `:5675`) obok istniejących `C/R/K/D`. Nowe pole sceny `wallFrameMs` (długość klatki rAF sterownika; domyślnie 16). Istniejące tryby generatora i ich pliki bez zmian.
- `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/tower_due_order_vectors.json` — NOWY plik (801 607 B, MD5 `8fcae53473e7cd4d367df427cc96c483`). `vectors.json`, `speed_vectors.json`, `speed_change_vectors.json`, `pin_data.json` bez zmian treści (git diff pusty; D-406-1).
- `rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs` — test `kolejnosc_trafienia_wiezy_w_klatce_wektory_pinu_bajt_w_bajt` (+ pomocnicze `tower_order_vectors`, `order_event_key`, `run_tower_order`, `tower_order_diff`; diagnostyka `P406_DUMP=<nazwa>` wypisuje strumień Rust/pin bez wpływu na wynik).
- `rust-port/engine/src/domain/siege_tactics_loop.rs` — WYŁĄCZNIE nowy test `#[cfg(test)]` `wieza_w_locie_nominalny_due_a_land_at_z_siatki_klatki` w module `tower_target_tests` (kod produkcyjny bez zmian).
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-406-…/00-dispatch.md` (kopia dispatchu), `01-operator-r1-mutanty.py`, ten raport.

### 2a. Decyzja techniczna Operatora D-406-OP-1: czas rzeczywisty zamiast przewijania

Pierwsza wersja wektorów (tryb `skip`, jak `vectors.json`) dała w Rust wszystkie 70 bitew rozbieżne WYŁĄCZNIE o stałe przesunięcie czasu bezwzględnego od tury 2 (np. `mur_bez_machin_sufit`: tura 2 Rust 3440 vs pin 3824, dalej stałe +384; wynik bitwy zgodny). Przyczyna: po `play()` pierwsza aktywacja tury 1 w pinie rejestruje kroki `_raf` w prawdziwym `requestAnimationFrame` przed `skip()` (`:3680-3707`, komentarz o „pierwszej turze”) — znany dług PRE-SKIP-RAF (#405), poza zakresem. Wektory 406 porównują chwile bezwzględnie, więc liczę je w czasie rzeczywistym (klatki rAF 16 ms; ten sam model czasu co `speed_change_vectors.json` #412, gdzie czasy zdarzeń były już zgodne 40/40). Bliźniak 8 ms: klatka rAF 8 ms przy `speedMul = 1` w pinie (`vNow += 8`), w Rust `speedMul = 0.5` przy klatce 16 ms (ten sam krok `v_now`, `diag_set_speed_mul`) — granica klatki jak D-PIN2-2.

## 3. Wyniki pomiarów (liczby)

Generator: 74 bitwy = 37 scenariuszy `SCENARIOS` z klatką produkcyjną × {16 ms, 8 ms}; 4 procesy, ~2 h CPU łącznie.

| miara | 16 ms | 8 ms |
|---|---|---|
| par (trafienie wieży, inny zegar z `due ∈ (t0+380, klatka]`) w pinie | **41** (w 41 klatkach, 12 bitew) | **45** (w 45 klatkach, 18 bitew) |
| pary zamrożone w wektorze (`pairFrames`) | 41 | 45 |
| trafienia wieży z `fire − t0` | 1491 × **384** | 1406 × 384 |
| trafienia kamienia z `fire − t0` | 1880 × **704** | 1674 × 704 |

Rodzaj „innego zegara” w parach (`src:ms`): 16 ms — `-:160` 17, `_activateUnit:160` 14, `_doRangedAttack:160` 4, `_rangedForwardStep:160` 3, `_doRangedAttack:320` 3; 8 ms — `_activateUnit:160` 27, `-:160` 5, `-:70` (krok marszu, `due = t0+382`) 4, salwa wież `_fireSiegeTowers:1080/6120/6840` 5, `_doRangedAttack:160/320` 2, `_rangedForwardStep:160` 2. Klatek pary, w których strumień zdarzeń ma trafienie wieży (`C wieza:`) i co najmniej jedno inne zdarzenie: 43. Loty bez trafienia (koniec bitwy, `:9620`): wieża 11, kamień 2 (wektor zapisuje `null`, test pomija porównanie `landAt` dla nich).

Strumień zdarzeń: 20 483 zdarzeń (`T` 7693, `B` 3556, `C` 2967, `D` 2910, `S` 2908, `R` 392, `K` 57).

**Test `kolejnosc_trafienia_wiezy_w_klatce_wektory_pinu_bajt_w_bajt`: 74/74 bajt w bajt** (cały strumień zdarzeń z czasem, loty wież/kamieni z `landAt` = `vNow` klatki trafienia w pinie, wynik bitwy: zwycięzca, tura, wyłom, liczba rzutów, HP/flagi każdej jednostki). Czas testu ok. 110 s (debug). Kontrakt czasu z PINU: test sprawdza dla każdego lotu z wektora `fire − t0 = frame_sched(F, nominał)`, a przy 16 ms literalnie 384 / 704 (E-3 #400 zamknięte wektorem). D-406-2: silnik zgodny z pinem, zmiana kodu produkcyjnego niepotrzebna, nowy temat rozbieżności nie powstaje.

Test lib `wieza_w_locie_nominalny_due_a_land_at_z_siatki_klatki`: dla kroków 16/8/32/4/1 ms `tower_in_flight` = `t0 + 380` (nominał), `TowerShot.land_at = t0 + frame_sched(F, 380)` (siatka), różne dokładnie gdy `380 mod F ≠ 0`; trafienie czyta oś ciała z `set_reader_due(t0 + 380)`; trzy asercje `timeline_done` pokazują skutek (krok z `ord = t0+382` przy klatce 8 ms: nominał → niewykonany, siatka → wykonany).

## 4. Mutanty (skrypt `01-operator-r1-mutanty.py`, plik przywracany, `git status` czysty po przebiegu)

LIB = `cargo test --lib wieza_`; WEKTOR = nowy test wektorów (liczba rozbieżnych wektorów z 74); PEŁNE = `cargo test --lib` + cały `--test p6_k5loop_wiring_a_pin` (tylko dla przeżywających, `MUT_FULL=1`).

| ID | mutant | LIB | WEKTOR (rozb.) | wynik |
|---|---|---|---|---|
| EV6 | `tower_in_flight` z `due = land_at` (siatka) | FAIL | ok (0) | **ZABITY** (lib) |
| Q1 | `tower_in_flight` z `due` o klatkę później | FAIL | ok (0) | ZABITY (lib) |
| Q2 | zegar trafienia wieży planowany z `due` z siatki (remis z innymi zegarami klatki po `id`) | ok | FAIL (5) | ZABITY |
| Q3 | `_drainTimers`: remis `due` odwrócony (`id` malejąco) | ok | FAIL (7) | ZABITY |
| Q4 | `_drainTimers`: kolejność zaplanowania (FIFO) zamiast `due` | ok | ok (0) | ZABITY (pełne: lib FAIL, p6 FAIL) |
| Q5 | `due` WSZYSTKICH zegarów z siatki klatki | ok | ok (0) | ZABITY (pełne: lib FAIL, p6 FAIL) |
| Q6 | `_drainTimers` malejąco po `due` (inny zegar przed wieżą) | ok | FAIL (12) | ZABITY |
| Q7 | trafienie wieży czyta oś ciała bez `due` (`f64::MIN`) | FAIL | ok (0) | ZABITY (lib) |
| Q8 | trafienie wieży czyta oś ciała z `due = +inf` | FAIL | ok (0) | ZABITY (lib) |

Razem 9/9 zabitych; mutanty kolejności Q2, Q3, Q6 zabite wektorami 406 (5, 7, 12 rozbieżnych wektorów).

**EV6 — uwaga jawna (wynik pomiaru, nie „równoważność z założenia”):** EV6 daje FAIL wyłącznie w teście lib (`wieza_czyta_os_celu_z_nominalnym_due_wystrzalu_i_trafienia` i nowy test); w 74 wektorach pinu rozbieżnych przypadków **0**. Tak samo Q1/Q7/Q8 (wszystkie zmieniają tylko `reader_due` trafienia wieży). Powód strukturalny (Rust po MARCH-INCREMENTAL/RESZTA): `reader_due` porównywany jest z kluczem `ord` wpisów osi ciała tej klatki (`timeline_done`, `t0 < v_now || (t0 == v_now && ord < reader)`). Wpis z `ord ∈ [t0+380, t0+384)` powstaje tylko z zegara kroku o tym `due`, a ten w kolejności `_drainTimers` odpala PO trafieniu wieży (`due` 380 najmniejsze), więc w chwili odczytu wpisu jeszcze nie ma; wpisy wcześniejsze w klatce mają `ord < t0+380`. W żadnym z 86 par pinu nie wystąpił wpis wyprzedzający zegar (krok liczony z góry z `t0` równym klatce trafienia). Odczyt nominalny pilnują więc testy lib, a wektory pilnują kolejności zegarów (Q2/Q3/Q6) i czasu trafienia. Wektor rozróżniający EV6 wymagałby wpisu osi ciała wykonanego przed zegarem (dziś brak takiej ścieżki) — NIE_ZMIERZONO poza 74 wektorami.

## 5. Bramki (engine; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach)

| bramka | wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 (po ostatnim commicie kodu) |
| `cargo test --all-targets --no-fail-fast` | EXIT 0 — 4372 passed / 0 failed / 1 ignored (558 binarek; w tym `kolejnosc_trafienia_wiezy_w_klatce_wektory_pinu_bajt_w_bajt` i `wieza_w_locie_nominalny_due_a_land_at_z_siatki_klatki` ok, `wektory_pinu_pelnej_bitwy_bajt_w_bajt`, `predkosc_bitwy_wektory_pinu_bajt_w_bajt`, `zmiana_predkosci_w_trakcie_*` ok) |

Client i renderer nietknięte (D-406-3), bramek nie uruchamiałem. Wolne miejsce przed bramką: 13 GB.

## 6. Długi / NIE_ZMIERZONO

- NIE_ZMIERZONO: wektor, w którym EV6 zmienia wynik (patrz §4; w 74 bitwach pinu takiej sytuacji brak, ścieżka wymaga wpisu osi ciała przed zegarem).
- NIE_ZMIERZONO: pary przy prędkościach > 1 (`speedMul` 2…512) i przy zmianie prędkości w trakcie bitwy — wektory 406 mają tylko klatki 16 i 8 ms.
- NIE_ZMIERZONO: tryb przewijania (`skip`) z czasem bezwzględnym — zablokowany długiem PRE-SKIP-RAF (#405); wynik bitwy w trybie skip pilnuje dalej `vectors.json`.
- Obserwowalność: 43 z 86 klatek pary mają w strumieniu zdarzenie trafienia wieży i inne zdarzenie; w pozostałych kolejność wpływa tylko na stan (pilnowany przez wynik bitwy i dalszy strumień).
- Salwa wież z dużym `stagger` (1080/6120/6840 ms, 5 par przy 8 ms): w tych klatkach wystrzał nie dał zdarzenia `S` (brak celu / wieża bez kafla), więc FIFO (Q4) nie był widoczny w wektorach 406 — Q4 zabijają inne testy (pełne lib i p6).

## 7. Artefakty

- `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/tower_due_order_vectors.json` (MD5 `8fcae53473e7cd4d367df427cc96c483`); odtworzenie: `WIRING_A_TOWER_ORDER_VECTORS=16,8 WIRING_A_TOWER_ORDER_SHARD=k/4 WIRING_A_OUT=<część k> node rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` dla k=0..3, potem `WIRING_A_TOWER_ORDER_VECTORS=16,8 WIRING_A_TOWER_ORDER_MERGE=<części> node …` (bez `WIRING_A_OUT` zapis do katalogu wektorów).
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-406-LANDAT-TB-TOWER-DUE-ORDER-Q1/01-operator-r1-mutanty.py`.
