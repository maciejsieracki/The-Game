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

Podsumowanie wierszy tabeli (wiersze, nie symbole 1:1): PORTOWANY funkcji 18; DANE (ERODE_TERRAIN_ORDER -> JSON) 1; DANE-JUZ-W-RUST 3 (`parseHexKey`, `setHexToMorze`, `setHexToLaka`); RUNDA-2 25 wierszy (w tym stale/typy `LandFractionFillBias`, `PANGEA_LAND_FILL_MIN_SCORE`). Liczbe 29 z dispatchu potwierdza weryfikator w rundzie pomiarowej.

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
