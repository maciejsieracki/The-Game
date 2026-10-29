# P6.M06A3 - lad / morze / wybrzeze A, reszta RUNDA-2 (partia 1 z kilku)

Temat: R-RUSTPORT-P6-M06A3-LAD-MORZE-RESZTA2-Q1. Odsylacz z M06A: `dyspozycje/rust-port/p6/P6-M06A-LAD-MORZE-WYBRZEZE-A.md`; poprzednia partia: `P6-M06A2-LAD-MORZE-RESZTA.md`.
Pin webu: `edb8fb56` (`gra/src/map/gen-helpers.ts`). Zakres: wiersze RUNDA-2 z tabeli M06A (linie 3186-4374).
Baza kodu: `origin/rust-port/parity-v2` @ `364a5356`.

## Stan symboli (binarne kryterium)

| Symbol (web, pin edb8fb56) | Status | Dowod |
|---|---|---|
| `enforceLatitudinalOceanBuffer` :3339 | PORTOWANY (partia 1) | `landsea.rs::enforce_latitudinal_ocean_buffer`; test `enforce_latitudinal_ocean_buffer_matches_web_with_boundaries`; 158 wektorow |
| `climateBandBaseTerrain` :3360 (prywatna) | PORTOWANY (partia 1) | `landsea.rs::climate_band_base_terrain` + `climate_base_from_hash` (galaz progow); testy `climate_band_base_terrain_matches_web` (846 punktow, hash po u/2^32) i `climate_base_from_hash_threshold_boundaries` |
| `applyClimateBandsToHexes` :3380 | PORTOWANY (partia 1) | `landsea.rs::apply_climate_bands_to_hexes`; test `apply_climate_bands_to_hexes_matches_web`; 100 map wektorow |
| `enforceEarthTemplateOnHexes` :3418 | PORTOWANY (partia 1) | `landsea.rs::enforce_earth_template_on_hexes`; test `enforce_earth_template_on_hexes_matches_web`; 11 map wektorow |
| `findInlandWaterHexes` / `findInlandSeaHexes` :4109/:4123 | PORTOWANY (M06A r1) | bez zmian |
| `removeInlandWaterPools`, `fillEnclosedWaterByLandNeighbors`, `removeSmallInlandWaterPools`, `removeInlandSeaPools` | PORTOWANY (M06A2) | bez zmian |
| `purgeDesertEnclaveWater` :4156 | RUNDA-2 (partia 2) | wymaga `climateBandAt` (`prims.rs:361`, juz jest) |
| `purgeInlandWaterForMultiLandTyp` :4215 | RUNDA-2 (partia 2) | wywoluje `trimEnclosedOceanOnly` (web :4701, POZA zakresem) - zaleznosc do rozstrzygniecia |
| `applyJaggedCoastNoise` :4232 | RUNDA-2 (partia 3) | szum (`mulberry32`/`fbm`/perm) |
| `LandFractionFillBias` / `PANGEA_LAND_FILL_MIN_SCORE` :3435-3438 | RUNDA-2 (dane) | do `data/derived/*.json` |
| `applyLandFractionByScore` :3444 | RUNDA-2 | - |
| `rebalanceLandFractionWithMargins` :3532 | RUNDA-2 | - |
| `erodePangeaBboxLowScoreRim` :3551, `carvePangeaLongSideGulfs` :3606 | RUNDA-2 | - |
| `rebalanceLandFractionPangea` :3667 | RUNDA-2 | - |
| `applyLandFractionByContinent` :3701 | RUNDA-2 | - |
| `rebalanceLandSeaRatio` :3791 | RUNDA-2 | - |
| `assignContinentIndices` :3186, `sortLandKeysForErosion` :3207 | RUNDA-2 | - |
| `pangeaAnnularMaxCorridorWidth` :4329 | RUNDA-2 | `Math.sqrt`, `Math.round` (`masks::v8math`) |
| `groupDryLandMassKeys` :4338, `isPangeaBridgeWater` :4371 | RUNDA-2 | - |
| `ensurePangeaSingleContinent` :4375 | POZA ZAKRESEM | linia 4375 > 4374, lista P6-25 |

Po partii 1 tej rundy: 4 symbole PORTOWANE (+ 4 z M06A2/M06A). Pozostale wiersze RUNDA-2 sa otwarte (kolejne partie po 6-8 symboli).

## Dryf po pinie (zakres 3186-4374)

