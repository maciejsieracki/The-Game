# P6.M06A - lad / morze / wybrzeze A

Temat: `R-RUSTPORT-P6-M06A-LAD-MORZE-WYBRZEZE-A-Q1`
Zakres web (pin `edb8fb56`): `gra/src/map/gen-helpers.ts:3186-4374` (29 symboli).
Cel Rust: `rust-port/engine/src/domain/mapgen/landsea.rs`.
Baza: `origin/rust-port/parity-v2` @ `ec1a8552` (M05A/M05B obecne, 1214 testow przed zmianami).

## Status rundy 1 (Operator-impl)

Runda 1 portuje podzbior symboli, ktore nie wymagaja generatora losowego ani tabel poza zakresem M06A.
Pozostale symbole: RUNDA-2 (lista nizej). Pomiary niezalezne (weryfikator, mutacje, pomiar trafien
na granicach) - osobne wywolanie Operatora-pomiarow.

## Binarne kryterium per symbol (zakres 3186-4374)

| Symbol (linia pin) | Status | Gdzie w Rust / dowod |
|---|---|---|
| `assignContinentIndices` :3186 | RUNDA-2 | - |
| `parseHexKey` :3202 | DANE-JUZ-W-RUST | `terrain_class::parse_hex_key` (M04) |
| `sortLandKeysForErosion` :3207 | RUNDA-2 | - |
| `isLandTerrain` :3234 | PORTOWANY | `landsea::is_land_terrain`; `tests/p6_m06a_landsea.rs::terrain_predicates_match_web` |
| `isLandOrCoast` :3249 | PORTOWANY | `landsea::is_land_or_coast`; ten sam test |
| `defaultLandFractionForTyp` :3254 | PORTOWANY | `landsea::default_land_fraction_for_typ`; dane `data/derived/mapgen-landsea.json`; `default_land_fraction_matches_web` |
| `countLandSeaHexes` :3268 | PORTOWANY | `landsea::count_land_sea_hexes`; `count_land_sea_matches_web` |
| `ERODE_TERRAIN_ORDER` :3279 | PORTOWANY (dane) | `mapgen-landsea.json:kolejnosc_erozji`, `derived::mapgen_landsea()` |
| `erodeTerrainRank` :3288 | PORTOWANY | `landsea::erode_terrain_rank`; `terrain_predicates_match_web` |
| `countMorseNeighbors` :3294 | PORTOWANY | `landsea::count_morse_neighbors`; `neighbor_counts_and_coast_predicates_match_web` |
| `countLandNeighbors` :3304 | PORTOWANY | `landsea::count_land_neighbors`; ten sam test |
| `isCoastalLandHex` :3313 | PORTOWANY | `landsea::is_coastal_land_hex`; ten sam test |
| `isCoastalMorseHex` :3319 | PORTOWANY | `landsea::is_coastal_morse_hex`; ten sam test |
| `setHexToMorze` :3325 | DANE-JUZ-W-RUST | `terrain_class::set_hex_to_morze` (M04); uzyte w `sanitize_coast_hexes` |
| `setHexToLaka` :3332 | DANE-JUZ-W-RUST | `terrain_class::set_hex_to_laka` (M04) |
| `enforceLatitudinalOceanBuffer` :3339 | RUNDA-2 | - |
| `climateBandBaseTerrain` :3360 | RUNDA-2 | - |
| `applyClimateBandsToHexes` :3380 | RUNDA-2 | (istnieje `map_generator.rs` - do weryfikacji w rundzie 2) |
| `enforceEarthTemplateOnHexes` :3418 | RUNDA-2 | - |
| `LandFractionFillBias` / `PANGEA_LAND_FILL_MIN_SCORE` :3435-3438 | RUNDA-2 | - |
| `applyLandFractionByScore` :3444 | RUNDA-2 | - |
| `rebalanceLandFractionWithMargins` :3532 | RUNDA-2 | - |
| `erodePangeaBboxLowScoreRim` :3551 | RUNDA-2 | - |
| `carvePangeaLongSideGulfs` :3606 | RUNDA-2 | - |
| `rebalanceLandFractionPangea` :3667 | RUNDA-2 | - |
| `applyLandFractionByContinent` :3701 | RUNDA-2 | - |
| `rebalanceLandSeaRatio` :3791 | RUNDA-2 | - |
| `isDryLandTerrain` :3882 | PORTOWANY | `landsea::is_dry_land_terrain`; `terrain_predicates_match_web` |
| `applyCoastRing` :3894 | PORTOWANY | `landsea::apply_coast_ring`; `apply_coast_ring_matches_web` (stan + wartosc zwrotu, >=20 mutacji) |
| `applyDoubleCoastRing` :3923 | PORTOWANY | `landsea::apply_double_coast_ring`; `apply_double_coast_ring_matches_web` |
| `findDryLandTouchingSea` :3949 | PORTOWANY | `landsea::find_dry_land_touching_sea`; `find_dry_land_touching_sea_matches_web` |
| `sanitizeCoastHexes` :3975 | PORTOWANY | `landsea::sanitize_coast_hexes`; `sanitize_coast_hexes_matches_web` (>=5 napraw) |
| `oceanConnectedWaterKeys` :4026 | PORTOWANY | `landsea::ocean_connected_water_keys`; `ocean_connected_water_matches_web` |
| `oceanConnectedMorseKeys` :4063 | PORTOWANY | `landsea::ocean_connected_morse_keys` (uzyte w `find_inland_sea_hexes`) |
| `findInlandWaterHexes` :4109 | PORTOWANY | `landsea::find_inland_water_hexes`; `find_inland_water_and_sea_match_web` |
| `findInlandSeaHexes` :4123 | PORTOWANY | `landsea::find_inland_sea_hexes`; ten sam test |
| `removeInlandWaterPools` :4137 | RUNDA-2 | - |
| `purgeDesertEnclaveWater` :4156 | RUNDA-2 | - |
| `fillEnclosedWaterByLandNeighbors` :4189 | RUNDA-2 | - |
| `purgeInlandWaterForMultiLandTyp` :4215 | RUNDA-2 | - |
| `applyJaggedCoastNoise` :4232 | RUNDA-2 | (wymaga mulberry/szumu - runda 2) |
| `removeSmallInlandWaterPools` :4276 | RUNDA-2 | - |
| `removeInlandSeaPools` :4320 | RUNDA-2 | - |
| `pangeaAnnularMaxCorridorWidth` :4329 | RUNDA-2 | (`Math.sqrt`/`Math.round` - runda 2) |
| `groupDryLandMassKeys` :4338 | RUNDA-2 | - |
| `isPangeaBridgeWater` :4371 | RUNDA-2 | - |
| `ensurePangeaSingleContinent` :4375 | RUNDA-2 | (poza zakresem linii 4374; patrz lista P6-25) |

