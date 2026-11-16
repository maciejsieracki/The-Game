STATUS: PASS
DOMAIN: INFRA
TEMAT: R-RUSTPORT-P4-INTEG-OVERLAY-1F5-1F4
GOAL: scalic na origin/rust-port/parity-v2 (9f7c55499, zawiera I2 i I3) dwa commity FC
  w kolejnosci: P4-1F5 REACH-PATH-VIEW (63b4f0dd8), potem P4-1F4 TRADE-WORKERS-OKOLICA-VIEW
  (1724516c2), bez gubienia funkcji, struktur i testow; bramki zielone.
ZMIANY/COMMIT:
  - 2cb065341 = merge --no-ff 63b4f0dd8 (P4-1F5) na 9f7c55499
  - e668add29 = merge --no-ff 1724516c2 (P4-1F4) na 2cb065341  <- SHA koncowego merge
  - commit tego raportu na e668add29 (tylko ten plik)
  Reczne rozwiazanie konfliktu wylacznie w rust-port/engine/src/domain/overlays_view.rs.
  Pozostale pliki obu tematow weszly automatycznie z commitow FC (pathfinding.rs z 1F5,
  okolica/sasiedztwo.rs z 1F4, testy, raporty runow) - bez recznych zmian.
  Cargo.lock nie commitowany (nieśledzony). Brak zmian w gra/ i renderer/.
TESTY: patrz sekcja Bramki.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: orkiestrator - FF rust-port/parity-v2 do SHA raportu (albo e668add29).
DEPLOY/PUSH: NIE WYKONANO

## Decyzje scalenia

### Merge 1: P4-1F5 (63b4f0dd8) na 9f7c55499 -> 2cb065341

Konflikt add/add w `overlays_view.rs`: baza ma plik z P4-1F6 (buildHighlight, selection),
1F5 tworzy plik od zera (reachable, pathRoute).

1. Naglowek modulu (`//!`): najpierw dokumentacja P4-1F6 (bez zmian), linia `//!`, potem
   dokumentacja P4-1F5 (bez zmian).
2. Importy scalone, duplikaty usuniete:
   - `use std::collections::HashSet;` - byl po obu stronach, zostaje raz;
   - `civ_view_model::overlays::{BuildHighlightDto, BuildHighlightKind, SelectionDto}` (1F6) +
     `civ_view_model::overlays::PathRouteDto` (1F5) -> jeden `use` z czterema nazwami;
   - `crate::domain::playable::PlayableUnit` (1F6) + `crate::domain::playable::PlayableState` (1F5)
     -> `use crate::domain::playable::{PlayableState, PlayableUnit};`;
   - reszta importow obu stron bez zmian (`civ_view_model as vm`, `civ_view_model::ids::HexCoord`,
     `crate::domain::OwnerRef`, `crate::domain::{PlayerId, PositionDto, UnitId}` itd.).
3. Cialo: najpierw cala sekcja 1F6 (BuildHighlightUi, BuildHighlightSources,
   filter_build_highlight_hexes, dedup_set_order, no_layer, build_highlight, SelectionUi,
   selection), potem cala sekcja 1F5 (stack_unit_like, unit_ids_of, hex_of,
   reachable_with_merge_targets, human_seats, is_me, awaiting_first_city, reachable_overlay,
   path_route_overlay). Zadna linia ciala nie zmieniona.
4. Kontrola mechaniczna: kazda linia obu stron jest w wyniku, poza 4 zastapionymi liniami `use`
   z pkt 2.
5. `mod.rs`: obie strony dodaly identyczna linie `pub mod overlays_view;` - git scalil bez konfliktu,
   wszystkie linie `pub mod` zachowane.

### Merge 2: P4-1F4 (1724516c2) na 2cb065341 -> e668add29

Konflikt add/add w `overlays_view.rs` (1F4 tworzy plik od zera: tradeRoutes, workerFields, okolica).

1. Naglowek: dotychczasowa dokumentacja (1F6 + 1F5), linia `//!`, dokumentacja 1F4 (bez zmian),
   potem atrybut `#![forbid(unsafe_code)]` z 1F4 (dotyczy teraz calego modulu; zaden z kodow
   1F5/1F6 nie uzywa `unsafe`, clippy/test zielone).
