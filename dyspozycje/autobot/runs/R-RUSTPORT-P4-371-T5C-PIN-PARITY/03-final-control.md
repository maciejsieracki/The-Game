# R-RUSTPORT-P4-371-T5C-PIN-PARITY — Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-371-T5C-PIN-PARITY
GOAL: wyrównać do pinu 07d2fbd72 rozbieżności U-OP-1..4 warstwy zaznaczenia/zasięgu klienta i renderera (D-371-5c)
ZMIANY/COMMIT: oceniany stan 9a9e24ef6 (gałąź t5c-obrona: kod Operatora e8834aa34 + kod obrony 25ee81295 + raporty
      01/02/02a), baza 48035d3a7 = origin/rust-port/parity-v2 (przodek potwierdzony). FC nie zmienia kodu; jedyny
      nowy plik to ten raport (commit nad 9a9e24ef6).
TESTY: klient fmt EXIT 0 / clippy --locked --all-targets -D warnings EXIT 0 / test --locked --all-targets EXIT 0
      (engine_bridge_renderer 18 passed / 0 failed / 0 ignored; lib 0/0/0); renderer fmt --check EXIT 0;
      renderer clippy/test: NIE_ZMIERZONO przez FC (dysk 2,6–3,4 GB < 12 GB) — drzewo renderera identyczne
      z ocenionym przez Evaluatora (EXIT 0), patrz §3. Mutanty FC: 8/8 zabite.
BLOKADY: brak merytorycznych; środowisko: bramka renderera do odtworzenia przy integracji (>= 12 GB)
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (przed FF: bramka renderera clippy + test --all-targets przy >= 12 GB)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Zakres, allowlista, higiena

- `git diff --stat 48035d3a7..9a9e24ef6`: `client/src/lib.rs`, `client/tests/engine_bridge_renderer.rs`,
  `renderer/src/view/units.rs`, `renderer/tests/overlays_units_q6.rs`, `renderer/tests/view_frame.rs`, raporty
  01/02/02a. Wszystko w allowliście. `frame.rs`, `engine/`, `view-model/`, `src-tauri/`, `gra/**`, `Cargo.toml`,
  `renderer/Cargo.lock`, `REJESTR-RUST.md` — nietknięte.
- Hashe drzew (`git rev-parse`): `rust-port/renderer` e8834aa34 = 9a9e24ef6 = `f5f8a3cc5…`;
  `rust-port/view-model` i `rust-port/engine` baza = HEAD (`02a0f06d5…`, `b08d8e39f…`).
- `git diff --check 48035d3a7..HEAD` czysty. Nowych `#[ignore]` brak (jedyny: `atlas_gpu.rs:101`, sprzed tematu).
  Trailery commitów: brak `Co-Authored-By` / nazwy modelu. `git status` czysty po mutantach.

## 2. Weryfikacja na tekście pinu (`git show 07d2fbd72:gra/src/main.ts`, odczyt FC)

| Miejsce pinu | Treść | Implementacja | Ocena |
|---|---|---|---|
| `clearPlayerUnitSelectionStateOnly` `:7096-7106` | `selectedId = null; reachable = ∅; clearHighlight(); clearPathRoute(); clearSelectionHex()` | `select_unit(None)` → flaga `false`, pisarz `Cleared`, tryb budowy bez zmian | zgodne (U-OP-4) |
| `selectPlayerUnit` `:7253-7261` | panel oblężenia → `clearHighlight()`; inaczej `setHighlight(reachable)` także dla `new Set()` | renderer `Reachable => reach()` (bez `.or_else(build)`) | zgodne (U-OP-1) |
| `refreshBuildHighlight` `:16351-16396` | found city / cud → `setHighlight(zbiór)`; brak trybu/klucza → `clearHighlight()`; kopalnia → `clearHighlight()`; ulepszenie → `setHighlight(…)` | `renderer_priority`: Build + tryb budowy + pusta warstwa → `Cleared` (D-T5C-5) | zgodne — pin w trybie budowy nigdy nie pokazuje zasięgu |
| `exitBuildMode` `:16526-16541` | guard `:16532`; zeruje 4 pola; `refreshBuildHighlight()`; BEZ `clearPlayerUnitSelection` | `exit_build_mode`: zeruje 4 pola + flagę, zaznaczenie zostaje, pisarz `Cleared`; guard po stronie wołającego (doc) | zgodne (U-OP-3) |
| `onOpenBuild` `:26702-26721` | pierwsza linia `clearPlayerUnitSelection()`; przy otwartym panelu `exitBuildMode()` | `set_build_mode` przy zmianie `build_mode_open`: czyści zaznaczenie + flagę; zamknięcie → pisarz `Cleared` (D-T5C-7) | zgodne |
| `onSelectFoundCity` `:26758-26763`, `onSelectWonder` `:26766-26794` | brak `clearPlayerUnitSelection` | przełączniki zachowują zaznaczenie i flagę, zerują klucz, pisarz `Build` | zgodne (U-OP-2) |

Decyzje D-T5C-1..7 są techniczne, wynikają wprost z kolejności wywołań pinu; gameplay nie ruszony.

