# P6.M06A9 - Lad / morze / Pangea (finał): korytarze, rebalance Pangei, rebalance lad/morze

Temat: R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1. Runda 1 (Operator-impl).
Baza: `origin/rust-port/parity-v2` = `87fda853` (silnik 1396 testow przed zmianami tematu).
Pin web: `edb8fb56` (eksport `git archive edb8fb56 gra/src gra/data` do katalogu tymczasowego poza repo).
Wzorzec: P6-M06A8 (ensure, hak fill), P6-M05B (wektory brzegowe, generator z pinu).
Run: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1/`.

## Status symboli zakresu (binarne kryterium)

| Symbol web (pin edb8fb56) | Status r1 | Kod Rust | Dowod |
|---|---|---|---|
| `fillPangeaAnnularSeaCorridors` (:4595, export) | PORTOWANY (impl) | `landsea.rs::fill_pangea_annular_sea_corridors` | `fill-vectors.json` (120 przyp.), test `fill_pangea_annular_sea_corridors_matches_web`: 0 rozbieznosci |
| `pangeaLandCentroid` (:4473, prywatna) | PORTOWANY (impl) | `landsea.rs::pangea_land_centroid` | pokryty przez fill (wektory) |
| `pangeaRadialDryLandSteps` (:4484, prywatna) | PORTOWANY (impl) | `landsea.rs::pangea_radial_dry_land_steps` | pokryty przez fill (wektory) |
| `pangeaSeaHexIsAnnularCorridor` (:4512, prywatna) | PORTOWANY (impl) | `landsea.rs::pangea_sea_hex_is_annular_corridor` | pokryty przez fill (wektory) |
| `rebalanceLandFractionPangea` (:3667, export) | PORTOWANY (impl) | `landsea.rs::rebalance_land_fraction_pangea` | `pangea-vectors.json` (60 przyp.), test `rebalance_land_fraction_pangea_matches_web`: 0 rozbieznosci |
| `rebalanceLandSeaRatio` (:3791, export) | PORTOWANY (impl) | `landsea.rs::rebalance_land_sea_ratio` | `ratio-vectors.json` (101 przyp.), test `rebalance_land_sea_ratio_matches_web`: 0 rozbieznosci |
| hak `ensurePangeaSingleContinent` (M06A8) | ZAMKNIETY | `ensure_pangea_single_continent(..., fill_hook)`; w `rebalance_land_fraction_pangea` hak = prawdziwe `fill_pangea_annular_sea_corridors` | wektory M06A8 nadal z hakiem `0` (testy bez zmian) |

Pelna rownowaznosc `ensurePangeaSingleContinent` z webem (z fill) jest zapewniona przez `rebalanceLandFractionPangea`
(test pangea-vectors z prawdziwym fill). Wektory M06A8 (`ensure-vectors.json`) pozostaja z hakiem `0` i nie sa oslabione.

## Tabela M06A (wiersze RUNDA-2 z `P6-M06A-LAD-MORZE-WYBRZEZE-A.md`)

Stan kodu sprawdzony `grep` po `rust-port/engine/src` (r1). Dowod wektorowy dla wierszy innych niz M06A9 pochodzi z
tematow wlasciciela (kolumna "Temat"); w TEJ rundzie NIE ZWERYFIKOWANO go ponownie (pomiary = runda Operator-pomiary).

| Symbol web | Kod Rust (landsea.rs) | Temat wlasciciela | Status r1 |
|---|---|---|---|
| `assignContinentIndices` :3186 | `assign_continent_indices` | M06A2-A4 (kolejne) | KOD ISTNIEJE - dowod do potwierdzenia |
| `sortLandKeysForErosion` :3207 | `sort_land_keys_for_erosion` | M06A5 | KOD ISTNIEJE - dowod do potwierdzenia |
| `enforceLatitudinalOceanBuffer` :3339 | `enforce_latitudinal_ocean_buffer` | M06A3 | KOD ISTNIEJE - dowod do potwierdzenia |
| `climateBandBaseTerrain` :3360 | `climate_band_base_terrain` | M06A3 | KOD ISTNIEJE - dowod do potwierdzenia |
| `applyClimateBandsToHexes` :3380 | `apply_climate_bands_to_hexes` | M06A3 | KOD ISTNIEJE - dowod do potwierdzenia |
| `enforceEarthTemplateOnHexes` :3418 | `enforce_earth_template_on_hexes` | M06A3 | KOD ISTNIEJE - dowod do potwierdzenia |
| `LandFractionFillBias` / `PANGEA_LAND_FILL_MIN_SCORE` :3435-3438 | `LandFractionFillBias`, `mapgen-landsea-fill.json` | M06A5 | KOD ISTNIEJE - dowod do potwierdzenia |
| `applyLandFractionByScore` :3444 | `apply_land_fraction_by_score` | M06A5 | KOD ISTNIEJE - dowod do potwierdzenia |
| `rebalanceLandFractionWithMargins` :3532 | `rebalance_land_fraction_with_margins` | M06A5 | KOD ISTNIEJE - dowod do potwierdzenia |
| `erodePangeaBboxLowScoreRim` :3551 | `erode_pangea_bbox_low_score_rim` | M06A6 | KOD ISTNIEJE - dowod do potwierdzenia; uzywany przez `rebalance_land_fraction_pangea` (M06A9) |
| `carvePangeaLongSideGulfs` :3606 | `carve_pangea_long_side_gulfs` | M06A6 | KOD ISTNIEJE - dowod do potwierdzenia; uzywany przez `rebalance_land_fraction_pangea` (M06A9) |
| `rebalanceLandFractionPangea` :3667 | `rebalance_land_fraction_pangea` | M06A9 | PORTOWANY (wektory 60, 0 rozbieznosci) |
| `applyLandFractionByContinent` :3701 | `apply_land_fraction_by_continent` | M06A5/M06A7 | KOD ISTNIEJE - dowod do potwierdzenia |
| `rebalanceLandSeaRatio` :3791 | `rebalance_land_sea_ratio` | M06A9 | PORTOWANY (wektory 101, 0 rozbieznosci) |
| `removeInlandWaterPools` :4137 | `remove_inland_water_pools` | M06A4 | KOD ISTNIEJE - dowod do potwierdzenia |
| `purgeDesertEnclaveWater` :4156 | `purge_desert_enclave_water` | M06A4 | KOD ISTNIEJE - dowod do potwierdzenia |
| `fillEnclosedWaterByLandNeighbors` :4189 | `fill_enclosed_water_by_land_neighbors` | M06A4 | KOD ISTNIEJE - dowod do potwierdzenia |
| `purgeInlandWaterForMultiLandTyp` :4215 | `purge_inland_water_for_multi_land_typ` | M06A4 | KOD ISTNIEJE - dowod do potwierdzenia |
| `applyJaggedCoastNoise` :4232 | `apply_jagged_coast_noise` | M06A4 | KOD ISTNIEJE - dowod do potwierdzenia; wywolanie z 5 przebiegami w `rebalance_land_fraction_pangea` |
| `removeSmallInlandWaterPools` :4276 | `remove_small_inland_water_pools` | M06A4 | KOD ISTNIEJE - dowod do potwierdzenia |
| `removeInlandSeaPools` :4320 | `remove_inland_sea_pools` | M06A4 | KOD ISTNIEJE - dowod do potwierdzenia |
| `pangeaAnnularMaxCorridorWidth` :4329 | `pangea_annular_max_corridor_width` | M06A7 | PORTOWANY (M06A7) |
| `groupDryLandMassKeys` :4338 | `group_dry_land_mass_keys` | M06A8 | PORTOWANY (M06A8, 418+39 przyp.) |
| `isPangeaBridgeWater` :4371 | `is_pangea_bridge_water` | M06A7 | DANE-JUZ-W-RUST |
| `ensurePangeaSingleContinent` :4375 | `ensure_pangea_single_continent` | M06A8 + M06A9 | PORTOWANY (hak zamkniety w M06A9) |

Zamkniete w tej rundzie: `fillPangeaAnnularSeaCorridors`, `rebalanceLandFractionPangea`, `rebalanceLandSeaRatio`.
**M06A KOMPLET: NIE** - wiersze oznaczone "dowod do potwierdzenia" wymagaja weryfikacji wektorowej w rundzie
Operator-pomiary (lub osobnego tematu). Nie zapisano "M06A KOMPLET" (binarne kryterium nie jest spelnione).

## Zalozenia (rozstrzygniete bez pytan)

- Z1. Kolejnosc sekwencji `rebalanceLandFractionPangea` 1:1 z webem (18 krokow: fill, applyLandFractionByScore(mask), enforce,
  erode, carve, x2; fill, ensure, applyLFS, enforce, jagged(5), fill, ensure, enforce).
- Z2. `hex.coords` w `fill` = `TerrainHex.q/r`. Dla kluczy kanonicznych "q,r" identyczne z `parseHexKey`. Klucze niekanoniczne
  NIE sa w wektorach (poza zakresem, jak Z2 w M06A8).
- Z3. Iteracja `Object.entries(hexes)` w fill = iteracja po kluczach w kolejnosci wstawiania, stan terenu czytany na zywo
  (jak `hex` - ta sama referencja w JS). Klucze nie sa usuwane w trakcie, wiec snapshot kluczy jest rownowazny.
- Z4. `pangeaLandCentroid`: suma `parseHexKey` po suchym lądzie w kolejnosci wstawiania (sumy calkowite, dokladne w f64).
- Z5. Literaly danych przeniesione do `rust-port/engine/data/derived/mapgen-landsea-pangea-fill.json`
  (`fill_centroid_min_land` 40, `fill_dist_epsilon` 0.01, `fill_zapas_szerokosci` 2, `fill_prog_pasma_zapas` 1,
  `rebalance_jagged_passes` 5). Progi `erode`/`carve` i ich domyslne wartosci (0.74/1200, 1.85/900) - z istniejacego
  `mapgen-landsea-pangea.json`. Clamp udzialu 0.15/0.85 - z `mapgen-landsea-fill.json`.
  Stale strukturalne (startowe `sea_band = 1`, `pass` od 0, `step` od 1, `rel. <= 1` erozji, `ceil(sqrt)`) pozostaja w kodzie.
- Z6. `rebalanceLandSeaRatio`: skan wierszami (r, potem q) jak w webie; wybor najnizszego `score` przez ostre `<` (pierwszy wygrywa).
- Z7. Hak `ensurePangeaSingleContinent` w `rebalance_land_fraction_pangea` = `fill_pangea_annular_sea_corridors(h, w, hh, None)`.
  Wywolania `ensure` z innych miejsc (testy M06A8) nadal podaja `|_, _, _| 0`.

## Math.* - wykaz miejsc

| Miejsce web | Rust | Uwagi |
|---|---|---|
| `Math.hypot` (fill :4602/4611 i `pangeaRadialDryLandSteps` :4488) | `masks::v8math::js_hypot` | zgodnie z dispatchem |
| `Math.max(0.01, distSelf)` (fill, dzielnik) | `js_max` | eps z JSON |
| `Math.round(q + uq*step)` (fill, radial) | `improvements::js_round` | JS half-up; na calkowitych kluczach zgodne |
| `Math.sqrt((w*h)/20160)` (`pangeaAnnularMaxCorridorWidth`) | `pangea_annular_max_corridor_width` (M06A7) | bez zmian |
| `Math.sqrt(w*h)` + `Math.ceil` (`rebalanceLandSeaRatio` maxLayers) | `f64::sqrt`, `f64::ceil` | IEEE, identyczne |
| `Math.round(total*clamped)` (ratio) | `js_round` | |
| `Math.max/min` clamp (ratio) | `js_max`/`js_min` | |
| `Math.floor` (`applyJaggedCoastNoise` przez landsea) | wewnatrz istniejacego kodu (M06A4) | |
| `Math.sin/cos/pow/atan2` | NIE DOTYCZY w tym temacie (nie wystepuja w trzech symbolach) | jadra `k_sin/k_cos/rem_pio2` nie zmieniano |

## Wektory i testy

- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1/gen-m06a9-vectors.mjs`
  (node 22, loadery `m06a-loader-*.mjs`; wywolania eksportowanych symboli z ORYGINALNEGO pinu, bez instrumentacji).
