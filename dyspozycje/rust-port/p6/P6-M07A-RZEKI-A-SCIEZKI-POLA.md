# P6.M07A - rzeki, część A: ścieżki i pola (dossier)

Temat: `R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1`. Zakres web: `gra/src/map/gen-helpers.ts:5121-6068`,
pin `edb8fb56` (uruchamiany kod TS, `git archive edb8fb56 gra/src gra/data`). Baza: `rust-port/parity-v2` @ `48d301fe8`.

**Status tematu: RUNDA 1/5 - ZAKRES NIEKOMPLETNY (partia 1 z 4).** Część symboli zakresu jest portowana i zweryfikowana
wektorami; reszta (trasowanie, meandry, centroidy, `pathEndsAtSea`) czeka na partie 2-4. Dossier nie deklaruje
zakończenia tematu.

## 1. Pliki

| Plik | Rola | Linie |
|---|---|---|
| `rust-port/engine/src/domain/mapgen/rivers_a.rs` | port partii 1 | 650 (limit partii 600 - przekroczony o 50, patrz §5) |
| `rust-port/engine/tests/p6_m07a_rivers_a.rs` | testy wektorowe (17) | - |
| `rust-port/engine/tests/p6_m07a_vectors/common.rs` | wspólny loader wektorów | - |
| `rust-port/engine/tests/p6_m07a_vectors/web-rivers-a.json` | wektory z uruchomionego weba (3,1 MB < 6 MB) | - |
| `dyspozycje/autobot/runs/R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1/gen-m07a-vectors.mjs` | generator wektorów (importuje `gen-helpers.ts` z pinu) | - |

`mod.rs` i `data/derived.rs` bez zmian (`rivers_a` był już zadeklarowany w szkielecie M00).

## 2. Tabela statusu per symbol

Legenda: PORTOWANE = funkcja Rust + wektor z weba + testy; NIE = jeszcze nie portowane (partia wskazana).