Podsumowanie wierszy tabeli (wiersze, nie symbole 1:1): PORTOWANY 19 wierszy (w tym ERODE_TERRAIN_ORDER jako dane JSON); DANE-JUZ-W-RUST 3 (`parseHexKey`, `setHexToMorze`, `setHexToLaka`); RUNDA-2 25 wierszy (24 w zakresie + `ensurePangeaSingleContinent` :4375 poza zakresem). Razem 47 wierszy.

Rozstrzygniecie liczby symboli (runda 2, zmierzone grep-em w `gen-helpers.ts` @ edb8fb56): w zakresie 3186-4374 sa **47 deklaracji** top-level: 44 funkcje + `ERODE_TERRAIN_ORDER` + `PANGEA_LAND_FILL_MIN_SCORE` + typ `LandFractionFillBias`. Liczba **29** = dokladnie liczba deklaracji z `export` w tym zakresie (28 `export function` + 1 `export type`). Tabela ma 46 wierszy w zakresie, bo wiersz `LandFractionFillBias / PANGEA_LAND_FILL_MIN_SCORE` laczy dwie deklaracje. ZALOZENIE: "29 symboli" z dispatchu = eksporty; kanoniczny zbior do domkniecia to 47 deklaracji (tabela).

## Runda 2 (obrona po FAIL r1, Operator-impl)

