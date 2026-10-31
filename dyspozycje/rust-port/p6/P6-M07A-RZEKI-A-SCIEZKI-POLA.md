# P6.M07A - rzeki, część A: ścieżki i pola (dossier)

Temat: `R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1`. Zakres web: `gra/src/map/gen-helpers.ts:5121-6068`,
pin `edb8fb56` (uruchamiany kod TS, `git archive edb8fb56 gra/src gra/data`). Baza: `rust-port/parity-v2` @ `48d301fe8`.

**Status tematu (odpowiedź Operatora r5, na zarzuty FC r3): ZAKRES 52/52 PORTOWANY** (partie 1-3; §2). Partia 3
(`rivers_a/grow.rs`, `rivers_a/profile.rs`) domyka `TraceRiverOpts`, `growRiverInlandBeforeDrainage` z zależnościami
(okno skrętu, `RiverHexSpatialIndex`, `nearestRiverHexDistance`, `collectInlandDrainGrowCandidates`) i profiler
`CIV_RIVER_PROFILE`. Dossier NIE deklaruje PASS ani READY_FOR_DEPLOY - to decyzja Evaluatora/Final Control.

**Pomiar niezależny r5:** weryfikator `verify_m07a_p3.py` (stdlib, od zera z TS) PASS na wszystkich sekcjach partii 2-3
(§3c); mutacje `mutate_m07a_p3.py`: 89 mutantów, 74 zabite, 15 ekwiwalentnych z dowodem (§4.4); bramki
`cargo test` 1827 passed / 0 failed (EXIT=0), `clippy -D warnings` EXIT=0, `fmt --check` EXIT=0 (pliki `gate-*-r5.txt`).

**Otwarte ograniczenia (jawnie, nie PASS):** (1) weryfikator Python NIE obejmuje `purge*`, `render*`, `coastalRender`
(partia 1) - pokrywają je wektory web i testy Rust; (2) hooki profilera w ciele generatora (`if (RIVER_PROFILE_ON)
rpEnsure()...`, web :6398-11921) leżą poza zakresem 5121-6068 i nie są portowane (moduł `profile.rs` gotowy);
(3) numeracja rund: §10.

## 1. Pliki

| Plik | Rola | Linie |
|---|---|---|
| `rust-port/engine/src/domain/mapgen/rivers_a.rs` | port partii 1 (stałe, render, sanityzacja, repair, `can_river_flow_through`) | 523 (limit 600) |
| `rust-port/engine/src/domain/mapgen/rivers_a/fields.rs` | pola odległości, bufor od morza, `RiverFieldCache`, kwota rzek (re-eksport z `rivers_a`) | 145 |
| `rust-port/engine/tests/p6_m07a_rivers_a.rs` | testy wektorowe (17) | - |
| `rust-port/engine/tests/p6_m07a_rivers_a_caps.rs` | testy wektorowe galezi i capow r3 (4) | 166 |
| `rust-port/engine/src/domain/mapgen/rivers_a/walk.rs` | port partii 2 (audyt terenu, kroki/kierunki, drenaż, centroid, scoring) | - |
| `rust-port/engine/tests/p6_m07a_walk.rs` | testy wektorowe partii 2 (14) | - |
| `rust-port/engine/tests/p6_m07a_cap.rs` | sweep capa `estimateLandCentroidFromSeed` 1..40 i 6000 wobec weba (1 test) | - |
| `rust-port/engine/tests/p6_m07a_vectors/web-rivers-a-cap.json` | wektory capa z uruchomionego weba (216 startów x 41 capów = 8856; 0,73 MB) | - |
| `.../R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1/gen-m07a-cap.mjs` | generator wektorów capa (sidecar pomiarowy r4) | - |
| `rust-port/engine/tests/p6_m07a_vectors/web-rivers-a-walk.json` | wektory partii 2 z uruchomionego weba | - |
| `dyspozycje/autobot/runs/R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1/gen-m07a-walk.mjs` | generator wektorów partii 2 | - |
| `dyspozycje/autobot/runs/R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1/verify_m07a_walk.py` | niezależny weryfikator Python partii 2 (stdlib, od zera z TS) | - |
| `dyspozycje/autobot/runs/R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1/mutate_m07a_walk.py` | mutacje partii 2 (M1-M10) | - |
| `rust-port/engine/tests/p6_m07a_vectors/common.rs` | wspólny loader wektorów | - |
| `rust-port/engine/tests/p6_m07a_vectors/web-rivers-a.json` | wektory z uruchomionego weba, wersja r3 (3,76 MB < 6 MB) | - |
| `dyspozycje/autobot/runs/R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1/gen-m07a-vectors.mjs` | generator wektorów (uruchamia `gen-helpers.ts` z pinu) | - |
| `.../R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1/reg/m07a-register.mjs`, `reg/m07a-hooks.mjs` | loader TS (rozwiązywanie importów, JSON, dopisek eksportu `canRiverFlowThrough`) | - |
| `.../R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1/verify_m07a_logic.py` | niezależny weryfikator Python (stdlib) wektorów | - |
| `.../R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1/mutate_m07a_r3.py` | skrypt mutacji r3 | - |

