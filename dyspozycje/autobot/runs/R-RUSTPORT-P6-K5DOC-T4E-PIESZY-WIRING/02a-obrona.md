STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING (runda 4, obrona Operatora HAIKU)
GOAL: odpowiedź na 7 zarzutów z Evaluatora/FC do r4 (commit 732ef51a0); przyjęte poprawki z dowodem, odrzucone z dowodem, długi zapisane jako NIE_ZMIERZONO.
BAZA: origin/rust-port/parity-v2 = c120f2373 (worktree detached; commit Operatora r4 = 732ef51a0; poprawka obrony na wierzchu 732ef51a0).

## Odpowiedzi na zarzuty

### Z1. Bramki odtworzone, wektory z generatora
PRZYJMUJĘ (potwierdzono, bez zmian kodu).
- `cargo fmt --check -p civ-engine`: exit 0.
- `cargo clippy -p civ-engine --all-targets -- -D warnings`: exit 0.
- `cargo test -p civ-engine --test p6_k5doc_t4e`: 7 passed, 0 failed (w tym nowy test `refusal_needs_no_terrain_and_changes_nothing`).
- `node rust-port/engine/tests/p6_k5doc_t4e_gen.mjs`: "OK: 313 przypadkow (odmowa=36, kawaleria=141, planowanie=152)"; `vectors.json` bez zmian w `git status` (identyczny z commitem).
- Pełny `cargo test -p civ-engine --all-targets --no-fail-fast`: wynik w sekcji TESTY poniżej.

