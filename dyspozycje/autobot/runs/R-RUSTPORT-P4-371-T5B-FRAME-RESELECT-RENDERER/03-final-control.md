# R-RUSTPORT-P4-371-T5B-FRAME-RESELECT-RENDERER — Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-371-T5B-FRAME-RESELECT-RENDERER
GOAL: D-371-5b w rendererze (wybór warstwy setHighlight wg ostatniego zapisu) i w kliencie
      (select_unit / set_build_mode / set_active_improvement_key / set_highlight_last_writer, bez silnika
      przy samej zmianie pisarza), scenariusz webu e2e
ZMIANY/COMMIT: oceniany kod = abbcf31ab (Obrona r1, rust-port-wip/371-t5b-renderer-obrona-r1) na d00609686
      (Operator r1) na aad01dc1d (= origin/rust-port/parity-v2, BAZA dispatchu). FC dodaje tylko ten raport
      (gałąź rust-port-wip/371-t5b-renderer-fc-r1, rodzic abbcf31ab)
TESTY: klient fmt / clippy --locked / test --locked EXIT 0 (engine_bridge_renderer 13/0/0, lib 0/0/0);
      renderer fmt EXIT 0; renderer clippy/test NIE powtórzone przez FC (dysk 5,9–6,6 GB < 12 GB) — drzewo
      renderer/engine/view-model bajt w bajt = d00609686, na którym Evaluator miał EXIT 0 (717/0/0);
      7/7 mutantów FC w kliencie zabitych realnym FAILED
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF/merge na rust-port/parity-v2, refs/keep, wpis D-371-5b + U-OP-1..4 w REJESTR-RUST.md)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Ancestry, baza, allowlista (sprawdzone samodzielnie)

- `git log aad01dc1d..abbcf31ab`: d00609686 (Operator r1) -> abbcf31ab (Obrona r1). `origin/rust-port/parity-v2`
  = `aad01dc1d` = BAZA dispatchu. Kod Operatora jest przodkiem kodu Obrony.
- `git diff --name-status aad01dc1d abbcf31ab`: `renderer/src/view/units.rs`, `renderer/src/view/frame.rs`,
  `renderer/tests/overlays_units_q6.rs`, `renderer/tests/view_frame.rs`, `client/src/lib.rs`,
  `client/tests/engine_bridge_renderer.rs`, `01-operator-r1.md`, `02a-obrona.md`. Wszystko w allowliście.
  Nietknięte: `engine/`, `view-model/`, `src-tauri/`, `gra/**`, `Cargo.toml`, `renderer/Cargo.lock`, `REJESTR-RUST.md`.
- `git diff --quiet d00609686 abbcf31ab -- rust-port/renderer rust-port/engine rust-port/view-model` -> identyczne
  (Obrona zmieniła tylko klienta).
- `git diff --check aad01dc1d abbcf31ab` czysty; brak `#[ignore]` w diffie; jedyne linie `-` to stara sygnatura
  `unit_highlight`, stare wywołanie `from_dto` w kliencie, import i komentarze — żadna asercja nie usunięta.
- `frame.rs`: tylko `from_dto_with_priority` (stary `from_dto` deleguje z `Build`) + wyliczenie `overlays.units`
  z priorytetem i istniejącą bramką panelu oblężenia — mieści się w „przeprowadzeniu argumentu”.
- Równoważność domyślna: `unit_highlight(.., Build)` = `build().or_else(reach)`; `reach` zwraca `None` dla pustego
  `reachable` i `Some(Clear)` przy panelu oblężenia -> dokładnie stare Q6-2 (build; potem Clear przy panelu/pustym;
  inaczej Set reachable). Sprawdzone czytaniem kodu; potwierdzone zielonymi starymi testami q6/view_frame u Evaluatora.

## 2. Bramki (FC, CARGO_INCREMENTAL=0, DEBUG=0, CARGO_TARGET_DIR w scratchpadzie `t5bfc/target`, usunięty)

