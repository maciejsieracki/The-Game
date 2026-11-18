# R-RUSTPORT-P4-364-RENDER-FRAME-R1 — Final Control, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-RENDER-FRAME-R1
GOAL: składacz pełnej ramki renderera (`RenderLayersDto`) i mapy statycznej (`MapViewDto`) z `PlayableState` + sesji mgły, wystawiony przez most komendami `GetRenderMap` / `GetRenderFrame` (D-R3-1..6).
ZMIANY/COMMIT: oceniany kod = commit Obrony `e7d93127e88e9a27e16c1053e80f30809a75de9d` (rodzic `08ab91229` Operatora, ten na `0f77c9da3` = BAZA dispatchu; `git merge-base --is-ancestor 0f77c9da3 e7d93127e` = tak). FC dodaje wyłącznie ten raport + `gate-full-test-fc.log` + `mutate-fc.log` (gałąź `rust-port-wip/R-RUSTPORT-P4-364-RENDER-FRAME-R1-fc`).
TESTY: fmt EXIT 0; clippy `--all-targets -D warnings` EXIT 0; `--test p4_364_render_frame` 20 passed EXIT 0; pełne `cargo test --all-targets --no-fail-fast` (engine) EXIT 0 — 527 bloków `ok`, 3948 passed, 0 failed, 1 ignored (sprzed tematu); mutacje Obrony 14/14 FAIL (odtworzone przez FC).
BLOKADY: brak. (BLOCK INFRA Obrony zdjęty: FC wykonał pełną bramkę przy 8720 MiB wolnego.)
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (uwaga: `origin/rust-port/parity-v2` przesunęło się na `4b27bc689` — wymagany merge-tree/ponowna bramka przy integracji) + wpis decyzji N1 w `REJESTR-RUST.md`.
DEPLOY/PUSH: NIE WYKONANO

## Bramki odtworzone samodzielnie (FC)

Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` = scratchpad (poza repo), usunięty po bramkach.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p4_364_render_frame` | 20 passed (19 tematu + 1 z `bridge.rs` przez `#[path]`), EXIT 0 |
| `mutate-obrona-r1.py` | 14/14 FAIL (dispatch a1, a2, b, c, d, e + E2, E3-odwr., E4, E5, E5b, E6, Z3); `git status` czysty po biegu; log `mutate-fc.log` |
| `cargo test --all-targets --no-fail-fast` (engine, w tle `setsid nohup`, EXIT w logu) | dysk przed startem 8720 MiB (≥ 8 GB); EXIT 0; 527 bloków `test result: ok`; 3948 passed / 0 failed / 1 ignored; log `gate-full-test-fc.log` |

## Allowlista (`git diff --stat 0f77c9da3 e7d93127e`)

