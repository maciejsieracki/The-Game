STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-COMBAT-RESOLVE-PETLA-Q1
GOAL: odpowiedź Operatora (obrona) na zarzuty 1-5 z rundy 1; kod operatora 8dff35d79 bez zmian.
ZMIANY/COMMIT: tylko ten plik (02a-obrona.md). Kod combat.rs i p6_combat_melee.rs nietknięty. Baza obrony: 8dff35d79 (commit operatora). Cargo.lock nie commitowany.
TESTY: ponowne sprawdzenie w worktree obrony na 8dff35d79:
- p6_combat_melee: 5/5 PASS (melee_port_matches_all_vector_cases OK).
- cargo fmt --check: EXIT 0.
- Mutacja js_round (`if out == 0.0 && x.is_sign_negative()` -> `if false && ...`): p6_combat_melee nadal 5/5 PASS. Potwierdza zarzut 2. Mutacja cofnięta (git checkout), drzewo czyste.
- NIE_ZMIERZONO w tej rundzie obrony: pełny cargo test --no-fail-fast, clippy --all-targets -D warnings, cargo test --lib (wyniki podaje operator, nie powtarzane).
BLOKADY: poprawka zarzutu 2 wymaga testu js_round w combat.rs poza funkcją zwarcia, czyli poza allowlistą tej rundy. Nie wykonuję jej bez decyzji orkiestratora.
RUNDY: 1/5 (obrona w ramach rundy 1)
NASTĘPNY KROK: Evaluator (z uwzględnieniem poniższych odpowiedzi); decyzja orkiestratora co do osobnego tematu na test js_round.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1: liczba kroków w dispatchu (1880 vs 1716) — PRZYJMUJĘ (korekta dokumentu, kod bez zmian)
Dowód: `rust-port/engine/tests/p6_combat_melee_vectors/vectors.json`, `counts`: steps 1716, stepsCharge 444, stepsMelee 1272 (444+1272=1716). Pole `cases` = 500. Test strukturalny `melee_vectors_counts_agree_with_cases_and_are_nonempty` sprawdza zgodność liczników z tablicami kroków. Błąd jest w liczbie wpisanej do dispatchu. Operator porównał wszystkie 1716 kroków, co jest poprawne.

### Zarzut 2: gałąź -0 w js_round nie jest pokryta behawioralnie — PRZYJMUJĘ
Dowód: mutacja `if false && out == 0.0 && x.is_sign_negative()` daje p6_combat_melee 5/5 PASS, więc wektory nie rozróżniają tej gałęzi. Uwaga techniczna: `expected.steps[].damage` zawiera 36 wartości `-0`, ale są to przypadki x = -0.0. Dla takiego x `floor(-0.0) = -0.0` i funkcja zwraca -0.0 także bez tej gałęzi. Gałąź jest potrzebna tylko dla x w [-0.5, 0), a żaden wektor takiego x nie daje. Implementacja jest zgodna z JS Math.round, ale to nie jest potwierdzone wektorami.
Poprawka: test jednostkowy js_round (x = -0.3, -0.5, -0.0, 0.5, -0.5000001, NaN, Inf) w combat.rs. Wymaga zmiany poza funkcją zwarcia, więc poza allowlistą tej rundy. Nie commituję. Proponuję osobny temat albo rozszerzenie allowlisty przez orkiestratora.

### Zarzut 3: melee_phase nie jest wołane z combat::resolve — ODRZUCAM jako defekt
Dowód: w combat.rs jedyna definicja `resolve_melee_phase` jest w linii ~1384, brak wywołania w `resolve` ani `resolve_combat`. Zgodnie z dispatchem wejścia fazy są wstrzykiwane (#135) i podpięcie jest poza zakresem tematu (GOAL a-c, NIE ROBIĆ). Operator zapisał to w BLOKADACH. Nie wymaga zmiany.

### Zarzut 4: odtworzone bramki — potwierdzam częściowo
Potwierdzam fmt (EXIT 0) i p6_combat_melee (5/5). Pozostałe bramki (pełny cargo test, clippy, cargo test --lib) nie były powtarzane w obronie: NIE_ZMIERZONO.

### Zarzut 5: własne mutacje operatora — INFORMACYJNE
Operator podał 6 z 7 mutacji jako FAIL. Potwierdzono siódmą (js_round), zgodnie z zarzutem 2. Pozostałych sześciu nie powtarzano.
