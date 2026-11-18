# R-RUSTPORT-P4-371-T5A-FRAME-RESELECT-ENGINE — Evaluator r1 (adwersarialny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-371-T5A-FRAME-RESELECT-ENGINE
GOAL: ramka `GetRenderFrame` przy otwartym panelu budowy / trybie podświetlenia przywraca `selection`,
`reachable`, `pathRoute` po `selectPlayerUnit` (web), addytywnie, domyślnie D-OP-3 bajt w bajt.
ZMIANY/COMMIT: oceniany commit Operatora `2fc8fa4c106277c33a33c8e6292405bcab890ac4`
(gałąź `rust-port-wip/p4-371-t5a-reselect-engine`), rodzic = baza
`origin/rust-port/parity-v2` = `47f8b2021c9736824f45054981d78660ad466594` (zgodnie z dispatchem;
`git merge-base` = baza). Evaluator dodaje wyłącznie ten raport (gałąź `eval/p4-371-t5a-reselect`).
TESTY: §2 (wszystkie bramki EXIT 0, pełny engine 4033/0/1, 536 binarek).
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Obrona Operatora (02a) → Final Control.
DEPLOY/PUSH: NIE WYKONANO.

## 1. Allowlista i zakazy

`git diff --name-status 47f8b2021 2fc8fa4c1`:
- `M rust-port/engine/src/domain/render_frame.rs` (allowlista)
- `A rust-port/engine/tests/p4_371_reselect.rs` (allowlista, wariant „nowy plik”)
- `A dyspozycje/autobot/runs/.../01-operator-r1.md` (raport)

Pliki spoza allowlisty: brak. `bridge.rs`, `renderer/`, `view-model/`, `client/`, `src-tauri/`, `gra/**`,
`Cargo.toml`/`Cargo.lock`, `REJESTR-RUST.md` nietknięte. `git diff --check` czysty. Brak nowych
`#[ignore]`/`should_panic` w diffie. Istniejące testy `p4_364_*` niezmienione (bajt w bajt — brak diffu).
Klient: literały `RenderUiParams { … }` w `client/tests/engine_bridge_renderer.rs:145`, `:360` mają
`..RenderUiParams::default()` / `..selected(..)`; `client/src` używa tylko `RenderUiParams::default()` →
build klienta/renderera niepotrzebny (zgodnie z dispatchem). Brak serializowanych wektorów JSON
`RenderUiParams` (jedyny `buildModeOpen` w `*.json` to `p4_1q6_2_vectors/vectors.json`, czytany jako
`BuildHighlightUi`, nie `RenderUiParams`). Commit bez Co-Authored-By z nazwą modelu (jest `Claude-Session:`).

## 2. Bramki odtworzone (w `rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie Evaluatora `t5aeval/target`, usunięty po bramkach)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p4_364_render_frame --test bridge_contract --test p4_364_dto_bridge --test p4_364_bridge_layers --test p4_371_reselect` | EXIT 0 (37 + 9 + 5 + 13 + 8 passed) |
| pełny `cargo test --all-targets --no-fail-fast` (w tle `setsid nohup`, `EXIT=` w logu) | `EXIT=0`; 536 × `test result: ok`; 4033 passed, 0 failed, 1 ignored (istniejący, spoza tematu) |

Liczby zgodne z raportem Operatora.

## 3. Web najpierw — weryfikacja cytatów pinu (`git show 07d2fbd72:gra/src/main.ts`)

| Teza Operatora | Tekst pinu | Ocena |
|---|---|---|
| `onOpenBuild` → `clearPlayerUnitSelection()` | `:26702-26703` | zgodne |
| `clearPlayerUnitSelectionStateOnly` zeruje `selectedId`, `reachable`, highlight, trasę, pierścień | `:7096-7105` | zgodne |
| `selectPlayerUnit` nie dotyka `buildModeOpen`/`foundCityMode`/`activeWonderId`/`activeImprovementKey`; `reachable = stackCanMove && !awaiting ? reachableWithMergeTargets : ∅` + `setHighlight`; `setSelectionHex` | `:7233-7268` (gałąź siege-panel `:7250-7252` poza zakresem, jak D-OP-4) | zgodne |
| `refreshBuildHighlight` nadpisuje jedyną warstwę `setHighlight` / warstwę kopalni, NIE czyści `selectedId` ani pierścienia | `:16351-16396` | zgodne |
| handler ruchu myszy: `buildModeOpen && (foundCityMode \|\| activeImprovementKey \|\| activeWonderId)` → `clearPathRoute` + `return` | `:32273-32278` | zgodne; `activeImprovementKey` pusty string = falsy, Rust `!k.is_empty()` zgodny |
| poza tym warunkiem podgląd trasy kursora (`refreshHoverPathPreview`) | `:32296-32340` | zgodne |

Decyzja D-OP-8 (flaga potrzebna, bo ramka bezstanowa nie zna kolejności) — uzasadniona pinem i zgodna z
D-371-5 (rozpoznanie Q1 §3/T5a). Odstępstwo od litery dispatchu („`path_route` jak D-OP-4”) — `None` przy
warunku `:32273` — jest bliższe webowi (zasada 11), przyjmuję.

## 4. Mutanty (skrypt Evaluatora, `cargo test --test p4_371_reselect --test p4_364_render_frame`, źródło przywrócone, `git status` czysty)

