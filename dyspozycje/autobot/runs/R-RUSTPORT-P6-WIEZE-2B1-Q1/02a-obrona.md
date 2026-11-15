STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIEZE-2B1-Q1 — obrona Operatora r2 (na zarzuty Evaluatora r2, `02-evaluator.md` z 90777566e; oceniany commit c0d383e71)
GOAL: odpowiedź na każdy zarzut: PRZYJMUJĘ (poprawka + dowód + commit) albo ODRZUCAM (dowód).
ZMIANY/COMMIT: 0f33f249c0b593f36cc463dba4b58442fc22c029 (gałąź `wip/R-RUSTPORT-P6-WIEZE-2B1-Q2-ob`, z c0d383e71, lokalnie, BEZ push). Zmieniono: `rust-port/engine/tests/p6_wieze_2b1.rs`, `rust-port/engine/tests/p6_tower_target_wiring.rs`. Kod produkcyjny (`src/`) NIE zmieniony. Ten plik (commit następny po 0f33f249c). Cargo.lock: untracked, nie commitowany.
TESTY: (po poprawkach, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo)
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --test p6_wieze_2b1: 7 passed, EXIT 0
- cargo test --test p6_tower_target_wiring: 6 passed, EXIT 0
- mutacja (`if false && !wall_tile_rows.contains`, czyli plan wież bez kafla): p6_wieze_2b1 FAILED 2 testy (tower_without_wall_tile_is_skipped..., planning_matches_pin... na anchor-003: left [(0,3),(180,4),(360,5)] vs right [(0,3),(180,5)]). Kod przywrócony (sprawdzone: 0 trafień `if false &&`).
- pełny cargo test bez filtra (zarzut 1): patrz pkt 1 niżej (sumarycznie: 464/465 EXIT 0 w sesji Operatora r2 + p6_8i_pick EXIT 0 w ponownym runie, log `scratchpad/8ipick.log`: "test result: ok. 5 passed; 0 failed", "finished in 293.66s", "EXIT 0").
BLOKADY: patrz pkt 2 (zakres asercji), pkt 3 (test pętli nie łapie wież — zaakceptowane jako nota), pkt 4-5 (NIE_ZROBIONE 2B2 wg dispatchu r2 pkt 5).
RUNDY: 2/5 (obrona r2 po Evaluatorze r2)
NASTĘPNY KROK: Final Control r2 — rozstrzygnięcie pkt 4 i 5 (zakres 2B2 vs FC r1 pkt 4-5) należy do orkiestratora.
DEPLOY/PUSH: NIE WYKONANO (lokalnie, bez push).

---

## Zarzuty i odpowiedzi

### 1. Pełny `cargo test` bez filtra nie wykazany z EXIT 0 — PRZYJMUJĘ (dowód złożony, bez pełnego jednego przebiegu)
- Operator r2 (c0d383e71): 464 z 465 binarek EXIT 0 (sekwencyjnie 245 + p6_m12_compute 12 passed + 218 równolegle EXIT 0).
- Brakująca binarka `p6_8i_pick` (base, poza zakresem zmian): w ponownym runie w tle zakończona sukcesem. Dowód: `scratchpad/8ipick.log` — `test result: ok. 5 passed; 0 failed; 0 ignored`, `finished in 293.66s`, `EXIT 0`.
- Nie wykonano jednego przebiegu `cargo test` bez filtra w tym samym czasie (koszt >1 h w debug). Kryterium "jeden przebieg EXIT 0" pozostaje formalnie niedomknięte; wynik sumaryczny 465/465 EXIT 0. Decyzja o akceptacji sposobu domknięcia należy do FC/orkiestratora.

