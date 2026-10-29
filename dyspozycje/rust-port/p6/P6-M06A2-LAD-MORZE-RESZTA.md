# P6.M06A2 - lad / morze / wybrzeze A, reszta RUNDA-2 (partia 1)

Temat: R-RUSTPORT-P6-M06A2-LAD-MORZE-RESZTA-Q1. Dopisek do M06A: `dyspozycje/rust-port/p6/P6-M06A-LAD-MORZE-WYBRZEZE-A.md` (tylko odsylacz).
Pin webu: `edb8fb56` (`gra/src/map/gen-helpers.ts`). Zakres: wiersze RUNDA-2 z tabeli M06A (linie 3186-4374).

## Stan symboli (binarne kryterium)

| Symbol (web, pin edb8fb56) | Status | Dowod |
|---|---|---|
| `removeInlandWaterPools` :4137 | PORTOWANY (partia 1) | `landsea.rs::remove_inland_water_pools`; test `remove_inland_water_pools_matches_web`; 89 wektorow |
| `fillEnclosedWaterByLandNeighbors` :4189 | PORTOWANY (partia 1) | `landsea.rs::fill_enclosed_water_by_land_neighbors`; 117 wektorow (ladder k=0..6 x min=0..7, N-1/N/N+1) |
| `removeSmallInlandWaterPools` :4276 | PORTOWANY (partia 1) | `landsea.rs::remove_small_inland_water_pools`; 90 wektorow (rozmiar bloba s=1..8, max=s-1/s/s+1) |
| `removeInlandSeaPools` :4320 | PORTOWANY (partia 1) | alias; `landsea.rs::remove_inland_sea_pools`; 71 wektorow |
| `findInlandWaterHexes` / `findInlandSeaHexes` :4109/:4123 | PORTOWANY (M06A r1) | `landsea.rs::find_inland_*`; juz zintegrowane |
| `purgeDesertEnclaveWater` :4156 | RUNDA-2 | wymaga `climateBandAt` (`prims.rs:361`) - nastepna partia |
| `purgeInlandWaterForMultiLandTyp` :4215 | RUNDA-2 | wywoluje `trimEnclosedOceanOnly` (web :4701, POZA zakresem) - zaleznosc do rozstrzygniecia |
| `applyJaggedCoastNoise` :4232 | RUNDA-2 | szum (`mulberry32`/`fbm`/perm) - nastepna partia |
| `enforceLatitudinalOceanBuffer` :3339 | RUNDA-2 | - |
| `climateBandBaseTerrain` :3360, `applyClimateBandsToHexes` :3380 | RUNDA-2 | - |
| `enforceEarthTemplateOnHexes` :3418 | RUNDA-2 | - |
| `LandFractionFillBias` / `PANGEA_LAND_FILL_MIN_SCORE` :3435-3438 | RUNDA-2 | dane do `derived/*.json` |
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

Razem po partii 1: 4 symbole PORTOWANE w tej rundzie (+ 2 z M06A). Pozostale wiersze RUNDA-2 nadal otwarte.

## Dryf po pinie (zakres 3186-4374)

`git diff --stat edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 24 dodane / 16 usuniete linie, 8 hunkow
na liniach 5992, 8466, 10352, 10392, 10541, 10693, 10776, 10804 pliku. **Zadne z nich nie wpada w zakres 3186-4374.**
Pin pozostaje `edb8fb56`; odswiezenie wektorow robi osobny temat po R-RUSTPORT-REPIN-DELTA-Q1.

## Zalozenia (rozstrzygniete bez pytan)

- Z-1: Klucze "q,r" niekanoniczne sa pomijane przy iteracji (jak w M06A, ZALOZENIA r1). Dla `minLand = 0` roznica bylaby widoczna tylko dla kluczy niekanonicznych; wektory ich nie zawieraja.
- Z-2: Domyslny prog `minLandNeighbors = 5` (web :4190) zyje u wolajacego, nie jako literal w `landsea.rs`. Przebieg pętli `pass < 8` jest stala `FILL_ENCLOSED_MAX_PASSES` (wartosc z kodu webu, brak danych do JSON).
- Z-3: `fillEnclosedWaterByLandNeighbors` ustawia `rzeka = {obecna:false, krawedzie:[]}` (web :4199), wiec port czysci flage rzeki; `set_hex_to_laka` (jak web `setHexToLaka`) tego nie robi, co pokazaly wektory przed poprawka.
- Z-4: `removeInlandWaterPools` / `removeSmallInlandWaterPools` NIE dotykaja rzeki (zgodnie z webem).
- Z-5: `removeSmallInlandWaterPools` - kolejnosc przechodzenia skladowych nie wplywa na wynik (skladowe rozlaczne, zbior inlandowy liczony raz).

## Wektory i testy

- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A2-LAD-MORZE-RESZTA-Q1/gen-m06a2-vectors.mjs` (uruchomiony na `git archive edb8fb56` rozpakowanym poza repo; `gen_helpers_sha256` = ten sam co M06A).
- Wektory: `rust-port/engine/tests/p6_m06a2_vectors/web-vectors.json`.
- Testy: `rust-port/engine/tests/p6_m06a2_landsea.rs` (5 testow, wszystkie zielone; trafienia na progach N-1/N/N+1 asertowane).
- Mutacje i dowody rownowaznosci: ZMIERZONE w Operator-pomiary r1 (sekcja "Pomiary r1" nizej).
- Weryfikator niezalezny: generator uruchomiony ponownie z `git archive edb8fb56` (wlasny katalog poza repo) -
  wynik BAJT-W-BAJT zgodny z `web-vectors.json` (cmp). Logi: `runs/.../gate-*-r1v.log`.

