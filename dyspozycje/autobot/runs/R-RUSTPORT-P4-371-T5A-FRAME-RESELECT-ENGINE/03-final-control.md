# R-RUSTPORT-P4-371-T5A-FRAME-RESELECT-ENGINE — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-371-T5A-FRAME-RESELECT-ENGINE
GOAL: ramka `GetRenderFrame` przy otwartym panelu budowy / trybie podświetlenia przywraca `selection`,
`reachable`, `pathRoute` po `selectPlayerUnit` (web), addytywnie; domyślnie D-OP-3 bajt w bajt.
ZMIANY/COMMIT: oceniany stan = commit obrony `9d6fc9d37` (gałąź `obrona/p4-371-t5a-reselect`), łańcuch
`47f8b2021` (baza dispatchu) → `2fc8fa4c1` (Operator) → `6bdc3f60f` (Evaluator) → `9d6fc9d37` (Obrona).
Kod do integracji: `9d6fc9d37` (zawiera kod Operatora + test obrony). FC dodaje wyłącznie ten raport
(gałąź `fc/p4-371-t5a-reselect`). Uwaga integracyjna: `origin/rust-port/parity-v2` przesunął się na
`48832747b` (integracja T1 SIEGE-DEF; zmienia tylko `siege_tactics_loop.rs` w `engine/src/domain`);
`git merge-tree --write-tree 48832747b 9d6fc9d37` → drzewo `9a8b10f0b`, bez konfliktów.
TESTY: §2 — wszystkie bramki EXIT 0, pełny engine 536 binarek / 4033 passed / 0 failed / 1 ignored
(istniejący), mutanty a–e i g zabite niezależnie przez FC.
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora (merge na parity-v2 = `48832747b` + pełny test na wyniku),
doprecyzowanie D-371-5 w `REJESTR-RUST.md` przed dispatchem T5b (ustalenie U2).
DEPLOY/PUSH: NIE WYKONANO.

## 1. Allowlista i zakazy (zweryfikowane samodzielnie)

`git diff --stat 47f8b2021 9d6fc9d37`: `render_frame.rs` (M, +55/−5), `tests/p4_371_reselect.rs` (A),
raporty `01`, `02`, `02a` (A). Wszystkie w allowliście. Brak zmian w `bridge.rs`, `renderer/`,
`view-model/`, `client/`, `src-tauri/`, `gra/**`, `Cargo.toml`/`Cargo.lock`, `REJESTR-RUST.md`.
`git diff --check` czysty. Brak nowych `#[ignore]`/`should_panic` w kodzie (trafienia grep tylko w tekście
raportów). Brak `Co-Authored-By` w commitach łańcucha (jest `Claude-Session:`). Testy `p4_364_*` bez diffu.
Literały `RenderUiParams { … }` poza silnikiem: tylko `client/tests/engine_bridge_renderer.rs:145` i `:360`,
oba z `..RenderUiParams::default()` / `..selected(..)` → klient kompiluje się bez zmian, bramka renderera
niepotrzebna (zgodnie z dispatchem).

## 2. Bramki odtworzone przez FC