Pliki dodane w r5 (partia 3 i dowody): `rivers_a/grow.rs` (495 LOC; `growRiverInlandBeforeDrainage`,
`collectInlandDrainGrowCandidates`, okno skrętu, `RiverHexSpatialIndex`, `nearestRiverHexDistance`,
`riverGrowStepPassesSep`, `TraceRiverOpts`), `rivers_a/profile.rs` (220 LOC), `tests/p6_m07a_grow.rs` (8 testów),
`tests/p6_m07a_vectors/web-rivers-a-grow.json` (1,17 MB), `gen-m07a-grow.mjs`, `verify_m07a_p3.py`,
`mutate_m07a_p3.py`. Rozszerzone (r5, tylko dopiski; istniejące klucze wektorów bez zmian): `web-rivers-a-walk.json`
(+ klucz `pathSeaEdge`, +1 mapa na końcu), `p6_m07a_walk.rs` (+1 test), `gen-m07a-walk.mjs`.
Rozmiary (LOC): `rivers_a.rs` 534, `rivers_a/walk.rs` 359, `rivers_a/fields.rs` 145, `rivers_a/grow.rs` 495,
`rivers_a/profile.rs` 220. Wektory: walk 0,57 MB, grow 1,17 MB, cap 0,75 MB, web-rivers-a 3,76 MB (wszystkie < 6 MB).
Zmiany w `rivers_a.rs` od bazy `52994ab70`: `pub mod grow; pub mod profile; pub mod walk;`, `pub use self::walk::{...}`
(re-eksporty) oraz widoczność dwóch funkcji `is_relief_terrain`, `is_river_land_terrain`: `const fn` -> `pub(crate) const fn`
(bez zmiany logiki; wymagane przez `walk.rs`). `mod.rs` i `data/derived.rs` bez zmian. Podział `rivers_a/fields.rs` jest podmodułem `rivers_a` (katalog
`mapgen/rivers_a/`), więc `mapgen/mod.rs` i test szkieletu M00 (`mapgen_mod_declares_exactly_doc_modules`) pozostają
bez zmian i zielone.

## 2. Tabela statusu per symbol

Legenda: PORTOWANE = funkcja Rust + wektor z weba + testy; NIE = jeszcze nie portowane (partia wskazana).