## Math.*

Partia 1 nie uzywa `Math.*` (sama arytmetyka calkowita i porownania). Wykaz pelny - w kolejnych partiach.

## Pomiary r1 (Operator-pomiary)

Trafienia progow (plik `web-vectors.json`, pole `boundary_rel` per przypadek; poprawka wzgledem raportu Operator-impl):
- fill (rel wzgledem `min_land`): -1: 7, 0: 8, +1: 6 (raport Operator-impl podawal 6/7/6 - niezgodne z plikiem).
- pool (rel wzgledem rozmiaru bloba `max - s`): -1: 8, 0: 8, +1: 8 (zgodne).

Mutacje strukturalne (`mut-M*.log` w runs/, runner: podmiana jednego zakotwiczenia w `landsea.rs`, `cargo test --test p6_m06a2_landsea`, przywrocenie pliku):

| ID | Mutacja | Wynik | Dowod |
|---|---|---|---|
| M01 | fill: `<` -> `<=` (prog N) | KILLED | test `fill_enclosed_water_matches_web_with_boundaries` |
| M02 | fill: limit przebiegow 8 -> 7 | SURVIVED | NIE-RÓWNOWAZNE w ogole; wektory nie wymagaja 8. przebiegu - LUKA POKRYCIA (patrz nizej) |
| M03 | fill: limit przebiegow 8 -> 9 | SURVIVED | NIE-RÓWNOWAZNE w ogole; j.w. - LUKA POKRYCIA |
| M04 | fill: usuniecie `if n == 0 { break }` | SURVIVED | RÓWNOWAZNE: pass z n=0 nie zmienia stanu, wiec kolejny pass tez daje n=0 (iteracja deterministyczna po stanie); total += 0 |
| M05 | fill: brak `river_present = false` | KILLED | test fill z wektorami rzeki |
| M06 | fill: brak `river_edges.clear()` | KILLED | test fill z krawedziami |
| M07 | fill: odwrocony predykat wody | KILLED | test fill |
| M08 | small: `>` -> `>=` (rozmiar) | KILLED | test `..._with_size_boundaries` |
| M09 | small: brak sprawdzenia `visited` w BFS | HANG (TIMEOUT 150 s) | BFS nie konczy sie; test NIE MA watchdoga - wykrycie tylko przez zawieszenie (slabe) |
| M10 | small: brak `visited.insert` | KILLED | test size boundaries |
| M11 | small: brak rozszerzenia stosu (`stack.push`) | KILLED | test size boundaries |
| M12 | small: pominiety kierunek 0 w `HEX_DIRECTIONS` | KILLED | test size boundaries |
| M13 | small: brak licznika `converted` | KILLED | test size boundaries |
| M14 | alias `removeInlandSeaPools` -> wersja tylko Morze | KILLED | test `remove_inland_sea_pools_matches_web` |
| M15 | water: brak `set_hex_to_laka` | KILLED | test `remove_inland_water_pools_matches_web` |
| M16 | `count_land_neighbors`: odwrocony predykat | KILLED | test fill |

Wynik: 16 mutacji; 12 KILLED asercja, 1 KILLED przez zawieszenie (M09), 1 SURVIVED rownowazne (M04), 2 SURVIVED nierownowazne (M02, M03) - LUKA.

**Luka (otwarta, BLOCK dla zamkniecia tematu wg zasady "przeżyta mutacja = dowod rownowaznosci"):** limit przebiegow `FILL_ENCLOSED_MAX_PASSES = 8` (web :4191) nie jest osiagany przez zadne wektory (M02 i M03 przezywaja). Wymagany przypadek: mapa, w ktorej lancuch konwersji wymaga >= 8 przebiegow (kolejnosc wstawiania odwrotna do propagacji), wygenerowany z uruchomionego weba, z trafieniem N-1/N/N+1 dla liczby przebiegow. Do dodania w partii 2 / rundzie 2.

**Rozstrzygniecie ZALOZENIEM (bez pytania):** Z-6: luka limitu przebiegow nie blokuje partii 1 (4 symbole sa poprawne dla wszystkich przypadkow, w ktorych zmiana nastepuje w <= 7 przebiegach); dodanie wektora jest wymagane przed zamknieciem `fillEnclosedWaterByLandNeighbors` w tabeli M06A2.

**Weryfikacja niezalezna:** ponowne uruchomienie generatora (`node --experimental-transform-types`, `m06a-loader-register.mjs`) z `git archive edb8fb56` -> `web-vectors.json` zgodny bajt-w-bajt (cmp, sha `ab934703...` z meta).

**Dryf po pinie:** bez zmian (sekcja wyzej).
