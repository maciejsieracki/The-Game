# P6.M06A9 - Lad / morze / Pangea (finał): korytarze, rebalance Pangei, rebalance lad/morze

Temat: R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1. Runda 1 (Operator-impl + Operator-pomiary), runda 2 (Operator-impl r2, odpowiedz na zarzuty Evaluatora).
Baza: `origin/rust-port/parity-v2` = `87fda853` (silnik 1396 testow przed zmianami tematu).
Pin web: `edb8fb56` (eksport `git archive edb8fb56 gra/src gra/data` do katalogu tymczasowego poza repo).
Wzorzec: P6-M06A8 (ensure, hak fill), P6-M05B (wektory brzegowe, generator z pinu).
Run: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1/`.

## Status symboli zakresu (binarne kryterium)

| Symbol web (pin edb8fb56) | Status | Kod Rust | Dowod |
|---|---|---|---|
| `fillPangeaAnnularSeaCorridors` (:4595, export) | PORTOWANY | `landsea.rs::fill_pangea_annular_sea_corridors` (:1708) | `fill-vectors.json` (120 przyp.) + `edge-vectors.json` (prog-eps, 5 przyp.); testy `fill_pangea_annular_sea_corridors_matches_web`, `fill_dist_epsilon_boundary_matches_web`: 0 rozbieznosci |
| `pangeaLandCentroid` (:4473, prywatna) | PORTOWANY | `landsea.rs::pangea_land_centroid` (:1630) | pokryty przez fill i prog-eps (centroid = 1/n dokladnie) |
| `pangeaRadialDryLandSteps` (:4484, prywatna) | PORTOWANY | `landsea.rs::pangea_radial_dry_land_steps` (:1652) | pokryty przez fill i prog-eps (granica `dist < eps`, M17 zabity) |
| `pangeaSeaHexIsAnnularCorridor` (:4512, prywatna) | PORTOWANY | `landsea.rs::pangea_sea_hex_is_annular_corridor` (:1687) | pokryty przez fill; mutant M02 = rownowazny (dowod nizej) |
| `rebalanceLandFractionPangea` (:3667, export) | PORTOWANY | `landsea.rs::rebalance_land_fraction_pangea` (:1793) | `pangea-vectors.json` (60 przyp.), test `rebalance_land_fraction_pangea_matches_web`: 0 rozbieznosci |
| `rebalanceLandSeaRatio` (:3791, export) | PORTOWANY | `landsea.rs::rebalance_land_sea_ratio` (:1879) | `ratio-vectors.json` (101 przyp.) + `edge-vectors.json` (warstwy, 4 przyp.); testy `rebalance_land_sea_ratio_matches_web`, `rebalance_land_sea_ratio_layer_limit_matches_web`: 0 rozbieznosci |
| hak `ensurePangeaSingleContinent` (M06A8) | ZAMKNIETY | `ensure_pangea_single_continent(..., fill_hook)`; w `rebalance_land_fraction_pangea` hak = prawdziwe `fill_pangea_annular_sea_corridors` | wektory M06A8 nadal z hakiem `0` (testy bez zmian) |

## Zalozenia (rozstrzygniete bez pytan)

- Z1. Kolejnosc sekwencji `rebalanceLandFractionPangea` 1:1 z webem (18 krokow: fill, applyLandFractionByScore(mask), enforce,
  erode, carve, x2; fill, ensure, applyLFS, enforce, jagged(5), fill, ensure, enforce).
- Z2. `hex.coords` w `fill` = `TerrainHex.q/r`. Dla kluczy kanonicznych "q,r" identyczne z `parseHexKey`. Klucze niekanoniczne
  NIE sa w wektorach (poza zakresem, jak Z2 w M06A8).
- Z3. Iteracja `Object.entries(hexes)` w fill = iteracja po kluczach w kolejnosci wstawiania, stan terenu czytany na zywo.
- Z4. `pangeaLandCentroid`: suma `parseHexKey` po suchym lądzie w kolejnosci wstawiania (sumy calkowite, dokladne w f64).
- Z5. Literaly danych w `rust-port/engine/data/derived/mapgen-landsea-pangea-fill.json`
  (`fill_centroid_min_land` 40, `fill_dist_epsilon` 0.01, `fill_zapas_szerokosci` 2, `fill_prog_pasma_zapas` 1,
  `rebalance_jagged_passes` 5). Progi `erode`/`carve` - z `mapgen-landsea-pangea.json`. Clamp udzialu 0.15/0.85 - z `mapgen-landsea-fill.json`.
  Stale strukturalne (startowe `sea_band = 1`, `pass` od 0, `step` od 1, `rel. <= 1` erozji, `ceil(sqrt)`) pozostaja w kodzie.
- Z6. `rebalanceLandSeaRatio`: skan wierszami (r, potem q) jak w webie; wybor najnizszego `score` przez ostre `<` (pierwszy wygrywa).
- Z7. Hak `ensurePangeaSingleContinent` w `rebalance_land_fraction_pangea` = `fill_pangea_annular_sea_corridors(h, w, hh, None)`.
  Wywolania `ensure` z innych miejsc (testy M06A8) nadal podaja `|_, _, _| 0`.
- Z8 (runda 2). Dwa literaly `0.01` w webie (`pangeaRadialDryLandSteps` :4496 `distSelf < 0.01`; fill :4602 `Math.max(0.01, distSelf)`)
  sa w Rust zsprzezone w jedno pole `fill_dist_epsilon` (ta sama wartosc 0.01). Zakres wartosci jest identyczny, wiec
  zachowanie jest rownowazne; rozdzielenie na dwa pola nie jest potrzebne dla parytetu.

## Tabela M06A - runda 2 (zamknieta)

Zrodlo wierszy: `P6-M06A-LAD-MORZE-WYBRZEZE-A.md` (25 wierszy RUNDA-2). Runda 1 oznaczala 22 wiersze jako
"dowod do potwierdzenia"; w rundzie 2 dla kazdego wiersza podano: funkcje Rust (plik:linia w `landsea.rs`),
testy, ktore ja wywoluja (wszystkie uruchomione w pelnym `cargo test`, 1403 passed, 0 failed).

| Symbol web | Kod Rust | Testy / wektory (runda 2) | Status |
|---|---|---|---|
| `assignContinentIndices` :3186 | `assign_continent_indices` (:866) | `p6_m06a5_landfrac.rs` (wektory `p6_m06a5_vectors`) | PORTOWANY |
| `sortLandKeysForErosion` :3207 | `sort_land_keys_for_erosion` (:894) | `p6_m06a5_landfrac.rs`, `p6_m06a5_landfrac_edge.rs` | PORTOWANY |
| `enforceLatitudinalOceanBuffer` :3339 | `enforce_latitudinal_ocean_buffer` (:473) | `p6_m06a3_climate.rs::enforce_latitudinal_ocean_buffer_matches_web_with_boundaries` | PORTOWANY |
| `climateBandBaseTerrain` :3360 | `climate_band_base_terrain` (:502) | `p6_m06a3_climate.rs::climate_band_base_terrain_matches_web` | PORTOWANY |
| `applyClimateBandsToHexes` :3380 | `apply_climate_bands_to_hexes` (:541) | `p6_m06a3_climate.rs::apply_climate_bands_to_hexes_matches_web` | PORTOWANY (uwaga: w `map_generator.rs` istnieje osobna kopia - NIE zmieniana, poza allowlista; parytet pilnuje test landsea) |
| `enforceEarthTemplateOnHexes` :3418 | `enforce_earth_template_on_hexes` (:576) | `p6_m06a3_climate.rs::enforce_earth_template_on_hexes_matches_web` | PORTOWANY |
| `LandFractionFillBias` / `PANGEA_LAND_FILL_MIN_SCORE` :3435-3438 | enum `LandFractionFillBias` (:859), dane `mapgen-landsea-fill.json` | `p6_m06a5_landfrac.rs` | PORTOWANY |
| `applyLandFractionByScore` :3444 | `apply_land_fraction_by_score` (:955) | `p6_m06a5_landfrac.rs`, `p6_m06a5_landfrac_edge.rs` | PORTOWANY |
| `rebalanceLandFractionWithMargins` :3532 | `rebalance_land_fraction_with_margins` (:1081) | `p6_m06a5_landfrac.rs`, `p6_m06a5_landfrac_edge.rs` | PORTOWANY |
| `erodePangeaBboxLowScoreRim` :3551 | `erode_pangea_bbox_low_score_rim` (:1122) | `p6_m06a6_pangea.rs` (wektory `p6_m06a6_vectors`) | PORTOWANY |
| `carvePangeaLongSideGulfs` :3606 | `carve_pangea_long_side_gulfs` (:1192) | `p6_m06a6_pangea.rs` | PORTOWANY |
| `rebalanceLandFractionPangea` :3667 | `rebalance_land_fraction_pangea` (:1793) | `p6_m06a9_landsea.rs` (`pangea-vectors.json`, 60) | PORTOWANY |
| `applyLandFractionByContinent` :3701 | `apply_land_fraction_by_continent` (:1290) | `p6_m06a6_pangea.rs` | PORTOWANY |
| `rebalanceLandSeaRatio` :3791 | `rebalance_land_sea_ratio` (:1879) | `p6_m06a9_landsea.rs`, `p6_m06a9_edge.rs` | PORTOWANY |
| `removeInlandWaterPools` :4137 | `remove_inland_water_pools` (:364) | `p6_m06a2_landsea.rs::remove_inland_water_pools_matches_web` | PORTOWANY |
| `purgeDesertEnclaveWater` :4156 | `purge_desert_enclave_water` (:607) | `p6_m06a4_landsea.rs::purge_desert_enclave_water_matches_web` | PORTOWANY |
| `fillEnclosedWaterByLandNeighbors` :4189 | `fill_enclosed_water_by_land_neighbors` (:378) | `p6_m06a2_landsea.rs::fill_enclosed_water_matches_web_with_boundaries` | PORTOWANY |
| `purgeInlandWaterForMultiLandTyp` :4215 | `purge_inland_water_for_multi_land_typ` (:737) | `p6_m06a4_trim.rs::purge_inland_water_for_multi_land_typ_matches_web` | PORTOWANY |
| `applyJaggedCoastNoise` :4232 | `apply_jagged_coast_noise` (:801) | `p6_m06a4_jagged.rs` (`jagged-vectors.json`) | PORTOWANY |
| `removeSmallInlandWaterPools` :4276 | `remove_small_inland_water_pools` (:413) | `p6_m06a2_landsea.rs::remove_small_inland_water_pools_matches_web_with_size_boundaries` | PORTOWANY |
| `removeInlandSeaPools` :4320 | `remove_inland_sea_pools` (:460) | `p6_m06a2_landsea.rs::remove_inland_sea_pools_matches_web` | PORTOWANY |
| `pangeaAnnularMaxCorridorWidth` :4329 | `pangea_annular_max_corridor_width` (:1430) | `p6_m06a7_annular.rs` | PORTOWANY |
| `groupDryLandMassKeys` :4338 | `group_dry_land_mass_keys` (:1457) | `p6_m06a8_landsea.rs`, `p6_m06a8_pomiary.rs` | PORTOWANY |
| `isPangeaBridgeWater` :4371 | `is_pangea_bridge_water` (:1445) = `is_water_terrain_local` (:52) | `p6_m06a7_annular.rs` | DANE-JUZ-W-RUST (predykat = istniejacy `is_water_terrain_local`) |
| `ensurePangeaSingleContinent` :4375 | `ensure_pangea_single_continent` (:1496) | `p6_m06a8_landsea.rs`, `p6_m06a8_pomiary.rs`; hak zamkniety w M06A9 | PORTOWANY |

Wiersze DANE-JUZ-W-RUST z tabeli M06A (bez zmian): `parseHexKey`, `setHexToMorze`, `setHexToLaka`.

**M06A KOMPLET: TAK** (runda 2): wszystkie 25 wierszy RUNDA-2 maja status PORTOWANY lub DANE-JUZ-W-RUST z funkcja Rust,
testem i wektorem z uruchomionego weba. Zadna pozycja nie jest "dowod do potwierdzenia".
Zastrzezenie: wiersze `p6_m06a5_*`..`p6_m06a8_*` sa zamkniete na podstawie testow z tematow wlascicieli, uruchomionych
w pelnym `cargo test` tej rundy (EXIT=0); wektory tych tematow nie zostaly regenerowane w tej rundzie.

## Odpowiedzi na zarzuty Evaluatora (runda 2)

| Zarzut | Odpowiedz | Dowod |
|---|---|---|
| Tabela M06A nie zamknieta (25 wierszy RUNDA-2, 22 "dowod do potwierdzenia") | PRZYJMUJE | tabela zamknieta w sekcji powyzej; w `P6-M06A-...md` dopisane tylko odeslanie (allowlista) |
| Brak zapisu "M06A KOMPLET" | PRZYJMUJE | "M06A KOMPLET: TAK" w sekcji powyzej, po zamknieciu tabeli |
| M07 (limit petli seaBand `maxW+2` -> `maxW`) przezywa i nie jest rownowazny | PRZYJMUJE w czesci: mutant JEST rownowazny - korekta wlasnego wniosku r1 (dowod kodowy nizej, nie wektor) | dowod nizej |
| M17 (`dist < 0.01` -> `<=`) przezywa | PRZYJMUJE: wektor na progu dokladnym dist == 0.01 (n=100) | `edge-vectors.json` przypadek `prog-eps` (solo, maxW 4/2/6), test `fill_dist_epsilon_boundary_matches_web`; mutant KILLED |
| M21 (`max_layers - 1`) przezywa | PRZYJMUJE: wektory granicy warstw (pasek 100x1, cele 0.2/0.3/0.5/0.15) | `edge-vectors.json` rodzina `warstwy`, test `rebalance_land_sea_ratio_layer_limit_matches_web`; mutant KILLED |
| Dowody M02/M09/M19 to jednozdaniowe uzasadnienia | PRZYJMUJE: rozpisane z plikiem i linia ponizej | dowody nizej |

### Dowody rownowaznosci z kodu (plik `landsea.rs`, linie wg stanu f9d855ed + r2)

**M02** (`&&` -> `||` w `pangea_sea_hex_is_annular_corridor`, :1698). Przy `Some(i), Some(o)`:
`pangea_radial_dry_land_steps` (:1670) zwraca `Some(step)` tylko w ciele petli `while step <= max_steps` (:1670),
a `max_steps` to ten sam `max_w` co w :1698. Zatem `i <= max_w` i `o <= max_w` sa prawdziwe zawsze w tej galezi,
koniunkcja jest tautologia i `||` daje identyczny wynik. Galezie `_ => false` nie zmieniaja sie. **RÓWNOWAŻNY.**

**M07** (`let limit = max_w + zapas;` -> `let limit = max_w;`, :1750). Dowod: `sea_band` jest liczony tylko dla hexa,
ktory przeszedl `pangea_sea_hex_is_annular_corridor` (:1738-1740). Wtedy `i` i `o` (kroki do suchego lądu wzdluz promienia)
spelniaja `i <= max_w`, `o <= max_w` (:1698), a promien seaBand jest identyczny z promieniem radialnym:
- `uq`/`ur` (:1745-1747 seaBand; `dist_self` radialu :1663): `denom = max(eps, dist)`; `dist >= eps` wynika z tego, ze radial zwrocil `Some`
  (:1663 `if dist_self < eps { return None }`), wiec `denom = dist`, tak jak w radialu;
- kroki: seaBand outward (:1753) `q + uq*step`, inward (:1763) `q - uq*step`; radial inward `q + (-1.0*uq)*step`; mnozenie przez `-1.0` jest dokladne,
  wiec zaokraglone wspolrzedne sa bitowo te same; analogicznie outward;
- kazdy krok `< i` (resp. `< o`) trafia na wode bridge (warunek radialu, :1670-1681), a krok `i` trafia na suchy lad
  (`is_dry_land_terrain`), ktory przerywa petle seaBand (`_ => break`, :1757 / :1767) zanim limit zostanie osiagniety, bo `i <= max_w`.

Zatem seaBand liczy dokladnie `1 + (i-1) + (o-1)` niezaleznie od tego, czy limit to `max_w` czy `max_w + 2`. **RÓWNOWAŻNY**.
(Korekta: runda 1 uznawala M07 za nieekwiwalentny - bledna ocena, poniewaz nie uwzgledniono, ze radial ogranicza `i,o`.)

**M09** (`if land < target_land` -> `<=`, :1903). Linia :1899 `if land == target_land { break; }` konczy przebieg,
gdy `land == target_land`. Linia :1903 jest osiagana tylko, gdy `land != target_land`, wiec `<` i `<=` sa rownowazne. **RÓWNOWAŻNY.**

**M19** (`if land >= target_land` -> `>`, :1922). Przypadek `land == target_land` po dolaniu `to_fill` (`land` = dokladna liczba lądu,
bo kazdy `to_fill` (:1904-1921) to Morze->Laka, `land += to_fill.len()` :1921):
- oryginal: wchodzi w blok (:1922), petla `while land > target_land` (:1924) nie wykonuje sie, `break`;
- mutant: pomija blok, `continue`; nowa iteracja liczy `land` ponownie (= target, nic nie zmieniono), `if land == target_land { break; }` (:1899).
Zadna zmiana stanu ani `adjusted`. Koniec petli takze przy `layer == max_layers`, bez efektu. **RÓWNOWAŻNY.**

**M17 - nie jest rownowazny (zabity)**, patrz wektory `prog-eps`. Wektor: centroid = (fl(1/100), 0), hex (0,0) Morze,
`dist = js_hypot(-0.01, 0) = 0.01 = fill_dist_epsilon`. Web: `dist < 0.01` falsz -> konwersja (0,0). Mutant: `dist <= eps` -> brak konwersji.

**M21 - nie jest rownowazny (zabity)**, patrz wektory `warstwy`: pasek 100x1, `max_layers = 10`; cel 20/30/50 wymaga 10 warstw
(fill +2 na warstwe). Oryginal konczy 10 warstw (21 lądu lub trim do celu), mutant 9 (19 lądu).

## Wektory i testy

- Generator r1: `gen-m06a9-vectors.mjs` (fill/ratio/pangea). Generator r2: `gen-m06a9-edge-vectors.mjs` (wektory brzegowe).
  Oba uruchamiane z ORYGINALNEGO pinu `edb8fb56` (`git archive`), loadery `m06a-loader-*.mjs`.
- `tests/p6_m06a9_vectors/fill-vectors.json` (1.6 MB, 120 przyp.): `losowe` 90, `granica-pas` 24, `prog-ladu` 3, `brzeg` 3.
- `tests/p6_m06a9_vectors/ratio-vectors.json` (0.6 MB, 101 przyp.): `losowe` 90, `prog-udzialu` 9, `brzeg` 2.
- `tests/p6_m06a9_vectors/pangea-vectors.json` (1.6 MB, 60 przyp.).
- `tests/p6_m06a9_vectors/edge-vectors.json` (72 KB, 9 przyp., NOWY r2): `prog-eps` 5 (n=99 / n=100 solo maxW 4,2,6 / n=101),
  `warstwy` 4 (pasek 100x1, cel 0.15/0.2/0.3/0.5). Wyniki weba: prog-eps n=100 -> converted 1 (tylko (0,0));
  n=99/101 -> 0 zmian; warstwy 0.2 -> 21 lądu po 10 warstwach z trimem do celu 20 (19 zmian).
- Testy: `tests/p6_m06a9_landsea.rs` (4, bez zmian), `tests/p6_m06a9_edge.rs` (3, NOWY r2: liczba rodzin, prog-eps, warstwy).
- Trafienia graniczne: fill `losowe-00022` ma dokladnie 40 suchych heksow (N) i `converted=12`; prog 39/41 (`prog-ladu`) -> 0 zmian;
  prog-eps: 99/100/101 (N-1/N/N+1 dla `dist` vs 0.01) - trafione; warstwy: 0.2 trafia granice 10 warstw (N=max_layers).

## Math.* - wykaz miejsc

| Miejsce web | Rust | Uwagi |
|---|---|---|
| `Math.hypot` (fill :4602/4611 i `pangeaRadialDryLandSteps` :4496) | `masks::v8math::js_hypot` (masks.rs:91) | zgodnie z dispatchem |
| `Math.max(0.01, distSelf)` (fill, dzielnik) | `js_max` | eps z JSON |
| `Math.round(q + uq*step)` (fill, radial) | `improvements::js_round` | JS half-up; na calkowitych kluczach zgodne |
| `Math.sqrt((w*h)/20160)` (`pangeaAnnularMaxCorridorWidth`) | `pangea_annular_max_corridor_width` (M06A7) | bez zmian |
| `Math.sqrt(w*h)` + `Math.ceil` (`rebalanceLandSeaRatio` maxLayers) | `f64::sqrt`, `f64::ceil` (:1893) | IEEE, identyczne |
| `Math.round(total*clamped)` (ratio) | `js_round` | |
| `Math.max/min` clamp (ratio) | `js_max`/`js_min` | |
| `Math.floor` (`applyJaggedCoastNoise` przez landsea) | wewnatrz istniejacego kodu (M06A4) | |
| `Math.sin/cos/pow/atan2` | NIE DOTYCZY w tym temacie | jadra `k_sin/k_cos/rem_pio2` nie zmieniano |

## Gate (runda 2)

- `cargo fmt -- --check`: EXIT=0 (`gate-fmt-r2.log`; nowy plik sformatowany `rustfmt --edition 2021`).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`gate-clippy-r2.log`).
- `cargo test` (pelny silnik): 1403 passed, 0 failed, EXIT=0 (`gate-test-r2.log`); baza 1400 (r1) + 3 nowe.
- Build w `CARGO_TARGET_DIR=/dev/shm/cargo-target-m06a9-r2` (dysk `/` byl zapelniony w czasie rundy; cargo nie zapisuje w `/`).

## Mutacje - runda 2 (`mut-runner-r2.py`, `mut-results-r2.log`)

Runner: `cargo test --test p6_m06a9_landsea --test p6_m06a9_edge`, plik przywracany po kazdym mutancie (RESTORED True x3).

| Mutant | Wynik r2 | Uzasadnienie |
|---|---|---|
| M01 inward `<=` -> `<` | KILLED | granica pasma |
| M02 `&&` -> `||` | SURVIVED = RÓWNOWAŻNY | dowod wyzej |
| M03 seaband `>` -> `>=` | KILLED | |
| M04 seaband prog `-1` | KILLED | |
| M05 centroid `< 40` -> `<= 40` | KILLED | trafia N=40 |
| M06 galaz border inwersja | KILLED | |
| M07 limit seaBand `maxW+2` -> `maxW` | SURVIVED = RÓWNOWAŻNY | dowod wyzej (korekta r1) |
| M08 `step <= max_steps` -> `<` | KILLED | |
| M09 ratio `land < target` -> `<=` | SURVIVED = RÓWNOWAŻNY | dowod wyzej |
| M10 rank `<= 1` -> `<= 0` | KILLED | |
| M11 wybor `score < b` -> `<=` | KILLED | |
| M12 clamp max `0.85 - 0.01` | KILLED | |
| M13 hak koncowy `ensure` -> `0` | KILLED | |
| M14 hak posredni `ensure` -> `0` | KILLED | |
| M15 usuniety drugi fill po jagged | KILLED | |
| M16 zamiana erode/carve | KILLED | |
| M17 radial `dist < eps` -> `<=` | KILLED | edge prog-eps solo (dist == 0.01) |
| M18 jagged passes `-1` | KILLED | |
| M19 ratio trim `>=` -> `>` | SURVIVED = RÓWNOWAŻNY | dowod wyzej |
| M20 total `+1` | KILLED | |
| M21 `max_layers` `-1` | KILLED | edge warstwy 0.2/0.3/0.5 |

Podsumowanie r2: 21 mutantow = KILLED 17 + RÓWNOWAŻNE 4 (M02, M07, M09, M19) + NIE-ZABITE nieekwiwalentne 0.
Testy nie oslabione; zaden istniejacy test nie zmieniony (dopisane wylacznie nowe pliki).

## Dryf po pinie

`git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 8 hunkow, pierwszy `@@ -5992`, ostatni `@@ -10804`
(lacznie 40 zmienionych linii). Zadne hunki nie wpadaja w zakres 3186-4374 ani w linie symboli tej rundy
(4473-4612, 3667-3700, 3791-3880). Pin NIE przepinany (zgodnie z dispatchem); odswiezenie = osobny temat po
R-RUSTPORT-REPIN-DELTA-Q1.

## Historia rundy 1 (zachowana)

- Mutacje r1 (`mut-results-pomiary.log`, commit pomiarowy `f9d855ed`): KILLED 15, RÓWNOWAŻNE 3 (M02, M09, M19), NIE-ZABITE 3 (M07, M17, M21).
  Bledy r1: M07 oznaczony jako nieekwiwalentny (poprawnie: rownowazny, runda 2); M17/M21 bez wektorow (zamkniete w rundzie 2).
- Runda 1 zapisala "M06A KOMPLET: NIE" - nieaktualne od rundy 2.

## Nastepne kroki

- Weryfikacja regeneracji wektorow `gen-m06a9-edge-vectors.mjs` przez Evaluatora (node 22, pin `edb8fb56`, `git archive`).
- Osobny temat: odswiezenie wektorow po R-RUSTPORT-REPIN-DELTA-Q1 (dryf po pinie, sekcja wyzej).
- Wykonanie integracji/deploy - poza tym tematem (Operator nie integruje i nie pushuje).