| Symbol web | Linia web | Rust (`rivers_a.rs` / `rivers_a/fields.rs`) | Status | Wektory / dowód |
|---|---|---|---|---|
| `auditMapTerrainData` | 5121 | `audit_map_terrain_data` (`rivers_a/walk.rs`) | PORTOWANE (partia 2) | `audit`: 36 map (byTeren, specks, składowe morza wewn.) |
| `ELEVATION_RANK` | 5175 | `elevation_rank` | PORTOWANE | `constants` + tabela w teście |
| `riversQuotaForLandMass` | 5187 | `rivers_quota_for_land_mass` | PORTOWANE | `quota`: 166 przypadków (n 0..40, progi 8/14, tiery low/medium/high) |
| `hexAxialDistance` (prywatna) | 5194 | `hex_axial_distance` (prywatna) | PORTOWANE | pośrednio (`sanitize`, `adjacent`, `repair`) |
| `purgeOceanInsideEarthLandMask` | 5204 | `purge_ocean_inside_earth_land_mask` | PORTOWANE | `purgeOcean`: 64 przypadki, 53 z realną zmianą |
| `purgeStrayLandOutsideEarthMask` | 5244 | `purge_stray_land_outside_earth_mask` | PORTOWANE | `purgeStray`: 64 przypadki, wszystkie ze zmianą |
| `landRiverRenderPath` | 5261 | `land_river_render_path` | PORTOWANE | `landRender`: 360 |
| `countMediumInlandLandHexes` | 5279 | `count_medium_inland_land_hexes` | PORTOWANE | `countMediumInland`: 360 |
| `mediumRiverRenderPath` | 5295 | `medium_river_render_path` | PORTOWANE | `mediumRender`: 360 |
| `coastalRiverRenderPath` | 5312 | `coastal_river_render_path` | PORTOWANE | `coastalRender`: 360; cap dociągania (guard<4): `coastCap`: 3 przypadki, mutacje M9/M10 |
| `hasLandNeighborTouchingSea` (prywatna) | 5383 | `has_land_neighbor_touching_sea` | PORTOWANE | przez `coastalRender` |
| `hasMorzeNeighborForRiverRender` (prywatna) | 5392 | `has_morze_neighbor_for_river_render` | PORTOWANE | przez `coastalRender` |
| `assertRiverPathAdjacent` | 5400 | `assert_river_path_adjacent` | PORTOWANE | `adjacent`: 400 |
| `splitAdjacentRiverChains` | 5415 | `split_adjacent_river_chains` | PORTOWANE | `split`: 400 (146 z >1 łańcuchem) |
| `sanitizeRiverPath` | 5440 | `sanitize_river_path` | PORTOWANE | `sanitize`: 400 (284 zmienione) |
| `riverPathHasRevisitedHex` | 5457 | `river_path_has_revisited_hex` | PORTOWANE | `revisited`: 400 |
| `repairRiverPathAdjacency` | 5468 | `repair_river_path_adjacency` | PORTOWANE | `repair`: 240 (191 zmienionych); cap pętli (guard<64): `repairCap`: D=62..67, obie osie, mutacje M7/M8 |
| `RIVER_MIN_INLAND_FROM_SEA` | 5512 | stała | PORTOWANE | `constants` |
| `RIVER_MIN_MAIN_LEN` | 5518 | stała | PORTOWANE | `constants` |
| `RIVER_HARD_MEANDER_LEN` | 5523 | stała | PORTOWANE | `constants` |
| `RIVER_MOUTH_TAIL_LEN` | 5526 | stała | PORTOWANE | `constants` |
| `MAIN_RIVER_MIN_PATH_SEP` | 5529 | stała | PORTOWANE | `constants` |
| `MEDIUM_TRIBUTARY_SPACING_HEX` | 5532 | stała | PORTOWANE | `constants` |
| `mediumTributarySpacingHex` | 5535 | `medium_tributary_spacing_hex` | PORTOWANE | test jednostkowy (stała 4 niezależnie od rozmiaru) |
| `MEDIUM_TRIBUTARY_MIN_NET_LEN` | 5538 | stała | PORTOWANE | `constants` |
| `mediumTributaryMinNetLen` | 5543 | `medium_tributary_min_net_len` | PORTOWANE | test jednostkowy progów 79/80/119/120 (ZAŁOŻENIE: bez wektora, wartości z definicji web :5545-5547) |
| `MAIN_RIVER_COAST_MOUTH_MAX_GAP` | 5551 | stała | PORTOWANE | `constants` |
| `mainRiverCoastMouthMaxGapForDims` | 5554 | `main_river_coast_mouth_max_gap_for_dims` | PORTOWANE | `mouthGap`: 324 pary (w, h), 195 gałąź 'mala' (5), 129 standard (7); mutacja M6 (5→6) wykryta |
| `riverPathRespectsSeaBuffer` | 5561 | `river_path_respects_sea_buffer` (`rivers_a/fields.rs`) | PORTOWANE | `seaBuffer`: 240 (102 true / 138 false) |
| `canRiverDrainStep` (prywatna) | 5580 | `can_river_drain_step` (`walk.rs`) | PORTOWANE (partia 2) | `drainStep`: 504 (faza lądowa / korytarz ujścia / poza mapą) |
| `isRiverDrainageGoal` (prywatna) | 5595 | `is_river_drainage_goal` (`walk.rs`) | PORTOWANE (partia 2) | `drainGoal`: 360 (`_seaDist` nieużywany w webie - pominięty) |
| `buildSeaDistanceField` | 5614 | `build_sea_distance_field` (`fields.rs`) | PORTOWANE | `fields`: 40 map (seaDist) |
| `buildOpenOceanDistanceField` | 5640 | `build_open_ocean_distance_field` (`fields.rs`) | PORTOWANE | `fields`: 40 map (openOceanDist) |
| profiler `CIV_RIVER_PROFILE` (`RIVER_PROFILE_ON`, `rpNow`, `RiverProfileStats`, `rpEnsure`, `reset/get/formatRiverProfileReport`) | 5670-5752 | `rivers_a/profile.rs` (`river_profile_on`, `river_profile_hook`, `RiverProfileStats`, `reset/get_river_profile_stats`, `format_river_profile_report`, `js_to_fixed`) | PORTOWANE (r5). Hooki w ciele generatora (web :6398-11921) POZA zakresem 5121-6068, nieportowane | `profile_format_and_to_fixed_match_web` (7 zrzutów web + 48 `toFixed`), `profile_flag_is_exact_one_and_hook_is_gated` |
| `RiverFieldCache` / `buildRiverFieldCache` | 5755-5761 | `RiverFieldCache` / `build_river_field_cache` (`fields.rs`) | PORTOWANE (bez gałęzi profilera) | `fields`: 40 map |
| `inferMapDimsFromHexes` (prywatna) | 5781 | `infer_map_dims_from_hexes` (`walk.rs`) | PORTOWANE (partia 2) | `dims`: 36 map |
| `isReliefRiverSource` (prywatna) | 5792 | `is_relief_river_source` (`walk.rs`) | PORTOWANE (partia 2) | `reliefSource`: 8 (każdy teren) |
| `pathEndsAtSea` | 5797 | `path_ends_at_sea` (`walk.rs`) | PORTOWANE (partia 2) | `pathSea`: 288 (z wymiarami i z inferencją) |
| `TraceRiverOpts` (interfejs) | 5819 | `TraceRiverOpts` (`rivers_a/grow.rs`) | PORTOWANE (r5; struktura, bez logiki) | kompilacja + użycie w `grow` (pola jak w webie) |
| `RiverCoord` (typ) | 5844 | `RiverCoord` | PORTOWANE | - |
| `isReliefTerrain` (prywatna) | 5847 | `is_relief_terrain` | PORTOWANE | przez `flow`, `repair`, `coastal` |
| `canRiverFlowThrough` | 5862 | `can_river_flow_through` | PORTOWANE (funkcja w całości; wywołania z partii 2+ poza zakresem) | `flow`: 5760 przypadków, wszystkie gałęzie (morze; relief + źródło; `block_existing` + `allow_key` = cell / inny / brak; `allow_relief_traversal`; poza mapą); mutacje M1-M5 wykryte |
| `riverStepDir` (prywatna) | 5879 | `river_step_dir` (`walk.rs`) | PORTOWANE (partia 2) | `dirs`: 25 |
| `sameRiverDir` (prywatna) | 5883 | `same_river_dir` (`walk.rs`) | PORTOWANE (partia 2) | `sameDir`: 37 (wszystkie 36 par kierunków + zero) |
| `reconstructRiverPath` (prywatna) | 5887 | `reconstruct_river_path` (`walk.rs`) | PORTOWANE (partia 2) | `reconstruct`: 40 (łańcuchy pełne i urwane) |
| `growRiverInlandBeforeDrainage` (prywatna) | 5903 | `grow_river_inland_before_drainage` (`rivers_a/grow.rs`) | PORTOWANE (r5) | `grow`: 1296 przypadków (C in {4,9,12} x T in {C-1,C,C+1} x H in {7,8,9}, 2 starty na mapę, 25 map); `collect`: 496 |
| `riverHexDirDelta` (prywatna) | 5975 | `river_hex_dir_delta` (`walk.rs`) | PORTOWANE (partia 2) | `dirDelta`: 43 (0..5 x 0..5 + wartości spoza zakresu, ujemne modulo) |
| `estimateLandCentroidFromSeed` (prywatna) | 5982 | `estimate_land_centroid_from_seed` (`walk.rs`) | PORTOWANE (partia 2) | `centroidSeed`: 216 (capy 1,2,3,5,6000 - każdy start jednym capem; allow relief tak/nie); test `centroid_cap_discriminates`; sweep `p6_m07a_cap`: cap 1..40 i 6000 na 216 startach, 8856/8856 zgodne z webem |
| `estimateLandCentroidFromMouth` (prywatna) | 6016 | `estimate_land_centroid_from_mouth` (`walk.rs`) | PORTOWANE (partia 2) | `centroidMouth`: 216 |
| `scoreRiverStepTowardCentroid` (prywatna) | 6026 | `score_river_step_toward_centroid` (`walk.rs`) | PORTOWANE (partia 2) | `scoreCentroid`: 200 (22 / -12 / 3 / 0) |
| `scoreRiverStepTowardCenterSquare` (prywatna) | 6041 | `score_river_step_toward_center_square` (`walk.rs`) | PORTOWANE (partia 2) | `scoreSquare`: 504 (40 / 32 / -22 / 4 / brak kwadratu) |
| `scoreRiverStepTowardLandCenter` (prywatna) | 6057 | `score_river_step_toward_land_center` (`walk.rs`) | PORTOWANE (partia 2) | `scoreLandCenter`: 288 (gałąź kwadrat i centroid) |

