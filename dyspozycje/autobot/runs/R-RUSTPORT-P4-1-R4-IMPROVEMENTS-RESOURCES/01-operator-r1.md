# R-RUSTPORT-P4-1-R4-IMPROVEMENTS-RESOURCES — Operator, runda 1

```text
STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-R4-IMPROVEMENTS-RESOURCES
GOAL: ulepszenia, nakładki zasobów i wioski per heks w rendererze 3D z DTO (R4 kontraktu P4-1, §4 P4-1G-ADAPTER-ROZPOZNANIE.md), z mgłą z wejścia
ZMIANY/COMMIT: allowlista (lista niżej); SHA commitu w podsumowaniu rundy orkiestratora (commit zawiera ten raport)
TESTY: improvements_sync_r4 12/12 ok; mutacje (a)(b)(c) FAIL (dowód §5); cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --all-targets --no-fail-fast NIE URUCHOMIONY (dysk, §6)
BLOKADY: INFRA/dysk: wolne miejsce na / spadło z 11 GB (start) do 4.1 GB przed clippy i 1.9-2.1 GB przed bramką testów (inne procesy na maszynie; własny CARGO_TARGET_DIR = 192 MB, usunięty); reguła dispatchu < 8 GB = BLOCK; brak blokad w kodzie
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator: zwolnić dysk do >= 8 GB i uruchomić cargo test --all-targets --no-fail-fast w rust-port/renderer na tym commicie (zmiany są wyłącznie addytywne: nowy moduł + jedna linia lib.rs + nowy test); potem Evaluator
DEPLOY/PUSH: NIE WYKONANO
```