| Symbol web | Linia web | Rust (`rivers_a.rs`) | Status | Wektory / dowód |
|---|---|---|---|---|
| `auditMapTerrainData` | 5121 | - | NIE (partia 4, diagnostyka audytu) | - |
| `ELEVATION_RANK` | 5175 | `elevation_rank` | PORTOWANE | `constants` + tabela w teście |
| `riversQuotaForLandMass` | 5187 | `rivers_quota_for_land_mass` | PORTOWANE | `quota`: 166 przypadków (n 0..40, progi 8/14, tiery low/medium/high) |
| `hexAxialDistance` (prywatna) | 5194 | `hex_axial_distance` (prywatna) | PORTOWANE | pośrednio (`sanitize`, `adjacent`, `repair`) |
| `purgeOceanInsideEarthLandMask` | 5204 | `purge_ocean_inside_earth_land_mask` | PORTOWANE | `purgeOcean`: 64 przypadki, 53 z realną zmianą |
| `purgeStrayLandOutsideEarthMask` | 5244 | `purge_stray_land_outside_earth_mask` | PORTOWANE | `purgeStray`: 64 przypadki, wszystkie ze zmianą |
| `landRiverRenderPath` | 5261 | `land_river_render_path` | PORTOWANE | `landRender`: 360 |
| `countMediumInlandLandHexes` | 5279 | `count_medium_inland_land_hexes` | PORTOWANE | `countMediumInland`: 360 |
| `mediumRiverRenderPath` | 5295 | `medium_river_render_path` | PORTOWANE | `mediumRender`: 360 |
| `coastalRiverRenderPath` | 5312 | `coastal_river_render_path` | PORTOWANE | `coastalRender`: 360 (282 niepuste, 154 o długości >=2) |
| `hasLandNeighborTouchingSea` (prywatna) | 5383 | `has_land_neighbor_touching_sea` | PORTOWANE | przez `coastalRender` |
| `hasMorzeNeighborForRiverRender` (prywatna) | 5392 | `has_morze_neighbor_for_river_render` | PORTOWANE | przez `coastalRender` |
| `assertRiverPathAdjacent` | 5400 | `assert_river_path_adjacent` | PORTOWANE | `adjacent`: 400 |
| `splitAdjacentRiverChains` | 5415 | `split_adjacent_river_chains` | PORTOWANE | `split`: 400 (146 z >1 łańcuchem) |
| `sanitizeRiverPath` | 5440 | `sanitize_river_path` | PORTOWANE | `sanitize`: 400 (284 zmienione) |
| `riverPathHasRevisitedHex` | 5457 | `river_path_has_revisited_hex` | PORTOWANE | `revisited`: 400 |
| `repairRiverPathAdjacency` | 5468 | `repair_river_path_adjacency` | PORTOWANE | `repair`: 240 (191 zmienionych, 111 z wejściem niesąsiednim) |
| `RIVER_MIN_INLAND_FROM_SEA` | 5512 | stała | PORTOWANE | `constants` |
| `RIVER_MIN_MAIN_LEN` | 5518 | stała | PORTOWANE | `constants` |
| `RIVER_HARD_MEANDER_LEN` | 5523 | stała | PORTOWANE | `constants` |
| `RIVER_MOUTH_TAIL_LEN` | 5526 | stała | PORTOWANE | `constants` |
| `MAIN_RIVER_MIN_PATH_SEP` | 5529 | stała | PORTOWANE | `constants` |
| `MEDIUM_TRIBUTARY_SPACING_HEX` | 5532 | stała | PORTOWANE | `constants` |
| `mediumTributarySpacingHex` | 5535 | `medium_tributary_spacing_hex` | PORTOWANE | test jednostkowy (definicja web bez argumentu zależnego od rozmiaru) |
| `MEDIUM_TRIBUTARY_MIN_NET_LEN` | 5538 | stała | PORTOWANE | `constants` |
| `mediumTributaryMinNetLen` | 5543 | `medium_tributary_min_net_len` | PORTOWANE | test jednostkowy progów 79/80/119/120 (ZAŁOŻENIE: bez wektora, wartości z definicji web) |
| `MAIN_RIVER_COAST_MOUTH_MAX_GAP` | 5551 | stała | PORTOWANE | `constants` |
| `mainRiverCoastMouthMaxGapForDims` | 5554 | `main_river_coast_mouth_max_gap_for_dims` | CZĘŚCIOWO | test tylko dla gałęzi poza 'mala' (200x200); gałąź 'mala' (5) NIEPRZETESTOWANA wektorem |
| `riverPathRespectsSeaBuffer` | 5561 | `river_path_respects_sea_buffer` (w `rivers_a.rs`) | PORTOWANE | `seaBuffer`: 240 (102 true / 138 false) |
| `canRiverDrainStep` (prywatna) | 5580 | - | NIE (partia 3) | - |
| `isRiverDrainageGoal` (prywatna) | 5595 | - | NIE (partia 3) | - |
| `buildSeaDistanceField` | 5614 | `build_sea_distance_field` | PORTOWANE | `fields`: 40 map (seaDist) |
| `buildOpenOceanDistanceField` | 5640 | `build_open_ocean_distance_field` | PORTOWANE | `fields`: 40 map (openOceanDist) |
| profiler `CIV_RIVER_PROFILE` (`RIVER_PROFILE_ON`, `rpNow`, `RiverProfileStats`, `rpEnsure`, `reset/get/formatRiverProfileReport`) | 5670-5752 | - | NIE PORTOWANE - diagnostyka env, bez wpływu na wynik (ZAŁOŻENIE; weryfikacja w partii 3, gdy profiler zostanie dotknięty przez `generateRivers`) | - |
| `RiverFieldCache` / `buildRiverFieldCache` | 5755-5761 | `RiverFieldCache` / `build_river_field_cache` | PORTOWANE (bez gałęzi profilera) | `fields`: 40 map |
| `inferMapDimsFromHexes` (prywatna) | 5781 | - | NIE (partia 3) | - |
| `isReliefRiverSource` (prywatna) | 5792 | - | NIE (partia 3) | - |
| `pathEndsAtSea` | 5797 | - | NIE (partia 3) | - |
| `TraceRiverOpts` (interfejs) | 5819 | - | NIE (partia 3) | - |
| `RiverCoord` (typ) | 5844 | `RiverCoord` | PORTOWANE | - |
| `isReliefTerrain` (prywatna) | 5847 | `is_relief_terrain` | PORTOWANE | przez `repair` / `canRiverFlowThrough` |
| `canRiverFlowThrough` | 5862 | `can_river_flow_through` | CZĘŚCIOWO | wywołania z `repair` używają tylko domyślnych argumentów (`blockExisting=false`, `allowRelief=false`); gałęzie `block_existing`/`allow_key`/`allow_relief_traversal` NIE są pokryte wektorami (pokryje partia 2/3) |
| `riverStepDir` (prywatna) | 5879 | - | NIE (partia 2) | - |
| `sameRiverDir` (prywatna) | 5883 | - | NIE (partia 2) | - |
| `reconstructRiverPath` (prywatna) | 5887 | - | NIE (partia 2) | - |
| `growRiverInlandBeforeDrainage` (prywatna) | 5903 | - | NIE (partia 3) | - |
| `riverHexDirDelta` (prywatna) | 5975 | - | NIE (partia 3) | - |
| `estimateLandCentroidFromSeed` (prywatna) | 5982 | - | NIE (partia 4) | - |
| `estimateLandCentroidFromMouth` (prywatna) | 6016 | - | NIE (partia 4) | - |
| `scoreRiverStepTowardCentroid` (prywatna) | 6026 | - | NIE (partia 4) | - |
| `scoreRiverStepTowardCenterSquare` (prywatna) | 6041 | - | NIE (partia 4) | - |
| `scoreRiverStepTowardLandCenter` (prywatna) | 6057 | - | NIE (partia 4) | - |