Zależności spoza 5121-6068, portowane w partii 3 (ZAŁOŻENIE: wymagane przez `growRiverInlandBeforeDrainage`; web):

| Symbol web | Linia web | Rust | Status | Wektory / dowód |
|---|---|---|---|---|
| `collectInlandDrainGrowCandidates` (prywatna) | 6148 | `collect_inland_drain_grow_candidates` (`grow.rs`) | PORTOWANE (r5) | `collect`: 496 przypadków, score bit-w-bit (`to_bits`), w tym `-inf` |
| `riverGrowStepPassesSep` | 6070 | `river_grow_step_passes_sep` (`grow.rs`) | PORTOWANE (r5) | `sep`: 200 + `sepIndexed`: 200 |
| `RiverHexSpatialIndex` (klasa) | 8981 | `RiverHexSpatialIndex` (`grow.rs`); `nearest_distance` bez `earlyExitBelow` | PORTOWANE (r5); wariant `earlyExitBelow` (używany w `isPathTooCloseToRiverHexes`, poza zakresem) NIE PORTOWANY - ZAŁOŻENIE | `indexAdd`: 40; `nearest` (indeks vs brute): 268, w tym granica pierścieni 138..150 |
| `nearestRiverHexDistance` | 9044 | `nearest_river_hex_distance` (`grow.rs`) | PORTOWANE (r5) | `nearest`: 268 (brute 268/268, indeks 268/268) |
| `isRiverWindowTurnAllowed` (prywatna) | 7026 | `is_river_window_turn_allowed` (`grow.rs`) | PORTOWANE (r5) | `window`: 2240 kroków, 320 tras |
| `neighborDirIndex` | 6988 | `neighbor_dir_index` | PORTOWANE (r5) | `dirs`: 25 |
| `signedRiverDirDelta` | 7003 | `signed_river_dir_delta` | PORTOWANE (r5) | `dirs`: 41 (0..5 x 0..5 + spoza zakresu) |
| `pathSegmentDirs` / `pathSignedTurnDeltas` | 7008 / 7017 | `path_segment_dirs` / `path_signed_turn_deltas` | PORTOWANE (r5) | `window`: segDirs 320, turnDeltas 320 |
| `RIVER_TURN_WINDOW_HEX` / `_MAX_SUM` | 6999-7000 | stałe w `grow.rs` | PORTOWANE (r5) | przez `window` i `grow` (mutacje G05-G07) |
| `estimateLandCentroidFromSeed`, cap 6000 na mapie 100x80 | 5982 | `estimate_land_centroid_from_seed` | PORTOWANE (partia 2) | `bigCap`: 24 (4 starty x caps 1, 5999, 6000, 6001, 7000, 8000); 5999 != 6000 != 6001 (test `big_map_cap_6000_discriminates_and_matches_web`) |

Podsumowanie (r5): 52 pozycje tabeli - PORTOWANE 52/52 (profiler jako moduł; hooki generatora poza zakresem).
Dodatkowo PORTOWANE zależności spoza zakresu (tabela wyżej). Pozycje NIE: 0. Odstępstwa: §5.

## 3. Lekcje M06B (wymogi dispatchu) - stan po r5

- (a) wektory z nakładkami na heksach wodnych i lądowych: TAK. Mapy wektorów są losowe z nakładką `las` (prawdopodobieństwo
  0,05 na wodzie, 0,14 na lądzie), zlozami i rzekami (`walk`, `grow`, `collect`). Walk: 1044 heksów lądowych i 187 wodnych
  z nakładką `las` (r4). Partia 1: `render_vectors_exercise_water_and_land_overlays`.
- (b) limity pętli/capy z wektorem N-1/N/N+1 na mapach rozróżniających cap: TAK.
  * cap centroidu: sweep 1..40 oraz 6000 na 216 startach (`cap`, 8856/8856); mapa 100x80 (8000 heksów, wszystkie laka):
    cap 5999, 6000, 6001 dają różne centroidy (`bigCap`, test `big_map_cap_6000_discriminates_and_matches_web`, asercja
    `CENTROID_VISIT_CAP == 6000`).
  * pętle wzrostu rzeki: C (stepCap) w {4, 9, 12}, T (inlandTargetLen) w {C-1, C, C+1}, H (hardMeanderLen) w {7, 8, 9}, 2 starty na mapę, 25 map.
  * granica maxRing=24 indeksu: klucze na pierścieniach 23/24/25 (q = 138, 143, 144, 149, 150, -144, -150, (0,150));
    indeks zwraca `inf` dla odległości 150, brute `150` - zgodnie z webem (test `nearest_distance_and_index_match_web`).
  * pozostałe capy partii 1 (`repairCap` D=62..67, `coastCap` L=1..3): jak w r3, bez zmian.
