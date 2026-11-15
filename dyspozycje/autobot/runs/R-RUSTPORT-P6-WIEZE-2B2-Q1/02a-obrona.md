STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIEZE-2B2-Q1
GOAL: Obrona Operatora (runda 1) na zarzuty Evaluatora z 02-evaluator.md (baza wejściowa: af7a0be6a, gałąź wip/R-RUSTPORT-P6-WIEZE-2B2-Q1).
ZMIANY/COMMIT: tylko rust-port/engine/tests/p6_wieze_2b2.rs (allowlista). Commit: patrz SHA w raporcie orkiestratora (commit obrony na wip, bez push). Cargo.lock nie commitowany. Kod produkcyjny (siege_tactics_loop.rs) nietknięty w tej rundzie.
TESTY: cargo test --test p6_wieze_2b2: 9/9 ok. Mutacja guardu w tower_hit (siege_tactics_loop.rs, `if tc.dead || tc.fading_out` -> `if false`): FAIL w tower_hit_skips_target_dead_before_impact i tower_hit_skips_target_fading_out_before_impact (po przywróceniu pliku: 9/9 ok). cargo clippy --test p6_wieze_2b2 -- -D warnings: EXIT 0. cargo fmt --check: EXIT 0. Pełny cargo test po tej zmianie NIE_ZMIERZONO w tej rundzie (zmiana dotyczy wyłącznie jednego pliku testowego; pełna bramka z af7a0be6a zgłoszona w 01 i w ocenie Evaluatora).

## Odpowiedzi na zarzuty

1. Brak wektorów z pina / tautologia oczekiwania (kryterium 4) -- PRZYJMUJĘ (zarzut prawdziwy, NIE naprawiono w tej rundzie).
   Dowód: test tower_shot_damages_target_through_single_blow_full nadal liczy `expected` przez `single_blow_full` na tym samym szablonie. Brak p6_wieze_2b2_gen.mjs i p6_wieze_2b2_vectors/. Wykonanie pina `_fireOneTower` z mockiem wymaga osobnego tematu (generator + strażnik SHA-256). Do czasu tego tematu wartość obrażeń NIE jest zweryfikowana względem pina.

2. Szablon strzelca = neutral_tower_shot_template(), nie towerShooterRow z strongest_ranged_unit_for_era -- PRZYJMUJĘ (fakt, NIE naprawiono).
   Dowód: `strongest_ranged_unit_for_era` istnieje w rust-port/engine/src/domain/city_towers.rs:186, ale nie jest wołana z pętli ani nie zasila SiegeEnv::tower_shot (w testach i w produkcji `Some(neutral_tower_shot_template())`). Brak mapowania wiersza jednostki na FullBlowInput. To jest niezrealizowana część założenia dispatchu; wymaga osobnego tematu (K5-LOOP-WIEZE-R2 / adapter ProdUnit -> FullBlowInput).

3. Stan destroyed zastąpiony proxy `!wall_tile_rows.contains(row)` -- ODRZUCAM (zarzut o błędzie logicznym), z zastrzeżeniem o pokryciu testu.
   Dowód z pina 07d2fbd72 (gra/src/battle/battleScene.ts):
   - jedyny zapis `t.destroyed = true` to `_destroyTowerAtRow` (4194-4198);
   - `_destroyTowerAtRow` jest wołany tylko z `_fireSiegeTowers` gdy `!this.wallTileHp.has(t.row)` (4216) oraz z wyłomu zaraz po `this.wallTileHp.delete(wallRow)` (7646-7648);
   - `wallTileHp.set` występuje tylko przy inicjalizacji po `clear()` (4053, 10529) i przy uszkodzeniu istniejącego wpisu (7558); nie ma odtwarzania kafla w trakcie bitwy.
   Wniosek: dla wieży `destroyed` ⇔ `!wallTileHp.has(row)`, więc Rust `wall_tile_rows.contains(row)` jest równoważne.
   Kolejność staggera też zgodna: pin pomija zniszczoną wieżę przed `stagger += 180` (4217-4218); Rust `plan_tower_shots` pomija przed `push` i przed przyrostem staggera (siege_tactics_loop.rs:289-297).
   Zastrzeżenie (PRZYJMUJĘ jako ograniczenie testu): test destroyed_tower_does_not_shoot symuluje wyłom czyszczeniem `wall_tile_rows`, a nie wywołaniem ścieżki wyłomu. Brak funkcji wyłomu w domenie Rust w tym zakresie. Zapisane jako NIE_ZMIERZONO (realna ścieżka wyłomu).

4. Brak kroku "czerwony przed zmianą" z kodem wyjścia (kryterium 1) -- PRZYJMUJĘ (NIE_ZMIERZONO, NIE naprawiono w tej rundzie).
   Powód: bazowy 14d5e50b9 nie ma API SiegeEnv::tower_shot ani LoopTimer::TowerHit; test by nie kompilował (czerwony przez brak symboli, nie przez zachowanie). Pomiar wymaga osobnego checkoutu bazy i nie został wykonany.

