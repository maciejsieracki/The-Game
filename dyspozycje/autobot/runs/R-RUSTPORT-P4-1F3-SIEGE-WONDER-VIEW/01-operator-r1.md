# R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW — Operator, runda 1

```text
STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW
GOAL: stan oblężenia (oblegane, siegeMachines.ready) i cudów (placedWorldWonders) w PlayableState z zapisem/odczytem
      oraz producenci sieges[] i wonders[] dla nakładek renderera (parytet z pinem 07d2fbd72)
ZMIANY/COMMIT: 81bb886707e6c4171a560baaa2e1de9b2a54bc4c (kod + testy); raport w osobnym commicie nad nim
TESTY: fmt EXIT 0, clippy --all-targets -D warnings EXIT 0, cargo test --all-targets --no-fail-fast EXIT 0
       (495 binarek, 3666 passed / 0 failed / 1 ignored — ignored to istniejący
       p6_order_lane::e2e::dump_tick1_econ_for_web_generator, nie z tego tematu); mutacje (a)(b)(c) FAIL
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

Baza: `origin/rust-port/parity-v2` = `585bb48e0f926a14435fa96b9402a711095ee16c` (sprawdzone `git rev-parse`
po fetch; zgodne z dispatchem). Gałąź robocza: `op/R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW-r1` (lokalna, bez push).
Pin: `07d2fbd72` (tylko `git show`).

## Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/playable.rs` | `PlayableState`: `oblegane: BTreeSet<CityId>`, `siege_machines_ready: BTreeMap<CityId, Vec<PlayableSiegeMachineKind>>`, `placed_world_wonders: Vec<PlayablePlacedWonder>` — wszystkie `#[serde(default, skip_serializing_if = …)]` (wzorzec P4-1J). Nowe typy `PlayableSiegeMachineKind` (`taran`/`wieza`, web `siegeMachines.ts:6`) i `PlayablePlacedWonder {wonderId,q,r,ownerId}` (web `wonderRenderer.ts:12-19` bez `ruin`). Dwa literały stanu (`new`, `empty`) uzupełnione. |
| `rust-port/engine/src/domain/save_load.rs` | `SaveSnapshot::with_playable_siege_wonders` / `restore_siege_wonders`, wolne `playable_city_siege_to_save`, `restore_playable_siege_wonders`, raport `SiegeWonderRestoreReport`. `placedWorldWonders` → `meta.placedWorldWonders` (web `main.ts:37450`, odczyt `:46459-46461`, nie-tablica ⇒ `[]`). `oblegane`/`siegeMachines.ready` → addytywny klucz `citySiege` (patrz decyzja 1). Pusty stan nie zostawia kluczy. |
| `rust-port/engine/src/domain/overlays_view.rs` | **NOWY** (na bazie nie istniał). `siege_views(state, are_enemies)`, `camp_owner_at_hex`, `machines_by_camp_hex`, `wonder_is_ruin`, `wonder_views_with_era`, `wonder_views`. |
| `rust-port/engine/src/domain/mod.rs` | tylko `pub mod overlays_view;` (pozycja alfabetyczna wymagana przez rustfmt). |
| `rust-port/engine/tests/view_overlays_siege_wonder.rs` | NOWY — 11 testów wektorów producenta. |
| `rust-port/engine/tests/view_overlays_siege_wonder_save.rs` | NOWY — 6 testów stanu i zapisu. |

`view-model`: **bez zmian**. `SiegeCampDto` nie jest re-eksportowany z korzenia crate, więc producent importuje go
ścieżką `civ_view_model::overlays::SiegeCampDto` (kształt DTO z P4-1F1 nienaruszony). `renderer/`, `gra/`: bez zmian.
`Cargo.lock`: niecommitowany.

## Reguły z pinu (źródło)

- Oblężenia: `refreshSiegeMarkers` `main.ts:17492-17530` — `cities.filter(c => c.oblegane)` (kolejność `cities`),
  obozy = każda jednostka pełnej listy `units` z `siegeAllowedBetween` i `hexDistance == 1`, jeden wpis na jednostkę
  (`:17501-17508`). Rust: `diplomacy_siege_war_gate::enemy_units_adjacent_to_city` (indeksy w kolejności `units`).
- Właściciel obozu: `campOwnerByHex` `render/siegeCampSync.ts:30-47`, `:43` — pierwsza jednostka **pełnej** listy
  na heksie z `ownerId !== cityOwnerId` (wołane z `main.ts:17514` z pełnym `units`). Rust: `camp_owner_at_hex`.
- Maszyny: `readyMachinesForCity` `siegeCampSync.ts:7-12` (`?? []`), rozkład round-robin `machinesByCampHex`
  `:14-27` — renderer; port `machines_by_camp_hex` w producencie do wektorów/użytku adaptera.
- Cuda: `placedWonderSnapshot` `main.ts:4205-4210`, `wonderIsRuin` `:4199-4203`: nieznany cud ⇒ `false`
  (`getWonderById` = tylko `data.cuda`, `wonders-data.ts:101`), inaczej `era > absolut` wprost (NaN ⇒ `false`).
  Epoka: `empire_epoch_for_owner` + `owner_era_facts` (jak `city_view`). Nieznany cud nie pyta o epokę.

## Decyzje techniczne (do rejestru)

