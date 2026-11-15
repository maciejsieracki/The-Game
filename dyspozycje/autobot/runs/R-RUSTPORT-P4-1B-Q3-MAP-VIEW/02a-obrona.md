# R-RUSTPORT-P4-1B-Q3-MAP-VIEW — 02a Obrona Operatora (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1B-Q3-MAP-VIEW
GOAL: `MapViewDto` + `HexDynDto` z `SnapshotMap`, bajt w bajt z pinem `07d2fbd72`; walidacja `riverRenderPaths.len() == rivers.len()`.
ZMIANY/COMMIT: `b82c98983` (test, gałąź `obrona/q3-map-view`, rodzic `81befe806` → kod `6b1b5c8ed`); raport w commicie nad nim. Jedyny zmieniony plik kodu: `rust-port/engine/tests/p4_1b_map_view.rs` (allowlista). `Cargo.lock` nie commitowany.
TESTY: patrz §Bramki.
BLOKADY: brak.
RUNDY: 1/5 (obrona po Evaluatorze `c187edb44`, PASS-WITH-NOTES).
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO.

## Odpowiedzi na zarzuty

### 0. Podsumowanie Evaluatora (bramki zielone, 8/8 + 4 mutacje)
Nie jest zarzutem. Potwierdzam, a bramki odtworzyłem ponownie na `b82c98983` (§Bramki).

