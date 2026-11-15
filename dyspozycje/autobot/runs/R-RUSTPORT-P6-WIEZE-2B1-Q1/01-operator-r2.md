STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIEZE-2B1-Q1 (runda 2, dodatek r2; baza f78736d36; gałąź wip/R-RUSTPORT-P6-WIEZE-2B1-Q2)
GOAL: planowanie wystrzałów wież z odroczeniem 180 ms (fire_siege_towers zamiast placeholdera dead=true), wybór celu w chwili wystrzału, usunięcie placeholdera; naprawa regresji r1 poza allowlistą (E0560, pin-test pętli oblężenia).
ZMIANY/COMMIT: SHA: ustawiany przy commicie (patrz sekcja "COMMIT" niżej). Allowlista r2 (dyspozycje, pkt 1-4):
- rust-port/engine/src/domain/siege_tactics_loop.rs: dopisany moduł testów jednostkowych `tower_target_tests` (wybór celu w chwili wystrzału: najbliższy w zasięgu, remis po HP, pominięcie bez pozycji, wybór po zmianie stanu po planowaniu, brak celu). Logika planowania z dc0e8367c bez zmian.
- rust-port/engine/tests/p6_tower_target_wiring.rs: 5 testów z asercjami `dead` po fire_siege_towers przepisane na semantykę planowania (planned = [(0,0)], [(0,0),(180,1)]; brak `dead` przy planowaniu; brak wież = brak planowania). Usunięty argument `tower` z `env()` (E0560 naprawiony). Test wektorów `vectors_match_pin_pick_tower_target` bez zmian.
- rust-port/engine/tests/p6_siege_tactics_loop_gen.mjs: pin-wycinki `_fireSiegeTowers` (jako `_fireSiegeTowersPin`) i `_destroyTowerAtRow`; spec wież `towers` + `wallRows` zamiast `tower`; stub `_fireOneTower` (no-op, 2B2); nowy guard SHA-256 LOOP_FRAGMENT_SHA256 = 129c7e8e1c9d2865d14aa7a8c3eedad66ff83f7d632f40853285f07f03857e1d.
- rust-port/engine/tests/p6_siege_tactics_loop_vectors/vectors.json: regeneracja (360 sekwencji, withTower 179, withUnwalledTower 83).
- rust-port/engine/tests/p6_siege_tactics_loop.rs i p6_siege_tactics_loop_resume.rs: build() czyta `towers`/`wallRows`, asercje liczników wież po nowym kluczu (nic nie osłabione; dodany licznik "wieża bez kafla muru").
- rust-port/engine/tests/p6_wieze_2b1.rs: dopisany test `planning_matches_pin_fire_siege_towers_on_all_vectors` (wektory 2B1; sprawdza odroczenia, wiersze, wieże pominięte).
- rust-port/engine/tests/p6_wieze_2b1_gen.mjs (NOWY): wykonuje wycięty tekst pinu `_fireSiegeTowers` i `_destroyTowerAtRow` (battleScene.ts:4194 i :4208) z mockiem `_schedule`; guard SHA-256 c7522e637a4739b31bf95c94d3d8906f8726bc1ac87afbe015ac9db4794d4f8a.
- rust-port/engine/tests/p6_wieze_2b1_vectors/vectors.json (NOWY): 245 przypadków (5 kotwiczących z pinu + 240 losowych, seed 2231).
- dyspozycje/autobot/runs/R-RUSTPORT-P6-WIEZE-2B1-Q1/01-operator-r2.md (ten plik).
Poza allowlistą: nic. `siege_tactics_turnseq.rs` NIE zmieniony (SeqEvent::Schedule wystarczył). `gra/`, Cargo.toml, Cargo.lock: nie dotykane (Cargo.lock wygenerowany lokalnie przez cargo, untracked, NIE commitowany).

WYKONANE (pkt 1-4 dodatku r2):
1. p6_tower_target_wiring.rs: 4 testy asertujące natychmiastowe `dead` przepisane (nie usunięte) na semantykę planowania; E0560 usunięty.
2. Regeneracja p6_siege_tactics_loop_gen.mjs + vectors.json wg pinu (fire_siege_towers z odroczeniami; wieża bez kafla pomijana; brak wieży = brak planowania). Strażnik SHA-256 zachowany (zaktualizowany do nowego fragmentu).
3. p6_siege_tactics_loop.rs i _resume.rs: dopasowanie do nowej sygnatury/spec (bez osłabiania).
4. Test 2B1 z wartościami z pinu: WYKONANE przez wykonanie wyciętego tekstu pinu (p6_wieze_2b1_gen.mjs), nie przez ręczne wartości. Kotwice z pinu: towers [3,4,5] wallRows [3,5] -> planned [(0,3),(180,5)], destroyed [4] (battleScene.ts:4208-4219, 4194-4201).

