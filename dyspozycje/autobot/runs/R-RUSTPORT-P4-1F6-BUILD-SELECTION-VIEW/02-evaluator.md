# R-RUSTPORT-P4-1F6-BUILD-SELECTION-VIEW — Evaluator (adwersarialny), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F6-BUILD-SELECTION-VIEW
GOAL: producent `overlays.buildHighlight` (4 tryby `refreshBuildHighlight`) i `overlays.selection` ze stanu UI oraz port `isHexInStartReveal` / `canFoundPlayerCityAt` w module `start_reveal.rs`.
OCENIANY COMMIT: `24f57d8100cc5c8bfc5ddf7022ebc7051dea1206` (gałąź `wip/R-RUSTPORT-P4-1F6-BUILD-SELECTION-VIEW`).
BAZA: `origin/rust-port/parity-v2` = `05b872fc5763256d1f607f3b73a47dd6f3244903`. `git merge-base --is-ancestor 05b872fc5 24f57d81` = prawda. Pin `07d2fbd72`.

## Bramki odtworzone przez Evaluatora
Operator zgłosił BLOCK, bo miał 6,2 GB wolnego i nie uruchomił kompilacji. U Evaluatora dysk wynosił 8,5 GB, czyli był powyżej progu 8 GB z kryterium 3, więc bramki uruchomiłem.
Ustawienia: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. `CARGO_TARGET_DIR` był w scratchpadzie, poza repo, i po bramkach go usunąłem. Wygenerowany `Cargo.lock` usunąłem i nie commitowałem.

| Bramka (`rust-port/engine`) | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --lib` | EXIT 0: 124 passed, 0 failed |
| `cargo test --test view_overlays_build --test start_reveal` | EXIT 0: 9 + 5 passed |
| `cargo test --all-targets --no-fail-fast` | EXIT 0: 496 wyników `ok`, 0 `FAILED`; łącznie 3667 passed, 0 failed, 1 ignored (ignorowany test istniał wcześniej i nie jest w nowych plikach) |
| `git diff --check 05b872fc5 HEAD` | czysto |

Uwaga: pierwszy przebieg pełnego testu w pierwszym planie przekroczył 585 s. Na tym etapie było 141 binarek `ok` i 0 błędów. Wolny jest znany test `pick_auto_improvements_matches_pinned_web_vectors`, który działa ponad 60 s. Drugi przebieg puściłem w tle i doszedł do końca z EXIT 0.

## Mutacje (wymagane przez dispatch; każda tymczasowa, potem pliki przywrócone i sprawdzone przez `cmp`)
- (a) kopalnia mapowana na `Improvement`: FAIL, padły `deposit_mine_maps_to_mine_layer` i `undo_in_turn_removes_hex_from_highlight` (EXIT 101).
- (b) `<` zamiast `<=` w `is_hex_in_start_reveal`: FAIL, padły `start_reveal_boundary_is_inclusive` i `can_found_player_city_at_composes_base_and_reveal` (EXIT 101).
- (c) cofnięcie w turze nie odejmuje heksu (wyłączony `filter_build_highlight_hexes`): FAIL, padł `undo_in_turn_removes_hex_from_highlight` (EXIT 101).

## Sprawdzenia statyczne względem pinu
- Allowlista: zmienione tylko `overlays_view.rs` (NOWY), `start_reveal.rs` (NOWY), `mod.rs` (2 wpisy `pub mod`), `tests/view_overlays_build.rs`, `tests/start_reveal.rs` i raport. Nic spoza listy. `renderer/` i `gra/` nietknięte, kształt DTO z P4-1F1 bez zmian.
- Brak `#[ignore]` i `should_panic` w nowych testach. Asercje są równościowe, na konkretnych listach heksów.
- Kolejność gałęzi zgodna z `main.ts:16351-16395`: założenie miasta, cud, brak trybu, kopalnia, ulepszenie. Warunek `!buildModeOpen || !activeImprovementKey || !buildApi` daje pustą warstwę.
- Deduplikacja jak `new Set(...)`, także dla kopalni: `refreshMineEligibleOverlay` w `main.ts:15558` robi `new Set(hexes.map(keyOf))`.
- Gałąź cudu nie filtruje cofnięć, tak jak pin (`:16363-16367`).
- `filter_build_highlight_hexes` używa klucza `"q,r:key"`. To ten sam format co `pendingImprovementId` (`game/pending-improvements.ts:16-18`) i `filterBuildHighlightHexes` (`render/buildHighlight.ts:22-28`).
- `hex_distance` jest zgodne z `units/setup.ts:361-366` (`max(|dq|,|dr|,|ds|)`, NaN propaguje). `is_hex_in_start_reveal`, `validate_first_player_city_placement` i `is_awaiting_first_player_city` są 1:1 z `first-player-city.ts`.
- `is_mine_improvement_key` to istniejąca funkcja Rust (`improvement_build.rs:619`). Nie powstała kopia listy.