5. hit_arc (stałe Front) i first_blow_of_pair (stałe true) zakodowane na sztywno -- PRZYJMUJĘ (fakt, NIE naprawiono).
   Dowód: neutral_tower_shot_template (siege_tactics_loop.rs) ustawia `hit_arc: HitArc::Front` i `first_blow_of_pair: true`. Pin liczy łuk z geometrii wieża -> cel (facing), a nie z szablonu. Brak testu zgodności z pinem. Wymaga portu _nearestEnemy/_updateFacing (temat K5LOOP-FACING).

6. tower_blow tylko dopisuje do unported "wieza-resolveBlowOutcome-efekty"; brak wpisu w rejestrze zadań -- PRZYJMUJĘ w części o rejestrze, ODRZUCAM w części "nieujawniony dług".
   Dowód jawności: ciąg "wieza-resolveBlowOutcome-efekty" jest w siege_tactics_loop.rs (doc LoopBody::tower_blow / komentarz trafienia) i w 01-operator-r1.md, sekcja BLOKADY pkt 5.
   Przyjęte: brak wpisu w rejestrze zadań. Plik REJESTR-PROSB-I-ZADAN / rejestr tematów nie jest na allowliście tego tematu, więc wpis dodaje orkiestrator. Proponowany wpis:
   `wieza-resolveBlowOutcome-efekty` -- po trafieniu wieży: efekty morale/rout/engaged z pina `_resolveBlowOutcome` (battleScene.ts, po `_singleBlow`), etykieta obrażeń; zależy od K5LOOP-OUTCOME (#109/#147). Status: NIE zrobione.

7. Gałąź tower_hit "cel martwy/fading_out między wystrzałem a trafieniem" bez testu behawioralnego; mutacja przejdzie testy -- PRZYJMUJĘ i NAPRAWIONO.
   Poprawka (commit wyżej): trzy testy na zegarze przez publiczne LoopTimer::TowerHit(0):
   - tower_hit_skips_target_dead_before_impact,
   - tower_hit_skips_target_fading_out_before_impact,
   - tower_hit_on_live_target_blows (kontrola: ta sama konfiguracja, żywy cel dostaje cios).
   Dowód mutacji: po zamianie guardu w tower_hit na `if false` testy dead/fading dają FAIL; kontrola daje ok. Uczciwie: pierwsza wersja tych testów była pusta (jedyny atakujący martwy => bitwa kończy się przed trafieniem, `finished` maskował guard) i mutacja przeszłaby. Dodano drugiego żywego atakującego (two_attacker_state / two_attacker_env) i ustawiono move_points/morale_max dla dwóch jednostek. Mutacja zweryfikowana po poprawce.

8. Brak testu opóźnienia lotu TOWER_FLY_MS = 380 ms -- PRZYJMUJĘ i NAPRAWIONO (częściowo).
   Poprawka: tower_hit_lands_after_tower_fly_ms: stała == 380.0 (zgodność z RANGED_FLY_MS, pin battleScene.ts:1012), wystrzał TowerShot(0) daje dokładnie jedno trafienie, `clock.now() >= 380` po wyczerpaniu zegara.
   Ograniczenie (NIE_ZMIERZONO): asercja `>=` wykrywa skrócenie opóźnienia poniżej 380 ms, ale nie wykrywa wydłużenia. Dokładne `==` nie zostało wymuszone bez sprawdzenia wartości zegara po przebiegu.

## Podsumowanie dla orkiestratora
- Naprawione (commit obrony, tylko tests/p6_wieze_2b2.rs): zarzuty 7 i 8 (z ograniczeniem w 8).
- Odrzucone z dowodem: zarzut 3 (destroyed, równoważność z pinem).
- Przyjęte jako otwarte, poza zakresem tej poprawki (wymagają osobnych tematów): 1 (wektory/generator z pina), 2 (wiring city_towers -> tower_shot), 4 (czerwony przed zmianą), 5 (łuk i first-blow z geometrii), 6 (wpis w rejestrze dla wieza-resolveBlowOutcome-efekty).
- Kryterium 2 i 4 z dispatchu NIE jest spełnione w pełni; rekomendacja: FAIL-ready do decyzji FC lub podział na tematy K5-LOOP-WIEZE-R2 (#146) i wektory pinu.

NASTĘPNY KROK: Evaluator r2 na zmienionym teście (zarzuty 7-8) oraz decyzja Final Control, czy pozostałe otwarte pozycje (1, 2, 4, 5, 6) wystarczą do PASS-WITH-NOTES.
DEPLOY/PUSH: NIE WYKONANO (brak push, brak integracji, gra/ nietknięte).
