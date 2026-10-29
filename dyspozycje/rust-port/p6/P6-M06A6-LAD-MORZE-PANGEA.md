# P6.M06A6 - lad / morze: rodzina Pangei i kontynentow, partia 1

**Temat:** R-RUSTPORT-P6-M06A6-LAD-MORZE-PANGEA-Q1 (runda 1, Operator-impl).
**Pin webu:** `edb8fb56` (`git archive edb8fb56 gra/src gra/data`, rozpakowane poza repo).
**Baza Rust:** `rust-port/parity-v2` @ `dcd3eadb` (zawiera M06A..M06A5).
**Kontekst:** wzorzec M06A5 (`P6-M06A5-LAD-MORZE-ULAMEK.md`), M05B (`P6-M05B-RELIEF-B-POKRYCIE-PASMA.md`).

## Zakres partii 1 i status (binarne kryterium)

| Symbol web (pin edb8fb56) | Status | Implementacja Rust | Dowod |
|---|---|---|---|
| `erodePangeaBboxLowScoreRim` :3551 (prywatna) | PORTOWANY | `landsea::erode_pangea_bbox_low_score_rim` | `tests/p6_m06a6_pangea.rs::erode_pangea_bbox_low_score_rim_matches_web` (250 przypadkow, 112 z erozja); `erode_bbox_threshold_n_minus_1_n_n_plus_1` |
| `carvePangeaLongSideGulfs` :3606 (prywatna) | PORTOWANY | `landsea::carve_pangea_long_side_gulfs` | `carve_pangea_long_side_gulfs_matches_web` (250 przypadkow, 97 z wycieciem); `carve_threshold_79_and_80_land_hexes`; `carve_aspect_exactly_1_85_does_not_carve` |
| `applyLandFractionByContinent` :3701 (eksport) | PORTOWANY | `landsea::apply_land_fraction_by_continent` | `apply_land_fraction_by_continent_matches_web` (205 przypadkow, 21 z NaN, 194 ze zmianami); `apply_land_fraction_by_continent_zero_continents_is_noop` |
| `rebalanceLandFractionPangea` :3667 (eksport) | RUNDA-2 | - | Zalezy od `fillPangeaAnnularSeaCorridors` (:4595) i `ensurePangeaSingleContinent` (:4375), oba NIEPORTOWANE i nieprzypisane do zadnego tematu (patrz "Luki"). |
| `rebalanceLandSeaRatio` :3791 | RUNDA-2 | - | Osobny temat (lista dispatchu). |
| `pangeaAnnularMaxCorridorWidth` :4329 | RUNDA-2 | - | Osobny temat (lista dispatchu). |
| `groupDryLandMassKeys` :4338 | RUNDA-2 | - | Osobny temat (lista dispatchu). |
| `isPangeaBridgeWater` :4371 | RUNDA-2 | - | Osobny temat (lista dispatchu). |

Dane (DANE-JUZ-W-RUST / nowe dane w JSON): progi i szum zebrane w nowym pliku
`data/derived/mapgen-landsea-pangea.json` (loader `data::derived::mapgen_landsea_pangea()`).
Test `pangea_data_matches_web_constants` pilnuje wartosci wzgledem web (0.74, 1200, pas 2, tolerancja 0.02,
80, 1.85, 900, 0.28, 3, 0.42, szum 0.08/40/3, waga 0.15). Wspolne progi (0.15/0.85, 0.11, 0.04)
pochodza z `mapgen-landsea-fill.json` (M06A5). Kod nie zawiera literalow danych tych symboli.

## Zaleznosci uzyte z innych modulow (bez zmian w nich)

`parse_hex_key` (`terrain_class`), `set_hex_to_morze`, `set_hex_to_laka`, `is_in_map_border`,
`map_center_distance_norm`, `enforce_map_border_ocean`, `apply_marginal_land_zone_caps`, `fbm` i `PERM_TABLE_LEN` (`prims`),
`js_array_sort_by` (`cluster_mass`), `js_round` (`improvements`), `masks::v8math::{js_min, js_max, js_hypot}`,
`sort_land_keys_for_erosion` i `apply_land_fraction_by_score` (M06A5, `landsea`).

## Wykaz Math.* (implementacja uzyta)

| Miejsce | Web | Rust |
|---|---|---|
| erode: min/max granic bbox, `bboxArea` | `Math.min/max` | `v8math::js_min/js_max` |
| erode: sort obrzeza, odleglosc od srodka | `Math.hypot` | `v8math::js_hypot` (Kahan, jak V8) |
| erode: `Math.abs` | `Math.abs` | `f64::abs` (dokladne IEEE) |
| carve: `aspect`, `carveDepth`, `distEdge` | `Math.max/min` | `v8math::js_max/js_min` |
| carve: `Math.floor(shortSpan*0.28)` | `Math.floor` | `f64::floor` (dokladne IEEE) |
| carve: szum | `fbm` | `prims::fbm` (port M01) |
| continent: clamp udzialu, `targetLand`, `quota` | `Math.max/min/round` | `v8math::js_max/js_min`, `js_round` |

