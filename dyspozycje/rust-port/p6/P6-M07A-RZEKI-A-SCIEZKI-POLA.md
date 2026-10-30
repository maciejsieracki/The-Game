# P6.M07A - rzeki, część A: ścieżki i pola (dossier)

Temat: `R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1`. Zakres web: `gra/src/map/gen-helpers.ts:5121-6068`,
pin `edb8fb56` (uruchamiany kod TS, `git archive edb8fb56 gra/src gra/data`). Baza: `rust-port/parity-v2` @ `48d301fe8`.

**Status tematu: RUNDA 4 (Operator) - ZAKRES NIEKOMPLETNY (partie 1-2 gotowe, 49 z 52 pozycji PORTOWANE).** Partia 1
jest domknięta wektorami, mutacjami i niezależnym weryfikatorem Python (§3). Partia 2 (`rivers_a/walk.rs`) domyka
15 pozycji: audyt terenu, kroki/kierunki, drenaż, `pathEndsAtSea`, centroid i scoring (wektory, 14 testów Rust,
mutacje M1-M10 wykryte, weryfikator Python `verify_m07a_walk.py` PASS). Zostają 3 pozycje (§2): `TraceRiverOpts`,
`growRiverInlandBeforeDrainage` oraz profiler (ZAŁOŻENIE: poza zakresem wyniku). Dossier nie deklaruje zakończenia tematu.

## 1. Pliki

| Plik | Rola | Linie |
|---|---|---|
| `rust-port/engine/src/domain/mapgen/rivers_a.rs` | port partii 1 (stałe, render, sanityzacja, repair, `can_river_flow_through`) | 523 (limit 600) |
| `rust-port/engine/src/domain/mapgen/rivers_a/fields.rs` | pola odległości, bufor od morza, `RiverFieldCache`, kwota rzek (re-eksport z `rivers_a`) | 145 |
| `rust-port/engine/tests/p6_m07a_rivers_a.rs` | testy wektorowe (17) | - |
| `rust-port/engine/tests/p6_m07a_rivers_a_caps.rs` | testy wektorowe galezi i capow r3 (4) | 166 |
| `rust-port/engine/src/domain/mapgen/rivers_a/walk.rs` | port partii 2 (audyt terenu, kroki/kierunki, drenaż, centroid, scoring) | - |
| `rust-port/engine/tests/p6_m07a_walk.rs` | testy wektorowe partii 2 (14) | - |
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

