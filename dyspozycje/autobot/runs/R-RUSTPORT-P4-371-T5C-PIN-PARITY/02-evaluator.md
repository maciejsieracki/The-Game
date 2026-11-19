# R-RUSTPORT-P4-371-T5C-PIN-PARITY — Evaluator r1 (adwersarialny)

```text
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-371-T5C-PIN-PARITY
GOAL: wyrównać do pinu 07d2fbd72 rozbieżności U-OP-1..4 warstwy zaznaczenia/zasięgu klienta i renderera (D-371-5c)
ZMIANY/COMMIT: oceniany kod e8834aa34 (raport Operatora 18029b91a), baza 48035d3a7 = origin/rust-port/parity-v2
      (merge-base potwierdzony). Evaluator nie zmienia kodu; ten raport to jedyny plik.
TESTY: renderer fmt 0 / clippy --all-targets -D warnings 0 / test --all-targets 0;
      klient fmt 0 / clippy --locked --all-targets -D warnings 0 / test --locked --all-targets 0 (engine_bridge_renderer 17/0/0);
      razem 737 passed / 0 failed. Mutanty Evaluatora: 13, z tego 2 PRZEŻYŁY (E1, E2 — nowy kod exit_build_mode).
BLOKADY: brak (zarzut naprawialny testem w allowliście)
RUNDY: 1/5
NASTĘPNY KROK: Obrona / Operator r2 (ten sam ID): test zabijający E1 i E2
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Zakres i allowlista

`git diff --stat 48035d3a7 18029b91a`: `client/src/lib.rs`, `client/tests/engine_bridge_renderer.rs`,
`renderer/src/view/units.rs`, `renderer/tests/overlays_units_q6.rs`, `renderer/tests/view_frame.rs`,
`01-operator-r1.md`. Wszystko w allowliście; `frame.rs`, `engine/`, `view-model/`, `src-tauri/`, `gra/**`,
`Cargo.toml`, `renderer/Cargo.lock`, `REJESTR-RUST.md` nietknięte. Pliki spoza allowlisty: brak.
`git diff --check` czysty. Nowych `#[ignore]` brak (jedyny w drzewie: `atlas_gpu.rs:101`, sprzed tematu).
Trailery: tylko `Claude-Session:`, bez nazwy modelu. Zmienione asercje T5b (2 testy) są uzasadnione pinem
(`:26758-26794`, `:7256-7261`) i zastąpione asercjami mocniejszymi (odwrotny kierunek + pierścień + warstwa) —
nie osłabienie.

## 2. Weryfikacja na tekście pinu (`git show 07d2fbd72:gra/src/main.ts`)

| Miejsce | Tekst pinu | Ocena implementacji |
|---|---|---|
| `selectPlayerUnit` `:7253-7261` | panel oblężenia → `clearHighlight()`; inaczej `setHighlight(reachable)` także dla `new Set()` | U-OP-1 (`Reachable => reach()`) zgodne |
| `clearPlayerUnitSelectionStateOnly` `:7096-7106` | `selectedId = null; reachable = ∅; clearHighlight(); clearPathRoute(); clearSelectionHex()` | U-OP-4 (`select_unit(None)` → `Cleared`, flaga `false`, tryb budowy zostaje) zgodne |
| `refreshBuildHighlight` `:16351-16396` | w trybie budowy nigdy zasięg; poza nim `clearHighlight()` | D-T5C-5 (`renderer_priority`) zgodne |
| `exitBuildMode` `:16526-16541` | guard `:16532`; `buildModeOpen = false; foundCityMode = false; activeImprovementKey = null; activeWonderId = null; … refreshBuildHighlight()`; BEZ `clearPlayerUnitSelection` | U-OP-3 zgodne w kodzie; **pola `foundCityMode`/`activeWonderId` niepokryte testem (§4 E1/E2)** |
| `onOpenBuild` `:26702-26721` | pierwsza linia `clearPlayerUnitSelection()` | czyszczenie zaznaczenia + flagi tylko przy zmianie `build_mode_open` — zgodne |
| `onSelectFoundCity` `:26758-26763`, `onSelectWonder` `:26766-26794` | bez `clearPlayerUnitSelection` | U-OP-2 zgodne |

Decyzje D-T5C-1..6 są spójne z pinem i z D-371-5c; gameplay nie ruszony.

## 3. Bramki (odtworzone przez Evaluatora, EXIT)

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, wspólny `CARGO_TARGET_DIR`
w scratchpadzie (`t5crender/ev/target`, ~1 GB, usunięty po bramkach i mutantach).

| Krate | Polecenie | EXIT |
|---|---|---|
| renderer | `cargo fmt --all -- --check` | 0 |
| renderer | `cargo clippy --all-targets -- -D warnings` | 0 |
| renderer | `cargo test --all-targets` | 0 |
| client | `cargo fmt --all -- --check` | 0 |
| client | `cargo clippy --locked --all-targets -- -D warnings` | 0 |
| client | `cargo test --locked --all-targets` | 0 (`engine_bridge_renderer` 17/0/0) |

Łącznie 737 passed / 0 failed. `renderer/Cargo.lock` uzupełniony lokalnie przez `cargo test` (DŁUG-T1-LOCK) —
cofnięty `git checkout`.

Odstępstwa środowiskowe (jawnie): (1) dysk na starcie bramki renderera 9,3 GB, nie ≥ 12 GB — równolegle budował
`engine` temat T6 ADAPTER (`wf_aa003b5d-05f-4`, nie renderer; limit 2 buildów zachowany); czekanie ~5 min nie
zwolniło miejsca, build przeprowadzony na wspólnym, małym targecie (szczyt ~1 GB, min. wolne 4,7 GB);
(2) pełny test `engine` NIE uruchomiony — dispatch go nie wymaga, `engine/` niezmieniony (diff), a klient
kompiluje i ćwiczy most silnika w `engine_bridge_renderer`.

## 4. Mutanty Evaluatora (`t5crender/ev/mut.py`, plik przywracany po każdym; `git status` czysty)

| ID | Mutant | Wynik | Zabójcy |
|---|---|---|---|
| **E1** | `exit_build_mode` nie zeruje `found_city_mode` | **PRZEŻYŁ** | — |
| **E2** | `exit_build_mode` nie zeruje `wonder_active` | **PRZEŻYŁ** | — |
| E6 | `exit_build_mode` nie zeruje flagi | zabity | `t5c_u_op_3_…` |
| E10 | `exit_build_mode` pisarz `Reachable` | zabity | `t5c_u_op_3_…` |
| E11 | `exit_build_mode` pisarz `Build` | zabity | `t5c_u_op_3_…` |
| E3 | `renderer_priority` bez `in_build_mode` | zabity | `t5c_build_writer_…`, `engine_bridge_adapter_renderer_end_to_end`, `ui_set_before_session_…` |
| E4 | `renderer_priority` bez warunku pustej warstwy | zabity | 7 testów (m.in. `t5c_u_op_1_…`, `t5c_mode_switch_…`) |
| E5 | zamknięcie panelu nie zeruje flagi | zabity | `t5b_web_scenario_…` |
| E9 | `select_unit(None)` pisarz `Build` | zabity | `t5c_u_op_4_…` |
| E12 | `select_unit(None)` pisarz `Reachable` | zabity | `t5c_u_op_4_…` |
| E13 | zamknięcie panelu przez `set_build_mode` → pisarz `Cleared` | zabity | `t5b_web_scenario_…` (patrz U-EV-2) |
| E8 | renderer `Cleared => reach()` | zabity | renderer 3 testy + klient 2 |
| E14 | renderer `Reachable` ignoruje panel oblężenia | zabity | `t5b_reachable_writer_with_siege_map_panel_clears` |

Mutanty Operatora (a–h) — tabela w `01-operator-r1.md` §5; nie powtarzane, kierunki (a)–(f) z dispatchu
potwierdzone pośrednio przez E3/E4/E8–E12.

## 5. Zarzuty

- **Z-EV-1 (BLOKUJĄCY, mutanty E1/E2):** nowa metoda `exit_build_mode` (`client/src/lib.rs:554-561`) zeruje
  `found_city_mode` i `wonder_active` zgodnie z `exitBuildMode` `:16533-16536`, ale żaden test nie wywołuje jej
  z włączonym trybem zakładania miasta ani cudu (`t5c_u_op_3_…` startuje z `open_panel()` + klucz, gdzie oba
  pola już są `false`; asercja `!found_city_mode && !wonder_active` jest pusta). Mutanty nie są równoważne:
  pozostawione `found_city_mode = true` utrzymuje `in_build_mode` → silnik liczy warstwę found city,
  `frame_ui != selected(id)`, inna ramka. To główny przypadek Escape w pinie (tryb zakładania miasta).
  Naprawa (allowlista `client/tests/**`): test e2e `exit_build_mode` z (a) `found_city_mode` i (b)
  `wonder_active` włączonymi (przy zaznaczonej jednostce): po wyjściu `frame_ui == selected(WARRIOR)`,
  `build_highlight.hexes` puste, pisarz `Cleared`, pierścień zostaje, brak krążków; mutanty E1/E2 muszą paść.
- **U-EV-2 (uwaga, nieblokująca):** zamknięcie panelu przez `set_build_mode(BuildMode::default())` (`onOpenBuild`
  przy otwartym panelu → `clearPlayerUnitSelection()` + `exitBuildMode()`) ustawia pisarza `Build`, choć ostatni
  zapis w pinie to `clearHighlight()` (`:16369-16372`). Widoczny wynik ten sam (brak zaznaczenia i brak warstwy
  budowy poza trybem budowy → `Clear`), test T5b utrwala `Build`. Do rozważenia ujednolicenie z `exit_build_mode`
  (pisarz `Cleared`) albo zapis w raporcie jako świadoma równoważność.
- **U-EV-3 (uwaga):** długi Operatora DŁUG-T5C-CLEARED-PERSIST i DŁUG-T5C-REFRESH-SITES zasadne; po
  `select_unit(None)` w trybie budowy pisarz `Cleared` przetrwa `StateChanged` do następnego wywołania
  `refreshBuildHighlight` po stronie wołającego (T3 TAURI-GLUE) — zgodne z pinem tylko gdy powłoka woła
  `set_highlight_last_writer(Build)` w tych samych miejscach co pin.

## 6. Długi

- DŁUG-T1-LOCK (bez zmian), DŁUG-T5C-CLEARED-PERSIST, DŁUG-T5C-REFRESH-SITES (Operator), U-EV-2.
- Wpis D-T5C-1..6 do `REJESTR-RUST.md` — orkiestrator.