- (c) niezależny weryfikator Python od zera z TS pinu: CZĘŚCIOWO (zakres w §3c).
- (d) mutacje na każdej gałęzi sterującej + dowody równoważności: TAK dla walk.rs i grow.rs (§4.4): 89 mutantów,
  74 zabite (asercja testu, a dla pętli bez wyjścia - limit czasu), 15 ekwiwalentnych z dowodem. Konstrukcje bez osobnego
  mutanta: pętle `for (dq, dr) in HEX_DIRECTIONS` (ciała mutowane przez warunki wewnątrz), ramiona `match` w
  `teren_bazowy_name` (pokryte wektorem `audit` zbiorczo; NIE_ZMIERZONO per ramię), `for (_, h) in hexes.iter()` w audycie.
- (e) plik wektorów <= 6 MB: TAK (max 3,76 MB, `web-rivers-a.json`).
- (f) dossier z tabelą statusu per symbol (spójny): TAK (§2, 52/52).
- (g) logi bramek z linią `EXIT=` i bez pustych linii na końcu plików: TAK. Logi `gate-*-r5.txt` (nie `.log`:
  `.gitignore` ignoruje `*.log`, zob. Z5). `git diff --check` czysty.
- (h) komparatory sortowania zgodne z V8: TAK. `cmp_candidates_desc` (grow.rs): `b.score - a.score`, NaN -> Equal, sort
  stabilny (`sort_by`); wektory zawierają kandydatów `-inf` (sprawdzane bit-w-bit, `to_bits`). W walk: brak sortowań.

## 4. Mutacje

### 4.1 Runda r3 (`mutate_m07a_r3.py`, każda mutacja = jedna podmiana w `rivers_a.rs`)

| Mutacja | Gałąź / cap | Wynik | Wykryta przez |
|---|---|---|---|
| M1 `block_existing && ...` → `false && ...` | `can_river_flow_through` block | WYKRYTA | `can_river_flow_through_matches_web_all_branches` |
| M2 `allow_key != Some(cell_key)` → `true` | `can_river_flow_through` allow_key | WYKRYTA | `can_river_flow_through_matches_web_all_branches` |
| M3 `!allow_relief_traversal` → `false` | `can_river_flow_through` relief | WYKRYTA | `coastal_river_render_path_matches_web`, `repair_river_path_adjacency_matches_web` (+ flow) |
| M4 `return cell_key == source_key` → `false` | relief dla źródła | WYKRYTA | `can_river_flow_through_matches_web_all_branches` |
| M5 `hex.terrain == Sea` → `&& false` | morze | WYKRYTA | `coastal_river_render_path_matches_web`, `repair_river_path_adjacency_matches_web` |
| M6 `MapSizeLabel::Mala => 5` → `6` | gałąź 'mala' | WYKRYTA | `main_river_coast_mouth_gap_matches_web_size_labels` |
| M7 `while guard < 64` → `63` | cap repair | WYKRYTA | `repair_loop_cap_matches_web_n_minus_1_n_n_plus_1` |
| M8 `while guard < 64` → `65` | cap repair | WYKRYTA | `repair_loop_cap_matches_web_n_minus_1_n_n_plus_1` |
| M9 `for _guard in 0..4` → `0..3` | cap wybrzeża | WYKRYTA | `coastal_river_render_path_matches_web`, `coastal_extension_cap_matches_web` |
| M10 `for _guard in 0..4` → `0..5` | cap wybrzeża | WYKRYTA | `coastal_river_render_path_matches_web`, `coastal_extension_cap_matches_web` |

Uwaga: pierwsze przebiegi M1-M8 uruchamiały testy bez `--no-fail-fast`; wykrycie jest ważne (czerwony test),
ale lista czerwonych testów była skrócona. M9/M10 przebiegnięto ponownie z `--no-fail-fast`.

### 4.2 Sesje r1 i r2 (zachowane dla historii; NIE są powtarzane w r3)

- r1 deklarowała "7/7 wykryte" dla innego zestawu (tie-break repair, `Polar` w `is_river_land_terrain`, próg pustyni,
  tie coastal, bufor morza, cap wybrzeża 0..4→0..3, sanityzacja). Zestaw r1 NIE został odtworzony przez r2 ani r3.
- r2 wykryła 5/7 z innym zestawem; niewykryte były `block_existing` i gałąź 'mala' - obie zamknięte w r3 (M1, M6).

### 4.3 Partia 2 (`mutate_m07a_walk.py`, pomiar r4: 10/10)

| Mutacja | Gałąź | Wynik | Wykryta przez |
|---|---|---|---|
| M1 `nd >= MIN` → `nd > MIN` | `can_river_drain_step`, faza lądowa | WYKRYTA | `drain_step_matches_web` |
| M2 `od <= TAIL` → `<` | korytarz ujścia | WYKRYTA | `drain_step_matches_web` |
| M3 pominięty warunek sąsiada oceanu | `is_river_drainage_goal` | WYKRYTA | `drainage_goal_matches_web` |
| M4 brak `+6` (modulo ujemne) | `river_hex_dir_delta` | WYKRYTA | `step_dirs_match_web` |
| M5 zbliżenie `22` → `21` | `score_river_step_toward_centroid` | WYKRYTA | `score_centroid_matches_web` |
| M6 trafienie kwadratu `40` → `39` | `score_river_step_toward_center_square` | WYKRYTA | `score_center_square_matches_web` |
| M7 cap `<` → `<=` | BFS centroidu | WYKRYTA | `centroid_seed_and_mouth_match_web`, `cap_sweep_matches_web` |
| M8 `allow_relief_traversal` → `false` | BFS centroidu (wywołanie wieloliniowe) | WYKRYTA | `centroid_seed_and_mouth_match_web` |
| M9 brak odwrócenia | `reconstruct_river_path` | WYKRYTA | `reconstruct_matches_web` |
| M10 brak liczenia składowych | `audit_map_terrain_data` | WYKRYTA | `audit_matches_web` |