## Zarzuty (ponumerowane)
1. **Brak wołającego w Rust i brak jawnie zapisanej zależności (wymóg „wołający albo jawna zależność”).** `overlays_view::build_highlight`, `overlays_view::selection` i `start_reveal::StartRevealContext` wywołują tylko testy. Nie ma składacza `OverlaysViewDto`, który wypełnia `BuildHighlightSources` ze stanu: `map_hexes`, `wonder_placement::list_qualifying_wonder_hexes_for_owner`, `improvement_build::…::get_qualifying_hexes`, `PendingImprovementsTurn::undo_key_set` (`improvements.rs:1252`) oraz `StartRevealContext` z `playerStartHexFor(ME())` i `startRevealRadius`. Raport Operatora wspomina tylko, że adapter P4-1G Q6 nie powinien filtrować drugi raz. Nie nazywa tematu, który podepnie producenta. Do zrobienia przed integracją: wpis zależności w raporcie lub w `REJESTR-RUST.md` (P4-1G Q6 #237 / PRIO-3D-2 albo osobny temat składacza nakładek).
2. **`foundingTerritoryOpts` poza portem (luka zgłoszona przez Operatora).** `can_found_player_city_at` dostaje wynik `canFoundCity` z domknięcia. Pełny parytet z `main.ts:12902-12943` wymaga, żeby wołający złożył `withinTerritory` (`foundingNodesForOwner`, `isHexInForeignFortTerritory`) oraz `ownerEra` i `cityLimitBase`. To zgodne z zakazem rozszerzania allowlisty, ale luka musi trafić do rejestru razem z zarzutem 1, inaczej zginie przy wiringu.
3. **Testy cofania i źródeł są jednostkowe, nie end-to-end na stanie.** `undo_in_turn_removes_hex_from_highlight` buduje zbiór kluczy ręcznie (`"3,0:farma"`), zamiast użyć `PendingImprovementsTurn::add` i `undo_key_set`. Źródła `qualifying_hexes` i `qualifying_wonder_hexes` to stałe domknięcia. Wartości wynikają poprawnie z kodu pinu i mutacje je łapią, ale zgodności formatu klucza z portowanym `pending_improvement_id` nic nie pilnuje. Zalecenie, bez blokowania: jeden test, który bierze klucze z `PendingImprovementsTurn`.
4. **`selection` nie sprawdza `isMe(u.ownerId)`.** `syncPlayerUnitSelectionOnMap` (`main.ts:7117`) pomija obcą jednostkę: `if (!u || !isMe(u.ownerId)) return;`. Producent Rust zwróci `SelectionDto` dla każdego `selected_unit_id`. W webie `selectedId` ustawia się dla jednostek gracza (`main.ts:7251`), więc w praktyce różnica jest mało prawdopodobna. Mimo to trzeba ją udokumentować jako odpowiedzialność wołającego albo dodać filtr przy wiringu.
5. **Kolejna kopia `hex_distance`.** `start_reveal::hex_distance` powiela istniejące implementacje webowego `hexDistance`, np. `turn_economy_territory.rs:167` i `pathfinding.rs:1037`. Działa poprawnie. To uwaga porządkowa, bez blokowania.
6. **Raport Operatora jest nieaktualny co do statusu.** Mówi BLOCK i „kod nie był kompilowany”. Bramki i mutacje są już zielone (tabela wyżej). Final Control powinien opierać się na tym raporcie, nie na statusie z `01-operator-r1.md`.

TESTY: jak w tabeli i w sekcji mutacji. Wszystkie EXIT zgodne z kryteriami 1–2.
BLOKADY: brak blokad kodu. Zarzuty 1–2 to zależności do zapisania w rejestrze przed integracją.
RUNDY: 1/5
NASTĘPNY KROK: Obrona / Final Control. Orkiestrator przy integracji zapisuje zależności z zarzutów 1–2 i rozwiązuje konflikt `overlays_view.rs` z 1F3, 1F4 i 1F5.
DEPLOY/PUSH: NIE WYKONANO
