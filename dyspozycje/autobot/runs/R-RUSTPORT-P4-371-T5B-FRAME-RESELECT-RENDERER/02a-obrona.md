# R-RUSTPORT-P4-371-T5B-FRAME-RESELECT-RENDERER — Obrona Operatora r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-371-T5B-FRAME-RESELECT-RENDERER
GOAL: D-371-5b w rendererze i kliencie (warstwa setHighlight wg ostatniego zapisu), odpowiedź na zarzuty Evaluatora r1
ZMIANY/COMMIT: baza obrony = d00609686 (kod Operatora r1, rodzic aad01dc1d); zmienione tylko
      rust-port/client/src/lib.rs, rust-port/client/tests/engine_bridge_renderer.rs i ten raport;
      gałąź rust-port-wip/371-t5b-renderer-obrona-r1 (SHA w odpowiedzi StructuredOutput / git log -1 tej gałęzi)
TESTY: klient fmt EXIT 0; clippy --locked --all-targets -D warnings EXIT 0; test --locked --all-targets EXIT 0
      (engine_bridge_renderer 13/0/0, było 11; lib 0/0/0); 5 nowych mutantów zabitych realnymi FAILED
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control (03-final-control.md)
DEPLOY/PUSH: NIE WYKONANO
```

## Odpowiedzi na zarzuty

| Zarzut | Odpowiedź | Dowód |
|---|---|---|
| Raport Evaluatora, commit 245b86bfa | przyjęty do wiadomości | ocena dotyczy d00609686; obrona buduje na nim |
| Bramki 717/0/0, 11/0/0, engine 4043/0/1 | bez sporu | po obronie klient 13/0/0 (2 nowe testy); kod renderera i silnika nietknięty |
| Allowlista czysta | bez sporu | obrona zmienia wyłącznie `client/src/lib.rs` i `client/tests/engine_bridge_renderer.rs` (allowlista `rust-port/client/**`) |
| Mutanty a–f, h/i/o/m | bez sporu; m naprawiony (U-EV-1) | h, i, o: zgadzam się z oceną równoważności |
| **U-EV-1** `set_ui` gubi `highlight_last_writer` | **PRZYJMUJĘ** | nowy test `t5b_set_ui_carries_the_highlight_writer`: `set_ui` z samym pisarzem `Reachable` -> brak `GetRenderFrame`, widoczny zasięg; `set_ui` z pisarzem `Build` + zmianą `hover` -> 1 wywołanie, widoczny build. Mutant m (`let _ = highlight_last_writer;`) ZABITY |
| **U-EV-2** `onSelectFoundCity`/`onSelectWonder` zerują klucz | **PRZYJMUJĘ** (poprawka wg pinu) | `set_build_mode`: gdy `found_city_mode` przechodzi na `true` (`main.ts:26758-26762`) albo zmienia się `wonder_active` (`:26767-26770`, `activeImprovementKey = null` przy każdym `onSelectWonder`) -> `active_improvement_key = None`. Test `t5b_mode_switches_clear_the_key_and_key_choice_clears_the_modes`; mutanty „brak zerowania” i „tylko found city” ZABITE. Dług `DŁUG-371-T5B-MODE-KEY` niepotrzebny |
| **U-EV-3** `onSelectType` zeruje `foundCityMode`/`activeWonderId` | **PRZYJMUJĘ** (poprawka wg pinu) | `set_active_improvement_key(Some(k))` ustawia `found_city_mode = false`, `wonder_active = false` (`:26735-26736`) bez zerowania flagi i zaznaczenia — reguła D-371-5b dla zmiany klucza („flaga i `selected_unit_id` NIE są zerowane”); pin w `onSelectType` nie woła `clearPlayerUnitSelection`, więc pierścień zostaje. Test: found city -> select -> klucz => flaga `true`, `selected_unit_id` zachowane, warstwa = build ulepszenia, pierścień na heksie zaznaczenia, `GetRenderFrame` aktywnego fotela zgodny. Mutanty „brak zerowania trybów” i „cud zostaje” ZABITE. `None` (brak odpowiednika w pinie: `onSelectType` dostaje klucz) nie rusza przełączników. Uwaga: to rozstrzyga też U-OP-2 dla ścieżki `onSelectType`; zerowanie flagi przy `onSelectFoundCity`/`onSelectWonder` pozostaje wg brzmienia D-371-5b (rozbieżność z pinem opisana w U-OP-2) |
| **U-EV-4** U-OP-1..4 jako rozbieżności do decyzji orkiestratora | **ODRZUCAM jako zarzut do kodu tej rundy** (bez zmian) | wszystkie cztery są wdrożone wg brzmienia dispatchu/D-371-5b; zmiana wymaga decyzji orkiestratora i wpisu w `REJESTR-RUST.md`, który jest poza allowlistą. U-OP-2 częściowo zamknięte przez U-EV-3 (ścieżka `onSelectType`) |
| **U-EV-5** dysk 9,7 GB < 12 GB przy bramce renderera | **PRZYJMUJĘ do wiadomości** (proces) | w obronie nie budowano bramki renderera (kod renderera bajt w bajt = d00609686, oceniony przez Evaluatora). Klient (kompiluje bibliotekę renderera jako zależność) przy 7,6–7,0 GB wolnego, równolegle 1 cudzy `cargo test` silnika (T2a) => 2 buildy, limit zachowany. Odnotowane jako odstępstwo od progu dla FC |
| Sprzątanie Evaluatora | bez sporu | obrona: `scratchpad/t5bobrona/target` usunięty po bramkach; `Cargo.lock` nietknięte |

## Mutanty obrony (skrypt `scratchpad/t5bobrona/mut.py`, test `engine_bridge_renderer`, plik przywracany)

| Mutant | Wynik | Zabójca |
|---|---|---|
| m: `set_ui` gubi `highlight_last_writer` | ZABITY | `t5b_set_ui_carries_the_highlight_writer` |
| ev2a: `set_build_mode` nie zeruje klucza | ZABITY | `t5b_mode_switches_clear_the_key_and_key_choice_clears_the_modes` |
| ev2b: zerowanie klucza tylko przy found city (bez cudu) | ZABITY | jw. |
| ev3a: `set_active_improvement_key` nie zeruje found city/cudu | ZABITY | jw. |
| ev3b: cud nie zerowany przy wyborze klucza | ZABITY | jw. |

Wszystkie zabite przez `FAILED` testu (EXIT 101, bez błędu kompilacji).

## Bramki obrony (CARGO_TARGET_DIR w scratchpadzie, CARGO_INCREMENTAL=0, DEBUG=0)

| Krate | Polecenie | EXIT |
|---|---|---|
| client | `cargo fmt --all -- --check` | 0 |
| client | `cargo clippy --locked --all-targets -- -D warnings` | 0 |
| client | `cargo test --locked --all-targets` | 0 — 13/0/0 (`engine_bridge_renderer`), istniejące 11 bez zmian asercji |
| renderer | nie uruchamiano | kod renderera niezmieniony względem d00609686 (EXIT 0 u Evaluatora); dysk < 12 GB |

`git diff --check` czysty; brak `#[ignore]`; żadna istniejąca asercja nie usunięta ani nie osłabiona.

## Długi (bez zmian względem Evaluatora, minus MODE-KEY)

DŁUG-371-T5B-PLAN-PREVIEW, DŁUG-D-OP-4-ISME-SIEGE, T3b (typ TS `unitSelectedAfterBuildOpen`), DŁUG-T1-LOCK,
U-OP-1, U-OP-2 (część `onSelectFoundCity`/`onSelectWonder`), U-OP-3, U-OP-4 — decyzje orkiestratora w `REJESTR-RUST.md`.
`DŁUG-371-T5B-MODE-KEY` zamknięty poprawką U-EV-2.
