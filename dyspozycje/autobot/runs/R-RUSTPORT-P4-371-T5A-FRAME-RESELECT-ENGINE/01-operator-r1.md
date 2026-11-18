# R-RUSTPORT-P4-371-T5A-FRAME-RESELECT-ENGINE — Operator r1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-371-T5A-FRAME-RESELECT-ENGINE
GOAL: ramka `GetRenderFrame` przy otwartym panelu budowy / trybie podswietlenia przywraca `selection`,
`reachable`, `pathRoute` po ponownym zaznaczeniu jednostki (web `selectPlayerUnit` po `onOpenBuild`),
addytywnie, domyslnie bez zmiany zachowania (D-OP-3 bajt w bajt).
ZMIANY/COMMIT: gałąź `rust-port-wip/p4-371-t5a-reselect-engine`, baza `origin/rust-port/parity-v2` =
`47f8b2021c9736824f45054981d78660ad466594`; SHA commitu Operatora: w wiadomości commita / raporcie
orkiestratora (`git log -1 rust-port-wip/p4-371-t5a-reselect-engine`), plik raportu w tym samym commicie.
Pliki (allowlista): `rust-port/engine/src/domain/render_frame.rs` (M),
`rust-port/engine/tests/p4_371_reselect.rs` (A), ten raport (A). Bez zmian w `bridge.rs`, `renderer/`,
`view-model/`, `client/`, `src-tauri/`, `gra/**`, `Cargo.toml`/`Cargo.lock`, `REJESTR-RUST.md`.
TESTY: patrz §4 (fmt 0, clippy 0, bramki nazwane 0, pełny `cargo test --all-targets --no-fail-fast`
EXIT=0: 536 binarek, 4033 passed, 0 failed, 1 ignored — istniejący, nie z tego tematu).
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO.

## 1. Web najpierw (pin `07d2fbd72`, `gra/src/main.ts`)

| Miejsce | Linie | Co robi |
|---|---|---|
| `onOpenBuild` | `:26702-26703` | `clearPlayerUnitSelection()` przed otwarciem/zamknięciem panelu |
| `clearPlayerUnitSelection` / `...StateOnly` | `:7090-7106` | `selectedId = null`, `reachable = ∅`, `clearHighlight`, `clearPathRoute`, `clearSelectionHex` |
| `selectPlayerUnit` | `:7233-7268` | NIE dotyka `buildModeOpen`/`foundCityMode`/`activeWonderId`/`activeImprovementKey`; `selectedId = u.id`, `reachable = reachableWithMergeTargets(u)` + `setHighlight(reachable)` (`:7250-7257`), `setSelectionHex` (`:7258`), `clearPathRoute` (`:7246`) |
| `refreshBuildHighlight` | `:16351-16396` | przy zmianie trybu/klucza nadpisuje jedyną warstwę `setHighlight` (albo warstwę kopalni) |
| handler ruchu myszy | `:32273-32278` | `if (buildModeOpen && (foundCityMode \|\| activeImprovementKey \|\| activeWonderId))` → `handleBuildModeHover`, `clearPathRoute`, `return` — podgląd trasy NIE jest rysowany |
| `refreshHoverPathPreview` | `:31181`, wołane `:32340` | podgląd trasy kursora (poza powyższym warunkiem) |

Wniosek: kolejność ma znaczenie („ostatni zapis wygrywa” na `setHighlight`), a ramka jest bezstanowa —
sama kolejność pól `RenderUiParams` nie odróżni „otwarto panel przy zaznaczonej jednostce” (web: zaznaczenie
wyczyszczone) od „zaznaczono jednostkę przy otwartym panelu” (web: zaznaczenie widoczne). Flaga jest więc
potrzebna (wariant z dispatchu), nie zbędna.

## 2. Decyzja operatora D-OP-8 (wpisana w nagłówek modułu `render_frame.rs`)

- Nowe pole `RenderUiParams::unit_selected_after_build_open: bool` (`#[serde(default)]` z atrybutu
  struktury, JSON `unitSelectedAfterBuildOpen`, domyślnie `false`; `deny_unknown_fields` bez zmian).
- Gałąź trybu budowy (`build_mode_open || build_highlight_mode_active`):
  - flaga `false` albo `selected_unit_id = None` → dotychczasowy wczesny `return` D-OP-3 (bajt w bajt);
  - flaga `true` i `selected_unit_id = Some` → `buildHighlight` liczone jak dotąd (bez zmian), oraz
    `reachable = reachable_overlay(stan z selectedId z UI)` (bez zerowania z Q6-2, bo web po
    `selectPlayerUnit` trzyma `reachable` niezależnie od trybu), `selection` z `selected_unit_id` (D-OP-4),
    `pathRoute = path_route_overlay(…, hover)` z wyjątkiem warunku pinu `:32273`
    (`buildModeOpen && (foundCityMode || activeImprovementKey niepusty || activeWonderId)`) → `None`.
- Poza trybem budowy flaga nie ma wpływu (test `flaga_true_przywraca_we_wszystkich_trybach`, porównanie JSON).
- Odstępstwo od litery dispatchu („przywraca `path_route` jak D-OP-4”): przy wybranym kluczu/trybie trasa
  jest `None`, bo pin jej nie rysuje (`:32273-32278`). Zasada 11 — wariant najbliższy webu.