1. **`citySiege` w zapisie.** Web trzyma `oblegane`/`siegeMachines` w obiektach `cities` zapisu, a `GameStateDto`
   (stan `SaveSnapshot`) ich nie ma. Dodano addytywny klucz top-level `citySiege: [{cityId, oblegane?, siegeMachines?:{ready}}]`
   (nazwy pól jak web, rosnąco po id). Odczyt łagodny (zły wpis/nie-tablica pomijane, jak inne pola opcjonalne);
   wpis nieznanego miasta pominięty i zgłoszony w raporcie. `queue`/`buildProgress` machin poza zakresem.
2. **`placedWorldWonders` pusty nie jest zapisywany** (web zawsze pisze `[]`) — warunek „golden zapisu bez zmian”.
   Wpis niewyrażalny w Rust (`wonderId` nie-napis, `q/r` nie-`i32`, `ownerId` nie całkowite ≥ 0) pominięty i zgłoszony
   (odchylenie od weba, który trzyma surowy obiekt; ten sam wzorzec co `PlannedMarchRestoreReport`).
3. **Relacja wrogości jest wejściem wołającego** (`are_enemies: Fn(i64,i64)->bool`, web `areEnemyOwners`) —
   `PlayableState` nie ma producenta `areEnemyOwners`; brak cichego domyślnego.
4. Fallback `_meta.absolut` (`wonders-data.ts:166-167`) nieosiągalny w Rust (`Cud.absolut` wymagane) — bez zmian
   względem rozpoznania (NIE_ZMIERZONO, czy wszystkie wpisy pinu mają `absolut`; Rust data: wszystkie mają).
5. Brak produkcyjnego wołającego producentów (`RenderViewDto` składa inny temat) — tak jak `city_view` w P4-1E.

## Wektory (test → pin)

| Wektor dispatchu | Test | Pin |
|---|---|---|
| stos 2 jednostek na heksie obozu → 2 wpisy | `stack_of_two_units_on_one_camp_hex_gives_two_entries` | `main.ts:17501-17508` |
| 3 maszyny na 2 obozy → round-robin | `three_machines_on_two_camps_round_robin`, `round_robin_over_duplicates_and_empty_inputs` | `siegeCampSync.ts:14-27`, `main.ts:17511` |
| jednostka nie-wroga obok miasta → pominięta | `non_enemy_unit_next_to_city_is_skipped` | `main.ts:17503-17505` |
| pierwsza jednostka na heksie ≠ właściciel ⇒ właściciel z pełnej listy | `camp_owner_is_first_non_city_owner_unit_of_full_list` | `siegeCampSync.ts:43`, `main.ts:17514` |
| kolejność/oblegane | `only_besieged_cities_in_cities_order` | `main.ts:17493`, `:17497-17498` |
| `era == absolut` nie ruina, `era > absolut` ruina | `wonder_ruin_boundary_equal_is_not_ruin` | `main.ts:4199-4203` |
| nieznany `wonderId` nie ruina | `unknown_wonder_is_never_ruin` | `main.ts:4201`, `wonders-data.ts:101,109-111` |
| `era = NaN` nie ruina | `nan_era_is_not_ruin` | `main.ts:4202` |
| kolejność i epoka właściciela | `wonder_views_keep_order_and_use_owner_era`, `production_wonder_views_use_state_epoch` | `main.ts:4205-4210`, `:2419` |
| golden zapisu bez nowych pól = bez zmian | `golden_state_files_reserialize_byte_identical`, `snapshot_without_new_fields_is_byte_identical`, `empty_fields_are_omitted_and_legacy_state_loads_with_defaults` | — |
| zapis/odczyt | `full_state_roundtrips_with_web_field_names_and_values`, `save_and_restore_roundtrip`, `restore_reports_unrepresentable_entries` | `main.ts:37450`, `:46459-46461` |

## Mutacje (każda w `overlays_view.rs`, przywrócenie potwierdzone `cmp`)

| Mutacja | Wynik `cargo test --test view_overlays_siege_wonder` |
|---|---|
| (a) `era > absolut` → `era >= absolut` | FAIL (exit 101): `wonder_ruin_boundary_equal_is_not_ruin`, `wonder_views_keep_order_and_use_owner_era` |
| (b) `camp_hexes.dedup_by_key(\|c\| c.hex)` | FAIL (exit 101): `stack_of_two_units_on_one_camp_hex_gives_two_entries` |
| (c1) właściciel = pierwsza jednostka na heksie bez filtra `!= cityOwner` | FAIL (exit 101): `camp_owner_is_first_non_city_owner_unit_of_full_list` |
| (c2) właściciel = jednostka obozu (bez pełnej listy) | FAIL (exit 101): `camp_owner_is_first_non_city_owner_unit_of_full_list` |

Mutacje uruchomione dwa razy (przed i po `cargo fmt`), wyniki identyczne.

## Bramki (`rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo, usunięty po bramkach)

- `cargo fmt --check` — EXIT 0
- `cargo clippy --all-targets -- -D warnings` — EXIT 0 (po poprawce jednego `doc_lazy_continuation` w nowym teście)
- `cargo test --all-targets --no-fail-fast` — EXIT 0; 3666 passed, 0 failed, 1 ignored (istniejący, nie z tego tematu)
- `git diff --check` — czysto
- Dysk: przed bramką pełnego testu `df -h /` = 8.4 GB wolne (na starcie 4.4 GB, zwolnione przez inne procesy);
  po buildzie 1.7 GB; po usunięciu target 5.5 GB.

Brak `#[ignore]` i osłabionych asercji w nowych testach.