Pomiar r4: pierwszy przebieg skryptu dał 9/10 - wzorzec M8 nie pasował do wieloliniowego wywołania, mutacja została pominięta (nie zaliczona). Wzorzec poprawiono i M8 potwierdzono ręcznie (test czerwony); przebieg po poprawce: 10/10.

### 4.4 Partie 2-3 (r5): `mutate_m07a_p3.py` - 89 mutantów

Wyniki: `mutate-m07a-p3-r5.txt` (W01-W40, G01-G41, P01-P04, 85 mutantów), `mutate-m07a-p3-rerun-r5.txt` (ponowne
przebiegi po dopisaniu wektorów brzegowych: W11, W13, G28, P04), `mutate-m07a-p3-extra-r5.txt` (W41-W44, luki pokrycia).
Każda mutacja = jedna podmiana tekstu (anchor musi wystąpić dokładnie raz; sprawdzone przed przebiegiem); plik przywracany.

ZABITE (74): wszystkie gałęzie `can_river_drain_step`, `is_river_drainage_goal`, `path_ends_at_sea` (W11-W14), centroid
(W16, W18-W20, W38-W39, W42, W44 - zawieszenie BFS, limit czasu), score (W21-W28), audit (W29-W31, W43), `reconstruct`
(W15, W41), okno skrętu (G01-G09), `nearest` (G14-G15), sep (G17-G18), collect (G19-G23, G25-G31), grow (G34, G36, G38-G41:
G41 = zawieszenie, limit czasu), profil (P01-P03). W32 (`visited || false`) zabity asercją `audit_matches_web` (test działa
~4 min; wcześniej błędnie odnotowany jako TIMEOUT).

EKWIWALENTNE (15, bez zmiany wyniku - dowód):
- W09, W10 `q > max_q` / `r > max_r` -> `>=`: przypisanie tej samej wartości.
- W17, W33 `key_qr(..) else { continue }` -> `break`: gałąź nieosiągalna; klucze zawsze powstają przez `hex_key` (współrzędne całkowite), więc `key_qr` jest zawsze `Some`.
- W40 `hex_axial_distance_f` `/ 2.0` -> `/ 2.5`: porównania `<`, `>`, `==` zachowują porządek przy skali dodatniej; różnica możliwa tylko przy sąsiednich wartościach różniących się o 1 ulp (zaokrąglenie). EKWIWALENT PRAKTYCZNY, nie formalny.
- G10 `if ring > 0 && ...` -> `if false && ...`: skan wnętrza pierścienia; minimum bez zmian (komórki już przeskanowane).
- G11 `d < b` -> `d <= b`: remis daje tę samą wartość.
- G12 `b <= ring*CELL` -> `b < ring*CELL`: dla `b == 6r` kolejne pierścienie mają odległość >= 6r+1 (metryka sześcienna: odległość >= max(|dq|,|dr|)), więc wynik się nie zmienia.
- G13 `if self.count == 0` usunięte: pusty indeks nie ma komórek, wynik `inf` jak w gałęzi wczesnej.
- G16 `block.is_empty() || ...` -> pusty blok: `nearest = inf`, `inf >= minSep` = true, jak wczesny powrót.
- G24 `od > cur_od + 0.5` -> `+ 0.4`: dla całkowitych (lub `inf`) warunek identyczny.
- G32 `.or_else(square.centroid)` -> `None`: gdy kwadrat istnieje, `scoreRiverStepTowardLandCenter` używa kwadratu, centroid nie jest czytany.
- G33 `path.len() <= p.step_cap`: w pętli `growth_target <= step_cap`, więc pierwszy warunek implikuje drugi.
- G35 `if hard && len < H` -> `if hard`: `hard` jest definiowane jako `len < H` w tym samym stanie.
- G37 sortowanie gałęzi miękkiej: gałąź miękka (web :5946-5951) jest MARTWA w webie: `soft` ma tę samą konfigurację co `relaxed` (relaxHard=true, ten sam relaxSeaBuffer), więc gdy `relaxed` jest puste, `soft` też jest puste i następuje `break`. Port zachowuje gałąź dla wierności; sortowanie w niej nie ma wpływu.

## 5. Odstępstwa i zastrzeżenia (do decyzji orkiestratora / FC)