### Z2. move_step bez produkcyjnego wołającego; brak e2e sekwencji tury
ODRZUCAM (dowód: zakres dispatchu).
- DODATEK r2 (D4) i DODATEK r3 (rozstrzygnięcie GRANICA T4e-0 / T4e-1) jednoznacznie ograniczają T4e-0 do wiringu jednego kroku `krok -> do_move_effects` w `move_step`. Pełny krok 1–10 i wpięcie w SiegeLoop (#113) są w T4e-1.
- Kryterium r1 „test e2e sekwencji tury” zostało zastąpione przez zakres r2/r3/r4 (DODATEK r4: „ZAKRES: wyłącznie T4e-0”).
- Wiring jest testowany przez `ProdBody::move_step` w teście `pin_vectors_match_move_step` (p6_k5doc_t4e.rs, wektory z pinu) oraz w `cavalry_and_foot_pay_different_cost_on_forest`, `ford_halves_step_cost_in_wiring`, `occupancy_is_seeded_from_unit_positions`, `refusal_needs_no_terrain_and_changes_nothing`.

### Z3. cavalryTerrainMultiplier to stub; combat.ts:756 nie wykonany
PRZYJMUJĘ jako NIE_ZMIERZONO (dług, bez zmiany w tej rundzie).
- Potwierdzam: generator używa tabeli CAV_TABLE (Las=2, Góry=Infinity, reszta=1) wg komentarza pina `battleScene.ts:7431`, a nie wykonuje `combat.ts:756` (`cavalryTerrainMultiplier`, który czyta `data/terrain-combat.json`, kolumna „Kawaleria/Rydwan”). Odtworzona w komentarzu semantyka combat.ts:745-770 (Las `x2`, Góry `NIEDOSTEPNE` -> Infinity, reszta 1) zgadza się ze stubem, ale to NIE jest wykonanie.
- Wnioski: testy kawalerii dowodzą poprawnego podpięcia mnożnika do `move_cost` (`mounted`), nie realnych wartości z danych. Do zamknięcia: rozszerzyć generator o wykonanie combat.ts:745-770 i odczyt tabeli z pina (poza allowlistą tej rundy; wpis do rejestru).

### Z4. move_step bez produkcyjnego wołającego (powtórzenie Z2)
ODRZUCAM z powodem jak w Z2. Dodatkowo: test porządku `facing_is_called_last_after_occupancy_update` wywołuje `do_move_effects` z mockiem `Rec` (zakres T4c, mutacja (c) trafia tam). Na poziomie `ProdBody` kolejność nie jest obserwowalna: `update_facing` w `ProdMoveWorld` jest no-op (#107), więc nie ma czego asertować w wiringu. Nie dodaję asercji, która nic nie sprawdza.

### Z5. MissingTerrain także przy refused=true; web przy odmowie nie czyta terenu
PRZYJMUJĘ, poprawka wykonana.
- Dowód z pinu: `battleScene.ts:8689-8692` (`if (siegeWallCol >= 0 && _siegeMoveRefused) { ru.moveLeft = 0; done(); return; }`) nie czyta terenu ani nie zmienia pozycji/zajętości.
- Zmiana w `rust-port/engine/src/domain/siege_tactics_loop.rs` (`ProdBody::move_step`): gałąź `if refused { return Ok(MoveStepResult { move_left: 0.0, outcome: MoveOutcome { done: true } }) }` PRZED sprawdzeniem `self.terrain`. Zgodne z D1 (MissingTerrain tylko gdy ruch wymaga danych).
- Test: `p6_k5doc_t4e.rs::refusal_needs_no_terrain_and_changes_nothing` (bez terenu: Ok(move_left 0, done true), zajętość i pozycja bez zmian). Test `missing_terrain_is_explicit_error_without_mutation` zachowuje asercję MissingTerrain dla ruchu bez odmowy; asercja „odmowa tez wymaga adaptera” usunięta jako sprzeczna z pinem.
- Konsekwencja: gałąź `refused` w `do_move_effects` nie jest już używana przez `move_step` (nadal testowana w T4c).

### Z6. occ_by_key seedowane ze wszystkich jednostek, także martwych i uciekających
CZĘŚCIOWO: ODRZUCAM część „seed z martwych/uciekających”; PRZYJMUJĘ część o brakującym usuwaniu jako dług blokujący.
- Seed w `ProdBody::new` (`seed_occupancy`) dzieje się przy konstrukcji. `ProdUnit` nie ma pola `dead` (stan śmierci/ucieczki pochodzi z `TurnSeqState` przy `start`, `siege_tactics_loop.rs` komentarz do `ProdUnit`). Web też seeduje wszystkie rozstawione jednostki przy deployu (`battleScene.ts:4584`, `:4728`, `:5500` — `occByKey.set(key, ru)`). Seed jest więc zgodny z pinem.
- PRZYJMUJĘ jako rzeczywistą rozbieżność: web usuwa wpisy zajętości przy śmierci/ucieczce/cofnięciu na mur (`battleScene.ts:7709`, `:7726` — cofnięcie piechoty z wyburzonego muru; `:9812`, `:9915`, `:10498` — `occByKey.delete`). Rust `occ_by_key` jest aktualizowane WYŁĄCZNIE przez `move_step`, więc zajętość martwej jednostki zostaje w mapie. Bez wołającego (#113) nie ma to skutku produkcyjnego, ale blokuje poprawne wpięcie T4e-1/#113.
- Nie naprawiam w tej rundzie: ścieżki śmierci i cofnięcia nie istnieją jeszcze w `ProdBody` (poza allowlistą r4). Wpis do rejestru jako blokada dla T4e-1 i #113. Decyzja techniczna (sposób usuwania: jawne `occ_remove` przy śmierci vs. filtr po stanie) należy do orkiestratora (reguła 8).

### Z7. Trailer commitu 732ef51a0 ma linię „Cla” przed Claude-Session
ODRZUCAM jako bez znaczenia dla bramki (dowód: `git show -s 732ef51a0`): linia „Cla” jest kosmetyczna, a trailer nie zawiera nazwy modelu (#289 spełnione). Historii nie przepisuję, bo SHA 732ef51a0 jest już użyty w raportach orkiestratora.

## Pliki zmienione w tej obronie
- `rust-port/engine/src/domain/siege_tactics_loop.rs` (+8 linii: gałąź `refused` w `move_step`).
- `rust-port/engine/tests/p6_k5doc_t4e.rs` (test odmowy bez terenu; usunięta sprzeczna asercja).
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING/02a-obrona.md` (ten raport).

## TESTY (obrona)
- fmt --check: exit 0.
- clippy -D warnings (civ-engine, all-targets): exit 0.
- p6_k5doc_t4e: 7/7 ok.
- generator: 313 przypadków, vectors.json bez zmian.
- pełny `cargo test -p civ-engine --all-targets --no-fail-fast`: patrz wynik w commit/raporcie orkiestratora (uruchomiony, log w scratchpadzie tematu).
- NIE_ZMIERZONO: mutacje a/b/c/d NIE zostały ponownie uruchomione po zmianie Z5. Zmiana dotyczy wyłącznie gałęzi odmowy; mutacja (b) (brak MissingTerrain) jest nadal łapana przez `missing_terrain_is_explicit_error_without_mutation` (ruch bez odmowy).

## BLOKADY / DŁUGI
1. Z3: realny mnożnik kawalerii z combat.ts:756 / terrain-combat.json NIE_ZMIERZONO.
2. Z6: usuwanie z `occ_by_key` przy śmierci/ucieczce/cofnięciu na mur (pin :7709, :7726, :9812, :9915, :10498) brak — blokada dla T4e-1 / #113. Wymaga decyzji technicznej orkiestratora.
3. update_facing no-op (#107), zgodnie z DODATKIEM r4.

## RUNDY
Obrona po r4 Operatora (runda 4 tematu). Werdykt Operatora: PASS-WITH-NOTES z poprawką Z5.

## NASTĘPNY KROK
Evaluator (SONNET) i Final Control (SONNET) na commicie obrony (ponad 732ef51a0). Orkiestrator: decyzja techniczna dla Z6 i wpis do REJESTR-RUST.md (blokady 1–2).

## DEPLOY/PUSH: NIE WYKONANO (commit lokalny, bez push do parity-v2, bez integracji)