### 2. Asercja `skipped == want_destroyed` tautologiczna — PRZYJMUJĘ (poprawka, commit 0f33f249c)
- Zarzut trafny: `skipped` było liczone z wejść testu (`towers` filtrowane przez `walls`), więc porównanie sprawdzało tylko spójność wektora z samym sobą.
- Poprawka: `skipped` = wieże, których indeksu NIE ma w `e.pending_tower_shots` (wyjście Rust), porównane z `destroyed` z pinu. Asercja mówi teraz: "wieże pominięte przez planowanie Rust == destroyed z pinu".
- Dowód: testy zielone (7/7) i mutacja planu wież bez kafla łamie test na asercji planowania (kod wyjścia != 0, patrz TESTY). Zastrzeżenie: sam efekt `_destroyTowerAtRow` (stan `destroyed`) NIE jest portowany w 2B1 (w `SiegeEnv` nie ma pola stanu wieży) i nie jest asertowany; to część 2B2 (dispatch r2 pkt 5). W komentarzu w teście zapisano to wprost.

### 3. `p6_siege_tactics_loop` nieczuły na planowanie wież — PRZYJMUJĘ jako notę (bez zmiany kodu)
- Zarzut prawdziwy: callback wystrzału jest no-op po obu stronach (pin-stub i Rust), więc wektory pętli nie niosą parytetu wież. Potwierdzam: parytet wież niosą `p6_wieze_2b1` (planowanie, 245 przypadków z pinu) i `p6_tower_target_wiring`.
- Nie zmieniam: zmiana wymagałaby efektu wystrzału (2B2). Wektory pętli pozostają dowodem braku regresji, co jest ich rolą w r2 (pkt 2 dodatku).

### 4. `tower_shoot` liczy `pick_tower_for_row` i odrzuca wynik — ODRZUCAM (zgodne z dispatchem)
- Dowód: `rust-port/engine/src/domain/siege_tactics_loop.rs`, `fn tower_shoot` (ok. linia 408–415): `let _target = self.env.pick_tower_for_row(&self.st, row);` z komentarzem `// 2B2: ... NIE zrobione`.
- Dispatch r1 GOAL pkt 3 wymaga, by wybór celu wykonywał się w chwili wystrzału (callback), a dispatch r1 pkt 4 oraz dodatek r2 pkt 5 wprost wyłączają strzał `_singleBlow` (2B2). Wybór celu w callbacku jest więc zrealizowany, a jego zużycie należy do 2B2. Wybór celu sprawdzają testy `tower_target_tests` (wołanie `pick_tower_for_row` na stanie z chwili wystrzału) oraz `p6_tower_target_wiring::vectors_match_pin_pick_tower_target`.

### 5. Brak guardu `!this.towerShooterRow` (battleScene.ts:4209) — ODRZUCAM jako błąd 2B1 (NIE_ZROBIONE 2B2 wg dispatchu)
- Dowód: dodatek r2 pkt 5 (`dyspozycje/autobot/runs/R-RUSTPORT-P6-WIEZE-2B1-Q1/00-dispatch.md`) wprost: "NIE_ZROBIONE: strzał `_singleBlow` (2B2), guard `towerShooterRow` (wymaga pola w `SiegeEnv`), stan `destroyed` i sprawdzenie w strzale (2B2)". Dodanie pola `towerShooterRow` do `SiegeEnv` jest poza allowlistą r2 (`siege_tactics_loop.rs` tylko w zakresie planowania).
- Zgadzam się z oceną Evaluatora, że `finished` jest odcięte w `begin_turn`, a założenie "tower_rows puste = brak strzelca" działa dla generatora. Rozstrzygnięcie konfliktu FC r1 pkt 4-5 z dodatkiem r2 pkt 5 należy do orkiestratora (proponuję: osobny temat 2B2, zgodnie z notą Evaluatora).

### 6. Zdublowana linia separatora w `p6_tower_target_wiring.rs` — PRZYJMUJĘ (poprawka, commit 0f33f249c)
- Usunięto jedną z dwóch linii `// ----...` przed komentarzem "Wiring produkcyjnej pętli". Plik po zmianie: fmt czysty, 6/6 testów zielone.

---

## Pliki w commicie 0f33f249c
- `rust-port/engine/tests/p6_wieze_2b1.rs` (asercja pominiętych wież z wyjścia Rust; sformatowane przez `cargo fmt`)
- `rust-port/engine/tests/p6_tower_target_wiring.rs` (usunięty duplikat separatora)

Uwaga o zastąpieniu: ten plik nadpisuje `02a-obrona.md` z obrony r1 (5e8b673d3); wersja r1 zachowana w historii gita.