## 3. Bramki (odtworzone przez FC)

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR=<scratchpad>/t5crender/fc/target` (szczyt 507 MB, usunięty po bramkach i mutantach).

| Krate | Polecenie | EXIT |
|---|---|---|
| client | `cargo fmt --all -- --check` | 0 |
| client | `cargo clippy --locked --all-targets -- -D warnings` | 0 |
| client | `cargo test --locked --all-targets` | 0 — `engine_bridge_renderer` 18/0/0, lib 0/0/0 |
| renderer | `cargo fmt --all -- --check` | 0 |
| renderer | `cargo clippy --all-targets -- -D warnings` | NIE_ZMIERZONO przez FC |
| renderer | `cargo test --all-targets` | NIE_ZMIERZONO przez FC |

Uzasadnienie pominięcia: wolne 3,4 GB na starcie FC (2,6 GB w szczycie), równolegle trwa `cargo test --all-targets
--no-fail-fast` silnika tematu T6 (`wf_aa003b5d-05f-4`, target `scratchpad/adapter/t2`) — dispatch wymaga
>= 12 GB do buildu renderera. Dowód zastępczy: drzewo `rust-port/renderer` w ocenianym stanie jest bajtowo
identyczne (hash drzewa `f5f8a3cc5…`) z e8834aa34, na którym Evaluator odtworzył renderer fmt/clippy/test EXIT 0;
obrona zmieniła wyłącznie `client/`, a `view-model/` i `engine/` są równe bazie. Biblioteka `civ-renderer` jest
kompilowana i ćwiczona (CPU) w bramce klienta FC (clippy `-D warnings` i 18 testów e2e EXIT 0).

## 4. Mutanty FC (`<scratchpad>/t5crender/fcmut/mut.py`, `cargo test --locked --all-targets --no-fail-fast` w kliencie; plik przywracany po każdym)

| Mutant | Kierunek dispatchu | Wynik | Zabójcy |
|---|---|---|---|
| a: renderer `Reachable => reach().or_else(build)` | (a) U-OP-1 przywrócone | ZABITY (101) | `t5c_u_op_1_unit_without_moves_in_build_mode_is_no_discs` |
| b: zerowanie flagi w `set_build_mode` dla found city / cudu | (b) | ZABITY | `t5c_mode_switch_keeps_selection_and_flag_key_change_keeps_it` |
| c: `exit_build_mode` czyści zaznaczenie | (c) | ZABITY | `t5c_u_op_3_…`, `t5c_exit_build_mode_from_found_city_and_wonder_zeroes_the_modes` |
| d: `select_unit(None)` zostawia pisarza | (d) | ZABITY | `t5c_u_op_4_deselect_in_build_mode_clears_the_layer` |
| E1: `exit_build_mode` nie zeruje `found_city_mode` | Z-EV-1 | ZABITY | `t5c_exit_build_mode_from_found_city_and_wonder_zeroes_the_modes` |
| E2: `exit_build_mode` nie zeruje `wonder_active` | Z-EV-1 | ZABITY | jw. |
| g: renderer dostaje surowego pisarza (brak D-T5C-5) | (e) | ZABITY | `t5c_build_writer_in_build_mode_never_shows_the_range` |
| D7: zamknięcie panelu → pisarz `Build` | U-EV-2 | ZABITY | `t5b_web_scenario_build_mode_reselect_end_to_end` |

Kierunki (e) e2 i (f) (zmiana pisarza woła `GetRenderFrame`) — zabite u Operatora (tabela §5 `01-operator-r1.md`),
asercje liczby `GetRenderFrame` obecne w testach t5b/t5c; nie powtarzane. Renderer-only mutanty (d2, E8, E14)
zabite u Operatora/Evaluatora na identycznym drzewie renderera.

## 5. Orzeczenia zarzutów

| Zarzut | Źródło | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| Z-EV-1: E1/E2 przeżywają (`exit_build_mode` z found city / cudem bez testu) | Evaluator | ODDAL (naprawione w obronie) | nowy test `t5c_exit_build_mode_from_found_city_and_wonder_zeroes_the_modes`; FC potwierdza zabicie E1/E2 |
| U-EV-2: zamknięcie panelu ustawia pisarza `Build` zamiast `Cleared` | Evaluator | ODDAL (naprawione, D-T5C-7) | pin `:26702-26706` → `exitBuildMode` → `clearHighlight()` `:16369-16372`; mutant D7 zabity |
| U-EV-3: pisarz `Cleared` przetrwa `StateChanged` | Evaluator | ODDAL (dług, nie wada) | zgodne z pinem (`StateChanged` nie jest wywołaniem `refreshBuildHighlight`); zapis w DŁUG-T5C-CLEARED-PERSIST / REFRESH-SITES do kontraktu T3 |
| Zmiana asercji T5b (2 testy + krok 5 scenariusza) | Operator/obrona | ODDAL | każda zmiana uzasadniona linią pinu i zastąpiona asercją co najmniej równie mocną (odwrotny kierunek + pierścień/warstwa); nie osłabienie |
| Bramka renderera bez 12 GB (Evaluator 9,3 GB, obrona i FC nie odtworzyły) | środowisko | ODDAL jako zarzut wobec pracy; UWAGA dla orkiestratora | identyczne drzewo renderera z EXIT 0 Evaluatora; przy integracji wykonać renderer clippy + test na zintegrowanym stanie przy >= 12 GB |

Brak zarzutu NAPRAW; brak sprawy DO DECYZJI CZŁOWIEKA (wszystko rozstrzyga pin).

## 6. Długi

- DŁUG-T5C-CLEARED-PERSIST, DŁUG-T5C-REFRESH-SITES → kontrakt T3 TAURI-GLUE (orkiestrator).
- DŁUG-T1-LOCK (`renderer/Cargo.lock` niekompletny dla `--locked`) — bez zmian.
- Wpis D-T5C-1..7 do `REJESTR-RUST.md` — orkiestrator.
- Bramka renderera (clippy + test --all-targets) do wykonania przy integracji przy >= 12 GB wolnego.
- Nadal otwarte z T5b: DŁUG-371-T5B-PLAN-PREVIEW, DŁUG-D-OP-4-ISME-SIEGE, typ TS `unitSelectedAfterBuildOpen` (T3b).