- `engine/src/domain/render_frame.rs` (nowy), `engine/src/domain/mod.rs` (+1 `pub mod render_frame;`), `engine/src/bridge.rs`, `engine/tests/p4_364_render_frame.rs` (nowy), katalog runs — na liście.
- `engine/tests/p4_364_bridge_layers.rs` (1 linia, `BridgeResult::State {..}` → `_` w `match`) — spoza listy, mechaniczne, zadeklarowane w raporcie Operatora. Przyjęte.
- `playable.rs`, `dto_bridge.rs`, `map_view.rs`, `city_view.rs`, `overlays_view.rs`, `recruitment.rs`, view-model, renderer: bez zmian. `Cargo.lock` niecommitowany. `git diff --check`: czysto. Brak `#[ignore]`. Commity bez `Co-Authored-By` (#289).
- `CONTRACT_VERSION` mostu = 1 (test g + mutant e).

## Zgodność z D-364-R3 (weryfikacja kodu)

- D-R3-1: `GetRenderMap`/`GetRenderFrame` w dyspozytorze zwracają przed `execute`, `events: Vec::new()`; `EnginePort` z domyślnym `engine_rejected`; Mock odrzuca. OK.
- D-R3-2: `RenderUiParams` camelCase, `#[serde(default)]`, `deny_unknown_fields`, nazwy z `BuildHighlightUi`/`SelectionUi`. OK.
- D-R3-3: po Obronie `overlays_view` (`render_frame.rs:765`) czyści `selection`/`reachable`/`pathRoute` przy `ui.build_mode_open || build_highlight_mode_active` — zgodne z `onOpenBuild` (`main.ts:26702-26703` @ `07d2fbd72`: `clearPlayerUnitSelection()` przed jakimkolwiek kluczem). OK.
- D-R3-4: czysta funkcja w nowym module; odstępstwo `&mut PlayableFogSession` (D-OP-1) — jedyna mutacja = kumulacja eksploracji sesji, jak `GetRenderLayers` r2; `PlayableState` nietknięty (test f). Przyjęte. Luki jawne w `RENDER_FRAME_GAPS`, wartości stałe w `RENDER_FRAME_STATE_DEFAULTS`, oba sprawdzane testem `h_jawne_luki_ramki`.
- D-R3-5: `viewer` = fotel, `turn` = `state.turn`, `hexState` równoległe do `map.hexes` (test b). OK.
- D-R3-6: bez nowego pola sesji (D-OP-2, `snapshot_map_of`). OK.
- Filtr terytorium porównany z pinem `main.ts:15582-15601` (`isMe || !fogOn || vis.has || explored.has`) — 1:1.

## Orzeczenia zarzutów

| # | Zarzut (Evaluator r1) | Stan po Obronie | Orzeczenie |
|---|---|---|---|
| 1 | `buildModeOpen` bez klucza nie czyścił selekcji (D-R3-3) | naprawione (`render_frame.rs:765`), test `c_tryb_budowy_…` z przypadkiem bez klucza, mutant E3-odwr. FAIL | ODDAL (rozwiązany) |
| 2 | brak wektorów dla terytorium pod mgłą, `besieged`, `sieges`, `hp` z ekonomii | 3 nowe testy; mutanty E2, E4, E5, E5b, E6 FAIL (odtworzone przez FC) | ODDAL (rozwiązany) |
| 3 | ciche zero `hp = 0`/pusty `typeId` przy braku definicji | `RenderFrameError::UnknownUnitType`, test + mutant Z3 FAIL | ODDAL (rozwiązany) |
| 4 | liczba testów w raporcie (15+1) | skorygowane w `02a-obrona.md` (19+1 = 20, zgodne z biegiem FC) | ODDAL (rozwiązany) |
| 5 | wartości stałe spoza stanu tylko w raporcie | `RENDER_FRAME_STATE_DEFAULTS` + test | ODDAL (rozwiązany) |
| INFRA | pełna bramka Obrony BLOCK (dysk 7,9 GiB) | FC wykonał pełną bramkę: EXIT 0, 3948/0 | ODDAL (zdjęte) |

Brak NAPRAW. Brak pozycji DO DECYZJI CZŁOWIEKA (właściciela).

## Uwagi dla orkiestratora (nie blokują)

- **N1 (decyzja techniczna orkiestratora, reguła 8 — wpis w `REJESTR-RUST.md`)**: ramka jest bezstanowa i przy `buildModeOpen = true` zawsze zwraca pustą selekcję. W webie `selectPlayerUnit` (`main.ts:7233-7269` @ `07d2fbd72`) nie zamyka trybu budowy, więc stan „panel budowy otwarty + jednostka zaznaczona później” jest w webie osiągalny, a w ramce nie (klient musiałby wysłać `buildModeOpen = false`). Kod stosuje literę D-R3-3; jeśli orkiestrator chce pełnego odwzorowania, potrzebne jest rozróżnienie „selekcja sprzed otwarcia” vs „po otwarciu” w `RenderUiParams` (osobny temat, r2 lub następczy).
- **N2**: luki jawne do następnych tematów: `overlays.workerFields`, `buildHighlight.hexes`, `stacks.vitalsByRepId`/`starvingRepIds`/`goldDeficitRepIds`, `hpMaxEffective` (zależne od EKONOMIA-STAN #310 i adapterów `canFoundCity`/`getQualifyingHexes`).
- **N3**: baza parity przesunęła się (`0f77c9da3` → `4b27bc689`); przed FF wykonać `git merge-tree` i bramkę na wyniku merge.
- **N4**: root `tests/bridge_contract.rs` (poza skrzynką Cargo) ma niewyczerpujący `match` — dług sprzed tematu (od r2).

## Werdykt

PASS-WITH-NOTES — bramki zielone (w tym pełna bramka engine wykonana przez FC), allowlista dochowana, mutacje (a)–(e) i mutanty Evaluatora zabite, wszystkie zarzuty rozwiązane w Obronie; uwagi N1–N4 dla orkiestratora.
