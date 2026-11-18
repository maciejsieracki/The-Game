# R-RUSTPORT-P4-371-T1-FRAME-ADAPTER — Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME (renderer CPU, bez reguł gry)
TEMAT: R-RUSTPORT-P4-371-T1-FRAME-ADAPTER (#371, T1)
GOAL: view::frame — (&MapViewDto, &RenderLayersDto, &MapUiState, siege_map_panel_open) → komplet wejść
      adapterów view::* → MapScene::apply w kolejności odświeżeń pinu 07d2fbd72
ZMIANY/COMMIT: oceniany stan = 91c336aad (op/P4-371-T1-obrona) nad 279c19e9d (Evaluator) nad 70e532033 (Operator),
      baza 51f36370d (= origin/rust-port/parity-v2 w dniu dispatchu; dziś parity-v2 = 8a40ff9b3, integracja
      wymaga merge-tree orkiestratora). FC: tylko ten raport, gałąź fc/P4-371-T1-frame.
TESTY: fmt EXIT 0; clippy --locked --all-targets -D warnings EXIT 0 (po lokalnym uzupełnieniu Cargo.lock, dług
      bazowy); cargo test --locked --all-targets EXIT 0 (81 binarek, 708 passed / 0 failed / 0 ignored,
      view_frame 21/21); 8 mutantów FC — 8/8 ZABITE.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge-tree na aktualne parity-v2 8a40ff9b3 + pełna bramka renderera)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, allowlista, zakazy (sprawdzone samodzielnie)

- `git log 51f36370d..91c336aad`: 3 commity (Operator, Evaluator, Obrona); 51f36370d jest przodkiem.
- `git diff --stat 51f36370d 91c336aad`: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`,
  `renderer/src/view.rs` (+2), `renderer/src/view/frame.rs` (+489, nowy), `renderer/tests/view_frame.rs` (+825, nowy).
  W całości w allowliście.
- `view.rs`: wyłącznie `pub mod frame;` i `pub use frame::{FrameError, FrameInputs, MapScene, MapStatic};`.
- Brak zmian w istniejących adapterach, `engine/`, `view-model/`, `src-tauri/`, `gpu`, `Cargo.toml`, `Cargo.lock`.
- `git diff --check`: czysto. `#[ignore]` / `should_panic`: brak. Trailery: tylko `Claude-Session:`.

## 2. Bramki (`rust-port/renderer`, bez `--features gpu`)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR` = scratchpad `t1fc/target` (poza repo, usunięty po bramkach i mutantach).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --locked --all-targets -- -D warnings` na czystym checkout | EXIT 101 — `cannot update the lock file` (DŁUG-T1-LOCK, bazowy; Cargo.lock nie należy do tematu) |
| j.w. po `cargo tree --offline` (+34 linie lock, cofnięte `git checkout`) | EXIT 0 |
| `cargo test --locked --all-targets` (`setsid nohup`, log z `EXIT=`) | EXIT 0, 16:29:29–16:31:58 UTC; 81× `test result: ok`; 708 passed / 0 failed / 0 ignored; `view_frame` 21 passed |

Dysk: 9,4 GB wolnego na starcie (dispatch: ≥ 12 GB). Brak innego `rustc`/`cargo` (`pgrep` pusty), target
renderera bez debug jest mały; bramka przeszła bez problemu. Odstępstwo procesowe odnotowane (jak u Evaluatora
i Obrony), nie zarzut wobec pracy.

## 3. Zgodność z pinem `07d2fbd72` (czytane `git show 07d2fbd72:gra/src/main.ts`)

- Sekwencja po wczytaniu `:46138-46156`: `syncWonderRender` (`:46139`) → `syncUnitsRender` (`:46142`) →
  `cityRenderer.sync` (`:46143`) → `refreshTradeRoutesOverlay` (`:46150`) → `refreshSiegeMarkers` (`:46151`) →
  `refreshFog` (`:46152`) → `refreshMapOverlayToggles` (`:46156`). `MapScene::apply` (frame.rs:406-433) zachowuje
  tę kolejność dla rendererów, które posiada.
- `refreshFog` `:13475-13519`: `setFog` `:13491` / `:13506`, `syncUnitsRender(visibleUnitsList)` `:13502`/`:13511`,
  `cityRenderer.applyFogVisibility` `:13503`/`:13512`, `wonderRenderer.applyFogVisibility` `:13504`/`:13513`,
  `refreshTerritoryBorderOverlay` `:13518` — cytaty nagłówka frame.rs po Obronie zgodne.
- `syncUnitsRender` `:14550-14553` (`setForceVisibleUnitId`, `setCityHexKeys`, `unitRenderer.sync`), `syncForestForUnits`
  `:14562`, `syncStatChips` `:14563` (te dwa — jawnie poza `MapScene`, DŁUG-T1-NOT-SYNCED).
- `syncWonderRender` `:4315-4318` (`reapplyWonderHexDecorHides` `:4317` poza `MapScene`, udokumentowane).
- `siegeMarkerRenderer.sync(... getTopY: (q, r) => unitRenderer.topYAt(q, r) ...)` `:17521-17527` — D-T1-3 wierne.
- `syncPlayerUnitSelectionOnMap` `:7115-7135` (koniec 7135), bramka panelu oblężenia `:7120-7122`.

## 4. Mutanty FC (skrypt `t1fc/mut/run.sh` + `mut.py`, `cargo test --locked --test view_frame`, plik przywrócony, `cmp` → RESTORED)

