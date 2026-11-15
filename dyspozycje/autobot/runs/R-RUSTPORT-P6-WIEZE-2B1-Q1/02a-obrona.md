STATUS: INTEGRATION_PENDING
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIEZE-2B1-Q1
GOAL: Obrona Operatora na zarzuty Evaluatora/FC (runda 1 -> 2): odpowiedź na każdy z 7 zarzutów: PRZYJMUJĘ (z dowodem) albo ODRZUCAM (z dowodem).
BAZA: kod operatora dc0e8367c (gałąź wip/R-RUSTPORT-P6-WIEZE-2B1-Q1 w worktree wf_578f4944-497-1; w tej obronie NIE przestawiano gałęzi, pracowano na detached HEAD dc0e8367c).
ZMIANY/COMMIT: brak zmian w kodzie (rust-port/**, tests/**) w tej rundzie. Zmiana tylko tego pliku raportu. Commit SHA: patrz sekcja SHA na końcu.

ODPOWIEDZI NA ZARZUTY

1. Regresja poza allowlistą: tests/p6_tower_target_wiring.rs nie kompiluje się (E0560).
   WERDYKT: PRZYJMUJĘ.
   DOWÓD: `cargo test --test p6_tower_target_wiring --no-run` -> `error[E0560]: struct SiegeEnv<CellBody> has no field named tower`; `error: could not compile civ-engine (test "p6_tower_target_wiring")`. Plik tests/p6_tower_target_wiring.rs (linia 227, konstrukcja SiegeEnv z polem tower) NIE jest na allowliście rundy 1, więc nie został zmieniony.
   STAN: NIE_ZROBIONE w tej rundzie. Naprawa wymaga edycji pliku spoza allowlisty (przepisanie 4 testów asertujących natychmiastowe `dead` po fire_siege_towers na pending_tower_shots / zegar). DECYZJA WYMAGANA: rozszerzyć allowlistę o tests/p6_tower_target_wiring.rs.

2. Regresja: p6_siege_tactics_loop_matches_pin_text_on_all_vectors czerwony (tests/p6_siege_tactics_loop.rs:258).
   WERDYKT: PRZYJMUJĘ.
   DOWÓD: `cargo test --test 'p6_siege*' --no-fail-fast` -> `test p6_siege_tactics_loop_matches_pin_text_on_all_vectors ... FAILED`, `panicked at tests/p6_siege_tactics_loop.rs:258:5`. Pozostałe p6_siege* (wszystkie inne binarki) i p6_wieze_2b1 (6/6) zielone.
   STAN: NIE_ZROBIONE w tej rundzie. Wektory tests/p6_siege_tactics_loop_vectors/vectors.json i generator tests/p6_siege_tactics_loop_gen.mjs (ok. linie 156, 166 — model `__tower` z placeholderem dead) są poza allowlistą. Naprawa = regeneracja wektorów. DECYZJA WYMAGANA: allowlista dla p6_siege_tactics_loop_gen.mjs i p6_siege_tactics_loop_vectors/vectors.json.

3. Brak testów behawioralnych na wektorach pinu: p6_wieze_2b1_gen.mjs i vectors.json nie powstały.
   WERDYKT: PRZYJMUJĘ.
   DOWÓD: w dispatchu rundy 1 oba pliki są na allowliście (NOWE). Nie istnieją w dc0e8367c (`git show --stat` pokazuje tylko 4 pliki: siege_tactics_loop.rs, p6_siege_tactics_loop.rs, p6_siege_tactics_loop_resume.rs, p6_wieze_2b1.rs). Test p6_wieze_2b1.rs zawiera jedno odniesienie do pinu (linia 1: `battleScene.ts:4208-4219`) i wartości 0/180/360 wpisane ręcznie, bez wykonania pinu.
   STAN: NIE_ZROBIONE w tej rundzie. Powód: wykonanie metody `_fireSiegeTowers` z pinu wymaga wycięcia metody z klasy TypeScript i uruchomienia jej z mockiem `_schedule`/`_destroyTowerAtRow` (przekształcenie typów TS); nie zrobiono tego w tej rundzie. Fallback z dispatchu (wartości pina z cytatem linii) jest częściowo spełniony: stagger 0/180/360 i pominięcie wieży bez kafla mają cytat `battleScene.ts:4208-4219`, bez cytatów linii per asercja i bez strażnika SHA-256.
   Zadanie na kolejną rundę: dopisać strażnik SHA-256 wyciętego fragmentu i asercje z cytatem linii (pliki na allowliście).

4. Brak guardu !towerShooterRow z pinu (_fireSiegeTowers, :4209).
   WERDYKT: PRZYJMUJĘ.
   DOWÓD: pin `battleScene.ts:4209`: `if (this.finished || this.siegeTowers.length === 0 || !this.towerShooterRow) return;`. W rust-port/engine/src/domain/siege_tactics_loop.rs (dc0e8367c, `fn fire_siege_towers`) jest tylko `if self.tower_rows.is_empty() { return; }`. Brak `finished` i brak pojęcia towerShooterRow w SiegeEnv. Guard `finished` jest częściowo w `tower_shoot` (`if self.st.finished`), ale nie w planowaniu.
   STAN: NIE_ZROBIONE. Dodanie guardu wymaga nowego pola w SiegeEnv (wiersz strzelca), czyli zmiany publicznego API (patrz p. 7) i konstrukcji w testach, w tym w pliku spoza allowlisty (p. 1). DECYZJA WYMAGANA. Uwaga: guard `finished` w planowaniu nie zmienia wyniku, bo planowanie odbywa się w tej samej turze (`finished` nie zmienia się między planowaniem a `tower_shoot`, który już go sprawdza).

5. Brak stanu destroyed i sprawdzenia t.destroyed w tower_shoot (pin pomija wieżę zburzoną między planowaniem a wystrzałem).
   WERDYKT: PRZYJMUJĘ.
   DOWÓD: pin `battleScene.ts:4224`: `if (this.finished || t.destroyed) return;`. Rust: `fn tower_shoot` sprawdza tylko `finished`; `tower_rows: Vec<i64>` nie ma stanu destroyed. Pin ustawia `destroyed` także przy wyłomie (`battleScene.ts:7648`, `_destroyTowerAtRow(wallRow)`), czego port jeszcze nie ma.
   STAN: NIE_ZROBIONE. Brak stanu wież w SiegeEnv; dodanie wymaga pola (zmiana API jak p. 4). Test nie został dodany. Bez efektu dziś (callback pusty), ale staje się błędem parytetu przy 2B2 i przy portowaniu wyłomu. Zgłoszone jako dług do 2B2.

6. Ścieżka planning=true (pin _schedule, :9595) testowana tylko jako flaga w PlannedTowerShot.
   WERDYKT: PRZYJMUJĘ (ograniczenie testu).
   DOWÓD: src/domain/siege_tactics_clock.rs:108-111: `schedule(ms, payload, planning)` zwraca `RunNow(payload)` gdy `planning`. Sterownik SiegeLoop (siege_tactics_loop.rs, `SeqEvent::FireSiegeTowers`) przekazuje `p.planning` do `clock.schedule` i przy `RunNow` wywołuje `self.fire`, co woła `tower_shoot`.
   STAN: NIE_ZROBIONE jako test na SiegeLoop: `tower_shoot` nie ma jeszcze obserwowalnego efektu (strzał 2B2 niezrobiony), więc test nie odróżni RunNow od kolejkowania. Test zostanie dopisany wraz z 2B2 (efekt na HP/dead). Wcześniej: brak testu SiegeLoop dla planning=true.

7. Zmiana publicznego API (usunięte SiegeEnv::tower, dodane pending_tower_shots i LoopTimer::TowerShot) uderza w konsumentów poza allowlistą.
   WERDYKT: PRZYJMUJĘ.
   DOWÓD: `git show --stat dc0e8367c` i `grep -rn "SiegeEnv {"`: konstrukcje SiegeEnv w tests/p6_siege_tactics_loop.rs:148, tests/p6_siege_tactics_loop_resume.rs:149, tests/p6_tower_target_wiring.rs:227 (poza allowlistą), tests/p6_wieze_2b1.rs:76. `LoopTimer` jest publiczny (`pub enum LoopTimer`), dopisanie wariantu `TowerShot` zmienia wyczerpanie `match` u konsumentów.
   STAN: CZĘŚCIOWO. Konsumenci w allowliście zostały dostosowane przez operatora (p6_siege_tactics_loop.rs, p6_siege_tactics_loop_resume.rs). Konsument poza allowlistą (p6_tower_target_wiring.rs) NIE. DECYZJA WYMAGANA: rozszerzyć allowlistę o tests/p6_tower_target_wiring.rs, tests/p6_siege_tactics_loop_gen.mjs i tests/p6_siege_tactics_loop_vectors/vectors.json (jak w zarzucie 7 i raporcie operatora).

PODSUMOWANIE
- PRZYJMUJĘ: 1, 2, 3, 4, 5, 6 (ograniczenie testu), 7. ODRZUCAM: brak.
- Kod w tej rundzie: NIE zmieniony (wszystkie poprawki wymagają plików spoza allowlisty rundy 1 lub nowego pola w SiegeEnv, co jest decyzją orkiestratora).
- Bramki (wykonane na dc0e8367c, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
  - `cargo test --test p6_wieze_2b1`: 6 passed, exit 0.
  - `cargo test --test 'p6_siege*' --no-fail-fast`: 1 FAILED (p6_siege_tactics_loop_matches_pin_text_on_all_vectors, linia 258), pozostałe binarki p6_siege* zielone.
  - `cargo test --test p6_tower_target_wiring --no-run`: error E0560, exit 101.
- Cargo.lock: wygenerowany przez build, NIE commitowany, usunięty po bramkach.
- DECYZJE WYMAGANE od orkiestratora: (a) rozszerzyć allowlistę o tests/p6_tower_target_wiring.rs, tests/p6_siege_tactics_loop_gen.mjs i tests/p6_siege_tactics_loop_vectors/vectors.json; (b) zgoda na nowe pole w SiegeEnv (wiersz strzelca `towerShooterRow` i stan `destroyed` wież), albo odłożenie do 2B2 z jawnym wpisem w rejestrze.
- NASTĘPNY KROK: runda 2 Operatora po decyzji (a) i (b); bez decyzji (a) bramki `cargo clippy --all-targets` i `cargo test --test 'p6_siege*'` nie przejdą.
- DEPLOY/PUSH: NIE WYKONANO. Nie pushowano do rust-port/parity-v2, nie integrowano, nie dotykano gra/ ani origin/main.
RUNDY: 1/5 (obrona rundy 1, odpowiedź na zarzuty Evaluatora/FC).