Podsumowanie: 52 pozycje tabeli (symbole i stałe zliczone z deklaracji `export`/`function`/`const`/`interface`/`type` w 5121-6068, profiler jako jedna pozycja).
PORTOWANE w pełni: 32. CZĘŚCIOWO: 2. NIE: 18 (w tym profiler, celowo poza zakresem wyniku).

## 3. Lekcje M06B (wymogi dispatchu) - stan

- (a) wektory z nakładkami na heksach wodnych i lądowych: TAK. `render_vectors_exercise_water_and_land_overlays`
  sprawdza `las` (woda i ląd), `zloze` (woda i ląd), `rzeka` (woda i ląd) w mapach wektorów.
- (b) cap pętli z wektorem N-1/N/N+1: DOTYCZY partii 2+ (pętle `repair` `guard<64` i dociąganie wybrzeża `guard<4`).
  Partia 1 ma mutacje na capach (M6: `0..4`→`0..3`, M1 tie-break), NIE ma osobnych map N-1/N/N+1 dla capu `guard`.
- (c) niezależny weryfikator Python od zera z TS pinu: NIE ZROBIONO (partia 1 weryfikowana bezpośrednio
  uruchomionym kodem TS; weryfikator Python zaplanowany na koniec tematu).
- (d) mutacje na każdej gałęzi sterującej: CZĘŚCIOWO. Partia 1: 7 mutacji, wszystkie wykryte (§4).
  Gałęzie `canRiverFlowThrough` (block/allow) jeszcze nie mutowane (brak wywołań z wektorami).
