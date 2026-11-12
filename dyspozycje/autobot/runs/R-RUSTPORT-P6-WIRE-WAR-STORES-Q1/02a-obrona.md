STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-STORES-Q1
GOAL: obrona Operatora r4 po zarzutach Evaluatora (02-evaluator.md, commit c337db369): przyjęte poprawki z dowodem albo odrzucenie z dowodem
ZMIANY/COMMIT: baza kodu 434796d6b (Operator r4, HEAD 82a620d0c); poprawka obrony w commicie podanym niżej; zmieniony wyłącznie rust-port/engine/tests/p6_wire_war_stores.rs (allowlista: tests/p6_wire_war_stores*.rs) oraz ten plik. Cargo.lock niecommitowany.
TESTY: fmt --check EXIT 0; clippy --all-targets -- -D warnings EXIT 0; cargo test --test p6_wire_war_stores 7/7 ok (0 failed); cargo test --lib three (advance_turn_with_ai_city_passes_three_turns_after_stores) ok. Pełny cargo test --no-fail-fast NIE_ZMIERZONO (ani Operator r4, ani ta obrona go nie ukończyły; zostaje dla Final Control).
BLOKADY: brak technicznych. Otwarte: pełny cargo test (NIE_ZMIERZONO); Difficulty (KNOWN_GAPS[3]).
RUNDY: obrona r4/5 (Operator r4 po zarzutach Evaluatora r4)
NASTĘPNY KROK: Evaluator r5 (ponowna ocena poprawek) -> Final Control (pełny cargo test)
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 1. Test religii `religion_unity_follows_stored_city_religion` słaby (tautologia, brak przypadku dodatniego i progu) — PRZYJMUJĘ
Poprawka: test przepisany. AI dostaje cywilizację "Grecy" (civs.json); religia państwowa wyliczana tym samym `civ_religion_for_key` + `society-params.json`, co produkcja. Asercje (wszystkie przechodzą):
- brak zapisu: `miasta_jednosc_religii == Provided(1.0)` (domyślny stan z populacji = własna religia); zastąpiono tautologię `== 0.0 || == 1.0`;
- zapisany stan własnej religii dominującej: `Provided(1.0)`;
- zapisany stan obcej religii 100%: `Provided(0.0)`;
- próg: prog_dominacji_pct asertowany == 50.0; 51% własnej (49% obcej) => `Provided(1.0)`; 50%/50% => `Provided(0.0)` (dominacja ostro `> progu`, zgodnie z `dominant_religion`, society_inputs.rs:61-84).

### 2. Testy stores to wartości liczone ręcznie, nie wektory pinu; brak wołających w Rust — ODRZUCAM (część o wołających) / NIE_ZMIERZONO (wektory złożenia)
- Dowód wołających: `power_raw_for_owner` jest wołane w `build_war_inputs` (turn_war_inputs.rs:666), a `build_war_inputs` zasila `run_war_turn` i `advance_turn` (test lib `advance_turn_with_ai_city_passes_three_turns_after_stores` przechodzi). Zarzut „brak wołających w Rust” jest nieprawdziwy.
- Wektory złożenia: dispatch nie wymaga wektorów pinu dla złożenia (kryteria 2-4 dotyczą podłączenia producentów, braku cichych zer i asercji). Źródła logiki są w pinie 07d2fbd72: countBuildingsForOwner (main.ts:2629), countTechForOwner (main.ts:2638), countCitiesWithDominantStateReligion (gra/src/game/culture-religion.ts:1383). Wartości w teście są wyliczone z tych ciał funkcji, nie z pinu. Pełne wektory złożenia z weba NIE zostały uruchomione (NIE_ZMIERZONO) i nie są zrobione w tej rundzie.

### 3. Test „3 tur” buduje `inputs` raz — PRZYJMUJĘ
Poprawka: `three_war_turns_with_ai_cities_pass_strict` buduje `build_war_inputs(&state, &war)` na początku KAŻDEJ z 3 tur z bieżącego stanu wojny (jak w advance_turn). Przechodzi 3/3 tur. Dowód lib: `advance_turn_with_ai_city_passes_three_turns_after_stores` ok.

### 4. Difficulty::Normal na stałe; zgodność Easy/Hard NIE_ZMIERZONO — ODRZUCAM (jako defekt w tym temacie)
- `StartGameParams` ma `difficulty:NOT_IMPLEMENTED` (playable.rs:163), a stan startu zawsze ustawia `"Normalny"` (playable.rs:134). Nie ma w PlayableState ścieżki Easy/Hard, którą producent mógłby odczytać.
- Dispatch wprost dopuszcza tę lukę i nakazuje jawny opis: KNOWN_GAPS[3] (turn_war_inputs.rs:99-106) oraz komentarz przy `load_religion_params(..., Difficulty::Normal)` (turn_war_inputs.rs:380). Zgodność Easy/Hard pozostaje NIE_ZMIERZONO.

### 5. Magazyny puste = cichy niedoliczek mocy do czasu Economy — ODRZUCAM (zgodnie z dispatchem)
- Dispatch kryterium (2) dopuszcza `Provided(0)` UDOKUMENTOWANE jako realny stan pusty. Udokumentowane w KNOWN_GAPS[3] i w komentarzach producentów. Test `empty_stores_are_a_real_empty_state_not_missing` pilnuje, że to jest `Provided(0)`, a nie `Missing`.
- Realny niedoliczek (magazyny nie rosną między turami) jest znaną luką do osobnego tematu Economy; nie jest to ukryty błąd w tym temacie.

### 6. `religion_unity_for_owner` zwraca 0.0 dla właściciela bez miast przed walidacją `players` — ODRZUCAM (korekta opisu)
- Zachowanie jest zgodne z webem: `countCitiesWithDominantStateReligion` (culture-religion.ts:1383, pin 07d2fbd72) zwraca 0 przy braku stanu religii i nie waliduje właściciela. Wczesny return (turn_war_inputs.rs ~:358-364) jest więc portem tej ścieżki.
- Sformułowanie „zgodne z poprzednim zachowaniem” w raporcie jest nieprecyzyjne: w bazie d11c995e6 nie było producenta religii (składnik był Missing). Poprawny opis: zgodność z webem countCitiesWithDominantStateReligion, nie z poprzednim kodem Rust. Kod bez zmian.

### 7. Pełny `cargo test --no-fail-fast` NIE_ZMIERZONO — PRZYJMUJĘ (jako otwarte)
Nie wykonane ani przez Operatora r4, ani w tej obronie (~390 binariów, Operator r4 przerwał po 109 binariach `ok`, 0 FAILED; linia `p6_8e_upkeep_p2` nie zbadana). Zostaje dla Final Control jako wymóg; nie zamykam tej pozycji.
