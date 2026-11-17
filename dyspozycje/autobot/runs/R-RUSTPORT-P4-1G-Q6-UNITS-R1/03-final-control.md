# R-RUSTPORT-P4-1G-Q6-UNITS-R1 — Final Control (runda 1, po obronie)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME=nie (DTO → renderer; gameplay bez zmian)
TEMAT: R-RUSTPORT-P4-1G-Q6-UNITS-R1
GOAL: adapter jednostek/stosów, `reachable`, `path_route`, `build_highlight` (4 tryby) i `selection`
do renderera. Zakres wg DODATKU r2 (decyzja orkiestratora): wołający produkcyjny przeniesiony do
DTO-BRIDGE (#308/#364); ten temat kończy się na adapterze i testach.
ZMIANY/COMMIT: kod oceniany = `7932b4891` (obrona r1), raport obrony `0172c48e7`. Łańcuch:
baza r2 `2760b4f0c` → `92a91bcc3` (kod Operatora) → `dc4eb3423` (raport) → `7932b4891` (kod obrony)
→ `0172c48e7` (raport obrony) → ten raport FC (gałąź lokalna `rust-port-wip/P4-1G-Q6-UNITS-r1-fc`).
`git merge-base --is-ancestor 2760b4f0c 0172c48e7` = TAK. Pliki kodu względem bazy:
`rust-port/engine/src/domain/overlays_view.rs` (+304), `rust-port/renderer/src/view.rs` (+7/−1),
`rust-port/renderer/src/view/overlays.rs` (+8), `rust-port/renderer/src/view/units.rs` (nowy, 229),
`rust-port/renderer/tests/overlays_units_q6.rs` (nowy, 381) + raporty w katalogu runs.
TESTY: niżej (wszystkie uruchomione przez FC na `0172c48e7`).
BLOKADY: brak blokujących. Notatki do decyzji orkiestratora — sekcja „Decyzje”.
RUNDY: 1/5 (Operator r1 → Evaluator FAIL [INFRA+GOAL] → Obrona r1 → FC).
NASTĘPNY KROK: integracja orkiestratora (merge-tree względem aktualnego `origin/rust-port/parity-v2`,
wpisy do REJESTR-RUST wg sekcji „Decyzje”).
DEPLOY/PUSH: NIE WYKONANO.

## Bramki odtworzone przez FC (na `0172c48e7`, 2026-11-17)

Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR`
w scratchpadzie (poza repo), usunięty po bramkach. Dysk: 9,1 GB na starcie, **13 GB przed bramką
renderera**, 12 GB po buildzie testów; brak równoległych procesów cargo/rustc (sprawdzone `ps`).

Silnik (`rust-port/engine`):
- `cargo fmt --check`: EXIT 0.
- `cargo clippy --lib --tests -- -D warnings`: EXIT 0; `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --lib q6_`: 4 passed, 0 failed.
- `cargo test --all-targets --no-fail-fast`: pierwszy przebieg 273 zestawy / 2167 passed / 0 failed
  przerwany limitem 580 s w trakcie `p6_m07b4_q4`; pozostałe 248 binarek (w tym `p6_m07b4_q4` od nowa
  i bench `engine_modules` w trybie testu) uruchomione bezpośrednio z tego samego buildu:
  1725 passed, 0 failed, 1 ignored (`e2e::dump_tick1_econ_for_web_generator`, istniejący na bazie,
  nie z tego diffu). Łącznie 0 FAILED, 0 panicked.

Renderer (`rust-port/renderer`):
- `cargo fmt --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --all-targets --no-run`: EXIT 0; wszystkie 78 binarek testowych uruchomione:
  **672 passed, 0 failed, 0 ignored, 0 panicked** (pełna bramka renderera, ≥ 12 GB, bez równoległych buildów).
- `overlays_units_q6`: 6 passed (`q6_overlay_layers_carry_reachable_selection_and_route`,
  `q6_siege_map_panel_clears_reachable_only`, `q6_sync_units_matches_direct_sync`,
  `q6_empty_unit_fields_clear_the_previous_snapshot`, `q6_build_highlight_four_kinds`,
  `q6_apply_matches_pin_calls_on_the_unit_renderer`).

Mutacje (FC, renderer `src/view/units.rs`, przywrócone i sprawdzone `cmp`):
- (a) pominięcie `reachable` (`if true` zamiast warunku w `unit_highlight`): 3 FAILED.
- (b) `path_route` bez `turn_stops` (pusty wektor w `PathRouteOptions`): 2 FAILED.
- (c) błędny tryb (Improvement z kryciem `HIGHLIGHT_OPACITY`): 1 FAILED (`q6_build_highlight_four_kinds`).

Kontrole ręczne: `git diff --check 2760b4f0c 0172c48e7` czysty; brak `Cargo.lock` w diffie
(zmiana `renderer/Cargo.lock` po buildzie FC cofnięta); brak `#[ignore]`; trailery bez nazwy modelu;
`gra/`, `origin/main`, `rust-port/parity-v2` nietknięte.

## Orzeczenia zarzutów Evaluatora

1. [INFRA] bramki nieodtworzone — **ODDAL**. FC odtworzył wszystkie bramki z DODATKU r2 w obu
   crate'ach, w tym pełną bramkę renderera przy 13 GB i mutacje (a)(b)(c). Wszystko zielone.
2. [GOAL] brak wołającego w produkcji — **ODDAL** dla tego tematu. DODATEK r2 (decyzja orkiestratora)
   przeniósł wołającego produkcyjnego do DTO-BRIDGE (#308/#364). W rejestrze wpis: „adapter gotowy,
   wołany tylko z testów do #308”, NIE „ZINTEGROWANE” (por. #309).
3. [PARYTET] Q6-2 przy aktywnym trybie i pustych heksach — **DO DECYZJI (orkiestrator, techniczna)**.
   Rozbieżność potwierdzona przez FC na pinie `07d2fbd72` `gra/src/main.ts:16351-16395`
   (`setHighlight(qual)` z pustym zbiorem dla foundCity/wonder, `clearHighlight()` dla kopalni).
   Naprawa wymaga zmiany kształtu DTO (np. `Option<BuildHighlightDto>`), czego allowlista zabrania.
   Rozbieżność jest jawnie opisana w nagłówku `renderer/src/view/units.rs` (KNOWN DIVERGENCE).
   Wymagany wpis znanej rozbieżności w REJESTR-RUST i osobny temat zmiany kontraktu.
4. [KONTRAKT D-CMD-12] — **ODDAL** (naprawione w obronie). `UnitOverlaysInput.selection_ui` podaje
   wołający; `unit_overlays_view` nie czyta `state.selected_unit_id` dla `selection` (test
   `q6_selection_z_wejscia_ui_nie_ze_stanu`). Pozostały dług: `reachable_overlay` / `path_route_overlay`
   czytają `state.selected_unit_id`, więc most #308 musi podać tę samą wartość (udokumentowane w doc-komentarzu).
5. [TESTY] wektory ręczne, brak fixture JSON — **ODDAL** w części asercji (dodane asercje bezwzględne
   heksów i krycia w teście apply); **DO DECYZJI (orkiestrator)** w części spięcia engine↔renderer
   fixture'em (plik poza allowlistą / D-DTO-1) — proponowane jako kryterium #308.
6. [POKRYCIE] Mine przez agregator — **ODDAL** (naprawione: przypadek `kopalnia_miedzi` w
   `q6_tryby_budowy_przez_agregator`).
7. [ALLOWLISTA] — **ODDAL**. `rust-port/view-model/src/overlays_view.rs` nie istnieje w `2760b4f0c`
   (sprawdzone `git cat-file -e`); wskazane w dispatchu funkcje i linie (`path_route_overlay` ~:449)
   leżą w `rust-port/engine/src/domain/overlays_view.rs`. Zmiana addytywna, kształt DTO bez zmian.
   `renderer/src/view.rs` = wyłącznie `pub mod units;` + re-eksport + komentarz (wiring). Do odnotowania
   przez orkiestratora przy integracji.
8. [DROBNY] panel oblężenia poza `overlay_layers` — **ODDAL**; `with_siege_map_panel_open` przetestowany
   (`q6_siege_map_panel_clears_reachable_only`), dodanie pola do `MapUiState` łamałoby literał poza
   allowlistą. Kryterium akceptacji dla #308 (albo #324/#333).

Brak orzeczeń NAPRAW → PASS-WITH-NOTES.

## Decyzje (do wpisu orkiestratora w REJESTR-RUST)

- Q6 status: adapter gotowy i przetestowany, wołany tylko z testów do DTO-BRIDGE (#308/#364).
- Znana rozbieżność Q6-2 (aktywny tryb budowy + puste heksy → Rust pokazuje `reachable`, pin czyści);
  temat zmiany kontraktu `build_highlight` (np. `Option<BuildHighlightDto>`).
- Dług D-CMD-12: jedno źródło `selectedId` dla `selection` i `reachable`/`path_route` — do #308.
- Kryteria #308: fixture JSON spinający producent silnika z adapterem renderera; wywołanie
  `with_siege_map_panel_open` przez wołającego produkcyjnego.
- Akceptacja ścieżki producenta (`engine/src/domain/overlays_view.rs`) zamiast nieistniejącego pliku view-model.