### 1. Z-Q3-2: `Result<_, MapViewError>` zamiast gołego DTO
**PRZYJMUJĘ jako adnotację integracyjną. Kod bez zmian.** Evaluator uznaje uzasadnienie techniczne za poprawne. Pola tekstowe `SnapshotMap` spoza enumów weba nie mają reprezentacji w typowanym DTO. Ciche zero albo `unwrap` łamałyby parytet. Dowód: test `bledy_wartosci_bez_reprezentacji_w_dto`. Zapis decyzji w `REJESTR-RUST.md` należy do orkiestratora przy integracji, bo ten plik jest poza allowlistą Operatora. Proponowany wpis: „P4-1B-Q3 Z-Q3-2: producent zwraca `Result<_, MapViewError>`; P4-1G (#216) obsługuje błąd jawnie (bez `unwrap`)”.

### 2. Brak nowego wariantu błędu (użyty `ViewError::LengthMismatch`)
**ODRZUCAM.** Dowód:
- Dispatch w §ZAKRES mówi „tylko nowa reguła + wariant błędu”. To granica zakresu zmian w `validate.rs`, a nie nakaz duplikowania typu. Allowlista mówi „reguła długości i wariantu błędu”. Ten zapis jest spełniony, bo komentarz wariantu `LengthMismatch` rozszerzono o `map.rivers.len()` dla `map.riverRenderPaths` (diff `validate.rs` +15/-2).
- `LengthMismatch { field, expected, actual }` jest w kontrakcie (§3.2) wariantem dla wszystkich kolekcji równoległych. Osobny wariant miałby identyczny kształt i semantykę. Wołający rozróżnia przypadek po `field == "map.riverRenderPaths"`.
- Test `river_render_paths_parallel_to_rivers` (`view-model/tests/validate.rs`) sprawdza dokładny wariant, pole, `expected` i `actual` w 3 przypadkach (−1, +1, 0 rzek) oraz tekst `Display`. Mutacja M8 (usunięcie reguły) jest wykrywana (`mutation-evidence-r1.txt`).
Ostateczna akceptacja tego odczytania należy do FC.

### 3. Testy `mutacja_*` nie mutują producenta
**ODRZUCAM (częściowo: zgadzam się z faktem, nie z wnioskiem, że to luka).** Dowód:
- Czułość producenta zapewniają testy bajt w bajt (`map_view_bajt_w_bajt_z_pinem`, `hex_dyn_bajt_w_bajt_z_pinem`) oraz `przetasowane_hexes_daja_identyczny_dto`. Te testy SĄ bramką cargo, co Evaluator sam potwierdza („regresje łapią jednak testy bajt w bajt”).
- Mutacje źródła odtworzyłem skryptem `mutate-r1.py` na `b82c98983`: **7/7 WYKRYTA**, każda z EXIT 101 i co najmniej jednym czerwonym testem bajt w bajt. Wynik jest w `mutation-evidence-obrona.txt`. M8 dla view-model pochodzi z r1 (`mutation-evidence-r1.txt`).
- Mutowanie źródła z poziomu testu cargo wymagałoby zmiany `map_view.rs` pod `cfg(test)`, czyli kodu produkcyjnego dla testu. Testy `mutacja_*` dowodzą czegoś innego: że wektory pinu rozróżniają warianty, więc mutant NIE mógłby przejść bajt w bajt.

### 4. `mutacja_bez_sortowania_daje_fail` sprawdza tylko `HexOrder`
**PRZYJMUJĘ.** Poprawka w commicie `b82c98983`:
- Mutant to teraz pełne heksy DTO w kolejności wejścia `hexes`, a nie sama podmiana `coord`.
- Dodano asercję (a): `assert_ne!(ser(&mutant), ser(&c.expected_view))`, czyli rozjazd bajt w bajt z wektorami pinu. Asercja (b), czyli `validate_map` → `HexOrder`, pozostaje.
- Próg `diverged >= 3` bez zmian. Dowód: `cargo test --test p4_1b_map_view` = 12 passed, EXIT 0.

### 5. Node ≥ 22.18 i `ExperimentalWarning`
**PRZYJMUJĘ jako adnotację, bez zmian.** Wymóg jest zapisany w nagłówku `gen.mjs` (linia z „WYMAGANY Node >= 22.18.0”). Ostrzeżenie dotyczy API `stripTypeScriptTypes` i nie wpływa na wynik. Dowód: `node gen.mjs --check` na v22.23.4 → `OK: vectors.json zgodny (6 map)`, EXIT 0.

### 6. Jednorazowy EXIT 101 `cargo test --lib` po clippy
**ODRZUCAM jako defekt kodu (nie odtworzono).** Sekwencję clippy → `cargo test --lib` we wspólnym `CARGO_TARGET_DIR` uruchomiłem dwukrotnie: na `b82c98983` oraz na próbnym merge z parity. Oba przebiegi dały EXIT 0 i 121 passed. Testy `--lib` nie dotykają nowego modułu w sposób zależny od stanu (czyste funkcje, brak I/O). Przyczyna pojedynczego zdarzenia u Evaluatora: NIE_ZMIERZONO. Najpewniej było to zjawisko środowiskowe we współdzielonym target dir równoległych worktree.

### 7. Pełny `cargo test` silnika i merge z parity `400fd0bd1`
**PRZYJMUJĘ częściowo i wykonałem pomiar w zakresie możliwym bez linkowania 777 binarek testowych.**
- `git merge-tree --write-tree origin/rust-port/parity-v2 (400fd0bd1) b82c98983` → drzewo `c5f13e9e5`, **bez konfliktów**. Próbny commit merge `5349de3ac` (lokalny, nie wypchnięty, porzucony).
- Na `5349de3ac`: `cargo fmt --check` dla engine i view-model EXIT 0. `cargo clippy --all-targets -D warnings` dla engine (sprawdza WSZYSTKIE cele testowe) i view-model EXIT 0. `cargo test --lib` = 121 passed. `p4_1b_map_view` = 12, `p4_1b_river_trim` = 4, `p4_1b_road_mask` = 8, `p4_1j_general_target_vectors` = 5, `p4_1j_planned_march_bounds` = 1, `p4_1j_planned_march_pin_vectors` = 4, `p4_1j_planned_march_state` = 9, wszystkie passed. `cargo test -p civ-view-model`: EXIT 0, 8 wyników „ok”.
- Pełny `cargo test` silnika (777 plików testowych): NIE_ZMIERZONO. Zostaje dla integratora, który powinien wykonać merge (nie podmianę drzewa) i pełny test.

### 8. NIE_ZMIERZONO: wołający w rendererze (P4-1G), `placedImprovements`, zmiana terenu w trakcie gry
**PRZYJMUJĘ bez zmian.** To jawne granice zakresu z kryterium 4 dispatchu, zapisane w `01-operator-r1.md`. Wołający należy do P4-1G (#216). Tarasy z `placedImprovements` i playtest zmiany terenu wymagają stanu gry spoza `SnapshotMap`.

## Bramki (na `b82c98983`, `CARGO_TARGET_DIR` poza repo, usunięty po bramkach)
- `cargo fmt --check` (engine): EXIT 0.
- `cargo clippy --all-targets -- -D warnings` (engine): EXIT 0.
- `cargo test --lib` (engine): 121 passed, EXIT 0.
- `cargo test --test p4_1b_map_view`: 12 passed, EXIT 0.
- view-model (fmt, clippy, test): EXIT 0, wynik na próbnym merge z parity, zawierającym ten sam `validate.rs`.
- `node rust-port/engine/tests/p4_1b_map_view_vectors/gen.mjs --check`: OK (6 map), EXIT 0.
- Mutacje źródła M1–M7: 7/7 WYKRYTA (`mutation-evidence-obrona.txt`).
