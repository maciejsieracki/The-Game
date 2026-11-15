STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIEZE-2B1-Q1 (WIEZE-2B1, etap 2B z podziału WIEZE-MERGE, część 1 z 2)
GOAL: `fire_siege_towers` planuje wystrzały wież z odroczeniem `stagger` (0/180/360 ms, jak pin `_fireSiegeTowers`), wieża bez kafla muru jest pomijana, cel wybierany w chwili wystrzału, placeholder `dead = true` usunięty. Strzał `_singleBlow` wieży (2B2) NIE jest w tym temacie.
ZMIANY/COMMIT: commit kodu `dc0e8367cedf9303481343ee16e8992740c04ccf` na gałęzi `wip/R-RUSTPORT-P6-WIEZE-2B1-Q1` (baza `7b52c3842`, bez push). Zmienione pliki (wszystkie na allowliście): `rust-port/engine/src/domain/siege_tactics_loop.rs`, `rust-port/engine/tests/p6_siege_tactics_loop.rs`, `rust-port/engine/tests/p6_siege_tactics_loop_resume.rs` (usunięcie pola `tower` i martwego `side_of`), nowy `rust-port/engine/tests/p6_wieze_2b1.rs`. `siege_tactics_turnseq.rs` NIE zmieniony (istniejący `SeqEvent::Schedule` nie przenosi wystrzału wieży, więc kolejka planowania żyje w `SiegeEnv::pending_tower_shots` i jest odbierana przy `SeqEvent::FireSiegeTowers`; sygnatura traitu `TurnSeqEnv::fire_siege_towers` bez zmian). Cargo.lock nie commitowany (untracked, generowany przez cargo).
  Uwaga o bazie: poprzedni HEAD gałęzi roboczej (`e956b5015`) nie zawierał `7b52c3842`; wg dispatchu gałąź przestawiona na `7b52c3842` (`git merge-base --is-ancestor` potwierdzone po przestawieniu).
TESTY:
- Czerwony przed zmianą: `cargo test --test p6_wieze_2b1` (test `planning_does_not_set_dead_on_the_target`) -> exit 101, "placeholder dead ustawiony przy planowaniu".
- Po zmianie: `cargo test --test p6_wieze_2b1` -> exit 0, 6/6 zielone (planowanie 0 ms dla jednej wieży, stagger 0/180/360 dla trzech wież, wieża bez kafla pomijana bez podbijania staggera, brak planowania bez wież, flaga `planning` z `auto_batch_planning`, pełna ścieżka `SiegeLoop::start` -> zegar z timerami `TowerShot` na 0/180/360 ms, brak `dead` po planowaniu).
- `cargo fmt --check` -> exit 0.
- `cargo clippy --lib -- -D warnings` -> exit 0.
- `cargo clippy --test p6_wieze_2b1 --test p6_siege_tactics_loop --test p6_siege_tactics_loop_resume -- -D warnings` -> exit 0.
- `cargo test --lib` -> exit 0, 114 passed.
- `cargo test` na wszystkich `p6_siege*` (glob rozwinięty ręcznie, 78 plików testowych) + `p6_wieze_2b1`, `--no-fail-fast`: 1 FAILED, reszta zielona: `p6_siege_tactics_loop::p6_siege_tactics_loop_matches_pin_text_on_all_vectors` (patrz BLOKADY 2).
- `cargo clippy --all-targets -- -D warnings` -> exit 101: kompilacja `tests/p6_tower_target_wiring.rs` nie przechodzi (patrz BLOKADY 1).
- `git diff --check` -> czysty. `git diff --stat` tylko na allowliście.
- Wartości z pina: cytowane linie `battleScene.ts:4208-4219` (`_fireSiegeTowers`: pominięcie `destroyed`, `_destroyTowerAtRow` gdy brak kafla, `stagger += 180`, `_schedule(delay, ...)`) i `:4223-4232` (`_fireOneTower`: `finished`/`destroyed`, wybór celu). Pin odczytany ręcznie przez `git show 07d2fbd72:gra/src/battle/battleScene.ts`.

