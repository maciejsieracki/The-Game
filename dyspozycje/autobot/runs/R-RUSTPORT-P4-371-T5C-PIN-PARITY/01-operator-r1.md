# R-RUSTPORT-P4-371-T5C-PIN-PARITY — Operator r1

```text
STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-371-T5C-PIN-PARITY
GOAL: wyrównać do pinu 07d2fbd72 rozbieżności U-OP-1..4 warstwy zaznaczenia/zasięgu klienta i renderera (D-371-5c)
ZMIANY/COMMIT: kod e8834aa34 (rodzic 9d4384f8b, rodzic 48035d3a7 = origin/rust-port/parity-v2 = BAZA);
      raport w commicie nad nim (gałąź rust-port-wip/R-RUSTPORT-P4-371-T5C-PIN-PARITY).
      Pliki: rust-port/renderer/src/view/units.rs, rust-port/client/src/lib.rs,
      rust-port/renderer/tests/overlays_units_q6.rs, rust-port/renderer/tests/view_frame.rs,
      rust-port/client/tests/engine_bridge_renderer.rs (+ ten raport). frame.rs NIE ruszony.
TESTY: renderer fmt 0 / clippy --all-targets -D warnings 0 / test --all-targets 0 (720 passed, 0 failed, 0 ignored);
      klient fmt 0 / clippy --locked --all-targets -D warnings 0 / test --locked --all-targets 0 (engine_bridge_renderer 17/0/0, lib 0/0/0);
      mutanty 10/10 zabite (tabela §4)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, worktree, środowisko

- `git fetch origin && git checkout -B rust-port-wip/R-RUSTPORT-P4-371-T5C-PIN-PARITY origin/rust-port/parity-v2`;
  faktyczny SHA bazy = `48035d3a7cad2227c68b99dc719d10cee79ec85c` (zgodny z dispatchem).
- Worktree workflow (pełny checkout; nie sparse — worktree dostarczony przez harness).
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
  `CARGO_TARGET_DIR=<scratchpad>/t5crender/target` (poza repo, usunięty po bramkach i mutantach).
- Dysk: 13 GB na starcie (>= 12 GB), w trakcie 7,5–8,7 GB (równoległy build silnika T6 ADAPTER
  `wf_aa003b5d-05f-3`, nie renderera — limit 2 buildów zachowany; drugi build renderera nie działał).
- `renderer/Cargo.lock` (DŁUG-T1-LOCK): `cargo test` bez `--locked` uzupełnił lock lokalnie; cofnięty
  `git checkout -- rust-port/renderer/Cargo.lock` przed raportem, nie w commicie.

## 2. Web najpierw — odczyt pinu (`git show 07d2fbd72:gra/src/main.ts`)

| Miejsce pinu | Co robi | Wniosek |
|---|---|---|
| `selectPlayerUnit` `:7233-7266`, gałąź `:7253-7261` | panel oblężenia: `reachable = ∅; clearHighlight()`; inaczej `reachable = stackCanMove(u) && !isAwaitingFirstPlayerCity() ? reachableWithMergeTargets(u) : new Set(); unitRenderer.setHighlight(reachable)` | zapis zasięgu jest bezwarunkowy, także PUSTEGO → brak krążków, nigdy warstwa budowy pod spodem (U-OP-1) |
| `clearPlayerUnitSelection` `:7090-7093` → `clearPlayerUnitSelectionStateOnly` `:7096-7106` | `selectedId = null; reachable = ∅; unitRenderer.clearHighlight(); clearPathRoute(); clearSelectionHex()` | odznaczenie = `clearHighlight()` jako ostatni zapis warstwy (U-OP-4) |
| `syncPlayerUnitSelectionOnMap` `:7115-7135` | siege panel `:7120-7122` = `clearHighlight()` | bez zmian (Q6/T5b) |
| `refreshBuildHighlight` `:16351-16396` | foundCity `setHighlight(qual)` `:16360`; cud `setHighlight(...)` `:16366`; `!buildModeOpen \|\| !activeImprovementKey` → `clearHighlight()` `:16369-16372`; kopalnia `clearHighlight()` `:16386-16390`; ulepszenie `setHighlight(..., IMPROVEMENT_…)` `:16392-16395` | w trybie budowy nigdy nie zapisuje zasięgu; poza trybem budowy = `clearHighlight()` |
| `exitBuildMode` `:16526-16541` | guard `isAwaitingFirstPlayerCity()` `:16532`; `buildModeOpen = false; foundCityMode = false; activeImprovementKey = null; activeWonderId = null; clearBuildModeVisuals(); refreshBuildApi(); refreshBuildHighlight(); ...; popOverlay` | BRAK `clearPlayerUnitSelection()` → zaznaczenie zostaje; ostatni zapis = `clearHighlight()` (U-OP-3). Wołający: Escape (overlay `build-mode`, `:16544`), `buildMode.onExit` `:26742`, `onOpenBuild` przy otwartym panelu `:26705` |
| `onOpenBuild` `:26702-26721` | PIERWSZA linia `clearPlayerUnitSelection()` `:26703`, potem toggle | jedyne miejsce panelu budowy, które czyści zaznaczenie |
| `onSelectType` `:26733-26741` | `foundCityMode = false; activeWonderId = null; activeImprovementKey = key; refreshBuildHighlight()` | bez zmian (T5b U-EV-3) |
| `onSelectFoundCity` `:26758-26763` | `foundCityMode = true; activeImprovementKey = null; refreshBuildHighlight()` | NIE czyści zaznaczenia (U-OP-2) |
| `onSelectWonder` `:26766-26794` | `foundCityMode = false; activeImprovementKey = null; ...; refreshBuildHighlight()` | NIE czyści zaznaczenia (U-OP-2) |

## 3. Zmiany i decyzje techniczne (D-T5C-n)

- **D-T5C-1 (U-OP-1, renderer `units.rs`):** `unit_highlight` dla `HighlightPriority::Reachable` = tylko
  `reachable_call(...)` (pusty → `UnitHighlight::Clear`; panel oblężenia → `Clear`), usunięty fallback
  `.or_else(build)` z T5b. `Build` bez zmian (Q6-2: build, inaczej reachable).
- **D-T5C-2 (U-OP-3/U-OP-4, renderer `units.rs`):** nowy wariant `HighlightPriority::Cleared` = „ostatni zapis to
  `clearHighlight()`” (`:7100`, `:16371`) → zawsze `UnitHighlight::Clear`; pierścień (`setSelectionHex`) i trasa
  to osobne wywołania, nie zależą od warstwy. Domyślny wariant pozostaje `Build`. `frame.rs` bez zmian
  (przekazuje priorytet dalej).
- **D-T5C-3 (U-OP-4, klient `select_unit(None)`):** `selected_unit_id = None`, flaga `unit_selected_after_build_open
  = false` zawsze (brak zaznaczonej jednostki — także w trybie budowy; wcześniej flaga zostawała w trybie budowy),
  pisarz `Cleared`; tryb budowy i klucz bez zmian (pin ich nie dotyka). Zmiana `RenderUiParams` → jedno
  `GetRenderFrame`; sama zmiana pisarza → tylko rekompozycja (D-371-4).
- **D-T5C-4 (U-OP-2, klient `set_build_mode`):** czyszczenie zaznaczenia i zerowanie flagi WYŁĄCZNIE przy zmianie
  `build_mode_open` (`onOpenBuild` `:26703`); przełączenie found city / cudu zeruje klucz (bez zmian, `:26759`,
  `:26768`), ale zachowuje zaznaczenie i flagę; pisarz `Build` (po każdym handlerze `refreshBuildHighlight`).
  To doprecyzowuje D-371-5b („zerujemy flagę przy zmianie trybu budowy … `foundCityMode`, `wonder_active`”) na
  korzyść pinu zgodnie z D-371-5c.
- **D-T5C-5 (konsekwencja U-OP-2, klient `renderer_priority`):** skoro flaga zostaje przy found city / cudzie,
  ramka może nieść zasięg obok PUSTEJ warstwy budowy (np. brak heksów na miasto); pin w trybie budowy nigdy nie
  pokazuje zasięgu z `refreshBuildHighlight` (pusty `setHighlight` albo `clearHighlight()`). Publiczna funkcja
  `civ_client::renderer_priority(ui, frame)`: pisarz `Build` + `in_build_mode(frame_ui)` + puste
  `overlays.build_highlight.hexes` → renderer dostaje `Cleared`; w każdym innym przypadku pisarz bez zmian
  (Q6-2 poza trybem budowy zostaje, bo tam pin pokazuje zasięg z `selectPlayerUnit`/`syncPlayerUnitSelectionOnMap`).
  `ClientUiState::highlight_last_writer` przechowuje surowego pisarza; mapowanie tylko w `present_ref`.
- **D-T5C-6 (U-OP-3, klient nowa metoda `exit_build_mode`):** `build_mode_open = found_city_mode = wonder_active =
  false`, `active_improvement_key = None`, flaga `false` (tryb zamknięty), zaznaczenie zostaje, pisarz `Cleared`
  (pierścień bez krążków do następnego `select_unit`). Wywołanie poza trybem budowy (te same `RenderUiParams`)
  = tylko pisarz `Cleared`, bez silnika (pin: `refreshBuildHighlight` → `clearHighlight()`). Guard
  `isAwaitingFirstPlayerCity()` `:16532` to stan gry — odpowiedzialność wołającego (udokumentowane w doc-komentarzu);
  `set_build_mode(BuildMode::default())` pozostaje odpowiednikiem `onOpenBuild` przy otwartym panelu
  (czyszczenie zaznaczenia + exit).
- Zmiana asercji istniejących testów (uzasadnienie pinem, nie osłabienie):
  - `client/tests` `t5b_mode_switch_zeroes_the_flag_and_key_change_keeps_it` → `t5c_mode_switch_keeps_selection_and_flag_key_change_keeps_it`:
    dawne asercje „flaga wyzerowana / `selection == None` / `reachable` pusty / brak pierścienia” po found city i cudzie
    zastąpione odwrotnymi wg `:26758-26794` (flaga i zaznaczenie zostają, pierścień rysowany, widoczna warstwa = zbiór
    found city albo brak krążków, nigdy zasięg; ramka aktywnego fotela). Dodano asercję braku `GetRenderFrame` przy
    ponownym `select_unit` z tą samą flagą.
  - `renderer/tests/overlays_units_q6.rs` `t5b_reachable_writer_falls_back_to_build_when_range_is_empty` →
    `t5c_reachable_writer_with_empty_range_is_no_discs`: oczekiwanie `farm_set()` zamienione na `Clear` dla 4 rodzajów
    budowy i obu stanów panelu oblężenia (`:7256-7261`); część „brak obu warstw = Clear” rozszerzona o `Cleared`.
  - Pozostałe testy T5b/Q6/view_frame bez zmian i zielone.
- Gameplay: nie ruszany (tylko warstwa wizualna klienta/renderera, wg pinu). `engine/`, `view-model/`, `src-tauri/`,
  `gra/**`, `Cargo.toml`, `renderer/Cargo.lock`, `REJESTR-RUST.md` — nietknięte.

## 4. Testy scenariuszy (wektor = kroki webu → oczekiwana warstwa/zaznaczenie)

Klient e2e (prawdziwy most `engine/src/bridge.rs` + `CivEngineAdapter` → klient → renderer CPU):

| Test | Kroki webu | Oczekiwane |
|---|---|---|
| `t5c_u_op_1_unit_without_moves_in_build_mode_is_no_discs` | `SelectUnit` + `MoveUnit` aż do wyczerpania ruchu → `onOpenBuild` → `onSelectType(farma)` → `selectPlayerUnit` | ramka: selection + pusty reachable + warstwa farmy; widoczne: brak krążków, pierścień; pisarz Build → farma, Reachable → brak; 1 `GetRenderFrame` |
| `t5c_u_op_4_deselect_in_build_mode_clears_the_layer` | panel + klucz + `selectPlayerUnit` → `clearPlayerUnitSelection` | `selected=None`, flaga false, tryb i klucz zostają, pisarz Cleared, ramka z warstwą farmy, widoczne: brak krążków, brak pierścienia; `set_map_ui`/`set_siege_map_panel_open`/`on_state_changed` nie zmieniają pisarza; `refreshBuildHighlight` → farma; ponowne odznaczenie bez silnika; poza trybem budowy → nic |
| `t5c_u_op_3_exit_build_mode_keeps_the_selection` | panel + klucz + `selectPlayerUnit` → Escape (`exitBuildMode`) | `frame_ui == selected(WARRIOR)`, pisarz Cleared, ramka z zasięgiem, widoczne: pierścień bez krążków; Escape ponownie = brak `GetRenderFrame`; `selectPlayerUnit` = zasięg bez `GetRenderFrame`; przed sesją tylko zapis |
| `t5c_mode_switch_keeps_selection_and_flag_key_change_keeps_it` | panel + `selectPlayerUnit` → klucz/brak klucza → `onSelectFoundCity` → `selectPlayerUnit` → `onSelectWonder` | flaga i zaznaczenie zostają; warstwa = zbiór found city (albo brak), nigdy zasięg; pierścień rysowany |
| `t5c_build_writer_in_build_mode_never_shows_the_range` | panel + `selectPlayerUnit` → `onSelectType(farma)` → klucz `null` | ramka: zasięg + pusta warstwa budowy; widoczne: brak krążków (D-T5C-5); `renderer_priority` na stanach ręcznych |

Renderer (ręczne DTO): `t5c_reachable_writer_with_empty_range_is_no_discs`, `t5c_cleared_writer_is_no_discs_and_keeps_ring_and_route`,
`t5c_web_scenario_on_hand_dtos` (sekwencja: jednostka bez ruchu → refreshBuildHighlight → odznaczenie → wybór → Escape na
jednym `MapUnitRenderer`) w `overlays_units_q6.rs`; `t5c_empty_range_and_cleared_writer_on_the_frame` w `view_frame.rs`
(cała `FrameInputs` różni się od pisarza Build tylko wywołaniem warstwy; scena: brak krążków, pierścień zostaje).

## 5. Mutanty (skrypt `<scratchpad>/t5c/mut.py`, plik przywrócony po każdym, `git status` czysty)

| Mutant | Opis | Wynik | Zabójcy (realny FAILED, kompilacja OK) |
|---|---|---|---|
| a | `Reachable => reach().or_else(build)` (U-OP-1 przywrócone) | ZABITY | renderer: `t5c_reachable_writer_with_empty_range_is_no_discs`, `t5c_web_scenario_on_hand_dtos`; klient: `t5c_u_op_1_…` |
| b | flaga zerowana w `set_build_mode` dla found city / cudu | ZABITY | `t5c_mode_switch_keeps_selection_and_flag_…` |
| c | `exit_build_mode` czyści zaznaczenie | ZABITY | `t5c_u_op_3_exit_build_mode_keeps_the_selection` |
| d1 | `select_unit(None)` zostawia pisarza (warstwa nie czyszczona) | ZABITY | `t5c_u_op_4_deselect_in_build_mode_clears_the_layer` |
| d2 | renderer: `Cleared` traktowany jak Build | ZABITY | renderer: `t5c_cleared_writer_…`, `t5c_web_scenario_on_hand_dtos`; klient: `t5c_build_writer_…`, `t5c_u_op_3_…`, `t5c_u_op_4_…` |
| e1 | `exit_build_mode` zapisuje pisarza Build (niezgodnie z pinem) | ZABITY | `t5c_u_op_3_…` |
| e2 | `on_state_changed` resetuje pisarza (zmiana bez wywołania pinu) | ZABITY | `t5b_web_scenario_…`, `t5c_u_op_1_…`, `t5c_u_op_3_…`, `t5c_u_op_4_…` |
| f | zmiana samego pisarza woła `GetRenderFrame` (D-371-4) | ZABITY | `t5b_web_scenario_…`, `t5c_u_op_1_…`, `t5c_u_op_3_…`, `t5c_u_op_4_…`, `t5c_mode_switch_…` |
| g | brak D-T5C-5 (renderer dostaje surowego pisarza) | ZABITY | `t5c_build_writer_in_build_mode_never_shows_the_range` |
| h | `select_unit(None)` w trybie budowy zachowuje flagę (reguła T5b) | ZABITY | `t5c_u_op_4_…` |

Uwaga: przebieg mutantów renderera w krate `renderer` zatrzymał się na pierwszym binarnym teście z FAILED
(`overlays_units_q6`); `view_frame` nie był wtedy uruchomiony (domyślne `cargo test` bez `--no-fail-fast`).

## 6. Bramki (EXIT)

| Krate | Polecenie | EXIT |
|---|---|---|
| renderer | `cargo fmt --all -- --check` | 0 |
| renderer | `cargo clippy --all-targets -- -D warnings` | 0 |
| renderer | `cargo test --all-targets` | 0 — 720 passed / 0 failed / 0 ignored (było 717; +3 nowe testy netto: q6 +2 i 1 zastąpiony, view_frame +1) |
| client | `cargo fmt --all -- --check` | 0 |
| client | `cargo clippy --locked --all-targets -- -D warnings` | 0 |
| client | `cargo test --locked --all-targets` | 0 — `engine_bridge_renderer` 17/0/0 (było 13: +4 nowe, 1 przemianowany), lib 0/0/0 |

`git diff --check 48035d3a7 HEAD` czysty; brak `#[ignore]`; brak `git add -A`; brak trailera z nazwą modelu.

## 7. Długi

- DŁUG-T5C-CLEARED-PERSIST: pisarz `Cleared` (po Escape z zaznaczeniem) trwa przez `on_state_changed`; w pinie
  koniec tury (`syncPlayerUnitSelectionOnMap`, `:43792`) ponownie zapisuje zasięg. Klient nie rozróżnia rodzaju
  `StateChanged`; wołający (powłoka Tauri, T3) po końcu tury powinien wołać `select_unit(Some(id))` (bez silnika,
  tylko pisarz) — do kontraktu T3 TAURI-GLUE.
- DŁUG-T5C-REFRESH-SITES: inne wywołania `refreshBuildHighlight` w pinie (`:5374`, `:16416`, `:16585`, `:16687`,
  `:16820`, `:32497`) odpowiadają w kliencie `set_highlight_last_writer(Build)` po stronie wołającego — brak
  osobnych metod (poza zakresem).
- Nadal otwarte z T5b: DŁUG-371-T5B-PLAN-PREVIEW, DŁUG-D-OP-4-ISME-SIEGE, T3b typ TS `unitSelectedAfterBuildOpen`,
  DŁUG-T1-LOCK (`renderer/Cargo.lock` niekompletny dla `--locked`).
- Wpis D-T5C-1..6 do `REJESTR-RUST.md` — orkiestrator (poza allowlistą).
