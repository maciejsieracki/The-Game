STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-L1-Q1 (zadanie 20: awanse INFANTRY 21/23), runda obrony po r2 (Operator, obrona)
GOAL: odpowiedz na zarzuty ewaluatora r2 (076399071) z dowodem; poprawki tylko tam, gdzie nie wymagaja decyzji właściciela.
BAZA: b7b4f2065 (r2; baza 33cd715cf). Kod obrony: 19fd7fd55 (commit lokalny, bez push).
ZMIANY/COMMIT: 19fd7fd55 — allowlista: rust-port/engine/tests/p6_1d_vectors/web-vectors.json (1 pole metadanych), rust-port/engine/tests/p6_unit_replace_l1.rs (komentarze/nagłówek, bez zmiany asercji). Cargo.lock nietknięty (nieśledzony, nie commitowany). gra/, origin/main, parity-v2 nietknięte.

ODPOWIEDZI NA ZARZUTY

1. [BLOKUJĄCY] Bramka p6_1d_civ_bonuses czerwona. PRZYJMUJĘ (fakt potwierdzony), NIE POPRAWIAM.
   Dowód: `cargo test --test p6_1d_civ_bonuses` = 12 ok / 2 FAILED (embedded_data_is_byte_identical_to_data_used_for_vectors :161, strip_diacritics_matches_web_function_cut_verbatim :219). Hash units.json po stronie Rust 5049afb95122976d, wektor 642eb20f6bd9e320 (pin 07d2fbd72); XOR stringów 660541fd96976da9 wobec b0dbfb9d862bf602 w Rust.
   Dlaczego nie poprawiam: rozbieżność 50 pól balansowych (poza zakresem wg dispatchu) wymaga decyzji właściciela (wariant A: wyrównać 50 pól units.json do pinu; wariant B: test hashuje dane Rust, co osłabia gwarancję). Hasha nie edytowałem ręcznie, pól balansu nie zmieniałem. Zadanie #27 w rejestrze.
   Pytanie ABC do właściciela (do zadania orkiestratorowi): A (rekomendowane) vs B, jak w 02b-operator-r2.md.

2. Nagłówek wektorów p6_1d z "pin":"edb8fb56". PRZYJMUJĘ, NAPRAWIONE w 19fd7fd55.
   Zmiana: "pin" -> "07d2fbd72", "generator" -> "gen-p61d-web-vectors.mjs (r2: regeneracja z pinu 07d2fbd72)". Hashe dataFnv.units i strip.dataStringXor przed i po zmianie identyczne (642eb20f6bd9e320 / 660541fd96976da9). Pola civs i civMatrix bez zmian.

3. Test infantry_promotion_targets_available_in_rust_logic słabszy niż dispatch. PRZYJMUJĘ CZĘŚCIOWO.
   - PRZYJMUJĘ opis: cele w wektorach to rozbite pole `Zastąp specjalnie` z pinu (p6_unit_replace_l1_gen.mjs: "cel = pole Zastąp specjalnie z pinu, rozbity na `/`"); generator nie wywołuje webowego availableReplacementsFor. Komentarze w teście i nagłówku poprawione (19fd7fd55).
   - ODRZUCAM żądanie równości zbiorów w jednym kontekście: brama nacji `unit_allowed_for_civ_nation` (rust-port/engine/src/domain/production_units.rs:2212) zależy od pola `Nacja` celu, więc jeden kontekst nie otwiera wszystkich celów naraz. Sprawdzenie zostaje per krawędź (`any` w kontekście z nacją danego celu, 53 krawędzie) plus kontrola nadmiarowych wyników (tylko ten sam `Typ`). Tyle da się zrobić bez zmiany zachowania bramki; dalsze wzmocnienie wymagałoby zmiany testu bramki poza zakresem.

4. rust_units_json_promotion_field_matches_pin sprawdza tylko Typ i Zastąp specjalnie. PRZYJMUJĘ jako uwagę informacyjną; bez zmian kodu. 50 rozbieżności pól poza zakresem = zadanie #27 (patrz pkt 1).

5. Zależność od W8 nie jest jawna. PRZYJMUJĘ, NAPRAWIONE w 19fd7fd55.
   Zweryfikowane: `available_replacements_for` jest zdefiniowana w rust-port/engine/src/domain/production_units.rs:2656; w src nie ma innego wołającego (grep po rust-port/engine/src). Wołają ją wyłącznie testy: p6_unit_replace_l1.rs i p6_8b_c2b_vectors.rs. Nagłówek p6_unit_replace_l1.rs ma teraz jawną sekcję "ZALEZNOSC OD W8": dane awansów nie wpływają na produkcję do czasu podpięcia w pętli tury (W8). Nie dodawałem komentarza do src (plik poza allowlistą).

6. Pełny cargo test --no-fail-fast nie odtworzony. ODRZUCAM jako zarzut otwarty: odtworzyłem sam (poniżej). NIE_ZMIERZONO już nie dotyczy.

BRAMKI (wykonane przez Operatora obrony, na 19fd7fd55; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo w scratchpadzie)
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: EXIT 0 (37 passed)
- cargo test --test p6_unit_replace_l1: EXIT 0 (3/3 ok)
- cargo test --test p6_1d_civ_bonuses: EXIT 101 (12 ok / 2 FAILED; te same dwa testy co w pkt 1)
- cargo test --no-fail-fast: EXIT 101; 372 binarek "test result: ok", jedyny failujący binarny p6_1d_civ_bonuses (2 FAILED), łącznie 2697 passed / 2 failed. Log: scratchpad full.log.
- Target dir w scratchpadzie usunięty po bramkach.

BLOKADY
- Bramka p6_1d_civ_bonuses czerwona do czasu decyzji właściciela A/B (zad. #27). Bez tej decyzji temat nie może przejść do FC/integracji.
- Zależność W8 (brak wołającego w src poza testami): udokumentowana, nie rozwiązana.

RUNDY: 2/5 (obrona po r2). Ostatni werdykt: BLOCK (Evaluator r2 FAIL). Decyzja wymagana: A/B dla pkt 1.
NASTĘPNY KROK: decyzja właściciela (ABC: A = wyrównać 50 pól units.json do pinu 07d2fbd72, rekomendowane; B = hashować dane Rust); po decyzji kolejna runda Operatora z tym samym ID.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny 19fd7fd55 i ten plik; brak push, brak integracji, brak zmian w parity-v2).