- `tests/p6_m06a9_vectors/fill-vectors.json` (1.6 MB, 120 przyp.): `losowe` 90, `granica-pas` 24 (maxW 3/4/6/8 x a 5/7 x T = maxW-1/maxW/maxW+1),
  `prog-ladu` 3 (39/40/41 suchych), `brzeg` 3.
- `tests/p6_m06a9_vectors/ratio-vectors.json` (0.6 MB, 101 przyp.): `losowe` 90, `prog-udzialu` 9 (land = target-1/target/target+1 dla 0.3/0.5/0.7), `brzeg` 2.
- `tests/p6_m06a9_vectors/pangea-vectors.json` (1.6 MB, 60 przyp., landScores + perm 256): `losowe` 60; 60/60 zmienia stan.
- Testy: `rust-port/engine/tests/p6_m06a9_landsea.rs` (4 testy: liczby rodzin; fill/ratio/pangea zgodne z webem).
- Zmiany: fill zmienil stan w 112/120 przyp. (`converted>0`), ratio w 95/101.
- Prog `prog-ladu` (39/40/41): wynik 0 zmian we wszystkich 3 przypadkach - wartosc progu centroidu NIE jest tu rozstrzygalna
  w tej rodzinie (dowod graniczny do rundy pomiarowej; NIE ZMIERZONO trafien N-1/N/N+1 na progu 40).