`mod.rs` i `data/derived.rs` bez zmian. Podział `rivers_a/fields.rs` jest podmodułem `rivers_a` (katalog
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
| profiler `CIV_RIVER_PROFILE` (`RIVER_PROFILE_ON`, `rpNow`, `RiverProfileStats`, `rpEnsure`, `reset/get/formatRiverProfileReport`) | 5670-5752 | - | NIE PORTOWANE - diagnostyka env, bez wpływu na wynik (ZAŁOŻENIE; weryfikacja w partii 3, gdy profiler zostanie dotknięty przez `generateRivers`) | - |
| `RiverFieldCache` / `buildRiverFieldCache` | 5755-5761 | `RiverFieldCache` / `build_river_field_cache` (`fields.rs`) | PORTOWANE (bez gałęzi profilera) | `fields`: 40 map |
| `inferMapDimsFromHexes` (prywatna) | 5781 | `infer_map_dims_from_hexes` (`walk.rs`) | PORTOWANE (partia 2) | `dims`: 36 map |
| `isReliefRiverSource` (prywatna) | 5792 | `is_relief_river_source` (`walk.rs`) | PORTOWANE (partia 2) | `reliefSource`: 8 (każdy teren) |
| `pathEndsAtSea` | 5797 | `path_ends_at_sea` (`walk.rs`) | PORTOWANE (partia 2) | `pathSea`: 288 (z wymiarami i z inferencją) |
| `TraceRiverOpts` (interfejs) | 5819 | - | NIE (partia 3) | - |
| `RiverCoord` (typ) | 5844 | `RiverCoord` | PORTOWANE | - |
| `isReliefTerrain` (prywatna) | 5847 | `is_relief_terrain` | PORTOWANE | przez `flow`, `repair`, `coastal` |
| `canRiverFlowThrough` | 5862 | `can_river_flow_through` | PORTOWANE (funkcja w całości; wywołania z partii 2+ poza zakresem) | `flow`: 5760 przypadków, wszystkie gałęzie (morze; relief + źródło; `block_existing` + `allow_key` = cell / inny / brak; `allow_relief_traversal`; poza mapą); mutacje M1-M5 wykryte |
| `riverStepDir` (prywatna) | 5879 | `river_step_dir` (`walk.rs`) | PORTOWANE (partia 2) | `dirs`: 25 |
| `sameRiverDir` (prywatna) | 5883 | `same_river_dir` (`walk.rs`) | PORTOWANE (partia 2) | `sameDir`: 37 (wszystkie 36 par kierunków + zero) |
| `reconstructRiverPath` (prywatna) | 5887 | `reconstruct_river_path` (`walk.rs`) | PORTOWANE (partia 2) | `reconstruct`: 40 (łańcuchy pełne i urwane) |
| `growRiverInlandBeforeDrainage` (prywatna) | 5903 | - | NIE (partia 3) | - |
| `riverHexDirDelta` (prywatna) | 5975 | `river_hex_dir_delta` (`walk.rs`) | PORTOWANE (partia 2) | `dirDelta`: 43 (0..5 x 0..5 + wartości spoza zakresu, ujemne modulo) |
| `estimateLandCentroidFromSeed` (prywatna) | 5982 | `estimate_land_centroid_from_seed` (`walk.rs`) | PORTOWANE (partia 2) | `centroidSeed`: 216 (capy 1,2,3,5,6000; allow relief tak/nie); test `centroid_cap_discriminates` |
| `estimateLandCentroidFromMouth` (prywatna) | 6016 | `estimate_land_centroid_from_mouth` (`walk.rs`) | PORTOWANE (partia 2) | `centroidMouth`: 216 |
| `scoreRiverStepTowardCentroid` (prywatna) | 6026 | `score_river_step_toward_centroid` (`walk.rs`) | PORTOWANE (partia 2) | `scoreCentroid`: 200 (22 / -12 / 3 / 0) |
| `scoreRiverStepTowardCenterSquare` (prywatna) | 6041 | `score_river_step_toward_center_square` (`walk.rs`) | PORTOWANE (partia 2) | `scoreSquare`: 504 (40 / 32 / -22 / 4 / brak kwadratu) |
| `scoreRiverStepTowardLandCenter` (prywatna) | 6057 | `score_river_step_toward_land_center` (`walk.rs`) | PORTOWANE (partia 2) | `scoreLandCenter`: 288 (gałąź kwadrat i centroid) |

Podsumowanie: 52 pozycje tabeli (symbole i stałe zliczone z deklaracji `export`/`function`/`const`/`interface`/`type`
w 5121-6068, profiler jako jedna pozycja; patrz §5.4 o rozbieżności z tabelą P6-25).
PORTOWANE w pełni: 49 (r1: 32; r3: 34; partia 2: +15 - `auditMapTerrainData`, `canRiverDrainStep`, `isRiverDrainageGoal`,
`inferMapDimsFromHexes`, `isReliefRiverSource`, `pathEndsAtSea`, `riverStepDir`, `sameRiverDir`, `reconstructRiverPath`,
`riverHexDirDelta`, `estimateLandCentroidFromSeed/FromMouth`, `scoreRiverStepToward*` x3).
CZĘŚCIOWO: 0. NIE: 3 - `TraceRiverOpts` (interfejs; wymaga `RiverHexSpatialIndex`, web :8981, poza zakresem 5121-6068),
`growRiverInlandBeforeDrainage` (wymaga `collectInlandDrainGrowCandidates` web :6148 i `RiverHexSpatialIndex`/
`nearestRiverHexDistance` web :8981/:9044, poza zakresem), profiler (ZAŁOŻENIE: bez wpływu na wynik).
ZAŁOŻENIE partii 2: zależności spoza 5121-6068 nie są w tabeli; `growRiverInlandBeforeDrainage` przeniesiona do partii 3
wraz z ich portem (decyzja zakresu dla FC - nie DECISION_REQUIRED).

## 3. Lekcje M06B (wymogi dispatchu) - stan po r3

- (a) wektory z nakładkami na heksach wodnych i lądowych: TAK. `render_vectors_exercise_water_and_land_overlays`
  sprawdza `las`, `zloze`, `rzeka` (woda i ląd); `flow` ma heksy wodne i lądowe z nakładkami i rzekami.
- (b) cap pętli z wektorem N-1/N/N+1 na mapach rozróżniających cap: TAK (r3).
  `repair` (guard<64): mapa 70x70 Laka, D=62,63,64,65,66,67 w dwóch osiach; D<=64 domyka cel (długość D+1),
  D>=65 ucina przed celem (długość 65). `coastalRiverRenderPath` (guard<4): mapa 12x12 bez Morza, L=1,2,3;
  wynik 6/5/5 zależy od capu 4 (mutacje M9 cap 3 i M10 cap 5 wykryte).
- (c) niezależny weryfikator Python od zera z TS pinu: TAK, częściowo (zakres §5.3). `verify_m07a_logic.py`
  (stdlib, `python3 -I`) implementuje logikę niezależnie od Rust i generatora i porównuje z wektorami:
  quota 166/166, constants 4/4, mouthGap 324/324, sanitize 400/400, revisited 400/400, adjacent 400/400,
  split 400/400, flow 5760/5760, repair 240/240, repairCap 12/12, seaBuffer 240/240, fields.seaDist 40/40. RESULT: PASS.
  Plus `verify_m07a_consts.py` (r2): stałe 8/8, ELEVATION_RANK 8/8.
- (d) mutacje na każdej gałęzi sterującej: TAK (r3), 10/10 wykryte (§4).
- (e) plik wektorów ≤ 6 MB: TAK (3 763 728 B).
- (f) dossier z tabelą statusu per symbol: TAK (ten plik, §2).
- (g) logi bramek z `EXIT=`: TAK (r3): `gate-fmt-r3.log`, `gate-clippy-r3.log`, `gate-test-full-r3.log` w katalogu runu.
  `git diff --check` czysty.
- (h) komparatory sortowania zgodne z V8: DOTYCZY partii 2+. W partii 1 wyjścia są listami w kolejności
  wstawiania albo zbiorami porównywanymi po sortowaniu (`fields`).

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

## 5. Odstępstwa i zastrzeżenia (do decyzji orkiestratora / FC)

1. **Limit LOC partii - ROZWIĄZANE w r3**: `rivers_a.rs` ma 523 linie, `rivers_a/fields.rs` 145 (podmoduł
   `rivers_a::fields`, plik w katalogu `mapgen/rivers_a/`). `mapgen/mod.rs` bez zmian, więc test szkieletu M00
   (`mapgen_mod_declares_exactly_doc_modules`) zostaje zielony (sprawdzone w r3: 5/5 testów `p6_m00_skeleton`).
2. **Stałe jako kod, nie JSON**: stałe `RIVER_*` i progi są literałami w Rust (wartości z web, komentarze z numerami linii).
   Zmiana wartości w webie wymaga aktualizacji Rust i wektorów (wektory `constants` wykrywają dryf).
3. **Weryfikator Python - zakres częściowy**: `verify_m07a_logic.py` NIE obejmuje: `purge*` (wymaga
   `earthTemplateLandAt`), `render*` i `coastalRender` (patrz wektory + testy Rust), `fields.oceanConnected` i
   `openOceanDist`, profilera oraz symboli partii 2-4. Pełny weryfikator Python zaplanowany na koniec tematu (partia 4).
4. **Rozbieżność z tabelą P6-25 (zakres 52 vs ok. 32)**: plik `dyspozycje/rust-port/p6/P6-25-MAPA-GAP.md` nie
   istnieje w `rust-port/parity-v2`. Jego źródłowa tabela `gap-rows.tsv` istnieje w historii (commit `ae36d9ded`,
   `dyspozycje/autobot/runs/R-RUSTPORT-P6-25-MAPA-GAP-Q1/gap-rows.tsv`): zawiera 30 wierszy M07A od
   `ELEVATION_RANK` (5175) do `TraceRiverOpts` (5819) i NIE zawiera wierszy dla 5819-6068. Skan deklaracji
   w 5121-6068 daje 52 pozycje. Rozbieżność jest ZAŁOŻENIEM: zakres = skan deklaracji (52), tabela P6-25 = podzbiór.
5. **Profiler `CIV_RIVER_PROFILE`** nie jest portowany (ZAŁOŻENIE: bez wpływu na wynik generatora).
6. **Eksport `canRiverFlowThrough` do testów**: w pinie symbol nie jest eksportowany. Generator wektorów dopisuje
   jedną linię `export { canRiverFlowThrough };` w loaderze (`reg/m07a-hooks.mjs`) - kod funkcji nietknięty.

## 6. Następne partie (plan)

- Partia 2: ZROBIONE (`rivers_a/walk.rs`, 15 pozycji, wektory `web-rivers-a-walk.json`, mutacje M1-M10).
- Partia 3: `RiverHexSpatialIndex` i `nearestRiverHexDistance` (web :8981/:9044) + `collectInlandDrainGrowCandidates` (web :6148)
  + `growRiverInlandBeforeDrainage` (pętla z capami N-1/N/N+1, `RIVER_HARD_MEANDER_LEN`) + `TraceRiverOpts`.
- Partia 4: pełny weryfikator Python dla purge/render/openOcean, dossier domknięte, bramki pełne (cargo test/clippy/fmt/diff --check).

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