- Która warstwa podświetlenia (`reachable` vs `buildHighlight`) jest widoczna, wybiera klient (dług T5b);
  silnik podaje obie.

## 3. Kryteria końca

| Kryterium | Dowód |
|---|---|
| Wektor scenariusza webu (`onOpenBuild` → `selectPlayerUnit` → zmiana klucza → `selection` + `buildHighlight`) | `scenariusz_webu_open_build_select_klucz`: krok 1 pusto; krok 2 `selection`/`reachable`/`pathRoute` = ramka D-OP-4; krok 3 (`farma`) `buildHighlight` = ramka bez zaznaczenia (niepuste), `selection` zostaje, `pathRoute` None; kopalnia: `Mine` + `selection`; pozostałe pola ramki identyczne (JSON) |
| Domyślne `false` bajt w bajt | `p4_364_render_frame` 37/37, `p4_364_bridge_layers` 13/13, `p4_364_dto_bridge` 5/5, `bridge_contract` 9/9 bez zmian; `flaga_false_zachowuje_d_op_3` (4 tryby, JSON = ramka bez zaznaczenia) |
| Mutanty (a)–(e) wykryte | §5 |
| JSON: pole opcjonalne, `deny_unknown_fields`, round-trip | `json_pola_flagi` (brak pola → false; camelCase; snake_case i nieznane pole odrzucone; round-trip), `most_get_render_frame_z_flaga` (komenda mostu z JSON) |

## 4. Bramki (w `rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie `t5areselect/target`)

- `cargo fmt --check` → EXIT 0
- `cargo clippy --all-targets -- -D warnings` → EXIT 0
- `cargo test --test p4_364_render_frame --test bridge_contract --test p4_364_dto_bridge --test p4_364_bridge_layers --test p4_371_reselect` → EXIT 0 (37 + 9 + 5 + 13 + 8 passed)
- pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, `EXIT=` w logu) → `EXIT=0`, 536 × `test result: ok`, 4033 passed, 0 failed, 1 ignored (istniejący `#[ignore]` poza tematem; ten temat nie dodaje `#[ignore]`).
- Uwaga: `--locked` w `engine` nie działa, bo `rust-port/engine/Cargo.lock` nie jest śledzony (wykluczony w `.git/info/exclude`); bramki bez `--locked`, lock wygenerowany lokalnie i nieskommitowany.
- Klient (`rust-port/client`): nie zmieniany i nie budowany — wszystkie literały `RenderUiParams { … }` w `client/tests/engine_bridge_renderer.rs` (`:145`, `:360`) i w `engine/tests` mają `..RenderUiParams::default()`/`..selected(..)`; `client/src` nie tworzy literału (tylko `RenderUiParams::default()`). Brak serializowanych wektorów JSON `RenderUiParams` w repo (grep `buildModeOpen` w `*.json/*.rs/*.ts/*.mjs`). Bramka renderera niepotrzebna.

## 5. Mutanty (skrypt w scratchpadzie, `cargo test --test p4_371_reselect`, oryginał przywrócony)

| Mutant | Zmiana | Wynik |
|---|---|---|
| a flaga ignorowana | `reselected = false` (zawsze wczesny return) | FAIL 4/8 (scenariusz, wszystkie tryby, zasięg, most) |
| b flaga zawsze true | `reselected = selected_unit_id.is_some()` | FAIL 2/8 (`flaga_false_zachowuje_d_op_3`, most) |
| c gubi `buildHighlight` | `dto.build_highlight.hexes = Vec::new()` po przywróceniu | FAIL 2/8 |
| d `reachable` z innego id | `reachable_overlay(state)` zamiast stanu z `selectedId` z UI | FAIL 4/8 |
| e `None` przy fladze true | `expect` na `selected_unit_id` (panika) | FAIL 1/8 (`flaga_true_bez_zaznaczenia`) |
| f (dodatkowy) trasa nieblokowana | ignoruje warunek `:32273` | FAIL 2/8 |

Mutant „flaga true bez `is_some()`” jest równoważny (stan bez `selectedId` daje puste nakładki) — test (e)
potwierdza brak paniki i ramkę = D-OP-3 (JSON).

## 6. Długi

- **T5b (renderer + client):** wybór widocznej warstwy podświetlenia z flagi i kolejności („ostatni zapis
  wygrywa”: po `selectPlayerUnit` widoczny `reachable`, po zmianie klucza `buildHighlight`; warstwa kopalni
  nie jest czyszczona przez `setHighlight`), ustawianie `unit_selected_after_build_open = true` przy
  `select_unit` w trybie budowy i zerowanie przy każdej zmianie trybu budowy (`onOpenBuild`,
  `closeAllMapToolbarModes`, `exitBuildMode`).
- **T3b:** typy TS `RenderUiParams` (`src-tauri/frontend-v2/src/viewmodel/types.ts`) — dodać
  `unitSelectedAfterBuildOpen?: boolean`.
- Bez zmian (poza tematem): `plannedMarches` → `refreshPlannedMarchPreview` (`:7265-7267`) nie jest
  odwzorowane w `path_route_overlay` (stan D-OP-4 sprzed tematu).
