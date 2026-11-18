# R-RUSTPORT-P4-371-T1-FRAME-ADAPTER — 02a obrona Operatora (r1)

STATUS: PASS (wszystkie zarzuty PRZYJĘTE; jedna korekta treści Z4 — patrz niżej)
DOMAIN: GAME (renderer, warstwa CPU)
TEMAT: R-RUSTPORT-P4-371-T1-FRAME-ADAPTER
GOAL: `view::frame` — DTO ramki → komplet wejść → `MapScene::apply` w kolejności pinu `07d2fbd72`.
BAZA OBRONY: `279c19e9d` (Evaluator, gałąź `eval/P4-371-T1-frame`, nad kodem Operatora `70e532033`, baza dispatchu `51f36370d`).
GAŁĄŹ OBRONY: `op/P4-371-T1-obrona` (lokalnie, bez push).
ZMIANY/COMMIT: `rust-port/renderer/src/view/frame.rs` (tylko komentarze/rustdoc, bez zmiany kodu wykonywalnego),
`rust-port/renderer/tests/view_frame.rs` (3 nowe testy + parametryzacja sekwencji ręcznej),
`dyspozycje/.../01-operator-r1.md` (dopisek w „Długi”), ten raport. Wszystko w allowliście dispatchu.
Commit: patrz sekcja „Commit” na końcu.

## Odpowiedzi na zarzuty

### Z1 (mutant E1: `fog_active` zastąpione `true`) — PRZYJMUJĘ
- Poprawka: test `frame_without_fog_matches_the_web_else_branch` — ramka z `viewer.fog_active = false`
  (gałąź `else` `refreshFog`, `main.ts:13505-13513`: `setFog(ALL_KEYS, ALL_KEYS)`,
  `cityRenderer.applyFogVisibility(ALL_KEYS, false, ME())`, `wonderRenderer.applyFogVisibility(ALL_KEYS, false)`).
  Asercje: `fog.fog_on == false`, `visible` = 8 heksów (ALL_KEYS), stan `MapScene` == ręczna sekwencja
  adapterów (`manual_web_sequence_for`) dla tej ramki, miasto 9 i cud na kolumnie „tylko odkryte” widoczne,
  `show_ocean_backdrop == true`, stan różny od ramki z mgłą.
- Dowód: mutant E1 (`FogSets::from_dto(m, &layers.fog, true)`) — test PADA (`tests/view_frame.rs:759`,
  20/21). Bez mutanta 21/21.

### Z2 (mutant E2: wynik `apply_terrain_fog` ignorowany) — PRZYJMUJĘ
- Poprawka: test `unexplored_hex_hides_the_ocean_backdrop` — heks (1,1) z kodem mgły 0 (nieodkryty) przy
  aktywnej mgle; `setFog` ukrywa pryzmat i zwraca `showOceanBackdrop = false` (`scene.ts:3532-3548`).
  Asercje: `show_ocean_backdrop() == false`, stan == ręczna sekwencja, ramka bazowa nadal `true`.
- Dowód: mutant E2 (`let _ = apply_terrain_fog(...)`) — test PADA (`tests/view_frame.rs:780`, 20/21).

### Z3 (mutanty E4 i E5: `&MapUiState` podmieniony na `WEB_INITIAL`) — PRZYJMUJĘ
- Poprawka: test `non_start_ui_state_reaches_overlays_and_units` — UI: granice, szlaki, ikony robotników
  wyłączone, `force_visible_unit_id = Some(902)`, `city_panel_view_city_id`/`hover_stat_chip_city_id` ustawione;
  jednostka 902 gracza 1 dodana na (2,1) POZA `stacks.visible_ids`. Asercje: `f.ui == ui`, grupa terytorium
  `None` (a `Some` przy `WEB_INITIAL`), bramka `territoryBorderVisible || isCityPanelOpen()` (`main.ts:15583`)
  sprawdzona dodatkowo dla `is_city_panel_open = true`; stan == ręczna sekwencja z tym UI; żeton 902 widoczny
  (`setForceVisibleUnitId`, `main.ts:14550`; `map_units/mod.rs:455-460`), a przy `WEB_INITIAL` ukryty; stany różne.