1. **Limit LOC partii - ROZWIĄZANE** (r3): `rivers_a.rs` 534, `rivers_a/walk.rs` 359, `rivers_a/fields.rs` 145, `rivers_a/grow.rs` 495, `rivers_a/profile.rs` 220 (wszystkie <= 600).
2. **Stałe jako kod, nie JSON**: stałe `RIVER_*` i progi są literałami w Rust (komentarze z numerami linii web). Zmiana wartości w webie = dryf wektorów.
3. **Weryfikator Python - zakres CZĘŚCIOWY** (r5): `verify_m07a_p3.py` pokrywa partie 2-3 (§3c); `verify_m07a_logic.py` pokrywa partię 1 bez `purge*`, `render*`, `coastalRender` (residual, §6a).
4. **Rozbieżność z tabelą P6-25 (zakres 52 vs ok. 32)**: ZAŁOŻENIE (r2), bez zmian: `P6-25-MAPA-GAP.md` nie istnieje w `parity-v2`; skan deklaracji 5121-6068 daje 52 pozycje.
5. **Profiler**: moduł `profile.rs` portuje stan, hook, formatowanie i `toFixed` JS. Hooki w ciele generatora (`if (RIVER_PROFILE_ON) rpEnsure()...`, web :6398-11921) leżą poza zakresem 5121-6068 - NIE portowane (ZAŁOŻENIE: nie wpływają na wynik; flaga musi być "1").
6. **Eksport `canRiverFlowThrough` do testów**: w pinie symbol nie jest eksportowany; loader `reg/m07a-hooks.mjs` dopisuje eksporty (kod funkcji nietknięty). r5: dopisano `growRiverInlandBeforeDrainage`, `collectInlandDrainGrowCandidates`, `neighborDirIndex`, `signedRiverDirDelta`, `pathSegmentDirs`, `pathSignedTurnDeltas`, `isRiverWindowTurnAllowed`, `rpEnsure`.
7. **Allowlista: podkatalog `rivers_a/`** (r5, Z6): nowe moduły leżą w `rivers_a/` zgodnie z dispatchem r2 (zob. §10). Literalnie allowlista mówi `rivers_a*.rs`; decyzja FC.
8. **Widoczność w `rivers_a.rs`** (r5, Z6): `is_relief_terrain` i `is_river_land_terrain` z `const fn` na `pub(crate) const fn` (bez zmiany logiki), wymagane przez `walk.rs`/`grow.rs`. Plus re-eksporty `pub use self::walk::{...}` i `pub mod grow/profile/walk`. Decyzja FC, czy to mieści się w dopisku.
9. **Martwa gałąź miękka** `growRiverInlandBeforeDrainage` (web :5946-5951): zachowana w porcie dla wierności; dowód martwości w §4.4 (G37).
10. **`RiverHexSpatialIndex.nearestDistance` z `earlyExitBelow`** (web :9000-9020): NIE portowany - używany w `isPathTooCloseToRiverHexes` (web :9066, poza zakresem). ZAŁOŻENIE. Port `nearest_distance` bez tego parametru; web `growRiverInlandBeforeDrainage` nie przekazuje indeksu (`growBase` bez `sepIndex`), więc w tej ścieżce wynik nie zależy od wariantu.
11. **Build**: `Cargo.lock` powstaje lokalnie i NIE jest commitowany. `target/` przeniesiony na `/dev/shm` (dysk główny zapełniony: `No space left on device`), usunięty po bramkach.
12. **Logi**: zapisane jako `*.txt` (`*.log` jest w `.gitignore`); każdy zawiera linię `EXIT=`.

## 6. Następne kroki (poza tym tematem; decyzja FC / orkiestratora)

a. Weryfikator Python dla `purge*`, `render*`, `coastalRender` (partia 1, zależy od `earthTemplateLandAt` z `earth-land-mask.ts`).
b. Hooki profilera w ciele generatora (`generateRivers`, `topUp`, `traceRiver`, `aStar`) - przy portowaniu generatora; moduł `profile.rs` gotowy.
c. Wariant `earlyExitBelow` indeksu - przy portowaniu `isPathTooCloseToRiverHexes`.

## 7. Weryfikacja r2 (Operator-pomiary, run `R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1/02-operator-r2.md`)

- Bramki na `bef9b491b`: `cargo test --test p6_m07a_rivers_a` 17/17 EXIT=0; pełny `cargo test` 1799 passed / 0 failed EXIT=0; `cargo fmt --check` EXIT=0; `cargo clippy --all-targets -D warnings` EXIT=0.
- Weryfikator `verify_m07a_consts.py` (stdlib, TS pinu `edb8fb56` vs `rivers_a.rs`): stałe 8/8, progi `mediumTributaryMinNetLen`, `ELEVATION_RANK` 8/8: PASS. Nie pokrywa `mapSizeLabelFromDims` ani wektorów.
- Mutacje r2: 5/7 wykryte; niewykryte (block_existing, gałąź 'mala') zamknięte w r3 (§4.1 M1, M6).

## 8. Runda r3 - odpowiedzi na zarzuty (kolejne rundy: kontrola niezależna przez orkiestratora)

- Z2 (luka `canRiverFlowThrough`): PRZYJĘTE. Wektory `flow` (5760), mutacje M1-M4 wykryte.
- Z3 (gałąź 'mala' bez wektora): PRZYJĘTE. Wektory `mouthGap` (324 pary, 195 'mala'), mutacja M6 wykryta.
- Z4 (brak weryfikatora Python): PRZYJĘTE CZĘŚCIOWO. `verify_m07a_logic.py` PASS na 12 zestawach (§3c); zakres poza partią 1 i purge/render zostaje do partii 4.
- Z5 (cap pętli i wybrzeża bez map N-1/N/N+1): PRZYJĘTE. `repairCap` (D=62..67), `coastCap` (L=1..3), mutacje M7-M10 wykryte.
- Z6 (650 LOC > 600): PRZYJĘTE. Podział na `rivers_a.rs` (523) i `rivers_a/fields.rs` (145); mod.rs i test M00 nietknięte.
- Z7 (sprzeczne raporty mutacji): PRZYJĘTE. §4 przepisany: zestaw r3 (10/10) oddzielony od zestawów r1/r2, których nie odtworzono.
- Z8 (brak P6-25-MAPA-GAP.md): ZAŁOŻENIE z dowodem: §5.4 (30 wierszy M07A w historii vs skan 52).
- Z1 (zakres 18 symboli nieportowanych): PRZYJĘTE jako otwarte. Partie 2-4 NIE są wykonane w r3; ten temat NIE jest
  PASS i nie jest READY_FOR_DEPLOY. Nie zamykam go w tej rundzie.