`git diff --stat edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 24 dodane / 16 usuniete linie, 8 hunkow na liniach 5992, 8466, 10352, 10392, 10541, 10693, 10776, 10804 pliku. **Zadne z nich nie wpada w zakres 3186-4374.** Pin pozostaje `edb8fb56`; odswiezenie wektorow robi osobny temat po R-RUSTPORT-REPIN-DELTA-Q1.

## Zalozenia (rozstrzygniete bez pytan)

- Z-1: Klucze "q,r" niekanoniczne sa pomijane przy iteracji (jak w M06A/M06A2). Wektory ich nie zawieraja.
- Z-2: Wartosci `width`/`height` sa typu `u32` (jak w `prims.rs`). `height - buf` liczone w `i64`, bo web dopuszcza wynik ujemny (np. H=1, buf=2): wtedy zaden wiersz nie jest pomijany.
- Z-3: `setHexToMorze` = `terrain_class::set_hex_to_morze` (DANE-JUZ-W-RUST, M04). Czysci rzeke i zloze, jak web :3325.
- Z-4: Progi galezi `climateBandBaseTerrain` (0.5 / 0.7 / 0.85) i `Math.round` w buforze sa w kodzie webu jako literaly galezi, nie jako dane. Port trzyma je w kodzie 1:1; nie sa to mnozniki danych. Dane progow pasm (`CLIMATE_POLAR_FRAC` itd.) sa juz w `derived` (`prims.rs`, `mapgen_core_params().klimat`).
- Z-5: `climateBandBaseTerrain` jest prywatna w pinie. Generator tworzy kopie `gen-helpers-m06a3-instr.ts` (w drzewie `git archive` POZA repo) z jedna linia `export { climateBandBaseTerrain, setHexToMorze, hashInt3 }` na koncu. Logika jest identyczna; sha oryginalu `ab934703...` (= M06A/M06A2), sha kopii zapisane w meta wektorow.
- Z-6: Progi N-1 / N / N+1 dla `h < prog` nie maja wartosci hasza w wektorach: `hashInt3` daje u/2^32, a zaden punkt nie trafia dokladnie w 0.5/0.7/0.85 (pomiar: `hash_near_threshold` w `boundary_hits`, |hash-prog| < 0.01: 0.5 -> 24, 0.7 -> 20, 0.85 -> 25 punktow). Granice N-1/N/N+1 sprawdza wiec `climate_base_from_hash` z floatami prog - eps*prog, prog, prog + eps*prog; oracle to galaz kodu webu :3368-3378 (zrodlo, nie uruchomienie). Calosc pilnuja wektory punktowe uruchomionego weba (blad progu o 1% zmienia kilkanascie przypadkow).
- Z-7: Wartosci hasza w JSON (serde): JSON z weba jest parsowany przez `serde_json` bez `float_roundtrip`, wiec wartosc hasza mogla byc oddana z bledem 1 ULP (zaobserwowane dla (6,10,0)). Test porownuje wiec calkowite `u = hash * 2^32` (blad << 0.5). Port hasza jest zgodny bit w bit (`node` lokalnie: 4205694887/2^32).
- Z-8: Zakres wektorow `enforceLatitudinalOceanBuffer`: wiersze `buf-1, buf, buf+1` oraz `H-buf-1, H-buf, H-buf+1` sa obecne w wektorach dla kazdego z 6 wariantow gorna/dolna granica (test asertuje >0 trafien kazdego z 3 wierszy na obu granicach).
- Z-9: `enforceLatitudinalOceanBuffer` i `enforceEarthTemplateOnHexes` iteruja po prostokacie wspolrzednych (jak web); wynik nie zalezy od kolejnosci. `applyClimateBandsToHexes` i `enforceEarthTemplateOnHexes` iteruja po `HexRecord` w kolejnosci wstawiania (jak `Object.entries`).

## Wektory i testy

- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A3-LAD-MORZE-RESZTA2-Q1/gen-m06a3-vectors.mjs` (loader: `m06a-loader-register.mjs` + `m06a-loader-hooks.mjs`, skopiowane z runu M06A2 - Z-7 z P6-M06A2).
- Wektory: `rust-port/engine/tests/p6_m06a3_vectors/web-vectors.json` (liczby: buffer 158, climate point 846, climate map 100, earth 11).
- Testy: `rust-port/engine/tests/p6_m06a3_climate.rs` (6 testow, zielone).
- Zadnych zmian w istniejacych testach, `relief.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `domain/mod.rs`, `map_generator.rs`.

## Math.*

- `Math.round` (bufor: `latitudinalOceanBufferRows`) - implementacja: `prims::latitudinal_ocean_buffer_rows` (`f64::round`, dla dodatnich zgodne z JS).
- `hashInt3` - `Math.imul` = `wrapping_mul` na `i32`, `ToInt32` przez `terrain_class::js_to_int32`.
- Brak `Math.sin/cos/pow/atan2/hypot` w tej partii.
- Jadra `k_sin/k_cos/rem_pio2` nie zmienione.

## Pomiary (Operator-pomiary, runda 1, commit 56005127)

### Weryfikacja niezalezna

- Kod vs web (pin `edb8fb56`, `gra/src/map/gen-helpers.ts:3339-3427`): cztery funkcje zgodne co do galezi, warunkow (`r >= buf && r < h-buf`, pominiecie Morze, `earthTemplateLandAt > 0`, pominiecie wody/Gor/Wzgorz), progow (`h < 0.5 / 0.7 / 0.85`) i czyszczenia nakladki/zloza. Rozbieznosci: brak.
- Wektory (`tests/p6_m06a3_vectors/web-vectors.json`): `counts` buffer 158, climate point 846, map 100, earth 11 - zgodne z raportem. `boundary_hits.hash_near_threshold` = 24/20/25 zgodne z Z-6; `buffer_rel` zawiera offsety -1/0/+1 wzgledem `buf` i `H-buf`.
- NOTA: `stats.climate_point_cases` = 840, a `counts.climate_band_base_terrain` = 846 (roznica 6). Meta jej nie wyjasnia. Nie blokuje (testy uzywaja `cases`), do wyjasnienia w generatorze przy odswiezeniu wektorow.

### Gate'y (surowe logi: `R-RUSTPORT-P6-M06A3-LAD-MORZE-RESZTA2-Q1/*-pomiary-r1.log`)

- `cargo fmt --check` EXIT=0.
- `cargo clippy --all-targets -- -D warnings` EXIT=0.
- `cargo test --test p6_m06a3_climate`: 6 passed, EXIT=0.
- `cargo test` (pelny): 1249 passed, 0 failed, EXIT=0 (baseline 1243 -> +6).

### Mutacje (kazda: jedna zmiana w `landsea.rs`, `cargo test --test p6_m06a3_climate`, przywrocenie pliku)

| ID | Mutacja | Wynik |
|---|---|---|
| A | buf: `r >= buf` -> `r > buf` | ZABITA (enforce_latitudinal_ocean_buffer_matches_web_with_boundaries) |
| B | dolna granica: `r < h - buf` -> `r <= h - buf` | ZABITA (j.w.) |
| C | prog pustyni `h < 0.5` -> `h <= 0.5` | ZABITA (climate_base_from_hash_threshold_boundaries) |
| D | prog plaskich `h < 0.7` -> `h <= 0.7` | ZABITA (j.w.) |
| E | prog umiarkowanych `h < 0.85` -> `h <= 0.85` | ZABITA (j.w.) |
| F | pominiecie Morze w buforze (`if hex.terrain == Sea`) | ZABITA (enforce_latitudinal_ocean_buffer_matches_web_with_boundaries) |
| G | usuniecie `tb == Hills` z filtra pominiec | ZABITA (apply_climate_bands_to_hexes_matches_web) |
| H | earth: `> 0.0` -> `>= 0.0` | ZABITA (enforce_earth_template_on_hexes_matches_web) |
| I | usuniecie czyszczenia nakladki w galezi `else if want == Polarny` (linia 555) | ZABITA (apply_climate_bands_to_hexes_matches_web) |
| J | usuniecie `overlay = Brak` przy zmianie na Polarny/Pustynie | ZABITA (apply_climate_bands_to_hexes_matches_web) |
| K | usuniecie `has_deposit = false` przy zmianie na Polarny/Pustynie | ZABITA (apply_climate_bands_to_hexes_matches_web) |
| L | earth: pominiecie Morze (`if hex.terrain == Sea`) | ZABITA (enforce_earth_template_on_hexes_matches_web) |
| M | pustynia -> rownina w galezi `h < 0.5` (zamiana wyniku) | ZABITA (3 testy) |
| O | usuniecie `has_deposit = false` w galezi `else if want == Polarny` (linia 556) | ZABITA (apply_climate_bands_to_hexes_matches_web) |
| P | filtr wody: `if false && tb.is_water()` | ZABITA (apply_climate_bands_to_hexes_matches_web) |
| Q1 | prog pustyni 0.5 -> 0.505 (+1%) | ZABITA (3 testy) |
| Q2 | prog umiarkowanych 0.85 -> 0.8585 (+1%) | ZABITA (3 testy) |
| Q3 | prog plaskich 0.7 -> 0.693 (-1%) | ZABITA (3 testy) |

Wynik: 18/18 mutantow zabitych, 0 przezytych. Dowody rownowaznosci dla przezytych mutacji: nie dotyczy. Plik `landsea.rs` po kazdej mutacji przywrocony bajt-w-bajt (`cmp` OK).

### Status

- Temat NIE zamkniety: dokument obejmuje cztery symbole partii 1. Symbole RUNDA-2 (partie 2+, 16 wierszy) sa otwarte.