BAZA: `2edc808d7` (detached, `origin/rust-port/parity-v2`), sprawdzone `git rev-parse HEAD` = `2edc808d7137e76fdf66e46e846faa802e3a9cd8`.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/main.ts` (lokalizacje z `git grep` z dispatchu; numery zweryfikowane w pinie, niektóre różnią się od dispatchu o 1–3 linie — w kodzie są numery z pinu).

## 1. Zmiany (wyłącznie allowlista)

| plik | co |
|---|---|
| `rust-port/renderer/src/improvements/mod.rs` (NOWY) | `pub mod sync;` |
| `rust-port/renderer/src/improvements/sync/mod.rs` (NOWY) | `MapObjectsLayer` (stan `improvementMeshes` / `resourceOverlays` / `villageMeshes` w kolejności wstawiania webu): `spawn_improvement_mesh` = `spawnImprovementMesh` (`main.ts:17043-17102`), `sync_resource_overlay_at_hex` = `:3199-3231`, `rebuild_resource_overlays` = `:3233-3264`, `sync_livestock_and_placed_meshes` = `:16234-16251`, `sync_village_meshes` = `:3360-3399`, mgła `sync_resource_overlay_fog` / `sync_improvement_mesh_fog` / `sync_settlement_mesh_fog` = `:3284-3292` / `:3314-3329` / `:3430-3443`, `apply_fog` (kolejność `refreshFog` `:13495-13497`), `sync_snapshot` (kolejność `runDeferredResourceOverlaysAfterHide` `:3272-3281`); dokumentacja luk G1–G6 i obozów |
| `rust-port/renderer/src/improvements/sync/build.rs` (NOWY) | budowniczy per heks: `merged_improvement_layers` (`:3126-3137`), `build_improvement_visual` (`:3162-3173`, `road_mask` wymagany, bez domyślnego), `keeps_relief_under_improvement` (`:16839-16849`), `improvement_relief_sampler` (`:16857-16864`), `improvement_mesh_placement` (`:16867-16875`), `build_improvement_group` (wzgórze + tarasy `:17085-17090`, collapse, pozycja), bramki zasobu (`isWaterTerrain`, `isDepositOverlaySuppressed` `:3102-3110`, `visibleZloze`), `compact_deposit_at_edge` (`:3058-3094`), `build_resource_overlay`, `build_village_group` (`:3381-3386`), `apply_hex_fog` |
| `rust-port/renderer/src/improvements/sync/input.rs` (NOWY) | `HexObjectsInput` / `MapObjectsInput::from_dto(map, hexState)` (błąd `LengthMismatch` zamiast obcięcia), `ExternalInputs` (wartości spoza DTO, bez `Default`), konwersja `Nakladka` DTO → renderer (pełny `match`) |
| `rust-port/renderer/src/lib.rs` | wyłącznie linia `pub mod improvements;` |
| `rust-port/renderer/tests/improvements_sync_r4.rs` (NOWY) | 12 testów |
| `rust-port/renderer/tests/fixtures/improvements_sync/r4_vectors.json` (NOWY) | mapa 4×3 (12 heksów: ulepszenie z `road_mask` 5, zasób z `zloze`, `zloze` None i `''`, woda, wioska widoczna/odkryta/we mgle, hodowla, lama, epoka, ulepszenie dedykowane, tarasy na wzgórzu), stałe i oczekiwane kolejności przepisane ręcznie z pinu, `plik:linia` przy każdej wartości |
| ten raport | |

Nie zmieniono: `view-model/**`, `engine/**`, `gra/`, `view/**` (w tym `view/cities.rs`, `view/overlays.rs`), `cities/**`, `rivers/**`, `decor/**`, `map_units/**`, `models/improvements/registry.rs`, `zasoby.rs` (tylko import). `Cargo.lock` (zmieniony lokalnie przez cargo) przywrócony, poza commitem.

## 2. Decyzje techniczne (zapis dla rejestru)

- **D-DTO-1 = A.** Renderer bierze z DTO: `ulepszenia`, `road_mask`, `zloze`, `village_present`, `nakladka`, teren. Niczego nie wyprowadza z innych pól. Wartości, które pin czyta na tych ścieżkach, a których DTO nie niesie, wchodzą przez `ExternalInputs` (jawnie, bez wartości domyślnej). Luki (§4) opisane w kodzie (`improvements/sync/mod.rs`).
- **Warstwa hodowli ze złoża (`foodLayerFromAnimalDeposit`, `bydlo`/`owce`).** Przeniesiona 1:1, bo w pinie to część kompozycji renderu (`mergedImprovementLayers`, komentarz pinu `main.ts:3124-3125`: „(render)”), a te złoża nie mają nakładki zasobu (`isDepositOverlaySuppressed`, `:3102-3104`). Bez niej złoże bydła/owiec byłoby niewidoczne. Tabela 2 wpisów, bez danych gry.
- **T1 — snapshot zamiast zdarzeń.** Pin usuwa siatkę ulepszenia tylko, gdy zdarzenie woła `spawnImprovementMesh` na tym heksie. Snapshot DTO nie ma zdarzeń, więc `sync_snapshot` respawnuje także heksy, które jeszcze mają siatkę; heks z pustymi warstwami traci ją dokładnie jak w `:17067-17071`. Test `later_snapshot_removes_stale_groups`.
- **Sąsiedzi drogi (`syncRoadNetworkAt`, `:17031-17041`).** Nie przeniesione: DTO ma gotowy `road_mask` każdego heksa (D-DTO-4 = A), a snapshot respawnuje każdy heks z warstwami. Pojedynczy `spawn_improvement_mesh` = pin z `bulkImprovementRebuild = true`.
- **`compactDepositAtEdge` / `geo.translate`.** Geometria bezpośredniego dziecka jest przebudowana jako bufor (kolory wierzchołków zachowane). W three translacja zmienia obiekt geometrii w miejscu (także współdzielony); tu kopia jest lokalna dla nakładki. Typ geometrii po translacji to `BufferGeometry`.
- **`topYAt`** = `terrain_top_y(teren)` (`height + yOffset`, jak `TerrainPickScene::top_y_at`; sprawdzone w `cities_web_parity` / `pick_golden`).
- **Nie przeniesione (inne tematy albo zdarzenia, nie stan DTO):** `syncImprovementDecorForHex` / `hideDecorAtHex` (`:16877-16946`, dekor R2), siatki wycinki lasu (`clearingMeshes`, `:3322-3328`), duchy budowy (`showGhostImprovement`, `:15817-15844`), zwalnianie GPU (`disposeMergedDecor`, `releaseMergedDecorCpuArraysAfterUpload`). `renderer.shadowMap.needsUpdate` jest flagą `take_shadow_map_update()`.

## 3. Obozy barbarzyńców — NIE_ZMIERZONO

`syncCampMeshes` (`main.ts:3401-3427`) czyta `barbCamps`. W `view-model` nie ma pola obozów barbarzyńców (`grep -rni "camp\|barb\|oboz" view-model/src` → tylko `OwnerRef::Barbarian` i `SiegeCampDto`, który jest obozem oblężniczym przy mieście, innym obiektem). Zgodnie z DECYZJAMI dispatchu: brak kodu obozów, brak nowego pola. `syncSettlementMeshFog` jest przeniesione tylko w części wiosek. Test `no_camp_groups_without_dto_field` pilnuje, że nic „obozowego” nie powstaje.

## 4. Luki DTO (pin czyta, DTO nie niesie) — wejście `ExternalInputs` albo brak

| ID | Pin | Co tu | Skutek, jeśli wywołujący poda złą wartość |
|---|---|---|---|
| G1 | `visibleZloze(hex, overlayDepositEra)` (`main.ts:3213`, `map/deposit-era.ts:18-28`: epoka, `wegiel` nigdy) | `ExternalInputs::zloze_hidden` | DTO `zloze` to surowe `HexExt.zloze` (`engine/src/domain/map_view.rs`, `build_hex_dyn`); bez zbioru złoża metali z przyszłej epoki byłyby rysowane |
| G2 | `hexSuppressesResourceOverlay` (`:3113-3121`, ulepszenie dedykowane złożu) | `ExternalInputs::deposit_overlay_suppressed` | ikona złoża pod np. glinianką |
| G3 | `isLamaDepositVisibleForCiv(civ)` (`:3105-3107`) | `ExternalInputs::lama_deposit_visible` | lama widoczna/niewidoczna wbrew cywilizacji |
| G4 | `showResourceDepositOverlay` (UI, `:15423`) | `ExternalInputs::show_resource_deposit_overlay` | — (przełącznik UI, jak L4) |
| G5 | `improvementKeysForHex`: normalizacja kluczy (`LEGACY_KEY_ALIASES`: `pastwisko`→`bydlo`, odrzucenie nieznanych) i zapasowe `hex.ulepszenie` przy braku `ulepszenia` (`game/terrain-improvements.ts:117-123`, `:358-380`) | **nie robione**: warstwy z `ulepszenia` jak przyszły (pomijane `''` i `brak`, bez duplikatów) | heks z samym `ulepszenie` (bez `ulepszenia`) nie ma siatki; klucz legacy trafia do budowniczego bez aliasu |
| G6 | `preservesHillRelief(layers)` (`game/relief-preserving-improvements.ts:44-46`) w `keepsReliefUnderImprovement` | `ExternalInputs::preserves_hill_relief` | sektor ulepszenia na wzgórzu/górze na wierzchu heksa zamiast na stoku |
| — | `improvement_key` | przenoszone, nieczytane | pin nie czyta `improvementKey` w renderze (`git grep improvementKey` w `render/` i `main.ts` → tylko zapis `:16281`, `:16286`) |

Propozycja (osobny temat, zmiana kontraktu `view-model` + producenta, nie tutaj): pola producenta per heks — `zloze` już po `visibleZloze`, `deposit_overlay_suppressed`, `layers = improvementKeysForHex`, `keeps_relief` (ten sam predykat co proponowane w Q2 `decor_hidden`).

## 5. Testy i mutacje

`cargo test --test improvements_sync_r4`: **12 passed, 0 failed, 0 ignored**:
`from_dto_pairs_hexes_and_rejects_length_mismatch`, `merged_layers_follow_pin`, `improvement_mesh_uses_dto_road_mask_and_pin_placement`, `terraces_and_livestock_layers`, `relief_sampler_needs_external_predicate`, `resource_overlay_gates`, `deposit_marker_placement`, `snapshot_orders_match_pin_call_order`, `villages_follow_dto_and_fog`, `overlay_and_improvement_fog`, `later_snapshot_removes_stale_groups`, `no_camp_groups_without_dto_field`.

Mutacje (skrypt podmieniał jedną linię, uruchamiał `cargo test --test improvements_sync_r4`, przywracał; `git status` po przywróceniu bez zmian w `src/`):

| mutacja | zmiana | wynik |
|---|---|---|
| (a) `road_mask` zignorowany | `build.rs`: `u32::from(road_mask)` → `u32::from(road_mask) \| 0b11_1111` (zawsze pełna gwiazda) | **FAIL**, exit 101: `improvement_mesh_uses_dto_road_mask_and_pin_placement` (11 passed, 1 failed) |
| (b) wioska pokazana we mgle | `mod.rs` `sync_settlement_mesh_fog`: po `apply_hex_fog` dopisane `visible = true` | **FAIL**, exit 101: `villages_follow_dto_and_fog` (11 passed, 1 failed) |
| (c) zaprzeczenie warunku `zloze` | `build.rs` `zloze_shown`: `if z.is_empty() \|\|` → `if !z.is_empty() \|\|` | **FAIL**, exit 101: `resource_overlay_gates`, `deposit_marker_placement`, `overlay_and_improvement_fog`, `snapshot_orders_match_pin_call_order` (8 passed, 4 failed) |

Uwaga do (c): dla `zloze` = `None`/`''` sam budowniczy `build_styled_resource_overlay` zwraca `None` (`zasoby.rs`, `_ => return None`), więc asercje „brak nakładki” dla tych heksów nie mogą same spaść; mutacja jest wykrywana przez heksy z prawdziwym `zloze` (`miedz`), które tracą nakładkę.

## 6. Bramki (`rust-port/renderer`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` unikalny poza repo w katalogu scratchpad sesji, usunięty po bramkach)

| bramka | `df -h /` przed bramką (Avail) | wynik |
|---|---|---|
| `cargo check --lib` + `cargo test --test improvements_sync_r4` (robocze) | 9.7 GB | EXIT 0, 12 passed |
| `cargo fmt --check` | nie mierzone tuż przed (fmt nie zapisuje na dysk; poprzedni pomiar 9.7 GB) | **EXIT 0** (po `rustfmt` nowych plików; pierwszy przebieg EXIT 1 tylko na formatowaniu nowych plików) |
| `cargo clippy --all-targets -- -D warnings` | **4.1 GB** (< 8 GB — powinienem był zatrzymać się przed tą bramką; zauważyłem pomiar po fakcie, zgłaszam jawnie) | **EXIT 0**, 0 ostrzeżeń |
| `cargo test --all-targets --no-fail-fast` | **4.1 → 3.4 → 1.9 GB** (pomiary 21:55–22:07, czekałem ~12 min, spadek przez inne procesy) | **NIE URUCHOMIONY — BLOCK** (reguła dispatchu < 8 GB; przy ~2 GB ryzyko wywrócenia innych workflowów) |

`CARGO_TARGET_DIR` (192 MB) usunięty po bramkach; po usunięciu `df -h /` = 2.1 GB. `Cargo.lock` przywrócony (`git checkout`), poza commitem. `git diff --check` czyste.

Szacunek (nie pomiar) zajętości brakującej bramki: 69 plików `tests/*.rs`, binarka testu ~3.8 MB bez debuginfo → rząd 0.3–0.5 GB. NIE_ZMIERZONO.

## 7. NIE_ZMIERZONO

1. Obozy barbarzyńców (§3).
2. Zgodność pikselowa/wierzchołkowa z webem całego heksa (brak wektorów z przeglądarki): testy sprawdzają, który budowniczy z jakimi wejściami jest wołany, pozycję, kolejność i mgłę; geometria modeli jest wynikiem już przeniesionych budowniczych z ich własnymi testami.
3. Konsument `MapObjectsLayer` w `src/` — brak (tylko test); docelowo integrator sceny mapy.
4. `seed`: pin podaje surowe `map.seed` do `tarasyWariantDlaHeksa` / `rotacjaDlaHeksa` / `reliefSurfaceSampler`; tu `seed | 0` (`seed_i32`, jak adapter Q1/Q2), bo funkcje Rust biorą `i32`. Dla seedów spoza `i32` zgodność NIE_ZMIERZONA.
5. Pełny `cargo test --all-targets` (§6).
