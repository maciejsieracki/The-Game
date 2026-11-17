# R-RUSTPORT-P4-1Q6-2-BUILD-HIGHLIGHT-PARITY-R1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1Q6-2-BUILD-HIGHLIGHT-PARITY-R1
GOAL: przy aktywnym trybie budowy z PUSTYM zbiorem heksów producent nakładek (`build_highlight`, `unit_overlays_view`) zwraca to samo co web (pin `07d2fbd72`), bez zmiany pozostałych trybów.
ZMIANY/COMMIT: ocena kodu `4f520783c` (Operator r1); łańcuch `4f520783c` → `10f425915` (Evaluator) → `fe314483d` (Obrona); FC dodaje tylko ten plik.
TESTY: bramki odtworzone samodzielnie (tabela niżej), wszystkie EXIT 0; mutacje (a)(b)(c) dają FAIL.
BLOKADY: brak w zakresie tematu; 3 tematy następcze poza allowlistą (niżej).
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF/merge `4f520783c` na `rust-port/parity-v2` = `326fd5545`), wpis zamknięcia długu Q6-2 w `REJESTR-RUST.md`.
DEPLOY/PUSH: NIE WYKONANO

## Baza, allowlista, higiena commitu

- `git merge-base --is-ancestor 326fd5545 4f520783c` → prawda; jeden commit kodu nad bazą z dispatchu.
- `git diff --quiet 4f520783c fe314483d -- rust-port` → brak różnic (Evaluator i Obrona nie zmieniali kodu).
- `git diff --stat 326fd5545 fe314483d`: `overlays_view.rs` (+32/-7), `tests/p4_1q6_2_build_highlight.rs` (nowy), `tests/p4_1q6_2_gen.mjs` (nowy), `tests/p4_1q6_2_vectors/vectors.json` (nowy), 3 raporty w katalogu runs. Wszystko z allowlisty. Brak `Cargo.lock`, renderera, view-modelu.
- Wiadomość commitu `4f520783c` bez `Co-Authored-By` (#289). W teście brak `#[ignore]` i `should_panic`.

## Pin (czytany samodzielnie, `git show 07d2fbd72:gra/src/main.ts`)

- `refreshBuildHighlight` `:16351-16396`: `foundCityMode` → `setHighlight(qual)` (`:16360`), `activeWonderId` → `setHighlight(new Set(...))` (`:16366`), brak trybu (`!buildModeOpen || !activeImprovementKey || !buildApi`, `:16369`) → `clearHighlight()`, kopalnia → `clearHighlight()` + `refreshMineEligibleOverlay` (`:16386-16389`), ulepszenie → `setHighlight(hexes, IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)` (`:16392-16395`).
- `syncPlayerUnitSelectionOnMap` `:7115-7135`: zasięg ruchu to ta sama warstwa `setHighlight(reachable)` (`:7123-7125`).
- Wniosek: w każdej gałęzi aktywnego trybu budowy warstwa zasięgu jest zastępowana lub czyszczona niezależnie od liczby heksów. `build_highlight_mode_active` = zaprzeczenie warunku `:16369` plus gałęzie found/wonder (bez `buildApi`, którego Rust nie modeluje, jak w F6). `unit_overlays_view` zwraca pusty `reachable`, gdy tryb jest aktywny. Refaktor `build_highlight` (match z guardem) jest równoważny dwóm wcześniejszym `return no_layer()`, bo found/wonder wychodzą wcześniej.

## Bramki (worktree FC na `fe314483d`; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo, usunięty po bramkach)

| Bramka (engine) | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p4_1q6_2_build_highlight` | EXIT 0; 5 passed, 0 failed, 0 ignored |
| `cargo test --all-targets --no-fail-fast` | EXIT 0; 524 binarki, 3913 passed, 0 failed, 1 ignored |
| `node rust-port/engine/tests/p4_1q6_2_gen.mjs` | 12 wektorów, SHA-256 fragmentów `b2ccd939…899b`; po regeneracji `git status` czysty (vectors.json bajtowo identyczny) |
| Bramka renderera | nie uruchamiana (zakaz dispatchu) |

Uwaga do liczb: Evaluator podał 3907 passed, FC liczy 3913 (suma pól `passed` ze wszystkich linii `test result`). Obie liczby mają 0 failed; różnica wynika ze sposobu sumowania, nie zmienia werdyktu.

## Mutacje (własne, skrypt w scratchpadzie, plik przywrócony i sprawdzony `cmp` po każdej)

| Mutacja | Wynik |
|---|---|
| (a) `unit_overlays_view` nie wygasza `reachable` w aktywnym trybie budowy (`if false && ...`) | FAIL: `q6_2_pusty_zbior_budowy_wygasza_zasieg`, `q6_2_kopalnia_zachowuje_heksy_budowy`, `q6_2_wektory_pinu_warstwa_podswietlenia` |
| (b) kopalnia zwraca `no_layer()` (czyści podświetlenie budowy) | FAIL: `q6_2_kopalnia_zachowuje_heksy_budowy`, `q6_2_pusty_zbior_budowy_wygasza_zasieg`, `q6_2_wektory_pinu_warstwa_podswietlenia` |
| (c) zwykły tryb ruchu: `Vec::new()` zamiast `reachable_overlay(state)` | FAIL: `q6_2_tryb_ruchu_zachowuje_zasieg`, `q6_2_wektory_pinu_warstwa_podswietlenia` |

## Orzeczenia w sprawie zarzutów

1. **Evaluator uwaga 1 / Obrona p. 4: panel budowy otwarty bez klucza** (`buildModeOpen && !activeImprovementKey`): web woła `clearHighlight()`, producent zwraca `reachable_overlay`. **ODDAL.** `onOpenBuild` w pinie najpierw czyści zaznaczenie (`main.ts:26702-26703`), więc `reachable` jest pusty i wynik jest ten sam. Gdy gracz zaznaczy jednostkę przy otwartym panelu, `syncPlayerUnitSelectionOnMap` (`:7123-7125`) i tak ustawia zasięg jako ostatni, więc web też go pokazuje. Zakres dispatchu to tryby z kluczem. Kontrakt wołającego trafia do DTO-BRIDGE (#308/#364) jako temat następczy.
2. **Evaluator uwaga 2 / Obrona p. 5: `layer_of` w teście kopiuje regułę adaptera renderera.** **ODDAL.** Dispatch zabrania zmian w rendererze i bramki renderera. Kopia sprawdza wynik końcowy w engine. Test zgodności adaptera to osobny temat renderera.
3. **Evaluator uwaga 3 / Obrona p. 6: komentarz „KNOWN DIVERGENCE of Q6-2” w `rust-port/renderer/src/view/units.rs:34-45` jest po zmianie nieaktualny.** Potwierdzone odczytem pliku. **ODDAL** w tym temacie (plik poza allowlistą). Temat następczy (dokumentacja, bez cargo): przepisać komentarz i wpisać zamknięcie długu Q6-2 do `REJESTR-RUST.md`.
4. **Evaluator uwaga 4: brak wektora z jednostką bez ruchu w trybie budowy.** **ODDAL.** W obu gałęziach wynik jest pusty, więc wektor nie rozróżniłby mutacji.

Brak zarzutów NAPRAW. Brak spraw DO DECYZJI CZŁOWIEKA (wszystkie dotyczą techniki, decyduje orkiestrator; nie ma odstępstwa od webu).

## Tematy następcze dla orkiestratora
- DTO-BRIDGE (#308/#364): kontrakt „otwarcie panelu budowy czyści zaznaczenie jednostki”.
- Renderer: test zgodności adaptera (`unit_highlight`, `mine_eligible_group`) z regułą `layer_of`.
- Dokumentacja: komentarz `renderer/src/view/units.rs:34-45` i wpis w `REJESTR-RUST.md`.

## Werdykt

PASS-WITH-NOTES. Zmiana zgadza się z pinem, mieści się w allowliście, bramki odtworzone przez FC są zielone, a mutacje (a)(b)(c) dają FAIL. Uwagi dotyczą tematów poza allowlistą.