W `rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR` = scratchpad `t5areselect/fc/target` (usunięty po bramkach). Worktree sparse
(`rust-port dyspozycje src-tauri`). Wolny dysk przed bramkami 13 GB, po sprzątnięciu 12 GB.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p4_364_render_frame --test bridge_contract --test p4_364_dto_bridge --test p4_364_bridge_layers --test p4_371_reselect` | EXIT 0 (37 + 9 + 5 + 13 + 8 passed) |
| pełny `cargo test --all-targets --no-fail-fast` (tło, `setsid nohup`, `EXIT=` w logu) | `EXIT=0`; 536 × `test result: ok`; 4033 passed, 0 failed, 1 ignored (istniejący, spoza tematu) |

## 3. Mutanty (skrypt FC, `cargo test --test p4_371_reselect --test p4_364_render_frame`, źródło przywrócone, `git status` czysty)

| Mutant | Zmiana w `render_frame.rs` | Wynik |
|---|---|---|
| a flaga ignorowana | `let reselected = false;` | ZABITY (4: scenariusz, wszystkie tryby, zasięg, most) |
| b flaga zawsze true | `reselected = selected_unit_id.is_some()` | ZABITY (`p4_364_render_frame`: `c_tryb_budowy_czysci_zaznaczenie_zasieg_i_trase`, `r2_build_highlight_found_city_wg_can_found_city`) |
| c gubi `buildHighlight` | `dto.build_highlight.hexes = Vec::new()` przed przywróceniem | ZABITY (2) |
| d `reachable` z innego id | `reachable_overlay(state)` zamiast `view_state` | ZABITY (4) |
| e `None` przy fladze true | `selected_unit_id.expect(..)` gdy flaga | ZABITY (`flaga_true_bez_zaznaczenia`) |
| g pusty klucz blokuje trasę | `.is_some()` zamiast `.is_some_and(!k.is_empty())` | ZABITY (`flaga_true_przywraca_we_wszystkich_trybach`) |

Kryterium „mutanty (a)–(e) wykryte” spełnione; poprawka obrony (U1) skuteczna.

## 4. Web najpierw (pin `07d2fbd72`, odczyt FC)

- `onOpenBuild` → `clearPlayerUnitSelection()` (`main.ts:26702-26703`); `clearPlayerUnitSelectionStateOnly`
  (`:7096-7106`) zeruje `selectedId`, `reachable`, highlight, trasę, pierścień — zgodne z D-OP-3.
- `selectPlayerUnit` (`:7233-7268`) nie dotyka `buildModeOpen`/`foundCityMode`/`activeWonderId`/
  `activeImprovementKey`; ustawia `selectedId`, `reachable` + `setHighlight` (`:7250-7257`),
  `setSelectionHex` (`:7258`) — zgodne z gałęzią D-OP-8.
- `refreshBuildHighlight` (`:16351-16396`) zmienia tylko warstwę `setHighlight`/kopalni, nie czyści
  zaznaczenia ani pierścienia — zgodne z „`buildHighlight` liczone jak dotąd” obok `selection`.
- Handler ruchu myszy (`:32273-32278`): `buildModeOpen && (foundCityMode || activeImprovementKey ||
  activeWonderId)` → `clearPathRoute` — uzasadnia `pathRoute = None` przy wybranym trybie/kluczu.
  Odstępstwo od litery dispatchu („`path_route` jak D-OP-4”) jest bliższe webowi (zasada 11) — przyjęte.
- Flaga potrzebna (ramka bezstanowa D-R3-3 nie zna kolejności „otwarcie panelu” vs „zaznaczenie”) —
  decyzja D-OP-8 uzasadniona, nazwa pola `unitSelectedAfterBuildOpen` zgodna z dispatchem.

## 5. Orzeczenie zarzutów

| Zarzut | Źródło | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| U1 mutant g przeżywa | Evaluator | ODDAL (naprawione w obronie) | test pustego klucza dodany; FC potwierdza: mutant g ZABITY |
| U2 D-371-5 „zerowanie flagi przy każdym `refreshBuildHighlight`” rozjeżdża się z webem | Evaluator | DO DECYZJI CZŁOWIEKA (orkiestratora — decyzja techniczna, nie gameplay) | silnik T5a poprawny niezależnie (podaje obie warstwy); doprecyzowanie D-371-5 w `REJESTR-RUST.md` przed T5b — poza allowlistą tego tematu, nie blokuje |
| U3 nieaktualny komentarz `overlays_view.rs:507-508` („JEDYNY wołający”) | Evaluator | ODDAL (dług DŁUG-371-T5A-DOC-OVERLAYS) | plik poza allowlistą; tylko dokumentacja |
| U4 trasa planowanego marszu (`:7265-7267`) przy wybranym kluczu | Evaluator | ODDAL (dług DŁUG-371-T5B-PLAN-PREVIEW) | wymaga stanu klienta; `path_route_overlay` i tak nie odwzorowuje `plannedMarches` sprzed tematu |
| U5 scenariusz modelowany ręcznie | Evaluator | ODDAL | dispatch nie wymaga wykonania pinu; oczekiwania z tych samych producentów co D-OP-4 |
| U6 brak `isMe`/gałęzi panelu oblężenia | Evaluator | ODDAL (dług DŁUG-D-OP-4-ISME-SIEGE) | odziedziczone z D-OP-4, T5a nie wprowadza nowej rozbieżności |
| U7 brak SHA w `01-operator-r1.md` | Evaluator | ODDAL | SHA `2fc8fa4c1` zapisany w `02-evaluator.md`, `02a-obrona.md` i tutaj |
| F1 parity-v2 przesunięty (`47f8b2021` → `48832747b`) | FC | ODDAL (informacja dla integracji) | merge-tree bez konfliktów; pliki rozłączne; pełny test na wyniku merge'a należy do integracji |

Brak NAPRAW → PASS. Jedna pozycja DO DECYZJI (U2, techniczna, dla orkiestratora) → PASS-WITH-NOTES.

## 6. Długi

- **T5b** (renderer + klient): wybór widocznej warstwy podświetlenia („ostatni pisarz” `setHighlight`),
  ustawianie `unitSelectedAfterBuildOpen = true` przy `select_unit` w trybie budowy, zerowanie przy zmianie
  trybu budowy (`onOpenBuild`, `closeAllMapToolbarModes`, `exitBuildMode`), NIE przy zmianie klucza —
  po doprecyzowaniu D-371-5 (U2).
- **T3b**: typ TS `unitSelectedAfterBuildOpen?: boolean` w `RenderUiParams` (frontend-v2).
- **DŁUG-371-T5A-DOC-OVERLAYS** (U3), **DŁUG-371-T5B-PLAN-PREVIEW** (U4), **DŁUG-D-OP-4-ISME-SIEGE** (U6).
