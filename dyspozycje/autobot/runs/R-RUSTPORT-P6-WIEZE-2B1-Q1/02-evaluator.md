STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIEZE-2B1-Q1 (Evaluator r2; oceniany commit c0d383e71, baza f78736d36)
GOAL: planowanie wystrzałów wież z odroczeniem 180 ms, usunięty placeholder dead=true, naprawa regresji r1.
ZMIANY/COMMIT: brak zmian w kodzie; ten raport. Zakres c0d383e71 vs f78736d36: wyłącznie pliki allowlisty r2 (siege_tactics_loop.rs, p6_siege_tactics_loop{,_resume}.rs, _gen.mjs, vectors.json, p6_tower_target_wiring.rs, p6_wieze_2b1*, 01-operator-r2.md). gra/, Cargo.toml: bez zmian; Cargo.lock untracked, niecommitowany. git merge-base: f78736d36 jest przodkiem c0d383e71.
TESTY (CARGO_INCREMENTAL=0, DEBUG=0, CARGO_TARGET_DIR poza repo; odtworzone samodzielnie):
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: EXIT 0
- p6_wieze_2b1: 7 passed; p6_siege_tactics_loop: 4; _resume: 3; p6_tower_target_wiring: 6 (wszystkie EXIT 0)
- cargo test --test 'p6_siege*': EXIT 0 (wszystkie binarki ok, 0 failed, 0 ignored)
- cargo test --no-run (WSZYSTKIE binarki testowe się kompilują): EXIT 0, 0 błędów (regresja typu E0560 wykluczona w całym drzewie)
- Regeneracja obu generatorów (node p6_wieze_2b1_gen.mjs, p6_siege_tactics_loop_gen.mjs): wektory bajt-w-bajt identyczne (git status czysty poza Cargo.lock) -> deterministyczne, strażnik SHA-256 przechodzi.
- Mutacje produkcyjne (testy czułe): (M1) stagger 180->90: p6_wieze_2b1 FAIL (4), wiring FAIL (1); (M2) brak pominięcia wieży bez kafla: wieze_2b1 FAIL (2), wiring FAIL (1); (M3) stagger rośnie też dla pominiętej: wieze_2b1 FAIL (2). Kod przywrócony.
- Brak #[ignore] w plikach zmienionych (0 trafień). Asercje z p6_tower_target_wiring przepisane, nie usunięte; liczniki pokrycia w loop rozszerzone (dodany licznik "wieża bez kafla").
- PEŁNY cargo test bez filtra: NIE odtworzony przez Evaluatora (465 binarek, p6_8i_pick CPU-bound >1 h w debug; plik nietknięty przez temat). Dowód zastępczy: kompilacja całości + p6_siege* + lib zielone.
BLOKADY: brak blokad technicznych dla zakresu 2B1.

ZARZUTY (ponumerowane):
1. [NOTA, kryterium r2 pkt 1] Pełny `cargo test` (EXIT 0) nie został wykazany przez Operatora (464/465, p6_8i_pick niezakończony), ani przeze mnie. Ryzyko niskie (cały zestaw się kompiluje, p6_8i_pick poza zmianą), ale formalnie kryterium dispatchu niespełnione; wymaga decyzji FC/orkiestratora (np. p6_8i_pick w release lub akceptacja).
2. [NOTA, słabość testu] W p6_wieze_2b1.rs asercja `skipped == want_destroyed` jest tautologiczna: `skipped` liczone z wejść testu, a Rust nie raportuje zniszczeń. Test nie dowodzi więc `_destroyTowerAtRow`, tylko że wieże bez kafla nie są planowane (to dowodzą pozostałe asercje i M2/M3).
3. [NOTA, słabość wektorów pętli] p6_siege_tactics_loop (360 sekwencji) jest NIECZUŁY na planowanie wież: mutacje M1-M3 go nie łamią, bo callback wystrzału jest no-op po obu stronach (pin-stub i Rust). Regeneracja wektorów pętli jest więc tylko dowodem braku regresji, nie parytetu wież; parytet wież niosą wyłącznie testy 2B1 i wiring.
4. [NOTA, kod martwy do 2B2] `tower_shoot` liczy `pick_tower_for_row` i odrzuca wynik (`_target`); wybór celu w chwili wystrzału jest pokryty tylko testami jednostkowymi wołającymi `pick_tower_for_row` bezpośrednio, nie przez zegar (callback nie ma obserwowalnego efektu). To jawnie zadeklarowane NIE_ZROBIONE 2B2, zgodne z dispatchem (pkt 4 GOAL r1, pkt 5 r2); nie jest wołającym w Rust zależnym od W8.
5. [NOTA, brak parytetu] Brak guardu pinu `!this.towerShooterRow` (battleScene.ts:4209) oraz pominięcia `this.finished` w samym `fire_siege_towers`/`plan_tower_shots`: `finished` jest odcięte wcześniej w `begin_turn` (st.finished -> return), więc równoważne; guard towerShooterRow zastąpiony założeniem "tower_rows puste = brak strzelca" (generator ustawia strzelca zawsze, gdy są wieże). Zadeklarowane NIE_ZROBIONE przez Operatora; konflikt FC r1 pkt 4-5 vs dodatek r2 pkt 5 pozostaje do rozstrzygnięcia przez orkiestratora (2B2 osobno).
6. [NOTA, drobna] `p6_tower_target_wiring.rs` ma zdublowaną linię separatora `// ----` (kosmetyka).

Nie znaleziono: osłabionych asercji, #[ignore], zmian poza allowlistą, zależności od W8, ręcznych wektorów (wektory 2B1 pochodzą z wykonania wyciętego tekstu pinu 07d2fbd72, 245 przypadków, strażnik SHA).

WERDYKT: PASS-WITH-NOTES (zakres 2B1 spełniony; noty 1-5 do rozstrzygnięcia w FC).
RUNDY: Evaluator r2 (2/5).
NASTĘPNY KROK: Obrona Operatora (noty 1-5), potem Final Control r2; decyzja orkiestratora: 2B2 jako osobny temat (strzał _singleBlow, guard towerShooterRow, stan destroyed) i sposób zamknięcia kryterium pełnego cargo test.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny, bez push).