| Krate | Polecenie | EXIT |
|---|---|---|
| client | `cargo fmt --all -- --check` | 0 |
| client | `cargo clippy --locked --all-targets -- -D warnings` | 0 |
| client | `cargo test --locked --all-targets` | 0 — `engine_bridge_renderer` 13 passed / 0 failed / 0 ignored; lib 0/0/0 |
| renderer | `cargo fmt --all -- --check` | 0 |
| renderer | `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets` | NIE powtórzone: wolne 5,9–6,6 GB < 12 GB (reguła dispatchu), równolegle cudzy build silnika. Kod renderera bajt w bajt = d00609686 — Evaluator: EXIT 0, 717/0/0 (q6 13, view_frame 23) |

Klient kompiluje bibliotekę renderera (`civ_renderer`) jako zależność, więc nowe API renderera
(`HighlightPriority`, `from_dto_with_priority`) jest zweryfikowane kompilacją i clippy FC; testy renderera
na ręcznych DTO — po stronie Evaluatora na identycznym drzewie.

## 3. Mutanty FC (klient, `scratchpad/t5bfc/mut/mut.py`, plik przywrócony, `git status` czysty)

| Mutant | Wynik | Zabójcy |
|---|---|---|
| c: flaga zerowana przy zmianie klucza | ZABITY | `t5b_mode_switch_…`, `t5b_mode_switches_clear_the_key_…`, `t5b_web_scenario_…`, `t5b_set_ui_…` |
| d: `select_unit` poza trybem ustawia flagę | ZABITY | `t5b_web_scenario_…` |
| e: zmiana pisarza woła silnik (`on_state_changed`) | ZABITY | `t5b_web_scenario_…` (licznik `GetRenderFrame`) |
| x: zmiana trybu NIE zeruje flagi | ZABITY | `t5b_mode_switch_…`, `t5b_web_scenario_…` |
| y: `select_unit` ustawia pisarza Build | ZABITY | `t5b_mode_switch_…`, `t5b_web_scenario_…` |
| z: `present_ref` ignoruje pisarza (zawsze Build) | ZABITY | `t5b_set_ui_…`, `t5b_web_scenario_…` |
| w: otwarcie panelu nie czyści zaznaczenia | ZABITY | `t5b_web_scenario_…` |

Wszystkie zabite realnym `FAILED` (EXIT 101, kompilacja OK). Mutanty renderera (a), (b), (f) zabite u Operatora
i Evaluatora na identycznym kodzie renderera; (c), (d), (e) potwierdzone przez FC niezależnie.

## 4. Web najpierw (pin `07d2fbd72`)

Odczytane `git show 07d2fbd72:gra/src/main.ts`: `onSelectType` `:26733-26741` (`foundCityMode = false;
activeWonderId = null; activeImprovementKey = key; refreshBuildHighlight()` — bez `clearPlayerUnitSelection`),
`onSelectFoundCity` `:26757-26762` (`activeImprovementKey = null`), `onSelectWonder` `:26766-26770`
(`foundCityMode = false; activeImprovementKey = null`). Poprawki Obrony U-EV-2/U-EV-3 są zgodne z pinem.

## 5. Orzeczenia wobec zarzutów

| Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|
| U-EV-1 `set_ui` gubi `highlight_last_writer` (mutant m przeżył) | ODDAL (naprawione w Obronie) | test `t5b_set_ui_carries_the_highlight_writer`; mutant pokrewny z (FC z) zabity |
| U-EV-2 found city / cud nie zerują klucza | ODDAL (naprawione w Obronie) | `set_build_mode` zeruje klucz wg `:26758-26770`; test + 2 mutanty Obrony zabite |
| U-EV-3 `onSelectType` nie zeruje found city / cudu | ODDAL (naprawione w Obronie) | `set_active_improvement_key(Some)` zeruje przełączniki wg `:26735-26736`, flagi i zaznaczenia nie rusza (reguła D-371-5b „zmiana klucza” + pin bez `clearPlayerUnitSelection`). Kolizja dwóch reguł dispatchu (zmiana klucza vs zmiana `found_city_mode`) rozstrzygnięta na korzyść pinu — poprawnie |
| U-EV-4 / U-OP-1 fallback do build przy pustym `reachable` (pin: pusta warstwa) | ODDAL dla tej rundy; do wpisu orkiestratora | wdrożone dosłownie wg D-371-5b z dispatchu („inaczej build”); różnica tylko wizualna (jednostka bez ruchu w trybie budowy). Decyzja techniczna orkiestratora w `REJESTR-RUST.md` (zmiana jednej linii `unit_highlight`, ew. osobny mikrotemat) |
| U-OP-2 zerowanie flagi przy `onSelectFoundCity`/`onSelectWonder` (pin nie czyści zaznaczenia) | ODDAL dla tej rundy; do wpisu orkiestratora | wdrożone dosłownie wg D-371-5b; ścieżka `onSelectType` już wierna pinowi (U-EV-3) |
| U-OP-3 Escape/PPM (`exitBuildMode`) bez czyszczenia zaznaczenia | ODDAL; dług | brak osobnej metody; wołający ma `set_frame_ui`. Do rejestru jako dług klienta |
| U-OP-4 `select_unit(None)` w trybie budowy pokazuje warstwę budowy (pin: `clearHighlight` do następnego refresh) | ODDAL; dług | przejściowy stan do najbliższego `refreshBuildHighlight` w pinie; do rejestru |
| U-EV-5 / proces: bramka renderera Evaluatora przy 9,7 GB < 12 GB | ODDAL (proces, nie kod) | build przeszedł, limit 2 buildów zachowany; FC świadomie nie powtarzał bramki renderera z tego powodu. Odnotowane dla orkiestratora: przy integracji pełna bramka renderera dopiero przy >= 12 GB |
| Mutanty h, i, o (przeżyły u Evaluatora) | ODDAL | równoważne w obrazie (uzasadnienie Evaluatora sprawdzone: silnik wymaga `selected_unit_id.is_some()`; `in_build_mode` = gałąź silnika; pusty `reachable` przy `Reachable` spada na build) |

Brak orzeczenia NAPRAW. Brak pozycji DO DECYZJI CZŁOWIEKA (U-OP-1..4 to decyzje techniczne orkiestratora wg
CLAUDE.md zasada 9 — odstępstwa wizualne od pinu wynikające z dispatchu, nie gameplay).

## 6. Długi (dla orkiestratora / REJESTR-RUST.md)

- DŁUG-371-T5B-PLAN-PREVIEW — `refreshPlannedMarchPreview` (`main.ts:7265-7267`) przy ponownym zaznaczeniu.
- DŁUG-D-OP-4-ISME-SIEGE — `isMe` dla `selection` i gałęzi panelu oblężenia po stronie silnika.
- T3b — typ TS `unitSelectedAfterBuildOpen`.
- DŁUG-T1-LOCK — `renderer/Cargo.lock` niekompletny dla `--locked`.
- U-OP-1 (fallback pustego zasięgu), U-OP-2 (found city / cud zerują flagę), U-OP-3 (Escape bez czyszczenia
  zaznaczenia), U-OP-4 (`select_unit(None)` w trybie budowy) — wpis decyzji w `REJESTR-RUST.md`.
- Integracja: przed FF pełna bramka renderera (`cargo test --all-targets`) przy >= 12 GB wolnego.

## 7. Sprzątanie

`scratchpad/t5bfc/target` usunięty po bramkach i mutantach. `renderer/Cargo.lock` nietknięty (renderer nie był
budowany przez FC). Worktree etapów (`wf_07ad9c04-338-1..3`) zostawione orkiestratorowi (refs/keep + wip).

## 8. Werdykt

**PASS-WITH-NOTES.** Kod zgodny z D-371-5b i z pinem w zakresie dispatchu; wektor scenariusza webu zielony
(ręczne DTO u Evaluatora na identycznym rendererze + e2e klient↔silnik u FC); mutanty (a)–(f) z dispatchu
i 7 własnych FC zabite; allowlista czysta. Uwagi: bramka renderera nie powtórzona przez FC z powodu dysku
(drzewo identyczne z ocenionym), U-OP-1..4 do wpisu orkiestratora.