BLOKADY:
1. POZA ALLOWLISTĄ, konieczne do zielonego stanu: `rust-port/engine/tests/p6_tower_target_wiring.rs` (nie ma go na allowliście). Po usunięciu placeholdera:
   - nie kompiluje się: `SiegeEnv` nie ma pola `tower` (E0560, linia 229) — kompilacja binarki testu pada, więc `cargo clippy --all-targets` i `cargo test` całego crate'u są czerwone;
   - 4 testy asertują natychmiastowe `dead` po `fire_siege_towers` (`tower_fires_at_nearest_in_range_attacker_with_hp_tie_break`, `unit_without_cell_is_not_targeted`, `picks_are_taken_before_placeholder_hits_land`) — po etapie 2B1 cel jest zabijany dopiero w callbacku, więc te asercje są z definicji błędne (nie da się ich zachować bez osłabienia);
   - `placeholder_still_used_when_no_tower_rows` testuje usunięty placeholder;
   - test `tower_without_wall_tile_does_not_fire` przechodzi, ale jego komentarz mówi o etapie 1.
   Wymagana zmiana: przepisać te testy na asercje o `env.pending_tower_shots` (odroczenia) i o zegarze (`LoopTimer::TowerShot`), bez osłabiania. Wymaga dopisania pliku do allowlisty.
2. FAIL: `p6_siege_tactics_loop_matches_pin_text_on_all_vectors` (`rust-port/engine/tests/p6_siege_tactics_loop.rs`, asercja linia 258). 78 z 360 sekwencji rozjechanych; sprawdzono na 20 rozjechanych identyfikatorach (loop-002, -003, -004, -009, -012, -026, -027, -035, -039, -049, -077, -092, -099, -105, -107, -115, -123, -127, -130, -151): wszystkie mają `spec.tower != null`. Przyczyna: wektory `rust-port/engine/tests/p6_siege_tactics_loop_vectors/vectors.json` i generator `rust-port/engine/tests/p6_siege_tactics_loop_gen.mjs` (linie ok. 164-168) modelują `_fireSiegeTowers` jako placeholder ustawiający `dead` na wskazanej jednostce. Pin tego nie robi: przy pustym `siegeTowers` jest `return` (`battleScene.ts:4208-4219` przez `if (... this.siegeTowers.length === 0 ...) return`). Naprawa: regeneracja wektorów generatorem z mockiem bez placeholdera (wieże puste -> no-op) albo wektory z wieżami z prawdziwym `siegeTowers`. Wymaga allowlisty: `p6_siege_tactics_loop_gen.mjs` i `p6_siege_tactics_loop_vectors/vectors.json`. Nie osłabiam asercji.
3. NIE_ZROBIONE (zgodnie z zakresem 2B2 lub świadomie):
   - strzał `_singleBlow` wieży: callback `tower_shoot` zostaje pusty z komentarzem `2B2` (cel wybierany i odrzucany, bez efektu na stanie);
   - `_destroyTowerAtRow`: nie ma stanu `destroyed` ani logu "Wieza strzelnicza w wyłomie"; wieża bez kafla jest po prostu pomijana. To równoważne obserwacyjnie, bo kafel muru nie wraca w trakcie bitwy (monotonicznie), ale nie jest to 1:1 z pinem w stanie wewnętrznym;
   - guard `!this.towerShooterRow` z pinu nie jest modelowany (SiegeEnv nie ma strzelca);
   - generator `p6_wieze_2b1_gen.mjs` i `p6_wieze_2b1_vectors/vectors.json` (NOWE, na allowliście) NIE zrobione w tej rundzie: testy oparte na wartościach z pina z cytatem linii (fallback z dispatchu), bez strażnika SHA-256 wyciętego fragmentu.
4. Usunięcie pola `SiegeEnv::tower` jest zmianą publicznego API (crate `civ-engine`); jedyni konsumenci to testy wymienione w BLOKADZIE 1 i 2 oraz pliki na allowliście.

RUNDY: 1/5 (ostatni werdykt: brak; decyzja wymagana: rozszerzenie allowlisty o `rust-port/engine/tests/p6_tower_target_wiring.rs`, `rust-port/engine/tests/p6_siege_tactics_loop_gen.mjs`, `rust-port/engine/tests/p6_siege_tactics_loop_vectors/vectors.json`, albo decyzja o innym sposobie usunięcia placeholdera).
NASTĘPNY KROK: Orchestrator: rozszerzyć allowlistę o pliki z BLOKADY 1 i 2 (i opcjonalnie o generator 2B1), potem kolejna runda Operatora (zmiana testów wiring i regeneracja wektorów pinu, bez osłabiania asercji). Dopiero potem Evaluator i Final Control.
DEPLOY/PUSH: NIE WYKONANO (brak push, brak integracji, rejestry nieruszone).