| Mutant | Zmiana | Wynik |
|---|---|---|
| a flaga ignorowana | `reselected = false` | ZABITY (4 testy p4_371) |
| b flaga zawsze true | `reselected = selected_unit_id.is_some()` | ZABITY (`p4_364_render_frame`: `c_tryb_budowy_czysci_zaznaczenie_zasieg_i_trase`, `r2_build_highlight_found_city_wg_can_found_city`) |
| c gubi `buildHighlight` | `dto.build_highlight.hexes = Vec::new()` po przywróceniu | ZABITY (2) |
| d `reachable` z innego id | `reachable_overlay(state)` zamiast `view_state` | ZABITY (4) |
| e `None` przy fladze true | `expect` na `selected_unit_id` | ZABITY (`flaga_true_bez_zaznaczenia`) |
| e2 bez `is_some()` | `reselected = flaga` | PRZEŻYŁ — równoważny (stan bez `selectedId` → puste nakładki; test e potwierdza JSON = D-OP-3) |
| g pusty klucz blokuje trasę | `.is_some()` zamiast `.is_some_and(!k.is_empty())` | PRZEŻYŁ (uwaga U1) |
| h blokada trasy bez `build_mode_open` | `(build_mode_open \|\| true)` | ZABITY |
| i zerowanie `reachable` w trybie podświetlenia (Q6-2) | `unit_overlays_view`-owe zerowanie | ZABITY (2) |
| j `selection` ze stanu, nie z UI | `state.selected_unit_id` | ZABITY (4) |
| k trasa ze stanu, nie z UI | `path_route_overlay(state, …)` | ZABITY (3) |
| l/m bez `wonder_active` / `found_city_mode` w blokadzie | `false` | ZABITE (1/1) |
| n/o trasa zawsze / nigdy | `if false` / `if true` | ZABITE (2/3) |
| p hover zignorowany | `path_route_overlay(view_state, None)` | ZABITY (3) |
| q `build_branch` tylko `build_mode_open` | bez `build_highlight_mode_active` | ZABITY (p4_364, 2) |

Mutanty (a)–(e) z kryteriów końca wykryte. Testy nie osłabiają asercji (porównania pełnego JSON ramki,
równości z ramką D-OP-4 i z ramką bez zaznaczenia).

## 5. Uwagi (nie blokują; do obrony / FC / długów)

- **U1 (pokrycie):** mutant g przeżywa — brak testu `build_mode_open + active_improvement_key = Some("")`
  przy fladze `true` (trasa powinna zostać, bo web `""` falsy). Zachowanie kodu jest poprawne, brakuje
  tylko asercji. Jednolinijkowy przypadek w `flaga_true_przywraca_we_wszystkich_trybach` by go zabił.
- **U2 (spójność z D-371-5 — do decyzji orkiestratora w `REJESTR-RUST.md`):** D-371-5 mówi, że flaga jest
  „zerowana przy każdym `refreshBuildHighlight()`”. W semantyce silnika z tego tematu `false` przy
  otwartym panelu = D-OP-3 (brak pierścienia), a w webie `refreshBuildHighlight` (`:16351-16396`) NIE
  czyści `selectedId` ani `setSelectionHex` — pierścień zostaje. Zerowanie flagi przy zmianie klucza
  dałoby więc rozjazd z webem. Operator w długu T5b słusznie proponuje zerowanie tylko przy zmianie
  trybu (`onOpenBuild`, `closeAllMapToolbarModes`, `exitBuildMode`), ale wtedy jeden `bool` nie mówi
  rendererowi, która warstwa (`reachable` vs `buildHighlight`) jest „ostatnim zapisem” — T5b potrzebuje
  osobnego stanu klienta (np. „ostatni pisarz warstwy podświetlenia”). Wpis D-371-5 należy doprecyzować
  przed dispatchem T5b.
- **U3 (dokumentacja poza allowlistą):** `overlays_view.rs` (`unit_overlays_view`, doc ok. `:505-515`)
  nadal twierdzi, że jest „JEDYNYM wołającym” `reachable_overlay`/`path_route_overlay`/`selection`; po tym
  temacie `render_frame.rs` woła je bezpośrednio. Dług dokumentacyjny (plik poza allowlistą).
- **U4 (krawędź pinu):** `selectPlayerUnit` woła `refreshPlannedMarchPreview` (`:7265-7267`) także przy
  wybranym kluczu; trasa planu znika dopiero przy ruchu myszy (`:32275`). Ramka przy blokadzie `:32273`
  zawsze daje `None` (także dla `hover = None` i jednostki z planem). Przybliżenie bezstanowe, nieistotne
  wizualnie; warto odnotować w długach.
- **U5 (wektory):** scenariusz jest modelowany ręcznie z cytowanych linii pinu, nie generowany przez
  wykonanie tekstu pinu (logika stanu UI `main.ts` nie jest samodzielnie wykonywalna). Dispatch tego nie
  wymaga; odnotowuję.
- **U6 (odziedziczone z D-OP-4, bez zmian):** brak `isMe` przy `selection` (web `selectPlayerUnit` odrzuca
  obce jednostki, `:7235`) i brak gałęzi panelu oblężenia (`:7250-7252`) — stan sprzed tematu.
- **U7 (raport):** `01-operator-r1.md` nie podaje SHA commitu wprost; SHA = `2fc8fa4c1`.

## 6. Długi (potwierdzone)

T5b (renderer + client: wybór warstwy, ustawianie/zerowanie flagi — z doprecyzowaniem U2), T3b (typ TS
`unitSelectedAfterBuildOpen?: boolean` w `src-tauri/frontend-v2/src/viewmodel/types.ts`), U3 (doc
`overlays_view.rs`), U4.