NIE_ZROBIONE (pkt 5 dodatku r2 — świadomie, zgodnie z dispatchem; FC r1 pkt 4-5 żądał tego w tej rundzie, patrz BLOKADY):
- strzał `_singleBlow` wieży (2B2): callback `tower_shoot` zostaje pusty z komentarzem `// 2B2: strzał _singleBlow wieży` (siege_tactics_loop.rs). NIE zadano obrażeń.
- guard `!this.towerShooterRow` (pin battleScene.ts:4209): wymaga pola w SiegeEnv (2B2). W Rust brak guardu; generator zawsze ustawia strzelca gdy są wieże, więc wektory są zgodne, ale to NIE jest pełny parytet.
- stan `destroyed` i sprawdzenie `t.destroyed` w strzale (2B2). Uzasadnienie: przy statycznym wallTileHp (kafel nie wraca) pominięcie zburzonej wieży przy planowaniu jest obserwacyjnie równoważne; w strzale 2B2 stan będzie potrzebny.
- `_destroyTowerAtRow` (efekt): w Rust wieża bez kafla jest tylko pomijana (brak planowania, brak stanu); pełny efekt (flaga destroyed, log, mesh) to 2B2.

RED PRZED ZMIANĄ (kryterium 1/3):
- Pre-change src (siege_tactics_loop.rs z 7b52c3842) + nowe testy 2B1: `cargo test --test p6_wieze_2b1` -> EXIT 101, błędy kompilacji: E0432 (brak PlannedTowerShot), E0560 (brak pending_tower_shots), E0599 (brak LoopTimer::TowerShot), E0609 (x5). Czerwony na poziomie kompilacji, NIE na asercji (stary src nie ma API planowania). Log: scratchpad red_2b1.log.
- Pre-change tower_target_wiring: E0560 na `tower` (przed zmianą) — potwierdzone FC r1 i reprodukowane (EXIT 101).

TESTY (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
- `cargo fmt --check` (rust-port/engine): EXIT 0 (po rustfmt na 5 dotkniętych plikach).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --lib`: 118 passed, 0 failed (w tym 4 nowe testy tower_target_tests).
- `cargo test --test p6_wieze_2b1`: 7 passed (w tym wektorowy).
- `cargo test --test p6_siege_tactics_loop`: 4 passed (wcześniej FAIL 78/360 w FC r1 — naprawione regeneracją).
- `cargo test --test p6_siege_tactics_loop_resume`: 3 passed.
- `cargo test --test p6_tower_target_wiring`: 6 passed (E0560 naprawiony).
- `cargo test --test 'p6_siege*'`: zawarte w pełnym runie (ponad 100 binarek, wszystkie dotychczas zielone).
- PEŁNY `cargo test` (bez filtra, kryterium 1), 465 binarek testowych (lib + 464 pliki tests/*.rs):
  - run sekwencyjny `cargo test --no-fail-fast`: 247 binarek uruchomionych, z czego 245 z `test result: ok` i 0 FAILED. Dwie niedokończone: `p6_8i_pick` (CPU-bound, debug, >1 h) i `p6_m12_compute` (przerwany przeze mnie przy zatrzymaniu runu). Run zatrzymany przeze mnie po ~1 h przy `p6_8i_pick`.
  - pozostałe 218 binarek uruchomione równolegle z już zbudowanych plików wykonywalnych: 218 x EXIT 0 (wynik w scratchpad rest_results.txt).
  - `p6_m12_compute` (ponowne uruchomienie): 12 passed, EXIT 0.
  - `p6_8i_pick` (test `pick_auto_improvements_matches_pinned_web_vectors`, plik NIE dotknięty przez ten temat, nie w allowliście): w debug trwa >1 h przy 99% CPU; ponownie uruchomiony w tle, w chwili raportu NIE ZAKOŃCZONY (wynik: NIE_ZMIERZONO). Kryterium 1 dodatku r2 (EXIT 0 pełnego runu) NIE jest spełnione w pełni z powodu tej jednej binarki.
- Wszystkie 465 binarek poza p6_8i_pick: EXIT 0 (zweryfikowane po nazwie i kodzie wyjścia).

PEŁNY RUN: 464/465 binarek EXIT 0; p6_8i_pick NIE_ZMIERZONO (timeout sesji, test poza zakresem zmian).

BLOKADY:
- Konflikt zakresu: FC r1 (03-final-control.md) żądał w tej rundzie guardu towerShooterRow, stanu destroyed i testu planning=true jako "NAPRAW". Dodatek r2 (pkt 5) wprost zakazuje ich implementacji w tym temacie (NIEZROBIONE). Operator wykonał dodatek; orkiestrator musi zdecydować, czy FC r2 je zaakceptuje jako NIE_ZROBIONE, czy zleca 2B2 osobno.
- Test `pick_auto_improvements_matches_pinned_web_vectors` (p6_8i_pick, base, nietknięty) jest CPU-bound od >50 min w debug (99% CPU). Blokuje zakończenie pełnego `cargo test` w czasie tej sesji. Nie jest związany z zakresem (plik p6_8i_pick.rs nie jest w allowliście i nie zmieniono go).
- Cargo.lock powstał lokalnie (untracked); nie commitowany.

RUNDY: 2/5 (runda 1 FC FAIL; runda 2 = ten raport).
NASTĘPNY KROK: FC r2 — weryfikacja zestawu testów (pełny cargo test po ukończeniu p6_8i_pick), decyzja orkiestratora o zakresie pkt 4-5 FC r1 (2B2 osobno).
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na wip/R-RUSTPORT-P6-WIEZE-2B1-Q2, bez push).