Pelna odpowiedz na zarzuty: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A-LAD-MORZE-WYBRZEZE-A-Q1/03-operator-obrona-r2.md`.

- Luka pierscienia (nakladka/zloze na Morzu): **domknieta**. Nowe mapy specjalne `coast_overlay_deposit`, `coast_overlay_orphan`, `edge_top_sea`, `edge_left_sea` (gen-m06a-vectors.mjs); wektory z weba @ edb8fb56 (176 map); asercje `coast_ring_clears_overlay_and_deposit_only_on_converted_sea`, `sanitize_clears_overlay_and_deposit_on_orphan_coast`, `ocean_edge_seeds_cover_top_and_left_rows`.
- Mutanty: `ring-no-overlay-clear` i `ring-no-deposit-clear` teraz KILLED (3 testy). Dodane i KILLED: `double-no-overlay-clear`, `double-no-deposit-clear`, `double-src-shallow`, `sanitize-orphan-no-overlay-clear`, `sanitize-orphan-no-deposit-clear`, `ocean-edge-no-top`, `ocean-edge-no-left`, `json-wyspy-0.51`, `json-ziemia-0.22`, `json-erode-gory-wzgorza`.
- Stare kategorie wektorow: prefiks zachowany (porownanie po nazwie i po `map`: identyczne); regeneracja bajtowo zgodna (sha256 `2c64719d...`).
- Zakres 25 wierszy RUNDA-2: **nadal niezamkniety** (przyjety zarzut). Wykaz Math.* i zaleznosci: ponizej.

### Wykaz Math.* w zakresie 3186-4374 (zmierzone, `awk` na pinie edb8fb56)

- 43 wystapienia: `Math.max` 16, `Math.min` 11, `Math.abs` 5, `Math.round` 5, `Math.sqrt` 2, `Math.hypot` 2, `Math.floor` 1, `Math.ceil` 1.
- Linie: 3194-3195 (assignContinentIndices, RUNDA-2), 3222 (sortLandKeysForErosion, RUNDA-2), 3453-3456 (applyLandFractionByScore), 3484, 3563-3568, 3583-3587, 3619-3653 (erodePangeaBboxLowScoreRim / carvePangeaLongSideGulfs), 3710-3748 (applyLandFractionByContinent), 3797-3801 (rebalanceLandSeaRatio), 4330-4332 (pangeaAnnularMaxCorridorWidth) - wszystkie w symbolach RUNDA-2.
- **Zero wystapien Math.* w cialach symboli PORTOWANYCH** (potwierdza zalozenie "brak Math.* w podzbiorze rundy 1").
- Uwaga semantyczna dla rundy 2: JS `Math.round` zaokragla .5 w strone +inf, Rust `f64::round` - od zera. Argumenty `Math.round` w zakresie (3456, 3712, 3736, 3799, 4332) sa nieujemne, wiec rozbieznosc nie wystapi, ale port ma to zachowac swiadomie (przy nieujemnych argumentach `round` Rust i JS daja to samo).

### Zaleznosci RUNDA-2 (sprawdzone, plik:linia)

- Szum/RNG: `mulberry32` - web :57, Rust `prims.rs:40`; `buildPermTable` - web :72 (brak portu, do zrobienia); `fbm` - web :109, Rust `prims.rs:300`; `hashInt3` - web :899 (uzywane przez `climateBandBaseTerrain` :3360), Rust `terrain_class.rs:529` (`hash_int3`, do porownania z weba w rundzie 2).
- Bloki uzywajace szumu w zakresie: `climateBandBaseTerrain` :3362, `carvePangeaLongSideGulfs` :3643, `applyJaggedCoastNoise` :4250-4251.
- Zaleznosci miedzy symbolami: `applyLandFractionByScore`/`rebalance*` wolaja `applyJaggedCoastNoise` (:3690) i `pangeaAnnularMaxCorridorWidth` - kolejnosc portu: najpierw szum i predykaty, potem wysoki poziom.

### Mutanty po rundzie 2 (`mut-runner-m06a.py`, log `mutations-r2.log`)

- Pelny zbior 58 mutantow: KILLED 55 (45 z r1 + 10 nowych), TIMEOUT 1 (`ocean-bfs-no-visited`, nie ponawiano - dodane asercje nie moga cofnac zabicia), SURVIVED 2 (ekwiwalentne z dowodem: `erode-rank-rposition-EQUIV`, `neighbor-negate-both-EQUIV`).
- Dwa mutanty r1 z luka (`ring-no-*-clear`) ponowione: KILLED.

### Zalozenia (runda 2)

- ZAL-R2-1: zakres PORTOWANY 19 wierszy, stan bez zmian wzgledem r1 w kodzie symboli; zmiany tylko w testach i danych testowych.
- ZAL-R2-2: test-level watchdog nie jest dodawany (harness pomiarowy ma limit 240 s; zalecenie CI poza tematem).
- ZAL-R2-3: `set_hex_to_morze` (M04, `terrain_class.rs`) jest poza allowlista - jej testy nalezą do M04.

### Zalecenie (nie zmieniane w tym temacie)

- Regresja typu `ocean-bfs-no-visited` zawiesi test zamiast dac asercje. Zalecenie: krok CI z limitem czasu na `cargo test` (np. `timeout`). Nie wdrazane tutaj (poza allowlista).

## Wektory

- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A-LAD-MORZE-WYBRZEZE-A-Q1/gen-m06a-vectors.mjs`
  (uruchamia prawdziwy kod TS weba z `git archive edb8fb56 gra/src gra/data`, loader `m06a-loader-register.mjs`).