2. Importy scalone:
   - `HashMap` (1F4) + `HashSet` -> `use std::collections::{HashMap, HashSet};`; `use std::fmt;` z 1F4;
   - `civ_view_model::{CityId, HexCoord, OkolicaViewDto, OwnerRef, TileYieldDto, TradeMedium,
     TradeRouteDto, WorkerFieldDto}` (1F4): `HexCoord` usuniety jako duplikat
     (`civ_view_model::HexCoord` to re-eksport `civ_view_model::ids::HexCoord`, ten sam typ, juz
     importowany); `OwnerRef` usuniety z importu - patrz pkt 3; reszta nazw zostaje;
   - `improvement_build::{hex_keys_within_radius, BuildMap}` (1F4) + `is_mine_improvement_key` (1F6)
     -> jeden `use`;
   - pozostale importy 1F4 (terrain_map, okolica, terrain, territory, trade, turn_economy_territory,
     City) dopisane bez zmian.
3. Kolizja nazwy `OwnerRef`: 1F4 uzywa `civ_view_model::OwnerRef` (`OwnerRef::from_legacy_i64`),
   1F5 uzywa `crate::domain::OwnerRef` (`OwnerRef::Player(PlayerId)` dla `HumanSeats` i
   `is_awaiting_first_player_city`). To dwa rozne typy - nie da sie zaimportowac obu pod ta sama
   nazwa. Rozwiazanie: w jedynej funkcji 1F4, ktora go uzywa (`owner_ref`), sciezka zmieniona na
   `vm::OwnerRef` (alias `civ_view_model as vm` istniejacy w module z 1F6; ten sam zabieg co w
   `selection()` z 1F6). Zmienione dokladnie 2 linie:
   `fn owner_ref(owner_id: i64) -> Result<vm::OwnerRef, OverlaysViewError>` i
   `vm::OwnerRef::from_legacy_i64(owner_id)...`. Typ i semantyka identyczne; publiczne API
   (`Result<Vec<WorkerFieldDto>, _>`, `Option<OkolicaViewDto>`) bez zmian.
4. Cialo: sekcje 1F6, 1F5 bez zmian, na koncu cala sekcja 1F4 (OverlaysWorld, OverlaysUi,
   OverlaysViewError + Display + Error, owner_ref, city_hex, map_hex_yield, okolica_yield,
   okolica_cities, trade_routes_view, worker_fields_view, okolica_view). Brak kolizji nazw funkcji
   i typow miedzy trzema sekcjami.
5. Kontrola mechaniczna: kazda linia obu stron jest w wyniku, poza zastapionymi liniami `use` (pkt 2)
   i dwiema liniami `owner_ref` (pkt 3).
6. `mod.rs`: identyczna linia `pub mod overlays_view;` po obu stronach; auto-merge bez zmian
   (`git diff HEAD -- mod.rs` po merge pusty), wszystkie linie `pub mod` zachowane.

### Uwaga (bez zmiany kodu, poza zakresem integracji)

Dokumentacja `SelectionUi` (1F6) mowi, ze `PlayableState.selected_unit_id` nie jest czytany
przez producenta zaznaczenia (D-CMD-12: zaznaczenie przychodzi jako stan UI), natomiast
`reachable_overlay` / `path_route_overlay` (1F5) czytaja `state.selected_unit_id`. Teraz oba
podejscia sa w jednym module. Nie zmienialem semantyki (zakaz w zadaniu) - do decyzji
technicznej przy wpieciu agregatora `OverlaysViewDto` (P4-1G Q6 / PRIO-3D-2).

## Bramki

Srodowisko: `rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0
CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo. Dysk przed bramkami:
13 GB wolnego (po merge 1), 15 GB (po merge 2).

| Bramka | po merge 1 (2cb065341) | po merge 2 (e668add29) |
|---|---|---|
| `cargo fmt --check` | 0, bez wyjscia | 0, bez wyjscia |
| `cargo clippy --all-targets -- -D warnings` | 0 | 0 |
| `cargo test --all-targets --no-fail-fast` | ENG_TEST=0; 500 sum `test result`; 3701 passed, 0 failed, 1 ignored | ENG_TEST=0; 501 sum `test result`; 3708 passed, 0 failed, 1 ignored |

- `view_overlays_build` (1F6): 9 passed; `view_overlays_reach_path` (1F5): 14 passed;
  `view_overlays_trade_workers` (1F4): 7 passed.
- 1 ignored = istniejacy wczesniej test w `tests/p6_order_lane.rs`; diff 9f7c55499..e668add29 nie
  dodaje zadnego `#[ignore]` (grep = 0).