## Zalozenia (rozstrzygniete bez pytan)

- Z-1: Klucze `"q,r"` sa kanoniczne (jak w M06A/M06A5). Parsowanie wspolrzednych przez `parse_hex_key`
  (f64, jak web `parseHexKey`), wiec klucz niekanoniczny daje NaN zgodnie z webem.
- Z-2: `Object.keys` = kolejnosc wstawiania (`HexRecord`); `Map` `continentOf` = `HashMap<String, i64>`, brak wpisu = 0 (web `?? 0`).
- Z-3: `width ?? 1` w sortowaniu: `dims = None` -> `(1,1)`. Granica (`hasBorder`) wymaga obu wymiarow > 0; krok koncowy
  `applyLandFractionByScore` / `applyMarginalLandZoneCaps` / `enforceMapBorderOcean` wykonuje sie gdy `dims` jest `Some` (web `!= null`), takze dla 0.
- Z-4: `targetLandFraction = NaN` -> zgodnie z webem: `targetLand` = NaN, brak zmian w petli, krok koncowy wykonany (`final != NaN` prawdziwe). Testowane wektorami (21 przypadkow NaN).
- Z-5: Wartosci NaN w wektorach zapisane jako napis `"NaN"`.
- Z-N0: `nContinents = 0`: web rzuca TypeError (`zoneKeys[-1].push`) przy niepustej mapie. Rust zwraca 0 bez zmian (test `..._zero_continents_is_noop`). Brak wektora (web nie ma wyniku).
- Z-6: `rebalanceLandFractionPangea` nie jest portowana w tej rundzie (RUNDA-2, patrz nizej); nie ma dla niej wektorow.

## Wektory i generator

- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A6-LAD-MORZE-PANGEA-Q1/gen-m06a6-pangea-vectors.mjs` (seed 20261101).
- Prywatne funkcje (`erodePangeaBboxLowScoreRim`, `carvePangeaLongSideGulfs`) uruchamiane z INSTRUMENTOWANEJ KOPII
  `gen-helpers.ts` (jedyna zmiana: `export` przed `function`), w katalogu poza repo. Logika nietknieta.
- Pliki (kazdy <= 10 MB): `tests/p6_m06a6_vectors/erode-vectors.json` (1,2 MB), `carve-vectors.json` (4,6 MB), `contfrac-vectors.json` (0,6 MB).
- Przypadki brzegowe: erozja - blok 10x10 z rogami, L in {4, 50, 73, 74, 75, 99, 100} przy progach 0.73/0.74/0.75 i maxErode {0,1,3,1200};
  roznice score 0.02 (IEEE) i 0.01/0.03; carve - bbox 37x20 (aspekt == 1.85), 38x20, 40x10, 40x12, 40x13, 25x10, 30x12, 41x20, 10x40 z L in {79, 80, 81};
  kontynenty - NaN, nContinents 1, Math.round na granicy, wpisy ujemne i poza zakresem (clamp), brak wpisu.
- Zaden test nie zostal oslabiony; asercje minimalnej liczby niezerowych przypadkow (erozja >= 50, wyciecie >= 50, zmiany >= 100) pilnuja, by wektory nie byly trywialne.

## Dryf po pinie (zakres 3186-4374)

`git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 40 linii, 4 hunki (pin-linie 5992, 8466, 10352, 10395, 10545, 10698, 10782, 10811).
**Zaden hunk nie lezy w zakresie 3186-4374.** Pelny diff: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A6-LAD-MORZE-PANGEA-Q1/drift-gen-helpers-edb8fb56-origin-main-r1.diff`.
Odswiezenie wektorow (przepiecie na nowszy pin) - osobny temat po raporcie R-RUSTPORT-REPIN-DELTA-Q1.

## Luki i RUNDA-2

- `rebalanceLandFractionPangea` (:3667) wymaga portu `fillPangeaAnnularSeaCorridors` (:4595) i `ensurePangeaSingleContinent` (:4375).
  Oba symbole nie sa w zadnym temacie dispatchu ani w `P6-M06A5`. Potrzebny nowy temat (np. P6-M06A7) lub decyzja, kto je przejmuje.
- Pomiary mutacyjne (mutacje strukturalne galezi sterujacych, dowody rownowaznosci, pomiar trafien na granicach) - Operator-pomiary, runda 2. NIE_ZMIERZONO w rundzie 1.
