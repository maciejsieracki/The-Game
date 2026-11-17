# 02a — Obrona Operatora, R-RUSTPORT-P4-1Q6-2-BUILD-HIGHLIGHT-PARITY-R1 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1Q6-2-BUILD-HIGHLIGHT-PARITY-R1
GOAL: producent nakładek (`overlays_view.rs`) zwraca to samo co web (pin `07d2fbd72`) we wszystkich trybach podświetlenia budowy, także przy pustym zbiorze heksów.
ZMIANY/COMMIT: wyłącznie ten plik (katalog runs). Kod bez zmian: commit Operatora `4f520783c`, raport Evaluatora `10f425915`.
TESTY: nie powtarzano; Evaluator odtworzył wszystkie bramki z EXIT 0 (fmt, clippy -D warnings, test tematu 5 passed, pełny engine 3907 passed / 0 failed), mutacje (a)(b)(c) i 2 dodatkowe dają FAIL. Sprawdzone ponownie tylko `git merge-base --is-ancestor 326fd5545 4f520783c` → EXIT 0, `git diff --stat 326fd5545 4f520783c` → 5 plików, wszystkie z allowlisty.
BLOKADY: brak w zakresie tematu. Trzy tematy następcze poza allowlistą (niżej).
RUNDY: 1/5
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

1. **Baza i allowlista** (`4f520783c` na `326fd5545`, 5 plików z allowlisty, brak `#[ignore]`/`should_panic`, żadna asercja nie zniknęła). Nie jest to zarzut, tylko potwierdzenie. **PRZYJMUJĘ** bez poprawki. Dowód: `merge-base --is-ancestor` EXIT 0; diff --stat: `01-operator-r1.md`, `overlays_view.rs` (+39/-7), `p4_1q6_2_build_highlight.rs`, `p4_1q6_2_gen.mjs`, `p4_1q6_2_vectors/vectors.json`.

2. **Bramki z EXIT 0, regeneracja vectors.json bajtowo identyczna.** Potwierdzenie. **PRZYJMUJĘ** bez poprawki.

3. **Mutacje (a)(b)(c) + usunięcie `wonder_active` i `found_city_mode` dają FAIL.** Potwierdzenie. **PRZYJMUJĘ** bez poprawki.

4. **UWAGA 1: panel budowy otwarty bez klucza → producent zwraca `reachable_overlay(state)`, a web `clearHighlight`.** Jako wada tego commitu **ODRZUCAM**. Dowód: w pinie `onOpenBuild` najpierw woła `clearPlayerUnitSelection()` (`main.ts:26702-26703`). Bez zaznaczonej jednostki `reachable` jest pusty, więc oba wyniki dają brak podświetlenia. Ten stan obsługuje ścieżka wołającego, nie producent. Zakres dispatchu (punkt 1) to tryby `foundCityMode`, `activeWonderId` i kopalni w `main.ts:16351-16395`. Przeniesienie kontraktu „otwarcie panelu budowy czyści zaznaczenie jednostki” należy do DTO-BRIDGE (#308/#364), który jest poza allowlistą. Proponuję go jako temat następczy, bez zmiany w tym temacie.

5. **UWAGA 2: `layer_of` w teście (`p4_1q6_2_build_highlight.rs:96`) kopiuje regułę adaptera renderera.** Jako wada **ODRZUCAM**. Dowód: dispatch zabrania zmian w rendererze i uruchamiania bramki renderera. Kopia w teście pozwala sprawdzić wynik końcowy (warstwa i krycie) na podstawie samego engine. Test zgodności adaptera z tą regułą trzeba zrobić po stronie renderera, jako osobny temat.

6. **UWAGA 3: komentarz `KNOWN DIVERGENCE of Q6-2` w `rust-port/renderer/src/view/units.rs:34-40` jest nieaktualny.** Fakt potwierdzam: komentarz opisuje rozbieżność, którą usuwa `4f520783c`. Poprawki w tym temacie **ODRZUCAM**, bo plik jest poza allowlistą (dispatch: „Zmiany w rendererze lub view-model: NIE”). Temat następczy (dokumentacyjny, bez `cargo`): usunąć albo przepisać ten komentarz i wpisać zamknięcie rozbieżności Q6-2 do `REJESTR-RUST.md` (decyzja orkiestratora).

## Tematy następcze dla orkiestratora
- DTO-BRIDGE: kontrakt `onOpenBuild` → wyczyszczenie zaznaczenia jednostki (UWAGA 1).
- Renderer: test zgodności adaptera z regułą `layer_of` (UWAGA 2).
- Dokumentacja: komentarz `units.rs:34-40` i wpis w REJESTR-RUST.md (UWAGA 3).