- Dowód: E4 (`overlay_layers(..., &MapUiState::WEB_INITIAL)`) — test PADA (`:804`, 20/21);
  E5 (`sync_units(..., &MapUiState::WEB_INITIAL)`) — test PADA (`:813`, 20/21).

### Z4 (dokumentacja zakresu) — PRZYJMUJĘ, z jedną korektą faktów
- Poprawka w nagłówku `view/frame.rs`: zdanie „whose calls are the ones every frame needs” zastąpione opisem,
  że `MapScene` wykonuje wywołania sekwencji trafiające do rendererów, które posiada; nowa sekcja
  „Not synced by MapScene”: `cityRenderer.syncStatChips` (`main.ts:14563`), `syncForestForUnits` (`:14562`),
  `syncCampMeshes`/`syncVillageMeshes` (`:13488-13489`), `syncResourceOverlayFog`/`syncImprovementMeshFog`/
  `syncSettlementMeshFog` (`:13495-13497`, `:13507-13509`), `reapplyWonderHexDecorHides` (`:4317`), z portami CPU.
  Wpis DŁUG-T1-NOT-SYNCED w sekcji „Długi” `01-operator-r1.md`.
- Cytaty poprawione wg `git show 07d2fbd72:gra/src/main.ts`: `setFog` `:13489` → `:13491`; ponowny
  `syncUnitsRender` `:13501` → `:13502`; dodatkowo (wykryte przy sprawdzaniu): `syncWorkerFieldOverlayFog`
  `:13497` → `:13498`, `refreshTerritoryBorderOverlay` `:13517` → `:13518`, koniec `refreshFog` `:13520` → `:13519`,
  `landReveal` `:13489-13494` → `:13491-13494`, `wonderRenderer.sync` `:4315-4318` → `:4316`.
- KOREKTA (częściowe ODRZUCENIE tezy o polach): `MapUiState::is_city_panel_open` MA odbiorcę w `MapScene` —
  `territory_border_group`/`territory_ranges_border_group` (`view/overlays.rs:382`, `:498`) wg pinu
  `if (!(territoryBorderVisible || isCityPanelOpen()))` (`main.ts:15583`). Bez odbiorcy jest tylko jego rola
  `hideStatChips`. Dowód: asercja `frame_ui(&l, &panel, false).overlays.territory.is_some()` w teście Z3.
  Pola `city_panel_view_city_id` i `hover_stat_chip_city_id` — bez odbiorcy w `MapScene` (zgoda z Evaluatorem).
  Tak zapisano w nagłówku i w „Długi”.

### Odnotowane przez Evaluatora (nie zarzut)
- DŁUG-T1-LOCK potwierdzony: lokalnie `cargo test` bez `--locked` uzupełnił `renderer/Cargo.lock`; bramki z `--locked`
  na uzupełnionym locku; zmiana locka cofnięta (`git checkout`), NIE commitowana.
- Dysk przy starcie bramek: 11 GB wolnego (< 12 GB z dispatchu), brak innego `rustc`/`cargo` (`pgrep`), target
  w scratchpadzie tematu — jak u Evaluatora; odnotowane jawnie.

## TESTY
- Mutanty obrony (skrypt `scratchpad/t1frame/mut.sh`, przywrócenie pliku sprawdzone `cmp`): E1, E2, E4, E5 — ZABITE.
- `cargo test --test view_frame`: 21/21.
- Bramki (`rust-port/renderer`, bez `--features gpu`): WYNIKI PONIŻEJ.

- `cargo fmt --all -- --check`: EXIT 0.
- `cargo clippy --locked --all-targets -- -D warnings`: EXIT 0.
- `cargo test --locked --all-targets` (pełny, w tle `setsid nohup`, log w scratchpadzie `t1frame/test.log`):
  EXIT 0 — 81 binarek, 708 passed / 0 failed / 0 ignored (Evaluator: 705; +3 nowe testy `view_frame`, 21/21).
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
  tematu, usunięty po bramkach.

BLOKADY: brak.
RUNDY: obrona r1 (runda 1/5).
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO.