## 9. Pomiar niezależny r4 (Operator-pomiary)

- Wektory `web-rivers-a-walk.json`: regeneracja `gen-m07a-walk.mjs` z `git archive edb8fb56 gra/src gra/data` - `cmp` IDENTYCZNE.
- Wektory `web-rivers-a-cap.json`: `gen-m07a-cap.mjs` z pinu - 8856 przypadków; Rust `cap_sweep_matches_web` 8856/8856 zgodne.
- Pokrycie nakładek (lekcja a): walk - 1044 heksów lądowych i 187 wodnych z nakładką `las` (z 11 340 wierszy łącznie).
- Weryfikator `verify_m07a_walk.py` (stdlib, `python3 -I`): PASS, 965 przypadków, 0 błędów. Nie pokrywa drainStep/drainGoal/pathSea/scoreSquare/audit - te pokryte wektorami web i testami Rust.
- Mutacje `mutate_m07a_walk.py`: 10/10 (§4.3). Test `p6_m07a_cap` zabija dodatkowo M7 (sprawdzone ręcznie).
- Rozmiary: `walk.rs` 359 LOC, `rivers_a.rs` 532 LOC, `fields.rs` 145 LOC; wektory 0,57 / 0,73 MB; wszystkie <= 600 LOC / <= 6 MB.
- Zakres: 49/52 PORTOWANE; NIE: `TraceRiverOpts` (partia 3), `growRiverInlandBeforeDrainage` (partia 3), profiler `CIV_RIVER_PROFILE` (ZAŁOŻENIE: bez wpływu na wynik). Status: ZAKRES NIEKOMPLETNY.

## 10. Odpowiedzi na zarzuty FC r3 (runda r5, Operator)

Numeracja rund (Z6): dossier używa jednej etykiety - "runda 4" = pomiar r4 (commit `1e4e975e3`), "runda 5" = ta odpowiedź.
Numery "2/5" (dispatch) i "r1/5" (zlecenie) to etykiety dispatchu/zlecenia (ZAŁOŻENIE), nie licznik rund Operatora.

- **Z1 (zakres, blokujący): PRZYJĘTE.** Partia 3 wykonana: `232d8945b` (`grow.rs`, `profile.rs`, `p6_m07a_grow.rs`, wektory `web-rivers-a-grow.json`, `gen-m07a-grow.mjs`). Pozycje NIE = 0 (§2, 52/52). Dowód: `p6_m07a_grow` 8/8 PASS; pełny `cargo test` 1827 passed / 0 failed, EXIT=0 (`gate-test-full-r5.txt`).
- **Z2 (mutacje, lekcja d): PRZYJĘTE.** Partia 2: 10/10 (r4). Partia 2-3 r5: 89 mutantów, 74 zabite, 15 ekwiwalentnych z dowodem (§4.4). Konstrukcje bez osobnego mutanta wymienione w §3(d). Odpowiedź na "dossier twierdzi TAK dla każdej gałęzi": zmieniono na pokrycie zmierzone (§3(d)).
- **Z3 (weryfikator Python): PRZYJĘTE CZĘŚCIOWO.** `verify_m07a_p3.py` (`verify-p3-r5.txt`, EXIT=0) pokrywa drainStep (504), drainGoal (360), pathSea (288 + 16 brzegowych), scoreSquare (504), scoreLandCenter (288), audit (36), oceanConnected/openOceanDist (pośrednio), oraz całą partię 3. Dowód niezależności: pierwsza wersja zawierała mój błąd (oceanConnected po plytkiej wodzie zamiast po całej wodzie), wykryty przez wektory i poprawiony po przeczytaniu TS. Pozostaje: `purge*`, `render*`, `coastalRender` (§6a) - NIE_ZMIERZONO w Pythonie.
- **Z4 (cap 6000): PRZYJĘTE.** Mapa 100x80 (8000 heksów): caps 5999/6000/6001 dają różne wyniki; asercja stałej `CENTROID_VISIT_CAP == 6000`; mutant W38 (5999) zabity; mutant W42 zabity.
- **Z5 (logi bramek w .gitignore): PRZYJĘTE.** Logi `gate-test-full-r5.txt`, `gate-clippy-r5.txt`, `gate-fmt-r5.txt` (EXIT=0) są w commicie (nie `.log`). Poprzednie logi r4 nadal w worktree Operatora (nie w repo) - nie są podstawą tej rundy.
- **Z6 (dokumentacja/proces):**
  * numeracja rund: PRZYJĘTE (§10 nagłówek).
  * §3 nagłówek z mieszanką r3/r4: PRZYJĘTE, §3 przepisany bez mieszania.
  * allowlista `rivers_a/walk.rs` vs `rivers_a*.rs`: ODRZUCAM literalne rozumienie zarzutu. Dowód: dispatch r2 (`00-dispatch.md`, sekcja "Runda 2 — stan wejściowy", akapit ZAKRES r2): "Partie ≤600 LOC, nowe moduły w podkatalogu `rivers_a/` (bez zmian `mod.rs`/skeleton testu)". Pliki są w zadeklarowanym podkatalogu.
  * zmiana `rivers_a.rs` przez Operatora (re-eksporty): PRZYJĘTE CZĘŚCIOWO. Dodano `pub mod`/`pub use` (dopisek) oraz zmieniono widoczność 2 funkcji (`pub(crate)`, bez zmiany logiki) - zgłoszone w §5.8 do decyzji FC.