- Trafienia graniczne (N-1/N/N+1 dla pasma i progu) i mutacje: NIE ZMIERZONO w tej rundzie (Operator-impl; pomiary = Operator-pomiary).

## Gate (runda 1)

- `cargo fmt -- --check`: EXIT=0 (`gate-fmt-r1.log`).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 po dwu poprawkach (`question_mark`, `is_none_or`) (`gate-clippy-r1.log`).
- `cargo test` (pelny silnik): 1400 passed, 0 failed (`gate-test-r1.log`); baza 1396 + 4 nowe.
- `git diff --check`: patrz run.

## Dryf po pinie

`git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 8 hunkow, pierwszy `@@ -5992`, ostatni `@@ -10804`
(lacznie 40 zmienionych linii). Zadne hunki nie wpadaja w zakres 3186-4374 ani w linie symboli tej rundy
(4473-4612, 3667-3700, 3791-3880). Pin NIE przepinany (zgodnie z dispatchem); odswiezenie = osobny temat po
R-RUSTPORT-REPIN-DELTA-Q1.

## Nastepne kroki (osobne ID)

- Operator-pomiary: niezalezny weryfikator (Python), trafienia graniczne (N-1/N/N+1 pasma, prog 40, prog masy),
  mutanty strukturalne galezi (fill, ratio, pangea), dowody rownowaznosci dla przezytych mutantow.
- Weryfikacja wektorowa wierszy "dowod do potwierdzenia" w tabeli M06A (osobne przeglady ich tematow).
- Po zamknieciu tabeli: wpis "M06A KOMPLET" w dossier (dopiero wtedy).