- Wynik: `rust-port/engine/tests/p6_m06a_vectors/web-vectors.json` (172 mapy: 14 specjalnych, 160 losowych z dziurami i kluczami poza prostokatem; seed 20261029).
- Mapy specjalne: pojedyncze heksy, pary, jezioro wewnetrzne, morze na krawedzi 3x3, sierota Wybrzeza, lancuch lad-wybrzeze-morze, skos bez sasiedztwa, wszystkie 8 terenow w rzedzie.

## Dryf po pinie (zakres 3186-4374)

`git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 8 hunkow (40 linii), wszystkie w liniach pin 5995-10807.
W zakresie 3186-4374: **brak zmian** (0 hunkow). Odswiezenie wektorow - osobny temat po R-RUSTPORT-REPIN-DELTA-Q1.

## Zalozenia (runda 1)

- Klucze heksow kanoniczne `"q,r"` (jak w M05A). Klucz niekanoniczny pomijany przy iteracji (`key_qr` -> None).
- Kolejnosc Object.keys/entries = kolejnosc wstawiania (`HexRecord`).
- Brak `Math.*` w podzbiorze rundy 1.
- Literaly danych (udzialy lądu, kolejnosc erozji) w `data/derived/mapgen-landsea.json`.

## Ograniczenia (do rundy 2 / pomiarow)

- Mutacje strukturalne i weryfikator niezalezny nie byly wykonane w tej rundzie (rola Operator-impl).
- Pomiar trafien wektorow na granicach (N-1/N/N+1) nie byl wykonany; granice pokrywaja mapy 1x1, 2x1, 1x3, 3x3 z krawedzia.
- Stale `Math.*` i pozostale 26 symboli: RUNDA-2.

## Pomiary rundy 1 (Operator-pomiary)

Pelny raport: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A-LAD-MORZE-WYBRZEZE-A-Q1/02-operator-pomiary-r1.md`.

- Weryfikator: regeneracja `web-vectors.json` z pinu `edb8fb56` daje identyczny plik (sha256 `07dfd5dc...`).
- Mutacje: 48 mutantow (`mut-runner-m06a.py`, `mutations-r1.log`): KILLED 43, TIMEOUT 1 (`ocean-bfs-no-visited`, nieskonczona petla), SURVIVED 4.
  - Ekwiwalentne z dowodem: `erode-rank-rposition-EQUIV` (brak duplikatow w kolejnosci erozji), `neighbor-negate-both-EQUIV` (HEX_DIRECTIONS domkniete na negacje).
  - LUKA: `ring-no-overlay-clear`, `ring-no-deposit-clear`. W wektorach zadne Morze nie ma nakladki ani zloza, wiec galezi czyszczenia w `applyCoastRing`/`applyDoubleCoastRing` nie sa pokryte. Wymagana poprawka w rundzie 2 (mapa specjalna z Morze przy lądzie z nakladka i zlozem, wektor z weba, asercja).
- Granice: prog `>0` dla wybrzeza pokryty przez `morze_n` 0/1/2 (2206/1681/1123 heksow); ocean-krawedzie: woda na q=0/1/W-2/W-1 i r=0/1/H-2/H-1 w 96-125 mapach kazda linia.
- Gate'y: fmt EXIT=0, clippy EXIT=0, test EXIT=0 (1224 passed, p6_m06a_landsea 10/10), `git diff --check` czysty.
- Dryf po pinie w zakresie 3186-4374: potwierdzony, 0 hunkow (8 hunkow w liniach 5992-10811).
- Status: FAIL (luka testowa w pierscieniu); dalsze symbole RUNDA-2 bez zmian.
- Aktualizacja (odeslanie): stan wierszy RUNDA-2 i domkniecie Pangei (`fillPangeaAnnularSeaCorridors`, `rebalanceLandFractionPangea`, `rebalanceLandSeaRatio`) - patrz `P6-M06A9-LAD-MORZE-PANGEA-FINAL.md`.
- Aktualizacja (runda 2 M06A9): zamknieta tabela symboli M06A (25 wierszy RUNDA-2 -> PORTOWANY / DANE-JUZ-W-RUST) i wpis "M06A KOMPLET: TAK" - patrz sekcja "Tabela M06A - runda 2" w `P6-M06A9-LAD-MORZE-PANGEA-FINAL.md`. Wiersze w powyzszej tabeli sa historycznym stanem rundy 1.