- (e) plik wektorów ≤ 6 MB: TAK (3 068 407 B).
- (f) dossier z tabelą statusu per symbol: TAK (ten plik, §2).
- (g) logi bramek z `EXIT=`: TAK (`gate-fmt-r1.log`, `gate-clippy-r1.log`, `gate-test-r1.log` w katalogu runu).
  Puste linie na końcu plików: `git diff --check` czysty.
- (h) komparatory sortowania zgodne z V8: DOTYCZY partii 2+. W partii 1 wyjścia są listami w kolejności
  wstawiania (`Object.entries`) lub zbiorami porównywanymi po sortowaniu (`fields`: sortowanie po kluczu w generatorze i teście).

## 4. Mutacje (partia 1) - wszystkie wykryte

Skrypt: mutacja pojedynczej linii w `rivers_a.rs`, `cargo test --test p6_m07a_rivers_a`, przywrócenie oryginału.

| Mutacja | Wykryta przez |
|---|---|
| M1 tie-break repair `nd < best_dist` → `<=` | `coastal_river_render_path_matches_web`, `repair_river_path_adjacency_matches_web` |
| M2 `Terrain::Polar` wyłączony z `is_river_land_terrain` | `count_medium_inland_land_hexes_matches_web`, `medium_river_render_path_matches_web` |
| M3 próg pustyni `pust_n >= 2` → `>= 3` | `purge_ocean_inside_earth_mask_matches_web` |
| M4 tie coastal `score > best` → `>=` | `coastal_river_render_path_matches_web` |
| M5 bufor morza `body_end` o +1 | `river_path_respects_sea_buffer_matches_web` |
| M6 cap dociągania wybrzeża `0..4` → `0..3` | `coastal_river_render_path_matches_web` |
| M7 sanityzacja bez odrzucania powtórzeń | 5 testów (render, repair, pure path) |

## 5. Odstępstwa i zastrzeżenia (do decyzji orkiestratora / FC)

1. **Limit LOC partii**: `rivers_a.rs` ma 650 linii (limit 600). Próba podziału na `rivers_a_fields.rs` została
   wycofana: test szkieletu `tests/p6_m00_skeleton.rs:173` (`mapgen_mod_declares_exactly_doc_modules`) wymaga,
   by `mapgen/mod.rs` deklarował dokładnie 22 moduły z dokumentu M00, a dokument M00 nie jest na allowliście tematu.
2. **Stałe jako kod, nie JSON**: stałe `RIVER_*` i progi są literałami w Rust (wartości z web, komentarze z numerami linii).
   Zmiana wartości w webie wymaga aktualizacji Rust i wektorów (wektory `constants` wykrywają dryf).
3. **Brak weryfikatora Python** (lekcja c) - do domknięcia w końcowej partii tematu.
4. **Plik `P6-25-MAPA-GAP.md` nieobecny** w `rust-port/parity-v2` (dispatch podaje go jako tabelę symboli).
   Zakres ustalono skanem deklaracji w `gen-helpers.ts:5121-6068` oraz wierszem M07A z
   `dyspozycje/autobot/runs/R-RUSTPORT-P6-M00-MAPGEN-SZKIELET-Q1/p6-25-sec6-rows-m00-m18.txt`.
5. **Profiler `CIV_RIVER_PROFILE`** nie jest portowany (ZAŁOŻENIE: bez wpływu na wynik generatora).

## 6. Następne partie (plan)

- Partia 2: `riverStepDir`, `sameRiverDir`, `reconstructRiverPath`, pełne gałęzie `canRiverFlowThrough` (wektory + mutacje).
- Partia 3: `canRiverDrainStep`, `isRiverDrainageGoal`, `inferMapDimsFromHexes`, `isReliefRiverSource`, `pathEndsAtSea`,
  `TraceRiverOpts`, `growRiverInlandBeforeDrainage`, `riverHexDirDelta` (pętle z capami N-1/N/N+1).
- Partia 4: `estimateLandCentroid*`, `scoreRiverStepToward*`, `auditMapTerrainData`, weryfikator Python, dossier domknięte.