| Mutant | Wynik | Testy, które padły |
|---|---|---|
| FC1 `apply_city_fog` przed `cityRenderer.sync` (zamiana kolejności mgła/miasta) | ZABITY | apply_matches…, city_fog_comes_after_city_sync, next_frame…, non_start_ui…, unexplored_hex… |
| FC2 pominięcie `apply_city_fog` | ZABITY | j.w. |
| FC3 pominięcie `with_siege_map_panel_open` | ZABITY | apply_matches…, siege_map_panel_gate_is_applied |
| FC4 `>` zamiast `!=` (zły próg `contract_version`) | ZABITY | contract_version_is_checked_first (+ other_than_2) |
| FC5 `fog_active` → `true` | ZABITY | frame_without_fog_matches_the_web_else_branch |
| FC6 `land_reveal: true` | ZABITY | frame_inputs_hold_every_adapter_input, unexplored_hex… |
| FC7 pominięcie `UnitOverlayInputs::apply` (krok 8) | ZABITY | apply_matches…, siege_map_panel_gate…, frame_without_fog…, non_start_ui…, unexplored_hex… |
| FC8 pominięcie `apply_wonder_fog` | ZABITY | apply_matches…, wonder_fog_comes_after_wonder_sync, … |

Wszystkie 4 mutanty wymagane przez dispatch wykryte (FC1–FC4); zarzuty Evaluatora E1/E2/E4/E5 potwierdzone jako
zabite przez nowe testy Obrony (FC5 = E1 odtworzony niezależnie).

## 5. Kryteria końca dispatchu

| Kryterium | Stan |
|---|---|
| Test na ręcznych DTO: miasto, jednostka, oblężenie, mgła | `frame_inputs_hold_every_adapter_input` — SPEŁNIONE |
| Błąd (nie panika) przy złej długości `hex_state` / `fog.state` i `contract_version != 2` | `wrong_hex_state_length…`, `wrong_fog_state_length…`, `contract_version_other_than_2…` (0,1,3,MAX) — SPEŁNIONE |
| Test kolejności (porównanie z ręczną sekwencją w kolejności webu) | `apply_matches_the_web_call_sequence` + testy mgła-po-sync — SPEŁNIONE |
| Mutanty: kolejność mgła/miasta, brak `apply_city_fog`, brak bramki panelu, zły próg wersji | FC1–FC4 ZABITE — SPEŁNIONE |
| Idempotencja (2× `apply` = ten sam stan) | `apply_is_idempotent` (3×) — SPEŁNIONE |

## 6. Orzeczenia o zarzutach

| Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|
| Z1 (Evaluator, E1 `fog_active`) | ODDAL (naprawiony przez Obronę) | test `frame_without_fog…`; FC5 zabity |
| Z2 (E2 `showOceanBackdrop`) | ODDAL (naprawiony) | test `unexplored_hex_hides_the_ocean_backdrop`; E2 zabity wg Obrony, FC6 dodatkowo przechodzi przez tę ścieżkę |
| Z3 (E4/E5 `MapUiState`) | ODDAL (naprawiony) | test `non_start_ui_state_reaches_overlays_and_units`; asercje grupy terytorium i żetonu 902 |
| Z4 (zakres „not synced”) | ODDAL (naprawiony dokumentacją) | nagłówek frame.rs:85-105 + DŁUG-T1-NOT-SYNCED w 01-operator-r1.md; korekta Obrony o `is_city_panel_open` (bramka `main.ts:15583`) — trafna, potwierdzona asercją testu |
| D-T1-1 (okolica/teren w `FrameInputs`, nie w `MapStatic`) | ODDAL | odstępstwo od litery dispatchu uzasadnione: oba czytają `hex_state` (dynamiczne) |
| D-T1-5 (pominięte drugie `syncUnitsRender` w `refreshFog`) | ODDAL | ta sama lista jednostek; `sync` idempotentny (test 3× apply) |
| `q as i32` w `getTopY` (frame.rs:420) | ODDAL | pozycje oblężeń to współrzędne heksów (całkowite), wartość jak `topYAt` pinu |
| DŁUG-T1-LOCK (Cargo.lock bez `civ-view-model`) | ODDAL dla tematu, dług bazowy | poza allowlistą; `--locked` pada już na bazie 51f36370d |
| Dysk < 12 GB przy bramce | ODDAL (notatka procesowa) | brak równoległego buildu, bramka przeszła |

Brak orzeczeń NAPRAW. Brak spraw DO DECYZJI CZŁOWIEKA (temat bez reguł gameplay, wszystko z pinu).

## 7. Długi (do REJESTR-RUST.md przez orkiestratora)

- DŁUG-T1-LOCK — osobny mikrotemat z `renderer/Cargo.lock` w allowliście.
- DŁUG-T1-RESOLVERS — `wireUnitRendererRingStance` (`main.ts:10344-10384`) poza `MapScene`.
- DŁUG-T1-NOT-SYNCED — `syncStatChips`, `syncForestForUnits`, meshe obozów/wiosek/ulepszeń/zasobów/osad, `reapplyWonderHexDecorHides` → T2 (klient) lub rozszerzenie `MapScene`.
- Luki wejść L1/L2 (`revealAllLand`, `riverRevealKeys`) — `land_reveal = false` do czasu FOG-REVEAL.
- Notatka spoza tematu: `MAX_PER_SIDE=120` w `battle/field.rs` — nie ruszane.

## 8. Sprzątanie

Lokalna zmiana `renderer/Cargo.lock` cofnięta (`git checkout`), `frame.rs` przywrócony po mutantach (`cmp`),
target `t1fc/target` usunięty. `df -h /` po: 9,2 GB wolnego.
